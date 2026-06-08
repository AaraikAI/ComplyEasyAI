import React from 'react';
import { Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, BookOpen } from 'lucide-react';
import MarketingLayout from '../MarketingLayout';
import Seo from '../../seo/Seo';
import JsonLd from '../../seo/JsonLd';
import { breadcrumbSchema } from '../../seo/siteSchema';
import { getGlossaryTerm } from '../../../data/glossary';

const SITE_ORIGIN = 'https://complyeasyai.com';
const TERM_SET_URL = SITE_ORIGIN + '/glossary';

/**
 * Single glossary entry (/glossary/:term). Renders the quotable short
 * definition first, the full body, and links to related terms. Emits
 * DefinedTerm and breadcrumb structured data.
 */
const GlossaryTerm: React.FC = () => {
  const { term: slug } = useParams<{ term: string }>();
  const entry = slug ? getGlossaryTerm(slug) : undefined;

  if (!entry) {
    return (
      <MarketingLayout>
        <Seo
          title="Term not found | ComplyEasy AI Glossary"
          description="The glossary term you requested could not be found."
          canonicalPath="/glossary"
          noindex
        />
        <section className="mx-auto max-w-3xl px-4 py-32 text-center sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl dark:text-white">
            Term not found
          </h1>
          <p className="mt-4 text-lg text-surface-600 dark:text-surface-300">
            We couldn&apos;t find a glossary entry for that term. It may have been renamed or
            removed.
          </p>
          <Link
            to="/glossary"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to the glossary
          </Link>
        </section>
      </MarketingLayout>
    );
  }

  const related = entry.related
    .map((relatedSlug) => getGlossaryTerm(relatedSlug))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  const canonicalPath = '/glossary/' + entry.slug;

  const breadcrumbs = breadcrumbSchema([
    { name: 'Home', url: SITE_ORIGIN + '/' },
    { name: 'Glossary', url: TERM_SET_URL },
    { name: entry.term, url: SITE_ORIGIN + canonicalPath },
  ]);

  const definedTerm = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: entry.term,
    description: entry.shortDef,
    url: SITE_ORIGIN + canonicalPath,
    inDefinedTermSet: TERM_SET_URL,
  };

  return (
    <MarketingLayout>
      <Seo
        title={`${entry.term} — Definition & Meaning | ComplyEasy AI`}
        description={entry.shortDef}
        canonicalPath={canonicalPath}
        ogType="article"
      />
      <JsonLd data={definedTerm} />
      <JsonLd data={breadcrumbs} />

      <article className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-surface-500 dark:text-surface-400">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link to="/" className="transition-colors hover:text-brand-600 dark:hover:text-brand-400">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                to="/glossary"
                className="transition-colors hover:text-brand-600 dark:hover:text-brand-400"
              >
                Glossary
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="font-medium text-surface-700 dark:text-surface-200">{entry.term}</li>
          </ol>
        </nav>

        <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-300">
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          Glossary
        </span>

        <h1 className="mt-6 text-4xl font-bold tracking-tight text-surface-900 sm:text-5xl dark:text-white">
          {entry.term}
        </h1>

        {/* Quotable definition, rendered first for answer-engine extraction. */}
        <p className="mt-6 border-l-4 border-brand-500 pl-5 text-xl font-medium leading-relaxed text-surface-800 dark:text-surface-100">
          {entry.shortDef}
        </p>

        {/* Full explanation */}
        <div className="prose prose-surface mt-10 max-w-none dark:prose-invert prose-headings:font-semibold prose-a:text-brand-600 dark:prose-a:text-brand-400 prose-p:leading-relaxed prose-p:text-surface-600 dark:prose-p:text-surface-300">
          <ReactMarkdown>{entry.body}</ReactMarkdown>
        </div>

        {/* Related terms */}
        {related.length > 0 && (
          <section className="mt-14 border-t border-surface-200 pt-10 dark:border-surface-800">
            <h2 className="text-lg font-semibold text-surface-900 dark:text-white">Related terms</h2>
            <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {related.map((relatedTerm) => (
                <li key={relatedTerm.slug}>
                  <Link
                    to={'/glossary/' + relatedTerm.slug}
                    className="group flex flex-col rounded-xl border border-surface-200 bg-white p-4 transition-all hover:border-brand-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-surface-800 dark:bg-surface-900 dark:hover:border-brand-700"
                  >
                    <span className="font-medium text-surface-900 transition-colors group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400">
                      {relatedTerm.term}
                    </span>
                    <span className="mt-1 line-clamp-2 text-sm text-surface-500 dark:text-surface-400">
                      {relatedTerm.shortDef}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-14">
          <Link
            to="/glossary"
            className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to all terms
          </Link>
        </div>
      </article>
    </MarketingLayout>
  );
};

export default GlossaryTerm;
export { GlossaryTerm };
