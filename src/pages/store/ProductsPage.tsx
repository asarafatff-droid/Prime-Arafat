import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Flame, History, Package, SlidersHorizontal, X } from 'lucide-react';
import { EmptyState } from '../../components/common/EmptyState';
import { ProductCard } from '../../components/common/ProductCard';
import { useStore } from '../../contexts/StoreContext';
import {
  addSearchHistory,
  clearSearchHistory,
  getSearchHistory,
  removeSearchHistoryItem,
} from '../../lib/searchHistory';
import { getEffectivePrice } from '../../lib/utils';

const PAGE_SIZE = 20;

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { products, categories, subcategories, loading, activeFlashSalePrices } = useStore();

  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || '';
  const initialSubcategory = searchParams.get('subcategory') || '';
  const initialSort = searchParams.get('sort') || 'newest';
  const initialFeatured = searchParams.get('featured') === 'true';
  const initialFlash = searchParams.get('flash') === '1';

  const [searchText, setSearchText] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedSubcategory, setSelectedSubcategory] = useState(initialSubcategory);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [featuredOnly, setFeaturedOnly] = useState(initialFeatured);
  const [flashOnly, setFlashOnly] = useState(initialFlash);
  const [sortBy, setSortBy] = useState(initialSort);
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => getSearchHistory());

  // Sync URL query params when navigating from header search, banners, or category nav
  const urlQ = searchParams.get('q') || '';
  const urlCat = searchParams.get('category') || '';
  const urlSub = searchParams.get('subcategory') || '';
  const urlFlash = searchParams.get('flash') === '1';

  useEffect(() => {
    setSearchText(urlQ);
    if (urlQ.trim()) {
      setRecentSearches(addSearchHistory(urlQ));
    }
  }, [urlQ]);

  useEffect(() => {
    setSelectedCategory(urlCat);
  }, [urlCat]);

  useEffect(() => {
    setSelectedSubcategory(urlSub);
  }, [urlSub]);

  useEffect(() => {
    setFlashOnly(urlFlash);
  }, [urlFlash]);

  const activeQuery = searchText || urlQ;
  const activeCat = selectedCategory || urlCat;
  const activeSub = selectedSubcategory || urlSub;

  const brands = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      if (p.brand && p.brand.trim()) set.add(p.brand.trim());
    }
    return Array.from(set).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = activeQuery.trim().toLowerCase();
    const minP = minPrice ? Number(minPrice) : null;
    const maxP = maxPrice ? Number(maxPrice) : null;

    const list = products.filter((p) => {
      if (q) {
        const matchesText =
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.categoryName || '').toLowerCase().includes(q) ||
          (p.subcategoryName || '').toLowerCase().includes(q) ||
          (p.brand || '').toLowerCase().includes(q);
        if (!matchesText) return false;
      }
      if (activeCat && p.categoryId !== activeCat) return false;
      if (activeSub && p.subcategoryId !== activeSub) return false;
      if (selectedBrand && (p.brand || '') !== selectedBrand) return false;
      if (inStockOnly && p.stock <= 0) return false;
      if (featuredOnly && !p.featured) return false;
      if (flashOnly && !(activeFlashSalePrices[p.id] > 0)) return false;
      if (minRating > 0 && (p.ratingAvg || 0) < minRating) return false;

      const effective = activeFlashSalePrices[p.id] ?? getEffectivePrice(p.price, p.discountPrice);
      if (minP !== null && !Number.isNaN(minP) && effective < minP) return false;
      if (maxP !== null && !Number.isNaN(maxP) && effective > maxP) return false;
      return true;
    });

    const sorted = [...list];
    if (sortBy === 'price_asc') {
      sorted.sort((a, b) => {
        const pa = activeFlashSalePrices[a.id] ?? getEffectivePrice(a.price, a.discountPrice);
        const pb = activeFlashSalePrices[b.id] ?? getEffectivePrice(b.price, b.discountPrice);
        return pa - pb;
      });
    } else if (sortBy === 'price_desc') {
      sorted.sort((a, b) => {
        const pa = activeFlashSalePrices[a.id] ?? getEffectivePrice(a.price, a.discountPrice);
        const pb = activeFlashSalePrices[b.id] ?? getEffectivePrice(b.price, b.discountPrice);
        return pb - pa;
      });
    } else if (sortBy === 'popular') {
      sorted.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
    } else {
      sorted.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
    }
    return sorted;
  }, [
    products,
    activeQuery,
    activeCat,
    activeSub,
    selectedBrand,
    inStockOnly,
    featuredOnly,
    flashOnly,
    minRating,
    minPrice,
    maxPrice,
    sortBy,
    activeFlashSalePrices,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const paginated = filteredProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetFilters = () => {
    setSearchText('');
    setSelectedCategory('');
    setSelectedSubcategory('');
    setSelectedBrand('');
    setMinPrice('');
    setMaxPrice('');
    setMinRating(0);
    setInStockOnly(false);
    setFeaturedOnly(false);
    setFlashOnly(false);
    setSortBy('newest');
    setPage(1);
    setSearchParams({});
  };

  const availableSubcategories = useMemo(
    () => (activeCat ? subcategories.filter((s) => s.categoryId === activeCat) : subcategories),
    [subcategories, activeCat]
  );

  const renderFilters = () => (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Search</label>
        <input
          type="text"
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            setPage(1);
          }}
          placeholder="Name, SKU, brand..."
          className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#F85606]"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Category</label>
        <select
          value={activeCat}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setSelectedSubcategory('');
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              if (e.target.value) next.set('category', e.target.value);
              else next.delete('category');
              next.delete('subcategory');
              return next;
            });
            setPage(1);
          }}
          className="w-full h-9 px-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-[#F85606]"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {availableSubcategories.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Subcategory</label>
          <select
            value={activeSub}
            onChange={(e) => {
              setSelectedSubcategory(e.target.value);
              setPage(1);
            }}
            className="w-full h-9 px-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-[#F85606]"
          >
            <option value="">All Subcategories</option>
            {availableSubcategories.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {brands.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Brand</label>
          <select
            value={selectedBrand}
            onChange={(e) => {
              setSelectedBrand(e.target.value);
              setPage(1);
            }}
            className="w-full h-9 px-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-[#F85606]"
          >
            <option value="">All Brands</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Price Range (৳)</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min="0"
            value={minPrice}
            onChange={(e) => {
              setMinPrice(e.target.value);
              setPage(1);
            }}
            placeholder="Min"
            className="h-9 px-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#F85606]"
          />
          <input
            type="number"
            min="0"
            value={maxPrice}
            onChange={(e) => {
              setMaxPrice(e.target.value);
              setPage(1);
            }}
            placeholder="Max"
            className="h-9 px-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#F85606]"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Minimum Rating</label>
        <select
          value={minRating}
          onChange={(e) => {
            setMinRating(Number(e.target.value));
            setPage(1);
          }}
          className="w-full h-9 px-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-[#F85606]"
        >
          <option value={0}>Any Rating</option>
          <option value={4}>4 Stars & Up</option>
          <option value={3}>3 Stars & Up</option>
          <option value={2}>2 Stars & Up</option>
        </select>
      </div>

      <div className="space-y-2 pt-1">
        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => {
              setInStockOnly(e.target.checked);
              setPage(1);
            }}
            className="rounded border-slate-300 text-[#F85606] focus:ring-[#F85606]"
          />
          <span>In Stock Only</span>
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={featuredOnly}
            onChange={(e) => {
              setFeaturedOnly(e.target.checked);
              setPage(1);
            }}
            className="rounded border-slate-300 text-[#F85606] focus:ring-[#F85606]"
          />
          <span>Featured Products</span>
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={flashOnly}
            onChange={(e) => {
              setFlashOnly(e.target.checked);
              setPage(1);
            }}
            className="rounded border-slate-300 text-[#F85606] focus:ring-[#F85606]"
          />
          <span className="inline-flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-[#F85606]" />
            Flash Sale Only
          </span>
        </label>
      </div>

      <button
        type="button"
        onClick={resetFilters}
        className="w-full py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
      >
        Reset Filters
      </button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-3 md:px-6 py-5 md:py-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="font-display text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
            {flashOnly && <Flame className="w-5 h-5 text-[#F85606]" />}
            <span>
              {activeQuery
                ? `Results for "${activeQuery}"`
                : flashOnly
                ? 'Flash Sale Deals'
                : 'Marketplace Catalog'}
            </span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 tabular-nums mt-0.5">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
          </button>
          <select
            aria-label="Sort products"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs md:text-sm text-slate-700 focus:outline-none focus:border-[#F85606]"
          >
            <option value="newest">Newest Arrivals</option>
            <option value="popular">Most Popular</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {recentSearches.length > 0 && (
        <div className="mb-4 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 flex items-center flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase mr-1">
            <History className="w-3.5 h-3.5 text-[#F85606]" />
            Recent:
          </span>
          {recentSearches.map((term) => (
            <span
              key={term}
              className="inline-flex items-center bg-slate-50 border border-slate-200 rounded-md overflow-hidden text-xs"
            >
              <button
                type="button"
                onClick={() => {
                  setSearchText(term);
                  setSearchParams({ q: term });
                  setRecentSearches(addSearchHistory(term));
                  setPage(1);
                }}
                className="px-2.5 py-1 text-slate-700 hover:text-[#F85606] font-medium"
              >
                {term}
              </button>
              <button
                type="button"
                aria-label={`Remove ${term}`}
                onClick={() => setRecentSearches(removeSearchHistoryItem(term))}
                className="px-1.5 py-1 text-slate-400 hover:text-red-600 border-l border-slate-200"
              >
                ×
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => setRecentSearches(clearSearchHistory())}
            className="ml-auto text-[11px] font-semibold text-slate-400 hover:text-red-600"
          >
            Clear All
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        <aside className="hidden lg:block bg-white border border-slate-200 rounded-xl p-4 h-fit sticky top-28">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
            <Filter className="w-4 h-4 text-[#F85606]" />
            <h2 className="font-display text-sm font-bold text-slate-900">Filters</h2>
          </div>
          {renderFilters()}
        </aside>

        <div>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-lg p-3 h-64 animate-pulse" />
              ))}
            </div>
          ) : paginated.length === 0 ? (
            <EmptyState
              title={products.length === 0 ? 'No products available yet.' : 'No matching products found.'}
              description={
                products.length === 0
                  ? 'Products added by the administrator will appear here.'
                  : 'Try adjusting your search keywords or clearing filters.'
              }
              icon={<Package className="w-6 h-6" />}
              actionLabel={products.length > 0 ? 'Clear Filters' : undefined}
              onAction={products.length > 0 ? resetFilters : undefined}
            />
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                {paginated.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    flashSalePrice={activeFlashSalePrices[p.id]}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 text-sm border border-slate-200 bg-white rounded-lg disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-slate-600 tabular-nums px-2">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1.5 text-sm border border-slate-200 bg-white rounded-lg disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="relative ml-auto w-80 max-w-[85vw] bg-white h-full overflow-y-auto p-5 z-10">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
              <h2 className="font-display text-base font-bold text-slate-900">Filter Products</h2>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                aria-label="Close filters"
                className="p-1.5 text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {renderFilters()}
          </div>
        </div>
      )}
    </div>
  );
}
