import React, { useState, lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router';
import { TabbedContainer, TabDefinition } from '../TabbedContainer';
import { ShieldAlert, Target, Network, CheckSquare } from 'lucide-react';

const RiskManagement = lazy(() => import('../RiskManagement').then(m => ({ default: m.RiskManagement })));
const RiskHeatMap = lazy(() => import('../RiskHeatMap'));
const RiskCanvas = lazy(() => import('../RiskCanvas'));
const MyTasks = lazy(() => import('../MyTasks').then(m => ({ default: m.MyTasks })));

const RiskHub: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'register';
  const setActiveTab = (tab: string) => setSearchParams({ tab }, { replace: true });

  const tabs: TabDefinition[] = [
    {
      id: 'register',
      label: 'Risk Register',
      icon: ShieldAlert,
      content: <RiskManagement onBack={() => {}} />,
    },
    {
      id: 'heatmap',
      label: 'Heat Map',
      icon: Target,
      content: <RiskHeatMap />,
    },
    {
      id: 'canvas',
      label: 'Risk Canvas',
      icon: Network,
      content: <RiskCanvas />,
    },
    {
      id: 'tasks',
      label: 'My Tasks',
      icon: CheckSquare,
      content: <MyTasks />,
    },
  ];

  return <TabbedContainer tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />;
};

export default RiskHub;
