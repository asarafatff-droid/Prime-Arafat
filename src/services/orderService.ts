import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { generateId, generateOrderNumber, getEffectivePrice } from '../lib/utils';
import type {
  Coupon,
  CustomerProfile,
  Order,
  OrderItem,
  OrderStatus,
  PaymentStatus,
  Product,
  RewardsSettingsData,
} from '../types';

export interface CheckoutInput {
  userId: string;
  customerName: string;
  mobile: string;
  email?: string;
  district: string;
  city: string;
  area: string;
  deliveryAddress: string;
  deliveryInstructions?: string;
  paymentMethod: string;
  paymentMethodLabel: string;
  paymentTransactionId?: string;
  paymentSenderNumber?: string;
  isFirstOrder?: boolean;
  deliveryPaymentMode?: 'advance_delivery_cod' | 'full_cod' | 'full_prepaid';
  advancePaidAmount?: number;
  couponCode?: string;
  coinsUsed?: number;
  rewardsSettings?: RewardsSettingsData;
  shippingFee: number;
  idempotencyKey: string;
  items: {
    cartItemId?: string;
    productId: string;
    quantity: number;
    selectedColor?: string;
    selectedSize?: string;
    overrideUnitPrice?: number;
  }[];
  activeFlashSalePrices?: Record<string, number>;
}

