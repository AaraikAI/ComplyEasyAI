# Audit Prompt v20.1 — Resumable, Subagent-Parallelized, HINT-Forbidden, Gate-Enforced

**Supersedes:** [`AUDIT_PROMPT_v19_EXHAUSTIVE.md`](AUDIT_PROMPT_v19_EXHAUSTIVE.md) (v19.0 and v19.1 produced reports that deferred 96.8% of L7 verification behind `_SCAN_HINT` suffixes while reporting 96.40% overall scores).

**v20.1 vs v20.0:** four reinforcements after the v22 report (which marked 28 GAPs as "deferred" — they were actually intentional patterns — and never ran chaos/perf/e2e):
1. Subagents auto-classify 4 known-intentional patterns (`§1.3`).
2. Gate script writes SHA-256 fingerprint of all ledgers into `state.json`; report MUST embed verbatim gate transcript AND the matching fingerprint, OR be rejected by self-audit (`§6` + `§11`).
3. `test_health_score` reported separately from production score; chaos+perf+e2e mandatory on FINAL pass (Gate 5).
4. §12 lists 7 forbidden agent behaviors that void the report.

**Scanned scope:** entire `ComplyEasyAI` working tree, **excluding `**/node_modules/**`, `**/.claude/worktrees/**`, `**/.archive/**`, `**/__tests__/**`, `**/dist/**`, `**/build/**`, `._*`** (third-party / archived / build artifacts; never counted as production coverage).

---

## SECTION 0 — Why v20 Exists (Diagnostic, Read First)

The v19.1 audit produced `PRODUCTION_READINESS_REPORT.md` (v20 report) with these self-admitted gaps:

| Ledger | Total | Per-op verified | Verified % | What the agent did with the rest |
|---|---:|---:|---:|---|
| L7 multi-tenant ops | 755 | 24 | 3.2% | Marked `*_SCAN_HINT` and counted toward "100% classified" |
| F7 outbound HTTP | 97 | 12 | 12.4% | Marked `*_SCAN_HINT` |
| GAP_FOUND_PER_SCAN files | 28 | 0 | 0% | Deferred to "v21" |
| STATIC_ONLY components | 5 | 0 | 0% | Deferred to "v21" |
| F7 unclassified dynamic URLs | 11 | 0 | 0% | Deferred to "v21" |

And then reported overall **96.40%** — same dishonesty pattern as v18.

### Root causes v20 fixes

1. **`_SCAN_HINT` was treated as a valid verdict.** v19.1 said "no HINT trust" but didn't enumerate banned suffixes. v20 lists every banned suffix and blocks the report if any appear.
2. **CSV rows had no required evidence column.** A row could say `verdict: ORG_OK` with no `file:line` cite. v20 mandates `evidence_lines_read` and `evidence_quote` columns; rows without them are `UNCLASSIFIED`.
3. **"Honest incompleteness allowed" became permission to defer most of the work.** v20 forbids deferral entirely. If work doesn't fit in this session, the session emits an `INCOMPLETE_RESUMABLE` report — NOT a final report — and the next session continues.
4. **The math didn't fit one session.** 755 L7 ops × ~30-line function reads ≈ 23,000 lines, plus F7 + components + services ≈ **160,000+ lines of deep reading**. No single Claude context window can do this honestly. v20 mandates **subagent parallelization** (15-20 parallel subagents per pass) and supports **multi-session resumption** (state in `.claude/audit-v20/state.json`).

---

## SECTION 1 — The Iron Law v20 (Hard-Enforced)

> **Every row in every ledger MUST have a non-empty `evidence_lines_read` and `evidence_quote` column, OR be marked `UNCLASSIFIED`. A report cannot be generated while any `UNCLASSIFIED` row exists. The score cap is `min(verified/total across all ledgers) × 100`. No `_HINT` / `_DEFERRED` / `_VERIFY` / `_NEEDS_DEEPER_READ` suffixes anywhere. No exceptions.**

### 1.1 Banned verdict suffixes (any of these = INCOMPLETE)

These suffixes MUST NOT appear in any ledger CSV or in any report table:

```
_SCAN_HINT
_PER_SCAN
_DEFERRED
_NEEDS_DEEPER_READ
_VERIFY
_HINT
_FROM_HINT
_UNVERIFIED
_TBD
_REVIEW_LATER
_TRUST_PATTERN
```

**Enforcement:** before generating any report or score, the agent MUST run:

```bash
HINT_HITS=$(grep -hE '_SCAN_HINT|_PER_SCAN|_DEFERRED|_NEEDS_DEEPER_READ|_VERIFY[^A-Z_]|_HINT|_FROM_HINT|_UNVERIFIED|_TBD|_REVIEW_LATER|_TRUST_PATTERN' .claude/audit-v20/*.csv 2>/dev/null | wc -l)
if [ "$HINT_HITS" -gt 0 ]; then
  echo "REPORT BLOCKED: $HINT_HITS rows have banned suffixes"
  exit 1
fi
```

If the gate fails: emit an `INCOMPLETE_RESUMABLE` report (§13), NOT a final report. Continue from `.claude/audit-v20/state.json` in the next session.

### 1.2 Banned phrases in the report

Same forbidden-words list as v19 (`sampled`, `spot-checked`, `representative`, `extrapolated`, `trust the HINT`, `the rest`, …) PLUS:

```
DEFERRED to v2[0-9]
DEFERRED to next pass
will be classified later
trusted HINT classifier
HINT-derived
SCAN_HINT
file-level confirmed (without per-op read)
```

Self-audit script (§11) greps the draft for these and blocks the report.

### 1.3 Known-intentional patterns subagents MUST recognize (lesson from v22)

