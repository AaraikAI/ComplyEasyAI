import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  Compass,
  Map as MapIcon,
  Gauge,
  Settings2,
  ClipboardCheck,
  BrainCircuit,
  FileSearch,
  AlertTriangle,
  Layers,
  Users,
} from 'lucide-react';
import MarketingLayout from '../MarketingLayout';
import Seo from '../../seo/Seo';
import JsonLd from '../../seo/JsonLd';
import { breadcrumbSchema, faqSchema, softwareApplicationSchema } from '../../seo/siteSchema';

// ---------------------------------------------------------------------------
// SEO copy
// ---------------------------------------------------------------------------
const SEO_TITLE =
  'NIST AI RMF Explained: GOVERN, MAP, MEASURE & MANAGE | ComplyEasy AI';
const SEO_DESCRIPTION =
  'A practical guide to the NIST AI Risk Management Framework (AI RMF 1.0) — its four functions GOVERN, MAP, MEASURE, and MANAGE — plus how to operationalize trustworthy-AI controls with ComplyEasy AI.';
const SEO_KEYWORDS =
  'NIST AI RMF, NIST AI Risk Management Framework, AI RMF 1.0, GOVERN MAP MEASURE MANAGE, trustworthy AI, AI governance framework, NIST AI 600-1, generative AI profile, AI risk management';

// ---------------------------------------------------------------------------
// The four AI RMF functions
// ---------------------------------------------------------------------------
const FUNCTIONS: {
  name: string;
  tagline: string;
  icon: React.FC<{ className?: string }>;
  points: string[];
}[] = [
  {
    name: 'GOVERN',
    tagline: 'A culture of risk management across the organization',
    icon: Compass,
    points: [
      'Establish policies, roles, accountability structures, and oversight for AI systems.',
      'Define risk tolerance and connect AI governance to existing enterprise risk processes.',
      'Set expectations for documentation, workforce diversity, and third-party and supply-chain risk.',
    ],
  },
  {
    name: 'MAP',
    tagline: 'Frame the context to identify risks',
    icon: MapIcon,
    points: [
      'Capture the system context, intended purpose, and the people and communities it may affect.',
      'Identify capabilities, limitations, dependencies, and the potential for benefits and harms.',
      'Categorize the AI system so downstream measurement and management are appropriately scoped.',
    ],
  },
  {
    name: 'MEASURE',
    tagline: 'Analyze, assess, and track risks',
    icon: Gauge,
    points: [
      'Select and apply quantitative and qualitative methods to evaluate identified risks.',
      'Assess trustworthiness characteristics: validity, reliability, safety, security, and fairness.',
      'Test, evaluate, verify, and validate (TEVV) systems and monitor for drift over time.',
    ],
  },
  {
    name: 'MANAGE',
    tagline: 'Prioritize and act on risks',
    icon: Settings2,
    points: [
      'Allocate resources to the highest-priority risks and document the response decisions made.',
      'Plan for incident response, recovery, and post-deployment monitoring and change management.',
      'Manage third-party and downstream risk, and retire or remediate systems when warranted.',
    ],
  },
];

// ---------------------------------------------------------------------------
// Trustworthy-AI characteristics from the framework
// ---------------------------------------------------------------------------
const CHARACTERISTICS: string[] = [
  'Valid and reliable',
  'Safe',
  'Secure and resilient',
  'Accountable and transparent',
  'Explainable and interpretable',
  'Privacy-enhanced',
  'Fair — with harmful bias managed',
];

