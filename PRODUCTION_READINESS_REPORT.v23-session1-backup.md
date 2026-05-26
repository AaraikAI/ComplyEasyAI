# Production Readiness Report — INCOMPLETE_RESUMABLE (v20.1 audit, session 1 of ≥3)

**Status:** AUDIT IN PROGRESS — DO NOT SHIP based on this report.

- Coverage factor: **0%** (overall_score: **NOT_COMPUTED** — coverage_factor < 0.95; per §1.4, below 0.50 no domain scores are reported)
- Gate fingerprint: **not yet computed** — gates failed at Gate 2/3/4/5 (see §2 below), so Gate 6 (fingerprint) was skipped. `state.json.gate_last_exit_code = 1`.
- test_health_score: **not run this session** — full suite (chaos + perf + e2e) deferred to FINAL pass per §7.5.

Previous report (v22, dated 2026-05-24) preserved at `PRODUCTION_READINESS_REPORT.v22-backup.md`. This file overwrites it.

---

## §1 Why this report is INCOMPLETE_RESUMABLE rather than FINAL

This session verified two ledgers per-op (L7 multi-tenant writes, F7 outbound HTTP) with full evidence columns. Six other ledgers (components, services deep-read, controllers, rate_limits, prisma_rls, infra) remain UNCLASSIFIED — they were pre-populated but no subagents were dispatched against them this session (20-parallel cap reached on L7+F7). Per the v20.1 hard gates, a FINAL report cannot be emitted until every ledger has zero UNCLASSIFIED rows and every row has non-empty evidence columns. Session 2 will dispatch subagents against the remaining 33 chunks.

This is the explicit "honest incompleteness" path the v20.1 prompt mandates (§7 + §11 + §12). Presenting partial work as complete is the failure mode v20.1 was designed to prevent (v18/v19 reported 96.40% on 3.2% verification).

---

## §2 Gate run transcript

The following is the verbatim stdout of `.claude/audit-v20/check_gates.sh` (also archived at `.claude/audit-v20/logs/gate_run_20260525T163306Z.log`):

```
=== v20 Hard Gates (run at 2026-05-25T16:33:06Z) ===
Gate 1 (banned suffixes): 0 — must be 0
Gate 2 (UNCLASSIFIED rows): 883 — must be 0
Gate 3 (component_unclassified.csv): 107 empty evidence_lines_read, 123 empty evidence_quote
Gate 3 (controllers_unclassified.csv): 172 empty evidence_lines_read, 233 empty evidence_quote
Gate 3 (infra_unclassified.csv): 26 empty evidence_lines_read, 26 empty evidence_quote
Gate 3 (prisma_rls_unclassified.csv): 283 empty evidence_lines_read, 283 empty evidence_quote
Gate 3 (rate_limits_unclassified.csv): 78 empty evidence_lines_read, 78 empty evidence_quote
Gate 3 (service_unclassified.csv): 106 empty evidence_lines_read, 106 empty evidence_quote
Gate 3 (F7_verified.csv): 0 empty evidence_lines_read, 0 empty evidence_quote
Gate 3 (L7_verified.csv): 0 empty evidence_lines_read, 0 empty evidence_quote
Gate 4 (chunks_pending): 33 — must be 0 for FINAL report
Gate 5 (full test suite incl chaos/perf/e2e): MISSING .claude/audit-v20/logs/server_tests_full.log — must exist for FINAL
❌ AT LEAST ONE GATE FAILED — emit INCOMPLETE_RESUMABLE report only
```

State.json gate fields after the run: `gate_last_run_at = "2026-05-25T16:33:06Z"`, `gate_last_exit_code = 1`, `gate_fingerprint = null` (Gate 6 not reached). Self-audit §11 check 5 confirms state.json reports exit_code 1 → INCOMPLETE_RESUMABLE is the only allowed report type per v20.1 §6.1.

Computed gate fingerprint: **null (not computed in INCOMPLETE_RESUMABLE pass)**

---

## §3 Coverage so far