The v22 audit found 28 GAP_FOUND_PER_SCAN entries that were ALL false positives. To prevent this recurring, subagents (and the scan-runner, see scan-runner v3.4) automatically classify these patterns as INTENTIONAL — they never generate a GAP_FOUND verdict:

| Pattern category | Recognized signature | Allowed verdict (NOT GAP) |
|---|---|---|
| **E1** fire-and-forget temp file cleanup | `await unlink(*).catch(() => {})`, `await rmdir(*).catch(() => {})`, `worker.close().catch(() => {})`, `temp*.catch(() => {})` | `INTENTIONAL_FIRE_AND_FORGET` — evidence_quote = the exact `.catch` line |
| **C1** TypeScript enum status values | `'NotImplemented'` or `'Not_Implemented'` appearing as a STRING LITERAL value of an enum, union type, or status comparison (NOT a runtime throw) | `ENUM_STATUS_VALUE_NOT_GAP` — evidence_quote = the enum/union definition line |
| **F11** pure math/crypto library validation guards | `throw new Error(...)` inside files under `services/advanced/dp/`, `services/advanced/bayesian/`, `services/advanced/byzantine*`, `services/advanced/scaffold*`, `services/advanced/secretSharing*`, `services/advanced/rdp*`, `utils/blockchain/anchor*` AND where the function is a pure math/crypto primitive with no HTTP context | `MATH_LIBRARY_PRECONDITION_NOT_GAP` — evidence_quote = the throw line + the function-purity proof line |
| **F11** comment-only references | `throw new Error(...)` appearing inside `//`, `/* */`, or markdown fence | `COMMENT_NOT_ACTIVE_CODE` — evidence_quote = the comment line |

If a subagent encounters one of these patterns and the surrounding evidence matches the signature, it MUST emit the corresponding verdict (NOT `GAP_FOUND`). To prevent abuse: each "allowed" verdict requires evidence_quote to cite the SPECIFIC justification (the enum definition, the file-path proof of math-library scope, the comment delimiters), not just the matched line.

If a subagent is uncertain whether a hit fits one of these signatures, it falls back to per-pattern verdict and lets the orchestrator merge. **Subagents must NOT invent new "ALLOWED_*" verdicts** beyond the four above; if an unfamiliar intentional pattern appears, mark as `NEEDS_CLAUDE_MD_REVIEW` with the rationale in evidence_quote.

### 1.4 Honest score formula (coverage-gated)

```
coverage_factor = min(
  verified_files / total_files,
  verified_L7_ops / total_L7_ops,
  verified_F7_calls / total_F7_calls,
  verified_components / total_components,
  verified_controllers / total_controllers,
  verified_prisma_models / total_prisma_models,
  verified_rate_limit_mounts / total_rate_limit_mounts,
  verified_infra_files / total_infra_files
)

overall_score = (sum of domain scores × weights) × coverage_factor

# If coverage_factor < 0.95: report MUST be titled INCOMPLETE_RESUMABLE.
# If coverage_factor < 0.50: no domain scores reported at all.
```

This makes it mathematically impossible to claim 96% while verifying 3% of L7. If only 3% of L7 is per-op verified, the overall score is capped at 3% of the domain scores.

---

## SECTION 2 — Execution Model (Subagents + Multi-Session)

### 2.1 State file (the spine of resumability)

Before any work begins, initialize `.claude/audit-v20/state.json`:

```json
{
  "audit_version": "v20",
  "started_at": "ISO-8601 timestamp",
  "current_session": 1,
  "ledgers": {
    "files":       { "total": 0, "verified": 0, "unclassified": 0, "last_row_classified": 0 },
    "L7_ops":      { "total": 0, "verified": 0, "unclassified": 0, "chunks": [] },
    "F7_calls":    { "total": 0, "verified": 0, "unclassified": 0, "chunks": [] },
    "components":  { "total": 0, "verified": 0, "unclassified": 0, "chunks": [] },
    "controllers": { "total": 0, "verified": 0, "unclassified": 0 },
    "rate_limits": { "total": 0, "verified": 0, "unclassified": 0 },
    "prisma_rls":  { "total": 0, "verified": 0, "unclassified": 0 },
    "infra":       { "total": 0, "verified": 0, "unclassified": 0 }
  },
  "chunks_pending": [],
  "chunks_done":    [],
  "report_status":  "NOT_READY"
}
```

Every session:
1. Reads `state.json`.
2. Identifies the next PENDING chunks.
3. Dispatches subagents (§2.2) for those chunks.
4. Merges subagent results into ledger CSVs.
5. Updates `state.json` with new `verified` counts.
6. If `coverage_factor >= 0.95` AND `chunks_pending` is empty: generates final report.
7. Otherwise: generates `INCOMPLETE_RESUMABLE` report and exits.

### 2.2 Subagent dispatch protocol

For each work category, divide into chunks of fixed size:

| Category | Chunk size | Total chunks (v18 baseline) | Subagents per pass |
|---|---:|---:|---:|
| L7 ops | 50 ops | 16 (755/50) | up to 16 parallel |
| F7 calls | 25 calls | 4 (97/25) | up to 4 parallel |
| Components | 20 components | 8 (156/20) | up to 8 parallel |
| Services (deep-read) | 10 files | 11 (106/10) | up to 11 parallel |

**Orchestrator's job each session:** spawn up to 20 parallel subagents (Claude's recommended cap per turn) using the Agent tool with subagent_type `general-purpose`. Each subagent receives:
- The chunk number and explicit row range (e.g., "L7 ops #51 through #100")
- The slice of `.claude/audit-v20/L7_unclassified.csv` for that range
- The full prompt template in §2.3 below
- An instruction to return a completed CSV chunk via its final message

