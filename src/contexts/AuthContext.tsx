import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  updateProfile,
  User,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { ensureCustomerProfile, getCustomerProfile } from '../services/userService';
import { resolveOrClaimAdminAccess } from '../services/adminService';
import type { AdminUser, CustomerProfile } from '../types';

interface AuthContextValue {
  user: User | null;
  customerProfile: CustomerProfile | null;
  adminUser: AdminUser | null;
  authReady: boolean;
  isAdmin: boolean;
  loginWithGoogle: (asAdmin?: boolean) => Promise<{ user: User; adminUser: AdminUser | null }>;
  loginWithEmail: (
    email: string,
    password: string,
    asAdmin?: boolean
  ) => Promise<{ user: User; adminUser: AdminUser | null }>;
  registerCustomer: (name: string, email: string, password: string) => Promise<User>;
  registerAdminEmail: (name: string, email: string, password: string) => Promise<User>;
  sendVerificationEmail: () => Promise<void>;
  reloadAndRefreshAdmin: () => Promise<AdminUser | null>;
  updateUserPassword: (newPassword: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshAdmin: () => Promise<AdminUser | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function mapAuthError(err: any): Error {
  const code = err?.code || '';
  if (code === 'auth/operation-not-allowed') {
    return new Error(
      'Email/Password sign-in is not yet enabled in Firebase Authentication Console. Use Google Sign-In or enable Email/Password under Firebase Console → Authentication → Sign-in method.'
    );
  }
  if (code === 'auth/email-already-in-use') {
    return new Error('An account with this email already exists. Please sign in instead.');
  }
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return new Error('Invalid email or password.');
  }
  if (code === 'auth/weak-password') {
    return new Error('Password must be at least 6 characters.');
  }
  if (code === 'auth/popup-closed-by-user') {
    return new Error('Sign-in popup was closed before completion.');
  }
  return new Error(err?.message || 'Authentication failed.');
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const syncUserState = useCallback(async (firebaseUser: User | null) => {
    if (!firebaseUser) {
      setCustomerProfile(null);
      setAdminUser(null);
      return;
    }

    try {
      const profile = await ensureCustomerProfile(
        firebaseUser.uid,
        firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Customer',
        firebaseUser.email || ''
      );
      setCustomerProfile(profile);
    } catch (err) {
      console.error('Failed to sync customer profile:', err);
    }

    try {
      const adm = await resolveOrClaimAdminAccess({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        emailVerified: firebaseUser.emailVerified,
        displayName: firebaseUser.displayName,
      });
      setAdminUser(adm);
    } catch (err) {
      console.error('Admin check:', err);
      setAdminUser(null);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      await syncUserState(firebaseUser);
      setAuthReady(true);
    });
    return () => unsub();
  }, [syncUserState]);

  const loginWithGoogle = useCallback(async () => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      await ensureCustomerProfile(
        cred.user.uid,
        cred.user.displayName || 'Customer',
        cred.user.email || ''
      );
      const adm = await resolveOrClaimAdminAccess({
        uid: cred.user.uid,
        email: cred.user.email,
        emailVerified: cred.user.emailVerified,
        displayName: cred.user.displayName,
      });
      setAdminUser(adm);
      const profile = await getCustomerProfile(cred.user.uid);
      setCustomerProfile(profile);
      return { user: cred.user, adminUser: adm };
    } catch (err) {
      throw mapAuthError(err);
    }
  }, []);

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const profile = await ensureCustomerProfile(
        cred.user.uid,
        cred.user.displayName || email.split('@')[0],
        cred.user.email || email
      );
      setCustomerProfile(profile);
      const adm = await resolveOrClaimAdminAccess({
        uid: cred.user.uid,
        email: cred.user.email,
        emailVerified: cred.user.emailVerified,
        displayName: cred.user.displayName,
      });
      setAdminUser(adm);
      return { user: cred.user, adminUser: adm };
    } catch (err) {
      throw mapAuthError(err);
    }
  }, []);

  const registerCustomer = useCallback(async (name: string, email: string, password: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(cred.user, { displayName: name.trim() });
      const profile = await ensureCustomerProfile(cred.user.uid, name.trim(), email.trim());
      setCustomerProfile(profile);
      return cred.user;
    } catch (err) {
      throw mapAuthError(err);
    }
  }, []);

  const registerAdminEmail = useCallback(async (name: string, email: string, password: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (name.trim()) {
        await updateProfile(cred.user, { displayName: name.trim() });
      }
      await sendEmailVerification(cred.user);
      return cred.user;
    } catch (err) {
      throw mapAuthError(err);
    }
  }, []);

  const sendVerificationEmail = useCallback(async () => {
    if (!auth.currentUser) throw new Error('No active session.');
    try {
      await sendEmailVerification(auth.currentUser);
    } catch (err) {
      throw mapAuthError(err);
    }
  }, []);

  const reloadAndRefreshAdmin = useCallback(async () => {
    if (!auth.currentUser) return null;
    await auth.currentUser.reload();
    setUser(auth.currentUser);
    const adm = await resolveOrClaimAdminAccess({
      uid: auth.currentUser.uid,
      email: auth.currentUser.email,
      emailVerified: auth.currentUser.emailVerified,
      displayName: auth.currentUser.displayName,
    });
    setAdminUser(adm);
    return adm;
  }, []);

  const updateUserPassword = useCallback(async (newPassword: string) => {
    if (!auth.currentUser) throw new Error('Please sign in first.');
    try {
      await updatePassword(auth.currentUser, newPassword);
    } catch (err: any) {
      if (err?.code === 'auth/requires-recent-login') {
        throw new Error(
          'For security, please sign out and sign in again before changing your password.'
        );
      }
      throw mapAuthError(err);
    }
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err) {
      throw mapAuthError(err);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!auth.currentUser) return;
    const profile = await getCustomerProfile(auth.currentUser.uid);
    setCustomerProfile(profile);
  }, []);

  const refreshAdmin = useCallback(async () => {
    if (!auth.currentUser) return null;
    const adm = await resolveOrClaimAdminAccess({
      uid: auth.currentUser.uid,
      email: auth.currentUser.email,
      emailVerified: auth.currentUser.emailVerified,
      displayName: auth.currentUser.displayName,
    });
    setAdminUser(adm);
    return adm;
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setCustomerProfile(null);
    setAdminUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        customerProfile,
        adminUser,
        authReady,
        isAdmin: Boolean(adminUser && adminUser.active),
        loginWithGoogle,
        loginWithEmail,
        registerCustomer,
        registerAdminEmail,
        sendVerificationEmail,
        reloadAndRefreshAdmin,
        updateUserPassword,
        sendPasswordReset,
        refreshProfile,
        refreshAdmin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
