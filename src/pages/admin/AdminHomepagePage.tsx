import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Edit,
  Eye,
  EyeOff,
  LayoutTemplate,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { generateId } from '../../lib/utils';
import { listProducts } from '../../services/catalogService';
import {
  DEFAULT_HOMEPAGE_SETTINGS,
  fetchSetting,
  saveSetting,
} from '../../services/settingsService';
import type {
  HomepageSectionConfig,
  HomepageSettingsData,
  Product,
  ProductCollectionConfig,
} from '../../types';

export function AdminHomepagePage() {
  const { showToast } = useToast();

  const [sections, setSections] = useState<HomepageSectionConfig[]>(
    DEFAULT_HOMEPAGE_SETTINGS.sections
  );
  const [collections, setCollections] = useState<ProductCollectionConfig[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Collection Editor State
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [colTitle, setColTitle] = useState('');
  const [colSubtitle, setColSubtitle] = useState('');
  const [colActive, setColActive] = useState(true);
  const [colProductIds, setColProductIds] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const [hp, prodList] = await Promise.all([
          fetchSetting('homepage', DEFAULT_HOMEPAGE_SETTINGS),
          listProducts(false),
        ]);
        if (!active) return;
        setSections(
          Array.isArray(hp.sections) && hp.sections.length > 0
            ? hp.sections
            : DEFAULT_HOMEPAGE_SETTINGS.sections
        );
        setCollections(Array.isArray(hp.collections) ? hp.collections : []);
        setProducts(prodList);
      } catch (err) {
        if (active) {
          showToast(
            err instanceof Error ? err.message : 'Failed to load homepage settings.',
            'error'
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const persistHomepage = async (
    nextSections: HomepageSectionConfig[],
    nextCollections: ProductCollectionConfig[]
  ) => {
    setSaving(true);
    try {
      const payload: HomepageSettingsData = {
        sections: nextSections,
        collections: nextCollections,
      };
      await saveSetting('homepage', payload);
      showToast('Homepage layout saved.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save homepage layout.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const moveSection = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= sections.length) return;
    setSections((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(target, 0, item);
      return copy;
    });
  };

  const toggleSection = (key: HomepageSectionConfig['key']) => {
    setSections((prev) =>
      prev.map((s) => (s.key === key ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const resetColForm = () => {
    setEditingColId(null);
    setColTitle('');
    setColSubtitle('');
    setColActive(true);
    setColProductIds([]);
  };

  const handleSaveCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!colTitle.trim()) return;

    const item: ProductCollectionConfig = {
      id: editingColId || generateId('col'),
      title: colTitle.trim(),
      subtitle: colSubtitle.trim(),
      productIds: colProductIds,
      active: colActive,
    };

    const nextCollections = editingColId
      ? collections.map((c) => (c.id === editingColId ? item : c))
      : [...collections, item];

    setCollections(nextCollections);
    resetColForm();
    await persistHomepage(sections, nextCollections);
  };

  const handleDeleteCollection = async (id: string) => {
    const next = collections.filter((c) => c.id !== id);
    setCollections(next);
    await persistHomepage(sections, next);
  };

  const toggleProductInCollection = (productId: string) => {
    setColProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Homepage Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Reorder or toggle homepage sections and curate custom product collections.
          </p>
        </div>

        <button
          type="button"
          disabled={saving || loading}
          onClick={() => void persistHomepage(sections, collections)}
          className="h-10 px-5 bg-[#F85606] hover:bg-[#E04A00] text-white text-sm font-semibold rounded-lg inline-flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Layout'}</span>
        </button>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
          Loading homepage configuration...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Homepage Section Order & Visibility */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4 h-fit">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <LayoutTemplate className="w-4 h-4 text-[#F85606]" />
              <h2 className="font-display text-base font-bold text-slate-900">
                Homepage Sections
              </h2>
            </div>

            <div className="divide-y divide-slate-100">
              {sections.map((sec, idx) => (
                <div key={sec.key} className="py-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{sec.label}</p>
                    <p className="text-[11px] font-mono text-slate-400">{sec.key}</p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => moveSection(idx, -1)}
                      disabled={idx === 0}
                      title="Move up"
                      className="p-1.5 rounded border border-slate-200 text-slate-600 disabled:opacity-30 hover:border-[#F85606]"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSection(idx, 1)}
                      disabled={idx === sections.length - 1}
                      title="Move down"
                      className="p-1.5 rounded border border-slate-200 text-slate-600 disabled:opacity-30 hover:border-[#F85606]"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleSection(sec.key)}
                      title={sec.enabled ? 'Hide section' : 'Show section'}
                      className={`px-2.5 py-1.5 rounded text-xs font-semibold inline-flex items-center gap-1 ${
                        sec.enabled
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {sec.enabled ? (
                        <Eye className="w-3.5 h-3.5" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5" />
                      )}
                      <span>{sec.enabled ? 'Visible' : 'Hidden'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Curated Product Collections */}
          <div className="lg:col-span-7 space-y-6">
            <form
              onSubmit={handleSaveCollection}
              className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
            >
              <h2 className="font-display text-base font-bold text-slate-900">
                {editingColId ? 'Edit Product Collection' : 'Add Product Collection'}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Collection Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={colTitle}
                    onChange={(e) => setColTitle(e.target.value)}
                    placeholder="e.g. Eid Essentials"
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    value={colSubtitle}
                    onChange={(e) => setColSubtitle(e.target.value)}
                    placeholder="Optional short caption"
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Select Products ({colProductIds.length} selected)
                </label>
                {products.length === 0 ? (
                  <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">
                    No products uploaded yet. Add products first to assign them to collections.
                  </p>
                ) : (
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                    {products.map((p) => (
                      <label
                        key={p.id}
                        className="flex items-center justify-between gap-3 px-3 py-2 text-xs hover:bg-slate-50 cursor-pointer"
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={colProductIds.includes(p.id)}
                            onChange={() => toggleProductInCollection(p.id)}
                          />
                          <span className="font-medium text-slate-800 truncate">{p.name}</span>
                        </span>
                        <span className="font-mono text-slate-400 shrink-0">{p.sku}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={colActive}
                  onChange={(e) => setColActive(e.target.checked)}
                />
                <span>Active on homepage</span>
              </label>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="h-9 px-4 bg-[#F85606] hover:bg-[#E04A00] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>{editingColId ? 'Update Collection' : 'Add Collection'}</span>
                </button>
                {editingColId && (
                  <button
                    type="button"
                    onClick={resetColForm}
                    className="h-9 px-4 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100">
                <h3 className="font-display text-sm font-bold text-slate-900">
                  Configured Collections ({collections.length})
                </h3>
              </div>
              {collections.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  No custom product collections created yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {collections.map((col) => (
                    <div key={col.id} className="p-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{col.title}</p>
                        <p className="text-xs text-slate-500">
                          {col.subtitle || 'No subtitle'} · {col.productIds.length} products ·{' '}
                          <span className={col.active ? 'text-emerald-700' : 'text-slate-400'}>
                            {col.active ? 'Active' : 'Hidden'}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingColId(col.id);
                            setColTitle(col.title);
                            setColSubtitle(col.subtitle);
                            setColActive(col.active);
                            setColProductIds(col.productIds || []);
                          }}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:border-[#F85606]"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteCollection(col.id)}
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
      )}
    </div>
  );
}
