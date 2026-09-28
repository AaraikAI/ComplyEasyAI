import React from 'react';
import { Link } from 'react-router';
import { BookOpen } from 'lucide-react';
import MarketingLayout from '../MarketingLayout';
import Seo from '../../seo/Seo';
import JsonLd from '../../seo/JsonLd';
import { breadcrumbSchema, reviewedWebPageSchema } from '../../seo/siteSchema';
import { BRAND_NAME } from '../../seo/brand';
import { glossaryLastReviewed, glossaryTerms } from '../../../data/glossary';
import { SITE_ORIGIN } from '../../seo/siteOrigin';
import { ReviewedByline, TldrList } from '../answerFirst';

const SEO_TITLE = `Compliance & AI Governance Glossary | ${BRAND_NAME}`;
const SEO_DESCRIPTION =
  'Plain-language, vendor-neutral definitions of compliance, privacy and AI-governance terms, from SOC 2 and ISO 27001 to the EU AI Act, GDPR, DPIAs and continuous compliance.';

const GLOSSARY_TLDR = [
  'The first sentence of every entry is the definition.',
  'Each entry lists key takeaways and answers common follow-up questions.',
  'Every term links to related terms and to a deeper guide.',
];

/**
 * Glossary landing page (/glossary). Answer-first introduction, then every
 * compliance, privacy and AI-governance term with its quotable definition,
 * linking to the full entry.
 */
const GlossaryIndex: React.FC = () => {
  const terms = [...glossaryTerms].sort((a, b) =>
    a.term.localeCompare(b.term, 'en', { sensitivity: 'base' }),
  );
  const lastReviewed = glossaryLastReviewed();
  const answer = `The ${BRAND_NAME} glossary defines ${terms.length} core compliance terms, from SOC 2 and ISO 27001 to DPIAs, risk registers and the EU AI Act. Each entry opens with a one-paragraph definition you can quote, then explains how the term works in practice and links to related terms.`;

  const breadcrumbs = breadcrumbSchema([
    { name: 'Home', url: SITE_ORIGIN + '/' },
    { name: 'Glossary', url: SITE_ORIGIN + '/glossary' },
  ]);

  return (
    <MarketingLayout>
      <Seo
        title={SEO_TITLE}
        description={SEO_DESCRIPTION}
        canonicalPath="/glossary"
        keywords="compliance glossary, AI governance terms, SOC 2 definition, ISO 27001, GDPR, EU AI Act, GRC"
      />
      <JsonLd data={breadcrumbs} />
      <JsonLd
        data={reviewedWebPageSchema({
          name: SEO_TITLE,
          description: SEO_DESCRIPTION,
          path: '/glossary',
          lastReviewed,
          about: 'Compliance and AI-governance terminology',
        })}
      />

      {/* ============================== Hero ============================== */}
      <section className="relative overflow-hidden border-b border-surface-200 dark:border-surface-800">
        <div className="mesh-gradient absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-surface-500 dark:text-surface-400">
            <ol className="flex items-center gap-2">
              <li>
                <Link to="/" className="transition-colors hover:text-brand-600 dark:hover:text-brand-400">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="font-medium text-surface-700 dark:text-surface-200">Glossary</li>
            </ol>
          </nav>

          <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-300">
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            Glossary
          </span>

          <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-surface-900 sm:text-5xl dark:text-white">
            Compliance glossary: <span className="text-gradient">SOC 2, GDPR, the EU AI Act and more</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-surface-600 dark:text-surface-300">
            Plain-language definitions of the terms that come up in security, privacy and
            AI-governance work.
          </p>
          <p
            id="glossary-answer"
            className="mt-4 max-w-2xl text-base leading-relaxed text-surface-700 dark:text-surface-200"
          >
            {answer}
          </p>
          <TldrList items={GLOSSARY_TLDR} className="mt-8 max-w-2xl" />
          <ReviewedByline lastReviewed={lastReviewed} className="mt-6" />
        </div>
      </section>

      {/* ============================== Terms ============================= */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <h2 className="sr-only">Which terms does the glossary define?</h2>
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {terms.map((entry) => (
            <li key={entry.slug}>
              <Link
                to={'/glossary/' + entry.slug}
                className="group flex h-full flex-col rounded-2xl border border-surface-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-surface-800 dark:bg-surface-900 dark:hover:border-brand-700"
              >
                <h3 className="text-lg font-semibold text-surface-900 transition-colors group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400">
                  {entry.term}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-surface-600 dark:text-surface-300">
                  {entry.shortDef}
                </p>
                <span className="mt-4 text-sm font-medium text-brand-600 dark:text-brand-400">
                  Read definition →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </MarketingLayout>
  );
};

export default GlossaryIndex;
export { GlossaryIndex };
