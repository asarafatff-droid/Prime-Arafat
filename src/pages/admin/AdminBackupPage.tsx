import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Database,
  DatabaseBackup,
  Download,
  FileSpreadsheet,
  HardDrive,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import firebaseConfig from '../../../firebase-applet-config.json';
import { useToast } from '../../contexts/ToastContext';
import { testConnection } from '../../lib/firebase';
import { downloadFile } from '../../lib/utils';
import { exportFullBackupJson } from '../../services/adminService';
import { listProducts } from '../../services/catalogService';
import { listAllOrders } from '../../services/orderService';
import {
  RECOMMENDED_STORAGE_RULES,
  STORAGE_BUCKET_NAME,
  testCloudStorageConnection,
  type StorageHealthResult,
} from '../../services/storageService';

export function AdminBackupPage() {
  const { showToast } = useToast();

  const [collectionCounts, setCollectionCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [checkingDiagnostics, setCheckingDiagnostics] = useState(false);
  const [firestoreStatus, setFirestoreStatus] = useState<{ ok: boolean; message: string } | null>(
    null
  );
  const [storageStatus, setStorageStatus] = useState<StorageHealthResult | null>(null);
  const [copiedRules, setCopiedRules] = useState(false);

  const loadSnapshotStats = async () => {
    setLoading(true);
    try {
      const backup = await exportFullBackupJson();
      const cols = (backup.collections || {}) as Record<string, any[]>;
      const counts: Record<string, number> = {};
      for (const [key, list] of Object.entries(cols)) {
        counts[key] = Array.isArray(list) ? list.length : 0;
      }
      setCollectionCounts(counts);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to inspect database collections.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const runLiveDiagnostics = async () => {
    setCheckingDiagnostics(true);
    try {
      const [fsRes, stRes] = await Promise.all([
        testConnection(),
        testCloudStorageConnection(),
      ]);
      setFirestoreStatus({
        ok: fsRes.ok,
        message: fsRes.ok
          ? `Connected to Cloud Firestore (${firebaseConfig.firestoreDatabaseId || 'default'}). All data persists permanently across refreshes.`
          : fsRes.message || 'Firestore connection failed.',
      });
      setStorageStatus(stRes);
      if (fsRes.ok && stRes.active) {
        showToast('Both Firestore & Firebase Cloud Storage passed live write checks!', 'success');
      } else if (!stRes.active) {
        showToast('Firestore is active, but Firebase Cloud Storage needs attention.', 'error');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Diagnostic check failed.', 'error');
    } finally {
      setCheckingDiagnostics(false);
    }
  };

  useEffect(() => {
    void loadSnapshotStats();
    void runLiveDiagnostics();
  }, []);

  const handleCopyRules = async () => {
    try {
      await navigator.clipboard.writeText(RECOMMENDED_STORAGE_RULES);
      setCopiedRules(true);
      showToast('Firebase Storage rules copied to clipboard.', 'success');
      window.setTimeout(() => setCopiedRules(false), 2500);
    } catch {
      showToast('Copy failed. Please copy the rules text manually.', 'error');
    }
  };

  const handleFullJsonExport = async () => {
    setExporting(true);
    try {
      const backup = await exportFullBackupJson();
      const json = JSON.stringify(backup, null, 2);
      downloadFile(
        json,
        `as-world-full-backup-${new Date().toISOString().slice(0, 10)}.json`,
        'application/json'
      );
      showToast('Full Firestore JSON backup downloaded.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to export backup.', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleExportProductsCsv = async () => {
    setExporting(true);
    try {
      const products = await listProducts(false);
      const header = [
        'ID',
        'Name',
        'SKU',
        'Category',
        'Price',
        'DiscountPrice',
        'Stock',
        'Status',
        'Visible',
        'Featured',
        'SalesCount',
      ];
      const rows = products.map((p) => [
        p.id,
        `"${(p.name || '').replace(/"/g, '""')}"`,
        `"${(p.sku || '').replace(/"/g, '""')}"`,
        `"${(p.categoryName || '').replace(/"/g, '""')}"`,
        String(p.price || 0),
        String(p.discountPrice || 0),
        String(p.stock || 0),
        p.status,
        String(p.visible),
        String(p.featured),
        String(p.salesCount || 0),
      ]);
      const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
      downloadFile(
        csv,
        `as-world-products-${new Date().toISOString().slice(0, 10)}.csv`,
        'text/csv'
      );
      showToast('Products catalog CSV downloaded.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to export products CSV.', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleExportOrdersCsv = async () => {
    setExporting(true);
    try {
      const orders = await listAllOrders();
      const header = [
        'OrderNumber',
        'CustomerName',
        'Mobile',
        'District',
        'Address',
        'Status',
        'PaymentMethod',
        'PaymentStatus',
        'AdvancePaid',
        'DueOnDelivery',
        'Total',
      ];
      const rows = orders.map((o) => [
        o.orderNumber,
        `"${(o.customerName || '').replace(/"/g, '""')}"`,
        `"${(o.mobile || '').replace(/"/g, '""')}"`,
        `"${(o.district || '').replace(/"/g, '""')}"`,
        `"${(o.deliveryAddress || '').replace(/"/g, '""')}"`,
        o.status,
        `"${(o.paymentMethodLabel || o.paymentMethod).replace(/"/g, '""')}"`,
        o.paymentStatus,
        String(o.advancePaidAmount || 0),
        String(o.dueOnDeliveryAmount ?? o.total ?? 0),
        String(o.total || 0),
      ]);
      const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
      downloadFile(
        csv,
        `as-world-orders-${new Date().toISOString().slice(0, 10)}.csv`,
        'text/csv'
      );
      showToast('Orders CSV downloaded.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to export orders CSV.', 'error');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Backup, Persistence & Storage Health
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Verify live Cloud Firestore & Firebase Cloud Storage persistence and download backups.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void runLiveDiagnostics()}
            disabled={checkingDiagnostics}
            className="h-9 px-3.5 bg-[#F85606] hover:bg-[#E04A00] text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checkingDiagnostics ? 'animate-spin' : ''}`} />
            <span>{checkingDiagnostics ? 'Testing Storage...' : 'Test Live Storage & DB'}</span>
          </button>

          <button
            type="button"
            onClick={() => void loadSnapshotStats()}
            disabled={loading}
            className="h-9 px-3.5 bg-white border border-slate-200 hover:border-[#F85606] rounded-lg text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Counts</span>
          </button>
        </div>
      </div>

      {/* Permanent Persistence Guarantee + Live Diagnostics */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-slate-900">
              Permanent Cloud Persistence Guarantee (Zero Auto-Reset)
            </h2>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Every product, photo, color variation, logo, banner, category, shipping district fee,
              and order is written directly to Google Cloud Firestore &amp; Firebase Cloud Storage.
              Page refreshes, server restarts, or logouts never wipe, format, or reset your store
              data.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Firestore Status Card */}
          <div
            className={`p-4 rounded-xl border ${
              firestoreStatus?.ok
                ? 'bg-emerald-50/60 border-emerald-200'
                : 'bg-amber-50/70 border-amber-200'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <Database className="w-4 h-4 text-[#F85606]" />
                <span>Cloud Firestore Database</span>
              </span>
              {firestoreStatus && (
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                    firestoreStatus.ok
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {firestoreStatus.ok ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <AlertTriangle className="w-3 h-3" />
                  )}
                  {firestoreStatus.ok ? 'ACTIVE' : 'ISSUE'}
                </span>
              )}
            </div>
            <p className="text-[11px] font-mono text-slate-500 mb-1">
              DB: {firebaseConfig.firestoreDatabaseId || '(default)'}
            </p>
            <p className="text-xs text-slate-700 leading-relaxed">
              {firestoreStatus?.message || 'Checking Firestore connection...'}
            </p>
          </div>

          {/* Firebase Cloud Storage Status Card */}
          <div
            className={`p-4 rounded-xl border ${
              storageStatus?.active
                ? 'bg-emerald-50/60 border-emerald-200'
                : storageStatus === null
                ? 'bg-slate-50 border-slate-200'
                : 'bg-amber-50/80 border-amber-200'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <HardDrive className="w-4 h-4 text-[#F85606]" />
                <span>Firebase Cloud Storage (Photos &amp; Logos)</span>
              </span>
              {storageStatus && (
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                    storageStatus.active
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {storageStatus.active ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <AlertTriangle className="w-3 h-3" />
                  )}
                  {storageStatus.active ? 'WRITABLE' : 'NEEDS SETUP'}
                </span>
              )}
            </div>
            <p className="text-[11px] font-mono text-slate-500 mb-1 truncate">
              Bucket: {STORAGE_BUCKET_NAME || 'Not configured'}
            </p>
            <p className="text-xs text-slate-700 leading-relaxed">
              {storageStatus?.message || 'Running live write/delete probe...'}
            </p>
          </div>
        </div>

        {/* Show actionable Firebase Storage setup guide if Storage failed */}
        {storageStatus && !storageStatus.active && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-bold text-amber-900">
                How to activate permanent image uploads in Firebase Cloud Storage:
              </p>
              <button
                type="button"
                onClick={() => void handleCopyRules()}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-amber-300 rounded-lg text-xs font-semibold text-amber-900 hover:bg-amber-100"
              >
                {copiedRules ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedRules ? 'Copied Rules' : 'Copy Storage Rules'}</span>
              </button>
            </div>
            <ol className="list-decimal list-inside text-xs text-amber-900 space-y-1">
              <li>
                Open Firebase Console for project{' '}
                <code className="font-mono bg-white/80 px-1 rounded">{firebaseConfig.projectId}</code>{' '}
                &rarr; <strong>Build &rarr; Storage</strong> and click <strong>Get started</strong> if not enabled yet.
              </li>
              <li>
                Open the <strong>Rules</strong> tab in Storage, paste the rules below, and click{' '}
                <strong>Publish</strong>.
              </li>
              <li>
                Click <strong>Test Live Storage &amp; DB</strong> above to verify green WRITABLE status.
              </li>
            </ol>
            <pre className="p-3 rounded-lg bg-slate-900 text-slate-100 text-[11px] font-mono overflow-x-auto">
              {RECOMMENDED_STORAGE_RULES}
            </pre>
          </div>
        )}
      </section>

      {/* Export Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4">
          <div>
            <div className="w-10 h-10 rounded-lg bg-[#FFF5F0] text-[#F85606] flex items-center justify-center mb-3">
              <DatabaseBackup className="w-5 h-5" />
            </div>
            <h2 className="font-display text-base font-bold text-slate-900">Full JSON Backup</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Exports all products, categories, orders, customers, settings, banners, flash sales,
              coupons, discounts, and reviews.
            </p>
          </div>
          <button
            type="button"
            disabled={exporting}
            onClick={() => void handleFullJsonExport()}
            className="w-full h-10 bg-[#F85606] hover:bg-[#E04A00] text-white text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Download Full JSON</span>
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4">
          <div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h2 className="font-display text-base font-bold text-slate-900">Products CSV</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Exports your complete product catalog with SKU, pricing, inventory counts, status, and
              sales count.
            </p>
          </div>
          <button
            type="button"
            disabled={exporting}
            onClick={() => void handleExportProductsCsv()}
            className="w-full h-10 bg-white border border-slate-200 hover:border-[#F85606] text-slate-800 text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-[#F85606]" />
            <span>Export Products CSV</span>
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4">
          <div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h2 className="font-display text-base font-bold text-slate-900">Orders CSV</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Exports all customer orders, advance delivery fees, COD remainders, payment verification,
              and totals.
            </p>
          </div>
          <button
            type="button"
            disabled={exporting}
            onClick={() => void handleExportOrdersCsv()}
            className="w-full h-10 bg-white border border-slate-200 hover:border-[#F85606] text-slate-800 text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-[#F85606]" />
            <span>Export Orders CSV</span>
          </button>
        </div>
      </div>

      {/* Collection Counts Summary */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
          <Database className="w-4 h-4 text-[#F85606]" />
          <h2 className="font-display text-sm font-bold text-slate-900">
            Firestore Collection Health &amp; Live Record Counts
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Reading Firestore collections...</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-5">
            {Object.entries(collectionCounts).map(([colName, count]) => (
              <div
                key={colName}
                className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/70"
              >
                <p className="text-xs font-mono text-slate-500">{colName}</p>
                <p className="font-display text-xl font-bold text-slate-900 mt-1">{count}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
