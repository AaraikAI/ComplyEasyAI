import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Tag } from 'lucide-react';
import MarketingLayout from '../MarketingLayout';
import { Seo } from '../../seo/Seo';
import { JsonLd } from '../../seo/JsonLd';
import { breadcrumbSchema } from '../../seo/siteSchema';
import { blogPosts } from '../../../data/blog';

const SITE_ORIGIN = 'https://complyeasyai.com';

/** Format a 'YYYY-MM-DD' string as a readable date without relying on a runtime clock. */
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-');
  const monthIndex = Number(month) - 1;
  const name = MONTHS[monthIndex] ?? month;
  return `${name} ${Number(day)}, ${year}`;
}

/**
 * Blog landing page (/blog): a grid of post cards linking into individual
 * articles, with breadcrumb structured data for richer search results.
 */
const BlogIndex: React.FC = () => {
  const breadcrumb = breadcrumbSchema([
    { name: 'Home', url: SITE_ORIGIN + '/' },
    { name: 'Blog', url: SITE_ORIGIN + '/blog' },
  ]);

  return (
    <MarketingLayout>
      <Seo
        title="Blog — AI Compliance Insights | ComplyEasy AI"
        description="Practical guides on automating SOC 2, ISO 27001, GDPR, the EU AI Act, and more with AI-native continuous compliance. Insights from the ComplyEasy AI team."
        canonicalPath="/blog"
        keywords="AI compliance blog, SOC 2 automation, EU AI Act, continuous compliance, GRC insights"
      />
      <JsonLd data={breadcrumb} />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-surface-200/60 dark:border-surface-800/60">
        <div className="absolute inset-0 mesh-gradient opacity-60 dark:opacity-40" aria-hidden="true" />
        <div className="absolute inset-0 dot-pattern opacity-[0.15]" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-surface-500 dark:text-surface-400">
            <ol className="flex items-center gap-2">
              <li>
                <Link to="/" className="transition-colors hover:text-brand-600 dark:hover:text-brand-400">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="font-medium text-surface-700 dark:text-surface-200">Blog</li>
            </ol>
          </nav>

          <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Insights
          </p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-surface-900 sm:text-5xl dark:text-white">
            <span className="text-gradient">AI compliance</span> insights
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-surface-600 dark:text-surface-300">
            Practical, answer-first guides on automating security, privacy, and AI-governance
            frameworks with continuous, AI-native compliance.
          </p>
        </div>
      </section>

      {/* Post grid */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <h2 className="sr-only">All articles</h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((post) => (
            <article
              key={post.slug}
              className="group flex flex-col rounded-2xl border border-surface-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl dark:border-surface-800 dark:bg-surface-900 dark:hover:border-brand-700"
            >
              <div className="mb-4 flex items-center gap-2 text-xs font-medium text-surface-500 dark:text-surface-400">
                <CalendarDays size={14} aria-hidden="true" />
                <time dateTime={post.date}>{formatDate(post.date)}</time>
              </div>

              <h3 className="text-xl font-semibold leading-snug text-surface-900 transition-colors group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400">
                <Link to={`/blog/${post.slug}`} className="focus:outline-none focus:ring-2 focus:ring-brand-500 rounded">
                  {post.title}
                </Link>
              </h3>

              <p className="mt-3 flex-1 text-sm leading-relaxed text-surface-600 dark:text-surface-300">
                {post.description}
              </p>

              {post.tags.length > 0 && (
                <ul className="mt-5 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <li
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 dark:bg-brand-950/60 dark:text-brand-300"
                    >
                      <Tag size={11} aria-hidden="true" />
                      {tag}
                    </li>
                  ))}
                </ul>
              )}

              <Link
                to={`/blog/${post.slug}`}
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 rounded dark:text-brand-400 dark:hover:text-brand-300"
                aria-label={`Read ${post.title}`}
              >
                Read article
                <ArrowRight size={15} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </article>
          ))}
        </div>
      </section>
    </MarketingLayout>
  );
};

export default BlogIndex;
export { BlogIndex };
