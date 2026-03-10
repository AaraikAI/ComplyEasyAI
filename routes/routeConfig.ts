/**
 * Centralized route configuration for URL-based routing.
 * Maps every view to a URL path with support for deep linking,
 * breadcrumbs, and tier-based access control.
 */

export const ROUTES = {
  // Public
  LANDING: '/',
  SIGNUP: '/signup',
  LEARN: '/learn',
  COMMUNITY: '/community',
  STATUS: '/status',
  DOCS: '/docs',

  // Platform Core
  DASHBOARD: '/dashboard',
  MY_TASKS: '/tasks',
  RISKS: '/risks',
  ISSUES: '/issues',
  VENDORS: '/vendors',
  POLICIES: '/policies',
  INTEGRATIONS: '/integrations',
  FRAMEWORKS: '/frameworks',
  FRAMEWORK_DETAILS: '/frameworks/:id',
  SETTINGS: '/settings',

  // Reports & Audit
  REPORTS: '/reports',
  AUDIT_TRAIL: '/audit',
  MONITORING: '/monitoring',
  ANALYTICS: '/analytics',

  // AI Features
  AI_POLICY: '/ai/policy-generator',
  AI_CONTRACT: '/ai/contract-analyzer',
  AI_GAP: '/ai/gap-analysis',
  AI_RFP: '/ai/rfp-responder',
  AI_PHISHING: '/ai/phishing-simulator',
  AI_VENDOR: '/ai/vendor-scorer',
  AI_DATA_MAP: '/ai/data-mapper',
  AI_BCP: '/ai/bcp-generator',
  AI_CROSS_MAPPER: '/ai/cross-framework-mapper',
  AI_AUTO_REMEDIATION: '/ai/auto-remediation',
  AI_EVIDENCE_CHECKER: '/ai/evidence-checker',
  AI_AGENTIC_VENDOR: '/ai/agentic-vendor-risk',
  AI_AUDIT_SIMULATOR: '/ai/audit-simulator',
  AI_NL_QUERY: '/ai/compliance-query',
  COMPLIANCE_FORECASTING: '/ai/compliance-forecasting',

  // AI Governance
  AI_RMF: '/ai-rmf',
  AI_RMF_SYSTEMS: '/ai-rmf/systems',
  AI_RMF_CREATE: '/ai-rmf/systems/new',
  AI_RMF_DETAILS: '/ai-rmf/systems/:id',
  AI_RMF_ASSESSMENTS: '/ai-rmf/assessments',

  // EU Regulations
  EU_AI_ACT: '/regulations/eu-ai-act',
  DMA: '/regulations/dma',
  DSA: '/regulations/dsa',
  EU_CRA: '/regulations/eu-cra',
  CSRD: '/regulations/csrd',
  ECODESIGN: '/regulations/ecodesign',
  NIS2: '/regulations/nis2',
  US_PRIVACY: '/regulations/us-privacy',

  // Governance & Process
  GOVERNANCE: '/governance',
  PROCESS_MAPPER: '/governance/process-mapper',
  SOX: '/governance/sox',
  SOD: '/governance/sod',
  WORKFLOW_BUILDER: '/governance/workflow-builder',

  // Products & Lifecycle
  CE_MARKING: '/products/ce-marking',
  DIGITAL_PRODUCT_PASSPORT: '/products/digital-passport',
  PRODUCT_LIFECYCLE: '/products/lifecycle',
  SBOM_MANAGER: '/products/sbom',
  PRODUCT_DECOMMISSIONING: '/products/decommissioning',
  ENVIRONMENTAL_LIFECYCLE: '/products/environmental-lifecycle',

  // Monitoring & Assurance
  ESG_REPORTING: '/esg-reporting',
  POST_MARKET_SURVEILLANCE: '/surveillance',
  BREACH_WIZARD: '/breach-notification',

  // Privacy & Data
  PRIVACY: '/privacy',
  ACCOUNT_DELETION: '/privacy/data-deletion',

  // Enterprise
  WORKSPACES: '/enterprise/workspaces',
  QUESTIONNAIRES: '/enterprise/questionnaires',
  SECURITY: '/enterprise/security',
  ACOS: '/enterprise/acos',
  MDM: '/enterprise/mdm',
  DORA: '/enterprise/dora',
  AUDITOR: '/enterprise/auditor',

  // New Enhancement Modules
  INCIDENTS: '/incidents',
  INCIDENTS_DETAIL: '/incidents/:id',
  ASSETS: '/assets',
  ASSETS_DETAIL: '/assets/:id',
  CALENDAR: '/calendar',
  MATURITY: '/maturity',
  BIA: '/business-impact-analysis',
  EXCEPTIONS: '/exceptions',
  CERTIFICATIONS: '/certifications',
  COST_ANALYTICS: '/cost-analytics',
  EXECUTIVE_DASHBOARD: '/executive',
  REPORT_BUILDER: '/report-builder',
  GLOBAL_SEARCH: '/search',
  SSO_SETTINGS: '/settings/sso',
  SCIM_SETTINGS: '/settings/scim',
  ROLES: '/settings/roles',
  BRANDING: '/settings/branding',
  REGULATORY_CHANGES: '/regulatory-changes',
  EVIDENCE_COLLECTION: '/evidence-collection',
  AUDIT_PREP: '/audit-prep',
  CONTROL_TESTING: '/control-testing',
  VENDOR_MONITORING: '/vendor-monitoring',
  CICD_GATES: '/cicd-gates',
  RISK_HEATMAP: '/risk-heatmap',
  NOTIFICATIONS: '/notifications',
  WORKFLOW_AUTOMATION: '/workflow-automation',
  TICKETING: '/ticketing',
  ACCESSIBILITY_SETTINGS: '/settings/accessibility',
} as const;

