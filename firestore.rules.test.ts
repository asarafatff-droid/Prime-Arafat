/**
 * Phase 0 Adversarial Security Test Suite for AS World Firestore Rules
 * Verifies the "Dirty Dozen" payloads against Firestore Security Rules.
 * Run against Firebase Emulator Suite when testing locally.
 */
export interface DirtyDozenCase {
  id: number;
  name: string;
  collectionPath: string;
  operation: 'create' | 'update' | 'get' | 'list';
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED';
}

export const dirtyDozenCases: DirtyDozenCase[] = [
  {
    id: 1,
    name: 'Self-Promotion to Super Admin',
    collectionPath: 'admins/attacker_uid',
    operation: 'create',
    payload: {
      uid: 'attacker_uid',
      email: 'attacker@example.com',
      name: 'Attacker',
      role: 'super_admin',
      active: true,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'PII Cross-Read on Other Customer Profile',
    collectionPath: 'users/victim_uid',
    operation: 'get',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Shadow Ghost Field on Customer Profile',
    collectionPath: 'users/attacker_uid',
    operation: 'create',
    payload: {
      uid: 'attacker_uid',
      name: 'Customer',
      email: 'c@example.com',
      isAdmin: true,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Fake Order Owner Spoofing',
    collectionPath: 'orders/order_fake_owner',
    operation: 'create',
    payload: {
      orderNumber: 'ASW-FAKE-1',
      userId: 'victim_uid',
      status: 'Pending',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Order Status Shortcut on Creation',
    collectionPath: 'orders/order_shortcut',
    operation: 'create',
    payload: {
      orderNumber: 'ASW-SHORT-1',
      userId: 'attacker_uid',
      status: 'Delivered',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Post-Confirmation Cancellation Tamper',
    collectionPath: 'orders/shipped_order_1',
    operation: 'update',
    payload: {
      status: 'Cancelled',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Client Timestamp Spoofing',
    collectionPath: 'orders/order_ts_spoof',
    operation: 'create',
    payload: {
      orderNumber: 'ASW-TS-1',
      userId: 'attacker_uid',
      status: 'Pending',
      createdAt: '2020-01-01T00:00:00Z',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Unverified Review Forgery',
    collectionPath: 'reviews/fake_review_1',
    operation: 'create',
    payload: {
      productId: 'prod_1',
      userId: 'attacker_uid',
      orderId: 'victim_order_1',
      rating: 5,
      comment: 'Fake 5 stars',
      verifiedPurchase: true,
      status: 'approved',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Unauthorized Product Price Tampering',
    collectionPath: 'products/prod_1',
    operation: 'update',
    payload: {
      price: 0,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Stock Inflation Attack',
    collectionPath: 'products/prod_1',
    operation: 'update',
    payload: {
      stock: 99999,
      salesCount: 0,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Oversized ID Poisoning',
    collectionPath: `orders/${'a'.repeat(500)}`,
    operation: 'create',
    payload: {
      orderNumber: 'ASW-ID-POISON',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Unverified Admin Email Spoof Bypass',
    collectionPath: 'products/prod_spoof',
    operation: 'create',
    payload: {
      name: 'Spoof Product',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
];
