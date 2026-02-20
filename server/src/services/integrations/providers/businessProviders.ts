/**
 * Business Provider Integrations (185 providers)
 * Real API implementations for all business tooling providers across 13 categories:
 *   HR (25), Ticketing (20), Productivity (25), CRM (10), Communication (10),
 *   Database (15), Network (20), Backup (10), GRC (10), Training (10),
 *   Finance (10), BI (10), Automation (10)
 */
import { createProviders, ProviderDescriptor } from './providerFactory';

const descriptors: ProviderDescriptor[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // HR & PEOPLE (25)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'bamboohr', name: 'BambooHR', category: 'HR',
    apiBaseUrl: 'https://api.bamboohr.com/api/gateway.php/{company}/v1', apiDocsUrl: 'https://documentation.bamboohr.com/reference',
    authMethods: ['api-key'], authHeader: 'Authorization', authPrefix: 'Basic',
    testEndpoint: '/employees/directory',
    evidenceEndpoints: [
      { type: 'user_list', title: 'BambooHR Employees', description: 'Employee directory for access review', path: '/employees/directory', method: 'GET' },
      { type: 'access_control', title: 'BambooHR Users', description: 'System user accounts and permissions', path: '/meta/users/', method: 'GET' },
      { type: 'audit_log', title: 'BambooHR Time Off', description: 'Time off requests and approvals audit', path: '/time_off/requests/?start=2024-01-01&end=2025-01-01', method: 'GET' },
      { type: 'configuration', title: 'BambooHR Fields', description: 'Custom field configurations', path: '/meta/fields/', method: 'GET' },
    ],
  },
  {
    id: 'workday', name: 'Workday', category: 'HR',
    apiBaseUrl: 'https://{instance}.workday.com/api/v1/{tenant}', apiDocsUrl: 'https://community.workday.com/sites/default/files/file-hosting/restapi/',
    authMethods: ['oauth'], authPrefix: 'Bearer',
    testEndpoint: '/workers?limit=1',
    evidenceEndpoints: [
      { type: 'user_list', title: 'Workday Workers', description: 'Worker directory for compliance review', path: '/workers?limit=100', method: 'GET' },
      { type: 'access_control', title: 'Workday Security Groups', description: 'Security group assignments', path: '/securityGroups', method: 'GET' },
      { type: 'audit_log', title: 'Workday Business Process History', description: 'Business process transaction audit trail', path: '/auditLogs?limit=100', method: 'GET' },
      { type: 'configuration', title: 'Workday Org Structure', description: 'Organizational hierarchy configuration', path: '/organizations', method: 'GET' },
    ],
  },
  {
    id: 'adp', name: 'ADP', category: 'HR',
    apiBaseUrl: 'https://api.adp.com', apiDocsUrl: 'https://developers.adp.com/articles/api/',
    authMethods: ['oauth'], authPrefix: 'Bearer',
    testEndpoint: '/hr/v2/workers?$top=1',
    evidenceEndpoints: [
      { type: 'user_list', title: 'ADP Workers', description: 'Employee listing for access review', path: '/hr/v2/workers?$top=100', method: 'GET' },
      { type: 'configuration', title: 'ADP Organization', description: 'Organization departments and structure', path: '/core/v1/organization-departments', method: 'GET' },
      { type: 'audit_log', title: 'ADP Payroll History', description: 'Payroll processing audit trail', path: '/payroll/v1/payroll-output?$top=100', method: 'GET' },
    ],
  },
  {
    id: 'gusto', name: 'Gusto', category: 'HR',
    apiBaseUrl: 'https://api.gusto.com/v1', apiDocsUrl: 'https://docs.gusto.com/app-integrations/reference/',
    authMethods: ['oauth'], authPrefix: 'Bearer',
    testEndpoint: '/me',
    evidenceEndpoints: [
      { type: 'user_list', title: 'Gusto Employees', description: 'Employee directory listing', path: '/companies/{company}/employees', method: 'GET' },
      { type: 'configuration', title: 'Gusto Company', description: 'Company configuration and details', path: '/companies/{company}', method: 'GET' },
      { type: 'financial_control', title: 'Gusto Payrolls', description: 'Payroll processing records', path: '/companies/{company}/payrolls', method: 'GET' },
    ],
  },
  {
    id: 'paylocity', name: 'Paylocity', category: 'HR',
    apiBaseUrl: 'https://api.paylocity.com/api/v2', apiDocsUrl: 'https://docs.paylocity.com/',
    authMethods: ['oauth'], authPrefix: 'Bearer',
    testEndpoint: '/companies/{company}/employees?pagesize=1',
    evidenceEndpoints: [
      { type: 'user_list', title: 'Paylocity Employees', description: 'Employee listing for HR audit', path: '/companies/{company}/employees?pagesize=100', method: 'GET' },
      { type: 'configuration', title: 'Paylocity Company Codes', description: 'Company code configurations', path: '/companies/{company}/codes', method: 'GET' },
      { type: 'financial_control', title: 'Paylocity Payroll', description: 'Payroll summary records', path: '/companies/{company}/payroll', method: 'GET' },
    ],
  },
  {
    id: 'paychex', name: 'Paychex', category: 'HR',
    apiBaseUrl: 'https://api.paychex.com', apiDocsUrl: 'https://developer.paychex.com/api-reference-guide/',
    authMethods: ['oauth'], authPrefix: 'Bearer',
    testEndpoint: '/companies?limit=1',
    evidenceEndpoints: [
      { type: 'user_list', title: 'Paychex Workers', description: 'Worker directory for compliance', path: '/companies/{company}/workers', method: 'GET' },
      { type: 'configuration', title: 'Paychex Company', description: 'Company information and structure', path: '/companies/{company}', method: 'GET' },
      { type: 'financial_control', title: 'Paychex Checks', description: 'Payroll check records', path: '/companies/{company}/checks', method: 'GET' },
    ],
  },
  {
    id: 'rippling', name: 'Rippling', category: 'HR',
    apiBaseUrl: 'https://api.rippling.com/platform/api', apiDocsUrl: 'https://developer.rippling.com/',
    authMethods: ['oauth', 'api-key'], authPrefix: 'Bearer',
    testEndpoint: '/company',
    evidenceEndpoints: [
      { type: 'user_list', title: 'Rippling Employees', description: 'Employee directory listing', path: '/employees', method: 'GET' },
      { type: 'access_control', title: 'Rippling Groups', description: 'Employee group and team assignments', path: '/groups', method: 'GET' },
      { type: 'device_inventory', title: 'Rippling Devices', description: 'Company-managed device inventory', path: '/devices', method: 'GET' },
      { type: 'configuration', title: 'Rippling Departments', description: 'Department structure configuration', path: '/departments', method: 'GET' },
    ],
  },
  {
    id: 'deel', name: 'Deel', category: 'HR',
    apiBaseUrl: 'https://api.letsdeel.com/rest/v2', apiDocsUrl: 'https://developer.deel.com/reference/',
    authMethods: ['api-key', 'oauth'], authPrefix: 'Bearer',
    testEndpoint: '/contracts?limit=1',
    evidenceEndpoints: [
      { type: 'user_list', title: 'Deel Contracts', description: 'Active contractor and employee contracts', path: '/contracts?limit=100', method: 'GET' },
      { type: 'financial_control', title: 'Deel Invoices', description: 'Invoice records for financial audit', path: '/invoices?limit=100', method: 'GET' },
      { type: 'configuration', title: 'Deel Organization', description: 'Organization settings and details', path: '/organizations', method: 'GET' },
    ],
  },
  {
    id: 'remote', name: 'Remote', category: 'HR',
    apiBaseUrl: 'https://gateway.remote.com/v1', apiDocsUrl: 'https://remote.com/resources/api/',
    authMethods: ['api-key', 'oauth'], authPrefix: 'Bearer',
    testEndpoint: '/companies',
    evidenceEndpoints: [
      { type: 'user_list', title: 'Remote Employments', description: 'Active employment records', path: '/employments?page_size=100', method: 'GET' },
      { type: 'configuration', title: 'Remote Company', description: 'Company details and configuration', path: '/companies', method: 'GET' },
      { type: 'financial_control', title: 'Remote Incentives', description: 'Employee incentive and benefit records', path: '/incentives?page_size=100', method: 'GET' },
    ],
  },
  {
    id: 'justworks', name: 'Justworks', category: 'HR',
    apiBaseUrl: 'https://api.justworks.com/v1', apiDocsUrl: 'https://developer.justworks.com/',
    authMethods: ['oauth'], authPrefix: 'Bearer',
    testEndpoint: '/company',
    evidenceEndpoints: [
      { type: 'user_list', title: 'Justworks Members', description: 'Company member directory', path: '/members', method: 'GET' },
      { type: 'configuration', title: 'Justworks Company', description: 'Company configuration and details', path: '/company', method: 'GET' },
      { type: 'financial_control', title: 'Justworks Payrolls', description: 'Payroll processing records', path: '/payrolls', method: 'GET' },
    ],
  },
  {
    id: 'namely', name: 'Namely', category: 'HR',
    apiBaseUrl: 'https://{company}.namely.com/api/v1', apiDocsUrl: 'https://developers.namely.com/',
    authMethods: ['oauth', 'api-key'], authPrefix: 'Bearer',
    testEndpoint: '/profiles?limit=1',
    evidenceEndpoints: [
      { type: 'user_list', title: 'Namely Profiles', description: 'Employee profiles for directory review', path: '/profiles?limit=100', method: 'GET' },
      { type: 'access_control', title: 'Namely Groups', description: 'Group and team membership', path: '/groups', method: 'GET' },
      { type: 'audit_log', title: 'Namely Events', description: 'HR event and change log', path: '/events?limit=100', method: 'GET' },
    ],
  },
  {
    id: 'ukg', name: 'UKG (Ultimate Kronos)', category: 'HR',
    apiBaseUrl: 'https://{instance}.ultipro.com/api', apiDocsUrl: 'https://developer.ukg.com/',
    authMethods: ['oauth', 'api-key'], authPrefix: 'Bearer',
    testEndpoint: '/personnel/v1/employee-changes?page=1&per_page=1',
    evidenceEndpoints: [
      { type: 'user_list', title: 'UKG Employees', description: 'Employee listing for HR compliance', path: '/personnel/v1/employees?page=1&per_page=100', method: 'GET' },
      { type: 'audit_log', title: 'UKG Employee Changes', description: 'Employee record change audit trail', path: '/personnel/v1/employee-changes?per_page=100', method: 'GET' },
      { type: 'configuration', title: 'UKG Org Levels', description: 'Organizational level configurations', path: '/personnel/v1/org-levels', method: 'GET' },
      { type: 'financial_control', title: 'UKG Earnings', description: 'Earnings and compensation records', path: '/personnel/v1/employee-earnings-history?per_page=100', method: 'GET' },
    ],
  },
  {
    id: 'paycom', name: 'Paycom', category: 'HR',
    apiBaseUrl: 'https://api.paycom.com/v1', apiDocsUrl: 'https://www.paycom.com/resources/api/',
    authMethods: ['api-key', 'oauth'], authPrefix: 'Bearer',
    testEndpoint: '/employees?limit=1',
    evidenceEndpoints: [
      { type: 'user_list', title: 'Paycom Employees', description: 'Employee records for HR audit', path: '/employees?limit=100', method: 'GET' },
      { type: 'configuration', title: 'Paycom Departments', description: 'Department structure', path: '/departments', method: 'GET' },
      { type: 'financial_control', title: 'Paycom Payroll', description: 'Payroll processing records', path: '/payrolls?limit=100', method: 'GET' },
    ],
  },
  {
    id: 'ceridian-dayforce', name: 'Ceridian Dayforce', category: 'HR',
    apiBaseUrl: 'https://{instance}.dayforcehcm.com/Api/{tenant}/V1', apiDocsUrl: 'https://developers.dayforce.com/',
    authMethods: ['username-password', 'oauth'], testEndpoint: '/Employees?pageSize=1',
    evidenceEndpoints: [
      { type: 'user_list', title: 'Dayforce Employees', description: 'Employee records for HR audit', path: '/Employees?pageSize=100', method: 'GET' },
      { type: 'audit_log', title: 'Dayforce HR Actions', description: 'HR action change audit trail', path: '/EmployeeHRIncidents?pageSize=100', method: 'GET' },
      { type: 'configuration', title: 'Dayforce Org Units', description: 'Organizational unit structure', path: '/OrgUnits', method: 'GET' },
    ],
  },
  {
    id: 'sap-successfactors', name: 'SAP SuccessFactors', category: 'HR',
    apiBaseUrl: 'https://{instance}.successfactors.com/odata/v2', apiDocsUrl: 'https://help.sap.com/docs/SAP_SUCCESSFACTORS_PLATFORM/d599f15995d348a1b45ba5603e2aba9b/',
    authMethods: ['oauth', 'username-password'], authPrefix: 'Bearer',
    testEndpoint: '/User?$top=1&$format=json',
    evidenceEndpoints: [
      { type: 'user_list', title: 'SF Users', description: 'User records for directory audit', path: '/User?$top=100&$format=json', method: 'GET' },
      { type: 'access_control', title: 'SF Permission Groups', description: 'Permission group assignments', path: '/PermissionGroup?$top=100&$format=json', method: 'GET' },
      { type: 'audit_log', title: 'SF Audit Logs', description: 'System audit log entries', path: '/SFODataAuditLog?$top=100&$format=json', method: 'GET' },
      { type: 'configuration', title: 'SF Company Info', description: 'Company configuration settings', path: '/CompanyInfo?$format=json', method: 'GET' },
    ],
  },
  {
    id: 'oracle-hcm', name: 'Oracle HCM Cloud', category: 'HR',
    apiBaseUrl: 'https://{instance}.oraclecloud.com/hcmRestApi/resources/11.13.18.05', apiDocsUrl: 'https://docs.oracle.com/en/cloud/saas/human-resources/',
    authMethods: ['oauth', 'username-password'], authPrefix: 'Bearer',
    testEndpoint: '/workers?limit=1',
    evidenceEndpoints: [
      { type: 'user_list', title: 'Oracle HCM Workers', description: 'Worker records for HR audit', path: '/workers?limit=100', method: 'GET' },
      { type: 'access_control', title: 'Oracle HCM Roles', description: 'Role-based access control assignments', path: '/userAccounts?limit=100', method: 'GET' },
      { type: 'configuration', title: 'Oracle HCM Departments', description: 'Department hierarchy configuration', path: '/departments?limit=100', method: 'GET' },
    ],
  },
  {
    id: 'hibob', name: 'HiBob', category: 'HR',
    apiBaseUrl: 'https://api.hibob.com/v1', apiDocsUrl: 'https://apidocs.hibob.com/',
    authMethods: ['api-key', 'pat'], authHeader: 'Authorization', authPrefix: 'Bearer',
    testEndpoint: '/company/people?showInactive=false',
    evidenceEndpoints: [
      { type: 'user_list', title: 'HiBob People', description: 'Employee directory listing', path: '/company/people?showInactive=false', method: 'GET' },
      { type: 'audit_log', title: 'HiBob Lifecycle', description: 'Employee lifecycle events', path: '/people/employment-history', method: 'GET' },
      { type: 'configuration', title: 'HiBob Company', description: 'Company structure and metadata', path: '/company/named-lists', method: 'GET' },
    ],
  },
  {
    id: 'personio', name: 'Personio', category: 'HR',
    apiBaseUrl: 'https://api.personio.de/v1', apiDocsUrl: 'https://developer.personio.de/reference/',
    authMethods: ['api-key', 'oauth'], authPrefix: 'Bearer',
    testEndpoint: '/company/employees?limit=1',
    evidenceEndpoints: [
      { type: 'user_list', title: 'Personio Employees', description: 'Employee records for audit', path: '/company/employees?limit=200', method: 'GET' },
      { type: 'audit_log', title: 'Personio Absences', description: 'Employee absence records for compliance', path: '/company/time-offs?limit=200', method: 'GET' },
      { type: 'configuration', title: 'Personio Attributes', description: 'Employee attribute configurations', path: '/company/employees/attributes', method: 'GET' },
    ],
  },
  {
    id: 'factorial', name: 'Factorial', category: 'HR',
    apiBaseUrl: 'https://api.factorialhr.com/api/v1', apiDocsUrl: 'https://apidoc.factorialhr.com/',
    authMethods: ['oauth', 'api-key'], authPrefix: 'Bearer',
    testEndpoint: '/employees?limit=1',
    evidenceEndpoints: [
      { type: 'user_list', title: 'Factorial Employees', description: 'Employee directory for HR audit', path: '/employees', method: 'GET' },
      { type: 'audit_log', title: 'Factorial Leaves', description: 'Leave and absence records', path: '/leaves', method: 'GET' },
      { type: 'configuration', title: 'Factorial Teams', description: 'Team structure and assignments', path: '/teams', method: 'GET' },
    ],
  },
  {
    id: 'lattice', name: 'Lattice', category: 'HR',
    apiBaseUrl: 'https://api.lattice.com/v1', apiDocsUrl: 'https://developer.lattice.com/',
    authMethods: ['api-key'], authPrefix: 'Bearer',
    testEndpoint: '/users?limit=1',
    evidenceEndpoints: [
      { type: 'user_list', title: 'Lattice Users', description: 'User directory for performance management', path: '/users?limit=100', method: 'GET' },
      { type: 'compliance_status', title: 'Lattice Reviews', description: 'Performance review completion status', path: '/reviews?limit=100', method: 'GET' },
      { type: 'configuration', title: 'Lattice Goals', description: 'Goal tracking and OKR configuration', path: '/goals?limit=100', method: 'GET' },
    ],
  },
  {
    id: 'greenhouse', name: 'Greenhouse', category: 'HR',
    apiBaseUrl: 'https://harvest.greenhouse.io/v1', apiDocsUrl: 'https://developers.greenhouse.io/harvest.html',
    authMethods: ['api-key'], authHeader: 'Authorization', authPrefix: 'Basic',
    testEndpoint: '/candidates?per_page=1',
    evidenceEndpoints: [
      { type: 'user_list', title: 'Greenhouse Candidates', description: 'Candidate pipeline for hiring compliance', path: '/candidates?per_page=100', method: 'GET' },
      { type: 'change_management', title: 'Greenhouse Activity', description: 'Hiring activity feed for audit', path: '/activity_feed?per_page=100', method: 'GET' },
      { type: 'access_control', title: 'Greenhouse Users', description: 'System users and permission levels', path: '/users?per_page=100', method: 'GET' },
      { type: 'configuration', title: 'Greenhouse Jobs', description: 'Job posting configurations', path: '/jobs?per_page=100', method: 'GET' },
    ],
  },
  {
    id: 'lever', name: 'Lever', category: 'HR',
    apiBaseUrl: 'https://api.lever.co/v1', apiDocsUrl: 'https://hire.lever.co/developer/documentation',
    authMethods: ['api-key', 'oauth'], authHeader: 'Authorization', authPrefix: 'Basic',
    testEndpoint: '/opportunities?limit=1',
    evidenceEndpoints: [
      { type: 'user_list', title: 'Lever Opportunities', description: 'Candidate opportunities for hiring audit', path: '/opportunities?limit=100', method: 'GET' },
      { type: 'access_control', title: 'Lever Users', description: 'System users and access levels', path: '/users?limit=100', method: 'GET' },
      { type: 'configuration', title: 'Lever Postings', description: 'Job posting configurations', path: '/postings?limit=100', method: 'GET' },
    ],
  },
  {
    id: 'ashby', name: 'Ashby', category: 'HR',
    apiBaseUrl: 'https://api.ashbyhq.com', apiDocsUrl: 'https://developers.ashbyhq.com/',
    authMethods: ['api-key'], authHeader: 'Authorization', authPrefix: 'Basic',
    testEndpoint: '/candidate.list',
    evidenceEndpoints: [
      { type: 'user_list', title: 'Ashby Candidates', description: 'Candidate pipeline records', path: '/candidate.list', method: 'POST', params: { limit: 100 } },
      { type: 'access_control', title: 'Ashby Users', description: 'System user access levels', path: '/user.list', method: 'POST', params: { limit: 100 } },
      { type: 'configuration', title: 'Ashby Jobs', description: 'Job configuration records', path: '/job.list', method: 'POST', params: { limit: 100 } },
    ],
  },
  {
    id: 'culture-amp', name: 'Culture Amp', category: 'HR',
    apiBaseUrl: 'https://api.cultureamp.com/v1', apiDocsUrl: 'https://developer.cultureamp.com/',
    authMethods: ['api-key', 'oauth'], authPrefix: 'Bearer',
    testEndpoint: '/surveys?limit=1',
    evidenceEndpoints: [
      { type: 'user_list', title: 'Culture Amp Employees', description: 'Employee directory for engagement tracking', path: '/employees', method: 'GET' },
      { type: 'compliance_status', title: 'Culture Amp Surveys', description: 'Employee survey completion status', path: '/surveys', method: 'GET' },
      { type: 'training_completion', title: 'Culture Amp Actions', description: 'Action plan completion tracking', path: '/actions', method: 'GET' },
    ],
  },
  {
    id: '15five', name: '15Five', category: 'HR',
    apiBaseUrl: 'https://my.15five.com/api/public', apiDocsUrl: 'https://my.15five.com/api/public/',
    authMethods: ['api-key'], authPrefix: 'Bearer',
    testEndpoint: '/user/?page_size=1',
    evidenceEndpoints: [
      { type: 'user_list', title: '15Five Users', description: 'User records for performance tracking', path: '/user/?page_size=100', method: 'GET' },
      { type: 'compliance_status', title: '15Five Check-ins', description: 'Weekly check-in completion status', path: '/report/?page_size=100', method: 'GET' },
      { type: 'configuration', title: '15Five Groups', description: 'Team and group configuration', path: '/group/?page_size=100', method: 'GET' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ITSM & TICKETING (20)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'jira', name: 'Jira', category: 'Ticketing',
    apiBaseUrl: 'https://{instance}.atlassian.net/rest/api/3', apiDocsUrl: 'https://developer.atlassian.com/cloud/jira/platform/rest/v3/',
    authMethods: ['api-key', 'oauth', 'pat'], testEndpoint: '/myself',
    evidenceEndpoints: [
      { type: 'configuration', title: 'Jira User', description: 'Authenticated user details', path: '/myself', method: 'GET' },
      { type: 'asset_inventory', title: 'Jira Projects', description: 'Project inventory for change tracking', path: '/project/search?maxResults=100', method: 'GET' },
      { type: 'change_management', title: 'Jira Issues', description: 'Issue tracking for change management', path: '/search?jql=order+by+updated+desc&maxResults=100', method: 'GET' },
      { type: 'access_control', title: 'Jira Users', description: 'User accounts for access review', path: '/users/search?maxResults=100', method: 'GET' },
      { type: 'audit_log', title: 'Jira Audit Log', description: 'Audit log records', path: '/auditing/record?limit=100', method: 'GET' },
    ],
  },
  {
    id: 'servicenow', name: 'ServiceNow', category: 'Ticketing',
    apiBaseUrl: 'https://{instance}.service-now.com/api/now', apiDocsUrl: 'https://developer.servicenow.com/dev.do#!/reference/api/',
    authMethods: ['username-password', 'oauth'], testEndpoint: '/table/sys_user?sysparm_limit=1',
    evidenceEndpoints: [
      { type: 'change_management', title: 'ServiceNow Changes', description: 'Change request records for audit', path: '/table/change_request?sysparm_limit=100', method: 'GET' },
      { type: 'incident_report', title: 'ServiceNow Incidents', description: 'Incident records for tracking', path: '/table/incident?sysparm_limit=100', method: 'GET' },
      { type: 'access_control', title: 'ServiceNow Users', description: 'User accounts and roles', path: '/table/sys_user?sysparm_limit=100', method: 'GET' },
      { type: 'configuration', title: 'ServiceNow CMDB', description: 'Configuration management database items', path: '/table/cmdb_ci?sysparm_limit=100', method: 'GET' },
      { type: 'audit_log', title: 'ServiceNow Audit', description: 'System audit log entries', path: '/table/sys_audit?sysparm_limit=100', method: 'GET' },
    ],
  },
  {
    id: 'freshservice', name: 'Freshservice', category: 'Ticketing',
    apiBaseUrl: 'https://{domain}.freshservice.com/api/v2', apiDocsUrl: 'https://api.freshservice.com/',
    authMethods: ['api-key'], authHeader: 'Authorization', authPrefix: 'Basic',
    testEndpoint: '/tickets?per_page=1',
    evidenceEndpoints: [
      { type: 'change_management', title: 'Freshservice Changes', description: 'Change management records', path: '/changes?per_page=100', method: 'GET' },
      { type: 'incident_report', title: 'Freshservice Tickets', description: 'Support ticket records', path: '/tickets?per_page=100', method: 'GET' },
      { type: 'asset_inventory', title: 'Freshservice Assets', description: 'IT asset inventory', path: '/assets?per_page=100', method: 'GET' },
      { type: 'access_control', title: 'Freshservice Agents', description: 'Agent accounts and roles', path: '/agents?per_page=100', method: 'GET' },
    ],
  },
  {
    id: 'freshdesk', name: 'Freshdesk', category: 'Ticketing',
    apiBaseUrl: 'https://{domain}.freshdesk.com/api/v2', apiDocsUrl: 'https://developers.freshdesk.com/api/',
    authMethods: ['api-key'], authHeader: 'Authorization', authPrefix: 'Basic',
    testEndpoint: '/tickets?per_page=1',
    evidenceEndpoints: [
      { type: 'incident_report', title: 'Freshdesk Tickets', description: 'Support ticket records', path: '/tickets?per_page=100', method: 'GET' },
      { type: 'access_control', title: 'Freshdesk Agents', description: 'Agent accounts and roles', path: '/agents?per_page=100', method: 'GET' },
      { type: 'configuration', title: 'Freshdesk Groups', description: 'Support group configurations', path: '/groups', method: 'GET' },
      { type: 'audit_log', title: 'Freshdesk Activities', description: 'Activity log records', path: '/tickets?per_page=100&updated_since=2024-01-01', method: 'GET' },
    ],
  },
  {
    id: 'zendesk', name: 'Zendesk', category: 'Ticketing',
    apiBaseUrl: 'https://{subdomain}.zendesk.com/api/v2', apiDocsUrl: 'https://developer.zendesk.com/api-reference/',
    authMethods: ['api-key', 'oauth'], testEndpoint: '/users/me.json',
    evidenceEndpoints: [
      { type: 'incident_report', title: 'Zendesk Tickets', description: 'Support ticket records', path: '/tickets.json?per_page=100', method: 'GET' },
      { type: 'access_control', title: 'Zendesk Users', description: 'User accounts and roles', path: '/users.json?per_page=100', method: 'GET' },
      { type: 'audit_log', title: 'Zendesk Audit Logs', description: 'Account audit log entries', path: '/audit_logs.json?per_page=100', method: 'GET' },
      { type: 'configuration', title: 'Zendesk Groups', description: 'Agent group configurations', path: '/groups.json', method: 'GET' },
    ],
  },
  {
    id: 'connectwise', name: 'ConnectWise Manage', category: 'Ticketing',
    apiBaseUrl: 'https://{instance}.connectwise.com/v4_6_release/apis/3.0', apiDocsUrl: 'https://developer.connectwise.com/Products/ConnectWise_PSA/REST/',
    authMethods: ['api-key', 'username-password'], testEndpoint: '/system/info',
    evidenceEndpoints: [
      { type: 'incident_report', title: 'CW Tickets', description: 'Service ticket records', path: '/service/tickets?pageSize=100', method: 'GET' },
      { type: 'change_management', title: 'CW Projects', description: 'Project records for change tracking', path: '/project/projects?pageSize=100', method: 'GET' },
      { type: 'access_control', title: 'CW Members', description: 'System member accounts', path: '/system/members?pageSize=100', method: 'GET' },
      { type: 'asset_inventory', title: 'CW Configurations', description: 'IT configuration inventory', path: '/company/configurations?pageSize=100', method: 'GET' },
    ],
  },
  {
    id: 'manageengine-servicedesk', name: 'ManageEngine ServiceDesk Plus', category: 'Ticketing',
    apiBaseUrl: 'https://{instance}.manageengine.com/api/v3', apiDocsUrl: 'https://www.manageengine.com/products/service-desk/sdpod-v3-api/',
    authMethods: ['api-key', 'oauth'], authHeader: 'authtoken', authPrefix: '',
    testEndpoint: '/requests?input_data={"list_info":{"row_count":1}}',
    evidenceEndpoints: [
      { type: 'incident_report', title: 'ME ServiceDesk Requests', description: 'Service request records', path: '/requests', method: 'GET' },
      { type: 'change_management', title: 'ME ServiceDesk Changes', description: 'Change request records', path: '/changes', method: 'GET' },
      { type: 'asset_inventory', title: 'ME ServiceDesk Assets', description: 'IT asset inventory', path: '/assets', method: 'GET' },
    ],
  },
  {
    id: 'bmc-helix', name: 'BMC Helix ITSM', category: 'Ticketing',
    apiBaseUrl: 'https://{instance}.bmc.com/api/arsys/v1', apiDocsUrl: 'https://docs.bmc.com/docs/itsm/',
    authMethods: ['username-password', 'api-key'], testEndpoint: '/entry/HPD:Help Desk?limit=1',
    evidenceEndpoints: [
      { type: 'incident_report', title: 'BMC Helix Incidents', description: 'Incident management records', path: '/entry/HPD:Help Desk?limit=100', method: 'GET' },
      { type: 'change_management', title: 'BMC Helix Changes', description: 'Change management records', path: '/entry/CHG:Infrastructure Change?limit=100', method: 'GET' },
      { type: 'asset_inventory', title: 'BMC Helix Assets', description: 'Configuration item inventory', path: '/entry/BMC.ASSET?limit=100', method: 'GET' },
    ],
  },
  {
    id: 'ivanti-service-management', name: 'Ivanti Service Management', category: 'Ticketing',
    apiBaseUrl: 'https://{instance}.ivanticloud.com/api/odata/businessobject', apiDocsUrl: 'https://help.ivanti.com/ht/help/en_US/ISM/',
    authMethods: ['api-key', 'oauth'], authPrefix: 'Bearer',
    testEndpoint: '/incidents?$top=1',
    evidenceEndpoints: [
      { type: 'incident_report', title: 'Ivanti Incidents', description: 'Incident records for tracking', path: '/incidents?$top=100', method: 'GET' },
      { type: 'change_management', title: 'Ivanti Changes', description: 'Change management records', path: '/changes?$top=100', method: 'GET' },
      { type: 'asset_inventory', title: 'Ivanti CIs', description: 'Configuration item inventory', path: '/CIs?$top=100', method: 'GET' },
    ],
  },
  {
    id: 'sysaid', name: 'SysAid', category: 'Ticketing',
    apiBaseUrl: 'https://{instance}.sysaidit.com/api/v1', apiDocsUrl: 'https://documentation.sysaid.com/docs/rest-api-guide',
    authMethods: ['username-password', 'api-key'], testEndpoint: '/sr?limit=1',
    evidenceEndpoints: [
      { type: 'incident_report', title: 'SysAid Service Records', description: 'Service request and incident records', path: '/sr?limit=100', method: 'GET' },
      { type: 'asset_inventory', title: 'SysAid Assets', description: 'IT asset inventory', path: '/asset?limit=100', method: 'GET' },
      { type: 'access_control', title: 'SysAid Users', description: 'User accounts and permissions', path: '/users?limit=100', method: 'GET' },
    ],
  },
  {
    id: 'haloitsm', name: 'HaloITSM', category: 'Ticketing',
    apiBaseUrl: 'https://{instance}.haloitsm.com/api', apiDocsUrl: 'https://halopsa.com/apidoc/',
    authMethods: ['oauth', 'api-key'], authPrefix: 'Bearer',
    testEndpoint: '/tickets?count=1',
    evidenceEndpoints: [
      { type: 'incident_report', title: 'Halo Tickets', description: 'Service ticket records', path: '/tickets?count=100', method: 'GET' },
      { type: 'change_management', title: 'Halo Changes', description: 'Change request records', path: '/ChangeRequests?count=100', method: 'GET' },
      { type: 'asset_inventory', title: 'Halo Assets', description: 'IT asset inventory', path: '/Asset?count=100', method: 'GET' },
    ],
  },
  {
    id: 'topdesk', name: 'TOPdesk', category: 'Ticketing',
    apiBaseUrl: 'https://{instance}.topdesk.net/tas/api', apiDocsUrl: 'https://developers.topdesk.com/documentation/',
    authMethods: ['username-password', 'api-key'], authHeader: 'Authorization', authPrefix: 'Basic',
    testEndpoint: '/incidents?pageSize=1',
    evidenceEndpoints: [
      { type: 'incident_report', title: 'TOPdesk Incidents', description: 'Incident management records', path: '/incidents?pageSize=100', method: 'GET' },
      { type: 'change_management', title: 'TOPdesk Changes', description: 'Change activity records', path: '/operatorChanges?pageSize=100', method: 'GET' },
      { type: 'asset_inventory', title: 'TOPdesk Assets', description: 'Asset management records', path: '/assetmgmt/assets?pageSize=100', method: 'GET' },
    ],
  },
  {
    id: 'spiceworks', name: 'Spiceworks', category: 'Ticketing',
    apiBaseUrl: 'https://{instance}.on.spiceworks.com/api/v1', apiDocsUrl: 'https://community.spiceworks.com/support/help-desk-server/docs/api/',
    authMethods: ['api-key'], authPrefix: 'Bearer',
    testEndpoint: '/tickets?per_page=1',
    evidenceEndpoints: [
      { type: 'incident_report', title: 'Spiceworks Tickets', description: 'Help desk ticket records', path: '/tickets?per_page=100', method: 'GET' },
      { type: 'asset_inventory', title: 'Spiceworks Devices', description: 'Network device inventory', path: '/devices?per_page=100', method: 'GET' },
      { type: 'access_control', title: 'Spiceworks Users', description: 'User accounts', path: '/users?per_page=100', method: 'GET' },
    ],
  },
  {
    id: 'cherwell', name: 'Cherwell', category: 'Ticketing',
    apiBaseUrl: 'https://{instance}/CherwellAPI/api/V1', apiDocsUrl: 'https://help.cherwell.com/bundle/cherwell_rest_api_help/',
    authMethods: ['oauth', 'api-key'], authPrefix: 'Bearer',
    testEndpoint: '/getbusinessobjectsummary/busobname/Incident',
    evidenceEndpoints: [
      { type: 'incident_report', title: 'Cherwell Incidents', description: 'Incident records for tracking', path: '/searchresults', method: 'POST', params: { busObId: 'Incident', pageSize: 100 } },
      { type: 'change_management', title: 'Cherwell Changes', description: 'Change management records', path: '/searchresults', method: 'POST', params: { busObId: 'ChangeRequest', pageSize: 100 } },
      { type: 'asset_inventory', title: 'Cherwell CIs', description: 'Configuration item inventory', path: '/searchresults', method: 'POST', params: { busObId: 'ConfigurationItem', pageSize: 100 } },
    ],
  },
  {
    id: 'solarwinds-service-desk', name: 'SolarWinds Service Desk', category: 'Ticketing',
    apiBaseUrl: 'https://api.samanage.com', apiDocsUrl: 'https://documentation.solarwinds.com/en/success_center/swsd/content/api/',
    authMethods: ['api-key'], authHeader: 'X-Samanage-Authorization', authPrefix: 'Bearer',
    testEndpoint: '/incidents.json?per_page=1',
    evidenceEndpoints: [
      { type: 'incident_report', title: 'SWSD Incidents', description: 'Incident records', path: '/incidents.json?per_page=100', method: 'GET' },
      { type: 'change_management', title: 'SWSD Changes', description: 'Change management records', path: '/changes.json?per_page=100', method: 'GET' },
      { type: 'asset_inventory', title: 'SWSD Hardware', description: 'Hardware asset inventory', path: '/hardwares.json?per_page=100', method: 'GET' },
    ],
  },
  {
    id: 'pagerduty-incidents', name: 'PagerDuty Incident Management', category: 'Ticketing',
    apiBaseUrl: 'https://api.pagerduty.com', apiDocsUrl: 'https://developer.pagerduty.com/api-reference/',
    authMethods: ['api-key'], authHeader: 'Authorization', authPrefix: 'Token token=',
    testEndpoint: '/incidents?limit=1',
    evidenceEndpoints: [
      { type: 'incident_report', title: 'PD Incidents', description: 'Incident management records', path: '/incidents?limit=100', method: 'GET' },
      { type: 'change_management', title: 'PD Change Events', description: 'Change event tracking', path: '/change_events?limit=100', method: 'GET' },
      { type: 'configuration', title: 'PD Escalation Policies', description: 'Escalation policy configurations', path: '/escalation_policies', method: 'GET' },
    ],
  },
  {
    id: 'opsgenie-incidents', name: 'Opsgenie Incident Management', category: 'Ticketing',
    apiBaseUrl: 'https://api.opsgenie.com/v1', apiDocsUrl: 'https://docs.opsgenie.com/docs/incident-api',
    authMethods: ['api-key'], authHeader: 'Authorization', authPrefix: 'GenieKey',
    testEndpoint: '/incidents?limit=1',
    evidenceEndpoints: [
      { type: 'incident_report', title: 'OG Incidents', description: 'Incident records', path: '/incidents?limit=100', method: 'GET' },
      { type: 'configuration', title: 'OG Services', description: 'Service configurations', path: '/services?limit=100', method: 'GET' },
      { type: 'change_management', title: 'OG Incident Timelines', description: 'Incident timeline and action records', path: '/incidents?limit=100&sort=createdAt&order=desc', method: 'GET' },
    ],
  },
  {
    id: 'statuspage-incidents', name: 'Statuspage Incident Management', category: 'Ticketing',
    apiBaseUrl: 'https://api.statuspage.io/v1', apiDocsUrl: 'https://developer.statuspage.io/',
    authMethods: ['api-key'], authHeader: 'Authorization', authPrefix: 'OAuth',
    testEndpoint: '/pages',
    evidenceEndpoints: [
      { type: 'incident_report', title: 'SP Incidents', description: 'Public incident history', path: '/pages/{account}/incidents', method: 'GET' },
      { type: 'configuration', title: 'SP Components', description: 'Component status configurations', path: '/pages/{account}/components', method: 'GET' },
      { type: 'compliance_status', title: 'SP Uptime', description: 'Component uptime metrics', path: '/pages/{account}/components/uptime', method: 'GET' },
    ],
  },
  {
    id: 'firehydrant', name: 'FireHydrant', category: 'Ticketing',
    apiBaseUrl: 'https://api.firehydrant.io/v1', apiDocsUrl: 'https://firehydrant.com/docs/api/',
    authMethods: ['api-key'], authHeader: 'Authorization', authPrefix: 'Bearer',
    testEndpoint: '/ping',
    evidenceEndpoints: [
      { type: 'incident_report', title: 'FH Incidents', description: 'Incident management records', path: '/incidents?per_page=100', method: 'GET' },
      { type: 'change_management', title: 'FH Changes', description: 'Change event records', path: '/changes?per_page=100', method: 'GET' },
      { type: 'configuration', title: 'FH Services', description: 'Service catalog entries', path: '/services?per_page=100', method: 'GET' },
      { type: 'compliance_status', title: 'FH Retrospectives', description: 'Post-incident retrospective records', path: '/post_mortems?per_page=100', method: 'GET' },
    ],
  },
  {
    id: 'rootly', name: 'Rootly', category: 'Ticketing',
    apiBaseUrl: 'https://api.rootly.com/v1', apiDocsUrl: 'https://rootly.com/api',
    authMethods: ['api-key'], authHeader: 'Authorization', authPrefix: 'Bearer',
    testEndpoint: '/incidents?page[size]=1',
    evidenceEndpoints: [
      { type: 'incident_report', title: 'Rootly Incidents', description: 'Incident management records', path: '/incidents?page[size]=100', method: 'GET' },
      { type: 'configuration', title: 'Rootly Services', description: 'Service catalog configuration', path: '/services?page[size]=100', method: 'GET' },
      { type: 'compliance_status', title: 'Rootly Retrospectives', description: 'Post-incident review records', path: '/retrospectives?page[size]=100', method: 'GET' },
    ],
  },


  // ═══════════════════════════════════════════════════════════════════════════
  // PRODUCTIVITY & COLLABORATION (25)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'slack', name: 'Slack', category: 'Productivity',
    apiBaseUrl: 'https://slack.com/api', apiDocsUrl: 'https://api.slack.com/methods',
    authMethods: ['oauth', 'api-key'], authPrefix: 'Bearer',
    testEndpoint: '/auth.test',
    evidenceEndpoints: [
      { type: 'access_control', title: 'Slack Users', description: 'Workspace user accounts', path: '/users.list?limit=100', method: 'GET' },
      { type: 'configuration', title: 'Slack Channels', description: 'Channel configurations', path: '/conversations.list?limit=100', method: 'GET' },
      { type: 'audit_log', title: 'Slack Audit Logs', description: 'Enterprise Grid audit log events', path: 'https://api.slack.com/audit/v1/logs?limit=100', method: 'GET' },
      { type: 'access_control', title: 'Slack Apps', description: 'Installed application inventory', path: '/apps.list?limit=100', method: 'GET' },
    ],
  },
  {
    id: 'microsoft-teams', name: 'Microsoft Teams', category: 'Productivity',
    apiBaseUrl: 'https://graph.microsoft.com/v1.0', apiDocsUrl: 'https://learn.microsoft.com/en-us/graph/api/resources/teams-api-overview',
    authMethods: ['oauth'], authPrefix: 'Bearer',
    testEndpoint: '/me',
    evidenceEndpoints: [
      { type: 'access_control', title: 'Teams Users', description: 'Organization user accounts', path: '/users?$top=100', method: 'GET' },
      { type: 'configuration', title: 'Teams', description: 'Teams configurations', path: '/groups?$filter=resourceProvisioningOptions/Any(x:x eq \'Team\')&$top=100', method: 'GET' },
      { type: 'audit_log', title: 'Teams Activity', description: 'User activity reports', path: '/reports/getTeamsUserActivityUserDetail(period=\'D30\')', method: 'GET' },
    ],
  },
  {
    id: 'discord', name: 'Discord', category: 'Productivity',
    apiBaseUrl: 'https://discord.com/api/v10', apiDocsUrl: 'https://discord.com/developers/docs/',
    authMethods: ['api-key', 'oauth'], authHeader: 'Authorization', authPrefix: 'Bot',
    testEndpoint: '/users/@me',
    evidenceEndpoints: [
      { type: 'configuration', title: 'Discord Guilds', description: 'Server guild inventory', path: '/users/@me/guilds', method: 'GET' },
      { type: 'access_control', title: 'Discord Members', description: 'Guild member list', path: '/guilds/{account}/members?limit=100', method: 'GET' },
      { type: 'access_control', title: 'Discord Roles', description: 'Guild role configurations', path: '/guilds/{account}/roles', method: 'GET' },
    ],
  },
  {
    id: 'zoom', name: 'Zoom', category: 'Productivity',
    apiBaseUrl: 'https://api.zoom.us/v2', apiDocsUrl: 'https://developers.zoom.us/docs/api/',
    authMethods: ['oauth', 'api-key'], authPrefix: 'Bearer',
    testEndpoint: '/users/me',
    evidenceEndpoints: [
      { type: 'access_control', title: 'Zoom Users', description: 'User account inventory', path: '/users?page_size=100', method: 'GET' },
      { type: 'audit_log', title: 'Zoom Activity', description: 'User activity reports', path: '/report/activities?page_size=100', method: 'GET' },
      { type: 'configuration', title: 'Zoom Settings', description: 'Account settings and configuration', path: '/accounts/me/settings', method: 'GET' },
      { type: 'compliance_status', title: 'Zoom Recordings', description: 'Cloud recording inventory', path: '/users/me/recordings', method: 'GET' },
    ],
  },
  {
    id: 'google-meet', name: 'Google Meet', category: 'Productivity',
    apiBaseUrl: 'https://admin.googleapis.com/admin/reports/v1', apiDocsUrl: 'https://developers.google.com/admin-sdk/reports/',
    authMethods: ['oauth', 'service-account'], authPrefix: 'Bearer',
    testEndpoint: '/activity/users/all/applications/meet?maxResults=1',
    evidenceEndpoints: [
      { type: 'audit_log', title: 'Meet Activity', description: 'Google Meet usage activity logs', path: '/activity/users/all/applications/meet?maxResults=100', method: 'GET' },
      { type: 'compliance_status', title: 'Meet Usage', description: 'Meeting usage and participation data', path: '/usage/dates/2024-01-01?parameters=meet:num_calls_completed', method: 'GET' },
      { type: 'configuration', title: 'Meet Settings', description: 'Google Workspace meet settings', path: 'https://admin.googleapis.com/admin/directory/v1/customer/my_customer', method: 'GET' },
    ],
  },
  {
    id: 'webex', name: 'Webex', category: 'Productivity',
    apiBaseUrl: 'https://webexapis.com/v1', apiDocsUrl: 'https://developer.webex.com/docs/api/getting-started',
    authMethods: ['oauth', 'api-key'], authPrefix: 'Bearer',
    testEndpoint: '/people/me',
    evidenceEndpoints: [
      { type: 'access_control', title: 'Webex People', description: 'User account inventory', path: '/people?max=100', method: 'GET' },
      { type: 'configuration', title: 'Webex Rooms', description: 'Room/space configurations', path: '/rooms?max=100', method: 'GET' },
      { type: 'audit_log', title: 'Webex Admin Audit', description: 'Admin audit event log', path: '/adminAudit/events?max=100', method: 'GET' },
    ],
  },
  {
    id: 'notion', name: 'Notion', category: 'Productivity',
    apiBaseUrl: 'https://api.notion.com/v1', apiDocsUrl: 'https://developers.notion.com/reference/',
    authMethods: ['api-key', 'oauth'], authHeader: 'Authorization', authPrefix: 'Bearer',
    testEndpoint: '/users/me',
    evidenceEndpoints: [
      { type: 'access_control', title: 'Notion Users', description: 'Workspace user accounts', path: '/users?page_size=100', method: 'GET' },
      { type: 'asset_inventory', title: 'Notion Databases', description: 'Database inventory', path: '/search', method: 'POST', params: { filter: { property: 'object', value: 'database' }, page_size: 100 } },
      { type: 'audit_log', title: 'Notion Audit Log', description: 'Workspace audit events', path: 'https://api.notion.com/v1/audit_log', method: 'GET' },
    ],
  },
  {
    id: 'confluence', name: 'Confluence', category: 'Productivity',
    apiBaseUrl: 'https://{instance}.atlassian.net/wiki/api/v2', apiDocsUrl: 'https://developer.atlassian.com/cloud/confluence/rest/v2/',
    authMethods: ['api-key', 'oauth', 'pat'], testEndpoint: '/spaces?limit=1',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'Confluence Spaces', description: 'Space inventory for content audit', path: '/spaces?limit=100', method: 'GET' },
      { type: 'access_control', title: 'Confluence Groups', description: 'User group configurations', path: 'https://{instance}.atlassian.net/wiki/rest/api/group?limit=100', method: 'GET' },
      { type: 'audit_log', title: 'Confluence Audit', description: 'Audit log records', path: 'https://{instance}.atlassian.net/wiki/rest/api/audit?limit=100', method: 'GET' },
    ],
  },
  {
    id: 'asana', name: 'Asana', category: 'Productivity',
    apiBaseUrl: 'https://app.asana.com/api/1.0', apiDocsUrl: 'https://developers.asana.com/reference/',
    authMethods: ['pat', 'oauth'], authPrefix: 'Bearer',
    testEndpoint: '/users/me',
    evidenceEndpoints: [
      { type: 'access_control', title: 'Asana Users', description: 'Workspace user accounts', path: '/workspaces/{account}/users?limit=100', method: 'GET' },
      { type: 'asset_inventory', title: 'Asana Projects', description: 'Project inventory', path: '/workspaces/{account}/projects?limit=100', method: 'GET' },
      { type: 'change_management', title: 'Asana Tasks', description: 'Task records for tracking', path: '/workspaces/{account}/tasks/search?limit=100&sort_by=modified_at', method: 'GET' },
    ],
  },
  {
    id: 'monday', name: 'Monday.com', category: 'Productivity',
    apiBaseUrl: 'https://api.monday.com/v2', apiDocsUrl: 'https://developer.monday.com/api-reference/',
    authMethods: ['api-key'], authHeader: 'Authorization', authPrefix: '',
    testEndpoint: '',
    evidenceEndpoints: [
      { type: 'access_control', title: 'Monday Users', description: 'User accounts', path: '', method: 'POST', params: { query: '{ users (limit: 100) { id name email } }' } },
      { type: 'asset_inventory', title: 'Monday Boards', description: 'Board inventory', path: '', method: 'POST', params: { query: '{ boards (limit: 100) { id name state } }' } },
      { type: 'audit_log', title: 'Monday Activity', description: 'Activity log events', path: '', method: 'POST', params: { query: '{ boards (limit: 10) { activity_logs (limit: 100) { id event data } } }' } },
    ],
  },
  {
    id: 'trello', name: 'Trello', category: 'Productivity',
    apiBaseUrl: 'https://api.trello.com/1', apiDocsUrl: 'https://developer.atlassian.com/cloud/trello/rest/',
    authMethods: ['api-key'], testEndpoint: '/members/me',
    evidenceEndpoints: [
      { type: 'access_control', title: 'Trello Members', description: 'Organization members', path: '/organizations/{org}/members', method: 'GET' },
      { type: 'asset_inventory', title: 'Trello Boards', description: 'Board inventory', path: '/members/me/boards', method: 'GET' },
      { type: 'change_management', title: 'Trello Actions', description: 'Board activity and change history', path: '/organizations/{org}/actions?limit=100', method: 'GET' },
    ],
  },
  {
    id: 'clickup', name: 'ClickUp', category: 'Productivity',
    apiBaseUrl: 'https://api.clickup.com/api/v2', apiDocsUrl: 'https://clickup.com/api/',
    authMethods: ['api-key', 'oauth'], authPrefix: 'Bearer',
    testEndpoint: '/user',
    evidenceEndpoints: [
      { type: 'access_control', title: 'ClickUp Teams', description: 'Workspace team members', path: '/team', method: 'GET' },
      { type: 'asset_inventory', title: 'ClickUp Spaces', description: 'Space inventory', path: '/team/{account}/space', method: 'GET' },
      { type: 'change_management', title: 'ClickUp Tasks', description: 'Task records for tracking', path: '/team/{account}/task?page=0', method: 'GET' },
    ],
  },
  {
    id: 'linear', name: 'Linear', category: 'Productivity',
    apiBaseUrl: 'https://api.linear.app', apiDocsUrl: 'https://developers.linear.app/docs/',
    authMethods: ['api-key', 'oauth'], authPrefix: 'Bearer',
    testEndpoint: '/graphql',
    evidenceEndpoints: [
      { type: 'access_control', title: 'Linear Users', description: 'Workspace users', path: '/graphql', method: 'POST', params: { query: '{ users { nodes { id name email } } }' } },
      { type: 'asset_inventory', title: 'Linear Projects', description: 'Project inventory', path: '/graphql', method: 'POST', params: { query: '{ projects(first: 100) { nodes { id name state } } }' } },
      { type: 'change_management', title: 'Linear Issues', description: 'Issue tracking records', path: '/graphql', method: 'POST', params: { query: '{ issues(first: 100, orderBy: updatedAt) { nodes { id title state { name } } } }' } },
    ],
  },
  {
    id: 'basecamp', name: 'Basecamp', category: 'Productivity',
    apiBaseUrl: 'https://3.basecampapi.com/{account}', apiDocsUrl: 'https://github.com/basecamp/bc3-api',
    authMethods: ['oauth'], authPrefix: 'Bearer',
    testEndpoint: '/projects.json',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'Basecamp Projects', description: 'Project inventory', path: '/projects.json', method: 'GET' },
      { type: 'access_control', title: 'Basecamp People', description: 'Project member accounts', path: '/people.json', method: 'GET' },
      { type: 'change_management', title: 'Basecamp Events', description: 'Activity event timeline', path: '/events.json', method: 'GET' },
    ],
  },
  {
    id: 'wrike', name: 'Wrike', category: 'Productivity',
    apiBaseUrl: 'https://www.wrike.com/api/v4', apiDocsUrl: 'https://developers.wrike.com/api/v4/',
    authMethods: ['oauth', 'api-key'], authPrefix: 'Bearer',
    testEndpoint: '/contacts?me=true',
    evidenceEndpoints: [
      { type: 'access_control', title: 'Wrike Users', description: 'Account user contacts', path: '/contacts?limit=100', method: 'GET' },
      { type: 'asset_inventory', title: 'Wrike Folders', description: 'Folder and project inventory', path: '/folders', method: 'GET' },
      { type: 'change_management', title: 'Wrike Tasks', description: 'Task change tracking', path: '/tasks?limit=100&sortField=UpdatedDate&sortOrder=Desc', method: 'GET' },
      { type: 'audit_log', title: 'Wrike Audit Log', description: 'Account audit log', path: '/audit_log', method: 'GET' },
    ],
  },
  {
    id: 'smartsheet', name: 'Smartsheet', category: 'Productivity',
    apiBaseUrl: 'https://api.smartsheet.com/2.0', apiDocsUrl: 'https://smartsheet.redoc.ly/',
    authMethods: ['api-key', 'oauth'], authPrefix: 'Bearer',
    testEndpoint: '/users/me',
    evidenceEndpoints: [
      { type: 'access_control', title: 'Smartsheet Users', description: 'Account user list', path: '/users?pageSize=100', method: 'GET' },
      { type: 'asset_inventory', title: 'Smartsheet Sheets', description: 'Sheet inventory', path: '/sheets?pageSize=100', method: 'GET' },
      { type: 'audit_log', title: 'Smartsheet Events', description: 'Event reporting log', path: '/events', method: 'GET' },
    ],
  },
  {
    id: 'airtable', name: 'Airtable', category: 'Productivity',
    apiBaseUrl: 'https://api.airtable.com/v0', apiDocsUrl: 'https://airtable.com/developers/web/api/',
    authMethods: ['api-key', 'oauth'], authPrefix: 'Bearer',
    testEndpoint: '/meta/whoami',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'Airtable Bases', description: 'Base inventory', path: '/meta/bases', method: 'GET' },
      { type: 'access_control', title: 'Airtable Collaborators', description: 'Base collaborators and permissions', path: '/meta/bases/{account}/collaborators', method: 'GET' },
      { type: 'audit_log', title: 'Airtable Audit Log', description: 'Enterprise audit log events', path: 'https://api.airtable.com/v0/meta/enterpriseAccount/auditLogEvents', method: 'GET' },
    ],
  },
  {
    id: 'coda', name: 'Coda', category: 'Productivity',
    apiBaseUrl: 'https://coda.io/apis/v1', apiDocsUrl: 'https://coda.io/developers/apis/v1',
    authMethods: ['api-key'], authPrefix: 'Bearer',
    testEndpoint: '/whoami',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'Coda Docs', description: 'Document inventory', path: '/docs?limit=100', method: 'GET' },
      { type: 'access_control', title: 'Coda Permissions', description: 'Document sharing permissions', path: '/docs/{account}/acl/permissions', method: 'GET' },
      { type: 'configuration', title: 'Coda Analytics', description: 'Document analytics and usage', path: '/analytics/docs?limit=100', method: 'GET' },
    ],
  },
  {
    id: 'miro', name: 'Miro', category: 'Productivity',
    apiBaseUrl: 'https://api.miro.com/v2', apiDocsUrl: 'https://developers.miro.com/reference/api-reference',
    authMethods: ['oauth', 'api-key'], authPrefix: 'Bearer',
    testEndpoint: '/boards?limit=1',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'Miro Boards', description: 'Board inventory', path: '/boards?limit=100', method: 'GET' },
      { type: 'access_control', title: 'Miro Team Members', description: 'Team member accounts', path: '/orgs/{org}/members?limit=100', method: 'GET' },
      { type: 'audit_log', title: 'Miro Audit Logs', description: 'Organization audit log events', path: '/orgs/{org}/audit-logs?limit=100', method: 'GET' },
    ],
  },
  {
    id: 'figma', name: 'Figma', category: 'Productivity',
    apiBaseUrl: 'https://api.figma.com/v1', apiDocsUrl: 'https://www.figma.com/developers/api',
    authMethods: ['pat', 'oauth'], authPrefix: 'Bearer',
    testEndpoint: '/me',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'Figma Projects', description: 'Team project inventory', path: '/teams/{account}/projects', method: 'GET' },
      { type: 'access_control', title: 'Figma Team Members', description: 'Team member access list', path: '/teams/{account}/members', method: 'GET' },
      { type: 'audit_log', title: 'Figma Activity', description: 'Organization activity log', path: 'https://api.figma.com/v1/activity_logs', method: 'GET' },
    ],
  },
  {
    id: 'google-drive', name: 'Google Drive', category: 'Productivity',
    apiBaseUrl: 'https://www.googleapis.com/drive/v3', apiDocsUrl: 'https://developers.google.com/drive/api/reference/rest/v3',
    authMethods: ['oauth', 'service-account'], authPrefix: 'Bearer',
    testEndpoint: '/about?fields=user',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'Google Drive Files', description: 'File and folder inventory', path: '/files?pageSize=100&fields=files(id,name,mimeType,owners,permissions)', method: 'GET' },
      { type: 'access_control', title: 'Google Drive Permissions', description: 'Shared file permissions', path: '/files?pageSize=100&q=sharedWithMe&fields=files(id,name,permissions)', method: 'GET' },
      { type: 'audit_log', title: 'Google Drive Activity', description: 'Drive activity audit log', path: 'https://driveactivity.googleapis.com/v2/activity:query', method: 'POST', params: { pageSize: 100 } },
    ],
  },
  {
    id: 'dropbox-business', name: 'Dropbox Business', category: 'Productivity',
    apiBaseUrl: 'https://api.dropboxapi.com/2', apiDocsUrl: 'https://www.dropbox.com/developers/documentation/http/teams',
    authMethods: ['oauth'], authPrefix: 'Bearer',
    testEndpoint: '/team/get_info',
    evidenceEndpoints: [
      { type: 'access_control', title: 'Dropbox Members', description: 'Team member accounts', path: '/team/members/list_v2', method: 'POST', params: { limit: 100 } },
      { type: 'audit_log', title: 'Dropbox Activity', description: 'Team activity audit log', path: '/team_log/get_events', method: 'POST', params: { limit: 100 } },
      { type: 'configuration', title: 'Dropbox Groups', description: 'Team group configurations', path: '/team/groups/list', method: 'POST', params: { limit: 100 } },
    ],
  },
  {
    id: 'box', name: 'Box', category: 'Productivity',
    apiBaseUrl: 'https://api.box.com/2.0', apiDocsUrl: 'https://developer.box.com/reference/',
    authMethods: ['oauth'], authPrefix: 'Bearer',
    testEndpoint: '/users/me',
    evidenceEndpoints: [
      { type: 'access_control', title: 'Box Users', description: 'Enterprise user accounts', path: '/users?limit=100', method: 'GET' },
      { type: 'audit_log', title: 'Box Events', description: 'Enterprise event audit log', path: '/events?stream_type=admin_logs&limit=100', method: 'GET' },
      { type: 'configuration', title: 'Box Groups', description: 'Enterprise group configurations', path: '/groups?limit=100', method: 'GET' },
      { type: 'asset_inventory', title: 'Box Folders', description: 'Top-level folder inventory', path: '/folders/0/items?limit=100', method: 'GET' },
    ],
  },
  {
    id: 'onedrive', name: 'OneDrive for Business', category: 'Productivity',
    apiBaseUrl: 'https://graph.microsoft.com/v1.0', apiDocsUrl: 'https://learn.microsoft.com/en-us/graph/api/resources/onedrive',
    authMethods: ['oauth'], authPrefix: 'Bearer',
    testEndpoint: '/me/drive',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'OneDrive Root Items', description: 'Root-level file and folder inventory', path: '/me/drive/root/children?$top=100', method: 'GET' },
      { type: 'access_control', title: 'OneDrive Shared', description: 'Shared items and permissions', path: '/me/drive/sharedWithMe?$top=100', method: 'GET' },
      { type: 'configuration', title: 'OneDrive Drive Info', description: 'Drive configuration and quota details', path: '/me/drive', method: 'GET' },
    ],
  },
  {
    id: 'sharepoint', name: 'SharePoint Online', category: 'Productivity',
    apiBaseUrl: 'https://graph.microsoft.com/v1.0', apiDocsUrl: 'https://learn.microsoft.com/en-us/graph/api/resources/sharepoint',
    authMethods: ['oauth'], authPrefix: 'Bearer',
    testEndpoint: '/sites?search=*&$top=1',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'SharePoint Sites', description: 'Site collection inventory', path: '/sites?search=*&$top=100', method: 'GET' },
      { type: 'access_control', title: 'SharePoint Permissions', description: 'Site permission and sharing configurations', path: '/sites/{account}/permissions', method: 'GET' },
      { type: 'configuration', title: 'SharePoint Lists', description: 'Site list and library inventory', path: '/sites/{account}/lists', method: 'GET' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CRM & SALES (10)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'salesforce', name: 'Salesforce', category: 'CRM',
    apiBaseUrl: 'https://{instance}.salesforce.com/services/data/v59.0', apiDocsUrl: 'https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/',
    authMethods: ['oauth'], authPrefix: 'Bearer',
    testEndpoint: '/sobjects',
    evidenceEndpoints: [
      { type: 'access_control', title: 'SF Users', description: 'Salesforce user accounts and profiles', path: '/query?q=SELECT+Id,Name,Email,Profile.Name,IsActive+FROM+User+LIMIT+100', method: 'GET' },
      { type: 'audit_log', title: 'SF Setup Audit Trail', description: 'Setup audit trail for configuration changes', path: '/query?q=SELECT+Action,CreatedDate,Display,Section+FROM+SetupAuditTrail+ORDER+BY+CreatedDate+DESC+LIMIT+100', method: 'GET' },
      { type: 'configuration', title: 'SF Profiles', description: 'Security profile configurations', path: '/query?q=SELECT+Id,Name,PermissionsApiEnabled+FROM+Profile+LIMIT+100', method: 'GET' },
      { type: 'access_control', title: 'SF Login History', description: 'User login history for access review', path: '/query?q=SELECT+UserId,LoginTime,SourceIp,Status+FROM+LoginHistory+ORDER+BY+LoginTime+DESC+LIMIT+100', method: 'GET' },
    ],
  },
  {
    id: 'hubspot', name: 'HubSpot', category: 'CRM',
    apiBaseUrl: 'https://api.hubapi.com', apiDocsUrl: 'https://developers.hubspot.com/docs/api/',
    authMethods: ['oauth', 'api-key'], authPrefix: 'Bearer',
    testEndpoint: '/account-info/v3/api-usage/daily/private-apps',
    evidenceEndpoints: [
      { type: 'access_control', title: 'HubSpot Users', description: 'Account user and role assignments', path: '/settings/v3/users', method: 'GET' },
      { type: 'audit_log', title: 'HubSpot Audit Logs', description: 'Account activity audit log', path: '/account-info/v3/activity/audit-logs?limit=100', method: 'GET' },
      { type: 'asset_inventory', title: 'HubSpot Contacts', description: 'CRM contact records', path: '/crm/v3/objects/contacts?limit=100', method: 'GET' },
      { type: 'configuration', title: 'HubSpot Pipelines', description: 'Deal pipeline configurations', path: '/crm/v3/pipelines/deals', method: 'GET' },
    ],
  },
  {
    id: 'pipedrive', name: 'Pipedrive', category: 'CRM',
    apiBaseUrl: 'https://api.pipedrive.com/v1', apiDocsUrl: 'https://developers.pipedrive.com/docs/api/v1',
    authMethods: ['api-key', 'oauth'], testEndpoint: '/users/me',
    evidenceEndpoints: [
      { type: 'access_control', title: 'Pipedrive Users', description: 'User accounts and permissions', path: '/users', method: 'GET' },
      { type: 'asset_inventory', title: 'Pipedrive Deals', description: 'Deal pipeline records', path: '/deals?limit=100', method: 'GET' },
      { type: 'audit_log', title: 'Pipedrive Changelog', description: 'Record change log', path: '/recents?since_timestamp=2024-01-01+00:00:00&limit=100', method: 'GET' },
    ],
  },
  {
    id: 'zoho-crm', name: 'Zoho CRM', category: 'CRM',
    apiBaseUrl: 'https://www.zohoapis.com/crm/v5', apiDocsUrl: 'https://www.zoho.com/crm/developer/docs/api/v5/',
    authMethods: ['oauth'], authHeader: 'Authorization', authPrefix: 'Zoho-oauthtoken',
    testEndpoint: '/users?type=AllUsers',
    evidenceEndpoints: [
      { type: 'access_control', title: 'Zoho CRM Users', description: 'CRM user accounts and roles', path: '/users?type=AllUsers', method: 'GET' },
      { type: 'audit_log', title: 'Zoho CRM Audit Log', description: 'Module audit log records', path: '/settings/audit_log?per_page=100', method: 'GET' },
      { type: 'configuration', title: 'Zoho CRM Roles', description: 'Role and profile configurations', path: '/settings/roles', method: 'GET' },
    ],
  },
  {
    id: 'freshsales', name: 'Freshsales', category: 'CRM',
    apiBaseUrl: 'https://{domain}.freshsales.io/api', apiDocsUrl: 'https://developers.freshworks.com/crm/',
    authMethods: ['api-key'], authHeader: 'Authorization', authPrefix: 'Token token=',
    testEndpoint: '/settings/users',
    evidenceEndpoints: [
      { type: 'access_control', title: 'Freshsales Users', description: 'CRM user accounts', path: '/settings/users', method: 'GET' },
      { type: 'asset_inventory', title: 'Freshsales Contacts', description: 'Contact records', path: '/contacts/view/1?per_page=100', method: 'GET' },
      { type: 'configuration', title: 'Freshsales Sales Activities', description: 'Sales activity configurations', path: '/settings/sales_activity_types', method: 'GET' },
    ],
  },
  {
    id: 'dynamics-365', name: 'Dynamics 365', category: 'CRM',
    apiBaseUrl: 'https://{instance}.api.crm.dynamics.com/api/data/v9.2', apiDocsUrl: 'https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/',
    authMethods: ['oauth'], authPrefix: 'Bearer',
    testEndpoint: '/systemusers?$top=1',
    evidenceEndpoints: [
      { type: 'access_control', title: 'D365 Users', description: 'System user accounts', path: '/systemusers?$top=100', method: 'GET' },
      { type: 'audit_log', title: 'D365 Audit', description: 'Entity change audit records', path: '/audits?$top=100', method: 'GET' },
      { type: 'configuration', title: 'D365 Security Roles', description: 'Security role definitions', path: '/roles?$top=100', method: 'GET' },
    ],
  },
  {
    id: 'sugarcrm', name: 'SugarCRM', category: 'CRM',
    apiBaseUrl: 'https://{instance}.sugarondemand.com/rest/v11_15', apiDocsUrl: 'https://support.sugarcrm.com/Documentation/Sugar_Developer/Sugar_Developer_Guide_13.0/Integration/Web_Services/REST_API/',
    authMethods: ['username-password', 'oauth'], authPrefix: 'Bearer',
    testEndpoint: '/me',
    evidenceEndpoints: [
      { type: 'access_control', title: 'Sugar Users', description: 'User accounts and teams', path: '/Users?max_num=100', method: 'GET' },
      { type: 'audit_log', title: 'Sugar Audit', description: 'Record audit log', path: '/Audit?max_num=100', method: 'GET' },
      { type: 'configuration', title: 'Sugar Roles', description: 'Role and permission configurations', path: '/Roles?max_num=100', method: 'GET' },
    ],
  },
  {
    id: 'copper', name: 'Copper', category: 'CRM',
    apiBaseUrl: 'https://api.copper.com/developer_api/v1', apiDocsUrl: 'https://developer.copper.com/reference/',
    authMethods: ['api-key'], authHeader: 'X-PW-AccessToken', authPrefix: '',
    testEndpoint: '/account',
    evidenceEndpoints: [
      { type: 'access_control', title: 'Copper Users', description: 'CRM user accounts', path: '/users/search', method: 'POST', params: { page_size: 100 } },
      { type: 'asset_inventory', title: 'Copper Leads', description: 'Lead records', path: '/leads/search', method: 'POST', params: { page_size: 100 } },
      { type: 'configuration', title: 'Copper Pipelines', description: 'Pipeline configurations', path: '/pipelines', method: 'GET' },
    ],
  },
  {
    id: 'close', name: 'Close', category: 'CRM',
    apiBaseUrl: 'https://api.close.com/api/v1', apiDocsUrl: 'https://developer.close.com/',
    authMethods: ['api-key'], authHeader: 'Authorization', authPrefix: 'Basic',
    testEndpoint: '/me/',
    evidenceEndpoints: [
      { type: 'access_control', title: 'Close Users', description: 'Organization user accounts', path: '/user/', method: 'GET' },
      { type: 'asset_inventory', title: 'Close Leads', description: 'CRM lead records', path: '/lead/?_limit=100', method: 'GET' },
      { type: 'audit_log', title: 'Close Activities', description: 'Activity log for CRM actions', path: '/activity/?_limit=100', method: 'GET' },
    ],
  },
  {
    id: 'insightly', name: 'Insightly', category: 'CRM',
    apiBaseUrl: 'https://api.insightly.com/v3.1', apiDocsUrl: 'https://api.insightly.com/v3.1/Help',
    authMethods: ['api-key'], authHeader: 'Authorization', authPrefix: 'Basic',
    testEndpoint: '/Users/Me',
    evidenceEndpoints: [
      { type: 'access_control', title: 'Insightly Users', description: 'User accounts and roles', path: '/Users?top=100', method: 'GET' },
      { type: 'asset_inventory', title: 'Insightly Contacts', description: 'Contact records', path: '/Contacts?top=100', method: 'GET' },
      { type: 'configuration', title: 'Insightly Pipelines', description: 'Pipeline and stage configurations', path: '/Pipelines', method: 'GET' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // COMMUNICATION & EMAIL (10)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'sendgrid', name: 'SendGrid', category: 'Communication',
    apiBaseUrl: 'https://api.sendgrid.com/v3', apiDocsUrl: 'https://docs.sendgrid.com/api-reference/',
    authMethods: ['api-key'], authPrefix: 'Bearer',
    testEndpoint: '/user/profile',
    evidenceEndpoints: [
      { type: 'configuration', title: 'SendGrid Profile', description: 'Account profile and settings', path: '/user/profile', method: 'GET' },
      { type: 'access_control', title: 'SendGrid API Keys', description: 'API key inventory and scopes', path: '/api_keys', method: 'GET' },
      { type: 'access_control', title: 'SendGrid Teammates', description: 'Account teammate access', path: '/teammates?limit=100', method: 'GET' },
      { type: 'audit_log', title: 'SendGrid Activity', description: 'Email activity feed', path: '/messages?limit=100', method: 'GET' },
    ],
  },
  {
    id: 'mailgun', name: 'Mailgun', category: 'Communication',
    apiBaseUrl: 'https://api.mailgun.net/v3', apiDocsUrl: 'https://documentation.mailgun.com/en/latest/api_reference.html',
    authMethods: ['api-key'], authHeader: 'Authorization', authPrefix: 'Basic',
    testEndpoint: '/domains',
    evidenceEndpoints: [
      { type: 'configuration', title: 'Mailgun Domains', description: 'Configured domain inventory', path: '/domains', method: 'GET' },
      { type: 'audit_log', title: 'Mailgun Events', description: 'Email event log', path: '/{domain}/events?limit=100', method: 'GET' },
      { type: 'access_control', title: 'Mailgun IPs', description: 'IP address pool and assignments', path: '/ips', method: 'GET' },
    ],
  },
  {
    id: 'amazon-ses', name: 'Amazon SES', category: 'Communication',
    apiBaseUrl: 'https://email.{region}.amazonaws.com/v2', apiDocsUrl: 'https://docs.aws.amazon.com/ses/latest/APIReference-V2/',
    authMethods: ['iam'], testEndpoint: '/email/account',
    evidenceEndpoints: [
      { type: 'configuration', title: 'SES Account', description: 'SES account sending details', path: '/email/account', method: 'GET' },
      { type: 'asset_inventory', title: 'SES Identities', description: 'Verified identity inventory', path: '/email/identities?PageSize=100', method: 'GET' },
      { type: 'configuration', title: 'SES Config Sets', description: 'Configuration set definitions', path: '/email/configuration-sets?PageSize=100', method: 'GET' },
    ],
  },
  {
    id: 'postmark', name: 'Postmark', category: 'Communication',
    apiBaseUrl: 'https://api.postmarkapp.com', apiDocsUrl: 'https://postmarkapp.com/developer/api/',
    authMethods: ['api-key'], authHeader: 'X-Postmark-Account-Token', authPrefix: '',
    testEndpoint: '/servers?count=1&offset=0',
    evidenceEndpoints: [
      { type: 'configuration', title: 'Postmark Servers', description: 'Server configurations', path: '/servers?count=100&offset=0', method: 'GET' },
      { type: 'audit_log', title: 'Postmark Messages', description: 'Outbound message activity', path: '/messages/outbound?count=100&offset=0', method: 'GET' },
      { type: 'access_control', title: 'Postmark Senders', description: 'Sender signature inventory', path: '/senders?count=100&offset=0', method: 'GET' },
    ],
  },
  {
    id: 'sparkpost', name: 'SparkPost', category: 'Communication',
    apiBaseUrl: 'https://api.sparkpost.com/api/v1', apiDocsUrl: 'https://developers.sparkpost.com/api/',
    authMethods: ['api-key'], authHeader: 'Authorization', authPrefix: '',
    testEndpoint: '/account',
    evidenceEndpoints: [
      { type: 'configuration', title: 'SparkPost Account', description: 'Account configuration details', path: '/account', method: 'GET' },
      { type: 'asset_inventory', title: 'SparkPost Sending Domains', description: 'Configured sending domain inventory', path: '/sending-domains', method: 'GET' },
      { type: 'access_control', title: 'SparkPost API Keys', description: 'API key and grant inventory', path: '/api-keys', method: 'GET' },
    ],
  },
  {
    id: 'twilio', name: 'Twilio', category: 'Communication',
    apiBaseUrl: 'https://api.twilio.com/2010-04-01', apiDocsUrl: 'https://www.twilio.com/docs/usage/api',
    authMethods: ['api-key-secret'], testEndpoint: '/Accounts/{account}.json',
    evidenceEndpoints: [
      { type: 'configuration', title: 'Twilio Account', description: 'Account configuration and status', path: '/Accounts/{account}.json', method: 'GET' },
      { type: 'access_control', title: 'Twilio API Keys', description: 'API key inventory', path: '/Accounts/{account}/Keys.json?PageSize=100', method: 'GET' },
      { type: 'audit_log', title: 'Twilio Usage', description: 'Usage records for audit', path: '/Accounts/{account}/Usage/Records.json', method: 'GET' },
      { type: 'asset_inventory', title: 'Twilio Phone Numbers', description: 'Phone number inventory', path: '/Accounts/{account}/IncomingPhoneNumbers.json?PageSize=100', method: 'GET' },
    ],
  },
  {
    id: 'vonage', name: 'Vonage', category: 'Communication',
    apiBaseUrl: 'https://api.nexmo.com', apiDocsUrl: 'https://developer.vonage.com/api/',
    authMethods: ['api-key-secret'], testEndpoint: '/account/get-balance',
    evidenceEndpoints: [
      { type: 'configuration', title: 'Vonage Account', description: 'Account balance and settings', path: '/account/get-balance', method: 'GET' },
      { type: 'asset_inventory', title: 'Vonage Numbers', description: 'Phone number inventory', path: '/account/numbers?size=100', method: 'GET' },
      { type: 'access_control', title: 'Vonage Subaccounts', description: 'Subaccount inventory', path: 'https://api.nexmo.com/accounts/{account}/subaccounts', method: 'GET' },
    ],
  },
  {
    id: 'ringcentral', name: 'RingCentral', category: 'Communication',
    apiBaseUrl: 'https://platform.ringcentral.com/restapi/v1.0', apiDocsUrl: 'https://developers.ringcentral.com/api-reference',
    authMethods: ['oauth'], authPrefix: 'Bearer',
    testEndpoint: '/account/~',
    evidenceEndpoints: [
      { type: 'configuration', title: 'RC Account', description: 'Account configuration details', path: '/account/~', method: 'GET' },
      { type: 'access_control', title: 'RC Extensions', description: 'User extension inventory', path: '/account/~/extension?perPage=100', method: 'GET' },
      { type: 'audit_log', title: 'RC Call Log', description: 'Call log records for audit', path: '/account/~/call-log?perPage=100', method: 'GET' },
    ],
  },
  {
    id: '8x8', name: '8x8', category: 'Communication',
    apiBaseUrl: 'https://api.8x8.com/analytics/v2', apiDocsUrl: 'https://developer.8x8.com/contactcenter/reference',
    authMethods: ['api-key'], authHeader: 'Authorization', authPrefix: 'Bearer',
    testEndpoint: '/reports',
    evidenceEndpoints: [
      { type: 'configuration', title: '8x8 Reports', description: 'Report configuration inventory', path: '/reports', method: 'GET' },
      { type: 'audit_log', title: '8x8 Call Records', description: 'Call detail records for audit', path: '/calls?pageSize=100', method: 'GET' },
      { type: 'access_control', title: '8x8 Users', description: 'User and extension accounts', path: '/users?pageSize=100', method: 'GET' },
    ],
  },
  {
    id: 'dialpad', name: 'Dialpad', category: 'Communication',
    apiBaseUrl: 'https://dialpad.com/api/v2', apiDocsUrl: 'https://developers.dialpad.com/reference/',
    authMethods: ['oauth', 'api-key'], authPrefix: 'Bearer',
    testEndpoint: '/users/me',
    evidenceEndpoints: [
      { type: 'access_control', title: 'Dialpad Users', description: 'User account inventory', path: '/users?limit=100', method: 'GET' },
      { type: 'audit_log', title: 'Dialpad Call Logs', description: 'Call log records', path: '/stats/calls?limit=100', method: 'GET' },
      { type: 'configuration', title: 'Dialpad Offices', description: 'Office and department configurations', path: '/offices', method: 'GET' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DATABASE & STORAGE (15)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'mongodb-atlas', name: 'MongoDB Atlas', category: 'Database',
    apiBaseUrl: 'https://cloud.mongodb.com/api/atlas/v2', apiDocsUrl: 'https://www.mongodb.com/docs/atlas/reference/api-resources-spec/v2/',
    authMethods: ['api-key-secret'], testEndpoint: '/groups',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'Atlas Projects', description: 'Atlas project inventory', path: '/groups', method: 'GET' },
      { type: 'access_control', title: 'Atlas Users', description: 'Database user accounts', path: '/groups/{account}/databaseUsers', method: 'GET' },
      { type: 'configuration', title: 'Atlas Clusters', description: 'Cluster configurations', path: '/groups/{account}/clusters', method: 'GET' },
      { type: 'audit_log', title: 'Atlas Audit Log', description: 'Project audit log events', path: '/groups/{account}/events', method: 'GET' },
      { type: 'encryption_status', title: 'Atlas Encryption', description: 'Encryption at rest configuration', path: '/groups/{account}/encryptionAtRest', method: 'GET' },
    ],
  },
  {
    id: 'postgresql', name: 'PostgreSQL (Cloud)', category: 'Database',
    apiBaseUrl: 'https://{instance}', apiDocsUrl: 'https://www.postgresql.org/docs/current/sql-commands.html',
    authMethods: ['username-password'], testEndpoint: '/api/v1/databases',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'PostgreSQL Databases', description: 'Database inventory', path: '/api/v1/databases', method: 'GET' },
      { type: 'access_control', title: 'PostgreSQL Roles', description: 'Database role and user accounts', path: '/api/v1/roles', method: 'GET' },
      { type: 'configuration', title: 'PostgreSQL Settings', description: 'Database configuration parameters', path: '/api/v1/settings', method: 'GET' },
    ],
  },
  {
    id: 'mysql', name: 'MySQL (Cloud)', category: 'Database',
    apiBaseUrl: 'https://{instance}', apiDocsUrl: 'https://dev.mysql.com/doc/refman/8.0/en/',
    authMethods: ['username-password'], testEndpoint: '/api/v1/databases',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'MySQL Databases', description: 'Database inventory', path: '/api/v1/databases', method: 'GET' },
      { type: 'access_control', title: 'MySQL Users', description: 'Database user accounts and grants', path: '/api/v1/users', method: 'GET' },
      { type: 'configuration', title: 'MySQL Variables', description: 'System variable configurations', path: '/api/v1/variables', method: 'GET' },
    ],
  },
  {
    id: 'redis', name: 'Redis Cloud', category: 'Database',
    apiBaseUrl: 'https://api.redislabs.com/v1', apiDocsUrl: 'https://api.redislabs.com/v1/swagger-ui.html',
    authMethods: ['api-key'], authHeader: 'x-api-key', authPrefix: '',
    testEndpoint: '/subscriptions',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'Redis Subscriptions', description: 'Subscription inventory', path: '/subscriptions', method: 'GET' },
      { type: 'configuration', title: 'Redis Databases', description: 'Database configurations', path: '/subscriptions/{account}/databases', method: 'GET' },
      { type: 'access_control', title: 'Redis ACLs', description: 'Access control list configurations', path: '/subscriptions/{account}/databases/{db}/acl', method: 'GET' },
    ],
  },
  {
    id: 'amazon-rds', name: 'Amazon RDS', category: 'Database',
    apiBaseUrl: 'https://rds.{region}.amazonaws.com', apiDocsUrl: 'https://docs.aws.amazon.com/AmazonRDS/latest/APIReference/',
    authMethods: ['iam'], testEndpoint: '/?Action=DescribeDBInstances&MaxRecords=20',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'RDS Instances', description: 'Database instance inventory', path: '/?Action=DescribeDBInstances', method: 'GET' },
      { type: 'configuration', title: 'RDS Parameter Groups', description: 'Database parameter group configurations', path: '/?Action=DescribeDBParameterGroups', method: 'GET' },
      { type: 'encryption_status', title: 'RDS Encryption', description: 'Instance encryption status', path: '/?Action=DescribeDBInstances', method: 'GET' },
      { type: 'backup_status', title: 'RDS Snapshots', description: 'Automated backup snapshot inventory', path: '/?Action=DescribeDBSnapshots', method: 'GET' },
    ],
  },
  {
    id: 'amazon-dynamodb', name: 'Amazon DynamoDB', category: 'Database',
    apiBaseUrl: 'https://dynamodb.{region}.amazonaws.com', apiDocsUrl: 'https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/',
    authMethods: ['iam'], testEndpoint: '/',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'DynamoDB Tables', description: 'Table inventory', path: '/', method: 'POST', params: { Action: 'ListTables', Limit: 100 } },
      { type: 'configuration', title: 'DynamoDB Table Details', description: 'Table configuration and throughput', path: '/', method: 'POST', params: { Action: 'DescribeTable' } },
      { type: 'encryption_status', title: 'DynamoDB Encryption', description: 'Table encryption settings', path: '/', method: 'POST', params: { Action: 'DescribeTable' } },
      { type: 'backup_status', title: 'DynamoDB Backups', description: 'Table backup inventory', path: '/', method: 'POST', params: { Action: 'ListBackups' } },
    ],
  },
  {
    id: 'azure-sql', name: 'Azure SQL Database', category: 'Database',
    apiBaseUrl: 'https://management.azure.com', apiDocsUrl: 'https://learn.microsoft.com/en-us/rest/api/sql/',
    authMethods: ['oauth'], authPrefix: 'Bearer',
    testEndpoint: '/subscriptions/{account}/providers/Microsoft.Sql/servers?api-version=2023-05-01-preview',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'Azure SQL Servers', description: 'SQL server inventory', path: '/subscriptions/{account}/providers/Microsoft.Sql/servers?api-version=2023-05-01-preview', method: 'GET' },
      { type: 'configuration', title: 'Azure SQL Databases', description: 'Database configurations', path: '/subscriptions/{account}/providers/Microsoft.Sql/servers/{instance}/databases?api-version=2023-05-01-preview', method: 'GET' },
      { type: 'encryption_status', title: 'Azure SQL TDE', description: 'Transparent data encryption status', path: '/subscriptions/{account}/providers/Microsoft.Sql/servers/{instance}/databases/{db}/transparentDataEncryption?api-version=2023-05-01-preview', method: 'GET' },
      { type: 'audit_log', title: 'Azure SQL Auditing', description: 'Server auditing policy configuration', path: '/subscriptions/{account}/providers/Microsoft.Sql/servers/{instance}/auditingSettings/default?api-version=2023-05-01-preview', method: 'GET' },
    ],
  },
  {
    id: 'google-cloud-sql', name: 'Google Cloud SQL', category: 'Database',
    apiBaseUrl: 'https://sqladmin.googleapis.com/v1', apiDocsUrl: 'https://cloud.google.com/sql/docs/mysql/admin-api/rest/',
    authMethods: ['service-account', 'oauth'], authPrefix: 'Bearer',
    testEndpoint: '/projects/{account}/instances',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'Cloud SQL Instances', description: 'Database instance inventory', path: '/projects/{account}/instances', method: 'GET' },
      { type: 'configuration', title: 'Cloud SQL Settings', description: 'Instance configuration details', path: '/projects/{account}/instances/{instance}', method: 'GET' },
      { type: 'backup_status', title: 'Cloud SQL Backups', description: 'Backup run inventory', path: '/projects/{account}/instances/{instance}/backupRuns', method: 'GET' },
      { type: 'access_control', title: 'Cloud SQL Users', description: 'Database user accounts', path: '/projects/{account}/instances/{instance}/users', method: 'GET' },
    ],
  },
  {
    id: 'snowflake', name: 'Snowflake', category: 'Database',
    apiBaseUrl: 'https://{account}.snowflakecomputing.com/api/v2', apiDocsUrl: 'https://docs.snowflake.com/en/developer-guide/sql-api/',
    authMethods: ['api-key', 'oauth'], authPrefix: 'Bearer',
    testEndpoint: '/statements',
    evidenceEndpoints: [
      { type: 'access_control', title: 'Snowflake Users', description: 'User accounts and roles', path: '/statements', method: 'POST', params: { statement: 'SHOW USERS;', timeout: 60 } },
      { type: 'configuration', title: 'Snowflake Warehouses', description: 'Warehouse configurations', path: '/statements', method: 'POST', params: { statement: 'SHOW WAREHOUSES;', timeout: 60 } },
      { type: 'audit_log', title: 'Snowflake Login History', description: 'Login history audit records', path: '/statements', method: 'POST', params: { statement: 'SELECT * FROM SNOWFLAKE.ACCOUNT_USAGE.LOGIN_HISTORY ORDER BY EVENT_TIMESTAMP DESC LIMIT 100;', timeout: 60 } },
      { type: 'access_control', title: 'Snowflake Grants', description: 'Role grant configurations', path: '/statements', method: 'POST', params: { statement: 'SHOW GRANTS;', timeout: 60 } },
    ],
  },
  {
    id: 'databricks', name: 'Databricks', category: 'Database',
    apiBaseUrl: 'https://{instance}.cloud.databricks.com/api/2.0', apiDocsUrl: 'https://docs.databricks.com/api/workspace/',
    authMethods: ['api-key', 'pat'], authPrefix: 'Bearer',
    testEndpoint: '/clusters/list',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'Databricks Clusters', description: 'Compute cluster inventory', path: '/clusters/list', method: 'GET' },
      { type: 'access_control', title: 'Databricks Users', description: 'Workspace user accounts', path: '/preview/scim/v2/Users', method: 'GET' },
      { type: 'configuration', title: 'Databricks Workspaces', description: 'Workspace configurations', path: '/workspace/list?path=/', method: 'GET' },
      { type: 'access_control', title: 'Databricks Groups', description: 'Security group configurations', path: '/preview/scim/v2/Groups', method: 'GET' },
    ],
  },
  {
    id: 'amazon-s3', name: 'Amazon S3', category: 'Database',
    apiBaseUrl: 'https://s3.amazonaws.com', apiDocsUrl: 'https://docs.aws.amazon.com/AmazonS3/latest/API/',
    authMethods: ['iam'], testEndpoint: '/',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'S3 Buckets', description: 'S3 bucket inventory', path: '/', method: 'GET' },
      { type: 'encryption_status', title: 'S3 Encryption', description: 'Bucket encryption configuration', path: '/{account}?encryption', method: 'GET' },
      { type: 'access_control', title: 'S3 Bucket Policy', description: 'Bucket access policy', path: '/{account}?policy', method: 'GET' },
      { type: 'configuration', title: 'S3 Public Access Block', description: 'Public access block settings', path: '/{account}?publicAccessBlock', method: 'GET' },
    ],
  },
  {
    id: 'azure-blob-storage', name: 'Azure Blob Storage', category: 'Database',
    apiBaseUrl: 'https://management.azure.com', apiDocsUrl: 'https://learn.microsoft.com/en-us/rest/api/storagerp/',
    authMethods: ['oauth'], authPrefix: 'Bearer',
    testEndpoint: '/subscriptions/{account}/providers/Microsoft.Storage/storageAccounts?api-version=2023-01-01',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'Azure Storage Accounts', description: 'Storage account inventory', path: '/subscriptions/{account}/providers/Microsoft.Storage/storageAccounts?api-version=2023-01-01', method: 'GET' },
      { type: 'encryption_status', title: 'Azure Storage Encryption', description: 'Storage account encryption settings', path: '/subscriptions/{account}/resourceGroups/{tenant}/providers/Microsoft.Storage/storageAccounts/{instance}?api-version=2023-01-01', method: 'GET' },
      { type: 'access_control', title: 'Azure Storage Access Keys', description: 'Storage access key inventory', path: '/subscriptions/{account}/resourceGroups/{tenant}/providers/Microsoft.Storage/storageAccounts/{instance}/listKeys?api-version=2023-01-01', method: 'POST' },
    ],
  },
  {
    id: 'google-cloud-storage', name: 'Google Cloud Storage', category: 'Database',
    apiBaseUrl: 'https://storage.googleapis.com/storage/v1', apiDocsUrl: 'https://cloud.google.com/storage/docs/json_api/v1',
    authMethods: ['service-account', 'oauth'], authPrefix: 'Bearer',
    testEndpoint: '/b?project={account}',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'GCS Buckets', description: 'Storage bucket inventory', path: '/b?project={account}', method: 'GET' },
      { type: 'access_control', title: 'GCS IAM Policies', description: 'Bucket IAM policy bindings', path: '/b/{bucket}/iam', method: 'GET' },
      { type: 'encryption_status', title: 'GCS Bucket Config', description: 'Bucket encryption and retention configuration', path: '/b/{bucket}?projection=full', method: 'GET' },
    ],
  },
  {
    id: 'minio', name: 'MinIO', category: 'Database',
    apiBaseUrl: 'https://{instance}', apiDocsUrl: 'https://min.io/docs/minio/linux/developers/minio-drivers.html',
    authMethods: ['api-key-secret'], testEndpoint: '/minio/health/live',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'MinIO Buckets', description: 'Storage bucket inventory', path: '/minio/api/v1/buckets', method: 'GET' },
      { type: 'access_control', title: 'MinIO Users', description: 'IAM user accounts', path: '/minio/api/v1/users', method: 'GET' },
      { type: 'configuration', title: 'MinIO Config', description: 'Server configuration settings', path: '/minio/api/v1/configs', method: 'GET' },
    ],
  },
  {
    id: 'backblaze-b2', name: 'Backblaze B2', category: 'Database',
    apiBaseUrl: 'https://api.backblazeb2.com/b2api/v3', apiDocsUrl: 'https://www.backblaze.com/apidocs/',
    authMethods: ['api-key'], testEndpoint: '/b2_authorize_account',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'B2 Buckets', description: 'Storage bucket inventory', path: '/b2_list_buckets', method: 'POST', params: { accountId: '{account}' } },
      { type: 'access_control', title: 'B2 Keys', description: 'Application key inventory', path: '/b2_list_keys', method: 'POST', params: { accountId: '{account}' } },
      { type: 'configuration', title: 'B2 Capabilities', description: 'Account capabilities and limits', path: '/b2_authorize_account', method: 'GET' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NETWORK & INFRASTRUCTURE (20)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'cloudflare-network', name: 'Cloudflare Network Services', category: 'Network',
    apiBaseUrl: 'https://api.cloudflare.com/client/v4', apiDocsUrl: 'https://developers.cloudflare.com/api/',
    authMethods: ['api-key', 'pat'], testEndpoint: '/user',
    evidenceEndpoints: [
      { type: 'network_config', title: 'CF Network Zones', description: 'Network zone configurations', path: '/zones?per_page=100', method: 'GET' },
      { type: 'configuration', title: 'CF DNS Records', description: 'DNS record inventory', path: '/zones/{account}/dns_records?per_page=100', method: 'GET' },
      { type: 'security_finding', title: 'CF Firewall Rules', description: 'Firewall rule configurations', path: '/zones/{account}/firewall/rules?per_page=100', method: 'GET' },
    ],
  },
  {
    id: 'akamai', name: 'Akamai', category: 'Network',
    apiBaseUrl: 'https://{instance}.luna.akamaiapis.net', apiDocsUrl: 'https://techdocs.akamai.com/developer/docs/set-up-authentication-credentials',
    authMethods: ['api-key'], testEndpoint: '/papi/v1/contracts',
    evidenceEndpoints: [
      { type: 'network_config', title: 'Akamai Properties', description: 'CDN property configurations', path: '/papi/v1/properties?contractId={account}', method: 'GET' },
      { type: 'configuration', title: 'Akamai Certificates', description: 'SSL certificate inventory', path: '/cps/v2/enrollments', method: 'GET' },
      { type: 'security_finding', title: 'Akamai WAF', description: 'Web Application Firewall configurations', path: '/appsec/v1/configs', method: 'GET' },
    ],
  },
  {
    id: 'aws-vpc', name: 'AWS VPC', category: 'Network',
    apiBaseUrl: 'https://ec2.{region}.amazonaws.com', apiDocsUrl: 'https://docs.aws.amazon.com/AWSEC2/latest/APIReference/',
    authMethods: ['iam'], testEndpoint: '/?Action=DescribeVpcs',
    evidenceEndpoints: [
      { type: 'network_config', title: 'AWS VPCs', description: 'VPC network configurations', path: '/?Action=DescribeVpcs', method: 'GET' },
      { type: 'network_config', title: 'AWS Security Groups', description: 'Security group firewall rules', path: '/?Action=DescribeSecurityGroups', method: 'GET' },
      { type: 'network_config', title: 'AWS Subnets', description: 'Subnet configurations', path: '/?Action=DescribeSubnets', method: 'GET' },
      { type: 'configuration', title: 'AWS NACLs', description: 'Network ACL configurations', path: '/?Action=DescribeNetworkAcls', method: 'GET' },
    ],
  },
  {
    id: 'azure-virtual-network', name: 'Azure Virtual Network', category: 'Network',
    apiBaseUrl: 'https://management.azure.com', apiDocsUrl: 'https://learn.microsoft.com/en-us/rest/api/virtualnetwork/',
    authMethods: ['oauth'], authPrefix: 'Bearer',
    testEndpoint: '/subscriptions/{account}/providers/Microsoft.Network/virtualNetworks?api-version=2023-09-01',
    evidenceEndpoints: [
      { type: 'network_config', title: 'Azure VNets', description: 'Virtual network configurations', path: '/subscriptions/{account}/providers/Microsoft.Network/virtualNetworks?api-version=2023-09-01', method: 'GET' },
      { type: 'network_config', title: 'Azure NSGs', description: 'Network security group rules', path: '/subscriptions/{account}/providers/Microsoft.Network/networkSecurityGroups?api-version=2023-09-01', method: 'GET' },
      { type: 'configuration', title: 'Azure Route Tables', description: 'Route table configurations', path: '/subscriptions/{account}/providers/Microsoft.Network/routeTables?api-version=2023-09-01', method: 'GET' },
    ],
  },
  {
    id: 'palo-alto-prisma', name: 'Palo Alto Prisma Access', category: 'Network',
    apiBaseUrl: 'https://api.sase.paloaltonetworks.com', apiDocsUrl: 'https://pan.dev/sase/',
    authMethods: ['oauth'], authPrefix: 'Bearer',
    testEndpoint: '/sse/config/v1/mobile-users',
    evidenceEndpoints: [
      { type: 'network_config', title: 'Prisma Access Config', description: 'Remote access configurations', path: '/sse/config/v1/mobile-users?limit=100', method: 'GET' },
      { type: 'security_finding', title: 'Prisma Security Policies', description: 'Security policy rules', path: '/sse/config/v1/security-rules?limit=100', method: 'GET' },
      { type: 'configuration', title: 'Prisma Service Connections', description: 'Service connection configurations', path: '/sse/config/v1/service-connections', method: 'GET' },
    ],
  },
  {
    id: 'zscaler', name: 'Zscaler', category: 'Network',
    apiBaseUrl: 'https://zsapi.{cloud}.net/api/v1', apiDocsUrl: 'https://help.zscaler.com/zia/api',
    authMethods: ['api-key', 'username-password'], testEndpoint: '/status',
    evidenceEndpoints: [
      { type: 'network_config', title: 'Zscaler URL Policies', description: 'URL filtering policy configurations', path: '/urlFilteringRules', method: 'GET' },
      { type: 'security_finding', title: 'Zscaler Firewall Rules', description: 'Cloud firewall rule configurations', path: '/firewallRules', method: 'GET' },
      { type: 'access_control', title: 'Zscaler Users', description: 'User accounts and access policies', path: '/users?pageSize=100', method: 'GET' },
      { type: 'configuration', title: 'Zscaler DLP Policies', description: 'Data loss prevention policies', path: '/dlpDictionaries', method: 'GET' },
    ],
  },
  {
    id: 'netskope', name: 'Netskope', category: 'Network',
    apiBaseUrl: 'https://{tenant}.goskope.com/api/v2', apiDocsUrl: 'https://docs.netskope.com/en/rest-api-v2-overview.html',
    authMethods: ['api-key'], authHeader: 'Netskope-Api-Token', authPrefix: '',
    testEndpoint: '/events/data/application?limit=1',
    evidenceEndpoints: [
      { type: 'security_finding', title: 'Netskope Alerts', description: 'Security alert events', path: '/events/data/alert?limit=100', method: 'GET' },
      { type: 'network_config', title: 'Netskope Policies', description: 'Real-time protection policies', path: '/policy', method: 'GET' },
      { type: 'audit_log', title: 'Netskope Audit Events', description: 'Admin audit events', path: '/events/data/audit?limit=100', method: 'GET' },
    ],
  },
  {
    id: 'cisco-umbrella', name: 'Cisco Umbrella', category: 'Network',
    apiBaseUrl: 'https://api.umbrella.com', apiDocsUrl: 'https://developer.cisco.com/docs/cloud-security/',
    authMethods: ['api-key', 'oauth'], authPrefix: 'Bearer',
    testEndpoint: '/v2/organizations',
    evidenceEndpoints: [
      { type: 'network_config', title: 'Umbrella Policies', description: 'DNS and web security policies', path: '/v2/organizations/{org}/destinationlists', method: 'GET' },
      { type: 'security_finding', title: 'Umbrella Security Events', description: 'Security activity events', path: '/v2/organizations/{org}/security-activity?limit=100', method: 'GET' },
      { type: 'configuration', title: 'Umbrella Networks', description: 'Network and site configurations', path: '/v2/organizations/{org}/networks', method: 'GET' },
    ],
  },
  {
    id: 'f5-networks', name: 'F5 BIG-IP', category: 'Network',
    apiBaseUrl: 'https://{instance}/mgmt/tm', apiDocsUrl: 'https://clouddocs.f5.com/api/icontrol-rest/',
    authMethods: ['username-password', 'api-key'], testEndpoint: '/sys/version',
    evidenceEndpoints: [
      { type: 'configuration', title: 'F5 System Version', description: 'System version and configuration', path: '/sys/version', method: 'GET' },
      { type: 'network_config', title: 'F5 Virtual Servers', description: 'Virtual server configurations', path: '/ltm/virtual', method: 'GET' },
      { type: 'security_finding', title: 'F5 Firewall Policies', description: 'AFM firewall policy rules', path: '/security/firewall/policy', method: 'GET' },
    ],
  },
  {
    id: 'fortinet-fortigate', name: 'Fortinet FortiGate Network', category: 'Network',
    apiBaseUrl: 'https://{instance}/api/v2', apiDocsUrl: 'https://docs.fortinet.com/document/fortigate/',
    authMethods: ['api-key'], authHeader: 'Authorization', authPrefix: 'Bearer',
    testEndpoint: '/cmdb/system/status',
    evidenceEndpoints: [
      { type: 'network_config', title: 'FortiGate Interfaces', description: 'Network interface configurations', path: '/cmdb/system/interface', method: 'GET' },
      { type: 'security_finding', title: 'FortiGate Firewall Policies', description: 'Firewall policy rules', path: '/cmdb/firewall/policy', method: 'GET' },
      { type: 'configuration', title: 'FortiGate VPN', description: 'VPN tunnel configurations', path: '/cmdb/vpn.ipsec/phase1-interface', method: 'GET' },
    ],
  },
  {
    id: 'wireguard', name: 'WireGuard', category: 'Network',
    apiBaseUrl: 'https://{instance}/api/v1', apiDocsUrl: 'https://www.wireguard.com/',
    authMethods: ['api-key'], testEndpoint: '/status',
    evidenceEndpoints: [
      { type: 'network_config', title: 'WireGuard Peers', description: 'VPN peer configurations', path: '/peers', method: 'GET' },
      { type: 'configuration', title: 'WireGuard Interfaces', description: 'Interface configurations', path: '/interfaces', method: 'GET' },
      { type: 'access_control', title: 'WireGuard Keys', description: 'Public key inventory', path: '/keys', method: 'GET' },
    ],
  },
  {
    id: 'openvpn', name: 'OpenVPN Access Server', category: 'Network',
    apiBaseUrl: 'https://{instance}/api', apiDocsUrl: 'https://openvpn.net/access-server-manual/rest-api/',
    authMethods: ['username-password', 'api-key'], testEndpoint: '/status',
    evidenceEndpoints: [
      { type: 'network_config', title: 'OpenVPN Config', description: 'VPN server configuration', path: '/config', method: 'GET' },
      { type: 'access_control', title: 'OpenVPN Users', description: 'VPN user accounts', path: '/users', method: 'GET' },
      { type: 'audit_log', title: 'OpenVPN Sessions', description: 'Active and historical VPN sessions', path: '/sessions', method: 'GET' },
    ],
  },
  {
    id: 'tailscale', name: 'Tailscale', category: 'Network',
    apiBaseUrl: 'https://api.tailscale.com/api/v2', apiDocsUrl: 'https://tailscale.com/api',
    authMethods: ['api-key'], authPrefix: 'Bearer',
    testEndpoint: '/tailnet/{account}/devices',
    evidenceEndpoints: [
      { type: 'network_config', title: 'Tailscale Devices', description: 'Connected device inventory', path: '/tailnet/{account}/devices', method: 'GET' },
      { type: 'access_control', title: 'Tailscale ACLs', description: 'Access control list configurations', path: '/tailnet/{account}/acl', method: 'GET' },
      { type: 'configuration', title: 'Tailscale DNS', description: 'DNS nameserver configurations', path: '/tailnet/{account}/dns/nameservers', method: 'GET' },
      { type: 'access_control', title: 'Tailscale Keys', description: 'Auth key inventory', path: '/tailnet/{account}/keys', method: 'GET' },
    ],
  },
  {
    id: 'perimeter-81', name: 'Perimeter 81', category: 'Network',
    apiBaseUrl: 'https://api.perimeter81.com/api/v1', apiDocsUrl: 'https://support.perimeter81.com/docs/api-reference',
    authMethods: ['api-key'], authPrefix: 'Bearer',
    testEndpoint: '/networks',
    evidenceEndpoints: [
      { type: 'network_config', title: 'P81 Networks', description: 'Network configurations', path: '/networks', method: 'GET' },
      { type: 'access_control', title: 'P81 Members', description: 'Network member accounts', path: '/members', method: 'GET' },
      { type: 'configuration', title: 'P81 Tunnels', description: 'VPN tunnel configurations', path: '/tunnels', method: 'GET' },
    ],
  },
  {
    id: 'nordlayer', name: 'NordLayer', category: 'Network',
    apiBaseUrl: 'https://api.nordlayer.com/v1', apiDocsUrl: 'https://nordlayer.com/docs/api/',
    authMethods: ['api-key'], authPrefix: 'Bearer',
    testEndpoint: '/organizations',
    evidenceEndpoints: [
      { type: 'network_config', title: 'NordLayer Gateways', description: 'VPN gateway configurations', path: '/gateways', method: 'GET' },
      { type: 'access_control', title: 'NordLayer Members', description: 'Organization members', path: '/members', method: 'GET' },
      { type: 'configuration', title: 'NordLayer Teams', description: 'Team access configurations', path: '/teams', method: 'GET' },
    ],
  },
  {
    id: 'cloudflare-access', name: 'Cloudflare Access', category: 'Network',
    apiBaseUrl: 'https://api.cloudflare.com/client/v4', apiDocsUrl: 'https://developers.cloudflare.com/cloudflare-one/api-terraform/',
    authMethods: ['api-key', 'pat'], testEndpoint: '/user',
    evidenceEndpoints: [
      { type: 'access_control', title: 'CF Access Policies', description: 'Zero Trust access policies', path: '/accounts/{account}/access/apps?per_page=100', method: 'GET' },
      { type: 'configuration', title: 'CF Access Groups', description: 'Access group configurations', path: '/accounts/{account}/access/groups?per_page=100', method: 'GET' },
      { type: 'audit_log', title: 'CF Access Logs', description: 'Access authentication log events', path: '/accounts/{account}/access/logs/access_requests?per_page=100', method: 'GET' },
    ],
  },
  {
    id: 'cloudflare-warp', name: 'Cloudflare WARP', category: 'Network',
    apiBaseUrl: 'https://api.cloudflare.com/client/v4', apiDocsUrl: 'https://developers.cloudflare.com/cloudflare-one/',
    authMethods: ['api-key', 'pat'], testEndpoint: '/user',
    evidenceEndpoints: [
      { type: 'device_inventory', title: 'CF WARP Devices', description: 'WARP client device inventory', path: '/accounts/{account}/devices?per_page=100', method: 'GET' },
      { type: 'configuration', title: 'CF WARP Policies', description: 'Device enrollment policies', path: '/accounts/{account}/devices/policies', method: 'GET' },
      { type: 'network_config', title: 'CF WARP Settings', description: 'WARP client settings configurations', path: '/accounts/{account}/devices/settings', method: 'GET' },
    ],
  },
  {
    id: 'twingate', name: 'Twingate', category: 'Network',
    apiBaseUrl: 'https://{account}.twingate.com/api/graphql', apiDocsUrl: 'https://docs.twingate.com/docs/api-overview',
    authMethods: ['api-key'], authHeader: 'X-API-KEY', authPrefix: '',
    testEndpoint: '',
    evidenceEndpoints: [
      { type: 'network_config', title: 'Twingate Resources', description: 'Protected resource inventory', path: '', method: 'POST', params: { query: '{ resources(first: 100) { edges { node { id name address { value } } } } }' } },
      { type: 'access_control', title: 'Twingate Users', description: 'User accounts and access', path: '', method: 'POST', params: { query: '{ users(first: 100) { edges { node { id email role state } } } }' } },
      { type: 'configuration', title: 'Twingate Networks', description: 'Remote network configurations', path: '', method: 'POST', params: { query: '{ remoteNetworks(first: 100) { edges { node { id name } } } }' } },
    ],
  },
  {
    id: 'banyan-security', name: 'Banyan Security', category: 'Network',
    apiBaseUrl: 'https://net.banyanops.com/api/v1', apiDocsUrl: 'https://docs.banyansecurity.io/docs/api/',
    authMethods: ['api-key'], authPrefix: 'Bearer',
    testEndpoint: '/security_policies',
    evidenceEndpoints: [
      { type: 'access_control', title: 'Banyan Policies', description: 'Zero Trust security policies', path: '/security_policies', method: 'GET' },
      { type: 'network_config', title: 'Banyan Services', description: 'Published service configurations', path: '/registered_services', method: 'GET' },
      { type: 'configuration', title: 'Banyan Roles', description: 'Role definitions and assignments', path: '/security_roles', method: 'GET' },
    ],
  },
  {
    id: 'aws-transit-gateway', name: 'AWS Transit Gateway', category: 'Network',
    apiBaseUrl: 'https://ec2.{region}.amazonaws.com', apiDocsUrl: 'https://docs.aws.amazon.com/AWSEC2/latest/APIReference/',
    authMethods: ['iam'], testEndpoint: '/?Action=DescribeTransitGateways',
    evidenceEndpoints: [
      { type: 'network_config', title: 'Transit Gateways', description: 'Transit gateway configurations', path: '/?Action=DescribeTransitGateways', method: 'GET' },
      { type: 'network_config', title: 'TGW Route Tables', description: 'Transit gateway route table configurations', path: '/?Action=DescribeTransitGatewayRouteTables', method: 'GET' },
      { type: 'configuration', title: 'TGW Attachments', description: 'Transit gateway VPC attachments', path: '/?Action=DescribeTransitGatewayAttachments', method: 'GET' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BACKUP & RECOVERY (10)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'veeam', name: 'Veeam', category: 'Backup',
    apiBaseUrl: 'https://{instance}:9419/api/v1', apiDocsUrl: 'https://helpcenter.veeam.com/docs/backup/vbr_rest/',
    authMethods: ['username-password', 'api-key'], authPrefix: 'Bearer',
    testEndpoint: '/serverInfo',
    evidenceEndpoints: [
      { type: 'backup_status', title: 'Veeam Backup Jobs', description: 'Backup job configurations and status', path: '/jobs', method: 'GET' },
      { type: 'backup_status', title: 'Veeam Sessions', description: 'Backup session history', path: '/sessions?limit=100', method: 'GET' },
      { type: 'asset_inventory', title: 'Veeam Repositories', description: 'Backup repository inventory', path: '/backupInfrastructure/repositories', method: 'GET' },
      { type: 'configuration', title: 'Veeam Managed Servers', description: 'Protected server inventory', path: '/backupInfrastructure/managedServers', method: 'GET' },
    ],
  },
  {
    id: 'acronis', name: 'Acronis Cyber Protect', category: 'Backup',
    apiBaseUrl: 'https://cloud.acronis.com/api', apiDocsUrl: 'https://developer.acronis.com/doc/',
    authMethods: ['oauth', 'api-key'], authPrefix: 'Bearer',
    testEndpoint: '/2/tenants',
    evidenceEndpoints: [
      { type: 'backup_status', title: 'Acronis Activities', description: 'Backup activity and status', path: '/2/activities?limit=100', method: 'GET' },
      { type: 'asset_inventory', title: 'Acronis Resources', description: 'Protected resource inventory', path: '/2/resources?limit=100', method: 'GET' },
      { type: 'configuration', title: 'Acronis Plans', description: 'Protection plan configurations', path: '/2/plans?limit=100', method: 'GET' },
    ],
  },
  {
    id: 'druva', name: 'Druva', category: 'Backup',
    apiBaseUrl: 'https://apis.druva.com', apiDocsUrl: 'https://developer.druva.com/',
    authMethods: ['oauth'], authPrefix: 'Bearer',
    testEndpoint: '/insync/endpoints/v1/storage',
    evidenceEndpoints: [
      { type: 'backup_status', title: 'Druva Backup Sets', description: 'Backup set configurations and status', path: '/insync/endpoints/v1/backupsets', method: 'GET' },
      { type: 'asset_inventory', title: 'Druva Devices', description: 'Protected device inventory', path: '/insync/endpoints/v1/devices', method: 'GET' },
      { type: 'configuration', title: 'Druva Storage', description: 'Storage usage and configuration', path: '/insync/endpoints/v1/storage', method: 'GET' },
    ],
  },
  {
    id: 'commvault', name: 'Commvault', category: 'Backup',
    apiBaseUrl: 'https://{instance}/commandcenter/api', apiDocsUrl: 'https://documentation.commvault.com/v11/rest-api/',
    authMethods: ['username-password', 'api-key'], authPrefix: 'Bearer',
    testEndpoint: '/CommServ',
    evidenceEndpoints: [
      { type: 'backup_status', title: 'Commvault Jobs', description: 'Backup job status and history', path: '/Job?limit=100', method: 'GET' },
      { type: 'asset_inventory', title: 'Commvault Clients', description: 'Protected client inventory', path: '/Client', method: 'GET' },
      { type: 'configuration', title: 'Commvault Storage Policies', description: 'Storage policy configurations', path: '/StoragePolicy', method: 'GET' },
    ],
  },
  {
    id: 'rubrik', name: 'Rubrik', category: 'Backup',
    apiBaseUrl: 'https://{instance}/api', apiDocsUrl: 'https://www.rubrik.com/resources/api-integration',
    authMethods: ['api-key', 'username-password'], authPrefix: 'Bearer',
    testEndpoint: '/v1/cluster/me',
    evidenceEndpoints: [
      { type: 'backup_status', title: 'Rubrik SLA Compliance', description: 'SLA domain compliance summary', path: '/v1/report/compliance_summary', method: 'GET' },
      { type: 'asset_inventory', title: 'Rubrik VMs', description: 'Protected virtual machine inventory', path: '/v1/vmware/vm?limit=100', method: 'GET' },
      { type: 'configuration', title: 'Rubrik SLA Domains', description: 'SLA domain policy configurations', path: '/v2/sla_domain', method: 'GET' },
      { type: 'audit_log', title: 'Rubrik Events', description: 'Event audit log', path: '/v1/event?limit=100', method: 'GET' },
    ],
  },
  {
    id: 'cohesity', name: 'Cohesity', category: 'Backup',
    apiBaseUrl: 'https://{instance}/irisservices/api/v2', apiDocsUrl: 'https://developer.cohesity.com/',
    authMethods: ['api-key', 'username-password'], authPrefix: 'Bearer',
    testEndpoint: '/clusters',
    evidenceEndpoints: [
      { type: 'backup_status', title: 'Cohesity Protection Runs', description: 'Protection run status and history', path: '/data-protect/runs?numRuns=100', method: 'GET' },
      { type: 'asset_inventory', title: 'Cohesity Sources', description: 'Protected source inventory', path: '/data-protect/sources', method: 'GET' },
      { type: 'configuration', title: 'Cohesity Policies', description: 'Protection policy configurations', path: '/data-protect/policies', method: 'GET' },
    ],
  },
  {
    id: 'barracuda-backup', name: 'Barracuda Backup', category: 'Backup',
    apiBaseUrl: 'https://api.barracuda.com/v1', apiDocsUrl: 'https://campus.barracuda.com/product/backup/api/',
    authMethods: ['api-key'], authPrefix: 'Bearer',
    testEndpoint: '/accounts',
    evidenceEndpoints: [
      { type: 'backup_status', title: 'Barracuda Backup Status', description: 'Backup job status', path: '/backup/status', method: 'GET' },
      { type: 'asset_inventory', title: 'Barracuda Appliances', description: 'Backup appliance inventory', path: '/appliances', method: 'GET' },
      { type: 'configuration', title: 'Barracuda Schedules', description: 'Backup schedule configurations', path: '/backup/schedules', method: 'GET' },
    ],
  },
  {
    id: 'datto', name: 'Datto', category: 'Backup',
    apiBaseUrl: 'https://api.datto.com/v1', apiDocsUrl: 'https://portal.dattobackup.com/integrations/api',
    authMethods: ['api-key'], authHeader: 'Authorization', authPrefix: 'Bearer',
    testEndpoint: '/bcdr/device',
    evidenceEndpoints: [
      { type: 'backup_status', title: 'Datto BCDR Alerts', description: 'Backup device alerts and status', path: '/bcdr/device?_page=1', method: 'GET' },
      { type: 'asset_inventory', title: 'Datto Devices', description: 'Protected device inventory', path: '/bcdr/device?_page=1', method: 'GET' },
      { type: 'configuration', title: 'Datto Agents', description: 'Backup agent inventory', path: '/bcdr/device/{account}/asset', method: 'GET' },
    ],
  },
  {
    id: 'carbonite', name: 'Carbonite', category: 'Backup',
    apiBaseUrl: 'https://api.carbonite.com/v1', apiDocsUrl: 'https://www.carbonite.com/backup-software/business-backup/',
    authMethods: ['api-key', 'oauth'], authPrefix: 'Bearer',
    testEndpoint: '/accounts',
    evidenceEndpoints: [
      { type: 'backup_status', title: 'Carbonite Backup Status', description: 'Computer backup status summary', path: '/computers?limit=100', method: 'GET' },
      { type: 'asset_inventory', title: 'Carbonite Computers', description: 'Protected computer inventory', path: '/computers?limit=100', method: 'GET' },
      { type: 'configuration', title: 'Carbonite Policies', description: 'Backup policy configurations', path: '/policies', method: 'GET' },
    ],
  },
  {
    id: 'aws-backup', name: 'AWS Backup', category: 'Backup',
    apiBaseUrl: 'https://backup.{region}.amazonaws.com', apiDocsUrl: 'https://docs.aws.amazon.com/aws-backup/latest/devguide/API_Reference.html',
    authMethods: ['iam'], testEndpoint: '/backup-vaults/',
    evidenceEndpoints: [
      { type: 'backup_status', title: 'AWS Backup Jobs', description: 'Backup job status and history', path: '/backup-jobs/', method: 'GET' },
      { type: 'asset_inventory', title: 'AWS Backup Vaults', description: 'Backup vault inventory', path: '/backup-vaults/', method: 'GET' },
      { type: 'configuration', title: 'AWS Backup Plans', description: 'Backup plan configurations', path: '/backup/plans/', method: 'GET' },
      { type: 'retention_policy', title: 'AWS Backup Lifecycle', description: 'Backup lifecycle and retention policies', path: '/backup/plans/', method: 'GET' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GRC & COMPLIANCE (10)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'onetrust', name: 'OneTrust', category: 'GRC',
    apiBaseUrl: 'https://{instance}.onetrust.com/api', apiDocsUrl: 'https://developer.onetrust.com/',
    authMethods: ['oauth', 'api-key'], authPrefix: 'Bearer',
    testEndpoint: '/access/v1/users/me',
    evidenceEndpoints: [
      { type: 'compliance_status', title: 'OneTrust Assessments', description: 'Privacy assessment records', path: '/assessment/v2/assessments?size=100', method: 'GET' },
      { type: 'data_classification', title: 'OneTrust Data Maps', description: 'Data mapping and classification inventory', path: '/datamap/v1/datamaps?size=100', method: 'GET' },
      { type: 'configuration', title: 'OneTrust Cookie Consent', description: 'Cookie consent configurations', path: '/cookieconsent/v1/domains', method: 'GET' },
      { type: 'audit_log', title: 'OneTrust Audit Trail', description: 'System audit trail events', path: '/audit/v1/audits?size=100', method: 'GET' },
    ],
  },
  {
    id: 'trustarc', name: 'TrustArc', category: 'GRC',
    apiBaseUrl: 'https://api.trustarc.com/v1', apiDocsUrl: 'https://trustarc.com/platform/privacy-management/',
    authMethods: ['api-key', 'oauth'], authPrefix: 'Bearer',
    testEndpoint: '/assessments?limit=1',
    evidenceEndpoints: [
      { type: 'compliance_status', title: 'TrustArc Assessments', description: 'Privacy impact assessment records', path: '/assessments?limit=100', method: 'GET' },
      { type: 'data_classification', title: 'TrustArc Data Inventory', description: 'Data processing inventory', path: '/data-inventory?limit=100', method: 'GET' },
      { type: 'configuration', title: 'TrustArc Consent', description: 'Consent management configurations', path: '/consent?limit=100', method: 'GET' },
    ],
  },
  {
    id: 'bigid', name: 'BigID', category: 'GRC',
    apiBaseUrl: 'https://{instance}/api/v1', apiDocsUrl: 'https://docs.bigid.com/',
    authMethods: ['api-key'], authPrefix: 'Bearer',
    testEndpoint: '/system/health',
    evidenceEndpoints: [
      { type: 'data_classification', title: 'BigID Discovery Results', description: 'Data discovery and classification results', path: '/data-catalog?limit=100', method: 'GET' },
      { type: 'compliance_status', title: 'BigID Compliance', description: 'Privacy regulation compliance status', path: '/compliance/results?limit=100', method: 'GET' },
      { type: 'asset_inventory', title: 'BigID Data Sources', description: 'Connected data source inventory', path: '/ds-connections', method: 'GET' },
    ],
  },
  {
    id: 'securiti', name: 'Securiti', category: 'GRC',
    apiBaseUrl: 'https://app.securiti.ai/core/v1', apiDocsUrl: 'https://securiti.ai/developers/',
    authMethods: ['api-key'], authPrefix: 'Bearer',
    testEndpoint: '/status',
    evidenceEndpoints: [
      { type: 'data_classification', title: 'Securiti Data Intelligence', description: 'Sensitive data discovery results', path: '/sensitivedata?limit=100', method: 'GET' },
      { type: 'compliance_status', title: 'Securiti Assessments', description: 'Compliance assessment records', path: '/assessments?limit=100', method: 'GET' },
      { type: 'asset_inventory', title: 'Securiti Assets', description: 'Data asset inventory', path: '/assets?limit=100', method: 'GET' },
    ],
  },
  {
    id: 'wirewheel', name: 'WireWheel', category: 'GRC',
    apiBaseUrl: 'https://api.wirewheel.io/v1', apiDocsUrl: 'https://wirewheel.io/data-privacy-management-platform/',
    authMethods: ['api-key', 'oauth'], authPrefix: 'Bearer',
    testEndpoint: '/organizations',
    evidenceEndpoints: [
      { type: 'compliance_status', title: 'WireWheel Records', description: 'Records of processing activities', path: '/records?limit=100', method: 'GET' },
      { type: 'data_classification', title: 'WireWheel Data Maps', description: 'Data mapping records', path: '/datamaps?limit=100', method: 'GET' },
      { type: 'configuration', title: 'WireWheel DSR', description: 'Data subject request configurations', path: '/dsrs?limit=100', method: 'GET' },
    ],
  },
  {
    id: 'datagrail', name: 'DataGrail', category: 'GRC',
    apiBaseUrl: 'https://api.datagrail.io/v3', apiDocsUrl: 'https://docs.datagrail.io/',
    authMethods: ['api-key'], authPrefix: 'Bearer',
    testEndpoint: '/privacy-requests?limit=1',
    evidenceEndpoints: [
      { type: 'compliance_status', title: 'DataGrail Privacy Requests', description: 'Privacy request records', path: '/privacy-requests?limit=100', method: 'GET' },
      { type: 'data_classification', title: 'DataGrail Systems', description: 'Connected system data map', path: '/systems', method: 'GET' },
      { type: 'audit_log', title: 'DataGrail Activity', description: 'Request processing activity log', path: '/activity?limit=100', method: 'GET' },
    ],
  },
  {
    id: 'transcend', name: 'Transcend', category: 'GRC',
    apiBaseUrl: 'https://api.transcend.io/v1', apiDocsUrl: 'https://docs.transcend.io/',
    authMethods: ['api-key'], authPrefix: 'Bearer',
    testEndpoint: '/data-silos',
    evidenceEndpoints: [
      { type: 'compliance_status', title: 'Transcend DSRs', description: 'Data subject request records', path: '/data-subject-requests?limit=100', method: 'GET' },
      { type: 'asset_inventory', title: 'Transcend Data Silos', description: 'Data silo inventory', path: '/data-silos', method: 'GET' },
      { type: 'data_classification', title: 'Transcend Data Points', description: 'Data point classification inventory', path: '/data-silos/data-points', method: 'GET' },
    ],
  },
  {
    id: 'osano', name: 'Osano', category: 'GRC',
    apiBaseUrl: 'https://api.osano.com/v1', apiDocsUrl: 'https://docs.osano.com/',
    authMethods: ['api-key'], authPrefix: 'Bearer',
    testEndpoint: '/consent/configs',
    evidenceEndpoints: [
      { type: 'compliance_status', title: 'Osano Consent Status', description: 'Consent collection status', path: '/consent/stats', method: 'GET' },
      { type: 'configuration', title: 'Osano Consent Configs', description: 'Consent manager configurations', path: '/consent/configs', method: 'GET' },
      { type: 'data_classification', title: 'Osano Vendors', description: 'Third-party vendor data flow mappings', path: '/vendors', method: 'GET' },
    ],
  },
  {
    id: 'mine', name: 'Mine PrivacyOps', category: 'GRC',
    apiBaseUrl: 'https://api.saymine.com/v1', apiDocsUrl: 'https://developers.saymine.com/',
    authMethods: ['api-key'], authPrefix: 'Bearer',
    testEndpoint: '/requests?limit=1',
    evidenceEndpoints: [
      { type: 'compliance_status', title: 'Mine Requests', description: 'Data privacy request records', path: '/requests?limit=100', method: 'GET' },
      { type: 'data_classification', title: 'Mine Data Map', description: 'Data processing activity mapping', path: '/data-map', method: 'GET' },
      { type: 'asset_inventory', title: 'Mine Integrations', description: 'Connected data source inventory', path: '/integrations', method: 'GET' },
    ],
  },
  {
    id: 'ketch', name: 'Ketch', category: 'GRC',
    apiBaseUrl: 'https://global.ketchcdn.com/web/v3', apiDocsUrl: 'https://docs.ketch.com/',
    authMethods: ['api-key'], authPrefix: 'Bearer',
    testEndpoint: '/config',
    evidenceEndpoints: [
      { type: 'compliance_status', title: 'Ketch Consent', description: 'Consent and preference data', path: '/consent', method: 'GET' },
      { type: 'configuration', title: 'Ketch Config', description: 'Privacy program configurations', path: '/config', method: 'GET' },
      { type: 'data_classification', title: 'Ketch Data Map', description: 'Data system and purpose mappings', path: '/systems', method: 'GET' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TRAINING & AWARENESS (10)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'knowbe4-training', name: 'KnowBe4 Training', category: 'Training',
    apiBaseUrl: 'https://{region}.api.knowbe4.com/v1', apiDocsUrl: 'https://developer.knowbe4.com/',
    authMethods: ['api-key'], authHeader: 'Authorization', authPrefix: 'Bearer',
    testEndpoint: '/account',
    evidenceEndpoints: [
      { type: 'training_completion', title: 'KB4 Training Campaigns', description: 'Security awareness training campaign records', path: '/training/campaigns', method: 'GET' },
      { type: 'training_completion', title: 'KB4 Training Enrollments', description: 'Training enrollment and completion status', path: '/training/enrollments?per_page=100', method: 'GET' },
      { type: 'compliance_status', title: 'KB4 Phishing Campaigns', description: 'Phishing simulation campaign results', path: '/phishing/campaigns', method: 'GET' },
      { type: 'user_list', title: 'KB4 Users', description: 'Training platform user inventory', path: '/users?per_page=100', method: 'GET' },
    ],
  },
  {
    id: 'proofpoint-awareness', name: 'Proofpoint Security Awareness', category: 'Training',
    apiBaseUrl: 'https://{instance}.proofpoint.com/api/v1', apiDocsUrl: 'https://proofpoint.com/us/products/security-awareness-training',
    authMethods: ['api-key', 'oauth'], authPrefix: 'Bearer',
    testEndpoint: '/users?limit=1',
    evidenceEndpoints: [
      { type: 'training_completion', title: 'Proofpoint Training', description: 'Training module completion status', path: '/training/assignments?limit=100', method: 'GET' },
      { type: 'compliance_status', title: 'Proofpoint Phishing', description: 'Phishing simulation results', path: '/phishing/campaigns?limit=100', method: 'GET' },
      { type: 'user_list', title: 'Proofpoint Users', description: 'Platform user accounts', path: '/users?limit=100', method: 'GET' },
    ],
  },
  {
    id: 'sans-awareness', name: 'SANS Security Awareness', category: 'Training',
    apiBaseUrl: 'https://api.securingthehuman.org/v1', apiDocsUrl: 'https://www.sans.org/security-awareness-training/api/',
    authMethods: ['api-key'], authPrefix: 'Bearer',
    testEndpoint: '/users?limit=1',
    evidenceEndpoints: [
      { type: 'training_completion', title: 'SANS Training Status', description: 'Training completion records', path: '/reports/training?limit=100', method: 'GET' },
      { type: 'compliance_status', title: 'SANS Phishing Results', description: 'Phishing assessment results', path: '/reports/phishing?limit=100', method: 'GET' },
      { type: 'user_list', title: 'SANS Users', description: 'Training platform users', path: '/users?limit=100', method: 'GET' },
    ],
  },
  {
    id: 'cofense-training', name: 'Cofense PhishMe', category: 'Training',
    apiBaseUrl: 'https://api.cofense.com/v2', apiDocsUrl: 'https://cofense.com/product-services/cofense-phishme/',
    authMethods: ['api-key', 'oauth'], authPrefix: 'Bearer',
    testEndpoint: '/scenarios?limit=1',
    evidenceEndpoints: [
      { type: 'training_completion', title: 'Cofense Scenarios', description: 'Phishing simulation scenario results', path: '/scenarios?limit=100', method: 'GET' },
      { type: 'compliance_status', title: 'Cofense Reports', description: 'Campaign completion reports', path: '/reports?limit=100', method: 'GET' },
      { type: 'user_list', title: 'Cofense Recipients', description: 'Simulation recipient accounts', path: '/recipients?limit=100', method: 'GET' },
    ],
  },
  {
    id: 'hoxhunt', name: 'Hoxhunt', category: 'Training',
    apiBaseUrl: 'https://api.hoxhunt.com/graphql', apiDocsUrl: 'https://developer.hoxhunt.com/',
    authMethods: ['api-key'], authPrefix: 'Bearer',
    testEndpoint: '',
    evidenceEndpoints: [
      { type: 'training_completion', title: 'Hoxhunt Campaigns', description: 'Phishing training campaign results', path: '', method: 'POST', params: { query: '{ campaigns(first: 100) { nodes { id name status completionRate } } }' } },
      { type: 'compliance_status', title: 'Hoxhunt User Performance', description: 'User performance and threat reporting rates', path: '', method: 'POST', params: { query: '{ users(first: 100) { nodes { email successRate failRate reportRate } } }' } },
      { type: 'user_list', title: 'Hoxhunt Users', description: 'Platform user inventory', path: '', method: 'POST', params: { query: '{ users(first: 100) { nodes { id email department } } }' } },
    ],
  },
  {
    id: 'ninjio', name: 'NINJIO', category: 'Training',
    apiBaseUrl: 'https://api.ninjio.com/v1', apiDocsUrl: 'https://ninjio.com/resources/',
    authMethods: ['api-key'], authPrefix: 'Bearer',
    testEndpoint: '/organizations',
    evidenceEndpoints: [
      { type: 'training_completion', title: 'NINJIO Training', description: 'Training video completion records', path: '/training/completions?limit=100', method: 'GET' },
      { type: 'compliance_status', title: 'NINJIO Campaigns', description: 'Campaign engagement metrics', path: '/campaigns?limit=100', method: 'GET' },
      { type: 'user_list', title: 'NINJIO Users', description: 'Training platform users', path: '/users?limit=100', method: 'GET' },
    ],
  },
  {
    id: 'curricula', name: 'Curricula', category: 'Training',
    apiBaseUrl: 'https://api.curricula.com/v1', apiDocsUrl: 'https://curricula.com/platform/',
    authMethods: ['api-key'], authPrefix: 'Bearer',
    testEndpoint: '/organization',
    evidenceEndpoints: [
      { type: 'training_completion', title: 'Curricula Training', description: 'Training completion records', path: '/training/enrollments?limit=100', method: 'GET' },
      { type: 'compliance_status', title: 'Curricula Phishing', description: 'Phishing simulation results', path: '/phishing/campaigns?limit=100', method: 'GET' },
      { type: 'user_list', title: 'Curricula Learners', description: 'Learner accounts', path: '/learners?limit=100', method: 'GET' },
    ],
  },
  {
    id: 'hook-security', name: 'Hook Security', category: 'Training',
    apiBaseUrl: 'https://api.hooksecurity.co/v1', apiDocsUrl: 'https://hooksecurity.co/api/',
    authMethods: ['api-key'], authPrefix: 'Bearer',
    testEndpoint: '/company',
    evidenceEndpoints: [
      { type: 'training_completion', title: 'Hook Training', description: 'Awareness training completion records', path: '/training/status?limit=100', method: 'GET' },
      { type: 'compliance_status', title: 'Hook Phishing', description: 'Phishing simulation campaign results', path: '/phishing/results?limit=100', method: 'GET' },
      { type: 'user_list', title: 'Hook Users', description: 'Platform user accounts', path: '/users?limit=100', method: 'GET' },
    ],
  },
  {
    id: 'goldphish', name: 'GoldPhish', category: 'Training',
    apiBaseUrl: 'https://api.goldphish.com/v1', apiDocsUrl: 'https://goldphish.com/api-documentation/',
    authMethods: ['api-key'], authPrefix: 'Bearer',
    testEndpoint: '/campaigns?limit=1',
    evidenceEndpoints: [
      { type: 'training_completion', title: 'GoldPhish Training', description: 'Training module completion data', path: '/training?limit=100', method: 'GET' },
      { type: 'compliance_status', title: 'GoldPhish Simulations', description: 'Phishing simulation results', path: '/simulations?limit=100', method: 'GET' },
      { type: 'user_list', title: 'GoldPhish Users', description: 'User accounts', path: '/users?limit=100', method: 'GET' },
    ],
  },
  {
    id: 'terranova-security', name: 'Terranova Security', category: 'Training',
    apiBaseUrl: 'https://api.terranovasecurity.com/v1', apiDocsUrl: 'https://terranovasecurity.com/',
    authMethods: ['api-key', 'oauth'], authPrefix: 'Bearer',
    testEndpoint: '/organization',
    evidenceEndpoints: [
      { type: 'training_completion', title: 'Terranova Courses', description: 'Training course completion records', path: '/courses/enrollments?limit=100', method: 'GET' },
      { type: 'compliance_status', title: 'Terranova Simulations', description: 'Phishing simulation campaign data', path: '/simulations/results?limit=100', method: 'GET' },
      { type: 'user_list', title: 'Terranova Users', description: 'Platform user accounts', path: '/users?limit=100', method: 'GET' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FINANCE & BILLING (10)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'stripe', name: 'Stripe', category: 'Finance',
    apiBaseUrl: 'https://api.stripe.com/v1', apiDocsUrl: 'https://stripe.com/docs/api',
    authMethods: ['api-key'], authHeader: 'Authorization', authPrefix: 'Bearer',
    testEndpoint: '/balance',
    evidenceEndpoints: [
      { type: 'financial_control', title: 'Stripe Balance', description: 'Account balance and pending amounts', path: '/balance', method: 'GET' },
      { type: 'financial_control', title: 'Stripe Charges', description: 'Payment charge records', path: '/charges?limit=100', method: 'GET' },
      { type: 'access_control', title: 'Stripe API Keys', description: 'API key inventory (names only)', path: '/api_keys', method: 'GET' },
      { type: 'audit_log', title: 'Stripe Events', description: 'Account event log', path: '/events?limit=100', method: 'GET' },
    ],
  },
  {
    id: 'square', name: 'Square', category: 'Finance',
    apiBaseUrl: 'https://connect.squareup.com/v2', apiDocsUrl: 'https://developer.squareup.com/reference/square',
    authMethods: ['oauth', 'api-key'], authPrefix: 'Bearer',
    testEndpoint: '/merchants/me',
    evidenceEndpoints: [
      { type: 'financial_control', title: 'Square Payments', description: 'Payment transaction records', path: '/payments?limit=100', method: 'GET' },
      { type: 'access_control', title: 'Square Team Members', description: 'Team member accounts', path: '/team-members/search', method: 'POST', params: { limit: 100 } },
      { type: 'configuration', title: 'Square Locations', description: 'Business location configurations', path: '/locations', method: 'GET' },
    ],
  },
  {
    id: 'paypal', name: 'PayPal', category: 'Finance',
    apiBaseUrl: 'https://api-m.paypal.com/v2', apiDocsUrl: 'https://developer.paypal.com/docs/api/',
    authMethods: ['oauth'], authPrefix: 'Bearer',
    testEndpoint: 'https://api-m.paypal.com/v1/reporting/transactions?start_date=2024-01-01T00:00:00-0700&end_date=2024-01-02T00:00:00-0700&page_size=1',
    evidenceEndpoints: [
      { type: 'financial_control', title: 'PayPal Transactions', description: 'Transaction history records', path: 'https://api-m.paypal.com/v1/reporting/transactions?start_date=2024-01-01T00:00:00-0700&end_date=2025-01-01T00:00:00-0700&page_size=100', method: 'GET' },
      { type: 'financial_control', title: 'PayPal Balances', description: 'Account balance summary', path: 'https://api-m.paypal.com/v1/reporting/balances', method: 'GET' },
      { type: 'configuration', title: 'PayPal Webhooks', description: 'Webhook event notification configurations', path: 'https://api-m.paypal.com/v1/notifications/webhooks', method: 'GET' },
    ],
  },
  {
    id: 'brex', name: 'Brex', category: 'Finance',
    apiBaseUrl: 'https://platform.brexapis.com', apiDocsUrl: 'https://developer.brex.com/',
    authMethods: ['api-key'], authPrefix: 'Bearer',
    testEndpoint: '/v2/accounts',
    evidenceEndpoints: [
      { type: 'financial_control', title: 'Brex Transactions', description: 'Card transaction records', path: '/v2/transactions/card/primary?limit=100', method: 'GET' },
      { type: 'access_control', title: 'Brex Users', description: 'Account user inventory', path: '/v2/users?limit=100', method: 'GET' },
      { type: 'financial_control', title: 'Brex Cards', description: 'Corporate card inventory', path: '/v2/cards?limit=100', method: 'GET' },
    ],
  },
  {
    id: 'ramp', name: 'Ramp', category: 'Finance',
    apiBaseUrl: 'https://api.ramp.com/developer/v1', apiDocsUrl: 'https://docs.ramp.com/',
    authMethods: ['oauth', 'api-key'], authPrefix: 'Bearer',
    testEndpoint: '/business',
    evidenceEndpoints: [
      { type: 'financial_control', title: 'Ramp Transactions', description: 'Expense transaction records', path: '/transactions?page_size=100', method: 'GET' },
      { type: 'access_control', title: 'Ramp Users', description: 'User accounts and card assignments', path: '/users?page_size=100', method: 'GET' },
      { type: 'financial_control', title: 'Ramp Receipts', description: 'Receipt compliance status', path: '/receipts?page_size=100', method: 'GET' },
    ],
  },
  {
    id: 'divvy-bill', name: 'BILL Divvy', category: 'Finance',
    apiBaseUrl: 'https://api.divvy.co/v3', apiDocsUrl: 'https://developer.bill.com/',
    authMethods: ['api-key', 'oauth'], authPrefix: 'Bearer',
    testEndpoint: '/company',
    evidenceEndpoints: [
      { type: 'financial_control', title: 'Divvy Transactions', description: 'Transaction records', path: '/transactions?limit=100', method: 'GET' },
      { type: 'access_control', title: 'Divvy Users', description: 'User account and budget access', path: '/users?limit=100', method: 'GET' },
      { type: 'financial_control', title: 'Divvy Budgets', description: 'Budget allocation and usage', path: '/budgets?limit=100', method: 'GET' },
    ],
  },
  {
    id: 'navan', name: 'Navan (TripActions)', category: 'Finance',
    apiBaseUrl: 'https://api.navan.com/v1', apiDocsUrl: 'https://developer.navan.com/',
    authMethods: ['oauth'], authPrefix: 'Bearer',
    testEndpoint: '/company',
    evidenceEndpoints: [
      { type: 'financial_control', title: 'Navan Expenses', description: 'Expense report records', path: '/expenses?limit=100', method: 'GET' },
      { type: 'financial_control', title: 'Navan Bookings', description: 'Travel booking records', path: '/bookings?limit=100', method: 'GET' },
      { type: 'access_control', title: 'Navan Users', description: 'Platform user accounts', path: '/users?limit=100', method: 'GET' },
    ],
  },
  {
    id: 'expensify', name: 'Expensify', category: 'Finance',
    apiBaseUrl: 'https://integrations.expensify.com/Integration-Server/ExpensifyIntegrations', apiDocsUrl: 'https://integrations.expensify.com/Integration-Server/doc/',
    authMethods: ['api-key'], testEndpoint: '',
    evidenceEndpoints: [
      { type: 'financial_control', title: 'Expensify Reports', description: 'Expense report records', path: '', method: 'POST', params: { type: 'file', onReceive: { immediateResponse: ['returnRandomFileName'] }, inputSettings: { type: 'combinedReportData', limit: 100 } } },
      { type: 'compliance_status', title: 'Expensify Policies', description: 'Expense policy configurations', path: '', method: 'POST', params: { type: 'get', inputSettings: { type: 'policyList' } } },
      { type: 'access_control', title: 'Expensify Members', description: 'Policy member accounts', path: '', method: 'POST', params: { type: 'get', inputSettings: { type: 'policyMembers' } } },
    ],
  },
  {
    id: 'sap-concur', name: 'SAP Concur', category: 'Finance',
    apiBaseUrl: 'https://{region}.api.concursolutions.com', apiDocsUrl: 'https://developer.concur.com/api-reference/',
    authMethods: ['oauth'], authPrefix: 'Bearer',
    testEndpoint: '/profile/v1/me',
    evidenceEndpoints: [
      { type: 'financial_control', title: 'Concur Expense Reports', description: 'Expense report records', path: '/api/v3.0/expense/reports?limit=100', method: 'GET' },
      { type: 'financial_control', title: 'Concur Invoices', description: 'Invoice payment records', path: '/api/v3.0/invoice/paymentrequestdigests?limit=100', method: 'GET' },
      { type: 'access_control', title: 'Concur Users', description: 'User profile accounts', path: '/api/v3.0/common/users?limit=100', method: 'GET' },
    ],
  },
  {
    id: 'coupa', name: 'Coupa', category: 'Finance',
    apiBaseUrl: 'https://{instance}.coupahost.com/api', apiDocsUrl: 'https://compass.coupa.com/en-us/products/product-documentation/integration-technical-documentation/',
    authMethods: ['api-key', 'oauth'], authHeader: 'X-COUPA-API-KEY', authPrefix: '',
    testEndpoint: '/users?limit=1',
    evidenceEndpoints: [
      { type: 'financial_control', title: 'Coupa Requisitions', description: 'Purchase requisition records', path: '/requisitions?limit=100', method: 'GET' },
      { type: 'financial_control', title: 'Coupa Invoices', description: 'Invoice processing records', path: '/invoices?limit=100', method: 'GET' },
      { type: 'access_control', title: 'Coupa Users', description: 'User accounts and roles', path: '/users?limit=100', method: 'GET' },
      { type: 'configuration', title: 'Coupa Approval Chains', description: 'Approval workflow configurations', path: '/approval_chains?limit=100', method: 'GET' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ANALYTICS & BI (10)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'tableau', name: 'Tableau', category: 'BI',
    apiBaseUrl: 'https://{instance}.online.tableau.com/api/3.21', apiDocsUrl: 'https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref.htm',
    authMethods: ['pat', 'username-password'], testEndpoint: '/sites',
    evidenceEndpoints: [
      { type: 'access_control', title: 'Tableau Users', description: 'Site user accounts and roles', path: '/sites/{account}/users?pageSize=100', method: 'GET' },
      { type: 'asset_inventory', title: 'Tableau Workbooks', description: 'Workbook inventory', path: '/sites/{account}/workbooks?pageSize=100', method: 'GET' },
      { type: 'access_control', title: 'Tableau Groups', description: 'User group configurations', path: '/sites/{account}/groups?pageSize=100', method: 'GET' },
    ],
  },
  {
    id: 'power-bi', name: 'Power BI', category: 'BI',
    apiBaseUrl: 'https://api.powerbi.com/v1.0/myorg', apiDocsUrl: 'https://learn.microsoft.com/en-us/rest/api/power-bi/',
    authMethods: ['oauth'], authPrefix: 'Bearer',
    testEndpoint: '/groups?$top=1',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'Power BI Workspaces', description: 'Workspace inventory', path: '/groups?$top=100', method: 'GET' },
      { type: 'access_control', title: 'Power BI Users', description: 'Workspace user access', path: '/groups/{account}/users', method: 'GET' },
      { type: 'asset_inventory', title: 'Power BI Datasets', description: 'Dataset inventory', path: '/groups/{account}/datasets', method: 'GET' },
    ],
  },
  {
    id: 'looker', name: 'Looker', category: 'BI',
    apiBaseUrl: 'https://{instance}.looker.com/api/4.0', apiDocsUrl: 'https://cloud.google.com/looker/docs/reference/looker-api/latest/',
    authMethods: ['api-key-secret'], testEndpoint: '/user',
    evidenceEndpoints: [
      { type: 'access_control', title: 'Looker Users', description: 'User accounts and roles', path: '/users?limit=100', method: 'GET' },
      { type: 'asset_inventory', title: 'Looker Dashboards', description: 'Dashboard inventory', path: '/dashboards?limit=100', method: 'GET' },
      { type: 'access_control', title: 'Looker Roles', description: 'Role and permission set definitions', path: '/roles', method: 'GET' },
      { type: 'audit_log', title: 'Looker Sessions', description: 'User session audit records', path: '/sessions?limit=100', method: 'GET' },
    ],
  },
  {
    id: 'mode-analytics', name: 'Mode Analytics', category: 'BI',
    apiBaseUrl: 'https://app.mode.com/api/{org}', apiDocsUrl: 'https://mode.com/developer/api-reference/',
    authMethods: ['api-key-secret'], testEndpoint: '',
    evidenceEndpoints: [
      { type: 'access_control', title: 'Mode Members', description: 'Organization member accounts', path: '/members', method: 'GET' },
      { type: 'asset_inventory', title: 'Mode Spaces', description: 'Space and report inventory', path: '/spaces', method: 'GET' },
      { type: 'audit_log', title: 'Mode Audit Log', description: 'Organization activity audit log', path: '/audit_log', method: 'GET' },
    ],
  },
  {
    id: 'metabase', name: 'Metabase', category: 'BI',
    apiBaseUrl: 'https://{instance}/api', apiDocsUrl: 'https://www.metabase.com/docs/latest/api/',
    authMethods: ['api-key', 'username-password'], testEndpoint: '/session/properties',
    evidenceEndpoints: [
      { type: 'access_control', title: 'Metabase Users', description: 'User accounts and permissions', path: '/user?limit=100', method: 'GET' },
      { type: 'asset_inventory', title: 'Metabase Databases', description: 'Connected database inventory', path: '/database', method: 'GET' },
      { type: 'access_control', title: 'Metabase Permissions', description: 'Permission group configurations', path: '/permissions/group', method: 'GET' },
      { type: 'audit_log', title: 'Metabase Audit', description: 'Audit log records', path: '/ee/audit-app/v1/audit-log', method: 'GET' },
    ],
  },
  {
    id: 'domo', name: 'Domo', category: 'BI',
    apiBaseUrl: 'https://api.domo.com/v1', apiDocsUrl: 'https://developer.domo.com/portal/8f21d1d28b00e-api-reference',
    authMethods: ['oauth'], authPrefix: 'Bearer',
    testEndpoint: '/users?limit=1',
    evidenceEndpoints: [
      { type: 'access_control', title: 'Domo Users', description: 'User accounts and roles', path: '/users?limit=100', method: 'GET' },
      { type: 'asset_inventory', title: 'Domo Datasets', description: 'Dataset inventory', path: '/datasets?limit=100', method: 'GET' },
      { type: 'access_control', title: 'Domo Groups', description: 'User group configurations', path: '/groups?limit=100', method: 'GET' },
      { type: 'audit_log', title: 'Domo Activity Log', description: 'User activity log', path: '/audit?limit=100', method: 'GET' },
    ],
  },
  {
    id: 'sisense', name: 'Sisense', category: 'BI',
    apiBaseUrl: 'https://{instance}/api/v1', apiDocsUrl: 'https://sisense.dev/reference/',
    authMethods: ['api-key'], authPrefix: 'Bearer',
    testEndpoint: '/users/loggedin',
    evidenceEndpoints: [
      { type: 'access_control', title: 'Sisense Users', description: 'User accounts and roles', path: '/users', method: 'GET' },
      { type: 'asset_inventory', title: 'Sisense Dashboards', description: 'Dashboard inventory', path: '/dashboards', method: 'GET' },
      { type: 'access_control', title: 'Sisense Groups', description: 'User group configurations', path: '/groups', method: 'GET' },
    ],
  },
  {
    id: 'qlik', name: 'Qlik Sense', category: 'BI',
    apiBaseUrl: 'https://{tenant}.{region}.qlikcloud.com/api/v1', apiDocsUrl: 'https://qlik.dev/apis/',
    authMethods: ['api-key'], authPrefix: 'Bearer',
    testEndpoint: '/users/me',
    evidenceEndpoints: [
      { type: 'access_control', title: 'Qlik Users', description: 'Tenant user accounts', path: '/users?limit=100', method: 'GET' },
      { type: 'asset_inventory', title: 'Qlik Spaces', description: 'Space inventory', path: '/spaces?limit=100', method: 'GET' },
      { type: 'audit_log', title: 'Qlik Audit Events', description: 'Audit event log', path: '/audits?limit=100', method: 'GET' },
    ],
  },
  {
    id: 'thoughtspot', name: 'ThoughtSpot', category: 'BI',
    apiBaseUrl: 'https://{instance}.thoughtspot.cloud/api/rest/2.0', apiDocsUrl: 'https://developers.thoughtspot.com/docs/',
    authMethods: ['api-key', 'username-password'], authPrefix: 'Bearer',
    testEndpoint: '/auth/session/user',
    evidenceEndpoints: [
      { type: 'access_control', title: 'ThoughtSpot Users', description: 'User accounts and privileges', path: '/users/search', method: 'POST', params: { record_size: 100 } },
      { type: 'asset_inventory', title: 'ThoughtSpot Objects', description: 'Metadata object inventory', path: '/metadata/search', method: 'POST', params: { record_size: 100 } },
      { type: 'access_control', title: 'ThoughtSpot Groups', description: 'User group configurations', path: '/groups/search', method: 'POST', params: { record_size: 100 } },
      { type: 'audit_log', title: 'ThoughtSpot Audit Log', description: 'Audit log events', path: '/logs/fetch', method: 'POST', params: { log_type: 'SECURITY_AUDIT', record_size: 100 } },
    ],
  },
  {
    id: 'google-analytics', name: 'Google Analytics', category: 'BI',
    apiBaseUrl: 'https://analyticsadmin.googleapis.com/v1beta', apiDocsUrl: 'https://developers.google.com/analytics/devguides/config/admin/v1/rest/',
    authMethods: ['oauth', 'service-account'], authPrefix: 'Bearer',
    testEndpoint: '/accounts',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'GA Accounts', description: 'Analytics account inventory', path: '/accounts', method: 'GET' },
      { type: 'configuration', title: 'GA Properties', description: 'Analytics property configurations', path: '/properties?filter=parent:accounts/{account}', method: 'GET' },
      { type: 'access_control', title: 'GA Access Bindings', description: 'Account access role bindings', path: '/accounts/{account}/accessBindings', method: 'GET' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTOMATION (10)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'zapier', name: 'Zapier', category: 'Automation',
    apiBaseUrl: 'https://api.zapier.com/v1', apiDocsUrl: 'https://platform.zapier.com/reference/',
    authMethods: ['api-key'], authPrefix: 'Bearer',
    testEndpoint: '/profiles/me',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'Zapier Zaps', description: 'Automation zap inventory', path: '/zaps', method: 'GET' },
      { type: 'configuration', title: 'Zapier Profile', description: 'Account profile and settings', path: '/profiles/me', method: 'GET' },
      { type: 'change_management', title: 'Zapier Zap History', description: 'Zap execution history', path: '/zap-runs', method: 'GET' },
    ],
  },
  {
    id: 'make', name: 'Make (Integromat)', category: 'Automation',
    apiBaseUrl: 'https://{region}.make.com/api/v2', apiDocsUrl: 'https://www.make.com/en/api-documentation/',
    authMethods: ['api-key'], authHeader: 'Authorization', authPrefix: 'Token',
    testEndpoint: '/users/me',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'Make Scenarios', description: 'Automation scenario inventory', path: '/scenarios?pg[limit]=100', method: 'GET' },
      { type: 'access_control', title: 'Make Users', description: 'Organization user accounts', path: '/users?pg[limit]=100', method: 'GET' },
      { type: 'change_management', title: 'Make Scenario Logs', description: 'Scenario execution history', path: '/scenarios/{account}/logs?pg[limit]=100', method: 'GET' },
    ],
  },
  {
    id: 'tray-io', name: 'Tray.io', category: 'Automation',
    apiBaseUrl: 'https://api.tray.io/core/v1', apiDocsUrl: 'https://tray.io/documentation/',
    authMethods: ['api-key', 'oauth'], authPrefix: 'Bearer',
    testEndpoint: '/users/me',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'Tray Workflows', description: 'Workflow automation inventory', path: '/workflows?limit=100', method: 'GET' },
      { type: 'access_control', title: 'Tray Users', description: 'Platform user accounts', path: '/users?limit=100', method: 'GET' },
      { type: 'change_management', title: 'Tray Executions', description: 'Workflow execution history', path: '/executions?limit=100', method: 'GET' },
    ],
  },
  {
    id: 'workato', name: 'Workato', category: 'Automation',
    apiBaseUrl: 'https://www.workato.com/api', apiDocsUrl: 'https://docs.workato.com/developing-connectors/sdk/guides/',
    authMethods: ['api-key'], authHeader: 'Authorization', authPrefix: 'Bearer',
    testEndpoint: '/users/me',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'Workato Recipes', description: 'Integration recipe inventory', path: '/recipes?per_page=100', method: 'GET' },
      { type: 'access_control', title: 'Workato Connections', description: 'API connection inventory', path: '/connections?per_page=100', method: 'GET' },
      { type: 'change_management', title: 'Workato Jobs', description: 'Recipe job execution history', path: '/recipes/{account}/jobs?per_page=100', method: 'GET' },
    ],
  },
  {
    id: 'power-automate', name: 'Power Automate', category: 'Automation',
    apiBaseUrl: 'https://api.flow.microsoft.com/providers/Microsoft.ProcessSimple', apiDocsUrl: 'https://learn.microsoft.com/en-us/power-automate/web-api',
    authMethods: ['oauth'], authPrefix: 'Bearer',
    testEndpoint: '/environments',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'PA Flows', description: 'Flow automation inventory', path: '/environments/{account}/flows?api-version=2016-11-01', method: 'GET' },
      { type: 'configuration', title: 'PA Environments', description: 'Environment configurations', path: '/environments?api-version=2016-11-01', method: 'GET' },
      { type: 'change_management', title: 'PA Flow Runs', description: 'Flow run execution history', path: '/environments/{account}/flows/{flow}/runs?api-version=2016-11-01', method: 'GET' },
    ],
  },
  {
    id: 'n8n', name: 'n8n', category: 'Automation',
    apiBaseUrl: 'https://{instance}.app.n8n.cloud/api/v1', apiDocsUrl: 'https://docs.n8n.io/api/api-reference/',
    authMethods: ['api-key'], authHeader: 'X-N8N-API-KEY', authPrefix: '',
    testEndpoint: '/workflows?limit=1',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'n8n Workflows', description: 'Workflow automation inventory', path: '/workflows?limit=100', method: 'GET' },
      { type: 'access_control', title: 'n8n Credentials', description: 'Credential inventory (names only)', path: '/credentials', method: 'GET' },
      { type: 'change_management', title: 'n8n Executions', description: 'Workflow execution history', path: '/executions?limit=100', method: 'GET' },
    ],
  },
  {
    id: 'celigo', name: 'Celigo', category: 'Automation',
    apiBaseUrl: 'https://api.integrator.io/v1', apiDocsUrl: 'https://docs.celigo.com/hc/en-us/categories/360002261492-API-Reference',
    authMethods: ['api-key'], authHeader: 'Authorization', authPrefix: 'Bearer',
    testEndpoint: '/integrations',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'Celigo Integrations', description: 'Integration flow inventory', path: '/integrations', method: 'GET' },
      { type: 'access_control', title: 'Celigo Connections', description: 'API connection inventory', path: '/connections', method: 'GET' },
      { type: 'change_management', title: 'Celigo Flow Runs', description: 'Flow run execution history', path: '/flows?limit=100', method: 'GET' },
    ],
  },
  {
    id: 'snaplogic', name: 'SnapLogic', category: 'Automation',
    apiBaseUrl: 'https://elastic.snaplogic.com/api/1', apiDocsUrl: 'https://docs-snaplogic.atlassian.net/wiki/spaces/SD/pages/',
    authMethods: ['api-key', 'username-password'], authPrefix: 'Bearer',
    testEndpoint: '/rest/asset/session',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'SnapLogic Pipelines', description: 'Pipeline inventory', path: '/rest/asset/{org}/projects', method: 'GET' },
      { type: 'change_management', title: 'SnapLogic Executions', description: 'Pipeline execution history', path: '/rest/pipeline/prepared/{org}?limit=100', method: 'GET' },
      { type: 'access_control', title: 'SnapLogic Users', description: 'Organization user accounts', path: '/rest/user/{org}', method: 'GET' },
    ],
  },
  {
    id: 'mulesoft', name: 'MuleSoft', category: 'Automation',
    apiBaseUrl: 'https://anypoint.mulesoft.com', apiDocsUrl: 'https://docs.mulesoft.com/api-manager/2.x/anypoint-platform-cli-reference',
    authMethods: ['oauth', 'username-password'], authPrefix: 'Bearer',
    testEndpoint: '/accounts/api/me',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'MuleSoft APIs', description: 'API inventory across environments', path: '/apiplatform/repository/v2/organizations/{org}/apis?limit=100', method: 'GET' },
      { type: 'access_control', title: 'MuleSoft Users', description: 'Organization user accounts', path: '/accounts/api/organizations/{org}/members?limit=100', method: 'GET' },
      { type: 'configuration', title: 'MuleSoft Environments', description: 'Deployment environment configurations', path: '/accounts/api/organizations/{org}/environments', method: 'GET' },
      { type: 'audit_log', title: 'MuleSoft Audit Log', description: 'Platform audit log events', path: '/audit/v2/organizations/{org}/entries?limit=100', method: 'GET' },
    ],
  },
  {
    id: 'dell-boomi', name: 'Dell Boomi', category: 'Automation',
    apiBaseUrl: 'https://api.boomi.com/api/rest/v1/{account}', apiDocsUrl: 'https://help.boomi.com/bundle/developer_apis/',
    authMethods: ['username-password', 'api-key'], testEndpoint: '/Account/{account}',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'Boomi Processes', description: 'Integration process inventory', path: '/Process/query', method: 'POST', params: { QueryFilter: { expression: { operator: 'LIKE', property: 'name', argument: ['%'] } } } },
      { type: 'change_management', title: 'Boomi Executions', description: 'Process execution history', path: '/ExecutionRecord/query', method: 'POST', params: { QueryFilter: { expression: { operator: 'GREATER_THAN_OR_EQUAL', property: 'executionTime', argument: ['2024-01-01T00:00:00Z'] } } } },
      { type: 'access_control', title: 'Boomi Users', description: 'Account user assignments', path: '/AccountUserRole/query', method: 'POST', params: { QueryFilter: { expression: { operator: 'LIKE', property: 'name', argument: ['%'] } } } },
    ],
  },
];

export default createProviders(descriptors);
