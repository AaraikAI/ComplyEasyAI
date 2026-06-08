import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BrainCircuit,
  ShieldCheck,
  FileText,
  Layers,
  Eye,
  AlertTriangle,
  ClipboardCheck,
  ScrollText,
  GitMerge,
  Users,
  Scale,
  CheckCircle2,
} from 'lucide-react';
import MarketingLayout from '../MarketingLayout';
import Seo from '../../seo/Seo';
import JsonLd from '../../seo/JsonLd';
import { breadcrumbSchema, faqSchema, organizationSchema } from '../../seo/siteSchema';

// ---------------------------------------------------------------------------
// SEO copy
// ---------------------------------------------------------------------------
const SEO_TITLE =
  'EU AI Act Compliance: Requirements, Risk Tiers & Checklist | ComplyEasy AI';
const SEO_DESCRIPTION =
  'A practical guide to EU AI Act compliance: risk classification, obligations for high-risk and GPAI systems, conformity assessment, transparency, and how ComplyEasy AI automates the work.';
const SEO_KEYWORDS =
  'EU AI Act compliance, EU AI Act requirements, high-risk AI systems, AI Act conformity assessment, GPAI obligations, AI governance, prohibited AI practices, AI transparency, AI risk classification';

const CANONICAL_PATH = '/eu-ai-act';

// ---------------------------------------------------------------------------
// The four EU AI Act risk tiers
// ---------------------------------------------------------------------------
const RISK_TIERS: { name: string; summary: string; icon: React.FC<any> }[] = [
  {
    name: 'Unacceptable risk',
    summary:
      'A short list of prohibited practices — including social scoring by public authorities, untargeted facial-recognition scraping, and most real-time remote biometric identification in public spaces — that may not be placed on the EU market at all.',
    icon: AlertTriangle,
  },
  {
    name: 'High risk',
    summary:
      'AI used in safety components of regulated products, plus systems in areas such as employment, education, essential services, law enforcement, and migration. These carry the most extensive obligations and require conformity assessment before deployment.',
    icon: Scale,
  },
  {
    name: 'Limited risk',
    summary:
      'Systems that interact with people or generate content — chatbots, emotion-recognition tools, and synthetic media — carry transparency duties, such as telling users they are dealing with AI and labelling AI-generated or manipulated content.',
    icon: Eye,
  },
  {
    name: 'Minimal risk',
    summary:
      'The large majority of AI applications, such as spam filters and recommendation engines, face no mandatory obligations under the Act, though voluntary codes of conduct are encouraged.',
    icon: CheckCircle2,
  },
];

// ---------------------------------------------------------------------------
// Core obligations for high-risk AI systems
// ---------------------------------------------------------------------------
const HIGH_RISK_OBLIGATIONS: { title: string; desc: string; icon: React.FC<any> }[] = [
  {
    title: 'Risk management system',
    desc: 'Establish a continuous, iterative risk-management process that runs across the entire lifecycle of the AI system, identifying and mitigating reasonably foreseeable risks to health, safety, and fundamental rights.',
    icon: ShieldCheck,
  },
  {
    title: 'Data and data governance',
    desc: 'Use training, validation, and testing data sets that are relevant, sufficiently representative, and examined for bias, with documented data-governance practices appropriate to the intended purpose.',
    icon: Layers,
  },
  {
    title: 'Technical documentation',
    desc: 'Maintain detailed technical documentation demonstrating conformity, drawn up before the system is placed on the market and kept up to date throughout its operational life.',
    icon: FileText,
  },
  {
    title: 'Record-keeping and logging',
    desc: 'Design systems to automatically record events (logs) over their lifetime so that operation can be traced, monitored, and audited after the fact.',
    icon: ScrollText,
  },
  {
    title: 'Transparency and instructions',
    desc: 'Provide deployers with clear instructions for use so they can interpret output correctly and operate the system within its intended purpose and limitations.',
    icon: Eye,
  },
  {
    title: 'Human oversight',
    desc: 'Build in measures that enable people to effectively oversee the system, intervene or interrupt operation, and avoid over-reliance (automation bias) on its output.',
    icon: Users,
  },
  {
    title: 'Accuracy, robustness, and cybersecurity',
    desc: 'Achieve appropriate levels of accuracy, robustness, and cybersecurity, and perform consistently against those levels throughout the lifecycle.',
    icon: GitMerge,
  },
  {
    title: 'Conformity assessment and CE marking',
    desc: 'Complete the applicable conformity-assessment procedure, draw up an EU declaration of conformity, affix CE marking, and register the system in the EU database before placing it on the market.',
    icon: ClipboardCheck,
  },
];

