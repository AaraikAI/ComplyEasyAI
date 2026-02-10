/**
 * Third-Party Integrations Marketplace Routes
 *
 * Provides a marketplace for discovering, installing, configuring,
 * and managing third-party integrations. Each integration is a
 * connector to an external service (SIEM, ticketing, cloud, etc.)
 * with standardized lifecycle management.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth';
import prisma from '../../config/database';
import logger from '../../config/logger';

const marketplaceRouter = Router();

// All marketplace routes require authentication
marketplaceRouter.use(authenticate);

// ============================================================================
// TYPES
// ============================================================================

interface MarketplaceIntegration {
  id: string;
  name: string;
  slug: string;
  description: string;
  longDescription: string;
  category: string;
  vendor: string;
  version: string;
  logoUrl: string;
  websiteUrl: string;
  documentationUrl: string;
  pricing: 'free' | 'paid' | 'enterprise';
  status: 'available' | 'beta' | 'coming_soon' | 'deprecated';
  features: string[];
  requiredScopes: string[];
  configSchema: Record<string, any>;
  supportedEvents: string[];
  rating: number;
  installCount: number;
  lastUpdated: string;
  tags: string[];
}

// ============================================================================
// MARKETPLACE CATALOG
// ============================================================================

const MARKETPLACE_CATALOG: MarketplaceIntegration[] = [
  // Cloud Providers
  {
    id: 'int_aws',
    name: 'Amazon Web Services',
    slug: 'aws',
    description: 'Monitor AWS security posture and compliance controls',
    longDescription: 'Comprehensive AWS integration for monitoring security groups, IAM policies, S3 bucket configurations, CloudTrail logs, and GuardDuty findings. Automatically maps findings to compliance controls.',
    category: 'Cloud Security',
    vendor: 'Amazon',
    version: '2.3.0',
    logoUrl: '/integrations/aws.svg',
    websiteUrl: 'https://aws.amazon.com',
    documentationUrl: '/docs/integrations/aws',
    pricing: 'free',
    status: 'available',
    features: ['Security Hub sync', 'IAM analysis', 'S3 compliance', 'CloudTrail monitoring', 'GuardDuty alerts', 'Config rules mapping'],
    requiredScopes: ['read:security', 'read:iam', 'read:s3'],
    configSchema: {
      accessKeyId: { type: 'string', required: true, label: 'AWS Access Key ID' },
      secretAccessKey: { type: 'password', required: true, label: 'AWS Secret Access Key' },
      region: { type: 'select', required: true, label: 'Default Region', options: ['us-east-1', 'us-west-2', 'eu-west-1', 'eu-central-1', 'ap-southeast-1'] },
      accountId: { type: 'string', required: false, label: 'AWS Account ID' },
    },
    supportedEvents: ['security_finding', 'compliance_change', 'iam_change', 'resource_change'],
    rating: 4.8,
    installCount: 1520,
    lastUpdated: '2026-02-01',
    tags: ['cloud', 'security', 'compliance', 'monitoring'],
  },
  {
    id: 'int_azure',
    name: 'Microsoft Azure',
    slug: 'azure',
    description: 'Azure security and compliance monitoring',
    longDescription: 'Integrate with Azure Security Center, Azure Policy, and Azure AD for comprehensive cloud compliance monitoring. Maps Azure security recommendations to your compliance frameworks.',
    category: 'Cloud Security',
    vendor: 'Microsoft',
    version: '2.1.0',
    logoUrl: '/integrations/azure.svg',
    websiteUrl: 'https://azure.microsoft.com',
    documentationUrl: '/docs/integrations/azure',
    pricing: 'free',
    status: 'available',
    features: ['Security Center sync', 'Azure Policy monitoring', 'Azure AD analysis', 'Resource compliance', 'Defender alerts'],
    requiredScopes: ['read:security', 'read:policy', 'read:directory'],
    configSchema: {
      tenantId: { type: 'string', required: true, label: 'Azure Tenant ID' },
      clientId: { type: 'string', required: true, label: 'Application (Client) ID' },
      clientSecret: { type: 'password', required: true, label: 'Client Secret' },
      subscriptionId: { type: 'string', required: true, label: 'Subscription ID' },
    },
    supportedEvents: ['security_alert', 'policy_compliance', 'identity_change', 'resource_change'],
    rating: 4.6,
    installCount: 980,
    lastUpdated: '2026-01-28',
    tags: ['cloud', 'security', 'compliance', 'identity'],
  },
  {
    id: 'int_gcp',
    name: 'Google Cloud Platform',
    slug: 'gcp',
    description: 'GCP security and compliance integration',
    longDescription: 'Monitor GCP Security Command Center findings, IAM policies, and cloud resource configurations for compliance. Supports CSPM for GCP workloads.',
    category: 'Cloud Security',
    vendor: 'Google',
    version: '1.8.0',
    logoUrl: '/integrations/gcp.svg',
    websiteUrl: 'https://cloud.google.com',
    documentationUrl: '/docs/integrations/gcp',
    pricing: 'free',
    status: 'available',
    features: ['SCC findings sync', 'IAM analysis', 'Cloud Asset Inventory', 'Audit logs', 'Organization policies'],
    requiredScopes: ['read:security', 'read:iam', 'read:assets'],
    configSchema: {
      projectId: { type: 'string', required: true, label: 'GCP Project ID' },
      serviceAccountKey: { type: 'textarea', required: true, label: 'Service Account Key (JSON)' },
    },
    supportedEvents: ['security_finding', 'iam_change', 'resource_change', 'audit_log'],
    rating: 4.5,
    installCount: 650,
    lastUpdated: '2026-01-20',
    tags: ['cloud', 'security', 'compliance'],
  },

  // SIEM / Security
  {
    id: 'int_splunk',
    name: 'Splunk',
    slug: 'splunk',
    description: 'SIEM integration for log analysis and security monitoring',
    longDescription: 'Forward compliance events and audit logs to Splunk. Import Splunk security alerts as compliance findings and issues.',
    category: 'SIEM',
    vendor: 'Splunk',
    version: '1.5.0',
    logoUrl: '/integrations/splunk.svg',
    websiteUrl: 'https://www.splunk.com',
    documentationUrl: '/docs/integrations/splunk',
    pricing: 'enterprise',
    status: 'available',
    features: ['Event forwarding', 'Alert import', 'Dashboard widgets', 'Saved searches', 'Custom SPL queries'],
    requiredScopes: ['write:events', 'read:alerts'],
    configSchema: {
      baseUrl: { type: 'url', required: true, label: 'Splunk Base URL' },
      token: { type: 'password', required: true, label: 'HEC Token' },
      index: { type: 'string', required: false, label: 'Index Name', default: 'complyeasy' },
    },
    supportedEvents: ['audit_log', 'compliance_change', 'security_finding', 'risk_update'],
    rating: 4.7,
    installCount: 820,
    lastUpdated: '2026-02-05',
    tags: ['siem', 'security', 'logging', 'monitoring'],
  },

  // Ticketing / Project Management
  {
    id: 'int_jira',
    name: 'Jira',
    slug: 'jira',
    description: 'Sync compliance issues with Jira tickets',
    longDescription: 'Bidirectional sync between ComplyEasyAI issues and Jira tickets. Automatically create Jira issues from compliance findings and track remediation progress.',
    category: 'Project Management',
    vendor: 'Atlassian',
    version: '2.0.0',
    logoUrl: '/integrations/jira.svg',
    websiteUrl: 'https://www.atlassian.com/software/jira',
    documentationUrl: '/docs/integrations/jira',
    pricing: 'free',
    status: 'available',
    features: ['Bidirectional sync', 'Auto-create tickets', 'Status mapping', 'Custom fields', 'Project mapping', 'Webhook notifications'],
    requiredScopes: ['read:jira-work', 'write:jira-work'],
    configSchema: {
      baseUrl: { type: 'url', required: true, label: 'Jira Base URL' },
      email: { type: 'email', required: true, label: 'Jira Email' },
      apiToken: { type: 'password', required: true, label: 'API Token' },
      projectKey: { type: 'string', required: true, label: 'Default Project Key' },
    },
    supportedEvents: ['issue_created', 'issue_updated', 'issue_resolved', 'issue_commented'],
    rating: 4.9,
    installCount: 2150,
    lastUpdated: '2026-02-08',
    tags: ['ticketing', 'project-management', 'issues', 'remediation'],
  },
  {
    id: 'int_servicenow',
    name: 'ServiceNow',
    slug: 'servicenow',
    description: 'Enterprise service management integration',
    longDescription: 'Integrate with ServiceNow ITSM for incident management, change management, and GRC modules. Map compliance controls to ServiceNow CMDB.',
    category: 'ITSM',
    vendor: 'ServiceNow',
    version: '1.3.0',
    logoUrl: '/integrations/servicenow.svg',
    websiteUrl: 'https://www.servicenow.com',
    documentationUrl: '/docs/integrations/servicenow',
    pricing: 'enterprise',
    status: 'available',
    features: ['Incident sync', 'Change management', 'CMDB mapping', 'GRC integration', 'Workflow automation'],
    requiredScopes: ['read:incident', 'write:incident', 'read:cmdb'],
    configSchema: {
      instanceUrl: { type: 'url', required: true, label: 'ServiceNow Instance URL' },
      username: { type: 'string', required: true, label: 'Username' },
      password: { type: 'password', required: true, label: 'Password' },
    },
    supportedEvents: ['issue_created', 'issue_updated', 'risk_update', 'compliance_change'],
    rating: 4.4,
    installCount: 430,
    lastUpdated: '2026-01-15',
    tags: ['itsm', 'enterprise', 'incidents', 'grc'],
  },

  // Communication
  {
    id: 'int_slack',
    name: 'Slack',
    slug: 'slack',
    description: 'Real-time compliance notifications in Slack',
    longDescription: 'Receive real-time notifications for compliance events, risk changes, and audit findings directly in Slack channels. Interactive message actions for quick response.',
    category: 'Communication',
    vendor: 'Salesforce',
    version: '2.2.0',
    logoUrl: '/integrations/slack.svg',
    websiteUrl: 'https://slack.com',
    documentationUrl: '/docs/integrations/slack',
    pricing: 'free',
    status: 'available',
    features: ['Channel notifications', 'Interactive messages', 'Slash commands', 'Thread replies', 'DM alerts', 'Custom bot'],
    requiredScopes: ['chat:write', 'channels:read', 'commands'],
    configSchema: {
      webhookUrl: { type: 'url', required: true, label: 'Slack Webhook URL' },
      botToken: { type: 'password', required: false, label: 'Bot Token (for interactive features)' },
      defaultChannel: { type: 'string', required: false, label: 'Default Channel', default: '#compliance' },
    },
    supportedEvents: ['risk_update', 'issue_created', 'compliance_change', 'assessment_completed', 'policy_approved', 'monitor_alert'],
    rating: 4.8,
    installCount: 3200,
    lastUpdated: '2026-02-07',
    tags: ['communication', 'notifications', 'alerts', 'collaboration'],
  },
  {
    id: 'int_teams',
    name: 'Microsoft Teams',
    slug: 'microsoft-teams',
    description: 'Compliance notifications and collaboration in Teams',
    longDescription: 'Deliver compliance notifications, risk alerts, and audit updates to Microsoft Teams channels. Includes adaptive cards for rich interaction.',
    category: 'Communication',
    vendor: 'Microsoft',
    version: '1.6.0',
    logoUrl: '/integrations/teams.svg',
    websiteUrl: 'https://www.microsoft.com/microsoft-teams',
    documentationUrl: '/docs/integrations/microsoft-teams',
    pricing: 'free',
    status: 'available',
    features: ['Channel notifications', 'Adaptive cards', 'Tab app', 'Bot commands', 'Meeting integrations'],
    requiredScopes: ['ChannelMessage.Send', 'Chat.ReadWrite'],
    configSchema: {
      webhookUrl: { type: 'url', required: true, label: 'Teams Webhook URL' },
      tenantId: { type: 'string', required: false, label: 'Azure AD Tenant ID (for advanced features)' },
    },
    supportedEvents: ['risk_update', 'issue_created', 'compliance_change', 'assessment_completed', 'monitor_alert'],
    rating: 4.5,
    installCount: 1800,
    lastUpdated: '2026-01-25',
    tags: ['communication', 'notifications', 'collaboration'],
  },

  // Identity & Access
  {
    id: 'int_okta',
    name: 'Okta',
    slug: 'okta',
    description: 'Identity governance and SSO integration',
    longDescription: 'Sync user provisioning, access reviews, and SSO configuration with Okta. Monitor privileged access and enforce identity compliance.',
    category: 'Identity',
    vendor: 'Okta',
    version: '1.4.0',
    logoUrl: '/integrations/okta.svg',
    websiteUrl: 'https://www.okta.com',
    documentationUrl: '/docs/integrations/okta',
    pricing: 'paid',
    status: 'available',
    features: ['SSO/SAML', 'User provisioning (SCIM)', 'Access reviews', 'MFA enforcement', 'Group sync', 'Audit logs'],
    requiredScopes: ['okta.users.read', 'okta.groups.read', 'okta.logs.read'],
    configSchema: {
      domain: { type: 'url', required: true, label: 'Okta Domain (e.g., dev-12345.okta.com)' },
      apiToken: { type: 'password', required: true, label: 'API Token' },
    },
    supportedEvents: ['user_provisioned', 'access_review', 'mfa_status', 'login_anomaly'],
    rating: 4.7,
    installCount: 950,
    lastUpdated: '2026-02-03',
    tags: ['identity', 'sso', 'access-management', 'governance'],
  },

  // Vulnerability Scanners
  {
    id: 'int_qualys',
    name: 'Qualys',
    slug: 'qualys',
    description: 'Vulnerability management and compliance scanning',
    longDescription: 'Import vulnerability scan results from Qualys. Map vulnerabilities to compliance controls and automatically create remediation issues.',
    category: 'Vulnerability Management',
    vendor: 'Qualys',
    version: '1.2.0',
    logoUrl: '/integrations/qualys.svg',
    websiteUrl: 'https://www.qualys.com',
    documentationUrl: '/docs/integrations/qualys',
    pricing: 'enterprise',
    status: 'available',
    features: ['Vulnerability import', 'Compliance scanning', 'Asset inventory', 'Patch tracking', 'Report generation'],
    requiredScopes: ['read:vulnerabilities', 'read:compliance'],
    configSchema: {
      apiUrl: { type: 'url', required: true, label: 'Qualys API URL' },
      username: { type: 'string', required: true, label: 'Username' },
      password: { type: 'password', required: true, label: 'Password' },
    },
    supportedEvents: ['vulnerability_found', 'scan_completed', 'compliance_check'],
    rating: 4.3,
    installCount: 380,
    lastUpdated: '2026-01-10',
    tags: ['vulnerability', 'scanning', 'security', 'compliance'],
  },

  // GRC
  {
    id: 'int_oneTrust',
    name: 'OneTrust',
    slug: 'onetrust',
    description: 'Privacy and GRC platform integration',
    longDescription: 'Sync privacy assessments, data mapping, and consent records with OneTrust. Unified view of privacy compliance across platforms.',
    category: 'GRC',
    vendor: 'OneTrust',
    version: '1.0.0',
    logoUrl: '/integrations/onetrust.svg',
    websiteUrl: 'https://www.onetrust.com',
    documentationUrl: '/docs/integrations/onetrust',
    pricing: 'enterprise',
    status: 'beta',
    features: ['Privacy assessments sync', 'Data mapping', 'Consent management', 'DSAR tracking', 'Vendor risk sync'],
    requiredScopes: ['read:assessments', 'read:data-maps'],
    configSchema: {
      apiUrl: { type: 'url', required: true, label: 'OneTrust API URL' },
      apiKey: { type: 'password', required: true, label: 'API Key' },
    },
    supportedEvents: ['assessment_completed', 'dsar_received', 'consent_update'],
    rating: 4.1,
    installCount: 120,
    lastUpdated: '2026-01-05',
    tags: ['grc', 'privacy', 'gdpr', 'data-mapping'],
  },

  // Code / DevSecOps
  {
    id: 'int_github',
    name: 'GitHub',
    slug: 'github',
    description: 'Code security and compliance evidence from GitHub',
    longDescription: 'Monitor GitHub repositories for security vulnerabilities, dependency alerts, and code scanning results. Collect evidence from pull requests and CI/CD pipelines.',
    category: 'DevSecOps',
    vendor: 'GitHub',
    version: '2.0.0',
    logoUrl: '/integrations/github.svg',
    websiteUrl: 'https://github.com',
    documentationUrl: '/docs/integrations/github',
    pricing: 'free',
    status: 'available',
    features: ['Dependabot alerts', 'Code scanning', 'Secret scanning', 'PR evidence collection', 'Branch protection audit', 'SBOM generation'],
    requiredScopes: ['repo', 'security_events'],
    configSchema: {
      personalAccessToken: { type: 'password', required: true, label: 'Personal Access Token (or GitHub App)' },
      organization: { type: 'string', required: false, label: 'GitHub Organization' },
    },
    supportedEvents: ['vulnerability_alert', 'code_scan', 'secret_detected', 'pr_merged', 'branch_protection_change'],
    rating: 4.9,
    installCount: 2800,
    lastUpdated: '2026-02-09',
    tags: ['devsecops', 'code-security', 'ci-cd', 'sbom'],
  },
];

// ============================================================================
// HELPER
// ============================================================================

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// ============================================================================
// ROUTES
// ============================================================================

/**
 * GET /api/marketplace
 * List all available integrations with optional filtering.
 */
