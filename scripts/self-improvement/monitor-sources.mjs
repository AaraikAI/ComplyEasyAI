// Framework-amendment monitor (deterministic, no LLM).
//
// Fetches every source in sources.json, reduces each page to normalized visible
// text, hashes it, and compares against the last-seen hash in
// scripts/self-improvement/state/<id>.sha. A changed (or first-seen) hash is
// reported as a "change" for human review — it does NOT itself decide a standard
// was amended; it flags the page for a look (and feeds the compliance agent).
//
// Outputs (written to the path given by --out, default ./self-improvement-report):
//   monitor-report.json  — machine-readable: { changed: [...], unchanged, errors }
//   monitor-report.md    — human summary used as the GitHub issue body
//
// State files under state/ are updated in place so the NEXT run diffs against
// THIS run. The workflow commits the updated state so change detection is
// stateful across runs.
//
// Usage: node scripts/self-improvement/monitor-sources.mjs [--out <dir>] [--update-state]

/* global AbortController */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCES_PATH = join(__dirname, 'sources.json');
const STATE_DIR = join(__dirname, 'state');
const FETCH_TIMEOUT_MS = 30000;
const USER_AGENT =
  'ComplyEasyAI-framework-monitor/1.0 (+https://github.com/AaraikAI/ComplyEasyAI; compliance standard change detection)';

// The monitor must only ever reach the known public standards-body hosts. URLs
// come from sources.json (a committed config file); constraining outbound
// requests to this explicit allowlist over HTTPS prevents the fetcher from being
// repurposed for SSRF / data exfiltration if that file is ever modified, and is
// the sanitizing barrier between file-sourced data and the network. Adding a new
// source requires adding its host here on purpose.
const ALLOWED_HOSTS = new Set([
  'eur-lex.europa.eu',
  'www.nist.gov',
  'www.hhs.gov',
  'www.pcisecuritystandards.org',
  'www.iso.org',
  'www.aicpa-cima.com',
]);

// Validate a source URL and return a safe absolute https URL, or throw. Only the
// allowlisted hosts over https are permitted; everything else (other schemes,
// other hosts, private/loopback addresses) is rejected before any network call.
function assertAllowedUrl(raw) {
  let u;
  try {
    u = new URL(String(raw));
  } catch {
    throw new Error('malformed URL');
  }
  if (u.protocol !== 'https:') throw new Error(`blocked non-https scheme: ${u.protocol}`);
  const host = u.hostname.toLowerCase();
  if (!ALLOWED_HOSTS.has(host)) throw new Error(`host not in allowlist: ${host}`);
  return `https://${host}${u.pathname}${u.search}`;
}

function parseArgs(argv) {
  const out = { outDir: resolve(process.cwd(), 'self-improvement-report'), updateState: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--out') out.outDir = resolve(argv[++i]);
    else if (argv[i] === '--update-state') out.updateState = true;
  }
  return out;
}

