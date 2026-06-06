# 🚀 VERCEL DEPLOYMENT GUIDE - ComplyEasyAI
Deploy to: https://complyeasyai.com

---

## ⚠️ PRE-DEPLOYMENT REQUIREMENTS

**CRITICAL: You MUST fix these issues before deploying:**

1. ❌ Install dependencies
2. ❌ Fix Prisma 7 schema
3. ❌ Verify build succeeds locally
4. ❌ Set up production database

---

## STEP 1: FIX BUILD ISSUES (LOCAL)

### 1.1 Install Dependencies
```bash
# Install root dependencies
cd /home/user/ComplyEasyAI
npm install

# Install server dependencies
cd server
npm install
npm install --save-dev @types/node @types/jest
```

### 1.2 Fix Prisma Schema for Prisma 7
**File: `server/prisma/schema.prisma`**

Replace the datasource block (lines 6-8):
```prisma
// OLD (Prisma 6):
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// NEW (Prisma 7):
datasource db {
  provider = "postgresql"
}
```

Then create `server/prisma/prisma.config.ts`:
```typescript
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});
```

### 1.3 Generate Prisma Client
```bash
cd server
npx prisma generate
```

### 1.4 Verify Build Succeeds
```bash
# Build server
cd server
npm run build  # Should complete with 0 errors

# Build frontend
cd ..
npm run build  # Should complete successfully
```

**If build fails, DO NOT proceed to deployment.**

---

## STEP 2: SET UP PRODUCTION DATABASE

### 2.1 Create PostgreSQL Database

**Option A: Vercel Postgres (Recommended)**
1. Go to https://vercel.com/dashboard
2. Click "Storage" → "Create Database"
3. Select "Postgres"
4. Choose region (same as your deployment)
5. Create database
6. Copy the `DATABASE_URL` connection string

**Option B: External Provider (Neon, Supabase, Railway, etc.)**
1. Sign up for a PostgreSQL provider
2. Create a new database
3. Copy the connection string (format: `postgresql://user:pass@host:port/dbname`)

### 2.2 Run Database Migrations
```bash
# Set your production database URL
export DATABASE_URL="postgresql://user:pass@host:port/dbname"

# Run migrations
cd server
npx prisma migrate deploy

# Seed initial data (if needed)
npx prisma db seed
```

---

## STEP 3: PREPARE ENVIRONMENT VARIABLES

### 3.1 Create Production Environment Variables List

You'll need these in Vercel. Collect them now:

**Required (Core Functionality):**
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:port/dbname

# JWT Authentication
JWT_SECRET=<generate with: openssl rand -base64 32>
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=<generate with: openssl rand -base64 32>
JWT_REFRESH_EXPIRES_IN=30d

# Two-Factor Authentication
ENCRYPTION_KEY=<generate with: openssl rand -hex 32>

# Google Gemini AI
GEMINI_API_KEY=<your-gemini-api-key>

# Server Configuration
NODE_ENV=production
PORT=5000
API_URL=https://api.complyeasyai.com
CLIENT_URL=https://complyeasyai.com
```

**Required (Payment & Email):**
```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# SendGrid Email
SENDGRID_API_KEY=<your-sendgrid-api-key>
SENDGRID_FROM_EMAIL=noreply@complyeasyai.com
SENDGRID_FROM_NAME=ComplyEasy AI
```

**Optional (Advanced Features):**
```bash
# OpenAI (for Whisper audio transcription)
OPENAI_API_KEY=<your-openai-api-key>

# AWS (for S3 storage, BYOK)
AWS_ACCESS_KEY_ID=<your-aws-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret>
AWS_REGION=us-east-1
AWS_S3_BUCKET=<your-bucket-name>

# Blockchain (if using immutable audit logs)
ETHEREUM_RPC_URL=<your-ethereum-rpc>
POLYGON_RPC_URL=<your-polygon-rpc>
BLOCKCHAIN_PRIVATE_KEY=<your-blockchain-private-key>
COMPLIANCE_CONTRACT_BYTECODE=<compiled-solidity-bytecode>

# Open Policy Agent (for Compliance as Code)
OPA_SERVER_URL=http://your-opa-server:8181

# MQTT (for Physical AI/IoT)
MQTT_BROKER_URL=mqtt://your-mqtt-broker:1883
MQTT_USERNAME=<mqtt-username>
MQTT_PASSWORD=<mqtt-password>

# Monitoring
ELASTICSEARCH_URL=<your-elasticsearch-url>
REDIS_URL=<your-redis-url>
```

---

## STEP 4: INSTALL VERCEL CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login
# Follow the authentication prompts
```

---

## STEP 5: CONFIGURE PROJECT FOR VERCEL

### 5.1 Create `vercel.json` in Root Directory

