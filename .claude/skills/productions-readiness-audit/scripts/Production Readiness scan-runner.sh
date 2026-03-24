#!/bin/bash
# Production Readiness Audit — Visionary Autonomous Runner v2
# This script runs ALL scan patterns (Phase 2) and AST-level checks (Phase 2.5),
# saves results to /tmp/audit_*.txt and context-enriched /tmp/audit_*.jsonl,
# supports baseline delta tracking, loads project-specific exclusions,
# and hands off to the Auto-Healing Engine for false-positive resolution.
# It NEVER truncates output. Every finding is captured.
#
# v2 CHANGES (fixing the fix→rescan→score-drop cycle):
#   - Context-enriched JSONL output (15 lines before/after each match)
#   - Loads .claude/audit-exclusions.json for project-specific grep exclusions
#   - Baseline delta: saves scan results for comparison on next run
#   - Deterministic metrics output to /tmp/audit_metrics.json
#
# Usage: bash scan-runner.sh [project_root]
# Default project_root is current directory

set -euo pipefail

PROJECT_ROOT="${1:-.}"
cd "$PROJECT_ROOT"

echo "============================================"
echo "  PRODUCTION READINESS AUDIT — VISIONARY v2"
echo "  Autonomous Scan + AST + Chaos + Healing"
echo "  + Context-Enriched + Delta + Exclusions"
echo "============================================"
echo "Project: $(pwd)"
echo "Started: $(date)"
echo ""

# Clean previous audit files
rm -f /tmp/audit_*.txt /tmp/audit_*.jsonl

# ─────────────────────────────────────
# STEP 0: Load Previous Baseline & Project Exclusions
# ─────────────────────────────────────

echo "[0/9] Loading baseline & exclusions..."

# 0A: Load previous baseline for delta comparison
BASELINE_DIR="${PROJECT_ROOT}/.claude/audit-baseline"
if [ -d "$BASELINE_DIR" ]; then
  BASELINE_DATE=$(cat "${BASELINE_DIR}/scan_date.txt" 2>/dev/null || echo "unknown")
  echo "  ✓ Previous audit baseline found (date: $BASELINE_DATE)"
  echo "    Delta mode enabled — will compare NEW vs PERSISTED vs RESOLVED"
  HAS_BASELINE=true
else
  echo "  ✗ No previous baseline — full scan mode (first run)"
  HAS_BASELINE=false
fi

