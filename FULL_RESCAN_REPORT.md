# Full-Codebase Verification Re-Scan — ComplyEasyAI

**Generated:** 2026-06-03 · **Method:** 127-agent swarm, **1,268 / 1,268 files read end-to-end**
(the full corrected list `filelist_v2_full.txt` — all source **plus** the 88 previously-missed
schema/SQL/Docker/CI/infra files). Each agent re-read its batch against the **current post-remediation
code** and reported only issues **present now**. Machine-readable: `.claude/deep-scan/results/full_rescan_findings.json`.

> This is the verification pass requested after the v21 scope gap. It supersedes neither the 429 remediated
> findings nor `SUPPLEMENTARY_SCAN_REPORT.md` — it **adds** a clean-room re-read of the entire codebase.
> **None of the 61 findings below are in the original 429.** Several are genuinely new bugs (e.g. the Stripe
> webhook break) or were introduced during remediation; a few corroborate the gap-scan items (nginx headers,
> deploy `:latest`, Falco rule, CSV injection).

## Result

| Severity | Count |
|---|---:|
| HIGH | 5 |
| MEDIUM | 12 |
| LOW | 22 |
| INFO | 22 |
| **Total** | **61** |

Swarm note: the first pass completed 81/127 batches (810 files) before 46 agents errored under the burst;
a resume re-ran only the failed batches (cached the rest) to reach **127/127 (1,268 files)**. ~13.5M agent
tokens total across both runs.

---

## HIGH (5) — deployment blockers

### H1 — Stripe webhook is completely broken (every event dropped)
`server/src/controllers/billingController.ts:140` — reads `(req as any).rawBody`, but the route mounts
`express.raw()` (`index.ts:372`) which puts the buffer in **`req.body`**; `req.rawBody` is never set
anywhere. So `stripe.webhooks.constructEvent(undefined, …)` throws → 401 on **every** event.
`checkout.session.completed`, `customer.subscription.updated|deleted`, `invoice.payment_succeeded|failed`
are all rejected → **tier upgrades and payment-state syncs silently never apply.** The sibling ticketing
receiver does it correctly (`Buffer.isBuffer(req.body)`, ticketing.ts:1399).
*Fix:* read the buffer from `req.body`.

