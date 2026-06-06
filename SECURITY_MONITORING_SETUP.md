# SECURITY MONITORING (SIEM) SETUP GUIDE

**Purpose:** Set up Security Information and Event Management (SIEM) for real-time threat detection and incident response.

**Last updated:** March 5, 2026

---

## OVERVIEW

SIEM systems collect, analyze, and correlate security events from multiple sources to detect threats and respond to incidents.

This guide covers:
1. What monitoring infrastructure **already exists** in the ComplyEasyAI codebase
2. Recommended SIEM solutions to layer on top
3. Step-by-step instructions for adding SIEM event forwarding

---

## EXISTING MONITORING INFRASTRUCTURE

The following monitoring capabilities are **already implemented** in the codebase. No additional work is required to use them -- only the relevant environment variables need to be set.

### a) Sentry Error Tracking (Implemented)

- **File:** `server/src/config/monitoring.ts`
- **Env vars:**
  - `SENTRY_ENABLED=true` -- master toggle (disabled by default)
  - `SENTRY_DSN` -- Sentry Data Source Name (required when enabled)
  - `SENTRY_TRACES_SAMPLE_RATE` -- performance trace sampling (default `0.1`)
  - `SENTRY_PROFILES_SAMPLE_RATE` -- profiling sampling (default `0.1`)
- **Features:**
  - Error capturing with `captureException()` and `captureMessage()`
  - HTTP tracing integration (automatic request instrumentation)
  - Express integration (route-level performance data)
  - Profiling support via `@sentry/profiling-node`
  - Sensitive data filtering in `beforeSend` (strips `authorization`, `cookie` headers and `token`/`password` query params)
  - Breadcrumb support for debugging context
  - User context tracking (`setUserContext()` / `clearUserContext()`)
- **Status:** Fully implemented, optional (controlled by `SENTRY_ENABLED`)

### b) Elastic APM (Implemented)

- **File:** `server/src/config/monitoring.ts`
- **Env vars:**
  - `APM_ENABLED` -- master toggle (disabled by default)
  - `ELASTIC_APM_SERVER_URL` -- APM server endpoint
  - `ELASTIC_APM_SECRET_TOKEN` -- authentication token (optional)
  - `ELASTIC_APM_API_KEY` -- API key authentication (optional)
  - `ELASTIC_APM_SAMPLE_RATE` -- transaction sample rate (default `0.1`)
  - `APM_SERVICE_NAME` -- service identifier (default: `complyeasy-api`)
- **Status:** Fully implemented, optional. Enable by setting `APM_ENABLED=true` and `ELASTIC_APM_SERVER_URL`.

### c) Elasticsearch Logging (Implemented)

- **File:** `server/src/config/elasticsearch.ts`
- **Env vars:**
  - `ELASTICSEARCH_ENABLED` -- master toggle (disabled by default)
  - `ELASTICSEARCH_URL` -- Elasticsearch node URL (default: `http://localhost:9200`)
  - `ELASTICSEARCH_USERNAME` -- basic auth username (optional)
  - `ELASTICSEARCH_PASSWORD` -- basic auth password (optional)
  - `ELASTICSEARCH_INDEX_PREFIX` -- index name prefix (default: `complyeasy`)
  - `ELASTICSEARCH_LOG_LEVEL` -- minimum log level to send (default: `info`)
  - `ELASTICSEARCH_SSL_REJECT_UNAUTHORIZED` -- set to `false` for self-signed certs
- **Features:** Winston transport that buffers logs in memory when ES is temporarily unavailable, automatic index template management, health-check ping on startup.
- **Status:** Fully implemented, optional. Enable by setting `ELASTICSEARCH_ENABLED=true`.

### d) Winston Logging (Implemented)

- **File:** `server/src/config/logger.ts`
- **Env vars:**
  - `LOG_LEVEL` -- minimum log level (default: `info`)
  - `LOG_CONSOLE` -- console output toggle (default: `true`; always enabled in non-production)
  - `LOG_FILE` -- file output toggle (default: `true`)
