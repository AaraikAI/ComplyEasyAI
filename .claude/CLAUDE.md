# ComplyEasyAI — Claude Code Instructions

## Production-Readiness Audit Methodology (Findings-Driven — corrected 2026-05-31)

> **The v20.x multi-session ledger / queue / gate apparatus has been RETIRED.**
> It was archived to `.archive/audit-history/retired-v20-machinery-20260531/`.
> Do NOT resurrect it. Audits are **findings-driven**, not grep-count-driven.

### Why the old apparatus was retired (read this before re-inventing it)

The v20.x system claimed a deep scan required **30–50 sessions** to drain a
"Re-Do Queue" of ~16,500 "rows." That number was an **artifact of three bugs**,
not a reflection of real work:

1. **The scanner scanned machine-generated code.** `server/src/generated/` is a
   **739,290-line** auto-generated Prisma client. The master `find` in the
   scan-runner did not exclude it, so JSDoc `@example prisma.user.findMany()`
   snippets became "audit candidate rows." In the largest ledger (`l8_reads`),
   **946 of 1,366 rows (69%) pointed at this generated file.** *(Fixed: the
   scan-runner now excludes `*/generated/*`.)*
2. **Grep-hits were treated as the completion metric.** Each grep match became a
   "row" that had to reach "100% coverage," processed ~500/session by process
   design — not by any real compute limit. A contaminated denominator made the
   forecast explode. Real audits **triage**: most matches are instantly
   dismissible (generated code, enum string values, test files); effort goes to
   the actual risk surface.
3. **The drift logger was buggy.** `check_gates.sh` used an awk variable named
   `log`, which collides with awk's built-in `log()` function — it wrote 72
   junk files named `ln(row_number)` (`1.09861`, `5.52545`, …) into the repo
   root. *(Fixed: variable renamed to `outlog`.)*

### True scope of "the entire codebase"

Measured 2026-05-31 (excludes `node_modules/`, `server/src/generated/`,
`.claude/worktrees/` duplicate copies, `dist/`, `build/`, `coverage/`, `.archive/`):

| | Files | LOC |
|---|---|---|
| Production source (server, components, hooks, mobile, contexts, services, infra) | 657 | ~410k |
| Test / e2e | 523 | ~157k |
| **Entire hand-written codebase** | **1,180** | **~567k** |

