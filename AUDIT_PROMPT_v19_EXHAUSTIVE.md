# ⚠️ DEPRECATED — Use [AUDIT_PROMPT_v20_RESUMABLE.md](AUDIT_PROMPT_v20_RESUMABLE.md) instead

**Why this is deprecated:** v19.0 and v19.1 both produced reports (`PRODUCTION_READINESS_REPORT.md` versions v19 and v20) that deferred 96.8% of L7 verification behind `_SCAN_HINT` suffixes while reporting 96.40% overall scores. The escape hatches in this prompt let the agent claim "100% classified" without actually classifying.

**v20 fixes the structural problems:** pre-populated UNCLASSIFIED ledgers, mandatory evidence columns per row, banned-suffix enforcement, subagent parallelization (15-20 in parallel), multi-session resumability via `state.json`, coverage-gated score formula, mechanical hard gates the agent cannot bypass.

**Do not run this v19 prompt for new audits.** It is kept here only as historical reference for the v20 report.

---

# Audit Prompt v19 — Exhaustive Per-File Scan (Zero Sampling) [SUPERSEDED]

**Successor to:** the v14-era prompt referenced in `PRODUCTION_READINESS_REPORT.md` (v18).
**Purpose:** force the next audit to scan EVERY file, classify EVERY operation, and cite codebase evidence for EVERY result. No sampling. No spot-checking. No HINT-trust shortcuts.
**Scope:** entire `ComplyEasyAI` working tree, **excluding `**/node_modules/**`** (third-party code; never counted as production coverage).

## Revision history

| Version | What changed | Why |
|---|---|---|
| v19.0 | Initial release — forbid sampling, require per-file/op/call/component ledgers with line citations | v18 self-disclosed 10.9% L7 verification + extrapolation |
| v19.1 (this version) | Three fixes applied after v19.0 produced false positives: (1) server-only scoping on the `console.log`/`throw new Error`/empty-catch "must be 0" rules — frontend components had 65 spurious GAP_FOUND rows; (2) Prisma × RLS source corrected to `supabase_schema.sql` — v19.0 searched `server/prisma/migrations/` only and falsely concluded "no RLS"; (3) explicit `-not -path "*/node_modules/*"` on every `find` in §2.3 and §3.x so vendored code is never counted as production scope | v19.0 GAP_FOUND rate was misleading; reviewer flagged Section 3 false positives |

## Universal exclusion rule

Every `find`, `grep -r`, and file-list operation in this prompt MUST exclude:

```
*/node_modules/*       — third-party code, never production scope
*/.claude/worktrees/*  — git worktree clones (3× inflation, see scan-runner §2.2.1)
*/.archive/*           — historical snapshots
*/__tests__/*          — unit tests (separate scope, not production)
*/dist/*  */build/*    — build artifacts
*/.git/*  */coverage/* — VCS and reports
._*                    — macOS AppleDouble metadata
```

Counting any of these as production code misrepresents codebase completeness. The scanner already enforces this (`scan-runner.sh:36-52` + `GREP_EXCL` constant); every prompt-side `find` below mirrors the same exclusion set explicitly.

---

## SECTION 0 — Why This Prompt Exists (Read First)

The v18 audit (Overall 97.10%, dated 2026-05-23) self-disclosed the following sampling shortcuts in its own Appendix A and Section 2:

| v18 admission | Quote | Violation |
|---|---|---|
| L7 per-op coverage | "82/755 (10.9%) per-op verified … remainder follow same pattern by HINT classifier" | Sampling |
| L7 ORG_SCOPED | "360 of 360 ORG_SCOPED L7 (HINT confirmed by scan extraction)" | HINT-trust, not code-read |
| L7 ORG_IN_FUNC | "317 of 317 ORG_IN_FUNC_NOT_IN_WRITE L7 (HINT confirms findFirst-then-write idiom)" | HINT-trust |
| L7 NO_ORG_CHECK | "75 of 75 NO_ORG_CHECK Prisma-only triage (sampled 6 confirming false-positive on non-Prisma operations)" | Sample of 6, extrapolated to 75 |
| PARTIALLY_WIRED components | "Grepping for serverReachable symbol across 5 sampled components — all 5 present" | 5 of 14 verified, 9 extrapolated |
| Spot reads | "Spot-reading CEMarkingWorkflow.tsx, SBOMManager.tsx, WorkflowAutomationRules.tsx" | 3 spot reads, 11 extrapolated |
| F7 DYNAMIC_URL | "23 of 23 DYNAMIC_URL_NO_VALIDATION F7 (provider integration services with pinned base URLs)" | HINT-trust |
| Controller residue | "Remaining 54 are 200/201/204 success responses or two intentional structured-diagnostic shapes" | Asserted, not enumerated |

