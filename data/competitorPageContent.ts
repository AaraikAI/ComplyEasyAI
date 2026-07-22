/**
 * Content for the 5 competitor comparison pages ("Signal" redesign).
 * Source of truth: the design handoff (CompetitorAlternative._data), grounded
 * in the competitive report. The "whenFit" section intentionally credits the
 * competitor — keep it; it is a deliberate credibility device.
 */

export interface CompetitorRow {
  feature: string;
  us: string;
  them: string;
}

export interface CompetitorFaq {
  q: string;
  a: string;
}

export interface CompetitorPageContent {
  slug: string;
  path: string;
  them: string;
  intro: string;
  rows: CompetitorRow[];
  whyChoose: string[];
  whenFit: string;
  faqs: CompetitorFaq[];
}

export const COMPETITOR_PAGES: Record<string, CompetitorPageContent> = {
  "vanta": {
    "slug": "vanta",
    "path": "/compare/vanta-alternative",
    "them": "Vanta",
    "intro": "Vanta pioneered automated security compliance and serves thousands of customers with a deep integration catalog. Teams evaluate ComplyEasyAI as a Vanta alternative because it is AI-native — autonomous agents collect evidence, map controls and act on findings — while adding first-class EU AI Act and NIST AI RMF coverage alongside the SOC 2 and ISO 27001 frameworks Vanta is known for.",
    "rows": [
      {
        "feature": "Core security frameworks",
        "us": "Full (SOC 2, ISO 27001)",
        "them": "Full"
      },
      {
        "feature": "EU AI Act & NIST AI RMF",
        "us": "First-class",
        "them": "Emerging"
      },
      {
        "feature": "Full EU stack (DORA, DMA, DSA)",
        "us": "Full",
        "them": "Limited"
      },
      {
        "feature": "Autonomous remediation + rollback",
        "us": "Yes",
        "them": "Monitoring-focused"
      },
      {
        "feature": "Compliance Digital Twin",
        "us": "Yes",
        "them": "Not offered"
      },
      {
        "feature": "Pricing",
        "us": "Published tiers",
        "them": "Quote-based"
      },
      {
        "feature": "Integration ecosystem",
        "us": "30+ integrations",
        "them": "Extensive catalog"
      }
    ],
    "whyChoose": [
      "AI-native agents that act on findings with rollback safety, not just alerts.",
      "First-class coverage of AI regulation — the EU AI Act and NIST AI RMF.",
      "The full EU regulatory stack (AI Act, DORA, DMA, DSA) in one platform.",
      "Transparent, published pricing — evaluate cost without a sales cycle."
    ],
    "whenFit": "Vanta is a mature, well-established platform with an extensive integration ecosystem and a long track record in security compliance. If your program centers on traditional security frameworks, you value a large existing integration catalog, and AI-governance coverage or agentic automation is not a priority, Vanta may be a strong fit. The most reliable way to decide is to evaluate both against your own requirements.",
    "faqs": [
      {
        "q": "How is ComplyEasyAI different from Vanta?",
        "a": "Both automate evidence collection and continuous monitoring. ComplyEasyAI differentiates with agentic automation that acts on findings with rollback safety, dedicated EU AI Act and NIST AI RMF coverage, and published pricing rather than quote-only access."
      },
      {
        "q": "Does ComplyEasyAI support SOC 2 and ISO 27001 like Vanta?",
        "a": "Yes — SOC 2 Type I and II and ISO 27001, alongside GDPR, HIPAA and more, with automated evidence and continuous control tracking."
      },
      {
        "q": "Does it cover the EU AI Act and NIST AI RMF?",
        "a": "Yes — first-class coverage of AI-governance regulation in addition to traditional security frameworks."
      },
      {
        "q": "Is pricing published?",
        "a": "Yes — tiers from Foundation to Visionary, so teams can evaluate cost without a sales conversation."
      }
    ]
  },
  "drata": {
    "slug": "drata",
    "path": "/compare/drata-alternative",
    "them": "Drata",
    "intro": "Drata is known for a polished, best-in-class trust center and strong vendor-risk workflows. ComplyEasyAI is evaluated as a Drata alternative for its agentic remediation, EU-regulatory depth and one transparent platform price.",
    "rows": [
      {
        "feature": "Core security frameworks",
        "us": "Full (SOC 2, ISO 27001)",
        "them": "Full"
      },
      {
        "feature": "Full EU stack (DORA, DMA, DSA)",
        "us": "Full",
        "them": "Limited"
      },
      {
        "feature": "Autonomous remediation + rollback",
        "us": "Yes",
        "them": "Monitoring-focused"
      },
      {
        "feature": "Compliance Digital Twin",
        "us": "Yes",
        "them": "Not offered"
      },
      {
        "feature": "Trust center",
        "us": "Yes",
        "them": "Best-in-class (SafeBase)"
      },
      {
        "feature": "Total cost",
        "us": "One transparent price",
        "them": "Implementation & per-framework fees reported"
      },
      {
        "feature": "Predictive gap detection",
        "us": "Yes",
        "them": "Partial"
      }
    ],
    "whyChoose": [
      "Autonomous remediation with rollback — action, not just monitoring.",
      "The full EU regulatory stack and regulated-industry depth built in.",
      "One transparent platform price with no per-framework add-ons.",
      "A Compliance Digital Twin to model changes before production."
    ],
    "whenFit": "Drata offers a best-in-class trust center (via SafeBase) and strong vendor-risk workflows, with a polished product experience. If a customer-facing trust center and mature vendor-risk tooling are your top priorities, Drata is a compelling choice — evaluate both against your framework mix and budget.",
    "faqs": [
      {
        "q": "How is ComplyEasyAI different from Drata?",
        "a": "ComplyEasyAI adds agentic remediation with rollback, a Compliance Digital Twin, and the full EU regulatory stack, with one transparent platform price rather than layered implementation and per-framework fees."
      },
      {
        "q": "Does ComplyEasyAI have a trust center?",
        "a": "Yes. Drata’s SafeBase-powered trust center is best-in-class; ComplyEasyAI provides a trust center alongside broader autonomous compliance."
      },
      {
        "q": "Can I consolidate multiple frameworks?",
        "a": "Yes — shared controls are mapped once and reused, so multi-framework programs share evidence."
      },
      {
        "q": "Is pricing transparent?",
        "a": "Yes — published tiers, with the platform price covering the tier’s frameworks and users."
      }
    ]
  },
  "secureframe": {
    "slug": "secureframe",
    "path": "/compare/secureframe-alternative",
    "them": "Secureframe",
    "intro": "Secureframe offers clean UX and a fast SOC 2 path, with early ISO 42001 and EU AI Act support. Teams evaluate ComplyEasyAI as a Secureframe alternative for autonomous remediation, the Compliance Digital Twin and the full EU regulatory stack.",
    "rows": [
      {
        "feature": "Core security frameworks",
        "us": "Full (SOC 2, ISO 27001)",
        "them": "Full"
      },
      {
        "feature": "EU AI Act support",
        "us": "First-class",
        "them": "Early support"
      },
      {
        "feature": "Full EU stack (DORA, DMA, DSA)",
        "us": "Full",
        "them": "Limited"
      },
      {
        "feature": "Autonomy",
        "us": "Autonomous remediation + rollback",
        "them": "AI assists (policy, questionnaires)"
      },
      {
        "feature": "Compliance Digital Twin",
        "us": "Yes",
        "them": "Not offered"
      },
      {
        "feature": "Predictive gap detection",
        "us": "Yes",
        "them": "Partial"
      },
      {
        "feature": "Pricing",
        "us": "Published tiers",
        "them": "Published (varies)"
      }
    ],
    "whyChoose": [
      "Autonomous remediation with rollback beyond AI assists.",
      "A Compliance Digital Twin to simulate audits before you invest.",
      "The full EU regulatory stack in a single platform.",
      "Predictive gap detection that flags the next likely finding."
    ],
    "whenFit": "Secureframe has clean UX and a fast SOC 2 onboarding, with early AI-governance support. If a straightforward SOC 2 path with strong usability is your priority and you don’t yet need deep EU-regulatory coverage or agentic remediation, Secureframe is a strong option.",
    "faqs": [
      {
        "q": "How is ComplyEasyAI different from Secureframe?",
        "a": "ComplyEasyAI extends automation from AI assists to autonomous remediation with rollback, adds a Compliance Digital Twin, and covers the full EU regulatory stack."
      },
      {
        "q": "Does it support SOC 2 as quickly?",
        "a": "Yes — automated mapping and evidence collection support a fast SOC 2 path, plus continuous monitoring afterward."
      },
      {
        "q": "What about AI governance?",
        "a": "ComplyEasyAI offers first-class EU AI Act and NIST AI RMF coverage in the same platform."
      },
      {
        "q": "Is pricing published?",
        "a": "Yes — transparent tiers from Foundation to Visionary."
      }
    ]
  },
  "sprinto": {
    "slug": "sprinto",
    "path": "/compare/sprinto-alternative",
    "them": "Sprinto",
    "intro": "Sprinto is a fast, affordable autonomous trust platform popular with early-stage startups. ComplyEasyAI is evaluated as a Sprinto alternative for extending autonomy to remediation and adding regulated-industry and EU regulatory depth.",
    "rows": [
      {
        "feature": "Core security frameworks",
        "us": "Full (SOC 2, ISO 27001)",
        "them": "Full"
      },
      {
        "feature": "Full EU stack (DORA, DMA, DSA)",
        "us": "Full",
        "them": "Core-framework focus"
      },
      {
        "feature": "Beyond monitoring",
        "us": "Autonomous remediation + rollback",
        "them": "Autonomous monitoring"
      },
      {
        "feature": "Compliance Digital Twin",
        "us": "Yes",
        "them": "Not offered"
      },
      {
        "feature": "Regulated-industry depth",
        "us": "DORA & regulated depth",
        "them": "SMB-focused"
      },
      {
        "feature": "Predictive gap detection",
        "us": "Yes",
        "them": "Partial"
      },
      {
        "feature": "Pricing",
        "us": "Published tiers",
        "them": "Affordable, published"
      }
    ],
    "whyChoose": [
      "Autonomy that extends to remediation, not just monitoring.",
      "Regulated-industry depth including DORA built in.",
      "The full EU regulatory stack in one platform.",
      "A Compliance Digital Twin for modeling before production."
    ],
    "whenFit": "Sprinto is fast and affordable, with a strong autonomous trust platform aimed at early-stage startups pursuing core frameworks. If budget and speed to a first SOC 2 or ISO 27001 are the priority and you don’t yet need regulated-industry or EU depth, Sprinto fits well.",
    "faqs": [
      {
        "q": "How is ComplyEasyAI different from Sprinto?",
        "a": "ComplyEasyAI extends autonomy to remediation with rollback, adds regulated-industry depth (including DORA) and the full EU stack, and offers a Compliance Digital Twin."
      },
      {
        "q": "Is ComplyEasyAI good for startups too?",
        "a": "Yes — the Foundation tier covers core frameworks for smaller teams, with room to grow into deeper coverage."
      },
      {
        "q": "Does it cover core frameworks affordably?",
        "a": "Yes — published tiers keep entry accessible while adding capabilities as you scale."
      },
      {
        "q": "What about AI governance?",
        "a": "First-class EU AI Act and NIST AI RMF coverage is included."
      }
    ]
  },
  "onetrust": {
    "slug": "onetrust",
    "path": "/compare/onetrust-alternative",
    "them": "OneTrust",
    "intro": "OneTrust is an enterprise privacy leader with a vast global footprint. Teams evaluate ComplyEasyAI as a OneTrust alternative for AI-native GRC that unifies security, AI governance and the EU stack with faster time-to-value and a fraction of an enterprise stack’s cost.",
    "rows": [
      {
        "feature": "Platform scope",
        "us": "AI-native GRC (14 frameworks)",
        "them": "Privacy-first + GRC add-ons"
      },
      {
        "feature": "Time-to-value",
        "us": "Audit-ready workspace day one",
        "them": "Complex, long implementation"
      },
      {
        "feature": "AI governance (EU AI Act, NIST AI RMF)",
        "us": "First-class",
        "them": "Add-on"
      },
      {
        "feature": "Autonomous remediation + rollback",
        "us": "Yes",
        "them": "Not offered"
      },
      {
        "feature": "Privacy program depth",
        "us": "Strong",
        "them": "Best-in-class"
      },
      {
        "feature": "Cost",
        "us": "Fraction of enterprise stack",
        "them": "Enterprise pricing"
      },
      {
        "feature": "Compliance Digital Twin",
        "us": "Yes",
        "them": "Not offered"
      }
    ],
    "whyChoose": [
      "One AI-native GRC platform across 14 frameworks, not privacy plus add-ons.",
      "An audit-ready workspace that runs from day one.",
      "First-class AI-governance coverage built in.",
      "Enterprise-grade coverage at a fraction of an enterprise stack cost."
    ],
    "whenFit": "OneTrust leads enterprise privacy with an enormous global footprint and deep, mature privacy tooling. For large enterprises whose primary need is privacy program management at global scale, OneTrust is an established leader — evaluate both against the breadth of your GRC needs and desired time-to-value.",
    "faqs": [
      {
        "q": "How is ComplyEasyAI different from OneTrust?",
        "a": "ComplyEasyAI is an AI-native GRC platform unifying security, AI governance and the EU stack with fast time-to-value, versus a privacy-first suite with GRC add-ons and longer implementation."
      },
      {
        "q": "Does ComplyEasyAI handle privacy?",
        "a": "Yes — GDPR, CCPA and privacy workflows are covered. OneTrust’s privacy depth is best-in-class; ComplyEasyAI unifies privacy within broader autonomous GRC."
      },
      {
        "q": "Is it faster to implement?",
        "a": "Yes — an audit-ready workspace runs from day one rather than a lengthy enterprise rollout."
      },
      {
        "q": "How does cost compare?",
        "a": "ComplyEasyAI is positioned at a fraction of a full enterprise GRC stack, with transparent tiers."
      }
    ]
  }
};
