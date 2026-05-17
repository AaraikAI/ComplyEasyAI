
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ComplianceFramework, RiskItem } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { OnboardingProvider } from './contexts/OnboardingContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { I18nProvider } from './contexts/I18nContext';
import { QueryProvider } from './contexts/QueryProvider';
import { normalizePlan } from './constants/tierFeatures';
import { getLimit, isAtLimit, getUpgradeMessage } from './constants/tierLimits';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { LandingPage } from './components/LandingPage';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { ROUTES } from './routes/routeConfig';
import { api } from './services/api';
import { Toaster } from 'sonner';
import { toast } from 'sonner';
import GlobalSearch from './components/GlobalSearch';
import NotificationCenter from './components/NotificationCenter';

// ── Lazy-loaded public pages ──────────────────────────────────────────
const SignupPage = lazy(() => import('./components/SignupPage'));
const LearnPage = lazy(() => import('./components/LearnPage'));
const CommunityPage = lazy(() => import('./components/CommunityPage'));
const StatusPage = lazy(() => import('./components/StatusPage'));
const DocsPage = lazy(() => import('./components/DocsPage'));

// ── Lazy-loaded core views (still used directly) ─────────────────────
const Frameworks = lazy(() => import('./components/Frameworks').then(m => ({ default: m.Frameworks })));
const FrameworkDetails = lazy(() => import('./components/FrameworkDetails').then(m => ({ default: m.FrameworkDetails })));
const Integrations = lazy(() => import('./components/Integrations').then(m => ({ default: m.Integrations })));
const Settings = lazy(() => import('./components/Settings').then(m => ({ default: m.Settings })));

// ── Lazy-loaded Hub Components (consolidated navigation) ─────────────
const VendorHub = lazy(() => import('./components/hubs/VendorHub'));
const ReportingCenter = lazy(() => import('./components/hubs/ReportingCenter'));
const RiskHub = lazy(() => import('./components/hubs/RiskHub'));
const AuditCenter = lazy(() => import('./components/hubs/AuditCenter'));
const AnalyticsHub = lazy(() => import('./components/hubs/AnalyticsHub'));
const PolicyHub = lazy(() => import('./components/hubs/PolicyHub'));
const GovernanceHub = lazy(() => import('./components/hubs/GovernanceHub'));
const IncidentHub = lazy(() => import('./components/hubs/IncidentHub'));
const ProductHub = lazy(() => import('./components/hubs/ProductHub'));
const EvidenceHub = lazy(() => import('./components/hubs/EvidenceHub'));
const EnterpriseOpsHub = lazy(() => import('./components/hubs/EnterpriseOpsHub'));
const AIDocumentTools = lazy(() => import('./components/hubs/AIDocumentTools'));
const AIComplianceTools = lazy(() => import('./components/hubs/AIComplianceTools'));

// ── Lazy-loaded AI/regulatory modules (named exports) ─────────────────
const AIRMFDashboard = lazy(() => import('./components/AIRMFDashboard').then(m => ({ default: m.AIRMFDashboard })));
const AISystemList = lazy(() => import('./components/AISystemList').then(m => ({ default: m.AISystemList })));
const AISystemDetails = lazy(() => import('./components/AISystemDetails').then(m => ({ default: m.AISystemDetails })));
const AISystemCreate = lazy(() => import('./components/AISystemCreate').then(m => ({ default: m.AISystemCreate })));
const AIRMFAssessments = lazy(() => import('./components/AIRMFAssessments').then(m => ({ default: m.AIRMFAssessments })));
const EUAIActDashboard = lazy(() => import('./components/EUAIActDashboard').then(m => ({ default: m.EUAIActDashboard })));
const DMAGatekeeperManagement = lazy(() => import('./components/DMAGatekeeperManagement').then(m => ({ default: m.DMAGatekeeperManagement })));
const DSAPlatformManagement = lazy(() => import('./components/DSAPlatformManagement').then(m => ({ default: m.DSAPlatformManagement })));

