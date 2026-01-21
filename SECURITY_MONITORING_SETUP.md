# 🔒 SECURITY MONITORING (SIEM) SETUP GUIDE

**Purpose:** Set up Security Information and Event Management (SIEM) for real-time threat detection and incident response.

---

## 📊 OVERVIEW

SIEM systems collect, analyze, and correlate security events from multiple sources to detect threats and respond to incidents.

---

## 🎯 RECOMMENDED SIEM SOLUTIONS

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

## 🚀 RECOMMENDED: WAZUH SETUP (Free & Open Source)

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

```typescript
import winston from 'winston';
import { Client } from '@elastic/elasticsearch';

const wazuhClient = new Client({
  node: process.env.WAZUH_INDEXER_URL || 'http://localhost:9200',
  auth: {
    username: process.env.WAZUH_USERNAME || 'admin',
    password: process.env.WAZUH_PASSWORD || 'admin',
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

## 📡 LOG INTEGRATION

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
    logger.error('[SIEM] Failed to send security event', error);
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
  details: { reason: 'Invalid credentials', email: req.body.email },
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

## 🚨 ALERT RULES

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

## 📊 DASHBOARD CONFIGURATION

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

## 🔧 INTEGRATION WITH EXISTING MONITORING

**File:** `server/src/services/monitoringService.ts`

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

## 📋 SETUP CHECKLIST

- [ ] Choose SIEM solution (Wazuh recommended for free)
- [ ] Install and configure SIEM server
- [ ] Configure application log forwarding
- [ ] Set up security event logging
- [ ] Create alert rules
- [ ] Configure dashboards
- [ ] Test alert notifications
- [ ] Document incident response procedures
- [ ] Train team on SIEM usage

---

## 🎯 RECOMMENDED ALERTING CHANNELS

1. **Email:** For low/medium severity
2. **Slack/PagerDuty:** For high/critical severity
3. **SMS:** For critical incidents (optional)

---

## 📚 RESOURCES

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

