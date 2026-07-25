import React, { lazy } from 'react';
import { useSearchParams } from 'react-router';
import { TabbedContainer, TabDefinition } from '../TabbedContainer';
import { Database, GitGraph, Bot, MessageSquare, Mail } from 'lucide-react';

const DataMapper = lazy(() => import('../AIFeatures/DataMapper').then(m => ({ default: m.DataMapper })));
const CrossFrameworkMapper = lazy(() => import('../AIFeatures/CrossFrameworkMapper').then(m => ({ default: m.CrossFrameworkMapper })));
const RegulatoryAutoRemediation = lazy(() => import('../AIFeatures/RegulatoryAutoRemediation').then(m => ({ default: m.RegulatoryAutoRemediation })));
const NaturalLanguageQuery = lazy(() => import('../AIFeatures/NaturalLanguageQuery').then(m => ({ default: m.NaturalLanguageQuery })));
const PhishingGenerator = lazy(() => import('../AIFeatures/PhishingGenerator').then(m => ({ default: m.PhishingGenerator })));

const AIComplianceTools: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'data-mapper';
  const setActiveTab = (tab: string) => setSearchParams({ tab }, { replace: true });

  const tabs: TabDefinition[] = [
    {
      id: 'data-mapper',
      label: 'Data Mapper',
      icon: Database,
      content: <DataMapper onBack={() => {}} />,
    },
    {
      id: 'cross-mapper',
      label: 'Cross-Framework Mapper',
      icon: GitGraph,
      content: <CrossFrameworkMapper onBack={() => {}} />,
    },
    {
      id: 'remediation',
      label: 'Auto-Remediation',
      icon: Bot,
      content: <RegulatoryAutoRemediation onBack={() => {}} />,
    },
    {
      id: 'query',
      label: 'Compliance Query',
      icon: MessageSquare,
      content: <NaturalLanguageQuery onBack={() => {}} />,
    },
    {
      id: 'phishing',
      label: 'Phishing Simulator',
      icon: Mail,
      content: <PhishingGenerator onBack={() => {}} />,
    },
  ];

  return <TabbedContainer tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />;
};

export default AIComplianceTools;
