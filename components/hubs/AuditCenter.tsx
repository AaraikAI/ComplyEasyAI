import React, { lazy } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TabbedContainer, TabDefinition } from '../TabbedContainer';
import { Activity, Target, Crosshair, BookOpen, TestTube } from 'lucide-react';

const AuditTrail = lazy(() => import('../AuditTrail').then(m => ({ default: m.AuditTrail })));
const AuditPrepAssistant = lazy(() => import('../AuditPrepAssistant'));
const AuditSimulator = lazy(() => import('../AIFeatures/AuditSimulator').then(m => ({ default: m.AuditSimulator })));
const AuditorHub = lazy(() => import('../AuditorHub').then(m => ({ default: m.AuditorHub })));
const ControlTestResults = lazy(() => import('../ControlTestResults'));

const AuditCenter: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'trail';
  const setActiveTab = (tab: string) => setSearchParams({ tab }, { replace: true });

  const tabs: TabDefinition[] = [
    {
      id: 'trail',
      label: 'Audit Trail',
      icon: Activity,
      content: <AuditTrail />,
    },
    {
      id: 'preparation',
      label: 'Preparation',
      icon: Target,
      content: <AuditPrepAssistant />,
    },
    {
      id: 'simulator',
      label: 'Simulator',
      icon: Crosshair,
      content: <AuditSimulator onBack={() => {}} />,
    },
    {
      id: 'auditor',
      label: 'Auditor Hub',
      icon: BookOpen,
      content: <AuditorHub onBack={() => {}} />,
    },
    {
      id: 'testing',
      label: 'Control Testing',
      icon: TestTube,
      content: <ControlTestResults />,
    },
  ];

  return <TabbedContainer tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />;
};

export default AuditCenter;
