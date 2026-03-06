# Production Credentials Checklist
**Date:** March 5, 2026
**Status:** Complete list of all environment variables that need real credentials for production deployment

> **Docker Secrets Support:** For any sensitive variable `FOO`, you can set `FOO_FILE=/run/secrets/foo` and the server will read the secret from that file path at startup. Supported keys: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ENCRYPTION_KEY`, `GEMINI_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SENDGRID_API_KEY`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`.

---

## CRITICAL: Must Replace Before Production

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

- **`JWT_EXPIRES_IN`** - Currently: `7d`
  - **Action Required:** Review and set appropriate TTL (default `15m` in config fallback)
  - **Location:** `server/.env`

- **`JWT_REFRESH_EXPIRES_IN`** - Currently: `30d`
  - **Action Required:** Review and confirm (default `30d`)
  - **Location:** `server/.env`

#### Encryption Key
- **`ENCRYPTION_KEY`** - Currently: `CHANGE_THIS_TO_A_64_CHARACTER_HEX_STRING`
  - **Action Required:** Generate 64-character hex string
  - **Command:** `openssl rand -hex 32`
  - **Location:** `server/.env`
  - **Used For:** Two-factor authentication encryption, BYOK

---

### 2. Database

#### PostgreSQL Connection
- **`DATABASE_URL`** - Currently: `postgresql://user:password@localhost:5432/complyeasy?schema=public`
  - **Action Required:** Replace with production PostgreSQL connection string
  - **Format:** `postgresql://username:password@host:port/database?schema=public`
  - **Location:** `server/.env`
  - **Production Options:**
    - Supabase (PostgreSQL) -- recommended
    - AWS RDS
    - Google Cloud SQL
    - Azure Database for PostgreSQL

---

### 3. Redis (Cache, Job Queue, CSRF, Token Blacklist)

- **`REDIS_URL`** - Currently: `redis://localhost:6379`
  - **Action Required:** Set production Redis connection string
  - **Format:** `redis://username:password@host:port` or `rediss://...` for TLS
  - **Location:** `server/.env`
  - **Used For:** Cache layer (redisCacheService), BullMQ job queue, CSRF token storage, token blacklist
  - **Production Options:**
    - Redis Cloud (redis.com)
    - AWS ElastiCache for Redis
    - Upstash (serverless Redis)
    - Azure Cache for Redis

- **`REDIS_HOST`** - Currently: `localhost`
  - **Action Required:** Fallback if `REDIS_URL` is not set (REDIS_URL takes precedence)
  - **Location:** `server/.env`

> **Note:** If neither `REDIS_URL` nor `REDIS_HOST` is configured, the server falls back to an in-memory LRU cache (not recommended for production).

---

### 4. AI Services

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

#### OpenAI (Whisper Transcription)
- **`OPENAI_API_KEY`** - Currently: `YOUR_OPENAI_API_KEY_HERE`
  - **Action Required:** Get API key from OpenAI platform
  - **URL:** https://platform.openai.com/api-keys
  - **Location:** `server/.env`
  - **Used For:** Whisper audio/video transcription

---

### 5. Email Service

#### SendGrid
- **`SENDGRID_API_KEY`** - Currently: `YOUR_SENDGRID_API_KEY_HERE`
  - **Action Required:** Get API key from SendGrid dashboard (must start with `SG.`)
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

### 6. SMS Notifications

#### Twilio
- **`TWILIO_ACCOUNT_SID`** - Currently: `YOUR_TWILIO_ACCOUNT_SID`
  - **Action Required:** Get Account SID from Twilio Console
  - **URL:** https://console.twilio.com/
  - **Location:** `server/.env`
  - **Used For:** SMS compliance alerts and notifications

- **`TWILIO_AUTH_TOKEN`** - Currently: `YOUR_TWILIO_AUTH_TOKEN`
  - **Action Required:** Get Auth Token from Twilio Console
  - **Location:** `server/.env`

- **`TWILIO_PHONE_NUMBER`** - Currently: `+15551234567`
  - **Action Required:** Purchase and configure a Twilio phone number
  - **Location:** `server/.env`

---

### 7. Payment Processing

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
  - **Action Required:** Create webhook endpoint in Stripe dashboard pointing to `POST {API_URL}/api/billing/webhook`
  - **URL:** https://dashboard.stripe.com/webhooks
  - **Location:** `server/.env`
  - **Note:** Must start with `whsec_`

#### Stripe 4-Tier Price IDs (Monthly + Annual)

> Create products and prices in Stripe Dashboard -> Products. The system uses a 4-tier model with monthly and annual billing cycles per tier.

- **`STRIPE_FOUNDATION_MONTHLY_PRICE_ID`** - Currently: `price_foundation_monthly`
  - **Action Required:** Create Foundation monthly price in Stripe and get price ID
  - **Location:** `server/.env`

- **`STRIPE_FOUNDATION_ANNUAL_PRICE_ID`** - Currently: `price_foundation_annual`
  - **Action Required:** Create Foundation annual price in Stripe and get price ID
  - **Location:** `server/.env`

