const SEARCH_HISTORY_KEY = 'asw_search_history_v1';
const RECENTLY_VIEWED_KEY = 'asw_recently_viewed_v1';
const PENDING_REF_CODE_KEY = 'asw_pending_ref_code_v1';

export function getSearchHistory(): string[] {
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).slice(0, 12)
      : [];
  } catch {
    return [];
  }
}

export function addSearchHistory(query: string): string[] {
  const clean = query.trim();
  if (!clean) return getSearchHistory();
  const prev = getSearchHistory().filter(
    (item) => item.toLowerCase() !== clean.toLowerCase()
  );
  const next = [clean, ...prev].slice(0, 12);
  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
  } catch {
    // ignore storage quota
  }
  return next;
}

export function removeSearchHistoryItem(query: string): string[] {
  const next = getSearchHistory().filter(
    (item) => item.toLowerCase() !== query.trim().toLowerCase()
  );
  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}

export function clearSearchHistory(): string[] {
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch {
    // ignore
  }
  return [];
}

export function getRecentlyViewedIds(): string[] {
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).slice(0, 12)
      : [];
  } catch {
    return [];
  }
}

export function addRecentlyViewedId(productId: string): void {
  if (!productId) return;
  const prev = getRecentlyViewedIds().filter((id) => id !== productId);
  const next = [productId, ...prev].slice(0, 12);
  try {
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function savePendingReferralCode(code: string): void {
  const clean = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  if (!clean) return;
  try {
    localStorage.setItem(PENDING_REF_CODE_KEY, clean);
  } catch {
    // ignore
  }
}

export function getPendingReferralCode(): string {
  try {
    return (localStorage.getItem(PENDING_REF_CODE_KEY) || '').trim().toUpperCase();
  } catch {
    return '';
  }
}

export function clearPendingReferralCode(): void {
  try {
    localStorage.removeItem(PENDING_REF_CODE_KEY);
  } catch {
    // ignore
  }
}

export function buildWhatsAppUrl(rawPhone?: string, message?: string): string {
  const digits = (rawPhone || '').replace(/[^\d+]/g, '');
  if (!digits) return '';
  let normalized = digits.replace(/^\+/, '');
  if (normalized.startsWith('01') && normalized.length === 11) {
    normalized = `88${normalized}`;
  } else if (normalized.startsWith('0') && normalized.length >= 10) {
    normalized = `88${normalized}`;
  }
  const encodedMsg = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${normalized}${encodedMsg}`;
}
