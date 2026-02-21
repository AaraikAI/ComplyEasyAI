---
name: production-readiness-audit
description: Perform a deep, exhaustive forensic scan of an entire codebase to produce a complete production-readiness report. Use this skill whenever the user wants to audit a codebase for production readiness, find all issues blocking deployment, scan for mocks/stubs/TODOs/incomplete implementations, verify full-stack feature completeness (UI → API → DB), check deployment configuration, or generate a prioritized fix list. Also trigger when the user says things like "is my app ready for production", "audit my code", "find all issues", "what's left to finish", "deployment blockers", "forensic scan", "production gaps", "codebase health check", or "readiness report". This skill is specifically designed to catch EVERYTHING in a single pass — no truncation, no sampling, no incremental discovery. If the user has been running repeated scans and finding new issues each time, this skill solves that problem.
---

# Production Readiness Audit — Deep Forensic Scan

## Why This Skill Exists

The #1 problem with codebase audits is **incremental discovery** — you scan, fix, re-scan, and find MORE issues that should have been caught the first time. This happens because of:

1. **Truncated output** — using `head -N` or `tail -N` cuts off findings
2. **Hidden dependency chains** — fixing file A reveals that file B (which imports A) was also broken
3. **Shallow pattern matching** — grep finds the keyword but doesn't verify the surrounding context
4. **Missing layers** — scanning code files but not checking if the DB schema, env vars, or deployment config match

This skill eliminates all four problems by using **exhaustive collection → dependency tracing → contextual verification → structured reporting**.

## Core Principles

1. **NEVER truncate.** No `head`, `tail`, or `| head -N` on any scan output. Capture everything to temp files and process the full set.
2. **Trace dependency chains.** When you find an issue in file A, check every file that imports A.
3. **Verify context.** For every grep match, read 15+ lines of surrounding code before classifying.
4. **Detect the stack.** Don't assume React/Node/Supabase — discover what's actually there and adapt.
5. **One pass, zero surprises.** The user should be able to fix everything in this report and have a production-ready app.

---

## Execution Flow

### PHASE 0: STACK DETECTION & CODEBASE MAPPING

Before scanning anything, understand what you're auditing. Run these discovery steps and save results to temp files for reference throughout the audit.

#### 0A: Detect Project Structure
```bash
# Map the entire source tree (NO truncation)
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.py" -o -name "*.go" -o -name "*.rs" -o -name "*.java" -o -name "*.rb" -o -name "*.php" -o -name "*.vue" -o -name "*.svelte" \) \
  | grep -v node_modules | grep -v dist | grep -v build | grep -v __pycache__ | grep -v .venv | grep -v target \
  | grep -v ".test." | grep -v ".spec." | grep -v "__tests__" \
  | sort > /tmp/audit_all_source.txt

wc -l /tmp/audit_all_source.txt
cat /tmp/audit_all_source.txt
```

#### 0B: Detect Stack & Frameworks
```bash
# Package managers and dependency files
find . -maxdepth 3 \( -name "package.json" -o -name "requirements.txt" -o -name "Pipfile" -o -name "pyproject.toml" -o -name "go.mod" -o -name "Cargo.toml" -o -name "Gemfile" -o -name "pom.xml" -o -name "build.gradle" -o -name "composer.json" \) | grep -v node_modules

# Detect frameworks from dependencies
for pkg in $(find . -name "package.json" -not -path "*/node_modules/*" -maxdepth 3); do
  echo "=== $pkg ==="
  cat "$pkg" | grep -E '"(react|next|vue|svelte|angular|express|fastify|nest|hono|koa|prisma|drizzle|supabase|firebase|django|flask|fastapi|rails)"' 2>/dev/null
done

# Detect database layer
find . -name "*.prisma" -o -name "schema.prisma" -o -name "drizzle.config.*" -o -name "knexfile.*" -o -name "ormconfig.*" -o -name "*.sql" -o -name "alembic.ini" | grep -v node_modules | sort

# Detect deployment config
find . \( -name "Dockerfile*" -o -name "docker-compose*" -o -name "fly.toml" -o -name "vercel.json" -o -name "netlify.toml" -o -name "railway.json" -o -name "render.yaml" -o -name "*.yaml" -o -name "*.yml" \) | grep -v node_modules | grep -v ".github" | sort

# Environment files
find . -name ".env*" -o -name "*.env.example" | grep -v node_modules | sort
```

