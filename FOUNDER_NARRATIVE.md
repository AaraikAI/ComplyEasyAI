# ComplyEasyAI — Founder Narrative

> Use this document for: Phase 5 one-pager, investor speaker notes, design-partner pitches, and diligence preludes. Pair with `PRODUCTION_READINESS_REPORT.md` (v16), `SECURITY.md`, and `DILIGENCE_QA.md`.

---

## 1 · The Founder

**Solo founder.** I'm an enterprise-software engineer who has spent the last ~12 years building risk, audit, and compliance products for regulated industries — most recently at the intersection of cloud security, GRC tooling, and regulated AI. I started ComplyEasyAI because I watched the same pattern repeat at every customer:

- Compliance teams ran a six-figure consulting engagement to map controls.
- Engineering teams ran a separate seven-figure tooling stack (audit-management + SIEM + DLP + secrets + SBOM + GRC + ticketing).
- The two never converged. The audit got produced by hand. The next year, both sides started over.

I'm a builder, not a panelist. I don't sell a methodology — I ship the platform that makes the methodology unnecessary.

**Why solo, why now.** I'm running solo because the product is at the stage where founder-led prototyping moves faster than coordination across a team. The codebase already covers ~14 frameworks, 40+ feature modules, and 1.18M LOC. As we move into design-partner expansion (Phase 5 onward), the next two hires are deliberate: a senior platform engineer and a compliance-domain SME.

---

## 2 · Why Now (the thesis)

Three forces converge in 2025-2026 to make this market urgently underserved:

### 2.1 Regulatory acceleration is non-linear
EU AI Act enters substantive compliance phases in 2026; CSRD reports become mandatory for non-EU groups in 2026; HIPAA, the FedRAMP-style state laws (Texas, Florida, NY DFS), and SEC cyber-disclosure rules all expanded scope in 2024-2025. **Every framework now expects continuous, not point-in-time, evidence.** Manual audit prep can't keep up.

### 2.2 LLMs broke the build-vs-buy economics
Pre-LLM, control-mapping required a human to read the framework, read the policy, and reconcile both. That's now a paragraph-length prompt with retrieval, plus a human in the loop. ComplyEasyAI internalizes this loop: we map customer evidence to framework requirements with an LLM-driven engine that never replaces the human auditor — but cuts ~70% of the rote work.

### 2.3 The GRC tooling stack is fragmented and expensive
Vanta, Drata, Secureframe, OneTrust, ServiceNow GRC — each is a great point tool. None of them does end-to-end. A mid-market customer pays $100k-$300k/year across 4-6 tools and still hand-stitches the report. **ComplyEasyAI is the consolidation play.**

---

## 3 · Design Partners (current state)

| Partner | Sector | Stage | What they're testing |
|---|---|---|---|
| Confidential — fintech (Series B) | US fintech, ~150 FTE | Active | SOC 2 Type II + PCI-DSS continuous evidence |
| Confidential — health-tech (Seed extension) | US digital therapeutics | Active | HIPAA + HITRUST workflow |
| Confidential — EU SaaS (Series A) | EU B2B SaaS | LOI signed | GDPR + EU AI Act + DORA |
| 2 additional pipeline | TBD | First call done | NIST CSF + ISO 27001 |

Design partners are non-paying for the first 6 months in exchange for: weekly product feedback, framework-specific case studies, and an explicit reference commitment. Three of the five have agreed to be a public reference once they ship a successful audit through the platform.

---

## 4 · Why ComplyEasyAI Wins (Differentiation)

| Dimension | Status quo | ComplyEasyAI |
|---|---|---|
| Coverage | 1-2 frameworks per tool | **14 frameworks** in one platform: SOC 2, ISO 27001, HIPAA, PCI-DSS, GDPR, CCPA, NIST CSF, NIST 800-53, FedRAMP, HITRUST, EU AI Act, DORA, NIS2, CSRD/ESRS |
| Evidence model | Doc upload + manual mapping | Continuous evidence ingestion from 30+ integrations (AWS, Azure, GCP, Okta, GitHub, Snyk, Datadog, Jira, etc.) auto-mapped to controls |
| Audit prep | Final-quarter scramble | Audit prep workspace runs continuously; the "package" is the same artifacts auditors pull from production |
| AI surface | Bolt-on chat | Embedded throughout: control mapping, gap analysis, policy drafting, vendor questionnaires, regulatory change detection |
| Multi-tenancy | Per-tenant deployment | Strong org-scoped multi-tenant isolation enforced at the application/service layer across all 89 service files; database-layer RLS (FORCE + non-BYPASSRLS role) is staged for deployment as added defense-in-depth |
| Mobile | None / web wrapper | Real React Native app for evidence capture + approval flows |
| Trust posture | Marketing claim | Production-readiness score tracked in the live `PRODUCTION_READINESS_REPORT.md`, with the audit transcript public-on-request |

---

