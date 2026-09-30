import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { useParams } from 'react-router';

import { GlossaryTerm } from '../marketing/pages/GlossaryTerm';
import { GlossaryIndex } from '../marketing/pages/GlossaryIndex';
import { glossaryTerms, termInQuestion } from '../../data/glossary';
import { BRAND_ALTERNATE_NAME, BRAND_NAME } from '../seo/brand';
import { allPublicRoutes } from '../../scripts/publicRoutes.mjs';

// react-router, react-markdown and lucide-react are stubbed globally in
// setupTests.ts (Link -> <a href>, markdown -> raw text). Link targets inside
// markdown bodies are checked at the data level in __tests__/data.

afterEach(() => {
  cleanup();
  document.head.innerHTML = '';
  vi.mocked(useParams).mockReturnValue({});
});

const readJsonLd = (): Array<Record<string, any>> =>
  Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map((node) =>
    JSON.parse(node.textContent ?? '{}'),
  );

const wordCount = (text: string): number =>
  text.split(/\s+/).filter((token) => /[\p{L}\p{N}]/u.test(token)).length;

const PUBLIC_DESTINATIONS = new Set<string>([...allPublicRoutes(), '/signup', '/demo', '/login']);

/** Internal hrefs on the page that do not resolve to a public route (app-only routes bounce to "/"). */
const brokenInternalLinks = (): string[] =>
  Array.from(document.querySelectorAll('a[href^="/"]'))
    .map((anchor) => (anchor.getAttribute('href') ?? '').split(/[?#]/)[0])
    .filter((path) => !PUBLIC_DESTINATIONS.has(path) && !path.startsWith('/docs/'));

const pageTitle = () => document.head.querySelector('title')?.textContent ?? '';

describe('glossary term page', () => {
  it.each(glossaryTerms.map((entry) => [entry.slug, entry] as const))('%s asks "What is …?" and answers first', (slug, entry) => {
    vi.mocked(useParams).mockReturnValue({ term: slug });
    render(<GlossaryTerm />);

    const question = `What is ${termInQuestion(entry)}?`;
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(question);
    expect(document.getElementById('glossary-definition')).toHaveTextContent(entry.shortDef);
    const tldr = screen.getByRole('region', { name: 'TL;DR' });
    expect(within(tldr).getAllByRole('listitem')).toHaveLength(entry.tldr.length);
    expect(document.querySelector(`time[datetime="${entry.lastReviewed}"]`)).not.toBeNull();

    const h2s = screen
      .getAllByRole('heading', { level: 2 })
      .filter((node) => !node.closest('footer'))
      .map((node) => node.textContent ?? '');
    for (const heading of h2s) expect(heading.endsWith('?'), heading).toBe(true);

    expect(screen.getByText(`Go deeper: ${entry.pillar.label}`).closest('a')).toHaveAttribute(
      'href',
      entry.pillar.path,
    );

    const blocks = readJsonLd();
    expect(blocks.find((block) => block['@type'] === 'DefinedTerm')).toMatchObject({
      name: entry.term,
      description: entry.shortDef,
    });
    expect(blocks.find((block) => block['@type'] === 'WebPage')).toMatchObject({
      lastReviewed: entry.lastReviewed,
      dateModified: entry.lastReviewed,
      publisher: { '@type': 'Organization', name: BRAND_NAME },
    });
    const faq = blocks.find((block) => block['@type'] === 'FAQPage');
    expect(faq!.mainEntity.map((item: any) => item.name)).toEqual(entry.faqs.map((f) => f.q));

    expect(pageTitle().length).toBeLessThanOrEqual(60);
    expect(pageTitle().endsWith(`| ${BRAND_NAME}`)).toBe(true);
    expect(document.documentElement.innerHTML).not.toContain(BRAND_ALTERNATE_NAME);
    expect(brokenInternalLinks()).toEqual([]);
  });
});

describe('glossary index page', () => {
  it('opens answer-first and lists every term', () => {
    render(<GlossaryIndex />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Compliance glossary: SOC 2, GDPR, the EU AI Act and more',
    );
    const answer = document.getElementById('glossary-answer')!.textContent ?? '';
    expect(answer).toContain(`${glossaryTerms.length} core compliance terms`);
    expect(wordCount(answer)).toBeGreaterThanOrEqual(40);
    expect(wordCount(answer)).toBeLessThanOrEqual(60);
    expect(screen.getByRole('region', { name: 'TL;DR' })).toBeInTheDocument();
    expect(document.querySelector('time[datetime="2026-09-27"]')).not.toBeNull();
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(glossaryTerms.length);
    expect(screen.queryByText(/2026-06-07/)).not.toBeInTheDocument();
    expect(document.documentElement.innerHTML).not.toContain(BRAND_ALTERNATE_NAME);
    expect(brokenInternalLinks()).toEqual([]);
  });
});
