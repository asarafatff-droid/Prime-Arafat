import { useEffect, useState } from 'react';
import { Copy, Tag } from 'lucide-react';
import { EmptyState } from '../../components/common/EmptyState';
import { useStore } from '../../contexts/StoreContext';
import { useToast } from '../../contexts/ToastContext';
import { formatDate, formatPrice } from '../../lib/utils';
import { listCoupons } from '../../services/marketingService';
import type { Coupon } from '../../types';

export function VouchersPage() {
  const { websiteSettings } = useStore();
  const { showToast } = useToast();
  const symbol = websiteSettings.currencySymbol || '৳';

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const list = await listCoupons(true);
        if (active) setCoupons(list);
      } catch (err) {
        if (active) {
          showToast(err instanceof Error ? err.message : 'Could not load vouchers.', 'error');
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      showToast(`Coupon code "${code}" copied.`, 'success');
    } catch {
      showToast(`Use code "${code}" at checkout.`, 'info');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3 md:px-6 py-6 md:py-8 space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Vouchers & Promo Codes</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Collect and apply active discount codes during checkout.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-white border border-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : coupons.length === 0 ? (
        <EmptyState
          title="No vouchers available right now."
          description="Active promo codes published by the AS World administrator will appear here."
          icon={<Tag className="w-6 h-6" />}
          actionLabel="Browse Products"
          actionTo="/products"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {coupons.map((c) => (
            <div
              key={c.id}
              className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <p className="font-display text-lg font-extrabold text-[#F85606]">
                  {c.discountType === 'percentage'
                    ? `${c.discountValue}% OFF`
                    : `${formatPrice(c.discountValue, symbol)} OFF`}
                </p>
                <p className="text-xs text-slate-600">
                  Min spend {formatPrice(c.minOrderAmount, symbol)}
                  {c.expiryDate ? ` · Expires ${formatDate(c.expiryDate)}` : ''}
                </p>
                <p className="font-mono text-xs font-bold text-slate-900 pt-1">Code: {c.code}</p>
              </div>

              <button
                type="button"
                onClick={() => void handleCopy(c.code)}
                className="px-3.5 py-2 bg-[#FFF5F0] hover:bg-[#F85606] text-[#F85606] hover:text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shrink-0"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