- **`STRIPE_ESSENTIALS_MONTHLY_PRICE_ID`** - Currently: `price_essentials_monthly`
  - **Action Required:** Create Essentials monthly price in Stripe and get price ID
  - **Location:** `server/.env`

- **`STRIPE_ESSENTIALS_ANNUAL_PRICE_ID`** - Currently: `price_essentials_annual`
  - **Action Required:** Create Essentials annual price in Stripe and get price ID
  - **Location:** `server/.env`

- **`STRIPE_GROWTH_MONTHLY_PRICE_ID`** - Currently: `price_growth_monthly`
  - **Action Required:** Create Growth monthly price in Stripe and get price ID
  - **Location:** `server/.env`

- **`STRIPE_GROWTH_ANNUAL_PRICE_ID`** - Currently: `price_growth_annual`
  - **Action Required:** Create Growth annual price in Stripe and get price ID
  - **Location:** `server/.env`

- **`STRIPE_VISIONARY_MONTHLY_PRICE_ID`** - Currently: `price_visionary_monthly`
  - **Action Required:** Create Visionary monthly price in Stripe and get price ID
  - **Location:** `server/.env`

- **`STRIPE_VISIONARY_ANNUAL_PRICE_ID`** - Currently: `price_visionary_annual`
  - **Action Required:** Create Visionary annual price in Stripe and get price ID
  - **Location:** `server/.env`

#### Stripe Add-on Price IDs

- **`STRIPE_ADDON_VCISO_PRICE_ID`** - Currently: `price_addon_vciso`
  - **Action Required:** Create vCISO add-on price in Stripe
  - **Location:** `server/.env`

- **`STRIPE_ADDON_CUSTOM_FRAMEWORKS_PRICE_ID`** - Currently: `price_addon_frameworks`
  - **Action Required:** Create Custom Frameworks add-on price in Stripe
  - **Location:** `server/.env`

- **`STRIPE_ADDON_AUDIT_BUNDLING_PRICE_ID`** - Currently: `price_addon_audit`
  - **Action Required:** Create Audit Bundling add-on price in Stripe
  - **Location:** `server/.env`

- **`STRIPE_ADDON_CUSTOM_AI_PRICE_ID`** - Currently: `price_addon_ai`
  - **Action Required:** Create Custom AI Models add-on price in Stripe
  - **Location:** `server/.env`

- **`STRIPE_ADDON_ON_PREM_PRICE_ID`** - Currently: `price_addon_onprem`
  - **Action Required:** Create On-Prem Deployment add-on price in Stripe
  - **Location:** `server/.env`

---

### 8. Cloud Storage

#### AWS S3
- **`AWS_ACCESS_KEY_ID`** - Currently: `YOUR_AWS_ACCESS_KEY_ID`
  - **Action Required:** Create IAM user with S3 permissions and get access key
  - **URL:** https://console.aws.amazon.com/iam/
  - **Location:** `server/.env`
  - **Used For:** Evidence file storage, document uploads, BYOK

- **`AWS_SECRET_ACCESS_KEY`** - Currently: `YOUR_AWS_SECRET_ACCESS_KEY`
  - **Action Required:** Get secret key when creating IAM user
  - **Location:** `server/.env`

- **`AWS_REGION`** - Currently: `us-east-1`
  - **Action Required:** Update to your preferred AWS region
  - **Location:** `server/.env`

- **`AWS_S3_BUCKET`** - Currently: `your-complyeasy-bucket`
  - **Action Required:** Create S3 bucket and use bucket name
  - **Location:** `server/.env`

- **`AWS_ACCOUNT_ID`** - Currently: `123456789012`
  - **Action Required:** Set your AWS account ID (required for CDK deployments)
  - **Location:** `server/.env`

- **`SCAN_TEMP_BUCKET`** - Currently: `your-scan-temp-bucket`
  - **Action Required:** Create S3 bucket for malware scan staging (optional)
  - **Location:** `server/.env`

---

### 9. Frontend Configuration

- **`VITE_API_URL`** - Currently: `http://localhost:3001/api`
  - **Action Required:** Update to production API URL
  - **Format:** `https://api.yourdomain.com/api`
  - **Location:** `server/.env` (also used in frontend)

- **`VITE_SUPABASE_URL`** - Currently: `https://your-project.supabase.co`
  - **Action Required:** Set your Supabase project URL
  - **URL:** https://supabase.com/dashboard -> Settings -> API
  - **Location:** `server/.env`

- **`VITE_SUPABASE_ANON_KEY`** - Currently: `your-supabase-anon-key`
  - **Action Required:** Set your Supabase anonymous/public key
  - **URL:** https://supabase.com/dashboard -> Settings -> API
  - **Location:** `server/.env`

---

### 10. OAuth Integrations

> **Important:** All callback URLs default to `http://localhost:3001`. For production, replace with `https://yourdomain.com`. Format: `{API_URL}/api/integrations/{provider}/callback`

#### Google OAuth
- **`GOOGLE_CLIENT_ID`** - Currently: `YOUR_GOOGLE_CLIENT_ID`
  - **Action Required:** Create OAuth 2.0 credentials in Google Cloud Console
  - **URL:** https://console.cloud.google.com/apis/credentials
  - **Location:** `server/.env`
  - **Used For:** Google Workspace integration

