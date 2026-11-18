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
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { generateId } from '../lib/utils';
import type {
  CartItem,
  ContactMessage,
  CustomerProfile,
  Product,
  Review,
  WishlistItem,
} from '../types';

import {
  clearPendingReferralCode,
  getPendingReferralCode,
} from '../lib/searchHistory';
import {
  ensureUserReferralProfile,
  generateReferralCode,
  resolveReferralCode,
} from './rewardsService';

// =========================================================
// Customer Profile
// =========================================================
export async function getCustomerProfile(uid: string): Promise<CustomerProfile | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as Omit<CustomerProfile, 'id'>) };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function ensureCustomerProfile(
  uid: string,
  name: string,
  email: string
): Promise<CustomerProfile> {
  const path = `users/${uid}`;
  try {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const existing = { id: snap.id, ...(snap.data() as Omit<CustomerProfile, 'id'>) };
      if (!existing.referralCode) {
        const code = await ensureUserReferralProfile(uid, existing.name || name);
        existing.referralCode = code;
      }
      return existing;
    }

    const cleanName = (name || 'Customer').trim();
    const myRefCode = generateReferralCode(uid);
    let referredByCode = '';
    let referredByUid = '';

    const pendingRef = getPendingReferralCode();
    if (pendingRef && pendingRef !== myRefCode) {
      const refProfile = await resolveReferralCode(pendingRef);
      if (refProfile && refProfile.ownerUid && refProfile.ownerUid !== uid) {
        referredByCode = refProfile.code;
        referredByUid = refProfile.ownerUid;
      }
      clearPendingReferralCode();
    }

    const payload: Record<string, any> = {
      uid,
      name: cleanName,
      email: (email || '').trim(),
      phone: '',
      district: '',
      city: '',
      area: '',
      address: '',
      coins: 0,
      totalCoinsEarned: 0,
      checkInStreak: 0,
      referralCode: myRefCode,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (referredByCode && referredByUid) {
      payload.referredByCode = referredByCode;
      payload.referredByUid = referredByUid;
    }

    await setDoc(ref, payload);
    await ensureUserReferralProfile(uid, cleanName, myRefCode);
    const created = await getDoc(ref);
    return { id: created.id, ...(created.data() as Omit<CustomerProfile, 'id'>) };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateCustomerProfile(
  uid: string,
  updates: Partial<Omit<CustomerProfile, 'id' | 'uid' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const path = `users/${uid}`;
  try {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Customer profile not found.');
    const prev = snap.data() as Omit<CustomerProfile, 'id'>;
    await updateDoc(ref, {
      uid,
      name: updates.name !== undefined ? updates.name.trim() : prev.name,
      email: updates.email !== undefined ? updates.email.trim() : prev.email || '',
      phone: updates.phone !== undefined ? updates.phone.trim() : prev.phone || '',
      district: updates.district !== undefined ? updates.district.trim() : prev.district || '',
      city: updates.city !== undefined ? updates.city.trim() : prev.city || '',
      area: updates.area !== undefined ? updates.area.trim() : prev.area || '',
      address: updates.address !== undefined ? updates.address.trim() : prev.address || '',
      createdAt: prev.createdAt,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// =========================================================
// Persistent Shopping Cart
// =========================================================
export async function listCartItems(uid: string): Promise<CartItem[]> {
  const path = `users/${uid}/cart`;
  try {
    const snap = await getDocs(collection(db, 'users', uid, 'cart'));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CartItem, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function upsertCartItem(
  uid: string,
  productId: string,
  quantityDelta: number,
  selectedColor = '',
  selectedSize = ''
): Promise<void> {
  const safeVariantKey = `${productId}_${selectedColor || 'default'}_${selectedSize || 'default'}`
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 120);
  const path = `users/${uid}/cart/${safeVariantKey}`;
  try {
    const ref = doc(db, 'users', uid, 'cart', safeVariantKey);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const prev = snap.data() as Omit<CartItem, 'id'>;
      const nextQty = Math.min(99, Math.max(1, prev.quantity + quantityDelta));
      await updateDoc(ref, {
        quantity: nextQty,
        selectedColor: selectedColor || prev.selectedColor || '',
        selectedSize: selectedSize || prev.selectedSize || '',
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        productId,
        quantity: Math.min(99, Math.max(1, quantityDelta)),
        selectedColor: selectedColor || '',
        selectedSize: selectedSize || '',
        addedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function setCartItemQuantity(uid: string, itemId: string, quantity: number): Promise<void> {
  const path = `users/${uid}/cart/${itemId}`;
  try {
    if (quantity <= 0) {
      await deleteDoc(doc(db, 'users', uid, 'cart', itemId));
      return;
    }
    await updateDoc(doc(db, 'users', uid, 'cart', itemId), {
      quantity: Math.min(99, Math.max(1, Math.round(quantity))),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function removeCartItem(uid: string, itemId: string): Promise<void> {
  const path = `users/${uid}/cart/${itemId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'cart', itemId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// =========================================================
// Persistent Wishlist
// =========================================================
export async function listWishlistItems(uid: string): Promise<WishlistItem[]> {
  const path = `users/${uid}/wishlist`;
  try {
    const snap = await getDocs(collection(db, 'users', uid, 'wishlist'));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<WishlistItem, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function toggleWishlistItem(uid: string, productId: string, isCurrentlyWishlisted: boolean): Promise<void> {
  const path = `users/${uid}/wishlist/${productId}`;
  try {
    const ref = doc(db, 'users', uid, 'wishlist', productId);
    if (isCurrentlyWishlisted) {
      await deleteDoc(ref);
    } else {
      await setDoc(ref, {
        productId,
        addedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// =========================================================
// Verified Purchase Reviews
// =========================================================
export async function listApprovedProductReviews(productId: string): Promise<Review[]> {
  const path = 'reviews';
  try {
    const q = query(
      collection(db, path),
      where('productId', '==', productId),
      where('status', '==', 'approved')
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<Review, 'id'>) }))
      .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function submitVerifiedReview(params: {
  productId: string;
  userId: string;
  userName: string;
  orderId: string;
  rating: number;
  comment: string;
}): Promise<string> {
  const reviewId = generateId('rev');
  const path = `reviews/${reviewId}`;
  const cleanRating = Math.min(5, Math.max(1, Math.round(params.rating)));

  try {
    await runTransaction(db, async (transaction) => {
      const prodRef = doc(db, 'products', params.productId);
      const prodSnap = await transaction.get(prodRef);
      if (!prodSnap.exists()) throw new Error('Product not found.');
      const prod = prodSnap.data() as Omit<Product, 'id'>;

      const prevCount = prod.ratingCount || 0;
      const prevAvg = prod.ratingAvg || 0;
      const nextCount = prevCount + 1;
      const nextAvg = Math.round(((prevAvg * prevCount + cleanRating) / nextCount) * 100) / 100;

      transaction.set(doc(db, 'reviews', reviewId), {
        productId: params.productId,
        userId: params.userId,
        userName: params.userName.trim() || 'Verified Buyer',
        orderId: params.orderId,
        rating: cleanRating,
        comment: params.comment.trim(),
        verifiedPurchase: true,
        status: 'approved',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      transaction.update(prodRef, {
        ratingAvg: nextAvg,
        ratingCount: nextCount,
        updatedAt: serverTimestamp(),
      });
    });

    return reviewId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function listAllReviewsForAdmin(): Promise<Review[]> {
  const path = 'reviews';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Review, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function moderateReview(
  reviewId: string,
  status: 'approved' | 'pending' | 'rejected'
): Promise<void> {
  const path = `reviews/${reviewId}`;
  try {
    await updateDoc(doc(db, 'reviews', reviewId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteReview(reviewId: string): Promise<void> {
  const path = `reviews/${reviewId}`;
  try {
    await deleteDoc(doc(db, 'reviews', reviewId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// =========================================================
// Contact Us Messages
// =========================================================
export async function submitContactMessage(params: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  userId?: string;
}): Promise<string> {
  const id = generateId('msg');
  const path = `contactMessages/${id}`;
  try {
    await setDoc(doc(db, 'contactMessages', id), {
      name: params.name.trim(),
      email: params.email.trim(),
      phone: params.phone?.trim() || '',
      subject: params.subject.trim(),
      message: params.message.trim(),
      userId: params.userId || '',
      status: 'new',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function listContactMessages(): Promise<ContactMessage[]> {
  const path = 'contactMessages';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ContactMessage, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function updateContactMessageStatus(
  id: string,
  status: 'new' | 'read' | 'resolved'
): Promise<void> {
  const path = `contactMessages/${id}`;
  try {
    await updateDoc(doc(db, 'contactMessages', id), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
