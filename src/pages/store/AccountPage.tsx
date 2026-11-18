import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ClipboardList,
  Coins,
  CreditCard,
  Edit,
  Gamepad2,
  Heart,
  HelpCircle,
  KeyRound,
  LogOut,
  MapPin,
  Package,
  Plus,
  RotateCcw,
  Save,
  Settings,
  Share2,
  Shield,
  Star,
  Tag,
  Trash2,
  Truck,
  User,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useStore } from '../../contexts/StoreContext';
import { useToast } from '../../contexts/ToastContext';
import {
  BANGLADESH_DISTRICTS,
  computeDeliveryFeeForArea,
  getDistrictAreas,
} from '../../lib/bangladeshLocations';
import {
  computeCoinsBdtValue,
  deleteCustomerAddress,
  saveCustomerAddress,
  setDefaultCustomerAddress,
} from '../../services/rewardsService';
import { updateCustomerProfile } from '../../services/userService';
import type { SavedAddress } from '../../types';

const HUMAN_AVATAR_PATH = '/src/assets/images/profile_avatar_human_1794978644721.jpg';

export function AccountPage() {
  const navigate = useNavigate();
  const { user, customerProfile, isAdmin, refreshProfile, sendPasswordReset, logout } = useAuth();
  const { rewardsSettings, shippingSettings, savedAddresses, websiteSettings } = useStore();
  const { showToast } = useToast();

  const symbol = websiteSettings.currencySymbol || '৳';
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);

  // Saved Multi-Address Book Form State
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [editingAddrId, setEditingAddrId] = useState<string | null>(null);
  const [addrLabel, setAddrLabel] = useState('Home');
  const [addrRecipient, setAddrRecipient] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrDistrict, setAddrDistrict] = useState('Dhaka');
  const [addrCity, setAddrCity] = useState('');
  const [addrArea, setAddrArea] = useState('');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrDefault, setAddrDefault] = useState(false);
  const [savingAddr, setSavingAddr] = useState(false);

  useEffect(() => {
    if (customerProfile) {
      setName(customerProfile.name || '');
      setPhone(customerProfile.phone || '');
      setDistrict(customerProfile.district || '');
      setCity(customerProfile.city || '');
      setArea(customerProfile.area || '');
      setAddress(customerProfile.address || '');
    } else if (user) {
      setName(user.displayName || '');
    }
  }, [customerProfile, user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await updateCustomerProfile(user.uid, {
        name,
        phone,
        district,
        city,
        area,
        address,
      });
      await refreshProfile();
      showToast('Profile details updated.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const resetAddrForm = () => {
    setEditingAddrId(null);
    setAddrLabel('Home');
    setAddrRecipient(customerProfile?.name || user?.displayName || '');
    setAddrPhone(customerProfile?.phone || '');
    setAddrDistrict('Dhaka');
    setAddrCity('');
    setAddrArea('');
    setAddrStreet('');
    setAddrDefault(savedAddresses.length === 0);
  };

  const openEditAddress = (item: SavedAddress) => {
    setEditingAddrId(item.id);
    setAddrLabel(item.label || 'Home');
    setAddrRecipient(item.recipientName);
    setAddrPhone(item.phone);
    setAddrDistrict(item.district || 'Dhaka');
    setAddrCity(item.city || '');
    setAddrArea(item.area || '');
    setAddrStreet(item.address || '');
    setAddrDefault(Boolean(item.isDefault));
    setShowAddrForm(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingAddr(true);
    try {
      await saveCustomerAddress(
        user.uid,
        {
          label: addrLabel,
          recipientName: addrRecipient,
          phone: addrPhone,
          district: addrDistrict,
          city: addrCity,
          area: addrArea,
          address: addrStreet,
          isDefault: addrDefault,
        },
        editingAddrId || undefined
      );
      showToast(editingAddrId ? 'Saved address updated!' : 'New delivery address saved!', 'success');
      setShowAddrForm(false);
      resetAddrForm();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save address.', 'error');
    } finally {
      setSavingAddr(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;
    try {
      await sendPasswordReset(user.email);
      showToast(`Password reset email sent to ${user.email}.`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not send reset email.', 'error');
    }
  };

  const avatarSrc = user?.photoURL || HUMAN_AVATAR_PATH;
  const userCoins = Math.max(0, Number(customerProfile?.coins) || 0);
  const coinsBdt = computeCoinsBdtValue(userCoins, rewardsSettings);
  const addrPresets = getDistrictAreas(addrDistrict);

  return (
    <div className="max-w-5xl mx-auto px-3 md:px-6 py-4 md:py-8 space-y-5">
      {/* Daraz-Style Top Profile Banner */}
      <div className="bg-gradient-to-r from-[#F85606] to-[#FF742E] rounded-2xl p-5 md:p-6 text-white flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/80 bg-white shrink-0">
            <img
              src={avatarSrc}
              alt="My Profile"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-xl md:text-2xl font-bold truncate">
              {user
                ? customerProfile?.name || user.displayName || 'My Profile'
                : 'Welcome to AS World'}
            </h1>
            <p className="text-xs md:text-sm text-white/90 truncate">
              {user ? user.email : 'Sign in or create an account to manage orders & profile'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/settings"
            aria-label="Settings"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </Link>

          {user ? (
            <button
              type="button"
              onClick={async () => {
                await logout();
                navigate('/');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-[#F85606] hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-[#F85606] hover:bg-slate-50 rounded-lg text-xs font-bold transition-colors"
            >
              <span>Login / Sign Up</span>
            </Link>
          )}
        </div>
      </div>

      {/* AS Coins & Referral Quick Wallet Card */}
      {rewardsSettings.coinsEnabled && (
        <div className="bg-gradient-to-r from-amber-50 via-[#FFF5F0] to-orange-50 border border-[#F85606]/25 rounded-xl p-4 md:p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#F85606] text-white flex items-center justify-center shrink-0">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">AS Coins Wallet</p>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-xl font-extrabold text-slate-900">
                  {user ? userCoins.toLocaleString() : 0} Coins
                </span>
                <span className="text-xs font-bold text-[#F85606]">
                  (= {symbol}
                  {coinsBdt} Discount)
                </span>
              </div>
              {customerProfile?.referralCode && (
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Referral Code: <strong className="font-mono">{customerProfile.referralCode}</strong>{' '}
                  · {rewardsSettings.referralOrderCommissionPct}% Order Commission
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/coins-games"
              className="px-4 py-2 bg-[#F85606] hover:bg-[#E04A00] text-white text-xs font-bold rounded-lg inline-flex items-center gap-1.5"
            >
              <Gamepad2 className="w-4 h-4" />
              <span>Play &amp; Win</span>
            </Link>
            <Link
              to="/coins-games?tab=refer"
              className="px-4 py-2 bg-white border border-slate-200 hover:border-[#F85606] text-slate-800 text-xs font-bold rounded-lg inline-flex items-center gap-1.5"
            >
              <Share2 className="w-4 h-4 text-emerald-600" />
              <span>Share &amp; Refer ({rewardsSettings.referralOrderCommissionPct}%)</span>
            </Link>
          </div>
        </div>
      )}

      {/* Daraz-Style My Orders Quick Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm md:text-base font-bold text-slate-900">
            My Orders
          </h2>
          <Link to="/orders" className="text-xs font-semibold text-[#F85606] hover:underline">
            View All Orders
          </Link>
        </div>

        <div className="grid grid-cols-5 gap-2 text-center">
          <Link
            to="/orders?status=Pending"
            className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-[#FFF5F0] text-[#F85606] flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-medium text-slate-700 leading-tight">To Pay</span>
          </Link>

          <Link
            to="/orders?status=Processing"
            className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-[#FFF5F0] text-[#F85606] flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-medium text-slate-700 leading-tight">To Ship</span>
          </Link>

          <Link
            to="/orders?status=Shipped"
            className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-[#FFF5F0] text-[#F85606] flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-medium text-slate-700 leading-tight">
              To Receive
            </span>
          </Link>

          <Link
            to="/orders?status=Delivered"
            className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-[#FFF5F0] text-[#F85606] flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-medium text-slate-700 leading-tight">
              Delivered
            </span>
          </Link>

          <Link
            to="/orders?status=Cancelled"
            className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-[#FFF5F0] text-[#F85606] flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-medium text-slate-700 leading-tight">Returns</span>
          </Link>
        </div>
      </div>

      {/* Daraz-Style Services & Quick Links */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-5 space-y-4">
        <h2 className="font-display text-sm md:text-base font-bold text-slate-900">
          My Services &amp; Options
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <Link
            to="/orders"
            className="border border-slate-100 bg-slate-50/70 hover:border-[#F85606] rounded-xl p-3.5 flex items-center gap-3 transition-colors"
          >
            <ClipboardList className="w-5 h-5 text-[#F85606] shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">My Orders</p>
              <p className="text-[11px] text-slate-500 truncate">Purchase history</p>
            </div>
          </Link>

          <Link
            to="/wishlist"
            className="border border-slate-100 bg-slate-50/70 hover:border-[#F85606] rounded-xl p-3.5 flex items-center gap-3 transition-colors"
          >
            <Heart className="w-5 h-5 text-[#F85606] shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">Wishlist</p>
              <p className="text-[11px] text-slate-500 truncate">Saved favorites</p>
            </div>
          </Link>

          <Link
            to="/coins-games"
            className="border border-slate-100 bg-slate-50/70 hover:border-[#F85606] rounded-xl p-3.5 flex items-center gap-3 transition-colors"
          >
            <Gamepad2 className="w-5 h-5 text-[#F85606] shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">Coins &amp; Games</p>
              <p className="text-[11px] text-slate-500 truncate">Play daily &amp; earn</p>
            </div>
          </Link>

          <Link
            to="/vouchers"
            className="border border-slate-100 bg-slate-50/70 hover:border-[#F85606] rounded-xl p-3.5 flex items-center gap-3 transition-colors"
          >
            <Tag className="w-5 h-5 text-[#F85606] shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">Vouchers</p>
              <p className="text-[11px] text-slate-500 truncate">Promo codes</p>
            </div>
          </Link>

          <Link
            to="/track-order"
            className="border border-slate-100 bg-slate-50/70 hover:border-[#F85606] rounded-xl p-3.5 flex items-center gap-3 transition-colors"
          >
            <MapPin className="w-5 h-5 text-[#F85606] shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">Track Order</p>
              <p className="text-[11px] text-slate-500 truncate">Live delivery steps</p>
            </div>
          </Link>

          <Link
            to="/contact"
            className="border border-slate-100 bg-slate-50/70 hover:border-[#F85606] rounded-xl p-3.5 flex items-center gap-3 transition-colors"
          >
            <HelpCircle className="w-5 h-5 text-[#F85606] shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">Customer Care</p>
              <p className="text-[11px] text-slate-500 truncate">Support &amp; WhatsApp</p>
            </div>
          </Link>

          <Link
            to="/settings"
            className="border border-slate-100 bg-slate-50/70 hover:border-[#F85606] rounded-xl p-3.5 flex items-center gap-3 transition-colors"
          >
            <Settings className="w-5 h-5 text-[#F85606] shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">Settings</p>
              <p className="text-[11px] text-slate-500 truncate">Preferences &amp; security</p>
            </div>
          </Link>

          <Link
            to={isAdmin ? '/admin/dashboard' : '/admin/login'}
            className="border border-[#F85606]/30 bg-[#FFF5F0] hover:border-[#F85606] rounded-xl p-3.5 flex items-center gap-3 transition-colors"
          >
            <Shield className="w-5 h-5 text-[#F85606] shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">
                {isAdmin ? 'Admin Dashboard' : 'Admin Panel'}
              </p>
              <p className="text-[11px] text-slate-600 truncate">Manage store &amp; orders</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Saved Multi-Address Book (#addresses) */}
      {user && (
        <div
          id="addresses"
          className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#F85606]" />
              <div>
                <h2 className="font-display text-base font-bold text-slate-900">
                  Saved Delivery Addresses ({savedAddresses.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Select any saved address in 1 click during checkout (supports Tangail, Dhaka
                  &amp; all 64 districts).
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (showAddrForm) {
                  setShowAddrForm(false);
                } else {
                  resetAddrForm();
                  setShowAddrForm(true);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#FFF5F0] hover:bg-[#FFE6D9] text-[#F85606] text-xs font-bold rounded-lg"
            >
              <Plus className="w-4 h-4" />
              <span>{showAddrForm ? 'Close Form' : 'Add New Address'}</span>
            </button>
          </div>

          {showAddrForm && (
            <form
              onSubmit={handleSaveAddress}
              className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Address Label *
                  </label>
                  <select
                    value={addrLabel}
                    onChange={(e) => setAddrLabel(e.target.value)}
                    className="w-full h-9 px-2.5 bg-white border border-slate-200 rounded-lg text-sm"
                  >
                    <option value="Home">Home</option>
                    <option value="Office">Office</option>
                    <option value="Tangail Home">Tangail Home</option>
                    <option value="Family">Family</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Recipient Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={addrRecipient}
                    onChange={(e) => setAddrRecipient(e.target.value)}
                    className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={addrPhone}
                    onChange={(e) => setAddrPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    District *
                  </label>
                  <select
                    value={addrDistrict}
                    onChange={(e) => {
                      setAddrDistrict(e.target.value);
                      setAddrArea('');
                    }}
                    className="w-full h-9 px-2.5 bg-white border border-slate-200 rounded-lg text-sm"
                  >
                    {BANGLADESH_DISTRICTS.map((d) => {
                      const fee = computeDeliveryFeeForArea(shippingSettings, d.name, 1);
                      return (
                        <option key={d.name} value={d.name}>
                          {d.name} ({symbol}
                          {fee})
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    City / Thana / Upazila *
                  </label>
                  <input
                    type="text"
                    required
                    value={addrCity}
                    onChange={(e) => setAddrCity(e.target.value)}
                    placeholder="e.g. Tangail Sadar, Mirpur"
                    className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Area *</label>
                  <input
                    type="text"
                    required
                    value={addrArea}
                    onChange={(e) => setAddrArea(e.target.value)}
                    placeholder="Area / Bazar / Village"
                    className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              {addrPresets.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {addrPresets.slice(0, 10).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAddrArea(preset)}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                        addrArea === preset
                          ? 'border-[#F85606] bg-[#FFF5F0] text-[#F85606]'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Street Address *
                </label>
                <input
                  type="text"
                  required
                  value={addrStreet}
                  onChange={(e) => setAddrStreet(e.target.value)}
                  placeholder="House #, Road #, Landmark"
                  className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addrDefault}
                    onChange={(e) => setAddrDefault(e.target.checked)}
                    className="accent-[#F85606]"
                  />
                  <span>Set as Default Delivery Address</span>
                </label>
                <button
                  type="submit"
                  disabled={savingAddr}
                  className="px-4 py-2 bg-[#F85606] hover:bg-[#E04A00] text-white text-xs font-bold rounded-lg disabled:opacity-50"
                >
                  {savingAddr ? 'Saving...' : editingAddrId ? 'Update Address' : 'Save Address'}
                </button>
              </div>
            </form>
          )}

          {savedAddresses.length === 0 ? (
            <p className="text-xs text-slate-500">
              No saved addresses yet. Add your Home, Office, or Tangail address above for 1-click
              checkout!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {savedAddresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`p-3.5 rounded-xl border space-y-1.5 ${
                    addr.isDefault
                      ? 'border-[#F85606] bg-[#FFF5F0]/40'
                      : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                        {addr.label}
                      </span>
                      {addr.isDefault && (
                        <span className="text-[11px] font-bold text-[#F85606] inline-flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-[#F85606]" />
                          Default
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {!addr.isDefault && (
                        <button
                          type="button"
                          onClick={() => void setDefaultCustomerAddress(user.uid, addr.id)}
                          className="text-[11px] font-semibold text-slate-600 hover:text-[#F85606]"
                        >
                          Set Default
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openEditAddress(addr)}
                        className="p-1 text-slate-600 hover:text-[#F85606]"
                        title="Edit address"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteCustomerAddress(user.uid, addr.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Delete address"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-slate-900">
                    {addr.recipientName} · <span className="font-mono">{addr.phone}</span>
                  </p>
                  <p className="text-xs text-slate-600">
                    {addr.address}, {addr.area}, {addr.city}, {addr.district}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Editable Profile & Default Delivery Address Form (Signed-in Users) */}
      {user && (
        <form
          id="address"
          onSubmit={handleSave}
          className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 space-y-5"
        >
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <User className="w-5 h-5 text-[#F85606]" />
            <h2 className="font-display text-base font-bold text-slate-900">
              My Profile Details
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#F85606]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#F85606]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">District</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#F85606]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#F85606]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Area</label>
              <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#F85606]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Street / Delivery Address
              </label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#F85606]"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleResetPassword}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-[#F85606]"
            >
              <KeyRound className="w-4 h-4" />
              <span>Send Password Reset Email</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F85606] hover:bg-[#E04A00] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
