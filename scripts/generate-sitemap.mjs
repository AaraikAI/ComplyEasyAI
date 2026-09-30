// Generates public/sitemap.xml from the shared public-route source of truth
// (scripts/publicRoutes.mjs). Run via `npm run sitemap`.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { allPublicRoutes, PILLAR_PATHS, SITEMAP_EXCLUDED_ROUTES } from './publicRoutes.mjs';
import { SITE_ORIGIN } from './siteOrigin.mjs';

// Date of the last site-wide content review. A route listed in LASTMOD_BY_ROUTE
// uses its own date instead (pillars use their review date, posts their update date).
const DEFAULT_LASTMOD = '2026-09-27';
const LASTMOD_BY_ROUTE = {};

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, '..', 'public', 'sitemap.xml');

const PILLAR_ROUTES = new Set(PILLAR_PATHS);
const EXCLUDED_ROUTES = new Set(SITEMAP_EXCLUDED_ROUTES);

function metaFor(route) {
  // Homepage and the flagship AI-compliance pillar carry the highest priority.
  if (route === '/') return { changefreq: 'daily', priority: '1.0' };
  if (route === '/platform/ai-compliance') return { changefreq: 'weekly', priority: '0.9' };
  // Topical and framework pillar pages.
  if (PILLAR_ROUTES.has(route)) return { changefreq: 'weekly', priority: '0.8' };
  // Detail pages for glossary terms and blog posts.
  if (route.startsWith('/blog/')) return { changefreq: 'monthly', priority: '0.6' };
  if (route.startsWith('/glossary/')) return { changefreq: 'monthly', priority: '0.6' };
  // Remaining static routes (platform, pricing, frameworks, faq, learn, docs, indexes).
  return { changefreq: 'weekly', priority: '0.7' };
}

function toLoc(route) {
  // Map '/' to the bare origin with a trailing slash; otherwise origin + route.
  return route === '/' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${route}`;
}

function buildSitemap(routes) {
  const urls = routes
    .map((route) => {
      const { changefreq, priority } = metaFor(route);
      return [
        '  <url>',
        `    <loc>${toLoc(route)}</loc>`,
        `    <lastmod>${LASTMOD_BY_ROUTE[route] ?? DEFAULT_LASTMOD}</lastmod>`,
        `    <changefreq>${changefreq}</changefreq>`,
        `    <priority>${priority}</priority>`,
        '  </url>',
      ].join('\n');
    })
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    '</urlset>',
    '',
  ].join('\n');
}

const routes = allPublicRoutes().filter((route) => !EXCLUDED_ROUTES.has(route));
const xml = buildSitemap(routes);
mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, xml, 'utf8');
process.stdout.write(`Wrote ${routes.length} routes to ${OUT_PATH}\n`);
