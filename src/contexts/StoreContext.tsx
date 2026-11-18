import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, isFirebaseConfigured, OperationType } from '../lib/firebase';
import { isWithinSchedule } from '../lib/utils';
import {
  DEFAULT_HOMEPAGE_SETTINGS,
  DEFAULT_PAYMENT_SETTINGS,
  DEFAULT_REWARDS_SETTINGS,
  DEFAULT_SHIPPING_SETTINGS,
  DEFAULT_WEBSITE_SETTINGS,
} from '../services/settingsService';
import { claimPendingReferralCommissions } from '../services/rewardsService';
import {
  removeCartItem,
  setCartItemQuantity,
  toggleWishlistItem,
  upsertCartItem,
} from '../services/userService';
import type {
  Banner,
  CartItem,
  Category,
  DiscountRule,
  FlashSale,
  HomepageSettingsData,
  PaymentSettingsData,
  Product,
  RewardsSettingsData,
  SavedAddress,
  ShippingSettingsData,
  Subcategory,
  WebsiteSettingsData,
  WishlistItem,
} from '../types';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface StoreContextValue {
  loading: boolean;
  firebaseReady: boolean;
  websiteSettings: WebsiteSettingsData;
  shippingSettings: ShippingSettingsData;
  paymentSettings: PaymentSettingsData;
  homepageSettings: HomepageSettingsData;
  rewardsSettings: RewardsSettingsData;
  categories: Category[];
  subcategories: Subcategory[];
  products: Product[];
  banners: Banner[];
  flashSales: FlashSale[];
  discountRules: DiscountRule[];
  cart: CartItem[];
  wishlist: WishlistItem[];
  savedAddresses: SavedAddress[];
  cartCount: number;
  activeFlashSalePrices: Record<string, number>;
  addToCart: (
    productId: string,
    quantity?: number,
    selectedColor?: string,
    selectedSize?: string
  ) => Promise<boolean>;
  updateCartQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { user, authReady, refreshProfile } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [websiteSettings, setWebsiteSettings] =
    useState<WebsiteSettingsData>(DEFAULT_WEBSITE_SETTINGS);
  const [shippingSettings, setShippingSettings] =
    useState<ShippingSettingsData>(DEFAULT_SHIPPING_SETTINGS);
  const [paymentSettings, setPaymentSettings] =
    useState<PaymentSettingsData>(DEFAULT_PAYMENT_SETTINGS);
  const [homepageSettings, setHomepageSettings] =
    useState<HomepageSettingsData>(DEFAULT_HOMEPAGE_SETTINGS);
  const [rewardsSettings, setRewardsSettings] =
    useState<RewardsSettingsData>(DEFAULT_REWARDS_SETTINGS);

  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [discountRules, setDiscountRules] = useState<DiscountRule[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);

  // Public Storefront Subscriptions
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    let resolvedCount = 0;
    const markResolved = () => {
      resolvedCount += 1;
      if (resolvedCount >= 6) {
        setLoading(false);
      }
    };

    const unsubSettings = onSnapshot(
      collection(db, 'settings'),
      (snap) => {
        for (const d of snap.docs) {
          const payload = d.data();
          if (d.id === 'website') {
            setWebsiteSettings({ ...DEFAULT_WEBSITE_SETTINGS, ...(payload.data || {}) });
          } else if (d.id === 'shipping') {
            setShippingSettings({ ...DEFAULT_SHIPPING_SETTINGS, ...(payload.data || {}) });
          } else if (d.id === 'payments') {
            setPaymentSettings({ ...DEFAULT_PAYMENT_SETTINGS, ...(payload.data || {}) });
          } else if (d.id === 'homepage') {
            setHomepageSettings({ ...DEFAULT_HOMEPAGE_SETTINGS, ...(payload.data || {}) });
          } else if (d.id === 'rewards') {
            setRewardsSettings({ ...DEFAULT_REWARDS_SETTINGS, ...(payload.data || {}) });
          }
        }
        markResolved();
      },
      (err) => {
        markResolved();
        handleFirestoreError(err, OperationType.LIST, 'settings');
      }
    );

    const unsubCategories = onSnapshot(
      query(collection(db, 'categories'), where('active', '==', true)),
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<Category, 'id'>) }))
          .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
        setCategories(list);
        markResolved();
      },
      (err) => {
        markResolved();
        handleFirestoreError(err, OperationType.LIST, 'categories');
      }
    );

    const unsubSubcategories = onSnapshot(
      query(collection(db, 'subcategories'), where('active', '==', true)),
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<Subcategory, 'id'>) }))
          .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
        setSubcategories(list);
        markResolved();
      },
      (err) => {
        markResolved();
        handleFirestoreError(err, OperationType.LIST, 'subcategories');
      }
    );

    const unsubProducts = onSnapshot(
      query(
        collection(db, 'products'),
        where('status', '==', 'active'),
        where('visible', '==', true)
      ),
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<Product, 'id'>) }))
          .sort((a, b) => {
            const ta = a.createdAt?.seconds ?? 0;
            const tb = b.createdAt?.seconds ?? 0;
            return tb - ta;
          });
        setProducts(list);
        markResolved();
      },
      (err) => {
        markResolved();
        handleFirestoreError(err, OperationType.LIST, 'products');
      }
    );

    const unsubBanners = onSnapshot(
      query(collection(db, 'banners'), where('active', '==', true)),
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<Banner, 'id'>) }))
          .filter((b) => isWithinSchedule(b.startDate, b.endDate))
          .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
        setBanners(list);
        markResolved();
      },
      (err) => {
        markResolved();
        handleFirestoreError(err, OperationType.LIST, 'banners');
      }
    );

    const unsubFlashSales = onSnapshot(
      query(collection(db, 'flashSales'), where('active', '==', true)),
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<FlashSale, 'id'>) }))
          .filter((fs) => isWithinSchedule(fs.startDate, fs.endDate));
        setFlashSales(list);
        markResolved();
      },
      (err) => {
        markResolved();
        handleFirestoreError(err, OperationType.LIST, 'flashSales');
      }
    );

    const unsubDiscounts = onSnapshot(
      query(collection(db, 'discounts'), where('active', '==', true)),
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<DiscountRule, 'id'>) }))
          .filter((d) => isWithinSchedule(d.startDate, d.endDate));
        setDiscountRules(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'discounts');
      }
    );

    return () => {
      unsubSettings();
      unsubCategories();
      unsubSubcategories();
      unsubProducts();
      unsubBanners();
      unsubFlashSales();
      unsubDiscounts();
    };
  }, []);

  // Update browser document title, favicon, and active theme color when website settings change
  useEffect(() => {
    if (websiteSettings.websiteName) {
      document.title = `${websiteSettings.websiteName} — Online Shopping Marketplace`;
    }
    const activeFavicon = websiteSettings.faviconUrl || websiteSettings.squareLogoUrl;
    if (activeFavicon) {
      let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = activeFavicon;
    }
    if (websiteSettings.themePrimaryColor) {
      document.documentElement.style.setProperty('--asw-primary', websiteSettings.themePrimaryColor);
    }
  }, [
    websiteSettings.websiteName,
    websiteSettings.faviconUrl,
    websiteSettings.squareLogoUrl,
    websiteSettings.themePrimaryColor,
  ]);

  // Authenticated Customer Cart, Wishlist & Saved Addresses Subscriptions
  useEffect(() => {
    if (!authReady || !user) {
      setCart([]);
      setWishlist([]);
      setSavedAddresses([]);
      return;
    }

    // Automatically credit any pending referral order commissions when signed in
    void claimPendingReferralCommissions(user.uid)
      .then((credited) => {
        if (credited > 0) {
          void refreshProfile();
          showToast(`+${credited} Referral Commission Coins credited to your wallet!`, 'success');
        }
      })
      .catch(() => {
        // silent background check
      });

    const unsubCart = onSnapshot(
      collection(db, 'users', user.uid, 'cart'),
      (snap) => {
        setCart(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CartItem, 'id'>) })));
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/cart`);
      }
    );

    const unsubWishlist = onSnapshot(
      collection(db, 'users', user.uid, 'wishlist'),
      (snap) => {
        setWishlist(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<WishlistItem, 'id'>) })));
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/wishlist`);
      }
    );

    const unsubAddresses = onSnapshot(
      collection(db, 'users', user.uid, 'addresses'),
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<SavedAddress, 'id'>) }))
          .sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
        setSavedAddresses(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/addresses`);
      }
    );

    return () => {
      unsubCart();
      unsubWishlist();
      unsubAddresses();
    };
  }, [user, authReady, refreshProfile, showToast]);

  const activeFlashSalePrices = useMemo(() => {
    const map: Record<string, number> = {};
    for (const fs of flashSales) {
      if (!isWithinSchedule(fs.startDate, fs.endDate)) continue;
      for (const item of fs.items || []) {
        if (item.campaignPrice > 0) {
          map[item.productId] = item.campaignPrice;
        }
      }
    }
    return map;
  }, [flashSales]);

  const cartCount = useMemo(
    () => cart.reduce((acc, item) => acc + (item.quantity || 0), 0),
    [cart]
  );

  const addToCart = useCallback(
    async (productId: string, quantity = 1, selectedColor = '', selectedSize = '') => {
      if (!user) {
        showToast('Please sign in to add items to your cart.', 'info');
        return false;
      }
      try {
        await upsertCartItem(user.uid, productId, quantity, selectedColor, selectedSize);
        showToast('Added to cart.', 'success');
        return true;
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Could not add item to cart.', 'error');
        return false;
      }
    },
    [user, showToast]
  );

  const updateCartQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      if (!user) return;
      try {
        await setCartItemQuantity(user.uid, itemId, quantity);
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Could not update cart.', 'error');
      }
    },
    [user, showToast]
  );

  const removeFromCart = useCallback(
    async (itemId: string) => {
      if (!user) return;
      try {
        await removeCartItem(user.uid, itemId);
        showToast('Removed from cart.', 'info');
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Could not remove item.', 'error');
      }
    },
    [user, showToast]
  );

  const isInWishlist = useCallback(
    (productId: string) => wishlist.some((w) => w.productId === productId),
    [wishlist]
  );

  const toggleWishlist = useCallback(
    async (productId: string) => {
      if (!user) {
        showToast('Please sign in to save items to your wishlist.', 'info');
        return;
      }
      const currentlyIn = wishlist.some((w) => w.productId === productId);
      try {
        await toggleWishlistItem(user.uid, productId, currentlyIn);
        showToast(currentlyIn ? 'Removed from wishlist.' : 'Saved to wishlist.', 'success');
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Could not update wishlist.', 'error');
      }
    },
    [user, wishlist, showToast]
  );

  return (
    <StoreContext.Provider
      value={{
        loading,
        firebaseReady: isFirebaseConfigured,
        websiteSettings,
        shippingSettings,
        paymentSettings,
        homepageSettings,
        rewardsSettings,
        categories,
        subcategories,
        products,
        banners,
        flashSales,
        discountRules,
        cart,
        wishlist,
        savedAddresses,
        cartCount,
        activeFlashSalePrices,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        toggleWishlist,
        isInWishlist,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
