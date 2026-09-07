// Helpers for scripts/prerender.mjs that are worth unit-testing on their own.

/**
 * Rewrite every reference to the prerenderer's own origin (e.g.
 * `http://127.0.0.1:5050/assets/x.js`) to a root-relative path.
 *
 * Vite injects `<link rel="modulepreload">` (and the browser records other
 * absolute URLs) for lazily-loaded chunks while the page runs under the local
 * static server; serialising the DOM captures those as absolute localhost URLs.
 * Shipped as-is, every prerendered page makes real browsers preload from
 * 127.0.0.1, which the CSP blocks (a console error on every page) and which
 * would otherwise be a dead connection.
 */
export function relativizeOrigin(html, origin) {
  if (!origin) return html;
  const base = origin.endsWith('/') ? origin.slice(0, -1) : origin;
  return html.replaceAll(`${base}/`, '/').replaceAll(base, '/');
}

/** True when the serialised page still references the prerenderer's origin. */
export function referencesOrigin(html, origin) {
  const base = origin.endsWith('/') ? origin.slice(0, -1) : origin;
  return html.includes(base);
}
