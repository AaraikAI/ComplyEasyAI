# Classification Guide (Visionary Edition)

When reviewing scan findings, every single result must be classified. This guide helps make consistent, accurate classifications by providing decision trees, AST-level context resolution, and examples.

## The Four Classifications

| Classification | Meaning | Action |
|---|---|---|
| `INTENTIONAL_FEATURE` | Code IS the product (e.g., a mock interview tool, simulation engine, red team tool, Monte Carlo, test generator, digital twin, phishing simulator, placeholder UI text that is the actual content). | No action. Note in report as confirmed intentional. |
| `DEV_FALLBACK` | Has a production guard — `process.env.NODE_ENV`, feature flag, config switch, or conditional that disables it in prod. | Note in report. Verify the guard works. Low priority. |
| `PARTIALLY_WIRED` | Component makes SOME API calls but also has significant hardcoded `DEFAULT_*`/`DEMO_*` data that is NOT replaced by API responses. The wired portions work; the static portions show fabricated data to users. | **Must document: (a) what IS wired, (b) what is STILL static, (c) whether static data persists alongside real data or is replaced on mount.** Score as 50-75% complete. |
| `PRODUCTION_GAP` | Missing real implementation. Code that needs to change before production. | **Must be in the fix list with full instructions and a patch.** |
| `FALSE_POSITIVE` | Grep matched but context shows it's fine. Keyword appears in a variable name, comment about completed work, documentation, etc. | Exclude from report. |

## Decision Trees

### "mock" keyword found
```
Is it in a test file? → Skip (should have been excluded)
Is "mock" part of a word like "mockup", "mockingbird"? → FALSE_POSITIVE
Is it a mock service/function in production code?
  → Does it have a NODE_ENV/feature flag guard? → DEV_FALLBACK
  → Is it the product (e.g., mock interview app)? → INTENTIONAL_FEATURE
  → Neither? → PRODUCTION_GAP
```

### "TODO" found
```
Does the comment say "TODO: done" or "TODO: completed in PR #X"? → FALSE_POSITIVE
Is it "TODO" in a string literal (UI text "TODO list app")? → FALSE_POSITIVE
Is it a genuine work item that needs doing? → PRODUCTION_GAP
  Priority depends on what's TODO:
  - "TODO: implement auth" → Critical
  - "TODO: add telemetry" → Medium
  - "TODO: optimize query" → Low (unless perf is critical)
```

### "return null" / "return []" found
```
Read the full function:
Is this the "not found" / "no results" path of a function that also has a success path? → FALSE_POSITIVE
Is this the ONLY return in the function (function always returns empty)? → PRODUCTION_GAP
Is it a placeholder return at the end of an unfinished function? → PRODUCTION_GAP
Is it behind a feature flag / env check? → DEV_FALLBACK
```

#### AST Context Resolution (VISIONARY)

When `return null` or `return []` is found, go beyond the function itself — trace its callers:

1. **AST Check**: Use AST resolution (or grep-based call graph) to trace all callers of the function. Do they expect real data (e.g., mapping over results, rendering lists, computing totals)?
2. **Caller Expectation Analysis**: If callers iterate, render, or compute from the return value, a stub return is a **silent failure** — the feature appears to work but produces empty/broken output.
3. **Healer Action**: If callers expect data but the function is a stub, classify as `PRODUCTION_GAP`. The fix instruction MUST synthesize the real implementation — the actual DB query, API call, or computation — not just flag it for later.

```bash
# Example: Find all callers of a suspected stub function
grep -rn "functionName(" --include="*.ts" --include="*.tsx" --include="*.js" | grep -v node_modules | grep -v test | grep -v "function functionName\|const functionName"
# Then read each caller to see what it does with the return value
```

### "placeholder" found
```
Is it an HTML/JSX input placeholder attribute? → Usually FALSE_POSITIVE
Is it placeholder text like "Lorem ipsum" in a content area? → PRODUCTION_GAP (unless it's a template)
Is it "placeholder" in a variable/function name? → Read context, likely FALSE_POSITIVE
Is it a placeholder implementation? → PRODUCTION_GAP
```

