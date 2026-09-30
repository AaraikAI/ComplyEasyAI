// Renders the default social card (public/og/default-og.svg) to the 1200x630
// PNG that og:image and twitter:image point at (public/og/default-og.png).
// LinkedIn, X and Facebook do not render SVG share images, so the PNG is the
// published asset and the SVG is its editable source.
//
// Run after editing the SVG:  node scripts/render-og-image.mjs
//
// The card's fonts (Space Grotesk, IBM Plex Mono) are loaded from Google Fonts
// when the network allows; otherwise the SVG's system-font fallbacks are used.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SVG_PATH = resolve(__dirname, '..', 'public', 'og', 'default-og.svg');
const PNG_PATH = resolve(__dirname, '..', 'public', 'og', 'default-og.png');
const WIDTH = 1200;
const HEIGHT = 630;

const FONTS_CSS =
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&family=IBM+Plex+Mono:wght@400;500&display=block';

async function main() {
  // Embed from the <svg> element onwards; the file's leading comment header is
  // not part of the rendered card.
  const source = readFileSync(SVG_PATH, 'utf8');
  const svgStart = source.indexOf('<svg');
  if (svgStart === -1) throw new Error(`No <svg> element in ${SVG_PATH}`);
  const svg = source.slice(svgStart);
  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="${FONTS_CSS}" />
    <style>html,body{margin:0;padding:0;background:#07090D}svg{display:block}</style>
  </head>
  <body>${svg}</body>
</html>`;

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 }).catch((error) => {
      console.warn(`Fonts did not finish loading (${error.message}); rendering with fallbacks.`);
    });
    await page.evaluate(() => document.fonts.ready);
    const png = await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
    });
    writeFileSync(PNG_PATH, png);
    console.log(`Wrote ${PNG_PATH} (${WIDTH}x${HEIGHT}, ${png.length} bytes)`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
