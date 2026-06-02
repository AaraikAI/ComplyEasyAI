# Production Readiness Report — INCOMPLETE_RESUMABLE (v20.3 session 1 of ~33)

**Status:** AUDIT IN PROGRESS — DO NOT SHIP based on this report.
**Session:** 1 of approximately 33
**Audit version:** v20.3 (supersedes v26 POST-FINAL GAP CLOSURE for the coverage-ledger surface)
**Previous report:** preserved at `PRODUCTION_READINESS_REPORT.v26-backup.md` (v26, 2026-05-26 — claimed 100% production-ready; that claim is contradicted by session-1 findings below).

**Coverage factor:** 491 / 15,545 candidate rows verified = **3.16%**
- 10 ledgers at 100% (small/medium ledgers)
- 1 ledger partial (coverage_inmemory_state: 50/121 = 41%)
- 9 ledgers not yet started (auth_per_endpoint, input_validation, csrf, pii_in_logs, l8_reads, frontend_contract, audit_logs, file_upload, idempotency)

**Gate exit code:** 1 (FAIL — expected for session 1).
**Gate last run:** 2026-05-28T16:13:17Z. `state.json.gate_last_exit_code = 1`.

---

## §0 Session 1 Scope

This session executed STEP 4 of the v20.3 session prompt: the 20 smallest/most-impactful chunks dispatched in one parallel message to general-purpose subagents.

| # | Ledger | Range | Tier | Strict-block? | Outcome |
|---|---|---|---|---|---|
| 1 | coverage_cookie_flags | ALL (6) | T1 | no | 6 SECURE_VERIFIED → 0 findings |
| 2 | coverage_rate_limit_values | ALL (16) | T2 | no | 5 LIMIT_APPROPRIATE + 1 GAP_LOW + 10 NOT_APPLICABLE → 0 HIGH |
| 3 | coverage_webhook_hmac | ALL (20) | T2 | no | 2 HMAC_VERIFIED + 17 NOT_APPLICABLE + **1 GAP_HIGH** |
| 4 | coverage_jwt_algorithm | ALL (6) | T3 | no | **6 GAP_HIGH** (no `algorithms` option on any jwt.verify) |
| 5 | coverage_migration_status | ALL (2) | T4 | YES | 2 MIGRATION_APPLIED_VERIFIED → 0 findings |
| 6 | coverage_token_revocation | ALL (12) | T4 | YES | 4 SESSION_REVOKED + 5 NOT_APPLICABLE + **3 GAP_HIGH** |
| 7 | coverage_openapi_drift | ALL (1) | T4 | no | 1 NEEDS_HUMAN_REVIEW informational |
| 8 | coverage_background_jobs | 1-14 | T4 | YES | 1 DLQ_VERIFIED + 2 RETRY_VERIFIED + rest NOT_APPLICABLE |
| 9 | coverage_background_jobs | 15-28 | T4 | YES | All NOT_APPLICABLE (log/comment lines within verified queue) |
| 10-14 | coverage_credential_encryption | ALL (113) | T1 | YES | 44 WRAPPED_VERIFIED + 69 NOT_APPLICABLE → 0 findings |
| 15-18 | coverage_ssrf | ALL (97) | T1 | YES | 65 WRAPPED_VERIFIED + 5 NOT_APPLICABLE + 16 GAP_LOW + **6 GAP_MEDIUM** (strict block) |
| 19-20 | coverage_inmemory_state | 1-50 | T4 | no | 30 NOT_APPLICABLE + 14 informational + **3 GAP_HIGH** + **1 GAP_MEDIUM** |

**Findings totals (preliminary, session 1 only):**
- **13 GAP_HIGH** real findings
- **7 GAP_MEDIUM** (6 strict-block SSRF + 1 inmemory)
- **17 GAP_LOW** (informational)

---

## §1 Coverage Table

