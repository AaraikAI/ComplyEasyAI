/**
 * PII Redaction Utility - Implements AI Air Gap
 * Removes sensitive data before sending to AI models
 */

const PATTERNS = {
  // Every repetition is bounded (RFC 5321 limits: 64-char local part, 63-char
  // labels; at most 10 labels and a 24-letter TLD). An unbounded local part made
  // each start position rescan the rest of a run such as `%%%...%`, which is
  // quadratic in the input length; with fixed bounds the scan is linear.
  EMAIL: /[a-zA-Z0-9._%+-]{1,64}@(?:[a-zA-Z0-9-]{1,63}\.){1,10}[a-zA-Z]{2,24}/g,
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
    if (!token) return;
    // Literal split/join: no regex is built from the token, and `$` sequences
    // in the restored value are not treated as replacement patterns.
    originalText = originalText.split(token).join(value);
  });

  return originalText;
}
