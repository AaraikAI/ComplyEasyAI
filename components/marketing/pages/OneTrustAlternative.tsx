import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Sparkles, Scale } from 'lucide-react';
import MarketingLayout from '../MarketingLayout';
import Seo from '../../seo/Seo';
import JsonLd from '../../seo/JsonLd';
import { breadcrumbSchema, faqSchema } from '../../seo/siteSchema';
import ComparisonTable from '../ComparisonTable';
import { comparisons } from '../../../data/comparisons';

// ---------------------------------------------------------------------------
// Page data
// ---------------------------------------------------------------------------
const data = comparisons['onetrust-alternative'];

const SITE_ORIGIN = 'https://complyeasyai.com';
const CANONICAL_PATH = '/compare/onetrust-alternative';

const SEO_TITLE = 'ComplyEasy AI vs OneTrust: The Best OneTrust Alternative | ComplyEasy AI';
const SEO_DESCRIPTION =
  'Comparing ComplyEasy AI and OneTrust as a OneTrust alternative: an AI-native, agentic platform that unifies security-framework automation, privacy management, and AI governance in one place. See a fair, capability-focused feature comparison.';
const SEO_KEYWORDS =
  'OneTrust alternative, ComplyEasy AI vs OneTrust, AI compliance automation, agentic compliance, privacy management, RoPA DPIA, AI governance, EU AI Act compliance, NIST AI RMF, GDPR automation';

