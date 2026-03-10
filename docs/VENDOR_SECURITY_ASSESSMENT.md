# ComplyEasyAI -- Vendor Security Assessment Questionnaire

> **Document Classification:** Confidential -- Internal
> **Version:** 2.0
> **Owner:** Chief Information Security Officer (CISO), AARAIK LLC
> **Effective Date:** 2026-03-08
> **Next Review Date:** 2026-06-08
> **Review Cadence:** Quarterly (critical vendors), Annually (all vendors)
> **Approval:** [CISO Signature] | [DPO Signature] | [CTO Signature]
> **SOC 2 Mapping:** CC9.2, CC3.2, CC3.4

---

## Table of Contents

1. [Purpose and Scope](#1-purpose-and-scope)
2. [Assessment Questionnaire](#2-assessment-questionnaire)
3. [Risk Rating Criteria](#3-risk-rating-criteria)
4. [Subprocessor Registry](#4-subprocessor-registry)
5. [Assessment Schedule](#5-assessment-schedule)
6. [Remediation Tracking](#6-remediation-tracking)
7. [Document Control](#7-document-control)

---

## 1. Purpose and Scope

### 1.1 Purpose

This document establishes the formal vendor security assessment process for ComplyEasyAI, operated by AARAIK LLC. It ensures that all third-party vendors, subprocessors, and service providers who access, process, store, or transmit ComplyEasyAI data meet the organization's security, privacy, and compliance requirements.

This questionnaire directly supports **SOC 2 Trust Services Criteria CC9.2** (Risk Mitigation through Vendor Management) by providing:
- A structured methodology for evaluating vendor security posture
- A risk-based scoring framework for vendor classification
- A continuous monitoring schedule aligned to vendor risk level
- A documented subprocessor registry for transparency and auditability

### 1.2 Scope

This assessment applies to:
- **All third-party vendors** that access, process, store, or transmit ComplyEasyAI customer data
- **All subprocessors** engaged by ComplyEasyAI as defined under GDPR Article 28
- **All cloud infrastructure providers** hosting ComplyEasyAI components
- **All SaaS tools** integrated into the ComplyEasyAI platform that handle customer data

Out of scope:
- Vendors that do not access, process, or store any ComplyEasyAI or customer data
- Commodity software licenses without data processing (e.g., IDE licenses)
- Open-source libraries (covered under Software Composition Analysis in CI/CD pipeline)

### 1.3 Regulatory Alignment

This assessment supports compliance with:
- **SOC 2 Type II:** CC9.2 (Vendor Risk Management), CC3.2 (Risk Assessment), CC3.4 (Risk Mitigation)
- **GDPR:** Articles 28, 32, 44-49 (Processor Obligations, Security of Processing, International Transfers)
- **ISO 27001:** A.15 (Supplier Relationships)
- **NIST CSF:** ID.SC (Supply Chain Risk Management)

### 1.4 Definitions

| Term | Definition |
|------|-----------|
| **Vendor** | Any third-party organization providing services, products, or technology to ComplyEasyAI |
| **Subprocessor** | A vendor that processes personal data on behalf of ComplyEasyAI and its customers (GDPR Article 28) |
| **Data Access Level** | Classification of data sensitivity the vendor can access (Level 1-4) |
| **Composite Risk Score** | Aggregated risk rating based on multiple assessment dimensions (6-24 scale) |
| **DPA** | Data Processing Agreement, a contractual document governing data processing activities |
| **SCC** | Standard Contractual Clauses for international data transfers |

---

## 2. Assessment Questionnaire

### Instructions

Each vendor must complete all applicable sections below. Vendors should provide supporting evidence for all responses, including certifications, audit reports, and policy documents. Incomplete responses or refusal to answer will negatively impact the risk score.

---

### Section A: Company Information

| # | Question | Response | Evidence |
|---|----------|----------|----------|
| A.1 | Legal company name, DBA, and headquarters address | | |
| A.2 | Year established and number of employees | | |
| A.3 | Primary security contact name, email, and phone | | |
| A.4 | Company website and security page URL | | |
| A.5 | Jurisdictions in which data is processed or stored | | |
| A.6 | Insurance coverage: cyber liability policy and limits | | |

---

### Section B: Data Handling and Processing

| # | Question | Response | Evidence |
|---|----------|----------|----------|
| B.1 | Describe the types of data you process on behalf of ComplyEasyAI and its customers. | | |
| B.2 | Describe your data classification scheme (e.g., Public, Internal, Confidential, Restricted). | | |
| B.3 | How is customer data logically or physically isolated from other customers (multi-tenant isolation)? | | |
| B.4 | What is your data retention policy? How is data purged upon contract termination? Is deletion certified? | | |
| B.5 | Do you process personal data outside the EEA? If yes, what transfer mechanisms are in place (SCCs, adequacy decisions)? | | |
| B.6 | How do you support data subject rights requests (access, rectification, erasure, portability)? | | |
| B.7 | Describe your data backup procedures: frequency, retention, encryption, and recovery testing schedule. | | |
| B.8 | Do you engage sub-processors? If yes, how do you ensure they meet equivalent security standards? Do you provide advance notice of sub-processor changes? | | |

---

### Section C: Encryption and Key Management

| # | Question | Response | Evidence |
|---|----------|----------|----------|
| C.1 | Do you encrypt all customer data at rest? Specify algorithm and key length (e.g., AES-256-GCM). | | |
| C.2 | Do you encrypt all data in transit? Specify minimum TLS version (must be TLS 1.2+). | | |
| C.3 | Describe your key management practices. Are keys stored separately from data? Do you use HSM or managed KMS? | | |
| C.4 | Do you support customer-managed encryption keys (BYOK / CMEK)? Describe the implementation. | | |
| C.5 | How are encryption keys rotated? What is the rotation schedule? | | |
| C.6 | Are any FIPS 140-2 or FIPS 140-3 validated cryptographic modules used? Specify certificate numbers. | | |

---

### Section D: Access Control and Authentication

| # | Question | Response | Evidence |
|---|----------|----------|----------|
| D.1 | Is MFA required for all personnel with access to customer data or production systems? | | |
| D.2 | Describe your RBAC implementation. How are permissions assigned, reviewed, and revoked? | | |
| D.3 | How is privileged access (admin, root, database) managed? Do you use a PAM solution? | | |
| D.4 | How frequently are user access rights reviewed? What is the SLA for access revocation upon employee termination? | | |
| D.5 | Do you maintain comprehensive audit logs of all access to customer data? What is the log retention period? Are logs tamper-evident? | | |
| D.6 | Do you enforce the principle of least privilege? How is compliance verified? | | |

---

### Section E: Incident Response and Breach Notification

| # | Question | Response | Evidence |
|---|----------|----------|----------|
| E.1 | Do you have a documented Incident Response Plan? When was it last updated and tested? | | |
| E.2 | What is your breach notification SLA? Within how many hours of discovering a breach do you notify affected customers? | | |
| E.3 | Describe your incident response team structure and escalation procedures. | | |
| E.4 | How do you communicate with affected customers during and after a security incident? | | |
| E.5 | Have you experienced any security breaches in the past 3 years? If yes, describe the nature, impact, and remediation. | | |
| E.6 | Do you perform post-incident reviews? How are lessons learned incorporated into your security program? | | |

---

### Section F: Certifications and Compliance

| # | Question | Response | Evidence |
|---|----------|----------|----------|
| F.1 | List all current security certifications and their expiration dates (SOC 2 Type II, ISO 27001, FedRAMP, PCI DSS, HITRUST). | | |
| F.2 | When was your most recent SOC 2 Type II audit? Were there qualified opinions or exceptions? Provide the report or bridge letter. | | |
| F.3 | Are you GDPR compliant? Do you have a DPO? Provide contact information. | | |
| F.4 | Describe your compliance monitoring program. How do you track and remediate audit findings? | | |
| F.5 | Do you engage in continuous compliance monitoring or automated control testing? What tools are used? | | |
| F.6 | Do you conduct regular penetration tests by independent third parties? Provide the executive summary of the most recent test. | | |

---

### Section G: Business Continuity and Disaster Recovery

| # | Question | Response | Evidence |
|---|----------|----------|----------|
| G.1 | Do you have a documented Disaster Recovery (DR) plan? When was it last tested? Provide results summary. | | |
| G.2 | What are your RTO and RPO for services provided to ComplyEasyAI? | | |
| G.3 | Describe your geographic redundancy: how many regions/availability zones is data replicated across? | | |
| G.4 | What is your published SLA for service availability? What compensation is provided if the SLA is not met? | | |
| G.5 | How do you ensure service continuity during major incidents or natural disasters? | | |

---

### Section H: GDPR / Data Protection

| # | Question | Response | Evidence |
|---|----------|----------|----------|
| H.1 | Do you have a Data Protection Officer (DPO)? Provide name and contact information. | | |
| H.2 | Have you conducted a Data Protection Impact Assessment (DPIA) for the services provided to us? | | |
| H.3 | Describe your Records of Processing Activities (ROPA) as required under GDPR Article 30. | | |
| H.4 | How do you ensure Privacy by Design and Privacy by Default in your product development? | | |
| H.5 | What mechanisms do you use for lawful international data transfers (SCCs, BCRs, adequacy decisions)? | | |
| H.6 | What is your process for responding to data protection authority inquiries or enforcement actions? | | |

---

## 3. Risk Rating Criteria

### 3.1 Risk Levels

Each vendor is evaluated across multiple dimensions and assigned a composite risk rating.

| Risk Level | Score Range | Description | Assessment Frequency | Required Actions |
|-----------|------------|-------------|---------------------|-----------------|
| **Critical** | 20-24 | Vendor poses significant risk to data security and compliance. Immediate action required. | Monthly | Immediate remediation plan; consider vendor replacement; board notification; enhanced logging; contract renegotiation with security addendum |
| **High** | 15-19 | Vendor has material gaps in security controls. Active risk management required. | Quarterly | Dedicated security review; data minimization audit; alternative vendor evaluation; BYOK where supported; regular access audits |
| **Medium** | 10-14 | Vendor meets baseline requirements with some areas for improvement. | Semi-Annual | Enhanced monitoring; security addendum in contract; data encryption verified; incident notification SLA < 72 hours |
| **Low** | 6-9 | Vendor demonstrates strong security posture with comprehensive controls. | Annual | Standard monitoring; renewal review; DPA in place |

### 3.2 Scoring Dimensions

| Dimension | 1 (Low Risk) | 2 (Medium Risk) | 3 (High Risk) | 4 (Critical Risk) |
|-----------|-------------|-----------------|---------------|-------------------|
| **Data Sensitivity** | Public data only | Internal / non-sensitive | Confidential business data | PII, auth data, encryption keys, billing |
| **Data Volume** | Minimal (<1K records) | Moderate (1K-100K) | Large (100K-1M) | Very large (>1M) or unbounded |
| **Certification** | SOC 2 + ISO 27001 + additional | SOC 2 + ISO 27001 | SOC 2 only | No SOC 2 or ISO 27001 |
| **Replaceability** | Easily replaceable (commodity) | Moderate effort (1-2 weeks) | Difficult (1-3 months) | Very difficult (3+ months) |
| **Breach History** | No breaches in 5+ years | No breaches in 3 years | 1 breach in 3 years (remediated) | Multiple or unresolved breaches |
| **Questionnaire Score** | 90-100% satisfactory | 75-89% satisfactory | 50-74% satisfactory | <50% or refusal to answer |

### 3.3 Composite Risk Calculation

**Composite Score** = Sum of all 6 dimension scores (range: 6-24)

---

## 4. Subprocessor Registry

### 4.1 Approved Subprocessors

The following vendors are authorized to process data on behalf of ComplyEasyAI and its customers. Each vendor has undergone a security assessment and maintains current certifications.

| # | Subprocessor | Service Category | Primary Region | Data Access Level | Key Certifications | Composite Risk Score | Risk Rating | Last Assessment | Next Assessment |
|---|-------------|-----------------|---------------|-------------------|-------------------|---------------------|-------------|----------------|----------------|
| 1 | **Supabase** | Database / Auth | us-east-1 | Level 4 -- Restricted (All app data, PII, credentials) | SOC 2 Type II | 16 | High | 2026-01-15 | 2026-04-15 |
| 2 | **AWS** (ECS, S3, KMS, CloudFront, ALB, ElastiCache) | Infrastructure | us-east-1 | Level 4 -- Restricted (All data in transit/at rest, encryption keys) | SOC 2 Type II, ISO 27001, FedRAMP High, PCI DSS Level 1 | 14 | Medium | 2026-01-15 | 2026-07-15 |
| 3 | **Stripe** | Payment Processing | us-east-1 | Level 4 -- Restricted (Billing tokens, customer email, subscription data) | PCI DSS Level 1, SOC 2 Type II, ISO 27001 | 11 | Medium | 2026-02-01 | 2026-08-01 |
| 4 | **SendGrid** (Twilio) | Email Delivery | us-east-1 | Level 3 -- Confidential (User email addresses, notification content) | SOC 2 Type II, ISO 27001 | 10 | Medium | 2026-02-01 | 2026-08-01 |
| 5 | **Sentry** | Error Monitoring | us-east-1 | Level 2 -- Internal (PII-sanitized error logs, stack traces) | SOC 2 Type II | 8 | Low | 2026-02-15 | 2027-02-15 |
| 6 | **Elastic APM** | Performance Monitoring | us-east-1 | Level 2 -- Internal (Request metadata, transaction traces, PII excluded) | SOC 2 Type II, ISO 27001, FedRAMP | 7 | Low | 2026-02-15 | 2027-02-15 |

### 4.2 Subprocessor Change Management

Any change to the subprocessor registry requires:

1. **30-day advance notice** to affected customers (per DPA terms)
2. Security assessment of the new subprocessor using this questionnaire (Section 2)
3. Risk scoring per the matrix in Section 3
4. DPA execution with the new subprocessor
5. Approval by CISO and DPO
6. Update to this registry document
7. Customer notification via email and in-app announcement

### 4.3 Data Flow Summary

```
Customer Browser
     |
     v
CloudFront (AWS) -----> S3 (AWS) [Frontend static assets]
     |
     v
ALB (AWS) -----------> ECS Fargate (AWS) [Application logic]
                            |
         +------------------+------------------+
         |                  |                  |
         v                  v                  v
   Supabase           ElastiCache         S3 (AWS)
   PostgreSQL         Redis (AWS)         [Evidence,
   [All app data]     [Sessions,           Exports,
                       CSRF, Cache]        Backups]
         |
         +---- Stripe [Billing webhooks + API calls]
         |
         +---- SendGrid [Email delivery API]
         |
         +---- Sentry [Error reports via HTTPS]
         |
         +---- Elastic APM [Traces via HTTPS]
```

---

## 5. Assessment Schedule

### 5.1 Initial Assessment

All vendors must complete the full security questionnaire (Section 2) before onboarding. The assessment must be reviewed and approved by the CISO before the vendor is granted access to any ComplyEasyAI data.

### 5.2 Annual Re-Assessment

All vendors, regardless of risk level, undergo a full re-assessment at least annually. Higher-risk vendors are assessed more frequently as defined in Section 3.1.

### 5.3 Assessment Calendar

| Vendor | Risk Rating | Frequency | Q1 2026 | Q2 2026 | Q3 2026 | Q4 2026 |
|--------|------------|-----------|---------|---------|---------|---------|
| Supabase | High | Quarterly | Jan | Apr | Jul | Oct |
| AWS | Medium | Semi-Annual | Jan | -- | Jul | -- |
| Stripe | Medium | Semi-Annual | Feb | -- | Aug | -- |
| SendGrid | Medium | Semi-Annual | Feb | -- | Aug | -- |
| Sentry | Low | Annual | -- | -- | -- | Nov |
| Elastic APM | Low | Annual | -- | -- | -- | Nov |

### 5.4 Triggered Assessments

An immediate assessment is triggered when:

| Trigger | Scope | Timeline |
|---------|-------|----------|
| Vendor discloses a security breach | Full questionnaire + incident details | Within 5 business days |
| Vendor certification expires or is revoked | Certification verification + risk rescore | Within 10 business days |
| Vendor changes sub-processors | Sub-processor review + DPA update | Within 30 days |
| Significant service or scope change | Full reassessment | Within 30 days |
| Regulatory requirement change | Compliance sections update | Within 30 days |
| Customer complaint regarding vendor | Targeted assessment of complaint area | Within 10 business days |

---

## 6. Remediation Tracking

### 6.1 Remediation Template

Use the following template to track identified gaps and their remediation.

| Finding ID | Vendor | Section | Finding Description | Severity | Owner | Due Date | Status | Remediation Notes | Verified By | Verified Date |
|-----------|--------|---------|---------------------|----------|-------|----------|--------|-------------------|-------------|--------------|
| VSA-001 | | | | Critical / High / Medium / Low | | | Open / In Progress / Closed / Accepted Risk | | | |
| VSA-002 | | | | | | | | | | |
| VSA-003 | | | | | | | | | | |
| VSA-004 | | | | | | | | | | |
| VSA-005 | | | | | | | | | | |

### 6.2 Remediation SLAs

| Severity | Maximum Time to Remediate | Escalation |
|----------|--------------------------|------------|
| **Critical** | 7 calendar days | Immediate escalation to CISO and CTO; consider vendor suspension |
| **High** | 30 calendar days | Escalation to CISO if not resolved within 14 days |
| **Medium** | 90 calendar days | Tracked in quarterly vendor review |
| **Low** | Next annual assessment cycle | Documented for follow-up |

### 6.3 Risk Acceptance

If a finding cannot be remediated by the vendor, a formal risk acceptance must be documented:

| Field | Value |
|-------|-------|
| **Finding ID** | |
| **Risk Description** | |
| **Business Justification for Acceptance** | |
| **Compensating Controls** | |
| **Risk Owner** | |
| **Accepted By** | CISO: __________ Date: __________ |
| **Review Date** | (must be within 12 months) |

---

## 7. Document Control

### 7.1 Version History

| Version | Date | Author | Changes | Approved By |
|---------|------|--------|---------|-------------|
| 1.0 | 2026-03-01 | CISO, AARAIK LLC | Initial release | [CISO], [DPO], [CTO] |
| 2.0 | 2026-03-08 | CISO, AARAIK LLC | Expanded questionnaire sections; added GDPR/Data Protection section; enhanced remediation tracking; updated risk scoring dimensions | [CISO], [DPO], [CTO] |

### 7.2 Related Documents

| Document | Location | Relationship |
|----------|----------|-------------|
| Incident Response Plan | [docs/INCIDENT_RESPONSE_PLAN.md](INCIDENT_RESPONSE_PLAN.md) | Vendor incident coordination |
| Business Continuity Plan | [docs/BUSINESS_CONTINUITY_PLAN.md](BUSINESS_CONTINUITY_PLAN.md) | Vendor dependency mapping |
| Secret Rotation Runbook | [docs/SECRET_ROTATION_RUNBOOK.md](SECRET_ROTATION_RUNBOOK.md) | Vendor credential rotation |
| FIPS Cryptographic Module Boundary | [docs/FIPS_CRYPTOGRAPHIC_MODULE_BOUNDARY.md](FIPS_CRYPTOGRAPHIC_MODULE_BOUNDARY.md) | Vendor cryptographic requirements |
| Change Management Procedure | [docs/CHANGE_MANAGEMENT_PROCEDURE.md](CHANGE_MANAGEMENT_PROCEDURE.md) | Vendor integration change process |
| Penetration Test Report | [docs/PENETRATION_TEST_REPORT.md](PENETRATION_TEST_REPORT.md) | Vendor integration security testing |

### 7.3 Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| CISO | __________________ | __________________ | __________ |
| DPO | __________________ | __________________ | __________ |
| CTO | __________________ | __________________ | __________ |

---

*End of Document*