### "localhost" / "127.0.0.1" found
```
Is it in a .env file or .env.example? → FALSE_POSITIVE (that's where it belongs)
Is it in code with a process.env/config fallback?
  e.g., `const url = process.env.API_URL || 'http://localhost:3000'`
  → DEV_FALLBACK (acceptable, but verify the env var is set in production)
Is it hardcoded without any env var reference?
  → PRODUCTION_GAP (Critical if it's an API URL, Medium if it's a dev tool URL)
```

### "console.log" found
```
Is it in a logger configuration file? → FALSE_POSITIVE
Is it in a development-only utility? → DEV_FALLBACK
Is it in a service/controller/route handler? → PRODUCTION_GAP (Medium severity)
  Note: This is a code quality issue, not usually a deployment blocker.
  But excessive console.log can leak sensitive data and hurt performance.
```

### "Math.random()" found
```
Is it in a simulation/testing feature that IS the product? → INTENTIONAL_FEATURE
Is it generating UUIDs or session IDs? → PRODUCTION_GAP (use crypto.randomUUID())
Is it in a seed/faker file for test data? → FALSE_POSITIVE
Is it in business logic that should use deterministic or crypto-secure randomness? → PRODUCTION_GAP
```

### "DEFAULT_*" / "DEMO_*" constant found (v3 addition)
```
Does a useEffect/useQuery call an API and REPLACE this constant with real data? → WIRED_WITH_FALLBACK (DEV_FALLBACK)
Does the DEFAULT_*/DEMO_* array persist as the ONLY data source (no API call)? → PRODUCTION_GAP
Is the component listed in .claude/CLAUDE.md as intentionally static? → INTENTIONAL_STATIC (FALSE_POSITIVE)
Does the component make SOME API calls but this specific array is never replaced? → PARTIALLY_WIRED (document what's wired vs static)
Is this in a test file or utility? → FALSE_POSITIVE
```

**WARNING: Neutral naming is a stronger signal of real gaps.** Components using `DEFAULT_*`, `DEMO_*`, `INITIAL_*` instead of `mock*`/`fake*` are MORE likely to be production gaps because the naming was specifically chosen to avoid triggering keyword scanners. Always read the full file.

---

## Writing Fix Instructions

For every PRODUCTION_GAP, the fix instruction must be **implementable without guessing**. Here's the template:

### Bad fix instruction:
> "Implement proper error handling"

### Good fix instruction:
> Replace the empty catch block at line 45 with:
> ```typescript
> catch (error) {
>   logger.error('Failed to process invoice', { 
>     invoiceId, 
>     error: error instanceof Error ? error.message : String(error),
>     stack: error instanceof Error ? error.stack : undefined
>   });
>   throw new AppError('INVOICE_PROCESSING_FAILED', 'Failed to process invoice', 500, error);
> }
> ```
> This requires the `AppError` class from `src/utils/errors.ts` and the `logger` from `src/utils/logger.ts`. If these don't exist yet, create them as part of the deployment blockers fixes.

### Fix instruction checklist:
- [ ] Exact file path and line number
- [ ] The current problematic code (so the developer can find it)
- [ ] The replacement code or detailed specification
- [ ] Any dependencies the fix requires (other files, packages, DB changes)
- [ ] Whether this fix depends on another fix being done first

## Severity Guidelines

| Severity | Criteria | Examples |
|----------|----------|---------|
| **Critical** | App will crash, data will be lost, security vulnerability, core feature completely non-functional | Missing auth on sensitive endpoints, SQL injection, empty service that should return real data, missing DB table |
| **High** | Feature significantly broken, poor user experience, missing important validation | Mock data shown to users, missing error handling that causes silent failures, missing input validation |
| **Medium** | Feature works but has issues, code quality problems, missing best practices | Console.log in production, missing rate limiting, hardcoded URLs with env fallback, missing indexes |
| **Low** | Nice-to-have improvements, minor code quality | Outdated TODO comments, minor naming inconsistencies, missing optional optimizations |

---

## Fix-Code Exemption Patterns (v2 — Prevents Hydra Effect)

These patterns commonly appear in CORRECTLY FIXED code. Classify as `FALSE_POSITIVE` unless additional evidence shows a real problem:

