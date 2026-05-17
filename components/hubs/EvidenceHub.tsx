import React, { lazy, useState } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { TabbedContainer, TabDefinition } from '../TabbedContainer';
import { ScanSearch, Sparkles, FileWarning, ShieldCheck } from 'lucide-react';

const EvidenceCollectionRules = lazy(() => import('../EvidenceCollectionRules'));
const EvidenceCompletenessChecker = lazy(() => import('../AIFeatures/EvidenceCompletenessChecker').then(m => ({ default: m.EvidenceCompletenessChecker })));
const ExceptionManagement = lazy(() => import('../ExceptionManagement'));
const EvidenceDetailPanel = lazy(() => import('../AIFeatures/EvidenceDetailPanel'));

const EvidenceDetailTabBody: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useParams<{ evidenceId?: string }>();
  const navigate = useNavigate();
  // Prefer clean path-segment id (/evidence/:evidenceId) over legacy query string.
  const evidenceId = params.evidenceId || searchParams.get('evidenceId') || '';
  const [input, setInput] = useState('');

  if (evidenceId) {
    return (
      <EvidenceDetailPanel
        evidenceId={evidenceId}
        onClose={() => {
          if (params.evidenceId) {
            navigate('/evidence?tab=detail', { replace: true });
          } else {
            const next = new URLSearchParams(searchParams);
            next.delete('evidenceId');
            setSearchParams(next, { replace: true });
          }
        }}
      />
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-xl">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Open Evidence Detail</h3>
      <p className="text-sm text-gray-500 mb-4">
        Enter an evidence ID to view its analysis, provenance, and anchor state.
      </p>
      <form
        onSubmit={e => {
          e.preventDefault();
          const trimmed = input.trim();
          if (!trimmed) return;
          navigate(`/evidence/${encodeURIComponent(trimmed)}?tab=detail`, { replace: true });
        }}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="evidence-id"
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          Open
        </button>
      </form>
    </div>
  );
};

const EvidenceHub: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useParams<{ evidenceId?: string }>();
  // If we landed on /evidence/:id without ?tab, default to the detail tab.
  const activeTab = searchParams.get('tab') || (params.evidenceId ? 'detail' : 'collection');
  const setActiveTab = (tab: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    setSearchParams(next, { replace: true });
  };

  const tabs: TabDefinition[] = [
    {
      id: 'collection',
      label: 'Evidence Collection',
      icon: ScanSearch,
      content: <EvidenceCollectionRules />,
    },
    {
      id: 'checker',
      label: 'Completeness Checker',
      icon: Sparkles,
      content: <EvidenceCompletenessChecker onBack={() => {}} />,
    },
    {
      id: 'detail',
      label: 'Evidence Detail',
      icon: ShieldCheck,
      content: <EvidenceDetailTabBody />,
    },
    {
      id: 'exceptions',
      label: 'Exceptions',
      icon: FileWarning,
      content: <ExceptionManagement />,
    },
  ];

  return <TabbedContainer tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />;
};

export default EvidenceHub;
