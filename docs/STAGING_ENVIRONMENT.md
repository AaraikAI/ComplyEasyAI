# Staging environment: deploy → full E2E → production gate

**Flow on `main`** (once staging is provisioned):

```
docker / scan / sign ──► Deploy to Staging ──► E2E Tests (staging) ──► Approve Production Deploy ──► Deploy to Production
                          (DB reset + push)      (full suite, ~1,100 tests)     (blocked if staging E2E fails)
```

Until the staging secrets exist, `Check staging config` reports
`configured=false`, the two staging jobs are skipped, and the production
approval behaves exactly as before. The pipeline change is therefore safe to
merge ahead of the infrastructure.

## What exists today

Nothing. No `staging` GitHub environment, no staging secrets, no
`staging.complyeasyai.com` DNS record, no staging Supabase project, and no
staging ECS/S3/CloudFront resources. (The previous `deploy-staging` job was
gated on a `develop` branch that is never pushed to and targeted resources that
were never created.)

Production runs on **ECS Express Mode** — not the ALB stack the CDK `BackendStack`
describes — so staging should mirror the *live* topology, not the CDK one.

## Provisioning checklist

### 1. Supabase — a separate project (recommended over a branch)

Create a project `ComplyEasyAI-staging` in `us-east-1`. Use the **session-mode
pooler** URL with the project ref in the username
(`postgres.<ref>@aws-1-us-east-1.pooler.supabase.com:5432`); the direct host is
IPv6-only and unreachable from Fargate. Capture the pooler's CA certificate as
base64 for `DB_CA_CERT`.

Why a project and not a Supabase *branch*: branches are built by replaying the
migrations directory, and the tracked migrations create 9 of the 283 tables —
the schema cannot be rebuilt from them. The pipeline instead pushes the Prisma
datamodel (`prisma db push`) into an empty schema on every deploy, which needs
a plain database it can drop and recreate.

### 2. AWS (same account/region as production)

| resource | name | notes |
|---|---|---|
| ECR repository | `complyeasy-staging-api` | the pipeline retags production's signed image into it |
| Secrets Manager secret | `complyeasy/staging` | **valid JSON**; same keys as `complyeasy/production` with staging values: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ENCRYPTION_KEY`, `REDIS_URL`, `DB_CA_CERT`, … |
| ElastiCache Redis (or any managed Redis) | `complyeasy-staging` | **required** — `config/index.ts` refuses to boot in `NODE_ENV=production` without `REDIS_URL`; a `t4g.micro`/serverless tier is enough |
| ECS Express Mode cluster + service | cluster `complyeasy-staging`, service `complyeasy-staging-api` | the task-definition family becomes `complyeasy-staging-complyeasy-staging-api`; container port 3001; X86_64; ≥ 0.5 vCPU / 1 GiB |
| task definition env | | `NODE_ENV=production`, `CORS_ORIGIN=https://staging.complyeasyai.com`, `CLIENT_URL=https://staging.complyeasyai.com`, `RATE_LIMIT_MAX_REQUESTS=100000` (the E2E suite drives one IP hard; `authLimiter` stays at 5 by design), plus the secret references above. The deploy step asserts `DATABASE_URL`, `JWT_SECRET`, `ENCRYPTION_KEY`, `REDIS_URL` are present. |
| S3 bucket | `complyeasy-staging-frontend` | private; CloudFront origin via OAC |
| CloudFront distribution | | clone production's behaviours: default → S3 with the **route-rewrite function** (see `docs/CLOUDFRONT_API_ERROR_PASSTHROUGH.md`) and **no 403/404 custom error responses**; `/api/*`, `/health`, `/ws/*` → the staging Express endpoint; the same response-headers policy |
| ACM certificate (us-east-1) | `staging.complyeasyai.com` | for the distribution |
| IAM (the CI deploy user) | | ECR push on the staging repo; `ecs:RegisterTaskDefinition`, `ecs:DescribeTaskDefinition`, `ecs:UpdateExpressGatewayService`, `ecs:DescribeExpressGatewayService` on the staging service; S3 sync + `cloudfront:CreateInvalidation` on the staging resources |

### 3. DNS (GoDaddy)

Add **one** record: `CNAME staging → <distribution>.cloudfront.net`. Do not touch
the apex — Microsoft 365 mail lives there.

### 4. GitHub

- Environment **`staging`** with no required reviewers (it deploys automatically).
- Repository **secrets**: `STAGING_SUPABASE_DATABASE_URL`, `STAGING_S3_FRONTEND_BUCKET`,
  `STAGING_CLOUDFRONT_DISTRIBUTION_ID`.
- Repository **variable**: `STAGING_BASE_URL=https://staging.complyeasyai.com`
  (defaults to that value when unset).

Secrets are snapshotted when a run is *created*: after adding them, push a
commit or use `workflow_dispatch` to get a run that can see them.

## Behaviour once configured

- **Every push to `main`** deploys to staging first. The staging database is
  dropped and re-pushed on every deploy — staging holds no durable data by
  design; it is an E2E target, not a QA sandbox.
- **The full Playwright suite** runs against `STAGING_BASE_URL`, unsharded with
  two workers (sharding would trip the hard-coded `authLimiter`). Expect roughly
  60–90 minutes; the job cap is 150.
- **Production approval is blocked** while the staging suite is red. The report
  is uploaded as the `playwright-report-staging` artifact.
- The PR-level E2E job (sharded, against a throwaway local stack) is unchanged
  and remains the fast pre-merge signal.

## Prerequisite

Real-session E2E on staging depends on the CAPTCHA fix (#465): with
`NODE_ENV=production` and no CAPTCHA secret, `auth.setup.ts`'s registration
would otherwise 503 and the suite would fall back to mock auth.

## Rough cost

Fargate Express (0.5 vCPU / 1 GiB, always on) ≈ $15–20/month; ElastiCache
`t4g.micro` ≈ $12/month; CloudFront + S3 for staging traffic well under $5;
Supabase free tier or Pro ($25/month) depending on the org's plan.
