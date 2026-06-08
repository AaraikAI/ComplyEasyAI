import React from 'react';
import { Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, ArrowRight, CalendarDays } from 'lucide-react';
import MarketingLayout from '../MarketingLayout';
import { Seo } from '../../seo/Seo';
import { JsonLd } from '../../seo/JsonLd';
import { breadcrumbSchema } from '../../seo/siteSchema';
import { getBlogPost } from '../../../data/blog';

const SITE_ORIGIN = 'https://complyeasyai.com';
const ARTICLE_IMAGE = 'https://complyeasyai.com/og/default-og.svg';

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
 * Markdown renderer styled for readable long-form body copy in the teal design
 * system, with full light/dark support.
 */
const markdownComponents = {
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2
      className="mt-12 mb-4 text-2xl font-bold tracking-tight text-surface-900 dark:text-white"
      {...props}
    />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3
      className="mt-8 mb-3 text-xl font-semibold tracking-tight text-surface-900 dark:text-white"
      {...props}
    />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="my-5 leading-relaxed text-surface-700 dark:text-surface-300" {...props} />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="my-5 list-disc space-y-2 pl-6 text-surface-700 dark:text-surface-300" {...props} />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="my-5 list-decimal space-y-2 pl-6 text-surface-700 dark:text-surface-300" {...props} />
  ),
  li: (props: React.LiHTMLAttributes<HTMLLIElement>) => (
    <li className="leading-relaxed marker:text-brand-500" {...props} />
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      className="font-medium text-brand-600 underline decoration-brand-300 underline-offset-2 transition-colors hover:text-brand-700 dark:text-brand-400 dark:decoration-brand-700 dark:hover:text-brand-300"
      {...props}
    />
  ),
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-semibold text-surface-900 dark:text-white" {...props} />
  ),
  em: (props: React.HTMLAttributes<HTMLElement>) => (
    <em className="italic" {...props} />
  ),
  blockquote: (props: React.BlockquoteHTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="my-6 border-l-4 border-brand-400 bg-brand-50/60 py-2 pl-4 pr-2 italic text-surface-700 dark:border-brand-600 dark:bg-brand-950/40 dark:text-surface-300"
      {...props}
    />
  ),
  code: (props: React.HTMLAttributes<HTMLElement>) => (
    <code
      className="rounded bg-surface-100 px-1.5 py-0.5 text-sm font-mono text-brand-700 dark:bg-surface-800 dark:text-brand-300"
      {...props}
    />
  ),
  table: (props: React.TableHTMLAttributes<HTMLTableElement>) => (
    <div className="my-6 overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-800">
      <table className="w-full border-collapse text-left text-sm" {...props} />
    </div>
  ),
  thead: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead className="bg-surface-50 dark:bg-surface-900" {...props} />
  ),
  th: (props: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th
      className="border-b border-surface-200 px-4 py-3 font-semibold text-surface-900 dark:border-surface-800 dark:text-white"
      {...props}
    />
  ),
  td: (props: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td
      className="border-b border-surface-100 px-4 py-3 text-surface-700 dark:border-surface-800/70 dark:text-surface-300"
      {...props}
    />
  ),
  hr: () => <hr className="my-10 border-surface-200 dark:border-surface-800" />,
};

/**
 * Individual blog article (/blog/:slug). Looks the post up by slug; an unknown
 * slug renders a noindex not-found message. A valid post renders the article
 * with a byline, markdown body, CTA, and Article + breadcrumb structured data.
 */
const BlogPost: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getBlogPost(slug) : undefined;

  if (!post) {
    return (
      <MarketingLayout>
        <Seo
          title="Article not found | ComplyEasy AI"
          description="The blog article you are looking for could not be found."
          canonicalPath="/blog"
          noindex
        />
        <section className="mx-auto max-w-3xl px-4 py-32 text-center sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-surface-900 dark:text-white">
            Article not found
          </h1>
          <p className="mt-4 text-lg text-surface-600 dark:text-surface-300">
            We couldn&rsquo;t find the article you were looking for. It may have moved or been renamed.
          </p>
          <Link
            to="/blog"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to the blog
          </Link>
        </section>
      </MarketingLayout>
    );
  }

  const canonicalUrl = `${SITE_ORIGIN}/blog/${post.slug}`;

  const articleSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      '@type': 'Organization',
      name: 'ComplyEasy AI',
    },
    image: ARTICLE_IMAGE,
    mainEntityOfPage: canonicalUrl,
  };

  const breadcrumb = breadcrumbSchema([
    { name: 'Home', url: SITE_ORIGIN + '/' },
    { name: 'Blog', url: SITE_ORIGIN + '/blog' },
    { name: post.title, url: canonicalUrl },
  ]);

  return (
    <MarketingLayout>
      <Seo
        title={post.title}
        description={post.description}
        canonicalPath={`/blog/${post.slug}`}
        ogType="article"
        keywords={post.tags.join(', ')}
      />
      <JsonLd data={articleSchema} />
      <JsonLd data={breadcrumb} />

      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
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
              <Link to="/blog" className="transition-colors hover:text-brand-600 dark:hover:text-brand-400">
                Blog
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="font-medium text-surface-700 dark:text-surface-200" aria-current="page">
              {post.title}
            </li>
          </ol>
        </nav>

        {/* Header */}
        <header className="mb-10">
          {post.tags.length > 0 && (
            <ul className="mb-5 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <li
                  key={tag}
                  className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 dark:bg-brand-950/60 dark:text-brand-300"
                >
                  {tag}
                </li>
              ))}
            </ul>
          )}
          <h1 className="text-4xl font-bold tracking-tight text-surface-900 sm:text-5xl dark:text-white">
            {post.title}
          </h1>
          <p className="mt-5 text-lg text-surface-600 dark:text-surface-300">{post.description}</p>
          <div className="mt-6 flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400">
            <CalendarDays size={15} aria-hidden="true" />
            <span>
              By {post.author} &middot;{' '}
              <time dateTime={post.date}>{formatDate(post.date)}</time>
            </span>
          </div>
        </header>

        {/* Body */}
        <div className="text-base">
          <ReactMarkdown components={markdownComponents}>{post.body}</ReactMarkdown>
        </div>

        {/* CTA */}
        <aside className="mt-16 overflow-hidden rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-8 text-center shadow-sm dark:border-brand-800/60 dark:from-brand-950/50 dark:to-surface-900">
          <h2 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-white">
            Make compliance continuous
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-surface-600 dark:text-surface-300">
            See how ComplyEasy AI automates evidence collection, monitors controls, and maps a single
            control set across every framework you need.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              Start free
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 rounded-full border border-surface-300 px-6 py-3 text-sm font-semibold text-surface-700 transition-colors hover:border-brand-400 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-surface-700 dark:text-surface-200 dark:hover:border-brand-600 dark:hover:text-brand-400"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              More articles
            </Link>
          </div>
        </aside>
      </article>
    </MarketingLayout>
  );
};

export default BlogPost;
export { BlogPost };
