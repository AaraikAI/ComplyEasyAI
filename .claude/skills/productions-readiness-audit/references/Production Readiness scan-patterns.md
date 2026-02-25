# Scan Patterns Reference

This file contains ALL grep/search patterns to run during Phase 2 of the audit. For every category, run the patterns against ALL source files (from `/tmp/audit_all_source.txt`) and save FULL output to temp files. **Never truncate.**

The variable `$SRC` below refers to all source directories relevant to the detected stack. Build this dynamically in Phase 0 — don't hardcode directory names.

```bash
# Build $SRC dynamically from discovered source directories
# Example for a typical JS/TS project:
SRC=$(find . -type d -maxdepth 2 \
  -not -path "*/node_modules/*" -not -path "*/.git/*" \
  -not -path "*/dist/*" -not -path "*/build/*" \
  -not -path "*/__pycache__/*" -not -path "*/.venv/*" \
  -not -path "*/target/*" -not -name ".*" \
  | tr '\n' ' ')

# Build extension filter dynamically based on detected stack
# Example: EXT="--include=*.ts --include=*.tsx"
```

---

## Category A: Simulation / Mock / Fake Data

These patterns catch code that simulates real behavior instead of implementing it.

```bash
# A1: Direct simulation keywords
grep -rn $EXT -i "simulat[^o]" $SRC | grep -v node_modules | grep -v "\.test\." | grep -v "\.spec\." | grep -v dist > /tmp/audit_A1.txt

# A2: Mock (excluding test files)
grep -rn $EXT -i "\bmock\b" $SRC | grep -v node_modules | grep -v "\.test\." | grep -v "\.spec\." | grep -v dist | grep -v __tests__ > /tmp/audit_A2.txt

# A3: Stub
grep -rn $EXT -i "\bstub\b" $SRC | grep -v node_modules | grep -v "\.test\." | grep -v "\.spec\." | grep -v dist > /tmp/audit_A3.txt

# A4: Dummy / fake / hardcoded data
grep -rn $EXT -i "dummy\|fake.data\|fakeData\|hardcoded\|hard.coded\|sample.data\|sampleData" $SRC | grep -v node_modules | grep -v "\.test\." | grep -v dist > /tmp/audit_A4.txt

# A5: Placeholder content
grep -rn $EXT -i "placeholder\|lorem ipsum" $SRC | grep -v node_modules | grep -v dist > /tmp/audit_A5.txt

# A6: Static/inline data arrays that look like they should come from a DB
grep -rn $EXT "const.*=.*\[" $SRC | grep -v node_modules | grep -v test | grep -v dist | grep -v "import\|require\|type\|interface\|enum" > /tmp/audit_A6.txt
# (Review A6 carefully — many are legitimate. Flag only large data arrays in service/controller files)

# A7: Math.random() in business logic (not in test/seed files)
grep -rn $EXT "Math\.random()\|random\.\|randint\|secrets\." $SRC | grep -v node_modules | grep -v test | grep -v seed | grep -v dist > /tmp/audit_A7.txt
```

**Context verification for Category A:** For each match, check:
- Is this in a simulation engine that IS the product feature? → INTENTIONAL_FEATURE
- Is this behind a `NODE_ENV` or feature flag check? → DEV_FALLBACK  
- Is this in a service/controller that should be hitting a real API/DB? → PRODUCTION_GAP
- Is "mock" part of a word like "mockup" or a UI component name? → FALSE_POSITIVE

---

## Category B: Incomplete / Deferred Implementation

