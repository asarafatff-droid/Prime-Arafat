import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, MessageCircle, PackageCheck, Phone, Search, Truck } from 'lucide-react';
import { EmptyState } from '../../components/common/EmptyState';
import { useAuth } from '../../contexts/AuthContext';
import { useStore } from '../../contexts/StoreContext';
import { useToast } from '../../contexts/ToastContext';
import { buildWhatsAppUrl } from '../../lib/searchHistory';
import { formatDateTime, formatPrice } from '../../lib/utils';
import { findCustomerOrderByNumber } from '../../services/orderService';
import type { Order, OrderItem, OrderStatus } from '../../types';

const FLOW_STEPS: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Processing',
  'Packed',
  'Shipped',
  'Out for Delivery',
  'Delivered',
];

export function TrackOrderPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { websiteSettings } = useStore();
  const { showToast } = useToast();

  const initialOrderNo = searchParams.get('order') || '';
  const [orderNumberInput, setOrderNumberInput] = useState(initialOrderNo);
  const [result, setResult] = useState<{ order: Order; items: OrderItem[] } | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const symbol = websiteSettings.currencySymbol || '৳';

  const runSearch = async (code: string) => {
    if (!user || !code.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const found = await findCustomerOrderByNumber(user.uid, code.trim());
      setResult(found);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Lookup failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && initialOrderNo) {
      void runSearch(initialOrderNo);
    }
  }, [user, initialOrderNo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumberInput.trim()) return;
    setSearchParams({ order: orderNumberInput.trim().toUpperCase() });
    void runSearch(orderNumberInput);
  };

  const currentIdx = result ? FLOW_STEPS.indexOf(result.order.status) : -1;

  return (
    <div className="max-w-4xl mx-auto px-3 md:px-6 py-6 md:py-10 space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#FFF5F0] text-[#F85606] flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-slate-900">Track Your Order</h1>
            <p className="text-xs text-slate-500">
              Enter your unique Order ID (e.g., ASW-YYYYMMDD-XXXXX) to view real-time progress.
            </p>
          </div>
        </div>

        {!user ? (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-700 flex items-center justify-between flex-wrap gap-3">
            <span>Please sign in to securely view and track your orders.</span>
            <Link
              to="/login"
              className="px-4 py-2 bg-[#F85606] text-white text-xs font-semibold rounded-lg"
            >
              Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              required
              value={orderNumberInput}
              onChange={(e) => setOrderNumberInput(e.target.value.toUpperCase())}
              placeholder="Enter Order ID (e.g. ASW-20261117-...)"
              className="flex-1 h-10 px-3.5 border border-slate-200 rounded-lg text-sm font-mono uppercase focus:outline-none focus:border-[#F85606]"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-5 h-10 bg-[#F85606] hover:bg-[#E04A00] text-white text-sm font-semibold rounded-lg inline-flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              <span>{loading ? 'Checking...' : 'Track'}</span>
            </button>
          </form>
        )}
      </div>

      {searched && !loading && !result && user && (
        <EmptyState
          title="No matching order found"
          description="Verify that the Order ID belongs to your signed-in account and try again."
          icon={<PackageCheck className="w-6 h-6" />}
          actionLabel="View My Orders"
          actionTo="/orders"
        />
      )}

      {result && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <p className="text-xs text-slate-500">Order ID</p>
              <p className="font-mono tabular-nums text-lg font-bold text-slate-900">
                {result.order.orderNumber}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs text-slate-500">Current Status</p>
              <p className="text-base font-bold text-[#F85606]">{result.order.status}</p>
            </div>
          </div>

          {result.order.status === 'Cancelled' || result.order.status === 'Returned' ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
              This order is marked as <strong>{result.order.status}</strong>.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {FLOW_STEPS.map((step, idx) => {
                const completed = currentIdx >= idx;
                return (
                  <div
                    key={step}
                    className={`p-3 rounded-lg border text-center ${
                      completed
                        ? 'border-[#F85606] bg-[#FFF5F0] text-[#F85606]'
                        : 'border-slate-200 bg-slate-50 text-slate-400'
                    }`}
                  >
                    <CheckCircle2
                      className={`w-4 h-4 mx-auto mb-1 ${
                        completed ? 'text-[#F85606]' : 'text-slate-300'
                      }`}
                    />
                    <span className="text-[11px] font-semibold leading-tight block">{step}</span>
                  </div>
                );
              })}
            </div>
          )}

          {(result.order.statusHistory?.length ?? 0) > 0 && (
            <div className="space-y-2 pt-2">
              <h2 className="text-xs font-bold text-slate-500 uppercase">Status Timeline</h2>
              <div className="divide-y divide-slate-100">
                {[...(result.order.statusHistory || [])].reverse().map((h, i) => (
                  <div key={i} className="py-2 flex items-center justify-between gap-4 text-xs">
                    <div>
                      <strong className="text-slate-900">{h.status}</strong>
                      <span className="text-slate-600 ml-2">{h.note}</span>
                    </div>
                    <span className="text-slate-400 tabular-nums shrink-0">
                      {formatDateTime(h.updatedAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(result.order.deliveryManName || result.order.deliveryManPhone) && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#F85606] text-white flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase text-orange-800">Assigned Delivery Rider</p>
                  <p className="text-sm font-bold text-slate-900">
                    {result.order.deliveryManName || 'Delivery Representative'}
                  </p>
                </div>
              </div>
              {result.order.deliveryManPhone && (
                <a
                  href={`tel:${result.order.deliveryManPhone}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-orange-300 text-[#F85606] hover:bg-[#F85606] hover:text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call {result.order.deliveryManPhone}</span>
                </a>
              )}
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-sm">
            <div className="space-y-0.5">
              <span className="text-slate-600 block">
                {result.items.length} line item(s) · {result.order.paymentMethodLabel || result.order.paymentMethod}
              </span>
              {(result.order.coinDiscount ?? 0) > 0 && (
                <span className="text-xs font-medium text-emerald-700 block">
                  AS Coins Discount Applied: -{formatPrice(result.order.coinDiscount || 0, symbol)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {websiteSettings.whatsappNumber && (
                <a
                  href={buildWhatsAppUrl(
                    websiteSettings.whatsappNumber,
                    `Hello! Tracking Order #${result.order.orderNumber} (Status: ${result.order.status})`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp Support</span>
                </a>
              )}
              <span className="font-mono tabular-nums font-bold text-slate-900">
                Total: {formatPrice(result.order.total, symbol)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
