/**
 * Comparison data for the /compare/* pages.
 *
 * Each entry powers a competitor-alternative page. The comparison rows describe
 * ComplyEasy AI's capabilities factually and use neutral values (e.g. 'Varies')
 * where a competitor's behavior depends on plan or is not publicly fixed. The
 * intent is a fair, capability-focused comparison rather than disparagement.
 */

export interface ComparisonRow {
  feature: string;
  complyEasy: string | boolean;
  competitor: string | boolean;
}

export interface ComparisonData {
  competitor: string;
  slug: string;
  intro: string;
  rows: ComparisonRow[];
  whyChoose: string[];
}

export type ComparisonSlug =
  | 'vanta-alternative'
  | 'drata-alternative'
  | 'secureframe-alternative'
  | 'sprinto-alternative'
  | 'onetrust-alternative';

export const comparisons: Record<ComparisonSlug, ComparisonData> = {
  'vanta-alternative': {
    competitor: 'Vanta',
    slug: 'vanta-alternative',
    intro:
      'Vanta is an established security and compliance automation platform focused on SOC 2, ISO 27001, and adjacent security frameworks. ComplyEasy AI is an AI-native alternative that adds agentic automation and first-class coverage of emerging AI regulations such as the EU AI Act and the NIST AI Risk Management Framework, alongside the traditional security frameworks. The table below compares the platforms on capability dimensions; values marked "Varies" depend on the competitor plan or are not publicly fixed.',
    rows: [
      { feature: 'AI-driven evidence collection', complyEasy: true, competitor: true },
      { feature: 'Agentic automation (autonomous remediation with rollback)', complyEasy: true, competitor: 'Varies' },
      { feature: 'SOC 2 Type I & II support', complyEasy: true, competitor: true },
      { feature: 'ISO 27001 support', complyEasy: true, competitor: true },
      { feature: 'EU AI Act coverage', complyEasy: true, competitor: 'Varies' },
      { feature: 'NIST AI RMF coverage', complyEasy: true, competitor: 'Varies' },
      { feature: 'Continuous control monitoring', complyEasy: true, competitor: true },
      { feature: 'Vendor / third-party risk management', complyEasy: true, competitor: true },
      { feature: 'Integration catalog', complyEasy: '100+ integrations', competitor: 'Extensive' },
      { feature: 'Bring-your-own-key (BYOK) encryption', complyEasy: true, competitor: 'Varies' },
      { feature: 'Zero-knowledge proof evidence sharing', complyEasy: true, competitor: false },
      { feature: 'Published pricing tiers', complyEasy: 'Yes (Foundation to Visionary)', competitor: 'Quote-based' },
      { feature: 'Cross-framework control mapping', complyEasy: true, competitor: true },
    ],
    whyChoose: [
      'AI-native architecture: autonomous agents collect evidence, map controls, and flag risks continuously rather than running scheduled checks.',
      'Broad coverage of AI-specific regulation (EU AI Act, NIST AI RMF) in addition to SOC 2 and ISO 27001.',
      'Transparent, published pricing tiers instead of quote-only access.',
      'Privacy-preserving evidence sharing through zero-knowledge proofs and BYOK encryption.',
    ],
  },
  'drata-alternative': {
    competitor: 'Drata',
    slug: 'drata-alternative',
    intro:
      'Drata is a widely used compliance automation platform known for continuous control monitoring across security frameworks. ComplyEasy AI offers a comparable continuous-monitoring foundation while differentiating on agentic AI automation and a broader regulatory surface that includes AI-governance frameworks. The comparison below is capability-focused; "Varies" denotes a value that depends on the competitor plan or is not publicly fixed.',
    rows: [
      { feature: 'AI-driven evidence collection', complyEasy: true, competitor: true },
      { feature: 'Agentic automation (autonomous remediation with rollback)', complyEasy: true, competitor: 'Varies' },
      { feature: 'Continuous control monitoring', complyEasy: true, competitor: true },
      { feature: 'SOC 2 Type I & II support', complyEasy: true, competitor: true },
      { feature: 'ISO 27001 support', complyEasy: true, competitor: true },
      { feature: 'GDPR support', complyEasy: true, competitor: true },
      { feature: 'EU AI Act coverage', complyEasy: true, competitor: 'Varies' },
      { feature: 'NIST AI RMF coverage', complyEasy: true, competitor: 'Varies' },
      { feature: 'Vendor / third-party risk management', complyEasy: true, competitor: true },
      { feature: 'Predictive risk forecasting', complyEasy: true, competitor: 'Varies' },
      { feature: 'Bring-your-own-key (BYOK) encryption', complyEasy: true, competitor: 'Varies' },
      { feature: 'Zero-knowledge proof evidence sharing', complyEasy: true, competitor: false },
      { feature: 'Published pricing tiers', complyEasy: 'Yes (Foundation to Visionary)', competitor: 'Quote-based' },
      { feature: 'Cross-framework control mapping', complyEasy: true, competitor: true },
    ],
    whyChoose: [
      'Agentic AI that can act on findings with blast-radius estimation and automatic rollback, not just surface them.',
      'Predictive risk forecasting that models compliance trajectory months ahead.',
      'Dedicated coverage for AI regulations (EU AI Act, NIST AI RMF) beyond classic security frameworks.',
      'Transparent published pricing so teams can evaluate cost without a sales cycle.',
    ],
  },
  'secureframe-alternative': {
    competitor: 'Secureframe',
    slug: 'secureframe-alternative',
    intro:
      'Secureframe is a compliance automation platform covering SOC 2, ISO 27001, HIPAA, and related frameworks with automated evidence collection. ComplyEasy AI provides similar framework breadth and adds AI-native agentic automation plus explicit coverage of AI-governance regulation. The table compares capabilities; "Varies" indicates a value that depends on the competitor plan or is not publicly fixed.',
    rows: [
      { feature: 'AI-driven evidence collection', complyEasy: true, competitor: true },
      { feature: 'Agentic automation (autonomous remediation with rollback)', complyEasy: true, competitor: 'Varies' },
      { feature: 'SOC 2 Type I & II support', complyEasy: true, competitor: true },
      { feature: 'ISO 27001 support', complyEasy: true, competitor: true },
      { feature: 'HIPAA support', complyEasy: true, competitor: true },
      { feature: 'GDPR support', complyEasy: true, competitor: true },
      { feature: 'EU AI Act coverage', complyEasy: true, competitor: 'Varies' },
      { feature: 'NIST AI RMF coverage', complyEasy: true, competitor: 'Varies' },
      { feature: 'Continuous control monitoring', complyEasy: true, competitor: true },
      { feature: 'Vendor / third-party risk management', complyEasy: true, competitor: true },
      { feature: 'Bring-your-own-key (BYOK) encryption', complyEasy: true, competitor: 'Varies' },
      { feature: 'Zero-knowledge proof evidence sharing', complyEasy: true, competitor: false },
      { feature: 'Published pricing tiers', complyEasy: 'Yes (Foundation to Visionary)', competitor: 'Quote-based' },
    ],
    whyChoose: [
      'AI agents handle evidence and remediation autonomously, reducing manual control upkeep.',
      'Coverage spans both traditional security frameworks and AI-specific regulation.',
      'Privacy-preserving evidence sharing via zero-knowledge proofs.',
      'Published pricing tiers support straightforward budget planning.',
    ],
  },
  'sprinto-alternative': {
    competitor: 'Sprinto',
    slug: 'sprinto-alternative',
    intro:
      'Sprinto is a compliance automation platform popular with fast-moving companies for SOC 2, ISO 27001, GDPR, and HIPAA readiness. ComplyEasy AI matches that framework coverage and extends it with agentic AI automation and first-class AI-regulation support. Capability values marked "Varies" depend on the competitor plan or are not publicly fixed.',
    rows: [
      { feature: 'AI-driven evidence collection', complyEasy: true, competitor: true },
      { feature: 'Agentic automation (autonomous remediation with rollback)', complyEasy: true, competitor: 'Varies' },
      { feature: 'SOC 2 Type I & II support', complyEasy: true, competitor: true },
      { feature: 'ISO 27001 support', complyEasy: true, competitor: true },
      { feature: 'GDPR support', complyEasy: true, competitor: true },
      { feature: 'HIPAA support', complyEasy: true, competitor: true },
      { feature: 'EU AI Act coverage', complyEasy: true, competitor: 'Varies' },
      { feature: 'NIST AI RMF coverage', complyEasy: true, competitor: 'Varies' },
      { feature: 'Continuous control monitoring', complyEasy: true, competitor: true },
      { feature: 'Vendor / third-party risk management', complyEasy: true, competitor: 'Varies' },
      { feature: 'Predictive risk forecasting', complyEasy: true, competitor: 'Varies' },
      { feature: 'Bring-your-own-key (BYOK) encryption', complyEasy: true, competitor: 'Varies' },
      { feature: 'Zero-knowledge proof evidence sharing', complyEasy: true, competitor: false },
      { feature: 'Published pricing tiers', complyEasy: 'Yes (Foundation to Visionary)', competitor: 'Quote-based' },
    ],
    whyChoose: [
      'Agentic automation acts on compliance gaps with rollback safety, beyond monitoring alone.',
      'Native EU AI Act and NIST AI RMF coverage for teams shipping AI products.',
      'Predictive forecasting highlights risks before they become audit findings.',
      'Transparent published pricing across four tiers.',
    ],
  },
  'onetrust-alternative': {
    competitor: 'OneTrust',
    slug: 'onetrust-alternative',
    intro:
      'OneTrust is a broad privacy, GRC, and data-governance suite widely adopted by larger enterprises. ComplyEasy AI offers an AI-native, more streamlined alternative that unifies security-framework automation, privacy management, and AI-governance in a single platform with agentic automation. Capability values marked "Varies" depend on the competitor module or plan, or are not publicly fixed.',
    rows: [
      { feature: 'AI-driven evidence collection', complyEasy: true, competitor: 'Varies' },
      { feature: 'Agentic automation (autonomous remediation with rollback)', complyEasy: true, competitor: false },
      { feature: 'SOC 2 Type I & II support', complyEasy: true, competitor: 'Varies' },
      { feature: 'ISO 27001 support', complyEasy: true, competitor: true },
      { feature: 'GDPR support', complyEasy: true, competitor: true },
      { feature: 'HIPAA support', complyEasy: true, competitor: true },
      { feature: 'EU AI Act coverage', complyEasy: true, competitor: 'Varies' },
      { feature: 'NIST AI RMF coverage', complyEasy: true, competitor: 'Varies' },
      { feature: 'Records of Processing (RoPA) / DPIA tooling', complyEasy: true, competitor: true },
      { feature: 'Vendor / third-party risk management', complyEasy: true, competitor: true },
      { feature: 'Continuous control monitoring', complyEasy: true, competitor: 'Varies' },
      { feature: 'Bring-your-own-key (BYOK) encryption', complyEasy: true, competitor: 'Varies' },
      { feature: 'Zero-knowledge proof evidence sharing', complyEasy: true, competitor: false },
      { feature: 'Published pricing tiers', complyEasy: 'Yes (Foundation to Visionary)', competitor: 'Quote-based' },
    ],
    whyChoose: [
      'A single AI-native platform spanning security frameworks, privacy management, and AI governance instead of separately licensed modules.',
      'Agentic automation that remediates findings autonomously with rollback safety.',
      'Privacy-preserving evidence sharing via zero-knowledge proofs and BYOK encryption.',
      'Transparent published pricing rather than enterprise quote-only access.',
    ],
  },
};

export const comparisonSlugs = Object.keys(comparisons) as ComparisonSlug[];
