import { useEffect, useMemo, useState } from 'react';
import { Eye, Search, X } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import { useToast } from '../../contexts/ToastContext';
import { formatDateTime, formatPrice } from '../../lib/utils';
import {
  getOrderById,
  listAllOrders,
  updateOrderStatusByAdmin,
} from '../../services/orderService';
import type { Order, OrderItem, OrderStatus, PaymentStatus } from '../../types';

const ORDER_STATUSES: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Processing',
  'Packed',
  'Shipped',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
  'Returned',
];

const PAYMENT_STATUSES: PaymentStatus[] = ['unpaid', 'pending_verification', 'paid', 'refunded'];

export function AdminOrdersPage() {
  const { websiteSettings } = useStore();
  const { showToast } = useToast();
  const symbol = websiteSettings.currencySymbol || '৳';

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [selectedOrderDetail, setSelectedOrderDetail] = useState<{
    order: Order;
    items: OrderItem[];
  } | null>(null);
  const [nextStatus, setNextStatus] = useState<OrderStatus>('Pending');
  const [nextPaymentStatus, setNextPaymentStatus] = useState<PaymentStatus>('unpaid');
  const [statusNote, setStatusNote] = useState('');
  const [deliveryManName, setDeliveryManName] = useState('');
  const [deliveryManPhone, setDeliveryManPhone] = useState('');
  const [updating, setUpdating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const list = await listAllOrders();
      setOrders(list);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load orders.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
      if (!q) return true;
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.mobile.toLowerCase().includes(q)
      );
    });
  }, [orders, searchText, statusFilter]);

  const openDetail = async (orderId: string) => {
    try {
      const res = await getOrderById(orderId);
      if (res) {
        setSelectedOrderDetail(res);
        setNextStatus(res.order.status);
        setNextPaymentStatus(res.order.paymentStatus);
        setDeliveryManName(res.order.deliveryManName || '');
        setDeliveryManPhone(res.order.deliveryManPhone || '');
        setStatusNote('');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not fetch order details.', 'error');
    }
  };

  const handleUpdateOrder = async () => {
    if (!selectedOrderDetail) return;
    setUpdating(true);
    try {
      await updateOrderStatusByAdmin(
        selectedOrderDetail.order.id,
        nextStatus,
        nextPaymentStatus,
        statusNote,
        deliveryManName,
        deliveryManPhone
      );
      showToast('Order status & delivery man updated.', 'success');
      await load();
      await openDetail(selectedOrderDetail.order.id);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not update order.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Orders Management</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Inspect customer orders, verify payments, and update fulfillment status.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search by Order ID, customer name, or mobile..."
            className="w-full h-9 pl-9 pr-3 border border-slate-200 rounded-lg text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 px-3 border border-slate-200 rounded-lg text-sm bg-white"
        >
          <option value="ALL">All Statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading orders...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">No orders yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="py-3 px-4 font-semibold">Order ID</th>
                  <th className="py-3 px-3 font-semibold">Customer</th>
                  <th className="py-3 px-3 font-semibold">Mobile</th>
                  <th className="py-3 px-3 font-semibold">Payment</th>
                  <th className="py-3 px-3 font-semibold">Status</th>
                  <th className="py-3 px-3 font-semibold text-right">Total</th>
                  <th className="py-3 px-3 font-semibold text-right">Date</th>
                  <th className="py-3 px-4 font-semibold text-right">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                      {o.orderNumber}
                    </td>
                    <td className="py-3 px-3 text-slate-800 font-medium">{o.customerName}</td>
                    <td className="py-3 px-3 font-mono text-slate-600">{o.mobile}</td>
                    <td className="py-3 px-3 text-slate-600">
                      {o.paymentMethodLabel || o.paymentMethod} ({o.paymentStatus})
                    </td>
                    <td className="py-3 px-3 font-semibold text-[#F85606]">{o.status}</td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold">
                      {formatPrice(o.total, symbol)}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-500 whitespace-nowrap">
                      {formatDateTime(o.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => void openDetail(o.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-700 hover:border-[#F85606] hover:text-[#F85606]"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail & Status Modal */}
      {selectedOrderDetail && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">
                  Order {selectedOrderDetail.order.orderNumber}
                </h2>
                <p className="text-xs text-slate-500">
                  Placed {formatDateTime(selectedOrderDetail.order.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl">
              <div>
                <p className="font-bold text-slate-700 uppercase mb-1">Customer & Address</p>
                <p className="font-semibold text-slate-900">
                  {selectedOrderDetail.order.customerName}
                </p>
                <p>{selectedOrderDetail.order.mobile}</p>
                {selectedOrderDetail.order.email && <p>{selectedOrderDetail.order.email}</p>}
                <p className="mt-1 text-slate-600">
                  {selectedOrderDetail.order.deliveryAddress}, {selectedOrderDetail.order.area},{' '}
                  {selectedOrderDetail.order.city}, {selectedOrderDetail.order.district}
                </p>
              </div>
              <div>
                <p className="font-bold text-slate-700 uppercase mb-1">Payment Info</p>
                <p>
                  Method:{' '}
                  <strong>
                    {selectedOrderDetail.order.paymentMethodLabel ||
                      selectedOrderDetail.order.paymentMethod}
                  </strong>
                </p>
                {selectedOrderDetail.order.paymentSenderNumber && (
                  <p>Sender: {selectedOrderDetail.order.paymentSenderNumber}</p>
                )}
                {selectedOrderDetail.order.paymentTransactionId && (
                  <p className="font-mono">
                    TrxID: {selectedOrderDetail.order.paymentTransactionId}
                  </p>
                )}
                {selectedOrderDetail.order.isFirstOrder && (
                  <p className="text-[11px] font-semibold text-[#F85606] mt-0.5">
                    First Account Order (Advance Delivery Rule)
                  </p>
                )}
                {(selectedOrderDetail.order.advancePaidAmount ?? 0) > 0 && (
                  <p className="text-xs text-emerald-700 font-semibold">
                    Advance Paid: {formatPrice(selectedOrderDetail.order.advancePaidAmount || 0, symbol)}
                  </p>
                )}
                {(selectedOrderDetail.order.dueOnDeliveryAmount ?? 0) > 0 && (
                  <p className="text-xs text-slate-800 font-semibold">
                    Due on Delivery (COD):{' '}
                    {formatPrice(selectedOrderDetail.order.dueOnDeliveryAmount || 0, symbol)}
                  </p>
                )}
                {(selectedOrderDetail.order.coinDiscount ?? 0) > 0 && (
                  <p className="text-xs text-amber-700 font-semibold">
                    AS Coins Redeemed: {selectedOrderDetail.order.coinsUsed || 0} Coins (-
                    {formatPrice(selectedOrderDetail.order.coinDiscount || 0, symbol)})
                  </p>
                )}
                {selectedOrderDetail.order.deliveryManName && (
                  <p className="text-xs text-slate-700 mt-1">
                    Delivery Man: <strong>{selectedOrderDetail.order.deliveryManName}</strong>
                    {selectedOrderDetail.order.deliveryManPhone
                      ? ` (${selectedOrderDetail.order.deliveryManPhone})`
                      : ''}
                  </p>
                )}
                <p className="mt-1 font-mono font-bold text-sm text-[#F85606]">
                  Total: {formatPrice(selectedOrderDetail.order.total, symbol)}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700 uppercase">Items</p>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl px-3">
                {selectedOrderDetail.items.map((item) => (
                  <div key={item.id} className="py-2.5 flex justify-between gap-3 text-xs">
                    <div>
                      <p className="font-semibold text-slate-900">{item.productName}</p>
                      <p className="text-slate-500">
                        SKU {item.sku} · Qty {item.quantity} × {formatPrice(item.unitPrice, symbol)}
                        {item.selectedColor ? ` · ${item.selectedColor}` : ''}
                        {item.selectedSize ? ` · ${item.selectedSize}` : ''}
                      </p>
                    </div>
                    <span className="font-mono tabular-nums font-semibold">
                      {formatPrice(item.lineTotal, symbol)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase">Update Order Status</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Order Status</label>
                  <select
                    value={nextStatus}
                    onChange={(e) => setNextStatus(e.target.value as OrderStatus)}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm bg-white"
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Payment Status</label>
                  <select
                    value={nextPaymentStatus}
                    onChange={(e) => setNextPaymentStatus(e.target.value as PaymentStatus)}
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm bg-white"
                  >
                    {PAYMENT_STATUSES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">
                    Delivery Man Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={deliveryManName}
                    onChange={(e) => setDeliveryManName(e.target.value)}
                    placeholder="e.g. Md. Karim"
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">
                    Delivery Man Phone (Optional)
                  </label>
                  <input
                    type="text"
                    value={deliveryManPhone}
                    onChange={(e) => setDeliveryManPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>
              <input
                type="text"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Optional note for customer tracking timeline..."
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrderDetail(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={updating}
                  onClick={handleUpdateOrder}
                  className="px-5 py-2 bg-[#F85606] hover:bg-[#E04A00] text-white text-xs font-semibold rounded-lg disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Save Status Update'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
