import type { SignalCategory } from '../components/marketing/signal';

/**
 * Content for the 14 marketing framework pillar pages ("Signal" redesign).
 * Source of truth: the design handoff (FrameworkPillar._data) — grounded in
 * constants/frameworkControls.ts. Rendered by SignalFrameworkPillar.
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

export interface FrameworkPillarContent {
  slug: string;
  /** Public route for this pillar page. */
  path: string;
  name: string;
  category: SignalCategory;
  tagline: string;
  definition: string;
  requirements: PillarRequirement[];
  faqs: PillarFaq[];
}

/** Six shared "How it works" steps (identical across all pillars). */
export const PILLAR_HOW_IT_WORKS = [
  {
    "num": "01",
    "title": "Scope",
    "body": "Define the systems, boundaries and requirements your program will cover."
  },
  {
    "num": "02",
    "title": "Connect your stack",
    "body": "Link cloud, identity, code and ticketing with read-only access; controls are discovered and mapped."
  },
  {
    "num": "03",
    "title": "Collect evidence",
    "body": "AI agents gather configuration and activity evidence on a schedule, building a versioned trail."
  },
  {
    "num": "04",
    "title": "Monitor & remediate",
    "body": "Continuous monitoring flags drift the moment it happens and routes it to an owner."
  },
  {
    "num": "05",
    "title": "Track effectiveness",
    "body": "Operating effectiveness is recorded over time, ready for your observation window."
  },
  {
    "num": "06",
    "title": "Report & hand off",
    "body": "Organized, current evidence is packaged for auditors and stakeholders."
  }
];

/** Six shared "How ComplyEasyAI helps" capability cards. */
export const PILLAR_CAPABILITIES = [
  {
    "title": "Control mapping",
    "desc": "Your environment is mapped to each requirement, so you see exactly which control satisfies what."
  },
  {
    "title": "Automated evidence",
    "desc": "Read-only integrations build a versioned, timestamped trail instead of manual screenshots."
  },
  {
    "title": "Continuous monitoring",
    "desc": "Drift surfaces as soon as it happens, not during fieldwork."
  },
  {
    "title": "Readiness dashboards",
    "desc": "Real-time views highlight failing or unmapped controls with owners attached."
  },
  {
    "title": "Multi-framework reuse",
    "desc": "Shared controls are mapped once and reused across every framework you run."
  },
  {
    "title": "Audit-ready reporting",
    "desc": "Export organized, current evidence packages on demand."
  }
];

