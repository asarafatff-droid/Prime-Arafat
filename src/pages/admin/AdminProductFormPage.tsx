import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUp,
  Copy,
  Layers,
  PackagePlus,
  Plus,
  Save,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { CloudImageUploader } from '../../components/admin/CloudImageUploader';
import { WorldColorSelector } from '../../components/admin/WorldColorSelector';
import { useToast } from '../../contexts/ToastContext';
import { slugify } from '../../lib/utils';
import {
  createProduct,
  createProductsBulk,
  getProductById,
  listCategories,
  listSubcategories,
  type ProductInput,
  updateProduct,
} from '../../services/catalogService';
import type { Category, ProductStatus, Subcategory } from '../../types';

interface BulkRowDraft {
  localId: string;
  name: string;
  sku: string;
  price: string;
  discountPrice: string;
  stock: string;
  categoryId: string;
  subcategoryId: string;
  brand: string;
  description: string;
  images: string[];
  colors: string[];
  sizesInput: string;
  variationsInput: string;
  specs: { key: string; value: string }[];
  weight: string;
  shippingInfo: string;
  status: ProductStatus;
  visible: boolean;
  featured: boolean;
  newArrival: boolean;
  showColorPicker: boolean;
}

const SPEC_PRESETS = ['Material', 'Warranty', 'Model', 'Origin', 'Box Contents', 'Return Policy'];

function makeEmptyBulkRow(index: number, defaultCategoryId = ''): BulkRowDraft {
  return {
    localId: `row_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 6)}`,
    name: '',
    sku: `ASW-${Math.floor(1000 + Math.random() * 9000)}`,
    price: '',
    discountPrice: '',
    stock: '10',
    categoryId: defaultCategoryId,
    subcategoryId: '',
    brand: '',
    description: '',
    images: [],
    colors: [],
    sizesInput: '',
    variationsInput: '',
    specs: [],
    weight: '',
    shippingInfo: '',
    status: 'active',
    visible: true,
    featured: false,
    newArrival: true,
    showColorPicker: false,
  };
}

