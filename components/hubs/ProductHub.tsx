import React, { lazy } from 'react';
import { useSearchParams } from 'react-router';
import { TabbedContainer, TabDefinition } from '../TabbedContainer';
import { Recycle, Award, Package, FileCode, Trash2, TreePine, BadgeCheck } from 'lucide-react';

const ProductLifecycleTracker = lazy(() => import('../ProductLifecycleTracker').then(m => ({ default: m.ProductLifecycleTracker })));
const CEMarkingWorkflow = lazy(() => import('../CEMarkingWorkflow').then(m => ({ default: m.CEMarkingWorkflow })));
const DigitalProductPassport = lazy(() => import('../DigitalProductPassport').then(m => ({ default: m.DigitalProductPassport })));
const SBOMManager = lazy(() => import('../SBOMManager').then(m => ({ default: m.SBOMManager })));
const ProductDecommissioning = lazy(() => import('../ProductDecommissioning').then(m => ({ default: m.ProductDecommissioning })));
const EnvironmentalLifecycle = lazy(() => import('../EnvironmentalLifecycle').then(m => ({ default: m.EnvironmentalLifecycle })));
const CertificationTracker = lazy(() => import('../CertificationTracker'));

const ProductHub: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'lifecycle';
  const setActiveTab = (tab: string) => setSearchParams({ tab }, { replace: true });

  const tabs: TabDefinition[] = [
    {
      id: 'lifecycle',
      label: 'Product Lifecycle',
      icon: Recycle,
      content: <ProductLifecycleTracker onBack={() => {}} />,
    },
    {
      id: 'ce-marking',
      label: 'CE Marking',
      icon: Award,
      content: <CEMarkingWorkflow onBack={() => {}} />,
    },
    {
      id: 'digital-passport',
      label: 'Digital Passport',
      icon: Package,
      content: <DigitalProductPassport onBack={() => {}} />,
    },
    {
      id: 'sbom',
      label: 'SBOM Manager',
      icon: FileCode,
      content: <SBOMManager onBack={() => {}} />,
    },
    {
      id: 'decommissioning',
      label: 'Decommissioning',
      icon: Trash2,
      content: <ProductDecommissioning onBack={() => {}} />,
    },
    {
      id: 'environmental',
      label: 'Environmental',
      icon: TreePine,
      content: <EnvironmentalLifecycle onBack={() => {}} />,
    },
    {
      id: 'certifications',
      label: 'Certifications',
      icon: BadgeCheck,
      content: <CertificationTracker />,
    },
  ];

  return <TabbedContainer tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />;
};

export default ProductHub;