Orchestrator collects subagent outputs, merges into the main ledger, marks chunk DONE in `state.json`.

### 2.3 Subagent prompt template (per chunk)

Every subagent gets this exact instruction set (with `{{CHUNK_RANGE}}` and `{{LEDGER_TYPE}}` filled in):

```
You are an audit subagent. You will read EVERY line of code for each row assigned to you and produce a fully-evidenced CSV chunk.

Your assignment: {{LEDGER_TYPE}} rows {{CHUNK_RANGE}} from .claude/audit-v20/{{LEDGER_TYPE}}_unclassified.csv.

For EACH row:
1. Read the cited file. If the function spans more than 80 lines, read in chunks until you cover the full function body.
2. Determine the verdict by direct evidence — NOT by pattern-matching the surrounding scan hint.
3. Fill these columns in the row:
   - verdict: one of the allowed values (see §4-§9 of v20 prompt). NO _HINT / _DEFERRED suffixes.
   - evidence_lines_read: e.g., "vrCollaborativeReviewService.ts:184-217" (the range you actually read).
   - evidence_quote: an exact-quoted line of code from the file proving the verdict (max 200 chars).
   - verified_at: ISO-8601 timestamp
   - verified_by: your subagent ID
4. If the cited line doesn't have enough context in the 80-line window, expand the read. Do NOT leave a row UNCLASSIFIED unless the file genuinely does not exist.

OUTPUT FORMAT: emit the completed CSV chunk as your final message — header row + one row per assignment. Do NOT summarize or add prose. Just the CSV.

FORBIDDEN: any verdict ending in _SCAN_HINT, _PER_SCAN, _DEFERRED, _VERIFY, _HINT, _NEEDS_DEEPER_READ, _UNVERIFIED, _TBD. If you can't classify after reading the file, mark verdict=GENUINELY_UNCLASSIFIABLE and explain in evidence_quote.

Time budget: spend ≤90 seconds per row on average. If a row needs more than 5 minutes, mark verdict=NEEDS_HUMAN_REVIEW with the reason in evidence_quote.
```

The orchestrator MUST NOT classify rows itself. The orchestrator's only job is dispatch + merge + gate.

---

## SECTION 3 — Mandatory Pre-Flight (Run Once Per Audit)

Same as v19.1 §2.1 — read all reference materials. Plus:

```bash
mkdir -p .claude/audit-v20
# Wipe any prior baseline that may have been built from inflated counts
rm -rf .claude/audit-baseline

# Run the v3.3 scan-runner (still required for raw enrichment)
bash '.claude/skills/productions-readiness-audit/scripts/Production Readiness scan-runner.sh' '.'
```

Verify scanner output as before. Then build the v20 UNCLASSIFIED ledgers (§4).

---

## SECTION 4 — Pre-Populate UNCLASSIFIED Ledgers

For each work category, materialize the ledger with one row per entity, **with `verdict` initialized to `UNCLASSIFIED` and evidence columns empty**. The agent cannot mark something "verified" without filling those columns.

### 4.1 L7 ops ledger (755 rows pre-populated)

```bash
# CSV header
echo "op_number,file,line,model,operation,verdict,evidence_lines_read,evidence_quote,verified_at,verified_by" \
  > .claude/audit-v20/L7_unclassified.csv

# Pull raw L7 matches
grep -nE 'prisma\.\w+\.(create|update|delete|upsert|createMany|updateMany|deleteMany)' \
  $(cat .claude/audit-v20/services_all.txt) \
  > /tmp/L7_raw.txt

# Build pre-populated rows
awk -F: '
{
  # Extract model name from the prisma.X.method() call
  model = ""; op = ""
  if (match($0, /prisma\.([a-zA-Z]+)\.([a-z]+)/, m)) {
    model = m[1]; op = m[2]
  }
  printf "%d,%s,%s,%s,%s,UNCLASSIFIED,,,,\n", NR, $1, $2, model, op
}' /tmp/L7_raw.txt >> .claude/audit-v20/L7_unclassified.csv

wc -l .claude/audit-v20/L7_unclassified.csv   # should equal 755 + 1 (header)
```

**Allowed verdicts** (assigned by subagents from §2.3, never by orchestrator alone):
- `ORG_IN_WHERE_OR_DATA` — `organizationId:` appears inside the Prisma call. evidence_quote = the line containing it.
- `ORG_IN_PRIOR_findFirst` — prior `findFirst({ where: { id, organizationId } })` gates the write. evidence_quote = the findFirst line.
- `PARENT_ORG_VERIFIED` — child write where parent's org is verified before. evidence_quote = the parent-lookup line.
- `SYSTEM_LEVEL_NO_ORG_REQUIRED` — system write (audit log, webhook delivery, etc.). evidence_quote = comment/function-name that establishes system context.
- `USER_SELF_NO_ORG_REQUIRED` — user-self operation (2FA enrollment, password change). evidence_quote = the line proving `req.user.id` scoping.
- `NON_PRISMA_FALSE_POSITIVE` — match was `Map.delete` / `crypto.update` / etc. evidence_quote = the object type.
- `GAP_HIGH` — no org check anywhere in the function body. evidence_quote = the write line + a note like "no org check in lines X-Y".
- `GENUINELY_UNCLASSIFIABLE` — file deleted or function genuinely too ambiguous for one subagent. evidence_quote = explanation.

NO suffixes. NO HINT. NO DEFERRED.

### 4.2 F7 calls ledger (97 rows pre-populated)

