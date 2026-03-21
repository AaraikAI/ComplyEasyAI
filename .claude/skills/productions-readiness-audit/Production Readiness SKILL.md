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
  | grep -v ".test." | grep -v ".spec." | grep -v "__tests__" \
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

**5B: State Management Audit**
- Frontend: All stateful interactions managed (loading, error, success, empty, stale)
- Backend: Server state consistent (session management, cache invalidation, race conditions)
- Stale data: Does UI re-fetch after mutations? Are optimistic updates rolled back on failure?

**5C: Data Validation Pipeline**
- Frontend: Forms validated before submission, errors displayed to users
- API: Every endpoint validates input schema (zod, joi, pydantic, etc.)
- DB: NOT NULL, UNIQUE, CHECK, FOREIGN KEY constraints enforced
- Cross-layer consistency: Frontend rules match API rules match DB constraints

**5D: Error Propagation & User Feedback**
- DB failure → API error response → UI error message (full chain works)
- Error messages user-friendly (not raw stack traces)
- All async operations have timeout handling
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

**6C: Data Protection**
- Passwords hashed with bcrypt/argon2 (not MD5/SHA1)
- HTTPS enforced, API calls use TLS
- PII minimized, data retention considered
- Secrets in code: Hardcoded API keys, tokens, passwords, connection strings

**6D: Input Security (OWASP Top 10)**
- SQL injection: Raw string concatenation in queries
- XSS: User input sanitized before rendering, CSP headers set
- CSRF: State-changing requests protected
- Path traversal: File paths validated
- Mass assignment: Request bodies filtered to allowed fields
- Rate limiting on auth endpoints and public APIs
- Security headers: helmet/CSP/X-Frame-Options/HSTS/X-Content-Type-Options

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