export async function placeOrder(input: CheckoutInput): Promise<{ orderId: string; orderNumber: string }> {
  if (!input.items.length) {
    throw new Error('Your cart is empty.');
  }

  // Prevent duplicate submission with same idempotencyKey
  const ordersPath = 'orders';
  try {
    const dupQuery = query(
      collection(db, ordersPath),
      where('userId', '==', input.userId),
      where('idempotencyKey', '==', input.idempotencyKey)
    );
    const dupSnap = await getDocs(dupQuery);
    if (!dupSnap.empty) {
      const existingDoc = dupSnap.docs[0];
      return {
        orderId: existingDoc.id,
        orderNumber: existingDoc.data().orderNumber,
      };
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, ordersPath);
  }

  const orderId = generateId('ord');
  const orderNumber = generateOrderNumber();

  // Execute atomic Firestore transaction to validate inventory, prices, coupon, coins & referral commission
  try {
    await runTransaction(db, async (transaction) => {
      // 1. Read user profile & all product docs first (Firestore requires all reads before writes)
      const userRef = doc(db, 'users', input.userId);
      const userSnap = await transaction.get(userRef);
      const userData = userSnap.exists() ? (userSnap.data() as CustomerProfile) : null;

      const productMap = new Map<string, Product>();
      for (const item of input.items) {
        if (!productMap.has(item.productId)) {
          const pRef = doc(db, 'products', item.productId);
          const pSnap = await transaction.get(pRef);
          if (!pSnap.exists()) {
            throw new Error('One or more products in your cart are no longer available.');
          }
          productMap.set(item.productId, {
            id: pSnap.id,
            ...(pSnap.data() as Omit<Product, 'id'>),
          });
        }
      }

      // 2. Read coupon doc if couponCode provided
      let couponDoc: Coupon | null = null;
      if (input.couponCode?.trim()) {
        const cQuery = query(
          collection(db, 'coupons'),
          where('active', '==', true),
          where('code', '==', input.couponCode.trim().toUpperCase())
        );
        const cSnap = await getDocs(cQuery);
        if (cSnap.empty) {
          throw new Error('Applied coupon is no longer valid.');
        }
        const first = cSnap.docs[0];
        const freshCouponSnap = await transaction.get(doc(db, 'coupons', first.id));
        if (!freshCouponSnap.exists()) {
          throw new Error('Coupon no longer exists.');
        }
        couponDoc = {
          id: freshCouponSnap.id,
          ...(freshCouponSnap.data() as Omit<Coupon, 'id'>),
        };
      }

      // 3. Validate stock per product
      const qtyByProduct = new Map<string, number>();
      for (const item of input.items) {
        qtyByProduct.set(item.productId, (qtyByProduct.get(item.productId) || 0) + item.quantity);
      }

      for (const [productId, totalQty] of qtyByProduct.entries()) {
        const prod = productMap.get(productId)!;
        if (prod.status !== 'active' || !prod.visible) {
          throw new Error(`"${prod.name}" is currently unavailable.`);
        }
        if (prod.stock < totalQty) {
          throw new Error(
            prod.stock === 0
              ? `"${prod.name}" is out of stock.`
              : `Only ${prod.stock} unit(s) of "${prod.name}" left in stock.`
          );
        }
      }

      // 4. Compute authoritative prices and totals
      let subtotal = 0;
      let productDiscountTotal = 0;
      let totalItemCount = 0;
      const productIds: string[] = [];
      const orderItems: Omit<OrderItem, 'id'>[] = [];

      for (const item of input.items) {
        const prod = productMap.get(item.productId)!;
        const catalogPrice = getEffectivePrice(prod.price, prod.discountPrice);
        const flashPrice = input.activeFlashSalePrices?.[item.productId];
        const unitPrice =
          flashPrice && flashPrice > 0 && flashPrice < catalogPrice ? flashPrice : catalogPrice;
        const lineTotal = Math.round(unitPrice * item.quantity * 100) / 100;

        subtotal += lineTotal;
        if (prod.price > unitPrice) {
          productDiscountTotal += Math.round((prod.price - unitPrice) * item.quantity * 100) / 100;
        }
        totalItemCount += item.quantity;
        if (!productIds.includes(prod.id)) productIds.push(prod.id);

        orderItems.push({
          orderId,
          productId: prod.id,
          productName: prod.name,
          productImage: prod.images?.[0] || '',
          sku: prod.sku,
          selectedColor: item.selectedColor || '',
          selectedSize: item.selectedSize || '',
          unitPrice,
          quantity: item.quantity,
          lineTotal,
        });
      }

      // 5. Validate coupon on authoritative subtotal
      let couponDiscount = 0;
      if (couponDoc) {
        if (!couponDoc.active) throw new Error('Coupon is inactive.');
        if (couponDoc.usedCount >= couponDoc.usageLimit) {
          throw new Error('Coupon usage limit has been reached.');
        }
        if (couponDoc.expiryDate) {
          const exp = new Date(couponDoc.expiryDate).getTime();
          if (!Number.isNaN(exp) && Date.now() > exp) {
            throw new Error('Coupon has expired.');
          }
        }
        if (subtotal < couponDoc.minOrderAmount) {
          throw new Error(`Minimum order amount of ৳${couponDoc.minOrderAmount} required for coupon.`);
        }
        if (couponDoc.discountType === 'percentage') {
          couponDiscount = (subtotal * couponDoc.discountValue) / 100;
          if (couponDoc.maxDiscountAmount && couponDoc.maxDiscountAmount > 0) {
            couponDiscount = Math.min(couponDiscount, couponDoc.maxDiscountAmount);
          }
        } else {
          couponDiscount = couponDoc.discountValue;
        }
        couponDiscount = Math.min(subtotal, Math.round(couponDiscount * 100) / 100);
      }

      // 6. Validate and apply AS Coins redemption
      let coinsUsed = Math.max(0, Math.round(Number(input.coinsUsed) || 0));
      let coinDiscount = 0;
      const rw = input.rewardsSettings;
      if (coinsUsed > 0 && rw?.coinsEnabled && userData) {
        const currentCoins = Math.max(0, Number(userData.coins) || 0);
        if (currentCoins < coinsUsed) {
          throw new Error('You do not have enough AS Coins for this redemption.');
        }
        const unit = Math.max(1, rw.coinsUnit || 100);
        const takaPerUnit = Math.max(0, rw.takaPerUnit || 10);
        const rawCoinTaka = Math.floor((coinsUsed / unit) * takaPerUnit);
        const maxPctCap = Math.floor(subtotal * ((rw.maxCoinDiscountPercent || 50) / 100));
        const remainingProductSubtotal = Math.max(0, subtotal - couponDiscount);
        coinDiscount = Math.max(0, Math.min(rawCoinTaka, maxPctCap, remainingProductSubtotal));
        if (coinDiscount <= 0) {
          coinsUsed = 0;
        }
      } else {
        coinsUsed = 0;
      }

      const shippingFee = Math.max(0, Number(input.shippingFee) || 0);
      const finalTotal = Math.max(
        0,
        Math.round((subtotal - couponDiscount - coinDiscount + shippingFee) * 100) / 100
      );

      const mode =
        input.deliveryPaymentMode ||
        (input.paymentMethod === 'cod' ? 'full_cod' : 'full_prepaid');

      const advancePaidAmount =
        mode === 'advance_delivery_cod'
          ? shippingFee
          : mode === 'full_prepaid'
          ? finalTotal
          : 0;

      const dueOnDeliveryAmount = Math.max(
        0,
        Math.round((finalTotal - advancePaidAmount) * 100) / 100
      );

      // 7. Write Order Document
      const initialPaymentStatus: PaymentStatus =
        mode === 'full_cod' && !input.paymentTransactionId?.trim()
          ? 'unpaid'
          : 'pending_verification';

      transaction.set(doc(db, 'orders', orderId), {
        orderNumber,
        userId: input.userId,
        customerName: input.customerName.trim(),
        mobile: input.mobile.trim(),
        email: input.email?.trim() || '',
        district: input.district.trim(),
        city: input.city.trim(),
        area: input.area.trim(),
        deliveryAddress: input.deliveryAddress.trim(),
        deliveryInstructions: input.deliveryInstructions?.trim() || '',
        paymentMethod: input.paymentMethod,
        paymentMethodLabel: input.paymentMethodLabel,
        paymentTransactionId: input.paymentTransactionId?.trim() || '',
        paymentSenderNumber: input.paymentSenderNumber?.trim() || '',
        paymentStatus: initialPaymentStatus,
        isFirstOrder: Boolean(input.isFirstOrder),
        deliveryPaymentMode: mode,
        advancePaidAmount,
        dueOnDeliveryAmount,
        couponCode: couponDoc ? couponDoc.code : '',
        coinsUsed,
        coinDiscount,
        subtotal,
        discountTotal: productDiscountTotal,
        couponDiscount,
        shippingFee,
        total: finalTotal,
        status: 'Pending' as OrderStatus,
        statusHistory: [
          {
            status: 'Pending',
            note:
              mode === 'advance_delivery_cod'
                ? `First order placed (Advance delivery fee ৳${advancePaidAmount} submitted; ৳${dueOnDeliveryAmount} Cash on Delivery)`
                : 'Order placed by customer',
            updatedAt: new Date().toISOString(),
          },
        ],
        productIds,
        itemCount: totalItemCount,
        idempotencyKey: input.idempotencyKey,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 8. Write Order Items subcollection
      for (const item of orderItems) {
        const itemId = generateId('item');
        transaction.set(doc(db, 'orders', orderId, 'items', itemId), item);
      }

      // 9. Decrement Product Stock & Increment Sales Count
      for (const [productId, totalQty] of qtyByProduct.entries()) {
        const prod = productMap.get(productId)!;
        transaction.update(doc(db, 'products', productId), {
          stock: prod.stock - totalQty,
          salesCount: (prod.salesCount || 0) + totalQty,
          updatedAt: serverTimestamp(),
        });
      }

      // 10. Increment Coupon usage if applied
      if (couponDoc) {
        transaction.update(doc(db, 'coupons', couponDoc.id), {
          usedCount: (couponDoc.usedCount || 0) + 1,
          updatedAt: serverTimestamp(),
        });
      }

      // 11. Deduct redeemed AS Coins & log coin history
      if (coinsUsed > 0 && userData) {
        const prevCoins = Math.max(0, Number(userData.coins) || 0);
        transaction.update(userRef, {
          coins: Math.max(0, prevCoins - coinsUsed),
          updatedAt: serverTimestamp(),
        });
        const coinEntryId = generateId('coin');
        transaction.set(doc(db, 'users', input.userId, 'coinHistory', coinEntryId), {
          type: 'checkout_redeem',
          amount: -coinsUsed,
          description: `Redeemed ${coinsUsed} Coins for ৳${coinDiscount} off Order ${orderNumber}`.slice(
            0,
            200
          ),
          createdAt: serverTimestamp(),
        });
      }

      // 12. Record 10% (or admin-configured %) Referral Commission for the referrer
      if (
        userData?.referredByUid &&
        userData.referredByUid !== input.userId &&
        rw &&
        (rw.referralOrderCommissionPct || 0) > 0
      ) {
        const pct = Math.min(50, Math.max(0, Number(rw.referralOrderCommissionPct) || 10));
        const commissionBase = Math.max(0, subtotal - couponDiscount - coinDiscount);
        const commissionCoins = Math.max(1, Math.round(commissionBase * (pct / 100)));
        const refId = generateId('ref');
        transaction.set(doc(db, 'referrals', refId), {
          referrerUid: userData.referredByUid,
          referrerCode: userData.referredByCode || 'REF',
          refereeUid: input.userId,
          refereeName: input.customerName.trim().slice(0, 120),
          orderId,
          orderNumber,
          orderTotal: finalTotal,
          commissionPct: pct,
          commissionCoins,
          status: 'pending',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    });

    // Clear ordered items from customer's Firestore cart outside transaction (non-blocking)
    const cartItemIds = input.items.map((i) => i.cartItemId).filter((id): id is string => Boolean(id));
    if (cartItemIds.length > 0) {
      const batch = writeBatch(db);
      for (const cid of cartItemIds) {
        batch.delete(doc(db, 'users', input.userId, 'cart', cid));
      }
      await batch.commit();
    }

    return { orderId, orderNumber };
  } catch (error) {
    if (error instanceof Error && !error.message.includes('Missing or insufficient permissions')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.WRITE, `orders/${orderId}`);
  }
}

export async function listAllOrders(): Promise<Order[]> {
  const path = 'orders';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Order, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function listCustomerOrders(userId: string): Promise<Order[]> {
  const path = 'orders';
  try {
    const q = query(collection(db, path), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<Order, 'id'>) }))
      .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function getOrderById(orderId: string): Promise<{ order: Order; items: OrderItem[] } | null> {
  const path = `orders/${orderId}`;
  try {
    const snap = await getDoc(doc(db, 'orders', orderId));
    if (!snap.exists()) return null;
    const order = { id: snap.id, ...(snap.data() as Omit<Order, 'id'>) };
    const itemsSnap = await getDocs(collection(db, 'orders', orderId, 'items'));
    const items = itemsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<OrderItem, 'id'>) }));
    return { order, items };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function findCustomerOrderByNumber(
  userId: string,
  orderNumber: string
): Promise<{ order: Order; items: OrderItem[] } | null> {
  const path = 'orders';
  try {
    const q = query(
      collection(db, path),
      where('userId', '==', userId),
      where('orderNumber', '==', orderNumber.trim().toUpperCase())
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    const order = { id: d.id, ...(d.data() as Omit<Order, 'id'>) };
    const itemsSnap = await getDocs(collection(db, 'orders', d.id, 'items'));
    const items = itemsSnap.docs.map((it) => ({ id: it.id, ...(it.data() as Omit<OrderItem, 'id'>) }));
    return { order, items };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function updateOrderStatusByAdmin(
  orderId: string,
  status: OrderStatus,
  paymentStatus?: PaymentStatus,
  note?: string,
  deliveryManName?: string,
  deliveryManPhone?: string
): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    const snap = await getDoc(doc(db, 'orders', orderId));
    if (!snap.exists()) throw new Error('Order not found.');
    const prev = snap.data() as Omit<Order, 'id'>;
    const history = Array.isArray(prev.statusHistory) ? [...prev.statusHistory] : [];
    if (prev.status !== status || note) {
      history.push({
        status,
        note: note?.trim() || `Status updated to ${status}`,
        updatedAt: new Date().toISOString(),
      });
    }
    const payload: Record<string, any> = {
      status,
      paymentStatus: paymentStatus ?? prev.paymentStatus,
      statusHistory: history.slice(-30),
      updatedAt: serverTimestamp(),
    };
    if (deliveryManName !== undefined) {
      payload.deliveryManName = deliveryManName.trim();
    }
    if (deliveryManPhone !== undefined) {
      payload.deliveryManPhone = deliveryManPhone.trim();
    }
    await updateDoc(doc(db, 'orders', orderId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function cancelPendingOrderByCustomer(orderId: string): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    const snap = await getDoc(doc(db, 'orders', orderId));
    if (!snap.exists()) throw new Error('Order not found.');
    const prev = snap.data() as Omit<Order, 'id'>;
    if (prev.status !== 'Pending') {
      throw new Error('Only pending orders can be cancelled.');
    }
    const history = Array.isArray(prev.statusHistory) ? [...prev.statusHistory] : [];
    history.push({
      status: 'Cancelled',
      note: 'Cancelled by customer',
      updatedAt: new Date().toISOString(),
    });
    await updateDoc(doc(db, 'orders', orderId), {
      status: 'Cancelled',
      statusHistory: history.slice(-30),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
