#!/bin/bash
# Production Readiness Audit — Automated Scan Runner
# This script runs ALL scan patterns and saves results to /tmp/audit_*.txt
# It NEVER truncates output. Every finding is captured.
#
# Usage: bash scan-runner.sh [project_root]
# Default project_root is current directory

set -euo pipefail

PROJECT_ROOT="${1:-.}"
cd "$PROJECT_ROOT"

echo "============================================"
echo "  PRODUCTION READINESS AUDIT — SCAN RUNNER"
echo "============================================"
echo "Project: $(pwd)"
echo "Started: $(date)"
echo ""

# Clean previous audit files
rm -f /tmp/audit_*.txt

# ─────────────────────────────────────
# STEP 1: Detect stack and build file list
# ─────────────────────────────────────

echo "[1/4] Detecting stack and mapping codebase..."

# Detect source file extensions present
EXTENSIONS=""
for ext in ts tsx js jsx py go rs java rb php vue svelte; do
  count=$(find . -type f -name "*.$ext" | grep -v node_modules | grep -v dist | grep -v build | grep -v __pycache__ | grep -v .venv | grep -v target | wc -l)
  if [ "$count" -gt 0 ]; then
    EXTENSIONS="$EXTENSIONS --include=*.$ext"
    echo "  Found $count .$ext files"
  fi
done

if [ -z "$EXTENSIONS" ]; then
  echo "ERROR: No source files found!"
  exit 1
fi

# Build complete source file list
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.py" -o -name "*.go" -o -name "*.rs" -o -name "*.java" -o -name "*.rb" -o -name "*.php" -o -name "*.vue" -o -name "*.svelte" \) \
  | grep -v node_modules | grep -v dist | grep -v build | grep -v __pycache__ | grep -v .venv | grep -v target \
  | grep -v ".test." | grep -v ".spec." | grep -v "__tests__" \
  | sort > /tmp/audit_all_source.txt

TOTAL_FILES=$(wc -l < /tmp/audit_all_source.txt)
echo "  Total source files (excl. tests): $TOTAL_FILES"

# Build source directories list (exclude common non-source dirs)
SRC_DIRS=$(find . -type d -maxdepth 3 \
  -not -path "*/node_modules/*" -not -path "*/.git/*" \
  -not -path "*/dist/*" -not -path "*/build/*" \
  -not -path "*/__pycache__/*" -not -path "*/.venv/*" \
  -not -path "*/target/*" -not -path "*/.next/*" \
  -not -name ".*" -not -name "node_modules" \
  | tr '\n' ' ')

# Detect stack
echo ""
echo "  Stack detection:"
[ -f "package.json" ] && echo "    - Node.js project detected"
[ -f "requirements.txt" ] || [ -f "pyproject.toml" ] || [ -f "Pipfile" ] && echo "    - Python project detected"
[ -f "go.mod" ] && echo "    - Go project detected"
[ -f "Cargo.toml" ] && echo "    - Rust project detected"

# Detect frameworks
for pkg in $(find . -name "package.json" -not -path "*/node_modules/*" -maxdepth 3 2>/dev/null); do
  grep -q '"react"' "$pkg" 2>/dev/null && echo "    - React detected ($pkg)"
  grep -q '"next"' "$pkg" 2>/dev/null && echo "    - Next.js detected ($pkg)"
  grep -q '"vue"' "$pkg" 2>/dev/null && echo "    - Vue.js detected ($pkg)"
  grep -q '"express"' "$pkg" 2>/dev/null && echo "    - Express detected ($pkg)"
  grep -q '"fastify"' "$pkg" 2>/dev/null && echo "    - Fastify detected ($pkg)"
  grep -q '"prisma"' "$pkg" 2>/dev/null && echo "    - Prisma detected ($pkg)"
  grep -q '"supabase"' "$pkg" 2>/dev/null && echo "    - Supabase detected ($pkg)"
  grep -q '"drizzle"' "$pkg" 2>/dev/null && echo "    - Drizzle detected ($pkg)"
done

# ─────────────────────────────────────
# STEP 2: Run ALL scan patterns
# ─────────────────────────────────────

