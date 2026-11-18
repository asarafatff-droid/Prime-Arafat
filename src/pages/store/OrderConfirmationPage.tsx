import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, ClipboardList, MessageCircle, PackageCheck, Phone, Truck } from 'lucide-react';
import { EmptyState } from '../../components/common/EmptyState';
import { useStore } from '../../contexts/StoreContext';
import { buildWhatsAppUrl } from '../../lib/searchHistory';
import { formatDateTime, formatPrice } from '../../lib/utils';
import { getOrderById } from '../../services/orderService';
import type { Order, OrderItem } from '../../types';

export function OrderConfirmationPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { websiteSettings } = useStore();
  const [data, setData] = useState<{ order: Order; items: OrderItem[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const symbol = websiteSettings.currencySymbol || '৳';

  useEffect(() => {
    let active = true;
    async function load() {
      if (!orderId) return;
      setLoading(true);
      try {
        const res = await getOrderById(orderId);
        if (active) setData(res);
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white border border-slate-200 rounded-xl p-8 animate-pulse h-64" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <EmptyState
          title="Order confirmation unavailable"
          description="We could not locate this order record."
          actionLabel="View My Orders"
          actionTo="/orders"
        />
      </div>
    );
  }

  const { order, items } = data;
  const whatsappUrl = buildWhatsAppUrl(
    websiteSettings.whatsappNumber,
    `Hello! I just placed order #${order.orderNumber} (${order.customerName}, ${order.mobile}). Total: ${formatPrice(order.total, symbol)}`
  );

  return (
    <div className="max-w-3xl mx-auto px-3 md:px-6 py-8 space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Order Confirmed</h1>
        <p className="text-sm text-slate-600 mt-1.5">
          Thank you, {order.customerName}. Your order has been saved and is currently{' '}
          <strong>{order.status}</strong>.
        </p>

        <div className="mt-5 inline-flex flex-col sm:flex-row items-center gap-2 px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl">
          <span className="text-xs text-slate-500">Order ID:</span>
          <span className="font-mono tabular-nums text-base font-bold text-[#F85606]">
            {order.orderNumber}
          </span>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            to={`/track-order?order=${encodeURIComponent(order.orderNumber)}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F85606] hover:bg-[#E04A00] text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <PackageCheck className="w-4 h-4" />
            <span>Track Order</span>
          </Link>
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold rounded-lg transition-colors"
          >
            <ClipboardList className="w-4 h-4" />
            <span>My Orders</span>
          </Link>
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Send on WhatsApp</span>
            </a>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xs font-bold text-slate-500 uppercase mb-1">Delivery Details</h2>
            <p className="font-semibold text-slate-900">{order.customerName}</p>
            <p className="text-slate-600">{order.mobile}</p>
            <p className="text-slate-600">
              {order.deliveryAddress}, {order.area}, {order.city}, {order.district}
            </p>
            {(order.deliveryManName || order.deliveryManPhone) && (
              <div className="mt-2 p-2.5 bg-orange-50 border border-orange-200 rounded-lg text-xs text-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#F85606]" />
                  <span>
                    Delivery Man: <strong>{order.deliveryManName || 'Assigned'}</strong>
                  </span>
                </div>
                {order.deliveryManPhone && (
                  <a
                    href={`tel:${order.deliveryManPhone}`}
                    className="inline-flex items-center gap-1 font-semibold text-[#F85606]"
                  >
                    <Phone className="w-3 h-3" />
                    {order.deliveryManPhone}
                  </a>
                )}
              </div>
            )}
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-500 uppercase mb-1">Payment & Date</h2>
            <p className="text-slate-800">
              Method: <strong>{order.paymentMethodLabel || order.paymentMethod}</strong>
            </p>
            <p className="text-slate-600">Payment Status: {order.paymentStatus}</p>
            {order.paymentTransactionId && (
              <p className="text-slate-600 font-mono text-xs">
                TrxID: {order.paymentTransactionId}
              </p>
            )}
            <p className="text-slate-500 text-xs mt-1">{formatDateTime(order.createdAt)}</p>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-500 uppercase">Items Ordered</h2>
          <div className="divide-y divide-slate-100">
            {items.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between gap-4 text-sm">
                <div>
                  <p className="font-medium text-slate-900">{item.productName}</p>
                  <p className="text-xs text-slate-500">
                    Qty {item.quantity} × {formatPrice(item.unitPrice, symbol)}
                    {item.selectedColor ? ` · ${item.selectedColor}` : ''}
                    {item.selectedSize ? ` · ${item.selectedSize}` : ''}
                  </p>
                </div>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {formatPrice(item.lineTotal, symbol)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 space-y-1.5 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span className="font-mono tabular-nums">{formatPrice(order.subtotal, symbol)}</span>
          </div>
          {(order.couponDiscount ?? 0) > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Coupon ({order.couponCode})</span>
              <span className="font-mono tabular-nums">
                -{formatPrice(order.couponDiscount || 0, symbol)}
              </span>
            </div>
          )}
          {(order.coinDiscount ?? 0) > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>AS Coins Redeemed ({order.coinsUsed || 0} coins)</span>
              <span className="font-mono tabular-nums">
                -{formatPrice(order.coinDiscount || 0, symbol)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-slate-600">
            <span>Shipping</span>
            <span className="font-mono tabular-nums">{formatPrice(order.shippingFee, symbol)}</span>
          </div>
          <div className="flex justify-between items-baseline pt-2 border-t border-slate-100 font-bold text-slate-900">
            <span>Total</span>
            <span className="font-mono tabular-nums text-lg text-[#F85606]">
              {formatPrice(order.total, symbol)}
            </span>
          </div>
          {(order.advancePaidAmount ?? 0) > 0 && (
            <div className="flex justify-between text-emerald-700 font-medium pt-1">
              <span>Advance Submitted ({order.paymentMethodLabel || order.paymentMethod})</span>
              <span className="font-mono tabular-nums">
                {formatPrice(order.advancePaidAmount || 0, symbol)}
              </span>
            </div>
          )}
          {typeof order.dueOnDeliveryAmount === 'number' && order.dueOnDeliveryAmount > 0 && (
            <div className="flex justify-between text-slate-900 font-bold">
              <span>Payable on Delivery (Cash on Delivery)</span>
              <span className="font-mono tabular-nums">
                {formatPrice(order.dueOnDeliveryAmount, symbol)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
