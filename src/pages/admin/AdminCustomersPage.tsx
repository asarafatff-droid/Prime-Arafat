import { useEffect, useMemo, useState } from 'react';
import { Search, Users } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import { useToast } from '../../contexts/ToastContext';
import { formatDate, formatPrice } from '../../lib/utils';
import { listAllCustomers } from '../../services/adminService';
import { listAllOrders } from '../../services/orderService';
import type { CustomerProfile, Order } from '../../types';

export function AdminCustomersPage() {
  const { websiteSettings } = useStore();
  const { showToast } = useToast();
  const symbol = websiteSettings.currencySymbol || '৳';

  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const [custs, ords] = await Promise.all([listAllCustomers(), listAllOrders()]);
        if (!active) return;
        setCustomers(custs);
        setOrders(ords);
      } catch (err) {
        if (active) showToast(err instanceof Error ? err.message : 'Failed to load customers.', 'error');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [showToast]);

  const statsByUser = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    for (const o of orders) {
      const prev = map.get(o.userId) || { count: 0, total: 0 };
      map.set(o.userId, {
        count: prev.count + 1,
        total: prev.total + (o.status !== 'Cancelled' && o.status !== 'Returned' ? o.total || 0 : 0),
      });
    }
    return map;
  }, [orders]);

  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q)
    );
  }, [customers, searchText]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Customers</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Registered customer accounts and purchase activity.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full h-9 pl-9 pr-3 border border-slate-200 rounded-lg text-sm"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading customers...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Users className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm text-slate-500">No customers registered yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="py-3 px-4 font-semibold">Name</th>
                  <th className="py-3 px-3 font-semibold">Email</th>
                  <th className="py-3 px-3 font-semibold">Phone</th>
                  <th className="py-3 px-3 font-semibold">City / District</th>
                  <th className="py-3 px-3 font-semibold text-right">Orders</th>
                  <th className="py-3 px-3 font-semibold text-right">Total Spent</th>
                  <th className="py-3 px-4 font-semibold text-right">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => {
                  const st = statsByUser.get(c.uid) || { count: 0, total: 0 };
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-semibold text-slate-900">{c.name}</td>
                      <td className="py-3 px-3 text-slate-600">{c.email || '—'}</td>
                      <td className="py-3 px-3 font-mono text-slate-600">{c.phone || '—'}</td>
                      <td className="py-3 px-3 text-slate-600">
                        {[c.city, c.district].filter(Boolean).join(', ') || '—'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold">
                        {st.count}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-[#F85606]">
                        {formatPrice(st.total, symbol)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500 whitespace-nowrap">
                        {formatDate(c.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