```bash
# B1: TODO / FIXME / HACK markers
grep -rn $EXT "TODO\|FIXME\|HACK\|XXX\|TEMP\b\|@todo\|@fixme\|@hack" $SRC | grep -v node_modules | grep -v "\.test\." > /tmp/audit_B1.txt

# B2: Natural language deferral
grep -rn $EXT -i "for now\|for the moment\|temporarily\|coming soon\|not yet\|to be implemented\|tbd\b\|wip\b\|later\b.*implement\|skip.*for now" $SRC | grep -v node_modules | grep -v "\.test\." > /tmp/audit_B2.txt

# B3: Hypothetical/future language ("would" pattern)
grep -rn $EXT -i "would use\|would be\|would call\|would fetch\|would send\|would connect\|would query\|would create\|would implement\|would integrate\|would store\|would return\|should eventually\|will eventually\|need to implement\|needs to be\|needs implementation" $SRC | grep -v node_modules | grep -v "\.test\." > /tmp/audit_B3.txt

# B4: Production reference comments (code that knows it's not production-ready)
grep -rn $EXT -i "in production\|in a real\|real implementation\|real environment\|production would\|when deployed\|once we have\|when.*is ready\|production.ready\|prod.version" $SRC | grep -v node_modules | grep -v "\.test\." > /tmp/audit_B4.txt

# B5: Commented-out code blocks (often indicates unfinished work)
grep -rn $EXT "^[[:space:]]*\/\/" $SRC | grep -v node_modules | grep -v test > /tmp/audit_B5_raw.txt
# B5 generates too many results — instead, look for commented-out function calls and imports:
grep -rn $EXT "\/\/.*import\|\/\/.*require\|\/\/.*fetch\|\/\/.*await\|\/\/.*return\|#.*import\|#.*def " $SRC | grep -v node_modules | grep -v test > /tmp/audit_B5.txt
```

**Context verification for Category B:** For each match:
- Is the TODO in a comment about something already done? (e.g., "TODO: done in PR #123") → FALSE_POSITIVE
- Is "coming soon" a UI label for a feature that's intentionally gated? → Check with user, likely INTENTIONAL_FEATURE or DEV_FALLBACK
- Is the "would" language in a code comment explaining design decisions? → FALSE_POSITIVE
- Is it in active business logic marking something unfinished? → PRODUCTION_GAP

---

## Category C: Not Implemented / Throw Guards

```bash
# C1: Explicit not-implemented markers
grep -rn $EXT -i "not.implemented\|NotImplemented\|NOT_IMPLEMENTED\|raise NotImplementedError\|throw.*not.*implemented" $SRC | grep -v node_modules > /tmp/audit_C1.txt

# C2: Throw guards for missing implementation
grep -rn $EXT "throw new Error.*[Ii]mplement\|throw new Error.*[Nn]ot\|throw new Error.*[Tt]odo\|throw new Error.*missing\|raise.*Error.*implement\|raise.*Error.*todo\|panic!.*implement\|unimplemented!()" $SRC | grep -v node_modules | grep -v "\.test\." > /tmp/audit_C2.txt
```

---

## Category D: Empty / Stub Functions

```bash
# D1: Functions that return empty/null immediately
grep -rn $EXT "return {};\|return \[\];\|return null;\|return undefined;\|return;\b\|return None\|return {}\|return \[\]" $SRC | grep -v node_modules | grep -v "\.test\." | grep -v dist > /tmp/audit_D1.txt

# D2: Empty async functions / empty function bodies
grep -rn $EXT -P "(?:async\s+)?\w+\s*\([^)]*\)\s*(?::\s*\w+)?\s*\{\s*\}" $SRC | grep -v node_modules | grep -v test 2>/dev/null > /tmp/audit_D2.txt
# Fallback if PCRE not available:
grep -rn $EXT "() {}" $SRC | grep -v node_modules | grep -v test > /tmp/audit_D2.txt 2>/dev/null

# D3: Functions with only a console.log (stub with logging)
grep -rn $EXT -A2 "function\|const.*=.*=>\|def " $SRC | grep -v node_modules | grep -v test | grep -B1 "console\.log\|print(" > /tmp/audit_D3.txt

# D4: Pass-only functions (Python)
grep -rn $EXT -A1 "def " $SRC | grep -v node_modules | grep -v test | grep "pass$\|pass #\|\.\.\." > /tmp/audit_D4.txt
```

**Context verification for Category D:** `return null` and `return []` are often legitimate (e.g., "no results found" in a search function). Check if the function is supposed to do more work before returning. The key question: "Does this function ALWAYS return empty, or only in specific conditions?"

---

## Category E: Error Handling Gaps

