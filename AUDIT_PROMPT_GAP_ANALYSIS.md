# Audit Prompt Gap Analysis

## Purpose

This document analyzes what the Production Readiness Audit prompt/methodology **missed or under-specified** that allowed the 18 findings to require discovery during audit execution rather than being guaranteed by the methodology. For each finding, I assess whether the prompt's instructions were sufficient, and identify 10 new rules (v9) that should be added.

---

## Finding-by-Finding Root Cause Analysis

### Findings the Prompt CORRECTLY Prescribed (Already Caught by Existing Rules)

| # | Finding | Prompt Rule That Caught It | Worked As Designed? |
|---|---------|---------------------------|-------------------|
| 2 | Node version mismatch | v6: Cross-File Version Consistency | YES |
| 3 | pgAdmin :latest | R3 scan pattern | YES |
| 5 | ReDoS in zeroTrustService | F9: Dynamic code execution | YES |
| 6 | Silent .catch() | L11 scan pattern | YES |
| 7 | Fixable dependency vulns | Phase 1: npm audit | YES |
| 8 | Missing migration rollback | S6 scan pattern | YES |
| 10 | Missing input validation | 5C.1: Validation coverage measurement | YES |
| 11 | SCIM/SSO manual errors | L10: Manual error responses | YES |
| 16 | No canary/blue-green | S7 scan pattern | YES |

**9 of 18 findings** were correctly prescribed by existing rules. These worked because the scan patterns directly matched the problem.

---

### Findings the Prompt UNDER-SPECIFIED (Caught, But Methodology Could Miss in Other Codebases)

#### Finding #1: Multi-Tenant Gaps in monitoringService.ts (HIGH)

**What the prompt says:** L7 scan finds all write operations. 6B.1 says "For EACH write operation found, read the surrounding function, check if organizationId is used." Pitfall 8 says don't sample.

**Why it nearly got missed:** L7 returned **682 write operations across 89 service files**. The prompt says "check every one" but provides no triage strategy for volumes this large. An agent facing 682 items will inevitably sample unless given a prioritized workflow.

**What's missing:** A **triage algorithm** for L7 output. The prompt should prescribe:
1. Group L7 output by file
2. For each file, count org-scoped writes vs unscoped writes
3. Files where SOME operations have orgId but others don't are the highest-priority targets (inconsistency = bug signal)
4. Files with zero orgId references at all are the second priority

---

#### Finding #4: Default Database Password in Docker Compose (Medium)

**What the prompt says:** v6 Rule says "Check default passwords (Grafana admin), secrets management" for docker-compose files. The v5 config defaults rule (6D.3) checks `process.env.XXX || 'default'` patterns.

**Why it was partially covered:** The config defaults scan only targets `server/src/config/` files. Docker Compose uses a different syntax (`${VAR:-default}` vs `process.env.VAR || 'default'`). No scan pattern explicitly searches compose files for fail-open `:-` syntax.

**What's missing:** A **dedicated docker-compose default-value scan**:
```bash
grep -n ':-' docker-compose*.yml | grep -iE 'password|secret|key|token'
```

---

#### Finding #9: Server ESLint Config Missing (Medium)

**What the prompt says:** Phase 1 says "Run linters (eslint, ruff)."

**Why it was partially covered:** The prompt assumes lint RUNS and produces output to check. But if the lint config file doesn't exist, ESLint 9 flat config **silently ignores all files** and reports 0 errors. The "0 errors" result looks like a pass.

**What's missing:** A **lint config existence verification** step before running lint:
```bash
# Verify lint config exists for each project directory
for dir in . server/ mobile/; do
  if [ -d "$dir/src" ]; then
    ls "$dir"/eslint.config.* "$dir"/.eslintrc* 2>/dev/null || echo "MISSING: No ESLint config in $dir"
  fi
done
```

---

#### Finding #12: workflowEngine ReDoS at Line 743 (Medium)

