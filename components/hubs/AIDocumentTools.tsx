import React, { lazy } from 'react';
import { useSearchParams } from 'react-router';
import { TabbedContainer, TabDefinition } from '../TabbedContainer';
import { FileText, LifeBuoy, GitGraph } from 'lucide-react';

const RFPResponder = lazy(() => import('../AIFeatures/RFPResponder').then(m => ({ default: m.RFPResponder })));
const BCPGenerator = lazy(() => import('../AIFeatures/BCPGenerator').then(m => ({ default: m.BCPGenerator })));
const GapAnalysis = lazy(() => import('../AIFeatures/GapAnalysis').then(m => ({ default: m.GapAnalysis })));

const AIDocumentTools: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'rfp';
  const setActiveTab = (tab: string) => setSearchParams({ tab }, { replace: true });

  const tabs: TabDefinition[] = [
    {
      id: 'rfp',
      label: 'RFP Responder',
      icon: FileText,
      content: <RFPResponder onBack={() => {}} />,
    },
    {
      id: 'bcp',
      label: 'BCP Generator',
      icon: LifeBuoy,
      content: <BCPGenerator onBack={() => {}} />,
    },
    {
      id: 'gap',
      label: 'Gap Analysis',
      icon: GitGraph,
      content: <GapAnalysis onBack={() => {}} />,
    },
  ];

  return <TabbedContainer tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />;
};

export default AIDocumentTools;
