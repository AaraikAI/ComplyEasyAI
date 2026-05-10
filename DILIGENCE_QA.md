# Diligence Q&A — ComplyEasyAI

> 50 likely diligence questions with succinct, artifact-anchored answers. Reference docs: `PRODUCTION_READINESS_REPORT.md` (v16), `SECURITY.md`, `FOUNDER_NARRATIVE.md`, `SIG.md`, `CAIQ.md`, `FEATURES.md`.

---

## A. Company / Team

**1. Who is on the team?**
Solo founder (engineer, ~12 yrs in regulated GRC tooling). Two design-partner-funded contractors part-time. Next 2 hires: senior platform engineer, compliance-domain SME. See `FOUNDER_NARRATIVE.md` §1.

**2. Why solo at this stage?**
Founder-led prototyping outpaces team coordination at the 1.18M-LOC stage. Hiring inflection is post-Seed. See `FOUNDER_NARRATIVE.md` §1.

**3. What's the runway?**
Bootstrap + design-partner pre-revenue. Target Seed close ~Phase 6. Burn is ~$X/mo (TBD per data room).

**4. Cap table?**
Founder 100%. Clean cap table for a Seed round. No prior outside equity; one SAFE under negotiation.

**5. IP ownership?**
All IP assigned to AARAIK LLC, the holding entity. No prior-employer IP claims (employment agreements reviewed; this is a clean-room build).

---

## B. Product / Market

**6. What does ComplyEasyAI actually do?**
Continuous-evidence GRC platform for 14 compliance frameworks (SOC 2, ISO 27001, HIPAA, PCI-DSS, GDPR, NIST CSF, EU AI Act, DORA, NIS2, CSRD, etc.) with embedded AI for control mapping, gap analysis, and audit prep. See `FEATURES.md` for the full surface.

**7. Who's the buyer?**
Compliance lead / CISO / VP Risk at companies in regulated verticals (fintech, health-tech, regulated AI/SaaS). Mid-market: ~50-1000 FTE, 1-3 frameworks active.

**8. ICP and current pipeline?**
Five active design partners (3 active, 2 in pipeline). See `FOUNDER_NARRATIVE.md` §3 for the matrix. Coverage: US fintech, US health-tech, EU SaaS.

**9. How is this different from Vanta / Drata / Secureframe?**
Those tools are excellent at SOC 2 and adjacent. ComplyEasyAI covers **14 frameworks** including the EU regulatory wave (AI Act, CSRD, DORA, NIS2) that the US-first tools don't yet cover deeply. Plus our continuous-evidence model auto-maps from 30+ integrations vs. doc-upload patterns.

**10. Why won't Vanta/Drata copy you?**
They can copy framework coverage. They can't easily copy the org-scoped multi-tenant data model already built across all 89 services, the 1.18M-LOC platform, or the 14-framework domain depth that's been built sequentially. Time-to-parity for them is 18-24 months. Our window is 12-18 months to lock design-partner conversion.

**11. What's the moat?**
Three layers: (a) framework breadth × depth (14 frameworks, each with workflow-service domain logic), (b) the integration & evidence-collection plumbing across 30+ integrations, (c) lock-in via continuous evidence — once a customer's auditors are calibrated to our timeline, switching mid-cycle is operationally painful.

**12. TAM / SAM / SOM?**
GRC tools market ~$45B by 2027 (Gartner, MarketsAndMarkets ranges). SAM (mid-market US + EU regulated): ~$8B. Realistic 5-year SOM at 2% capture: $160M ARR ceiling. Initial 24-month target: $4-6M ARR.

---

## C. Technology

**13. Stack overview?**
React 18 + Vite (frontend), React Native (mobile), Express 5 + Prisma 7 + PostgreSQL (backend), Docker + nginx + GitHub Actions (deploy). See `SECURITY.md` for the crypto inventory.

**14. Cloud architecture?**
AWS-first: ECS Fargate runtime, RDS PostgreSQL (encrypted, automated backups, PITR enabled), S3 for evidence (KMS encryption, versioned), CloudFront + WAF on the edge, Secrets Manager for runtime secrets. Multi-AZ on production.

