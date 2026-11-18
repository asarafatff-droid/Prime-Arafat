import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { generateId } from '../lib/utils';
import type { Banner, BannerPlacement, Coupon, DiscountRule, FlashSale, FlashSaleItem } from '../types';

// =========================================================
// Banners
// =========================================================
export interface BannerInput {
  title: string;
  description?: string;
  discountText?: string;
  accentColor?: string;
  placement: BannerPlacement;
  desktopImageUrl?: string;
  mobileImageUrl?: string;
  linkUrl?: string;
  displayOrder: number;
  active: boolean;
  startDate?: string;
  endDate?: string;
}

export async function listBanners(onlyActive = false): Promise<Banner[]> {
  const path = 'banners';
  try {
    const q = onlyActive
      ? query(collection(db, path), where('active', '==', true))
      : query(collection(db, path));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<Banner, 'id'>) }))
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createBanner(input: BannerInput): Promise<string> {
  const id = generateId('ban');
  const path = `banners/${id}`;
  try {
    await setDoc(doc(db, 'banners', id), {
      title: input.title.trim(),
      description: input.description?.trim() || '',
      discountText: input.discountText?.trim() || '',
      accentColor: input.accentColor?.trim() || '',
      placement: input.placement,
      desktopImageUrl: input.desktopImageUrl?.trim() || '',
      mobileImageUrl: input.mobileImageUrl?.trim() || '',
      linkUrl: input.linkUrl?.trim() || '',
      displayOrder: Math.max(0, Math.round(Number(input.displayOrder) || 0)),
      active: Boolean(input.active),
      startDate: input.startDate || '',
      endDate: input.endDate || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateBanner(id: string, input: Partial<BannerInput>): Promise<void> {
  const path = `banners/${id}`;
  try {
    const snap = await getDoc(doc(db, 'banners', id));
    if (!snap.exists()) throw new Error('Banner not found.');
    const prev = snap.data() as Omit<Banner, 'id'>;
    await updateDoc(doc(db, 'banners', id), {
      title: input.title !== undefined ? input.title.trim() : prev.title,
      description:
        input.description !== undefined ? input.description.trim() : prev.description || '',
      discountText:
        input.discountText !== undefined ? input.discountText.trim() : prev.discountText || '',
      accentColor:
        input.accentColor !== undefined ? input.accentColor.trim() : prev.accentColor || '',
      placement: input.placement !== undefined ? input.placement : prev.placement,
      desktopImageUrl:
        input.desktopImageUrl !== undefined ? input.desktopImageUrl.trim() : prev.desktopImageUrl || '',
      mobileImageUrl:
        input.mobileImageUrl !== undefined ? input.mobileImageUrl.trim() : prev.mobileImageUrl || '',
      linkUrl: input.linkUrl !== undefined ? input.linkUrl.trim() : prev.linkUrl || '',
      displayOrder:
        input.displayOrder !== undefined
          ? Math.max(0, Math.round(Number(input.displayOrder) || 0))
          : prev.displayOrder,
      active: input.active !== undefined ? Boolean(input.active) : prev.active,
      startDate: input.startDate !== undefined ? input.startDate : prev.startDate || '',
      endDate: input.endDate !== undefined ? input.endDate : prev.endDate || '',
      createdAt: prev.createdAt,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteBanner(id: string): Promise<void> {
  const path = `banners/${id}`;
  try {
    await deleteDoc(doc(db, 'banners', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// =========================================================
// Flash Sales
// =========================================================
export interface FlashSaleInput {
  title: string;
  subtitle?: string;
  bannerImageUrl?: string;
  startDate: string;
  endDate: string;
  active: boolean;
  items: FlashSaleItem[];
}

export async function listFlashSales(onlyActive = false): Promise<FlashSale[]> {
  const path = 'flashSales';
  try {
    const q = onlyActive
      ? query(collection(db, path), where('active', '==', true))
      : query(collection(db, path));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<FlashSale, 'id'>) }))
      .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createFlashSale(input: FlashSaleInput): Promise<string> {
  const id = generateId('fs');
  const path = `flashSales/${id}`;
  try {
    await setDoc(doc(db, 'flashSales', id), {
      title: input.title.trim(),
      subtitle: input.subtitle?.trim() || '',
      bannerImageUrl: input.bannerImageUrl?.trim() || '',
      startDate: input.startDate,
      endDate: input.endDate,
      active: Boolean(input.active),
      items: (input.items || []).slice(0, 50),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateFlashSale(id: string, input: Partial<FlashSaleInput>): Promise<void> {
  const path = `flashSales/${id}`;
  try {
    const snap = await getDoc(doc(db, 'flashSales', id));
    if (!snap.exists()) throw new Error('Flash sale not found.');
    const prev = snap.data() as Omit<FlashSale, 'id'>;
    await updateDoc(doc(db, 'flashSales', id), {
      title: input.title !== undefined ? input.title.trim() : prev.title,
      subtitle: input.subtitle !== undefined ? input.subtitle.trim() : prev.subtitle || '',
      bannerImageUrl:
        input.bannerImageUrl !== undefined ? input.bannerImageUrl.trim() : prev.bannerImageUrl || '',
      startDate: input.startDate !== undefined ? input.startDate : prev.startDate,
      endDate: input.endDate !== undefined ? input.endDate : prev.endDate,
      active: input.active !== undefined ? Boolean(input.active) : prev.active,
      items: input.items !== undefined ? input.items.slice(0, 50) : prev.items || [],
      createdAt: prev.createdAt,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteFlashSale(id: string): Promise<void> {
  const path = `flashSales/${id}`;
  try {
    await deleteDoc(doc(db, 'flashSales', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// =========================================================
// Coupons
// =========================================================
export interface CouponInput {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  expiryDate?: string;
  usageLimit: number;
  active: boolean;
}

export async function listCoupons(onlyActive = false): Promise<Coupon[]> {
  const path = 'coupons';
  try {
    const q = onlyActive
      ? query(collection(db, path), where('active', '==', true))
      : query(collection(db, path));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<Coupon, 'id'>) }))
      .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createCoupon(input: CouponInput): Promise<string> {
  const id = generateId('cpn');
  const path = `coupons/${id}`;
  try {
    await setDoc(doc(db, 'coupons', id), {
      code: input.code.trim().toUpperCase(),
      discountType: input.discountType,
      discountValue: Math.max(0.01, Number(input.discountValue) || 0),
      minOrderAmount: Math.max(0, Number(input.minOrderAmount) || 0),
      maxDiscountAmount: Math.max(0, Number(input.maxDiscountAmount) || 0),
      expiryDate: input.expiryDate || '',
      usageLimit: Math.max(1, Math.round(Number(input.usageLimit) || 1)),
      usedCount: 0,
      active: Boolean(input.active),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateCoupon(id: string, input: Partial<CouponInput>): Promise<void> {
  const path = `coupons/${id}`;
  try {
    const snap = await getDoc(doc(db, 'coupons', id));
    if (!snap.exists()) throw new Error('Coupon not found.');
    const prev = snap.data() as Omit<Coupon, 'id'>;
    await updateDoc(doc(db, 'coupons', id), {
      code: input.code !== undefined ? input.code.trim().toUpperCase() : prev.code,
      discountType: input.discountType !== undefined ? input.discountType : prev.discountType,
      discountValue:
        input.discountValue !== undefined
          ? Math.max(0.01, Number(input.discountValue) || 0)
          : prev.discountValue,
      minOrderAmount:
        input.minOrderAmount !== undefined
          ? Math.max(0, Number(input.minOrderAmount) || 0)
          : prev.minOrderAmount,
      maxDiscountAmount:
        input.maxDiscountAmount !== undefined
          ? Math.max(0, Number(input.maxDiscountAmount) || 0)
          : prev.maxDiscountAmount || 0,
      expiryDate: input.expiryDate !== undefined ? input.expiryDate : prev.expiryDate || '',
      usageLimit:
        input.usageLimit !== undefined
          ? Math.max(1, Math.round(Number(input.usageLimit) || 1))
          : prev.usageLimit,
      usedCount: prev.usedCount ?? 0,
      active: input.active !== undefined ? Boolean(input.active) : prev.active,
      createdAt: prev.createdAt,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteCoupon(id: string): Promise<void> {
  const path = `coupons/${id}`;
  try {
    await deleteDoc(doc(db, 'coupons', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function validateCouponForSubtotal(
  rawCode: string,
  subtotal: number
): Promise<{ coupon: Coupon; discountAmount: number }> {
  const code = rawCode.trim().toUpperCase();
  if (!code) throw new Error('Please enter a coupon code.');
  const path = 'coupons';
  try {
    const q = query(collection(db, path), where('active', '==', true), where('code', '==', code));
    const snap = await getDocs(q);
    if (snap.empty) {
      throw new Error('Coupon code is invalid or inactive.');
    }
    const docSnap = snap.docs[0];
    const coupon = { id: docSnap.id, ...(docSnap.data() as Omit<Coupon, 'id'>) };

    if (coupon.expiryDate) {
      const exp = new Date(coupon.expiryDate).getTime();
      if (!Number.isNaN(exp) && Date.now() > exp) {
        throw new Error('This coupon has expired.');
      }
    }
    if (coupon.usedCount >= coupon.usageLimit) {
      throw new Error('This coupon has reached its usage limit.');
    }
    if (subtotal < coupon.minOrderAmount) {
      throw new Error(`Minimum order amount of ৳${coupon.minOrderAmount} is required for this coupon.`);
    }

    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
      }
    } else {
      discountAmount = coupon.discountValue;
    }
    discountAmount = Math.min(subtotal, Math.round(discountAmount * 100) / 100);
    return { coupon, discountAmount };
  } catch (error) {
    if (error instanceof Error && !error.message.includes('permissions')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// =========================================================
// Discount Rules
// =========================================================
export interface DiscountRuleInput {
  title: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  targetType: 'all' | 'category' | 'product';
  targetId?: string;
  startDate?: string;
  endDate?: string;
  active: boolean;
}

export async function listDiscountRules(onlyActive = false): Promise<DiscountRule[]> {
  const path = 'discounts';
  try {
    const q = onlyActive
      ? query(collection(db, path), where('active', '==', true))
      : query(collection(db, path));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<DiscountRule, 'id'>) }))
      .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createDiscountRule(input: DiscountRuleInput): Promise<string> {
  const id = generateId('disc');
  const path = `discounts/${id}`;
  try {
    await setDoc(doc(db, 'discounts', id), {
      title: input.title.trim(),
      description: input.description?.trim() || '',
      discountType: input.discountType,
      discountValue: Math.max(0.01, Number(input.discountValue) || 0),
      targetType: input.targetType,
      targetId: input.targetId || '',
      startDate: input.startDate || '',
      endDate: input.endDate || '',
      active: Boolean(input.active),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateDiscountRule(id: string, input: Partial<DiscountRuleInput>): Promise<void> {
  const path = `discounts/${id}`;
  try {
    const snap = await getDoc(doc(db, 'discounts', id));
    if (!snap.exists()) throw new Error('Discount rule not found.');
    const prev = snap.data() as Omit<DiscountRule, 'id'>;
    await updateDoc(doc(db, 'discounts', id), {
      title: input.title !== undefined ? input.title.trim() : prev.title,
      description: input.description !== undefined ? input.description.trim() : prev.description || '',
      discountType: input.discountType !== undefined ? input.discountType : prev.discountType,
      discountValue:
        input.discountValue !== undefined
          ? Math.max(0.01, Number(input.discountValue) || 0)
          : prev.discountValue,
      targetType: input.targetType !== undefined ? input.targetType : prev.targetType,
      targetId: input.targetId !== undefined ? input.targetId : prev.targetId || '',
      startDate: input.startDate !== undefined ? input.startDate : prev.startDate || '',
      endDate: input.endDate !== undefined ? input.endDate : prev.endDate || '',
      active: input.active !== undefined ? Boolean(input.active) : prev.active,
      createdAt: prev.createdAt,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteDiscountRule(id: string): Promise<void> {
  const path = `discounts/${id}`;
  try {
    await deleteDoc(doc(db, 'discounts', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