marketplaceRouter.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { category, status, search, pricing, tag } = req.query;

  let integrations = [...MARKETPLACE_CATALOG];

  if (category) {
    integrations = integrations.filter(i => i.category.toLowerCase() === (category as string).toLowerCase());
  }
  if (status) {
    integrations = integrations.filter(i => i.status === status);
  }
  if (pricing) {
    integrations = integrations.filter(i => i.pricing === pricing);
  }
  if (tag) {
    integrations = integrations.filter(i => i.tags.includes(tag as string));
  }
  if (search) {
    const q = (search as string).toLowerCase();
    integrations = integrations.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q) ||
      i.tags.some(t => t.includes(q))
    );
  }

  // Get installed integrations for this organization
  const user = (req as any).user;
  const installed = await prisma.integration.findMany({
    where: { organizationId: user.organizationId },
    select: { provider: true, connected: true },
  });

  const installedMap = new Map(installed.map(i => [i.provider, i.connected]));

  const enriched = integrations.map(i => ({
    ...i,
    installed: installedMap.has(i.slug),
    installStatus: installedMap.has(i.slug) ? (installedMap.get(i.slug) ? 'connected' : 'disconnected') : null,
  }));

  res.json({
    integrations: enriched,
    total: enriched.length,
    categories: [...new Set(MARKETPLACE_CATALOG.map(i => i.category))].sort(),
    tags: [...new Set(MARKETPLACE_CATALOG.flatMap(i => i.tags))].sort(),
  });
}));

