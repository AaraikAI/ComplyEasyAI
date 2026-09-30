# DRAFT - PENDING LEGAL REVIEW

> **Status:** internal draft, prepared from the product's code and deployment configuration on
> 2026-09-27. It is **not published, not linked and not routed** on www.complyeasyai.com. It is
> a starting point for counsel, structured around Article 28 of the GDPR, and is not legal advice.
> Items marked **[TO CONFIRM]** must be settled before it is offered to any customer.

# ComplyEasyAI Data Processing Agreement

This Data Processing Agreement ("DPA") forms part of the agreement between the customer named in
the order form or account ("Customer") and [LEGAL ENTITY NAME, REGISTERED ADDRESS — TO CONFIRM]
("ComplyEasyAI") for the ComplyEasyAI platform (the "Agreement"). It applies where ComplyEasyAI
processes personal data on Customer's behalf.

## 1. Definitions

"Data Protection Laws" means the GDPR (Regulation (EU) 2016/679), the UK GDPR and Data Protection
Act 2018, the Swiss Federal Act on Data Protection, the California Consumer Privacy Act as amended
by the CPRA, and any other data protection law that applies to the processing. "Personal Data",
"Processing", "Controller", "Processor", "Data Subject" and "Personal Data Breach" have the
meanings given in the GDPR. "Customer Personal Data" means Personal Data that ComplyEasyAI
processes on Customer's behalf under the Agreement. "Sub-processor" means a third party
ComplyEasyAI engages to process Customer Personal Data.

## 2. Roles and instructions

2.1 Customer is the Controller (or a Processor acting for its own controller) and ComplyEasyAI is
the Processor of Customer Personal Data.

2.2 ComplyEasyAI processes Customer Personal Data only on Customer's documented instructions. The
Agreement, this DPA and Customer's use and configuration of the platform (including the
integrations and AI features Customer turns on) are Customer's instructions. ComplyEasyAI will
tell Customer if it believes an instruction breaks Data Protection Laws.

2.3 For California personal information, ComplyEasyAI acts as a service provider: it will not
sell or share it, retain, use or disclose it outside the direct business relationship, or combine
it with personal information from other sources except as the CCPA permits.

## 3. Confidentiality

ComplyEasyAI ensures that everyone it authorises to process Customer Personal Data is bound by
confidentiality obligations.

## 4. Security

ComplyEasyAI implements the technical and organisational measures described in Annex II. It may
update those measures provided the overall level of protection does not decrease.

## 5. Sub-processors

5.1 Customer gives general authorisation for the Sub-processors listed in Annex III.

5.2 ComplyEasyAI will give Customer at least [TO CONFIRM: 30] days' notice of a new or replacement
Sub-processor, by email or through a published sub-processor page [TO CONFIRM mechanism].
Customer may object on reasonable data protection grounds within that period; if the parties
cannot resolve the objection, Customer may terminate the affected service and receive a pro-rata
refund of prepaid fees for it.

5.3 ComplyEasyAI imposes data protection terms on each Sub-processor that are no less protective
than this DPA and remains responsible for its Sub-processors.

## 6. Data Subject requests

Taking into account the nature of the processing, ComplyEasyAI will assist Customer by appropriate
technical and organisational measures, including the platform's export and deletion functions, to
respond to Data Subject requests. If ComplyEasyAI receives a request directly, it will refer the
Data Subject to Customer and not respond itself unless the law requires it.

## 7. Personal Data Breaches

ComplyEasyAI will notify Customer without undue delay, and in any case within [TO CONFIRM: 48]
hours, after becoming aware of a Personal Data Breach affecting Customer Personal Data. The notice
will include the information the GDPR (Article 33(3)) requires, as it becomes available, and
ComplyEasyAI will take reasonable steps to contain the breach.

## 8. Assistance

ComplyEasyAI will provide reasonable assistance with Customer's data protection impact
assessments and prior consultations with supervisory authorities, where they relate to
ComplyEasyAI's processing.

## 9. Audits

