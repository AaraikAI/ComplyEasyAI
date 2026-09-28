/**
 * Glossary of compliance, privacy, and AI-governance terms.
 *
 * Definitions are factual and vendor-neutral. Each entry opens answer-first:
 * `shortDef` is a quotable 40–60-word definition whose first sentence defines
 * the term, `tldr` lists three key points, and `faqs` answers the follow-up
 * questions people ask most (also emitted as FAQPage structured data). `body`
 * explains how the term works in practice, `related` references other
 * glossary slugs, and `pillar` links to the public guide that covers the term
 * in depth.
 */

export interface GlossaryFaq {
  q: string;
  a: string;
}

export interface GlossaryPillarLink {
  /** Public route of the guide (see scripts/publicRoutes.mjs). */
  path: string;
  /** Link text, e.g. 'SOC 2 compliance guide'. */
  label: string;
}

export interface GlossaryTerm {
  slug: string;
  term: string;
  /** How the term reads inside "What is …?", e.g. 'the EU AI Act'. Defaults to the term. */
  inQuestion?: string;
  /** Quotable 40–60-word definition; the first sentence defines the term. */
  shortDef: string;
  /** Three key takeaways. */
  tldr: string[];
  /** 2-4 paragraphs of explanation (plain strings or simple markdown). */
  body: string;
  /** Follow-up questions with short answers. */
  faqs: GlossaryFaq[];
  /** Slugs of related glossary terms. */
  related: string[];
  /** Public guide that covers the term in depth. */
  pillar: GlossaryPillarLink;
  /** Date of the last content review, e.g. '2026-09-27'. */
  lastReviewed: string;
}

/** Date of the September 2026 review of every entry. */
const REVIEWED = '2026-09-27';

const GDPR_GUIDE: GlossaryPillarLink = { path: '/gdpr', label: 'GDPR compliance guide' };
const GRC_GUIDE: GlossaryPillarLink = { path: '/grc', label: 'GRC software guide' };
const PLATFORM_GUIDE: GlossaryPillarLink = { path: '/platform', label: 'How the ComplyEasyAI platform works' };
const SOC2_GUIDE: GlossaryPillarLink = { path: '/soc2-compliance', label: 'SOC 2 compliance guide' };