## 5 · Technical Decision Log (selected)

This section is for technically-literate diligence. It explains *why* the codebase looks the way it does.

### 5.1 Express 5 + Prisma 7
- **Decision:** Adopt Express 5 (released Sep 2024) and Prisma 7 (Oct 2025) early.
- **Why:** Express 5 fixes the async error-handler ergonomics that made route code in the v4 era cluttered with try/catch. Prisma 7 brings real-world performance for the JSON column patterns we use heavily (impactAssessment, evidenceRefs, etc.).
- **Cost:** A patch-level postinstall script (`server/scripts/patch-express-types.js`) for `@types/express-serve-static-core` to match Express 5 runtime — load-bearing, intentional, and documented.
- **Result:** Zero TS errors against `tsc --noEmit` (confirmed Apr 2026).

### 5.2 JWT in httpOnly cookies, not localStorage
- **Decision:** Tokens are issued as `Secure; HttpOnly; SameSite=Strict` cookies, with a separate refresh-token rotation flow.
- **Why:** The most common XSS exfiltration path is `localStorage.getItem('token')`. We removed it as an attack surface in production, with a CSRF token issued via `/api/csrf-token` (and now rate-limited per the v9 T24 sweep).

### 5.3 PBKDF2-SHA256 600k iterations
- **Decision:** OWASP 2023+ guidance for PBKDF2-SHA256 is ≥600,000 iterations; we use that. Argon2id remains on the roadmap as an option.
- **Why:** PBKDF2 has FIPS validation paths that Argon2id doesn't (yet) have in our deployment regions. Better to ship FIPS-friendly today and offer Argon2id as configurable later.

### 5.4 SAML signature verification with `xml-crypto`
- **Decision:** All SAML ACS-handled assertions are verified against a configured IdP cert via `xml-crypto`, not regex-parsed.
- **Why:** A previous audit found a regex-only SAML path. Regex-parsed XML is a CVE waiting to happen. We removed the entire regex path.

### 5.5 SSRF: `isUrlSafe` + `re2` ReDoS wrapper at every outbound call site
- **Decision:** Every `axios.get` / `fetch` to a URL that *can* be user-controlled passes through `isUrlSafe` (private IP block + DNS-rebind defense) and `safeRegexTest` (re2-backed) before execution.
- **Why:** F7 audit (97 outbound call sites) found that file-level safety wasn't enough — function parameters can override safe defaults. Per-call-site verification is the only honest answer.

### 5.6 Multi-tenant: org filter at the **service** layer
- **Decision:** Org scoping is enforced at the service-layer Prisma query, not at the route handler or middleware.
- **Why:** Middleware can be bypassed, and route handlers can be refactored. The Prisma query is the only place where the data actually leaves the database. v9-v11 audits walked all 682 write operations to verify.

### 5.7 14 frameworks via dedicated workflow services
- **Decision:** Each framework gets its own `*Service.ts` (HIPAA, ISO 27001, SOC 2, PCI-DSS, NIST CSF, etc.) rather than a generic "controls" engine.
- **Why:** Frameworks are not interchangeable. The HIPAA Breach Rule's 4-factor analysis, PCI-DSS's compensating-control worksheet, SOC 2's TSC sampling guidance — each has irreducible domain logic that a generic engine flattens away. The dedicated-service pattern keeps the domain code legible and the audit defensible.

### 5.8 RealTimeComplianceService: pub/sub for auditor-visible events
- **Decision:** Every meaningful state change (control test, evidence approval, breach finding, ROC finalization) publishes a compliance event consumed by the WebSocket layer + email notifier + Sentry trail.
- **Why:** Auditors want a tamper-evident timeline. The publish path is the audit trail.

### 5.9 Ship-list: what's still upstream-blocked
- `effect <3.20.0` — pinned by `@prisma/config`. Awaiting Prisma upstream.
- `lodash 4.x`, `elliptic *`, `aws-sdk v2`, `serialize-javascript ≤7.0.2` — see `SECURITY.md` for the full triage.

---

## 6 · The 24-Month Picture

- **Phase 5 (now → +3 mo):** Convert design partners → first paid logos. Public Trust Center page. Two reference customers. SOC 2 Type II audit *of ComplyEasyAI itself* (we eat the dog food).
- **Phase 6 (+3 → +9 mo):** Sales hire #1, platform engineer #2, CISO/Compliance lead. Series Seed close. Vertical packaging: Healthcare bundle, Fintech bundle, EU bundle.
- **Phase 7 (+9 → +24 mo):** Channel partnerships with the Big-4 audit firms (their consultants, our platform). FedRAMP Moderate authorization in flight. ARR target: $4-6M.

---

## 7 · One-line Pitch

> The compliance team has 14 frameworks to satisfy and a $1M tooling bill. ComplyEasyAI replaces both with one continuously-evidenced platform — built solo, audit-defensible at 97.51%, ready for design-partner conversion now.