- **`GOOGLE_CLIENT_SECRET`** - Currently: `YOUR_GOOGLE_CLIENT_SECRET`
  - **Action Required:** Get client secret from Google Cloud Console
  - **Location:** `server/.env`

- **`GOOGLE_CALLBACK_URL`** - Currently: `http://localhost:3001/api/integrations/google/callback`
  - **Action Required:** Update to production URL
  - **Format:** `https://api.yourdomain.com/api/integrations/google/callback`
  - **Location:** `server/.env`
  - **Note:** Must be added to authorized redirect URIs in Google Cloud Console

- **`GOOGLE_APPLICATION_CREDENTIALS`** - Currently: `/path/to/service-account.json`
  - **Action Required:** Set path to GCP service account JSON (for GCP services)
  - **Location:** `server/.env`

- **`GOOGLE_VISION_API_KEY`** - Currently: `YOUR_GOOGLE_VISION_KEY`
  - **Action Required:** Get from Google Cloud Console (for evidence image analysis)
  - **Location:** `server/.env`

#### GitHub OAuth
- **`GITHUB_CLIENT_ID`** - Currently: `YOUR_GITHUB_CLIENT_ID`
  - **Action Required:** Create OAuth App in GitHub
  - **URL:** https://github.com/settings/developers
  - **Location:** `server/.env`
  - **Used For:** GitHub integration

- **`GITHUB_CLIENT_SECRET`** - Currently: `YOUR_GITHUB_CLIENT_SECRET`
  - **Action Required:** Get client secret from GitHub OAuth App
  - **Location:** `server/.env`

- **`GITHUB_CALLBACK_URL`** - Currently: `http://localhost:3001/api/integrations/github/callback`
  - **Action Required:** Update to production URL
  - **Format:** `https://api.yourdomain.com/api/integrations/github/callback`
  - **Location:** `server/.env`
  - **Note:** Must be added to callback URL in GitHub OAuth App

- **`GITHUB_TOKEN`** - Currently: `YOUR_GITHUB_PAT`
  - **Action Required:** Create a GitHub Personal Access Token (for Compliance-as-Code repo access)
  - **Location:** `server/.env`

- **`GITHUB_WEBHOOK_SECRET`** - Currently: `YOUR_GITHUB_WEBHOOK_SECRET`
  - **Action Required:** Set a webhook secret for verifying GitHub webhook payloads
  - **Location:** `server/.env`

#### GitLab
- **`GITLAB_TOKEN`** - Currently: `YOUR_GITLAB_PAT`
  - **Action Required:** Create a GitLab Personal Access Token (for Compliance-as-Code GitLab integration)
  - **Location:** `server/.env`

#### Slack OAuth
- **`SLACK_CLIENT_ID`** - Currently: `YOUR_SLACK_CLIENT_ID`
  - **Action Required:** Create Slack App and get client ID
  - **URL:** https://api.slack.com/apps
  - **Location:** `server/.env`
  - **Used For:** Slack integration

- **`SLACK_CLIENT_SECRET`** - Currently: `YOUR_SLACK_CLIENT_SECRET`
  - **Action Required:** Get client secret from Slack App
  - **Location:** `server/.env`

- **`SLACK_CALLBACK_URL`** - Currently: `http://localhost:3001/api/integrations/slack/callback`
  - **Action Required:** Update to production URL
  - **Format:** `https://api.yourdomain.com/api/integrations/slack/callback`
  - **Location:** `server/.env`
  - **Note:** Must be added to redirect URLs in Slack App

- **`SLACK_DEFAULT_CHANNEL`** - Currently: `compliance-alerts`
  - **Action Required:** Set your default Slack channel for compliance notifications
  - **Location:** `server/.env`

#### Jira OAuth
- **`JIRA_CLIENT_ID`** - Currently: `YOUR_JIRA_CLIENT_ID`
  - **Action Required:** Create OAuth app in Atlassian
  - **URL:** https://developer.atlassian.com/console/myapps/
  - **Location:** `server/.env`
  - **Used For:** Jira integration

- **`JIRA_CLIENT_SECRET`** - Currently: `YOUR_JIRA_CLIENT_SECRET`
  - **Action Required:** Get client secret from Atlassian OAuth app
  - **Location:** `server/.env`

- **`JIRA_CALLBACK_URL`** - Currently: `http://localhost:3001/api/integrations/jira/callback`
  - **Action Required:** Update to production URL
  - **Format:** `https://api.yourdomain.com/api/integrations/jira/callback`
  - **Location:** `server/.env`
  - **Note:** Must be added to callback URLs in Atlassian app

---

### 11. Monitoring & Error Tracking

#### Sentry
- **`SENTRY_DSN`** - Currently: `https://your-sentry-dsn@sentry.io/123`
  - **Action Required:** Get DSN from Sentry project settings
  - **URL:** https://sentry.io/settings/projects/
  - **Location:** `server/.env`
  - **Used For:** Production error tracking, performance monitoring