// ---------------------------------------------------------------------------
// Common challenges
// ---------------------------------------------------------------------------
const CHALLENGES: { title: string; desc: string }[] = [
  {
    title: 'Classifying systems correctly',
    desc: 'The obligations that apply depend entirely on a system’s risk tier and your role (provider, deployer, importer, or distributor). Many teams struggle to inventory every AI system in use, determine which fall into the high-risk Annex III categories, and keep that classification current as features change.',
  },
  {
    title: 'Overlap with existing programs',
    desc: 'EU AI Act controls intersect heavily with GDPR (data governance, DPIAs), ISO/IEC 42001 (AI management systems), and the NIST AI RMF. Duplicating evidence across these programs wastes effort; mapping them once is hard to do by hand.',
  },
  {
    title: 'Generative and general-purpose AI',
    desc: 'Providers of general-purpose AI (GPAI) models face their own obligations — technical documentation, training-data summaries, and copyright policy — with stricter duties for models posing systemic risk. Deployers building on third-party foundation models must understand what their upstream provider supplies.',
  },
  {
    title: 'Phased deadlines',
    desc: 'The Act applies in stages: prohibited practices and AI-literacy duties first, then GPAI obligations, then the bulk of high-risk requirements. Tracking which obligations are live for which systems, and evidencing readiness ahead of each date, is an ongoing program rather than a one-time project.',
  },
  {
    title: 'Maintaining living documentation',
    desc: 'Technical documentation, risk assessments, and logs are not point-in-time artifacts — they must stay accurate as models are retrained and redeployed. Manual document control rarely keeps pace with the rate of change in AI systems.',
  },
];

