import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, ShieldCheck, Scale } from 'lucide-react';
import { MarketingLayout } from '../MarketingLayout';
import { ComparisonTable } from '../ComparisonTable';
import { Seo } from '../../seo/Seo';
import { JsonLd } from '../../seo/JsonLd';
import { breadcrumbSchema, faqSchema } from '../../seo/siteSchema';
import { comparisons } from '../../../data/comparisons';

const SITE_ORIGIN = 'https://complyeasyai.com';
const CANONICAL_PATH = '/compare/drata-alternative';

const PAGE_TITLE = 'ComplyEasy AI vs Drata: The Best Drata Alternative';
const PAGE_DESCRIPTION =
  'Compare ComplyEasy AI and Drata for compliance automation. See how an AI-native, agentic platform with broad AI-regulation coverage (EU AI Act, NIST AI RMF) stacks up against Drata across continuous monitoring, frameworks, and pricing transparency.';

/** Question/answer pairs used both for the on-page FAQ and the FAQ JSON-LD. */
const FAQ_PAIRS: { q: string; a: string }[] = [
  {
    q: 'Is ComplyEasy AI a good alternative to Drata?',
    a: 'Teams evaluate ComplyEasy AI as a Drata alternative when they want an AI-native platform with agentic automation and broad coverage of AI-governance regulation. ComplyEasy AI provides a comparable continuous-control-monitoring foundation while adding autonomous remediation with rollback, predictive risk forecasting, and dedicated support for the EU AI Act and the NIST AI Risk Management Framework.',
  },
  {
    q: 'What does ComplyEasy AI offer that differentiates it from Drata?',
    a: 'ComplyEasy AI differentiates on agentic AI that can act on findings with blast-radius estimation and automatic rollback, predictive risk forecasting that models compliance trajectory months ahead, first-class coverage of AI regulations alongside classic security frameworks, and transparent published pricing tiers from Foundation to Visionary.',
  },
  {
    q: 'Which compliance frameworks does ComplyEasy AI support?',
    a: 'ComplyEasy AI helps teams achieve and maintain readiness for SOC 2 Type I and II, ISO 27001, GDPR, HIPAA, and emerging AI-governance frameworks including the EU AI Act and the NIST AI Risk Management Framework, with cross-framework control mapping so a single piece of evidence can satisfy overlapping requirements.',
  },
  {
    q: 'Does ComplyEasy AI provide continuous control monitoring like Drata?',
    a: 'Yes. ComplyEasy AI continuously monitors controls and collects evidence through autonomous agents rather than relying solely on scheduled checks, surfacing drift as it happens across connected systems.',
  },
  {
    q: 'How does ComplyEasy AI handle data security and privacy?',
    a: 'ComplyEasy AI supports bring-your-own-key (BYOK) encryption and privacy-preserving evidence sharing through zero-knowledge proofs, so sensitive evidence can be verified by auditors or partners without exposing the underlying data.',
  },
  {
    q: 'Is ComplyEasy AI pricing published?',
    a: 'Yes. ComplyEasy AI publishes pricing across four tiers (Foundation, Essentials, Growth, and Visionary), so teams can evaluate cost without going through a sales cycle first.',
  },
];

