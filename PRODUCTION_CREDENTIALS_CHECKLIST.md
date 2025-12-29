# Production Credentials Checklist
**Date:** December 28, 2024  
**Status:** Complete list of all mock APIs, URLs, and keys that need real credentials for production deployment

---

## 🔴 Critical: Must Replace Before Production

### 1. Authentication & Security

#### JWT Secrets
- **`JWT_SECRET`** - Currently: `CHANGE_THIS_TO_A_SECURE_RANDOM_STRING`
  - **Action Required:** Generate secure random string (min 32 characters)
  - **Command:** `openssl rand -base64 32`
  - **Location:** `server/.env`

- **`JWT_REFRESH_SECRET`** - Currently: `CHANGE_THIS_TO_A_SECURE_RANDOM_STRING`
  - **Action Required:** Generate secure random string (min 32 characters)
  - **Command:** `openssl rand -base64 32`
  - **Location:** `server/.env`

- **`ENCRYPTION_KEY`** - Currently: `CHANGE_THIS_TO_A_64_CHARACTER_HEX_STRING`
  - **Action Required:** Generate 64-character hex string
  - **Command:** `openssl rand -hex 32`
  - **Location:** `server/.env`
  - **Used For:** Two-factor authentication encryption

---

### 2. Database

#### PostgreSQL Connection
- **`DATABASE_URL`** - Currently: `postgresql://user:password@localhost:5432/complyeasy?schema=public`
  - **Action Required:** Replace with production PostgreSQL connection string
  - **Format:** `postgresql://username:password@host:port/database?schema=public`
  - **Location:** `server/.env`
  - **Production Options:**
    - Supabase (PostgreSQL)
    - AWS RDS
    - Google Cloud SQL
    - Azure Database for PostgreSQL

---

### 3. AI Services

#### Google Gemini AI
- **`GEMINI_API_KEY`** - Currently: `YOUR_GEMINI_API_KEY_HERE`
  - **Action Required:** Get API key from Google AI Studio
  - **URL:** https://makersuite.google.com/app/apikey
  - **Location:** `server/.env`
  - **Used For:**
    - AI compliance reports
    - Risk prioritization
    - Policy generation
    - Contract analysis
    - NeuroSymbolic AI reasoning
    - Regulatory intelligence analysis

---

### 4. Email Service

#### SendGrid
- **`SENDGRID_API_KEY`** - Currently: `YOUR_SENDGRID_API_KEY_HERE`
  - **Action Required:** Get API key from SendGrid dashboard
  - **URL:** https://app.sendgrid.com/settings/api_keys
  - **Location:** `server/.env`
  - **Used For:** Magic link emails, notifications

- **`SENDGRID_FROM_EMAIL`** - Currently: `noreply@yourdomain.com`
  - **Action Required:** Replace with verified sender email
  - **Location:** `server/.env`

- **`SENDGRID_FROM_NAME`** - Currently: `ComplyEasy AI`
  - **Action Required:** Update if needed
  - **Location:** `server/.env`

---

### 5. Payment Processing

#### Stripe
- **`STRIPE_SECRET_KEY`** - Currently: `sk_test_YOUR_STRIPE_SECRET_KEY`
  - **Action Required:** Get live secret key from Stripe dashboard
  - **URL:** https://dashboard.stripe.com/apikeys
  - **Location:** `server/.env`
  - **Note:** Use `sk_live_...` for production (not `sk_test_...`)

- **`STRIPE_PUBLISHABLE_KEY`** - Currently: `pk_test_YOUR_STRIPE_PUBLISHABLE_KEY`
  - **Action Required:** Get live publishable key from Stripe dashboard
  - **URL:** https://dashboard.stripe.com/apikeys
  - **Location:** `server/.env`
  - **Note:** Use `pk_live_...` for production (not `pk_test_...`)

- **`STRIPE_WEBHOOK_SECRET`** - Currently: `whsec_YOUR_WEBHOOK_SECRET`
  - **Action Required:** Get webhook secret from Stripe webhook configuration
  - **URL:** https://dashboard.stripe.com/webhooks
  - **Location:** `server/.env`
  - **Note:** Create webhook endpoint in Stripe dashboard first

- **`STRIPE_BASIC_PRICE_ID`** - Currently: `price_YOUR_BASIC_PRICE_ID`
  - **Action Required:** Create price in Stripe and get price ID
  - **Location:** `server/.env`

- **`STRIPE_PRO_PRICE_ID`** - Currently: `price_YOUR_PRO_PRICE_ID`
  - **Action Required:** Create price in Stripe and get price ID
  - **Location:** `server/.env`

- **`STRIPE_ENTERPRISE_PRICE_ID`** - Currently: `price_YOUR_ENTERPRISE_PRICE_ID`
  - **Action Required:** Create price in Stripe and get price ID
  - **Location:** `server/.env`