| Scan Pattern Match | Why It Appears in Fixed Code | Correct Classification |
|---|---|---|
| G1 match on `logger.warn(...)` / `logger.error(...)` | Fix replaced empty catch with structured logging | FALSE_POSITIVE |
| A4 match on comment containing "hardcoded" / "previously" | Comment documents what was changed | FALSE_POSITIVE |
| E1/E3 match on new try/catch blocks | Fix added proper error handling | FALSE_POSITIVE if catch body has logger/throw/return |
| B1 match on "TODO: verify in staging" | Post-fix verification note | FALSE_POSITIVE if implementation is complete |
| C2 match on `throw new AppError(...)` | Fix uses proper error class | FALSE_POSITIVE |

**Rule:** Keyword alone is NEVER sufficient for PRODUCTION_GAP classification.

---

## Mandatory Evidence Format for Classifications (v2)

Every classification MUST cite specific file lines. Classifications without evidence are invalid.

**PRODUCTION_GAP:** `File: [path]:[lines]. Function X returns static array. Searched for useEffect/useQuery/api.* — NONE found.`

**FALSE_POSITIVE:** `File: [path]:[lines]. Line N has "mock" in comment. Lines N+5-N+12 show useEffect calling real API.`

**INTENTIONAL_FEATURE:** `File: [path]. Static catalog component listed in .claude/CLAUDE.md.`

**DEV_FALLBACK:** `File: [path]:[lines]. NODE_ENV check at line N. Dev: simulated. Prod: real service at line M.`

---

## v4 Classification Decision Trees (Service-Layer & Coverage)

### Outbound HTTP call found (F7)
```
Is the URL from a constant or env var? → FALSE_POSITIVE
Is the URL from user input / DB / request params?
  → Does SSRF validation exist (isWebhookUrlSafe, URL allowlist, IP blocking)? → FALSE_POSITIVE
  → No validation? → PRODUCTION_GAP (HIGH — SSRF vulnerability)
  → Different service has validation but THIS call bypasses it? → PRODUCTION_GAP (HIGH — inconsistent protection)
```

### Write operation without organizationId (L7)
```
Is this a write to a system/global table (settings, migrations)? → FALSE_POSITIVE
Is this a write to user/org-scoped data?
  → Does the function verify org ownership before writing? → FALSE_POSITIVE
  → Does the function accept organizationId but not use it in the query? → PRODUCTION_GAP (HIGH — multi-tenant isolation gap)
  → Does a sibling function in the same service HAVE the org check? → STRONGER signal of bug
```

### Credential storage (F8)
```
Is this a type definition / interface? → FALSE_POSITIVE
Is this a DB query comparing credentials?
  → Plaintext comparison (`where: { bearerToken: token }`)? → PRODUCTION_GAP (MEDIUM — store hashed)
  → Hashed comparison? → FALSE_POSITIVE
Is this reading/writing credentials to DB?
  → Stored in plaintext? → PRODUCTION_GAP (MEDIUM)
  → Stored hashed? → FALSE_POSITIVE
```

### throw new Error() in service (F11)
```
Is this in a service file (server/src/services/)? → Check further
  → Should the error map to a specific HTTP status (404, 409, 400)?
  → If yes → PRODUCTION_GAP (MEDIUM — use AppError with correct status)
  → If it's a genuine 500 internal error → FALSE_POSITIVE (but consider AppError for consistency)
Is this in a utility, middleware, or non-HTTP code? → FALSE_POSITIVE
```

### Silent .catch(() => {}) (L11)
```
Is the caught promise a fire-and-forget background operation? → DEV_FALLBACK (LOW — but should log)
Is the caught promise a user-facing save/write operation?
  → User believes data was saved but error was swallowed → PRODUCTION_GAP (MEDIUM)
Is the caught promise a read/refresh operation?
  → Stale data shown without user knowing → PRODUCTION_GAP (LOW-MEDIUM)
```

### No-op action handler
```
Does the handler return { status: 'success' }?
  → Does it contain a DB write / API call / side effect? → FALSE_POSITIVE (action works)
  → Does it only log and return without side effect? → PRODUCTION_GAP (LOW-MEDIUM — no-op handler)
```

### Manual error response in route (L10)
```
Does the route catch errors and call `res.status(N).json(...)`?
  → Instead of calling `next(error)` or throwing AppError? → PRODUCTION_GAP (LOW — bypasses global handler)
  → Is there a reason for manual handling (streaming response, SSE, SCIM/SAML protocol)? → FALSE_POSITIVE for format, but still flag for missing Sentry/logger capture
```

