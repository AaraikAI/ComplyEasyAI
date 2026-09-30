import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { SOC2Pillar } from '../marketing/pages/SOC2Pillar';
import { ISO27001Pillar } from '../marketing/pages/ISO27001Pillar';
import { NISTCSFPillar } from '../marketing/pages/NISTCSFPillar';
import { PCIDSSPillar } from '../marketing/pages/PCIDSSPillar';
import { GDPRPillar } from '../marketing/pages/GDPRPillar';
import { HIPAAPillar } from '../marketing/pages/HIPAAPillar';
import { CCPAPillar } from '../marketing/pages/CCPAPillar';
import { IndiaDPDPAPillar } from '../marketing/pages/IndiaDPDPAPillar';
import { EUAIActPillar } from '../marketing/pages/EUAIActPillar';
import { NISTAIRMFPillar } from '../marketing/pages/NISTAIRMFPillar';
import { ISO42001Pillar } from '../marketing/pages/ISO42001Pillar';
import { AIUC1Pillar } from '../marketing/pages/AIUC1Pillar';
import { DORAPillar } from '../marketing/pages/DORAPillar';
import { DMAPillar } from '../marketing/pages/DMAPillar';
import { DSAPillar } from '../marketing/pages/DSAPillar';
import { CSRDPillar } from '../marketing/pages/CSRDPillar';
import { AICompliancePillar } from '../marketing/pages/AICompliancePillar';
import { GRCPillar } from '../marketing/pages/GRCPillar';
import { FRAMEWORK_PILLARS } from '../../data/frameworkPillarContent';
import { BRAND_ALTERNATE_NAME, BRAND_NAME } from '../seo/brand';
import { allPublicRoutes } from '../../scripts/publicRoutes.mjs';

// react-router and lucide-react are stubbed globally in setupTests.ts
// (Link -> <a href>). MemoryRouter is a passthrough there.
const renderPage = (page: React.ReactElement) => render(<MemoryRouter>{page}</MemoryRouter>);

afterEach(() => {
  cleanup();
  document.head.innerHTML = '';
});

const ROOT = resolve(__dirname, '..', '..');

/** Parses every JSON-LD block the page emitted. */
const readJsonLd = (): Array<Record<string, any>> =>
  Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map((node) =>
    JSON.parse(node.textContent ?? '{}'),
  );

/** Words as a reader counts them: whitespace-separated tokens holding a letter or digit. */
const wordCount = (text: string): number =>
  text.split(/\s+/).filter((token) => /[\p{L}\p{N}]/u.test(token)).length;

/** Internal destinations a public page may link to: prerendered routes plus the auth and demo flows. */
const PUBLIC_DESTINATIONS = new Set<string>([...allPublicRoutes(), '/signup', '/demo', '/login']);

