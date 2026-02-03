
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ViewState, ComplianceFramework, RiskItem } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { OnboardingProvider } from './contexts/OnboardingContext';
import { normalizePlan, canAccessView } from './constants/tierFeatures';
import { getLimit, isAtLimit, getUpgradeMessage } from './constants/tierLimits';
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
import ACOSDashboard from './components/ACOSDashboard';
import SecurityFeatures from './components/SecurityFeatures';
import RealTimeAnalytics from './components/RealTimeAnalytics';
import { AIRMFDashboard } from './components/AIRMFDashboard';
import { AISystemList } from './components/AISystemList';
import { AISystemDetails } from './components/AISystemDetails';
import { AISystemCreate } from './components/AISystemCreate';
import { AIRMFAssessments } from './components/AIRMFAssessments';
import { EUAIActDashboard } from './components/EUAIActDashboard';
import { DMAGatekeeperManagement } from './components/DMAGatekeeperManagement';
import { DSAPlatformManagement } from './components/DSAPlatformManagement';
import VendorManagement from './components/VendorManagement';
import PolicyManagement from './components/PolicyManagement';
import MonitoringDashboard from './components/MonitoringDashboard';
import WorkspaceManagement from './components/WorkspaceManagement';
import QuestionnaireManagement from './components/QuestionnaireManagement';
import IssueManagement from './components/IssueManagement';

// Lazy load public pages for code splitting
const SignupPage = lazy(() => import('./components/SignupPage'));
const LearnPage = lazy(() => import('./components/LearnPage'));
const CommunityPage = lazy(() => import('./components/CommunityPage'));
const StatusPage = lazy(() => import('./components/StatusPage'));
const DocsPage = lazy(() => import('./components/DocsPage'));

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

  const userPlan = normalizePlan(user?.organization?.plan);
  useEffect(() => {
    if (user && !canAccessView(userPlan, currentView)) {
      setCurrentView('dashboard');
    }
  }, [user, userPlan, currentView]);

  const loadData = async () => {
    // Load all core data
    const fwData = await api.frameworks.list();
    const risksData = await api.risks.list();
    setFrameworks(fwData);
    setRisks(risksData);
  };

  const handleAddFramework = async (name: string, region?: string) => {
    const maxFrameworks = getLimit(user?.organization?.plan, 'maxFrameworks');
    if (isAtLimit(user?.organization?.plan, 'maxFrameworks', frameworks.length)) {
      alert(getUpgradeMessage(user?.organization?.plan, 'maxFrameworks', frameworks.length) || 'Framework limit reached. Upgrade in Settings → Billing.');
      return;
    }
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
            maxFrameworks={getLimit(user?.organization?.plan, 'maxFrameworks')}
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
      case 'security':
        return <SecurityFeatures onBack={() => setCurrentView('dashboard')} />;
      case 'analytics':
        return <RealTimeAnalytics onBack={() => setCurrentView('dashboard')} />;
      case 'ai-rmf':
        return (
          <AIRMFDashboard 
            onNavigate={(view: string, systemId?: string) => {
              if (view === 'ai-rmf-systems') {
                setCurrentView('ai-rmf-systems');
              } else if (view === 'ai-rmf-create') {
                setCurrentView('ai-rmf-create');
              } else if (view === 'ai-rmf-assessments') {
                setCurrentView('ai-rmf-assessments');
              } else if (view === 'ai-rmf-details' && systemId) {
                setSelectedFrameworkId(systemId);
                setCurrentView('ai-rmf-details');
              }
            }} 
          />
        );
      case 'ai-rmf-systems':
        return (
          <AISystemList
            onSelectSystem={(systemId: string) => {
              setSelectedFrameworkId(systemId);
              setCurrentView('ai-rmf-details');
            }}
            onCreateNew={() => setCurrentView('ai-rmf-create')}
          />
        );
      case 'ai-rmf-create':
        return (
          <AISystemCreate
            onBack={() => setCurrentView('ai-rmf')}
            onSuccess={(systemId: string) => {
              setSelectedFrameworkId(systemId);
              setCurrentView('ai-rmf-details');
            }}
          />
        );
      case 'ai-rmf-details':
        return (
          <AISystemDetails
            systemId={selectedFrameworkId || ''}
            onBack={() => setCurrentView('ai-rmf-systems')}
          />
        );
      case 'ai-rmf-assessments':
        return (
          <AIRMFAssessments
            onBack={() => setCurrentView('ai-rmf')}
            onViewSystem={(systemId: string) => {
              setSelectedFrameworkId(systemId);
              setCurrentView('ai-rmf-details');
            }}
          />
        );
      case 'eu-ai-act':
        return <EUAIActDashboard />;
      case 'dma':
        return <DMAGatekeeperManagement />;
      case 'dsa':
        return <DSAPlatformManagement />;
      case 'vendors':
        return <VendorManagement onBack={() => setCurrentView('dashboard')} />;
      case 'policies':
        return <PolicyManagement onBack={() => setCurrentView('dashboard')} />;
      case 'monitoring':
        return <MonitoringDashboard />;
      case 'workspaces':
        return <WorkspaceManagement />;
      case 'questionnaires':
        return <QuestionnaireManagement />;
      case 'issues':
        return <IssueManagement />;
      default:
        return <Dashboard frameworks={frameworks} risks={risks} onNavigate={setCurrentView} />;
    }
  };

  return (
    <OnboardingProvider onNavigate={setCurrentView}>
      <Layout currentView={currentView} onNavigate={setCurrentView}>
        {renderContent()}
      </Layout>
    </OnboardingProvider>
  );
};

// Public page wrapper component for lazy-loaded pages
const PublicPageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white flex items-center gap-2">
          <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading...</span>
        </div>
      </div>
    }>
      {children}
    </Suspense>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes - accessible without authentication */}
          <Route path="/signup" element={
            <PublicPageWrapper>
              <SignupPage />
            </PublicPageWrapper>
          } />
          <Route path="/learn" element={
            <PublicPageWrapper>
              <LearnPage />
            </PublicPageWrapper>
          } />
          <Route path="/community" element={
            <PublicPageWrapper>
              <CommunityPage />
            </PublicPageWrapper>
          } />
          <Route path="/status" element={
            <PublicPageWrapper>
              <StatusPage />
            </PublicPageWrapper>
          } />
          <Route path="/docs" element={
            <PublicPageWrapper>
              <DocsPage />
            </PublicPageWrapper>
          } />
          <Route path="/docs/*" element={
            <PublicPageWrapper>
              <DocsPage />
            </PublicPageWrapper>
          } />
          
          {/* Main App Route - handles authentication */}
          <Route path="/*" element={<MainApp />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
