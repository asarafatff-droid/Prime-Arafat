import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import type {
  HomepageSettingsData,
  PaymentSettingsData,
  RewardsSettingsData,
  ShippingSettingsData,
  WebsiteSettingsData,
} from '../types';

export const DEFAULT_WEBSITE_SETTINGS: WebsiteSettingsData = {
  websiteName: 'AS World',
  storeTagline: '',
  logoUrl: '',
  squareLogoUrl: '',
  faviconUrl: '',
  themePrimaryColor: '#F85606',
  themePreset: 'daraz_orange',
  contactEmail: '',
  supportPhone: '',
  whatsappNumber: '',
  supportAddress: '',
  facebookUrl: '',
  instagramUrl: '',
  youtubeUrl: '',
  footerText: '',
  aboutUs: '',
  privacyPolicy: '',
  termsConditions: '',
  returnPolicy: '',
  deliveryPolicy: '',
  announcementBar: '',
  announcementActive: false,
  currencyCode: 'BDT',
  currencySymbol: '৳',
  maintenanceMode: false,
};

export const DEFAULT_SHIPPING_SETTINGS: ShippingSettingsData = {
  defaultFee: 120,
  insideDhakaFee: 80,
  outsideDhakaFee: 120,
  freeShippingThreshold: 0,
  estimatedDeliveryDays: '2-4 business days (Dhaka ৳80 · Nationwide incl. Tangail ৳120)',
  notes: '',
  firstOrderAdvanceDelivery: true,
  areaRates: {},
  disabledAreas: [],
};

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettingsData = {
  methods: [
    {
      id: 'cod',
      label: 'Cash on Delivery',
      enabled: true,
      requiresTransactionId: false,
      accountName: '',
      accountNumber: '',
      accountType: '',
      sendMoneyOnly: false,
      accounts: [],
      instructions: 'Pay in cash when your order arrives at your doorstep.',
    },
    {
      id: 'bkash',
      label: 'bKash',
      enabled: false,
      requiresTransactionId: true,
      accountName: '',
      accountNumber: '',
      accountType: 'Personal',
      sendMoneyOnly: true,
      accounts: [],
      instructions: 'Only Send Money is accepted. Do NOT Cash Out.',
    },
    {
      id: 'nagad',
      label: 'Nagad',
      enabled: false,
      requiresTransactionId: true,
      accountName: '',
      accountNumber: '',
      accountType: 'Personal',
      sendMoneyOnly: true,
      accounts: [],
      instructions: 'Only Send Money is accepted. Do NOT Cash Out.',
    },
    {
      id: 'rocket',
      label: 'Rocket',
      enabled: false,
      requiresTransactionId: true,
      accountName: '',
      accountNumber: '',
      accountType: 'Personal',
      sendMoneyOnly: true,
      accounts: [],
      instructions: 'Only Send Money is accepted. Do NOT Cash Out.',
    },
    {
      id: 'bank',
      label: 'Bank Payment',
      enabled: false,
      requiresTransactionId: true,
      accountName: '',
      accountNumber: '',
      accountType: 'Bank',
      sendMoneyOnly: false,
      accounts: [],
      instructions: '',
    },
    {
      id: 'other',
      label: 'Other Payment Method',
      enabled: false,
      requiresTransactionId: true,
      accountName: '',
      accountNumber: '',
      accountType: 'Personal',
      sendMoneyOnly: true,
      accounts: [],
      instructions: '',
    },
  ],
};

export const DEFAULT_REWARDS_SETTINGS: RewardsSettingsData = {
  coinsEnabled: true,
  coinsUnit: 100,
  takaPerUnit: 10,
  maxCoinDiscountPercent: 50,
  minCoinsToRedeem: 20,
  dailyCheckInCoins: 15,
  streakBonusCoins: 50,
  shareBonusCoins: 15,
  maxDailyShares: 5,
  referralSignupBonusCoins: 100,
  referredWelcomeCoins: 50,
  referralOrderCommissionPct: 10,
  games: [
    {
      id: 'game_spin_wheel',
      title: 'Lucky Spin Wheel',
      description: 'Spin the orange wheel daily to win instant AS Coins.',
      engine: 'spin_wheel',
      minCoins: 10,
      maxCoins: 100,
      dailyPlayLimit: 1,
      enabled: true,
      accentColor: '#F85606',
    },
    {
      id: 'game_gift_tap',
      title: 'Mystery Gift Box',
      description: 'Pick 1 of 3 surprise gift boxes to reveal bonus AS Coins.',
      engine: 'gift_tap',
      minCoins: 10,
      maxCoins: 75,
      dailyPlayLimit: 1,
      enabled: true,
      accentColor: '#DC2626',
    },
    {
      id: 'game_scratch_card',
      title: 'Scratch & Win Card',
      description: 'Scratch the golden card to unlock hidden coin rewards.',
      engine: 'scratch_card',
      minCoins: 15,
      maxCoins: 80,
      dailyPlayLimit: 1,
      enabled: true,
      accentColor: '#D97706',
    },
    {
      id: 'game_lucky_dice',
      title: 'Lucky Number Dice',
      description: 'Roll the dice — higher numbers multiply your AS Coins!',
      engine: 'lucky_dice',
      minCoins: 10,
      maxCoins: 60,
      dailyPlayLimit: 1,
      enabled: true,
      accentColor: '#2563EB',
    },
    {
      id: 'game_memory_flip',
      title: 'Memory Match Challenge',
      description: 'Match the 3 shopping icon pairs to claim champion AS Coins.',
      engine: 'memory_flip',
      minCoins: 20,
      maxCoins: 90,
      dailyPlayLimit: 1,
      enabled: true,
      accentColor: '#059669',
    },
  ],
};

export const DEFAULT_HOMEPAGE_SETTINGS: HomepageSettingsData = {
  sections: [
    { key: 'flash_sale', label: 'Flash Sale', enabled: true },
    { key: 'categories', label: 'Categories', enabled: true },
    { key: 'recommended', label: 'Recommended Products', enabled: true },
    { key: 'trending', label: 'Trending Products', enabled: true },
    { key: 'new_arrivals', label: 'New Arrivals', enabled: true },
    { key: 'best_selling', label: 'Best Selling Products', enabled: true },
    { key: 'featured', label: 'Featured Products', enabled: true },
    { key: 'promotional_campaigns', label: 'Promotional Campaigns', enabled: true },
    { key: 'collections', label: 'Product Collections', enabled: true },
  ],
  collections: [],
};

export async function fetchSetting<T>(
  settingId: 'website' | 'shipping' | 'payments' | 'homepage' | 'rewards',
  fallback: T
): Promise<T> {
  const path = `settings/${settingId}`;
  try {
    const snap = await getDoc(doc(db, 'settings', settingId));
    if (!snap.exists()) return fallback;
    const raw = snap.data();
    return { ...fallback, ...(raw.data || {}) } as T;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveSetting(
  settingId: 'website' | 'shipping' | 'payments' | 'homepage' | 'rewards',
  data: Record<string, any>
): Promise<void> {
  const path = `settings/${settingId}`;
  try {
    await setDoc(doc(db, 'settings', settingId), {
      type: settingId,
      data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
