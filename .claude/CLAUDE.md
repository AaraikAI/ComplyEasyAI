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

> ⚠️ **The original `filelist.txt` was defective (corrected 2026-06-02):** its `find` globbed **only**
> `.ts`/`.tsx`/`.js`, so it silently EXCLUDED `schema.prisma`, all `.sql` migrations (incl. the RLS
> policy file), every `Dockerfile`/`docker-compose`, all GitHub Actions workflows, deploy/setup `.sh`
> scripts, `package.json` manifests, and nginx/logstash/monitoring/Falco configs — 88 critical files.
> A deep scan **MUST** include these extensions or it cannot check the DB schema, DB-layer RLS,
> deployment config, or CI/CD supply chain (all explicitly required below). Use the corrected list
> **`.claude/deep-scan/filelist_v2_full.txt`** (1,268 entries: adds `.prisma .sql Dockerfile
> docker-compose* .tf .sh .yml/.yaml package.json .conf`). The overlooked set is `MISSED_FILES.txt`.

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

### Scope-gap correction — files the v21 scan never read (2026-06-02)

The v21 "RESOLVED / production-ready" claim was downgraded to **PARTIAL**. Root cause: `filelist.txt`
globbed only `.ts/.tsx/.js`, excluding 88 critical files. A supplementary deep-read of those files
(`SUPPLEMENTARY_SCAN_REPORT.md`) found ~30 new findings (9 HIGH) the original scan **could not** have
caught. Key genuine gaps, logged for the audit trail (NONE are in the original 429):

- **DB-layer RLS is non-functional (HIGH).** `rls_policies_all_tables.sql` is defeated 3 ways: the app's
  `pg` role (`postgres`) has `BYPASSRLS=true`; **0/324** tables are `FORCE`d; and the policy predicate
  `get_current_organization_id()` reads `current_setting('request.jwt.claims')` — a Supabase-PostgREST
  var the Express/Prisma backend never sets (no `set_config`/`SET LOCAL` anywhere in `server/src`).
  Tenant isolation is therefore **100% application-layer with no DB defense-in-depth.** The RLS file also
  has **0 `ENABLE ROW LEVEL SECURITY`** statements and references a function defined in no repo SQL —
  inert/non-reproducible from source.
  > **SUPERSEDED 2026-08-11** — every specific in this bullet is now stale: the GUC is `app.current_org`
  > (not `request.jwt.claims`), `database.ts:215` **does** call `set_config`, and **324/324** tables have
  > RLS enabled with 202 `FORCE`d. See *"RLS is fully wired in code — but the `app_runtime` cutover would
  > break login (2026-08-11)"* near the end of this file. History here left unchanged.
- **patValidationService SSRF is NOT fixed (HIGH)** despite REMEDIATION_LOG row 399 = FIXED. 12 validators
  (Sentry/Auth0/Datadog/Qualys/Tenable/CrowdStrike/PaloAlto/Rapid7/ADP/Salesforce) interpolate a
  user-controlled `baseUrl` with no `assertSafeOutbound`; guarded ones still bypass `safeFetch` (no
  redirect/DNS-rebind guard). These are **open CodeQL criticals**.
- **CodeQL backlog is 1,163 open alerts (24 critical / 199 high)** per live `gh api`, not the "~2 critical
  / ~66 high" the report footnoted. CodeQL is defined twice and gates no merge.
- **ZK trusted setup uses predictable entropy (HIGH):** `server/scripts/trusted-setup.sh` toxic waste =
  literal `"random text"`; `server/src/zkp/setup-circuits.sh` = `date +%s`. Proofs are forgeable.
- **`infrastructure/scripts/deploy.sh` still pushes/deploys `:latest`** (undermines the CDK immutable-tag
  control, row 194; `cmd_full` is broken because `cmd_infra` passes no `--context imageTag`).
- **CI (HIGH):** `ci.yml`/`mobile.yml` have no top-level `permissions:` → write-all `GITHUB_TOKEN`; **no
  third-party action pinned to a SHA**; `dependency-scan.yml` runs `npm audit fix --force` unattended.
- **Containers:** prod nginx mounts non-existent `./nginx/conf.d` → starts with **no TLS/server block**;
  ES transport `9300` + datastore/admin ports host-exposed; Falco `privileged:true` + docker.sock.
- **Confirmed sound (no change needed):** `utils/orgOwnership.ts` is correct (id AND org, null→404,
  unknown-model→500); all 7 infra CDK fixes are genuinely present in `infrastructure/lib/*.ts`; compose
  files have **no fail-open `:-` secret defaults / no hardcoded creds** (fail-closed `${VAR:?}`); the
  secrets-rotation Lambda is a real 4-step impl; `preferences.ts`/`qrCode.ts` are clean. npm audit
  unchanged (root 0, server 29 / 0 critical-high).

### CodeQL posture refresh (2026-06-06)

The "CodeQL backlog is 1,163 open alerts (24 critical / 199 high)" figure in the 2026-06-02 scope-gap
section above is **stale**. A live `gh api .../code-scanning/alerts` reconciliation on 2026-06-06 shows
**155 open alerts (24 critical / 103 high)**. The remaining triage is operational (dismiss false
positives / resolve true positives in the GitHub Security UI); it is not re-derivable from the working
tree and requires live GitHub auth. Treat 155 open / 24 crit / 103 high as the current posture; the
1,163 number is superseded by this note (history elsewhere is intentionally left unchanged).

### ZK / blockchain status refresh (2026-06-11)

Two prior claims in the 2026-06-02 scope-gap section are now **partially stale** — verified against the
current working tree (file:line below):