**What the prompt says:** F9 scans for `new RegExp(`. 6D.4 says verify sandboxing/safe alternatives. Pitfall 17 says verify fix effectiveness.

**Why it was partially covered:** The prompt checks if `new RegExp()` calls are safe, and it checks if previous fixes are effective. But the subtlety here is that a safe function (`safeRegexTest`) existed at line 43 and was used at line 205, but a **different call site at line 743 bypassed it**. The prompt doesn't prescribe checking that security utilities are used at **ALL applicable call sites**.

**What's missing:** A **security function call-site completeness** rule:
```
When a security function (safeRegexTest, isUrlSafe, isWebhookUrlSafe, sanitize, etc.)
is found in the codebase:
1. Grep for ALL instances of the unsafe pattern it replaces (new RegExp, axios.get, etc.)
2. For each instance, verify it goes through the safe wrapper
3. Any instance that bypasses the wrapper = PRODUCTION_GAP
```

---

#### Finding #13: Elasticsearch Default Password "changeme" (HIGH)

**What the prompt says:** v6 Rule mentions checking docker-compose for "default passwords (Grafana admin)." 6D.3 says check config defaults.

**Why it was partially covered:** The v6 rule mentions Grafana but doesn't prescribe a systematic scan of ALL compose files for ALL default credentials. The Elasticsearch password was in `docker-compose.security.yml`, which uses `:-changeme` (fail-open) while the ELK compose correctly uses `:?` (fail-closed). The prompt doesn't distinguish these two Bash syntax patterns.

**What's missing:** A **compose fail-open vs fail-closed** scan:
```bash
# Find fail-OPEN defaults (:-) for security-sensitive vars in ALL compose files
grep -n ':-' $(find . -name "docker-compose*" | grep -v node_modules) | grep -iE 'password|secret|key|token|admin'
# These should be :? (fail-closed), not :- (fail-open with default)
```

---

#### Finding #14: CI Pipeline Pushes :latest to ECR (Medium)

**What the prompt says:** R3 scans for `:latest` in Dockerfiles and compose files. 8G says "Never use :latest in production."

**Why it was partially covered:** R3's grep targets Dockerfiles and compose files but does NOT scan CI workflow files. The `:latest` tag was being pushed to ECR in `.github/workflows/ci.yml` -- a CI deployment artifact, not a Docker build artifact.

**What's missing:** R3 should also scan CI pipelines:
```bash
# R3 extended: Check for :latest in CI deployment steps
grep -n ':latest' $(find . -path "*/.github/workflows/*") | grep -i 'push\|tag\|deploy'
```

---

#### Finding #15: In-Memory State Won't Survive Restart (Medium)

**What the prompt says:** O3 scans for `new Map()`, `new Set()`, etc. 8E says "No in-memory caches that can't be lost."

**Why it was partially covered:** O3 returned 103 matches. The prompt says check them but doesn't distinguish between critical in-memory state (JIT security sessions, job queues) and acceptable ephemeral state (WebRTC connections, rate limit counters). The agent needs a triage rubric.

**What's missing:** An **in-memory state criticality classification** rubric:
```
For each in-memory Map/Set/object in server code:
- CRITICAL: Security sessions, job queues, transaction state → MUST persist to Redis/DB
- HIGH: User data caches, notification preferences → SHOULD persist for reliability
- MEDIUM: ML model weights, computed caches → CAN be lost (recomputable)
- LOW: WebRTC state, rate limit counters, connection pools → EXPECTED to be ephemeral
```

---

### Findings That Reveal MISSING Prompt Patterns (New Rules Needed)

These findings expose entirely absent methodology areas:

#### Pattern Gap A: Monorepo Lint Config Verification

The prompt runs `npx eslint` but never verifies that each sub-project in a monorepo has its own config. In ESLint 9 flat config, missing `eslint.config.js` means zero files checked (silent pass).

#### Pattern Gap B: Docker Compose Bash Variable Syntax Distinction