### H2 — `createPersonnel` drops tenant scope
`server/src/routes/personnel.ts:24` — calls `createPersonnel({ ...req.body, userId: req.user.id })` but
never passes `organizationId` (the Joi schema is `.unknown(false)` so it can't arrive via body). The service
writes `organizationId: data.organizationId` (undefined) → untenanted row / runtime NOT-NULL failure. Every
other route in the file passes `req.user.organizationId`. *Fix:* pass it explicitly.

### H3 — `acosService.calculateDebtFromGapAnalysis` cross-tenant read
`server/src/services/advanced/acosService.ts:773` — `complianceFramework.findUnique({ where:{ id:frameworkId }})`
with no org filter, reachable via `POST /compliance-debts/calculate-from-gap` with attacker-controlled
`frameworkId`. Leaks another org's control names/statuses (returned + persisted as debt descriptions).
*Fix:* `findFirst({ where:{ id:frameworkId, organizationId }})` + 404.

### H4 — ServiceNow pull-sync silently broken (invalid FK)
`server/src/services/integrations/servicenowService.ts:931` — `issue.create({ … createdById:'system' })`,
but `Issue.createdById` is a required FK to `User`; `'system'` is not a user id → FK violation, swallowed by
the per-record catch. **No ServiceNow incident is ever pulled into the app.** The Jira/Azure path was fixed
with `resolveSyncCreatorId()`; ServiceNow was missed. *Fix:* mirror `resolveSyncCreatorId(organizationId)`.

### H5 — Integration provider singleton → cross-tenant credential bleed
`server/src/services/integrations/providers/integrationRegistry.ts:101` — one shared
`BaseIntegrationProvider` instance per provider id. `testConnection/syncProvider/collectEvidence` do
`provider.configure(creds)` (mutating `this.credentials` + `httpClient.defaults.headers`) then `await`. Two
concurrent requests for the same provider (e.g. two orgs syncing `datadog`) interleave at the await → org A's
outbound call can carry **org B's decrypted credentials**, or B's evidence is attributed to A. App-layer is
the only tenant boundary, so this is HIGH. *Fix:* instantiate a fresh provider (+ httpClient) per call;
never mutate a shared singleton with per-request secrets.

---

## MEDIUM (12) — summary

| # | Location | Issue |
|---|---|---|
| M1 | `COMPREHENSIVE_SUPABASE_UPDATES.sql:85` | `CREATE TYPE IF NOT EXISTS` is invalid PostgreSQL → whole migration script aborts (3 enums). |
| M2 | `components/PrivacyManagementPlatform.tsx:716` | Create-DSAR modal inputs uncontrolled; submits hardcoded `{type:'Access'}`, ignores all input; catch swallows errors. |
| M3 | `components/SoDAnalysisDashboard.tsx:546` | Create-SoD-Rule modal inputs uncontrolled; persists empty/default values. |
| M4 | `components/ESGReportingModule.tsx:555` | ESG highlight cards + YoY charts are hardcoded constants despite metrics being API-driven (fabricated-as-live). |
| M5 | `nginx/default.conf:131` | Server-level security headers (CSP/HSTS/X-Frame-Options) **dropped on the SPA `index.html` + `/assets/`** due to nginx `add_header` non-inheritance. |
| M6 | `server/src/controllers/demoController.ts:134` | Demo-request admin endpoints expose **all tenants'** lead PII to any org admin (no platform-superadmin gate). |
| M7 | `server/src/routes/ticketing.ts:1392` | Inbound ticketing webhook can never authenticate — `webhookSecret` is read but **never persisted** by any config path → bidirectional sync dead. |
| M8 | `server/src/services/workflowEngine.ts:563` | `call_webhook` SSRF guard validates only the initial URL; axios follows redirects with no re-validation (metadata/internal SSRF). |
| M9 | `server/src/services/sodService.ts:1057` | Compensating-control methods write a JSON object into a `String` column (`mitigationAction`) — Prisma rejects at runtime; feature dead (masked by `as any`). |
| M10 | `server/src/services/advanced/agenticAIService.ts:1358` | Precondition permission check evaluates a **random org user's** role, not the acting user's → privilege gate bypassable. |
| M11 | `server/src/services/advanced/physicalAIService.ts:3195` | `monitorNetwork()` returns `Math.random()` latency/packetLoss as real metrics + drives anomaly flags. |
| M12 | `mobile/src/services/api.ts:444` | Mobile notifications hit `/api/v2/notifications` which is mounted only at top-level → 404; the bell badge silently never populates. |

---

## LOW (22) & INFO (22) — themes (full list in the JSON)

- **CSV formula-injection in 4 more export paths** that bypass the shared `neutralizeCsvFormula`/`escapeCsvCell`:
  `auditController.ts:195`, `controlMappingsController.ts:397`, `routes/ropa.ts:67`, `RoPAManagement.tsx:403`.
- **Read-path multi-tenant defense-in-depth gaps** (not exploitable today, but no org filter):
  `agenticAIService` blast-radius/precondition reads, `physicalAIService.getHistoricalSensorData`,
  `monitoringService.getMonitorResults`.
- **Fabricated-as-live UI** in otherwise-wired components: `ESGReportingModule` (workflows tab),
  `AccountDeletionWorkflow` (certificates/evidence), `EnvironmentalLifecycle` (benchmark deltas / compliance
  mapping), `EUCRADashboard` (CRA checklist), `WorkflowBuilder` (run-detail uses builder canvas).
- **Logging hygiene** (`console.warn` vs shared logger) across ~6 components + `i18n/index.ts`.
- **Empty/optimistic catch blocks** swallowing failures (`MDMDashboard` remote wipe, `AIReportGenerator`).
- **Misleading privacy claim:** `ComplianceChat.tsx:883` shows "Processed locally • No external data
  transmission" while sending prompts+file content to backend/Gemini.
- **Corroborates the gap scan:** `infrastructure/lib/cache-stack.ts:83` Redis AUTH token rendered into the
  CFN template via `unsafeUnwrap()`; `deploy.sh:114` pushes `:latest`; Falco PII rule operator-precedence
  bug; the supabase_schema.sql RLS-non-functional note; `jest.config.js` 100% coverage gate; swagger tier
  enum drift; `add_org_to_dashboard_widget…sql` non-idempotent FK + nullable `organizationId`.
- **CSRF-on-fetch consistency:** `RoleManager.tsx` mutating calls use a local fetch without `X-CSRF-Token`
  (relies on server policy; INFO pending route-config verification).

---

## Consolidated production-readiness verdict (all scans combined)

| Layer | Posture |
|---|---|
| Application code — security primitives & the 429 remediated findings | **Strong** (verified: tsc/audit/boot/load green, suites pass). |
| Application code — newly-found bugs | **5 HIGH + 12 MED present now** (Stripe billing dead, 3 multi-tenant/credential-bleed, 2 broken integrations). |
| DB-layer tenant isolation (RLS) | **Not in force** (gap scan A1/A2) — makes the multi-tenant read-path gaps above more serious (no DB backstop). |
| Static-analysis (CodeQL) | **24 critical / 199 high open**, incl. unfixed SSRF (gap scan B1/B2). |
| ZK proof integrity | **Broken at setup** (gap scan C1/C2). |
| CI/CD + deploy + containers | **Partially hardened, real gaps** (gap scan D/E/F). |

**Bottom line (unchanged, reinforced): NOT production-ready as a whole.** The application tier is well-built
and the original 429 were genuinely fixed, but the full re-scan + gap scan together surface **10 HIGH** live
issues (5 here + 5 in `SUPPLEMENTARY_SCAN_REPORT.md`) that are real deployment blockers. Suggested fix order:
**H1 (Stripe billing) → H5 (credential bleed) → H2/H3/H4 (multi-tenant/integrations) → DB RLS → SSRF/CodeQL
→ ZK → deploy/CI/containers.**