// Reduce raw HTML to a stable, content-only fingerprint: drop scripts/styles/
// comments, strip tags, decode a few common entities, remove obviously volatile
// tokens (long digit runs, ISO timestamps, nonces/csrf-ish hex), and collapse
// whitespace. This is intentionally conservative — better an occasional false
// "changed" (a human glances at it) than a missed amendment.
function normalize(html) {
  let text = html
    // Drop the contents of script/style/noscript. End tags allow trailing
    // whitespace (</script >, </style\n>) so the blocks are fully removed.
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style\s*>/gi, ' ')
    .replace(/<noscript\b[\s\S]*?<\/noscript\s*>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    // Collapse ALL HTML entities to a space in a SINGLE pass. We never chain
    // partial decodes (e.g. &amp; -> &), which could double-unescape sequences
    // like &amp;lt; into <. For a content fingerprint the exact decoded value is
    // irrelevant — only stable, injection-free normalization matters.
    .replace(/&(?:#\d+|#x[0-9a-f]+|[a-z][a-z0-9]*);/gi, ' ');
  text = text
    // Volatile patterns that change every request but carry no meaning.
    .replace(/\b[0-9a-f]{16,}\b/gi, '') // long hex (nonces, csrf, build ids)
    .replace(/\d{4}-\d{2}-\d{2}T[\d:.]+Z?/g, '') // ISO timestamps
    .replace(/\b\d{6,}\b/g, '') // long digit runs (cache busters)
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  return text;
}

async function fetchSource(url) {
  // Sanitize file-sourced URL against the host allowlist BEFORE any network call.
  let safeUrl;
  try {
    safeUrl = assertAllowedUrl(url);
  } catch (err) {
    return { ok: false, error: `rejected URL (${String(err?.message || err)})` };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(safeUrl, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml' },
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const body = await res.text();
    return { ok: true, body };
  } catch (err) {
    return { ok: false, error: err?.name === 'AbortError' ? 'timeout' : String(err?.message || err) };
  } finally {
    clearTimeout(timer);
  }
}

function readState(id) {
  const p = join(STATE_DIR, `${id}.sha`);
  return existsSync(p) ? readFileSync(p, 'utf8').trim() : null;
}

function writeState(id, sha) {
  if (!existsSync(STATE_DIR)) mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(join(STATE_DIR, `${id}.sha`), sha + '\n');
}

async function main() {
  const { outDir, updateState } = parseArgs(process.argv.slice(2));
  const { sources } = JSON.parse(readFileSync(SOURCES_PATH, 'utf8'));

  const changed = [];
  const unchanged = [];
  const errors = [];

  for (const src of sources) {
    const r = await fetchSource(src.url);
    if (!r.ok) {
      errors.push({ id: src.id, name: src.name, url: src.url, error: r.error });
      continue;
    }
    const sha = createHash('sha256').update(normalize(r.body)).digest('hex');
    const prev = readState(src.id);
    if (prev === null) {
      // First sighting — record baseline, don't raise a change (no signal yet).
      if (updateState) writeState(src.id, sha);
      unchanged.push({ id: src.id, name: src.name, firstSeen: true });
    } else if (prev !== sha) {
      changed.push({
        id: src.id,
        name: src.name,
        framework: src.framework,
        type: src.type,
        url: src.url,
        note: src.note || '',
        previousSha: prev.slice(0, 12),
        currentSha: sha.slice(0, 12),
      });
      if (updateState) writeState(src.id, sha);
    } else {
      unchanged.push({ id: src.id, name: src.name });
    }
  }

  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const report = { generatedAt: new Date().toISOString(), changed, unchanged, errors };
  writeFileSync(join(outDir, 'monitor-report.json'), JSON.stringify(report, null, 2));

  const md = buildMarkdown(report);
  writeFileSync(join(outDir, 'monitor-report.md'), md);

  // Expose a simple boolean for the workflow's conditional steps.
  process.stdout.write(`changed_count=${changed.length}\n`);
  process.exit(0);
}

function buildMarkdown({ generatedAt, changed, unchanged, errors }) {
  const lines = [];
  lines.push(`## Framework / regulation monitor — ${changed.length} change(s) detected`);
  lines.push('');
  lines.push(`_Run: ${generatedAt}_`);
  lines.push('');
  if (changed.length) {
    lines.push('### Changed sources (review for amendments)');
    lines.push('');
    for (const c of changed) {
      lines.push(`- **${c.name}** (${c.framework}) — [source](${c.url})`);
      if (c.note) lines.push(`  - ${c.note}`);
      lines.push(`  - hash ${c.previousSha} → ${c.currentSha}`);
    }
    lines.push('');
    lines.push(
      '> A changed hash means the page content shifted — it may be a real amendment, a new ' +
        'version, or just an editorial/layout change. Confirm against the official changelog ' +
        'before updating framework definitions.',
    );
  } else {
    lines.push('No content changes detected since the last run.');
  }
  if (errors.length) {
    lines.push('');
    lines.push('### Sources that could not be fetched');
    lines.push('');
    for (const e of errors) lines.push(`- ${e.name} — ${e.error} ([url](${e.url}))`);
  }
  lines.push('');
  lines.push(`<sub>Watched ${changed.length + unchanged.length + errors.length} sources.</sub>`);
  return lines.join('\n');
}

main().catch((err) => {
  process.stderr.write(`monitor-sources failed: ${err?.stack || err}\n`);
  process.exit(1);
});