#### 0C: Identify All Entry Points & Build Scripts
```bash
# All package.json scripts
for pkg in $(find . -name "package.json" -not -path "*/node_modules/*" -maxdepth 3); do
  echo "=== $pkg scripts ==="
  cat "$pkg" | python3 -c "import sys,json; scripts=json.load(sys.stdin).get('scripts',{}); [print(f'  {k}: {v}') for k,v in scripts.items()]" 2>/dev/null || \
  cat "$pkg" | grep -A 50 '"scripts"' | head -60
done
```

Based on what you discover, build a **Stack Profile** that you'll reference throughout:
- **Frontend**: framework, router, state management
- **Backend**: framework, ORM, API style (REST/GraphQL/tRPC)
- **Database**: type (Postgres/MySQL/SQLite/MongoDB), ORM, migration tool
- **Auth**: provider (Supabase Auth, Clerk, NextAuth, custom JWT, etc.)
- **Deployment**: target platform, containerization
- **Layers present**: [UI, API, DB, Auth, AI, Storage, Realtime, etc.]

Adapt ALL subsequent phases to scan only layers that actually exist. Skip irrelevant checks.

---

### PHASE 1: BUILD & COMPILATION VERIFICATION

Run every build/compile/lint command relevant to the detected stack. Capture FULL output — no truncation.

#### For TypeScript/JavaScript projects:
```bash
# Find all tsconfig files and run tsc against each
for tsconfig in $(find . -name "tsconfig.json" -not -path "*/node_modules/*" -maxdepth 3); do
  dir=$(dirname "$tsconfig")
  echo "=== TypeScript check: $dir ==="
  cd "$dir" && npx tsc --noEmit 2>&1 | tee /tmp/audit_tsc_$(echo "$dir" | tr '/' '_').txt
  echo "ERROR COUNT: $(grep -c 'error TS' /tmp/audit_tsc_$(echo "$dir" | tr '/' '_').txt)"
  cd - > /dev/null
done

# Lint (find eslint config to know which dirs to lint)
# Adapt based on what eslint config exists
npx eslint . --ext .ts,.tsx,.js,.jsx 2>&1 | tee /tmp/audit_eslint.txt
echo "LINT ERRORS: $(grep -c 'error' /tmp/audit_eslint.txt)"

# Dependency audit
npm audit 2>&1 | tee /tmp/audit_npm.txt
```

#### For Python projects:
```bash
# Type checking
mypy . 2>&1 | tee /tmp/audit_mypy.txt
# or: pyright . 2>&1 | tee /tmp/audit_pyright.txt

# Lint
ruff check . 2>&1 | tee /tmp/audit_ruff.txt
# or: flake8 . 2>&1 | tee /tmp/audit_flake8.txt

# Dependency audit
pip-audit 2>&1 | tee /tmp/audit_pip.txt
# or: safety check 2>&1
```

Adapt similarly for Go (`go vet`, `golangci-lint`), Rust (`cargo check`, `cargo clippy`), etc.

**Report every single error. Do not summarize. Do not say "and N more".**

---

### PHASE 2: EXHAUSTIVE PATTERN SCAN

This is the heart of the audit. The critical difference from a naive grep scan: **capture ALL results to files first, then process every single one.**

Read the pattern reference file for the complete set of patterns:
→ **`references/scan-patterns.md`** contains all grep/search patterns organized by category.

For EVERY pattern category, follow this process:

