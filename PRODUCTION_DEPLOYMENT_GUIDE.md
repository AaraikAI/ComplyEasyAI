# 🚀 ComplyEasy AI - Complete Production Deployment Guide

**Date:** January 2026  
**Status:** Production Ready  
**Version:** 2.0.0

---

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [SendGrid Configuration & Testing](#sendgrid-configuration--testing)
3. [Environment Variables Setup](#environment-variables-setup)
4. [Database Setup](#database-setup)
5. [Build & Test](#build--test)
6. [Deployment Options](#deployment-options)
7. [Post-Deployment Verification](#post-deployment-verification)
8. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Pre-Deployment Checklist

### ✅ Code Quality
- [ ] All code committed to repository
- [ ] No sensitive data in code (API keys, passwords)
- [ ] All tests passing (`npm test`)
- [ ] Security audit completed (`npm run security:audit`)
- [ ] Dependencies updated to stable versions
- [ ] No console.log statements in production code
- [ ] Error handling implemented throughout

### ✅ Infrastructure
- [ ] Domain name registered and DNS configured
- [ ] SSL/TLS certificate obtained (or auto-provisioned)
- [ ] Production database provisioned (Supabase/AWS RDS)
- [ ] File storage configured (AWS S3 or similar)
- [ ] Email service configured (SendGrid)
- [ ] Monitoring tools setup (Sentry, APM)
- [ ] Backup strategy in place

### ✅ Security
- [ ] JWT secrets generated (strong, random, 32+ chars)
- [ ] Encryption keys generated (32+ chars)
- [ ] Rate limiting configured
- [ ] CORS origins restricted to production domains
- [ ] SQL injection protections verified (Prisma handles this)
- [ ] XSS protections enabled (Helmet.js configured)
- [ ] Environment variables secured (not in git)

---

## SendGrid Configuration & Testing

### Step 1: Verify SendGrid API Key

1. **Check SendGrid Dashboard:**
   - Go to https://app.sendgrid.com/settings/api_keys
   - Verify your API key exists and is active
   - Ensure it has "Full Access" or "Mail Send" permissions

2. **Verify Sender Email:**
   - Go to https://app.sendgrid.com/settings/sender_auth
   - Verify your sender email is verified
   - For production, consider Domain Authentication instead of Single Sender

3. **Test SendGrid Connection:**
   ```bash
   cd server
   npm run test:sendgrid
   ```

   This script will:
   - ✅ Validate API key format
   - ✅ Test API key validity
   - ✅ Send a test email
   - ✅ Provide troubleshooting guidance if errors occur

4. **Expected Output:**
   ```
   🔍 Testing SendGrid Connection...
   ============================================================
   ✅ SENDGRID_API_KEY is set and format is valid
   ✅ SENDGRID_FROM_EMAIL is set: noreply@complyeasyai.com
   ✅ SENDGRID_FROM_NAME is set: ComplyEasy AI
   ✅ SendGrid API key initialized
   📡 Testing API key validity...
      Sending test email to: your-email@example.com
   ✅ SUCCESS: Test email sent successfully!
   📧 Check your inbox for the test email.
   ```

### Step 2: Update Environment Variables

Ensure these are set in `server/.env`:

```bash
SENDGRID_API_KEY=SG.your-actual-api-key-here
SENDGRID_FROM_EMAIL=noreply@complyeasyai.com
SENDGRID_FROM_NAME=ComplyEasy AI
```

**Important:** 
- API key must start with `SG.`
- Sender email must be verified in SendGrid
- Use a professional email address (not a personal Gmail)

---

## Environment Variables Setup

### Required Variables (Critical)

Create or update `server/.env` with these **required** variables:

```bash
# ============================================
# Core Configuration
# ============================================
NODE_ENV=production
PORT=5000
API_URL=https://api.complyeasyai.com
CLIENT_URL=https://complyeasyai.com
CORS_ORIGIN=https://complyeasyai.com

# ============================================
# Database (Supabase PostgreSQL)
# ============================================
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

# ============================================
# Security & Authentication
# ============================================
# Generate these with: openssl rand -hex 32
JWT_SECRET=<generate-64-char-hex-string>
JWT_REFRESH_SECRET=<generate-64-char-hex-string>
ENCRYPTION_KEY=<generate-64-char-hex-string>
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# ============================================
# AI Services
# ============================================
GEMINI_API_KEY=<your-gemini-api-key>

# ============================================
# Email Service (SendGrid)
# ============================================
SENDGRID_API_KEY=SG.<your-sendgrid-api-key>
SENDGRID_FROM_EMAIL=noreply@complyeasyai.com
SENDGRID_FROM_NAME=ComplyEasy AI

# ============================================
# Payment Processing (Stripe)
# ============================================
STRIPE_SECRET_KEY=sk_live_<your-live-secret-key>
STRIPE_PUBLISHABLE_KEY=pk_live_<your-live-publishable-key>
STRIPE_WEBHOOK_SECRET=whsec_<your-webhook-secret>
STRIPE_BASIC_PRICE_ID=price_<basic-price-id>
STRIPE_PRO_PRICE_ID=price_<pro-price-id>
STRIPE_ENTERPRISE_PRICE_ID=price_<enterprise-price-id>
```

### Optional Variables (Recommended)

```bash
# ============================================
# AWS Services (for S3 file storage)
# ============================================
AWS_ACCESS_KEY_ID=<your-aws-access-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret-key>
AWS_REGION=us-east-1
AWS_S3_BUCKET=complyeasy-prod-uploads

# ============================================
# OAuth Integrations (if using)
# ============================================
GOOGLE_CLIENT_ID=<google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<google-oauth-secret>
GOOGLE_CALLBACK_URL=https://api.complyeasyai.com/api/integrations/google/callback

GITHUB_CLIENT_ID=<github-oauth-client-id>
GITHUB_CLIENT_SECRET=<github-oauth-secret>
GITHUB_CALLBACK_URL=https://api.complyeasyai.com/api/integrations/github/callback

# ============================================
# Monitoring (Optional)
# ============================================
SENTRY_DSN=<your-sentry-dsn>
SENTRY_ENVIRONMENT=production
LOG_LEVEL=warn
```

### Generate Security Secrets

```bash
# Generate JWT Secret (64 characters)
openssl rand -hex 32

# Generate JWT Refresh Secret (64 characters)
openssl rand -hex 32

# Generate Encryption Key (64 characters)
openssl rand -hex 32
```

**⚠️ IMPORTANT:** 
- Use different values for each secret
- Store these securely (password manager, secret management service)
- Never commit `.env` files to git

### Validate Environment Variables

```bash
cd server
npm run validate:env
```

This will check:
- ✅ All required variables are set
- ✅ Variable formats are correct
- ✅ API keys have correct prefixes
- ✅ Email addresses are valid
- ✅ URLs are properly formatted

---

## Database Setup

### Step 1: Provision Production Database

**Option A: Supabase (Recommended)**
1. Go to https://supabase.com
2. Create a new project
3. Copy the connection string from Settings → Database
4. Add `?sslmode=require` to the connection string

**Option B: AWS RDS**
1. Create PostgreSQL RDS instance
2. Configure security groups
3. Enable automated backups
4. Get connection string

### Step 2: Run Database Migrations

```bash
cd server

# Check migration status
npx prisma migrate status

# Apply all pending migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Verify connection
npx prisma db pull
```

### Step 3: Seed Initial Data (Optional)

```bash
# If you have seed data
npx prisma db seed
```

### Step 4: Create Database Backup

```bash
# Create initial backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql

# Set up automated backups (cron job or managed service)
```

---

## Build & Test

### Step 1: Install Dependencies

```bash
# Root directory
npm install

# Server directory
cd server
npm install
```

### Step 2: Build Application

```bash
# Build frontend
cd ..
npm run build

# Build backend
cd server
npm run build
```

### Step 3: Run Tests

```bash
# Run all tests
cd server
npm test

# Run security audit
npm run security:audit

# Check test coverage
npm run test:coverage
```

### Step 4: Validate Configuration

```bash
cd server
npm run validate:env
npm run test:sendgrid
```

---

## Deployment Options

### Option 1: Vercel (Recommended for Frontend + API Routes)

**Best for:** Quick deployment, automatic SSL, global CDN

#### Steps:

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   vercel login
   ```

2. **Deploy:**
   ```bash
   vercel --prod
   ```

3. **Set Environment Variables:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add all variables from [Environment Variables Setup](#environment-variables-setup)
   - Select "Production" environment

4. **Configure Domain:**
   - Go to Settings → Domains
   - Add your custom domain
   - Update DNS records as instructed

**See:** `VERCEL_DEPLOYMENT_GUIDE.md` for detailed instructions

---

### Option 2: Docker + Cloud Platform

**Best for:** Full control, containerized deployment

#### Steps:

1. **Build Docker Image:**
   ```bash
   docker build -t complyeasy-ai:latest .
   ```

2. **Test Locally:**
   ```bash
   docker run -p 5000:5000 --env-file server/.env complyeasy-ai:latest
   ```

3. **Deploy to Platform:**
   - **AWS ECS/Fargate:** Use `docker-compose.prod.yml`
   - **Google Cloud Run:** `gcloud run deploy`
   - **DigitalOcean App Platform:** Use Dockerfile
   - **Railway:** Connect GitHub repo, auto-deploys

**See:** `docker-compose.prod.yml` for production configuration

---

### Option 3: Traditional Server (VPS)

**Best for:** Self-hosted, full control

#### Steps:

1. **Setup Server:**
   ```bash
   # Install Node.js 20+
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install PM2
   sudo npm install -g pm2
   ```

2. **Clone & Build:**
   ```bash
   git clone <your-repo>
   cd ComplyEasyAI
   npm install
   cd server && npm install && npm run build
   ```

3. **Configure Environment:**
   ```bash
   # Create .env file
   nano server/.env
   # Add all environment variables
   ```

4. **Start with PM2:**
   ```bash
   cd server
   pm2 start dist/index.js --name complyeasy-api
   pm2 save
   pm2 startup
   ```

5. **Setup Nginx Reverse Proxy:**
   ```nginx
   server {
       listen 80;
       server_name complyeasyai.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

6. **Setup SSL with Let's Encrypt:**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d complyeasyai.com
   ```

---

## Post-Deployment Verification

### Step 1: Health Check

```bash
# Check API health
curl https://api.complyeasyai.com/health

# Expected response:
# {"status":"ok","timestamp":"2026-01-16T..."}
```

### Step 2: Test Authentication

1. **Test Magic Link:**
   - Go to https://complyeasyai.com
   - Request a magic link
   - Check email inbox
   - Click link and verify login works

2. **Test API Endpoints:**
   ```bash
   # Test protected endpoint (requires auth token)
   curl -H "Authorization: Bearer <token>" \
        https://api.complyeasyai.com/api/risks
   ```

### Step 3: Verify SendGrid

1. **Send Test Email:**
   ```bash
   cd server
   npm run test:sendgrid
   ```

2. **Check Email Delivery:**
   - Verify test email received
   - Check spam folder if not in inbox
   - Verify sender email matches `SENDGRID_FROM_EMAIL`

### Step 4: Test Critical Features

- [ ] User registration/login
- [ ] Magic link email delivery
- [ ] API authentication
- [ ] Database connections
- [ ] File uploads (if S3 configured)
- [ ] Payment processing (if Stripe configured)
- [ ] AI features (Gemini API)

### Step 5: Performance Check

```bash
# Check response times
curl -w "@curl-format.txt" -o /dev/null -s https://api.complyeasyai.com/health

# Monitor logs
# (depends on your deployment platform)
```

---

## Monitoring & Maintenance

### Step 1: Setup Monitoring

**Sentry (Error Tracking):**
1. Create account at https://sentry.io
2. Create new project
3. Add `SENTRY_DSN` to environment variables
4. Errors will automatically be tracked

**APM (Application Performance Monitoring):**
- Configure Elastic APM, New Relic, or Datadog
- See `MONITORING_SETUP.md` for details

### Continuous Monitoring (ENABLE_REAL_MONITORING)

The **Continuous Monitoring** feature (monitors, run results, dashboards) supports two modes, controlled by the environment variable **`ENABLE_REAL_MONITORING`**:

| `ENABLE_REAL_MONITORING` | Behavior |
|--------------------------|----------|
| **Unset or `false`**     | **Demo-only mode.** Monitor runs return **simulated** results (e.g. pass/fail counts and sample findings). No external security or scanning tools are called. Use this for development, demos, and UI testing. |
| **`true`**               | **Production mode (not yet implemented).** The application is designed to call real integrations (e.g. AWS Config, CloudTrail, MDM APIs, Snyk). As of this release, setting `true` will cause monitor execution to return an error: *"Real monitoring integrations not yet implemented. Please set ENABLE_REAL_MONITORING=false for demo mode."* |

**Recommendations:**
- **Development / staging / demo:** Leave `ENABLE_REAL_MONITORING` unset or set it to `false`.
- **Production:** Until real integrations are implemented, keep `ENABLE_REAL_MONITORING=false` and treat the Monitoring UI as demo-only, or implement the real integration calls in `server/src/services/monitoringService.ts` and then set `ENABLE_REAL_MONITORING=true`.

See `server/src/services/monitoringService.ts` (e.g. `runMonitorTests`) for the gating logic and TODOs for real integration points.

### Step 2: Setup Logging

**File Logs:**
- Logs are written to `server/logs/` directory
- `combined.log` - All logs
- `error.log` - Errors only
- `access.log` - HTTP requests

**Log Rotation:**
```bash
# Setup logrotate
sudo nano /etc/logrotate.d/complyeasy
```

### Step 3: Database Backups

**Automated Backups:**
- Supabase: Automatic daily backups
- AWS RDS: Enable automated backups
- Self-hosted: Setup cron job

**Manual Backup:**
```bash
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

### Step 4: Regular Maintenance

**Weekly:**
- [ ] Review error logs
- [ ] Check database performance
- [ ] Verify backups are working
- [ ] Review security alerts

**Monthly:**
- [ ] Update dependencies (`npm update`)
- [ ] Review and rotate secrets
- [ ] Check disk space
- [ ] Review monitoring dashboards

**Quarterly:**
- [ ] Security audit
- [ ] Performance optimization
- [ ] Database optimization
- [ ] Backup restoration test

---

## Troubleshooting

### SendGrid Issues

**Error: "Invalid API key"**
- Verify API key starts with `SG.`
- Check API key is active in SendGrid dashboard
- Regenerate API key if needed

**Error: "Sender not verified"**
- Go to SendGrid → Settings → Sender Authentication
- Verify sender email or domain
- Wait for verification (can take 24 hours for domain)

**Emails not received:**
- Check spam folder
- Verify recipient email is valid
- Check SendGrid activity logs: https://app.sendgrid.com/activity

### Database Issues

**Connection refused:**
- Verify `DATABASE_URL` is correct
- Check database is accessible from your server
- Verify firewall rules allow connection
- Check SSL mode is set correctly

**Migration errors:**
- Review migration files
- Check database permissions
- Run `npx prisma migrate status` to see pending migrations

### Build Issues

**TypeScript errors:**
- Run `npm run build` to see detailed errors
- Check `tsconfig.json` configuration
- Verify all dependencies installed

**Missing dependencies:**
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Check `package.json` for correct versions

---

## Security Checklist

Before going live, ensure:

- [ ] All environment variables are set
- [ ] `.env` files are in `.gitignore`
- [ ] JWT secrets are strong and unique
- [ ] CORS is restricted to production domain
- [ ] Rate limiting is enabled
- [ ] SSL/TLS is configured
- [ ] Security headers are set (Helmet.js)
- [ ] Database uses SSL connections
- [ ] API keys are production keys (not test keys)
- [ ] Error messages don't expose sensitive info
- [ ] Logs don't contain passwords or tokens

---

## Quick Reference Commands

```bash
# Test SendGrid
cd server && npm run test:sendgrid

# Validate environment
cd server && npm run validate:env

# Build application
npm run build && cd server && npm run build

# Run migrations
cd server && npx prisma migrate deploy

# Start production server
cd server && npm start

# Check health
curl https://api.complyeasyai.com/health
```

---

## Support & Resources

- **Documentation:** See `ENVIRONMENT_VARIABLES.md` for all variables
- **SendGrid Docs:** https://docs.sendgrid.com/
- **Prisma Docs:** https://www.prisma.io/docs/
- **Vercel Docs:** https://vercel.com/docs

---

## Next Steps After Deployment

1. ✅ Monitor error rates for first 24 hours
2. ✅ Test all critical user flows
3. ✅ Setup alerting for critical errors
4. ✅ Document any deployment-specific notes
5. ✅ Schedule regular security audits
6. ✅ Plan for scaling (if needed)

---

**🎉 Congratulations! Your application is now live in production!**

**Last Updated:** January 2026  
**Status:** ✅ Production Ready