const DrataAlternative: React.FC = () => {
  const data = comparisons['drata-alternative'];

  const breadcrumbs = breadcrumbSchema([
    { name: 'Home', url: SITE_ORIGIN + '/' },
    { name: 'Compare', url: SITE_ORIGIN + '/compare/vanta-alternative' },
    { name: 'Drata alternative', url: SITE_ORIGIN + CANONICAL_PATH },
  ]);

  return (
    <MarketingLayout>
      <Seo
        title={PAGE_TITLE}
        description={PAGE_DESCRIPTION}
        canonicalPath={CANONICAL_PATH}
        keywords="Drata alternative, ComplyEasy AI vs Drata, compliance automation, AI-native compliance, EU AI Act, NIST AI RMF, SOC 2 automation"
      />
      <JsonLd data={breadcrumbs} />
      <JsonLd data={faqSchema(FAQ_PAIRS)} />

      {/* ============================== Hero ============================== */}
      <section className="relative overflow-hidden mesh-gradient">
        <div className="absolute inset-0 dot-pattern opacity-40" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-surface-500 dark:text-surface-400">
              <li>
                <Link to="/" className="transition-colors hover:text-brand-600 dark:hover:text-brand-400">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="font-medium text-surface-700 dark:text-surface-200">
                Drata alternative
              </li>
            </ol>
          </nav>

          <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-4 py-1.5 text-sm font-medium text-brand-700 dark:bg-brand-900/50 dark:text-brand-300">
            <Sparkles size={15} aria-hidden="true" />
            Drata alternative
          </span>

          <h1 className="mt-6 max-w-4xl text-4xl font-bold tracking-tight text-surface-900 dark:text-white sm:text-5xl lg:text-6xl">
            ComplyEasy AI vs Drata:{' '}
            <span className="text-gradient">the best Drata alternative</span>
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-surface-600 dark:text-surface-300">
            Teams evaluate ComplyEasy AI as a Drata alternative because it pairs a comparable
            continuous-control-monitoring foundation with an AI-native, agentic architecture and
            first-class coverage of emerging AI regulations such as the EU AI Act and the NIST AI
            Risk Management Framework. {data.intro}
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              Start free
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <a
              href="#comparison"
              className="inline-flex items-center gap-2 rounded-full border border-surface-300 px-6 py-3 text-sm font-semibold text-surface-700 transition-colors hover:border-brand-500 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-surface-600 dark:text-surface-200 dark:hover:border-brand-400 dark:hover:text-brand-400"
            >
              See the comparison
            </a>
          </div>
        </div>
      </section>

      {/* ========================= Comparison table ======================= */}
      <section id="comparison" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-surface-900 dark:text-white sm:text-4xl">
              ComplyEasy AI and Drata, feature by feature
            </h2>
            <p className="mt-4 text-lg text-surface-600 dark:text-surface-300">
              A capability-focused comparison. Values marked &ldquo;Varies&rdquo; depend on the Drata
              plan or are not publicly fixed, so we describe them honestly rather than overstating
              the difference.
            </p>
          </div>

          <div className="mt-12">
            <ComparisonTable competitorName="Drata" rows={data.rows} />
          </div>
        </div>
      </section>

      {/* ===================== Why teams choose us ======================== */}
      <section className="border-t border-surface-200 bg-surface-50 py-24 dark:border-surface-800 dark:bg-surface-900/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-surface-900 dark:text-white sm:text-4xl">
              Why teams choose ComplyEasy AI
            </h2>
            <p className="mt-4 text-lg text-surface-600 dark:text-surface-300">
              The differences that matter most when teams move beyond monitoring-first tooling.
            </p>
          </div>

          <ul className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2">
            {data.whyChoose.map((reason) => (
              <li
                key={reason}
                className="flex gap-4 rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-950"
              >
                <span
                  className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300"
                  aria-hidden="true"
                >
                  <ShieldCheck size={20} />
                </span>
                <p className="text-base leading-relaxed text-surface-700 dark:text-surface-200">
                  {reason}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ===================== Fairness: when Drata fits ================== */}
      <section className="py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-surface-200 bg-white p-8 shadow-sm dark:border-surface-700 dark:bg-surface-950 sm:p-10">
            <div className="flex items-center gap-3">
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-300"
                aria-hidden="true"
              >
                <Scale size={20} />
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-white">
                When Drata might fit
              </h2>
            </div>
            <p className="mt-5 text-base leading-relaxed text-surface-600 dark:text-surface-300">
              Drata is a well-established compliance automation platform with a strong track record in
              continuous control monitoring and a mature ecosystem. If your program is centered on
              widely adopted security frameworks and your team already relies on Drata&rsquo;s
              integrations and workflows, it remains a capable choice. ComplyEasy AI is most
              compelling when AI-native agentic automation, predictive risk forecasting, and dedicated
              AI-governance coverage (EU AI Act, NIST AI RMF) are priorities, or when transparent
              published pricing matters to your evaluation. We encourage you to compare both against
              your own requirements.
            </p>
          </div>
        </div>
      </section>

      {/* ============================== FAQ =============================== */}
      <section className="border-t border-surface-200 bg-surface-50 py-24 dark:border-surface-800 dark:bg-surface-900/40">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-surface-900 dark:text-white sm:text-4xl">
            Frequently asked questions
          </h2>
          <dl className="mt-10 space-y-6">
            {FAQ_PAIRS.map((pair) => (
              <div
                key={pair.q}
                className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-950"
              >
                <dt className="text-lg font-semibold text-surface-900 dark:text-white">
                  {pair.q}
                </dt>
                <dd className="mt-3 text-base leading-relaxed text-surface-600 dark:text-surface-300">
                  {pair.a}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ============================== CTA ============================== */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl bg-brand-600 px-6 py-16 text-center shadow-xl sm:px-12">
            <div className="absolute inset-0 dot-pattern opacity-20" aria-hidden="true" />
            <div className="relative mx-auto max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                See why teams pick ComplyEasy AI
              </h2>
              <p className="mt-4 text-lg text-brand-50">
                Put AI-native, agentic compliance automation to work across your security, privacy,
                and AI-governance frameworks.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-700 shadow-lg transition-colors hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-white"
                >
                  Start free
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <Link
                  to="/compare/vanta-alternative"
                  className="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
                >
                  See more comparisons
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
};

export default DrataAlternative;
export { DrataAlternative };
