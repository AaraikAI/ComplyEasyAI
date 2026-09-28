import React from 'react';
import { Link, useParams } from 'react-router';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, ArrowRight, CalendarDays } from 'lucide-react';
import MarketingLayout from '../MarketingLayout';
import { Seo } from '../../seo/Seo';
import { JsonLd } from '../../seo/JsonLd';
import { breadcrumbSchema, faqSchema, reviewedArticleSchema } from '../../seo/siteSchema';
import { BRAND_NAME } from '../../seo/brand';
import { getBlogPost } from '../../../data/blog';
import { TRIAL_CTA } from '../../../data/marketingFacts';
import { SITE_ORIGIN } from '../../seo/siteOrigin';
import { formatReviewDate, ReviewedByline, TldrList } from '../answerFirst';

/** react-markdown passes its AST node to custom components; keep it off the DOM. */
type MarkdownProps<T> = T & { node?: unknown };

const LINK_CLASS =
  'font-medium text-brand-600 underline decoration-brand-300 underline-offset-2 transition-colors hover:text-brand-700 dark:text-brand-400 dark:decoration-brand-700 dark:hover:text-brand-300';

/**
 * Markdown renderer styled for readable long-form body copy, with full
 * light/dark support. Site-relative links navigate inside the SPA; other links
 * open in a new tab.
 */
const markdownComponents = {
  h2: ({ node: _node, ...props }: MarkdownProps<React.HTMLAttributes<HTMLHeadingElement>>) => (
    <h2
      className="mt-12 mb-4 text-2xl font-bold tracking-tight text-surface-900 dark:text-white"
      {...props}
    />
  ),
  h3: ({ node: _node, ...props }: MarkdownProps<React.HTMLAttributes<HTMLHeadingElement>>) => (
    <h3
      className="mt-8 mb-3 text-xl font-semibold tracking-tight text-surface-900 dark:text-white"
      {...props}
    />
  ),
  p: ({ node: _node, ...props }: MarkdownProps<React.HTMLAttributes<HTMLParagraphElement>>) => (
    <p className="my-5 leading-relaxed text-surface-700 dark:text-surface-300" {...props} />
  ),
  ul: ({ node: _node, ...props }: MarkdownProps<React.HTMLAttributes<HTMLUListElement>>) => (
    <ul className="my-5 list-disc space-y-2 pl-6 text-surface-700 dark:text-surface-300" {...props} />
  ),
  ol: ({ node: _node, ...props }: MarkdownProps<React.HTMLAttributes<HTMLOListElement>>) => (
    <ol className="my-5 list-decimal space-y-2 pl-6 text-surface-700 dark:text-surface-300" {...props} />
  ),
  li: ({ node: _node, ...props }: MarkdownProps<React.LiHTMLAttributes<HTMLLIElement>>) => (
    <li className="leading-relaxed marker:text-brand-500" {...props} />
  ),
  a: ({ node: _node, href, children, ...props }: MarkdownProps<React.AnchorHTMLAttributes<HTMLAnchorElement>>) =>
    href && href.startsWith('/') ? (
      <Link to={href} className={LINK_CLASS}>
        {children}
      </Link>
    ) : (
      <a href={href} target="_blank" rel="noopener noreferrer" className={LINK_CLASS} {...props}>
        {children}
      </a>
    ),
  strong: ({ node: _node, ...props }: MarkdownProps<React.HTMLAttributes<HTMLElement>>) => (
    <strong className="font-semibold text-surface-900 dark:text-white" {...props} />
  ),
  em: ({ node: _node, ...props }: MarkdownProps<React.HTMLAttributes<HTMLElement>>) => (
    <em className="italic" {...props} />
  ),
  blockquote: ({ node: _node, ...props }: MarkdownProps<React.BlockquoteHTMLAttributes<HTMLQuoteElement>>) => (
    <blockquote
      className="my-6 border-l-4 border-brand-400 bg-brand-50/60 py-2 pl-4 pr-2 italic text-surface-700 dark:border-brand-600 dark:bg-brand-950/40 dark:text-surface-300"
      {...props}
    />
  ),
  code: ({ node: _node, ...props }: MarkdownProps<React.HTMLAttributes<HTMLElement>>) => (
    <code
      className="rounded bg-surface-100 px-1.5 py-0.5 text-sm font-mono text-brand-700 dark:bg-surface-800 dark:text-brand-300"
      {...props}
    />
  ),
  hr: () => <hr className="my-10 border-surface-200 dark:border-surface-800" />,
};

