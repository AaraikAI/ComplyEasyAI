# Production Readiness Report — INCOMPLETE_RESUMABLE (v20.4 session 8 of ~27)

**Status:** AUDIT IN PROGRESS — DO NOT SHIP. v20.4 session 8 verified 500 rows: **3 GAP_HIGH, 1 GAP_MEDIUM, 0 GAP_LOW**. **coverage_pii_in_logs now 50.14%** (1475/2942).

**Session:** 8 of approximately 27
**Audit version:** v20.4
**Scan fingerprint:** `4bc30758cf4fb0db682f6a7cbb2a5123166856377783f3fad549eb6336d54e72` (changed from `387763f3…` — drift detected from the 4 fix files in s7→s8 transition)

**Coverage factor:** 3,799 / 16,244 = **23.39%** (up from 20.31%).
- **13 ledgers at 100%**.
- 1 ledger partial: `coverage_pii_in_logs` 1475 / 2942 = **50.14%**.
- 6 ledgers not yet started.

**Gate exit code:** 1 (FAIL — expected; chunks_pending > 0).

---

## §1 Session 8 Scope + Outcome

20 parallel subagents covering pii_in_logs rows 976-1475:

**Findings totals (session 8 NEW):** **3 GAP_HIGH + 1 GAP_MEDIUM + 0 GAP_LOW**

Note: subagents initially hit Anthropic session limit; all 20 were redispatched after reset and completed cleanly. No work lost.

| Chunk | Verdicts |
|---|---|
| 976-1000 | 25 PII_SAFE (reports.ts, roles.ts, ropa.ts, scim.ts) |
| 1001-1025 | 16 PII_SAFE + 9 USERID_ONLY_OK (SCIM auth errors) |
| 1026-1050 | 23 PII_SAFE + 1 USERID_ONLY_OK + **1 GAP_MEDIUM** (sso.ts:249 — raw email in SSO auto-provision) |
| 1051-1075 | 11 PII_SAFE + 11 USERID_ONLY_OK + **3 GAP_HIGH** (team.ts:137/266/283 — raw emails in team-invitation flow) |
| 1076-1100 | 24 PII_SAFE + 1 USERID_ONLY_OK |
| 1101-1125 | 25 PII_SAFE (acosService + performance-test) |
| 1126-1150 | 25 PII_SAFE (acosService) |
| 1151-1175 | 25 PII_SAFE (acosService + agenticAIService) |
| 1176-1200 | 24 PII_SAFE + 1 USERID_ONLY_OK (agenticAIService + blockchain) |
| 1201-1225 | 25 PII_SAFE (blockchainService) |
| 1226-1250 | 25 PII_SAFE (blockchainService) |
| 1251-1275 | 25 PII_SAFE (blockchainService) |
| 1276-1300 | 22 PII_SAFE + 3 USERID_ONLY_OK (blockchain event listeners + byok) |
| 1301-1325 | 15 PII_SAFE + 10 USERID_ONLY_OK (byokService — KMS key IDs only) |
| 1326-1350 | 24 PII_SAFE + 1 USERID_ONLY_OK (byokService + complianceAsCode) |
| 1351-1375 | 24 PII_SAFE + 1 USERID_ONLY_OK (complianceAsCodeService) |
| 1376-1400 | 25 PII_SAFE (complianceAsCode + digitalTwin + deepfake) |
| 1401-1425 | 23 PII_SAFE + 2 USERID_ONLY_OK (deepfake + dp + evidenceTruth) |
| 1426-1450 | 24 PII_SAFE + 1 USERID_ONLY_OK (evidenceTruthLayerService) |
| 1451-1475 | 25 PII_SAFE (evidenceTruth + federatedSwarm) |

---

## §2 Open Findings (to fix in Session 9)

### GAP_HIGH #1 — Raw email logged on single team invite
**File:** `server/src/routes/team.ts:137`
**Code:**
```ts
logger.info(`Team member invited: ${email} to organization ${organizationId}`);
```
**Issue:** Logs the invitee's raw email address on every successful invitation. Direct PII in logs.
**Fix:** Replace the email with the newly-created user's id:
```ts
logger.info(`Team member invited: user ${newUser.id} to organization ${organizationId}`);
```