| Ledger | Total candidates | Verified | % | Chunks done | Chunks pending |
|---|---:|---:|---:|---:|---:|
| coverage_cookie_flags | 6 | 6 | 100% | 1 | 0 |
| coverage_rate_limit_values | 16 | 16 | 100% | 1 | 0 |
| coverage_webhook_hmac | 20 | 20 | 100% | 1 | 0 |
| coverage_jwt_algorithm | 6 | 6 | 100% | 1 | 0 |
| coverage_migration_status | 2 | 2 | 100% | 1 | 0 |
| coverage_token_revocation | 12 | 12 | 100% | 1 | 0 |
| coverage_openapi_drift | 1 | 1 | 100% | 1 | 0 |
| coverage_background_jobs | 28 | 28 | 100% | 2 | 0 |
| coverage_credential_encryption | 113 | 113 | 100% | 5 | 0 |
| coverage_ssrf | 97 | 97 | 100% | 4 | 0 |
| coverage_inmemory_state | 121 | 50 | 41% | 2 | 3 |
| coverage_auth_per_endpoint | 1172 | 0 | 0% | 0 | 47 |
| coverage_input_validation | 3722 | 0 | 0% | 0 | 149 |
| coverage_csrf | 713 | 0 | 0% | 0 | 29 |
| coverage_pii_in_logs | 2923 | 0 | 0% | 0 | 117 |
| coverage_l8_reads | 4770 | 0 | 0% | 0 | 191 |
| coverage_frontend_contract | 245 | 0 | 0% | 0 | 10 |
| coverage_audit_logs | 239 | 0 | 0% | 0 | 10 |
| coverage_file_upload | 326 | 0 | 0% | 0 | 14 |
| coverage_idempotency | 713 | 0 | 0% | 0 | 29 |
| **TOTAL** | **15,545** | **491** | **3.16%** | **20** | **599** |

Plus v20.1 FINAL core ledgers (1,734 rows) carried forward at 100%, but they are NOT counted in the v20.3 coverage factor because v20.3 introduces the new coverage-ledger surface.

---

## §2 Gate Run Transcript (session 1)

Verbatim stdout of `bash .claude/audit-v20/check_gates.sh`:

```
=== v20 Hard Gates (run at 2026-05-28T16:13:17Z) ===
Gate 1 (banned suffixes): 0 — must be 0
Gate 2 (UNCLASSIFIED rows): 0 — must be 0
Gate 3 (.claude/audit-v20/L7_verified.csv): 0 empty evidence_lines_read, 0 empty evidence_quote
Gate 3 (.claude/audit-v20/F7_verified.csv): 0 empty evidence_lines_read, 0 empty evidence_quote
Gate 3 (.claude/audit-v20/component_verified.csv): 1 empty evidence_lines_read, 1 empty evidence_quote
Gate 3 (.claude/audit-v20/prisma_rls_verified.csv): 0 empty evidence_lines_read, 0 empty evidence_quote
Gate 4 (chunks_pending): 599 — must be 0 for FINAL report
Gate 5 (full suite): chaos=37 perf=67 e2e=876 — each must be >0
Gate 5.5 strict (coverage_credential_encryption): HIGH=0 MEDIUM=0 — both must be 0
Gate 5.5 strict (coverage_ssrf): HIGH=0 MEDIUM=6 — both must be 0
Gate 5.5 strict (coverage_l8_reads): LEDGER MISSING — FINAL blocked
Gate 5.5 strict (coverage_migration_status): HIGH=0 MEDIUM=0 — both must be 0
Gate 5.5 strict (coverage_token_revocation): HIGH=3 MEDIUM=0 — both must be 0
Gate 5.5 strict (coverage_file_upload): LEDGER MISSING — FINAL blocked
Gate 5.5 strict (coverage_background_jobs): HIGH=0 MEDIUM=0 — both must be 0
Gate 5.5 regular (coverage_auth_per_endpoint): LEDGER MISSING — FINAL blocked
Gate 5.5 regular (coverage_cookie_flags): HIGH=0 MEDIUM=0 — HIGH must be 0 (MEDIUM visible but allowed)
Gate 5.5 regular (coverage_input_validation): LEDGER MISSING — FINAL blocked
Gate 5.5 regular (coverage_csrf): LEDGER MISSING — FINAL blocked
Gate 5.5 regular (coverage_rate_limit_values): HIGH=0 MEDIUM=0 — HIGH must be 0 (MEDIUM visible but allowed)
Gate 5.5 regular (coverage_webhook_hmac): HIGH=1 MEDIUM=0 — HIGH must be 0 (MEDIUM visible but allowed)
Gate 5.5 regular (coverage_jwt_algorithm): HIGH=6 MEDIUM=0 — HIGH must be 0 (MEDIUM visible but allowed)
Gate 5.5 regular (coverage_pii_in_logs): LEDGER MISSING — FINAL blocked
Gate 5.5 regular (coverage_frontend_contract): LEDGER MISSING — FINAL blocked
Gate 5.5 regular (coverage_inmemory_state): HIGH=3 MEDIUM=1 — HIGH must be 0 (MEDIUM visible but allowed)
Gate 5.5 regular (coverage_audit_logs): LEDGER MISSING — FINAL blocked
Gate 5.5 regular (coverage_idempotency): LEDGER MISSING — FINAL blocked
Gate 5.5 regular (coverage_openapi_drift): HIGH=0 MEDIUM=0 — HIGH must be 0 (MEDIUM visible but allowed)
AT LEAST ONE GATE FAILED — emit INCOMPLETE_RESUMABLE report only
```