- **`SENTRY_ENABLED`** - Currently: `false`
  - **Action Required:** Set to `true` for production
  - **Location:** `server/.env`

- **`SENTRY_TRACES_SAMPLE_RATE`** - Currently: `0.1`
  - **Action Required:** Adjust trace sampling rate (0.0 to 1.0)
  - **Location:** `server/.env`

- **`SENTRY_PROFILES_SAMPLE_RATE`** - Currently: `0.1`
  - **Action Required:** Adjust profile sampling rate (0.0 to 1.0)
  - **Location:** `server/.env`

#### Elastic APM (Optional)
- **`ELASTIC_APM_SERVER_URL`** - Currently: `http://localhost:8200`
- **`ELASTIC_APM_SECRET_TOKEN`** - Currently: `YOUR_APM_SECRET`
- **`ELASTIC_APM_API_KEY`** - Currently: `YOUR_APM_API_KEY`
- **`ELASTIC_APM_SAMPLE_RATE`** - Currently: `0.1`
- **`APM_ENABLED`** - Currently: `false`
- **`APM_SERVICE_NAME`** - Currently: `complyeasy-api`
- **`ENABLE_REAL_MONITORING`** - Currently: `false`

#### New Relic (Optional)
- **`NEW_RELIC_LICENSE_KEY`** - Currently: `YOUR_NEW_RELIC_KEY`

---

### 12. Elasticsearch (Log Aggregation)

- **`ELASTICSEARCH_URL`** - Currently: `http://localhost:9200`
  - **Action Required:** Set production Elasticsearch endpoint
  - **Location:** `server/.env`
  - **Used For:** Centralized log aggregation, audit trail search
  - **Production Options:**
    - Elastic Cloud
    - AWS OpenSearch Service
    - Self-hosted Elasticsearch

- **`ELASTICSEARCH_USERNAME`** - Currently: `elastic`
  - **Action Required:** Set Elasticsearch username
  - **Location:** `server/.env`

- **`ELASTICSEARCH_PASSWORD`** - Currently: `YOUR_ES_PASSWORD`
  - **Action Required:** Set Elasticsearch password
  - **Location:** `server/.env`

- **`ELASTICSEARCH_ENABLED`** - Currently: `false`
  - **Action Required:** Set to `true` to enable log shipping
  - **Location:** `server/.env`

- **`ELASTICSEARCH_INDEX_PREFIX`** - Currently: `complyeasy`
  - **Action Required:** Adjust index prefix if needed
  - **Location:** `server/.env`

- **`ELASTICSEARCH_LOG_LEVEL`** - Currently: `info`
  - **Action Required:** Set log level for ES transport
  - **Location:** `server/.env`

- **`ELASTICSEARCH_SSL_REJECT_UNAUTHORIZED`** - Currently: `true`
  - **Action Required:** Set to `false` only for self-signed certs
  - **Location:** `server/.env`

---

### 13. Blockchain (Evidence Truth Layer)

#### Ethereum / Polygon
- **`ETHEREUM_RPC_URL`** - Currently: `https://mainnet.infura.io/v3/YOUR_PROJECT_ID`
  - **Action Required:** Get RPC endpoint from Infura, Alchemy, or QuickNode
  - **URL:** https://infura.io or https://alchemy.com
  - **Location:** `server/.env`
  - **Used For:** Evidence Truth Layer -- immutable compliance attestation

- **`BLOCKCHAIN_PRIVATE_KEY`** - Currently: `0xYOUR_PRIVATE_KEY`
  - **Action Required:** Set deployer wallet private key (never share, use Docker secrets in production)
  - **Location:** `server/.env`

- **`COMPLIANCE_CONTRACT_ADDRESS`** - Currently: `0x0000...0000`
  - **Action Required:** Set deployed contract address after deployment
  - **Location:** `server/.env`

- **`COMPLIANCE_REGISTRY_ADDRESS`** - Currently: `0x0000...0000`
  - **Action Required:** Set deployed registry address after deployment
  - **Location:** `server/.env`

- **`DEPLOY_NETWORK`** - Currently: `localhost`
  - **Action Required:** Set to `mainnet`, `polygon`, or testnet name
  - **Location:** `server/.env`

- **`ETHERSCAN_API_KEY`** - Currently: `YOUR_ETHERSCAN_API_KEY`
  - **Action Required:** Get from Etherscan for contract verification
  - **Location:** `server/.env`

- **`POLYGON_RPC_URL`** - Currently: `https://polygon-rpc.com`
- **`POLYGONSCAN_API_KEY`** - Currently: `YOUR_POLYGONSCAN_API_KEY`
- **`MUMBAI_RPC_URL`** - Currently: `https://rpc-mumbai.maticvigil.com`
- **`GOERLI_RPC_URL`** - Currently: `https://goerli.infura.io/v3/YOUR_PROJECT_ID`
- **`GAS_PRICE_MULTIPLIER`** - Currently: `1.2`
- **`ADMIN_ADDRESSES`** - Comma-separated Ethereum addresses for admin role
- **`AUDITOR_ADDRESSES`** - Comma-separated Ethereum addresses for auditor role
- **`OPERATOR_ADDRESSES`** - Comma-separated Ethereum addresses for operator role
- **`ATTESTATION_SECRET`** - Currently: `YOUR_ATTESTATION_SECRET`

