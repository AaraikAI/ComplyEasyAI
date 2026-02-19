import React, { useState, useMemo, useEffect } from 'react';
import { ViewState } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { normalizePlan, canAccessView } from '../constants/tierFeatures';
import {
  LayoutDashboard, FileText, ShieldCheck, Settings, LogOut, Menu, X,
  Activity, Search, Bell, Lock, Sparkles, Briefcase, GitGraph, Mail, ShieldAlert, Database, LifeBuoy, CheckSquare, Layers, Brain,
  Users, FileCheck, Monitor, Building2, ClipboardList, AlertTriangle,
  ChevronDown, ChevronRight, Command,
  Shield, Globe, Leaf, Network, MapPin, Workflow, UserCheck, Award, Package,
  Recycle, AlertOctagon, FileCode, Trash2, TreePine, TrendingUp, Target,
  ScanSearch, Bot, MessageSquare, Crosshair,
  Smartphone, Scale, Landmark, BookOpen, Eye, UserX, Fingerprint
} from 'lucide-react';
import { ComplianceChat } from './ComplianceChat';
import { OnboardingOverlay, OnboardingChecklistWidget } from './Onboarding';
import { CommandPalette } from './CommandPalette';
import { ThemeToggleCompact } from './ThemeToggle';

interface LayoutProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  children: React.ReactNode;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  roles: string[];
  relatedViews: string[];
}

interface AiToolItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface NavSection {
  key: string;
  label: string;
  collapsible: boolean;
  items: NavItem[];
}

