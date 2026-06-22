/**
 * Glossary of compliance, privacy, and AI-governance terms.
 *
 * Definitions are factual and vendor-neutral. The shortDef is a 1-2 sentence
 * quotable summary; body provides 2-4 paragraphs. `related` references other
 * glossary slugs for internal linking.
 */

export interface GlossaryTerm {
  slug: string;
  term: string;
  /** 1-2 sentence quotable definition. */
  shortDef: string;
  /** 2-4 paragraphs of explanation (plain strings or simple markdown). */
  body: string;
  /** Slugs of related glossary terms. */
  related: string[];
}

export const glossaryTerms: GlossaryTerm[] = [
  {
    slug: 'ai-compliance',
    term: 'AI Compliance',
    shortDef:
      'AI compliance is the practice of ensuring artificial-intelligence systems meet applicable legal, regulatory, and ethical requirements throughout their lifecycle.',
    body:
      'AI compliance covers the controls, documentation, and governance needed to demonstrate that an AI system is developed and operated responsibly. It spans risk classification, data governance, transparency, human oversight, and ongoing monitoring of model behavior.\n\nThe regulatory landscape for AI is expanding quickly. Frameworks such as the EU AI Act impose obligations based on a system\'s risk level, while voluntary frameworks like the NIST AI Risk Management Framework provide structured guidance for identifying and mitigating AI risks.\n\nIn practice, AI compliance combines traditional security and privacy controls with AI-specific requirements: documenting training data provenance, evaluating models for bias, maintaining audit trails of decisions, and ensuring meaningful human review of high-impact outcomes.',
    related: ['eu-ai-act', 'nist-ai-rmf', 'grc', 'continuous-compliance'],
  },
  {
    slug: 'soc-2',
    term: 'SOC 2',
    shortDef:
      'SOC 2 is an auditing standard that evaluates how a service organization manages customer data against five Trust Services Criteria: security, availability, processing integrity, confidentiality, and privacy.',
    body:
      'SOC 2 (System and Organization Controls 2) is defined by the AICPA and is one of the most requested attestations for SaaS and cloud companies. A SOC 2 report is produced by an independent auditor and describes the controls a service organization has in place to protect customer data.\n\nThere are two report types. A SOC 2 Type I report assesses control design at a single point in time, while a SOC 2 Type II report evaluates whether those controls operated effectively over a period, typically three to twelve months.\n\nAchieving SOC 2 readiness involves defining controls, collecting evidence that they operate as intended, and remediating gaps. Continuous evidence collection and control monitoring substantially reduce the manual effort of preparing for a Type II audit.',
    related: ['iso-27001', 'evidence-collection', 'continuous-compliance', 'audit-readiness'],
  },
  {
    slug: 'iso-27001',
    term: 'ISO 27001',
    shortDef:
      'ISO/IEC 27001 is the international standard for information security management systems (ISMS), specifying requirements for establishing, operating, and continually improving information security.',
    body:
      'ISO/IEC 27001 provides a risk-based framework for managing information security. Rather than prescribing a fixed checklist, it requires an organization to identify its information security risks and select controls to treat them, drawing on the reference controls in Annex A.\n\nCertification is granted by an accredited body following a two-stage audit and is maintained through periodic surveillance audits and a recertification cycle, typically every three years. Central to the standard is the Information Security Management System (ISMS) — the policies, procedures, and governance structure that operationalize security.\n\nMany organizations pursue ISO 27001 alongside SOC 2 because the two share substantial control overlap. Cross-framework control mapping lets a single piece of evidence satisfy requirements in both, reducing duplicate work.',
    related: ['soc-2', 'control-mapping', 'risk-register', 'audit-readiness'],
  },
  {
    slug: 'gdpr',
    term: 'GDPR',
    shortDef:
      'The General Data Protection Regulation (GDPR) is the European Union law governing the processing of personal data, granting individuals rights over their data and imposing accountability obligations on organizations.',
    body:
      'The GDPR took effect in 2018 and applies to organizations that process the personal data of individuals in the EU, regardless of where the organization is based. It is built on principles including lawfulness, purpose limitation, data minimization, accuracy, storage limitation, integrity, and accountability.\n\nThe regulation grants data subjects rights such as access, rectification, erasure, restriction, portability, and objection. Organizations must be able to respond to these requests within defined timeframes and to demonstrate compliance through documentation such as a Record of Processing Activities.\n\nKey operational obligations include maintaining a lawful basis for processing, conducting a Data Protection Impact Assessment for high-risk activities, reporting qualifying personal-data breaches within 72 hours, and applying appropriate technical and organizational security measures.',
    related: ['dpia', 'ropa', 'vendor-risk-management', 'continuous-compliance'],
  },
  {
    slug: 'eu-ai-act',
    term: 'EU AI Act',
    shortDef:
      'The EU AI Act is the European Union\'s regulation for artificial intelligence, applying tiered obligations to AI systems according to the level of risk they pose.',
    body:
      'The EU AI Act introduces a risk-based approach to regulating AI. It distinguishes between prohibited practices, high-risk systems, limited-risk systems with transparency duties, and minimal-risk systems. The obligations on a provider or deployer scale with the risk category.\n\nHigh-risk systems carry the most extensive requirements, including risk management, data governance, technical documentation, record-keeping, transparency, human oversight, and accuracy and robustness measures. Providers must also establish a quality management system and, in many cases, complete a conformity assessment before placing a system on the market.\n\nBecause the Act layers AI-specific duties on top of existing data-protection and security obligations, organizations often manage EU AI Act readiness alongside GDPR and security frameworks, mapping shared controls across all of them.',
    related: ['ai-compliance', 'nist-ai-rmf', 'gdpr', 'control-mapping'],
  },
  {
    slug: 'hipaa',
    term: 'HIPAA',
    shortDef:
      'The Health Insurance Portability and Accountability Act (HIPAA) is a US law that sets standards for protecting sensitive patient health information held by covered entities and their business associates.',
    body:
      'HIPAA establishes national standards for safeguarding protected health information (PHI). Its Privacy Rule governs how PHI may be used and disclosed, while its Security Rule sets administrative, physical, and technical safeguards for electronic PHI.\n\nCovered entities — health plans, clearinghouses, and most healthcare providers — and the business associates that handle PHI on their behalf must implement these safeguards. Business associate agreements contractually extend HIPAA obligations down the supply chain.\n\nThe Breach Notification Rule requires notifying affected individuals, and in some cases regulators and the media, when unsecured PHI is breached. Demonstrating HIPAA compliance relies on documented policies, risk analyses, and evidence that safeguards operate continuously.',
    related: ['gdpr', 'vendor-risk-management', 'evidence-collection', 'risk-register'],
  },
  {
    slug: 'nist-ai-rmf',
    term: 'NIST AI RMF',
    shortDef:
      'The NIST AI Risk Management Framework is a voluntary US framework that helps organizations identify, assess, and manage risks associated with AI systems.',
    body:
      'The NIST AI Risk Management Framework (AI RMF) was published by the US National Institute of Standards and Technology to promote trustworthy and responsible AI. It is voluntary and adaptable across sectors and use cases.\n\nThe framework is organized around four core functions: GOVERN, which establishes a culture of risk management; MAP, which contextualizes risks; MEASURE, which analyzes and tracks them; and MANAGE, which prioritizes and acts on them. Together they form a continuous loop rather than a one-time assessment.\n\nThe AI RMF complements binding regulation such as the EU AI Act by providing concrete, characteristics-based guidance — for example around validity, reliability, safety, security, accountability, transparency, fairness, and privacy — that organizations can operationalize as controls.',
    related: ['ai-compliance', 'eu-ai-act', 'risk-register', 'grc'],
  },
  {
    slug: 'grc',
    term: 'GRC',
    shortDef:
      'GRC stands for Governance, Risk, and Compliance — an integrated approach to aligning an organization\'s strategy, risk management, and adherence to regulations and standards.',
    body:
      'Governance, Risk, and Compliance (GRC) describes the coordinated set of capabilities an organization uses to operate reliably, manage uncertainty, and act with integrity. Governance defines direction and accountability, risk management identifies and treats threats to objectives, and compliance ensures adherence to laws, regulations, and internal policies.\n\nTreating these disciplines together avoids the silos that arise when security, legal, and audit teams maintain separate, duplicated processes. A unified GRC program shares a common control library, risk register, and evidence base across frameworks.\n\nModern GRC platforms automate much of this work — continuously collecting evidence, mapping controls across frameworks, and surfacing risks — so teams can spend less time on manual coordination and more on decisions.',
    related: ['risk-register', 'control-mapping', 'continuous-compliance', 'ai-compliance'],
  },
  {
    slug: 'dpia',
    term: 'DPIA',
    shortDef:
      'A Data Protection Impact Assessment (DPIA) is a structured process for identifying and minimizing the data-protection risks of a project or processing activity.',
    body:
      'A Data Protection Impact Assessment is required under the GDPR when processing is likely to result in a high risk to the rights and freedoms of individuals — for example, large-scale profiling, processing of special-category data, or systematic monitoring.\n\nA DPIA documents the nature, scope, context, and purposes of the processing; assesses its necessity and proportionality; identifies risks to individuals; and records the measures taken to mitigate those risks. If significant residual risk remains, the organization may need to consult its supervisory authority before proceeding.\n\nBeyond meeting a legal obligation, a DPIA is a practical design tool: conducting it early surfaces privacy risks while they are still inexpensive to address and creates an audit trail demonstrating accountability.',
    related: ['gdpr', 'ropa', 'risk-register', 'continuous-compliance'],
  },
  {
    slug: 'ropa',
    term: 'RoPA',
    shortDef:
      'A Record of Processing Activities (RoPA) is an inventory of how an organization processes personal data, maintained to demonstrate GDPR accountability.',
    body:
      'Under Article 30 of the GDPR, many organizations must maintain a Record of Processing Activities. The RoPA catalogues each processing activity along with its purpose, the categories of data subjects and personal data involved, recipients, international transfers, retention periods, and the security measures applied.\n\nThe RoPA serves as the foundational map of an organization\'s data flows. It supports other privacy obligations — responding to data-subject requests, scoping DPIAs, and assessing vendor risk — because it shows where personal data lives and how it moves.\n\nKeeping the RoPA current is an ongoing task. As products and integrations change, new processing activities must be added, which is why many teams maintain the RoPA in a tool that links it to the underlying systems and vendors.',
    related: ['gdpr', 'dpia', 'vendor-risk-management', 'evidence-collection'],
  },
  {
    slug: 'evidence-collection',
    term: 'Evidence Collection',
    shortDef:
      'Evidence collection is the process of gathering proof that compliance controls are designed and operating effectively, for use in audits and attestations.',
    body:
      'Compliance frameworks require organizations to demonstrate — not merely assert — that controls work. Evidence is the artifact that proves it: configuration screenshots, access reviews, log exports, policy acknowledgments, vulnerability-scan results, and similar records.\n\nManual evidence collection is time-consuming and error-prone, often involving repeated screenshots and spreadsheet tracking ahead of an audit. Automated evidence collection connects directly to source systems and gathers the relevant artifacts on a schedule, attaching them to the controls they support.\n\nContinuous, automated collection turns audit preparation from a periodic scramble into a steady-state activity. Because evidence is gathered as controls operate, gaps are visible immediately rather than discovered during the audit window.',
    related: ['continuous-compliance', 'audit-readiness', 'soc-2', 'control-mapping'],
  },
  {
    slug: 'continuous-compliance',
    term: 'Continuous Compliance',
    shortDef:
      'Continuous compliance is the practice of monitoring controls and collecting evidence on an ongoing basis, so an organization remains audit-ready at all times rather than only before an audit.',
    body:
      'Traditional compliance often follows a cycle of intense preparation before an audit followed by a lapse in attention afterward. Continuous compliance replaces that cycle with always-on monitoring, so the organization\'s posture is known and maintained between audits.\n\nThis approach relies on automation: integrations watch source systems for control drift, evidence is collected as controls operate, and alerts fire when a control falls out of compliance. Issues are caught and remediated close to when they arise.\n\nContinuous compliance reduces audit-time effort, shortens the path to recertification, and lowers the risk of an undetected control failure persisting for months. It is especially valuable for frameworks that assess operation over a period, such as SOC 2 Type II.',
    related: ['evidence-collection', 'audit-readiness', 'soc-2', 'grc'],
  },
  {
    slug: 'risk-register',
    term: 'Risk Register',
    shortDef:
      'A risk register is a centralized record of an organization\'s identified risks, capturing their likelihood, impact, ownership, and treatment status.',
    body:
      'A risk register is the system of record for risk management. Each entry typically describes the risk, its likelihood and potential impact, the resulting risk rating, the owner responsible for it, and the treatment plan — whether to mitigate, transfer, accept, or avoid.\n\nMaintaining a risk register is a requirement or expectation across most compliance frameworks, including ISO 27001 and the NIST AI RMF. It provides the evidence trail showing that risks are identified, evaluated consistently, and actively managed.\n\nA living risk register feeds directly into control selection and prioritization: the highest-rated risks justify the controls and remediation work that follow. Linking risks to controls and evidence keeps the register connected to day-to-day operations rather than becoming a static document.',
    related: ['grc', 'iso-27001', 'nist-ai-rmf', 'vendor-risk-management'],
  },
  {
    slug: 'vendor-risk-management',
    term: 'Vendor Risk Management',
    shortDef:
      'Vendor risk management (VRM) is the process of identifying, assessing, and monitoring the security and compliance risks introduced by third-party suppliers and service providers.',
    body:
      'Organizations increasingly depend on third parties for infrastructure, software, and services, and each vendor can introduce risk to data and operations. Vendor risk management is the discipline of evaluating and continuously monitoring those risks across the vendor lifecycle.\n\nA typical VRM program inventories vendors, tiers them by criticality and data access, assesses them through security questionnaires and review of their attestations, and tracks remediation of identified issues. Contractual safeguards such as data processing agreements formalize each vendor\'s obligations.\n\nVRM is reinforced by most compliance frameworks, which expect organizations to manage supply-chain risk. Automating questionnaire distribution, evidence collection, and ongoing monitoring keeps assessments current as the vendor portfolio changes.',
    related: ['risk-register', 'gdpr', 'hipaa', 'continuous-compliance'],
  },
  {
    slug: 'audit-readiness',
    term: 'Audit Readiness',
    shortDef:
      'Audit readiness is the state of having controls implemented and evidence organized so that an organization can enter a compliance audit with confidence and minimal last-minute work.',
    body:
      'Audit readiness means an organization can demonstrate, at any time, that its controls are designed appropriately and operating effectively. A ready organization has mapped its controls to the relevant framework, collected current evidence, and resolved known gaps before the auditor arrives.\n\nReadiness is the practical outcome of continuous compliance and automated evidence collection. When evidence accumulates as controls operate, the audit becomes a review of what already exists rather than a scramble to assemble it.\n\nBeyond passing a single audit, sustained readiness shortens recertification cycles, supports responses to customer security questionnaires, and gives leadership reliable visibility into compliance posture.',
    related: ['continuous-compliance', 'evidence-collection', 'soc-2', 'control-mapping'],
  },
  {
    slug: 'control-mapping',
    term: 'Control Mapping',
    shortDef:
      'Control mapping is the practice of linking a single control to the multiple framework requirements it satisfies, so that one piece of evidence can support several frameworks at once.',
    body:
      'Compliance frameworks overlap substantially — many share controls for access management, encryption, change management, and monitoring. Control mapping makes that overlap explicit by relating each internal control to the requirements it satisfies across frameworks such as SOC 2, ISO 27001, GDPR, and the EU AI Act.\n\nWith a mapped control library, an organization implements and evidences a control once and reuses it everywhere it applies. This avoids duplicated effort and inconsistent answers across frameworks, and it makes adding a new framework largely a matter of identifying the incremental controls not already covered.\n\nCross-framework mapping is a core capability of modern compliance platforms. It turns a portfolio of separate audits into a unified program built on a shared control and evidence base.',
    related: ['soc-2', 'iso-27001', 'eu-ai-act', 'grc'],
  },
];

export const glossarySlugs = glossaryTerms.map((t) => t.slug);

export function getGlossaryTerm(slug: string): GlossaryTerm | undefined {
  return glossaryTerms.find((t) => t.slug === slug);
}
