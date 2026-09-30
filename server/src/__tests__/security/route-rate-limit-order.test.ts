/**
 * Route rate-limit ordering guard.
 *
 * Every router in `src/index.ts` is protected by a limiter passed at the mount
 * (`app.use('/api/x', apiLimiter, xRoutes)`); there is no app-wide limiter. A
 * limiter only budgets the middleware that runs AFTER it, so two invariants are
 * checked against the real source of `src/index.ts`:
 *
 *   1. every `/api/*` router mount lists a limiter before the router, and
 *   2. every app-level route that runs `authenticate` lists a limiter BEFORE
 *      `authenticate` — otherwise JWT verification, the revocation lookup and
 *      the user query run unbudgeted, and requests that fail authentication
 *      never count towards the limit at all.
 *
 * The limiter names are read from the exports of `middleware/rateLimiter.ts`,
 * so a new limiter is recognised without editing this test.
 */

import { describe, it, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';

const SERVER_SRC = path.resolve(__dirname, '../..');
const INDEX_SOURCE = fs.readFileSync(path.join(SERVER_SRC, 'index.ts'), 'utf8');
const LIMITER_SOURCE = fs.readFileSync(path.join(SERVER_SRC, 'middleware/rateLimiter.ts'), 'utf8');

const LIMITERS: ReadonlySet<string> = new Set(
  Array.from(LIMITER_SOURCE.matchAll(/^export const (\w+Limiter)\b/gm), (m) => m[1]),
);

interface AppCall {
  method: string;
  line: number;
  args: string[];
}

/**
 * Read the argument list of a call whose opening parenthesis sits just before
 * `start`, skipping string literals and comments, and split it on top-level
 * commas.
 */
function readArgs(source: string, start: number): string[] {
  const args: string[] = [];
  let depth = 1;
  let current = '';
  let i = start;
  while (i < source.length) {
    const ch = source[i];
    const next = source[i + 1];
    if (ch === '/' && next === '/') {
      const eol = source.indexOf('\n', i);
      i = eol === -1 ? source.length : eol;
      continue;
    }
    if (ch === '/' && next === '*') {
      const close = source.indexOf('*/', i + 2);
      i = close === -1 ? source.length : close + 2;
      continue;
    }
    if (ch === '\'' || ch === '"' || ch === '`') {
      let j = i + 1;
      while (j < source.length && source[j] !== ch) j += source[j] === '\\' ? 2 : 1;
      current += source.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    if (ch === '(' || ch === '{' || ch === '[') depth += 1;
    if (ch === ')' || ch === '}' || ch === ']') {
      depth -= 1;
      if (depth === 0) break;
    }
    if (ch === ',' && depth === 1) {
      args.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
    i += 1;
  }
  if (current.trim()) args.push(current.trim());
  return args;
}

/** Extract every top-level `app.<method>(...)` call with its arguments. */
function parseAppCalls(source: string): AppCall[] {
  const calls: AppCall[] = [];
  const opener = /^[ \t]*app\.(use|get|post|put|patch|delete|all)\(/gm;
  let match: RegExpExecArray | null;
  while ((match = opener.exec(source)) !== null) {
    calls.push({
      method: match[1],
      line: source.slice(0, match.index).split('\n').length,
      args: readArgs(source, match.index + match[0].length),
    });
  }
  return calls;
}

function pathOf(call: AppCall): string | null {
  const literal = /^['"`]([^'"`]*)['"`]$/.exec(call.args[0] ?? '');
  return literal ? literal[1] : null;
}

function firstLimiterIndex(call: AppCall): number {
  return call.args.findIndex((arg) => LIMITERS.has(arg));
}

/** Routes whose chain runs `authenticate` before any limiter. */
function authenticatedBeforeLimited(calls: AppCall[]): AppCall[] {
  return calls.filter((call) => {
    const authIndex = call.args.indexOf('authenticate');
    if (authIndex === -1) return false;
    const limiterIndex = firstLimiterIndex(call);
    return limiterIndex === -1 || limiterIndex > authIndex;
  });
}

/** `/api/*` router mounts that carry no limiter ahead of the router. */
function unlimitedRouterMounts(calls: AppCall[]): AppCall[] {
  return calls.filter((call) => {
    if (call.method !== 'use') return false;
    const mountPath = pathOf(call);
    if (!mountPath || !mountPath.startsWith('/api/')) return false;
    const router = call.args[call.args.length - 1] ?? '';
    if (!/^\w+(Routes|Router)$/.test(router)) return false;
    return firstLimiterIndex(call) === -1;
  });
}

const describeCall = (call: AppCall): string =>
  `index.ts:${call.line} app.${call.method}(${call.args.join(', ')})`;

describe('Route rate-limit ordering (src/index.ts)', () => {
  const calls = parseAppCalls(INDEX_SOURCE);

  it('reads the limiter exports and the app-level routes', () => {
    expect(LIMITERS.has('apiLimiter')).toBe(true);
    expect(LIMITERS.has('authLimiter')).toBe(true);
    const routerMounts = calls.filter(
      (call) => call.method === 'use' && /^\w+(Routes|Router)$/.test(call.args[call.args.length - 1] ?? ''),
    );
    // Floor so that a parsing regression cannot pass vacuously.
    expect(routerMounts.length).toBeGreaterThan(50);
  });

  it('puts a limiter in front of every /api router mount', () => {
    expect(unlimitedRouterMounts(calls).map(describeCall)).toEqual([]);
  });

  it('runs the limiter before authenticate on every app-level route', () => {
    expect(calls.filter((call) => call.args.includes('authenticate')).length).toBeGreaterThan(0);
    expect(authenticatedBeforeLimited(calls).map(describeCall)).toEqual([]);
  });

  it('rate-limits both GraphQL handlers ahead of authentication', () => {
    const graphql = calls.filter((call) => pathOf(call) === '/api/graphql');
    expect(graphql.map((call) => call.method).sort()).toEqual(['get', 'post']);
    for (const call of graphql) {
      expect(call.args.slice(1, 3)).toEqual(['apiLimiter', 'authenticate']);
    }
  });

  it('flags a chain that authenticates before it rate-limits', () => {
    const offending = parseAppCalls(
      [
        "app.post('/api/example', authenticate, apiLimiter, handler());",
        "app.get('/api/other', authenticate, handler()); // a comment, with (brackets)",
        "app.use('/api/items', itemRoutes);",
        "app.use('/api/ok', apiLimiter, okRoutes);",
        "app.use('/api/url', apiLimiter, cors({ origin: 'https://example.com' }), urlRoutes);",
      ].join('\n'),
    );
    expect(authenticatedBeforeLimited(offending).map(pathOf)).toEqual(['/api/example', '/api/other']);
    expect(unlimitedRouterMounts(offending).map(pathOf)).toEqual(['/api/items']);
    expect(offending[4].args).toEqual([
      "'/api/url'",
      'apiLimiter',
      "cors({ origin: 'https://example.com' })",
      'urlRoutes',
    ]);
  });
});