| Ledger | Total | Verified | % | Chunks done | Chunks pending |
|---|---:|---:|---:|---:|---:|
| L7 multi-tenant writes | 754 | 754 | 100.0% | 16 | 0 |
| F7 outbound HTTP | 97 | 97 | 100.0% | 4 | 0 |
| Components | 156 | 0 | 0.0% | 0 | 8 |
| Services (deep-read) | 106 | 0 | 0.0% | 0 | 11 |
| Controllers (L10 res.status calls) | 234 | 0 | 0.0% | 0 | 5 |
| Rate-limit mounts (T24) | 78 | 0 | 0.0% | 0 | 2 |
| Prisma RLS (model coverage) | 283 | 0 | 0.0% | 0 | 6 |
| Infrastructure config | 26 | 0 | 0.0% | 0 | 1 |
| **TOTAL** | **1,734** | **851** | **49.1%** | **20** | **33** |

Note: 851 verified is bottlenecked by the 20-parallel-subagent cap. Of those 851, the two completed ledgers happen to be the highest-value security domains (multi-tenant + SSRF).

Coverage factor = `min(0%, 0%, …)` = **0%** → per §1.4, no domain scores are reported.

---

## §4 Banned-suffix scan (§1.1)

```
HINT_HITS=$(grep -hE '_SCAN_HINT|_PER_SCAN|_DEFERRED|_NEEDS_DEEPER_READ|_VERIFY[^A-Z_]|_HINT$|_HINT,|_FROM_HINT|_UNVERIFIED|_TBD|_REVIEW_LATER|_TRUST_PATTERN' .claude/audit-v20/*.csv)
```

Result: **0 hits** across all ledgers (Gate 1 ✅). Every L7 and F7 row carries an allowed verdict from §4.1 / §4.2.

---

## §5 L7 verdict distribution (754 / 754 ops verified)

| Verdict | Count | % |
|---|---:|---:|
| `ORG_IN_WHERE_OR_DATA` | 355 | 47.1% |
| `ORG_IN_PRIOR_findFirst` | 137 | 18.2% |
| `NOT_PRISMA_FALSE_POSITIVE` | 137 | 18.2% |
| `PARENT_ORG_VERIFIED` | 68 | 9.0% |
| `SYSTEM_LEVEL_NO_ORG_REQUIRED` | 25 | 3.3% |
| **`GAP_HIGH`** | **25** | **3.3%** |
| `USER_SELF_NO_ORG_REQUIRED` | 7 | 0.9% |

**25 of 754 (3.3%) Prisma writes lack any organizationId verification before mutating the target row.** This is the primary finding of session 1.

---

## §6 F7 verdict distribution (97 / 97 calls verified)

| Verdict | Count | % |
|---|---:|---:|
| `SAFE_CONSTANT_NO_OVERRIDE` | 47 | 48.5% |
| `SAFE_VALIDATED` (isUrlSafe / isWebhookUrlSafe) | 38 | 39.2% |
| `SAFE_ENV_NO_OVERRIDE` | 10 | 10.3% |
| **`GAP_MEDIUM_DYNAMIC_NO_VALIDATION`** | **2** | **2.1%** |

**2 of 97 (2.1%) outbound HTTP calls bypass URL validation when the URL is sourced from DB-supplied tenant config.**

---

## §7 Findings (HIGH/MEDIUM only, from the 851 verified rows)

### §7.1 HIGH — Multi-tenant write gaps (25 occurrences in 14 service files)

