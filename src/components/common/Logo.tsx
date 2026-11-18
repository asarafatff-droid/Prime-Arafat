import { Link } from 'react-router-dom';
import { useStore } from '../../contexts/StoreContext';

interface LogoProps {
  to?: string;
  size?: 'sm' | 'md' | 'lg';
  inverted?: boolean;
}

export function Logo({ to = '/', size = 'md', inverted = false }: LogoProps) {
  const { websiteSettings } = useStore();
  const siteName = websiteSettings.websiteName || 'AS World';
  const primaryColor = websiteSettings.themePrimaryColor || '#F85606';

  const heightClass = size === 'sm' ? 'h-7' : size === 'lg' ? 'h-11' : 'h-9';
  const squareSizeClass =
    size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-11 h-11 text-base' : 'w-9 h-9 text-sm';
  const textClass =
    size === 'sm'
      ? 'text-base font-extrabold tracking-tight'
      : size === 'lg'
      ? 'text-2xl font-extrabold tracking-tight'
      : 'text-xl font-extrabold tracking-tight';

  const shortInitials = siteName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('') || 'AS';

  return (
    <Link to={to} className="inline-flex items-center gap-2 whitespace-nowrap shrink-0">
      {/* Dedicated Square 1:1 App Logo / Profile Mark */}
      {websiteSettings.squareLogoUrl ? (
        <img
          src={websiteSettings.squareLogoUrl}
          alt={`${siteName} App Icon`}
          referrerPolicy="no-referrer"
          className={`${squareSizeClass} rounded-xl object-cover border border-slate-200/80 shadow-xs shrink-0`}
        />
      ) : !websiteSettings.logoUrl ? (
        <span
          className={`${squareSizeClass} rounded-xl font-display font-black text-white flex items-center justify-center shadow-xs shrink-0`}
          style={{ backgroundColor: primaryColor }}
        >
          {shortInitials}
        </span>
      ) : null}

      {/* Official Storefront Wordmark / Wide Logo or Site Title */}
      {websiteSettings.logoUrl ? (
        <img
          src={websiteSettings.logoUrl}
          alt={siteName}
          referrerPolicy="no-referrer"
          className={`${heightClass} w-auto max-w-[160px] object-contain`}
        />
      ) : (
        <span
          className={`font-display ${textClass} ${
            inverted ? 'text-white' : 'text-slate-900'
          }`}
        >
          {siteName.startsWith('AS ') ? (
            <>
              <span style={{ color: inverted ? '#FFFFFF' : primaryColor }}>AS</span>{' '}
              <span>{siteName.slice(3)}</span>
            </>
          ) : (
            siteName
          )}
        </span>
      )}
    </Link>
  );
}
