# Environment Variables Documentation

This document provides a comprehensive guide to **all** environment variables used in ComplyEasy AI. There are 120+ variables across 25+ categories covering the server, frontend, integrations, blockchain, monitoring, and multi-region deployment.

## Quick Start

1. Copy the example file: `cp server/.env.example server/.env`
2. Fill in the required variables (marked with **REQUIRED**)
3. Run validation: `npm run validate:env` (in server directory)
4. Start the application: `npm run dev` (in server directory)

## Docker Secrets Support

The config layer (`server/src/config/index.ts`) supports Docker secrets via `FOO_FILE` environment variables. For each supported key, if `FOO_FILE` is set to a file path and `FOO` itself is not set, the value is read from that file at startup. This avoids exposing secrets via `docker inspect`.

**Supported keys for Docker secrets:**
`DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ENCRYPTION_KEY`, `GEMINI_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SENDGRID_API_KEY`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`

**Usage example** (Docker Compose):
```yaml
secrets:
  db_url:
    file: ./secrets/database_url.txt
services:
  api:
    environment:
      DATABASE_URL_FILE: /run/secrets/db_url
    secrets:
      - db_url
```

---

## Variable Categories

### 1. Core Server Configuration

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | **REQUIRED** | `development` | Node.js environment: `development`, `production`, or `test` |
| `PORT` | Optional | `3001` | Server port number. Source: `config/index.ts` uses `parseInt(process.env.PORT \|\| '3001', 10)` |
| `API_URL` | **REQUIRED** | `http://localhost:3001` | Public base URL of the API. Used for OAuth callbacks, email links, etc. Source: `config/index.ts` defaults to `http://localhost:3001` |
| `CLIENT_URL` | **REQUIRED** | `http://localhost:3000` | Frontend application URL. Used for CORS configuration, email redirects, etc. |

---

### 2. Database (PostgreSQL / Supabase)

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | **REQUIRED** | (none) | PostgreSQL connection string |

- **Format:** `postgresql://user:password@host:port/database?schema=public`
- **Example:** `postgresql://postgres:password@localhost:5432/complyeasy?schema=public`
- **Where to get:** Your database provider (Supabase Dashboard -> Settings -> Database -> Connection string, or AWS RDS, etc.)
- **Validation:** Must start with `postgresql://`. Application will not start without it.
- **Docker secrets:** Supported via `DATABASE_URL_FILE`

---

### 3. Redis Cache & Job Queue

| Variable | Required | Default | Description |
|---|---|---|---|
| `REDIS_URL` | Optional | (none) | Full Redis connection URL. Takes precedence over `REDIS_HOST` |
| `REDIS_HOST` | Optional | `localhost` | Redis hostname. Fallback if `REDIS_URL` is not set (connects on default port 6379) |

- **Used for:** Cache layer, BullMQ job queue, CSRF token store, JWT token blacklist
- **Docker secrets:** `REDIS_URL` supported via `REDIS_URL_FILE`

---

### 4. JWT Authentication

| Variable | Required | Default | Description |
|---|---|---|---|
| `JWT_SECRET` | **REQUIRED** | (none) | Secret key for signing JWT access tokens |
| `JWT_REFRESH_SECRET` | **REQUIRED** | (none) | Secret key for signing JWT refresh tokens |
| `JWT_EXPIRES_IN` | Optional | `15m` | Access token expiration time. Source: `config/index.ts` defaults to `'15m'` |
| `JWT_REFRESH_EXPIRES_IN` | Optional | `30d` | Refresh token expiration time |

- **Minimum length:** 32 characters for both secrets
- **How to generate:**
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- **Security:** Must be kept secret. Use different values for `JWT_SECRET` and `JWT_REFRESH_SECRET`.
- **Docker secrets:** Both `JWT_SECRET` and `JWT_REFRESH_SECRET` supported via `_FILE` variants
- **Format for TTL:** Time string (e.g., `15m`, `1h`, `7d`, `30d`)

---

### 5. Encryption

| Variable | Required | Default | Description |
|---|---|---|---|
| `ENCRYPTION_KEY` | **REQUIRED** | (none) | Encryption key for 2FA secrets, BYOK, and other sensitive data |

- **Minimum length:** 16 characters (64-character hex string recommended)
- **How to generate:**
  ```bash
  openssl rand -hex 32
  ```
- **Docker secrets:** Supported via `ENCRYPTION_KEY_FILE`

