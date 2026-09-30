import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { blogPosts, blogPostsNewestFirst, blogSlugs } from '../../data/blog';
import { allPublicRoutes, BLOG_SLUGS } from '../../scripts/publicRoutes.mjs';

/**
 * Keeps the blog content, the public-route list (which feeds the sitemap, the
 * prerenderer and the CloudFront route manifest) and App.tsx in agreement;
 * keeps posts answer-first, dated, sourced and linked only to public pages;
 * and keeps competitor names out of published posts.
 */
const ROOT = resolve(__dirname, '..', '..');
const appSource = readFileSync(resolve(ROOT, 'App.tsx'), 'utf8');
const sitemap = readFileSync(resolve(ROOT, 'public/sitemap.xml'), 'utf8');
const manifest: string[] = JSON.parse(
  readFileSync(resolve(ROOT, 'infrastructure/prerendered-routes.json'), 'utf8'),
);

const RETIRED_SLUG = 'vanta-vs-drata-vs-complyeasy-ai';
const COMPETITOR_NAMES = /vanta|drata|secureframe|sprinto|onetrust/i;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const NEW_POST_SLUGS = [
  'eu-ai-act-timeline-digital-omnibus',
  'india-dpdp-rules-2025-timeline',
  'csrd-after-omnibus-i',
];

/** Words as a reader counts them: whitespace-separated tokens holding a letter or digit. */
const wordCount = (text: string): number =>
  text.split(/\s+/).filter((token) => /[\p{L}\p{N}]/u.test(token)).length;

