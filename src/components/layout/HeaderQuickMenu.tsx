import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  ClipboardList,
  Coins,
  FolderTree,
  Gamepad2,
  Headphones,
  Heart,
  ImagePlus,
  LayoutDashboard,
  LogIn,
  LogOut,
  MapPin,
  MessageCircle,
  MoreVertical,
  PackagePlus,
  Palette,
  Settings,
  Share2,
  ShieldCheck,
  Ticket,
  Truck,
  UserCircle2,
  X,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useStore } from '../../contexts/StoreContext';
import { buildWhatsAppUrl } from '../../lib/searchHistory';

export function HeaderQuickMenu({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate();
  const { user, customerProfile, isAdmin, logout } = useAuth();
  const { websiteSettings, rewardsSettings, wishlist } = useStore();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const close = () => setOpen(false);

  const whatsappUrl = buildWhatsAppUrl(
    websiteSettings.whatsappNumber,
    `Hello ${websiteSettings.websiteName || 'AS World'} Support!`
  );

  const studioDestination = (tab: 'banner' | 'flash-banner' | 'profile' | 'theme') =>
    `/admin/dashboard/quick-studio?tab=${tab}`;

  const displayName = customerProfile?.name || user?.displayName || 'Welcome to AS World';
  const initials = (displayName || 'AS')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open quick navigation menu"
        aria-expanded={open}
        className={`flex items-center justify-center rounded-xl border transition-all duration-150 ${
          compact
            ? 'w-10 h-10 border-slate-200 bg-slate-50 text-slate-800 hover:border-[#F85606] hover:bg-[#FFF5F0] hover:text-[#F85606]'
            : 'w-10 h-10 border-slate-200 bg-white text-slate-700 hover:border-[#F85606] hover:bg-[#FFF5F0] hover:text-[#F85606]'
        }`}
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label="Quick Hub & Store Menu"
        >
          <aside
            className="w-full max-w-[360px] bg-white h-full overflow-y-auto shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Profile Card */}
            <div className="bg-gradient-to-br from-[#F85606] via-[#F85606] to-[#E04A00] text-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {websiteSettings.squareLogoUrl && !user ? (
                    <img
                      src={websiteSettings.squareLogoUrl}
                      alt={websiteSettings.websiteName || 'AS World'}
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 rounded-xl object-cover bg-white shrink-0 border border-white/30"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-white/20 border border-white/25 flex items-center justify-center font-display font-bold text-base shrink-0">
                      {initials || 'AS'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-display text-base font-bold truncate leading-tight">
                      {user ? displayName : websiteSettings.websiteName || 'AS World'}
                    </p>
                    <p className="text-xs text-white/85 truncate mt-0.5">
                      {user ? user.email : 'Sign in for rewards, tracking & saved addresses'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={close}
                  aria-label="Close menu"
                  className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center shrink-0 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {user ? (
                rewardsSettings.coinsEnabled && (
                  <Link
                    to="/coins-games"
                    onClick={close}
                    className="mt-4 flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/20 border border-white/20 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Coins className="w-5 h-5 text-amber-200 shrink-0" />
                      <div>
                        <p className="text-xs text-white/80 leading-none">AS Coins Wallet</p>
                        <p className="font-mono tabular-nums text-base font-bold leading-tight mt-0.5">
                          {customerProfile?.coins || 0} Coins
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold inline-flex items-center gap-1">
                      Play &amp; Earn
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </Link>
                )
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  <Link
                    to="/login"
                    onClick={close}
                    className="h-10 bg-white text-[#F85606] hover:bg-orange-50 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </Link>
                  <Link
                    to="/register"
                    onClick={close}
                    className="h-10 bg-white/15 hover:bg-white/25 border border-white/30 text-white rounded-xl text-sm font-semibold flex items-center justify-center transition-colors"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>

            {/* Body */}
            <div className="p-4 space-y-5 flex-1">
              {/* Customer Quick Grid (Spacious 44px+ Touch Targets) */}
              <div className="space-y-2.5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                  Shopping &amp; Rewards
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <Link
                    to="/orders"
                    onClick={close}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-[#FFF5F0] hover:border-[#F85606]/40 transition-colors min-h-[54px]"
                  >
                    <div className="w-9 h-9 rounded-lg bg-white border border-slate-200/80 text-[#F85606] flex items-center justify-center shrink-0">
                      <ClipboardList className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 leading-tight truncate">
                        My Orders
                      </p>
                      <p className="text-xs text-slate-500 truncate">History</p>
                    </div>
                  </Link>

                  <Link
                    to="/track-order"
                    onClick={close}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-[#FFF5F0] hover:border-[#F85606]/40 transition-colors min-h-[54px]"
                  >
                    <div className="w-9 h-9 rounded-lg bg-white border border-slate-200/80 text-[#F85606] flex items-center justify-center shrink-0">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 leading-tight truncate">
                        Track Order
                      </p>
                      <p className="text-xs text-slate-500 truncate">Live status</p>
                    </div>
                  </Link>

                  <Link
                    to="/coins-games"
                    onClick={close}
                    className="flex items-center gap-3 p-3 rounded-xl border border-amber-200/80 bg-amber-50/60 hover:bg-amber-100/70 transition-colors min-h-[54px]"
                  >
                    <div className="w-9 h-9 rounded-lg bg-white border border-amber-200 text-[#F85606] flex items-center justify-center shrink-0">
                      <Gamepad2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 leading-tight truncate">
                        Play &amp; Win
                      </p>
                      <p className="text-xs text-amber-800 truncate">Free coins</p>
                    </div>
                  </Link>

                  <Link
                    to="/coins-games?tab=refer"
                    onClick={close}
                    className="flex items-center gap-3 p-3 rounded-xl border border-emerald-200/80 bg-emerald-50/60 hover:bg-emerald-100/70 transition-colors min-h-[54px]"
                  >
                    <div className="w-9 h-9 rounded-lg bg-white border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
                      <Share2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 leading-tight truncate">
                        Refer {rewardsSettings.referralOrderCommissionPct}%
                      </p>
                      <p className="text-xs text-emerald-700 truncate">Commission</p>
                    </div>
                  </Link>

                  <Link
                    to="/vouchers"
                    onClick={close}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-[#FFF5F0] hover:border-[#F85606]/40 transition-colors min-h-[54px]"
                  >
                    <div className="w-9 h-9 rounded-lg bg-white border border-slate-200/80 text-[#F85606] flex items-center justify-center shrink-0">
                      <Ticket className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 leading-tight truncate">
                        Vouchers
                      </p>
                      <p className="text-xs text-slate-500 truncate">Coupons</p>
                    </div>
                  </Link>

                  <Link
                    to="/account#addresses"
                    onClick={close}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-[#FFF5F0] hover:border-[#F85606]/40 transition-colors min-h-[54px]"
                  >
                    <div className="w-9 h-9 rounded-lg bg-white border border-slate-200/80 text-[#F85606] flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 leading-tight truncate">
                        Addresses
                      </p>
                      <p className="text-xs text-slate-500 truncate">Saved book</p>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Clean Navigation List */}
              <div className="space-y-1.5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                  Browse &amp; Support
                </p>
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden bg-white">
                  <Link
                    to="/categories"
                    onClick={close}
                    className="flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50 hover:text-[#F85606] min-h-[46px]"
                  >
                    <span className="flex items-center gap-3">
                      <FolderTree className="w-4 h-4 text-slate-500" />
                      All Categories
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>
                  <Link
                    to="/wishlist"
                    onClick={close}
                    className="flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50 hover:text-[#F85606] min-h-[46px]"
                  >
                    <span className="flex items-center gap-3">
                      <Heart className="w-4 h-4 text-slate-500" />
                      Wishlist ({wishlist.length})
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>
                  <Link
                    to="/settings"
                    onClick={close}
                    className="flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50 hover:text-[#F85606] min-h-[46px]"
                  >
                    <span className="flex items-center gap-3">
                      <Settings className="w-4 h-4 text-slate-500" />
                      Account Settings
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>
                  <Link
                    to="/contact"
                    onClick={close}
                    className="flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50 hover:text-[#F85606] min-h-[46px]"
                  >
                    <span className="flex items-center gap-3">
                      <Headphones className="w-4 h-4 text-slate-500" />
                      Customer Care
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>
                  {whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={close}
                      className="flex items-center justify-between px-4 py-3 text-sm font-semibold text-emerald-700 bg-emerald-50/50 hover:bg-emerald-50 min-h-[46px]"
                    >
                      <span className="flex items-center gap-3">
                        <MessageCircle className="w-4 h-4 text-emerald-600" />
                        WhatsApp Live Chat
                      </span>
                      <ChevronRight className="w-4 h-4 text-emerald-600" />
                    </a>
                  )}
                </div>
              </div>

              {/* Admin Quick Studio */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                  Admin Quick Studio
                </p>
                {isAdmin ? (
                  <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden bg-white">
                    <Link
                      to="/admin/dashboard"
                      onClick={close}
                      className="flex items-center justify-between px-4 py-3 text-sm font-semibold text-[#F85606] bg-[#FFF5F0]/70 hover:bg-[#FFF5F0] min-h-[46px]"
                    >
                      <span className="flex items-center gap-3">
                        <LayoutDashboard className="w-4 h-4" />
                        Admin Dashboard
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                    <Link
                      to="/admin/dashboard/products/new"
                      onClick={close}
                      className="flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50 min-h-[46px]"
                    >
                      <span className="flex items-center gap-3">
                        <PackagePlus className="w-4 h-4 text-[#F85606]" />
                        Add New Product
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </Link>
                    <Link
                      to={studioDestination('banner')}
                      onClick={close}
                      className="flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50 min-h-[46px]"
                    >
                      <span className="flex items-center gap-3">
                        <ImagePlus className="w-4 h-4 text-[#F85606]" />
                        Banner Studio
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </Link>
                    <Link
                      to={studioDestination('flash-banner')}
                      onClick={close}
                      className="flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50 min-h-[46px]"
                    >
                      <span className="flex items-center gap-3">
                        <Zap className="w-4 h-4 text-[#F85606]" />
                        Discount / Flash Banner
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </Link>
                    <Link
                      to={studioDestination('profile')}
                      onClick={close}
                      className="flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50 min-h-[46px]"
                    >
                      <span className="flex items-center gap-3">
                        <UserCircle2 className="w-4 h-4 text-[#F85606]" />
                        Logo, WhatsApp &amp; Profile
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </Link>
                    <Link
                      to={studioDestination('theme')}
                      onClick={close}
                      className="flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50 min-h-[46px]"
                    >
                      <span className="flex items-center gap-3">
                        <Palette className="w-4 h-4 text-[#F85606]" />
                        Theme &amp; Notice Bar
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </Link>
                    <Link
                      to="/admin/dashboard/coins-games"
                      onClick={close}
                      className="flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50 min-h-[46px]"
                    >
                      <span className="flex items-center gap-3">
                        <Coins className="w-4 h-4 text-[#F85606]" />
                        Coins &amp; Games Setup
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </Link>
                  </div>
                ) : (
                  <Link
                    to="/admin/login"
                    onClick={close}
                    className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-[#FFF5F0] hover:border-[#F85606]/40 text-sm font-semibold text-slate-800 hover:text-[#F85606] min-h-[48px] transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <ShieldCheck className="w-4 h-4 text-[#F85606]" />
                      Admin Panel &amp; Quick Studio
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>
                )}
              </div>

              {user && (
                <button
                  type="button"
                  onClick={async () => {
                    close();
                    await logout();
                    navigate('/');
                  }}
                  className="w-full py-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
