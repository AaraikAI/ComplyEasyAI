# Production Readiness Report (Cursor — v11)

**Artifact:** `Cursor_PRODUCTION_READINESS_REPORT.md` — full audit per `.claude/CLAUDE.md` **v4–v11**, SKILL pitfalls **1–46**, and scan-runner **v3 + T1–T15**.

**Project:** ComplyEasyAI  
**Stack:** React 18 + TypeScript + Vite | Express 5 + Prisma 7 + PostgreSQL | React Native (mobile) | Docker / GitHub Actions  
**Scanned:** 2026-04-02  
**Scan-runner:** v3.0 + v9 (T1–T8) + v10 (T9–T10) + **v11 (T11–T15)**  
**Files scanned:** 1,132 source files; **638** production files (lean)  
**Total grep findings:** 46,545  
**Scan date (metrics):** 2026-04-02T20:32:33Z  
**Runner exit code:** **0** (all patterns completed; **0** timeouts)

---

## SECTION 0: DELTA SUMMARY

| Metric | Value |
|--------|------:|
| New findings (vs baseline) | 0 |
| Resolved | 0 |
| Persisted | 46,545 |

Baseline unchanged in net counts; **v11 adds new *classified* risks** not visible from grep totals alone.

---

## SECTION 1: BUILD STATUS (Phase 1)

| Check | Status | Details |
|-------|--------|---------|
| TypeScript (root) | PASS | `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` — **0 errors** |
| TypeScript (server) | PASS | Same — **0 errors** |
| ESLint | PASS (errors) | **0 errors**, **1260 warnings** (>500 → LOW debt, v9) |
| npm audit (root) | PASS | 0 vulnerabilities |
| npm audit (server) | REVIEW | 9 issues (see exclusions); chains often **unfixable** per `.claude/audit-exclusions.json` |
| Production build | PASS | `npm run build` |

**Tooling:** Root `tsc` **OOM** without increased heap — document **`NODE_OPTIONS`** in CI (v10).

---

## SECTION 2: PRODUCTION GAPS — v11 VERIFIED (EVIDENCE-BASED)

### HIGH

**H1 — Infrastructure default password (T13 / Pitfall 44)**  
- **File:** `logstash/pipeline/logstash.conf` line **52**  
- **Pattern:** `password => "${ELASTICSEARCH_PASSWORD:-changeme}"`  
- **Issue:** Fail-open default `changeme` outside Docker Compose (T1 alone would miss this).  
- **Fix:** Use `:?` / require env; remove weak default for any env reachable from production-like profiles.

**H2 — SSRF via optional `baseUrl` without URL safety (T12 / Pitfall 42)**  
- **File:** `server/src/services/integrations/patValidationService.ts`  
- **Evidence:** `validateToken(provider, token, baseUrl?)` — e.g. `validateGitLabToken` builds `apiUrl = baseUrl ? \`${baseUrl}/api/v4/user\` : 'https://gitlab.com/...'` then **`axios.get(apiUrl)`** with **no `isUrlSafe()` / private-IP block** (grep: **no** `isUrlSafe` in file).  
- **Issue:** Caller-controlled `baseUrl` can target metadata/internal endpoints.  
- **Fix:** Run `baseUrl` through **`isWebhookUrlSafe` / `isUrlSafe`** (or equivalent) before any HTTP call.

**H3 — Parent–child org chain: SOX test result create (Pitfall 43)**  
- **File:** `server/src/services/soxService.ts` — `createSOXTestResult` (~lines **327–344**)  
- **Evidence:** `prisma.sOXTestResult.create({ data: { controlId: data.controlId, ... } })` — **no `organizationId` on row**; prior **`findUnique({ where: { id: data.controlId } })`** (~348) does **not** constrain **`organizationId`**. Optional `organizationId` on `data` is not used to scope the parent lookup.  
- **Issue:** If `controlId` references another org’s control, test results can attach cross-tenant.  
- **Fix:** `findFirst({ where: { id: data.controlId, organizationId: <caller org> } })` (or require non-optional org + join), then create.

### MEDIUM

**M1 — Integration OAuth / PAT stored plaintext (T11 / Pitfall 41)**  
- **File:** `server/src/services/integrations/githubService.ts` — `saveIntegration` (~**113–139**)  
- **Evidence:** `accessToken` written directly to `prisma.integration.upsert` **without** `encrypt()` / field encryption.  
- **Issue:** Credential encryption-at-rest not applied for this credential class.  
- **Fix:** Encrypt token fields with **`ENCRYPTION_KEY`** (or BYOK path) before write; decrypt on read only in trusted paths.

