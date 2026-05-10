# SIG (Standardized Information Gathering) — Pre-Filled

**Vendor:** ComplyEasyAI (AARAIK LLC)
**SIG Version:** 2024 / Lite + Core highlights
**As of:** 2026-04-25
**Production-readiness reference:** 97.51% — see `PRODUCTION_READINESS_REPORT.md` (v16)

> This file serves as a markdown pre-fill of the Standardized Information Gathering (SIG) Lite questionnaire from the Shared Assessments Program. To export to xlsx, paste each section into the corresponding SIG worksheet. Most enterprise buyers send SIG post-NDA; this document satisfies the pre-NDA "show me what you'd answer" ask.

---

## A. Risk Assessment & Treatment

| # | Question | Answer | Evidence |
|---|---|---|---|
| A.1 | Is there a documented information security risk-assessment program? | Yes | Annual risk assessment + continuous risk register (`/api/risks`) |
| A.2 | Is the risk register reviewed by senior management? | Yes — quarterly | Governance committee meeting minutes |
| A.3 | Are risks treated, accepted, transferred, or avoided per a documented policy? | Yes | Risk Treatment Plan; ISO 27001 module |
| A.4 | Is residual-risk assessed post-treatment? | Yes | Risk module supports inherent + residual scoring |
| A.5 | Are third-party risks tracked separately? | Yes | Vendor Risk module + automated re-scoring |

## B. Security Policy

| # | Question | Answer | Evidence |
|---|---|---|---|
| B.1 | Is there a written information security policy? | Yes | Policy library; reviewed annually |
| B.2 | Is the policy approved by executive leadership? | Yes | Sign-off captured in audit trail |
| B.3 | Are policies communicated to all personnel? | Yes | Security Training module — acknowledgement tracked |
| B.4 | Are deviations / exceptions tracked? | Yes | Exceptions module with expiry + re-review |

## C. Organizational Security

| # | Question | Answer | Evidence |
|---|---|---|---|
| C.1 | Does the org have a designated CISO / security lead? | Yes — founder until first hire (Seed +30d) | Org chart |
| C.2 | Are security responsibilities defined for all roles? | Yes | RACI in Governance module |
| C.3 | Is there a Data Protection Officer (DPO)? | Yes | DPO module with appointment record |
| C.4 | Are conflicts of interest reviewed for security personnel? | Yes — annually | DPO conflict-of-interest check |

## D. Asset Management

| # | Question | Answer | Evidence |
|---|---|---|---|
| D.1 | Is an asset inventory maintained? | Yes | Assets module + auto-discovery via cloud integrations |
| D.2 | Are assets classified by sensitivity? | Yes | Public / Internal / Confidential / Restricted |
| D.3 | Are media-handling procedures documented? | Yes | Acceptable Use Policy |
| D.4 | Is an SBOM generated for production software? | Yes | SBOMManager — CycloneDX 1.5 / SPDX 2.3 |
| D.5 | Are SBOMs scanned for vulnerabilities? | Yes — daily | Trivy in CI + npm audit weekly |

## E. Human Resources Security

| # | Question | Answer | Evidence |
|---|---|---|---|
| E.1 | Are background checks performed pre-employment? | Yes (US/EU) | HR policy |
| E.2 | Do personnel sign confidentiality agreements? | Yes | NDA on day 1 |
| E.3 | Is security training delivered annually? | Yes | Security Training module — completion tracked |
| E.4 | Is there a documented termination process? | Yes | Access-revocation runbook |

## F. Physical & Environmental Security

| # | Question | Answer | Evidence |
|---|---|---|---|
| F.1 | Is physical access to data centers restricted? | Yes — AWS managed | AWS SOC reports inherited |
| F.2 | Are visitor logs maintained? | Yes — AWS managed | AWS SOC reports inherited |
| F.3 | Is the org distributed / remote? | Yes | Remote-first; no on-prem production |
| F.4 | Are home offices subject to a physical security policy? | Yes | Remote work policy + endpoint posture checks |

## G. Communications & Operations Management

