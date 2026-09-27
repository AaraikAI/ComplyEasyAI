/**
 * schema.org structured-data builders for ComplyEasy AI.
 *
 * Brand facts are verifiable-only: name 'ComplyEasy AI', url
 * https://www.complyeasyai.com, logo /favicon.svg. Social profiles (sameAs) and
 * contactPoint are intentionally omitted because they are not verified here.
 * No aggregateRating / review data is emitted anywhere.
 */

import { SITE_ORIGIN } from './siteOrigin';

const SITE_NAME = 'ComplyEasy AI';
/** The brand as written in the product UI, so both spellings resolve to one entity. */
const SITE_ALTERNATE_NAME = 'ComplyEasyAI';
const SITE_LOGO = `${SITE_ORIGIN}/favicon.svg`;

const ORG_DESCRIPTION =
  'ComplyEasy AI is an AI compliance automation platform that collects audit evidence, monitors controls and maps shared controls across frameworks including SOC 2, ISO 27001, GDPR, HIPAA and the EU AI Act.';

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
    name: SITE_NAME,
    alternateName: SITE_ALTERNATE_NAME,
    url: SITE_ORIGIN,
    logo: SITE_LOGO,
    description: ORG_DESCRIPTION,
  };
}

export function webSiteSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    alternateName: SITE_ALTERNATE_NAME,
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
    name: SITE_NAME,
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
