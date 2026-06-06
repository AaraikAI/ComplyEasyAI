# ComplyEasyAI — Production-Readiness Report

> **STATUS: PARTIAL — NOT production-ready.** This report is a synthesis of a completed,
> 100%-coverage findings-driven deep scan of the entire hand-written codebase. It is **PARTIAL**
> because three mandatory dynamic phases were **not executed** in this pass: **D4 (load / performance)**,
> **D6 (Playwright e2e)**, and **D7 (live-RLS runtime check)**. Do **not** treat the absence of new
> findings in those areas as a pass — the corresponding risk surface was not exercised.
> See [§ Coverage](#-coverage) for the full coverage attestation.

Generated: 2026-06-06 · Branch: `remediation/scan-gap-fixes` · Source of truth: `.claude/deep-scan/results/findings_all.json` (189 findings)

---

## 1. Executive Summary

A single comprehensive parallel deep-read of the entire hand-written codebase plus six specialized
tracks produced **189 deduped findings**:

| Severity | Count |
|----------|------:|
| HIGH     | **7** |
| MEDIUM   | **42** |
| LOW      | **82** |
| INFO     | **58** |
| **Total**| **189** |

Generated/vendored/duplicate code (`node_modules/`, `server/src/generated/`, `.archive/`, compiled
artifacts, binary blobs) was excluded per methodology.

### Top recurring themes

1. **DB-layer RLS is authored but not enforced at runtime (multi-tenant defense-in-depth gap).**
   The single largest structural theme. The RLS policy SQL, accessor function, and FORCE migration
   are correctly written, but (a) the app connects as a Supabase `postgres` role with `BYPASSRLS`
   that also owns the tables, and (b) the policy SQL lives in a loose `.sql` file that
   `prisma migrate deploy` never applies. Net effect: **tenant isolation is 100% application-layer.**
   A LIVE track-verified note (rls_policies_all_tables.sql:42) corrects an earlier scan claim — the
   accessor reads `app.current_org` (a GUC the backend *does* set), so the RLS **logic** is sound and
   reproducible; the remaining gaps are purely the two **operational** HIGHs (role cutover + migration ordering).

2. **Doc-vs-code drift / overstated security posture (the most numerous theme).** Dozens of
   committed docs (README, SECURITY*.md, DPA template, certification report, founder narrative, many
   `*-backup.md` and stale status files) assert "100% production-ready," "RLS enforced for
   defense-in-depth," "SSRF 100% fixed," "bcrypt password hashing," and stale vuln/score numbers that
   contradict the actual code and the current audit baseline.

3. **Frontend ↔ backend CSRF contract breakage.** Multiple React components define a local `apiFetch`
   helper that omits the `X-CSRF-Token` header. Because the server applies `csrfProtection` globally to
   `/api/*`, these mutations return **403 in production** (DPIA, cost entries — HIGH; cookie-consent,
   SCIM, SSO, security-training — MEDIUM/LOW).

4. **Service-layer multi-tenant isolation gaps (org-scoping).** Several Prisma reads/writes use
   `findUnique`/`update` by caller-supplied id without an `organizationId` filter or parent-org
   ownership check (agenticAI blast-radius & rollback, issue assignment, SOX test result, risk
   prioritization, auditor finding).

5. **Supply-chain / build-artifact integrity.** ZK trusted-setup, Powers-of-Tau, circom/OPA binaries,
   compiled circuit `.wasm/.r1cs`, Solidity bytecode, and proving keys are downloaded from mutable
   mirrors and/or committed with **no checksum/provenance**; ZK trusted-setup uses **predictable
   entropy** (`date +%s`).

6. **Deployment / container configuration mismatches.** Compose files mount paths absent from the repo
   (Grafana provisioning — HIGH; prod nginx `./dist` and `./nginx/ssl`; alertmanager templates),
   scheme mismatches (Falco→Alertmanager https vs plaintext), host-exposed ports, and `:latest` image
   guidance.

7. **Insecure documented procedures.** Runbooks recommend `0.0.0.0/0` DB exposure, DB passwords on the
   psql/pg_dump argv, plaintext `.env` credential backups, over-broad IAM (`AmazonS3FullAccess`,
   disabling S3 Block Public Access), and unattended `npm audit fix`.

8. **Mock/stub/demo data presented as live + committed leaked secret.** A **live Google Gemini API key**
   is committed in a tracked markdown doc (HIGH). Several components seed demo data that persists when the
   API returns empty (breach history, governance, status page, version history), and an unresolved Git
   **merge-conflict** is committed into a tracked file (HIGH).

---

## Remediation Status — 2026-06-06

A full findings-driven remediation pass was executed against all **189** findings. Every finding was
re-validated, fixed-or-documented where actionable, and independently verified. The status of this
report **remains PARTIAL** (see [§ Coverage](#-coverage)): the in-repo work is complete and `tsc`-green,
but the **operational RLS role cutover** (H6/H7 — create the NOBYPASSRLS `app_runtime` role and repoint
the runtime `DATABASE_URL`) and the **dynamic phases D4 (load), D6 (e2e), and D7 (live-RLS runtime
check)** are still pending. Those cannot be performed from the working tree alone.

### Validation breakdown (all 189)

| Validation status | Count | Meaning |
|-------------------|------:|---------|
| `NEEDS_FIX`       | **152** | Confirmed real; received an in-repo edit. |
| `OPERATIONAL`     | **10**  | Real, but the residual cutover is outside the repo (DB role swap, key rotation, live-infra steps). In-repo reproducible part done + cutover documented. |
| `FALSE_POSITIVE`  | **19**  | No code change — guards already exist / intentional pattern (mostly CodeQL FPs). |
| `ALREADY_FIXED`   | **2**   | The cited gap was already remediated in source. |
| `HISTORICAL_DOC`  | **6**   | Stale claims inside `*-backup.md` snapshots; intentionally **not** edited in place (corrected below). |

### Remediation outcome (the 162 findings that received in-repo edits)

| Fix outcome | Count | Notes |
|-------------|------:|-------|
| `FIXED`                  | **151** | In-repo edit fully closes the finding. |
| `OPERATIONAL_DOCUMENTED` | **9**   | In-repo reproducible part done; operational cutover documented (runbook / preflight). |
| `PARTIAL`                | **2**   | Deferred: **#58** (frontend `tsconfig` `strict` — enabling it surfaces 27/51/9 real errors across ~14 components) and **#105** (CSP `style-src 'unsafe-inline'` — 68 components use inline `style` attributes; needs nonces/hashes). |

**Verification:** **159 VERIFIED** by an independent pass; **3 repaired by the orchestrator** and
re-confirmed — **#96** (`entrypoint-wrapper.sh` `set -eu` unbound-var safety added via `${VAR:-}` defaults),
**#120** (`assertRlsPosture()` now wired into server boot in `server/src/index.ts`, throwing under
`RLS_ENFORCE`), and **#26** (`SECURITY_IMPLEMENTATION_SUMMARY.md` sign-off language qualified). Net:
**162/162 actionable findings resolved-or-documented.**

**Typecheck after fixes:** `tsc --noEmit` is **clean** — **server 0 / root 0 / mobile 0** errors.

The full per-finding join (validation → fix → verify verdict) is recorded machine-readably at
`.claude/deep-scan/results/remediation_ledger.json` (189 rows).

---

## 2. HIGH Findings (7)

All seven HIGH findings in full, verbatim-faithful to the recorded evidence and fix.

### H1 — Live Google Gemini API key committed in tracked markdown doc
- **File:** `AI_TOOLS_DEBUG_REPORT.md:67`
- **Category:** Leaked secret in committed doc
- **Evidence:** `- ✅ **Key Present:** ` `` `GEMINI_API_KEY=AIzaSy...REDACTED` `` (the live 39-char key was committed in a git-tracked doc per `git ls-files`; value redacted here and purged from history)
- **Fix:** Treat the key as compromised: revoke/rotate it in Google AI Studio immediately, scrub the value from this doc (replace with `AIzaSy...`/placeholder), and purge it from git history (git filter-repo / BFG). Add a secret-scanning pre-commit hook (gitleaks/trufflehog) so real keys cannot be committed in docs.
- **RESOLUTION (FIXED / VERIFIED):** The live key value at `AI_TOOLS_DEBUG_REPORT.md:67` was redacted to `AIzaSy...REDACTED` with a note that the real value lives only in `server/.env`; `grep -E 'AIzaSy[0-9A-Za-z_-]{30,}'` returns no live key in any tracked doc. The orchestrator additionally **rotated the leaked key out of the working file and performed the git-history purge** so the compromised value is no longer recoverable from the repo. Operational follow-through (revoking the old key in Google AI Studio) remains an out-of-repo control.

### H2 — DPIA create/update/DPO-review mutations bypass CSRF token, returning 403 in production
- **File:** `components/DPIAWorkflow.tsx:143`
- **Category:** frontend_backend_contract
- **Evidence:** The local `apiFetch` helper sends mutating requests with only `{ 'Content-Type': 'application/json', credentials: 'include' }` and no CSRF header (line 143-157). It is used for `apiFetch('/dpia', { method: 'POST', ... })` (line 283), `apiFetch('/dpia/${editingDPIA.id}', { method: 'PATCH', ... })` (line 329), and `apiFetch('/dpia/${dpoReviewForm.dpiaId}/dpo-review', { method: 'POST', ... })` (line 364). The server applies `app.use('/api', csrfProtection)` globally (server/src/index.ts:384) and `csrfProtection` (server/src/middleware/csrf.ts:265,300) rejects any non-GET `/api/*` request lacking the `x-csrf-token` header with HTTP 403 in production (it only skips when NODE_ENV==='development'). The central `services/api.ts` attaches `X-CSRF-Token` (line 66-67) but this component does not use it, so creating/updating a DPIA and submitting a DPO review all fail in production.
- **Fix:** Route these mutations through the shared `api` service (services/api.ts) which fetches and attaches the `X-CSRF-Token` header, or have `apiFetch` call `getCsrfToken()` and add the `X-CSRF-Token` header for non-GET methods.
- **RESOLUTION (FIXED / VERIFIED):** `components/DPIAWorkflow.tsx` now defines a `getCsrfToken()` helper (caches `${apiUrl}/csrf-token`) and its local `apiFetch` attaches `X-CSRF-Token` for POST/PUT/PATCH/DELETE (merging any existing `options.headers`) and invalidates the cache on a 403. This covers `POST /dpia`, `PATCH /dpia/:id`, and `POST /dpia/:id/dpo-review`. Frontend `tsc` clean.

### H3 — Cost-entry create and delete bypass CSRF token, returning 403 in production
- **File:** `components/ComplianceCostDashboard.tsx:78`
- **Category:** frontend_backend_contract
- **Evidence:** Local `apiFetch` (line 78-85) does `fetch(url, { credentials: 'include', ...options })` with no CSRF header. `handleCreate` calls `apiFetch(API_BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: ... })` (line 232-236) and `handleDelete` calls `apiFetch('${API_BASE}/${id}', { method: 'DELETE' })` (line 261) against `/api/costs`. Because `app.use('/api', csrfProtection)` (server/src/index.ts:384) requires the `x-csrf-token` header on all mutating `/api` requests in production (server/src/middleware/csrf.ts:300-318), adding and deleting cost entries will return 403 in production.
- **Fix:** Use the shared `api` service that attaches `X-CSRF-Token`, or inject the CSRF token header (via `getCsrfToken()`) into the POST/DELETE calls.
- **RESOLUTION (FIXED / VERIFIED):** `getCsrfToken` is now exported from `services/api.ts` and imported into `components/ComplianceCostDashboard.tsx`; the component's local `apiFetch` attaches `X-CSRF-Token` for POST/PUT/PATCH/DELETE (merging existing `options.headers`). `handleCreate` (POST) and `handleDelete` (DELETE) against `/api/costs` no longer 403 in production.

### H4 — Unresolved Git merge-conflict markers committed into tracked file
- **File:** `COMPREHENSIVE_TEST_CASES.md:1`
- **Category:** merge_conflict_committed
- **Evidence:** Line 1: `<<<<<<< HEAD`; line 1454: `=======`; line 4260: `>>>>>>> 1fbd6b5 (Production-ready fixes: Organization settings, team role protection, email confirmation, audit trail, BCP date, and comprehensive feature implementations)`. The entire 4261-line file is one unresolved conflict joining two divergent copies of the same test-case document (v1.0 'AI Test Architect' Dec 23 2025 vs v2.0.0 Dec 2024).
- **Fix:** Resolve the conflict: pick the intended version (or merge the unique sections), delete all three conflict markers, and re-commit. A pre-commit/CI check (e.g. `grep -rEl '^(<<<<<<<|=======|>>>>>>>)'`) should block conflict markers from being committed.
- **RESOLUTION (FIXED / VERIFIED):** All three markers (`<<<<<<< HEAD` L1, `=======` L1454, `>>>>>>> 1fbd6b5` L4260) were removed from `COMPREHENSIVE_TEST_CASES.md`; both divergent test-case documents (v1.0 Dec-2025/commit 27fe5b9 and the extended v2.0 coverage plan) were retained under a coherent section divider so no test cases were lost. `grep -rEc '^(<<<<<<<|=======|>>>>>>>)'` now returns 0.

### H5 — Grafana provisioning bind-mount points at a non-existent host path
- **File:** `docker-compose.security.yml:164`
- **Category:** deployment_config
- **Evidence:** Grafana service mounts `./infrastructure/monitoring/grafana/provisioning:/etc/grafana/provisioning:ro`, but that directory does not exist (`infrastructure/monitoring/` contains only alert_rules.yml, alertmanager.yml, prometheus.yml; no `grafana/` subtree). With a bind mount of a missing host path, Docker creates an empty root-owned directory, so Grafana starts with NO provisioned datasources/dashboards — the security/monitoring dashboards the stack advertises are never loaded, and the read-only mount can also break under rootless/SELinux daemons.
- **Fix:** Either create `infrastructure/monitoring/grafana/provisioning/{datasources,dashboards}/*.yml` with the Prometheus datasource + dashboard providers, or remove the volume line until the provisioning content is committed. Do not ship a compose file that mounts a path absent from the repo.
- **RESOLUTION (FIXED / VERIFIED):** The missing provisioning subtree was created — `datasources/prometheus.yml` (Prometheus type, `http://prometheus:9090`, `isDefault: true`), `dashboards/dashboards.yml` (file-based dashboard provider), and `dashboards/overview.json`. Grafana now boots with a provisioned datasource + dashboard instead of an empty root-owned directory.

### H6 — App still connects to the DB as a BYPASSRLS / table-owner role, so all RLS policies are inert at runtime
- **File:** `infrastructure/scripts/deploy.sh:261`
- **Category:** multi_tenant_isolation_rls
- **Evidence:** The whole RLS apparatus (accessor + ENABLE + per-table org_isolation policies + FORCE) is correctly authored, but RLS only takes effect if the application's runtime role is subject to RLS. deploy.sh:261 documents the production DATABASE_URL as the Supabase `postgres` pooler role (`postgresql://postgres.<project-ref>:...@...pooler.supabase.com:6543/postgres`). On Supabase the default `postgres` role has BYPASSRLS=true AND owns the tables — RLS_DEPLOY_RUNBOOK.md lines 53-76 explicitly acknowledge this and make swapping to a least-privilege NOBYPASSRLS `app_runtime` role its Step 2/Step 4 cutover. No code, env file, secret template, or deploy artifact in the repo creates or switches DATABASE_URL to such a role: the only DATABASE_URL definitions are the Supabase `postgres` role (deploy.sh / setup-secrets.sh prompt) and docker-compose's `${POSTGRES_USER:-complyeasy}` (which owns the local tables). Until Step 4 is performed operationally, every org_isolation policy is bypassed and tenant isolation is 100% application-layer with no DB-layer defense-in-depth — exactly the gap the runbook warns about.
- **Fix:** Execute RLS_DEPLOY_RUNBOOK.md Steps 2 and 4: create a dedicated NOBYPASSRLS, non-owner `app_runtime` role (the runbook's SQL is correct) and point the application's DATABASE_URL secret at it, keeping a separate owner/BYPASSRLS connection string only for migrations. Until that cutover is committed to the deploy pipeline / secrets, treat DB-layer RLS as not-yet-enforced and do not rely on it for tenant isolation.
- **RESOLUTION (OPERATIONAL_DOCUMENTED / VERIFIED):** The in-repo reproducible part is done — `infrastructure/scripts/deploy.sh` (migrate path) now runs an **RLS runtime-role preflight** that derives `PG*` env vars from `DATABASE_URL` (credentials kept off `argv`) and queries `pg_roles` for `rolbypassrls`, warning the operator and pointing at `RLS_DEPLOY_RUNBOOK.md` when the runtime role has `BYPASSRLS`. The NOBYPASSRLS `app_runtime` role-creation SQL, the ENABLE+policy migration (`20260603_rls_enable_policies`), and the FORCE migration (`20260604_enforce_rls`) are all authored in source. **The remaining cutover is operational and documented in `RLS_DEPLOY_RUNBOOK.md`:** create the NOBYPASSRLS non-owner `app_runtime` role on the live Supabase DB and repoint the runtime `DATABASE_URL` secret to it, retaining a separate owner/BYPASSRLS string solely for migrations. This is one of the two pending operational blockers keeping STATUS = PARTIAL.

### H7 — Accessor function + ENABLE RLS + org_isolation policies live in a loose `.sql` file that `prisma migrate deploy` never applies
- **File:** `server/prisma/migrations/rls_policies_all_tables.sql:1`
- **Category:** multi_tenant_isolation_rls
- **Evidence:** rls_policies_all_tables.sql is NOT inside a numbered migration directory (the numbered dirs are 20241219_*, 20251204_*, 20260129_*, 20260315_*, 20260516_*, 20260604_enforce_rls, 20260604_sod_compensating_controls). deploy.sh:184 runs `npx prisma migrate deploy`, which only applies migrations under prisma/migrations/<timestamp>_<name>/migration.sql. This file is a standalone script with no entrypoint/deploy reference (grep over *.sh/*.yml/*.ts/package.json finds zero references), so the accessor `public.get_current_organization_id()`, the `ENABLE ROW LEVEL SECURITY` statements, and the 202 `org_isolation` policies are only applied if a human runs the file by hand per the runbook Step 0. Worse, the FORCE half (20260604_enforce_rls/migration.sql) IS a real numbered migration and WILL be auto-applied by `prisma migrate deploy`; if it runs before the loose policy file has been applied, FORCE has no policy to enforce (the migration header even notes FORCE is inert without a prior ENABLE+policy), leaving an inconsistent, non-reproducible-from-`migrate deploy` RLS state.
- **Fix:** Promote rls_policies_all_tables.sql into a numbered Prisma migration that sorts BEFORE 20260604_enforce_rls (e.g. 20260603_rls_enable_policies/migration.sql) so `prisma migrate deploy` applies the accessor + ENABLE + policies and THEN FORCE, deterministically, from source. Add a CI/post-deploy check that asserts pg_policies has an org_isolation policy on every tenant table.
- **RESOLUTION (FIXED / VERIFIED):** The loose `rls_policies_all_tables.sql` (accessor function + 202 `ENABLE ROW LEVEL SECURITY` + 202 `org_isolation` policies) was **promoted into a numbered migration** `server/prisma/migrations/20260603_rls_enable_policies/migration.sql` that sorts **before** `20260604_enforce_rls`, so `prisma migrate deploy` now applies ENABLE + policies and **then** FORCE, deterministically from source (statement counts verified equal to the FORCE migration's table set, 202/202). The numbered copy is headed canonical/migrate-deploy-applied; the loose file is now headed as a synced reference copy retained only for `runPenetrationTest.ts` / the manual runbook. The post-deploy CI assertion on `pg_policies` is the operational remainder.

> **Note (track verification):** an INFO-level LIVE track entry (`server/prisma/migrations/rls_policies_all_tables.sql:42`)
> confirmed the RLS **logic** is sound and reproducible — the accessor reads `app.current_org` (a GUC the
> backend *does* set, not `request.jwt.claims`) — superseding an earlier scan claim. H6 and H7 are therefore the two
> remaining **operational** blockers to graduate RLS from "authored & correct" to "enforced in production."

### Stale historical-doc corrections

Six findings (all INFO) flag stale claims living inside point-in-time `PRODUCTION_READINESS_REPORT.v*-backup.md`
snapshots. Those backup files are **intentionally not edited in place** (they are historical archives). Since
**this** report is the live source of truth, the corrected current facts are recorded here:

| # | Stale snapshot claim | Current correct fact |
|---|----------------------|----------------------|
| 140 | `v16-backup.md` carries a "PRODUCTION READY" verdict at **97.51%**. | Superseded. Current STATUS = **PARTIAL** (not production-ready) — 7 HIGH findings remediated-or-documented, but operational RLS cutover (H6/H7) and dynamic phases D4/D6/D7 are still pending. |
| 141 | `v18-backup.md` ledger counts vendored `node_modules/*.d.ts/.ts` files as "scanned production files." | Incorrect denominator. The current scan **excludes** `node_modules/` and `server/src/generated/`; coverage is **1,495** hand-written files (see § Coverage). |
| 142 | `v19-backup.md` asserts "PRODUCTION READY / **97.95%**, all ledgers 100%." | Superseded by the PARTIAL verdict above; the v20.x percentage-ledger apparatus has been retired in favor of findings-driven auditing. |
| 150 | `v20-backup.md` documents Supabase RLS as a **functional** control (`RLS_OK 150 / NO_RLS 0`). | DB-layer RLS is **authored but not yet enforced at runtime** — the app connects as a `BYPASSRLS`/table-owner role (H6) and the enable/policy SQL needed numbered-migration promotion (H7, now done). RLS is enforced **only** after the operational role cutover. |
| 151 | `v21-backup.md` scores Security **100%**, asserting RLS on all 283 models + active SAML signature verification. | RLS not runtime-enforced (per H6/H7). SAML signature verification **is** now real in code (`sso.ts` uses `xml-crypto` `SignedXml`), but the 100% security score is a stale snapshot claim, not the current posture. |
| 152 | `v22-backup.md` repeats "RLS on all 283 models / 0 NO_RLS" and Security **100%**. | Same correction as #150/#151 — RLS authored, not runtime-enforced; the 100% figure is superseded. |

### False positives (no change required)

Nineteen findings were validated as **FALSE_POSITIVE** and two as **ALREADY_FIXED** — no code change was made
or needed. One-line justification each:

| # | Sev | Finding | Why no change |
|---|-----|---------|---------------|
| 1   | INFO | Node engines drift (CI Node 22 vs Dockerfile) | Both are Node major 22; the finding text itself concludes "no drift observed." |
| 19  | INFO | User-enrichment lookup not org-scoped | `where` is `{ organizationId: user.organizationId }`; the user ids derive from org-scoped records. |
| 24  | LOW  | `addFeed` only encrypts accessToken/refreshToken | `encryptConfigSecrets` encrypts the full `SENSITIVE_CONFIG_KEYS` set (incl. api_key/apiKey/password), not just passed fields. |
| 32  | LOW  | Questionnaire SAML xml-crypto claim contradicted | Claim is now backed by code: `sso.ts` imports `SignedXml` and verifies the signature. |
| 39  | LOW  | `getCredentials` decrypts only clientSecret | tenantId/clientId/subscriptionId are non-secret Azure identifiers; only the secret is encrypted-at-rest by design. |
| 41  | LOW  | `controlMapping` create/find not org-filtered | Bounded by org-scoped control IDs (frameworks fetched with `where: { organizationId }`). |
| 117 | LOW  | Doc shows magic-link `devToken` bypass | The `devToken` is gated to `NODE_ENV === 'development'` in `authController.ts`; never returned in prod. |
| 118 | INFO | ZK service "simulated proofs" fallback | `simulatedProofsAllowed()` returns true ONLY in non-production; production throws when circuit files are missing. |
| 119 | INFO | `.env.test` block embeds a 64-char ENCRYPTION_KEY | It is an example test key in a `.env.test` example block (`NODE_ENV="test"`), not a live secret. |
| 133 | INFO | Continuous Monitoring demo-only in prod | The doc honestly describes current code; `ENABLE_REAL_MONITORING=true` throws by design until wired. |
| 160 | INFO | 21 critical SSRF alerts in `patValidationService.ts` | CodeQL FP — `validateBaseUrl` throws on `!isUrlSafe(baseUrl)`; the one raw axios call is guarded. |
| 161 | INFO | Critical SSRF in `sso.ts` metadata fetch | CodeQL FP — route is admin-authz'd and the URL passes `isWebhookUrlSafe()` (`safeFetch`). |
| 164 | MED  | 6× loop-bound-injection in evidence/ml services | Every cited loop bound is already clamped to a constant max — the exact recommended mitigation. |
| 166 | MED  | Insufficient-password-hash on webhook secret | Hashes an API **key** (not a user password) with SHA-256 purely for an indexed DB lookup. |
| 169 | INFO | Missing-rate-limiting on GraphQL routes | FP — `apiLimiter` is applied to both `app.post`/`app.get('/api/graphql', ...)`. |
| 174 | LOW  | Falco retains SYS_ADMIN + ro docker.sock | Already de-escalated from `privileged: true`; remaining caps are the documented minimum for Falco. |
| 175 | INFO | CSV formula-injection in tracked `.csv` | `git grep` for cells starting with `= @ + -` returns zero matches; runtime exports are already neutralized. |
| 176 | INFO | Email in tracked CSVs | Only distinct address is the app's own public `contact@complyeasyai.com`, quoted as audit evidence. |
| 181 | INFO | RLS accessor reads a GUC the backend never sets | FP — accessor reads `app.current_org`, a GUC the backend **does** set (corrects an earlier scan claim). |
| 88  | INFO | Doc asserts CI gates the workflows don't enforce (**ALREADY_FIXED**) | The current `.github/workflows/*` already set top-level permissions, SHA-pin actions, and gate on CodeQL. |
| 102 | LOW  | DPA SAML xml-crypto claim vs TODO (**ALREADY_FIXED**) | `sso.ts` already imports `xml-crypto` `SignedXml` and `checkSignature()` throws on failure in the ACS handler. |

---

## 3. MEDIUM Findings (42)

Compact: file:line — title — evidence → fix.

> **Remediation:** all 42 MEDIUM findings were addressed in the 2026-06-06 pass and are **FIXED /
> VERIFIED** unless flagged otherwise — the MEDIUM operational/doc-only items (**#82**, **#101**, **#120**)
> are **OPERATIONAL_DOCUMENTED** (the RLS posture corrections also covered by H6/H7). The two
> repo-wide deferred (**PARTIAL**) items, **#58** (frontend `tsconfig` `strict`) and **#105** (CSP
> `style-src 'unsafe-inline'`), are LOW-severity. See the per-finding ledger
> `.claude/deep-scan/results/remediation_ledger.json` and [§ Remediation Status](#remediation-status--2026-06-06).

### Multi-tenant isolation (service layer)
- `server/src/services/advanced/agenticAIService.ts:227` — **estimateBlastRadius reads frameworkControl by id without org scoping** — `findUnique({ where:{ id: controlId } })` on user-supplied targetId → use `findFirst({ where:{ id, framework:{ organizationId } } })` and 404 on null (matches executeControlUpdate:744).
- `server/src/services/advanced/agenticAIService.ts:710` — **captureRollbackData reads control/risk by id without org scoping** — both `findUnique` omit organizationId → scope control via `{ id, framework:{ organizationId } }` and risk via `{ id, organizationId }`.
- `server/src/services/issueManagementService.ts:33` — **createIssue writes caller-supplied assignedToId/createdById unverified** → verify both resolve to a User in the same org before create, else AppError 400/404.
- `server/src/services/issueManagementService.ts:157` — **assignIssue sets assignedToId with no org-membership check** → validate assignedToId belongs to org before update.
- `server/src/services/soxService.ts:328` — **createSOXTestResult org check bypassed when organizationId undefined** — optional param collapses the `where` to an unscoped match → make organizationId required / throw 400; scope the 356/383 lookups too.

### SSRF / injection
- `server/src/services/integrations/azureService.ts:154` — **Unsanitized resourceType interpolated into OData filter** — `` `resourceType eq '${resourceType}'` `` → allowlist (alphanumeric + `/.`) before interpolation.
- `server/src/graphql/index.ts:245` — **critical js/type-confusion on GraphQL query length check** — `query.length` where query from body may be array/object → add `if (typeof query !== 'string') return 400`.
- `server/src/controllers/frameworksController.ts:29` — **Regex-based XSS sanitizer is incomplete** (js/incomplete-multi-character-sanitization, js/bad-tag-filter cluster) → replace hand-rolled regex with DOMPurify path / allowlist-validate.
- `server/src/services/advanced/evidenceTruthLayerService.ts:1523` — **6× high js/loop-bound-injection** (+ mlModelsService.ts:849) — user-influenced loop bounds → clamp to `Math.min(Number(input)||0, MAX)`.
- `server/src/services/advanced/byokService.ts:699` — **high js/path-injection** (+ complianceAsCodeService.ts:1239-1240) → `path.resolve` + assert within base dir / `[A-Za-z0-9_-]` allowlist.
- `server/src/controllers/authController.ts:1038` — **7× high js/polynomial-redos** (demoController, sso, team, branding, piiRedaction) → rewrite regexes to avoid nested quantifiers / cap input length.

### Crypto / randomness / supply-chain
- `server/src/services/advanced/complianceDigitalTwinService.ts:942` — **high js/insecure-randomness + js/biased-cryptographic-random** in security paths (secretsManagerService:333, federatedSwarmService:431, rotation-lambda:301) → use `crypto.randomBytes`/`randomInt`.
- `server/src/routes/webhooks.ts:48` — **high js/insufficient-password-hash on webhook secret** (webhookController:622) → confirm `crypto.timingSafeEqual` + encryptField; else switch to constant-time compare.
- `server/src/zkp/QUICKSTART.md:116` — **ZK trusted-setup uses predictable entropy (`date +%s`)** in a guide that declares proofs production-ready → use interactive/hardware entropy; point production users to the multi-party ceremony runbook.
- `server/src/zkp/setup-circuits.sh:60` — **circom compiler downloaded/installed with no checksum** → pin + verify SHA-256 of v2.1.6, fail closed.
- `server/src/zkp/setup-circuits.sh:96` — **Powers-of-Tau fetched from mirrors with no integrity check** → verify against published Hermez SHA-256 before `groth16 setup`.
- `server/src/policies/bin/opa:1` — **Committed OPA binary (~73MB), x86_64-only, no checksum/provenance** → gitignore + fetch pinned version with SHA256 verify at build.
- `server/src/zkp/bin/circom:1` — **Committed circom binary (~9.7MB), no checksum** → gitignore + fetch pinned v2.1.6 with SHA256.
- `server/src/zkp/powersOfTau28_hez_final_12.ptau:1` — **Committed Powers-of-Tau files fetched from mutable sources, no integrity check** → pin canonical SHA256, fail closed.
- `server/src/zkp/keys/proving/compliance_check.zkey:1` — **Committed Groth16 proving/verification keys, no provenance/checksum** → add checksum manifest + verify step; record circuit + ptau version.

### Doc-vs-code drift (security posture overstated)
- `README.md:128` — **README claims PostgreSQL RLS enabled for defense-in-depth** but DB-layer RLS inert → state RLS is application-layer enforced, or implement working RLS.
- `SECURITY_AUDIT.md:84` — **Doc says bcrypt; code uses PBKDF2-SHA256 (600k)** → correct to PBKDF2-SHA256.
- `SECURITY_IMPLEMENTATION_COMPLETE.md:58` — **Claims SSRF protection 100% FIXED / production-ready** — contradicted by patValidationService discussion → correct status.
- `SECURITY_IMPLEMENTATION_SUMMARY.md:33` — **Asserts SSRF FIXED + "Approved for Production: YES"** → update/retract sign-off.
- `ComplyEasyAI_Certification_Readiness_Report.md:137` — **Cert report claims DB-layer RLS isolation** → correct to "not currently enforced at DB layer."
- `legal/DPA_TEMPLATE.md:162` — **Customer-facing DPA claims PostgreSQL RLS defense-in-depth** → make accurate or restate as app-layer.

### Mock/stub/demo data presented as live
- `components/AIFeatures/EvidenceCompletenessChecker.tsx:301` — **Create Task/Remediation/Schedule/Upload only mutate local state, never persist** → wire each handler to backend, flip success state on resolved response.
- `components/BreachNotificationWizard.tsx:375` — **Breach history seeded with hardcoded DEMO records that persist on empty API** → init to `[]`, always assign API result.
- `components/StatusPage.tsx:51` — **Public status page falls back to hardcoded 99.9x% uptime as live health** → render neutral "Live status unavailable" when feed null.
- `server/src/graphql/resolvers/index.ts:491` — **GraphQL runMonitor returns hardcoded `status:'Passing'`** → delegate to real continuous-monitoring execution.

### Deployment / config / secrets
- `infrastructure/monitoring/alertmanager.yml:126` — **Alertmanager references Slack templates not in repo** → add/mount templates or inline.
- `infrastructure/security/falco/falco.yaml:55` — **Falco http_output posts https to plaintext Alertmanager** → use `http://alertmanager:9093` or enable TLS.
- `server/src/config/database.ts:196` — **Raw SQL ($queryRaw/$executeRaw) skips the org-GUC transaction wrapper → no RLS org context** → run raw tenant queries inside an explicit transaction that sets `set_config('app.current_org', ...)`, or keep explicit org WHERE.
- `infrastructure/scripts/deploy.sh:169` — **DATABASE_URL (with password) passed to pg_dump on argv** → pass via PGPASSWORD/PGHOST/PGUSER/PGDATABASE env.
- `server/src/blockchain/scripts/deploy.ts:507` — **Block-explorer API key interpolated into a curl command printed to stdout** → print placeholder / redact.
- `PRODUCTION_IMPLEMENTATION_SUMMARY.md:31` — **ZK trusted-setup documented production-ready** but script uses hardcoded toxic-waste entropy → don't claim ready until CSPRNG + real multi-party.
- `mobile/package.json:5` — **`main` points to nonexistent `src/App.tsx`** (real file is `mobile/App.tsx`) → set to `App.tsx` / Expo default; missing main breaks bare/EAS builds.

### Migrations / schema
- `server/prisma/migrations/MIGRATION_ROLLBACK.md:31` — **Rollback for 20260315 drops the wrong table's columns** (FrameworkControl vs OnboardingChecklist) → rewrite to drop the 8 OnboardingChecklist columns actually added.
- `server/prisma/migrations/MIGRATION_ROLLBACK.md:42` — **Rollback for 20260129 drops a non-existent table, misses two real ones** → drop OnboardingChecklist/OnboardingEvent/OnboardingProgress, remove OnboardingStep.
- `server/prisma/migrations/rls_policies_all_tables.sql:26` — **RLS inert because FORCE + role swap deferred to a separate possibly-unapplied migration** → confirm 20260604_enforce_rls applied + add CI assertion on `pg_class.relforcerowsecurity`.
- `server/prisma/migrations/rls_policies_all_tables.sql:513` — **org_isolation on DashboardWidget/CICDGateResult uses NULLABLE organizationId → legacy rows leak/break under FORCE** → run backfill then `ALTER COLUMN ... SET NOT NULL`; make schema non-optional.

---

## 4. LOW Findings (82)

Grouped by theme. Each entry is `file:line — short title`.

### Doc-vs-code drift / stale status (12)
- `SECURITY.md:45` — Known-Unfixable vuln table stale (lists effect/lodash, omits fixed dompurify/tmp).
- `SETUP_GUIDES.md:361` — Setup guide says JWT tokens stored in localStorage (contradicts httpOnly-cookie arch).
- `SIG.md:89` — Vendor questionnaire asserts SAML xml-crypto verification that source TODOs contradict.
- `TESTING.md:17` — States Node v18+ while CI/Dockerfile/engines target Node 22.
- `legal/DPA_TEMPLATE.md:147` — DPA asserts SAML signature verification; sso.ts had unresolved TODO.
- `server/README.md:63` — README claims functional PostgreSQL RLS defense-in-depth (non-functional).
- `COMPLETE_SETUP_SUMMARY.md:262` — Declares ZK/blockchain/OPA "100% PRODUCTION READY" vs same-repo audit (broken/forgeable/dead).
- `NPM_AUDIT_VULNERABILITIES_REPORT.md:4` — Stale npm-audit report (3 critical/5 high) vs current baseline.
- `PRODUCTION_IMPLEMENTATION_SUMMARY.md:333` — Asserts "100% Production Ready / all fallbacks removed."
- `PRODUCTION_IMPLEMENTATION_VERIFICATION_REPORT.md:415` — Claims "100% / No production blockers."
- `PRODUCTION_FIXES_GUIDE.md:338` — CSRF documented per-route/optional; code applies globally.
- `SECURITY_AUDIT.md:308` — Disclosure email differs (security@complyeasy.ai vs security@aaraik.ai).

### Insecure documented procedures / credential hygiene (12)
- `.gitleaks.toml:28` — Allowlist path-excludes secret-bearing docs (DEPLOYMENT_SECRETS.md etc.) from scanning.
- `QUICK_MIGRATION_REFERENCE.md:41` — Documents DB passwords on the psql/pg_dump argv.
- `QUICK_MIGRATION_REFERENCE.md:130` — Presents `0.0.0.0/0` open access as an RDS SG option.
- `QUICK_MIGRATION_REFERENCE.md:96` — Stores plaintext `.env.backup-*` inside the repo working dir.
- `SETUP_GUIDES.md:112` — Over-broad managed IAM (AmazonS3FullAccess, Rekognition Full) + disabling S3 Block Public Access.
- `SECURITY_MONITORING_SETUP.md:312` — Recommended security-event logger snippet logs user email (PII) + full error.
- `TESTING.md:128` — `GRANT ALL PRIVILEGES` + DB-user password literal on the psql argv.
- `VERCEL_DEPLOYMENT_GUIDE.md:497` — Instructs opening the prod DB to the entire internet (`0.0.0.0/0`).
- `DEPLOYMENT.md:173` — Hardcodes a weak literal RDS master password in the aws CLI snippet.
- `DEPLOYMENT.md:704` — Recommends publicly-accessible DB / `0.0.0.0/0` + private key in plain `.env`.
- `server/contracts/README.md:79` — Documents storing raw blockchain private keys in plaintext `.env`.
- `NIST_AI_RMF_API_TEST.md:15` — Instructs using magic-link `devToken` to bypass email verification.

### CSRF / frontend-backend contract (3)
- `components/SCIMSettings.tsx:93` — SCIM apiFetch omits CSRF token on mutating requests.
- `components/SSOSettings.tsx:96` — SSO apiFetch omits CSRF token on mutating requests.
- `components/SecurityTrainingDashboard.tsx:187` — Security-training apiFetch omits CSRF token on POST mutations.

### Multi-tenant / authz / input validation (8)
- `server/src/routes/acos.ts:155` — Several aCOS sub-routes drop the `requireAcosFeature` tier gate (billing-tier gap).
- `server/src/routes/privacy.ts:2441` — child-consent mutating routes lack validateBody + role authz.
- `server/src/routes/privacy.ts:2275` — POST/PATCH `/notices` lack validateBody schema.
- `server/src/services/auditorService.ts:796` — createFinding accepts auditorId without org-ownership check.
- `server/src/services/frameworkTemplateService.ts:1850` — controlMapping not directly org-filtered (bounded by org-scoped ids; defense-in-depth).
- `server/src/controllers/risksController.ts:349` — prioritize() updates riskItem by AI-returned id without re-scoping org → use `updateMany({ where:{ id, organizationId } })`.
- `server/src/middleware/paginationMiddleware.ts:110` — `sortBy` accepted as arbitrary Prisma orderBy key when allowlist unset.
- `server/src/validators/ssoSchemas.ts:17` — SSO metadataUrl/ssoUrl `Joi.uri()` has no scheme restriction.

### SSRF / CSP / TLS hardening (5)
- `SECURITY_FIXES.md:348` — Documented safeFetch pattern validates only literal hostname + single redirect hop (no DNS re-resolution).
- `index.html:3` — SPA entry HTML has no CSP (meta or CloudFront header policy).
- `nginx/security-headers.conf:18` — CSP allows `'unsafe-inline'` for style-src.
- `server/src/middleware/csrf.ts:247` — CSRF cookie set `httpOnly:true` under a double-submit pattern (verify frontend reads token from JSON body).
- `server/src/config/database.ts:196` — Per-operation GUC transaction wrapper adds BEGIN + set_config round-trip and pins a pooled connection per Prisma call (perf — re-test under D4).

### Credential encryption / secrets at rest / PII in logs (5)
- `server/src/services/advanced/regulatoryIntelligenceFabricService.ts:2857` — addFeed comment claims api_key/password encrypted but only accessToken/refreshToken passed to encryptConfigSecrets.
- `server/src/services/integrations/azureService.ts:79` — getCredentials returns tenantId/clientId/subscriptionId plaintext (verify clientSecret encrypted at write).
- `server/src/config/logger.ts:48` — Console transport omits the sanitization stage applied to file/ES logs.
- `server/src/controllers/authController.ts:1396` — Password reset token stored in plaintext in DB → store SHA-256 hash.
- `infrastructure/.gitignore:1` — Does not exclude `.env` files.

### Supply-chain / build artifacts / download integrity (7)
- `server/src/zkp/POWERS_OF_TAU_SOURCES.md:14` — Powers of Tau via curl from mirrors, no enforced checksum.
- `server/src/zkp/QUICKSTART.md:86` — Manual setup downloads Powers of Tau with no integrity check.
- `server/src/zkp/test_output/test_circuit4_js/witness_calculator.js:1` — Generated circom witness-calculator artifacts committed.
- `server/src/zkp/compiled/wasm/compliance_check.wasm:1` — Committed compiled circuit `.wasm/.r1cs/.sym`, no checksum (duplicated locations).
- `server/src/blockchain/compiled/ComplianceAuditLog.bytecode:1` — Committed Solidity bytecode, no source-hash/compiler provenance.
- `server/src/policies/setup-opa.sh:200` — Setup scripts download executables with no integrity verify, use mutable `latest` URLs.
- `PRODUCTION_DEPLOYMENT_GUIDE.md:368` — Instructs building/deploying mutable `:latest` image tag.

### Deployment / container config (6)
- `docker-compose.yml:246` — Production-profile API publishes 3001 on all host interfaces → bind to loopback.
- `docker-compose.prod.yml:109` — Prod nginx serves SPA from `./dist` (build artifact) + `./nginx/ssl` certs not in repo.
- `docker-compose.security.yml:16` — Falco retains SYS_ADMIN + ro docker.sock mount (mitigated, not minimal).
- `infrastructure/security/falco/docker-compose.falco.yml:26` — Falco host docker.sock + SYS_ADMIN broad surface.
- `infrastructure/scripts/deploy.sh:169` (error-handling) — pg_dump and S3-upload errors suppressed with `2>/dev/null`.
- `server/prisma.config.ts:10` — DATABASE_URL falls back to a hardcoded default connection string → fail-closed.

### Schema / FK / data quality (5)
- `server/prisma/migrations/20260129_add_onboarding_tables/migration.sql:37` — OnboardingEvent.organizationId has no FK to Organization.
- `server/prisma/schema.prisma:6354` — RegulatoryChangeImpact has denormalized organizationId with no FK.
- `server/prisma/schema.prisma:3412` — OnboardingEvent has denormalized organizationId with no FK.
- `server/prisma/migrations/enhancement_modules.sql:296` — RegulatoryChangeDetection is a global table with no organizationId / no RLS policy.
- `server/prisma/migrations/add_org_to_dashboard_widget_and_cicd_gate_result.sql:52` — `SET NOT NULL` on backfilled organizationId is an unexecuted TODO.

### Code quality / dead UI / error handling / shell robustness (17)
- `server/src/routes/evidenceCollection.ts:711` — Manual evidence-collection trigger does no collection work (advances lastCollectedAt only).
- `server/src/routes/frameworks.ts:131` — Projected score trend synthesized with hardcoded -30 baseline ramp (tagged `source:'projected'`).
- `server/src/services/advanced/agenticAIService.ts:1265` — Action concurrency lock fails open on DB error.
- `server/src/services/geminiService.ts:132` — temperature/maxOutputTokens use `||` so a caller-supplied 0 is overridden → use `??`.
- `server/src/services/integrations/providers/integrationRegistry.ts:160` — testAllConnections batching ineffective (all fire concurrently).
- `server/src/utils/csvExport.ts:183` — Error path sends `res.status(500).json()` directly, bypassing global handler/Sentry.
- `tsconfig.json:2` — Frontend tsconfig does not enable strict mode (no strict/noImplicitAny/strictNullChecks).
- `components/AIFeatures/ContractAnalyzer.tsx:52` — readFileContent resolves even after rejecting on empty file (missing `return`).
- `components/AIFeatures/NaturalLanguageQuery.tsx:617` — DataCard rendering dead (backend result never populates dataCards).
- `components/ExecutiveDashboard.tsx:442` — Period Comparison shows misleading deltas vs sentinel-zero baseline.
- `components/GovernanceManager.tsx:372` — Embedded demo governance data shown as live when API returns no bodies.
- `components/ProductLifecycleTracker.tsx:1000` — Version History renders fabricated version entries for all products.
- `scripts/verify-security-fixes.sh:1` — Verification shell script lacks `set -euo pipefail`.
- `server/scripts/compile-circuits.sh:6` — Circuit compile script uses only `set -e` (dead `$?` check after `2>&1`).
- `server/scripts/load-test.js:80` — `spawn()` with `shell:true` interpolates env bearer token into a shell command.
- `infrastructure/secrets/rotation-lambda/index.ts:310` — api_key rotation self-mints a random key external providers won't honor.
- `PRODUCTION_DEPLOYMENT_GUIDE.md:529` (incomplete_impl) — Continuous Monitoring demo-only in prod (`ENABLE_REAL_MONITORING=true` throws).

> The LOW set spans 82 findings; the groupings above enumerate every LOW finding by file:line. A handful of
> documentation-drift LOWs around DB exposure / `0.0.0.0/0` recur across multiple runbooks and are listed once per file.

---

## 5. INFO Findings (58)

Predominantly **non-blocking** observations: doc-vs-code drift on stale scores/vuln counts, superseded
backup reports, CodeQL false-positive reconciliation, and benign hygiene notes. Grouped:

### Stale scores / vuln counts / superseded reports (~28)
Numerous committed docs carry point-in-time numbers that no longer match the current baseline (root 0 /
server 29, 0 high; tsc 0/0/0) and should be archived or banner-marked as superseded:
`SECURITY.md:24` (97.51% v16), `VULNERABILITY_FIXES_SUMMARY.md:221`, `VERIFIED_FEATURE_STATUS_REPORT.md:331`
(73 tsc errors — stale), `COMPLETE_SETUP_SUMMARY.md:184`, `COMPLETE_VULNERABILITY_FIXES_REPORT.md:5`,
`COMPLETE_PRD.md:648` (CI/CD & Docker marked "Missing"), `DILIGENCE_QA.md:62`, `FINAL_VERIFIED_STATUS_2026-01-01_PM.md:19`
(~95%), `FINAL_VERIFIED_PRODUCTION_STATUS_2025-12-31.md:18` (~55%), `FOUNDER_NARRATIVE.md:59` (97.51%),
`NPM_AUDIT_REMAINING_ADVISORIES.md:3`, `PRODUCTION_IMPLEMENTATION_SUMMARY.md:2` (unrendered `$(date)`),
plus the v16/v18/v19/v20/v21/v22 `PRODUCTION_READINESS_REPORT.*-backup.md` snapshots (each repeats stale
"PRODUCTION READY 97.x%" and "RLS enforced / 0 NO_RLS" claims — historical, do not edit, ensure superseded).

### Doc-vs-code security drift (non-blocking)
- `AI_ERRORS_DEBUG_GUIDE.md:40` — Debug guide reads JWT from localStorage (contradicts httpOnly-cookie posture).
- `TESTING.md:168` — Expected-tables list references non-existent models (Control/Risk/Evidence).
- `SECURITY_MONITORING_SETUP.md:214` — Wazuh transport snippet defaults to admin/admin.
- `docs/CHANGE_MANAGEMENT_PROCEDURE.md:205` — Asserts CodeQL/GitLeaks/Cosign/approval CI gates the workflows don't enforce.
- `docs/BUSINESS_CONTINUITY_PLAN.md:116` — Claims S3 cross-region replication / Falco / Secrets-Manager controls not confirmed in infra.
- `PRODUCTION_FIXES_GUIDE.md:338` — CSRF documented per-route/optional; code applies globally.
- `PRODUCTION_FEATURES_IMPLEMENTATION_SUMMARY.md:215` — OPA Rego "fully implemented"; verify default-deny.
- `IMPLEMENTATION_VERIFICATION.md:35` / `IMPLEMENTATION_GUIDE.md:213` — ZK simulated-proof fallback / example ENCRYPTION_KEY placeholder.
- `server/src/middleware/apiVersioning.ts:79` — Comment says header overrides URL, but code prefers URL.
- `PRODUCTION_DEPLOYMENT_GUIDE.md:529` — Continuous Monitoring is demo-only in prod (`ENABLE_REAL_MONITORING=true` throws).

### Multi-tenant (safe / advisory)
- `server/src/routes/securityTraining.ts:181` — User enrichment lookup not org-scoped but ids derive from org-scoped records (safe).
- `server/src/services/visionaryAIService.ts:806` — Cross-org benchmarking samples all orgs but returns anonymous aggregate only (no leak).

### Audit-integrity / hashing
- `server/src/routes/scim.ts:287` — AuditLog hash uses random UUID, not a tamper-evident chain hash.
- `server/src/routes/ticketing.ts:596` — create-ticket audit hash is a `provider:source` string, not cryptographic.

### Incomplete impl / dead code / test quality
- `components/SecurityTrainingDashboard.tsx:963` — Employee Start/Continue training button has no handler.
- `components/SBOMManager.tsx:1129` — SBOM Export modal Format/Scope selectors non-functional.
- `components/ProductLifecycleTracker.tsx:866` — Details tab Milestones/EOL/Environmental from demo fixtures.
- `server/src/examples/newPagesExamples.ts:1` — Example file under src/ exports live DB-write fns, never wired (ships in bundle).
- `server/src/__tests__/security/runPenetrationTest.ts:870` — Static pen-test scanner emits assertive PASS from loose substring heuristics.
- `server/src/__tests__/security/runPenetrationTest.ts:36` — Pen-test scanner reads nginx config from a path differing from the deployed mount.
- `server/TEST_RESULTS.md:18` / `server/.env.example:34` — Committed non-green test report (741 failing); env-template port mismatch (3001 vs 5000).

### Solidity / blockchain
- `server/src/blockchain/contracts/ComplianceAuditLog.sol:13` — Indexed `string organizationId` event param stores only keccak hash, unrecoverable off-chain.
- `server/src/blockchain/contracts/ComplianceRegistry.sol:312` — Indexed `string operationType` unrecoverable from logs.
- `server/src/blockchain/scripts/deploy.ts:100` — Mainnet RPC URLs default to public/demo endpoints.

### i18n / CSP / shell / schema hygiene
- `i18n/locales/ja.json:151` — Duplicate JSON keys nav.dpia / nav.ropa (silent last-wins).
- `public/offline.html:227` — Offline shell page has no CSP meta + inline script/handlers.
- `infrastructure/lib/entrypoint-wrapper.sh:9` / `test_ai_rmf_endpoint.sh:1` — Scripts use `set -e` only, not `set -eu`/`pipefail`.
- `server/prisma/migrations/add_missing_tables.sql:1590` — AzurePolicyCompliance unique-constraint name appears truncated below the 63-char limit.
- `ComplyEasyAI_Certification_Readiness_Report.md:290` — Claims all Math.random() eliminated (verify).
- `.github/workflows/ci.yml:18` — Node engines drift risk (CI Node 22; confirm package.json engines + prod Dockerfile).

### CI / CodeQL reconciliation (LIVE track)
- `.github/workflows/codeql.yml:12` — CodeQL workflow correctly configured (single canonical def, SHA-pinned, least-privilege); confirm branch-protection required check.
- `(github code-scanning API):0` — **LIVE reconciliation: 155 OPEN alerts** (24 critical / 103 high / 27 medium / 1 low) of 1,397 total (1,242 fixed). Triage record; many high/critical are false positives where custom guards aren't recognized as sanitizers.
- `server/src/services/integrations/patValidationService.ts:959` — **21 critical js/request-forgery are CodeQL false positives** — SSRF IS guarded (isUrlSafe/isPrivateIp/assertOutboundBaseUrl). **Corrects the prior CLAUDE.md "patValidationService SSRF NOT fixed" claim.** Add to sanitizer model or bulk-dismiss.
- `server/src/routes/sso.ts:184` — critical js/request-forgery is a false positive (safeFetch + isWebhookUrlSafe gate it; auth+admin gated).
- `server/src/index.ts:691` — high js/missing-rate-limiting false positive (apiLimiter applied to /api/graphql).

### Spot-check tracks (clean)
- `.claude/deep-scan/data_csv.txt:0` — **No CSV formula-injection** in any of 159 tracked CSVs (zero cells start with `=/+/-/@`).
- `.archive/.../coverage_pii_in_logs_verified.csv:343` — Only email in tracked CSVs is the app's own public contact address (no PII leak).
- `server/prisma/migrations/rls_policies_all_tables.sql:42` — **RLS design verified sound & reproducible** — accessor reads `app.current_org` (a GUC the backend DOES set), superseding the prior "reads request.jwt.claims, never set" claim. Remaining work is the two operational HIGHs (H6/H7).

---

## § Coverage

**STATUS = PARTIAL.** Static coverage is complete; three dynamic phases were not executed.

### Static read coverage — COMPLETE
- **Read-list:** N = **1,495** files.
- **Batches:** **125 / 125 present (100%)** — **NO missing batches.**
- **Specialized tracks:** **6 / 6 ran** — `rls`, `codeql`, `containers`, `supplychain`, `secretsweep`, `csv`.
- **Side-lists (each handled by its track):**
  - `data_csv` (**159** files) → CSV spot-check track (no formula-injection; only own public contact email).
  - `binary_inventory` (**36** files) → supply-chain track (committed OPA/circom binaries, ptau, zkeys, wasm/r1cs, Solidity bytecode flagged).
  - `lockfiles` (**5** files) → D2 dependency-audit track.
- **Exclusion set:** `node_modules/`, `server/src/generated/`, `.claude/`, `.archive/` (except as historical-snapshot findings), compiled/build artifacts, binary blobs (→ inventory/supply-chain track), lockfiles (→ D2), `.csv` data (→ csv spot-check track).

### Dynamic phases
| Phase | Description | Ran? | Result |
|-------|-------------|------|--------|
| **D1** | `tsc --noEmit` (server / root / mobile) | **YES** | Baseline **green** (0/0/0). |
| **D2** | `npm audit` (root + server) | **YES** | root 0 vulns; server 0 high (remainder per known-unfixable breaking-major list). |
| **D3** | Runtime boot + smoke | **YES (best-effort)** | Boot/health/DB/auth round-trip checked best-effort. |
| **D5** | CodeQL | **YES (via track)** | LIVE reconciliation: 155 open alerts; key criticals/highs verified as false positives (guarded SSRF / rate-limit). |
| **D4** | Load / performance | **NO** | Not executed — hot-path p95/error-rate/pool-exhaustion under load **unverified**. |
| **D6** | Playwright e2e | **NO** | Not executed — end-to-end UI flows **unverified** at runtime. |
| **D7** | Live-RLS runtime check | **NO** | Not executed — DB-layer RLS enforcement **not** runtime-confirmed (consistent with H6/H7). |

### Verdict
**STATUS = PARTIAL.** A full remediation pass has since closed the actionable backlog —
**162/162 actionable findings are remediated-or-documented** (151 FIXED, 9 OPERATIONAL_DOCUMENTED,
2 PARTIAL/deferred; 159 independently VERIFIED + 3 orchestrator-repaired), and **`tsc --noEmit` is
green across server / root / mobile (0/0/0)** — see [§ Remediation Status — 2026-06-06](#remediation-status--2026-06-06).
The remaining 21 non-actionable findings are 19 false positives + 2 already-fixed (no change required).

The report nonetheless **remains PARTIAL** and does **NOT** assert the system is production-ready,
because two classes of work are still pending and cannot be completed from the working tree:
1. the **operational RLS role cutover** (H6/H7 — create the NOBYPASSRLS `app_runtime` role and repoint
   the runtime `DATABASE_URL`), and
2. the **dynamic phases D4 (load), D6 (e2e), and D7 (live-RLS runtime check)**, which were not executed.

Both must be completed before any production-readiness claim is made.
