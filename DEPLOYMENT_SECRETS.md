# Production Deployment — GitHub Secrets Checklist

> Current state: code, tests, scans, container build, container signing all GREEN in CI. The only blocker for actual production deploy is **missing GitHub secrets**. Repo currently has **0 secrets configured at any scope** (`gh api repos/AaraikAI/ComplyEasyAI/actions/secrets` → `total_count: 0`).
>
> This file lists every secret the workflows reference and where to provision it.

## How to add a secret

```bash
# Repository-level (available to all environments)
gh secret set <NAME> --body '<value>' -R AaraikAI/ComplyEasyAI

# Environment-scoped (only available when a job uses environment: production)
gh secret set <NAME> --env production --body '<value>' -R AaraikAI/ComplyEasyAI
```

The `production` and `production-approval` environments already exist; just no secrets are attached to them.

## Required for `deploy-production` (the immediate blocker)

| Secret | Used in | Source | Notes |
|--------|---------|--------|-------|
| `AWS_ACCESS_KEY_ID` | `.github/workflows/ci.yml:557` | AWS IAM — deploy user | Recommended: dedicated IAM user with ECR push + ECS update perms only. Better: switch to OIDC + `role-to-assume` (eliminates long-lived keys). |
| `AWS_SECRET_ACCESS_KEY` | `.github/workflows/ci.yml:558` | AWS IAM — deploy user | Pair with above. |
| `S3_FRONTEND_BUCKET` | `.github/workflows/scheduled-backup.yml:16` and ci.yml | AWS S3 bucket name | Bucket for compiled frontend + backups. |
| `SUPABASE_DATABASE_URL` | `scheduled-backup.yml:47`, ci.yml deploy migrations | Supabase project settings → Database → Connection string (URI mode) | `postgresql://postgres:<ROTATED-SEE-SECRETS-MANAGER>@db.wnvdmaqwlcblcrrvbjmr.supabase.co:5432/postgres?sslmode=require` |

## Required for `deploy-staging` (if used)

| Secret | Notes |
|--------|-------|
| `STAGING_AWS_ACCESS_KEY_ID` | Separate IAM user for staging |
| `STAGING_AWS_SECRET_ACCESS_KEY` | |
| `STAGING_DATABASE_URL` | Staging Supabase DB URL |
| `STAGING_S3_BUCKET` | Staging asset bucket |

## Runtime secrets (read by the container at boot)

These are pulled by the running container from AWS Secrets Manager, not from GitHub Actions — but the IAM user above must have `secretsmanager:GetSecretValue` permission on the secret ARNs. The container expects:

| Env var | Validator rule | Source |
|---------|----------------|--------|
| `DATABASE_URL` | starts with `postgresql://` | Supabase Postgres connection string |
| `JWT_SECRET` | ≥32 hex chars | Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `JWT_REFRESH_SECRET` | ≥32 hex chars | Same as above (different value) |
| `ENCRYPTION_KEY` | 32 bytes hex (64 hex chars) | Same generator. Used for AES-256-GCM at-rest encryption. |
| `SENDGRID_API_KEY` | starts with `SG.` | SendGrid → Settings → API Keys |
| `STRIPE_SECRET_KEY` | starts with `sk_` (prod: `sk_live_`) | Stripe Dashboard |
| `STRIPE_WEBHOOK_SECRET` | starts with `whsec_` | Stripe Dashboard → Webhooks → endpoint |
| `ANTHROPIC_API_KEY` | starts with `sk-ant-` | console.anthropic.com |
| `OPENAI_API_KEY` | starts with `sk-` | platform.openai.com |
| `GEMINI_API_KEY` | non-empty | Google AI Studio |
| `SENTRY_DSN` | `https://*.ingest.sentry.io/*` | Sentry project |
| `S3_BUCKET_NAME` | bucket name | AWS S3 |
| `S3_REGION` | AWS region | e.g. `us-east-1` |
| `AWS_KMS_KEY_ID` | KMS key ARN | AWS KMS — for encryption key wrapping |

The full list is in `server/.env.example`. Boot will hard-crash if any of the four critical vars (`DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ENCRYPTION_KEY`) are unset.

## Optional CI secrets

| Secret | Purpose |
|--------|---------|
| `CODECOV_TOKEN` | coverage upload |
| `SLACK_WEBHOOK_URL` | CI failure notifications |
| `GITLEAKS_LICENSE` | only if using paid GitLeaks features |

## After adding secrets

Re-run the failed deploy:

```bash
gh run rerun --failed 25650803648 -R AaraikAI/ComplyEasyAI
```

Or push a no-op commit to trigger a fresh CI:

```bash
git commit --allow-empty -m "ci: trigger deploy after secret provisioning"
git push
```

## Recommended: switch to OIDC (eliminate long-lived AWS keys)

Long-lived `AWS_ACCESS_KEY_ID` secrets are an audit anti-pattern. Recommended migration:

1. Create an OIDC identity provider for `token.actions.githubusercontent.com` in your AWS account.
2. Create an IAM role with a trust policy scoped to `repo:AaraikAI/ComplyEasyAI:ref:refs/heads/main`.
3. Replace `aws-access-key-id` / `aws-secret-access-key` with `role-to-assume: arn:aws:iam::ACCT:role/github-actions-deploy` in ci.yml.
4. Delete the IAM user + its access keys.

This eliminates two of the four blocking secrets and is the standard for 2026-era CI.
