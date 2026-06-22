# Go Live to Production — ComplyEasyAI Credential & Environment Guide

This is the **complete, authoritative list of every credential** (environment variable) needed to run
ComplyEasyAI at **100% production capability**, with **step-by-step instructions to obtain each one**.

- **Source of truth:** `server/.env.example` (full variable reference) + `vite.config.ts` (`VITE_*` frontend vars).
- **Where they live in production:** put backend secrets in your secret manager (AWS Secrets Manager / SSM
  Parameter Store — see `infrastructure/` + `infrastructure/secrets/`), **never** in a committed file.
  `VITE_*` vars are build-time and get baked into the static frontend bundle — only put **non-secret** values
  there (the Gemini/OpenAI/Stripe-secret keys are **backend-only**; the frontend calls `/api/*`).
- **Legend:** 🔴 **REQUIRED** (app won't start or a core flow is broken) · 🟡 **RECOMMENDED** (a major feature
  is dark without it) · ⚪ **OPTIONAL** (advanced/enterprise add-ons).

> ⚠️ **One-time security action before launch:** rotate any key that ever sat in a committed file. A live
> Gemini key was previously committed and has been purged from git history — **revoke/rotate it in Google AI
> Studio** regardless. Add a secret-scanning pre-commit hook (`gitleaks`/`trufflehog`).

---

## 0. Production deployment prerequisites (read first)

These aren't "API keys" but are required for the app to actually work in production:

1. **Same-origin frontend + API.** Serve the SPA and proxy `/api/*` to the backend from the **same origin**
   (the CloudFront distribution in `infrastructure/lib/frontend-stack.ts` already does this). Auth uses
   **httpOnly cookies**, which only work reliably same-origin over **HTTPS**. Set `VITE_API_URL=/api`
   (relative) for the production build so the SPA calls its own origin.
2. **HTTPS everywhere.** Auth cookies are `Secure` + `SameSite` in production; without TLS, login breaks.
3. **DB-layer RLS cutover (multi-tenant defense-in-depth).** After deploy, follow `RLS_DEPLOY_RUNBOOK.md`:
   create a **NOBYPASSRLS, non-owner `app_runtime`** Postgres role and point the runtime `DATABASE_URL` at it
   (keep the owner/migration URL separate). Until then tenant isolation is application-layer only.
4. **Run migrations** with `prisma migrate deploy` (includes the `20260603_rls_enable_policies` +
   `20260604_enforce_rls` migrations).

---

## 1. Secrets you generate yourself (no third party) — 🔴 REQUIRED

| Variable | What | How to generate |
|---|---|---|
| `JWT_SECRET` | Signs access tokens | `openssl rand -base64 32` |
| `JWT_REFRESH_SECRET` | Signs refresh tokens (use a **different** value) | `openssl rand -base64 32` |
| `ENCRYPTION_KEY` | AES-256-GCM key for credential/2FA/BYOK encryption-at-rest (must be **64 hex chars**) | `openssl rand -hex 32` |
| `ATTESTATION_SECRET` ⚪ | Physical-AI device attestation HMAC | `openssl rand -hex 32` |
| `WEBRTC_TURN_SECRET` ⚪ | TURN credential generation | `openssl rand -hex 32` |

