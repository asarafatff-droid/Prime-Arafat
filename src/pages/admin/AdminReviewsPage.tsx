import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock, MessageSquare, Search, Star, Trash2, XCircle } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { formatDateTime } from '../../lib/utils';
import { listProducts } from '../../services/catalogService';
import {
  deleteReview,
  listAllReviewsForAdmin,
  moderateReview,
} from '../../services/userService';
import type { Product, Review } from '../../types';

export function AdminReviewsPage() {
  const { showToast } = useToast();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [search, setSearch] = useState('');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [revList, prodList] = await Promise.all([
        listAllReviewsForAdmin(),
        listProducts(false),
      ]);
      setReviews(revList);
      setProducts(prodList);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load reviews.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const productMap = useMemo(() => {
    const map = new Map<string, Product>();
    for (const p of products) map.set(p.id, p);
    return map;
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reviews.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (!q) return true;
      const pName = productMap.get(r.productId)?.name.toLowerCase() || '';
      return (
        r.userName.toLowerCase().includes(q) ||
        r.comment.toLowerCase().includes(q) ||
        pName.includes(q)
      );
    });
  }, [reviews, statusFilter, search, productMap]);

  const handleModerate = async (reviewId: string, status: 'approved' | 'pending' | 'rejected') => {
    try {
      await moderateReview(reviewId, status);
      showToast(`Review marked as ${status}.`, 'success');
      await loadAll();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update review.', 'error');
    }
  };

  const handleDelete = async (reviewId: string) => {
    try {
      await deleteReview(reviewId);
      showToast('Review deleted.', 'info');
      await loadAll();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete review.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Reviews Moderation</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Approve, reject, or remove verified customer product reviews.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer, product, or review..."
            className="w-full h-9 pl-9 pr-3 border border-slate-200 rounded-lg text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          {(['all', 'approved', 'pending', 'rejected'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-[#F85606] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading reviews...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm text-slate-500">No customer reviews found.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((rev) => {
              const prod = productMap.get(rev.productId);
              return (
                <div
                  key={rev.id}
                  className="p-5 flex flex-col md:flex-row md:items-start justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{rev.userName}</span>
                      {rev.verifiedPurchase && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                          Verified Purchase
                        </span>
                      )}
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded capitalize ${
                          rev.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700'
                            : rev.status === 'rejected'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {rev.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500">
                      Product:{' '}
                      <span className="font-semibold text-slate-700">
                        {prod?.name || rev.productId}
                      </span>{' '}
                      · {formatDateTime(rev.createdAt)}
                    </p>

                    <div className="flex items-center gap-1 pt-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= rev.rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>

                    <p className="text-sm text-slate-700 leading-relaxed pt-1">{rev.comment}</p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {rev.status !== 'approved' && (
                      <button
                        type="button"
                        onClick={() => void handleModerate(rev.id, 'approved')}
                        title="Approve review"
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold inline-flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                    )}
                    {rev.status !== 'pending' && (
                      <button
                        type="button"
                        onClick={() => void handleModerate(rev.id, 'pending')}
                        title="Set pending"
                        className="px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-semibold inline-flex items-center gap-1"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Pending</span>
                      </button>
                    )}
                    {rev.status !== 'rejected' && (
                      <button
                        type="button"
                        onClick={() => void handleModerate(rev.id, 'rejected')}
                        title="Reject review"
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold inline-flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void handleDelete(rev.id)}
                      title="Delete review"
                      className="p-1.5 rounded-lg border border-slate-200 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