1. **Run the grep/search and save ALL results to a temp file** (no `head`, no `tail`)
2. **Count the results** — record total for the final report
3. **For each result**, read 15+ lines above and below the match in the actual source file
4. **Classify each result** as one of:
   - `INTENTIONAL_FEATURE` — This is real functionality (simulation engines, test generators, red team tools, ML randomness, placeholder UI text that IS the feature)
   - `DEV_FALLBACK` — Has a production guard (`process.env.NODE_ENV`, feature flag, config switch) — acceptable but note it
   - `PRODUCTION_GAP` — Missing real implementation, needs a fix before production
   - `FALSE_POSITIVE` — The grep matched but the context shows it's fine (e.g., "mock" in a variable name like `mockup_design`, or "TODO" in a comment about a completed item)

**Never classify without reading the surrounding code.** The same keyword can be any of the four depending on context.

---

### PHASE 3: DEPENDENCY CHAIN TRACING

This phase catches the issues that incremental scanning misses. For every `PRODUCTION_GAP` found in Phase 2:

1. **Find all files that import/require the affected file**
   ```bash
   # For JS/TS
   grep -rn "from.*['\"].*AFFECTED_MODULE" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | grep -v node_modules
   
   # For Python
   grep -rn "from.*AFFECTED_MODULE.*import\|import.*AFFECTED_MODULE" --include="*.py" | grep -v __pycache__
   ```

2. **Check if the importing files handle the gap** — Do they have fallback logic? Do they check for null/undefined returns from the broken function? Or do they blindly trust the output?

3. **Follow the chain upward** — If an importing file is also broken, find ITS importers. Continue until you reach a route handler, page component, or entry point.

4. **Record the full impact chain** for each gap:
   ```
   GAP: server/services/billing.ts:45 — calculateInvoice() returns mock data
   IMPACTS:
   ├── server/controllers/billing.controller.ts:23 — calls calculateInvoice(), passes result to response
   ├── server/routes/billing.routes.ts:12 — exposes POST /api/billing/invoice
   └── frontend/pages/Billing.tsx:67 — displays invoice data from API
   FULL STACK AFFECTED: UI → API → Service → (DB missing)
   ```

This ensures that when the user fixes a gap, they also fix every file in the chain — no surprise breakages on the next scan.

---

### PHASE 4: FULL-STACK FEATURE VERIFICATION

For EVERY feature/route in the application, trace the complete stack and verify each layer.

#### 4A: Discover All Routes/Features
```bash
# Frontend routes (adapt based on detected framework)
# React Router
grep -rn "path=" --include="*.tsx" --include="*.jsx" --include="*.ts" --include="*.js" | grep -v node_modules | grep -v test
# Next.js — list the app/ or pages/ directory structure
find app/ pages/ -type f 2>/dev/null | grep -v node_modules | sort
# Vue Router
grep -rn "path:" --include="*.vue" --include="*.ts" --include="*.js" | grep -v node_modules
# Backend routes
grep -rn "router\.\(get\|post\|put\|patch\|delete\)\|app\.\(get\|post\|put\|patch\|delete\)\|@Get\|@Post\|@Put\|@Delete\|@app\.route\|@router\." --include="*.ts" --include="*.js" --include="*.py" | grep -v node_modules | grep -v test
```

#### 4B: For Each Feature, Verify All Layers

For every route/feature discovered, check:

| Layer | What to verify |
|-------|---------------|
| **UI/Page** | Component exists, renders real data (not static/mock), handles loading/error states, calls real API |
| **API Route/Controller** | Endpoint exists, validates input, calls real service layer, returns proper response codes, has error handling |
| **Service/Business Logic** | Function exists, contains real logic (not stub/mock), handles edge cases, has proper error handling |
| **Database/Data Layer** | Query exists, table/collection exists, schema matches what the code expects, migrations are up to date |
| **Auth/Permissions** | Route is protected if it should be, RLS policies exist, role checks are in place |

Record the completion percentage per layer per feature. A feature is only "100% complete" if ALL present layers are fully implemented.

---

### PHASE 5: DEPLOYMENT & INFRASTRUCTURE CHECKS