**Gate exit code:** 1. **No fingerprint computed** (Gate 6 only runs when FAIL=0). This report is INCOMPLETE_RESUMABLE; it does NOT claim FINAL.

---

## §3 HIGH and Strict-Block MEDIUM Findings (Session 1 — REAL, ACTIONABLE)

These are real findings discovered in the verified subset. They should be fixed before subsequent sessions even if the full audit isn't complete.

### 3.1 GAP_HIGH — JWT Algorithm Pinning (6 findings, COV-9)

Every `jwt.verify(token, secret)` call in production code lacks the `algorithms: ['HS256']` option, allowing JWT algorithm-confusion / `alg:'none'` downgrade attacks.

| # | File | Line | Context |
|---|---|---:|---|
| 1 | `server/src/controllers/authController.ts` | 843 | 2FA login token verify |
| 2 | `server/src/graphql/index.ts` | 131 | GraphQL endpoint auth |
| 3 | `server/src/middleware/auth.ts` | 80 | Main HTTP auth middleware (covers most of /api) |
| 4 | `server/src/middleware/auth.ts` | 215 | Refresh-token verify |
| 5 | `server/src/services/advanced/webrtcSignalingService.ts` | 474 | WebRTC signaling WebSocket auth |
| 6 | `server/src/services/websocketService.ts` | 73 | Generic WebSocket auth |

**Fix pattern:** `jwt.verify(token, secret, { algorithms: ['HS256'] })`. The project uses HS256 (config.jwt.secret is a symmetric key) — pin to HS256 exclusively.

### 3.2 GAP_HIGH — Token Revocation on Auth Events (3 findings, COV-15)

Password change/reset handlers update `passwordHash` but never invalidate existing JWTs/sessions. Tokens issued before the password change remain valid until they organically expire.

| # | File | Line | Context |
|---|---|---:|---|
| 1 | `server/src/controllers/authController.ts` | 1132 (handler 1067-1147) | `changePassword` — no `tokenBlacklist.revoke` after passwordHash update |
| 2 | `server/src/routes/auth.ts` | 18 (`resetPassword` handler 1331-1365) | `resetPassword` — no token/session invalidation after password reset |
| 3 | `server/src/routes/auth.ts` | 33 (`changePassword` route) | Same handler as #1, accessed via PATCH /api/auth/password |

**Fix pattern:** after `prisma.user.update({...passwordHash})`, call `await tokenBlacklistService.revokeAllForUser(userId)` AND `await prisma.session.deleteMany({ where: { userId } })`. The codebase already has `tokenBlacklist.revoke` (used in logout) — reuse it.

### 3.3 GAP_HIGH — Webhook HMAC Verification (1 finding, COV-8)

Ticketing webhook accepts inbound payload without signature verification — any unauthenticated party can POST forged ticketing events. The handler reads `orgId` from a header/query param and trusts the body verbatim.

