import React, { useState } from 'react';
import { Mail, MapPin, MessageCircle, Phone, Send } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useStore } from '../../contexts/StoreContext';
import { useToast } from '../../contexts/ToastContext';
import { buildWhatsAppUrl } from '../../lib/searchHistory';
import { submitContactMessage } from '../../services/userService';

export function ContactPage() {
  const { user, customerProfile } = useAuth();
  const { websiteSettings } = useStore();
  const { showToast } = useToast();

  const [name, setName] = useState(customerProfile?.name || user?.displayName || '');
  const [email, setEmail] = useState(customerProfile?.email || user?.email || '');
  const [phone, setPhone] = useState(customerProfile?.phone || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitContactMessage({
        name,
        email,
        phone,
        subject,
        message,
        userId: user?.uid,
      });
      showToast('Your message has been sent to customer support.', 'success');
      setSubject('');
      setMessage('');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to send message.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-3 md:px-6 py-8 grid grid-cols-1 md:grid-cols-12 gap-6">
      <div className="md:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-5 h-fit">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Contact Us</h1>
          <p className="text-sm text-slate-500 mt-1">
            Reach out to {websiteSettings.websiteName || 'AS World'} customer support.
          </p>
        </div>

        <div className="space-y-4 text-sm">
          {websiteSettings.contactEmail && (
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-[#F85606] mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Email</p>
                <p className="font-medium text-slate-900">{websiteSettings.contactEmail}</p>
              </div>
            </div>
          )}
          {websiteSettings.supportPhone && (
            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-[#F85606] mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Phone</p>
                <p className="font-medium text-slate-900">{websiteSettings.supportPhone}</p>
              </div>
            </div>
          )}
          {websiteSettings.supportAddress && (
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-[#F85606] mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Address</p>
                <p className="font-medium text-slate-900">{websiteSettings.supportAddress}</p>
              </div>
            </div>
          )}
          {websiteSettings.whatsappNumber && (
            <a
              href={buildWhatsAppUrl(
                websiteSettings.whatsappNumber,
                `Hello ${websiteSettings.websiteName || 'AS World'} Support!`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors"
            >
              <MessageCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-900">WhatsApp Live Support</p>
                <p className="text-xs text-emerald-700 font-medium">
                  Chat directly on {websiteSettings.whatsappNumber}
                </p>
              </div>
            </a>
          )}
          {!websiteSettings.contactEmail &&
            !websiteSettings.supportPhone &&
            !websiteSettings.supportAddress &&
            !websiteSettings.whatsappNumber && (
              <p className="text-xs text-slate-500">
                Contact details can be configured by the administrator in Website Settings.
              </p>
            )}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="md:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4"
      >
        <h2 className="font-display text-lg font-bold text-slate-900">Send a Message</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Your Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#F85606]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#F85606]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Phone (optional)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#F85606]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subject *</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#F85606]"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Message *</label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#F85606]"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F85606] hover:bg-[#E04A00] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          <span>{submitting ? 'Sending...' : 'Send Message'}</span>
        </button>
      </form>
    </div>
  );
}