- **ZK trusted-setup entropy is FIXED (no longer forgeable).** The earlier claim ("toxic waste = literal
  `"random text"` / `date +%s`; proofs are forgeable") is **no longer true**. All three setup paths now
  draw from a CSPRNG: `server/scripts/trusted-setup.sh:50,78` and `server/src/zkp/setup-circuits.sh:253`
  use `head -c 64 /dev/urandom | base64`. `setup-circuits.sh:235-260` also adds a multi-party contributor
  loop (`ZKEY_EXTRA_CONTRIBUTORS`). **However ZK is still EXPERIMENTAL / not runnable as-shipped:** no
  compiled artifacts exist — `server/src/zkp/keys/` and `server/src/zkp/compiled/` are **absent**, so no
  proving/verification keys are present and proofs cannot be generated at runtime. The service is
  **fail-closed**: `zeroKnowledgeService.ts:116-119,465-498` only emits a simulated proof when
  `ZK_ALLOW_SIMULATED==='true'` (OFF by default); otherwise it throws. Verdict: **EXPERIMENTAL** — sound
  circuits + entropy, but needs the one-time circuit compile/key-gen (ideally a real multi-party ceremony)
  before it does anything in prod.
- **Blockchain anchoring is EXPERIMENTAL by deployment, not by code quality.** Contracts are real and
  compiled (`server/src/blockchain/contracts/ComplianceRegistry.sol` ~1,262 lines; compiled artifact in
  `server/src/blockchain/artifacts/ComplianceRegistry.json`), and the ethers integration is complete
  (`services/advanced/blockchainService.ts`). But **no contract is deployed**: init is env-gated on
  `COMPLIANCE_CONTRACT_ADDRESS` / `COMPLIANCE_REGISTRY_ADDRESS` (`blockchainService.ts:233-253`), and the
  scoring/cert paths **throw 501** when the registry isn't configured (`:663-668,770-774`) — fail-closed,
  not fail-open. Verdict: **EXPERIMENTAL** until contracts are deployed to a network and the addresses set.

Net: the Section-13 "treat as experimental" guidance in `Go Live to Production.md` still holds, but the
*reason* is now "no compiled keys / no deployed contracts," not "forgeable entropy."

#### ZK keys GENERATED + runtime proofs verified (2026-06-12 build)

The "no compiled keys / not runnable" gap above is now **closed for ZK** (blockchain anchoring still needs
on-chain deployment). This session compiled the circuits and ran the phase-2 setup end-to-end:

- **circom via Docker (no sudo):** built a pinned `circom v2.1.6` linux/amd64 image (`complyeasy/circom:2.1.6`)
  and a `/tmp/zkbin/circom` shim that mounts the repo root (so the circuits' `../../../node_modules/circomlib`
  includes resolve in-container). `circomlib@2.0.5` added as a **server devDependency** (the circuits
  `include` its `.circom` sources; only `circomlibjs` was present before — that was the compile blocker).
- **Artifacts generated** under `server/src/zkp/compiled/` + `keys/` via `setup-circuits.sh` with
  `ZKEY_EXTRA_CONTRIBUTORS=2` (**3 phase-2 contributions**, each `/dev/urandom` entropy). Real constraint
  counts: compliance_check 444, credential_verification 976, data_ownership 1003.
- **Runtime-faithful validation PASSED:** all 3 circuits prove+verify through the exact paths
  `zeroKnowledgeService.ts` reads (`compiled/wasm/<c>.wasm`, `keys/proving/<c>.zkey`,
  `keys/verification/<c>.vkey`); a tampered public signal is **rejected**. The service uses real proofs
  whenever these files exist (simulated path stays OFF unless `ZK_ALLOW_SIMULATED='true'`).
- **Phase-2 trust caveat:** the 3 contributions are **single-machine** (sound entropy, but not independent
  parties). For a genuinely distributed ceremony, run the new tooling in **`server/src/zkp/ceremony/`**
  (coordinator-init → participant-contribute on separate machines → finalize-beacon → verify-transcript +
  attestation template). Phase 1 = the public Hermez `powersOfTau28_hez_final_12.ptau` (real ceremony,
  SHA-pinned, never committed).
- **Artifact storage:** `*.wasm` + `*.vkey` (+ `*.r1cs`/`*.sym`) are committed; proving `*.zkey` + the
  `.ptau` are gitignored (Git LFS is **not installed** on this machine) — deploy must run `setup-circuits.sh`
  (or fetch the zkeys) so the server can generate proofs.
- **Two latent bugs fixed (not band-aids):** `setup-circuits.sh` now `mkdir -p compiled` before `circom -o
  compiled/` (it errored "invalid output path" without it); `test-end-to-end.js` now reads
  `compiled/wasm/<c>.wasm` (the relocated/runtime path) instead of the stale circom-default `<c>_js/` path.

---

## Operational lessons learned — tooling & environment (2026-06-06 remediation run)

Hard-won lessons from the 162-fix remediation + CI + E2E run. **Read these before re-running** to avoid
repeating the mistakes.

### Environment / local tooling
- **Docker availability — do NOT conclude "no docker" from a single `docker info` failure.** `docker info`
  fails when the *daemon* isn't running even though Docker is fully installed. Correct probe order:
  (1) `command -v docker` + check `/usr/local/bin/docker` and `/Applications/Docker.app/Contents/Resources/bin/docker`;
  (2) `docker context ls` (Desktop uses `unix:///Users/<u>/.docker/run/docker.sock`);
  (3) if the socket is missing, **start it**: `open -a Docker` then poll `docker info` for ~30–60s until the
  daemon answers. Docker Desktop 29.x + Compose v5 are present on this machine. The user WILL call this out
  if you wrongly claim docker is unavailable.
- **`timeout` is NOT installed on this macOS.** `timeout 60 <cmd>` returns **exit 127** (command not found),
  which masquerades as a real failure (e.g. `gh run watch` "rc=127"). Use a bash poll loop with `sleep`, or
  `gtimeout` from coreutils if present. Never wrap a command in `timeout` and trust the exit code.
- **`PIPESTATUS`/`$?` after a subshell or `... | tail`** often comes back empty/misleading — capture the rc
  explicitly (`cmd; rc=$?`) rather than reading it through a pipe.

### Local E2E stack (reproduces CI exactly — use this instead of blind static fixes)
Bring the full stack up locally to verify E2E before pushing (CI E2E round-trips are ~22 min each):
1. `docker run -d --name ce_pg -e POSTGRES_USER=test -e POSTGRES_PASSWORD=test -e POSTGRES_DB=test_db -p 5432:5432 postgres:16-alpine`
   and `docker run -d --name ce_redis -p 6379:6379 redis:7-alpine`.
2. `docker exec ce_pg psql -U test -d test_db -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'`
3. `cd server && DATABASE_URL=postgresql://test:test@localhost:5432/test_db npx prisma db push --accept-data-loss`
4. Build: root `npm run build`; `cd server && npm run build`.
5. Backend: `NODE_ENV=test PORT=3001 DATABASE_URL=… REDIS_URL=redis://localhost:6379/0 JWT_SECRET=<32+ch> JWT_REFRESH_SECRET=<32+ch> node dist/index.js` → wait for `/health` 200. (The APM `ENOTFOUND your-apm-server` line is harmless.)
6. Frontend: `npx vite preview --port 4173`.
7. Playwright: `CI=true E2E_BASE_URL=http://localhost:4173 API_URL=http://localhost:3001 npx playwright test --project=chromium <spec…>` (the `chromium` project pulls in the `auth.setup.ts` login dependency automatically).

### CI / git pitfalls (all hit and fixed this run)
- **The `main` CI pipeline was already red before any of this work** — check history before assuming a red
  run is your regression: `Deploy to Production` fails at *Configure AWS credentials* on **every** commit
  (no AWS deploy secrets in CI; environmental, NOT a code fix), and the `E2E` job had **always been
  cancelled** (never completed). Use `gh run list --branch main --workflow ci.yml` + per-job conclusions to
  establish the pre-existing baseline.
- **git push 403 as the wrong user:** the cached git credential may be a different GitHub account
  (e.g. `superthinks001`) lacking write access even though `gh auth status` shows the right org. Fix with
  **`gh auth setup-git`** so git uses the gh-authenticated account, then push.
- **`git filter-repo` removes the `origin` remote** ("NOTICE: Removing 'origin' remote"). Re-add it
  afterward (`git remote add origin https://github.com/AaraikAI/ComplyEasyAI.git`) before pushing. Use
  `python3 -m git_filter_repo --replace-text <file> --force` (CLI not on PATH; pip-installed module is).
  Verify with `git log --all -S"<secret>"` → 0 hits. Large committed binaries (`bin/opa` 73 MB) remain in
  history and only trigger GitHub size *warnings*, not push failures.
- **`prisma.config.ts` is loaded by the Prisma CLI for EVERY command (incl. `generate`), but NOT by the app
  runtime.** A fail-closed `throw 'DATABASE_URL is required'` there breaks `prisma generate` in the `npm ci`
  postinstall on CI (no DATABASE_URL). Allow schema-only commands (`generate`/`format`/`validate`) to use a
  non-routable sentinel; require the real URL only for connecting commands (`migrate`/`db`/`studio`).
- **Flat ESLint config ignores `--ext` and lints `.js` too.** A new browser script like `public/offline.js`
  needs `/* global window, document */` (flat config does **not** support `/* eslint-env */`). Lint fails on
  **errors** only; the ~1,200 warnings do not gate CI. `!=`→`!==` (eqeqeq) is an error.
- **Test-rot from legitimate source fixes is expected.** After hardening source (org-scoping guards, removed
  demo data, added validation), align the tests to assert the NEW correct behavior (supply valid same-org
  fixtures, expect the new 400/403 guards, expect neutral/empty UI) — never revert the source or weaken the
  assertion to make a test pass.

### Workflow-tool (multi-agent) gotchas
- **Any `Math.` token** (even `Math.min` / inside a string like `"never Math.random()"`) trips the
  determinism validator → use plain arithmetic and reword prose. `Date.now()`/`new Date()` likewise banned.
- **`args` reaches the script as a STRING** — guard with `const x = typeof args === 'string' ? JSON.parse(args) : args`.
- **Double-thunk bug:** `parallel(items.map(e => () => { … return () => agent() }))` never invokes `agent()`
  (0 agents, ~40 ms). Write `items.map(e => () => agent(…))` or `items.map(e => { …; return () => agent(…) })`.
- **`agent({schema})` can fail "completed without calling StructuredOutput."** Prefer disk-artifact returns:
  have each agent **Write its JSON to disk** and return plain text; the orchestrator reads the files. Track
  completion by which files exist, and re-run only the missing batches (resume-friendly).
- **Session limits can truncate a long swarm mid-run.** Make every phase resumable: write per-unit artifacts,
  then detect-missing-and-rerun rather than restarting the whole workflow.

---

## E2E (Playwright) stabilization — what the static deep-scan structurally missed (2026-06-07)

A 100%-file-coverage **static** deep-scan (D1/D2/D3/D5 only) implied near-readiness, but the dynamic E2E
phase (**D6**) had **never run to completion** in CI (always cancelled). When finally run end-to-end, the
chromium suite had **96 failures** that line-by-line reads **could not** find. **Lesson: a deep scan is NOT
production-grade until D6 actually runs the FULL Playwright suite to completion against a real stack and
every failure is triaged to a root cause.** The 96 collapsed to a handful of root causes:

1. **Onboarding Welcome modal intercepts ALL clicks (~85 of the 96).** A full-screen
   `<div role="dialog" aria-label="Welcome to ComplyEasy AI" class="fixed inset-0 z-50 …">` overlays the app.
   `contexts/OnboardingContext.tsx`'s progress-load **catch block** force-started the welcome flow whenever
   `/onboarding/progress` failed (the e2e mock user has no real session → 401), **ignoring** the persisted
   `onboarding_completed`/`hasSeenOnboarding` localStorage markers. Fixed: on load failure, respect the local
   markers and do NOT auto-pop the wizard (also a real UX bug — an API hiccup shouldn't block a returning
   user). A static reader sees a normal modal component; only a running browser shows it eating every click.
2. **CSP `frame-ancestors` in a `<meta>` tag is ignored by browsers** (works only as an HTTP header) and logs
   a fatal console error the perf test catches. Removed from `index.html` meta; framing is enforced by the
   CloudFront `ResponseHeadersPolicy` + nginx header. Static reads "see CSP present" and pass it.
3. **The local backend MUST be started with the EXACT CI env** or you get false failures: `CORS_ORIGIN` +
   `CLIENT_URL=http://localhost:4173`, `ENCRYPTION_KEY`, `GEMINI_API_KEY`, `SENDGRID_*`, JWT secrets (see
   `.github/workflows/ci.yml` → `Start backend` env). Missing `CORS_ORIGIN` made all CORS tests fail locally
   while passing in CI — a local-only artifact that wasted a debugging cycle.
4. **Rate-limiting (429) under concurrent E2E load is BY DESIGN and cannot be disabled.** `isDev` in
   `server/src/middleware/rateLimiter.ts` is `env==='development'` only, so `NODE_ENV=test` uses strict prod
   limits, **and** jest `security/rate-limiting.contract.test.ts` + `unit/middleware/rateLimiter.test.ts`
   REQUIRE the limiter to return 429 (so you cannot relax it for tests). The suite is architected around it:
   per-test 429-tolerance + CI **`retries: 2`**. A single-backend `--workers=3 --retries=0` local run is
   HARSHER than CI's 4-sharded `--workers=2 --retries=2` (4 separate backends), so it exposes flakes CI
   absorbs. Reproduce CI faithfully or you will chase non-CI failures.
5. **THE deep one — cross-origin httpOnly-cookie auth does NOT work in the E2E env, so org-scoped CREATE
   flows can't persist.** The stack is cross-origin (frontend `:4173`, API `:3001`). Real auth uses httpOnly
   cookies, but a cross-origin XHR only sends them as `SameSite=None; Secure`, which browsers reject over
   plain http. So the suite uses a **localStorage mock user with NO real backend session** → every create
   POST 401s and **never even fires** (the client gates on auth). Read/render tests pass; tests requiring
   **persisted** org-scoped data (e.g. `compliance-frameworks` "add a framework from the catalog" → the new
   card must appear) CANNOT pass with mock-auth on a fresh DB. **This one test took 4 GitHub pushes of
   band-aid fixes (reload-and-assert, create-429 skip, list-429 skip, CSRF-429 skip) that ALL failed in CI**
   because they treated symptoms, not the cross-origin root. Diagnosis only landed by **probing the running
   app** (Playwright: clicking "Add" fired ZERO `/api/frameworks` requests) — impossible from static reads.
   **The correct, production-aligned fix is to make the E2E env SAME-ORIGIN** (vite `preview.proxy` routes
   `/api` → backend; build the frontend with `VITE_API_URL=/api`), exactly like production (CloudFront serves
   the SPA and proxies `/api`). Then real `register`+`login` cookies flow, CSP `connect-src 'self'` covers the
   API (no per-spec CSP shim needed), and create flows persist. **Rule: when an E2E test needs persisted
   backend state, do NOT patch the assertion — fix the auth/origin architecture so the test exercises the
   real flow the way production does. Patching assertions across 4 pushes is the anti-pattern to avoid.**

> **Local E2E stack that reproduces CI faithfully** (added to the tooling section above): postgres:16-alpine +
> redis:7-alpine containers, `prisma db push`, build FE+BE, start backend on `:3001` with the **full** CI env
> block (item 3), `vite preview --port 4173`, then `CI=true E2E_BASE_URL=http://localhost:4173
> API_URL=http://localhost:3001 npx playwright test --project=chromium`. Reset the DB (`DROP SCHEMA public
> CASCADE; CREATE SCHEMA public; prisma db push`) between full runs — accumulated state hides fresh-DB failures
> (e.g. add-framework "passes" locally only because a prior run already created the framework).

### Same-origin E2E rework — empirical blast radius (CORRECTION to item 5, 2026-06-13)

Item 5 above calls the **same-origin E2E env** "the correct, production-aligned fix" for the
`compliance-frameworks` add-from-catalog test. That is true for THAT test — but the one-paragraph framing
**understates the scope**. It was actually attempted this session and measured against CI:

- **It does fix the target.** Building the SPA with `VITE_API_URL=/api`, adding a `vite preview` `/api`
  proxy to the backend, and making `auth.setup.ts` do a REAL `register`→password-`login` (both CSRF-exempt;
  cookies are `secure:false` under `NODE_ENV=test` + `sameSite:'strict'`, so they flow same-origin)
  **persisted the create and turned `compliance-frameworks` green.**
- **But introducing a real backend session regressed ~10 OTHER tests** that are built around the
  *no-real-session* mock-auth model — overwhelmingly **security/auth specs**:
  `security/auth-security.spec.ts` (session-cleared / logout-invalidation / token-in-query),
  `security/data-isolation.spec.ts` (org-scoping: list scoping, cross-org search, `organizationId` filter
  override, path-traversal), plus `asset-management` create, `incident-management` create-POST, and the
  `comprehensive-e2e` invalid-credentials message. These passed before precisely because every API call
  401'd; with a real session they get real 200s and the old assertions no longer hold.
- **Net for that push: fixed 1, broke ~10.** So the same-origin migration is **a security-test-rework
  project, not a config tweak**: it requires carefully updating each of those security specs to assert the
  correct behavior *under a real session* (without weakening the security checks) — and that rework must be
  verified against a working local E2E stack (the per-cycle CI cost is ~20 min). It was reverted this
  session (the lone pre-existing `compliance-frameworks` red is also red on `main`, so it is not a
  PR regression). **Before re-attempting, budget for the security-spec rework + local verification; do not
  ship the same-origin flip on its own.**

### Same-origin E2E rework — LANDED (the recipe that works, 2026-06-14)

The 2026-06-13 note above said "do not ship the same-origin flip on its own." It was then done **properly**
this session (Docker back up → full local E2E stack), and it WORKS. Net result of one local full run after
the rework: **610→ effectively all green** (16 residual failures all triaged: 10 fixed by the reworks below,
6 are the single-backend browser-crash/timeout flakes CI's 4 sharded backends + `retries:2` absorb). The
migration is **net-positive for production-readiness** — it caught real shipped bugs the mock-auth suite
structurally could not. The working recipe (committed in `fa171a00`):

- **Same-origin stack.** `vite.config.ts` `preview.proxy` routes `/api`→backend (`E2E_API_PROXY_TARGET`);
  build the E2E frontend with **`VITE_API_URL=/api`** (ci.yml) so the SPA is same-origin; the backend's
  `secure:false`-in-test + `sameSite:'strict'` cookies then flow with the app's XHRs like prod.
- **Real session in `auth.setup.ts`:** real `register`→password-`login` (both CSRF-exempt), THEN
  `GET /api/csrf-token` → `POST /api/onboarding/skip-flow {flowName:'welcome'|'tier_tour'}` so the
  freshly-registered real user doesn't get the full-screen welcome wizard that intercepts every click.
- **Rate limits:** real auth loads real data → the single E2E source IP trips `apiLimiter` (100/15min).
  Relax it for the E2E backend ONLY via **`RATE_LIMIT_MAX_REQUESTS`** (it's already env-driven —
  `config/index.ts`); keep `authLimiter` hardcoded at 5 so the brute-force test still verifies the limiter.
  (Locally, in-memory limiters survive `redis FLUSHALL` — only a backend restart resets them; CI is fresh.)

**Real PRODUCTION bugs the rework surfaced + fixed (the payoff):**
- **Catalog "Add framework" was broken in prod.** `App.tsx handleAddFramework` sent backend-controlled
  `status`/`progress`; `createFrameworkSchema` is `.unknown(false)`, and even with `stripUnknown:true` Joi
  **rejects** (not strips) unknown keys → **400, framework never created.** Fixed: send only schema-accepted
  fields. (This is the real reason `compliance-frameworks:176` failed — NOT cross-origin cookies.)
- **4 components did raw `fetch('/api/…',{method:POST/PATCH/DELETE})` with NO `X-CSRF-Token`** → 403 in prod
  (`IncidentManagement`, `AssetManagement`, `AuditorHub`, `AIFeatures/ContractAnalyzer`). Fixed with a shared
  `csrfFetch` wrapper in `services/api.ts`. Mock-auth hid all four (the POST 401'd before the CSRF gate).
- **Every mobile/API Bearer mutation would 403 in prod:** `middleware/csrf.ts` required a CSRF token for ALL
  mutations except the auth-bootstrap paths, but mobile authenticates via `Authorization: Bearer` and sends
  no token. Fixed by exempting Bearer-authenticated requests (header-token auth carries no CSRF risk).

**Test-rot the real session exposed (fix the assertion to the REAL authed behavior — never weaken):**
the global `storageState` now carries a real session, so `request`/`page.request` are authenticated. Specs
that *tolerated* the unauthenticated 401 now reach real validation. Patterns + fixes: pin
`storageState:{cookies:[],origins:[]}` for whole-file unauthenticated-isolation specs (`auth-security`,
`data-isolation`); `page.context().clearCookies()` for a single unauthenticated probe inside an otherwise-
authed describe (`integrations`/`notifications` "require auth"); send schema-valid payloads + unwrap the
`{status:'success',data}` envelope + correct stale routes (`/api/ai-rmf`, `/api/privacy/retention`) in
`api-database-verification`; scope create-modal locators to the modal (the asset name field has only a
placeholder, so an unscoped `input[type=text]` filled the page search box — the create test never actually
ran before). See `FULL_DEEP_SCAN_PROMPT.md` §0 Round 5 + §3 test-rot track for the generalized guidance.

### Discrepancies found & corrected — seo-geo-aeo branch CI greening (2026-06-13)

Logged for the audit trail while driving the `seo-geo-aeo` PR's CI green (the SEO/GEO/AEO overhaul commit
`caf77862` introduced several breaks it did not also fix):

- **The SEO commit broke the production Docker build** (the `frontend-build` stage never `COPY`'d the new
  `data/` dir or `scripts/` — both imported by the build — and the new `scripts/prerender.mjs` needs a
  headless browser that alpine lacks). Fixed in `Dockerfile`: `COPY data/`, `COPY scripts/`, `apk add
  chromium nss freetype harfbuzz ttf-freefont` + `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser`
  (puppeteer's bundled glibc Chromium can't run on musl) and `PUPPETEER_SKIP_DOWNLOAD=true` in
  `frontend-deps`.
- **The SEO `.mjs` build scripts had no ESLint globals** → 33 `no-undef` errors (`process`/`document`/
  `window`/`setTimeout`) failing Lint & Type Check, because the flat config only defined globals for
  `**/*.{ts,tsx}` and `scripts/**/*.mjs` fell through to `js.configs.recommended` (no-undef on). Fixed with
  a `files: ['scripts/**/*.mjs']` flat-config block.
- **Bundle billing controller diverged from its committed test contract.** `billingController.subscribeToBundle`
  was changed (in the uncommitted working tree) to call `stripeService.addBundle` (billing only) and return
  `{success,bundleId}`, but the on-`main` test expects `featureService.subscribeToBundle` → `{subscriptions,
  count}`. Correct behavior is BOTH: bill via Stripe AND grant the per-feature entitlements, returning
  `{subscriptions,count}`. Also added `addBundle`/`removeBundle` to the controller-test `stripeService` mock
  and `removeBundleSubscription` to the routes-test controller-method list (the route `.bind()`'d an
  undefined mock method → suite failed to load).
- **`<script type="application/ld+json">` (SEO structured data) tripped the XSS E2E heuristic.** The
  `xss-csrf-browser.spec.ts` inline-script check flagged ANY inline `<script>` with a body; `ld+json`/`json`
  are inert data, so the heuristic was refined to exclude those types (executable inline scripts still
  caught). Also hardened `components/seo/JsonLd.tsx` to escape every `<` as `<` (prevents a
  `</script>` breakout; output stays valid JSON-LD).
- **Trivy CRITICAL `shell-quote` (CVE-2026-9277)** in `mobile/package-lock.json` (transitive via
  `react-native`→`react-devtools-core`) gated Security Scan; pinned `^1.8.4` via a `mobile` `overrides`.
  Also flaky on `main` independently (the advisory post-dated main's last green run).
- **`incident-management.spec.ts` "no passwords" test was fragile AND incomplete**: substring-matched
  `password|secret|token` over the whole body (false-positive on legitimate incident text; *missed* an
  `apiKey` field). Replaced with a structural walk flagging sensitive credential FIELD KEYS with real values.

### Dependabot major-bump remediation — lessons (2026-06-22)

Drove the post-merge Dependabot queue green on `main`. Key reusable findings:

- **Verify Dependabot PRs with `npm ci`, NOT `npm install`.** `npm install` re-resolves the tree and can
  silently keep a compatible older version, MASKING type errors that CI's `npm ci` (exact committed lock)
  surfaces. Twice this gave a false "tsc clean" locally while CI's `Lint & Type Check` failed. Always
  `npm ci --cache /tmp/<x>` then `tsc` to faithfully reproduce a dep-bump PR.
- **Stripe bumps require updating the pinned `apiVersion` string.** Bumping `stripe` advances the SDK's
  pinned API version *type*; the hardcoded `apiVersion` in `server/src/services/stripeService.ts` AND
  `featureService.ts` must move in lockstep (e.g. `'2026-03-25.dahlia'`→`'2026-05-27.dahlia'`), else
  `error TS2322: Type '<old>' is not assignable to type '<new>'`.
- **jest 30 renamed `--testPathPattern`→`--testPathPatterns`** (plural). Broke `server/package.json`
  `test:unit`/`test:integration`/`test:e2e`/`test:all`/`test:performance`/`test:resilience` → jest prints
  help, exits non-zero → Backend/Integration Tests fail. Rename the flag in all six scripts.
- **Expo SDK bumps: all `expo-*` + `jest-expo` must match the SDK major.** expo 55→56 with `jest-expo` left
  at `^55` → expo's winter `fetch` runtime throws `Super expression must either be null or a function`. Bump
  `jest-expo` and `expo-secure-store` to `^56`. Likewise `@react-native/jest-preset` must track
  `react-native` EXACTLY — Dependabot proposes it ahead (0.86 while RN is 0.85); hold it via `dependabot.yml`.
- **@testing-library/react-native v14 is BLOCKED on this stack — hold the major.** v14 requires the new
  React-19 `test-renderer` (`require('test-renderer')`), but `jest-expo` 56 / `@react-native/jest-preset`
  0.85 still wire the legacy `react-test-renderer` and don't register the RN host config for the new
  renderer. Result: `render(<Text>)` works, but `renderHook` for hooks using `mountedRef` unmount guards
  (`useApi`/`usePaginatedApi`) returns a **null `result.current`** (React 19 effect double-invoke nulls the
  tree). Forcing v14 needs either production-hook rewrites or a fragile renderer hack — neither acceptable.
  Held via `.github/dependabot.yml` ignore (`>=14.0.0`); keep RNTL 13 (68 mobile tests green) until the
  jest preset adopts the new renderer. Mechanical migration (async `render`/`renderHook` + `await waitFor`
  after interactions) is necessary-but-insufficient: the renderer gap blocks it regardless.
- **Dependabot regenerates PRs every time `main` moves** — a few routine bumps are ALWAYS open; that's
  normal, not a failure. Triage real failures with `gh pr checks <n> | awk -F'\t' '$2=="fail"'`, EXCLUDING
  the `E2E Tests (1)` baseline + `Deploy to Production` (AWS-creds) which are red on `main` independently.
- **NEVER grep a lockfile to decide whether a package is installed/resolvable — that produced a wrong
  conclusion here.** Chasing #316/#327 (server prod-deps group), CI failed with
  `sso.ts(20,27): Cannot find module 'fast-xml-parser'`. I ran `grep -c '"node_modules/fast-xml-parser"'`
  / `grep -c 'fast-xml-parser'` on `package-lock.json`, got `0`, and **hand-waved that the grep "just
  didn't match its hoisted form"** — both the grep AND that explanation were WRONG. npm v3+ lockfiles key
  packages under many forms (top-level `node_modules/<pkg>`, nested `node_modules/<parent>/node_modules/<pkg>`,
  `packages` map, dependency refs) and hoist transitives, so a single literal `grep` gives false negatives,
  and my `tsc` "0 errors" readings were stale-`node_modules` artifacts (the `--cache` reuse left a prior
  copy). **Correct verification, every time:** `rm -rf node_modules && npm ci && node -e
  "console.log(require.resolve('<pkg>'))"` (or `npm ls <pkg>` / `test -e node_modules/<pkg>`) — resolve the
  module, don't grep the lock. Trust CI (clean room) over a local grep.
- **Root cause of the #316 lock corruption (real finding): a package listed in BOTH `dependencies` AND a
  self-referential `overrides` entry.** `server/package.json` had `fast-xml-parser` as a direct dep `^5.3.6`
  AND `overrides.fast-xml-parser: ^5.3.6`; the Dependabot group bump regenerated a lock that dropped the
  resolved entry, so `npm ci` couldn't install it → `Cannot find module`. A self-referential override of a
  direct dep is redundant and fragile; the clean fix is to remove the override (keep the direct dep) and
  regenerate the lock — but VERIFY via `require.resolve`, and prefer letting Dependabot regenerate a fresh
  group PR against fixed `main` over hand-patching a 700-line corrupted lock. (#316/#327 were deferred, not
  forced: routine AWS-SDK patch housekeeping, non-blocking; main's server deps are green/deployable.)

### Process directive — use a multi-agent swarm for multi-PR / multi-package remediation (2026-06-25)

This Dependabot-queue remediation was done **serially by one agent** and it cost too much time, repeated
the same `npm install` vs `npm ci` and grep mistakes across PRs, and risked regressions from branch-hopping
+ stale local state. **For tasks of this shape — N independent PRs / packages / workspaces to verify and fix
to green — drive it with the `Workflow` multi-agent tool, not a serial loop.** Pattern that fits here:
- **Fan-out (one agent per PR/workspace, isolated git worktree)** so branch state never collides — each agent:
  checks out its PR, merges `main`, runs the FAITHFUL repro (`rm -rf node_modules && npm ci` + `tsc`/tests +
  `require.resolve` checks, NEVER `npm install`/grep), classifies real-vs-stale failure, and returns a
  structured verdict (fixable / fix-applied / upstream-blocked / defer) — it does NOT merge.
- **Barrier → synthesize**: the orchestrator dedupes findings, applies the holds (`dependabot.yml`), opens
  superseding PRs for the genuinely-fixed ones, and merges only after the FULL CI pipeline is green.
- **Adversarial verify** each "fixed" claim with a second agent doing a clean-room `npm ci`+build before
  merge, so no agent's stale-`node_modules` false-positive reaches `main`.
This is correct (per-PR isolation prevents cross-contamination), complete (every PR triaged in parallel),
faster (wall-clock = slowest single PR, not the sum), and regression-safe (clean-room verify gate before
any merge). Worktree isolation (`isolation:'worktree'`) is mandatory because the agents mutate
`package.json`/lockfiles concurrently.

### seo-geo-aeo E2E shard 1 + 3 failures — root causes (2026-06-19)

The PR's last CI run (`27526183687`) had two red E2E shards. Both were diagnosed by reproducing the
**real-session** stack locally (the targeted-test runs are reliable; full-suite local runs OOM the 8GB host
— see the env caveat below) and fixed. Verified: the 4 previously-failing tests pass in a clean targeted
`--workers=1` local run against the real backend.

- **Shard 1 — `asset-management.spec.ts` "can create a new asset" + "…not rejected by CSRF" (HIGH).** The
  GDPR **Cookie Consent banner** (`<div role="dialog" aria-label="Cookie consent preferences"
  class="fixed bottom-0 … z-50">`, `components/CookieConsentBanner.tsx`) overlays the viewport bottom and
  **intercepts pointer events** on the create-modal's "Add Asset" submit button (Playwright: "subtree
  intercepts pointer events" → `locator.click` 60s timeout). The asset spec has no per-file `seedAuth`; it
  rides the global `storageState`, which never pre-accepted consent. Fix: seed `complyeasy_cookie_consent`
  (the banner's `STORAGE_KEY`, `consentVersion:'1.0'`) in BOTH `e2e/auth.setup.ts` localStorage blocks so the
  shared authed session models a returning, already-consented user. Audited safe: no spec hard-asserts the
  banner is *visible* (only `toHaveCount(0)` absence checks); the one `acceptCookies:false` user
  (`privacy-management.spec.ts` "accepting cookies dismisses") now actively `removeItem`s the key in its
  `seedAuth` else-branch so it still forces the banner.
- **Shard 3 — `privacy-management.spec.ts` DPIA + RoPA "page loads" (HIGH, real prod white-screen bug).**
  `/api/ropa` and `/api/dpia` return a **paginated envelope** `{status,data:{records|dpias:[],total,page,…}}`,
  but `RoPAManagement.tsx`/`DPIAWorkflow.tsx` (which use a LOCAL `apiFetch` returning raw JSON, NOT the
  shared `api` service) did `setActivities(res.data)` / `setDpias(d.data)` — storing the **wrapper object**
  as list state. The `stats` `useMemo` then calls `.filter()` on a non-array → **TypeError during render**,
  and with **NO ErrorBoundary anywhere in the tree** (verified: `index.tsx`/`App.tsx`/`Layout.tsx` had zero
  `getDerivedStateFromError`), one throwing route **unmounts the entire React tree → blank white screen, no
  h1/h2** (test: "element(s) not found"). It passed *locally without a backend* only because the fetch failed
  → catch left state `[]`. Fixes: (1) normalize all shapes to the underlying array in both components
  (bare array / `{data:[]}` / `{data:{records|dpias:[]}}`); (2) added `components/RouteErrorBoundary.tsx` and
  wrapped `<Suspense><Routes>` in `App.tsx` (`resetKey={location.pathname}`) so any future page throw degrades
  to a recoverable error card instead of white-screening the whole SPA. The shared-`api` list pages
  (`AccountDeletionWorkflow`, `PrivacyNoticeServing`, +5 others with the `setX(res.data)` pattern) render h1
  fine against the real backend (they passed in CI) — left as-is; the new boundary covers them defensively.

> **Local full-suite E2E is memory-bound on this 8GB host (caveat for future runs).** Running the full
> privacy+asset specs (or even 2–3 privacy tests) back-to-back OOM-kills the `vite preview` server and/or
> crashes chromium — Playwright reports `Target page, context or browser has been closed` / `ERR_CONNECTION_
> REFUSED`, with a bare "Notifications + Tanstack devtools" page snapshot (NOT a render bug — a real throw
> shows the new ErrorBoundary card). Symptoms: `PhysMem` ~69–233M unused, heavy swapping. The privacy
> "platform/notices/data-deletion page loads" tests fail this way locally yet **pass in CI in ~2s** (each
> shard is a dedicated runner). Proven not-a-regression: `:350` fails identically with my changes **stashed**.
> Reproduce reliably by running ONE spec/test at a time with fresh `vite preview`; trust CI's per-shard
> runners for the full sweep. Also: Docker build cache + dangling images had grown to ~30GB — `docker
> builder prune -af && docker image prune -af` (keeps running pg/redis) reclaimed it. And `authLimiter` is
> hardcoded at 5/window, so repeated manual `/api/auth/login` probes 429 — restart the backend to reset.

---

### Go-live session — Sentry triage + dependency remediation (2026-07-12)

- **Deep-scan report H6 (`fast-xml-parser` "build blocker") was a FALSE POSITIVE — the lockfile-grep trap again.** A batch agent claimed `sso.ts:20`'s `fast-xml-parser` import is unresolvable "under clean `npm ci`" (TS2307). The CORRECT check (`rm -rf server/node_modules && npm ci --cache /tmp/x` then `node -e "require.resolve('fast-xml-parser')"`) resolves it to `node_modules/fast-xml-parser/lib/fxp.cjs`, and clean-room server `tsc --noEmit` = **0 errors**. The TS2307 (and the 2 stripe `apiVersion` D1 errors) were **drifted local `node_modules`**, NOT the committed state — which is why main CI Lint&TypeCheck is green. Lesson reinforced: never conclude "unresolvable/vulnerable" from grep or a drifted tree; `npm ci` clean-room + `require.resolve` is the only authority.
- **Dependency remediation (safe, non-breaking):** `npm audit fix` **without `--force`** on the clean lock took server **46→30** advisories (**HIGH 10→1**) and root **1→0**, changing **only lockfiles** (no `package.json`). Fixed in-range: `multer/undici/form-data/hono/protobufjs/@grpc/grpc-js/ws@8.21.0/engine.io/socket.io-adapter` + root `js-yaml`. Verified: server `tsc` + `npm run build` clean, 64 ws/upload/middleware tests green. The remaining server advisories are the **known-unfixable set** (needs breaking majors, DO NOT `--force`): `ws@8.18.0` via `circomlibjs`→`ethers@5`; `aws-sdk` v2→v3; `exceljs`; `mocha`/`serialize-javascript`/`js-yaml`-via-circom; `fabric-*`/`elliptic`; `@azure/graph`/`ms-rest-js`/`uuid` (no fix); `@opentelemetry/*` via `elastic-apm-node`. Note the CVE accumulation happened because the **`Self-Heal CVEs` workflow is failing** on every scheduled run.
- **Machine gotcha:** `~/.npm` cache has root-owned files → `npm ci` fails `EACCES`. Work around with `npm ci --cache /tmp/<x>` (permanent fix: `sudo chown -R 501:20 ~/.npm`).
- **Sentry noise root cause (fixed):** `middleware/monitoring.ts` `errorTrackingMiddleware` captured EVERY `next(err)` error — including operational 4xx `AppError`s (validation/not-found/auth) — to Sentry. Gated to 5xx/non-operational only; also removed the duplicate `captureException` in `errorHandler.ts` (every 5xx was reported twice). Of the 21 stale Sentry issues, verified against code: 0 are live unfixed bugs (3 real bugs already fixed incl. the register-500-on-email-failure `authController.ts` fix; ~13 expected 4xx; rest = test-env config / transient).

### Local-env bring-up + UI password-login bug (2026-07-14)

- **Frontend↔backend contract bug — UI password login was 100% broken (HIGH, fixed).** The web login form threw `'No access token received'` for EVERY valid password login. Root cause: `services/api.ts` `api.auth.login` gated success on `if (response.accessToken)` — a **pre-cookie-migration leftover**. Commit `51b298c4` deliberately stripped the JWTs from all auth **response bodies** (login/refresh/magic-link/2FA) and moved them to httpOnly cookies via `setAuthCookies` (`authController.ts:671` for login → body is `res.json({ user, ...sessionInfo })`, NO `accessToken`). The migration was applied to `verifyMagicLink` (correctly gates on `if (response.user)` + `setAuthToken('__cookie__')`) but **missed `login`**, so `response.accessToken` was always `undefined` → always threw. Fix: mirror `verifyMagicLink` — gate on `response.user`, `setAuthToken('__cookie__')`. Also cleaned the identical dead leftover in `api.auth.refreshToken` (`services/api.ts`). Verified end-to-end by driving the real UI login form → lands on dashboard, POST /api/auth/login 200, 0 console errors.
- **2FA key-name trap (handled):** the password-`login` 2FA branch signals with key **`requires2FA`** (`authController.ts:578`), but magic-link `verifyMagicLink` uses **`twoFactorRequired`** (`:322`) — different keys. Naively "mirror verifyMagicLink" would silently re-break 2FA login. The fix keys off `requires2FA` and throws a clear message (no 2FA code-entry UI exists on the login form yet — grep `requires2FA`/`twoFactor` in `components/LandingPage.tsx` = 0 hits). Throwing in the api layer (vs returning a passthrough) also avoids a latent trap: `AuthContext.login` does `if (user) setUser(user)` unconditionally, so a `{requires2FA}` passthrough would have been stored as a malformed user.
- **Why E2E never caught it:** `e2e/auth.setup.ts` logs in via a DIRECT `request.post('/api/auth/login')` + storageState cookie — it never exercises the UI's `api.auth.login` throw path. A UI-driven login test would have caught it. (Test `services/__tests__/api.test.ts` "login throws when no access token" actually *encoded* the broken contract; updated to assert the new behavior + added a `requires2FA` test.)
- **MOBILE login was ALSO broken by the same root cause — FIXED 2026-07-14 (v2-gated body tokens).** Mobile authenticates via `Authorization: Bearer` and reads the token from the **response body** (`mobile/src/services/api.ts:354` `result.data?.token ?? result.data?.accessToken`, refresh at `:313`, `AuthContext.tsx:185` `result.data?.token`), but the shared `authController.login` returned the token ONLY in an httpOnly cookie — which React Native `fetch` cannot use (`sameSite:'strict'`/`secure`). So mobile showed a "successful" login (because `data.user` exists → `AUTH_SUCCESS`) yet held **no token** → every authenticated call 401'd. Mobile hits the SAME shared handler (`/api/v2/auth/login` → v2 inherits v1). **Fix (backend-only, no mobile change needed — mobile already reads these fields):** added `bearerAuthTokens(req, access, refresh)` in `authController.ts` that returns `{ token, accessToken, refreshToken }` **only when `(req as VersionedRequest).apiVersion === 'v2'`**, spread into the `res.json` of all four token-issuing handlers (login, verifyMagicLink, refreshToken, completeTwoFactorLogin — each right after its `setAuthCookies`). **Security boundary is the v2 resolution, which is airtight for web:** the web `/api/auth` mount (index.ts:568) does NOT run `apiVersioningMiddleware`, so `req.apiVersion` is `undefined` there — even a forged `X-API-Version: v2` header on `/api/auth/login` yields NO body tokens (verified by curl). Only the `/api/v2` mount (index.ts:699, mobile's `X-API-Version: v2`) resolves to v2. This is NOT a revert of `51b298c4` — web/v1 stay cookie-only (no JS/XSS token exposure); only the Bearer/API surface gets body tokens, exactly as a native client requires. Verified end-to-end via curl: (A) `POST /api/v2/auth/login` → body has `token`+`accessToken`+`refreshToken`; (B) `POST /api/auth/login` (web, even w/ spoofed v2 header) → NO body tokens; (C) the v2 Bearer token authenticates `GET /api/v2/risks`→200; (D) `POST /api/v2/auth/refresh` → new body tokens. 98 authController unit/contract tests green; server `tsc`/build clean. **Note (separate, FIXED 2026-07-14):** mobile calls `GET /auth/me` (`mobile/src/services/api.ts:366`) but the backend had **no `/auth/me` route** — it did NOT gate login (login returns `data.user`, so the `me()` fallback at `AuthContext.tsx:196` never runs), but standalone mobile `me()` calls 404'd. Added `authController.getCurrentUser` + `router.get('/me', authenticate, ...)` (`routes/auth.ts`). It re-queries the user+org fresh and returns the user fields at the **top level** of the body (NOT nested under `{ user }`) — because the response envelope puts the whole body under `data` and mobile hydrates via `normalizeUser(meResult.data)` (reads `data.id`/`data.email`/`data.organization.name` directly), unlike the login path which reads `data.user`. Verified via curl: `GET /api/v2/auth/me` (Bearer)→200 with user under `data`; unauthenticated→401; `/api/auth/me` (web)→200. 3 new `getCurrentUser` unit tests added (101 authController tests green).
- **Local full-stack bring-up recipe works as documented** (postgres:16 + redis:7 containers → `prisma db push` → `VITE_API_URL=/api npx vite build` → backend on :3001 with the CI env block → `E2E_API_PROXY_TARGET=http://localhost:3001 vite preview --port 4173`). Same-origin proxy makes httpOnly cookies flow; register + login round-trip and org-scoped dashboard reads all 200. Demo account created: `demo@example.com` / `TestPass123!`.
- **Doc drift corrected:** CLAUDE.md "Key File Paths" said `src/services/api.ts` for the frontend API service; the Vite frontend actually lives at the **repo root** (`services/`, `contexts/`, `components/`, `hooks/`), `@` alias → repo root. Corrected in the Key File Paths section.

### Container boot hostility — the class that static scans miss (2026-08-04)

The first production ECS deploy crash-looped with ECS reporting only "Essential container in
task exited" and **no application log**, because the process died during **module import** —
before any logging or error handling was live. Four separate instances of the same class were
found; each would have cost its own ~20-minute deploy cycle if fixed one at a time:

- **`config/logger.ts`** — winston opened a log file at import; the non-root user cannot write
  `/app/server/logs` → `EACCES` → boot abort. Fixed with a `resolveLogDir()` that returns null
  when the dir is not writable (console transport only).
- **`services/advanced/zeroKnowledgeService.ts:79`** and
  **`services/advanced/complianceAsCodeService.ts:95`** — both `fs.mkdirSync(...)` from a
  **constructor** that runs at module load, under a root-owned `/app/server` (mode 755).
- **`services/advanced/zeroTrustService.ts:12`** — `import RE2 from 're2'`. The Dockerfile
  installs with **`--ignore-scripts`**, which skips the install script that compiles the native
  binding, and **re2 ships no prebuilt binary** (its published `files` list has no `build/`).

**Rules that prevent the whole class:**
- **Never do filesystem work, env-var assertions, or native-module-dependent work at module
  load.** Constructors of module-level singletons run at `import`. Make it lazy (first use),
  fail-soft (`logger.warn` + fallback), or delete it if the paths are never read.
- **The Dockerfile must create and `chown` every runtime-writable path before `USER`.** Every
  `COPY` lands root-owned; there is no implicit chown.
- **`--ignore-scripts` requires an explicit `npm rebuild <pkg>` for each native dependency.**
  Add the toolchain and remove it in the same layer (`apk add --virtual .native-build-deps
  python3 make g++ && npm rebuild re2 && apk del .native-build-deps`) so the image does not grow.
- **Verify a package ships a binary by reading its `files` array — never assume.** A local
  `node_modules` copy proves nothing: it was built by *your* install, which ran the scripts.
- Diagnosing this needs the **`stoppedReason` + the CloudWatch log stream of a stopped task**;
  `describe-services` events only ever say the task exited.

**Deploy-path facts (see the `project-aws-golive-ecs-express` memory for detail):** the local
AWS user has no ECS rights, the Mac is arm64 while the task definition is `X86_64`, and
`aws-actions/amazon-ecs-deploy-express-service` rebuilds `primaryContainer` from its inputs —
so `ci.yml` derives a new task definition revision from the live one and passes
`task-definition-arn` rather than `image`.

### Migration history is 97% fictional — the schema cannot be rebuilt from source (2026-08-05)

Measured, not estimated. `prisma migrate diff --from-empty --to-schema prisma/schema.prisma
--script` (needs no database) emits **283 CREATE TABLE**, 56 CREATE TYPE, 362 ADD CONSTRAINT.
The 11 tracked migration directories create **9 tables**. So `prisma migrate deploy` against an
empty database misses **274 of 283 tables (97%)** — it fails immediately, because
`add_missing_tables.sql`-era tables FK to `Organization`, which no migration creates.

Where the 283 come from:
| Source | Tables |
|---|---|
| Tracked migrations (`migrations/*/migration.sql`) | 9 |
| 15 loose `.sql` files sitting directly in `migrations/` (Prisma never runs these) | 150 |
| **Nothing at all in the repo** — created by `prisma db push` | **124** |

**Do NOT "fix" this by promoting the loose files into migration directories.** That reaches 159
of 283 and the rebuild still fails — the 124 `db push` tables (`Organization`, `User`,
`ComplianceFramework`, `AuditLog`, `ApiKey`, `DataMap`, …) have no SQL to promote.

**The correct fix is a squash-to-baseline**, and it is a maintenance-window job, not a drive-by:
1. Generate the baseline (above) into `migrations/00000000000000_baseline/migration.sql`.
2. Archive the 11 existing migration dirs and the 15 loose `.sql` files — leaving them in place
   makes a fresh replay fail, because e.g. `20241219_add_zero_trust_models` does a bare
   `CREATE TABLE "DeviceTrust"` that the baseline has already created.
3. **RLS is lost by this step.** `migrate diff` reads the Prisma datamodel, which cannot express
   row-level-security policies, so the ~1,000 lines of policy SQL in `20260603_rls_enable_policies`,
   `20260604_enforce_rls` and `rls_policies_all_tables.sql` must be re-added as an explicit
   post-baseline migration or they silently disappear.
4. Baseline production: `npx prisma migrate resolve --applied 00000000000000_baseline`, since it
   already has every table.
5. **Acceptance test — the step that actually proves it:** clean `postgres:16` container →
   `prisma migrate deploy` from empty → then `prisma migrate diff --from-migrations
   ./prisma/migrations --to-schema prisma/schema.prisma` must come back **empty**. Anything else
   means the baseline is wrong. (Blocked on 2026-08-05: host disk at 86% / 2 GiB free, so
   containerd threw `input/output error` on image pull. Needs ~10 GB free to run.)

Ordering facts, if the loose files are ever replayed for archaeology: all 15 are idempotent
EXCEPT `add_uuid_defaults.sql`; `acos_v3_tables.sql` must precede `add_control_loop_features.sql`,
`add_debt_impact_fields.sql`, `add_goal_name_deadline.sql` and `add_uuid_defaults.sql`;
`rls_policies_all_tables.sql` depends on ~130 tables and must run last; `acos_v3_tables.sql`
needs the `uuid-ossp` extension but never creates it (only `add_missing_tables.sql` does).

This does **not** affect the running production database, which has every table. It breaks
disaster recovery, new environments, and CI-from-scratch.

### First successful production deploy — what it actually took (2026-08-07)

`www.complyeasyai.com` went live on run `31136283298`. `/health` returns 200. Everything below
was found the hard way; each item on its own would have failed the deploy.

**GitHub Actions**
- **A run's secrets are snapshotted when the run is CREATED.** A run parked at an approval gate
  can never see a secret rotated afterwards, and **re-running it reuses the same snapshot**. This
  cost two approvals (`S3_BACKUP_BUCKET`, then `SUPABASE_DATABASE_URL`). `ci.yml` now has
  `workflow_dispatch` so a genuinely new run can be started; otherwise you must push a commit.
- `check-deploy-secrets` tests **presence, not validity**. It went green on the run that then died
  with `password authentication failed`. Always prove a rotated credential works before approving.
- After an Actions outage, GitHub does **not** retroactively create runs for events dropped during
  it. Close/reopen the PR (or dispatch) to re-trigger. Check the repo's newest run timestamp, not
  just the status page — the page said `operational` while zero runs were being created.
- Branch protection with `required_approving_review_count: 1` **deadlocks a sole maintainer** —
  GitHub forbids self-approval. Use 0; the value is in the required status checks.

**ECS Express Mode**
- `aws-actions/amazon-ecs-deploy-express-service` **v1.2.2 (latest release) has no
  `task-definition-arn` input** — it exists only on unreleased `main`. Its other inputs rebuild
  `primaryContainer` from scratch, silently dropping every secret and env var and falling back to
  256 CPU / 512 MiB. Deploy with the released CLI instead:
  `aws ecs update-express-gateway-service --service-arn … --task-definition-arn …`, then poll
  `describe-express-gateway-service` until `activeConfigurations[].taskDefinitionArn` contains only
  the new ARN and `status.statusCode == ACTIVE`. `ci.yml` derives each revision from the LIVE task
  definition and swaps only the image, so console-added secrets survive future deploys.

**Supabase / Supavisor**
- **The pooler requires the project ref in the username for EVERY role**, not just `postgres`:
  `postgres.wnvdmaqwlcblcrrvbjmr`, `app_runtime.wnvdmaqwlcblcrrvbjmr`. Without it you get
  `FATAL: (ENOIDENTIFIER) no tenant identifier provided (external_id or sni_hostname required)`.
  The direct host `db.<ref>.supabase.co` is **IPv6-only** and unreachable from Fargate — always
  use `aws-1-us-east-1.pooler.supabase.com:5432` (session mode; transaction mode breaks Prisma's
  advisory locks).
- **`DB_CA_CERT` is mandatory.** `database.ts:122` sets `rejectUnauthorized: isProduction`, and
  Supabase presents a private CA, so without the base64 PEM every connection fails TLS and
  `/health` returns 503 forever while the container stays *alive* — no crash, no obvious signal.
  Worse, `prisma migrate deploy` still succeeds and masks it (Prisma treats `sslmode=require` as
  no-verify, and the migration step uses a different secret).
- **Supabase runs PG17; `ubuntu-latest` ships pg_dump 16**, which refuses to dump a newer server.
  Install `postgresql-client-17` from the PGDG repo and call `/usr/lib/postgresql/17/bin/pg_dump`
  by full path, excluding the `auth`, `storage`, `realtime` and `supabase_migrations` schemas.

**Secrets Manager**
- **`--secret-id` takes the NAME, not the ARN fragment.** The ARN is
  `…:secret:complyeasy/production-CEcbWm:KEY::` where `-CEcbWm` is an AWS-appended random suffix;
  the name is `complyeasy/production`. Passing the suffix gives `ResourceNotFoundException`.
- **The SecretString must be valid JSON or ECS resolves NOTHING.** A missing comma after one key
  broke every `:KEY::` reference at once; the console shows "The secret value can't be converted
  to key name and value pairs" and the task would have died at startup with no application log.
  Diagnose without printing values:
  `… --query SecretString --output text | awk '{q=gsub(/"/,"&"); printf "%2d q=%d comma=%s\n", NR, q, ($0 ~ /,[[:space:]]*$/)}'`
  — every key line wants `q=4` and a trailing comma except the last.

**Field encryption**
- The envelope is now **`enc_v2:<salt>:<iv>:<authTag>:<ciphertext>`**, derived with **HKDF-SHA256**
  and a random per-record salt. `decryptField` still reads legacy `enc_v1:` (PBKDF2 + the literal
  salt `complyeasy-credential-salt`). Note honestly: a per-record salt does NOT defend against
  disclosure of `ENCRYPTION_KEY` — the salt sits beside the ciphertext. Only KMS envelope
  encryption does. Rotating `ENCRYPTION_KEY` makes existing ciphertext undecryptable, and the
  envelope carries no key id, so rotation means re-encrypt or clear the columns.

### RLS is fully wired in code — but the `app_runtime` cutover would break login (2026-08-11)

Verified live against the production database (`wnvdmaqwlcblcrrvbjmr`) with read-only queries.
**Four claims in the 2026-06-02 scope-gap section above are now STALE and are corrected here.**

**What that section got wrong:**

| Claim (2026-06-02) | Measured 2026-08-11 |
|---|---|
| policy reads `current_setting('request.jwt.claims')` | reads **`app.current_org`** — `get_current_organization_id()` is `SELECT current_setting('app.current_org', true)` |
| "no `set_config`/`SET LOCAL` anywhere in `server/src`" | **`config/database.ts:215`** runs ``tx.$executeRaw`SELECT set_config('app.current_org', ${org}, true)` `` |
| "**0/324** tables are `FORCE`d" | **324/324** have RLS enabled; **202** are `FORCE`d |
| RLS file is "inert / 0 `ENABLE ROW LEVEL SECURITY`" | policies are live: `ComplianceFramework` and `RiskItem` each carry 5 `org_isolation*` policies |

The isolation machinery is genuinely built and coherent: `config/orgContext.ts`
(`AsyncLocalStorage`) → `middleware/auth.ts:168` `runWithOrg(user.organizationId, next)` → the
`$allOperations` extension in `config/database.ts:165-221`, which wraps each op in a transaction
that binds the **transaction-local** GUC before querying. `app_runtime` is provisioned and correct:
`rolcanlogin=true`, `rolbypassrls=false`, `rolsuper=false`, 324 SELECT + 324 INSERT grants,
schema USAGE. There is a full `server/prisma/migrations/RLS_DEPLOY_RUNBOOK.md`.

> ⚠️ **DO NOT point `DATABASE_URL` at `app_runtime` yet — it would break authentication site-wide.**
>
> Every `org_isolation_select` policy applies to role `{public}` (so it binds `app_runtime`) with
> `USING ("organizationId" = get_current_organization_id())`. Org context is bound at
> `auth.ts:168`, i.e. **after** authentication — so login's own user lookup
> (`authController.ts:1502`, `prisma.user.findUnique({ where: { email } })`, on the *extended*
> client) runs with **no GUC**. `current_setting('app.current_org', true)` then returns NULL,
> `"organizationId" = NULL` is NULL, and the row is filtered out. Measured on production:
>
> ```
> get_current_organization_id() with no GUC -> NULL
> User          20 rows total ->  0 visible under policy
> Organization  15 rows total ->  0 visible under policy
> (baseline as postgres/BYPASSRLS: 126 ComplianceFramework, 119 RiskItem)
> ```
>
> So under `app_runtime` **every login returns "invalid credentials"**, and rollback costs a full
> Secrets-Manager-edit + ECS-redeploy cycle. The runbook's own Verification section treats
> "0 rows with no org set" as *success* — it never accounts for login being an unauthenticated
> path that must read `User`.

**The remaining work is a code change, not a role swap:** the pre-authentication lookups need an
RLS carve-out. Options, in preference order: (1) a `SECURITY DEFINER` lookup function granted to
`app_runtime` exposing only the columns login needs; (2) a separate `BYPASSRLS` connection used
*only* by the auth controller's pre-auth reads; (3) restricted policies on `User`/`Organization`
permitting an email lookup when no org is bound. Whichever is chosen, audit **every**
unauthenticated path that touches a tenant table — registration duplicate-email checks, password
reset, magic link, email verification, refresh-token lookup — not just login.

Note also that the raw escape hatches (`$queryRaw*`/`$executeRaw*`) are deliberately excluded from
the extension (`database.ts:188-197`), so they get **no** RLS backstop and must keep explicit
`organizationId` filters.

### Audit-backlog re-verification (2026-08-25) — 7 of 8 open findings were STALE

Every open finding from the 2026-06-02 scope-gap section was re-checked against the
working tree. **Seven were already fixed and are corrected here; one is real but has
moved in both directions.** This is the third time the backlog has been found to
overstate open risk — the log records findings but not their remediation, so verify
before acting on anything in it.

| Claim (2026-06-02) | Measured 2026-08-25 |
|---|---|
| `ci.yml`/`mobile.yml` have no top-level `permissions:` → write-all token | **FALSE.** Both declare `permissions: { contents: read }` |
| "no third-party action pinned to a SHA" | **FALSE.** All 20 are SHA-pinned. The one unpinned-looking `uses:` is inside a comment (`codeql.yml:72`) |
| `dependency-scan.yml` runs `npm audit fix --force` unattended | **FALSE.** `dependency-scan.yml:84` documents deliberately NOT doing this; `self-heal-cve.yml:59` uses `npm audit fix --no-audit --package-lock-only`, no `--force` |
| prod nginx mounts non-existent `./nginx/conf.d` → no TLS/server block | **FALSE.** `docker-compose.prod.yml:107` mounts the FILE `./nginx/default.conf` → `/etc/nginx/conf.d/default.conf`. It exists and has both a `:80` and a `:443 ssl` server block with certs |
| ES transport 9300 + datastore/admin ports host-exposed | **FALSE** for `docker-compose.prod.yml`: only `80:80` and `443:443` are published, and the API binds `127.0.0.1:3001:3001` (loopback-only, with a comment explaining why) |
| Falco `privileged: true` | **FALSE.** Replaced with a minimal `cap_add` set (SYS_PTRACE, SYS_ADMIN, SYS_RESOURCE, BPF, PERFMON) |
| `deploy.sh` still pushes/deploys `:latest`; `cmd_full` broken because `cmd_infra` passes no `--context imageTag` | **FALSE.** `deploy.sh:86` derives an immutable tag from `git rev-parse --short HEAD`, and `cmd_infra` DOES pass `--context imageTag` (`:96`) |
| CodeQL backlog 155 open (24 critical / 103 high) | **Moved both ways.** Live: **1110 open** — security-severity **1 critical / 201 high / 287 medium / 1 low**, plus 620 quality (note/warning). Criticals fell 24→1; highs rose 103→201 |

**The one remaining CRITICAL is a false positive in the sanitizer itself.**
`js/request-forgery` at `utils/urlValidator.ts:249` flags the `fetch()` inside
`safeFetch` — the line immediately after `isUrlSafe()` and
`await assertResolvedHostIsPublic()`, with `redirect: 'manual'` so each hop is
re-validated. CodeQL cannot recognise project-defined sanitizers, so the SSRF guard
reads as an SSRF sink. Dismiss it in the Security UI, or better, add a CodeQL
sanitizer model for `isUrlSafe`/`assertUrlSafe` — that would also clear a share of
the 75 `js/user-controlled-bypass` and other guard-adjacent highs. Do NOT "fix" the
code; the code is the fix.

### New findings from the same pass (2026-08-25) — none were in the backlog

- **`Docker Build & Push` never runs on pull requests (HIGH).** `ci.yml:477` gates it
  on `github.event_name == 'push'`, so **no PR ever builds the production image**.
  This is why the `re2` breakage below only surfaced after merge, and it means any
  dependency bump affecting the image (native modules, puppeteer/chromium) is
  unvalidated until it is already on `main`.
- **`npm rebuild re2` had no working fallback (HIGH, fixed in #424).** re2 downloads a
  prebuilt from GitHub releases and only compiles locally if that fails. The compile
  path could never succeed — abseil's `direct_mmap.h` includes `<linux/unistd.h>`,
  which musl lacks, and `.native-build-deps` carried only `python3 make g++`. Every
  image build was a coin flip against a third-party CDN. Fixed by adding
  `linux-headers`; verified both ways with `RE2_DOWNLOAD_FORCE_BUILD=1`.
- **`fast-xml-parser` was an undeclared dependency (HIGH, fixed in #425).**
  `routes/sso.ts:20` imports it; no manifest declared it. It resolved only as a
  hoisted transitive of `@aws-sdk/xml-builder`, so an AWS SDK bump deleted it — which
  is what broke #420.
- **PRs opened by GitHub Actions can never merge.** Actions-created PRs do not trigger
  `pull_request` workflows, so required checks never report (observed on #398, which
  had only the mobile workflow's checks). Workaround: close and reopen the PR, which
  fires `reopened` and runs CI. A durable fix needs a PAT/App token in the workflow
  that opens them.
- **`.github/dependabot.yml` referenced four labels that did not exist** (`backend`,
  `ci`, `docker`, `frontend`; only `dependencies` existed), so Dependabot could never
  apply area labels and posted an error on every dependency PR. Labels created.
- **Grouped Dependabot PRs bundled majors with patches (fixed in #428).** One breaking
  major made the whole batch unmergeable: #420 carried 47 AWS SDK patches plus
  `stripe 21→22.5` and `googleapis 171→176`. Groups are now restricted to
  minor/patch; majors get individual PRs.
- **codeql-action bumps split across PRs (fixed in #442).** CodeQL refuses to run when
  `init` and `analyze` differ: `Loaded a configuration file for version '4.36.3', but
  running version '4.37.8'`. Confirmed live on #434 (the #340 log had expired, so
  #426 could only call it likely). A `codeql-action` group now keeps all four
  references together.
- **Expo SDK 57 must not be taken piecemeal (held in #443).** Dependabot proposes
  `expo`, `jest-expo` and `expo-status-bar` to 57 while `expo-secure-store` stays on
  56 and no `react-native` bump is offered; expo's peers are all `*`, so npm cannot
  reject the mismatch. Note the trap: #431 (jest-expo alone) FAILED CI but #436 (expo
  alone) PASSED — and `Build iOS`/`Build Android` are skipped on PRs, so a green check
  is not evidence an SDK major is safe.

### Production sign-up outage, demo form, status page, staging and frameworks (2026-09-05)

Diagnosed from live probes of www.complyeasyai.com; every cause verified at the cited line.

- **New-user sign-up was 100% broken (HIGH, fixed #465).** `authController.verifyCaptcha` threw 503
  `CAPTCHA verification unavailable` whenever `NODE_ENV=production` and no `HCAPTCHA_SECRET`/`RECAPTCHA_SECRET`
  was set — and none is set anywhere, while the web client has **no CAPTCHA widget at all** (never sends
  `captchaToken`). Existing users were unaffected (the check is skipped for known emails), which is why it
  went unnoticed. CAPTCHA is now opt-in (`CAPTCHA_REQUIRED=true` fails closed). It remains a half-built
  control: shipping it needs the hCaptcha widget + site key + secret.
- **CloudFront rewrites EVERY API 403/404 into the SPA shell with a 200 (HIGH, #479).** The distribution's
  custom error responses (`403`/`404 → /index.html`) are distribution-wide, so they also apply to the
  `/api/*` and `/health` behaviours: `GET /api/anything-unknown → 200 text/html`, and a CSRF 403 on
  `POST /api/demo/request` arrived as HTML — hence `Unexpected token '<'` on the demo form. Fix: decide
  "prerendered page vs SPA shell" per request in the viewer-request CloudFront Function (route set generated
  from `scripts/publicRoutes.mjs` by `npm run sitemap` → `infrastructure/prerendered-routes.json`) and delete
  the error responses. **The live distribution `E4CUOI17YEQ7E` has drifted from the CDK `FrontendStack`**
  (`/ws/*` was added by hand) — apply via console/CLI per `docs/CLOUDFRONT_API_ERROR_PASSTHROUGH.md`; do NOT
  `cdk deploy ComplyEasy-Frontend`. Also: `infrastructure/.gitignore` ignores `*.js`, so the function source
  had to be un-ignored (`!cloudfront/*.js`), and `String.replace` substitutes only the FIRST occurrence — a
  placeholder that also appears in a comment ships the bare identifier (now guarded by a hard failure + test).
- **Demo form contract drift (fixed #466).** `submitDemoRequestSchema` is `.unknown(false)` but omitted 8 fields
  `DemoBookingForm` sends and the controller persists (`industry`, `country`, `interestedTier`, `currentChallenge`,
  `howDidYouHear`, `utm*`) → every submission 400. Separately, `services/api.ts` cached the CSRF token forever
  while the server issues it with a 1-hour cookie → 403 after an hour, never retried. Now: 50-min TTL, one
  fresh-token replay on a CSRF 403, and a readable error when an `/api` path returns `text/html`.
- **Status page (fixed #467).** Fetched `/api/health` (never existed) and expected a `services` array; the probe
  is `/health` and reports a `checks` map. Now derives components from `checks`, reads the body on 503 too,
  and shows `—` where nothing is measured (no fabricated per-service uptime).
- **Compare section removed (#473).** Nav dropdown, footer column, 5 `/compare/*` routes + pages,
  `SignalCompetitorPage`, `data/competitorPageContent.ts`, `data/comparisons.ts` (never imported); `/compare/*`
  redirects to `/platform`. Incidental: the committed `public/sitemap.xml` was stale (40 routes, missing 13
  live pages) — the build regenerates it, only the checked-in copy lagged.
- **Staging did not exist (#480).** No environment, secrets, DNS, Supabase project or AWS resources; the old
  `deploy-staging` was gated on a `develop` branch nobody pushes to. `main` now runs
  staging → **full E2E** → `approve-production`, gated on `check-staging-config`; inert until
  `STAGING_SUPABASE_DATABASE_URL`/`STAGING_S3_FRONTEND_BUCKET`/`STAGING_CLOUDFRONT_DISTRIBUTION_ID` exist
  (`approve-production` allows `e2e-staging` = success OR skipped). Runbook `docs/STAGING_ENVIRONMENT.md`.
  Staging DB is dropped + `db push`ed every deploy (`migrate deploy` cannot rebuild the schema — see the
  migration-history section). Prod runs **ECS Express Mode**, not the CDK ALB stack — mirror the live topology.
  Real-session E2E on staging depends on #465 (registration would otherwise 503).
- **Frameworks (#482).** AIUC-1 was absent; `'DPDPA'` in the registry is **Delaware**; India existed only as a
  4-control `PDPB` stub named after the superseded 2019 Bill. Added AIUC-1 (48 controls, 6 pillars — wording
  paraphrases the standard; verify before certification use) and `'India DPDPA'` (44 controls citing Act
  sections + DPDP Rules 2025), 151 crosswalk mappings. **The bare `DPDPA` key stays Delaware**:
  `ComplianceFramework.name` is a free string resolved via `FRAMEWORK_ALIASES`, so renaming it would orphan
  customer frameworks; `PDPB`/`DPDP Act`/… alias to India. The UI catalogue is backend-driven
  (`GET /api/frameworks/templates`). New `controlCrosswalk.integrity.test.ts` found **25 pre-existing dead
  mappings — every `ISO 27017` row** uses `ISO27017-CLD.x.y` ids while the template uses `ISO27017-5.1.1`
  style; budget pinned at 25 so it can only shrink.
- **A run parked at the production approval gate holds the `main` concurrency slot indefinitely.** Two
  runs left `waiting` at `Approve Production Deploy` since **2026-08-11** and **2026-08-25** silently blocked
  every later `main` run (they showed as `pending` with 0 jobs and no error). Diagnose with
  `gh run list --workflow ci.yml --status waiting --branch main`; cancel superseded waiting runs (nothing has
  deployed yet at that point) and the newest run starts. Related: the daily `self-heal/cve-autofix` runs sit at
  `action_required` (bot-authored PRs need "Approve and run"), so that workflow's CI has effectively never
  executed — 20 such runs since 2026-08-10.
- **Small traps hit:** `no-new-func` blocks `new Function` in tests — evaluate generated code with
  `node:vm.runInNewContext`; the Supabase bot's "no changes in supabase directory" review comment (relayed by
  Autofix on every PR) is informational noise; `gh pr merge` fails "Head branch is out of date" only
  transiently during a Dependabot rebase (the ruleset's `strict` flag is false).

### Addendum — later in the 2026-09-05 session (ZK mirrors, lint traps, PAT, what is still open)

- **Every production deploy depends on an experimental feature's third-party download (HIGH, fixed #484).**
  `Docker Build & Push` runs `Generate ZK proving keys` → `setup-circuits.sh`, which fetched
  `powersOfTau28_hez_final_12.ptau` from public mirrors. On 2026-09-05 all of them were dead at once
  (`storage.googleapis.com/zkevm/ptau` → 403; the snarkjs raw path never hosted it; `cloudflare-ipfs.com`
  is shut down; the Hermez S3 bucket and every IPFS gateway fail) and the consolidated deploy run 33995562596
  failed there — the same step had passed on 2026-08-25. The verified file (SHA-256 pinned in
  `server/src/zkp/checksums.sha256`; a local copy lives gitignored at `server/src/zkp/…ptau`) is now a
  **release asset of this repo, tag `zk-ptau-hez-12`** (prerelease, not "latest"), tried first; the pin is
  still enforced, `PTAU_URL` overrides. Because `Docker Build & Push` never runs on PRs, this class of
  failure can only be seen after merge.
- **GitHub concurrency has two different behaviours.** A newly queued `main` run auto-cancels the previous
  *pending* run, but a run *waiting* at the `production-approval` gate is never cancelled and holds the slot —
  so later runs sit `pending` with 0 jobs and no error. Runs from 2026-08-11 and 2026-08-25 did exactly that.
  `gh run list --workflow ci.yml --branch main --status waiting`, then cancel the superseded ones.
- **Lint traps hit while landing #479:** (1) the `__PRERENDERED_ROUTES__` placeholder in
  `infrastructure/cloudfront/route-rewrite.js` must appear exactly once — `String.replaceAll` at render time
  substitutes it everywhere, so even a `/* global __PRERENDERED_ROUTES__ */` directive becomes an invalid
  globals comment in the rendered copy; the identifier and CloudFront's `handler` entry point are declared in
  a scoped ESLint block for `infrastructure/cloudfront/*.js` instead. (2) `no-new-func` rejects `new Function`
  in tests — evaluate generated code with `node:vm.runInNewContext`. (3) A local `tsc` in `infrastructure/`
  leaves `infrastructure/dist/**/*.js`, which made local `npx eslint .` fail with 43 `no-undef` errors while
  CI (clean checkout) was green; `infrastructure/dist/**` and `cdk.out/**` are now in the ESLint ignores.
  Reproduce CI's lint with `npx eslint .` — the flat config ignores `--ext`.
- **Expired fine-grained PAT "ComplyEasyAI Github Token".** It is referenced by **no** workflow (they use
  `GITHUB_TOKEN`/`EXPO_TOKEN`/`CODECOV_TOKEN`), no Actions or Dependabot secret, and not by the local `gh`
  session (OAuth `gho_`). The only PAT-shaped consumer in the codebase is
  `services/advanced/complianceAsCodeService.ts:777` reading `process.env.GITHUB_TOKEN` to post check-run
  statuses for the Compliance-as-Code gate (`.env.example`: `YOUR_GITHUB_PAT`, optional). It fails soft
  (`logger.warn` and skip) when missing, so expiry degrades that feature only. Rotate it wherever
  `GITHUB_TOKEN` is set for the runtime — Secrets Manager `complyeasy/production` (if the task definition
  references it) and/or `server/.env` — and redeploy so ECS re-injects the secret.
- **Supabase `preview branches` bot** comments "no changes detected in `supabase` directory" on every PR; the
  desktop Autofix relays each one. They are informational; disable in Supabase → Project Integrations if unwanted.
- **Merged this session:** #441 #442 #443 #444 (Aug), #465 #466 #467 #473 #479 #480 #482 #483; #484 (ZK) pending.
- **#479 broke the production image build (found 2026-09-07, after merge, fixed #489).** `npm run build`
  chains `npm run sitemap`, which #479 extended with `scripts/export-prerender-manifest.mjs` — and that
  script writes into `infrastructure/`. The Dockerfile's `frontend-build` stage `COPY`s a curated list of
  directories that has no `infrastructure/`, so the image build died with `ENOENT
  /app/infrastructure/prerendered-routes.json` on the first `main` run after #484 un-stuck the ZK step.
  The script now skips (exit 0, with a message) when the CloudFront template is absent and `mkdir -p`s
  otherwise. Third instance of the same class (re2, fast-xml-parser, this): **`Docker Build & Push` never
  runs on PRs**, so anything the image build does differently from a full checkout is only tested on
  `main`. Reproduce locally without Docker by copying exactly the Dockerfile's `COPY` list into a temp dir,
  symlinking `node_modules`, and running the failing `npm run …` there.
  **Still not applied:** the CloudFront live change (#479 is in the repo; the distribution needs the console/CLI
  edit — IAM grant for `complyeasy-s3-user` was still missing at session end). **Still open (user):** staging
  provisioning; the 25 dead ISO 27017 crosswalk rows (ids `ISO27017-CLD.x.y` vs template `ISO27017-5.1.1`);
  AIUC-1 wording review against the official text; the daily `self-heal/cve-autofix` runs stuck at
  `action_required`.

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
- API service (frontend): `services/api.ts` (the Vite frontend source lives at the **repo root** — `services/`, `contexts/`, `components/`, `hooks/` — NOT under a `src/` dir; the `@` alias in `vite.config.ts` resolves to the repo root. Corrected 2026-07-14; prior `src/services/api.ts` was wrong.)
- Deep-scan file list: `.claude/deep-scan/filelist.txt`
- Scan-runner (lightweight triage helper, fixed): `.claude/skills/productions-readiness-audit/scripts/Production Readiness scan-runner.sh`