export function AdminProductFormPage() {
  const { productId } = useParams<{ productId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const isEditing = Boolean(productId);

  const [mode, setMode] = useState<'single' | 'bulk'>(
    !isEditing && searchParams.get('mode') === 'bulk' ? 'bulk' : 'single'
  );

  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Single product fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [brand, setBrand] = useState('');
  const [stock, setStock] = useState('10');
  const [images, setImages] = useState<string[]>([]);
  const [sizesInput, setSizesInput] = useState('');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [variationsInput, setVariationsInput] = useState('');
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>([]);
  const [weight, setWeight] = useState('');
  const [shippingInfo, setShippingInfo] = useState('');
  const [status, setStatus] = useState<ProductStatus>('active');
  const [visible, setVisible] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [recommended, setRecommended] = useState(false);
  const [trending, setTrending] = useState(false);
  const [newArrival, setNewArrival] = useState(true);
  const [bestSelling, setBestSelling] = useState(false);

  // Bulk products state
  const [bulkRows, setBulkRows] = useState<BulkRowDraft[]>(() => [
    makeEmptyBulkRow(1),
    makeEmptyBulkRow(2),
  ]);

  useEffect(() => {
    if (!isEditing && searchParams.get('mode') === 'bulk') {
      setMode('bulk');
    }
  }, [isEditing, searchParams]);

  useEffect(() => {
    let active = true;
    async function init() {
      setLoading(true);
      try {
        const [cats, subs] = await Promise.all([listCategories(false), listSubcategories(false)]);
        if (!active) return;
        setCategories(cats);
        setSubcategories(subs);

        if (productId) {
          const prod = await getProductById(productId);
          if (!active) return;
          if (!prod) {
            showToast('Product not found.', 'error');
            navigate('/admin/dashboard/products', { replace: true });
            return;
          }
          setName(prod.name);
          setSlug(prod.slug);
          setSku(prod.sku);
          setDescription(prod.description || '');
          setPrice(String(prod.price));
          setDiscountPrice(prod.discountPrice && prod.discountPrice > 0 ? String(prod.discountPrice) : '');
          setCategoryId(prod.categoryId || '');
          setSubcategoryId(prod.subcategoryId || '');
          setBrand(prod.brand || '');
          setStock(String(prod.stock));
          setImages(prod.images || []);
          setSizesInput((prod.sizes || []).join(', '));
          setSelectedColors(prod.colors || []);
          setVariationsInput((prod.variations || []).join(', '));
          setSpecs(
            Object.entries(prod.specifications || {}).map(([k, v]) => ({ key: k, value: v }))
          );
          setWeight(prod.weight || '');
          setShippingInfo(prod.shippingInfo || '');
          setStatus(prod.status);
          setVisible(prod.visible);
          setFeatured(prod.featured);
          setRecommended(Boolean(prod.recommended));
          setTrending(Boolean(prod.trending));
          setNewArrival(Boolean(prod.newArrival));
          setBestSelling(Boolean(prod.bestSelling));
        }
      } catch (err) {
        if (active) showToast(err instanceof Error ? err.message : 'Failed to load form.', 'error');
      } finally {
        if (active) setLoading(false);
      }
    }
    void init();
    return () => {
      active = false;
    };
  }, [productId, navigate, showToast]);

  const filteredSubs = useMemo(
    () => (categoryId ? subcategories.filter((s) => s.categoryId === categoryId) : subcategories),
    [subcategories, categoryId]
  );

  const parseCommaList = (raw: string) =>
    raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

  const resetSingleForm = () => {
    setName('');
    setSlug('');
    setSku('');
    setDescription('');
    setPrice('');
    setDiscountPrice('');
    setBrand('');
    setStock('10');
    setImages([]);
    setSizesInput('');
    setSelectedColors([]);
    setVariationsInput('');
    setSpecs([]);
    setWeight('');
    setShippingInfo('');
  };

  const buildSinglePayload = (): ProductInput | null => {
    const numericPrice = Number(price);
    const numericDiscount = discountPrice ? Number(discountPrice) : 0;
    const numericStock = Number(stock);

    if (!name.trim()) {
      showToast('Please enter a product name.', 'error');
      return null;
    }
    if (!sku.trim()) {
      showToast('Please enter a product SKU.', 'error');
      return null;
    }
    if (Number.isNaN(numericPrice) || numericPrice < 0) {
      showToast('Please enter a valid product price.', 'error');
      return null;
    }
    if (numericDiscount > numericPrice) {
      showToast('Discount price cannot exceed the regular price.', 'error');
      return null;
    }

    const catObj = categories.find((c) => c.id === categoryId);
    const subObj = subcategories.find((s) => s.id === subcategoryId);
    const specsObj: Record<string, string> = {};
    for (const pair of specs) {
      if (pair.key.trim() && pair.value.trim()) {
        specsObj[pair.key.trim()] = pair.value.trim();
      }
    }

    return {
      name: name.trim(),
      slug: slug.trim() || slugify(name),
      sku: sku.trim(),
      description: description.trim(),
      price: numericPrice,
      discountPrice: numericDiscount,
      categoryId: catObj ? catObj.id : '',
      categoryName: catObj ? catObj.name : '',
      subcategoryId: subObj ? subObj.id : '',
      subcategoryName: subObj ? subObj.name : '',
      brand: brand.trim(),
      stock: Math.max(0, Math.round(numericStock || 0)),
      images,
      sizes: parseCommaList(sizesInput),
      colors: selectedColors,
      variations: parseCommaList(variationsInput),
      specifications: specsObj,
      weight: weight.trim(),
      shippingInfo: shippingInfo.trim(),
      status,
      visible,
      featured,
      recommended,
      trending,
      newArrival,
      bestSelling,
    };
  };

  const saveSingleProduct = async (stayAndAddAnother: boolean) => {
    const payload = buildSinglePayload();
    if (!payload) return;

    setSaving(true);
    try {
      if (isEditing && productId) {
        await updateProduct(productId, payload);
        showToast('Product updated in Cloud Firestore.', 'success');
        navigate('/admin/dashboard/products');
      } else {
        await createProduct(payload);
        showToast(`"${payload.name}" saved permanently to Cloud Firestore.`, 'success');
        if (stayAndAddAnother) {
          resetSingleForm();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          navigate('/admin/dashboard/products');
        }
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save product.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSingleProduct(false);
  };

  const handleMoveImagePrimary = (idx: number) => {
    if (idx === 0) return;
    setImages((prev) => {
      const next = [...prev];
      const [picked] = next.splice(idx, 1);
      next.unshift(picked);
      return next;
    });
  };

  const handleAddSpecPreset = (presetKey: string) => {
    if (specs.some((s) => s.key.toLowerCase() === presetKey.toLowerCase())) return;
    setSpecs((prev) => [...prev, { key: presetKey, value: '' }]);
  };

  // Bulk helpers
  const updateBulkRow = (localId: string, patch: Partial<BulkRowDraft>) => {
    setBulkRows((prev) => prev.map((r) => (r.localId === localId ? { ...r, ...patch } : r)));
  };

  const duplicateBulkRow = (row: BulkRowDraft) => {
    const copy: BulkRowDraft = {
      ...row,
      localId: `row_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: row.name ? `${row.name} (Copy)` : '',
      sku: `${row.sku || 'ASW'}-${Math.floor(10 + Math.random() * 89)}`,
      images: [...row.images],
      colors: [...row.colors],
      specs: row.specs.map((s) => ({ ...s })),
      showColorPicker: false,
    };
    setBulkRows((prev) => [...prev, copy]);
  };

  const handlePublishBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeRows = bulkRows.filter((r) => r.name.trim() || r.price.trim());
    if (activeRows.length === 0) {
      showToast('Please fill in at least one product row before publishing.', 'error');
      return;
    }

    const payloads: ProductInput[] = [];
    for (let i = 0; i < activeRows.length; i++) {
      const r = activeRows[i];
      if (!r.name.trim()) {
        showToast(`Product Row #${i + 1} is missing a product name.`, 'error');
        return;
      }
      const p = Number(r.price);
      const dp = r.discountPrice ? Number(r.discountPrice) : 0;
      if (Number.isNaN(p) || p < 0) {
        showToast(`Product "${r.name}" needs a valid price.`, 'error');
        return;
      }
      if (dp > p) {
        showToast(`Product "${r.name}" discount price cannot exceed regular price.`, 'error');
        return;
      }

      const catObj = categories.find((c) => c.id === r.categoryId);
      const subObj = subcategories.find((s) => s.id === r.subcategoryId);
      const specsObj: Record<string, string> = {};
      for (const pair of r.specs) {
        if (pair.key.trim() && pair.value.trim()) {
          specsObj[pair.key.trim()] = pair.value.trim();
        }
      }

      payloads.push({
        name: r.name.trim(),
        slug: slugify(r.name),
        sku: r.sku.trim() || `ASW-${Date.now().toString().slice(-5)}-${i + 1}`,
        description: r.description.trim(),
        price: p,
        discountPrice: dp,
        categoryId: catObj ? catObj.id : '',
        categoryName: catObj ? catObj.name : '',
        subcategoryId: subObj ? subObj.id : '',
        subcategoryName: subObj ? subObj.name : '',
        brand: r.brand.trim(),
        stock: Math.max(0, Math.round(Number(r.stock) || 0)),
        images: r.images,
        sizes: parseCommaList(r.sizesInput),
        colors: r.colors,
        variations: parseCommaList(r.variationsInput),
        specifications: specsObj,
        weight: r.weight.trim(),
        shippingInfo: r.shippingInfo.trim(),
        status: r.status,
        visible: r.visible,
        featured: r.featured,
        recommended: false,
        trending: false,
        newArrival: r.newArrival,
        bestSelling: false,
      });
    }

    setSaving(true);
    try {
      const result = await createProductsBulk(payloads);
      if (result.createdIds.length > 0 && result.failed.length === 0) {
        showToast(
          `${result.createdIds.length} products published permanently to Cloud Firestore!`,
          'success'
        );
        navigate('/admin/dashboard/products');
      } else if (result.createdIds.length > 0) {
        showToast(
          `${result.createdIds.length} published, ${result.failed.length} failed (${result.failed[0].error}).`,
          'error'
        );
      } else {
        showToast(result.failed[0]?.error || 'Failed to publish products.', 'error');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Bulk publish failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-sm text-slate-500">Loading product editor...</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header + Mode Switch */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/dashboard/products')}
            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-[#F85606]"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900">
              {isEditing
                ? 'Edit Product'
                : mode === 'bulk'
                ? 'Bulk Add Multiple Products'
                : 'Add New Product'}
            </h1>
            <p className="text-xs text-slate-500">
              Unlimited photos, all global colors, and custom attributes stored permanently in Firebase.
            </p>
          </div>
        </div>

        {!isEditing && (
          <div className="inline-flex p-1 bg-slate-200/70 rounded-lg">
            <button
              type="button"
              onClick={() => setMode('single')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md inline-flex items-center gap-1.5 ${
                mode === 'single' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              <PackagePlus className="w-3.5 h-3.5" />
              <span>Single Product</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('bulk')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md inline-flex items-center gap-1.5 ${
                mode === 'bulk' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Bulk Add Multiple ({bulkRows.length})</span>
            </button>
          </div>
        )}
      </div>

      {mode === 'bulk' && !isEditing ? (
        <form onSubmit={handlePublishBulk} className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-600">
              Add as many products as you want in one batch. Every product supports unlimited photos, multiple world colors, sizes, and custom details.
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setBulkRows((prev) => [
                    ...prev,
                    makeEmptyBulkRow(prev.length + 1, prev[0]?.categoryId || ''),
                  ])
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Product Row</span>
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#F85606] hover:bg-[#E04A00] text-white text-xs font-semibold rounded-lg disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>
                  {saving ? 'Publishing...' : `Publish All (${bulkRows.length}) Products`}
                </span>
              </button>
            </div>
          </div>

          <div className="space-y-5">
            {bulkRows.map((row, idx) => {
              const rowSubs = row.categoryId
                ? subcategories.filter((s) => s.categoryId === row.categoryId)
                : subcategories;
              return (
                <div
                  key={row.localId}
                  className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-[#FFF5F0] text-[#F85606] font-mono text-xs font-bold rounded-md">
                        Product #{idx + 1}
                      </span>
                      <span className="text-sm font-bold text-slate-900 truncate max-w-xs">
                        {row.name || 'Untitled Product'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => duplicateBulkRow(row)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:border-[#F85606]"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Duplicate</span>
                      </button>
                      {bulkRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setBulkRows((prev) => prev.filter((item) => item.localId !== row.localId))
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-red-200 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={row.name}
                        onChange={(e) => updateBulkRow(row.localId, { name: e.target.value })}
                        placeholder="e.g. Wireless Earbuds Pro"
                        className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">SKU *</label>
                      <input
                        type="text"
                        required
                        value={row.sku}
                        onChange={(e) => updateBulkRow(row.localId, { sku: e.target.value })}
                        className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Brand</label>
                      <input
                        type="text"
                        value={row.brand}
                        onChange={(e) => updateBulkRow(row.localId, { brand: e.target.value })}
                        className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Price (৳) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={row.price}
                        onChange={(e) => updateBulkRow(row.localId, { price: e.target.value })}
                        className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Discount Price (৳)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.discountPrice}
                        onChange={(e) =>
                          updateBulkRow(row.localId, { discountPrice: e.target.value })
                        }
                        className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Stock *
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={row.stock}
                        onChange={(e) => updateBulkRow(row.localId, { stock: e.target.value })}
                        className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Category
                      </label>
                      <select
                        value={row.categoryId}
                        onChange={(e) =>
                          updateBulkRow(row.localId, {
                            categoryId: e.target.value,
                            subcategoryId: '',
                          })
                        }
                        className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm bg-white"
                      >
                        <option value="">Uncategorized</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Subcategory
                      </label>
                      <select
                        value={row.subcategoryId}
                        onChange={(e) => updateBulkRow(row.localId, { subcategoryId: e.target.value })}
                        className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm bg-white"
                      >
                        <option value="">None</option>
                        {rowSubs.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Sizes (comma separated)
                      </label>
                      <input
                        type="text"
                        value={row.sizesInput}
                        onChange={(e) => updateBulkRow(row.localId, { sizesInput: e.target.value })}
                        placeholder="S, M, L, XL"
                        className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Variations (comma separated)
                      </label>
                      <input
                        type="text"
                        value={row.variationsInput}
                        onChange={(e) =>
                          updateBulkRow(row.localId, { variationsInput: e.target.value })
                        }
                        placeholder="Standard, Pro, Bundle"
                        className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Description / Highlights
                    </label>
                    <textarea
                      rows={2}
                      value={row.description}
                      onChange={(e) => updateBulkRow(row.localId, { description: e.target.value })}
                      placeholder="Product description, features, or package contents..."
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>

                  {/* Unlimited Photos for Row */}
                  <div className="space-y-2">
                    <CloudImageUploader
                      folder="products"
                      multiple
                      label={`Product #${idx + 1} Photos (${row.images.length} added · Unlimited)`}
                      onUploaded={(urls) =>
                        updateBulkRow(row.localId, { images: [...row.images, ...urls] })
                      }
                    />
                    {row.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {row.images.map((url, imgIdx) => (
                          <div
                            key={`${url}_${imgIdx}`}
                            className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-50"
                          >
                            <img
                              src={url}
                              alt={`Row ${idx + 1} image ${imgIdx + 1}`}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                updateBulkRow(row.localId, {
                                  images: row.images.filter((_, i) => i !== imgIdx),
                                })
                              }
                              aria-label="Remove image"
                              className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Multi-Color Selector Toggle for Row */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-700">
                        Colors Selected: {row.colors.length}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateBulkRow(row.localId, { showColorPicker: !row.showColorPicker })
                        }
                        className="px-3 py-1.5 bg-[#FFF5F0] text-[#F85606] hover:bg-[#F85606] hover:text-white rounded-lg text-xs font-semibold transition-colors"
                      >
                        {row.showColorPicker
                          ? 'Hide Color Picker'
                          : 'Choose From All World Colors'}
                      </button>
                    </div>
                    {row.showColorPicker && (
                      <WorldColorSelector
                        compact
                        selectedColors={row.colors}
                        onChange={(nextColors) => updateBulkRow(row.localId, { colors: nextColors })}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() =>
                setBulkRows((prev) => [
                  ...prev,
                  makeEmptyBulkRow(prev.length + 1, prev[0]?.categoryId || ''),
                ])
              }
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 hover:border-[#F85606] text-slate-800 text-xs font-semibold rounded-lg"
            >
              <Plus className="w-4 h-4 text-[#F85606]" />
              <span>Add Another Product Row</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#F85606] hover:bg-[#E04A00] text-white text-sm font-semibold rounded-lg disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>
                {saving ? 'Publishing All...' : `Publish All (${bulkRows.length}) Products`}
              </span>
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Action Buttons Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-600">
              {isEditing ? (
                <span>Editing existing product. Changes save permanently to Cloud Firestore.</span>
              ) : (
                <span>
                  Want to add many items in one page?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('bulk')}
                    className="text-[#F85606] font-semibold hover:underline"
                  >
                    Switch to Bulk Add Multiple Products
                  </button>
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!isEditing && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void saveSingleProduct(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save & Add Another'}</span>
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F85606] hover:bg-[#E04A00] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : isEditing ? 'Update Product' : 'Publish Product'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Main Fields */}
            <div className="lg:col-span-8 space-y-6">
              <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <h2 className="font-display text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
                  Basic Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (!isEditing) setSlug(slugify(e.target.value));
                      }}
                      className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      URL Slug
                    </label>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="auto-generated"
                      className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Product SKU *
                    </label>
                    <input
                      type="text"
                      required
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="e.g. ASW-1001"
                      className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Description & Highlights
                    </label>
                    <textarea
                      rows={5}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Detailed product features, materials, usage instructions, and highlights..."
                      className="w-full p-3 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </section>

              {/* Unlimited Product Images */}
              <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h2 className="font-display text-base font-bold text-slate-900">
                    Product Images ({images.length} added · Unlimited)
                  </h2>
                  {images.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setImages([])}
                      className="text-xs font-semibold text-red-600 hover:underline"
                    >
                      Remove All Photos
                    </button>
                  )}
                </div>
                <CloudImageUploader
                  folder="products"
                  multiple
                  label="Upload Unlimited Product Photos"
                  onUploaded={(urls) => setImages((prev) => [...prev, ...urls])}
                />
                {images.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 pt-2">
                    {images.map((url, idx) => (
                      <div
                        key={`${url}_${idx}`}
                        className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-50 group"
                      >
                        <img
                          src={url}
                          alt={`Product ${idx + 1}`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                          aria-label="Remove image"
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center opacity-90 hover:bg-red-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        {idx === 0 ? (
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-[#F85606] text-white text-[10px] font-semibold rounded inline-flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 fill-white" />
                            Primary
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleMoveImagePrimary(idx)}
                            title="Set as primary cover photo"
                            className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/70 hover:bg-[#F85606] text-white text-[10px] rounded inline-flex items-center gap-0.5"
                          >
                            <ArrowUp className="w-2.5 h-2.5" />
                            Main
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Multi-Color Picker (All World Colors) & Sizes/Variations/Custom Details */}
              <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
                <h2 className="font-display text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
                  All World Colors, Sizes &amp; Custom Details
                </h2>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Select One or Multiple Product Colors (180+ Global Colors + Custom Color)
                  </label>
                  <WorldColorSelector
                    selectedColors={selectedColors}
                    onChange={setSelectedColors}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Available Sizes (comma separated)
                    </label>
                    <input
                      type="text"
                      value={sizesInput}
                      onChange={(e) => setSizesInput(e.target.value)}
                      placeholder="XS, S, M, L, XL, XXL, 40, 41, 42"
                      className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Product Variations / Editions (comma separated)
                    </label>
                    <input
                      type="text"
                      value={variationsInput}
                      onChange={(e) => setVariationsInput(e.target.value)}
                      placeholder="e.g. 128GB, 256GB, Gift Box, Combo Pack"
                      className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                </div>

                {/* Arbitrary Custom Specifications / Details */}
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-700">
                        Custom Attributes &amp; Specifications (Add anything)
                      </label>
                      <p className="text-[11px] text-slate-500">
                        Add any custom fields like Material, Warranty, Model, Ingredients, Care Guide, etc.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSpecs((prev) => [...prev, { key: '', value: '' }])}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#FFF5F0] text-[#F85606] hover:bg-[#F85606] hover:text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Custom Field</span>
                    </button>
                  </div>

                  {/* Quick Field Presets */}
                  <div className="flex flex-wrap gap-1.5">
                    {SPEC_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleAddSpecPreset(preset)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium"
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>

                  {specs.map((row, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                      <input
                        type="text"
                        value={row.key}
                        onChange={(e) =>
                          setSpecs((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, key: e.target.value } : item))
                          )
                        }
                        placeholder="Attribute Name (e.g. Material)"
                        className="h-9 px-3 border border-slate-200 rounded-lg text-xs"
                      />
                      <input
                        type="text"
                        value={row.value}
                        onChange={(e) =>
                          setSpecs((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, value: e.target.value } : item))
                          )
                        }
                        placeholder="Details / Value (e.g. 100% Cotton)"
                        className="h-9 px-3 border border-slate-200 rounded-lg text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setSpecs((prev) => prev.filter((_, i) => i !== idx))}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Right Pricing, Categorization & Status */}
            <div className="lg:col-span-4 space-y-6">
              <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <h2 className="font-display text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
                  Pricing &amp; Inventory
                </h2>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Regular Price (৳) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Discount Price (৳, optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discountPrice}
                    onChange={(e) => setDiscountPrice(e.target.value)}
                    placeholder="Leave blank if no discount"
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-mono"
                  />
                </div>
              </section>

              <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <h2 className="font-display text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
                  Category &amp; Shipping
                </h2>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">Category</label>
                    <Link
                      to="/admin/dashboard/categories"
                      className="text-[11px] font-semibold text-[#F85606] hover:underline"
                    >
                      Manage Categories
                    </Link>
                  </div>
                  <select
                    value={categoryId}
                    onChange={(e) => {
                      setCategoryId(e.target.value);
                      setSubcategoryId('');
                    }}
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white"
                  >
                    <option value="">Uncategorized</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subcategory
                  </label>
                  <select
                    value={subcategoryId}
                    onChange={(e) => setSubcategoryId(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white"
                  >
                    <option value="">None</option>
                    {filteredSubs.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Brand</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Weight</label>
                  <input
                    type="text"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="e.g. 500g"
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Shipping Information
                  </label>
                  <input
                    type="text"
                    value={shippingInfo}
                    onChange={(e) => setShippingInfo(e.target.value)}
                    placeholder="e.g. Ships within 24 hours"
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </section>

              <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                <h2 className="font-display text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
                  Visibility &amp; Placement
                </h2>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ProductStatus)}
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                {[
                  { label: 'Visible on Storefront', checked: visible, set: setVisible },
                  { label: 'Featured Product', checked: featured, set: setFeatured },
                  { label: 'Recommended Section', checked: recommended, set: setRecommended },
                  { label: 'Trending Section', checked: trending, set: setTrending },
                  { label: 'New Arrival Section', checked: newArrival, set: setNewArrival },
                  { label: 'Best Selling Section', checked: bestSelling, set: setBestSelling },
                ].map((flag) => (
                  <label key={flag.label} className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={flag.checked}
                      onChange={(e) => flag.set(e.target.checked)}
                      className="rounded border-slate-300 text-[#F85606] focus:ring-[#F85606]"
                    />
                    <span>{flag.label}</span>
                  </label>
                ))}
              </section>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
