---
name: production-readiness-audit-visionary
description: Perform a deep, exhaustive forensic scan of an entire codebase to produce a complete production-readiness report. This visionary version integrates AST Semantic Parsing, VLM-driven UI verification, Autonomous Red Teaming, and Chaos Engineering. Use this whenever the user wants to audit a codebase for production readiness, find all issues blocking deployment, scan for mocks/stubs/TODOs/incomplete implementations, verify full-stack feature completeness (UI → API → DB), or generate a prioritized fix list. Also trigger when the user says things like "is my app ready for production", "audit my code", "find all issues", "what's left to finish", "deployment blockers", "forensic scan", "production gaps", "codebase health check", "readiness report", "red team my app", "chaos test", or "visual audit". This skill is specifically designed to catch EVERYTHING in a single pass — no truncation, no sampling, no incremental discovery.
---

# Production Readiness Audit — Visionary Autonomous Engine

## Why This Skill Exists

The #1 problem with codebase audits is **incremental discovery** — you scan, fix, re-scan, and find MORE issues. This happens because of truncated output, hidden dependency chains, shallow pattern matching, and missing layers. This skill acts as an **Autonomous Principal DevSecOps Engineer**. It eliminates blind spots by combining **AST Semantic Graphing, VLM Flow Simulation, Autonomous Red Teaming, Chaos Engineering, and Auto-Healing Code Generation**.

Going live requires more than clean code. It requires verified feature completeness, validated application logic, hardened security, and production-grade infrastructure. This skill covers all domains in a single pass.

## Core Principles (The Visionary Mandate)

1. **No Truncation.** Every scan result must be captured. No `head`, `tail`, or `| head -N`. If there are 1,000 TODOs, list 1,000 TODOs. Capture everything to temp files and process the full set.
2. **Dependency Tracing.** When you find an issue in file A, check every file that imports A. If a service is a stub, trace every UI component and API endpoint that depends on it.
3. **AST Semantic Graphing.** Do not rely solely on keyword matching. Construct a semantic map of the codebase using AST parsing to trace dynamic imports, complex scopes, and hidden stubs that lack keywords.
4. **Adversarial Exploitation.** If a vulnerability is found, synthesize a payload and actively attempt to exploit it locally to verify severity. This is Autonomous Red Teaming.
5. **Visual Verification (VLM).** Use Vision-Language Models to visually confirm loading, error, and empty states via synthesized Playwright scripts. Screenshot and evaluate actual rendered UI.
6. **Chaos Engineering.** Verify infrastructure resilience by actively simulating faults (e.g., killing DB connections, injecting latency) in a local containerized environment.
7. **Auto-Healing Resolution.** The primary output is not just a report — it's a set of executable patches and PRs ready for user approval.
8. **One pass, zero surprises.** The user fixes everything in this report and the app is production-ready.
9. **Detect the stack.** Don't assume any framework — discover what's there and adapt all checks.
10. **Evidence-based findings only.** NEVER flag a finding based on assumption or inference alone. Every finding MUST cite the specific file, line number, and code pattern that proves the issue exists. If an anti-pattern grep returns zero results, do NOT assume the problem exists anyway — instead, run a positive verification grep to confirm the correct pattern IS present. A finding without evidence is not a finding.

## Known Audit Pitfalls (Lessons from Past False Positives)

These are real mistakes made in previous audits of this codebase. They are documented here so they are never repeated.

### Pitfall 1: Anti-Pattern-Only Scanning