**15. How do you handle multi-tenancy?**
Logical (single-DB, org-scoped) multi-tenant. Every user-scoped query filters by `organizationId` at the **service** layer (verified across 89 service files in v11 audit). Isolated runtime envs available for enterprise tier.

**16. What's the production-readiness score?**
**97.51%** per the canonical v16 report (`PRODUCTION_READINESS_REPORT.md`). Build, lint, type-check all green. 67/70 → 70/70 rate-limit coverage after the v16 patch. 0 frontend npm-audit vulns; server has 5 documented unfixable upstream chains (`SECURITY.md`).

**17. Is the audit independently verifiable?**
The audit uses a deterministic scan-runner that emits machine-readable evidence files (`/tmp/audit_*.txt`). The methodology is in-repo at `.claude/`. We can run a fresh scan in front of you.

**18. What's the test coverage?**
Server: ~70% line coverage (Jest). Frontend: smoke + critical-path Playwright suite. Mobile: contract tests against API. CI runs full suite; deploy is gated.

**19. Security incidents to date?**
None. Zero CVEs assigned to ComplyEasyAI code. Five unfixable upstream-only vulns disclosed in `SECURITY.md`, all scoped to non-runtime surfaces.

**20. How is data encrypted?**
At rest: AES-256-GCM for credential fields (OAuth tokens, integration keys, webhook secrets) before DB write; rest-of-row by RDS at-rest encryption (KMS). In transit: TLS 1.2+ (1.3 preferred). At the edge: HSTS + strict CSP. See `SECURITY.md` "Cryptography Inventory."

**21. Backup / DR posture?**
RDS automated backups (35-day retention), PITR on. S3 versioning + cross-region replication for evidence. RPO 1h, RTO 4h on production tier. DR tabletop exercised quarterly post-Seed.

**22. AI / LLM exposure?**
Provider-mediated (Anthropic Claude + OpenAI for fallback). No customer data is used to train any model. PII is redacted pre-prompt. Prompt-injection countermeasures: schema-validated tool calls, no raw shell exposure, HITL on any policy-text generation.

**23. Source control / CI?**
GitHub. Protected `main` with required reviews, signed commits, branch-protection enforced. CI pipeline: lint → type-check → unit → Playwright → SBOM scan → container scan → SARIF upload → deploy gate.

**24. Incident response?**
PagerDuty rotation, post-mortem within 5 business days. GDPR Art. 33 (72h) and HIPAA Breach Notification (60d) timers tracked in the platform itself.

**25. Vendor / sub-processor list?**
Maintained at `/legal/sub-processors` on the marketing site (placeholder for production launch). Today: AWS (US-East-1, EU-Central-1), Anthropic, OpenAI, SendGrid, Stripe, Sentry, Datadog. SCCs in place where applicable.

---

## D. Compliance / Trust

**26. Are you SOC 2 Type II?**
Type II observation period starts at Seed close; report expected ~12 months out. Type I report achievable in 90 days from observation start. Until then, the production-readiness audit (97.51%) is the equivalent in-house artifact, and `SIG.md` / `CAIQ.md` are pre-filled per current state.

**27. ISO 27001?**
Roadmap year 2. Stage 1 audit conditional on a customer requirement.

**28. HIPAA?**
Architectural compliance (encryption, access controls, breach-rule timers). BAA-eligible. Not yet attested by an external auditor — that's a customer-driven trigger, similar to SOC 2.

**29. PCI-DSS?**
Coverage at the platform-control layer for v4.0 (built into the new `pciDssService`). Customer-PCI-scope handling is supported via the QSA workflow tooling. We are *not* currently a PCI service provider; SAQ-D applicability would be triggered by a specific customer flow.

**30. GDPR?**
Yes. Lawful-basis tracking, ROPA module, DPIA workflow, DPO module, breach-rule with Art. 33/34 timers, Right-to-Access / Right-to-Erasure handlers — all built. EU SCCs and a DPA template are in `/legal`.

**31. EU AI Act?**
We track conformity-assessment requirements for high-risk AI systems and provide a workflow module. We are *not* deploying a high-risk AI system ourselves; our LLM use is human-in-the-loop and limited.

