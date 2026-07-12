# ComplyEasyAI — Production-Readiness Report

**Date:** 2026-07-12
**Status:** **PARTIAL** — static deep scan (D1/D2/D5) + E2E-in-CI (D6) completed this session; the live-stack dynamic phases (D3 runtime smoke, D4 load, D7 full local E2E) were **NOT run** (require a local Docker E2E stack; the 8 GB host OOMs on full-suite local runs — see Dynamic Phases). Findings below are static-analysis-grade unless cited against a live run.

---

## Post-scan remediation & corrections (2026-07-12, orchestrator-verified)

Applied and verified against a clean-room `npm ci` baseline (not drifted `node_modules`):

- **H1–H5 (5 frontend CSRF prod-403 bugs) — FIXED.** `ComplianceCalendar`, `BusinessImpactAnalysis`, `BrandingSettings` (incl. FormData uploads), `CertificationTracker`, `ExceptionManagement` now route mutations through `csrfFetch`. Root `tsc` clean.
- **H6 (`fast-xml-parser` "build blocker") — FALSE POSITIVE / WITHDRAWN.** Verified the correct way per CLAUDE.md (`rm -rf node_modules && npm ci` then `require.resolve`): it resolves to `node_modules/fast-xml-parser/lib/fxp.cjs`, and a clean-room server `tsc --noEmit` is **0 errors**. The reported TS2307 came from a **drifted local `node_modules`** (the lockfile-grep trap CLAUDE.md warns about); main CI Lint&TypeCheck is green because CI uses a clean `npm ci`. The 2 stripe `apiVersion` D1 errors were the same drift artifact and also vanish clean-room.
- **H7 (10 HIGH server CVE advisories) — 9 FIXED, 1 unfixable.** `npm audit fix` (NON-`--force`, in-range only) on the clean lock: server **46→30** advisories, **HIGH 10→1**. Fixed non-breaking: `multer 2.2.0`, `undici 7.28.0`, `form-data 4.0.6`, `hono`, `protobufjs 7.6.5`, `@grpc/grpc-js 1.14.4`, `ws 8.21.0`, `engine.io`, `engine.io-client`, `socket.io-adapter`. Verified: server `tsc` clean, `npm run build` clean, 64 websocket/upload/middleware unit tests green. **Only lockfiles changed (no `package.json`).** Root: **1 moderate (js-yaml) → 0**.
- **Remaining 1 HIGH + moderates/lows = known-unfixable (need breaking majors, NOT applied):** `ws@8.18.0` via `circomlibjs`→`ethers@5` (ZK/circom toolchain); `aws-sdk` v2→v3; `exceljs` major; `mocha`/`serialize-javascript`/`js-yaml` via circom; `fabric-network`/`fabric-common`/`elliptic`; `@azure/graph`/`ms-rest-js`/`uuid` (no fix); `@opentelemetry/*` via `elastic-apm-node`.
- **Sentry (21 issues) — triaged against current code; 0 live unfixed bugs.** Root cause of the noise fixed: `errorTrackingMiddleware` captured all errors incl. 4xx → gated to 5xx-only; removed the 500 double-capture in `errorHandler.ts`; fixed the real register-500-on-email-failure bug (`authController.ts`). 135 unit tests green.

---

## Executive Summary

A findings-driven deep read of the hand-written codebase (130 batch agents + 9 specialist tracks: dynamic, CodeQL, RLS, containers, supply-chain, secret-sweep, test-rot, CSV) produced **163 merged, de-duplicated findings**:

| Severity | Count |
|---|---|
| HIGH | 10 |
| MEDIUM | 45 |
| LOW | 74 |
| INFO | 34 |
| **Total** | **163** |

### Top themes

