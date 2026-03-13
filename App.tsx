
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

// ── Lazy-loaded New Modules: SOX, SoD, MDM, DORA, Auditor, Workflow, Privacy ──
const SOXComplianceDashboard = lazy(() => import('./components/SOXComplianceDashboard').then(m => ({ default: m.SOXComplianceDashboard })));
const SoDAnalysisDashboard = lazy(() => import('./components/SoDAnalysisDashboard').then(m => ({ default: m.SoDAnalysisDashboard })));
const MDMDashboard = lazy(() => import('./components/MDMDashboard').then(m => ({ default: m.MDMDashboard })));
const DORADashboard = lazy(() => import('./components/DORADashboard').then(m => ({ default: m.DORADashboard })));
const AuditorHub = lazy(() => import('./components/AuditorHub').then(m => ({ default: m.AuditorHub })));
const WorkflowBuilderComponent = lazy(() => import('./components/WorkflowBuilder').then(m => ({ default: m.WorkflowBuilder })));
const PrivacyManagementPlatform = lazy(() => import('./components/PrivacyManagementPlatform').then(m => ({ default: m.PrivacyManagementPlatform })));
const AccountDeletionWorkflow = lazy(() => import('./components/AccountDeletionWorkflow').then(m => ({ default: m.AccountDeletionWorkflow })));

