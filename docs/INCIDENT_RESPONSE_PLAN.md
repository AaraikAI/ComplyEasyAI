# ComplyEasyAI -- Incident Response Plan

> **Document Classification:** Confidential -- Internal
> **Version:** 1.0
> **Owner:** Chief Information Security Officer (CISO), AARAIK LLC
> **Effective Date:** 2026-03-08
> **Next Review Date:** 2026-06-08
> **Review Cadence:** Quarterly
> **Approval:** [CISO Signature] | [CEO Signature] | [DPO Signature]
> **SOC 2 Mapping:** CC7.2, CC7.3, CC7.4, CC7.5

---

## Table of Contents

1. [Purpose and Scope](#1-purpose-and-scope)
2. [Incident Classification Matrix](#2-incident-classification-matrix)
3. [Roles and Responsibilities](#3-roles-and-responsibilities)
4. [Escalation Matrix](#4-escalation-matrix)
5. [Detection and Reporting](#5-detection-and-reporting)
6. [Containment Procedures](#6-containment-procedures)
7. [Eradication and Recovery](#7-eradication-and-recovery)
8. [Communication Procedures](#8-communication-procedures)
9. [Post-Incident Review Template](#9-post-incident-review-template)
10. [Annual Testing Schedule](#10-annual-testing-schedule)
11. [Document Control](#11-document-control)

---

## 1. Purpose and Scope

### 1.1 Purpose

This Incident Response Plan (IRP) establishes a structured, repeatable process for identifying, containing, eradicating, and recovering from security incidents affecting ComplyEasyAI systems, data, and services. The plan ensures that:

- Security incidents are detected and responded to promptly and consistently.
- Business impact is minimized through predefined containment and recovery procedures.
- Regulatory obligations (GDPR Article 33/34, SOC 2 CC7.x, CCPA) are met regarding breach notification timelines.
- Lessons learned are captured and integrated into continuous improvement.
- All actions taken during an incident are documented for audit and legal purposes.

### 1.2 Scope

This plan covers **all** ComplyEasyAI systems, personnel, and third-party services, including but not limited to:

| Category | Components |
|----------|------------|
| **Compute** | ECS Fargate containers (API + Web), Node.js 20 runtime |
| **Data Stores** | Supabase PostgreSQL 16, ElastiCache Redis 7, AWS S3 |
| **Networking** | AWS CloudFront CDN, Application Load Balancer (ALB), Route 53 DNS |
| **Security** | AWS Secrets Manager, AWS KMS, FIPS-validated cryptographic modules |
| **Third-Party Services** | Stripe (payments), SendGrid (email), Sentry (error tracking), Elastic APM (performance), Google Gemini AI |
| **Personnel** | All AARAIK LLC employees, contractors, and authorized third-party personnel with access to ComplyEasyAI systems |
| **Client Data** | All customer compliance data, PII, authentication credentials, billing information, and AI-processed queries |

### 1.3 Applicability

This plan applies to all environments: production (`complyeasyai.com`), staging (`staging.complyeasyai.com`), and development. Production incidents receive the highest priority. Staging and development incidents follow the same process with relaxed response time targets (2x production SLA).

---

## 2. Incident Classification Matrix

### 2.1 Severity Levels

| Severity | Name | Description | Response Time | Update Frequency | Examples |
|----------|------|-------------|---------------|------------------|----------|
| **SEV1** | Critical | Active data breach, complete service outage, active exploitation of vulnerabilities, ransomware | **< 15 minutes** | Every 30 minutes | Data exfiltration confirmed; all ECS tasks down; active SQL injection; credential stuffing with confirmed access |
| **SEV2** | High | Partial service outage, authentication bypass, unauthorized data access, single-region failure | **< 1 hour** | Every 2 hours | Auth service failure; privilege escalation; unauthorized API access; database replication lag > 5 min |
| **SEV3** | Medium | Performance degradation, failed security scans, suspicious activity, non-critical vulnerability discovered | **< 4 hours** | Every 8 hours | API latency > 5s p99; Trivy CRITICAL finding; unusual login pattern; certificate approaching expiry |
| **SEV4** | Low | Minor policy violations, informational security alerts, low-severity vulnerability, configuration drift | **< 24 hours** | Daily | Dependency audit warning; minor CSP violation; unused IAM role detected; documentation gap |

### 2.2 SecurityEventType Mapping

The following table maps `SecurityEventType` values (defined in `server/src/utils/securityEventLogger.ts`) to incident severity levels and required response actions:

| SecurityEventType | Default Severity | Escalation Trigger | Automated Action |
|-------------------|-----------------|---------------------|------------------|
| `AUTHENTICATION_FAILURE` | SEV4 (single) / **SEV2** (>10/min from single IP) | 10+ failures in 60s from same IP or user | Rate limit applied; IP flagged in WAF |
| `AUTHENTICATION_SUCCESS` | Informational | Anomalous login (new geo, device) | Alert to user; log for correlation |
| `AUTHORIZATION_FAILURE` | SEV3 (single) / **SEV1** (confirmed bypass) | Repeated access to unauthorized resources | Session terminated; access revoked |
| `CSRF_VALIDATION_FAILURE` | **SEV2** | Any occurrence (indicates active attack) | Request blocked; session invalidated |
| `RATE_LIMIT_EXCEEDED` | SEV4 (single) / **SEV3** (sustained) | >100 blocked requests in 5 min from single source | IP blocked at CloudFront WAF |
| `SSRF_ATTEMPT` | **SEV2** | Any occurrence | Request blocked; URL logged for investigation |
| `SUSPICIOUS_INPUT` | SEV3 / **SEV1** (confirmed injection) | SQL injection, XSS, or command injection payload detected | Request blocked; WAF rule updated |
| `PASSWORD_CHANGED` | Informational / **SEV2** (unauthorized) | Change without valid session or from new device | Account locked; notification sent to user |
| `ACCOUNT_LOCKED` | SEV4 (auto-lock) / **SEV2** (manual lock by admin) | 5+ consecutive auth failures | Account locked; admin notified |
| `SESSION_TERMINATED` | Informational / **SEV3** (bulk termination) | >10 sessions terminated in 1 min | Investigate potential compromise |
| `TOKEN_REVOKED` | Informational / **SEV2** (unexpected revocation) | Token revoked without user-initiated logout | Investigate session hijacking |
| `TOKEN_EXPIRED` | Informational | Normal expiry | None (standard behavior) |
| `TWO_FACTOR_FAILURE` | SEV3 / **SEV1** (>5 failures on single account) | Repeated 2FA bypass attempts | Account locked; admin alerted |
| `TWO_FACTOR_SUCCESS` | Informational | N/A | Log for audit trail |
| `SECURITY_EXCEPTION` | **SEV2** | Any unhandled security exception | Logged to Sentry; on-call alerted |

### 2.3 Severity Determination Flowchart

```
START: Security event detected
  |
  v
Is customer data exposed or at risk?
  |-- YES --> Is data actively being exfiltrated?
  |             |-- YES --> SEV1 (Critical)
  |             |-- NO  --> SEV2 (High)
  |-- NO  --> Is service availability impacted?
                |-- YES --> Is it a complete outage?
                |             |-- YES --> SEV1 (Critical)
                |             |-- NO  --> SEV2 (High)
                |-- NO  --> Is there active exploitation?
                              |-- YES --> SEV2 (High)
                              |-- NO  --> Is there a confirmed vulnerability?
                                            |-- YES --> SEV3 (Medium)
                                            |-- NO  --> SEV4 (Low)
```

---

## 3. Roles and Responsibilities

### 3.1 Incident Response Team (IRT) Roster

| Role | Primary | Backup | Contact Method |
|------|---------|--------|----------------|
| **Incident Commander (IC)** | CISO | CTO | PagerDuty, Slack #incident, Mobile |
| **Communications Lead** | Head of Customer Success | CEO | Slack #incident, Email |
| **Technical Lead** | Senior Platform Engineer | Backend Lead | PagerDuty, Slack #incident |
| **Legal/DPO Liaison** | Data Protection Officer | External Legal Counsel | Email, Mobile |

### 3.2 Role Definitions

#### Incident Commander (IC)
- **Authority:** Full authority to make decisions during the incident, including service shutdown, data isolation, and resource allocation.
- **Responsibilities:**
  - Declare incident severity and initiate the IRP.
  - Coordinate all response activities across teams.
  - Make go/no-go decisions on containment actions.
  - Authorize external communications and regulatory notifications.
  - Ensure all actions are logged in the incident timeline.
  - Escalate or de-escalate severity as facts emerge.
  - Declare incident resolution and initiate post-incident review.

#### Communications Lead
- **Authority:** Sole authority for external communications during the incident.
- **Responsibilities:**
  - Draft and distribute internal status updates to the Slack `#incident` channel.
  - Prepare customer-facing communications (email, status page updates).
  - Coordinate with Legal/DPO on regulatory notification language.
  - Manage media inquiries (if applicable).
  - Maintain communication log with timestamps.

#### Technical Lead
- **Authority:** Authority over all technical response actions (containment, eradication, recovery).
- **Responsibilities:**
  - Lead technical investigation and root cause analysis.
  - Execute containment procedures (Section 6).
  - Coordinate eradication and recovery (Section 7).
  - Collect and preserve forensic evidence.
  - Provide technical briefings to the IC.
  - Document technical timeline and artifacts.

#### Legal/DPO Liaison
- **Authority:** Authority over legal and regulatory matters.
- **Responsibilities:**
  - Assess regulatory notification obligations (GDPR 72-hour, CCPA, etc.).
  - Prepare and submit Data Protection Authority (DPA) notifications.
  - Advise on data subject notification requirements.
  - Coordinate with external legal counsel as needed.
  - Review all external communications for legal accuracy.
  - Preserve evidence chain-of-custody documentation.

### 3.3 On-Call Schedule

- Primary on-call rotation: 7-day shifts, 24/7 coverage.
- Managed via PagerDuty with automatic escalation.
- Escalation path: On-Call Engineer (5 min) --> Technical Lead (15 min) --> IC (30 min).
- All IRT members must acknowledge alerts within their severity-specific response time.

---

## 4. Escalation Matrix

### 4.1 Escalation Paths by Severity

| Severity | Initial Notification | Escalation if No Response | Executive Notification | Customer Notification |
|----------|---------------------|--------------------------|----------------------|----------------------|
| **SEV1** | IC + Technical Lead + DPO immediately | CTO at +15 min, CEO at +30 min | CEO within 30 min | Within 2 hours of confirmation |
| **SEV2** | IC + Technical Lead within 1 hour | IC at +30 min if no Technical Lead response | CTO within 2 hours | Within 24 hours if data involved |
| **SEV3** | Technical Lead within 4 hours | IC at +4 hours if unresolved | Weekly summary report | Not required unless customer-facing |
| **SEV4** | Assigned engineer within 24 hours | Technical Lead at +48 hours if unresolved | Monthly summary report | Not required |

### 4.2 Automated Escalation Triggers

The following conditions trigger automatic escalation regardless of initial severity classification:

| Condition | Action | New Severity |
|-----------|--------|-------------|
| Any confirmed data exfiltration | Immediate SEV1 declaration | SEV1 |
| Complete service outage > 5 min | Auto-escalate to SEV1 | SEV1 |
| > 50 `AUTHENTICATION_FAILURE` events in 5 min | Auto-escalate; WAF block | SEV2 |
| `CSRF_VALIDATION_FAILURE` or `SSRF_ATTEMPT` detected | Alert IC immediately | SEV2 |
| ECS task count drops to 0 | Auto-escalate; PagerDuty critical | SEV1 |
| Database connection pool exhaustion | Auto-escalate | SEV2 |
| Sentry error rate > 10x baseline | Auto-escalate | SEV2 |

### 4.3 Response Time Compliance Tracking

All response times are measured from the moment of first detection (alert trigger time) to the moment the first responder acknowledges and begins investigation. Response time compliance is tracked monthly and reported in the Security Operations Dashboard.

| Metric | Target | Measurement |
|--------|--------|-------------|
| SEV1 Acknowledgment | < 15 min | PagerDuty acknowledgment timestamp |
| SEV2 Acknowledgment | < 1 hour | PagerDuty acknowledgment or Slack thread creation |
| SEV3 Acknowledgment | < 4 hours | Jira ticket assignment timestamp |
| SEV4 Acknowledgment | < 24 hours | Jira ticket assignment timestamp |
| Post-Incident Review Completion | < 5 business days (SEV1/2), < 10 business days (SEV3/4) | Review document published |

---

## 5. Detection and Reporting

### 5.1 Detection Sources

ComplyEasyAI employs a defense-in-depth detection strategy with multiple overlapping monitoring systems:

#### 5.1.1 Sentry -- Error Tracking and Alerting

- **Purpose:** Real-time application error tracking with stack traces, breadcrumbs, and user context.
- **Configuration:**
  - Environment-tagged (production, staging).
  - PII scrubbed from error payloads before transmission.
  - Alert rules configured for:
    - New error types (first occurrence).
    - Error frequency spikes (>10x baseline in 5 min).
    - Specific error patterns: `AUTHENTICATION_FAILURE`, unhandled promise rejections, database connection errors.
- **Integration:** Slack `#alerts-sentry`, PagerDuty (SEV1/2 errors).

#### 5.1.2 Elastic APM -- Performance Monitoring

- **Purpose:** Distributed tracing, transaction performance monitoring, and anomaly detection.
- **Configuration:**
  - All API endpoints instrumented with Elastic APM Node.js agent.
  - Transaction traces with full request/response metadata (PII excluded).
  - Anomaly detection ML jobs for:
    - Response time anomalies (p99 > 5s).
    - Throughput drops (>50% reduction).
    - Error rate spikes.
- **Integration:** Kibana dashboards, PagerDuty for anomalies.

#### 5.1.3 Winston Structured Logging -- Security Event Categories

- **Purpose:** Centralized, structured logging with dedicated security event categorization.
- **Implementation:** `server/src/utils/securityEventLogger.ts` provides typed security event logging via `logSecurityEvent()`.
- **Security Event Categories:**
  - `category: 'security'` -- All events from `SecurityEventType` enum.
  - Severity levels: `low`, `medium`, `high`, `critical` mapped to Winston log levels.
  - Fields captured: `eventType`, `severity`, `ip`, `method`, `path`, `userId`, `correlationId`.
- **Log Destinations:** stdout (container logs) --> CloudWatch Logs --> Elasticsearch (SIEM).
- **Alert Rules:**
  - `AUTHENTICATION_FAILURE` with `severity: 'high'` -- PagerDuty.
  - `SSRF_ATTEMPT` or `CSRF_VALIDATION_FAILURE` -- Immediate Slack notification.
  - Any `severity: 'critical'` event -- PagerDuty + IC notification.

#### 5.1.4 Falco -- Runtime Container Security

- **Purpose:** Runtime threat detection for containerized workloads on ECS Fargate.
- **Detection Rules:**
  - Unexpected process execution inside containers.
  - File system modifications to read-only paths.
  - Network connections to unauthorized destinations.
  - Privilege escalation attempts.
  - Sensitive file access (e.g., `/etc/shadow`, environment variable dumps).
- **Integration:** CloudWatch Logs, SNS --> PagerDuty.

#### 5.1.5 Prometheus + Alertmanager -- Infrastructure Alerting

- **Purpose:** Infrastructure-level metrics collection and alerting.
- **Key Alerts:**
  - `ECSTaskCountLow`: Fewer than minimum desired tasks running.
  - `DatabaseConnectionPoolExhausted`: PostgreSQL connection pool > 90% utilized.
  - `RedisMemoryHigh`: ElastiCache memory usage > 80%.
  - `CertificateExpiringSoon`: TLS certificate expiring within 14 days.
  - `DiskSpaceWarning`: Container ephemeral storage > 85%.
  - `HighErrorRate`: HTTP 5xx rate > 1% of total requests.
- **Integration:** Alertmanager --> PagerDuty, Slack `#alerts-infra`.

### 5.2 Reporting Channels

Any person who suspects or identifies a security incident must report it immediately through one of the following channels:

| Channel | Use Case | Response |
|---------|----------|----------|
| **PagerDuty** | Automated alerts from monitoring systems | Auto-creates incident; pages on-call |
| **Slack #incident** | Human-reported incidents from engineering | IC triages within response SLA |
| **Email: security@aaraik.com** | External reports, customer reports, responsible disclosure | Acknowledged within 4 hours; triaged within 24 hours |
| **Intercom / Support** | Customer-reported issues that may indicate security incidents | Support escalates to engineering; IC reviews |

### 5.3 Incident Declaration

An incident is formally declared when:

1. An automated alert triggers a PagerDuty incident at SEV1 or SEV2, OR
2. A human responder determines that a security event meets SEV1-SEV3 criteria, OR
3. A customer reports a confirmed security issue (data exposure, unauthorized access).

Upon declaration, the IC:
1. Creates a dedicated Slack channel: `#inc-YYYY-MM-DD-brief-description`.
2. Posts the initial incident summary (severity, impact, initial assessment).
3. Assigns roles (Technical Lead, Communications Lead) if not already on-call.
4. Starts the incident timeline document.

---

## 6. Containment Procedures

### 6.1 Immediate Containment Actions by Category

All containment actions must be logged in the incident timeline with executor, timestamp, and justification.

#### 6.1.1 ECS Task Stop/Restart

**When:** Compromised container, malicious code execution, runaway process.

```bash
# Stop a specific compromised task
aws ecs stop-task \
  --cluster complyeasy-production \
  --task <task-id> \
  --reason "IRP containment: incident INC-YYYY-MM-DD-XXX"

# Force new deployment with fresh containers
aws ecs update-service \
  --cluster complyeasy-production \
  --service complyeasy-production-api \
  --force-new-deployment

# Verify new tasks are healthy
aws ecs wait services-stable \
  --cluster complyeasy-production \
  --services complyeasy-production-api
```

**Impact:** Brief service interruption (30-60 seconds) during task rotation. ECS circuit breaker prevents rollback loops.

#### 6.1.2 Redis Flush -- Session and CSRF Invalidation

**When:** Suspected session hijacking, CSRF token compromise, cache poisoning.

```bash
# Flush all sessions and CSRF tokens (ElastiCache)
redis-cli -h <elasticache-endpoint> -p 6379 --tls FLUSHDB

# Alternatively, flush specific key patterns:
# Invalidate all sessions
redis-cli -h <elasticache-endpoint> EVAL "for _,k in ipairs(redis.call('keys','sess:*')) do redis.call('del',k) end" 0

# Invalidate all CSRF tokens
redis-cli -h <elasticache-endpoint> EVAL "for _,k in ipairs(redis.call('keys','csrf:*')) do redis.call('del',k) end" 0

# Invalidate rate limit counters (if rate limiter is compromised)
redis-cli -h <elasticache-endpoint> EVAL "for _,k in ipairs(redis.call('keys','rl:*')) do redis.call('del',k) end" 0
```

**Impact:** All active user sessions terminated. Users must re-authenticate. CSRF tokens regenerated on next request.

#### 6.1.3 JWT Token Blacklist via tokenBlacklistService

**When:** Compromised JWT secret, stolen tokens, unauthorized access via valid token.

```typescript
// Blacklist a specific compromised token (via admin API or direct service call)
// Implementation: server/src/middleware/auth.ts checks blacklist on every request

// Blacklist all tokens issued before a specific timestamp
// (effectively invalidating all existing JWTs)
await redis.set('jwt:blacklist:global', Date.now().toString());

// Blacklist tokens for a specific user
await redis.set(`jwt:blacklist:user:${userId}`, Date.now().toString());
```

**Impact:** Blacklisted tokens rejected on next API request. Users must re-authenticate with credentials.

#### 6.1.4 CloudFront Cache Invalidation

**When:** Cached content contains sensitive data, XSS payload served from cache, stale security headers.

```bash
# Invalidate all cached content
aws cloudfront create-invalidation \
  --distribution-id <distribution-id> \
  --paths "/*"

# Invalidate specific paths
aws cloudfront create-invalidation \
  --distribution-id <distribution-id> \
  --paths "/api/*" "/static/js/*"
```

**Impact:** Temporary increase in origin requests until cache is repopulated. No user-facing impact.

#### 6.1.5 Database Connection Termination

**When:** SQL injection confirmed, unauthorized database access, connection pool poisoning.

```sql
-- Terminate all active connections from the application
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'postgres'
  AND pid <> pg_backend_pid()
  AND application_name LIKE 'complyeasyai%';

-- Revoke and rotate application database credentials
ALTER USER app_user WITH PASSWORD '<new-password>';

-- Check for unauthorized connections
SELECT pid, usename, client_addr, application_name, state, query
FROM pg_stat_activity
WHERE usename NOT IN ('supabase_admin', 'app_user')
  AND state = 'active';
```

**Impact:** All active API connections terminated. New connections established with rotated credentials. Brief service interruption (5-15 seconds).

### 6.2 Network-Level Containment

| Action | Command | When |
|--------|---------|------|
| Block IP at CloudFront WAF | `aws wafv2 update-ip-set --name blocked-ips --addresses <ip>/32` | Confirmed malicious source IP |
| Restrict security group ingress | `aws ec2 revoke-security-group-ingress` | Unauthorized network access |
| Enable CloudFront geo-restriction | CloudFront distribution settings | Attack from specific country |
| ALB listener rule to deny | `aws elbv2 create-rule --conditions path-pattern --actions type=fixed-response` | Block specific attack path |

---

## 7. Eradication and Recovery

### 7.1 Eradication Procedures

#### 7.1.1 Secret Rotation

If any secret is suspected to be compromised, follow the complete rotation procedure documented in **[docs/SECRET_ROTATION_RUNBOOK.md](SECRET_ROTATION_RUNBOOK.md)**.

**Critical secrets and rotation order:**

| Priority | Secret | Rotation Method | Validation |
|----------|--------|----------------|------------|
| 1 | `JWT_SECRET` / `JWT_REFRESH_SECRET` | AWS Secrets Manager | All sessions invalidated; users can re-login |
| 2 | `ENCRYPTION_KEY` | AWS Secrets Manager + re-encryption migration | Encrypted fields decryptable with new key |
| 3 | `DATABASE_URL` | Supabase Dashboard + AWS Secrets Manager | Database connections re-established |
| 4 | `GEMINI_API_KEY` | Google AI Studio + AWS Secrets Manager | AI features functional |
| 5 | `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard + AWS Secrets Manager | Billing operations functional |
| 6 | `SENDGRID_API_KEY` | SendGrid Dashboard + AWS Secrets Manager | Email delivery functional |
| 7 | `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | AWS IAM Console | Infrastructure operations functional |

```bash
# Atomic secret update in AWS Secrets Manager
aws secretsmanager put-secret-value \
  --secret-id complyeasy-production/app-secrets \
  --secret-string '{"JWT_SECRET":"<new>","JWT_REFRESH_SECRET":"<new>"}'

# Force ECS to pick up new secrets
aws ecs update-service \
  --cluster complyeasy-production \
  --service complyeasy-production-api \
  --force-new-deployment
```

#### 7.1.2 Code Rollback via ECS Circuit Breaker

ECS deployment circuit breaker is configured to automatically roll back failed deployments. For manual rollback:

```bash
# Identify the previous healthy task definition
aws ecs describe-services \
  --cluster complyeasy-production \
  --services complyeasy-production-api \
  --query 'services[0].deployments'

# Roll back to previous task definition
aws ecs update-service \
  --cluster complyeasy-production \
  --service complyeasy-production-api \
  --task-definition <previous-task-definition-arn>

# For code rollback via CI/CD:
# Revert the merge commit and push to main
git revert <commit-sha> --no-edit
git push origin main
# CI/CD pipeline will automatically build, test, and deploy
```

#### 7.1.3 Database Restore from Supabase PITR

For data corruption, unauthorized modifications, or ransomware affecting the database:

```bash
# 1. Identify the last known good timestamp
#    Review audit logs: server/src/utils/auditLogger.ts entries

# 2. Initiate Supabase Point-in-Time Recovery
#    Supabase Dashboard > Project Settings > Database > Backups > Restore

# 3. Alternatively, restore from scheduled backup:
aws s3 cp s3://<bucket>/backups/scheduled/<latest>.sql.gz /tmp/
gunzip /tmp/<latest>.sql.gz
psql "$DATABASE_URL" < /tmp/<latest>.sql

# 4. Verify data integrity post-restore
# Run audit log integrity check
SELECT COUNT(*) FROM "AuditLog" WHERE "createdAt" > '<restore-timestamp>';
```

### 7.2 Recovery Procedures

| Step | Action | Owner | Verification |
|------|--------|-------|-------------|
| 1 | Deploy clean container images | Technical Lead | `aws ecs describe-services` shows RUNNING |
| 2 | Verify all secrets rotated | Technical Lead | Each service endpoint returns 200 |
| 3 | Validate database integrity | Technical Lead | Row counts match, audit log contiguous |
| 4 | Restore Redis state | Technical Lead | Rate limiters active, session creation works |
| 5 | Clear CloudFront cache | Technical Lead | Fresh content served from origin |
| 6 | Run smoke tests | Technical Lead | All critical path tests pass |
| 7 | Verify monitoring restored | Technical Lead | Sentry, APM, Prometheus all reporting |
| 8 | Re-enable user access | IC | Users can authenticate and access features |
| 9 | Monitor for recurrence | Technical Lead | 24-hour heightened monitoring period |

### 7.3 Recovery Validation Checklist

- [ ] Health endpoint (`/health`) returns 200 with all dependencies healthy.
- [ ] Authentication flow (login, 2FA, token refresh) functional.
- [ ] Database reads and writes operational.
- [ ] Redis connectivity confirmed (sessions, CSRF, rate limiting).
- [ ] Email delivery (SendGrid) functional.
- [ ] Payment processing (Stripe) functional.
- [ ] AI features (Gemini) responding.
- [ ] Sentry error tracking active.
- [ ] Elastic APM transactions recording.
- [ ] CloudWatch logs streaming.
- [ ] No elevated error rates (< 0.1% 5xx).
- [ ] Response times within SLA (p99 < 2s).

---

## 8. Communication Procedures

### 8.1 Internal Communications

| Channel | Audience | Content | Frequency |
|---------|----------|---------|-----------|
| **Slack #incident** | IRT + Engineering | Real-time updates, technical details, action items | Continuous during incident |
| **Slack #inc-YYYY-MM-DD-desc** | Dedicated incident channel | Incident-specific coordination | Created per SEV1/SEV2 incident |
| **PagerDuty** | On-call responders | Automated alerts, acknowledgments | Event-triggered |
| **Email to leadership** | CEO, CTO, CISO | Executive summary, business impact | SEV1: every 30 min; SEV2: every 2 hours |

#### Internal Update Template

```
[INCIDENT UPDATE] INC-YYYY-MM-DD-XXX | SEV[1-4] | [Status: Investigating/Identified/Monitoring/Resolved]

Summary: [One-line description]
Impact: [Number of affected users/services]
Current Status: [What is happening now]
Next Actions: [What the team is doing next]
ETA to Resolution: [Estimated time or "Under investigation"]

IC: [Name] | Technical Lead: [Name]
```

### 8.2 Customer Notification

Customer notifications are required when:
- Customer data has been confirmed as accessed, modified, or exfiltrated.
- Service disruption exceeds published SLA thresholds.
- A vulnerability in ComplyEasyAI may have exposed customer data.

**Notification Channels:**
- Email (primary) via SendGrid to affected account administrators.
- In-app notification banner for active sessions.
- Status page update at `status.complyeasyai.com`.

**Notification Timeline:**
- SEV1 with data impact: Within 2 hours of confirmation.
- SEV2 with data impact: Within 24 hours of confirmation.
- Service outage: Real-time status page updates.

### 8.3 Regulatory Notification

ComplyEasyAI processes data subject to GDPR, CCPA, and other privacy regulations. Regulatory notification is managed through the application's built-in `BreachIncident` and `BreachNotification` data models (defined in `server/prisma/schema.prisma`).

#### GDPR Article 33 -- Supervisory Authority Notification

- **Timeline:** Within **72 hours** of becoming aware of a personal data breach.
- **Recipient:** Lead Supervisory Authority (determined by DPO based on affected data subjects).
- **Content Requirements:**
  - Nature of the breach (categories and approximate number of data subjects).
  - Name and contact details of the DPO.
  - Likely consequences of the breach.
  - Measures taken or proposed to address the breach.

#### GDPR Article 34 -- Data Subject Notification

- **Trigger:** Required when the breach is likely to result in a high risk to the rights and freedoms of data subjects.
- **Timeline:** Without undue delay.
- **Content:** Clear, plain language description of the breach and recommended protective measures.

#### Regulatory Notification Workflow

```
Incident Confirmed
  |
  v
DPO Assesses Notification Obligations (within 24 hours)
  |
  ├── GDPR applies? --> Create BreachIncident record
  |     |                  |
  |     v                  v
  |   72-hour timer    Prepare Article 33 notification
  |     starts         (via BreachNotification model)
  |                        |
  |                        v
  |                    Submit to DPA
  |
  ├── CCPA applies? --> Assess > 500 CA residents affected?
  |     |-- YES --> Notify CA Attorney General
  |     |-- NO  --> Individual notice only
  |
  └── Other jurisdictions: DPO determines per applicable law
```

### 8.4 Law Enforcement Notification

Law enforcement is contacted when:
- Criminal activity is suspected (unauthorized access, fraud, ransomware).
- Required by regulation or court order.
- IC and Legal/DPO jointly authorize.

All law enforcement communications go through the Legal/DPO Liaison exclusively.

---

## 9. Post-Incident Review Template

A Post-Incident Review (PIR) is mandatory for all SEV1 and SEV2 incidents, and recommended for SEV3 incidents. The PIR must be completed within 5 business days of incident resolution.

### Post-Incident Review Document

```markdown
# Post-Incident Review: INC-YYYY-MM-DD-XXX

**Date of Incident:** YYYY-MM-DD HH:MM UTC
**Date of Resolution:** YYYY-MM-DD HH:MM UTC
**Date of Review:** YYYY-MM-DD
**Severity:** SEV[1-4]
**Incident Commander:** [Name]
**Technical Lead:** [Name]
**Review Participants:** [List all participants]

---

## 1. Executive Summary
[2-3 sentence summary of what happened, the impact, and the resolution.]

## 2. Timeline
| Time (UTC) | Event | Actor |
|------------|-------|-------|
| HH:MM | [First detection / alert trigger] | [Monitoring system] |
| HH:MM | [IC notified / incident declared] | [On-call engineer] |
| HH:MM | [Containment action taken] | [Technical Lead] |
| HH:MM | [Root cause identified] | [Technical Lead] |
| HH:MM | [Eradication completed] | [Technical Lead] |
| HH:MM | [Recovery validated] | [Technical Lead] |
| HH:MM | [Incident resolved / all-clear] | [IC] |

## 3. Root Cause Analysis
### What happened?
[Detailed technical description of the root cause.]

### Why did it happen?
[Contributing factors, systemic issues.]

### Why was it not detected sooner?
[Gaps in monitoring, alerting, or processes.]

## 4. Impact Assessment
| Dimension | Details |
|-----------|---------|
| **Duration** | [Total incident duration] |
| **Affected Users** | [Number and description] |
| **Data Impact** | [Was data accessed/modified/exfiltrated? Scope?] |
| **Service Impact** | [Which services were degraded/unavailable?] |
| **Financial Impact** | [Estimated cost: revenue loss, remediation, penalties] |
| **Regulatory Impact** | [Were notifications required? Filed?] |

## 5. What Went Well
- [Effective detection, fast response, good coordination, etc.]

## 6. What Could Be Improved
- [Gaps identified, slow response areas, missing runbooks, etc.]

## 7. Action Items
| # | Action | Owner | Priority | Due Date | Status |
|---|--------|-------|----------|----------|--------|
| 1 | [Specific remediation action] | [Name] | P1/P2/P3 | YYYY-MM-DD | Open |
| 2 | [Process improvement] | [Name] | P1/P2/P3 | YYYY-MM-DD | Open |
| 3 | [Monitoring enhancement] | [Name] | P1/P2/P3 | YYYY-MM-DD | Open |

## 8. Lessons Learned
- [Key takeaways that should inform future incident response.]
- [Changes to this IRP if warranted.]

## 9. Approval
| Role | Name | Signature | Date |
|------|------|-----------|------|
| Incident Commander | | | |
| CISO | | | |
| CTO | | | |
```

---

## 10. Annual Testing Schedule

### 10.1 Testing Program

Regular testing ensures the IRP remains effective and team members are prepared to execute their roles.

| Exercise Type | Frequency | Duration | Participants | Scope |
|---------------|-----------|----------|-------------|-------|
| **Tabletop Exercise** | Monthly | 1-2 hours | IRT + Engineering leads | Walkthrough of a hypothetical scenario; validate decision-making and communication flows |
| **Technical Drill** | Quarterly | 2-4 hours | IRT + Full engineering team | Hands-on execution of specific containment/recovery procedures in staging environment |
| **Full-Scale Simulation** | Annually | 4-8 hours | All personnel including Communications, Legal, Executive | End-to-end incident simulation with simulated customer/regulatory notifications |

### 10.2 Monthly Tabletop Exercise Scenarios (Rotating)

| Month | Scenario | Focus Area |
|-------|----------|------------|
| January | Ransomware attack encrypts database | Full IRP execution, backup recovery |
| February | Customer reports data visible to wrong tenant | Multi-tenant isolation, authorization failure |
| March | Credential stuffing attack on auth endpoints | `AUTHENTICATION_FAILURE` escalation, WAF rules |
| April | Insider threat: employee exports customer data | Access control, audit log review |
| May | Third-party breach: Supabase reports incident | Vendor communication, data impact assessment |
| June | Zero-day vulnerability in Node.js runtime | Emergency patching, container rebuild |
| July | DDoS attack overwhelms ALB | Rate limiting, CloudFront WAF, scaling |
| August | Stripe webhook forgery leads to billing fraud | `CSRF_VALIDATION_FAILURE`, webhook verification |
| September | Supply chain attack via compromised npm package | Dependency audit, container scanning |
| October | GDPR subject access request reveals data breach | DPO notification, Article 33 timeline |
| November | DNS hijacking redirects traffic | Certificate pinning, DNSSEC, direct ALB routing |
| December | Year-in-review: re-test highest-risk scenario from the year | Comprehensive review |

### 10.3 Quarterly Technical Drill Procedures

Each quarterly drill must include:

1. **Preparation (1 week before):**
   - Select scenario and define success criteria.
   - Prepare staging environment to simulate conditions.
   - Notify participants with scenario overview (not full details).

2. **Execution:**
   - Inject simulated incident into staging monitoring.
   - Measure time-to-detect, time-to-acknowledge, time-to-contain.
   - Execute containment procedures against staging systems.
   - Validate recovery procedures.

3. **Debrief (within 48 hours):**
   - Compare actual response times against SLA targets.
   - Identify procedure gaps or outdated runbooks.
   - Update IRP and related documentation.
   - File drill report in compliance evidence repository.

### 10.4 Annual Full-Scale Simulation

The annual simulation is the most comprehensive test of the IRP and must include:

- Simulated detection via monitoring systems.
- Full IRT mobilization with role assignment.
- Technical containment and recovery execution in a dedicated simulation environment.
- Draft customer notification prepared and reviewed.
- Draft regulatory notification prepared and reviewed.
- Executive briefing delivered.
- Post-incident review conducted.
- Results reported to the board/governance committee.

---

## 11. Document Control

### 11.1 Version History

| Version | Date | Author | Changes | Approved By |
|---------|------|--------|---------|-------------|
| 1.0 | 2026-03-08 | CISO, AARAIK LLC | Initial release | [CISO], [CEO], [DPO] |
| | | | | |

### 11.2 Review and Approval

| Attribute | Value |
|-----------|-------|
| **Document Owner** | Chief Information Security Officer (CISO) |
| **Review Cadence** | Quarterly (every 90 days) |
| **Next Scheduled Review** | 2026-06-08 |
| **Triggered Review** | After any SEV1/SEV2 incident, or significant infrastructure change |
| **Approval Authority** | CISO (primary), CEO (secondary), DPO (regulatory sections) |

### 11.3 Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| CISO | __________________ | __________________ | __________ |
| CEO | __________________ | __________________ | __________ |
| DPO | __________________ | __________________ | __________ |
| CTO | __________________ | __________________ | __________ |

### 11.4 Distribution List

This document is distributed to:
- All members of the Incident Response Team.
- Engineering team leads.
- Executive leadership (CEO, CTO, COO).
- Data Protection Officer.
- External legal counsel (under NDA).
- SOC 2 auditors (upon request, under NDA).

### 11.5 Related Documents

| Document | Location | Relationship |
|----------|----------|-------------|
| Secret Rotation Runbook | [docs/SECRET_ROTATION_RUNBOOK.md](SECRET_ROTATION_RUNBOOK.md) | Referenced in Section 7.1.1 |
| Disaster Recovery Plan | [docs/DISASTER_RECOVERY.md](DISASTER_RECOVERY.md) | Complementary recovery procedures |
| Business Continuity Plan | [docs/BUSINESS_CONTINUITY_PLAN.md](BUSINESS_CONTINUITY_PLAN.md) | Business-level continuity |
| Vendor Security Assessment | [docs/VENDOR_SECURITY_ASSESSMENT.md](VENDOR_SECURITY_ASSESSMENT.md) | Third-party incident coordination |
| FIPS Cryptographic Module Boundary | [docs/FIPS_CRYPTOGRAPHIC_MODULE_BOUNDARY.md](FIPS_CRYPTOGRAPHIC_MODULE_BOUNDARY.md) | Cryptographic incident context |
| Change Management Procedure | [docs/CHANGE_MANAGEMENT_PROCEDURE.md](CHANGE_MANAGEMENT_PROCEDURE.md) | Change-related incident prevention |

---

*End of Document*