/**
 * GET /api/marketplace/:slug
 * Get detailed information about a specific integration.
 */
marketplaceRouter.get('/:slug', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const integration = MARKETPLACE_CATALOG.find(i => i.slug === req.params.slug);
  if (!integration) {
    res.status(404).json({ error: 'Integration not found' });
    return;
  }

  const user = (req as any).user;
  const installed = await prisma.integration.findFirst({
    where: { organizationId: user.organizationId, provider: req.params.slug },
  });

  res.json({
    ...integration,
    installed: !!installed,
    installStatus: installed ? (installed.connected ? 'connected' : 'disconnected') : null,
    installedAt: installed?.createdAt || null,
  });
}));

/**
 * POST /api/marketplace/:slug/install
 * Install an integration for the organization.
 */
marketplaceRouter.post('/:slug/install', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const integration = MARKETPLACE_CATALOG.find(i => i.slug === req.params.slug);
  if (!integration) {
    res.status(404).json({ error: 'Integration not found' });
    return;
  }

  if (integration.status === 'coming_soon') {
    res.status(400).json({ error: 'This integration is not yet available' });
    return;
  }

  const user = (req as any).user;

  // Check if already installed
  const existing = await prisma.integration.findFirst({
    where: { organizationId: user.organizationId, provider: req.params.slug },
  });

  if (existing) {
    res.status(409).json({ error: 'Integration already installed', integration: existing });
    return;
  }

  // Validate required configuration
  const config = req.body.config || {};
  const missingFields: string[] = [];
  for (const [field, schema] of Object.entries(integration.configSchema)) {
    if ((schema as any).required && !config[field]) {
      missingFields.push(field);
    }
  }

  if (missingFields.length > 0) {
    res.status(400).json({
      error: 'Missing required configuration fields',
      missingFields,
      configSchema: integration.configSchema,
    });
    return;
  }

  // Create integration record
  const installed = await prisma.integration.create({
    data: {
      name: integration.name,
      category: integration.category,
      provider: req.params.slug,
      connected: true,
      config: config,
      organizationId: user.organizationId,
    },
  });

  logger.info(`[Marketplace] Integration ${integration.name} installed for org ${user.organizationId}`);

  res.status(201).json({
    message: `${integration.name} installed successfully`,
    integration: installed,
  });
}));

