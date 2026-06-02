#!/bin/bash
# .claude/audit-v20/check_gates.sh — v20.3 gate enforcement.
# Verbatim from AUDIT_PROMPT_v20_RESUMABLE.md §6.

set -e
LEDGER_DIR=.claude/audit-v20
FAIL=0
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

echo "=== v20 Hard Gates (run at $TIMESTAMP) ==="

# Gate 1: No banned suffixes anywhere
HINT_HITS=$(grep -hE '_SCAN_HINT|_PER_SCAN|_DEFERRED|_NEEDS_DEEPER_READ|_VERIFY[^A-Z_]|_HINT$|_HINT,|_FROM_HINT|_UNVERIFIED|_TBD|_REVIEW_LATER|_TRUST_PATTERN' $LEDGER_DIR/*.csv 2>/dev/null | wc -l | tr -d ' ')
echo "Gate 1 (banned suffixes): $HINT_HITS — must be 0"
[ "$HINT_HITS" -eq 0 ] || FAIL=1

# Gate 2: No UNCLASSIFIED rows in any ledger
UNCL=$(grep -hc '^[^,]*,UNCLASSIFIED' $LEDGER_DIR/*.csv 2>/dev/null | awk '{s+=$1} END {print s+0}')
echo "Gate 2 (UNCLASSIFIED rows): $UNCL — must be 0"
[ "$UNCL" -eq 0 ] || FAIL=1

# Gate 3: Every non-header row has non-empty evidence_lines_read AND evidence_quote (core ledgers only)
for ledger in $LEDGER_DIR/L7_*.csv $LEDGER_DIR/F7_*.csv $LEDGER_DIR/component_*.csv $LEDGER_DIR/prisma_*.csv; do
  [ -f "$ledger" ] || continue
  HEADER=$(head -1 "$ledger")
  EVIDENCE_COL=$(echo "$HEADER" | tr ',' '\n' | grep -n '^evidence_lines_read$' | cut -d: -f1)
  QUOTE_COL=$(echo "$HEADER" | tr ',' '\n' | grep -n '^evidence_quote$' | cut -d: -f1)
  if [ -n "$EVIDENCE_COL" ] && [ -n "$QUOTE_COL" ]; then
    EMPTY_EVIDENCE=$(awk -F, -v c="$EVIDENCE_COL" 'NR>1 && $c=="" {n++} END {print n+0}' "$ledger")
    EMPTY_QUOTE=$(awk -F, -v c="$QUOTE_COL" 'NR>1 && $c=="" {n++} END {print n+0}' "$ledger")
    echo "Gate 3 ($ledger): $EMPTY_EVIDENCE empty evidence_lines_read, $EMPTY_QUOTE empty evidence_quote"
    [ "$EMPTY_EVIDENCE" -eq 0 ] && [ "$EMPTY_QUOTE" -eq 0 ] || FAIL=1
  fi
done

# Gate 4: state.json chunks_pending=0
PENDING=$(jq -r '.chunks_pending | length' $LEDGER_DIR/state.json 2>/dev/null || echo 999)
echo "Gate 4 (chunks_pending): $PENDING — must be 0 for FINAL report"
[ "$PENDING" -eq 0 ] || FAIL=1

# Gate 5: FULL test suite (chaos/perf/e2e) ran on this FINAL pass
FULL_SUITE_LOG=$LEDGER_DIR/logs/server_tests_full.log
if [ ! -f "$FULL_SUITE_LOG" ]; then
  echo "Gate 5 (full test suite incl chaos/perf/e2e): MISSING $FULL_SUITE_LOG — must exist for FINAL"
  FAIL=1
else
  HAS_CHAOS=$(grep -ic 'chaos' "$FULL_SUITE_LOG" || true)
  HAS_PERF=$(grep -ic 'performance' "$FULL_SUITE_LOG" || true)
  HAS_E2E=$(grep -ic 'e2e\|end[- ]to[- ]end' "$FULL_SUITE_LOG" || true)
  echo "Gate 5 (full suite): chaos=$HAS_CHAOS perf=$HAS_PERF e2e=$HAS_E2E — each must be >0"
  [ "$HAS_CHAOS" -gt 0 ] && [ "$HAS_PERF" -gt 0 ] && [ "$HAS_E2E" -gt 0 ] || FAIL=1
fi

# Gate 5.5: Security Wrapper Coverage Ledgers (v20.3 — 20 ledgers)
STRICT_BLOCK_LEDGERS="coverage_credential_encryption coverage_ssrf coverage_l8_reads coverage_migration_status coverage_token_revocation coverage_file_upload coverage_background_jobs"
for L in $STRICT_BLOCK_LEDGERS; do
  F="$LEDGER_DIR/${L}_verified.csv"
  [ -f "$F" ] || F="$LEDGER_DIR/${L}_unclassified.csv"
  if [ -f "$F" ]; then
    HIGH=$(awk -F, 'NR>1 && $5 ~ /GAP_HIGH/ {n++} END {print n+0}' "$F")
    MED=$(awk -F, 'NR>1 && $5 ~ /GAP_MEDIUM/ {n++} END {print n+0}' "$F")
    echo "Gate 5.5 strict ($L): HIGH=$HIGH MEDIUM=$MED — both must be 0"
    [ "$HIGH" -eq 0 ] && [ "$MED" -eq 0 ] || FAIL=1
  else
    echo "Gate 5.5 strict ($L): LEDGER MISSING — FINAL blocked"
    FAIL=1
  fi
done

REGULAR_BLOCK_LEDGERS="coverage_auth_per_endpoint coverage_cookie_flags coverage_input_validation coverage_csrf coverage_rate_limit_values coverage_webhook_hmac coverage_jwt_algorithm coverage_pii_in_logs coverage_frontend_contract coverage_inmemory_state coverage_audit_logs coverage_idempotency coverage_openapi_drift"
for L in $REGULAR_BLOCK_LEDGERS; do
  F="$LEDGER_DIR/${L}_verified.csv"
  [ -f "$F" ] || F="$LEDGER_DIR/${L}_unclassified.csv"
  if [ -f "$F" ]; then
    HIGH=$(awk -F, 'NR>1 && $5 ~ /GAP_HIGH/ {n++} END {print n+0}' "$F")
    MED=$(awk -F, 'NR>1 && $5 ~ /GAP_MEDIUM/ {n++} END {print n+0}' "$F")
    echo "Gate 5.5 regular ($L): HIGH=$HIGH MEDIUM=$MED — HIGH must be 0 (MEDIUM visible but allowed)"
    [ "$HIGH" -eq 0 ] || FAIL=1
  else
    echo "Gate 5.5 regular ($L): LEDGER MISSING — FINAL blocked"
    FAIL=1
  fi
done

# Gate 6: Fingerprint
FINGERPRINT_FILE=$LEDGER_DIR/.fingerprint
if command -v shasum >/dev/null 2>&1; then
  HASHER="shasum -a 256"
elif command -v sha256sum >/dev/null 2>&1; then
  HASHER="sha256sum"
else
  echo "Gate 6: no shasum/sha256sum — cannot fingerprint"
  FAIL=1
fi
if [ "$FAIL" -eq 0 ]; then
  {
    echo "=== v20 Ledger Fingerprint (computed $TIMESTAMP) ==="
    for f in $LEDGER_DIR/*.csv $LEDGER_DIR/state.json; do
      [ -f "$f" ] || continue
      $HASHER "$f"
    done
  } > "$FINGERPRINT_FILE"
  COMBINED_HASH=$($HASHER "$FINGERPRINT_FILE" | awk '{print $1}')
  if command -v jq >/dev/null 2>&1; then
    jq --arg fp "$COMBINED_HASH" --arg ts "$TIMESTAMP" \
       '.gate_fingerprint = $fp | .gate_last_run_at = $ts | .gate_last_exit_code = 0' \
       $LEDGER_DIR/state.json > $LEDGER_DIR/state.json.tmp && mv $LEDGER_DIR/state.json.tmp $LEDGER_DIR/state.json
  fi
  echo "Gate 6 (fingerprint): $COMBINED_HASH"
fi

if [ "$FAIL" -eq 0 ]; then
  echo "ALL GATES PASS — FINAL report allowed (fingerprint: ${COMBINED_HASH:-unknown})"
else
  echo "AT LEAST ONE GATE FAILED — emit INCOMPLETE_RESUMABLE report only"
  if command -v jq >/dev/null 2>&1 && [ -f $LEDGER_DIR/state.json ]; then
    jq --arg ts "$TIMESTAMP" '.gate_last_run_at = $ts | .gate_last_exit_code = 1' \
       $LEDGER_DIR/state.json > $LEDGER_DIR/state.json.tmp && mv $LEDGER_DIR/state.json.tmp $LEDGER_DIR/state.json
  fi
fi
exit $FAIL
