import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  CheckCircle2,
  Coins,
  Heart,
  Info,
  MapPin,
  MessageCircle,
  Minus,
  Package,
  Plus,
  Share2,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
} from 'lucide-react';
import { EmptyState } from '../../components/common/EmptyState';
import { ImageWithFallback } from '../../components/common/ImageWithFallback';
import { ProductCard } from '../../components/common/ProductCard';
import { useAuth } from '../../contexts/AuthContext';
import { useStore } from '../../contexts/StoreContext';
import { useToast } from '../../contexts/ToastContext';
import {
  BANGLADESH_DISTRICTS,
  computeDeliveryFeeForArea,
  isDistrictDeliveryEnabled,
} from '../../lib/bangladeshLocations';
import { addRecentlyViewedId, buildWhatsAppUrl } from '../../lib/searchHistory';
import { getColorHex } from '../../lib/colors';
import {
  computeDiscountPercent,
  formatDate,
  formatPrice,
  getEffectivePrice,
} from '../../lib/utils';
import { getProductById } from '../../services/catalogService';
import { listCustomerOrders } from '../../services/orderService';
import { claimShareBonus } from '../../services/rewardsService';
import { listApprovedProductReviews, submitVerifiedReview } from '../../services/userService';
import type { Order, Product, Review } from '../../types';