Also set the non-secret core server vars:
- `NODE_ENV=production` 🔴
- `PORT=3001` (or your platform's port) ⚪
- `API_URL=https://api.yourdomain.com` 🔴 (public base URL of the backend)
- `CLIENT_URL=https://app.yourdomain.com` 🔴 (frontend URL — used for CORS + email links)
- `CORS_ORIGIN=https://app.yourdomain.com` 🔴 (comma-separated allowlist of allowed browser origins)
- `VITE_API_URL=/api` 🔴 (frontend build-time API base; relative = same-origin = cookies work)

---

## 2. Database — PostgreSQL / Supabase — 🔴 REQUIRED

`DATABASE_URL` (and optional `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`).

**Option A — Supabase (recommended, managed):**
1. Go to <https://supabase.com/dashboard> → **New project** (choose a region near your users; set a strong DB password).
2. **Settings → Database → Connection string → URI**. Copy it. Use the **Connection Pooler** (port `6543`) URL
   for the app runtime; use the **direct** (port `5432`) URL for migrations.
3. Set `DATABASE_URL="postgresql://postgres.<ref>:<password>@<host>.pooler.supabase.com:6543/postgres"`.
4. (Optional, for the frontend Supabase SDK) **Settings → API**: copy the **Project URL** → `VITE_SUPABASE_URL`
   and the **anon public** key → `VITE_SUPABASE_ANON_KEY`.
5. Create the least-privilege `app_runtime` role per `RLS_DEPLOY_RUNBOOK.md` and point the runtime URL at it.

**Option B — AWS RDS Postgres:** create a Postgres 16 instance (private subnet, not publicly accessible),
then `DATABASE_URL="postgresql://<user>:<pass>@<rds-endpoint>:5432/complyeasy?schema=public"`.

`DB_POOL_SIZE` (default 10) / `DB_POOL_TIMEOUT` (default 20s) — tune for your instance. ⚪

---

## 3. Redis — cache & job queue — 🔴 REQUIRED (for sessions, rate-limit store, BullMQ jobs)

`REDIS_URL` (preferred) or `REDIS_HOST`.
- **AWS ElastiCache (Redis/Valkey):** create a cluster in the same VPC; `REDIS_URL=rediss://<endpoint>:6379`
  (use `rediss://` for TLS in transit).
- **Upstash (serverless):** <https://upstash.com> → Create database → copy the `redis://`/`rediss://` URL.
- **Self-hosted:** `REDIS_URL=redis://<host>:6379` (require AUTH + TLS in prod).

---

## 4. Google Gemini AI — 🔴 REQUIRED (powers the AI compliance copilot)

`GEMINI_API_KEY` (backend-only — never exposed to the frontend).
1. Go to **Google AI Studio** → <https://aistudio.google.com/app/apikey> (or `https://makersuite.google.com/app/apikey`).
2. Sign in with a Google account → **Create API key** → choose/create a Google Cloud project.
3. Copy the key (`AIza…`) → `GEMINI_API_KEY`.
4. **Enable billing** on the linked GCP project (the free tier is `0` quota for many models — see the prior
   "quota exceeded" issue) at <https://console.cloud.google.com/billing>. Set usage quotas/alerts.

---

## 5. SendGrid — transactional email — 🔴 REQUIRED (magic-link login, notifications, invites)

`SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `SENDGRID_FROM_NAME`.
1. Create an account at <https://sendgrid.com> → verify your account.
2. **Settings → Sender Authentication → Authenticate Your Domain** (add the DKIM/SPF CNAME records to your DNS).
   This is required for deliverability and to send from `@yourdomain.com`.
3. **Settings → API Keys → Create API Key** → "Restricted Access" with **Mail Send** permission → copy
   (`SG.…`) → `SENDGRID_API_KEY`.
4. `SENDGRID_FROM_EMAIL=noreply@yourdomain.com` (a verified sender on the authenticated domain),
   `SENDGRID_FROM_NAME="ComplyEasy AI"`.

---

## 6. Stripe — billing & subscriptions — 🔴 REQUIRED (paid tiers / checkout / webhooks)

Keys: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, plus the **Price IDs**.
1. Create an account at <https://dashboard.stripe.com>. Toggle **Test mode** for staging, **Live mode** for prod.
2. **Developers → API keys**: copy **Secret key** (`sk_live_…`) → `STRIPE_SECRET_KEY`; **Publishable key**
   (`pk_live_…`) → `STRIPE_PUBLISHABLE_KEY`.
3. **Products** → create your plans (Foundation / Essentials / Growth / Visionary, monthly + annual, plus
   add-ons). For each Price, copy the `price_…` id into the matching var:
   - 🔴 `STRIPE_BASIC_PRICE_ID`, `STRIPE_PRO_PRICE_ID`, `STRIPE_ENTERPRISE_PRICE_ID`
   - ⚪ tier/annual: `STRIPE_FOUNDATION_MONTHLY_PRICE_ID`, `STRIPE_FOUNDATION_ANNUAL_PRICE_ID`,
     `…ESSENTIALS…`, `…GROWTH…`, `…VISIONARY…` (monthly + annual each)
   - ⚪ add-ons: `STRIPE_ADDON_VCISO_PRICE_ID`, `STRIPE_ADDON_CUSTOM_FRAMEWORKS_PRICE_ID`,
     `STRIPE_ADDON_AUDIT_BUNDLING_PRICE_ID`, `STRIPE_ADDON_CUSTOM_AI_PRICE_ID`, `STRIPE_ADDON_ON_PREM_PRICE_ID`
4. **Developers → Webhooks → Add endpoint**: URL `https://api.yourdomain.com/api/billing/webhook` (verify the
   exact path in `server/src/routes`), select the events the app handles (`checkout.session.completed`,
   `customer.subscription.updated|deleted`, `invoice.payment_succeeded|failed`). Copy the **Signing secret**
   (`whsec_…`) → `STRIPE_WEBHOOK_SECRET`.

