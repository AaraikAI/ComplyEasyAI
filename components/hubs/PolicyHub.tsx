import React, { lazy } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TabbedContainer, TabDefinition } from '../TabbedContainer';
import { FileCheck, Sparkles } from 'lucide-react';

const PolicyManagement = lazy(() => import('../PolicyManagement'));
const PolicyGenerator = lazy(() => import('../AIFeatures/PolicyGenerator').then(m => ({ default: m.PolicyGenerator })));

const PolicyHub: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'policies';
  const setActiveTab = (tab: string) => setSearchParams({ tab }, { replace: true });

  const tabs: TabDefinition[] = [
    {
      id: 'policies',
      label: 'Policies',
      icon: FileCheck,
      content: <PolicyManagement onBack={() => {}} />,
    },
    {
      id: 'ai-generator',
      label: 'AI Generator',
      icon: Sparkles,
      content: <PolicyGenerator onBack={() => {}} />,
    },
  ];

  return <TabbedContainer tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />;
};

export default PolicyHub;
