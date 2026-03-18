import React, { lazy } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TabbedContainer, TabDefinition } from '../TabbedContainer';
import { Boxes, Smartphone, GitBranch, Lock, Radar, BookOpen } from 'lucide-react';

const AssetManagement = lazy(() => import('../AssetManagement'));
const MDMDashboard = lazy(() => import('../MDMDashboard').then(m => ({ default: m.MDMDashboard })));
const CICDGateSettings = lazy(() => import('../CICDGateSettings'));
const SecurityFeatures = lazy(() => import('../SecurityFeatures'));
const BusinessImpactAnalysis = lazy(() => import('../BusinessImpactAnalysis'));
const SecurityTrainingDashboard = lazy(() => import('../SecurityTrainingDashboard'));

const EnterpriseOpsHub: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'assets';
  const setActiveTab = (tab: string) => setSearchParams({ tab }, { replace: true });

  const tabs: TabDefinition[] = [
    {
      id: 'assets',
      label: 'IT Assets',
      icon: Boxes,
      content: <AssetManagement />,
    },
    {
      id: 'mdm',
      label: 'Mobile Devices',
      icon: Smartphone,
      content: <MDMDashboard onBack={() => {}} />,
    },
    {
      id: 'cicd',
      label: 'CI/CD Gates',
      icon: GitBranch,
      content: <CICDGateSettings />,
    },
    {
      id: 'security',
      label: 'Security Features',
      icon: Lock,
      content: <SecurityFeatures onBack={() => {}} />,
    },
    {
      id: 'bia',
      label: 'Business Impact',
      icon: Radar,
      content: <BusinessImpactAnalysis />,
    },
    {
      id: 'training',
      label: 'Security Training',
      icon: BookOpen,
      content: <SecurityTrainingDashboard onBack={() => {}} />,
    },
  ];

  return <TabbedContainer tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />;
};

export default EnterpriseOpsHub;