**v19 forbids every one of those shortcuts.** Each operation, each call site, each component, and each remaining controller `res.status()` MUST appear as its own row in the report with a `file:line` citation drawn from a direct file read performed during this audit (not from a HINT classifier or memory of past audits).

---

## SECTION 1 — The Iron Law (Non-Negotiable)

> **Every claim in the final report MUST be backed by a `file:line` citation from a file read during this audit, OR be marked `UNVERIFIED`. No HINT classifier output, no MEMORY.md claim, no prior-audit conclusion, no "spot check," no "sampled," no "trust pattern" may stand on its own. If you cannot cite the line, you cannot make the claim.**

**Forbidden words and phrases anywhere in the report (case-insensitive). Presence of any of these = automatic INCOMPLETE status:**

`sampled` · `spot-checked` · `spot read` · `representative` · `extrapolated` · `trust the HINT` · `HINT-confirmed` · `assumed safe` · `pattern suggests` · `same pattern by` · `follows the same idiom` · `we can infer` · `likely safe` · `presumed` · `de facto` · `by extension` · `top N` · `top 15` · `top 25` · `the rest` · `the remainder` · `et al.` · `…` (as a stand-in for un-enumerated items)

**Allowed neutral phrasing for genuine incompleteness:** `UNCLASSIFIED — pending re-read`, `INCOMPLETE — N of M classified`, `DEFERRED to v20`. Honest incompleteness is acceptable; disguised sampling is not.

---

## SECTION 2 — Mandatory Pre-Flight (Run Before Any Classification)

### 2.1 Read the entire methodology surface

| # | File | Required action |
|---|---|---|
| 1 | `.claude/CLAUDE.md` | Read in full. Note all v4–v12 rules + intentional static list + unfixable upstream vulns. |
| 2 | `.claude/skills/productions-readiness-audit/Production Readiness SKILL.md` | Read in full (2,001 lines). Internalize all Pitfalls 1–56. |
| 3 | All 7 files in `.claude/skills/productions-readiness-audit/references/` | Read each in full: `scan-patterns.md`, `classification-guide.md`, `feature-completeness.md`, `application-logic.md`, `security-audit.md`, `deployment-hardening.md`, `report-template.md`. |
| 4 | `.claude/audit-exclusions.json` | Read in full. Use to suppress known false positives only — never to suppress unverified gaps. |
| 5 | `PRODUCTION_READINESS_REPORT.md` (v18) | Read in full as a delta baseline. |
| 6 | `PRODUCTION_READINESS_REPORT.v17-backup.md`, `PRODUCTION_READINESS_REPORT.v16-backup.md` | Read in full. Each must contribute to the cross-audit reconciliation table. |
| 7 | `AUDIT_PROMPT_GAP_ANALYSIS.md`, `MASTER_VERIFICATION_PROMPT.md` | Read in full. Reconcile findings. |
| 8 | Any `Claude_Desktop_*` or `Cursor_*` report in `.archive/audit-history/` | Read each in full. Add findings to the reconciliation UNION. |
| 9 | `/Users/gverma/.claude/projects/-Users-gverma-Desktop-AARAIK-LLC-ComplyEasyAI/memory/MEMORY.md` | Read for context only. **NEVER use as evidence (Pitfall 5).** |

### 2.2 Run the scan-runner (v3.3 or newer — REQUIRED)

```bash
# Wipe any prior baseline that may have been built before v3.3 — earlier runs
# included .claude/worktrees/ and .archive/ in their file lists, which inflated
# L7 to ~2,119 ops (vs. ~755 real) and F7 to ~291 calls (vs. ~97 real).
rm -rf .claude/audit-baseline

bash '.claude/skills/productions-readiness-audit/scripts/Production Readiness scan-runner.sh' '.'
```

**v3.3 fixes encoded in the scanner** (verify these are present before running — if not, upgrade the scanner):

| Fix | File | Symptom of un-fixed version |
|---|---|---|
| Bash redirection `<` failure bypassing `2>/dev/null` on `wc` | `extract-l7-context.sh:187` (now guarded with `[ -f ]`) | dozens of `wc -l < /var/folders/.../tmp.XXX/._.claude_worktrees_..._scoped: No such file or directory` |
| `grep -c \|\| echo 0` producing `"0\n0"` (grep -c always prints 0) | `extract-component-wiring.sh:54, 59` (now `$(grep -c ...); X=${X:-0}`) | `[: 0\n0: integer expression expected` |
| File lists including `.claude/worktrees/`, `.archive/`, AppleDouble `._*` | `scan-runner.sh:212` master `find` + `GREP_EXCL` | L7 ops ≈ 2,119 (3× real); F7 ≈ 291 (3× real); per-file ledger inflated |

