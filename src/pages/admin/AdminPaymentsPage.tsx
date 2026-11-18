import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CreditCard,
  Plus,
  Power,
  Save,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import { useToast } from '../../contexts/ToastContext';
import { generateId } from '../../lib/utils';
import {
  DEFAULT_PAYMENT_SETTINGS,
  fetchSetting,
  saveSetting,
} from '../../services/settingsService';
import type { PaymentMethodConfig, PaymentWalletAccount } from '../../types';

function normalizeMethodAccounts(method: PaymentMethodConfig): PaymentWalletAccount[] {
  if (Array.isArray(method.accounts) && method.accounts.length > 0) {
    return method.accounts;
  }
  if (method.accountNumber?.trim()) {
    return [
      {
        id: generateId('wal'),
        label: `${method.label} #1`,
        accountNumber: method.accountNumber.trim(),
        accountName: method.accountName?.trim() || '',
        accountType:
          (method.accountType as PaymentWalletAccount['accountType']) ||
          (method.id === 'bank' ? 'Bank' : 'Personal'),
        sendMoneyOnly: method.sendMoneyOnly ?? (method.id !== 'cod' && method.id !== 'bank'),
        active: true,
      },
    ];
  }
  return [];
}

export function AdminPaymentsPage() {
  const { showToast } = useToast();
  const { paymentSettings } = useStore();

  const [methods, setMethods] = useState<PaymentMethodConfig[]>(DEFAULT_PAYMENT_SETTINGS.methods);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchSetting('payments', DEFAULT_PAYMENT_SETTINGS);
        if (active && Array.isArray(data.methods) && data.methods.length > 0) {
          setMethods(
            data.methods.map((m) => ({
              ...m,
              accounts: m.id === 'cod' ? [] : normalizeMethodAccounts(m),
            }))
          );
        }
      } catch (err) {
        if (active) {
          showToast(
            err instanceof Error ? err.message : 'Failed to load payment settings.',
            'error'
          );
          if (paymentSettings.methods?.length) {
            setMethods(paymentSettings.methods);
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const updateMethod = (
    id: PaymentMethodConfig['id'],
    patch: Partial<PaymentMethodConfig>
  ) => {
    setMethods((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  };

  const addWalletNumber = (method: PaymentMethodConfig) => {
    const existing = method.accounts || [];
    const nextAccount: PaymentWalletAccount = {
      id: generateId('wal'),
      label: `${method.label} #${existing.length + 1}`,
      accountNumber: '',
      accountName: '',
      accountType: method.id === 'bank' ? 'Bank' : 'Personal',
      sendMoneyOnly: method.id !== 'bank',
      active: true,
    };
    updateMethod(method.id, { accounts: [...existing, nextAccount] });
  };

  const updateWalletAccount = (
    methodId: PaymentMethodConfig['id'],
    accountId: string,
    patch: Partial<PaymentWalletAccount>
  ) => {
    setMethods((prev) =>
      prev.map((m) => {
        if (m.id !== methodId) return m;
        return {
          ...m,
          accounts: (m.accounts || []).map((a) => (a.id === accountId ? { ...a, ...patch } : a)),
        };
      })
    );
  };

  const removeWalletAccount = (methodId: PaymentMethodConfig['id'], accountId: string) => {
    setMethods((prev) =>
      prev.map((m) => {
        if (m.id !== methodId) return m;
        return {
          ...m,
          accounts: (m.accounts || []).filter((a) => a.id !== accountId),
        };
      })
    );
  };

  const handleToggleEnabled = (method: PaymentMethodConfig, nextEnabled: boolean) => {
    const hasActiveNumber = (method.accounts || []).some(
      (a) => a.active && a.accountNumber.trim()
    );
    if (
      nextEnabled &&
      method.id !== 'cod' &&
      !hasActiveNumber &&
      !method.accountNumber.trim() &&
      !method.instructions.trim()
    ) {
      showToast(
        `Please add at least one active ${method.label} wallet number or instructions before enabling it.`,
        'error'
      );
      return;
    }
    updateMethod(method.id, { enabled: nextEnabled });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    for (const method of methods) {
      const activeAccount = (method.accounts || []).find(
        (a) => a.active && a.accountNumber.trim()
      );
      if (
        method.enabled &&
        method.id !== 'cod' &&
        !activeAccount &&
        !method.accountNumber.trim() &&
        !method.instructions.trim()
      ) {
        showToast(
          `${method.label} cannot be enabled without at least one active account number or instructions.`,
          'error'
        );
        return;
      }
    }

    setSaving(true);
    try {
      const sanitized = methods.map((m) => {
        const cleanedAccounts = (m.accounts || [])
          .filter((a) => a.accountNumber.trim() || a.label.trim())
          .map((a) => ({
            ...a,
            label: a.label.trim() || m.label,
            accountNumber: a.accountNumber.trim(),
            accountName: a.accountName.trim(),
            note: a.note?.trim() || '',
          }));
        const primary =
          cleanedAccounts.find((a) => a.active && a.accountNumber) || cleanedAccounts[0];
        return {
          ...m,
          label: m.label.trim() || m.id.toUpperCase(),
          accounts: cleanedAccounts,
          accountNumber: primary ? primary.accountNumber : m.accountNumber.trim(),
          accountName: primary ? primary.accountName : m.accountName.trim(),
          accountType: primary ? primary.accountType : m.accountType.trim(),
          sendMoneyOnly: primary ? primary.sendMoneyOnly : Boolean(m.sendMoneyOnly),
          instructions: m.instructions.trim(),
        };
      });
      await saveSetting('payments', { methods: sanitized });
      setMethods(sanitized);
      showToast('Payment methods & multi-wallet numbers saved!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save payment settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">
          Payment Methods &amp; Multi-Number Manager
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Add unlimited bKash, Nagad, Rocket, or Bank numbers. Turn individual numbers Live or Off
          anytime, and enforce &ldquo;Only Send Money (No Cash Out)&rdquo;.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-900">
        <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <p>
          You can add multiple numbers per wallet (e.g. Personal #1, Personal #2), switch any number{' '}
          <strong>Live / Hidden</strong> instantaneously, or delete old numbers. Check{' '}
          <strong>Only Send Money</strong> so customers see a clear warning not to Cash Out.
        </p>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
          Loading payment configuration...
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {methods.map((method) => {
              const wallets = method.accounts || [];
              return (
                <div
                  key={method.id}
                  className={`bg-white border rounded-xl p-5 space-y-4 transition-colors ${
                    method.enabled
                      ? 'border-[#F85606]/50 ring-1 ring-[#F85606]/10'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                          method.enabled
                            ? 'bg-[#FFF5F0] text-[#F85606]'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-display text-sm font-bold text-slate-900">
                          {method.label}
                        </p>
                        <p className="text-[11px] font-mono uppercase text-slate-400">
                          {method.id}
                          {method.id !== 'cod'
                            ? ` · ${wallets.filter((w) => w.active).length} Live / ${wallets.length} Total`
                            : ''}
                        </p>
                      </div>
                    </div>

                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={method.enabled}
                        onChange={(e) => handleToggleEnabled(method, e.target.checked)}
                        className="w-4 h-4 accent-[#F85606]"
                      />
                      <span
                        className={`text-xs font-semibold ${
                          method.enabled ? 'text-emerald-700' : 'text-slate-500'
                        }`}
                      >
                        {method.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Display Label
                    </label>
                    <input
                      type="text"
                      required
                      value={method.label}
                      onChange={(e) => updateMethod(method.id, { label: e.target.value })}
                      className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>

                  {method.id !== 'cod' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 uppercase">
                          Wallet Numbers ({wallets.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => addWalletNumber(method)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#FFF5F0] hover:bg-[#FFE6D9] text-[#F85606] text-xs font-bold rounded-lg"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Number</span>
                        </button>
                      </div>

                      {wallets.length === 0 ? (
                        <div className="p-4 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-500">
                          No wallet numbers added yet. Click &ldquo;+ Add Number&rdquo; above to add
                          one or more numbers.
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {wallets.map((acc) => (
                            <div
                              key={acc.id}
                              className={`p-3 rounded-xl border space-y-2.5 ${
                                acc.active
                                  ? 'bg-slate-50/70 border-slate-200'
                                  : 'bg-slate-100/60 border-slate-200 opacity-65'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <input
                                  type="text"
                                  value={acc.label}
                                  onChange={(e) =>
                                    updateWalletAccount(method.id, acc.id, {
                                      label: e.target.value,
                                    })
                                  }
                                  placeholder="Label e.g. Personal #1"
                                  className="h-7 px-2 border border-slate-200 rounded text-xs font-semibold bg-white w-36"
                                />
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateWalletAccount(method.id, acc.id, {
                                        active: !acc.active,
                                      })
                                    }
                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-bold ${
                                      acc.active
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-slate-200 text-slate-600'
                                    }`}
                                  >
                                    <Power className="w-3 h-3" />
                                    <span>{acc.active ? 'Live' : 'Hidden'}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeWalletAccount(method.id, acc.id)}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                    title="Delete number"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <input
                                  type="text"
                                  value={acc.accountNumber}
                                  onChange={(e) =>
                                    updateWalletAccount(method.id, acc.id, {
                                      accountNumber: e.target.value,
                                    })
                                  }
                                  placeholder="01XXXXXXXXX"
                                  className="sm:col-span-2 h-8 px-2.5 border border-slate-200 rounded-lg text-xs font-mono bg-white"
                                />
                                <select
                                  value={acc.accountType}
                                  onChange={(e) =>
                                    updateWalletAccount(method.id, acc.id, {
                                      accountType: e.target.value as PaymentWalletAccount['accountType'],
                                    })
                                  }
                                  className="h-8 px-2 border border-slate-200 rounded-lg text-xs bg-white"
                                >
                                  <option value="Personal">Personal</option>
                                  <option value="Agent">Agent</option>
                                  <option value="Merchant">Merchant</option>
                                  <option value="Bank">Bank</option>
                                </select>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
                                <input
                                  type="text"
                                  value={acc.accountName}
                                  onChange={(e) =>
                                    updateWalletAccount(method.id, acc.id, {
                                      accountName: e.target.value,
                                    })
                                  }
                                  placeholder="Holder / Business Name (Optional)"
                                  className="h-8 px-2.5 border border-slate-200 rounded-lg text-xs bg-white"
                                />
                                <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-red-700 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={acc.sendMoneyOnly}
                                    onChange={(e) =>
                                      updateWalletAccount(method.id, acc.id, {
                                        sendMoneyOnly: e.target.checked,
                                      })
                                    }
                                    className="accent-red-600"
                                  />
                                  <AlertTriangle className="w-3 h-3 shrink-0" />
                                  <span>Only Send Money (No Cash Out)</span>
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Customer Checkout Instructions
                    </label>
                    <textarea
                      rows={2}
                      value={method.instructions}
                      onChange={(e) => updateMethod(method.id, { instructions: e.target.value })}
                      placeholder={
                        method.id === 'cod'
                          ? 'e.g. Pay in cash upon receiving your parcel.'
                          : 'e.g. Only Send Money is accepted. Do NOT Cash Out.'
                      }
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>

                  {method.id !== 'cod' && (
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={method.requiresTransactionId}
                        onChange={(e) =>
                          updateMethod(method.id, { requiresTransactionId: e.target.checked })
                        }
                      />
                      <span>Require customer Transaction ID &amp; sender number at checkout</span>
                    </label>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="h-11 px-6 bg-[#F85606] hover:bg-[#E04A00] text-white text-sm font-semibold rounded-lg inline-flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Payment Settings'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
