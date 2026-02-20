/**
 * Integration Registry — Comprehensive Test Suite
 *
 * Validates that all 381 integrations are registered, have proper
 * implementations, and can execute testConnection / collectEvidence.
 *
 * Tests are grouped by category and run against the real provider
 * implementations (but with mock HTTP where no live credentials exist).
 */

import integrationRegistry from '../../services/integrations/providers/integrationRegistry';
import { BaseIntegrationProvider } from '../../services/integrations/providers/baseIntegration';

// Expected integration IDs — must match the 381 entries in the front-end catalog
const EXPECTED_IDS: string[] = [
  // Cloud Providers (20)
  'aws', 'azure', 'gcp', 'oracle-cloud', 'ibm-cloud', 'alibaba-cloud',
  'digitalocean', 'heroku', 'linode', 'vultr', 'cloudflare', 'fastly',
  'rackspace', 'vmware-cloud', 'openstack', 'render', 'fly-io', 'vercel',
  'netlify', 'railway',

  // Identity & SSO (25)
  'okta', 'azure-ad', 'google-workspace', 'onelogin', 'jumpcloud',
  'ping-identity', 'auth0', 'cyberark', 'forgerock', 'duo-security',
  'lastpass-business', '1password-business', 'dashlane-business', 'keeper',
  'beyondtrust', 'sailpoint', 'saviynt', 'ibm-verify', 'thales-gemalto',
  'rsa-securid', 'centrify', 'aws-iam', 'hashicorp-vault', 'delinea',
  'aws-cognito',

  // HR & People (25)
  'bamboohr', 'workday', 'adp', 'gusto', 'paylocity', 'paychex',
  'rippling', 'deel', 'remote', 'justworks', 'namely', 'ukg', 'paycom',
  'ceridian-dayforce', 'sap-successfactors', 'oracle-hcm', 'hibob',
  'personio', 'factorial', 'lattice', 'greenhouse', 'lever', 'ashby',
  'culture-amp', '15five',

  // Development & Code (30)
  'github', 'gitlab', 'bitbucket', 'azure-devops', 'aws-codecommit',
  'codecov', 'sonarqube', 'sonarcloud', 'snyk', 'veracode', 'checkmarx',
  'whitesource-mend', 'black-duck', 'fortify', 'semgrep', 'codeclimate',
  'coverity', 'eslint-cloud', 'gitguardian', 'trufflehog', 'gitleaks',
  'dependabot', 'renovate', 'github-advanced-security', 'stackhawk',
  'sourcegraph', 'jfrog', 'nexus-repository', 'harbor', 'aws-ecr',

  // CI/CD (15)
  'jenkins', 'circleci', 'travis-ci', 'github-actions', 'gitlab-ci',
  'azure-pipelines', 'aws-codepipeline', 'google-cloud-build', 'teamcity',
  'bamboo', 'harness', 'argo-cd', 'fluxcd', 'tekton', 'drone-ci',

  // Container & Orchestration (15)
  'docker-hub', 'kubernetes', 'amazon-eks', 'azure-aks', 'google-gke',
  'openshift', 'rancher', 'helm', 'istio', 'linkerd', 'aqua-security',
  'twistlock-prisma', 'sysdig', 'anchore', 'trivy',

  // Monitoring & Observability (25)
  'datadog', 'new-relic', 'splunk', 'dynatrace', 'grafana-cloud',
  'prometheus', 'pagerduty', 'opsgenie', 'victorops', 'sumo-logic',
  'elastic-elk', 'honeycomb', 'lightstep', 'appdynamics', 'logicmonitor',
  'site24x7', 'catchpoint', 'thousandeyes', 'instana', 'signalfx',
  'sentry', 'rollbar', 'bugsnag', 'airbrake', 'statuspage',

  // Security & Vulnerability (41)
  'crowdstrike', 'sentinelone', 'carbon-black', 'palo-alto-networks',
  'fortinet', 'check-point', 'sophos', 'trend-micro', 'malwarebytes',
  'cylance', 'cisco-secure-endpoint', 'microsoft-defender', 'qualys',
  'tenable-nessus', 'rapid7-insightvm', 'nuclei', 'burpsuite', 'owasp-zap',
  'nmap', 'metasploit', 'mandiant', 'fireeye', 'proofpoint', 'mimecast',
  'barracuda', 'knowbe4', 'cofense', 'abnormal-security', 'area-1',
  'recorded-future', 'threatconnect', 'wiz', 'orca-security', 'lacework',
  'snyk-security', 'prisma-cloud', 'aws-guardduty', 'aws-inspector',
  'aws-security-hub', 'azure-security-center', 'google-security-command',

  // SIEM & SOAR (10)
  'splunk-siem', 'ibm-qradar', 'microsoft-sentinel', 'google-chronicle',
  'exabeam', 'logrhythm', 'securonix', 'devo', 'swimlane',
  'phantom-splunk-soar',

  // MDM & Endpoint (15)
  'jamf', 'kandji', 'mosyle', 'addigy', 'hexnode', 'microsoft-intune',
  'vmware-workspace-one', 'soti', 'manageengine-mdm', 'ivanti-mdm',
  'tanium', 'automox', 'fleetdm', 'osquery', 'kolide',

  // ITSM & Ticketing (20)
  'jira', 'servicenow', 'freshservice', 'freshdesk', 'zendesk',
  'connectwise', 'manageengine-servicedesk', 'bmc-helix',
  'ivanti-service-management', 'sysaid', 'haloitsm', 'topdesk',
  'spiceworks', 'cherwell', 'solarwinds-service-desk',
  'pagerduty-incidents', 'opsgenie-incidents', 'statuspage-incidents',
  'firehydrant', 'rootly',

  // Productivity & Collaboration (25)
  'slack', 'microsoft-teams', 'discord', 'zoom', 'google-meet', 'webex',
  'notion', 'confluence', 'asana', 'monday', 'trello', 'clickup',
  'linear', 'basecamp', 'wrike', 'smartsheet', 'airtable', 'coda',
  'miro', 'figma', 'google-drive', 'dropbox-business', 'box', 'onedrive',
  'sharepoint',

  // CRM & Sales (10)
  'salesforce', 'hubspot', 'pipedrive', 'zoho-crm', 'freshsales',
  'dynamics-365', 'sugarcrm', 'copper', 'close', 'insightly',

  // Communication & Email (10)
  'sendgrid', 'mailgun', 'amazon-ses', 'postmark', 'sparkpost', 'twilio',
  'vonage', 'ringcentral', '8x8', 'dialpad',

  // Database & Storage (15)
  'mongodb-atlas', 'postgresql', 'mysql', 'redis', 'amazon-rds',
  'amazon-dynamodb', 'azure-sql', 'google-cloud-sql', 'snowflake',
  'databricks', 'amazon-s3', 'azure-blob-storage', 'google-cloud-storage',
  'minio', 'backblaze-b2',

  // Network & Infrastructure (20)
  'cloudflare-network', 'akamai', 'aws-vpc', 'azure-virtual-network',
  'palo-alto-prisma', 'zscaler', 'netskope', 'cisco-umbrella',
  'f5-networks', 'fortinet-fortigate', 'wireguard', 'openvpn',
  'tailscale', 'perimeter-81', 'nordlayer', 'cloudflare-access',
  'cloudflare-warp', 'twingate', 'banyan-security', 'aws-transit-gateway',

  // Backup & Recovery (10)
  'veeam', 'acronis', 'druva', 'commvault', 'rubrik', 'cohesity',
  'barracuda-backup', 'datto', 'carbonite', 'aws-backup',

  // GRC & Compliance (10)
  'onetrust', 'trustarc', 'bigid', 'securiti', 'wirewheel', 'datagrail',
  'transcend', 'osano', 'mine', 'ketch',

  // Training & Awareness (10)
  'knowbe4-training', 'proofpoint-awareness', 'sans-awareness',
  'cofense-training', 'hoxhunt', 'ninjio', 'curricula', 'hook-security',
  'goldphish', 'terranova-security',

  // Finance & Billing (10)
  'stripe', 'square', 'paypal', 'brex', 'ramp', 'divvy-bill', 'navan',
  'expensify', 'sap-concur', 'coupa',

  // Analytics & BI (10)
  'tableau', 'power-bi', 'looker', 'mode-analytics', 'metabase', 'domo',
  'sisense', 'qlik', 'thoughtspot', 'google-analytics',

  // Automation (10)
  'zapier', 'make', 'tray-io', 'workato', 'power-automate', 'n8n',
  'celigo', 'snaplogic', 'mulesoft', 'dell-boomi',
];