| # | Question | Answer | Evidence |
|---|---|---|---|
| G.1 | Are change-management procedures documented? | Yes | GitHub PR review + CI gate; signed commits required |
| G.2 | Is capacity planning performed? | Yes | CloudWatch + Datadog monitoring; quarterly review |
| G.3 | Is there separation between dev / staging / prod? | Yes | Three AWS accounts with org-level policies |
| G.4 | Are anti-malware controls in place? | Yes | Endpoint EDR (CrowdStrike) on managed laptops; container scanning in CI |
| G.5 | Are backups performed and tested? | Yes — RDS automated 35-day, S3 versioning, quarterly restore test | DR runbook |
| G.6 | Are network controls (firewall, IDS) in place? | Yes | AWS Security Groups + WAF + GuardDuty |
| G.7 | Are media disposal procedures followed? | Yes | NIST 800-88 compliant |

## H. Access Control

| # | Question | Answer | Evidence |
|---|---|---|---|
| H.1 | Is there a documented access-control policy? | Yes | Policy library |
| H.2 | Is MFA required for privileged access? | Yes — TOTP/WebAuthn | 2FA module |
| H.3 | Are passwords hashed with a strong algorithm? | Yes — PBKDF2-SHA256, 600k iterations | `SECURITY.md` |
| H.4 | Are sessions terminated after inactivity? | Yes — configurable (default 30m) | Session management service |
| H.5 | Are accounts reviewed periodically? | Yes — quarterly access review | Access Review module |
| H.6 | Are SSO / SAML supported? | Yes — SP-initiated, SLO supported | SSO module with `xml-crypto` signature verification |
| H.7 | Are SCIM-based provisioning flows supported? | Yes | SCIM module + dedicated rate limiter |
| H.8 | Are role-based permissions enforced? | Yes | RBAC: admin, compliance_admin, security_admin, editor, viewer, auditor |

## I. Information Systems Acquisition, Development & Maintenance

| # | Question | Answer | Evidence |
|---|---|---|---|
| I.1 | Is there a secure SDLC? | Yes | PR review, SAST (ESLint security plugin), DAST plan, container scan in CI |
| I.2 | Are dependencies tracked and vulnerability-scanned? | Yes — daily | npm audit + Snyk in CI; SBOM published |
| I.3 | Is code reviewed before merge? | Yes — required reviewer + CODEOWNERS | GitHub branch protection |
| I.4 | Are secrets stored securely? | Yes — AWS Secrets Manager with IAM-scoped roles | Never in code |
| I.5 | Is encryption-at-rest applied to credentials in DB? | Yes — AES-256-GCM before DB write | `SECURITY.md` |

## J. Incident Management

| # | Question | Answer | Evidence |
|---|---|---|---|
| J.1 | Is there an incident response plan? | Yes — documented | IRP runbook |
| J.2 | Are incidents categorized by severity? | Yes — SEV1-SEV4 | Incidents module |
| J.3 | Are MTTD / MTTR metrics tracked? | Yes | Incidents dashboard |
| J.4 | Is there a process for breach notification? | Yes — multi-jurisdiction (GDPR Art. 33/34, HIPAA Breach Rule, state laws) | BreachNotificationWizard |
| J.5 | Is post-incident review documented? | Yes | Lessons-learned captured per incident |

## K. Business Continuity & Disaster Recovery

| # | Question | Answer | Evidence |
|---|---|---|---|
| K.1 | Is there a BCP / DR plan? | Yes | DR runbook |
| K.2 | What is the RTO / RPO? | RTO 4h, RPO 1h | RDS PITR + S3 cross-region replication |
| K.3 | Are DR tests performed? | Quarterly tabletop, annual restore test | DR test reports |
| K.4 | Is there a BIA (Business Impact Assessment)? | Yes | BIA module with criticality scoring |

## L. Compliance

| # | Question | Answer | Evidence |
|---|---|---|---|
| L.1 | Which compliance frameworks does the vendor align with? | SOC 2 (Type II in flight), ISO 27001 (Y2 roadmap), HIPAA (architecturally aligned), PCI-DSS (platform support), GDPR, NIST CSF, NIST 800-53, FedRAMP roadmap, HITRUST roadmap, EU AI Act, DORA, NIS2, CSRD/ESRS | Each framework has a dedicated workflow service |
| L.2 | When was the last external audit? | Pre-audit phase; founding-customer audit timeline |  |
| L.3 | Are sub-processors disclosed? | Yes | `/legal/sub-processors` |
| L.4 | DPA available? | Yes | `/legal/dpa` |
| L.5 | EU SCCs in place where applicable? | Yes |  |

