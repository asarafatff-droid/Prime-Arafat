export type AdminRole = 'super_admin' | 'manager' | 'editor';

export interface AdminUser {
  id: string;
  uid: string;
  email: string;
  name: string;
  role: AdminRole;
  active: boolean;
  createdBy?: string;
  createdViaInviteId?: string;
  createdAt: any;
  updatedAt: any;
}

export interface AdminInvite {
  id: string;
  email: string;
  role: AdminRole;
  active: boolean;
  createdBy: string;
  createdAt: any;
  updatedAt: any;
}

export interface CustomerProfile {
  id: string;
  uid: string;
  name: string;
  email: string;
  phone?: string;
  district?: string;
  city?: string;
  area?: string;
  address?: string;
  coins?: number;
  totalCoinsEarned?: number;
  checkInStreak?: number;
  lastCheckInDate?: string;
  lastSpinDate?: string;
  lastGiftTapDate?: string;
  lastScratchDate?: string;
  lastDiceDate?: string;
  lastMemoryDate?: string;
  lastShareDate?: string;
  dailySharesCount?: number;
  referralCode?: string;
  referredByCode?: string;
  referredByUid?: string;
  createdAt: any;
  updatedAt: any;
}

export interface SavedAddress {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  district: string;
  city: string;
  area: string;
  address: string;
  isDefault: boolean;
  createdAt: any;
  updatedAt: any;
}

export type CoinActivityType =
  | 'check_in'
  | 'spin_wheel'
  | 'gift_tap'
  | 'scratch_card'
  | 'lucky_dice'
  | 'memory_flip'
  | 'external_link'
  | 'share_bonus'
  | 'referral_signup'
  | 'referral_commission'
  | 'order_bonus'
  | 'checkout_redeem';

export interface CoinActivity {
  id: string;
  type: CoinActivityType;
  amount: number;
  description: string;
  createdAt: any;
}

export interface ReferralProfile {
  code: string;
  ownerUid: string;
  displayName: string;
  createdAt: any;
}

export interface ReferralCommission {
  id: string;
  referrerUid: string;
  referrerCode: string;
  refereeUid: string;
  refereeName?: string;
  orderId: string;
  orderNumber: string;
  orderTotal: number;
  commissionPct: number;
  commissionCoins: number;
  status: 'pending' | 'credited';
  createdAt: any;
  updatedAt: any;
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
  addedAt: any;
  updatedAt: any;
}

export interface WishlistItem {
  id: string;
  productId: string;
  addedAt: any;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  displayOrder: number;
  active: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  displayOrder: number;
  active: boolean;
  createdAt: any;
  updatedAt: any;
}

export type ProductStatus = 'active' | 'draft' | 'archived';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  sku: string;
  price: number;
  discountPrice?: number;
  categoryId?: string;
  categoryName?: string;
  subcategoryId?: string;
  subcategoryName?: string;
  brand?: string;
  stock: number;
  images: string[];
  sizes?: string[];
  colors?: string[];
  variations?: string[];
  specifications?: Record<string, string>;
  weight?: string;
  shippingInfo?: string;
  status: ProductStatus;
  visible: boolean;
  featured: boolean;
  recommended?: boolean;
  trending?: boolean;
  newArrival?: boolean;
  bestSelling?: boolean;
  salesCount: number;
  ratingAvg: number;
  ratingCount: number;
  createdAt: any;
  updatedAt: any;
}

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Packed'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled'
  | 'Returned';

export type PaymentStatus = 'unpaid' | 'pending_verification' | 'paid' | 'refunded';

