// Single source of truth for the public, crawlable routes of complyeasyai.com.
// Shared by the prerenderer (build step) and the sitemap generator
// (scripts/generate-sitemap.mjs) so both stay in sync. Content phases extend
// the GLOSSARY_SLUGS and BLOG_SLUGS arrays as those pages are authored.

export const STATIC_ROUTES = [
  '/',
  '/learn',
  '/community',
  '/status',
  '/docs',
  // Pillar pages
  '/platform/ai-compliance',
  '/soc2-compliance',
  '/iso-27001',
  '/gdpr',
  '/eu-ai-act',
  '/hipaa',
  '/nist-ai-rmf',
  '/grc',
  // Competitor comparison pages
  '/compare/vanta-alternative',
  '/compare/drata-alternative',
  '/compare/secureframe-alternative',
  '/compare/sprinto-alternative',
  '/compare/onetrust-alternative',
  // FAQ, glossary index, blog index
  '/faq',
  '/glossary',
  '/blog',
];

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
  'vanta-vs-drata-vs-complyeasy-ai',
];

export function allPublicRoutes() {
  return [
    ...STATIC_ROUTES,
    ...GLOSSARY_SLUGS.map((s) => '/glossary/' + s),
    ...BLOG_SLUGS.map((s) => '/blog/' + s),
  ];
}
