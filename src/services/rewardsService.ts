import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { generateId } from '../lib/utils';
import type {
  CoinActivity,
  CoinActivityType,
  CustomerProfile,
  ReferralCommission,
  ReferralProfile,
  RewardsSettingsData,
  SavedAddress,
} from '../types';

export function getTodayDateKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getYesterdayDateKey(): string {
  const d = new Date(Date.now() - 86400000);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function generateReferralCode(uid: string): string {
  const cleanUid = uid.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4) || 'USER';
  const rand = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4).padEnd(4, '9');
  return `ASW${cleanUid}${rand}`;
}

export async function resolveReferralCode(code: string): Promise<ReferralProfile | null> {
  const clean = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  if (!clean) return null;
  try {
    const snap = await getDoc(doc(db, 'referralProfiles', clean));
    if (!snap.exists()) return null;
    return snap.data() as ReferralProfile;
  } catch {
    return null;
  }
}

export async function ensureUserReferralProfile(
  uid: string,
  displayName: string,
  existingCode?: string
): Promise<string> {
  const code = existingCode && existingCode.trim().length >= 3
    ? existingCode.trim().toUpperCase()
    : generateReferralCode(uid);

  const refProfileRef = doc(db, 'referralProfiles', code);
  try {
    const existingSnap = await getDoc(refProfileRef);
    if (!existingSnap.exists()) {
      await setDoc(refProfileRef, {
        code,
        ownerUid: uid,
        displayName: (displayName || 'AS World Member').trim().slice(0, 120),
        createdAt: serverTimestamp(),
      });
    }
    if (!existingCode) {
      const userRef = doc(db, 'users', uid);
      const uSnap = await getDoc(userRef);
      if (uSnap.exists()) {
        await updateDoc(userRef, {
          referralCode: code,
          updatedAt: serverTimestamp(),
        });
      }
    }
    return code;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `referralProfiles/${code}`);
  }
}

export async function playGameOrClaimBonus(
  uid: string,
  params: {
    activityType: CoinActivityType;
    coinsAwarded: number;
    description: string;
    cooldownField?:
      | 'lastCheckInDate'
      | 'lastSpinDate'
      | 'lastGiftTapDate'
      | 'lastScratchDate'
      | 'lastDiceDate'
      | 'lastMemoryDate';
    updateStreak?: boolean;
  }
): Promise<{ newCoins: number; checkInStreak: number }> {
  const today = getTodayDateKey();
  const yesterday = getYesterdayDateKey();
  const cleanAward = Math.min(5000, Math.max(1, Math.round(params.coinsAwarded)));
  const entryId = generateId('coin');
  const path = `users/${uid}`;

  try {
    return await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users', uid);
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) {
        throw new Error('Please complete signing in before claiming coins.');
      }
      const userData = userSnap.data() as CustomerProfile;
      if (params.cooldownField && userData[params.cooldownField] === today) {
        throw new Error('You already claimed today’s reward for this activity. Come back tomorrow!');
      }

      const prevCoins = Math.max(0, Number(userData.coins) || 0);
      const prevTotal = Math.max(0, Number(userData.totalCoinsEarned) || 0);
      const newCoins = prevCoins + cleanAward;
      const newTotal = prevTotal + cleanAward;

      let nextStreak = Math.max(0, Number(userData.checkInStreak) || 0);
      if (params.updateStreak) {
        nextStreak = userData.lastCheckInDate === yesterday ? Math.min(365, nextStreak + 1) : 1;
      }

      const updates: Record<string, any> = {
        coins: newCoins,
        totalCoinsEarned: newTotal,
        updatedAt: serverTimestamp(),
      };
      if (params.cooldownField) {
        updates[params.cooldownField] = today;
      }
      if (params.updateStreak) {
        updates.checkInStreak = nextStreak;
      }

      transaction.update(userRef, updates);
      transaction.set(doc(db, 'users', uid, 'coinHistory', entryId), {
        type: params.activityType,
        amount: cleanAward,
        description: params.description.slice(0, 200),
        createdAt: serverTimestamp(),
      });

      return { newCoins, checkInStreak: nextStreak };
    });
  } catch (error) {
    if (error instanceof Error && !error.message.includes('Missing or insufficient permissions')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function claimShareBonus(
  uid: string,
  rewardsSettings: RewardsSettingsData,
  label = 'Shared AS World link'
): Promise<{ awarded: number; newCoins: number; dailySharesCount: number }> {
  const today = getTodayDateKey();
  const maxDaily = Math.max(1, Number(rewardsSettings.maxDailyShares) || 5);
  const bonus = Math.min(500, Math.max(1, Math.round(rewardsSettings.shareBonusCoins || 15)));
  const entryId = generateId('coin');
  const path = `users/${uid}`;

  try {
    return await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users', uid);
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) {
        throw new Error('Sign in to earn AS Coins when sharing.');
      }
      const userData = userSnap.data() as CustomerProfile;
      const prevCount =
        userData.lastShareDate === today ? Math.max(0, Number(userData.dailySharesCount) || 0) : 0;

      if (prevCount >= maxDaily) {
        return {
          awarded: 0,
          newCoins: Math.max(0, Number(userData.coins) || 0),
          dailySharesCount: prevCount,
        };
      }

      const prevCoins = Math.max(0, Number(userData.coins) || 0);
      const prevTotal = Math.max(0, Number(userData.totalCoinsEarned) || 0);
      const newCoins = prevCoins + bonus;

      transaction.update(userRef, {
        coins: newCoins,
        totalCoinsEarned: prevTotal + bonus,
        lastShareDate: today,
        dailySharesCount: prevCount + 1,
        updatedAt: serverTimestamp(),
      });

      transaction.set(doc(db, 'users', uid, 'coinHistory', entryId), {
        type: 'share_bonus',
        amount: bonus,
        description: `${label} (+${bonus} Coins)`.slice(0, 200),
        createdAt: serverTimestamp(),
      });

      return { awarded: bonus, newCoins, dailySharesCount: prevCount + 1 };
    });
  } catch (error) {
    if (error instanceof Error && !error.message.includes('Missing or insufficient permissions')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function listUserCoinHistory(uid: string): Promise<CoinActivity[]> {
  const path = `users/${uid}/coinHistory`;
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CoinActivity, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function listUserReferrals(uid: string): Promise<ReferralCommission[]> {
  const path = 'referrals';
  try {
    const q = query(collection(db, path), where('referrerUid', '==', uid));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<ReferralCommission, 'id'>) }))
      .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function claimPendingReferralCommissions(uid: string): Promise<number> {
  try {
    const q = query(
      collection(db, 'referrals'),
      where('referrerUid', '==', uid),
      where('status', '==', 'pending')
    );
    const snap = await getDocs(q);
    if (snap.empty) return 0;

    let totalCredited = 0;
    const pendingList = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<ReferralCommission, 'id'>),
    }));

    const batch = writeBatch(db);
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return 0;
    const userData = userSnap.data() as CustomerProfile;
    const prevCoins = Math.max(0, Number(userData.coins) || 0);
    const prevTotal = Math.max(0, Number(userData.totalCoinsEarned) || 0);

    for (const refItem of pendingList) {
      const coins = Math.max(0, Math.round(Number(refItem.commissionCoins) || 0));
      totalCredited += coins;
      batch.update(doc(db, 'referrals', refItem.id), {
        status: 'credited',
        updatedAt: serverTimestamp(),
      });
      if (coins > 0) {
        const entryId = generateId('coin');
        batch.set(doc(db, 'users', uid, 'coinHistory', entryId), {
          type: 'referral_commission',
          amount: coins,
          description: `${refItem.commissionPct}% commission from referral order ${refItem.orderNumber}`.slice(
            0,
            200
          ),
          createdAt: serverTimestamp(),
        });
      }
    }

    if (totalCredited > 0) {
      batch.update(userRef, {
        coins: prevCoins + Math.min(5000, totalCredited),
        totalCoinsEarned: prevTotal + totalCredited,
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
    return totalCredited;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `referrals`);
  }
}

