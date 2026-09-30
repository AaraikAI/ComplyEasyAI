import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  FRAMEWORK_PILLARS,
  FRAMEWORK_PILLAR_COUNT,
  relatedPillars,
} from '../../data/frameworkPillarContent';
import { SIGNAL_CATEGORIES } from '../../components/marketing/signal';
import { STATIC_ROUTES } from '../../scripts/publicRoutes.mjs';

/**
 * Guards the marketing framework catalogue against the drift that left AIUC-1
 * and India DPDPA missing from /frameworks after they were added to the backend:
 * every pillar needs content here, a route in App.tsx, and an entry in the
 * public-route list that feeds the sitemap, prerender and CloudFront manifest.
 */
const ROOT = resolve(__dirname, '..', '..');
const appSource = readFileSync(resolve(ROOT, 'App.tsx'), 'utf8');
const manifest: string[] = JSON.parse(
  readFileSync(resolve(ROOT, 'infrastructure/prerendered-routes.json'), 'utf8'),
);
const pillars = Object.values(FRAMEWORK_PILLARS);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Words as a reader counts them: whitespace-separated tokens holding a letter or digit. */
const wordCount = (text: string): number =>
  text.split(/\s+/).filter((token) => /[\p{L}\p{N}]/u.test(token)).length;

