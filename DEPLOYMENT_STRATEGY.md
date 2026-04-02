# Deployment Strategy

## Current Architecture

ComplyEasyAI uses a containerized deployment pipeline:
- **CI/CD**: GitHub Actions builds Docker images, runs tests, and pushes SHA-tagged images to AWS ECR
- **Runtime**: ECS Fargate runs backend containers behind an Application Load Balancer
- **Frontend**: Static assets served via Nginx container with API reverse proxy
- **Database**: PostgreSQL on RDS with automated backups

## Deployment Flow

1. **Code merged to main** triggers CI pipeline
2. **Build phase**: Multi-stage Docker build produces backend and frontend images
3. **Test phase**: Unit, integration, and security tests must pass
4. **Scan phase**: CodeQL, Semgrep, Trivy, and GitLeaks run in parallel
5. **Push phase**: SHA-tagged images pushed to ECR (no `:latest` tag)
6. **Deploy phase**: ECS task definitions updated with new image SHA
7. **Health check**: ECS waits for `/health` endpoint to return 200 before routing traffic

## Rolling Deployment (Current)

ECS performs rolling updates by default:
- New tasks are started with the updated image
- Health checks must pass before old tasks are drained
- Minimum healthy percent: 50%
- Maximum percent: 200%
- Rollback: ECS automatically stops deployment if new tasks fail health checks

## Canary Deployment (Recommended for High-Risk Releases)

For releases that change critical paths (auth, billing, multi-tenant isolation):

1. Deploy to a canary ECS service (5% traffic via ALB weighted target groups)
2. Monitor for 15 minutes:
   - Error rate < 0.1%
   - P99 latency < 500ms
   - No Sentry alerts
3. If metrics pass, shift to 25% > 50% > 100% over 30 minutes
4. If any metric breaches threshold, auto-rollback to previous task definition

### Implementation Steps

1. Create a canary target group in ALB
2. Add weighted routing rules (95/5 split)
3. Add CloudWatch alarms for error rate and latency
4. Add CodeDeploy deployment group with auto-rollback on alarm

## Blue-Green Deployment (Recommended for Database Migrations)

For releases that include schema changes:

1. **Blue** (current): Running production
2. **Green** (new): Deploy new version to separate ECS service
3. Run database migration against shared RDS (backward-compatible migrations only)
4. Validate green environment via internal health checks
5. Switch ALB target group from blue to green
6. Keep blue running for 1 hour as rollback target
7. Decommission blue after validation period

## Rollback Procedures

### Application Rollback
```bash
# Revert to previous ECS task definition
aws ecs update-service --cluster complyeasy --service api --task-definition complyeasy-api:<previous_revision>
```

### Database Rollback
See `server/prisma/migrations/MIGRATION_ROLLBACK.md` for per-migration rollback SQL.

## Pre-Deployment Checklist

- [ ] All tests pass (unit, integration, security, E2E)
- [ ] No new HIGH/CRITICAL vulnerabilities in `npm audit`
- [ ] Database migration is backward-compatible (additive only)
- [ ] Feature flags configured for any breaking changes
- [ ] Rollback plan documented and tested
- [ ] On-call engineer notified
