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

console.log('[patch-express-types] Done.');