---

### 6. Frontend (Vite)

Frontend variables are prefixed with `VITE_` and are located in `.env.local` (root directory) or `.env`.

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_URL` | **REQUIRED** | (none) | Backend API URL for frontend requests |
| `VITE_SUPABASE_URL` | Optional | (none) | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Optional | (none) | Supabase anonymous/public key |

- **Development example:** `VITE_API_URL=http://localhost:3001/api`
- **Production example:** `VITE_API_URL=https://api.complyeasyai.com/api`

---

### 7. Google Gemini AI

| Variable | Required | Default | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | **REQUIRED** | (none) | Google Gemini AI API key. Powers the AI compliance copilot |

- **Where to get:** [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Format:** Alphanumeric string
- **Docker secrets:** Supported via `GEMINI_API_KEY_FILE`

---

### 8. OpenAI (Whisper Transcription)

| Variable | Required | Default | Description |
|---|---|---|---|
| `OPENAI_API_KEY` | Optional | (none) | OpenAI API key. Required for audio/video transcription via Whisper |

- **Where to get:** [OpenAI Platform](https://platform.openai.com/api-keys)

---

### 9. SendGrid Email

| Variable | Required | Default | Description |
|---|---|---|---|
| `SENDGRID_API_KEY` | **REQUIRED** | (none) | SendGrid API key for email delivery (magic links, notifications) |
| `SENDGRID_FROM_EMAIL` | **REQUIRED** | (none) | Verified sender email address |
| `SENDGRID_FROM_NAME` | Optional | `ComplyEasy AI` | Display name for sent emails |

- **Where to get:** [SendGrid Dashboard](https://app.sendgrid.com/settings/api_keys)
- **Validation:** `SENDGRID_API_KEY` must start with `SG.`. `SENDGRID_FROM_EMAIL` must be a valid email and verified in SendGrid.
- **Docker secrets:** `SENDGRID_API_KEY` supported via `SENDGRID_API_KEY_FILE`

---

### 10. CORS Configuration

| Variable | Required | Default | Description |
|---|---|---|---|
| `CORS_ORIGIN` | **REQUIRED** | (none) | Allowed origins for CORS requests |

- **Supports comma-separated list:** The config parses this via `.split(',').map(s => s.trim())`, so you can allow multiple origins.
- **Single origin example:** `http://localhost:3000`
- **Multiple origins example:** `http://localhost:3000, https://app.complyeasyai.com`
- **Security:** Restrict to your frontend domain(s) in production.

---

### 11. Stripe Payments & Billing

#### Core Stripe Keys

| Variable | Required | Default | Description |
|---|---|---|---|
| `STRIPE_SECRET_KEY` | Recommended | (none) | Stripe secret API key. Required for billing features |
| `STRIPE_PUBLISHABLE_KEY` | Recommended | (none) | Stripe publishable key for frontend checkout |
| `STRIPE_WEBHOOK_SECRET` | Recommended | (none) | Stripe webhook signing secret for event verification |

- **Where to get:** [Stripe Dashboard](https://dashboard.stripe.com/apikeys) / [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
- **Validation:** `STRIPE_SECRET_KEY` must start with `sk_`. `STRIPE_WEBHOOK_SECRET` must start with `whsec_`.
- **Docker secrets:** `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` supported via `_FILE` variants

#### Active Tier Price IDs (used by `stripeService.ts`)

These are the price IDs used by the **actual billing system** (`stripeService.ts`). Each tier has monthly and annual variants.

| Variable | Required | Default | Description |
|---|---|---|---|
| `STRIPE_FOUNDATION_MONTHLY_PRICE_ID` | Optional | (none) | Foundation tier -- monthly billing |
| `STRIPE_FOUNDATION_ANNUAL_PRICE_ID` | Optional | (none) | Foundation tier -- annual billing |
| `STRIPE_ESSENTIALS_MONTHLY_PRICE_ID` | Optional | (none) | Essentials tier -- monthly billing |
| `STRIPE_ESSENTIALS_ANNUAL_PRICE_ID` | Optional | (none) | Essentials tier -- annual billing |
| `STRIPE_GROWTH_MONTHLY_PRICE_ID` | Optional | (none) | Growth tier -- monthly billing |
| `STRIPE_GROWTH_ANNUAL_PRICE_ID` | Optional | (none) | Growth tier -- annual billing |
| `STRIPE_VISIONARY_MONTHLY_PRICE_ID` | Optional | (none) | Visionary tier -- monthly billing |
| `STRIPE_VISIONARY_ANNUAL_PRICE_ID` | Optional | (none) | Visionary tier -- annual billing |

- **Format:** `price_xxxxx` (Stripe price ID)
- **Where to get:** [Stripe Products](https://dashboard.stripe.com/products)

#### Add-on Price IDs (used by `stripeService.ts`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `STRIPE_ADDON_VCISO_PRICE_ID` | Optional | (none) | vCISO add-on |
| `STRIPE_ADDON_CUSTOM_FRAMEWORKS_PRICE_ID` | Optional | (none) | Custom frameworks add-on |
| `STRIPE_ADDON_AUDIT_BUNDLING_PRICE_ID` | Optional | (none) | Audit bundling add-on |
| `STRIPE_ADDON_CUSTOM_AI_PRICE_ID` | Optional | (none) | Custom AI models add-on |
| `STRIPE_ADDON_ON_PREM_PRICE_ID` | Optional | (none) | On-premises deployment add-on |

#### Legacy Tier Price IDs (in `config/index.ts` only -- NOT used by billing)

These variables exist in `config/index.ts` as legacy dead code. They are **not** consumed by `stripeService.ts` or any active billing logic. They default to `'Contact Us'` if unset.

| Variable | Required | Default | Description |
|---|---|---|---|
| `STRIPE_BASIC_PRICE_ID` | Unused (legacy) | `Contact Us` | Legacy Basic plan price ID |
| `STRIPE_PRO_PRICE_ID` | Unused (legacy) | `Contact Us` | Legacy Pro plan price ID |
| `STRIPE_ENTERPRISE_PRICE_ID` | Unused (legacy) | `Contact Us` | Legacy Enterprise plan price ID |

---

### 12. Twilio SMS Notifications

| Variable | Required | Default | Description |
|---|---|---|---|
| `TWILIO_ACCOUNT_SID` | Optional | (none) | Twilio account SID. Required for SMS alert features |
| `TWILIO_AUTH_TOKEN` | Optional | (none) | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | Optional | (none) | Twilio sender phone number (E.164 format, e.g., `+15551234567`) |

- **Where to get:** [Twilio Console](https://console.twilio.com/)

---

### 13. AWS Services

| Variable | Required | Default | Description |
|---|---|---|---|
| `AWS_ACCESS_KEY_ID` | Recommended | (none) | AWS access key. Required for S3 evidence storage and BYOK |
| `AWS_SECRET_ACCESS_KEY` | Recommended | (none) | AWS secret access key |
| `AWS_REGION` | Optional | `us-east-1` | AWS region for services |
| `AWS_S3_BUCKET` | Recommended | (none) | S3 bucket name for file/evidence storage |
| `AWS_ACCOUNT_ID` | Optional | (none) | AWS account ID for CDK deployments |
| `SCAN_TEMP_BUCKET` | Optional | (none) | Temporary S3 bucket for malware scan staging |

- **Where to get:** [AWS IAM Console](https://console.aws.amazon.com/iam/)
- **Docker secrets:** `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` supported via `_FILE` variants

---

### 14. OAuth Integrations

OAuth callback URLs should use the format `{API_URL}/api/integrations/{provider}/callback`. In development with the default port, this is `http://localhost:3001/api/integrations/{provider}/callback`.

#### Google OAuth

| Variable | Required | Default | Description |
|---|---|---|---|
| `GOOGLE_CLIENT_ID` | Optional | (none) | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Optional | (none) | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | Optional | (none) | OAuth callback URL |
| `GOOGLE_APPLICATION_CREDENTIALS` | Optional | (none) | Path to GCP service account JSON file |
| `GOOGLE_VISION_API_KEY` | Optional | (none) | Google Cloud Vision API key for evidence image analysis |
| `GCP_PROJECT_ID` | Optional | (none) | Google Cloud Platform project ID |

- **Where to get:** [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- **Callback URL example:** `http://localhost:3001/api/integrations/google/callback`

#### GitHub OAuth & Webhooks

| Variable | Required | Default | Description |
|---|---|---|---|
| `GITHUB_CLIENT_ID` | Optional | (none) | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | Optional | (none) | GitHub OAuth app client secret |
| `GITHUB_CALLBACK_URL` | Optional | (none) | OAuth callback URL |
| `GITHUB_TOKEN` | Optional | (none) | GitHub Personal Access Token for Compliance-as-Code repo access |
| `GITHUB_WEBHOOK_SECRET` | Optional | (none) | Secret for verifying GitHub webhook payloads |

- **Where to get:** [GitHub Developer Settings](https://github.com/settings/developers)
- **Callback URL example:** `http://localhost:3001/api/integrations/github/callback`

#### GitLab

| Variable | Required | Default | Description |
|---|---|---|---|
| `GITLAB_TOKEN` | Optional | (none) | GitLab Personal Access Token for Compliance-as-Code GitLab integration |

#### Slack OAuth

| Variable | Required | Default | Description |
|---|---|---|---|
| `SLACK_CLIENT_ID` | Optional | (none) | Slack app client ID |
| `SLACK_CLIENT_SECRET` | Optional | (none) | Slack app client secret |
| `SLACK_CALLBACK_URL` | Optional | (none) | OAuth callback URL |
| `SLACK_DEFAULT_CHANNEL` | Optional | `compliance-alerts` | Default Slack channel for compliance notifications |

- **Where to get:** [Slack API](https://api.slack.com/apps)
- **Callback URL example:** `http://localhost:3001/api/integrations/slack/callback`

#### Jira OAuth

| Variable | Required | Default | Description |
|---|---|---|---|
| `JIRA_CLIENT_ID` | Optional | (none) | Jira OAuth app client ID |
| `JIRA_CLIENT_SECRET` | Optional | (none) | Jira OAuth app client secret |
| `JIRA_CALLBACK_URL` | Optional | (none) | OAuth callback URL |

- **Where to get:** [Atlassian Developer Console](https://developer.atlassian.com/console/myapps/)
- **Callback URL example:** `http://localhost:3001/api/integrations/jira/callback`

---

### 15. Blockchain (Ethereum / Polygon)

| Variable | Required | Default | Description |
|---|---|---|---|
| `ETHEREUM_RPC_URL` | Optional | (none) | Ethereum JSON-RPC endpoint |
| `BLOCKCHAIN_PRIVATE_KEY` | Optional | (none) | Deployer wallet private key (hex with `0x` prefix) |
| `COMPLIANCE_CONTRACT_ADDRESS` | Optional | (none) | Deployed compliance smart contract address |
| `COMPLIANCE_REGISTRY_ADDRESS` | Optional | (none) | Deployed compliance registry contract address |
| `DEPLOY_NETWORK` | Optional | `localhost` | Target network: `localhost`, `goerli`, `mainnet`, `polygon`, `mumbai` |
| `ETHERSCAN_API_KEY` | Optional | (none) | Etherscan API key for contract verification |
| `GAS_PRICE_MULTIPLIER` | Optional | `1.2` | Gas price multiplier for transaction submission |
| `POLYGON_RPC_URL` | Optional | (none) | Polygon mainnet RPC endpoint |
| `POLYGONSCAN_API_KEY` | Optional | (none) | Polygonscan API key for contract verification |
| `MUMBAI_RPC_URL` | Optional | (none) | Polygon Mumbai testnet RPC endpoint |
| `GOERLI_RPC_URL` | Optional | (none) | Goerli testnet RPC endpoint |
| `ADMIN_ADDRESSES` | Optional | (none) | Comma-separated Ethereum addresses with admin role |
| `AUDITOR_ADDRESSES` | Optional | (none) | Comma-separated Ethereum addresses with auditor role |
| `OPERATOR_ADDRESSES` | Optional | (none) | Comma-separated Ethereum addresses with operator role |
| `ATTESTATION_SECRET` | Optional | (none) | Secret for attestation signing |
| `COMPLIANCE_CONTRACT_BYTECODE` | Optional | (none) | Smart contract bytecode for compliance contract deployment |
| `BLOCKCHAIN_AUDIT_ORG_ID` | Optional | (none) | Organization ID for blockchain audit operations |

- **RPC providers:** [Infura](https://infura.io), [Alchemy](https://alchemy.com)

---

### 16. Hyperledger Fabric

| Variable | Required | Default | Description |
|---|---|---|---|
| `HYPERLEDGER_PEER_ENDPOINT` | Optional | (none) | Peer node gRPC endpoint (e.g., `grpcs://localhost:7051`) |
| `HYPERLEDGER_CHANNEL_NAME` | Optional | `compliance-channel` | Fabric channel name |
| `HYPERLEDGER_CHAINCODE_NAME` | Optional | `compliance-cc` | Deployed chaincode name |
| `HYPERLEDGER_MSP_ID` | Optional | `Org1MSP` | Membership Service Provider ID |
| `HYPERLEDGER_WALLET_PATH` | Optional | `./wallet` | Path to identity wallet directory |
| `HYPERLEDGER_PRIVATE_KEY` | Optional | (none) | Private key for Fabric identity |
| `HYPERLEDGER_USER_PRIVATE_KEY_PEM` | Optional | (none) | PEM-encoded user private key |
| `HYPERLEDGER_PEER_TLS_CERT_PATH` | Optional | (none) | Path to peer TLS certificate |
| `HYPERLEDGER_PEER_TLS_KEY_PATH` | Optional | (none) | Path to peer TLS private key |
| `HYPERLEDGER_PEER_TLS_CA_CERT_PATH` | Optional | (none) | Path to peer TLS CA certificate |

---

### 17. LDAP / Active Directory

| Variable | Required | Default | Description |
|---|---|---|---|
| `LDAP_URL` | Optional | `ldap://localhost:389` | LDAP server URL |
| `LDAP_BASE_DN` | Optional | `dc=example,dc=com` | Base distinguished name for searches |
| `LDAP_BIND_DN` | Optional | `cn=admin,dc=example,dc=com` | Bind distinguished name (admin account) |
| `LDAP_BIND_PASSWORD` | Optional | (none) | LDAP bind password |
| `LDAP_USE_TLS` | Optional | `false` | Enable STARTTLS |
| `LDAP_TLS_REJECT_UNAUTHORIZED` | Optional | `true` | Reject unauthorized TLS certificates |
| `LDAP_POOL_SIZE` | Optional | `5` | Connection pool size |
| `LDAP_CONNECT_TIMEOUT` | Optional | `5000` | Connection timeout in milliseconds |
| `LDAP_SEARCH_TIMEOUT` | Optional | `10000` | Search timeout in milliseconds |
| `LDAP_RECONNECT_INTERVAL` | Optional | `5000` | Reconnection interval in milliseconds |
| `LDAP_CACHE_TTL_MS` | Optional | `300000` | Cache TTL in milliseconds (5 minutes) |

---

### 18. WebRTC (VR Collaborative Review)

| Variable | Required | Default | Description |
|---|---|---|---|
| `WEBRTC_SIGNALING_SERVER` | Optional | (none) | WebSocket signaling server URL (e.g., `wss://your-server.com`) |
| `WEBRTC_STUN_SERVERS` | Optional | `stun:stun.l.google.com:19302` | STUN server(s) for NAT traversal |
| `WEBRTC_TURN_URL` | Optional | (none) | TURN server URL (`turn:host:3478`) |
| `WEBRTC_TURN_TLS_URL` | Optional | (none) | TURN server TLS URL (`turns:host:5349`) |
| `TURN_SERVER_URL` | Optional | (none) | Alternative TURN server URL |
| `TURN_USERNAME` | Optional | (none) | TURN server username |
| `TURN_CREDENTIAL` | Optional | (none) | TURN server credential/password |
| `WEBRTC_TURN_TTL` | Optional | `86400` | TURN credential TTL in seconds (24 hours) |
| `WEBRTC_RELAY_ONLY` | Optional | `false` | Force relay-only mode (no direct peer connections) |
| `WEBRTC_CUSTOM_STUN_URL` | Optional | (none) | Custom STUN server URL |
| `WEBRTC_EXTRA_TURN_URLS` | Optional | (none) | Additional TURN server URLs |
| `TWILIO_TURN_URL` | Optional | (none) | Twilio TURN service URL |
| `WEBRTC_TURN_SECRET` | Optional | (none) | TURN server credential generation secret |

---

### 19. MQTT (Physical AI / IoT Devices)

| Variable | Required | Default | Description |
|---|---|---|---|
| `MQTT_BROKER_URL` | Optional | `mqtt://localhost:1883` | MQTT broker URL |
| `MQTT_USERNAME` | Optional | (none) | MQTT authentication username |
| `MQTT_PASSWORD` | Optional | (none) | MQTT authentication password |
| `MQTT_CLIENT_ID` | Optional | `complyeasy-{timestamp}` | MQTT client identifier. Config appends `Date.now()` if unset |

---

### 20. OPA (Open Policy Agent)

| Variable | Required | Default | Description |
|---|---|---|---|
| `OPA_ENDPOINT` | Optional | `http://localhost:8181` | OPA server endpoint |
| `OPA_AUTH_TOKEN` | Optional | (none) | OPA authentication token |

---

### 21. HashiCorp Vault (Secret Management)

| Variable | Required | Default | Description |
|---|---|---|---|
| `VAULT_ADDR` | Optional | `http://localhost:8200` | Vault server address |
| `VAULT_TOKEN` | Optional | (none) | Vault authentication token |

---

### 22. Whisper / Speaker Diarization

| Variable | Required | Default | Description |
|---|---|---|---|
| `PYANNOTE_SERVICE_URL` | Optional | `http://localhost:8001` | pyannote.audio diarization microservice URL |

Note: Whisper transcription uses `OPENAI_API_KEY` (see section 8).

---

### 23. EU AI Act Database Integration

| Variable | Required | Default | Description |
|---|---|---|---|
| `EU_AI_DB_API_BASE_URL` | Optional | (none) | EU AI Act database API base URL |
| `EU_AI_DB_CLIENT_ID` | Optional | (none) | Client ID for EU AI Act database |
| `EU_AI_DB_CLIENT_SECRET` | Optional | (none) | Client secret for EU AI Act database |
| `EU_AI_DB_ORG_ID` | Optional | (none) | Organization ID for EU AI Act database |

---

### 24. NVD (National Vulnerability Database)

| Variable | Required | Default | Description |
|---|---|---|---|
| `NVD_API_KEY` | Optional | (none) | NVD API key for vulnerability lookups |

---

### 25. Firmware Registry (Physical AI)

| Variable | Required | Default | Description |
|---|---|---|---|
| `FIRMWARE_REGISTRY_URL` | Optional | (none) | Firmware registry URL for IoT/Physical AI device compliance |

---

### 26. Security Scanning

| Variable | Required | Default | Description |
|---|---|---|---|
| `VIRUS_SCAN_METHOD` | Optional | `clamav` | Virus scanning method: `clamav` or `virustotal` |
| `CLAMAV_HOST` | Optional | `localhost` | ClamAV daemon hostname |
| `VIRUSTOTAL_API_KEY` | Optional | (none) | VirusTotal API key for malware scanning |
| `ABUSEIPDB_API_KEY` | Optional | (none) | AbuseIPDB API key for IP reputation checks |
| `KNOWN_MALICIOUS_IPS` | Optional | (none) | Comma-separated list of known malicious IPs to block |

---

### 27. Deepfake / Liveness Detection

| Variable | Required | Default | Description |
|---|---|---|---|
| `DEEPFAKE_THRESHOLD` | Optional | `0.7` | Deepfake detection confidence threshold (0.0-1.0) |
| `DEEPFAKE_MAX_FRAMES` | Optional | `30` | Maximum frames to analyze for deepfake detection |
| `DEEPFAKE_FRAME_INTERVAL` | Optional | `5` | Frame sampling interval |
| `LIVENESS_THRESHOLD` | Optional | `0.5` | Liveness detection confidence threshold |
| `LIVENESS_EAR_THRESHOLD` | Optional | `0.25` | Eye Aspect Ratio threshold for blink detection |
| `LIVENESS_EAR_OPEN` | Optional | `0.3` | EAR value indicating open eyes |

---

### 28. Monitoring & APM

#### Sentry

| Variable | Required | Default | Description |
|---|---|---|---|
| `SENTRY_DSN` | Optional | (none) | Sentry Data Source Name |
| `SENTRY_ENABLED` | Optional | `false` | Enable/disable Sentry error tracking |
| `SENTRY_TRACES_SAMPLE_RATE` | Optional | `0.1` | Performance traces sample rate (0.0-1.0) |
| `SENTRY_PROFILES_SAMPLE_RATE` | Optional | `0.1` | Profiling sample rate (0.0-1.0) |

- **Where to get:** [Sentry Dashboard](https://sentry.io/settings/projects/)

#### Elastic APM

| Variable | Required | Default | Description |
|---|---|---|---|
| `ELASTIC_APM_SERVER_URL` | Optional | `http://localhost:8200` | Elastic APM server URL |
| `ELASTIC_APM_SECRET_TOKEN` | Optional | (none) | APM secret token |
| `ELASTIC_APM_API_KEY` | Optional | (none) | APM API key |
| `ELASTIC_APM_SAMPLE_RATE` | Optional | `0.1` | Transaction sample rate (0.0-1.0) |
| `APM_ENABLED` | Optional | `false` | Enable/disable APM |
| `APM_SERVICE_NAME` | Optional | `complyeasy-api` | APM service identifier |
| `ENABLE_REAL_MONITORING` | Optional | `false` | Enable real monitoring (vs. mock) |

#### New Relic

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEW_RELIC_LICENSE_KEY` | Optional | (none) | New Relic license key |

---

### 29. Elasticsearch

| Variable | Required | Default | Description |
|---|---|---|---|
| `ELASTICSEARCH_URL` | Optional | `http://localhost:9200` | Elasticsearch cluster URL |
| `ELASTICSEARCH_USERNAME` | Optional | `elastic` | Elasticsearch username |
| `ELASTICSEARCH_PASSWORD` | Optional | (none) | Elasticsearch password |
| `ELASTICSEARCH_ENABLED` | Optional | `false` | Enable/disable Elasticsearch integration |
| `ELASTICSEARCH_INDEX_PREFIX` | Optional | `complyeasy` | Index name prefix |
| `ELASTICSEARCH_LOG_LEVEL` | Optional | `info` | Elasticsearch client log level |
| `ELASTICSEARCH_SSL_REJECT_UNAUTHORIZED` | Optional | `true` | Reject unauthorized SSL certificates |

---

### 30. Logging

| Variable | Required | Default | Description |
|---|---|---|---|
| `LOG_LEVEL` | Optional | `info` | Log level: `error`, `warn`, `info`, `debug` |
| `LOG_CONSOLE` | Optional | `true` | Enable console logging |
| `LOG_FILE` | Optional | `false` | Enable file logging |

---

### 31. Rate Limiting & Security

| Variable | Required | Default | Description |
|---|---|---|---|
| `RATE_LIMIT_WINDOW_MS` | Optional | `900000` | Rate limit window in milliseconds (default: 15 minutes) |
| `RATE_LIMIT_MAX_REQUESTS` | Optional | `100` | Maximum requests per rate limit window |

---

### 32. Session Management

| Variable | Required | Default | Description |
|---|---|---|---|
| `SESSION_TIMEOUT` | Optional | `3600000` | Session timeout in milliseconds (default: 1 hour) |
| `SESSION_WARNING_TIME` | Optional | `300000` | Time before timeout to show warning (default: 5 minutes) |
| `SESSION_CLEANUP_INTERVAL` | Optional | `600000` | Interval for cleaning expired sessions (default: 10 minutes) |
| `MAX_CONCURRENT_SESSIONS` | Optional | `5` | Maximum concurrent sessions per user |

---

### 33. NTP (Time Synchronization)

| Variable | Required | Default | Description |
|---|---|---|---|
| `NTP_SERVER` | Optional | `pool.ntp.org` | NTP server for time synchronization |
| `NTP_PORT` | Optional | `123` | NTP server port |
| `TSA_URL` | Optional | `http://timestamp.digicert.com` | Timestamp authority URL for trusted timestamping |

---

### 34. Mobile App (React Native / Expo)

| Variable | Required | Default | Description |
|---|---|---|---|
| `EXPO_PUBLIC_API_URL` | Optional | (none) | API URL for React Native / Expo mobile app |

- **Development example:** `http://localhost:3001/api`

---

### 35. Multi-Region Deployment

#### Global Settings

| Variable | Required | Default | Description |
|---|---|---|---|
| `DEPLOY_REGION` | Optional | `us-east-1` | Primary deployment region |
| `DEPLOY_NETWORKS` | Optional | (none) | Comma-separated list of active regions (e.g., `us-east,eu-central`) |
| `DEPLOYMENT_STATE_PATH` | Optional | `./deployment-state.json` | Path to deployment state file |
| `ENABLE_CROSS_REGION_HEALTH` | Optional | `false` | Enable cross-region health monitoring |

#### Per-Region Configuration

Each region prefix (`US_EAST_`, `US_WEST_`, `EU_CENTRAL_`, `EU_WEST_`, `AP_NORTHEAST_`, `AP_SOUTHEAST_`) supports these four variables:

| Suffix | Description |
|---|---|
| `*_API_URL` | Regional API endpoint URL |
| `*_DATABASE_URL` | Regional PostgreSQL connection string |
| `*_REDIS_URL` | Regional Redis URL |
| `*_S3_BUCKET` | Regional S3 bucket name |

**Example (US East):**
```bash
US_EAST_API_URL=https://us-east.complyeasy.ai/api
US_EAST_DATABASE_URL=postgresql://user:pass@us-east-db:5432/complyeasy
US_EAST_REDIS_URL=redis://us-east-redis:6379
US_EAST_S3_BUCKET=complyeasy-us-east
```

**Supported region prefixes:** `US_EAST_`, `US_WEST_`, `EU_CENTRAL_`, `EU_WEST_`, `AP_NORTHEAST_`, `AP_SOUTHEAST_`

---

### 36. Database Pool Configuration

| Variable | Required | Default | Description |
|---|---|---|---|
| `DB_POOL_SIZE` | Optional | `10` | Database connection pool size |
| `DB_POOL_TIMEOUT` | Optional | `20` | Pool timeout in seconds |

---

### 37. MDM (Mobile Device Management)

| Variable | Required | Default | Description |
|---|---|---|---|
| `MDM_PROVIDER_URL` | Optional | (none) | MDM provider API URL (e.g., Jamf, Microsoft Intune endpoint) |

---

## Environment-Specific Configuration

### Development
```bash
NODE_ENV=development
PORT=3001
API_URL=http://localhost:3001
CLIENT_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
VITE_API_URL=http://localhost:3001/api
LOG_LEVEL=debug
```

### Production
```bash
NODE_ENV=production
PORT=3001
API_URL=https://api.complyeasyai.com
CLIENT_URL=https://app.complyeasyai.com
CORS_ORIGIN=https://app.complyeasyai.com
VITE_API_URL=https://api.complyeasyai.com/api
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
The application automatically validates environment variables on startup via `config/index.ts`. If validation fails, the application will not start and will display detailed error messages.

### Manual Validation
Run the validation script to check your configuration:

```bash
cd server
npm run validate:env
```

This will:
- Check all required variables are set
- Validate variable formats (e.g., `SG.` prefix for SendGrid, `sk_` for Stripe)
- Provide recommendations for missing optional variables
- Display a comprehensive report

---

## Security Best Practices

1. **Never commit `.env` files** -- They are in `.gitignore`
2. **Use strong secrets** -- Generate random values for JWT_SECRET, JWT_REFRESH_SECRET, ENCRYPTION_KEY
3. **Rotate secrets regularly** -- Especially in production
4. **Use different values** -- Do not reuse secrets across environments
5. **Restrict CORS_ORIGIN** -- Only allow your frontend domain(s) in production
6. **Use environment-specific values** -- Different secrets for dev/staging/prod
7. **Store secrets securely** -- Use secret management services (AWS Secrets Manager, Azure Key Vault, HashiCorp Vault)
8. **Use Docker secrets in containers** -- Prefer `_FILE` env vars over passing secrets directly (see Docker Secrets Support above)

---

## Troubleshooting

### "Missing required environment variables" Error
1. Check that your `.env` file exists in `server/` directory
2. Run `npm run validate:env` for detailed validation
3. Ensure all required variables (marked with **REQUIRED**) are set

### "Invalid format" Errors
- Check variable formats match the requirements
- URLs must be valid URLs
- Email addresses must be valid emails
- Stripe keys must start with correct prefixes (`sk_`, `pk_`, `whsec_`)
- SendGrid key must start with `SG.`

### Database Connection Issues
- Verify `DATABASE_URL` starts with `postgresql://`
- Check database is accessible from your network
- Ensure SSL mode is set if required: `?sslmode=require`

### Email Not Sending
- Verify `SENDGRID_API_KEY` is valid and starts with `SG.`
- Check `SENDGRID_FROM_EMAIL` is verified in SendGrid
- Ensure SendGrid account is active

### Port Conflicts
- Default port is `3001` (not 5000). If port 3001 is in use, set `PORT` to another value.
- Update `API_URL`, `VITE_API_URL`, and OAuth callback URLs if you change the port.

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
6. Create Products with monthly/annual prices for Foundation, Essentials, Growth, and Visionary tiers

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
- Refer to `server/.env.example` for the canonical list of all variables with inline comments

---

**Last Updated:** March 5, 2026