echo ""
echo "[2/4] Running exhaustive pattern scan..."
echo "  (NO truncation — capturing ALL results)"
echo ""

# Common exclusion filter
EXCLUDE="grep -v node_modules | grep -v dist | grep -v build | grep -v __pycache__ | grep -v .venv"
EXCLUDE_TEST="grep -v '\.test\.' | grep -v '\.spec\.' | grep -v __tests__"

run_pattern() {
  local name="$1"
  local desc="$2"
  shift 2
  # Run the grep command, allow failures (grep returns 1 if no matches)
  eval "$@" > "/tmp/audit_${name}.txt" 2>/dev/null || true
  local count=$(wc -l < "/tmp/audit_${name}.txt")
  printf "  %-10s %-50s %d findings\n" "[$name]" "$desc" "$count"
}

# Category A: Simulation / Mock / Fake
run_pattern "A1" "Simulation keywords" \
  "grep -rn $EXTENSIONS -i 'simulat' . | grep -v node_modules | grep -v '\.test\.' | grep -v '\.spec\.' | grep -v dist"

run_pattern "A2" "Mock references" \
  "grep -rn $EXTENSIONS -i '\bmock\b' . | grep -v node_modules | grep -v '\.test\.' | grep -v '\.spec\.' | grep -v dist | grep -v __tests__"

run_pattern "A3" "Stub references" \
  "grep -rn $EXTENSIONS -i '\bstub\b' . | grep -v node_modules | grep -v '\.test\.' | grep -v '\.spec\.' | grep -v dist"

run_pattern "A4" "Dummy/fake/hardcoded data" \
  "grep -rn $EXTENSIONS -i 'dummy\|fake.data\|fakeData\|hardcoded\|hard.coded\|sample.data\|sampleData' . | grep -v node_modules | grep -v '\.test\.' | grep -v dist"

run_pattern "A5" "Placeholder content" \
  "grep -rn $EXTENSIONS -i 'placeholder\|lorem ipsum' . | grep -v node_modules | grep -v dist"

run_pattern "A7" "Math.random in business logic" \
  "grep -rn $EXTENSIONS 'Math\.random()\|random\.\|randint\|secrets\.' . | grep -v node_modules | grep -v test | grep -v seed | grep -v dist"

# Category B: Incomplete / Deferred
run_pattern "B1" "TODO/FIXME/HACK markers" \
  "grep -rn $EXTENSIONS 'TODO\|FIXME\|HACK\|XXX\|@todo\|@fixme\|@hack' . | grep -v node_modules | grep -v '\.test\.'"

run_pattern "B2" "Deferral language" \
  "grep -rn $EXTENSIONS -i 'for now\|for the moment\|temporarily\|coming soon\|not yet\|to be implemented\|tbd\|wip' . | grep -v node_modules | grep -v '\.test\.'"

run_pattern "B3" "Hypothetical 'would' language" \
  "grep -rn $EXTENSIONS -i 'would use\|would be\|would call\|would fetch\|would send\|would connect\|would query\|would create\|would implement\|would integrate\|would store\|would return\|should eventually\|will eventually\|need to implement\|needs implementation' . | grep -v node_modules | grep -v '\.test\.'"

run_pattern "B4" "Production-reference comments" \
  "grep -rn $EXTENSIONS -i 'in production\|in a real\|real implementation\|real environment\|production would\|when deployed\|once we have\|when.*is ready' . | grep -v node_modules | grep -v '\.test\.'"

run_pattern "B5" "Commented-out code" \
  "grep -rn $EXTENSIONS '\/\/.*import\|\/\/.*require\|\/\/.*fetch\|\/\/.*await\|\/\/.*return\|#.*import\|#.*def ' . | grep -v node_modules | grep -v test"

# Category C: Not Implemented
run_pattern "C1" "Not-implemented markers" \
  "grep -rn $EXTENSIONS -i 'not.implemented\|NotImplemented\|NOT_IMPLEMENTED\|raise NotImplementedError' . | grep -v node_modules"