- **Features:**
  - Structured JSON logging with timestamp, level, and message
  - Automatic log sanitization (strips sensitive data via `logSanitizer`)
  - Separate log files: `logs/error.log`, `logs/combined.log`, `logs/access.log`
  - Exception and rejection handlers: `logs/exceptions.log`, `logs/rejections.log`
  - Colorized console output in development
- **Status:** Fully implemented and active by default.

### e) New Relic (Configured)

- **File:** `server/src/config/monitoring.ts`
- **Env var:** `NEW_RELIC_LICENSE_KEY`
- **Status:** Supported but optional. Set the license key and the module is loaded automatically when `APM_ENABLED=true`.

### f) Correlation ID Middleware (Implemented)

- **File:** `server/src/middleware/correlationId.ts`
- **Features:**
  - Adds a unique `X-Correlation-ID` and `X-Request-ID` to every request
  - Accepts upstream correlation IDs for distributed tracing
  - Exposes helper functions: `getCorrelationId()`, `getRequestId()`, `getTracingHeaders()`
- **Status:** Fully implemented and active.

### g) Error Handler with Monitoring Integration (Implemented)

- **File:** `server/src/middleware/errorHandler.ts`
- **Features:**
  - Sends unhandled errors to Sentry via `monitoring.captureException()`
  - Includes request context (method, path, query) and user context in error reports
  - Distinguishes operational errors (`AppError`) from unexpected errors
- **Status:** Fully implemented and active.

---

## RECOMMENDED SIEM SOLUTIONS

### 1. Cloud-Based Solutions (Recommended for Startups)

#### **Splunk Cloud**
- **Pros:** Enterprise-grade, powerful analytics
- **Cons:** Expensive
- **Best for:** Large enterprises
- **Pricing:** Contact sales

#### **Datadog Security Monitoring**
- **Pros:** Easy integration, good for cloud-native apps
- **Cons:** Can be expensive at scale
- **Best for:** Cloud-first organizations
- **Pricing:** $0.10 per log GB ingested

#### **Sumo Logic**
- **Pros:** Good analytics, reasonable pricing
- **Cons:** Learning curve
- **Best for:** Mid-size companies
- **Pricing:** $2 per GB ingested

#### **Elastic Security (ELK Stack)**
- **Pros:** Open source, highly customizable
- **Cons:** Requires technical expertise
- **Best for:** Technical teams
- **Pricing:** Free (self-hosted) or $95/month (cloud)

---

### 2. Self-Hosted Solutions

#### **Wazuh**
- **Pros:** Free, open source, comprehensive
- **Cons:** Requires infrastructure
- **Best for:** Cost-conscious organizations
- **Setup:** See below

#### **Security Onion**
- **Pros:** Complete security suite, free
- **Cons:** Resource intensive
- **Best for:** Security-focused teams

---

## RECOMMENDED: WAZUH SETUP (Free & Open Source)

### Prerequisites
- Ubuntu 20.04+ or CentOS 7+
- 4GB RAM minimum (8GB recommended)
- 20GB disk space

### Installation

```bash
# 1. Install Wazuh manager
curl -s https://packages.wazuh.com/key/GPG-KEY-WAZUH | gpg --no-default-keyring --keyring gnupg-ring:/usr/share/keyrings/wazuh.gpg --import && \
chmod 644 /usr/share/keyrings/wazuh.gpg && \
echo "deb [signed-by=/usr/share/keyrings/wazuh.gpg] https://packages.wazuh.com/4.x/apt/ stable main" | tee -a /etc/apt/sources.list.d/wazuh.list

apt-get update
apt-get install wazuh-manager
systemctl daemon-reload
systemctl enable wazuh-manager
systemctl start wazuh-manager

# 2. Install Wazuh indexer
apt-get install wazuh-indexer
systemctl daemon-reload
systemctl enable wazuh-indexer
systemctl start wazuh-indexer

# 3. Install Wazuh dashboard
apt-get install wazuh-dashboard
systemctl daemon-reload
systemctl enable wazuh-dashboard
systemctl start wazuh-dashboard
```