```bash
# E1: Empty catch blocks
grep -rn $EXT "catch[[:space:]]*([^)]*)[[:space:]]*{[[:space:]]*}" $SRC | grep -v node_modules | grep -v test > /tmp/audit_E1.txt

# E2: Catch with only a comment (swallowed error)
grep -rn $EXT -A1 "catch[[:space:]]*(" $SRC | grep -v node_modules | grep -v test | grep -B1 "\/\/" | grep "catch" > /tmp/audit_E2.txt

# E3: Catch with only console.log (no rethrow, no user feedback)
grep -rn $EXT -A2 "catch[[:space:]]*(" $SRC | grep -v node_modules | grep -v test | grep -B1 "console\.\(log\|error\|warn\)" | grep "catch" > /tmp/audit_E3.txt

# E4: Missing try/catch around async operations
grep -rn $EXT "await " $SRC | grep -v node_modules | grep -v test | grep -v "try" > /tmp/audit_E4_candidates.txt
# For E4, verify by checking if the await is inside a try block — needs file-level context reading

# E5: Unhandled promise rejections
grep -rn $EXT "\.then(" $SRC | grep -v node_modules | grep -v test | grep -v "\.catch(" > /tmp/audit_E5.txt

# E6: Python bare except
grep -rn $EXT "except:" $SRC | grep -v node_modules | grep -v test > /tmp/audit_E6.txt
```

---

## Category F: Security Concerns

```bash
# F1: Hardcoded secrets/credentials (look for string literals after common secret keys)
grep -rn $EXT -i "api_key\|apikey\|api.key\|secret_key\|secretkey\|private_key\|privatekey\|password\|passwd\|auth_token\|access_token" $SRC | grep -v node_modules | grep -v test | grep -v ".env" | grep -v "process\.env\|os\.environ\|os\.getenv\|config\.\|Config\." > /tmp/audit_F1.txt

# F2: Hardcoded URLs / localhost in production code
grep -rn $EXT "localhost\|127\.0\.0\.1\|0\.0\.0\.0\|http://" $SRC | grep -v node_modules | grep -v test | grep -v "\.env\|process\.env\|os\.environ" > /tmp/audit_F2.txt

# F3: SQL injection risk (string concatenation in queries)
grep -rn $EXT "query.*\`\|query.*\+\|execute.*\+\|execute.*f\"\|\.raw(" $SRC | grep -v node_modules | grep -v test > /tmp/audit_F3.txt

# F4: Missing input validation on API endpoints
# (Check if request body/params are used without validation — needs context reading)
grep -rn $EXT "req\.body\|req\.params\|req\.query\|request\.json\|request\.form\|request\.args" $SRC | grep -v node_modules | grep -v test > /tmp/audit_F4_candidates.txt

# F5: CORS set to wildcard
grep -rn $EXT "origin.*\*\|Access-Control-Allow-Origin.*\*\|cors()" $SRC | grep -v node_modules | grep -v test > /tmp/audit_F5.txt

# F6: Disabled security features
grep -rn $EXT -i "verify.*false\|secure.*false\|rejectUnauthorized.*false\|SSL_VERIFY.*false\|check_hostname.*False" $SRC | grep -v node_modules | grep -v test > /tmp/audit_F6.txt
```

---

## Category G: Console/Debug Output in Production

```bash
# G1: Console statements in backend services/controllers
grep -rn $EXT "console\.log\|console\.warn\|console\.error\|console\.info\|console\.debug\|console\.trace" $SRC | grep -v node_modules | grep -v test | grep -v dist > /tmp/audit_G1.txt

# G2: Python print statements in production code
grep -rn $EXT "^\s*print(" $SRC | grep -v node_modules | grep -v test | grep -v __pycache__ > /tmp/audit_G2.txt

# G3: Debug flags left on
grep -rn $EXT -i "debug.*=.*true\|DEBUG.*=.*True\|verbose.*=.*true\|VERBOSE.*=.*True" $SRC | grep -v node_modules | grep -v test > /tmp/audit_G3.txt
```

---

## Category H: UI Completeness (only if frontend detected)

