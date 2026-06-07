import type { Page } from '@playwright/test';

/**
 * Test-environment CSP shim — NOT an app change.
 *
 * The statically-served SPA ships a `<meta http-equiv="Content-Security-Policy">`
 * with `connect-src 'self' https:` (index.html). In production the API is
 * same-origin / https, so XHRs and the websocket pass. The local/CI E2E stack,
 * however, serves the frontend on http://localhost:4173 and the API cross-origin
 * on PLAINTEXT http://localhost:3001 (and ws://localhost:3001), which matches
 * neither `'self'` nor `https:` — so the browser refuses every API request before
 * it leaves the page. That makes data-dependent flows (create/list/report) appear
 * broken even though the app wiring is correct.
 *
 * This rewrites only the served document's CSP directive to additionally permit
 * the cross-origin http API origin under test. It anchors on the exact directive
 * token (`connect-src 'self' https:`) so it does not also rewrite the explanatory
 * HTML comment near the meta tag. Call once in a spec's beforeEach (before goto).
 */
export async function allowTestApiCsp(page: Page): Promise<void> {
  await page.route('**/*', async (route) => {
    const req = route.request();
    if (req.resourceType() !== 'document') return route.fallback();
    const resp = await route.fetch();
    const ct = resp.headers()['content-type'] || '';
    if (!ct.includes('text/html')) return route.fulfill({ response: resp });
    const html = (await resp.text()).replace(
      /connect-src 'self' https:/i,
      "connect-src 'self' http://localhost:3001 ws://localhost:3001 https:",
    );
    return route.fulfill({ response: resp, body: html });
  });
}