export interface OrderStatusHistoryEntry {
  status: OrderStatus;
  note: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
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
  paymentMethodLabel?: string;
  paymentTransactionId?: string;
  paymentSenderNumber?: string;
  paymentStatus: PaymentStatus;
  isFirstOrder?: boolean;
  deliveryPaymentMode?: 'advance_delivery_cod' | 'full_cod' | 'full_prepaid';
  advancePaidAmount?: number;
  dueOnDeliveryAmount?: number;
  couponCode?: string;
  coinsUsed?: number;
  coinDiscount?: number;
  deliveryManName?: string;
  deliveryManPhone?: string;
  subtotal: number;
  discountTotal?: number;
  couponDiscount?: number;
  shippingFee: number;
  total: number;
  status: OrderStatus;
  statusHistory?: OrderStatusHistoryEntry[];
  productIds: string[];
  itemCount: number;
  idempotencyKey: string;
  createdAt: any;
  updatedAt: any;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productImage?: string;
  sku?: string;
  selectedColor?: string;
  selectedSize?: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export type BannerPlacement =
  | 'top_strip'
  | 'main'
  | 'mobile'
  | 'desktop'
  | 'promotional'
  | 'flash_sale'
  | 'category'
  | 'campaign'
  | 'sponsored';

export interface Banner {
  id: string;
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
  createdAt: any;
  updatedAt: any;
}

export interface FlashSaleItem {
  productId: string;
  productName: string;
  productImage?: string;
  originalPrice: number;
  campaignPrice: number;
  stockLimit: number;
  soldCount: number;
}

export interface FlashSale {
  id: string;
  title: string;
  subtitle?: string;
  bannerImageUrl?: string;
  startDate: string;
  endDate: string;
  active: boolean;
  items: FlashSaleItem[];
  createdAt: any;
  updatedAt: any;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  expiryDate?: string;
  usageLimit: number;
  usedCount: number;
  active: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface DiscountRule {
  id: string;
  title: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  targetType: 'all' | 'category' | 'product';
  targetId?: string;
  startDate?: string;
  endDate?: string;
  active: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  orderId: string;
  rating: number;
  comment: string;
  verifiedPurchase: boolean;
  status: 'approved' | 'pending' | 'rejected';
  createdAt: any;
  updatedAt: any;
}

export interface WebsiteSettingsData {
  websiteName: string;
  storeTagline?: string;
  logoUrl: string;
  squareLogoUrl?: string;
  faviconUrl: string;
  themePrimaryColor?: string;
  themePreset?: string;
  contactEmail: string;
  supportPhone: string;
  whatsappNumber?: string;
  supportAddress: string;
  facebookUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  footerText: string;
  aboutUs: string;
  privacyPolicy: string;
  termsConditions: string;
  returnPolicy: string;
  deliveryPolicy: string;
  announcementBar: string;
  announcementActive: boolean;
  currencyCode: string;
  currencySymbol: string;
  maintenanceMode: boolean;
}

export interface ShippingSettingsData {
  defaultFee: number;
  insideDhakaFee: number;
  outsideDhakaFee: number;
  freeShippingThreshold: number;
  estimatedDeliveryDays: string;
  notes: string;
  firstOrderAdvanceDelivery?: boolean;
  areaRates?: Record<string, number>;
  disabledAreas?: string[];
}

export interface PaymentWalletAccount {
  id: string;
  label: string;
  accountNumber: string;
  accountName: string;
  accountType: 'Personal' | 'Agent' | 'Merchant' | 'Bank';
  sendMoneyOnly: boolean;
  active: boolean;
  note?: string;
}

export interface PaymentMethodConfig {
  id: 'cod' | 'bkash' | 'nagad' | 'rocket' | 'bank' | 'other';
  label: string;
  enabled: boolean;
  requiresTransactionId: boolean;
  accountName: string;
  accountNumber: string;
  accountType: string;
  sendMoneyOnly?: boolean;
  accounts?: PaymentWalletAccount[];
  instructions: string;
}

export interface PaymentSettingsData {
  methods: PaymentMethodConfig[];
}

export type GameEngineType =
  | 'spin_wheel'
  | 'gift_tap'
  | 'scratch_card'
  | 'lucky_dice'
  | 'memory_flip'
  | 'external_link';

export interface MiniGameConfig {
  id: string;
  title: string;
  description: string;
  engine: GameEngineType;
  minCoins: number;
  maxCoins: number;
  dailyPlayLimit: number;
  enabled: boolean;
  accentColor: string;
  externalUrl?: string;
}

export interface RewardsSettingsData {
  coinsEnabled: boolean;
  coinsUnit: number;
  takaPerUnit: number;
  maxCoinDiscountPercent: number;
  minCoinsToRedeem: number;
  dailyCheckInCoins: number;
  streakBonusCoins: number;
  shareBonusCoins: number;
  maxDailyShares: number;
  referralSignupBonusCoins: number;
  referredWelcomeCoins: number;
  referralOrderCommissionPct: number;
  games: MiniGameConfig[];
}

export interface ProductCollectionConfig {
  id: string;
  title: string;
  subtitle: string;
  productIds: string[];
  active: boolean;
}

export interface HomepageSectionConfig {
  key:
    | 'flash_sale'
    | 'categories'
    | 'recommended'
    | 'trending'
    | 'new_arrivals'
    | 'best_selling'
    | 'featured'
    | 'promotional_campaigns'
    | 'collections';
  label: string;
  enabled: boolean;
}

export interface HomepageSettingsData {
  sections: HomepageSectionConfig[];
  collections: ProductCollectionConfig[];
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  userId?: string;
  status: 'new' | 'read' | 'resolved';
  createdAt: any;
  updatedAt: any;
}
