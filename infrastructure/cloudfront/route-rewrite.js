// CloudFront Function (viewer-request) for the ComplyEasyAI SPA distribution.
//
// Source of truth for the function body. The placeholder on the `var PRERENDERED`
// line is replaced with an object keyed by every prerendered public route — generated from
// scripts/publicRoutes.mjs by scripts/export-prerender-manifest.mjs (run as part
// of `npm run sitemap`), and again by the CDK FrontendStack at synth time.
//
// Why the route set lives here: the previous setup relied on distribution-wide
// custom error responses (403/404 -> /index.html with a 200) to make SPA deep
// links work. Custom error responses apply to EVERY origin, so a 403 from the
// API's CSRF middleware or a 404 for an unknown /api path was silently replaced
// by the SPA's HTML with a 200 — the browser then failed parsing HTML as JSON.
// Deciding "prerendered page or SPA shell" up front, per request, removes the
// need for any error-response rewrite, so API errors reach the browser intact.
var PRERENDERED = __PRERENDERED_ROUTES__;

function handler(event) {
  var request = event.request;
  var uri = request.uri;

  if (uri === '' || uri === '/') {
    request.uri = '/index.html';
    return request;
  }

  // Treat "/route/" and "/route" identically.
  if (uri.length > 1 && uri.endsWith('/')) {
    uri = uri.slice(0, -1);
  }

  // Anything with a file extension in its last segment is a real object
  // (hashed assets, sitemap.xml, robots.txt, per-route index.html): pass it
  // through untouched and let S3 answer.
  var lastSegment = uri.slice(uri.lastIndexOf('/') + 1);
  if (lastSegment.indexOf('.') !== -1) {
    return request;
  }

  // Prerendered marketing/content route: serve its static HTML.
  if (PRERENDERED[uri] === 1) {
    request.uri = uri + '/index.html';
    return request;
  }

  // Any other extension-less path is an application route (or an unknown one,
  // which the SPA renders as not-found): serve the shell.
  request.uri = '/index.html';
  return request;
}