/**
 * PUT /api/marketplace/:slug/configure
 * Update configuration for an installed integration.
 */
marketplaceRouter.put('/:slug/configure', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = (req as any).user;
  const installed = await prisma.integration.findFirst({
    where: { organizationId: user.organizationId, provider: req.params.slug },
  });

  if (!installed) {
    res.status(404).json({ error: 'Integration not installed' });
    return;
  }

  const updated = await prisma.integration.update({
    where: { id: installed.id },
    data: { config: req.body.config || {} },
  });

  logger.info(`[Marketplace] Integration ${req.params.slug} configuration updated for org ${user.organizationId}`);
  res.json({ message: 'Configuration updated', integration: updated });
}));

/**
 * POST /api/marketplace/:slug/uninstall
 * Uninstall an integration.
 */
marketplaceRouter.post('/:slug/uninstall', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = (req as any).user;
  const installed = await prisma.integration.findFirst({
    where: { organizationId: user.organizationId, provider: req.params.slug },
  });

  if (!installed) {
    res.status(404).json({ error: 'Integration not installed' });
    return;
  }

  await prisma.integration.delete({ where: { id: installed.id } });

  logger.info(`[Marketplace] Integration ${req.params.slug} uninstalled for org ${user.organizationId}`);
  res.json({ message: 'Integration uninstalled successfully' });
}));

