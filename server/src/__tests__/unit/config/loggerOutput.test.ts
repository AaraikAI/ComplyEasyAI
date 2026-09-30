/**
 * End-to-end output of the real config/logger.ts.
 *
 * logger.test.ts checks which format each transport receives, and
 * logFormats.test.ts checks the formats in isolation. This file loads the real
 * logger with real winston and captures what the console transport writes, so
 * the wiring itself is covered: a CR/LF, NEL or U+2028/U+2029 in a logged value
 * must never start a second entry (CodeQL js/log-injection).
 */

import { PassThrough } from 'stream';
import { describe, it, expect, jest, afterEach } from '@jest/globals';

jest.mock('../../../config/index', () => ({
  __esModule: true,
  default: { logging: { level: 'debug' } },
}));

jest.mock('../../../config/elasticsearch', () => ({
  __esModule: true,
  default: { createElasticsearchTransport: () => null },
}));

// Built from char codes so the source file itself carries no raw separators.
const CR = String.fromCharCode(0x0d);
const LF = String.fromCharCode(0x0a);
const NEL = String.fromCharCode(0x85);
const LS = String.fromCharCode(0x2028);
const PS = String.fromCharCode(0x2029);
const ESC = String.fromCharCode(0x1b);

const FORGED = `alice${CR}${LF}FORGED 2026-01-01 00:00:00 [info]: admin granted${NEL}FORGED2${LS}FORGED3${PS}FORGED4${ESC}[2J`;

/** Characters that some sink or viewer treats as a line break. */
function containsLineBreak(line: string): boolean {
  return [CR, NEL, LS, PS].some((ch) => line.includes(ch));
}

/**
 * Load a fresh copy of the logger under `env`, write five entries that carry
 * FORGED in the message, the metadata, an Error and a stack field, and return
 * everything the console transport wrote.
 */
async function captureConsole(env: Record<string, string | undefined>): Promise<string[]> {
  const savedEnv = { ...process.env };
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }

  // winston's Console transport writes to console._stdout / console._stderr.
  const sink = new PassThrough();
  const chunks: string[] = [];
  sink.on('data', (chunk: Buffer) => chunks.push(chunk.toString('utf8')));
  const nodeConsole = console as unknown as { _stdout: unknown; _stderr: unknown };
  const savedStdout = nodeConsole._stdout;
  const savedStderr = nodeConsole._stderr;
  nodeConsole._stdout = sink;
  nodeConsole._stderr = sink;

  try {
    let logger: any;
    jest.isolateModules(() => {
      logger = require('../../../config/logger').default;
    });
    logger.info(`GET /api/risks/${FORGED}`);
    logger.warn('Validation failed', { provider: FORGED, nested: { value: FORGED } });
    logger.error(`Request failed: ${FORGED}`, new Error(FORGED));
    logger.debug(FORGED, { stack: FORGED });
    logger.info({ message: FORGED, detail: FORGED });
    for (let i = 0; i < 20; i++) {
      await new Promise((resolve) => setImmediate(resolve));
    }
    logger.close();
  } finally {
    nodeConsole._stdout = savedStdout;
    nodeConsole._stderr = savedStderr;
    process.env = savedEnv;
  }

  return chunks.join('').split(LF).filter((line) => line.length > 0);
}

describe('config/logger.ts console output', () => {
  afterEach(() => {
    jest.resetModules();
  });

  it('writes one JSON document per entry when NODE_ENV=production', async () => {
    const lines = await captureConsole({
      NODE_ENV: 'production',
      LOG_CONSOLE: undefined,
      LOG_FILE: undefined,
      ELASTICSEARCH_ENABLED: undefined,
    });

    expect(lines).toHaveLength(5);
    for (const line of lines) {
      expect(containsLineBreak(line)).toBe(false);
      expect(line.includes(ESC)).toBe(false);
      expect(line.startsWith('FORGED')).toBe(false);
      expect(() => JSON.parse(line)).not.toThrow();
    }
    // The value is escaped on the wire, not altered: parsing restores it.
    expect(JSON.parse(lines[1]).provider).toBe(FORGED);
  });

  it('writes one escaped text line per entry outside production', async () => {
    const lines = await captureConsole({
      NODE_ENV: 'development',
      LOG_CONSOLE: undefined,
      LOG_FILE: 'false',
      ELASTICSEARCH_ENABLED: undefined,
    });

    expect(lines).toHaveLength(5);
    for (const line of lines) {
      expect(containsLineBreak(line)).toBe(false);
      expect(line.startsWith('FORGED')).toBe(false);
    }
    expect(lines[0]).toContain('alice\\r\\nFORGED 2026-01-01');
  });
});