---

## 7. AWS — S3 evidence storage (+ deploy infra) — 🔴 REQUIRED (file/evidence uploads)

`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET` (+ optional `AWS_ACCOUNT_ID`,
`SCAN_TEMP_BUCKET`).
1. **Create the bucket:** AWS Console → S3 → Create bucket (e.g. `your-complyeasy-evidence`), **Block all
   public access ON**, default encryption **SSE-S3/KMS**, versioning on. Optionally `your-complyeasy-scan-temp`
   for `SCAN_TEMP_BUCKET`.
2. **Create a least-privilege IAM user/role:** IAM → Users → Create user → attach an inline policy granting
   only `s3:GetObject/PutObject/DeleteObject/ListBucket` on **those buckets** (do **not** use
   `AmazonS3FullAccess`). For deploys, prefer an **IAM role + OIDC** over long-lived keys.
3. **Create access key:** IAM → the user → Security credentials → Create access key →
   `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`. `AWS_REGION=us-east-1` (match the bucket).
   `AWS_ACCOUNT_ID` (12-digit) is used by the CDK deploy.
4. **Production deploy:** the GitHub Actions `Deploy to Production` job needs AWS credentials configured as
   **repo secrets / OIDC** (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, or an OIDC role ARN). Without them
   the deploy job fails at *Configure AWS credentials* — this is the one remaining red CI job and is purely an
   ops prerequisite, not a code defect.

---

## 8. OpenAI (Whisper transcription) — 🟡 RECOMMENDED (audio/video evidence transcription)

`OPENAI_API_KEY`.
1. <https://platform.openai.com/api-keys> → sign in → **Create new secret key** → copy (`sk-…`).
2. Add a payment method + usage limits at <https://platform.openai.com/account/billing>.

---

## 9. SSO / OAuth integrations — 🟡 RECOMMENDED (enterprise login & tool integrations)

Each uses `*_CLIENT_ID` + `*_CLIENT_SECRET` (+ a callback URL — set the production HTTPS URL, not localhost).

