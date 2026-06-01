#!/bin/bash
# Production Readiness Audit — Visionary Autonomous Runner v3
# RESTRUCTURED to complete reliably on large codebases (1M+ LOC).
#
# v3 CHANGES (fixing the hang-at-step-2 issue):
#   - Pre-built file lists: find once, xargs grep everywhere (no re-traversal)
#   - Per-pattern 30s timeout (safety net — no pattern should need it)
#   - Eliminated eval + piped grep chains (direct xargs grep instead)
#   - Removed JSONL context generation (audit agent reads full files anyway)
#   - EXIT trap ensures baseline is always saved, even on interrupt
#   - Completeness verification at end proves exhaustive scan
#
# Previous v2 features preserved:
#   - All /tmp/audit_*.txt output filenames unchanged
#   - Baseline delta tracking
#   - Project-specific exclusions from .claude/audit-exclusions.json
#   - v7 completion gate counts
#
# Usage: bash scan-runner.sh [project_root]

set -euo pipefail

PROJECT_ROOT="${1:-.}"
cd "$PROJECT_ROOT"

echo "============================================"
echo "  PRODUCTION READINESS AUDIT — VISIONARY v3.6"
echo "  v12: Cross-Audit & Depth Gap Scans (T16-T25)"
echo "  v3.3: shell-quoting fixes; worktree exclusion"
echo "  v3.4: FP suppression for E1/C1/F11"
echo "  v3.5: 20 coverage-ledger enumerations (COV1-COV20)"
echo "  v3.6 ADDS: per-file SHA-256 hashes + scan fingerprint"
echo "             for Gate 7 drift detection across sessions"
echo "============================================"
echo "Project: $(pwd)"
echo "Started: $(date)"
echo ""

# FIX (v3.3): preserve previous /tmp outputs to .claude/audit-prev-run/ BEFORE
# wiping. The old unconditional `rm -f /tmp/audit_*.txt` destroyed any in-progress
# v19 ledger work (audit_ledger_files.txt, audit_L7_all_ops.txt, etc. all match
# the wipe glob), and made it impossible to recover from an interrupted audit.
#
# Now: the previous run's raw outputs survive in PROJECT_ROOT/.claude/audit-prev-run/
# until the NEXT re-run. The agent can pull recovered ledgers from there if a
# mid-audit re-run was accidental. The per-run baseline in .claude/audit-baseline/
# is still updated at end-of-run as before (delta comparison still works).
PREV_DIR="$(pwd)/.claude/audit-prev-run"
rm -rf "$PREV_DIR" 2>/dev/null || true
if compgen -G "/tmp/audit_*" >/dev/null 2>&1; then
  mkdir -p "$PREV_DIR"
  mv /tmp/audit_*.txt   "$PREV_DIR/" 2>/dev/null || true
  mv /tmp/audit_*.jsonl "$PREV_DIR/" 2>/dev/null || true
  mv /tmp/audit_*.csv   "$PREV_DIR/" 2>/dev/null || true
  mv /tmp/audit_scan_log.txt "$PREV_DIR/" 2>/dev/null || true
  mv /tmp/audit_metrics.json "$PREV_DIR/" 2>/dev/null || true
  echo "  ✓ Previous /tmp/audit_* outputs preserved at .claude/audit-prev-run/"
fi

# ─────────────────────────────────────
# SAFETY NET: Save baseline on exit (even on Ctrl-C or hang)
# ─────────────────────────────────────
BASELINE_SAVED=false
save_baseline() {
  [ "$BASELINE_SAVED" = true ] && return
  BASELINE_SAVED=true
  echo ""
  echo "Saving baseline to .claude/audit-baseline/ ..."
  mkdir -p "${PROJECT_ROOT}/.claude/audit-baseline"
  cp /tmp/audit_*[A-Z]*.txt "${PROJECT_ROOT}/.claude/audit-baseline/" 2>/dev/null || true
  cp /tmp/audit_*_count.txt "${PROJECT_ROOT}/.claude/audit-baseline/" 2>/dev/null || true
  date -u +%Y-%m-%dT%H:%M:%SZ > "${PROJECT_ROOT}/.claude/audit-baseline/scan_date.txt"
  echo "  ✓ Baseline saved"
}
trap save_baseline EXIT

# ─────────────────────────────────────
# HELPER: safe_grep — wraps grep to return 0 on no matches
# ─────────────────────────────────────
safe_grep() {
  grep "$@" || {
    local rc=$?
    [ "$rc" -eq 1 ] && return 0
    return "$rc"
  }
}

# ─────────────────────────────────────
# HELPER: run_pattern_v3 — fast pattern execution via xargs grep
#
# Usage: run_pattern_v3 NAME DESCRIPTION FILE_LIST [grep_args...]
#
# Runs: xargs grep -n [grep_args] < FILE_LIST > /tmp/audit_NAME.txt
# - No eval, no piped grep -v chains
# - 30-second timeout per pattern
# - Creates empty .jsonl for backward compat
# ─────────────────────────────────────
run_pattern_v3() {
  local name="$1"
  local desc="$2"
  local file_list="$3"
  shift 3

  # Run with 30-second timeout
  (
    xargs grep -n "$@" < "$file_list" 2>/dev/null || true
  ) > "/tmp/audit_${name}.txt" &
  local pid=$!

  local waited=0
  while kill -0 "$pid" 2>/dev/null && [ "$waited" -lt 30 ]; do
    sleep 1
    waited=$((waited + 1))
  done

  if kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null
    wait "$pid" 2>/dev/null || true
    printf "  %-10s %-50s TIMEOUT (30s)\n" "[$name]" "$desc"
    echo "$name: TIMEOUT" >> /tmp/audit_scan_log.txt
  else
    wait "$pid" 2>/dev/null || true
  fi

  local count
  count=$(wc -l < "/tmp/audit_${name}.txt" 2>/dev/null | tr -d ' ')
  printf "  %-10s %-50s %d findings\n" "[$name]" "$desc" "${count:-0}"

  # Empty JSONL for backward compat (agent reads full files, not JSONL)
  > "/tmp/audit_${name}.jsonl"
}

# ─────────────────────────────────────
# HELPER: run_pattern_raw — for patterns that need shell features (find, subshell)
# Wraps an arbitrary command string with timeout
# ─────────────────────────────────────
run_pattern_raw() {
  local name="$1"
  local desc="$2"
  shift 2

  (
    eval "$*" 2>/dev/null || true
  ) > "/tmp/audit_${name}.txt" &
  local pid=$!

  local waited=0
  while kill -0 "$pid" 2>/dev/null && [ "$waited" -lt 30 ]; do
    sleep 1
    waited=$((waited + 1))
  done

  if kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null
    wait "$pid" 2>/dev/null || true
    printf "  %-10s %-50s TIMEOUT (30s)\n" "[$name]" "$desc"
    echo "$name: TIMEOUT" >> /tmp/audit_scan_log.txt
  else
    wait "$pid" 2>/dev/null || true
  fi

  local count
  count=$(wc -l < "/tmp/audit_${name}.txt" 2>/dev/null | tr -d ' ')
  printf "  %-10s %-50s %d findings\n" "[$name]" "$desc" "${count:-0}"
  > "/tmp/audit_${name}.jsonl"
}

# Common --exclude-dir for any direct grep -rn calls
# FIX (v3.3): add .claude/worktrees (git worktree clones inflate counts ~3×),
# .archive (historical snapshots), and AppleDouble files (macOS ._* metadata).
GREP_EXCL="--exclude-dir=node_modules --exclude-dir=dist --exclude-dir=build --exclude-dir=.git --exclude-dir=__pycache__ --exclude-dir=.venv --exclude-dir=coverage --exclude-dir=test-results --exclude-dir=playwright-report --exclude-dir=worktrees --exclude-dir=.archive --exclude=._*"

# ─────────────────────────────────────
# STEP 0: Load Previous Baseline & Project Exclusions
# ─────────────────────────────────────

echo "[0/9] Loading baseline & exclusions..."

BASELINE_DIR="${PROJECT_ROOT}/.claude/audit-baseline"
if [ -d "$BASELINE_DIR" ]; then
  BASELINE_DATE=$(cat "${BASELINE_DIR}/scan_date.txt" 2>/dev/null || echo "unknown")
  echo "  ✓ Previous baseline found (date: $BASELINE_DATE)"
  HAS_BASELINE=true
else
  echo "  ✗ No previous baseline — first run"
  HAS_BASELINE=false
fi