// ── Lazy-loaded EU Regulations & US Privacy ──────────────────────────
const EUCRADashboard = lazy(() => import('./components/EUCRADashboard').then(m => ({ default: m.EUCRADashboard })));
const CSRDDashboard = lazy(() => import('./components/CSRDDashboard').then(m => ({ default: m.CSRDDashboard })));
const EcodesignDashboard = lazy(() => import('./components/EcodesignDashboard').then(m => ({ default: m.EcodesignDashboard })));
const NIS2Dashboard = lazy(() => import('./components/NIS2Dashboard').then(m => ({ default: m.NIS2Dashboard })));
const USPrivacyTracker = lazy(() => import('./components/USPrivacyTracker').then(m => ({ default: m.USPrivacyTracker })));

// ── Lazy-loaded standalone modules ───────────────────────────────────
const ACOSDashboard = lazy(() => import('./components/ACOSDashboard'));
const WorkspaceManagement = lazy(() => import('./components/WorkspaceManagement'));
const QuestionnaireManagement = lazy(() => import('./components/QuestionnaireManagement'));
const SOXComplianceDashboard = lazy(() => import('./components/SOXComplianceDashboard').then(m => ({ default: m.SOXComplianceDashboard })));
const DORADashboard = lazy(() => import('./components/DORADashboard').then(m => ({ default: m.DORADashboard })));
const PostMarketSurveillance = lazy(() => import('./components/PostMarketSurveillance').then(m => ({ default: m.PostMarketSurveillance })));
const PrivacyManagementPlatform = lazy(() => import('./components/PrivacyManagementPlatform').then(m => ({ default: m.PrivacyManagementPlatform })));
const AccountDeletionWorkflow = lazy(() => import('./components/AccountDeletionWorkflow').then(m => ({ default: m.AccountDeletionWorkflow })));
const AIComplianceCopilot = lazy(() => import('./components/AIComplianceCopilot').then(m => ({ default: m.AIComplianceCopilot })));
const ExecutiveDashboard = lazy(() => import('./components/ExecutiveDashboard'));
const ComplianceCalendar = lazy(() => import('./components/ComplianceCalendar'));
const MaturityAssessment = lazy(() => import('./components/MaturityAssessment'));
const RegulatoryChangeTracker = lazy(() => import('./components/RegulatoryChangeTracker'));
const SSOSettings = lazy(() => import('./components/SSOSettings'));
const SCIMSettings = lazy(() => import('./components/SCIMSettings'));
const RoleManager = lazy(() => import('./components/RoleManager'));
const BrandingSettings = lazy(() => import('./components/BrandingSettings'));
const TicketingIntegrations = lazy(() => import('./components/TicketingIntegrations'));
const AccessibilitySettings = lazy(() => import('./components/AccessibilitySettings'));
const OfflineBanner = lazy(() => import('./components/OfflineBanner'));
const NPSSurvey = lazy(() => import('./components/NPSSurvey'));
const UpdateAvailableBanner = lazy(() => import('./components/UpdateAvailableBanner'));
const DPIAWorkflow = lazy(() => import('./components/DPIAWorkflow'));
const RoPAManagement = lazy(() => import('./components/RoPAManagement'));
const CookieConsentBanner = lazy(() => import('./components/CookieConsentBanner'));
const PrivacyNoticeServing = lazy(() => import('./components/PrivacyNoticeServing'));

// ── Home OS Components ────────────────────────────────────────────────
const HomeOS = lazy(() => import('./components/HomeOS'));
const FeatureLibrary = lazy(() => import('./components/FeatureLibrary'));
const RiskCanvas = lazy(() => import('./components/RiskCanvas'));

// ── Loading Spinner ──────────────────────────────────────────────────
const LoadingSpinner = () => (
  <div className="flex h-full items-center justify-center p-8">
    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

// ── Framework Details Wrapper (extracts ID from URL params) ──────────
const FrameworkDetailsRoute: React.FC<{
  frameworks: ComplianceFramework[];
  loadData: () => void;
}> = ({ frameworks, loadData }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const framework = frameworks.find(f => f.id === id);

  return (
    <FrameworkDetails
      framework={framework}
      onBack={() => {
        loadData();
        navigate(ROUTES.FRAMEWORKS);
      }}
      onDataChanged={loadData}
    />
  );
};

// ── AI RMF Details Wrapper ──────────────────────────────────────────
const AIRMFDetailsRoute: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <AISystemDetails
      systemId={id || ''}
      onBack={() => navigate(ROUTES.AI_RMF_SYSTEMS)}
    />
  );
};

