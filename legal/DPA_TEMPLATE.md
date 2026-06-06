# Data Processing Agreement (DPA)

**Template version:** 1.0
**Last updated:** 2026-05-10
**Governing law:** California / Delaware (US customers); Ireland (EU/UK customers)

> This is a template. Final terms are agreed by signature between the Customer and AARAIK LLC. Defined terms (in **bold**) follow GDPR Art. 4 and CCPA §1798.140 unless context indicates otherwise.

---

## 1. Parties

This Data Processing Agreement (this "**DPA**") is entered into between:

- **AARAIK LLC** ("**Processor**", "ComplyEasyAI", "we", "us"), a Delaware limited liability company, and
- **Customer** ("**Controller**"), the entity identified in the underlying Master Services Agreement, Order Form, or Subscription Agreement (the "**Principal Agreement**").

This DPA forms part of, and is governed by, the Principal Agreement. If the Principal Agreement and this DPA conflict on any data-protection matter, this DPA controls.

## 2. Scope and applicability

This DPA applies whenever Processor processes **Personal Data** on behalf of Controller in connection with the ComplyEasyAI platform. It is intended to satisfy:

- **GDPR** Art. 28 (and Art. 26 where joint controllership applies)
- **UK GDPR** + DPA 2018
- **CCPA** / CPRA (Service Provider terms)
- Other comparable laws applicable to Controller's data subjects

The categories of data, processing purposes, retention periods, and data-subject types are described in **Annex A** (Description of Processing).

## 3. Roles

- Controller is the **Controller** of Personal Data submitted to the platform.
- Processor is a **Processor** acting only on Controller's documented instructions.
- For end-user data submitted by Controller's customers (the "**Indirect Data Subjects**"), Controller and Processor agree that Controller is the Controller and Processor is the Processor.

Processor will not act as a "business" or "third party" under CCPA with respect to Controller's data and will not Sell or Share Personal Data.

## 4. Processor obligations

Processor will:

1. **Process only on instruction.** Process Personal Data only on documented instructions from Controller, including with respect to international transfers. The Principal Agreement, this DPA, and Controller's configuration of the platform constitute Controller's documented instructions.
2. **Confidentiality.** Ensure that personnel authorized to process Personal Data have committed to confidentiality (contractual or statutory).
3. **Security.** Implement appropriate technical and organizational measures (TOMs) per **Annex B**.
4. **Sub-processors.** Engage Sub-processors only in compliance with Section 5.
5. **Assist with rights requests.** Provide reasonable assistance to Controller in responding to data-subject requests (access, rectification, erasure, restriction, portability, objection) per Articles 15-22 GDPR.
6. **Assist with DPIAs.** Assist Controller with Data Protection Impact Assessments (Art. 35 GDPR) and prior consultations with supervisory authorities (Art. 36 GDPR).
7. **Breach notification.** Notify Controller without undue delay, and in any event within **72 hours** of becoming aware of a Personal Data Breach, providing the information required by Art. 33(3) GDPR.
8. **Return or delete.** Upon termination, return or securely delete all Personal Data per Section 10, subject to legal retention obligations.
9. **Make available information.** Make available all information necessary to demonstrate compliance with Article 28 GDPR.
10. **Audit cooperation.** Permit and contribute to audits per Section 9.

## 5. Sub-processors

Controller provides general authorization for Processor to engage Sub-processors. Processor maintains a current list at https://aaraik.ai/legal/subprocessors and provides at least **30 days' notice** of any addition or replacement via that page or email.

If Controller reasonably objects within the 30-day window on data-protection grounds, the parties will discuss resolution in good faith; if not resolved, Controller may terminate the affected portion of the platform pro rata.

Processor will impose data-protection obligations on Sub-processors substantially equivalent to those in this DPA and remains liable for Sub-processors' acts and omissions.

**Current Sub-processors (illustrative — see live page for authoritative list):**

| Sub-processor | Service | Region |
|---|---|---|
| Amazon Web Services | Cloud infrastructure (compute, storage, KMS) | US-East-1, EU-Central-1 |
| Supabase | Managed PostgreSQL | US, EU |
| SendGrid (Twilio) | Transactional email | US |
| Stripe | Payment processing | US |
| Anthropic | AI inference (Claude) | US |
| OpenAI | AI inference fallback | US |
| Sentry | Error tracking | US |
| Datadog | Observability | US, EU |

## 6. International transfers

Where transfer of Personal Data outside the EEA / UK / Switzerland is required, the parties will rely on a valid transfer mechanism, in order of preference:

1. **Adequacy decision** (EU Commission, UK ICO).
2. **EU Standard Contractual Clauses** (Commission Implementing Decision (EU) 2021/914) and, where applicable, the **UK Addendum**. The SCCs are incorporated by reference into this DPA with Module 2 (Controller-to-Processor) applying.
3. **Supplementary measures** as required by Schrems II — Processor implements at minimum: encryption-in-transit (TLS 1.2+), encryption-at-rest (AES-256-GCM), pseudonymization where feasible, and a transparency report covering government access requests.

