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
var PRERENDERED = {"/":1,"/blog":1,"/blog/eu-ai-act-compliance-checklist":1,"/blog/how-to-automate-soc-2-compliance-with-ai":1,"/blog/vanta-vs-drata-vs-complyeasy-ai":1,"/ccpa":1,"/community":1,"/csrd-compliance":1,"/demo":1,"/dma-compliance":1,"/docs":1,"/dora-compliance":1,"/dsa-compliance":1,"/eu-ai-act":1,"/faq":1,"/frameworks":1,"/gdpr":1,"/glossary":1,"/glossary/ai-compliance":1,"/glossary/audit-readiness":1,"/glossary/continuous-compliance":1,"/glossary/control-mapping":1,"/glossary/dpia":1,"/glossary/eu-ai-act":1,"/glossary/evidence-collection":1,"/glossary/gdpr":1,"/glossary/grc":1,"/glossary/hipaa":1,"/glossary/iso-27001":1,"/glossary/nist-ai-rmf":1,"/glossary/risk-register":1,"/glossary/ropa":1,"/glossary/soc-2":1,"/glossary/vendor-risk-management":1,"/grc":1,"/hipaa":1,"/iso-27001":1,"/iso-42001":1,"/learn":1,"/login":1,"/nist-ai-rmf":1,"/nist-csf":1,"/pci-dss":1,"/platform":1,"/platform/ai-compliance":1,"/pricing":1,"/soc2-compliance":1,"/status":1};

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
