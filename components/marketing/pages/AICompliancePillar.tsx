import React from 'react';
import { Link } from 'react-router';
import {
  Sparkles,
  ShieldCheck,
  Workflow,
  Scale,
  Eye,
  FileSearch,
  GitBranch,
  AlertTriangle,
  Layers,
  BrainCircuit,
  ClipboardCheck,
  Lock,
  ArrowRight,
} from 'lucide-react';
import MarketingLayout from '../MarketingLayout';
import Seo from '../../seo/Seo';
import JsonLd from '../../seo/JsonLd';
import { SITE_ORIGIN } from '../../seo/siteOrigin';
import {
  breadcrumbSchema,
  faqSchema,
  reviewedArticleSchema,
  reviewedWebPageSchema,
} from '../../seo/siteSchema';
import { ReviewedByline, TldrList } from '../answerFirst';
import { BYOK_PLAN, TRIAL_CTA } from '../../../data/marketingFacts';

// ---------------------------------------------------------------------------
// SEO copy
// ---------------------------------------------------------------------------
const SEO_TITLE = 'What Is AI Compliance? 2026 Guide | ComplyEasyAI';
const SEO_DESCRIPTION =
  'AI compliance means governing AI systems to meet laws, standards and ethics: the EU AI Act timeline after the 2026 Digital Omnibus, NIST AI RMF, ISO 42001 and AIUC-1.';
const SEO_KEYWORDS =
  'AI compliance, AI governance, AI risk management, EU AI Act compliance, EU AI Act timeline, Digital Omnibus, NIST AI RMF, ISO 42001, AIUC-1, responsible AI, AI regulation, AI audit';
const CANONICAL_PATH = '/platform/ai-compliance';
const ARTICLE_HEADLINE = 'What Is AI Compliance? (Updated September 2026)';
/** First publication of this guide. */
const DATE_PUBLISHED = '2026-06-07';
/** Last check of the facts below (EU AI Act dates, standards versions) against their sources. */
const LAST_REVIEWED = '2026-09-27';

/** The 40–60-word direct answer under the H1 (also the speakable selector). */
const DEFINITION =
  'AI compliance is the practice of governing AI systems so their design, development and use meet applicable laws, standards and ethical policies. It combines an AI inventory, risk classification, data governance, model documentation, bias testing, human oversight and continuous monitoring, so every system stays lawful, safe, transparent and accountable across its lifecycle.';

const TLDR = [
  'Start with an inventory: you cannot classify or govern AI you have not catalogued.',
  'EU AI Act high-risk duties apply from 2 December 2027 (Annex III) and 2 August 2028 (Annex I).',
  'The NIST AI RMF and ISO/IEC 42001 give the operating model; AIUC-1 adds agent-specific controls.',
  'Reuse SOC 2, ISO 27001 and GDPR evidence instead of duplicating it.',
];

/** Primary sources for the regulatory facts on this page. */
const SOURCES: { label: string; url: string }[] = [
  {
    label: 'European Commission, AI Act',
    url: 'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai',
  },
  {
    label: 'European Commission, AI Omnibus enters into force',
    url: 'https://digital-strategy.ec.europa.eu/en/news/ai-omnibus-enters-force',
  },
  {
    label: 'NIST, AI Risk Management Framework',
    url: 'https://www.nist.gov/itl/ai-risk-management-framework',
  },
  { label: 'ISO, ISO/IEC 42001:2023', url: 'https://www.iso.org/standard/42001' },
  { label: 'AIUC-1, changelog', url: 'https://standard.aiuc-1.com/changelog/' },
  {
    label: 'Texas Legislature, HB 149 (TRAIGA)',
    url: 'https://capitol.texas.gov/BillLookup/History.aspx?Bill=HB149&LegSess=89R',
  },
];