US transfers may additionally rely on the **EU-US Data Privacy Framework** where Processor is self-certified.

## 7. Categories of data and processing

See **Annex A**. Controller acknowledges that the platform is designed for processing of business operational and compliance-evidence data, NOT special-category data (Art. 9 GDPR). If Controller's use will involve special-category data (e.g., health data, biometric data), Controller must inform Processor in writing before such processing begins, and the parties will agree any additional safeguards required.

## 8. Data-subject rights

Where Processor receives a request directly from a data subject, Processor will (a) not respond except to acknowledge or to confirm Controller is the Controller, and (b) forward the request to Controller without undue delay. Processor will provide tooling within the platform that allows Controller to fulfill access, deletion, rectification, and portability requests without Processor's manual assistance.

## 9. Audits

Once per year, Controller (or a reputable independent auditor mutually agreed in writing, bound by confidentiality) may audit Processor's compliance with this DPA upon at least **30 days' prior written notice**, during business hours, in a manner that does not unreasonably interfere with Processor's operations.

Processor's most recent **SOC 2 Type II** report (when issued), **ISO 27001 certificate** (when issued), and platform Production Readiness Report will be made available under NDA and will satisfy the audit obligation absent specific reasonable cause for an on-site audit. Costs of audits are borne by Controller unless the audit reveals material non-compliance, in which case Processor bears reasonable costs.

## 10. Term, return, and deletion

This DPA enters into force on the effective date of the Principal Agreement and remains in force for the duration thereof.

On termination or expiry, at Controller's option:

- **Return:** Processor will export all Personal Data via the platform's export functionality or a mutually agreed format within **30 days** of Controller's request.
- **Delete:** Processor will permanently delete all Personal Data within **90 days** of termination, except for (i) backups, which are deleted on the natural backup-retention cycle (35 days for RDS automated backups; up to 12 months for cold-storage archives), and (ii) data Processor is legally required to retain.

Processor will provide a written certification of deletion upon completion.

## 11. Liability

Each party's liability under this DPA is subject to the liability caps in the Principal Agreement, except that liability for breach of confidentiality, gross negligence, or willful misconduct is not capped.

For damages awarded to a data subject under Art. 82 GDPR, the parties will allocate liability according to their respective responsibility for the harm caused.

## 12. Governing law and venue

This DPA is governed by the law and venue selected in the Principal Agreement, except that where mandatory provisions of EU/UK/Swiss data-protection law require otherwise, those mandatory provisions control on the data-protection issues to which they apply.

## 13. Order of precedence

In case of conflict between this DPA and the SCCs, the SCCs prevail. In case of conflict between this DPA and the Principal Agreement on data-protection matters, this DPA prevails. In case of conflict between this DPA and any Annex, this DPA prevails (except Annex A, which is binding on its own terms).

---

## Annex A — Description of Processing

| Item | Detail |
|------|--------|
| **Categories of data subjects** | Controller's employees, contractors, customers, vendors, and (where applicable) Controller's customers' end-users. |
| **Categories of Personal Data** | Identification data (name, email, employee ID), contact data, role/title, business-context data (department, team), authentication metadata (login timestamps, IPs, 2FA usage), audit-trail data (who-did-what), evidence content uploaded by Controller (may contain any Personal Data Controller chooses to upload), integration metadata from connected systems (AWS, GitHub, Okta, etc.). |
| **Special categories of data** | None expected. If Controller's use will involve special-category data, see Section 7. |
| **Processing purposes** | Hosting, displaying, indexing, and tracking compliance evidence and workflows; sending platform notifications; providing customer support; producing audit reports for Controller. |
| **Duration of processing** | Duration of the Principal Agreement, plus the deletion / return window per Section 10. |
| **Frequency of processing** | Continuous, on a 24/7 SaaS basis. |
| **Retention periods** | Active platform data: lifetime of the Principal Agreement. Audit-trail data: 7 years post-event by default (configurable). Backups: 35 days (RDS PITR) + cold-storage rotation per backup policy. |
| **Nature of processing** | Storage, retrieval, indexing, transformation (e.g., hashing for integrity), transmission, deletion. |

---

## Annex B — Technical and Organizational Measures (TOMs)

These TOMs are summary-level. Detailed implementation evidence is available in the platform's `SECURITY.md`, `SIG.md`, `CAIQ.md`, and the current Production Readiness Report (97.51% as of v16, 2026-04-02).

### B.1 Access control

- **Authentication:** JWT in httpOnly cookies (Secure, SameSite=Strict), refresh-token rotation. PBKDF2-SHA256 with 600,000 iterations for password storage. Optional TOTP/WebAuthn 2FA. SAML 2.0 SSO with signature verification via `xml-crypto`.
- **Authorization:** Role-based access control (RBAC) with at minimum: admin, compliance_admin, security_admin, editor, viewer, auditor.
- **Provisioning / deprovisioning:** SCIM 2.0. Termination access-revocation SLA: 4 business hours.
- **Privileged access:** Production access via short-lived AWS IAM-assumed roles; quarterly access review.