Check everything needed for the app to actually run in production:

```bash
# Health/readiness endpoints
grep -rn "health\|/ping\|/status\|readiness\|liveness" --include="*.ts" --include="*.js" --include="*.py" | grep -v node_modules | grep -v test

# CORS configuration
grep -rn "cors\|CORS\|Access-Control" --include="*.ts" --include="*.js" --include="*.py" | grep -v node_modules | grep -v test

# Rate limiting
grep -rn "rateLimit\|rate.limit\|throttle\|RateLimiter" --include="*.ts" --include="*.js" --include="*.py" | grep -v node_modules | grep -v test

# Security headers (helmet, CSP, etc.)
grep -rn "helmet\|contentSecurityPolicy\|X-Frame-Options\|X-Content-Type" --include="*.ts" --include="*.js" | grep -v node_modules

# Global error handling
grep -rn "errorHandler\|error.*middleware\|app\.use.*err\|exception_handler\|@app\.exception" --include="*.ts" --include="*.js" --include="*.py" | grep -v node_modules | grep -v test

# Database connection pooling / retry
grep -rn "pool\|retry\|reconnect\|connectionLimit\|max_connections" --include="*.ts" --include="*.js" --include="*.py" | grep -v node_modules | grep -v test

# Graceful shutdown
grep -rn "SIGTERM\|SIGINT\|graceful.*shutdown\|beforeExit\|on_shutdown" --include="*.ts" --include="*.js" --include="*.py" | grep -v node_modules

# Logging (structured logging vs console.log)
grep -rn "console\.log\|console\.warn\|console\.error\|print(" --include="*.ts" --include="*.js" --include="*.py" | grep -v node_modules | grep -v test | grep -v __pycache__ > /tmp/audit_console_logs.txt
wc -l /tmp/audit_console_logs.txt

# Environment variable completeness
grep -rn "process\.env\.\|os\.environ\|os\.getenv\|env\." --include="*.ts" --include="*.js" --include="*.py" | grep -v node_modules | grep -v test | sed 's/.*\(process\.env\.[A-Z_a-z0-9]*\|os\.environ\[.[A-Z_a-z0-9]*.\]\|os\.getenv(.[A-Z_a-z0-9]*.\)\).*/\1/' | sort | uniq > /tmp/audit_env_vars_used.txt
cat .env.example 2>/dev/null || cat .env.local.example 2>/dev/null || echo "NO .env.example FOUND"
# Compare: which env vars are used in code but missing from .env.example?
```

Also check:
- **Missing indexes** — Are queries filtering on columns without indexes?
- **N+1 queries** — Are there loops that make individual DB calls instead of batch queries?
- **Secrets in code** — Any hardcoded API keys, tokens, passwords (not from env vars)?
- **Localhost/hardcoded URLs** — Any `http://localhost` or `127.0.0.1` without env var fallback?

---

### PHASE 6: REPORT GENERATION

Produce a comprehensive markdown report. This is the deliverable the user will work from to fix everything, so **completeness and clarity of fix instructions are paramount**.

Save the report as a markdown file in the project root: `PRODUCTION_READINESS_REPORT.md`

Use this exact structure:

```markdown
# Production Readiness Report
**Project:** [name]
**Stack:** [detected stack profile]
**Scanned:** [date] | **Files scanned:** [N] | **Total findings reviewed:** [N]

---

## SECTION 1: BUILD STATUS

| Check | Status | Error Count | Details |
|-------|--------|-------------|---------|
| [Language] Type Check | ✅ PASS / ❌ FAIL | N | [tsconfig/mypy target] |
| Linting | ✅ PASS / ❌ FAIL | N | [linter used] |
| Dependency Audit | ✅ PASS / ❌ FAIL | N critical, N high | |
| Build/Compile | ✅ PASS / ❌ FAIL | N | |

### Full Error Listing
[Every single compile error and lint error — no truncation]

---

## SECTION 2: PRODUCTION GAPS — CRITICAL (Blocks Deployment)

For each PRODUCTION_GAP finding:

### Gap #N: [Short descriptive title]
- **File:** `exact/path/to/file.ts`
- **Line:** N
- **Code:**
  ```[lang]
  [exact code snippet, 5-10 lines showing the problem]
  ```
- **Issue:** [Clear explanation of what's wrong]
- **Impact Chain:**
  - [file that imports this] → [file that imports that] → [route/page affected]
- **Fix Required:**
  ```[lang]
  [Exact code that needs to be written/changed — not pseudocode, not "implement X",
   but the actual implementation or a detailed enough specification that a developer
   or Claude Code agent can implement it without guessing]
  ```
- **Fix Complexity:** Small / Medium / Large
- **Severity:** Critical / High / Medium

---

## SECTION 3: FEATURES — FULL STACK STATUS

### ✅ Features Confirmed 100% Production Ready
[Only features where ALL layers are fully implemented with zero gaps]

### ⚠️ Features Partially Complete
| Feature/Route | UI | API | Service | DB | Auth | Blocking Issues |
|--------------|-----|-----|---------|-----|------|-----------------|
| /dashboard   | 90% | 100%| 80%    | 100%| ✅   | Service returns mock analytics |

### ❌ Features Not Started or Skeleton Only
[List with file paths where stubs were found]

---

## SECTION 4: DEPLOYMENT BLOCKERS

[Everything that would cause the app to fail in production even if all code gaps were fixed]
- Missing env vars not in .env.example
- Missing health check endpoints
- Missing CORS configuration
- Missing global error handler
- Missing graceful shutdown
- Hardcoded localhost URLs
- Missing rate limiting
- Missing security headers
- Unrun database migrations
- Missing RLS policies (for Supabase)
- Missing indexes for filtered queries

---

## SECTION 5: CODE QUALITY ISSUES

[Non-blocking but should be fixed]
- Console.log statements in production code (count + locations)
- Empty catch blocks
- TODO/FIXME comments (with context — are they real TODOs or outdated?)
- Unused imports/variables
- Missing input validation

---

## SECTION 6: FINAL SCORECARD

| Metric | Value |
|--------|-------|
| Total source files scanned | N |
| Total grep findings reviewed | N |
| INTENTIONAL_FEATURE | N |
| DEV_FALLBACK | N |
| PRODUCTION_GAP | N |
| FALSE_POSITIVE | N |
| Features 100% complete | N / TOTAL |
| Features partially complete | N / TOTAL |
| Features not started | N / TOTAL |
| Deployment blockers | N |
| **Overall Production Readiness** | **X%** |

---

## SECTION 7: PRIORITIZED FIX LIST

Ordered by severity, then by dependency (fix prerequisites first).

| # | Severity | File | Issue | Fix Complexity | Depends On |
|---|----------|------|-------|---------------|------------|
| 1 | Critical | path/to/file.ts:45 | Description | Medium | — |
| 2 | Critical | path/to/other.ts:12 | Description | Small | Fix #1 |
| ...| | | | | |

For each fix, include the fix number referenced back to Section 2 where the full details and fix instructions live.
```

---

## Key Reminders

- **Completeness over speed.** It is far better to take 30 minutes and catch everything than to take 10 minutes and miss things that cause another scan cycle.
- **Fix instructions must be implementable.** A developer or Claude Code agent should be able to read your fix description and execute it without additional research. Include actual code, actual SQL, actual config — not "implement proper error handling" but the actual error handling code.
- **Dependency ordering matters.** If Gap #3 depends on Gap #1 being fixed first, say so. The prioritized fix list should be ordered so the user can work top to bottom.
- **Re-read after drafting.** Before presenting the report, re-read it and ask: "If I fixed everything listed here, would there be ANY surprises on a re-scan?" If yes, you missed something — go find it.
- **Adapt to the stack.** Not every project has a frontend. Not every project has a database. Not every project uses TypeScript. Scan what exists, skip what doesn't. But for what DOES exist, be exhaustive.
