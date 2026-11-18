import React from 'react';
import { Link } from 'react-router-dom';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  actionTo,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-8 md:p-12 text-center flex flex-col items-center justify-center">
      <div className="w-12 h-12 rounded-full bg-[#FFF5F0] text-[#F85606] flex items-center justify-center mb-4">
        {icon || <Inbox className="w-6 h-6" />}
      </div>
      <h3 className="font-display text-base md:text-lg font-semibold text-slate-900 mb-1.5">
        {title}
      </h3>
      {description && <p className="text-sm text-slate-500 max-w-md mb-5">{description}</p>}
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="inline-flex items-center justify-center px-5 py-2.5 bg-[#F85606] text-white text-sm font-semibold rounded-lg hover:bg-[#E04A00] transition-colors whitespace-nowrap shrink-0"
        >
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionTo && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center justify-center px-5 py-2.5 bg-[#F85606] text-white text-sm font-semibold rounded-lg hover:bg-[#E04A00] transition-colors whitespace-nowrap shrink-0"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