# 0B: Load project-specific exclusions from .claude/audit-exclusions.json
EXCLUSION_FILE="${PROJECT_ROOT}/.claude/audit-exclusions.json"
CUSTOM_EXCLUDES=""
if [ -f "$EXCLUSION_FILE" ]; then
  echo "  ✓ Loading project-specific exclusions from .claude/audit-exclusions.json"
  # Extract grep exclusion patterns and build a pipe chain
  if command -v python3 &>/dev/null; then
    CUSTOM_EXCLUDES=$(python3 -c "
import json, sys
try:
    data = json.load(open('$EXCLUSION_FILE'))
    patterns = [exc.get('pattern', '') for exc in data.get('grep_exclusions', []) if exc.get('pattern')]
    if patterns:
        # Build a single grep -v with alternation
        combined = '\\|'.join(patterns)
        print(f' | grep -v \"{combined}\"')
except Exception as e:
    print('', file=sys.stderr)
" 2>/dev/null || echo "")
  fi
  if [ -n "$CUSTOM_EXCLUDES" ]; then
    echo "    Loaded $(echo "$CUSTOM_EXCLUDES" | grep -o '\\\\|' | wc -l | tr -d ' ') exclusion pattern(s)"
  else
    echo "    (no valid exclusion patterns found)"
  fi
else
  echo "  ✗ No .claude/audit-exclusions.json — no custom exclusions"
fi

echo ""

# ─────────────────────────────────────
# STEP 1: Detect stack and build file list
# ─────────────────────────────────────

echo "[1/8] Detecting stack and mapping codebase..."

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
  | grep -v ".test." | grep -v ".spec." | grep -v "__tests__" | grep -v ".DS_Store" \
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
echo "[2/8] Running exhaustive pattern scan..."
echo "  (NO truncation — capturing ALL results)"
echo ""

# Common exclusion filter
EXCLUDE="grep -v node_modules | grep -v dist | grep -v build | grep -v __pycache__ | grep -v .venv"
EXCLUDE_TEST="grep -v '\.test\.' | grep -v '\.spec\.' | grep -v __tests__"

run_pattern() {
  local name="$1"
  local desc="$2"
  shift 2
  # Run the grep command with project-specific exclusions appended
  eval "$@ $CUSTOM_EXCLUDES" > "/tmp/audit_${name}.txt" 2>/dev/null || true
  local count=$(wc -l < "/tmp/audit_${name}.txt")
  printf "  %-10s %-50s %d findings\n" "[$name]" "$desc" "$count"

  # Generate context-enriched JSONL for AI classification
  # Each record includes 15 lines before/after the match so the agent
  # can classify WITHOUT needing a separate file read for every match
  > "/tmp/audit_${name}.jsonl"
  while IFS= read -r line; do
    # Parse file:linenum:content from grep -n output
    local filepath=$(echo "$line" | cut -d: -f1)
    local linenum=$(echo "$line" | cut -d: -f2)
    # Validate linenum is numeric
    case "$linenum" in
      ''|*[!0-9]*) continue ;;
    esac
    [ ! -f "$filepath" ] && continue
    local start=$((linenum > 15 ? linenum - 15 : 1))
    local end=$((linenum + 15))
    local ctx_before=$(sed -n "${start},$((linenum-1))p" "$filepath" 2>/dev/null | head -15)
    local ctx_after=$(sed -n "$((linenum+1)),${end}p" "$filepath" 2>/dev/null | head -15)
    local match_line=$(sed -n "${linenum}p" "$filepath" 2>/dev/null)
    # Write as tab-separated record (avoids JSON escaping complexity in bash)
    printf '%s\t%s\t%s\t%s\t%s\t%s\n' \
      "$name" "$filepath" "$linenum" "$match_line" \
      "$(echo "$ctx_before" | tr '\n' '§')" \
      "$(echo "$ctx_after" | tr '\n' '§')" \
      >> "/tmp/audit_${name}.jsonl" 2>/dev/null || true
  done < "/tmp/audit_${name}.txt"
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

# v3 additions: DEFAULT_/DEMO_ fallback constants (missed by keyword scans)
run_pattern "A8" "DEFAULT_/DEMO_ fallback constants" \
  "grep -rn $EXTENSIONS 'const DEFAULT_\|const DEMO_\|const INITIAL_\|const SAMPLE_' components/ 2>/dev/null | grep -v node_modules | grep -v __tests__ | grep -v dist"

run_pattern "A9" "Large inline data arrays in components" \
  "grep -rn $EXTENSIONS '^\s*const [A-Z_]*\s*[:=].*\[' components/ 2>/dev/null | grep -v node_modules | grep -v __tests__ | grep -v 'import\|type\|interface\|enum\|string\|number'"

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
echo "[3/8] Running security & authorization checks..."

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
echo "[4/8] Running application logic checks..."

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
echo "[5/8] Running infrastructure & deployment checks..."

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
# STEP 5.5: Component Wiring Audit (v3 addition)
# ─────────────────────────────────────

echo ""
echo "[5.5/8] Running Component Wiring Audit..."
echo "  (Enumerating ALL components — NOT sampling top N)"
echo ""

# Only run if components/ directory exists (React project)
if [ -d "components/" ]; then
  # Step 1: List ALL .tsx files in components/
  find components/ -maxdepth 2 -name "*.tsx" \
    | grep -v __tests__ | grep -v ".test." | grep -v ".spec." \
    | sort > /tmp/audit_all_components.txt
  COMP_TOTAL=$(wc -l < /tmp/audit_all_components.txt)
  echo "  Total components found: $COMP_TOTAL"

  # Step 2: Classify each by API wiring status
  > /tmp/audit_static_components.txt
  > /tmp/audit_wired_components.txt
  > /tmp/audit_partially_wired.txt

  while IFS= read -r file; do
    HAS_API=$(grep -c "useEffect\|useQuery\|useSWR\|useMutation\|api\.\|fetch('/api\|fetch(\"/api\|fetch(\`/api" "$file" 2>/dev/null || echo 0)
    HAS_DEFAULTS=$(grep -c "const DEFAULT_\|const DEMO_\|const INITIAL_\|const SAMPLE_" "$file" 2>/dev/null || echo 0)
    if [ "$HAS_API" -gt 0 ] && [ "$HAS_DEFAULTS" -gt 0 ]; then
      echo "$file (API:$HAS_API DEFAULTS:$HAS_DEFAULTS)" >> /tmp/audit_partially_wired.txt
    elif [ "$HAS_API" -gt 0 ]; then
      echo "$file ($HAS_API API patterns)" >> /tmp/audit_wired_components.txt
    else
      echo "$file" >> /tmp/audit_static_components.txt
    fi
  done < /tmp/audit_all_components.txt

  WIRED=$(wc -l < /tmp/audit_wired_components.txt)
  PARTIAL=$(wc -l < /tmp/audit_partially_wired.txt)
  STATIC=$(wc -l < /tmp/audit_static_components.txt)

  echo "  ✓ FULLY_WIRED:      $WIRED"
  echo "  ⚠ PARTIALLY_WIRED:  $PARTIAL"
  echo "  ✗ STATIC_ONLY:      $STATIC"
  echo ""

  if [ "$PARTIAL" -gt 0 ]; then
    echo "  --- PARTIALLY_WIRED components (has API + DEFAULT_/DEMO_ data): ---"
    cat /tmp/audit_partially_wired.txt
    echo ""
  fi

  if [ "$STATIC" -gt 0 ]; then
    echo "  --- STATIC_ONLY components (zero API calls — REVIEW EACH): ---"
    cat /tmp/audit_static_components.txt
    echo ""

    # Step 3: Cross-reference with backend routes
    echo "  --- Backend route cross-reference for STATIC_ONLY components: ---"
    while IFS= read -r file; do
      BASENAME=$(basename "$file" .tsx)
      # Convert PascalCase to kebab-case for route matching
      KEBAB=$(echo "$BASENAME" | sed 's/\([a-z]\)\([A-Z]\)/\1-\2/g' | tr '[:upper:]' '[:lower:]')
      ROUTE_MATCH=$(find server/src/routes/ -name "*.ts" 2>/dev/null | xargs grep -l "$BASENAME\|$KEBAB" 2>/dev/null | head -1)
      if [ -n "$ROUTE_MATCH" ]; then
        echo "    GAP: $file → backend exists: $ROUTE_MATCH"
      fi
    done < /tmp/audit_static_components.txt
    echo ""
  fi

  echo "  [AI ACTION]: Read EVERY file in /tmp/audit_static_components.txt and /tmp/audit_partially_wired.txt"
  echo "  [AI ACTION]: Classify each per feature-completeness.md Step 7.5 rules"
else
  echo "  ✗ No components/ directory found — skipping component wiring audit"
fi

echo ""

# ─────────────────────────────────────
# STEP 6: Phase 2.5 — AST Semantic Search (VISIONARY)
# ─────────────────────────────────────

echo ""
echo "[6/8] Running Phase 2.5 — AST Semantic Search..."
echo "  (Structural analysis beyond text-matching)"
echo ""

# AST-1: Empty Catch Blocks (complements E1-E3)
# Grep pre-filter: find candidate files, then Claude Code does AST traversal
echo "  [AST-1] Empty catch blocks (structural)..."
grep -rln $EXTENSIONS "catch" . 2>/dev/null \
  | grep -v node_modules | grep -v test | grep -v dist \
  > /tmp/audit_AST1_candidates.txt || true
AST1_COUNT=$(wc -l < /tmp/audit_AST1_candidates.txt)
echo "    → $AST1_COUNT files with catch blocks flagged for AST traversal"
echo "    [AI ACTION]: Claude Code, traverse CatchClause nodes where body.length === 0"

# AST-2: Unprotected Endpoints (complements L1-L2)
echo "  [AST-2] Unprotected endpoints (structural)..."
grep -rln $EXTENSIONS 'app\.\(get\|post\|put\|patch\|delete\)\|router\.\(get\|post\|put\|patch\|delete\)' . 2>/dev/null \
  | grep -v node_modules | grep -v test | grep -v dist \
  > /tmp/audit_AST2_candidates.txt || true
AST2_COUNT=$(wc -l < /tmp/audit_AST2_candidates.txt)
echo "    → $AST2_COUNT files with route definitions flagged for auth middleware check"
echo "    [AI ACTION]: Claude Code, verify auth middleware in argument chain for each route"

# AST-3: Missing Awaits on Async ORM Calls
echo "  [AST-3] Missing awaits on async ORM calls..."
grep -rln $EXTENSIONS 'prisma\.\|supabase\.\|sequelize\.\|mongoose\.\|typeorm\.\|drizzle\.' . 2>/dev/null \
  | grep -v node_modules | grep -v test | grep -v dist \
  > /tmp/audit_AST3_candidates.txt || true
AST3_COUNT=$(wc -l < /tmp/audit_AST3_candidates.txt)
echo "    → $AST3_COUNT files with ORM calls flagged for missing await check"
echo "    [AI ACTION]: Claude Code, find CallExpression[ORM method] where parent is NOT AwaitExpression"

# AST-4: Unreachable Code After Return
echo "  [AST-4] Unreachable code after return..."
grep -rln $EXTENSIONS 'return ' . 2>/dev/null \
  | grep -v node_modules | grep -v test | grep -v dist \
  > /tmp/audit_AST4_candidates.txt || true
AST4_COUNT=$(wc -l < /tmp/audit_AST4_candidates.txt)
echo "    → $AST4_COUNT files flagged for dead code detection"
echo "    [AI ACTION]: Claude Code, find statements after ReturnStatement in same block"

# AST-5: Unvalidated Request Body Access (complements F4, M4)
echo "  [AST-5] Unvalidated request body access..."
grep -rln $EXTENSIONS 'req\.body\|request\.json\|request\.form\|@Body()' . 2>/dev/null \
  | grep -v node_modules | grep -v test | grep -v dist \
  > /tmp/audit_AST5_candidates.txt || true
AST5_COUNT=$(wc -l < /tmp/audit_AST5_candidates.txt)
echo "    → $AST5_COUNT files flagged for validation middleware check"
echo "    [AI ACTION]: Claude Code, verify Zod/Joi/class-validator in route middleware chain"

# AST tools hint
echo ""
echo "  AST Tool Options:"
echo "    - Claude Code: inline AST analysis by reading flagged files"
echo "    - ast-grep: 'ast-grep --pattern \"try { \$\$\$ } catch(\$ERR) { }\" .'"
echo "    - ts-morph / jscodeshift: custom codemods for structural checks"

# ─────────────────────────────────────
# STEP 7: Preparing Local Environment for Chaos & VLM
# ─────────────────────────────────────

echo ""
echo "[7/8] Preparing Local Environment for Chaos & VLM..."
echo ""

if [ -f "docker-compose.yml" ] || [ -f "docker-compose.yaml" ] || [ -f "compose.yml" ] || [ -f "compose.yaml" ]; then
  COMPOSE_FILE=$(ls docker-compose.yml docker-compose.yaml compose.yml compose.yaml 2>/dev/null | head -1)
  echo "  ✓ Compose file found: $COMPOSE_FILE"
  echo "  [AI ACTION]: Claude Code, execute 'docker-compose up -d' in your sandbox."
  echo "  [AI ACTION]: Run health checks against running containers."
  echo "  [AI ACTION]: Inject chaos (kill containers, simulate network failures) and observe recovery."

  # Extract service names for targeted chaos
  grep -E "^\s+\w+:" "$COMPOSE_FILE" 2>/dev/null | grep -v "#" | sed 's/://;s/^[ ]*/    - Service: /' || true
else
  echo "  ✗ No docker-compose found."
  echo "  [AI ACTION]: Claude Code, generate a mock environment from detected stack."
  echo "  [AI ACTION]: Spin up lightweight test containers for integration testing."
fi

echo ""

# VLM (Vision-Language Model) UI audit prep
if grep -rql $EXTENSIONS 'react\|vue\|svelte\|angular\|next' . 2>/dev/null | grep -v node_modules | head -1 > /dev/null 2>&1; then
  echo "  ✓ Frontend framework detected — VLM UI audit applicable."
  echo "  [AI ACTION]: Claude Code, capture screenshots of key pages."
  echo "  [AI ACTION]: Run VLM analysis for:"
  echo "    - Visual hierarchy and accessibility issues"
  echo "    - Dark pattern detection"
  echo "    - Loading state completeness"
  echo "    - Error state UX validation"
  echo "    - Mobile responsiveness gaps"
else
  echo "  ✗ No frontend framework detected — skipping VLM UI audit."
fi

# ─────────────────────────────────────
# STEP 8: Handing Over to Auto-Healing Engine
# ─────────────────────────────────────

echo ""
echo "[8/8] Handing over to Auto-Healing Engine..."
echo ""
echo "  [AI ACTION]: Resolve false positives via AST parsing."
echo "    - Cross-reference AST findings (Step 6) with grep findings (Steps 2-5)"
echo "    - Deduplicate: AST-confirmed grep hits → elevate severity"
echo "    - AST-only findings → classify independently"
echo "    - Grep-only findings contradicted by AST context → demote to FALSE_POSITIVE"
echo ""
echo "  [AI ACTION]: Generate PRODUCTION_READINESS_REPORT.md with:"
echo "    - Executive summary with overall readiness score"
echo "    - Blockers (CRITICAL) — must fix before deploy"
echo "    - High priority — fix within first sprint post-deploy"
echo "    - Medium — track in backlog"
echo "    - Low — address opportunistically"
echo "    - Executable patches (inline diffs or codemod scripts)"
echo "    - Chaos test results (if environment was available)"
echo "    - VLM UI audit results (if frontend detected)"
echo ""

# ─────────────────────────────────────
# FINAL SUMMARY
# ─────────────────────────────────────

echo ""
echo "============================================"
echo "  VISIONARY SCAN v2 COMPLETE — Summary"
echo "============================================"
echo ""
echo "Total source files: $TOTAL_FILES"
echo ""
echo "Phase 2 — Grep Findings by category:"
echo "─────────────────────────────────────"

TOTAL_FINDINGS=0
METRICS_CATEGORIES=""
for f in /tmp/audit_A*.txt /tmp/audit_B*.txt /tmp/audit_C*.txt /tmp/audit_D*.txt /tmp/audit_E*.txt /tmp/audit_F*.txt /tmp/audit_G*.txt /tmp/audit_H*.txt /tmp/audit_I*.txt /tmp/audit_J*.txt /tmp/audit_K*.txt /tmp/audit_L*.txt /tmp/audit_M*.txt /tmp/audit_N*.txt /tmp/audit_O*.txt /tmp/audit_P*.txt /tmp/audit_Q*.txt /tmp/audit_R*.txt /tmp/audit_S*.txt; do
  if [ -f "$f" ]; then
    count=$(wc -l < "$f")
    TOTAL_FINDINGS=$((TOTAL_FINDINGS + count))
    catname=$(basename "$f" .txt | sed 's/audit_//')
    printf "  %-40s %d\n" "$catname" "$count"
    METRICS_CATEGORIES="${METRICS_CATEGORIES}    \"${catname}\": ${count},\n"
  fi
done

echo ""
echo "Phase 2.5 — AST Candidate Files:"
echo "─────────────────────────────────"

AST_TOTAL=0
for f in /tmp/audit_AST*_candidates.txt; do
  if [ -f "$f" ]; then
    count=$(wc -l < "$f")
    AST_TOTAL=$((AST_TOTAL + count))
    printf "  %-40s %d files\n" "$(basename $f .txt)" "$count"
  fi
done

echo ""
echo "TOTAL GREP FINDINGS TO REVIEW: $TOTAL_FINDINGS"
echo "TOTAL AST CANDIDATE FILES:     $AST_TOTAL"

# ─────────────────────────────────────
# STEP 9A: Delta Comparison (if baseline exists)
# ─────────────────────────────────────

if [ "$HAS_BASELINE" = true ]; then
  echo ""
  echo "─────────────────────────────────"
  echo "  DELTA vs Previous Baseline"
  echo "─────────────────────────────────"

  RESOLVED=0
  PERSISTED=0
  NEW_FINDINGS=0
  for f in /tmp/audit_*[A-S]*.txt; do
    catname=$(basename "$f" .txt | sed 's/audit_//')
    baseline_file="${BASELINE_DIR}/audit_${catname}.txt"
    if [ -f "$baseline_file" ]; then
      # Lines only in current (new findings)
      new_count=$(comm -23 <(sort "$f") <(sort "$baseline_file") | wc -l)
      # Lines only in baseline (resolved)
      resolved_count=$(comm -13 <(sort "$f") <(sort "$baseline_file") | wc -l)
      # Lines in both (persisted)
      persisted_count=$(comm -12 <(sort "$f") <(sort "$baseline_file") | wc -l)
      NEW_FINDINGS=$((NEW_FINDINGS + new_count))
      RESOLVED=$((RESOLVED + resolved_count))
      PERSISTED=$((PERSISTED + persisted_count))
    else
      # All findings are new (no baseline for this category)
      new_count=$(wc -l < "$f")
      NEW_FINDINGS=$((NEW_FINDINGS + new_count))
    fi
  done

  printf "  New findings:      %d\n" "$NEW_FINDINGS"
  printf "  Resolved findings: %d\n" "$RESOLVED"
  printf "  Persisted:         %d\n" "$PERSISTED"
  echo ""
  if [ "$RESOLVED" -gt "$NEW_FINDINGS" ]; then
    echo "  ✓ NET IMPROVEMENT: More findings resolved than introduced"
  elif [ "$RESOLVED" -eq "$NEW_FINDINGS" ]; then
    echo "  ⚠ NET NEUTRAL: Same number resolved as introduced"
  else
    echo "  ✗ NET REGRESSION: More new findings than resolved"
    echo "    → Check for false positives in new findings"
    echo "    → Check if fixes introduced new scan pattern matches (hydra effect)"
  fi
fi

# ─────────────────────────────────────
# STEP 9B: Save Baseline for Next Run
# ─────────────────────────────────────

echo ""
echo "Saving current scan as baseline for next run..."
mkdir -p "${PROJECT_ROOT}/.claude/audit-baseline"
cp /tmp/audit_*[A-S]*.txt "${PROJECT_ROOT}/.claude/audit-baseline/" 2>/dev/null || true
date -u +%Y-%m-%dT%H:%M:%SZ > "${PROJECT_ROOT}/.claude/audit-baseline/scan_date.txt"
echo "  ✓ Baseline saved to .claude/audit-baseline/"

# ─────────────────────────────────────
# STEP 9C: Deterministic Metrics Output
# ─────────────────────────────────────

# Remove trailing comma from metrics categories
METRICS_CATEGORIES_CLEAN=$(printf '%b' "$METRICS_CATEGORIES" | sed '$ s/,$//')

cat > /tmp/audit_metrics.json << METRICS_EOF
{
  "scan_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "scanner_version": "2.0",
  "total_source_files": $TOTAL_FILES,
  "total_grep_findings": $TOTAL_FINDINGS,
  "ast_candidate_files": $AST_TOTAL,
  "has_baseline": $HAS_BASELINE,
  "delta": {
    "new_findings": ${NEW_FINDINGS:-0},
    "resolved_findings": ${RESOLVED:-0},
    "persisted_findings": ${PERSISTED:-0}
  },
  "findings_by_category": {
$(printf '%b' "$METRICS_CATEGORIES_CLEAN")
  }
}
METRICS_EOF

echo ""
echo "  ✓ Machine-readable metrics saved to /tmp/audit_metrics.json"

echo ""
echo "All results saved to:"
echo "  - /tmp/audit_*.txt     (raw grep output)"
echo "  - /tmp/audit_*.jsonl   (context-enriched for AI classification)"
echo "  - /tmp/audit_metrics.json (deterministic scoring inputs)"
echo ""
echo "Next steps:"
echo "  1. Claude Code: Read .jsonl context for each finding BEFORE classifying"
echo "  2. Claude Code: For Category A findings, READ THE FULL FILE — grep misses custom hooks/API patterns"
echo "  3. Claude Code: Use /tmp/audit_metrics.json for DETERMINISTIC scoring (formulas, not estimates)"
echo "  4. Claude Code: Cross-reference with .claude/audit-exclusions.json for known-good patterns"
echo "  5. Claude Code: Run AST traversal on /tmp/audit_AST*_candidates.txt files"
echo "  6. Claude Code: Generate PRODUCTION_READINESS_REPORT.md with executable patches"
echo ""
echo "Finished: $(date)"