---

### 6. Cloud Storage

#### AWS S3
- **`AWS_ACCESS_KEY_ID`** - Currently: `YOUR_AWS_ACCESS_KEY_ID`
  - **Action Required:** Create IAM user with S3 permissions and get access key
  - **URL:** https://console.aws.amazon.com/iam/
  - **Location:** `server/.env`
  - **Used For:** Evidence file storage, document uploads

- **`AWS_SECRET_ACCESS_KEY`** - Currently: `YOUR_AWS_SECRET_ACCESS_KEY`
  - **Action Required:** Get secret key when creating IAM user
  - **Location:** `server/.env`

- **`AWS_REGION`** - Currently: `us-east-1`
  - **Action Required:** Update to your preferred AWS region
  - **Location:** `server/.env`

- **`AWS_S3_BUCKET`** - Currently: `your-bucket-name`
  - **Action Required:** Create S3 bucket and use bucket name
  - **Location:** `server/.env`

---

### 7. OAuth Integrations

#### Google OAuth
- **`GOOGLE_CLIENT_ID`** - Currently: `YOUR_GOOGLE_CLIENT_ID`
  - **Action Required:** Create OAuth 2.0 credentials in Google Cloud Console
  - **URL:** https://console.cloud.google.com/apis/credentials
  - **Location:** `server/.env`
  - **Used For:** Google Workspace integration

- **`GOOGLE_CLIENT_SECRET`** - Currently: `YOUR_GOOGLE_CLIENT_SECRET`
  - **Action Required:** Get client secret from Google Cloud Console
  - **Location:** `server/.env`

- **`GOOGLE_CALLBACK_URL`** - Currently: `http://localhost:5000/api/integrations/google/callback`
  - **Action Required:** Update to production URL
  - **Format:** `https://yourdomain.com/api/integrations/google/callback`
  - **Location:** `server/.env`
  - **Note:** Must be added to authorized redirect URIs in Google Cloud Console

#### GitHub OAuth
- **`GITHUB_CLIENT_ID`** - Currently: `YOUR_GITHUB_CLIENT_ID`
  - **Action Required:** Create OAuth App in GitHub
  - **URL:** https://github.com/settings/developers
  - **Location:** `server/.env`
  - **Used For:** GitHub integration

- **`GITHUB_CLIENT_SECRET`** - Currently: `YOUR_GITHUB_CLIENT_SECRET`
  - **Action Required:** Get client secret from GitHub OAuth App
  - **Location:** `server/.env`

- **`GITHUB_CALLBACK_URL`** - Currently: `http://localhost:5000/api/integrations/github/callback`
  - **Action Required:** Update to production URL
  - **Format:** `https://yourdomain.com/api/integrations/github/callback`
  - **Location:** `server/.env`
  - **Note:** Must be added to callback URL in GitHub OAuth App

#### Slack OAuth
- **`SLACK_CLIENT_ID`** - Currently: `YOUR_SLACK_CLIENT_ID`
  - **Action Required:** Create Slack App and get client ID
  - **URL:** https://api.slack.com/apps
  - **Location:** `server/.env`
  - **Used For:** Slack integration

- **`SLACK_CLIENT_SECRET`** - Currently: `YOUR_SLACK_CLIENT_SECRET`
  - **Action Required:** Get client secret from Slack App
  - **Location:** `server/.env`

- **`SLACK_CALLBACK_URL`** - Currently: `http://localhost:5000/api/integrations/slack/callback`
  - **Action Required:** Update to production URL
  - **Format:** `https://yourdomain.com/api/integrations/slack/callback`
  - **Location:** `server/.env`
  - **Note:** Must be added to redirect URLs in Slack App

#### Jira OAuth
- **`JIRA_CLIENT_ID`** - Currently: `YOUR_JIRA_CLIENT_ID`
  - **Action Required:** Create OAuth app in Atlassian
  - **URL:** https://developer.atlassian.com/console/myapps/
  - **Location:** `server/.env`
  - **Used For:** Jira integration

- **`JIRA_CLIENT_SECRET`** - Currently: `YOUR_JIRA_CLIENT_SECRET`
  - **Action Required:** Get client secret from Atlassian OAuth app
  - **Location:** `server/.env`

- **`JIRA_CALLBACK_URL`** - Currently: `http://localhost:5000/api/integrations/jira/callback`
  - **Action Required:** Update to production URL
  - **Format:** `https://yourdomain.com/api/integrations/jira/callback`
  - **Location:** `server/.env`
  - **Note:** Must be added to callback URLs in Atlassian app

---

### 8. IoT/MQTT (Optional)