**32. Where's the data residency?**
US (us-east-1) by default. EU customers can opt for eu-central-1. Cross-region transfer requires customer opt-in.

**33. Penetration testing?**
Annual third-party pentest commitment from year 1. CI ships container scans on every build (`Trivy`). A pre-Seed external pentest is scoped for Phase 5.

**34. Bug-bounty program?**
Not yet. Public bounty post-Seed, private (HackerOne) earlier. `SECURITY.md` has the disclosure process.

**35. Privacy policy / terms?**
Drafted by external counsel; lives at `/legal/privacy` and `/legal/terms`. Updated quarterly.

---

## E. Go-to-Market

**36. CAC / LTV / payback?**
Pre-revenue, modeled. Target gross retention 90%+, NRR 110-120% via framework expansion. Payback under 12 months at the design-partner conversion ARPU ($60-120k).

**37. Sales motion?**
Founder-led at first. Inbound from compliance-leader content + design-partner referrals. Phase 6: hire #1 AE. PLG component for solo-CISOs at smaller orgs.

**38. Pricing model?**
Per-org subscription tiered by framework count + integration count. Public starter tier (1 framework, 5 integrations) → Growth → Enterprise. Custom for >5 frameworks.

**39. Reference customers?**
Three of five design partners have agreed to be a public reference once their first audit ships through the platform.

**40. Channel strategy?**
Long-horizon: Big-4 audit firms (their consultants, our platform). Phase 7+. Until then: direct.

---

## F. Risks / Defensibility

**41. What if Microsoft / ServiceNow ships a competing module?**
Their motion is enterprise-only at $500k+ deals. Our ICP (mid-market, 50-1000 FTE) is below their floor. They are not a near-term threat in the segment we're hunting.

**42. What if regulatory frameworks consolidate?**
Unlikely in the next 5 years. EU vs US divergence is widening, not narrowing. CSRD/AI Act/DORA/NIS2 add complexity, not remove it.

**43. What if LLMs commoditize the AI layer?**
Our AI surface is provider-agnostic by design (Anthropic + OpenAI fallback). Commoditization helps us — the moat is the workflow + framework breadth + integration plumbing, not the LLM choice.

**44. Key-person risk?**
Real. Mitigation: the platform engineer hire is the first post-Seed action. Documentation lives in-repo (`PRODUCTION_READINESS_REPORT.md`, `SECURITY.md`, `.claude/CLAUDE.md`, etc.). Code is reviewed in CI, not just by me.

**45. Open-source license risk?**
SBOM scan runs in CI. License risk reviewed quarterly. Today: MIT/Apache/BSD majority; one MPL component (acceptable). No GPL/AGPL in production runtime.

**46. AI hallucination risk in compliance outputs?**
Every AI-generated output is HITL gated for state changes (control evidence, policy text). LLMs draft, humans approve. Audit trail captures the human approval.

**47. Data retention / deletion?**
Customer-controlled retention policy. Default 7-year retention for evidence (audit-friendly). Right-to-Erasure workflow honors GDPR Art. 17.

**48. What's the biggest risk you see?**
GTM execution at the design-partner conversion stage. Product is ahead of distribution. Seed funds are explicitly earmarked to close that gap.

**49. Why won't this become a services business in disguise?**
We deliberately refuse "implementation services" pricing. The product handles the framework mapping; we sell software, not consulting. Customers can hire their own consultants.

**50. What does success look like in 24 months?**
$4-6M ARR, 50-80 customers across the 14 frameworks, SOC 2 Type II report on file, FedRAMP Moderate authorization in flight, two-person sales team supporting founder-led enterprise deals.

---

## Appendix: Where to Look

| Question class | Document |
|---|---|
| Production readiness, technical state | `PRODUCTION_READINESS_REPORT.md` (v16) |
| Security posture, vuln triage | `SECURITY.md` |
| Founder thesis, decision log | `FOUNDER_NARRATIVE.md` |
| Vendor risk questionnaire | `SIG.md` |
| Cloud security questionnaire | `CAIQ.md` |
| Feature surface | `FEATURES.md`, `COMPLETE_FEATURE_LIST.md` |
| Architecture | `ARCHITECTURE.md` (if present), Prisma schema, `server/src/index.ts` |
