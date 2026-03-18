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

  // Reports & Audit (hub routes)
  REPORTS: '/reports',
  AUDIT_TRAIL: '/audit',
  MONITORING: '/monitoring',
  ANALYTICS: '/analytics',

  // AI Features (kept for backward compat / redirects)
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
  AI_REPORT_GENERATOR: '/ai/report-generator',
  COMPLIANCE_FORECASTING: '/ai/compliance-forecasting',

  // AI Hubs (consolidated)
  AI_DOCUMENT_TOOLS: '/ai/document-tools',
  AI_COMPLIANCE_TOOLS: '/ai/compliance-tools',

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

  // Products & Lifecycle (hub route)
  PRODUCTS: '/products',
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
  DPIA: '/privacy/dpia',
  ROPA: '/privacy/ropa',
  PRIVACY_NOTICES: '/privacy/notices',

  // Security Training
  SECURITY_TRAINING: '/security-training',

  // Enterprise
  WORKSPACES: '/enterprise/workspaces',
  QUESTIONNAIRES: '/enterprise/questionnaires',
  SECURITY: '/enterprise/security',
  ACOS: '/enterprise/acos',
  MDM: '/enterprise/mdm',
  DORA: '/enterprise/dora',
  AUDITOR: '/enterprise/auditor',
  ENTERPRISE_OPS: '/enterprise/security-ops',

  // Evidence & Exceptions hub
  EVIDENCE_HUB: '/evidence',

  // Home OS views
  FEATURE_LIBRARY: '/feature-library',
  RISK_CANVAS: '/risk-canvas',
  DASHBOARD_CLASSIC: '/dashboard-classic',

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
  'my-tasks': ROUTES.RISKS + '?tab=tasks',
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
  'analytics': ROUTES.MONITORING + '?tab=analytics',
  'ai-policy': ROUTES.POLICIES + '?tab=ai-generator',
  'ai-contract': ROUTES.VENDORS + '?tab=contract-analyzer',
  'ai-gap': ROUTES.AI_DOCUMENT_TOOLS + '?tab=gap',
  'ai-rfp': ROUTES.AI_DOCUMENT_TOOLS + '?tab=rfp',
  'ai-phishing': ROUTES.AI_COMPLIANCE_TOOLS + '?tab=phishing',
  'ai-vendor': ROUTES.VENDORS + '?tab=risk-assessment',
  'ai-data-map': ROUTES.AI_COMPLIANCE_TOOLS + '?tab=data-mapper',
  'ai-bcp': ROUTES.AI_DOCUMENT_TOOLS + '?tab=bcp',
  'ai-cross-mapper': ROUTES.AI_COMPLIANCE_TOOLS + '?tab=cross-mapper',
  'ai-auto-remediation': ROUTES.AI_COMPLIANCE_TOOLS + '?tab=remediation',
  'ai-evidence-checker': ROUTES.EVIDENCE_HUB + '?tab=checker',
  'ai-agentic-vendor': ROUTES.VENDORS + '?tab=agentic-risk',
  'ai-audit-simulator': ROUTES.AUDIT_TRAIL + '?tab=simulator',
  'ai-nl-query': ROUTES.AI_COMPLIANCE_TOOLS + '?tab=query',
  'ai-report-generator': ROUTES.REPORTS + '?tab=ai-generator',
  'compliance-forecasting': ROUTES.MONITORING + '?tab=forecasting',
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
  'process-mapper': ROUTES.GOVERNANCE + '?tab=process-mapper',
  'sox': ROUTES.SOX,
  'sod': ROUTES.GOVERNANCE + '?tab=sod',
  'workflow-builder': ROUTES.GOVERNANCE + '?tab=workflow-builder',
  'ce-marking': ROUTES.PRODUCTS + '?tab=ce-marking',
  'digital-product-passport': ROUTES.PRODUCTS + '?tab=digital-passport',
  'product-lifecycle': ROUTES.PRODUCTS + '?tab=lifecycle',
  'sbom-manager': ROUTES.PRODUCTS + '?tab=sbom',
  'product-decommissioning': ROUTES.PRODUCTS + '?tab=decommissioning',
  'environmental-lifecycle': ROUTES.PRODUCTS + '?tab=environmental',
  'esg-reporting': ROUTES.REPORTS + '?tab=esg',
  'post-market-surveillance': ROUTES.POST_MARKET_SURVEILLANCE,
  'breach-wizard': ROUTES.ISSUES + '?tab=breach',
  'privacy': ROUTES.PRIVACY,
  'account-deletion': ROUTES.ACCOUNT_DELETION,
  'dpia': ROUTES.DPIA,
  'ropa': ROUTES.ROPA,
  'privacy-notices': ROUTES.PRIVACY_NOTICES,
  'security-training': ROUTES.ENTERPRISE_OPS + '?tab=training',
  'workspaces': ROUTES.WORKSPACES,
  'questionnaires': ROUTES.QUESTIONNAIRES,
  'security': ROUTES.ENTERPRISE_OPS + '?tab=security',
  'acos': ROUTES.ACOS,
  'mdm': ROUTES.ENTERPRISE_OPS + '?tab=mdm',
  'dora': ROUTES.DORA,
  'auditor': ROUTES.AUDIT_TRAIL + '?tab=auditor',
  // New modules (now mapped to hubs)
  'incidents': ROUTES.ISSUES + '?tab=incidents',
  'assets': ROUTES.ENTERPRISE_OPS + '?tab=assets',
  'calendar': ROUTES.CALENDAR,
  'maturity': ROUTES.MATURITY,
  'bia': ROUTES.ENTERPRISE_OPS + '?tab=bia',
  'exceptions': ROUTES.EVIDENCE_HUB + '?tab=exceptions',
  'certifications': ROUTES.PRODUCTS + '?tab=certifications',
  'cost-analytics': ROUTES.MONITORING + '?tab=costs',
  'executive': ROUTES.EXECUTIVE_DASHBOARD,
  'report-builder': ROUTES.REPORTS + '?tab=builder',
  'regulatory-changes': ROUTES.REGULATORY_CHANGES,
  'evidence-collection': ROUTES.EVIDENCE_HUB + '?tab=collection',
  'audit-prep': ROUTES.AUDIT_TRAIL + '?tab=preparation',
  'control-testing': ROUTES.AUDIT_TRAIL + '?tab=testing',
  'vendor-monitoring': ROUTES.VENDORS + '?tab=monitoring',
  'cicd-gates': ROUTES.ENTERPRISE_OPS + '?tab=cicd',
  'risk-heatmap': ROUTES.RISKS + '?tab=heatmap',
  'notification-center': ROUTES.NOTIFICATIONS,
  'workflow-automation': ROUTES.GOVERNANCE + '?tab=automation',
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
  if (path.startsWith('/incidents/') && path !== '/incidents/') return 'incidents';
  if (path.startsWith('/assets/') && path !== '/assets/') return 'assets';

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

  // AI tools hubs
  if (path === ROUTES.AI_DOCUMENT_TOOLS) {
    crumbs.push({ label: 'AI Tools' });
    crumbs.push({ label: 'Document Tools' });
    return crumbs;
  }
  if (path === ROUTES.AI_COMPLIANCE_TOOLS) {
    crumbs.push({ label: 'AI Tools' });
    crumbs.push({ label: 'Compliance Tools' });
    return crumbs;
  }

  // AI features (redirect targets, kept for direct access)
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
      '/ai/report-generator': 'AI Report Generator',
      '/ai/compliance-forecasting': 'Compliance Forecasting',
      '/ai/document-tools': 'Document Tools',
      '/ai/compliance-tools': 'Compliance Tools',
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
      '/governance/sox': 'SOX Compliance',
    };
    if (labels[path]) crumbs.push({ label: labels[path] });
    return crumbs;
  }

  // Products
  if (path.startsWith('/products')) {
    crumbs.push({ label: 'Products & Compliance' });
    return crumbs;
  }

  // Enterprise
  if (path.startsWith('/enterprise/')) {
    crumbs.push({ label: 'Enterprise' });
    const labels: Record<string, string> = {
      '/enterprise/workspaces': 'Workspaces',
      '/enterprise/questionnaires': 'Questionnaires',
      '/enterprise/security-ops': 'IT & Security Ops',
      '/enterprise/acos': 'aCOS',
      '/enterprise/dora': 'DORA',
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
    [ROUTES.RISKS]: 'Risk Management',
    [ROUTES.ISSUES]: 'Issues & Incidents',
    [ROUTES.VENDORS]: 'Vendor Management',
    [ROUTES.POLICIES]: 'Policy Management',
    [ROUTES.INTEGRATIONS]: 'Integrations',
    [ROUTES.REPORTS]: 'Reports',
    [ROUTES.AUDIT_TRAIL]: 'Audit Center',
    [ROUTES.MONITORING]: 'Analytics & Monitoring',
    [ROUTES.POST_MARKET_SURVEILLANCE]: 'Surveillance',
    [ROUTES.PRIVACY]: 'Privacy Platform',
    [ROUTES.ACCOUNT_DELETION]: 'Data Deletion',
    [ROUTES.DPIA]: 'DPIA Workflow',
    [ROUTES.ROPA]: 'Records of Processing',
    [ROUTES.PRIVACY_NOTICES]: 'Privacy Notices',
    [ROUTES.CALENDAR]: 'Compliance Calendar',
    [ROUTES.MATURITY]: 'GRC Maturity',
    [ROUTES.EXECUTIVE_DASHBOARD]: 'Executive Dashboard',
    [ROUTES.REGULATORY_CHANGES]: 'Regulatory Changes',
    [ROUTES.NOTIFICATIONS]: 'Notifications',
    [ROUTES.TICKETING]: 'Ticketing Integrations',
    [ROUTES.GLOBAL_SEARCH]: 'Search',
    [ROUTES.EVIDENCE_HUB]: 'Evidence & Exceptions',
    [ROUTES.ENTERPRISE_OPS]: 'IT & Security Ops',
    [ROUTES.FEATURE_LIBRARY]: 'Feature Library',
    [ROUTES.RISK_CANVAS]: 'Risk Canvas',
    [ROUTES.DASHBOARD_CLASSIC]: 'Dashboard (Classic)',
  };

  if (simpleLabels[path]) crumbs.push({ label: simpleLabels[path] });

  return crumbs;
}
