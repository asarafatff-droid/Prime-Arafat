import React, { useEffect, useState } from 'react';
import { Edit, Plus, Power, Trash2 } from 'lucide-react';
import { CloudImageUploader } from '../../components/admin/CloudImageUploader';
import { ImageWithFallback } from '../../components/common/ImageWithFallback';
import { useToast } from '../../contexts/ToastContext';
import { slugify } from '../../lib/utils';
import {
  createCategory,
  createSubcategory,
  deleteCategory,
  deleteSubcategory,
  listCategories,
  listSubcategories,
  updateCategory,
  updateSubcategory,
} from '../../services/catalogService';
import type { Category, Subcategory } from '../../types';

export function AdminCategoriesPage({ defaultTab = 'categories' }: { defaultTab?: 'categories' | 'subcategories' }) {
  const { showToast } = useToast();
  const [tab, setTab] = useState<'categories' | 'subcategories'>(defaultTab);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Category form state
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catImg, setCatImg] = useState('');
  const [catOrder, setCatOrder] = useState('0');
  const [catActive, setCatActive] = useState(true);

  // Subcategory form state
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [subParentId, setSubParentId] = useState('');
  const [subName, setSubName] = useState('');
  const [subSlug, setSubSlug] = useState('');
  const [subDesc, setSubDesc] = useState('');
  const [subOrder, setSubOrder] = useState('0');
  const [subActive, setSubActive] = useState(true);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTab(defaultTab);
  }, [defaultTab]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [cats, subs] = await Promise.all([listCategories(false), listSubcategories(false)]);
      setCategories(cats);
      setSubcategories(subs);
      if (cats.length > 0 && !subParentId) {
        setSubParentId(cats[0].id);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load categories.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const resetCatForm = () => {
    setEditingCatId(null);
    setCatName('');
    setCatSlug('');
    setCatDesc('');
    setCatImg('');
    setCatOrder('0');
    setCatActive(true);
  };

  const resetSubForm = () => {
    setEditingSubId(null);
    setSubName('');
    setSubSlug('');
    setSubDesc('');
    setSubOrder('0');
    setSubActive(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: catName,
        slug: catSlug || slugify(catName),
        description: catDesc,
        imageUrl: catImg,
        displayOrder: Number(catOrder) || 0,
        active: catActive,
      };
      if (editingCatId) {
        await updateCategory(editingCatId, payload);
        showToast('Category updated.', 'success');
      } else {
        await createCategory(payload);
        showToast('Category created.', 'success');
      }
      resetCatForm();
      await loadAll();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not save category.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subParentId) {
      showToast('Please select a parent category first.', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        categoryId: subParentId,
        name: subName,
        slug: subSlug || slugify(subName),
        description: subDesc,
        displayOrder: Number(subOrder) || 0,
        active: subActive,
      };
      if (editingSubId) {
        await updateSubcategory(editingSubId, payload);
        showToast('Subcategory updated.', 'success');
      } else {
        await createSubcategory(payload);
        showToast('Subcategory created.', 'success');
      }
      resetSubForm();
      await loadAll();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not save subcategory.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Categories & Subcategories
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Create, edit, activate, or deactivate marketplace taxonomy.
          </p>
        </div>

        <div className="inline-flex p-1 bg-slate-200/70 rounded-lg">
          <button
            type="button"
            onClick={() => setTab('categories')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              tab === 'categories' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Categories ({categories.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('subcategories')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              tab === 'subcategories' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Subcategories ({subcategories.length})
          </button>
        </div>
      </div>

      {tab === 'categories' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleSaveCategory}
            className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 space-y-4 h-fit"
          >
            <h2 className="font-display text-base font-bold text-slate-900">
              {editingCatId ? 'Edit Category' : 'New Category'}
            </h2>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Name *</label>
              <input
                type="text"
                required
                value={catName}
                onChange={(e) => {
                  setCatName(e.target.value);
                  if (!editingCatId) setCatSlug(slugify(e.target.value));
                }}
                placeholder="e.g. Electronics"
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Slug</label>
              <input
                type="text"
                value={catSlug}
                onChange={(e) => setCatSlug(e.target.value)}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                rows={2}
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <CloudImageUploader
              folder="categories"
              label="Category Thumbnail"
              onUploaded={(urls) => setCatImg(urls[0] || '')}
            />
            {catImg && (
              <div className="flex items-center gap-3">
                <img
                  src={catImg}
                  alt="Category preview"
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                />
                <button
                  type="button"
                  onClick={() => setCatImg('')}
                  className="text-xs text-red-600 hover:underline"
                >
                  Remove image
                </button>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  min="0"
                  value={catOrder}
                  onChange={(e) => setCatOrder(e.target.value)}
                  className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm font-mono"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700 pt-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={catActive}
                  onChange={(e) => setCatActive(e.target.checked)}
                />
                <span>Active</span>
              </label>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 h-10 bg-[#F85606] hover:bg-[#E04A00] text-white text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>{editingCatId ? 'Update' : 'Create Category'}</span>
              </button>
              {editingCatId && (
                <button
                  type="button"
                  onClick={resetCatForm}
                  className="px-3 h-10 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-sm text-slate-500">Loading categories...</div>
            ) : categories.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">No categories created yet.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {categories.map((cat) => (
                  <div key={cat.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                        <ImageWithFallback src={cat.imageUrl} alt={cat.name} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{cat.name}</p>
                        <p className="text-xs text-slate-500 font-mono">
                          /{cat.slug} · Order {cat.displayOrder} ·{' '}
                          <span className={cat.active ? 'text-emerald-700' : 'text-slate-400'}>
                            {cat.active ? 'Active' : 'Inactive'}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={async () => {
                          await updateCategory(cat.id, { active: !cat.active });
                          await loadAll();
                        }}
                        title={cat.active ? 'Deactivate' : 'Activate'}
                        className={`p-1.5 rounded-lg ${
                          cat.active ? 'text-emerald-700 bg-emerald-50' : 'text-slate-400 bg-slate-100'
                        }`}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCatId(cat.id);
                          setCatName(cat.name);
                          setCatSlug(cat.slug);
                          setCatDesc(cat.description || '');
                          setCatImg(cat.imageUrl || '');
                          setCatOrder(String(cat.displayOrder));
                          setCatActive(cat.active);
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:border-[#F85606]"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await deleteCategory(cat.id);
                          showToast('Category deleted.', 'info');
                          await loadAll();
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
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleSaveSubcategory}
            className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 space-y-4 h-fit"
          >
            <h2 className="font-display text-base font-bold text-slate-900">
              {editingSubId ? 'Edit Subcategory' : 'New Subcategory'}
            </h2>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Parent Category *
              </label>
              <select
                required
                value={subParentId}
                onChange={(e) => setSubParentId(e.target.value)}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm bg-white"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Name *</label>
              <input
                type="text"
                required
                value={subName}
                onChange={(e) => {
                  setSubName(e.target.value);
                  if (!editingSubId) setSubSlug(slugify(e.target.value));
                }}
                placeholder="e.g. Mobile Phones"
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Slug</label>
              <input
                type="text"
                value={subSlug}
                onChange={(e) => setSubSlug(e.target.value)}
                className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                rows={2}
                value={subDesc}
                onChange={(e) => setSubDesc(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Order</label>
                <input
                  type="number"
                  min="0"
                  value={subOrder}
                  onChange={(e) => setSubOrder(e.target.value)}
                  className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm font-mono"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700 pt-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={subActive}
                  onChange={(e) => setSubActive(e.target.checked)}
                />
                <span>Active</span>
              </label>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving || categories.length === 0}
                className="flex-1 h-10 bg-[#F85606] hover:bg-[#E04A00] text-white text-xs font-semibold rounded-lg disabled:opacity-40"
              >
                {editingSubId ? 'Update' : 'Create Subcategory'}
              </button>
              {editingSubId && (
                <button
                  type="button"
                  onClick={resetSubForm}
                  className="px-3 h-10 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
            {subcategories.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                No subcategories created yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {subcategories.map((sub) => {
                  const parent = categories.find((c) => c.id === sub.categoryId);
                  return (
                    <div key={sub.id} className="p-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{sub.name}</p>
                        <p className="text-xs text-slate-500">
                          Parent: <strong>{parent?.name || 'Unknown'}</strong> ·{' '}
                          <span className={sub.active ? 'text-emerald-700' : 'text-slate-400'}>
                            {sub.active ? 'Active' : 'Inactive'}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={async () => {
                            await updateSubcategory(sub.id, { active: !sub.active });
                            await loadAll();
                          }}
                          className={`p-1.5 rounded-lg ${
                            sub.active
                              ? 'text-emerald-700 bg-emerald-50'
                              : 'text-slate-400 bg-slate-100'
                          }`}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSubId(sub.id);
                            setSubParentId(sub.categoryId);
                            setSubName(sub.name);
                            setSubSlug(sub.slug);
                            setSubDesc(sub.description || '');
                            setSubOrder(String(sub.displayOrder));
                            setSubActive(sub.active);
                          }}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:border-[#F85606]"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await deleteSubcategory(sub.id);
                            showToast('Subcategory deleted.', 'info');
                            await loadAll();
                          }}
                          className="p-1.5 rounded-lg border border-slate-200 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
