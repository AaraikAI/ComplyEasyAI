
/**
 * PII Service - Implements the "AI Air Gap"
 * Scrub sensitive data before it leaves the client browser.
 *
 * Detection scope (deterministic, regex + checksum based):
 *   EMAIL, PHONE, SSN, CREDIT_CARD (Luhn-validated), IPV4, IPV6, IBAN,
 *   PASSPORT, DATE_OF_BIRTH, API_KEY / long secret token.
 *
 * Scope note: this is a structured-identifier scrubber. It deliberately does
 * NOT attempt free-text named-entity detection (person names, street
 * addresses), which cannot be done reliably with regex and would either miss
 * real names or over-redact ordinary prose. Treat this as a best-effort first
 * line of defense, not a complete privacy guarantee — server-side controls and
 * data-minimization at the source remain the authoritative safeguards before
 * any payload reaches a third-party AI model.
 */

// Regex + checksum patterns for structured PII identifiers.
const PATTERNS = {
  EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  // North-American (parens area code / +CC) plus broader international forms.
  // Branch 1: proven NANP shape. Branch 2: +CC followed by 2–4 groups of digits.
  PHONE: /(?:(?:\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4})|(?:\+\d{1,3}[\s.-]?(?:\(?\d{1,4}\)?[\s.-]?){2,4}\d{2,4})/g,
  SSN: /\b\d{3}-\d{2}-\d{4}\b/g,
  // 13–19 digit card numbers, optional space/dash grouping (validated by Luhn).
  CREDIT_CARD: /\b(?:\d[ -]?){12,18}\d\b/g,
  IPV4: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
  IPV6: /\b(?:[A-Fa-f0-9]{1,4}:){2,7}[A-Fa-f0-9]{1,4}\b/g,
  // IBAN: 2-letter country + 2 check digits + up to 30 alphanumerics.
  IBAN: /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/g,
  // Common passport pattern: 1–2 letters followed by 6–8 digits.
  PASSPORT: /\b[A-Z]{1,2}\d{6,8}\b/g,
  // Date of birth: ISO (YYYY-MM-DD) or slash/dash US/EU (M/D/YYYY, D-M-YYYY).
  DATE_OF_BIRTH: /\b(?:\d{4}-(?:0?[1-9]|1[0-2])-(?:0?[1-9]|[12]\d|3[01])|(?:0?[1-9]|1[0-2])[/-](?:0?[1-9]|[12]\d|3[01])[/-]\d{4})\b/g,
  // Long opaque secrets / API keys (32+ contiguous alphanumerics).
  API_KEY: /\b[A-Za-z0-9]{32,}\b/g,
};

// Store original values map to restore them later
interface RedactionContext {
  map: Map<string, string>;
  redactedText: string;
}

/**
 * Luhn checksum validation — rejects arbitrary digit runs that are not real
 * payment-card numbers, sharply reducing false positives on the CC pattern.
 */
const isLuhnValid = (value: string): boolean => {
  const digits = value.replace(/[^\d]/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits.charAt(i), 10);
    if (shouldDouble) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
};

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

  // Highest-specificity identifiers first so a broad pattern cannot swallow a
  // more precise one (e.g. EMAIL before API_KEY; CREDIT_CARD before PHONE).
  redactedText = redactedText.replace(PATTERNS.EMAIL, (m) => replaceToken(m, 'EMAIL'));
  redactedText = redactedText.replace(PATTERNS.SSN, (m) => replaceToken(m, 'SSN'));
  redactedText = redactedText.replace(PATTERNS.CREDIT_CARD, (m) =>
    isLuhnValid(m) ? replaceToken(m, 'CC') : m
  );
  redactedText = redactedText.replace(PATTERNS.IBAN, (m) => replaceToken(m, 'IBAN'));
  redactedText = redactedText.replace(PATTERNS.PHONE, (m) => replaceToken(m, 'PHONE'));
  redactedText = redactedText.replace(PATTERNS.DATE_OF_BIRTH, (m) => replaceToken(m, 'DOB'));
  redactedText = redactedText.replace(PATTERNS.IPV4, (m) => replaceToken(m, 'IP'));
  redactedText = redactedText.replace(PATTERNS.IPV6, (m) => replaceToken(m, 'IPV6'));
  redactedText = redactedText.replace(PATTERNS.PASSPORT, (m) => replaceToken(m, 'PASSPORT'));
  redactedText = redactedText.replace(PATTERNS.API_KEY, (m) => replaceToken(m, 'SECRET'));

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
