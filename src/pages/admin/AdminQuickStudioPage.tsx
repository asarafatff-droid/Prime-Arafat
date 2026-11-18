import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Check,
  Edit,
  ImagePlus,
  Link2,
  Palette,
  Plus,
  Power,
  Save,
  Sparkles,
  Trash2,
  UserCircle2,
  Zap,
} from 'lucide-react';
import { CloudImageUploader } from '../../components/admin/CloudImageUploader';
import { useToast } from '../../contexts/ToastContext';
import { listCategories, listProducts } from '../../services/catalogService';
import {
  createBanner,
  deleteBanner,
  listBanners,
  updateBanner,
} from '../../services/marketingService';
import {
  DEFAULT_WEBSITE_SETTINGS,
  fetchSetting,
  saveSetting,
} from '../../services/settingsService';
import type { Banner, BannerPlacement, Category, Product, WebsiteSettingsData } from '../../types';

type StudioTab = 'profile' | 'banner' | 'flash-banner' | 'theme';

const THEME_PRESETS = [
  { id: 'daraz_orange', name: 'Daraz Classic Orange', color: '#F85606' },
  { id: 'emerald', name: 'Emerald Fresh', color: '#059669' },
  { id: 'royal_blue', name: 'Royal Marketplace Blue', color: '#2563EB' },
  { id: 'crimson', name: 'Flash Crimson Red', color: '#DC2626' },
  { id: 'midnight', name: 'Midnight Dark Slate', color: '#0F172A' },
  { id: 'purple', name: 'Imperial Purple', color: '#7C3AED' },
];

const BANNER_STRIP_COLORS = [
  '#F85606',
  '#DC2626',
  '#059669',
  '#2563EB',
  '#7C3AED',
  '#0F172A',
  '#D97706',
];