run_pattern "C2" "Throw guards for missing impl" \
  "grep -rn $EXTENSIONS 'throw new Error.*[Ii]mplement\|throw new Error.*[Nn]ot\|throw new Error.*[Tt]odo\|throw new Error.*missing\|raise.*Error.*implement\|raise.*Error.*todo' . | grep -v node_modules | grep -v '\.test\.'"

# Category D: Empty / Stub Functions
run_pattern "D1" "Return empty/null immediately" \
  "grep -rn $EXTENSIONS 'return {};\|return \[\];\|return null;\|return undefined;\|return None\|return {}\|return \[\]' . | grep -v node_modules | grep -v '\.test\.' | grep -v dist"

run_pattern "D2" "Empty function bodies" \
  "grep -rn $EXTENSIONS '() {}' . | grep -v node_modules | grep -v test"

# Category E: Error Handling
run_pattern "E1" "Empty catch blocks" \
  "grep -rn $EXTENSIONS 'catch.*{[[:space:]]*}' . | grep -v node_modules | grep -v test"

run_pattern "E3" "Catch with only console.log" \
  "grep -rn $EXTENSIONS -A2 'catch[[:space:]]*(' . | grep -v node_modules | grep -v test | grep 'console\.\|print(' "

run_pattern "E5" "Unhandled promise (.then without .catch)" \
  "grep -rn $EXTENSIONS '\.then(' . | grep -v node_modules | grep -v test | grep -v '\.catch('"

# Category F: Security
run_pattern "F1" "Potential hardcoded secrets" \
  "grep -rn $EXTENSIONS -i 'api_key\|apikey\|secret_key\|secretkey\|private_key\|password\|auth_token\|access_token' . | grep -v node_modules | grep -v test | grep -v '.env' | grep -v 'process\.env\|os\.environ\|os\.getenv\|config\.'"

run_pattern "F2" "Hardcoded URLs / localhost" \
  "grep -rn $EXTENSIONS 'localhost\|127\.0\.0\.1\|0\.0\.0\.0\|http://' . | grep -v node_modules | grep -v test | grep -v '.env\|process\.env\|os\.environ'"

run_pattern "F3" "SQL injection risk" \
  "grep -rn $EXTENSIONS 'query.*\`\|query.*+\|execute.*+\|\.raw(' . | grep -v node_modules | grep -v test"

run_pattern "F5" "Wildcard CORS" \
  "grep -rn $EXTENSIONS 'origin.*\*\|Access-Control-Allow-Origin.*\*\|cors()' . | grep -v node_modules | grep -v test"

run_pattern "F6" "Disabled security" \
  "grep -rn $EXTENSIONS -i 'verify.*false\|secure.*false\|rejectUnauthorized.*false\|SSL_VERIFY.*false' . | grep -v node_modules | grep -v test"

# Category G: Console/Debug
run_pattern "G1" "Console statements in production" \
  "grep -rn $EXTENSIONS 'console\.log\|console\.warn\|console\.error\|console\.info\|console\.debug' . | grep -v node_modules | grep -v test | grep -v dist"

run_pattern "G2" "Python print statements" \
  "grep -rn --include='*.py' '^\s*print(' . | grep -v node_modules | grep -v test | grep -v __pycache__"

run_pattern "G3" "Debug flags left on" \
  "grep -rn $EXTENSIONS -i 'debug.*=.*true\|DEBUG.*=.*True\|verbose.*=.*true' . | grep -v node_modules | grep -v test"

# Category H: UI Completeness
run_pattern "H1" "Coming soon / placeholder UI" \
  "grep -rn $EXTENSIONS -i 'coming soon\|under construction\|lorem ipsum\|placeholder text\|sample text' . | grep -v node_modules | grep -v test"

run_pattern "H2" "Loading-only components" \
  "grep -rn $EXTENSIONS -i 'isLoading.*return null\|loading.*return null' . | grep -v node_modules | grep -v test"

run_pattern "H4" "Disabled UI elements" \
  "grep -rn $EXTENSIONS 'disabled.*true\|disabled={true}\|isDisabled\|cursor-not-allowed' . | grep -v node_modules | grep -v test"

