import React from 'react';
import { Link } from 'react-router';
import { BookOpen } from 'lucide-react';
import MarketingLayout from '../MarketingLayout';
import Seo from '../../seo/Seo';
import JsonLd from '../../seo/JsonLd';
import { breadcrumbSchema } from '../../seo/siteSchema';
import { glossaryTerms } from '../../../data/glossary';

const SITE_ORIGIN = 'https://complyeasyai.com';

/**
 * Glossary landing page (/glossary). Lists every compliance, privacy, and
 * AI-governance term with a short preview, linking to its full definition.
 */
const GlossaryIndex: React.FC = () => {
  const terms = [...glossaryTerms].sort((a, b) =>
    a.term.localeCompare(b.term, 'en', { sensitivity: 'base' }),
  );

  const breadcrumbs = breadcrumbSchema([
    { name: 'Home', url: SITE_ORIGIN + '/' },
    { name: 'Glossary', url: SITE_ORIGIN + '/glossary' },
  ]);

  return (
    <MarketingLayout>
      <Seo
        title="Compliance & AI Governance Glossary | ComplyEasy AI"
        description="Clear, vendor-neutral definitions of compliance, privacy, and AI-governance terms — from SOC 2 and ISO 27001 to the EU AI Act, GDPR, and continuous compliance."
        canonicalPath="/glossary"
        keywords="compliance glossary, AI governance terms, SOC 2 definition, ISO 27001, GDPR, EU AI Act, GRC"
      />
      <JsonLd data={breadcrumbs} />

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
            Reference
          </span>

          <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-surface-900 sm:text-5xl dark:text-white">
            Compliance &amp; AI Governance <span className="text-gradient">Glossary</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-surface-600 dark:text-surface-300">
            Plain-language, vendor-neutral definitions of the terms that come up across security,
            privacy, and AI-governance programs. Browse the full list below, or jump straight to a
            definition.
          </p>
          <p className="mt-3 text-sm text-surface-500 dark:text-surface-400">
            {terms.length} terms · Last updated 2026-06-07
          </p>
        </div>
      </section>

      {/* ============================== Terms ============================= */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <h2 className="sr-only">All glossary terms</h2>
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