```bash
# H1: Coming soon / under construction UI text
grep -rn $EXT -i "coming soon\|under construction\|lorem ipsum\|placeholder text\|sample text\|example text\|TBD\|N/A.*placeholder" $SRC | grep -v node_modules | grep -v test > /tmp/audit_H1.txt

# H2: Loading-only components (show loading but never real content)
grep -rn $EXT -i "isLoading.*return null\|loading.*return null\|if.*loading.*return\b" $SRC | grep -v node_modules | grep -v test > /tmp/audit_H2.txt

# H3: Unconnected components (render static data, never fetch)
# Look for page/view components that don't have any useEffect, useSWR, useQuery, fetch, or API calls
# This requires file-level analysis — flag page components and verify they make API calls

# H4: Disabled buttons/features in UI
grep -rn $EXT "disabled.*true\|disabled={true}\|isDisabled\|cursor-not-allowed" $SRC | grep -v node_modules | grep -v test > /tmp/audit_H4.txt

# H5: Hardcoded data in page components (should come from API)
grep -rn $EXT "const.*data.*=.*\[{" $SRC | grep -v node_modules | grep -v test | grep -v dist > /tmp/audit_H5.txt
```

---

## Category I: Database & Schema (only if DB layer detected)

```bash
# I1: Missing migrations or schema mismatches
find . -name "*.sql" -o -name "migration*" -o -name "*.prisma" | grep -v node_modules | sort > /tmp/audit_I1.txt

# I2: Tables referenced in code — verify they exist
grep -rn $EXT "\.from(\|\.table(\|\.collection(\|@Table\|@Entity\|class.*Model\|__tablename__" $SRC | grep -v node_modules | grep -v test > /tmp/audit_I2.txt

# I3: Missing RLS policies (Supabase)
# If Supabase detected, check for RLS in migration files
grep -rn "ENABLE ROW LEVEL SECURITY\|CREATE POLICY\|alter table.*enable row level security" $(find . -name "*.sql" | grep -v node_modules) > /tmp/audit_I3.txt 2>/dev/null

# I4: Missing indexes on commonly filtered columns
grep -rn $EXT "\.where\|\.filter\|\.eq(\|\.match(\|\.findBy\|\.find(\|WHERE " $SRC | grep -v node_modules | grep -v test > /tmp/audit_I4.txt
# Cross-reference with migration files to check if indexes exist

# I5: N+1 query patterns (queries inside loops)
grep -rn $EXT -B5 "await.*\(select\|find\|query\|fetch\)" $SRC | grep -v node_modules | grep -v test | grep -B3 "for \|\.map(\|\.forEach(\|while " > /tmp/audit_I5.txt
```

---

## Category J: AI/ML Integration (only if AI features detected)

```bash
# J1: All AI/LLM references
grep -rn $EXT -i "openai\|anthropic\|claude\|gpt\|gemini\|llm\|langchain\|ai\.\|cohere\|hugging.face\|ollama\|replicate" $SRC | grep -v node_modules | grep -v test | grep -v dist > /tmp/audit_J1.txt

# J2: AI calls that might be mocked
grep -rn $EXT -i "completion\|chat\.create\|messages\.create\|generate\|embed" $SRC | grep -v node_modules | grep -v test > /tmp/audit_J2.txt
```

---

## Category K: Environment & Configuration

```bash
# K1: All env var references in code
grep -rn $EXT "process\.env\.\|os\.environ\|os\.getenv\|env\.\|Env\.\|config\." $SRC | grep -v node_modules | grep -v test | sed 's/.*\(process\.env\.[A-Z_a-z0-9]*\|os\.environ\[.[A-Z_a-z0-9]*.\]\|os\.getenv(.[A-Z_a-z0-9]*.\)\).*/\1/' | sort | uniq > /tmp/audit_K1.txt

# K2: Env vars documented in .env.example
cat .env.example 2>/dev/null || cat .env.local.example 2>/dev/null || cat .env.sample 2>/dev/null > /tmp/audit_K2.txt

# K3: Missing env var validation at startup
grep -rn $EXT "required.*env\|env.*required\|assert.*env\|if.*!.*process\.env\|validateEnv\|envalid\|zod.*env\|env\.parse" $SRC | grep -v node_modules | grep -v test > /tmp/audit_K3.txt
```

---

## Category L: Authentication & Authorization

