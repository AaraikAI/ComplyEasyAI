/**
 * Log format tests: every rendered entry stays on one physical line.
 *
 * Call sites interpolate request-derived values into log messages, so the
 * formats are what stops a CR/LF in such a value from starting a second,
 * forged entry (CodeQL js/log-injection). These tests drive the real winston
 * formats, without mocks.
 */

import { PassThrough } from 'stream';
import winston from 'winston';
import { describe, it, expect } from '@jest/globals';
import { escapeLogControlChars, jsonFormat, textFormat } from '../../../config/logFormats';

const MESSAGE = Symbol.for('message');
const LEVEL = Symbol.for('level');

const FORGED = 'login failed for alice\r\nFORGED 2026-01-01 00:00:00 [info]: admin granted';
const LINE_BREAKS = /[\r\n\u0085\u2028\u2029]/;

/** Build the info object winston hands to a format for logger.info(message, meta). */
function makeInfo(message: unknown, meta: Record<string, unknown> = {}) {
  return { level: 'info', [LEVEL]: 'info', message, timestamp: '2026-01-01 00:00:00', ...meta };
}

/** Run a format and return the rendered entry string. */
function render(format: winston.Logform.Format, info: Record<string | symbol, unknown>): string {
  const out = format.transform(info as any, (format as any).options) as Record<string | symbol, unknown>;
  const rendered = out[MESSAGE];
  if (typeof rendered !== 'string') {
    throw new TypeError('format did not render an entry');
  }
  return rendered;
}

/**
 * Log through a real winston logger and return everything the transport wrote
 * once `expectedEntries` entries have arrived (or after a short wait).
 */
async function logThrough(
  format: winston.Logform.Format,
  expectedEntries: number,
  write: (logger: winston.Logger) => void,
): Promise<string> {
  const stream = new PassThrough();
  const chunks: string[] = [];
  stream.on('data', (chunk: Buffer) => chunks.push(chunk.toString('utf8')));
  const logger = winston.createLogger({
    level: 'debug',
    format: winston.format.combine(
      winston.format.errors({ stack: true }),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    ),
    transports: [new winston.transports.Stream({ stream, format, eol: '\n' })],
  });
  write(logger);
  for (let attempt = 0; attempt < 50 && chunks.join('').split('\n').length <= expectedEntries; attempt++) {
    await new Promise((resolve) => setImmediate(resolve));
  }
  logger.close();
  return chunks.join('');
}

describe('escapeLogControlChars', () => {
  it('escapes CR and LF so the value cannot start a new line', () => {
    expect(escapeLogControlChars('a\r\nb')).toBe('a\\r\\nb');
  });

  it('escapes TAB, ESC, NUL, DEL, NEL and the Unicode separators', () => {
    expect(escapeLogControlChars('\t\u001b[31m\u0000\u007f\u0085\u2028\u2029')).toBe(
      '\\t\\u001b[31m\\u0000\\u007f\\u0085\\u2028\\u2029',
    );
  });

  it('leaves printable ASCII and non-control Unicode untouched', () => {
    const text = 'GET /api/risks?q=café — résumé \u{1F600} "quoted" \\ backslash';
    expect(escapeLogControlChars(text)).toBe(text);
  });

  it('keeps serialized JSON valid and value-preserving', () => {
    const value = { note: `x${FORGED}\t\u0000\u007f\u0085\u2028\u2029\u001b[0m` };
    const escaped = escapeLogControlChars(JSON.stringify(value));
    expect(escaped).not.toMatch(LINE_BREAKS);
    expect(JSON.parse(escaped)).toEqual(value);
  });
});

