import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, KeyRound, ScrollText, ArrowRight, Info } from 'lucide-react';
import { MarketingLayout } from '../MarketingLayout';
import { ComparisonTable } from '../ComparisonTable';
import { Seo } from '../../seo/Seo';
import { JsonLd } from '../../seo/JsonLd';
import { breadcrumbSchema, faqSchema } from '../../seo/siteSchema';
import { comparisons } from '../../../data/comparisons';

const SITE_ORIGIN = 'https://complyeasyai.com';
const CANONICAL_PATH = '/compare/secureframe-alternative';

const data = comparisons['secureframe-alternative'];

/** Icons paired with the whyChoose bullet points, in order. */
const WHY_ICONS = [Sparkles, ShieldCheck, ScrollText, KeyRound];

const FAQS: { q: string; a: string }[] = [
  {
    q: 'What is the best Secureframe alternative?',
    a: 'Teams comparing Secureframe alternatives evaluate ComplyEasy AI because it is AI-native: autonomous agents collect evidence, map controls, and monitor for drift continuously. It covers the same core frameworks as Secureframe — SOC 2, ISO 27001, HIPAA, and GDPR — and adds first-class coverage of AI-governance regulation such as the EU AI Act and the NIST AI Risk Management Framework.',
  },
  {
    q: 'How is ComplyEasy AI different from Secureframe?',
    a: 'Both platforms automate evidence collection and continuous control monitoring. ComplyEasy AI differentiates with agentic automation that can remediate findings autonomously with blast-radius estimation and automatic rollback, privacy-preserving evidence sharing through zero-knowledge proofs, bring-your-own-key (BYOK) encryption, and published pricing tiers from Foundation to Visionary.',
  },
  {
    q: 'Does ComplyEasy AI support SOC 2, ISO 27001, and HIPAA like Secureframe?',
    a: 'Yes. ComplyEasy AI helps teams achieve and maintain readiness for SOC 2 Type I and Type II, ISO 27001, HIPAA, and GDPR, alongside emerging AI-governance frameworks. Cross-framework control mapping lets evidence collected for one framework satisfy overlapping controls in another.',
  },
  {
    q: 'Does ComplyEasy AI cover AI-specific regulations?',
    a: 'Yes. In addition to traditional security and privacy frameworks, ComplyEasy AI provides dedicated coverage of the EU AI Act and the NIST AI Risk Management Framework, which is useful for teams shipping AI products that need to govern model risk alongside their security posture.',
  },
  {
    q: 'Is ComplyEasy AI pricing published?',
    a: 'Yes. ComplyEasy AI publishes pricing across four tiers — Foundation, Essentials, Growth, and Visionary — so teams can evaluate cost without going through a quote-only sales cycle.',
  },
  {
    q: 'How does ComplyEasy AI protect sensitive evidence?',
    a: 'ComplyEasy AI supports bring-your-own-key (BYOK) encryption and zero-knowledge proof evidence sharing, which lets organizations demonstrate that a control is met without exposing the underlying sensitive data to auditors or third parties.',
  },
];

const breadcrumbItems = [
  { name: 'Home', url: `${SITE_ORIGIN}/` },
  { name: 'Compare', url: `${SITE_ORIGIN}/compare/vanta-alternative` },
  { name: 'Secureframe alternative', url: `${SITE_ORIGIN}${CANONICAL_PATH}` },
];

