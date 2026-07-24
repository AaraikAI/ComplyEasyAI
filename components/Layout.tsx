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
  DollarSign, Gauge, Radar, TestTube, Satellite, GitBranch, LayoutGrid
} from 'lucide-react';
import { ComplianceChat } from './ComplianceChat';
import { OnboardingOverlay, OnboardingChecklistWidget } from './Onboarding';
import { CommandPalette } from './CommandPalette';
import GlobalSearch from './GlobalSearch';
import NotificationCenter from './NotificationCenter';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggleCompact } from './ThemeToggle';
import { Breadcrumbs } from './Breadcrumbs';
import { SlimSidebar } from './SlimSidebar';
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
  const [sidebarVariant, setSidebarVariant] = useState<'slim' | 'classic'>(() => {
    return (localStorage.getItem('complyeasy_sidebar_variant') as 'slim' | 'classic') || 'classic';
  });

  const toggleSidebarVariant = () => {
    setSidebarVariant(prev => {
      const next = prev === 'slim' ? 'classic' : 'slim';
      localStorage.setItem('complyeasy_sidebar_variant', next);
      return next;
    });
  };

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

  // ── Nav items, ordered per the Signal IA (design handoff) ──
  const navItems: NavItem[] = [
    // Platform (7 items — Integrations joins per the Signal IA)
    { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard, path: ROUTES.DASHBOARD, roles: ['admin', 'editor', 'viewer'] },
    { id: 'frameworks', label: t('nav.frameworks'), icon: ShieldCheck, path: ROUTES.FRAMEWORKS, roles: ['admin', 'editor'], relatedPaths: ['/frameworks/'] },
    { id: 'risks', label: t('nav.risks'), icon: ShieldAlert, path: ROUTES.RISKS, roles: ['admin', 'editor', 'viewer'] },
    { id: 'issues', label: t('nav.issuesIncidents'), icon: AlertTriangle, path: ROUTES.ISSUES, roles: ['admin', 'editor', 'viewer'] },
    { id: 'vendors', label: t('nav.vendors'), icon: Users, path: ROUTES.VENDORS, roles: ['admin', 'editor', 'viewer'] },
    { id: 'policies', label: t('nav.policies'), icon: FileCheck, path: ROUTES.POLICIES, roles: ['admin', 'editor'] },
    { id: 'integrations', label: t('nav.integrations'), icon: Layers, path: ROUTES.INTEGRATIONS, roles: ['admin', 'editor', 'viewer'] },
    // Regulatory (11 items, Signal order; Ecodesign retained)
    { id: 'eu-ai-act', label: t('nav.euAiAct'), icon: ShieldCheck, path: ROUTES.EU_AI_ACT, roles: ['admin', 'editor', 'viewer'] },
    { id: 'ai-rmf', label: t('nav.nistAiRmf'), icon: Brain, path: ROUTES.AI_RMF, roles: ['admin', 'editor', 'viewer'], relatedPaths: ['/ai-rmf/'] },
    { id: 'dora', label: t('nav.dora'), icon: Shield, path: ROUTES.DORA, roles: ['admin', 'editor', 'viewer'] },
    { id: 'nis2', label: t('nav.nis2'), icon: Network, path: ROUTES.NIS2, roles: ['admin', 'editor', 'viewer'] },
    { id: 'dma', label: t('nav.dma'), icon: ShieldCheck, path: ROUTES.DMA, roles: ['admin', 'editor', 'viewer'] },
    { id: 'dsa', label: t('nav.dsa'), icon: ShieldCheck, path: ROUTES.DSA, roles: ['admin', 'editor', 'viewer'] },
    { id: 'eu-cra', label: t('nav.euCra'), icon: Shield, path: ROUTES.EU_CRA, roles: ['admin', 'editor', 'viewer'] },
    { id: 'csrd', label: t('nav.csrdEsg'), icon: Leaf, path: ROUTES.CSRD, roles: ['admin', 'editor', 'viewer'] },
    { id: 'us-privacy', label: t('nav.usPrivacy'), icon: MapPin, path: ROUTES.US_PRIVACY, roles: ['admin', 'editor', 'viewer'] },
    { id: 'regulatory-changes', label: t('nav.regChanges'), icon: Globe, path: ROUTES.REGULATORY_CHANGES, roles: ['admin', 'editor', 'viewer'] },
    { id: 'ecodesign', label: t('nav.ecodesign'), icon: Recycle, path: ROUTES.ECODESIGN, roles: ['admin', 'editor', 'viewer'] },
    // Governance (3 items, down from 7)
    { id: 'governance', label: t('nav.governance'), icon: UserCheck, path: ROUTES.GOVERNANCE, roles: ['admin', 'editor'], relatedPaths: ['/governance/'] },
    { id: 'sox', label: t('nav.soxCompliance'), icon: Landmark, path: ROUTES.SOX, roles: ['admin', 'editor', 'viewer'] },
    { id: 'evidence-hub', label: t('nav.evidenceExceptions'), icon: ScanSearch, path: ROUTES.EVIDENCE_HUB, roles: ['admin', 'editor'] },
    // Products (2 items — Post-Market Surveillance joins per the Signal IA)
    { id: 'products', label: t('nav.productsCompliance'), icon: Package, path: ROUTES.PRODUCTS, roles: ['admin', 'editor'] },
    { id: 'post-market-surveillance', label: t('nav.surveillance'), icon: ScanSearch, path: ROUTES.POST_MARKET_SURVEILLANCE, roles: ['admin', 'editor'] },
    // Monitoring (2 items — Maturity joins per the Signal IA)
    { id: 'monitoring', label: t('nav.analyticsMonitoring'), icon: Monitor, path: ROUTES.MONITORING, roles: ['admin', 'editor', 'viewer'] },
    { id: 'maturity', label: t('nav.maturity'), icon: Gauge, path: ROUTES.MATURITY, roles: ['admin', 'editor'] },
    // Reports & Audit (3 items, down from 9)
    { id: 'reports', label: t('nav.reports'), icon: FileText, path: ROUTES.REPORTS, roles: ['admin', 'editor', 'viewer'] },
    { id: 'audit', label: t('nav.auditCenter'), icon: Activity, path: ROUTES.AUDIT_TRAIL, roles: ['admin', 'editor'] },
    { id: 'executive', label: t('nav.executive'), icon: PieChart, path: ROUTES.EXECUTIVE_DASHBOARD, roles: ['admin', 'editor', 'viewer'] },
    // Privacy & Data (unchanged)
    { id: 'privacy', label: t('nav.privacyPlatform'), icon: Fingerprint, path: ROUTES.PRIVACY, roles: ['admin', 'editor', 'viewer'] },
    { id: 'dpia', label: t('nav.dpia'), icon: Eye, path: ROUTES.DPIA, roles: ['admin', 'editor'] },
    { id: 'ropa', label: t('nav.ropa'), icon: ClipboardList, path: ROUTES.ROPA, roles: ['admin', 'editor'] },
    { id: 'privacy-notices', label: t('nav.privacyNotices'), icon: FileText, path: ROUTES.PRIVACY_NOTICES, roles: ['admin', 'editor'] },
    { id: 'account-deletion', label: t('nav.dataDeletion'), icon: UserX, path: ROUTES.ACCOUNT_DELETION, roles: ['admin', 'editor'] },
    // Enterprise (5 items; AI tools render directly below this section)
    { id: 'workspaces', label: t('nav.workspaces'), icon: Building2, path: ROUTES.WORKSPACES, roles: ['admin', 'editor'] },
    { id: 'enterprise-ops', label: t('nav.itSecurityOps'), icon: Lock, path: ROUTES.ENTERPRISE_OPS, roles: ['admin', 'editor'] },
    { id: 'questionnaires', label: t('nav.questionnaires'), icon: ClipboardList, path: ROUTES.QUESTIONNAIRES, roles: ['admin', 'editor', 'viewer'] },
    { id: 'acos', label: t('nav.acos'), icon: Brain, path: ROUTES.ACOS, roles: ['admin', 'editor'] },
    { id: 'calendar', label: t('nav.calendar'), icon: Calendar, path: ROUTES.CALENDAR, roles: ['admin', 'editor', 'viewer'] },
  ];

  // ── Consolidated AI Tools (2 items, down from 15) ──
  const aiTools: AiToolItem[] = [
    { id: 'ai-document-tools', label: t('nav.aiDocumentTools'), icon: Briefcase, path: ROUTES.AI_DOCUMENT_TOOLS },
    { id: 'ai-compliance-tools', label: t('nav.aiComplianceTools'), icon: Bot, path: ROUTES.AI_COMPLIANCE_TOOLS },
  ];

  const userPlan = normalizePlan(user?.organization?.plan);
   
  const navItemsFiltered = useMemo(
    () => navItems.filter((item) => canAccessView(userPlan, item.id)),
    [userPlan, t]
  );
   
  const aiToolsFiltered = useMemo(
    () => aiTools.filter((item) => canAccessView(userPlan, item.id)),
    [userPlan, t]
  );

  // ── Section groupings (Signal IA: 8 sections + Settings) ──
  const platformIds = ['dashboard', 'frameworks', 'risks', 'issues', 'vendors', 'policies', 'integrations'];
  const regulatoryIds = ['eu-ai-act', 'ai-rmf', 'dora', 'nis2', 'dma', 'dsa', 'eu-cra', 'csrd', 'us-privacy', 'regulatory-changes', 'ecodesign'];
  const governanceIds = ['governance', 'sox', 'evidence-hub'];
  const certProductIds = ['products', 'post-market-surveillance'];
  const monitoringSurveillanceIds = ['monitoring', 'maturity'];
  const reportsAuditIds = ['reports', 'audit', 'executive'];
  const privacyIds = ['privacy', 'dpia', 'ropa', 'privacy-notices', 'account-deletion'];
  const enterpriseIds = ['workspaces', 'enterprise-ops', 'questionnaires', 'acos', 'calendar'];

  const navSections: NavSection[] = useMemo(() => {
    const roleFiltered = navItemsFiltered.filter(item => user && item.roles.includes(user.role));
    return [
      { key: 'platform', label: t('nav.sectionPlatform'), collapsible: false, items: roleFiltered.filter(item => platformIds.includes(item.id)) },
      { key: 'regulatory', label: t('nav.sectionRegulatory'), collapsible: true, items: roleFiltered.filter(item => regulatoryIds.includes(item.id)) },
      { key: 'governance', label: t('nav.sectionGovernance'), collapsible: true, items: roleFiltered.filter(item => governanceIds.includes(item.id)) },
      { key: 'cert-product', label: t('nav.sectionProducts'), collapsible: true, items: roleFiltered.filter(item => certProductIds.includes(item.id)) },
      { key: 'monitoring-surveillance', label: t('nav.sectionMonitoring'), collapsible: true, items: roleFiltered.filter(item => monitoringSurveillanceIds.includes(item.id)) },
      { key: 'reports-audit', label: t('nav.sectionReportsAudit'), collapsible: true, items: roleFiltered.filter(item => reportsAuditIds.includes(item.id)) },
      { key: 'privacy', label: t('nav.sectionPrivacy'), collapsible: true, items: roleFiltered.filter(item => privacyIds.includes(item.id)) },
      { key: 'enterprise', label: t('nav.sectionEnterprise'), collapsible: true, items: roleFiltered.filter(item => enterpriseIds.includes(item.id)) },
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

  // Section chip next to the page title (Signal top bar)
  const activeSectionLabel = useMemo(() => {
    const section = navSections.find((s) => s.items.some((item) => isNavActive(item)));
    if (section) return section.label;
    if (currentPath.startsWith('/settings')) return t('nav.sectionAdmin');
    return null;
  }, [navSections, currentPath, t]);

  if (!user) return null;

  return (
    <div className="flex h-screen bg-surface-50 dark:bg-signal-canvas overflow-hidden font-plex">
      {/* Slim Sidebar (new default) */}
      {sidebarVariant === 'slim' && (
        <SlimSidebar onSwitchToClassic={toggleSidebarVariant} />
      )}

      {/* Mobile Sidebar Overlay (classic mode) */}
      {sidebarVariant === 'classic' && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 lg:hidden animate-fadeIn"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Classic Sidebar (Signal) */}
      {sidebarVariant === 'classic' && <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-signal-panel text-signal-ink border-r border-white/[0.06] transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        flex flex-col
      `}>
        {/* Logo + plan chip */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/[0.06]">
          <Link to={ROUTES.DASHBOARD} className="flex items-center gap-2.5">
            <span aria-hidden="true" className="flex h-[30px] w-[30px] items-center justify-center rounded-[8px] bg-gradient-to-br from-signal-green to-signal-blue">
              <span className="h-[11px] w-[11px] rounded-[3px] border-[2.5px] border-signal-canvas" />
            </span>
            <span className="font-display text-[17px] font-bold tracking-tight text-signal-ink">
              ComplyEasy<span className="text-signal-green">AI</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-signal-green/40 bg-signal-green/10 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-signal-green">
              {userPlan}
            </span>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-signal-sub hover:text-signal-ink transition-colors">
              <X size={22} />
            </button>
          </div>
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
                    className="w-full flex items-center justify-between px-3 py-2 font-mono text-[10px] font-medium text-signal-muted uppercase tracking-[0.16em] hover:text-signal-sub transition-colors cursor-pointer"
                  >
                    <span>{section.label}</span>
                    {isCollapsed ? <ChevronRight size={13} className="text-signal-muted" /> : <ChevronDown size={13} className="text-signal-muted" />}
                  </button>
                ) : (
                  <p className="px-3 py-2 font-mono text-[10px] font-medium text-signal-muted uppercase tracking-[0.16em]">{section.label}</p>
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
                            relative w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-all duration-150 group
                            ${active
                              ? 'bg-signal-green/10 text-signal-green'
                              : 'text-signal-sub hover:bg-white/[0.05] hover:text-signal-ink'
                            }
                          `}
                        >
                          {active && <span aria-hidden="true" className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-signal-green" />}
                          <Icon size={17} className={active ? 'text-signal-green' : 'text-signal-muted group-hover:text-signal-sub'} />
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
              <p className="px-3 py-2 font-mono text-[10px] font-medium text-signal-green/80 uppercase tracking-[0.16em] flex items-center">
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
                        relative w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-all duration-150 group
                        ${active
                          ? 'bg-signal-green/10 text-signal-green'
                          : 'text-signal-sub hover:bg-white/[0.05] hover:text-signal-ink'
                        }
                      `}
                    >
                      {active && <span aria-hidden="true" className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-signal-green" />}
                      <Icon size={17} className={active ? 'text-signal-green' : 'text-signal-muted group-hover:text-signal-sub'} />
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
              <p className="px-3 py-2 font-mono text-[10px] font-medium text-signal-muted uppercase tracking-[0.16em]">{t('nav.sectionAdmin')}</p>
              <Link
                to={ROUTES.SETTINGS}
                onClick={() => setSidebarOpen(false)}
                data-onboarding="settings-nav"
                className={`
                  relative w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-all duration-150 group
                  ${currentPath.startsWith('/settings')
                    ? 'bg-signal-green/10 text-signal-green'
                    : 'text-signal-sub hover:bg-white/[0.05] hover:text-signal-ink'
                  }
                `}
              >
                {currentPath.startsWith('/settings') && <span aria-hidden="true" className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-signal-green" />}
                <Settings size={17} className={currentPath.startsWith('/settings') ? 'text-signal-green' : 'text-signal-muted group-hover:text-signal-sub'} />
                <span className="font-medium text-sm">{t('nav.settings')}</span>
              </Link>
            </div>
          )}
        </nav>

        {/* Sidebar Footer — pinned user card */}
        <div className="p-3 border-t border-white/[0.06]">
          <button
            onClick={toggleSidebarVariant}
            className="w-full flex items-center space-x-3 px-3 py-2 text-signal-sub hover:bg-white/[0.05] hover:text-signal-ink rounded-xl transition-all duration-150 cursor-pointer group mb-1"
          >
            <LayoutGrid size={16} className="text-signal-muted group-hover:text-signal-sub" />
            <span className="font-medium text-[13px]">HomeOS view</span>
          </button>
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] px-3 py-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-signal-green text-[12px] font-bold text-signal-canvas">
              {user.avatar && user.avatar.startsWith('http') ? (
                <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                user.name.substring(0, 1).toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-signal-ink">{user.name}</p>
              <p className="truncate text-[11px] text-signal-muted">{user.organization?.name || user.role}</p>
            </div>
            <button
              onClick={logout}
              aria-label={t('nav.signOut')}
              title={t('nav.signOut')}
              className="rounded-lg p-1.5 text-signal-muted transition-colors hover:bg-white/[0.06] hover:text-signal-bad"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header Bar */}
        <header className="bg-white dark:bg-signal-panel border-b border-surface-200 dark:border-white/[0.06] flex items-center justify-between px-6 py-3 sticky top-0 z-10 transition-colors duration-300">
          <div className="flex items-center gap-3">
            {sidebarVariant === 'classic' && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden mr-1 text-surface-400 hover:text-surface-700 dark:text-signal-sub dark:hover:text-signal-ink transition-colors"
              >
                <Menu size={24} />
              </button>
            )}
            <h1 className="text-xl font-semibold font-display tracking-tight text-surface-800 dark:text-signal-ink capitalize" data-onboarding="dashboard-header">
              {pageTitle}
            </h1>
            {activeSectionLabel && (
              <span className="hidden sm:inline-flex rounded-md border border-surface-200 dark:border-white/[0.10] px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-surface-500 dark:text-signal-muted">
                {activeSectionLabel}
              </span>
            )}
          </div>

          {/* Center: Global Search Trigger */}
          <button
            onClick={() => setGlobalSearchOpen(true)}
            className="hidden md:flex items-center space-x-3 bg-surface-100 dark:bg-white/[0.05] hover:bg-surface-200 dark:hover:bg-white/[0.08] border border-transparent dark:border-white/[0.08] rounded-xl px-4 py-2 transition-colors cursor-pointer group max-w-md w-full mx-8"
          >
            <Search size={16} className="text-surface-400 dark:text-signal-muted group-hover:text-surface-500 dark:group-hover:text-signal-sub flex-shrink-0" />
            <span className="text-sm text-surface-400 dark:text-signal-muted group-hover:text-surface-500 dark:group-hover:text-signal-sub flex-1 text-left">{t('nav.searchPlaceholder')}</span>
            <kbd className="hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium text-surface-400 dark:text-signal-muted bg-white dark:bg-white/[0.06] rounded-md border border-surface-200 dark:border-white/[0.08] shadow-sm">
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
            <div className="flex items-center space-x-3 border-l border-surface-200 dark:border-white/[0.08] pl-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-surface-900 dark:text-signal-ink">{user.name}</p>
                <p className="text-xs text-surface-500 dark:text-signal-muted capitalize">{user.role}</p>
              </div>
              <div className="w-9 h-9 bg-brand-100 dark:bg-signal-green/15 rounded-xl flex items-center justify-center border border-brand-200 dark:border-signal-green/30 text-brand-700 dark:text-signal-green font-bold text-sm shadow-sm overflow-hidden">
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
        <main className="flex-1 overflow-y-auto p-6 bg-surface-50 dark:bg-signal-canvas relative transition-colors duration-300">
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