/**
 * Maps old ViewState IDs to new route paths for backward compatibility.
 * Used during migration and by components that still reference view IDs.
 */
export const VIEW_TO_ROUTE: Record<string, string> = {
  'dashboard': ROUTES.DASHBOARD,
  'my-tasks': ROUTES.MY_TASKS,
  'risks': ROUTES.RISKS,
  'issues': ROUTES.ISSUES,
  'vendors': ROUTES.VENDORS,
  'policies': ROUTES.POLICIES,
  'integrations': ROUTES.INTEGRATIONS,
  'frameworks': ROUTES.FRAMEWORKS,
  'framework-details': ROUTES.FRAMEWORK_DETAILS,
  'settings': ROUTES.SETTINGS,
  'reports': ROUTES.REPORTS,
  'audit': ROUTES.AUDIT_TRAIL,
  'monitoring': ROUTES.MONITORING,
  'analytics': ROUTES.ANALYTICS,
  'ai-policy': ROUTES.AI_POLICY,
  'ai-contract': ROUTES.AI_CONTRACT,
  'ai-gap': ROUTES.AI_GAP,
  'ai-rfp': ROUTES.AI_RFP,
  'ai-phishing': ROUTES.AI_PHISHING,
  'ai-vendor': ROUTES.AI_VENDOR,
  'ai-data-map': ROUTES.AI_DATA_MAP,
  'ai-bcp': ROUTES.AI_BCP,
  'ai-cross-mapper': ROUTES.AI_CROSS_MAPPER,
  'ai-auto-remediation': ROUTES.AI_AUTO_REMEDIATION,
  'ai-evidence-checker': ROUTES.AI_EVIDENCE_CHECKER,
  'ai-agentic-vendor': ROUTES.AI_AGENTIC_VENDOR,
  'ai-audit-simulator': ROUTES.AI_AUDIT_SIMULATOR,
  'ai-nl-query': ROUTES.AI_NL_QUERY,
  'compliance-forecasting': ROUTES.COMPLIANCE_FORECASTING,
  'ai-rmf': ROUTES.AI_RMF,
  'ai-rmf-systems': ROUTES.AI_RMF_SYSTEMS,
  'ai-rmf-create': ROUTES.AI_RMF_CREATE,
  'ai-rmf-details': ROUTES.AI_RMF_DETAILS,
  'ai-rmf-assessments': ROUTES.AI_RMF_ASSESSMENTS,
  'eu-ai-act': ROUTES.EU_AI_ACT,
  'dma': ROUTES.DMA,
  'dsa': ROUTES.DSA,
  'eu-cra': ROUTES.EU_CRA,
  'csrd': ROUTES.CSRD,
  'ecodesign': ROUTES.ECODESIGN,
  'nis2': ROUTES.NIS2,
  'us-privacy': ROUTES.US_PRIVACY,
  'governance': ROUTES.GOVERNANCE,
  'process-mapper': ROUTES.PROCESS_MAPPER,
  'sox': ROUTES.SOX,
  'sod': ROUTES.SOD,
  'workflow-builder': ROUTES.WORKFLOW_BUILDER,
  'ce-marking': ROUTES.CE_MARKING,
  'digital-product-passport': ROUTES.DIGITAL_PRODUCT_PASSPORT,
  'product-lifecycle': ROUTES.PRODUCT_LIFECYCLE,
  'sbom-manager': ROUTES.SBOM_MANAGER,
  'product-decommissioning': ROUTES.PRODUCT_DECOMMISSIONING,
  'environmental-lifecycle': ROUTES.ENVIRONMENTAL_LIFECYCLE,
  'esg-reporting': ROUTES.ESG_REPORTING,
  'post-market-surveillance': ROUTES.POST_MARKET_SURVEILLANCE,
  'breach-wizard': ROUTES.BREACH_WIZARD,
  'privacy': ROUTES.PRIVACY,
  'account-deletion': ROUTES.ACCOUNT_DELETION,
  'workspaces': ROUTES.WORKSPACES,
  'questionnaires': ROUTES.QUESTIONNAIRES,
  'security': ROUTES.SECURITY,
  'acos': ROUTES.ACOS,
  'mdm': ROUTES.MDM,
  'dora': ROUTES.DORA,
  'auditor': ROUTES.AUDITOR,
  // New modules
  'incidents': ROUTES.INCIDENTS,
  'assets': ROUTES.ASSETS,
  'calendar': ROUTES.CALENDAR,
  'maturity': ROUTES.MATURITY,
  'bia': ROUTES.BIA,
  'exceptions': ROUTES.EXCEPTIONS,
  'certifications': ROUTES.CERTIFICATIONS,
  'cost-analytics': ROUTES.COST_ANALYTICS,
  'executive': ROUTES.EXECUTIVE_DASHBOARD,
  'report-builder': ROUTES.REPORT_BUILDER,
  'regulatory-changes': ROUTES.REGULATORY_CHANGES,
  'evidence-collection': ROUTES.EVIDENCE_COLLECTION,
  'audit-prep': ROUTES.AUDIT_PREP,
  'control-testing': ROUTES.CONTROL_TESTING,
  'vendor-monitoring': ROUTES.VENDOR_MONITORING,
  'cicd-gates': ROUTES.CICD_GATES,
  'risk-heatmap': ROUTES.RISK_HEATMAP,
  'notification-center': ROUTES.NOTIFICATIONS,
  'workflow-automation': ROUTES.WORKFLOW_AUTOMATION,
  'ticketing': ROUTES.TICKETING,
  'accessibility-settings': ROUTES.ACCESSIBILITY_SETTINGS,
  'global-search': ROUTES.GLOBAL_SEARCH,
};