/** Markdown with link targets and emphasis markers removed, for counting words. */
const plainText = (markdown: string): string =>
  markdown.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[*_#`>]/g, ' ');

/** Site-relative link targets in markdown, without query or fragment. */
const internalLinks = (markdown: string): string[] =>
  Array.from(markdown.matchAll(/\]\((\/[^)\s]*)\)/g)).map((match) => match[1].split(/[?#]/)[0]);

/** Internal destinations a public page may link to: prerendered routes plus the auth and demo flows. */
const PUBLIC_DESTINATIONS = new Set<string>([...allPublicRoutes(), '/signup', '/demo', '/login']);
const isPublic = (path: string) => PUBLIC_DESTINATIONS.has(path) || path.startsWith('/docs/');

describe('blog content', () => {
  it('publishes exactly the posts listed in scripts/publicRoutes.mjs', () => {
    expect([...blogSlugs].sort()).toEqual([...BLOG_SLUGS].sort());
    for (const slug of blogSlugs) {
      expect(manifest, `/blog/${slug} missing from infrastructure/prerendered-routes.json`).toContain(
        `/blog/${slug}`,
      );
      expect(sitemap, `/blog/${slug} missing from public/sitemap.xml`).toContain(
        `https://www.complyeasyai.com/blog/${slug}</loc>`,
      );
    }
  });

  it('names no competitor in any post', () => {
    for (const post of blogPosts) {
      const text = [post.title, post.description, post.tags.join(' '), post.body].join('\n');
      expect(text, `${post.slug} mentions a competitor`).not.toMatch(COMPETITOR_NAMES);
    }
  });

  it('retires the competitor comparison post everywhere and redirects its old URL to /blog', () => {
    expect(blogSlugs).not.toContain(RETIRED_SLUG);
    expect(BLOG_SLUGS).not.toContain(RETIRED_SLUG);
    expect(manifest).not.toContain(`/blog/${RETIRED_SLUG}`);
    expect(sitemap).not.toContain(RETIRED_SLUG);
    expect(appSource).toContain(
      `<Route path="/blog/${RETIRED_SLUG}" element={<Navigate to="/blog" replace />} />`,
    );
  });

  it('publishes the three September 2026 regulatory posts', () => {
    for (const slug of NEW_POST_SLUGS) {
      const post = blogPosts.find((p) => p.slug === slug);
      expect(post, slug).toBeDefined();
      expect(post!.date).toBe('2026-09-27');
    }
  });

  it('lists posts newest first', () => {
    const ordered = blogPostsNewestFirst();
    for (let i = 1; i < ordered.length; i += 1) {
      const [prev, next] = [ordered[i - 1], ordered[i]];
      expect(prev.lastReviewed >= next.lastReviewed).toBe(true);
      if (prev.lastReviewed === next.lastReviewed) expect(prev.date >= next.date).toBe(true);
    }
  });
});

describe.each(blogPosts.map((post) => [post.slug, post] as const))('post %s', (_slug, post) => {
  it('opens answer-first: hook, a 40–60-word answer and a TL;DR', () => {
    expect(wordCount(post.hook)).toBeLessThanOrEqual(22);
    expect(wordCount(post.answer)).toBeGreaterThanOrEqual(40);
    expect(wordCount(post.answer)).toBeLessThanOrEqual(60);
    expect(post.tldr.length).toBeGreaterThanOrEqual(3);
    expect(post.tldr.length).toBeLessThanOrEqual(5);
  });

  it('uses question-style H2s and markdown the renderer supports', () => {
    const h2s = post.body.match(/^## .+$/gm) ?? [];
    expect(h2s.length).toBeGreaterThanOrEqual(3);
    for (const heading of h2s) expect(heading.trim().endsWith('?'), heading).toBe(true);
    // react-markdown runs without remark-gfm: no task lists and no tables.
    expect(post.body).not.toMatch(/^\s*- \[[ x]\]/m);
    expect(post.body).not.toMatch(/^\s*\|.*\|\s*$/m);
    // The direct answer is rendered by the template, not repeated in the body.
    expect(post.body).not.toMatch(/^## The short answer/m);
  });

  it('has a short title, review dates, FAQs and https sources', () => {
    expect(post.seoTitle.length).toBeLessThanOrEqual(60);
    expect(post.seoTitle.endsWith('| ComplyEasyAI')).toBe(true);
    expect(post.date).toMatch(ISO_DATE);
    expect(post.lastReviewed).toMatch(ISO_DATE);
    expect(post.lastReviewed >= post.date).toBe(true);
    expect(post.faqs.length).toBeGreaterThanOrEqual(3);
    for (const faq of post.faqs) {
      expect(faq.q.trim().endsWith('?'), faq.q).toBe(true);
      expect(wordCount(faq.a)).toBeLessThanOrEqual(70);
    }
    expect(post.sources.length).toBeGreaterThanOrEqual(1);
    for (const source of post.sources) expect(source.url).toMatch(/^https:\/\//);
  });

  it('links only to public pages and spells the brand one way', () => {
    expect(internalLinks(post.body).filter((path) => !isPublic(path))).toEqual([]);
    const text = [post.title, post.seoTitle, post.description, post.hook, post.answer, post.body].join('\n');
    expect(text).not.toContain('ComplyEasy AI');
    expect(text).not.toMatch(/free trial|start free|no credit card/i);
  });
});

describe('new regulatory posts', () => {
  const post = (slug: string) => blogPosts.find((p) => p.slug === slug)!;
  const fullText = (slug: string) => {
    const p = post(slug);
    return [p.answer, ...p.tldr, p.body, ...p.faqs.map((f) => f.a)].join('\n');
  };

  it.each(NEW_POST_SLUGS)('%s runs 900–1,400 words', (slug) => {
    const p = post(slug);
    const words =
      wordCount(p.hook) +
      wordCount(p.answer) +
      p.tldr.reduce((sum, item) => sum + wordCount(item), 0) +
      wordCount(plainText(p.body)) +
      p.faqs.reduce((sum, faq) => sum + wordCount(faq.q) + wordCount(faq.a), 0);
    expect(words).toBeGreaterThanOrEqual(900);
    expect(words).toBeLessThanOrEqual(1400);
  });

  it('gives the EU AI Act dates set by Regulation (EU) 2026/1744', () => {
    const text = fullText('eu-ai-act-timeline-digital-omnibus');
    for (const date of [
      '2 February 2025',
      '2 August 2025',
      '2 August 2026',
      '27 July 2026',
      '2 December 2026',
      '2 December 2027',
      '2 August 2028',
      '2 August 2030',
    ]) {
      expect(text, date).toContain(date);
    }
    expect(post('eu-ai-act-timeline-digital-omnibus').sources.map((s) => s.url)).toContain(
      'https://eur-lex.europa.eu/eli/reg/2026/1744/oj',
    );
  });

  it('gives the DPDP Rules commencement dates from the Gazette notification', () => {
    const text = fullText('india-dpdp-rules-2025-timeline');
    for (const fact of ['13 November 2025', '13 November 2026', '13 May 2027', 'G.S.R. 846(E)', '72 hours', '90 days']) {
      expect(text, fact).toContain(fact);
    }
  });

  it('gives the CSRD scope and dates set by Directive (EU) 2026/470', () => {
    const text = fullText('csrd-after-omnibus-i');
    for (const fact of ['1,000 employees', '€450 million', '€200 million', '19 March 2027', '18 March 2026', '1 July 2027']) {
      expect(text, fact).toContain(fact);
    }
    expect(text).not.toMatch(/then reasonable assurance/i);
  });

  it('keeps the checklist free of the retired August 2026 high-risk deadline', () => {
    const checklist = post('eu-ai-act-compliance-checklist');
    expect(checklist.body).toContain('2 December 2027');
    expect(checklist.body).not.toMatch(/high-risk[^.]*from 2 August 2026/i);
  });
});