Verify after completion:
- `/tmp/audit_scan_log.txt` shows zero timeouts.
- `/tmp/audit_metrics.json` reports `scanner_version >= 3.3-v13`.
- All four extraction scripts ran: `extract-service-summary.sh`, `extract-l7-context.sh`, `extract-f7-context.sh`, `extract-component-wiring.sh`.
- Output files exist and are non-empty:
  - `/tmp/audit_service_summary.txt`
  - `/tmp/audit_L7_enriched.txt`
  - `/tmp/audit_F7_enriched.txt`
  - `/tmp/audit_component_wiring_detail.txt`
  - `/tmp/audit_component_wiring_summary.txt`
- **Stderr is clean.** Any `No such file or directory`, `integer expression expected`, or `syntax error` lines from the extractors → STOP and report. Do NOT proceed with a noisy run, because the inflated counts will silently invalidate every per-file ledger.

**Expected counts on a clean v3.3 run** (v18 baseline; new audits may differ slightly):

| Metric | Expected | Inflated v3.2 result | Notes |
|---|---:|---:|---|
| Production files (lean) | ~1,917 | ~1,917 | Lean list already excluded most things; AppleDouble exclusion just trims noise |
| Service files | 106 | 106 | Worktree services NOT counted — they live under `.claude/worktrees/` |
| L7 write ops | ~755 | 2,119 | 3× inflation from worktree clones |
| F7 HTTP calls | ~97 | 291 | 3× inflation from worktree clones |
| Components | 156 | 156 | `components/` directory has no worktree shadow |

If your real counts diverge from these by >20%, investigate before classifying anything.

If any output is missing, re-run that extraction script individually before proceeding.

### 2.2.1 `/tmp/audit_*` wipe behaviour — DO NOT re-run the scanner mid-audit

The scan-runner unconditionally wipes `/tmp/audit_*.txt`, `/tmp/audit_*.jsonl`, `/tmp/audit_*.csv`, `/tmp/audit_scan_log.txt`, and `/tmp/audit_metrics.json` at startup (it would otherwise leave orphaned files from removed patterns confusing the next run). Starting in v3.3 the wipe is non-destructive: the previous outputs are first **moved** to `.claude/audit-prev-run/` so they remain recoverable.

**Consequences for this audit:**
- **NEVER re-run the scan-runner once you have begun classifying.** A re-run rebuilds every L7/F7/service/component output file from scratch; your in-progress reading of those files becomes stale and you may classify the wrong line numbers.
- If you genuinely need a re-run (e.g., to verify a fix you applied), first copy the current scan outputs:
  ```bash
  mkdir -p .claude/audit-v19/preserved-scan-outputs
  cp /tmp/audit_*.txt /tmp/audit_*.jsonl /tmp/audit_metrics.json .claude/audit-v19/preserved-scan-outputs/
  ```
  Then re-run, then compare the new outputs to the preserved ones for the specific files you fixed. Do NOT re-classify the entire ledger from the new run — that's a methodology reset.
- If you forget and re-run anyway: the previous scan outputs are at `.claude/audit-prev-run/`. Copy them back to `/tmp/` to restore your working state, then resume classification.
- **All v19 manual ledgers MUST live under `.claude/audit-v19/`, not under `/tmp/`.** This is enforced in §2.3 and §4-§6 below. Anything written to `/tmp/audit_*` is volatile.

### 2.3 Establish the universal file ledger (the spine of the audit)

**All v19 manual ledgers live under `.claude/audit-v19/`** — NOT `/tmp/`. The scan-runner wipes `/tmp/audit_*` on every invocation (§2.2.1). `.claude/audit-v19/` is git-ignored (parent `.claude/` is in `.gitignore`) so it survives scan re-runs and won't pollute commits.

```bash
mkdir -p .claude/audit-v19
```

Build `.claude/audit-v19/ledger_files.txt` containing every production source file. Each row must be classified by the time the report is written.

```bash
# Build the master ledger — every TS/TSX/JS/JSX/SQL/YML/Dockerfile in production scope.
# Apply the SAME exclusions as the v3.3 scan-runner:
#   - node_modules / dist / build / .git / coverage  (build artifacts)
#   - .claude/worktrees/                            (git worktree clones — 3× inflation)
#   - .archive/                                     (historical snapshots)
#   - ._*                                           (macOS AppleDouble metadata)
{
  find server/src -type f \( -name "*.ts" -o -name "*.tsx" \) \
    -not -path "*/__tests__/*" -not -name "._*"
  find src -type f \( -name "*.ts" -o -name "*.tsx" \) \
    -not -path "*/__tests__/*" -not -name "._*"
  find components -type f -name "*.tsx" \
    -not -path "*/__tests__/*" -not -name "._*"
  find server/prisma -type f -name "*.prisma" -not -name "._*"
  find server/prisma/migrations -type f -name "*.sql" -not -name "._*"
  find . -maxdepth 4 -type f \( -name "Dockerfile*" -o -name "docker-compose*.yml" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/.claude/worktrees/*" \
    -not -path "*/.archive/*" \
    -not -name "._*"
  find .github/workflows -type f \( -name "*.yml" -o -name "*.yaml" \) -not -name "._*"
  find . -maxdepth 4 -type f \( -path "*/logstash/*.conf" -o -path "*/nginx/*.conf" -o -path "*/prometheus/*.yml" -o -path "*/grafana/*" -o -path "*/falco/*" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/.claude/worktrees/*" \
    -not -path "*/.archive/*" \
    -not -name "._*"
} | sort -u > .claude/audit-v19/ledger_files.txt

wc -l .claude/audit-v19/ledger_files.txt   # this is your N. The report's per-file table MUST have N rows.

# Initialize CSV header
echo "file_path,verdict,evidence_lines,classified_by_audit_pass,notes" > .claude/audit-v19/ledger.csv
```

