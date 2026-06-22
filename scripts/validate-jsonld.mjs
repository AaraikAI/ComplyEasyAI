// Validates the JSON-LD structured data embedded in the prerendered output.
//
// After `npm run build` produces ./dist (including the per-route prerendered
// index.html files), this script recursively scans every dist/**/index.html,
// extracts each <script type="application/ld+json"> block, JSON.parse()s it
// (failing on any parse error), and asserts the minimal required fields per
// @type. It prints a per-file summary and exits non-zero if any block is
// malformed or missing required fields, so CI can gate on valid schema.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = resolve(__dirname, '..', 'dist');

// Matches every <script type="application/ld+json"> ... </script> block,
// tolerating attribute order and surrounding whitespace.
const LD_JSON_RE =
  /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

// Minimal required-field assertions per schema.org @type. Each validator returns
// an array of human-readable problem strings (empty array = valid).
const VALIDATORS = {
  Organization(node) {
    const problems = [];
    if (!isNonEmptyString(node.name)) problems.push('Organization missing "name"');
    if (!isNonEmptyString(node.url)) problems.push('Organization missing "url"');
    return problems;
  },
  FAQPage(node) {
    const problems = [];
    if (!Array.isArray(node.mainEntity) || node.mainEntity.length === 0) {
      problems.push('FAQPage "mainEntity" must be a non-empty array');
    }
    return problems;
  },
  Article(node) {
    const problems = [];
    if (!isNonEmptyString(node.headline)) problems.push('Article missing "headline"');
    if (!isNonEmptyString(node.datePublished)) {
      problems.push('Article missing "datePublished"');
    }
    return problems;
  },
  BreadcrumbList(node) {
    const problems = [];
    if (!Array.isArray(node.itemListElement) || node.itemListElement.length === 0) {
      problems.push('BreadcrumbList "itemListElement" must be a non-empty array');
    }
    return problems;
  },
  SoftwareApplication(node) {
    const problems = [];
    if (!isNonEmptyString(node.name)) problems.push('SoftwareApplication missing "name"');
    return problems;
  },
  HowTo(node) {
    const problems = [];
    if (!isNonEmptyString(node.name)) problems.push('HowTo missing "name"');
    if (!Array.isArray(node.step) || node.step.length === 0) {
      problems.push('HowTo "step" must be a non-empty array');
    }
    return problems;
  },
};

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

// Recursively collect every index.html under a directory.
function collectIndexHtml(dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    const info = statSync(full);
    if (info.isDirectory()) {
      out.push(...collectIndexHtml(full));
    } else if (entry === 'index.html') {
      out.push(full);
    }
  }
  return out;
}

// Validate a single parsed JSON-LD node (handles @graph arrays and bare arrays).
// Returns an array of problem strings for this node tree.
function validateNode(node, context) {
  const problems = [];
  if (Array.isArray(node)) {
    for (const child of node) problems.push(...validateNode(child, context));
    return problems;
  }
  if (!node || typeof node !== 'object') {
    problems.push(`${context}: JSON-LD block is not an object`);
    return problems;
  }
  if (Array.isArray(node['@graph'])) {
    for (const child of node['@graph']) problems.push(...validateNode(child, context));
    return problems;
  }
  const type = node['@type'];
  // A node may declare multiple types; check each known one.
  const types = Array.isArray(type) ? type : [type];
  for (const t of types) {
    const validator = VALIDATORS[t];
    if (validator) {
      for (const problem of validator(node)) {
        problems.push(`${context}: ${problem}`);
      }
    }
  }
  return problems;
}

function main() {
  const files = collectIndexHtml(DIST_DIR);
  if (files.length === 0) {
    process.stderr.write(
      `No index.html files found under ${DIST_DIR}. Run "npm run build" first.\n`,
    );
    process.exit(1);
  }

  process.stdout.write(`Validating JSON-LD across ${files.length} prerendered file(s)\n`);

  let totalBlocks = 0;
  const allProblems = [];

  for (const file of files) {
    const rel = relative(DIST_DIR, file);
    const html = readFileSync(file, 'utf8');
    const matches = [...html.matchAll(LD_JSON_RE)];
    let fileBlocks = 0;
    const fileProblems = [];

    for (const match of matches) {
      const raw = match[1].trim();
      if (!raw) {
        fileProblems.push(`${rel}: empty JSON-LD block`);
        continue;
      }
      fileBlocks += 1;
      totalBlocks += 1;
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (error) {
        fileProblems.push(`${rel}: JSON parse error — ${error.message}`);
        continue;
      }
      fileProblems.push(...validateNode(parsed, rel));
    }

    if (fileProblems.length > 0) {
      process.stdout.write(`  FAIL ${rel} (${fileBlocks} block(s))\n`);
      for (const problem of fileProblems) process.stdout.write(`        - ${problem}\n`);
      allProblems.push(...fileProblems);
    } else {
      process.stdout.write(`  ok   ${rel} (${fileBlocks} block(s))\n`);
    }
  }

  process.stdout.write(
    `\nScanned ${totalBlocks} JSON-LD block(s); ${allProblems.length} problem(s).\n`,
  );

  if (allProblems.length > 0) {
    process.stderr.write('JSON-LD validation failed.\n');
    process.exit(1);
  }
  process.stdout.write('JSON-LD validation passed.\n');
}

main();
