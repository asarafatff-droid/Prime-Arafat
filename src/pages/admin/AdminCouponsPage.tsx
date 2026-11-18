import React, { useEffect, useState } from 'react';
import { Edit, Plus, Power, Tag, Trash2 } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import { useToast } from '../../contexts/ToastContext';
import { formatPrice } from '../../lib/utils';
import {
  createCoupon,
  deleteCoupon,
  listCoupons,
  updateCoupon,
} from '../../services/marketingService';
import type { Coupon } from '../../types';

export function AdminCouponsPage() {
  const { websiteSettings } = useStore();
  const { showToast } = useToast();
  const symbol = websiteSettings.currencySymbol || '৳';

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('0');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('0');
  const [expiryDate, setExpiryDate] = useState('');
  const [usageLimit, setUsageLimit] = useState('100');
  const [active, setActive] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setCoupons(await listCoupons(false));
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load coupons.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setCode('');
    setDiscountType('percentage');
    setDiscountValue('');
    setMinOrderAmount('0');
    setMaxDiscountAmount('0');
    setExpiryDate('');
    setUsageLimit('100');
    setActive(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        code: code.trim().toUpperCase(),
        discountType,
        discountValue: Number(discountValue) || 1,
        minOrderAmount: Number(minOrderAmount) || 0,
        maxDiscountAmount: Number(maxDiscountAmount) || 0,
        expiryDate,
        usageLimit: Math.max(1, Number(usageLimit) || 1),
        active,
      };
      if (editingId) {
        await updateCoupon(editingId, payload);
        showToast('Coupon updated.', 'success');
      } else {
        await createCoupon(payload);
        showToast('Coupon created.', 'success');
      }
      resetForm();
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save coupon.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Coupons Management</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Create promo codes with percentage or fixed discounts, minimum order amounts, and usage limits.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 space-y-4 h-fit"
        >
          <h2 className="font-display text-base font-bold text-slate-900">
            {editingId ? 'Edit Coupon' : 'New Coupon'}
          </h2>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Coupon Code *</label>
            <input
              type="text"
              required
              minLength={2}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. SAVE10"
              className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm font-mono uppercase"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
                className="w-full h-9 px-2.5 border border-slate-200 rounded-lg text-sm bg-white"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed ({symbol})</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Value *</label>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm font-mono"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Min Order ({symbol})
              </label>
              <input
                type="number"
                min="0"
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(e.target.value)}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Max Discount ({symbol})
              </label>
              <input
                type="number"
                min="0"
                value={maxDiscountAmount}
                onChange={(e) => setMaxDiscountAmount(e.target.value)}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm font-mono"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry Date</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full h-9 px-2.5 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Usage Limit</label>
              <input
                type="number"
                min="1"
                required
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm font-mono"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            <span>Active</span>
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-10 bg-[#F85606] hover:bg-[#E04A00] text-white text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{editingId ? 'Update Coupon' : 'Create Coupon'}</span>
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-3 h-10 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">Loading coupons...</div>
          ) : coupons.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <Tag className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm text-slate-500">No coupons created yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {coupons.map((c) => (
                <div key={c.id} className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-mono text-sm font-bold text-slate-900">{c.code}</p>
                    <p className="text-xs text-slate-500">
                      {c.discountType === 'percentage'
                        ? `${c.discountValue}% off`
                        : `${formatPrice(c.discountValue, symbol)} off`}{' '}
                      · Min order {formatPrice(c.minOrderAmount, symbol)} · Used {c.usedCount}/
                      {c.usageLimit} ·{' '}
                      <span className={c.active ? 'text-emerald-700' : 'text-slate-400'}>
                        {c.active ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={async () => {
                        await updateCoupon(c.id, { active: !c.active });
                        await load();
                      }}
                      className={`p-1.5 rounded-lg ${
                        c.active ? 'text-emerald-700 bg-emerald-50' : 'text-slate-400 bg-slate-100'
                      }`}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(c.id);
                        setCode(c.code);
                        setDiscountType(c.discountType);
                        setDiscountValue(String(c.discountValue));
                        setMinOrderAmount(String(c.minOrderAmount));
                        setMaxDiscountAmount(String(c.maxDiscountAmount || 0));
                        setExpiryDate(c.expiryDate || '');
                        setUsageLimit(String(c.usageLimit));
                        setActive(c.active);
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-700"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteCoupon(c.id);
                        showToast('Coupon deleted.', 'info');
                        await load();
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
