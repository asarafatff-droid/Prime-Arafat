import React, { useEffect, useState } from 'react';
import { Edit, Percent, Plus, Power, Trash2 } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import { useToast } from '../../contexts/ToastContext';
import { formatPrice } from '../../lib/utils';
import { listCategories, listProducts } from '../../services/catalogService';
import {
  createDiscountRule,
  deleteDiscountRule,
  listDiscountRules,
  updateDiscountRule,
} from '../../services/marketingService';
import type { Category, DiscountRule, Product } from '../../types';

export function AdminDiscountsPage() {
  const { websiteSettings } = useStore();
  const { showToast } = useToast();
  const symbol = websiteSettings.currencySymbol || '৳';

  const [rules, setRules] = useState<DiscountRule[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'category' | 'product'>('all');
  const [targetId, setTargetId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [active, setActive] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [r, c, p] = await Promise.all([
        listDiscountRules(false),
        listCategories(false),
        listProducts(false),
      ]);
      setRules(r);
      setCategories(c);
      setProducts(p);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load discounts.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setDiscountType('percentage');
    setDiscountValue('');
    setTargetType('all');
    setTargetId('');
    setStartDate('');
    setEndDate('');
    setActive(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title,
        description,
        discountType,
        discountValue: Number(discountValue) || 1,
        targetType,
        targetId: targetType === 'all' ? '' : targetId,
        startDate,
        endDate,
        active,
      };
      if (editingId) {
        await updateDiscountRule(editingId, payload);
        showToast('Discount rule updated.', 'success');
      } else {
        await createDiscountRule(payload);
        showToast('Discount rule created.', 'success');
      }
      resetForm();
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save discount rule.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Discounts Management</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Configure store-wide, category-level, or product-specific promotional discount campaigns.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 space-y-4 h-fit"
        >
          <h2 className="font-display text-base font-bold text-slate-900">
            {editingId ? 'Edit Discount Rule' : 'New Discount Rule'}
          </h2>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Seasonal Category Discount"
              className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm"
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
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Applies To</label>
            <select
              value={targetType}
              onChange={(e) => {
                setTargetType(e.target.value as 'all' | 'category' | 'product');
                setTargetId('');
              }}
              className="w-full h-9 px-2.5 border border-slate-200 rounded-lg text-sm bg-white"
            >
              <option value="all">All Products</option>
              <option value="category">Specific Category</option>
              <option value="product">Specific Product</option>
            </select>
          </div>
          {targetType === 'category' && (
            <select
              required
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full h-9 px-2.5 border border-slate-200 rounded-lg text-sm bg-white"
            >
              <option value="">Select Category...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
          {targetType === 'product' && (
            <select
              required
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full h-9 px-2.5 border border-slate-200 rounded-lg text-sm bg-white"
            >
              <option value="">Select Product...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-9 px-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-9 px-2 border border-slate-200 rounded-lg text-xs"
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
              <span>{editingId ? 'Update Rule' : 'Create Rule'}</span>
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
            <div className="p-8 text-center text-sm text-slate-500">Loading discount rules...</div>
          ) : rules.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <Percent className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm text-slate-500">No discount rules configured yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {rules.map((r) => (
                <div key={r.id} className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{r.title}</p>
                    <p className="text-xs text-slate-500">
                      {r.discountType === 'percentage'
                        ? `${r.discountValue}% off`
                        : `${formatPrice(r.discountValue, symbol)} off`}{' '}
                      · Scope: {r.targetType} ·{' '}
                      <span className={r.active ? 'text-emerald-700' : 'text-slate-400'}>
                        {r.active ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={async () => {
                        await updateDiscountRule(r.id, { active: !r.active });
                        await load();
                      }}
                      className={`p-1.5 rounded-lg ${
                        r.active ? 'text-emerald-700 bg-emerald-50' : 'text-slate-400 bg-slate-100'
                      }`}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(r.id);
                        setTitle(r.title);
                        setDescription(r.description || '');
                        setDiscountType(r.discountType);
                        setDiscountValue(String(r.discountValue));
                        setTargetType(r.targetType);
                        setTargetId(r.targetId || '');
                        setStartDate(r.startDate || '');
                        setEndDate(r.endDate || '');
                        setActive(r.active);
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-700"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteDiscountRule(r.id);
                        showToast('Discount rule deleted.', 'info');
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
