import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  Coins,
  Copy,
  CreditCard,
  Info,
  Lock,
  MapPin,
  ShieldCheck,
  Tag,
  Truck,
} from 'lucide-react';
import { EmptyState } from '../../components/common/EmptyState';
import { useAuth } from '../../contexts/AuthContext';
import { useStore } from '../../contexts/StoreContext';
import { useToast } from '../../contexts/ToastContext';
import {
  BANGLADESH_DISTRICTS,
  computeDeliveryFeeForArea,
  getDistrictAreas,
  isDistrictDeliveryEnabled,
} from '../../lib/bangladeshLocations';
import { formatPrice, generateId, getEffectivePrice } from '../../lib/utils';
import { validateCouponForSubtotal } from '../../services/marketingService';
import { listCustomerOrders, placeOrder } from '../../services/orderService';
import { saveCustomerAddress } from '../../services/rewardsService';
import type { PaymentMethodConfig, PaymentWalletAccount, SavedAddress } from '../../types';

function getActiveWalletsForMethod(method?: PaymentMethodConfig): PaymentWalletAccount[] {
  if (!method || method.id === 'cod') return [];
  if (Array.isArray(method.accounts) && method.accounts.length > 0) {
    return method.accounts.filter((a) => a.active && a.accountNumber.trim());
  }
  if (method.accountNumber?.trim()) {
    return [
      {
        id: 'primary',
        label: method.label,
        accountNumber: method.accountNumber.trim(),
        accountName: method.accountName || '',
        accountType:
          (method.accountType as PaymentWalletAccount['accountType']) ||
          (method.id === 'bank' ? 'Bank' : 'Personal'),
        sendMoneyOnly: method.sendMoneyOnly ?? method.id !== 'bank',
        active: true,
      },
    ];
  }
  return [];
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const { user, customerProfile, refreshProfile } = useAuth();
  const {
    cart,
    products,
    websiteSettings,
    shippingSettings,
    paymentSettings,
    rewardsSettings,
    savedAddresses,
    activeFlashSalePrices,
  } = useStore();
  const { showToast } = useToast();

  const symbol = websiteSettings.currencySymbol || '৳';

  const enabledPayments = useMemo(
    () => paymentSettings.methods.filter((m) => m.enabled),
    [paymentSettings.methods]
  );

  const enabledDistricts = useMemo(
    () => BANGLADESH_DISTRICTS.filter((d) => isDistrictDeliveryEnabled(shippingSettings, d.name)),
    [shippingSettings]
  );

  const districtsByDivision = useMemo(() => {
    const groups = new Map<string, typeof enabledDistricts>();
    for (const d of enabledDistricts) {
      const list = groups.get(d.division) || [];
      list.push(d);
      groups.set(d.division, list);
    }
    return Array.from(groups.entries());
  }, [enabledDistricts]);

  const [customerName, setCustomerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [district, setDistrict] = useState('Dhaka');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<string | null>(null);
  const [saveAddressForFuture, setSaveAddressForFuture] = useState(false);

  const [selectedPaymentId, setSelectedPaymentId] = useState('');
  const [selectedWalletId, setSelectedWalletId] = useState('');
  const [paymentTransactionId, setPaymentTransactionId] = useState('');
  const [paymentSenderNumber, setPaymentSenderNumber] = useState('');
  const [copiedWallet, setCopiedWallet] = useState(false);

  const [checkingFirstOrder, setCheckingFirstOrder] = useState(true);
  const [priorOrderCount, setPriorOrderCount] = useState(0);

  const [couponInput, setCouponInput] = useState('');
  const [appliedCouponCode, setAppliedCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const [useCoins, setUseCoins] = useState(false);
  const [idempotencyKey] = useState(() => generateId('idem'));
  const [submitting, setSubmitting] = useState(false);

  const applySavedAddress = (addr: SavedAddress) => {
    setSelectedSavedAddressId(addr.id);
    setCustomerName(addr.recipientName);
    setMobile(addr.phone);
    if (addr.district) setDistrict(addr.district);
    setCity(addr.city);
    setArea(addr.area);
    setDeliveryAddress(addr.address);
    setSaveAddressForFuture(false);
  };

  // Pre-fill from default saved address or customer profile
  useEffect(() => {
    if (savedAddresses.length > 0 && !selectedSavedAddressId && !deliveryAddress) {
      const def = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
      applySavedAddress(def);
      if (user?.email) setEmail((prev) => prev || user.email || '');
      return;
    }
    if (customerProfile) {
      setCustomerName((prev) => prev || customerProfile.name || '');
      setMobile((prev) => prev || customerProfile.phone || '');
      setEmail((prev) => prev || customerProfile.email || user?.email || '');
      if (customerProfile.district) {
        setDistrict((prev) => prev || customerProfile.district || 'Dhaka');
      }
      setCity((prev) => prev || customerProfile.city || '');
      setArea((prev) => prev || customerProfile.area || '');
      setDeliveryAddress((prev) => prev || customerProfile.address || '');
    } else if (user) {
      setCustomerName((prev) => prev || user.displayName || '');
      setEmail((prev) => prev || user.email || '');
    }
  }, [customerProfile, user, savedAddresses]);

  useEffect(() => {
    if (
      enabledDistricts.length > 0 &&
      !enabledDistricts.some((d) => d.name.toLowerCase() === district.trim().toLowerCase())
    ) {
      setDistrict(enabledDistricts[0].name);
    }
  }, [enabledDistricts, district]);

  useEffect(() => {
    let active = true;
    async function inspectCustomerOrders() {
      if (!user) {
        setCheckingFirstOrder(false);
        return;
      }
      setCheckingFirstOrder(true);
      try {
        const orders = await listCustomerOrders(user.uid);
        if (!active) return;
        const validPrior = orders.filter(
          (o) => o.status !== 'Cancelled' && o.status !== 'Returned'
        );
        setPriorOrderCount(validPrior.length);
      } catch {
        if (active) setPriorOrderCount(0);
      } finally {
        if (active) setCheckingFirstOrder(false);
      }
    }
    void inspectCustomerOrders();
    return () => {
      active = false;
    };
  }, [user]);

  const enrichedItems = useMemo(() => {
    const productMap = new Map(products.map((p) => [p.id, p]));
    return cart
      .map((c) => {
        const product = productMap.get(c.productId);
        if (!product) return null;
        const baseEff = getEffectivePrice(product.price, product.discountPrice);
        const flashPrice = activeFlashSalePrices[product.id];
        const unitPrice =
          flashPrice && flashPrice > 0 && flashPrice < baseEff ? flashPrice : baseEff;
        return {
          cartItemId: c.id,
          product,
          quantity: c.quantity,
          selectedColor: c.selectedColor || '',
          selectedSize: c.selectedSize || '',
          unitPrice,
          lineTotal: unitPrice * c.quantity,
        };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));
  }, [cart, products, activeFlashSalePrices]);

  const subtotal = useMemo(
    () => enrichedItems.reduce((sum, i) => sum + i.lineTotal, 0),
    [enrichedItems]
  );

  const shippingFee = useMemo(
    () => computeDeliveryFeeForArea(shippingSettings, district, subtotal),
    [shippingSettings, district, subtotal]
  );

  // Compute maximum AS Coins usable on this order
  const availableCoins = Math.max(0, Number(customerProfile?.coins) || 0);
  const canRedeemCoins =
    rewardsSettings.coinsEnabled &&
    availableCoins >= (rewardsSettings.minCoinsToRedeem || 20) &&
    subtotal > couponDiscount;

  const coinRedeemCalc = useMemo(() => {
    if (!useCoins || !canRedeemCoins) return { coinsUsed: 0, coinDiscount: 0 };
    const unit = Math.max(1, rewardsSettings.coinsUnit || 100);
    const takaPerUnit = Math.max(0, rewardsSettings.takaPerUnit || 10);
    const maxPctTaka = Math.floor(
      subtotal * ((rewardsSettings.maxCoinDiscountPercent || 50) / 100)
    );
    const remaining = Math.max(0, subtotal - couponDiscount);
    const maxAllowedTaka = Math.min(maxPctTaka, remaining);
    const userTaka = Math.floor((availableCoins / unit) * takaPerUnit);
    const discount = Math.max(0, Math.min(userTaka, maxAllowedTaka));
    if (discount <= 0 || takaPerUnit <= 0) return { coinsUsed: 0, coinDiscount: 0 };
    const coinsNeeded = Math.min(availableCoins, Math.ceil((discount / takaPerUnit) * unit));
    return { coinsUsed: coinsNeeded, coinDiscount: discount };
  }, [useCoins, canRedeemCoins, rewardsSettings, availableCoins, subtotal, couponDiscount]);

  const productPayable = Math.max(
    0,
    subtotal - couponDiscount - coinRedeemCalc.coinDiscount
  );
  const finalTotal = Math.max(0, productPayable + shippingFee);

  const isFirstOrder = priorOrderCount === 0;
  const firstOrderPolicyActive = shippingSettings.firstOrderAdvanceDelivery !== false;
  const requiresAdvanceDelivery = Boolean(
    firstOrderPolicyActive && isFirstOrder && shippingFee > 0
  );

  const digitalAdvanceMethods = useMemo(
    () => enabledPayments.filter((m) => m.id !== 'cod'),
    [enabledPayments]
  );

  const selectablePaymentMethods = requiresAdvanceDelivery
    ? digitalAdvanceMethods
    : enabledPayments;

  useEffect(() => {
    if (selectablePaymentMethods.length === 0) {
      setSelectedPaymentId('');
      return;
    }
    if (!selectablePaymentMethods.some((m) => m.id === selectedPaymentId)) {
      setSelectedPaymentId(selectablePaymentMethods[0].id);
    }
  }, [selectablePaymentMethods, selectedPaymentId]);

  const selectedPaymentMethod = selectablePaymentMethods.find(
    (m) => m.id === selectedPaymentId
  );

  const activeWallets = useMemo(
    () => getActiveWalletsForMethod(selectedPaymentMethod),
    [selectedPaymentMethod]
  );

  useEffect(() => {
    if (activeWallets.length === 0) {
      setSelectedWalletId('');
      return;
    }
    if (!activeWallets.some((w) => w.id === selectedWalletId)) {
      setSelectedWalletId(activeWallets[0].id);
    }
  }, [activeWallets, selectedWalletId]);

  const selectedWallet = activeWallets.find((w) => w.id === selectedWalletId) || activeWallets[0];

  const deliveryPaymentMode: 'advance_delivery_cod' | 'full_cod' | 'full_prepaid' =
    requiresAdvanceDelivery
      ? 'advance_delivery_cod'
      : selectedPaymentMethod?.id === 'cod'
      ? 'full_cod'
      : 'full_prepaid';

  const advancePayableNow =
    deliveryPaymentMode === 'advance_delivery_cod'
      ? shippingFee
      : deliveryPaymentMode === 'full_prepaid'
      ? finalTotal
      : 0;

  const dueOnDelivery = Math.max(0, finalTotal - advancePayableNow);
  const districtAreas = useMemo(() => getDistrictAreas(district), [district]);

  const handleCopyWallet = async (wallet: string) => {
    try {
      await navigator.clipboard.writeText(wallet);
      setCopiedWallet(true);
      showToast('Wallet number copied!', 'success');
      window.setTimeout(() => setCopiedWallet(false), 2000);
    } catch {
      showToast('Please copy the number manually.', 'info');
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setApplyingCoupon(true);
    try {
      const { coupon, discountAmount } = await validateCouponForSubtotal(couponInput, subtotal);
      setAppliedCouponCode(coupon.code);
      setCouponDiscount(discountAmount);
      showToast(
        `Coupon ${coupon.code} applied! Saved ${formatPrice(discountAmount, symbol)}.`,
        'success'
      );
    } catch (err) {
      setAppliedCouponCode('');
      setCouponDiscount(0);
      showToast(err instanceof Error ? err.message : 'Invalid coupon code.', 'error');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || enrichedItems.length === 0) return;

    if (!district.trim()) {
      showToast('Please select your delivery district.', 'error');
      return;
    }
    if (!isDistrictDeliveryEnabled(shippingSettings, district)) {
      showToast(
        `Home delivery is currently paused for ${district}. Please choose another district.`,
        'error'
      );
      return;
    }
    if (!selectedPaymentMethod) {
      showToast(
        requiresAdvanceDelivery
          ? 'Please select bKash, Nagad, or Rocket to pay the advance delivery charge.'
          : 'No active payment method selected.',
        'error'
      );
      return;
    }
    if (selectedPaymentMethod.requiresTransactionId && !paymentTransactionId.trim()) {
      showToast(
        `Please enter your ${selectedPaymentMethod.label} Transaction ID (TrxID).`,
        'error'
      );
      return;
    }

    setSubmitting(true);
    try {
      if (saveAddressForFuture) {
        await saveCustomerAddress(user.uid, {
          label: district === 'Tangail' ? 'Tangail' : 'Home',
          recipientName: customerName,
          phone: mobile,
          district,
          city,
          area,
          address: deliveryAddress,
          isDefault: savedAddresses.length === 0,
        });
      }

      const walletSuffix = selectedWallet ? ` (${selectedWallet.accountNumber})` : '';
      const methodLabel = requiresAdvanceDelivery
        ? `${selectedPaymentMethod.label}${walletSuffix} (Delivery Advance) + COD`
        : `${selectedPaymentMethod.label}${walletSuffix}`;

      const { orderId } = await placeOrder({
        userId: user.uid,
        customerName,
        mobile,
        email,
        district,
        city,
        area,
        deliveryAddress,
        deliveryInstructions,
        paymentMethod: selectedPaymentMethod.id,
        paymentMethodLabel: methodLabel,
        paymentTransactionId,
        paymentSenderNumber,
        isFirstOrder,
        deliveryPaymentMode,
        advancePaidAmount: advancePayableNow,
        couponCode: appliedCouponCode,
        coinsUsed: coinRedeemCalc.coinsUsed,
        rewardsSettings,
        shippingFee,
        idempotencyKey,
        items: enrichedItems.map((i) => ({
          cartItemId: i.cartItemId,
          productId: i.product.id,
          quantity: i.quantity,
          selectedColor: i.selectedColor,
          selectedSize: i.selectedSize,
        })),
        activeFlashSalePrices,
      });

      if (coinRedeemCalc.coinsUsed > 0) {
        await refreshProfile();
      }
      showToast('Order placed successfully!', 'success');
      navigate(`/order-confirmation/${orderId}`, { replace: true });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to place order.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (enrichedItems.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <EmptyState
          title="Your cart is empty"
          description="Add products to your cart before proceeding to checkout."
          actionLabel="Browse Products"
          actionTo="/products"
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 md:px-6 py-5 md:py-8">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display text-xl md:text-2xl font-bold text-slate-900">Checkout</h1>
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          Protected Order Validation
        </span>
      </div>

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          {/* Delivery Information */}
          <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#F85606]" />
                <span>1. Nationwide Bangladesh Delivery Address</span>
              </h2>
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                {enabledDistricts.length} Districts (Dhaka {symbol}
                {shippingSettings.insideDhakaFee ?? 80} · Tangail &amp; BD {symbol}
                {shippingSettings.outsideDhakaFee ?? 120})
              </span>
            </div>

            {/* 1-Click Saved Delivery Addresses */}
            {savedAddresses.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    1-Click Saved Addresses
                  </span>
                  <Link
                    to="/account#addresses"
                    className="text-[11px] font-semibold text-[#F85606] hover:underline"
                  >
                    Manage Addresses
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {savedAddresses.map((addr) => {
                    const active = selectedSavedAddressId === addr.id;
                    return (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => applySavedAddress(addr)}
                        className={`p-3 rounded-xl border text-left transition-colors ${
                          active
                            ? 'border-[#F85606] bg-[#FFF5F0]'
                            : 'border-slate-200 bg-slate-50/70 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                            {addr.label}
                          </span>
                          {active && (
                            <span className="text-[11px] font-bold text-[#F85606]">Selected ✓</span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-slate-900 mt-1.5">
                          {addr.recipientName} · {addr.phone}
                        </p>
                        <p className="text-[11px] text-slate-600 line-clamp-1">
                          {addr.address}, {addr.area}, {addr.city}, {addr.district}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    setSelectedSavedAddressId(null);
                  }}
                  placeholder="Recipient full name"
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#F85606]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  minLength={6}
                  value={mobile}
                  onChange={(e) => {
                    setMobile(e.target.value);
                    setSelectedSavedAddressId(null);
                  }}
                  placeholder="01XXXXXXXXX"
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#F85606]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email (optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#F85606]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  District (Bangladesh) *
                </label>
                <select
                  required
                  value={district}
                  onChange={(e) => {
                    const nextDist = e.target.value;
                    setDistrict(nextDist);
                    setSelectedSavedAddressId(null);
                    const nextAreas = getDistrictAreas(nextDist);
                    if (nextAreas.length > 0 && !nextAreas.includes(area)) {
                      setArea('');
                    }
                  }}
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-[#F85606]"
                >
                  {districtsByDivision.map(([division, list]) => (
                    <optgroup key={division} label={`${division} Division`}>
                      {list.map((d) => {
                        const fee = computeDeliveryFeeForArea(shippingSettings, d.name, 1);
                        return (
                          <option key={d.name} value={d.name}>
                            {d.name} — Delivery {formatPrice(fee, symbol)}
                          </option>
                        );
                      })}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  City / Thana / Upazila *
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    setSelectedSavedAddressId(null);
                  }}
                  placeholder="e.g. Dhaka North, Tangail Sadar, Savar"
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#F85606]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Area / Locality *
                </label>
                <input
                  type="text"
                  required
                  value={area}
                  onChange={(e) => {
                    setArea(e.target.value);
                    setSelectedSavedAddressId(null);
                  }}
                  placeholder="Select below or type exact area / village"
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#F85606]"
                />
                {districtAreas.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {districtAreas.slice(0, 12).map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setArea(preset)}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                          area === preset
                            ? 'border-[#F85606] bg-[#FFF5F0] text-[#F85606]'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Delivery Address (House, Road, Block, Flat, Landmark) *
                </label>
                <textarea
                  required
                  rows={2}
                  value={deliveryAddress}
                  onChange={(e) => {
                    setDeliveryAddress(e.target.value);
                    setSelectedSavedAddressId(null);
                  }}
                  placeholder="House #, Road #, Sector / Block, Village / Bazar, Landmark"
                  className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#F85606]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Delivery Instructions (optional)
                </label>
                <input
                  type="text"
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                  placeholder="Preferred time, call before arrival, gate code, etc."
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#F85606]"
                />
              </div>
            </div>

            {!selectedSavedAddressId && (
              <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveAddressForFuture}
                  onChange={(e) => setSaveAddressForFuture(e.target.checked)}
                  className="accent-[#F85606]"
                />
                <span>Save this delivery address to my Address Book for 1-click checkout</span>
              </label>
            )}

            <div className="bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700">
              <span className="inline-flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-[#F85606]" />
                <span>
                  Home Delivery Charge for <strong>{district}</strong>:{' '}
                  <strong className="font-mono text-[#F85606]">
                    {shippingFee === 0 ? 'Free' : formatPrice(shippingFee, symbol)}
                  </strong>
                </span>
              </span>
              {shippingSettings.estimatedDeliveryDays && (
                <span className="text-slate-500">{shippingSettings.estimatedDeliveryDays}</span>
              )}
            </div>
          </section>

          {/* Payment Method & First-Order Advance Delivery Fee Section */}
          <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h2 className="font-display text-base font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#F85606]" />
              <span>2. Payment Method &amp; Delivery Charge Policy</span>
            </h2>

            {checkingFirstOrder ? (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-500">
                Checking account order history...
              </div>
            ) : requiresAdvanceDelivery ? (
              <div className="bg-[#FFF5F0] border border-orange-200 rounded-xl p-4 space-y-2">
                <div className="flex items-start gap-2.5">
                  <Info className="w-5 h-5 text-[#F85606] shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs md:text-sm text-slate-800">
                    <p className="font-bold text-[#C94300]">
                      First Order Policy — Advance Delivery Charge Only ({formatPrice(shippingFee, symbol)})
                    </p>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      Because this is the <strong>first order from your account</strong>, only the
                      delivery charge (
                      <strong className="font-mono text-[#F85606]">
                        {formatPrice(shippingFee, symbol)}
                      </strong>
                      ) must be paid in advance using an active mobile banking option (bKash,
                      Nagad, or Rocket). The remaining product price (
                      <strong className="font-mono">
                        {formatPrice(productPayable, symbol)}
                      </strong>
                      ) will be collected via <strong>Cash on Delivery (COD)</strong> when you
                      receive the product.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              firstOrderPolicyActive &&
              !isFirstOrder && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">
                      Returning Customer Advantage ({priorOrderCount} previous order
                      {priorOrderCount > 1 ? 's' : ''})
                    </p>
                    <p className="text-emerald-800 mt-0.5">
                      No advance delivery charge is required. You can place this order with full
                      Cash on Delivery or pay digitally.
                    </p>
                  </div>
                </div>
              )
            )}

            {selectablePaymentMethods.length === 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3 text-sm text-amber-900">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">
                    {requiresAdvanceDelivery
                      ? 'No mobile banking method (bKash / Nagad / Rocket) is active yet for advance delivery payment.'
                      : 'No payment methods are enabled yet.'}
                  </p>
                  <p className="text-xs text-amber-800 mt-1">
                    {requiresAdvanceDelivery
                      ? 'The store administrator must turn ON at least one mobile payment option (bKash, Nagad, or Rocket) in Admin → Payments.'
                      : 'The store administrator must enable at least one payment option before orders can be placed.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectablePaymentMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center justify-between gap-3 p-3.5 border rounded-xl cursor-pointer transition-colors ${
                        selectedPaymentId === method.id
                          ? 'border-[#F85606] bg-[#FFF5F0]'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={selectedPaymentId === method.id}
                          onChange={() => setSelectedPaymentId(method.id)}
                          className="text-[#F85606] focus:ring-[#F85606]"
                        />
                        <div className="min-w-0">
                          <span className="text-sm font-semibold text-slate-900 block">
                            {method.label}
                          </span>
                          {requiresAdvanceDelivery && (
                            <span className="text-[11px] text-[#F85606] font-medium block">
                              Pay {formatPrice(shippingFee, symbol)} advance + COD{' '}
                              {formatPrice(productPayable, symbol)}
                            </span>
                          )}
                        </div>
                      </div>
                      {method.accountType && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600 shrink-0">
                          {method.accountType}
                        </span>
                      )}
                    </label>
                  ))}
                </div>

                {selectedPaymentMethod && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
                      <span className="text-xs font-semibold text-slate-700">
                        {requiresAdvanceDelivery
                          ? `Send Advance Delivery Charge via ${selectedPaymentMethod.label}`
                          : selectedPaymentMethod.label}
                      </span>
                      <span className="font-mono text-sm font-bold text-[#F85606]">
                        Pay Now: {formatPrice(advancePayableNow, symbol)}
                      </span>
                    </div>

                    {/* Multi-wallet account selector */}
                    {activeWallets.length > 0 && (
                      <div className="space-y-2">
                        {activeWallets.length > 1 && (
                          <p className="text-xs font-semibold text-slate-700">
                            Select Active {selectedPaymentMethod.label} Number:
                          </p>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {activeWallets.map((wal) => {
                            const isSelectedWal = selectedWallet?.id === wal.id;
                            return (
                              <div
                                key={wal.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => setSelectedWalletId(wal.id)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setSelectedWalletId(wal.id);
                                  }
                                }}
                                className={`p-3 rounded-xl border text-xs cursor-pointer space-y-1.5 transition-colors ${
                                  isSelectedWal
                                    ? 'bg-white border-[#F85606] ring-1 ring-[#F85606]/25'
                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-bold text-slate-800">{wal.label}</span>
                                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                    {wal.accountType}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-mono text-sm font-extrabold text-slate-900">
                                    {wal.accountNumber}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      void handleCopyWallet(wal.accountNumber);
                                    }}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 hover:bg-[#FFF5F0] hover:text-[#F85606] text-[11px] font-semibold text-slate-700"
                                  >
                                    {copiedWallet && isSelectedWal ? (
                                      <Check className="w-3 h-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                    <span>Copy</span>
                                  </button>
                                </div>
                                {wal.accountName && (
                                  <p className="text-[11px] text-slate-500">
                                    Name: {wal.accountName}
                                  </p>
                                )}
                                {wal.sendMoneyOnly && (
                                  <div className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded">
                                    <AlertTriangle className="w-3 h-3 shrink-0" />
                                    <span>ONLY SEND MONEY (ক্যাশ আউট করবেন না)</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {selectedPaymentMethod.instructions && (
                      <p className="text-xs text-slate-600">{selectedPaymentMethod.instructions}</p>
                    )}

                    {(selectedPaymentMethod.requiresTransactionId || requiresAdvanceDelivery) &&
                      selectedPaymentMethod.id !== 'cod' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Your Sender Mobile / Account Number *
                            </label>
                            <input
                              type="text"
                              required
                              value={paymentSenderNumber}
                              onChange={(e) => setPaymentSenderNumber(e.target.value)}
                              placeholder="01XXXXXXXXX"
                              className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Transaction ID (TrxID) *
                            </label>
                            <input
                              type="text"
                              required
                              value={paymentTransactionId}
                              onChange={(e) => setPaymentTransactionId(e.target.value)}
                              placeholder="e.g. 9G5H2K7X"
                              className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm font-mono"
                            />
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Order Summary, AS Coins & Coupon */}
        <aside className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 sticky top-28">
            <h2 className="font-display text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
              Order Summary
            </h2>

            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {enrichedItems.map((item) => (
                <div key={item.cartItemId} className="flex justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">{item.product.name}</p>
                    <p className="text-slate-500">
                      Qty {item.quantity}
                      {item.selectedColor ? ` · ${item.selectedColor}` : ''}
                      {item.selectedSize ? ` · ${item.selectedSize}` : ''}
                    </p>
                  </div>
                  <span className="font-mono tabular-nums font-semibold text-slate-900 shrink-0">
                    {formatPrice(item.lineTotal, symbol)}
                  </span>
                </div>
              ))}
            </div>

            {/* Redeem AS Coins Toggle */}
            {rewardsSettings.coinsEnabled && availableCoins > 0 && (
              <div className="pt-3 border-t border-slate-100">
                <label
                  className={`flex items-center justify-between gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    useCoins
                      ? 'border-[#F85606] bg-[#FFF5F0]'
                      : 'border-slate-200 bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      disabled={!canRedeemCoins}
                      checked={useCoins && canRedeemCoins}
                      onChange={(e) => setUseCoins(e.target.checked)}
                      className="accent-[#F85606]"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 inline-flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5 text-[#F85606]" />
                        <span>Use AS Coins ({availableCoins.toLocaleString()} available)</span>
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {canRedeemCoins
                          ? `${rewardsSettings.coinsUnit} Coins = ${symbol}${rewardsSettings.takaPerUnit} off (Max ${rewardsSettings.maxCoinDiscountPercent}%)`
                          : `Minimum ${rewardsSettings.minCoinsToRedeem} Coins needed to redeem`}
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            )}

            {/* Coupon */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <label className="block text-xs font-semibold text-slate-700">Apply Coupon</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Enter code"
                  className="flex-1 h-9 px-3 border border-slate-200 rounded-lg text-sm font-mono uppercase focus:outline-none focus:border-[#F85606]"
                />
                <button
                  type="button"
                  disabled={applyingCoupon || !couponInput.trim()}
                  onClick={handleApplyCoupon}
                  className="px-3.5 h-9 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 disabled:opacity-40"
                >
                  {applyingCoupon ? '...' : 'Apply'}
                </button>
              </div>
              {appliedCouponCode && (
                <p className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    Coupon {appliedCouponCode} applied (-{formatPrice(couponDiscount, symbol)})
                  </span>
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Products Subtotal</span>
                <span className="font-mono tabular-nums">{formatPrice(subtotal, symbol)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span className="inline-flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" />
                    Coupon Discount
                  </span>
                  <span className="font-mono tabular-nums">
                    -{formatPrice(couponDiscount, symbol)}
                  </span>
                </div>
              )}
              {coinRedeemCalc.coinDiscount > 0 && (
                <div className="flex justify-between text-amber-700 font-medium">
                  <span className="inline-flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5" />
                    AS Coins ({coinRedeemCalc.coinsUsed} Coins)
                  </span>
                  <span className="font-mono tabular-nums">
                    -{formatPrice(coinRedeemCalc.coinDiscount, symbol)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Delivery Fee ({district})</span>
                <span className="font-mono tabular-nums">
                  {shippingFee === 0 ? 'Free' : formatPrice(shippingFee, symbol)}
                </span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-900">Order Total</span>
                <span className="font-mono tabular-nums text-lg font-bold text-slate-900">
                  {formatPrice(finalTotal, symbol)}
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="font-semibold text-[#F85606]">
                    {requiresAdvanceDelivery
                      ? 'Advance Payable Now (Delivery Charge)'
                      : 'Advance / Online Payable Now'}
                  </span>
                  <span className="font-mono font-bold text-[#F85606]">
                    {formatPrice(advancePayableNow, symbol)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Payable on Delivery (COD)</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {formatPrice(dueOnDelivery, symbol)}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || selectablePaymentMethods.length === 0 || checkingFirstOrder}
              className="w-full h-11 bg-[#F85606] hover:bg-[#E04A00] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                {submitting
                  ? 'Placing Order...'
                  : requiresAdvanceDelivery
                  ? `Confirm & Pay ${formatPrice(advancePayableNow, symbol)} Delivery Advance`
                  : 'Place Order'}
              </span>
            </button>

            <p className="text-[11px] text-slate-500 text-center">
              Stock and prices are re-validated before order confirmation.{' '}
              <Link to="/cart" className="underline">
                Edit Cart
              </Link>
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