// ---------------------------------------------------------------------------
// Common challenges
// ---------------------------------------------------------------------------
const CHALLENGES: { title: string; body: string; icon: React.FC<{ className?: string }> }[] = [
  {
    title: 'The framework is voluntary and non-prescriptive',
    body: 'AI RMF describes outcomes, not a checklist. Teams must translate the functions, categories, and subcategories into concrete controls, owners, and evidence for their own systems — a step many organizations underestimate.',
    icon: FileSearch,
  },
  {
    title: 'Generative AI introduces distinct risks',
    body: 'The companion Generative AI Profile (NIST AI 600-1) adds risks such as confabulation, harmful content, data leakage, and provenance that traditional model governance was not designed to address.',
    icon: BrainCircuit,
  },
  {
    title: 'Measurement is hard to operationalize',
    body: 'Selecting metrics for fairness, robustness, and reliability — and re-running TEVV as models and data drift — requires disciplined, repeatable processes rather than one-off assessments.',
    icon: AlertTriangle,
  },
  {
    title: 'AI risk spans many teams',
    body: 'Data science, security, legal, privacy, and product all hold pieces of AI governance. Without a shared system of record, accountability gaps and duplicated effort appear quickly.',
    icon: Users,
  },
];

// ---------------------------------------------------------------------------
// On-page FAQ — defensible, capability-based answers
// ---------------------------------------------------------------------------
const FAQ: { q: string; a: string }[] = [
  {
    q: 'What is the NIST AI Risk Management Framework (AI RMF)?',
    a: 'The NIST AI Risk Management Framework (AI RMF 1.0), released in January 2023, is a voluntary framework that helps organizations manage risks to individuals, organizations, and society from artificial intelligence. It is organized around four core functions — GOVERN, MAP, MEASURE, and MANAGE — and a set of trustworthy-AI characteristics, and it is designed to be rights-preserving, non-sector-specific, and use-case agnostic.',
  },
  {
    q: 'What are the four functions of the NIST AI RMF?',
    a: 'The AI RMF Core has four functions. GOVERN cultivates a risk-management culture with policies, roles, and accountability. MAP frames the context and identifies risks for a specific AI system. MEASURE analyzes, assesses, and tracks those risks using quantitative and qualitative methods. MANAGE prioritizes and acts on risks, including response, monitoring, and recovery. GOVERN applies across all of the others.',
  },
  {
    q: 'Is the NIST AI RMF mandatory?',
    a: 'No. The AI RMF is voluntary and is intended for adoption by any organization that designs, develops, deploys, or uses AI systems. While not a law itself, it is widely referenced by regulators, procurement requirements, and other frameworks, so many organizations adopt it to demonstrate responsible AI governance and to prepare for emerging obligations such as the EU AI Act.',
  },
  {
    q: 'What are the trustworthy-AI characteristics in the AI RMF?',
    a: 'NIST defines AI as trustworthy when it is valid and reliable; safe; secure and resilient; accountable and transparent; explainable and interpretable; privacy-enhanced; and fair with harmful bias managed. These characteristics are interrelated and are weighed in the context of how an AI system is built and used.',
  },
  {
    q: 'What is the NIST AI RMF Generative AI Profile?',
    a: 'The Generative AI Profile (NIST AI 600-1), published in July 2024, is a companion resource to the AI RMF. It identifies risks that are unique to or amplified by generative AI — such as confabulation, dangerous or violent content, data privacy leakage, and provenance — and suggests actions, aligned to the four functions, that organizations can take to manage them.',
  },
  {
    q: 'How does the NIST AI RMF relate to the EU AI Act and ISO 42001?',
    a: 'The AI RMF is a flexible, outcome-based framework that pairs well with other AI governance regimes. ISO/IEC 42001 provides a certifiable AI management system, and the EU AI Act imposes binding legal obligations on certain AI systems. Many of the AI RMF functions — risk identification, documentation, testing, and oversight — map closely to controls those regimes require, so a single program can satisfy several at once.',
  },
  {
    q: 'How long does it take to implement the NIST AI RMF?',
    a: 'Timelines vary with the number and risk level of your AI systems and your current governance maturity. Standing up GOVERN policies and an AI system inventory can begin immediately, while MEASURE and MANAGE activities such as testing, evaluation, and monitoring are continuous. ComplyEasy AI shortens setup by pre-mapping the AI RMF functions to controls and automating evidence collection.',
  },
  {
    q: 'How does ComplyEasy AI support the NIST AI RMF?',
    a: 'ComplyEasy AI provides the AI RMF Core as a structured control set, maintains an inventory of AI systems with their risk classifications, automates evidence collection for GOVERN, MAP, MEASURE, and MANAGE, and tracks the trustworthy-AI characteristics over time. Because controls are mapped across frameworks, evidence collected for the AI RMF is reused for the EU AI Act, ISO 42001, and other standards.',
  },
];

