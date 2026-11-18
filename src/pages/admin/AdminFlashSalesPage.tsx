import React, { useEffect, useState } from 'react';
import { Edit, Plus, Power, Trash2, Zap } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import { useToast } from '../../contexts/ToastContext';
import { formatPrice } from '../../lib/utils';
import { listProducts } from '../../services/catalogService';
import {
  createFlashSale,
  deleteFlashSale,
  listFlashSales,
  updateFlashSale,
} from '../../services/marketingService';
import type { FlashSale, FlashSaleItem, Product } from '../../types';

export function AdminFlashSalesPage() {
  const { websiteSettings } = useStore();
  const { showToast } = useToast();
  const symbol = websiteSettings.currencySymbol || '৳';

  const [campaigns, setCampaigns] = useState<FlashSale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [active, setActive] = useState(true);
  const [items, setItems] = useState<FlashSaleItem[]>([]);

  const [selectedProdId, setSelectedProdId] = useState('');
  const [campaignPrice, setCampaignPrice] = useState('');
  const [stockLimit, setStockLimit] = useState('10');

  const load = async () => {
    setLoading(true);
    try {
      const [fs, prods] = await Promise.all([listFlashSales(false), listProducts(false)]);
      setCampaigns(fs);
      setProducts(prods);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load flash sales.', 'error');
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
    setSubtitle('');
    setStartDate('');
    setEndDate('');
    setActive(true);
    setItems([]);
  };

  const handleAddProductToSale = () => {
    const prod = products.find((p) => p.id === selectedProdId);
    if (!prod) return;
    const priceNum = Number(campaignPrice);
    if (Number.isNaN(priceNum) || priceNum <= 0) {
      showToast('Enter a valid campaign price.', 'error');
      return;
    }
    setItems((prev) => [
      ...prev.filter((i) => i.productId !== prod.id),
      {
        productId: prod.id,
        productName: prod.name,
        productImage: prod.images?.[0] || '',
        originalPrice: prod.price,
        campaignPrice: priceNum,
        stockLimit: Math.max(1, Number(stockLimit) || 1),
        soldCount: 0,
      },
    ]);
    setSelectedProdId('');
    setCampaignPrice('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      showToast('Please set both start and end dates.', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = { title, subtitle, startDate, endDate, active, items };
      if (editingId) {
        await updateFlashSale(editingId, payload);
        showToast('Flash sale campaign updated.', 'success');
      } else {
        await createFlashSale(payload);
        showToast('Flash sale campaign created.', 'success');
      }
      resetForm();
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not save flash sale.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Flash Sales</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Create time-limited Flash Sale campaigns with countdown timers and promotional prices.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4 h-fit"
        >
          <h2 className="font-display text-base font-bold text-slate-900">
            {editingId ? 'Edit Campaign' : 'Create Flash Sale'}
          </h2>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Campaign Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Weekend Flash Deals"
              className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subtitle</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Start Date *
              </label>
              <input
                type="datetime-local"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-9 px-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Date *</label>
              <input
                type="datetime-local"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-9 px-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-2.5">
            <p className="text-xs font-semibold text-slate-700">Add Products to Campaign</p>
            <select
              value={selectedProdId}
              onChange={(e) => setSelectedProdId(e.target.value)}
              className="w-full h-9 px-2.5 border border-slate-200 rounded-lg text-xs bg-white"
            >
              <option value="">Select a product...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({formatPrice(p.price, symbol)})
                </option>
              ))}
            </select>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                min="1"
                value={campaignPrice}
                onChange={(e) => setCampaignPrice(e.target.value)}
                placeholder="Sale Price"
                className="h-9 px-2.5 border border-slate-200 rounded-lg text-xs font-mono"
              />
              <input
                type="number"
                min="1"
                value={stockLimit}
                onChange={(e) => setStockLimit(e.target.value)}
                placeholder="Limit"
                className="h-9 px-2.5 border border-slate-200 rounded-lg text-xs font-mono"
              />
              <button
                type="button"
                onClick={handleAddProductToSale}
                className="h-9 bg-slate-900 text-white text-xs font-semibold rounded-lg"
              >
                Add Item
              </button>
            </div>

            {items.length > 0 && (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg px-3">
                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="py-2 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate">{item.productName}</p>
                      <p className="font-mono text-slate-500">
                        {formatPrice(item.campaignPrice, symbol)} · Limit {item.stockLimit}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setItems((prev) => prev.filter((x) => x.productId !== item.productId))
                      }
                      className="text-red-600 hover:underline shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            <span>Campaign Active</span>
          </label>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-10 bg-[#F85606] hover:bg-[#E04A00] text-white text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{saving ? 'Saving...' : editingId ? 'Update Campaign' : 'Create Campaign'}</span>
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

        <div className="lg:col-span-7 space-y-4">
          {loading ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
              Loading campaigns...
            </div>
          ) : campaigns.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-2">
              <Zap className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm text-slate-500">No Flash Sale campaigns created yet.</p>
            </div>
          ) : (
            campaigns.map((c) => (
              <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{c.title}</h3>
                    <p className="text-xs text-slate-500">
                      {c.startDate} &rarr; {c.endDate} · {c.items?.length || 0} products ·{' '}
                      <span className={c.active ? 'text-emerald-700' : 'text-slate-400'}>
                        {c.active ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={async () => {
                        await updateFlashSale(c.id, { active: !c.active });
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
                        setTitle(c.title);
                        setSubtitle(c.subtitle || '');
                        setStartDate(c.startDate);
                        setEndDate(c.endDate);
                        setActive(c.active);
                        setItems(c.items || []);
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-700"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteFlashSale(c.id);
                        showToast('Campaign deleted.', 'info');
                        await load();
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