export const FRAMEWORK_PILLARS: Record<string, FrameworkPillarContent> = {
  "soc-2": {
    "slug": "soc-2",
    "path": "/soc2-compliance",
    "name": "SOC 2",
    "category": "Security",
    "tagline": "audit-ready faster",
    "definition": "SOC 2 is an AICPA attestation framework that evaluates how a service organization manages customer data against five Trust Services Criteria. An independent CPA firm examines your controls and issues a Type I report (design at a point in time) or Type II (operating effectiveness across months).",
    "requirements": [
      {
        "num": "01",
        "name": "Security",
        "desc": "The mandatory common criteria — protecting systems and data against unauthorized access."
      },
      {
        "num": "02",
        "name": "Availability",
        "desc": "Systems are available for operation and use as committed, with monitoring and recovery."
      },
      {
        "num": "03",
        "name": "Processing Integrity",
        "desc": "Processing is complete, valid, accurate, timely and authorized."
      },
      {
        "num": "04",
        "name": "Confidentiality",
        "desc": "Information designated confidential is protected throughout its lifecycle."
      },
      {
        "num": "05",
        "name": "Privacy",
        "desc": "Personal information is handled in line with your notice and criteria."
      }
    ],
    "faqs": [
      {
        "q": "What is the difference between SOC 2 Type I and Type II?",
        "a": "Type I assesses whether controls are suitably designed at a point in time; Type II tests whether they operated effectively across a period, commonly three to twelve months."
      },
      {
        "q": "How long does SOC 2 take?",
        "a": "Setup is fast, but Type II requires an observation window — typically three months minimum — that no tool can shorten because the auditor must observe controls over time."
      },
      {
        "q": "Do you replace my auditor?",
        "a": "No. SOC 2 reports must be issued by an independent CPA firm. ComplyEasyAI prepares you so fieldwork examines a clean, well-documented control environment."
      },
      {
        "q": "Can I pursue SOC 2 with ISO 27001?",
        "a": "Yes. The two share a substantial portion of controls, which are mapped once and reused so evidence carries across both."
      }
    ]
  },
  "iso-27001": {
    "slug": "iso-27001",
    "path": "/iso-27001",
    "name": "ISO 27001",
    "category": "Security",
    "tagline": "certify your ISMS with less effort",
    "definition": "ISO/IEC 27001 is the international standard for an Information Security Management System (ISMS). Certification requires establishing, operating and continually improving an ISMS, with Annex A providing a catalog of security controls to select from based on risk.",
    "requirements": [
      {
        "num": "01",
        "name": "ISMS scope & context",
        "desc": "Define the boundaries, interested parties and objectives of your management system."
      },
      {
        "num": "02",
        "name": "Risk assessment & treatment",
        "desc": "Identify, analyze and treat information-security risks systematically."
      },
      {
        "num": "03",
        "name": "Statement of Applicability",
        "desc": "Document which Annex A controls apply and justify any exclusions."
      },
      {
        "num": "04",
        "name": "Annex A controls",
        "desc": "Implement the selected controls from the 93 in the 2022 revision."
      },
      {
        "num": "05",
        "name": "Management review & audit",
        "desc": "Run internal audits and management reviews to drive continual improvement."
      }
    ],
    "faqs": [
      {
        "q": "Is ISO 27001 a certification?",
        "a": "Yes — unlike SOC 2, ISO 27001 results in a certificate issued by an accredited body after a two-stage audit of your ISMS."
      },
      {
        "q": "What changed in the 2022 revision?",
        "a": "Annex A was restructured into 93 controls across four themes (organizational, people, physical, technological), with new controls like threat intelligence and data-leakage prevention."
      },
      {
        "q": "How does it relate to SOC 2?",
        "a": "The two overlap heavily; a shared control library means work done for one accelerates the other."
      },
      {
        "q": "How long does certification take?",
        "a": "It depends on maturity, but automating evidence and the Statement of Applicability removes much of the manual preparation."
      }
    ]
  },
  "nist-csf": {
    "slug": "nist-csf",
    "path": "/nist-csf",
    "name": "NIST CSF",
    "category": "Security",
    "tagline": "measure and improve your posture",
    "definition": "The NIST Cybersecurity Framework organizes security activities into outcome-based functions, giving organizations a common language to assess and improve their posture. It is voluntary and maps cleanly onto other frameworks.",
    "requirements": [
      {
        "num": "01",
        "name": "Govern",
        "desc": "Establish and monitor the cybersecurity risk-management strategy and expectations."
      },
      {
        "num": "02",
        "name": "Identify",
        "desc": "Understand assets, risks and the business context that shape your program."
      },
      {
        "num": "03",
        "name": "Protect",
        "desc": "Implement safeguards to ensure delivery of critical services."
      },
      {
        "num": "04",
        "name": "Detect",
        "desc": "Identify the occurrence of cybersecurity events promptly."
      },
      {
        "num": "05",
        "name": "Respond & Recover",
        "desc": "Act on detected incidents and restore capabilities affected by them."
      }
    ],
    "faqs": [
      {
        "q": "Is NIST CSF mandatory?",
        "a": "No — it is a voluntary framework, though many organizations and contracts require alignment with it."
      },
      {
        "q": "What is new in CSF 2.0?",
        "a": "Version 2.0 adds the Govern function, emphasizing governance and supply-chain risk alongside the original five functions."
      },
      {
        "q": "Does it map to other frameworks?",
        "a": "Yes — CSF cross-references ISO 27001, SP 800-53 and others, so aligned controls satisfy multiple standards."
      },
      {
        "q": "How do you help?",
        "a": "ComplyEasyAI maps your environment to each function and tracks maturity continuously rather than through periodic spreadsheets."
      }
    ]
  },
  "pci-dss": {
    "slug": "pci-dss",
    "path": "/pci-dss",
    "name": "PCI DSS",
    "category": "Security",
    "tagline": "protect cardholder data continuously",
    "definition": "The Payment Card Industry Data Security Standard protects cardholder data through 12 core requirements across six control objectives. It applies to any organization that stores, processes or transmits payment card data.",
    "requirements": [
      {
        "num": "01",
        "name": "Secure networks",
        "desc": "Install and maintain network security controls and secure configurations."
      },
      {
        "num": "02",
        "name": "Protect account data",
        "desc": "Protect stored cardholder data and encrypt it in transit across open networks."
      },
      {
        "num": "03",
        "name": "Vulnerability management",
        "desc": "Protect systems against malware and develop secure systems and software."
      },
      {
        "num": "04",
        "name": "Access control",
        "desc": "Restrict access to data by business need-to-know and authenticate access."
      },
      {
        "num": "05",
        "name": "Monitor & test",
        "desc": "Log and monitor all access, and test security systems regularly."
      }
    ],
    "faqs": [
      {
        "q": "Which SAQ or level applies to me?",
        "a": "It depends on transaction volume and how you handle card data; the platform helps scope your validation level."
      },
      {
        "q": "What changed in PCI DSS 4.0?",
        "a": "v4.0 adds customized implementation, stronger authentication and continuous-monitoring expectations."
      },
      {
        "q": "Does tokenization reduce scope?",
        "a": "Yes — reducing where card data lives shrinks the environment that must be assessed."
      },
      {
        "q": "How do you help?",
        "a": "Continuous monitoring surfaces drift in the in-scope environment before your assessor does."
      }
    ]
  },
  "gdpr": {
    "slug": "gdpr",
    "path": "/gdpr",
    "name": "GDPR",
    "category": "Privacy",
    "tagline": "built-in data protection",
    "definition": "The EU General Data Protection Regulation governs how organizations collect, process and store the personal data of individuals in the EU. It establishes data-subject rights, lawful bases and obligations backed by significant fines.",
    "requirements": [
      {
        "num": "01",
        "name": "Lawful basis & consent",
        "desc": "Establish and record a valid lawful basis for every processing activity."
      },
      {
        "num": "02",
        "name": "Data-subject rights",
        "desc": "Enable access, rectification, erasure, portability and objection requests."
      },
      {
        "num": "03",
        "name": "Records of processing",
        "desc": "Maintain a RoPA describing what you process and why."
      },
      {
        "num": "04",
        "name": "DPIAs",
        "desc": "Assess high-risk processing before it begins."
      },
      {
        "num": "05",
        "name": "Breach notification",
        "desc": "Report qualifying breaches to authorities within 72 hours."
      }
    ],
    "faqs": [
      {
        "q": "Does GDPR apply to non-EU companies?",
        "a": "Yes — it applies to any organization processing the personal data of individuals in the EU, regardless of where the company is based."
      },
      {
        "q": "What is a DPIA?",
        "a": "A Data Protection Impact Assessment evaluates and mitigates privacy risk before high-risk processing begins."
      },
      {
        "q": "What are the fines?",
        "a": "Up to €20 million or 4% of global annual turnover, whichever is higher."
      },
      {
        "q": "How do you help?",
        "a": "The platform maintains your RoPA, tracks data-subject requests and structures DPIAs so obligations stay current."
      }
    ]
  },
  "hipaa": {
    "slug": "hipaa",
    "path": "/hipaa",
    "name": "HIPAA",
    "category": "Privacy",
    "tagline": "safeguard PHI with confidence",
    "definition": "The US Health Insurance Portability and Accountability Act sets standards for protecting protected health information (PHI). Covered entities and business associates must implement administrative, physical and technical safeguards.",
    "requirements": [
      {
        "num": "01",
        "name": "Administrative safeguards",
        "desc": "Policies, risk analysis and workforce training that govern PHI."
      },
      {
        "num": "02",
        "name": "Physical safeguards",
        "desc": "Facility access, device and media controls protecting PHI."
      },
      {
        "num": "03",
        "name": "Technical safeguards",
        "desc": "Access control, audit controls, integrity and transmission security."
      },
      {
        "num": "04",
        "name": "Privacy Rule",
        "desc": "Limits on the use and disclosure of PHI."
      },
      {
        "num": "05",
        "name": "Breach Notification",
        "desc": "Defined notification duties when unsecured PHI is breached."
      }
    ],
    "faqs": [
      {
        "q": "Who must comply with HIPAA?",
        "a": "Covered entities (health plans, providers, clearinghouses) and their business associates that handle PHI."
      },
      {
        "q": "What is a BAA?",
        "a": "A Business Associate Agreement contractually binds vendors that handle PHI on your behalf to HIPAA safeguards."
      },
      {
        "q": "Is there a HIPAA certification?",
        "a": "No official certification exists; compliance is demonstrated through implemented safeguards and documentation."
      },
      {
        "q": "How do you help?",
        "a": "The platform maps safeguards to your systems, tracks BAAs and keeps evidence continuously current."
      }
    ]
  },
  "ccpa": {
    "slug": "ccpa",
    "path": "/ccpa",
    "name": "CCPA",
    "category": "Privacy",
    "tagline": "honor consumer privacy rights",
    "definition": "The California Consumer Privacy Act, as amended by the CPRA, grants California residents rights over their personal information and imposes obligations on businesses that meet its thresholds.",
    "requirements": [
      {
        "num": "01",
        "name": "Right to know & access",
        "desc": "Disclose what personal information you collect and how it is used."
      },
      {
        "num": "02",
        "name": "Right to delete",
        "desc": "Delete personal information on verified request, with exceptions."
      },
      {
        "num": "03",
        "name": "Right to opt out",
        "desc": "Let consumers opt out of the sale or sharing of their information."
      },
      {
        "num": "04",
        "name": "Right to correct",
        "desc": "Correct inaccurate personal information on request."
      },
      {
        "num": "05",
        "name": "Sensitive PI limits",
        "desc": "Honor limits on the use of sensitive personal information."
      }
    ],
    "faqs": [
      {
        "q": "Does CCPA apply to my business?",
        "a": "It applies to for-profit businesses meeting revenue, data-volume or data-sale thresholds involving California residents."
      },
      {
        "q": "What did CPRA add?",
        "a": "CPRA added the right to correct, sensitive-PI protections and a dedicated enforcement agency."
      },
      {
        "q": "How does it relate to GDPR?",
        "a": "They share concepts like access and deletion, so much of the operational work overlaps."
      },
      {
        "q": "How do you help?",
        "a": "The platform routes and tracks consumer requests and keeps privacy notices aligned to what you actually collect."
      }
    ]
  },
  "eu-ai-act": {
    "slug": "eu-ai-act",
    "path": "/eu-ai-act",
    "name": "EU AI Act",
    "category": "AI Governance",
    "tagline": "govern AI by risk",
    "definition": "The EU AI Act is the first comprehensive law regulating artificial intelligence. It classifies systems by risk — unacceptable, high, limited and minimal — and imposes obligations proportionate to that risk.",
    "requirements": [
      {
        "num": "01",
        "name": "Risk classification",
        "desc": "Determine the risk tier of each AI system you build or deploy."
      },
      {
        "num": "02",
        "name": "Prohibited practices",
        "desc": "Avoid the uses banned outright under the Act."
      },
      {
        "num": "03",
        "name": "High-risk obligations",
        "desc": "Meet data-governance, oversight and robustness duties for high-risk systems."
      },
      {
        "num": "04",
        "name": "Technical documentation",
        "desc": "Maintain the documentation required to demonstrate conformity."
      },
      {
        "num": "05",
        "name": "Transparency & monitoring",
        "desc": "Inform users where required and monitor systems post-deployment."
      }
    ],
    "faqs": [
      {
        "q": "Who does the EU AI Act apply to?",
        "a": "Providers and deployers of AI systems used in the EU, including those established outside the EU."
      },
      {
        "q": "How are systems classified?",
        "a": "By risk tier — unacceptable (banned), high (strict obligations), limited (transparency) and minimal."
      },
      {
        "q": "When do obligations apply?",
        "a": "Requirements phase in over time, with prohibited-practice and high-risk duties on staggered dates."
      },
      {
        "q": "How do you help?",
        "a": "The platform structures risk classification, technical documentation and post-market monitoring in one place."
      }
    ]
  },
  "nist-ai-rmf": {
    "slug": "nist-ai-rmf",
    "path": "/nist-ai-rmf",
    "name": "NIST AI RMF",
    "category": "AI Governance",
    "tagline": "manage AI risk across the lifecycle",
    "definition": "The NIST AI Risk Management Framework is a voluntary framework for managing the risks of AI systems across their lifecycle, organized around four functions: Govern, Map, Measure and Manage.",
    "requirements": [
      {
        "num": "01",
        "name": "Govern",
        "desc": "Cultivate a culture and structures for managing AI risk."
      },
      {
        "num": "02",
        "name": "Map",
        "desc": "Establish the context and identify risks of each AI system."
      },
      {
        "num": "03",
        "name": "Measure",
        "desc": "Assess, analyze and track identified AI risks."
      },
      {
        "num": "04",
        "name": "Manage",
        "desc": "Prioritize and act on risks based on their impact."
      },
      {
        "num": "05",
        "name": "Trustworthiness",
        "desc": "Address validity, safety, fairness, transparency and privacy."
      }
    ],
    "faqs": [
      {
        "q": "Is the AI RMF mandatory?",
        "a": "No — it is voluntary, but widely adopted as a baseline for responsible AI and often referenced in policy."
      },
      {
        "q": "How does it relate to the EU AI Act?",
        "a": "They are complementary; RMF practices support demonstrating the governance the Act expects."
      },
      {
        "q": "What are the trustworthiness characteristics?",
        "a": "Validity and reliability, safety, security, accountability, explainability, privacy and fairness."
      },
      {
        "q": "How do you help?",
        "a": "The platform operationalizes the four functions with evidence and tracking rather than static documents."
      }
    ]
  },
  "iso-42001": {
    "slug": "iso-42001",
    "path": "/iso-42001",
    "name": "ISO 42001",
    "category": "AI Governance",
    "tagline": "certify responsible AI",
    "definition": "ISO/IEC 42001 is the international standard for an Artificial Intelligence Management System (AIMS). It gives organizations a certifiable framework to develop and use AI responsibly and continually improve.",
    "requirements": [
      {
        "num": "01",
        "name": "AIMS scope",
        "desc": "Define the boundaries and objectives of your AI management system."
      },
      {
        "num": "02",
        "name": "AI risk & impact",
        "desc": "Assess risks and impacts of AI systems on individuals and society."
      },
      {
        "num": "03",
        "name": "Lifecycle controls",
        "desc": "Apply controls across the AI system development lifecycle."
      },
      {
        "num": "04",
        "name": "Data governance for AI",
        "desc": "Govern the data used to train and operate AI systems."
      },
      {
        "num": "05",
        "name": "Continual improvement",
        "desc": "Audit, review and improve the AIMS over time."
      }
    ],
    "faqs": [
      {
        "q": "What is an AIMS?",
        "a": "An Artificial Intelligence Management System — the governance structure ISO 42001 certifies, analogous to ISO 27001 for security."
      },
      {
        "q": "Can it be certified?",
        "a": "Yes — an accredited body can certify your AIMS after audit."
      },
      {
        "q": "How does it pair with the EU AI Act?",
        "a": "An AIMS provides the management backbone that helps meet the Act’s governance expectations."
      },
      {
        "q": "How do you help?",
        "a": "The platform maps AIMS controls to evidence and keeps lifecycle documentation current."
      }
    ]
  },
  "dora": {
    "slug": "dora",
    "path": "/dora-compliance",
    "name": "DORA",
    "category": "EU Digital",
    "tagline": "operational resilience for finance",
    "definition": "The Digital Operational Resilience Act sets uniform requirements for the security of network and information systems of EU financial entities and their critical ICT third-party providers.",
    "requirements": [
      {
        "num": "01",
        "name": "ICT risk management",
        "desc": "Maintain a comprehensive framework to manage ICT risk."
      },
      {
        "num": "02",
        "name": "Incident reporting",
        "desc": "Classify and report major ICT-related incidents to regulators."
      },
      {
        "num": "03",
        "name": "Resilience testing",
        "desc": "Run a digital operational-resilience testing programme."
      },
      {
        "num": "04",
        "name": "Third-party ICT risk",
        "desc": "Manage and monitor risk from ICT service providers."
      },
      {
        "num": "05",
        "name": "Information sharing",
        "desc": "Participate in threat-intelligence sharing arrangements."
      }
    ],
    "faqs": [
      {
        "q": "Who must comply with DORA?",
        "a": "EU financial entities — banks, insurers, investment firms and more — plus their critical ICT providers."
      },
      {
        "q": "When did DORA apply?",
        "a": "DORA has applied since January 2025 across in-scope entities."
      },
      {
        "q": "What counts as a major incident?",
        "a": "Incidents are classified by criteria such as clients affected, duration and data losses."
      },
      {
        "q": "How do you help?",
        "a": "The platform structures ICT risk, incident classification and third-party registers in one program."
      }
    ]
  },
  "dma": {
    "slug": "dma",
    "path": "/dma-compliance",
    "name": "DMA",
    "category": "EU Digital",
    "tagline": "fair and contestable markets",
    "definition": "The Digital Markets Act regulates large online \"gatekeeper\" platforms to ensure fair and contestable digital markets, imposing obligations on designated core platform services.",
    "requirements": [
      {
        "num": "01",
        "name": "Gatekeeper designation",
        "desc": "Determine whether your core platform services meet the thresholds."
      },
      {
        "num": "02",
        "name": "Interoperability",
        "desc": "Enable interoperability and data portability where required."
      },
      {
        "num": "03",
        "name": "No self-preferencing",
        "desc": "Avoid ranking your own services above rivals unfairly."
      },
      {
        "num": "04",
        "name": "Data-use limits",
        "desc": "Respect limits on combining and using business-user data."
      },
      {
        "num": "05",
        "name": "Compliance reporting",
        "desc": "Report on measures implemented to comply."
      }
    ],
    "faqs": [
      {
        "q": "Who are gatekeepers?",
        "a": "Large platforms meeting size, user and market-position thresholds designated by the European Commission."
      },
      {
        "q": "What are core platform services?",
        "a": "Services like search engines, app stores, messaging and social networks named in the Act."
      },
      {
        "q": "What are the penalties?",
        "a": "Fines can reach a significant percentage of worldwide turnover for non-compliance."
      },
      {
        "q": "How do you help?",
        "a": "The platform tracks the do’s and don’ts and structures the compliance reporting gatekeepers must file."
      }
    ]
  },
  "dsa": {
    "slug": "dsa",
    "path": "/dsa-compliance",
    "name": "DSA",
    "category": "EU Digital",
    "tagline": "safer online platforms",
    "definition": "The Digital Services Act governs online intermediaries and platforms, setting obligations for content moderation, transparency and user protection scaled to platform size, with extra duties for very large platforms.",
    "requirements": [
      {
        "num": "01",
        "name": "Notice & action",
        "desc": "Provide mechanisms to report and act on illegal content."
      },
      {
        "num": "02",
        "name": "Transparency reporting",
        "desc": "Publish reports on moderation decisions and practices."
      },
      {
        "num": "03",
        "name": "Trusted flaggers",
        "desc": "Prioritize notices from designated trusted flaggers."
      },
      {
        "num": "04",
        "name": "Risk assessments",
        "desc": "Assess systemic risks (for very large platforms and search engines)."
      },
      {
        "num": "05",
        "name": "Ad transparency",
        "desc": "Disclose advertising and recommender-system parameters."
      }
    ],
    "faqs": [
      {
        "q": "Who does the DSA cover?",
        "a": "Online intermediaries and platforms serving EU users, with tiered duties by role and size."
      },
      {
        "q": "What is a VLOP?",
        "a": "A Very Large Online Platform (45M+ EU users) carries the strictest systemic-risk obligations."
      },
      {
        "q": "How does it differ from the DMA?",
        "a": "The DSA governs safety and transparency; the DMA governs market fairness among gatekeepers."
      },
      {
        "q": "How do you help?",
        "a": "The platform structures moderation records, transparency reporting and risk assessments."
      }
    ]
  },
  "csrd": {
    "slug": "csrd",
    "path": "/csrd-compliance",
    "name": "CSRD",
    "category": "EU Digital",
    "tagline": "report sustainability with rigor",
    "definition": "The Corporate Sustainability Reporting Directive requires in-scope companies to report sustainability information under the European Sustainability Reporting Standards (ESRS), based on double materiality.",
    "requirements": [
      {
        "num": "01",
        "name": "Double materiality",
        "desc": "Assess both impact materiality and financial materiality."
      },
      {
        "num": "02",
        "name": "ESRS disclosures",
        "desc": "Report against the topical ESRS standards that apply."
      },
      {
        "num": "03",
        "name": "Governance disclosures",
        "desc": "Describe how governance bodies oversee sustainability."
      },
      {
        "num": "04",
        "name": "Climate (E1)",
        "desc": "Disclose climate risks, targets and transition plans."
      },
      {
        "num": "05",
        "name": "Assurance readiness",
        "desc": "Prepare disclosures for limited (then reasonable) assurance."
      }
    ],
    "faqs": [
      {
        "q": "Who must report under CSRD?",
        "a": "Large EU companies and listed SMEs are phased in, plus non-EU companies meeting EU revenue thresholds."
      },
      {
        "q": "What is double materiality?",
        "a": "Assessing both how sustainability issues affect the company and how the company affects people and environment."
      },
      {
        "q": "What are the ESRS?",
        "a": "The European Sustainability Reporting Standards that define what and how to disclose."
      },
      {
        "q": "How do you help?",
        "a": "The platform structures the materiality assessment, disclosure evidence and assurance preparation."
      }
    ]
  }
};

/** Related pillars: same category first, padded with others (max 3). */
export function relatedPillars(slug: string): FrameworkPillarContent[] {
  const all = Object.values(FRAMEWORK_PILLARS);
  const self = FRAMEWORK_PILLARS[slug];
  if (!self) return all.slice(0, 3);
  const sameCat = all.filter((f) => f.slug !== slug && f.category === self.category);
  const rest = all.filter((f) => f.slug !== slug && f.category !== self.category);
  return [...sameCat, ...rest].slice(0, 3);
}
