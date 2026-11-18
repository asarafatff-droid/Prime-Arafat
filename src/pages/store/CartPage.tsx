import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { EmptyState } from '../../components/common/EmptyState';
import { ImageWithFallback } from '../../components/common/ImageWithFallback';
import { useAuth } from '../../contexts/AuthContext';
import { useStore } from '../../contexts/StoreContext';
import { formatPrice, getEffectivePrice } from '../../lib/utils';

export function CartPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    cart,
    products,
    websiteSettings,
    shippingSettings,
    activeFlashSalePrices,
    updateCartQuantity,
    removeFromCart,
  } = useStore();

  const symbol = websiteSettings.currencySymbol || '৳';

  const enrichedCart = useMemo(() => {
    const productMap = new Map(products.map((p) => [p.id, p]));
    return cart.map((item) => {
      const product = productMap.get(item.productId);
      const basePrice = product ? product.price : 0;
      const effectiveBase = product ? getEffectivePrice(product.price, product.discountPrice) : 0;
      const flashPrice = activeFlashSalePrices[item.productId];
      const unitPrice =
        flashPrice && flashPrice > 0 && flashPrice < effectiveBase ? flashPrice : effectiveBase;
      const lineTotal = unitPrice * item.quantity;
      const savings = basePrice > unitPrice ? (basePrice - unitPrice) * item.quantity : 0;
      return {
        ...item,
        product,
        unitPrice,
        lineTotal,
        savings,
      };
    });
  }, [cart, products, activeFlashSalePrices]);

  const subtotal = useMemo(
    () => enrichedCart.reduce((sum, item) => sum + item.lineTotal, 0),
    [enrichedCart]
  );
  const totalSavings = useMemo(
    () => enrichedCart.reduce((sum, item) => sum + item.savings, 0),
    [enrichedCart]
  );

  const estimatedDelivery = useMemo(() => {
    if (subtotal === 0) return 0;
    if (
      shippingSettings.freeShippingThreshold > 0 &&
      subtotal >= shippingSettings.freeShippingThreshold
    ) {
      return 0;
    }
    return shippingSettings.defaultFee || 0;
  }, [subtotal, shippingSettings]);

  const finalTotal = subtotal + estimatedDelivery;
  const hasStockIssue = enrichedCart.some(
    (item) => !item.product || item.product.stock < item.quantity
  );

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <EmptyState
          title="Sign in to view your shopping cart"
          description="Your cart is synced securely with your AS World account across all devices."
          icon={<ShoppingBag className="w-6 h-6" />}
          actionLabel="Sign In"
          actionTo="/login"
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 md:px-6 py-5 md:py-8">
      <h1 className="font-display text-xl md:text-2xl font-bold text-slate-900 mb-5">
        Shopping Cart ({cart.reduce((s, i) => s + i.quantity, 0)})
      </h1>

      {enrichedCart.length === 0 ? (
        <EmptyState
          title="Your shopping cart is empty."
          description="Explore the marketplace catalog and add items to your cart."
          icon={<ShoppingBag className="w-6 h-6" />}
          actionLabel="Continue Shopping"
          actionTo="/products"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-3">
            {enrichedCart.map((item) => {
              const p = item.product;
              const stockExceeded = !p || p.stock < item.quantity;
              return (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200 rounded-xl p-3.5 md:p-4 flex gap-3.5 md:gap-4"
                >
                  <Link
                    to={`/product/${item.productId}`}
                    className="w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden bg-slate-50 border border-slate-100 shrink-0"
                  >
                    <ImageWithFallback
                      src={p?.images?.[0]}
                      alt={p?.name || 'Product'}
                      className="w-full h-full object-cover"
                    />
                  </Link>

                  <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          to={`/product/${item.productId}`}
                          className="text-sm md:text-base font-semibold text-slate-900 hover:text-[#F85606] line-clamp-2"
                        >
                          {p ? p.name : 'Product no longer available'}
                        </Link>
                        {(item.selectedColor || item.selectedSize) && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            {[
                              item.selectedColor && `Color: ${item.selectedColor}`,
                              item.selectedSize && `Size: ${item.selectedSize}`,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                        )}
                        {stockExceeded && (
                          <p className="text-xs font-medium text-red-600 mt-1">
                            {!p || p.stock === 0
                              ? 'Currently out of stock. Please remove to proceed.'
                              : `Only ${p.stock} available in stock.`}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        aria-label="Remove item"
                        className="p-1.5 text-slate-400 hover:text-red-600 transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <span className="font-mono tabular-nums text-base font-bold text-[#F85606]">
                          {formatPrice(item.lineTotal, symbol)}
                        </span>
                        {p && p.price > item.unitPrice && (
                          <span className="ml-2 font-mono tabular-nums text-xs text-slate-400 line-through">
                            {formatPrice(p.price * item.quantity, symbol)}
                          </span>
                        )}
                      </div>

                      <div className="inline-flex items-center border border-slate-200 rounded-lg">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-50"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-9 text-center font-mono tabular-nums text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          disabled={!p || item.quantity >= p.stock}
                          onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="pt-2">
              <Link
                to="/products"
                className="text-sm font-semibold text-[#F85606] hover:text-[#E04A00]"
              >
                &larr; Continue Shopping
              </Link>
            </div>
          </div>

          <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 h-fit space-y-4 sticky top-28">
            <h2 className="font-display text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Order Summary
            </h2>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums font-medium text-slate-900">
                  {formatPrice(subtotal, symbol)}
                </span>
              </div>
              {totalSavings > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Product Discounts</span>
                  <span className="font-mono tabular-nums font-medium">
                    -{formatPrice(totalSavings, symbol)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Estimated Delivery</span>
                <span className="font-mono tabular-nums font-medium text-slate-900">
                  {estimatedDelivery === 0 ? 'Free / Standard' : formatPrice(estimatedDelivery, symbol)}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
              <span className="text-base font-bold text-slate-900">Total</span>
              <span className="font-mono tabular-nums text-xl font-bold text-[#F85606]">
                {formatPrice(finalTotal, symbol)}
              </span>
            </div>

            <button
              type="button"
              disabled={hasStockIssue || enrichedCart.length === 0}
              onClick={() => navigate('/checkout')}
              className="w-full h-11 bg-[#F85606] hover:bg-[#E04A00] text-white text-sm font-semibold rounded-lg inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
