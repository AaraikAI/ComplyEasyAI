/**
 * PII Redaction Utility - Implements AI Air Gap
 * Removes sensitive data before sending to AI models
 */

const PATTERNS = {
  // Domain part written as labels separated by dots so the trailing `\.[a-zA-Z]{2,}`
  // does not overlap a preceding `[...]+` that also matches a dot (avoids polynomial backtracking).
  EMAIL: /[a-zA-Z0-9._%+-]+@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}/g,
  PHONE: /(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/g,
  SSN: /\d{3}-\d{2}-\d{4}/g,
  CREDIT_CARD: /\b(?:\d{4}[ -]?){3}\d{4}\b/g,
  IPV4: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
  API_KEY: /\b[A-Za-z0-9]{32,}\b/g,
};

interface RedactionContext {
  redactedText: string;
  map: Map<string, string>;
}

// Upper bound on the text size passed through the regex-based redaction pass.
// Inputs larger than this are processed in fixed-size chunks so no single regex
// run sees an unbounded string (defense-in-depth against pathological backtracking).
const MAX_REDACTION_CHUNK = 100_000;

export function redactPII(text: string): RedactionContext {
  const map = new Map<string, string>();
  let counter = 0;

  if (typeof text === 'string' && text.length > MAX_REDACTION_CHUNK) {
    const parts: string[] = [];
    for (let i = 0; i < text.length; i += MAX_REDACTION_CHUNK) {
      parts.push(redactChunk(text.slice(i, i + MAX_REDACTION_CHUNK), map, () => ++counter));
    }
    return { redactedText: parts.join(''), map };
  }

  return { redactedText: redactChunk(text, map, () => ++counter), map };
}

function redactChunk(
  text: string,
  map: Map<string, string>,
  nextCounter: () => number
): string {
  let redactedText = text;

  const replaceToken = (match: string, type: string): string => {
    // Check if we already have a token for this exact PII
    for (const [token, value] of map.entries()) {
      if (value === match) return token;
    }

    const token = `[${type}_${nextCounter()}]`;
    map.set(token, match);
    return token;
  };

  // Apply redactions
  redactedText = redactedText.replace(PATTERNS.EMAIL, (m) => replaceToken(m, 'EMAIL'));
  redactedText = redactedText.replace(PATTERNS.PHONE, (m) => replaceToken(m, 'PHONE'));
  redactedText = redactedText.replace(PATTERNS.SSN, (m) => replaceToken(m, 'SSN'));
  redactedText = redactedText.replace(PATTERNS.CREDIT_CARD, (m) => replaceToken(m, 'CC'));
  redactedText = redactedText.replace(PATTERNS.IPV4, (m) => {
    // Don't redact common local IPs
    if (m.startsWith('192.168.') || m.startsWith('10.') || m.startsWith('127.')) {
      return m;
    }
    return replaceToken(m, 'IP');
  });

  return redactedText;
}

export function rehydratePII(text: string, map: Map<string, string>): string {
  let originalText = text;

  map.forEach((value, token) => {
    const escapedToken = token.replace(/[[\]]/g, '\\$&');
    originalText = originalText.replace(new RegExp(escapedToken, 'g'), value);
  });

  return originalText;
}