```bash
echo "call_number,file,line,call_type,verdict,evidence_lines_read,evidence_quote,verified_at,verified_by" \
  > .claude/audit-v20/F7_unclassified.csv

grep -nE '(axios\.(get|post|put|delete|patch|request)|fetch\(|got\(|http\.(get|request)|https\.(get|request))' \
  $(cat .claude/audit-v20/services_all.txt) .claude/audit-v20/server_other.txt \
  | awk -F: '{ printf "%d,%s,%s,%s,UNCLASSIFIED,,,,\n", NR, $1, $2, $3 }' \
  >> .claude/audit-v20/F7_unclassified.csv
```

Allowed verdicts: `SAFE_CONSTANT_NO_OVERRIDE`, `SAFE_ENV_NO_OVERRIDE`, `SAFE_VALIDATED`, `GAP_MEDIUM_PARAM_URL_NO_VALIDATION`, `GAP_MEDIUM_DYNAMIC_NO_VALIDATION`, `GENUINELY_UNCLASSIFIABLE`.

### 4.3 Components ledger (156 rows pre-populated)

```bash
echo "component,verdict,api_call_lines,static_constants_declared,static_constants_overridden,static_constants_persistent,serverReachable_lines,evidence_quote,verified_at,verified_by" \
  > .claude/audit-v20/component_unclassified.csv

while IFS= read -r f; do
  printf "%s,UNCLASSIFIED,,,,,,,,\n" "$f" >> .claude/audit-v20/component_unclassified.csv
done < .claude/audit-v20/components_all.txt
```

Allowed verdicts: `FULLY_WIRED`, `FULLY_WIRED_WITH_FALLBACK`, `DEV_FALLBACK`, `PARTIALLY_WIRED`, `STATIC_ONLY_NEEDS_API`, `INTENTIONAL_STATIC`, `GENUINELY_UNCLASSIFIABLE`.

### 4.4 Same pattern for: services, controllers, rate_limits, prisma_rls, infra

Same shape. Pre-populate every row with `UNCLASSIFIED`. Subagents fill them in.

---

## SECTION 5 — Per-Session Workflow (Resumable)

Each session, the orchestrator runs this loop:

```python
# Pseudocode — actual implementation uses Bash + Agent tool

state = load_json(".claude/audit-v20/state.json")

# 1. Identify what's still pending
pending_chunks = []
for ledger_name, ledger_state in state["ledgers"].items():
    if ledger_state["unclassified"] > 0:
        # Compute chunks for this ledger
        chunks = chunk_unclassified_rows(ledger_name, ledger_state, chunk_size=50)
        pending_chunks.extend(chunks)

# 2. Pick up to 20 chunks for this session (Claude's parallel subagent cap)
this_session_chunks = pending_chunks[:20]

# 3. Dispatch subagents in parallel (single message, multiple Agent tool calls)
results = dispatch_parallel_subagents(
    chunks=this_session_chunks,
    subagent_prompt=SUBAGENT_PROMPT_TEMPLATE
)

# 4. Merge subagent CSV outputs into the main ledgers
for chunk_id, csv_output in results:
    merge_csv_chunk_into_ledger(chunk_id, csv_output)
    state["chunks_done"].append(chunk_id)
    state["chunks_pending"].remove(chunk_id)

# 5. Recompute verified/unclassified counts
for ledger_name in state["ledgers"]:
    state["ledgers"][ledger_name]["verified"] = count_verified_rows(ledger_name)
    state["ledgers"][ledger_name]["unclassified"] = count_unclassified_rows(ledger_name)

# 6. Save state for next session
save_json(".claude/audit-v20/state.json", state)

# 7. Decide report type
coverage_factor = min(
    state["ledgers"][n]["verified"] / state["ledgers"][n]["total"]
    for n in state["ledgers"]
    if state["ledgers"][n]["total"] > 0
)

if coverage_factor >= 0.95 and not state["chunks_pending"]:
    generate_final_report()  # §10
    state["report_status"] = "FINAL_COMPLETE"
else:
    generate_incomplete_resumable_report(state)  # §13
    state["report_status"] = "INCOMPLETE_RESUMABLE"

save_json(".claude/audit-v20/state.json", state)
```

### 5.1 Estimated session count

| Ledger | Total | Chunk size | Chunks | Sessions @ 20 chunks/session |
|---|---:|---:|---:|---:|
| L7 ops | 755 | 50 | 16 | 1 |
| F7 calls | 97 | 25 | 4 | (folded into L7 session) |
| Components | 156 | 20 | 8 | (folded into L7 session) |
| Services deep-read | 106 | 10 | 11 | (folded into L7 session) |
| **Total** | — | — | **~39** | **2 sessions** |

Realistic expectation: **2-3 sessions** to reach `coverage_factor >= 0.95`. Each session takes ~30-60 min of subagent compute (parallel).

---

## SECTION 6 — Hard Gates (Cannot Be Bypassed)

**v20 enforcement principle (lesson from v22):** the agent CANNOT just claim "all gates pass." The v20 design requires (1) the gate script to run AND emit a fingerprint, (2) the agent to paste the verbatim gate output into the report, (3) the report's ledger counts to match the fingerprint. If any of those three diverge, the report is invalid.

Before generating any final report, the agent MUST run this gate script. If any check fails, the report MUST be `INCOMPLETE_RESUMABLE`, not `FINAL`.