| # | File | Line | Context |
|---|---|---:|---|
| 1 | `server/src/routes/ticketing.ts` | 1334 | `router.post('/webhook/:provider', ...)` — calls `jiraService.processWebhookEvent(orgId, req.body)` without HMAC verification |

**Fix pattern:** verify the provider-specific signature header (Jira/ServiceNow/Azure DevOps have their own HMAC schemes) BEFORE invoking the processor. Reject mismatches with 401.

### 3.4 GAP_HIGH — In-Memory Critical State (3 findings, COV-13)

Security-critical state stored in `new Map()` without Redis/DB backing — server restart logs users out / loses authorization state.

| # | File | Line | What's stored |
|---|---|---:|---|
| 1 | `server/src/services/advanced/jitAccessService.ts` | 79 | `activeSessions` Map — Just-In-Time privileged-access sessions (elevated-privilege auth state) |
| 2 | `server/src/services/advanced/ldapPermissionService.ts` | 816 | `roleMappings` Map — admin-configured AD group → application role authorization mappings |
| 3 | `server/src/services/advanced/livenessDetectionService.ts` | 97 | `activeChallenges` Map — in-flight liveness-verification auth challenges |

**Fix pattern:** back each Map with Redis (existing project pattern: `tokenBlacklistService` uses Redis successfully). For roleMappings, persist to a Prisma table.

### 3.5 GAP_MEDIUM (strict-block) — SSRF Tainted Path/Query Segments (6 findings, COV-2)

Constant base URLs but caller-tainted path/query segments without `isUrlSafe()` validation. Per §5.5.2 the strict rule blocks FINAL on MEDIUM for SSRF.

| # | File | Line | Tainted component |
|---|---|---:|---|
| 1 | `server/src/controllers/integrationsController.ts` | 818 | `${tenantId}` from `req.body` in `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token` |
| 2 | `server/src/controllers/integrationsController.ts` | 834 | `${subscriptionId}` from `req.body` in `https://management.azure.com/subscriptions/${subscriptionId}` |
| 3 | `server/src/services/advanced/complianceAsCodeService.ts` | 565 | `${owner}/${repo}` from webhook payload in `https://api.github.com/repos/${owner}/${repo}/check-runs` |
| 4 | `server/src/services/advanced/complianceAsCodeService.ts` | 608 | `${projectId}/${commitSha}` from webhook payload in `https://gitlab.com/api/v4/projects/${projectId}/statuses/${commitSha}` |
| 5 | `server/src/services/advanced/physicalAIService.ts` | 2719 | `keywordSearch=${deviceType}` from caller in NVD URL |
| 6 | `server/src/services/integrations/patValidationService.ts` | 486 | `${sid}` from caller in `https://api.twilio.com/2010-04-01/Accounts/${sid}.json` (sid format-checked but no `isUrlSafe`) |

**Fix pattern:** sanitize via `encodeURIComponent` + then `isUrlSafe(finalUrl)` gate. The codebase already does this in `jiraService.ts:458` and `azureDevOpsService.ts:240` — apply the same pattern.

### 3.6 GAP_MEDIUM — In-Memory State Should Persist (1 finding, COV-13)

| # | File | Line | What's stored |
|---|---|---:|---|
| 1 | `server/src/services/advanced/physicalAIService.ts` | 99 | `devicePolicies` Map — IoT device compliance policies; initialized from hardcoded defaults only, no persistence layer |

---

## §4 GAP_LOW (Informational — Session 1)

17 low-severity findings, listed for awareness; none block FINAL:
- **COV-7 rate-limit:** `frameworkLimiter` at 600/min/IP (2× the 300/min general read ceiling) — `server/src/middleware/rateLimiter.ts:69`.
- **COV-2 SSRF (16 GAP_LOW):** all fall into "fully constant external SaaS URL" or "env-derived internal-only URL" buckets per §5.5.2's risk grading. Includes hcaptcha verification, OPA endpoints, pyannote diarization, zero-trust IP-reputation lookups, EU AI database, hubspot, paypal sandbox/prod, and the CLAMAV virus-scan host. Defense-in-depth: wrap in `safeFetch` for consistency.

---

## §5 v20.1 Carry-Forward (Reconciliation)