// ── New Enhancement Module Lazy Loads ─────────────────────────────────
const IncidentManagement = lazy(() => import('./components/IncidentManagement'));
const AssetManagement = lazy(() => import('./components/AssetManagement'));
const ComplianceCalendar = lazy(() => import('./components/ComplianceCalendar'));
const MaturityAssessment = lazy(() => import('./components/MaturityAssessment'));
const BusinessImpactAnalysis = lazy(() => import('./components/BusinessImpactAnalysis'));
const ExceptionManagement = lazy(() => import('./components/ExceptionManagement'));
const CertificationTracker = lazy(() => import('./components/CertificationTracker'));
const ComplianceCostDashboard = lazy(() => import('./components/ComplianceCostDashboard'));
const ExecutiveDashboard = lazy(() => import('./components/ExecutiveDashboard'));
const ReportBuilder = lazy(() => import('./components/ReportBuilder'));
const GlobalSearch = lazy(() => import('./components/GlobalSearch'));
const RegulatoryChangeTracker = lazy(() => import('./components/RegulatoryChangeTracker'));
const EvidenceCollectionRules = lazy(() => import('./components/EvidenceCollectionRules'));
const AuditPrepAssistant = lazy(() => import('./components/AuditPrepAssistant'));
const ControlTestResults = lazy(() => import('./components/ControlTestResults'));
const VendorMonitoringDashboard = lazy(() => import('./components/VendorMonitoringDashboard'));
const CICDGateSettings = lazy(() => import('./components/CICDGateSettings'));
const SSOSettings = lazy(() => import('./components/SSOSettings'));
const SCIMSettings = lazy(() => import('./components/SCIMSettings'));
const RoleManager = lazy(() => import('./components/RoleManager'));
const BrandingSettings = lazy(() => import('./components/BrandingSettings'));
const RiskHeatMap = lazy(() => import('./components/RiskHeatMap'));
const NotificationCenter = lazy(() => import('./components/NotificationCenter'));
const WorkflowAutomationRules = lazy(() => import('./components/WorkflowAutomationRules'));
const TicketingIntegrations = lazy(() => import('./components/TicketingIntegrations'));
const AccessibilitySettings = lazy(() => import('./components/AccessibilitySettings'));
const OfflineBanner = lazy(() => import('./components/OfflineBanner'));
const UpdateAvailableBanner = lazy(() => import('./components/UpdateAvailableBanner'));
const DPIAWorkflow = lazy(() => import('./components/DPIAWorkflow'));
const RoPAManagement = lazy(() => import('./components/RoPAManagement'));
const SecurityTrainingDashboard = lazy(() => import('./components/SecurityTrainingDashboard'));
const CookieConsentBanner = lazy(() => import('./components/CookieConsentBanner'));
const PrivacyNoticeServing = lazy(() => import('./components/PrivacyNoticeServing'));

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
            {/* Dashboard */}
            <Route index element={<Dashboard frameworks={frameworks} risks={risks} onNavigate={handleNavigate} />} />

            {/* Platform Core */}
            <Route path="tasks" element={<MyTasks />} />
            <Route path="risks" element={<RiskManagement onBack={() => navigate(ROUTES.DASHBOARD)} />} />
            <Route path="issues" element={<IssueManagement />} />
            <Route path="vendors" element={<VendorManagement onBack={() => navigate(ROUTES.DASHBOARD)} />} />
            <Route path="policies" element={<PolicyManagement onBack={() => navigate(ROUTES.DASHBOARD)} />} />
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

            {/* Reports & Audit */}
            <Route path="reports" element={<Reports />} />
            <Route path="audit" element={<AuditTrail />} />
            <Route path="monitoring" element={<MonitoringDashboard />} />
            <Route path="analytics" element={<RealTimeAnalytics onBack={() => navigate(ROUTES.DASHBOARD)} />} />

            {/* AI Features */}
            <Route path="ai/policy-generator" element={<PolicyGenerator onBack={() => navigate(ROUTES.DASHBOARD)} />} />
            <Route path="ai/contract-analyzer" element={<ContractAnalyzer onBack={() => navigate(ROUTES.DASHBOARD)} />} />
            <Route path="ai/gap-analysis" element={<GapAnalysis onBack={() => navigate(ROUTES.DASHBOARD)} />} />
            <Route path="ai/rfp-responder" element={<RFPResponder onBack={() => navigate(ROUTES.DASHBOARD)} />} />
            <Route path="ai/phishing-simulator" element={<PhishingGenerator onBack={() => navigate(ROUTES.DASHBOARD)} />} />
            <Route path="ai/vendor-scorer" element={<VendorScorer onBack={() => navigate(ROUTES.DASHBOARD)} />} />
            <Route path="ai/data-mapper" element={<DataMapper onBack={() => navigate(ROUTES.DASHBOARD)} />} />
            <Route path="ai/bcp-generator" element={<BCPGenerator onBack={() => navigate(ROUTES.DASHBOARD)} />} />
            <Route path="ai/cross-framework-mapper" element={<CrossFrameworkMapper onBack={() => navigate(ROUTES.DASHBOARD)} />} />
            <Route path="ai/auto-remediation" element={<RegulatoryAutoRemediation onBack={() => navigate(ROUTES.DASHBOARD)} />} />
            <Route path="ai/evidence-checker" element={<EvidenceCompletenessChecker onBack={() => navigate(ROUTES.DASHBOARD)} />} />
            <Route path="ai/agentic-vendor-risk" element={<AgenticVendorRisk onBack={() => navigate(ROUTES.DASHBOARD)} />} />
            <Route path="ai/audit-simulator" element={<AuditSimulator onBack={() => navigate(ROUTES.DASHBOARD)} />} />
            <Route path="ai/compliance-query" element={<NaturalLanguageQuery onBack={() => navigate(ROUTES.DASHBOARD)} />} />
            <Route path="ai/compliance-forecasting" element={<ComplianceScoreForecasting onBack={() => navigate(ROUTES.DASHBOARD)} />} />

            {/* AI Governance (NIST AI RMF) */}
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

            {/* EU Regulations */}
            <Route path="regulations/eu-ai-act" element={<EUAIActDashboard />} />
            <Route path="regulations/dma" element={<DMAGatekeeperManagement />} />
            <Route path="regulations/dsa" element={<DSAPlatformManagement />} />
            <Route path="regulations/eu-cra" element={<EUCRADashboard />} />
            <Route path="regulations/csrd" element={<CSRDDashboard />} />
            <Route path="regulations/ecodesign" element={<EcodesignDashboard />} />
            <Route path="regulations/nis2" element={<NIS2Dashboard />} />
            <Route path="regulations/us-privacy" element={<USPrivacyTracker />} />

            {/* Governance & Process */}
            <Route path="governance" element={<GovernanceManager onBack={() => navigate(ROUTES.DASHBOARD)} />} />
            <Route path="governance/process-mapper" element={<ProcessMapper onBack={() => navigate(ROUTES.DASHBOARD)} />} />
            <Route path="governance/sox" element={<SOXComplianceDashboard onBack={() => navigate(ROUTES.DASHBOARD)} />} />
            <Route path="governance/sod" element={<SoDAnalysisDashboard onBack={() => navigate(ROUTES.DASHBOARD)} />} />
            <Route path="governance/workflow-builder" element={<WorkflowBuilderComponent onBack={() => navigate(ROUTES.DASHBOARD)} />} />

            {/* Products & Lifecycle */}
            <Route path="products/ce-marking" element={<CEMarkingWorkflow onBack={() => navigate(ROUTES.DASHBOARD)} />} />
            <Route path="products/digital-passport" element={<DigitalProductPassport onBack={() => navigate(ROUTES.DASHBOARD)} />} />
            <Route path="products/lifecycle" element={<ProductLifecycleTracker onBack={() => navigate(ROUTES.DASHBOARD)} />} />
            <Route path="products/sbom" element={<SBOMManager onBack={() => navigate(ROUTES.DASHBOARD)} />} />
            <Route path="products/decommissioning" element={<ProductDecommissioning onBack={() => navigate(ROUTES.DASHBOARD)} />} />
            <Route path="products/environmental-lifecycle" element={<EnvironmentalLifecycle onBack={() => navigate(ROUTES.DASHBOARD)} />} />

            {/* Monitoring & Assurance */}
            <Route path="esg-reporting" element={<ESGReportingModule onBack={() => navigate(ROUTES.DASHBOARD)} />} />
            <Route path="surveillance" element={<PostMarketSurveillance onBack={() => navigate(ROUTES.DASHBOARD)} />} />
            <Route path="breach-notification" element={<BreachNotificationWizard onBack={() => navigate(ROUTES.DASHBOARD)} />} />

            {/* Privacy & Data */}
            <Route path="privacy" element={<PrivacyManagementPlatform onBack={() => navigate(ROUTES.DASHBOARD)} />} />
            <Route path="privacy/data-deletion" element={<AccountDeletionWorkflow onBack={() => navigate(ROUTES.PRIVACY)} />} />
            <Route path="privacy/dpia" element={<DPIAWorkflow onBack={() => navigate(ROUTES.PRIVACY)} />} />
            <Route path="privacy/ropa" element={<RoPAManagement onBack={() => navigate(ROUTES.PRIVACY)} />} />
            <Route path="privacy/notices" element={<PrivacyNoticeServing onBack={() => navigate(ROUTES.PRIVACY)} />} />

            {/* Security Training */}
            <Route path="security-training" element={<SecurityTrainingDashboard onBack={() => navigate(ROUTES.DASHBOARD)} />} />

            {/* Enterprise */}
            <Route path="enterprise/workspaces" element={<WorkspaceManagement />} />
            <Route path="enterprise/questionnaires" element={<QuestionnaireManagement />} />
            <Route path="enterprise/security" element={<SecurityFeatures onBack={() => navigate(ROUTES.DASHBOARD)} />} />
            <Route path="enterprise/acos" element={<ACOSDashboard onBack={() => navigate(ROUTES.DASHBOARD)} onNavigate={handleNavigate} />} />
            <Route path="enterprise/mdm" element={<MDMDashboard onBack={() => navigate(ROUTES.DASHBOARD)} />} />
            <Route path="enterprise/dora" element={<DORADashboard onBack={() => navigate(ROUTES.DASHBOARD)} />} />
            <Route path="enterprise/auditor" element={<AuditorHub onBack={() => navigate(ROUTES.DASHBOARD)} />} />

            {/* ── NEW ENHANCEMENT MODULES ────────────────────────────── */}

            {/* Incident Management (4.3) */}
            <Route path="incidents" element={<IncidentManagement />} />
            <Route path="incidents/:id" element={<IncidentManagement />} />

            {/* IT Asset Management (4.4) */}
            <Route path="assets" element={<AssetManagement />} />
            <Route path="assets/:id" element={<AssetManagement />} />

            {/* Compliance Calendar (4.1) */}
            <Route path="calendar" element={<ComplianceCalendar />} />

            {/* GRC Maturity Model (4.2) */}
            <Route path="maturity" element={<MaturityAssessment />} />

            {/* Business Impact Analysis (4.5) */}
            <Route path="business-impact-analysis" element={<BusinessImpactAnalysis />} />

            {/* Exception Management (4.9) */}
            <Route path="exceptions" element={<ExceptionManagement />} />

            {/* Certification Lifecycle (4.10) */}
            <Route path="certifications" element={<CertificationTracker />} />

            {/* Compliance Cost Analytics (4.7) */}
            <Route path="cost-analytics" element={<ComplianceCostDashboard />} />

            {/* Executive Dashboard (4.8) */}
            <Route path="executive" element={<ExecutiveDashboard />} />

            {/* Custom Report Builder (6.1) */}
            <Route path="report-builder" element={<ReportBuilder />} />

            {/* Regulatory Change Tracker (3.1) */}
            <Route path="regulatory-changes" element={<RegulatoryChangeTracker />} />

            {/* Evidence Auto-Collection (3.2) */}
            <Route path="evidence-collection" element={<EvidenceCollectionRules />} />

            {/* AI Audit Prep (3.3) */}
            <Route path="audit-prep" element={<AuditPrepAssistant />} />

            {/* Control Testing (3.4) */}
            <Route path="control-testing" element={<ControlTestResults />} />

            {/* Vendor Continuous Monitoring (4.11) */}
            <Route path="vendor-monitoring" element={<VendorMonitoringDashboard />} />

            {/* CI/CD Compliance Gates (5.2) */}
            <Route path="cicd-gates" element={<CICDGateSettings />} />

            {/* Global Search (1.3) */}
            <Route path="search" element={<GlobalSearch />} />

            {/* Risk Heat Map (6.2) */}
            <Route path="risk-heatmap" element={<RiskHeatMap />} />

            {/* Notification Center */}
            <Route path="notifications" element={<NotificationCenter />} />

            {/* Workflow Automation Rules (5.1) */}
            <Route path="workflow-automation" element={<WorkflowAutomationRules />} />

            {/* Ticketing Integrations (5.3) */}
            <Route path="ticketing" element={<TicketingIntegrations />} />

            {/* Accessibility Settings (7.2) */}
            <Route path="settings/accessibility" element={<AccessibilitySettings />} />

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
