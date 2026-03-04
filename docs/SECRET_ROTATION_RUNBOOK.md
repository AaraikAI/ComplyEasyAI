# Secret Rotation Runbook

> **CRITICAL:** The file `server/.env` was historically committed to git (commit `bb836ab`).
> All secrets from that file MUST be rotated before production launch.

---

## Secrets Requiring Rotation

The following secrets were exposed in the git history and **must be regenerated**:

| Secret | Where to Rotate | Impact |
|--------|----------------|--------|
| `JWT_SECRET` | AWS Secrets Manager → `complyeasy-production/app-secrets` | All existing sessions invalidated |
| `JWT_REFRESH_SECRET` | AWS Secrets Manager → `complyeasy-production/app-secrets` | All refresh tokens invalidated |
| `ENCRYPTION_KEY` | AWS Secrets Manager → `complyeasy-production/app-secrets` | Re-encrypt any data encrypted with old key |
| `DATABASE_URL` | Supabase Dashboard → Database Settings → Connection String | Reset DB password first |
| `GEMINI_API_KEY` | Google AI Studio → API Keys | Revoke old key |
| `OPENAI_API_KEY` | OpenAI Dashboard → API Keys | Revoke old key |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API Keys | Roll to new key |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Developers → Webhooks | Update webhook endpoint |
| `SENDGRID_API_KEY` | SendGrid Dashboard → Settings → API Keys | Revoke old key |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | AWS IAM Console | Rotate IAM credentials |
| `REDIS_URL` | ElastiCache → Modify → Auth Token | Update Redis AUTH |

---

## Rotation Procedure

### Step 1: Generate New Secrets

```bash
# Generate new JWT secrets (minimum 32 characters)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate new encryption key (exactly 32 bytes for AES-256)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 2: Update AWS Secrets Manager

```bash
# Update all secrets atomically
aws secretsmanager put-secret-value \
  --secret-id complyeasy-production/app-secrets \
  --secret-string '{
    "JWT_SECRET": "<new-jwt-secret>",
    "JWT_REFRESH_SECRET": "<new-refresh-secret>",
    "ENCRYPTION_KEY": "<new-encryption-key>",
    "DATABASE_URL": "<new-database-url>",
    "GEMINI_API_KEY": "<new-gemini-key>",
    "SENDGRID_API_KEY": "<new-sendgrid-key>",
    "STRIPE_SECRET_KEY": "<new-stripe-key>",
    "STRIPE_WEBHOOK_SECRET": "<new-webhook-secret>",
    "SENDGRID_FROM_EMAIL": "noreply@complyeasyai.com"
  }'
```

### Step 3: Rotate External Service Keys

1. **Supabase:** Dashboard → Database Settings → Reset database password
2. **Stripe:** Dashboard → Developers → Roll API key (this creates new key + deactivates old)
3. **SendGrid:** Dashboard → Settings → API Keys → Create & Revoke
4. **Google AI:** Google AI Studio → Revoke old key, create new
5. **AWS IAM:** Rotate access keys (create new → update secrets → delete old)

### Step 4: Deploy Updated Secrets

```bash
# Force new deployment to pick up rotated secrets
aws ecs update-service \
  --cluster complyeasy-production \
  --service complyeasy-production-api \
  --force-new-deployment

# Wait for stability
aws ecs wait services-stable \
  --cluster complyeasy-production \
  --services complyeasy-production-api

# Verify health
curl -s https://complyeasyai.com/health | jq .status
```

### Step 5: Verify & Clean Up

```bash
# Verify all endpoints work with new secrets
curl -s https://complyeasyai.com/health
curl -s https://complyeasyai.com/api/csrf-token

# Verify old keys no longer work (test externally if possible)
# Remove the old .env from git history using BFG or git-filter-repo:
# bfg --delete-files .env --no-blob-protection
# Or: git filter-repo --path server/.env --invert-paths
```

---

## Post-Rotation Checklist

- [ ] All secrets regenerated with cryptographically secure random values
- [ ] AWS Secrets Manager updated with new values
- [ ] External API keys rotated (Stripe, SendGrid, Google AI, etc.)
- [ ] Supabase database password changed
- [ ] ECS deployment triggered with new secrets
- [ ] Health check passing
- [ ] Authentication flow tested (magic link + password login)
- [ ] Stripe webhook verified
- [ ] Email sending verified
- [ ] Old API keys revoked/deleted on external services
- [ ] Git history cleaned (optional but recommended)
- [ ] Incident documented in security log