ComplyEasyAI will make available the information reasonably necessary to demonstrate compliance
with this DPA. Once available, this includes its SOC 2 report (a SOC 2 Type I audit is in
progress; no report exists yet). Customer may conduct an audit, on reasonable notice and no more
than once a year unless a regulator requires it or a Personal Data Breach has occurred, where the
available information is not sufficient.

## 10. International transfers

Customer Personal Data is hosted in the United States (AWS and Supabase, us-east-1). Where a
transfer from the EEA, the UK or Switzerland is not covered by an adequacy decision, the parties
agree to the Standard Contractual Clauses (Commission Implementing Decision (EU) 2021/914, Module
Two or Module Three as applicable), the UK International Data Transfer Addendum and the Swiss
amendments, which are incorporated by reference [TO CONFIRM the selected options, docking clause,
governing law and supervisory authority]. ComplyEasyAI is not certified under the EU-US Data
Privacy Framework unless confirmed in writing.

## 11. Deletion and return

On termination, ComplyEasyAI will make Customer Personal Data available for export for
[TO CONFIRM: 30] days and then delete it, including from backups when they expire (backups are
kept for 30 days), unless the law requires it to keep the data.

## 12. Liability and precedence

Liability under this DPA is subject to the limitations in the Agreement. If this DPA conflicts
with the Agreement, this DPA prevails for the processing of Customer Personal Data; the Standard
Contractual Clauses prevail over both.

---

## Annex I — Details of the processing

| Item | Description |
|---|---|
| Subject matter | Provision of the ComplyEasyAI compliance automation platform. |
| Duration | The term of the Agreement plus the deletion period in section 11. |
| Nature and purpose | Hosting, storage, retrieval, analysis and display of Customer data to collect compliance evidence, monitor controls, manage risks and vendors, generate AI-assisted drafts and reports, and provide support. |
| Categories of Data Subjects | Customer's users; Customer's employees, contractors and vendors whose data appears in evidence, access reviews, risk and vendor records; any other individuals whose data Customer uploads or connects. |
| Categories of Personal Data | Names, business contact details, job titles, user and account identifiers, access and permission data, activity and audit-log data (including IP addresses), and any personal data contained in files, records or integration data Customer chooses to process. |
| Special categories | None are intended. Customer should not upload special-category data unless the parties agree additional safeguards [TO CONFIRM, especially for HIPAA customers — a Business Associate Agreement is a separate document]. |
| Frequency | Continuous for the term. |

## Annex II — Technical and organisational measures

See the [Security overview](./security-overview.md), which forms this annex.

## Annex III — Sub-processors

| Sub-processor | Service | Location |
|---|---|---|
| Amazon Web Services, Inc. | application hosting (ECS), object storage and backups (S3), content delivery (CloudFront), secrets management | United States (us-east-1); CloudFront edge locations worldwide |
| Supabase, Inc. | managed PostgreSQL database | United States (us-east-1) |
| [Redis provider — TO CONFIRM] | job queues, caching, security tokens | [TO CONFIRM] |
| Twilio Inc. (SendGrid) | transactional email | United States |
| Google LLC (Gemini API) | AI text generation and analysis, when Customer uses AI features | [TO CONFIRM] |
| OpenAI, L.L.C. | audio transcription, when Customer uses transcription | United States |
| Stripe, Inc. | payment processing, when billing is enabled | United States |
| GitHub, Inc. (Actions) | nightly database backup job | [TO CONFIRM] |
| Sentry (Functional Software, Inc.) | error monitoring — only if enabled (disabled today) | [TO CONFIRM] |
| Google LLC (Cloud Vision) | document text extraction — [TO CONFIRM whether used] | [TO CONFIRM] |

Systems Customer connects through integrations (for example Customer's own cloud, identity or
code-hosting accounts) are Customer's own processors or services, not ComplyEasyAI's
Sub-processors.

---

### Facts to confirm before this DPA is offered
1. Contracting entity, governing law and notice address.
2. Breach-notification window and sub-processor notice period and mechanism.
3. Standard Contractual Clauses options and UK/Swiss addenda.
4. Redis provider, Gemini region and tier, GitHub runner location, Cloud Vision use.
5. Deletion window after termination.
6. Whether a HIPAA Business Associate Agreement will be offered, and on which plans.