const SecureframeAlternative: React.FC = () => {
  return (
    <MarketingLayout>
      <Seo
        title="ComplyEasy AI vs Secureframe: The Best Secureframe Alternative"
        description="Comparing Secureframe alternatives? See how ComplyEasy AI's AI-native agentic automation, SOC 2 / ISO 27001 / HIPAA coverage, and EU AI Act and NIST AI RMF support stack up against Secureframe — feature by feature."
        canonicalPath={CANONICAL_PATH}
        keywords="Secureframe alternative, ComplyEasy AI vs Secureframe, compliance automation, SOC 2, ISO 27001, HIPAA, EU AI Act, NIST AI RMF"
      />
      <JsonLd data={breadcrumbSchema(breadcrumbItems)} />
      <JsonLd data={faqSchema(FAQS)} />

      {/* ============================== Hero ============================== */}
      <section className="relative overflow-hidden border-b border-surface-200 dark:border-surface-800">
        <div className="absolute inset-0 mesh-gradient opacity-60 dark:opacity-40" aria-hidden="true" />
        <div className="absolute inset-0 dot-pattern opacity-[0.15]" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
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
                Secureframe alternative
              </li>
            </ol>
          </nav>

          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700 dark:border-brand-800 dark:bg-brand-950/60 dark:text-brand-300">
              <Sparkles size={15} aria-hidden="true" />
              Secureframe alternative
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-surface-900 dark:text-white sm:text-5xl">
              ComplyEasy AI vs Secureframe:{' '}
              <span className="text-gradient">the best Secureframe alternative</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-surface-600 dark:text-surface-300">
              Teams evaluate ComplyEasy AI as a Secureframe alternative because it is AI-native: autonomous
              agents collect evidence, map controls, and monitor compliance continuously, while covering the
              same core frameworks as Secureframe — SOC 2, ISO 27001, HIPAA, and GDPR — and adding first-class
              support for AI-governance regulation such as the EU AI Act and the NIST AI Risk Management
              Framework.
            </p>
            <p className="mt-4 text-base leading-relaxed text-surface-600 dark:text-surface-400">
              {data.intro}
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
                className="inline-flex items-center gap-2 rounded-full border border-surface-300 px-6 py-3 text-sm font-semibold text-surface-700 transition-colors hover:border-brand-400 hover:text-brand-700 dark:border-surface-700 dark:text-surface-200 dark:hover:border-brand-500 dark:hover:text-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                See the comparison
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ============================ Comparison =========================== */}
      <section id="comparison" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-surface-900 dark:text-white">
            ComplyEasy AI vs Secureframe, feature by feature
          </h2>
          <p className="mt-4 text-base text-surface-600 dark:text-surface-300">
            A capability-focused comparison. Values marked &ldquo;Varies&rdquo; depend on the Secureframe plan
            or are not publicly fixed.
          </p>
        </div>
        <div className="mt-12">
          <ComparisonTable competitorName="Secureframe" rows={data.rows} />
        </div>
      </section>

      {/* =========================== Why choose =========================== */}
      <section className="border-y border-surface-200 bg-surface-50/60 py-24 dark:border-surface-800 dark:bg-surface-900/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-surface-900 dark:text-white">
              Why teams choose ComplyEasy AI
            </h2>
            <p className="mt-4 text-base text-surface-600 dark:text-surface-300">
              Where an AI-native approach to compliance automation makes a measurable difference.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {data.whyChoose.map((reason, idx) => {
              const Icon = WHY_ICONS[idx % WHY_ICONS.length];
              return (
                <div
                  key={reason}
                  className="flex gap-4 rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-950"
                >
                  <span
                    className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300"
                    aria-hidden="true"
                  >
                    <Icon size={20} />
                  </span>
                  <p className="text-base leading-relaxed text-surface-700 dark:text-surface-200">
                    {reason}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================== Fairness note ========================= */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-surface-200 bg-white p-8 shadow-sm dark:border-surface-700 dark:bg-surface-950">
          <div className="flex items-start gap-4">
            <span
              className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-300"
              aria-hidden="true"
            >
              <Info size={18} />
            </span>
            <div>
              <h2 className="text-xl font-semibold text-surface-900 dark:text-white">
                When Secureframe might fit
              </h2>
              <p className="mt-3 text-base leading-relaxed text-surface-600 dark:text-surface-300">
                Secureframe is a mature, well-regarded compliance automation platform with broad framework
                coverage and an established integration ecosystem. If your priority is a long-running track
                record for core security frameworks like SOC 2 and ISO 27001, and AI-governance regulation is
                not yet on your roadmap, Secureframe is a strong choice worth evaluating. ComplyEasy AI tends to
                be the better fit when agentic automation, predictive risk insight, privacy-preserving evidence
                sharing, transparent pricing, or dedicated AI-regulation coverage matter to your team.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =============================== FAQ ============================== */}
      <section className="border-t border-surface-200 bg-surface-50/60 py-24 dark:border-surface-800 dark:bg-surface-900/40">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold tracking-tight text-surface-900 dark:text-white">
            Frequently asked questions
          </h2>
          <dl className="mt-12 space-y-4">
            {FAQS.map((faq) => (
              <div
                key={faq.q}
                className="rounded-2xl border border-surface-200 bg-white p-6 dark:border-surface-700 dark:bg-surface-950"
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

      {/* =============================== CTA ============================== */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-brand-950 px-8 py-16 text-center shadow-2xl sm:px-16">
          <div className="absolute inset-0 mesh-gradient opacity-30" aria-hidden="true" />
          <div className="absolute inset-0 noise opacity-[0.04]" aria-hidden="true" />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              See ComplyEasy AI as your Secureframe alternative
            </h2>
            <p className="mt-4 text-lg text-brand-100">
              Put AI-native, agentic compliance automation to work across SOC 2, ISO 27001, HIPAA, GDPR, and
              AI-governance frameworks.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-brand-700 shadow-lg transition-colors hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-white"
              >
                Start free
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
              >
                View pricing
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
};

export default SecureframeAlternative;
export { SecureframeAlternative };