// =========================================================
// Saved Multi-Address Book
// =========================================================
export async function listSavedAddresses(uid: string): Promise<SavedAddress[]> {
  const path = `users/${uid}/addresses`;
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<SavedAddress, 'id'>) }))
      .sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveCustomerAddress(
  uid: string,
  data: Omit<SavedAddress, 'id' | 'createdAt' | 'updatedAt'>,
  existingId?: string
): Promise<string> {
  const id = existingId || generateId('addr');
  const path = `users/${uid}/addresses/${id}`;
  try {
    const existingAll = await listSavedAddresses(uid);
    const shouldBeDefault = data.isDefault || existingAll.length === 0;

    const batch = writeBatch(db);
    if (shouldBeDefault) {
      for (const addr of existingAll) {
        if (addr.id !== id && addr.isDefault) {
          batch.update(doc(db, 'users', uid, 'addresses', addr.id), {
            isDefault: false,
            updatedAt: serverTimestamp(),
          });
        }
      }
    }

    const payload = {
      label: (data.label || 'Home').trim().slice(0, 40),
      recipientName: data.recipientName.trim().slice(0, 120),
      phone: data.phone.trim().slice(0, 30),
      district: data.district.trim().slice(0, 80),
      city: data.city.trim().slice(0, 80),
      area: data.area.trim().slice(0, 120),
      address: data.address.trim().slice(0, 500),
      isDefault: shouldBeDefault,
      updatedAt: serverTimestamp(),
    };

    const ref = doc(db, 'users', uid, 'addresses', id);
    if (existingId) {
      const oldSnap = await getDoc(ref);
      batch.update(ref, {
        ...payload,
        createdAt: oldSnap.exists() ? oldSnap.data().createdAt : serverTimestamp(),
      });
    } else {
      batch.set(ref, {
        ...payload,
        createdAt: serverTimestamp(),
      });
    }

    await batch.commit();
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCustomerAddress(uid: string, addressId: string): Promise<void> {
  const path = `users/${uid}/addresses/${addressId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'addresses', addressId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function setDefaultCustomerAddress(uid: string, addressId: string): Promise<void> {
  const path = `users/${uid}/addresses/${addressId}`;
  try {
    const all = await listSavedAddresses(uid);
    const batch = writeBatch(db);
    for (const addr of all) {
      if (addr.id === addressId) {
        batch.update(doc(db, 'users', uid, 'addresses', addr.id), {
          isDefault: true,
          updatedAt: serverTimestamp(),
        });
      } else if (addr.isDefault) {
        batch.update(doc(db, 'users', uid, 'addresses', addr.id), {
          isDefault: false,
          updatedAt: serverTimestamp(),
        });
      }
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function computeCoinsBdtValue(coins: number, settings: RewardsSettingsData): number {
  const safeCoins = Math.max(0, coins);
  const unit = Math.max(1, settings.coinsUnit || 100);
  const taka = Math.max(0, settings.takaPerUnit || 10);
  return Math.floor((safeCoins / unit) * taka);
}
