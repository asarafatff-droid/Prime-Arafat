import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock,
  DollarSign,
  HardDrive,
  Layers,
  Package,
  Plus,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import { useToast } from '../../contexts/ToastContext';
import { formatDateTime, formatPrice } from '../../lib/utils';
import { listAllCustomers } from '../../services/adminService';
import { listProducts } from '../../services/catalogService';
import { listAllOrders } from '../../services/orderService';
import type { CustomerProfile, Order, Product } from '../../types';

export function AdminDashboardHome() {
  const { websiteSettings } = useStore();
  const { showToast } = useToast();
  const symbol = websiteSettings.currencySymbol || '৳';

  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const [ords, prods, custs] = await Promise.all([
          listAllOrders(),
          listProducts(false),
          listAllCustomers(),
        ]);
        if (!active) return;
        setOrders(ords);
        setProducts(prods);
        setCustomers(custs);
      } catch (err) {
        if (active) {
          showToast(err instanceof Error ? err.message : 'Failed to load dashboard metrics.', 'error');
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [showToast]);

  const metrics = useMemo(() => {
    const pendingOrders = orders.filter((o) => o.status === 'Pending').length;
    const completedOrders = orders.filter((o) => o.status === 'Delivered').length;
    const totalSales = orders
      .filter((o) => o.status !== 'Cancelled' && o.status !== 'Returned')
      .reduce((sum, o) => sum + (o.total || 0), 0);
    const lowStock = products.filter((p) => p.stock <= 5);
    return {
      totalOrders: orders.length,
      totalProducts: products.length,
      totalCustomers: customers.length,
      pendingOrders,
      completedOrders,
      totalSales,
      lowStock,
    };
  }, [orders, products, customers]);

  const kpiCards = [
    {
      label: 'Total Sales',
      value: formatPrice(metrics.totalSales, symbol),
      icon: DollarSign,
      tone: 'text-[#F85606] bg-[#FFF5F0]',
    },
    {
      label: 'Total Orders',
      value: String(metrics.totalOrders),
      icon: ClipboardList,
      tone: 'text-slate-900 bg-slate-100',
    },
    {
      label: 'Pending Orders',
      value: String(metrics.pendingOrders),
      icon: Clock,
      tone: 'text-amber-700 bg-amber-50',
    },
    {
      label: 'Completed Orders',
      value: String(metrics.completedOrders),
      icon: CheckCircle2,
      tone: 'text-emerald-700 bg-emerald-50',
    },
    {
      label: 'Total Products',
      value: String(metrics.totalProducts),
      icon: Package,
      tone: 'text-slate-900 bg-slate-100',
    },
    {
      label: 'Total Customers',
      value: String(metrics.totalCustomers),
      icon: Users,
      tone: 'text-slate-900 bg-slate-100',
    },
    {
      label: 'Low Stock Products',
      value: String(metrics.lowStock.length),
      icon: AlertTriangle,
      tone: 'text-red-600 bg-red-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Dashboard Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Live marketplace metrics saved permanently in Cloud Firestore.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/dashboard/categories"
            className="px-3.5 py-2 bg-white border border-slate-200 hover:border-[#F85606] rounded-lg text-xs font-semibold text-slate-800"
          >
            Categories
          </Link>
          <Link
            to="/admin/dashboard/products/new?mode=bulk"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:border-[#F85606] rounded-lg text-xs font-semibold text-slate-800"
          >
            <Layers className="w-3.5 h-3.5 text-[#F85606]" />
            <span>Bulk Add Products</span>
          </Link>
          <Link
            to="/admin/dashboard/products/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#F85606] hover:bg-[#E04A00] text-white rounded-lg text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* Permanent Storage & Persistence Quick Strip */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-xs text-emerald-900">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>
            <strong>Permanent Cloud Storage Active:</strong> Products, unlimited photos, colors,
            logos, banners, and orders stay saved forever with zero auto-reset.
          </span>
        </div>
        <Link
          to="/admin/dashboard/backup"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 bg-white border border-emerald-200 px-3 py-1.5 rounded-lg shrink-0"
        >
          <HardDrive className="w-3.5 h-3.5" />
          <span>Verify Storage &amp; Backup</span>
        </Link>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white border border-slate-200 rounded-xl p-4 flex items-start justify-between gap-3"
            >
              <div>
                <p className="text-xs font-medium text-slate-500">{card.label}</p>
                <p className="font-mono tabular-nums text-2xl font-bold text-slate-900 mt-1">
                  {loading ? '—' : card.value}
                </p>
              </div>
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${card.tone}`}
              >
                <Icon className="w-4 h-4" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Orders */}
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-slate-900">Recent Orders</h2>
            <Link
              to="/admin/dashboard/orders"
              className="text-xs font-semibold text-[#F85606] hover:underline"
            >
              View All Orders &rarr;
            </Link>
          </div>
          {orders.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 pr-3 font-semibold">Order ID</th>
                    <th className="py-2 pr-3 font-semibold">Customer</th>
                    <th className="py-2 pr-3 font-semibold">Status</th>
                    <th className="py-2 pr-3 font-semibold text-right">Total</th>
                    <th className="py-2 font-semibold text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.slice(0, 8).map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50">
                      <td className="py-2.5 pr-3 font-mono font-semibold text-slate-900">
                        {o.orderNumber}
                      </td>
                      <td className="py-2.5 pr-3 text-slate-700">{o.customerName}</td>
                      <td className="py-2.5 pr-3 font-medium text-[#F85606]">{o.status}</td>
                      <td className="py-2.5 pr-3 text-right font-mono tabular-nums font-semibold">
                        {formatPrice(o.total, symbol)}
                      </td>
                      <td className="py-2.5 text-right text-slate-500 whitespace-nowrap">
                        {formatDateTime(o.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Low Stock Alert */}
        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-slate-900">Low Stock Products</h2>
            <Link
              to="/admin/dashboard/products"
              className="text-xs font-semibold text-[#F85606] hover:underline"
            >
              Manage Stock &rarr;
            </Link>
          </div>
          {metrics.lowStock.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">
              {products.length === 0
                ? 'No products uploaded yet.'
                : 'All products have healthy stock levels.'}
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {metrics.lowStock.slice(0, 8).map((p) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <Link
                      to={`/admin/dashboard/products/edit/${p.id}`}
                      className="font-semibold text-slate-900 hover:text-[#F85606] truncate block"
                    >
                      {p.name}
                    </Link>
                    <span className="text-slate-500 font-mono">SKU: {p.sku}</span>
                  </div>
                  <span
                    className={`font-mono tabular-nums font-bold shrink-0 ${
                      p.stock === 0 ? 'text-red-600' : 'text-amber-600'
                    }`}
                  >
                    {p.stock} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