**File: `/home/user/ComplyEasyAI/vercel.json`**

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/dist/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "/dist/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "regions": ["iad1"]
}
```

### 5.2 Update `package.json` Build Scripts

**File: `/home/user/ComplyEasyAI/package.json`**

Add Vercel-specific build script:
```json
{
  "scripts": {
    "build": "npm run build:client && npm run build:server",
    "build:client": "vite build",
    "build:server": "cd server && npm install && npx prisma generate && npm run build",
    "vercel-build": "npm run build"
  }
}
```

---

## STEP 6: DEPLOY TO VERCEL

### 6.1 Initial Deployment

```bash
cd /home/user/ComplyEasyAI

# Deploy to Vercel (production)
vercel --prod

# You'll be prompted to:
# - Set up and deploy? [Y/n] → Y
# - Which scope? → Select your account/team
# - Link to existing project? → N (first time)
# - What's your project's name? → complyeasyai
# - In which directory is your code located? → ./
# - Want to override settings? → N
```

### 6.2 Set Environment Variables in Vercel

**Option A: Via Web Dashboard**
1. Go to https://vercel.com/dashboard
2. Select your project "complyeasyai"
3. Go to "Settings" → "Environment Variables"
4. Add ALL the environment variables from Step 3.1
5. Make sure to select "Production" for each variable
6. Click "Save"

**Option B: Via CLI**
```bash
# Set each environment variable
vercel env add DATABASE_URL production
# Paste value when prompted

vercel env add JWT_SECRET production
# Paste value when prompted

# Repeat for all variables...
```

### 6.3 Trigger Redeployment (with env vars)
```bash
vercel --prod
```

---

## STEP 7: CONFIGURE CUSTOM DOMAIN

### 7.1 Add Domain in Vercel

**Via Web Dashboard:**
1. Go to https://vercel.com/dashboard
2. Select your project "complyeasyai"
3. Go to "Settings" → "Domains"
4. Click "Add Domain"
5. Enter: `complyeasyai.com`
6. Click "Add"
7. Also add: `www.complyeasyai.com`

**Via CLI:**
```bash
vercel domains add complyeasyai.com --yes
vercel domains add www.complyeasyai.com --yes
```

### 7.2 Configure DNS Records

Go to your domain registrar (where you bought complyeasyai.com):

**For Apex Domain (complyeasyai.com):**
- Record Type: `A`
- Name: `@`
- Value: `76.76.21.21` (Vercel's IP)

**OR use CNAME (if supported):**
- Record Type: `CNAME`
- Name: `@`
- Value: `cname.vercel-dns.com`

**For WWW Subdomain:**
- Record Type: `CNAME`
- Name: `www`
- Value: `cname.vercel-dns.com`

**For API Subdomain (if using separate API domain):**
- Record Type: `CNAME`
- Name: `api`
- Value: `cname.vercel-dns.com`

### 7.3 Verify Domain

1. Wait for DNS propagation (5-60 minutes)
2. Check status: https://vercel.com/dashboard → Your Project → Domains
3. Verify SSL certificate is issued automatically

---

## STEP 8: CONFIGURE BACKEND API ROUTING

### 8.1 Update API URLs in Environment

Make sure these are set in Vercel:
```bash
API_URL=https://complyeasyai.com/api
CLIENT_URL=https://complyeasyai.com
```

### 8.2 Update CORS Settings

**File: `server/src/index.ts` or `server/src/app.ts`**

Ensure CORS allows your domain:
```typescript
app.use(cors({
  origin: [
    'https://complyeasyai.com',
    'https://www.complyeasyai.com',
    process.env.CLIENT_URL || 'http://localhost:3000'
  ],
  credentials: true
}));
```

Commit and redeploy:
```bash
git add .
git commit -m "feat: Update CORS for production domain"
git push origin claude/production-readiness-assessment-JavYY
vercel --prod
```

---

## STEP 9: POST-DEPLOYMENT VERIFICATION

### 9.1 Health Check

```bash
# Check frontend
curl https://complyeasyai.com

# Check API health
curl https://complyeasyai.com/api/health

# Check database connection
curl https://complyeasyai.com/api/health/db
```

### 9.2 Test Key Features

1. ✅ Open https://complyeasyai.com
2. ✅ Test user registration
3. ✅ Test login
4. ✅ Test 2FA setup
5. ✅ Test Stripe payment flow (use test mode first)
6. ✅ Test AI features (Gemini integration)
7. ✅ Test email notifications

### 9.3 Monitor Logs

```bash
# View deployment logs
vercel logs complyeasyai --prod