```bash
# L1: Auth middleware/guards on routes
grep -rn $EXT "auth\|protect\|guard\|requireAuth\|isAuthenticated\|authenticate\|checkToken\|verifyToken" $SRC | grep -v node_modules | grep -v test > /tmp/audit_L1.txt

# L2: All route definitions (to cross-reference with L1 for unprotected routes)
grep -rn $EXT "router\.\(get\|post\|put\|patch\|delete\)\|app\.\(get\|post\|put\|patch\|delete\)\|@Get\|@Post\|@Put\|@Delete\|@app\.route\|@router\." $SRC | grep -v node_modules | grep -v test > /tmp/audit_L2.txt

# L3: Data scoping — queries that filter by user/org (should be on every user-data query)
grep -rn $EXT "user_id\|userId\|org_id\|orgId\|organization_id\|tenant_id\|auth\.uid()\|req\.user\.\(id\|userId\)" $SRC | grep -v node_modules | grep -v test > /tmp/audit_L3.txt

# L4: ID from request (potential horizontal privilege escalation)
grep -rn $EXT "req\.params\.\|req\.query\.\|req\.body\.\|request\.args\|request\.json" $SRC | grep -v node_modules | grep -v test | grep "id\|Id\|ID" > /tmp/audit_L4.txt

# L5: JWT/token handling
grep -rn $EXT "jwt\.\|jsonwebtoken\|jose\|JWT\|token.*secret\|secret.*token\|sign(\|verify(" $SRC | grep -v node_modules | grep -v test > /tmp/audit_L5.txt

# L6: Password handling
grep -rn $EXT "bcrypt\|argon2\|scrypt\|pbkdf2\|hash.*password\|password.*hash\|md5\|sha1\|sha256.*password\|createHash" $SRC | grep -v node_modules | grep -v test > /tmp/audit_L6.txt
```

**Cross-reference L1 with L2:** Every endpoint in L2 that handles user data should appear in L1 (has auth). Unprotected sensitive endpoints are Critical severity.

**Cross-reference L3 with L4:** Every endpoint accepting an ID from the request should also filter by the authenticated user's ID/org. Missing scoping is a horizontal privilege escalation vulnerability.

---

## Category M: Input Validation & Injection

