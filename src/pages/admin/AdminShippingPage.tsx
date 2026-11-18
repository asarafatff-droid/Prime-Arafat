import React, { useEffect, useMemo, useState } from 'react';
import { CheckSquare, MapPin, Save, Search, ShieldCheck, Truck } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import { useToast } from '../../contexts/ToastContext';
import { BANGLADESH_DISTRICTS } from '../../lib/bangladeshLocations';
import {
  DEFAULT_SHIPPING_SETTINGS,
  fetchSetting,
  saveSetting,
} from '../../services/settingsService';
import type { ShippingSettingsData } from '../../types';

export function AdminShippingPage() {
  const { showToast } = useToast();
  const { websiteSettings } = useStore();
  const symbol = websiteSettings.currencySymbol || '৳';

  const [form, setForm] = useState<ShippingSettingsData>(DEFAULT_SHIPPING_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [areaSearch, setAreaSearch] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchSetting('shipping', DEFAULT_SHIPPING_SETTINGS);
        if (active) {
          setForm({
            ...DEFAULT_SHIPPING_SETTINGS,
            ...data,
            firstOrderAdvanceDelivery: data.firstOrderAdvanceDelivery ?? true,
            areaRates: data.areaRates || {},
            disabledAreas: data.disabledAreas || [],
          });
        }
      } catch (err) {
        if (active) {
          showToast(
            err instanceof Error ? err.message : 'Failed to load shipping settings.',
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

  const filteredDistricts = useMemo(() => {
    const q = areaSearch.trim().toLowerCase();
    if (!q) return BANGLADESH_DISTRICTS;
    return BANGLADESH_DISTRICTS.filter(
      (d) => d.name.toLowerCase().includes(q) || d.division.toLowerCase().includes(q)
    );
  }, [areaSearch]);

  const disabledSet = useMemo(
    () => new Set((form.disabledAreas || []).map((d) => d.toLowerCase())),
    [form.disabledAreas]
  );

  const toggleDistrictEnabled = (districtName: string) => {
    const current = form.disabledAreas || [];
    const exists = current.some((d) => d.toLowerCase() === districtName.toLowerCase());
    if (exists) {
      setForm((f) => ({
        ...f,
        disabledAreas: current.filter((d) => d.toLowerCase() !== districtName.toLowerCase()),
      }));
    } else {
      setForm((f) => ({
        ...f,
        disabledAreas: [...current, districtName],
      }));
    }
  };

  const setDistrictRate = (districtName: string, rate: string) => {
    setForm((f) => {
      const next = { ...(f.areaRates || {}) };
      if (rate.trim() === '') {
        delete next[districtName];
      } else {
        next[districtName] = Math.max(0, Number(rate) || 0);
      }
      return { ...f, areaRates: next };
    });
  };

  const enableAllDistricts = () => {
    setForm((f) => ({ ...f, disabledAreas: [] }));
  };

  const applyStandardBdRates = () => {
    setForm((f) => ({
      ...f,
      insideDhakaFee: 80,
      outsideDhakaFee: 120,
      defaultFee: 120,
      disabledAreas: [],
      estimatedDeliveryDays:
        '2-4 business days (Dhaka ৳80 · Tangail & Nationwide 64 Districts ৳120)',
    }));
    showToast(
      'Applied standard rates: Dhaka ৳80, Tangail & all other 63 districts ৳120. Click Save to publish.',
      'info'
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: ShippingSettingsData = {
        defaultFee: Math.max(0, Number(form.defaultFee) || 0),
        insideDhakaFee: Math.max(0, Number(form.insideDhakaFee) || 0),
        outsideDhakaFee: Math.max(0, Number(form.outsideDhakaFee) || 0),
        freeShippingThreshold: Math.max(0, Number(form.freeShippingThreshold) || 0),
        estimatedDeliveryDays: form.estimatedDeliveryDays.trim(),
        notes: form.notes.trim(),
        firstOrderAdvanceDelivery: form.firstOrderAdvanceDelivery ?? true,
        areaRates: form.areaRates || {},
        disabledAreas: form.disabledAreas || [],
      };
      await saveSetting('shipping', payload);
      setForm(payload);
      showToast('Nationwide Bangladesh shipping settings saved.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save shipping settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">
          Bangladesh Delivery &amp; Area Charge Settings
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Select home delivery coverage across all 64 Bangladesh districts (including Tangail &amp; Dhaka), set standard rates (Dhaka {symbol}80 / Outside Dhaka {symbol}120), and manage the First-Order Advance Delivery Fee policy.
        </p>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
          Loading shipping settings...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* First Order Advance Delivery Charge Policy */}
          <div className="bg-[#FFF5F0] border border-[#F85606]/30 rounded-xl p-5 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#F85606] shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-display text-sm font-bold text-slate-900">
                    First Order Advance Delivery Charge Policy
                  </h2>
                  <p className="text-xs text-slate-700 mt-0.5">
                    When enabled, a customer&apos;s <strong>1st order</strong> requires only the Delivery Charge paid in advance via bKash / Nagad / Rocket, and the remaining product total is Cash on Delivery. All subsequent orders (2nd+) allow full Cash on Delivery without advance!
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                  <input
                    type="checkbox"
                    checked={form.firstOrderAdvanceDelivery ?? true}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        firstOrderAdvanceDelivery: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 accent-[#F85606]"
                  />
                  <span className="text-xs font-semibold text-slate-900">
                    {form.firstOrderAdvanceDelivery ? 'Active (Recommended)' : 'Disabled'}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Standard Delivery Rates */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-[#FFF5F0] text-[#F85606] flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-display text-base font-bold text-slate-900">
                    Base Delivery Charges &amp; Timelines
                  </h2>
                  <p className="text-xs text-slate-500">
                    Standard Inside Dhaka ({symbol}80) and Tangail / Nationwide ({symbol}120) rates.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={applyStandardBdRates}
                className="px-3 py-1.5 bg-[#FFF5F0] hover:bg-[#FFE6D9] text-[#F85606] text-xs font-bold rounded-lg border border-[#F85606]/30"
              >
                Apply Standard BD Rates (Dhaka ৳80 · Outside &amp; Tangail ৳120)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Inside Dhaka Fee ({symbol})
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.insideDhakaFee}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, insideDhakaFee: Number(e.target.value) || 0 }))
                  }
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Outside Dhaka / Nationwide ({symbol})
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.outsideDhakaFee}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, outsideDhakaFee: Number(e.target.value) || 0 }))
                  }
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Default / Fallback Fee ({symbol})
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.defaultFee}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, defaultFee: Number(e.target.value) || 0 }))
                  }
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Free Shipping Threshold ({symbol})
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.freeShippingThreshold}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      freeShippingThreshold: Number(e.target.value) || 0,
                    }))
                  }
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estimated Delivery Timeframe
                </label>
                <input
                  type="text"
                  value={form.estimatedDeliveryDays}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, estimatedDeliveryDays: e.target.value }))
                  }
                  placeholder="e.g. 2-4 business days across Bangladesh"
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Delivery Policy Note
                </label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Courier / doorstep home delivery notes"
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          {/* All 64 Districts Selection & Custom Rates */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#F85606]" />
                <div>
                  <h2 className="font-display text-base font-bold text-slate-900">
                    All Bangladesh Home Delivery Areas (64 Districts)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Enable/disable any district and override its delivery charge ({symbol}) individually. Leave custom rate blank to use default Inside/Outside Dhaka fee.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={enableAllDistricts}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-[#F85606]" />
                  <span>Enable All 64 Districts</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={areaSearch}
                onChange={(e) => setAreaSearch(e.target.value)}
                placeholder="Search any Bangladesh district or division..."
                className="w-full h-9 pl-9 pr-3 border border-slate-200 rounded-lg text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
              {filteredDistricts.map((dist) => {
                const isEnabled = !disabledSet.has(dist.name.toLowerCase());
                const customVal = form.areaRates?.[dist.name];
                const fallbackFee =
                  dist.name === 'Dhaka' ? form.insideDhakaFee : form.outsideDhakaFee;
                return (
                  <div
                    key={dist.name}
                    className={`p-3 rounded-lg border flex items-center justify-between gap-2 ${
                      isEnabled
                        ? 'bg-white border-slate-200'
                        : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    <label className="flex items-center gap-2 min-w-0 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={() => toggleDistrictEnabled(dist.name)}
                        className="w-4 h-4 accent-[#F85606] shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {dist.name}
                        </p>
                        <p className="text-[10px] text-slate-400">{dist.division} Division</p>
                      </div>
                    </label>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[11px] text-slate-500">{symbol}</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        disabled={!isEnabled}
                        value={customVal !== undefined ? String(customVal) : ''}
                        onChange={(e) => setDistrictRate(dist.name, e.target.value)}
                        placeholder={String(fallbackFee)}
                        className="w-16 h-8 px-2 border border-slate-200 rounded text-xs font-mono text-right bg-white"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="h-11 px-6 bg-[#F85606] hover:bg-[#E04A00] text-white text-sm font-semibold rounded-lg inline-flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Delivery & Area Settings'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
