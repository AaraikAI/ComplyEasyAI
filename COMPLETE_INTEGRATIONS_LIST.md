# Complete List of All Integrations

This document provides a comprehensive list of all integrations available in the ComplyEasyAI system, organized by category and authentication method.

## Integration Categories

### 1. Cloud Providers
- **AWS** (`aws`) - OAuth/API Key
- **Microsoft Azure** (`azure`) - API Key/Service Account
- **Google Cloud Platform** (`gcp`) - Service Account JSON
- **Heroku** (`heroku`) - API Key
- **DigitalOcean** (`digitalocean`) - PAT (with validation)

### 2. Development & DevOps Tools
- **GitHub** (`github`) - OAuth (with validation)
- **GitLab** (`gitlab`) - PAT (with validation)
- **Bitbucket** (`bitbucket`) - PAT (with validation)
- **Jenkins** (`jenkins`) - API Token (with validation)
- **CircleCI** (`circleci`) - API Token (with validation)
- **Travis CI** (`travis`) - API Token (with validation)
- **Docker Hub** (`docker`, `dockerhub`) - PAT (with validation)
- **Kubernetes** (`kubernetes`, `k8s`) - API Token (with validation)

### 3. Project Management & Collaboration
- **Jira** (`jira`) - OAuth (with validation)
- **Confluence** (`confluence`) - API Token (with validation)
- **Trello** (`trello`) - API Key + Token (with validation)
- **Asana** (`asana`) - PAT (with validation)
- **Monday.com** (`monday`, `monday.com`) - API Token (with validation)
- **Microsoft Teams** (`microsoft-teams`, `teams`) - Bot Token (with validation)
- **Discord** (`discord`) - Bot Token (with validation)
- **Slack** (`slack`) - OAuth (with validation)

### 4. Security & Monitoring Tools
- **Datadog** (`datadog`) - API Key
- **New Relic** (`newrelic`, `new-relic`) - API Key (with validation)
- **Sentry** (`sentry`) - API Token (with validation)
- **PagerDuty** (`pagerduty`, `pager-duty`) - API Token (with validation)
- **Qualys** (`qualys`) - API Key
- **Tenable** (`tenable`) - API Key
- **CrowdStrike** (`crowdstrike`) - API Key
- **Palo Alto** (`paloalto`) - API Key
- **Rapid7** (`rapid7`) - API Key
- **Splunk** (`splunk`) - API Key

### 5. Identity & Access Management (IAM)
- **Okta** (`okta`) - API Token (with validation, requires base URL)
- **Auth0** (`auth0`) - Management API Token (with validation, requires domain)
- **OneLogin** (`onelogin`) - API Token (with validation, requires base URL)
- **Google Workspace** (`google`) - OAuth (with validation)

### 6. Database & Storage
- **MongoDB Atlas** (`mongodb`) - API Key
- **PostgreSQL** (`postgresql`) - Connection String
- **MySQL** (`mysql`) - Connection String
- **Redis** (`redis`) - Connection String
- **Elasticsearch** (`elasticsearch`) - API Key

### 7. HR & People Management
- **BambooHR** (`bamboohr`) - API Key
- **Workday** (`workday`) - API Token (with validation, requires base URL)
- **ADP** (`adp`) - API Key

### 8. CRM & Sales
- **Salesforce** (`salesforce`) - OAuth/API Key
- **HubSpot** (`hubspot`) - API Key
- **Zendesk** (`zendesk`) - API Key

### 9. Payment & Finance
- **Stripe** (`stripe`) - API Key (with validation)
- **PayPal** (`paypal`) - API Key

### 10. Communication & Messaging
- **Twilio** (`twilio`) - Account SID + Auth Token (with validation)
- **SendGrid** (`sendgrid`) - API Key (with validation)

### 11. Microsoft 365 Suite
- **Microsoft 365** (`microsoft`, `microsoft365`, `office365`) - OAuth Token (with validation)

## Authentication Methods

### OAuth 2.0 (Full OAuth Flow)
These integrations support full OAuth 2.0 authentication:
1. **Google Workspace** (`google`)
2. **GitHub** (`github`)
3. **Slack** (`slack`)
4. **Jira** (`jira`)

