import React, { lazy } from 'react';
import { useSearchParams } from 'react-router';
import { TabbedContainer, TabDefinition } from '../TabbedContainer';
import { Users, Satellite, ShieldAlert, Target, Briefcase } from 'lucide-react';

const VendorManagement = lazy(() => import('../VendorManagement'));
const VendorMonitoringDashboard = lazy(() => import('../VendorMonitoringDashboard'));
const VendorScorer = lazy(() => import('../AIFeatures/VendorScorer').then(m => ({ default: m.VendorScorer })));
const AgenticVendorRisk = lazy(() => import('../AIFeatures/AgenticVendorRisk').then(m => ({ default: m.AgenticVendorRisk })));
const ContractAnalyzer = lazy(() => import('../AIFeatures/ContractAnalyzer').then(m => ({ default: m.ContractAnalyzer })));

const VendorHub: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'vendors';
  const setActiveTab = (tab: string) => setSearchParams({ tab }, { replace: true });

  const tabs: TabDefinition[] = [
    {
      id: 'vendors',
      label: 'Vendors',
      icon: Users,
      content: <VendorManagement onBack={() => {}} />,
    },
    {
      id: 'monitoring',
      label: 'Continuous Monitoring',
      icon: Satellite,
      content: <VendorMonitoringDashboard />,
    },
    {
      id: 'risk-assessment',
      label: 'Risk Assessment',
      icon: ShieldAlert,
      content: <VendorScorer onBack={() => {}} />,
    },
    {
      id: 'agentic-risk',
      label: 'Agentic Risk Analysis',
      icon: Target,
      content: <AgenticVendorRisk onBack={() => {}} />,
    },
    {
      id: 'contract-analyzer',
      label: 'Contract Analyzer',
      icon: Briefcase,
      content: <ContractAnalyzer onBack={() => {}} />,
    },
  ];

  return <TabbedContainer tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />;
};

export default VendorHub;
