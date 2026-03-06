# API Keys Setup Guide - ComplyEasy AI

**Last updated:** March 5, 2026

This guide will help you configure all required API keys and services to get the application working at 100%. Variables are organized from most critical to optional. All backend variables go in `server/.env` (copy from `server/.env.example`).

---

## CRITICAL - Required for Core Functionality

### 1. Database (PostgreSQL / Supabase)
**Purpose:** Primary data store for all application data

**Steps to Get:**
1. Go to https://supabase.com/dashboard
2. Create a project (or use an existing one)
3. Go to Settings > Database > Connection string
4. Copy the connection string

**Where to Add:**
- **Backend:** `server/.env`
  ```
  DATABASE_URL="postgresql://user:password@host:5432/complyeasy?schema=public"
  ```

**Validation:** Must start with `postgresql://`. The server will refuse to start without it.

---

### 2. JWT Secrets & Encryption Key (REQUIRED)
**Purpose:** Secure authentication tokens and 2FA encryption

**Generate Secure Secrets:**
```bash
# Generate JWT Secret (must be 32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate Refresh Secret (must be 32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate Encryption Key (64-character hex string for AES-256)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Where to Add:**
- **Backend:** `server/.env`
  ```
  JWT_SECRET=your-generated-secret-here-min-32-chars
  JWT_REFRESH_SECRET=your-generated-refresh-secret-here-min-32-chars
  ENCRYPTION_KEY=your-generated-64-char-hex-string
  ```

**Validation:** Server validates that `JWT_SECRET` and `JWT_REFRESH_SECRET` are at least 32 characters, and `ENCRYPTION_KEY` is at least 16 characters.

---

### 3. Google Gemini API Key (REQUIRED)
**Purpose:** Powers all AI features (compliance reports, policy generation, risk analysis, gap analysis, etc.)

**Steps to Get:**
1. Go to https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key

**Where to Add:**
- **Backend:** `server/.env` > `GEMINI_API_KEY=your-key-here`

**Test:** Try generating a compliance report or using any AI feature.

---

### 4. SendGrid API Key (REQUIRED for Authentication)
**Purpose:** Sends magic link emails for passwordless login and notification emails

**Steps to Get:**
1. Go to https://signup.sendgrid.com/ (free tier available)
2. Create an account and verify your email
3. Go to Settings > API Keys
4. Click "Create API Key"
5. Name it "ComplyEasy AI" and give it "Full Access" permissions
6. Copy the API key (you will only see it once)

**Verify Sender:**
1. Go to Settings > Sender Authentication
2. Verify a Single Sender (or use Domain Authentication for production)
3. Use the verified email as your `SENDGRID_FROM_EMAIL`

**Where to Add:**
- **Backend:** `server/.env`
  ```
  SENDGRID_API_KEY=SG.your-api-key-here
  SENDGRID_FROM_EMAIL=your-verified-email@example.com
  SENDGRID_FROM_NAME=ComplyEasy AI
  ```

**Validation:** Key must start with `SG.` and `SENDGRID_FROM_EMAIL` must be a valid email address.

**Test:** Request a magic link -- you should receive an email.

---

### 5. CORS Origin (REQUIRED)
**Purpose:** Security -- controls which frontend origins can call the API

**Where to Add:**
- **Backend:** `server/.env`
  ```
  CORS_ORIGIN=http://localhost:3000
  ```
  For production, set this to your actual frontend domain. Multiple origins can be comma-separated.

---

### 6. Redis (REQUIRED for Production Multi-Instance)
**Purpose:** Used for caching (`redisCacheService`), job queues (BullMQ via `jobQueue`), CSRF token storage, and token blacklist storage. Without Redis, the app falls back to in-memory stores which work for development but are **not suitable for multi-instance production** deployments.

**Where to Add:**
- **Backend:** `server/.env`
  ```
  REDIS_URL=redis://localhost:6379
  ```
  Alternatively, you can set `REDIS_HOST` as a fallback if `REDIS_URL` is not provided.

**Options for Hosted Redis:**
- **Redis Cloud:** https://redis.com/try-free/ (free tier available)
- **AWS ElastiCache:** https://aws.amazon.com/elasticache/
- **Upstash:** https://upstash.com/ (serverless, free tier available)

**Default:** `redis://localhost:6379` (local Redis instance)

**Behavior Without Redis:** The app gracefully falls back to in-memory LRU cache and in-memory token stores. This is fine for local development and single-instance deployments but will cause issues with session consistency across multiple server instances.

---

## IMPORTANT - Required for Specific Features

### 7. OpenAI API Key (Required for Audio/Video Evidence Processing)
**Purpose:** Powers Whisper transcription for audio and video evidence files

**Steps to Get:**
1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key

**Where to Add:**
- **Backend:** `server/.env`
  ```
  OPENAI_API_KEY=sk-your-openai-api-key-here
  ```

