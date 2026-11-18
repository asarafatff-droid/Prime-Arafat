import React, { useEffect, useState } from 'react';
import { Edit, Image as ImageIcon, Plus, Power, Trash2 } from 'lucide-react';
import { CloudImageUploader } from '../../components/admin/CloudImageUploader';
import { useToast } from '../../contexts/ToastContext';
import { listCategories, listProducts } from '../../services/catalogService';
import {
  createBanner,
  deleteBanner,
  listBanners,
  updateBanner,
} from '../../services/marketingService';
import type { Banner, BannerPlacement, Category, Product } from '../../types';

const PLACEMENTS: { value: BannerPlacement; label: string }[] = [
  { value: 'top_strip', label: 'Slim Top Offer / Discount Strip (Above Home)' },
  { value: 'main', label: 'Main Homepage Slider' },
  { value: 'desktop', label: 'Desktop Banner' },
  { value: 'mobile', label: 'Mobile Banner' },
  { value: 'promotional', label: 'Promotional Banner' },
  { value: 'flash_sale', label: 'Flash Sale Banner' },
  { value: 'category', label: 'Category Banner' },
  { value: 'campaign', label: 'Campaign Banner' },
  { value: 'sponsored', label: 'Sponsored Banner' },
];

export function AdminBannersPage() {
  const { showToast } = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discountText, setDiscountText] = useState('');
  const [accentColor, setAccentColor] = useState('#F85606');
  const [placement, setPlacement] = useState<BannerPlacement>('top_strip');
  const [desktopImageUrl, setDesktopImageUrl] = useState('');
  const [mobileImageUrl, setMobileImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [displayOrder, setDisplayOrder] = useState('0');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [active, setActive] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const [bans, cats, prods] = await Promise.all([
        listBanners(false),
        listCategories(false),
        listProducts(false),
      ]);
      setBanners(bans);
      setCategories(cats);
      setProducts(prods);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load banners.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleBatchUpload = async (urls: string[]) => {
    if (!urls.length) return;
    setSaving(true);
    try {
      const startOrd = banners.length;
      for (let i = 0; i < urls.length; i++) {
        await createBanner({
          title: `${title.trim() || 'Offer Banner'} #${startOrd + i + 1}`,
          description: description.trim(),
          discountText: discountText.trim() || 'OFFER',
          accentColor,
          placement,
          desktopImageUrl: urls[i],
          mobileImageUrl: urls[i],
          linkUrl: linkUrl || '/products',
          displayOrder: startOrd + i,
          startDate,
          endDate,
          active,
        });
      }
      showToast(`Published ${urls.length} banner(s)!`, 'success');
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Batch upload failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setDiscountText('');
    setAccentColor('#F85606');
    setPlacement('top_strip');
    setDesktopImageUrl('');
    setMobileImageUrl('');
    setLinkUrl('');
    setDisplayOrder('0');
    setStartDate('');
    setEndDate('');
    setActive(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (placement !== 'top_strip' && !desktopImageUrl && !mobileImageUrl) {
      showToast('Please upload at least a desktop or mobile banner image.', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title,
        description,
        discountText,
        accentColor,
        placement,
        desktopImageUrl,
        mobileImageUrl,
        linkUrl,
        displayOrder: Number(displayOrder) || 0,
        startDate,
        endDate,
        active,
      };
      if (editingId) {
        await updateBanner(editingId, payload);
        showToast('Banner updated.', 'success');
      } else {
        await createBanner(payload);
        showToast('Banner published.', 'success');
      }
      resetForm();
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not save banner.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Banners Management</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Upload responsive desktop & mobile banners, schedule visibility, and control display order.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4 h-fit"
        >
          <h2 className="font-display text-base font-bold text-slate-900">
            {editingId ? 'Edit Banner' : 'Upload New Banner'}
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Banner Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Seasonal Collection"
              className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Optional Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Discount Badge Text
              </label>
              <input
                type="text"
                value={discountText}
                onChange={(e) => setDiscountText(e.target.value)}
                placeholder="e.g. UP TO 50% OFF"
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Strip Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-9 h-9 p-0.5 border border-slate-200 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="flex-1 h-9 px-2.5 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Placement</label>
              <select
                value={placement}
                onChange={(e) => setPlacement(e.target.value as BannerPlacement)}
                className="w-full h-9 px-2.5 border border-slate-200 rounded-lg text-sm bg-white"
              >
                {PLACEMENTS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Order</label>
              <input
                type="number"
                min="0"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm font-mono"
              />
            </div>
          </div>

          <CloudImageUploader
            folder="banners"
            label="Desktop Banner Image (Recommended 16:6 or 1200×400)"
            onUploaded={(urls) => setDesktopImageUrl(urls[0] || '')}
          />
          {desktopImageUrl && (
            <div className="relative rounded-lg overflow-hidden border border-slate-200 aspect-[16/6]">
              <img
                src={desktopImageUrl}
                alt="Desktop preview"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setDesktopImageUrl('')}
                className="absolute top-2 right-2 px-2 py-1 bg-black/70 text-white text-[10px] rounded"
              >
                Remove
              </button>
            </div>
          )}

          <CloudImageUploader
            folder="banners"
            label="Mobile Banner Image (Optional, Recommended 16:9)"
            onUploaded={(urls) => setMobileImageUrl(urls[0] || '')}
          />
          {mobileImageUrl && (
            <div className="relative rounded-lg overflow-hidden border border-slate-200 aspect-[16/9] max-w-xs">
              <img
                src={mobileImageUrl}
                alt="Mobile preview"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setMobileImageUrl('')}
                className="absolute top-2 right-2 px-2 py-1 bg-black/70 text-white text-[10px] rounded"
              >
                Remove
              </button>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Destination Link / Click Action
            </label>
            <select
              value={
                ['/products', '/vouchers', '/coins-games', '/products?flash=1'].includes(linkUrl) ||
                linkUrl.startsWith('/product/') ||
                linkUrl.startsWith('/products?category=')
                  ? linkUrl
                  : 'custom'
              }
              onChange={(e) => {
                if (e.target.value !== 'custom') setLinkUrl(e.target.value);
              }}
              className="w-full h-9 px-2.5 border border-slate-200 rounded-lg text-xs bg-white"
            >
              <option value="/products">All Products (/products)</option>
              <option value="/products?flash=1">Flash Sale Products</option>
              <option value="/vouchers">Vouchers (/vouchers)</option>
              <option value="/coins-games">AS Coins &amp; Games (/coins-games)</option>
              {categories.length > 0 && (
                <optgroup label="Categories">
                  {categories.map((c) => (
                    <option key={c.id} value={`/products?category=${c.id}`}>
                      Category: {c.name}
                    </option>
                  ))}
                </optgroup>
              )}
              {products.length > 0 && (
                <optgroup label="Specific Products">
                  {products.slice(0, 60).map((p) => (
                    <option key={p.id} value={`/product/${p.id}`}>
                      Product: {p.name}
                    </option>
                  ))}
                </optgroup>
              )}
              <option value="custom">Custom URL</option>
            </select>
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="/products or /product/..."
              className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm"
            />
          </div>

          {!editingId && (
            <div className="pt-2 border-t border-slate-100">
              <CloudImageUploader
                folder="banners"
                multiple
                label="Quick Batch Upload Unlimited Banners (Optional)"
                helperText="Select multiple images to instantly publish multiple banners with the chosen placement & destination link above."
                onUploaded={(urls) => {
                  void handleBatchUpload(urls);
                }}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Schedule Start
              </label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-9 px-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Schedule End
              </label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-9 px-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            <span>Active on Storefront</span>
          </label>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-10 bg-[#F85606] hover:bg-[#E04A00] text-white text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{saving ? 'Saving...' : editingId ? 'Update Banner' : 'Save Banner'}</span>
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
              Loading banners...
            </div>
          ) : banners.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-10 text-center space-y-2">
              <ImageIcon className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-800">No banners uploaded yet.</p>
              <p className="text-xs text-slate-500">
                Storefront banner slots stay hidden until you upload and activate banners here.
              </p>
            </div>
          ) : (
            banners.map((b) => (
              <div
                key={b.id}
                className="bg-white border border-slate-200 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{b.title}</h3>
                    <p className="text-xs text-slate-500">
                      Placement: <strong>{b.placement}</strong> · Order: {b.displayOrder} ·{' '}
                      <span className={b.active ? 'text-emerald-700' : 'text-slate-400'}>
                        {b.active ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={async () => {
                        await updateBanner(b.id, { active: !b.active });
                        await load();
                      }}
                      className={`p-1.5 rounded-lg ${
                        b.active ? 'text-emerald-700 bg-emerald-50' : 'text-slate-400 bg-slate-100'
                      }`}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(b.id);
                        setTitle(b.title);
                        setDescription(b.description || '');
                        setDiscountText(b.discountText || '');
                        setAccentColor(b.accentColor || '#F85606');
                        setPlacement(b.placement);
                        setDesktopImageUrl(b.desktopImageUrl || '');
                        setMobileImageUrl(b.mobileImageUrl || '');
                        setLinkUrl(b.linkUrl || '');
                        setDisplayOrder(String(b.displayOrder));
                        setStartDate(b.startDate || '');
                        setEndDate(b.endDate || '');
                        setActive(b.active);
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-700"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteBanner(b.id);
                        showToast('Banner deleted.', 'info');
                        await load();
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {(b.desktopImageUrl || b.mobileImageUrl) && (
                  <div className="aspect-[16/5] rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                    <img
                      src={b.desktopImageUrl || b.mobileImageUrl}
                      alt={b.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
