import React, { useState, useMemo, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { normalizePlan, canAccessView } from '../constants/tierFeatures';
import { pathToView, viewToPath, getBreadcrumbs, ROUTES } from '../routes/routeConfig';
import {
  LayoutDashboard, FileText, ShieldCheck, Settings, LogOut, Menu, X,
  Activity, Search, Bell, Lock, Sparkles, Briefcase, GitGraph, Mail, ShieldAlert, Database, LifeBuoy, CheckSquare, Layers, Brain,
  Users, FileCheck, Monitor, Building2, ClipboardList, AlertTriangle,
  ChevronDown, ChevronRight, Command, Home,
  Shield, Globe, Leaf, Network, MapPin, Workflow, UserCheck, Award, Package,
  Recycle, AlertOctagon, FileCode, Trash2, TreePine, TrendingUp, Target,
  ScanSearch, Bot, MessageSquare, Crosshair,
  Smartphone, Scale, Landmark, BookOpen, Eye, UserX, Fingerprint,
  Calendar, BarChart3, PieChart, Boxes, Key, FileWarning, BadgeCheck,
  DollarSign, Gauge, Radar, TestTube, Satellite, GitBranch
} from 'lucide-react';
import { ComplianceChat } from './ComplianceChat';
import { OnboardingOverlay, OnboardingChecklistWidget } from './Onboarding';
import { CommandPalette } from './CommandPalette';
import GlobalSearch from './GlobalSearch';
import NotificationCenter from './NotificationCenter';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggleCompact } from './ThemeToggle';
import { Breadcrumbs } from './Breadcrumbs';
import { useI18n } from '../contexts/I18nContext';

interface LayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  roles: string[];
  relatedPaths?: string[];
}

interface AiToolItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
}

interface NavSection {
  key: string;
  label: string;
  collapsible: boolean;
  items: NavItem[];
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isGlobalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const currentPath = location.pathname;