export const Layout: React.FC<LayoutProps> = ({ currentView, onNavigate, children }) => {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // Calculate notifications
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const loadNotifications = async () => {
      if (!user) {
        setNotifications([]);
        return;
      }

      // Debounce to prevent too many requests
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        try {
          // Load risks assigned to user (with error handling for rate limits)
          try {
            const risks = await api.risks.list({ assignedTo: user.name });
            if (!isMounted) return;

            const taskNotifications = risks.map(r => ({
              id: r.id,
              title: 'Risk Assigned to You',
              desc: r.description,
              time: r.detectedAt,
              type: 'task'
            }));

            // System notifications (can be enhanced with real data)
            const system = [
              { id: 'sys1', title: 'Audit Preparedness', desc: 'SOC 2 Audit is in 20 days.', time: '1 day ago', type: 'alert' }
            ];

            if (isMounted) {
              setNotifications([...taskNotifications, ...system]);
            }
          } catch (rateLimitError: any) {
            // If rate limited, just show system notifications
            if (rateLimitError.message?.includes('429') || rateLimitError.message?.includes('Too Many Requests')) {
              console.warn('Rate limited on notifications, showing system notifications only');
              const system = [
                { id: 'sys1', title: 'Audit Preparedness', desc: 'SOC 2 Audit is in 20 days.', time: '1 day ago', type: 'alert' }
              ];
              if (isMounted) {
                setNotifications(system);
              }
            } else {
              throw rateLimitError;
            }
          }
        } catch (error) {
          console.error('Failed to load notifications:', error);
          // Set empty array or default notifications
          if (isMounted) {
            setNotifications([]);
          }
        }
      }, 500); // 500ms debounce
    };

    loadNotifications();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [user]);

  // Command Palette global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navItems: NavItem[] = [
    // Platform
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'editor', 'viewer'], relatedViews: ['risks'] },
    { id: 'my-tasks', label: 'My Tasks', icon: CheckSquare, roles: ['admin', 'editor', 'viewer'], relatedViews: [] },
    { id: 'risks', label: 'Risk Management', icon: ShieldAlert, roles: ['admin', 'editor', 'viewer'], relatedViews: [] },
    { id: 'issues', label: 'Issue Management', icon: AlertTriangle, roles: ['admin', 'editor', 'viewer'], relatedViews: [] },
    { id: 'vendors', label: 'Vendor Management', icon: Users, roles: ['admin', 'editor', 'viewer'], relatedViews: [] },
    { id: 'policies', label: 'Policy Management', icon: FileCheck, roles: ['admin', 'editor'], relatedViews: [] },
    { id: 'integrations', label: 'Integrations', icon: Layers, roles: ['admin', 'editor', 'viewer'], relatedViews: [] },
    { id: 'frameworks', label: 'Frameworks', icon: ShieldCheck, roles: ['admin', 'editor'], relatedViews: ['framework-details'] },
    // EU Regulations
    { id: 'ai-rmf', label: 'NIST AI RMF', icon: Brain, roles: ['admin', 'editor', 'viewer'], relatedViews: ['ai-rmf-systems', 'ai-rmf-create', 'ai-rmf-details', 'ai-rmf-assessments'] },
    { id: 'eu-ai-act', label: 'EU AI Act', icon: ShieldCheck, roles: ['admin', 'editor', 'viewer'], relatedViews: [] },
    { id: 'eu-cra', label: 'EU CRA', icon: Shield, roles: ['admin', 'editor', 'viewer'], relatedViews: [] },
    { id: 'csrd', label: 'CSRD / ESG', icon: Leaf, roles: ['admin', 'editor', 'viewer'], relatedViews: [] },
    { id: 'ecodesign', label: 'Ecodesign', icon: Recycle, roles: ['admin', 'editor', 'viewer'], relatedViews: [] },
    { id: 'nis2', label: 'NIS2', icon: Network, roles: ['admin', 'editor', 'viewer'], relatedViews: [] },
    { id: 'dma', label: 'DMA', icon: ShieldCheck, roles: ['admin', 'editor', 'viewer'], relatedViews: [] },
    { id: 'dsa', label: 'DSA', icon: ShieldCheck, roles: ['admin', 'editor', 'viewer'], relatedViews: [] },
    { id: 'us-privacy', label: 'US Privacy Laws', icon: MapPin, roles: ['admin', 'editor', 'viewer'], relatedViews: [] },
    // Governance & Process
    { id: 'governance', label: 'Governance', icon: UserCheck, roles: ['admin', 'editor'], relatedViews: [] },
    { id: 'process-mapper', label: 'Process Mapper', icon: Workflow, roles: ['admin', 'editor'], relatedViews: [] },
    // Certification & Products
    { id: 'ce-marking', label: 'CE Marking', icon: Award, roles: ['admin', 'editor'], relatedViews: [] },
    { id: 'digital-product-passport', label: 'Digital Passport', icon: Package, roles: ['admin', 'editor'], relatedViews: [] },
    { id: 'product-lifecycle', label: 'Product Lifecycle', icon: Recycle, roles: ['admin', 'editor'], relatedViews: [] },
    // Monitoring & Surveillance
    { id: 'esg-reporting', label: 'ESG Reporting', icon: TreePine, roles: ['admin', 'editor', 'viewer'], relatedViews: [] },
    { id: 'post-market-surveillance', label: 'Surveillance', icon: ScanSearch, roles: ['admin', 'editor'], relatedViews: [] },
    { id: 'compliance-forecasting', label: 'Score Forecast', icon: TrendingUp, roles: ['admin', 'editor', 'viewer'], relatedViews: [] },
    // Incident & Breach
    { id: 'breach-wizard', label: 'Breach Wizard', icon: AlertOctagon, roles: ['admin', 'editor'], relatedViews: [] },
    // Post-Market Lifecycle
    { id: 'sbom-manager', label: 'SBOM Manager', icon: FileCode, roles: ['admin', 'editor'], relatedViews: [] },
    { id: 'product-decommissioning', label: 'Decommissioning', icon: Trash2, roles: ['admin', 'editor'], relatedViews: [] },
    { id: 'environmental-lifecycle', label: 'Env. Lifecycle', icon: TreePine, roles: ['admin', 'editor'], relatedViews: [] },
    // Reports & Audit
    { id: 'reports', label: 'Report Generator', icon: FileText, roles: ['admin', 'editor', 'viewer'], relatedViews: [] },
    { id: 'audit', label: 'Audit Trail', icon: Activity, roles: ['admin', 'editor'], relatedViews: [] },
    { id: 'monitoring', label: 'Monitoring', icon: Monitor, roles: ['admin', 'editor', 'viewer'], relatedViews: [] },
    { id: 'analytics', label: 'Real-time Analytics', icon: Activity, roles: ['admin', 'editor', 'viewer'], relatedViews: [] },
    // Enterprise
    { id: 'workspaces', label: 'Workspaces', icon: Building2, roles: ['admin', 'editor'], relatedViews: [] },
    { id: 'questionnaires', label: 'Questionnaires', icon: ClipboardList, roles: ['admin', 'editor', 'viewer'], relatedViews: [] },
    { id: 'security', label: 'Security Features', icon: Lock, roles: ['admin', 'editor'], relatedViews: [] },
    { id: 'acos', label: 'aCOS', icon: Brain, roles: ['admin', 'editor'], relatedViews: [] },
    // SOX & Internal Controls
    { id: 'sox', label: 'SOX Compliance', icon: Landmark, roles: ['admin', 'editor', 'viewer'], relatedViews: [] },
    { id: 'sod', label: 'SoD Analysis', icon: Scale, roles: ['admin', 'editor'], relatedViews: [] },
    // DORA & Resilience
    { id: 'dora', label: 'DORA', icon: Shield, roles: ['admin', 'editor', 'viewer'], relatedViews: [] },
    // MDM
    { id: 'mdm', label: 'MDM', icon: Smartphone, roles: ['admin', 'editor'], relatedViews: [] },
    // Auditor Hub
    { id: 'auditor', label: 'Auditor Hub', icon: BookOpen, roles: ['admin', 'editor', 'viewer'], relatedViews: [] },
    // Workflow Builder
    { id: 'workflow-builder', label: 'Workflow Builder', icon: Workflow, roles: ['admin', 'editor'], relatedViews: [] },
    // Privacy Management
    { id: 'privacy', label: 'Privacy Platform', icon: Fingerprint, roles: ['admin', 'editor', 'viewer'], relatedViews: [] },
    { id: 'account-deletion', label: 'Data Deletion', icon: UserX, roles: ['admin', 'editor'], relatedViews: [] },
  ];

  const aiTools: AiToolItem[] = [
    { id: 'ai-policy', label: 'Policy Generator', icon: Sparkles },
    { id: 'ai-contract', label: 'Contract Analyzer', icon: Briefcase },
    { id: 'ai-gap', label: 'Gap Analysis', icon: GitGraph },
    { id: 'ai-rfp', label: 'RFP Responder', icon: FileText },
    { id: 'ai-phishing', label: 'Phishing Sim', icon: Mail },
    { id: 'ai-vendor', label: 'Vendor Risk', icon: ShieldAlert },
    { id: 'ai-data-map', label: 'GDPR Mapper', icon: Database },
    { id: 'ai-bcp', label: 'BCP Generator', icon: LifeBuoy },
    { id: 'ai-cross-mapper', label: 'Control Mapper', icon: GitGraph },
    { id: 'ai-auto-remediation', label: 'Auto-Remediation', icon: Bot },
    { id: 'ai-evidence-checker', label: 'Evidence Checker', icon: ScanSearch },
    { id: 'ai-agentic-vendor', label: 'Agentic VRM', icon: Target },
    { id: 'ai-audit-simulator', label: 'Audit Simulator', icon: Crosshair },
    { id: 'ai-nl-query', label: 'Compliance Query', icon: MessageSquare },
  ];

  const userPlan = normalizePlan(user?.organization?.plan);
  const navItemsFiltered = useMemo(
    () => navItems.filter((item) => canAccessView(userPlan, item.id)),
    [userPlan]
  );
  const aiToolsFiltered = useMemo(
    () => aiTools.filter((item) => canAccessView(userPlan, item.id)),
    [userPlan]
  );

  // Build nav sections from filtered items
  const platformIds = ['dashboard', 'my-tasks', 'risks', 'issues', 'vendors', 'policies', 'integrations', 'frameworks'];
  const regulatoryIds = ['ai-rmf', 'eu-ai-act', 'eu-cra', 'csrd', 'ecodesign', 'nis2', 'dma', 'dsa', 'us-privacy', 'dora'];
  const governanceIds = ['governance', 'process-mapper', 'sox', 'sod', 'workflow-builder'];
  const certProductIds = ['ce-marking', 'digital-product-passport', 'product-lifecycle', 'sbom-manager', 'product-decommissioning', 'environmental-lifecycle'];
  const monitoringSurveillanceIds = ['esg-reporting', 'post-market-surveillance', 'compliance-forecasting', 'breach-wizard'];
  const reportsAuditIds = ['reports', 'audit', 'monitoring', 'analytics', 'auditor'];
  const privacyIds = ['privacy', 'account-deletion'];
  const workspacesIds = ['workspaces', 'questionnaires', 'security', 'acos', 'mdm'];

  const navSections: NavSection[] = useMemo(() => {
    const roleFiltered = navItemsFiltered.filter(item => user && item.roles.includes(user.role));
    return [
      {
        key: 'platform',
        label: 'Platform',
        collapsible: false,
        items: roleFiltered.filter(item => platformIds.includes(item.id)),
      },
      {
        key: 'regulatory',
        label: 'Regulatory',
        collapsible: true,
        items: roleFiltered.filter(item => regulatoryIds.includes(item.id)),
      },
      {
        key: 'governance',
        label: 'Governance',
        collapsible: true,
        items: roleFiltered.filter(item => governanceIds.includes(item.id)),
      },
      {
        key: 'cert-product',
        label: 'Products & Lifecycle',
        collapsible: true,
        items: roleFiltered.filter(item => certProductIds.includes(item.id)),
      },
      {
        key: 'monitoring-surveillance',
        label: 'Monitoring & Assurance',
        collapsible: true,
        items: roleFiltered.filter(item => monitoringSurveillanceIds.includes(item.id)),
      },
      {
        key: 'reports-audit',
        label: 'Reports & Audit',
        collapsible: true,
        items: roleFiltered.filter(item => reportsAuditIds.includes(item.id)),
      },
      {
        key: 'privacy',
        label: 'Privacy & Data',
        collapsible: true,
        items: roleFiltered.filter(item => privacyIds.includes(item.id)),
      },
      {
        key: 'workspaces',
        label: 'Enterprise',
        collapsible: true,
        items: roleFiltered.filter(item => workspacesIds.includes(item.id)),
      },
    ].filter(section => section.items.length > 0);
  }, [navItemsFiltered, user]);

  const toggleSection = (sectionKey: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  // Format page title from currentView
  const pageTitle = useMemo(() => {
    return currentView.replace('ai-', 'AI ').replace('-', ' ');
  }, [currentView]);

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
          <div className="flex items-center space-x-3">
            <div className="relative w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-600/30">
              <ShieldCheck className="w-5 h-5 text-white" />
              <div className="absolute inset-0 rounded-xl bg-brand-400/20 blur-sm" />
            </div>
            <span className="text-xl font-bold tracking-tight text-gradient">ComplyEasy</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-surface-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto custom-scrollbar" data-onboarding="sidebar-nav">
          {/* Platform & Regulatory & Reports & Workspaces Sections */}
          {navSections.map((section) => {
            const isCollapsed = collapsedSections[section.key] || false;
            return (
              <div key={section.key} className="mb-2">
                {/* Section Header */}
                {section.collapsible ? (
                  <button
                    onClick={() => toggleSection(section.key)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-surface-500 uppercase tracking-wider hover:text-surface-300 transition-colors cursor-pointer"
                  >
                    <span>{section.label}</span>
                    {isCollapsed ? (
                      <ChevronRight size={14} className="text-surface-600" />
                    ) : (
                      <ChevronDown size={14} className="text-surface-600" />
                    )}
                  </button>
                ) : (
                  <p className="px-3 py-2 text-xs font-semibold text-surface-500 uppercase tracking-wider">
                    {section.label}
                  </p>
                )}

                {/* Section Items */}
                {!isCollapsed && (
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentView === item.id || item.relatedViews.includes(currentView);
                      return (
                        <button
                          key={item.id}
                          onClick={() => { onNavigate(item.id as ViewState); setSidebarOpen(false); }}
                          data-onboarding={`${item.id}-nav`}
                          className={`
                            w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-all duration-150 cursor-pointer group
                            ${isActive
                              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
                              : 'text-surface-400 hover:bg-surface-800 hover:text-white'
                            }
                          `}
                        >
                          <Icon size={18} className={isActive ? 'text-white' : 'text-surface-500 group-hover:text-surface-300'} />
                          <span className="font-medium text-sm">{item.label}</span>
                        </button>
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
                <Sparkles size={10} className="mr-1.5" /> AI Tools
              </p>
              <div className="space-y-0.5">
                {aiToolsFiltered.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { onNavigate(item.id as ViewState); setSidebarOpen(false); }}
                      data-onboarding={`${item.id}-nav`}
                      className={`
                        w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-all duration-150 cursor-pointer group
                        ${isActive
                          ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
                          : 'text-surface-400 hover:bg-surface-800 hover:text-white'
                        }
                      `}
                    >
                      <Icon size={18} className={isActive ? 'text-white' : 'text-surface-500 group-hover:text-surface-300'} />
                      <span className="font-medium text-sm">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Admin Section */}
          {user.role === 'admin' && (
            <div className="mb-2">
              <p className="px-3 py-2 text-xs font-semibold text-surface-500 uppercase tracking-wider">Admin</p>
              <button
                onClick={() => { onNavigate('settings'); setSidebarOpen(false); }}
                data-onboarding="settings-nav"
                className={`
                  w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-all duration-150 cursor-pointer group
                  ${currentView === 'settings'
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
                    : 'text-surface-400 hover:bg-surface-800 hover:text-white'
                  }
                `}
              >
                <Settings size={18} className={currentView === 'settings' ? 'text-white' : 'text-surface-500 group-hover:text-surface-300'} />
                <span className="font-medium text-sm">Settings</span>
              </button>
            </div>
          )}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-surface-700/50">
          <div className="mb-3 px-3 flex items-center space-x-2 text-xs text-emerald-400">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <Lock size={12} />
            <span>Encrypted &bull; Zero Trust</span>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center space-x-3 px-3 py-2.5 text-surface-400 hover:bg-surface-800 hover:text-white rounded-xl transition-all duration-150 cursor-pointer group"
          >
            <LogOut size={18} className="text-surface-500 group-hover:text-surface-300" />
            <span className="font-medium text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header Bar */}
        <header className="bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between px-6 py-3 sticky top-0 z-10 transition-colors duration-300">
          {/* Left: Hamburger + Page Title */}
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

          {/* Center: Command Palette Trigger */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="hidden md:flex items-center space-x-3 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 rounded-xl px-4 py-2 transition-colors cursor-pointer group max-w-md w-full mx-8"
          >
            <Search size={16} className="text-surface-400 group-hover:text-surface-500 dark:group-hover:text-surface-300 flex-shrink-0" />
            <span className="text-sm text-surface-400 group-hover:text-surface-500 dark:group-hover:text-surface-300 flex-1 text-left">Search or jump to...</span>
            <kbd className="hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium text-surface-400 bg-white dark:bg-surface-700 rounded-md border border-surface-200 dark:border-surface-600 shadow-sm">
              <Command size={10} />K
            </kbd>
          </button>

          {/* Right: Notifications + User */}
          <div className="flex items-center space-x-3">
            {/* Mobile search button */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="md:hidden p-2 text-surface-400 hover:text-surface-600 transition-colors"
            >
              <Search size={20} />
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2 text-surface-400 hover:text-surface-600 transition-colors focus:outline-none rounded-xl hover:bg-surface-100"
              >
                <Bell size={20} />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
                )}
              </button>

              {/* Notification Dropdown */}
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-surface-800 rounded-2xl shadow-2xl border border-surface-200 dark:border-surface-700 overflow-hidden z-50 animate-fadeInDown">
                  <div className="p-4 border-b border-surface-100 dark:border-surface-700 bg-surface-50 dark:bg-surface-900">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-surface-900 dark:text-surface-100">Notifications</h3>
                      {notifications.length > 0 && (
                        <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                          {notifications.length} new
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto custom-scrollbar">
                    {notifications.length > 0 ? notifications.map(n => (
                      <div key={n.id} className="p-4 border-b border-surface-100 hover:bg-surface-50 transition-colors cursor-pointer">
                        <div className="flex items-start space-x-3">
                          <div className={`mt-0.5 p-1.5 rounded-lg ${n.type === 'task' ? 'bg-brand-50 text-brand-600' : 'bg-amber-50 text-amber-600'}`}>
                            {n.type === 'task' ? <CheckSquare size={14}/> : <ShieldAlert size={14}/>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-surface-900">{n.title}</p>
                            <p className="text-xs text-surface-500 mt-0.5 truncate">{n.desc}</p>
                            <p className="text-xs text-surface-400 mt-1">{n.time}</p>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="p-8 text-center text-surface-500">
                        <Bell size={24} className="mx-auto text-surface-300 mb-2" />
                        <p className="text-sm">No new notifications.</p>
                      </div>
                    )}
                  </div>
                  <div className="p-3 text-center border-t border-surface-100 bg-surface-50">
                    <button className="text-xs font-semibold text-brand-600 hover:text-brand-800 transition-colors">
                      Mark all as read
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <ThemeToggleCompact />

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
                      // Fallback to initials if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.parentElement!.innerHTML = user.name.substring(0, 2).toUpperCase();
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
            {children}
          </div>
        </main>

        {/* Compliance Chat Widget */}
        <ComplianceChat onNavigate={onNavigate} currentView={currentView} />
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={(view) => {
          onNavigate(view as ViewState);
          setCommandPaletteOpen(false);
        }}
      />

      {/* Onboarding system */}
      <OnboardingOverlay />
      <OnboardingChecklistWidget />
    </div>
  );
};
