import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  FRAMEWORK_CATALOGUE_FLOOR,
  FRAMEWORK_CATALOGUE_LABEL,
  INTEGRATION_COUNT,
  VERIFIED_INTEGRATIONS,
} from '../../data/marketingFacts';

/**
 * Keeps the public counts and claims honest: one integration number and one
 * catalogue figure everywhere, both backed by the code, and none of the
 * retired promises (self-serve free trial, comparative superlatives,
 * multi-region hosting, certifications ComplyEasyAI does not hold).
 */
const ROOT = resolve(__dirname, '..', '..');
const read = (relPath: string): string => readFileSync(resolve(ROOT, relPath), 'utf8');

/** Public pages and text files whose copy these facts govern. */
const PUBLIC_COPY_FILES = [
  'index.html',
  'public/llms.txt',
  'public/llms-full.txt',
  'components/LandingPage.tsx',
  'components/marketing/MarketingLayout.tsx',
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
  'components/marketing/pages/BlogIndex.tsx',
  'components/marketing/pages/BlogPost.tsx',
  'components/marketing/pages/GlossaryIndex.tsx',
  'components/marketing/pages/GlossaryTerm.tsx',
  'data/blog/index.ts',
  'data/glossary.ts',
];

/** Lines of `file` matching `pattern`, prefixed with their line number. */
const matchingLines = (file: string, pattern: RegExp): string[] =>
  read(file)
    .split('\n')
    .map((line, index) => `${file}:${index + 1}: ${line.trim()}`)
    .filter((line) => pattern.test(line));

describe('integration count', () => {
  it('counts each verified connector once, and every one is in the in-app catalogue', () => {
    expect(new Set(VERIFIED_INTEGRATIONS).size).toBe(VERIFIED_INTEGRATIONS.length);
    expect(INTEGRATION_COUNT).toBe(26);
    const catalogue = new Set(
      Array.from(read('components/Integrations.tsx').matchAll(/\{ id: '[^']+', name: '([^']+)'/g)).map(
        (match) => match[1],
      ),
    );
    expect(VERIFIED_INTEGRATIONS.filter((name) => !catalogue.has(name))).toEqual([]);
  });

  it('uses the one verified number wherever public copy states an integration count', () => {
    const counts = PUBLIC_COPY_FILES.flatMap((file) =>
      Array.from(read(file).matchAll(/\b(\d+)(\+?)\s+(?:verified\s+|pre-built\s+)?integrations\b/gi)).map(
        (match) => `${file}: ${match[0]}`,
      ),
    );
    expect(counts.filter((entry) => !entry.endsWith(`${INTEGRATION_COUNT} verified integrations`)
      && !entry.endsWith(`${INTEGRATION_COUNT} integrations`))).toEqual([]);
    expect(read('public/llms.txt')).toContain(`${INTEGRATION_COUNT} verified integrations`);
    for (const name of VERIFIED_INTEGRATIONS) expect(read('public/llms.txt')).toContain(name);
  });
});

describe('framework catalogue', () => {
  it(`keeps at least ${FRAMEWORK_CATALOGUE_FLOOR} framework templates behind the "${FRAMEWORK_CATALOGUE_LABEL}" claim`, () => {
    const service = read('server/src/services/frameworkTemplateService.ts');
    const map = service.slice(
      service.indexOf('const FRAMEWORK_TEMPLATE_MAP'),
      service.indexOf('const FRAMEWORK_ALIASES'),
    );
    const templates = Array.from(map.matchAll(/\n {4}displayName: '([^']+)'/g)).map((m) => m[1]);
    expect(new Set(templates).size).toBe(templates.length);
    expect(templates.length).toBeGreaterThanOrEqual(FRAMEWORK_CATALOGUE_FLOOR);
  });

  it('states the catalogue with the one label wherever public copy gives a figure', () => {
    const figures = PUBLIC_COPY_FILES.flatMap((file) =>
      Array.from(read(file).matchAll(/\b(\d+)\+\s+frameworks\b/gi)).map((match) => `${file}: ${match[0]}`),
    );
    expect(figures.filter((entry) => !entry.endsWith(`${FRAMEWORK_CATALOGUE_LABEL} frameworks`))).toEqual([]);
  });
});

describe('retired claims', () => {
  it.each([
    ['self-serve free-trial promises', /free trial|no credit card|3-day|start free/i],
    ['comparative superlatives', /only platform|paid extras elsewhere|mid-market tools|coverage others/i],
    ['multi-region hosting', /multi-region cloud storage|geo-replication|regional isolation/i],
    ['certifications ComplyEasyAI does not hold', /\b(SOC 2|ISO 27001)[- ]certified\b/i],
    ['the removed community page', /\/community\b|community forum/i],
    ['legal pages that are not published', /(to|href)=["'{`]+\/(privacy|terms|dpa|security)["'`}]/i],
  ])('public copy carries no %s', (_label, pattern) => {
    expect(PUBLIC_COPY_FILES.flatMap((file) => matchingLines(file, pattern))).toEqual([]);
  });
});
