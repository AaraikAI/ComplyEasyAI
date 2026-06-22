// Dependency-audit reporter for the CVE self-healing loop (deterministic).
//
// Runs `npm audit --json` in each workspace that has a lockfile, classifies every
// advisory as auto-fixable (a non-breaking fix exists; npm can apply it without a
// semver-major bump) or breaking (the only fix is a major upgrade — needs human
// review), and writes:
//   audit-report.json — { totals, autoFixable: [...], breaking: [...] }
//   audit-report.md   — human summary (issue/PR body)
//
// It does NOT modify anything; the workflow decides what to apply. Exit code is
// always 0 (a found vuln is data, not a script failure).
//
// Usage: node scripts/self-improvement/audit-report.mjs [--out <dir>]

import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const WORKSPACES = [
  { name: 'root', dir: '.' },
  { name: 'server', dir: 'server' },
  { name: 'mobile', dir: 'mobile' },
];

function parseArgs(argv) {
  const out = { outDir: resolve(process.cwd(), 'self-improvement-report') };
  for (let i = 0; i < argv.length; i++) if (argv[i] === '--out') out.outDir = resolve(argv[++i]);
  return out;
}

function runAudit(dir) {
  try {
    const stdout = execFileSync('npm', ['audit', '--json'], {
      cwd: resolve(process.cwd(), dir),
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return JSON.parse(stdout);
  } catch (err) {
    // `npm audit` exits non-zero when vulnerabilities exist; the JSON is still on
    // stdout. Only a parse failure or missing lockfile is a real error.
    if (err?.stdout) {
      try {
        return JSON.parse(err.stdout.toString());
      } catch {
        /* fall through */
      }
    }
    return { __error: String(err?.message || err) };
  }
}

function classify(workspace, audit) {
  const autoFixable = [];
  const breaking = [];
  const vulns = audit?.vulnerabilities || {};
  for (const [name, v] of Object.entries(vulns)) {
    const fa = v.fixAvailable;
    const entry = {
      workspace,
      name,
      severity: v.severity,
      range: v.range,
      advisories: (v.via || [])
        .filter((x) => typeof x === 'object')
        .map((x) => ({ title: x.title, url: x.url })),
    };
    if (fa === true) {
      autoFixable.push(entry);
    } else if (fa && typeof fa === 'object') {
      if (fa.isSemVerMajor) breaking.push({ ...entry, fixTo: `${fa.name}@${fa.version}`, major: true });
      else autoFixable.push({ ...entry, fixTo: `${fa.name}@${fa.version}` });
    } else {
      breaking.push({ ...entry, fixTo: null, major: false, noFix: true });
    }
  }
  return { autoFixable, breaking };
}

function severityRank(s) {
  return { critical: 0, high: 1, moderate: 2, low: 3, info: 4 }[s] ?? 5;
}

function main() {
  const { outDir } = parseArgs(process.argv.slice(2));
  const totals = { critical: 0, high: 0, moderate: 0, low: 0 };
  const autoFixable = [];
  const breaking = [];
  const workspaceErrors = [];

  for (const ws of WORKSPACES) {
    if (!existsSync(join(resolve(process.cwd(), ws.dir), 'package.json'))) continue;
    const audit = runAudit(ws.dir);
    if (audit.__error) {
      workspaceErrors.push({ workspace: ws.name, error: audit.__error });
      continue;
    }
    const meta = audit?.metadata?.vulnerabilities || {};
    for (const k of Object.keys(totals)) totals[k] += meta[k] || 0;
    const { autoFixable: af, breaking: br } = classify(ws.name, audit);
    autoFixable.push(...af);
    breaking.push(...br);
  }

  autoFixable.sort((a, b) => severityRank(a.severity) - severityRank(b.severity));
  breaking.sort((a, b) => severityRank(a.severity) - severityRank(b.severity));

  const report = {
    generatedAt: new Date().toISOString(),
    totals,
    autoFixableCount: autoFixable.length,
    breakingCount: breaking.length,
    autoFixable,
    breaking,
    workspaceErrors,
  };

  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'audit-report.json'), JSON.stringify(report, null, 2));
  writeFileSync(join(outDir, 'audit-report.md'), buildMarkdown(report));

  process.stdout.write(`auto_fixable=${autoFixable.length}\n`);
  process.stdout.write(`breaking=${breaking.length}\n`);
  process.stdout.write(
    `total_high_plus=${totals.critical + totals.high}\n`,
  );
  process.exit(0);
}

function buildMarkdown({ generatedAt, totals, autoFixable, breaking, workspaceErrors }) {
  const lines = [];
  lines.push('## Dependency audit');
  lines.push('');
  lines.push(
    `_Run: ${generatedAt}_ — critical: ${totals.critical}, high: ${totals.high}, moderate: ${totals.moderate}, low: ${totals.low}`,
  );
  lines.push('');
  if (autoFixable.length) {
    lines.push(`### Auto-fixable (non-breaking) — ${autoFixable.length}`);
    lines.push('');
    lines.push('These are applied by `npm audit fix` and, if the full CI pipeline passes, auto-merged.');
    lines.push('');
    for (const a of autoFixable) {
      lines.push(`- \`${a.name}\` (${a.workspace}, ${a.severity})${a.fixTo ? ` → ${a.fixTo}` : ''}`);
    }
    lines.push('');
  }
  if (breaking.length) {
    lines.push(`### Needs human review (breaking / no clean fix) — ${breaking.length}`);
    lines.push('');
    for (const b of breaking) {
      const how = b.noFix ? 'no fix published yet' : b.fixTo ? `requires ${b.fixTo} (major)` : 'major upgrade';
      lines.push(`- \`${b.name}\` (${b.workspace}, ${b.severity}) — ${how}`);
      for (const adv of b.advisories.slice(0, 2)) if (adv.title) lines.push(`  - ${adv.title}`);
    }
    lines.push('');
  }
  if (!autoFixable.length && !breaking.length) lines.push('No actionable advisories. 🎉');
  if (workspaceErrors.length) {
    lines.push('### Workspaces skipped');
    for (const e of workspaceErrors) lines.push(`- ${e.workspace}: ${e.error}`);
  }
  return lines.join('\n');
}

main();
