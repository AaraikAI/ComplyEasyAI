// Canonical public origin used by the sitemap generator. Mirrors
// components/seo/siteOrigin.ts (the build scripts cannot import TypeScript);
// __tests__/seo/siteOrigin.test.ts keeps the two in step. The apex host only
// forwards "/" to www and answers 404 for every other path.
export const SITE_ORIGIN = 'https://www.complyeasyai.com';
