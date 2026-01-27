# Environment Variables Documentation

This document provides a comprehensive guide to all environment variables used in ComplyEasy AI.

## Quick Start

1. Copy the example file: `cp server/.env.example server/.env`
2. Fill in the required variables (marked with ⚠️)
3. Run validation: `npm run validate:env` (in server directory)
4. Start the application: `npm run dev` (in server directory)

## Variable Categories

### 🔴 Required Variables (Application will not start without these)

#### Core Configuration
- **`DATABASE_URL`** ⚠️
  - **Description:** PostgreSQL database connection string
  - **Format:** `postgresql://user:password@host:port/database?sslmode=require`
  - **Example:** `postgresql://postgres:password@localhost:5432/complyeasy?sslmode=require`
  - **Where to get:** Your database provider (Supabase, AWS RDS, etc.)

- **`JWT_SECRET`** ⚠️
  - **Description:** Secret key for signing JWT access tokens
  - **Minimum Length:** 32 characters
  - **How to generate:** 
    ```bash
    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
    ```
  - **Security:** Must be kept secret, use strong random value

- **`JWT_REFRESH_SECRET`** ⚠️
  - **Description:** Secret key for signing JWT refresh tokens
  - **Minimum Length:** 32 characters
  - **How to generate:** Same as JWT_SECRET (use different value)
  - **Security:** Must be kept secret, use strong random value

- **`ENCRYPTION_KEY`** ⚠️
  - **Description:** Encryption key for 2FA secrets and sensitive data
  - **Minimum Length:** 16 characters (32+ recommended)
  - **How to generate:**
    ```bash
    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
    ```
  - **Security:** Must be kept secret, use strong random value