The 8 v20.1 core ledgers (1,734 rows) are unchanged from v20.1 FINAL and are NOT re-verified in v20.3 session 1:

| Ledger | Total | Verified at v20.1 FINAL | Status |
|---|---:|---:|---|
| L7 multi-tenant writes | 754 | 754 | inherited 100% (post-v25 remediation) |
| F7 outbound HTTP | 97 | 97 | inherited 100% |
| Components | 156 | 156 | inherited 100% |
| Services (deep-read) | 106 | 106 | inherited 100% |
| Controllers (L10) | 234 | 234 | inherited 100% |
| Rate-limit mounts | 78 | 78 | inherited 100% |
| Prisma RLS | 283 | 283 | inherited 100% |
| Infrastructure config | 26 | 26 | inherited 100% |

**Note:** the v26 report claimed all 8 §12 findings closed (HIGH=0, MEDIUM=0, security score 100%). v20.3 INTRODUCES a new coverage-ledger surface that the v26 report did not measure. Session 1 already found 13 GAP_HIGH + 7 GAP_MEDIUM in that new surface — the v26 "100%" claim was narrow to the v20.1 ledger set and does not transfer to v20.3's broader scope.

---

## §6 Pending Chunks (Session 2+)

Per `state.json.chunks_pending` (599 total chunks remaining):

| Ledger | Chunks remaining | Estimated sessions @ 20 chunks/session |
|---|---:|---:|
| coverage_l8_reads | 191 | ~10 |
| coverage_input_validation | 149 | ~8 |
| coverage_pii_in_logs | 117 | ~6 |
| coverage_auth_per_endpoint | 47 | ~3 |
| coverage_csrf | 29 | ~2 |
| coverage_idempotency | 29 | ~2 |
| coverage_file_upload | 14 | ~1 |
| coverage_frontend_contract | 10 | ~1 |
| coverage_audit_logs | 10 | ~1 |
| coverage_inmemory_state | 3 (rows 51-121) | ~1 |
| **TOTAL** | **599** | **~32 more sessions** |

---

## §7 Honest Incompleteness Disclosure

This report is INCOMPLETE_RESUMABLE per AUDIT_PROMPT_v20.3 §7. It does NOT compute an overall production score because `coverage_factor = 3.16% < 50%` (per §1.4 the score is suppressed at this coverage).

**Two truths held simultaneously:**
1. Session 1 found **13 GAP_HIGH + 7 strict-block GAP_MEDIUM** real, actionable findings. These should be remediated before subsequent sessions.
2. The audit is **3.16% complete**. Many more findings are likely in the 9 ledgers not yet started — particularly `coverage_l8_reads` (4,770 Prisma reads to verify for tenant isolation) and `coverage_input_validation` (3,722 endpoints/access points to verify).

**Both must be acted on:** fix the session-1 findings now; do not wait for the audit to finish. But also do not declare PRODUCTION_READY based on the v26 report — v20.3 is the active audit.

---

## §8 Next Session Instructions

Re-paste the v20.3 session prompt. State.json will resume from chunks_pending. Recommended chunking for session 2 (20 parallel subagents):
- Start the 7 unstarted small/medium ledgers: file_upload (14 chunks), frontend_contract (10), audit_logs (10), csrf (29) [first 5], idempotency (29) [first 5]
- Continue inmemory_state rows 51-121 (3 chunks)
- Begin auth_per_endpoint chunks 1-3 (75 rows)

Bulk-of-coverage ledgers (l8_reads, input_validation, pii_in_logs) will dominate sessions 4-33.

---

## §9 Coverage Score Disclosure

- **coverage_factor = 491 / 15,545 = 3.16%** (v20.3 surface)
- **overall_score: NOT_COMPUTED** (coverage_factor < 0.50 per §1.4 of v20.3 prompt)
- **test_health_score: 93.00%** (inherited from v20.1 FINAL — 7,233/7,780 server tests passing; not re-run this session)

---

*Generated by AUDIT_PROMPT_v20.3 session 1, 2026-05-28T16:13:17Z. Previous report `PRODUCTION_READINESS_REPORT.v26-backup.md`.*
