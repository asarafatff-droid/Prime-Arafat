import { FileText } from 'lucide-react';
import { EmptyState } from '../../components/common/EmptyState';
import { useStore } from '../../contexts/StoreContext';

interface CmsPolicyPageProps {
  pageKey: 'aboutUs' | 'privacyPolicy' | 'termsConditions' | 'returnPolicy';
  title: string;
}

export function CmsPolicyPage({ pageKey, title }: CmsPolicyPageProps) {
  const { websiteSettings } = useStore();
  const content = websiteSettings[pageKey];

  return (
    <div className="max-w-4xl mx-auto px-3 md:px-6 py-8">
      <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 space-y-4">
        <h1 className="font-display text-2xl font-bold text-slate-900 pb-3 border-b border-slate-100">
          {title}
        </h1>
        {content && content.trim() ? (
          <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{content}</div>
        ) : (
          <EmptyState
            title={`${title} has not been published yet.`}
            description="The store administrator can configure this page under Website Settings."
            icon={<FileText className="w-6 h-6" />}
          />
        )}
      </div>
    </div>
  );
}
