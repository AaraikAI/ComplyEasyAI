/**
 * schema.org structured-data builders for ComplyEasyAI.
 *
 * Brand facts are verifiable-only: name and alternateName from ./brand, url
 * https://www.complyeasyai.com, logo /favicon.svg. Social
 * profiles (sameAs) and contactPoint are intentionally omitted because they are
 * not verified here. No aggregateRating / review data is emitted anywhere.
 */

import { SITE_ORIGIN } from './siteOrigin';
import { BRAND_ALTERNATE_NAME, BRAND_NAME, DEFAULT_OG_IMAGE } from './brand';

const SITE_LOGO = `${SITE_ORIGIN}/favicon.svg`;

const ORG_DESCRIPTION = `${BRAND_NAME} is an AI compliance automation platform that collects audit evidence, monitors controls and maps shared controls across frameworks including SOC 2, ISO 27001, GDPR, HIPAA and the EU AI Act.`;

const FEATURE_LIST = [
  'Automated evidence collection',
  'Continuous control monitoring',
  'Cross-framework control mapping',
  'Risk and vendor management',
  'Audit-ready reporting',
];

export function organizationSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: BRAND_NAME,
    alternateName: BRAND_ALTERNATE_NAME,
    url: SITE_ORIGIN,
    logo: SITE_LOGO,
    description: ORG_DESCRIPTION,
  };
}

export function webSiteSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: BRAND_NAME,
    alternateName: BRAND_ALTERNATE_NAME,
    url: SITE_ORIGIN,
  };
}

/**
 * One price-less offer pointing at /pricing. The public pricing page quotes
 * each plan per framework mix and team size, so no list price is published
 * here either.
 */
const PRICING_OFFER = {
  '@type': 'Offer',
  url: `${SITE_ORIGIN}/pricing`,
  availability: 'https://schema.org/InStock',
  description:
    'Four annual plans (Foundation, Essentials, Growth, Visionary), quoted per framework mix and team size.',
};

export function softwareApplicationSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: BRAND_NAME,
    alternateName: BRAND_ALTERNATE_NAME,
    url: SITE_ORIGIN,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: ORG_DESCRIPTION,
    featureList: FEATURE_LIST,
    offers: PRICING_OFFER,
  };
}

export function breadcrumbSchema(
  items: { name: string; url: string }[],
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function faqSchema(
  pairs: { q: string; a: string }[],
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: pairs.map((pair) => ({
      '@type': 'Question',
      name: pair.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: pair.a,
      },
    })),
  };
}

/**
 * The organization as author, publisher and reviewer of reviewed content. The
 * visible byline credits "the ComplyEasyAI compliance team"; no individual is
 * named until a named reviewer is approved.
 */
export function publisherOrganization(): Record<string, unknown> {
  return {
    '@type': 'Organization',
    name: BRAND_NAME,
    url: SITE_ORIGIN,
    logo: { '@type': 'ImageObject', url: SITE_LOGO },
  };
}

/** Absolute URL for a site path ("/" maps to the origin with a trailing slash). */
const pageUrl = (path: string): string =>
  path === '/' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;

export interface ReviewedPageInput {
  /** Page name, usually the SEO title. */
  name: string;
  description: string;
  /** Site path, e.g. "/soc2-compliance". */
  path: string;
  /** ISO date (YYYY-MM-DD) of the last content review; also dateModified. */
  lastReviewed: string;
  /** ISO date the page was first published, when known. */
  datePublished?: string;
  /** What the page is about, e.g. "SOC 2". */
  about?: string;
  /** Primary sources the page relies on (https URLs). */
  citations?: string[];
}

/**
 * WebPage JSON-LD for a reviewed page: author, publisher and reviewedBy are the
 * organization, and lastReviewed / dateModified carry the review date shown in
 * the visible <ReviewedByline>.
 */
export function reviewedWebPageSchema(input: ReviewedPageInput): Record<string, unknown> {
  const org = publisherOrganization();
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: input.name,
    description: input.description,
    url: pageUrl(input.path),
    inLanguage: 'en',
    isPartOf: { '@type': 'WebSite', name: BRAND_NAME, url: SITE_ORIGIN },
    author: org,
    publisher: org,
    reviewedBy: org,
    lastReviewed: input.lastReviewed,
    dateModified: input.lastReviewed,
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
    ...(input.about ? { about: { '@type': 'Thing', name: input.about } } : {}),
    ...(input.citations && input.citations.length > 0 ? { citation: input.citations } : {}),
  };
}

export interface ReviewedArticleInput {
  headline: string;
  description: string;
  /** Site path, e.g. "/blog/eu-ai-act-compliance-checklist". */
  path: string;
  datePublished: string;
  /** ISO date of the last review or update. */
  dateModified: string;
  /** Absolute image URL; defaults to the 1200x630 social card. */
  image?: string;
  keywords?: string[];
}

/** Article JSON-LD with the organization as author and publisher. */
export function reviewedArticleSchema(input: ReviewedArticleInput): Record<string, unknown> {
  const org = publisherOrganization();
  const url = pageUrl(input.path);
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.headline,
    description: input.description,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    image: input.image ?? DEFAULT_OG_IMAGE.url,
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    author: org,
    publisher: org,
    inLanguage: 'en',
    ...(input.keywords && input.keywords.length > 0 ? { keywords: input.keywords.join(', ') } : {}),
  };
}
