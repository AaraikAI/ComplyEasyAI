/**
 * Patch Express 5 type definitions to narrow params and query types.
 *
 * Express 5 types `ParamsDictionary` as `{ [key: string]: string | string[] }`
 * and query values as `string | ParsedQs | (string | ParsedQs)[] | undefined`.
 *
 * Our API only uses simple `:param` patterns (never wildcard `*param`) so params
 * are always single strings. Similarly, our query parameters are always simple
 * strings. This script narrows both types to avoid hundreds of type assertions.
 *
 * This is run as part of `postinstall` after `npm install`.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

function patchFile(relPath, replacements) {
  const absPath = path.join(__dirname, '..', relPath);
  if (!fs.existsSync(absPath)) {
    console.warn(`[patch-express-types] Skipping missing file: ${relPath}`);
    return;
  }
  let content = fs.readFileSync(absPath, 'utf8');
  let changed = false;
  for (const [search, replace] of replacements) {
    if (content.includes(search)) {
      content = content.replace(search, replace);
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(absPath, content);
    console.log(`[patch-express-types] Patched: ${relPath}`);
  } else {
    console.log(`[patch-express-types] Already patched or pattern not found: ${relPath}`);
  }
}

// 1. Narrow ParamsDictionary from string | string[] to string
patchFile('node_modules/@types/express-serve-static-core/index.d.ts', [
  ['[key: string]: string | string[];', '[key: string]: string;'],
]);

// 2. Narrow ParsedQs from complex union to simple string | undefined
patchFile('node_modules/@types/qs/index.d.ts', [
  [
    '[key: string]: undefined | string | ParsedQs | (string | ParsedQs)[];',
    '[key: string]: string | undefined;',
  ],
]);

// 3. Self-heal @prisma/client runtime *.d.ts files when the package landed
// without them (happens on certain Prisma 7.x install paths). Without this,
// `prisma generate` fails ENOENT trying to copy the source d.ts.
function ensurePrismaRuntimeTypes() {
  const runtimeDir = path.join(__dirname, '..', 'node_modules/@prisma/client/runtime');
  if (!fs.existsSync(runtimeDir)) {
    console.log('[patch-prisma-types] @prisma/client not installed yet; skipping');
    return;
  }
  const required = ['client.d.ts', 'index-browser.d.ts', 'wasm-compiler-edge.d.ts'];
  const missing = required.filter((f) => !fs.existsSync(path.join(runtimeDir, f)));
  if (missing.length === 0) {
    console.log('[patch-prisma-types] runtime *.d.ts files present; nothing to do');
    return;
  }

  console.log(`[patch-prisma-types] Restoring missing runtime types: ${missing.join(', ')}`);
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'node_modules/@prisma/client/package.json'), 'utf8'));
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'prisma-restore-'));
  try {
    execSync(`npm pack @prisma/client@${pkg.version}`, { cwd: tmp, stdio: 'pipe' });
    const tgz = fs.readdirSync(tmp).find((f) => f.endsWith('.tgz'));
    if (!tgz) throw new Error('npm pack produced no tarball');
    execSync(`tar -xzf ${tgz} -C ${tmp}`, { cwd: tmp, stdio: 'pipe' });
    for (const f of missing) {
      const src = path.join(tmp, 'package/runtime', f);
      const dst = path.join(runtimeDir, f);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dst);
        console.log(`[patch-prisma-types] Restored: runtime/${f}`);
      } else {
        console.warn(`[patch-prisma-types] Tarball did not contain runtime/${f}`);
      }
    }
  } catch (error) {
    console.warn('[patch-prisma-types] Could not restore runtime types:', error.message);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

ensurePrismaRuntimeTypes();

console.log('[patch-express-types] Done.');