**M2 — CI quality gate: dependency scan (`T9`)**  
- **File:** `.github/workflows/dependency-scan.yml` lines **33**, **41** — `continue-on-error: true` on audit steps.  
- **Fix:** Fail the job or document `# Known unfixable` with explicit policy.

**M3 — Controller manual errors vs global handler (T14 / Pitfall 45)**  
- **Scan:** **247** `res.status(` hits in **`server/src/controllers/`** (vs **29** in routes for legacy L10).  
- **Issue:** Large surface area for **Sentry / consistent error shape** bypass if catches use raw `res.status().json()` without `next(err)` / logging.  
- **Fix:** Sample high-traffic controllers; standardize on `next(AppError)` + `logger.error`.

### LOW

**L1 — ESLint warnings 1260** (>500 threshold, v9).  
**L2 — Rate limits:** 70 mounts, 65 with limiters — **5** gaps (L9 scan).  
**L3 — Mobile / Slack `continue-on-error`** (`.github/workflows/mobile.yml` **156**, **161**; `ci.yml` **675**) — notification / store submit; monitor separately.  
**L4 — T4 `new RegExp`:** prior audit: mostly inside **`safeRegexTest`** or internal token maps — **FALSE_POSITIVE** for bypass; **`multimodalIntakeService` / `regulatoryIntelligenceFabricService`** still deserve spot-checks.

### T15 — Operational status UI (Pitfall 46 honesty)

- **Scan:** **1** component flagged: `components/StatusPage.tsx` (**API refs: 1** — below heuristic threshold).  
- **Evidence:** Large **`const services: ServiceStatus[]`** and **`recentIncidents`** — **hardcoded** demo operational data (lines **51+**, **144+**); not live status API.  
- **Classification:** **PRODUCTION_GAP (MEDIUM)** for real status-page use — wire to health/incident API or mark as **marketing demo only**.

---

## SECTION 3: FEATURE COMPLETENESS

| Bucket | Count |
|--------|------:|
| FULLY_WIRED | 104 |
| PARTIALLY_WIRED | 19 |
| STATIC_ONLY | 31 |
| **Total** | **154** |

Intentional static: `FeatureLibrary.tsx` (per `audit-exclusions.json`).

---

## SECTION 3.8 COMPLETION GATES (v7 + v10 + v11)

| Gate | Scan count | Report status |
|------|------------|---------------|
| Components (buckets) | 154 | Documented |
| Service files | 89 | **INCOMPLETE** — not all read end-to-end |
| F7 outbound calls | 97 | **INCOMPLETE** — not all lines classified (parameter-level review **T12** partially done) |
| L7 writes | 682 | **INCOMPLETE** — **honest:** not every op verified; **H3** proves gaps exist |
| T1–T10 | per `/tmp/audit_*.txt` | Classified in §2 / notes |
| **T11** credential DB writes | 42 lines in `/tmp/audit_T11.txt` (includes generated **`.d.ts`** noise) | **Sampled:** **M1** verified on GitHub path |
| **T12** URL/`baseUrl` params | 27 | **H2** verified (`patValidationService`) |
| **T13** infra defaults | 1 (`logstash.conf`) | **H1** verified |
| **T14** controller `res.status` | 247 | **M3** — aggregate finding |
| **T15** static operational UI | 1 (`StatusPage.tsx`) | **T15** verified |
| Scan-runner exit | 0 | OK |

**Rule (v11 / Pitfall 46):** Partial L7/F7 classification is **explicitly INCOMPLETE** — not “682/682 processed” unless every match is read.

---

## SECTION 4: APPLICATION LOGIC

- **Validation file coverage (scan):** 65 / 68 route files — `export.ts` uses **`validateExportData`**; `v1`/`v2` **index** routers aggregate children.  
- **L11 silent catches:** **0** (frontend).  
- **SOX:** **H3** is the primary logic/isolation finding for this pass.

---

## SECTION 5: SECURITY

### 5.1 Strict security domain score (CLAUDE.md v11)

Formula: **`max(0, 100 - H×10 - M×3)`** — do **not** inflate.

| Class | Count | Notes |
|-------|------:|-------|
| **H** | **3** | H1 logstash default, H2 PAT `baseUrl` SSRF, H3 SOX parent/child org |
| **M** | **4** | M1 plaintext integration token, M2 CI dep-scan bypass, M3 controller error pattern debt, T15 StatusPage static ops UI |

