# CAIQ (Consensus Assessments Initiative Questionnaire) — Pre-Filled

**Vendor:** ComplyEasyAI (AARAIK LLC)
**CAIQ Version:** v4.0.3 (Cloud Security Alliance, Cloud Controls Matrix v4 alignment)
**As of:** 2026-04-25

> Markdown pre-fill mapped to the CCM v4 control families. Paste each row into the corresponding CAIQ xlsx column. Answers are anchored on the v16 production-readiness audit and `SECURITY.md`.

Legend: **Y** = Yes, **N** = No, **NA** = Not Applicable, **CC** = Customer Configured

---

## A&A — Audit & Assurance (6 controls)

| # | Question | Y/N/NA | Notes |
|---|---|---|---|
| A&A-01.1 | Are audit and assurance policies documented? | Y | Policy library; reviewed annually |
| A&A-02.1 | Are independent assessments planned? | Y | SOC 2 Type II in flight; ISO 27001 Y2 |
| A&A-03.1 | Are findings tracked to remediation? | Y | Issue Management module |
| A&A-04.1 | Are management responses documented? | Y | Captured in Issue Management |
| A&A-05.1 | Is information system audit performed? | Y | Continuous via the platform itself |
| A&A-06.1 | Are audit reports remediated through closure? | Y | Verified in v16 audit |

## AIS — Application & Interface Security (7 controls)

| # | Question | Y/N/NA | Notes |
|---|---|---|---|
| AIS-01.1 | Is a secure SDLC documented? | Y | Code review, SAST, DAST, container scan |
| AIS-02.1 | Are application security testing tools deployed? | Y | ESLint security, Trivy, Snyk, npm audit |
| AIS-03.1 | Are interfaces (APIs) secured? | Y | OAuth 2.0 / JWT, rate limiting (70/70 mounts), input validation, OpenAPI 3.0 spec |
| AIS-04.1 | Are interface security controls tested? | Y | Playwright + integration tests + pentest |
| AIS-05.1 | Is data integrity validated? | Y | SHA-256 file hashing; Prisma type validation |
| AIS-06.1 | Is non-production data masked? | Y | Anonymization service |
| AIS-07.1 | Is application vulnerability remediation prioritized? | Y | CVSS-driven SLA: Critical 7d, High 30d, Medium 90d |

## BCR — Business Continuity & Operational Resilience (11 controls)

| # | Question | Y/N/NA | Notes |
|---|---|---|---|
| BCR-01.1 | Is there a documented BCP? | Y | DR runbook |
| BCR-02.1 | Is the BCP risk-based? | Y | Tied to BIA |
| BCR-03.1 | Are recovery objectives defined? | Y | RTO 4h, RPO 1h |
| BCR-04.1 | Are documented procedures in place for resumption? | Y | Runbooks per service |
| BCR-05.1 | Are documents reviewed at least annually? | Y |  |
| BCR-06.1 | Is BCP exercised? | Y — quarterly tabletop, annual restore | DR test reports |
| BCR-07.1 | Are equipment safeguards in place? | Y | AWS managed |
| BCR-08.1 | Is impact monitored? | Y | Datadog + CloudWatch |
| BCR-09.1 | Are backups encrypted? | Y — KMS encryption | RDS automated; S3 versioning |
| BCR-10.1 | Are DR drills documented? | Y | Quarterly |
| BCR-11.1 | Is operational resilience reviewed? | Y | Quarterly architecture review |

## CCC — Change Control & Configuration Management (9 controls)

| # | Question | Y/N/NA | Notes |
|---|---|---|---|
| CCC-01.1 | Are change-management policies documented? | Y | Policy library |
| CCC-02.1 | Is unauthorized change prevented? | Y | Branch protection + signed commits + CI gate |
| CCC-03.1 | Are changes tested pre-prod? | Y | CI runs full test suite |
| CCC-04.1 | Are changes documented? | Y | PR template + commit messages |
| CCC-05.1 | Is rollback supported? | Y | Blue/green deploy + DB migration reversibility |
| CCC-06.1 | Are exceptions tracked? | Y | Exceptions module |
| CCC-07.1 | Is configuration baselined? | Y | Terraform IaC |
| CCC-08.1 | Are unauthorized config changes detected? | Y | AWS Config + GuardDuty |
| CCC-09.1 | Is dependency management documented? | Y | npm audit + Snyk; SBOM generated |

## CEK — Cryptography, Encryption & Key Management (21 controls)