describe('framework pillar content', () => {
  it('lists the 16 pillars, including AIUC-1 and India DPDPA', () => {
    expect(FRAMEWORK_PILLAR_COUNT).toBe(16);
    expect(pillars).toHaveLength(FRAMEWORK_PILLAR_COUNT);
    expect(FRAMEWORK_PILLARS['aiuc-1']).toMatchObject({
      name: 'AIUC-1',
      category: 'AI Governance',
      path: '/aiuc-1',
    });
    expect(FRAMEWORK_PILLARS['india-dpdpa']).toMatchObject({
      name: 'India DPDPA',
      category: 'Privacy',
      path: '/india-dpdpa',
    });
  });

  it('keys every pillar by its slug with a unique absolute path and a known category', () => {
    const paths = new Set<string>();
    for (const [key, pillar] of Object.entries(FRAMEWORK_PILLARS)) {
      expect(pillar.slug).toBe(key);
      expect(pillar.path.startsWith('/')).toBe(true);
      expect(paths.has(pillar.path)).toBe(false);
      paths.add(pillar.path);
      expect(Object.keys(SIGNAL_CATEGORIES)).toContain(pillar.category);
    }
  });

  it('gives every pillar enough content for the shared template', () => {
    for (const pillar of pillars) {
      expect(pillar.name.length).toBeGreaterThan(0);
      expect(pillar.tagline.length).toBeGreaterThan(0);
      expect(pillar.definition.length).toBeGreaterThan(80);
      expect(pillar.requirements.length).toBeGreaterThanOrEqual(5);
      expect(pillar.faqs.length).toBeGreaterThanOrEqual(4);
      for (const req of pillar.requirements) {
        expect(req.num).toMatch(/^\d{2}$/);
        expect(req.name.length).toBeGreaterThan(0);
        expect(req.desc.length).toBeGreaterThan(0);
      }
    }
  });

  it('opens every pillar answer-first: a short hook, a 40–60-word answer and a 3–4 item TL;DR', () => {
    for (const pillar of pillars) {
      const label = pillar.slug;
      expect(wordCount(pillar.hook), `${label} hook`).toBeLessThanOrEqual(22);
      expect(wordCount(pillar.definition), `${label} definition`).toBeGreaterThanOrEqual(40);
      expect(wordCount(pillar.definition), `${label} definition`).toBeLessThanOrEqual(60);
      expect(pillar.tldr.length, `${label} TL;DR`).toBeGreaterThanOrEqual(3);
      expect(pillar.tldr.length, `${label} TL;DR`).toBeLessThanOrEqual(4);
      for (const item of pillar.tldr) {
        expect(wordCount(item), `${label} TL;DR item "${item}"`).toBeLessThanOrEqual(20);
      }
    }
  });

  it('keeps FAQs short enough to quote: 4–6 questions, each answer 70 words or fewer', () => {
    for (const pillar of pillars) {
      expect(pillar.faqs.length, pillar.slug).toBeGreaterThanOrEqual(4);
      expect(pillar.faqs.length, pillar.slug).toBeLessThanOrEqual(6);
      for (const faq of pillar.faqs) {
        expect(faq.q.endsWith('?'), `${pillar.slug}: "${faq.q}"`).toBe(true);
        expect(wordCount(faq.a), `${pillar.slug}: "${faq.q}"`).toBeLessThanOrEqual(70);
      }
    }
  });

  it('cites https sources and a review date on every pillar, and orders any timeline by date', () => {
    for (const pillar of pillars) {
      expect(pillar.lastReviewed, pillar.slug).toMatch(ISO_DATE);
      expect(pillar.sources.length, pillar.slug).toBeGreaterThanOrEqual(1);
      for (const source of pillar.sources) {
        expect(source.label.length, pillar.slug).toBeGreaterThan(0);
        expect(source.url, pillar.slug).toMatch(/^https:\/\/[^\s]+$/);
      }
      if (pillar.timeline) {
        const dates = pillar.timeline.map((milestone) => milestone.date);
        for (const date of dates) expect(date, pillar.slug).toMatch(ISO_DATE);
        expect(dates, `${pillar.slug} timeline order`).toEqual([...dates].sort());
      }
    }
  });

  it('dates the phased regulations, including the EU AI Act after the 2026 Digital Omnibus', () => {
    const milestones = (slug: string) =>
      (FRAMEWORK_PILLARS[slug].timeline ?? []).map((milestone) => milestone.date);
    expect(milestones('eu-ai-act')).toEqual(
      expect.arrayContaining(['2025-02-02', '2025-08-02', '2026-08-02', '2027-12-02', '2028-08-02']),
    );
    expect(milestones('india-dpdpa')).toEqual(
      expect.arrayContaining(['2025-11-13', '2026-11-13', '2027-05-13']),
    );
    expect(milestones('csrd')).toEqual(expect.arrayContaining(['2026-03-18', '2027-03-19']));
    expect(milestones('ccpa')).toEqual(expect.arrayContaining(['2026-01-01', '2027-01-01', '2028-04-01']));
  });

  it('carries no retired claims, app-only links or superseded facts', () => {
    const text = JSON.stringify(FRAMEWORK_PILLARS);
    expect(text).not.toContain('/frameworks/');
    expect(text).not.toContain('ComplyEasy AI');
    expect(text).not.toMatch(/free trial|no credit card/i);
    // PCI DSS v4.0 was retired on 31 December 2024; v4.0.1 is the active version.
    expect(FRAMEWORK_PILLARS['pci-dss'].definition).toContain('v4.0.1');
    // Omnibus I dropped listed SMEs and the move to reasonable assurance.
    expect(JSON.stringify(FRAMEWORK_PILLARS.csrd)).not.toMatch(/then reasonable|listed SMEs are phased/i);
  });

  it('has a public route, an App.tsx route and a prerender-manifest entry for every pillar', () => {
    for (const pillar of pillars) {
      expect(STATIC_ROUTES, `${pillar.slug} missing from scripts/publicRoutes.mjs`).toContain(
        pillar.path,
      );
      expect(appSource, `${pillar.slug} has no <Route path="${pillar.path}"> in App.tsx`).toContain(
        `path="${pillar.path}"`,
      );
      expect(manifest, `${pillar.slug} missing from infrastructure/prerendered-routes.json`).toContain(
        pillar.path,
      );
    }
  });

  it('relates new pillars to their own category first', () => {
    const aiucRelated = relatedPillars('aiuc-1').map((p) => p.slug);
    expect(aiucRelated).toHaveLength(3);
    expect(aiucRelated).not.toContain('aiuc-1');
    expect(aiucRelated).toEqual(['eu-ai-act', 'nist-ai-rmf', 'iso-42001']);

    const dpdpaRelated = relatedPillars('india-dpdpa').map((p) => p.slug);
    expect(dpdpaRelated).toEqual(['gdpr', 'hipaa', 'ccpa']);
  });
});
