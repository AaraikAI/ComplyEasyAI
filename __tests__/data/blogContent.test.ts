import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { blogPosts, blogSlugs } from '../../data/blog';
import { BLOG_SLUGS } from '../../scripts/publicRoutes.mjs';

/**
 * Keeps the blog content, the public-route list (which feeds the sitemap, the
 * prerenderer and the CloudFront route manifest) and App.tsx in agreement, and
 * keeps competitor names out of published posts.
 */
const ROOT = resolve(__dirname, '..', '..');
const appSource = readFileSync(resolve(ROOT, 'App.tsx'), 'utf8');
const sitemap = readFileSync(resolve(ROOT, 'public/sitemap.xml'), 'utf8');
const manifest: string[] = JSON.parse(
  readFileSync(resolve(ROOT, 'infrastructure/prerendered-routes.json'), 'utf8'),
);

const RETIRED_SLUG = 'vanta-vs-drata-vs-complyeasy-ai';
const COMPETITOR_NAMES = /vanta|drata|secureframe|sprinto|onetrust/i;

describe('blog content', () => {
  it('publishes exactly the posts listed in scripts/publicRoutes.mjs', () => {
    expect([...blogSlugs].sort()).toEqual([...BLOG_SLUGS].sort());
    for (const slug of blogSlugs) {
      expect(manifest, `/blog/${slug} missing from infrastructure/prerendered-routes.json`).toContain(
        `/blog/${slug}`,
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
});
