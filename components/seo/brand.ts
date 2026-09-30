import { SITE_ORIGIN } from './siteOrigin';

/**
 * Brand facts shared by page copy, <Seo> metadata and schema.org data.
 *
 * Public copy, titles, meta tags, JSON-LD names and the llms files use one
 * spelling, BRAND_NAME. The spaced spelling appears only as the schema.org
 * alternateName, so answer engines resolve both spellings to one entity.
 */
export const BRAND_NAME = 'ComplyEasyAI';

/** The other spelling people search for; schema.org alternateName only. */
export const BRAND_ALTERNATE_NAME = 'ComplyEasy AI';

/** Shown in "Reviewed by …" bylines on reviewed pages and posts. */
export const REVIEWER_NAME = `the ${BRAND_NAME} compliance team`;

/**
 * Default social card. Rendered from public/og/default-og.svg by
 * scripts/render-og-image.mjs; social platforms do not render SVG share images.
 */
export const DEFAULT_OG_IMAGE = {
  path: '/og/default-og.png',
  url: `${SITE_ORIGIN}/og/default-og.png`,
  width: 1200,
  height: 630,
  type: 'image/png',
  alt: `${BRAND_NAME}: AI compliance automation that runs itself`,
} as const;