```bash
#!/bin/bash
# .claude/audit-v20/check_gates.sh — run before generating any FINAL report.

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

# Gate 3: Every non-header row has non-empty evidence_lines_read AND evidence_quote
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

# Gate 4: state.json reports report_status != FINAL_COMPLETE only if all chunks done
PENDING=$(jq -r '.chunks_pending | length' $LEDGER_DIR/state.json 2>/dev/null || echo 999)
echo "Gate 4 (chunks_pending): $PENDING — must be 0 for FINAL report"
[ "$PENDING" -eq 0 ] || FAIL=1

# Gate 5: FULL test suite (including chaos/performance/e2e) ran on this FINAL pass
FULL_SUITE_LOG=$LEDGER_DIR/logs/server_tests_full.log
if [ ! -f "$FULL_SUITE_LOG" ]; then
  echo "Gate 5 (full test suite incl chaos/perf/e2e): MISSING $FULL_SUITE_LOG — must exist for FINAL"
  FAIL=1
else
  # Verify the log contains chaos AND performance AND e2e markers
  HAS_CHAOS=$(grep -ic 'chaos' "$FULL_SUITE_LOG" || true)
  HAS_PERF=$(grep -ic 'performance' "$FULL_SUITE_LOG" || true)
  HAS_E2E=$(grep -ic 'e2e\|end[- ]to[- ]end' "$FULL_SUITE_LOG" || true)
  echo "Gate 5 (full suite): chaos=$HAS_CHAOS perf=$HAS_PERF e2e=$HAS_E2E — each must be >0"
  [ "$HAS_CHAOS" -gt 0 ] && [ "$HAS_PERF" -gt 0 ] && [ "$HAS_E2E" -gt 0 ] || FAIL=1
fi

# Gate 6: Fingerprint all ledgers and write to state.json (anti-tamper proof)
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
  # Write the combined hash into state.json as `gate_fingerprint`
  COMBINED_HASH=$($HASHER "$FINGERPRINT_FILE" | awk '{print $1}')
  if command -v jq >/dev/null 2>&1; then
    jq --arg fp "$COMBINED_HASH" --arg ts "$TIMESTAMP" \
       '.gate_fingerprint = $fp | .gate_last_run_at = $ts | .gate_last_exit_code = 0' \
       $LEDGER_DIR/state.json > $LEDGER_DIR/state.json.tmp && mv $LEDGER_DIR/state.json.tmp $LEDGER_DIR/state.json
  fi
  echo "Gate 6 (fingerprint): $COMBINED_HASH"
fi

if [ "$FAIL" -eq 0 ]; then
  echo "✅ ALL GATES PASS — FINAL report allowed (fingerprint: ${COMBINED_HASH:-unknown})"
else
  echo "❌ AT LEAST ONE GATE FAILED — emit INCOMPLETE_RESUMABLE report only"
  if command -v jq >/dev/null 2>&1 && [ -f $LEDGER_DIR/state.json ]; then
    jq --arg ts "$TIMESTAMP" '.gate_last_run_at = $ts | .gate_last_exit_code = 1' \
       $LEDGER_DIR/state.json > $LEDGER_DIR/state.json.tmp && mv $LEDGER_DIR/state.json.tmp $LEDGER_DIR/state.json
  fi
fi
exit $FAIL
```

### 6.1 The report MUST embed the gate run

The agent CANNOT just claim "all gates pass." The FINAL report's §2 MUST contain:

1. **Verbatim stdout of `check_gates.sh`** (entire run, including the timestamp on the first line and the fingerprint on the last line). Placed inside a fenced code block titled "Gate run transcript".
2. **The same fingerprint hash** quoted in the report header (`Gate fingerprint: <SHA-256>`) AS WELL AS in `state.json` under `gate_fingerprint`. If these two values diverge, the report was tampered with after the gate ran.
3. **`gate_last_exit_code: 0`** in state.json. If exit_code != 0 or is missing, the agent MUST emit INCOMPLETE_RESUMABLE, not FINAL.

Self-audit script in §11 verifies (a) the verbatim transcript is present in the report, (b) the fingerprint matches state.json, (c) exit_code is 0. If any of those fails, the report is rejected even if the agent typed "FINAL" in the title.

### 6.2 What "running the gates" means operationally

The agent's final-report turn MUST include this exact bash invocation (no shortcuts):

```bash
bash .claude/audit-v20/check_gates.sh 2>&1 | tee .claude/audit-v20/logs/gate_run_$(date -u +%Y%m%dT%H%M%SZ).log
GATE_EXIT=$?
echo "GATE_EXIT=$GATE_EXIT"
if [ "$GATE_EXIT" -ne 0 ]; then
  echo "FINAL REPORT BLOCKED — emit INCOMPLETE_RESUMABLE per §7"
  exit 1
fi
```

The `.log` artifact is preserved in the audit-history archive (§10). If the report claims FINAL without a matching log file, it's invalid.

---

## SECTION 7 — INCOMPLETE_RESUMABLE Report Format

If gates fail, the agent emits this report (replaces `PRODUCTION_READINESS_REPORT.md`):

```markdown
# Production Readiness Report — INCOMPLETE_RESUMABLE (v20 audit pass N)

**Status:** AUDIT IN PROGRESS — DO NOT SHIP based on this report.

## Coverage so far

| Ledger | Total | Verified | % | Chunks pending |
|---|---:|---:|---:|---:|
| L7 ops | 755 | 100 | 13.2% | 13 |
| F7 calls | 97 | 50 | 51.5% | 2 |
| Components | 156 | 80 | 51.3% | 4 |
| ... | | | | |

## Coverage factor: X% (overall_score: NOT_COMPUTED — coverage_factor < 95%)

## Pending chunks for next session

[full list from state.json]

## What's been found so far (preliminary, not final)

[any HIGH/MEDIUM findings discovered in the verified subset, with file:line cites]

## Next session instructions

Re-run the v20 audit prompt. The orchestrator will load `.claude/audit-v20/state.json` and continue from chunk N.
```

This report is HONEST. It says "I have not finished. Do not ship." instead of inventing a 96% score.

---

## SECTION 7.5 — Test Suite Policy (v20 addition)

### 7.5.1 What to run when

