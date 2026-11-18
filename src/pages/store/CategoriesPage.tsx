import { Link } from 'react-router-dom';
import { FolderTree, ChevronRight } from 'lucide-react';
import { EmptyState } from '../../components/common/EmptyState';
import { ImageWithFallback } from '../../components/common/ImageWithFallback';
import { useStore } from '../../contexts/StoreContext';

export function CategoriesPage() {
  const { categories, subcategories, products, loading } = useStore();

  const countForCategory = (catId: string) =>
    products.filter((p) => p.categoryId === catId).length;

  const countForSubcategory = (subId: string) =>
    products.filter((p) => p.subcategoryId === subId).length;

  return (
    <div className="max-w-7xl mx-auto px-3 md:px-6 py-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">All Categories</h1>
        <p className="text-sm text-slate-500 mt-1">
          Browse marketplace categories and subcategories.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 h-40 animate-pulse" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <EmptyState
          title="No categories created yet."
          description="Categories created by the administrator will appear here."
          icon={<FolderTree className="w-6 h-6" />}
          actionLabel="Back to Home"
          actionTo="/"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => {
            const subs = subcategories.filter((s) => s.categoryId === cat.id);
            const totalCount = countForCategory(cat.id);
            return (
              <div
                key={cat.id}
                className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-4"
              >
                <Link
                  to={`/products?category=${cat.id}`}
                  className="flex items-center gap-4 group"
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 shrink-0">
                    <ImageWithFallback src={cat.imageUrl} alt={cat.name} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-base font-bold text-slate-900 group-hover:text-[#F85606] transition-colors truncate">
                      {cat.name}
                    </h2>
                    <p className="text-xs text-slate-500 tabular-nums mt-0.5">
                      {totalCount} {totalCount === 1 ? 'product' : 'products'}
                    </p>
                    {cat.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">{cat.description}</p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#F85606] shrink-0" />
                </Link>

                {subs.length > 0 && (
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                    {subs.map((sub) => (
                      <Link
                        key={sub.id}
                        to={`/products?category=${cat.id}&subcategory=${sub.id}`}
                        className="text-xs px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-700 hover:border-[#F85606] hover:text-[#F85606] transition-colors"
                      >
                        {sub.name} ({countForSubcategory(sub.id)})
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
