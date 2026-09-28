import React from 'react';
import { Link } from 'react-router';
import { ArrowRight, CalendarDays, Tag } from 'lucide-react';
import MarketingLayout from '../MarketingLayout';
import { Seo } from '../../seo/Seo';
import { JsonLd } from '../../seo/JsonLd';
import { breadcrumbSchema, reviewedWebPageSchema } from '../../seo/siteSchema';
import { BRAND_NAME } from '../../seo/brand';
import { blogPostsNewestFirst } from '../../../data/blog';
import { SITE_ORIGIN } from '../../seo/siteOrigin';
import { formatReviewDate, ReviewedByline, TldrList } from '../answerFirst';

const SEO_TITLE = `Compliance Automation Blog | ${BRAND_NAME}`;
const SEO_DESCRIPTION =
  'Answer-first guides to compliance automation: SOC 2 with AI, the EU AI Act after the Digital Omnibus, India’s DPDP Rules and CSRD after Omnibus I, each with dates and sources.';

const BLOG_INDEX_HOOK = 'Answer-first guides you can act on this week.';

const BLOG_INDEX_ANSWER = `The ${BRAND_NAME} blog publishes practical, answer-first guides to compliance automation. Each post opens with the short answer, lists key takeaways and dates, and cites its sources. Current guides cover automating SOC 2 with AI, the EU AI Act checklist and timeline after the 2026 Digital Omnibus, India’s DPDP Rules and CSRD after Omnibus I.`;

const BLOG_INDEX_TLDR = [
  'Every post starts with a direct answer and a TL;DR.',
  'Regulatory dates are checked against official sources, listed at the end of each post.',
  'Each post shows when it was last reviewed.',
];

/**
 * Blog landing page (/blog): an answer-first introduction, then post cards
 * (newest review first) linking into individual articles, with breadcrumb and
 * reviewed-page structured data.
 */
const BlogIndex: React.FC = () => {
  const posts = blogPostsNewestFirst();
  const lastReviewed = posts[0]?.lastReviewed ?? '2026-09-27';

  const breadcrumb = breadcrumbSchema([
    { name: 'Home', url: SITE_ORIGIN + '/' },
    { name: 'Blog', url: SITE_ORIGIN + '/blog' },
  ]);

  return (
    <MarketingLayout>
      <Seo
        title={SEO_TITLE}
        description={SEO_DESCRIPTION}
        canonicalPath="/blog"
        keywords="compliance automation blog, SOC 2 automation, EU AI Act timeline, DPDP Rules 2025, CSRD Omnibus"
      />
      <JsonLd data={breadcrumb} />
      <JsonLd
        data={reviewedWebPageSchema({
          name: SEO_TITLE,
          description: SEO_DESCRIPTION,
          path: '/blog',
          lastReviewed,
          about: 'Compliance automation',
        })}
      />

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
            Blog
          </p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-surface-900 sm:text-5xl dark:text-white">
            Compliance automation guides: <span className="text-gradient">SOC 2, the EU AI Act and more</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-surface-600 dark:text-surface-300">{BLOG_INDEX_HOOK}</p>
          <p
            id="blog-answer"
            className="mt-4 max-w-2xl text-base leading-relaxed text-surface-700 dark:text-surface-200"
          >
            {BLOG_INDEX_ANSWER}
          </p>
          <TldrList items={BLOG_INDEX_TLDR} className="mt-8 max-w-2xl" />
          <ReviewedByline lastReviewed={lastReviewed} className="mt-6" />
        </div>
      </section>

      {/* Post grid */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <h2 className="sr-only">Which compliance guides can you read?</h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="group flex flex-col rounded-2xl border border-surface-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl dark:border-surface-800 dark:bg-surface-900 dark:hover:border-brand-700"
            >
              <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-medium text-surface-500 dark:text-surface-400">
                <CalendarDays size={14} aria-hidden="true" />
                <time dateTime={post.date}>{formatReviewDate(post.date)}</time>
                {post.lastReviewed !== post.date ? (
                  <span>
                    · Updated <time dateTime={post.lastReviewed}>{formatReviewDate(post.lastReviewed)}</time>
                  </span>
                ) : null}
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