// ---------------------------------------------------------------------------
// On-page FAQ — defensible, capability-based answers an AI engine can quote
// ---------------------------------------------------------------------------
const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: 'What is the EU AI Act?',
    a: 'The EU AI Act (Regulation (EU) 2024/1689) is the European Union’s comprehensive law governing artificial intelligence. It takes a risk-based approach, sorting AI systems into four tiers — unacceptable, high, limited, and minimal risk — and assigns obligations accordingly, with the strictest requirements falling on high-risk systems and on providers of general-purpose AI models.',
  },
  {
    q: 'Who does the EU AI Act apply to?',
    a: 'The Act applies to providers that place AI systems or general-purpose AI models on the EU market, deployers that use AI systems in the EU, and importers and distributors — regardless of where they are established. Providers and deployers located outside the EU are in scope when the output of their AI system is used within the EU, giving the regulation broad extraterritorial reach.',
  },
  {
    q: 'What are high-risk AI systems under the EU AI Act?',
    a: 'High-risk AI systems are those used as safety components of products already regulated under EU law, and systems listed in Annex III covering areas such as biometrics, critical infrastructure, education, employment, access to essential services, law enforcement, migration, and the administration of justice. They must meet requirements for risk management, data governance, technical documentation, logging, transparency, human oversight, and accuracy before they can be placed on the market.',
  },
  {
    q: 'What are the penalties for non-compliance with the EU AI Act?',
    a: 'Penalties are tiered. Engaging in prohibited AI practices can lead to fines of up to 35 million euro or 7% of total worldwide annual turnover, whichever is higher. Breaching most other obligations can lead to fines of up to 15 million euro or 3% of turnover, and supplying incorrect or misleading information to authorities up to 7.5 million euro or 1% of turnover.',
  },
  {
    q: 'When does the EU AI Act take effect?',
    a: 'The Act entered into force in 2024 and applies in phases. Bans on prohibited practices and AI-literacy obligations apply first, followed by obligations for general-purpose AI models, then the broader set of high-risk system requirements. Because the timeline is staggered, organizations should map each obligation to its applicable date and the specific systems it affects.',
  },
  {
    q: 'What are the obligations for general-purpose AI (GPAI) models?',
    a: 'Providers of general-purpose AI models must maintain technical documentation, provide information to downstream providers who build on the model, publish a sufficiently detailed summary of training content, and put a policy in place to respect EU copyright law. Models judged to pose systemic risk face additional duties, including model evaluation, adversarial testing, incident tracking, and cybersecurity protection.',
  },
  {
    q: 'How is the EU AI Act different from GDPR?',
    a: 'GDPR governs how personal data is processed, while the EU AI Act governs the safety and trustworthiness of AI systems themselves regardless of whether they process personal data. The two overlap — for example, an AI system using personal data triggers both — so well-run programs map controls across both regimes rather than treating them separately.',
  },
  {
    q: 'How does ComplyEasy AI help with EU AI Act compliance?',
    a: 'ComplyEasy AI helps you inventory and classify AI systems by risk tier, structure the technical documentation and conformity-assessment workflows high-risk systems require, track human-oversight and transparency obligations, and reuse evidence shared with adjacent programs such as ISO/IEC 42001, the NIST AI RMF, and GDPR. Continuous monitoring keeps documentation and risk assessments current as systems change.',
  },
];

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------
const SectionHeading: React.FC<{ eyebrow?: string; title: string; children?: React.ReactNode }> = ({
  eyebrow,
  title,
  children,
}) => (
  <div className="mx-auto max-w-3xl text-center">
    {eyebrow ? (
      <p className="text-sm font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
        {eyebrow}
      </p>
    ) : null}
    <h2 className="mt-2 text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl dark:text-white">
      {title}
    </h2>
    {children ? (
      <p className="mt-4 text-lg text-surface-600 dark:text-surface-300">{children}</p>
    ) : null}
  </div>
);

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
const EUAIActPillar: React.FC = () => {
  return (
    <MarketingLayout>
      <Seo
        title={SEO_TITLE}
        description={SEO_DESCRIPTION}
        canonicalPath={CANONICAL_PATH}
        keywords={SEO_KEYWORDS}
        ogType="article"
      />
      <JsonLd data={organizationSchema()} />
      <JsonLd data={faqSchema(FAQ_ITEMS)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', url: 'https://complyeasyai.com/' },
          { name: 'EU AI Act compliance', url: 'https://complyeasyai.com/eu-ai-act' },
        ])}
      />

      {/* ============================== Hero ============================== */}
      <section className="relative overflow-hidden mesh-gradient">
        <div className="absolute inset-0 dot-pattern opacity-40" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400">
              <li>
                <Link to="/" className="transition-colors hover:text-brand-600 dark:hover:text-brand-400">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="font-medium text-surface-700 dark:text-surface-200">
                EU AI Act compliance
              </li>
            </ol>
          </nav>

          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-semibold text-brand-700 dark:border-brand-800/60 dark:bg-brand-950/40 dark:text-brand-300">
              <BrainCircuit className="h-4 w-4" aria-hidden="true" />
              AI governance
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-surface-900 sm:text-5xl lg:text-6xl dark:text-white">
              <span className="text-gradient">EU AI Act compliance</span>, made operational
            </h1>
            <p className="mt-6 text-xl leading-relaxed text-surface-700 dark:text-surface-200">
              EU AI Act compliance means meeting the obligations of Regulation (EU) 2024/1689 by
              classifying each AI system into one of four risk tiers and applying the controls that
              tier requires &mdash; from outright bans on unacceptable-risk practices to risk
              management, technical documentation, transparency, and human oversight for high-risk
              systems. ComplyEasy AI turns those obligations into a continuously monitored program.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-7 py-3 text-base font-semibold text-white shadow-lg shadow-brand-500/20 transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                Start free trial
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-surface-300 bg-white px-7 py-3 text-base font-semibold text-surface-800 transition-colors hover:border-brand-400 hover:text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100 dark:hover:text-brand-300"
              >
                Book a demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ====================== Quotable definition ====================== */}
      <section className="bg-white py-24 dark:bg-surface-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl rounded-2xl border border-brand-100 bg-brand-50/60 p-8 sm:p-10 dark:border-brand-900/50 dark:bg-brand-950/30">
            <h2 className="text-2xl font-bold tracking-tight text-surface-900 sm:text-3xl dark:text-white">
              What is the EU AI Act?
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-surface-700 dark:text-surface-200">
              The EU AI Act is the European Union&rsquo;s comprehensive regulation for artificial
              intelligence and the first horizontal AI law of its kind. It uses a{' '}
              <strong>risk-based approach</strong>: rather than regulating a technology, it regulates
              how an AI system is used, sorting systems into four tiers &mdash;{' '}
              <strong>unacceptable, high, limited, and minimal risk</strong> &mdash; and attaching
              obligations to each. The heaviest duties fall on high-risk systems and on providers of
              general-purpose AI (GPAI) models. The regulation applies extraterritorially: providers
              and deployers outside the EU are in scope whenever an AI system&rsquo;s output is used
              within the Union.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-surface-700 dark:text-surface-200">
              Compliance is therefore less about a single certificate and more about an ongoing
              governance program &mdash; one that keeps an accurate inventory of AI systems, applies
              the right controls per risk tier, and maintains living documentation as those systems
              are retrained and redeployed.
            </p>
          </div>
        </div>
      </section>

      {/* ========================= Risk tiers ========================= */}
      <section className="bg-surface-50 py-24 dark:bg-surface-900/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="How it works" title="The four risk tiers">
            The Act&rsquo;s obligations flow from how an AI system is classified. Determining the
            correct tier for every system you build or deploy is the first step of compliance.
          </SectionHeading>

          <div className="mt-16 grid gap-6 sm:grid-cols-2">
            {RISK_TIERS.map((tier) => {
              const Icon = tier.icon;
              return (
                <div
                  key={tier.name}
                  className="rounded-2xl border border-surface-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-md dark:border-surface-700 dark:bg-surface-900"
                >
                  <div className="flex items-center gap-3">
                    <span className="rounded-xl bg-brand-600/10 p-2.5 text-brand-700 dark:bg-brand-400/10 dark:text-brand-300">
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <h3 className="text-xl font-semibold text-surface-900 dark:text-white">
                      {tier.name}
                    </h3>
                  </div>
                  <p className="mt-4 text-surface-600 dark:text-surface-300">{tier.summary}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================== High-risk obligations ==================== */}
      <section className="bg-white py-24 dark:bg-surface-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Key requirements" title="Obligations for high-risk AI systems">
            High-risk systems carry the Act&rsquo;s most extensive requirements. Providers must
            satisfy each of these before a system is placed on the EU market, and keep them current
            throughout its lifecycle.
          </SectionHeading>

          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {HIGH_RISK_OBLIGATIONS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex flex-col rounded-2xl border border-surface-200 bg-surface-50/60 p-6 dark:border-surface-700 dark:bg-surface-900/60"
                >
                  <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-500/20">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="text-base font-semibold text-surface-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-surface-600 dark:text-surface-300">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* GPAI + transparency note */}
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-surface-200 bg-white p-8 dark:border-surface-700 dark:bg-surface-900">
              <h3 className="text-xl font-semibold text-surface-900 dark:text-white">
                General-purpose AI (GPAI) models
              </h3>
              <p className="mt-3 text-surface-600 dark:text-surface-300">
                Providers of GPAI models must maintain technical documentation, supply information to
                downstream developers, publish a detailed summary of training content, and respect EU
                copyright law. Models judged to pose <strong>systemic risk</strong> take on further
                duties, including model evaluation, adversarial testing, serious-incident tracking,
                and heightened cybersecurity.
              </p>
            </div>
            <div className="rounded-2xl border border-surface-200 bg-white p-8 dark:border-surface-700 dark:bg-surface-900">
              <h3 className="text-xl font-semibold text-surface-900 dark:text-white">
                Transparency obligations
              </h3>
              <p className="mt-3 text-surface-600 dark:text-surface-300">
                Even outside the high-risk tier, certain systems carry transparency duties: people
                must be told when they are interacting with an AI system, AI-generated or manipulated
                content (including deepfakes) must be labelled, and the use of emotion-recognition or
                biometric-categorisation systems must be disclosed to the people exposed to them.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ====================== Common challenges ====================== */}
      <section className="bg-surface-50 py-24 dark:bg-surface-900/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="What gets hard" title="Common EU AI Act challenges">
            Most teams find the regulation itself is only half the problem &mdash; operationalizing it
            across a changing portfolio of AI systems is the other half.
          </SectionHeading>

          <div className="mx-auto mt-16 max-w-4xl space-y-5">
            {CHALLENGES.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-surface-200 bg-white p-6 dark:border-surface-700 dark:bg-surface-900"
              >
                <h3 className="flex items-start gap-3 text-lg font-semibold text-surface-900 dark:text-white">
                  <AlertTriangle
                    className="mt-1 h-5 w-5 flex-shrink-0 text-brand-600 dark:text-brand-400"
                    aria-hidden="true"
                  />
                  {item.title}
                </h3>
                <p className="mt-2 pl-8 text-surface-600 dark:text-surface-300">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================== How ComplyEasy AI helps =================== */}
      <section className="bg-white py-24 dark:bg-surface-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="The platform" title="How ComplyEasy AI helps">
            ComplyEasy AI turns the EU AI Act&rsquo;s obligations into a connected, continuously
            monitored program instead of a folder of static documents.
          </SectionHeading>

          <div className="mt-16 grid gap-8 lg:grid-cols-2">
            <div className="space-y-6">
              <div className="flex gap-4">
                <span className="mt-1 inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-600/10 text-brand-700 dark:bg-brand-400/10 dark:text-brand-300">
                  <Layers className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
                    Inventory and classify AI systems
                  </h3>
                  <p className="mt-1 text-surface-600 dark:text-surface-300">
                    Catalogue every AI system, capture your role for each (provider or deployer), and
                    assign the right risk tier &mdash; the foundation that determines which
                    obligations apply. Reassessment is prompted as systems change.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <span className="mt-1 inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-600/10 text-brand-700 dark:bg-brand-400/10 dark:text-brand-300">
                  <FileText className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
                    Structure technical documentation
                  </h3>
                  <p className="mt-1 text-surface-600 dark:text-surface-300">
                    Generate and version the technical documentation, risk assessments, and
                    conformity-assessment artifacts high-risk systems require, with a versioned audit
                    trail so nothing goes stale.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <span className="mt-1 inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-600/10 text-brand-700 dark:bg-brand-400/10 dark:text-brand-300">
                  <Users className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
                    Track human oversight and transparency
                  </h3>
                  <p className="mt-1 text-surface-600 dark:text-surface-300">
                    Map human-oversight measures, logging, and transparency disclosures to the
                    systems that need them, and monitor whether those controls remain in place over
                    time.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <span className="mt-1 inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-600/10 text-brand-700 dark:bg-brand-400/10 dark:text-brand-300">
                  <GitMerge className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
                    Reuse evidence across frameworks
                  </h3>
                  <p className="mt-1 text-surface-600 dark:text-surface-300">
                    Controls that overlap with ISO/IEC 42001, the NIST AI RMF, and GDPR are mapped
                    once and shared, so an AI-governance program does not duplicate work across
                    adjacent regimes.
                  </p>
                </div>
              </div>
            </div>

            {/* Product modules + related reading */}
            <div className="flex flex-col gap-6">
              <div className="rounded-2xl border border-surface-200 bg-surface-50/70 p-8 dark:border-surface-700 dark:bg-surface-900/60">
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
                  Relevant product modules
                </h3>
                <ul className="mt-4 space-y-3 text-surface-700 dark:text-surface-200">
                  <li>
                    <Link
                      to="/app/frameworks"
                      className="inline-flex items-center gap-2 font-medium transition-colors hover:text-brand-600 dark:hover:text-brand-400"
                    >
                      <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                      Frameworks &amp; controls
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/app/risks"
                      className="inline-flex items-center gap-2 font-medium transition-colors hover:text-brand-600 dark:hover:text-brand-400"
                    >
                      <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                      Risk register &amp; assessments
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/app/evidence"
                      className="inline-flex items-center gap-2 font-medium transition-colors hover:text-brand-600 dark:hover:text-brand-400"
                    >
                      <FileText className="h-4 w-4" aria-hidden="true" />
                      Evidence &amp; documentation
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/app/policies"
                      className="inline-flex items-center gap-2 font-medium transition-colors hover:text-brand-600 dark:hover:text-brand-400"
                    >
                      <ScrollText className="h-4 w-4" aria-hidden="true" />
                      Policies &amp; governance
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-surface-200 bg-surface-50/70 p-8 dark:border-surface-700 dark:bg-surface-900/60">
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
                  Related frameworks
                </h3>
                <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">
                  AI governance rarely stands alone. Explore the standards the EU AI Act overlaps
                  with most.
                </p>
                <ul className="mt-4 space-y-3 text-surface-700 dark:text-surface-200">
                  <li>
                    <Link
                      to="/nist-ai-rmf"
                      className="inline-flex items-center gap-2 font-medium transition-colors hover:text-brand-600 dark:hover:text-brand-400"
                    >
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      NIST AI Risk Management Framework
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/gdpr"
                      className="inline-flex items-center gap-2 font-medium transition-colors hover:text-brand-600 dark:hover:text-brand-400"
                    >
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      GDPR compliance
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/iso-27001"
                      className="inline-flex items-center gap-2 font-medium transition-colors hover:text-brand-600 dark:hover:text-brand-400"
                    >
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      ISO 27001 compliance
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================== FAQ =========================== */}
      <section className="bg-surface-50 py-24 dark:bg-surface-900/40">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="FAQ" title="EU AI Act compliance questions" />
          <dl className="mt-16 space-y-4">
            {FAQ_ITEMS.map((item) => (
              <div
                key={item.q}
                className="rounded-2xl border border-surface-200 bg-white p-6 dark:border-surface-700 dark:bg-surface-900"
              >
                <dt className="text-lg font-semibold text-surface-900 dark:text-white">{item.q}</dt>
                <dd className="mt-2 leading-relaxed text-surface-600 dark:text-surface-300">
                  {item.a}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ========================= Closing CTA ========================= */}
      <section className="bg-white py-24 dark:bg-surface-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-brand-950 px-6 py-16 text-center shadow-xl sm:px-16">
            <div className="absolute inset-0 dot-pattern opacity-20" aria-hidden="true" />
            <div className="relative mx-auto max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Operationalize EU AI Act compliance
              </h2>
              <p className="mt-4 text-lg text-brand-100">
                Inventory your AI systems, classify them by risk, and keep documentation continuously
                audit-ready &mdash; with the rest of your compliance program in one place.
              </p>
              <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
                <Link
                  to="/"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3 text-base font-semibold text-brand-700 shadow-lg transition-colors hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-white"
                >
                  Start free trial
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Link>
                <Link
                  to="/"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-7 py-3 text-base font-semibold text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
                >
                  Book a demo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
};

export default EUAIActPillar;
export { EUAIActPillar };
