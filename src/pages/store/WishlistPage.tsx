import { useMemo } from 'react';
import { Heart } from 'lucide-react';
import { EmptyState } from '../../components/common/EmptyState';
import { ProductCard } from '../../components/common/ProductCard';
import { useAuth } from '../../contexts/AuthContext';
import { useStore } from '../../contexts/StoreContext';

export function WishlistPage() {
  const { user } = useAuth();
  const { wishlist, products, activeFlashSalePrices } = useStore();

  const savedProducts = useMemo(() => {
    const ids = new Set(wishlist.map((w) => w.productId));
    return products.filter((p) => ids.has(p.id));
  }, [wishlist, products]);

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <EmptyState
          title="Sign in to view your wishlist"
          description="Save products you love and access them anytime."
          icon={<Heart className="w-6 h-6" />}
          actionLabel="Sign In"
          actionTo="/login"
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 md:px-6 py-6 md:py-8 space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">
          My Wishlist ({savedProducts.length})
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Products saved to your personal wishlist.</p>
      </div>

      {savedProducts.length === 0 ? (
        <EmptyState
          title="Your wishlist is empty."
          description="Tap the heart icon on any product to save it here."
          icon={<Heart className="w-6 h-6" />}
          actionLabel="Browse Products"
          actionTo="/products"
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
          {savedProducts.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              flashSalePrice={activeFlashSalePrices[p.id]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
