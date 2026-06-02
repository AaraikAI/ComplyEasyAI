import React, { lazy } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TabbedContainer, TabDefinition } from '../TabbedContainer';
import { FileText, BarChart3, Sparkles, Leaf } from 'lucide-react';

const Reports = lazy(() => import('../Reports').then(m => ({ default: m.Reports })));
const ReportBuilder = lazy(() => import('../ReportBuilder'));
const AIReportGenerator = lazy(() => import('../AIReportGenerator').then(m => ({ default: m.AIReportGenerator })));
const ESGReportingModule = lazy(() => import('../ESGReportingModule').then(m => ({ default: m.ESGReportingModule })));

const ReportingCenter: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'reports';
  const setActiveTab = (tab: string) => setSearchParams({ tab }, { replace: true });

  const tabs: TabDefinition[] = [
    {
      id: 'reports',
      label: 'Reports',
      icon: FileText,
      content: <Reports />,
    },
    {
      id: 'builder',
      label: 'Report Builder',
      icon: BarChart3,
      content: <ReportBuilder />,
    },
    {
      id: 'ai-generator',
      label: 'AI Generator',
      icon: Sparkles,
      content: <AIReportGenerator />,
    },
    {
      id: 'esg',
      label: 'ESG Reports',
      icon: Leaf,
      content: <ESGReportingModule onBack={() => {}} />,
    },
  ];

  return <TabbedContainer tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />;
};

export default ReportingCenter;