### Configure Application Logs

**File:** `server/src/config/logger.ts`

Add Wazuh transport:

```typescript
import { createElasticsearchTransport } from './wazuhTransport';

// Add to transports array
if (process.env.WAZUH_ENABLED === 'true') {
  transports.push(createElasticsearchTransport());
}
```

**File:** `server/src/config/wazuhTransport.ts` (Create)

> **Note:** This file does not yet exist in the codebase. The code below is a recommended implementation.

```typescript
import winston from 'winston';
import { Client } from '@elastic/elasticsearch';

const wazuhClient = new Client({
  node: process.env.WAZUH_INDEXER_URL || 'http://localhost:9200',
  auth: {
    // Fail closed: require explicitly provisioned credentials rather than
    // falling back to a well-known default.
    username: process.env.WAZUH_USERNAME ?? (() => { throw new Error('WAZUH_USERNAME is required'); })(),
    password: process.env.WAZUH_PASSWORD ?? (() => { throw new Error('WAZUH_PASSWORD is required'); })(),
  },
});

export function createElasticsearchTransport() {
  return new winston.transports.Http({
    host: process.env.WAZUH_INDEXER_URL || 'localhost',
    port: 9200,
    path: '/_bulk',
    format: winston.format.json(),
  });
}
```

---

## LOG INTEGRATION

### 1. Application Logs

**Configure Winston to send to SIEM:**

```typescript
// server/src/config/logger.ts
const siemTransport = new winston.transports.Http({
  host: process.env.SIEM_HOST || 'localhost',
  port: process.env.SIEM_PORT || 514,
  path: '/logs',
  format: winston.format.json(),
});
```

### 2. Security Events to Monitor

**Create Security Event Logger:**

**File:** `server/src/utils/securityEventLogger.ts` (Create)

> **Note:** This file does not yet exist in the codebase. The code below is a recommended implementation.

```typescript
import logger from '../config/logger';

export interface SecurityEvent {
  type: 'authentication' | 'authorization' | 'injection_attempt' | 'ssrf_attempt' | 'rate_limit' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ipAddress: string;
  userAgent?: string;
  details: Record<string, any>;
  timestamp: Date;
}

export function logSecurityEvent(event: SecurityEvent) {
  const logEntry = {
    event_type: 'security_event',
    ...event,
    timestamp: event.timestamp.toISOString(),
  };

  // Log to application logs
  logger.warn(`[Security Event] ${event.type}`, logEntry);

  // Send to SIEM (if configured)
  if (process.env.SIEM_ENABLED === 'true') {
    // Send via HTTP, syslog, or direct API
    sendToSIEM(logEntry);
  }
}

async function sendToSIEM(event: any) {
  try {
    await fetch(process.env.SIEM_ENDPOINT || 'http://localhost:514', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
  } catch (error) {
    logger.error('[SIEM] Failed to send security event', { error: error instanceof Error ? error.message : String(error) });
  }
}
```

### 3. Security Event Triggers

**Add to existing code:**

```typescript
// server/src/middleware/auth.ts
import { logSecurityEvent } from '../utils/securityEventLogger';

// On failed authentication
logSecurityEvent({
  type: 'authentication',
  severity: 'medium',
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  details: { reason: 'Invalid credentials', userId: req.user?.id },
  timestamp: new Date(),
});

// server/src/utils/urlValidator.ts
// On SSRF attempt
logSecurityEvent({
  type: 'ssrf_attempt',
  severity: 'high',
  ipAddress: req.ip,
  details: { blockedUrl: url },
  timestamp: new Date(),
});
```

---

## ENVIRONMENT VARIABLES FOR SIEM

The following environment variables would need to be added to `.env` (and `.env.example`) if implementing SIEM integration. **These are NOT currently defined in the codebase.**