Every file in `.claude/audit-v19/ledger_files.txt` MUST get exactly one row in `.claude/audit-v19/ledger.csv` by audit end, with:
- `verdict ∈ {CLEAN, GAP_FOUND, INTENTIONAL_STATIC, DEFERRED_REASON}`
- `evidence_lines` = comma-separated `file:line` cites of code actually read
- `classified_by_audit_pass` = the section number where this file was processed (e.g., `3.2`, `4.1`, `5.1`)
- `notes` = one-line rationale

**Gate:** if the row count of `.claude/audit-v19/ledger.csv` ≠ row count of `.claude/audit-v19/ledger_files.txt`, the audit is INCOMPLETE and the report cannot be submitted.

---

## SECTION 3 — Per-File Deep Read (Mandatory, 100% Coverage)

### 3.1 Server services — read every file end-to-end

```bash
# Count
find server/src/services -type f -name "*.ts" \
  -not -path "*/__tests__/*" \
  -not -path "*/node_modules/*" \
  | wc -l   # = S

# Enumerate
find server/src/services -type f -name "*.ts" \
  -not -path "*/__tests__/*" \
  -not -path "*/node_modules/*" \
  | sort > .claude/audit-v19/services_all.txt
```

For every file in `.claude/audit-v19/services_all.txt`:
1. Read the file in full. If `>2,000` lines, read in chunks using `offset+limit` until 100% covered. Record the chunk ranges in the verification trail.
2. Record in the per-file ledger:
   - line count
   - function count (`^(export )?(async )?(function|const) \w+`)
   - write op count (`prisma\.\w+\.(create|update|delete|upsert)`)
   - outbound HTTP count (`axios\.|fetch\(|got\(|http\.|https\.`)
   - bare `throw new Error(` count (must be 0 — flag each as a gap)
   - empty catch `catch \(.*?\) \{ ?\}` count (must be 0 — flag each)
   - `console\.(log|warn|error)` count (must be 0 — flag each)
3. Classify each write op individually in the L7 ledger (Section 4).
4. Classify each HTTP call individually in the F7 ledger (Section 5).

**SCOPE GUARDRAIL (v19.1 — added after v19 false-positive review):** The three "must be 0" rules above apply ONLY to server production code (`server/src/**`, excluding `__tests__`, `scripts/`, `cli/`). They do NOT apply to:
- **Frontend components** (`components/**`, `src/pages/**`, `src/views/**`) — `console.log` is browser logging, not a server bug. `throw new Error(...)` in form validators and React error boundaries is idiomatic. Do not mark a frontend file as `GAP_FOUND` because it contains `console.*` or bare `throw new Error()`.
- **Mobile React Native code** (`mobile/**`) — same reasoning as frontend.
- **Build/CLI scripts** (`scripts/`, `cli/`, `bin/`) — these are operator tools, console output is expected.
- **Service-worker code** (`public/service-worker.js`) — runs in browser context.

CLAUDE.md says: "❌ NEVER use `console.warn()`, `console.error()`, `console.log()` **in server code**." The "in server code" qualifier is load-bearing — propagate it to every classification.

A frontend component should be classified `GAP_FOUND` only when it has a real production gap (e.g., `PARTIALLY_WIRED` with non-overridden static state, missing API wiring where a backend route exists, hardcoded credentials, dangerously-set innerHTML without sanitization). Console statements alone are `CLEAN`.

**Gate:** number of files read = S. If S = 106 (v18 baseline), the audit MUST produce 106 rows in the services-read ledger. If you process 105, you say `INCOMPLETE — 105 of 106 classified` and name the missing file.

### 3.2 Controllers — read every file end-to-end

```bash
find server/src/controllers -type f -name "*.ts" \
  -not -path "*/__tests__/*" \
  -not -path "*/node_modules/*" \
  | sort > .claude/audit-v19/controllers_all.txt
wc -l .claude/audit-v19/controllers_all.txt   # = C
```