**Test:** Upload an audio or video file as compliance evidence -- it should be automatically transcribed.

---

### 8. Stripe API Keys (Required for Billing/Payments)
**Purpose:** Subscription billing, payment processing, and add-on purchases

**Steps to Get:**
1. Go to https://dashboard.stripe.com/register
2. Create an account (use test mode for development)
3. Go to Developers > API Keys
4. Copy your **Secret Key** (starts with `sk_test_` for test mode)
5. Copy your **Publishable Key** (starts with `pk_test_`)

**Webhook Setup:**
1. Go to Developers > Webhooks
2. Add an endpoint: `{YOUR_API_URL}/api/billing/webhook` (e.g., `http://localhost:3001/api/billing/webhook` for dev)
3. Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`
4. Copy the Webhook Signing Secret (starts with `whsec_`)

**Create Price IDs (for subscriptions):**
Create products in the Stripe Dashboard (Products > Add Product) for each tier and billing cycle. You need **13 total price IDs**:

**8 Tier Prices (monthly + annual for each tier):**
| Variable | Description |
|---|---|
| `STRIPE_FOUNDATION_MONTHLY_PRICE_ID` | Foundation tier, monthly |
| `STRIPE_FOUNDATION_ANNUAL_PRICE_ID` | Foundation tier, annual |
| `STRIPE_ESSENTIALS_MONTHLY_PRICE_ID` | Essentials tier, monthly |
| `STRIPE_ESSENTIALS_ANNUAL_PRICE_ID` | Essentials tier, annual |
| `STRIPE_GROWTH_MONTHLY_PRICE_ID` | Growth tier, monthly |
| `STRIPE_GROWTH_ANNUAL_PRICE_ID` | Growth tier, annual |
| `STRIPE_VISIONARY_MONTHLY_PRICE_ID` | Visionary tier, monthly |
| `STRIPE_VISIONARY_ANNUAL_PRICE_ID` | Visionary tier, annual |

**5 Add-on Prices:**
| Variable | Description |
|---|---|
| `STRIPE_ADDON_VCISO_PRICE_ID` | Virtual CISO add-on |
| `STRIPE_ADDON_CUSTOM_FRAMEWORKS_PRICE_ID` | Custom Frameworks add-on |
| `STRIPE_ADDON_AUDIT_BUNDLING_PRICE_ID` | Audit Bundling add-on |
| `STRIPE_ADDON_CUSTOM_AI_PRICE_ID` | Custom AI add-on |
| `STRIPE_ADDON_ON_PREM_PRICE_ID` | On-Premises add-on |

**Where to Add:**
- **Backend:** `server/.env`
  ```
  STRIPE_SECRET_KEY=sk_test_your-secret-key
  STRIPE_PUBLISHABLE_KEY=pk_test_your-publishable-key
  STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

  # Tier prices (monthly + annual)
  STRIPE_FOUNDATION_MONTHLY_PRICE_ID=price_xxx
  STRIPE_FOUNDATION_ANNUAL_PRICE_ID=price_xxx
  STRIPE_ESSENTIALS_MONTHLY_PRICE_ID=price_xxx
  STRIPE_ESSENTIALS_ANNUAL_PRICE_ID=price_xxx
  STRIPE_GROWTH_MONTHLY_PRICE_ID=price_xxx
  STRIPE_GROWTH_ANNUAL_PRICE_ID=price_xxx
  STRIPE_VISIONARY_MONTHLY_PRICE_ID=price_xxx
  STRIPE_VISIONARY_ANNUAL_PRICE_ID=price_xxx

  # Add-on prices
  STRIPE_ADDON_VCISO_PRICE_ID=price_xxx
  STRIPE_ADDON_CUSTOM_FRAMEWORKS_PRICE_ID=price_xxx
  STRIPE_ADDON_AUDIT_BUNDLING_PRICE_ID=price_xxx
  STRIPE_ADDON_CUSTOM_AI_PRICE_ID=price_xxx
  STRIPE_ADDON_ON_PREM_PRICE_ID=price_xxx
  ```

**Auto-Provisioning Note:** If the tiered price ID env vars are left empty, `stripeService.ts` will auto-create products and prices in your Stripe account using canonical pricing. This is convenient for development but **manual setup is recommended for production** so you control your product catalog.

---

### 8b. API Rate Limits
**Purpose:** Prevent abuse; HTTP 429 = too many requests.

**Current defaults (optional overrides in `server/.env`):**
- **General API:** 100 requests per 15 minutes per IP (`RATE_LIMIT_WINDOW_MS=900000`, `RATE_LIMIT_MAX_REQUESTS=100`)
- **Auth (login):** 5 attempts per 15 min per IP
- **AI:** 10 requests per minute
- **Team invite:** In development, POST `/api/team/invite` is excluded from the general limit so testing does not hit 429.

If you see "Too many requests" (429), wait a few minutes or increase `RATE_LIMIT_MAX_REQUESTS`. A 429 with a message like "You have reached your Maximum Users limit" is a **tier limit**, not a rate limit -- upgrade in Settings > Billing.

---

## OPTIONAL - For Full Feature Set

### 9. AWS S3 (File Storage)
**Purpose:** Secure file storage for compliance documents and evidence uploads

**Steps to Get:**
1. Go to https://aws.amazon.com/s3/
2. Create an AWS account (free tier available)
3. Go to IAM > Users > Create User
4. Attach policy: `AmazonS3FullAccess` (or create a custom policy with least privilege)
5. Create Access Key > Copy Access Key ID and Secret Access Key
6. Create S3 Bucket:
   - Go to S3 > Create Bucket
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

### 10. OAuth Keys (Third-Party Integrations)
**Purpose:** Connect Google Workspace, GitHub, Slack, Jira

All OAuth callback URLs follow the format: `{API_URL}/api/integrations/{provider}/callback`

In development, the backend runs on port **3001**, so callbacks are `http://localhost:3001/api/integrations/{provider}/callback`.

