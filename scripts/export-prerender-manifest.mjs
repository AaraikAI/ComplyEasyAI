// Emits the prerendered-route manifest consumed by the CloudFront viewer-request
// function (infrastructure/cloudfront/route-rewrite.js): the JSON the CDK stack
// embeds at synth, plus a fully rendered copy that can be pasted into the
// CloudFront console for a distribution that is not managed by CDK.
//
// Runs as part of `npm run sitemap` so the manifest can never drift from
// scripts/publicRoutes.mjs, the single source of truth for public routes.
//
// `npm run build` chains `npm run sitemap`, and the Docker frontend-build stage
// runs that build from a curated copy of the tree that has no infrastructure/
// directory (the image only needs dist/). When the function template is absent
// the manifest is not needed either, so this is a no-op there rather than an
// ENOENT that fails the image build.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { allPublicRoutes } from './publicRoutes.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const infra = resolve(__dirname, '..', 'infrastructure');
const templatePath = resolve(infra, 'cloudfront', 'route-rewrite.js');

if (!existsSync(templatePath)) {
  console.log(
    'Skipping prerendered-route manifest: infrastructure/cloudfront/route-rewrite.js is not present ' +
      '(partial checkout, e.g. the Docker frontend-build stage).'
  );
  process.exit(0);
}

const routes = [...new Set(allPublicRoutes())].sort();
mkdirSync(infra, { recursive: true });
writeFileSync(resolve(infra, 'prerendered-routes.json'), JSON.stringify(routes, null, 2) + '\n', 'utf8');

const routeSet = {};
for (const route of routes) routeSet[route] = 1;
const source = readFileSync(templatePath, 'utf8');
const rendered = source.replaceAll('__PRERENDERED_ROUTES__', JSON.stringify(routeSet));
if (rendered.includes('__PRERENDERED_ROUTES__')) throw new Error('placeholder substitution failed');
writeFileSync(resolve(infra, 'cloudfront', 'route-rewrite.rendered.js'), rendered, 'utf8');

console.log(
  `Wrote ${routes.length} prerendered routes to infrastructure/prerendered-routes.json ` +
    `and rendered infrastructure/cloudfront/route-rewrite.rendered.js (${Buffer.byteLength(rendered)} bytes; CloudFront limit 10240)`
);
