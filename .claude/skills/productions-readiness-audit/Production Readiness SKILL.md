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

## Audit Domains & Phases

| Domain | Phases | What It Covers |
|--------|--------|---------------|
| **Foundation** | 0-2 | Stack detection, build verification, exhaustive pattern scan with AST semantic resolution |
| **Feature Completeness** | 3-4 | Dependency chain tracing, full-stack feature verification, data flow, property-based testing |
| **Application Logic** | 5 | Business rules, validation, state management, error propagation |
| **Security & Red Teaming** | 6-7 | Auth flows, OWASP checks, secrets, API security, data protection, autonomous fuzzing |
| **Infrastructure & Chaos** | 8 | Deployment hardening, monitoring, scaling, CI/CD, disaster recovery, chaos protocols |
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

**4C: Data flow integrity** — For each feature, trace data from UI form → API request → service → DB write → DB read → API response → UI render. Verify field names, types, and transformations are consistent across all layers.

**4D: API contract validation** — Do frontend API calls match what backend actually accepts/returns? Check request bodies, query params, response shapes, error formats.

**4E: Navigation & routing completeness** — Every menu item links to a real page. Every page is reachable. No dead routes. Auth redirects work.

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