**Security score** = `max(0, 100 - 30 - 12) = **58%**`

(This replaces looser “88%” style estimates when HIGH findings are counted strictly.)

### 5.2 SAML

`server/src/routes/sso.ts` — **xml-crypto** signature verification present — verify in repo, not MEMORY alone.

### 5.3 Dependencies

Server `npm audit` chains: many **excluded** per project policy — see `SECURITY_EXCEPTIONS.md` / `audit-exclusions.json`.

---

## SECTION 6: API / CONTRACTS

Follow-up: cross-check `src/services/api.ts` vs mounted routes for release-critical paths (not re-run in full here).

---

## SECTION 7: DEPLOYMENT BLOCKERS

| Item | Severity |
|------|----------|
| **H1** logstash default | High |
| **H2** SSRF PAT validation | High |
| **H3** SOX test/control org chain | High |
| `tsc` heap in CI | Medium |
| Dep-scan `continue-on-error` | Medium |

---

## SECTION 8: INFRASTRUCTURE

- **Docker HEALTHCHECK (T6):** 0 Dockerfiles missing HEALTHCHECK (scan).  
- **Chaos / runtime:** Not executed this pass.

---

## SECTION 9: PATCHES

Not auto-generated. Prioritize **H1 → H2 → H3**, then **M1**, then CI/T14/T15.

---

## SECTION 10: SCORECARD (DETERMINISTIC + v11 SECURITY)

Using SKILL Phase 10 style with **security = 58%** from §5.1 (strict).

| Domain | Weight | Score used | Weighted |
|--------|--------|------------|----------|
| Build & compile | 10% | 100% | 10.0% |
| Code quality | 15% | 65% (≈8–9 gap-equivalents) | 9.75% |
| Feature completeness | 25% | 74.18% | 18.55% |
| Application logic | 15% | 72% | 10.8% |
| **Security** | **20%** | **58%** (strict H/M) | **11.6%** |
| Deployment | 15% | 75% | 11.25% |

**Approx. overall:** **10 + 9.75 + 18.55 + 10.8 + 11.6 + 11.25 ≈ 71.95%** → report **~72%** (round sensibly).

**Verdict:** **NOT READY** until **H1–H3** are addressed or formally accepted with signed risk. **L7/F7** classification remains **incomplete** per §3.8.

---

## SECTION 11: PRIORITIZED FIX LIST

| # | Sev | Item |
|---|-----|------|
| 1 | High | `logstash/pipeline/logstash.conf` — remove `:-changeme` fail-open |
| 2 | High | `patValidationService.ts` — validate **every** `baseUrl`/`endpoint` with **`isUrlSafe`** before `axios` |
| 3 | High | `soxService.ts` `createSOXTestResult` — enforce parent **control** belongs to caller **organization** |
| 4 | Medium | `githubService.saveIntegration` (and peers) — **encrypt** `accessToken` at rest |
| 5 | Medium | `dependency-scan.yml` — tighten `continue-on-error` |
| 6 | Medium | Controllers — reduce raw `res.status` in catches; use **`next` + logger** |
| 7 | Medium | `StatusPage.tsx` — wire real status or label as demo-only |
| 8 | Low | ESLint warning reduction; rate-limit 5 mounts |

---

## APPENDIX: SCAN-RUNNER v11 COUNTS (stdout)

| Scan | Count |
|------|------:|
| T11 credential DB writes (grep) | 42 |
| T12 URL parameter lines | 27 |
| T13 infra default passwords | **1** |
| T14 controller inline `res.status` | **247** |
| T15 static operational components | **1** |

**Command:**

```bash
bash '/Users/gverma/Desktop/AARAIK LLC/ComplyEasyAI/.claude/skills/productions-readiness-audit/scripts/Production Readiness scan-runner.sh' '/Users/gverma/Desktop/AARAIK LLC/ComplyEasyAI'
```

**Evidence:** `/tmp/audit_metrics.json`, `/tmp/audit_T11.txt` … `/tmp/audit_T15.txt`.

---

## SECTION 12: Consistency Note

This document contains a point-in-time Cursor v11 analysis. For canonical and reconciled readiness status, use:

- `PRODUCTION_READINESS_REPORT.md` (v16, final reconciled)

Historical v12/v14 appendices and “PRODUCTION READY — 98.26%” legacy verdict text were superseded by the reconciled v16 report and are intentionally retired here to keep cross-document language consistent.
