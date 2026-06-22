# Self-Improvement System

A set of scheduled GitHub Actions that keep ComplyEasyAI current — security fixes,
compliance-framework amendments, and feature gaps — under a strict
**auto-merge-safe / propose-the-rest** safety model. Nothing risky ships without a
human in the loop.

## Safety model (read first)

| Change type | What happens | Auto-merge? |
|---|---|---|
| Non-breaking dependency / CVE fix | `npm audit fix` (no `--force`) → PR → full CI | **Yes**, only after every required check passes |
| Breaking dependency / no clean fix | Tracking **issue** with the advisory list | No — human upgrades |
| Framework / regulation amendment detected | Review **issue** + machine report artifact | No — human confirms |
| New controls / features / seed updates | **Draft PR** from the compliance agent | No — review & finish the draft |

The hard line: **no AI-generated code and no breaking change is ever auto-merged or
auto-deployed.** Auto-merge is reserved for non-breaking security/version fixes that
pass the *entire* existing CI pipeline (build, lint, typecheck, unit, E2E, security
scan). GitHub's native auto-merge enforces "all required checks green" — the workflow
only *requests* the merge.

## The loops

### 1. CVE self-healing — `.github/workflows/self-heal-cve.yml` (daily)
Audits root + `server/` + `mobile/`, applies only non-breaking fixes, and opens an
auto-merge PR (label `automerge`). Breaking advisories open/update a single
deduplicated tracking issue. Engine: `scripts/self-improvement/audit-report.mjs`.

### 2. Framework amendment monitor — `.github/workflows/framework-monitor.yml` (weekly)
Hash-diffs the authoritative sources in `scripts/self-improvement/sources.json`
(EU AI Act, GDPR, NIST AI RMF/CSF, HIPAA, PCI DSS, ISO 27001, SOC 2). A changed
page opens a `needs-review` issue and hands the report to the compliance agent.
Baselines live in `scripts/self-improvement/state/` and are committed each run so
detection is stateful. Engine: `scripts/self-improvement/monitor-sources.mjs`
(deterministic — no LLM, no false confidence).

### 3 & 4. Compliance agent — `.github/workflows/compliance-agent.yml` (weekly + on detection)
Feature-gap proposer **and** compliance-content updater. Uses the Anthropic API to
read the monitor report + open compliance issues, inspect how the repo defines
frameworks/controls, and open **one focused DRAFT PR** proposing the seed/control
update or a scaffolded component. Constrained to compliance definitions/seeds (+ at
most one new UI component); it will not touch CI, secrets, infra, auth, or dependency
manifests. **No-ops if `ANTHROPIC_API_KEY` is unset.**

### Optional: Renovate — `renovate.json`
A richer, battle-tested alternative for the dependency loop (grouping, dashboards,
lockfile maintenance). Activates only when the Renovate app or a self-hosted Renovate
Action is enabled; same auto-merge-safe contract. If you adopt Renovate, you can
disable the daily `self-heal-cve` workflow (or keep it as a cross-check).

## One-time setup

1. **Enable auto-merge** on the repo: *Settings → General → Pull Requests → Allow
   auto-merge*. Without this the CVE PRs stay open for manual merge (a warning is
   logged, nothing breaks).
2. **Branch protection / required checks** on the default branch: require the CI jobs
   (build, lint, test, E2E, Security Scan) so auto-merge can only complete on green.
3. **`ANTHROPIC_API_KEY` secret** (*Settings → Secrets and variables → Actions*) to
   enable loops 3 & 4. Optional — loops 1 & 2 run without it.
4. **Allow Actions to open PRs**: *Settings → Actions → General → Workflow permissions*
   → enable "Allow GitHub Actions to create and approve pull requests".
5. (Optional) Install the **Renovate** app if you prefer it over loop 1.

## Tuning

- **Add/remove watched sources:** edit `scripts/self-improvement/sources.json`. Delete
  the matching `state/<id>.sha` to reset a baseline. Some government sites (e.g. HHS)
  block bots with `403`; those are reported, not fatal — swap for an RSS/official feed
  if you want reliable signal.
- **Schedules:** edit the `cron:` lines in each workflow.
- **Agent scope:** tighten/loosen the constraints in the `prompt:` of
  `compliance-agent.yml`. It is deliberately conservative.

## Why this shape

A fully autonomous "fix and deploy everything" agent is a supply-chain and reliability
risk: it can silently ship a regression or a poisoned transitive dependency. This
design gets the benefit (continuous detection + drafted fixes) while keeping the
irreversible step — merging to a deployable branch — gated on green CI and, for
anything non-trivial, a human review.