1. **Frontend CSRF omission (5 HIGH + supporting MED/LOW).** Five components (ComplianceCalendar, BusinessImpactAnalysis, BrandingSettings, CertificationTracker, ExceptionManagement) fire cookie-authed mutating `fetch()` calls with **no `X-CSRF-Token`** → global `csrfProtection` returns **403 in production**. Same bug class fixed 2026-06-14 for Incident/Asset management; these components were missed. No E2E CSRF guard covers `/api/calendar`, `/api/bia`, `/api/branding`, `/api/certifications`, `/api/exceptions`.
2. **DB-layer RLS is authored but inert at runtime (2 HIGH).** The accessor + `ENABLE`/`FORCE` + 202 `org_isolation` policies are correct, but (a) they live in a loose `.sql` file that `prisma migrate deploy` never applies, and (b) the app connects as the Supabase `postgres` (BYPASSRLS + table-owner) role. Tenant isolation is therefore **100% application-layer** with zero DB defense-in-depth — and customer-facing DPA/README docs **claim RLS is enforced** (doc-vs-code drift).
3. **Build blocker: `fast-xml-parser` unresolvable (1 HIGH).** `sso.ts:20` imports it, but it is a self-referential `overrides` entry with **no direct dependency** and is not installed → `tsc` TS2307 + `require.resolve` MODULE_NOT_FOUND under clean `npm ci`. This is the recurring #316/#327 issue, inverted.
4. **Stale committed lockfile ships 10 NEW HIGH advisories (1 HIGH).** `server/package-lock.json` is one patch behind fixed versions for `multer`, `form-data`, `undici`, `ws`, `hono`, `protobufjs`, `@grpc/grpc-js`, `engine.io`. All `fixAvailable=true`, non-major; local `node_modules` already proves the patched versions build.
5. **Deployment/monitoring config gaps (1 HIGH + MED).** `docker-compose.security.yml` bind-mounts a non-existent Grafana provisioning path (dashboards never load); Alertmanager references missing Slack templates.
6. **CodeQL backlog is large and ungated (D5).** ~1,151 open alerts per the raw code-scanning query; the reconciled open set is 155 (24 critical / 103 high). The dominant critical theme — `js/request-forgery` in `patValidationService.ts` — is a **verified false positive** (guarded by `safeFetch`/`isWebhookUrlSafe`), but real HIGHs remain (ReDoS, path-injection, loop-bound-injection, incomplete XSS sanitization, GraphQL type-confusion).
7. **Mock/fabricated data presented as live (MED/LOW).** GraphQL `runMonitor` returns hardcoded pass; NIS2/ESG/ComplianceScoreForecasting render demo fixtures as real org data.
8. **Go-live is blocked by missing CI secrets** (see Dynamic Phases) — the single hard blocker.

---

## HIGH Findings (full detail)

### H1 — Frontend CSRF: ComplianceCalendar mutations omit `X-CSRF-Token`
- **File:** `components/ComplianceCalendar.tsx:160`
- **Evidence:** `getAuthHeaders()` (L160-162) returns only `{ 'Content-Type': 'application/json' }` — no `X-CSRF-Token` — and is passed to raw `credentials:'include'` mutations to `/api/calendar/deadlines*`: POST/PUT save (L258), DELETE (L274), PATCH complete (L285). Route mounted `server/src/index.ts:655`. Global `csrfProtection` (`index.ts:384`) enforces the double-submit token for all cookie-authed mutating `/api/*` requests → every one returns **403 "CSRF token missing"** in prod.
- **Fix:** Route all four mutations through `csrfFetch` from `services/api.ts` (or attach `getCsrfToken()` as `X-CSRF-Token` in `getAuthHeaders` on mutating methods), mirroring the 2026-06-14 fix in `IncidentManagement.tsx`/`AssetManagement.tsx`.

### H2 — Frontend CSRF: BusinessImpactAnalysis mutations omit `X-CSRF-Token`
- **File:** `components/BusinessImpactAnalysis.tsx:128`
- **Evidence:** `getAuthHeaders()` (L128-130) returns no `X-CSRF-Token`; used on raw cookie-authed mutations to `/api/bia/processes*`: POST/PUT save (L186), DELETE (L202). Route mounted `index.ts:657`. Global `csrfProtection` → 403 in prod. No E2E CSRF-regression guard covers `/api/bia`.
- **Fix:** Send mutations via `csrfFetch` (`services/api.ts`) or attach `X-CSRF-Token` from `getCsrfToken()` on POST/PUT/DELETE.