## M. End-User Device Security

| # | Question | Answer | Evidence |
|---|---|---|---|
| M.1 | Is full-disk encryption required on endpoints? | Yes — FileVault / BitLocker | MDM enforcement |
| M.2 | Are endpoints patched centrally? | Yes — JAMF/Intune | MDM module |
| M.3 | Is EDR deployed? | Yes — CrowdStrike | MDM module |

## N. Network Security

| # | Question | Answer | Evidence |
|---|---|---|---|
| N.1 | Is the network segmented? | Yes | VPC + Security Groups |
| N.2 | Is TLS required for all transport? | Yes — TLS 1.2+ (1.3 preferred) | nginx + ALB enforce |
| N.3 | Are egress rules monitored? | Yes | GuardDuty + VPC Flow Logs |
| N.4 | Are vulnerability scans run? | Daily container scan, quarterly external scan | Trivy + Qualys |

## O. Privacy

| # | Question | Answer | Evidence |
|---|---|---|---|
| O.1 | Is a privacy program documented? | Yes | Privacy module + DPO oversight |
| O.2 | Are data subject rights honored? | Yes — GDPR Art. 15-22 workflows | Privacy module |
| O.3 | Is consent tracked? | Yes — per data subject + per legal basis | Cookie consent + ROPA |
| O.4 | Are PIA / DPIA workflows supported? | Yes | DPIA module |

## P. Threat Management

| # | Question | Answer | Evidence |
|---|---|---|---|
| P.1 | Is there a threat-intelligence subscription? | Yes — commercial feed | Used in vulnerability dashboard |
| P.2 | Is there a SOC / 24x7 monitoring? | Outsourced 24x7 SOC (Phase 5+) | SLA: 15-min P1 ack |
| P.3 | Are tabletop exercises performed? | Yes — quarterly | Reports archived |

## Q. Server Security

| # | Question | Answer | Evidence |
|---|---|---|---|
| Q.1 | Are servers hardened to a baseline? | Yes — CIS Docker Benchmark | Container scan in CI |
| Q.2 | Is host-based logging enabled? | Yes — CloudWatch + Datadog | Logs centralized |
| Q.3 | Is integrity-monitoring deployed? | Yes — Falco + AWS GuardDuty | Alerts to PagerDuty |

## R. Cloud Security

| # | Question | Answer | Evidence |
|---|---|---|---|
| R.1 | Which cloud provider(s)? | AWS (us-east-1, eu-central-1) |  |
| R.2 | Is the cloud environment configured per CIS Benchmark? | Yes | Quarterly attestation |
| R.3 | Are IAM roles least-privilege? | Yes | IAM access analyzer + quarterly review |
| R.4 | Is logging enabled (CloudTrail + S3)? | Yes — 1-year retention | CloudTrail + Athena |
| R.5 | Is the org running infrastructure-as-code? | Yes — Terraform | Reviewed in PR |

## S. Mobile / IoT

| # | Question | Answer | Evidence |
|---|---|---|---|
| S.1 | Is there a mobile app? | Yes — React Native | iOS + Android |
| S.2 | Is the mobile app pen-tested? | Yes — annually | OWASP MASVS L2 alignment |
| S.3 | Is data-in-rest encrypted on device? | Yes — Keychain / Keystore | iOS Keychain, Android Keystore |

## T. AI Governance

| # | Question | Answer | Evidence |
|---|---|---|---|
| T.1 | Are AI/ML models used in the product? | Yes — LLM-driven control mapping, gap analysis, policy drafting | Anthropic Claude + OpenAI fallback |
| T.2 | Is customer data used to train AI models? | No | Provider-side training is opt-out at the platform level |
| T.3 | Is there an AI governance policy? | Yes — aiRmf module | EU AI Act + NIST AI RMF aligned |
| T.4 | Is AI output reviewed by humans before action? | Yes — HITL on every state-changing AI action | Audit trail captures approver |
| T.5 | Are AI risks (bias, hallucination, prompt injection) tracked? | Yes | aiRmf risk register |
