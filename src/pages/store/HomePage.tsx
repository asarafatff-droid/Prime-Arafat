import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Coins,
  FolderTree,
  Gamepad2,
  Layers,
  Package,
  Share2,
  ShieldCheck,
  Sparkles,
  Tag,
  Ticket,
  Truck,
  UserCheck,
  Zap,
} from 'lucide-react';
import { CountdownTimer } from '../../components/common/CountdownTimer';
import { EmptyState } from '../../components/common/EmptyState';
import { ImageWithFallback } from '../../components/common/ImageWithFallback';
import { ProductCard } from '../../components/common/ProductCard';
import { useAuth } from '../../contexts/AuthContext';
import { useStore } from '../../contexts/StoreContext';
import { getRecentlyViewedIds } from '../../lib/searchHistory';
import { formatPrice, isWithinSchedule } from '../../lib/utils';
import type { Banner, Product } from '../../types';

export function HomePage() {
  const { user, customerProfile } = useAuth();
  const {
    loading,
    websiteSettings,
    shippingSettings,
    rewardsSettings,
    categories,
    subcategories,
    products,
    banners,
    flashSales,
    homepageSettings,
    activeFlashSalePrices,
  } = useStore();

  const [activeSlide, setActiveSlide] = useState(0);
  const [hoveredCatId, setHoveredCatId] = useState<string | null>(null);
  const [discoverTab, setDiscoverTab] = useState<'all' | 'deals' | 'popular' | 'newest'>('all');
  const [discoverCategoryId, setDiscoverCategoryId] = useState<string>('');
  const [discoverLimit, setDiscoverLimit] = useState<number>(20);
  const stripScrollRef = useRef<HTMLDivElement>(null);

  const symbol = websiteSettings.currencySymbol || '৳';

  // Slim top & flash offer strip banners (scrollable two-way right below search bar)
  const topStripBanners = useMemo(() => {
    return banners.filter(
      (b) => b.placement === 'top_strip' || b.placement === 'flash_sale'
    );
  }, [banners]);

  const scrollTopStrip = (direction: 'left' | 'right') => {
    const el = stripScrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction === 'left' ? -300 : 300,
      behavior: 'smooth',
    });
  };

  // Main hero banners (main, desktop, mobile)
  const heroBanners = useMemo(() => {
    return banners.filter(
      (b) =>
        ['main', 'desktop', 'mobile'].includes(b.placement) &&
        (b.desktopImageUrl || b.mobileImageUrl)
    );
  }, [banners]);

  const promoBanners = useMemo(() => {
    return banners.filter(
      (b) =>
        ['promotional', 'campaign', 'sponsored', 'category'].includes(b.placement) &&
        (b.desktopImageUrl || b.mobileImageUrl)
    );
  }, [banners]);

  const activeFlashSales = useMemo(() => {
    return flashSales.filter(
      (fs) => fs.active && isWithinSchedule(fs.startDate, fs.endDate) && (fs.items?.length ?? 0) > 0
    );
  }, [flashSales]);

  useEffect(() => {
    if (heroBanners.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroBanners.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [heroBanners.length]);

  useEffect(() => {
    if (activeSlide >= heroBanners.length) {
      setActiveSlide(0);
    }
  }, [heroBanners.length, activeSlide]);

  const productMap = useMemo(() => {
    const map = new Map<string, Product>();
    for (const p of products) map.set(p.id, p);
    return map;
  }, [products]);

  const recentlyViewedProducts = useMemo(() => {
    const ids = getRecentlyViewedIds();
    return ids
      .map((id) => productMap.get(id))
      .filter((p): p is Product => Boolean(p))
      .slice(0, 10);
  }, [productMap]);

  const recommendedProducts = useMemo(
    () => products.filter((p) => p.recommended).slice(0, 10),
    [products]
  );
  const trendingProducts = useMemo(
    () => products.filter((p) => p.trending).slice(0, 10),
    [products]
  );
  const newArrivalProducts = useMemo(
    () =>
      (products.some((p) => p.newArrival)
        ? products.filter((p) => p.newArrival)
        : products
      ).slice(0, 10),
    [products]
  );
  const bestSellingProducts = useMemo(
    () =>
      [...products]
        .filter((p) => p.bestSelling || p.salesCount > 0)
        .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
        .slice(0, 10),
    [products]
  );
  const featuredProducts = useMemo(
    () => products.filter((p) => p.featured).slice(0, 10),
    [products]
  );

  const filteredDiscoverPool = useMemo(() => {
    const base = discoverCategoryId
      ? products.filter((p) => p.categoryId === discoverCategoryId)
      : products;

    if (discoverTab === 'deals') {
      return base.filter(
        (p) => (p.discountPrice && p.discountPrice < p.price) || activeFlashSalePrices[p.id]
      );
    }
    if (discoverTab === 'popular') {
      return [...base].sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
    }
    if (discoverTab === 'newest') {
      return [...base].sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
    }
    return base;
  }, [products, discoverTab, discoverCategoryId, activeFlashSalePrices]);

  const discoverProducts = useMemo(
    () => filteredDiscoverPool.slice(0, discoverLimit),
    [filteredDiscoverPool, discoverLimit]
  );

  const isSectionEnabled = (key: string) => {
    const found = homepageSettings.sections.find((s) => s.key === key);
    return found ? found.enabled : true;
  };

  const renderBannerImage = (banner: Banner) => {
    const content = (
      <div className="relative w-full h-full">
        {banner.desktopImageUrl && (
          <img
            src={banner.desktopImageUrl}
            alt={banner.title}
            referrerPolicy="no-referrer"
            className={`${
              banner.mobileImageUrl ? 'hidden md:block' : 'block'
            } w-full h-full object-cover`}
          />
        )}
        {banner.mobileImageUrl && (
          <img
            src={banner.mobileImageUrl}
            alt={banner.title}
            referrerPolicy="no-referrer"
            className={`${
              banner.desktopImageUrl ? 'block md:hidden' : 'block'
            } w-full h-full object-cover`}
          />
        )}
        {(banner.title || banner.description) && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent p-4 md:p-6 text-white">
            <h2 className="font-display text-base md:text-2xl font-bold leading-tight">
              {banner.title}
            </h2>
            {banner.description && (
              <p className="text-xs md:text-sm text-white/90 mt-1 line-clamp-2 max-w-xl">
                {banner.description}
              </p>
            )}
          </div>
        )}
      </div>
    );

    if (banner.linkUrl) {
      if (banner.linkUrl.startsWith('http')) {
        return (
          <a
            href={banner.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full h-full"
          >
            {content}
          </a>
        );
      }
      return (
        <Link to={banner.linkUrl} className="block w-full h-full">
          {content}
        </Link>
      );
    }
    return content;
  };

  const renderTopStripBanner = (banner: Banner) => {
    const stripImg = banner.mobileImageUrl || banner.desktopImageUrl;
    const bgAccent = banner.accentColor || websiteSettings.themePrimaryColor || '#F85606';
    const badgeLabel = banner.discountText || (banner.placement === 'flash_sale' ? 'FLASH SALE' : 'OFFER');

    const inner = (
      <div
        className="relative h-16 sm:h-[74px] md:h-[80px] w-[260px] sm:w-[300px] md:w-[336px] shrink-0 snap-start rounded-xl overflow-hidden border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-center justify-between gap-2.5 px-3.5 text-white"
        style={{
          background: stripImg
            ? '#0F172A'
            : `linear-gradient(125deg, ${bgAccent} 0%, #E04A00 100%)`,
        }}
      >
        {stripImg && (
          <>
            <img
              src={stripImg}
              alt={banner.title}
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/20" />
          </>
        )}

        <div className="relative z-10 flex items-center gap-2.5 min-w-0 flex-1">
          {!stripImg && (
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span
                className="text-[9px] md:text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white shrink-0"
                style={{ color: bgAccent }}
              >
                {badgeLabel}
              </span>
              <p className="text-xs md:text-sm font-bold truncate drop-shadow-xs">{banner.title}</p>
            </div>
            {banner.description && (
              <p className="text-[10px] md:text-xs text-white/90 truncate mt-0.5 drop-shadow-xs">
                {banner.description}
              </p>
            )}
          </div>
        </div>

        {banner.linkUrl && (
          <span className="relative z-10 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center shrink-0">
            <ArrowRight className="w-3.5 h-3.5 text-white" />
          </span>
        )}
      </div>
    );

    if (banner.linkUrl) {
      if (banner.linkUrl.startsWith('http')) {
        return (
          <a
            key={banner.id}
            href={banner.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 snap-start"
          >
            {inner}
          </a>
        );
      }
      return (
        <Link key={banner.id} to={banner.linkUrl} className="shrink-0 snap-start">
          {inner}
        </Link>
      );
    }
    return (
      <div key={banner.id} className="shrink-0 snap-start">
        {inner}
      </div>
    );
  };

  const renderProductGrid = (title: string, items: Product[], viewAllQuery?: string) => {
    if (items.length === 0) return null;
    return (
      <section className="space-y-3.5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-base md:text-xl font-bold text-slate-900">{title}</h2>
          <Link
            to={viewAllQuery ? `/products?${viewAllQuery}` : '/products'}
            className="text-xs md:text-sm font-semibold text-[#F85606] hover:text-[#E04A00] whitespace-nowrap shrink-0"
          >
            Shop More &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 md:gap-4">
          {items.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              flashSalePrice={activeFlashSalePrices[p.id]}
            />
          ))}
        </div>
      </section>
    );
  };

  const hasHeroArea = heroBanners.length > 0 || categories.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-2.5 md:px-6 py-3.5 md:py-6 space-y-5 md:space-y-8">
      {/* Slim Horizontal Bidirectional Scrollable Discount / Flash Strip */}
      {topStripBanners.length > 0 && (
        <section className="relative group">
          <div
            ref={stripScrollRef}
            className="flex items-center gap-2.5 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth pb-0.5"
          >
            {topStripBanners.map(renderTopStripBanner)}
          </div>

          {topStripBanners.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Scroll discount banners left"
                onClick={() => scrollTopStrip('left')}
                className="hidden sm:flex absolute left-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/95 border border-slate-200 text-slate-700 hover:text-[#F85606] shadow-md items-center justify-center z-20"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="Scroll discount banners right"
                onClick={() => scrollTopStrip('right')}
                className="hidden sm:flex absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/95 border border-slate-200 text-slate-700 hover:text-[#F85606] shadow-md items-center justify-center z-20"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
        </section>
      )}

      {/* Daraz-Style 3-Zone Desktop Hero: Categories Sidebar | Banner Slider | AS Member Hub */}
      {hasHeroArea && (
        <section
          className={`grid gap-4 items-stretch ${
            categories.length > 0 && heroBanners.length > 0
              ? 'lg:grid-cols-[230px_1fr] xl:grid-cols-[235px_1fr_240px]'
              : heroBanners.length > 0
              ? 'xl:grid-cols-[1fr_240px]'
              : 'grid-cols-1'
          }`}
        >
          {categories.length > 0 && (
            <aside
              onMouseLeave={() => setHoveredCatId(null)}
              className="hidden lg:flex flex-col relative bg-white border border-slate-200/80 rounded-2xl p-2 shadow-2xs"
            >
              <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 mb-1">
                Categories
              </div>
              <ul className="space-y-0.5 flex-1 overflow-y-auto max-h-[320px]">
                {categories.slice(0, 12).map((cat) => (
                  <li key={cat.id} onMouseEnter={() => setHoveredCatId(cat.id)}>
                    <Link
                      to={`/products?category=${cat.id}`}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors ${
                        hoveredCatId === cat.id
                          ? 'bg-[#FFF5F0] text-[#F85606] font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{cat.name}</span>
                      <ChevronRight className="w-3.5 h-3.5 opacity-50 shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>

              {hoveredCatId && (
                <div className="absolute left-full top-0 ml-1.5 w-64 min-h-full bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-30">
                  <h4 className="font-display text-sm font-bold text-slate-900 mb-2">
                    {categories.find((c) => c.id === hoveredCatId)?.name}
                  </h4>
                  {subcategories.filter((s) => s.categoryId === hoveredCatId).length === 0 ? (
                    <p className="text-xs text-slate-500">View all products in this category.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {subcategories
                        .filter((s) => s.categoryId === hoveredCatId)
                        .map((sub) => (
                          <li key={sub.id}>
                            <Link
                              to={`/products?category=${hoveredCatId}&subcategory=${sub.id}`}
                              className="block text-sm text-slate-600 hover:text-[#F85606] py-0.5"
                            >
                              {sub.name}
                            </Link>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              )}
            </aside>
          )}

          {heroBanners.length > 0 && (
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-[16/9] md:aspect-[21/9] lg:h-full max-h-[380px] w-full border border-slate-200/80 shadow-xs">
              {renderBannerImage(heroBanners[activeSlide])}

              {heroBanners.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Previous banner"
                    onClick={() =>
                      setActiveSlide(
                        (prev) => (prev - 1 + heroBanners.length) % heroBanners.length
                      )
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/45 hover:bg-black/70 backdrop-blur-xs text-white flex items-center justify-center transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next banner"
                    onClick={() => setActiveSlide((prev) => (prev + 1) % heroBanners.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/45 hover:bg-black/70 backdrop-blur-xs text-white flex items-center justify-center transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-3 right-4 flex items-center gap-1.5">
                    {heroBanners.map((b, idx) => (
                      <button
                        key={b.id}
                        type="button"
                        aria-label={`Slide ${idx + 1}`}
                        onClick={() => setActiveSlide(idx)}
                        className={`h-2 rounded-full transition-all ${
                          idx === activeSlide ? 'w-6 bg-[#F85606]' : 'w-2 bg-white/65'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Daraz-Style Right Member & Wallet Card (Desktop XL) */}
          {heroBanners.length > 0 && (
            <div className="hidden xl:flex flex-col justify-between bg-gradient-to-b from-[#FFF5F0] via-white to-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-[#F85606] text-white flex items-center justify-center shrink-0">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">
                      {user ? 'Member Account' : 'Welcome Shopper'}
                    </p>
                    <p className="font-display text-sm font-bold text-slate-900 truncate">
                      {user
                        ? customerProfile?.name || user.displayName || 'AS Member'
                        : websiteSettings.websiteName || 'AS World'}
                    </p>
                  </div>
                </div>

                {rewardsSettings.coinsEnabled && (
                  <Link
                    to="/coins-games"
                    className="block p-3 rounded-xl bg-white border border-amber-200/90 hover:border-[#F85606] transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 inline-flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5 text-[#F85606]" />
                        AS Coins
                      </span>
                      <span className="font-mono tabular-nums font-bold text-[#F85606]">
                        {customerProfile?.coins || 0}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Play mini-games &amp; earn {rewardsSettings.referralOrderCommissionPct}% share commission
                    </p>
                  </Link>
                )}

                <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                  <p className="flex items-center gap-2">
                    <Truck className="w-3.5 h-3.5 text-[#F85606] shrink-0" />
                    <span>
                      Dhaka {formatPrice(shippingSettings.insideDhakaFee ?? 80, symbol)} · Nationwide{' '}
                      {formatPrice(shippingSettings.outsideDhakaFee ?? 120, symbol)}
                    </span>
                  </p>
                  <p className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Verified checkout &amp; order tracking</span>
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100">
                {user ? (
                  <>
                    <Link
                      to="/orders"
                      className="w-full py-2 bg-[#F85606] hover:bg-[#E04A00] text-white text-xs font-bold rounded-xl flex items-center justify-center transition-colors"
                    >
                      My Orders &amp; Tracking
                    </Link>
                    <Link
                      to="/coins-games?tab=refer"
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl flex items-center justify-center transition-colors"
                    >
                      Share &amp; Earn {rewardsSettings.referralOrderCommissionPct}%
                    </Link>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to="/login"
                      className="py-2 bg-[#F85606] hover:bg-[#E04A00] text-white text-xs font-bold rounded-xl text-center transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      className="py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl text-center transition-colors"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Daraz-Style Quick Service Shortcut Dock */}
      <section className="grid grid-cols-5 gap-2 md:gap-3 bg-white border border-slate-200/80 rounded-2xl p-2.5 md:p-4 text-center shadow-2xs">
        <Link
          to="/coins-games"
          className="group flex flex-col items-center gap-1.5 py-1.5 rounded-xl hover:bg-[#FFF5F0] transition-colors"
        >
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-[#FFF5F0] to-amber-100 text-[#F85606] flex items-center justify-center group-hover:scale-105 transition-transform">
            <Coins className="w-5 h-5" />
          </div>
          <span className="text-[11px] md:text-xs font-semibold text-slate-800 leading-tight">
            AS Coins
          </span>
        </Link>
        <Link
          to="/coins-games"
          className="group flex flex-col items-center gap-1.5 py-1.5 rounded-xl hover:bg-[#FFF5F0] transition-colors"
        >
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-[#FFF5F0] to-orange-100 text-[#F85606] flex items-center justify-center group-hover:scale-105 transition-transform">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <span className="text-[11px] md:text-xs font-semibold text-slate-800 leading-tight">
            Play &amp; Win
          </span>
        </Link>
        <Link
          to="/coins-games?tab=refer"
          className="group flex flex-col items-center gap-1.5 py-1.5 rounded-xl hover:bg-emerald-50 transition-colors"
        >
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-100 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Share2 className="w-5 h-5" />
          </div>
          <span className="text-[11px] md:text-xs font-semibold text-slate-800 leading-tight">
            Share {rewardsSettings.referralOrderCommissionPct}%
          </span>
        </Link>
        <Link
          to="/vouchers"
          className="group flex flex-col items-center gap-1.5 py-1.5 rounded-xl hover:bg-[#FFF5F0] transition-colors"
        >
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-orange-50 to-rose-100 text-[#F85606] flex items-center justify-center group-hover:scale-105 transition-transform">
            <Ticket className="w-5 h-5" />
          </div>
          <span className="text-[11px] md:text-xs font-semibold text-slate-800 leading-tight">
            Vouchers
          </span>
        </Link>
        <Link
          to="/categories"
          className="group flex flex-col items-center gap-1.5 py-1.5 rounded-xl hover:bg-slate-50 transition-colors"
        >
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200/70 text-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
            <FolderTree className="w-5 h-5" />
          </div>
          <span className="text-[11px] md:text-xs font-semibold text-slate-800 leading-tight">
            Categories
          </span>
        </Link>
      </section>

      {/* AS Coins & Referral Quick Promo Strip */}
      {rewardsSettings.coinsEnabled && (
        <section className="bg-gradient-to-r from-[#FFF5F0] via-amber-50/70 to-white border border-[#F85606]/20 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 text-xs md:text-sm">
            <Coins className="w-4 h-4 text-[#F85606] shrink-0" />
            <span className="text-slate-800 font-medium">
              {customerProfile?.coins
                ? `You have ${customerProfile.coins} AS Coins ready to save at checkout!`
                : `Play mini-games or invite friends to earn ${rewardsSettings.referralOrderCommissionPct}% order commission in AS Coins!`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/coins-games"
              className="px-3.5 py-1.5 bg-[#F85606] text-white text-xs font-bold rounded-xl hover:bg-[#E04A00] transition-colors"
            >
              Play &amp; Earn
            </Link>
            <Link
              to="/coins-games?tab=refer"
              className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-800 text-xs font-bold rounded-xl hover:border-[#F85606] transition-colors"
            >
              Share {rewardsSettings.referralOrderCommissionPct}%
            </Link>
          </div>
        </section>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 md:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-3 animate-pulse">
              <div className="aspect-square bg-slate-100 rounded-lg mb-3" />
              <div className="h-4 bg-slate-100 rounded w-3/4 mb-2" />
              <div className="h-4 bg-slate-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Daraz-Style Flash Sale Showcase */}
      {isSectionEnabled('flash_sale') &&
        activeFlashSales.map((campaign) => {
          const saleProducts = (campaign.items || [])
            .map((item) => ({
              item,
              product: productMap.get(item.productId),
            }))
            .filter((entry): entry is { item: typeof entry.item; product: Product } =>
              Boolean(entry.product)
            );
          if (saleProducts.length === 0) return null;

          return (
            <section
              key={campaign.id}
              className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs"
            >
              <div className="bg-gradient-to-r from-[#FFF5F0] via-white to-white px-4 py-3.5 md:px-5 md:py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#F85606] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-base md:text-xl font-bold text-slate-900">
                      {campaign.title}
                    </h2>
                    {campaign.subtitle && (
                      <p className="text-xs text-slate-500">{campaign.subtitle}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600">Ending in</span>
                    <CountdownTimer endDate={campaign.endDate} />
                  </div>
                  <Link
                    to="/products?flash=1"
                    className="text-xs font-bold text-[#F85606] hover:text-[#E04A00] whitespace-nowrap"
                  >
                    Shop All &rarr;
                  </Link>
                </div>
              </div>

              <div className="p-3 md:p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 md:gap-4">
                {saleProducts.map(({ item, product }) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    flashSalePrice={item.campaignPrice}
                    flashStockLimit={item.stockLimit}
                    flashSoldCount={item.soldCount}
                  />
                ))}
              </div>
            </section>
          );
        })}

      {/* Categories Section */}
      {!loading && isSectionEnabled('categories') && (
        <section className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base md:text-xl font-bold text-slate-900">
              Categories
            </h2>
            <Link
              to="/categories"
              className="text-xs md:text-sm font-semibold text-[#F85606] hover:text-[#E04A00]"
            >
              View All &rarr;
            </Link>
          </div>
          {categories.length === 0 ? (
            <EmptyState
              title="No categories created yet."
              description="Categories configured by the administrator will appear here."
              icon={<FolderTree className="w-6 h-6" />}
            />
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5 md:gap-3">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/products?category=${cat.id}`}
                  className="group bg-white border border-slate-200/80 rounded-2xl p-3 flex flex-col items-center text-center gap-2 hover:border-[#F85606]/50 hover:shadow-md transition-all"
                >
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl overflow-hidden bg-slate-50 shrink-0">
                    <ImageWithFallback
                      src={cat.imageUrl}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <span className="text-[11px] md:text-xs font-semibold text-slate-800 group-hover:text-[#F85606] line-clamp-2 leading-tight">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Promotional Campaign Banners */}
      {isSectionEnabled('promotional_campaigns') && promoBanners.length > 0 && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {promoBanners.map((banner) => (
            <div
              key={banner.id}
              className="relative rounded-2xl overflow-hidden border border-slate-200/80 aspect-[16/7] bg-slate-900 shadow-2xs"
            >
              {renderBannerImage(banner)}
            </div>
          ))}
        </section>
      )}

      {/* Recently Viewed Strip (Real Viewed Products Only) */}
      {recentlyViewedProducts.length > 0 && (
        <section className="space-y-3.5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-base md:text-xl font-bold text-slate-900">
              Recently Viewed
            </h2>
          </div>
          <div className="flex gap-2.5 md:gap-4 overflow-x-auto no-scrollbar pb-1">
            {recentlyViewedProducts.map((p) => (
              <div key={p.id} className="w-[162px] sm:w-[195px] shrink-0">
                <ProductCard product={p} flashSalePrice={activeFlashSalePrices[p.id]} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Product Collections & Daraz-Style Interactive Marketplace Discovery */}
      {!loading && products.length === 0 ? (
        <EmptyState
          title="No products available yet."
          description={`Welcome to ${
            websiteSettings.websiteName || 'AS World'
          }. Products added by the store administrator will appear here automatically.`}
          icon={<Package className="w-6 h-6" />}
        />
      ) : (
        <div className="space-y-7 md:space-y-9">
          {isSectionEnabled('featured') &&
            renderProductGrid('Featured Products', featuredProducts, 'featured=true')}
          {isSectionEnabled('recommended') &&
            renderProductGrid('Just For You', recommendedProducts)}
          {isSectionEnabled('trending') &&
            renderProductGrid('Trending Products', trendingProducts)}
          {isSectionEnabled('best_selling') &&
            renderProductGrid('Best Selling Products', bestSellingProducts, 'sort=popular')}
          {isSectionEnabled('new_arrivals') &&
            renderProductGrid('New Arrivals', newArrivalProducts, 'sort=newest')}

          {/* Custom Admin-Configured Product Collections */}
          {isSectionEnabled('collections') &&
            homepageSettings.collections
              .filter((c) => c.active)
              .map((col) => {
                const colProducts = col.productIds
                  .map((pid) => productMap.get(pid))
                  .filter((p): p is Product => Boolean(p));
                if (colProducts.length === 0) return null;
                return (
                  <section key={col.id} className="space-y-3.5">
                    <div className="flex items-center gap-2">
                      <Layers className="w-5 h-5 text-[#F85606]" />
                      <div>
                        <h2 className="font-display text-base md:text-xl font-bold text-slate-900">
                          {col.title}
                        </h2>
                        {col.subtitle && <p className="text-xs text-slate-500">{col.subtitle}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 md:gap-4">
                      {colProducts.map((p) => (
                        <ProductCard
                          key={p.id}
                          product={p}
                          flashSalePrice={activeFlashSalePrices[p.id]}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}

          {/* Interactive Daraz-Style Marketplace Discovery Grid with Category Filters + Load More */}
          {products.length > 0 && (
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-base md:text-xl font-bold text-slate-900">
                  Explore Marketplace
                </h2>
                <div className="inline-flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl overflow-x-auto no-scrollbar">
                  {[
                    { key: 'all', label: 'All' },
                    { key: 'deals', label: 'Top Deals' },
                    { key: 'popular', label: 'Best Selling' },
                    { key: 'newest', label: 'Newest' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => {
                        setDiscoverTab(tab.key as 'all' | 'deals' | 'popular' | 'newest');
                        setDiscoverLimit(20);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                        discoverTab === tab.key
                          ? 'bg-[#F85606] text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {categories.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setDiscoverCategoryId('');
                      setDiscoverLimit(20);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 ${
                      discoverCategoryId === ''
                        ? 'border-[#F85606] bg-[#FFF5F0] text-[#F85606]'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.slice(0, 10).map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setDiscoverCategoryId(cat.id);
                        setDiscoverLimit(20);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 ${
                        discoverCategoryId === cat.id
                          ? 'border-[#F85606] bg-[#FFF5F0] text-[#F85606]'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}

              {discoverProducts.length === 0 ? (
                <EmptyState
                  title="No matching products in this filter"
                  description="Try choosing another tab or category filter."
                  actionLabel="Show All Products"
                  onAction={() => {
                    setDiscoverTab('all');
                    setDiscoverCategoryId('');
                  }}
                />
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 md:gap-4">
                    {discoverProducts.map((p) => (
                      <ProductCard
                        key={p.id}
                        product={p}
                        flashSalePrice={activeFlashSalePrices[p.id]}
                      />
                    ))}
                  </div>

                  {filteredDiscoverPool.length > discoverProducts.length && (
                    <div className="flex justify-center pt-2">
                      <button
                        type="button"
                        onClick={() => setDiscoverLimit((prev) => prev + 20)}
                        className="px-8 py-2.5 bg-white border border-[#F85606] text-[#F85606] hover:bg-[#F85606] hover:text-white text-sm font-bold rounded-xl transition-colors shadow-2xs"
                      >
                        Load More Products ({filteredDiscoverPool.length - discoverProducts.length} more)
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          )}
        </div>
      )}

      {/* Trust Strip */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3 pt-1">
        {[
          { title: 'Verified Storefront', desc: 'Authentic items managed in AS World' },
          {
            title: 'All 64 Districts',
            desc: `Dhaka ${formatPrice(shippingSettings.insideDhakaFee ?? 80, symbol)} · Nationwide ${formatPrice(
              shippingSettings.outsideDhakaFee ?? 120,
              symbol
            )}`,
          },
          { title: 'bKash, Nagad & Rocket', desc: 'Easy mobile banking & COD options' },
          { title: 'Verified Buyer Reviews', desc: 'Genuine ratings from real orders' },
        ].map((item) => (
          <div
            key={item.title}
            className="bg-white border border-slate-200/80 rounded-2xl p-3.5 md:p-4 flex items-start gap-2.5 shadow-2xs"
          >
            <Tag className="w-4 h-4 text-[#F85606] shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs md:text-sm font-semibold text-slate-900">{item.title}</h3>
              <p className="text-[11px] md:text-xs text-slate-500 mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