export function ProductDetailsPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { user, customerProfile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const {
    products,
    websiteSettings,
    shippingSettings,
    rewardsSettings,
    activeFlashSalePrices,
    addToCart,
    toggleWishlist,
    isInWishlist,
  } = useStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [previewDistrict, setPreviewDistrict] = useState('Dhaka');

  const [reviews, setReviews] = useState<Review[]>([]);
  const [eligibleOrder, setEligibleOrder] = useState<Order | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const symbol = websiteSettings.currencySymbol || '৳';

  const enabledDistricts = useMemo(
    () => BANGLADESH_DISTRICTS.filter((d) => isDistrictDeliveryEnabled(shippingSettings, d.name)),
    [shippingSettings]
  );

  useEffect(() => {
    const profileDistrict = customerProfile?.district;
    if (
      profileDistrict &&
      enabledDistricts.some(
        (d) => d.name.toLowerCase() === profileDistrict.toLowerCase()
      )
    ) {
      setPreviewDistrict(profileDistrict);
    } else if (
      enabledDistricts.length > 0 &&
      !enabledDistricts.some((d) => d.name.toLowerCase() === previewDistrict.toLowerCase())
    ) {
      setPreviewDistrict(enabledDistricts[0].name);
    }
  }, [customerProfile?.district, enabledDistricts, previewDistrict]);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!productId) return;
      setLoading(true);
      try {
        const fetched = await getProductById(productId);
        if (!active) return;
        setProduct(fetched);
        if (fetched) {
          addRecentlyViewedId(fetched.id);
        }
        setActiveImgIdx(0);
        setSelectedColor(fetched?.colors?.[0] || '');
        setSelectedSize(fetched?.sizes?.[0] || '');
        setQuantity(1);

        const revs = await listApprovedProductReviews(productId);
        if (active) setReviews(revs);
      } catch (err) {
        if (active) {
          showToast(err instanceof Error ? err.message : 'Failed to load product.', 'error');
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [productId, showToast]);

  // Verify if signed-in customer purchased this product so they can submit a verified purchase review
  useEffect(() => {
    let active = true;
    async function checkPurchase() {
      if (!user || !productId) {
        setEligibleOrder(null);
        return;
      }
      try {
        const orders = await listCustomerOrders(user.uid);
        const match = orders.find(
          (o) =>
            o.status !== 'Cancelled' &&
            Array.isArray(o.productIds) &&
            o.productIds.includes(productId)
        );
        if (active) setEligibleOrder(match || null);
      } catch {
        if (active) setEligibleOrder(null);
      }
    }
    void checkPurchase();
    return () => {
      active = false;
    };
  }, [user, productId]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return products
      .filter(
        (p) => p.id !== product.id && (!product.categoryId || p.categoryId === product.categoryId)
      )
      .slice(0, 5);
  }, [products, product]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="bg-white border border-slate-200 rounded-xl p-6 grid md:grid-cols-2 gap-8 animate-pulse">
          <div className="aspect-square bg-slate-100 rounded-xl" />
          <div className="space-y-4">
            <div className="h-7 bg-slate-100 rounded w-3/4" />
            <div className="h-6 bg-slate-100 rounded w-1/3" />
            <div className="h-24 bg-slate-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <EmptyState
          title="Product not found"
          description="This product may have been removed or is no longer available."
          icon={<Package className="w-6 h-6" />}
          actionLabel="Browse Catalog"
          actionTo="/products"
        />
      </div>
    );
  }

  const baseEffective = getEffectivePrice(product.price, product.discountPrice);
  const flashPrice = activeFlashSalePrices[product.id];
  const finalPrice =
    flashPrice && flashPrice > 0 && flashPrice < baseEffective ? flashPrice : baseEffective;
  const discountPct = computeDiscountPercent(product.price, finalPrice);
  const outOfStock = product.stock <= 0;
  const wishlisted = isInWishlist(product.id);
  const images = product.images?.length ? product.images : [''];

  const estimatedDeliveryFee = computeDeliveryFeeForArea(
    shippingSettings,
    previewDistrict,
    finalPrice * quantity
  );

  const handleAddToCart = async () => {
    if (outOfStock) return;
    await addToCart(product.id, quantity, selectedColor, selectedSize);
  };

  const handleBuyNow = async () => {
    if (outOfStock) return;
    const ok = await addToCart(product.id, quantity, selectedColor, selectedSize);
    if (ok) {
      navigate('/checkout');
    } else if (!user) {
      navigate('/login', { state: { from: `/product/${product.id}` } });
    }
  };

  const whatsappUrl = buildWhatsAppUrl(
    websiteSettings.whatsappNumber,
    `Hello! I would like to ask/order: ${product.name} (${window.location.origin}/product/${product.id})`
  );

  const handleShareProduct = async () => {
    const refPart = customerProfile?.referralCode
      ? `?ref=${encodeURIComponent(customerProfile.referralCode)}`
      : '';
    const shareUrl = `${window.location.origin}/product/${product.id}${refPart}`;
    let shared = false;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out ${product.name} on ${websiteSettings.websiteName || 'AS World'}`,
          url: shareUrl,
        });
        shared = true;
      } catch {
        // Fallback to clipboard copy
      }
    }
    if (!shared) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        shared = true;
      } catch {
        shared = false;
      }
    }
    if (!shared) {
      showToast('Could not copy product link.', 'error');
      return;
    }
    if (user && rewardsSettings.coinsEnabled && rewardsSettings.shareBonusCoins > 0) {
      try {
        const res = await claimShareBonus(user.uid, rewardsSettings, `Shared ${product.name}`);
        await refreshProfile();
        if (res.awarded > 0) {
          showToast(`Link shared! +${res.awarded} AS Coins credited to your wallet.`, 'success');
          return;
        }
      } catch {
        // Still acknowledge copy
      }
    }
    showToast(
      customerProfile?.referralCode
        ? 'Referral link copied! Earn commission when friends order.'
        : 'Product link copied!',
      'success'
    );
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !eligibleOrder || !reviewComment.trim()) return;
    setSubmittingReview(true);
    try {
      await submitVerifiedReview({
        productId: product.id,
        userId: user.uid,
        userName: customerProfile?.name || user.displayName || 'Verified Buyer',
        orderId: eligibleOrder.id,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      showToast('Thank you! Your verified purchase review has been published.', 'success');
      setReviewComment('');
      const revs = await listApprovedProductReviews(product.id);
      setReviews(revs);
      const updated = await getProductById(product.id);
      if (updated) setProduct(updated);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not submit review.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const specEntries = Object.entries(product.specifications || {});

  return (
    <>
      <div className="max-w-7xl mx-auto px-3 md:px-6 py-5 md:py-8 pb-24 md:pb-8 space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 overflow-x-auto whitespace-nowrap">
          <Link to="/" className="hover:text-[#F85606]">
            Home
          </Link>
          <span>/</span>
          {product.categoryId && (
            <>
              <Link to={`/products?category=${product.categoryId}`} className="hover:text-[#F85606]">
                {product.categoryName || 'Category'}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-slate-800 font-medium truncate">{product.name}</span>
        </nav>

        {/* Main Contiguous Purchase Module */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Gallery Left */}
          <div className="lg:col-span-5 space-y-3">
            <div className="aspect-square rounded-xl overflow-hidden bg-slate-50 border border-slate-100 relative">
              <ImageWithFallback
                src={images[activeImgIdx]}
                alt={product.name}
                fallbackText={product.name}
                className="w-full h-full object-contain"
              />
              {discountPct > 0 && (
                <span className="absolute top-3 left-3 px-2 py-1 rounded-md bg-[#F85606] text-white text-xs font-bold shadow-sm">
                  -{discountPct}% OFF
                </span>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {images.map((img, idx) => (
                  <button
                    key={`${img}_${idx}`}
                    type="button"
                    onClick={() => setActiveImgIdx(idx)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-colors ${
                      activeImgIdx === idx ? 'border-[#F85606]' : 'border-slate-200'
                    }`}
                  >
                    <ImageWithFallback src={img} alt={`${product.name} ${idx + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details & Purchase Center */}
          <div className="lg:col-span-4 space-y-4">
            <div>
              {(product.brand || product.sku) && (
                <p className="text-xs text-slate-500 mb-1">
                  {[product.brand && `Brand: ${product.brand}`, `SKU: ${product.sku}`]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              )}
              <h1 className="font-display text-xl md:text-2xl font-bold text-slate-900 leading-snug">
                {product.name}
              </h1>
              {product.description && (
                <p className="text-xs md:text-sm text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                  {product.description}
                </p>
              )}
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1 tabular-nums">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <strong className="text-slate-900">{(product.ratingAvg || 0).toFixed(1)}</strong>
                  <span>({product.ratingCount || 0} ratings)</span>
                </span>
                <span aria-hidden="true">·</span>
                <span
                  className={
                    outOfStock ? 'text-red-600 font-semibold' : 'text-emerald-700 font-semibold'
                  }
                >
                  {outOfStock ? 'Out of Stock' : `${product.stock} in stock`}
                </span>
              </div>
            </div>

            <div className="py-3 border-y border-slate-100 space-y-1">
              <div className="flex items-baseline gap-2.5 flex-wrap">
                <span className="font-mono tabular-nums text-2xl md:text-3xl font-bold text-[#F85606]">
                  {formatPrice(finalPrice, symbol)}
                </span>
                {discountPct > 0 && (
                  <>
                    <span className="font-mono tabular-nums text-sm text-slate-400 line-through">
                      {formatPrice(product.price, symbol)}
                    </span>
                    <span className="text-xs font-semibold text-slate-800">-{discountPct}% off</span>
                  </>
                )}
              </div>
              {flashPrice && flashPrice < baseEffective && (
                <p className="text-xs font-semibold text-[#F85606]">Flash Sale campaign price active</p>
              )}
            </div>

            {/* Colors with Live Circular Swatches */}
            {(product.colors?.length ?? 0) > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Color Family: <span className="text-slate-900">{selectedColor}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.colors!.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        selectedColor === color
                          ? 'border-[#F85606] bg-[#FFF5F0] text-[#F85606]'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0"
                        style={{ backgroundColor: getColorHex(color) }}
                      />
                      <span>{color}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {(product.sizes?.length ?? 0) > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Size: <span className="text-slate-900">{selectedSize}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes!.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        selectedSize === size
                          ? 'border-[#F85606] bg-[#FFF5F0] text-[#F85606]'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Quantity</label>
              <div className="inline-flex items-center border border-slate-200 rounded-lg">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-50"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-mono tabular-nums text-sm font-semibold">
                  {quantity}
                </span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => setQuantity((q) => Math.min(Math.max(1, product.stock), q + 1))}
                  disabled={quantity >= product.stock}
                  className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden md:flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                disabled={outOfStock}
                onClick={handleBuyNow}
                className="flex-1 h-11 bg-[#F85606] hover:bg-[#E04A00] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-40"
              >
                Buy Now
              </button>
              <button
                type="button"
                disabled={outOfStock}
                onClick={handleAddToCart}
                className="flex-1 h-11 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>
              <button
                type="button"
                onClick={() => toggleWishlist(product.id)}
                aria-label="Toggle wishlist"
                className="h-11 px-3.5 border border-slate-200 rounded-lg flex items-center justify-center text-slate-700 hover:border-[#F85606] hover:text-[#F85606]"
              >
                <Heart className={`w-5 h-5 ${wishlisted ? 'fill-[#F85606] text-[#F85606]' : ''}`} />
              </button>
            </div>

            {/* Share & Earn Coins + WhatsApp Quick Order */}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={handleShareProduct}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-semibold rounded-lg transition-colors"
              >
                <Share2 className="w-3.5 h-3.5 text-[#F85606]" />
                <span>Share & Earn</span>
                {rewardsSettings.coinsEnabled && rewardsSettings.shareBonusCoins > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-[#F85606]">
                    <Coins className="w-3 h-3" />+{rewardsSettings.shareBonusCoins || 15}
                  </span>
                )}
              </button>
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Order / Ask on WhatsApp</span>
                </a>
              )}
            </div>
          </div>

          {/* Delivery & Nationwide Bangladesh Service Right */}
          <div className="lg:col-span-3 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4 h-fit">
            <h3 className="font-display text-xs font-bold text-slate-700 uppercase tracking-wider">
              Delivery & Service
            </h3>

            <div className="space-y-3 text-sm">
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-[#F85606]" />
                  <span>Check Delivery Fee by District</span>
                </label>
                <select
                  value={previewDistrict}
                  onChange={(e) => setPreviewDistrict(e.target.value)}
                  className="w-full h-9 px-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#F85606]"
                >
                  {enabledDistricts.map((d) => (
                    <option key={d.name} value={d.name}>
                      {d.name} ({d.division})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-start gap-2.5 pt-2 border-t border-slate-200">
                <Truck className="w-4 h-4 text-[#F85606] shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-800">
                    Home Delivery ({previewDistrict})
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {product.shippingInfo ||
                      shippingSettings.estimatedDeliveryDays ||
                      'Nationwide doorstep delivery'}
                  </p>
                  <p className="text-xs font-mono tabular-nums font-bold text-[#F85606] mt-1">
                    {estimatedDeliveryFee === 0
                      ? 'Free Delivery'
                      : `Charge: ${formatPrice(estimatedDeliveryFee, symbol)}`}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Dhaka: {formatPrice(shippingSettings.insideDhakaFee ?? 80, symbol)} · Tangail & Other Districts:{' '}
                    {formatPrice(shippingSettings.outsideDhakaFee ?? 120, symbol)}
                  </p>
                </div>
              </div>

              {shippingSettings.firstOrderAdvanceDelivery !== false && (
                <div className="flex items-start gap-2.5 pt-2 border-t border-slate-200">
                  <Info className="w-4 h-4 text-[#F85606] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-800 text-xs">
                      First Order Policy
                    </p>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      1st order from an account requires advancing only the delivery charge via
                      bKash/Nagad/Rocket. Remaining product cost is Cash on Delivery.
                    </p>
                  </div>
                </div>
              )}

              {product.weight && (
                <div className="flex items-start gap-2.5 pt-2 border-t border-slate-200">
                  <Package className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">Package Weight</p>
                    <p className="text-xs font-medium text-slate-800">{product.weight}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2.5 pt-2 border-t border-slate-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-800">Authentic Storefront</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Verified order tracking and protected checkout.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description & Specifications */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 md:p-6 space-y-3">
            <h2 className="font-display text-lg font-bold text-slate-900">Product Description</h2>
            <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
              {product.description || 'No detailed description provided for this item.'}
            </p>
          </div>

          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 md:p-6 space-y-3">
            <h2 className="font-display text-lg font-bold text-slate-900">Specifications</h2>
            {specEntries.length === 0 && (product.variations?.length ?? 0) === 0 ? (
              <p className="text-sm text-slate-500">No technical specifications listed.</p>
            ) : (
              <div className="divide-y divide-slate-100 text-sm">
                {specEntries.map(([key, value]) => (
                  <div key={key} className="py-2 flex justify-between gap-4">
                    <span className="text-slate-500">{key}</span>
                    <span className="font-medium text-slate-900 text-right">{value}</span>
                  </div>
                ))}
                {(product.variations?.length ?? 0) > 0 && (
                  <div className="py-2 flex justify-between gap-4">
                    <span className="text-slate-500">Variations</span>
                    <span className="font-medium text-slate-900 text-right">
                      {product.variations!.join(', ')}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Customer Reviews */}
        <section className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">
                Verified Customer Reviews
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Only customers who have purchased this product can submit a review.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              <span className="font-mono tabular-nums text-xl font-bold text-slate-900">
                {(product.ratingAvg || 0).toFixed(1)}
              </span>
              <span className="text-xs text-slate-500">/ 5 ({reviews.length} reviews)</span>
            </div>
          </div>

          {eligibleOrder && (
            <form
              onSubmit={handleReviewSubmit}
              className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Verified Purchase (Order {eligibleOrder.orderNumber})
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      aria-label={`Rate ${star} stars`}
                      className="p-0.5"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                required
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share your experience with this product..."
                className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#F85606]"
              />
              <button
                type="submit"
                disabled={submittingReview}
                className="px-4 py-2 bg-[#F85606] hover:bg-[#E04A00] text-white text-sm font-semibold rounded-lg disabled:opacity-50"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          )}

          {reviews.length === 0 ? (
            <p className="text-sm text-slate-500">No reviews yet for this product.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {reviews.map((rev) => (
                <div key={rev.id} className="py-4 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{rev.userName}</span>
                      {rev.verifiedPurchase && (
                        <span className="text-[11px] font-medium text-emerald-700">
                          Verified Purchase
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">{formatDate(rev.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star
                        key={idx}
                        className={`w-3.5 h-3.5 ${
                          idx < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{rev.comment}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-display text-lg md:text-xl font-bold text-slate-900">
              Related Products
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 md:gap-4">
              {relatedProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  flashSalePrice={activeFlashSalePrices[p.id]}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Mobile Sticky Bottom Bar above the 6-icon MobileBottomNav */}
      <div className="md:hidden fixed bottom-14 inset-x-0 z-30 bg-white/95 backdrop-blur-sm border-t border-slate-200 px-3 py-2 flex items-center gap-2 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        <button
          type="button"
          onClick={() => toggleWishlist(product.id)}
          aria-label="Toggle wishlist"
          className="h-10 w-10 border border-slate-200 rounded-lg flex items-center justify-center text-slate-700 shrink-0"
        >
          <Heart className={`w-4 h-4 ${wishlisted ? 'fill-[#F85606] text-[#F85606]' : ''}`} />
        </button>
        <button
          type="button"
          disabled={outOfStock}
          onClick={handleAddToCart}
          className="flex-1 h-10 bg-slate-900 text-white text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-1.5 disabled:opacity-40"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Add to Cart</span>
        </button>
        <button
          type="button"
          disabled={outOfStock}
          onClick={handleBuyNow}
          className="flex-1 h-10 bg-[#F85606] text-white text-xs font-semibold rounded-lg disabled:opacity-40"
        >
          Buy {formatPrice(finalPrice, symbol)}
        </button>
      </div>
    </>
  );
}