#### MQTT Broker
- **`MQTT_BROKER_URL`** - Currently: Not set (defaults to `mqtt://localhost:1883`)
  - **Action Required:** Set production MQTT broker URL if using IoT features
  - **Format:** `mqtt://broker.example.com:1883` or `mqtts://broker.example.com:8883`
  - **Location:** `server/.env`
  - **Used For:** IoT device communication
  - **Options:**
    - AWS IoT Core
    - Azure IoT Hub
    - Google Cloud IoT Core
    - Self-hosted MQTT broker (Mosquitto)

- **`MQTT_USERNAME`** - Currently: Not set
  - **Action Required:** Set if MQTT broker requires authentication
  - **Location:** `server/.env`

- **`MQTT_PASSWORD`** - Currently: Not set
  - **Action Required:** Set if MQTT broker requires authentication
  - **Location:** `server/.env`

- **`MQTT_CLIENT_ID`** - Currently: Not set
  - **Action Required:** Set unique client ID for MQTT connection
  - **Location:** `server/.env`

---

### 9. Application URLs

#### Frontend URL
- **`CLIENT_URL`** - Currently: `http://localhost:3000`
  - **Action Required:** Update to production frontend URL
  - **Format:** `https://app.yourdomain.com`
  - **Location:** `server/.env`
  - **Used For:** CORS configuration, email links

#### Backend API URL
- **`API_URL`** - Currently: `http://localhost:5000`
  - **Action Required:** Update to production backend URL
  - **Format:** `https://api.yourdomain.com`
  - **Location:** `server/.env`

- **`VITE_API_URL`** - Currently: `http://localhost:5000/api`
  - **Action Required:** Update to production API URL
  - **Format:** `https://api.yourdomain.com/api`
  - **Location:** `server/.env` (also used in frontend)

---

### 10. Server Configuration

#### Port
- **`PORT`** - Currently: `3001` (in server/.env.example) or `5000` (in root .env.example)
  - **Action Required:** Set production port (typically 80/443 or use reverse proxy)
  - **Location:** `server/.env`

#### Environment
- **`NODE_ENV`** - Currently: `development`
  - **Action Required:** Set to `production`
  - **Location:** `server/.env`

---

## 📋 Summary by Feature

### Features Requiring Real Credentials:

1. **Authentication System**
   - JWT secrets (3 keys)
   - Encryption key

2. **AI Features**
   - Gemini API key (used in 10+ features)

3. **Email System**
   - SendGrid API key and sender email

4. **Payment Processing**
   - Stripe keys (5 keys: secret, publishable, webhook, 3 price IDs)

5. **File Storage**
   - AWS S3 credentials (4 values: access key, secret, region, bucket)

6. **OAuth Integrations** (4 services × 3 keys each = 12 keys)
   - Google OAuth (client ID, secret, callback URL)
   - GitHub OAuth (client ID, secret, callback URL)
   - Slack OAuth (client ID, secret, callback URL)
   - Jira OAuth (client ID, secret, callback URL)

7. **IoT Features** (Optional)
   - MQTT broker URL, username, password, client ID

8. **Database**
   - PostgreSQL connection string

9. **Application URLs**
   - Frontend URL
   - Backend API URL

---

## 🔢 Total Count

- **Total Environment Variables to Replace:** 35+
- **Critical (Block Production):** 25
- **Optional (IoT features):** 4
- **Configuration (URLs, ports):** 6

---

## ✅ Pre-Production Checklist

- [ ] Generate and set all JWT/encryption secrets
- [ ] Configure production PostgreSQL database
- [ ] Get Gemini API key from Google AI Studio
- [ ] Set up SendGrid account and verify sender email
- [ ] Create Stripe account and get live keys
- [ ] Create Stripe products and get price IDs
- [ ] Set up AWS S3 bucket and IAM credentials
- [ ] Create OAuth apps for Google, GitHub, Slack, Jira
- [ ] Update all callback URLs to production URLs
- [ ] Configure MQTT broker (if using IoT features)
- [ ] Update all application URLs to production domains
- [ ] Set NODE_ENV to production
- [ ] Test all integrations with real credentials
- [ ] Verify email delivery works
- [ ] Test payment processing with Stripe test mode first
- [ ] Verify file uploads to S3 work
- [ ] Test OAuth flows end-to-end

---

## 🚨 Security Notes

1. **Never commit `.env` files to git** - Already in `.gitignore` ✅
2. **Use environment-specific secrets** - Different keys for dev/staging/prod
3. **Rotate secrets regularly** - Especially JWT secrets and API keys
4. **Use secret management services** in production:
   - AWS Secrets Manager
   - Azure Key Vault
   - Google Secret Manager
   - HashiCorp Vault
5. **Enable MFA** on all service accounts (Stripe, AWS, etc.)
6. **Use least privilege** for IAM roles and API keys
7. **Monitor API key usage** for anomalies

---

**Last Updated:** December 28, 2024