| # | Question | Y/N/NA | Notes |
|---|---|---|---|
| CEK-01.1 | Is there a cryptographic policy? | Y | `SECURITY.md` Cryptography Inventory |
| CEK-02.1 | Are roles & responsibilities defined for crypto? | Y |  |
| CEK-03.1 | Is data classified to drive encryption requirements? | Y |  |
| CEK-04.1 | Is data-in-transit encrypted? | Y — TLS 1.2+ | nginx + ALB enforce |
| CEK-05.1 | Is data-at-rest encrypted? | Y — AES-256-GCM credentials, RDS KMS | `SECURITY.md` |
| CEK-06.1 | Are signatures verified? | Y — XML-DSig (xml-crypto) for SAML | SSO module |
| CEK-07.1 | Are crypto algorithms approved? | Y — AES-256-GCM, PBKDF2-SHA256 (600k), TLS 1.2+, JWT HS256 | NIST + FIPS friendly |
| CEK-08.1 | Are weak ciphers disabled? | Y |  |
| CEK-09.1 | Are encryption keys managed? | Y — AWS KMS | Customer-managed keys available on enterprise tier |
| CEK-10.1 | Are keys rotated? | Y — annual + on-event | Rotation runbook |
| CEK-11.1 | Are keys revoked on compromise? | Y |  |
| CEK-12.1 | Are HSMs used? | Y — AWS KMS-backed |  |
| CEK-13.1 | Is there a key generation policy? | Y |  |
| CEK-14.1 | Is key purpose constrained? | Y — separate keys per use case |  |
| CEK-15.1 | Are crypto periods defined? | Y |  |
| CEK-16.1 | Is key escrow available? | NA — by design we do NOT escrow customer keys |  |
| CEK-17.1 | Is key access audited? | Y — KMS CloudTrail |  |
| CEK-18.1 | Are keys archived securely? | Y — KMS managed |  |
| CEK-19.1 | Is key compromise tracked? | Y — incident response runbook |  |
| CEK-20.1 | Are key recoveries documented? | Y |  |
| CEK-21.1 | Is crypto reviewed for obsolescence? | Y — annually |  |

## DCS — Datacenter Security (15 controls)

| # | Question | Y/N/NA | Notes |
|---|---|---|---|
| DCS-01 through DCS-15 | Inherited from AWS | Y | AWS SOC 2 Type II + ISO 27001 + PCI-DSS reports cover physical/environmental controls |

## DSP — Data Security & Privacy Lifecycle (19 controls)

| # | Question | Y/N/NA | Notes |
|---|---|---|---|
| DSP-01.1 | Are data security policies documented? | Y |  |
| DSP-02.1 | Is data classification implemented? | Y — Public / Internal / Confidential / Restricted |  |
| DSP-03.1 | Are data flow maps maintained? | Y — ProcessMapper module + ROPA |  |
| DSP-04.1 | Is data-quality maintained? | Y |  |
| DSP-05.1 | Are PII classifications applied? | Y |  |
| DSP-06.1 | Are data privacy rights honored? | Y — GDPR Art. 15-22 workflows | Privacy module |
| DSP-07.1 | Is data retention defined? | Y — 7-year default for evidence | Retention configurable |
| DSP-08.1 | Is data deletion verified? | Y — soft + hard delete with verification |  |
| DSP-09.1 | Is sensitive data minimized? | Y — minimum-necessary access (HIPAA-aligned) |  |
| DSP-10.1 | Is data location tracked? | Y — US/EU residency disclosed |  |
| DSP-11.1 | Are cross-border transfers compliant? | Y — EU SCCs in place |  |
| DSP-12.1 | Is sensitive data redacted in logs? | Y — PII scrubbing in Winston transport |  |
| DSP-13.1 | Are sub-processors disclosed? | Y |  |
| DSP-14.1 | Is data subject access supported? | Y |  |
| DSP-15.1 | Is consent management implemented? | Y — Cookie Consent module |  |
| DSP-16.1 | Is data anonymization supported? | Y — Data Anonymization service |  |
| DSP-17.1 | Are PIAs / DPIAs performed? | Y — DPIA module |  |
| DSP-18.1 | Are breach notification procedures documented? | Y — multi-jurisdiction (GDPR, HIPAA, state laws) | BreachNotificationWizard |
| DSP-19.1 | Is data lineage maintained? | Y |  |

## GRC — Governance, Risk Management & Compliance (8 controls)

| # | Question | Y/N/NA | Notes |
|---|---|---|---|
| GRC-01.1 | Is there a documented GRC program? | Y |  |
| GRC-02.1 | Are risks assessed? | Y — quarterly | Risk module |
| GRC-03.1 | Are risks tracked? | Y |  |
| GRC-04.1 | Are policies enforced? | Y |  |
| GRC-05.1 | Is the GRC program reviewed by leadership? | Y — quarterly |  |
| GRC-06.1 | Are exceptions managed? | Y | Exceptions module |
| GRC-07.1 | Is third-party risk managed? | Y | Vendor Risk module |
| GRC-08.1 | Are compliance requirements mapped to controls? | Y — across 14 frameworks | Control Mappings module |

