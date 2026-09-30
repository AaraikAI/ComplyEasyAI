import { describe, expect, it } from 'vitest';
import { glossaryLastReviewed, glossarySlugs, glossaryTerms, termInQuestion } from '../../data/glossary';
import { allPublicRoutes, GLOSSARY_SLUGS } from '../../scripts/publicRoutes.mjs';

/**
 * Keeps every glossary entry answer-first: a 40–60-word definition whose first
 * sentence names and defines the term, three takeaways, short FAQs, a review
 * date, valid related terms and one brand spelling.
 */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Site-relative link targets in markdown, without query or fragment. */
const internalLinks = (markdown: string): string[] =>
  Array.from(markdown.matchAll(/\]\((\/[^)\s]*)\)/g)).map((match) => match[1].split(/[?#]/)[0]);

/** Internal destinations a public page may link to: prerendered routes plus the auth and demo flows. */
const PUBLIC_DESTINATIONS = new Set<string>([...allPublicRoutes(), '/signup', '/demo', '/login']);
const isPublic = (path: string) => PUBLIC_DESTINATIONS.has(path) || path.startsWith('/docs/');

const wordCount = (text: string): number =>
  text.split(/\s+/).filter((token) => /[\p{L}\p{N}]/u.test(token)).length;

/** Lower-cased words, with "ISO/IEC" read as "ISO" and punctuation dropped. */
const tokens = (text: string): string[] =>
  text
    .toLowerCase()
    .replace(/iso\/iec/g, 'iso')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

describe('glossary', () => {
  it('publishes exactly the terms listed in scripts/publicRoutes.mjs', () => {
    expect([...glossarySlugs].sort()).toEqual([...GLOSSARY_SLUGS].sort());
  });

  it('reports the newest review date', () => {
    expect(glossaryLastReviewed()).toBe(
      glossaryTerms.map((entry) => entry.lastReviewed).sort().pop(),
    );
  });
});

describe.each(glossaryTerms.map((entry) => [entry.slug, entry] as const))('glossary term %s', (_slug, entry) => {
  it('opens with a 40–60-word definition whose first sentence defines the term', () => {
    expect(wordCount(entry.shortDef)).toBeGreaterThanOrEqual(40);
    expect(wordCount(entry.shortDef)).toBeLessThanOrEqual(60);
    const firstSentence = entry.shortDef.split(/(?<=\.)\s/)[0];
    const sentenceTokens = new Set(tokens(firstSentence));
    for (const word of tokens(entry.term)) expect(sentenceTokens.has(word), `${entry.term}: ${word}`).toBe(true);
    expect(firstSentence).toMatch(/\b(is|are|stands for|links)\b/);
  });

  it('lists three takeaways, short FAQs and a review date', () => {
    expect(entry.tldr).toHaveLength(3);
    expect(entry.faqs.length).toBeGreaterThanOrEqual(2);
    for (const faq of entry.faqs) {
      expect(faq.q.trim().endsWith('?'), faq.q).toBe(true);
      expect(wordCount(faq.a)).toBeLessThanOrEqual(60);
    }
    expect(entry.lastReviewed).toMatch(ISO_DATE);
    expect(`What is ${termInQuestion(entry)}?`.length).toBeLessThanOrEqual(34);
  });

  it('relates only to other existing terms', () => {
    expect(entry.related).not.toContain(entry.slug);
    for (const slug of entry.related) expect(glossarySlugs, slug).toContain(slug);
  });

  it('spells the brand one way and names no competitor', () => {
    const text = [entry.term, entry.shortDef, entry.body, ...entry.tldr, ...entry.faqs.map((f) => f.a), entry.pillar.label].join('\n');
    expect(text).not.toContain('ComplyEasy AI');
    expect(text).not.toMatch(/vanta|drata|secureframe|sprinto|onetrust/i);
  });
});

describe('dated glossary facts', () => {
  const term = (slug: string) => glossaryTerms.find((entry) => entry.slug === slug)!;

  it('gives the post-Omnibus EU AI Act dates', () => {
    expect(term('eu-ai-act').shortDef).toContain('2 December 2027');
    expect(term('eu-ai-act').shortDef).toContain('2 August 2028');
    expect(term('eu-ai-act').body).toContain('Regulation (EU) 2026/1744');
  });

  it('says the NIST AI RMF is being revised', () => {
    expect(term('nist-ai-rmf').body).toMatch(/January 2023 \(AI RMF 1\.0\) and is now being revised/);
  });
});

describe('glossary links', () => {
  it('link only to public pages', () => {
    const broken = glossaryTerms.flatMap((entry) =>
      [...internalLinks(entry.body), entry.pillar.path]
        .filter((path) => !isPublic(path))
        .map((path) => `${entry.slug}: ${path}`),
    );
    expect(broken).toEqual([]);
  });
});
