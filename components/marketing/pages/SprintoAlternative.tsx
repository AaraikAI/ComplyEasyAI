import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { MarketingLayout } from '../MarketingLayout';
import { ComparisonTable } from '../ComparisonTable';
import { Seo } from '../../seo/Seo';
import { JsonLd } from '../../seo/JsonLd';
import { breadcrumbSchema, faqSchema } from '../../seo/siteSchema';
import { comparisons } from '../../../data/comparisons';

const SITE_ORIGIN = 'https://complyeasyai.com';
const CANONICAL_PATH = '/compare/sprinto-alternative';

const data = comparisons['sprinto-alternative'];

/** Frequently asked questions about evaluating ComplyEasy AI versus Sprinto. */
const FAQS: { q: string; a: string }[] = [
  {
    q: 'What is the best Sprinto alternative for AI-native compliance?',
    a: 'Teams evaluating a Sprinto alternative often choose ComplyEasy AI for its AI-native architecture: autonomous agents collect evidence, map controls across frameworks, and surface risks continuously. It supports SOC 2, ISO 27001, GDPR, and HIPAA like Sprinto, and adds first-class coverage of AI regulations such as the EU AI Act and the NIST AI Risk Management Framework.',
  },
  {
    q: 'Does ComplyEasy AI cover the same frameworks as Sprinto?',
    a: 'Yes. ComplyEasy AI supports the core frameworks Sprinto is known for, including SOC 2 Type I and II, ISO 27001, GDPR, and HIPAA, with continuous control monitoring and cross-framework control mapping. It also extends coverage to AI-governance frameworks for teams shipping AI products.',
  },
  {
    q: 'How does agentic automation differ from standard compliance automation?',
    a: 'Standard compliance automation typically monitors controls and flags gaps for a human to address. ComplyEasy AI adds agentic automation: agents can act on findings and apply remediations with blast-radius estimation and automatic rollback, reducing the manual upkeep involved in keeping controls in a passing state.',
  },
  {
    q: 'Does ComplyEasy AI publish its pricing?',
    a: 'Yes. ComplyEasy AI publishes pricing across four tiers, from Foundation to Visionary, so teams can evaluate cost without a sales cycle. Comparison values marked "Varies" reflect capabilities that depend on the competitor plan or are not publicly fixed.',
  },
  {
    q: 'Can ComplyEasy AI help teams that build AI products?',
    a: 'Yes. In addition to traditional security and privacy frameworks, ComplyEasy AI provides native coverage of the EU AI Act and the NIST AI Risk Management Framework, which helps teams that build or deploy AI systems address AI-governance requirements alongside their existing compliance program.',
  },
  {
    q: 'When might Sprinto be the better fit?',
    a: 'Sprinto is a strong choice for teams whose needs are centered on the security and privacy frameworks it specializes in and who already have a workflow built around its product. If AI-regulation coverage, agentic remediation, or predictive forecasting are not priorities, an established platform you already use may be the more practical option.',
  },
];

const breadcrumbItems = [
  { name: 'Home', url: `${SITE_ORIGIN}/` },
  { name: 'Compare', url: `${SITE_ORIGIN}/compare/vanta-alternative` },
  { name: 'Sprinto alternative', url: `${SITE_ORIGIN}${CANONICAL_PATH}` },
];

/**
 * Comparison page: ComplyEasy AI as a Sprinto alternative. Presents a fair,
 * capability-focused comparison, the reasons teams choose ComplyEasy AI, an
 * honest note on when Sprinto may fit, and an FAQ with structured data.
 */