  // Global Search keyboard shortcut (Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setGlobalSearchOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navItems: NavItem[] = [
    // Platform
    { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard, path: ROUTES.DASHBOARD, roles: ['admin', 'editor', 'viewer'] },
    { id: 'my-tasks', label: t('nav.tasks'), icon: CheckSquare, path: ROUTES.MY_TASKS, roles: ['admin', 'editor', 'viewer'] },
    { id: 'risks', label: t('nav.risks'), icon: ShieldAlert, path: ROUTES.RISKS, roles: ['admin', 'editor', 'viewer'] },
    { id: 'issues', label: t('nav.issues'), icon: AlertTriangle, path: ROUTES.ISSUES, roles: ['admin', 'editor', 'viewer'] },
    { id: 'vendors', label: t('nav.vendors'), icon: Users, path: ROUTES.VENDORS, roles: ['admin', 'editor', 'viewer'] },
    { id: 'policies', label: t('nav.policies'), icon: FileCheck, path: ROUTES.POLICIES, roles: ['admin', 'editor'] },
    { id: 'integrations', label: t('nav.integrations'), icon: Layers, path: ROUTES.INTEGRATIONS, roles: ['admin', 'editor', 'viewer'] },
    { id: 'frameworks', label: t('nav.frameworks'), icon: ShieldCheck, path: ROUTES.FRAMEWORKS, roles: ['admin', 'editor'], relatedPaths: ['/frameworks/'] },
    // Regulatory
    { id: 'ai-rmf', label: t('nav.nistAiRmf'), icon: Brain, path: ROUTES.AI_RMF, roles: ['admin', 'editor', 'viewer'], relatedPaths: ['/ai-rmf/'] },
    { id: 'eu-ai-act', label: t('nav.euAiAct'), icon: ShieldCheck, path: ROUTES.EU_AI_ACT, roles: ['admin', 'editor', 'viewer'] },
    { id: 'eu-cra', label: t('nav.euCra'), icon: Shield, path: ROUTES.EU_CRA, roles: ['admin', 'editor', 'viewer'] },
    { id: 'csrd', label: t('nav.csrdEsg'), icon: Leaf, path: ROUTES.CSRD, roles: ['admin', 'editor', 'viewer'] },
    { id: 'ecodesign', label: t('nav.ecodesign'), icon: Recycle, path: ROUTES.ECODESIGN, roles: ['admin', 'editor', 'viewer'] },
    { id: 'nis2', label: t('nav.nis2'), icon: Network, path: ROUTES.NIS2, roles: ['admin', 'editor', 'viewer'] },
    { id: 'dma', label: t('nav.dma'), icon: ShieldCheck, path: ROUTES.DMA, roles: ['admin', 'editor', 'viewer'] },
    { id: 'dsa', label: t('nav.dsa'), icon: ShieldCheck, path: ROUTES.DSA, roles: ['admin', 'editor', 'viewer'] },
    { id: 'us-privacy', label: t('nav.usPrivacy'), icon: MapPin, path: ROUTES.US_PRIVACY, roles: ['admin', 'editor', 'viewer'] },
    // Governance & Process
    { id: 'governance', label: t('nav.governance'), icon: UserCheck, path: ROUTES.GOVERNANCE, roles: ['admin', 'editor'] },
    { id: 'dpo-designation', label: t('nav.dpoDesignation'), icon: Key, path: ROUTES.GOVERNANCE, roles: ['admin'] },
    { id: 'process-mapper', label: t('nav.processMapper'), icon: Workflow, path: ROUTES.PROCESS_MAPPER, roles: ['admin', 'editor'] },
    { id: 'sox', label: t('nav.soxCompliance'), icon: Landmark, path: ROUTES.SOX, roles: ['admin', 'editor', 'viewer'] },
    { id: 'sod', label: t('nav.sodAnalysis'), icon: Scale, path: ROUTES.SOD, roles: ['admin', 'editor'] },
    { id: 'workflow-builder', label: t('nav.workflowBuilder'), icon: Workflow, path: ROUTES.WORKFLOW_BUILDER, roles: ['admin', 'editor'] },
    // Cert & Products
    { id: 'ce-marking', label: t('nav.ceMarking'), icon: Award, path: ROUTES.CE_MARKING, roles: ['admin', 'editor'] },
    { id: 'digital-product-passport', label: t('nav.digitalPassport'), icon: Package, path: ROUTES.DIGITAL_PRODUCT_PASSPORT, roles: ['admin', 'editor'] },
    { id: 'product-lifecycle', label: t('nav.productLifecycle'), icon: Recycle, path: ROUTES.PRODUCT_LIFECYCLE, roles: ['admin', 'editor'] },
    { id: 'sbom-manager', label: t('nav.sbomManager'), icon: FileCode, path: ROUTES.SBOM_MANAGER, roles: ['admin', 'editor'] },
    { id: 'product-decommissioning', label: t('nav.decommissioning'), icon: Trash2, path: ROUTES.PRODUCT_DECOMMISSIONING, roles: ['admin', 'editor'] },
    { id: 'environmental-lifecycle', label: t('nav.envLifecycle'), icon: TreePine, path: ROUTES.ENVIRONMENTAL_LIFECYCLE, roles: ['admin', 'editor'] },
    // Monitoring & Assurance
    { id: 'esg-reporting', label: t('nav.esgReporting'), icon: TreePine, path: ROUTES.ESG_REPORTING, roles: ['admin', 'editor', 'viewer'] },
    { id: 'post-market-surveillance', label: t('nav.surveillance'), icon: ScanSearch, path: ROUTES.POST_MARKET_SURVEILLANCE, roles: ['admin', 'editor'] },
    { id: 'compliance-forecasting', label: t('nav.scoreForecast'), icon: TrendingUp, path: ROUTES.COMPLIANCE_FORECASTING, roles: ['admin', 'editor', 'viewer'] },
    { id: 'breach-wizard', label: t('nav.breachWizard'), icon: AlertOctagon, path: ROUTES.BREACH_WIZARD, roles: ['admin', 'editor'] },
    // Reports & Audit
    { id: 'reports', label: t('nav.reports'), icon: FileText, path: ROUTES.REPORTS, roles: ['admin', 'editor', 'viewer'] },
    { id: 'audit', label: t('nav.auditTrail'), icon: Activity, path: ROUTES.AUDIT_TRAIL, roles: ['admin', 'editor'] },
    { id: 'monitoring', label: t('nav.monitoring'), icon: Monitor, path: ROUTES.MONITORING, roles: ['admin', 'editor', 'viewer'] },
    { id: 'analytics', label: t('nav.analytics'), icon: Activity, path: ROUTES.ANALYTICS, roles: ['admin', 'editor', 'viewer'] },
    { id: 'auditor', label: t('nav.auditorHub'), icon: BookOpen, path: ROUTES.AUDITOR, roles: ['admin', 'editor', 'viewer'] },
    // Privacy & Data
    { id: 'privacy', label: t('nav.privacyPlatform'), icon: Fingerprint, path: ROUTES.PRIVACY, roles: ['admin', 'editor', 'viewer'] },
    { id: 'dpia', label: t('nav.dpia'), icon: Eye, path: ROUTES.DPIA, roles: ['admin', 'editor'] },
    { id: 'ropa', label: t('nav.ropa'), icon: ClipboardList, path: ROUTES.ROPA, roles: ['admin', 'editor'] },
    { id: 'privacy-notices', label: t('nav.privacyNotices'), icon: FileText, path: ROUTES.PRIVACY_NOTICES, roles: ['admin', 'editor'] },
    { id: 'account-deletion', label: t('nav.dataDeletion'), icon: UserX, path: ROUTES.ACCOUNT_DELETION, roles: ['admin', 'editor'] },
    // Enterprise
    { id: 'workspaces', label: t('nav.workspaces'), icon: Building2, path: ROUTES.WORKSPACES, roles: ['admin', 'editor'] },
    { id: 'questionnaires', label: t('nav.questionnaires'), icon: ClipboardList, path: ROUTES.QUESTIONNAIRES, roles: ['admin', 'editor', 'viewer'] },
    { id: 'security', label: t('nav.securityFeatures'), icon: Lock, path: ROUTES.SECURITY, roles: ['admin', 'editor'] },
    { id: 'acos', label: t('nav.acos'), icon: Brain, path: ROUTES.ACOS, roles: ['admin', 'editor'] },
    { id: 'mdm', label: t('nav.mdm'), icon: Smartphone, path: ROUTES.MDM, roles: ['admin', 'editor'] },
    { id: 'dora', label: t('nav.dora'), icon: Shield, path: ROUTES.DORA, roles: ['admin', 'editor', 'viewer'] },
    // ── New Enhancement Modules ──
    { id: 'incidents', label: t('nav.incidents'), icon: AlertOctagon, path: ROUTES.INCIDENTS, roles: ['admin', 'editor', 'viewer'], relatedPaths: ['/incidents/'] },
    { id: 'assets', label: t('nav.assets'), icon: Boxes, path: ROUTES.ASSETS, roles: ['admin', 'editor', 'viewer'], relatedPaths: ['/assets/'] },
    { id: 'calendar', label: t('nav.calendar'), icon: Calendar, path: ROUTES.CALENDAR, roles: ['admin', 'editor', 'viewer'] },
    { id: 'maturity', label: t('nav.maturity'), icon: Gauge, path: ROUTES.MATURITY, roles: ['admin', 'editor'] },
    { id: 'bia', label: t('nav.bia'), icon: Radar, path: ROUTES.BIA, roles: ['admin', 'editor'] },
    { id: 'exceptions', label: t('nav.exceptions'), icon: FileWarning, path: ROUTES.EXCEPTIONS, roles: ['admin', 'editor', 'viewer'] },
    { id: 'certifications', label: t('nav.certifications'), icon: BadgeCheck, path: ROUTES.CERTIFICATIONS, roles: ['admin', 'editor', 'viewer'] },
    { id: 'cost-analytics', label: t('nav.costs'), icon: DollarSign, path: ROUTES.COST_ANALYTICS, roles: ['admin', 'editor'] },
    { id: 'executive', label: t('nav.executive'), icon: PieChart, path: ROUTES.EXECUTIVE_DASHBOARD, roles: ['admin', 'editor', 'viewer'] },
    { id: 'report-builder', label: t('nav.reportBuilder'), icon: BarChart3, path: ROUTES.REPORT_BUILDER, roles: ['admin', 'editor'] },
    { id: 'regulatory-changes', label: t('nav.regChanges'), icon: Globe, path: ROUTES.REGULATORY_CHANGES, roles: ['admin', 'editor', 'viewer'] },
    { id: 'evidence-collection', label: t('nav.evidenceCollection'), icon: ScanSearch, path: ROUTES.EVIDENCE_COLLECTION, roles: ['admin', 'editor'] },
    { id: 'audit-prep', label: t('nav.auditPrep'), icon: Target, path: ROUTES.AUDIT_PREP, roles: ['admin', 'editor'] },
    { id: 'control-testing', label: t('nav.controlTesting'), icon: TestTube, path: ROUTES.CONTROL_TESTING, roles: ['admin', 'editor'] },
    { id: 'vendor-monitoring', label: t('nav.vendorMonitoring'), icon: Satellite, path: ROUTES.VENDOR_MONITORING, roles: ['admin', 'editor', 'viewer'] },
    { id: 'cicd-gates', label: t('nav.cicdGates'), icon: GitBranch, path: ROUTES.CICD_GATES, roles: ['admin', 'editor'] },
    { id: 'security-training', label: t('nav.securityTraining'), icon: BookOpen, path: ROUTES.SECURITY_TRAINING, roles: ['admin', 'editor'] },
  ];

  const aiTools: AiToolItem[] = [
    { id: 'ai-policy', label: t('nav.aiPolicyGenerator'), icon: Sparkles, path: ROUTES.AI_POLICY },
    { id: 'ai-contract', label: t('nav.aiContractAnalyzer'), icon: Briefcase, path: ROUTES.AI_CONTRACT },
    { id: 'ai-gap', label: t('nav.aiGapAnalysis'), icon: GitGraph, path: ROUTES.AI_GAP },
    { id: 'ai-rfp', label: t('nav.aiRfpResponder'), icon: FileText, path: ROUTES.AI_RFP },
    { id: 'ai-phishing', label: t('nav.aiPhishingSim'), icon: Mail, path: ROUTES.AI_PHISHING },
    { id: 'ai-vendor', label: t('nav.aiVendorRisk'), icon: ShieldAlert, path: ROUTES.AI_VENDOR },
    { id: 'ai-data-map', label: t('nav.aiGdprMapper'), icon: Database, path: ROUTES.AI_DATA_MAP },
    { id: 'ai-bcp', label: t('nav.aiBcpGenerator'), icon: LifeBuoy, path: ROUTES.AI_BCP },
    { id: 'ai-cross-mapper', label: t('nav.aiControlMapper'), icon: GitGraph, path: ROUTES.AI_CROSS_MAPPER },
    { id: 'ai-auto-remediation', label: t('nav.aiAutoRemediation'), icon: Bot, path: ROUTES.AI_AUTO_REMEDIATION },
    { id: 'ai-evidence-checker', label: t('nav.aiEvidenceChecker'), icon: ScanSearch, path: ROUTES.AI_EVIDENCE_CHECKER },
    { id: 'ai-agentic-vendor', label: t('nav.aiAgenticVrm'), icon: Target, path: ROUTES.AI_AGENTIC_VENDOR },
    { id: 'ai-audit-simulator', label: t('nav.aiAuditSimulator'), icon: Crosshair, path: ROUTES.AI_AUDIT_SIMULATOR },
    { id: 'ai-nl-query', label: t('nav.aiComplianceQuery'), icon: MessageSquare, path: ROUTES.AI_NL_QUERY },
  ];

  const userPlan = normalizePlan(user?.organization?.plan);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const navItemsFiltered = useMemo(
    () => navItems.filter((item) => canAccessView(userPlan, item.id)),
    [userPlan, t]
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const aiToolsFiltered = useMemo(
    () => aiTools.filter((item) => canAccessView(userPlan, item.id)),
    [userPlan, t]
  );

  // Build nav sections
  const platformIds = ['dashboard', 'my-tasks', 'risks', 'issues', 'vendors', 'policies', 'integrations', 'frameworks'];
  const regulatoryIds = ['ai-rmf', 'eu-ai-act', 'eu-cra', 'csrd', 'ecodesign', 'nis2', 'dma', 'dsa', 'us-privacy', 'dora', 'regulatory-changes'];
  const governanceIds = ['governance', 'dpo-designation', 'process-mapper', 'sox', 'sod', 'workflow-builder', 'exceptions'];
  const certProductIds = ['ce-marking', 'digital-product-passport', 'product-lifecycle', 'sbom-manager', 'product-decommissioning', 'environmental-lifecycle', 'certifications'];
  const monitoringSurveillanceIds = ['esg-reporting', 'post-market-surveillance', 'compliance-forecasting', 'breach-wizard', 'incidents', 'vendor-monitoring', 'control-testing', 'evidence-collection'];
  const reportsAuditIds = ['reports', 'report-builder', 'audit', 'monitoring', 'analytics', 'auditor', 'executive', 'cost-analytics', 'audit-prep'];
  const privacyIds = ['privacy', 'dpia', 'ropa', 'privacy-notices', 'account-deletion'];
  const workspacesIds = ['workspaces', 'questionnaires', 'security', 'acos', 'mdm', 'assets', 'calendar', 'maturity', 'bia', 'cicd-gates', 'security-training'];

  const navSections: NavSection[] = useMemo(() => {
    const roleFiltered = navItemsFiltered.filter(item => user && item.roles.includes(user.role));
    return [
      { key: 'platform', label: t('nav.sectionPlatform'), collapsible: false, items: roleFiltered.filter(item => platformIds.includes(item.id)) },
      { key: 'regulatory', label: t('nav.sectionRegulatory'), collapsible: true, items: roleFiltered.filter(item => regulatoryIds.includes(item.id)) },
      { key: 'governance', label: t('nav.sectionGovernance'), collapsible: true, items: roleFiltered.filter(item => governanceIds.includes(item.id)) },
      { key: 'cert-product', label: t('nav.sectionProducts'), collapsible: true, items: roleFiltered.filter(item => certProductIds.includes(item.id)) },
      { key: 'monitoring-surveillance', label: t('nav.sectionMonitoring'), collapsible: true, items: roleFiltered.filter(item => monitoringSurveillanceIds.includes(item.id)) },
      { key: 'reports-audit', label: t('nav.sectionReports'), collapsible: true, items: roleFiltered.filter(item => reportsAuditIds.includes(item.id)) },
      { key: 'privacy', label: t('nav.sectionPrivacy'), collapsible: true, items: roleFiltered.filter(item => privacyIds.includes(item.id)) },
      { key: 'workspaces', label: t('nav.sectionEnterprise'), collapsible: true, items: roleFiltered.filter(item => workspacesIds.includes(item.id)) },
    ].filter(section => section.items.length > 0);
  }, [navItemsFiltered, user, t]);

  const toggleSection = (sectionKey: string) => {
    setCollapsedSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  // Check if a nav item matches the current URL
  const isNavActive = (item: NavItem): boolean => {
    if (currentPath === item.path) return true;
    if (item.relatedPaths) {
      return item.relatedPaths.some(p => currentPath.startsWith(p));
    }
    return false;
  };

  const isAiToolActive = (item: AiToolItem): boolean => currentPath === item.path;

  // Page title from breadcrumbs
  const breadcrumbs = getBreadcrumbs(currentPath);
  const pageTitle = breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 1].label : 'Dashboard';

  if (!user) return null;

  return (
    <div className="flex h-screen bg-surface-50 overflow-hidden font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 lg:hidden animate-fadeIn"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-surface-900 text-white transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        flex flex-col
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between p-6 border-b border-surface-700/50">
          <Link to={ROUTES.DASHBOARD} className="flex items-center space-x-3">
            <div className="relative w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-600/30">
              <ShieldCheck className="w-5 h-5 text-white" />
              <div className="absolute inset-0 rounded-xl bg-brand-400/20 blur-sm" />
            </div>
            <span className="text-xl font-bold tracking-tight text-gradient">ComplyEasy</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-surface-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto custom-scrollbar" data-onboarding="sidebar-nav">
          {navSections.map((section) => {
            const isCollapsed = collapsedSections[section.key] || false;
            return (
              <div key={section.key} className="mb-2">
                {section.collapsible ? (
                  <button
                    onClick={() => toggleSection(section.key)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-surface-500 uppercase tracking-wider hover:text-surface-300 transition-colors cursor-pointer"
                  >
                    <span>{section.label}</span>
                    {isCollapsed ? <ChevronRight size={14} className="text-surface-600" /> : <ChevronDown size={14} className="text-surface-600" />}
                  </button>
                ) : (
                  <p className="px-3 py-2 text-xs font-semibold text-surface-500 uppercase tracking-wider">{section.label}</p>
                )}

                {!isCollapsed && (
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const active = isNavActive(item);
                      return (
                        <Link
                          key={item.id}
                          to={item.path}
                          onClick={() => setSidebarOpen(false)}
                          data-onboarding={`${item.id}-nav`}
                          className={`
                            w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-all duration-150 group
                            ${active
                              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
                              : 'text-surface-400 hover:bg-surface-800 hover:text-white'
                            }
                          `}
                        >
                          <Icon size={18} className={active ? 'text-white' : 'text-surface-500 group-hover:text-surface-300'} />
                          <span className="font-medium text-sm">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* AI Tools Section */}
          {aiToolsFiltered.length > 0 && (
            <div className="mb-2">
              <p className="px-3 py-2 text-xs font-semibold text-brand-400 uppercase tracking-wider flex items-center">
                <Sparkles size={10} className="mr-1.5" /> {t('nav.aiTools')}
              </p>
              <div className="space-y-0.5">
                {aiToolsFiltered.map((item) => {
                  const Icon = item.icon;
                  const active = isAiToolActive(item);
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      data-onboarding={`${item.id}-nav`}
                      className={`
                        w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-all duration-150 group
                        ${active
                          ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
                          : 'text-surface-400 hover:bg-surface-800 hover:text-white'
                        }
                      `}
                    >
                      <Icon size={18} className={active ? 'text-white' : 'text-surface-500 group-hover:text-surface-300'} />
                      <span className="font-medium text-sm">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Admin Section */}
          {user.role === 'admin' && (
            <div className="mb-2">
              <p className="px-3 py-2 text-xs font-semibold text-surface-500 uppercase tracking-wider">{t('nav.sectionAdmin')}</p>
              <Link
                to={ROUTES.SETTINGS}
                onClick={() => setSidebarOpen(false)}
                data-onboarding="settings-nav"
                className={`
                  w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-all duration-150 group
                  ${currentPath.startsWith('/settings')
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
                    : 'text-surface-400 hover:bg-surface-800 hover:text-white'
                  }
                `}
              >
                <Settings size={18} className={currentPath.startsWith('/settings') ? 'text-white' : 'text-surface-500 group-hover:text-surface-300'} />
                <span className="font-medium text-sm">{t('nav.settings')}</span>
              </Link>
            </div>
          )}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-surface-700/50">
          <div className="mb-3 px-3 flex items-center space-x-2 text-xs text-emerald-400">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <Lock size={12} />
            <span>{t('nav.encryptedZeroTrust')}</span>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center space-x-3 px-3 py-2.5 text-surface-400 hover:bg-surface-800 hover:text-white rounded-xl transition-all duration-150 cursor-pointer group"
          >
            <LogOut size={18} className="text-surface-500 group-hover:text-surface-300" />
            <span className="font-medium text-sm">{t('nav.signOut')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header Bar */}
        <header className="bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between px-6 py-3 sticky top-0 z-10 transition-colors duration-300">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden mr-4 text-surface-400 hover:text-surface-700 transition-colors"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-semibold text-surface-800 dark:text-surface-100 capitalize" data-onboarding="dashboard-header">
              {pageTitle}
            </h1>
          </div>

          {/* Center: Global Search Trigger */}
          <button
            onClick={() => setGlobalSearchOpen(true)}
            className="hidden md:flex items-center space-x-3 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 rounded-xl px-4 py-2 transition-colors cursor-pointer group max-w-md w-full mx-8"
          >
            <Search size={16} className="text-surface-400 group-hover:text-surface-500 dark:group-hover:text-surface-300 flex-shrink-0" />
            <span className="text-sm text-surface-400 group-hover:text-surface-500 dark:group-hover:text-surface-300 flex-1 text-left">{t('nav.searchPlaceholder')}</span>
            <kbd className="hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium text-surface-400 bg-white dark:bg-surface-700 rounded-md border border-surface-200 dark:border-surface-600 shadow-sm">
              <Command size={10} />K
            </kbd>
          </button>

          {/* Right: Notifications + User */}
          <div className="flex items-center space-x-3">
            <button onClick={() => setGlobalSearchOpen(true)} className="md:hidden p-2 text-surface-400 hover:text-surface-600 transition-colors">
              <Search size={20} />
            </button>

            {/* Notification Center */}
            <NotificationCenter />

            <ThemeToggleCompact />
            <LanguageSwitcher compact />

            {/* User Avatar + Name */}
            <div className="flex items-center space-x-3 border-l border-surface-200 pl-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-surface-900">{user.name}</p>
                <p className="text-xs text-surface-500 capitalize">{user.role}</p>
              </div>
              <div className="w-9 h-9 bg-brand-100 rounded-xl flex items-center justify-center border border-brand-200 text-brand-700 font-bold text-sm shadow-sm overflow-hidden">
                {user.avatar && user.avatar.startsWith('http') ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.parentElement!.textContent = user.name.substring(0, 2).toUpperCase();
                    }}
                  />
                ) : (
                  user.avatar || user.name.substring(0, 2).toUpperCase()
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-surface-50 dark:bg-surface-900 relative transition-colors duration-300">
          <div className="max-w-7xl mx-auto animate-fadeIn pb-20" data-onboarding="dashboard-content">
            <Breadcrumbs />
            {children}
          </div>
        </main>

        {/* Compliance Chat Widget */}
        <ComplianceChat onNavigate={(view: string) => navigate(viewToPath(view))} currentView={pathToView(currentPath)} />
      </div>

      {/* Global Search */}
      <GlobalSearch
        isOpen={isGlobalSearchOpen}
        onClose={() => setGlobalSearchOpen(false)}
        onNavigate={(url) => {
          navigate(url);
          setGlobalSearchOpen(false);
        }}
      />

      {/* Command Palette (navigation) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={(view) => {
          navigate(viewToPath(view));
          setCommandPaletteOpen(false);
        }}
      />

      {/* Onboarding system */}
      <OnboardingOverlay />
      <OnboardingChecklistWidget />
    </div>
  );
};
