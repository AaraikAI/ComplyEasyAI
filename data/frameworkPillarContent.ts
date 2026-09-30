import type { SignalCategory } from '../components/marketing/signal';

/**
 * Content for the 16 marketing framework pillar pages ("Signal" redesign),
 * rendered by components/marketing/pages/SignalFrameworkPillar.tsx.
 *
 * Every pillar is written answer-first: the H1 names the query, `hook` is a
 * one-line summary, `definition` is the 40–60-word direct answer shown under
 * the H1, and `tldr` lists the key facts. Regulatory facts (dates, thresholds,
 * versions, fines) are checked against the primary sources listed in `sources`
 * on the `lastReviewed` date; the page shows both. AIUC-1 and India DPDPA are
 * also grounded in the backend catalogue (server/src/data/frameworks/
 * aiuc1Controls.ts and indiaDpdpaControls.ts).
 *
 * Adding a pillar: add its entry here, a components/marketing/pages/<Name>Pillar.tsx
 * wrapper, a route in App.tsx, and its path in scripts/publicRoutes.mjs (then
 * `npm run sitemap`). __tests__/data/frameworkPillarContent.test.ts guards the
 * wiring and the answer-first word limits.
 */

export interface PillarRequirement {
  num: string;
  name: string;
  desc: string;
}

export interface PillarFaq {
  q: string;
  a: string;
}

/** One dated milestone for a regulation that applies in phases. */
export interface PillarMilestone {
  /** ISO date (YYYY-MM-DD). */
  date: string;
  event: string;
}

/** A primary source the pillar's facts were checked against. */
export interface PillarSource {
  label: string;
  /** https URL. */
  url: string;
}

export interface FrameworkPillarContent {
  slug: string;
  /** Public route for this pillar page. */
  path: string;
  name: string;
  /** How the name reads mid-sentence, e.g. "the EU AI Act"; defaults to `name`. */
  nameInSentence?: string;
  category: SignalCategory;
  /** Second line of the H1: "{name} compliance, {tagline}". */
  tagline: string;
  /** One-line summary under the H1 (22 words or fewer). */
  hook: string;
  /** The direct answer shown under the hook (40–60 words). */
  definition: string;
  /** TL;DR bullets (3–4, each 20 words or fewer). */
  tldr: string[];
  requirements: PillarRequirement[];
  /** Dated milestones, for regulations that apply in phases. */
  timeline?: PillarMilestone[];
  faqs: PillarFaq[];
  /** Primary sources for the facts on the page. */
  sources: PillarSource[];
  /** ISO date (YYYY-MM-DD) the page was last checked against its sources. */
  lastReviewed: string;
}

/** Date of the last review of every pillar below. */
const REVIEWED = '2026-09-27';

/** Six shared "How it works" steps (identical across all pillars). */
export const PILLAR_HOW_IT_WORKS = [
  {
    num: '01',
    title: 'Scope',
    body: 'Define the systems, boundaries and requirements your program will cover.',
  },
  {
    num: '02',
    title: 'Connect your stack',
    body: 'Link cloud, identity, code and ticketing systems, read-only for evidence collection; controls are discovered and mapped.',
  },
  {
    num: '03',
    title: 'Collect evidence',
    body: 'AI agents gather configuration and activity evidence on a schedule, building a versioned trail.',
  },
  {
    num: '04',
    title: 'Monitor & remediate',
    body: 'Continuous monitoring flags drift the moment it happens and routes it to an owner.',
  },
  {
    num: '05',
    title: 'Track effectiveness',
    body: 'Operating effectiveness is recorded over time, ready for your observation window.',
  },
  {
    num: '06',
    title: 'Report & hand off',
    body: 'Organized, current evidence is packaged for auditors and stakeholders.',
  },
];

/** Six shared "How ComplyEasyAI helps" capability cards. */
export const PILLAR_CAPABILITIES = [
  {
    title: 'Control mapping',
    desc: 'Your environment is mapped to each requirement, so you see exactly which control satisfies what.',
  },
  {
    title: 'Automated evidence',
    desc: 'Integrations build a versioned, timestamped evidence trail instead of manual screenshots.',
  },
  {
    title: 'Continuous monitoring',
    desc: 'Drift surfaces as soon as it happens, not during fieldwork.',
  },
  {
    title: 'Readiness dashboards',
    desc: 'Real-time views highlight failing or unmapped controls with owners attached.',
  },
  {
    title: 'Multi-framework reuse',
    desc: 'Shared controls are mapped once and reused across every framework you run.',
  },
  {
    title: 'Audit-ready reporting',
    desc: 'Export organized, current evidence packages on demand.',
  },
];