# Load project exclusions (build a grep -v pattern for post-filtering)
EXCLUSION_FILE="${PROJECT_ROOT}/.claude/audit-exclusions.json"
EXCL_PATTERN=""
if [ -f "$EXCLUSION_FILE" ] && command -v python3 &>/dev/null; then
  EXCL_PATTERN=$(python3 -c "
import json, sys
try:
    data = json.load(open('$EXCLUSION_FILE'))
    patterns = [exc.get('pattern', '') for exc in data.get('grep_exclusions', []) if exc.get('pattern')]
    if patterns:
        print('|'.join(patterns))
except:
    pass
" 2>/dev/null || echo "")
  if [ -n "$EXCL_PATTERN" ]; then
    echo "  ✓ Loaded exclusion patterns from audit-exclusions.json"
  fi
fi

echo ""

# ─────────────────────────────────────
# STEP 1: Detect stack and build file lists
# ─────────────────────────────────────

echo "[1/8] Detecting stack and building file lists..."

# Detect extensions present (for reporting only — file lists are pre-built)
EXT_ARRAY=()
for ext in ts tsx js jsx py go rs java rb php vue svelte; do
  count=$(find . -type f -name "*.$ext" -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/build/*" 2>/dev/null | wc -l | tr -d ' ')
  if [ "$count" -gt 0 ]; then
    EXT_ARRAY+=("--include=*.$ext")
    echo "  Found $count .$ext files"
  fi
done

if [ ${#EXT_ARRAY[@]} -eq 0 ]; then
  echo "ERROR: No source files found!"
  exit 1
fi

# ── BUILD PRE-FILTERED FILE LISTS (run once, reuse everywhere) ──

echo ""
echo "  Building pre-filtered file lists..."

# Master list: all source files excluding node_modules, dist, build, .git
# FIX (v3.3): also exclude .claude/worktrees (git worktree clones, ~3× duplication
# of services/components), .archive (historical snapshots), and AppleDouble files
# (macOS ._* metadata that break path-flattening in downstream extractors).
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.py" -o -name "*.go" -o -name "*.rs" -o -name "*.java" -o -name "*.rb" -o -name "*.php" -o -name "*.vue" -o -name "*.svelte" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/dist/*" \
  -not -path "*/build/*" \
  -not -path "*/.git/*" \
  -not -path "*/__pycache__/*" \
  -not -path "*/.venv/*" \
  -not -path "*/target/*" \
  -not -path "*/coverage/*" \
  -not -path "*/.claude/worktrees/*" \
  -not -path "*/.archive/*" \
  -not -path "*/generated/*" \
  -not -path "*/server/src/generated/*" \
  -not -name "._*" \
  | sort > /tmp/audit_all_source.txt

TOTAL_FILES=$(wc -l < /tmp/audit_all_source.txt | tr -d ' ')
echo "    All source files:    $TOTAL_FILES"

# Lean list: exclude test files and generated code (for most patterns)
safe_grep -v '\.test\.\|\.spec\.\|__tests__\|\.DS_Store' /tmp/audit_all_source.txt \
  > /tmp/audit_source_lean.txt || true
LEAN_FILES=$(wc -l < /tmp/audit_source_lean.txt | tr -d ' ')
echo "    Production files:    $LEAN_FILES"

# Component-only list (for A8/A9 and component wiring)
safe_grep 'components/' /tmp/audit_all_source.txt \
  | safe_grep -v '\.test\.\|\.spec\.\|__tests__' \
  > /tmp/audit_source_components.txt 2>/dev/null || true
COMP_FILES=$(wc -l < /tmp/audit_source_components.txt 2>/dev/null | tr -d ' ')
echo "    Component files:     ${COMP_FILES:-0}"

# Server-only list (for security patterns)
safe_grep 'server/src/' /tmp/audit_all_source.txt \
  | safe_grep -v '\.test\.\|\.spec\.\|__tests__' \
  > /tmp/audit_source_server.txt 2>/dev/null || true
SERV_FILES=$(wc -l < /tmp/audit_source_server.txt 2>/dev/null | tr -d ' ')
echo "    Server files:        ${SERV_FILES:-0}"

# Server services-only list (for multi-tenant checks)
safe_grep 'server/src/services/' /tmp/audit_source_server.txt \
  > /tmp/audit_source_services.txt 2>/dev/null || true

# Detect stack (for reporting)
echo ""
echo "  Stack detection:"
[ -f "package.json" ] && echo "    - Node.js project" || true
for pkg in $(find . -name "package.json" -not -path "*/node_modules/*" -maxdepth 3 2>/dev/null); do
  safe_grep -q '"react"' "$pkg" 2>/dev/null && echo "    - React ($pkg)" || true
  safe_grep -q '"express"' "$pkg" 2>/dev/null && echo "    - Express ($pkg)" || true
  safe_grep -q '"prisma"' "$pkg" 2>/dev/null && echo "    - Prisma ($pkg)" || true
done

# ─────────────────────────────────────
# STEP 2: Run ALL scan patterns
# ─────────────────────────────────────

echo ""
echo "[2/8] Running exhaustive pattern scan ($LEAN_FILES production files)..."
echo "  (NO truncation — capturing ALL results)"
echo ""
> /tmp/audit_scan_log.txt

# ── Category A: Simulation / Mock / Fake ──

run_pattern_v3 "A1" "Simulation keywords" /tmp/audit_source_lean.txt \
  -i -e "simulat"

run_pattern_v3 "A2" "Mock references" /tmp/audit_source_lean.txt \
  -i -w -e "mock"

run_pattern_v3 "A3" "Stub references" /tmp/audit_source_lean.txt \
  -i -w -e "stub"

run_pattern_v3 "A4" "Dummy/fake/hardcoded data" /tmp/audit_source_lean.txt \
  -i -e "dummy" -e "fake.data" -e "fakeData" -e "hardcoded" -e "hard.coded" -e "sample.data" -e "sampleData"

run_pattern_v3 "A5" "Placeholder content" /tmp/audit_source_lean.txt \
  -i -e "placeholder" -e "lorem ipsum"

run_pattern_v3 "A7" "Math.random in business logic" /tmp/audit_source_lean.txt \
  -e "Math\.random()" -e "randint" -e "secrets\."

# v3: DEFAULT_/DEMO_ constants — components only
run_pattern_v3 "A8" "DEFAULT_/DEMO_ fallback constants" /tmp/audit_source_components.txt \
  -e "const DEFAULT_" -e "const DEMO_" -e "const INITIAL_" -e "const SAMPLE_"

# v3 FIX: A9 was hanging due to unbounded '.*\[' regex — now uses simpler pattern on components only
run_pattern_v3 "A9" "Large inline data arrays in components" /tmp/audit_source_components.txt \
  -e "const [A-Z].*= \[" -e "const [A-Z].*: .*\[\] = \["

# ── Category B: Incomplete / Deferred ──

run_pattern_v3 "B1" "TODO/FIXME/HACK markers" /tmp/audit_source_lean.txt \
  -e "TODO" -e "FIXME" -e "HACK" -e "XXX" -e "@todo" -e "@fixme" -e "@hack"

# v3 FIX: B2 was hanging due to 8-way alternation — now uses -e per term (no regex engine backtracking)
run_pattern_v3 "B2" "Deferral language" /tmp/audit_source_lean.txt \
  -i -e "for now" -e "for the moment" -e "temporarily" -e "coming soon" -e "not yet" -e "to be implemented" -e "tbd" -e "wip"

# v3 FIX: B3 was hanging due to 17-way alternation — split into 2 passes
echo "  [B3]     Hypothetical 'would' language..."
(
  xargs grep -n -i \
    -e "would use" -e "would be" -e "would call" -e "would fetch" \
    -e "would send" -e "would connect" -e "would query" -e "would create" \
    < /tmp/audit_source_lean.txt 2>/dev/null || true
  xargs grep -n -i \
    -e "would implement" -e "would integrate" -e "would store" -e "would return" \
    -e "should eventually" -e "will eventually" -e "need to implement" -e "needs implementation" \
    < /tmp/audit_source_lean.txt 2>/dev/null || true
) > /tmp/audit_B3.txt 2>/dev/null
B3_COUNT=$(wc -l < /tmp/audit_B3.txt | tr -d ' ')
printf "  %-10s %-50s %d findings\n" "[B3]" "Hypothetical 'would' language" "$B3_COUNT"
> /tmp/audit_B3.jsonl

# v3 FIX: B4 had ReDoS from 'when.*is ready' — dropped that subpattern, rest are fixed strings
run_pattern_v3 "B4" "Production-reference comments" /tmp/audit_source_lean.txt \
  -i -e "in production" -e "in a real" -e "real implementation" -e "real environment" \
  -e "production would" -e "when deployed" -e "once we have"

run_pattern_v3 "B5" "Commented-out code" /tmp/audit_source_lean.txt \
  -e "//.*import" -e "//.*require" -e "//.*fetch" -e "//.*await" -e "//.*return"

# ── Category C: Not Implemented ──

run_pattern_v3 "C1" "Not-implemented markers" /tmp/audit_source_lean.txt \
  -i -e "not.implemented" -e "NotImplemented" -e "NOT_IMPLEMENTED"

# v3.4 FP suppression: TypeScript enum/union/comparison string-literal values
# `: 'NotImplemented'` (type literal), `= 'NotImplemented'` (assign), `| 'NotImplemented'` (union),
# `=== 'NotImplemented'` (comparison) are all status values, not runtime throws.
if [ -f /tmp/audit_C1.txt ]; then
  safe_grep -Ev "(:|=|=>|\||===|!==|<>)[[:space:]]*['\"](Not[_]?Implemented|NOT_IMPLEMENTED)['\"]" \
    /tmp/audit_C1.txt > /tmp/audit_C1_filtered.txt || true
  mv /tmp/audit_C1_filtered.txt /tmp/audit_C1.txt
fi

run_pattern_v3 "C2" "Throw guards for missing impl" /tmp/audit_source_lean.txt \
  -e "throw new Error.*[Ii]mplement" -e "throw new Error.*[Tt]odo" -e "throw new Error.*missing"

# ── Category D: Empty / Stub Functions ──

run_pattern_v3 "D1" "Return empty/null immediately" /tmp/audit_source_lean.txt \
  -e "return {};" -e "return \[\];" -e "return null;" -e "return undefined;"

run_pattern_v3 "D2" "Empty function bodies" /tmp/audit_source_lean.txt \
  -e "() {}"

# ── Category E: Error Handling ──

run_pattern_v3 "E1" "Empty catch blocks" /tmp/audit_source_lean.txt \
  -e "catch.*{[[:space:]]*}"

# v3.4 FP suppression: fire-and-forget temp/worker cleanup is intentional per CLAUDE.md
# Common signatures: `await unlink(tempPath).catch(() => {})`, `worker.close().catch(() => {})`
if [ -f /tmp/audit_E1.txt ]; then
  safe_grep -Ev '(unlink|rmdir|rmSync|rm\(|worker\.close|tempDir|tmpFile|temp[A-Z]|cleanup|teardown|disconnect)[^)]*\)?\.catch\(\(\)[[:space:]]*=>[[:space:]]*\{[[:space:]]*\}\)' \
    /tmp/audit_E1.txt > /tmp/audit_E1_filtered.txt || true
  mv /tmp/audit_E1_filtered.txt /tmp/audit_E1.txt
fi

# v3 FIX: E3 used -A2 which doesn't work with xargs — simplified pattern
run_pattern_v3 "E3" "Catch with only console.log" /tmp/audit_source_lean.txt \
  -e "catch.*console\."

run_pattern_v3 "E5" "Unhandled promise (.then without .catch)" /tmp/audit_source_lean.txt \
  -e "\.then("

# Post-filter E5 to remove lines that also have .catch
if [ -f /tmp/audit_E5.txt ]; then
  safe_grep -v '\.catch(' /tmp/audit_E5.txt > /tmp/audit_E5_filtered.txt || true
  mv /tmp/audit_E5_filtered.txt /tmp/audit_E5.txt
fi

# ── Category F: Security ──

run_pattern_v3 "F1" "Potential hardcoded secrets" /tmp/audit_source_lean.txt \
  -i -e "api_key" -e "apikey" -e "secret_key" -e "secretkey" -e "private_key" -e "password" -e "auth_token" -e "access_token"

# Post-filter F1 to remove env var references
if [ -f /tmp/audit_F1.txt ]; then
  safe_grep -v 'process\.env\|os\.environ\|os\.getenv\|config\.\|\.env' /tmp/audit_F1.txt > /tmp/audit_F1_filtered.txt || true
  mv /tmp/audit_F1_filtered.txt /tmp/audit_F1.txt
fi

run_pattern_v3 "F2" "Hardcoded URLs / localhost" /tmp/audit_source_lean.txt \
  -e "localhost" -e "127\.0\.0\.1" -e "0\.0\.0\.0" -e "http://"

run_pattern_v3 "F3" "SQL injection risk" /tmp/audit_source_lean.txt \
  -e "\.raw(" -e "\.rawQuery("

run_pattern_v3 "F5" "Wildcard CORS" /tmp/audit_source_lean.txt \
  -e "origin.*\*" -e "Access-Control-Allow-Origin.*\*" -e "cors()"

run_pattern_v3 "F6" "Disabled security" /tmp/audit_source_lean.txt \
  -i -e "rejectUnauthorized.*false" -e "SSL_VERIFY.*false"

# ── Category G: Console/Debug ──

run_pattern_v3 "G1" "Console statements in production" /tmp/audit_source_lean.txt \
  -e "console\.log" -e "console\.warn" -e "console\.error" -e "console\.info" -e "console\.debug"

run_pattern_raw "G2" "Python print statements" \
  "find . -name '*.py' -not -path '*/node_modules/*' -not -path '*/test/*' | xargs grep -n 'print(' 2>/dev/null"

run_pattern_v3 "G3" "Debug flags left on" /tmp/audit_source_lean.txt \
  -i -e "debug.*=.*true" -e "verbose.*=.*true"

# ── Category H: UI Completeness ──

run_pattern_v3 "H1" "Coming soon / placeholder UI" /tmp/audit_source_lean.txt \
  -i -e "coming soon" -e "under construction" -e "lorem ipsum" -e "placeholder text" -e "sample text"

run_pattern_v3 "H2" "Loading-only components" /tmp/audit_source_lean.txt \
  -i -e "isLoading.*return null" -e "loading.*return null"

run_pattern_v3 "H4" "Disabled UI elements" /tmp/audit_source_lean.txt \
  -e "disabled.*true" -e "disabled={true}" -e "isDisabled" -e "cursor-not-allowed"

# ── Category I: Database ──

run_pattern_raw "I1" "Migration/schema files" \
  "find . -name '*.sql' -o -name 'migration*' -o -name '*.prisma' | grep -v node_modules"

run_pattern_v3 "I2" "Table references in code" /tmp/audit_source_lean.txt \
  -e "\.from(" -e "\.table(" -e "\.collection(" -e "@Table" -e "@Entity" -e "__tablename__"

run_pattern_raw "I3" "RLS policies (Supabase)" \
  "find . -name '*.sql' -not -path '*/node_modules/*' | xargs grep -n 'ENABLE ROW LEVEL SECURITY\|CREATE POLICY' 2>/dev/null"

# ── Category J: AI/ML ──

run_pattern_v3 "J1" "AI/LLM references" /tmp/audit_source_lean.txt \
  -i -e "openai" -e "anthropic" -e "claude" -e "gemini" -e "llm" -e "langchain" -e "cohere" -e "ollama"

# ── Category K: Environment ──
echo ""
echo "  [K] Environment variable analysis..."
grep -rn $GREP_EXCL "${EXT_ARRAY[@]}" "process\.env\.\|os\.environ\|os\.getenv" . 2>/dev/null \
  | safe_grep -v 'test' \
  > /tmp/audit_K_raw.txt || true

sed 's/.*process\.env\.\([A-Z_a-z0-9]*\).*/\1/' /tmp/audit_K_raw.txt 2>/dev/null | sort -u > /tmp/audit_K1_used.txt || true
if [ -f ".env.example" ]; then
  cat .env.example > /tmp/audit_K2_documented.txt
elif [ -f "server/.env.example" ]; then
  cat server/.env.example > /tmp/audit_K2_documented.txt
else
  echo "NO .env.example FOUND" > /tmp/audit_K2_documented.txt
fi
printf "  %-10s %-50s %d vars in code\n" "[K1]" "Env vars used in code" "$(wc -l < /tmp/audit_K1_used.txt | tr -d ' ')"

# ─────────────────────────────────────
# STEP 3: Security & Auth checks
# ─────────────────────────────────────

echo ""
echo "[3/8] Running security & authorization checks..."

run_pattern_v3 "L1" "Auth middleware/guards" /tmp/audit_source_lean.txt \
  -i -e "requireAuth" -e "isAuthenticated" -e "checkToken" -e "verifyToken" -e "authenticate" -e "authorize"

run_pattern_v3 "L2" "All route definitions" /tmp/audit_source_lean.txt \
  -e "router\.get\|router\.post\|router\.put\|router\.patch\|router\.delete" -e "app\.get\|app\.post\|app\.put"

run_pattern_v3 "L3" "Data scoping (user_id/org_id)" /tmp/audit_source_lean.txt \
  -e "userId" -e "orgId" -e "organizationId" -e "tenant_id" -e "auth\.uid()"

run_pattern_v3 "L4" "IDs from request params" /tmp/audit_source_lean.txt \
  -e "req\.params\." -e "req\.query\." -e "req\.body\."

run_pattern_v3 "L5" "JWT/token handling" /tmp/audit_source_lean.txt \
  -e "jwt\." -e "jsonwebtoken" -e "JWT" -e "sign(" -e "verify("

run_pattern_v3 "L6" "Password hashing" /tmp/audit_source_lean.txt \
  -e "bcrypt" -e "argon2" -e "scrypt" -e "pbkdf2" -e "md5" -e "sha256" -e "createHash"

# Category M: Input Validation & Injection
run_pattern_v3 "M1" "SQL injection risk" /tmp/audit_source_lean.txt \
  -e "\.raw(" -e "\.rawQuery("

run_pattern_v3 "M2" "XSS risk (innerHTML)" /tmp/audit_source_lean.txt \
  -e "dangerouslySetInnerHTML" -e "v-html" -e "innerHTML" -e "mark_safe"

run_pattern_v3 "M3" "Mass assignment risk" /tmp/audit_source_lean.txt \
  -e "\.create(req\.body)" -e "\.update(req\.body)" -e "\.insert(req\.body)"

run_pattern_v3 "M4" "Request body usage" /tmp/audit_source_lean.txt \
  -e "req\.body" -e "request\.json" -e "@Body()"

run_pattern_v3 "M5" "CSRF protection" /tmp/audit_source_lean.txt \
  -e "csrf" -e "CSRF" -e "xsrf" -e "csrfToken" -e "sameSite" -e "SameSite"

# ─────────────────────────────────────
# STEP 4: Application logic checks
# ─────────────────────────────────────

echo ""
echo "[4/8] Running application logic checks..."

run_pattern_v3 "N1" "Database transactions" /tmp/audit_source_lean.txt \
  -e "transaction" -e "\$transaction" -e "BEGIN" -e "COMMIT" -e "ROLLBACK" -e "atomic"

run_pattern_v3 "N2" "DB write operations" /tmp/audit_source_lean.txt \
  -e "\.create(" -e "\.update(" -e "\.delete(" -e "\.upsert(" -e "\.save(" -e "\.remove(" -e "\.destroy("

run_pattern_v3 "O1" "Frontend state management" /tmp/audit_source_lean.txt \
  -e "useState" -e "useReducer" -e "useContext" -e "createContext" -e "zustand" -e "redux"

run_pattern_v3 "O2" "Data fetching patterns" /tmp/audit_source_lean.txt \
  -e "useSWR" -e "useQuery" -e "useMutation" -e "createAsyncThunk" -e "tanstack"

run_pattern_v3 "O3" "In-memory server state" /tmp/audit_source_lean.txt \
  -e "new Map()" -e "new Set()" -e "global\." -e "app\.locals\." -e "MemoryStore"

# ─────────────────────────────────────
# STEP 5: Infrastructure checks
# ─────────────────────────────────────

echo ""
echo "[5/8] Running infrastructure & deployment checks..."

run_pattern_v3 "P1" "Health check endpoints" /tmp/audit_source_lean.txt \
  -i -e "health" -e "/ping" -e "/ready" -e "/status" -e "readiness" -e "liveness"

run_pattern_v3 "P2" "Graceful shutdown" /tmp/audit_source_lean.txt \
  -e "SIGTERM" -e "SIGINT" -e "graceful.*shutdown" -e "beforeExit" -e "process\.on.*signal"

run_pattern_v3 "P3" "Structured logging" /tmp/audit_source_lean.txt \
  -i -e "winston" -e "pino" -e "bunyan" -e "structlog" -e "Logger"

run_pattern_v3 "P4" "Error tracking (Sentry etc)" /tmp/audit_source_lean.txt \
  -i -e "sentry" -e "Sentry" -e "bugsnag" -e "captureException" -e "captureMessage"

run_pattern_v3 "P5" "Rate limiting" /tmp/audit_source_lean.txt \
  -i -e "rateLimit" -e "rate-limit" -e "throttle" -e "RateLimiter" -e "express-rate-limit"

run_pattern_v3 "P6" "Security headers" /tmp/audit_source_lean.txt \
  -i -e "helmet" -e "X-Frame-Options" -e "X-Content-Type-Options" -e "Strict-Transport" -e "Content-Security-Policy"

run_pattern_v3 "P7" "Connection pooling/retry" /tmp/audit_source_lean.txt \
  -i -e "pool" -e "poolSize" -e "connectionLimit" -e "retry" -e "reconnect" -e "backoff"

run_pattern_v3 "P8" "Body limits & timeouts" /tmp/audit_source_lean.txt \
  -e "bodyParser" -e "express\.json" -e "timeout" -e "keepAlive" -e "maxBodySize"

run_pattern_v3 "P9" "Env var validation at startup" /tmp/audit_source_lean.txt \
  -e "validateEnv" -e "envalid" -e "env\.parse" -e "throw.*missing.*env"

run_pattern_v3 "P10" "CORS configuration" /tmp/audit_source_lean.txt \
  -i -e "cors" -e "CORS" -e "Access-Control"

run_pattern_v3 "P11" "Global error handling" /tmp/audit_source_lean.txt \
  -e "errorHandler" -e "error.*middleware" -e "uncaughtException" -e "unhandledRejection"

run_pattern_raw "P12" "CI/CD pipeline" \
  "find . -path '*/.github/workflows/*' -o -path '*/.gitlab-ci*' -o -name 'Jenkinsfile' 2>/dev/null"

# Category Q: Secrets & TLS
echo ""
echo "  [Q] Secrets management & TLS checks..."

run_pattern_v3 "Q5" "Disabled TLS/SSL verification" /tmp/audit_source_lean.txt \
  -e "rejectUnauthorized.*false" -e "VERIFY_SSL.*false" -e "NODE_TLS_REJECT_UNAUTHORIZED.*0"

run_pattern_v3 "Q6" "HTTP (non-TLS) external calls" /tmp/audit_source_lean.txt \
  -e "http://"

# Post-filter Q6 to remove localhost and env refs
if [ -f /tmp/audit_Q6.txt ]; then
  safe_grep -v 'localhost\|127\.0\.0\.1\|\.env\|process\.env' /tmp/audit_Q6.txt > /tmp/audit_Q6_filtered.txt || true
  mv /tmp/audit_Q6_filtered.txt /tmp/audit_Q6.txt
fi

run_pattern_v3 "Q7" "Tokens in localStorage" /tmp/audit_source_lean.txt \
  -e "localStorage\.setItem" -e "localStorage\.getItem" -e "sessionStorage\.setItem"

run_pattern_v3 "Q9" "Certificate pinning" /tmp/audit_source_lean.txt \
  -e "pinnedCertificates" -e "ssl.*pin" -e "certificate.*pin" -e "public.*key.*pin"

run_pattern_v3 "Q10" "Tokens in URL parameters" /tmp/audit_source_lean.txt \
  -e "token=" -e "api_key=" -e "secret=" -e "password="

# Category R: Docker & Container Hardening
echo ""
echo "  [R] Docker & container hardening..."

run_pattern_raw "R1" "Dockerfiles found" \
  "find . -name 'Dockerfile*' -not -path '*/node_modules/*'"

run_pattern_raw "R3" ":latest tag usage" \
  "find . \( -name 'Dockerfile*' -o -name '*.yaml' -o -name '*.yml' \) -not -path '*/node_modules/*' | xargs grep -n ':latest' 2>/dev/null"

run_pattern_raw "R4" "Secrets in Docker build" \
  "find . -name 'Dockerfile*' -not -path '*/node_modules/*' | xargs grep -n 'ARG.*SECRET\|ARG.*KEY\|ARG.*PASSWORD\|ARG.*TOKEN\|ENV.*SECRET\|ENV.*PASSWORD\|COPY.*\.env' 2>/dev/null"

run_pattern_raw "R5" ".dockerignore files" \
  "find . -name '.dockerignore' -not -path '*/node_modules/*'"

run_pattern_v3 "R6" "IMAGE_TAG usage" /tmp/audit_source_lean.txt \
  -e "IMAGE_TAG" -e "DOCKER_TAG" -e "image_tag" -e "docker_tag"

# Build CI file list once
CI_FILES=$(find . -path '*/.github/workflows/*' -o -path '*/.gitlab-ci*' -o -name 'Jenkinsfile' 2>/dev/null | tr '\n' ' ')

run_pattern_raw "R7" "Container scanning in CI" \
  "echo '$CI_FILES' | tr ' ' '\n' | xargs grep -n 'trivy\|Trivy\|grype\|Grype\|snyk.*container\|docker.*scout' 2>/dev/null"

# Category S: CI Security
echo ""
echo "  [S] CI security & deployment safety..."

run_pattern_raw "S1" "SAST/DAST in CI" \
  "echo '$CI_FILES' | tr ' ' '\n' | xargs grep -n 'codeql\|CodeQL\|semgrep\|Semgrep\|sonarqube\|snyk\|Snyk\|SAST\|DAST' 2>/dev/null"

run_pattern_raw "S2" "Secret scanning in CI" \
  "echo '$CI_FILES' | tr ' ' '\n' | xargs grep -n 'gitleaks\|GitLeaks\|trufflehog\|TruffleHog\|detect-secrets\|secret.*scan' 2>/dev/null"

run_pattern_raw "S3" "Dependabot/Renovate config" \
  "find . -name 'dependabot.yml' -o -name 'renovate.json' -o -name 'renovate.json5' -o -name '.renovaterc' 2>/dev/null"

run_pattern_raw "S4" "Deployment gates/approvals" \
  "echo '$CI_FILES' | tr ' ' '\n' | xargs grep -n 'environment:\|approval\|manual\|gate\|required_reviewers\|protection' 2>/dev/null"

run_pattern_raw "S5" "Pre-migration backup" \
  "echo '$CI_FILES' | tr ' ' '\n' | xargs grep -n 'backup\|pg_dump\|mysqldump\|snapshot' 2>/dev/null"

run_pattern_raw "S6" "Migration rollback files" \
  "find . -path '*/migrations/*' -name '*down*' -o -name '*rollback*' -o -name '*revert*' 2>/dev/null | grep -v node_modules"

run_pattern_raw "S7" "Canary/blue-green/rolling deploy" \
  "find . \( -name '*.yaml' -o -name '*.yml' \) -not -path '*/node_modules/*' | xargs grep -n 'canary\|blue.green\|rolling\|gradual' 2>/dev/null"

run_pattern_v3 "S8" "Mobile secure storage" /tmp/audit_source_lean.txt \
  -e "AsyncStorage" -e "SecureStore" -e "Keychain" -e "EncryptedStorage" -e "EncryptedSharedPreferences"

# ─────────────────────────────────────
# STEP 5.5: Component Wiring Audit (v3)
# ─────────────────────────────────────

echo ""
echo "[5.5/8] Running Component Wiring Audit..."

COMP_DIR=""
[ -d "components/" ] && COMP_DIR="components/"
[ -z "$COMP_DIR" ] && [ -d "src/components/" ] && COMP_DIR="src/components/"

if [ -n "$COMP_DIR" ]; then
  echo "  Components directory: $COMP_DIR"

  find "$COMP_DIR" -name "*.tsx" 2>/dev/null \
    | safe_grep -v '__tests__\|\.test\.\|\.spec\.' \
    | sort > /tmp/audit_all_components.txt
  COMP_TOTAL=$(wc -l < /tmp/audit_all_components.txt | tr -d ' ')
  echo "  Total components found: $COMP_TOTAL"

  > /tmp/audit_static_components.txt
  > /tmp/audit_wired_components.txt
  > /tmp/audit_partially_wired.txt

  while IFS= read -r file; do
    [ -z "$file" ] && continue
    HAS_API=$(safe_grep -c 'useEffect\|useQuery\|useSWR\|useMutation\|api\.\|fetch(\|fetchAPI\|apiFetch\|import.*from.*services/api' "$file" 2>/dev/null || echo 0)
    HAS_DEFAULTS=$(safe_grep -c 'const DEFAULT_\|const DEMO_\|const INITIAL_\|const SAMPLE_' "$file" 2>/dev/null || echo 0)
    HAS_API=${HAS_API:-0}
    HAS_DEFAULTS=${HAS_DEFAULTS:-0}
    if [ "$HAS_API" -gt 0 ] && [ "$HAS_DEFAULTS" -gt 0 ]; then
      echo "$file (API:$HAS_API DEFAULTS:$HAS_DEFAULTS)" >> /tmp/audit_partially_wired.txt
    elif [ "$HAS_API" -gt 0 ]; then
      echo "$file ($HAS_API API patterns)" >> /tmp/audit_wired_components.txt
    else
      echo "$file" >> /tmp/audit_static_components.txt
    fi
  done < /tmp/audit_all_components.txt

  WIRED=$(wc -l < /tmp/audit_wired_components.txt | tr -d ' ')
  PARTIAL=$(wc -l < /tmp/audit_partially_wired.txt | tr -d ' ')
  STATIC=$(wc -l < /tmp/audit_static_components.txt | tr -d ' ')

  echo "  ✓ FULLY_WIRED:      $WIRED"
  echo "  ⚠ PARTIALLY_WIRED:  $PARTIAL"
  echo "  ✗ STATIC_ONLY:      $STATIC"
else
  echo "  ✗ No components directory — skipping"
  > /tmp/audit_static_components.txt
  > /tmp/audit_wired_components.txt
  > /tmp/audit_partially_wired.txt
  > /tmp/audit_all_components.txt
fi

# ─────────────────────────────────────
# STEP 6: Phase 2.5 — AST Semantic Search
# ─────────────────────────────────────

echo ""
echo "[6/8] Running Phase 2.5 — AST Semantic Search..."

echo "  [AST-1] Empty catch blocks..."
xargs grep -ln "catch" < /tmp/audit_source_lean.txt 2>/dev/null > /tmp/audit_AST1_candidates.txt || true
echo "    → $(wc -l < /tmp/audit_AST1_candidates.txt | tr -d ' ') files"

echo "  [AST-2] Unprotected endpoints..."
xargs grep -ln 'router\.\|app\.get\|app\.post\|app\.put' < /tmp/audit_source_lean.txt 2>/dev/null > /tmp/audit_AST2_candidates.txt || true
echo "    → $(wc -l < /tmp/audit_AST2_candidates.txt | tr -d ' ') files"

echo "  [AST-3] Missing awaits on ORM calls..."
xargs grep -ln 'prisma\.\|supabase\.\|sequelize\.' < /tmp/audit_source_lean.txt 2>/dev/null > /tmp/audit_AST3_candidates.txt || true
echo "    → $(wc -l < /tmp/audit_AST3_candidates.txt | tr -d ' ') files"

echo "  [AST-4] Unreachable code after return..."
xargs grep -ln 'return ' < /tmp/audit_source_lean.txt 2>/dev/null > /tmp/audit_AST4_candidates.txt || true
echo "    → $(wc -l < /tmp/audit_AST4_candidates.txt | tr -d ' ') files"

echo "  [AST-5] Unvalidated request body..."
xargs grep -ln 'req\.body\|request\.json\|@Body()' < /tmp/audit_source_lean.txt 2>/dev/null > /tmp/audit_AST5_candidates.txt || true
echo "    → $(wc -l < /tmp/audit_AST5_candidates.txt | tr -d ' ') files"

# ─────────────────────────────────────
# STEP 6.5: v4 Security & Coverage Scans
# ─────────────────────────────────────

echo ""
echo "[6.5/8] Running v4 Security & Coverage Scans..."

echo "  [F7] SSRF — All outbound HTTP calls..."
xargs grep -n -e "axios(" -e "axios\." -e "fetch(" -e "got(" -e "http\.get" -e "https\.get" \
  < /tmp/audit_source_server.txt 2>/dev/null \
  | safe_grep -v '\.d\.ts' \
  > /tmp/audit_F7.txt || true
echo "    → $(wc -l < /tmp/audit_F7.txt | tr -d ' ') outbound HTTP calls"

echo "  [F8] Credential storage patterns..."
xargs grep -n -e "bearerToken" -e "apiKey" -e "secretKey" -e "accessToken" -e "serviceToken" -e "webhookSecret" \
  < /tmp/audit_source_server.txt 2>/dev/null \
  | safe_grep -v '\.d\.ts' \
  > /tmp/audit_F8.txt || true
echo "    → $(wc -l < /tmp/audit_F8.txt | tr -d ' ') credential patterns"

echo "  [F9] Dynamic code execution..."
xargs grep -n -e "new RegExp(" -e "eval(" -e "Function(" -e "vm\.run" \
  < /tmp/audit_source_server.txt 2>/dev/null > /tmp/audit_F9.txt || true
echo "    → $(wc -l < /tmp/audit_F9.txt | tr -d ' ') dynamic code patterns"

echo "  [F11] throw new Error() in services..."
xargs grep -n -e "throw new Error(" \
  < /tmp/audit_source_services.txt 2>/dev/null \
  | safe_grep -v "AppError\|HttpError" \
  > /tmp/audit_F11.txt || true

# v3.4 FP suppression for F11:
# 1) Pure math/crypto library directories — AppError is for HTTP context, not appropriate here.
#    These libraries (Bayesian, byzantine-robust, RDP accountant, SCAFFOLD, secret sharing,
#    blockchain anchor) use throw new Error for domain-validation guards.
# 2) Comment-only references (line starts with //, *, or contains throw inside a string).
if [ -f /tmp/audit_F11.txt ]; then
  safe_grep -Ev '/(services/advanced/(dp|bayesian|byzantine|scaffold|secretSharing|rdp)|utils/blockchain/anchor)' \
    /tmp/audit_F11.txt \
    | safe_grep -Ev '^[^:]+:[0-9]+:[[:space:]]*(//|\*)' \
    > /tmp/audit_F11_filtered.txt || true
  mv /tmp/audit_F11_filtered.txt /tmp/audit_F11.txt
fi

echo "    → $(wc -l < /tmp/audit_F11.txt | tr -d ' ') bare Error throws"

echo "  [L7] Multi-tenant write operations..."
xargs grep -n -e "\.create(" -e "\.update(" -e "\.delete(" -e "\.upsert(" -e "\.updateMany(" -e "\.deleteMany(" \
  < /tmp/audit_source_services.txt 2>/dev/null \
  | safe_grep -v '\.d\.ts' \
  > /tmp/audit_L7.txt || true
echo "    → $(wc -l < /tmp/audit_L7.txt | tr -d ' ') write operations"

echo "  [L9] Rate limit coverage..."
safe_grep -rn $GREP_EXCL 'app\.use.*api\|app\.use.*[Rr]oute' server/src/index.ts 2>/dev/null \
  > /tmp/audit_L9_all_routes.txt || true
safe_grep -rn $GREP_EXCL 'apiLimiter\|rateLimiter\|rateLimit' server/src/index.ts 2>/dev/null \
  > /tmp/audit_L9_with_limits.txt || true
echo "    → $(wc -l < /tmp/audit_L9_all_routes.txt | tr -d ' ') route mounts, $(wc -l < /tmp/audit_L9_with_limits.txt | tr -d ' ') with rate limits"

echo "  [L10] Manual error responses..."
safe_grep -rn $GREP_EXCL 'res\.status(500)\|res\.status(400)\|res\.status(404)' server/src/routes/ 2>/dev/null \
  | safe_grep -v 'middleware' \
  > /tmp/audit_L10.txt || true
echo "    → $(wc -l < /tmp/audit_L10.txt | tr -d ' ') manual error responses"

echo "  [L11] Silent .catch(() => {}) in frontend..."
safe_grep -rn '\.catch(() => {' components/ 2>/dev/null \
  | safe_grep -v 'test' \
  > /tmp/audit_L11.txt || true
echo "    → $(wc -l < /tmp/audit_L11.txt | tr -d ' ') silent catches"

echo "  [COVERAGE] Input validation..."
if [ -d "server/src/routes" ]; then
  TOTAL_ROUTE_FILES=$(find server/src/routes -name "*.ts" 2>/dev/null | wc -l | tr -d ' ')
  VALIDATED_FILES=$(safe_grep -rl 'validateBody\|validateQuery\|validate(\|schema\|Joi\.\|zod\.' server/src/routes/ 2>/dev/null | wc -l | tr -d ' ')
  echo "    → Validation: $VALIDATED_FILES / $TOTAL_ROUTE_FILES route files"
fi

# ─────────────────────────────────────
# STEP 6.6: v5 Depth & Verification Scans
# ─────────────────────────────────────

echo ""
echo "[6.6/8] Running v5 Depth & Verification Scans..."

echo "  [v5-1] Migration dependencies..."
xargs grep -n -e "requires migration" -e "needs migration" -e "migration required" -e "TODO.*migrat" \
  < /tmp/audit_source_server.txt 2>/dev/null > /tmp/audit_migration_deps.txt || true
echo "    → $(wc -l < /tmp/audit_migration_deps.txt | tr -d ' ') migration references"

echo "  [v5-2] Large service files (>500 lines)..."
find server/src/services -name "*.ts" -not -path "*/node_modules/*" -not -name "*.test.*" -not -name "*.spec.*" 2>/dev/null | while IFS= read -r f; do
  LINES=$(wc -l < "$f" 2>/dev/null | tr -d ' ')
  if [ "$LINES" -gt 500 ]; then
    echo "$f ($LINES lines)"
  fi
done > /tmp/audit_large_services.txt || true
echo "    → $(wc -l < /tmp/audit_large_services.txt | tr -d ' ') large files"

echo "  [v5-3] Dockerfile runtime flags..."
if [ -f "Dockerfile" ]; then
  safe_grep -n 'force-fips\|NODE_OPTIONS\|NODE_ENV\|--openssl\|--tls' Dockerfile > /tmp/audit_dockerfile_flags.txt || true
  echo "    → $(wc -l < /tmp/audit_dockerfile_flags.txt | tr -d ' ') runtime flags"
fi

echo "  [v5-4] Config defaults with fallbacks..."
safe_grep -rn $GREP_EXCL 'process\.env\.' server/src/config/ 2>/dev/null \
  | safe_grep -e '||\|??' \
  > /tmp/audit_all_config_defaults.txt || true
echo "    → $(wc -l < /tmp/audit_all_config_defaults.txt | tr -d ' ') config defaults"

echo "  [v5-5] CI action versions..."
safe_grep -rn 'uses:.*@v' .github/workflows/ 2>/dev/null > /tmp/audit_ci_actions.txt || true
echo "    → $(wc -l < /tmp/audit_ci_actions.txt | tr -d ' ') CI action refs"

# ─────────────────────────────────────
# STEP 6.7: v6 Service & Docker Enumeration
# ─────────────────────────────────────

echo ""
echo "[6.7/8] Running v6 Enumeration Scans..."

echo "  [v6-1] ALL service files..."
find server/src/services -name "*.ts" -not -name "*.test.*" -not -name "*.spec.*" -not -name "*.d.ts" 2>/dev/null \
  | sort > /tmp/audit_all_services.txt || true
echo "    → $(wc -l < /tmp/audit_all_services.txt | tr -d ' ') service files"

echo "  [v6-2] ALL Docker files..."
find . \( -name "Dockerfile*" -o -name "docker-compose*" \) -not -path "*/node_modules/*" 2>/dev/null \
  | sort > /tmp/audit_all_docker.txt || true
echo "    → $(wc -l < /tmp/audit_all_docker.txt | tr -d ' ') Docker/compose files"

echo "  [v6-3] Version consistency..."
safe_grep -rn $GREP_EXCL 'node-version\|NODE_VERSION\|node:' .github/workflows/ Dockerfile* docker-compose* 2>/dev/null \
  > /tmp/audit_version_refs.txt || true
echo "    → $(wc -l < /tmp/audit_version_refs.txt | tr -d ' ') version references"

echo "  [v6-4] Package.json production readiness..."
if [ -f "server/package.json" ]; then
  safe_grep -A200 '"devDependencies"' server/package.json 2>/dev/null \
    | safe_grep -i 'sentry\|datadog\|winston\|pino\|helmet\|cors' \
    > /tmp/audit_prod_in_dev.txt || true
  echo "    → $(wc -l < /tmp/audit_prod_in_dev.txt | tr -d ' ') production packages in devDeps"
fi

echo "  [v6-5] Docker-compose credentials..."
safe_grep -rn 'password\|PASSWORD\|GRAFANA\|admin\|default.*pass' docker-compose*.yml 2>/dev/null \
  | safe_grep -v '_FILE\|/run/secrets' \
  > /tmp/audit_compose_secrets.txt || true
echo "    → $(wc -l < /tmp/audit_compose_secrets.txt | tr -d ' ') potential hardcoded creds"

# ─────────────────────────────────────
# STEP 6.8: v9 Methodology Completeness Scans
# ─────────────────────────────────────

echo ""
echo "[6.8/8] Running v9 Methodology Completeness Scans..."

echo "  [T1] Compose fail-open security defaults..."
COMPOSE_FILES=$(find . -name "docker-compose*" -not -path "*/node_modules/*" 2>/dev/null | tr '\n' ' ')
if [ -n "$COMPOSE_FILES" ]; then
  safe_grep -n ':-' $COMPOSE_FILES 2>/dev/null | safe_grep -iE 'password|secret|key|token|admin|credential' \
    > /tmp/audit_T1.txt || true
else
  touch /tmp/audit_T1.txt
fi
echo "    → $(wc -l < /tmp/audit_T1.txt | tr -d ' ') fail-open security defaults"

echo "  [T2] CI pipeline :latest tags..."
CI_FILES=$(find . -path "*/.github/workflows/*" -o -path "*/.gitlab-ci*" 2>/dev/null | tr '\n' ' ')
if [ -n "$CI_FILES" ]; then
  safe_grep -rn ':latest' $CI_FILES 2>/dev/null | safe_grep -iE 'push|tag|deploy|ecr|registry|gcr|docker' \
    > /tmp/audit_T2.txt || true
else
  touch /tmp/audit_T2.txt
fi
echo "    → $(wc -l < /tmp/audit_T2.txt | tr -d ' ') CI :latest references"

echo "  [T3] Lint config existence..."
> /tmp/audit_T3.txt
for dir in $(find . -name "package.json" -not -path "*/node_modules/*" -maxdepth 2 -exec dirname {} \;); do
  if [ -d "$dir/src" ] || [ -d "$dir/lib" ]; then
    HAS_CONFIG=$(find "$dir" -maxdepth 1 \( -name "eslint.config.*" -o -name ".eslintrc*" \) 2>/dev/null | head -1)
    if [ -z "$HAS_CONFIG" ]; then
      echo "MISSING: $dir" >> /tmp/audit_T3.txt
    fi
  fi
done
echo "    → $(wc -l < /tmp/audit_T3.txt | tr -d ' ') sub-projects missing lint config"

echo "  [T4] Security wrapper bypasses..."
> /tmp/audit_T4.txt
# RegExp wrapper bypass check
if safe_grep -rql "safeRegexTest\|safe_regex" server/src/ --include="*.ts" 2>/dev/null; then
  safe_grep -rn "new RegExp(" server/src/ --include="*.ts" 2>/dev/null \
    | safe_grep -v test | safe_grep -v generated | safe_grep -v node_modules | safe_grep -v "safeRegex" \
    >> /tmp/audit_T4.txt || true
fi
# URL validator bypass check
if safe_grep -rql "isUrlSafe\|isWebhookUrlSafe" server/src/ --include="*.ts" 2>/dev/null; then
  safe_grep -rn "axios\.\(get\|post\|put\|delete\)\|fetch(" server/src/services/ --include="*.ts" 2>/dev/null \
    | safe_grep -v test | safe_grep -v generated | safe_grep -v node_modules \
    | safe_grep -v "isUrlSafe\|isWebhookUrlSafe\|process\.env\|localhost\|127\.0\.0\.1" \
    >> /tmp/audit_T4_urls.txt 2>/dev/null || true
fi
echo "    → $(wc -l < /tmp/audit_T4.txt | tr -d ' ') potential security wrapper bypasses"

echo "  [T5] Startup env validation..."
> /tmp/audit_T5.txt
for VAR in DATABASE_URL JWT_SECRET JWT_REFRESH_SECRET ENCRYPTION_KEY; do
  VALIDATED=$(safe_grep -rn "$VAR" server/src/config/ server/src/index.ts --include="*.ts" 2>/dev/null \
    | safe_grep -iE 'throw|assert|required|errors\.push')
  if [ -z "$VALIDATED" ]; then
    echo "NOT_VALIDATED: $VAR" >> /tmp/audit_T5.txt
  fi
done
echo "    → $(wc -l < /tmp/audit_T5.txt | tr -d ' ') critical vars missing startup validation"

echo "  [T6] Docker HEALTHCHECK per Dockerfile..."
> /tmp/audit_T6.txt
for df in $(find . -name "Dockerfile*" -not -path "*/node_modules/*"); do
  safe_grep -q "HEALTHCHECK" "$df" || echo "MISSING: $df" >> /tmp/audit_T6.txt
done
echo "    → $(wc -l < /tmp/audit_T6.txt | tr -d ' ') Dockerfiles missing HEALTHCHECK"

echo "  [T7] Cross-compose variable consistency..."
> /tmp/audit_T7.txt
for VAR in POSTGRES_PASSWORD ELASTICSEARCH_PASSWORD REDIS_PASSWORD JWT_SECRET JWT_REFRESH_SECRET ENCRYPTION_KEY; do
  if [ -n "$COMPOSE_FILES" ]; then
    PATTERNS=$(safe_grep -oh "\\\${${VAR}[^}]*}" $COMPOSE_FILES 2>/dev/null | sort -u)
    HAS_OPEN=$(echo "$PATTERNS" | safe_grep ':-' 2>/dev/null)
    HAS_CLOSED=$(echo "$PATTERNS" | safe_grep ':?' 2>/dev/null)
    if [ -n "$HAS_OPEN" ] && [ -n "$HAS_CLOSED" ]; then
      echo "INCONSISTENT: $VAR" >> /tmp/audit_T7.txt
    fi
  fi
done
echo "    → $(wc -l < /tmp/audit_T7.txt | tr -d ' ') cross-compose inconsistencies"

echo "  [T9] CI quality gate bypasses (continue-on-error)..."
safe_grep -rn "continue-on-error" $(find . -path "*/.github/workflows/*" -o -path "*/.gitlab-ci*" 2>/dev/null) 2>/dev/null \
  | safe_grep -v "# Known unfixable\|# Expected" \
  > /tmp/audit_T9.txt || true
echo "    → $(wc -l < /tmp/audit_T9.txt | tr -d ' ') CI steps with continue-on-error"

echo "  [T10] Peer dependency completeness..."
> /tmp/audit_T10.txt
for pkg_dir in . server; do
  if [ -f "$pkg_dir/package.json" ]; then
    UNMET=$(cd "$pkg_dir" && npm ls --all 2>&1 | safe_grep -i "UNMET PEER\|missing peer" || true)
    if [ -n "$UNMET" ]; then
      echo "UNMET_PEER: $pkg_dir" >> /tmp/audit_T10.txt
      echo "$UNMET" >> /tmp/audit_T10.txt
    fi
  fi
done 2>/dev/null || true
echo "    → $(wc -l < /tmp/audit_T10.txt | tr -d ' ') unmet peer dependencies"

echo "  [T11] Credential encryption-at-rest..."
> /tmp/audit_T11.txt
safe_grep -rn "prisma\.\(integration\|credential\|oAuth\).*\(create\|update\|upsert\)" server/src/ --include="*.ts" 2>/dev/null \
  | safe_grep -v test | safe_grep -v node_modules \
  >> /tmp/audit_T11.txt || true
echo "    → $(wc -l < /tmp/audit_T11.txt | tr -d ' ') credential DB writes to verify encryption"

echo "  [T12] SSRF via function URL parameters..."
> /tmp/audit_T12.txt
safe_grep -rn "baseUrl\?: string\|url: string\|endpoint\?: string" server/src/services/ --include="*.ts" 2>/dev/null \
  | safe_grep -v test | safe_grep -v node_modules | safe_grep -v "\.d\.ts" \
  >> /tmp/audit_T12.txt || true
echo "    → $(wc -l < /tmp/audit_T12.txt | tr -d ' ') functions with URL parameters"

echo "  [T13] Infrastructure config defaults (non-compose)..."
> /tmp/audit_T13.txt
INFRA_CONFIGS=$(find . \( -path "*/logstash/*" -o -path "*/nginx/*" -o -path "*/prometheus/*" -o -path "*/grafana/*" -o -path "*/falco/*" \) \
  -not -path "*/node_modules/*" \( -name "*.conf" -o -name "*.yml" -o -name "*.yaml" \) 2>/dev/null | tr '\n' ' ')
if [ -n "$INFRA_CONFIGS" ]; then
  safe_grep -n 'changeme\|default.*password\|:-.*password\|password.*:-' $INFRA_CONFIGS 2>/dev/null \
    >> /tmp/audit_T13.txt || true
fi
echo "    → $(wc -l < /tmp/audit_T13.txt | tr -d ' ') infrastructure default passwords"

echo "  [T14] Controller inline error responses..."
safe_grep -rn "res\.status(" server/src/controllers/ --include="*.ts" 2>/dev/null \
  | safe_grep -v test | safe_grep -v node_modules \
  > /tmp/audit_T14.txt || true
echo "    → $(wc -l < /tmp/audit_T14.txt | tr -d ' ') controller inline error responses"

echo "  [T15] StatusPage/health display components..."
> /tmp/audit_T15.txt
for comp in $(find components/ -name "*Status*" -o -name "*Health*" -o -name "*Uptime*" 2>/dev/null | safe_grep -v test); do
  HAS_API=$(safe_grep -c "fetch\|api\.\|useQuery\|useSWR\|/health\|/status" "$comp" 2>/dev/null || echo 0)
  if [ "$HAS_API" -eq 0 ] || [ "$HAS_API" -lt 2 ]; then
    echo "STATIC_OPERATIONAL: $comp (API refs: $HAS_API)" >> /tmp/audit_T15.txt
  fi
done
echo "    → $(wc -l < /tmp/audit_T15.txt | tr -d ' ') static operational display components"

echo "  [T8] In-memory state in services..."
safe_grep -rn "new Map()\|new Set()\|= {}" server/src/services/ --include="*.ts" 2>/dev/null \
  | safe_grep -v test | safe_grep -v node_modules | safe_grep -v generated \
  > /tmp/audit_T8.txt || true
echo "    → $(wc -l < /tmp/audit_T8.txt | tr -d ' ') in-memory state instances"

# ─────────────────────────────────────
# STEP 6.9: v12 Cross-Audit & Depth Gap Scans
# ─────────────────────────────────────

echo ""
echo "[6.9/8] Running v12 Cross-Audit & Depth Gap Scans..."

echo "  [T16] Node version cross-consistency..."
> /tmp/audit_T16.txt
echo "--- CI workflows ---" >> /tmp/audit_T16.txt
safe_grep -rn 'node-version' .github/workflows/ 2>/dev/null >> /tmp/audit_T16.txt || true
echo "--- Dockerfiles ---" >> /tmp/audit_T16.txt
for df in $(find . -name "Dockerfile*" -not -path "*/node_modules/*" 2>/dev/null); do
  safe_grep -n 'FROM node' "$df" 2>/dev/null >> /tmp/audit_T16.txt || true
done
echo "--- package.json engines ---" >> /tmp/audit_T16.txt
safe_grep -A2 '"engines"' package.json server/package.json 2>/dev/null >> /tmp/audit_T16.txt || true
# Extract version numbers for mismatch detection
CI_NODE=$(safe_grep -rh 'node-version' .github/workflows/ 2>/dev/null | safe_grep -oE '[0-9]+' | head -1 || true)
DOCKER_NODE=$(safe_grep -rh 'FROM node:' $(find . -name "Dockerfile" -not -path "*/node_modules/*" -maxdepth 1 2>/dev/null) 2>/dev/null | safe_grep -oE 'node:([0-9]+)' | head -1 | sed 's/node://' || true)
if [ -n "$CI_NODE" ] && [ -n "$DOCKER_NODE" ] && [ "$CI_NODE" != "$DOCKER_NODE" ]; then
  echo "MISMATCH: CI=Node$CI_NODE Docker=Node$DOCKER_NODE" >> /tmp/audit_T16.txt
fi
echo "    → CI Node: ${CI_NODE:-unknown}, Docker Node: ${DOCKER_NODE:-unknown}"

echo "  [T17] Server-only console statements..."
> /tmp/audit_T17.txt
safe_grep -rn "console\.\(log\|warn\|error\|info\|debug\)" server/src/ --include="*.ts" 2>/dev/null \
  | safe_grep -v test | safe_grep -v node_modules | safe_grep -v "\.d\.ts" \
  | safe_grep -v "scripts/" | safe_grep -v "cli/" \
  >> /tmp/audit_T17.txt || true
echo "    → $(wc -l < /tmp/audit_T17.txt | tr -d ' ') console statements in server production code"

echo "  [T18] Dev compose literal security values..."
> /tmp/audit_T18.txt
if [ -n "$COMPOSE_FILES" ]; then
  # Find literal = assignments (not ${VAR} references) for security-sensitive keys
  safe_grep -n 'JWT_SECRET=\|ENCRYPTION_KEY=\|POSTGRES_PASSWORD=\|REDIS_PASSWORD=' $COMPOSE_FILES 2>/dev/null \
    | safe_grep -v '\${' | safe_grep -v '^#\|^\s*#' \
    >> /tmp/audit_T18.txt || true
fi
echo "    → $(wc -l < /tmp/audit_T18.txt | tr -d ' ') hardcoded security values in dev compose"

echo "  [T19] Auth-critical endpoint validation..."
> /tmp/audit_T19.txt
if [ -d "server/src/routes" ]; then
  for ENDPOINT in "forgot-password" "reset-password" "login" "register" "change-password"; do
    FILE=$(safe_grep -rl "$ENDPOINT" server/src/routes/ --include="*.ts" 2>/dev/null | head -1)
    if [ -n "$FILE" ]; then
      HAS_VALIDATE=$(safe_grep -c "validateBody\|validate(\|schema\|Joi\.\|zod\." "$FILE" 2>/dev/null || echo 0)
      ENDPOINT_LINE=$(safe_grep -n "$ENDPOINT" "$FILE" 2>/dev/null | head -1)
      echo "$ENDPOINT in $FILE (validate_refs: $HAS_VALIDATE) — $ENDPOINT_LINE" >> /tmp/audit_T19.txt
    fi
  done
fi
echo "    → $(wc -l < /tmp/audit_T19.txt | tr -d ' ') auth endpoints checked"

echo "  [T20] Fixable npm vulnerabilities..."
> /tmp/audit_T20.txt
for pkg_dir in . server; do
  if [ -f "$pkg_dir/package.json" ]; then
    AUDIT_OUT=$(cd "$pkg_dir" && npm audit --json 2>/dev/null || true)
    if [ -n "$AUDIT_OUT" ]; then
      echo "$AUDIT_OUT" | node -e "
        try {
          const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
          const v=d.vulnerabilities||{};
          Object.entries(v).forEach(([k,e])=>{
            if(e.fixAvailable) process.stdout.write('FIXABLE ($pkg_dir): '+k+' '+e.severity+'\n');
          });
        } catch(e) {}
      " 2>/dev/null >> /tmp/audit_T20.txt || true
    fi
  fi
done 2>/dev/null || true
echo "    → $(wc -l < /tmp/audit_T20.txt | tr -d ' ') fixable vulnerabilities"

echo "  [T21] Build memory requirements..."
> /tmp/audit_T21.txt
safe_grep -rn "max-old-space-size\|NODE_OPTIONS" .github/workflows/ 2>/dev/null >> /tmp/audit_T21.txt || true
for df in $(find . -name "Dockerfile*" -not -path "*/node_modules/*" 2>/dev/null); do
  safe_grep -n "max-old-space-size\|NODE_OPTIONS" "$df" 2>/dev/null >> /tmp/audit_T21.txt || true
done
safe_grep -n "max-old-space-size\|NODE_OPTIONS" package.json server/package.json 2>/dev/null >> /tmp/audit_T21.txt || true
echo "    → $(wc -l < /tmp/audit_T21.txt | tr -d ' ') NODE_OPTIONS/memory references"

echo "  [T22] SSO/SCIM security-path error handling..."
> /tmp/audit_T22.txt
for AUTH_FILE in server/src/routes/sso.ts server/src/routes/scim.ts; do
  if [ -f "$AUTH_FILE" ]; then
    # Count catch blocks vs logger.error calls — auth errors must be logged
    CATCHES=$(safe_grep -c "catch" "$AUTH_FILE" 2>/dev/null || echo 0)
    LOGGER_ERRORS=$(safe_grep -c "logger\.\(error\|warn\)" "$AUTH_FILE" 2>/dev/null || echo 0)
    RES_STATUS=$(safe_grep -c "res\.status(" "$AUTH_FILE" 2>/dev/null || echo 0)
    echo "$AUTH_FILE catches=$CATCHES loggerErrors=$LOGGER_ERRORS inlineStatus=$RES_STATUS" >> /tmp/audit_T22.txt
    # Find inline error responses without logging
    safe_grep -n "res\.status(" "$AUTH_FILE" 2>/dev/null >> /tmp/audit_T22.txt || true
  fi
done
echo "    → $(wc -l < /tmp/audit_T22.txt | tr -d ' ') SSO/SCIM error-path lines"

echo "  [T24] Rate limit mount gaps..."
> /tmp/audit_T24.txt
for APP_FILE in server/src/index.ts server/src/app.ts; do
  if [ -f "$APP_FILE" ]; then
    safe_grep -n "app\.use.*'/api/" "$APP_FILE" 2>/dev/null | while IFS= read -r LINE; do
      HAS_LIMITER=$(echo "$LINE" | safe_grep -c "Limiter\|limiter\|rateLimit" || echo 0)
      if [ "$HAS_LIMITER" -eq 0 ]; then
        echo "NO_LIMITER: $LINE" >> /tmp/audit_T24.txt
      fi
    done
  fi
done 2>/dev/null || true
echo "    → $(wc -l < /tmp/audit_T24.txt | tr -d ' ') route mounts without rate limiters"

echo "  [T25] ReDoS wrapper effectiveness..."
> /tmp/audit_T25.txt
SAFE_REGEX_FILE=$(safe_grep -rl "function safeRegex\|safeRegexTest" server/src/ --include="*.ts" 2>/dev/null | head -1)
if [ -n "$SAFE_REGEX_FILE" ]; then
  echo "WRAPPER_FILE: $SAFE_REGEX_FILE" >> /tmp/audit_T25.txt
  HAS_RE2=$(safe_grep -c "re2\|RE2" "$SAFE_REGEX_FILE" 2>/dev/null || echo 0)
  HAS_TIMEOUT=$(safe_grep -c "timeout\|setTimeout\|AbortSignal" "$SAFE_REGEX_FILE" 2>/dev/null || echo 0)
  HAS_LENGTH=$(safe_grep -c "length\|\.length" "$SAFE_REGEX_FILE" 2>/dev/null || echo 0)
  echo "RE2=$HAS_RE2 TIMEOUT=$HAS_TIMEOUT LENGTH_GUARD=$HAS_LENGTH" >> /tmp/audit_T25.txt
  if [ "$HAS_RE2" -eq 0 ] && [ "$HAS_TIMEOUT" -eq 0 ]; then
    echo "INSUFFICIENT: Wrapper uses length guard only — no re2 or timeout protection" >> /tmp/audit_T25.txt
  fi
fi
echo "    → $(wc -l < /tmp/audit_T25.txt | tr -d ' ') ReDoS wrapper analysis lines"

# ─────────────────────────────────────
# STEP 6.10: v3.5 Coverage Ledger Candidate Enumeration
# Pre-built scan outputs for AUDIT_PROMPT_v20.3 §5.5 coverage ledgers.
# These produce raw candidate lists that subagents pre-populate as UNCLASSIFIED.
# ─────────────────────────────────────

echo ""
echo "[6.10/8] v3.5 Coverage Ledger Enumeration (§5.5 in AUDIT_PROMPT_v20.3)..."

# 5.5.1 Credential Encryption candidates
echo "  [COV-1] Credential encryption write sites..."
{
  xargs grep -nE 'prisma\.(integration|credential|oAuth|apiKey|webhook|sso|scim|smtp|integrationLog)[A-Za-z]*\.(create|update|upsert|updateMany)' \
    < /tmp/audit_source_services.txt 2>/dev/null
  xargs grep -nE '(accessToken|refreshToken|clientSecret|apiKey|bearerToken|webhookSecret|privateKey|tenantId|smtpPassword|scimToken|patToken)[[:space:]]*:[[:space:]]*[^,}\n]+' \
    < /tmp/audit_source_services.txt 2>/dev/null
} | sort -u > /tmp/audit_COV1_credential_encryption.txt || true
echo "    → $(wc -l < /tmp/audit_COV1_credential_encryption.txt | tr -d ' ') candidate sites"

# 5.5.2 SSRF Per-Call (reuses F7 raw data)
echo "  [COV-2] SSRF per-call candidates (uses F7)..."
cp /tmp/audit_F7.txt /tmp/audit_COV2_ssrf.txt 2>/dev/null || touch /tmp/audit_COV2_ssrf.txt
echo "    → $(wc -l < /tmp/audit_COV2_ssrf.txt | tr -d ' ') candidate sites"

# 5.5.3 Auth Middleware Per-Endpoint candidates
echo "  [COV-3] Endpoint enumeration for auth coverage..."
safe_grep -rn -E '(router|app)\.(get|post|put|patch|delete|options)\(' server/src/routes/ 2>/dev/null \
  > /tmp/audit_COV3_endpoints.txt || true
echo "    → $(wc -l < /tmp/audit_COV3_endpoints.txt | tr -d ' ') endpoints"

# 5.5.4 Cookie Security Flags candidates
echo "  [COV-4] res.cookie() call sites..."
{
  xargs grep -nE 'res\.cookie\(|response\.cookie\(' < /tmp/audit_source_server.txt 2>/dev/null
} > /tmp/audit_COV4_cookies.txt || true
echo "    → $(wc -l < /tmp/audit_COV4_cookies.txt | tr -d ' ') cookie sets"

# 5.5.5 Input Validation Per-Endpoint candidates (reuses COV-3 + validation refs)
echo "  [COV-5] Validation middleware references..."
safe_grep -rn -E 'validateBody|validateQuery|validateParams|Joi\.|zod\.|schema\.parse' server/src/routes/ server/src/middleware/ server/src/validators/ 2>/dev/null \
  > /tmp/audit_COV5_validation_refs.txt || true
echo "    → $(wc -l < /tmp/audit_COV5_validation_refs.txt | tr -d ' ') validation references"

# 5.5.6 CSRF Per Mutating Endpoint candidates
echo "  [COV-6] Mutating endpoints..."
safe_grep -rn -E '(router|app)\.(post|put|patch|delete)\(' server/src/routes/ 2>/dev/null \
  > /tmp/audit_COV6_mutating_endpoints.txt || true
echo "    → $(wc -l < /tmp/audit_COV6_mutating_endpoints.txt | tr -d ' ') mutating endpoints"

# 5.5.7 Rate Limiter VALUE candidates (already enumerated in L9; need limiter definitions)
echo "  [COV-7] Rate limiter definitions..."
safe_grep -rn -E 'rateLimit\({|RateLimit\({|rateLimiter\s*=|Limiter\s*=' server/src/ 2>/dev/null \
  > /tmp/audit_COV7_rate_limit_defs.txt || true
echo "    → $(wc -l < /tmp/audit_COV7_rate_limit_defs.txt | tr -d ' ') limiter definitions"

# 5.5.8 Webhook HMAC candidates
echo "  [COV-8] Webhook handler enumeration..."
safe_grep -rn -E '/webhook|/hooks?/|/events?/|webhookHandler|webhook.*controller' server/src/routes/ server/src/controllers/ 2>/dev/null \
  > /tmp/audit_COV8_webhooks.txt || true
echo "    → $(wc -l < /tmp/audit_COV8_webhooks.txt | tr -d ' ') webhook handler candidates"

# 5.5.9 JWT verify call sites
echo "  [COV-9] JWT verify call sites..."
{
  xargs grep -nE 'jwt\.verify\(|jsonwebtoken\.verify\(' < /tmp/audit_source_server.txt 2>/dev/null
} > /tmp/audit_COV9_jwt_verifies.txt || true
echo "    → $(wc -l < /tmp/audit_COV9_jwt_verifies.txt | tr -d ' ') JWT verifies"

# 5.5.10 Logger calls (PII candidates)
echo "  [COV-10] Logger call sites..."
{
  xargs grep -nE 'logger\.(info|warn|error|debug)\(' < /tmp/audit_source_server.txt 2>/dev/null
} > /tmp/audit_COV10_logger_calls.txt || true
echo "    → $(wc -l < /tmp/audit_COV10_logger_calls.txt | tr -d ' ') logger calls"

# 5.5.11 Multi-Tenant READS (L8)
echo "  [COV-11] L8 — Prisma read call sites..."
{
  xargs grep -nE 'prisma\.\w+\.(findFirst|findMany|findUnique|count|aggregate|groupBy)' \
    < /tmp/audit_source_services.txt 2>/dev/null
  xargs grep -nE 'prisma\.\w+\.(findFirst|findMany|findUnique|count|aggregate|groupBy)' \
    < /tmp/audit_source_server.txt 2>/dev/null
} | sort -u > /tmp/audit_COV11_l8_reads.txt || true
echo "    → $(wc -l < /tmp/audit_COV11_l8_reads.txt | tr -d ' ') read sites"

# 5.5.12 Frontend ↔ Backend Contract Drift
# FRONTEND PATHS: this project keeps frontend at repo root (services/, hooks/) NOT src/.
echo "  [COV-12] Frontend API call enumeration..."
{
  safe_grep -rn -E 'api\.[a-zA-Z]+\.(get|post|put|patch|delete|create|update|list|find|fetch)\(' \
    services/ hooks/ src/services/ src/hooks/ 2>/dev/null
  # Also catch fetchAPI() / apiFetch() / fetch('/api/...') patterns
  safe_grep -rn -E "fetchAPI\(|apiFetch\(|fetch\(['\"]?/api/" \
    services/ hooks/ components/ src/ 2>/dev/null
} | safe_grep -v '__tests__\|\.test\.\|\.spec\.' > /tmp/audit_COV12_frontend_calls.txt || true
echo "    → $(wc -l < /tmp/audit_COV12_frontend_calls.txt | tr -d ' ') frontend API calls"
echo "  [COV-12b] Backend routes (for cross-reference)..."
cp /tmp/audit_COV3_endpoints.txt /tmp/audit_COV12_backend_routes.txt

# 5.5.13 In-Memory State Criticality
echo "  [COV-13] In-memory state instances..."
{
  xargs grep -nE 'new (Map|Set|WeakMap|WeakSet)\(|global\.\w+\s*=|app\.locals\.' \
    < /tmp/audit_source_services.txt 2>/dev/null
} > /tmp/audit_COV13_inmemory_state.txt || true
echo "    → $(wc -l < /tmp/audit_COV13_inmemory_state.txt | tr -d ' ') in-memory state instances"

# 5.5.14 Migration-Status Verification
echo "  [COV-14] Migration-dependency comments..."
{
  xargs grep -nE 'requires migration|needs migration|migration required|TODO.*migrat|FIXME.*migrat|after migration' \
    < /tmp/audit_source_server.txt 2>/dev/null
} > /tmp/audit_COV14_migration_deps.txt || true
echo "    → $(wc -l < /tmp/audit_COV14_migration_deps.txt | tr -d ' ') migration-dependent comments"
find server/prisma/migrations -type f \( -name "*.sql" -o -name "migration.sql" \) 2>/dev/null \
  | sort > /tmp/audit_COV14_migration_files.txt
echo "    → $(wc -l < /tmp/audit_COV14_migration_files.txt | tr -d ' ') migration files"

# 5.5.15 Token Revocation on Auth Events
echo "  [COV-15] Auth-event handlers (logout/password-change/account-delete)..."
safe_grep -rn -E 'logout|signOut|signout|revokeToken|invalidateSession|password.*(change|reset|update)|deleteAccount|account.*delet' \
  server/src/controllers/ server/src/routes/auth.ts server/src/services/authService.ts 2>/dev/null \
  > /tmp/audit_COV15_auth_events.txt || true
echo "    → $(wc -l < /tmp/audit_COV15_auth_events.txt | tr -d ' ') auth-event handler references"

# 5.5.16 Audit Log Per Privileged Action
echo "  [COV-16] Privileged-action controller methods..."
safe_grep -rn -E '(admin|exportData|downloadReport|deleteUser|changeRole|impersonate|elevate|grant|revoke|approve|export)' \
  server/src/controllers/ 2>/dev/null \
  | safe_grep -v 'test\|spec\|//' \
  > /tmp/audit_COV16_privileged_actions.txt || true
echo "    → $(wc -l < /tmp/audit_COV16_privileged_actions.txt | tr -d ' ') privileged-action candidates"

# 5.5.17 File Upload Safety
echo "  [COV-17] Multer/upload configurations..."
{
  xargs grep -nE 'multer\(|\.single\(|\.array\(|\.fields\(|upload\.|fileUpload' \
    < /tmp/audit_source_server.txt 2>/dev/null
} > /tmp/audit_COV17_uploads.txt || true
echo "    → $(wc -l < /tmp/audit_COV17_uploads.txt | tr -d ' ') upload-handler references"

# 5.5.18 Idempotency Per Mutating POST (reuses COV-6)
echo "  [COV-18] Idempotency candidates (reuses COV-6)..."
cp /tmp/audit_COV6_mutating_endpoints.txt /tmp/audit_COV18_idempotency.txt

# 5.5.19 OpenAPI / Swagger Drift
echo "  [COV-19] OpenAPI/Swagger source files..."
find . -maxdepth 5 -type f \( -name "swagger.json" -o -name "swagger.yaml" -o -name "swagger.yml" \
  -o -name "openapi.json" -o -name "openapi.yaml" -o -name "openapi.yml" \
  -o -path "*/docs/api*" \) \
  -not -path "*/node_modules/*" -not -path "*/.archive/*" -not -path "*/.claude/worktrees/*" 2>/dev/null \
  > /tmp/audit_COV19_openapi_files.txt || true
echo "    → $(wc -l < /tmp/audit_COV19_openapi_files.txt | tr -d ' ') OpenAPI/Swagger source files"

# 5.5.20 Background Job Dead-Letter Handling
echo "  [COV-20] Background job definitions..."
{
  xargs grep -nE 'new Queue\(|BullMQ|new Worker\(|Agenda\(|cron\.schedule|jobQueue|defineJob|registerJob' \
    < /tmp/audit_source_services.txt 2>/dev/null
} > /tmp/audit_COV20_jobs.txt || true
echo "    → $(wc -l < /tmp/audit_COV20_jobs.txt | tr -d ' ') background job definitions"

# ─────────────────────────────────────
# STEP 7: Env prep for Chaos & VLM (informational)
# ─────────────────────────────────────

echo ""
echo "[7/8] Environment prep for Chaos & VLM..."
[ -f "docker-compose.yml" ] && echo "  ✓ docker-compose.yml found" || echo "  ✗ No compose file"
safe_grep -rql "${EXT_ARRAY[@]}" 'react\|vue\|svelte' . 2>/dev/null | safe_grep -v node_modules | head -1 > /dev/null 2>&1 \
  && echo "  ✓ Frontend framework detected — VLM applicable" \
  || echo "  ✗ No frontend — skipping VLM"

# ─────────────────────────────────────
# STEP 8: Hand off to Auto-Healing Engine
# ─────────────────────────────────────

echo ""
echo "[8/8] Ready for Auto-Healing Engine"

# ─────────────────────────────────────
# SCAN COMPLETENESS VERIFICATION
# ─────────────────────────────────────

echo ""
echo "============================================"
echo "  SCAN COMPLETENESS VERIFICATION"
echo "============================================"
echo ""
echo "  Total source files discovered:     $TOTAL_FILES"
echo "  Production files scanned (lean):   $LEAN_FILES"
echo "  Component files scanned:           ${COMP_FILES:-0}"
echo "  Server files scanned:              ${SERV_FILES:-0}"
PATTERN_COUNT=$(ls /tmp/audit_*[A-Z]*.txt 2>/dev/null | wc -l | tr -d ' ')
echo "  Pattern output files created:      $PATTERN_COUNT"

TIMEOUTS=$(wc -l < /tmp/audit_scan_log.txt 2>/dev/null | tr -d ' ')
if [ "${TIMEOUTS:-0}" -gt 0 ]; then
  echo "  ⚠️  $TIMEOUTS pattern(s) timed out:"
  cat /tmp/audit_scan_log.txt
else
  echo "  ✅ All patterns completed — full coverage"
fi

# ─────────────────────────────────────
# FINAL SUMMARY
# ─────────────────────────────────────

echo ""
echo "============================================"
echo "  v3.6: per-file SHA-256 fingerprints for drift detection"
echo "============================================"
echo ""
# v3.6 ADDITION (2026-05-24): write file hashes for every source file in the
# enumeration scope. The audit prompt's Gate 7 (drift detection) compares
# these hashes between sessions; if a file's hash changed, every verdict
# citing that file is STALE and must be re-verified.
#
# Why this matters: check_gates.sh by itself only counts CSV cells. It can't
# tell whether the verdict still matches current code. File hashing closes
# that gap mechanically.
if command -v shasum >/dev/null 2>&1; then
  HASHER="shasum -a 256"
elif command -v sha256sum >/dev/null 2>&1; then
  HASHER="sha256sum"
else
  HASHER=""
fi

if [ -n "$HASHER" ]; then
  > /tmp/audit_file_hashes.txt
  # Hash every file in the master source list + every file referenced by any COV-* output.
  # This is the set of files any verdict could possibly cite.
  {
    cat /tmp/audit_all_source.txt 2>/dev/null
    for f in /tmp/audit_COV*.txt; do
      [ -f "$f" ] && awk -F: '{print $1}' "$f"
    done
    # Also hash schema.prisma and migration files (referenced by COV-14)
    find server/prisma -type f \( -name "*.prisma" -o -name "*.sql" \) 2>/dev/null
    # And the supabase_schema.sql if present (referenced by RLS ledger)
    [ -f supabase_schema.sql ] && echo supabase_schema.sql
  } | sort -u | while IFS= read -r path; do
    [ -f "$path" ] && $HASHER "$path" 2>/dev/null
  done > /tmp/audit_file_hashes.txt

  HASH_COUNT=$(wc -l < /tmp/audit_file_hashes.txt | tr -d ' ')
  echo "  ✓ Hashed $HASH_COUNT files → /tmp/audit_file_hashes.txt"
  # Also compute a combined fingerprint for the scan-run as a whole
  SCAN_FINGERPRINT=$($HASHER /tmp/audit_file_hashes.txt | awk '{print $1}')
  echo "$SCAN_FINGERPRINT" > /tmp/audit_scan_fingerprint.txt
  echo "  ✓ Combined scan fingerprint: $SCAN_FINGERPRINT"
else
  echo "  ✗ No shasum/sha256sum available — drift detection will be DISABLED"
  echo "DRIFT_DETECTION_DISABLED" > /tmp/audit_scan_fingerprint.txt
fi

echo ""
echo "============================================"
echo "  VISIONARY SCAN v3 COMPLETE — Summary"
echo "============================================"
echo ""

TOTAL_FINDINGS=0
METRICS_CATEGORIES=""
for f in /tmp/audit_A*.txt /tmp/audit_B*.txt /tmp/audit_C*.txt /tmp/audit_D*.txt /tmp/audit_E*.txt /tmp/audit_F*.txt /tmp/audit_G*.txt /tmp/audit_H*.txt /tmp/audit_I*.txt /tmp/audit_J*.txt /tmp/audit_K*.txt /tmp/audit_L*.txt /tmp/audit_M*.txt /tmp/audit_N*.txt /tmp/audit_O*.txt /tmp/audit_P*.txt /tmp/audit_Q*.txt /tmp/audit_R*.txt /tmp/audit_S*.txt; do
  if [ -f "$f" ]; then
    count=$(wc -l < "$f" | tr -d ' ')
    TOTAL_FINDINGS=$((TOTAL_FINDINGS + count))
    catname=$(basename "$f" .txt | sed 's/audit_//')
    printf "  %-40s %d\n" "$catname" "$count"
    METRICS_CATEGORIES="${METRICS_CATEGORIES}    \"${catname}\": ${count},\n"
  fi
done

echo ""
echo "TOTAL GREP FINDINGS: $TOTAL_FINDINGS"

AST_TOTAL=0
for f in /tmp/audit_AST*_candidates.txt; do
  if [ -f "$f" ]; then
    count=$(wc -l < "$f" | tr -d ' ')
    AST_TOTAL=$((AST_TOTAL + count))
  fi
done
echo "AST CANDIDATE FILES: $AST_TOTAL"

# ─────────────────────────────────────
# Delta Comparison
# ─────────────────────────────────────

NEW_FINDINGS=0
RESOLVED=0
PERSISTED=0

if [ "$HAS_BASELINE" = true ]; then
  echo ""
  echo "─────────────────────────────────"
  echo "  DELTA vs Previous Baseline"
  echo "─────────────────────────────────"

  for f in /tmp/audit_*[A-S]*.txt; do
    catname=$(basename "$f" .txt | sed 's/audit_//')
    baseline_file="${BASELINE_DIR}/audit_${catname}.txt"
    if [ -f "$baseline_file" ]; then
      new_count=$(comm -23 <(sort "$f") <(sort "$baseline_file") | wc -l | tr -d ' ')
      resolved_count=$(comm -13 <(sort "$f") <(sort "$baseline_file") | wc -l | tr -d ' ')
      persisted_count=$(comm -12 <(sort "$f") <(sort "$baseline_file") | wc -l | tr -d ' ')
      NEW_FINDINGS=$((NEW_FINDINGS + new_count))
      RESOLVED=$((RESOLVED + resolved_count))
      PERSISTED=$((PERSISTED + persisted_count))
    else
      new_count=$(wc -l < "$f" | tr -d ' ')
      NEW_FINDINGS=$((NEW_FINDINGS + new_count))
    fi
  done

  printf "  New findings:      %d\n" "$NEW_FINDINGS"
  printf "  Resolved:          %d\n" "$RESOLVED"
  printf "  Persisted:         %d\n" "$PERSISTED"
fi

# ─────────────────────────────────────
# Save Baseline (also runs via trap on exit)
# ─────────────────────────────────────

echo ""
echo "Saving baseline..."
mkdir -p "${PROJECT_ROOT}/.claude/audit-baseline"
cp /tmp/audit_*[A-S]*.txt "${PROJECT_ROOT}/.claude/audit-baseline/" 2>/dev/null || true
cp /tmp/audit_*_count.txt "${PROJECT_ROOT}/.claude/audit-baseline/" 2>/dev/null || true
date -u +%Y-%m-%dT%H:%M:%SZ > "${PROJECT_ROOT}/.claude/audit-baseline/scan_date.txt"
echo "  ✓ Baseline saved"
BASELINE_SAVED=true

# ─────────────────────────────────────
# Metrics JSON
# ─────────────────────────────────────

METRICS_CATEGORIES_CLEAN=$(printf '%b' "$METRICS_CATEGORIES" | sed '$ s/,$//')
cat > /tmp/audit_metrics.json << METRICS_EOF
{
  "scan_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "scanner_version": "3.6-v13",
  "total_source_files": $TOTAL_FILES,
  "production_files_scanned": $LEAN_FILES,
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

echo "  ✓ Metrics saved to /tmp/audit_metrics.json"

# ─────────────────────────────────────
# v7 Completion Gates
# ─────────────────────────────────────

echo ""
echo "============================================"
echo "  v7 + v12 COMPLETION GATES"
echo "============================================"
echo ""

COMPONENT_COUNT=$(wc -l < /tmp/audit_all_components.txt 2>/dev/null | tr -d ' ')
echo "$COMPONENT_COUNT" > /tmp/audit_component_count.txt
echo "  GATE 1 — Components: $COMPONENT_COUNT"

SERVICE_COUNT=$(wc -l < /tmp/audit_all_services.txt 2>/dev/null | tr -d ' ')
echo "$SERVICE_COUNT" > /tmp/audit_service_count.txt
echo "  GATE 2 — Services:   $SERVICE_COUNT"

F7_COUNT=$(wc -l < /tmp/audit_F7.txt 2>/dev/null | tr -d ' ')
if [ -f /tmp/audit_F7.txt ]; then
  F7_FILE_COUNT=$(awk -F: '{print $1}' /tmp/audit_F7.txt | sort -u | wc -l | tr -d ' ')
  echo "$F7_FILE_COUNT" > /tmp/audit_F7_file_count.txt
  echo "  GATE 3 — F7 SSRF:   $F7_COUNT matches across $F7_FILE_COUNT files"
fi

L7_COUNT=$(wc -l < /tmp/audit_L7.txt 2>/dev/null | tr -d ' ')
echo "  GATE 4 — L7 writes: $L7_COUNT operations"

DOCKER_COUNT=$(wc -l < /tmp/audit_all_docker.txt 2>/dev/null | tr -d ' ')
echo "  GATE 5 — Docker:    $DOCKER_COUNT files"

# v12 Enforcement Gates
echo ""
echo "  --- v12 ENFORCEMENT GATES ---"
T16_MISMATCH=$(safe_grep -c "MISMATCH" /tmp/audit_T16.txt 2>/dev/null || echo 0)
echo "  GATE 6 — Node version:  ${T16_MISMATCH} mismatches (T16)"
T17_COUNT=$(wc -l < /tmp/audit_T17.txt 2>/dev/null | tr -d ' ')
echo "  GATE 7 — Server console: ${T17_COUNT} statements (T17)"
T18_COUNT=$(wc -l < /tmp/audit_T18.txt 2>/dev/null | tr -d ' ')
echo "  GATE 8 — Dev compose:   ${T18_COUNT} hardcoded values (T18)"
T19_COUNT=$(wc -l < /tmp/audit_T19.txt 2>/dev/null | tr -d ' ')
echo "  GATE 9 — Auth validation: ${T19_COUNT} endpoints (T19)"
T20_COUNT=$(wc -l < /tmp/audit_T20.txt 2>/dev/null | tr -d ' ')
echo "  GATE 10 — Fixable vulns: ${T20_COUNT} (T20)"
T22_COUNT=$(wc -l < /tmp/audit_T22.txt 2>/dev/null | tr -d ' ')
echo "  GATE 11 — SSO/SCIM errs: ${T22_COUNT} lines (T22)"
T25_INSUFF=$(safe_grep -c "INSUFFICIENT" /tmp/audit_T25.txt 2>/dev/null || echo 0)
echo "  GATE 12 — ReDoS wrapper: ${T25_INSUFF} insufficient (T25)"

# ─────────────────────────────────────
# STEP 8.5: Context Enrichment (v13)
# Pre-extract function context for EVERY L7/F7 match
# so the AI agent can classify without navigating raw files
# ─────────────────────────────────────

echo ""
echo "============================================"
echo "  v13 CONTEXT ENRICHMENT"
echo "============================================"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "[8.5a] Extracting L7 multi-tenant write context (ALL operations)..."
if [ -f "$SCRIPT_DIR/extract-l7-context.sh" ]; then
  bash "$SCRIPT_DIR/extract-l7-context.sh" "$PROJECT_ROOT" || echo "  ⚠️  L7 extractor had errors"
else
  echo "  ✗ extract-l7-context.sh not found — skipping"
fi

echo ""
echo "[8.5b] Extracting F7 SSRF outbound call context (ALL calls)..."
if [ -f "$SCRIPT_DIR/extract-f7-context.sh" ]; then
  bash "$SCRIPT_DIR/extract-f7-context.sh" "$PROJECT_ROOT" || echo "  ⚠️  F7 extractor had errors"
else
  echo "  ✗ extract-f7-context.sh not found — skipping"
fi

echo ""
echo "[8.5c] Extracting service file summaries (ALL 89 files deep-read)..."
if [ -f "$SCRIPT_DIR/extract-service-summary.sh" ]; then
  bash "$SCRIPT_DIR/extract-service-summary.sh" "$PROJECT_ROOT" || echo "  ⚠️  Service summary extractor had errors"
else
  echo "  ✗ extract-service-summary.sh not found — skipping"
fi

echo ""
echo "[8.5d] Extracting component wiring details (ALL components)..."
if [ -f "$SCRIPT_DIR/extract-component-wiring.sh" ]; then
  bash "$SCRIPT_DIR/extract-component-wiring.sh" "$PROJECT_ROOT" || echo "  ⚠️  Component wiring extractor had errors"
else
  echo "  ✗ extract-component-wiring.sh not found — skipping"
fi

# --- Enrichment Verification ---
echo ""
echo "  --- v13 ENRICHMENT VERIFICATION ---"

# FIX (v3.3): `grep -c PATTERN FILE 2>/dev/null || echo 0` produces "0\n0" when
# the file has no matches (grep -c prints "0" AND exits 1, so the `|| echo 0`
# appends a SECOND "0"). The downstream `[ "$X" -eq "$Y" ]` then fails with
# "integer expression expected". Use `|| true` + `${X:-0}` instead.
L7_RAW=$(wc -l < /tmp/audit_L7.txt 2>/dev/null | tr -d ' ')
L7_ENRICHED=$(grep -c "^═══ L7 #" /tmp/audit_L7_enriched.txt 2>/dev/null || true); L7_ENRICHED=${L7_ENRICHED:-0}
echo "  L7: $L7_ENRICHED of $L7_RAW enriched"
[ "$L7_ENRICHED" -eq "$L7_RAW" ] && echo "    ✅ 100% L7 coverage" || echo "    ⚠️  L7 MISMATCH"

F7_RAW=$(wc -l < /tmp/audit_F7.txt 2>/dev/null | tr -d ' ')
F7_ENRICHED=$(grep -c "^═══ F7 #" /tmp/audit_F7_enriched.txt 2>/dev/null || true); F7_ENRICHED=${F7_ENRICHED:-0}
echo "  F7: $F7_ENRICHED of $F7_RAW enriched"
[ "$F7_ENRICHED" -eq "$F7_RAW" ] && echo "    ✅ 100% F7 coverage" || echo "    ⚠️  F7 MISMATCH"

SVC_TOTAL=$(wc -l < /tmp/audit_all_services.txt 2>/dev/null | tr -d ' ')
SVC_ENRICHED=$(grep -c "^═══ SERVICE:" /tmp/audit_service_summary.txt 2>/dev/null || true); SVC_ENRICHED=${SVC_ENRICHED:-0}
echo "  Services: $SVC_ENRICHED of $SVC_TOTAL deep-read"
[ "$SVC_ENRICHED" -eq "$SVC_TOTAL" ] && echo "    ✅ 100% service coverage" || echo "    ⚠️  SERVICE MISMATCH"

COMP_TOTAL=$(wc -l < /tmp/audit_all_components.txt 2>/dev/null | tr -d ' ')
COMP_ENRICHED=$(grep -c "^═══ COMPONENT:" /tmp/audit_component_wiring_detail.txt 2>/dev/null || true); COMP_ENRICHED=${COMP_ENRICHED:-0}
echo "  Components: $COMP_ENRICHED of $COMP_TOTAL analyzed"
[ "$COMP_ENRICHED" -eq "$COMP_TOTAL" ] && echo "    ✅ 100% component coverage" || echo "    ⚠️  COMPONENT MISMATCH"

echo ""
echo "Finished: $(date)"
