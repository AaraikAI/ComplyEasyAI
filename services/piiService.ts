
/**
 * PII Service - Implements the "AI Air Gap"
 * Scrub sensitive data before it leaves the client browser.
 */

// Simple regex-based patterns for common PII
const PATTERNS = {
  EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  PHONE: /(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/g,
  SSN: /\d{3}-\d{2}-\d{4}/g,
  CREDIT_CARD: /\b(?:\d{4}[ -]?){3}\d{4}\b/g,
  IPV4: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
};

// Store original values map to restore them later
interface RedactionContext {
  map: Map<string, string>;
  redactedText: string;
}

export const redactPII = (text: string): RedactionContext => {
  const map = new Map<string, string>();
  let redactedText = text;
  let counter = 0;

  const replaceToken = (match: string, type: string) => {
    // Check if we already have a token for this exact PII to maintain consistency
    for (const [token, value] of map.entries()) {
      if (value === match) return token;
    }
    const token = `[${type}_${++counter}]`;
    map.set(token, match);
    return token;
  };

  redactedText = redactedText.replace(PATTERNS.EMAIL, (m) => replaceToken(m, 'EMAIL'));
  redactedText = redactedText.replace(PATTERNS.PHONE, (m) => replaceToken(m, 'PHONE'));
  redactedText = redactedText.replace(PATTERNS.SSN, (m) => replaceToken(m, 'SSN'));
  redactedText = redactedText.replace(PATTERNS.CREDIT_CARD, (m) => replaceToken(m, 'CC'));
  redactedText = redactedText.replace(PATTERNS.IPV4, (m) => replaceToken(m, 'IP'));

  return { map, redactedText };
};

export const rehydratePII = (text: string, map: Map<string, string>): string => {
  let originalText = text;
  map.forEach((value, token) => {
    // Escape brackets for regex
    const escapedToken = token.replace(/\[/g, '\\[').replace(/\]/g, '\\]');
    originalText = originalText.replace(new RegExp(escapedToken, 'g'), value);
  });
  return originalText;
};