/** Internal hrefs on the page that do not resolve to a public route (app-only routes bounce to "/"). */
const brokenInternalLinks = (): string[] =>
  Array.from(document.querySelectorAll('a[href^="/"]'))
    .map((anchor) => anchor.getAttribute('href') ?? '')
    .map((href) => href.split(/[?#]/)[0])
    .filter((path) => !PUBLIC_DESTINATIONS.has(path) && !path.startsWith('/docs/'));

const FRAMEWORK_PAGES: Array<[string, React.FC]> = [
  ['soc-2', SOC2Pillar],
  ['iso-27001', ISO27001Pillar],
  ['nist-csf', NISTCSFPillar],
  ['pci-dss', PCIDSSPillar],
  ['gdpr', GDPRPillar],
  ['hipaa', HIPAAPillar],
  ['ccpa', CCPAPillar],
  ['india-dpdpa', IndiaDPDPAPillar],
  ['eu-ai-act', EUAIActPillar],
  ['nist-ai-rmf', NISTAIRMFPillar],
  ['iso-42001', ISO42001Pillar],
  ['aiuc-1', AIUC1Pillar],
  ['dora', DORAPillar],
  ['dma', DMAPillar],
  ['dsa', DSAPillar],
  ['csrd', CSRDPillar],
];

describe('framework pillar pages', () => {
  it('covers every pillar in the content module', () => {
    expect(FRAMEWORK_PAGES.map(([slug]) => slug).sort()).toEqual(Object.keys(FRAMEWORK_PILLARS).sort());
  });

  it.each(FRAMEWORK_PAGES)('%s opens answer-first and is reviewed, sourced and linked correctly', (slug, Page) => {
    const content = FRAMEWORK_PILLARS[slug];
    renderPage(<Page />);

    // H1 names the query; the hook and the direct answer sit right under it.
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(`${content.name} compliance`);
    expect(screen.getByText(content.hook)).toBeInTheDocument();
    expect(screen.getByText(content.definition)).toBeInTheDocument();

    // TL;DR, the visible review byline and the cited sources.
    const tldr = screen.getByRole('region', { name: 'TL;DR' });
    expect(within(tldr).getAllByRole('listitem')).toHaveLength(content.tldr.length);
    expect(screen.getByText(`Reviewed by the ${BRAND_NAME} compliance team`)).toBeInTheDocument();
    expect(document.querySelector(`time[datetime="${content.lastReviewed}"]`)).not.toBeNull();
    for (const source of content.sources) {
      const link = screen.getByRole('link', { name: source.label });
      expect(link).toHaveAttribute('href', source.url);
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }

    // Section headings are questions (the FAQ heading names the FAQ).
    const h2s = screen
      .getAllByRole('heading', { level: 2 })
      .filter((node) => !node.closest('footer'))
      .map((node) => node.textContent ?? '');
    const inSentence = content.nameInSentence ?? content.name;
    expect(h2s).toContain(`What does ${inSentence} require?`);
    expect(h2s).toContain(`How do you prepare for ${inSentence}?`);
    expect(h2s).toContain(`${content.name} FAQ`);
    for (const heading of h2s) {
      if (heading === `${content.name} FAQ` || heading.startsWith('Start your')) continue;
      expect(heading.endsWith('?'), heading).toBe(true);
    }

    // Trials are on request; no self-serve trial promise.
    expect(screen.getByText('Request a trial').closest('a')).toHaveAttribute('href', '/demo');
    expect(screen.queryByText(/free trial/i)).not.toBeInTheDocument();

    // JSON-LD: one reviewed WebPage with the same date as the byline, the FAQ, no app schema.
    const blocks = readJsonLd();
    const page = blocks.find((block) => block['@type'] === 'WebPage');
    expect(page).toMatchObject({
      url: `https://www.complyeasyai.com${content.path}`,
      dateModified: content.lastReviewed,
      lastReviewed: content.lastReviewed,
      publisher: { '@type': 'Organization', name: BRAND_NAME },
      author: { '@type': 'Organization', name: BRAND_NAME },
      citation: content.sources.map((source) => source.url),
    });
    const faq = blocks.find((block) => block['@type'] === 'FAQPage');
    expect(faq!.mainEntity.map((entry: any) => entry.name)).toEqual(content.faqs.map((f) => f.q));
    expect(blocks.map((block) => block['@type'])).not.toContain('SoftwareApplication');

    // Metadata: one brand spelling and a title short enough not to be truncated.
    const title = document.head.querySelector('title')?.textContent ?? '';
    expect(title.length).toBeLessThanOrEqual(60);
    expect(title.endsWith(`| ${BRAND_NAME}`)).toBe(true);
    expect(document.documentElement.innerHTML).not.toContain(BRAND_ALTERNATE_NAME);

    expect(brokenInternalLinks()).toEqual([]);
  });

  it('shows the EU AI Act timeline after the 2026 Digital Omnibus', () => {
    renderPage(<EUAIActPillar />);
    expect(
      screen.getByRole('heading', { level: 2, name: 'When do EU AI Act obligations apply?' }),
    ).toBeInTheDocument();
    for (const [iso, label] of [
      ['2025-02-02', '2 February 2025'],
      ['2026-08-02', '2 August 2026'],
      ['2027-12-02', '2 December 2027'],
      ['2028-08-02', '2 August 2028'],
    ]) {
      const time = document.querySelector(`time[datetime="${iso}"]`);
      expect(time, iso).toHaveTextContent(label);
    }
  });

  it('shows the India DPDP Rules phase dates', () => {
    renderPage(<IndiaDPDPAPillar />);
    expect(document.querySelector('time[datetime="2026-11-13"]')).toHaveTextContent('13 November 2026');
    expect(document.querySelector('time[datetime="2027-05-13"]')).toHaveTextContent('13 May 2027');
  });

  it('omits the timeline section for pillars without phased dates', () => {
    renderPage(<SOC2Pillar />);
    expect(screen.queryByRole('heading', { name: /obligations apply\?/ })).not.toBeInTheDocument();
  });
});

describe('AI compliance pillar', () => {
  it('answers "What is AI compliance?" first, with the Omnibus dates, a byline and reviewed schema', () => {
    renderPage(<AICompliancePillar />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('What is AI compliance?');
    const answer = document.getElementById('ai-compliance-definition')!;
    expect(wordCount(answer.textContent ?? '')).toBeGreaterThanOrEqual(40);
    expect(wordCount(answer.textContent ?? '')).toBeLessThanOrEqual(60);
    expect(screen.getByRole('region', { name: 'TL;DR' })).toBeInTheDocument();
    expect(screen.getByText(`Reviewed by the ${BRAND_NAME} compliance team`)).toBeInTheDocument();
    expect(screen.getByText('Updated September 2026')).toBeInTheDocument();
    expect(screen.getByText(/high-risk duties apply from 2 December 2027 for Annex III/)).toBeInTheDocument();

    const blocks = readJsonLd();
    expect(blocks.find((block) => block['@type'] === 'Article')).toMatchObject({
      datePublished: '2026-06-07',
      dateModified: '2026-09-27',
      author: { '@type': 'Organization', name: BRAND_NAME },
      publisher: { '@type': 'Organization', name: BRAND_NAME },
    });
    const page = blocks.find((block) => block['@type'] === 'WebPage');
    expect(page).toMatchObject({ lastReviewed: '2026-09-27' });
    expect(page!.speakable.cssSelector).toEqual(['#ai-compliance-definition']);
    const faq = blocks.find((block) => block['@type'] === 'FAQPage');
    expect(faq!.mainEntity.map((entry: any) => entry.name)).toContain(
      'What is the EU AI Act deadline for high-risk AI?',
    );

    for (const cta of screen.getAllByText('Request a trial')) {
      expect(cta.closest('a')).toHaveAttribute('href', '/demo');
    }
    expect(document.body.textContent).not.toMatch(/free trial|just-in-time/i);
    expect(document.documentElement.innerHTML).not.toContain(BRAND_ALTERNATE_NAME);
    expect(brokenInternalLinks()).toEqual([]);
  });
});

describe('GRC pillar', () => {
  it('keeps its answer-first definition, adds a TL;DR and byline, and links only to public pages', () => {
    renderPage(<GRCPillar />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('GRC software');
    expect(screen.getByText('One system of record for policies, risks, controls and evidence.')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'TL;DR' })).toBeInTheDocument();
    expect(screen.getByText(`Reviewed by the ${BRAND_NAME} compliance team`)).toBeInTheDocument();
    for (const question of [
      'What should a GRC platform do?',
      'How does GRC software work?',
      'What goes wrong without GRC software?',
      'How does ComplyEasyAI handle GRC?',
    ]) {
      expect(screen.getByRole('heading', { level: 2, name: question })).toBeInTheDocument();
    }
    expect(readJsonLd().find((block) => block['@type'] === 'WebPage')).toMatchObject({
      dateModified: '2026-09-27',
    });
    for (const cta of screen.getAllByText('Request a trial')) {
      expect(cta.closest('a')).toHaveAttribute('href', '/demo');
    }
    expect(document.body.textContent).not.toMatch(/free trial|just-in-time/i);
    expect(document.documentElement.innerHTML).not.toContain(BRAND_ALTERNATE_NAME);
    expect(brokenInternalLinks()).toEqual([]);
  });
});

describe('pillar sources', () => {
  it.each([
    'data/frameworkPillarContent.ts',
    'components/marketing/pages/SignalFrameworkPillar.tsx',
    'components/marketing/pages/AICompliancePillar.tsx',
    'components/marketing/pages/GRCPillar.tsx',
    ...FRAMEWORK_PAGES.map(([, Page]) => `components/marketing/pages/${Page.name}.tsx`),
  ])('%s carries no app-only links, trial promises or the spaced brand spelling', (file) => {
    const source = readFileSync(resolve(ROOT, file), 'utf8');
    expect(source).not.toMatch(/['"`]\/frameworks\//);
    expect(source).not.toMatch(/free trial|no credit card/i);
    expect(source).not.toContain(BRAND_ALTERNATE_NAME);
  });
});