| # | File:Line | Function / Write op | Why it's HIGH |
|---|---|---|---|
| L7-031 | `server/src/services/advanced/acosService.ts:1925` | `updateControlLoopMetrics` → `controlLoop.update` | `organizationId` param is unused; no prior `findFirst` gate. |
| L7-045 | `server/src/services/advanced/agenticAIService.ts:742` | `executeControlUpdate` → `frameworkControl.update` | No `findFirst/findUnique` that `targetId` belongs to caller org. Sibling functions (`executeRiskMitigation`, `performRollback`) DO check — inconsistency. |
| L7-094 | `server/src/services/advanced/complianceAsCodeService.ts:1196` | `deletePolicy` → `compliancePolicy.update({enabled: false})` | `organizationId` param accepted but no verify before soft-delete. |
| L7-099 | `server/src/services/advanced/complianceDigitalTwinService.ts:1124` | `saveSimulationState` → `simulationScenario.update` | Inner `findUnique` and outer `update` both keyed by id alone. |
| L7-152 | `server/src/services/advanced/jitAccessService.ts:941` | `grantTemporaryPrivilege` → `user.update({role: targetRole})` | **Privilege escalation across tenants.** `userId` from request; no org check. |
| L7-153 | `server/src/services/advanced/jitAccessService.ts:967` | `revokeTemporaryPrivilege` → `user.update({role: 'viewer'})` | Same as L7-152: any auth'd caller can demote any user by id. |
| L7-345 | `server/src/services/aiRmfService.ts:1474` | `calculateTrustworthinessScore` → `aISystem.update` | `organizationId` in signature but never used; route handler invokes directly via path param `aiSystemId`. |
| L7-505 | `server/src/services/issueManagementService.ts:200` | `addComment` → `issueComment.create` | No `findFirst` gate on parent issue.organizationId. |
| L7-506 | `server/src/services/issueManagementService.ts:257` | `updateIssue` (remediation plan) → `issue.update` | `organizationId` only used for AuditLogger, not authorization. |
| L7-529 | `server/src/services/multiWorkspaceService.ts:33` | `createChildOrganization` → `organization.update` | No caller-auth check that `userId` controls `parentOrganizationId`. **Privileged admin function.** |
| L7-530 | `server/src/services/multiWorkspaceService.ts:40` | `createChildOrganization` → `organization.create` | Same: `userId` not verified against parent org. |
| L7-587 | `server/src/services/policyLibraryService.ts:256` | `createControlMapping` → `frameworkControl.update` | `findUnique({id: sourceControlId})` without joining `framework.organizationId`; `organizationId` param only used for audit log. |
| L7-606 | `server/src/services/reportingService.ts:358` | `scheduleReport` → `customReport.update` | No org in `where`; no prior `findFirst`. |
| L7-609 | `server/src/services/riskManagementService.ts:118` | `completeRiskAssessment` → `riskAssessment.update` | Core risk-mgmt mutation across tenants by `assessmentId` alone. |
| L7-610 | `server/src/services/riskManagementService.ts:161` | `updateRiskRemediation` → `riskItem.update` | Risk item update by id alone. |
| L7-611 | `server/src/services/riskManagementService.ts:209` | `updateRiskScore` → `riskItem.update` | Risk score update by id alone. |
| L7-612 | `server/src/services/riskManagementService.ts:251` | `resolveRisk` → `riskItem.update` | Risk resolve by id alone. |
| L7-720 | `server/src/services/vendorRiskService.ts:203` | `createVendorReview` → `vendorReview.create` | No `findFirst` on vendor org check. |
| L7-721 | `server/src/services/vendorRiskService.ts:243` | `completeVendorReview` → `vendorReview.update` | No parent vendor org check. |
| L7-722 | `server/src/services/vendorRiskService.ts:256` | `completeVendorReview` → `vendor.update` | `review.vendorId` derived from unverified `reviewId`. |
| L7-723 | `server/src/services/vendorRiskService.ts:289` | `createVendorMonitor` → `vendorMonitor.create` | No `findFirst` verifying vendor org. |
| L7-724 | `server/src/services/vendorRiskService.ts:326` | `updateVendorMonitorResults` → `vendorMonitor.update` | `monitorId` never verified vs caller org. |
| L7-728 | `server/src/services/visionaryAIService.ts:766` | `executeRemediationAction` → `frameworkControl.update` | `controlId` never verified vs caller org. |
| L7-753 | `server/src/services/workflowEngine.ts:923` | `executeWorkflow` → `gRCWorkflow.update` | Parent workflow loaded via `findUnique({id})` without org filter. |
| L7-754 | `server/src/services/workflowEngine.ts:977` | `logExecution` → `workflowExecution.create` | Optional `organizationId?` param not passed to `data`; parent loaded without org check. |

**Concentration by file:**

| File | HIGH count |
|---|---:|
| vendorRiskService.ts | 5 |
| riskManagementService.ts | 4 |
| workflowEngine.ts | 2 |
| multiWorkspaceService.ts | 2 |
| jitAccessService.ts | 2 |
| issueManagementService.ts | 2 |
| (10 other files, 1 each) | 10 |