Per controller:
- Enumerate EVERY `res.status(N)` call with `file:line`.
- For each: classify as `SUCCESS_2xx` (no action), `ERROR_4xx_5xx_SHOULD_USE_AppError` (gap, must be enumerated by line — NOT counted in aggregate), or `INTENTIONAL_STRUCTURED_DIAGNOSTIC` (cite the contract test that asserts the shape).
- The v18 report's claim "Remaining 54 are … success responses or two intentional structured-diagnostic shapes" is FORBIDDEN as-stated. v19 must list every one of those 54 as its own line in a table.

### 3.3 Routes, middleware, config, utils — read every file end-to-end

```bash
find server/src/routes server/src/middleware server/src/config server/src/utils server/src/validators \
  -type f -name "*.ts" \
  -not -path "*/__tests__/*" \
  -not -path "*/node_modules/*" \
  | sort > .claude/audit-v19/server_other.txt
```

Read each. Cite findings by `file:line`. No skipping.

### 3.4 Frontend components — read every file end-to-end

```bash
find components src/pages src/views -type f \( -name "*.tsx" -o -name "*.ts" \) \
  -not -path "*/__tests__/*" \
  -not -path "*/node_modules/*" \
  2>/dev/null | sort > .claude/audit-v19/components_all.txt
wc -l .claude/audit-v19/components_all.txt   # = K (v18 baseline: 156)
```

Per component, classify with explicit `file:line` evidence:
- `FULLY_WIRED` — cite the `useEffect` + `api.*` call lines
- `FULLY_WIRED_WITH_FALLBACK` — cite the `serverReachable` check line AND every `DEFAULT_/DEMO_/INITIAL_/SAMPLE_` constant line AND every `useEffect → setState` line that overrides them
- `DEV_FALLBACK` — cite the dev/prod branch
- `PARTIALLY_WIRED` — list every static constant that is NOT replaced by a `useEffect` (`STATIC_REMAINING` block)
- `STATIC_ONLY` — confirm by reading the file end-to-end that zero API calls exist
- `INTENTIONAL_STATIC` — cite the CLAUDE.md entry that authorizes this

**Gate:** `K` rows in the per-component table. The v18 claim that 14 PARTIALLY_WIRED components were re-classified after reading 5 is forbidden. v19 must show 14 of 14 with line cites.

### 3.5 Infrastructure files — read every file end-to-end