# Or via dashboard:
# https://vercel.com/dashboard → Your Project → Deployments → Latest → View Logs
```

---

## STEP 10: CONFIGURE WEBHOOKS (STRIPE)

### 10.1 Set Up Stripe Webhook Endpoint

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. URL: `https://complyeasyai.com/api/webhooks/stripe`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the webhook signing secret
6. Add to Vercel environment variables:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXX
   ```
7. Redeploy: `vercel --prod`

---

## STEP 11: SET UP MONITORING & ALERTS

### 11.1 Configure Vercel Monitoring

1. Go to https://vercel.com/dashboard → Your Project
2. Click "Analytics" → Enable
3. Click "Speed Insights" → Enable

### 11.2 Set Up Error Tracking (Optional)

Consider integrating:
- **Sentry**: For error tracking
- **LogRocket**: For session replay
- **Datadog**: For APM

### 11.3 Set Up Uptime Monitoring

Use services like:
- UptimeRobot (free)
- Pingdom
- StatusCake

Monitor these endpoints:
- `https://complyeasyai.com` (200 status)
- `https://complyeasyai.com/api/health` (200 status)

---

## TROUBLESHOOTING

### Issue: Build Fails

**Error: TypeScript compilation errors**
```bash
# Solution: Fix build locally first
cd server
npm run build  # Must succeed with 0 errors
```

**Error: Prisma schema validation fails**
```bash
# Solution: Update to Prisma 7 format (see Step 1.2)
```

### Issue: Database Connection Fails

**Error: Can't reach database server**
```bash
# Solution: Check DATABASE_URL is correct
# Ensure the database allows connections from Vercel egress IPs.
# Allowlist ONLY the documented Vercel egress IP ranges, or use a private
# connection (Vercel Postgres / a private network peering). Never open the
# database to 0.0.0.0/0 — that exposes it to the entire internet.
```

### Issue: Environment Variables Not Working

**Error: Missing required environment variable**
```bash
# Solution: Verify env vars are set for "Production" environment
vercel env ls
# Re-add missing variables
vercel env add VARIABLE_NAME production
# Redeploy
vercel --prod
```

### Issue: API Routes 404

**Error: /api/* routes not found**
```bash
# Solution: Ensure vercel.json routes are correct
# Check that server/dist/index.js exists after build
```

### Issue: CORS Errors

**Error: CORS policy blocking requests**
```bash
# Solution: Update CORS settings in server/src/index.ts
# Add your production domain to allowed origins
# Redeploy
```

---

## DEPLOYMENT CHECKLIST

- [ ] Dependencies installed locally
- [ ] Prisma schema migrated to v7
- [ ] Build succeeds locally (0 errors)
- [ ] Production database created
- [ ] Database migrations run
- [ ] All required env vars collected
- [ ] Vercel CLI installed and authenticated
- [ ] vercel.json created
- [ ] Initial deployment successful
- [ ] Environment variables set in Vercel
- [ ] Custom domain added
- [ ] DNS records configured
- [ ] Domain verified and SSL active
- [ ] CORS configured for production domain
- [ ] Health checks passing
- [ ] Stripe webhooks configured
- [ ] Monitoring enabled
- [ ] Error tracking configured (optional)
- [ ] Uptime monitoring configured

---

## NEXT STEPS AFTER DEPLOYMENT

1. **Security Hardening**:
   - Enable rate limiting
   - Set up WAF (Web Application Firewall)
   - Configure CSP headers
   - Enable security headers

2. **Performance Optimization**:
   - Set up CDN for static assets
   - Enable Vercel Edge Caching
   - Optimize images with Vercel Image Optimization
   - Enable compression

3. **Backup & Disaster Recovery**:
   - Set up automated database backups
   - Document recovery procedures
   - Test backup restoration

4. **Compliance**:
   - Add Cookie Consent banner
   - Update Privacy Policy with hosting details
   - Ensure GDPR compliance
   - Set up data retention policies

---

## ESTIMATED DEPLOYMENT TIME

- **Build fixes**: 1-2 hours
- **Database setup**: 30 minutes
- **Environment configuration**: 30 minutes
- **Vercel deployment**: 15 minutes
- **Domain configuration**: 30 minutes (+ DNS propagation)
- **Testing**: 1 hour
- **Total**: 4-5 hours

---

## SUPPORT RESOURCES

- Vercel Docs: https://vercel.com/docs
- Vercel Support: https://vercel.com/support
- Prisma v7 Migration Guide: https://www.prisma.io/docs/guides/upgrade-guides/upgrading-versions
- Stripe Webhooks: https://stripe.com/docs/webhooks

---

## ALTERNATIVE: DEPLOY VIA GITHUB INTEGRATION

If you prefer automatic deployments on git push:

1. **Connect GitHub to Vercel**:
   - Go to https://vercel.com/new
   - Click "Import Git Repository"
   - Connect your GitHub account
   - Select your repository
   - Configure as above

2. **Benefits**:
   - Auto-deploy on push to main branch
   - Preview deployments for PRs
   - Easy rollbacks

3. **Setup**:
   - Push your code to GitHub
   - Connect repo to Vercel
   - Set environment variables
   - Vercel will auto-deploy on every push