**Note:** The `server/.env.example` file currently shows port 5000 in callback URLs. Override these in your `server/.env` with port 3001 for local development.

**Google OAuth:**
1. Go to https://console.cloud.google.com/
2. Create project > APIs & Services > Credentials
3. Create OAuth 2.0 Client ID
4. Authorized redirect URI: `http://localhost:3001/api/integrations/google/callback`

**GitHub OAuth:**
1. Go to https://github.com/settings/developers
2. New OAuth App
3. Authorization callback URL: `http://localhost:3001/api/integrations/github/callback`

**Slack OAuth:**
1. Go to https://api.slack.com/apps
2. Create New App > OAuth & Permissions
3. Redirect URL: `http://localhost:3001/api/integrations/slack/callback`

**Jira OAuth:**
1. Go to https://developer.atlassian.com/console/myapps/
2. Create app > OAuth 2.0
3. Callback URL: `http://localhost:3001/api/integrations/jira/callback`

**Where to Add:**
- **Backend:** `server/.env`
  ```
  GOOGLE_CLIENT_ID=your-google-client-id
  GOOGLE_CLIENT_SECRET=your-google-client-secret
  GOOGLE_CALLBACK_URL=http://localhost:3001/api/integrations/google/callback

  GITHUB_CLIENT_ID=your-github-client-id
  GITHUB_CLIENT_SECRET=your-github-client-secret
  GITHUB_CALLBACK_URL=http://localhost:3001/api/integrations/github/callback

  SLACK_CLIENT_ID=your-slack-client-id
  SLACK_CLIENT_SECRET=your-slack-client-secret
  SLACK_CALLBACK_URL=http://localhost:3001/api/integrations/slack/callback

  JIRA_CLIENT_ID=your-jira-client-id
  JIRA_CLIENT_SECRET=your-jira-client-secret
  JIRA_CALLBACK_URL=http://localhost:3001/api/integrations/jira/callback
  ```

---

### 11. Twilio SMS Notifications
**Purpose:** Send SMS alerts and compliance notifications to users

**Steps to Get:**
1. Go to https://console.twilio.com/
2. Create an account (free trial available)
3. Get your Account SID and Auth Token from the dashboard
4. Get or purchase a phone number

**Where to Add:**
- **Backend:** `server/.env`
  ```
  TWILIO_ACCOUNT_SID=your-twilio-account-sid
  TWILIO_AUTH_TOKEN=your-twilio-auth-token
  TWILIO_PHONE_NUMBER=+15551234567
  ```

**Behavior Without Twilio:** SMS notifications will throw an error ("Twilio credentials not configured"). Other notification channels (email, in-app) continue to work.

---

### 12. Blockchain / Evidence Truth Layer
**Purpose:** Immutable on-chain attestation of compliance evidence using Ethereum/Polygon smart contracts

**Steps to Get:**
1. Get an Ethereum RPC URL from https://infura.io or https://alchemy.com
2. Create a wallet (deployer account) and export its private key

**Where to Add:**
- **Backend:** `server/.env`
  ```
  ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
  BLOCKCHAIN_PRIVATE_KEY=0xYOUR_PRIVATE_KEY
  ```

**Additional optional blockchain variables** (see `server/.env.example` for full list):
  ```
  COMPLIANCE_CONTRACT_ADDRESS=0x...
  COMPLIANCE_REGISTRY_ADDRESS=0x...
  DEPLOY_NETWORK=localhost
  POLYGON_RPC_URL=https://polygon-rpc.com
  ETHERSCAN_API_KEY=your-etherscan-key
  ```

---

### 13. Sentry Error Tracking (Monitoring)
**Purpose:** Production error tracking, performance monitoring, and profiling

