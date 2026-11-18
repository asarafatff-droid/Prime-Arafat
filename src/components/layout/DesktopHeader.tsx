import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  Clock,
  Coins,
  Flame,
  Heart,
  MessageCircle,
  Package,
  Search,
  ShoppingCart,
  User as UserIcon,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useStore } from '../../contexts/StoreContext';
import {
  addSearchHistory,
  buildWhatsAppUrl,
  clearSearchHistory,
  getSearchHistory,
  removeSearchHistoryItem,
} from '../../lib/searchHistory';
import { formatPrice, getEffectivePrice, isWithinSchedule } from '../../lib/utils';
import { Logo } from '../common/Logo';
import { HeaderQuickMenu } from './HeaderQuickMenu';

export function DesktopHeader() {
  const navigate = useNavigate();
  const { user, customerProfile, logout } = useAuth();
  const {
    websiteSettings,
    rewardsSettings,
    categories,
    products,
    flashSales,
    cartCount,
    wishlist,
  } = useStore();
  const [queryText, setQueryText] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => getSearchHistory());
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  const primaryColor = websiteSettings.themePrimaryColor || '#F85606';
  const hasActiveFlashSale = useMemo(
    () => flashSales.some((fs) => fs.active && isWithinSchedule(fs.startDate, fs.endDate)),
    [flashSales]
  );

  const whatsappUrl = buildWhatsAppUrl(
    websiteSettings.whatsappNumber,
    `Hello ${websiteSettings.websiteName || 'AS World'} Support!`
  );

  const suggestions = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.categoryName || '').toLowerCase().includes(q) ||
          (p.brand || '').toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [products, queryText]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setShowAccountMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const runSearchQuery = (raw: string) => {
    const trimmed = raw.trim();
    if (trimmed) {
      setSearchHistory(addSearchHistory(trimmed));
    }
    setShowSuggestions(false);
    navigate(`/products?q=${encodeURIComponent(trimmed)}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSearchQuery(queryText);
  };

  return (
    <header className="hidden md:block sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-[0_2px_16px_rgba(15,23,42,0.04)]">
      {websiteSettings.announcementActive && websiteSettings.announcementBar && (
        <div
          className="text-white text-xs font-semibold py-1.5 px-4 text-center"
          style={{ backgroundColor: primaryColor }}
        >
          {websiteSettings.announcementBar}
        </div>
      )}

      {/* Utility Strip */}
      <div className="bg-slate-50/90 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-6 h-8 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-5">
            <Link to="/track-order" className="hover:text-[#F85606] transition-colors whitespace-nowrap">
              Track My Order
            </Link>
            <Link to="/vouchers" className="hover:text-[#F85606] transition-colors whitespace-nowrap">
              Vouchers
            </Link>
            {rewardsSettings.coinsEnabled && (
              <Link
                to="/coins-games"
                className="hover:text-[#F85606] text-amber-700 font-semibold transition-colors whitespace-nowrap inline-flex items-center gap-1"
              >
                <Coins className="w-3.5 h-3.5 text-[#F85606]" />
                <span>
                  AS Coins{customerProfile?.coins ? ` (${customerProfile.coins})` : ' & Games'}
                </span>
              </Link>
            )}
            <Link to="/contact" className="hover:text-[#F85606] transition-colors whitespace-nowrap">
              Customer Care
            </Link>
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 hover:text-emerald-800 font-medium inline-flex items-center gap-1 whitespace-nowrap"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp Help</span>
              </a>
            )}
            <Link
              to="/admin/login"
              className="hover:text-[#F85606] font-semibold text-slate-700 transition-colors whitespace-nowrap"
            >
              Admin Panel
            </Link>
          </div>
          <div className="flex items-center gap-5">
            {user ? (
              <span className="text-slate-600 truncate max-w-[240px]">
                Welcome,{' '}
                <strong className="font-semibold text-slate-900">
                  {customerProfile?.name || user.displayName || user.email}
                </strong>
              </span>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="hover:text-[#F85606] font-medium whitespace-nowrap">
                  Login
                </Link>
                <Link to="/register" className="hover:text-[#F85606] font-medium whitespace-nowrap">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Search & Action Bar */}
      <div className="max-w-7xl mx-auto px-6 h-[74px] flex items-center justify-between gap-8">
        <Logo size="md" />

        {/* Flagship Wide Search Bar */}
        <div ref={searchRef} className="relative flex-1 max-w-2xl">
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center rounded-xl border-2 border-[#F85606] bg-white shadow-[0_2px_10px_rgba(248,86,6,0.08)] overflow-hidden"
          >
            <input
              type="search"
              value={queryText}
              onFocus={() => {
                setSearchHistory(getSearchHistory());
                setShowSuggestions(true);
              }}
              onChange={(e) => {
                setQueryText(e.target.value);
                setShowSuggestions(true);
              }}
              placeholder={`Search in ${websiteSettings.websiteName || 'AS World'} by product, category, or SKU...`}
              className="flex-1 h-10 pl-4 pr-3 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Search products"
              className="h-10 px-6 bg-[#F85606] hover:bg-[#E04A00] text-white flex items-center justify-center gap-1.5 font-semibold text-sm transition-colors shrink-0"
            >
              <Search className="w-4 h-4" />
              <span className="hidden lg:inline">Search</span>
            </button>
          </form>

          {showSuggestions && queryText.trim().length === 0 && searchHistory.length > 0 && (
            <div className="absolute left-0 right-0 top-12 bg-white border border-slate-200 rounded-xl shadow-xl p-3.5 z-50 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#F85606]" />
                  <span>Recent Searches</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSearchHistory(clearSearchHistory())}
                  className="text-xs font-semibold text-red-600 hover:underline"
                >
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {searchHistory.map((term) => (
                  <div
                    key={term}
                    className="inline-flex items-center bg-slate-100 hover:bg-slate-200/70 rounded-lg text-xs text-slate-700 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setQueryText(term);
                        runSearchQuery(term);
                      }}
                      className="pl-3 pr-1.5 py-1.5 hover:text-[#F85606] font-medium"
                    >
                      {term}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSearchHistory(removeSearchHistoryItem(term))}
                      aria-label={`Remove ${term}`}
                      className="pr-2.5 pl-0.5 py-1.5 text-slate-400 hover:text-red-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showSuggestions && queryText.trim().length > 0 && (
            <div className="absolute left-0 right-0 top-12 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
              {suggestions.length === 0 ? (
                <div className="px-4 py-3 text-xs text-slate-500">
                  No matching products found. Press Enter to search full catalog.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {suggestions.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setShowSuggestions(false);
                        navigate(`/product/${p.id}`);
                      }}
                      className="w-full px-4 py-2.5 flex items-center justify-between gap-3 text-left hover:bg-[#FFF5F0]/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {p.images?.[0] ? (
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                            <Package className="w-4 h-4 text-slate-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{p.name}</p>
                          <p className="text-xs text-slate-500 truncate">
                            {[p.categoryName, p.sku].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono tabular-nums text-sm font-bold text-[#F85606] shrink-0">
                        {formatPrice(
                          getEffectivePrice(p.price, p.discountPrice),
                          websiteSettings.currencySymbol || '৳'
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Account, Wishlist, Cart, Quick Menu */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to="/wishlist"
            aria-label="Wishlist"
            className="relative w-10 h-10 flex items-center justify-center text-slate-700 hover:text-[#F85606] rounded-xl hover:bg-[#FFF5F0] transition-colors"
          >
            <Heart className="w-5 h-5" />
            {wishlist.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                {wishlist.length}
              </span>
            )}
          </Link>

          <Link
            to="/cart"
            aria-label="Shopping Cart"
            className="relative inline-flex items-center gap-2 h-10 px-3 text-slate-700 hover:text-[#F85606] rounded-xl hover:bg-[#FFF5F0] transition-colors"
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-[#F85606] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="text-sm font-semibold whitespace-nowrap">Cart</span>
          </Link>

          {user ? (
            <div ref={accountRef} className="relative">
              <button
                type="button"
                onClick={() => setShowAccountMenu((v) => !v)}
                className="inline-flex items-center gap-1.5 h-10 px-3 text-sm font-semibold text-slate-800 hover:text-[#F85606] rounded-xl hover:bg-[#FFF5F0] transition-colors whitespace-nowrap"
              >
                <UserIcon className="w-4 h-4" />
                <span>Account</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </button>
              {showAccountMenu && (
                <div className="absolute right-0 top-12 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50">
                  <Link
                    to="/account"
                    onClick={() => setShowAccountMenu(false)}
                    className="block px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-[#FFF5F0] hover:text-[#F85606]"
                  >
                    My Profile &amp; Addresses
                  </Link>
                  <Link
                    to="/orders"
                    onClick={() => setShowAccountMenu(false)}
                    className="block px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-[#FFF5F0] hover:text-[#F85606]"
                  >
                    My Orders
                  </Link>
                  <Link
                    to="/coins-games"
                    onClick={() => setShowAccountMenu(false)}
                    className="block px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-[#FFF5F0] hover:text-[#F85606]"
                  >
                    AS Coins &amp; Games
                  </Link>
                  <Link
                    to="/wishlist"
                    onClick={() => setShowAccountMenu(false)}
                    className="block px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-[#FFF5F0] hover:text-[#F85606]"
                  >
                    Wishlist
                  </Link>
                  <Link
                    to="/vouchers"
                    onClick={() => setShowAccountMenu(false)}
                    className="block px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-[#FFF5F0] hover:text-[#F85606]"
                  >
                    Vouchers
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setShowAccountMenu(false)}
                    className="block px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-[#FFF5F0] hover:text-[#F85606]"
                  >
                    Settings
                  </Link>
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    type="button"
                    onClick={async () => {
                      setShowAccountMenu(false);
                      await logout();
                      navigate('/');
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 h-10 px-4 bg-[#F85606] hover:bg-[#E04A00] text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap shrink-0"
            >
              <UserIcon className="w-4 h-4" />
              <span>Sign In</span>
            </Link>
          )}
          <HeaderQuickMenu />
        </div>
      </div>

      {/* Main Navigation Menu */}
      <nav className="border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 h-10 flex items-center gap-6 overflow-x-auto no-scrollbar text-sm">
          <Link
            to="/"
            className="font-semibold text-slate-800 hover:text-[#F85606] whitespace-nowrap shrink-0"
          >
            Home
          </Link>
          <Link
            to="/categories"
            className="font-medium text-slate-700 hover:text-[#F85606] whitespace-nowrap shrink-0"
          >
            All Categories
          </Link>
          <Link
            to="/products"
            className="font-medium text-slate-700 hover:text-[#F85606] whitespace-nowrap shrink-0"
          >
            Shop All
          </Link>
          {hasActiveFlashSale && (
            <Link
              to="/products?flash=1"
              className="inline-flex items-center gap-1 font-semibold text-[#F85606] hover:text-[#E04A00] whitespace-nowrap shrink-0"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Flash Deals</span>
            </Link>
          )}
          {categories.slice(0, 7).map((cat) => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.id}`}
              className="text-slate-600 hover:text-[#F85606] whitespace-nowrap shrink-0 transition-colors"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
