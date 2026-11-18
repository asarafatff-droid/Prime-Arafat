import { Link } from 'react-router-dom';
import { useStore } from '../../contexts/StoreContext';
import { buildWhatsAppUrl } from '../../lib/searchHistory';
import { Logo } from '../common/Logo';

export function Footer() {
  const { websiteSettings, paymentSettings } = useStore();
  const siteName = websiteSettings.websiteName || 'AS World';
  const enabledPayments = paymentSettings.methods.filter((m) => m.enabled);
  const whatsappUrl = buildWhatsAppUrl(
    websiteSettings.whatsappNumber,
    `Hello ${siteName}, I need assistance with my order.`
  );

  return (
    <footer className="bg-slate-900 text-slate-300 mt-12 pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <Logo size="md" inverted />
          <p className="mt-3 text-sm text-slate-400 leading-relaxed">
            {websiteSettings.footerText ||
              `${siteName} online marketplace. Configure store details from the administrator settings panel.`}
          </p>
          {(websiteSettings.contactEmail ||
            websiteSettings.supportPhone ||
            websiteSettings.whatsappNumber ||
            websiteSettings.supportAddress) && (
            <div className="mt-4 space-y-1 text-xs text-slate-400">
              {websiteSettings.contactEmail && <p>Email: {websiteSettings.contactEmail}</p>}
              {websiteSettings.supportPhone && <p>Phone: {websiteSettings.supportPhone}</p>}
              {whatsappUrl && (
                <p>
                  WhatsApp:{' '}
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:underline font-medium"
                  >
                    {websiteSettings.whatsappNumber} (Chat Now)
                  </a>
                </p>
              )}
              {websiteSettings.supportAddress && <p>{websiteSettings.supportAddress}</p>}
            </div>
          )}
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold text-white mb-3">Customer Care</h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li>
              <Link to="/track-order" className="hover:text-white transition-colors">
                Track My Order
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-white transition-colors">
                Contact Us
              </Link>
            </li>
            <li>
              <Link to="/returns" className="hover:text-white transition-colors">
                Return & Refund Policy
              </Link>
            </li>
            <li>
              <Link to="/account" className="hover:text-white transition-colors">
                My Profile
              </Link>
            </li>
            <li>
              <Link to="/settings" className="hover:text-white transition-colors">
                Settings
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold text-white mb-3">{siteName}</h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li>
              <Link to="/about" className="hover:text-white transition-colors">
                About Us
              </Link>
            </li>
            <li>
              <Link to="/coins-games" className="hover:text-white transition-colors">
                Play &amp; Earn AS Coins
              </Link>
            </li>
            <li>
              <Link to="/coins-games?tab=refer" className="hover:text-white transition-colors">
                Share &amp; Refer (10% Commission)
              </Link>
            </li>
            <li>
              <Link to="/vouchers" className="hover:text-white transition-colors">
                Vouchers
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/terms" className="hover:text-white transition-colors">
                Terms & Conditions
              </Link>
            </li>
            <li>
              <Link to="/admin/login" className="text-[#F85606] hover:text-white transition-colors font-semibold">
                Admin Panel
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold text-white mb-3">Payment & Connect</h4>
          {enabledPayments.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-4">
              {enabledPayments.map((m) => (
                <span
                  key={m.id}
                  className="text-xs px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200"
                >
                  {m.label}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 mb-4">
              Payment methods will appear once configured by the administrator.
            </p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:text-emerald-300 underline font-semibold"
              >
                WhatsApp Support
              </a>
            )}
            {websiteSettings.facebookUrl && (
              <a
                href={websiteSettings.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-300 hover:text-white underline"
              >
                Facebook
              </a>
            )}
            {websiteSettings.instagramUrl && (
              <a
                href={websiteSettings.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-300 hover:text-white underline"
              >
                Instagram
              </a>
            )}
            {websiteSettings.youtubeUrl && (
              <a
                href={websiteSettings.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-300 hover:text-white underline"
              >
                YouTube
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            &copy; {new Date().getFullYear()} {siteName}. All rights reserved.
          </span>
          <span>Currency: {websiteSettings.currencyCode || 'BDT'} ({websiteSettings.currencySymbol || '৳'})</span>
        </div>
      </div>
    </footer>
  );
}
