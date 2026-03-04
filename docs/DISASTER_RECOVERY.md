# ComplyEasyAI — Disaster Recovery Plan

> **Classification:** Internal — Engineering Team
> **Last Updated:** 2026-03-04
> **Owner:** Platform Engineering
> **Review Cadence:** Quarterly

---

## 1. Recovery Objectives

| Metric | Target | Notes |
|--------|--------|-------|
| **RPO** (Recovery Point Objective) | ≤ 1 hour | Supabase continuous backups + WAL archiving |
| **RTO** (Recovery Time Objective) | ≤ 30 minutes | ECS blue/green + automated failover |
| **MTTR** (Mean Time To Recover) | ≤ 15 minutes | For single-service failures |

---

## 2. Architecture Overview

```
Users → CloudFront (CDN) → S3 (Frontend Static Assets)
                        → ALB → ECS Fargate (API containers, 1-4 tasks)
                                  ├── Supabase PostgreSQL (Primary DB)
                                  ├── ElastiCache Redis (Cache + Sessions)
                                  └── S3 (File uploads, evidence, exports)
```

**Key Dependencies:**
- **Database:** Supabase PostgreSQL (managed, external)
- **Cache:** ElastiCache Redis (AWS-managed)
- **Storage:** AWS S3 (11 9's durability)
- **CDN:** AWS CloudFront
- **Compute:** ECS Fargate (auto-scaling 1→4 tasks)
- **DNS:** Route 53 with health checks
- **Secrets:** AWS Secrets Manager
- **Monitoring:** Winston + Sentry + Elastic APM

---

## 3. Backup Strategy

### 3.1 Database Backups

| Type | Frequency | Retention | Location |
|------|-----------|-----------|----------|
| Supabase Point-in-Time Recovery | Continuous (WAL) | 7 days (Pro), 28 days (Enterprise) | Supabase managed |
| Pre-migration snapshots | Every CI/CD deployment | 30 days | S3 `backups/pre-migration/` |
| Manual snapshots | Before major releases | 90 days | S3 `backups/manual/` |

**Pre-Migration Backup (automated in CI):**
The CI/CD pipeline automatically creates a database backup before every production migration:
```yaml
# .github/workflows/ci.yml — deploy-production job
- name: Pre-migration database backup
  run: |
    pg_dump "$DATABASE_URL" --no-owner --no-acl | gzip > /tmp/backup.sql.gz
    aws s3 cp /tmp/backup.sql.gz "s3://$BUCKET/backups/pre-migration/${TIMESTAMP}.sql.gz"
```

### 3.2 Application State Backups

| Data | Method | Frequency |
|------|--------|-----------|
| S3 file uploads | S3 Cross-Region Replication | Real-time |
| Redis cache | ElastiCache snapshots | Daily |
| Docker images | GHCR + ECR (dual registry) | Every deployment |
| Infrastructure | CDK code in git | Every commit |
| Secrets | AWS Secrets Manager (auto-replicated) | On change |

---

## 4. Failure Scenarios & Recovery Procedures

### 4.1 Single Container Crash

**Detection:** ECS health check fails (30s interval, 3 retries)
**Auto-Recovery:** ECS automatically replaces failed tasks
**RTO:** ~60 seconds
**Manual Action:** None required

```bash
# Verify recovery
aws ecs describe-services \
  --cluster complyeasy-production \
  --services complyeasy-production-api \
  --query 'services[0].{desired:desiredCount,running:runningCount,pending:pendingCount}'
```

### 4.2 All Containers Down / Bad Deployment

**Detection:** ALB target group unhealthy, Sentry alerts, /health returns 503
**Recovery:** ECS circuit breaker automatically rolls back to previous task definition

```bash
# If circuit breaker didn't trigger, manually roll back:
# 1. Find the previous working task definition
aws ecs list-task-definitions --family complyeasy-production-api --sort DESC --max-items 5

# 2. Update service to use previous task definition
aws ecs update-service \
  --cluster complyeasy-production \
  --service complyeasy-production-api \
  --task-definition complyeasy-production-api:<PREVIOUS_REVISION> \
  --force-new-deployment

# 3. Wait for stability
aws ecs wait services-stable \
  --cluster complyeasy-production \
  --services complyeasy-production-api
```

### 4.3 Database Failure

**Detection:** Health check `/health` reports `database: disconnected`
**Recovery:**

```bash
# 1. Check Supabase status
# Visit: https://status.supabase.com/

# 2. If Supabase is down — wait for their recovery (managed service)
# The application will continue serving cached data and queue writes

# 3. If data corruption — restore from Point-in-Time Recovery
# Use Supabase Dashboard → Database → Backups → Restore to specific time

# 4. If migration caused corruption — restore from pre-migration backup
aws s3 ls s3://$BUCKET/backups/pre-migration/ --recursive | sort | tail -5
# Download and restore the most recent pre-migration backup
aws s3 cp s3://$BUCKET/backups/pre-migration/<latest>.sql.gz /tmp/
gunzip /tmp/<latest>.sql.gz
psql "$DATABASE_URL" < /tmp/<latest>.sql
```

### 4.4 Redis Cache Failure

**Detection:** Health check reports `cache: unavailable`
**Impact:** Degraded performance, rate limiting fallback to in-memory
**Recovery:** ElastiCache auto-recovery or manual reboot

```bash
# The application gracefully degrades when Redis is unavailable.
# Cache service falls back to in-memory mode automatically.

# If Redis node needs replacement:
aws elasticache reboot-cache-cluster \
  --cache-cluster-id complyeasy-production-redis \
  --cache-node-ids-to-reboot 0001
```

### 4.5 S3 / File Storage Failure

**Detection:** Upload/download operations fail
**Impact:** File uploads, evidence management, exports affected
**Recovery:** S3 has 99.999999999% durability — outage is extremely rare

```bash
# Check S3 service health
aws s3api head-bucket --bucket $AWS_S3_BUCKET

# If cross-region replication is enabled, switch to replica bucket
# Update AWS_S3_BUCKET environment variable in ECS task definition
```

### 4.6 DNS / CloudFront Failure

**Detection:** Users cannot reach the application
**Recovery:**

```bash
# 1. Check CloudFront distribution status
aws cloudfront get-distribution --id $CLOUDFRONT_DISTRIBUTION_ID \
  --query 'Distribution.Status'

# 2. If CloudFront is degraded, users can access API directly via ALB DNS
# ALB DNS: complyeasy-production-alb-*.us-east-1.elb.amazonaws.com

# 3. Update DNS to point directly to ALB if needed (bypass CDN)
```

### 4.7 Secret Compromise

**Detection:** Unusual API activity, failed auth attempts, security alerts
**Recovery:**

```bash
# 1. Rotate the compromised secret in AWS Secrets Manager
aws secretsmanager put-secret-value \
  --secret-id complyeasy-production/app-secrets \
  --secret-string '{"JWT_SECRET":"<new-value>"}'

# 2. Force new ECS deployment to pick up rotated secrets
aws ecs update-service \
  --cluster complyeasy-production \
  --service complyeasy-production-api \
  --force-new-deployment

# 3. If JWT_SECRET was compromised, all existing sessions are invalidated
#    Users will need to re-authenticate (this is the desired behavior)

# 4. Review audit logs for unauthorized access
# Check Sentry, CloudWatch logs, and application audit trail
```

---

## 5. Communication Plan

| Severity | Audience | Channel | Timing |
|----------|----------|---------|--------|
| P0 (Full outage) | All customers | Status page + Email | Within 15 min |
| P1 (Partial outage) | Affected customers | Status page | Within 30 min |
| P2 (Degraded) | Internal team | Slack #incidents | Within 1 hour |
| P3 (Minor) | Engineering | Slack #engineering | Next standup |

---

## 6. Testing & Drills

| Test | Frequency | Last Tested | Owner |
|------|-----------|-------------|-------|
| Database restore from backup | Quarterly | — | DBA / Platform |
| Container failover | Monthly | — | Platform Engineering |
| Full DR simulation | Semi-annually | — | Engineering Lead |
| Secret rotation | Quarterly | — | Security Team |
| Chaos engineering tests | Monthly | — | QA / Platform |

**Chaos Engineering:**
The codebase includes built-in chaos engineering tests:
```bash
cd server && npm run test:chaos       # Run chaos scenarios
cd server && npm run test:resilience  # Run resilience tests
```

---

## 7. Post-Incident Review

After every P0/P1 incident:

1. **Timeline:** Document exact sequence of events
2. **Root Cause:** 5-whys analysis
3. **Impact:** Users affected, data loss, duration
4. **Resolution:** What fixed it
5. **Action Items:** Preventive measures with owners and deadlines
6. **Blameless:** Focus on systems, not individuals

---

## 8. Key Contacts & Runbooks

| Role | Contact | Escalation |
|------|---------|------------|
| On-call Engineer | PagerDuty rotation | Auto-escalates after 15 min |
| Platform Lead | — | For P0 incidents |
| Supabase Support | support.supabase.com | For database issues |
| AWS Support | AWS Console | For infrastructure issues |

---

## 9. Infrastructure as Code Recovery

All infrastructure is defined in CDK and can be fully recreated:

```bash
# Recreate entire infrastructure from scratch
cd infrastructure
npm install
npx cdk deploy --all --require-approval never

# This recreates: VPC, ECS Cluster, ALB, ElastiCache, S3, CloudFront, IAM roles
# Database is external (Supabase) and not affected
```

---

## 10. Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-03-04 | Platform Engineering | Initial DR plan created |
