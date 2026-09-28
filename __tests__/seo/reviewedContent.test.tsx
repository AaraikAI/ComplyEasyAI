import React from 'react';
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import {
  formatReviewDate,
  ReviewedByline,
  TldrList,
} from '../../components/marketing/answerFirst';
import {
  organizationSchema,
  reviewedArticleSchema,
  reviewedWebPageSchema,
  softwareApplicationSchema,
  webSiteSchema,
} from '../../components/seo/siteSchema';
import { BRAND_ALTERNATE_NAME, BRAND_NAME, DEFAULT_OG_IMAGE } from '../../components/seo/brand';
import Seo from '../../components/seo/Seo';

const ROOT = resolve(__dirname, '..', '..');

describe('reviewed-content building blocks', () => {
  it('formats review dates without time-zone drift', () => {
    expect(formatReviewDate('2026-09-27')).toBe('September 27, 2026');
    expect(formatReviewDate('2027-01-01')).toBe('January 1, 2027');
    expect(formatReviewDate('not a date')).toBe('not a date');
  });

  it('renders the byline with a machine-readable date', () => {
    const { container } = render(<ReviewedByline lastReviewed="2026-09-27" />);
    expect(screen.getByText('Reviewed by the ComplyEasyAI compliance team')).toBeInTheDocument();
    const time = container.querySelector('time');
    expect(time).toHaveAttribute('dateTime', '2026-09-27');
    expect(time).toHaveTextContent('September 27, 2026');
  });

  it('renders TL;DR bullets as a labelled list', () => {
    render(<TldrList items={['First point.', 'Second point.']} />);
    const region = screen.getByRole('region', { name: 'TL;DR' });
    expect(region.querySelectorAll('li')).toHaveLength(2);
  });

  it('builds WebPage data with the organization as author, publisher and reviewer', () => {
    const page = reviewedWebPageSchema({
      name: 'SOC 2 compliance',
      description: 'desc',
      path: '/soc2-compliance',
      lastReviewed: '2026-09-27',
      about: 'SOC 2',
      citations: ['https://www.aicpa-cima.com/'],
    }) as Record<string, any>;
    expect(page['@type']).toBe('WebPage');
    expect(page.url).toBe('https://www.complyeasyai.com/soc2-compliance');
    expect(page.dateModified).toBe('2026-09-27');
    expect(page.lastReviewed).toBe('2026-09-27');
    for (const key of ['author', 'publisher', 'reviewedBy']) {
      expect(page[key]).toMatchObject({ '@type': 'Organization', name: BRAND_NAME });
    }
    expect(page.citation).toEqual(['https://www.aicpa-cima.com/']);
  });

  it('builds Article data with dateModified and the PNG social card', () => {
    const article = reviewedArticleSchema({
      headline: 'Post',
      description: 'desc',
      path: '/blog/post',
      datePublished: '2026-06-07',
      dateModified: '2026-09-27',
    }) as Record<string, any>;
    expect(article.dateModified).toBe('2026-09-27');
    expect(article.author).toMatchObject({ '@type': 'Organization', name: BRAND_NAME });
    expect(article.publisher).toMatchObject({ '@type': 'Organization', name: BRAND_NAME });
    expect(article.image).toBe(DEFAULT_OG_IMAGE.url);
  });
});

describe('brand name', () => {
  it('uses one spelling for names and the spaced spelling only as alternateName', () => {
    for (const schema of [organizationSchema(), webSiteSchema(), softwareApplicationSchema()]) {
      expect(schema.name).toBe(BRAND_NAME);
      expect(schema.alternateName).toBe(BRAND_ALTERNATE_NAME);
    }
  });

  it.each([
    'index.html',
    'public/llms.txt',
    'public/llms-full.txt',
    'components/seo/Seo.tsx',
    'components/seo/siteSchema.ts',
    'components/marketing/MarketingLayout.tsx',
    'components/LandingPage.tsx',
    'components/marketing/pages/PlatformPage.tsx',
    'components/marketing/pages/PricingPage.tsx',
    'components/marketing/pages/FaqHubPage.tsx',
    'components/marketing/pages/FrameworksIndexPage.tsx',
    'components/marketing/pages/DemoPage.tsx',
    'components/SignupPage.tsx',
    'components/LoginPage.tsx',
    'components/LearnPage.tsx',
    'components/DocsPage.tsx',
    'components/StatusPage.tsx',
  ])('%s uses the ComplyEasyAI spelling', (file) => {
    const offending = readFileSync(resolve(ROOT, file), 'utf8')
      .split('\n')
      .map((line, index) => `${index + 1}: ${line.trim()}`)
      .filter((line) => line.includes(BRAND_ALTERNATE_NAME));
    expect(offending).toEqual([]);
  });
});

describe('social card', () => {
  it('ships a 1200x630 PNG and points og:image and twitter:image at it', () => {
    const png = readFileSync(resolve(ROOT, 'public/og/default-og.png'));
    // PNG signature, then the IHDR width and height as big-endian uint32s.
    expect(png.subarray(1, 4).toString('ascii')).toBe('PNG');
    expect(png.readUInt32BE(16)).toBe(DEFAULT_OG_IMAGE.width);
    expect(png.readUInt32BE(20)).toBe(DEFAULT_OG_IMAGE.height);

    render(<Seo title="t" description="d" canonicalPath="/" />);
    const meta = (selector: string) => document.head.querySelector(selector)?.getAttribute('content');
    expect(meta('meta[property="og:image"]')).toBe(DEFAULT_OG_IMAGE.url);
    expect(meta('meta[property="og:image:width"]')).toBe('1200');
    expect(meta('meta[property="og:image:height"]')).toBe('630');
    expect(meta('meta[name="twitter:image"]')).toBe(DEFAULT_OG_IMAGE.url);
    expect(meta('meta[property="og:site_name"]')).toBe(BRAND_NAME);

    const shell = readFileSync(resolve(ROOT, 'index.html'), 'utf8');
    expect(shell).toContain(`<meta property="og:image" content="${DEFAULT_OG_IMAGE.url}" />`);
    expect(shell).toContain(`<meta name="twitter:image" content="${DEFAULT_OG_IMAGE.url}" />`);
    expect(shell).not.toContain('default-og.svg');
  });
});