// ---------------------------------------------------------------------------
// On-page FAQ — also emitted as FAQPage JSON-LD
// ---------------------------------------------------------------------------
const faqItems: { q: string; a: string }[] = [
  {
    q: 'What is AI compliance?',
    a: 'AI compliance is the discipline of ensuring that the design, development, deployment, and ongoing operation of artificial-intelligence systems meet applicable laws, regulations, industry standards, and internal ethical policies. It spans data governance, model documentation, risk classification, bias and fairness testing, human oversight, transparency, and continuous monitoring of AI behavior in production.',
  },
  {
    q: 'How is AI compliance different from traditional IT compliance?',
    a: 'Traditional IT compliance focuses on static controls over systems and data — access management, encryption, change control, and audit logging. AI compliance adds model-specific obligations: documenting training data and intended use, classifying systems by risk, testing for bias and accuracy, ensuring meaningful human oversight, and continuously monitoring models that can drift or behave unpredictably after deployment. AI systems are probabilistic and evolving, so AI compliance is a continuous activity rather than a point-in-time certification.',
  },
  {
    q: 'Which regulations and frameworks govern AI compliance?',
    a: 'Key frameworks include the EU AI Act (a risk-tiered law for AI providers and deployers), the NIST AI Risk Management Framework (a voluntary GOVERN-MAP-MEASURE-MANAGE structure), and ISO/IEC 42001 (a certifiable AI management-system standard). AI systems that process personal data also fall under privacy laws such as GDPR and CCPA, and sector rules in healthcare, finance, and employment add further obligations. AIUC-1 adds a certifiable standard specifically for AI agents.',
  },
  {
    q: 'What are the risk categories under the EU AI Act?',
    a: 'The EU AI Act sorts AI systems into four tiers: unacceptable-risk systems that are prohibited, high-risk systems that must meet strict requirements for risk management, data governance, technical documentation, human oversight, and conformity assessment, limited-risk systems subject to transparency duties, and minimal-risk systems with no specific obligations. Correctly classifying each system is the first step of EU AI Act compliance.',
  },
  {
    q: 'Who is responsible for AI compliance in an organization?',
    a: 'AI compliance is a shared responsibility. Executive leadership and a governance body set policy and risk appetite, data-science and engineering teams document models and implement controls, legal and compliance functions interpret regulations and manage conformity assessments, and security teams protect models and training data. Many organizations appoint an AI governance lead or committee to coordinate these roles and maintain a central inventory of AI systems.',
  },
  {
    q: 'How can AI compliance be automated?',
    a: 'A compliance platform can maintain a live inventory of AI systems, map each to the relevant controls across frameworks, collect evidence automatically through integrations, generate the technical documentation that regulations require, and monitor models for drift, bias, and policy violations. Automation replaces manual evidence gathering and spreadsheets with continuous, auditable workflows, so teams stay ready for an audit or conformity assessment at any time.',
  },
  {
    q: 'When do organizations need to start on AI compliance?',
    a: 'Now, if you build, fine-tune, buy or deploy AI that affects people or business decisions. Under the EU AI Act, prohibitions and general-purpose AI duties already apply, transparency duties start in August 2026, and high-risk duties apply from 2 December 2027. Inventory and classification take time, so start well before the deadline.',
  },
  {
    q: 'Does AI compliance slow down AI development?',
    a: 'Well-implemented AI compliance is a guardrail rather than a roadblock. By embedding documentation, risk assessment, and monitoring into the model lifecycle from the start, teams catch issues earlier, reduce rework, and ship with confidence. Automating evidence collection and documentation removes most of the manual overhead that would otherwise compete with engineering time.',
  },
  {
    q: 'What is the EU AI Act deadline for high-risk AI?',
    a: 'After the 2026 Digital Omnibus (Regulation (EU) 2026/1744), stand-alone high-risk systems listed in Annex III must comply from 2 December 2027, and high-risk AI built into products covered by Annex I from 2 August 2028. The original date was 2 August 2026.',
  },
];