#### Hyperledger Fabric (Optional)
- **`HYPERLEDGER_PEER_ENDPOINT`** - Currently: `grpcs://localhost:7051`
- **`HYPERLEDGER_CHANNEL_NAME`** - Currently: `compliance-channel`
- **`HYPERLEDGER_CHAINCODE_NAME`** - Currently: `compliance-cc`
- **`HYPERLEDGER_MSP_ID`** - Currently: `Org1MSP`
- **`HYPERLEDGER_WALLET_PATH`** - Currently: `./wallet`
- **`HYPERLEDGER_PRIVATE_KEY`** - Not set
- **`HYPERLEDGER_USER_PRIVATE_KEY_PEM`** - Not set
- **`HYPERLEDGER_PEER_TLS_CERT_PATH`** - Not set
- **`HYPERLEDGER_PEER_TLS_KEY_PATH`** - Not set
- **`HYPERLEDGER_PEER_TLS_CA_CERT_PATH`** - Not set

---

### 14. WebRTC / TURN Server (VR Collaborative Review)

- **`TURN_SERVER_URL`** - Currently: `turn:your-turn-server.com:3478`
  - **Action Required:** Set TURN server URL for NAT traversal
  - **Location:** `server/.env`
  - **Used For:** VR collaborative compliance review (WebRTC relay)
  - **Production Options:**
    - Twilio TURN service
    - Xirsys
    - Self-hosted coturn

- **`TURN_USERNAME`** - Currently: `YOUR_TURN_USERNAME`
  - **Action Required:** Set TURN server username
  - **Location:** `server/.env`

- **`TURN_CREDENTIAL`** - Currently: `YOUR_TURN_CREDENTIAL`
  - **Action Required:** Set TURN server credential
  - **Location:** `server/.env`

- **`WEBRTC_SIGNALING_SERVER`** - Currently: `wss://your-signaling-server.com`
- **`WEBRTC_STUN_SERVERS`** - Currently: `stun:stun.l.google.com:19302`
- **`WEBRTC_TURN_URL`** - Currently: `turn:your-turn-server.com:3478`
- **`WEBRTC_TURN_TLS_URL`** - Currently: `turns:your-turn-server.com:5349`
- **`WEBRTC_TURN_TTL`** - Currently: `86400` (seconds)
- **`WEBRTC_RELAY_ONLY`** - Currently: `false`
- **`WEBRTC_TURN_SECRET`** - Not set (TURN credential generation secret)

---

### 15. LDAP / Active Directory (Enterprise Integration)

- **`LDAP_URL`** - Currently: `ldap://localhost:389`
  - **Action Required:** Set production LDAP/AD server URL
  - **Format:** `ldap://ad.company.com:389` or `ldaps://ad.company.com:636`
  - **Location:** `server/.env`
  - **Used For:** Enterprise Active Directory user/group sync

- **`LDAP_BASE_DN`** - Currently: `dc=example,dc=com`
  - **Action Required:** Set your organization's base distinguished name
  - **Location:** `server/.env`

- **`LDAP_BIND_DN`** - Currently: `cn=admin,dc=example,dc=com`
  - **Action Required:** Set the bind DN for LDAP authentication
  - **Location:** `server/.env`

- **`LDAP_BIND_PASSWORD`** - Currently: `YOUR_LDAP_BIND_PASSWORD`
  - **Action Required:** Set the bind password
  - **Location:** `server/.env`

- **`LDAP_USE_TLS`** - Currently: `false`
  - **Action Required:** Set to `true` for production (STARTTLS)
  - **Location:** `server/.env`

- **`LDAP_TLS_REJECT_UNAUTHORIZED`** - Currently: `true`
- **`LDAP_POOL_SIZE`** - Currently: `5`
- **`LDAP_CONNECT_TIMEOUT`** - Currently: `5000` (ms)
- **`LDAP_SEARCH_TIMEOUT`** - Currently: `10000` (ms)
- **`LDAP_RECONNECT_INTERVAL`** - Currently: `5000` (ms)
- **`LDAP_CACHE_TTL_MS`** - Currently: `300000` (5 min)

---

### 16. OPA (Open Policy Agent) -- Compliance as Code

- **`OPA_ENDPOINT`** - Currently: `http://localhost:8181`
  - **Action Required:** Set production OPA server URL
  - **Location:** `server/.env`
  - **Used For:** Compliance-as-Code policy evaluation engine

- **`OPA_AUTH_TOKEN`** - Currently: `YOUR_OPA_TOKEN`
  - **Action Required:** Set OPA authorization bearer token
  - **Location:** `server/.env`

---

### 17. HashiCorp Vault (Secret Management / BYOK)

- **`VAULT_ADDR`** - Currently: `http://localhost:8200`
  - **Action Required:** Set production Vault server address
  - **Location:** `server/.env`
  - **Used For:** BYOK (Bring Your Own Key) secret management