## HRS — Human Resources Security (12 controls)

| # | Question | Y/N/NA | Notes |
|---|---|---|---|
| HRS-01.1 | Are background checks performed? | Y | US/EU pre-employment |
| HRS-02.1 | Are security responsibilities documented? | Y |  |
| HRS-03.1 | Are NDAs signed? | Y — day 1 |  |
| HRS-04.1 | Is security awareness training provided? | Y — annual + onboarding | Security Training module |
| HRS-05.1 | Is training tracked? | Y |  |
| HRS-06.1 | Is training role-specific? | Y — engineers, ops, sales |  |
| HRS-07.1 | Are violations addressed? | Y |  |
| HRS-08.1 | Is acceptable-use enforced? | Y — AUP signed |  |
| HRS-09.1 | Is termination access removed promptly? | Y — within 4 business hours |  |
| HRS-10.1 | Are role transitions documented? | Y |  |
| HRS-11.1 | Are remote-work policies in place? | Y |  |
| HRS-12.1 | Are personnel security incidents tracked? | Y |  |

## IAM — Identity & Access Management (16 controls)

| # | Question | Y/N/NA | Notes |
|---|---|---|---|
| IAM-01.1 | Is there an IAM policy? | Y |  |
| IAM-02.1 | Is least-privilege enforced? | Y — RBAC + access reviews |  |
| IAM-03.1 | Are service accounts managed? | Y |  |
| IAM-04.1 | Are user accounts reviewed? | Y — quarterly | Access Review module |
| IAM-05.1 | Is MFA required? | Y — TOTP/WebAuthn | 2FA module |
| IAM-06.1 | Is SSO supported? | Y — SAML 2.0 with signature verification | SSO module |
| IAM-07.1 | Is SCIM supported? | Y | SCIM module |
| IAM-08.1 | Are passwords stored hashed? | Y — PBKDF2-SHA256 600k | `SECURITY.md` |
| IAM-09.1 | Is password complexity enforced? | Y — configurable |  |
| IAM-10.1 | Is password rotation supported? | Y |  |
| IAM-11.1 | Are sessions managed? | Y — JWT in httpOnly cookie + refresh rotation |  |
| IAM-12.1 | Is privileged access tracked? | Y — PAM + audit log |  |
| IAM-13.1 | Are emergency-access procedures defined? | Y — break-glass |  |
| IAM-14.1 | Is access provisioning automated? | Y — SCIM + onboarding flows |  |
| IAM-15.1 | Is access deprovisioning automated? | Y |  |
| IAM-16.1 | Is federated identity supported? | Y — SAML, OIDC roadmap |  |

## IPY — Interoperability & Portability (4 controls)

| # | Question | Y/N/NA | Notes |
|---|---|---|---|
| IPY-01.1 | Is data export supported? | Y — API + CSV/JSON export | Export module |
| IPY-02.1 | Are open standards used? | Y — OpenAPI 3.0, CycloneDX, SPDX, SCIM, SAML, OAuth 2.0 |  |
| IPY-03.1 | Is data portability documented? | Y |  |
| IPY-04.1 | Is migration assistance available? | Y — onboarding service |  |

## IVS — Infrastructure & Virtualization Security (9 controls)

| # | Question | Y/N/NA | Notes |
|---|---|---|---|
| IVS-01.1 | Is the network segmented? | Y | VPC + Security Groups |
| IVS-02.1 | Are network security controls tested? | Y — quarterly external scan |  |
| IVS-03.1 | Is VM/container hardening enforced? | Y — CIS Docker Benchmark |  |
| IVS-04.1 | Is IDS/IPS deployed? | Y — AWS GuardDuty + WAF |  |
| IVS-05.1 | Is wireless secured? | Y — corp WPA3 + cert-based |  |
| IVS-06.1 | Are VLANs used? | Y |  |
| IVS-07.1 | Is east-west traffic monitored? | Y — VPC Flow Logs |  |
| IVS-08.1 | Are container images scanned? | Y — Trivy in CI | SARIF uploaded |
| IVS-09.1 | Are infrastructure changes logged? | Y — CloudTrail |  |

## LOG — Logging & Monitoring (12 controls)

