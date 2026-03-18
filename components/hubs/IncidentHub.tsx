import React, { lazy } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TabbedContainer, TabDefinition } from '../TabbedContainer';
import { AlertTriangle, AlertOctagon, ShieldAlert } from 'lucide-react';

const IssueManagement = lazy(() => import('../IssueManagement'));
const IncidentManagement = lazy(() => import('../IncidentManagement'));
const BreachNotificationWizard = lazy(() => import('../BreachNotificationWizard').then(m => ({ default: m.BreachNotificationWizard })));

const IncidentHub: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'issues';
  const setActiveTab = (tab: string) => setSearchParams({ tab }, { replace: true });

  const tabs: TabDefinition[] = [
    {
      id: 'issues',
      label: 'Issues',
      icon: AlertTriangle,
      content: <IssueManagement />,
    },
    {
      id: 'incidents',
      label: 'Incidents',
      icon: AlertOctagon,
      content: <IncidentManagement />,
    },
    {
      id: 'breach',
      label: 'Breach Notification',
      icon: ShieldAlert,
      content: <BreachNotificationWizard onBack={() => {}} />,
    },
  ];

  return <TabbedContainer tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />;
};

export default IncidentHub;
