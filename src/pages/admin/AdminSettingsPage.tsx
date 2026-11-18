import React, { useEffect, useState } from 'react';
import { Image as ImageIcon, Mail, Save, Settings, Trash2 } from 'lucide-react';
import { CloudImageUploader } from '../../components/admin/CloudImageUploader';
import { useToast } from '../../contexts/ToastContext';
import { formatDateTime } from '../../lib/utils';
import {
  DEFAULT_WEBSITE_SETTINGS,
  fetchSetting,
  saveSetting,
} from '../../services/settingsService';
import { listContactMessages, updateContactMessageStatus } from '../../services/userService';
import type { ContactMessage, WebsiteSettingsData } from '../../types';

export function AdminSettingsPage({
  defaultTab = 'website',
}: {
  defaultTab?: 'website' | 'logo';
}) {
  const { showToast } = useToast();

  const [tab, setTab] = useState<'website' | 'logo' | 'messages'>(defaultTab);
  const [form, setForm] = useState<WebsiteSettingsData>(DEFAULT_WEBSITE_SETTINGS);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const [ws, msgs] = await Promise.all([
          fetchSetting('website', DEFAULT_WEBSITE_SETTINGS),
          listContactMessages(),
        ]);
        if (!active) return;
        setForm(ws);
        setMessages(msgs);
      } catch (err) {
        if (active) {
          showToast(
            err instanceof Error ? err.message : 'Failed to load website settings.',
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

  const persistWebsiteSettings = async (next: WebsiteSettingsData, toastMsg: string) => {
    setSaving(true);
    try {
      await saveSetting('website', next);
      setForm(next);
      showToast(toastMsg, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    await persistWebsiteSettings(
      {
        ...form,
        websiteName: form.websiteName.trim() || 'AS World',
        currencyCode: form.currencyCode.trim().toUpperCase() || 'BDT',
        currencySymbol: form.currencySymbol.trim() || '৳',
      },
      'Website settings saved.'
    );
  };

  const handleMessageStatus = async (
    id: string,
    status: 'new' | 'read' | 'resolved'
  ) => {
    try {
      await updateContactMessageStatus(id, status);
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
      showToast(`Message marked as ${status}.`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update message.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            {tab === 'logo'
              ? 'Logo Management'
              : tab === 'messages'
              ? 'Customer Contact Messages'
              : 'Website Settings'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage AS World branding, official logo, policies, contact info, and inbox messages.
          </p>
        </div>

        <div className="inline-flex p-1 bg-slate-200/70 rounded-lg">
          <button
            type="button"
            onClick={() => setTab('website')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md inline-flex items-center gap-1.5 ${
              tab === 'website' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Website Settings</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('logo')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md inline-flex items-center gap-1.5 ${
              tab === 'logo' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Logo & Favicon</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('messages')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md inline-flex items-center gap-1.5 ${
              tab === 'messages' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Messages ({messages.length})</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
          Loading website configuration...
        </div>
      ) : tab === 'logo' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Square App Logo (1:1) */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">
                Square App Logo (1:1)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Rounded square app icon &amp; brand profile picture displayed beside the header title and mobile top bar.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-4 min-h-[110px]">
              {form.squareLogoUrl ? (
                <img
                  src={form.squareLogoUrl}
                  alt="Square App Logo"
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-2xl object-cover bg-white border border-slate-200 shadow-xs"
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-2xl font-display font-black text-white text-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: form.themePrimaryColor || '#F85606' }}
                >
                  AS
                </div>
              )}
              <div className="text-xs text-slate-600">
                <p className="font-semibold text-slate-800">
                  {form.squareLogoUrl ? 'Square App Logo Active' : 'Default AS Badge Active'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Recommended 1:1 square image
                </p>
              </div>
            </div>

            <CloudImageUploader
              folder="branding"
              label="Upload Square App Logo (1:1)"
              acceptIco
              onUploaded={(urls) => {
                const url = urls[0] || '';
                if (url) {
                  void persistWebsiteSettings(
                    { ...form, squareLogoUrl: url },
                    'Square App Logo updated permanently.'
                  );
                }
              }}
            />

            {form.squareLogoUrl && (
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  void persistWebsiteSettings(
                    { ...form, squareLogoUrl: '' },
                    'Square App Logo removed.'
                  )
                }
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:underline"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Square Logo</span>
              </button>
            )}
          </div>

          {/* Official Storefront Logo */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">
                Official AS World Logo
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload your official transparent PNG, SVG, or WebP logo. Appears in desktop header, mobile header, and footer.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col items-center justify-center min-h-[110px]">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Light Header
                </span>
                {form.logoUrl ? (
                  <img
                    src={form.logoUrl}
                    alt="AS World Logo Preview"
                    referrerPolicy="no-referrer"
                    className="max-h-12 object-contain"
                  />
                ) : (
                  <span className="text-xs text-slate-400">No logo uploaded</span>
                )}
              </div>

              <div className="p-4 rounded-xl bg-slate-900 flex flex-col items-center justify-center min-h-[110px]">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Dark Footer
                </span>
                {form.logoUrl ? (
                  <img
                    src={form.logoUrl}
                    alt="AS World Logo Dark Preview"
                    referrerPolicy="no-referrer"
                    className="max-h-12 object-contain"
                  />
                ) : (
                  <span className="text-xs text-slate-500">No logo uploaded</span>
                )}
              </div>
            </div>

            <CloudImageUploader
              folder="branding"
              label="Upload Official Logo"
              acceptIco
              onUploaded={(urls) => {
                const url = urls[0] || '';
                if (url) {
                  void persistWebsiteSettings({ ...form, logoUrl: url }, 'Official logo updated.');
                }
              }}
            />

            {form.logoUrl && (
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  void persistWebsiteSettings({ ...form, logoUrl: '' }, 'Logo removed.')
                }
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:underline"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Official Logo</span>
              </button>
            )}
          </div>

          {/* Browser Favicon */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">
                Browser Favicon
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload a square 64×64 or 128×128 PNG/SVG/ICO icon displayed in browser tabs.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-4 min-h-[110px]">
              {form.faviconUrl ? (
                <img
                  src={form.faviconUrl}
                  alt="Favicon preview"
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-lg object-contain bg-white border border-slate-200 p-1"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xs text-slate-400">
                  —
                </div>
              )}
              <div className="text-xs text-slate-600">
                {form.faviconUrl ? 'Custom favicon active' : 'Uses square logo or default'}
              </div>
            </div>

            <CloudImageUploader
              folder="branding"
              label="Upload Favicon"
              acceptIco
              onUploaded={(urls) => {
                const url = urls[0] || '';
                if (url) {
                  void persistWebsiteSettings({ ...form, faviconUrl: url }, 'Favicon updated.');
                }
              }}
            />

            {form.faviconUrl && (
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  void persistWebsiteSettings({ ...form, faviconUrl: '' }, 'Favicon removed.')
                }
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:underline"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Favicon</span>
              </button>
            )}
          </div>
        </div>
      ) : tab === 'messages' ? (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {messages.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <Mail className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm text-slate-500">No contact messages received yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className="p-5 flex flex-col md:flex-row md:items-start justify-between gap-4"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{msg.subject}</span>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded capitalize ${
                          msg.status === 'resolved'
                            ? 'bg-emerald-50 text-emerald-700'
                            : msg.status === 'read'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {msg.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      From <strong>{msg.name}</strong> ({msg.email}
                      {msg.phone ? ` · ${msg.phone}` : ''}) · {formatDateTime(msg.createdAt)}
                    </p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap pt-1">{msg.message}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={msg.status}
                      onChange={(e) =>
                        void handleMessageStatus(
                          msg.id,
                          e.target.value as 'new' | 'read' | 'resolved'
                        )
                      }
                      className="h-8 px-2.5 border border-slate-200 rounded-lg text-xs bg-white font-medium"
                    >
                      <option value="new">New</option>
                      <option value="read">Read</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSaveWebsite} className="space-y-6">
          {/* General & Storefront Controls */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h2 className="font-display text-base font-bold text-slate-900">
              General Marketplace Configuration
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Website Name
                </label>
                <input
                  type="text"
                  required
                  value={form.websiteName}
                  onChange={(e) => setForm((f) => ({ ...f, websiteName: e.target.value }))}
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Currency Code
                </label>
                <input
                  type="text"
                  value={form.currencyCode}
                  onChange={(e) => setForm((f) => ({ ...f, currencyCode: e.target.value }))}
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-mono uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Currency Symbol
                </label>
                <input
                  type="text"
                  value={form.currencySymbol}
                  onChange={(e) => setForm((f) => ({ ...f, currencySymbol: e.target.value }))}
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Announcement Bar Text
                </label>
                <input
                  type="text"
                  value={form.announcementBar}
                  onChange={(e) => setForm((f) => ({ ...f, announcementBar: e.target.value }))}
                  placeholder="Optional top announcement text"
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div className="flex flex-wrap items-center gap-6 pt-5">
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.announcementActive}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, announcementActive: e.target.checked }))
                    }
                  />
                  <span>Show Announcement Bar</span>
                </label>
                <label className="flex items-center gap-2 text-sm text-red-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.maintenanceMode}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, maintenanceMode: e.target.checked }))
                    }
                  />
                  <span>Maintenance Mode</span>
                </label>
              </div>
            </div>
          </div>

          {/* Support & Social Links */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h2 className="font-display text-base font-bold text-slate-900">
              Contact & Social Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Support Email
                </label>
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Support Phone
                </label>
                <input
                  type="text"
                  value={form.supportPhone}
                  onChange={(e) => setForm((f) => ({ ...f, supportPhone: e.target.value }))}
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  WhatsApp Number (Order &amp; Chat)
                </label>
                <input
                  type="text"
                  value={form.whatsappNumber || ''}
                  onChange={(e) => setForm((f) => ({ ...f, whatsappNumber: e.target.value }))}
                  placeholder="01XXXXXXXXX or +8801..."
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Office / Business Address
                </label>
                <input
                  type="text"
                  value={form.supportAddress}
                  onChange={(e) => setForm((f) => ({ ...f, supportAddress: e.target.value }))}
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Facebook URL
                </label>
                <input
                  type="url"
                  value={form.facebookUrl}
                  onChange={(e) => setForm((f) => ({ ...f, facebookUrl: e.target.value }))}
                  placeholder="https://facebook.com/..."
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Instagram URL
                </label>
                <input
                  type="url"
                  value={form.instagramUrl}
                  onChange={(e) => setForm((f) => ({ ...f, instagramUrl: e.target.value }))}
                  placeholder="https://instagram.com/..."
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  YouTube URL
                </label>
                <input
                  type="url"
                  value={form.youtubeUrl}
                  onChange={(e) => setForm((f) => ({ ...f, youtubeUrl: e.target.value }))}
                  placeholder="https://youtube.com/..."
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Footer Description / Copyright Note
              </label>
              <input
                type="text"
                value={form.footerText}
                onChange={(e) => setForm((f) => ({ ...f, footerText: e.target.value }))}
                className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>

          {/* CMS Policies */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h2 className="font-display text-base font-bold text-slate-900">
              CMS Pages & Policies
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">About Us</label>
                <textarea
                  rows={4}
                  value={form.aboutUs}
                  onChange={(e) => setForm((f) => ({ ...f, aboutUs: e.target.value }))}
                  className="w-full p-3 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Privacy Policy
                </label>
                <textarea
                  rows={4}
                  value={form.privacyPolicy}
                  onChange={(e) => setForm((f) => ({ ...f, privacyPolicy: e.target.value }))}
                  className="w-full p-3 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Terms & Conditions
                </label>
                <textarea
                  rows={4}
                  value={form.termsConditions}
                  onChange={(e) => setForm((f) => ({ ...f, termsConditions: e.target.value }))}
                  className="w-full p-3 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Return & Refund Policy
                </label>
                <textarea
                  rows={4}
                  value={form.returnPolicy}
                  onChange={(e) => setForm((f) => ({ ...f, returnPolicy: e.target.value }))}
                  className="w-full p-3 border border-slate-200 rounded-lg text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Delivery Policy
              </label>
              <textarea
                rows={3}
                value={form.deliveryPolicy}
                onChange={(e) => setForm((f) => ({ ...f, deliveryPolicy: e.target.value }))}
                className="w-full p-3 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="h-11 px-6 bg-[#F85606] hover:bg-[#E04A00] text-white text-sm font-semibold rounded-lg inline-flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Website Settings'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