- **`VAULT_TOKEN`** - Currently: `YOUR_VAULT_TOKEN`
  - **Action Required:** Set Vault authentication token
  - **Location:** `server/.env`

---

### 18. IoT / MQTT (Physical AI)

#### MQTT Broker
- **`MQTT_BROKER_URL`** - Currently: `mqtt://localhost:1883`
  - **Action Required:** Set production MQTT broker URL
  - **Format:** `mqtt://broker.example.com:1883` or `mqtts://broker.example.com:8883`
  - **Location:** `server/.env`
  - **Used For:** IoT device communication, Physical AI compliance
  - **Options:**
    - AWS IoT Core
    - Azure IoT Hub
    - Self-hosted MQTT broker (Mosquitto)

- **`MQTT_USERNAME`** - Currently: `YOUR_MQTT_USERNAME`
  - **Action Required:** Set if MQTT broker requires authentication
  - **Location:** `server/.env`

- **`MQTT_PASSWORD`** - Currently: `YOUR_MQTT_PASSWORD`
  - **Action Required:** Set if MQTT broker requires authentication
  - **Location:** `server/.env`

- **`MQTT_CLIENT_ID`** - Currently: `complyeasy-server`
  - **Action Required:** Set unique client ID for MQTT connection
  - **Location:** `server/.env`

---

### 19. EU AI Act Database Integration

- **`EU_AI_DB_API_BASE_URL`** - Currently: `https://api.euaiact-db.eu`
  - **Action Required:** Set the EU AI Act database API endpoint
  - **Location:** `server/.env`

- **`EU_AI_DB_CLIENT_ID`** - Currently: `YOUR_EU_AI_DB_CLIENT_ID`
  - **Action Required:** Register and obtain client credentials
  - **Location:** `server/.env`

- **`EU_AI_DB_CLIENT_SECRET`** - Currently: `YOUR_EU_AI_DB_CLIENT_SECRET`
  - **Location:** `server/.env`

- **`EU_AI_DB_ORG_ID`** - Currently: `YOUR_EU_AI_DB_ORG_ID`
  - **Location:** `server/.env`

---

### 20. Security Scanning

- **`VIRUS_SCAN_METHOD`** - Currently: `clamav` (options: `clamav` | `virustotal`)
- **`CLAMAV_HOST`** - Currently: `localhost`
- **`VIRUSTOTAL_API_KEY`** - Currently: `YOUR_VIRUSTOTAL_API_KEY`
- **`ABUSEIPDB_API_KEY`** - Currently: `YOUR_ABUSEIPDB_API_KEY` (IP reputation)
- **`KNOWN_MALICIOUS_IPS`** - Comma-separated list

---

### 21. Additional Services

#### Speaker Diarization
- **`PYANNOTE_SERVICE_URL`** - Currently: `http://localhost:8001`

#### NVD (National Vulnerability Database)
- **`NVD_API_KEY`** - Currently: `YOUR_NVD_API_KEY`

#### Firmware Registry
- **`FIRMWARE_REGISTRY_URL`** - Currently: `https://firmware.example.com`

#### Deepfake / Liveness Detection
- **`DEEPFAKE_THRESHOLD`** - Currently: `0.7`
- **`DEEPFAKE_MAX_FRAMES`** - Currently: `30`
- **`DEEPFAKE_FRAME_INTERVAL`** - Currently: `5`
- **`LIVENESS_THRESHOLD`** - Currently: `0.5`
- **`LIVENESS_EAR_THRESHOLD`** - Currently: `0.25`
- **`LIVENESS_EAR_OPEN`** - Currently: `0.3`

#### MDM (Mobile Device Management)
- **`MDM_PROVIDER_URL`** - Not set (e.g., Jamf, Intune endpoint)

---

### 22. Application URLs & Server Configuration

#### Server Port
- **`PORT`** - Currently: `3001`
  - **Action Required:** Set production port (typically 80/443 or use reverse proxy)
  - **Location:** `server/.env`

#### Environment
- **`NODE_ENV`** - Currently: `development`
  - **Action Required:** Set to `production`
  - **Location:** `server/.env`

#### URLs
- **`API_URL`** - Currently: `http://localhost:3001`
  - **Action Required:** Update to production backend URL
  - **Format:** `https://api.yourdomain.com`
  - **Location:** `server/.env`

- **`CLIENT_URL`** - Currently: `http://localhost:3000`
  - **Action Required:** Update to production frontend URL
  - **Format:** `https://app.yourdomain.com`
  - **Location:** `server/.env`
  - **Used For:** CORS configuration, email links

- **`CORS_ORIGIN`** - Currently: `http://localhost:3000`
  - **Action Required:** Set to production frontend URL (comma-separated for multiple origins)
  - **Location:** `server/.env`

#### Mobile App
- **`EXPO_PUBLIC_API_URL`** - Currently: `http://localhost:5000/api`
  - **Action Required:** Update to production API URL for React Native app
  - **Location:** `server/.env`