---

## v5 Classification Decision Trees (Depth & Verification)

### DEV_FALLBACK reclassification check (Pitfall 20)
```
Component classified as DEV_FALLBACK/WIRED_WITH_FALLBACK?
  → List ALL DEMO_*/DEFAULT_* arrays (count = M)
  → List ALL useEffect/useQuery that call setState (count = N)
  → If N == M (every array is replaced on mount) → DEV_FALLBACK confirmed
  → If N < M (some arrays never replaced) → reclassify to PARTIALLY_WIRED
  → Test: "After mount + all API calls, does ANY DEMO_ data remain visible?" If yes → PARTIALLY_WIRED
```

### Fix effectiveness (Pitfall 17)
```
Previous finding marked "FIXED"?
  → Read the fix code
  → Does it FULLY prevent the attack?
    → ReDoS: Length guard only? → INSUFFICIENT (need re2 or timeout)
    → SSRF: URL format check only? → INSUFFICIENT (need private IP blocking)
    → Multi-tenant: Pre-check lookup only? → Acceptable but note defense-in-depth gap
  → If insufficient → NEW finding: "Fix present but ineffective"
```

### Migration dependency (Pitfall 18)
```
Code references a migration that may not exist?
  → Check for "requires migration" comments
  → Check if migration file exists in prisma/migrations/
  → If migration missing → HIGH (code/DB mismatch — functionality silently broken)
  → If migration exists but post-dates the code → verify it covers the requirement
```

### Dockerfile runtime compatibility (Pitfall 19)
```
Dockerfile has NODE_OPTIONS or runtime flags?
  → --force-fips + Alpine base → MEDIUM (Alpine OpenSSL not FIPS-certified → crash)
  → --force-fips + Ubuntu/RHEL with FIPS module → FALSE_POSITIVE
  → Native modules + Alpine → check if compilation deps are in the image
```

### Config default security — domain-specific (Pitfall 21)
```
process.env.XXX || 'default' in config file?
  → Is the default a localhost URL with plaintext protocol (mqtt://, http://)? → MEDIUM
  → Is the default a key with length below algorithm minimum (16 chars for AES-256)? → LOW
  → Is the default 'false' or '0' for a security feature? → MEDIUM if it disables protection
  → Is the default empty string with startup validation? → FALSE_POSITIVE (fail-closed)
```

---

## v7 Classification Rules (Completion & Anti-Rationalization)

### "Review needed" is NOT a classification (Pitfall 28)
```
Scan output listed as "Review needed" or "TBD"?
  → This is INVALID. Every match MUST be classified as one of:
    FALSE_POSITIVE, DEV_FALLBACK, INTENTIONAL_FEATURE, PARTIALLY_WIRED, or PRODUCTION_GAP
  → If context is insufficient to classify, read the full file
  → If there are >50 matches in a category, classify per-file (not per-line)
  → "Review needed" in a report = INCOMPLETE AUDIT
```

### Multi-tenant write severity — no downgrading (Pitfall 29)
```
Write operation (.create/.update/.delete) without organizationId?
  → ALWAYS at least HIGH severity
  → Do NOT downgrade because:
    - "It's a read-only lookup" → .create() is never read-only
    - "The data isn't sensitive" → multi-tenant isolation is binary, not risk-weighted
    - "The vendor already belongs to the org" → verify, don't assume
  → Only exception: system/global tables (settings, migrations, auth tokens)
```

### Agent fatigue sampling (Pitfall 27)
```
Report checks fewer items than scan-runner counted?
  → Example: scan-runner found 120 components, report checks 15
  → This is INCOMPLETE, not "done"
  → If context limits prevent full coverage:
    1. Process as many as possible
    2. State explicitly: "Checked X of Y — Z remaining for follow-up"
    3. Do NOT present X as if it were Y
```

---

## v9 Classification Decision Trees (Methodology Completeness)

### Docker Compose fail-open default (T1)
```
Variable uses :- syntax (e.g., ${PASSWORD:-changeme})?
  → Is the variable security-sensitive (password, secret, key, token, admin)?
    → YES: Is the default empty string (:-)?
      → Empty string for optional API keys → FALSE_POSITIVE (graceful degradation)
      → Empty string for required auth → PRODUCTION_GAP (MEDIUM — silent auth failure)
    → YES: Is the default a non-empty value (:-changeme, :-localdev123)?
      → PRODUCTION_GAP (HIGH — fail-open with weak default)
    → NO: Not security-sensitive → FALSE_POSITIVE
  → Variable uses :? syntax → FALSE_POSITIVE (fail-closed, correct)
```

