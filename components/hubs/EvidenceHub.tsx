import React, { lazy } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TabbedContainer, TabDefinition } from '../TabbedContainer';
import { ScanSearch, Sparkles, FileWarning } from 'lucide-react';

const EvidenceCollectionRules = lazy(() => import('../EvidenceCollectionRules'));
const EvidenceCompletenessChecker = lazy(() => import('../AIFeatures/EvidenceCompletenessChecker').then(m => ({ default: m.EvidenceCompletenessChecker })));
const ExceptionManagement = lazy(() => import('../ExceptionManagement'));

const EvidenceHub: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'collection';
  const setActiveTab = (tab: string) => setSearchParams({ tab }, { replace: true });

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
      id: 'exceptions',
      label: 'Exceptions',
      icon: FileWarning,
      content: <ExceptionManagement />,
    },
  ];

  return <TabbedContainer tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />;
};

export default EvidenceHub;