#### Logging
- **`LOG_LEVEL`** - Currently: `info` (options: `error` | `warn` | `info` | `debug`)
- **`LOG_CONSOLE`** - Currently: `true`
- **`LOG_FILE`** - Currently: `false`

#### Rate Limiting
- **`RATE_LIMIT_WINDOW_MS`** - Currently: `900000` (15 minutes)
- **`RATE_LIMIT_MAX_REQUESTS`** - Currently: `100` (per window)

#### Session Management
- **`SESSION_TIMEOUT`** - Currently: `3600000` (1 hour)
- **`SESSION_WARNING_TIME`** - Currently: `300000` (5 minutes)
- **`SESSION_CLEANUP_INTERVAL`** - Currently: `600000` (10 minutes)
- **`MAX_CONCURRENT_SESSIONS`** - Currently: `5`

#### NTP / Time
- **`NTP_SERVER`** - Currently: `pool.ntp.org`
- **`NTP_PORT`** - Currently: `123`
- **`TSA_URL`** - Currently: `http://timestamp.digicert.com`

#### Database Pool
- **`DB_POOL_SIZE`** - Currently: `10`
- **`DB_POOL_TIMEOUT`** - Currently: `20` (seconds)

---

### 23. Multi-Region Deployment (Optional)

- **`DEPLOY_REGION`** - Currently: `us-east-1`
- **`DEPLOY_NETWORKS`** - Currently: `us-east,eu-central`
- **`DEPLOYMENT_STATE_PATH`** - Currently: `./deployment-state.json`
- **`ENABLE_CROSS_REGION_HEALTH`** - Currently: `false`

Per-region overrides (set as needed):
- `US_EAST_API_URL`, `US_EAST_DATABASE_URL`, `US_EAST_REDIS_URL`, `US_EAST_S3_BUCKET`
- `US_WEST_API_URL`, `US_WEST_DATABASE_URL`, `US_WEST_REDIS_URL`, `US_WEST_S3_BUCKET`
- `EU_CENTRAL_API_URL`, `EU_CENTRAL_DATABASE_URL`, `EU_CENTRAL_REDIS_URL`, `EU_CENTRAL_S3_BUCKET`
- `EU_WEST_API_URL`, `EU_WEST_DATABASE_URL`, `EU_WEST_REDIS_URL`, `EU_WEST_S3_BUCKET`
- `AP_NORTHEAST_API_URL`, `AP_NORTHEAST_DATABASE_URL`, `AP_NORTHEAST_REDIS_URL`, `AP_NORTHEAST_S3_BUCKET`
- `AP_SOUTHEAST_API_URL`, `AP_SOUTHEAST_DATABASE_URL`, `AP_SOUTHEAST_REDIS_URL`, `AP_SOUTHEAST_S3_BUCKET`

---

## Summary by Feature

### Features Requiring Real Credentials:

| # | Feature | Variables | Key Vars |
|---|---------|-----------|----------|
| 1 | **Authentication & Security** | 4 | JWT_SECRET, JWT_REFRESH_SECRET, ENCRYPTION_KEY |
| 2 | **Database** | 1 | DATABASE_URL |
| 3 | **Redis (Cache/Queue/CSRF)** | 2 | REDIS_URL, REDIS_HOST |
| 4 | **AI -- Gemini** | 1 | GEMINI_API_KEY |
| 5 | **AI -- OpenAI Whisper** | 1 | OPENAI_API_KEY |
| 6 | **Email (SendGrid)** | 3 | SENDGRID_API_KEY, SENDGRID_FROM_EMAIL |
| 7 | **SMS (Twilio)** | 3 | TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER |
| 8 | **Payments (Stripe)** | 16 | STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, 8 tier price IDs, 5 add-on price IDs |
| 9 | **File Storage (AWS S3)** | 6 | AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET |
| 10 | **Frontend (Vite)** | 3 | VITE_API_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY |
| 11 | **OAuth -- Google** | 5 | GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL |
| 12 | **OAuth -- GitHub** | 5 | GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_CALLBACK_URL |
| 13 | **OAuth -- GitLab** | 1 | GITLAB_TOKEN |
| 14 | **OAuth -- Slack** | 4 | SLACK_CLIENT_ID, SLACK_CLIENT_SECRET, SLACK_CALLBACK_URL |
| 15 | **OAuth -- Jira** | 3 | JIRA_CLIENT_ID, JIRA_CLIENT_SECRET, JIRA_CALLBACK_URL |
| 16 | **Sentry (Error Tracking)** | 4 | SENTRY_DSN, SENTRY_ENABLED |
| 17 | **Elastic APM** | 7 | ELASTIC_APM_SERVER_URL, APM_ENABLED |
| 18 | **Elasticsearch (Logs)** | 7 | ELASTICSEARCH_URL, ELASTICSEARCH_USERNAME, ELASTICSEARCH_PASSWORD |
| 19 | **Blockchain (Ethereum)** | 12+ | ETHEREUM_RPC_URL, BLOCKCHAIN_PRIVATE_KEY |
| 20 | **Blockchain (Hyperledger)** | 10 | HYPERLEDGER_PEER_ENDPOINT |
| 21 | **WebRTC / TURN** | 10 | TURN_SERVER_URL, TURN_USERNAME, TURN_CREDENTIAL |
| 22 | **LDAP / Active Directory** | 11 | LDAP_URL, LDAP_BASE_DN, LDAP_BIND_DN, LDAP_BIND_PASSWORD |
| 23 | **OPA (Policy Engine)** | 2 | OPA_ENDPOINT, OPA_AUTH_TOKEN |
| 24 | **HashiCorp Vault** | 2 | VAULT_ADDR, VAULT_TOKEN |
| 25 | **IoT / MQTT** | 4 | MQTT_BROKER_URL |
| 26 | **EU AI Act Database** | 4 | EU_AI_DB_API_BASE_URL, EU_AI_DB_CLIENT_ID |
| 27 | **Security Scanning** | 5 | VIRUS_SCAN_METHOD, VIRUSTOTAL_API_KEY |
| 28 | **Server Config & URLs** | 10+ | PORT, NODE_ENV, API_URL, CLIENT_URL, CORS_ORIGIN |
| 29 | **Multi-Region** | 28 | Per-region DB, Redis, S3, API URLs |

