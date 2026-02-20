/**
 * Cloud Provider Integrations (20 providers)
 * Real API implementations for all cloud infrastructure providers.
 */
import { createProviders, ProviderDescriptor } from './providerFactory';

const descriptors: ProviderDescriptor[] = [
  {
    id: 'aws', name: 'AWS', category: 'Cloud',
    apiBaseUrl: 'https://sts.amazonaws.com', apiDocsUrl: 'https://docs.aws.amazon.com/',
    authMethods: ['iam'], testEndpoint: '/?Action=GetCallerIdentity&Version=2011-06-15',
    evidenceEndpoints: [
      { type: 'configuration', title: 'AWS Account Info', description: 'AWS STS caller identity and account details', path: '/?Action=GetCallerIdentity&Version=2011-06-15', method: 'GET' },
      { type: 'access_control', title: 'IAM Users', description: 'List of IAM users for access review', path: 'https://iam.amazonaws.com/?Action=ListUsers&Version=2010-05-08', method: 'GET' },
      { type: 'configuration', title: 'S3 Bucket List', description: 'S3 buckets for data storage audit', path: 'https://s3.amazonaws.com/', method: 'GET' },
      { type: 'compliance_status', title: 'AWS Config Rules', description: 'Compliance rules evaluation status', path: 'https://config.{region}.amazonaws.com', method: 'POST', params: { Action: 'DescribeComplianceByConfigRule' } },
      { type: 'security_finding', title: 'Security Hub Findings', description: 'Aggregated security findings from AWS Security Hub', path: 'https://securityhub.{region}.amazonaws.com/findings', method: 'POST' },
      { type: 'audit_log', title: 'CloudTrail Events', description: 'Management event history for audit trail', path: 'https://cloudtrail.{region}.amazonaws.com/?Action=LookupEvents', method: 'GET' },
    ],
  },
  {
    id: 'azure', name: 'Microsoft Azure', category: 'Cloud',
    apiBaseUrl: 'https://management.azure.com', apiDocsUrl: 'https://learn.microsoft.com/en-us/rest/api/azure/',
    authMethods: ['oauth', 'service-account'], authPrefix: 'Bearer',
    testEndpoint: '/subscriptions?api-version=2022-12-01',
    evidenceEndpoints: [
      { type: 'configuration', title: 'Azure Subscriptions', description: 'List of Azure subscriptions', path: '/subscriptions?api-version=2022-12-01', method: 'GET' },
      { type: 'asset_inventory', title: 'Azure Resources', description: 'All resources across subscriptions', path: '/subscriptions/{account}/resources?api-version=2021-04-01', method: 'GET' },
      { type: 'compliance_status', title: 'Policy Compliance', description: 'Azure Policy compliance states', path: '/subscriptions/{account}/providers/Microsoft.PolicyInsights/policyStates/latest/summarize?api-version=2019-10-01', method: 'POST' },
      { type: 'security_finding', title: 'Security Alerts', description: 'Microsoft Defender for Cloud alerts', path: '/subscriptions/{account}/providers/Microsoft.Security/alerts?api-version=2022-01-01', method: 'GET' },
      { type: 'access_control', title: 'Azure AD Users', description: 'Azure AD directory users', path: 'https://graph.microsoft.com/v1.0/users', method: 'GET' },
    ],
  },
  {
    id: 'gcp', name: 'Google Cloud Platform', category: 'Cloud',
    apiBaseUrl: 'https://cloudresourcemanager.googleapis.com/v3', apiDocsUrl: 'https://cloud.google.com/apis/docs/overview',
    authMethods: ['service-account', 'oauth'], testEndpoint: '/projects',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'GCP Projects', description: 'List of GCP projects', path: '/projects', method: 'GET' },
      { type: 'access_control', title: 'IAM Policies', description: 'IAM policy bindings for access review', path: '/projects/{account}:getIamPolicy', method: 'POST' },
      { type: 'configuration', title: 'Compute Instances', description: 'GCE instance inventory', path: 'https://compute.googleapis.com/compute/v1/projects/{account}/aggregated/instances', method: 'GET' },
      { type: 'audit_log', title: 'Admin Activity Logs', description: 'Cloud Audit admin activity logs', path: 'https://logging.googleapis.com/v2/entries:list', method: 'POST', params: { filter: 'logName="projects/{account}/logs/cloudaudit.googleapis.com%2Factivity"', orderBy: 'timestamp desc', pageSize: 100 } },
      { type: 'security_finding', title: 'Security Findings', description: 'Security Command Center findings', path: 'https://securitycenter.googleapis.com/v1/organizations/{org}/sources/-/findings', method: 'GET' },
    ],
  },
  {
    id: 'oracle-cloud', name: 'Oracle Cloud', category: 'Cloud',
    apiBaseUrl: 'https://identity.{region}.oraclecloud.com/20160918', apiDocsUrl: 'https://docs.oracle.com/en-us/iaas/api/',
    authMethods: ['api-key'], testEndpoint: '/tenancies/{tenant}',
    evidenceEndpoints: [
      { type: 'access_control', title: 'OCI Users', description: 'Oracle Cloud IAM users', path: '/users', method: 'GET' },
      { type: 'configuration', title: 'OCI Compartments', description: 'Resource compartment structure', path: '/compartments', method: 'GET' },
      { type: 'audit_log', title: 'OCI Audit Events', description: 'Audit log events', path: 'https://audit.{region}.oraclecloud.com/20190901/auditEvents', method: 'GET' },
      { type: 'compliance_status', title: 'OCI Cloud Guard', description: 'Cloud Guard detector recipes and findings', path: 'https://cloudguard.{region}.oraclecloud.com/20200131/problems', method: 'GET' },
    ],
  },
  {
    id: 'ibm-cloud', name: 'IBM Cloud', category: 'Cloud',
    apiBaseUrl: 'https://iam.cloud.ibm.com', apiDocsUrl: 'https://cloud.ibm.com/apidocs',
    authMethods: ['api-key'], authHeader: 'Authorization', authPrefix: 'Bearer',
    testEndpoint: '/v1/apikeys/details',
    evidenceEndpoints: [
      { type: 'access_control', title: 'IBM Cloud Users', description: 'IAM user accounts', path: 'https://user-management.cloud.ibm.com/v2/accounts/{account}/users', method: 'GET' },
      { type: 'asset_inventory', title: 'IBM Cloud Resources', description: 'Resource instances inventory', path: 'https://resource-controller.cloud.ibm.com/v2/resource_instances', method: 'GET' },
      { type: 'configuration', title: 'IBM Cloud Resource Groups', description: 'Resource group organization', path: 'https://resource-manager.cloud.ibm.com/v2/resource_groups', method: 'GET' },
      { type: 'security_finding', title: 'Security Advisor Findings', description: 'IBM Security Advisor findings', path: 'https://{region}.secadvisor.cloud.ibm.com/findings/v1/{account}/providers', method: 'GET' },
    ],
  },
  {
    id: 'alibaba-cloud', name: 'Alibaba Cloud', category: 'Cloud',
    apiBaseUrl: 'https://ecs.aliyuncs.com', apiDocsUrl: 'https://www.alibabacloud.com/help/en/',
    authMethods: ['api-key-secret'], testEndpoint: '/?Action=DescribeRegions&Format=JSON',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'Alibaba ECS Instances', description: 'Elastic Compute Service instances', path: '/?Action=DescribeInstances&Format=JSON', method: 'GET' },
      { type: 'access_control', title: 'RAM Users', description: 'Resource Access Management users', path: 'https://ram.aliyuncs.com/?Action=ListUsers&Format=JSON', method: 'GET' },
      { type: 'security_finding', title: 'Security Center Alerts', description: 'Alibaba Cloud Security Center alerts', path: 'https://tds.aliyuncs.com/?Action=DescribeAlarmEventList&Format=JSON', method: 'GET' },
    ],
  },
  {
    id: 'digitalocean', name: 'DigitalOcean', category: 'Cloud',
    apiBaseUrl: 'https://api.digitalocean.com/v2', apiDocsUrl: 'https://docs.digitalocean.com/reference/api/',
    authMethods: ['api-key', 'pat'], testEndpoint: '/account',
    evidenceEndpoints: [
      { type: 'configuration', title: 'DO Account', description: 'DigitalOcean account details and limits', path: '/account', method: 'GET' },
      { type: 'asset_inventory', title: 'DO Droplets', description: 'Droplet (VM) inventory', path: '/droplets', method: 'GET' },
      { type: 'configuration', title: 'DO Firewalls', description: 'Firewall rule configurations', path: '/firewalls', method: 'GET' },
      { type: 'asset_inventory', title: 'DO Databases', description: 'Managed database clusters', path: '/databases', method: 'GET' },
      { type: 'configuration', title: 'DO VPCs', description: 'Virtual private cloud configurations', path: '/vpcs', method: 'GET' },
      { type: 'access_control', title: 'DO SSH Keys', description: 'SSH keys for access control audit', path: '/account/keys', method: 'GET' },
    ],
  },
  {
    id: 'heroku', name: 'Heroku', category: 'Cloud',
    apiBaseUrl: 'https://api.heroku.com', apiDocsUrl: 'https://devcenter.heroku.com/articles/platform-api-reference',
    authMethods: ['api-key', 'pat'], authHeader: 'Authorization', authPrefix: 'Bearer',
    testEndpoint: '/account',
    evidenceEndpoints: [
      { type: 'configuration', title: 'Heroku Account', description: 'Account information', path: '/account', method: 'GET' },
      { type: 'asset_inventory', title: 'Heroku Apps', description: 'Application inventory', path: '/apps', method: 'GET' },
      { type: 'configuration', title: 'Heroku Add-ons', description: 'Add-on configurations', path: '/addons', method: 'GET' },
      { type: 'audit_log', title: 'Heroku Audit Trail', description: 'Enterprise audit trail events', path: '/audit-trail-events', method: 'GET' },
    ],
  },
  {
    id: 'linode', name: 'Linode/Akamai', category: 'Cloud',
    apiBaseUrl: 'https://api.linode.com/v4', apiDocsUrl: 'https://www.linode.com/docs/api/',
    authMethods: ['api-key', 'pat'], testEndpoint: '/profile',
    evidenceEndpoints: [
      { type: 'configuration', title: 'Linode Profile', description: 'Account profile details', path: '/profile', method: 'GET' },
      { type: 'asset_inventory', title: 'Linode Instances', description: 'Linode compute instances', path: '/linode/instances', method: 'GET' },
      { type: 'configuration', title: 'Linode Firewalls', description: 'Cloud firewall rules', path: '/networking/firewalls', method: 'GET' },
      { type: 'audit_log', title: 'Linode Events', description: 'Account events and activity', path: '/account/events', method: 'GET' },
      { type: 'access_control', title: 'Linode Users', description: 'Account users and grants', path: '/account/users', method: 'GET' },
    ],
  },
  {
    id: 'vultr', name: 'Vultr', category: 'Cloud',
    apiBaseUrl: 'https://api.vultr.com/v2', apiDocsUrl: 'https://www.vultr.com/api/',
    authMethods: ['api-key'], authHeader: 'Authorization', authPrefix: 'Bearer',
    testEndpoint: '/account',
    evidenceEndpoints: [
      { type: 'configuration', title: 'Vultr Account', description: 'Account info and balance', path: '/account', method: 'GET' },
      { type: 'asset_inventory', title: 'Vultr Instances', description: 'Compute instance inventory', path: '/instances', method: 'GET' },
      { type: 'configuration', title: 'Vultr Firewalls', description: 'Firewall group rules', path: '/firewalls', method: 'GET' },
      { type: 'access_control', title: 'Vultr SSH Keys', description: 'SSH keys for access audit', path: '/ssh-keys', method: 'GET' },
    ],
  },
  {
    id: 'cloudflare', name: 'Cloudflare', category: 'Cloud',
    apiBaseUrl: 'https://api.cloudflare.com/client/v4', apiDocsUrl: 'https://developers.cloudflare.com/api/',
    authMethods: ['api-key', 'pat'], testEndpoint: '/user',
    evidenceEndpoints: [
      { type: 'configuration', title: 'CF Account', description: 'Cloudflare account details', path: '/user', method: 'GET' },
      { type: 'asset_inventory', title: 'CF Zones', description: 'DNS zone configurations', path: '/zones', method: 'GET' },
      { type: 'configuration', title: 'CF WAF Rules', description: 'Web Application Firewall rules', path: '/zones/{account}/firewall/rules', method: 'GET' },
      { type: 'audit_log', title: 'CF Audit Logs', description: 'Account audit log events', path: '/accounts/{account}/audit_logs', method: 'GET' },
      { type: 'security_finding', title: 'CF Security Events', description: 'Security analytics events', path: '/zones/{account}/security/events', method: 'GET' },
    ],
  },
  {
    id: 'fastly', name: 'Fastly', category: 'Cloud',
    apiBaseUrl: 'https://api.fastly.com', apiDocsUrl: 'https://developer.fastly.com/reference/api/',
    authMethods: ['api-key'], authHeader: 'Fastly-Key', authPrefix: '',
    testEndpoint: '/current_customer',
    evidenceEndpoints: [
      { type: 'configuration', title: 'Fastly Account', description: 'Customer account info', path: '/current_customer', method: 'GET' },
      { type: 'asset_inventory', title: 'Fastly Services', description: 'CDN service configurations', path: '/service', method: 'GET' },
      { type: 'audit_log', title: 'Fastly Events', description: 'Event log for changes', path: '/events', method: 'GET' },
    ],
  },
  {
    id: 'rackspace', name: 'Rackspace', category: 'Cloud',
    apiBaseUrl: 'https://identity.api.rackspacecloud.com/v2.0', apiDocsUrl: 'https://docs.rackspace.com/docs/cloud-identity/v2/',
    authMethods: ['api-key', 'username-password'], testEndpoint: '/tokens',
    evidenceEndpoints: [
      { type: 'access_control', title: 'Rackspace Users', description: 'Cloud account users', path: '/users', method: 'GET' },
      { type: 'configuration', title: 'Rackspace Tenants', description: 'Tenant configurations', path: '/tenants', method: 'GET' },
    ],
  },
  {
    id: 'vmware-cloud', name: 'VMware Cloud', category: 'Cloud',
    apiBaseUrl: 'https://vmc.vmware.com/vmc/api', apiDocsUrl: 'https://developer.vmware.com/apis/vmc/',
    authMethods: ['api-key'], testEndpoint: '/orgs',
    evidenceEndpoints: [
      { type: 'configuration', title: 'VMC Organizations', description: 'VMware Cloud orgs', path: '/orgs', method: 'GET' },
      { type: 'asset_inventory', title: 'VMC SDDCs', description: 'Software-defined data centers', path: '/orgs/{org}/sddcs', method: 'GET' },
    ],
  },
  {
    id: 'openstack', name: 'OpenStack', category: 'Cloud',
    apiBaseUrl: 'https://{host}:5000/v3', apiDocsUrl: 'https://docs.openstack.org/api-ref/',
    authMethods: ['username-password'], testEndpoint: '/auth/tokens',
    evidenceEndpoints: [
      { type: 'access_control', title: 'OpenStack Users', description: 'Keystone identity users', path: '/users', method: 'GET' },
      { type: 'asset_inventory', title: 'OpenStack Projects', description: 'Project/tenant inventory', path: '/projects', method: 'GET' },
      { type: 'configuration', title: 'OpenStack Services', description: 'Service catalog', path: '/services', method: 'GET' },
    ],
  },
  {
    id: 'render', name: 'Render', category: 'Cloud',
    apiBaseUrl: 'https://api.render.com/v1', apiDocsUrl: 'https://api-docs.render.com/',
    authMethods: ['api-key'], testEndpoint: '/owners',
    evidenceEndpoints: [
      { type: 'configuration', title: 'Render Owners', description: 'Account owners and teams', path: '/owners', method: 'GET' },
      { type: 'asset_inventory', title: 'Render Services', description: 'Deployed services inventory', path: '/services', method: 'GET' },
      { type: 'configuration', title: 'Render Env Groups', description: 'Environment variable groups', path: '/env-groups', method: 'GET' },
    ],
  },
  {
    id: 'fly-io', name: 'Fly.io', category: 'Cloud',
    apiBaseUrl: 'https://api.machines.dev/v1', apiDocsUrl: 'https://fly.io/docs/machines/api/',
    authMethods: ['api-key', 'pat'], testEndpoint: '/apps',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'Fly Apps', description: 'Application inventory', path: '/apps', method: 'GET' },
      { type: 'configuration', title: 'Fly Machines', description: 'Machine configurations', path: '/apps/{account}/machines', method: 'GET' },
    ],
  },
  {
    id: 'vercel', name: 'Vercel', category: 'Cloud',
    apiBaseUrl: 'https://api.vercel.com', apiDocsUrl: 'https://vercel.com/docs/rest-api',
    authMethods: ['api-key', 'pat'], testEndpoint: '/v2/user',
    evidenceEndpoints: [
      { type: 'configuration', title: 'Vercel User', description: 'Account details', path: '/v2/user', method: 'GET' },
      { type: 'asset_inventory', title: 'Vercel Projects', description: 'Project deployments', path: '/v9/projects', method: 'GET' },
      { type: 'configuration', title: 'Vercel Teams', description: 'Team configurations', path: '/v2/teams', method: 'GET' },
      { type: 'access_control', title: 'Vercel Team Members', description: 'Team member access', path: '/v2/teams/{account}/members', method: 'GET' },
    ],
  },
  {
    id: 'netlify', name: 'Netlify', category: 'Cloud',
    apiBaseUrl: 'https://api.netlify.com/api/v1', apiDocsUrl: 'https://open-api.netlify.com/',
    authMethods: ['api-key', 'pat'], testEndpoint: '/user',
    evidenceEndpoints: [
      { type: 'configuration', title: 'Netlify User', description: 'Account details', path: '/user', method: 'GET' },
      { type: 'asset_inventory', title: 'Netlify Sites', description: 'Deployed site inventory', path: '/sites', method: 'GET' },
      { type: 'access_control', title: 'Netlify Members', description: 'Account members and roles', path: '/accounts/{account}/members', method: 'GET' },
      { type: 'audit_log', title: 'Netlify Audit Log', description: 'Account audit events', path: '/accounts/{account}/audit', method: 'GET' },
    ],
  },
  {
    id: 'railway', name: 'Railway', category: 'Cloud',
    apiBaseUrl: 'https://backboard.railway.app/graphql/v2', apiDocsUrl: 'https://docs.railway.app/reference/public-api',
    authMethods: ['api-key', 'pat'], testEndpoint: '',
    evidenceEndpoints: [
      { type: 'asset_inventory', title: 'Railway Projects', description: 'Project inventory', path: '', method: 'POST', params: { query: '{ me { projects { edges { node { id name } } } } }' } },
      { type: 'configuration', title: 'Railway Services', description: 'Service deployments', path: '', method: 'POST', params: { query: '{ me { projects { edges { node { services { edges { node { id name } } } } } } } }' } },
    ],
  },
];

export default createProviders(descriptors);