The prompt checks for "default passwords" but doesn't distinguish `${VAR:-default}` (fail-open, uses default silently) from `${VAR:?error}` (fail-closed, crashes if unset). Security-sensitive compose variables should ALWAYS use `:?`.

#### Pattern Gap C: CI Artifact Tag Hygiene

R3 scans Dockerfiles and compose files for `:latest`. But CI pipelines often push `:latest` tags to registries as a separate step. The prompt needs a dedicated CI tag scan.

#### Pattern Gap D: Security Function Call-Site Coverage

When a safe wrapper exists (e.g., `safeRegexTest`, `isUrlSafe`), the prompt should verify the wrapper is used at ALL sites where the unsafe pattern appears. A security function used at 2 of 3 call sites means 1 bypass exists.

#### Pattern Gap E: In-Memory State Impact Classification

O3 finds all in-memory state but doesn't require classifying by business impact. Security sessions vs rate limit counters have vastly different failure modes.

---

## Proposed v9 Audit Rules

### v9 Rule 1: L7 Triage Algorithm for Large Codebases
When L7 returns >100 write operations, use this triage algorithm:
1. Group by file. Count orgId-scoped writes vs unscoped writes per file.
2. **Priority 1:** Files with MIXED org checks (some have, some don't) -- inconsistency = highest bug signal.
3. **Priority 2:** Files with ZERO org references -- entire service may be unscoped.
4. **Priority 3:** Files where ALL writes have org checks -- verify the checks are correct, not just present.

### v9 Rule 2: Lint Config Existence Verification
Before running any linter in Phase 1, verify the config file EXISTS for each project directory:
```bash
for dir in $(find . -name "package.json" -not -path "*/node_modules/*" -maxdepth 2 -exec dirname {} \;); do
  if [ -d "$dir/src" ]; then
    ls "$dir"/eslint.config.* "$dir"/.eslintrc* 2>/dev/null | head -1 || echo "GAP: No ESLint config in $dir"
  fi
done
```
If lint config is missing, report it as a MEDIUM finding (not a silent pass).

### v9 Rule 3: Docker Compose Fail-Open Variable Scan
Scan ALL docker-compose files for security-sensitive variables using fail-open syntax (`:-`):
```bash
grep -n ':-' $(find . -name "docker-compose*" -not -path "*/node_modules/*") \
  | grep -iE 'password|secret|key|token|admin|credential'
```
Each match should use `:?` (fail-closed) instead of `:-` (fail-open with default). Any `:-` on a security variable = HIGH finding.

### v9 Rule 4: CI Pipeline :latest Tag Scan
Extend R3 to scan CI workflow files for `:latest` in push/tag/deploy operations:
```bash
grep -rn ':latest' $(find . -path "*/.github/workflows/*" -o -path "*/.gitlab-ci*") \
  | grep -iE 'push|tag|deploy|ecr|registry|gcr|docker'
```
Any `:latest` pushed to a production registry = MEDIUM finding.

### v9 Rule 5: Security Function Call-Site Completeness
When a security wrapper function is discovered (safeRegexTest, isUrlSafe, sanitizeInput, etc.):
1. Identify the unsafe pattern it wraps (`new RegExp(`, `axios.get(`, `innerHTML`, etc.)
2. Grep for ALL instances of the unsafe pattern in production code
3. For each instance, verify it routes through the safe wrapper
4. Any instance bypassing the wrapper = PRODUCTION_GAP at the severity of the vulnerability class

```bash
# Example for RegExp:
SAFE_FUNC="safeRegexTest"
UNSAFE_PATTERN="new RegExp("
# Find all unsafe uses that DON'T go through the safe function
grep -rn "$UNSAFE_PATTERN" server/src/ --include="*.ts" | grep -v test | grep -v generated | grep -v "$SAFE_FUNC"
```

### v9 Rule 6: In-Memory State Criticality Classification
When O3 returns >20 in-memory state matches, classify each by business impact:
- **CRITICAL (MUST persist):** Security sessions, active access tokens, job queues, transaction state
- **HIGH (SHOULD persist):** User preferences, notification state, cache with no TTL
- **MEDIUM (CAN be lost):** ML model weights, computed caches (recomputable on restart)
- **LOW (EXPECTED ephemeral):** WebRTC connections, rate limit counters, connection pools

Report CRITICAL and HIGH in-memory state as findings. MEDIUM and LOW are informational.

### v9 Rule 7: Startup Env Validation Verification
P9 checks for env validation. If P9 < 5 matches, explicitly verify these critical vars are validated at startup:
- `DATABASE_URL` -- app crashes with clear message if missing
- `JWT_SECRET` / `JWT_REFRESH_SECRET` -- auth completely broken without these
- `ENCRYPTION_KEY` -- data decryption fails silently without this
- `PORT` (should have a default, not crash)

```bash
for VAR in DATABASE_URL JWT_SECRET JWT_REFRESH_SECRET ENCRYPTION_KEY; do
  grep -rn "$VAR" server/src/config/ server/src/index.ts --include="*.ts" | grep -iE 'throw|assert|required|\?\:' | head -1 || echo "GAP: $VAR not validated at startup"
done
```

### v9 Rule 8: Docker HEALTHCHECK Completeness
For EVERY Dockerfile found, verify HEALTHCHECK is present:
```bash
for df in $(find . -name "Dockerfile*" -not -path "*/node_modules/*"); do
  grep -q "HEALTHCHECK" "$df" || echo "GAP: No HEALTHCHECK in $df"
done
```
Missing HEALTHCHECK = MEDIUM finding (container orchestrators can't detect unhealthy containers).

### v9 Rule 9: ESLint Warning Threshold Check
Phase 1 reports lint errors but doesn't threshold warnings. If warnings > 500, it indicates systematic code quality debt:
```bash
WARNING_COUNT=$(npx eslint src/ --format json 2>/dev/null | node -e "const r=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));console.log(r.reduce((a,f)=>a+f.warningCount,0))")
if [ "$WARNING_COUNT" -gt 500 ]; then
  echo "GAP: $WARNING_COUNT lint warnings (threshold: 500)"
fi
```

### v9 Rule 10: Cross-Compose Consistency for Security Variables
When the same env variable appears in multiple compose files, verify they ALL use the same syntax:
```bash
# Find variables that appear in multiple compose files with different syntax
for VAR in POSTGRES_PASSWORD ELASTICSEARCH_PASSWORD REDIS_PASSWORD; do
  grep -h "$VAR" $(find . -name "docker-compose*" -not -path "*/node_modules/*") 2>/dev/null | sort -u
  # If both :- and :? appear for the same variable = INCONSISTENCY finding
done
```

---

## Summary: Prompt Coverage Before and After v9

| Category | Findings Covered Pre-v9 | Findings Requiring v9 Rules |
|----------|------------------------|---------------------------|
| Scan patterns (A-S) | 9 of 18 | -- |
| Multi-tenant triage | Prescribed but no triage algorithm | v9 Rule 1 |
| Lint config existence | Not checked | v9 Rule 2 |
| Compose fail-open defaults | Partially (Grafana only) | v9 Rule 3 |
| CI artifact tags | Not scanned | v9 Rule 4 |
| Security function completeness | Not prescribed | v9 Rule 5 |
| In-memory state classification | Found but not triaged | v9 Rule 6 |
| Startup env validation depth | Shallow (count only) | v9 Rule 7 |
| Docker HEALTHCHECK completeness | Implied but not enforced | v9 Rule 8 |
| Lint warning threshold | Not checked | v9 Rule 9 |
| Cross-compose consistency | Not checked | v9 Rule 10 |

**With v9 rules added, all 18 findings would be caught by the methodology itself, not by agent initiative.**