// ---------------------------------------------------------------------------
// Content building blocks
// ---------------------------------------------------------------------------
const requirements: { icon: React.FC<any>; title: string; body: string }[] = [
  {
    icon: Layers,
    title: 'AI system inventory',
    body: 'A complete, maintained register of every AI and machine-learning system in use — built in-house, fine-tuned, or procured — including its purpose, data sources, owners, and risk level. You cannot govern what you have not catalogued.',
  },
  {
    icon: Scale,
    title: 'Risk classification',
    body: 'Each system is assessed against frameworks such as the EU AI Act and NIST AI RMF to determine its risk tier. Classification drives the depth of controls, documentation, and oversight a system requires.',
  },
  {
    icon: FileSearch,
    title: 'Data governance',
    body: 'Training, validation, and input data must be documented for provenance, quality, and bias. Where personal data is involved, privacy obligations under GDPR, CCPA, and HIPAA apply alongside AI-specific rules.',
  },
  {
    icon: ClipboardCheck,
    title: 'Technical documentation',
    body: 'High-risk systems require detailed records: intended purpose, model architecture, performance metrics, limitations, and the risk-management measures applied. This documentation supports conformity assessments and audits.',
  },
  {
    icon: Eye,
    title: 'Human oversight',
    body: 'Meaningful human review must be designed into consequential AI decisions, with the ability to interpret outputs, intervene, and override the system when needed.',
  },
  {
    icon: GitBranch,
    title: 'Continuous monitoring',
    body: 'Models drift, data shifts, and behavior changes after deployment. Ongoing monitoring for accuracy, bias, security, and policy violations keeps controls effective over the entire lifecycle.',
  },
];

const challenges: { title: string; body: string }[] = [
  {
    title: 'A fragmented and fast-moving regulatory landscape',
    body: 'The EU AI Act, NIST AI RMF, ISO/IEC 42001, state-level AI laws, and sector rules each carry distinct obligations and timelines. Tracking what applies to which system — and keeping current as new rules arrive — is a continuous effort that manual processes struggle to sustain.',
  },
  {
    title: 'Shadow AI and incomplete inventories',
    body: 'Teams adopt large-language-model tools and embed AI features faster than governance can catalogue them. Ungoverned "shadow AI" creates blind spots where unassessed systems make consequential decisions outside any compliance program.',
  },
  {
    title: 'Documenting probabilistic systems',
    body: 'Unlike deterministic software, AI systems produce outputs that vary and evolve. Capturing training data lineage, model behavior, performance, and limitations in audit-ready form is demanding and easily falls out of date.',
  },
  {
    title: 'Bias, fairness, and explainability',
    body: 'Demonstrating that a model is fair and that its decisions can be explained requires structured testing, metrics, and records — capabilities many teams have not yet built into their model lifecycle.',
  },
  {
    title: 'Overlap with existing compliance programs',
    body: 'AI obligations intersect heavily with security and privacy frameworks. Without shared control mapping, teams re-document the same evidence for SOC 2, ISO 27001, GDPR, and AI regulations separately, multiplying effort.',
  },
  {
    title: 'Post-deployment drift',
    body: 'A model that was compliant at launch can degrade as inputs change. Detecting drift and re-validating controls demands monitoring that runs continuously rather than at audit time.',
  },
];