### H3 — Frontend CSRF: BrandingSettings save/reset/logo-upload omit `X-CSRF-Token`
- **File:** `components/BrandingSettings.tsx:74`
- **Evidence:** Local `apiFetch` (L74-82) attaches no `X-CSRF-Token`; used for PUT `/api/branding/config` (L232) and POST `/api/branding/reset` (L252). Two raw multipart `fetch(${API_BASE}/upload, {method:'POST'})` uploads (L191, L206) also attach no token. Route mounted `index.ts:672`. All cookie-authed → 403. **multipart/form-data is NOT CSRF-exempt.**
- **Fix:** Have `apiFetch` attach `getCsrfToken()` as `X-CSRF-Token` on mutating methods, and replace the two raw `/upload` POSTs with `csrfFetch`.

### H4 — Frontend CSRF: CertificationTracker create omits `X-CSRF-Token`
- **File:** `components/CertificationTracker.tsx:91`
- **Evidence:** Local `apiFetch` (L91-98) does `fetch(url, { credentials:'include', ...options })` with no `X-CSRF-Token`; used for POST create (L239) against `/api/certifications` (route `index.ts:659`). Cookie-authed → `csrfProtection` 403 in prod. No E2E guard covers `/api/certifications`.
- **Fix:** Attach `X-CSRF-Token` from `getCsrfToken()` for POST/PUT/PATCH/DELETE inside `apiFetch`, or route the create through `csrfFetch`.

### H5 — Frontend CSRF: ExceptionManagement create omits `X-CSRF-Token`
- **File:** `components/ExceptionManagement.tsx:107`
- **Evidence:** Local `apiFetch` (L107-114) `fetch(url, { credentials:'include', ...options })` with no token; POST create (L234) against `/api/exceptions` (route `index.ts:658`). Cookie-authed → 403 in prod. No E2E guard covers `/api/exceptions`.
- **Fix:** Attach `X-CSRF-Token` from `getCsrfToken()` on mutating methods in `apiFetch`, or use `csrfFetch`.

