# ComplyEasyAI Backend

Express 5 + Prisma 7 + PostgreSQL 17. Handles 14 compliance frameworks via 89 domain-specific services, exposes 70 mounted `/api/*` routes, all `apiLimiter`-protected.

See the [root README](../README.md) for product context. This file documents the backend specifically.

---

## Quick start

```bash
npm install
cp .env.example .env             # edit, then:
npx prisma generate
npx prisma migrate dev           # local
npm run dev                      # http://localhost:8000
```

Required env vars (validated at boot — startup crashes on missing):

- `DATABASE_URL` — PostgreSQL connection
- `JWT_SECRET`, `JWT_REFRESH_SECRET` — 32+ char hex
- `ENCRYPTION_KEY` — 32 bytes hex (AES-256-GCM)
- `SENDGRID_API_KEY` — must start with `SG.`
- `STRIPE_SECRET_KEY` (production), `STRIPE_WEBHOOK_SECRET`
- `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` — at least one for AI features

See `.env.example` for the full surface.

## Layout

```
src/
  config/              env, logger, database, redis
  controllers/         HTTP handlers — errors via `throw new AppError`
  middleware/          auth, rate-limit, validate, CSRF, error-handler
  routes/              70 route modules, mounted in index.ts
  services/            89 domain services (HIPAA, PCI-DSS, SOC 2, NIST CSF,
                       ISO 27001, ESG, SBOM, vendor risk, integrations, etc.)
  validators/          Joi schemas
  utils/               logger, errors, AuditLogger, crypto helpers
  __tests__/           unit + integration tests (Jest)
prisma/
  schema.prisma        source of truth (~7200 lines, ~250 models)
  migrations/          ordered SQL migrations
scripts/               setup-oauth, validate-env, patch-express-types, etc.
contracts/             Solidity audit-log immutability contracts (optional)
```

## What's implemented

**Authentication**
- JWT in httpOnly cookies (Secure + SameSite=Strict + refresh-token rotation)
- PBKDF2-SHA256, 600k iterations (OWASP 2023+)
- SAML 2.0 SSO with `xml-crypto` signature verification
- SCIM 2.0 user provisioning with dedicated rate limiter
- TOTP/WebAuthn 2FA (full unit-tested controller surface)
- Magic-link passwordless option

**Multi-tenant**
- Organization-scoped queries at the service layer (verified across 89 files in v11 audit)
- Parent-child entity scope enforced on writes
- PostgreSQL RLS enabled on 25 compliance-workflow tables (defense-in-depth against the Supabase auto-exposed REST API; app uses direct Prisma connection)

**Compliance workflow services (14 frameworks)**
- `hipaaService` — PHI inventory, BAA tracking, 45 CFR §164.402(2) four-factor breach analysis
- `iso27001Service` — Assessment, SoA, Risk Treatment, Corrective Actions
- `pciDssService` — Scope/CDE, requirements, evidence, QSA findings, CCW, ROC, AOC
- `soc2Service` — Type I/II engagements, controls, AICPA sampling, exceptions, CUECs
- `nistCsfService` — Profiles (Current/Target), 84 subcategories, gap analysis, action items
- `aiRmfService` — NIST AI RMF actors/assessments
- `doraService`, `euRegulationsService` — DORA, NIS2, EU AI Act, GDPR, CSRD/ESRS

**Cross-cutting**
- SSRF protection via `isUrlSafe()` (private-IP block + DNS rebind defense)
- ReDoS protection via `safeRegexTest` (re2-backed, linear-time)
- AES-256-GCM at-rest encryption for OAuth tokens, integration secrets, webhook secrets
- 70/70 mounted routes have rate limiting (auth/SSO/SCIM have mode-specific limiters)
- Centralized error handler routes `AppError` → Sentry + Winston with consistent envelope
- Webhook signature verification (HMAC) on Stripe + outbound integrations

**Integrations** (`services/integrations/`)
- AWS, Azure, GCP cloud inventory + posture
- Okta, Azure AD SCIM provisioning
- GitHub, Snyk, Trivy SBOM + vuln ingestion
- Slack/MS Teams notifications
- Jira/Linear ticketing sync
- Stripe billing + subscription tiers

**Observability**
- Winston JSON → Elasticsearch transport
- Sentry conditional on `SENTRY_ENABLED`
- Audit log (`AuditLogger`) for every state-changing service call
- WebSocket broadcast (`realTimeComplianceService`) for live compliance events

## Quality

```bash
npm run typecheck     # tsc --noEmit (must be clean)
npm test              # Jest unit + integration
npm run lint          # ESLint (0 errors required)
npm audit             # 5 documented upstream-only vulns (see ../SECURITY.md)
```

CI gate runs all four on every PR.

## Adding a new framework workflow service

Follow the canonical pattern (e.g. `pciDssService.ts`):

1. **Prisma models** — add to `prisma/schema.prisma`, scoped by `organizationId`, with `@@index([organizationId])` and `ON DELETE CASCADE`.
2. **SQL migration** — create `prisma/migrations/<name>_workflow.sql` with `CREATE TABLE IF NOT EXISTS`.
3. **Service** — `services/<name>Service.ts`. Every method takes `organizationId`, filters the actual Prisma query by it (not just precheck), uses `AppError` + `logger`, wraps multi-step writes in `prisma.$transaction`, calls `AuditLogger.log` after meaningful writes.
4. **Validators** — `validators/<name>Schemas.ts` (Joi).
5. **Routes** — `routes/<name>.ts`, `authenticate` + `authAsyncHandler` + body/query validation.
6. **Wire** — import + mount in `src/index.ts` with `apiLimiter`.
7. **Migrate** — `npx prisma migrate deploy` (or apply via Supabase MCP for hosted DB).
8. **Enable RLS** on new tables if Supabase-hosted.

## Useful scripts

```bash
npm run db:seed                  # seed reference framework catalog
npm run setup:oauth              # interactive OAuth app creation
npm run validate:env             # check env contract before deploy
npm run test:e2e                 # integration tests
npm run test:performance         # k6 / artillery profiles
```

See `scripts/README.md` for the full list.

## Deployment

Container builds via `Dockerfile`. Production runs on AWS ECS Fargate with:
- RDS PostgreSQL 17 (PITR, encrypted, 35-day backups)
- S3 evidence bucket (KMS, versioned)
- ALB + WAF + CloudFront
- Secrets Manager for runtime secrets

See `../docs/DEPLOYMENT_RUNBOOK.md` if present, or contact `ops@aaraik.ai`.

## Reporting issues

- Security: `security@aaraik.ai` (see `../SECURITY.md`)
- Bugs / features: GitHub Issues on `AaraikAI/ComplyEasyAI`