**Steps to Get:**
1. Go to https://sentry.io and create a project (Node.js)
2. Copy the DSN from Settings > Projects > your project > Client Keys

**Where to Add:**
- **Backend:** `server/.env`
  ```
  SENTRY_DSN=https://your-dsn@sentry.io/123
  SENTRY_ENABLED=true
  SENTRY_TRACES_SAMPLE_RATE=0.1
  SENTRY_PROFILES_SAMPLE_RATE=0.1
  ```

**Note:** Requires `@sentry/node` and `@sentry/profiling-node` packages. When `SENTRY_ENABLED` is `false` (default), Sentry is not loaded at all.

---

### 14. Frontend Environment Variables
**Purpose:** Configure the Vite frontend to connect to the correct backend and Supabase

**Where to Add:**
- **Frontend root:** `.env.local` (or `.env`)
  ```
  VITE_API_URL=http://localhost:3001/api
  VITE_SUPABASE_URL=https://your-project.supabase.co
  VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
  ```

**Notes:**
- `VITE_API_URL` defaults to `http://localhost:3001/api` in the codebase. The code automatically appends `/api` if not present.
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are used for direct Supabase integration from the frontend (e.g., real-time subscriptions). Get these from your Supabase dashboard > Settings > API.

---

## Docker Secrets Support

For production Docker deployments, the app supports the Docker secrets pattern where a `FOO_FILE` environment variable points to a file containing the secret value. This avoids exposing secrets via `docker inspect`.

**Supported secret variables:**
| Env Var | File Var |
|---|---|
| `DATABASE_URL` | `DATABASE_URL_FILE` |
| `REDIS_URL` | `REDIS_URL_FILE` |
| `JWT_SECRET` | `JWT_SECRET_FILE` |
| `JWT_REFRESH_SECRET` | `JWT_REFRESH_SECRET_FILE` |
| `ENCRYPTION_KEY` | `ENCRYPTION_KEY_FILE` |
| `GEMINI_API_KEY` | `GEMINI_API_KEY_FILE` |
| `STRIPE_SECRET_KEY` | `STRIPE_SECRET_KEY_FILE` |
| `STRIPE_WEBHOOK_SECRET` | `STRIPE_WEBHOOK_SECRET_FILE` |
| `SENDGRID_API_KEY` | `SENDGRID_API_KEY_FILE` |
| `AWS_ACCESS_KEY_ID` | `AWS_ACCESS_KEY_ID_FILE` |
| `AWS_SECRET_ACCESS_KEY` | `AWS_SECRET_ACCESS_KEY_FILE` |

**Example `docker-compose.yml` usage:**
```yaml
services:
  api:
    environment:
      - DATABASE_URL_FILE=/run/secrets/database_url
    secrets:
      - database_url
secrets:
  database_url:
    file: ./secrets/database_url.txt
```

The `_FILE` variable is only used if the corresponding env var is not already set directly.

---

## Quick Setup Checklist

### Minimum Required (App Will Start):
- [ ] `DATABASE_URL` -- PostgreSQL connection string
- [ ] `JWT_SECRET` -- 32+ character random string
- [ ] `JWT_REFRESH_SECRET` -- 32+ character random string
- [ ] `ENCRYPTION_KEY` -- 64-character hex string
- [ ] `GEMINI_API_KEY` -- for all AI features
- [ ] `SENDGRID_API_KEY` -- for magic link auth emails
- [ ] `SENDGRID_FROM_EMAIL` -- verified sender email
- [ ] `CORS_ORIGIN` -- frontend URL (e.g., `http://localhost:3000`)

### Production Essentials (Add These for Deployment):
- [ ] All above, plus:
- [ ] `REDIS_URL` -- for multi-instance cache, job queues, CSRF, token blacklist
- [ ] `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` -- for billing
- [ ] `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` + `AWS_S3_BUCKET` -- for file uploads
- [ ] `SENTRY_DSN` + `SENTRY_ENABLED=true` -- for error tracking

### Feature-Specific:
- [ ] `OPENAI_API_KEY` -- for audio/video evidence transcription (Whisper)
- [ ] `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` + `TWILIO_PHONE_NUMBER` -- for SMS notifications
- [ ] `ETHEREUM_RPC_URL` + `BLOCKCHAIN_PRIVATE_KEY` -- for blockchain evidence attestation
- [ ] OAuth keys (Google, GitHub, Slack, Jira) -- for third-party integrations
- [ ] `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` -- for frontend Supabase features

---

## Testing Your Configuration

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
3. Should work if `GEMINI_API_KEY` is configured

**Validate Environment:**
```bash
cd server && npm run validate:env
```

---

## Development Token Helper

For testing without email, see `DEVELOPMENT_TOKEN_GUIDE.md` for getting real tokens from the database.