export const glossaryTerms: GlossaryTerm[] = [
  {
    slug: 'ai-compliance',
    term: 'AI Compliance',
    inQuestion: 'AI compliance',
    shortDef:
      'AI compliance is the practice of making sure AI systems meet the laws, standards and ethical policies that apply to them across their lifecycle. It covers an inventory of AI systems, risk classification, data governance, documentation, bias testing, human oversight and monitoring, under rules such as the EU AI Act, NIST AI RMF and ISO/IEC 42001.',
    tldr: [
      'Start with an inventory of every AI system you build, buy or embed.',
      'Duties scale with each system’s risk.',
      'Reuse existing security and privacy evidence.',
    ],
    body:
      'AI compliance covers the controls, documentation, and governance needed to demonstrate that an AI system is developed and operated responsibly. It spans risk classification, data governance, transparency, human oversight, and ongoing monitoring of model behavior.\n\nThe regulatory landscape for AI is expanding quickly. Frameworks such as the EU AI Act impose obligations based on a system\'s risk level, while voluntary frameworks like the NIST AI Risk Management Framework provide structured guidance for identifying and mitigating AI risks.\n\nIn practice, AI compliance combines traditional security and privacy controls with AI-specific requirements: documenting training data provenance, evaluating models for bias, maintaining audit trails of decisions, and ensuring meaningful human review of high-impact outcomes.',
    faqs: [
      {
        q: 'Is AI compliance mandatory?',
        a: 'Parts of it are. The EU AI Act is binding law in the EU, while the NIST AI RMF and ISO/IEC 42001 are voluntary frameworks that organizations adopt to show responsible AI governance.',
      },
      {
        q: 'Who owns AI compliance?',
        a: 'Leadership sets policy and risk appetite; engineering, legal and security teams share the controls, often coordinated by an AI governance lead.',
      },
    ],
    related: ['eu-ai-act', 'nist-ai-rmf', 'grc', 'continuous-compliance'],
    pillar: { path: '/platform/ai-compliance', label: 'AI compliance guide' },
    lastReviewed: REVIEWED,
  },
  {
    slug: 'soc-2',
    term: 'SOC 2',
    shortDef:
      'SOC 2 is an AICPA attestation that reports how a service organization protects customer data against the Trust Services Criteria: security, availability, processing integrity, confidentiality and privacy. An independent CPA firm issues it, either as a Type I report on control design or a Type II report on operating effectiveness over a period, typically three to twelve months.',
    tldr: [
      'Security is always in scope.',
      'Type II needs an observation period, typically three to twelve months.',
      'Only CPA firms issue SOC 2 reports.',
    ],
    body:
      'SOC 2 (System and Organization Controls 2) is defined by the AICPA and is one of the most requested attestations for SaaS and cloud companies. A SOC 2 report is produced by an independent auditor and describes the controls a service organization has in place to protect customer data.\n\nThere are two report types. A SOC 2 Type I report assesses control design at a single point in time, while a SOC 2 Type II report evaluates whether those controls operated effectively over a period, typically three to twelve months.\n\nAchieving SOC 2 readiness involves defining controls, collecting evidence that they operate as intended, and remediating gaps. Continuous evidence collection and control monitoring substantially reduce the manual effort of preparing for a Type II audit.',
    faqs: [
      {
        q: 'Is SOC 2 a certification?',
        a: 'No. SOC 2 is an attestation report issued by a CPA firm, not a certificate, although people often call it a certification.',
      },
      {
        q: 'Is SOC 2 required by law?',
        a: 'No, but many B2B buyers require a SOC 2 report from vendors that handle their data.',
      },
    ],
    related: ['iso-27001', 'evidence-collection', 'continuous-compliance', 'audit-readiness'],
    pillar: SOC2_GUIDE,
    lastReviewed: REVIEWED,
  },
  {
    slug: 'iso-27001',
    term: 'ISO 27001',
    shortDef:
      'ISO/IEC 27001 is the international standard for an information security management system (ISMS). The current 2022 edition, amended in 2024, requires a risk assessment, a Statement of Applicability covering 93 Annex A controls, internal audits and management review. Accredited certification bodies certify organizations for three years, with annual surveillance audits in between.',
    tldr: [
      '93 Annex A controls in four themes.',
      'Certificates last three years, with annual surveillance audits.',
      'Certificates to the 2013 edition expired on 31 October 2025.',
    ],
    body:
      'ISO/IEC 27001 provides a risk-based framework for managing information security. Rather than prescribing a fixed checklist, it requires an organization to identify its information security risks and select controls to treat them, drawing on the reference controls in Annex A.\n\nCertification is granted by an accredited body following a two-stage audit and is maintained through periodic surveillance audits and a recertification cycle, typically every three years. Central to the standard is the Information Security Management System (ISMS) — the policies, procedures, and governance structure that operationalize security.\n\nMany organizations pursue ISO 27001 alongside SOC 2 because the two share substantial control overlap. Cross-framework control mapping lets a single piece of evidence satisfy requirements in both, reducing duplicate work.',
    faqs: [
      {
        q: 'What is a Statement of Applicability?',
        a: 'The document that lists which Annex A controls apply to your organization, whether they are implemented, and why any are excluded.',
      },
      {
        q: 'How does ISO 27001 differ from SOC 2?',
        a: 'ISO 27001 leads to a certificate for a management system; SOC 2 is an attestation report on controls. Their controls overlap heavily, so evidence can serve both.',
      },
    ],
    related: ['soc-2', 'control-mapping', 'risk-register', 'audit-readiness'],
    pillar: { path: '/iso-27001', label: 'ISO 27001 compliance guide' },
    lastReviewed: REVIEWED,
  },
  {
    slug: 'gdpr',
    term: 'GDPR',
    inQuestion: 'the GDPR',
    shortDef:
      'The General Data Protection Regulation (GDPR) is the EU law, applying since 25 May 2018, that governs how organizations process the personal data of people in the EU. It requires a lawful basis, transparency and security, gives individuals rights such as access and erasure, and allows fines of up to €20 million or 4% of worldwide turnover.',
    tldr: [
      'Applies worldwide to the personal data of people in the EU.',
      'Qualifying breaches go to the regulator within 72 hours where feasible.',
      'Individual requests get an answer within one month, extendable by two.',
    ],
    body:
      'The GDPR took effect in 2018 and applies to organizations that process the personal data of individuals in the EU, regardless of where the organization is based. It is built on principles including lawfulness, purpose limitation, data minimization, accuracy, storage limitation, integrity, and accountability.\n\nThe regulation grants data subjects rights such as access, rectification, erasure, restriction, portability, and objection. Organizations must be able to respond to these requests within defined timeframes and to demonstrate compliance through documentation such as a Record of Processing Activities.\n\nKey operational obligations include maintaining a lawful basis for processing, conducting a Data Protection Impact Assessment for high-risk activities, reporting qualifying personal-data breaches within 72 hours, and applying appropriate technical and organizational security measures.',
    faqs: [
      {
        q: 'Does the GDPR apply to US companies?',
        a: 'Yes, when they offer goods or services to people in the EU or monitor their behavior there, even without an EU establishment.',
      },
      {
        q: 'What are the six lawful bases for processing?',
        a: 'Consent, contract, legal obligation, vital interests, public task and legitimate interests (Article 6).',
      },
    ],
    related: ['dpia', 'ropa', 'vendor-risk-management', 'continuous-compliance'],
    pillar: GDPR_GUIDE,
    lastReviewed: REVIEWED,
  },
  {
    slug: 'eu-ai-act',
    term: 'EU AI Act',
    inQuestion: 'the EU AI Act',
    shortDef:
      'The EU AI Act (Regulation (EU) 2024/1689) is the European Union’s law on artificial intelligence. It bans some practices outright, sets strict duties for high-risk systems, and requires transparency for chatbots and synthetic content. As amended in 2026, high-risk duties apply from 2 December 2027, or 2 August 2028 for AI in regulated products.',
    tldr: [
      'Four risk tiers: prohibited, high-risk, limited-risk and minimal-risk.',
      'Transparency duties have applied since 2 August 2026.',
      'High-risk duties apply from 2 December 2027 (Annex III) or 2 August 2028 (Annex I).',
    ],
    body:
      'The EU AI Act introduces a risk-based approach to regulating AI. It distinguishes between prohibited practices, high-risk systems, limited-risk systems with transparency duties, and minimal-risk systems. The obligations on a provider or deployer scale with the risk category.\n\nHigh-risk systems carry the most extensive requirements, including risk management, data governance, technical documentation, record-keeping, transparency, human oversight, and accuracy and robustness measures. Providers must also establish a quality management system and, in many cases, complete a conformity assessment before placing a system on the market.\n\nBecause the Act layers AI-specific duties on top of existing data-protection and security obligations, organizations often manage EU AI Act readiness alongside GDPR and security frameworks, mapping shared controls across all of them.\n\nAmendments adopted in 2026 (Regulation (EU) 2026/1744) moved most high-risk obligations to 2 December 2027 and 2 August 2028. See the [EU AI Act timeline after the Digital Omnibus](/blog/eu-ai-act-timeline-digital-omnibus) for every date.',
    faqs: [
      {
        q: 'What is a high-risk AI system?',
        a: 'An AI system used in an area listed in Annex III, such as hiring, education or credit scoring, or one that is a safety component of a product covered by the EU laws in Annex I.',
      },
      {
        q: 'What is the Digital Omnibus on AI?',
        a: 'Regulation (EU) 2026/1744, in force since 27 July 2026. It moved the high-risk dates, added two prohibited practices from 2 December 2026 and simplified several duties.',
      },
    ],
    related: ['ai-compliance', 'nist-ai-rmf', 'gdpr', 'control-mapping'],
    pillar: { path: '/eu-ai-act', label: 'EU AI Act compliance guide' },
    lastReviewed: REVIEWED,
  },
  {
    slug: 'hipaa',
    term: 'HIPAA',
    shortDef:
      'HIPAA is the US Health Insurance Portability and Accountability Act, which sets national standards for protecting health information. Its Privacy Rule limits how protected health information is used and shared, its Security Rule requires safeguards for electronic records, and its Breach Notification Rule sets reporting duties for covered entities and their business associates.',
    tldr: [
      'Covers covered entities and their business associates.',
      'A documented risk analysis is mandatory.',
      'There is no official HIPAA certification.',
    ],
    body:
      'HIPAA establishes national standards for safeguarding protected health information (PHI). Its Privacy Rule governs how PHI may be used and disclosed, while its Security Rule sets administrative, physical, and technical safeguards for electronic PHI.\n\nCovered entities — health plans, clearinghouses, and most healthcare providers — and the business associates that handle PHI on their behalf must implement these safeguards. Business associate agreements contractually extend HIPAA obligations down the supply chain.\n\nThe Breach Notification Rule requires notifying affected individuals, and in some cases regulators and the media, when unsecured PHI is breached. Demonstrating HIPAA compliance relies on documented policies, risk analyses, and evidence that safeguards operate continuously.',
    faqs: [
      {
        q: 'What is PHI?',
        a: 'Individually identifiable health information held or transmitted by a covered entity or business associate, in any form.',
      },
      {
        q: 'Is the HIPAA Security Rule changing?',
        a: 'A proposed update was published in January 2025 but is not yet final, so the current Security Rule still applies.',
      },
    ],
    related: ['gdpr', 'vendor-risk-management', 'evidence-collection', 'risk-register'],
    pillar: { path: '/hipaa', label: 'HIPAA compliance guide' },
    lastReviewed: REVIEWED,
  },
  {
    slug: 'nist-ai-rmf',
    term: 'NIST AI RMF',
    inQuestion: 'the NIST AI RMF',
    shortDef:
      'The NIST AI Risk Management Framework (AI RMF 1.0) is a voluntary US framework, published in January 2023, for managing the risks of AI systems. It organizes the work into four functions, Govern, Map, Measure and Manage, and defines seven characteristics of trustworthy AI. NIST is revising it as part of the White House AI Action Plan.',
    tldr: [
      'Voluntary, with no certification scheme.',
      'Four functions: Govern, Map, Measure and Manage.',
      'The Generative AI Profile is NIST AI 600-1.',
    ],
    body:
      'The NIST AI Risk Management Framework (AI RMF) was published by NIST in January 2023 (AI RMF 1.0) and is now being revised. It promotes trustworthy and responsible AI, and it is voluntary and adaptable across sectors and use cases.\n\nThe framework is organized around four core functions: GOVERN, which establishes a culture of risk management; MAP, which contextualizes risks; MEASURE, which analyzes and tracks them; and MANAGE, which prioritizes and acts on them. Together they form a continuous loop rather than a one-time assessment.\n\nThe AI RMF complements binding regulation such as the EU AI Act by providing concrete, characteristics-based guidance — for example around validity, reliability, safety, security, accountability, transparency, fairness, and privacy — that organizations can operationalize as controls.',
    faqs: [
      {
        q: 'Can you be certified to the NIST AI RMF?',
        a: 'No. It is a voluntary framework without a certification scheme; organizations use it to structure their AI risk program.',
      },
      {
        q: 'What is NIST AI 600-1?',
        a: 'The Generative AI Profile, released on 26 July 2024, which applies the AI RMF to risks specific to generative AI.',
      },
    ],
    related: ['ai-compliance', 'eu-ai-act', 'risk-register', 'grc'],
    pillar: { path: '/nist-ai-rmf', label: 'NIST AI RMF guide' },
    lastReviewed: REVIEWED,
  },
  {
    slug: 'grc',
    term: 'GRC',
    shortDef:
      'GRC stands for governance, risk and compliance: the combined practice of setting direction and accountability, managing risks to objectives, and proving adherence to laws, standards and internal policies. Running the three together, with one control library, risk register and evidence base, avoids the duplicated work of separate security, legal and audit processes.',
    tldr: [
      'Governance sets direction and ownership.',
      'Risk management ranks what matters.',
      'Compliance proves the controls work.',
    ],
    body:
      'Governance, Risk, and Compliance (GRC) describes the coordinated set of capabilities an organization uses to operate reliably, manage uncertainty, and act with integrity. Governance defines direction and accountability, risk management identifies and treats threats to objectives, and compliance ensures adherence to laws, regulations, and internal policies.\n\nTreating these disciplines together avoids the silos that arise when security, legal, and audit teams maintain separate, duplicated processes. A unified GRC program shares a common control library, risk register, and evidence base across frameworks.\n\nModern GRC platforms automate much of this work — continuously collecting evidence, mapping controls across frameworks, and surfacing risks — so teams can spend less time on manual coordination and more on decisions.',
    faqs: [
      {
        q: 'What is GRC software?',
        a: 'A platform that keeps policies, risks, controls and evidence in one system of record, so each framework reuses the same work.',
      },
      {
        q: 'Who uses GRC?',
        a: 'Security, compliance, risk, legal and internal audit teams, with executives relying on its reporting.',
      },
    ],
    related: ['risk-register', 'control-mapping', 'continuous-compliance', 'ai-compliance'],
    pillar: GRC_GUIDE,
    lastReviewed: REVIEWED,
  },
  {
    slug: 'dpia',
    term: 'DPIA',
    inQuestion: 'a DPIA',
    shortDef:
      'A Data Protection Impact Assessment (DPIA) is a structured review, required by Article 35 of the GDPR, that an organization completes before starting processing likely to pose a high risk to people’s rights. It describes the processing, tests necessity and proportionality, identifies risks, and records the measures that reduce them.',
    tldr: [
      'Required before processing that is likely to be high-risk.',
      'Consult the regulator if high risk remains after mitigation.',
      'Revisit it whenever the processing changes.',
    ],
    body:
      'A Data Protection Impact Assessment is required under the GDPR when processing is likely to result in a high risk to the rights and freedoms of individuals — for example, large-scale profiling, processing of special-category data, or systematic monitoring.\n\nA DPIA documents the nature, scope, context, and purposes of the processing; assesses its necessity and proportionality; identifies risks to individuals; and records the measures taken to mitigate those risks. If significant residual risk remains, the organization may need to consult its supervisory authority before proceeding.\n\nBeyond meeting a legal obligation, a DPIA is a practical design tool: conducting it early surfaces privacy risks while they are still inexpensive to address and creates an audit trail demonstrating accountability.',
    faqs: [
      {
        q: 'When is a DPIA required?',
        a: 'Before high-risk processing, for example large-scale profiling with significant effects, large-scale processing of special-category data, or systematic monitoring of publicly accessible areas.',
      },
      {
        q: 'Who signs off a DPIA?',
        a: 'The controller, which must seek the advice of its Data Protection Officer where it has one.',
      },
    ],
    related: ['gdpr', 'ropa', 'risk-register', 'continuous-compliance'],
    pillar: GDPR_GUIDE,
    lastReviewed: REVIEWED,
  },
  {
    slug: 'ropa',
    term: 'RoPA',
    inQuestion: 'a RoPA',
    shortDef:
      'A Record of Processing Activities (RoPA) is the inventory of personal-data processing that Article 30 of the GDPR requires most organizations to keep. For each activity it records the purpose, categories of people and data, recipients, international transfers, retention periods and security measures, and it must be shown to regulators on request.',
    tldr: [
      'Required by GDPR Article 30.',
      'Controllers and processors keep separate records.',
      'Keep it current as systems and vendors change.',
    ],
    body:
      'Under Article 30 of the GDPR, many organizations must maintain a Record of Processing Activities. The RoPA catalogues each processing activity along with its purpose, the categories of data subjects and personal data involved, recipients, international transfers, retention periods, and the security measures applied.\n\nThe RoPA serves as the foundational map of an organization\'s data flows. It supports other privacy obligations — responding to data-subject requests, scoping DPIAs, and assessing vendor risk — because it shows where personal data lives and how it moves.\n\nKeeping the RoPA current is an ongoing task. As products and integrations change, new processing activities must be added, which is why many teams maintain the RoPA in a tool that links it to the underlying systems and vendors.',
    faqs: [
      {
        q: 'Do small companies need a RoPA?',
        a: 'Often, yes. Article 30(5) exempts organizations with fewer than 250 employees only when their processing is occasional, unlikely to result in a risk, and excludes special-category and criminal-offence data, so regular processing such as payroll usually needs a record.',
      },
      {
        q: 'What format should a RoPA use?',
        a: 'Any written form, including electronic, that you can make available to the supervisory authority on request.',
      },
    ],
    related: ['gdpr', 'dpia', 'vendor-risk-management', 'evidence-collection'],
    pillar: GDPR_GUIDE,
    lastReviewed: REVIEWED,
  },
  {
    slug: 'evidence-collection',
    term: 'Evidence Collection',
    inQuestion: 'evidence collection',
    shortDef:
      'Evidence collection is gathering the records that prove compliance controls are designed well and operating as intended, such as access reviews, configuration exports, change tickets, scan results and policy acknowledgements. Auditors sample this evidence across the audit period. Automated collection pulls it from source systems on a schedule instead of relying on screenshots.',
    tldr: [
      'Evidence proves controls work.',
      'Auditors sample it across the audit period.',
      'Automation replaces manual screenshots.',
    ],
    body:
      'Compliance frameworks require organizations to demonstrate — not merely assert — that controls work. Evidence is the artifact that proves it: configuration screenshots, access reviews, log exports, policy acknowledgments, vulnerability-scan results, and similar records.\n\nManual evidence collection is time-consuming and error-prone, often involving repeated screenshots and spreadsheet tracking ahead of an audit. Automated evidence collection connects directly to source systems and gathers the relevant artifacts on a schedule, attaching them to the controls they support.\n\nContinuous, automated collection turns audit preparation from a periodic scramble into a steady-state activity. Because evidence is gathered as controls operate, gaps are visible immediately rather than discovered during the audit window.',
    faqs: [
      {
        q: 'What counts as good evidence?',
        a: 'Records that are timestamped, complete, taken from the source system and tied to a specific control.',
      },
      {
        q: 'How long should evidence be kept?',
        a: 'At least through the audit period, and longer where your retention policy or the framework requires it.',
      },
    ],
    related: ['continuous-compliance', 'audit-readiness', 'soc-2', 'control-mapping'],
    pillar: PLATFORM_GUIDE,
    lastReviewed: REVIEWED,
  },
  {
    slug: 'continuous-compliance',
    term: 'Continuous Compliance',
    inQuestion: 'continuous compliance',
    shortDef:
      'Continuous compliance is the practice of monitoring controls and collecting evidence all the time, not just before an audit, so an organization knows its compliance posture on any given day. Integrations watch source systems, alerts fire when a control drifts, and issues are fixed close to when they occur, which matters most for SOC 2 Type II.',
    tldr: [
      'Monitoring runs all the time, not just before audits.',
      'Drift is caught and fixed early.',
      'Audits review evidence that already exists.',
    ],
    body:
      'Traditional compliance often follows a cycle of intense preparation before an audit followed by a lapse in attention afterward. Continuous compliance replaces that cycle with always-on monitoring, so the organization\'s posture is known and maintained between audits.\n\nThis approach relies on automation: integrations watch source systems for control drift, evidence is collected as controls operate, and alerts fire when a control falls out of compliance. Issues are caught and remediated close to when they arise.\n\nContinuous compliance reduces audit-time effort, shortens the path to recertification, and lowers the risk of an undetected control failure persisting for months. It is especially valuable for frameworks that assess operation over a period, such as SOC 2 Type II.',
    faqs: [
      {
        q: 'Is continuous compliance required?',
        a: 'Not by name, but SOC 2 Type II and ISO 27001 surveillance audits test controls over time, which rewards it.',
      },
      {
        q: 'What does continuous compliance need?',
        a: 'Integrations with source systems, monitoring rules for each control, and a named owner who fixes drift.',
      },
    ],
    related: ['evidence-collection', 'audit-readiness', 'soc-2', 'grc'],
    pillar: PLATFORM_GUIDE,
    lastReviewed: REVIEWED,
  },
  {
    slug: 'risk-register',
    term: 'Risk Register',
    inQuestion: 'a risk register',
    shortDef:
      'A risk register is the central record of an organization’s identified risks. Each entry describes the risk, its likelihood and impact, the resulting rating, the owner, and the treatment decision: mitigate, transfer, accept or avoid. ISO 27001, the NIST AI RMF and most other frameworks expect one, kept current and linked to controls.',
    tldr: [
      'One entry per risk.',
      'Every risk has an owner and a treatment decision.',
      'Entries link to the controls that treat them.',
    ],
    body:
      'A risk register is the system of record for risk management. Each entry typically describes the risk, its likelihood and potential impact, the resulting risk rating, the owner responsible for it, and the treatment plan — whether to mitigate, transfer, accept, or avoid.\n\nMaintaining a risk register is a requirement or expectation across most compliance frameworks, including ISO 27001 and the NIST AI RMF. It provides the evidence trail showing that risks are identified, evaluated consistently, and actively managed.\n\nA living risk register feeds directly into control selection and prioritization: the highest-rated risks justify the controls and remediation work that follow. Linking risks to controls and evidence keeps the register connected to day-to-day operations rather than becoming a static document.',
    faqs: [
      {
        q: 'How often should a risk register be reviewed?',
        a: 'At least annually, and whenever systems, suppliers or threats change significantly.',
      },
      {
        q: 'How does a risk register differ from a risk assessment?',
        a: 'The assessment analyzes and rates risks; the register records the results and tracks each risk’s owner and treatment over time.',
      },
    ],
    related: ['grc', 'iso-27001', 'nist-ai-rmf', 'vendor-risk-management'],
    pillar: GRC_GUIDE,
    lastReviewed: REVIEWED,
  },
  {
    slug: 'vendor-risk-management',
    term: 'Vendor Risk Management',
    inQuestion: 'vendor risk management',
    shortDef:
      'Vendor risk management (VRM) is the process of identifying, assessing and monitoring the security, privacy and operational risks that suppliers and service providers bring. A typical program inventories vendors, tiers them by criticality and data access, reviews questionnaires and attestations such as SOC 2 reports, and tracks remediation and contract terms over time.',
    tldr: [
      'Inventory vendors and tier them by risk.',
      'Review their attestations and questionnaires.',
      'Monitor them for as long as the relationship lasts.',
    ],
    body:
      'Organizations increasingly depend on third parties for infrastructure, software, and services, and each vendor can introduce risk to data and operations. Vendor risk management is the discipline of evaluating and continuously monitoring those risks across the vendor lifecycle.\n\nA typical VRM program inventories vendors, tiers them by criticality and data access, assesses them through security questionnaires and review of their attestations, and tracks remediation of identified issues. Contractual safeguards such as data processing agreements formalize each vendor\'s obligations.\n\nVRM is reinforced by most compliance frameworks, which expect organizations to manage supply-chain risk. Automating questionnaire distribution, evidence collection, and ongoing monitoring keeps assessments current as the vendor portfolio changes.',
    faqs: [
      {
        q: 'Which vendors need a review?',
        a: 'Those with access to your data or systems, and those your operations depend on.',
      },
      {
        q: 'Which frameworks require vendor risk management?',
        a: 'SOC 2, ISO 27001 and DORA expect it, HIPAA requires business associate agreements, and the GDPR requires processor contracts.',
      },
    ],
    related: ['risk-register', 'gdpr', 'hipaa', 'continuous-compliance'],
    pillar: GRC_GUIDE,
    lastReviewed: REVIEWED,
  },
  {
    slug: 'audit-readiness',
    term: 'Audit Readiness',
    inQuestion: 'audit readiness',
    shortDef:
      'Audit readiness is the state of having controls implemented, evidence current and known gaps fixed, so an organization can start an audit at any time without a last-minute scramble. It results from continuous monitoring and automated evidence collection, and it also speeds up customer security reviews and recertification.',
    tldr: [
      'Controls are in place.',
      'Evidence is current.',
      'Known gaps are closed.',
    ],
    body:
      'Audit readiness means an organization can demonstrate, at any time, that its controls are designed appropriately and operating effectively. A ready organization has mapped its controls to the relevant framework, collected current evidence, and resolved known gaps before the auditor arrives.\n\nReadiness is the practical outcome of continuous compliance and automated evidence collection. When evidence accumulates as controls operate, the audit becomes a review of what already exists rather than a scramble to assemble it.\n\nBeyond passing a single audit, sustained readiness shortens recertification cycles, supports responses to customer security questionnaires, and gives leadership reliable visibility into compliance posture.',
    faqs: [
      {
        q: 'How do you measure audit readiness?',
        a: 'By the share of in-scope controls that have passing, current evidence and an owner.',
      },
      {
        q: 'Is being audit-ready the same as passing?',
        a: 'No. The auditor still tests the controls and forms an independent opinion.',
      },
    ],
    related: ['continuous-compliance', 'evidence-collection', 'soc-2', 'control-mapping'],
    pillar: SOC2_GUIDE,
    lastReviewed: REVIEWED,
  },
  {
    slug: 'control-mapping',
    term: 'Control Mapping',
    inQuestion: 'control mapping',
    shortDef:
      'Control mapping links each internal control to every framework requirement it satisfies, so one piece of evidence can support several frameworks at once. For example, an access-review control can satisfy SOC 2 CC6, ISO 27001 Annex A 5.15 to 5.18, and HIPAA’s access-control safeguard. Adding a framework then means covering only the gaps.',
    tldr: [
      'One control can meet many requirements.',
      'Evidence is collected once and reused.',
      'New frameworks only add the gaps.',
    ],
    body:
      'Compliance frameworks overlap substantially — many share controls for access management, encryption, change management, and monitoring. Control mapping makes that overlap explicit by relating each internal control to the requirements it satisfies across frameworks such as SOC 2, ISO 27001, GDPR, and the EU AI Act.\n\nWith a mapped control library, an organization implements and evidences a control once and reuses it everywhere it applies. This avoids duplicated effort and inconsistent answers across frameworks, and it makes adding a new framework largely a matter of identifying the incremental controls not already covered.\n\nCross-framework mapping is a core capability of modern compliance platforms. It turns a portfolio of separate audits into a unified program built on a shared control and evidence base.',
    faqs: [
      {
        q: 'Where do control mappings come from?',
        a: 'Official crosswalks, such as NIST’s informative references, combined with expert review of each requirement.',
      },
      {
        q: 'Can control mappings be wrong?',
        a: 'Yes. Review them whenever a framework publishes a new version or your controls change.',
      },
    ],
    related: ['soc-2', 'iso-27001', 'eu-ai-act', 'grc'],
    pillar: { path: '/frameworks', label: 'All 16 framework guides' },
    lastReviewed: REVIEWED,
  },
];

export const glossarySlugs = glossaryTerms.map((t) => t.slug);

export function getGlossaryTerm(slug: string): GlossaryTerm | undefined {
  return glossaryTerms.find((t) => t.slug === slug);
}

/** How the term reads inside "What is …?". */
export function termInQuestion(entry: GlossaryTerm): string {
  return entry.inQuestion ?? entry.term;
}

/** Most recent review date across the glossary. */
export function glossaryLastReviewed(): string {
  return glossaryTerms.reduce(
    (latest, entry) => (entry.lastReviewed > latest ? entry.lastReviewed : latest),
    glossaryTerms[0]?.lastReviewed ?? REVIEWED,
  );
}
