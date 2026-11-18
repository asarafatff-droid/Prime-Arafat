import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Search, X } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import {
  addSearchHistory,
  clearSearchHistory,
  getSearchHistory,
  removeSearchHistoryItem,
} from '../../lib/searchHistory';
import { Logo } from '../common/Logo';
import { HeaderQuickMenu } from './HeaderQuickMenu';

export function MobileHeader() {
  const navigate = useNavigate();
  const { websiteSettings } = useStore();
  const [queryText, setQueryText] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<string[]>(() => getSearchHistory());
  const boxRef = useRef<HTMLDivElement>(null);

  const primaryColor = websiteSettings.themePrimaryColor || '#F85606';

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setShowHistory(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const submitQuery = (text: string) => {
    const trimmed = text.trim();
    if (trimmed) {
      setHistory(addSearchHistory(trimmed));
    }
    setShowHistory(false);
    navigate(`/products?q=${encodeURIComponent(trimmed)}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    submitQuery(queryText);
  };

  return (
    <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
      {websiteSettings.announcementActive && websiteSettings.announcementBar && (
        <div
          className="text-white text-[11px] font-semibold py-1 px-3 text-center truncate"
          style={{ backgroundColor: primaryColor }}
        >
          {websiteSettings.announcementBar}
        </div>
      )}
      <div className="px-3 h-14 flex items-center gap-2.5">
        <Logo size="sm" />
        <div ref={boxRef} className="flex-1 min-w-0 relative">
          <form
            onSubmit={handleSearch}
            className="flex items-center h-10 rounded-xl border border-[#F85606]/70 bg-slate-50 focus-within:bg-white focus-within:border-[#F85606] transition-colors overflow-hidden"
          >
            <input
              type="search"
              value={queryText}
              onFocus={() => {
                setHistory(getSearchHistory());
                setShowHistory(true);
              }}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder={`Search ${websiteSettings.websiteName || 'AS World'}...`}
              className="flex-1 min-w-0 h-full pl-3 pr-1.5 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            {queryText && (
              <button
                type="button"
                onClick={() => setQueryText('')}
                aria-label="Clear search text"
                className="p-1.5 text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              aria-label="Search"
              className="h-8 px-2.5 mr-1 rounded-lg bg-[#F85606] text-white flex items-center justify-center shrink-0"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {showHistory && history.length > 0 && (
            <div className="absolute left-0 right-0 top-11 bg-white border border-slate-200 rounded-xl shadow-2xl p-3 z-50 space-y-2.5">
              <div className="flex items-center justify-between px-0.5">
                <span className="text-xs font-bold text-slate-600 inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#F85606]" />
                  <span>Recent Searches</span>
                </span>
                <button
                  type="button"
                  onClick={() => setHistory(clearSearchHistory())}
                  className="text-xs font-semibold text-red-600 hover:underline"
                >
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {history.map((term) => (
                  <div
                    key={term}
                    className="inline-flex items-center bg-slate-100 rounded-lg text-xs text-slate-800 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setQueryText(term);
                        submitQuery(term);
                      }}
                      className="pl-2.5 pr-1.5 py-1.5 hover:text-[#F85606] font-medium truncate max-w-[145px]"
                    >
                      {term}
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistory(removeSearchHistoryItem(term))}
                      aria-label={`Remove ${term}`}
                      className="pr-2 pl-1 py-1.5 text-slate-400 hover:text-red-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <HeaderQuickMenu compact />
      </div>
    </header>
  );
}