**What happened:** The audit had a grep that searched for `document.cookie`, `token.*query`, and `searchParams.*token` (anti-patterns). The grep returned zero results — the bad patterns did not exist. But the auditor **assumed** the problem existed anyway and reported "evidence upload uses `document.cookie`" as a CRITICAL finding (GAP #5). This was a false positive that persisted across multiple audit rounds.

**Why it happened:** The scan could only detect the *presence* of bad code, not the *absence* of good code. When the anti-pattern grep returned nothing, there was no follow-up scan to positively confirm "yes, `credentials: 'include'` IS being used correctly."

**Rule:** Every anti-pattern scan MUST be paired with a positive verification scan. Zero anti-pattern results does NOT mean the feature is broken — it may mean it was already correct. See Phase 4B.2 and Section 6.1 for the concrete positive verification commands.

### Pitfall 2: Descriptive-Only Phase Steps

**What happened:** Phase 4B said "trace each feature through all layers" with a table of what to check (UI/Page, API Endpoint, Service/Logic, Database, Auth/Permissions). But it had no executable commands — no greps, no scripts, no concrete verification steps. The auditor was left to manually read files and make judgment calls, which led to assumption-based findings.

**Why it happened:** Descriptive checklists invite confirmation bias. When an auditor *expects* a problem (e.g., "httpOnly cookies + evidence upload = must be extracting tokens wrong"), they report it without running a command that would disprove their assumption.

**Rule:** Every phase step MUST include executable commands. If a step says "verify X," it must include the `grep`, `curl`, or `node -e` command that actually verifies X. Descriptive text is context — commands are proof. See Phase 4B.1–4B.4 for the concrete commands.

### Pitfall 3: No Positive Auth Verification

**What happened:** The auth consistency check (Section 6) only searched for bad patterns (`document.cookie`, tokens in URLs). It never verified that the correct pattern (`credentials: 'include'` or a centralized API service) was actually in use. So when the bad-pattern search was clean, the auditor had no way to confirm "auth IS correctly implemented" and instead inferred it was broken.

**Why it happened:** Security scans are often designed as "find bad things." But production readiness also requires "confirm good things exist." A feature that has NEITHER the bad pattern NOR the good pattern is genuinely broken. A feature that has the good pattern and NOT the bad pattern is correct. Only the scan can tell the difference.

**Rule:** For auth, data flow, and any security-sensitive feature: scan for anti-patterns AND scan for required patterns. The verdict depends on BOTH results, not just one. See Section 6.1 for the three-step positive auth verification.

### Pitfall 4: Fix-Induced False Positives (The Hydra Effect)

**What happens:** Claude fixes an empty catch block by adding `logger.warn()`. The next scan matches `logger.warn` as G1 (console statements). Or Claude adds a comment "// Previously hardcoded, now fetches from API" and "hardcoded" triggers A4. Net result: fix 1 issue, create 1 new false positive. Score stays flat or drops.

**Rules to prevent this:**
1. **Read `.claude/CLAUDE.md`** before generating ANY fix code. It contains fix implementation guidelines.
2. Use `logger.warn()` not `console.warn()`. Use `AppError` not `throw new Error('not implemented')`.
3. Never add comments containing scan-trigger words: "hardcoded", "mock", "fake", "placeholder", "for now", "temporarily"
4. After applying fixes, verify no new scan matches: `grep -c "PATTERN" MODIFIED_FILE`
5. The scan-runner.sh v2 loads `.claude/audit-exclusions.json` to exclude known-good patterns

### Pitfall 5: Trusting MEMORY.md Without Code Verification

**What happened in this codebase:** MEMORY.md stated "SAML signature verification added" (2026-03-19) but actual code at `server/src/routes/sso.ts` still contained `// TODO: Integrate xml-crypto`. The fix was claimed but never implemented. Agents trusted MEMORY.md and skipped the finding.

**Rule:** NEVER trust claims in MEMORY.md or conversation history as evidence that a fix was implemented. For EVERY claim related to a security fix:
1. Read the actual file cited in the claim
2. Verify the fix code exists at the specific lines (not just a comment or TODO)
3. If the claim is false: FLAG IT as a finding AND note the discrepancy
4. MEMORY.md is a changelog of INTENTIONS. The codebase is the ONLY source of truth.

### Pitfall 6: Feature Checklist Sampling (Checking "Top N" Instead of Exhaustive) (v3 addition)

**What happened:** The audit checked the "top 15 features" and found all were wired. But the codebase had 100+ components. The remaining 85+ were never checked, and 26 of them (16 partially wired + 10 fully static) had real production gaps.

**Why it happened:** The prompt said "check top 15" because that's a reasonable-sounding scope. But "top 15" is a sample, not an exhaustive scan. The scan-runner found keyword matches only for components using words like "mock" or "hardcoded." Components using "DEFAULT_" or "DEMO_" naming conventions were invisible to keyword scans.

**Rule:** Phase 4 MUST enumerate ALL components, not sample "top N." Use the scan-runner's Component Wiring Audit output (`/tmp/audit_static_components.txt` and `/tmp/audit_partially_wired.txt`) as the starting checklist. Every STATIC_ONLY and PARTIALLY_WIRED component must be individually investigated. See `references/feature-completeness.md` Step 7.5 for the detailed protocol.

### Pitfall 7: ESLint/Dependency Version Regression (v3 addition)

**What happened:** Commit `f41409f` fixed 791 ESLint errors to 0. Then Dependabot bumped `eslint` from 10.0.3 to 10.1.0, which reintroduced 1 error + 1258 warnings due to new/stricter rules.

**Rule:** After running lint in Phase 1, check `git log` for any dependency bumps (Dependabot/Renovate) that occurred AFTER the last lint fix commit. If a lint tool was upgraded, the new rules may surface new warnings. Report this as a regression, not an original issue.

### Pitfall 8: Service-Layer Security Blind Spot (v4 addition)

**What happened:** The audit checked `webhookService.ts` and confirmed it had SSRF protection via `isWebhookUrlSafe()`. But `workflowEngine.ts` ALSO made outbound HTTP calls via raw `axios()` with user-supplied URLs — completely bypassing the SSRF protection. The audit declared "SSRF protected" after finding ONE correct implementation, not checking ALL outbound call sites.

Similarly, `getVendorById` correctly filtered by `organizationId`, so the audit declared vendor risk "multi-tenant safe." But `createVendorAssessment` and `completeVendorAssessment` in the SAME file had no org check. The audit checked one function and extrapolated to the whole service.

**Rule — Exhaustive Service-Layer Security Trace (MANDATORY Phase 6.1):**
1. **ALL outbound HTTP calls:** `grep -rn "axios\|fetch(\|got(\|request(\|http\.\|https\." server/src/ --include="*.ts" | grep -v node_modules | grep -v test` — verify EVERY call site has SSRF/URL validation, not just the "main" one.
2. **ALL write operations must check organizationId:** For EVERY `.create()`, `.update()`, `.delete()`, `.upsert()` in service files, verify the entity being modified belongs to the caller's organization. Check the FULL service file, not just one function.
3. **ALL credential storage patterns:** Search for ALL token/key storage (not just JWT/passwords): `grep -rn "bearerToken\|apiKey\|secretKey\|accessToken\|serviceToken" server/src/ --include="*.ts"` — verify each is hashed or encrypted.
4. **Cross-entity consistency:** When a function (like search indexing) processes multiple entity types, verify ALL entity types have the same security controls (e.g., orgId filter). One missing filter among 5 entities = cross-tenant data leak.

### Pitfall 9: Coverage Existence vs. Coverage Completeness (v4 addition)

**What happened:** The audit found that input validation middleware (Joi) was used in the codebase and reported "validation present." But only 35 of 67 route files (52%) actually had it. The audit confirmed the EXISTENCE of a security control but never measured its COVERAGE.

Same pattern for rate limiting: the audit found `apiLimiter` middleware and reported "rate limiting present." But 3 route groups (billing, SSO, SCIM) were mounted without it.

**Rule — Coverage Measurement (MANDATORY):**
For every security control that should be universal, measure coverage as a percentage:
1. **Input validation:** Count route files WITH validation / total route files with POST/PUT/PATCH. Report exact %.
2. **Rate limiting:** List ALL route mounts in `index.ts`/`app.ts`. Mark which have rate limiting. Report gaps.
3. **Error handler coverage:** List all error types the global handler catches (SyntaxError, AppError, etc.). Check for missing types (MulterError, PrismaClientKnownRequestError, etc.).
4. **Auth middleware:** Count protected endpoints / total endpoints. Any unprotected non-public endpoint = CRITICAL.

A control that exists at 52% coverage is NOT "present" — it's "partially implemented."

### Pitfall 10: Business Logic Correctness Not Verified (v4 addition)

**What happened:** The compliance history endpoint was confirmed to "exist and return data." But the averaging algorithm was mathematically wrong — it divided by total count across metric types instead of per-type count. The audit verified the route WORKS but not that it computes CORRECTLY.

Similarly, the workflow engine's `add_tag` action returned `status: 'success'` but never wrote to the database. The audit confirmed the action "runs" but not that it "does what it claims."

**Rule — Business Logic Validation (Phase 5 enhancement):**
1. For every calculation/aggregation endpoint, trace the algorithm and verify mathematical correctness. Especially: averaging (per-group vs. global), rounding, division-by-zero guards, floating-point currency.
2. For every action/handler that claims to perform an operation (create, update, delete, send, tag, notify), verify the actual DB write / API call / side effect EXISTS in the code. A handler that logs "success" without performing the operation = PRODUCTION_GAP.
3. For every CRUD service, verify that all advertised operations actually persist changes. `status: 'success'` is not evidence of persistence — the Prisma/DB call is.

### Pitfall 11: Default/Fallback Security Not Checked (v4 addition)

**What happened:** The CORS middleware was confirmed present with origin checking. But when `CORS_ORIGIN` env var was UNSET, `allowed.length === 0` fell through to "allow ALL origins" — the exact opposite of the intended default. The audit tested the happy path (env var set) but not the fallback (env var missing).

**Rule — Default-Value Security Audit (Phase 6 enhancement):**
For every security-sensitive config value:
1. What is the DEFAULT when the env var is unset?
2. Is the default SECURE or PERMISSIVE?
3. Security controls MUST fail-closed (deny by default), not fail-open (allow by default).
Check: CORS origins, JWT secrets, rate limit thresholds, SSL mode, cookie flags, CSRF enforcement.

### Pitfall 12: Error Propagation Path Incomplete (v4 addition)

**What happened:** The audit found the global error handler and confirmed it catches AppError, SyntaxError (400), and entity-too-large (413). But routes that catch errors internally and return `res.status(500).json(...)` BYPASS the global handler — meaning Sentry doesn't capture them, security event logging doesn't fire, and error format is inconsistent.

Also, services throwing `new Error()` instead of `new AppError()` cause the global handler to return 500 for what should be 400/404/409.

**Rule — Error Propagation Completeness (Phase 5 enhancement):**
1. `grep -rn "res.status(500)\|res.status(400)\|res.status(404)" server/src/routes/ --include="*.ts"` — Any route that manually sends error responses instead of calling `next(error)` or throwing AppError is bypassing centralized error handling. Flag it.
2. `grep -rn "throw new Error(" server/src/services/ --include="*.ts" | grep -v AppError | grep -v test` — Any service throwing bare `Error` instead of `AppError` causes incorrect HTTP status codes.
3. Check the global error handler for missing error types: Multer errors, Prisma known errors (P2002, P2025), JWT errors, validation errors.

### Pitfall 13: Frontend↔Backend Contract Precision (v4 addition)

**What happened:** The audit matched frontend API paths to backend routes but missed: (a) a frontend call to `GET /billing/compare/:tier` that had no backend route, (b) a frontend using `PATCH` where backend expected `PUT`, (c) a frontend calling `/demo/stats` where backend was `/demo/requests/stats`.

**Rule — Precise Contract Verification (Phase 4/7 enhancement):**
The scan-runner cross-references paths, but the audit MUST also verify:
1. **HTTP method match:** Frontend sends PATCH, backend has PUT → mismatch.
2. **Path parameter match:** Frontend calls `/billing/compare/${tier}`, backend has no `/compare/:tier` route.
3. **Response shape match:** Frontend expects `{ data: [...] }`, backend sends raw array.
Run: Extract ALL `fetchAPI<T>('/path')` and `api.*.method()` calls from the frontend API service and cross-reference against ALL registered backend routes — matching method, path, AND parameter shapes.

### Pitfall 14: Silent Catch Blocks Incomplete Scan (v4 addition)

**What happened:** The scan-runner finds `.catch(() => {})` patterns, but the audit only flagged SOME of them (NIS2, USPrivacy) and missed others (SBOMManager, ACOSDashboard). When the scan produces a list, EVERY item on the list must be classified.

**Rule:** Process the ENTIRE output of every scan category. If `/tmp/audit_E1.txt` has 15 matches, all 15 must appear in the report as classified findings. Missing even one is an audit completeness failure.

### Pitfall 15: User-Supplied Regex / Dynamic Code Execution (v4 addition)

**What happened:** The workflow engine accepted user-supplied regex patterns via `new RegExp(userInput)` without complexity limits. A malicious pattern can cause ReDoS (Regular Expression Denial of Service) and block the event loop.

**Rule — Dynamic Code Execution Audit (Phase 6 enhancement):**
Search for: `new RegExp(`, `eval(`, `Function(`, `vm.runIn`, `child_process.exec` with user-controllable inputs. Each is a potential injection or DoS vector. Verify input is sanitized, sandboxed, or uses a safe alternative (e.g., `re2` for regex).

### Pitfall 16: Deep Subdirectory Services Skipped (v5 addition)

**What happened:** `server/src/services/advanced/regulatoryIntelligenceFabricService.ts` (~2700 lines) contained 2 SSRF gaps and 1 multi-tenant write gap. The audit processed `server/src/services/` but the file was so large that agents only sampled it. Files in subdirectories (`advanced/`, `integrations/`, `workers/`) were statistically processed rather than exhaustively read.

**Rule — No File Size Exemptions:**
1. Every service file MUST be read in full, regardless of size. If a file exceeds 2000 lines, read it in chunks (offset+limit).
2. `server/src/services/advanced/` and similar subdirectories MUST be processed with the same rigor as top-level services.
3. For L7 (write operations) and F7 (outbound calls), the grep output already captures all matches including subdirectories. But the agent MUST read context for EVERY match — not "representatively sample" from large files.

### Pitfall 17: Fix Effectiveness Not Verified (v5 addition)

**What happened:** A previous audit flagged ReDoS in the workflow engine. A fix was applied adding `safeRegexTest()` with a 200-character length guard. The next audit found the fix was INSUFFICIENT — a 21-character pattern like `(a+)+$` causes catastrophic backtracking. Length guards do not prevent ReDoS.

**Rule — Fix Verification:**
When a finding from a previous audit is marked "FIXED," the current audit MUST verify the fix is EFFECTIVE, not just PRESENT:
1. Read the fix code
2. Ask: "Does this fix ACTUALLY prevent the attack?" (not just "Does code exist at this location?")
3. For ReDoS fixes: Length alone is insufficient. Check for `re2`, timeout wrappers, or complexity analysis.
4. For SSRF fixes: URL validation alone is insufficient if it doesn't check private IPs, localhost, metadata endpoints.
5. For multi-tenant fixes: A pre-check lookup is insufficient if the DELETE/UPDATE query itself doesn't include orgId (defense-in-depth).

### Pitfall 18: Database Migration Status Not Verified (v5 addition)

**What happened:** SCIM bearer token code was changed to hash tokens with SHA-256 before comparison. But a comment in the code said "Requires migration to store SHA-256 hashed tokens." If the migration hasn't been applied, ALL SCIM auth silently fails because `SHA256(plaintext) != plaintext`.

**Rule — Migration Verification:**
When code changes require a corresponding database migration:
1. Check if a migration file exists (e.g., in `server/prisma/migrations/`)
2. If the migration is referenced but doesn't exist → HIGH finding (code/DB mismatch)
3. If the migration exists, check its date — was it created AFTER the code change?
4. If code says "requires migration" in a comment → the migration hasn't been applied → flag as HIGH

### Pitfall 19: Runtime Compatibility Gaps (v5 addition)

**What happened:** `Dockerfile` set `NODE_OPTIONS="--force-fips"` but the base image was Alpine Linux, whose OpenSSL is NOT FIPS-certified. Node.js throws on startup. Static analysis sees "FIPS enabled" and marks it as compliant, but the container won't actually start.

**Rule — Runtime Compatibility Checks:**
For deployment-critical configurations, verify the RUNTIME can support them:
1. `--force-fips` → Verify OpenSSL in the base image supports FIPS mode
2. TLS certs → Verify cert paths exist in the container
3. Native modules → Verify they compile on the target architecture
4. If a Dockerfile exists, read it fully and cross-reference Node.js flags with the base image capabilities

### Pitfall 20: DEV_FALLBACK vs PARTIALLY_WIRED Reclassification (v5 addition)

**What happened:** 3 components (ESGReportingModule, EnvironmentalLifecycle, PostMarketSurveillance) were classified as DEV_FALLBACK because they had `useEffect` + API calls. But deeper analysis showed the API calls only fetched 2 of 5 state arrays — the other 3 DEMO_ arrays were never replaced. The `useEffect` exists but doesn't cover all the static data.

**Rule — Exhaustive State Array Verification:**
For every component classified as DEV_FALLBACK or WIRED_WITH_FALLBACK:
1. List ALL `const DEMO_*` / `const DEFAULT_*` arrays in the component
2. List ALL `useEffect` / `useQuery` calls and what state they update via `setXxx()`
3. If `useEffect` sets 2 of 5 state variables but 3 remain at their DEMO_ values forever → PARTIALLY_WIRED, not DEV_FALLBACK
4. The test is: "After the component mounts and all API calls complete, does ANY DEMO_/DEFAULT_ data remain visible to the user?" If yes → PARTIALLY_WIRED.

### Pitfall 21: Domain-Specific Config Defaults (v5 addition)

**What happened:** The v4 default-value security check covered CORS, JWT, rate limits, SSL, and cookies. But MQTT_BROKER_URL defaulted to `mqtt://localhost:1883` (plaintext, unauthenticated) — a domain-specific protocol not in the generic checklist.

**Rule — Exhaustive Config Default Audit:**
Check EVERY `process.env.XXX || 'default'` and `??` fallback in config files. Not just common web configs — also:
- Message brokers: MQTT, AMQP, Kafka URLs (protocol = plaintext?)
- Search engines: Elasticsearch, Meilisearch URLs
- Cache: Redis URLs (no auth?)
- External APIs: Any URL default that isn't localhost
- Encryption: Key lengths (minimum must match algorithm requirement, e.g., AES-256 → 32 bytes)
- CI/CD: Action version references (do they exist?)

### Pitfall 22: Service File Enumeration Incomplete (v6 addition)

**What happened:** The L7 scan found 140 write operations across 15 services. The audit read ~5 "main" services in depth but only spot-checked the other 10. Result: 12 multi-tenant gaps in 5 services (personnelService, issueManagementService, policyLibraryService, questionnaireService, trustCenterService) were missed.

**Rule — EVERY Service File Must Be Individually Read:**
1. `find server/src/services -name "*.ts" -not -name "*.test.*" -not -name "*.spec.*" | sort` — enumerate ALL service files
2. For EACH service file, read it in full (chunked if >500 lines)
3. For EACH write operation in the service, verify organizationId filtering
4. Do NOT stop after reading the "main" 5 services. Integration services (`services/integrations/`), advanced services (`services/advanced/`), and utility services ALL need the same treatment.

### Pitfall 23: Docker Ecosystem Incomplete (v6 addition)

**What happened:** The audit read the root `Dockerfile` but not: OPA Dockerfile (`server/docker/opa/Dockerfile`), docker-compose security files, or nginx configuration in production compose. Result: OPA runs as root, Grafana has default password, nginx:alpine is unpinned.

**Rule — ALL Dockerfiles and Compose Files:**
```bash
find . -name "Dockerfile*" -o -name "docker-compose*" | grep -v node_modules | sort
```
Read EVERY file. Check: non-root user, image pinning, default passwords, secrets management, health checks.

### Pitfall 24: Cross-File Version Consistency (v6 addition)

**What happened:** CI uses Node 20 but Dockerfile uses Node 22. Tests pass in CI against a different runtime than production. Also: no `engines` field in package.json to enforce the version.

**Rule — Version Consistency Checks:**
- CI Node version (`.github/workflows/*.yml`) MUST match Dockerfile Node version
- `package.json` SHOULD have an `engines` field
- Base image versions in Dockerfile SHOULD be pinned to patch level (not just `node:22-alpine`)

### Pitfall 25: Error Path Runtime Testing (v6 addition)

**What happened:** Red team tested auth rejection (401), SSRF payloads, SQL injection — all standard attack vectors. But the CORS middleware itself had a bug: when it throws an error, the response bypasses Helmet, leaking X-Powered-By and stack traces. This was only discoverable by triggering the error PATH of middleware.

**Rule — Error Path Testing:**
When the server is running, test not just normal requests and auth rejection, but also:
- What happens when CORS itself errors (invalid Origin header format)
- What happens when body parser errors (malformed content-type)
- What happens when rate limiter errors
- What happens when middleware throws (not just request handlers)
Each middleware error path must return secure responses (no stack traces, no server info).

### Pitfall 26: Package.json Production Readiness (v6 addition)

**What happened:** `@sentry/node` was in `devDependencies` instead of `dependencies`. In production (`npm install --production`), Sentry won't be installed — meaning zero error tracking. Also: no `engines` field means wrong Node version can be used silently.

**Rule — Package.json Audit:**
```bash
# Check for production-critical packages in devDependencies
grep -A1000 '"devDependencies"' package.json | grep -i "sentry\|datadog\|newrelic\|winston\|pino\|helmet\|cors\|express\|prisma"
```
Production-critical packages in devDeps = HIGH finding. Also check: `engines` field, `scripts.start`, `scripts.build`.

### Pitfall 27: Agent Fatigue — Sampling Despite Anti-Sampling Rules (v7 addition)

**What happened in v6:** The anti-sampling rule (Pitfall 6) existed since v3 and was explicitly stated in the prompt. Despite this, the v6 audit checked only 15 components in the Feature Completeness table. The codebase has 100+ components. The agent "got tired" and sampled.

**Why instructions alone don't work:** Rules in text form are suggestions that the agent can rationalize away under context pressure. The agent will think "I've checked the important ones" and stop. This happened in v3, v4, v5, AND v6 — adding more text about "check everything" did not change behavior.

**v7 Fix — Machine-Verifiable Completion Gates:**
The scan-runner now outputs hard counts. The report MUST include these exact numbers and the agent must demonstrate it processed them all:

1. **Component Gate**: Scan-runner outputs total component count to `/tmp/audit_component_count.txt`. Report MUST state: "Checked N of M components" where N == M. If N < M, the report is INCOMPLETE.
2. **F7 Gate**: Scan-runner outputs F7 match count. Report MUST classify every match (FALSE_POSITIVE, DEV_FALLBACK, or PRODUCTION_GAP) with evidence. "Review needed" is NOT a valid classification.
3. **Service File Gate**: Scan-runner outputs total service file count. Report MUST state: "Read N of M service files" where N == M.
4. **Report Section Gate**: The report MUST contain sections numbered exactly 3.5, 3.6, 3.7. A `grep -c "### 3.5\|### 3.6\|### 3.7"` on the report must return 3.

**Rule — If you cannot process all items due to context limits:**
- State explicitly: "INCOMPLETE — processed X of Y items. Remaining items need a follow-up scan."
- Do NOT silently truncate by presenting a sample as if it were the full set.
- Do NOT downgrade real findings to "Non-Blocking" to avoid listing them as gaps.

### Pitfall 28: Unprocessed Scan Output — "Review needed" Is Not a Classification (v7 addition)

**What happened:** F7 (SSRF) returned 97 matches. The report listed them as "Review needed" instead of classifying each one. This means the agent ran the scan but never actually did the analysis the scan was supposed to feed into.

**Rule:** Every scan output file MUST be fully processed. For each line in each `/tmp/audit_*.txt` file:
- Read the file referenced in the match
- Classify per classification-guide.md
- Record the classification with evidence
If a scan category has >50 matches, group by file and classify per-file (not per-line), but still read every unique file.

### Pitfall 29: Finding Rationalization — Downgrading Real Gaps (v7 addition)

**What happened:** `vendorRiskService.createVendorReview` has a real multi-tenant isolation gap (no org check on vendorId before creating a review). The v6 report moved this to "Non-Blocking, Low severity" with the rationale "read-only vendor lookup, not a write operation on foreign data." But it IS a write operation — `.create()` is always a write. The agent rationalized away a real finding.

**Rule:** A multi-tenant write operation without organizationId verification is ALWAYS at least HIGH severity. Do not downgrade based on speculative reasoning about "what the data represents." The severity is determined by the OPERATION TYPE (create/update/delete), not by the agent's guess about data sensitivity.

### Pitfall 30: L7 Volume Overwhelm — No Triage Algorithm (v9 addition)

**What happened:** L7 returned 682 write operations across 89 service files. The prompt said "check every one" but the agent sampled. The monitoringService.ts had 5 HIGH multi-tenant gaps hidden among 682 operations because the agent checked high-volume files first and stopped.

**Rule — L7 Triage by Inconsistency:**
1. Group L7 by file. For each file, count orgId-scoped writes vs unscoped writes.
2. **Priority 1:** Files where SOME writes have orgId but others don't (inconsistency = bug).
3. **Priority 2:** Files with ZERO orgId references (entire service unscoped).
4. **Priority 3:** Files where ALL writes have orgId (verify correctness).
The agent MUST process all Priority 1 and 2 files. Priority 3 can be sampled if context is limited.

### Pitfall 31: Silent Lint Pass — Missing Config (v9 addition)

**What happened:** The server had no `eslint.config.js`. ESLint 9 flat config silently ignores all files when config is absent, reporting "0 errors." The audit treated this as a pass.

**Rule:** Before running any linter, verify the config file EXISTS for each sub-project directory. A missing config is a MEDIUM finding, not a clean bill of health.

### Pitfall 32: Docker Compose Fail-Open Defaults (v9 addition)

**What happened:** `docker-compose.security.yml` used `${ELASTICSEARCH_PASSWORD:-changeme}` (fail-open). The audit also missed `REDIS_PASSWORD:-localredis123`, `JWT_SECRET:-dev-jwt-secret...`, `ENCRYPTION_KEY:-dev-32-char...` in the dev compose services. The prompt checked for "default passwords" but didn't distinguish Bash `:-` (fail-open) from `:?` (fail-closed) syntax.

**Rule:** Scan ALL compose files for `:-` on security-sensitive variables (password, secret, key, token, admin, credential). These MUST use `:?` (fail-closed). Empty defaults `:-` on optional API keys (Stripe, SendGrid) are acceptable.

### Pitfall 33: CI Pipeline :latest Not Scanned (v9 addition)

**What happened:** R3 caught `:latest` in Dockerfiles and compose files but missed it in `.github/workflows/ci.yml` where `:latest` was being pushed to production ECR.

**Rule:** R3 MUST also scan CI workflow files (`*.yml` in `.github/workflows/`). Any `:latest` in `docker push`, `docker tag`, or registry operations = MEDIUM finding.

### Pitfall 34: Security Wrapper Bypass — Partial Call-Site Coverage (v9 addition)

**What happened:** `safeRegexTest()` existed at workflowEngine.ts:43 and was used at line 205, but line 743 bypassed it with raw `new RegExp(trigger.conditionValue)`. The prompt found the safe function and stopped checking for bypasses.

**Rule — Security Function Completeness:** When a safe wrapper is found, grep for ALL instances of the unsafe pattern it replaces. Every instance not routed through the wrapper = PRODUCTION_GAP. Existence of a safe function is not evidence all call sites use it.

### Pitfall 35: In-Memory State Not Impact-Classified (v9 addition)

**What happened:** O3 returned 103 in-memory state matches. The agent couldn't distinguish security sessions (CRITICAL if lost) from WebRTC connections (ephemeral by nature). All 103 were treated equally.

**Rule:** Classify O3 matches by impact: CRITICAL (security sessions, job queues), HIGH (user data caches), MEDIUM (ML weights, computed caches), LOW (connections, rate counters). Only CRITICAL/HIGH are findings.

### Pitfall 36: Startup Env Validation Not Deep-Checked (v9 addition)

**What happened:** P9 returned 1 match for env validation. The audit noted "WARN — minimal" but didn't verify which critical vars were actually validated. All 4 critical vars (DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, ENCRYPTION_KEY) were validated, but without checking, the audit couldn't confirm this.

**Rule:** If P9 < 5, explicitly verify validation exists for DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, ENCRYPTION_KEY. Each must throw/exit at startup when missing.

### Pitfall 37: Cross-Compose Variable Inconsistency (v9 addition)

**What happened:** `REDIS_PASSWORD` used `:-localredis123` (fail-open) in one compose service but `:?` (fail-closed) in another. The audit checked each compose file independently, missing the inconsistency.

**Rule:** For each security-sensitive env var, check ALL compose files. If the same var uses both `:-` and `:?` across files, flag the inconsistency. Dev-profile defaults with weak credentials should be explicitly documented.

### Pitfall 38: Scan-Runner Shell Crash — Glob Expansion Under set -e (v10 addition)

**What happened:** The v9 scan-runner crashed at T3 (lint config check) because `ls "$dir"/eslint.config.* "$dir"/.eslintrc*` fails when no glob matches exist. Under `set -euo pipefail`, this non-zero exit kills the entire script. T3-T8 all failed to run, and the scan-runner exited with code 1.

**Rule — Shell Compatibility:** Never use `ls GLOB` to check file existence in scan-runner scripts. Use `find DIR -maxdepth 1 -name "PATTERN"` instead. All new scan steps must be tested under `set -euo pipefail` with no matching files to verify they don't crash.

### Pitfall 39: CI Quality Gate Bypass in Secondary Workflows (v10 addition)

**What happened:** The v9 prompt's T2 and T9 scans checked `.github/workflows/ci.yml` for `:latest` tags and `continue-on-error`. But the codebase had separate `mobile.yml` and `dependency-scan.yml` workflows containing 5 `continue-on-error: true` instances that were never scanned. Test failures in mobile CI and dependency scans were silently ignored.

**Rule — ALL CI Workflows:** `find .github/workflows/ -name "*.yml"` — scan ALL workflow files, not just the main one. Projects with mobile apps, scheduled scans, or environment-specific deploys have multiple workflows with independent quality gates.

### Pitfall 40: Peer Dependency Gaps Causing CI-Only Failures (v10 addition)

**What happened:** `graphology-types` was an unmet peer dependency of `graphology-layout-forceatlas2`. This caused 41 TypeScript errors in CI (where `npm ci` is strict) but not locally (where `npm install` is lenient). The audit ran `tsc --noEmit` locally and saw 0 errors, missing the CI failure entirely.

**Rule — Peer Dependency Check:** After Phase 1 tsc, run `npm ls --all 2>&1 | grep -i "UNMET PEER"` for each sub-project. Any unmet peer dep = MEDIUM finding. This catches the class of bug where code compiles locally but fails in CI.

### Pitfall 41: Credential Encryption-at-Rest Not Verified (v11 addition)

**What happened:** F8 found 288 credential patterns. The audit confirmed passwords use PBKDF2, SCIM tokens use SHA-256, webhook secrets use HMAC. But OAuth integration tokens (GitHub, Slack, Jira access_tokens) are stored in plaintext in the `integration` table. The app has `ENCRYPTION_KEY` and `byokService` but integration tokens bypass encryption entirely. Claude Code missed this; Claude Desktop found it.

**Rule:** For EVERY credential type stored in DB, verify encryption is applied before the `.create()`/`.update()` call. "Credential patterns exist" ≠ "credentials are encrypted." Trace the data path from receipt to storage.

### Pitfall 42: SSRF Function Parameters vs Default URLs (v11 addition)

**What happened:** F7 classified `patValidationService.ts` as FALSE_POSITIVE because the file uses hardcoded provider URLs (github.com, stripe.com). But the `validateToken()` function accepts an optional `baseUrl?: string` parameter that overrides the default URL. An attacker calling the API with `baseUrl: "http://169.254.169.254"` can hit the cloud metadata endpoint. 11 provider methods accept this parameter.

**Rule:** F7 classification must check function PARAMETERS, not just default URLs. If a function has a `url`/`baseUrl`/`endpoint` parameter, trace whether the caller validates it with `isUrlSafe()`.

### Pitfall 43: Parent-Child Entity Multi-Tenant Chain (v11 addition)

**What happened:** L7 triage found monitoringService gaps (direct orgId missing). But soxService's `createSOXTestResult(controlId)` was marked safe because the function has `organizationId` as a parameter. However, `organizationId` is OPTIONAL and `controlId` is NOT verified to belong to the caller's org. The parent entity (SOXControl → Organization) chain is not checked.

**Rule:** For child entity writes, orgId on the child is insufficient — verify the PARENT entity's org. `create({ controlId })` without `where: { id: controlId, organizationId }` lookup first = HIGH gap.

### Pitfall 44: Infrastructure Config Files Not Scanned (v11 addition)

**What happened:** T1 scans `docker-compose*` files for `:-changeme`. But `logstash/pipeline/logstash.conf:52` has `password => "${ELASTICSEARCH_PASSWORD:-changeme}"` — same vulnerability, different file type. Non-compose infrastructure configs (logstash, nginx, prometheus) are invisible to T1.

**Rule:** Extend default-password scanning beyond compose files to ALL infrastructure config files: `find . -path "*/logstash/*" -o -path "*/nginx/*" -o -path "*/grafana/*" | xargs grep "changeme\|default.*password"`.

### Pitfall 45: L10 Scope Too Narrow — Controllers Not Scanned (v11 addition)

**What happened:** L10 found 29 manual error responses in `server/src/routes/`. But `server/src/controllers/` has 247 `res.status()` calls — 8x more. Controllers are where most request handling happens in this codebase. The entire controller layer was invisible to L10.

**Rule:** L10 MUST scan BOTH `routes/` AND `controllers/`. Any `res.status(N).json(...)` in a catch block without `logger.error()` = bypass of Sentry/global handler.

### Pitfall 46: Claiming Complete When Incomplete (v11 addition)

**What happened:** Claude Code's Section 3.8 claimed "L7 682 processed: N==M" and "F7 97 classified: N==M." Cursor's Section 3.8 honestly stated "L7: INCOMPLETE" and "F7: INCOMPLETE." Cursor scored itself lower (80.35%) because of this honesty. Claude Code scored higher (90.9%) partly by not acknowledging gaps.

**Rule:** If parallel agents process L7/F7, the main agent must verify the agent actually read every match — not just trust the agent's claim. If verification is impossible, mark as INCOMPLETE. A lower honest score is better than a higher dishonest one.

### Pitfall 47: Cross-Tool Disagreement as Bug Signal (v12 addition)

**What happened:** Claude Code reported "0 console.log in server production code." Claude Desktop found 10 instances with file:line evidence. Claude Code scored 97.95% by missing findings other tools caught.

**Rule — Cross-Audit Reconciliation:**
When multiple audit reports exist for the same codebase, build the UNION of all findings. Any finding flagged by ANY tool is a candidate until verified against current code. The report with MORE specific evidence (file:line) is more likely correct than the one claiming zero issues. Include a reconciliation table in Section 0.

### Pitfall 48: Node Version CI↔Docker Inconsistency (v12 addition)

**What happened:** CI workflows tested on Node 22, but the production Dockerfile built on Node 25. Code was tested on a different major runtime version than production. Node 25 may introduce behavioral differences not caught by CI. The v6 rule "Cross-File Version Consistency" existed but no T-scan grep enforced it.

**Rule — T16 Mandatory Scan:**
Run T16 after the scan-runner. Compare `node-version` in CI workflows vs `FROM node:XX` in Dockerfiles vs `engines` in package.json. Major version mismatch = HIGH finding.

### Pitfall 49: "Already Audited" Service False Confidence (v12 addition)

**What happened:** vendorRiskService was declared "safe" in a previous audit based on READ functions (`getVendorById` had org filtering). But `createVendorReview` — a WRITE function in the same file — had no org check. The previous audit's "safe" classification caused the current audit to skip the file.

**Rule:** Previous audit safe-status does NOT exempt a service from current L7 triage. The L7 triage algorithm (v9) must be applied fresh every audit. Priority 1 files (mixed org checks) are the highest signal, regardless of previous classifications.

### Pitfall 50: Auth-Critical Endpoints Lack Validation (v12 addition)

**What happened:** Input validation coverage was measured at 93% (63/68 route files). But `forgot-password` and `reset-password` in auth.ts had no `validateBody()`. These auth-critical endpoints were hidden in the 7% gap, treated as equivalent to low-risk admin routes.

**Rule — T19 Auth Endpoint Validation:**
These specific endpoints MUST be individually verified: `login`, `register`, `forgot-password`, `reset-password`, `change-password`. Missing validation on auth endpoints = MEDIUM, regardless of overall coverage percentage.

### Pitfall 51: Dev Compose Literal Security Values (v12 addition)

**What happened:** T1 scans for `:-` fail-open syntax in compose files. But `docker-compose.yml` had `JWT_SECRET=dev-jwt-secret-minimum-32-characters-long` and `ENCRYPTION_KEY=dev-encryption-key-32chars!!` as literal environment values (not `${VAR:-default}` syntax). T1 missed them because they don't use `:-`.

**Rule — T18 Literal Value Scan:**
Scan compose files for literal `=` assignments of security keys that don't use `${...}` variable substitution. Literal hardcoded secrets in dev compose = LOW if dev-only profile, MEDIUM if no profile separation.

### Pitfall 52: tsc OOM in CI (v12 addition)

**What happened:** `tsc --noEmit` required `NODE_OPTIONS=--max-old-space-size=8192` to complete without OOM on the 1M+ LOC codebase. CI workflows didn't set this. The audit ran tsc locally with sufficient memory and reported "0 errors" without noting the memory requirement.

**Rule — T21 Memory Requirements:**
If the build process requires NODE_OPTIONS or memory flags, verify CI workflows also set them. Document the requirement in the report. Missing NODE_OPTIONS in CI when locally required = MEDIUM.

### Pitfall 53: Console.log Server-Only Audit Gap (v12 addition)

**What happened:** G1 scans all source files for `console.*` and returned ~30 matches. The audit classified all 30 as "scripts/tests" (FALSE_POSITIVE). But 10 of those were actually in `server/src/` production code — they were misclassified because G1 mixes server, frontend, scripts, and CLI output together.

**Rule — T17 Server-Only Scan:**
Run a separate `grep` specifically on `server/src/` (excluding test/scripts/CLI) for `console.*`. This produces a focused list that can't be accidentally dismissed as "scripts/tests." Each hit must be individually classified.

### Pitfall 54: Fixable Vulnerabilities Not Acted On (v12 addition)

**What happened:** `npm audit` reported `brace-expansion` (moderate) as fixable via `npm audit fix`. The audit reported the vulnerability but didn't run the fix. The next audit found the same vulnerability still present.

**Rule — T20 Fixable Vuln Action:**
For each fixable vulnerability: run `npm audit fix` or document why it can't be fixed (e.g., breaking change, peer dep conflict). Reporting without acting is an audit gap. The report must state the action taken.

### Pitfall 55: SSO/SCIM Error Responses Need Security Logging (v12 addition)

**What happened:** L10 found 29 manual error responses in routes. But SSO routes had 14 inline `res.status()` responses, and SCIM had ~5 more. These are security-sensitive auth flows where error responses bypass Sentry, meaning failed auth attempts, SAML validation errors, and SCIM token failures are invisible to security monitoring.

**Rule — T22 SSO/SCIM Error Audit:**
SSO and SCIM routes must be audited separately from generic L10. Every catch block must include `logger.error()` with security context (IP, session, provider). Inline error responses in auth flows bypassing Sentry = HIGH.

### Pitfall 56: ReDoS Wrapper Effectiveness Not Verified (v12 addition)

**What happened:** T4 verified that `safeRegexTest()` was used at all `new RegExp()` call sites. But `safeRegexTest` only had a 200-character length guard — no `re2`, no timeout. A 21-character pattern `(a+)+$` causes catastrophic backtracking despite passing the length check. T4 was satisfied (all call sites use the wrapper), but the wrapper itself is broken.

**Rule — T25 Wrapper Implementation Check:**
When T4 confirms all call sites use the safe wrapper, T25 must verify the wrapper IMPLEMENTATION is effective. Length-only guards are INSUFFICIENT (Pitfall 17). The wrapper must use `re2`, a timeout, or complexity analysis. If the wrapper is insufficient, ALL call sites using it are STILL VULNERABLE = MEDIUM.

## Audit Domains & Phases

| Domain | Phases | What It Covers |
|--------|--------|---------------|
| **Foundation** | 0-2 | Stack detection, build verification, exhaustive pattern scan with AST semantic resolution |
| **Feature Completeness** | 3-4 | Dependency chain tracing, full-stack feature verification, data flow, property-based testing |
| **Application Logic** | 5 | Business rules, validation, state management, error propagation |
| **Security & Red Teaming** | 6-7 | Auth flows, OWASP checks, secrets, API security, data protection, autonomous fuzzing |
| **Infrastructure & Chaos** | 8 | Deployment hardening, monitoring, scaling, CI/CD, disaster recovery, **runtime connectivity tests**, chaos protocols |
| **Visual Verification** | 9 | VLM-driven UI state verification via Playwright screenshots |
| **Reporting & Auto-Healing** | 10 | Comprehensive report with actionable fix instructions AND executable patches |

---

## PHASE 0: STACK DETECTION & CONTEXT MAPPING

Before scanning anything, understand what you're auditing.

#### 0A: Map the Source Tree (NO truncation)
```bash
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.py" -o -name "*.go" -o -name "*.rs" -o -name "*.java" -o -name "*.rb" -o -name "*.php" -o -name "*.vue" -o -name "*.svelte" \) \
  | grep -v node_modules | grep -v dist | grep -v build | grep -v __pycache__ | grep -v .venv | grep -v target \
  | grep -v ".test." | grep -v ".spec." | grep -v "__tests__" | grep -v ".DS_Store" \
  | sort > /tmp/audit_all_source.txt
wc -l /tmp/audit_all_source.txt
cat /tmp/audit_all_source.txt
```

#### 0B: Detect Stack & Build Profile
```bash
# Dependency files
find . -maxdepth 3 \( -name "package.json" -o -name "requirements.txt" -o -name "Pipfile" -o -name "pyproject.toml" -o -name "go.mod" -o -name "Cargo.toml" -o -name "Gemfile" -o -name "composer.json" \) | grep -v node_modules

# Framework detection
for pkg in $(find . -name "package.json" -not -path "*/node_modules/*" -maxdepth 3); do
  echo "=== $pkg ===" && cat "$pkg" | grep -E '"(react|next|vue|svelte|angular|express|fastify|nest|hono|koa|prisma|drizzle|supabase|firebase|django|flask|fastapi|rails)"' 2>/dev/null
done

# Database, deployment, env, CI/CD
find . -name "*.prisma" -o -name "schema.prisma" -o -name "drizzle.config.*" -o -name "knexfile.*" -o -name "*.sql" -o -name "alembic.ini" | grep -v node_modules | sort
find . \( -name "Dockerfile*" -o -name "docker-compose*" -o -name "fly.toml" -o -name "vercel.json" -o -name "netlify.toml" -o -name "render.yaml" \) | grep -v node_modules | sort
find . -name ".env*" | grep -v node_modules | sort
find . -path "*/.github/workflows/*" -o -path "*/.gitlab-ci*" -o -name "Jenkinsfile" 2>/dev/null
```

Build a **Stack Profile** — document every detected layer:
- **Frontend**: framework, router, state management, CSS/UI library
- **Backend**: framework, ORM, API style (REST/GraphQL/tRPC)
- **Database**: type, ORM, migration tool
- **Auth**: provider (Supabase Auth, Clerk, NextAuth, custom JWT, etc.)
- **AI/ML**: providers and SDKs
- **Storage**: file storage provider
- **Realtime**: WebSocket, SSE, Supabase Realtime
- **Deployment**: target platform, containerization, CI/CD
- **Monitoring**: APM, error tracking, logging framework
- **Layers present**: [UI, API, DB, Auth, AI, Storage, Realtime, Monitoring, etc.]

Adapt ALL subsequent phases to detected stack. Skip irrelevant checks.

#### 0C: AST Semantic Graph Construction (Visionary)

After mapping the source tree, construct an AST-based semantic graph of the codebase. This goes beyond file-level `grep` to understand actual code structure:

```bash
# For TypeScript/JavaScript projects, use ts-morph or @typescript-eslint/parser
# For Python projects, use ast module
# Generate: function call graph, import dependency graph, class hierarchy map
# Output to /tmp/audit_ast_graph.json
```

The AST graph enables:
- **Dynamic import tracing**: Find lazy-loaded modules, conditional requires, and factory patterns that grep misses.
- **Scope-aware stub detection**: Identify functions that return hardcoded values even without "mock" or "stub" keywords by analyzing return statement complexity.
- **Dead code identification**: Functions/classes defined but never called from any entry point.
- **Complexity hotspots**: Cyclomatic complexity per function to prioritize review effort.

---

## PHASE 0.1: DELTA ANALYSIS (Baseline Comparison)

The scan-runner.sh v2 saves baselines to `.claude/audit-baseline/` and computes deltas automatically.

**If `.claude/audit-baseline/` exists from a previous scan:**

1. **Read `/tmp/audit_metrics.json`** — contains `delta.new_findings`, `delta.resolved_findings`, `delta.persisted_findings`
2. **Report the delta** in the final report's Section 0 (Delta Summary)
3. **Load verified-fixed items** from `.claude/audit-exclusions.json` `verified_fixes` array. Do NOT re-flag unless the file changed since verification.
4. **Scoring constraint**: Score MUST improve if more findings resolved than introduced. If score decreases despite net improvement, there is a classification error — recheck all changed items.

**If no baseline exists** (first scan), skip and note "First scan — no baseline" in the report.

**Phase 0.1.1: Fix Effectiveness Verification (v5 — Pitfall 17)**
For every finding marked "FIXED" from a previous audit:
1. Read the fix code
2. Ask: "Does this fix ACTUALLY prevent the attack, or is it just a partial mitigation?"
3. Examples of insufficient fixes:
   - ReDoS: Length guard (200 chars) does NOT prevent catastrophic backtracking — need `re2` or timeout
   - SSRF: URL format validation does NOT prevent `http://169.254.169.254` — need private IP blocking
   - Multi-tenant: Pre-check lookup is NOT defense-in-depth if the DELETE query itself is unguarded
4. If a fix is present but insufficient → classify as NEW finding with note "Fix present but ineffective"

**Phase 0.1.2: Migration Status Verification (v5 — Pitfall 18)**
For every code change that references a required database migration:
```bash
# Find "requires migration" comments
grep -rn "requires migration\|needs migration\|migration required\|run migration" server/src/ --include="*.ts" | grep -v node_modules | grep -v test
```
If code logic depends on a migration that may not have been applied → HIGH finding.

---

## PHASE 0.5: BOOT & VALIDATE (Runtime Prerequisite)

Before any runtime testing can occur, verify that the application actually starts and connects to its dependencies. Static analysis alone missed a CRITICAL SSL/TLS bug — `pg.Pool` ignoring `sslmode=require` — that was invisible to grep but crashed every DB call at runtime.

#### 0.5A: Backend Liveness
```bash
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/)
echo "Backend HTTP status: $HTTP_CODE"
if [ "$HTTP_CODE" = "000" ]; then echo "❌ BOOT FAIL: Backend not reachable on :3001"; fi
```
If the backend returns `000` (connection refused), the server is not running. All runtime phases must be marked **SKIPPED**.

#### 0.5B: Health Deep Check
```bash
HEALTH=$(curl -s http://localhost:3001/health)
echo "$HEALTH" | node -e "
  const fs = require('fs');
  const data = JSON.parse(fs.readFileSync('/dev/stdin','utf8'));
  const subsystems = ['database','websocket','memory','jobQueue','cache','region'];
  let allOk = true;
  for (const s of subsystems) {
    const status = data[s]?.status || data[s] || 'MISSING';
    const ok = ['ok','healthy','connected','active'].includes(String(status).toLowerCase());
    console.log(ok ? '✅' : '❌', s + ':', status);
    if (!ok) allOk = false;
  }
  if (!allOk) { console.error('⚠️  One or more subsystems unhealthy'); process.exit(1); }
"
```
Parse the `/health` JSON and validate all 6 subsystems. Any subsystem reporting unhealthy is a **HIGH** finding.

#### 0.5C: Frontend Liveness
```bash
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/)
echo "Frontend HTTP status: $HTTP_CODE"
if [ "$HTTP_CODE" = "000" ]; then echo "❌ Frontend not reachable on :3000"; fi
```

#### 0.5D: OpenAPI Spec Availability
```bash
curl -s http://localhost:3001/api/docs.json -o /tmp/audit_openapi.json 2>/dev/null
if [ -s /tmp/audit_openapi.json ]; then
  echo "✅ OpenAPI spec saved — $(node -e "const d=require('/tmp/audit_openapi.json'); console.log(Object.keys(d.paths||{}).length)" 2>/dev/null) routes"
else
  echo "⚠️  No OpenAPI spec at /api/docs.json — route discovery will use static analysis only"
fi
```

#### 0.5E: CSRF Token Acquisition
```bash
# Save cookies + CSRF token for mutation tests in later phases
curl -s -c /tmp/audit_cookies.txt http://localhost:3001/ > /dev/null
CSRF=$(curl -s -b /tmp/audit_cookies.txt http://localhost:3001/csrf-token 2>/dev/null | node -e "try{const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));console.log(d.csrfToken||d.token||'NONE')}catch{console.log('NONE')}" 2>/dev/null)
echo "CSRF token: ${CSRF:-NONE}"
if [ "$CSRF" = "NONE" ]; then echo "⚠️  No CSRF endpoint — POST tests in dev mode will skip CSRF header (MEDIUM finding)"; fi
```

#### 0.5F: Direct Database Query
```bash
cd server && node -e "
  require('dotenv').config();
  const { Pool } = require('pg');
  const url = process.env.DATABASE_URL || '';
  const ssl = url.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined;
  const pool = new Pool({ connectionString: url, ssl });
  pool.query('SELECT current_database(), version()')
    .then(r => { console.log('✅ DB:', r.rows[0].current_database, '— PG', r.rows[0].version.split(' ')[1]); pool.end(); })
    .catch(e => { console.error('❌ DB FAIL:', e.message); process.exit(1); });
"
```
This catches the class of bug where `pg.Pool` silently ignores `sslmode=require` from the connection string.

#### Boot Gate Rule
| Check | Fail Action |
|-------|-------------|
| Backend liveness (0.5A) | Mark ALL runtime phases (4F, 5D.1, 6I, 7B.1, 8K.1-8K.3, 9A-9D) as **SKIPPED** |
| Database query (0.5F) | Mark ALL runtime phases as **SKIPPED** |
| Health deep check (0.5B) | Mark failing subsystem's runtime tests as **SKIPPED** |
| Frontend liveness (0.5C) | Mark frontend runtime tests (9A-9D) as **SKIPPED** |
| OpenAPI spec (0.5D) | Fall back to static route discovery only |
| CSRF token (0.5E) | Skip CSRF validation in mutation tests, document as **MEDIUM** |

**SKIPPED means explicitly reported in the final audit as "SKIPPED — server not running", not silently omitted.**

---

## PHASE 1: BUILD & COMPILATION VERIFICATION

Run every build/compile/lint command for the detected stack. Capture FULL output — no truncation.

For TypeScript: `npx tsc --noEmit` for every tsconfig found. For Python: `mypy`/`pyright`. For Go: `go vet`. For Rust: `cargo check`. Run linters (`eslint`, `ruff`, `golangci-lint`, `clippy`). Run `npm audit` / `pip-audit` / equivalent.

**Report every single error. No truncation. No "and N more."**

---

## PHASE 2: EXHAUSTIVE PATTERN SCAN (with AST Semantic Resolution)

→ Read **`references/scan-patterns.md`** for the complete pattern library (11 categories, 40+ patterns).

For EVERY pattern result:
1. Save ALL results to temp files (no truncation)
2. Read 15+ lines of surrounding code for each match
3. Classify as: `INTENTIONAL_FEATURE` | `DEV_FALLBACK` | `PRODUCTION_GAP` | `FALSE_POSITIVE`

→ Read **`references/classification-guide.md`** for decision trees on classifying ambiguous matches.

### MANDATORY: Full-File Read Before Classification (v2 — Stops False Positives)

**NEVER classify a finding based solely on the grep output line.** For EVERY finding:

1. **Read the JSONL context first** — scan-runner.sh v2 provides 15 lines before/after in `/tmp/audit_*.jsonl`.
2. **If context is insufficient**, use the Read tool to read the FULL function containing the match.
3. **For Category A matches** (mock/hardcoded/fake): You MUST read at least 100 lines of the file to check for:
   - `useEffect` / `useQuery` / `useSWR` / `useMutation` that fetches real data
   - API imports (`import { api }` or `from 'services/api'`)
   - Custom hooks: `useExecutiveDashboard()`, `useRisks()`, etc.
   - Namespaced API calls: `api.sox.*`, `api.regulationData.*`, `api.enterprise.*`
   - If ANY of these exist alongside static data → `DEV_FALLBACK` or `FALSE_POSITIVE`, NOT `PRODUCTION_GAP`
4. **For Category G matches**: Check if it's `logger.*` (structured) vs raw `console.*`. Logger → `FALSE_POSITIVE`.
5. **Record evidence**: Cite SPECIFIC lines proving classification. Not "file contains mock data" but "line 71 defines static array, BUT lines 85-92 contain useEffect that calls api.executive.getDashboard() → DEV_FALLBACK."

**A classification without file-read evidence is PROHIBITED.**

#### Visionary Enhancement: AST-Resolved Pattern Matching

After the initial grep-based scan, pass all matches through the AST semantic graph to:
- **Eliminate false positives**: A variable named `mockData` that's actually a production dataset gets correctly identified via its usage context.
- **Find hidden stubs**: Functions that return `[]`, `{}`, `null`, or hardcoded arrays without any keyword markers — identified by analyzing return statement patterns against the AST.
- **Trace dynamic patterns**: `require(variable)`, `import()` expressions, and factory-constructed service instances that keyword grep cannot follow.

---

## PHASE 3: DEPENDENCY CHAIN TRACING

For every `PRODUCTION_GAP` from Phase 2, trace the full import chain upward to routes/pages:

```bash
grep -rn "from.*['\"].*AFFECTED_MODULE" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | grep -v node_modules
```

Record impact chains — who imports the broken file, who imports THOSE files, all the way up:
```
GAP: server/services/billing.ts:45 — calculateInvoice() returns mock data
├── server/controllers/billing.controller.ts:23 — passes result to response
├── server/routes/billing.routes.ts:12 — exposes POST /api/billing/invoice
└── frontend/pages/Billing.tsx:67 — displays invoice data
FULL STACK AFFECTED: UI → API → Service → (DB missing)
```

---

## PHASE 4: FULL-STACK FEATURE VERIFICATION

→ Read **`references/feature-completeness.md`** for the detailed methodology.

**4A: Discover all routes/features** — frontend routes, backend API endpoints, sidebar/menu items, navigation entries.

**4B: Trace each feature through all layers:**

| Layer | Verification |
|-------|-------------|
| **UI/Page** | Renders real data, handles loading/error/empty states, form validation complete |
| **API Endpoint** | Exists, validates input, returns proper status codes, has error responses |
| **Service/Logic** | Real implementation (not stub), handles edge cases, proper error propagation |
| **Database** | Table exists, schema matches code, migrations current, queries correct |
| **Auth/Permissions** | Protected if needed, role checks present, RLS policies if applicable |

**CRITICAL: 4B must be EXECUTABLE, not just descriptive.** For each feature, run the verification commands below. Do NOT rely on assumptions — if a command returns zero results, that is evidence. If you cannot find a pattern, that means it does not exist. Never infer a bug from absence of code.

**4B.1: UI→API connection verification** — For every major component, verify it actually calls the backend:
```bash
# List all components that contain fetch() or API calls
grep -rln "fetch('/api/\|fetch(\"/api/\|fetch(\`/api/\|api\.\(get\|post\|put\|delete\|patch\)" components/ --include="*.ts" --include="*.tsx" | grep -v __tests__ | sort > /tmp/audit_components_with_api.txt

# List all components WITHOUT any API calls (potential hardcoded-only features)
comm -23 <(find components/ -name "*.tsx" | grep -v __tests__ | grep -v node_modules | sort) /tmp/audit_components_with_api.txt > /tmp/audit_components_no_api.txt

echo "Components with API calls: $(wc -l < /tmp/audit_components_with_api.txt)"
echo "Components WITHOUT API calls: $(wc -l < /tmp/audit_components_no_api.txt)"
echo "--- Components without API calls (potential hardcoded data): ---"
cat /tmp/audit_components_no_api.txt
```

**4B.2: Auth pattern verification per component** — For each component that calls the API, verify auth is handled:
```bash
# For every file with a raw fetch() to /api/, check credentials: 'include' is present
grep -rn "fetch('/api/\|fetch(\"/api/\|fetch(\`/api/" components/ --include="*.tsx" --include="*.ts" | grep -v __tests__ | while IFS=: read -r FILE LINE_NUM REST; do
  # Check if credentials: 'include' appears within 5 lines
  HAS_CREDS=$(sed -n "$((LINE_NUM)),$((LINE_NUM+5))p" "$FILE" | grep -c "credentials.*include")
  # Check if file imports a centralized API service
  HAS_API_IMPORT=$(head -30 "$FILE" | grep -c "import.*from.*services/api\|import.*from.*api")
  if [ "$HAS_CREDS" -eq 0 ] && [ "$HAS_API_IMPORT" -eq 0 ]; then
    echo "⚠️ MISSING AUTH: $FILE:$LINE_NUM — raw fetch without credentials or API service"
  fi
done
```

**4B.3: Backend endpoint↔frontend call cross-reference** — Ensure frontend calls endpoints that actually exist:
```bash
# Extract all API paths called from frontend components
grep -roh "fetch(['\"\`]/api/[^'\"\`]*" components/ --include="*.tsx" --include="*.ts" | sed "s/fetch(['\"\`]//" | sort -u > /tmp/audit_frontend_api_calls.txt

# Extract all registered backend routes
grep -rn "router\.\(get\|post\|put\|patch\|delete\)(" server/src/routes/ --include="*.ts" | grep -v __tests__ | sed "s/.*router\.\(get\|post\|put\|patch\|delete\)(['\"\`]\([^'\"\`]*\).*/\2/" | sort -u > /tmp/audit_backend_routes.txt

echo "--- Frontend API calls ---"
cat /tmp/audit_frontend_api_calls.txt
echo ""
echo "--- Backend routes ---"
cat /tmp/audit_backend_routes.txt
```

**4B.4: Hardcoded data detection** — Find components that define large inline data arrays (sign of missing API integration):
```bash
# Find const arrays with 3+ objects (likely hardcoded demo/mock data used in production)
grep -rn "^const [A-Z_]*:.*\[\]* = \[" components/ --include="*.tsx" --include="*.ts" | grep -v __tests__ | grep -v "node_modules"
# For each match, check if a useState initializes from it AND a useEffect fetches replacement data
```

**4B.5: EXHAUSTIVE Component Wiring Audit (v3 — MANDATORY, NOT sampling)**

Do NOT check only "top N features." You MUST check EVERY component. Use the scan-runner's Component Wiring Audit output:
- `/tmp/audit_static_components.txt` — Components with ZERO API calls. Read each fully and classify.
- `/tmp/audit_partially_wired.txt` — Components with API calls AND DEFAULT_/DEMO_ arrays. Document what's wired vs static.
- For each STATIC_ONLY component, check if a matching backend route exists in `server/src/routes/`.
- For each PARTIALLY_WIRED component, determine if API data REPLACES the defaults (DEV_FALLBACK) or COEXISTS (PARTIALLY_WIRED).
- See `references/feature-completeness.md` Step 7.5 for the detailed protocol and output table templates.

**4B.6: Document PARTIALLY_WIRED components** — For each, list:
- What API endpoints ARE called
- Which DEFAULT_*/DEMO_* arrays persist as static data
- Whether the static data is user-visible (affects compliance accuracy) or cosmetic

**4C: Data flow integrity** — For each feature, trace data from UI form → API request → service → DB write → DB read → API response → UI render. Verify field names, types, and transformations are consistent across all layers.

**4D: API contract validation** — Do frontend API calls match what backend actually accepts/returns? Check request bodies, query params, response shapes, error formats.

**4E: Navigation & routing completeness** — Every menu item links to a real page. Every page is reachable. No dead routes. Auth redirects work.

**4F: Runtime Route Discovery & Probing** *(requires Boot Gate pass)*

Complement static route analysis with live probing to catch routes that exist in code but crash at runtime.

```bash
# 4F.1: Fetch all routes from OpenAPI spec (if available)
if [ -s /tmp/audit_openapi.json ]; then
  node -e "
    const spec = require('/tmp/audit_openapi.json');
    const routes = [];
    for (const [path, methods] of Object.entries(spec.paths || {})) {
      for (const method of Object.keys(methods)) {
        routes.push(method.toUpperCase() + ' ' + path);
      }
    }
    routes.forEach(r => console.log(r));
  " > /tmp/audit_api_routes.txt
  echo "Found $(wc -l < /tmp/audit_api_routes.txt) API routes from OpenAPI spec"
fi

# 4F.2: Probe all GET endpoints — flag any that return 500
grep "^GET" /tmp/audit_api_routes.txt 2>/dev/null | while read -r method path; do
  CODE=$(curl -s -o /tmp/audit_probe_body.txt -w "%{http_code}" "http://localhost:3001${path}" -b /tmp/audit_cookies.txt)
  if [ "$CODE" = "500" ]; then
    echo "❌ 500 on GET ${path}"
    head -5 /tmp/audit_probe_body.txt
  elif [ "$CODE" = "000" ]; then
    echo "❌ Connection refused: GET ${path}"
  else
    echo "✅ ${CODE} GET ${path}"
  fi
done

# 4F.3: Probe frontend routes
for route in "/" "/login" "/dashboard" "/settings" "/vendors" "/reports"; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000${route}")
  if [ "$CODE" = "000" ]; then
    echo "❌ Frontend unreachable: ${route}"
  elif [ "$CODE" -ge 500 ]; then
    echo "❌ ${CODE} on frontend ${route}"
  else
    echo "✅ ${CODE} frontend ${route}"
  fi
done
```

Any GET endpoint returning 500 is a **HIGH** finding (server error on a read-only request). Document the response body for debugging.

#### Visionary Enhancement: Property-Based Test Synthesis

For critical business rules discovered in 4B-4C, synthesize property-based tests:
- Generate test cases using fast-check (JS) or Hypothesis (Python) that exercise boundary conditions, type coercion edge cases, and invariant violations.
- These tests become part of the audit deliverable — the user gets a test suite, not just a report.

---

## PHASE 5: APPLICATION LOGIC VERIFICATION

→ Read **`references/application-logic.md`** for the complete checklist.

**5A: Business Rule Verification**
- Identify core business rules (pricing, permissions, workflows, calculations)
- Verify each is implemented, not stubbed
- Check edge cases: zero values, negative numbers, empty strings, null inputs, boundaries
- Verify calculations match requirements (rounding, precision, currency)

**5A.1: Algorithm Correctness Verification (v4 — Pitfall 10 fix)**
For every computation/aggregation endpoint, trace the algorithm:
```bash
# Find all averaging, summing, counting logic
grep -rn "/ count\|/ total\|\.length\|\.reduce\|average\|Math\.round\|toFixed" server/src/ --include="*.ts" | grep -v node_modules | grep -v test
```
- Verify denominators match numerators (per-group counts, not global counts)
- Verify division-by-zero guards exist
- Verify floating-point currency uses integer cents, not dollars

**5A.2: Action Implementation Verification (v4 — Pitfall 10 fix)**
For every handler/action that claims to perform an operation:
```bash
# Find all action handlers, workflow steps, command handlers
grep -rn "case '\|action.*==\|actionType\|handler\[" server/src/ --include="*.ts" | grep -v node_modules | grep -v test
```
- For EACH action: Does the code body contain an actual DB write (`prisma.*.create/update/delete`), API call, or side effect?
- A handler that returns `{ status: 'success' }` without performing the claimed operation = PRODUCTION_GAP (no-op handler)
- A handler that logs "completed" but writes nothing = PRODUCTION_GAP

**5B: State Management Audit**
- Frontend: All stateful interactions managed (loading, error, success, empty, stale)
- Backend: Server state consistent (session management, cache invalidation, race conditions)
- Stale data: Does UI re-fetch after mutations? Are optimistic updates rolled back on failure?

**5C: Data Validation Pipeline**
- Frontend: Forms validated before submission, errors displayed to users
- API: Every endpoint validates input schema (zod, joi, pydantic, etc.)
- DB: NOT NULL, UNIQUE, CHECK, FOREIGN KEY constraints enforced
- Cross-layer consistency: Frontend rules match API rules match DB constraints

**5C.1: Validation Coverage Measurement (v4 — Pitfall 9 fix)**
Do NOT just confirm validation exists. MEASURE coverage:
```bash
# Count route files with validation middleware
TOTAL_ROUTE_FILES=$(find server/src/routes -name "*.ts" | wc -l)
VALIDATED_FILES=$(grep -rl "validateBody\|validateQuery\|validate(\|schema\|zod\|joi" server/src/routes/ --include="*.ts" | wc -l)
echo "Validation coverage: $VALIDATED_FILES / $TOTAL_ROUTE_FILES route files"
```
- Report the exact percentage. Anything below 80% for routes accepting request bodies = MEDIUM finding.
- Prioritize validation gaps by data sensitivity (credentials, permissions, financial data first).

**5D: Error Propagation & User Feedback**
- DB failure → API error response → UI error message (full chain works)
- Error messages user-friendly (not raw stack traces)
- All async operations have timeout handling

**5D.0: Error Propagation Completeness (v4 — Pitfall 12 fix)**
```bash
# Find routes that manually send error responses (bypass global error handler)
grep -rn "res\.status(500)\|res\.status(400)\|res\.status(404)" server/src/routes/ --include="*.ts" | grep -v test > /tmp/audit_manual_error_responses.txt

# Find services throwing bare Error instead of AppError
grep -rn "throw new Error(" server/src/services/ --include="*.ts" | grep -v AppError | grep -v test > /tmp/audit_bare_errors.txt

# Check global error handler for missing error types
# Must handle: SyntaxError, AppError, MulterError, PrismaClientKnownRequestError, JWT errors
```
- Routes that `catch` and send `res.status(500).json(...)` bypass Sentry, security logging, and consistent error format → flag as MEDIUM.
- Services throwing `new Error()` instead of `AppError` → global handler returns 500 for what should be 400/404/409 → flag as MEDIUM.
- Missing error types in global handler → flag as LOW.
- Retry mechanisms for transient failures

**5D.1: Runtime Input Validation Testing** *(requires Boot Gate pass)*

Static analysis confirms validators exist — runtime testing confirms they actually reject bad input without leaking internals.

```bash
# 5D.1-A: Invalid email/password — expect structured error, no stack trace
curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"not-an-email","password":"x"}' | node -e "
    const body = require('fs').readFileSync('/dev/stdin','utf8');
    try {
      const j = JSON.parse(body);
      if (body.includes('stack') || body.includes('at ')) console.error('❌ Stack trace leaked in error response');
      else if (j.error || j.message || j.errors) console.log('✅ Structured error response');
      else console.warn('⚠️  Unexpected response shape:', Object.keys(j).join(','));
    } catch { console.error('❌ Non-JSON error response:', body.substring(0,200)); }
"

# 5D.1-B: Malformed JSON body — expect 400, not 500
CODE=$(curl -s -o /tmp/audit_malformed.txt -w "%{http_code}" -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" -d '{bad json}')
echo "Malformed JSON → HTTP $CODE (expect 400, not 500)"
if [ "$CODE" = "500" ]; then echo "❌ CRITICAL: Server returns 500 on malformed JSON"; fi

# 5D.1-C: Oversized payload (11MB) — expect 413
PAYLOAD=$(node -e "console.log(JSON.stringify({data:'x'.repeat(11*1024*1024)}))")
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" -d "$PAYLOAD" --max-time 10)
echo "11MB payload → HTTP $CODE (expect 413)"
if [ "$CODE" = "500" ]; then echo "❌ HIGH: Server crashes on oversized payload instead of returning 413"; fi

# 5D.1-D: Empty body on required endpoint — expect field-level validation
CODE=$(curl -s -o /tmp/audit_empty.txt -w "%{http_code}" -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" -d '{}')
echo "Empty body → HTTP $CODE (expect 400 with field errors)"
cat /tmp/audit_empty.txt | node -e "
  try {
    const j = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
    if (j.errors && Array.isArray(j.errors)) console.log('✅ Field-level validation errors');
    else if (j.error || j.message) console.log('⚠️  Generic error, no field-level detail');
    else console.warn('⚠️  Unexpected shape');
  } catch { console.error('❌ Non-JSON response'); }
"

# 5D.1-E: Null injection in fields — expect structured rejection
curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":null,"password":null}' | node -e "
    const body = require('fs').readFileSync('/dev/stdin','utf8');
    if (body.includes('Cannot read prop') || body.includes('TypeError'))
      console.error('❌ CRITICAL: Null input causes unhandled TypeError');
    else console.log('✅ Null input handled gracefully');
"
```

Each failing test is classified:
- 500 on malformed JSON / null input → **CRITICAL** (unhandled exception path)
- Stack trace in response → **HIGH** (information disclosure)
- Missing field-level errors → **MEDIUM** (poor developer/user experience)

**5E: Transaction & Consistency**
- Multi-step operations wrapped in transactions
- Rollback on partial failure
- Concurrent modification safety (race conditions, optimistic locking)

---

## PHASE 6: SECURITY AUDIT & AUTONOMOUS RED TEAMING

→ Read **`references/security-audit.md`** for the complete security checklist.

**6A: Authentication Flow Verification**
- Sign up, sign in, password reset, email verification — trace each end to end
- Token handling: JWT validation, refresh tokens, token expiry, secure storage
- Session management: Invalidation on logout, session fixation prevention
- OAuth: State parameter validation, secure token storage

**6B: Authorization & Access Control**
- Every API endpoint: Protected? Correct role/permission check?
- Every DB query: Scoped to current user/org? (multi-tenant safety)
- RLS policies (Supabase): Every user-data table has RLS with correct policies
- Frontend route guards: Unauthorized users can't access admin pages via URL
- Horizontal privilege escalation: Can user A access user B's data by changing an ID?

**6B.1: Exhaustive Multi-Tenant Write Operation Trace (v4+v6 — Pitfalls 8, 22 fix — MANDATORY)**
Do NOT sample one function per service. Do NOT check only "main" services. Check EVERY service file, EVERY write operation:
```bash
# Find ALL Prisma write operations in service files
grep -rn "\.create(\|\.update(\|\.delete(\|\.upsert(\|\.updateMany(\|\.deleteMany(" server/src/services/ --include="*.ts" | grep -v node_modules | grep -v test > /tmp/audit_all_writes.txt
echo "Total write operations: $(wc -l < /tmp/audit_all_writes.txt)"
```
For EACH write operation found:
1. Read the surrounding function
2. Check if `organizationId` is used in the `where` clause (for updates/deletes) or verified via a prior lookup (for creates)
3. If a write operates on entity X and X belongs to an organization, but the query uses `{ id: entityId }` alone without org filtering → **HIGH severity multi-tenant isolation gap**
4. Cross-reference: When one function in a service has org checks and another doesn't → higher confidence it's a bug, not intentional

**6B.2: Cross-Entity Consistency Check (v4 — Pitfall 8 fix)**
When a function processes multiple entity types (e.g., search indexing, bulk operations, migration):
```bash
# Find functions that query multiple Prisma models
grep -rn "prisma\.\w\+\.\(findMany\|findFirst\|count\)" server/src/ --include="*.ts" | grep -v test > /tmp/audit_reads.txt
```
For each function that queries 3+ different models, verify ALL models have the same security filters (organizationId, userId). One missing filter among N entities = cross-tenant data leak.

**6C: Data Protection**
- Passwords hashed with bcrypt/argon2 (not MD5/SHA1)
- HTTPS enforced, API calls use TLS
- PII minimized, data retention considered
- Secrets in code: Hardcoded API keys, tokens, passwords, connection strings

**6C.1: Credential Storage Completeness (v4 — Pitfall 8 fix)**
Do NOT only check JWT/password storage. Check ALL credential types:
```bash
# Find all token/key/secret storage patterns
grep -rn "bearerToken\|apiKey\|secretKey\|accessToken\|serviceToken\|webhookSecret\|signingKey" server/src/ --include="*.ts" | grep -v node_modules | grep -v test | grep -v "\.d\.ts"
```
For each: Is the credential hashed before storage? If stored in plaintext, is it compared in constant-time? API keys and service tokens MUST be hashed (not just passwords).

**6D: Input Security (OWASP Top 10)**
- SQL injection: Raw string concatenation in queries
- XSS: User input sanitized before rendering, CSP headers set
- CSRF: State-changing requests protected
- Path traversal: File paths validated
- Mass assignment: Request bodies filtered to allowed fields
- Rate limiting on auth endpoints and public APIs
- Security headers: helmet/CSP/X-Frame-Options/HSTS/X-Content-Type-Options

**6D.1: Exhaustive Outbound HTTP Call SSRF Trace (v4 — Pitfall 8 fix — MANDATORY)**
Do NOT check only the "webhook service." Check EVERY outbound HTTP call:
```bash
# Find ALL outbound HTTP calls in server code
grep -rn "axios(\|axios\.\|fetch(\|got(\|request(\|http\.get\|https\.get\|http\.request\|https\.request" server/src/ --include="*.ts" | grep -v node_modules | grep -v test > /tmp/audit_outbound_http.txt
echo "Total outbound HTTP calls: $(wc -l < /tmp/audit_outbound_http.txt)"
```
For EACH outbound call:
1. Is the URL user-controllable? (comes from config, DB, or request params)
2. If yes, is there SSRF validation (`isWebhookUrlSafe`, URL allowlist, internal IP blocking)?
3. If a dedicated safe-fetch utility exists in the codebase but THIS call bypasses it → HIGH SSRF gap

**6D.2: Rate Limit Coverage Measurement (v4 — Pitfall 9 fix)**
```bash
# Find all route mounts in app/index file
grep -rn "app\.use\|router\.use" server/src/index.ts --include="*.ts" | grep -i "api\|route"
# Cross-reference with rate limiter middleware
grep -rn "apiLimiter\|rateLimiter\|rateLimit" server/src/index.ts --include="*.ts"
```
List ALL route groups and mark which have rate limiting. Any missing = finding. Calculate coverage percentage.

**6D.3: Exhaustive Default-Value Security Audit (v4+v5 — Pitfalls 11, 21 fix)**
For EVERY config value with a fallback default, verify the default is SECURE:
```bash
# Find ALL config defaults — not just "common" ones
grep -rn "process\.env\.\w\+.*||\|process\.env\.\w\+.*??\|process\.env\.\w\+.*:" server/src/config/ --include="*.ts" | grep -v test > /tmp/audit_config_defaults.txt
```
Check EVERY default, including domain-specific protocols:
- **Web security:** CORS origins, JWT secret, rate limits, SSL mode, cookie flags, CSRF → MUST fail-closed
- **Message brokers:** MQTT, AMQP, Kafka URLs → Default must not be plaintext/unauthenticated
- **Databases:** Connection URLs → Default must not skip SSL
- **Search/Cache:** Elasticsearch, Redis URLs → Check auth defaults
- **Encryption:** Key lengths → Minimum must match algorithm requirement (AES-256 → 32 bytes, not 16)
- **External APIs:** Any URL default that bypasses TLS
- **CI/CD:** GitHub Action versions → Must reference existing versions

**6D.4: Dynamic Code Execution / ReDoS Audit (v4 — Pitfall 15 fix)**
```bash
# Find user-controllable dynamic code execution
grep -rn "new RegExp(\|eval(\|Function(\|vm\.run\|child_process\.\(exec\|spawn\)" server/src/ --include="*.ts" | grep -v node_modules | grep -v test
```
For each: Is the input user-controllable? If yes → verify sandboxing, input validation, or safe alternative (e.g., `re2` for regex, `safeEval` for expressions).

**6E: Dependency Security**
- Known CVEs in dependencies
- Outdated packages with security patches available
- Unused dependencies expanding attack surface

**6F: Secrets Management**
- Secrets loaded from env vars or secrets manager (Vault, AWS SM, Doppler, Infisical)
- No .env files in git (including history)
- .gitignore covers all secret file types
- Secret rotation plan exists

**6G: Token & Credential Memory Security**
- Tokens NOT in localStorage (prefer httpOnly cookies)
- Refresh tokens in httpOnly secure cookies
- Token variables cleared on logout
- Mobile: tokens in platform secure storage (Keychain, EncryptedSharedPreferences)
- No tokens in URL query parameters

**6H: TLS & Certificate Security**
- All external calls use HTTPS
- SSL verification not disabled in production
- HSTS configured, HTTP→HTTPS redirect
- Certificate pinning for mobile apps / high-security API clients
- TLS 1.2+ enforced

**6I: Executable Red Team Commands** *(requires Boot Gate pass)*

These commands produce actual exploit results — not theoretical risk descriptions. Execute every command and record the HTTP status + response body.

```bash
# RT-1: No-auth request to protected endpoint → expect 401
CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/dashboard)
echo "RT-1 No-auth → HTTP $CODE (expect 401)"
if [ "$CODE" = "200" ]; then echo "❌ CRITICAL: Protected endpoint accessible without auth"; fi

# RT-2: Forged/expired JWT → expect 401
CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/dashboard \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZXhwIjoxfQ.invalid_sig")
echo "RT-2 Forged JWT → HTTP $CODE (expect 401)"
if [ "$CODE" = "200" ]; then echo "❌ CRITICAL: Forged JWT accepted"; fi

# RT-3: IDOR with fake UUID → expect 401 or 404 (not 200 or 500)
FAKE_UUID="00000000-0000-0000-0000-000000000000"
CODE=$(curl -s -o /tmp/audit_idor.txt -w "%{http_code}" "http://localhost:3001/api/vendors/${FAKE_UUID}" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.invalid")
echo "RT-3 IDOR fake UUID → HTTP $CODE (expect 401 or 404)"
if [ "$CODE" = "200" ]; then echo "❌ CRITICAL: IDOR — data returned for fake UUID without auth"; fi
if [ "$CODE" = "500" ]; then echo "❌ HIGH: Server error on fake UUID — missing input validation"; fi

# RT-4: Burst 55 login attempts → expect 429 (dev rate limit = 50)
echo "RT-4 Rate limit burst test (55 requests)..."
RATE_RESULTS=""
for i in $(seq 1 55); do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" -d '{"email":"ratetest@test.com","password":"wrong"}' --max-time 5)
  RATE_RESULTS="${RATE_RESULTS}${CODE}\n"
done
COUNT_429=$(echo -e "$RATE_RESULTS" | grep -c "429")
echo "RT-4 Got $COUNT_429 / 55 rate-limited (429) responses"
if [ "$COUNT_429" -eq 0 ]; then echo "❌ HIGH: No rate limiting triggered after 55 requests"; fi

# RT-5: SQL injection in query params → no DB error strings in response
SQLI_RESP=$(curl -s "http://localhost:3001/api/search?q=1'%20OR%201=1--" -b /tmp/audit_cookies.txt)
echo "$SQLI_RESP" | node -e "
  const body = require('fs').readFileSync('/dev/stdin','utf8');
  const dbErrors = ['syntax error','pg_catalog','relation','column','SQLSTATE','unterminated'];
  const leaked = dbErrors.filter(e => body.toLowerCase().includes(e.toLowerCase()));
  if (leaked.length) console.error('❌ CRITICAL: SQL error strings in response:', leaked.join(', '));
  else console.log('✅ RT-5 No SQL error strings leaked');
"

# RT-6: XSS — script tag in name field → should not be reflected
XSS_RESP=$(curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"xss@test.com","password":"Test123!","name":"<script>alert(1)</script>"}')
if echo "$XSS_RESP" | grep -q '<script>'; then
  echo "❌ HIGH: XSS payload reflected in response"
else
  echo "✅ RT-6 XSS payload not reflected"
fi

# RT-7: POST without CSRF token → expect 403 (prod) or document dev skip
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3001/api/vendors \
  -H "Content-Type: application/json" -d '{"name":"csrf-test"}')
echo "RT-7 POST without CSRF → HTTP $CODE"
if [ "$CODE" != "403" ]; then echo "⚠️  MEDIUM: CSRF not enforced (expected in dev mode — verify prod config)"; fi

# RT-8: CORS with evil origin → should NOT return Access-Control-Allow-Origin
CORS_HEADER=$(curl -s -I -H "Origin: https://evil.attacker.com" http://localhost:3001/api/dashboard \
  | grep -i "access-control-allow-origin" | tr -d '\r')
if echo "$CORS_HEADER" | grep -qi "evil.attacker.com"; then
  echo "❌ HIGH: CORS allows arbitrary origins"
elif echo "$CORS_HEADER" | grep -qi "\*"; then
  echo "❌ MEDIUM: CORS allows wildcard origin"
else
  echo "✅ RT-8 CORS rejects evil origin"
fi

# RT-9: Security headers check
HEADERS=$(curl -sI http://localhost:3001/ | tr -d '\r')
for h in "x-content-type-options" "x-frame-options" "strict-transport-security" "x-xss-protection" "content-security-policy"; do
  if echo "$HEADERS" | grep -qi "$h"; then
    echo "✅ Header present: $h"
  else
    echo "❌ MEDIUM: Missing security header: $h"
  fi
done
if echo "$HEADERS" | grep -qi "x-powered-by"; then
  echo "❌ LOW: X-Powered-By header present (information disclosure)"
else
  echo "✅ X-Powered-By removed"
fi
```

Severity classification for red team results:
| Result | Severity |
|--------|----------|
| Protected endpoint accessible without auth (RT-1) | **CRITICAL** |
| Forged JWT accepted (RT-2) | **CRITICAL** |
| IDOR returns data (RT-3) | **CRITICAL** |
| SQL error strings in response (RT-5) | **CRITICAL** |
| No rate limiting (RT-4) | **HIGH** |
| XSS reflected (RT-6) | **HIGH** |
| CORS allows arbitrary origins (RT-8) | **HIGH** |
| Missing security headers (RT-9) | **MEDIUM** |
| CSRF not enforced in dev (RT-7) | **MEDIUM** (verify prod) |

#### Visionary Enhancement: Autonomous Red Teaming / Fuzzing

After completing the static security audit, actively attempt exploitation in a local/sandboxed environment:

1. **Auth Bypass Fuzzing**: Synthesize requests with missing/malformed/expired tokens, manipulated JWTs (alg:none, key confusion), and IDOR payloads. Execute against local API endpoints.
2. **Injection Payload Testing**: For each unparameterized query found in 6D, craft and execute SQL injection, XSS, and command injection payloads locally.
3. **RBAC Escalation Probes**: Simulate requests from lower-privilege roles attempting higher-privilege actions. Verify every endpoint rejects unauthorized access.
4. **Rate Limit Validation**: Send burst requests to auth and public endpoints to confirm rate limiting actually triggers.
5. **Severity Classification**: Only mark a vulnerability as CRITICAL if the exploit actually succeeds locally. Theoretical risks remain HIGH or MEDIUM.

Report format for red team findings:
```
EXPLOIT: [endpoint/path]
VECTOR: [payload used]
RESULT: EXPLOITABLE | BLOCKED | PARTIAL
SEVERITY: CRITICAL (if exploitable) | HIGH (if partially blocked) | MEDIUM (theoretical)
FIX: [exact code patch]
```

---

## PHASE 7: API COMPLETENESS & ROBUSTNESS

**7A: Endpoint inventory** — List every API endpoint and verify:
- Proper HTTP methods (GET for reads, POST for creates, etc.)
- Input validation present on every endpoint
- Consistent error response format across all endpoints
- Proper HTTP status codes (not 200 for everything)
- Content-Type headers set correctly

**7A.1: Precise Frontend↔Backend Contract Verification (v4 — Pitfall 13 fix — MANDATORY)**
Do NOT just match paths. Verify method, path, AND params:
```bash
# Extract ALL API calls from frontend service file with method + path
grep -rn "fetchAPI\|api\.\w\+\.\w\+" services/api.ts --include="*.ts" | head -200 > /tmp/audit_frontend_contracts.txt

# Extract ALL backend route registrations with method + path
grep -rn "router\.\(get\|post\|put\|patch\|delete\)(" server/src/routes/ --include="*.ts" | grep -v test > /tmp/audit_backend_contracts.txt
```
For each frontend API call:
1. Does a backend route exist at that EXACT path?
2. Does the HTTP method match (frontend PATCH vs backend PUT = mismatch)?
3. Do path parameters match (frontend `/compare/${tier}` vs backend no `:tier` route)?
4. Does the response shape match what the frontend expects?
Report mismatches as MEDIUM severity.

**7B: Error handling** — Verify what happens when:
- Invalid JSON body sent
- Required fields missing
- Wrong data types provided
- Unauthorized request made
- Resource not found (404)
- Server error occurs (500)

**7B.1: Runtime API Robustness Testing** *(requires Boot Gate pass)*

Verify error handling works at runtime, not just in code.

```bash
# 7B.1-A: Invalid JSON to POST endpoints → expect 400
for endpoint in "/api/auth/login" "/api/vendors" "/api/reports"; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "http://localhost:3001${endpoint}" \
    -H "Content-Type: application/json" -d "not-json" -b /tmp/audit_cookies.txt)
  echo "Invalid JSON → ${endpoint}: HTTP $CODE (expect 400)"
  if [ "$CODE" = "500" ]; then echo "❌ HIGH: 500 on invalid JSON at ${endpoint}"; fi
done

# 7B.1-B: Empty body on validated endpoints → expect 400
for endpoint in "/api/auth/login" "/api/auth/register"; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "http://localhost:3001${endpoint}" \
    -H "Content-Type: application/json" -d '{}' -b /tmp/audit_cookies.txt)
  echo "Empty body → ${endpoint}: HTTP $CODE (expect 400)"
  if [ "$CODE" = "500" ]; then echo "❌ HIGH: 500 on empty body at ${endpoint}"; fi
done

# 7B.1-C: Wrong Content-Type → expect 400 or 415
for endpoint in "/api/auth/login" "/api/vendors"; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "http://localhost:3001${endpoint}" \
    -H "Content-Type: text/plain" -d 'hello' -b /tmp/audit_cookies.txt)
  echo "Wrong Content-Type → ${endpoint}: HTTP $CODE (expect 400 or 415)"
  if [ "$CODE" = "500" ]; then echo "❌ MEDIUM: 500 on wrong Content-Type at ${endpoint}"; fi
done

# 7B.1-D: Verify consistent error shape across all 4xx responses
echo "Checking error response consistency..."
ENDPOINTS=("/api/auth/login" "/api/vendors" "/api/reports" "/api/dashboard")
ERROR_SHAPES=""
for endpoint in "${ENDPOINTS[@]}"; do
  SHAPE=$(curl -s -X POST "http://localhost:3001${endpoint}" \
    -H "Content-Type: application/json" -d '{}' -b /tmp/audit_cookies.txt | \
    node -e "try{const j=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));console.log(Object.keys(j).sort().join(','))}catch{console.log('NON-JSON')}")
  ERROR_SHAPES="${ERROR_SHAPES}${endpoint}: ${SHAPE}\n"
done
echo -e "$ERROR_SHAPES"
UNIQUE_SHAPES=$(echo -e "$ERROR_SHAPES" | awk -F': ' '{print $2}' | sort -u | wc -l)
if [ "$UNIQUE_SHAPES" -gt 2 ]; then
  echo "⚠️  MEDIUM: Inconsistent error response shapes across endpoints ($UNIQUE_SHAPES unique shapes)"
else
  echo "✅ Error response shapes are consistent"
fi
```

Any 500 on bad input is a **HIGH** finding — the server should never crash on malformed client requests.

**7C: API documentation** — OpenAPI/Swagger spec exists and matches implementation?

---

## PHASE 8: DEPLOYMENT HARDENING & CHAOS ENGINEERING

→ Read **`references/deployment-hardening.md`** for the complete infrastructure checklist.

**8A: Environment & Configuration**
- All env vars documented in .env.example
- Env var validation at startup (crash early if missing)
- No hardcoded localhost without env fallback
- Separate dev/staging/production configs
- Secrets not in version control (.gitignore verified)

**8B: Server & Runtime**
- Health check endpoint (verifies DB connectivity)
- Graceful shutdown (SIGTERM/SIGINT handling)
- Global error handler (no unhandled exceptions crash the process)
- Request timeouts and body size limits configured
- CORS configured (not wildcard `*` in production)

**8C: Database**
- Connection pooling with appropriate limits
- Retry logic for transient failures
- All migrations applied and current
- Indexes on frequently filtered/sorted columns
- No N+1 query patterns in critical paths
- Backup strategy confirmed

**8D: Monitoring & Observability**
- Structured logging (winston/pino/structlog, not console.log)
- Error tracking integrated (Sentry/Bugsnag) or documented plan
- Health check for uptime monitoring
- Key metrics: response times, error rates, DB query times
- Alerting for critical failures (or documented plan)

**8E: Scaling & Performance**
- Stateless server design (no in-memory sessions)
- Static assets via CDN (not dev server)
- File uploads: size limits, type validation
- Long-running ops: async handling (queues/background jobs)

**8F: CI/CD Pipeline**
- Reproducible build process
- Environment-specific configs
- Migration strategy for zero-downtime deploys
- Rollback strategy documented
- Post-deploy health checks

**8F.1: CI Security Scanning**
- SAST in CI (CodeQL, Semgrep, SonarQube, Snyk)
- Dependency scanning in CI (npm audit, Dependabot, Renovate)
- Container image scanning (Trivy, Grype, Snyk Container)
- Secret scanning (GitLeaks, TruffleHog)
- Scan results block deployment on critical/high findings

**8F.2: Deployment Gates**
- Staging environment matches production
- Manual approval gate before production deploy
- Canary / blue-green / rolling deployment strategy
- Smoke tests in staging before promotion
- Feature flags for risky features
- Deploy freeze capability

**8G: Docker & Container Hardening**
- Non-root USER directive in Dockerfile
- Pinned base image tags (never `:latest` in production)
- Multi-stage builds (build deps not in final image)
- Minimal base images (alpine, distroless, slim)
- .dockerignore excludes node_modules, .env, .git, secrets
- No secrets in build args/env/layers
- HEALTHCHECK directive
- **Trivy/Grype scanning** in CI — critical/high CVEs block push
- **IMAGE_TAG** from git SHA or semver (never `:latest` in prod)

**8G.1: Runtime Compatibility Verification (v5 — Pitfall 19)**
Read the Dockerfile fully and cross-reference:
- `--force-fips` → Does the base image's OpenSSL support FIPS mode? (Alpine: NO. Ubuntu/RHEL with certified module: YES)
- `NODE_OPTIONS` → Are all flags compatible with the Node.js version in the image?
- Native modules → Do they compile on the target architecture (arm64 vs x86_64)?
- TLS certs → Do cert paths referenced in env vars exist in the container?

**8G.2: CI Action Version Verification (v5 — Pitfall 21)**
```bash
# Check GitHub Actions versions referenced
grep -rn "uses:.*@v" .github/workflows/ | grep -oP '@v\d+' | sort -u
```
Verify referenced action versions actually exist. Pinned major versions (v4) are safer than bleeding edge (v6+).

**8G.3: ALL Dockerfiles and Compose Files (v6 — Pitfall 23 — MANDATORY)**
```bash
find . -name "Dockerfile*" -o -name "docker-compose*" | grep -v node_modules | sort
```
Read EVERY file found. For each Dockerfile: non-root USER, pinned base image, no default passwords. For each docker-compose: no hardcoded credentials (Grafana admin password, Redis password, etc.), service images pinned.

**8G.4: Cross-File Version Consistency (v6 — Pitfall 24)**
```bash
# CI Node version
grep -rn "node-version" .github/workflows/ | head -5
# Dockerfile Node version
grep "FROM node" Dockerfile | head -3
# package.json engines
grep -A2 '"engines"' package.json server/package.json 2>/dev/null
```
CI Node version MUST match Dockerfile Node version. `engines` field SHOULD exist.

**8G.5: Package.json Production Readiness (v6 — Pitfall 26)**
```bash
# Check for production-critical packages in devDependencies
grep -A200 '"devDependencies"' server/package.json | grep -i "sentry\|datadog\|winston\|pino\|helmet\|cors\|prisma\|express"
```
Production-critical packages in devDependencies = HIGH finding (won't install with `--production`).

**8G.6: Error Path Runtime Testing (v6 — Pitfall 25)** *(requires Boot Gate pass)*
```bash
# Test CORS error path
curl -s -I -H "Origin: %%%invalid%%%" http://localhost:3001/api/health | grep -i "x-powered-by\|server:"
# Test body parser error path
curl -s -H "Content-Type: application/json" -d "not{json" http://localhost:3001/api/auth/login 2>/dev/null | grep -i "stack\|at /"
```
If middleware error responses leak X-Powered-By, stack traces, or server info → MEDIUM finding.

**8H: Mobile Deployment** (if applicable)
- Platform secure token storage (Keychain, EncryptedSharedPreferences)
- Certificate pinning for API calls
- App signing keys secured (not in git)
- Separate debug/staging/release builds
- Automated builds (Fastlane, EAS Build)
- Beta distribution (TestFlight, Firebase App Distribution)

**8I: Pre-Migration Database Backup**
- Automated backup BEFORE every migration in CI/CD
- Backup verified before migration proceeds
- Migration reversibility (down migrations exist)
- Migration tested in staging first
- Deployment order: Backup → Migrate → Verify → Deploy → Health check

**8J: Disaster Recovery**
- Database backup config confirmed
- Data export capability
- Recovery procedure documented
- Secrets rotation plan

**8K: Runtime Infrastructure Connectivity Tests**

Static code review cannot catch runtime connectivity failures caused by library-level configuration mismatches (e.g., `pg` ignoring `sslmode` from the connection string, adapter layers swallowing SSL config). This sub-phase **boots the server against the live database** and validates real connections.

**Why this exists:** The `pg` (node-postgres) library does NOT parse libpq URL parameters like `sslmode=require`. When `pg.Pool` is used as a Prisma adapter, SSL must be configured explicitly in the Pool constructor options. A static audit sees `sslmode=require` in `DATABASE_URL` and marks TLS as "configured" — but the actual runtime connection fails with "self-signed certificate in certificate chain." This class of bug is invisible without runtime verification.

Checks:
1. **Database Connectivity**: Start the server process and confirm the DB connection test passes. If the project has a `testConnection()` or health-check endpoint, invoke it. Otherwise, run:
   ```bash
   cd server && node -e "
     const { Pool } = require('pg');
     const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
     pool.query('SELECT 1').then(() => { console.log('DB OK'); pool.end(); }).catch(e => { console.error('DB FAIL:', e.message); process.exit(1); });
   "
   ```
2. **SSL/TLS Negotiation**: Verify the connection uses TLS and that the SSL config in the connection pool matches the `sslmode` in `DATABASE_URL`. Specifically check for the `pg.Pool` ↔ `sslmode` mismatch pattern:
   ```bash
   # Flag if pg.Pool is constructed without explicit ssl option but DATABASE_URL has sslmode
   grep -A5 "new pg.Pool\|new Pool(" server/src/ -rn --include="*.ts" --include="*.js"
   # Cross-reference with DATABASE_URL
   grep "sslmode" server/.env
   ```
   If `DATABASE_URL` contains `sslmode=require` but the Pool constructor has no `ssl` property, this is a **CRITICAL** runtime failure.
3. **Third-Party Service Reachability**: For each external service (Stripe, SendGrid, S3, etc.), make a lightweight authenticated API call (e.g., Stripe: `stripe.customers.list({ limit: 1 })`) and confirm a non-error response. Missing or invalid API keys that pass static checks but fail at runtime are caught here.
4. **Redis/Cache Connectivity** (if applicable): Ping the cache and confirm read/write.
5. **ORM Adapter Layer Validation**: When a database adapter pattern is used (e.g., `PrismaPg`, Drizzle adapter), verify the adapter passes connection options correctly by tracing the config chain:
   - Connection string → Pool/Client constructor → Adapter → ORM client
   - Confirm SSL, pool size, and timeout settings propagate through each layer.

Report format:
```
RUNTIME CHECK: [service/connection]
STATUS: CONNECTED | FAILED | DEGRADED
ERROR: [exact error message if failed]
ROOT CAUSE: [library mismatch / missing config / invalid credentials]
FIX: [exact code/config patch]
SEVERITY: CRITICAL (if core DB) | HIGH (if external service)
```

**8K.1: Health Endpoint Deep Validation** *(requires Boot Gate pass)*
```bash
START=$(date +%s%N)
HEALTH=$(curl -s http://localhost:3001/health)
END=$(date +%s%N)
ELAPSED=$(( (END - START) / 1000000 ))
echo "Health endpoint response time: ${ELAPSED}ms"
if [ "$ELAPSED" -gt 5000 ]; then echo "❌ HIGH: Health check took > 5s (${ELAPSED}ms)"; fi

echo "$HEALTH" | node -e "
  const data = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
  const subsystems = ['database','websocket','memory','jobQueue','cache','region'];
  let pass = 0, fail = 0;
  for (const s of subsystems) {
    const val = data[s];
    const status = typeof val === 'object' ? (val.status || JSON.stringify(val)) : val;
    const ok = ['ok','healthy','connected','active'].includes(String(status).toLowerCase());
    console.log(ok ? '✅' : '❌', s + ':', status);
    ok ? pass++ : fail++;
  }
  console.log('---');
  console.log('Subsystems: ' + pass + '/' + (pass+fail) + ' healthy');
  if (fail > 0) process.exit(1);
"
```

**8K.2: Graceful Shutdown Handlers** *(static check — destructive test is manual)*
```bash
# Verify SIGTERM/SIGINT handlers exist in server code
grep -rn "SIGTERM\|SIGINT\|process.on.*signal\|gracefulShutdown\|server.close" server/src/ --include="*.ts" --include="*.js" | grep -v node_modules | grep -v __tests__
```
If no signal handlers found, this is a **HIGH** finding — the server will hard-kill on deployment, dropping in-flight requests.

**8K.3: External Service Probes** *(requires Boot Gate pass)*
```bash
cd server && node -e "
  require('dotenv').config();

  // Stripe probe
  const stripeKey = process.env.STRIPE_SECRET_KEY || '';
  if (stripeKey.startsWith('sk_test_') || stripeKey.startsWith('sk_live_')) {
    fetch('https://api.stripe.com/v1/customers?limit=1', {
      headers: { 'Authorization': 'Bearer ' + stripeKey }
    }).then(r => {
      if (r.ok) console.log('✅ Stripe: connected (HTTP ' + r.status + ')');
      else console.error('❌ Stripe: HTTP ' + r.status);
    }).catch(e => console.error('❌ Stripe: ' + e.message));
  } else {
    console.log('⏭️  Stripe: SKIPPED (placeholder or missing key)');
  }

  // SendGrid probe
  const sgKey = process.env.SENDGRID_API_KEY || '';
  if (sgKey.startsWith('SG.')) {
    fetch('https://api.sendgrid.com/v3/user/profile', {
      headers: { 'Authorization': 'Bearer ' + sgKey }
    }).then(r => {
      if (r.ok) console.log('✅ SendGrid: connected (HTTP ' + r.status + ')');
      else console.error('❌ SendGrid: HTTP ' + r.status);
    }).catch(e => console.error('❌ SendGrid: ' + e.message));
  } else {
    console.log('⏭️  SendGrid: SKIPPED (placeholder or missing key)');
  }
"
```
External service probes use **SKIP** (not FAIL) for placeholder API keys. Real keys that fail authentication are **HIGH** findings.

#### Visionary Enhancement: Chaos Engineering Protocols

After the static infrastructure audit, actively test resilience in a local containerized environment:

1. **Database Connection Kill**: Terminate DB connections mid-request. Verify the app returns graceful errors (not crashes or hung connections). Confirm connection pool recovery.
2. **Latency Injection**: Add 2-5 second delays to API responses or DB queries. Verify timeouts trigger correctly, loading states render, and no cascading failures occur.
3. **Disk Full Simulation**: Fill the temp/log directory. Verify the app handles write failures gracefully without data corruption.
4. **Memory Pressure**: Restrict container memory and generate load. Verify OOM handling, graceful degradation, and no data loss.
5. **Dependency Outage**: Block outbound calls to third-party services (Stripe, SendGrid, S3). Verify fallback behavior, retry logic, and user-facing error messages.
6. **DNS Resolution Failure**: Simulate DNS failures for external services. Verify timeout handling and circuit breaker patterns.

Report format for chaos findings:
```
CHAOS TEST: [scenario]
TARGET: [component/service]
RESULT: RESILIENT | DEGRADED | FAILED
IMPACT: [what breaks and how]
FIX: [exact code/config patch]
```

---

## PHASE 9: VISUAL VERIFICATION (VLM-Driven)

Synthesize Playwright scripts to render critical UI flows and capture screenshots for VLM evaluation:

1. **Page Load States**: Navigate to every route. Capture screenshots. Verify via VLM that pages render correctly (no blank screens, no broken layouts, no placeholder text).
2. **Error States**: Trigger API failures and verify error messages render correctly (not raw JSON, not empty screens).
3. **Empty States**: Load pages with no data. Verify meaningful empty state messages (not blank tables, not "undefined").
4. **Loading States**: Intercept API responses to delay them. Verify loading indicators appear (not frozen UI).
5. **Responsive Breakpoints**: Capture at mobile (375px), tablet (768px), and desktop (1280px). Flag layout breaks.
6. **Accessibility Snapshot**: Run axe-core via Playwright. Report WCAG violations.

**9A: Run Full Playwright Suite** *(requires Frontend Boot Gate pass)*
```bash
# Run existing Playwright tests with JSON reporter for machine-parseable results
npx playwright test --reporter=json 2>/tmp/audit_playwright_stderr.txt | tee /tmp/audit_playwright.json | node -e "
  const data = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
  const suites = data.suites || [];
  let pass = 0, fail = 0, skip = 0;
  function walk(s) {
    for (const spec of (s.specs || [])) {
      for (const test of (spec.tests || [])) {
        for (const result of (test.results || [])) {
          if (result.status === 'passed') pass++;
          else if (result.status === 'failed') fail++;
          else skip++;
        }
      }
    }
    for (const child of (s.suites || [])) walk(child);
  }
  suites.forEach(walk);
  console.log('Playwright: ' + pass + ' passed, ' + fail + ' failed, ' + skip + ' skipped');
  if (fail > 0) process.exit(1);
" 2>/dev/null || echo "⚠️  Playwright suite had failures — check /tmp/audit_playwright.json"
```

**9B: axe-core Accessibility Audit via Playwright**
```bash
# Run accessibility-specific tests if they exist
npx playwright test --grep "accessibility\|a11y\|axe" --reporter=json 2>/dev/null | tee /tmp/audit_a11y.json | node -e "
  try {
    const data = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
    const suites = data.suites || [];
    let pass = 0, fail = 0;
    function walk(s) {
      for (const spec of (s.specs || [])) {
        for (const test of (spec.tests || [])) {
          for (const result of (test.results || [])) {
            result.status === 'passed' ? pass++ : fail++;
          }
        }
      }
      for (const child of (s.suites || [])) walk(child);
    }
    suites.forEach(walk);
    console.log('Accessibility tests: ' + pass + ' passed, ' + fail + ' failed');
  } catch { console.log('⏭️  No accessibility tests found'); }
"
```

**9C: Visual Regression Screenshots**
```bash
# Capture screenshots at desktop and mobile viewports for visual regression
npx playwright test --grep "visual\|screenshot\|snapshot" --reporter=json --update-snapshots 2>/dev/null || \
  echo "⏭️  No visual regression tests found — run manually with: npx playwright test e2e/visual/"
```

**9D: Critical Flow E2E Smoke Test**
```bash
# Run critical path tests (login, navigation, core features)
npx playwright test --grep "smoke\|critical\|login.*flow\|e2e" --reporter=json 2>/dev/null | tee /tmp/audit_smoke.json | node -e "
  try {
    const data = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
    let pass = 0, fail = 0;
    function walk(s) {
      for (const spec of (s.specs || [])) {
        for (const test of (spec.tests || [])) {
          for (const result of (test.results || [])) {
            result.status === 'passed' ? pass++ : fail++;
          }
        }
      }
      for (const child of (s.suites || [])) walk(child);
    }
    (data.suites || []).forEach(walk);
    console.log('Smoke tests: ' + pass + ' passed, ' + fail + ' failed');
    if (fail > 0) process.exit(1);
  } catch { console.log('⏭️  No smoke tests matched'); }
" 2>/dev/null || echo "⚠️  Smoke tests had failures"
```

If no Playwright tests exist at all, this is a **HIGH** finding — no E2E coverage means UI regressions go undetected.

Report format for VLM findings:
```
VLM CHECK: [page/route] @ [viewport]
STATE: [load | error | empty | loading]
SCREENSHOT: [path]
VERDICT: PASS | FAIL | DEGRADED
ISSUE: [description of visual problem]
FIX: [component and CSS/JSX patch]
```

---

## PHASE 10: REPORT GENERATION & AUTO-HEALING

Save as `PRODUCTION_READINESS_REPORT.md` in the project root.

→ Read **`references/report-template.md`** for the exact report structure.

**Report sections:**
1. **Build Status** — Every compile/lint error listed in full
2. **AST Semantic Analysis** — Dead code, complexity hotspots, hidden stubs found via AST
3. **Production Gaps** — Every gap with file, line, code, impact chain, complete fix instructions
4. **Feature Completeness Matrix** — Every feature × every layer with completion %
5. **Application Logic Issues** — Business rule gaps, validation holes, state management problems
6. **Security Findings & Red Team Results** — Static audit + active exploitation results with severity
7. **API Completeness** — Missing validation, inconsistent responses, missing endpoints
8. **Deployment Blockers** — Everything that causes failure in production
9. **Infrastructure & Chaos Results** — Monitoring, logging, scaling, DR items + resilience test outcomes
10. **Visual Verification (VLM)** — Screenshot-backed UI state verification results
11. **Final Scorecard** — Weighted readiness across all domains
12. **Prioritized Fix List with Executable Patches** — Ordered by severity + dependency, with complexity and full instructions

### Readiness Scoring

| Domain | Weight |
|--------|--------|
| Build & Compile | 10% |
| Code Quality (no mocks/stubs) | 15% |
| Feature Completeness | 25% |
| Application Logic | 15% |
| Security | 20% |
| Deployment Hardening | 15% |

### Fix Instruction Standard

Every fix must be **directly implementable** without guessing. Include actual code, SQL, config — not "implement proper error handling" but the actual handler code with imports and dependencies noted. The AI Agent must offer to apply these patches directly.

### Auto-Healing Deliverables

In addition to the report, generate:
- **Patch files** (`*.patch` or inline diffs) for every `PRODUCTION_GAP` finding that can be auto-fixed.
- **Property-based test files** for critical business logic discovered during the audit.
- **Playwright test scripts** generated during VLM verification (reusable for CI regression).
- A **`fixes/` directory** containing all patches organized by phase and severity.

The agent should offer to apply all patches with user approval.

### Self-Verification

Before presenting the report, re-read it and ask: **"If I fixed every item here, would there be ANY surprises on a re-scan?"** If yes, go find what's missing. ONE pass, ZERO surprises.

---

## MANDATORY VERIFICATION STEPS (Non-Negotiable)

These steps MUST be executed — not estimated, not inferred, not self-reported. Failure to run them makes the entire audit unreliable.

### 1. Build Verification
```bash
cd server && NODE_OPTIONS="--max-old-space-size=4096" npx tsc --noEmit 2>&1 | tail -5
```
Report the EXACT error count. Do NOT report "0 errors" without running this command. If the build fails, this is a **CRITICAL** finding.

### 2. Dependency Audit
```bash
npm audit --json 2>/dev/null | jq '.metadata.vulnerabilities'
cd server && npm audit --json 2>/dev/null | jq '.metadata.vulnerabilities'
```
Parse the ACTUAL JSON output. Report exact counts for each severity level.

### 3. Fix Verification
Every claimed "FIXED" item in the report MUST cite:
- The specific **commit hash** where it was fixed
- The actual **file diff** (run `git show <commit> -- <file>` or read the file)
- Never trust commit messages alone — verify the diff touches the relevant code

### 4. Prisma Model Verification
Before classifying search/indexing code, READ the Prisma schema:
```bash
grep "^model " server/prisma/schema.prisma | sort
```
Key corrections to watch for:
- `prisma.riskItem` (NOT `prisma.risk`)
- `prisma.frameworkControl` (NOT `prisma.control`)
- `prisma.evidenceAnalysis` (NOT `prisma.evidence`)
- `Vendor` has `serviceDescription` (NOT `description`)

### 5. Multi-Tenant Isolation Audit
Every `findUnique`/`findFirst` in route handlers MUST include `organizationId` in the where clause:
```bash
grep -rn "findUnique\|findFirst" server/src/routes/ | grep -v "organizationId" | grep -v "node_modules"
```
Any match without `organizationId` is a **CRITICAL** privilege escalation vulnerability.

### 6. Auth Pattern Consistency (Anti-Pattern Detection)
All authenticated endpoints must use httpOnly cookies, not Bearer tokens from URL params or `document.cookie`:
```bash
grep -rn "token.*query\|searchParams.*token\|document\.cookie" server/src/ components/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v __tests__
```

### 6.1 Auth Pattern Consistency (Positive Verification)
**CRITICAL RULE:** Never flag a finding based on assumption alone. After scanning for anti-patterns, you MUST positively verify the correct pattern exists. A zero-result anti-pattern scan does NOT mean the feature is broken — it may mean it was already fixed or never had the problem.

**Step A — Verify all `fetch()` calls to `/api/` endpoints in frontend components include auth:**
```bash
# Find all raw fetch() calls to /api/ in components (not going through a centralized service)
grep -rn "fetch('/api/\|fetch(\"/api/\|fetch(\`/api/" components/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v __tests__ > /tmp/audit_raw_fetches.txt

# Check each one has credentials: 'include' (for httpOnly cookie auth)
while IFS= read -r line; do
  FILE=$(echo "$line" | cut -d: -f1)
  LINE_NUM=$(echo "$line" | cut -d: -f2)
  # Read surrounding 5 lines to check for credentials: 'include'
  HAS_CREDS=$(sed -n "$((LINE_NUM-2)),$((LINE_NUM+5))p" "$FILE" | grep -c "credentials.*include")
  if [ "$HAS_CREDS" -eq 0 ]; then
    echo "⚠️ MISSING credentials: $line"
  fi
done < /tmp/audit_raw_fetches.txt
```

**Step B — Verify centralized API service handles auth correctly (if one exists):**
```bash
# Check if there's a centralized API service that wraps fetch
grep -rn "credentials.*include\|withCredentials.*true" services/api.ts services/api.js src/services/api.ts 2>/dev/null
# If found, verify components import from it rather than using raw fetch
grep -rn "import.*from.*services/api" components/ --include="*.ts" --include="*.tsx" | wc -l
```

**Step C — Cross-reference: For any feature flagged as "auth broken", VERIFY by reading the actual code:**
```bash
# DO NOT report a feature as broken based solely on pattern-matching assumptions.
# For every auth-related finding, you MUST:
# 1. Read the actual component file
# 2. Find the actual fetch/API call
# 3. Verify whether it uses credentials: 'include' OR imports from a centralized API service
# 4. Only flag as broken if BOTH raw fetch without credentials AND no centralized service import
```

**Verdict logic:**
- Anti-pattern grep returns results → **CRITICAL** finding (bad pattern exists)
- Anti-pattern grep returns zero AND positive verification passes → **PASS** (correct pattern confirmed)
- Anti-pattern grep returns zero AND positive verification fails → **HIGH** finding (auth missing entirely)
- Anti-pattern grep returns zero AND no fetch calls found → **INVESTIGATE** (feature may use a different pattern)

### 7. Stub Detection
Search for placeholder patterns that indicate non-functional code:
```bash
grep -rn "Placeholder\|TODO.*implement\|not yet implemented\|console.log.*requires manual\|status: .success.*\/\/ " server/src/ --include="*.ts" | grep -v node_modules | grep -v __tests__
```

### 8. Runtime Boot Verification (Boot Gate)
Before reporting ANY runtime results, verify servers are live. This step validates that Phase 0.5 boot checks passed and runtime phases can be trusted.

```bash
# Quick liveness re-check before runtime results section
BACKEND=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health --max-time 5)
FRONTEND=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ --max-time 5)
DB_OK=$(cd server && node -e "
  require('dotenv').config();
  const { Pool } = require('pg');
  const url = process.env.DATABASE_URL || '';
  const ssl = url.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined;
  const pool = new Pool({ connectionString: url, ssl });
  pool.query('SELECT 1').then(() => { console.log('OK'); pool.end(); }).catch(() => { console.log('FAIL'); process.exit(1); });
" 2>/dev/null)

echo "Boot Gate Check:"
echo "  Backend:  ${BACKEND} (need 200)"
echo "  Frontend: ${FRONTEND} (need 200)"
echo "  Database: ${DB_OK} (need OK)"

if [ "$BACKEND" != "200" ] || [ "$DB_OK" != "OK" ]; then
  echo ""
  echo "❌ BOOT GATE FAILED — All runtime phases (4F, 5D.1, 6I, 7B.1, 8K.1-8K.3, 9A-9D) must be marked SKIPPED"
  echo "   Do NOT omit runtime results silently — report each as:"
  echo "   STATUS: SKIPPED — Backend/DB not available for runtime testing"
fi
if [ "$FRONTEND" != "200" ]; then
  echo "⚠️  Frontend down — phases 9A-9D (Playwright) must be marked SKIPPED"
fi
```

**CRITICAL RULE:** If boot gate fails, the audit report MUST include a section listing every runtime phase as SKIPPED with the reason. Silent omission of runtime results is an audit failure.

### 9. Runtime Infrastructure Connectivity
Static analysis cannot verify runtime connectivity. The `pg` library ignores libpq URL params like `sslmode`; Prisma adapter layers may not propagate SSL config. These issues are **invisible** to code review but cause immediate production failures.

```bash
# Test actual DB connection (adapt to detected stack)
cd server && node -e "
  require('dotenv').config();
  const { Pool } = require('pg');
  const url = process.env.DATABASE_URL || '';
  const ssl = url.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined;
  const pool = new Pool({ connectionString: url, ssl });
  pool.query('SELECT 1')
    .then(() => { console.log('✅ DB connection OK'); pool.end(); })
    .catch(e => { console.error('❌ DB connection FAILED:', e.message); process.exit(1); });
"
```

Additionally, verify that connection pool constructors explicitly handle SSL when the URL contains `sslmode`:
```bash
# CRITICAL if pg.Pool has no ssl option but DATABASE_URL has sslmode=require
grep -B2 -A10 "new pg.Pool\|new Pool(" server/src/ -rn --include="*.ts" --include="*.js"
```

Any `Pool()` constructor without an explicit `ssl` property when `DATABASE_URL` has `sslmode=require` is a **CRITICAL** finding — the connection WILL fail at runtime despite looking correct in code review.

This verification extends to all external services: Stripe, SendGrid, S3, Redis, etc. Make a lightweight authenticated call to each and confirm a non-error response. Invalid/expired credentials that pass static checks are caught here.

### 10. Score Calculation
The final score MUST be calculated from the verified findings, not estimated. Use this formula:
- Start at 100
- Critical: -10 per finding
- High: -5 per finding
- Medium: -2 per finding
- Low: -1 per finding
- Info: -0.25 per finding
- Minimum score: 0

### DETERMINISTIC SCORING FORMULAS (v2 — Replaces Subjective Estimates)

**Scores MUST be computed from these formulas. Show ALL inputs and calculations so the user can verify.**

**Build & Compile (10%):**
`tsc_score = (errors==0) ? 100 : max(0, 100-(errors*2))` | `lint_score = (errors==0) ? 100 : max(0, 100-(errors*0.5))` | `dep_score = 100 - (fixable_critical*20) - (fixable_high*10) - (fixable_moderate*3)` (unfixable vulns from `.claude/audit-exclusions.json` don't count) | `build = tsc*0.4 + lint*0.3 + dep*0.3`

**Code Quality (15%):** `100 - (production_gaps * 5)` — Only PRODUCTION_GAP classifications reduce score. FALSE_POSITIVE/INTENTIONAL_FEATURE/DEV_FALLBACK do NOT.

**Feature Completeness (25%):** `effective_total = total - intentional_static` (from `.claude/CLAUDE.md`) | `score = (fully_wired*100 + wired_with_fallback*75 + partially_wired*50) / effective_total` — v3: PARTIALLY_WIRED components now score 50% (components with API calls but persistent DEFAULT_/DEMO_ static data). STATIC_ONLY components score 0%.

**Application Logic (15%):** `(validated/total*40) + (error_handled/total*30) + (transacted/multi_write*30)`

**Security (20%):** `max(0, 100 - (critical*25) - (high*10) - (medium*3))` — Only verified PRODUCTION_GAP findings count.

**Deployment (15%):** Binary checklist of 15 items (health, shutdown, error handler, body limits, CORS, rate limit, logging, error tracking, pooling, env validation, CI, SAST, dep scan, container scan, secret scan). `score = items/15 * 100`

**Overall:** `build*0.10 + quality*0.15 + feature*0.25 + logic*0.15 + security*0.20 + deploy*0.15`

**Show the full calculation in the report with actual numbers.**
