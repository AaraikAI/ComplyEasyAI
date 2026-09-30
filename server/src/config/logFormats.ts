/**
 * Winston formats shared by every log transport.
 *
 * Log statements interpolate request-derived values: paths, ids, header values,
 * provider names, error messages. A CR or LF inside one of those values would
 * end the current entry and start a new one whose content the sender controls
 * (log forging), because stdout is shipped to CloudWatch one line per event and
 * a terminal renders it the same way. Every format here therefore guarantees
 * one physical line per entry, whatever the call site passes in.
 */
import winston from 'winston';
import { sanitizeForLogging } from '../utils/logSanitizer';

const { combine, timestamp, printf, errors, json } = winston.format;

/** Key under which winston stores the fully rendered entry (triple-beam MESSAGE). */
const MESSAGE = Symbol.for('message');

// C0 controls (CR, LF, TAB, ESC, NUL, ...), DEL, C1 controls (including NEL,
// U+0085) and the Unicode line and paragraph separators U+2028 / U+2029.
// eslint-disable-next-line no-control-regex -- matching control characters is the purpose of this pattern
const LOG_CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g;

/**
 * Replace every character that can split a log entry across lines, or send
 * commands to a terminal, with a visible escape sequence.
 *
 * Each escape emitted (`\n`, `\r`, `\t`, `\uXXXX`) is also a valid JSON string
 * escape, so running this over already-serialized JSON keeps the document valid
 * and leaves the value a parser reads back unchanged.
 */
export function escapeLogControlChars(value: string): string {
  return value.replace(LOG_CONTROL_CHARS, (ch) => {
    if (ch === '\n') return '\\n';
    if (ch === '\r') return '\\r';
    if (ch === '\t') return '\\t';
    return `\\u${ch.charCodeAt(0).toString(16).padStart(4, '0')}`;
  });
}

/** Removes sensitive data (tokens, passwords, keys) before any transport sees it. */
export const sanitizationFormat = winston.format((info) => {
  // Sanitize all metadata
  if (info.metadata) {
    info.metadata = sanitizeForLogging(info.metadata);
  }

  // Sanitize message if it's an object
  if (typeof info.message === 'object') {
    info.message = sanitizeForLogging(info.message);
  }

  // Sanitize any additional fields
  if (info.error) {
    info.error = sanitizeForLogging(info.error);
  }

  return info;
})();

/**
 * Readable single-line format for a developer console. The message (or stack)
 * and the metadata are escaped individually rather than the rendered line, so
 * the ANSI codes that colorize() adds to the level keep working.
 */
export const textFormat = printf(({ level, message, timestamp: ts, stack, ...meta }) => {
  const body = escapeLogControlChars(String(stack || message));
  const metaStr = Object.keys(meta).length ? escapeLogControlChars(JSON.stringify(meta)) : '';
  return `${ts} [${level}]: ${body} ${metaStr}`;
});

/**
 * json() already escapes C0 characters, but DEL, C1 controls and U+2028 / U+2029
 * pass through raw, and some sinks and viewers treat NEL and the Unicode
 * separators as line breaks. This runs after json() on the serialized entry.
 */
const escapeRenderedEntry = winston.format((info) => {
  const rendered = info[MESSAGE];
  if (typeof rendered === 'string') {
    info[MESSAGE] = escapeLogControlChars(rendered);
  }
  return info;
});

/** Structured one-document-per-line format (production stdout, files, handlers). */
export const jsonFormat = combine(
  sanitizationFormat, // Apply sanitization first
  errors({ stack: true }),
  timestamp(),
  json(),
  escapeRenderedEntry(),
);