```bash
# M1: SQL injection patterns (string concatenation in queries)
grep -rn $EXT 'query.*`.*\${.\|query.*" *+\|query.*'"'"' *+\|execute.*f"\|execute.*%s\|\.raw(\|\.rawQuery(' $SRC | grep -v node_modules | grep -v test > /tmp/audit_M1.txt

# M2: XSS patterns (dangerous HTML rendering)
grep -rn $EXT "dangerouslySetInnerHTML\|v-html\|innerHTML\|\[innerHTML\]\|mark_safe\|Markup(" $SRC | grep -v node_modules | grep -v test > /tmp/audit_M2.txt

# M3: Mass assignment (entire request body passed to DB)
grep -rn $EXT "\.create(req\.body)\|\.update(req\.body)\|\.insert(req\.body)\|\*\*request\.json\|\.create(\*\*" $SRC | grep -v node_modules | grep -v test > /tmp/audit_M3.txt

# M4: Request body usage without validation
grep -rn $EXT "req\.body\|request\.json\|request\.form\|request\.args\|@Body()" $SRC | grep -v node_modules | grep -v test > /tmp/audit_M4.txt
# Cross-reference: do these files also have validation (zod, joi, class-validator, pydantic)?

# M5: CSRF protection
grep -rn $EXT "csrf\|CSRF\|xsrf\|XSRF\|csrfToken\|_token\|sameSite\|SameSite" $SRC | grep -v node_modules | grep -v test > /tmp/audit_M5.txt

# M6: File path handling (path traversal)
grep -rn $EXT "path\.join\|path\.resolve\|readFile\|writeFile\|createReadStream\|fs\.\|open(" $SRC | grep -v node_modules | grep -v test | grep "req\.\|params\.\|body\.\|query\." > /tmp/audit_M6.txt
```

---

## Category N: Transaction & Data Consistency

```bash
# N1: Database transactions
grep -rn $EXT "transaction\|BEGIN\|COMMIT\|ROLLBACK\|\.transaction\|@Transaction\|atomic\|savepoint" $SRC | grep -v node_modules | grep -v test > /tmp/audit_N1.txt

# N2: Multiple DB writes in single functions (need transaction review)
grep -rn $EXT "\.insert\|\.create\|\.update\|\.delete\|\.upsert\|\.save\|\.remove\|\.destroy" $SRC | grep -v node_modules | grep -v test > /tmp/audit_N2.txt
# Group by file — files with 2+ DB write operations need transaction review

# N3: Race condition patterns (read-then-write without locking)
grep -rn $EXT "findOne.*update\|findFirst.*update\|SELECT.*FOR UPDATE\|optimistic.*lock\|version.*increment" $SRC | grep -v node_modules | grep -v test > /tmp/audit_N3.txt
```

---

## Category O: State Management & Data Flow

```bash
# O1: Frontend state hooks/stores
grep -rn $EXT "useState\|useReducer\|useContext\|createContext\|zustand\|redux\|recoil\|jotai\|pinia\|vuex" $SRC | grep -v node_modules | grep -v test > /tmp/audit_O1.txt

# O2: Data fetching patterns
grep -rn $EXT "useEffect.*fetch\|useSWR\|useQuery\|useMutation\|createAsyncThunk\|RTK Query\|tanstack" $SRC | grep -v node_modules | grep -v test > /tmp/audit_O2.txt

# O3: In-memory server state (won't scale horizontally)
grep -rn $EXT "new Map()\|new Set()\|global\.\|app\.locals\.\|let.*cache\|const.*cache\|MemoryStore" $SRC | grep -v node_modules | grep -v test > /tmp/audit_O3.txt

# O4: Missing cleanup (subscriptions, timers, event listeners without cleanup)
grep -rn $EXT "addEventListener\|setInterval\|setTimeout\|subscribe\|on(" $SRC | grep -v node_modules | grep -v test > /tmp/audit_O4.txt
# Cross-reference with cleanup: removeEventListener, clearInterval, clearTimeout, unsubscribe, off(
```

---

## Category P: Infrastructure & Deployment

```bash
# P1: Health check endpoints
grep -rn $EXT "health\|/ping\|/ready\|/status\|readiness\|liveness" $SRC | grep -v node_modules | grep -v test > /tmp/audit_P1.txt

# P2: Graceful shutdown
grep -rn $EXT "SIGTERM\|SIGINT\|graceful.*shutdown\|beforeExit\|on_shutdown\|process\.on.*signal" $SRC | grep -v node_modules | grep -v test > /tmp/audit_P2.txt

# P3: Structured logging (vs console.log)
grep -rn $EXT "winston\|pino\|bunyan\|structlog\|loguru\|log4j\|slog\.\|Logger" $SRC | grep -v node_modules | grep -v test > /tmp/audit_P3.txt

# P4: Error tracking integration
grep -rn $EXT "sentry\|Sentry\|bugsnag\|Bugsnag\|rollbar\|Rollbar\|captureException\|captureMessage" $SRC | grep -v node_modules | grep -v test > /tmp/audit_P4.txt

# P5: Rate limiting
grep -rn $EXT "rateLimit\|rate-limit\|throttle\|RateLimiter\|express-rate-limit\|bottleneck" $SRC | grep -v node_modules | grep -v test > /tmp/audit_P5.txt

# P6: Security headers
grep -rn $EXT "helmet\|X-Frame-Options\|X-Content-Type-Options\|Strict-Transport\|Content-Security-Policy\|Referrer-Policy" $SRC | grep -v node_modules | grep -v test > /tmp/audit_P6.txt

# P7: Connection pooling and retry
grep -rn $EXT "pool\|poolSize\|connectionLimit\|max_connections\|retry\|reconnect\|backoff" $SRC | grep -v node_modules | grep -v test > /tmp/audit_P7.txt

# P8: Body size limits and timeouts
grep -rn $EXT "limit\|bodyParser\|express\.json\|timeout\|keepAlive\|maxBodySize" $SRC | grep -v node_modules | grep -v test > /tmp/audit_P8.txt

# P9: Env var validation at startup
grep -rn $EXT "validateEnv\|envalid\|env\.parse\|assert.*env\|if.*!.*process\.env\|required.*env\|throw.*missing.*env" $SRC | grep -v node_modules | grep -v test > /tmp/audit_P9.txt
```

---

## Category Q: Secrets Management & TLS

```bash
# Q1: Secrets manager integration
grep -rn $EXT "vault\|Vault\|VAULT\|secretsmanager\|SecretManager\|doppler\|infisical\|1password\|op run\|chamber\|sops\|sealed-secret\|external-secret" $SRC | grep -v node_modules | grep -v test > /tmp/audit_Q1.txt

# Q2: .env files in git
git ls-files 2>/dev/null | grep -i "\.env" | grep -v "\.example\|\.sample\|\.template" > /tmp/audit_Q2.txt

# Q3: Secrets in git history
git log --all --diff-filter=A --name-only -- "*.env" "*.pem" "*.key" "*.p12" "*.pfx" "*.keystore" 2>/dev/null > /tmp/audit_Q3.txt

# Q4: .gitignore coverage for secrets
cat .gitignore 2>/dev/null | grep -i "env\|secret\|key\|pem\|credential\|token\|\.p12\|\.pfx\|keystore" > /tmp/audit_Q4.txt

# Q5: Disabled TLS/SSL verification (CRITICAL)
grep -rn $EXT "rejectUnauthorized.*false\|VERIFY_SSL.*false\|verify_ssl.*False\|InsecureSkipVerify\|NODE_TLS_REJECT_UNAUTHORIZED.*0\|check_hostname.*False" $SRC | grep -v node_modules | grep -v test > /tmp/audit_Q5.txt

# Q6: HTTP (non-TLS) external API calls
grep -rn $EXT "http://" $SRC | grep -v node_modules | grep -v test | grep -v localhost | grep -v "127\.0\.0\.1" | grep -v "\.env\|process\.env" > /tmp/audit_Q6.txt

# Q7: Token storage in localStorage (insecure)
grep -rn $EXT "localStorage\.setItem\|localStorage\.getItem\|sessionStorage\.setItem" $SRC | grep -v node_modules | grep -v test | grep -i "token\|jwt\|auth\|session\|key" > /tmp/audit_Q7.txt

# Q8: Token clearing on logout
grep -rn $EXT "localStorage\.removeItem\|localStorage\.clear\|sessionStorage\.clear" $SRC | grep -v node_modules | grep -v test > /tmp/audit_Q8.txt

# Q9: Certificate pinning
grep -rn $EXT "pin\|pinning\|pinnedCertificates\|ssl.*pin\|certificate.*pin\|public.*key.*pin\|sha256/" $SRC | grep -v node_modules | grep -v test > /tmp/audit_Q9.txt

# Q10: Tokens in URL query parameters (insecure)
grep -rn $EXT "token=\|api_key=\|key=\|secret=\|password=" $SRC | grep -v node_modules | grep -v test | grep "url\|URL\|href\|query\|param\|\\?" > /tmp/audit_Q10.txt
```

---

## Category R: Docker & Container Hardening

```bash
# R1: Dockerfile analysis
find . -name "Dockerfile*" -not -path "*/node_modules/*" > /tmp/audit_R1.txt

# R2: Running as root (no USER directive)
for df in $(find . -name "Dockerfile*" -not -path "*/node_modules/*"); do
  grep -L "^USER " "$df" >> /tmp/audit_R2.txt 2>/dev/null
done

# R3: Using :latest tag
grep -rn ":latest" $(find . -name "Dockerfile*" -not -path "*/node_modules/*") > /tmp/audit_R3.txt 2>/dev/null
grep -rn "image:.*:latest\|image:.*latest" $(find . -name "*.yaml" -o -name "*.yml" | grep -v node_modules) >> /tmp/audit_R3.txt 2>/dev/null

# R4: Secrets in Docker build
grep -rn "ARG.*SECRET\|ARG.*KEY\|ARG.*PASSWORD\|ARG.*TOKEN\|ENV.*SECRET\|ENV.*KEY\|ENV.*PASSWORD\|COPY.*\.env" $(find . -name "Dockerfile*" -not -path "*/node_modules/*") > /tmp/audit_R4.txt 2>/dev/null

# R5: .dockerignore existence and coverage
find . -name ".dockerignore" -not -path "*/node_modules/*" > /tmp/audit_R5.txt
# If .dockerignore exists, check if it covers sensitive files
for di in $(find . -name ".dockerignore" -not -path "*/node_modules/*"); do
  echo "=== $di ===" >> /tmp/audit_R5_content.txt
  cat "$di" >> /tmp/audit_R5_content.txt
done 2>/dev/null

# R6: IMAGE_TAG usage
grep -rn "IMAGE_TAG\|image_tag\|DOCKER_TAG\|docker_tag" $SRC $(find . -name "*.yaml" -o -name "*.yml" | grep -v node_modules) > /tmp/audit_R6.txt 2>/dev/null

# R7: Container/image scanning in CI
grep -rn "trivy\|Trivy\|grype\|Grype\|snyk.*container\|docker.*scout\|aquasecurity\|anchore" $(find . -path "*/.github/workflows/*" -o -path "*/.gitlab-ci*" -o -name "Jenkinsfile" 2>/dev/null) > /tmp/audit_R7.txt 2>/dev/null

# R8: Multi-stage build check
for df in $(find . -name "Dockerfile*" -not -path "*/node_modules/*"); do
  stages=$(grep -c "^FROM" "$df")
  echo "$df: $stages stage(s)" >> /tmp/audit_R8.txt
done 2>/dev/null
```

---

## Category S: CI Security & Deployment Safety

```bash
# S1: SAST/DAST in CI
grep -rn "codeql\|CodeQL\|semgrep\|Semgrep\|sonarqube\|SonarQube\|sonar-scanner\|snyk\|Snyk\|bandit\|safety\|SAST\|DAST\|security.*scan" $(find . -path "*/.github/workflows/*" -o -path "*/.gitlab-ci*" -o -name "Jenkinsfile" 2>/dev/null) > /tmp/audit_S1.txt 2>/dev/null

# S2: Secret scanning in CI
grep -rn "gitleaks\|GitLeaks\|trufflehog\|TruffleHog\|detect-secrets\|secret.*scan" $(find . -path "*/.github/workflows/*" -o -path "*/.gitlab-ci*" -o -name "Jenkinsfile" 2>/dev/null) > /tmp/audit_S2.txt 2>/dev/null

# S3: Dependabot / Renovate
find . -name "dependabot.yml" -o -name "renovate.json" -o -name "renovate.json5" -o -name ".renovaterc" > /tmp/audit_S3.txt 2>/dev/null

# S4: Deployment gates / environment protection
grep -rn "environment:\|approval\|manual\|gate\|promote\|required_reviewers\|protection" $(find . -path "*/.github/workflows/*" -o -path "*/.gitlab-ci*" 2>/dev/null) > /tmp/audit_S4.txt 2>/dev/null

# S5: Pre-migration database backup
grep -rn "backup\|pg_dump\|mysqldump\|mongodump\|snapshot\|dump.*before\|before.*migrat" $(find . -path "*/.github/workflows/*" -o -path "*/.gitlab-ci*" -o -name "Makefile" -o -path "*/scripts/*" -o -path "*/deploy/*" 2>/dev/null) > /tmp/audit_S5.txt 2>/dev/null

# S6: Migration rollback capability
find . -path "*/migrations/*" -name "*down*" -o -name "*rollback*" -o -name "*revert*" | grep -v node_modules > /tmp/audit_S6.txt 2>/dev/null

# S7: Canary / blue-green / rolling deployment
grep -rn "canary\|blue.green\|rolling\|gradual\|percentage\|weight" $(find . -path "*/.github/workflows/*" -o -path "*/.gitlab-ci*" -o -name "*.yaml" -o -name "*.yml" | grep -v node_modules 2>/dev/null) > /tmp/audit_S7.txt 2>/dev/null

# S8: Mobile secure storage
grep -rn "AsyncStorage\|SecureStore\|Keychain\|EncryptedStorage\|EncryptedSharedPreferences\|flutter_secure_storage\|keychain" $SRC | grep -v node_modules | grep -v test > /tmp/audit_S8.txt 2>/dev/null
```

---

## Running All Patterns

Use `references/scan-runner.sh` (if available) to execute all patterns in one pass, or run them sequentially. After all patterns have run:

1. Count total findings per category:
   ```bash
   for f in /tmp/audit_*.txt; do
     echo "$(basename $f): $(wc -l < $f) findings"
   done
   ```

2. Process EVERY finding (no skipping, no sampling)
3. Classify each one by reading surrounding context in the actual source file
4. Record classifications for the final report