### Security wrapper bypass (T4)
```
Safe wrapper exists (safeRegexTest, isUrlSafe, etc.)?
  → Raw unsafe pattern found outside the wrapper function?
    → Is it INSIDE the safe wrapper's own implementation? → FALSE_POSITIVE
    → Is the input from internal/constant sources? → FALSE_POSITIVE
    → Is the input user-controllable or from DB? → PRODUCTION_GAP (severity matches vuln class)
    → Is the pattern in a generated file? → FALSE_POSITIVE
```

### In-memory state criticality (T8)
```
In-memory Map/Set/object found in server service?
  → What data does it hold?
    → Security sessions, access tokens, auth state → CRITICAL (MUST persist)
    → Job queue state, task allocations → CRITICAL (jobs lost on restart)
    → User preferences, notification state → HIGH (data lost, user impact)
    → ML model weights, computed caches → MEDIUM (recomputable, informational only)
    → WebRTC state, rate counters, connection pools → LOW (ephemeral by design, informational)
  → Does it have TTL/expiry logic? → Reduce severity by one level
  → Is there a Redis/DB fallback? → FALSE_POSITIVE
```

### Cross-compose inconsistency (T7)
```
Same variable uses :- in one compose file and :? in another?
  → Are the files for different profiles (dev vs prod)?
    → Dev uses :- with weak default, prod uses :? → MEDIUM (document as accepted risk)
    → Both are production compose files → HIGH (inconsistent security posture)
  → Same compose file, different services?
    → PRODUCTION_GAP (HIGH — some services protected, others not)
```

---

## v12 Classification Decision Trees

### T16: Node Version Mismatch
```
Is CI Node major version == Docker Node major version?
  YES → Is package.json engines consistent?
    YES → FALSE_POSITIVE
    NO → MEDIUM (engines field should match)
  NO → HIGH (tested on different runtime than production)
```

### T17: Server Console Statements
```
Is the console.* call in server/src/ (not test/scripts/CLI)?
  YES → Is it in a catch block with no logger.error()?
    YES → LOW (should use logger.*)
    NO → Is it the only logging in the function?
      YES → LOW (replace with logger.*)
      NO → FALSE_POSITIVE (likely debug leftover)
  NO → FALSE_POSITIVE (scripts/CLI/frontend are OK)
```

### T18: Dev Compose Literal Security Values
```
Is the literal value in a dev-only compose profile?
  YES → Is there a prod compose that uses ${VAR:?...}?
    YES → LOW (dev-only, prod is safe)
    NO → MEDIUM (no profile separation)
  NO → MEDIUM (literal secret may reach production)
```

### T19: Auth-Critical Endpoint Validation
```
Does the auth endpoint (login/register/forgot-password/etc.) have validateBody()?
  YES → FALSE_POSITIVE
  NO → Does it validate via other means (manual checks, schema)?
    YES → LOW (non-standard but present)
    NO → MEDIUM (auth endpoint without validation)
```

### T20: Fixable Vulnerability
```
Is the vulnerability fixable via npm audit fix?
  YES → Was npm audit fix run?
    YES → FALSE_POSITIVE (fixed)
    NO → Same severity as npm audit reports (action required)
  NO → Is it in audit-exclusions.json?
    YES → FALSE_POSITIVE (known unfixable)
    NO → Report at npm audit severity
```

### T22: SSO/SCIM Error Handling
```
Does the catch block in sso.ts/scim.ts have logger.error()?
  YES → Does it include security context (IP, session)?
    YES → FALSE_POSITIVE
    NO → LOW (logging present but missing context)
  NO → Does res.status() bypass global error handler?
    YES → HIGH (security auth failure not tracked by Sentry)
    NO → MEDIUM (error swallowed silently)
```

### T25: ReDoS Wrapper Effectiveness
```
Does safeRegexTest use re2 or timeout?
  YES → FALSE_POSITIVE (effective protection)
  NO → Does it use only .length guard?
    YES → INSUFFICIENT — all call sites still vulnerable
      → MEDIUM for each call site using the wrapper
    NO → What protection does it use?
      → Evaluate on a case-by-case basis
```