# Category I: Database
run_pattern "I1" "Migration/schema files" \
  "find . -name '*.sql' -o -name 'migration*' -o -name '*.prisma' | grep -v node_modules"

run_pattern "I2" "Table references in code" \
  "grep -rn $EXTENSIONS '\.from(\|\.table(\|\.collection(\|@Table\|@Entity\|__tablename__' . | grep -v node_modules | grep -v test"

run_pattern "I3" "RLS policies (Supabase)" \
  "grep -rn 'ENABLE ROW LEVEL SECURITY\|CREATE POLICY\|enable row level security' \$(find . -name '*.sql' | grep -v node_modules) 2>/dev/null"

# Category J: AI/ML
run_pattern "J1" "AI/LLM references" \
  "grep -rn $EXTENSIONS -i 'openai\|anthropic\|claude\|gpt-\|gemini\|llm\|langchain\|cohere\|hugging.face\|ollama' . | grep -v node_modules | grep -v test | grep -v dist"

# Category K: Environment
echo ""
echo "  [K] Environment variable analysis..."
grep -rn $EXTENSIONS "process\.env\.\|os\.environ\|os\.getenv" . 2>/dev/null \
  | grep -v node_modules | grep -v test \
  > /tmp/audit_K_raw.txt || true

# Extract var names
cat /tmp/audit_K_raw.txt | sed 's/.*process\.env\.\([A-Z_a-z0-9]*\).*/\1/' | sort | uniq > /tmp/audit_K1_used.txt 2>/dev/null || true
cat .env.example 2>/dev/null || cat .env.local.example 2>/dev/null || cat .env.sample 2>/dev/null > /tmp/audit_K2_documented.txt 2>/dev/null || echo "NO .env.example FOUND" > /tmp/audit_K2_documented.txt
printf "  %-10s %-50s %d vars in code\n" "[K1]" "Env vars used in code" "$(wc -l < /tmp/audit_K1_used.txt)"

# ─────────────────────────────────────
# STEP 3: Security & Auth checks
# ─────────────────────────────────────

echo ""
echo "[3/6] Running security & authorization checks..."

# Category L: Authentication & Authorization
run_pattern "L1" "Auth middleware/guards" \
  "grep -rn $EXTENSIONS -i 'auth\|protect\|guard\|requireAuth\|isAuthenticated\|checkToken\|verifyToken' . | grep -v node_modules | grep -v test"

run_pattern "L2" "All route definitions" \
  "grep -rn $EXTENSIONS 'router\.\(get\|post\|put\|patch\|delete\)\|app\.\(get\|post\|put\|patch\|delete\)\|@Get\|@Post\|@Put\|@Delete\|@app\.route' . | grep -v node_modules | grep -v test"

run_pattern "L3" "Data scoping (user_id/org_id)" \
  "grep -rn $EXTENSIONS 'user_id\|userId\|org_id\|orgId\|organization_id\|tenant_id\|auth\.uid()' . | grep -v node_modules | grep -v test"

run_pattern "L4" "IDs from request params" \
  "grep -rn $EXTENSIONS 'req\.params\.\|req\.query\.\|req\.body\.' . | grep -v node_modules | grep -v test"

run_pattern "L5" "JWT/token handling" \
  "grep -rn $EXTENSIONS 'jwt\.\|jsonwebtoken\|jose\|JWT\|sign(\|verify(' . | grep -v node_modules | grep -v test"

run_pattern "L6" "Password hashing" \
  "grep -rn $EXTENSIONS 'bcrypt\|argon2\|scrypt\|pbkdf2\|md5\|sha1\|sha256\|createHash' . | grep -v node_modules | grep -v test"

# Category M: Input Validation & Injection
run_pattern "M1" "SQL injection risk" \
  "grep -rn $EXTENSIONS 'query.*\`\|execute.*f\"\|\.raw(\|\.rawQuery(' . | grep -v node_modules | grep -v test"

