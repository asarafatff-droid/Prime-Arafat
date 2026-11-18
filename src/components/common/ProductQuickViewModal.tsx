import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ExternalLink, Heart, Minus, Plus, ShoppingCart, Star, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useStore } from '../../contexts/StoreContext';
import { getColorHex } from '../../lib/colors';
import { computeDiscountPercent, formatPrice, getEffectivePrice } from '../../lib/utils';
import type { Product } from '../../types';
import { ImageWithFallback } from './ImageWithFallback';

interface ProductQuickViewModalProps {
  product: Product;
  flashSalePrice?: number;
  onClose: () => void;
}

export function ProductQuickViewModal({
  product,
  flashSalePrice,
  onClose,
}: ProductQuickViewModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { websiteSettings, activeFlashSalePrices, addToCart, toggleWishlist, isInWishlist } =
    useStore();

  const symbol = websiteSettings.currencySymbol || '৳';
  const images = product.images?.length ? product.images : [''];
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || '');
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || '');
  const [quantity, setQuantity] = useState(1);

  const baseEffective = getEffectivePrice(product.price, product.discountPrice);
  const flashPrice = flashSalePrice ?? activeFlashSalePrices[product.id];
  const finalPrice =
    flashPrice && flashPrice > 0 && flashPrice < baseEffective ? flashPrice : baseEffective;
  const discountPct = computeDiscountPercent(product.price, finalPrice);
  const outOfStock = product.stock <= 0;
  const wishlisted = isInWishlist(product.id);

  const handleAdd = async () => {
    if (outOfStock) return;
    await addToCart(product.id, quantity, selectedColor, selectedSize);
  };

  const handleBuy = async () => {
    if (outOfStock) return;
    const ok = await addToCart(product.id, quantity, selectedColor, selectedSize);
    onClose();
    if (ok) {
      navigate('/checkout');
    } else if (!user) {
      navigate('/login', { state: { from: `/product/${product.id}` } });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Quick view: ${product.name}`}
    >
      <div
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close quick view"
          className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-white/90 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center shadow-xs transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6">
          {/* Gallery */}
          <div className="md:col-span-5 space-y-2.5">
            <div className="aspect-square rounded-xl overflow-hidden bg-slate-50 border border-slate-100 relative">
              <ImageWithFallback
                src={images[activeImgIdx]}
                alt={product.name}
                fallbackText={product.name}
                className="w-full h-full object-contain"
              />
              {discountPct > 0 && (
                <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-[#F85606] text-white text-xs font-bold">
                  -{discountPct}%
                </span>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                {images.map((img, idx) => (
                  <button
                    key={`${img}_${idx}`}
                    type="button"
                    onClick={() => setActiveImgIdx(idx)}
                    className={`w-14 h-14 rounded-lg overflow-hidden border-2 shrink-0 transition-colors ${
                      activeImgIdx === idx ? 'border-[#F85606]' : 'border-slate-200'
                    }`}
                  >
                    <ImageWithFallback src={img} alt={`${product.name} ${idx + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info & Variant Selection */}
          <div className="md:col-span-7 flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="pr-8">
                {(product.brand || product.categoryName) && (
                  <p className="text-xs text-slate-500 mb-1">
                    {[product.brand, product.categoryName].filter(Boolean).join(' · ')}
                  </p>
                )}
                <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                  {product.name}
                </h2>
                <div className="flex items-center gap-2.5 mt-1.5 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1 tabular-nums">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <strong className="text-slate-900">{(product.ratingAvg || 0).toFixed(1)}</strong>
                    <span>({product.ratingCount || 0})</span>
                  </span>
                  {product.salesCount > 0 && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{product.salesCount} sold</span>
                    </>
                  )}
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

              <div className="py-2.5 border-y border-slate-100 flex items-baseline gap-2.5 flex-wrap">
                <span className="font-mono tabular-nums text-2xl font-bold text-[#F85606]">
                  {formatPrice(finalPrice, symbol)}
                </span>
                {discountPct > 0 && (
                  <span className="font-mono tabular-nums text-sm text-slate-400 line-through">
                    {formatPrice(product.price, symbol)}
                  </span>
                )}
              </div>

              {product.description && (
                <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed">
                  {product.description}
                </p>
              )}

              {(product.colors?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-1.5">
                    Color: <span className="text-slate-900">{selectedColor}</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {product.colors!.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                          selectedColor === color
                            ? 'border-[#F85606] bg-[#FFF5F0] text-[#F85606]'
                            : 'border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full border border-slate-300"
                          style={{ backgroundColor: getColorHex(color) }}
                        />
                        <span>{color}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(product.sizes?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-1.5">
                    Size: <span className="text-slate-900">{selectedSize}</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {product.sizes!.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
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

              <div className="flex items-center gap-3 pt-1">
                <span className="text-xs font-semibold text-slate-700">Quantity</span>
                <div className="inline-flex items-center border border-slate-200 rounded-lg">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 flex items-center justify-center text-slate-600 hover:bg-slate-50"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center font-mono tabular-nums text-sm font-semibold">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() =>
                      setQuantity((q) => Math.min(Math.max(1, product.stock), q + 1))
                    }
                    disabled={quantity >= product.stock}
                    className="w-9 h-9 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={outOfStock}
                  onClick={handleBuy}
                  className="flex-1 h-11 bg-[#F85606] hover:bg-[#E04A00] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40"
                >
                  Buy Now
                </button>
                <button
                  type="button"
                  disabled={outOfStock}
                  onClick={handleAdd}
                  className="flex-1 h-11 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Add to Cart</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleWishlist(product.id)}
                  aria-label="Toggle wishlist"
                  className="h-11 w-11 border border-slate-200 rounded-xl flex items-center justify-center text-slate-700 hover:border-[#F85606] hover:text-[#F85606] shrink-0"
                >
                  <Heart
                    className={`w-4 h-4 ${wishlisted ? 'fill-[#F85606] text-[#F85606]' : ''}`}
                  />
                </button>
              </div>
              <Link
                to={`/product/${product.id}`}
                onClick={onClose}
                className="w-full py-2 text-xs font-semibold text-[#F85606] hover:text-[#E04A00] flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>View Full Product Details &amp; Reviews</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