### Personal Access Token (PAT) - With Validation
These integrations use PATs and have validation implemented:
1. **DigitalOcean** - Validates via DigitalOcean API
2. **Docker Hub** - Validates via Docker Hub API
3. **Kubernetes** - Validates via Kubernetes API server
4. **Confluence** - Validates via Confluence API
5. **Trello** - Validates via Trello API (requires API Key + Token)
6. **Asana** - Validates via Asana API
7. **Monday.com** - Validates via Monday.com GraphQL API
8. **Microsoft Teams** - Validates via Microsoft Graph API
9. **Discord** - Validates via Discord API
10. **Okta** - Validates via Okta API (requires base URL)
11. **Workday** - Validates format (requires base URL)
12. **New Relic** - Validates via New Relic API
13. **Sentry** - Validates via Sentry API (supports custom base URL)
14. **PagerDuty** - Validates via PagerDuty API
15. **Auth0** - Validates via Auth0 Management API (requires domain)
16. **OneLogin** - Validates via OneLogin API (requires base URL)
17. **Microsoft 365** - Validates via Microsoft Graph API
18. **GitLab** - Validates via GitLab API
19. **Bitbucket** - Validates via Bitbucket API
20. **GitHub** - Validates via GitHub API
21. **Jenkins** - Validates via Jenkins API (requires base URL)
22. **Travis CI** - Validates via Travis CI API
23. **CircleCI** - Validates via CircleCI API

### API Key - With Validation
These integrations use API keys and have validation:
1. **Stripe** - Validates via Stripe API
2. **SendGrid** - Validates via SendGrid API
3. **Twilio** - Validates Account SID + Auth Token via Twilio API

### API Key - Without Validation (Format Check Only)
These integrations accept API keys but only perform basic format validation:
1. **Datadog**
2. **Qualys**
3. **Tenable**
4. **CrowdStrike**
5. **Palo Alto**
6. **Rapid7**
7. **Splunk**
8. **BambooHR**
9. **ADP**
10. **MongoDB Atlas**
11. **PostgreSQL** (Connection String)
12. **MySQL** (Connection String)
13. **Redis** (Connection String)
14. **Elasticsearch**
15. **Heroku**
16. **Salesforce**
17. **HubSpot**
18. **Zendesk**
19. **PayPal**

### Service Account (JSON)
These integrations use service account JSON files:
1. **Google Cloud Platform** (`gcp`)
2. **Microsoft Azure** (can also use API Key)

## Integration Status Summary

### Total Integrations: **60+**

### By Authentication Type:
- **OAuth 2.0**: 4 integrations
- **PAT with Validation**: 23 integrations
- **API Key with Validation**: 3 integrations
- **API Key without Validation**: 19+ integrations
- **Service Account**: 2 integrations
- **Connection String**: 3 integrations

### By Category:
- **Cloud Providers**: 5
- **Development & DevOps**: 8
- **Project Management**: 7
- **Security & Monitoring**: 10
- **IAM**: 4
- **Database & Storage**: 5
- **HR**: 3
- **CRM & Sales**: 3
- **Payment & Finance**: 2
- **Communication**: 2
- **Microsoft 365**: 1

## Notes

1. **OAuth Providers**: Google, GitHub, Slack, and Jira have dedicated OAuth flows with callback handlers.

2. **PAT Validation**: All PAT-validated integrations make actual API calls to verify token validity before saving credentials.

3. **Base URL Required**: Some integrations require a base URL in addition to the token:
   - Kubernetes
   - Confluence
   - Okta
   - Auth0
   - OneLogin
   - Workday
   - Sentry
   - Jenkins

4. **Special Requirements**:
   - **Trello**: Requires both API Key and Token
   - **Twilio**: Requires Account SID (as API Key) and Auth Token (as API Secret)
   - **Kubernetes**: Requires API server URL and token
   - **GCP**: Requires service account JSON with project ID, location, key ring, and key ID for BYOK

5. **Generic Handler**: All integrations not listed above can be connected via the generic `connectProvider` endpoint using API key, PAT, or other credential types, but will only receive basic format validation.

## API Endpoints

### OAuth Endpoints (Specific)
- `GET /api/integrations/google/authorize`
- `GET /api/integrations/github/authorize`
- `GET /api/integrations/slack/authorize`
- `GET /api/integrations/jira/authorize`

### Generic Endpoints
- `POST /api/integrations/:provider/connect` - Connect any integration
- `GET /api/integrations/:provider/authorize` - OAuth for unsupported providers (returns error)
- `POST /api/integrations/:provider/sync` - Sync integration data
- `DELETE /api/integrations/:provider` - Disconnect integration
- `GET /api/integrations` - List all integrations
- `GET /api/integrations/:provider` - Get integration status

## Connection Types Supported

1. **OAuth** (`oauth`) - For Google, GitHub, Slack, Jira
2. **API Key** (`api-key`) - Single API key
3. **API Key + Secret** (`api-key-secret`) - For Twilio, SendGrid
4. **PAT** (`pat`) - Personal Access Token
5. **Service Account** (`service-account`) - JSON credentials for GCP, Azure
6. **Username/Password** (`username-password`) - Basic auth
7. **Connection String** (`connection-string`) - For databases

---

*Last Updated: Based on current codebase analysis*
*Total Integrations: 60+*
*Validated Integrations: 30+*