const SectionHeading: React.FC<{ id?: string; children: React.ReactNode }> = ({ id, children }) => (
  <h2
    id={id}
    className="text-3xl font-bold tracking-tight text-surface-900 dark:text-white sm:text-4xl"
  >
    {children}
  </h2>
);

const NISTAIRMFPillar: React.FC = () => {
  return (
    <MarketingLayout>
      <Seo
        title={SEO_TITLE}
        description={SEO_DESCRIPTION}
        canonicalPath="/nist-ai-rmf"
        keywords={SEO_KEYWORDS}
        ogType="article"
      />
      <JsonLd data={softwareApplicationSchema()} />
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', url: 'https://complyeasyai.com/' },
          { name: 'NIST AI RMF', url: 'https://complyeasyai.com/nist-ai-rmf' },
        ])}
      />
      <JsonLd data={faqSchema(FAQ.map((item) => ({ q: item.q, a: item.a })))} />

      {/* ============================== Hero ============================== */}
      <section className="relative overflow-hidden mesh-gradient">
        <div className="absolute inset-0 dot-pattern opacity-40" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400">
              <li>
                <Link to="/" className="transition-colors hover:text-brand-600 dark:hover:text-brand-400">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="font-medium text-surface-700 dark:text-surface-200">NIST AI RMF</li>
            </ol>
          </nav>

          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-300">
              <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
              AI governance framework
            </span>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-surface-900 dark:text-white sm:text-5xl lg:text-6xl">
              The <span className="text-gradient">NIST AI RMF</span>: GOVERN, MAP, MEASURE, MANAGE
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-surface-700 dark:text-surface-300 sm:text-xl">
              The NIST AI Risk Management Framework (AI RMF 1.0) is a voluntary framework, published by
              the U.S. National Institute of Standards and Technology in January 2023, that helps
              organizations identify and manage risks from artificial intelligence. It is structured
              around four core functions — <strong>GOVERN, MAP, MEASURE, and MANAGE</strong> — and a set
              of characteristics that make AI systems trustworthy.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-brand-500/20 transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                Start free trial
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-full border border-surface-300 bg-white px-6 py-3 text-base font-semibold text-surface-800 transition-colors hover:border-brand-400 hover:text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100 dark:hover:text-brand-300"
              >
                Book a demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== Quotable definition ===================== */}
      <section className="border-y border-surface-200 bg-surface-50 dark:border-surface-800 dark:bg-surface-900/50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <SectionHeading id="what-is">What is the NIST AI RMF?</SectionHeading>
              <p className="mt-5 text-lg leading-relaxed text-surface-700 dark:text-surface-300">
                The AI Risk Management Framework is NIST&apos;s response to a directive in the National
                AI Initiative Act of 2020 to develop a voluntary framework for trustworthy AI. It is
                <strong> rights-preserving, non-sector-specific, and use-case agnostic</strong>, which
                lets any organization — regardless of size or industry — apply it to the AI systems they
                design, develop, deploy, or use.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-surface-700 dark:text-surface-300">
                The framework comes in two parts. Part 1 frames AI risks and describes the
                characteristics of trustworthy AI. Part 2 is the <strong>AI RMF Core</strong> — the four
                functions, broken into categories and subcategories, that organizations work through to
                manage risk in practice. NIST also maintains a companion Playbook and the Generative AI
                Profile (NIST AI 600-1) for organizations working with generative models.
              </p>
            </div>
            <aside className="rounded-2xl border border-brand-200 bg-white p-6 shadow-sm dark:border-brand-900 dark:bg-surface-900">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">
                At a glance
              </h3>
              <dl className="mt-4 space-y-4 text-sm">
                <div>
                  <dt className="font-semibold text-surface-900 dark:text-white">Published</dt>
                  <dd className="text-surface-600 dark:text-surface-400">AI RMF 1.0 — January 2023</dd>
                </div>
                <div>
                  <dt className="font-semibold text-surface-900 dark:text-white">Author</dt>
                  <dd className="text-surface-600 dark:text-surface-400">
                    U.S. National Institute of Standards and Technology (NIST)
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-surface-900 dark:text-white">Status</dt>
                  <dd className="text-surface-600 dark:text-surface-400">Voluntary, non-prescriptive</dd>
                </div>
                <div>
                  <dt className="font-semibold text-surface-900 dark:text-white">Core functions</dt>
                  <dd className="text-surface-600 dark:text-surface-400">GOVERN, MAP, MEASURE, MANAGE</dd>
                </div>
              </dl>
            </aside>
          </div>
        </div>
      </section>

      {/* ===================== The four functions ===================== */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <SectionHeading id="functions">The four functions: how the AI RMF works</SectionHeading>
          <p className="mt-5 text-lg leading-relaxed text-surface-700 dark:text-surface-300">
            The AI RMF Core organizes risk-management activities into four functions. GOVERN is a
            cross-cutting culture and accountability layer that informs the other three. MAP, MEASURE,
            and MANAGE form a continuous cycle applied to each AI system throughout its lifecycle.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {FUNCTIONS.map((fn) => {
            const Icon = fn.icon;
            return (
              <article
                key={fn.name}
                className="group rounded-2xl border border-surface-200 bg-white p-7 shadow-sm transition-shadow hover:shadow-lg dark:border-surface-800 dark:bg-surface-900"
              >
                <div className="flex items-center gap-4">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600/10 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                    <Icon className="h-6 w-6" />
                  </span>
                  <div>
                    <h3 className="text-xl font-bold tracking-tight text-surface-900 dark:text-white">
                      {fn.name}
                    </h3>
                    <p className="text-sm text-surface-500 dark:text-surface-400">{fn.tagline}</p>
                  </div>
                </div>
                <ul className="mt-5 space-y-3">
                  {fn.points.map((point) => (
                    <li
                      key={point}
                      className="flex gap-3 text-sm leading-relaxed text-surface-700 dark:text-surface-300"
                    >
                      <ShieldCheck
                        className="mt-0.5 h-4 w-4 flex-none text-brand-600 dark:text-brand-400"
                        aria-hidden="true"
                      />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </section>

      {/* ===================== Trustworthy characteristics ===================== */}
      <section className="border-y border-surface-200 bg-surface-50 dark:border-surface-800 dark:bg-surface-900/50">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <SectionHeading id="trustworthy">Characteristics of trustworthy AI</SectionHeading>
            <p className="mt-5 text-lg leading-relaxed text-surface-700 dark:text-surface-300">
              The AI RMF defines the qualities that make an AI system trustworthy. These
              characteristics are interrelated — trade-offs between them are expected — and they are
              weighed in the context of how each system is designed and used. They give the MEASURE
              function its yardsticks.
            </p>
          </div>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CHARACTERISTICS.map((c) => (
              <li
                key={c}
                className="flex items-center gap-3 rounded-xl border border-surface-200 bg-white px-5 py-4 text-sm font-medium text-surface-800 shadow-sm dark:border-surface-800 dark:bg-surface-900 dark:text-surface-200"
              >
                <Layers className="h-5 w-5 flex-none text-brand-600 dark:text-brand-400" aria-hidden="true" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ===================== Key requirements ===================== */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <SectionHeading id="requirements">Key requirements to operationalize the AI RMF</SectionHeading>
          <p className="mt-5 text-lg leading-relaxed text-surface-700 dark:text-surface-300">
            Because the framework is outcome-based, putting it into practice means turning its functions
            into concrete, evidenced activities. A workable AI RMF program generally covers the
            following.
          </p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              h: 'An AI system inventory',
              p: 'Catalog every AI system, its purpose, owner, and risk level so governance and measurement can be scoped per system.',
            },
            {
              h: 'Governance policies and roles',
              p: 'Document policies, accountability structures, and risk tolerance, and tie AI oversight into enterprise risk management.',
            },
            {
              h: 'Context and impact mapping',
              p: 'For each system, record intended use, affected stakeholders, limitations, and potential benefits and harms.',
            },
            {
              h: 'Test, evaluation, and metrics',
              p: 'Define metrics for the trustworthy characteristics and run TEVV across the lifecycle, including for bias and robustness.',
            },
            {
              h: 'Risk response and monitoring',
              p: 'Prioritize risks, document response decisions, and monitor systems for drift, incidents, and changing conditions.',
            },
            {
              h: 'Third-party and supply-chain risk',
              p: 'Extend the same diligence to acquired models, data, and components, and plan for downstream and decommissioning risk.',
            },
          ].map((item) => (
            <div
              key={item.h}
              className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-800 dark:bg-surface-900"
            >
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white">{item.h}</h3>
              <p className="mt-2 text-sm leading-relaxed text-surface-600 dark:text-surface-400">
                {item.p}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== Common challenges ===================== */}
      <section className="border-y border-surface-200 bg-surface-50 dark:border-surface-800 dark:bg-surface-900/50">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <SectionHeading id="challenges">Common challenges</SectionHeading>
            <p className="mt-5 text-lg leading-relaxed text-surface-700 dark:text-surface-300">
              The flexibility that makes the AI RMF broadly applicable is also what makes it demanding to
              implement. These are the obstacles teams most often hit.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {CHALLENGES.map((c) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.title}
                  className="flex gap-4 rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-800 dark:bg-surface-900"
                >
                  <span className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-brand-600/10 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-surface-900 dark:text-white">{c.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-surface-600 dark:text-surface-400">
                      {c.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================== How ComplyEasy AI helps ===================== */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <SectionHeading id="how-we-help">How ComplyEasy AI helps with the NIST AI RMF</SectionHeading>
          <p className="mt-5 text-lg leading-relaxed text-surface-700 dark:text-surface-300">
            ComplyEasy AI turns the AI RMF from a document into an operating program. The platform ships
            the AI RMF Core as a structured control set and uses autonomous agents to keep the GOVERN,
            MAP, MEASURE, and MANAGE functions continuously evidenced.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: ClipboardCheck,
              h: 'AI RMF Core as controls',
              p: 'The four functions and their subcategories are pre-mapped to controls, with owners, status, and evidence in one workspace.',
            },
            {
              icon: BrainCircuit,
              h: 'AI system inventory & risk classification',
              p: 'Register each AI system, classify its risk, and link it to the GOVERN, MAP, MEASURE, and MANAGE activities that apply.',
            },
            {
              icon: Gauge,
              h: 'Continuous measurement',
              p: 'Automated evidence collection and dashboards track the trustworthy-AI characteristics and surface drift before it becomes a finding.',
            },
            {
              icon: FileSearch,
              h: 'Documentation & audit trail',
              p: 'Generate AI risk documentation and maintain a versioned, auditable record of every governance decision and test result.',
            },
            {
              icon: AlertTriangle,
              h: 'Risk register & response',
              p: 'Prioritize AI risks, assign response actions, and track remediation alongside the rest of your GRC program.',
            },
            {
              icon: Layers,
              h: 'Cross-framework reuse',
              p: 'Controls mapped once are reused across the EU AI Act, ISO 42001, and SOC 2, so AI RMF evidence does double duty.',
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.h}
                className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg dark:border-surface-800 dark:bg-surface-900"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600/10 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-surface-900 dark:text-white">{item.h}</h3>
                <p className="mt-2 text-sm leading-relaxed text-surface-600 dark:text-surface-400">
                  {item.p}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-12 rounded-2xl border border-surface-200 bg-surface-50 p-8 dark:border-surface-800 dark:bg-surface-900/50">
          <h3 className="text-xl font-bold text-surface-900 dark:text-white">
            Explore the product modules
          </h3>
          <p className="mt-3 text-surface-700 dark:text-surface-300">
            Once you sign in, the AI RMF program is operated through these areas of the platform:
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              { to: '/app/frameworks', label: 'Frameworks & control mapping' },
              { to: '/app/ai-governance', label: 'AI governance & model registry' },
              { to: '/app/risks', label: 'Risk register' },
              { to: '/app/evidence', label: 'Evidence automation' },
              { to: '/app/policies', label: 'Policies & documentation' },
              { to: '/app/dashboard', label: 'Compliance dashboard' },
            ].map((m) => (
              <li key={m.to}>
                <Link
                  to={m.to}
                  className="flex items-center gap-2 rounded-xl border border-surface-200 bg-white px-4 py-3 text-sm font-medium text-surface-800 transition-colors hover:border-brand-400 hover:text-brand-700 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-200 dark:hover:text-brand-300"
                >
                  <ArrowRight className="h-4 w-4 flex-none text-brand-600 dark:text-brand-400" aria-hidden="true" />
                  {m.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Sibling pillar pages */}
        <div className="mt-12">
          <h3 className="text-xl font-bold text-surface-900 dark:text-white">Related frameworks</h3>
          <p className="mt-3 text-surface-700 dark:text-surface-300">
            The AI RMF works best alongside the broader AI-governance and security landscape. Explore
            how ComplyEasy AI helps with these neighboring standards:
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {[
              { to: '/eu-ai-act', label: 'EU AI Act' },
              { to: '/iso-27001', label: 'ISO 27001' },
              { to: '/soc2-compliance', label: 'SOC 2' },
              { to: '/grc', label: 'GRC platform' },
            ].map((s) => (
              <Link
                key={s.to}
                to={s.to}
                className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-5 py-2 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-300 dark:hover:bg-brand-950/70"
              >
                {s.label}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== FAQ ===================== */}
      <section className="border-t border-surface-200 bg-surface-50 dark:border-surface-800 dark:bg-surface-900/50">
        <div className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
          <SectionHeading id="faq">Frequently asked questions</SectionHeading>
          <div className="mt-10 space-y-4">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-800 dark:bg-surface-900"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-left text-lg font-semibold text-surface-900 marker:content-none dark:text-white">
                  {item.q}
                  <ArrowRight
                    className="h-5 w-5 flex-none text-brand-600 transition-transform group-open:rotate-90 dark:text-brand-400"
                    aria-hidden="true"
                  />
                </summary>
                <p className="mt-4 text-base leading-relaxed text-surface-700 dark:text-surface-300">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== Closing CTA ===================== */}
      <section className="relative overflow-hidden bg-brand-950">
        <div className="absolute inset-0 mesh-gradient opacity-30" aria-hidden="true" />
        <div className="relative mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Operationalize the NIST AI RMF with ComplyEasy AI
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-brand-100">
            Stand up GOVERN, MAP, MEASURE, and MANAGE as a living program — with automated evidence,
            an AI system inventory, and cross-framework control mapping built in.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-base font-semibold text-brand-700 shadow-lg transition-colors hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-white"
            >
              Start free trial
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-7 py-3 text-base font-semibold text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
            >
              Book a demo
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
};

export default NISTAIRMFPillar;
export { NISTAIRMFPillar };
