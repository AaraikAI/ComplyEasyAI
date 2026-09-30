/**
 * Canonical public origin for every canonical URL, og:url, JSON-LD URL and
 * sitemap entry. The apex host (complyeasyai.com) only forwards "/" to www and
 * answers 404 for every other path, so absolute URLs must use the www host.
 * scripts/siteOrigin.mjs mirrors this value for the build scripts, and
 * __tests__/seo/siteOrigin.test.ts keeps the two in step.
 */
export const SITE_ORIGIN = 'https://www.complyeasyai.com';
