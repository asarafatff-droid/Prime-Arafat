import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { generateId } from '../lib/utils';
import type { AdminInvite, AdminRole, AdminUser, CustomerProfile } from '../types';

export const BOOTSTRAPPED_ADMIN_EMAIL = 'primearafat456@gmail.com';

export async function getAdminUser(uid: string): Promise<AdminUser | null> {
  const path = `admins/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'admins', uid));
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as Omit<AdminUser, 'id'>) };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function resolveOrClaimAdminAccess(params: {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
}): Promise<AdminUser | null> {
  if (!params.email || !params.emailVerified) {
    return null;
  }

  // 1. Check existing admin document
  const existing = await getAdminUser(params.uid);
  if (existing && existing.active) {
    return existing;
  }

  // 2. Check if bootstrapped owner email -> auto-provision super_admin document
  if (params.email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()) {
    const path = `admins/${params.uid}`;
    try {
      await setDoc(doc(db, 'admins', params.uid), {
        uid: params.uid,
        email: params.email,
        name: params.displayName || 'AS World Super Admin',
        role: 'super_admin' as AdminRole,
        active: true,
        createdBy: 'system_bootstrap',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return await getAdminUser(params.uid);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  // 3. Check if user has an active admin invite for their verified email
  try {
    const inviteQuery = query(
      collection(db, 'adminInvites'),
      where('email', '==', params.email.toLowerCase())
    );
    const inviteSnap = await getDocs(inviteQuery);
    const activeInvite = inviteSnap.docs.find((d) => d.data().active === true);
    if (activeInvite) {
      const invData = activeInvite.data();
      await setDoc(doc(db, 'admins', params.uid), {
        uid: params.uid,
        email: params.email,
        name: params.displayName || params.email.split('@')[0],
        role: invData.role as AdminRole,
        active: true,
        createdBy: invData.createdBy || 'invite',
        createdViaInviteId: activeInvite.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return await getAdminUser(params.uid);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'adminInvites');
  }

  return null;
}

export async function listAdmins(): Promise<AdminUser[]> {
  const path = 'admins';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AdminUser, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function updateAdminUser(
  adminId: string,
  updates: { name?: string; role?: AdminRole; active?: boolean }
): Promise<void> {
  const path = `admins/${adminId}`;
  try {
    const snap = await getDoc(doc(db, 'admins', adminId));
    if (!snap.exists()) throw new Error('Admin user not found.');
    const prev = snap.data() as Omit<AdminUser, 'id'>;
    await updateDoc(doc(db, 'admins', adminId), {
      ...prev,
      name: updates.name !== undefined ? updates.name.trim() : prev.name,
      role: updates.role !== undefined ? updates.role : prev.role,
      active: updates.active !== undefined ? updates.active : prev.active,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteAdminUser(adminId: string): Promise<void> {
  const path = `admins/${adminId}`;
  try {
    await deleteDoc(doc(db, 'admins', adminId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function listAdminInvites(): Promise<AdminInvite[]> {
  const path = 'adminInvites';
  try {
    const snap = await getDocs(query(collection(db, path), orderBy('createdAt', 'desc')));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AdminInvite, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createAdminInvite(
  email: string,
  role: AdminRole,
  createdByUid: string
): Promise<string> {
  const id = generateId('inv');
  const path = `adminInvites/${id}`;
  try {
    await setDoc(doc(db, 'adminInvites', id), {
      email: email.trim().toLowerCase(),
      role,
      active: true,
      createdBy: createdByUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function revokeAdminInvite(inviteId: string): Promise<void> {
  const path = `adminInvites/${inviteId}`;
  try {
    await deleteDoc(doc(db, 'adminInvites', inviteId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function listAllCustomers(): Promise<CustomerProfile[]> {
  const path = 'users';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CustomerProfile, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function exportFullBackupJson(): Promise<Record<string, unknown>> {
  const collectionsToExport = [
    'categories',
    'subcategories',
    'products',
    'orders',
    'banners',
    'flashSales',
    'coupons',
    'discounts',
    'reviews',
    'settings',
    'users',
    'admins',
  ];

  const backup: Record<string, unknown> = {
    exportedAt: new Date().toISOString(),
    platform: 'AS World',
    collections: {},
  };

  const resultCols: Record<string, any[]> = {};
  for (const colName of collectionsToExport) {
    try {
      const snap = await getDocs(collection(db, colName));
      resultCols[colName] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, colName);
    }
  }
  backup.collections = resultCols;
  return backup;
}
