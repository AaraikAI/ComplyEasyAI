# ComplyEasyAI -- Change Management Procedure

> **Document Classification:** Confidential -- Internal
> **Version:** 2.0
> **Owner:** Chief Technology Officer (CTO), AARAIK LLC
> **Effective Date:** 2026-03-08
> **Next Review Date:** 2026-06-08
> **Review Cadence:** Quarterly
> **Approval:** [CTO Signature] | [CISO Signature] | [CEO Signature]
> **SOC 2 Mapping:** CC8.1, CC7.1, CC6.1

---

## Table of Contents

1. [Purpose and Scope](#1-purpose-and-scope)
2. [Change Categories](#2-change-categories)
3. [Change Request Process](#3-change-request-process)
4. [CI/CD Pipeline Mapping to CC8.1](#4-cicd-pipeline-mapping-to-cc81)
5. [Branch Protection Rules](#5-branch-protection-rules)
6. [Rollback Procedures](#6-rollback-procedures)
7. [Emergency Change Process](#7-emergency-change-process)
8. [Change Advisory Board (CAB)](#8-change-advisory-board-cab)
9. [Post-Implementation Review](#9-post-implementation-review)
10. [Document Control](#10-document-control)

---

## 1. Purpose and Scope

### 1.1 Purpose

This document defines the change management procedure for ComplyEasyAI, ensuring that all changes to the production environment are planned, tested, approved, and documented in accordance with SOC 2 Trust Services Criteria **CC8.1** (Change Management).

This procedure ensures:
- All changes are authorized before implementation
- Changes are tested in non-production environments before deployment
- Segregation of duties is maintained between development, review, and deployment
- A complete audit trail exists for every change to production
- Rollback procedures are defined and tested
- Emergency changes follow an expedited but controlled process

### 1.2 Scope

This procedure applies to all changes to:
- **Application code** (frontend and backend)
- **Infrastructure configuration** (AWS ECS, ALB, CloudFront, S3, RDS, ElastiCache)
- **Database schema** (Prisma migrations, SQL DDL)
- **CI/CD pipeline** (GitHub Actions workflows)
- **Security configurations** (firewall rules, WAF policies, TLS settings, RBAC)
- **Third-party integrations** (API keys, webhook configurations, vendor SDKs)
- **Environment variables and secrets** (via AWS Secrets Manager)
- **DNS and networking** (Route 53, VPC, security groups)

### 1.3 Exclusions

The following are excluded from this procedure:
- Content changes to marketing materials (non-application)
- Documentation-only changes (no code or configuration impact)
- Local development environment changes
- Routine operational tasks documented in runbooks (e.g., log rotation)

### 1.4 Regulatory Alignment

| Framework | Control | Description |
|-----------|---------|-------------|
| SOC 2 | CC8.1 | Changes to infrastructure, data, software, and procedures are authorized, designed, developed, configured, documented, tested, approved, and implemented |
| SOC 2 | CC7.1 | Detection of unauthorized changes |
| SOC 2 | CC6.1 | Logical access controls over change management systems |
| ISO 27001 | A.14.2 | Security in development and support processes |
| NIST CSF | PR.IP-3 | Configuration change control processes |

---

## 2. Change Categories

### 2.1 Standard Change

| Attribute | Value |
|-----------|-------|
| **Definition** | Pre-approved, low-risk changes that follow established procedures |
| **Examples** | Bug fixes, minor UI updates, dependency version bumps, documentation updates |
| **Risk Level** | Low |
| **Approval Required** | Automated (via CI/CD pipeline + peer code review) |
| **Lead Time** | Same day |
| **CAB Review** | Not required |
| **Rollback Plan** | Automated via ECS circuit breaker |

### 2.2 Emergency Change

| Attribute | Value |
|-----------|-------|
| **Definition** | Urgent changes required to restore service, fix critical security vulnerabilities, or address active incidents |
| **Examples** | Critical security patch, production outage fix, data breach remediation |
| **Risk Level** | High (but urgency outweighs risk of delay) |
| **Approval Required** | CTO or CISO verbal/written approval (retroactive documentation within 24 hours) |
| **Lead Time** | Immediate |
| **CAB Review** | Post-implementation review required within 48 hours |
| **Rollback Plan** | Must be defined before deployment; manual rollback authorized |

### 2.3 Major Change

| Attribute | Value |
|-----------|-------|
| **Definition** | High-impact changes that affect architecture, security posture, data handling, or customer-facing functionality |
| **Examples** | New feature launch, database schema migration, infrastructure provider change, encryption algorithm change, new third-party integration, pricing/billing changes |
| **Risk Level** | High |
| **Approval Required** | CAB approval required (CTO + CISO + Product Lead) |
| **Lead Time** | Minimum 5 business days for CAB review |
| **CAB Review** | Required before implementation |
| **Rollback Plan** | Documented and tested in staging before production deployment |

---

## 3. Change Request Process

### 3.1 Process Flow

```
+----------+    +---------+    +---------+    +-----------+    +--------+    +-------+
|          |    |         |    |         |    |           |    |        |    |       |
|  Submit  +--->+  Review +--->+ Approve +--->+ Implement +--->+ Verify +--->+ Close |
|          |    |         |    |         |    |           |    |        |    |       |
+----------+    +---------+    +---------+    +-----------+    +--------+    +-------+
     |               |              |               |               |            |
  Developer      Peer Review     Approver        CI/CD          QA/Smoke     Auto-close
  creates PR     + automated     (varies by      Pipeline       tests +       after
  with change    quality gates   category)       deploys        monitoring    verification
  description                                                   period       period
```

### 3.2 Step Details

#### Step 1: Submit

| Attribute | Requirement |
|-----------|-------------|
| **Who** | Developer (change requestor) |
| **How** | Create a Pull Request (PR) on GitHub |
| **Required Information** | Change description, business justification, category (Standard/Emergency/Major), affected components, rollback plan, testing evidence |
| **PR Template Fields** | Type of change, description, testing performed, screenshots (if UI), migration notes (if DB), security impact assessment |

#### Step 2: Review

| Attribute | Requirement |
|-----------|-------------|
| **Who** | Peer developer (minimum 1 reviewer; 2 for Major changes) |
| **Automated Checks** | All CI/CD pipeline stages must pass (see Section 4) |
| **Review Criteria** | Code quality, security impact, test coverage, documentation, performance impact, backward compatibility |
| **Timeline** | Standard: 1 business day; Emergency: ASAP; Major: 3 business days |

#### Step 3: Approve

| Change Category | Approver | Method |
|----------------|----------|--------|
| Standard | Peer reviewer (1 minimum) | GitHub PR approval |
| Emergency | CTO or CISO | Verbal + retroactive GitHub approval within 24h |
| Major | CAB (CTO + CISO + Product Lead) | CAB meeting minutes + GitHub PR approval |

#### Step 4: Implement

| Attribute | Requirement |
|-----------|-------------|
| **Who** | CI/CD pipeline (automated) |
| **How** | Merge PR to `main` branch triggers deployment pipeline |
| **Deployment Strategy** | Rolling deployment via AWS ECS with health checks |
| **No Manual Deployments** | All production deployments must go through the CI/CD pipeline; direct server access for deployment is prohibited |

#### Step 5: Verify

| Attribute | Requirement |
|-----------|-------------|
| **Who** | Automated (smoke tests) + on-call engineer |
| **Activities** | Health check endpoints, smoke tests, error rate monitoring, latency monitoring |
| **Monitoring Period** | 30 minutes post-deployment for Standard changes; 2 hours for Major changes |
| **Rollback Trigger** | Error rate > 1%, P95 latency > 2x baseline, health check failures |

#### Step 6: Close

| Attribute | Requirement |
|-----------|-------------|
| **Who** | Automatic (upon successful verification period) |
| **Documentation** | PR merged, deployment logged in audit trail, monitoring confirms stability |
| **Notification** | Deployment notification sent to #deployments Slack channel |

---

## 4. CI/CD Pipeline Mapping to CC8.1

### 4.1 Pipeline Overview

Every change to the `main` branch triggers the following automated pipeline stages via **GitHub Actions**. Each stage enforces a specific aspect of SOC 2 CC8.1.

### 4.2 Pipeline Stages

| Stage | Tool | CC8.1 Requirement | Description | Failure Action |
|-------|------|-------------------|-------------|----------------|
| **1. Lint** | ESLint | Code quality standards | Enforces coding standards, catches common errors, ensures consistent style | Block merge |
| **2. Type Check** | TypeScript Compiler (`tsc`) | Code correctness verification | Static type analysis to catch type errors before runtime | Block merge |
| **3. Unit Tests** | Jest | Functional testing | Runs all unit tests with minimum 80% code coverage requirement | Block merge |
| **4. Integration Tests** | Jest + Supertest | Integration testing | Tests API endpoints, database operations, service interactions | Block merge |
| **5. E2E Tests** | Playwright / Jest | End-to-end testing | Simulates user workflows across the full stack | Block merge |
| **6. Security Scan: Trivy** | Trivy | Vulnerability assessment | Scans Docker images and dependencies for known CVEs (CRITICAL/HIGH = block) | Block merge |
| **7. Security Scan: GitLeaks** | GitLeaks | Secret detection | Scans code and commit history for leaked secrets, API keys, credentials | Block merge |
| **8. Security Scan: CodeQL** | CodeQL (GitHub) | Static application security testing (SAST) | Analyzes code for security vulnerabilities (SQL injection, XSS, etc.) | Block merge |
| **9. Container Build** | Docker | Artifact creation | Builds production Docker image with multi-stage build (minimal attack surface) | Block deploy |
| **10. Container Signing** | Cosign (Sigstore) | Supply chain integrity | Signs container image with Cosign to verify image provenance and integrity | Block deploy |
| **11. Production Approval Gate** | GitHub Environments | Authorization control | Requires manual approval from authorized deployer before production deployment | Block deploy |
| **12. Deploy to Staging** | AWS ECS | Pre-production validation | Deploys to staging environment for smoke tests and manual verification | Block prod deploy |
| **13. Deploy to Production** | AWS ECS | Production deployment | Rolling deployment with health checks and automatic rollback on failure | N/A |

### 4.3 Pipeline Diagram

```
PR Created
    |
    v
+---------------------------------------------------+
| GitHub Actions CI Pipeline                         |
|                                                    |
|  [Lint] --> [Type Check] --> [Unit Tests]          |
|                                  |                 |
|                                  v                 |
|                          [Integration Tests]       |
|                                  |                 |
|                                  v                 |
|                            [E2E Tests]             |
|                                  |                 |
|  +-------------------------------+                 |
|  |                                                 |
|  v                                                 |
|  [Trivy Scan] --> [GitLeaks] --> [CodeQL]          |
|                                      |             |
|                                      v             |
|                              [Container Build]     |
|                                      |             |
|                                      v             |
|                              [Cosign Signing]      |
+---------------------------------------------------+
    |
    v (all checks pass)
PR Merge to main
    |
    v
+---------------------------------------------------+
| GitHub Actions CD Pipeline                         |
|                                                    |
|  [Deploy to Staging] --> [Smoke Tests]             |
|                               |                    |
|                               v                    |
|                    [Production Approval Gate]       |
|                               |                    |
|                               v (manual approval)  |
|                    [Deploy to Production]           |
|                               |                    |
|                               v                    |
|                    [Post-Deploy Verification]       |
+---------------------------------------------------+
```

### 4.4 SOC 2 CC8.1 Evidence Mapping

| CC8.1 Requirement | How It Is Met | Evidence Location |
|-------------------|---------------|-------------------|
| Changes are authorized | PR approval required; production approval gate | GitHub PR history, approval logs |
| Changes are designed and developed | PR description, linked issue/feature spec | GitHub PR description, issue tracker |
| Changes are configured and documented | Infrastructure-as-code (Terraform/CloudFormation), PR descriptions | Repository commit history |
| Changes are tested | Automated test pipeline (unit, integration, E2E) | GitHub Actions test results |
| Changes are approved | Required reviewer approval + production gate | GitHub branch protection audit log |
| Changes are implemented in a controlled manner | Automated CI/CD pipeline, no manual deployments | GitHub Actions deployment logs, ECS deployment history |

---

## 5. Branch Protection Rules

### 5.1 Main Branch Protection

The `main` branch has the following protection rules enforced via GitHub:

| Rule | Setting | Purpose |
|------|---------|---------|
| **Require pull request reviews** | Minimum 1 approving review (2 for Major changes) | Segregation of duties; no self-approval |
| **Require status checks to pass** | All CI pipeline stages must pass | Automated quality and security gate |
| **Require branches to be up to date** | PR must be up-to-date with `main` before merge | Prevents merge conflicts and ensures testing against latest code |
| **No force push** | Force push to `main` is disabled for all users | Prevents history rewriting and loss of audit trail |
| **No branch deletion** | `main` branch cannot be deleted | Protects primary branch |
| **Require linear history** | Squash merging enforced | Clean, auditable commit history |
| **Restrict push access** | Only CI/CD service account can push to `main` after merge | Prevents direct pushes bypassing review |
| **Require signed commits** | Recommended (enforced for Major changes) | Verify commit author identity |

### 5.2 Branch Naming Convention

| Branch Type | Pattern | Example |
|-------------|---------|---------|
| Feature | `feature/<ticket-id>-<description>` | `feature/CEA-123-add-dsar-export` |
| Bug fix | `fix/<ticket-id>-<description>` | `fix/CEA-456-csrf-token-rotation` |
| Hotfix (emergency) | `hotfix/<ticket-id>-<description>` | `hotfix/CEA-789-auth-bypass-fix` |
| Release | `release/<version>` | `release/2.1.0` |

---

## 6. Rollback Procedures

### 6.1 Automated Rollback (ECS Circuit Breaker)

AWS ECS is configured with a deployment circuit breaker that automatically rolls back failed deployments:

| Configuration | Value |
|--------------|-------|
| **Circuit Breaker Enabled** | Yes |
| **Rollback on Failure** | Yes |
| **Minimum Healthy Percent** | 100% |
| **Maximum Percent** | 200% |
| **Health Check Grace Period** | 60 seconds |
| **Failure Threshold** | 3 consecutive health check failures |

**How it works:**
1. ECS starts new tasks with the updated container image
2. Health checks run against new tasks (HTTP 200 on `/health`)
3. If health checks fail 3 times consecutively, ECS triggers automatic rollback
4. Previous task definition is restored
5. Alert sent to #incidents Slack channel and PagerDuty

### 6.2 Manual Rollback Procedure

If automatic rollback does not trigger or post-deployment issues are detected:

| Step | Action | Owner | Command/Tool |
|------|--------|-------|-------------|
| 1 | Identify the last known good deployment | On-call engineer | `aws ecs describe-services --cluster prod --services complyeasy-api` |
| 2 | Update ECS service to previous task definition | On-call engineer | `aws ecs update-service --cluster prod --service complyeasy-api --task-definition complyeasy-api:<previous-revision>` |
| 3 | Monitor deployment progress | On-call engineer | AWS Console or `aws ecs wait services-stable` |
| 4 | Verify service health | On-call engineer | Health check endpoint + smoke tests |
| 5 | Communicate rollback to team | On-call engineer | #incidents Slack channel |
| 6 | Create incident report | On-call engineer | Incident Response Plan template |

### 6.3 Database Rollback

For database schema changes (Prisma migrations):

| Step | Action | Owner |
|------|--------|-------|
| 1 | Identify the migration that caused the issue | On-call engineer |
| 2 | If migration is reversible, run `npx prisma migrate resolve --rolled-back <migration-name>` | On-call engineer |
| 3 | If migration is not reversible, restore database from latest automated backup (RPO: 5 minutes) | On-call engineer + DBA |
| 4 | Verify data integrity after restoration | DBA |
| 5 | Document the incident | On-call engineer |

**Database Backup Schedule:**
- Automated snapshots: Every 5 minutes (Supabase Point-in-Time Recovery)
- Daily full backups: Retained for 30 days
- Monthly archival backups: Retained for 1 year

---

## 7. Emergency Change Process

### 7.1 Definition

An emergency change is required when:
- Production service is down or severely degraded
- A critical security vulnerability is being actively exploited
- A data breach is in progress or imminent
- Regulatory deadline requires immediate remediation

### 7.2 Emergency Change Workflow

```
Incident Detected
       |
       v
+------------------+
| Incident Commander|
| declares emergency|
+------------------+
       |
       v
+------------------+
| CTO or CISO      |
| verbal approval   |
| (Slack/phone)     |
+------------------+
       |
       v
+------------------+
| Developer creates |
| hotfix branch     |
| (hotfix/*)        |
+------------------+
       |
       v
+------------------+      +------------------+
| Abbreviated CI:  |      | Full CI pipeline |
| - Lint           |      | runs in parallel |
| - Type check     |      | (must pass within|
| - Unit tests     |      |  24 hours)       |
| - Trivy scan     |      +------------------+
+------------------+
       |
       v
+------------------+
| Emergency deploy  |
| to production     |
+------------------+
       |
       v
+------------------+
| Post-deploy       |
| verification      |
| (30 min monitor)  |
+------------------+
       |
       v
+------------------+
| Retroactive       |
| documentation     |
| within 24 hours:  |
| - PR created      |
| - Full CI passes  |
| - Formal approval |
| - Incident report |
+------------------+
       |
       v
+------------------+
| Post-implementation|
| review within     |
| 48 hours          |
+------------------+
```

### 7.3 Emergency Change Requirements

| Requirement | Standard Change | Emergency Change |
|-------------|----------------|-----------------|
| PR required | Yes | Retroactive (within 24h) |
| Peer review | Before merge | Retroactive (within 24h) |
| Full CI pipeline | Before merge | Abbreviated before deploy; full within 24h |
| CTO/CISO approval | Not required (peer review sufficient) | Required (verbal, then written within 24h) |
| Rollback plan | Documented in PR | Verbal confirmation before deploy |
| Post-implementation review | Optional | Required within 48h |
| Incident report | Not required | Required |

### 7.4 Emergency Change Authorization

| Authorizer | Contact Method | Backup |
|-----------|---------------|--------|
| CTO | Slack DM, Phone, PagerDuty | CISO |
| CISO | Slack DM, Phone, PagerDuty | CTO |
| On-call Lead | PagerDuty | CTO |

---

## 8. Change Advisory Board (CAB)

### 8.1 Purpose

The Change Advisory Board reviews and approves Major changes that have significant impact on the platform, security posture, or customer experience.

### 8.2 Membership

| Role | Responsibility | Required/Optional |
|------|---------------|-------------------|
| **CTO** (Chair) | Technical architecture and feasibility | Required |
| **CISO** | Security and compliance impact | Required |
| **Product Lead** | Business impact and customer communication | Required |
| **Engineering Lead** | Implementation risk and resource assessment | Optional |
| **DPO** | Data protection and privacy impact (when applicable) | Optional |

### 8.3 CAB Meeting Schedule

| Attribute | Value |
|-----------|-------|
| **Regular cadence** | Bi-weekly (every other Wednesday, 2:00 PM ET) |
| **Ad-hoc meetings** | As needed for time-sensitive Major changes |
| **Quorum** | CTO + CISO + Product Lead (all 3 required members) |
| **Meeting format** | 30-minute structured review |

### 8.4 CAB Review Checklist

For each Major change, the CAB evaluates:

| # | Review Item | Assessment |
|---|------------|------------|
| 1 | **Business justification**: Is this change necessary? What problem does it solve? | Approve / Reject / Defer |
| 2 | **Security impact**: Does this change affect the security posture? Has a security review been completed? | Approve / Concerns |
| 3 | **Data impact**: Does this change affect data handling, storage, or processing? Is a DPIA required? | Approve / DPIA Needed |
| 4 | **Customer impact**: Will customers see changes? Is communication needed? | Approve / Comms Plan Needed |
| 5 | **Rollback plan**: Is the rollback plan documented and tested? | Approve / Needs Testing |
| 6 | **Testing evidence**: Have all test suites passed? Is there adequate test coverage? | Approve / More Tests Needed |
| 7 | **Deployment plan**: Is the deployment strategy appropriate? Maintenance window needed? | Approve / Schedule Change |
| 8 | **Risk assessment**: What is the overall risk? Are compensating controls in place? | Low / Medium / High |

### 8.5 CAB Decision Records

All CAB decisions are documented in the following format:

| Field | Value |
|-------|-------|
| **Change ID** | |
| **Change Title** | |
| **Requestor** | |
| **Date Reviewed** | |
| **Decision** | Approved / Rejected / Deferred |
| **Conditions** | (any conditions for approval) |
| **Attendees** | |
| **Meeting Notes** | |

---

## 9. Post-Implementation Review

### 9.1 Purpose

Post-implementation reviews (PIRs) ensure that changes achieved their objectives and identify lessons learned for process improvement.

### 9.2 When PIR Is Required

| Change Category | PIR Required? | Timeline |
|----------------|---------------|----------|
| Standard | No (unless incident occurred) | N/A |
| Emergency | Yes (always) | Within 48 hours |
| Major | Yes (always) | Within 5 business days |

### 9.3 PIR Template

| Field | Response |
|-------|----------|
| **Change ID / PR Number** | |
| **Change Description** | |
| **Implementation Date** | |
| **Implemented By** | |
| **Objective Achieved?** | Yes / Partially / No |
| **Deployment Duration** | |
| **Incidents During Deployment** | None / Description |
| **Rollback Required?** | Yes / No |
| **Customer Impact** | None / Description |
| **Monitoring Results** | Error rate, latency, availability during deployment window |
| **Lessons Learned** | |
| **Process Improvements** | |
| **Follow-up Actions** | |

### 9.4 Metrics Tracked

| Metric | Target | Measurement |
|--------|--------|-------------|
| Change success rate | > 95% | % of deployments without rollback |
| Mean time to deploy | < 30 minutes | Time from merge to production |
| Emergency change rate | < 5% of all changes | % of changes classified as emergency |
| PIR completion rate | 100% for Emergency/Major | % of required PIRs completed on time |
| Mean time to rollback | < 10 minutes | Time from failure detection to rollback completion |

---

## 10. Document Control

### 10.1 Version History

| Version | Date | Author | Changes | Approved By |
|---------|------|--------|---------|-------------|
| 1.0 | 2026-03-01 | CTO, AARAIK LLC | Initial release | [CTO], [CISO] |
| 2.0 | 2026-03-08 | CTO, AARAIK LLC | Comprehensive rewrite: added CI/CD pipeline mapping, branch protection, rollback procedures, CAB process, PIR template | [CTO], [CISO], [CEO] |

### 10.2 Related Documents

| Document | Location | Relationship |
|----------|----------|-------------|
| Incident Response Plan | [docs/INCIDENT_RESPONSE_PLAN.md](INCIDENT_RESPONSE_PLAN.md) | Emergency change incident coordination |
| Disaster Recovery Plan | [docs/DISASTER_RECOVERY.md](DISASTER_RECOVERY.md) | Database rollback and recovery |
| Secret Rotation Runbook | [docs/SECRET_ROTATION_RUNBOOK.md](SECRET_ROTATION_RUNBOOK.md) | Secret/credential change procedures |
| FIPS Cryptographic Module Boundary | [docs/FIPS_CRYPTOGRAPHIC_MODULE_BOUNDARY.md](FIPS_CRYPTOGRAPHIC_MODULE_BOUNDARY.md) | Cryptographic configuration changes |
| Vendor Security Assessment | [docs/VENDOR_SECURITY_ASSESSMENT.md](VENDOR_SECURITY_ASSESSMENT.md) | Third-party integration changes |

### 10.3 Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| CTO | __________________ | __________________ | __________ |
| CISO | __________________ | __________________ | __________ |
| CEO | __________________ | __________________ | __________ |

---

*End of Document*