// ── Main Authenticated App ──────────────────────────────────────────
const MainApp: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([]);
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [swUpdateAvailable, setSwUpdateAvailable] = useState(false);

  // Service worker update detection
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg) {
          setSwRegistration(reg);
          if (reg.waiting) setSwUpdateAvailable(true);
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setSwUpdateAvailable(true);
                }
              });
            }
          });
        }
      });
    }
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const userPlan = normalizePlan(user?.organization?.plan);

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
    if (isAtLimit(user?.organization?.plan, 'maxFrameworks', frameworks.length)) {
      toast.warning(getUpgradeMessage(user?.organization?.plan, 'maxFrameworks', frameworks.length) || 'Framework limit reached. Upgrade in Settings.');
      return;
    }
    const newFw: ComplianceFramework = { id: 'temp', name, region: region || '', status: 'In Review', progress: 0, nextAuditDate: '2025-01-01' } as ComplianceFramework;
    setFrameworks([...frameworks, newFw]);
    await api.frameworks.create(newFw);
    loadData();
  };

  // Backward-compatible onNavigate for components that still use it
  const handleNavigate = (view: string) => {
    const { viewToPath } = require('./routes/routeConfig');
    navigate(viewToPath(view));
  };

  return (
    <OnboardingProvider onNavigate={handleNavigate}>
      <Layout>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Home OS (new AI-first home) */}
            <Route index element={<HomeOS />} />
            <Route path="dashboard" element={<HomeOS />} />

            {/* Classic Dashboard (accessible at /dashboard-classic) */}
            <Route path="dashboard-classic" element={<Dashboard frameworks={frameworks} risks={risks} onNavigate={handleNavigate} />} />

            {/* Home OS views */}
            <Route path="feature-library" element={<FeatureLibrary />} />
            <Route path="risk-canvas" element={<RiskCanvas />} />

            {/* ── Platform Core (consolidated hubs) ──────────────── */}
            <Route path="risks" element={<RiskHub />} />
            <Route path="issues" element={<IncidentHub />} />
            <Route path="vendors" element={<VendorHub />} />
            <Route path="policies" element={<PolicyHub />} />
            <Route path="integrations" element={<Integrations />} />
            <Route path="frameworks" element={
              <Frameworks
                activeFrameworks={frameworks}
                onAddFramework={handleAddFramework}
                onSelectFramework={(id: string) => navigate(`/frameworks/${id}`)}
                onFrameworkDeleted={loadData}
                maxFrameworks={getLimit(user?.organization?.plan, 'maxFrameworks')}
              />
            } />
            <Route path="frameworks/:id" element={<FrameworkDetailsRoute frameworks={frameworks} loadData={loadData} />} />

            {/* Settings */}
            <Route path="settings" element={
              user?.role === 'admin'
                ? <Settings onNavigateToIntegrations={() => navigate(ROUTES.INTEGRATIONS)} />
                : <Navigate to="/dashboard" replace />
            } />
            <Route path="settings/sso" element={<ProtectedRoute requiredRole="admin"><SSOSettings /></ProtectedRoute>} />
            <Route path="settings/scim" element={<ProtectedRoute requiredRole="admin"><SCIMSettings /></ProtectedRoute>} />
            <Route path="settings/roles" element={<ProtectedRoute requiredRole="admin"><RoleManager /></ProtectedRoute>} />
            <Route path="settings/branding" element={<ProtectedRoute requiredRole="admin"><BrandingSettings /></ProtectedRoute>} />
            <Route path="settings/accessibility" element={<AccessibilitySettings />} />

            {/* ── Reports & Audit (consolidated hubs) ────────────── */}
            <Route path="reports" element={<ReportingCenter />} />
            <Route path="audit" element={<AuditCenter />} />
            <Route path="monitoring" element={<AnalyticsHub />} />
            <Route path="executive" element={<ExecutiveDashboard />} />

            {/* ── AI Tool Hubs ────────────────────────────────────── */}
            <Route path="ai/document-tools" element={<AIDocumentTools />} />
            <Route path="ai/compliance-tools" element={<AIComplianceTools />} />

            {/* ── AI Feature Redirects → Hub tabs ─────────────────── */}
            <Route path="ai/policy-generator" element={<Navigate to="/policies?tab=ai-generator" replace />} />
            <Route path="ai/contract-analyzer" element={<Navigate to="/vendors?tab=contract-analyzer" replace />} />
            <Route path="ai/gap-analysis" element={<Navigate to="/ai/document-tools?tab=gap" replace />} />
            <Route path="ai/rfp-responder" element={<Navigate to="/ai/document-tools?tab=rfp" replace />} />
            <Route path="ai/bcp-generator" element={<Navigate to="/ai/document-tools?tab=bcp" replace />} />
            <Route path="ai/phishing-simulator" element={<Navigate to="/ai/compliance-tools?tab=phishing" replace />} />
            <Route path="ai/vendor-scorer" element={<Navigate to="/vendors?tab=risk-assessment" replace />} />
            <Route path="ai/data-mapper" element={<Navigate to="/ai/compliance-tools?tab=data-mapper" replace />} />
            <Route path="ai/cross-framework-mapper" element={<Navigate to="/ai/compliance-tools?tab=cross-mapper" replace />} />
            <Route path="ai/auto-remediation" element={<Navigate to="/ai/compliance-tools?tab=remediation" replace />} />
            <Route path="ai/evidence-checker" element={<Navigate to="/evidence?tab=checker" replace />} />
            <Route path="ai/agentic-vendor-risk" element={<Navigate to="/vendors?tab=agentic-risk" replace />} />
            <Route path="ai/audit-simulator" element={<Navigate to="/audit?tab=simulator" replace />} />
            <Route path="ai/compliance-query" element={<Navigate to="/ai/compliance-tools?tab=query" replace />} />
            <Route path="ai/report-generator" element={<Navigate to="/reports?tab=ai-generator" replace />} />
            <Route path="ai/compliance-forecasting" element={<Navigate to="/monitoring?tab=forecasting" replace />} />

            {/* AI Governance (NIST AI RMF) - unchanged */}
            <Route path="ai-rmf" element={
              <AIRMFDashboard
                onNavigate={(view: string, systemId?: string) => {
                  if (view === 'ai-rmf-systems') navigate(ROUTES.AI_RMF_SYSTEMS);
                  else if (view === 'ai-rmf-create') navigate(ROUTES.AI_RMF_CREATE);
                  else if (view === 'ai-rmf-assessments') navigate(ROUTES.AI_RMF_ASSESSMENTS);
                  else if (view === 'ai-rmf-details' && systemId) navigate(`/ai-rmf/systems/${systemId}`);
                }}
              />
            } />
            <Route path="ai-rmf/systems" element={
              <AISystemList
                onSelectSystem={(systemId: string) => navigate(`/ai-rmf/systems/${systemId}`)}
                onCreateNew={() => navigate(ROUTES.AI_RMF_CREATE)}
              />
            } />
            <Route path="ai-rmf/systems/new" element={
              <AISystemCreate
                onBack={() => navigate(ROUTES.AI_RMF)}
                onSuccess={(systemId: string) => navigate(`/ai-rmf/systems/${systemId}`)}
              />
            } />
            <Route path="ai-rmf/systems/:id" element={<AIRMFDetailsRoute />} />
            <Route path="ai-rmf/assessments" element={
              <AIRMFAssessments
                onBack={() => navigate(ROUTES.AI_RMF)}
                onViewSystem={(systemId: string) => navigate(`/ai-rmf/systems/${systemId}`)}
              />
            } />

            {/* EU Regulations - unchanged */}
            <Route path="regulations/eu-ai-act" element={<EUAIActDashboard />} />
            <Route path="regulations/dma" element={<DMAGatekeeperManagement />} />
            <Route path="regulations/dsa" element={<DSAPlatformManagement />} />
            <Route path="regulations/eu-cra" element={<EUCRADashboard />} />
            <Route path="regulations/csrd" element={<CSRDDashboard />} />
            <Route path="regulations/ecodesign" element={<EcodesignDashboard />} />
            <Route path="regulations/nis2" element={<NIS2Dashboard />} />
            <Route path="regulations/us-privacy" element={<USPrivacyTracker />} />

            {/* ── Governance (consolidated hub) ───────────────────── */}
            <Route path="governance" element={<GovernanceHub />} />
            <Route path="governance/sox" element={<SOXComplianceDashboard onBack={() => navigate(ROUTES.GOVERNANCE)} />} />
            {/* Governance sub-route redirects */}
            <Route path="governance/process-mapper" element={<Navigate to="/governance?tab=process-mapper" replace />} />
            <Route path="governance/sod" element={<Navigate to="/governance?tab=sod" replace />} />
            <Route path="governance/workflow-builder" element={<Navigate to="/governance?tab=workflow-builder" replace />} />

            {/* ── Products & Lifecycle (consolidated hub) ─────────── */}
            <Route path="products" element={<ProductHub />} />
            {/* Product sub-route redirects */}
            <Route path="products/ce-marking" element={<Navigate to="/products?tab=ce-marking" replace />} />
            <Route path="products/digital-passport" element={<Navigate to="/products?tab=digital-passport" replace />} />
            <Route path="products/lifecycle" element={<Navigate to="/products?tab=lifecycle" replace />} />
            <Route path="products/sbom" element={<Navigate to="/products?tab=sbom" replace />} />
            <Route path="products/decommissioning" element={<Navigate to="/products?tab=decommissioning" replace />} />
            <Route path="products/environmental-lifecycle" element={<Navigate to="/products?tab=environmental" replace />} />

            {/* ── Monitoring & Assurance ───────────────────────────── */}
            <Route path="surveillance" element={<PostMarketSurveillance onBack={() => navigate(ROUTES.DASHBOARD)} />} />

            {/* ── Evidence & Exceptions (consolidated hub) ────────── */}
            <Route path="evidence" element={<EvidenceHub />} />
            <Route path="evidence/:evidenceId" element={<EvidenceHub />} />

            {/* Privacy & Data - unchanged */}
            <Route path="privacy" element={<PrivacyManagementPlatform onBack={() => navigate(ROUTES.DASHBOARD)} />} />
            <Route path="privacy/data-deletion" element={<AccountDeletionWorkflow onBack={() => navigate(ROUTES.PRIVACY)} />} />
            <Route path="privacy/dpia" element={<DPIAWorkflow onBack={() => navigate(ROUTES.PRIVACY)} />} />
            <Route path="privacy/ropa" element={<RoPAManagement onBack={() => navigate(ROUTES.PRIVACY)} />} />
            <Route path="privacy/notices" element={<PrivacyNoticeServing onBack={() => navigate(ROUTES.PRIVACY)} />} />

            {/* ── Enterprise (consolidated hub for ops) ───────────── */}
            <Route path="enterprise/workspaces" element={<WorkspaceManagement />} />
            <Route path="enterprise/security-ops" element={<EnterpriseOpsHub />} />
            <Route path="enterprise/questionnaires" element={<QuestionnaireManagement />} />
            <Route path="enterprise/acos" element={<ACOSDashboard onBack={() => navigate(ROUTES.DASHBOARD)} onNavigate={handleNavigate} />} />
            <Route path="enterprise/dora" element={<DORADashboard onBack={() => navigate(ROUTES.DASHBOARD)} />} />
            {/* Enterprise sub-route redirects */}
            <Route path="enterprise/security" element={<Navigate to="/enterprise/security-ops?tab=security" replace />} />
            <Route path="enterprise/mdm" element={<Navigate to="/enterprise/security-ops?tab=mdm" replace />} />
            <Route path="enterprise/auditor" element={<Navigate to="/audit?tab=auditor" replace />} />

            {/* ── Standalone modules (not consolidated) ───────────── */}
            <Route path="calendar" element={<ComplianceCalendar />} />
            <Route path="maturity" element={<MaturityAssessment />} />
            <Route path="regulatory-changes" element={<RegulatoryChangeTracker />} />
            <Route path="search" element={<GlobalSearch />} />
            <Route path="notifications" element={<NotificationCenter />} />
            <Route path="ticketing" element={<TicketingIntegrations />} />

            {/* ── Old route redirects → consolidated hubs ─────────── */}
            <Route path="tasks" element={<Navigate to="/risks?tab=tasks" replace />} />
            <Route path="incidents" element={<Navigate to="/issues?tab=incidents" replace />} />
            <Route path="incidents/:id" element={<Navigate to="/issues?tab=incidents" replace />} />
            <Route path="assets" element={<Navigate to="/enterprise/security-ops?tab=assets" replace />} />
            <Route path="assets/:id" element={<Navigate to="/enterprise/security-ops?tab=assets" replace />} />
            <Route path="breach-notification" element={<Navigate to="/issues?tab=breach" replace />} />
            <Route path="esg-reporting" element={<Navigate to="/reports?tab=esg" replace />} />
            <Route path="analytics" element={<Navigate to="/monitoring?tab=analytics" replace />} />
            <Route path="report-builder" element={<Navigate to="/reports?tab=builder" replace />} />
            <Route path="cost-analytics" element={<Navigate to="/monitoring?tab=costs" replace />} />
            <Route path="audit-prep" element={<Navigate to="/audit?tab=preparation" replace />} />
            <Route path="control-testing" element={<Navigate to="/audit?tab=testing" replace />} />
            <Route path="vendor-monitoring" element={<Navigate to="/vendors?tab=monitoring" replace />} />
            <Route path="risk-heatmap" element={<Navigate to="/risks?tab=heatmap" replace />} />
            <Route path="evidence-collection" element={<Navigate to="/evidence?tab=collection" replace />} />
            <Route path="exceptions" element={<Navigate to="/evidence?tab=exceptions" replace />} />
            <Route path="certifications" element={<Navigate to="/products?tab=certifications" replace />} />
            <Route path="business-impact-analysis" element={<Navigate to="/enterprise/security-ops?tab=bia" replace />} />
            <Route path="cicd-gates" element={<Navigate to="/enterprise/security-ops?tab=cicd" replace />} />
            <Route path="security-training" element={<Navigate to="/enterprise/security-ops?tab=training" replace />} />
            <Route path="workflow-automation" element={<Navigate to="/governance?tab=automation" replace />} />

            {/* Catch-all: redirect to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
        {/* AI Compliance Copilot Sidebar */}
        <AIComplianceCopilot currentView="dashboard" isOpen={isCopilotOpen} onClose={() => setIsCopilotOpen(false)} />
      </Layout>
      {/* Global Banners */}
      <Suspense fallback={null}>
        <OfflineBanner />
        <UpdateAvailableBanner isUpdateAvailable={swUpdateAvailable} registration={swRegistration} />
        <CookieConsentBanner />
        <NPSSurvey />
      </Suspense>
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
      <Toaster richColors position="top-right" />
      <QueryProvider>
      <I18nProvider>
      <ThemeProvider>
        <AuthProvider>
        <WebSocketProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/signup" element={<PublicPageWrapper><SignupPage /></PublicPageWrapper>} />
            <Route path="/learn" element={<PublicPageWrapper><LearnPage /></PublicPageWrapper>} />
            <Route path="/community" element={<PublicPageWrapper><CommunityPage /></PublicPageWrapper>} />
            <Route path="/status" element={<PublicPageWrapper><StatusPage /></PublicPageWrapper>} />
            <Route path="/docs" element={<PublicPageWrapper><DocsPage /></PublicPageWrapper>} />
            <Route path="/docs/*" element={<PublicPageWrapper><DocsPage /></PublicPageWrapper>} />

            {/* Landing page at root for unauthenticated users */}
            <Route path="/" element={<AuthGate />} />

            {/* Authenticated App Routes */}
            <Route path="/*" element={
              <ProtectedRoute>
                <MainApp />
              </ProtectedRoute>
            } />
          </Routes>
        </WebSocketProvider>
        </AuthProvider>
      </ThemeProvider>
      </I18nProvider>
      </QueryProvider>
    </BrowserRouter>
  );
};

/** Shows landing page or redirects to dashboard based on auth state */
const AuthGate: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />;
};

export default App;