| Pass type | npm test scope | Where the log goes |
|---|---|---|
| INCOMPLETE_RESUMABLE (sessions 1..N-1) | `npm test -- --testPathIgnorePatterns='chaos\|performance\|e2e'` (fast suite, ~15-30 min) | `.claude/audit-v20/logs/server_tests_fast.log` |
| FINAL (last session, all gates passing) | **FULL** `npm test` (chaos + performance + e2e included; no exclusions) | `.claude/audit-v20/logs/server_tests_full.log` |

Gate 5 in `check_gates.sh` enforces this: a FINAL report cannot be emitted unless `server_tests_full.log` exists and contains markers for chaos AND performance AND e2e. There is no way to claim FINAL with only the fast suite.

### 7.5.2 TEST_DEBT classification (v22 lesson)

Test failures are real signal but not always production-code signal. v20 distinguishes:

| Failure category | Counts toward production score? | Where it appears |
|---|---|---|
| `TEST_DEBT_MOCK_HOISTING` — jest mock factory referencing `const fm = {...}` (hoisting trap with namespace imports) | NO | §11 TEST_DEBT subsection + `test_health_score` only |
| `TEST_DEBT_STALE_SCHEMA` — test body doesn't match current Joi/Zod schema | NO | TEST_DEBT |
| `TEST_DEBT_MISSING_PRISMA_MOCK` — `prisma.X.findFirst is not a function` due to `{}` mock | NO | TEST_DEBT |
| `TEST_DEBT_STALE_ROUTE` — test hits a route path that doesn't exist on current router | NO | TEST_DEBT |
| `PRODUCTION_FAILURE` — handler crashes, returns wrong shape, leaks data across tenants, etc. | **YES** | §11 HIGH/MEDIUM findings |

The orchestrator (NOT subagents) categorizes each failing test by reading the test file + the failure output. The four TEST_DEBT categories are inferred from these signatures:

- Mock hoisting trap: failure mode is timeout + test uses `import * as X from` + `jest.mock(...)` with a closure-captured constant
- Stale schema: failure status is 400 with body containing Joi/Zod error structure
- Missing Prisma mock: failure status is 500 with stack trace containing `Cannot read property 'find\|create\|update' of undefined`
- Stale route: failure status is 404 and the test URL doesn't match any registered route

Any failure that doesn't fit one of these four → MUST be classified as `PRODUCTION_FAILURE` and surfaced as a real finding.

### 7.5.3 `test_health_score` (separate from production score)

A new top-level metric, reported alongside the production score:

```
test_health_score = (passing_tests / total_tests) × 100
```

