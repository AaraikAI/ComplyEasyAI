import React, { lazy } from 'react';
import { useSearchParams } from 'react-router';
import { TabbedContainer, TabDefinition } from '../TabbedContainer';
import { UserCheck, Workflow, Bot, Scale } from 'lucide-react';

const GovernanceManager = lazy(() => import('../GovernanceManager').then(m => ({ default: m.GovernanceManager })));
const ProcessMapper = lazy(() => import('../ProcessMapper').then(m => ({ default: m.ProcessMapper })));
const WorkflowBuilder = lazy(() => import('../WorkflowBuilder').then(m => ({ default: m.WorkflowBuilder })));
const WorkflowAutomationRules = lazy(() => import('../WorkflowAutomationRules'));
const SoDAnalysisDashboard = lazy(() => import('../SoDAnalysisDashboard').then(m => ({ default: m.SoDAnalysisDashboard })));

const GovernanceHub: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  const setActiveTab = (tab: string) => setSearchParams({ tab }, { replace: true });

  const tabs: TabDefinition[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: UserCheck,
      content: <GovernanceManager onBack={() => {}} />,
    },
    {
      id: 'process-mapper',
      label: 'Process Mapper',
      icon: Workflow,
      content: <ProcessMapper onBack={() => {}} />,
    },
    {
      id: 'workflow-builder',
      label: 'Workflow Builder',
      icon: Workflow,
      content: <WorkflowBuilder onBack={() => {}} />,
    },
    {
      id: 'automation',
      label: 'Automation Rules',
      icon: Bot,
      content: <WorkflowAutomationRules />,
    },
    {
      id: 'sod',
      label: 'Segregation of Duties',
      icon: Scale,
      content: <SoDAnalysisDashboard onBack={() => {}} />,
    },
  ];

  return <TabbedContainer tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />;
};

export default GovernanceHub;