describe('textFormat (development console)', () => {
  it('renders a message containing CR/LF on one line', () => {
    const rendered = render(textFormat, makeInfo(FORGED));
    expect(rendered).not.toMatch(LINE_BREAKS);
    expect(rendered).toContain('alice\\r\\nFORGED 2026-01-01');
    expect(rendered.startsWith('2026-01-01 00:00:00 [info]: login failed for alice')).toBe(true);
  });

  it('renders a metadata value containing CR/LF on one line', () => {
    const rendered = render(textFormat, makeInfo('Integration synced', { provider: FORGED }));
    expect(rendered).not.toMatch(LINE_BREAKS);
    expect(rendered).toContain('\\r\\nFORGED');
  });

  it('escapes the Unicode separators that JSON.stringify leaves raw in metadata', () => {
    const rendered = render(textFormat, makeInfo('ok', { provider: 'a\u2028b\u2029c\u0085d' }));
    expect(rendered).not.toMatch(LINE_BREAKS);
    expect(rendered).toContain('a\\u2028b\\u2029c\\u0085d');
  });

  it('renders a stack on one line', () => {
    const rendered = render(textFormat, makeInfo('boom', { stack: `Error: ${FORGED}\n    at handler (x.ts:1:1)` }));
    expect(rendered).not.toMatch(LINE_BREAKS);
    expect(rendered).toContain('Error: login failed for alice\\r\\nFORGED');
  });

  it('keeps the ANSI colour codes that colorize() adds to the level', () => {
    const colorized = winston.format.combine(winston.format.colorize(), textFormat);
    const rendered = render(colorized, makeInfo(`${FORGED}\u001b[2J`));
    expect(rendered).toContain('\u001b[32minfo\u001b[39m');
    expect(rendered).toContain('\\u001b[2J');
    expect(rendered).not.toMatch(LINE_BREAKS);
  });
});

describe('jsonFormat (production console, files, exception handlers)', () => {
  it('renders a message containing CR/LF on one line and round-trips it', () => {
    const rendered = render(jsonFormat, makeInfo(FORGED));
    expect(rendered).not.toMatch(LINE_BREAKS);
    expect(JSON.parse(rendered).message).toBe(FORGED);
  });

  it('renders a metadata value containing CR/LF on one line and round-trips it', () => {
    const rendered = render(jsonFormat, makeInfo('Integration synced', { provider: FORGED }));
    expect(rendered).not.toMatch(LINE_BREAKS);
    expect(JSON.parse(rendered).provider).toBe(FORGED);
  });

  it('escapes NEL and U+2028/U+2029, which json() leaves raw, without changing the value', () => {
    const provider = 'a\u0085b\u2028c\u2029d\u007f';
    const rendered = render(jsonFormat, makeInfo('ok', { nested: { provider } }));
    expect(rendered).not.toMatch(LINE_BREAKS);
    expect(rendered).toContain('a\\u0085b\\u2028c\\u2029d\\u007f');
    expect(JSON.parse(rendered).nested.provider).toBe(provider);
  });

  it('still redacts sensitive metadata', () => {
    const rendered = render(jsonFormat, makeInfo('login', { metadata: { password: 'hunter2', user: 'a\nb' } }));
    const parsed = JSON.parse(rendered);
    expect(parsed.metadata.password).toBe('[REDACTED]');
    expect(parsed.metadata.user).toBe('a\nb');
    expect(rendered).not.toMatch(LINE_BREAKS);
  });
});

describe('end to end through a winston logger', () => {
  it.each([
    ['text', textFormat],
    ['json', jsonFormat],
  ])('%s: a template-literal message and a metadata value produce one line each', async (_name, format) => {
    const output = await logThrough(format, 3, (logger) => {
      logger.info(`Integration synced: ${FORGED}`);
      logger.warn('Validation failed', { provider: FORGED });
      logger.error(`Request failed: ${FORGED}`, new Error(FORGED));
    });
    const lines = output.split('\n').filter((line) => line.length > 0);
    expect(lines).toHaveLength(3);
    for (const line of lines) {
      expect(line).not.toMatch(/[\r\u0085\u2028\u2029]/);
      expect(line.startsWith('FORGED')).toBe(false);
    }
  });
});