// ---------------------------------------------------------------------------
// FAQ — answer-first, fair, capability-focused
// ---------------------------------------------------------------------------
const faqPairs: { q: string; a: string }[] = [
  {
    q: 'What is the best OneTrust alternative?',
    a: 'Teams evaluating a OneTrust alternative often consider ComplyEasy AI because it is AI-native and unifies security-framework automation, privacy management, and AI governance in a single platform. Autonomous agents collect evidence, map controls, and monitor risk continuously, and the platform covers privacy tooling such as Records of Processing (RoPA) and DPIAs alongside SOC 2, ISO 27001, GDPR, HIPAA, the EU AI Act, and the NIST AI Risk Management Framework. The right choice depends on the breadth of governance you need and how much agentic automation you want.',
  },
  {
    q: 'How is ComplyEasy AI different from OneTrust?',
    a: 'OneTrust is a broad privacy, GRC, and data-governance suite often assembled from separately licensed modules. ComplyEasy AI brings security frameworks, privacy management, and AI governance together in one AI-native platform, and differentiates with agentic automation that can act on findings with rollback safety, privacy-preserving evidence sharing through zero-knowledge proofs, and published pricing tiers rather than quote-only access.',
  },
  {
    q: 'Does ComplyEasy AI handle privacy tooling like RoPA and DPIAs?',
    a: 'Yes. ComplyEasy AI includes Records of Processing (RoPA) and DPIA tooling as part of its privacy management capabilities, alongside GDPR and HIPAA support. This lets teams manage privacy obligations in the same platform they use for security-framework automation and AI governance.',
  },
  {
    q: 'Does ComplyEasy AI cover the EU AI Act and NIST AI RMF?',
    a: 'Yes. ComplyEasy AI provides first-class coverage of AI-governance regulation including the EU AI Act and the NIST AI Risk Management Framework, in addition to privacy and traditional security frameworks. This is useful for teams that need to manage privacy, security, and AI-governance obligations together rather than across separate tools.',
  },
  {
    q: 'Is ComplyEasy AI pricing published?',
    a: 'Yes. ComplyEasy AI publishes pricing tiers from Foundation to Visionary, so teams can evaluate cost without a sales cycle. This contrasts with quote-based enterprise access, where pricing depends on a sales conversation and the modules selected.',
  },
  {
    q: 'When might OneTrust be the better fit?',
    a: 'In fairness, OneTrust is a broad, well-established suite with deep privacy and data-governance capabilities and wide adoption among large enterprises. If your organization needs the full breadth of an enterprise GRC and privacy suite, already operates within the OneTrust ecosystem, and modular licensing fits your procurement model, OneTrust may be a strong fit. The most reliable way to decide is to evaluate both platforms against your own governance requirements.',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const OneTrustAlternative: React.FC = () => {
  const breadcrumb = breadcrumbSchema([
    { name: 'Home', url: `${SITE_ORIGIN}/` },
    { name: 'Compare', url: `${SITE_ORIGIN}/compare/onetrust-alternative` },
    { name: 'OneTrust alternative', url: `${SITE_ORIGIN}${CANONICAL_PATH}` },
  ]);

  return (
    <MarketingLayout>
      <Seo
        title={SEO_TITLE}
        description={SEO_DESCRIPTION}
        canonicalPath={CANONICAL_PATH}
        keywords={SEO_KEYWORDS}
        ogType="article"
      />
      <JsonLd data={breadcrumb} />
      <JsonLd data={faqSchema(faqPairs)} />

      {/* ============================== Hero ============================== */}
      <section className="relative overflow-hidden mesh-gradient">
        <div className="absolute inset-0 dot-pattern opacity-40" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          {/* Breadcrumb trail */}
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-surface-500 dark:text-surface-400">
              <li>
                <Link to="/" className="transition-colors hover:text-brand-600 dark:hover:text-brand-400">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="font-medium text-surface-700 dark:text-surface-200">OneTrust alternative</li>
            </ol>
          </nav>

          <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700 dark:border-brand-800 dark:bg-brand-950/50 dark:text-brand-300">
            <Sparkles size={15} aria-hidden="true" />
            OneTrust alternative
          </span>

          <h1 className="mt-6 max-w-4xl text-4xl font-bold tracking-tight text-surface-900 dark:text-white sm:text-5xl lg:text-6xl">
            ComplyEasy AI vs OneTrust: <span className="text-gradient">the best OneTrust alternative</span>
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-surface-600 dark:text-surface-300">
            Teams evaluate ComplyEasy AI as a OneTrust alternative because it is AI-native and unifies
            security-framework automation, privacy management, and AI governance in a single platform.
            Autonomous agents collect evidence, map controls, and monitor risk continuously, with broad
            coverage of AI regulation — the EU AI Act and the NIST AI Risk Management Framework — alongside
            the privacy and GRC capabilities OneTrust is known for.
          </p>

          <p className="mt-4 max-w-3xl text-base leading-relaxed text-surface-600 dark:text-surface-400">
            {data.intro}
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-7 py-3 text-base font-semibold text-white shadow-lg shadow-brand-500/20 transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              Start free
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <a
              href="#comparison"
              className="inline-flex items-center gap-2 rounded-full border border-surface-300 px-7 py-3 text-base font-semibold text-surface-700 transition-colors hover:border-brand-400 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-surface-700 dark:text-surface-200 dark:hover:border-brand-500 dark:hover:text-brand-400"
            >
              See the comparison
            </a>
          </div>
        </div>
      </section>

      {/* ========================= Comparison table ========================= */}
      <section id="comparison" className="border-t border-surface-200 bg-white py-24 dark:border-surface-800 dark:bg-surface-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-surface-900 dark:text-white sm:text-4xl">
              ComplyEasy AI and OneTrust, feature by feature
            </h2>
            <p className="mt-4 text-lg text-surface-600 dark:text-surface-300">
              A capability-focused comparison. Values marked &ldquo;Varies&rdquo; depend on the OneTrust module
              or plan, or are not publicly fixed.
            </p>
          </div>

          <div className="mt-12">
            <ComparisonTable competitorName="OneTrust" rows={data.rows} />
          </div>
        </div>
      </section>

      {/* ====================== Why teams choose us ======================== */}
      <section className="border-t border-surface-200 bg-surface-50 py-24 dark:border-surface-800 dark:bg-surface-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-surface-900 dark:text-white sm:text-4xl">
              Why teams choose ComplyEasy AI
            </h2>
            <p className="mt-4 text-lg text-surface-600 dark:text-surface-300">
              What sets the platform apart when teams compare it to OneTrust.
            </p>
          </div>

          <ul className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2">
            {data.whyChoose.map((reason) => (
              <li
                key={reason}
                className="flex items-start gap-4 rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-950"
              >
                <span
                  className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300"
                  aria-hidden="true"
                >
                  <CheckCircle size={18} />
                </span>
                <p className="text-base leading-relaxed text-surface-700 dark:text-surface-300">{reason}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ===================== When OneTrust might fit ===================== */}
      <section className="border-t border-surface-200 bg-white py-24 dark:border-surface-800 dark:bg-surface-950">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-surface-200 bg-surface-50 p-8 dark:border-surface-700 dark:bg-surface-900 sm:p-10">
            <div className="flex items-center gap-3">
              <span
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-200 text-surface-700 dark:bg-surface-800 dark:text-surface-300"
                aria-hidden="true"
              >
                <Scale size={20} />
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-white">
                When OneTrust might fit
              </h2>
            </div>
            <p className="mt-5 text-base leading-relaxed text-surface-600 dark:text-surface-300">
              In fairness, OneTrust is a broad, well-established privacy, GRC, and data-governance suite with
              deep capabilities and wide adoption among large enterprises. If your organization needs the full
              breadth of an enterprise governance suite, already operates within the OneTrust ecosystem, and
              its modular licensing model fits your procurement, OneTrust may be the right choice. The most
              reliable way to decide is to evaluate both platforms against your own governance requirements and
              roadmap.
            </p>
          </div>
        </div>
      </section>

      {/* ============================== FAQ =============================== */}
      <section className="border-t border-surface-200 bg-surface-50 py-24 dark:border-surface-800 dark:bg-surface-900">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold tracking-tight text-surface-900 dark:text-white sm:text-4xl">
            Frequently asked questions
          </h2>
          <dl className="mt-12 space-y-4">
            {faqPairs.map((item) => (
              <div
                key={item.q}
                className="rounded-2xl border border-surface-200 bg-white p-6 dark:border-surface-700 dark:bg-surface-950"
              >
                <dt className="text-lg font-semibold text-surface-900 dark:text-white">{item.q}</dt>
                <dd className="mt-3 text-base leading-relaxed text-surface-600 dark:text-surface-300">
                  {item.a}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ============================== CTA =============================== */}
      <section className="border-t border-surface-200 bg-white py-24 dark:border-surface-800 dark:bg-surface-950">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-brand-600 px-8 py-16 text-center shadow-xl shadow-brand-500/20 sm:px-16">
            <div className="absolute inset-0 noise opacity-20" aria-hidden="true" />
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Evaluate ComplyEasy AI for yourself
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-brand-50">
                See how AI-native, agentic automation unifies security frameworks, privacy management, and AI
                governance in a single platform with transparent, published pricing.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-base font-semibold text-brand-700 shadow-lg transition-colors hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-white"
                >
                  Start free
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 rounded-full border border-white/40 px-7 py-3 text-base font-semibold text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
                >
                  View pricing
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
};

export default OneTrustAlternative;
export { OneTrustAlternative };
