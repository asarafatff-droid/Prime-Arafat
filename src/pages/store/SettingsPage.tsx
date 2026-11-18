import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  ChevronRight,
  FileText,
  Globe,
  HelpCircle,
  KeyRound,
  LogOut,
  MapPin,
  Shield,
  Tag,
  Truck,
  User,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useStore } from '../../contexts/StoreContext';
import { useToast } from '../../contexts/ToastContext';
import { formatPrice } from '../../lib/utils';

const HUMAN_AVATAR_PATH = '/src/assets/images/profile_avatar_human_1794978644721.jpg';

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, customerProfile, isAdmin, updateUserPassword, sendPasswordReset, logout } = useAuth();
  const { websiteSettings, shippingSettings } = useStore();
  const { showToast } = useToast();
  const symbol = websiteSettings.currencySymbol || '৳';

  const [orderAlerts, setOrderAlerts] = useState(true);
  const [promoAlerts, setPromoAlerts] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPw, setUpdatingPw] = useState(false);

  useEffect(() => {
    try {
      const savedOrder = window.localStorage.getItem('asworld_pref_order_alerts');
      const savedPromo = window.localStorage.getItem('asworld_pref_promo_alerts');
      if (savedOrder !== null) setOrderAlerts(savedOrder === 'true');
      if (savedPromo !== null) setPromoAlerts(savedPromo === 'true');
    } catch {
      // ignore storage errors
    }
  }, []);

  const togglePref = (key: 'order' | 'promo', next: boolean) => {
    if (key === 'order') {
      setOrderAlerts(next);
      try {
        window.localStorage.setItem('asworld_pref_order_alerts', String(next));
      } catch {
        // ignore
      }
    } else {
      setPromoAlerts(next);
      try {
        window.localStorage.setItem('asworld_pref_promo_alerts', String(next));
      } catch {
        // ignore
      }
    }
    showToast('Preference saved.', 'success');
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }
    setUpdatingPw(true);
    try {
      await updateUserPassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      showToast('Account password updated successfully.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update password.', 'error');
    } finally {
      setUpdatingPw(false);
    }
  };

  const avatarSrc = user?.photoURL || HUMAN_AVATAR_PATH;

  return (
    <div className="max-w-4xl mx-auto px-3 md:px-6 py-6 md:py-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage your profile, addresses, password, notifications, and store preferences.
        </p>
      </div>

      {/* Account Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <img
            src={avatarSrc}
            alt="Profile avatar"
            referrerPolicy="no-referrer"
            className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0"
          />
          <div className="min-w-0">
            <p className="font-display text-base font-bold text-slate-900 truncate">
              {user
                ? customerProfile?.name || user.displayName || 'My Profile'
                : 'Welcome to AS World'}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {user ? user.email : 'Sign in to sync your cart, orders, and saved addresses'}
            </p>
          </div>
        </div>

        {user ? (
          <Link
            to="/account"
            className="px-4 py-2 bg-[#FFF5F0] text-[#F85606] hover:bg-[#F85606] hover:text-white rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            My Profile
          </Link>
        ) : (
          <Link
            to="/login"
            className="px-4 py-2 bg-[#F85606] hover:bg-[#E04A00] text-white rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            Sign In
          </Link>
        )}
      </div>

      {/* Account & Address Shortcuts */}
      <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
        <div className="px-5 py-3 bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
          Account & Shopping
        </div>
        <Link
          to="/account"
          className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <User className="w-4 h-4 text-[#F85606]" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Account Information & Profile</p>
              <p className="text-xs text-slate-500">Edit your name, phone number, and profile details</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </Link>

        <Link
          to="/account#address"
          className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-[#F85606]" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Address Book</p>
              <p className="text-xs text-slate-500">
                {customerProfile?.address
                  ? `${customerProfile.address}, ${customerProfile.area || customerProfile.city || ''}`
                  : 'Set your default delivery district, city, and address'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </Link>

        <Link
          to="/vouchers"
          className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Tag className="w-4 h-4 text-[#F85606]" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Vouchers & Promo Codes</p>
              <p className="text-xs text-slate-500">Browse active store discount codes</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </Link>
      </div>

      {/* Password & Security (Signed-in Users) */}
      {user && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#F85606]" />
              <h2 className="font-display text-base font-bold text-slate-900">Account Password</h2>
            </div>
            {user.email && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await sendPasswordReset(user.email!);
                    showToast(`Password reset link sent to ${user.email}.`, 'success');
                  } catch (err) {
                    showToast(
                      err instanceof Error ? err.message : 'Could not send reset email.',
                      'error'
                    );
                  }
                }}
                className="text-xs font-semibold text-[#F85606] hover:underline"
              >
                Send Reset Email
              </button>
            )}
          </div>

          <form onSubmit={handlePasswordChange} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="password"
              minLength={6}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 6 chars)"
              className="h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#F85606]"
            />
            <input
              type="password"
              minLength={6}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#F85606]"
            />
            <button
              type="submit"
              disabled={updatingPw}
              className="h-10 px-4 bg-[#F85606] hover:bg-[#E04A00] text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {updatingPw ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      )}

      {/* Notifications, Currency & Shipping Info */}
      <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
        <div className="px-5 py-3 bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
          Preferences & Marketplace Info
        </div>

        <label className="px-5 py-3.5 flex items-center justify-between gap-3 cursor-pointer">
          <div className="flex items-center gap-3">
            <Bell className="w-4 h-4 text-[#F85606]" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Order & Delivery Notifications</p>
              <p className="text-xs text-slate-500">Alerts for order confirmation and shipment updates</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={orderAlerts}
            onChange={(e) => togglePref('order', e.target.checked)}
            className="w-4 h-4 accent-[#F85606]"
          />
        </label>

        <label className="px-5 py-3.5 flex items-center justify-between gap-3 cursor-pointer">
          <div className="flex items-center gap-3">
            <Tag className="w-4 h-4 text-[#F85606]" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Flash Sale & Voucher Alerts</p>
              <p className="text-xs text-slate-500">Promotions and seasonal marketplace campaigns</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={promoAlerts}
            onChange={(e) => togglePref('promo', e.target.checked)}
            className="w-4 h-4 accent-[#F85606]"
          />
        </label>

        <div className="px-5 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 text-slate-500" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Currency</p>
              <p className="text-xs text-slate-500">Configured by store administrator</p>
            </div>
          </div>
          <span className="font-mono text-xs font-bold text-slate-700">
            {websiteSettings.currencyCode || 'BDT'} ({symbol})
          </span>
        </div>

        <div className="px-5 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Truck className="w-4 h-4 text-slate-500" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Delivery Rates</p>
              <p className="text-xs text-slate-500">
                Inside Dhaka {formatPrice(shippingSettings.insideDhakaFee, symbol)} · Outside Dhaka{' '}
                {formatPrice(shippingSettings.outsideDhakaFee, symbol)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Policies, Help & Admin Panel Access */}
      <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
        <div className="px-5 py-3 bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
          Support, Policies & Store Administration
        </div>

        <Link
          to="/contact"
          className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <HelpCircle className="w-4 h-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-800">Help & Customer Care</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </Link>

        <Link
          to="/about"
          className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-800">About AS World</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </Link>

        <Link
          to="/privacy"
          className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-800">Privacy Policy</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </Link>

        <Link
          to="/terms"
          className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-800">Terms & Conditions</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </Link>

        <Link
          to="/returns"
          className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-800">Return & Refund Policy</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </Link>

        <Link
          to={isAdmin ? '/admin/dashboard' : '/admin/login'}
          className="px-5 py-4 flex items-center justify-between gap-3 bg-[#FFF5F0]/60 hover:bg-[#FFF5F0] transition-colors"
        >
          <div className="flex items-center gap-3">
            <Shield className="w-4 h-4 text-[#F85606]" />
            <div>
              <p className="text-sm font-bold text-slate-900">
                {isAdmin ? 'Open Admin Dashboard' : 'Admin Panel Login'}
              </p>
              <p className="text-xs text-slate-500">
                Manage products, categories, banners, logo, orders, and store settings
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#F85606]" />
        </Link>
      </div>

      {user && (
        <button
          type="button"
          onClick={async () => {
            await logout();
            navigate('/');
          }}
          className="w-full h-11 bg-white border border-red-200 hover:bg-red-50 text-red-600 text-sm font-semibold rounded-xl inline-flex items-center justify-center gap-2 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      )}
    </div>
  );
}