### H6 — Build blocker: `fast-xml-parser` cannot resolve (`sso.ts`)
- **File:** `server/src/routes/sso.ts:20`
- **Evidence:** `import { XMLParser } from 'fast-xml-parser'` → **TS2307 + `require.resolve` MODULE_NOT_FOUND + `node_modules/fast-xml-parser` absent**. `server/package.json` has NO direct dep, only a self-referential `overrides['fast-xml-parser']`. The only lock dependent is `@aws-sdk/xml-builder` (nested, not hoisted), so the top-level import cannot resolve. **REAL under clean `npm ci`** (recurring #316/#327, inverted). SAML metadata parsing is broken at build time.
- **Fix:** Add `fast-xml-parser` as a direct dependency in `server/package.json` (`^5.x`), remove the self-referential `overrides` entry, regenerate the lockfile, verify with `require.resolve('fast-xml-parser')` in a clean-room `npm ci`.

### H7 — Stale committed server lockfile ships 10 NEW HIGH CVE advisories
- **File:** `server/package-lock.json` (D2 track)
- **Evidence:** `npm audit` on the committed lock (what CI `npm ci` ships) reports **10 HIGH / 21 moderate / 15 low (46 total)** — up from the 0-HIGH 2026-06-01 baseline. Affected direct/transitive packages, all `fixAvailable=true` and **non-major**: `multer` (2.1.1→2.2.0, upload DoS), `form-data` (4.0.5→4.0.6, CRLF injection), `undici` (7.25.0→7.28.0, TLS-validation bypass + Set-Cookie injection + cache disclosure), `ws` (8.20.1→8.21.0, memory disclosure — this branch is fixable, distinct from the known-unfixable ethers `ws` branch), `hono` (4.12.19→4.12.26, IPv6 deny-bypass + path traversal), `protobufjs` (7.5.9→7.6.4, prototype pollution + Any DoS), `@grpc/grpc-js` (1.14.3→1.14.4, malformed-request crash), `engine.io`/`engine.io-client`/`socket.io-adapter`. Local `node_modules` **already carries the patched versions**, proving drop-in compatibility.
- **Fix:** Regenerate `server/package-lock.json` (`npm update multer form-data undici ws hono protobufjs @grpc/grpc-js engine.io engine.io-client socket.io-adapter` or `npm audit fix`) and **commit it** so CI `npm ci` installs the already-verified patched versions. Re-run `npm audit` clean-room for authoritative post-fix numbers.

### H8 — Runtime RLS inert: app connects as BYPASSRLS / table-owner role
- **File:** `infrastructure/scripts/deploy.sh:261` (+ `RLS_DEPLOY_RUNBOOK.md`)
- **Evidence:** The RLS apparatus (accessor + `ENABLE` + per-table `org_isolation` + `FORCE`) is correctly authored, but RLS only bites if the app's runtime role is subject to it. `deploy.sh:261` documents the prod `DATABASE_URL` as the Supabase `postgres` pooler role, which has **`BYPASSRLS=true` and owns the tables**. `RLS_DEPLOY_RUNBOOK.md` L53-76 acknowledges this and makes the least-privilege `app_runtime` (NOBYPASSRLS, non-owner) cutover its Step 2/Step 4 — but **no code, env file, secret template, or deploy artifact in the repo creates or switches to that role**. DB-layer tenant isolation is therefore not enforced at runtime.
- **Fix:** Execute runbook Steps 2 & 4: create a NOBYPASSRLS, non-owner `app_runtime` role and point the app's `DATABASE_URL` secret at it (keep a separate owner/BYPASSRLS string for migrations only). Until committed to the pipeline/secrets, do **not** rely on DB RLS for isolation.

### H9 — RLS policies live in a loose `.sql` file `prisma migrate deploy` never applies
- **File:** `server/prisma/migrations/rls_policies_all_tables.sql:1`
- **Evidence:** The file is **not** inside a numbered migration directory. `deploy.sh:184` runs `npx prisma migrate deploy`, which only applies `prisma/migrations/<timestamp>_<name>/migration.sql`. Grep over `*.sh`/`*.yml`/`*.ts`/`package.json` finds **zero references** to this file, so the accessor `public.get_current_organization_id()`, the `ENABLE ROW LEVEL SECURITY` statements, and the 202 `org_isolation` policies are only applied if a human runs it by hand (runbook Step 0). Worse, the later `20260604_enforce_rls` migration `FORCE`s RLS assuming these exist.
- **Fix:** Promote it into a numbered Prisma migration sorting **before** `20260604_enforce_rls` (e.g. `20260603_rls_enable_policies/migration.sql`) so `prisma migrate deploy` applies accessor + ENABLE + policies, then FORCE, deterministically from source. Add a post-deploy check asserting `pg_policies` has an `org_isolation` policy on every tenant table.

### H10 — Grafana provisioning bind-mount points at a non-existent host path
- **File:** `docker-compose.security.yml:164`
- **Evidence:** Grafana mounts `./infrastructure/monitoring/grafana/provisioning:/etc/grafana/provisioning:ro`, but that directory does not exist (`infrastructure/monitoring/` holds only `alert_rules.yml`, `alertmanager.yml`, `prometheus.yml`). Docker creates an empty root-owned dir for the missing bind path, so Grafana starts with **no provisioned datasources/dashboards** — the advertised security/monitoring dashboards never load; the RO mount can also break under rootless/SELinux daemons.
- **Fix:** Create `infrastructure/monitoring/grafana/provisioning/{datasources,dashboards}/*.yml` (Prometheus datasource + dashboard providers), or remove the volume line until the provisioning content is committed. Do not ship a compose file mounting a repo-absent path.

---

## MEDIUM Findings (45) — grouped

| Group | Count | Representative (file:line) |
|---|---|---|
| Supply-chain (unverified circom/PoT/artifact downloads, no checksum/signature) | 6 | `server/src/zkp/setup-circuits.sh:60` |
| Multi-tenant isolation gaps (caller-supplied ids / unscoped reads at service layer) | 5 | `server/src/services/issueManagementService.ts:33`; `advanced/agenticAIService.ts:227`; `config/database.ts:196` (raw `$queryRaw`/`$executeRaw` skip org-GUC txn) |
| Additional CSRF (raw-fetch / contract mismatch beyond the 5 HIGH) | 4 | `components/CertificationTracker.tsx:91`; `components/ExceptionManagement.tsx:108` |
| Doc-vs-code drift (DPA claims RLS enabled; ZK entropy guide stale) | 3 | `legal/DPA_TEMPLATE.md:162`; `server/src/zkp/QUICKSTART.md:116` |
| Deployment config (missing Alertmanager Slack templates; secrets on argv) | 3 | `infrastructure/monitoring/alertmanager.yml:126`; `infrastructure/scripts/deploy.sh:169` |
| CodeQL genuine HIGH classes (ReDoS ×7, path-injection, loop-bound-injection ×6, weak-hash, insecure-randomness) | ~6 | `controllers/authController.ts:1038` (polynomial ReDoS); `advanced/byokService.ts:699` (path-injection); `advanced/evidenceTruthLayerService.ts:1523` (loop-bound); `routes/webhooks.ts:48` (weak hash) |
| GraphQL type-confusion / incomplete XSS sanitizer | 2 | `server/src/graphql/index.ts:245`; `controllers/frameworksController.ts:29` |
| Fabricated/mock data presented as live | 2 | `graphql/resolvers/index.ts:491` (runMonitor hardcoded pass); `components/NIS2Dashboard.tsx:264` |
| Vulnerable deps (moderate, NEW, fixable): dompurify/tar/OTel chain; root js-yaml | 2 | server `dompurify`≤3.4.10, `tar`, `@opentelemetry/core`; root `js-yaml`<3.15.0 |
| node_modules↔lockfile drift + mobile RNTL14 test-only tsc errors | 2 | `mobile/src/**/__tests__/*` (63 test-only errors); META env-integrity |
| CI prompt-injection; SSRF (azureService resourceType); authz (self-service tier change); secrets in logs; misc | ~10 | `.github/workflows/compliance-agent.yml:63`; `integrations/azureService.ts:154`; `validators/organizationSchemas.ts:5`; `blockchain/scripts/deploy.ts:507` |

---

## LOW Findings (74) — grouped

| Group | Count | Representative (file:line) |
|---|---|---|
| Input-validation / tier-gate / authz gaps on specific routes | ~6 | `routes/privacy.ts:2441` (child-consent routes lack validateBody); `routes/acos.ts:155` (dropped tier gate); `middleware/paginationMiddleware.ts:110` (arbitrary `sortBy`) |
| Supply-chain / ZK artifact hygiene (committed `.wasm`/`.r1cs`, unchecksummed PoT, broken smoke test) | ~8 | `zkp/compiled/wasm/compliance_check.wasm:1`; `zkp/setup-circuits.sh:362` |
| Doc-vs-code / security-procedure drift | ~7 | `DEPLOYMENT.md:572` (ENCRYPTION_KEY half required length); `API_DOCUMENTATION.md:170` (JWT-in-body claim); `SECURITY_IMPLEMENTATION_COMPLETE.md:235` |
| Mock/stub/fabricated data presented as live | ~6 | `routes/evidenceCollection.ts:711`; `routes/frameworks.ts:131`; `components/ComplianceScoreForecasting.tsx:1395`; `components/ESGReportingModule.tsx:351` |
| Deployment/container/CSP hardening | ~9 | `Dockerfile:148` (FIPS silently non-functional); `nginx/security-headers.conf:18` (`unsafe-inline` style-src); `index.html:3` (no CSP); `falco/docker-compose.falco.yml:26` |
| Secret hygiene (argv exposure, gitleaks over-exclusion, missing .gitignore, plaintext reset token) | ~7 | `.github/workflows/scheduled-backup.yml:62`; `.gitleaks.toml:28`/`:35`; `infrastructure/.gitignore:1`; `controllers/authController.ts:1396` |
| Multi-tenant isolation (bounded/lower-risk) | ~4 | `services/auditorService.ts:796`; `controllers/risksController.ts:349`; `services/frameworkTemplateService.ts:1850` |
| Shell hardening, schema-FK gaps, dead code, CSV injection, reverse-tabnabbing, incomplete UI, vacuous E2E assertions | ~27 | `server/scripts/compile-circuits.sh:6`; `migrations/20260129_add_onboarding_tables/migration.sql:37`; `components/Frameworks.tsx:655`; `components/ReportBuilder.tsx:325`; `components/AIComplianceCopilot.tsx:906`; `e2e/governance.spec.ts:320`; `e2e/eu-regulations.spec.ts:177` |

---

## INFO Findings (34) — grouped

Mostly documentation drift and confirmed-sound / false-positive classifications kept for the audit trail:

- **Doc-vs-code drift** (~8): stale ZK-entropy claims (`COMPLETE_SETUP_SUMMARY.md:279`), v17 backup asserting RLS "enforced" (`PRODUCTION_READINESS_REPORT.v17-backup.md:322`), API auth-doc drift.
- **CodeQL classifications** (~4): `patValidationService.ts:959` 21 critical `js/request-forgery` = **false positives** (guarded); `index.ts:691` `js/missing-rate-limiting` on GraphQL = false positive; live reconciliation = **155 open** (24 crit / 103 high / 27 med / 1 low).
- **Confirmed-sound / low-risk** (~10): org-scoped enrichment lookups, cross-org benchmarking that samples by design, RLS design soundness, floating pragma in generated Groth16 verifier, Vite dev bind `0.0.0.0`, duplicate i18n JSON keys, audit-log hash using random UUID vs chained hash.
- **CI/config** (~5): Node-version drift risk (CI Node 22 vs Dockerfile `node:22-alpine`), CodeQL workflow correctly configured, port inconsistency in `.env.example`.

---

## Dynamic / Runtime Phases

### D1 — Type check (`tsc --noEmit`) — **RAN**
Source: `.claude/deep-scan/results/track_dynamic.json`.
- **root:** 0 errors (clean).
- **server:** 3 errors — 1 REAL build blocker (`sso.ts:20` `fast-xml-parser` = H6, persists under clean `npm ci`); 2 are **local-drift artifacts** (`featureService.ts:36` / `stripeService.ts:36` Stripe `apiVersion` mismatch because installed `stripe` 22.2.3 drifted ahead of the `~21.0.1` lock — vanish under clean `npm ci`).
- **mobile:** 63 errors, **all in 3 test files only**, caused by installed `@testing-library/react-native` 14.0.0 vs the pinned/held `^13.3.3` (CLAUDE.md holds RNTL at v13). No production source affected; clears under clean `npm ci`.
- **Environment caveat:** local `node_modules` (server + mobile) have drifted **ahead** of the committed lockfiles. `tsc` reads `node_modules` (newer) while `npm audit` reads the committed lock (older/vulnerable = what CI ships). A clean-room `rm -rf node_modules && npm ci` per package is required for authoritative D1/D2 numbers.

### D2 — Dependency audit (`npm audit`) — **RAN**
- **root:** 1 moderate — `js-yaml` <3.15.0 (quadratic-DoS), `fixAvailable=true`, dev/toolchain (NEW vs 0 baseline).
- **server:** **46 total (0 critical, 10 HIGH, 21 moderate, 15 low)** — up from the 2026-06-01 baseline of 29 (0 high). The 10 HIGH are **all NEW, all fixable, all non-major** (see H7); local `node_modules` already carries the patched versions.
- **Known-unfixable** (do NOT re-flag, per CLAUDE.md): `elliptic *`, `ws 8.18/8.17-via-ethers`, `@ethersproject/*`/`ethers` v5, `aws-sdk v2`→`uuid`, `serialize-javascript`-via-mocha-via-circom, `fabric-common`/`fabric-network`. Every remaining unfixable advisory requires a breaking major upgrade.

### D5 — CodeQL (static security) — **RAN (live API reconciliation)**
- **Raw open code-scanning alerts:** ~**1,151** (1 critical / 212 high / 306 medium / 9 low) on the default-branch backlog; CodeQL is defined once (SHA-pinned) but **gates no merge**.
- **Reconciled open set** (track_codeql live query): **155 open** (24 critical / 103 high / 27 medium / 1 low) after deduplication.
- **Top theme:** `js/request-forgery` (SSRF) in `server/src/services/integrations/patValidationService.ts` (21 critical) — **verified false positives** (guarded by `safeFetch` + `isWebhookUrlSafe`); likewise the `sso.ts:184` metadata-fetch critical. Genuine HIGHs remain and are captured as MEDIUM findings above (polynomial ReDoS ×7, path-injection, loop-bound-injection ×6, weak-hash, insecure-randomness, incomplete XSS sanitization, GraphQL type-confusion).
- **Action:** triage is operational (dismiss FPs / resolve TPs in the GitHub Security UI) and not re-derivable from the working tree; add a merge gate.

### D6 — E2E (Playwright, CI) — **GREEN**
Latest `main` CI run **28215322762**: E2E Tests shards **1, 2, 3, 4 ALL success**. PR #292 merged 2026-06-22. Same-origin E2E rework landed; the previously-flaky specs are green under CI's 4-sharded backends + `retries:2`.

### D3 (runtime boot + smoke), D4 (load/perf), D7 (full local E2E) — **NOT RUN this session**
These require standing up the local Docker E2E stack (postgres:16-alpine + redis:7-alpine + built FE/BE + `vite preview`). Per CLAUDE.md, full-suite local E2E **OOM-kills the 8 GB host** (vite preview / chromium crash), so these must be run on a larger host or trusted via CI's per-shard runners. Until D3/D4/D7 run here, boot health, DB-connect, mutating-persistence, p95 latency, and rate-limiter/pool behavior under load are **unverified this session**.

### Go-live blocker (sole hard blocker)
**GitHub Actions secrets `total_count = 0`.** With no repository secrets, the **Deploy to Production** job fails at **Configure AWS credentials** on every commit. This is environmental (missing AWS deploy secrets), not a code defect — but it is the single blocker preventing a green deploy. All other HIGH findings are code/config fixes that do not, by themselves, stop the pipeline from reaching deploy.

---

## Coverage & Methodology

- **Denominator N = 1555** hand-written files (scope per CLAUDE.md; canonical list `.claude/deep-scan/filelist_v2_full.txt` = 1,268 entries + track-routed side-lists).
- **Files read (batch agents reporting a count): 595.** Note: 80 of the 130 batch artifacts emitted findings as a bare JSON array without a `filesRead` field, so the true read count is higher than 595; treat 595 as a conservative floor (~38% by the reported metric).
- **Batches present:** 130 of 131 slots (0–130). **Missing:** batch **129** only (never emitted).
- **Side-lists routed to specialist tracks (excluded from the batch denominator):** CSV data files **159** → `track_csv` (spot-check: **no** formula-injection; only email present is the app's own public contact address); **binaries 12** (e.g. `bin/opa`, committed `.wasm` artifacts) → not source-scanned; **lockfiles 5** → D2 `npm audit`.
- **Exclusion set:** `.claude/`, `.archive/`, `server/src/generated/` (739k-line Prisma client), `dist/`/`build/`/`coverage/`, `zkp/compiled/`+`artifacts/`, binaries, lockfiles (→D2), CSV (→spot-check).

### Anti-recurrence
File selection used a **`git ls-files` DENY-list** (exclude generated/vendored/binary/lockfile/CSV), **not** an extension allow-list. This is the corrected methodology after the historical `filelist.txt` `.ts/.tsx/.js`-only glob silently excluded 88 critical infra files (schema.prisma, `.sql` migrations incl. RLS, Dockerfiles, CI workflows, nginx/monitoring configs). The deny-list guarantees `schema.prisma`, all `.sql`, Dockerfiles, `docker-compose*`, GitHub Actions workflows, deploy `.sh`, and monitoring configs are in-scope — which is precisely how H8/H9/H10 (RLS + Grafana) were caught this pass.

---

*Merged findings: `.claude/deep-scan/results/findings_all.json` (163). Dynamic track: `.claude/deep-scan/results/track_dynamic.json`. Summary: `.claude/deep-scan/results/SCAN_SUMMARY.txt`.*
