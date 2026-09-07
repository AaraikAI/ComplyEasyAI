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