| # | Question | Y/N/NA | Notes |
|---|---|---|---|
| LOG-01.1 | Are events logged? | Y — Winston JSON to Elasticsearch |  |
| LOG-02.1 | Are logs centralized? | Y |  |
| LOG-03.1 | Are logs retained? | Y — 1 year (CloudTrail), 90 days (app logs) |  |
| LOG-04.1 | Are logs protected from tampering? | Y — append-only, signed S3 |  |
| LOG-05.1 | Are log access events audited? | Y |  |
| LOG-06.1 | Is monitoring continuous? | Y — Datadog + CloudWatch |  |
| LOG-07.1 | Are alerts triaged? | Y — PagerDuty |  |
| LOG-08.1 | Are events correlated? | Y — SIEM |  |
| LOG-09.1 | Are logs reviewed? | Y — automated alerting + weekly human review |  |
| LOG-10.1 | Are sensitive data redacted in logs? | Y |  |
| LOG-11.1 | Is time synchronization enforced? | Y — NTP |  |
| LOG-12.1 | Are encryption keys rotated and logged? | Y |  |

## SEF — Security Incident Management, E-Discovery & Cloud Forensics (8 controls)

| # | Question | Y/N/NA | Notes |
|---|---|---|---|
| SEF-01.1 | Is there an IR plan? | Y |  |
| SEF-02.1 | Are incidents categorized? | Y |  |
| SEF-03.1 | Is forensic readiness documented? | Y |  |
| SEF-04.1 | Are incidents reported? | Y — internal + customer + regulator |  |
| SEF-05.1 | Are customers notified of incidents affecting them? | Y — per DPA / contract |  |
| SEF-06.1 | Is e-discovery supported? | Y — case-by-case via legal |  |
| SEF-07.1 | Are post-incident reviews documented? | Y |  |
| SEF-08.1 | Are lessons-learned actioned? | Y |  |

## STA — Supply Chain Management, Transparency & Accountability (14 controls)

| # | Question | Y/N/NA | Notes |
|---|---|---|---|
| STA-01.1 | Is the supply chain documented? | Y — sub-processor list maintained |  |
| STA-02.1 | Are sub-processors assessed? | Y — annual + on-event | Vendor Risk module |
| STA-03.1 | Are SLAs in place with sub-processors? | Y |  |
| STA-04.1 | Is supplier security assessed? | Y |  |
| STA-05.1 | Are supplier risks tracked? | Y |  |
| STA-06.1 | Is supplier compliance verified? | Y |  |
| STA-07.1 | Are supplier audits conducted? | Y — questionnaire-based + on-site for tier-1 |  |
| STA-08.1 | Is data location disclosed? | Y |  |
| STA-09.1 | Are SLAs enforced? | Y |  |
| STA-10.1 | Are change controls aligned with suppliers? | Y |  |
| STA-11.1 | Are supplier breach notifications received? | Y — contractually required |  |
| STA-12.1 | Are supplier exits planned? | Y |  |
| STA-13.1 | Is supplier diversity tracked? | Y |  |
| STA-14.1 | Is supplier security training tracked? | NA |  |

## TVM — Threat & Vulnerability Management (10 controls)

| # | Question | Y/N/NA | Notes |
|---|---|---|---|
| TVM-01.1 | Is there a vulnerability management program? | Y |  |
| TVM-02.1 | Are vulnerabilities prioritized? | Y — CVSS-driven SLA |  |
| TVM-03.1 | Is patching timely? | Y — Critical 7d, High 30d, Medium 90d |  |
| TVM-04.1 | Are zero-days tracked? | Y |  |
| TVM-05.1 | Is threat intel ingested? | Y — commercial feed |  |
| TVM-06.1 | Are pen tests performed? | Y — annual external + internal |  |
| TVM-07.1 | Are application security scans run? | Y — daily npm audit + container scan |  |
| TVM-08.1 | Are remediations tracked? | Y |  |
| TVM-09.1 | Are SLAs enforced? | Y |  |
| TVM-10.1 | Are unfixable vulns disclosed? | Y — `SECURITY.md` Known Unfixable Upstream Vulnerabilities table |  |

## UEM — Universal Endpoint Management (14 controls)

| # | Question | Y/N/NA | Notes |
|---|---|---|---|
| UEM-01 through UEM-14 | Endpoint management | Y | MDM module enforces FDE, EDR (CrowdStrike), patching cadence, BYOD policy |

---

## Inheritance Statement

ComplyEasyAI runs on AWS. Physical/environmental controls (DCS family) and certain operational controls inherit AWS's existing certifications: SOC 1/2/3 Type II, ISO 27001, ISO 27017, ISO 27018, PCI-DSS L1, HIPAA, FedRAMP. Audit reports are available through AWS Artifact under NDA.
