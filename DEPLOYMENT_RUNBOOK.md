# ComplyEasy AI - Deployment Runbook

This runbook provides step-by-step instructions for deploying ComplyEasy AI to different environments.

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Development Deployment](#development-deployment)
3. [Staging Deployment](#staging-deployment)
4. [Production Deployment](#production-deployment)
5. [Rollback Procedures](#rollback-procedures)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### Code & Testing
- [ ] All tests pass (`npm run test:all`)
- [ ] Code reviewed and approved
- [ ] No sensitive data in code
- [ ] Environment variables documented
- [ ] Dependencies updated
- [ ] Security audit passed (`npm run security:audit`)

### Infrastructure
- [ ] Database provisioned and accessible
- [ ] Environment variables configured
- [ ] SSL/TLS certificates ready
- [ ] Domain DNS configured
- [ ] Monitoring tools configured
- [ ] Backup strategy in place

### Continuous Monitoring (ENABLE_REAL_MONITORING)
- **Demo-only (default):** When `ENABLE_REAL_MONITORING` is unset or `false`, monitor runs return simulated results; no external scanning tools are called.
- **Real integrations:** Setting `ENABLE_REAL_MONITORING=true` is intended for production use with real security/scanning integrations; as of this release, real integrations are not yet implemented and monitor execution will error. Keep `ENABLE_REAL_MONITORING=false` until real integrations are added in `server/src/services/monitoringService.ts`.

### Security
- [ ] JWT secrets generated (32+ characters)
- [ ] Encryption keys generated
- [ ] CORS origins configured
- [ ] Rate limiting configured
- [ ] Security headers verified

---

## Development Deployment

### Local Development Setup

```bash
# 1. Clone repository
git clone https://github.com/AaraikAI/ComplyEasyAI.git
cd ComplyEasyAI

# 2. Install dependencies
npm install
cd server && npm install

# 3. Set up environment
cp server/.env.example server/.env
# Edit server/.env with your configuration

# 4. Validate environment
cd server
npm run validate:env

# 5. Set up database
npx prisma generate
npx prisma migrate dev

# 6. Start services
# Terminal 1: Backend
cd server
npm run dev

# Terminal 2: Frontend
cd ..
npm run dev
```

### Docker Development

```bash
# Build and start
docker-compose up --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## Staging Deployment

### Prerequisites
- Staging database provisioned
- Staging environment variables configured
- CI/CD pipeline configured

### Automated Deployment (CI/CD)

```bash
# Push to staging branch
git checkout staging
git merge main
git push origin staging
```

The CI/CD pipeline will:
1. Run tests
2. Build Docker images
3. Deploy to staging environment
4. Run health checks
5. Send deployment notifications

### Manual Deployment

```bash
# 1. Build Docker image
docker build -t complyeasy-ai:staging .

# 2. Tag for registry
docker tag complyeasy-ai:staging registry.com/complyeasy-ai:staging

# 3. Push to registry
docker push registry.com/complyeasy-ai:staging

# 4. Deploy to staging
# (Using your deployment platform)
kubectl set image deployment/complyeasy-api api=registry.com/complyeasy-ai:staging
```

### Post-Staging Deployment

```bash
# 1. Verify health
curl https://staging-api.complyeasy.ai/health

# 2. Run smoke tests
npm run test:smoke

# 3. Check logs
kubectl logs -f deployment/complyeasy-api

# 4. Monitor for 30 minutes
# Check error rates, response times, database connections
```

---

## Production Deployment

### Pre-Production Steps

1. **Final Testing**
   ```bash
   # Run full test suite
   npm run test:all
   
   # Run security audit
   npm run security:audit
   
   # Run performance tests
   npm run performance:load
   ```

2. **Database Migration**
   ```bash
   # Review migrations
   npx prisma migrate status
   
   # Apply migrations (dry run first)
   npx prisma migrate deploy --preview-feature
   
   # Apply migrations
   npx prisma migrate deploy
   ```

3. **Backup Database**
   ```bash
   # Create backup before deployment
   pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql
   ```

### Deployment Process

#### Option 1: Blue-Green Deployment (Recommended)

```bash
# 1. Deploy to green environment
kubectl apply -f k8s/green-deployment.yaml

# 2. Wait for green to be healthy
kubectl wait --for=condition=available deployment/complyeasy-api-green --timeout=300s

# 3. Run smoke tests on green
curl https://green-api.complyeasy.ai/health

# 4. Switch traffic to green
kubectl apply -f k8s/service-green.yaml

# 5. Monitor for 10 minutes
# Check error rates, response times

# 6. If stable, keep green; if issues, rollback to blue
```

#### Option 2: Rolling Deployment

```bash
# 1. Update deployment
kubectl set image deployment/complyeasy-api api=registry.com/complyeasy-ai:v2.0.0

# 2. Monitor rollout
kubectl rollout status deployment/complyeasy-api

# 3. Verify deployment
kubectl get pods -l app=complyeasy-api

# 4. Check health
curl https://api.complyeasy.ai/health
```

#### Option 3: Canary Deployment

```bash
# 1. Deploy canary (10% traffic)
kubectl apply -f k8s/canary-deployment.yaml

# 2. Monitor canary for 30 minutes
# Check error rates, performance metrics

# 3. Gradually increase traffic
# 10% → 25% → 50% → 100%

# 4. If stable, promote to full deployment
```

### Post-Production Deployment

1. **Health Check**
   ```bash
   curl https://api.complyeasy.ai/health
   ```

2. **Smoke Tests**
   ```bash
   # Test critical endpoints
   curl -H "Authorization: Bearer $TOKEN" https://api.complyeasy.ai/api/risks
   ```

3. **Monitor Metrics**
   - Error rates
   - Response times
   - Database connections
   - Memory usage
   - CPU usage

4. **Verify Features**
   - Authentication flow
   - Risk management
   - AI features
   - Integrations

---

## Rollback Procedures

### Quick Rollback (Last Deployment)

```bash
# Kubernetes
kubectl rollout undo deployment/complyeasy-api

# Docker Compose
docker-compose down
docker-compose up -d --scale api=1 --no-recreate
```

### Rollback to Specific Version

```bash
# 1. Identify previous version
kubectl rollout history deployment/complyeasy-api

# 2. Rollback to specific revision
kubectl rollout undo deployment/complyeasy-api --to-revision=2

# 3. Verify rollback
kubectl rollout status deployment/complyeasy-api
```

### Database Rollback

```bash
# 1. Restore from backup
psql $DATABASE_URL < backup-20241218-120000.sql

# 2. Or rollback specific migration
npx prisma migrate resolve --rolled-back <migration-name>
```

### Emergency Rollback

If critical issues are detected:

1. **Immediate Rollback**
   ```bash
   kubectl rollout undo deployment/complyeasy-api
   ```

2. **Disable New Features**
   - Use feature flags if available
   - Revert to previous code version

3. **Notify Team**
   - Alert on-call engineer
   - Update status page
   - Notify stakeholders

---

## Post-Deployment Verification

### Automated Checks

```bash
# Health check
curl https://api.complyeasy.ai/health

# API endpoints
curl -H "Authorization: Bearer $TOKEN" https://api.complyeasy.ai/api/risks

# Database connectivity
curl https://api.complyeasy.ai/health | jq .database
```

### Manual Verification

1. **Authentication**
   - [ ] User registration works
   - [ ] Magic link authentication works
   - [ ] Token refresh works
   - [ ] 2FA works

2. **Core Features**
   - [ ] Risk management works
   - [ ] Framework management works
   - [ ] AI features work
   - [ ] Reporting works

3. **Integrations**
   - [ ] OAuth integrations work
   - [ ] Webhook endpoints work
   - [ ] External API calls work

4. **Performance**
   - [ ] Response times acceptable
   - [ ] No memory leaks
   - [ ] Database queries optimized

---

## Troubleshooting

### Common Issues

#### Issue: Deployment Fails

**Symptoms:**
- Pods not starting
- Health checks failing
- Errors in logs

**Resolution:**
```bash
# Check pod status
kubectl get pods

# Check logs
kubectl logs <pod-name>

# Check events
kubectl describe pod <pod-name>

# Common causes:
# - Environment variables missing
# - Database connection issues
# - Resource limits exceeded
```

#### Issue: Database Connection Errors

**Symptoms:**
- "Connection refused" errors
- "Authentication failed" errors
- Timeout errors

**Resolution:**
```bash
# Verify database URL
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check network connectivity
# Verify firewall rules
# Check SSL requirements
```

#### Issue: High Error Rates

**Symptoms:**
- 500 errors increasing
- Timeout errors
- Memory errors

**Resolution:**
```bash
# Check application logs
kubectl logs -f deployment/complyeasy-api

# Check resource usage
kubectl top pods

# Scale up if needed
kubectl scale deployment/complyeasy-api --replicas=3

# Check database performance
npm run performance:profile
```

#### Issue: Slow Response Times

**Symptoms:**
- P95 response time > 1s
- Timeout errors
- User complaints

**Resolution:**
```bash
# Profile database queries
npm run performance:profile

# Check for N+1 queries
# Review slow query log
# Add database indexes
# Enable caching
```

---

## Deployment Platforms

### AWS (ECS/EKS)

```bash
# Build and push to ECR
aws ecr get-login-password | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com
docker build -t complyeasy-ai .
docker tag complyeasy-ai:latest <account>.dkr.ecr.<region>.amazonaws.com/complyeasy-ai:latest
docker push <account>.dkr.ecr.<region>.amazonaws.com/complyeasy-ai:latest

# Update ECS service
aws ecs update-service --cluster complyeasy-cluster --service complyeasy-api --force-new-deployment
```

### Google Cloud (GKE)

```bash
# Build and push to GCR
gcloud builds submit --tag gcr.io/<project>/complyeasy-ai

# Deploy to GKE
kubectl set image deployment/complyeasy-api api=gcr.io/<project>/complyeasy-ai:latest
```

### Azure (AKS)

```bash
# Build and push to ACR
az acr build --registry <registry> --image complyeasy-ai:latest .

# Deploy to AKS
kubectl set image deployment/complyeasy-api api=<registry>.azurecr.io/complyeasy-ai:latest
```

### Heroku

```bash
# Deploy
git push heroku main

# Run migrations
heroku run npx prisma migrate deploy

# Scale dynos
heroku ps:scale web=2
```

### Railway

```bash
# Connect repository
# Railway will auto-deploy on push to main

# Set environment variables in Railway dashboard
# Run migrations via Railway CLI or dashboard
```

---

## Monitoring During Deployment

### Key Metrics to Watch

1. **Error Rate**
   - Should be < 0.1%
   - Alert if > 1%

2. **Response Time**
   - P50 < 200ms
   - P95 < 500ms
   - P99 < 1000ms

3. **Database Connections**
   - Connection pool usage
   - Query performance

4. **Resource Usage**
   - CPU < 70%
   - Memory < 80%

### Monitoring Tools

- **APM:** New Relic, Datadog, AppDynamics
- **Logs:** ELK Stack, CloudWatch, Splunk
- **Errors:** Sentry, Rollbar
- **Metrics:** Prometheus, Grafana

---

## Best Practices

1. **Always Test in Staging First**
   - Deploy to staging
   - Run full test suite
   - Monitor for 24 hours

2. **Use Feature Flags**
   - Gradual feature rollout
   - Easy rollback
   - A/B testing

3. **Maintain Deployment Logs**
   - Document each deployment
   - Track issues and resolutions
   - Review deployment history

4. **Automate Where Possible**
   - CI/CD pipelines
   - Automated testing
   - Automated rollback triggers

5. **Have Rollback Plan Ready**
   - Know rollback procedures
   - Test rollback process
   - Keep previous versions available

---

**Last Updated:** December 18, 2024