run_pattern "M2" "XSS risk (innerHTML)" \
  "grep -rn $EXTENSIONS 'dangerouslySetInnerHTML\|v-html\|innerHTML\|mark_safe\|Markup(' . | grep -v node_modules | grep -v test"

run_pattern "M3" "Mass assignment risk" \
  "grep -rn $EXTENSIONS '\.create(req\.body)\|\.update(req\.body)\|\.insert(req\.body)' . | grep -v node_modules | grep -v test"

run_pattern "M4" "Request body usage" \
  "grep -rn $EXTENSIONS 'req\.body\|request\.json\|request\.form\|@Body()' . | grep -v node_modules | grep -v test"

run_pattern "M5" "CSRF protection" \
  "grep -rn $EXTENSIONS 'csrf\|CSRF\|xsrf\|csrfToken\|sameSite\|SameSite' . | grep -v node_modules | grep -v test"

# ─────────────────────────────────────
# STEP 4: Application logic checks
# ─────────────────────────────────────

echo ""
echo "[4/6] Running application logic checks..."

# Category N: Transactions & Consistency
run_pattern "N1" "Database transactions" \
  "grep -rn $EXTENSIONS 'transaction\|BEGIN\|COMMIT\|ROLLBACK\|\.transaction\|@Transaction\|atomic\|savepoint' . | grep -v node_modules | grep -v test"

run_pattern "N2" "DB write operations" \
  "grep -rn $EXTENSIONS '\.insert\|\.create\|\.update\|\.delete\|\.upsert\|\.save\|\.remove\|\.destroy' . | grep -v node_modules | grep -v test"

# Category O: State Management
run_pattern "O1" "Frontend state management" \
  "grep -rn $EXTENSIONS 'useState\|useReducer\|useContext\|createContext\|zustand\|redux\|recoil\|jotai\|pinia' . | grep -v node_modules | grep -v test"

run_pattern "O2" "Data fetching patterns" \
  "grep -rn $EXTENSIONS 'useSWR\|useQuery\|useMutation\|createAsyncThunk\|tanstack' . | grep -v node_modules | grep -v test"

run_pattern "O3" "In-memory server state" \
  "grep -rn $EXTENSIONS 'new Map()\|new Set()\|global\.\|app\.locals\.\|MemoryStore' . | grep -v node_modules | grep -v test"

# ─────────────────────────────────────
# STEP 5: Infrastructure checks
# ─────────────────────────────────────

echo ""
echo "[5/6] Running infrastructure & deployment checks..."

# Category P: Infrastructure & Deployment
run_pattern "P1" "Health check endpoints" \
  "grep -rn $EXTENSIONS -i 'health\|/ping\|/ready\|/status\|readiness\|liveness' . | grep -v node_modules | grep -v test"

run_pattern "P2" "Graceful shutdown" \
  "grep -rn $EXTENSIONS 'SIGTERM\|SIGINT\|graceful.*shutdown\|beforeExit\|on_shutdown\|process\.on.*signal' . | grep -v node_modules | grep -v test"

run_pattern "P3" "Structured logging" \
  "grep -rn $EXTENSIONS -i 'winston\|pino\|bunyan\|structlog\|loguru\|log4j\|slog\.\|Logger' . | grep -v node_modules | grep -v test"

run_pattern "P4" "Error tracking (Sentry etc)" \
  "grep -rn $EXTENSIONS -i 'sentry\|Sentry\|bugsnag\|Bugsnag\|rollbar\|captureException\|captureMessage' . | grep -v node_modules | grep -v test"

run_pattern "P5" "Rate limiting" \
  "grep -rn $EXTENSIONS -i 'rateLimit\|rate-limit\|throttle\|RateLimiter\|express-rate-limit\|bottleneck' . | grep -v node_modules | grep -v test"

run_pattern "P6" "Security headers" \
  "grep -rn $EXTENSIONS -i 'helmet\|X-Frame-Options\|X-Content-Type-Options\|Strict-Transport\|Content-Security-Policy' . | grep -v node_modules | grep -v test"

run_pattern "P7" "Connection pooling/retry" \
  "grep -rn $EXTENSIONS -i 'pool\|poolSize\|connectionLimit\|retry\|reconnect\|backoff' . | grep -v node_modules | grep -v test"

