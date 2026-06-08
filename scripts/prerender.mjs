// Build-time prerenderer for the public, crawlable routes of complyeasyai.com.
//
// After `vite build` produces ./dist, this script serves that directory and
// drives a headless browser over each public route, capturing the fully
// rendered HTML to dist/<route>/index.html. Crawlers and AI engines receive
// complete, content-rich markup; real users still load the same built module
// scripts and the SPA re-renders on mount.
//
// Key correctness detail: every NAVIGATION request is answered with the
// PRISTINE app shell (the original dist/index.html, read into memory before any
// snapshot is written). Only real asset files (.js/.css/.svg/.json/...) are
// served from disk. This prevents a snapshot written earlier in the run (for
// example the '/' landing page, which is written first) from becoming the SPA
// fallback for later routes — which would stop those routes from booting.

import { createServer } from 'node:http';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import sirv from 'sirv';
import puppeteer from 'puppeteer';
import { allPublicRoutes } from './publicRoutes.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = resolve(__dirname, '..', 'dist');
const PORT = 5050;
const NAV_TIMEOUT_MS = 30000;
const CONTENT_TIMEOUT_MS = 30000;
const SETTLE_MS = 350;

// Map a route to its output file: '/' -> dist/index.html,
// '/learn' -> dist/learn/index.html.
function outputPathFor(route) {
  if (route === '/') return join(DIST_DIR, 'index.html');
  const clean = route.replace(/^\/+/, '').replace(/\/+$/, '');
  return join(DIST_DIR, clean, 'index.html');
}

// Serve real asset files from disk; answer every other (navigation) request
// with the pristine in-memory app shell so React always boots from a clean
// container with <div id="root"> present.
function startStaticServer(shellHtml) {
  const assetServe = sirv(DIST_DIR, { dev: false, etag: false, single: false });
  const server = createServer((req, res) => {
    const path = (req.url || '/').split('?')[0];
    const isAsset = /\.[a-z0-9]+$/i.test(path) && !/\.html?$/i.test(path);
    if (isAsset) {
      assetServe(req, res, () => {
        res.statusCode = 404;
        res.end('not found');
      });
      return;
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(shellHtml);
  });
  return new Promise((resolvePromise) => {
    server.listen(PORT, '127.0.0.1', () => resolvePromise(server));
  });
}

async function prerenderRoute(browser, route) {
  const page = await browser.newPage();
  try {
    // Pre-seed the storage markers the app checks on load so the onboarding
    // welcome modal and signup popup never overlay the prerendered content.
    await page.evaluateOnNewDocument(() => {
      try {
        window.sessionStorage.setItem('hasSeenSignupModal', 'true');
        window.localStorage.setItem('onboarding_completed', 'true');
        window.localStorage.setItem('hasSeenOnboarding', 'true');
      } catch {
        // Storage may be unavailable in some contexts; rendering still proceeds.
      }
    });

    const url = `http://127.0.0.1:${PORT}${route}`;
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT_MS });
    } catch {
      // Navigation timing should not abort capture; the content wait below is
      // the real readiness gate.
    }

    // Wait until the route's actual content has rendered: the root container
    // exists, a non-empty <h1> is present, and no loading spinner remains.
    try {
      await page.waitForFunction(
        () => {
          const root = document.getElementById('root');
          if (!root || root.childElementCount === 0) return false;
          const heading = document.querySelector('main h1, h1');
          const hasHeading = !!heading && (heading.textContent || '').trim().length > 0;
          const spinning = document.querySelector('.animate-spin');
          return hasHeading && !spinning;
        },
        { timeout: CONTENT_TIMEOUT_MS, polling: 200 },
      );
    } catch {
      // Continue even if the gate is not satisfied; the failure is reported by
      // the caller via the post-capture content check.
    }

    // Give React 19 a brief moment to flush hoisted <head> metadata + JSON-LD.
    await new Promise((r) => setTimeout(r, SETTLE_MS));

    const result = await page.evaluate(() => {
      document
        .querySelectorAll('vite-error-overlay, #vite-error-overlay')
        .forEach((node) => node.remove());

      // The built shell ships fallback SEO tags; the page's own <Seo> appends
      // its (authoritative) tags later in <head>. Collapse each single-valued
      // tag to the LAST occurrence so every page has exactly one canonical,
      // title, description, and OG/Twitter pair.
      const keepLast = (selector) => {
        const els = Array.from(document.head.querySelectorAll(selector));
        els.slice(0, -1).forEach((el) => el.remove());
      };
      [
        'title',
        'link[rel="canonical"]',
        'meta[name="description"]',
        'meta[property="og:title"]',
        'meta[property="og:description"]',
        'meta[property="og:url"]',
        'meta[property="og:type"]',
        'meta[name="twitter:title"]',
        'meta[name="twitter:description"]',
        'meta[name="robots"]',
      ].forEach(keepLast);

      const root = document.getElementById('root');
      return {
        html: document.documentElement.outerHTML,
        hasRoot: !!root,
        rootChildren: root ? root.childElementCount : 0,
        ldCount: document.querySelectorAll('script[type="application/ld+json"]').length,
        h1: (document.querySelector('main h1, h1')?.textContent || '').trim().slice(0, 80),
      };
    });

    const out = `<!DOCTYPE html>\n${result.html}`;
    const outPath = outputPathFor(route);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, out, 'utf8');

    const healthy = result.hasRoot && result.rootChildren > 0 && result.h1.length > 0;
    const tag = healthy ? 'ok  ' : 'WEAK';
    process.stdout.write(
      `  ${tag} ${route} -> ld+json:${result.ldCount} h1:"${result.h1}"\n`,
    );
    return { ok: true, healthy };
  } catch (error) {
    process.stdout.write(`  fail ${route}: ${error?.message ?? error}\n`);
    return { ok: false, healthy: false };
  } finally {
    await page.close().catch(() => {});
  }
}

async function main() {
  const routes = allPublicRoutes();
  process.stdout.write(`Prerendering ${routes.length} route(s) from ${DIST_DIR}\n`);

  // Read the pristine app shell BEFORE any snapshot is written to dist.
  const shellHtml = readFileSync(join(DIST_DIR, 'index.html'), 'utf8');

  const server = await startStaticServer(shellHtml);
  let browser;
  let rootFailed = false;
  const weak = [];
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    for (const route of routes) {
      const res = await prerenderRoute(browser, route);
      if (route === '/' && (!res.ok || !res.healthy)) rootFailed = true;
      if (res.ok && !res.healthy) weak.push(route);
    }
  } finally {
    await browser?.close().catch(() => {});
    await new Promise((resolvePromise) => server.close(() => resolvePromise()));
  }

  if (weak.length) {
    process.stdout.write(
      `\nWARNING: ${weak.length} route(s) captured without full content: ${weak.join(', ')}\n`,
    );
  }

  if (rootFailed) {
    process.stdout.write('Prerender failed for "/" — aborting build.\n');
    process.exit(1);
  }
  process.stdout.write('Prerender complete.\n');
}

main().catch((error) => {
  process.stderr.write(`Prerender error: ${error?.stack ?? error}\n`);
  process.exit(1);
});
