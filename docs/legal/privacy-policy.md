# DRAFT - PENDING LEGAL REVIEW

> **Status:** internal draft, prepared from the product's code and deployment configuration on
> 2026-09-27. It is **not published, not linked and not routed** on www.complyeasyai.com. It is not
> legal advice. Every item marked **[TO CONFIRM]** must be answered, and the whole document reviewed
> by qualified counsel for each jurisdiction you sell into, before it is published.

# ComplyEasyAI Privacy Policy

**Effective date:** [TO CONFIRM on publication]
**Last updated:** [TO CONFIRM on publication]

This policy explains how [LEGAL ENTITY NAME, REGISTERED ADDRESS — TO CONFIRM] ("ComplyEasyAI",
"we", "us") collects, uses, shares and protects personal data when you visit
www.complyeasyai.com, request a demo or a trial, or use the ComplyEasyAI platform.

## 1. Who is responsible for your data

| Situation | Our role |
|---|---|
| You browse the website, request a demo or trial, or contact us | We are the **controller** of the personal data you give us. |
| You or your organization have a ComplyEasyAI account (account and billing details) | We are the **controller** of account and billing data. |
| Your organization puts data into the platform (evidence, policies, risk records, vendor data, data pulled through integrations) | Your organization is the **controller**; we act as its **processor** under our [Data Processing Agreement](./data-processing-agreement.md). Requests about that data should go to your organization. |

**Contact:** privacy@complyeasyai.com [TO CONFIRM the mailbox exists and is monitored].
**EU/UK representative (GDPR Art. 27):** [TO CONFIRM whether one is required and who it is].
**Data Protection Officer:** [TO CONFIRM whether one is appointed; the code base references dpo@complyeasyai.com].

## 2. What we collect

**Website visitors**
- Technical data your browser sends with every request (IP address, user agent, requested URL,
  timestamp), processed by our hosting and content-delivery providers.
- Your cookie-consent choice, stored in your browser's local storage.
- The site does not load third-party analytics or advertising scripts; its Content Security Policy
  allows scripts only from our own origin. [TO CONFIRM this is still true at publication.]

**Demo and trial requests** (the form at /demo)
- Name, work email, company, and the optional details you choose to give: phone, job title,
  company size, industry, country, frameworks of interest, the plan you are considering, your main
  challenge, a message, a preferred date, how you heard about us, and campaign (UTM) parameters
  from the link you followed.

**Account holders**
- Sign-up details: work email, full name, organization name, industry, company size, primary
  compliance goal and how you heard about us.
- Authentication data: a password hash (PBKDF2-SHA256, 600,000 iterations) if you set a password,
  one-time sign-in links, and multi-factor authentication secrets if you enable MFA.
- Activity records: an audit log of actions in the platform, including the IP address and user
  agent of the request.
- Billing details, when paid billing is enabled, are collected and stored by our payment processor
  (Stripe); we keep only references such as a customer ID and subscription status. [TO CONFIRM
  billing is enabled before publication; it is not enabled today.]