/**
 * Reverse lookup: route path → old ViewState ID.
 * Used by Layout to determine active nav state from current URL.
 */
export const ROUTE_TO_VIEW: Record<string, string> = Object.fromEntries(
  Object.entries(VIEW_TO_ROUTE).map(([view, route]) => [route, view])
);

/**
 * Convert an old ViewState ID to a URL path.
 * Handles parameterized routes by replacing :id with actual value.
 */
export function viewToPath(viewId: string, params?: Record<string, string>): string {
  let path = VIEW_TO_ROUTE[viewId] || ROUTES.DASHBOARD;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      path = path.replace(`:${key}`, value);
    });
  }
  return path;
}

/**
 * Get the ViewState ID from a URL path.
 * Handles parameterized routes by matching patterns.
 */
export function pathToView(path: string): string {
  // Direct match
  const directMatch = ROUTE_TO_VIEW[path];
  if (directMatch) return directMatch;

  // Pattern matching for parameterized routes
  if (path.startsWith('/frameworks/') && path !== '/frameworks/') return 'framework-details';
  if (path.startsWith('/ai-rmf/systems/new')) return 'ai-rmf-create';
  if (path.startsWith('/ai-rmf/systems/') && path !== '/ai-rmf/systems/') return 'ai-rmf-details';
  if (path.startsWith('/incidents/') && path !== '/incidents/') return 'incidents-detail';
  if (path.startsWith('/assets/') && path !== '/assets/') return 'assets-detail';

  return 'dashboard';
}

