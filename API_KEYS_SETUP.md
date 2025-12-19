# API Keys Setup Guide - ComplyEasy AI

This guide will help you configure all required API keys to get the application working at 100% level.

## 🔴 CRITICAL - Required for Core Functionality

### 1. Google Gemini API Key (REQUIRED)
**Purpose:** Powers all AI features (compliance reports, policy generation, risk analysis, etc.)

**Steps to Get:**
1. Go to https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key

**Where to Add:**
- **Frontend:** `.env.local` → `GEMINI_API_KEY=your-key-here`
- **Backend:** `server/.env` → `GEMINI_API_KEY=your-key-here`

**Test:** Try generating a compliance report or using any AI feature

---

### 2. SendGrid API Key (REQUIRED for Authentication)
**Purpose:** Sends magic link emails for passwordless login

**Steps to Get:**
1. Go to https://signup.sendgrid.com/ (free tier available)
2. Create an account and verify your email
3. Go to Settings → API Keys
4. Click "Create API Key"
5. Name it "ComplyEasy AI" and give it "Full Access" permissions
6. Copy the API key (you'll only see it once!)

**Verify Sender:**
1. Go to Settings → Sender Authentication
2. Verify a Single Sender (or use Domain Authentication for production)
3. Use the verified email as your `SENDGRID_FROM_EMAIL`

**Where to Add:**
- **Backend:** `server/.env`
  ```
  SENDGRID_API_KEY=SG.your-api-key-here
  SENDGRID_FROM_EMAIL=your-verified-email@example.com
  SENDGRID_FROM_NAME=ComplyEasy AI
  ```

**Test:** Request a magic link - you should receive an email

---

### 3. Database (Already Configured ✅)
**Status:** Supabase PostgreSQL is already set up
- **Location:** `server/.env` → `DATABASE_URL`

---

### 4. JWT Secrets (REQUIRED)
**Purpose:** Secure authentication tokens

**Generate Secure Secrets:**
```bash
# Generate JWT Secret (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate Refresh Secret (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate Encryption Key (32+ characters for 2FA)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Where to Add:**
- **Backend:** `server/.env`
  ```
  JWT_SECRET=your-generated-secret-here-min-32-chars
  JWT_REFRESH_SECRET=your-generated-refresh-secret-here-min-32-chars
  ENCRYPTION_KEY=your-generated-encryption-key-here-min-32-chars
  ```

---

## 🟡 OPTIONAL - For Full Feature Set

### 5. Stripe API Keys (Optional - for Payments)
**Purpose:** Subscription billing and payment processing

**Steps to Get:**
1. Go to https://dashboard.stripe.com/register
2. Create an account (use test mode for development)
3. Go to Developers → API Keys
4. Copy your **Secret Key** (starts with `sk_test_` for test mode)
5. Copy your **Publishable Key** (starts with `pk_test_`)

**Create Price IDs (for subscriptions):**
1. Go to Products → Add Product
2. Create three products: Basic, Pro, Enterprise
3. Copy the Price IDs (start with `price_`)

**Where to Add:**
- **Backend:** `server/.env`
  ```
  STRIPE_SECRET_KEY=sk_test_your-secret-key
  STRIPE_PUBLISHABLE_KEY=pk_test_your-publishable-key
  STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret (get from webhook settings)
  STRIPE_BASIC_PRICE_ID=price_xxx
  STRIPE_PRO_PRICE_ID=price_xxx
  STRIPE_ENTERPRISE_PRICE_ID=price_xxx
  ```

---

### 6. AWS S3 (Optional - for File Uploads)
**Purpose:** Secure file storage for compliance documents

**Steps to Get:**
1. Go to https://aws.amazon.com/s3/
2. Create an AWS account (free tier available)
3. Go to IAM → Users → Create User
4. Attach policy: `AmazonS3FullAccess` (or create custom policy)
5. Create Access Key → Copy Access Key ID and Secret Access Key
6. Create S3 Bucket:
   - Go to S3 → Create Bucket
   - Name: `complyeasy-uploads` (or your preferred name)
   - Region: `us-east-1` (or your preferred region)

**Where to Add:**
- **Backend:** `server/.env`
  ```
  AWS_ACCESS_KEY_ID=your-access-key-id
  AWS_SECRET_ACCESS_KEY=your-secret-access-key
  AWS_REGION=us-east-1
  AWS_S3_BUCKET=complyeasy-uploads
  ```

---

### 7. OAuth Keys (Optional - for Integrations)
**Purpose:** Connect Google Workspace, GitHub, Slack, Jira

**Google OAuth:**
1. Go to https://console.cloud.google.com/
2. Create project → APIs & Services → Credentials
3. Create OAuth 2.0 Client ID
4. Authorized redirect URI: `http://localhost:3001/api/integrations/google/callback`

**GitHub OAuth:**
1. Go to https://github.com/settings/developers
2. New OAuth App
3. Authorization callback URL: `http://localhost:3001/api/integrations/github/callback`

**Slack OAuth:**
1. Go to https://api.slack.com/apps
2. Create New App → OAuth & Permissions
3. Redirect URL: `http://localhost:3001/api/integrations/slack/callback`

**Jira OAuth:**
1. Go to https://developer.atlassian.com/console/myapps/
2. Create app → OAuth 2.0
3. Callback URL: `http://localhost:3001/api/integrations/jira/callback`

---

## 📋 Quick Setup Checklist

### Minimum Required (Core Functionality):
- [ ] GEMINI_API_KEY (frontend + backend)
- [ ] SENDGRID_API_KEY (backend)
- [ ] SENDGRID_FROM_EMAIL (backend - verified email)
- [ ] JWT_SECRET (backend - 32+ chars)
- [ ] JWT_REFRESH_SECRET (backend - 32+ chars)
- [ ] ENCRYPTION_KEY (backend - 32+ chars)
- [ ] DATABASE_URL (already configured ✅)

### Full Feature Set:
- [ ] All above +
- [ ] STRIPE_SECRET_KEY (for payments)
- [ ] AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY (for file uploads)
- [ ] OAuth keys (for integrations)

---

## 🧪 Testing Your Configuration

After adding all keys, restart both servers:

```bash
# Stop servers
lsof -ti:3000,3001 | xargs kill -9

# Start backend
cd server && npm run dev

# Start frontend (in new terminal)
cd .. && npm run dev
```

**Test Authentication:**
1. Go to http://localhost:3000
2. Click "Sign In / SSO"
3. Enter your email
4. Check your email for the magic link
5. Click the link to log in

**Test AI Features:**
1. Log in
2. Try generating a compliance report
3. Should work if GEMINI_API_KEY is configured

---

## 🔧 Development Token Helper

For testing without email, see `DEVELOPMENT_TOKEN_GUIDE.md` for getting real tokens from the database.

