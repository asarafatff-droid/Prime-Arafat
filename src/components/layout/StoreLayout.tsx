import React, { useEffect, useState } from 'react';
import { ArrowUp, Wrench } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useStore } from '../../contexts/StoreContext';
import { DesktopHeader } from './DesktopHeader';
import { Footer } from './Footer';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileHeader } from './MobileHeader';

export function StoreLayout({ children }: { children: React.ReactNode }) {
  const { websiteSettings, firebaseReady } = useStore();
  const { isAdmin } = useAuth();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 450);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!firebaseReady) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white border border-slate-200 rounded-xl p-8">
          <h1 className="font-display text-2xl font-bold text-slate-900 mb-2">
            AS World — Firebase Setup Required
          </h1>
          <p className="text-sm text-slate-600 mb-4 leading-relaxed">
            Firebase configuration in <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">firebase-applet-config.json</code> is missing or incomplete. Please configure your Firebase project before using the marketplace.
          </p>
        </div>
      </div>
    );
  }

  if (websiteSettings.maintenanceMode && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-[#FFF5F0] text-[#F85606] flex items-center justify-center mx-auto mb-4">
            <Wrench className="w-6 h-6" />
          </div>
          <h1 className="font-display text-xl font-bold text-slate-900 mb-2">
            {websiteSettings.websiteName || 'AS World'} is Under Maintenance
          </h1>
          <p className="text-sm text-slate-600">
            We are currently performing scheduled updates. Please check back shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F5]">
      <DesktopHeader />
      <MobileHeader />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <Footer />
      <MobileBottomNav />

      {showScrollTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Scroll back to top"
          className="fixed bottom-20 md:bottom-6 right-4 z-30 w-10 h-10 rounded-full bg-white/95 backdrop-blur-xs border border-slate-200 text-slate-700 hover:text-[#F85606] hover:border-[#F85606] shadow-lg flex items-center justify-center transition-all"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
