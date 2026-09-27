import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { SITE_ORIGIN } from '../../components/seo/siteOrigin';
import { SITE_ORIGIN as SCRIPT_SITE_ORIGIN } from '../../scripts/siteOrigin.mjs';
import {
  allPublicRoutes,
  PILLAR_PATHS,
  SITEMAP_EXCLUDED_ROUTES,
  STATIC_ROUTES,
} from '../../scripts/publicRoutes.mjs';
import { FRAMEWORK_PILLARS } from '../../data/frameworkPillarContent';

/**
 * Guards the public URLs the site emits. The apex host (complyeasyai.com) only
 * forwards "/" to www and answers 404 for every other path, so every canonical,
 * og:url, JSON-LD URL, sitemap entry and llms link must use the www origin.
 */
const ROOT = resolve(__dirname, '..', '..');
const APEX_URL = /https?:\/\/complyeasyai\.com/;

const read = (relPath: string): string => readFileSync(resolve(ROOT, relPath), 'utf8');

/** Source files under a directory (recursive), excluding test folders. */
const sourceFiles = (dir: string, extensions: string[]): string[] =>
  (readdirSync(resolve(ROOT, dir), { recursive: true }) as string[])
    .filter((file) => extensions.some((ext) => file.endsWith(ext)))
    .filter((file) => !file.split(/[\\/]/).includes('__tests__'))
    .map((file) => join(dir, file));

const indexableRoutes = (): string[] =>
  allPublicRoutes().filter((route: string) => !SITEMAP_EXCLUDED_ROUTES.includes(route));

/** Paths of every site URL in a text file, e.g. "/pricing" or "/". */
const sitePathsIn = (text: string): string[] =>
  Array.from(text.matchAll(/https:\/\/www\.complyeasyai\.com(\/[^\s)<>"'`]*)?/g)).map(
    (match) => match[1] ?? '/',
  );

describe('site origin', () => {
  it('uses one www origin in the components and the build scripts', () => {
    expect(SITE_ORIGIN).toBe(SCRIPT_SITE_ORIGIN);
    expect(SITE_ORIGIN.startsWith('https://www.')).toBe(true);
    expect(SITE_ORIGIN.endsWith('/')).toBe(false);
  });

  it('never emits an apex URL from the shell, the public text files or the page sources', () => {
    const files = [
      'index.html',
      'public/robots.txt',
      'public/sitemap.xml',
      'public/llms.txt',
      'public/llms-full.txt',
      ...sourceFiles('components', ['.ts', '.tsx']),
      ...sourceFiles('data', ['.ts', '.tsx']),
      ...sourceFiles('scripts', ['.mjs']),
    ];
    const offenders = files.filter((file) => APEX_URL.test(read(file)));
    expect(offenders).toEqual([]);
  });

  it('points robots.txt at the www sitemap', () => {
    expect(read('public/robots.txt')).toContain(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`);
  });
});

describe('sitemap', () => {
  const locs = Array.from(read('public/sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)).map(
    (match) => match[1],
  );

  it('lists every indexable public route once, on the www origin', () => {
    const expected = indexableRoutes().map((route: string) =>
      route === '/' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${route}`,
    );
    expect(locs).toEqual(expected);
    expect(new Set(locs).size).toBe(locs.length);
  });

  it('leaves noindex routes out', () => {
    for (const route of SITEMAP_EXCLUDED_ROUTES) {
      expect(locs).not.toContain(`${SITE_ORIGIN}${route}`);
      // Still prerendered, so the CloudFront route set does not change.
      expect(STATIC_ROUTES).toContain(route);
    }
  });

  it('prioritises every framework pillar and both topic pillars', () => {
    const frameworkPaths = Object.values(FRAMEWORK_PILLARS).map((pillar) => pillar.path);
    expect([...PILLAR_PATHS].sort()).toEqual(
      [...frameworkPaths, '/platform/ai-compliance', '/grc'].sort(),
    );
    for (const path of PILLAR_PATHS) expect(STATIC_ROUTES).toContain(path);
  });
});

describe('llms context files', () => {
  const publicPaths = new Set<string>([...allPublicRoutes(), '/llms-full.txt']);

  it.each(['public/llms.txt', 'public/llms-full.txt'])('%s links only to live public pages', (file) => {
    const paths = sitePathsIn(read(file));
    expect(paths.length).toBeGreaterThan(0);
    expect(paths.filter((path) => !publicPaths.has(path))).toEqual([]);
  });

  it('llms-full.txt maps every indexable public route', () => {
    const listed = new Set(sitePathsIn(read('public/llms-full.txt')));
    expect(indexableRoutes().filter((route: string) => !listed.has(route))).toEqual([]);
  });
});