| Variable | Purpose | Example |
|---|---|---|
| `SIEM_ENABLED` | Enable SIEM event forwarding | `true` |
| `SIEM_ENDPOINT` | Syslog or HTTP endpoint for SIEM | `http://siem.example.com:514` |
| `WAZUH_ENABLED` | Enable Wazuh log transport | `true` |
| `WAZUH_INDEXER_URL` | Wazuh indexer URL | `http://localhost:9200` |
| `WAZUH_USERNAME` | Wazuh indexer username | set a unique non-default username |
| `WAZUH_PASSWORD` | Wazuh indexer password | set a strong unique credential (no default) |

---

## ALERT RULES

### Critical Alerts (Immediate Response)

1. **Multiple Failed Login Attempts**
   - Threshold: 5 failures in 5 minutes
   - Action: Block IP, notify security team

2. **Command Injection Attempt**
   - Threshold: Any attempt
   - Action: Block IP, alert security team

3. **SSRF Attempt**
   - Threshold: Any attempt
   - Action: Block IP, log for investigation

4. **Suspicious API Activity**
   - Threshold: 1000+ requests/minute from single IP
   - Action: Rate limit, investigate

### Warning Alerts (Review Required)

1. **Unusual Access Patterns**
   - Threshold: Access from new country
   - Action: Flag for review

2. **Privilege Escalation Attempts**
   - Threshold: Any attempt
   - Action: Log and review

3. **Data Export Anomalies**
   - Threshold: Large data exports
   - Action: Review and verify

---

## DASHBOARD CONFIGURATION

### Key Metrics to Monitor

1. **Authentication Events**
   - Successful logins
   - Failed logins
   - 2FA usage

2. **Security Events**
   - Injection attempts
   - SSRF attempts
   - Rate limit violations

3. **API Activity**
   - Request volume
   - Error rates
   - Response times

4. **System Health**
   - Server resources
   - Database performance
   - Service availability

---

## INTEGRATION WITH EXISTING MONITORING

**File:** `server/src/config/monitoring.ts`

Add SIEM integration:

```typescript
async logSecurityMetric(event: SecurityEvent) {
  // Existing monitoring
  await this.recordMetric('security_event', event);

  // SIEM integration
  if (process.env.SIEM_ENABLED === 'true') {
    await logSecurityEvent(event);
  }
}
```

---

## SETUP CHECKLIST

### Already Implemented

- [x] Application logging (Winston) -- active by default
- [x] Error tracking (Sentry) -- enable with `SENTRY_ENABLED=true` and `SENTRY_DSN`
- [x] APM (Elastic APM) -- enable with `APM_ENABLED=true` and `ELASTIC_APM_SERVER_URL`
- [x] Elasticsearch log transport -- enable with `ELASTICSEARCH_ENABLED=true`
- [x] Correlation IDs for distributed tracing -- active by default
- [x] Error handler with Sentry integration -- active by default
- [x] New Relic support -- enable with `NEW_RELIC_LICENSE_KEY`

### Still Needed for SIEM

- [ ] Choose SIEM solution (Wazuh recommended for free)
- [ ] Install and configure SIEM server
- [ ] Add SIEM env vars to `.env` and `.env.example`
- [ ] Create `server/src/utils/securityEventLogger.ts`
- [ ] Create `server/src/config/wazuhTransport.ts` (if using Wazuh)
- [ ] Configure application log forwarding to SIEM
- [ ] Create alert rules
- [ ] Configure dashboards
- [ ] Test alert notifications
- [ ] Document incident response procedures
- [ ] Train team on SIEM usage

---

## RECOMMENDED ALERTING CHANNELS

1. **Email:** For low/medium severity
2. **Slack/PagerDuty:** For high/critical severity
3. **SMS:** For critical incidents (optional)

---

## RESOURCES

- **Wazuh Documentation:** https://documentation.wazuh.com/
- **Splunk Security:** https://www.splunk.com/en_us/software/security-information-and-event-management.html
- **Datadog Security:** https://www.datadoghq.com/product/security-monitoring/

---

**Next Steps:**
1. Choose SIEM solution based on budget and requirements
2. Set up infrastructure
3. Configure log forwarding
4. Create alert rules
5. Test and validate
