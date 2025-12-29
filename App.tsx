
import React, { useState, useEffect } from 'react';
import { ViewState, ComplianceFramework, RiskItem } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { LandingPage } from './components/LandingPage';
import { Reports } from './components/Reports';
import { AuditTrail } from './components/AuditTrail';
import { Frameworks } from './components/Frameworks';
import { FrameworkDetails } from './components/FrameworkDetails';
import { RiskManagement } from './components/RiskManagement';
import { MyTasks } from './components/MyTasks';
import { Integrations } from './components/Integrations';
import { Settings } from './components/Settings';
// Lazy load AI features for code splitting and bundle optimization
import { lazy, Suspense } from 'react';
import ACOSDashboard from './components/ACOSDashboard';

const PolicyGenerator = lazy(() => import('./components/AIFeatures/PolicyGenerator').then(m => ({ default: m.PolicyGenerator })));
const ContractAnalyzer = lazy(() => import('./components/AIFeatures/ContractAnalyzer').then(m => ({ default: m.ContractAnalyzer })));
const GapAnalysis = lazy(() => import('./components/AIFeatures/GapAnalysis').then(m => ({ default: m.GapAnalysis })));
const RFPResponder = lazy(() => import('./components/AIFeatures/RFPResponder').then(m => ({ default: m.RFPResponder })));
const PhishingGenerator = lazy(() => import('./components/AIFeatures/PhishingGenerator').then(m => ({ default: m.PhishingGenerator })));
const VendorScorer = lazy(() => import('./components/AIFeatures/VendorScorer').then(m => ({ default: m.VendorScorer })));
const DataMapper = lazy(() => import('./components/AIFeatures/DataMapper').then(m => ({ default: m.DataMapper })));
const BCPGenerator = lazy(() => import('./components/AIFeatures/BCPGenerator').then(m => ({ default: m.BCPGenerator })));
import { api } from './services/api';

const MainApp: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([]);
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [selectedFrameworkId, setSelectedFrameworkId] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    // Load all core data
    const fwData = await api.frameworks.list();
    const risksData = await api.risks.list();
    setFrameworks(fwData);
    setRisks(risksData);
  };

  const handleAddFramework = async (name: string, region?: string) => {
    // Optimistic Update
    const newFw: any = { id: 'temp', name, region, status: 'In Review', progress: 0, nextAuditDate: '2025-01-01' };
    setFrameworks([...frameworks, newFw]);
    
    // API Call
    await api.frameworks.create(newFw);
    loadData(); // Refresh to get real ID and sync
  };

  const handleSelectFramework = (id: string) => {
    setSelectedFrameworkId(id);
    setCurrentView('framework-details');
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard frameworks={frameworks} risks={risks} onNavigate={setCurrentView} />;
      case 'reports':
        return <Reports />;
      case 'audit':
        return <AuditTrail />;
      case 'frameworks':
        return (
          <Frameworks 
            activeFrameworks={frameworks} 
            onAddFramework={handleAddFramework} 
            onSelectFramework={handleSelectFramework}
            onFrameworkDeleted={loadData}
          />
        );
      case 'framework-details':
        return (
          <FrameworkDetails 
            framework={frameworks.find(f => f.id === selectedFrameworkId)} 
            onBack={() => {
              loadData(); // Refresh data when going back
              setCurrentView('frameworks');
            }}
            onDataChanged={loadData} // Refresh when controls are created/updated
          />
        );
      case 'risks':
        return <RiskManagement onBack={() => { loadData(); setCurrentView('dashboard'); }} />;
      case 'my-tasks':
        return <MyTasks />;
      case 'integrations':
        return <Integrations />;
      case 'ai-policy':
        return (
          <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading Policy Generator...</div>}>
            <PolicyGenerator onBack={() => setCurrentView('dashboard')} />
          </Suspense>
        );
      case 'ai-contract':
        return (
          <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading Contract Analyzer...</div>}>
            <ContractAnalyzer onBack={() => setCurrentView('dashboard')} />
          </Suspense>
        );
      case 'ai-gap':
        return (
          <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading Gap Analysis...</div>}>
            <GapAnalysis onBack={() => setCurrentView('dashboard')} />
          </Suspense>
        );
      case 'ai-rfp':
        return (
          <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading RFP Responder...</div>}>
            <RFPResponder onBack={() => setCurrentView('dashboard')} />
          </Suspense>
        );
      case 'ai-phishing':
        return (
          <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading Phishing Generator...</div>}>
            <PhishingGenerator onBack={() => setCurrentView('dashboard')} />
          </Suspense>
        );
      case 'ai-vendor':
        return (
          <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading Vendor Scorer...</div>}>
            <VendorScorer onBack={() => setCurrentView('dashboard')} />
          </Suspense>
        );
      case 'ai-data-map':
        return (
          <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading Data Mapper...</div>}>
            <DataMapper onBack={() => setCurrentView('dashboard')} />
          </Suspense>
        );
      case 'ai-bcp':
        return (
          <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading BCP Generator...</div>}>
            <BCPGenerator onBack={() => setCurrentView('dashboard')} />
          </Suspense>
        );
      case 'settings':
        if (user?.role !== 'admin') return <div>Access Denied</div>;
        return <Settings onNavigateToIntegrations={() => setCurrentView('integrations')} />;
      case 'acos':
        return <ACOSDashboard onBack={() => setCurrentView('dashboard')} onNavigate={setCurrentView} />;
      default:
        return <Dashboard frameworks={frameworks} risks={risks} onNavigate={setCurrentView} />;
    }
  };

  return (
    <Layout currentView={currentView} onNavigate={setCurrentView}>
      {renderContent()}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;