const helps: { icon: React.FC<any>; title: string; body: string }[] = [
  {
    icon: BrainCircuit,
    title: 'Risk classification and AI inventory',
    body: 'Maintain a central register of AI systems and classify each against the EU AI Act tiers and NIST AI RMF functions, so the right controls follow automatically from each system’s risk level.',
  },
  {
    icon: ClipboardCheck,
    title: 'Automated technical documentation',
    body: 'Generate the structured technical documentation high-risk systems require — intended purpose, data governance, performance, and risk-management measures — and keep it versioned as systems change.',
  },
  {
    icon: Workflow,
    title: 'Conformity and transparency workflows',
    body: 'Structure conformity-assessment, transparency, and human-oversight workflows so the obligations the EU AI Act places on providers and deployers are tracked to completion.',
  },
  {
    icon: ShieldCheck,
    title: 'Unified control mapping',
    body: 'Map AI controls alongside SOC 2, ISO 27001, GDPR, and HIPAA so overlapping requirements are evidenced once and reused, instead of being re-documented per framework.',
  },
  {
    icon: AlertTriangle,
    title: 'Continuous drift and risk monitoring',
    body: 'Monitor compliance posture continuously and surface drift before it becomes a finding, with an audit trail capturing every control change and evidence update.',
  },
  {
    icon: Lock,
    title: 'Security by architecture',
    body: `Protect compliance data with encryption at rest and TLS in transit, multi-factor authentication, role-based access control and audit logging, plus bring-your-own-key encryption on the ${BYOK_PLAN} plan.`,
  },
];

// ---------------------------------------------------------------------------
// Procedural "How to get AI compliant" steps — also emitted as HowTo JSON-LD
// ---------------------------------------------------------------------------
const howToSteps: { name: string; text: string }[] = [
  {
    name: 'Inventory your AI systems',
    text: 'Build a central register of every AI and machine-learning system you build, fine-tune, or procure, capturing its purpose, data sources, owners, and where it is deployed.',
  },
  {
    name: 'Classify each system by risk',
    text: 'Assess every system against frameworks such as the EU AI Act tiers and the NIST AI RMF so the depth of controls, documentation, and oversight follows from its risk level.',
  },
  {
    name: 'Establish governance and ownership',
    text: 'Define policies, assign accountable owners, and set the human-oversight requirements for consequential decisions so responsibility for each system is unambiguous.',
  },
  {
    name: 'Document data and models',
    text: 'Record training, validation, and input data provenance and quality alongside model architecture, intended purpose, performance, and limitations to satisfy technical-documentation obligations.',
  },
  {
    name: 'Map and collect control evidence',
    text: 'Map AI controls to the relevant frameworks, then collect evidence automatically through integrations so the same evidence is reused across SOC 2, ISO 27001, GDPR, and AI regulations.',
  },
  {
    name: 'Monitor continuously and remediate',
    text: 'Watch for model drift, bias, and policy violations after deployment, surface gaps as findings, and track remediation so controls stay effective over the entire lifecycle.',
  },
];

// ---------------------------------------------------------------------------
// Reusable section heading
// ---------------------------------------------------------------------------
const SectionHeading: React.FC<{ eyebrow?: string; children: React.ReactNode }> = ({
  eyebrow,
  children,
}) => (
  <div className="mx-auto max-w-3xl text-center">
    {eyebrow ? (
      <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
        {eyebrow}
      </p>
    ) : null}
    <h2 className="text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl dark:text-white">
      {children}
    </h2>
  </div>
);