### GAP_HIGH #2 — Raw email in failed-email-send warning
**File:** `server/src/routes/team.ts:266`
**Code:**
```ts
logger.warn(`Failed to send invitation email to ${invite.email}`, emailError);
```
**Fix:** Drop `${invite.email}`. Log the invitation id (or the new user.id) for correlation:
```ts
logger.warn(`Failed to send invitation email for invite ${invitation.id}`, emailError);
```

### GAP_HIGH #3 — Raw email in bulk-invite error
**File:** `server/src/routes/team.ts:283`
**Code:**
```ts
logger.error(`Failed to invite ${invite.email}`, error);
```
**Fix:** Drop `${invite.email}`. Log the batch index or invite id:
```ts
logger.error(`Failed to invite at index ${i}`, error);
```

### GAP_MEDIUM #4 — Raw email in SSO auto-provision info log
**File:** `server/src/routes/sso.ts:249`
**Code:**
```ts
logger.info(`SSO ACS: Auto-provisioned user ${email} for org ${ssoConfig.organizationId}`);
```
**Fix:** Replace `${email}` with the new user.id after creation:
```ts
logger.info(`SSO ACS: Auto-provisioned user ${newUser.id} for org ${ssoConfig.organizationId}`);
```

---

## §3 Coverage Table (cumulative)

| Ledger | Total | Verified | % | Status |
|---|---:|---:|---:|---|
| coverage_cookie_flags | 6 | 6 | 100% | ✅ |
| coverage_rate_limit_values | 16 | 16 | 100% | ✅ |
| coverage_webhook_hmac | 20 | 20 | 100% | ✅ |
| coverage_jwt_algorithm | 6 | 6 | 100% | ✅ |
| coverage_migration_status | 2 | 2 | 100% | ✅ |
| coverage_token_revocation | 17 | 17 | 100% | ✅ |
| coverage_openapi_drift | 1 | 1 | 100% | ✅ |
| coverage_background_jobs | 28 | 28 | 100% | ✅ |
| coverage_credential_encryption | 113 | 113 | 100% | ✅ |
| coverage_ssrf | 97 | 97 | 100% | ✅ |
| coverage_inmemory_state | 121 | 121 | 100% | ✅ |
| coverage_auth_per_endpoint | 1178 | 1178 | 100% | ✅ |
| coverage_csrf | 719 | 719 | 100% | ✅ |
| **coverage_pii_in_logs** | **2942** | **1475** | **50.14%** | **s8: 3 GAP_HIGH + 1 GAP_MEDIUM** |
| coverage_input_validation | 3723 | 0 | 0% | not started |
| coverage_l8_reads | 4778 | 0 | 0% | not started |
| coverage_frontend_contract | 1178 | 0 | 0% | not started |
| coverage_audit_logs | 252 | 0 | 0% | not started |
| coverage_file_upload | 328 | 0 | 0% | not started |
| coverage_idempotency | 719 | 0 | 0% | not started |
| **TOTAL** | **16,244** | **3,799** | **23.39%** | **~19 sessions remaining** |

---

## §4 Honest Disclosure

**Three truths:**
1. v20.4 sessions 1-8 verified 3,799 candidate sites: **3 GAP_HIGH (new in s8) + 4 GAP_MEDIUM open** (10 prior MEDIUMs all closed in commits `7df2dc8` and `9f6b4f5`).
2. The s8 team.ts findings are the first GAP_HIGH of the audit — every team invite logs the invitee's email plaintext. Operational logs of B2B SaaS team invites are not low-volume.
3. Audit is **23.39% complete**. ~19 sessions remaining.

---

## §5 Next Session Instructions

Recommended Session 9:
- **Fix the 3 GAP_HIGH + 1 GAP_MEDIUM findings in §2 first** — team.ts is the most impactful (every invite logs an email).
- Then continue `coverage_pii_in_logs` chunks 60-79 (rows 1476-1975) — 500 more pii rows.

---

## §6 Coverage Score Disclosure

- **coverage_factor = 3,799 / 16,244 = 23.39%**
- **overall_score: NOT_COMPUTED** (coverage_factor < 0.95)
- **test_health_score: 93.00%** (inherited)

---

*Generated by AUDIT_PROMPT_v20.4 session 8, 2026-05-29. Scan fingerprint: `4bc30758cf4fb0db682f6a7cbb2a5123166856377783f3fad549eb6336d54e72`.*
