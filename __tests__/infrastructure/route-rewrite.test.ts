import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';

/**
 * Guards the CloudFront viewer-request function that replaced the distribution-
 * wide 403/404 -> /index.html error responses. Renders the committed source with
 * the committed prerendered-route manifest — the same substitution the CDK
 * stack and scripts/export-prerender-manifest.mjs perform — then exercises the
 * routing table. The manifest itself is kept in sync with scripts/publicRoutes.mjs
 * by `npm run sitemap`; CI diffs it.
 */
const ROOT = resolve(__dirname, '..', '..');
const source = readFileSync(resolve(ROOT, 'infrastructure/cloudfront/route-rewrite.js'), 'utf8');
const routes: string[] = JSON.parse(readFileSync(resolve(ROOT, 'infrastructure/prerendered-routes.json'), 'utf8'));
const routeSet = Object.fromEntries(routes.map((r) => [r, 1]));
const rendered = source.replaceAll('__PRERENDERED_ROUTES__', JSON.stringify(routeSet));
// The function body is generated code; evaluate it in an isolated vm context
// (what CloudFront itself does) rather than via the Function constructor.
const handler = runInNewContext(`${rendered}; handler`, {}) as (event: { request: { uri: string } }) => { uri: string };
const route = (uri: string) => handler({ request: { uri } }).uri;

describe('CloudFront route-rewrite function', () => {
  it('substitutes the prerendered-route placeholder and stays under the 10 KB function limit', () => {
    expect(rendered).not.toContain('__PRERENDERED_ROUTES__');
    expect(Buffer.byteLength(rendered)).toBeLessThan(10240);
    expect(routes.length).toBeGreaterThan(20);
  });

  it('serves the shell for the root', () => {
    expect(route('/')).toBe('/index.html');
    expect(route('')).toBe('/index.html');
  });

  it('maps prerendered routes to their static HTML, with or without a trailing slash', () => {
    expect(routes).toContain('/soc2-compliance');
    expect(route('/soc2-compliance')).toBe('/soc2-compliance/index.html');
    expect(route('/soc2-compliance/')).toBe('/soc2-compliance/index.html');
    expect(route('/glossary/soc-2')).toBe('/glossary/soc-2/index.html');
    expect(route('/status')).toBe('/status/index.html');
  });

  it('serves the SPA shell for application routes and unknown paths instead of relying on a 403/404 rewrite', () => {
    expect(route('/dashboard/risks/123')).toBe('/index.html');
    expect(route('/settings')).toBe('/index.html');
    expect(route('/definitely-not-a-prerendered-route')).toBe('/index.html');
  });

  it('leaves anything with a file extension untouched so S3 answers for real objects', () => {
    expect(route('/assets/app-abc123.js')).toBe('/assets/app-abc123.js');
    expect(route('/sitemap.xml')).toBe('/sitemap.xml');
    expect(route('/robots.txt')).toBe('/robots.txt');
    expect(route('/soc2-compliance/index.html')).toBe('/soc2-compliance/index.html');
  });
});