/**
 * Individual blog article (/blog/:slug). Looks the post up by slug; an unknown
 * slug renders a noindex not-found message. A post opens answer-first — H1,
 * one-line hook, the direct answer, TL;DR and the review byline — then the
 * markdown body, a FAQ, the sources and a CTA. Emits Article (organization as
 * author and publisher, dateModified = review date), FAQPage and breadcrumb
 * structured data.
 */
const BlogPost: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getBlogPost(slug) : undefined;

  if (!post) {
    return (
      <MarketingLayout>
        <Seo
          title={`Article not found | ${BRAND_NAME}`}
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

  const path = `/blog/${post.slug}`;
  const canonicalUrl = `${SITE_ORIGIN}${path}`;

  const breadcrumb = breadcrumbSchema([
    { name: 'Home', url: SITE_ORIGIN + '/' },
    { name: 'Blog', url: SITE_ORIGIN + '/blog' },
    { name: post.title, url: canonicalUrl },
  ]);

  return (
    <MarketingLayout>
      <Seo
        title={post.seoTitle}
        description={post.description}
        canonicalPath={path}
        ogType="article"
        keywords={post.tags.join(', ')}
      />
      <JsonLd
        data={reviewedArticleSchema({
          headline: post.title,
          description: post.description,
          path,
          datePublished: post.date,
          dateModified: post.lastReviewed,
          keywords: post.tags,
          citations: post.sources.map((source) => source.url),
        })}
      />
      <JsonLd data={faqSchema(post.faqs)} />
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

        {/* Header: H1, hook, direct answer, TL;DR, byline */}
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
          <p className="mt-5 text-lg text-surface-600 dark:text-surface-300">{post.hook}</p>
          <p
            id="post-answer"
            className="mt-6 border-l-4 border-brand-500 pl-5 text-lg font-medium leading-relaxed text-surface-800 dark:text-surface-100"
          >
            {post.answer}
          </p>
          <TldrList items={post.tldr} className="mt-8" />
          <div className="mt-6 flex flex-col gap-2">
            <ReviewedByline lastReviewed={post.lastReviewed} />
            <p className="flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400">
              <CalendarDays size={15} aria-hidden="true" />
              <span>
                Published <time dateTime={post.date}>{formatReviewDate(post.date)}</time>
              </span>
            </p>
          </div>
        </header>

        {/* Body */}
        <div className="text-base">
          <ReactMarkdown components={markdownComponents}>{post.body}</ReactMarkdown>
        </div>

        {/* FAQ */}
        {post.faqs.length > 0 && (
          <section aria-labelledby="post-faq" className="mt-14 border-t border-surface-200 pt-10 dark:border-surface-800">
            <h2 id="post-faq" className="text-2xl font-bold tracking-tight text-surface-900 dark:text-white">
              Frequently asked questions
            </h2>
            <div className="mt-6 divide-y divide-surface-200 dark:divide-surface-800">
              {post.faqs.map((faq) => (
                <details key={faq.q} className="group py-4">
                  <summary className="cursor-pointer list-none font-semibold text-surface-900 marker:hidden dark:text-white">
                    {faq.q}
                  </summary>
                  <p className="mt-3 leading-relaxed text-surface-700 dark:text-surface-300">{faq.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Sources */}
        {post.sources.length > 0 && (
          <section aria-labelledby="post-sources" className="mt-12">
            <h2 id="post-sources" className="text-lg font-semibold text-surface-900 dark:text-white">
              Sources
            </h2>
            <ol className="mt-4 list-decimal space-y-2 pl-6 text-sm text-surface-600 dark:text-surface-400">
              {post.sources.map((source) => (
                <li key={source.url}>
                  <a href={source.url} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
                    {source.label}
                  </a>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* CTA */}
        <aside className="mt-16 overflow-hidden rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-8 text-center shadow-sm dark:border-brand-800/60 dark:from-brand-950/50 dark:to-surface-900">
          <h2 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-white">
            Ready to make compliance continuous?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-surface-600 dark:text-surface-300">
            See how {BRAND_NAME} collects evidence, monitors controls and maps one control set across
            every framework you need.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/demo"
              className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              Book a demo
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link
              to={TRIAL_CTA.to}
              className="inline-flex items-center gap-2 rounded-full border border-surface-300 px-6 py-3 text-sm font-semibold text-surface-700 transition-colors hover:border-brand-400 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-surface-700 dark:text-surface-200 dark:hover:border-brand-600 dark:hover:text-brand-400"
            >
              {TRIAL_CTA.label}
            </Link>
          </div>
          <Link
            to="/blog"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            More articles
          </Link>
        </aside>
      </article>
    </MarketingLayout>
  );
};

export default BlogPost;
export { BlogPost };