/**
 * Breadcrumb configuration for route hierarchy.
 */
export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export function getBreadcrumbs(path: string): BreadcrumbItem[] {
  const crumbs: BreadcrumbItem[] = [{ label: 'Home', path: ROUTES.DASHBOARD }];

  if (path === ROUTES.DASHBOARD) return crumbs;

  // AI features
  if (path.startsWith('/ai/')) {
    crumbs.push({ label: 'AI Tools' });
    const labels: Record<string, string> = {
      '/ai/policy-generator': 'Policy Generator',
      '/ai/contract-analyzer': 'Contract Analyzer',
      '/ai/gap-analysis': 'Gap Analysis',
      '/ai/rfp-responder': 'RFP Responder',
      '/ai/phishing-simulator': 'Phishing Simulator',
      '/ai/vendor-scorer': 'Vendor Scorer',
      '/ai/data-mapper': 'Data Mapper',
      '/ai/bcp-generator': 'BCP Generator',
      '/ai/cross-framework-mapper': 'Cross-Framework Mapper',
      '/ai/auto-remediation': 'Auto-Remediation',
      '/ai/evidence-checker': 'Evidence Checker',
      '/ai/agentic-vendor-risk': 'Agentic Vendor Risk',
      '/ai/audit-simulator': 'Audit Simulator',
      '/ai/compliance-query': 'Compliance Query',
      '/ai/compliance-forecasting': 'Compliance Forecasting',
    };
    if (labels[path]) crumbs.push({ label: labels[path] });
    return crumbs;
  }

  // Regulations
  if (path.startsWith('/regulations/')) {
    crumbs.push({ label: 'Regulations' });
    const labels: Record<string, string> = {
      '/regulations/eu-ai-act': 'EU AI Act',
      '/regulations/dma': 'DMA',
      '/regulations/dsa': 'DSA',
      '/regulations/eu-cra': 'EU CRA',
      '/regulations/csrd': 'CSRD',
      '/regulations/ecodesign': 'Ecodesign',
      '/regulations/nis2': 'NIS2',
      '/regulations/us-privacy': 'US Privacy',
    };
    if (labels[path]) crumbs.push({ label: labels[path] });
    return crumbs;
  }

  // Frameworks
  if (path.startsWith('/frameworks')) {
    crumbs.push({ label: 'Frameworks', path: ROUTES.FRAMEWORKS });
    if (path !== ROUTES.FRAMEWORKS) crumbs.push({ label: 'Details' });
    return crumbs;
  }

  // Governance
  if (path.startsWith('/governance')) {
    crumbs.push({ label: 'Governance', path: ROUTES.GOVERNANCE });
    const labels: Record<string, string> = {
      '/governance/process-mapper': 'Process Mapper',
      '/governance/sox': 'SOX Compliance',
      '/governance/sod': 'SoD Analysis',
      '/governance/workflow-builder': 'Workflow Builder',
    };
    if (labels[path]) crumbs.push({ label: labels[path] });
    return crumbs;
  }

  // Products
  if (path.startsWith('/products/')) {
    crumbs.push({ label: 'Products & Lifecycle' });
    const labels: Record<string, string> = {
      '/products/ce-marking': 'CE Marking',
      '/products/digital-passport': 'Digital Product Passport',
      '/products/lifecycle': 'Product Lifecycle',
      '/products/sbom': 'SBOM Manager',
      '/products/decommissioning': 'Decommissioning',
      '/products/environmental-lifecycle': 'Environmental Lifecycle',
    };
    if (labels[path]) crumbs.push({ label: labels[path] });
    return crumbs;
  }

  // Enterprise
  if (path.startsWith('/enterprise/')) {
    crumbs.push({ label: 'Enterprise' });
    const labels: Record<string, string> = {
      '/enterprise/workspaces': 'Workspaces',
      '/enterprise/questionnaires': 'Questionnaires',
      '/enterprise/security': 'Security Features',
      '/enterprise/acos': 'aCOS',
      '/enterprise/mdm': 'MDM',
      '/enterprise/dora': 'DORA',
      '/enterprise/auditor': 'Auditor Hub',
    };
    if (labels[path]) crumbs.push({ label: labels[path] });
    return crumbs;
  }

  // Settings
  if (path.startsWith('/settings')) {
    crumbs.push({ label: 'Settings', path: ROUTES.SETTINGS });
    const labels: Record<string, string> = {
      '/settings/sso': 'SSO',
      '/settings/scim': 'SCIM',
      '/settings/roles': 'Roles & Permissions',
      '/settings/branding': 'Branding',
      '/settings/accessibility': 'Accessibility',
    };
    if (labels[path]) crumbs.push({ label: labels[path] });
    return crumbs;
  }

  // Simple pages
  const simpleLabels: Record<string, string> = {
    [ROUTES.MY_TASKS]: 'My Tasks',
    [ROUTES.RISKS]: 'Risk Management',
    [ROUTES.ISSUES]: 'Issue Management',
    [ROUTES.VENDORS]: 'Vendor Management',
    [ROUTES.POLICIES]: 'Policy Management',
    [ROUTES.INTEGRATIONS]: 'Integrations',
    [ROUTES.REPORTS]: 'Reports',
    [ROUTES.AUDIT_TRAIL]: 'Audit Trail',
    [ROUTES.MONITORING]: 'Monitoring',
    [ROUTES.ANALYTICS]: 'Real-time Analytics',
    [ROUTES.ESG_REPORTING]: 'ESG Reporting',
    [ROUTES.POST_MARKET_SURVEILLANCE]: 'Surveillance',
    [ROUTES.BREACH_WIZARD]: 'Breach Notification',
    [ROUTES.PRIVACY]: 'Privacy Platform',
    [ROUTES.ACCOUNT_DELETION]: 'Data Deletion',
    [ROUTES.INCIDENTS]: 'Incidents',
    [ROUTES.ASSETS]: 'Assets',
    [ROUTES.CALENDAR]: 'Compliance Calendar',
    [ROUTES.MATURITY]: 'GRC Maturity',
    [ROUTES.BIA]: 'Business Impact Analysis',
    [ROUTES.EXCEPTIONS]: 'Exceptions',
    [ROUTES.CERTIFICATIONS]: 'Certifications',
    [ROUTES.COST_ANALYTICS]: 'Cost Analytics',
    [ROUTES.EXECUTIVE_DASHBOARD]: 'Executive Dashboard',
    [ROUTES.REPORT_BUILDER]: 'Report Builder',
    [ROUTES.REGULATORY_CHANGES]: 'Regulatory Changes',
    [ROUTES.EVIDENCE_COLLECTION]: 'Evidence Collection',
    [ROUTES.AUDIT_PREP]: 'Audit Prep',
    [ROUTES.CONTROL_TESTING]: 'Control Testing',
    [ROUTES.VENDOR_MONITORING]: 'Vendor Monitoring',
    [ROUTES.CICD_GATES]: 'CI/CD Gates',
    [ROUTES.RISK_HEATMAP]: 'Risk Heat Map',
    [ROUTES.NOTIFICATIONS]: 'Notifications',
    [ROUTES.WORKFLOW_AUTOMATION]: 'Workflow Automation',
    [ROUTES.TICKETING]: 'Ticketing Integrations',
    [ROUTES.GLOBAL_SEARCH]: 'Search',
  };

  if (simpleLabels[path]) crumbs.push({ label: simpleLabels[path] });

  return crumbs;
}