This appears in §1 (Build & Tooling) AND in the report header. The production overall_score is NOT affected by test debt (per CLAUDE.md Pitfall 4: avoid the Hydra effect — don't conflate test-infrastructure debt with production gaps). But `test_health_score` is always visible and tracks over time.

A FINAL report with `test_health_score < 90` MUST flag this as a HIGH-priority TEST_DEBT item in §11 (without blocking FINAL — see §7.5.4).

### 7.5.4 Why TEST_DEBT doesn't block FINAL

The user's reasoned position (v22 §11.2): "production code is correct, tests just need a contract-test refresh sprint." The four TEST_DEBT categories above are mechanical patterns — they reflect drift between tests and code, not bugs in production handlers. Blocking FINAL on them would conflate two different remediation programs.

BUT: the categorized list of test failures MUST appear in §11 (TEST_DEBT subsection) with per-failure root cause, test file, and proposed fix. If even one failure can't be cleanly slotted into a TEST_DEBT bucket, that failure IS a `PRODUCTION_FAILURE` finding and DOES block FINAL.

---

## SECTION 8 — FINAL Report Format (only emitted when ALL gates pass)

Same shape as v19.1 §9 but with these adjustments:

| Section | Change vs v19.1 |
|---|---|
| Header | Mandatory two lines: `Coverage factor: 100% (or ≥95%) — all gates pass` AND `Gate fingerprint: <SHA-256 from state.json>` AND `test_health_score: NN.NN% (M passing of T total)`. |
| §1 Build & Tooling | New row: `test_health_score | <PCT> | logs/server_tests_full.log` — must reference the FULL suite log (chaos + perf + e2e), not the fast suite. |
| §2 Completion Gate | (a) Each ledger row must show `verified == total`. (b) Must include verbatim stdout of `check_gates.sh` inside a fenced code block titled "Gate run transcript". (c) Must include the fingerprint line `Computed gate fingerprint: <hash>` and assert it matches state.json's `gate_fingerprint`. If any row shows `verified < total`, this is INCOMPLETE_RESUMABLE not FINAL. |
| §4 L7 Ledger | The verdict-count table MUST sum to 755. No `_HINT` columns. The four "allowed intentional" verdicts (`INTENTIONAL_FIRE_AND_FORGET`, `ENUM_STATUS_VALUE_NOT_GAP`, `MATH_LIBRARY_PRECONDITION_NOT_GAP`, `COMMENT_NOT_ACTIVE_CODE`) ARE allowed and shown explicitly. |
| §5 F7 Ledger | The verdict-count table MUST sum to 97. No `_HINT` columns. |
| §6 Components | Per-component evidence shown for all 156, not just "PARTIALLY_WIRED + STATIC_ONLY". |
| **§11 NEW — TEST_DEBT subsection** | One row per failing test with: `test_file:test_name | failure_category | proposed_fix | confidence`. Categories from §7.5.2. If any row category is `PRODUCTION_FAILURE`, the report cannot be FINAL. |
| §12 Scoring | Score formula MUST include the coverage_factor multiplier. Show the computation. The production overall_score is reported separately from test_health_score (per §7.5.3). |
| §13 Honest Incompleteness | If FINAL, this section says "All ledgers at 100%." No deferrals. TEST_DEBT items go in §11, not here. |

---

## SECTION 9 — What This Costs You

Realistic resource estimate:

| Pass | Agent compute | Wall clock | What gets done |
|---|---|---|---|
| 1 | ~20 parallel subagents × ~30 min | ~30-60 min | Pre-populate ledgers; first 20 chunks (~1000 rows) verified |
| 2 | ~19 more chunks | ~30-60 min | Remaining chunks verified; gates pass; FINAL report emitted |

Total: **2 sessions, ~1-2 hours of agent compute**, producing a report whose 96% means "96% of the security surface was per-op verified," not "96% of the agent's mood was optimistic."

If a chunk fails (e.g., a subagent times out): the orchestrator marks that chunk PENDING again. Next session retries it. State is durable.

---

## SECTION 10 — Output Filenames & Preservation

- Working state: `.claude/audit-v20/` (git-ignored under `.claude/`)
  - `state.json` — resumability spine
  - `*_unclassified.csv` — pre-populated ledgers
  - `*_verified.csv` — completed rows (subagents write these; orchestrator merges)
  - `logs/` — build/lint/test output
- FINAL deliverable: `PRODUCTION_READINESS_REPORT.md` (overwrite, after backing up the previous file to `PRODUCTION_READINESS_REPORT.v19-backup.md`)
- Audit trail: `.archive/audit-history/v20/` — copy of all ledgers + state.json + logs at the time of FINAL report generation
- INCOMPLETE reports: also write to `PRODUCTION_READINESS_REPORT.md` (it's clearly titled INCOMPLETE_RESUMABLE, so it can't be confused for FINAL)

---

## SECTION 11 — Self-Audit Checklist (Run Before Submitting Any Report)

The agent runs ALL of these AND embeds the outputs in the report transcript section.

```bash
# Step 1: Run the gates (this writes fingerprint + state.json updates)
bash .claude/audit-v20/check_gates.sh 2>&1 | tee .claude/audit-v20/logs/gate_run_$(date -u +%Y%m%dT%H%M%SZ).log
GATE_EXIT=$?

# Step 2: Forbidden-phrase scan on the draft report
egrep -i -n 'sampled|spot[- ]check|representative|extrapolat|trust the hint|hint[- ]confirmed|deferred to v|will be classified|trusted hint classifier|file-level confirmed.*without per-op|SCAN_HINT' PRODUCTION_READINESS_REPORT.md
PHRASE_HITS=$?  # grep exits 0 on match, 1 on no-match — we WANT no-match
[ "$PHRASE_HITS" -eq 1 ] && echo "✅ no forbidden phrases" || echo "❌ forbidden phrases present"

# Step 3: Verify the report embeds the gate transcript verbatim
if grep -q 'Gate run transcript' PRODUCTION_READINESS_REPORT.md && \
   grep -q 'Computed gate fingerprint:' PRODUCTION_READINESS_REPORT.md; then
  echo "✅ gate transcript embedded"
else
  echo "❌ report missing 'Gate run transcript' or 'Computed gate fingerprint:' — REJECT"
  exit 1
fi

# Step 4: Verify the fingerprint in the report matches state.json
REPORT_FP=$(grep -oE 'Computed gate fingerprint:[[:space:]]*[a-f0-9]{64}' PRODUCTION_READINESS_REPORT.md | awk '{print $NF}')
STATE_FP=$(jq -r '.gate_fingerprint' .claude/audit-v20/state.json)
if [ "$REPORT_FP" = "$STATE_FP" ] && [ -n "$REPORT_FP" ]; then
  echo "✅ fingerprint matches state.json: $REPORT_FP"
else
  echo "❌ fingerprint mismatch — report=$REPORT_FP state=$STATE_FP — REJECT"
  exit 1
fi

# Step 5: Verify state.json says exit_code 0
STATE_EXIT=$(jq -r '.gate_last_exit_code' .claude/audit-v20/state.json)
if [ "$STATE_EXIT" = "0" ]; then
  echo "✅ state.json gate_last_exit_code = 0"
else
  echo "❌ state.json reports gate failure (exit=$STATE_EXIT) — emit INCOMPLETE_RESUMABLE"
  exit 1
fi

# Step 6: Verify FINAL pass actually ran chaos + performance + e2e
if grep -q '^# Production Readiness Report.*FINAL\|^# Production Readiness Report (v' PRODUCTION_READINESS_REPORT.md; then
  if [ ! -f .claude/audit-v20/logs/server_tests_full.log ]; then
    echo "❌ FINAL report claims to be FINAL but no server_tests_full.log exists"
    exit 1
  fi
  HAS_CHAOS=$(grep -ic 'chaos' .claude/audit-v20/logs/server_tests_full.log)
  HAS_PERF=$(grep -ic 'performance' .claude/audit-v20/logs/server_tests_full.log)
  HAS_E2E=$(grep -ic 'e2e\|end[- ]to[- ]end' .claude/audit-v20/logs/server_tests_full.log)
  if [ "$HAS_CHAOS" -eq 0 ] || [ "$HAS_PERF" -eq 0 ] || [ "$HAS_E2E" -eq 0 ]; then
    echo "❌ FINAL report missing chaos/perf/e2e markers in full test log — REJECT"
    exit 1
  fi
  echo "✅ FINAL pass ran chaos + perf + e2e"
fi
```

Decision tree:
- All 6 checks pass → emit FINAL report.
- ANY check fails → emit INCOMPLETE_RESUMABLE report (§7), update state.json, exit.

The agent cannot skip these checks. The presence of the gate-run log file + fingerprint match + state.json exit_code = the only proof the report can use to claim FINAL.

---

## SECTION 12 — Hand-Off to the Agent (Each Session)

The agent's session MUST execute these steps IN ORDER. None may be skipped or merged.

### Step A: Initialize or resume

```bash
mkdir -p .claude/audit-v20 .claude/audit-v20/logs
if [ ! -f .claude/audit-v20/state.json ]; then
  # First session — run §3 pre-flight + §4 ledger pre-population
  echo "FRESH START — running §3 + §4"
  # ... (initialization commands from §3 and §4)
else
  echo "RESUMING from state.json"
  jq '.ledgers, .chunks_pending, .chunks_done' .claude/audit-v20/state.json
fi
```

### Step B: Dispatch parallel subagents

Identify the next ≤20 PENDING chunks from `state.json`. Dispatch them in a SINGLE message containing multiple Agent tool calls (so they run in parallel). Use the subagent prompt template from §2.3 verbatim. Wait for all subagents to return.

### Step C: Merge subagent CSV outputs

For each returned chunk, append rows into the corresponding `*_verified.csv`. Update `state.json`:
- Increment `ledgers.<name>.verified` by the count of rows added.
- Decrement `ledgers.<name>.unclassified` similarly.
- Move chunk ID from `chunks_pending` to `chunks_done`.

### Step D: Decide whether this can be the FINAL session

```bash
PENDING=$(jq -r '.chunks_pending | length' .claude/audit-v20/state.json)
if [ "$PENDING" -gt 0 ]; then
  echo "More chunks pending — this is NOT the FINAL pass; emit INCOMPLETE_RESUMABLE and exit"
  # Skip steps E and F; jump to §7 report format
  exit 0
fi
```

If `PENDING > 0`: skip to step G, emit INCOMPLETE_RESUMABLE, exit.

### Step E: Run the FULL test suite (FINAL pass only)

```bash
( cd server && npm test 2>&1 | tee ../.claude/audit-v20/logs/server_tests_full.log )
# This is the FULL suite including chaos, performance, e2e — no exclusions.
# Verify markers exist:
grep -ic 'chaos\|performance\|e2e' .claude/audit-v20/logs/server_tests_full.log
```

If chaos/perf/e2e markers are absent, the test config is excluding them — fix `jest.config.js`/`package.json` test script before proceeding. A FINAL report without these is invalid (Gate 5 will block).

### Step F: Run check_gates.sh AND self-audit checklist

```bash
bash .claude/audit-v20/check_gates.sh 2>&1 | tee .claude/audit-v20/logs/gate_run_$(date -u +%Y%m%dT%H%M%SZ).log
GATE_EXIT=$?
if [ "$GATE_EXIT" -ne 0 ]; then
  echo "Gates failed — emit INCOMPLETE_RESUMABLE per §7"
  # Skip step G's FINAL path; emit INCOMPLETE_RESUMABLE
fi
```

The gate output IS the report's §2 evidence. Capture it.

### Step G: Emit the report

- If `GATE_EXIT == 0` AND `PENDING == 0` AND test_health_score has zero `PRODUCTION_FAILURE` rows: **emit FINAL per §8.** The report MUST include the gate-run transcript verbatim and the fingerprint line.
- Otherwise: **emit INCOMPLETE_RESUMABLE per §7.** No exceptions, no shortcuts.

### Forbidden agent behaviors (any of these voids the report)

1. **Claiming gates pass without running `check_gates.sh`.** State.json's `gate_last_run_at` timestamp must be within the current session.
2. **Classifying rows yourself (orchestrator) instead of via subagents.** Subagents do per-op work; orchestrator only dispatches and merges.
3. **Editing ledger verdicts by hand to satisfy gates.** Detected by the fingerprint mismatch.
4. **Inventing verdict suffixes not in §4 / §1.3.** Auto-rejected by Gate 1.
5. **Excluding chaos/perf/e2e on the FINAL pass.** Detected by Gate 5.
6. **Pasting an old gate run output into a new report.** Detected by fingerprint mismatch with current state.json.
7. **Conflating TEST_DEBT with PRODUCTION_FAILURE.** Each failing test must be classified per §7.5.2; misclassification surfaces as a separate finding.

---

## Revision history

| Version | What changed | Why |
|---|---|---|
| v20.0 | Full structural rewrite. Pre-populated UNCLASSIFIED ledgers; mandatory evidence columns; banned-suffix enforcement; subagent parallelization (15-20 parallel); multi-session resumability via state.json; coverage-gated score formula; hard gate script. | v19.1 produced 96.40% score on 3.2% verification. v20 closes every escape hatch that allowed this. |
| v20.1 (this file) | Four reinforcements after v22 audit feedback: (1) §1.3 lists 4 known-intentional patterns that subagents auto-classify (E1 unlink-catch, C1 enum status values, F11 math-lib throws, F11 in comments) — closes the 28 GAP_FOUND false-positive bucket from v22 §11.1. (2) §6 + §11 add SHA-256 fingerprint of all ledgers written to state.json + verbatim gate-run transcript embedded in report; agent cannot fake gate runs. (3) §7.5 NEW: TEST_DEBT classification (4 mechanical categories) and `test_health_score` separate from production overall_score; chaos/perf/e2e mandatory on FINAL pass via Gate 5. (4) §12 hand-off lists 7 forbidden agent behaviors that void the report. | v22 report still tolerated test-infrastructure debt invisibly; agent could in principle have skipped check_gates.sh and the user wouldn't have known; npm test was excluding chaos/perf/e2e; 28 GAPs were marked deferred rather than recognized as intentional patterns. |

---

*v20 is designed to be honest about scale: 160,000+ lines of code reading cannot fit in one Claude session. Subagents + multi-session resumability is the only path. The agent CANNOT fake completion because the gates are mechanical.*