**Customer content** (processed on your organization's behalf)
- Evidence files, policies, risk and vendor records, assessments, audit artefacts, chat questions
  to the AI assistant, and data the platform pulls from systems your organization connects
  (for example cloud accounts, code repositories, identity providers and ticketing tools).
- Credentials your organization gives us to connect those systems. They are encrypted with
  AES-256-GCM before they are stored.

## 3. How and why we use it

| Purpose | Data | Legal basis (GDPR / UK GDPR) |
|---|---|---|
| Provide, secure and support the platform | account, authentication, activity and customer data | contract; legitimate interests in security |
| Respond to demo and trial requests and follow up | demo request data | legitimate interests; consent where required for marketing |
| Send service email (sign-in links, notifications) | email address, account data | contract |
| Product updates and marketing email | email address | consent (the optional box at sign-up); you can withdraw at any time |
| Run AI features you or your organization use | the content you submit to that feature | contract (as processor, on your organization's instructions) |
| Keep backups and recover from incidents | database contents | legitimate interests; contract |
| Meet legal obligations and enforce our terms | as needed | legal obligation; legitimate interests |

We do not sell personal data, and we do not share it for cross-context behavioural advertising.

## 4. AI features

Some features send the content you submit (for example a policy draft request, a document for
gap analysis, or a chat question) to an AI model provider to generate a response:

- **Google (Gemini API)** for text generation and analysis.
- **OpenAI (Whisper API)** for audio transcription, when you use a feature that transcribes audio.

[TO CONFIRM for each provider: the account tier used, whether the provider may retain or use
prompts to improve its models under that tier, and the retention period. Only publish a
"never used for training" statement once this is confirmed in writing.]

AI output can be wrong. It is a draft for a person to review, not legal or audit advice.

## 5. Who we share it with

We share personal data only with service providers that process it for us under contract
("sub-processors"), with your organization (for data in its workspace), with professional
advisers, and where the law requires it.

| Provider | What it does for us | Location |
|---|---|---|
| Amazon Web Services | application hosting (ECS), file storage and backups (S3), content delivery (CloudFront), secrets storage | United States (us-east-1); CloudFront serves from edge locations worldwide |
| Supabase | managed PostgreSQL database | United States (us-east-1) |
| [Redis provider — TO CONFIRM] | job queues, caching and security tokens | [TO CONFIRM] |
| Twilio SendGrid | transactional email | United States |
| Google (Gemini API) | AI features | [TO CONFIRM] |
| OpenAI (Whisper API) | audio transcription | United States |
| Stripe | payments, when billing is enabled | United States |
| GitHub (Actions) | runs the nightly database backup job; database dumps pass through its runners | [TO CONFIRM] |
| Sentry | error monitoring — listed only if enabled (disabled today) | [TO CONFIRM] |
| Twilio | SMS notifications — listed only if enabled (disabled today) | [TO CONFIRM] |
| Google Cloud Vision | document text extraction — [TO CONFIRM whether used in production] | [TO CONFIRM] |

Systems your organization chooses to connect (for example its own AWS account, GitHub
organization or Okta tenant) are directed by your organization and are not our sub-processors.

## 6. International transfers

The platform is hosted in the United States (AWS and Supabase, us-east-1). If you are in the
EEA, the UK or Switzerland, your data is transferred to the United States. We rely on
[TO CONFIRM: the European Commission's Standard Contractual Clauses and the UK Addendum, or
another valid mechanism]. ComplyEasyAI is **not** certified under the EU-US Data Privacy
Framework unless and until that is confirmed here.

## 7. How long we keep it

| Data | Retention |
|---|---|
| Demo and trial requests | [TO CONFIRM, e.g. 24 months after the last contact] |
| Account data | for the life of the account, then [TO CONFIRM] |
| Customer content | for the life of the subscription; deleted or returned under the DPA |
| Database backups | 30 days (nightly backups are pruned after 30 days) |
| Audit logs | [TO CONFIRM] |

## 8. How we protect it

See the [Security overview](./security-overview.md). In short: encryption in transit (TLS) and at
rest, integration credentials additionally encrypted with AES-256-GCM, multi-factor
authentication, role-based access, audit logging, and a single US hosting region. A SOC 2 Type I
audit is in progress; ComplyEasyAI does not yet hold a SOC 2 report or an ISO 27001 certificate.

## 9. Your rights

Depending on where you live, you may have the right to access, correct, delete or port your
personal data, to object to or restrict certain processing, to withdraw consent, and to complain
to a supervisory authority (in the UK, the ICO; in the EU, your local data protection authority).

**California residents (CCPA/CPRA):** you may request to know, delete and correct personal
information, and to opt out of sale or sharing. We do not sell or share personal information as
those terms are defined. We will not discriminate against you for exercising these rights.
[TO CONFIRM whether ComplyEasyAI meets the CCPA thresholds; keep this section either way if
counsel prefers.]

**India (DPDP Act 2023):** [TO CONFIRM applicability and the Data Protection Officer / grievance
contact required under the DPDP Rules 2025 once the relevant provisions apply.]

To exercise a right, email privacy@complyeasyai.com. For data in your organization's workspace,
contact your organization first; we will assist it as its processor. We respond within the time
the applicable law requires (for example one month under the GDPR).

## 10. Cookies and local storage

| Item | Type | Purpose |
|---|---|---|
| Session cookies (access and refresh tokens) | strictly necessary, httpOnly | keep you signed in |
| CSRF token cookie | strictly necessary | protect form submissions |
| Cookie-consent choice | local storage | remember your choice |
| Interface preferences (theme, dismissed banners) | local storage | remember settings |

The consent banner offers functional, analytics and targeting categories; the site does not set
analytics or advertising cookies today. [TO CONFIRM before publication, and update this table if
any analytics tool is added.]

## 11. Children

The platform is for businesses and is not directed to children. We do not knowingly collect
children's personal data.

## 12. Changes

We will post changes on this page and update the date above. Material changes will be notified
to account holders by email.

---

### Facts to confirm before publication (checklist for counsel)
1. Legal entity name, registered address and governing jurisdiction.
2. Monitored privacy mailbox; DPO and EU/UK representative requirements.
3. Redis provider and region; Google Gemini region and tier; whether Google Cloud Vision is used.
4. AI providers' data-use terms under the tiers actually used.
5. Transfer mechanism for EEA/UK/Swiss data.
6. Retention periods in section 7.
7. Whether billing (Stripe), Sentry or Twilio are enabled at publication.
8. That no analytics or advertising scripts or cookies have been added.
