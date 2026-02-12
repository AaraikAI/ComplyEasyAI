
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
import { api } from './services/api';

// ── Lazy-loaded public pages ──────────────────────────────────────────
const SignupPage = lazy(() => import('./components/SignupPage'));
const LearnPage = lazy(() => import('./components/LearnPage'));
const CommunityPage = lazy(() => import('./components/CommunityPage'));
const StatusPage = lazy(() => import('./components/StatusPage'));
const DocsPage = lazy(() => import('./components/DocsPage'));

// ── Lazy-loaded core views (named exports) ────────────────────────────
const Reports = lazy(() => import('./components/Reports').then(m => ({ default: m.Reports })));
const AuditTrail = lazy(() => import('./components/AuditTrail').then(m => ({ default: m.AuditTrail })));
const Frameworks = lazy(() => import('./components/Frameworks').then(m => ({ default: m.Frameworks })));
const FrameworkDetails = lazy(() => import('./components/FrameworkDetails').then(m => ({ default: m.FrameworkDetails })));
const RiskManagement = lazy(() => import('./components/RiskManagement').then(m => ({ default: m.RiskManagement })));
const MyTasks = lazy(() => import('./components/MyTasks').then(m => ({ default: m.MyTasks })));
const Integrations = lazy(() => import('./components/Integrations').then(m => ({ default: m.Integrations })));
const Settings = lazy(() => import('./components/Settings').then(m => ({ default: m.Settings })));

// ── Lazy-loaded enterprise modules (default exports) ──────────────────
const ACOSDashboard = lazy(() => import('./components/ACOSDashboard'));
const SecurityFeatures = lazy(() => import('./components/SecurityFeatures'));
const RealTimeAnalytics = lazy(() => import('./components/RealTimeAnalytics'));
const VendorManagement = lazy(() => import('./components/VendorManagement'));
const PolicyManagement = lazy(() => import('./components/PolicyManagement'));
const MonitoringDashboard = lazy(() => import('./components/MonitoringDashboard'));
const WorkspaceManagement = lazy(() => import('./components/WorkspaceManagement'));
const QuestionnaireManagement = lazy(() => import('./components/QuestionnaireManagement'));
const IssueManagement = lazy(() => import('./components/IssueManagement'));

// ── Lazy-loaded AI/regulatory modules (named exports) ─────────────────
const AIRMFDashboard = lazy(() => import('./components/AIRMFDashboard').then(m => ({ default: m.AIRMFDashboard })));
const AISystemList = lazy(() => import('./components/AISystemList').then(m => ({ default: m.AISystemList })));
const AISystemDetails = lazy(() => import('./components/AISystemDetails').then(m => ({ default: m.AISystemDetails })));
const AISystemCreate = lazy(() => import('./components/AISystemCreate').then(m => ({ default: m.AISystemCreate })));
const AIRMFAssessments = lazy(() => import('./components/AIRMFAssessments').then(m => ({ default: m.AIRMFAssessments })));
const EUAIActDashboard = lazy(() => import('./components/EUAIActDashboard').then(m => ({ default: m.EUAIActDashboard })));
const DMAGatekeeperManagement = lazy(() => import('./components/DMAGatekeeperManagement').then(m => ({ default: m.DMAGatekeeperManagement })));
const DSAPlatformManagement = lazy(() => import('./components/DSAPlatformManagement').then(m => ({ default: m.DSAPlatformManagement })));

// ── Lazy-loaded AI features (named exports) ───────────────────────────
const PolicyGenerator = lazy(() => import('./components/AIFeatures/PolicyGenerator').then(m => ({ default: m.PolicyGenerator })));
const ContractAnalyzer = lazy(() => import('./components/AIFeatures/ContractAnalyzer').then(m => ({ default: m.ContractAnalyzer })));
const GapAnalysis = lazy(() => import('./components/AIFeatures/GapAnalysis').then(m => ({ default: m.GapAnalysis })));
const RFPResponder = lazy(() => import('./components/AIFeatures/RFPResponder').then(m => ({ default: m.RFPResponder })));
const PhishingGenerator = lazy(() => import('./components/AIFeatures/PhishingGenerator').then(m => ({ default: m.PhishingGenerator })));
const VendorScorer = lazy(() => import('./components/AIFeatures/VendorScorer').then(m => ({ default: m.VendorScorer })));
const DataMapper = lazy(() => import('./components/AIFeatures/DataMapper').then(m => ({ default: m.DataMapper })));
const BCPGenerator = lazy(() => import('./components/AIFeatures/BCPGenerator').then(m => ({ default: m.BCPGenerator })));

const MainApp: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([]);
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [selectedFrameworkId, setSelectedFrameworkId] = useState<string | null>(null);

  // Navigation helper that accepts string and casts to ViewState
  const handleNavigate = (view: string) => setCurrentView(view as ViewState);

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
    try {
      const fwData = await api.frameworks.list();
      const risksData = await api.risks.list();
      setFrameworks(fwData);
      setRisks(risksData);
    } catch (error) {
      console.error('Failed to load data:', error);
      setFrameworks([]);
      setRisks([]);
    }
  };

  const handleAddFramework = async (name: string, region?: string) => {
    const maxFrameworks = getLimit(user?.organization?.plan, 'maxFrameworks');
    if (isAtLimit(user?.organization?.plan, 'maxFrameworks', frameworks.length)) {
      alert(getUpgradeMessage(user?.organization?.plan, 'maxFrameworks', frameworks.length) || 'Framework limit reached. Upgrade in Settings → Billing.');
      return;
    }
    // Optimistic Update
    const newFw: ComplianceFramework = { id: 'temp', name, region: region || '', status: 'In Review', progress: 0, nextAuditDate: '2025-01-01' } as ComplianceFramework;
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
        return <PolicyGenerator onBack={() => setCurrentView('dashboard')} />;
      case 'ai-contract':
        return <ContractAnalyzer onBack={() => setCurrentView('dashboard')} />;
      case 'ai-gap':
        return <GapAnalysis onBack={() => setCurrentView('dashboard')} />;
      case 'ai-rfp':
        return <RFPResponder onBack={() => setCurrentView('dashboard')} />;
      case 'ai-phishing':
        return <PhishingGenerator onBack={() => setCurrentView('dashboard')} />;
      case 'ai-vendor':
        return <VendorScorer onBack={() => setCurrentView('dashboard')} />;
      case 'ai-data-map':
        return <DataMapper onBack={() => setCurrentView('dashboard')} />;
      case 'ai-bcp':
        return <BCPGenerator onBack={() => setCurrentView('dashboard')} />;
      case 'settings':
        if (user?.role !== 'admin') return <div>Access Denied</div>;
        return <Settings onNavigateToIntegrations={() => setCurrentView('integrations')} />;
      case 'acos':
        return <ACOSDashboard onBack={() => setCurrentView('dashboard')} onNavigate={handleNavigate} />;
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
    <OnboardingProvider onNavigate={handleNavigate}>
      <Layout currentView={currentView} onNavigate={handleNavigate}>
        <Suspense fallback={
          <div className="flex h-full items-center justify-center p-8">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        }>
          {renderContent()}
        </Suspense>
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
