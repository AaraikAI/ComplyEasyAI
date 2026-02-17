
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ViewState, ComplianceFramework, RiskItem } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { OnboardingProvider } from './contexts/OnboardingContext';
import { ThemeProvider } from './contexts/ThemeContext';
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
const CrossFrameworkMapper = lazy(() => import('./components/AIFeatures/CrossFrameworkMapper').then(m => ({ default: m.CrossFrameworkMapper })));
const RegulatoryAutoRemediation = lazy(() => import('./components/AIFeatures/RegulatoryAutoRemediation').then(m => ({ default: m.RegulatoryAutoRemediation })));
const EvidenceCompletenessChecker = lazy(() => import('./components/AIFeatures/EvidenceCompletenessChecker').then(m => ({ default: m.EvidenceCompletenessChecker })));
const AgenticVendorRisk = lazy(() => import('./components/AIFeatures/AgenticVendorRisk').then(m => ({ default: m.AgenticVendorRisk })));
const AuditSimulator = lazy(() => import('./components/AIFeatures/AuditSimulator').then(m => ({ default: m.AuditSimulator })));
const NaturalLanguageQuery = lazy(() => import('./components/AIFeatures/NaturalLanguageQuery').then(m => ({ default: m.NaturalLanguageQuery })));

// ── Lazy-loaded Phase 1: EU Regulations & US Privacy ──────────────────
const EUCRADashboard = lazy(() => import('./components/EUCRADashboard').then(m => ({ default: m.EUCRADashboard })));
const CSRDDashboard = lazy(() => import('./components/CSRDDashboard').then(m => ({ default: m.CSRDDashboard })));
const EcodesignDashboard = lazy(() => import('./components/EcodesignDashboard').then(m => ({ default: m.EcodesignDashboard })));
const NIS2Dashboard = lazy(() => import('./components/NIS2Dashboard').then(m => ({ default: m.NIS2Dashboard })));
const USPrivacyTracker = lazy(() => import('./components/USPrivacyTracker').then(m => ({ default: m.USPrivacyTracker })));

// ── Lazy-loaded Phase 2-3: Process Mapping & Governance ──────────────
const ProcessMapper = lazy(() => import('./components/ProcessMapper').then(m => ({ default: m.ProcessMapper })));
const GovernanceManager = lazy(() => import('./components/GovernanceManager').then(m => ({ default: m.GovernanceManager })));

// ── Lazy-loaded Phase 5-6: Certification & ESG ──────────────────────
const CEMarkingWorkflow = lazy(() => import('./components/CEMarkingWorkflow').then(m => ({ default: m.CEMarkingWorkflow })));
const DigitalProductPassport = lazy(() => import('./components/DigitalProductPassport').then(m => ({ default: m.DigitalProductPassport })));
const ESGReportingModule = lazy(() => import('./components/ESGReportingModule').then(m => ({ default: m.ESGReportingModule })));
const PostMarketSurveillance = lazy(() => import('./components/PostMarketSurveillance').then(m => ({ default: m.PostMarketSurveillance })));

// ── Lazy-loaded Phase 7-8: Breach & Post-Market Lifecycle ───────────
const BreachNotificationWizard = lazy(() => import('./components/BreachNotificationWizard').then(m => ({ default: m.BreachNotificationWizard })));
const SBOMManager = lazy(() => import('./components/SBOMManager').then(m => ({ default: m.SBOMManager })));
const ProductDecommissioning = lazy(() => import('./components/ProductDecommissioning').then(m => ({ default: m.ProductDecommissioning })));
const EnvironmentalLifecycle = lazy(() => import('./components/EnvironmentalLifecycle').then(m => ({ default: m.EnvironmentalLifecycle })));

// ── Lazy-loaded Tier features ───────────────────────────────────────
const AIComplianceCopilot = lazy(() => import('./components/AIComplianceCopilot').then(m => ({ default: m.AIComplianceCopilot })));
const ComplianceScoreForecasting = lazy(() => import('./components/ComplianceScoreForecasting').then(m => ({ default: m.ComplianceScoreForecasting })));
const ProductLifecycleTracker = lazy(() => import('./components/ProductLifecycleTracker').then(m => ({ default: m.ProductLifecycleTracker })));

const MainApp: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([]);
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [selectedFrameworkId, setSelectedFrameworkId] = useState<string | null>(null);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

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
      // Phase 1: EU Regulations & US Privacy
      case 'eu-cra':
        return <EUCRADashboard />;
      case 'csrd':
        return <CSRDDashboard />;
      case 'ecodesign':
        return <EcodesignDashboard />;
      case 'nis2':
        return <NIS2Dashboard />;
      case 'us-privacy':
        return <USPrivacyTracker />;
      // Phase 2-3: Process Mapping & Governance
      case 'process-mapper':
        return <ProcessMapper onBack={() => setCurrentView('dashboard')} />;
      case 'governance':
        return <GovernanceManager onBack={() => setCurrentView('dashboard')} />;
      // Phase 5: Certification & Market Access
      case 'ce-marking':
        return <CEMarkingWorkflow onBack={() => setCurrentView('dashboard')} />;
      case 'digital-product-passport':
        return <DigitalProductPassport onBack={() => setCurrentView('dashboard')} />;
      // Phase 6: ESG & Surveillance
      case 'esg-reporting':
        return <ESGReportingModule onBack={() => setCurrentView('dashboard')} />;
      case 'post-market-surveillance':
        return <PostMarketSurveillance onBack={() => setCurrentView('dashboard')} />;
      // Phase 7: Breach Management
      case 'breach-wizard':
        return <BreachNotificationWizard onBack={() => setCurrentView('dashboard')} />;
      // Phase 8: Post-Market Lifecycle
      case 'sbom-manager':
        return <SBOMManager onBack={() => setCurrentView('dashboard')} />;
      case 'product-decommissioning':
        return <ProductDecommissioning onBack={() => setCurrentView('dashboard')} />;
      case 'environmental-lifecycle':
        return <EnvironmentalLifecycle onBack={() => setCurrentView('dashboard')} />;
      // AI Tier Features
      case 'ai-cross-mapper':
        return <CrossFrameworkMapper onBack={() => setCurrentView('dashboard')} />;
      case 'ai-auto-remediation':
        return <RegulatoryAutoRemediation onBack={() => setCurrentView('dashboard')} />;
      case 'ai-evidence-checker':
        return <EvidenceCompletenessChecker onBack={() => setCurrentView('dashboard')} />;
      case 'ai-agentic-vendor':
        return <AgenticVendorRisk onBack={() => setCurrentView('dashboard')} />;
      case 'ai-audit-simulator':
        return <AuditSimulator onBack={() => setCurrentView('dashboard')} />;
      case 'ai-nl-query':
        return <NaturalLanguageQuery onBack={() => setCurrentView('dashboard')} />;
      case 'compliance-forecasting':
        return <ComplianceScoreForecasting onBack={() => setCurrentView('dashboard')} />;
      case 'product-lifecycle':
        return <ProductLifecycleTracker onBack={() => setCurrentView('dashboard')} />;
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
        {/* AI Compliance Copilot Sidebar */}
        <AIComplianceCopilot currentView={currentView} isOpen={isCopilotOpen} onClose={() => setIsCopilotOpen(false)} />
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
      <ThemeProvider>
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
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
