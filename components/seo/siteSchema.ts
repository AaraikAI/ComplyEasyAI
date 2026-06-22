/**
 * schema.org structured-data builders for ComplyEasy AI.
 *
 * Brand facts are verifiable-only: name 'ComplyEasy AI', url
 * https://complyeasyai.com, logo /favicon.svg. Social profiles (sameAs) and
 * contactPoint are intentionally omitted because they are not verified here.
 * No aggregateRating / review data is emitted anywhere.
 */

const SITE_ORIGIN = 'https://complyeasyai.com';
const SITE_NAME = 'ComplyEasy AI';
const SITE_LOGO = `${SITE_ORIGIN}/favicon.svg`;

const ORG_DESCRIPTION =
  'ComplyEasy AI is an AI-powered compliance automation platform that helps teams achieve and maintain readiness for frameworks including SOC 2, ISO 27001, GDPR, HIPAA, and the EU AI Act.';

export function organizationSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
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
    url: SITE_ORIGIN,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_ORIGIN}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Offer entries derived from the published pricing tiers in
 * components/PricingSection.tsx (annual list price per tier, USD).
 */
const PRICING_OFFERS: { name: string; price: string }[] = [
  { name: 'Foundation', price: '8500' },
  { name: 'Essentials', price: '17000' },
  { name: 'Growth', price: '42500' },
  { name: 'Visionary', price: '68000' },
];

export function softwareApplicationSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: ORG_DESCRIPTION,
    offers: PRICING_OFFERS.map((offer) => ({
      '@type': 'Offer',
      name: offer.name,
      price: offer.price,
      priceCurrency: 'USD',
    })),
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