const AICompliancePillar: React.FC = () => {
  return (
    <MarketingLayout>
      <Seo
        title={SEO_TITLE}
        description={SEO_DESCRIPTION}
        canonicalPath={CANONICAL_PATH}
        keywords={SEO_KEYWORDS}
        ogType="article"
      />
      <JsonLd data={faqSchema(faqItems)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', url: `${SITE_ORIGIN}/` },
          {
            name: 'AI Compliance',
            url: `${SITE_ORIGIN}/platform/ai-compliance`,
          },
        ])}
      />
      <JsonLd
        data={reviewedArticleSchema({
          headline: ARTICLE_HEADLINE,
          description: SEO_DESCRIPTION,
          path: CANONICAL_PATH,
          datePublished: DATE_PUBLISHED,
          dateModified: LAST_REVIEWED,
          keywords: ['AI compliance', 'EU AI Act', 'NIST AI RMF', 'ISO/IEC 42001', 'AIUC-1'],
        })}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          name: 'How to get AI compliant',
          description:
            'A six-step procedure for building an AI compliance program — from inventorying AI systems and classifying them by risk to documenting models, mapping controls, and monitoring continuously.',
          step: howToSteps.map((step, index) => ({
            '@type': 'HowToStep',
            position: index + 1,
            name: step.name,
            text: step.text,
          })),
        }}
      />
      <JsonLd
        data={{
          ...reviewedWebPageSchema({
            name: SEO_TITLE,
            description: SEO_DESCRIPTION,
            path: CANONICAL_PATH,
            lastReviewed: LAST_REVIEWED,
            datePublished: DATE_PUBLISHED,
            about: 'AI compliance',
            citations: SOURCES.map((source) => source.url),
          }),
          speakable: {
            '@type': 'SpeakableSpecification',
            cssSelector: ['#ai-compliance-definition'],
          },
        }}
      />

      {/* ============================ Hero / answer ======================== */}
      <section className="relative overflow-hidden">
        <div className="mesh-gradient absolute inset-0 -z-10 opacity-60" aria-hidden="true" />
        <div className="dot-pattern absolute inset-0 -z-10 opacity-40" aria-hidden="true" />
        <div className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-surface-500 dark:text-surface-400">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link to="/" className="hover:text-brand-600 dark:hover:text-brand-400">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="font-medium text-surface-700 dark:text-surface-200">AI Compliance</li>
            </ol>
          </nav>

          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700 dark:border-brand-800 dark:bg-brand-950/60 dark:text-brand-300">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Updated September 2026
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-surface-900 sm:text-5xl dark:text-white">
            What is <span className="text-gradient">AI compliance</span>?
          </h1>

          <p className="mt-6 text-xl leading-relaxed text-surface-700 dark:text-surface-200">
            The one-paragraph answer, the laws that apply, and a six-step plan to get there.
          </p>

          {/* Answer-first definition block — the quotable direct answer */}
          <p
            id="ai-compliance-definition"
            className="mt-4 text-lg leading-relaxed text-surface-700 dark:text-surface-200"
          >
            {DEFINITION}
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/demo"
              className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              Book a demo
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              to={TRIAL_CTA.to}
              className="inline-flex items-center gap-2 rounded-full border border-surface-300 bg-white px-6 py-3 text-sm font-semibold text-surface-800 transition-colors hover:border-brand-400 hover:text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100 dark:hover:text-brand-300"
            >
              {TRIAL_CTA.label}
            </Link>
          </div>

          <TldrList items={TLDR} className="mt-10" />

          <ReviewedByline lastReviewed={LAST_REVIEWED} className="mt-6" />
          <p className="mt-2 text-[13px] leading-relaxed text-surface-500 dark:text-surface-400">
            <span className="font-mono text-[11px] uppercase tracking-[0.12em]">Sources:</span>{' '}
            {SOURCES.map((source, index) => (
              <React.Fragment key={source.url}>
                {index > 0 ? <span aria-hidden="true"> · </span> : null}
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-white/20 underline-offset-2 hover:text-surface-300"
                >
                  {source.label}
                </a>
              </React.Fragment>
            ))}
          </p>
        </div>
      </section>

      {/* ======================= Why it matters ============================ */}
      <section className="border-t border-surface-200/70 dark:border-surface-800">
        <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl dark:text-white">
            Why does AI compliance matter?
          </h2>
          <div className="mt-6 space-y-5 text-lg leading-relaxed text-surface-700 dark:text-surface-300">
            <p>
              Artificial intelligence now makes or shapes decisions that affect hiring, lending,
              healthcare, and access to public services. When those systems are biased, opaque, or
              insecure, the consequences fall on real people — and increasingly on the organizations
              that build and operate them. AI compliance exists to manage that risk: it gives
              organizations a structured way to prove their AI systems are lawful, fair, safe, and
              accountable.
            </p>
            <p>
              The regulatory environment has matured quickly. The European Union&rsquo;s AI Act
              established the first comprehensive, risk-tiered law for AI, with significant penalties
              for non-compliance. Standards bodies have published the NIST AI Risk Management
              Framework and the certifiable ISO/IEC 42001 management-system standard, while privacy
              regulators apply existing laws such as GDPR and CCPA to AI that processes personal
              data. The direction is consistent: AI systems must be documented, governed, and
              monitored, not deployed and forgotten.
            </p>
            <p>
              Beyond avoiding penalties, AI compliance builds trust. Customers, partners, and
              auditors want evidence that AI is being used responsibly. A mature compliance program
              turns that evidence into a competitive advantage — and turns governance from a
              last-minute scramble into a repeatable, auditable practice.
            </p>
          </div>
        </div>
      </section>

      {/* ========================= Key requirements ======================== */}
      <section className="border-t border-surface-200/70 bg-surface-50/60 dark:border-surface-800 dark:bg-surface-900/40">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="How it works">
            What does AI compliance require?
          </SectionHeading>
          <p className="mx-auto mt-5 max-w-3xl text-center text-lg text-surface-600 dark:text-surface-400">
            Across the major frameworks, AI compliance reduces to a recognizable set of building
            blocks. Each requirement scales with the risk level of the system it governs.
          </p>
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {requirements.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-surface-800 dark:bg-surface-900"
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-surface-600 dark:text-surface-400">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== Frameworks landscape ======================== */}
      <section className="border-t border-surface-200/70 dark:border-surface-800">
        <div className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl dark:text-white">
            Which laws and frameworks govern AI?
          </h2>
          <div className="mt-8 space-y-8">
            <div>
              <h3 className="text-xl font-semibold text-surface-900 dark:text-white">
                EU AI Act
              </h3>
              <p className="mt-2 text-lg leading-relaxed text-surface-700 dark:text-surface-300">
                The EU AI Act is the world&rsquo;s first comprehensive AI law. It classifies systems
                into four risk tiers — unacceptable (prohibited), high, limited, and minimal — and
                imposes the heaviest obligations on high-risk systems, including risk management,
                data governance, technical documentation, human oversight, and conformity
                assessment. Its requirements apply to providers and deployers, including those
                outside the EU whose systems reach EU users.{' '}
                <Link
                  to="/eu-ai-act"
                  className="font-medium text-brand-600 underline-offset-2 hover:underline dark:text-brand-400"
                >
                  Explore the EU AI Act guide
                </Link>
                .
              </p>
              <p className="mt-3 text-lg leading-relaxed text-surface-700 dark:text-surface-300">
                Key dates: prohibited practices have been banned since 2 February 2025 and
                general-purpose AI duties have applied since 2 August 2025. Transparency duties apply
                from August 2026. After the 2026 Digital Omnibus (Regulation (EU) 2026/1744),
                high-risk duties apply from 2 December 2027 for Annex III systems and 2 August 2028
                for AI in regulated products.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-surface-900 dark:text-white">
                NIST AI Risk Management Framework
              </h3>
              <p className="mt-2 text-lg leading-relaxed text-surface-700 dark:text-surface-300">
                The NIST AI RMF is a voluntary, widely adopted framework organized around four
                functions — GOVERN, MAP, MEASURE, and MANAGE. It helps organizations identify,
                assess, and treat the risks of AI systems in a structured, repeatable way, and pairs
                naturally with regulatory obligations as an operational backbone.{' '}
                <Link
                  to="/nist-ai-rmf"
                  className="font-medium text-brand-600 underline-offset-2 hover:underline dark:text-brand-400"
                >
                  Explore the NIST AI RMF guide
                </Link>
                .
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-surface-900 dark:text-white">
                ISO/IEC 42001 and privacy laws
              </h3>
              <p className="mt-2 text-lg leading-relaxed text-surface-700 dark:text-surface-300">
                <Link
                  to="/iso-42001"
                  className="font-medium text-brand-600 underline-offset-2 hover:underline dark:text-brand-400"
                >
                  ISO/IEC 42001
                </Link>{' '}
                is a certifiable AI management-system standard — the AI counterpart to ISO 27001 for
                information security — that establishes governance, accountability, and continual
                improvement for AI. Where AI processes personal data, privacy regulations such as{' '}
                <Link
                  to="/gdpr"
                  className="font-medium text-brand-600 underline-offset-2 hover:underline dark:text-brand-400"
                >
                  GDPR
                </Link>{' '}
                add requirements for lawful basis, transparency, and automated-decision safeguards,
                while security frameworks such as{' '}
                <Link
                  to="/iso-27001"
                  className="font-medium text-brand-600 underline-offset-2 hover:underline dark:text-brand-400"
                >
                  ISO 27001
                </Link>{' '}
                protect the models and data themselves.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-surface-900 dark:text-white">AIUC-1</h3>
              <p className="mt-2 text-lg leading-relaxed text-surface-700 dark:text-surface-300">
                AIUC-1 is a certification standard for AI agents, with 51 requirements across data
                and privacy, security, safety, reliability, accountability and society in its 15 July
                2026 release.{' '}
                <Link
                  to="/aiuc-1"
                  className="font-medium text-brand-600 underline-offset-2 hover:underline dark:text-brand-400"
                >
                  Explore the AIUC-1 guide
                </Link>
                .
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-surface-900 dark:text-white">
                US state laws
              </h3>
              <p className="mt-2 text-lg leading-relaxed text-surface-700 dark:text-surface-300">
                In the US there is no comprehensive federal AI law. State laws such as the Texas
                Responsible Artificial Intelligence Governance Act, in effect since 1 January 2026,
                and sector regulators add obligations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================= Common challenges ======================= */}
      <section className="border-t border-surface-200/70 bg-surface-50/60 dark:border-surface-800 dark:bg-surface-900/40">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="What makes it hard">
            What makes AI compliance hard?
          </SectionHeading>
          <div className="mt-14 grid gap-6 md:grid-cols-2">
            {challenges.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-800 dark:bg-surface-900"
              >
                <h3 className="flex items-start gap-3 text-lg font-semibold text-surface-900 dark:text-white">
                  <AlertTriangle
                    className="mt-0.5 h-5 w-5 flex-none text-brand-600 dark:text-brand-400"
                    aria-hidden="true"
                  />
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-surface-600 dark:text-surface-400">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== How to get AI compliant ===================== */}
      <section className="border-t border-surface-200/70 dark:border-surface-800">
        <div className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Step by step">
            How do you become AI compliant?
          </SectionHeading>
          <p className="mx-auto mt-5 max-w-3xl text-center text-lg text-surface-600 dark:text-surface-400">
            Building an AI compliance program follows a repeatable sequence. These six steps take a
            system from undocumented to continuously governed.
          </p>
          <ol className="mt-12 space-y-5">
            {howToSteps.map((step, index) => (
              <li
                key={step.name}
                className="flex gap-5 rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-800 dark:bg-surface-900"
              >
                <span
                  className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-brand-600/10 text-base font-bold text-brand-600 dark:bg-brand-400/10 dark:text-brand-400"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
                    {step.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-surface-600 dark:text-surface-400">
                    {step.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ====================== How ComplyEasyAI helps ==================== */}
      <section className="border-t border-surface-200/70 dark:border-surface-800">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="The platform">
            How does ComplyEasyAI automate AI compliance?
          </SectionHeading>
          <p className="mx-auto mt-5 max-w-3xl text-center text-lg text-surface-600 dark:text-surface-400">
            ComplyEasyAI turns AI compliance from a manual, spreadsheet-driven effort into a
            continuous, automated program — mapping AI obligations alongside your security and
            privacy frameworks so evidence is collected once and reused everywhere.
          </p>
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {helps.map((item) => (
              <div
                key={item.title}
                className="group rounded-2xl border border-surface-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md dark:border-surface-800 dark:bg-surface-900 dark:hover:border-brand-700"
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600/10 text-brand-600 dark:bg-brand-400/10 dark:text-brand-400">
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-surface-600 dark:text-surface-400">
                  {item.body}
                </p>
              </div>
            ))}
          </div>

          {/* Product module + sibling pillar links */}
          <div className="mx-auto mt-14 max-w-3xl rounded-2xl border border-surface-200 bg-surface-50/70 p-8 dark:border-surface-800 dark:bg-surface-900/60">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
              Connect AI compliance to the rest of your program
            </h3>
            <p className="mt-3 text-surface-600 dark:text-surface-400">
              AI governance rarely stands alone. Inside ComplyEasyAI, your AI controls live next to
              the frameworks and modules that support them — risk management, evidence collection,
              and unified governance across every standard you pursue.
            </p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              <li>
                <Link
                  to="/iso-42001"
                  className="flex items-center gap-2 text-brand-600 hover:underline dark:text-brand-400"
                >
                  <ArrowRight className="h-4 w-4 flex-none" aria-hidden="true" />
                  ISO 42001 AI management system
                </Link>
              </li>
              <li>
                <Link
                  to="/grc"
                  className="flex items-center gap-2 text-brand-600 hover:underline dark:text-brand-400"
                >
                  <ArrowRight className="h-4 w-4 flex-none" aria-hidden="true" />
                  Unified GRC platform
                </Link>
              </li>
              <li>
                <Link
                  to="/eu-ai-act"
                  className="flex items-center gap-2 text-brand-600 hover:underline dark:text-brand-400"
                >
                  <ArrowRight className="h-4 w-4 flex-none" aria-hidden="true" />
                  EU AI Act compliance
                </Link>
              </li>
              <li>
                <Link
                  to="/nist-ai-rmf"
                  className="flex items-center gap-2 text-brand-600 hover:underline dark:text-brand-400"
                >
                  <ArrowRight className="h-4 w-4 flex-none" aria-hidden="true" />
                  NIST AI RMF compliance
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ============================== FAQ =============================== */}
      <section className="border-t border-surface-200/70 bg-surface-50/60 dark:border-surface-800 dark:bg-surface-900/40">
        <div className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="FAQ">AI compliance: frequently asked questions</SectionHeading>
          <dl className="mt-12 space-y-6">
            {faqItems.map((item) => (
              <div
                key={item.q}
                className="rounded-2xl border border-surface-200 bg-white p-6 dark:border-surface-800 dark:bg-surface-900"
              >
                <dt className="text-lg font-semibold text-surface-900 dark:text-white">
                  {item.q}
                </dt>
                <dd className="mt-2 leading-relaxed text-surface-600 dark:text-surface-400">
                  {item.a}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ============================ Closing CTA ========================== */}
      <section className="relative overflow-hidden border-t border-surface-200/70 dark:border-surface-800">
        <div className="mesh-gradient absolute inset-0 -z-10 opacity-70" aria-hidden="true" />
        <div className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl dark:text-white">
            Make AI compliance continuous, not a fire drill
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-surface-600 dark:text-surface-300">
            Inventory your AI systems, classify them by risk, generate the documentation regulations
            require, and monitor for drift — all in one platform that maps AI obligations alongside
            your security and privacy frameworks.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/demo"
              className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              Book a demo
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              to={TRIAL_CTA.to}
              className="inline-flex items-center gap-2 rounded-full border border-surface-300 bg-white px-7 py-3 text-sm font-semibold text-surface-800 transition-colors hover:border-brand-400 hover:text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100 dark:hover:text-brand-300"
            >
              {TRIAL_CTA.label}
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
};

export default AICompliancePillar;
export { AICompliancePillar };