run_pattern "P8" "Body limits & timeouts" \
  "grep -rn $EXTENSIONS 'limit\|bodyParser\|express\.json\|timeout\|keepAlive\|maxBodySize' . | grep -v node_modules | grep -v test"

run_pattern "P9" "Env var validation at startup" \
  "grep -rn $EXTENSIONS 'validateEnv\|envalid\|env\.parse\|assert.*env\|throw.*missing.*env' . | grep -v node_modules | grep -v test"

run_pattern "P10" "CORS configuration" \
  "grep -rn $EXTENSIONS -i 'cors\|CORS\|Access-Control' . | grep -v node_modules | grep -v test"

run_pattern "P11" "Global error handling" \
  "grep -rn $EXTENSIONS 'errorHandler\|error.*middleware\|app\.use.*err\|exception_handler\|uncaughtException\|unhandledRejection' . | grep -v node_modules | grep -v test"

run_pattern "P12" "CI/CD pipeline" \
  "find . -path '*/.github/workflows/*' -o -path '*/.gitlab-ci*' -o -name 'Jenkinsfile' -o -name 'bitbucket-pipelines.yml' 2>/dev/null"

# Category Q: Secrets & TLS
echo ""
echo "  [Q] Secrets management & TLS checks..."

run_pattern "Q5" "Disabled TLS/SSL verification" \
  "grep -rn $EXTENSIONS 'rejectUnauthorized.*false\|VERIFY_SSL.*false\|verify_ssl.*False\|InsecureSkipVerify\|NODE_TLS_REJECT_UNAUTHORIZED.*0' . | grep -v node_modules | grep -v test"

run_pattern "Q6" "HTTP (non-TLS) external calls" \
  "grep -rn $EXTENSIONS 'http://' . | grep -v node_modules | grep -v test | grep -v localhost | grep -v '127\.0\.0\.1' | grep -v '.env\|process\.env'"

run_pattern "Q7" "Tokens in localStorage" \
  "grep -rn $EXTENSIONS 'localStorage\.setItem\|localStorage\.getItem\|sessionStorage\.setItem' . | grep -v node_modules | grep -v test"

run_pattern "Q9" "Certificate pinning" \
  "grep -rn $EXTENSIONS 'pinnedCertificates\|ssl.*pin\|certificate.*pin\|public.*key.*pin' . | grep -v node_modules | grep -v test"

run_pattern "Q10" "Tokens in URL parameters" \
  "grep -rn $EXTENSIONS 'token=\|api_key=\|secret=\|password=' . | grep -v node_modules | grep -v test"

# Category R: Docker & Container Hardening
echo ""
echo "  [R] Docker & container hardening..."

run_pattern "R1" "Dockerfiles found" \
  "find . -name 'Dockerfile*' -not -path '*/node_modules/*'"

run_pattern "R3" ":latest tag usage" \
  "grep -rn ':latest' \$(find . -name 'Dockerfile*' -name '*.yaml' -name '*.yml' -not -path '*/node_modules/*' 2>/dev/null) 2>/dev/null"

run_pattern "R4" "Secrets in Docker build" \
  "grep -rn 'ARG.*SECRET\|ARG.*KEY\|ARG.*PASSWORD\|ARG.*TOKEN\|ENV.*SECRET\|ENV.*PASSWORD\|COPY.*\.env' \$(find . -name 'Dockerfile*' -not -path '*/node_modules/*' 2>/dev/null) 2>/dev/null"

run_pattern "R5" ".dockerignore files" \
  "find . -name '.dockerignore' -not -path '*/node_modules/*'"

run_pattern "R6" "IMAGE_TAG usage" \
  "grep -rn 'IMAGE_TAG\|DOCKER_TAG\|image_tag\|docker_tag' . | grep -v node_modules"

run_pattern "R7" "Container scanning (Trivy/Grype) in CI" \
  "grep -rn 'trivy\|Trivy\|grype\|Grype\|snyk.*container\|docker.*scout' \$(find . -path '*/.github/workflows/*' -o -path '*/.gitlab-ci*' 2>/dev/null) 2>/dev/null"