- **`GEMINI_API_KEY`** ⚠️
  - **Description:** Google Gemini AI API key for AI features
  - **Where to get:** [Google AI Studio](https://makersuite.google.com/app/apikey)
  - **Format:** Alphanumeric string

- **`SENDGRID_API_KEY`** ⚠️
  - **Description:** SendGrid API key for email delivery
  - **Where to get:** [SendGrid Dashboard](https://app.sendgrid.com/settings/api_keys)
  - **Format:** Starts with `SG.`

- **`SENDGRID_FROM_EMAIL`** ⚠️
  - **Description:** Email address to send emails from
  - **Format:** Valid email address
  - **Example:** `noreply@complyeasyai.com`
  - **Note:** Must be verified in SendGrid

- **`CORS_ORIGIN`** ⚠️
  - **Description:** Allowed origin for CORS requests
  - **Format:** URL
  - **Example:** `http://localhost:3000` (development) or `https://app.complyeasyai.com` (production)
  - **Security:** Restrict to your frontend domain in production

---

### 🟡 Optional but Recommended Variables

#### Core Configuration
- **`NODE_ENV`**
  - **Description:** Node.js environment
  - **Values:** `development`, `production`, `test`
  - **Default:** `development`
  - **Note:** Automatically set in most deployment platforms

- **`PORT`**
  - **Description:** Server port number
  - **Default:** `5000` (or `3001` if 5000 is in use)
  - **Example:** `3001`

- **`API_URL`**
  - **Description:** Base URL of the API
  - **Default:** `http://localhost:5000`
  - **Example:** `https://api.complyeasyai.com`

- **`CLIENT_URL`**
  - **Description:** Frontend application URL
  - **Default:** `http://localhost:3000`
  - **Example:** `https://app.complyeasyai.com`

#### JWT Configuration
- **`JWT_EXPIRES_IN`**
  - **Description:** Access token expiration time
  - **Default:** `7d`
  - **Format:** Time string (e.g., `1h`, `7d`, `30d`)

- **`JWT_REFRESH_EXPIRES_IN`**
  - **Description:** Refresh token expiration time
  - **Default:** `30d`
  - **Format:** Time string (e.g., `7d`, `30d`, `90d`)

#### Email Service
- **`SENDGRID_FROM_NAME`**
  - **Description:** Display name for sent emails
  - **Default:** `ComplyEasy AI`
  - **Example:** `ComplyEasy AI Team`

#### Payment Processing (Stripe)
- **`STRIPE_SECRET_KEY`** 🟡
  - **Description:** Stripe secret key for payment processing
  - **Format:** Starts with `sk_`
  - **Where to get:** [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
  - **Note:** Required for billing features

- **`STRIPE_PUBLISHABLE_KEY`**
  - **Description:** Stripe publishable key for frontend
  - **Format:** Starts with `pk_`
  - **Where to get:** [Stripe Dashboard](https://dashboard.stripe.com/apikeys)

- **`STRIPE_WEBHOOK_SECRET`** 🟡
  - **Description:** Stripe webhook signing secret
  - **Format:** Starts with `whsec_`
  - **Where to get:** [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
  - **Note:** Required for webhook verification

- **`STRIPE_BASIC_PRICE_ID`**
  - **Description:** Stripe price ID for Basic plan
  - **Format:** `price_xxxxx`
  - **Where to get:** [Stripe Products](https://dashboard.stripe.com/products)

- **`STRIPE_PRO_PRICE_ID`**
  - **Description:** Stripe price ID for Pro plan
  - **Format:** `price_xxxxx`

- **`STRIPE_ENTERPRISE_PRICE_ID`**
  - **Description:** Stripe price ID for Enterprise plan
  - **Format:** `price_xxxxx`

#### AWS Services
- **`AWS_ACCESS_KEY_ID`** 🟡
  - **Description:** AWS access key ID for S3 and KMS
  - **Where to get:** [AWS IAM Console](https://console.aws.amazon.com/iam/)
  - **Note:** Required for S3 file storage and BYOK features

- **`AWS_SECRET_ACCESS_KEY`** 🟡
  - **Description:** AWS secret access key
  - **Where to get:** [AWS IAM Console](https://console.aws.amazon.com/iam/)
  - **Security:** Must be kept secret

- **`AWS_REGION`**
  - **Description:** AWS region for services
  - **Default:** `us-east-1`
  - **Example:** `us-west-2`, `eu-west-1`

- **`AWS_S3_BUCKET`** 🟡
  - **Description:** S3 bucket name for file storage
  - **Example:** `complyeasy-uploads`
  - **Note:** Required for file upload features

#### OAuth Integrations (Optional)

##### Google OAuth
- **`GOOGLE_CLIENT_ID`**
  - **Description:** Google OAuth client ID
  - **Where to get:** [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

- **`GOOGLE_CLIENT_SECRET`**
  - **Description:** Google OAuth client secret
  - **Where to get:** [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

- **`GOOGLE_CALLBACK_URL`**
  - **Description:** OAuth callback URL
  - **Format:** `https://api.complyeasyai.com/api/auth/google/callback`

##### GitHub OAuth
- **`GITHUB_CLIENT_ID`**
  - **Description:** GitHub OAuth app client ID
  - **Where to get:** [GitHub Developer Settings](https://github.com/settings/developers)

- **`GITHUB_CLIENT_SECRET`**
  - **Description:** GitHub OAuth app client secret

- **`GITHUB_CALLBACK_URL`**
  - **Format:** `https://api.complyeasyai.com/api/auth/github/callback`

##### Slack OAuth
- **`SLACK_CLIENT_ID`**
  - **Description:** Slack app client ID
  - **Where to get:** [Slack API](https://api.slack.com/apps)

- **`SLACK_CLIENT_SECRET`**
  - **Description:** Slack app client secret

- **`SLACK_CALLBACK_URL`**
  - **Format:** `https://api.complyeasyai.com/api/auth/slack/callback`

##### Jira OAuth
- **`JIRA_CLIENT_ID`**
  - **Description:** Jira OAuth app client ID
  - **Where to get:** [Atlassian Developer](https://developer.atlassian.com/console/myapps/)

- **`JIRA_CLIENT_SECRET`**
  - **Description:** Jira OAuth app client secret

- **`JIRA_CALLBACK_URL`**
  - **Format:** `https://api.complyeasyai.com/api/auth/jira/callback`

#### Security Configuration
- **`RATE_LIMIT_WINDOW_MS`**
  - **Description:** Rate limiting window in milliseconds
  - **Default:** `900000` (15 minutes)

- **`RATE_LIMIT_MAX_REQUESTS`**
  - **Description:** Maximum requests per window
  - **Default:** `100`

#### Logging
- **`LOG_LEVEL`**
  - **Description:** Logging level
  - **Values:** `error`, `warn`, `info`, `debug`
  - **Default:** `info`
  - **Production Recommendation:** `warn` or `error`

---

## Frontend Environment Variables

Frontend variables are prefixed with `VITE_` and are located in `.env.local` (root directory).

### Required
- **`VITE_API_URL`** ⚠️
  - **Description:** Backend API URL
  - **Example:** `http://localhost:3001/api` (development) or `https://api.complyeasyai.com/api` (production)

### Optional
- **`GEMINI_API_KEY`**
  - **Description:** Google Gemini API key for frontend AI features
  - **Note:** Can be used directly in frontend if needed

---

## Environment-Specific Configuration

### Development
```bash
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=debug
```

### Production
```bash
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://app.complyeasyai.com
LOG_LEVEL=warn
```

### Testing
```bash
NODE_ENV=test
DATABASE_URL=postgresql://test:test@localhost:5432/test_db
JWT_SECRET=test-jwt-secret-key-for-testing-purposes-only-min-32-chars
JWT_REFRESH_SECRET=test-refresh-secret-key-for-testing-purposes-only-min-32-chars
ENCRYPTION_KEY=test-encryption-key-32-chars-minimum-length-required!!!
```

---

## Validation

### Automatic Validation
The application automatically validates environment variables on startup. If validation fails, the application will not start and will display detailed error messages.

### Manual Validation
Run the validation script to check your configuration:

```bash
cd server
npm run validate:env
```

This will:
- ✅ Check all required variables
- ✅ Validate variable formats
- ✅ Provide recommendations for missing variables
- ✅ Display a comprehensive report

---

## Security Best Practices

1. **Never commit `.env` files** - They are in `.gitignore`
2. **Use strong secrets** - Generate random values for JWT_SECRET, JWT_REFRESH_SECRET, ENCRYPTION_KEY
3. **Rotate secrets regularly** - Especially in production
4. **Use different values** - Don't reuse secrets across environments
5. **Restrict CORS_ORIGIN** - Only allow your frontend domain in production
6. **Use environment-specific values** - Different secrets for dev/staging/prod
7. **Store secrets securely** - Use secret management services (AWS Secrets Manager, Azure Key Vault, etc.)

---

## Troubleshooting

### "Missing required environment variables" Error
1. Check that your `.env` file exists in `server/` directory
2. Run `npm run validate:env` for detailed validation
3. Ensure all required variables (marked with ⚠️) are set

### "Invalid format" Errors
- Check variable formats match the requirements
- URLs must be valid URLs
- Email addresses must be valid emails
- Stripe keys must start with correct prefixes

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check database is accessible
- Ensure SSL mode is set if required: `?sslmode=require`

### Email Not Sending
- Verify `SENDGRID_API_KEY` is valid
- Check `SENDGRID_FROM_EMAIL` is verified in SendGrid
- Ensure SendGrid account is active

---

## Getting API Keys

### Google Gemini AI
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key to `GEMINI_API_KEY`

### SendGrid
1. Sign up at [SendGrid](https://sendgrid.com/)
2. Verify your account
3. Go to Settings > API Keys
4. Create a new API key with "Full Access"
5. Copy to `SENDGRID_API_KEY`
6. Verify sender email in Settings > Sender Authentication

### Stripe
1. Sign up at [Stripe](https://stripe.com/)
2. Go to Developers > API Keys
3. Copy "Secret key" to `STRIPE_SECRET_KEY`
4. Copy "Publishable key" to `STRIPE_PUBLISHABLE_KEY`
5. Set up webhooks and copy webhook secret to `STRIPE_WEBHOOK_SECRET`

### AWS
1. Sign in to [AWS Console](https://console.aws.amazon.com/)
2. Go to IAM > Users > Your User > Security Credentials
3. Create Access Key
4. Copy Access Key ID to `AWS_ACCESS_KEY_ID`
5. Copy Secret Access Key to `AWS_SECRET_ACCESS_KEY`
6. Create S3 bucket and set name to `AWS_S3_BUCKET`

---

## Support

For additional help:
- Check `API_KEYS_SETUP.md` for detailed API key setup
- Review `DEPLOYMENT.md` for deployment-specific configuration
- Run `npm run validate:env` for validation errors

---

**Last Updated:** December 18, 2024