Read every Dockerfile, docker-compose*.yml, .github/workflows/*.yml, logstash conf, nginx conf, prometheus.yml, grafana json, falco rules. One row per file in the ledger.

### 3.6 Prisma schema → Supabase RLS mapping

**Correction from v19.0 (false positive):** the original v19 prompt told the agent to look for RLS policies inside `server/prisma/migrations/`. That is the **wrong source of truth in this repo.** Prisma manages app schema; **Supabase manages RLS**, and the RLS source of truth lives in `supabase_schema.sql` at the project root (63 `ENABLE ROW LEVEL SECURITY` / `CREATE POLICY` statements as of v18). The v19 audit deferred this section claiming "no RLS migrations found" — that was a misread, not a real gap.

**v19.1 procedure:**

1. Read `server/prisma/schema.prisma` in full. Enumerate every `model X { ... }` block.
2. Read `supabase_schema.sql` in full. Build a map of:
   - Tables with `ALTER TABLE <name> ENABLE ROW LEVEL SECURITY;` (cite the line)
   - Policies with `CREATE POLICY <name> ON <table> FOR <op> ...` (cite the line)
3. Convert Prisma model names to their Supabase table names (Prisma camelCase → snake_case, e.g., `riskItem` → `risk_items`). Use the `@@map("<table>")` directive when present.
4. Build `.claude/audit-v19/prisma_rls_ledger.csv` with one row per Prisma model:

   ```
   prisma_model | supabase_table | rls_enabled_line (supabase_schema.sql:NNN) | policy_count | policy_lines | verdict
   ```

   Verdicts:
   - `RLS_OK` — `ENABLE ROW LEVEL SECURITY` present AND ≥1 policy applies. Cite both lines.
   - `RLS_ENABLED_NO_POLICY` — RLS on but no policy → effectively locks the table to service-role only. Note as informational unless the model is meant for end-user access.
   - `NO_RLS` — neither statement present → HIGH finding if the model holds user-scoped data.
   - `NO_SUPABASE_TABLE` — Prisma model has no corresponding Supabase table (e.g., the table lives only in Postgres via Prisma migrations). Cite the model name; verify it's not user-scoped.
   - `LEGACY_SNAKE_CASE_TABLE` — Supabase table exists with snake_case name but no Prisma model maps to it. v18 noted "all empty, unreferenced in code, RLS-enabled."

**Also** read every Prisma migration file under `server/prisma/migrations/` for completeness — but classify migration files for the **schema** ledger, NOT the RLS ledger. Any RLS-related migration there is a one-off; the canonical RLS lives in `supabase_schema.sql`.

**Gate:** the prisma_rls_ledger row count must equal `grep -c "^model " server/prisma/schema.prisma`. Verdict `NO_RLS` on any user-scoped model = HIGH finding that blocks the report from claiming "RLS hardened."

---

## SECTION 4 — L7 Multi-Tenant Verification (Per-Operation, 100%)

**v18 verified 82 of 755 ops (10.9%) and trusted HINTs for the rest. v19 forbids this.**

### 4.1 Build the per-operation ledger

```bash
# Pull every write op from the scan output (not from HINT pre-classifier)
grep -nE 'prisma\.\w+\.(create|update|delete|upsert|createMany|updateMany|deleteMany)' \
  $(cat .claude/audit-v19/services_all.txt) \
  > .claude/audit-v19/L7_all_ops.txt

wc -l .claude/audit-v19/L7_all_ops.txt   # = L  (v18 baseline: 755)

# Initialize per-op ledger
echo "op_number,file,line,model,operation,verdict,evidence_function_name,evidence_org_check_line,notes" \
  > .claude/audit-v19/L7_ledger.csv
```

### 4.2 Classify EVERY write op (no HINT trust)

For each numbered op (`L7 #1` … `L7 #L`):
1. Open the file at the cited line.
2. Read the enclosing function in full (from the `function`/`const`/`async` declaration through the closing brace).
3. Determine the verdict by direct evidence:
   - `ORG_IN_WHERE_OR_DATA` — cite the exact line where `organizationId:` appears inside the Prisma call's `where` or `data` object.
   - `ORG_IN_PRIOR_findFirst` — cite the prior `findFirst({ where: { id, organizationId }})` line that gates the write.
   - `PARENT_ORG_VERIFIED` — for child-entity writes, cite the line that loads the parent and verifies its `organizationId`.
   - `SYSTEM_LEVEL_NO_ORG_REQUIRED` — cite the comment or function name (`audit log`, `webhook delivery`, `2FA enrollment`) and explain why no org is required.
   - `NON_PRISMA_FALSE_POSITIVE` — cite the type of object (`Map.delete`, `crypto.update`, `Cache.delete`).
   - `GAP_HIGH` — confirm no org check exists anywhere in the function body. This is a HIGH finding. Do NOT downgrade.
4. Write one row to `.claude/audit-v19/L7_ledger.csv`.

**Gate:** row count of `.claude/audit-v19/L7_ledger.csv` = L. Any unclassified op = `INCOMPLETE — N of L classified` and the report must name every missing op.

**Banned classifications in v19:** "HINT confirmed", "scan extraction sufficient", "trust idiom", "ORG_SCOPED (HINT)". Each verdict must derive from a line you read this pass.

---

## SECTION 5 — F7 SSRF / Outbound HTTP Verification (Per-Call-Site, 100%)

**v18 trusted HINTs for 23 DYNAMIC_URL_NO_VALIDATION calls "with pinned base URLs". v19 verifies each.**

### 5.1 Build the per-call ledger

```bash
grep -nE '(axios\.(get|post|put|delete|patch|request)|fetch\(|got\(|http\.(get|request)|https\.(get|request))' \
  $(cat .claude/audit-v19/services_all.txt) .claude/audit-v19/server_other.txt \
  > .claude/audit-v19/F7_all_calls.txt

wc -l .claude/audit-v19/F7_all_calls.txt   # = F  (v18 baseline: 97)

echo "call_number,file,line,call_type,url_source,has_isUrlSafe_before_call,has_url_param_override,verdict,notes" \
  > .claude/audit-v19/F7_ledger.csv
```

### 5.2 Classify EVERY call

For each call site:
1. Read the function in full.
2. Determine the URL source by direct inspection:
   - `HARDCODED_LITERAL` — cite the literal URL line
   - `ENV_VAR` — cite the `process.env.X` reference
   - `CONFIG_OBJECT` — cite the config import + the field read
   - `FUNCTION_PARAM` — cite the parameter declaration; check whether the function exposes a URL override
   - `DYNAMIC_COMPUTED` — cite the construction site (string concat / template literal)
3. Cite whether `isUrlSafe()` / `isWebhookUrlSafe()` runs BEFORE the call. The line cite must appear in the verdict row.
4. Verdicts:
   - `SAFE_CONSTANT_NO_OVERRIDE` — pinned URL, function has no URL parameter
   - `SAFE_ENV_NO_OVERRIDE` — env URL, function has no URL parameter
   - `SAFE_VALIDATED` — `isUrlSafe()` runs first; cite the line
   - `GAP_MEDIUM_PARAM_URL_NO_VALIDATION` — URL is reachable from a function parameter without `isUrlSafe`
   - `GAP_MEDIUM_DYNAMIC_NO_VALIDATION` — URL is computed from user-influenced input without `isUrlSafe`

**Gate:** rows = F. Any HINT-only verdict is rejected.

---

## SECTION 6 — Component Wiring Verification (Per-Component, 100%)

**v18 grepped `serverReachable` across 5 of 14 PARTIALLY_WIRED components and extrapolated. v19 must run grep+read for every component flagged at any point in any prior audit.**

### 6.1 Per-component grep+read protocol

For every component listed as `PARTIALLY_WIRED` in v18 (14 named) AND every component in `.claude/audit-v19/components_all.txt` (K total):
1. Run: `grep -nE 'serverReachable|api\.|useEffect|useQuery|DEFAULT_|DEMO_|INITIAL_|SAMPLE_' <file>`
2. Read the file in full.
3. List in the ledger row:
   - `serverReachable_lines` — comma-separated line numbers where the flag is referenced
   - `api_call_lines` — every `api.*(...)` call site line
   - `static_constants_declared` — every `DEFAULT_/DEMO_/...` constant + line
   - `static_constants_overridden_by_useEffect` — for each, cite the `setX(apiResult)` line that overrides it
   - `static_constants_still_persistent` — any constant NOT overridden by an effect (= GAP)
4. Final verdict per component, with citations as above.

**Banned shortcut:** "all 14 follow the same pattern" — every one of the 14 (and every other component) needs its own row.

---

## SECTION 7 — Cross-Audit Reconciliation (Per-Finding, 100%)

Read every previous report in full. Build the UNION of findings. For each prior finding produce one row:

```
finding_id | source_report | finding_text | v19_status | v19_evidence_file:line | reviewer_note
```

`v19_status ∈ {FIXED_VERIFIED, STILL_OPEN, DISPUTED, SUPERSEDED}` — each non-FIXED must list the evidence-of-issue line.

Specifically reconcile these v18 carry-forwards by direct re-verification, citing the line you read this pass:
- HIGH #1: `vrCollaborativeReviewService.ts:1678` parent-org chain — read the function, cite the `findFirst` line.
- HIGH #2: `server/src/routes/sso.ts:52-87` SAML signature — read xml-crypto integration, cite `checkSignature` line and the ACS call site at sso.ts:197.
- MEDIUM #3: `isUrlSafe()` wrapping `github`/`jira`/`slack` `makeRequest` — cite each line.
- The "247 → 54 inline `res.status()`" claim — enumerate every one of the remaining 54 with `file:line`.
- The "70/70 rate-limited mounts" claim — list every `app.use('/api/...')` mount line and the rate-limiter it uses.
- The "0 ESLint errors" claim — re-run `npm --prefix server run lint` and `npm run lint`; capture output.
- The "5 new compliance services wired" claim — for each, cite the route mount line in `server/src/index.ts` (or equivalent) AND a representative controller line.

---

## SECTION 8 — Build & Tooling Verification (Run, Don't Recall)

Each of these MUST be re-run during this audit (not recalled from v18). Paste the actual output line counts into the report.

```bash
mkdir -p .claude/audit-v19/logs

# Build / type
( cd server && NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit 2>&1 | tee .claude/audit-v19/logs/tsc_server.log )
( npx tsc --noEmit 2>&1 | tee .claude/audit-v19/logs/tsc_frontend.log )

# Lint
( cd server && npm run lint 2>&1 | tee .claude/audit-v19/logs/lint_server.log )
( npm run lint 2>&1 | tee .claude/audit-v19/logs/lint_frontend.log )

# Audit
( cd server && npm audit --json > .claude/audit-v19/logs/npm_server.json 2>&1 || true )
( npm audit --json > .claude/audit-v19/logs/npm_frontend.json 2>&1 || true )

# Boot
( cd server && timeout 30 npm run start 2>&1 | tee .claude/audit-v19/logs/server_boot.log || true )

# Tests
( cd server && npm test 2>&1 | tee .claude/audit-v19/logs/server_tests.log )
```

Reconcile each output count against the v18 claim. Disagreement = report it.

---

## SECTION 9 — Required Report Structure (Lockstep With Ledgers)

The final report MUST contain these sections in this order. Sections marked **(table)** must be a literal table — no summaries-in-place-of-tables.

| § | Section | Required content | Length cap |
|---|---|---|---|
| 0 | Delta vs v18 + cross-audit reconciliation | UNION table of all findings from v16–v18 + Claude Desktop + Cursor + Gap Analysis. Per-finding `v19_status` + `file:line`. | None |
| 1 | Build & Tooling | Re-run outputs, not recalled. Cite log paths. | None |
| 2 | Completion Gate Self-Audit (mandatory) | Verbatim counts: files in ledger vs files classified; L7 ops total vs classified; F7 calls total vs classified; components total vs classified. If any inequality → declare INCOMPLETE. | ½ page |
| 3 | Per-File Ledger Summary **(table)** | `.claude/audit-v19/ledger.csv` rendered. One row per production file. | None |
| 4 | L7 Per-Operation Ledger **(table)** | `.claude/audit-v19/L7_ledger.csv` rendered. One row per write op. | None |
| 5 | F7 Per-Call Ledger **(table)** | `.claude/audit-v19/F7_ledger.csv` rendered. One row per HTTP call. | None |
| 6 | Component Per-Wiring Ledger **(table)** | One row per component with line cites for all 6 sub-fields in §6.1. | None |
| 7 | Controllers Per-`res.status()` Ledger **(table)** | One row per remaining inline status — file, line, intent, contract-test cite if intentional. | None |
| 8 | Rate-Limit Mount Ledger **(table)** | One row per `app.use('/api/...')` — mount path, line, limiter symbol, limiter line. | None |
| 9 | Prisma Model × Supabase RLS Ledger **(table)** | `.claude/audit-v19/prisma_rls_ledger.csv` rendered. One row per Prisma model — supabase table name, `supabase_schema.sql:NNN` ENABLE-RLS line, policy count, policy lines, verdict (`RLS_OK` / `RLS_ENABLED_NO_POLICY` / `NO_RLS` / `NO_SUPABASE_TABLE` / `LEGACY_SNAKE_CASE_TABLE`). **Do NOT search `server/prisma/migrations/` alone — RLS source of truth is `supabase_schema.sql` at project root.** | None |
| 10 | Infrastructure File Ledger **(table)** | One row per Dockerfile/compose/workflow/conf file — verdict + cited line for any fail-open default. | None |
| 11 | Findings — HIGH / MEDIUM / LOW **(table)** | Every finding with `file:line`, severity, fix. NO unbounded summaries. | None |
| 12 | Scoring (strict v11 formula) | Show the math. State which domain scores are gated by INCOMPLETE classifications. | None |
| 13 | Honest Incompleteness Declaration | List every UNCLASSIFIED / DEFERRED row by exact ID. | None |

Any section that lacks line-cite evidence per claim = `INCOMPLETE`. A 100% score is permitted ONLY when every ledger reaches 100% classified with citations.

---

## SECTION 10 — Self-Audit Checklist (Run Before Submitting)

Before writing the final report, the agent MUST grep its own draft for forbidden words:

```bash
egrep -i -n 'sampled|spot[- ]check|representative|extrapolat|trust the hint|hint[- ]confirmed|assumed safe|pattern suggests|likely safe|presumed|by extension|top [0-9]+|the rest|the remainder' <draft_path>
```

If any match → revise until clean.

Then verify each ledger:

```bash
# Files
wc -l .claude/audit-v19/ledger_files.txt   # expected N
awk -F, 'NR>1' .claude/audit-v19/ledger.csv | wc -l   # must equal N

# L7
wc -l .claude/audit-v19/L7_all_ops.txt   # expected L
awk -F, 'NR>1' .claude/audit-v19/L7_ledger.csv | wc -l   # must equal L

# F7
wc -l .claude/audit-v19/F7_all_calls.txt   # expected F
awk -F, 'NR>1' .claude/audit-v19/F7_ledger.csv | wc -l   # must equal F

# Components
wc -l .claude/audit-v19/components_all.txt   # expected K
# count component rows in the report's §6 table — must equal K
```

If any inequality → report cannot claim a numeric overall score above the floor implied by `(classified / total)`.

---

## SECTION 11 — Output Filenames & Preservation

- Save the new report as `PRODUCTION_READINESS_REPORT.md` (overwrite the v18 file).
- Move the previous v18 file to `PRODUCTION_READINESS_REPORT.v18-backup.md` BEFORE overwriting.
- Promote the working ledgers from `.claude/audit-v19/` to `.archive/audit-history/v19/` so they're preserved alongside the report (the `.claude/audit-v19/` dir is git-ignored and may be wiped between sessions):
  ```bash
  mkdir -p .archive/audit-history/v19
  cp -R .claude/audit-v19/* .archive/audit-history/v19/
  ```
  Result: `.archive/audit-history/v19/{ledger.csv, L7_ledger.csv, F7_ledger.csv, component_ledger.csv, logs/}`.
- These ledgers ARE the audit trail. Without them, the report is unverifiable.

---

## SECTION 12 — Hand-Off to the Agent

> Run the workflow defined above end-to-end. Do not summarize, do not skip, do not extrapolate. If you run out of context budget, stop and emit an `INCOMPLETE — N of M classified` report — that is acceptable. What is NOT acceptable is a report whose claims exceed the evidence in `.claude/audit-v19/*_ledger.csv`.
>
> The deliverable is a per-file, per-operation, per-call-site, per-component classification with `file:line` citations drawn from reads performed during this pass. Any other shape of report is a methodology failure.

*— Audit Prompt v19 (Exhaustive), authored 2026-05-23 to replace the v14-era prompt that produced v18.*