The canonical deep-scan file list lives at **`.claude/deep-scan/filelist.txt`**
(regenerate with the `find` command in that directory's workflow).

### How to run a deep scan now

A full deep-read of 1,180 files is **one comprehensive parallel pass**, not
33 sessions. Fan out subagents (≈10–12 files each, ~100 batches, ~16 concurrent),
each reading its assigned files **end-to-end** and returning structured findings.
Synthesize into a single `PRODUCTION_READINESS_REPORT.md`. Exclude only
generated/vendored/duplicate code.

### Mandatory dynamic / runtime verification phases (NOT optional)

Static reads alone miss version-specific runtime breaks, dependency CVEs, type
errors, and capacity limits. A deep scan is **incomplete** until these phases run
and their results are folded into the report (no longer a "limitations" caveat):

**Phase D1 — Type check (`tsc --noEmit`).** Run in every TS package
(`server/`, root frontend, `mobile/`). Use `NODE_OPTIONS=--max-old-space-size=8192`
if it OOMs, and confirm CI sets the same. Any error = finding (HIGH if it blocks build).
```bash
cd server && npx tsc --noEmit ; cd .. && npx tsc --noEmit ; cd mobile && npx tsc --noEmit
```

**Phase D2 — Dependency audit (`npm audit`).** Run in each package with a
lockfile. Cross-reference every result against the **known-unfixable list** below —
only *new* / *fixable* advisories are findings (severity = audit severity). Never
re-flag a known-unfixable vuln.
```bash
npm audit --json ; cd server && npm audit --json
```

**Phase D3 — Runtime boot + smoke.** Actually start the server and frontend and
hit critical paths — static analysis sees `sslmode=require` in a URL and calls TLS
"configured," but `pg`/library version changes cause silent boot failures (see the
DB-config lessons below). Verify: server boots without throwing, `/health` 200,
DB connects, one authenticated request round-trips, one mutating request persists.
Boot/runtime failures are HIGH.

**Phase D4 — Load / performance.** Drive the hot read + write endpoints with a
load tool (`k6`/`autocannon`) at a realistic concurrency. Capture p95 latency,
error rate, and any rate-limiter/connection-pool exhaustion. Regressions or
unbounded-resource behavior under load = MEDIUM+.

Findings remain **static-analysis-grade until confirmed against the cited lines**;
D1–D4 are how the report graduates from "likely" to "verified."

### What to look for (real findings criteria, severity-graded)

These are the genuine production-readiness checks. Report them as **findings**
(file:line + evidence + fix), not as coverage percentages:

- **Multi-tenant isolation (HIGH):** every Prisma `create/update/delete/findMany/
  findFirst/count/aggregate` returning user-scoped data must filter by
  `organizationId` (or be preceded by an ownership check). Enforced at the
  **service layer**. Child entities must verify the **parent's** org ownership.
- **Credential encryption-at-rest (HIGH):** OAuth tokens / API keys / webhook
  secrets / SCIM tokens must be `encryptField()`'d before the DB write.
- **SSRF (MEDIUM+):** outbound `axios`/`fetch`/`got` with any user-controllable
  or parameter-overridable URL must pass `isUrlSafe()`/`isWebhookUrlSafe()`.
- **Auth guard (HIGH):** every non-public route covered by `requireAuth` /
  `authenticateJWT` at route or mount level.
- **Input validation (HIGH on mutating routes):** POST/PUT/PATCH/DELETE wired to
  `validateBody`/`validateQuery`. Auth endpoints (login/register/reset) are
  mandatory.
- **CSRF (HIGH):** mutating endpoints protected by `csrfProtection` or
  `sameSite:'strict'`. Webhook receivers with HMAC are intentionally exempt —
  **verify per-route**, never extrapolate from one mount line.
- **Webhook HMAC (HIGH):** every receiver verifies the signature first.
- **JWT algorithm pinning (HIGH):** `jwt.verify(..., { algorithms: [...] })`,
  never `'none'`.
- **Cookie flags (HIGH/MEDIUM):** `httpOnly` on auth cookies; `secure` in prod + `sameSite`.
- **Token revocation on logout/password-change (HIGH):** clearing the cookie
  alone is insufficient — revoke the jti / destroy the session.
- **PII in logs (HIGH/MEDIUM):** no `logger.X(req.body / accessToken / password /
  full req.user)`.
- **File upload limits (HIGH/MEDIUM):** multer routes need `limits.fileSize` +
  MIME `fileFilter`.
- **Background jobs (HIGH/MEDIUM):** bounded `attempts` + `backoff` + a dead-letter destination.
- **In-memory state (HIGH if critical):** security sessions / job queues /
  transaction state must be Redis/DB-backed.
- **Frontend↔backend contracts (HIGH/MEDIUM):** HTTP method + path + required-field shape must match.
- **Migration-dependency comments (HIGH):** "requires migration" comments must
  have a matching applied migration, else the feature silently fails.
- **Mocks/stubs/TODOs/incomplete impls:** real production gaps (but mind the
  known-intentional patterns below).
- **Error handling:** routes/controllers sending `res.status().json()` directly
  bypass the global error handler (Sentry).
- **Deployment config:** Dockerfile/compose fail-open `:-` defaults on
  secrets/passwords; `:latest` tags pushed to prod; missing HEALTHCHECKs;
  Node-version mismatch across CI/Docker/`engines`.

### Known-intentional patterns — do NOT flag as gaps

- **Fire-and-forget cleanup:** `.catch(() => {})` after
  `unlink/rmdir/rmSync/worker.close/disconnect/cleanup/teardown` — intentional.
- **Enum/union status literals:** `'NotImplemented'` / `'NOT_IMPLEMENTED'` as a
  *value* of a status type/enum/comparison is a compliance-control status, not
  an unimplemented marker.
- **`throw new Error()` in pure math/crypto libs:** files under
  `services/advanced/{dp,bayesian,byzantine*,scaffold*,secretSharing*,rdp*}/`
  and `utils/blockchain/anchor*` use bare `Error` for precondition guards (no
  HTTP context); `AppError` would be misleading.
- **Comment-only references:** `throw new Error(...)` inside `//` or `/* */` is documentation.

### Components that are INTENTIONALLY static (do not flag as PRODUCTION_GAP)

Reference/catalog/marketing content by design — no backend wiring needed:
- `FeatureLibrary.tsx` (FEATURE_CATALOG + localStorage), any `HelpCenter` /
  `DocumentationPage`, any `LandingPage` / `PricingPage` / marketing pages,
  `OnboardingWizard` step text, `CommunityPage.tsx`, `LearnPage.tsx`,
  `components/hubs/*` (route shells with link grids; children are wired).
- UI primitives (presentational only): `Breadcrumbs`, `Pagination`,
  `TabbedContainer`, `SkipNavLink`, `DarkModeToggle`, `ThemeToggle`, `TierCard`,
  `TierLimitBanner`, `SlimSidebar`, `Onboarding/Onboarding{Hint,Progress,TierBadge}`.

### Components that LOOK static but ARE wired (do not flag)

Wired through hooks/services (a raw-`api.*`/`fetch` grep misses these):
- `HomeOS.tsx` → `useExecutiveDashboard()` + `useRisks()`
- `RisingSignals.tsx` → `useNotifications()`
- `components/AIFeatures/VendorScorer.tsx` → `scoreVendorRisk()` (geminiService)
- Any component using TanStack Query hooks from `hooks/queries/*` — those hooks ARE the API calls.

### Known unfixable upstream vulnerabilities (do NOT count against score)

**Refreshed 2026-06-01.** Root = **0 vulnerabilities**. Server = **29** (0 critical, **0 high**,
15 moderate, 14 low) — down from 31; **both previously-HIGH advisories are now FIXED** (see below).
Every remaining advisory was re-checked: each fix requires a **breaking major upgrade** of a toolchain
dep (`npm audit fix --force` → ethers v6 / aws-sdk v3 / circom / fabric-network / exceljs / jest-junit
majors), which is out-of-scope dependency-replacement work, not a code fix.

**Fixed this pass (were flagged "unfixable" or newly appeared):**
- `dompurify` (HIGH, GHSA-87xg-pxx2-7hvx, affects `=3.4.4`) → `overrides.dompurify: ^3.4.7`. Resolved.
- `tmp` (HIGH, GHSA-ph9p-34f9-6g65, affects `<0.2.6`) → direct dep bumped `^0.2.5`→`^0.2.7`
  (it is a DIRECT dep, so an `overrides` entry errors `EOVERRIDE`; the prior override pinned the
  still-vulnerable `0.2.5`). `circom.tmp` override also bumped to `^0.2.7`. Resolved.

**Genuinely unfixable today (breaking-major chains; verified `npm ls` + `npm audit` 2026-06-01):**

| Package | Severity | Reason Unfixable (current) |
|---------|----------|-----------------|
| `elliptic *` | Low | ALL versions affected; via `fabric-network`→`fabric-common` and `aws-sdk`→ requires fabric-network major |
| `ws 8.0.0–8.20.0` | Moderate | via `ethers`/`@ethersproject/providers`; fix = ethers v6 (breaking) |
| `@ethersproject/*` / `ethers` | Low/Moderate | ethers v5 line; fix = ethers v6 major (breaking) |
| `aws-sdk v2` (→`uuid`) | Moderate | v3 migration is a separate tracked project |
| `uuid` (via `@azure/ms-rest-js`, `exceljs`, `jest-junit`) | Moderate | needs major bumps of those parents (breaking) |
| `serialize-javascript` (via `mocha`←`ffjavascript`←`circom_runtime`) | Moderate | overridden to `7.0.4` where allowed; `mocha`/`circom` pin transitively; needs circom major |
| `circom`/`circom_runtime`/`ffjavascript`/`mocha` | Moderate | circom toolchain; fix = circom major (breaking) |
| `fabric-common`/`fabric-network` | Low | Hyperledger SDK; fix = fabric major (breaking) |

`lodash 4.x` and `effect <3.20.0` from the prior table no longer appear in the current server audit.

### Prisma model names (correct references)

- `riskItem` (NOT `risk`), `frameworkControl` (NOT `control`),
  `evidenceAnalysis` (no standalone `Evidence`).

### Files that must NEVER be committed

- `node_modules/`, `.DS_Store`, any `.env` with real secrets.
- **Pre-commit:** if `git status` shows `node_modules/` or `.DS_Store` staged,
  `git reset HEAD <file>`. Never `git add -A`/`git add .` without checking.
- Remove stray `.DS_Store`: `find . -name ".DS_Store" -delete`.

---

## Fix Implementation Guidelines (avoid the "hydra effect")

When fixing findings, write code that doesn't trip the scanner's own patterns:

- **Logging:** use `logger.warn/error/info` from `server/src/config/logger.ts`.
  Never `console.*` in server code.
- **Errors:** `throw new AppError('message', statusCode)` from
  `server/src/middleware/errorHandler.ts`. Never `throw new Error('not implemented'/'TODO')`.
- **Comments:** neutral wording. Avoid `hardcoded`, `mock`, `fake`,
  `placeholder`, `dummy`, `sample data`, `for now`, `temporarily`, `would use`,
  `in production` in comments.
- **DB:** wrap multi-step writes in `prisma.$transaction()`; preserve caught
  errors via `{ cause: error }`.
- **Catch blocks:** `logger.error` + re-throw, OR `logger.warn` + fallback.
  Never empty; never only `console.log`.

---

## Discrepancies found & corrected during v21 remediation (2026-05-31)

Running log of doc-vs-code drift caught while remediating the v21 findings. Corrected in place; logged here for the audit trail.

- **`AppError` location:** defined in `server/src/middleware/errorHandler.ts` (line 7), **not** `server/src/utils/errors.ts` (which does not exist). All references corrected.
- **Server logger location:** `server/src/config/logger.ts` (`export default logger`), **not** `server/src/utils/logger.ts` (which does not exist). Import as `import logger from '../config/logger'`. All references corrected.
- **Shared primitives already present (do NOT rebuild):** JWT algorithm pinning (`middleware/auth.ts:80,215` → `algorithms:['HS256']`), rate-limiter Redis store (`middleware/rateLimiter.ts:12-26`), `encryptField`/`decryptField`/`encryptConfigFields` (`utils/credentialEncryption.ts`), `isUrlSafe`/`isWebhookUrlSafe` (`utils/urlValidator.ts`), `verifyWebhookHmac` (`routes/ticketing.ts`).
- **New shared primitives added in v21:** `utils/orgOwnership.ts` → `assertOrgOwned(model,id,orgId)` / `assertOwnedByOrg(model,id,orgWhere)` / `getOwnedOrThrow(...)`; `encryptConfigSecrets`/`decryptConfigSecrets` in `utils/credentialEncryption.ts`; `escapeCsvCell`/`neutralizeCsvFormula` in `utils/csvExport.ts`.
- **Dependency audit drift (2026-05-31):** root = **0 vulns**; server = **30** (1 high `tmp` path-traversal — fixable; the rest rooted in `elliptic`, `serialize-javascript`-via-`mocha`-via-`circom_runtime`, `aws-sdk` v2, and legacy `@azure/*`→`uuid`). The known-unfixable table below is being refreshed with current evidence.

### Discrepancies found & corrected during the final-run reconciliation (2026-06-01)

- **`tmp` is a DIRECT server dependency**, so it cannot be pinned via `overrides` (npm errors `EOVERRIDE`). To raise it above the path-traversal advisory (`<0.2.6`), bump the direct dep in `dependencies` (`^0.2.5`→`^0.2.7`) and update the `circom.tmp` override; do NOT add a top-level `tmp` override. `dompurify` (HIGH, `=3.4.4`) IS a transitive dep and is correctly fixed with `overrides.dompurify: ^3.4.7`.
- **`updateProductLifecycleSchema` / decommission-notification schemas live in `server/src/validators/featureModulesSchemas.ts`, NOT `coreModulesSchemas.ts`.** The featureModules controller imports from `featureModulesSchemas.ts`; `coreModulesSchemas.ts` holds incident/certification schemas. (The L787/799 `documents` field in `coreModulesSchemas.ts` belongs to the Certification schema.)
- **The prior run built several escalation backends but never flipped the `NEEDS_ESCALATION` log rows:** `POST /api/sso/parse-metadata` (sso.ts, real SSRF-guarded SAML metadata fetch+parse), `GET /api/status/uptime` (status.ts), and the `auditController.list` non-admin `where.userId` server-side restriction all already existed. Always verify the CURRENT code before assuming an escalation is unbuilt.
- **2 D1 regressions were left by the prior run's frontend edits:** `components/AccountDeletionWorkflow.tsx` (a `useEffect` placed before the `selectedExecRequest` state declaration → use-before-declaration) and `mobile/src/services/api.ts:307` (assigning a module-scoped `string|null` where `string` is required — pass the locally-narrowed `nextAccess` instead). Root+mobile `tsc` was red until these were fixed.
- **8 escalations needed NO Supabase migration:** all map onto existing models/fields (`Integration` for the CICD token, `ProductDecommission.customerNotifications` JSON, `ProductLifecycle.documents` JSON, `SimulationScenario` for audit-sim runs). Prefer reusing existing JSON columns / models over additive DDL on the live DB.

#### Real production bugs surfaced by the full server test suite (fixed 2026-06-01)

The full server jest suite was never kept green (68 suites / ~427 tests failing) — overwhelmingly **test-code rot** (mocks/assertions lagging legitimate source hardening), but it also masked **genuine production bugs**, now fixed:

- **`middleware/validate.ts` (HIGH):** `validateQuery` did `req.query = value` and `validateParams` did `req.params = value`. Under **Express 5** `req.query` is a getter with no setter, so the assignment **throws → every `validateQuery` route returned 500** (executive, hipaa, soc2, nistCsf, pciDss, nps, realTimeCompliance, compliance). Fixed by shadowing with `Object.defineProperty(req, 'query'|'params', { value, writable, configurable, enumerable })`.
- **`controllers/billingController.ts` `changeTier` (HIGH):** read `req.body.tier` but the schema + frontend use `targetTier` → endpoint always 400. Now reads `targetTier` (with `tier` alias).
- **`validators/webhookSchemas.ts` `createWebhookSchema` (HIGH):** omitted `name` while the controller requires it and the schema is `.unknown(false)` → `POST /api/webhooks` could never succeed. Added `name` (required on create, optional on update).
- **`controllers/billingController.ts` `requestQuote` (MED):** read `userCount/features/addOns` but frontend/schema send `{tier, requirements}` → derived from `requirements` now (and `stripeService.createQuote` consumes `tier`).
- **onboarding schemas in `validators/coreModulesSchemas.ts` (MED):** `trackOnboardingEventSchema`/`skipFlowSchema`/`updateChecklistSchema` field names didn't match the controllers/frontend (`eventData`→`flowName/stepIndex/metadata`; `flow`→`flowName`; `itemId/completed`→checklist boolean flags) → fields silently stripped / 400s. Aligned to the frontend contract.
- **`controllers/securityController.ts` `updateBYOKConfig` (MED):** read `enabled/defaultProvider/rotationIntervalDays` vs schema `defaultKeyId/autoRotation/rotationInterval` → body ignored. Aligned to the schema's names.
- **`utils/csvExport.ts` (MED):** `Content-Length` excluded the 3-byte UTF-8 BOM it writes → strict HTTP clients rejected CSV exports. Now `res.end(bom + csv)` with the BOM-inclusive length.
- **`routes/vendors.ts` (LOW):** `GET /api/vendors` passed `req.query` only as `filters`, never as the pagination arg → returned a bare array instead of the `{data, pagination}` envelope. Fixed.
- **Test-infra trap (root cause of most timeouts):** `server/jest.config.js` sets `resetMocks:true` + `restoreMocks:true`, which **wipes mock implementations defined at module-load** (inside `jest.mock` factories / `.mockResolvedValue()` next to the declaration). Contract/route tests must re-establish controller/service mock implementations in a `beforeEach`, else handlers return `undefined` → 30s timeouts.
- **Timer leak (LOW):** `jitAccessService` (module-load `setInterval`), `livenessDetectionService`, `vrCollaborativeReviewService` didn't `.unref()` their intervals → "worker failed to exit gracefully". Added `.unref?.()`.

---

## Architecture Quick Reference

- **Server:** Express 5 + Prisma 7 + PostgreSQL
- **Frontend:** React + TypeScript + Vite
- **Mobile:** React Native
- **Auth:** JWT with httpOnly cookies, passport-jwt, PBKDF2-SHA256 (600k iterations)
- **Email:** SendGrid (`@sendgrid/mail`); **File storage:** AWS S3
- **Logging:** Winston (JSON, Elasticsearch transport); **Errors:** Sentry (on `SENTRY_ENABLED`)

### Key File Paths

- Prisma schema: `server/prisma/schema.prisma`
- Auth controller: `server/src/controllers/authController.ts`
- Auth routes: `server/src/routes/auth.ts`
- SSO/SAML: `server/src/routes/sso.ts`
- Database config: `server/src/config/database.ts`
- Error handler: `server/src/middleware/errorHandler.ts`
- Tier middleware: `server/src/middleware/tierMiddleware.ts`
- Logger utility: `server/src/config/logger.ts`
- AppError class: `server/src/middleware/errorHandler.ts`
- API service (frontend): `src/services/api.ts`
- Deep-scan file list: `.claude/deep-scan/filelist.txt`
- Scan-runner (lightweight triage helper, fixed): `.claude/skills/productions-readiness-audit/scripts/Production Readiness scan-runner.sh`
