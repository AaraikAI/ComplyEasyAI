# ComplyEasy AI - Complete API Documentation

**Base URL:** `https://api.complyeasy.ai/api`  
**API Version:** 2.0.0  
**Documentation:** Available at `/api/docs` (Swagger UI)

---

## Table of Contents

1. [Authentication](#authentication)
2. [Rate Limiting](#rate-limiting)
3. [Error Handling](#error-handling)
4. [API Endpoints](#api-endpoints)
   - [Authentication](#authentication-endpoints)
   - [Two-Factor Authentication](#two-factor-authentication)
   - [Risk Management](#risk-management)
   - [Compliance Frameworks](#compliance-frameworks)
   - [AI Features](#ai-features)
   - [Billing](#billing)
   - [Personnel Management](#personnel-management)
   - [Vendor Risk Management](#vendor-risk-management)
   - [Enterprise Modules](#enterprise-modules)
   - [Integrations](#integrations)
   - [Health Check](#health-check)

---

## Authentication

All API endpoints (except authentication and public endpoints) require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Getting an Access Token

1. **Register** or **Request Magic Link**
2. **Verify Magic Link** to receive access and refresh tokens
3. Use the **access token** for API requests
4. Use the **refresh token** to get a new access token when it expires

### Token Refresh

When your access token expires, use the refresh token to get a new one:

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

---

## Rate Limiting

API requests are rate-limited to prevent abuse:

- **Standard Endpoints:** 100 requests per 15 minutes per IP
- **Authentication Endpoints:** 5 requests per 15 minutes per IP
- **AI Endpoints:** 10 requests per minute per user

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in window
- `X-RateLimit-Reset`: Time when limit resets (Unix timestamp)

---

## Error Handling

All errors follow a consistent format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  }
}
```

### HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

---

## API Endpoints

### Authentication Endpoints

#### Register User

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "organizationName": "Acme Corp"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "admin"
  },
  "message": "Registration successful"
}
```

#### Request Magic Link

```http
POST /api/auth/magic-link
Content-Type: application/json

{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "message": "Magic link sent to your email",
  "devToken": "token-for-development" // Only in development
}
```

#### Verify Magic Link

```http
POST /api/auth/verify
Content-Type: application/json

{
  "token": "magic-link-token"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "admin"
  },
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token"
}
```

#### Refresh Token

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "jwt-refresh-token"
}
```

**Response:**
```json
{
  "accessToken": "new-jwt-access-token",
  "refreshToken": "new-jwt-refresh-token"
}
```

#### Logout

```http
POST /api/auth/logout
Authorization: Bearer <token>
```

---

### Two-Factor Authentication

#### Setup 2FA

```http
POST /api/2fa/setup
Authorization: Bearer <token>
```

**Response:**
```json
{
  "secret": "2FA-secret",
  "qrCode": "data:image/png;base64,...",
  "backupCodes": ["code1", "code2", ...]
}
```

#### Verify and Enable 2FA

```http
POST /api/2fa/verify-enable
Authorization: Bearer <token>
Content-Type: application/json

{
  "token": "6-digit-code"
}
```

#### Get 2FA Status

```http
GET /api/2fa/status
Authorization: Bearer <token>
```

---

### Risk Management

#### List Risks

```http
GET /api/risks?severity=High&status=Open&limit=20&offset=0
Authorization: Bearer <token>
```

**Query Parameters:**
- `severity` - Filter by severity (Critical, High, Medium, Low)
- `status` - Filter by status (Open, Mitigated, Accepted, Closed)
- `limit` - Number of results (default: 20)
- `offset` - Pagination offset (default: 0)

**Response:**
```json
{
  "risks": [
    {
      "id": "uuid",
      "title": "Unencrypted S3 Bucket",
      "description": "...",
      "severity": "High",
      "likelihood": 4,
      "impact": 5,
      "status": "Open",
      "createdAt": "2024-12-18T00:00:00Z"
    }
  ],
  "total": 50,
  "limit": 20,
  "offset": 0
}
```

#### Get Risk by ID

```http
GET /api/risks/:id
Authorization: Bearer <token>
```

#### Create Risk

```http
POST /api/risks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Security Risk",
  "description": "Risk description",
  "category": "Security",
  "likelihood": 4,
  "impact": 5,
  "assignedToId": "user-uuid" // Optional
}
```

**Required:** Admin or Editor role

#### Update Risk

```http
PATCH /api/risks/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "Mitigated",
  "mitigationPlan": "Mitigation details"
}
```

**Required:** Admin or Editor role

#### Delete Risk

```http
DELETE /api/risks/:id
Authorization: Bearer <token>
```

**Required:** Admin role

#### Prioritize Risks (AI)

```http
POST /api/risks/prioritize
Authorization: Bearer <token>
Content-Type: application/json

{
  "riskIds": ["uuid1", "uuid2"]
}
```

**Response:**
```json
{
  "prioritizedRisks": [
    {
      "id": "uuid",
      "score": 95,
      "rationale": "High severity and impact"
    }
  ]
}
```

#### Generate Remediation Plan

```http
POST /api/risks/:id/remediation
Authorization: Bearer <token>
```

**Response:**
```json
{
  "remediationPlan": "Step-by-step remediation plan...",
  "estimatedTime": "2-4 weeks",
  "resources": ["resource1", "resource2"]
}
```

#### Scan for Risks

```http
POST /api/risks/scan
Authorization: Bearer <token>
Content-Type: application/json

{
  "organizationId": "org-uuid",
  "scanType": "full" // or "quick"
}
```

---

### Compliance Frameworks

#### List Frameworks

```http
GET /api/frameworks
Authorization: Bearer <token>
```

#### Get Framework by ID

```http
GET /api/frameworks/:id
Authorization: Bearer <token>
```

#### Create Framework

```http
POST /api/frameworks
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "SOC2",
  "description": "SOC 2 Type II compliance",
  "nextAuditDate": "2025-12-31"
}
```

**Required:** Admin or Editor role

#### Update Framework

```http
PATCH /api/frameworks/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "Compliant",
  "progress": 95
}
```

**Required:** Admin or Editor role

#### Delete Framework

```http
DELETE /api/frameworks/:id
Authorization: Bearer <token>
```

**Required:** Admin role

---

### AI Features

All AI endpoints are rate-limited to 10 requests per minute.

#### Generate Compliance Report

```http
POST /api/ai/report
Authorization: Bearer <token>
Content-Type: application/json

{
  "framework": "SOC2",
  "companyName": "Acme Corp",
  "context": "Additional context"
}
```

**Response:**
```json
{
  "report": "Generated compliance report...",
  "sections": ["Executive Summary", "Controls", "Recommendations"]
}
```

#### Generate Policy

```http
POST /api/ai/policy
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "Data Protection Policy",
  "company": "Acme Corp",
  "tone": "professional"
}
```

#### Analyze Contract

```http
POST /api/ai/contract
Authorization: Bearer <token>
Content-Type: application/json

{
  "contractText": "Contract content...",
  "analysisType": "compliance" // or "risk"
}
```

#### Perform Gap Analysis

```http
POST /api/ai/gap-analysis
Authorization: Bearer <token>
Content-Type: application/json

{
  "framework": "ISO27001",
  "currentState": "Current compliance state..."
}
```

#### Chat with Compliance Bot

```http
POST /api/ai/chat
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "What are the requirements for SOC2?",
  "context": "Optional context"
}
```

---

### Billing

#### Create Checkout Session

```http
POST /api/billing/checkout
Authorization: Bearer <token>
Content-Type: application/json

{
  "plan": "Pro" // Basic, Pro, or Enterprise
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/..."
}
```

#### Get Subscription Status

```http
GET /api/billing/subscription
Authorization: Bearer <token>
```

**Response:**
```json
{
  "status": "active",
  "plan": "Pro",
  "currentPeriodEnd": "2025-01-18T00:00:00Z"
}
```

#### Create Billing Portal Session

```http
POST /api/billing/portal
Authorization: Bearer <token>
```

**Response:**
```json
{
  "url": "https://billing.stripe.com/..."
}
```

---

### Personnel Management

#### Create Personnel Record

```http
POST /api/personnel
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "role": "Developer",
  "department": "Engineering"
}
```

#### Complete Onboarding

```http
POST /api/personnel/:id/complete-onboarding
Authorization: Bearer <token>
```

#### Start Offboarding

```http
POST /api/personnel/:id/start-offboarding
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Resignation"
}
```

#### Create Access Review

```http
POST /api/personnel/access-reviews
Authorization: Bearer <token>
Content-Type: application/json

{
  "personnelId": "uuid",
  "reviewType": "quarterly",
  "dueDate": "2025-01-31"
}
```

#### Get Compliance Summary

```http
GET /api/personnel/compliance-summary
Authorization: Bearer <token>
```

---

### Vendor Risk Management

#### Create Vendor

```http
POST /api/vendors
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Vendor Corp",
  "category": "Cloud Provider",
  "hasDataAccess": true,
  "dataTypes": ["PII", "Financial"]
}
```

#### Create Vendor Assessment

```http
POST /api/vendors/:id/assessments
Authorization: Bearer <token>
Content-Type: application/json

{
  "assessmentType": "initial",
  "questionnaireId": "uuid"
}
```

#### Get Vendor Scorecard

```http
GET /api/vendors/:id/scorecard
Authorization: Bearer <token>
```

**Response:**
```json
{
  "vendorId": "uuid",
  "riskScore": 75,
  "riskLevel": "Medium",
  "categories": {
    "security": 80,
    "compliance": 70,
    "financial": 75
  }
}
```

#### Get Vendor Risk Dashboard

```http
GET /api/vendors/dashboard
Authorization: Bearer <token>
```

---

### Enterprise Modules

#### Risk Management

- `POST /api/enterprise/risk-management/assessments` - Create risk assessment
- `GET /api/enterprise/risk-management/register` - Get risk register
- `GET /api/enterprise/risk-management/dashboard` - Get risk dashboard
- `GET /api/enterprise/risk-management/heatmap` - Get risk heatmap

#### Questionnaires

- `POST /api/enterprise/questionnaires` - Create questionnaire
- `POST /api/enterprise/questionnaires/:id/ai-generate` - AI-generate responses
- `POST /api/enterprise/questionnaires/:id/complete` - Complete questionnaire
- `GET /api/enterprise/questionnaires` - List questionnaires
- `GET /api/enterprise/questionnaires/metrics` - Get metrics

#### Policy Library

- `POST /api/enterprise/policies` - Create policy
- `POST /api/enterprise/policies/bulk-import` - Bulk import policies
- `GET /api/enterprise/policies/templates` - Get policy templates
- `GET /api/enterprise/policies` - List policies

#### Trust Center

- `GET /api/enterprise/trust-center/public/:organizationId` - Public trust center (no auth)
- `POST /api/enterprise/trust-center/certificates` - Create certificate
- `POST /api/enterprise/trust-center/generate-certificate` - Generate compliance certificate

#### Multi-Workspace

- `POST /api/enterprise/workspace/child-organizations` - Create child organization
- `GET /api/enterprise/workspace/hierarchy` - Get organization hierarchy
- `GET /api/enterprise/workspace/consolidated-metrics` - Get consolidated metrics

#### Reporting

- `POST /api/enterprise/reports` - Create custom report
- `GET /api/enterprise/reports/compliance` - Generate compliance report
- `GET /api/enterprise/reports/risk` - Generate risk report
- `GET /api/enterprise/reports/vendor-risk` - Generate vendor risk report
- `GET /api/enterprise/reports/executive-summary` - Generate executive summary

#### Monitoring

- `POST /api/enterprise/monitoring` - Create monitor
- `POST /api/enterprise/monitoring/:id/execute` - Execute monitor
- `GET /api/enterprise/monitoring/dashboard` - Get monitoring dashboard
- `GET /api/enterprise/monitoring` - List monitors

#### Issue Management

- `POST /api/enterprise/issues` - Create issue
- `POST /api/enterprise/issues/:id/assign` - Assign issue
- `POST /api/enterprise/issues/:id/comments` - Add comment
- `GET /api/enterprise/issues/dashboard` - Get issue dashboard
- `GET /api/enterprise/issues` - List issues

#### Visionary AI

- `GET /api/enterprise/visionary-ai/copilot/recommendations` - Get AI co-pilot recommendations
- `POST /api/enterprise/visionary-ai/predict-risks` - Predict future risks
- `POST /api/enterprise/visionary-ai/generate-policy` - Generate policy from natural language
- `POST /api/enterprise/visionary-ai/autopilot/run` - Run compliance autopilot
- `GET /api/enterprise/visionary-ai/benchmarking` - Get compliance benchmarking

---

### Integrations

#### Google Workspace

- `GET /api/integrations/google/authorize` - Start OAuth flow
- `GET /api/integrations/google/callback` - OAuth callback (public)
- `POST /api/integrations/google/sync` - Sync data
- `DELETE /api/integrations/google` - Disconnect

#### GitHub

- `GET /api/integrations/github/authorize` - Start OAuth flow
- `GET /api/integrations/github/callback` - OAuth callback (public)
- `POST /api/integrations/github/sync` - Sync data
- `DELETE /api/integrations/github` - Disconnect

#### Slack

- `GET /api/integrations/slack/authorize` - Start OAuth flow
- `GET /api/integrations/slack/callback` - OAuth callback (public)
- `POST /api/integrations/slack/sync` - Sync data
- `POST /api/integrations/slack/message` - Post message
- `DELETE /api/integrations/slack` - Disconnect

#### Jira

- `GET /api/integrations/jira/authorize` - Start OAuth flow
- `GET /api/integrations/jira/callback` - OAuth callback (public)
- `POST /api/integrations/jira/sync` - Sync data
- `POST /api/integrations/jira/issue` - Create issue
- `DELETE /api/integrations/jira` - Disconnect

#### AWS

- `POST /api/integrations/aws/connect` - Connect with IAM credentials
- `POST /api/integrations/aws/sync` - Sync data
- `DELETE /api/integrations/aws` - Disconnect

#### General

- `GET /api/integrations` - List all integrations
- `GET /api/integrations/:provider` - Get integration status

---

### Health Check

#### Health Check Endpoint

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-12-18T00:00:00Z",
  "uptime": 3600,
  "environment": "production",
  "websocket": "connected"
}
```

---

## WebSocket API

### Connection

```
ws://api.complyeasy.ai/ws
```

### Authentication

Pass JWT token during connection:
```javascript
const socket = io('ws://api.complyeasy.ai', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Events

#### Client → Server
- `subscribe:risks` - Subscribe to risk updates
- `subscribe:frameworks` - Subscribe to framework updates
- `unsubscribe:risks` - Unsubscribe from risk updates

#### Server → Client
- `risk:updated` - Risk was updated
- `framework:updated` - Framework was updated
- `ai:task:status` - AI task status update
- `integration:sync` - Integration sync status
- `audit:log` - New audit log entry
- `notification` - General notification

---

## Interactive API Documentation

Visit `/api/docs` in your browser for interactive Swagger UI documentation with:
- Try-it-out functionality
- Request/response examples
- Schema definitions
- Authentication testing

---

## SDKs and Client Libraries

### JavaScript/TypeScript

```bash
npm install @complyeasy/ai-sdk
```

```typescript
import { ComplyEasyClient } from '@complyeasy/ai-sdk';

const client = new ComplyEasyClient({
  apiKey: 'your-api-key',
  baseURL: 'https://api.complyeasy.ai'
});

const risks = await client.risks.list();
```

### Python

```bash
pip install complyeasy-ai
```

```python
from complyeasy import ComplyEasyClient

client = ComplyEasyClient(api_key='your-api-key')
risks = client.risks.list()
```

---

## Support

- **API Documentation:** https://api.complyeasy.ai/api/docs
- **Support Email:** support@complyeasy.ai
- **Status Page:** https://status.complyeasy.ai

---

**Last Updated:** December 18, 2024

