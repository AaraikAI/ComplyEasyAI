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
    return (localStorage.getItem('complyeasy_sidebar_variant') as 'slim' | 'classic') || 'slim';
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

  // ── Consolidated nav items (reduced from ~55 to ~33) ──
  const navItems: NavItem[] = [
    // Platform (6 items)
    { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard, path: ROUTES.DASHBOARD, roles: ['admin', 'editor', 'viewer'] },
    { id: 'risks', label: t('nav.risks'), icon: ShieldAlert, path: ROUTES.RISKS, roles: ['admin', 'editor', 'viewer'] },
    { id: 'issues', label: t('nav.issuesIncidents'), icon: AlertTriangle, path: ROUTES.ISSUES, roles: ['admin', 'editor', 'viewer'] },
    { id: 'vendors', label: t('nav.vendors'), icon: Users, path: ROUTES.VENDORS, roles: ['admin', 'editor', 'viewer'] },
    { id: 'policies', label: t('nav.policies'), icon: FileCheck, path: ROUTES.POLICIES, roles: ['admin', 'editor'] },
    { id: 'frameworks', label: t('nav.frameworks'), icon: ShieldCheck, path: ROUTES.FRAMEWORKS, roles: ['admin', 'editor'], relatedPaths: ['/frameworks/'] },
    // Regulatory (10 items - unchanged)
    { id: 'ai-rmf', label: t('nav.nistAiRmf'), icon: Brain, path: ROUTES.AI_RMF, roles: ['admin', 'editor', 'viewer'], relatedPaths: ['/ai-rmf/'] },
    { id: 'eu-ai-act', label: t('nav.euAiAct'), icon: ShieldCheck, path: ROUTES.EU_AI_ACT, roles: ['admin', 'editor', 'viewer'] },
    { id: 'eu-cra', label: t('nav.euCra'), icon: Shield, path: ROUTES.EU_CRA, roles: ['admin', 'editor', 'viewer'] },
    { id: 'csrd', label: t('nav.csrdEsg'), icon: Leaf, path: ROUTES.CSRD, roles: ['admin', 'editor', 'viewer'] },
    { id: 'ecodesign', label: t('nav.ecodesign'), icon: Recycle, path: ROUTES.ECODESIGN, roles: ['admin', 'editor', 'viewer'] },
    { id: 'nis2', label: t('nav.nis2'), icon: Network, path: ROUTES.NIS2, roles: ['admin', 'editor', 'viewer'] },
    { id: 'dma', label: t('nav.dma'), icon: ShieldCheck, path: ROUTES.DMA, roles: ['admin', 'editor', 'viewer'] },
    { id: 'dsa', label: t('nav.dsa'), icon: ShieldCheck, path: ROUTES.DSA, roles: ['admin', 'editor', 'viewer'] },
    { id: 'us-privacy', label: t('nav.usPrivacy'), icon: MapPin, path: ROUTES.US_PRIVACY, roles: ['admin', 'editor', 'viewer'] },
    { id: 'dora', label: t('nav.dora'), icon: Shield, path: ROUTES.DORA, roles: ['admin', 'editor', 'viewer'] },
    { id: 'regulatory-changes', label: t('nav.regChanges'), icon: Globe, path: ROUTES.REGULATORY_CHANGES, roles: ['admin', 'editor', 'viewer'] },
    // Governance (3 items, down from 7)
    { id: 'governance', label: t('nav.governance'), icon: UserCheck, path: ROUTES.GOVERNANCE, roles: ['admin', 'editor'], relatedPaths: ['/governance/'] },
    { id: 'sox', label: t('nav.soxCompliance'), icon: Landmark, path: ROUTES.SOX, roles: ['admin', 'editor', 'viewer'] },
    { id: 'evidence-hub', label: t('nav.evidenceExceptions'), icon: ScanSearch, path: ROUTES.EVIDENCE_HUB, roles: ['admin', 'editor'] },
    // Products & Lifecycle (1 item, down from 7)
    { id: 'products', label: t('nav.productsCompliance'), icon: Package, path: ROUTES.PRODUCTS, roles: ['admin', 'editor'] },
    // Monitoring & Surveillance (2 items, down from 8)
    { id: 'post-market-surveillance', label: t('nav.surveillance'), icon: ScanSearch, path: ROUTES.POST_MARKET_SURVEILLANCE, roles: ['admin', 'editor'] },
    { id: 'monitoring', label: t('nav.analyticsMonitoring'), icon: Monitor, path: ROUTES.MONITORING, roles: ['admin', 'editor', 'viewer'] },
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
    // Enterprise (7 items, down from 12)
    { id: 'workspaces', label: t('nav.workspaces'), icon: Building2, path: ROUTES.WORKSPACES, roles: ['admin', 'editor'] },
    { id: 'enterprise-ops', label: t('nav.itSecurityOps'), icon: Lock, path: ROUTES.ENTERPRISE_OPS, roles: ['admin', 'editor'] },
    { id: 'questionnaires', label: t('nav.questionnaires'), icon: ClipboardList, path: ROUTES.QUESTIONNAIRES, roles: ['admin', 'editor', 'viewer'] },
    { id: 'acos', label: t('nav.acos'), icon: Brain, path: ROUTES.ACOS, roles: ['admin', 'editor'] },
    { id: 'calendar', label: t('nav.calendar'), icon: Calendar, path: ROUTES.CALENDAR, roles: ['admin', 'editor', 'viewer'] },
    { id: 'maturity', label: t('nav.maturity'), icon: Gauge, path: ROUTES.MATURITY, roles: ['admin', 'editor'] },
    { id: 'integrations', label: t('nav.integrations'), icon: Layers, path: ROUTES.INTEGRATIONS, roles: ['admin', 'editor', 'viewer'] },
  ];

  // ── Consolidated AI Tools (2 items, down from 15) ──
  const aiTools: AiToolItem[] = [
    { id: 'ai-document-tools', label: t('nav.aiDocumentTools'), icon: Briefcase, path: ROUTES.AI_DOCUMENT_TOOLS },
    { id: 'ai-compliance-tools', label: t('nav.aiComplianceTools'), icon: Bot, path: ROUTES.AI_COMPLIANCE_TOOLS },
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

  // ── Consolidated section groupings ──
  const platformIds = ['dashboard', 'risks', 'issues', 'vendors', 'policies', 'frameworks'];
  const regulatoryIds = ['ai-rmf', 'eu-ai-act', 'eu-cra', 'csrd', 'ecodesign', 'nis2', 'dma', 'dsa', 'us-privacy', 'dora', 'regulatory-changes'];
  const governanceIds = ['governance', 'sox', 'evidence-hub'];
  const certProductIds = ['products'];
  const monitoringSurveillanceIds = ['post-market-surveillance', 'monitoring'];
  const reportsAuditIds = ['reports', 'audit', 'executive'];
  const privacyIds = ['privacy', 'dpia', 'ropa', 'privacy-notices', 'account-deletion'];
  const enterpriseIds = ['workspaces', 'enterprise-ops', 'questionnaires', 'acos', 'calendar', 'maturity', 'integrations'];

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

  if (!user) return null;

  return (
    <div className="flex h-screen bg-surface-50 overflow-hidden font-sans">
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

      {/* Classic Sidebar */}
      {sidebarVariant === 'classic' && <aside className={`
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
            onClick={toggleSidebarVariant}
            className="w-full flex items-center space-x-3 px-3 py-2.5 text-surface-400 hover:bg-surface-800 hover:text-white rounded-xl transition-all duration-150 cursor-pointer group mb-1"
          >
            <LayoutGrid size={18} className="text-surface-500 group-hover:text-surface-300" />
            <span className="font-medium text-sm">HomeOS view</span>
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center space-x-3 px-3 py-2.5 text-surface-400 hover:bg-surface-800 hover:text-white rounded-xl transition-all duration-150 cursor-pointer group"
          >
            <LogOut size={18} className="text-surface-500 group-hover:text-surface-300" />
            <span className="font-medium text-sm">{t('nav.signOut')}</span>
          </button>
        </div>
      </aside>}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header Bar */}
        <header className="bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between px-6 py-3 sticky top-0 z-10 transition-colors duration-300">
          <div className="flex items-center">
            {sidebarVariant === 'classic' && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden mr-4 text-surface-400 hover:text-surface-700 transition-colors"
              >
                <Menu size={24} />
              </button>
            )}
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
