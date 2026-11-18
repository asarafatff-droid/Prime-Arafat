import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Eye, Heart, ShoppingCart, Star, Truck } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import { getColorHex } from '../../lib/colors';
import { computeDiscountPercent, formatPrice, getEffectivePrice } from '../../lib/utils';
import type { Product } from '../../types';
import { ImageWithFallback } from './ImageWithFallback';
import { ProductQuickViewModal } from './ProductQuickViewModal';

interface ProductCardProps {
  product: Product;
  flashSalePrice?: number;
  flashStockLimit?: number;
  flashSoldCount?: number;
}

export function ProductCard({
  product,
  flashSalePrice,
  flashStockLimit,
  flashSoldCount,
}: ProductCardProps) {
  const {
    websiteSettings,
    shippingSettings,
    addToCart,
    toggleWishlist,
    isInWishlist,
    activeFlashSalePrices,
  } = useStore();
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const symbol = websiteSettings.currencySymbol || '৳';

  const baseEffective = getEffectivePrice(product.price, product.discountPrice);
  const flashPrice = flashSalePrice ?? activeFlashSalePrices[product.id];
  const finalPrice =
    flashPrice && flashPrice > 0 && flashPrice < baseEffective ? flashPrice : baseEffective;
  const discountPct = computeDiscountPercent(product.price, finalPrice);
  const wishlisted = isInWishlist(product.id);
  const outOfStock = product.stock <= 0;
  const secondaryImage = product.images?.[1];

  const baseDeliveryFee =
    shippingSettings.insideDhakaFee > 0
      ? shippingSettings.insideDhakaFee
      : shippingSettings.defaultFee || 80;

  const detailLine =
    [product.brand, product.categoryName].filter(Boolean).join(' · ') ||
    product.description?.trim() ||
    '';

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    const ok = await addToCart(
      product.id,
      1,
      product.colors?.[0] || '',
      product.sizes?.[0] || ''
    );
    if (ok) {
      setJustAdded(true);
      window.setTimeout(() => setJustAdded(false), 1200);
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWishlist(product.id);
  };

  const handleOpenQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickViewOpen(true);
  };

  const showFlashProgress =
    typeof flashStockLimit === 'number' &&
    flashStockLimit > 0 &&
    typeof flashSoldCount === 'number';
  const soldRatio = showFlashProgress
    ? Math.min(100, Math.round(((flashSoldCount || 0) / flashStockLimit!) * 100))
    : 0;

  return (
    <>
      <Link
        to={`/product/${product.id}`}
        className="group bg-white border border-slate-200/75 rounded-xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(15,23,42,0.08)] hover:border-[#F85606]/35"
      >
        <div className="relative aspect-square bg-slate-50 overflow-hidden">
          <ImageWithFallback
            src={product.images?.[0]}
            alt={product.name}
            fallbackText={product.name}
            className={`w-full h-full object-cover transition-all duration-300 ${
              secondaryImage ? 'group-hover:opacity-0' : 'group-hover:scale-[1.04]'
            }`}
          />
          {secondaryImage && (
            <img
              src={secondaryImage}
              alt={`${product.name} alternate view`}
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            />
          )}

          {discountPct > 0 && (
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#F85606] text-white text-[10px] font-bold leading-tight shadow-xs">
              -{discountPct}%
            </span>
          )}

          <div className="absolute top-2 right-2 flex flex-col gap-1.5">
            <button
              type="button"
              onClick={handleToggleWishlist}
              aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-xs border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-[#F85606] shadow-xs transition-colors"
            >
              <Heart
                className={`w-3.5 h-3.5 md:w-4 md:h-4 ${
                  wishlisted ? 'fill-[#F85606] text-[#F85606]' : ''
                }`}
              />
            </button>
            <button
              type="button"
              onClick={handleOpenQuickView}
              aria-label={`Quick view ${product.name}`}
              title="Quick View"
              className="hidden sm:flex w-8 h-8 rounded-full bg-white/95 backdrop-blur-xs border border-slate-200/80 items-center justify-center text-slate-600 hover:text-[#F85606] shadow-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
          </div>

          {outOfStock && (
            <div className="absolute inset-x-0 bottom-0 bg-slate-900/75 text-white text-[11px] font-semibold text-center py-1">
              Out of Stock
            </div>
          )}
        </div>

        <div className="p-2.5 md:p-3 flex flex-col flex-1 justify-between gap-2">
          <div className="space-y-1">
            <h3 className="text-xs md:text-sm font-medium text-slate-900 line-clamp-2 leading-snug group-hover:text-[#F85606] transition-colors">
              {product.name}
            </h3>
            {detailLine && (
              <p className="text-[11px] text-slate-500 line-clamp-1">{detailLine}</p>
            )}
            {(product.colors?.length ?? 0) > 0 && (
              <div className="flex items-center gap-1 pt-0.5">
                {product.colors!.slice(0, 5).map((color) => (
                  <span
                    key={color}
                    title={color}
                    className="w-3 h-3 rounded-full border border-slate-300 shrink-0"
                    style={{ backgroundColor: getColorHex(color) }}
                  />
                ))}
                {product.colors!.length > 5 && (
                  <span className="text-[10px] text-slate-500 font-medium">
                    +{product.colors!.length - 5}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="font-mono tabular-nums text-sm md:text-base font-bold text-[#F85606]">
                {formatPrice(finalPrice, symbol)}
              </span>
              {discountPct > 0 && (
                <span className="font-mono tabular-nums text-[11px] text-slate-400 line-through">
                  {formatPrice(product.price, symbol)}
                </span>
              )}
            </div>

            {showFlashProgress ? (
              <div className="space-y-1">
                <div className="h-1.5 w-full rounded-full bg-orange-100 overflow-hidden">
                  <div
                    className="h-full bg-[#F85606] rounded-full"
                    style={{ width: `${Math.max(8, soldRatio)}%` }}
                  />
                </div>
                <p className="text-[10px] font-semibold text-[#F85606] tabular-nums">
                  {flashSoldCount} / {flashStockLimit} claimed
                </p>
              </div>
            ) : (
              <p className="text-[10px] text-slate-500 flex items-center gap-1">
                <Truck className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">
                  {shippingSettings.freeShippingThreshold > 0 &&
                  finalPrice >= shippingSettings.freeShippingThreshold
                    ? 'Free Delivery'
                    : `Delivery ${formatPrice(baseDeliveryFee, symbol)}+`}
                </span>
              </p>
            )}

            <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-100">
              <div className="flex items-center gap-1 text-[11px] text-slate-500 tabular-nums min-w-0">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                <span>{(product.ratingAvg || 0).toFixed(1)}</span>
                <span className="text-slate-400 truncate">
                  {product.salesCount > 0
                    ? `· ${product.salesCount} sold`
                    : `(${product.ratingCount || 0})`}
                </span>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={outOfStock}
                aria-label={`Add ${product.name} to cart`}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] md:text-xs font-semibold transition-colors whitespace-nowrap shrink-0 disabled:opacity-40 disabled:pointer-events-none ${
                  justAdded
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#FFF5F0] text-[#F85606] hover:bg-[#F85606] hover:text-white'
                }`}
              >
                {justAdded ? (
                  <Check className="w-3 h-3 md:w-3.5 md:h-3.5" />
                ) : (
                  <ShoppingCart className="w-3 h-3 md:w-3.5 md:h-3.5" />
                )}
                <span>{justAdded ? 'Added' : 'Add'}</span>
              </button>
            </div>
          </div>
        </div>
      </Link>

      {quickViewOpen && (
        <ProductQuickViewModal
          product={product}
          flashSalePrice={flashSalePrice}
          onClose={() => setQuickViewOpen(false)}
        />
      )}
    </>
  );
}
