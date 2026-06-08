// Generates public/sitemap.xml from the shared public-route source of truth
// (scripts/publicRoutes.mjs). Run via `npm run sitemap`.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { allPublicRoutes } from './publicRoutes.mjs';

const ORIGIN = 'https://complyeasyai.com';
const LASTMOD = '2026-06-07';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, '..', 'public', 'sitemap.xml');

// Pillar pages (top-level topical hubs) and the flagship platform page.
const PILLAR_ROUTES = new Set([
  '/platform/ai-compliance',
  '/soc2-compliance',
  '/iso-27001',
  '/gdpr',
  '/eu-ai-act',
  '/hipaa',
  '/nist-ai-rmf',
  '/grc',
]);

function metaFor(route) {
  // Homepage and the flagship AI-compliance pillar carry the highest priority.
  if (route === '/') return { changefreq: 'daily', priority: '1.0' };
  if (route === '/platform/ai-compliance') return { changefreq: 'weekly', priority: '0.9' };
  // Topical pillar pages.
  if (PILLAR_ROUTES.has(route)) return { changefreq: 'weekly', priority: '0.8' };
  // Competitor comparison pages.
  if (route.startsWith('/compare/')) return { changefreq: 'weekly', priority: '0.7' };
  // Detail pages for glossary terms and blog posts.
  if (route.startsWith('/blog/')) return { changefreq: 'monthly', priority: '0.6' };
  if (route.startsWith('/glossary/')) return { changefreq: 'monthly', priority: '0.6' };
  // Remaining static routes (learn, community, status, docs, faq, blog & glossary indexes).
  return { changefreq: 'weekly', priority: '0.7' };
}

function toLoc(route) {
  // Map '/' to the bare origin with a trailing slash; otherwise origin + route.
  return route === '/' ? `${ORIGIN}/` : `${ORIGIN}${route}`;
}

function buildSitemap(routes) {
  const urls = routes
    .map((route) => {
      const { changefreq, priority } = metaFor(route);
      return [
        '  <url>',
        `    <loc>${toLoc(route)}</loc>`,
        `    <lastmod>${LASTMOD}</lastmod>`,
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

const routes = allPublicRoutes();
const xml = buildSitemap(routes);
mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, xml, 'utf8');
process.stdout.write(`Wrote ${routes.length} routes to ${OUT_PATH}\n`);