**Google OAuth** (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`):
1. <https://console.cloud.google.com/apis/credentials> → Create credentials → **OAuth client ID** → Web app.
2. Add authorized redirect URI `https://api.yourdomain.com/api/integrations/google/callback`.
3. Copy client id/secret. (Optional GCP extras: `GOOGLE_VISION_API_KEY` for image analysis,
   `GOOGLE_APPLICATION_CREDENTIALS` service-account JSON, `GCP_PROJECT_ID`.)

**GitHub** (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_CALLBACK_URL`, `GITHUB_TOKEN`,
`GITHUB_WEBHOOK_SECRET`):
1. <https://github.com/settings/developers> → **OAuth Apps → New OAuth App**; callback
   `https://api.yourdomain.com/api/integrations/github/callback`.
2. `GITHUB_TOKEN` = a fine-scoped **Personal Access Token** (repo read for Compliance-as-Code).
   `GITHUB_WEBHOOK_SECRET` = `openssl rand -hex 32` (set the same value on the repo webhook).

**GitLab** (`GITLAB_TOKEN`): GitLab → Settings → Access Tokens → create a `read_api`/`read_repository` token.

**Slack** (`SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET`, `SLACK_CALLBACK_URL`, `SLACK_DEFAULT_CHANNEL`):
1. <https://api.slack.com/apps> → Create New App → add OAuth redirect
   `https://api.yourdomain.com/api/integrations/slack/callback` and the bot scopes you need
   (`chat:write`, `channels:read`). Copy client id/secret from **Basic Information**.

**Jira / Atlassian** (`JIRA_CLIENT_ID`, `JIRA_CLIENT_SECRET`, `JIRA_CALLBACK_URL`):
1. <https://developer.atlassian.com/console/myapps/> → Create app (OAuth 2.0 3LO) → add callback
   `https://api.yourdomain.com/api/integrations/jira/callback` → copy client id/secret.

---

## 10. Notifications — 🟡 RECOMMENDED

**Twilio SMS** (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`):
1. <https://console.twilio.com> → copy **Account SID** + **Auth Token** from the dashboard.
2. **Phone Numbers → Buy a number** (SMS-capable) → `TWILIO_PHONE_NUMBER=+1…` (E.164 format).
   (`TWILIO_TURN_URL` ⚪ if you use Twilio's TURN service for WebRTC.)

---

## 11. Monitoring & observability — 🟡 RECOMMENDED

**Sentry** (`SENTRY_DSN`, `SENTRY_ENABLED=true`, `SENTRY_TRACES_SAMPLE_RATE`, `SENTRY_PROFILES_SAMPLE_RATE`):
1. <https://sentry.io> → create a project (Node) → **Settings → Client Keys (DSN)** → copy DSN → `SENTRY_DSN`.

**Elastic APM** (`ELASTIC_APM_SERVER_URL`, `ELASTIC_APM_SECRET_TOKEN` **or** `ELASTIC_APM_API_KEY`,
`APM_ENABLED=true`): from your Elastic Cloud deployment → APM → copy the server URL + secret token/API key.

**Elasticsearch logs** (`ELASTICSEARCH_URL`, `ELASTICSEARCH_USERNAME`, `ELASTICSEARCH_PASSWORD`,
`ELASTICSEARCH_ENABLED=true`): from Elastic Cloud → Deployment → copy endpoint + a logs-writer user.

**New Relic** (`NEW_RELIC_LICENSE_KEY`): New Relic → API keys → copy the **Ingest - License** key.

---

## 12. Security scanning — ⚪ OPTIONAL

- **VirusTotal** (`VIRUSTOTAL_API_KEY`, `VIRUS_SCAN_METHOD=virustotal`): <https://www.virustotal.com> →
  account → API key. (Default `VIRUS_SCAN_METHOD=clamav` uses a local ClamAV daemon at `CLAMAV_HOST`.)
- **AbuseIPDB** (`ABUSEIPDB_API_KEY`): <https://www.abuseipdb.com/account/api> → create key (IP reputation).
- **NVD** (`NVD_API_KEY`): <https://nvd.nist.gov/developers/request-an-api-key> (higher CVE rate limits).

---

## 13. Blockchain anchoring (compliance evidence on-chain) — ⚪ OPTIONAL

`ETHEREUM_RPC_URL` (Infura <https://infura.io> or Alchemy <https://alchemy.com> → create app → copy HTTPS
endpoint), `BLOCKCHAIN_PRIVATE_KEY` (a **dedicated** deployer wallet's key — fund minimally, never reuse a
personal wallet), `COMPLIANCE_CONTRACT_ADDRESS` / `COMPLIANCE_REGISTRY_ADDRESS` (set after deploying the
contracts), `ETHERSCAN_API_KEY` (<https://etherscan.io/myapikey> for verification), plus the
Polygon/Mumbai/Goerli equivalents and `ADMIN_ADDRESSES`/`AUDITOR_ADDRESSES`/`OPERATOR_ADDRESSES`.
> ⚠️ Per the ZK/contract audit, on-chain anchoring + ZK proofs require a real multi-party trusted-setup
> ceremony before they're trustworthy; treat as experimental until then.

---

## 14. Other advanced/enterprise integrations — ⚪ OPTIONAL

| Feature | Variables | Where to get |
|---|---|---|
| **Hyperledger Fabric** | `HYPERLEDGER_*` (peer endpoint, channel, chaincode, MSP, wallet, TLS certs/keys) | Your Fabric network admin / org CA. |
| **LDAP / Active Directory** | `LDAP_URL`, `LDAP_BASE_DN`, `LDAP_BIND_DN`, `LDAP_BIND_PASSWORD`, `LDAP_USE_TLS=true` | Your directory admin; use a read-only bind account + LDAPS. |
| **WebRTC (VR review)** | `WEBRTC_SIGNALING_SERVER`, `WEBRTC_STUN_SERVERS`, `WEBRTC_TURN_URL`, `TURN_USERNAME`, `TURN_CREDENTIAL`, `WEBRTC_TURN_SECRET` | A TURN/STUN provider (coturn self-host, Twilio NTS, Xirsys, Cloudflare). |
| **MQTT (Physical AI/IoT)** | `MQTT_BROKER_URL`, `MQTT_USERNAME`, `MQTT_PASSWORD` | Your MQTT broker (EMQX, HiveMQ, AWS IoT). |
| **OPA (policy engine)** | `OPA_ENDPOINT`, `OPA_AUTH_TOKEN` | Your deployed OPA server. |
| **HashiCorp Vault** | `VAULT_ADDR`, `VAULT_TOKEN` | Your Vault cluster (prefer Vault over raw env for all secrets). |
| **pyannote diarization** | `PYANNOTE_SERVICE_URL` | Self-hosted pyannote.audio service. |
| **EU AI Act DB** | `EU_AI_DB_API_BASE_URL`, `EU_AI_DB_CLIENT_ID`, `EU_AI_DB_CLIENT_SECRET`, `EU_AI_DB_ORG_ID` | EU AI Act database provider. |
| **MDM** | `MDM_PROVIDER_URL` | Jamf / Intune / your MDM API endpoint. |
| **Firmware registry** | `FIRMWARE_REGISTRY_URL` | Your firmware artifact registry. |
| **NTP / Timestamping** | `NTP_SERVER`, `TSA_URL` | Defaults (`pool.ntp.org`, DigiCert TSA) are fine for most. |
| **Multi-region** | `DEPLOY_REGION`, `US_EAST_*`, `EU_CENTRAL_*`, `AP_*_*` (per-region API/DB/Redis/S3) | One set per region you deploy to. |
| **Mobile app** | `EXPO_PUBLIC_API_URL` | Your production API base for the React Native build. |

---

## 15. Minimal production `.env` to "turn the app on" (the 🔴 set)

These are the variables without which the app won't start or a core flow (auth, DB, AI, email, billing,
file upload) is broken. Fill real values; keep this in your **secret manager**, not in git.

```dotenv
# Core
NODE_ENV=production
API_URL=https://api.yourdomain.com
CLIENT_URL=https://app.yourdomain.com
CORS_ORIGIN=https://app.yourdomain.com
VITE_API_URL=/api

# Database + cache
DATABASE_URL=postgresql://app_runtime:<pass>@<host>:6543/postgres?schema=public
REDIS_URL=rediss://<host>:6379

# Generated secrets (openssl)
JWT_SECRET=<openssl rand -base64 32>
JWT_REFRESH_SECRET=<openssl rand -base64 32 — different>
ENCRYPTION_KEY=<openssl rand -hex 32 — 64 hex chars>

# AI
GEMINI_API_KEY=AIza...

# Email
SENDGRID_API_KEY=SG....
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=ComplyEasy AI

# Billing
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_BASIC_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_ENTERPRISE_PRICE_ID=price_...

# File storage (S3)
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-complyeasy-evidence
```

---

## 16. Pre-launch checklist

- [ ] All 🔴 variables set in the secret manager (not committed); rotate any key ever committed.
- [ ] `prisma migrate deploy` applied; RLS role cutover done per `RLS_DEPLOY_RUNBOOK.md`.
- [ ] HTTPS + same-origin `/api` proxy (CloudFront) live; `VITE_API_URL=/api` in the production build.
- [ ] Stripe webhook endpoint reachable + `whsec_` set; SendGrid domain authenticated.
- [ ] Gemini (and OpenAI if used) billing enabled with quota alerts.
- [ ] AWS deploy credentials/OIDC configured in CI (clears the `Deploy to Production` job).
- [ ] Sentry/APM enabled; rate-limit + CORS origins set to your real domains.
- [ ] Smoke-test in prod: register → login → upload evidence → AI copilot → create a paid subscription.
