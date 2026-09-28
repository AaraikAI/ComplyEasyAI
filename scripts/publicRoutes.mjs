// Single source of truth for the public, crawlable routes of complyeasyai.com.
// Shared by the prerenderer (build step) and the sitemap generator
// (scripts/generate-sitemap.mjs) so both stay in sync. Content phases extend
// the GLOSSARY_SLUGS and BLOG_SLUGS arrays as those pages are authored.

export const STATIC_ROUTES = [
  '/',
  '/learn',
  '/status',
  '/docs',
  // Signal marketing pages
  '/platform',
  '/pricing',
  '/frameworks',
  '/demo',
  '/login',
  // Pillar pages
  '/platform/ai-compliance',
  '/soc2-compliance',
  '/iso-27001',
  '/gdpr',
  '/eu-ai-act',
  '/hipaa',
  '/nist-ai-rmf',
  '/grc',
  '/nist-csf',
  '/pci-dss',
  '/ccpa',
  '/iso-42001',
  '/dora-compliance',
  '/dma-compliance',
  '/dsa-compliance',
  '/csrd-compliance',
  '/aiuc-1',
  '/india-dpdpa',
  // FAQ, glossary index, blog index
  '/faq',
  '/glossary',
  '/blog',
];

// Pillar pages: the two topic pillars plus every framework pillar in
// data/frameworkPillarContent.ts. The sitemap gives these a higher priority;
// __tests__/seo/siteOrigin.test.ts keeps the list in step with the content module.
export const PILLAR_PATHS = [
  '/platform/ai-compliance',
  '/grc',
  '/soc2-compliance',
  '/iso-27001',
  '/nist-csf',
  '/pci-dss',
  '/gdpr',
  '/hipaa',
  '/ccpa',
  '/india-dpdpa',
  '/eu-ai-act',
  '/nist-ai-rmf',
  '/iso-42001',
  '/aiuc-1',
  '/dora-compliance',
  '/dma-compliance',
  '/dsa-compliance',
  '/csrd-compliance',
];

// Routes that stay prerendered (so the CloudFront route set is unchanged) but are
// left out of the sitemap and llms-full.txt because they carry a noindex robots tag.
export const SITEMAP_EXCLUDED_ROUTES = ['/login'];

export const GLOSSARY_SLUGS = [
  'ai-compliance',
  'soc-2',
  'iso-27001',
  'gdpr',
  'eu-ai-act',
  'hipaa',
  'nist-ai-rmf',
  'grc',
  'dpia',
  'ropa',
  'evidence-collection',
  'continuous-compliance',
  'risk-register',
  'vendor-risk-management',
  'audit-readiness',
  'control-mapping',
];

export const BLOG_SLUGS = [
  'how-to-automate-soc-2-compliance-with-ai',
  'eu-ai-act-compliance-checklist',
  'eu-ai-act-timeline-digital-omnibus',
  'india-dpdp-rules-2025-timeline',
  'csrd-after-omnibus-i',
];

export function allPublicRoutes() {
  return [
    ...STATIC_ROUTES,
    ...GLOSSARY_SLUGS.map((s) => '/glossary/' + s),
    ...BLOG_SLUGS.map((s) => '/blog/' + s),
  ];
}