### B.2 Encryption

- **In transit:** TLS 1.2+ (1.3 preferred) for all external and internal hops. HSTS enabled.
- **At rest:** AES-256-GCM for credential fields (OAuth tokens, integration secrets, webhook secrets). RDS database storage encrypted via AWS KMS. S3 evidence buckets encrypted via KMS, versioned.
- **Key management:** AWS KMS with annual rotation. No customer-managed keys in baseline tier; available on Enterprise tier.

### B.3 Multi-tenant isolation

- **Logical separation:** Single-database, organization-scoped. Every user-scoped query filters by `organizationId` at the service layer (verified across 89 service files in v11 audit). Parent-child entity scope enforced on writes.
- **Optional physical separation:** Isolated runtime environments available on Enterprise tier.
- **RLS:** Primary tenant isolation is the application-layer `organizationId` filtering described above. As defense-in-depth, PostgreSQL Row-Level Security policies are defined and enabled in the database schema (per-table organization-isolation policies); deploy-gated `FORCE ROW LEVEL SECURITY` enforcement and least-privilege (non-`BYPASSRLS`) runtime role cutover are rolled out per the RLS deployment runbook.

### B.4 Network security

- VPC segmentation, AWS Security Groups, AWS WAF, AWS Shield Standard.
- GuardDuty + VPC Flow Logs.
- No public database endpoints; access via IAM-authenticated session managers only.

### B.5 Software development lifecycle

- Branch protection on `main`: required reviewers, required CI passes, signed commits.
- CI gate: lint → type-check → unit tests → e2e smoke → container scan (Trivy) → SBOM generation (CycloneDX) → SARIF upload.
- Daily dependency-scan workflow (`npm audit` + Snyk).
- SAST: ESLint security plugin, gitleaks pre-commit.
- Annual third-party penetration test.

### B.6 Operations

- **Logging:** Winston JSON to Elasticsearch; 1-year retention for CloudTrail, 90 days for application logs.
- **Monitoring:** Datadog + CloudWatch; PagerDuty rotation for production incidents.
- **Backups:** RDS automated backups (35-day retention, encrypted, cross-AZ); S3 versioning + cross-region replication for evidence; quarterly restore test.
- **DR:** RTO 4h, RPO 1h. Annual DR tabletop exercise.

### B.7 Incident response

- Documented IRP runbook with PagerDuty escalation.
- Post-incident review within 5 business days.
- GDPR Art. 33 (72h) and HIPAA Breach Notification (60-day) timers tracked within the platform.

### B.8 Sub-processor controls

- Annual sub-processor risk assessment.
- Each sub-processor bound by data-protection terms substantially equivalent to this DPA.
- Sub-processor breach-notification clauses ≤ Processor's 72-hour clock to Controller.

### B.9 Privacy by design

- Data minimization: platform records only data necessary for compliance workflows.
- Pseudonymization where feasible (audit IDs, hashed identifiers).
- PII redaction before LLM inference (no customer Personal Data is used to train any model).
- HITL gate on any AI-generated state change (policy text, control evidence) — no autonomous AI actions.

### B.10 Personnel security

- Background checks (US/EU) pre-employment.
- Confidentiality agreements signed day-1.
- Annual security-awareness training (tracked in the platform's own Security Training module).
- Role-specific training for engineering, ops, sales.

---

## Annex C — Standard Contractual Clauses

The EU Standard Contractual Clauses (Commission Implementing Decision (EU) 2021/914), Module 2 (Controller-to-Processor), are incorporated by reference into this DPA where required. The required Annexes I, II, and III are populated as follows:

- **Annex I.A (Parties):** the parties identified in Section 1 of this DPA.
- **Annex I.B (Description of transfer):** Annex A of this DPA.
- **Annex I.C (Competent supervisory authority):** the supervisory authority of the EU member state where Controller is established (or where its representative is appointed under Art. 27 GDPR).
- **Annex II (Technical and Organizational Measures):** Annex B of this DPA.
- **Annex III (List of Sub-processors):** the live list at https://aaraik.ai/legal/subprocessors.

For UK transfers, the **UK International Data Transfer Addendum** to the EU SCCs (Version B1.0, in force 21 March 2022) applies, with Tables 1-4 populated by reference to the corresponding Annexes above.

---

## Signature block

| Party | Signature | Name | Title | Date |
|-------|-----------|------|-------|------|
| **AARAIK LLC** (Processor) | | | | |
| **Customer** (Controller) | | | | |

---

*This template is provided as a starting point. Customers with specific regulatory profiles (HIPAA Business Associate, FedRAMP, financial-sector) should request a DPA pre-tuned to their context via `legal@aaraik.ai`.*