export function AdminQuickStudioPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();

  const paramTab = searchParams.get('tab');
  const activeTab: StudioTab =
    paramTab === 'banner' ||
    paramTab === 'flash-banner' ||
    paramTab === 'theme' ||
    paramTab === 'profile'
      ? paramTab
      : 'profile';

  const setTab = (next: StudioTab) => {
    setSearchParams({ tab: next }, { replace: true });
  };

  const [loading, setLoading] = useState(true);
  const [savingWebsite, setSavingWebsite] = useState(false);
  const [websiteForm, setWebsiteForm] = useState<WebsiteSettingsData>(DEFAULT_WEBSITE_SETTINGS);

  // Catalog lists for clickable destination picker
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Banner quick state (shared for 'banner' & 'flash-banner')
  const [banners, setBanners] = useState<Banner[]>([]);
  const [savingBanner, setSavingBanner] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerDiscountText, setBannerDiscountText] = useState('');
  const [bannerDescription, setBannerDescription] = useState('');
  const [bannerPlacement, setBannerPlacement] = useState<BannerPlacement>('top_strip');
  const [bannerAccentColor, setBannerAccentColor] = useState('#F85606');
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [bannerLinkUrl, setBannerLinkUrl] = useState('/products');
  const [bannerOrder, setBannerOrder] = useState('0');
  const [bannerActive, setBannerActive] = useState(true);

  // Flash / Discount multi-banner quick uploader state
  const [flashPlacement, setFlashPlacement] = useState<BannerPlacement>('flash_sale');
  const [flashLinkUrl, setFlashLinkUrl] = useState('/products');
  const [flashDiscountText, setFlashDiscountText] = useState('FLASH SALE');
  const [flashAccentColor, setFlashAccentColor] = useState('#DC2626');
  const [flashTitlePrefix, setFlashTitlePrefix] = useState('Flash Offer');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [ws, bans, prods, cats] = await Promise.all([
        fetchSetting('website', DEFAULT_WEBSITE_SETTINGS),
        listBanners(false),
        listProducts(false),
        listCategories(false),
      ]);
      setWebsiteForm(ws);
      setBanners(bans);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load studio data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const persistWebsite = async (next: WebsiteSettingsData, message: string) => {
    setSavingWebsite(true);
    try {
      await saveSetting('website', next);
      setWebsiteForm(next);
      showToast(message, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save changes.', 'error');
    } finally {
      setSavingWebsite(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await persistWebsite(
      {
        ...websiteForm,
        websiteName: websiteForm.websiteName.trim() || 'AS World',
      },
      'Profile, App Logo & Storefront branding saved permanently!'
    );
  };

  const handleSaveTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    await persistWebsite(websiteForm, 'Theme & Appearance updated permanently!');
  };

  const resetBannerForm = () => {
    setEditingBannerId(null);
    setBannerTitle('');
    setBannerDiscountText('');
    setBannerDescription('');
    setBannerPlacement('top_strip');
    setBannerAccentColor('#F85606');
    setBannerImageUrl('');
    setBannerLinkUrl('/products');
    setBannerOrder('0');
    setBannerActive(true);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bannerPlacement !== 'top_strip' && !bannerImageUrl) {
      showToast('Please upload or paste a banner image for slider banners.', 'error');
      return;
    }
    setSavingBanner(true);
    try {
      const payload = {
        title: bannerTitle,
        description: bannerDescription,
        discountText: bannerDiscountText,
        accentColor: bannerAccentColor,
        placement: bannerPlacement,
        desktopImageUrl: bannerImageUrl,
        mobileImageUrl: bannerImageUrl,
        linkUrl: bannerLinkUrl,
        displayOrder: Number(bannerOrder) || 0,
        active: bannerActive,
      };
      if (editingBannerId) {
        await updateBanner(editingBannerId, payload);
        showToast('Banner updated!', 'success');
      } else {
        await createBanner(payload);
        showToast('Banner added to storefront!', 'success');
      }
      resetBannerForm();
      setBanners(await listBanners(false));
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not save banner.', 'error');
    } finally {
      setSavingBanner(false);
    }
  };

  const handleBatchDiscountBanners = async (urls: string[]) => {
    if (!urls.length) return;
    setSavingBanner(true);
    try {
      const baseOrder = banners.length;
      for (let i = 0; i < urls.length; i++) {
        await createBanner({
          title: `${flashTitlePrefix.trim() || 'Discount Banner'} #${baseOrder + i + 1}`,
          description: 'Tap banner to explore offer products',
          discountText: flashDiscountText.trim() || 'SPECIAL OFFER',
          accentColor: flashAccentColor,
          placement: flashPlacement,
          desktopImageUrl: urls[i],
          mobileImageUrl: urls[i],
          linkUrl: flashLinkUrl || '/products',
          displayOrder: baseOrder + i,
          active: true,
        });
      }
      setBanners(await listBanners(false));
      showToast(
        `${urls.length} discount banner${urls.length > 1 ? 's' : ''} uploaded & published!`,
        'success'
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create banners.', 'error');
    } finally {
      setSavingBanner(false);
    }
  };

  const destinationSelectOptions = (onSelect: (url: string) => void, currentVal: string) => (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-semibold text-slate-700 inline-flex items-center gap-1">
          <Link2 className="w-3.5 h-3.5 text-[#F85606]" />
          <span>Click Destination (Tap Banner Opens)</span>
        </label>
      </div>
      <select
        value={
          ['/products', '/vouchers', '/coins-games', '/products?flash=1'].includes(currentVal) ||
          currentVal.startsWith('/product/') ||
          currentVal.startsWith('/products?category=')
            ? currentVal
            : 'custom'
        }
        onChange={(e) => {
          if (e.target.value !== 'custom') {
            onSelect(e.target.value);
          }
        }}
        className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs bg-white"
      >
        <option value="/products">All Marketplace Products (/products)</option>
        <option value="/products?flash=1">Flash Sale Products</option>
        <option value="/vouchers">Vouchers &amp; Coupons (/vouchers)</option>
        <option value="/coins-games">AS Coins &amp; Mini-Games (/coins-games)</option>
        {categories.length > 0 && (
          <optgroup label="Categories">
            {categories.map((c) => (
              <option key={c.id} value={`/products?category=${c.id}`}>
                Category: {c.name}
              </option>
            ))}
          </optgroup>
        )}
        {products.length > 0 && (
          <optgroup label="Specific Products">
            {products.slice(0, 60).map((p) => (
              <option key={p.id} value={`/product/${p.id}`}>
                Product: {p.name}
              </option>
            ))}
          </optgroup>
        )}
        <option value="custom">Custom URL / Link</option>
      </select>
      <input
        type="text"
        value={currentVal}
        onChange={(e) => onSelect(e.target.value)}
        placeholder="/products or /product/prod_... or https://..."
        className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs font-mono"
      />
    </div>
  );

  const flashBanners = banners.filter(
    (b) => b.placement === 'flash_sale' || b.placement === 'top_strip'
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Quick Add Studio — Profile, Banners, Flash &amp; Theme
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Dedicated studio for Square App Logo, Official Logo, Favicon, Unlimited Discount / Flash
            Sale Banners, WhatsApp Contact &amp; Theme.
          </p>
        </div>

        <div className="inline-flex flex-wrap gap-1 p-1 bg-slate-200/70 rounded-xl">
          <button
            type="button"
            onClick={() => setTab('profile')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 transition-all ${
              activeTab === 'profile' ? 'bg-white text-[#F85606] shadow-xs' : 'text-slate-600'
            }`}
          >
            <UserCircle2 className="w-4 h-4" />
            <span>Profile &amp; Logo Add</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('banner')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 transition-all ${
              activeTab === 'banner' ? 'bg-white text-[#F85606] shadow-xs' : 'text-slate-600'
            }`}
          >
            <ImagePlus className="w-4 h-4" />
            <span>Banner Add</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('flash-banner')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 transition-all ${
              activeTab === 'flash-banner'
                ? 'bg-white text-[#F85606] shadow-xs'
                : 'text-slate-600'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Discount / Flash Banner</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('theme')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 transition-all ${
              activeTab === 'theme' ? 'bg-white text-[#F85606] shadow-xs' : 'text-slate-600'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Theme Add</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-500">
          Loading Quick Studio...
        </div>
      ) : activeTab === 'profile' ? (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. Square App Logo (1:1) */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <div>
                <h2 className="font-display text-base font-bold text-slate-900">
                  Square App Logo (1:1 চারকোনা লোগো)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Shown as the rounded-square AS World app icon &amp; brand profile picture.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-4">
                {websiteForm.squareLogoUrl ? (
                  <img
                    src={websiteForm.squareLogoUrl}
                    alt="Square App Logo"
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-xs bg-white shrink-0"
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-2xl font-display font-black text-white text-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: websiteForm.themePrimaryColor || '#F85606' }}
                  >
                    AS
                  </div>
                )}
                <div className="text-xs text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-800">
                    {websiteForm.squareLogoUrl ? 'Square App Icon Active' : 'Using Default Badge'}
                  </p>
                  {websiteForm.squareLogoUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        void persistWebsite(
                          { ...websiteForm, squareLogoUrl: '' },
                          'Square App Logo removed.'
                        )
                      }
                      className="text-red-600 hover:underline font-medium inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>

              <CloudImageUploader
                folder="branding"
                label="Upload Square App Logo (1:1)"
                acceptIco
                onUploaded={(urls) => {
                  const url = urls[0] || '';
                  if (url) {
                    void persistWebsite(
                      { ...websiteForm, squareLogoUrl: url },
                      'Square App Logo uploaded & saved!'
                    );
                  }
                }}
              />
            </div>

            {/* 2. Official Wide Logo */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <div>
                <h2 className="font-display text-base font-bold text-slate-900">
                  Official Header Logo
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Displayed in Desktop Header, Mobile Header, and Footer.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 min-h-[96px]">
                {websiteForm.logoUrl ? (
                  <img
                    src={websiteForm.logoUrl}
                    alt="Official Logo"
                    referrerPolicy="no-referrer"
                    className="max-h-14 w-auto object-contain"
                  />
                ) : (
                  <span className="text-xs text-slate-400">No official wide logo uploaded yet</span>
                )}
                {websiteForm.logoUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      void persistWebsite({ ...websiteForm, logoUrl: '' }, 'Official Logo removed.')
                    }
                    className="text-xs text-red-600 hover:underline font-medium shrink-0"
                  >
                    Remove
                  </button>
                )}
              </div>

              <CloudImageUploader
                folder="branding"
                label="Upload Official Logo"
                acceptIco
                onUploaded={(urls) => {
                  const url = urls[0] || '';
                  if (url) {
                    void persistWebsite(
                      { ...websiteForm, logoUrl: url },
                      'Official Storefront Logo uploaded & saved!'
                    );
                  }
                }}
              />
            </div>

            {/* 3. Browser Favicon */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <div>
                <h2 className="font-display text-base font-bold text-slate-900">
                  Browser Tab Favicon
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Small square icon shown in browser tabs (PNG, WebP, SVG, or ICO).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 min-h-[96px]">
                <div className="flex items-center gap-3">
                  {websiteForm.faviconUrl ? (
                    <img
                      src={websiteForm.faviconUrl}
                      alt="Favicon"
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 rounded-lg object-contain bg-white border border-slate-200 p-1"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xs text-slate-400">
                      —
                    </div>
                  )}
                  <span className="text-xs text-slate-600">
                    {websiteForm.faviconUrl ? 'Custom Favicon Active' : 'No custom favicon set'}
                  </span>
                </div>
                {websiteForm.faviconUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      void persistWebsite({ ...websiteForm, faviconUrl: '' }, 'Favicon removed.')
                    }
                    className="text-xs text-red-600 hover:underline font-medium"
                  >
                    Remove
                  </button>
                )}
              </div>

              <CloudImageUploader
                folder="branding"
                label="Upload Favicon"
                acceptIco
                onUploaded={(urls) => {
                  const url = urls[0] || '';
                  if (url) {
                    void persistWebsite(
                      { ...websiteForm, faviconUrl: url },
                      'Favicon uploaded & saved!'
                    );
                  }
                }}
              />
            </div>
          </div>

          {/* Store Profile Info */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h2 className="font-display text-base font-bold text-slate-900">
              Store Profile &amp; WhatsApp Contact Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Store Name *
                </label>
                <input
                  type="text"
                  required
                  value={websiteForm.websiteName}
                  onChange={(e) =>
                    setWebsiteForm((f) => ({ ...f, websiteName: e.target.value }))
                  }
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tagline / Short Bio
                </label>
                <input
                  type="text"
                  value={websiteForm.storeTagline || ''}
                  onChange={(e) =>
                    setWebsiteForm((f) => ({ ...f, storeTagline: e.target.value }))
                  }
                  placeholder="Bangladesh Premium Marketplace"
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Support Phone
                </label>
                <input
                  type="text"
                  value={websiteForm.supportPhone}
                  onChange={(e) =>
                    setWebsiteForm((f) => ({ ...f, supportPhone: e.target.value }))
                  }
                  placeholder="01XXXXXXXXX"
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  WhatsApp Number (Order &amp; Chat)
                </label>
                <input
                  type="text"
                  value={websiteForm.whatsappNumber || ''}
                  onChange={(e) =>
                    setWebsiteForm((f) => ({ ...f, whatsappNumber: e.target.value }))
                  }
                  placeholder="01XXXXXXXXX or +8801..."
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Support Email
                </label>
                <input
                  type="email"
                  value={websiteForm.contactEmail}
                  onChange={(e) =>
                    setWebsiteForm((f) => ({ ...f, contactEmail: e.target.value }))
                  }
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingWebsite}
                className="h-10 px-5 bg-[#F85606] hover:bg-[#E04A00] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{savingWebsite ? 'Saving...' : 'Save Profile Info'}</span>
              </button>
            </div>
          </div>
        </form>
      ) : activeTab === 'flash-banner' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4 h-fit">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#F85606]" />
              <div>
                <h2 className="font-display text-base font-bold text-slate-900">
                  Upload Unlimited Discount / Flash Banners
                </h2>
                <p className="text-xs text-slate-500">
                  Select multiple files at once! Banners scroll left &amp; right on mobile home and
                  open your chosen product, category, or offer page.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Placement Strip
                </label>
                <select
                  value={flashPlacement}
                  onChange={(e) => setFlashPlacement(e.target.value as BannerPlacement)}
                  className="w-full h-9 px-2.5 border border-slate-200 rounded-lg text-xs bg-white"
                >
                  <option value="flash_sale">Flash / Discount Strip (Scrollable)</option>
                  <option value="top_strip">Top Slim Strip (Below Search Bar)</option>
                  <option value="main">Main Hero Slider</option>
                  <option value="promotional">Promotional Banner</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Discount Tag Badge
                </label>
                <input
                  type="text"
                  value={flashDiscountText}
                  onChange={(e) => setFlashDiscountText(e.target.value)}
                  placeholder="e.g. UP TO 50% OFF"
                  className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Banner Title Prefix
                </label>
                <input
                  type="text"
                  value={flashTitlePrefix}
                  onChange={(e) => setFlashTitlePrefix(e.target.value)}
                  placeholder="e.g. Mega Flash Offer"
                  className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Strip Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={flashAccentColor}
                    onChange={(e) => setFlashAccentColor(e.target.value)}
                    className="w-9 h-9 p-0.5 border border-slate-200 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={flashAccentColor}
                    onChange={(e) => setFlashAccentColor(e.target.value)}
                    className="flex-1 h-9 px-2.5 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {destinationSelectOptions(setFlashLinkUrl, flashLinkUrl)}

            <CloudImageUploader
              folder="banners"
              multiple
              label="Upload Unlimited Discount / Flash Banners (Multi-Select)"
              helperText="Select 1, 5, or 20+ banner photos at once. Each photo auto-saves as a live scrollable banner!"
              onUploaded={(urls) => {
                void handleBatchDiscountBanners(urls);
              }}
            />

            {savingBanner && (
              <p className="text-xs font-semibold text-[#F85606] text-center">
                Saving uploaded banners to storefront...
              </p>
            )}
          </div>

          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-slate-900">
                Active Discount &amp; Flash Banners ({flashBanners.length})
              </h2>
              <span className="text-xs text-slate-500">
                Total All Banners: {banners.length}
              </span>
            </div>

            {flashBanners.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-10 text-center text-sm text-slate-500">
                No flash or discount strip banners uploaded yet. Use the multi-photo uploader on the
                left to upload unlimited clickable offer banners!
              </div>
            ) : (
              flashBanners.map((b) => (
                <div
                  key={b.id}
                  className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-20 h-12 rounded-lg overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ backgroundColor: b.accentColor || '#DC2626' }}
                    >
                      {b.desktopImageUrl || b.mobileImageUrl ? (
                        <img
                          src={b.desktopImageUrl || b.mobileImageUrl}
                          alt={b.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        b.discountText || 'FLASH'
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-900 truncate">{b.title}</p>
                        {b.discountText && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-600 shrink-0">
                            {b.discountText}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        {b.placement === 'flash_sale' ? 'Flash Discount Strip' : 'Top Scroll Strip'}{' '}
                        · Link: <span className="font-mono">{b.linkUrl || '/products'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={async () => {
                        await updateBanner(b.id, { active: !b.active });
                        setBanners(await listBanners(false));
                      }}
                      title={b.active ? 'Hide banner' : 'Activate banner'}
                      className={`p-1.5 rounded-lg ${
                        b.active ? 'text-emerald-700 bg-emerald-50' : 'text-slate-400 bg-slate-100'
                      }`}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingBannerId(b.id);
                        setBannerTitle(b.title);
                        setBannerDescription(b.description || '');
                        setBannerDiscountText(b.discountText || '');
                        setBannerAccentColor(b.accentColor || '#F85606');
                        setBannerPlacement(b.placement);
                        setBannerImageUrl(b.desktopImageUrl || b.mobileImageUrl || '');
                        setBannerLinkUrl(b.linkUrl || '/products');
                        setBannerOrder(String(b.displayOrder));
                        setBannerActive(b.active);
                        setTab('banner');
                      }}
                      title="Edit banner"
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-700"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteBanner(b.id);
                        showToast('Discount banner deleted.', 'info');
                        setBanners(await listBanners(false));
                      }}
                      title="Delete banner"
                      className="p-1.5 rounded-lg border border-slate-200 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : activeTab === 'banner' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleSaveBanner}
            className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4 h-fit"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#F85606]" />
              <h2 className="font-display text-base font-bold text-slate-900">
                {editingBannerId
                  ? 'Edit Discount / Top Banner'
                  : 'Add Discount / Slim Top Banner'}
              </h2>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Banner Placement
              </label>
              <select
                value={bannerPlacement}
                onChange={(e) => setBannerPlacement(e.target.value as BannerPlacement)}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm bg-white"
              >
                <option value="top_strip">
                  Slim Top Scrollable Strip (Below Search Bar)
                </option>
                <option value="flash_sale">Flash Sale / Discount Scroll Strip</option>
                <option value="main">Main Hero Slider</option>
                <option value="promotional">Promotional Grid Banner</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Offer / Discount Tag
                </label>
                <input
                  type="text"
                  value={bannerDiscountText}
                  onChange={(e) => setBannerDiscountText(e.target.value)}
                  placeholder="e.g. UP TO 50% OFF"
                  className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  min="0"
                  value={bannerOrder}
                  onChange={(e) => setBannerOrder(e.target.value)}
                  className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Banner Title *
              </label>
              <input
                type="text"
                required
                value={bannerTitle}
                onChange={(e) => setBannerTitle(e.target.value)}
                placeholder="e.g. Mega Winter Sale — Order Today!"
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Short Subtitle / Offer Details
              </label>
              <input
                type="text"
                value={bannerDescription}
                onChange={(e) => setBannerDescription(e.target.value)}
                placeholder="e.g. Limited time offer across 64 districts"
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Banner Strip Accent Color
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {BANNER_STRIP_COLORS.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setBannerAccentColor(hex)}
                    className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center ${
                      bannerAccentColor === hex ? 'border-slate-900 scale-105' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: hex }}
                  >
                    {bannerAccentColor === hex && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                ))}
                <input
                  type="color"
                  value={bannerAccentColor}
                  onChange={(e) => setBannerAccentColor(e.target.value)}
                  className="w-8 h-7 p-0 border border-slate-200 rounded cursor-pointer"
                />
              </div>
            </div>

            <CloudImageUploader
              folder="banners"
              label={
                bannerPlacement === 'top_strip'
                  ? 'Slim Banner Image (Optional — makes sleek image card)'
                  : 'Banner Image'
              }
              onUploaded={(urls) => setBannerImageUrl(urls[0] || '')}
            />
            {bannerImageUrl && (
              <div className="relative rounded-lg overflow-hidden border border-slate-200 aspect-[16/5]">
                <img
                  src={bannerImageUrl}
                  alt="Preview"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setBannerImageUrl('')}
                  className="absolute top-2 right-2 px-2 py-0.5 bg-black/70 text-white text-[10px] rounded"
                >
                  Remove
                </button>
              </div>
            )}

            {destinationSelectOptions(setBannerLinkUrl, bannerLinkUrl)}

            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={bannerActive}
                onChange={(e) => setBannerActive(e.target.checked)}
              />
              <span>Show Immediately on Storefront</span>
            </label>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={savingBanner}
                className="flex-1 h-10 bg-[#F85606] hover:bg-[#E04A00] text-white text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>
                  {savingBanner ? 'Saving...' : editingBannerId ? 'Update Banner' : 'Add Banner'}
                </span>
              </button>
              {editingBannerId && (
                <button
                  type="button"
                  onClick={resetBannerForm}
                  className="px-3 h-10 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="lg:col-span-7 space-y-3">
            <h2 className="font-display text-base font-bold text-slate-900">
              All Banners ({banners.length})
            </h2>
            {banners.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-10 text-center text-sm text-slate-500">
                No banners added yet. Add multiple slim top banners on the left to enable the
                two-way horizontal scrollable discount strip below the search bar!
              </div>
            ) : (
              banners.map((b) => (
                <div
                  key={b.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-16 h-12 rounded-lg overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ backgroundColor: b.accentColor || '#F85606' }}
                    >
                      {b.desktopImageUrl || b.mobileImageUrl ? (
                        <img
                          src={b.desktopImageUrl || b.mobileImageUrl}
                          alt={b.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        b.discountText || 'OFFER'
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-900 truncate">{b.title}</p>
                        {b.discountText && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#FFF5F0] text-[#F85606] shrink-0">
                            {b.discountText}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate">
                        {b.placement === 'top_strip'
                          ? 'Top Scroll Strip'
                          : b.placement === 'flash_sale'
                          ? 'Flash Discount Strip'
                          : b.placement}{' '}
                        · Order {b.displayOrder} ·{' '}
                        <span className={b.active ? 'text-emerald-700' : 'text-slate-400'}>
                          {b.active ? 'Active' : 'Inactive'}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={async () => {
                        await updateBanner(b.id, { active: !b.active });
                        setBanners(await listBanners(false));
                      }}
                      className={`p-1.5 rounded-lg ${
                        b.active ? 'text-emerald-700 bg-emerald-50' : 'text-slate-400 bg-slate-100'
                      }`}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingBannerId(b.id);
                        setBannerTitle(b.title);
                        setBannerDescription(b.description || '');
                        setBannerDiscountText(b.discountText || '');
                        setBannerAccentColor(b.accentColor || '#F85606');
                        setBannerPlacement(b.placement);
                        setBannerImageUrl(b.desktopImageUrl || b.mobileImageUrl || '');
                        setBannerLinkUrl(b.linkUrl || '/products');
                        setBannerOrder(String(b.displayOrder));
                        setBannerActive(b.active);
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-700"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteBanner(b.id);
                        showToast('Banner deleted.', 'info');
                        setBanners(await listBanners(false));
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSaveTheme} className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div>
            <h2 className="font-display text-base font-bold text-slate-900">
              Marketplace Theme &amp; Colors
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select a color theme preset or set a custom hex color for AS World branding.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {THEME_PRESETS.map((preset) => {
              const selected =
                (websiteForm.themePrimaryColor || '#F85606').toLowerCase() ===
                preset.color.toLowerCase();
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() =>
                    setWebsiteForm((f) => ({
                      ...f,
                      themePreset: preset.id,
                      themePrimaryColor: preset.color,
                    }))
                  }
                  className={`p-3 rounded-xl border text-left space-y-2 transition-all ${
                    selected
                      ? 'border-slate-900 ring-2 ring-[#F85606]/25 bg-slate-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div
                    className="w-full h-8 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: preset.color }}
                  >
                    {selected && <Check className="w-4 h-4" />}
                  </div>
                  <p className="text-xs font-semibold text-slate-800 leading-tight">
                    {preset.name}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Custom Primary Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={websiteForm.themePrimaryColor || '#F85606'}
                  onChange={(e) =>
                    setWebsiteForm((f) => ({
                      ...f,
                      themePreset: 'custom',
                      themePrimaryColor: e.target.value,
                    }))
                  }
                  className="w-12 h-10 p-0.5 border border-slate-200 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={websiteForm.themePrimaryColor || '#F85606'}
                  onChange={(e) =>
                    setWebsiteForm((f) => ({
                      ...f,
                      themePreset: 'custom',
                      themePrimaryColor: e.target.value,
                    }))
                  }
                  className="flex-1 h-10 px-3 border border-slate-200 rounded-lg text-sm font-mono uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Top Announcement Notice Text
              </label>
              <input
                type="text"
                value={websiteForm.announcementBar}
                onChange={(e) =>
                  setWebsiteForm((f) => ({ ...f, announcementBar: e.target.value }))
                }
                placeholder="e.g. Free Delivery on orders over ৳1,500!"
                className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={websiteForm.announcementActive}
                onChange={(e) =>
                  setWebsiteForm((f) => ({ ...f, announcementActive: e.target.checked }))
                }
              />
              <span>Show Top Announcement Strip</span>
            </label>

            <button
              type="submit"
              disabled={savingWebsite}
              className="h-10 px-6 bg-[#F85606] hover:bg-[#E04A00] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{savingWebsite ? 'Saving...' : 'Save Theme Settings'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