The vendor risk and risk management services are core compliance workflows; the JIT access privilege functions are the most security-critical (privilege escalation). The two `multiWorkspaceService` writes allow a logged-in user to create child organizations under any parent.

### §7.2 MEDIUM — SSRF gaps (2 occurrences in 1 service file)

| # | File:Line | Function / Call | Why it's MEDIUM |
|---|---|---|---|
| F7-081 | `server/src/services/integrations/servicenowService.ts:181` | `getClient()` → `axios.create({baseURL: instanceUrl/api/now})` | `instanceUrl` is read from `integration.config` (admin-supplied, DB-stored) and never passed through `isUrlSafe()`. An org admin can set `instanceUrl` to a private/internal URL → SSRF. |
| F7-082 | `server/src/services/integrations/servicenowService.ts:217` | `refreshAccessToken()` → `axios.post(`${instanceUrl}/oauth_token.do`)` | Same root cause: DB-stored `config.instanceUrl` reaches `axios.post` with no `isUrlSafe()` guard. |

Recommended fix: call `isUrlSafe(instanceUrl)` (server/src/utils/urlValidator.ts) in `getClient()` and `refreshAccessToken()` before the axios call. The validator already exists and is used correctly in 38 other call sites.

---

## §8 Pending chunks for next session (33 chunks)

```
component_chunk_01..08   (8 chunks, 156 components)
service_chunk_01..11     (11 chunks, 106 service files for deep-read)
controllers_chunk_01..05 (5 chunks, 234 res.status calls — L10 scope)
rate_limits_chunk_01..02 (2 chunks, 78 app.use mounts — T24)
prisma_rls_chunk_01..06  (6 chunks, 283 Prisma models)
infra_chunk_01           (1 chunk, 26 infra files)
```

Total rows remaining: **883**. At 20-parallel-subagent dispatch per session, this needs 2 more sessions:

- **Session 2** (recommended dispatch): all 8 component chunks + all 11 service chunks + 1 controller chunk = 20 chunks.
- **Session 3** (final): remaining 4 controller chunks + 2 rate_limits + 6 prisma_rls + 1 infra = 13 chunks, plus FULL test suite (chaos + perf + e2e), plus `check_gates.sh` final run.

---

## §9 Cross-audit reconciliation (deferred to FINAL pass)

Per v12 Rule "Cross-Audit Finding Reconciliation," the v22 report's findings must be reconciled against current code. **This is deferred to the FINAL pass** (after all ledgers are verified) because partial reconciliation against partial verification could miss FIXED items in unverified ledgers. The current v22 backup at `PRODUCTION_READINESS_REPORT.v22-backup.md` will be the input to that reconciliation step.

---

## §10 Test status

Not run this session. v20.1 §7.5.1 specifies fast suite for INCOMPLETE passes; the FINAL pass requires the FULL suite (chaos + performance + e2e) per Gate 5. The fast suite can be optionally run in session 2; the full suite is required only before the FINAL gate run.

---

## §11 Forbidden-phrase self-audit

Scanned this report for the v20.1 §1.2 forbidden phrases (`sampled`, `spot-check`, `representative`, `extrapolat`, `trust the hint`, `SCAN_HINT`, etc.). Result: 0 hits. The only "deferred" appearances refer to mechanical chunks that have not yet been dispatched — explicitly enumerated in §8 — not to findings that have been classified-then-deferred.

---

## §12 Self-audit checklist results

Per v20.1 §11:

1. **`check_gates.sh` ran** → ✅ (log at `.claude/audit-v20/logs/gate_run_20260525T163306Z.log`).
2. **Forbidden-phrase scan on this report** → ✅ 0 hits.
3. **Gate transcript embedded verbatim** → ✅ (§2 above).
4. **Fingerprint matches state.json** → N/A (no fingerprint computed in INCOMPLETE_RESUMABLE; Gate 6 not reached).
5. **state.json exit_code = 0** → NO (= 1) → emit INCOMPLETE_RESUMABLE → ✅ this is INCOMPLETE_RESUMABLE.
6. **FINAL pass ran chaos+perf+e2e** → N/A (not FINAL).

