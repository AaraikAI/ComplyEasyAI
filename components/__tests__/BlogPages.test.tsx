import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { useParams } from 'react-router';

import { BlogPost } from '../marketing/pages/BlogPost';
import { BlogIndex } from '../marketing/pages/BlogIndex';
import { blogPosts, blogPostsNewestFirst } from '../../data/blog';
import { BRAND_ALTERNATE_NAME, BRAND_NAME, DEFAULT_OG_IMAGE } from '../seo/brand';
import { allPublicRoutes } from '../../scripts/publicRoutes.mjs';

// react-router, react-markdown and lucide-react are stubbed globally in
// setupTests.ts (Link -> <a href>, markdown -> raw text). Link targets inside
// markdown bodies are checked at the data level in __tests__/data.

afterEach(() => {
  cleanup();
  document.head.innerHTML = '';
  vi.mocked(useParams).mockReturnValue({});
});

const readJsonLd = (): Array<Record<string, any>> =>
  Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map((node) =>
    JSON.parse(node.textContent ?? '{}'),
  );

const wordCount = (text: string): number =>
  text.split(/\s+/).filter((token) => /[\p{L}\p{N}]/u.test(token)).length;

const PUBLIC_DESTINATIONS = new Set<string>([...allPublicRoutes(), '/signup', '/demo', '/login']);

/** Internal hrefs on the page that do not resolve to a public route (app-only routes bounce to "/"). */
const brokenInternalLinks = (): string[] =>
  Array.from(document.querySelectorAll('a[href^="/"]'))
    .map((anchor) => (anchor.getAttribute('href') ?? '').split(/[?#]/)[0])
    .filter((path) => !PUBLIC_DESTINATIONS.has(path) && !path.startsWith('/docs/'));

const pageTitle = () => document.head.querySelector('title')?.textContent ?? '';

describe('blog post page', () => {
  it.each(blogPosts.map((post) => [post.slug, post] as const))('%s opens answer-first and is reviewed and sourced', (slug, post) => {
    vi.mocked(useParams).mockReturnValue({ slug });
    render(<BlogPost />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(post.title);
    expect(screen.getByText(post.hook)).toBeInTheDocument();
    expect(document.getElementById('post-answer')).toHaveTextContent(post.answer);

    const tldr = screen.getByRole('region', { name: 'TL;DR' });
    expect(within(tldr).getAllByRole('listitem')).toHaveLength(post.tldr.length);
    expect(screen.getByText(`Reviewed by the ${BRAND_NAME} compliance team`)).toBeInTheDocument();
    expect(document.querySelector(`time[datetime="${post.lastReviewed}"]`)).not.toBeNull();
    expect(document.querySelector(`time[datetime="${post.date}"]`)).not.toBeNull();

    for (const faq of post.faqs) expect(screen.getByText(faq.q)).toBeInTheDocument();
    for (const source of post.sources) {
      const link = screen.getByRole('link', { name: source.label });
      expect(link).toHaveAttribute('href', source.url);
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }

    // Trials are on request; no self-serve trial promise.
    const article = within(document.querySelector('article')!);
    expect(article.getByText('Request a trial').closest('a')).toHaveAttribute('href', '/demo');
    expect(article.getByText('Book a demo').closest('a')).toHaveAttribute('href', '/demo');
    expect(screen.queryByText(/free trial|start free/i)).not.toBeInTheDocument();

    const blocks = readJsonLd();
    expect(blocks.find((block) => block['@type'] === 'Article')).toMatchObject({
      headline: post.title,
      url: `https://www.complyeasyai.com/blog/${slug}`,
      datePublished: post.date,
      dateModified: post.lastReviewed,
      image: DEFAULT_OG_IMAGE.url,
      author: { '@type': 'Organization', name: BRAND_NAME },
      publisher: { '@type': 'Organization', name: BRAND_NAME },
      citation: post.sources.map((source) => source.url),
    });
    const faq = blocks.find((block) => block['@type'] === 'FAQPage');
    expect(faq!.mainEntity.map((entry: any) => entry.name)).toEqual(post.faqs.map((f) => f.q));
    expect(blocks.map((block) => block['@type'])).toContain('BreadcrumbList');

    expect(pageTitle()).toBe(post.seoTitle);
    expect(document.documentElement.innerHTML).not.toContain(BRAND_ALTERNATE_NAME);
    expect(brokenInternalLinks()).toEqual([]);
  });

  it('renders a noindex not-found page for an unknown slug', () => {
    vi.mocked(useParams).mockReturnValue({ slug: 'no-such-post' });
    render(<BlogPost />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Article not found');
    expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow');
  });
});

describe('blog index page', () => {
  it('opens answer-first and lists every post, newest first', () => {
    render(<BlogIndex />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Compliance automation guides: SOC 2, the EU AI Act and more',
    );
    const answer = document.getElementById('blog-answer')!.textContent ?? '';
    expect(wordCount(answer)).toBeGreaterThanOrEqual(40);
    expect(wordCount(answer)).toBeLessThanOrEqual(60);
    expect(screen.getByRole('region', { name: 'TL;DR' })).toBeInTheDocument();
    expect(screen.getByText(`Reviewed by the ${BRAND_NAME} compliance team`)).toBeInTheDocument();

    const titles = screen.getAllByRole('heading', { level: 3 }).map((node) => node.textContent);
    expect(titles).toEqual(blogPostsNewestFirst().map((post) => post.title));
    expect(pageTitle()).toBe(`Compliance Automation Blog | ${BRAND_NAME}`);
    expect(document.documentElement.innerHTML).not.toContain(BRAND_ALTERNATE_NAME);
    expect(brokenInternalLinks()).toEqual([]);
  });
});
