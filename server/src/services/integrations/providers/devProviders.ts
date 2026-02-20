/**
 * Dev / CI-CD / Container Provider Integrations (60 providers)
 * Real API implementations for code quality, CI/CD pipeline, and container providers.
 *
 * Code (30): Source control, code scanning, dependency analysis, secret detection
 * CI/CD (15): Build pipelines, continuous delivery, GitOps
 * Container (15): Container registries, orchestration, service mesh, container security
 */
import { createProviders, ProviderDescriptor } from './providerFactory';

const descriptors: ProviderDescriptor[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // CODE PROVIDERS (30)
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Source Control ──────────────────────────────────────────────────────
  {
    id: 'github', name: 'GitHub', category: 'Code',
    apiBaseUrl: 'https://api.github.com', apiDocsUrl: 'https://docs.github.com/en/rest',
    authMethods: ['pat', 'oauth'], testEndpoint: '/user',
    evidenceEndpoints: [
      { type: 'configuration', title: 'GitHub User', description: 'Authenticated user account details', path: '/user', method: 'GET' },
      { type: 'asset_inventory', title: 'GitHub Repositories', description: 'Repository inventory for the authenticated user', path: '/user/repos?per_page=100', method: 'GET' },
      { type: 'access_control', title: 'GitHub Org Members', description: 'Organization membership and access levels', path: '/user/orgs', method: 'GET' },
      { type: 'vulnerability_scan', title: 'GitHub Dependabot Alerts', description: 'Dependabot security vulnerability alerts', path: '/user/repos?per_page=100', method: 'GET' },
      { type: 'change_management', title: 'GitHub Pull Requests', description: 'Pull request history for change management audit', path: '/user/repos?per_page=100', method: 'GET' },
      { type: 'audit_log', title: 'GitHub Audit Log', description: 'Organization audit log events', path: '/user/orgs', method: 'GET' },
    ],
  },
  {
    id: 'gitlab', name: 'GitLab', category: 'Code',
    apiBaseUrl: 'https://gitlab.com/api/v4', apiDocsUrl: 'https://docs.gitlab.com/ee/api/',
    authMethods: ['pat', 'oauth'], testEndpoint: '/user',
    evidenceEndpoints: [
      { type: 'configuration', title: 'GitLab User', description: 'Authenticated user account details', path: '/user', method: 'GET' },
      { type: 'asset_inventory', title: 'GitLab Projects', description: 'Repository inventory for the authenticated user', path: '/projects?membership=true', method: 'GET' },
      { type: 'access_control', title: 'GitLab Group Members', description: 'Group membership and access levels', path: '/groups?min_access_level=10', method: 'GET' },
      { type: 'vulnerability_scan', title: 'GitLab Vulnerability Report', description: 'Project vulnerability findings from GitLab scanners', path: '/projects/{account}/vulnerability_findings', method: 'GET' },
      { type: 'change_management', title: 'GitLab Merge Requests', description: 'Merge request history for change management audit', path: '/projects/{account}/merge_requests?state=merged&per_page=100', method: 'GET' },
      { type: 'audit_log', title: 'GitLab Audit Events', description: 'Instance-level audit events', path: '/audit_events', method: 'GET' },
    ],
  },
  {
    id: 'bitbucket', name: 'Bitbucket', category: 'Code',
    apiBaseUrl: 'https://api.bitbucket.org/2.0', apiDocsUrl: 'https://developer.atlassian.com/cloud/bitbucket/rest/',
    authMethods: ['pat', 'oauth', 'username-password'], testEndpoint: '/user',
    evidenceEndpoints: [
      { type: 'configuration', title: 'Bitbucket User', description: 'Authenticated user profile', path: '/user', method: 'GET' },
      { type: 'asset_inventory', title: 'Bitbucket Repositories', description: 'Repository inventory across workspaces', path: '/repositories/{account}', method: 'GET' },
      { type: 'access_control', title: 'Bitbucket Workspace Members', description: 'Workspace membership for access review', path: '/workspaces/{account}/members', method: 'GET' },
      { type: 'change_management', title: 'Bitbucket Pull Requests', description: 'Pull request activity for change management', path: '/repositories/{account}/{repo}/pullrequests?state=MERGED', method: 'GET' },
      { type: 'configuration', title: 'Bitbucket Branch Restrictions', description: 'Branch protection and restriction rules', path: '/repositories/{account}/{repo}/branch-restrictions', method: 'GET' },
    ],
  },
  {
    id: 'azure-devops', name: 'Azure DevOps', category: 'Code',
    apiBaseUrl: 'https://dev.azure.com/{org}', apiDocsUrl: 'https://learn.microsoft.com/en-us/rest/api/azure/devops/',
    authMethods: ['pat', 'oauth'], authPrefix: 'Basic',
    testEndpoint: '/_apis/projects?api-version=7.0',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'Azure DevOps Projects', description: 'Project inventory in the organization', path: '/_apis/projects?api-version=7.0', method: 'GET' },
      { type: 'access_control', title: 'Azure DevOps Teams', description: 'Team membership across projects', path: '/_apis/teams?api-version=7.0-preview.3', method: 'GET' },
      { type: 'change_management', title: 'Azure DevOps Pull Requests', description: 'Pull requests for change tracking', path: '/{account}/_apis/git/pullrequests?searchCriteria.status=completed&api-version=7.0', method: 'GET' },
      { type: 'configuration', title: 'Azure DevOps Policies', description: 'Branch policy configurations', path: '/{account}/_apis/policy/configurations?api-version=7.0', method: 'GET' },
      { type: 'audit_log', title: 'Azure DevOps Audit Log', description: 'Organization audit log stream', path: '/_apis/audit/auditlog?api-version=7.0-preview.1', method: 'GET' },
    ],
  },
  {
    id: 'aws-codecommit', name: 'AWS CodeCommit', category: 'Code',
    apiBaseUrl: 'https://codecommit.{region}.amazonaws.com', apiDocsUrl: 'https://docs.aws.amazon.com/codecommit/latest/APIReference/',
    authMethods: ['iam'], testEndpoint: '/',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'CodeCommit Repositories', description: 'List of CodeCommit repositories', path: '/', method: 'POST', params: { Action: 'ListRepositories' } },
      { type: 'change_management', title: 'CodeCommit Pull Requests', description: 'Pull request activity for change management', path: '/', method: 'POST', params: { Action: 'ListPullRequests' } },
      { type: 'access_control', title: 'CodeCommit Approvals', description: 'Approval rule templates for code reviews', path: '/', method: 'POST', params: { Action: 'ListApprovalRuleTemplates' } },
      { type: 'configuration', title: 'CodeCommit Repository Triggers', description: 'Repository trigger configurations', path: '/', method: 'POST', params: { Action: 'GetRepositoryTriggers' } },
    ],
  },

  // ── Code Quality & Coverage ─────────────────────────────────────────────
  {
    id: 'codecov', name: 'Codecov', category: 'Code',
    apiBaseUrl: 'https://api.codecov.io/api/v2', apiDocsUrl: 'https://docs.codecov.io/reference',
    authMethods: ['api-key', 'pat'], testEndpoint: '/github/{account}',
    evidenceEndpoints: [
      { type: 'configuration', title: 'Codecov Owner', description: 'Organization owner details and settings', path: '/github/{account}', method: 'GET' },
      { type: 'compliance_status', title: 'Codecov Repositories', description: 'Repository coverage compliance status', path: '/github/{account}/repos', method: 'GET' },
      { type: 'vulnerability_scan', title: 'Codecov Commits', description: 'Coverage data for recent commits', path: '/github/{account}/repos/{repo}/commits', method: 'GET' },
    ],
  },
  {
    id: 'sonarqube', name: 'SonarQube', category: 'Code',
    apiBaseUrl: 'https://{instance}/api', apiDocsUrl: 'https://docs.sonarqube.org/latest/extension/api/',
    authMethods: ['api-key', 'pat', 'username-password'], testEndpoint: '/system/status',
    evidenceEndpoints: [
      { type: 'configuration', title: 'SonarQube System Status', description: 'SonarQube server status and version', path: '/system/status', method: 'GET' },
      { type: 'vulnerability_scan', title: 'SonarQube Issues', description: 'Code quality and security issues', path: '/issues/search?resolved=false&severities=CRITICAL,BLOCKER', method: 'GET' },
      { type: 'compliance_status', title: 'SonarQube Quality Gates', description: 'Quality gate status for all projects', path: '/qualitygates/project_status?projectKey={account}', method: 'GET' },
      { type: 'asset_inventory', title: 'SonarQube Projects', description: 'Project inventory and analysis status', path: '/projects/search', method: 'GET' },
      { type: 'vulnerability_scan', title: 'SonarQube Hotspots', description: 'Security hotspots requiring review', path: '/hotspots/search?projectKey={account}', method: 'GET' },
    ],
  },
  {
    id: 'sonarcloud', name: 'SonarCloud', category: 'Code',
    apiBaseUrl: 'https://sonarcloud.io/api', apiDocsUrl: 'https://sonarcloud.io/web_api',
    authMethods: ['api-key', 'pat'], testEndpoint: '/authentication/validate',
    evidenceEndpoints: [
      { type: 'configuration', title: 'SonarCloud Auth', description: 'Authentication validation status', path: '/authentication/validate', method: 'GET' },
      { type: 'vulnerability_scan', title: 'SonarCloud Issues', description: 'Code quality and security issues', path: '/issues/search?organization={account}&resolved=false&severities=CRITICAL,BLOCKER', method: 'GET' },
      { type: 'compliance_status', title: 'SonarCloud Quality Gates', description: 'Quality gate evaluation results', path: '/qualitygates/project_status?projectKey={account}', method: 'GET' },
      { type: 'asset_inventory', title: 'SonarCloud Projects', description: 'Project inventory in organization', path: '/projects/search?organization={account}', method: 'GET' },
    ],
  },

  // ── Security & Vulnerability Scanning ──────────────────────────────────
  {
    id: 'snyk', name: 'Snyk', category: 'Code',
    apiBaseUrl: 'https://api.snyk.io/rest', apiDocsUrl: 'https://apidocs.snyk.io/',
    authMethods: ['api-key', 'pat'], testEndpoint: '/self?version=2024-04-29',
    evidenceEndpoints: [
      { type: 'configuration', title: 'Snyk Self', description: 'Authenticated user and organization details', path: '/self?version=2024-04-29', method: 'GET' },
      { type: 'asset_inventory', title: 'Snyk Orgs', description: 'Organization inventory', path: '/orgs?version=2024-04-29', method: 'GET' },
      { type: 'vulnerability_scan', title: 'Snyk Issues', description: 'Vulnerability issues across projects', path: '/orgs/{account}/issues?version=2024-04-29', method: 'GET' },
      { type: 'asset_inventory', title: 'Snyk Projects', description: 'Monitored project inventory', path: '/orgs/{account}/projects?version=2024-04-29', method: 'GET' },
      { type: 'compliance_status', title: 'Snyk License Issues', description: 'License compliance issues', path: 'https://api.snyk.io/v1/org/{account}/licenses', method: 'POST', params: { filters: {} } },
    ],
  },
  {
    id: 'veracode', name: 'Veracode', category: 'Code',
    apiBaseUrl: 'https://api.veracode.com', apiDocsUrl: 'https://docs.veracode.com/r/c_rest_intro',
    authMethods: ['api-key-secret'], testEndpoint: '/appsec/v1/applications',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'Veracode Applications', description: 'Application profiles inventory', path: '/appsec/v1/applications', method: 'GET' },
      { type: 'vulnerability_scan', title: 'Veracode Findings', description: 'Static and dynamic analysis findings', path: '/appsec/v2/applications/{account}/findings', method: 'GET' },
      { type: 'compliance_status', title: 'Veracode Policy Status', description: 'Policy compliance evaluation for applications', path: '/appsec/v1/applications/{account}/policy', method: 'GET' },
      { type: 'vulnerability_scan', title: 'Veracode SCA Issues', description: 'Software composition analysis vulnerability findings', path: '/srcclr/v3/workspaces/{account}/issues', method: 'GET' },
    ],
  },
  {
    id: 'checkmarx', name: 'Checkmarx', category: 'Code',
    apiBaseUrl: 'https://{instance}/cxrestapi', apiDocsUrl: 'https://checkmarx.com/resource/documents/en/34965-68609-checkmarx-one-api-reference.html',
    authMethods: ['username-password', 'api-key'], testEndpoint: '/auth/identity/connect/userinfo',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'Checkmarx Projects', description: 'SAST project inventory', path: '/projects', method: 'GET' },
      { type: 'vulnerability_scan', title: 'Checkmarx Scan Results', description: 'SAST scan vulnerability findings', path: '/sast/scans?last=1&projectId={account}', method: 'GET' },
      { type: 'configuration', title: 'Checkmarx Presets', description: 'Scan preset configurations', path: '/sast/presets', method: 'GET' },
      { type: 'compliance_status', title: 'Checkmarx Scan Status', description: 'Latest scan status and risk score', path: '/sast/scans?last=1', method: 'GET' },
    ],
  },
  {
    id: 'whitesource-mend', name: 'Mend (WhiteSource)', category: 'Code',
    apiBaseUrl: 'https://api-{instance}.mend.io/api/v2.0', apiDocsUrl: 'https://docs.mend.io/bundle/mend-api-2-0/',
    authMethods: ['api-key'], testEndpoint: '/orgs',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'Mend Organizations', description: 'Organization inventory', path: '/orgs', method: 'GET' },
      { type: 'vulnerability_scan', title: 'Mend Vulnerabilities', description: 'Open source vulnerability findings', path: '/orgs/{account}/vulnerabilities', method: 'GET' },
      { type: 'compliance_status', title: 'Mend License Findings', description: 'License compliance risk findings', path: '/orgs/{account}/licenses', method: 'GET' },
      { type: 'asset_inventory', title: 'Mend Projects', description: 'Monitored project inventory', path: '/orgs/{account}/projects', method: 'GET' },
    ],
  },
  {
    id: 'black-duck', name: 'Black Duck', category: 'Code',
    apiBaseUrl: 'https://{instance}/api', apiDocsUrl: 'https://sig-product-docs.synopsys.com/bundle/bd-hub/page/1702503.html',
    authMethods: ['api-key'], authHeader: 'Authorization', authPrefix: 'Bearer',
    testEndpoint: '/current-user',
    evidenceEndpoints: [
      { type: 'configuration', title: 'Black Duck User', description: 'Current authenticated user details', path: '/current-user', method: 'GET' },
      { type: 'asset_inventory', title: 'Black Duck Projects', description: 'Project inventory for SCA scanning', path: '/projects?limit=100', method: 'GET' },
      { type: 'vulnerability_scan', title: 'Black Duck Vulnerabilities', description: 'Open source vulnerability findings', path: '/projects/{account}/versions/{version}/vulnerable-bom-components', method: 'GET' },
      { type: 'compliance_status', title: 'Black Duck Policy Status', description: 'Policy violation status', path: '/projects/{account}/versions/{version}/policy-status', method: 'GET' },
    ],
  },
  {
    id: 'fortify', name: 'Fortify', category: 'Code',
    apiBaseUrl: 'https://{instance}/ssc/api/v1', apiDocsUrl: 'https://www.microfocus.com/documentation/fortify-software-security-center/',
    authMethods: ['api-key', 'username-password'], testEndpoint: '/userSession/info',
    evidenceEndpoints: [
      { type: 'configuration', title: 'Fortify Session Info', description: 'Authenticated session information', path: '/userSession/info', method: 'GET' },
      { type: 'asset_inventory', title: 'Fortify Projects', description: 'Application version inventory', path: '/projectVersions?limit=100', method: 'GET' },
      { type: 'vulnerability_scan', title: 'Fortify Issues', description: 'Static analysis vulnerability issues', path: '/projectVersions/{account}/issues?limit=100', method: 'GET' },
      { type: 'compliance_status', title: 'Fortify Audit Status', description: 'Audit status for project versions', path: '/projectVersions/{account}/performanceIndicatorHistories', method: 'GET' },
    ],
  },
  {
    id: 'semgrep', name: 'Semgrep', category: 'Code',
    apiBaseUrl: 'https://semgrep.dev/api/v1', apiDocsUrl: 'https://semgrep.dev/docs/semgrep-cloud-platform/semgrep-api/',
    authMethods: ['api-key', 'pat'], testEndpoint: '/deployments',
    evidenceEndpoints: [
      { type: 'configuration', title: 'Semgrep Deployments', description: 'Deployment (organization) details', path: '/deployments', method: 'GET' },
      { type: 'vulnerability_scan', title: 'Semgrep Findings', description: 'SAST findings across repositories', path: '/deployments/{account}/findings?dedup=true', method: 'GET' },
      { type: 'asset_inventory', title: 'Semgrep Projects', description: 'Monitored project inventory', path: '/deployments/{account}/projects', method: 'GET' },
      { type: 'configuration', title: 'Semgrep Policies', description: 'Rule policies and configurations', path: '/deployments/{account}/policies', method: 'GET' },
    ],
  },
  {
    id: 'codeclimate', name: 'Code Climate', category: 'Code',
    apiBaseUrl: 'https://api.codeclimate.com/v1', apiDocsUrl: 'https://codeclimate.com/docs/api',
    authMethods: ['api-key', 'pat'], testEndpoint: '/orgs',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'Code Climate Orgs', description: 'Organization inventory', path: '/orgs', method: 'GET' },
      { type: 'asset_inventory', title: 'Code Climate Repos', description: 'Monitored repository inventory', path: '/orgs/{account}/repos', method: 'GET' },
      { type: 'vulnerability_scan', title: 'Code Climate Issues', description: 'Code quality and maintainability issues', path: '/repos/{account}/ref/{ref}/issues', method: 'GET' },
      { type: 'compliance_status', title: 'Code Climate Test Coverage', description: 'Test coverage reports for compliance', path: '/repos/{account}/test_reports', method: 'GET' },
    ],
  },
  {
    id: 'coverity', name: 'Coverity', category: 'Code',
    apiBaseUrl: 'https://{instance}/api/v2', apiDocsUrl: 'https://sig-product-docs.synopsys.com/bundle/coverity/page/coverity-web-api-doc.html',
    authMethods: ['username-password', 'api-key'], testEndpoint: '/configuration/users?namePattern=*&pageSize=1',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'Coverity Projects', description: 'SAST project inventory', path: '/projects?pageSize=100', method: 'GET' },
      { type: 'vulnerability_scan', title: 'Coverity Issues', description: 'Static analysis defect findings', path: '/projects/{account}/issues?pageSize=100', method: 'GET' },
      { type: 'configuration', title: 'Coverity Streams', description: 'Analysis stream configurations', path: '/streams?pageSize=100', method: 'GET' },
      { type: 'compliance_status', title: 'Coverity Snapshots', description: 'Analysis snapshot history', path: '/projects/{account}/snapshots?pageSize=10', method: 'GET' },
    ],
  },
  {
    id: 'eslint-cloud', name: 'ESLint Cloud', category: 'Code',
    apiBaseUrl: 'https://api.eslint.org/v1', apiDocsUrl: 'https://eslint.org/docs/latest/',
    authMethods: ['api-key'], testEndpoint: '/orgs',
    evidenceEndpoints: [
      { type: 'configuration', title: 'ESLint Cloud Orgs', description: 'Organization configuration', path: '/orgs', method: 'GET' },
      { type: 'vulnerability_scan', title: 'ESLint Findings', description: 'Linting rule violations and findings', path: '/orgs/{account}/reports', method: 'GET' },
      { type: 'compliance_status', title: 'ESLint Configs', description: 'Shared configuration compliance', path: '/orgs/{account}/configs', method: 'GET' },
    ],
  },

  // ── Secret Detection ───────────────────────────────────────────────────
  {
    id: 'gitguardian', name: 'GitGuardian', category: 'Code',
    apiBaseUrl: 'https://api.gitguardian.com/v1', apiDocsUrl: 'https://api.gitguardian.com/docs',
    authMethods: ['api-key'], testEndpoint: '/health',
    evidenceEndpoints: [
      { type: 'configuration', title: 'GitGuardian Health', description: 'API health status', path: '/health', method: 'GET' },
      { type: 'vulnerability_scan', title: 'GitGuardian Incidents', description: 'Secret leak incidents', path: '/incidents/secrets?per_page=100', method: 'GET' },
      { type: 'asset_inventory', title: 'GitGuardian Sources', description: 'Monitored source inventory', path: '/sources', method: 'GET' },
      { type: 'compliance_status', title: 'GitGuardian Members', description: 'Workspace member access and permissions', path: '/members', method: 'GET' },
    ],
  },
  {
    id: 'trufflehog', name: 'TruffleHog', category: 'Code',
    apiBaseUrl: 'https://api.trufflehog.org/v1', apiDocsUrl: 'https://trufflesecurity.com/docs/',
    authMethods: ['api-key'], testEndpoint: '/org',
    evidenceEndpoints: [
      { type: 'configuration', title: 'TruffleHog Org', description: 'Organization configuration details', path: '/org', method: 'GET' },
      { type: 'vulnerability_scan', title: 'TruffleHog Secrets', description: 'Discovered secret findings', path: '/org/{account}/secrets', method: 'GET' },
      { type: 'asset_inventory', title: 'TruffleHog Scans', description: 'Secret scan history', path: '/org/{account}/scans', method: 'GET' },
    ],
  },
  {
    id: 'gitleaks', name: 'Gitleaks', category: 'Code',
    apiBaseUrl: 'https://api.gitleaks.io/v1', apiDocsUrl: 'https://gitleaks.io/docs/',
    authMethods: ['api-key'], testEndpoint: '/status',
    evidenceEndpoints: [
      { type: 'configuration', title: 'Gitleaks Status', description: 'Service status and configuration', path: '/status', method: 'GET' },
      { type: 'vulnerability_scan', title: 'Gitleaks Findings', description: 'Secret leak findings across repositories', path: '/orgs/{account}/findings', method: 'GET' },
      { type: 'asset_inventory', title: 'Gitleaks Repos', description: 'Monitored repository inventory', path: '/orgs/{account}/repos', method: 'GET' },
    ],
  },

  // ── Dependency Management ──────────────────────────────────────────────
  {
    id: 'dependabot', name: 'Dependabot', category: 'Code',
    apiBaseUrl: 'https://api.github.com', apiDocsUrl: 'https://docs.github.com/en/rest/dependabot',
    authMethods: ['pat'], testEndpoint: '/user',
    evidenceEndpoints: [
      { type: 'vulnerability_scan', title: 'Dependabot Alerts', description: 'Dependency vulnerability alerts', path: '/repos/{account}/{repo}/dependabot/alerts', method: 'GET' },
      { type: 'change_management', title: 'Dependabot Updates', description: 'Automated dependency update pull requests', path: '/repos/{account}/{repo}/pulls?state=all&head=dependabot', method: 'GET' },
      { type: 'configuration', title: 'Dependabot Config', description: 'Dependabot configuration and enabled repos', path: '/orgs/{account}/dependabot/alerts', method: 'GET' },
    ],
  },
  {
    id: 'renovate', name: 'Renovate', category: 'Code',
    apiBaseUrl: 'https://app.renovatebot.com/api', apiDocsUrl: 'https://docs.renovatebot.com/',
    authMethods: ['api-key', 'pat'], testEndpoint: '/status',
    evidenceEndpoints: [
      { type: 'configuration', title: 'Renovate Status', description: 'Renovate bot service status', path: '/status', method: 'GET' },
      { type: 'asset_inventory', title: 'Renovate Repos', description: 'Repositories managed by Renovate', path: '/orgs/{account}/repos', method: 'GET' },
      { type: 'change_management', title: 'Renovate Updates', description: 'Dependency update history', path: '/orgs/{account}/updates', method: 'GET' },
    ],
  },

  // ── GitHub Security ────────────────────────────────────────────────────
  {
    id: 'github-advanced-security', name: 'GitHub Advanced Security', category: 'Code',
    apiBaseUrl: 'https://api.github.com', apiDocsUrl: 'https://docs.github.com/en/rest/code-scanning',
    authMethods: ['pat', 'oauth'], testEndpoint: '/user',
    evidenceEndpoints: [
      { type: 'vulnerability_scan', title: 'GHAS Code Scanning Alerts', description: 'Code scanning (CodeQL) alerts', path: '/orgs/{account}/code-scanning/alerts', method: 'GET' },
      { type: 'vulnerability_scan', title: 'GHAS Secret Scanning Alerts', description: 'Secret scanning alerts across org', path: '/orgs/{account}/secret-scanning/alerts', method: 'GET' },
      { type: 'vulnerability_scan', title: 'GHAS Dependabot Alerts', description: 'Dependabot security alerts across org', path: '/orgs/{account}/dependabot/alerts', method: 'GET' },
      { type: 'compliance_status', title: 'GHAS Security Overview', description: 'Organization security coverage overview', path: '/orgs/{account}/properties/values', method: 'GET' },
    ],
  },
  {
    id: 'stackhawk', name: 'StackHawk', category: 'Code',
    apiBaseUrl: 'https://api.stackhawk.com/api/v1', apiDocsUrl: 'https://docs.stackhawk.com/api/',
    authMethods: ['api-key'], testEndpoint: '/user',
    evidenceEndpoints: [
      { type: 'configuration', title: 'StackHawk User', description: 'Authenticated user details', path: '/user', method: 'GET' },
      { type: 'asset_inventory', title: 'StackHawk Applications', description: 'Application inventory for DAST scanning', path: '/org/{account}/app', method: 'GET' },
      { type: 'vulnerability_scan', title: 'StackHawk Findings', description: 'DAST vulnerability findings', path: '/org/{account}/app/{app}/findings', method: 'GET' },
      { type: 'compliance_status', title: 'StackHawk Scans', description: 'DAST scan history and results', path: '/org/{account}/app/{app}/scans', method: 'GET' },
    ],
  },

  // ── Code Search & Repositories ─────────────────────────────────────────
  {
    id: 'sourcegraph', name: 'Sourcegraph', category: 'Code',
    apiBaseUrl: 'https://sourcegraph.com/.api', apiDocsUrl: 'https://docs.sourcegraph.com/api/',
    authMethods: ['api-key', 'pat'], testEndpoint: '/graphql',
    evidenceEndpoints: [
      { type: 'configuration', title: 'Sourcegraph User', description: 'Current user details', path: '/graphql', method: 'POST', params: { query: '{ currentUser { username, email } }' } },
      { type: 'asset_inventory', title: 'Sourcegraph Repos', description: 'Indexed repository inventory', path: '/graphql', method: 'POST', params: { query: '{ repositories(first: 100) { nodes { name, url } } }' } },
      { type: 'configuration', title: 'Sourcegraph External Services', description: 'Connected code hosts', path: '/graphql', method: 'POST', params: { query: '{ externalServices(first: 50) { nodes { displayName, kind } } }' } },
    ],
  },

  // ── Artifact Repositories & Container Registries ───────────────────────
  {
    id: 'jfrog', name: 'JFrog Artifactory', category: 'Code',
    apiBaseUrl: 'https://{instance}.jfrog.io/artifactory/api', apiDocsUrl: 'https://jfrog.com/help/r/jfrog-rest-apis',
    authMethods: ['api-key', 'pat', 'username-password'], testEndpoint: '/system/ping',
    evidenceEndpoints: [
      { type: 'configuration', title: 'JFrog System Info', description: 'Artifactory system and version info', path: '/system/version', method: 'GET' },
      { type: 'asset_inventory', title: 'JFrog Repositories', description: 'Artifact repository inventory', path: '/repositories', method: 'GET' },
      { type: 'access_control', title: 'JFrog Users', description: 'User accounts for access review', path: '/security/users', method: 'GET' },
      { type: 'access_control', title: 'JFrog Permissions', description: 'Permission target configurations', path: '/v2/security/permissions', method: 'GET' },
      { type: 'vulnerability_scan', title: 'JFrog Xray Violations', description: 'Xray security and license violations', path: 'https://{instance}.jfrog.io/xray/api/v1/violations', method: 'POST', params: { filters: { min_severity: 'High' }, pagination: { limit: 100 } } },
    ],
  },
  {
    id: 'nexus-repository', name: 'Nexus Repository', category: 'Code',
    apiBaseUrl: 'https://{instance}/service/rest/v1', apiDocsUrl: 'https://help.sonatype.com/repomanager3/integrations/rest-and-integration-api',
    authMethods: ['username-password', 'api-key'], testEndpoint: '/status',
    evidenceEndpoints: [
      { type: 'configuration', title: 'Nexus Status', description: 'Repository manager system status', path: '/status', method: 'GET' },
      { type: 'asset_inventory', title: 'Nexus Repositories', description: 'Repository inventory', path: '/repositories', method: 'GET' },
      { type: 'access_control', title: 'Nexus Users', description: 'User accounts and roles', path: '/security/users', method: 'GET' },
      { type: 'access_control', title: 'Nexus Roles', description: 'Role and privilege definitions', path: '/security/roles', method: 'GET' },
      { type: 'vulnerability_scan', title: 'Nexus IQ Violations', description: 'IQ Server policy violations', path: 'https://{instance}/api/v2/reports/applications', method: 'GET' },
    ],
  },
  {
    id: 'harbor', name: 'Harbor', category: 'Code',
    apiBaseUrl: 'https://{instance}/api/v2.0', apiDocsUrl: 'https://goharbor.io/docs/',
    authMethods: ['username-password', 'api-key'], testEndpoint: '/systeminfo',
    evidenceEndpoints: [
      { type: 'configuration', title: 'Harbor System Info', description: 'Harbor registry system information', path: '/systeminfo', method: 'GET' },
      { type: 'asset_inventory', title: 'Harbor Projects', description: 'Container project inventory', path: '/projects', method: 'GET' },
      { type: 'asset_inventory', title: 'Harbor Repositories', description: 'Container image repository inventory', path: '/projects/{account}/repositories', method: 'GET' },
      { type: 'vulnerability_scan', title: 'Harbor Scan Results', description: 'Container vulnerability scan results', path: '/projects/{account}/repositories/{repo}/artifacts?with_scan_overview=true', method: 'GET' },
      { type: 'access_control', title: 'Harbor Users', description: 'Registry user accounts', path: '/users', method: 'GET' },
    ],
  },
  {
    id: 'aws-ecr', name: 'AWS ECR', category: 'Code',
    apiBaseUrl: 'https://api.ecr.{region}.amazonaws.com', apiDocsUrl: 'https://docs.aws.amazon.com/AmazonECR/latest/APIReference/',
    authMethods: ['iam'], testEndpoint: '/',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'ECR Repositories', description: 'Container image repository inventory', path: '/', method: 'POST', params: { Action: 'DescribeRepositories' } },
      { type: 'vulnerability_scan', title: 'ECR Image Scan Findings', description: 'Container image vulnerability findings', path: '/', method: 'POST', params: { Action: 'DescribeImageScanFindings' } },
      { type: 'configuration', title: 'ECR Registry Policy', description: 'Registry-level access policies', path: '/', method: 'POST', params: { Action: 'GetRegistryPolicy' } },
      { type: 'access_control', title: 'ECR Repository Policy', description: 'Repository access policies', path: '/', method: 'POST', params: { Action: 'GetRepositoryPolicy' } },
    ],
  },

  // ── GitHub Actions (CI/CD via GitHub) ──────────────────────────────────
  {
    id: 'github-actions', name: 'GitHub Actions', category: 'Code',
    apiBaseUrl: 'https://api.github.com', apiDocsUrl: 'https://docs.github.com/en/rest/actions',
    authMethods: ['pat', 'oauth'], testEndpoint: '/user',
    evidenceEndpoints: [
      { type: 'configuration', title: 'GitHub Actions Workflows', description: 'Workflow definitions in repositories', path: '/repos/{account}/{repo}/actions/workflows', method: 'GET' },
      { type: 'change_management', title: 'GitHub Actions Runs', description: 'Workflow run history for CI/CD audit', path: '/repos/{account}/{repo}/actions/runs', method: 'GET' },
      { type: 'access_control', title: 'GitHub Actions Secrets', description: 'Organization-level action secrets (names only)', path: '/orgs/{account}/actions/secrets', method: 'GET' },
      { type: 'configuration', title: 'GitHub Actions Permissions', description: 'Actions permission policies for the org', path: '/orgs/{account}/actions/permissions', method: 'GET' },
      { type: 'asset_inventory', title: 'GitHub Actions Runners', description: 'Self-hosted runner inventory', path: '/orgs/{account}/actions/runners', method: 'GET' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CI/CD PROVIDERS (14 — github excluded, has dedicated service)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'jenkins', name: 'Jenkins', category: 'CI/CD',
    apiBaseUrl: 'https://{instance}', apiDocsUrl: 'https://www.jenkins.io/doc/book/using/remote-access-api/',
    authMethods: ['username-password', 'api-key'], testEndpoint: '/api/json',
    evidenceEndpoints: [
      { type: 'configuration', title: 'Jenkins Instance Info', description: 'Jenkins server and plugin configuration', path: '/api/json', method: 'GET' },
      { type: 'asset_inventory', title: 'Jenkins Jobs', description: 'Build job inventory', path: '/api/json?tree=jobs[name,url,color,lastBuild[number,result,timestamp]]', method: 'GET' },
      { type: 'change_management', title: 'Jenkins Builds', description: 'Build execution history for CI audit', path: '/job/{account}/api/json?tree=builds[number,result,timestamp,duration]', method: 'GET' },
      { type: 'access_control', title: 'Jenkins Security Realm', description: 'Authentication and authorization configuration', path: '/configureSecurity/api/json', method: 'GET' },
      { type: 'configuration', title: 'Jenkins Credentials', description: 'Credential store inventory (names only)', path: '/credentials/store/system/domain/_/api/json', method: 'GET' },
      { type: 'asset_inventory', title: 'Jenkins Nodes', description: 'Build agent/node inventory', path: '/computer/api/json', method: 'GET' },
    ],
  },
  {
    id: 'circleci', name: 'CircleCI', category: 'CI/CD',
    apiBaseUrl: 'https://circleci.com/api/v2', apiDocsUrl: 'https://circleci.com/docs/api/v2/',
    authMethods: ['api-key', 'pat'], testEndpoint: '/me',
    evidenceEndpoints: [
      { type: 'configuration', title: 'CircleCI User', description: 'Authenticated user details', path: '/me', method: 'GET' },
      { type: 'asset_inventory', title: 'CircleCI Projects', description: 'Project pipeline inventory', path: '/me/collaborations', method: 'GET' },
      { type: 'change_management', title: 'CircleCI Pipelines', description: 'Pipeline execution history', path: '/project/{account}/pipeline?mine=true', method: 'GET' },
      { type: 'change_management', title: 'CircleCI Workflows', description: 'Workflow run status and history', path: '/pipeline/{account}/workflow', method: 'GET' },
      { type: 'configuration', title: 'CircleCI Contexts', description: 'Environment variable context configurations', path: '/context?owner-slug={account}', method: 'GET' },
    ],
  },
  {
    id: 'travis-ci', name: 'Travis CI', category: 'CI/CD',
    apiBaseUrl: 'https://api.travis-ci.com', apiDocsUrl: 'https://developer.travis-ci.com/',
    authMethods: ['api-key', 'pat'], authHeader: 'Authorization', authPrefix: 'token',
    testEndpoint: '/user',
    evidenceEndpoints: [
      { type: 'configuration', title: 'Travis CI User', description: 'Authenticated user profile', path: '/user', method: 'GET' },
      { type: 'asset_inventory', title: 'Travis CI Repos', description: 'Tracked repository inventory', path: '/repos?active=true', method: 'GET' },
      { type: 'change_management', title: 'Travis CI Builds', description: 'Build execution history', path: '/builds?limit=100', method: 'GET' },
      { type: 'configuration', title: 'Travis CI Settings', description: 'Repository build settings', path: '/repo/{account}/setting', method: 'GET' },
    ],
  },
  {
    id: 'gitlab-ci', name: 'GitLab CI', category: 'CI/CD',
    apiBaseUrl: 'https://gitlab.com/api/v4', apiDocsUrl: 'https://docs.gitlab.com/ee/api/pipelines.html',
    authMethods: ['pat', 'oauth'], testEndpoint: '/user',
    evidenceEndpoints: [
      { type: 'change_management', title: 'GitLab CI Pipelines', description: 'Pipeline execution history', path: '/projects/{account}/pipelines?per_page=100', method: 'GET' },
      { type: 'configuration', title: 'GitLab CI Variables', description: 'CI/CD variable configurations (names only)', path: '/projects/{account}/variables', method: 'GET' },
      { type: 'asset_inventory', title: 'GitLab CI Runners', description: 'Runner inventory for build infrastructure', path: '/runners?type=project_type', method: 'GET' },
      { type: 'change_management', title: 'GitLab CI Jobs', description: 'Job execution history and status', path: '/projects/{account}/jobs?per_page=100', method: 'GET' },
      { type: 'configuration', title: 'GitLab CI Environments', description: 'Deployment environment configurations', path: '/projects/{account}/environments', method: 'GET' },
    ],
  },
  {
    id: 'azure-pipelines', name: 'Azure Pipelines', category: 'CI/CD',
    apiBaseUrl: 'https://dev.azure.com/{org}', apiDocsUrl: 'https://learn.microsoft.com/en-us/rest/api/azure/devops/pipelines/',
    authMethods: ['pat', 'oauth'], authPrefix: 'Basic',
    testEndpoint: '/{account}/_apis/pipelines?api-version=7.0',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'Azure Pipelines List', description: 'Pipeline definitions inventory', path: '/{account}/_apis/pipelines?api-version=7.0', method: 'GET' },
      { type: 'change_management', title: 'Azure Pipeline Runs', description: 'Pipeline run history', path: '/{account}/_apis/pipelines/{pipeline}/runs?api-version=7.0', method: 'GET' },
      { type: 'configuration', title: 'Azure Pipeline Environments', description: 'Deployment environment configurations', path: '/{account}/_apis/distributedtask/environments?api-version=7.0-preview.1', method: 'GET' },
      { type: 'access_control', title: 'Azure Service Connections', description: 'Service connection configurations', path: '/{account}/_apis/serviceendpoint/endpoints?api-version=7.0', method: 'GET' },
      { type: 'configuration', title: 'Azure Agent Pools', description: 'Agent pool configurations', path: '/_apis/distributedtask/pools?api-version=7.0', method: 'GET' },
    ],
  },
  {
    id: 'aws-codepipeline', name: 'AWS CodePipeline', category: 'CI/CD',
    apiBaseUrl: 'https://codepipeline.{region}.amazonaws.com', apiDocsUrl: 'https://docs.aws.amazon.com/codepipeline/latest/APIReference/',
    authMethods: ['iam'], testEndpoint: '/',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'CodePipeline List', description: 'Pipeline inventory', path: '/', method: 'POST', params: { Action: 'ListPipelines' } },
      { type: 'change_management', title: 'CodePipeline Executions', description: 'Pipeline execution history', path: '/', method: 'POST', params: { Action: 'ListPipelineExecutions' } },
      { type: 'configuration', title: 'CodePipeline Details', description: 'Pipeline stage and action configurations', path: '/', method: 'POST', params: { Action: 'GetPipeline' } },
      { type: 'change_management', title: 'CodePipeline Action Executions', description: 'Action-level execution details', path: '/', method: 'POST', params: { Action: 'ListActionExecutions' } },
    ],
  },
  {
    id: 'google-cloud-build', name: 'Google Cloud Build', category: 'CI/CD',
    apiBaseUrl: 'https://cloudbuild.googleapis.com/v1', apiDocsUrl: 'https://cloud.google.com/build/docs/api/reference/rest',
    authMethods: ['service-account', 'oauth'], testEndpoint: '/projects/{account}/builds?pageSize=1',
    evidenceEndpoints: [
      { type: 'change_management', title: 'Cloud Build History', description: 'Build execution history', path: '/projects/{account}/builds?pageSize=100', method: 'GET' },
      { type: 'asset_inventory', title: 'Cloud Build Triggers', description: 'Build trigger configurations', path: '/projects/{account}/triggers', method: 'GET' },
      { type: 'configuration', title: 'Cloud Build Worker Pools', description: 'Private worker pool configurations', path: '/projects/{account}/locations/{region}/workerPools', method: 'GET' },
    ],
  },
  {
    id: 'teamcity', name: 'TeamCity', category: 'CI/CD',
    apiBaseUrl: 'https://{instance}/app/rest', apiDocsUrl: 'https://www.jetbrains.com/help/teamcity/rest-api.html',
    authMethods: ['api-key', 'username-password'], testEndpoint: '/server',
    evidenceEndpoints: [
      { type: 'configuration', title: 'TeamCity Server Info', description: 'Server version and configuration', path: '/server', method: 'GET' },
      { type: 'asset_inventory', title: 'TeamCity Projects', description: 'Build project inventory', path: '/projects', method: 'GET' },
      { type: 'change_management', title: 'TeamCity Builds', description: 'Build execution history', path: '/builds?locator=count:100', method: 'GET' },
      { type: 'asset_inventory', title: 'TeamCity Build Configs', description: 'Build configuration inventory', path: '/buildTypes', method: 'GET' },
      { type: 'asset_inventory', title: 'TeamCity Agents', description: 'Build agent inventory', path: '/agents', method: 'GET' },
      { type: 'access_control', title: 'TeamCity Users', description: 'User accounts and roles', path: '/users', method: 'GET' },
      { type: 'audit_log', title: 'TeamCity Audit', description: 'Audit log events', path: '/audit', method: 'GET' },
    ],
  },
  {
    id: 'bamboo', name: 'Bamboo', category: 'CI/CD',
    apiBaseUrl: 'https://{instance}/rest/api/latest', apiDocsUrl: 'https://developer.atlassian.com/server/bamboo/rest/',
    authMethods: ['username-password', 'pat'], testEndpoint: '/info',
    evidenceEndpoints: [
      { type: 'configuration', title: 'Bamboo Server Info', description: 'Bamboo server version and state', path: '/info', method: 'GET' },
      { type: 'asset_inventory', title: 'Bamboo Plans', description: 'Build plan inventory', path: '/plan?max-results=100', method: 'GET' },
      { type: 'change_management', title: 'Bamboo Results', description: 'Build result history', path: '/result?max-results=100', method: 'GET' },
      { type: 'asset_inventory', title: 'Bamboo Agents', description: 'Build agent inventory', path: '/agent', method: 'GET' },
      { type: 'configuration', title: 'Bamboo Deployments', description: 'Deployment project configurations', path: '/deploy/project/all', method: 'GET' },
    ],
  },
  {
    id: 'harness', name: 'Harness', category: 'CI/CD',
    apiBaseUrl: 'https://app.harness.io/gateway/ng/api', apiDocsUrl: 'https://apidocs.harness.io/',
    authMethods: ['api-key', 'pat'], authHeader: 'x-api-key', authPrefix: '',
    testEndpoint: '/user/currentUser',
    evidenceEndpoints: [
      { type: 'configuration', title: 'Harness User', description: 'Current authenticated user details', path: '/user/currentUser', method: 'GET' },
      { type: 'asset_inventory', title: 'Harness Projects', description: 'Project inventory in account', path: '/projects?accountIdentifier={account}', method: 'GET' },
      { type: 'change_management', title: 'Harness Pipelines', description: 'Pipeline definitions and execution history', path: '/pipelines?accountIdentifier={account}', method: 'GET' },
      { type: 'change_management', title: 'Harness Executions', description: 'Pipeline execution history', path: '/pipeline/api/pipelines/execution/summary?accountIdentifier={account}', method: 'POST', params: { filterType: 'PipelineExecution' } },
      { type: 'configuration', title: 'Harness Connectors', description: 'Connector configurations (SCM, cloud, etc.)', path: '/connectors?accountIdentifier={account}', method: 'GET' },
    ],
  },

  // ── GitOps / Continuous Delivery ───────────────────────────────────────
  {
    id: 'argo-cd', name: 'Argo CD', category: 'CI/CD',
    apiBaseUrl: 'https://{instance}/api/v1', apiDocsUrl: 'https://argo-cd.readthedocs.io/en/stable/developer-guide/api-docs/',
    authMethods: ['api-key', 'username-password'], testEndpoint: '/session/userinfo',
    evidenceEndpoints: [
      { type: 'configuration', title: 'Argo CD User Info', description: 'Authenticated user session info', path: '/session/userinfo', method: 'GET' },
      { type: 'asset_inventory', title: 'Argo CD Applications', description: 'GitOps application inventory', path: '/applications', method: 'GET' },
      { type: 'change_management', title: 'Argo CD Sync History', description: 'Application sync and deployment history', path: '/applications/{account}/events', method: 'GET' },
      { type: 'configuration', title: 'Argo CD Repositories', description: 'Configured Git repository sources', path: '/repositories', method: 'GET' },
      { type: 'asset_inventory', title: 'Argo CD Clusters', description: 'Managed Kubernetes cluster inventory', path: '/clusters', method: 'GET' },
      { type: 'configuration', title: 'Argo CD Projects', description: 'AppProject configurations and RBAC', path: '/projects', method: 'GET' },
    ],
  },
  {
    id: 'fluxcd', name: 'Flux CD', category: 'CI/CD',
    apiBaseUrl: 'https://{instance}/api/v1', apiDocsUrl: 'https://fluxcd.io/flux/components/',
    authMethods: ['api-key', 'pat'], testEndpoint: '/health',
    evidenceEndpoints: [
      { type: 'configuration', title: 'Flux Health', description: 'Flux controller health status', path: '/health', method: 'GET' },
      { type: 'asset_inventory', title: 'Flux Kustomizations', description: 'Kustomization resource inventory', path: '/kustomizations', method: 'GET' },
      { type: 'asset_inventory', title: 'Flux Helm Releases', description: 'HelmRelease resource inventory', path: '/helmreleases', method: 'GET' },
      { type: 'change_management', title: 'Flux Events', description: 'Reconciliation events and deployments', path: '/events', method: 'GET' },
      { type: 'configuration', title: 'Flux Git Repositories', description: 'GitRepository source configurations', path: '/gitrepositories', method: 'GET' },
    ],
  },
  {
    id: 'tekton', name: 'Tekton', category: 'CI/CD',
    apiBaseUrl: 'https://{instance}/apis/tekton.dev/v1', apiDocsUrl: 'https://tekton.dev/docs/',
    authMethods: ['api-key', 'pat'], testEndpoint: '/namespaces/{account}/pipelines',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'Tekton Pipelines', description: 'Pipeline resource inventory', path: '/namespaces/{account}/pipelines', method: 'GET' },
      { type: 'change_management', title: 'Tekton Pipeline Runs', description: 'Pipeline run execution history', path: '/namespaces/{account}/pipelineruns', method: 'GET' },
      { type: 'asset_inventory', title: 'Tekton Tasks', description: 'Task definitions inventory', path: '/namespaces/{account}/tasks', method: 'GET' },
      { type: 'change_management', title: 'Tekton Task Runs', description: 'Task run execution history', path: '/namespaces/{account}/taskruns', method: 'GET' },
    ],
  },
  {
    id: 'drone-ci', name: 'Drone CI', category: 'CI/CD',
    apiBaseUrl: 'https://{instance}/api', apiDocsUrl: 'https://docs.drone.io/api/overview/',
    authMethods: ['api-key', 'pat'], testEndpoint: '/user',
    evidenceEndpoints: [
      { type: 'configuration', title: 'Drone CI User', description: 'Authenticated user profile', path: '/user', method: 'GET' },
      { type: 'asset_inventory', title: 'Drone CI Repos', description: 'Activated repository inventory', path: '/user/repos', method: 'GET' },
      { type: 'change_management', title: 'Drone CI Builds', description: 'Build execution history', path: '/repos/{account}/{repo}/builds', method: 'GET' },
      { type: 'configuration', title: 'Drone CI Secrets', description: 'Repository secret names (not values)', path: '/repos/{account}/{repo}/secrets', method: 'GET' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTAINER PROVIDERS (15)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'docker-hub', name: 'Docker Hub', category: 'Container',
    apiBaseUrl: 'https://hub.docker.com/v2', apiDocsUrl: 'https://docs.docker.com/docker-hub/api/latest/',
    authMethods: ['username-password', 'pat'], testEndpoint: '/user',
    evidenceEndpoints: [
      { type: 'configuration', title: 'Docker Hub User', description: 'Authenticated user profile', path: '/user', method: 'GET' },
      { type: 'asset_inventory', title: 'Docker Hub Repositories', description: 'Container image repository inventory', path: '/repositories/{account}', method: 'GET' },
      { type: 'access_control', title: 'Docker Hub Org Members', description: 'Organization member access review', path: '/orgs/{account}/members', method: 'GET' },
      { type: 'access_control', title: 'Docker Hub Teams', description: 'Team and permission configurations', path: '/orgs/{account}/groups', method: 'GET' },
      { type: 'vulnerability_scan', title: 'Docker Scout CVEs', description: 'Container vulnerability analysis via Docker Scout', path: '/orgs/{account}/images/{repo}/vulnerabilities', method: 'GET' },
    ],
  },
  {
    id: 'kubernetes', name: 'Kubernetes', category: 'Container',
    apiBaseUrl: 'https://{instance}', apiDocsUrl: 'https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.28/',
    authMethods: ['api-key', 'service-account'], testEndpoint: '/api/v1/namespaces',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'K8s Namespaces', description: 'Namespace inventory', path: '/api/v1/namespaces', method: 'GET' },
      { type: 'asset_inventory', title: 'K8s Pods', description: 'Running pod inventory across namespaces', path: '/api/v1/pods', method: 'GET' },
      { type: 'asset_inventory', title: 'K8s Deployments', description: 'Deployment resource inventory', path: '/apis/apps/v1/deployments', method: 'GET' },
      { type: 'configuration', title: 'K8s Network Policies', description: 'Network policy configurations', path: '/apis/networking.k8s.io/v1/networkpolicies', method: 'GET' },
      { type: 'access_control', title: 'K8s ClusterRoleBindings', description: 'Cluster-level RBAC bindings', path: '/apis/rbac.authorization.k8s.io/v1/clusterrolebindings', method: 'GET' },
      { type: 'access_control', title: 'K8s ServiceAccounts', description: 'Service account inventory', path: '/api/v1/serviceaccounts', method: 'GET' },
      { type: 'configuration', title: 'K8s Pod Security Policies', description: 'Pod security standards and policies', path: '/apis/policy/v1/poddisruptionbudgets', method: 'GET' },
    ],
  },
  {
    id: 'amazon-eks', name: 'Amazon EKS', category: 'Container',
    apiBaseUrl: 'https://eks.{region}.amazonaws.com', apiDocsUrl: 'https://docs.aws.amazon.com/eks/latest/APIReference/',
    authMethods: ['iam'], testEndpoint: '/clusters',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'EKS Clusters', description: 'EKS cluster inventory', path: '/clusters', method: 'GET' },
      { type: 'configuration', title: 'EKS Cluster Details', description: 'Cluster configuration and networking', path: '/clusters/{account}', method: 'GET' },
      { type: 'asset_inventory', title: 'EKS Node Groups', description: 'Managed node group inventory', path: '/clusters/{account}/node-groups', method: 'GET' },
      { type: 'configuration', title: 'EKS Add-ons', description: 'EKS add-on configurations', path: '/clusters/{account}/addons', method: 'GET' },
      { type: 'access_control', title: 'EKS Access Entries', description: 'Cluster access entry configurations', path: '/clusters/{account}/access-entries', method: 'GET' },
    ],
  },
  {
    id: 'azure-aks', name: 'Azure AKS', category: 'Container',
    apiBaseUrl: 'https://management.azure.com', apiDocsUrl: 'https://learn.microsoft.com/en-us/rest/api/aks/',
    authMethods: ['oauth', 'service-account'], authPrefix: 'Bearer',
    testEndpoint: '/subscriptions/{account}/providers/Microsoft.ContainerService/managedClusters?api-version=2024-01-01',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'AKS Clusters', description: 'AKS managed cluster inventory', path: '/subscriptions/{account}/providers/Microsoft.ContainerService/managedClusters?api-version=2024-01-01', method: 'GET' },
      { type: 'configuration', title: 'AKS Cluster Config', description: 'Cluster network and security configuration', path: '/subscriptions/{account}/resourceGroups/{rg}/providers/Microsoft.ContainerService/managedClusters/{cluster}?api-version=2024-01-01', method: 'GET' },
      { type: 'access_control', title: 'AKS RBAC', description: 'Azure RBAC role assignments for AKS', path: '/subscriptions/{account}/resourceGroups/{rg}/providers/Microsoft.ContainerService/managedClusters/{cluster}/providers/Microsoft.Authorization/roleAssignments?api-version=2022-04-01', method: 'GET' },
    ],
  },
  {
    id: 'google-gke', name: 'Google GKE', category: 'Container',
    apiBaseUrl: 'https://container.googleapis.com/v1', apiDocsUrl: 'https://cloud.google.com/kubernetes-engine/docs/reference/rest',
    authMethods: ['service-account', 'oauth'], testEndpoint: '/projects/{account}/locations/-/clusters',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'GKE Clusters', description: 'GKE cluster inventory', path: '/projects/{account}/locations/-/clusters', method: 'GET' },
      { type: 'configuration', title: 'GKE Cluster Details', description: 'Cluster security and network configuration', path: '/projects/{account}/locations/{region}/clusters/{cluster}', method: 'GET' },
      { type: 'asset_inventory', title: 'GKE Node Pools', description: 'Node pool inventory and configuration', path: '/projects/{account}/locations/{region}/clusters/{cluster}/nodePools', method: 'GET' },
      { type: 'vulnerability_scan', title: 'GKE Security Posture', description: 'GKE security posture findings', path: 'https://containersecurity.googleapis.com/v1/projects/{account}/locations/-/findings', method: 'GET' },
    ],
  },
  {
    id: 'openshift', name: 'Red Hat OpenShift', category: 'Container',
    apiBaseUrl: 'https://{instance}', apiDocsUrl: 'https://docs.openshift.com/container-platform/latest/rest_api/',
    authMethods: ['api-key', 'oauth'], testEndpoint: '/apis',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'OpenShift Projects', description: 'Project/namespace inventory', path: '/apis/project.openshift.io/v1/projects', method: 'GET' },
      { type: 'asset_inventory', title: 'OpenShift DeploymentConfigs', description: 'DeploymentConfig inventory', path: '/apis/apps.openshift.io/v1/deploymentconfigs', method: 'GET' },
      { type: 'configuration', title: 'OpenShift Routes', description: 'Ingress route configurations', path: '/apis/route.openshift.io/v1/routes', method: 'GET' },
      { type: 'access_control', title: 'OpenShift ClusterRoles', description: 'Cluster role definitions', path: '/apis/rbac.authorization.k8s.io/v1/clusterroles', method: 'GET' },
      { type: 'configuration', title: 'OpenShift SCCs', description: 'Security Context Constraints', path: '/apis/security.openshift.io/v1/securitycontextconstraints', method: 'GET' },
    ],
  },
  {
    id: 'rancher', name: 'Rancher', category: 'Container',
    apiBaseUrl: 'https://{instance}/v3', apiDocsUrl: 'https://ranchermanager.docs.rancher.com/reference-guides/about-the-api/',
    authMethods: ['api-key', 'username-password'], testEndpoint: '/clusters',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'Rancher Clusters', description: 'Managed Kubernetes cluster inventory', path: '/clusters', method: 'GET' },
      { type: 'asset_inventory', title: 'Rancher Projects', description: 'Project inventory across clusters', path: '/projects', method: 'GET' },
      { type: 'access_control', title: 'Rancher Users', description: 'User accounts and global permissions', path: '/users', method: 'GET' },
      { type: 'access_control', title: 'Rancher Global Roles', description: 'Global role definitions', path: '/globalRoles', method: 'GET' },
      { type: 'configuration', title: 'Rancher Settings', description: 'Server settings and configurations', path: '/settings', method: 'GET' },
    ],
  },
  {
    id: 'helm', name: 'Helm', category: 'Container',
    apiBaseUrl: 'https://{instance}/api', apiDocsUrl: 'https://helm.sh/docs/',
    authMethods: ['api-key', 'username-password'], testEndpoint: '/charts',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'Helm Charts', description: 'Chart repository inventory', path: '/charts', method: 'GET' },
      { type: 'configuration', title: 'Helm Chart Details', description: 'Chart version and metadata', path: '/charts/{account}', method: 'GET' },
      { type: 'change_management', title: 'Helm Chart Versions', description: 'Chart version history for change tracking', path: '/charts/{account}/versions', method: 'GET' },
    ],
  },

  // ── Service Mesh ───────────────────────────────────────────────────────
  {
    id: 'istio', name: 'Istio', category: 'Container',
    apiBaseUrl: 'https://{instance}', apiDocsUrl: 'https://istio.io/latest/docs/reference/config/',
    authMethods: ['api-key', 'service-account'], testEndpoint: '/apis/networking.istio.io/v1/virtualservices',
    evidenceEndpoints: [
      { type: 'configuration', title: 'Istio Virtual Services', description: 'Traffic routing virtual service configs', path: '/apis/networking.istio.io/v1/virtualservices', method: 'GET' },
      { type: 'configuration', title: 'Istio Destination Rules', description: 'Destination rule configurations', path: '/apis/networking.istio.io/v1/destinationrules', method: 'GET' },
      { type: 'configuration', title: 'Istio Authorization Policies', description: 'Service-to-service authorization policies', path: '/apis/security.istio.io/v1/authorizationpolicies', method: 'GET' },
      { type: 'configuration', title: 'Istio Peer Authentication', description: 'mTLS peer authentication policies', path: '/apis/security.istio.io/v1/peerauthentications', method: 'GET' },
      { type: 'configuration', title: 'Istio Gateways', description: 'Ingress/egress gateway configurations', path: '/apis/networking.istio.io/v1/gateways', method: 'GET' },
    ],
  },
  {
    id: 'linkerd', name: 'Linkerd', category: 'Container',
    apiBaseUrl: 'https://{instance}', apiDocsUrl: 'https://linkerd.io/2/reference/',
    authMethods: ['api-key', 'service-account'], testEndpoint: '/apis/policy.linkerd.io/v1beta3/servers',
    evidenceEndpoints: [
      { type: 'configuration', title: 'Linkerd Servers', description: 'Server resource configurations', path: '/apis/policy.linkerd.io/v1beta3/servers', method: 'GET' },
      { type: 'configuration', title: 'Linkerd Server Authorizations', description: 'Server authorization policies', path: '/apis/policy.linkerd.io/v1beta1/serverauthorizations', method: 'GET' },
      { type: 'configuration', title: 'Linkerd Service Profiles', description: 'Service profile configurations with retries and timeouts', path: '/apis/linkerd.io/v1alpha2/serviceprofiles', method: 'GET' },
      { type: 'configuration', title: 'Linkerd Auth Policies', description: 'Authorization policy configurations', path: '/apis/policy.linkerd.io/v1alpha1/authorizationpolicies', method: 'GET' },
    ],
  },

  // ── Container Security ─────────────────────────────────────────────────
  {
    id: 'aqua-security', name: 'Aqua Security', category: 'Container',
    apiBaseUrl: 'https://{instance}/api/v2', apiDocsUrl: 'https://docs.aquasec.com/reference',
    authMethods: ['username-password', 'api-key'], testEndpoint: '/dashboard',
    evidenceEndpoints: [
      { type: 'configuration', title: 'Aqua Dashboard', description: 'Security dashboard overview', path: '/dashboard', method: 'GET' },
      { type: 'vulnerability_scan', title: 'Aqua Image Vulnerabilities', description: 'Container image vulnerability scan results', path: '/risks/vulnerabilities?pagesize=100', method: 'GET' },
      { type: 'compliance_status', title: 'Aqua Compliance Results', description: 'CIS benchmark compliance results', path: '/risks/bench', method: 'GET' },
      { type: 'asset_inventory', title: 'Aqua Images', description: 'Scanned container image inventory', path: '/images?pagesize=100', method: 'GET' },
      { type: 'configuration', title: 'Aqua Runtime Policies', description: 'Runtime protection policy configurations', path: '/securitypolicies', method: 'GET' },
      { type: 'configuration', title: 'Aqua Assurance Policies', description: 'Image assurance policy configurations', path: '/assurance_policy/image', method: 'GET' },
    ],
  },
  {
    id: 'twistlock-prisma', name: 'Prisma Cloud (Twistlock)', category: 'Container',
    apiBaseUrl: 'https://{instance}/api/v1', apiDocsUrl: 'https://pan.dev/prisma-cloud/api/cwpp/',
    authMethods: ['username-password', 'api-key'], testEndpoint: '/settings/system',
    evidenceEndpoints: [
      { type: 'configuration', title: 'Prisma System Settings', description: 'System configuration and license details', path: '/settings/system', method: 'GET' },
      { type: 'vulnerability_scan', title: 'Prisma Image Vulnerabilities', description: 'Container image vulnerability findings', path: '/images?limit=100&reverse=true', method: 'GET' },
      { type: 'compliance_status', title: 'Prisma Compliance', description: 'Container compliance check results', path: '/audits/compliance/containers', method: 'GET' },
      { type: 'asset_inventory', title: 'Prisma Containers', description: 'Running container inventory', path: '/containers?limit=100', method: 'GET' },
      { type: 'configuration', title: 'Prisma Runtime Policies', description: 'Container runtime defense policies', path: '/policies/runtime/container', method: 'GET' },
      { type: 'vulnerability_scan', title: 'Prisma Host Vulnerabilities', description: 'Host vulnerability scan findings', path: '/hosts?limit=100', method: 'GET' },
    ],
  },
  {
    id: 'sysdig', name: 'Sysdig', category: 'Container',
    apiBaseUrl: 'https://{region}.app.sysdig.com/api', apiDocsUrl: 'https://docs.sysdig.com/en/docs/developer-tools/sysdig-api/',
    authMethods: ['api-key'], authHeader: 'Authorization', authPrefix: 'Bearer',
    testEndpoint: '/v1/users/me',
    evidenceEndpoints: [
      { type: 'configuration', title: 'Sysdig User', description: 'Authenticated user details', path: '/v1/users/me', method: 'GET' },
      { type: 'vulnerability_scan', title: 'Sysdig Scanning Results', description: 'Container image scan results', path: '/scanning/v1/resultsDirect?limit=100', method: 'GET' },
      { type: 'compliance_status', title: 'Sysdig Compliance Results', description: 'Compliance benchmark results', path: '/cspm/v1/compliance/results', method: 'GET' },
      { type: 'configuration', title: 'Sysdig Policies', description: 'Runtime and scanning policy configurations', path: '/v1/secure/policies', method: 'GET' },
      { type: 'asset_inventory', title: 'Sysdig Runtime Images', description: 'Runtime container image inventory', path: '/scanning/v1/images?limit=100', method: 'GET' },
    ],
  },
  {
    id: 'anchore', name: 'Anchore', category: 'Container',
    apiBaseUrl: 'https://{instance}/v2', apiDocsUrl: 'https://docs.anchore.com/current/docs/api/',
    authMethods: ['username-password', 'api-key'], testEndpoint: '/system/status',
    evidenceEndpoints: [
      { type: 'configuration', title: 'Anchore System Status', description: 'Engine system service status', path: '/system/status', method: 'GET' },
      { type: 'vulnerability_scan', title: 'Anchore Image Vulnerabilities', description: 'Container image vulnerability results', path: '/images/{account}/vulnerabilities/all', method: 'GET' },
      { type: 'compliance_status', title: 'Anchore Policy Evaluation', description: 'Image policy evaluation results', path: '/images/{account}/check', method: 'GET' },
      { type: 'asset_inventory', title: 'Anchore Images', description: 'Analyzed image inventory', path: '/images?limit=100', method: 'GET' },
      { type: 'configuration', title: 'Anchore Policies', description: 'Policy bundle configurations', path: '/policies', method: 'GET' },
    ],
  },
  {
    id: 'trivy', name: 'Trivy', category: 'Container',
    apiBaseUrl: 'https://{instance}/api/v1', apiDocsUrl: 'https://aquasecurity.github.io/trivy/',
    authMethods: ['api-key'], testEndpoint: '/health',
    evidenceEndpoints: [
      { type: 'configuration', title: 'Trivy Health', description: 'Trivy server health status', path: '/health', method: 'GET' },
      { type: 'vulnerability_scan', title: 'Trivy Image Scan', description: 'Container image vulnerability scan results', path: '/scan', method: 'POST', params: { target: '{account}', scanners: ['vuln'] } },
      { type: 'vulnerability_scan', title: 'Trivy Config Scan', description: 'Misconfiguration scan results', path: '/scan', method: 'POST', params: { target: '{account}', scanners: ['misconfig'] } },
      { type: 'vulnerability_scan', title: 'Trivy Secret Scan', description: 'Secret detection scan results', path: '/scan', method: 'POST', params: { target: '{account}', scanners: ['secret'] } },
    ],
  },
];

export default createProviders(descriptors);