export const FRAMEWORK_PILLARS: Record<string, FrameworkPillarContent> = {
  'soc-2': {
    slug: 'soc-2',
    path: '/soc2-compliance',
    name: 'SOC 2',
    category: 'Security',
    tagline: 'audit-ready faster',
    hook: 'Map the Trust Services Criteria once, collect evidence continuously, and hand your auditor a clean trail.',
    definition:
      'SOC 2 is an AICPA attestation in which an independent CPA firm tests your controls against the Trust Services Criteria: security, plus availability, processing integrity, confidentiality and privacy if you choose them. A Type I report covers control design on one date; a Type II report tests operation over a period. ComplyEasyAI automates evidence collection for both.',
    tldr: [
      'Security is always in scope; the other four criteria are optional.',
      'Type I checks design on one date; Type II checks operation over a period, often 3–12 months.',
      'Only an independent CPA firm can issue a SOC 2 report.',
      'SOC 2 and ISO 27001 share many controls, so evidence carries across.',
    ],
    requirements: [
      {
        num: '01',
        name: 'Security',
        desc: 'The mandatory common criteria: protecting systems and data against unauthorized access.',
      },
      {
        num: '02',
        name: 'Availability',
        desc: 'Systems are available for operation and use as committed, with monitoring and recovery.',
      },
      {
        num: '03',
        name: 'Processing Integrity',
        desc: 'Processing is complete, valid, accurate, timely and authorized.',
      },
      {
        num: '04',
        name: 'Confidentiality',
        desc: 'Information designated confidential is protected throughout its lifecycle.',
      },
      {
        num: '05',
        name: 'Privacy',
        desc: 'Personal information is handled in line with your notice and criteria.',
      },
    ],
    faqs: [
      {
        q: 'What is the difference between SOC 2 Type I and Type II?',
        a: 'Type I assesses whether controls are suitably designed on a specific date. Type II tests whether they operated effectively over a period, commonly three to twelve months, and it is the report most enterprise buyers ask for.',
      },
      {
        q: 'How long does SOC 2 take?',
        a: 'Readiness can take a few weeks with automated evidence. A Type II report still needs an observation window, often three months at minimum, that no tool can shorten, because the auditor must see controls operate over time.',
      },
      {
        q: 'Which Trust Services Criteria should we include?',
        a: 'Security is always included. Add availability if customers rely on uptime commitments, confidentiality for contractually confidential data, processing integrity for transaction processing, and privacy if you handle personal information for customers.',
      },
      {
        q: 'Do you replace my auditor?',
        a: 'No. SOC 2 reports must be issued by an independent CPA firm. ComplyEasyAI prepares you, so fieldwork examines a clean, well-documented control environment.',
      },
      {
        q: 'Can I pursue SOC 2 with ISO 27001?',
        a: 'Yes. The two share many controls, which are mapped once and reused, so evidence carries across both.',
      },
    ],
    sources: [
      {
        label: 'AICPA, 2017 Trust Services Criteria (revised points of focus, 2022)',
        url: 'https://www.aicpa-cima.com/resources/download/2017-trust-services-criteria-with-revised-points-of-focus-2022',
      },
    ],
    lastReviewed: REVIEWED,
  },
  'iso-27001': {
    slug: 'iso-27001',
    path: '/iso-27001',
    name: 'ISO 27001',
    category: 'Security',
    tagline: 'certify your ISMS with less effort',
    hook: 'Scope the ISMS, choose your Annex A controls, and keep evidence current between surveillance audits.',
    definition:
      'ISO/IEC 27001:2022 is the international standard for an information security management system (ISMS). Certification needs a risk-based ISMS, a Statement of Applicability covering the 93 Annex A controls, internal audits and management review, verified by an accredited certification body in a two-stage audit. ComplyEasyAI maps your environment to each clause and control.',
    tldr: [
      'Current edition: ISO/IEC 27001:2022, with Amendment 1:2024 on climate change.',
      'Annex A has 93 controls in four themes: organizational, people, physical and technological.',
      'Certificates last three years, with surveillance audits in between.',
      'The transition from the 2013 edition ended on 31 October 2025.',
    ],
    requirements: [
      {
        num: '01',
        name: 'ISMS scope & context',
        desc: 'Define the boundaries, interested parties and objectives of your management system.',
      },
      {
        num: '02',
        name: 'Risk assessment & treatment',
        desc: 'Identify, analyze and treat information-security risks systematically.',
      },
      {
        num: '03',
        name: 'Statement of Applicability',
        desc: 'Document which Annex A controls apply and justify any exclusions.',
      },
      {
        num: '04',
        name: 'Annex A controls',
        desc: 'Implement the selected controls from the 93 in the 2022 revision.',
      },
      {
        num: '05',
        name: 'Management review & audit',
        desc: 'Run internal audits and management reviews to drive continual improvement.',
      },
    ],
    faqs: [
      {
        q: 'Is ISO 27001 a certification?',
        a: 'Yes. Unlike SOC 2, ISO 27001 results in a certificate issued by an accredited certification body after a two-stage audit of your ISMS.',
      },
      {
        q: 'What changed in the 2022 revision?',
        a: 'Annex A went from 114 controls in 14 domains to 93 controls in four themes, including 11 new controls such as threat intelligence, information security for cloud services and data leakage prevention. Amendment 1:2024 added climate-change considerations to the context clauses.',
      },
      {
        q: 'Is a certificate to the 2013 edition still valid?',
        a: 'No. The transition period ended on 31 October 2025, so organizations now need a certificate to ISO/IEC 27001:2022.',
      },
      {
        q: 'How does it relate to SOC 2?',
        a: 'The two overlap heavily. A shared control library means work done for one accelerates the other.',
      },
      {
        q: 'How long does certification take?',
        a: 'It depends on maturity. You need an operating ISMS, with internal audit and management review completed, before the Stage 2 audit. Automating evidence and the Statement of Applicability removes much of the preparation.',
      },
    ],
    sources: [{ label: 'ISO, ISO/IEC 27001:2022', url: 'https://www.iso.org/standard/27001' }],
    lastReviewed: REVIEWED,
  },
  'nist-csf': {
    slug: 'nist-csf',
    path: '/nist-csf',
    name: 'NIST CSF',
    nameInSentence: 'the NIST CSF',
    category: 'Security',
    tagline: 'measured against CSF 2.0',
    hook: 'Profile where you are across all six CSF 2.0 functions, then track progress continuously.',
    definition:
      'The NIST Cybersecurity Framework (CSF) 2.0, published in February 2024, is a voluntary framework that organizes cybersecurity outcomes into six functions: Govern, Identify, Protect, Detect, Respond and Recover, with 22 categories and 106 subcategories. Organizations use it to profile current and target posture. ComplyEasyAI maps your controls to CSF outcomes and tracks maturity continuously.',
    tldr: [
      'Current version: CSF 2.0 (February 2024), which replaced CSF 1.1.',
      'Six functions, 22 categories and 106 subcategories.',
      'Voluntary, but often expected by contracts and security questionnaires.',
      'NIST publishes informative references that map CSF outcomes to other standards.',
    ],
    requirements: [
      {
        num: '01',
        name: 'Govern',
        desc: 'Establish and monitor the cybersecurity risk-management strategy, expectations and policy.',
      },
      {
        num: '02',
        name: 'Identify',
        desc: 'Understand assets, risks and the business context that shape your program.',
      },
      {
        num: '03',
        name: 'Protect',
        desc: 'Use safeguards to manage cybersecurity risk to assets and services.',
      },
      {
        num: '04',
        name: 'Detect',
        desc: 'Find and analyze possible cybersecurity attacks and compromises promptly.',
      },
      {
        num: '05',
        name: 'Respond',
        desc: 'Act on detected incidents: analysis, communication and mitigation.',
      },
      {
        num: '06',
        name: 'Recover',
        desc: 'Restore assets and operations affected by an incident.',
      },
    ],
    faqs: [
      {
        q: 'Is NIST CSF mandatory?',
        a: 'No. It is voluntary, although many contracts and security questionnaires expect alignment with it.',
      },
      {
        q: 'What is new in CSF 2.0?',
        a: 'CSF 2.0 added a sixth function, Govern, which covers strategy, roles, policy and supply-chain risk. It also widened the intended audience from critical infrastructure to all organizations, and added implementation examples and quick-start guides.',
      },
      {
        q: 'Does it map to other frameworks?',
        a: 'Yes. NIST publishes informative references to ISO 27001, SP 800-53 and others, so aligned controls support several standards.',
      },
      {
        q: 'How do you help?',
        a: 'ComplyEasyAI maps your environment to CSF outcomes and tracks maturity continuously, instead of through periodic spreadsheets.',
      },
    ],
    sources: [
      { label: 'NIST, Cybersecurity Framework', url: 'https://www.nist.gov/cyberframework' },
      {
        label: 'NIST CSWP 29, The NIST Cybersecurity Framework (CSF) 2.0',
        url: 'https://doi.org/10.6028/NIST.CSWP.29',
      },
    ],
    lastReviewed: REVIEWED,
  },
  'pci-dss': {
    slug: 'pci-dss',
    path: '/pci-dss',
    name: 'PCI DSS',
    category: 'Security',
    tagline: 'protect cardholder data continuously',
    hook: 'Scope the cardholder data environment, map the 12 requirements, and catch drift before your assessor does.',
    definition:
      "PCI DSS v4.0.1 is the payment card industry's security standard for any organization that stores, processes or transmits cardholder data. It sets 12 requirements under six goals, validated by a Report on Compliance or a self-assessment questionnaire. The future-dated v4.0 requirements have applied since 31 March 2025. ComplyEasyAI monitors in-scope systems continuously.",
    tldr: [
      'Current version: v4.0.1 (June 2024). v4.0 was retired on 31 December 2024.',
      'The future-dated requirements have applied since 31 March 2025.',
      'Validation is by a Report on Compliance or a self-assessment questionnaire.',
      'Tokenization and hosted payment pages shrink what must be assessed.',
    ],
    requirements: [
      {
        num: '01',
        name: 'Secure networks',
        desc: 'Install and maintain network security controls and secure configurations.',
      },
      {
        num: '02',
        name: 'Protect account data',
        desc: 'Protect stored account data and encrypt cardholder data in transit across open networks.',
      },
      {
        num: '03',
        name: 'Vulnerability management',
        desc: 'Protect systems against malware and develop secure systems and software.',
      },
      {
        num: '04',
        name: 'Access control',
        desc: 'Restrict access to data by business need to know and authenticate access.',
      },
      {
        num: '05',
        name: 'Monitor & test',
        desc: 'Log and monitor all access, and test security systems regularly.',
      },
      {
        num: '06',
        name: 'Security policy',
        desc: 'Support information security with organizational policies and programs.',
      },
    ],
    faqs: [
      {
        q: 'Which SAQ or level applies to me?',
        a: 'Your merchant or service-provider level comes from annual card transaction volume, as set by the card brands. Your SAQ type comes from how you accept payments; for example, fully outsourced e-commerce may qualify for SAQ A. The platform documents your scope and validation path.',
      },
      {
        q: 'What changed in PCI DSS v4.0 and v4.0.1?',
        a: 'v4.0 added the customized approach, multi-factor authentication for all access into the cardholder data environment, targeted risk analyses and payment-page script controls. v4.0.1 (June 2024) clarified wording and added no new requirements.',
      },
      {
        q: 'Does tokenization reduce scope?',
        a: 'Yes. Reducing where card data lives shrinks the environment that must be assessed.',
      },
      {
        q: 'How do you help?',
        a: 'Continuous monitoring surfaces drift in the in-scope environment before your assessor does.',
      },
    ],
    sources: [
      {
        label: 'PCI SSC, Just published: PCI DSS v4.0.1',
        url: 'https://blog.pcisecuritystandards.org/just-published-pci-dss-v4-0-1',
      },
      {
        label: 'PCI SSC, Document Library',
        url: 'https://www.pcisecuritystandards.org/document_library/',
      },
    ],
    lastReviewed: REVIEWED,
  },
  gdpr: {
    slug: 'gdpr',
    path: '/gdpr',
    name: 'GDPR',
    category: 'Privacy',
    tagline: 'from RoPA to breach response',
    hook: 'Keep your records of processing, DPIAs and data-subject requests current as your product changes.',
    definition:
      'The General Data Protection Regulation (GDPR) has governed the personal data of people in the EU since 25 May 2018, wherever the processing company is based. It requires a lawful basis for each processing activity, records of processing, DPIAs for high-risk processing, answers to data-subject requests within one month and breach notice within 72 hours.',
    tldr: [
      "Applies to any organization processing EU residents' personal data, wherever it is based.",
      'Fines reach €20 million or 4% of worldwide annual turnover, whichever is higher.',
      'Report qualifying breaches to the supervisory authority within 72 hours.',
      'Answer data-subject requests within one month, extendable by two months.',
    ],
    requirements: [
      {
        num: '01',
        name: 'Lawful basis & consent',
        desc: 'Establish and record a valid lawful basis for every processing activity.',
      },
      {
        num: '02',
        name: 'Data-subject rights',
        desc: 'Enable access, rectification, erasure, portability and objection requests.',
      },
      {
        num: '03',
        name: 'Records of processing',
        desc: 'Maintain a RoPA describing what you process and why.',
      },
      {
        num: '04',
        name: 'DPIAs',
        desc: 'Assess high-risk processing before it begins.',
      },
      {
        num: '05',
        name: 'Breach notification',
        desc: 'Report qualifying breaches to authorities within 72 hours.',
      },
    ],
    faqs: [
      {
        q: 'Does GDPR apply to non-EU companies?',
        a: 'Yes. It applies to any organization offering goods or services to, or monitoring the behavior of, people in the EU, regardless of where the company is based.',
      },
      {
        q: 'What is a DPIA?',
        a: 'A Data Protection Impact Assessment evaluates and mitigates privacy risk before high-risk processing begins (Article 35).',
      },
      {
        q: 'Do we need a Data Protection Officer?',
        a: 'Yes if you are a public authority, or if your core activities involve large-scale, regular and systematic monitoring of individuals or large-scale processing of special-category data (Article 37).',
      },
      {
        q: 'What are the fines?',
        a: 'Up to €20 million or 4% of worldwide annual turnover, whichever is higher, for the most serious infringements.',
      },
      {
        q: 'How do you help?',
        a: 'The platform maintains your RoPA, tracks data-subject requests and structures DPIAs so your obligations stay current.',
      },
    ],
    sources: [
      {
        label: 'EUR-Lex, Regulation (EU) 2016/679 (GDPR)',
        url: 'https://eur-lex.europa.eu/eli/reg/2016/679/oj',
      },
    ],
    lastReviewed: REVIEWED,
  },
  hipaa: {
    slug: 'hipaa',
    path: '/hipaa',
    name: 'HIPAA',
    category: 'Privacy',
    tagline: 'safeguard PHI with confidence',
    hook: 'Map the Security, Privacy and Breach Notification Rules to your systems and keep the risk analysis current.',
    definition:
      "HIPAA is the US law that protects health information. Covered entities and their business associates must follow the Privacy Rule, the Security Rule's administrative, physical and technical safeguards for electronic PHI, and the Breach Notification Rule. There is no official HIPAA certification; compliance rests on documented safeguards. ComplyEasyAI maps and evidences each safeguard.",
    tldr: [
      'Applies to health plans, clearinghouses, most providers and their business associates.',
      'The Security Rule requires an accurate, regularly updated risk analysis.',
      'Notify affected individuals without unreasonable delay, and within 60 days of discovering a breach.',
      'A proposed Security Rule update from January 2025 is not final.',
    ],
    requirements: [
      {
        num: '01',
        name: 'Administrative safeguards',
        desc: 'Policies, risk analysis and workforce training that govern PHI.',
      },
      {
        num: '02',
        name: 'Physical safeguards',
        desc: 'Facility access, device and media controls protecting PHI.',
      },
      {
        num: '03',
        name: 'Technical safeguards',
        desc: 'Access control, audit controls, integrity and transmission security.',
      },
      {
        num: '04',
        name: 'Privacy Rule',
        desc: 'Limits on the use and disclosure of PHI.',
      },
      {
        num: '05',
        name: 'Breach Notification',
        desc: 'Defined notification duties when unsecured PHI is breached.',
      },
    ],
    faqs: [
      {
        q: 'Who must comply with HIPAA?',
        a: 'Covered entities (health plans, health care clearinghouses and health care providers that conduct standard electronic transactions) and the business associates that handle PHI for them.',
      },
      {
        q: 'What is a BAA?',
        a: 'A Business Associate Agreement contractually binds vendors that handle PHI on your behalf to HIPAA safeguards.',
      },
      {
        q: 'Is there a HIPAA certification?',
        a: 'No official certification exists. Compliance is shown through implemented safeguards, risk analysis and documentation.',
      },
      {
        q: 'Is the HIPAA Security Rule changing?',
        a: 'HHS proposed major updates on 6 January 2025, including removing the distinction between required and addressable specifications and requiring asset inventories, multi-factor authentication and encryption. When this page was last reviewed the proposal was not final, so the current rule still applies.',
      },
      {
        q: 'How do you help?',
        a: 'The platform maps safeguards to your systems, tracks BAAs, and keeps evidence and the risk analysis current.',
      },
    ],
    sources: [
      {
        label: 'eCFR, 45 CFR Part 164',
        url: 'https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-C/part-164',
      },
      {
        label: 'Federal Register, HIPAA Security Rule proposed rule (6 January 2025)',
        url: 'https://www.federalregister.gov/documents/2025/01/06/2024-30983/hipaa-security-rule-to-strengthen-the-cybersecurity-of-electronic-protected-health-information',
      },
      {
        label: 'HHS, HIPAA for professionals',
        url: 'https://www.hhs.gov/hipaa/for-professionals/index.html',
      },
    ],
    lastReviewed: REVIEWED,
  },
  ccpa: {
    slug: 'ccpa',
    path: '/ccpa',
    name: 'CCPA',
    category: 'Privacy',
    tagline: 'honor consumer privacy rights',
    hook: 'Route consumer requests, keep notices accurate, and prepare for the new automated-decision, risk-assessment and audit rules.',
    definition:
      'The California Consumer Privacy Act, as amended by the CPRA, gives California residents rights to know, delete, correct and opt out of the sale or sharing of their personal information. It applies to for-profit businesses above revenue or data-volume thresholds. New CPPA rules on automated decisions, risk assessments and cybersecurity audits took effect on 1 January 2026.',
    tldr: [
      'Rights: know, delete, correct, opt out of sale or sharing, and limit sensitive-data use.',
      'New CPPA regulations took effect on 1 January 2026.',
      'Automated decision-making (ADMT) duties apply from 1 January 2027.',
      'Risk-assessment attestations and the first cybersecurity audits are due from 1 April 2028.',
    ],
    requirements: [
      {
        num: '01',
        name: 'Right to know & access',
        desc: 'Disclose what personal information you collect and how it is used.',
      },
      {
        num: '02',
        name: 'Right to delete',
        desc: 'Delete personal information on verified request, with exceptions.',
      },
      {
        num: '03',
        name: 'Right to opt out',
        desc: 'Let consumers opt out of the sale or sharing of their information.',
      },
      {
        num: '04',
        name: 'Right to correct',
        desc: 'Correct inaccurate personal information on request.',
      },
      {
        num: '05',
        name: 'Sensitive PI limits',
        desc: 'Honor limits on the use of sensitive personal information.',
      },
    ],
    timeline: [
      {
        date: '2026-01-01',
        event: 'CPPA regulations on risk assessments, cybersecurity audits and automated decision-making take effect.',
      },
      {
        date: '2027-01-01',
        event: 'Businesses using automated decision-making technology for significant decisions must comply with the ADMT rules.',
      },
      {
        date: '2028-04-01',
        event: 'Risk-assessment attestations and summaries are due; first cybersecurity audits for businesses with revenue over $100 million.',
      },
      {
        date: '2029-04-01',
        event: 'Cybersecurity audits due for businesses with revenue of $50–100 million.',
      },
      {
        date: '2030-04-01',
        event: 'Cybersecurity audits due for businesses with revenue under $50 million.',
      },
    ],
    faqs: [
      {
        q: 'Does CCPA apply to my business?',
        a: 'It applies to for-profit businesses doing business in California that exceed the inflation-adjusted annual revenue threshold, buy, sell or share the personal information of 100,000 or more consumers or households, or earn half their annual revenue from selling or sharing it.',
      },
      {
        q: 'What did CPRA add?',
        a: 'CPRA added the right to correct, protections for sensitive personal information and a dedicated enforcement agency, the California Privacy Protection Agency (CPPA).',
      },
      {
        q: 'What changed in 2026?',
        a: 'CPPA regulations effective 1 January 2026 require risk assessments for high-risk processing and phased cybersecurity audits, the first due 1 April 2028. From 1 January 2027 they also add notice, opt-out and access rights for automated decision-making used in significant decisions.',
      },
      {
        q: 'How does it relate to GDPR?',
        a: 'They share concepts like access and deletion, so much of the operational work overlaps.',
      },
      {
        q: 'How do you help?',
        a: 'The platform routes and tracks consumer requests and keeps privacy notices aligned with what you actually collect.',
      },
    ],
    sources: [
      {
        label: 'CPPA, regulations approved (23 September 2025)',
        url: 'https://cppa.ca.gov/announcements/2025/20250923.html',
      },
      { label: 'CPPA, CCPA updates', url: 'https://cppa.ca.gov/regulations/ccpa_updates.html' },
    ],
    lastReviewed: REVIEWED,
  },
  'india-dpdpa': {
    slug: 'india-dpdpa',
    path: '/india-dpdpa',
    name: 'India DPDPA',
    nameInSentence: "India's DPDP Act",
    category: 'Privacy',
    tagline: 'ready for 13 May 2027',
    hook: 'The DPDP Rules, 2025 give Data Fiduciaries until 13 May 2027 for most obligations. Start mapping now.',
    definition:
      "India's Digital Personal Data Protection Act, 2023 and the DPDP Rules, 2025 govern digital personal data processed in India, or processed abroad to offer goods and services there. The Rules were published on 13 November 2025 and phase in: Consent Managers from 13 November 2026, and most Data Fiduciary duties from 13 May 2027.",
    tldr: [
      'Covers processing in India, and processing abroad that offers goods or services in India.',
      'Most obligations apply from 13 May 2027, eighteen months after the Rules were published.',
      'Breaches go to the Data Protection Board within 72 hours of becoming aware.',
      'Penalties reach INR 250 crore for failing to protect personal data.',
    ],
    requirements: [
      {
        num: '01',
        name: 'Scope & roles',
        desc: 'Confirm applicability (s.3), classify each activity as Data Fiduciary or Data Processor, and track the factors behind Significant Data Fiduciary designation (s.10).',
      },
      {
        num: '02',
        name: 'Notice & consent',
        desc: 'Free, specific, informed and unambiguous consent, preceded by a standalone plain-language notice and withdrawable as easily as it was given (ss.5–7).',
      },
      {
        num: '03',
        name: 'Data Fiduciary duties',
        desc: 'Reasonable security safeguards, accuracy, processor contracts, erasure once the purpose is served and grievance redressal (s.8, Rule 6).',
      },
      {
        num: '04',
        name: 'Breach notification',
        desc: 'Intimate affected Data Principals without delay and the Data Protection Board within 72 hours of becoming aware of a breach (s.8(6), Rule 7).',
      },
      {
        num: '05',
        name: 'Children & Significant Data Fiduciaries',
        desc: 'Verifiable parental consent and no tracking or targeted ads at children (s.9); an India-based DPO, independent audits and DPIAs for SDFs (s.10).',
      },
      {
        num: '06',
        name: 'Data Principal rights & transfers',
        desc: 'Access, correction, erasure, nomination and grievance rights (ss.11–14), and transfers only to territories the government has not restricted (s.16).',
      },
    ],
    timeline: [
      {
        date: '2023-08-11',
        event: 'The Digital Personal Data Protection Act, 2023 is enacted.',
      },
      {
        date: '2025-11-13',
        event: 'DPDP Rules, 2025 published; the Data Protection Board provisions (Rules 1, 2 and 17–21) apply immediately.',
      },
      {
        date: '2026-11-13',
        event: 'Consent Manager registration and obligations apply (Rule 4).',
      },
      {
        date: '2027-05-13',
        event: "Remaining Rules apply: notice, security safeguards, breach intimation, erasure, children's data, Significant Data Fiduciary duties and Data Principal rights.",
      },
    ],
    faqs: [
      {
        q: 'When does the DPDP Act take effect?',
        a: 'In phases. The Data Protection Board provisions took effect when the Rules were published on 13 November 2025, Consent Manager rules apply from 13 November 2026, and the remaining obligations, including notice, security safeguards, breach intimation and Data Principal rights, apply from 13 May 2027. Check MeitY for any later amendment to these dates.',
      },
      {
        q: 'Does the DPDP Act apply to companies outside India?',
        a: 'Yes. It covers processing outside India that is connected with offering goods or services to Data Principals in India (s.3), so businesses serving Indian users are in scope wherever they are based.',
      },
      {
        q: 'How does it differ from GDPR?',
        a: "Both rest on lawful grounds, notice, individual rights and breach notification, so much of the operational work overlaps. The DPDP Act is consent-centric with a short list of 'certain legitimate uses' (s.7) rather than a legitimate-interest ground, and it bans tracking and targeted advertising directed at children outright.",
      },
      {
        q: 'What is a Significant Data Fiduciary?',
        a: 'A Data Fiduciary the Central Government notifies based on the volume and sensitivity of data processed, risk to Data Principals and similar factors (s.10). SDFs must appoint an India-based Data Protection Officer and an independent data auditor and run a DPIA at least every twelve months.',
      },
      {
        q: 'How do you help?',
        a: "The platform maps your processing to 44 controls citing the Act's sections and the 2025 Rules, tracks consent records, rights requests and breach timelines, and keeps the evidence continuously current.",
      },
    ],
    sources: [
      {
        label: 'PIB, Government notifies DPDP Rules (14 November 2025)',
        url: 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2190014',
      },
      {
        label: 'MeitY, Digital Personal Data Protection Rules, 2025',
        url: 'https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa',
      },
    ],
    lastReviewed: REVIEWED,
  },
  'eu-ai-act': {
    slug: 'eu-ai-act',
    path: '/eu-ai-act',
    name: 'EU AI Act',
    nameInSentence: 'the EU AI Act',
    category: 'AI Governance',
    tagline: 'on the 2027–2028 timeline',
    hook: 'The 2026 Digital Omnibus moved the high-risk deadlines: Annex III to 2 December 2027, Annex I to 2 August 2028.',
    definition:
      'The EU AI Act (Regulation (EU) 2024/1689) regulates AI by risk tier: prohibited, high-risk, limited-risk and minimal-risk. Prohibitions have applied since February 2025 and general-purpose AI duties since August 2025. After the 2026 Digital Omnibus, stand-alone high-risk systems must comply by 2 December 2027 and product-embedded ones by 2 August 2028.',
    tldr: [
      'The Digital Omnibus on AI, Regulation (EU) 2026/1744, amended the Act from 27 July 2026.',
      'High-risk duties apply from 2 December 2027 (Annex III) and 2 August 2028 (Annex I).',
      'Transparency duties apply from August 2026.',
      'Fines reach €35 million or 7% of worldwide annual turnover for prohibited practices.',
    ],
    requirements: [
      {
        num: '01',
        name: 'Risk classification',
        desc: 'Determine the risk tier of each AI system you build or deploy, and your role for it.',
      },
      {
        num: '02',
        name: 'Prohibited practices',
        desc: 'Avoid the uses banned outright under the Act.',
      },
      {
        num: '03',
        name: 'High-risk obligations',
        desc: 'Risk management, data governance, documentation, logging, human oversight and robustness, due 2 December 2027 (Annex III) or 2 August 2028 (Annex I).',
      },
      {
        num: '04',
        name: 'Technical documentation',
        desc: 'Maintain the documentation required to demonstrate conformity.',
      },
      {
        num: '05',
        name: 'Transparency & monitoring',
        desc: 'Inform people where required, label synthetic content and monitor systems after deployment.',
      },
      {
        num: '06',
        name: 'General-purpose AI models',
        desc: 'Technical documentation, a copyright policy and a training-content summary for GPAI providers, plus extra duties for systemic-risk models.',
      },
    ],
    timeline: [
      { date: '2024-08-01', event: 'The AI Act enters into force.' },
      { date: '2025-02-02', event: 'Prohibited AI practices and AI-literacy obligations apply.' },
      {
        date: '2025-08-02',
        event: 'Governance rules and obligations for general-purpose AI models apply.',
      },
      {
        date: '2026-07-27',
        event: 'The Digital Omnibus on AI, Regulation (EU) 2026/1744, enters into force.',
      },
      {
        date: '2026-08-02',
        event: 'Transparency rules (Article 50) apply, such as telling people they are interacting with AI.',
      },
      {
        date: '2026-12-02',
        event: 'Ban on AI systems that generate non-consensual intimate content or child sexual abuse material; delayed deadline for watermarking AI-generated content.',
      },
      {
        date: '2027-12-02',
        event: 'High-risk rules apply to Annex III uses such as biometrics, critical infrastructure, education, employment and law enforcement.',
      },
      {
        date: '2028-08-02',
        event: 'High-risk rules apply to AI in products covered by Annex I, such as machinery, toys and lifts.',
      },
    ],
    faqs: [
      {
        q: 'Who does the EU AI Act apply to?',
        a: 'Providers, deployers, importers and distributors of AI systems placed on the EU market or whose output is used in the EU, including companies established outside the EU.',
      },
      {
        q: 'How are AI systems classified?',
        a: 'By risk tier: unacceptable (banned), high (strict obligations), limited (transparency duties) and minimal (no specific obligations).',
      },
      {
        q: 'When do the obligations apply?',
        a: 'In stages: prohibitions from 2 February 2025, general-purpose AI duties from 2 August 2025, transparency rules from 2 August 2026, stand-alone high-risk systems from 2 December 2027, and high-risk AI in regulated products from 2 August 2028.',
      },
      {
        q: 'What did the 2026 Digital Omnibus change?',
        a: 'Regulation (EU) 2026/1744, in force since 27 July 2026, postponed the high-risk deadlines and banned AI systems that generate non-consensual intimate content or child sexual abuse material. It also extended simplifications to small mid-cap companies, simplified the AI-literacy duty, created an EU-level regulatory sandbox and widened the AI Office’s enforcement powers.',
      },
      {
        q: 'How do you help?',
        a: 'The platform structures risk classification, technical documentation and post-market monitoring in one place, and maps AI Act controls alongside ISO 42001.',
      },
    ],
    sources: [
      {
        label: 'European Commission, AI Omnibus enters into force',
        url: 'https://digital-strategy.ec.europa.eu/en/news/ai-omnibus-enters-force',
      },
      {
        label: 'European Commission, AI Act',
        url: 'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai',
      },
      {
        label: 'European Parliament, AI Act: deal on simplification measures (7 May 2026)',
        url: 'https://www.europarl.europa.eu/news/en/press-room/20260427IPR42011/',
      },
      {
        label: 'EUR-Lex, Regulation (EU) 2024/1689',
        url: 'https://eur-lex.europa.eu/eli/reg/2024/1689/oj',
      },
      {
        label: 'EUR-Lex, Regulation (EU) 2026/1744',
        url: 'https://eur-lex.europa.eu/eli/reg/2026/1744/oj',
      },
    ],
    lastReviewed: REVIEWED,
  },
  'nist-ai-rmf': {
    slug: 'nist-ai-rmf',
    path: '/nist-ai-rmf',
    name: 'NIST AI RMF',
    nameInSentence: 'the NIST AI RMF',
    category: 'AI Governance',
    tagline: 'manage AI risk across the lifecycle',
    hook: 'Turn Govern, Map, Measure and Manage into owned tasks and evidence, not slideware.',
    definition:
      'The NIST AI Risk Management Framework (AI RMF 1.0, January 2023) is a voluntary US framework for managing AI risk across the lifecycle. It is organized into four functions, Govern, Map, Measure and Manage, and paired with a Generative AI Profile, NIST AI 600-1. NIST is revising it as part of the White House AI Action Plan.',
    tldr: [
      'Voluntary; there is no AI RMF certification.',
      'Four functions: Govern, Map, Measure and Manage.',
      'Seven trustworthiness characteristics define what trustworthy AI means.',
      'NIST is revising the framework; AI RMF 1.0 remains the published version.',
    ],
    requirements: [
      {
        num: '01',
        name: 'Govern',
        desc: 'Cultivate a culture and structures for managing AI risk.',
      },
      {
        num: '02',
        name: 'Map',
        desc: 'Establish the context and identify risks of each AI system.',
      },
      {
        num: '03',
        name: 'Measure',
        desc: 'Assess, analyze and track identified AI risks.',
      },
      {
        num: '04',
        name: 'Manage',
        desc: 'Prioritize and act on risks based on their impact.',
      },
      {
        num: '05',
        name: 'Trustworthiness',
        desc: 'Valid and reliable; safe; secure and resilient; accountable and transparent; explainable and interpretable; privacy-enhanced; fair with harmful bias managed.',
      },
    ],
    faqs: [
      {
        q: 'Is the AI RMF mandatory?',
        a: 'No. It is voluntary, but widely used as a baseline for responsible AI and often referenced in policy and contracts.',
      },
      {
        q: 'Is the AI RMF being updated?',
        a: 'Yes. NIST says AI RMF 1.0 is being revised as part of the White House AI Action Plan. Until a new version is published, AI RMF 1.0 and the Generative AI Profile (NIST AI 600-1, July 2024) are the current texts.',
      },
      {
        q: 'How does it relate to the EU AI Act?',
        a: 'They are complementary. RMF practices help demonstrate the risk management and governance the Act expects.',
      },
      {
        q: 'What are the trustworthiness characteristics?',
        a: 'Valid and reliable; safe; secure and resilient; accountable and transparent; explainable and interpretable; privacy-enhanced; and fair with harmful bias managed.',
      },
      {
        q: 'How do you help?',
        a: 'The platform operationalizes the four functions with owners, evidence and tracking, instead of static documents.',
      },
    ],
    sources: [
      {
        label: 'NIST, AI Risk Management Framework',
        url: 'https://www.nist.gov/itl/ai-risk-management-framework',
      },
      { label: 'NIST AI 100-1, AI RMF 1.0', url: 'https://doi.org/10.6028/NIST.AI.100-1' },
      {
        label: 'NIST AI 600-1, Generative AI Profile',
        url: 'https://doi.org/10.6028/NIST.AI.600-1',
      },
    ],
    lastReviewed: REVIEWED,
  },
  'iso-42001': {
    slug: 'iso-42001',
    path: '/iso-42001',
    name: 'ISO 42001',
    category: 'AI Governance',
    tagline: 'certify responsible AI',
    hook: 'Build the AI management system auditors certify, on the same structure you know from ISO 27001.',
    definition:
      'ISO/IEC 42001:2023 is the international standard for an artificial intelligence management system (AIMS). It follows the same clause structure as ISO 27001, adds AI risk and impact assessment, and lists 38 reference controls in Annex A. Accredited bodies certify organizations that build, provide or use AI. ComplyEasyAI maps AIMS controls to evidence.',
    tldr: [
      'Published in December 2023 as a certifiable AI management-system standard.',
      'Annex A lists 38 controls under nine control objectives.',
      'Shares the harmonized management-system structure of ISO 27001 and ISO 9001.',
      'Supports EU AI Act governance, but certification alone does not show conformity with the Act.',
    ],
    requirements: [
      {
        num: '01',
        name: 'AIMS scope',
        desc: 'Define the boundaries and objectives of your AI management system.',
      },
      {
        num: '02',
        name: 'AI risk & impact',
        desc: 'Assess risks and impacts of AI systems on individuals and society.',
      },
      {
        num: '03',
        name: 'Lifecycle controls',
        desc: 'Apply controls across the AI system development lifecycle.',
      },
      {
        num: '04',
        name: 'Data governance for AI',
        desc: 'Govern the data used to train and operate AI systems.',
      },
      {
        num: '05',
        name: 'Continual improvement',
        desc: 'Audit, review and improve the AIMS over time.',
      },
    ],
    faqs: [
      {
        q: 'What is an AIMS?',
        a: 'An Artificial Intelligence Management System: the governance structure ISO 42001 certifies, analogous to an ISMS under ISO 27001.',
      },
      {
        q: 'Can it be certified?',
        a: 'Yes. An accredited certification body can certify your AIMS after a two-stage audit.',
      },
      {
        q: 'Does ISO 42001 make us EU AI Act compliant?',
        a: "No. It gives you the management backbone the Act's governance duties build on, but certification alone does not demonstrate conformity with the Act's specific requirements, such as technical documentation, conformity assessment and registration.",
      },
      {
        q: 'How do you help?',
        a: 'The platform maps AIMS controls to evidence and keeps lifecycle documentation current.',
      },
    ],
    sources: [{ label: 'ISO, ISO/IEC 42001:2023', url: 'https://www.iso.org/standard/42001' }],
    lastReviewed: REVIEWED,
  },
  'aiuc-1': {
    slug: 'aiuc-1',
    path: '/aiuc-1',
    name: 'AIUC-1',
    category: 'AI Governance',
    tagline: 'certify your AI agents',
    hook: 'Fifty-one requirements across six pillars, written to support insurance for AI agent risk.',
    definition:
      'AIUC-1 is the Artificial Intelligence Underwriting Company’s certification standard for AI agents. The current release, dated 15 July 2026, has 51 auditable requirements (43 mandatory, 8 optional) across data and privacy, security, safety, reliability, accountability and society. It is updated quarterly, and the next release is due on 15 October 2026.',
    tldr: [
      'Six pillars: Data & Privacy, Security, Safety, Reliability, Accountability, Society.',
      '51 requirements (43 mandatory, 8 optional) in the 15 July 2026 release.',
      'Quarterly releases; the next is scheduled for 15 October 2026.',
      'Complements ISO 42001, SOC 2, the NIST AI RMF and the EU AI Act.',
    ],
    requirements: [
      {
        num: '01',
        name: 'Data & Privacy (A001–A008)',
        desc: 'Input and output data policies, limits on what the agent can access, protection of IP and trade secrets, and prevention of cross-customer exposure, PII leakage, IP violations and credential leakage.',
      },
      {
        num: '02',
        name: 'Security (B001–B010)',
        desc: 'Third-party adversarial-robustness testing, adversarial-input detection and real-time input filtering, controlled release of technical details, endpoint anti-scraping, prevention of unauthorized agent actions, user access privileges, a protected deployment environment, limited output over-exposure and secure patterns in generated code.',
      },
      {
        num: '03',
        name: 'Safety (C001–C012)',
        desc: 'An AI risk taxonomy, pre-deployment testing, prevention of harmful, out-of-scope and agent-specific high-risk outputs and output vulnerabilities, human review and real-time intervention for high-risk outputs, and third-party testing for harmful, out-of-scope and customer-defined risks.',
      },
      {
        num: '04',
        name: 'Reliability (D001–D004)',
        desc: 'Prevention of hallucinated outputs, restriction of unsafe tool calls, and independent third-party testing of both hallucinations and tool calls.',
      },
      {
        num: '05',
        name: 'Accountability (E001–E017)',
        desc: 'AI failure plans for security breaches, harmful outputs and hallucinations; assigned accountability; documented data-storage security; vendor due diligence; internal process reviews; third-party access monitoring; an AI acceptable-use policy; recorded processing locations; a regulatory compliance register; a quality management system; activity logging; AI disclosure and a transparency policy.',
      },
      {
        num: '06',
        name: 'Society (F001–F002)',
        desc: 'Prevention of AI cyber misuse and of catastrophic misuse, including chemical, biological, radiological and nuclear uplift.',
      },
    ],
    faqs: [
      {
        q: 'Who is AIUC-1 for?',
        a: 'Organizations that build or deploy AI agents: systems that take actions through tools rather than only generating text. The standard is written to be audited and to support insurance coverage for AI risk.',
      },
      {
        q: 'How does AIUC-1 relate to ISO 42001 and the EU AI Act?',
        a: 'It complements both: ISO 42001 supplies the management-system backbone and the AI Act the regulatory obligations, while AIUC-1 adds agent-specific requirements such as unsafe tool-call restrictions, adversarial-robustness testing and AI failure plans. Shared controls are mapped once and reused.',
      },
      {
        q: 'Is AIUC-1 a certification?',
        a: "Yes. It is a certifiable standard assessed against its 51 requirements. ComplyEasyAI's control names reuse the official requirement titles and its descriptions paraphrase the public summaries; the full auditor-facing text is not published, so confirm details with your auditor.",
      },
      {
        q: 'How often does AIUC-1 change?',
        a: 'Quarterly. Releases so far were July 2025, October 2025, January 2026, April 2026 and 15 July 2026, and the next is scheduled for 15 October 2026. We review this page after each release.',
      },
      {
        q: 'How do you help?',
        a: 'The platform maps each agent to the 51 requirements across the six pillars, flags the 8 optional ones, collects evidence from your AI stack and keeps it continuously audit-ready.',
      },
    ],
    sources: [
      { label: 'AIUC-1, the standard', url: 'https://www.aiuc-1.com/' },
      { label: 'AIUC-1, changelog', url: 'https://standard.aiuc-1.com/changelog/' },
    ],
    lastReviewed: REVIEWED,
  },
  dora: {
    slug: 'dora',
    path: '/dora-compliance',
    name: 'DORA',
    category: 'EU Digital',
    tagline: 'operational resilience for finance',
    hook: 'Classify incidents fast, keep the register of information current, and evidence your resilience testing.',
    definition:
      'The Digital Operational Resilience Act (Regulation (EU) 2022/2554) has applied since 17 January 2025 to EU banks, insurers, investment firms, payment institutions and other financial entities. It requires ICT risk management, major-incident reporting, resilience testing, third-party risk management with a register of information, and oversight of critical ICT providers. ComplyEasyAI structures each pillar.',
    tldr: [
      'Applies since 17 January 2025 to most EU financial entities.',
      'Major incidents: initial notice within 4 hours of classification, and within 24 hours of awareness.',
      'Every in-scope entity keeps a register of information on its ICT third-party contracts.',
      'Designated entities run threat-led penetration tests at least every three years.',
    ],
    requirements: [
      {
        num: '01',
        name: 'ICT risk management',
        desc: 'Maintain a comprehensive framework to manage ICT risk.',
      },
      {
        num: '02',
        name: 'Incident reporting',
        desc: 'Classify and report major ICT-related incidents to regulators.',
      },
      {
        num: '03',
        name: 'Resilience testing',
        desc: 'Run a digital operational-resilience testing programme.',
      },
      {
        num: '04',
        name: 'Third-party ICT risk',
        desc: 'Manage and monitor risk from ICT service providers, with a register of information.',
      },
      {
        num: '05',
        name: 'Information sharing',
        desc: 'Participate in threat-intelligence sharing arrangements.',
      },
    ],
    faqs: [
      {
        q: 'Who must comply with DORA?',
        a: 'EU financial entities, including banks, insurers, investment firms, payment and e-money institutions and crypto-asset service providers, plus oversight of critical ICT third-party providers.',
      },
      {
        q: 'When did DORA apply?',
        a: 'On 17 January 2025, across all in-scope entities.',
      },
      {
        q: 'How fast must major incidents be reported?',
        a: 'An initial notification within 4 hours of classifying an incident as major, and no later than 24 hours after becoming aware of it. An intermediate report follows within 72 hours of the initial notification, and a final report within one month.',
      },
      {
        q: 'What counts as a major incident?',
        a: 'Incidents are classified by criteria such as clients affected, duration, geographic spread, data losses, critical services affected and economic impact.',
      },
      {
        q: 'How do you help?',
        a: 'The platform structures ICT risk, incident classification and the third-party register in one program.',
      },
    ],
    sources: [
      {
        label: 'EUR-Lex, Regulation (EU) 2022/2554 (DORA)',
        url: 'https://eur-lex.europa.eu/eli/reg/2022/2554/oj',
      },
      {
        label: 'EUR-Lex, Delegated Regulation (EU) 2025/301',
        url: 'https://eur-lex.europa.eu/eli/reg_del/2025/301/oj',
      },
      {
        label: 'EBA, Joint technical standards on major incident reporting',
        url: 'https://www.eba.europa.eu/activities/single-rulebook/regulatory-activities/operational-resilience/joint-technical-standards-major-incident-reporting',
      },
    ],
    lastReviewed: REVIEWED,
  },
  dma: {
    slug: 'dma',
    path: '/dma-compliance',
    name: 'DMA',
    nameInSentence: 'the DMA',
    category: 'EU Digital',
    tagline: 'fair and contestable markets',
    hook: 'Track gatekeeper obligations and structure the compliance reports the European Commission expects.',
    definition:
      'The Digital Markets Act (Regulation (EU) 2022/1925) sets obligations for gatekeepers: large platforms the European Commission designates for core platform services such as app stores, search, messaging and operating systems. Gatekeepers must comply within six months of designation and report annually. Fines reach 10% of worldwide turnover, or 20% for repeat infringements.',
    tldr: [
      'Designation thresholds: €7.5bn EU turnover or €75bn market value, plus 45 million monthly EU end users.',
      'Obligations apply six months after designation.',
      'Gatekeepers file compliance reports with the Commission and update them at least annually.',
      'Fines up to 10% of worldwide turnover, or 20% for repeat infringements.',
    ],
    requirements: [
      {
        num: '01',
        name: 'Gatekeeper designation',
        desc: 'Determine whether your core platform services meet the thresholds.',
      },
      {
        num: '02',
        name: 'Interoperability',
        desc: 'Enable interoperability and data portability where required.',
      },
      {
        num: '03',
        name: 'No self-preferencing',
        desc: 'Avoid ranking your own services above rivals unfairly.',
      },
      {
        num: '04',
        name: 'Data-use limits',
        desc: 'Respect limits on combining and using business-user data.',
      },
      {
        num: '05',
        name: 'Compliance reporting',
        desc: 'Report on measures implemented to comply.',
      },
    ],
    faqs: [
      {
        q: 'Who are gatekeepers?',
        a: 'Platforms the European Commission designates for a core platform service because they meet size thresholds: €7.5bn EU turnover or €75bn market value, plus 45 million monthly end users and 10,000 yearly business users in the EU.',
      },
      {
        q: 'What are core platform services?',
        a: 'Services named in the Act, such as search engines, app stores, messaging, social networks, operating systems, browsers and online advertising.',
      },
      {
        q: 'What are the penalties?',
        a: 'Up to 10% of worldwide annual turnover, or 20% for repeated infringements, plus periodic penalty payments of up to 5% of average daily worldwide turnover.',
      },
      {
        q: 'How do you help?',
        a: 'The platform tracks the obligations that apply to you and structures the compliance reporting gatekeepers must file.',
      },
    ],
    sources: [
      {
        label: 'EUR-Lex, Regulation (EU) 2022/1925 (DMA)',
        url: 'https://eur-lex.europa.eu/eli/reg/2022/1925/oj',
      },
      {
        label: 'European Commission, Digital Markets Act',
        url: 'https://digital-markets-act.ec.europa.eu/index_en',
      },
    ],
    lastReviewed: REVIEWED,
  },
  dsa: {
    slug: 'dsa',
    path: '/dsa-compliance',
    name: 'DSA',
    nameInSentence: 'the DSA',
    category: 'EU Digital',
    tagline: 'safer online platforms',
    hook: "Structure notice-and-action, transparency reports and risk assessments to match your platform's tier.",
    definition:
      'The Digital Services Act (Regulation (EU) 2022/2065) has applied in full since 17 February 2024 to intermediary services offered in the EU. Duties scale with size: intermediaries publish transparency reports, platforms add notice-and-action and ad transparency, and very large platforms with 45 million or more EU users run annual systemic-risk assessments. Fines reach 6% of turnover.',
    tldr: [
      'Fully applicable since 17 February 2024.',
      'Tiered duties: intermediaries, hosting services, online platforms, and very large platforms and search engines.',
      'Very large platform threshold: 45 million average monthly active EU users.',
      'Fines up to 6% of worldwide annual turnover.',
    ],
    requirements: [
      {
        num: '01',
        name: 'Notice & action',
        desc: 'Provide mechanisms to report and act on illegal content.',
      },
      {
        num: '02',
        name: 'Transparency reporting',
        desc: 'Publish reports on moderation decisions and practices.',
      },
      {
        num: '03',
        name: 'Trusted flaggers',
        desc: 'Prioritize notices from designated trusted flaggers.',
      },
      {
        num: '04',
        name: 'Risk assessments',
        desc: 'Assess systemic risks (for very large platforms and search engines).',
      },
      {
        num: '05',
        name: 'Ad transparency',
        desc: 'Disclose advertising and recommender-system parameters.',
      },
    ],
    faqs: [
      {
        q: 'Who does the DSA cover?',
        a: 'Online intermediaries and platforms serving EU users, with duties tiered by role and size.',
      },
      {
        q: 'What is a VLOP?',
        a: 'A Very Large Online Platform with 45 million or more average monthly active users in the EU, designated by the Commission. It carries the strictest systemic-risk and audit obligations.',
      },
      {
        q: 'What are the penalties?',
        a: 'Up to 6% of worldwide annual turnover, plus periodic penalties for continued non-compliance.',
      },
      {
        q: 'How does it differ from the DMA?',
        a: 'The DSA governs safety and transparency; the DMA governs fair competition among gatekeepers.',
      },
      {
        q: 'How do you help?',
        a: 'The platform structures moderation records, transparency reporting and risk assessments.',
      },
    ],
    sources: [
      {
        label: 'EUR-Lex, Regulation (EU) 2022/2065 (DSA)',
        url: 'https://eur-lex.europa.eu/eli/reg/2022/2065/oj',
      },
      {
        label: 'European Commission, Digital Services Act',
        url: 'https://digital-strategy.ec.europa.eu/en/policies/digital-services-act',
      },
    ],
    lastReviewed: REVIEWED,
  },
  csrd: {
    slug: 'csrd',
    path: '/csrd-compliance',
    name: 'CSRD',
    nameInSentence: 'the CSRD',
    category: 'EU Digital',
    tagline: 'for the post-Omnibus scope',
    hook: 'Omnibus I narrowed who reports. If you are still in scope, structure double materiality and ESRS evidence once.',
    definition:
      'The Corporate Sustainability Reporting Directive requires in-scope companies to report sustainability information under the European Sustainability Reporting Standards (ESRS), based on double materiality. Since Omnibus I (Directive (EU) 2026/470), only EU companies with more than 1,000 employees and over €450 million turnover remain in scope, listed SMEs are out, and only limited assurance is required.',
    tldr: [
      'In scope: EU companies with more than 1,000 employees and more than €450 million net turnover.',
      'Listed SMEs are no longer in scope.',
      'Limited assurance remains; the planned move to reasonable assurance was dropped.',
      'Member States must transpose the changes by 19 March 2027.',
    ],
    requirements: [
      {
        num: '01',
        name: 'Double materiality',
        desc: 'Assess both impact materiality and financial materiality.',
      },
      {
        num: '02',
        name: 'ESRS disclosures',
        desc: 'Report against the topical ESRS standards that apply.',
      },
      {
        num: '03',
        name: 'Governance disclosures',
        desc: 'Describe how governance bodies oversee sustainability.',
      },
      {
        num: '04',
        name: 'Climate (E1)',
        desc: 'Disclose climate risks, targets and transition plans.',
      },
      {
        num: '05',
        name: 'Assurance readiness',
        desc: 'Prepare disclosures for limited assurance by your statutory auditor or an accredited assurance provider.',
      },
    ],
    timeline: [
      {
        date: '2025-04-17',
        event: "The 'stop-the-clock' Directive (EU) 2025/794 enters into force, postponing later reporting waves by two years.",
      },
      {
        date: '2026-02-26',
        event: 'Omnibus I, Directive (EU) 2026/470, is published in the Official Journal.',
      },
      { date: '2026-03-18', event: 'Omnibus I enters into force.' },
      {
        date: '2027-03-19',
        event: 'Deadline for Member States to transpose the CSRD changes into national law.',
      },
    ],
    faqs: [
      {
        q: 'Who must report under CSRD?',
        a: "After Omnibus I, EU companies with more than 1,000 employees and more than €450 million net turnover, plus certain non-EU groups with more than €450 million net turnover in the EU. Listed SMEs are no longer in scope. Check your country's transposition, due by 19 March 2027.",
      },
      {
        q: 'What is double materiality?',
        a: "Assessing both how sustainability issues affect the company's finances and how the company affects people and the environment.",
      },
      {
        q: 'What are the ESRS?',
        a: 'The European Sustainability Reporting Standards that define what to disclose and how.',
      },
      {
        q: 'What assurance is required?',
        a: 'Limited assurance. Omnibus I removed the planned move to reasonable assurance.',
      },
      {
        q: 'How do you help?',
        a: 'The platform structures the materiality assessment, organizes disclosure evidence and prepares it for limited assurance.',
      },
    ],
    sources: [
      {
        label: 'EUR-Lex, Directive (EU) 2026/470 (Omnibus I)',
        url: 'https://eur-lex.europa.eu/eli/dir/2026/470/oj',
      },
      {
        label: 'European Parliament, Legislative Train: Omnibus I (CSRD and CSDDD)',
        url: 'https://www.europarl.europa.eu/legislative-train/package-simplification-business/file-first-omnibus-package-on-sustainability-proposal-amending-csrd-and-csddd',
      },
    ],
    lastReviewed: REVIEWED,
  },
};

/** Number of framework pillar pages — use this in copy instead of a literal. */
export const FRAMEWORK_PILLAR_COUNT = Object.keys(FRAMEWORK_PILLARS).length;

/** Related pillars: same category first, padded with others (max 3). */
export function relatedPillars(slug: string): FrameworkPillarContent[] {
  const all = Object.values(FRAMEWORK_PILLARS);
  const self = FRAMEWORK_PILLARS[slug];
  if (!self) return all.slice(0, 3);
  const sameCat = all.filter((f) => f.slug !== slug && f.category === self.category);
  const rest = all.filter((f) => f.slug !== slug && f.category !== self.category);
  return [...sameCat, ...rest].slice(0, 3);
}
