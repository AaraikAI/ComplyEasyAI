import React, { lazy } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TabbedContainer, TabDefinition } from '../TabbedContainer';
import { Monitor, Activity, TrendingUp, DollarSign } from 'lucide-react';

const MonitoringDashboard = lazy(() => import('../MonitoringDashboard'));
const RealTimeAnalytics = lazy(() => import('../RealTimeAnalytics'));
const ComplianceScoreForecasting = lazy(() => import('../ComplianceScoreForecasting').then(m => ({ default: m.ComplianceScoreForecasting })));
const ComplianceCostDashboard = lazy(() => import('../ComplianceCostDashboard'));

const AnalyticsHub: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'monitoring';
  const setActiveTab = (tab: string) => setSearchParams({ tab }, { replace: true });

  const tabs: TabDefinition[] = [
    {
      id: 'monitoring',
      label: 'Live Monitoring',
      icon: Monitor,
      content: <MonitoringDashboard />,
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: Activity,
      content: <RealTimeAnalytics />,
    },
    {
      id: 'forecasting',
      label: 'Score Forecasting',
      icon: TrendingUp,
      content: <ComplianceScoreForecasting onBack={() => {}} />,
    },
    {
      id: 'costs',
      label: 'Cost Analytics',
      icon: DollarSign,
      content: <ComplianceCostDashboard />,
    },
  ];

  return <TabbedContainer tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />;
};

export default AnalyticsHub;