---

## Total Count

- **Total Environment Variables:** 120+
- **Critical (Block Production):** ~15 (DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, ENCRYPTION_KEY, GEMINI_API_KEY, SENDGRID_API_KEY, SENDGRID_FROM_EMAIL, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, AWS keys, CORS_ORIGIN)
- **Important (Feature-Gating):** ~30 (Redis, Stripe price IDs, OAuth, Sentry, Elasticsearch)
- **Optional (Advanced Features):** ~75 (Blockchain, LDAP, MQTT, WebRTC, Multi-Region, APM)

---

## Pre-Production Checklist

- [ ] Generate and set all JWT/encryption secrets
- [ ] Configure production PostgreSQL database (Supabase or RDS)
- [ ] Configure production Redis (ElastiCache, Redis Cloud, or Upstash)
- [ ] Get Gemini API key from Google AI Studio
- [ ] Get OpenAI API key for Whisper transcription
- [ ] Set up SendGrid account and verify sender email
- [ ] Set up Twilio account for SMS notifications
- [ ] Create Stripe account and get live keys (`sk_live_`, `pk_live_`)
- [ ] Create Stripe products: 4 tiers (Foundation, Essentials, Growth, Visionary) x 2 cycles (monthly, annual) = 8 price IDs
- [ ] Create Stripe add-on products: vCISO, Custom Frameworks, Audit Bundling, Custom AI, On-Prem = 5 price IDs
- [ ] Configure Stripe webhook endpoint: `POST {API_URL}/api/billing/webhook`
- [ ] Set up AWS S3 bucket and IAM credentials
- [ ] Set frontend vars: VITE_API_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
- [ ] Create OAuth apps for Google, GitHub, Slack, Jira
- [ ] Update all callback URLs from `localhost:3001` to production domain
- [ ] Set up Sentry project and enable error tracking (SENTRY_ENABLED=true)
- [ ] Configure Elasticsearch for log aggregation (ELASTICSEARCH_ENABLED=true)
- [ ] Set up blockchain RPC endpoint (Infura/Alchemy) and deploy contracts
- [ ] Configure TURN server for WebRTC (if using VR collaborative review)
- [ ] Configure LDAP/AD connection (if using enterprise AD integration)
- [ ] Set up OPA server (if using Compliance-as-Code)
- [ ] Set up HashiCorp Vault (if using BYOK)
- [ ] Configure MQTT broker (if using IoT/Physical AI features)
- [ ] Update all application URLs (API_URL, CLIENT_URL, CORS_ORIGIN) to production domains
- [ ] Set NODE_ENV to `production`
- [ ] Test all integrations with real credentials
- [ ] Verify email delivery works (SendGrid)
- [ ] Verify SMS delivery works (Twilio)
- [ ] Test payment processing with Stripe test mode first, then switch to live
- [ ] Verify file uploads to S3 work
- [ ] Test OAuth flows end-to-end
- [ ] Verify Redis connectivity (cache, job queue, token blacklist)
- [ ] Run `npm run validate:env` to check all required variables

---

## Security Notes

1. **Never commit `.env` files to git** -- Already in `.gitignore`
2. **Docker secrets support** -- Use the `FOO_FILE` pattern for sensitive vars (see note at top)
3. **Use environment-specific secrets** -- Different keys for dev/staging/prod
4. **Rotate secrets regularly** -- Especially JWT secrets and API keys
5. **Use secret management services** in production:
   - AWS Secrets Manager
   - Azure Key Vault
   - Google Secret Manager
   - HashiCorp Vault (built-in BYOK integration)
6. **Enable MFA** on all service accounts (Stripe, AWS, SendGrid, etc.)
7. **Use least privilege** for IAM roles and API keys
8. **Monitor API key usage** for anomalies
9. **CORS_ORIGIN** is validated at startup -- always set it to your frontend domain(s)
10. **Stripe keys** are validated at startup -- `sk_` prefix for secret, `whsec_` for webhook

---

**Last Updated:** March 5, 2026
