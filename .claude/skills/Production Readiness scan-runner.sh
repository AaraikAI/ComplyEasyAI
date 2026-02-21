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
# STEP 3: Infrastructure checks
# ─────────────────────────────────────

echo ""
echo "[3/4] Running infrastructure checks..."

run_pattern "INFRA_health" "Health check endpoints" \
  "grep -rn $EXTENSIONS -i 'health\|/ping\|/status\|readiness\|liveness' . | grep -v node_modules | grep -v test"

run_pattern "INFRA_cors" "CORS configuration" \
  "grep -rn $EXTENSIONS -i 'cors\|CORS\|Access-Control' . | grep -v node_modules | grep -v test"

run_pattern "INFRA_ratelimit" "Rate limiting" \
  "grep -rn $EXTENSIONS -i 'rateLimit\|rate.limit\|throttle\|RateLimiter' . | grep -v node_modules | grep -v test"

run_pattern "INFRA_security" "Security headers" \
  "grep -rn $EXTENSIONS -i 'helmet\|contentSecurityPolicy\|X-Frame-Options' . | grep -v node_modules | grep -v test"

run_pattern "INFRA_errorhandler" "Global error handling" \
  "grep -rn $EXTENSIONS 'errorHandler\|error.*middleware\|app\.use.*err\|exception_handler' . | grep -v node_modules | grep -v test"

run_pattern "INFRA_pool" "DB connection pooling/retry" \
  "grep -rn $EXTENSIONS -i 'pool\|retry\|reconnect\|connectionLimit' . | grep -v node_modules | grep -v test"

run_pattern "INFRA_shutdown" "Graceful shutdown" \
  "grep -rn $EXTENSIONS 'SIGTERM\|SIGINT\|graceful.*shutdown\|beforeExit\|on_shutdown' . | grep -v node_modules"

run_pattern "INFRA_logging" "Structured logging setup" \
  "grep -rn $EXTENSIONS -i 'winston\|pino\|bunyan\|morgan\|structlog\|loguru\|log4j\|slog\.' . | grep -v node_modules | grep -v test"

# ─────────────────────────────────────
# STEP 4: Summary
# ─────────────────────────────────────

echo ""
echo "============================================"
echo "[4/4] SCAN COMPLETE — Summary"
echo "============================================"
echo ""
echo "Total source files: $TOTAL_FILES"
echo ""
echo "Findings by category:"
echo "─────────────────────"

TOTAL_FINDINGS=0
for f in /tmp/audit_A*.txt /tmp/audit_B*.txt /tmp/audit_C*.txt /tmp/audit_D*.txt /tmp/audit_E*.txt /tmp/audit_F*.txt /tmp/audit_G*.txt /tmp/audit_H*.txt /tmp/audit_I*.txt /tmp/audit_J*.txt /tmp/audit_K*.txt /tmp/audit_INFRA*.txt 2>/dev/null; do
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