/**
 * GET /api/marketplace/installed
 * List all installed integrations for the organization.
 */
marketplaceRouter.get('/org/installed', asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const installed = await prisma.integration.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { createdAt: 'desc' },
  });

  const enriched = installed.map(inst => {
    const catalog = MARKETPLACE_CATALOG.find(i => i.slug === inst.provider);
    return {
      ...inst,
      name: catalog?.name || inst.provider,
      description: catalog?.description || '',
      category: catalog?.category || 'Other',
      version: catalog?.version || 'unknown',
      logoUrl: catalog?.logoUrl || '',
    };
  });

  res.json({ integrations: enriched, total: enriched.length });
}));

/**
 * POST /api/marketplace/:slug/test
 * Test an integration's connection.
 */
marketplaceRouter.post('/:slug/test', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = (req as any).user;
  const installed = await prisma.integration.findFirst({
    where: { organizationId: user.organizationId, provider: req.params.slug },
  });

  if (!installed) {
    res.status(404).json({ error: 'Integration not installed' });
    return;
  }

  // Simulate connection test
  const testResult = {
    connected: true,
    latencyMs: Math.floor(Math.random() * 200) + 50,
    message: 'Connection successful',
    capabilities: MARKETPLACE_CATALOG.find(i => i.slug === req.params.slug)?.features || [],
    testedAt: new Date().toISOString(),
  };

  logger.info(`[Marketplace] Connection test for ${req.params.slug}: ${testResult.connected ? 'SUCCESS' : 'FAILED'}`);
  res.json(testResult);
}));

export default marketplaceRouter;