const SprintoAlternative: React.FC = () => {
  return (
    <MarketingLayout>
      <Seo
        title="ComplyEasy AI vs Sprinto: The Best Sprinto Alternative"
        description="Comparing ComplyEasy AI and Sprinto? See a fair, capability-focused breakdown. ComplyEasy AI is an AI-native Sprinto alternative with agentic automation and native EU AI Act and NIST AI RMF coverage, alongside SOC 2, ISO 27001, GDPR, and HIPAA."
        canonicalPath={CANONICAL_PATH}
        keywords="Sprinto alternative, ComplyEasy AI vs Sprinto, compliance automation, AI compliance, SOC 2, ISO 27001, EU AI Act, NIST AI RMF"
      />
      <JsonLd data={breadcrumbSchema(breadcrumbItems)} />
      <JsonLd data={faqSchema(FAQS)} />

      {/* ============================== Hero ============================== */}
      <section className="relative overflow-hidden mesh-gradient">
        <div className="absolute inset-0 dot-pattern opacity-40" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-surface-500 dark:text-surface-400">
              <li>
                <Link to="/" className="transition-colors hover:text-brand-600 dark:hover:text-brand-400">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link
                  to="/compare/vanta-alternative"
                  className="transition-colors hover:text-brand-600 dark:hover:text-brand-400"
                >
                  Compare
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="font-medium text-surface-700 dark:text-surface-200" aria-current="page">
                Sprinto alternative
              </li>
            </ol>
          </nav>

          <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700 dark:border-brand-800 dark:bg-brand-950/60 dark:text-brand-300">
            <Sparkles size={14} aria-hidden="true" />
            ComplyEasy AI vs Sprinto
          </span>

          <h1 className="mt-6 max-w-4xl text-4xl font-bold tracking-tight text-surface-900 dark:text-white sm:text-5xl lg:text-6xl">
            The best <span className="text-gradient">Sprinto alternative</span> for AI-native compliance
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-surface-600 dark:text-surface-300">
            Teams evaluate ComplyEasy AI as a Sprinto alternative because it pairs the same core
            framework coverage with an AI-native foundation: autonomous agents collect evidence and
            map controls continuously, agentic automation acts on findings with rollback safety, and
            the platform adds first-class support for emerging AI regulations such as the EU AI Act and
            the NIST AI Risk Management Framework.
          </p>

          <p className="mt-4 max-w-3xl text-base leading-relaxed text-surface-500 dark:text-surface-400">
            {data.intro}
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              Start free
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <a
              href="#comparison"
              className="inline-flex items-center gap-2 rounded-full border border-surface-300 px-6 py-3 text-sm font-semibold text-surface-700 transition-colors hover:border-brand-500 hover:text-brand-600 dark:border-surface-600 dark:text-surface-200 dark:hover:border-brand-400 dark:hover:text-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              See the comparison
            </a>
          </div>
        </div>
      </section>

      {/* ========================== Comparison table ========================== */}
      <section id="comparison" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-surface-900 dark:text-white sm:text-4xl">
            ComplyEasy AI vs Sprinto, feature by feature
          </h2>
          <p className="mt-4 text-lg text-surface-600 dark:text-surface-300">
            A capability-focused comparison. Values marked &ldquo;Varies&rdquo; depend on the Sprinto
            plan or are not publicly fixed.
          </p>
        </div>

        <div className="mt-12">
          <ComparisonTable competitorName="Sprinto" rows={data.rows} />
        </div>
      </section>

      {/* ========================== Why teams choose ========================== */}
      <section className="border-y border-surface-200 bg-surface-50 dark:border-surface-800 dark:bg-surface-900/40">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-surface-900 dark:text-white sm:text-4xl">
              Why teams choose ComplyEasy AI
            </h2>
            <p className="mt-4 text-lg text-surface-600 dark:text-surface-300">
              What sets the platform apart when evaluating a Sprinto alternative.
            </p>
          </div>

          <ul className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2">
            {data.whyChoose.map((reason) => (
              <li
                key={reason}
                className="flex items-start gap-4 rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-950"
              >
                <span
                  className="mt-0.5 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300"
                  aria-hidden="true"
                >
                  <Check size={18} />
                </span>
                <p className="text-base leading-relaxed text-surface-700 dark:text-surface-300">
                  {reason}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ========================== When Sprinto fits ========================== */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-surface-200 bg-white p-8 shadow-sm dark:border-surface-700 dark:bg-surface-950 sm:p-10">
          <h2 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-white sm:text-3xl">
            When Sprinto might be the right fit
          </h2>
          <p className="mt-4 text-base leading-relaxed text-surface-600 dark:text-surface-300">
            Sprinto is a capable, well-regarded compliance automation platform, and the right choice
            depends on your priorities. If your program is centered on the security and privacy
            frameworks Sprinto specializes in, your team already has an established workflow around it,
            and AI-regulation coverage, agentic remediation, or predictive forecasting are not on your
            roadmap, an established platform you already use may be the more practical option. We
            encourage an honest, side-by-side evaluation against your specific requirements.
          </p>
        </div>
      </section>

      {/* ============================== FAQ ============================== */}
      <section className="border-t border-surface-200 bg-surface-50 dark:border-surface-800 dark:bg-surface-900/40">
        <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-surface-900 dark:text-white sm:text-4xl">
            Frequently asked questions
          </h2>
          <dl className="mt-12 space-y-8">
            {FAQS.map((faq) => (
              <div
                key={faq.q}
                className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-950"
              >
                <dt className="text-lg font-semibold text-surface-900 dark:text-white">{faq.q}</dt>
                <dd className="mt-3 text-base leading-relaxed text-surface-600 dark:text-surface-300">
                  {faq.a}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ============================== CTA ============================== */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-brand-600 px-8 py-16 text-center shadow-xl sm:px-16">
          <div className="absolute inset-0 dot-pattern opacity-20" aria-hidden="true" />
          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              See ComplyEasy AI in action
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-brand-50">
              Evaluate an AI-native Sprinto alternative with agentic automation and native AI-regulation
              coverage across SOC 2, ISO 27001, GDPR, HIPAA, and beyond.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-700 shadow-lg transition-colors hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-600"
              >
                Start free
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
};

export default SprintoAlternative;
export { SprintoAlternative };
