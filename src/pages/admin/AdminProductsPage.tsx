import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Eye, EyeOff, Layers, Plus, Search, Star, Trash2 } from 'lucide-react';
import { ImageWithFallback } from '../../components/common/ImageWithFallback';
import { useStore } from '../../contexts/StoreContext';
import { useToast } from '../../contexts/ToastContext';
import { getColorHex } from '../../lib/colors';
import { formatPrice } from '../../lib/utils';
import { deleteProduct, listProducts, updateProduct } from '../../services/catalogService';
import type { Product } from '../../types';

export function AdminProductsPage() {
  const { websiteSettings } = useStore();
  const { showToast } = useToast();
  const symbol = websiteSettings.currencySymbol || '৳';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const list = await listProducts(false);
      setProducts(list);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load products.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return products.filter((p) => {
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.categoryName || '').toLowerCase().includes(q)
      );
    });
  }, [products, searchText, statusFilter]);

  const handleToggleVisible = async (p: Product) => {
    try {
      await updateProduct(p.id, { visible: !p.visible });
      setProducts((prev) =>
        prev.map((item) => (item.id === p.id ? { ...item, visible: !p.visible } : item))
      );
      showToast(`Visibility updated for ${p.name}.`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update visibility.', 'error');
    }
  };

  const handleToggleFeatured = async (p: Product) => {
    try {
      await updateProduct(p.id, { featured: !p.featured });
      setProducts((prev) =>
        prev.map((item) => (item.id === p.id ? { ...item, featured: !p.featured } : item))
      );
      showToast(`Featured flag updated for ${p.name}.`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update featured flag.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setConfirmDeleteId(null);
      showToast('Product permanently deleted.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete product.', 'error');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Products stay saved forever in Cloud Firestore unless you delete them here.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/dashboard/products/new?mode=bulk"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-slate-200 hover:border-[#F85606] text-slate-800 text-xs font-semibold rounded-lg"
          >
            <Layers className="w-4 h-4 text-[#F85606]" />
            <span>Bulk Add Multiple</span>
          </Link>
          <Link
            to="/admin/dashboard/products/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#F85606] hover:bg-[#E04A00] text-white text-xs font-semibold rounded-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search by name, SKU, or category..."
            className="w-full h-9 pl-9 pr-3 border border-slate-200 rounded-lg text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 px-3 border border-slate-200 rounded-lg text-sm bg-white"
        >
          <option value="ALL">All Statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading products...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-sm font-medium text-slate-700">No products available yet.</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link
                to="/admin/dashboard/products/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#F85606] text-white text-xs font-semibold rounded-lg"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Product</span>
              </Link>
              <Link
                to="/admin/dashboard/products/new?mode=bulk"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg"
              >
                <Layers className="w-4 h-4" />
                <span>Bulk Add Products</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="py-3 px-4 font-semibold">Product</th>
                  <th className="py-3 px-3 font-semibold">SKU</th>
                  <th className="py-3 px-3 font-semibold">Colors &amp; Photos</th>
                  <th className="py-3 px-3 font-semibold text-right">Price</th>
                  <th className="py-3 px-3 font-semibold text-right">Stock</th>
                  <th className="py-3 px-3 font-semibold text-center">Status</th>
                  <th className="py-3 px-3 font-semibold text-center">Visible</th>
                  <th className="py-3 px-3 font-semibold text-center">Featured</th>
                  <th className="py-3 px-4 font-semibold text-right">Edit / Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                          <ImageWithFallback src={p.images?.[0]} alt={p.name} />
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-900 line-clamp-1 max-w-[200px] block">
                            {p.name}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {p.categoryName || 'Uncategorized'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">{p.sku}</td>
                    <td className="py-3 px-3">
                      <div className="space-y-1">
                        <span className="text-[11px] text-slate-500 block">
                          {p.images?.length || 0} {(p.images?.length || 0) === 1 ? 'photo' : 'photos'}
                        </span>
                        {(p.colors?.length || 0) > 0 && (
                          <div className="flex items-center gap-1">
                            {p.colors!.slice(0, 5).map((col) => (
                              <span
                                key={col}
                                title={col}
                                className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block"
                                style={{ backgroundColor: getColorHex(col) }}
                              />
                            ))}
                            {p.colors!.length > 5 && (
                              <span className="text-[10px] font-semibold text-slate-500">
                                +{p.colors!.length - 5}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums">
                      <span className="font-semibold text-slate-900">
                        {formatPrice(p.discountPrice && p.discountPrice > 0 ? p.discountPrice : p.price, symbol)}
                      </span>
                      {p.discountPrice && p.discountPrice > 0 && p.discountPrice < p.price && (
                        <span className="block text-[10px] text-slate-400 line-through">
                          {formatPrice(p.price, symbol)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold">
                      <span className={p.stock <= 5 ? 'text-red-600' : 'text-slate-900'}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center capitalize font-medium text-slate-700">
                      {p.status}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleVisible(p)}
                        title={p.visible ? 'Hide from storefront' : 'Show on storefront'}
                        className={`p-1.5 rounded-lg ${
                          p.visible ? 'text-emerald-700 bg-emerald-50' : 'text-slate-400 bg-slate-100'
                        }`}
                      >
                        {p.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleFeatured(p)}
                        title={p.featured ? 'Remove featured' : 'Mark featured'}
                        className={`p-1.5 rounded-lg ${
                          p.featured ? 'text-amber-500 bg-amber-50' : 'text-slate-300 bg-slate-100'
                        }`}
                      >
                        <Star className={`w-4 h-4 ${p.featured ? 'fill-amber-400' : ''}`} />
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          to={`/admin/dashboard/products/edit/${p.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:border-[#F85606] hover:text-[#F85606] font-semibold"
                          title="Edit product"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span className="hidden xl:inline">Edit</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(p.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-semibold"
                          title="Delete product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden xl:inline">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-display text-lg font-bold text-slate-900">Delete Product?</h3>
            <p className="text-sm text-slate-600">
              This permanently removes the product from Cloud Firestore. Products are never deleted automatically.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(confirmDeleteId)}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
