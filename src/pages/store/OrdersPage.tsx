import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ClipboardList, ExternalLink, MessageCircle, Phone, Truck, XCircle } from 'lucide-react';
import { EmptyState } from '../../components/common/EmptyState';
import { useAuth } from '../../contexts/AuthContext';
import { useStore } from '../../contexts/StoreContext';
import { useToast } from '../../contexts/ToastContext';
import { buildWhatsAppUrl } from '../../lib/searchHistory';
import { formatDateTime, formatPrice } from '../../lib/utils';
import { cancelPendingOrderByCustomer, listCustomerOrders } from '../../services/orderService';
import type { Order } from '../../types';

export function OrdersPage() {
  const { user } = useAuth();
  const { websiteSettings } = useStore();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const initialStatus = searchParams.get('status') || 'ALL';
  const [filterStatus, setFilterStatus] = useState(initialStatus);
  const symbol = websiteSettings.currencySymbol || '৳';

  useEffect(() => {
    const paramStatus = searchParams.get('status');
    setFilterStatus(paramStatus || 'ALL');
  }, [searchParams]);

  const loadOrders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const list = await listCustomerOrders(user.uid);
      setOrders(list);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load orders.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, [user]);

  const handleCancel = async (orderId: string) => {
    try {
      await cancelPendingOrderByCustomer(orderId);
      showToast('Order cancelled.', 'info');
      await loadOrders();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not cancel order.', 'error');
    }
  };

  const filtered =
    filterStatus === 'ALL' ? orders : orders.filter((o) => o.status === filterStatus);

  return (
    <div className="max-w-5xl mx-auto px-3 md:px-6 py-6 md:py-8 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">My Orders</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Track order status and review your purchase history.
          </p>
        </div>

        <select
          value={filterStatus}
          onChange={(e) => {
            const val = e.target.value;
            setFilterStatus(val);
            if (val === 'ALL') {
              setSearchParams({});
            } else {
              setSearchParams({ status: val });
            }
          }}
          className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm"
        >
          <option value="ALL">All Statuses</option>
          {[
            'Pending',
            'Confirmed',
            'Processing',
            'Packed',
            'Shipped',
            'Out for Delivery',
            'Delivered',
            'Cancelled',
            'Returned',
          ].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 h-28 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No orders yet."
          description="Your completed marketplace purchases will appear here."
          icon={<ClipboardList className="w-6 h-6" />}
          actionLabel="Start Shopping"
          actionTo="/products"
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-slate-200 rounded-xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono tabular-nums text-sm font-bold text-slate-900">
                    {order.orderNumber}
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      order.status === 'Delivered'
                        ? 'text-emerald-700'
                        : order.status === 'Cancelled' || order.status === 'Returned'
                        ? 'text-red-600'
                        : 'text-[#F85606]'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Placed {formatDateTime(order.createdAt)} · {order.itemCount}{' '}
                  {order.itemCount === 1 ? 'item' : 'items'} ·{' '}
                  {order.paymentMethodLabel || order.paymentMethod}
                </p>
                <p className="text-xs text-slate-600 truncate max-w-md">
                  Deliver to: {order.deliveryAddress}, {order.area}, {order.city}
                </p>
                {(order.coinDiscount ?? 0) > 0 && (
                  <p className="text-[11px] font-medium text-emerald-700">
                    AS Coins Saved: -{formatPrice(order.coinDiscount || 0, symbol)}
                  </p>
                )}
                {(order.deliveryManName || order.deliveryManPhone) && (
                  <p className="text-[11px] text-[#F85606] font-medium flex items-center gap-1.5 flex-wrap">
                    <Truck className="w-3.5 h-3.5" />
                    <span>Delivery Man: {order.deliveryManName || 'Assigned'}</span>
                    {order.deliveryManPhone && (
                      <a href={`tel:${order.deliveryManPhone}`} className="underline inline-flex items-center gap-0.5">
                        <Phone className="w-3 h-3" />
                        {order.deliveryManPhone}
                      </a>
                    )}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4">
                <div className="text-left sm:text-right">
                  <p className="text-xs text-slate-500">Total</p>
                  <p className="font-mono tabular-nums text-base font-bold text-slate-900">
                    {formatPrice(order.total, symbol)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {websiteSettings.whatsappNumber && (
                    <a
                      href={buildWhatsAppUrl(
                        websiteSettings.whatsappNumber,
                        `Hello! Checking status of order #${order.orderNumber}`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Ask on WhatsApp"
                      className="inline-flex items-center gap-1 px-2.5 py-2 border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {order.status === 'Pending' && (
                    <button
                      type="button"
                      onClick={() => handleCancel(order.id)}
                      className="inline-flex items-center gap-1 px-3 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  )}
                  <Link
                    to={`/track-order?order=${encodeURIComponent(order.orderNumber)}`}
                    className="inline-flex items-center gap-1 px-3.5 py-2 bg-[#FFF5F0] text-[#F85606] hover:bg-[#F85606] hover:text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    <span>Track</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