### T23: Cross-Audit Reconciliation Classification
```
Was the finding flagged by another tool but not by this audit?
  YES → Read the file cited in the other tool's report
    → Is the issue present in current code?
      YES → STILL_OPEN (include in report at original severity)
      NO → FIXED (note in reconciliation table)
  NO → Normal classification per existing decision trees
```

---

### v13 Enriched Output Classification (Hint-Based)

When the scan-runner v3.2+ produces enriched output files (`/tmp/audit_L7_enriched.txt`, `/tmp/audit_F7_enriched.txt`), each block includes a HINT that accelerates classification. The agent verifies the hint against the context block — hints are starting points, not final verdicts.

#### L7 Hint → Classification Mapping

```
HINT: ORG_SCOPED
  Read the context block. Is organizationId genuinely in the WHERE clause or data object?
    YES → FALSE_POSITIVE (write is correctly scoped)
    NO (orgId is in a different statement, not this write) → Reclassify as ORG_IN_FUNC_NOT_IN_WRITE

HINT: ORG_IN_FUNC_NOT_IN_WRITE
  Read the context block. Does the function use orgId in a prior findFirst/findMany to verify ownership?
    YES → PARENT_VERIFIED (defense-in-depth — orgId used for lookup, not in write WHERE)
    NO → PRODUCTION_GAP (HIGH) — orgId exists in function but this specific write is unscoped

HINT: NO_ORG_CHECK
  Read the context block. Is this a system-level operation (migration, seed, background job)?
    YES → N/A (system-level)
    NO → Is the function called only from authenticated routes with org context?
      Unclear from context → PRODUCTION_GAP (HIGH)

HINT: CHILD_ENTITY_NO_ORG
  Read the context block. Does the function verify the parent entity belongs to the caller's org?
    YES (findFirst with id + organizationId on parent) → PARENT_VERIFIED
    NO → PRODUCTION_GAP (HIGH) — child entity can reference cross-tenant parent
```

#### F7 Hint → Classification Mapping

```
HINT: ENV_URL_SAFE
  Verify: the URL is from process.env and function does NOT accept URL override parameter
    Confirmed → FALSE_POSITIVE
    Function has baseUrl/url/endpoint parameter missed by hint → Reclassify to PARAM_URL_NO_VALIDATION

HINT: CONSTANT_URL_SAFE
  Verify: URL is a hardcoded https:// string to a known-safe domain
    Confirmed → FALSE_POSITIVE

HINT: VALIDATED
  Verify: isUrlSafe() or equivalent is called BEFORE the HTTP request in the execution path
    Confirmed → FALSE_POSITIVE
    Called after or in a different branch → PRODUCTION_GAP (MEDIUM)

HINT: PARAM_URL_NO_VALIDATION
  This is a strong signal for PRODUCTION_GAP. Verify:
    Is the URL parameter user-controllable (from request body, DB, or external input)?
      YES → PRODUCTION_GAP (MEDIUM — SSRF risk)
      NO (only called internally with known values) → LOW risk, document

HINT: DYNAMIC_URL_NO_VALIDATION
  Same as PARAM_URL_NO_VALIDATION but URL source is dynamic (DB field, computed).
    → PRODUCTION_GAP (MEDIUM) unless proven to be internal-only
```

#### Service Summary Classification

For each service in `/tmp/audit_service_summary.txt`:
```
ORG_FLAG: MIXED_ORG
  → Priority 1 investigation. Read the WRITE_DETAILS section.
  → Every [NO_ORG] line is a candidate PRODUCTION_GAP (HIGH)
  → Cross-reference with L7 enriched blocks for full context

ORG_FLAG: ZERO_ORG
  → Priority 2 investigation. May be a system-level service (no tenant data)
  → or a completely unscoped service (every write is a gap)
  → Check if the service handles user/tenant data at all

ORG_FLAG: ALL_ORG_SCOPED
  → Priority 3 — verify correctness, not just presence
  → Spot-check that orgId is in WHERE clauses, not just in logging

ORG_FLAG: NO_WRITES
  → Read-only service. Check OUTBOUND_HTTP for SSRF instead.
```
