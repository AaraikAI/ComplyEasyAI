# ComplyEasyAI

> Continuous-evidence GRC platform for 14 compliance frameworks. One platform replaces the audit-management + SBOM + evidence-collection + vendor-risk + framework-mapping stack that mid-market teams typically stitch from 4-6 tools.

[![Production Readiness](https://img.shields.io/badge/production_readiness-97.51%25-brightgreen)](./PRODUCTION_READINESS_REPORT.md)
[![TypeScript](https://img.shields.io/badge/types-strict-blue)](./tsconfig.json)
[![License](https://img.shields.io/badge/license-Proprietary-red)](#license)

---

## What it does

Maps customer evidence to framework controls, runs the audit lifecycle (scoping → controls → evidence → findings → remediation → attestation), and ships continuously.

**Frameworks covered:** SOC 2, ISO 27001, HIPAA, PCI-DSS v4.0, NIST CSF 2.0, NIST 800-53, GDPR, CCPA, FedRAMP (roadmap), HITRUST (roadmap), EU AI Act, DORA, NIS2, CSRD/ESRS.

**Continuous evidence from 30+ integrations:** AWS, Azure, GCP, Okta, GitHub, Snyk, Datadog, Jira, Slack, Salesforce, and more.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  React + Vite   │───▶│  Express 5 API   │───▶│  PostgreSQL 17   │
│  (TypeScript)   │    │  + Prisma 7      │    │  (Supabase / RDS)│
└─────────────────┘    └──────────────────┘    └──────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
  React Native             89 services             RLS-scoped tables
  (mobile evidence       (one per domain)         (multi-tenant)
   capture)
```

Top-level layout:

| Path | Contents |
|------|----------|
| `App.tsx`, `components/`, `contexts/`, `hooks/`, `services/api.ts` | Frontend (React 18 + Vite) |
| `mobile/` | React Native app (Expo) |
| `server/` | Express 5 + Prisma 7 backend |
| `server/src/services/` | 89 domain services (HIPAA, PCI-DSS, SOC 2, NIST CSF, ISO 27001, ESG, SBOM, vendor risk, integrations, etc.) |
| `server/src/controllers/` | HTTP controllers — errors flow via `throw new AppError` to global handler |
| `server/src/routes/` | 70 mounted route modules, all `apiLimiter`-protected |
| `server/prisma/schema.prisma` | Source-of-truth schema (~7200 lines, ~250 models) |
| `e2e/` | Playwright critical-path tests |
| `.archive/audit-history/` | Superseded production-readiness artifacts |

## Local development

**Prerequisites:** Node.js 22 LTS, PostgreSQL 17 (or use Supabase), Redis (optional, for queue).

### 1. Install

```bash
npm install                 # root (frontend + tooling)
cd server && npm install    # backend
cd ../e2e && npm install    # e2e suite (optional)
```

### 2. Configure secrets

```bash
cp server/.env.example server/.env
cp .env.example .env.local         # frontend
```

Required env vars are documented in `server/.env.example` and validated at startup. Critical: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ENCRYPTION_KEY` — startup crashes if any are missing.

### 3. Database

```bash
cd server
npx prisma generate
npx prisma migrate dev      # local dev
# or for production:
npx prisma migrate deploy
```

### 4. Run

```bash
# Terminal 1 — backend
cd server && npm run dev

# Terminal 2 — frontend
npm run dev                 # localhost:3000

# Terminal 3 — mobile (optional)
cd mobile && npm start
```

## Quality gates

| Check | Command | Status |
|-------|---------|--------|
| Server type-check | `cd server && npx tsc --noEmit` | clean |
| Frontend type-check | `npx tsc --noEmit` | clean |
| Server unit tests | `cd server && npm test` | passing |
| E2E smoke | `npm run e2e` | passing |
| `npm audit` (frontend) | `npm audit` | 0 vulns |
| `npm audit` (server) | `cd server && npm audit` | 5 documented upstream — see `SECURITY.md` |

## Security

See [`SECURITY.md`](./SECURITY.md) for:

- Disclosure process (`security@aaraik.ai`)
- Cryptography inventory (PBKDF2-SHA256 600k, AES-256-GCM, TLS 1.2+)
- 5 unfixable upstream vulnerabilities with exploit profiles
- Auth posture (JWT in httpOnly cookies, SAML signature verification, SSRF protection)

## Documentation index

| Document | Purpose |
|----------|---------|
| [`PRODUCTION_READINESS_REPORT.md`](./PRODUCTION_READINESS_REPORT.md) | v16 canonical audit (97.51%) |
| [`SECURITY.md`](./SECURITY.md) | Security posture + vuln disclosure |
| [`FEATURES.md`](./FEATURES.md) | Feature inventory (531+ across 33 categories) |
| [`SIG.md`](./SIG.md) | Standardized Information Gathering questionnaire (pre-filled) |
| [`CAIQ.md`](./CAIQ.md) | CSA Cloud Controls Matrix questionnaire (pre-filled) |
| [`DILIGENCE_QA.md`](./DILIGENCE_QA.md) | 50 likely diligence questions + answers |
| [`FOUNDER_NARRATIVE.md`](./FOUNDER_NARRATIVE.md) | Solo-founder thesis + technical decision log |
| [`legal/DPA_TEMPLATE.md`](./legal/DPA_TEMPLATE.md) | GDPR Art. 28 Data Processing Agreement |
| `server/README.md` | Backend deep-dive |
| `e2e/README.md` | E2E test guide |

## Multi-tenant guarantees

Every user-scoped query filters by `organizationId` at the **service layer** — not middleware. Verified across all 89 service files (v11 audit). Parent-child entity scope is enforced on writes (v11 audit). PostgreSQL RLS is enabled on the 25 new compliance-workflow tables for defense-in-depth against the auto-exposed Supabase REST API.

## Contributing

Branch protection on `main` requires:
- Reviewed PR
- Passing CI (lint, type-check, unit, e2e smoke, container scan, SBOM)
- Signed commits

Internal commit-message style: `feat(scope): …` / `fix(scope): …` / `chore(scope): …`. See recent `git log` for examples.

## License

Proprietary — © AARAIK LLC. All rights reserved. Contact `legal@aaraik.ai` for licensing.

## Status

- **Production readiness:** 97.51% (v16, reconciled 2026-04-02)
- **Design partners:** 5 (3 active, 2 pipeline) across US fintech, US health-tech, EU SaaS
- **Active frameworks:** 14 (each with a dedicated workflow service)
- **Codebase:** 1.18M LOC, monorepo (frontend + mobile + server + e2e + contracts + scripts)