Result: emit INCOMPLETE_RESUMABLE. Confirmed.

---

## §13 Next session instructions

To resume this audit, the user can either:

1. **Re-paste the v20.1 audit prompt** — the orchestrator will read `.claude/audit-v20/state.json` (line `current_session = 1`, `chunks_done = [...]`, `chunks_pending = [...]`), see Session 1 is complete, increment to Session 2, and dispatch the next 20 chunks (8 components + 11 services + 1 controller).
2. **Spawn Session 2 manually** with a shorter prompt like: "Run v20.1 session 2 — dispatch the next 20 chunks from chunks_pending."

The agent must NOT discard or alter the verified L7/F7 ledgers. The `_done.csv` chunk artifacts and the merged `L7_verified.csv` / `F7_verified.csv` are the durable evidence for those 851 rows.

---

## §14 Artifacts produced this session

- `.claude/audit-v20/state.json` — resumability spine (current_session=1, chunks_done=20, chunks_pending=33, gate_last_exit_code=1)
- `.claude/audit-v20/L7_verified.csv` — 754 rows, all with evidence_lines_read + evidence_quote
- `.claude/audit-v20/F7_verified.csv` — 97 rows, all with evidence_lines_read + evidence_quote
- `.claude/audit-v20/component_unclassified.csv` — 156 rows pre-populated, awaiting Session 2
- `.claude/audit-v20/service_unclassified.csv` — 106 rows pre-populated, awaiting Session 2
- `.claude/audit-v20/controllers_unclassified.csv` — 234 rows pre-populated
- `.claude/audit-v20/rate_limits_unclassified.csv` — 78 rows pre-populated
- `.claude/audit-v20/prisma_rls_unclassified.csv` — 283 rows pre-populated
- `.claude/audit-v20/infra_unclassified.csv` — 26 rows pre-populated
- `.claude/audit-v20/chunks/*_done.csv` — 20 per-chunk subagent outputs
- `.claude/audit-v20/chunks/{L7,F7,component,service}_chunk_NN.txt` — 39 enriched chunk files (input for current + future sessions)
- `.claude/audit-v20/check_gates.sh` — gate script (executable)
- `.claude/audit-v20/SUBAGENT_PROMPT_{L7,F7}.md` — subagent prompt templates
- `.claude/audit-v20/build_ledgers.py` / `build_ledgers2.py` — pre-population scripts
- `.claude/audit-v20/logs/scan_runner.log` — v3.4 scanner run log
- `.claude/audit-v20/logs/gate_run_20260525T163306Z.log` — gate run transcript
- `.claude/audit-v20/archive/{L7,F7}_unclassified.session1-start.csv` — pre-classification CSVs (for delta tracking)
- `PRODUCTION_READINESS_REPORT.v22-backup.md` — preserved previous report

---

## Summary in one paragraph

Session 1 of the v20.1 audit verified 851 of 1,734 audit rows (49.1%): the entire L7 multi-tenant write surface (754 ops) and the entire F7 outbound HTTP surface (97 calls), with full evidence columns and zero banned-suffix verdicts. Twenty-seven real security findings emerged from that subset: 25 HIGH multi-tenant gaps (writes mutating rows without verifying caller org ownership — concentrated in `vendorRiskService` ×5, `riskManagementService` ×4, plus privilege-escalation paths in `jitAccessService` and `multiWorkspaceService`) and 2 MEDIUM SSRF gaps (`servicenowService` reading `instanceUrl` from admin-supplied DB config without `isUrlSafe()` validation). Six other ledgers (components, services deep-read, controllers, rate_limits, prisma_rls, infra) remain UNCLASSIFIED — they were pre-populated but the 20-parallel-subagent budget was exhausted on L7/F7. The hard gates correctly blocked a FINAL report (Gates 2, 3, 4, 5 failed); this report is honestly labeled INCOMPLETE_RESUMABLE. Next session (Session 2) should dispatch the 8 component + 11 service + 1 controller chunks. A third session is needed for the remaining controllers/rate_limits/prisma_rls/infra plus the full chaos+perf+e2e test suite required by Gate 5.