# Category S: CI Security & Deployment Safety
echo ""
echo "  [S] CI security & deployment safety..."

run_pattern "S1" "SAST/DAST in CI" \
  "grep -rn 'codeql\|CodeQL\|semgrep\|Semgrep\|sonarqube\|SonarQube\|snyk\|Snyk\|bandit\|SAST\|DAST' \$(find . -path '*/.github/workflows/*' -o -path '*/.gitlab-ci*' 2>/dev/null) 2>/dev/null"

run_pattern "S2" "Secret scanning in CI" \
  "grep -rn 'gitleaks\|GitLeaks\|trufflehog\|TruffleHog\|detect-secrets\|secret.*scan' \$(find . -path '*/.github/workflows/*' -o -path '*/.gitlab-ci*' 2>/dev/null) 2>/dev/null"

run_pattern "S3" "Dependabot/Renovate config" \
  "find . -name 'dependabot.yml' -o -name 'renovate.json' -o -name 'renovate.json5' -o -name '.renovaterc'"

run_pattern "S4" "Deployment gates/approvals" \
  "grep -rn 'environment:\|approval\|manual\|gate\|promote\|required_reviewers\|protection' \$(find . -path '*/.github/workflows/*' -o -path '*/.gitlab-ci*' 2>/dev/null) 2>/dev/null"

run_pattern "S5" "Pre-migration backup" \
  "grep -rn 'backup\|pg_dump\|mysqldump\|mongodump\|snapshot\|dump.*before' \$(find . -path '*/.github/workflows/*' -o -path '*/.gitlab-ci*' -o -name 'Makefile' -o -path '*/scripts/*' 2>/dev/null) 2>/dev/null"

run_pattern "S6" "Migration rollback files" \
  "find . -path '*/migrations/*' -name '*down*' -o -name '*rollback*' -o -name '*revert*' | grep -v node_modules"

run_pattern "S7" "Canary/blue-green/rolling deploy" \
  "grep -rn 'canary\|blue.green\|rolling\|gradual' \$(find . -name '*.yaml' -o -name '*.yml' -not -path '*/node_modules/*' 2>/dev/null) 2>/dev/null"

run_pattern "S8" "Mobile secure storage" \
  "grep -rn $EXTENSIONS 'AsyncStorage\|SecureStore\|Keychain\|EncryptedStorage\|EncryptedSharedPreferences\|flutter_secure_storage' . | grep -v node_modules | grep -v test"

# ─────────────────────────────────────
# STEP 6: Summary
# ─────────────────────────────────────

echo ""
echo "============================================"
echo "[6/6] SCAN COMPLETE — Summary"
echo "============================================"
echo ""
echo "Total source files: $TOTAL_FILES"
echo ""
echo "Findings by category:"
echo "─────────────────────"

TOTAL_FINDINGS=0
for f in /tmp/audit_A*.txt /tmp/audit_B*.txt /tmp/audit_C*.txt /tmp/audit_D*.txt /tmp/audit_E*.txt /tmp/audit_F*.txt /tmp/audit_G*.txt /tmp/audit_H*.txt /tmp/audit_I*.txt /tmp/audit_J*.txt /tmp/audit_K*.txt /tmp/audit_L*.txt /tmp/audit_M*.txt /tmp/audit_N*.txt /tmp/audit_O*.txt /tmp/audit_P*.txt /tmp/audit_Q*.txt /tmp/audit_R*.txt /tmp/audit_S*.txt 2>/dev/null; do
  if [ -f "$f" ]; then
    count=$(wc -l < "$f")
    TOTAL_FINDINGS=$((TOTAL_FINDINGS + count))
    printf "  %-40s %d\n" "$(basename $f .txt)" "$count"
  fi
done

echo ""
echo "TOTAL FINDINGS TO REVIEW: $TOTAL_FINDINGS"
echo ""
echo "All results saved to /tmp/audit_*.txt"
echo "Now classify each finding by reading file context."
echo ""
echo "Finished: $(date)"
