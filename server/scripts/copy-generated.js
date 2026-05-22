#!/usr/bin/env node
/**
 * Post-build helper: copy non-TS generated artifacts from `src/` into `dist/`
 * so the compiled server can require them at runtime.
 *
 * tsc skips `.js` files when allowJs is false. The Prisma generator emits
 * `src/generated/prisma/client/*.{js,d.ts,json}` — these need to be present
 * at `dist/generated/prisma/client/` for `require('../generated/prisma/client')`
 * inside `dist/config/database.js` to resolve.
 *
 * This script is idempotent and safe to re-run.
 */
const fs = require('fs');
const path = require('path');

const SRC_ROOT = path.resolve(__dirname, '..', 'src');
const DIST_ROOT = path.resolve(__dirname, '..', 'dist');

const COPY_DIRS = [
  // Prisma generated client (mandatory for runtime require)
  'generated',
];

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return false;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
    return true;
  }
  fs.copyFileSync(src, dest);
  return true;
}

let copied = 0;
for (const dir of COPY_DIRS) {
  const from = path.join(SRC_ROOT, dir);
  const to = path.join(DIST_ROOT, dir);
  if (copyRecursive(from, to)) {
    copied++;
    process.stdout.write(`[copy-generated] copied ${dir}/ -> dist/${dir}/\n`);
  } else {
    process.stdout.write(`[copy-generated] (skipped, not present) ${dir}/\n`);
  }
}

if (copied === 0) {
  process.stderr.write('[copy-generated] WARNING: nothing copied — Prisma client may be missing at runtime\n');
  process.exit(0);
}
