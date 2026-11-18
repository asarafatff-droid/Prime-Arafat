import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BarChart3, Download, Package, ShoppingBag, TrendingUp } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import { useToast } from '../../contexts/ToastContext';
import { downloadFile, formatPrice } from '../../lib/utils';
import { listCategories, listProducts } from '../../services/catalogService';
import { listAllOrders } from '../../services/orderService';
import type { Category, Order, OrderStatus, Product } from '../../types';

const STATUS_LIST: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Processing',
  'Packed',
  'Shipped',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
  'Returned',
];

export function AdminReportsPage() {
  const { websiteSettings } = useStore();
  const { showToast } = useToast();
  const symbol = websiteSettings.currencySymbol || '৳';

  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const [ordList, prodList, catList] = await Promise.all([
          listAllOrders(),
          listProducts(false),
          listCategories(false),
        ]);
        if (!active) return;
        setOrders(ordList);
        setProducts(prodList);
        setCategories(catList);
      } catch (err) {
        if (active) {
          showToast(
            err instanceof Error ? err.message : 'Failed to load analytics data.',
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

  const analytics = useMemo(() => {
    const validOrders = orders.filter(
      (o) => o.status !== 'Cancelled' && o.status !== 'Returned'
    );
    const totalRevenue = validOrders.reduce((acc, o) => acc + (o.total || 0), 0);
    const deliveredRevenue = orders
      .filter((o) => o.status === 'Delivered')
      .reduce((acc, o) => acc + (o.total || 0), 0);
    const avgOrderValue = validOrders.length > 0 ? totalRevenue / validOrders.length : 0;

    // Status distribution
    const statusCounts: Record<string, number> = {};
    for (const st of STATUS_LIST) statusCounts[st] = 0;
    for (const o of orders) {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    }

    // Monthly revenue aggregation (last 6 active months)
    const monthMap = new Map<string, { revenue: number; count: number }>();
    for (const o of validOrders) {
      const secs = o.createdAt?.seconds;
      const d = secs ? new Date(secs * 1000) : new Date();
      const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const curr = monthMap.get(label) || { revenue: 0, count: 0 };
      curr.revenue += o.total || 0;
      curr.count += 1;
      monthMap.set(label, curr);
    }
    const monthlySeries = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6);
    const maxMonthlyRev = Math.max(1, ...monthlySeries.map(([, v]) => v.revenue));

    // Top-selling products
    const topProducts = [...products]
      .filter((p) => (p.salesCount || 0) > 0)
      .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
      .slice(0, 8);

    // Low stock products
    const lowStockProducts = [...products]
      .filter((p) => p.stock <= 5)
      .sort((a, b) => a.stock - b.stock);

    // Category breakdown
    const categoryStats = categories.map((cat) => {
      const catProds = products.filter((p) => p.categoryId === cat.id);
      const unitsSold = catProds.reduce((acc, p) => acc + (p.salesCount || 0), 0);
      const totalStock = catProds.reduce((acc, p) => acc + (p.stock || 0), 0);
      return {
        id: cat.id,
        name: cat.name,
        productCount: catProds.length,
        unitsSold,
        totalStock,
      };
    });

    return {
      totalRevenue,
      deliveredRevenue,
      avgOrderValue,
      validOrdersCount: validOrders.length,
      statusCounts,
      monthlySeries,
      maxMonthlyRev,
      topProducts,
      lowStockProducts,
      categoryStats,
    };
  }, [orders, products, categories]);

  const handleExportOrdersCsv = () => {
    const header = [
      'OrderNumber',
      'Customer',
      'Mobile',
      'District',
      'Status',
      'PaymentMethod',
      'PaymentStatus',
      'Subtotal',
      'ShippingFee',
      'Total',
    ];
    const rows = orders.map((o) => [
      o.orderNumber,
      `"${(o.customerName || '').replace(/"/g, '""')}"`,
      `"${(o.mobile || '').replace(/"/g, '""')}"`,
      `"${(o.district || '').replace(/"/g, '""')}"`,
      o.status,
      o.paymentMethodLabel || o.paymentMethod,
      o.paymentStatus,
      String(o.subtotal || 0),
      String(o.shippingFee || 0),
      String(o.total || 0),
    ]);
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadFile(csv, `as-world-orders-report-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
    showToast('Orders CSV report downloaded.', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time marketplace revenue, order fulfillment metrics, and inventory health.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportOrdersCsv}
          disabled={orders.length === 0}
          className="h-10 px-4 bg-white border border-slate-200 hover:border-[#F85606] text-slate-800 text-xs font-semibold rounded-lg inline-flex items-center gap-2 disabled:opacity-40"
        >
          <Download className="w-4 h-4 text-[#F85606]" />
          <span>Export Sales CSV</span>
        </button>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
          Computing marketplace analytics...
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Gross Sales (Excl. Cancelled)</span>
                <TrendingUp className="w-4 h-4 text-[#F85606]" />
              </div>
              <p className="font-display text-2xl font-bold text-slate-900 mt-2">
                {formatPrice(analytics.totalRevenue, symbol)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {analytics.validOrdersCount} active/completed orders
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Delivered Revenue</span>
                <BarChart3 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="font-display text-2xl font-bold text-slate-900 mt-2">
                {formatPrice(analytics.deliveredRevenue, symbol)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {analytics.statusCounts['Delivered'] || 0} delivered orders
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Average Order Value</span>
                <ShoppingBag className="w-4 h-4 text-blue-600" />
              </div>
              <p className="font-display text-2xl font-bold text-slate-900 mt-2">
                {formatPrice(analytics.avgOrderValue, symbol)}
              </p>
              <p className="text-xs text-slate-500 mt-1">{orders.length} total orders</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Low Stock Alerts</span>
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <p className="font-display text-2xl font-bold text-slate-900 mt-2">
                {analytics.lowStockProducts.length}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Out of {products.length} catalog products
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Monthly Revenue Chart */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <h2 className="font-display text-base font-bold text-slate-900">
                Monthly Revenue Trend
              </h2>
              {analytics.monthlySeries.length === 0 ? (
                <p className="text-sm text-slate-500 py-8 text-center">
                  No sales recorded yet. Revenue bars appear automatically once orders are placed.
                </p>
              ) : (
                <div className="space-y-3 pt-2">
                  {analytics.monthlySeries.map(([month, stats]) => {
                    const widthPct = Math.max(4, Math.round((stats.revenue / analytics.maxMonthlyRev) * 100));
                    return (
                      <div key={month} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-semibold text-slate-700">{month}</span>
                          <span className="text-slate-600">
                            {formatPrice(stats.revenue, symbol)} ({stats.count} orders)
                          </span>
                        </div>
                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#F85606] rounded-full transition-all"
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Order Status Breakdown */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <h2 className="font-display text-base font-bold text-slate-900">
                Order Status Breakdown
              </h2>
              <div className="grid grid-cols-2 gap-2.5">
                {STATUS_LIST.map((st) => (
                  <div
                    key={st}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between"
                  >
                    <span className="text-xs font-medium text-slate-600">{st}</span>
                    <span className="font-mono text-sm font-bold text-slate-900">
                      {analytics.statusCounts[st] || 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Selling Products */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
                <Package className="w-4 h-4 text-[#F85606]" />
                <h2 className="font-display text-sm font-bold text-slate-900">
                  Top Selling Products
                </h2>
              </div>
              {analytics.topProducts.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  No product sales recorded yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {analytics.topProducts.map((prod) => (
                    <div key={prod.id} className="px-5 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{prod.name}</p>
                        <p className="text-xs text-slate-500 font-mono">{prod.sku}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-slate-900">
                          {prod.salesCount} sold
                        </p>
                        <p className="text-[11px] text-slate-500">Stock: {prod.stock}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Low Stock Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h2 className="font-display text-sm font-bold text-slate-900">
                  Low & Out-of-Stock Inventory (&le; 5 units)
                </h2>
              </div>
              {analytics.lowStockProducts.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  {products.length === 0
                    ? 'No products uploaded yet.'
                    : 'All products have healthy stock levels.'}
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {analytics.lowStockProducts.map((prod) => (
                    <div key={prod.id} className="px-5 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{prod.name}</p>
                        <p className="text-xs text-slate-500 font-mono">{prod.sku}</p>
                      </div>
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded ${
                          prod.stock === 0
                            ? 'bg-red-50 text-red-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {prod.stock === 0 ? 'Out of stock' : `${prod.stock} left`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Category Performance */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100">
              <h2 className="font-display text-sm font-bold text-slate-900">
                Category Inventory Overview
              </h2>
            </div>
            {analytics.categoryStats.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                No categories created yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Category</th>
                      <th className="px-5 py-3 font-semibold">Products</th>
                      <th className="px-5 py-3 font-semibold">Units Sold</th>
                      <th className="px-5 py-3 font-semibold">Available Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {analytics.categoryStats.map((row) => (
                      <tr key={row.id}>
                        <td className="px-5 py-3 font-semibold text-slate-900">{row.name}</td>
                        <td className="px-5 py-3 font-mono text-slate-600">{row.productCount}</td>
                        <td className="px-5 py-3 font-mono text-slate-600">{row.unitsSold}</td>
                        <td className="px-5 py-3 font-mono text-slate-600">{row.totalStock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