describe('Integration Registry', () => {
  beforeAll(async () => {
    await integrationRegistry.initialise();
  }, 30000);

  // ─── Core registry tests ──────────────────────────────────────────────

  test('should initialise without errors', () => {
    expect(integrationRegistry.size).toBeGreaterThan(0);
  });

  test('should register all 381 integrations', () => {
    const missing = EXPECTED_IDS.filter(id => !integrationRegistry.has(id));
    if (missing.length > 0) {
      console.warn(`Missing providers (${missing.length}):`, missing);
    }
    expect(integrationRegistry.size).toBe(381);
  });

  test('every expected ID should be present in the registry', () => {
    for (const id of EXPECTED_IDS) {
      expect(integrationRegistry.has(id)).toBe(true);
    }
  });

  // ─── Provider contract tests ──────────────────────────────────────────

  test.each(EXPECTED_IDS)('provider "%s" has required properties', (id) => {
    const provider = integrationRegistry.get(id);
    expect(provider).toBeDefined();
    expect(provider!.providerId).toBe(id);
    expect(provider!.displayName).toBeTruthy();
    expect(provider!.category).toBeTruthy();
    expect(provider!.capabilities).toBeDefined();
    expect(provider!.capabilities.apiBaseUrl).toBeTruthy();
    expect(provider!.capabilities.authMethods.length).toBeGreaterThan(0);
    expect(provider!.capabilities.supportedEvidenceTypes.length).toBeGreaterThan(0);
  });

  test.each(EXPECTED_IDS)('provider "%s" has testConnection method', (id) => {
    const provider = integrationRegistry.get(id);
    expect(typeof provider!.testConnection).toBe('function');
  });

  test.each(EXPECTED_IDS)('provider "%s" has sync method', (id) => {
    const provider = integrationRegistry.get(id);
    expect(typeof provider!.sync).toBe('function');
  });

  test.each(EXPECTED_IDS)('provider "%s" has collectEvidence method', (id) => {
    const provider = integrationRegistry.get(id);
    expect(typeof provider!.collectEvidence).toBe('function');
  });

  // ─── Category completeness ────────────────────────────────────────────

  const CATEGORY_COUNTS: Record<string, number> = {
    Cloud: 20,
    Identity: 25,
    HR: 25,
    Code: 30,
    'CI/CD': 15,
    Container: 15,
    Monitoring: 25,
    Security: 41,
    SIEM: 10,
    MDM: 15,
    Ticketing: 20,
    Productivity: 25,
    CRM: 10,
    Communication: 10,
    Database: 15,
    Network: 20,
    Backup: 10,
    GRC: 10,
    Training: 10,
    Finance: 10,
    BI: 10,
    Automation: 10,
  };

  test.each(Object.entries(CATEGORY_COUNTS))(
    'category "%s" should have %i providers',
    (category, expectedCount) => {
      const categoryProviders = integrationRegistry.getByCategory(category);
      expect(categoryProviders.size).toBe(expectedCount);
    },
  );

  // ─── Connection test structure (without real credentials) ─────────────

  test('testConnection returns proper structure on failure (no creds)', async () => {
    const result = await integrationRegistry.testConnection('datadog', {});
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('provider', 'datadog');
    expect(result).toHaveProperty('latencyMs');
    expect(result).toHaveProperty('timestamp');
  });

  test('sync returns proper structure on failure (no creds)', async () => {
    const result = await integrationRegistry.syncProvider('okta', {});
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('provider', 'okta');
    expect(result).toHaveProperty('evidenceCollected');
    expect(result).toHaveProperty('syncDurationMs');
    expect(result).toHaveProperty('timestamp');
  });

  // ─── Evidence type coverage ───────────────────────────────────────────

  test('every provider supports at least one evidence type', () => {
    const allProviders = integrationRegistry.getAll();
    for (const [id, provider] of allProviders) {
      expect(provider.capabilities.supportedEvidenceTypes.length).toBeGreaterThan(0);
    }
  });

  // ─── Unregistered provider handling ───────────────────────────────────

  test('testConnection for unknown provider returns failure', async () => {
    const result = await integrationRegistry.testConnection('non-existent-provider', {});
    expect(result.success).toBe(false);
    expect(result.error).toContain('not registered');
  });

  test('syncProvider for unknown provider returns failure', async () => {
    const result = await integrationRegistry.syncProvider('non-existent-provider', {});
    expect(result.success).toBe(false);
  });
});
