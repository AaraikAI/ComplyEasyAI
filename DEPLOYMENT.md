# ComplyEasy AI - Production Deployment Guide

## 📋 Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Infrastructure Setup](#infrastructure-setup)
3. [Database Configuration](#database-configuration)
4. [Environment Configuration](#environment-configuration)
5. [Deployment Options](#deployment-options)
6. [Post-Deployment Steps](#post-deployment-steps)
7. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Pre-Deployment Checklist

Before deploying to production:

### Code & Testing
- [ ] All tests pass locally (see TESTING.md)
- [ ] Code is committed and pushed to main/production branch
- [ ] No sensitive data in code (API keys, passwords)
- [ ] Environment variables documented
- [ ] Dependencies updated to stable versions
- [ ] Security audit completed (`npm audit`)

### Infrastructure
- [ ] Domain name registered
- [ ] SSL/TLS certificate obtained
- [ ] Production database provisioned
- [ ] File storage configured (AWS S3 or similar)
- [ ] Email service configured (SendGrid)
- [ ] Monitoring tools setup

### Security
- [ ] JWT secret generated (strong, random)
- [ ] Encryption keys generated
- [ ] Rate limiting configured
- [ ] CORS origins restricted to production domains
- [ ] SQL injection protections verified
- [ ] XSS protections enabled (Helmet.js configured)

---

## Infrastructure Setup

### Option 1: Cloud Platform (Recommended)

We'll cover deployment to **Heroku**, **AWS**, **DigitalOcean**, and **Railway**.

---

## Deployment Options

### Option A: Deploy to Heroku

#### Step 1: Install Heroku CLI

```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login
```

#### Step 2: Create Heroku Apps

```bash
# Backend app
heroku create complyeasy-backend

# Frontend app
heroku create complyeasy-frontend
```

#### Step 3: Add PostgreSQL Database

```bash
# Add Heroku Postgres (Standard plan recommended)
heroku addons:create heroku-postgresql:standard-0 --app complyeasy-backend

# Get database URL
heroku config:get DATABASE_URL --app complyeasy-backend
```

#### Step 4: Configure Environment Variables

```bash
# Set all environment variables
heroku config:set \
  NODE_ENV=production \
  JWT_SECRET="$(openssl rand -hex 32)" \
  ENCRYPTION_KEY="$(openssl rand -hex 32)" \
  GEMINI_API_KEY="your-gemini-api-key" \
  SENDGRID_API_KEY="your-sendgrid-key" \
  FROM_EMAIL="noreply@complyeasy.ai" \
  AWS_ACCESS_KEY_ID="your-aws-key" \
  AWS_SECRET_ACCESS_KEY="your-aws-secret" \
  AWS_REGION="us-east-1" \
  AWS_S3_BUCKET="complyeasy-prod-uploads" \
  STRIPE_SECRET_KEY="sk_live_..." \
  FRONTEND_URL="https://complyeasy-frontend.herokuapp.com" \
  --app complyeasy-backend
```

#### Step 5: Deploy Backend

```bash
cd /home/user/ComplyEasyAI/server

# Initialize git (if not already)
git init
git add .
git commit -m "Initial production deployment"

# Add Heroku remote
heroku git:remote -a complyeasy-backend

# Deploy
git push heroku main

# Run database migrations
heroku run npx prisma migrate deploy --app complyeasy-backend

# Scale dynos
heroku ps:scale web=1:standard-1x --app complyeasy-backend
```

#### Step 6: Deploy Frontend

```bash
cd /home/user/ComplyEasyAI

# Update frontend API URL in .env.production
echo "VITE_API_URL=https://complyeasy-backend.herokuapp.com/api" > .env.production

# Build frontend
npm run build

# Deploy to Heroku
heroku git:remote -a complyeasy-frontend
git push heroku main
```

#### Step 7: Configure Custom Domain (Optional)

```bash
# Add custom domain
heroku domains:add www.complyeasy.ai --app complyeasy-backend
heroku domains:add www.complyeasy.ai --app complyeasy-frontend

# Get DNS targets
heroku domains --app complyeasy-backend

# Add CNAME records in your DNS provider:
# api.complyeasy.ai → <heroku-dns-target>
# www.complyeasy.ai → <heroku-dns-target>
```

---

### Option B: Deploy to AWS (EC2 + RDS)

#### Step 1: Create RDS PostgreSQL Database

```bash
# Via AWS CLI
aws rds create-db-instance \
  --db-instance-identifier complyeasy-prod-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --master-username complyeasy_admin \
  --master-user-password "YourSecurePassword123!" \
  --allocated-storage 100 \
  --vpc-security-group-ids sg-xxxxx \
  --backup-retention-period 7 \
  --multi-az \
  --publicly-accessible false

# Get database endpoint
aws rds describe-db-instances \
  --db-instance-identifier complyeasy-prod-db \
  --query 'DBInstances[0].Endpoint.Address'
```

#### Step 2: Launch EC2 Instance

```bash
# Launch Ubuntu 22.04 LTS instance (t3.medium recommended)
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.medium \
  --key-name your-key-pair \
  --security-group-ids sg-xxxxx \
  --subnet-id subnet-xxxxx \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=ComplyEasy-Backend}]'

# Get instance public IP
aws ec2 describe-instances \
  --instance-ids i-xxxxx \
  --query 'Reservations[0].Instances[0].PublicIpAddress'
```

#### Step 3: Connect and Setup EC2

```bash
# SSH into instance
ssh -i your-key.pem ubuntu@<instance-public-ip>

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Clone repository
cd /var/www
sudo git clone https://github.com/yourusername/ComplyEasyAI.git
cd ComplyEasyAI/server
sudo npm install --production
```

#### Step 4: Configure Environment Variables

```bash
# Create .env file
sudo nano /var/www/ComplyEasyAI/server/.env

# Add production variables (same as Heroku section above)
```

#### Step 5: Setup PM2

```bash
cd /var/www/ComplyEasyAI/server

# Build TypeScript
npm run build

# Start with PM2
pm2 start dist/index.js --name complyeasy-backend

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup systemd
# Run the command it outputs

# Monitor
pm2 monit
```

#### Step 6: Configure Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/complyeasy

# Add configuration:
server {
    listen 80;
    server_name api.complyeasy.ai;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3001/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/complyeasy /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 7: Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d api.complyeasy.ai

# Auto-renewal is configured automatically
# Test renewal
sudo certbot renew --dry-run
```

#### Step 8: Run Database Migrations

```bash
cd /var/www/ComplyEasyAI/server
npx prisma migrate deploy
```

---

### Option C: Deploy to DigitalOcean App Platform

#### Step 1: Create DigitalOcean Account and Install CLI

```bash
# Install doctl
sudo snap install doctl

# Authenticate
doctl auth init
```

#### Step 2: Create Database

```bash
# Create managed PostgreSQL database
doctl databases create complyeasy-db \
  --engine pg \
  --region nyc3 \
  --size db-s-2vcpu-4gb \
  --num-nodes 1

# Get connection details
doctl databases connection complyeasy-db
```

#### Step 3: Deploy via App Platform

```bash
# Create app.yaml
cat > app.yaml << 'EOF'
name: complyeasy
region: nyc
services:
- name: backend
  github:
    repo: yourusername/ComplyEasyAI
    branch: main
    deploy_on_push: true
  source_dir: /server
  build_command: npm run build
  run_command: npm start
  environment_slug: node-js
  instance_count: 2
  instance_size_slug: professional-xs
  http_port: 3001
  envs:
  - key: NODE_ENV
    value: production
  - key: DATABASE_URL
    value: ${complyeasy-db.DATABASE_URL}
  - key: JWT_SECRET
    value: ${JWT_SECRET}
    type: SECRET
  - key: ENCRYPTION_KEY
    value: ${ENCRYPTION_KEY}
    type: SECRET

- name: frontend
  github:
    repo: yourusername/ComplyEasyAI
    branch: main
    deploy_on_push: true
  source_dir: /
  build_command: npm run build
  environment_slug: node-js
  http_port: 5173
  routes:
  - path: /
EOF

# Deploy
doctl apps create --spec app.yaml
```

---

### Option D: Deploy to Railway

#### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli

# Login
railway login
```

#### Step 2: Initialize Project

```bash
cd /home/user/ComplyEasyAI/server

# Create new project
railway init

# Add PostgreSQL
railway add --plugin postgresql

# Link to project
railway link
```

#### Step 3: Configure Environment Variables

```bash
# Set variables via CLI
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=$(openssl rand -hex 32)
railway variables set ENCRYPTION_KEY=$(openssl rand -hex 32)
railway variables set GEMINI_API_KEY=your-key
# ... add all other variables
```

#### Step 4: Deploy

```bash
# Deploy backend
railway up

# Deploy frontend (in new terminal)
cd /home/user/ComplyEasyAI
railway init
railway up
```

---

## Database Configuration

### Step 1: Secure Database Access

```bash
# For AWS RDS
# 1. Use SSL connections
# 2. Restrict security group to only EC2 instances
# 3. Enable automated backups
# 4. Enable encryption at rest

# Update DATABASE_URL to use SSL
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
```

### Step 2: Run Migrations

```bash
# Connect to production database
npx prisma migrate deploy

# Verify
npx prisma db pull
```

### Step 3: Setup Database Backups

```bash
# For managed databases (Heroku, AWS RDS, DO)
# Backups are automatic

# For self-hosted PostgreSQL
# Setup daily backups
crontab -e

# Add:
0 2 * * * pg_dump -U complyeasy_admin complyeasy > /backups/complyeasy-$(date +\%Y\%m\%d).sql
```

---

## Environment Configuration

### Production Environment Variables

Create comprehensive `.env.production`:

```bash
# Server
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://www.complyeasy.ai

# Database
DATABASE_URL=postgresql://user:password@host:5432/complyeasy?sslmode=require

# Security
JWT_SECRET=<64-char-random-hex>
ENCRYPTION_KEY=<64-char-random-hex>

# AI
GEMINI_API_KEY=<your-gemini-api-key>

# Email
SENDGRID_API_KEY=<your-sendgrid-key>
FROM_EMAIL=noreply@complyeasy.ai

# Storage
AWS_ACCESS_KEY_ID=<your-aws-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret>
AWS_REGION=us-east-1
AWS_S3_BUCKET=complyeasy-prod-uploads

# Payments
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# OAuth (if enabled)
GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-client-secret>
GOOGLE_REDIRECT_URI=https://api.complyeasy.ai/api/integrations/google/callback

GITHUB_CLIENT_ID=<github-client-id>
GITHUB_CLIENT_SECRET=<github-client-secret>
GITHUB_REDIRECT_URI=https://api.complyeasy.ai/api/integrations/github/callback

SLACK_CLIENT_ID=<slack-client-id>
SLACK_CLIENT_SECRET=<slack-client-secret>
SLACK_REDIRECT_URI=https://api.complyeasy.ai/api/integrations/slack/callback

JIRA_CLIENT_ID=<jira-client-id>
JIRA_CLIENT_SECRET=<jira-client-secret>
JIRA_REDIRECT_URI=https://api.complyeasy.ai/api/integrations/jira/callback

# Advanced Features (optional)
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your-api-key
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/your-api-key
BLOCKCHAIN_PRIVATE_KEY=<your-private-key>
COMPLIANCE_CONTRACT_ADDRESS=0x...
AWS_KMS_KEY_ID=<kms-key-id>
AZURE_KEY_VAULT_URL=https://your-vault.vault.azure.net/
OPA_ENDPOINT=http://opa-server:8181

# Monitoring (optional)
SENTRY_DSN=<your-sentry-dsn>
LOGTAIL_SOURCE_TOKEN=<logtail-token>
```

### Generate Secure Secrets

```bash
# JWT Secret (64 bytes)
openssl rand -hex 32

# Encryption Key (32 bytes)
openssl rand -hex 16

# Alternative using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Post-Deployment Steps

### Step 1: Verify Deployment

```bash
# Test API health
curl https://api.complyeasy.ai/health

# Expected: { "status": "ok", "database": "connected", ... }

# Test authentication
curl -X POST https://api.complyeasy.ai/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "name": "Test User",
    "organizationName": "Test Org"
  }'
```

### Step 2: Setup Domain & SSL

```bash
# Point DNS records to your server:
# A record: api.complyeasy.ai → <server-ip>
# A record: www.complyeasy.ai → <server-ip>

# Verify DNS propagation
dig api.complyeasy.ai +short

# SSL should be configured via:
# - Heroku: Automatic with paid dynos
# - AWS: ACM certificate + CloudFront
# - DigitalOcean: Automatic
# - Self-hosted: Let's Encrypt (already configured)
```

### Step 3: Configure CDN (Optional but Recommended)

```bash
# Use CloudFlare for:
# - DDoS protection
# - Global CDN
# - Additional SSL/TLS
# - Rate limiting

# Steps:
# 1. Create CloudFlare account
# 2. Add domain
# 3. Update nameservers at domain registrar
# 4. Enable proxy (orange cloud) for DNS records
# 5. Configure SSL to "Full (strict)"
# 6. Enable additional security features
```

### Step 4: Setup Monitoring

#### Install Sentry for Error Tracking

```bash
# Install Sentry SDK
npm install @sentry/node @sentry/tracing

# Add to server/src/index.ts (before other code)
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

#### Setup Uptime Monitoring

```bash
# Use UptimeRobot or similar
# Monitor endpoints:
# - https://api.complyeasy.ai/health (every 5 minutes)
# - https://www.complyeasy.ai (every 5 minutes)

# Configure alerts via email/SMS/Slack
```

#### Setup Log Aggregation

```bash
# Install winston + logtail
npm install winston-logtail

# Update logger in server/src/config/logger.ts
import { Logtail } from '@logtail/node';
import { LogtailTransport } from '@logtail/winston';

const logtail = new Logtail(process.env.LOGTAIL_SOURCE_TOKEN!);

logger.add(new LogtailTransport(logtail));
```

---

## Security Hardening

### Step 1: Enable Rate Limiting

Already configured in code, but verify:

```typescript
// server/src/middleware/rateLimiter.ts
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts',
});
```

### Step 2: Setup Firewall

```bash
# For AWS Security Groups
# Allow:
# - Port 80 (HTTP) from 0.0.0.0/0
# - Port 443 (HTTPS) from 0.0.0.0/0
# - Port 22 (SSH) from your IP only
# - Port 5432 (PostgreSQL) from EC2 security group only

# For DigitalOcean/self-hosted
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

### Step 3: Regular Security Updates

```bash
# Setup automatic security updates (Ubuntu)
sudo apt install unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades

# For dependencies
npm audit fix
npm outdated
```

---

## Monitoring & Maintenance

### Daily Tasks

- [ ] Check error logs
- [ ] Monitor uptime
- [ ] Review security alerts

### Weekly Tasks

- [ ] Review database performance
- [ ] Check disk space
- [ ] Analyze API usage patterns
- [ ] Review backup status

### Monthly Tasks

- [ ] Update dependencies (`npm update`)
- [ ] Review and rotate API keys
- [ ] Database optimization
- [ ] Security audit
- [ ] Load testing

### Database Maintenance

```bash
# PostgreSQL vacuum and analyze
psql $DATABASE_URL -c "VACUUM ANALYZE;"

# Check database size
psql $DATABASE_URL -c "SELECT pg_size_pretty(pg_database_size('complyeasy'));"

# Check table sizes
psql $DATABASE_URL -c "
  SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
```

---

## Rollback Procedure

If deployment fails:

### Heroku

```bash
# List releases
heroku releases --app complyeasy-backend

# Rollback to previous version
heroku rollback v123 --app complyeasy-backend
```

### AWS/Self-hosted

```bash
# Stop current version
pm2 stop complyeasy-backend

# Checkout previous version
cd /var/www/ComplyEasyAI
git log --oneline -5
git checkout <previous-commit-hash>

# Rebuild and restart
cd server
npm run build
pm2 restart complyeasy-backend
```

### Database Rollback

```bash
# Restore from backup
pg_restore -U complyeasy_admin -d complyeasy /backups/complyeasy-20251203.sql

# Or rollback specific migration
npx prisma migrate resolve --rolled-back <migration-name>
```

---

## Production Checklist

Before going live:

- [ ] All environment variables set
- [ ] Database migrations run
- [ ] SSL certificate installed
- [ ] Custom domain configured
- [ ] DNS records updated
- [ ] Monitoring setup (Sentry, Uptime)
- [ ] Backups configured
- [ ] Load testing completed
- [ ] Security scan completed
- [ ] Documentation updated
- [ ] Team notified
- [ ] Emergency contacts documented

---

## Support & Troubleshooting

### Common Issues

**Issue: Database connection timeout**
```bash
# Check security group/firewall
# Verify DATABASE_URL
# Test connection: psql $DATABASE_URL
```

**Issue: Memory errors**
```bash
# Increase Node.js memory
node --max-old-space-size=4096 dist/index.js

# Or in PM2
pm2 start dist/index.js --node-args="--max-old-space-size=4096"
```

**Issue: WebSocket not connecting**
```bash
# Ensure nginx WebSocket config is correct
# Check CORS settings
# Verify socket.io version compatibility
```

---

## Scaling Strategy

### Horizontal Scaling

```bash
# Heroku
heroku ps:scale web=3:standard-2x --app complyeasy-backend

# AWS with Load Balancer
# 1. Create Application Load Balancer
# 2. Create Auto Scaling Group
# 3. Configure health checks
# 4. Set min/max instances (2-10)

# PM2 Cluster Mode
pm2 start dist/index.js -i max --name complyeasy-backend
```

### Database Scaling

```bash
# Enable read replicas (AWS RDS)
aws rds create-db-instance-read-replica \
  --db-instance-identifier complyeasy-replica \
  --source-db-instance-identifier complyeasy-prod-db

# Connection pooling (PgBouncer)
# Install on separate instance and point DATABASE_URL to it
```

---

## Success! 🎉

Your ComplyEasy AI application is now deployed to production and ready to serve users!

**Next Steps:**
1. Monitor logs for first 24 hours
2. Set up alerting for critical issues
3. Implement analytics (Google Analytics, Mixpanel, etc.)
4. Document API for external consumers
5. Create user onboarding flow
6. Set up customer support system

For questions or issues, refer to the troubleshooting section or create an issue on GitHub.
