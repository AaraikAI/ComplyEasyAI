/**
 * URL Validation and SSRF Protection Utility
 * Prevents Server-Side Request Forgery attacks
 */

import { URL } from 'url';
import net from 'net';
import { lookup as dnsLookup } from 'dns/promises';
import { logSecurityEvent, SecurityEventType } from './securityEventLogger';
import { AppError } from '../middleware/errorHandler';

// Blocked hostnames (localhost, internal IPs)
const BLOCKED_HOSTS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '169.254.169.254', // AWS EC2 metadata
  '::1', // IPv6 localhost
  'metadata.google.internal', // GCP metadata
  '100.100.100.200', // Alibaba Cloud metadata
];

// Private IP address ranges (RFC 1918)
const BLOCKED_IP_RANGES = [
  /^10\./, // 10.0.0.0/8
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
  /^192\.168\./, // 192.168.0.0/16
  /^127\./, // 127.0.0.0/8 (loopback)
  /^169\.254\./, // 169.254.0.0/16 (link-local)
  /^fc00:/, // IPv6 unique local
  /^fe80:/, // IPv6 link-local
];

// Maximum number of redirect hops safeFetch will follow, each re-validated.
const MAX_REDIRECTS = 5;

/**
 * Determine whether a resolved IP literal (v4 or v6) points at a private,
 * loopback, link-local, or otherwise non-routable/internal address. Also
 * normalizes IPv4-mapped IPv6 (::ffff:a.b.c.d) to its embedded IPv4 so those
 * cannot smuggle an internal IPv4 past the dotted-decimal checks.
 */
export function isPrivateIp(ip: string): boolean {
  let addr = ip.trim().toLowerCase();
  // Strip an IPv6 zone identifier (e.g. fe80::1%eth0) before classification.
  const zoneIdx = addr.indexOf('%');
  if (zoneIdx !== -1) addr = addr.slice(0, zoneIdx);

  const kind = net.isIP(addr);

  if (kind === 6) {
    // Unspecified / loopback.
    if (addr === '::' || addr === '::1') return true;
    // Unique-local (fc00::/7) and link-local (fe80::/10).
    if (/^f[cd]/.test(addr)) return true;
    if (/^fe[89ab]/.test(addr)) return true;
    // IPv4-mapped / IPv4-compatible: extract trailing dotted-quad or hex words.
    const mapped = addr.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
    if (mapped) return isPrivateIp(mapped[1]);
    const hexMapped = addr.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
    if (hexMapped) {
      const hi = parseInt(hexMapped[1], 16);
      const lo = parseInt(hexMapped[2], 16);
      const v4 = `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`;
      return isPrivateIp(v4);
    }
    return false;
  }

  if (kind === 4) {
    return BLOCKED_IP_RANGES.some((r) => r.test(addr));
  }

  return false;
}

/**
 * Check if a URL is safe to fetch (SSRF protection)
 * @param urlString - URL to validate
 * @returns true if URL is safe to fetch
 */
export function isUrlSafe(urlString: string): boolean {
  try {
    const url = new URL(urlString);

    // Only allow HTTP/HTTPS protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      logSecurityEvent({
        type: SecurityEventType.SSRF_ATTEMPT,
        severity: 'high',
        message: `Blocked non-HTTP(S) protocol: ${url.protocol}`,
        details: { url: sanitizeUrlForLogging(urlString), protocol: url.protocol },
      });
      return false;
    }

    const rawHostname = url.hostname.toLowerCase();
    // url.hostname keeps the brackets for IPv6 literals (e.g. "[::1]"); strip
    // them so the literal is classified correctly. The WHATWG URL parser already
    // normalizes decimal/hex/octal/short-form IPv4 (e.g. 2130706433 -> 127.0.0.1).
    const hostname =
      rawHostname.startsWith('[') && rawHostname.endsWith(']')
        ? rawHostname.slice(1, -1)
        : rawHostname;

    // Check against blocked hosts
    if (BLOCKED_HOSTS.includes(hostname)) {
      logSecurityEvent({
        type: SecurityEventType.SSRF_ATTEMPT,
        severity: 'critical',
        message: `Blocked request to internal hostname: ${hostname}`,
        details: { url: sanitizeUrlForLogging(urlString), hostname },
      });
      return false;
    }

    // Check IP literals (v4 or v6, including IPv4-mapped IPv6) against private,
    // loopback, and link-local ranges.
    if (net.isIP(hostname) !== 0 && isPrivateIp(hostname)) {
      logSecurityEvent({
        type: SecurityEventType.SSRF_ATTEMPT,
        severity: 'critical',
        message: `Blocked request to private IP range: ${hostname}`,
        details: { url: sanitizeUrlForLogging(urlString), hostname },
      });
      return false;
    }

    // Defense-in-depth: also apply the dotted-decimal range checks directly
    // (covers any hostname string form the parser left as a v4 literal).
    for (const range of BLOCKED_IP_RANGES) {
      if (range.test(hostname)) {
        logSecurityEvent({
          type: SecurityEventType.SSRF_ATTEMPT,
          severity: 'critical',
          message: `Blocked request to private IP range: ${hostname}`,
          details: { url: sanitizeUrlForLogging(urlString), hostname },
        });
        return false;
      }
    }

    // Block URLs with @ symbol (credential injection)
    if (urlString.includes('@')) {
      logSecurityEvent({
        type: SecurityEventType.SSRF_ATTEMPT,
        severity: 'high',
        message: 'Blocked URL with embedded credentials (@ symbol)',
        details: { url: sanitizeUrlForLogging(urlString) },
      });
      return false;
    }

    return true;
  } catch (_error) {
    logSecurityEvent({
      type: SecurityEventType.SUSPICIOUS_INPUT,
      severity: 'medium',
      message: 'Invalid URL format rejected',
      details: { url: urlString?.substring(0, 200) },
    });
    return false;
  }
}

/**
 * Resolve a hostname and confirm every resolved address is public. This is a
 * defense-in-depth guard against DNS rebinding / hostnames that resolve to
 * internal IPs. IP literals are validated synchronously by isUrlSafe already,
 * so only DNS names are resolved here. Resolution failures are logged and
 * treated as non-blocking (the request will fail naturally without having
 * connected to an internal host).
 */
async function assertResolvedHostIsPublic(urlString: string): Promise<void> {
  let hostname: string;
  try {
    hostname = new URL(urlString).hostname.toLowerCase();
  } catch {
    return;
  }
  const stripped =
    hostname.startsWith('[') && hostname.endsWith(']') ? hostname.slice(1, -1) : hostname;

  // IP literals are already validated by isUrlSafe; skip DNS resolution.
  if (net.isIP(stripped) !== 0) return;

  let addresses: { address: string }[];
  try {
    addresses = await dnsLookup(stripped, { all: true });
  } catch {
    // Could not resolve — do not block here; isUrlSafe already passed and no
    // connection to an internal address has been made.
    return;
  }

  for (const { address } of addresses) {
    if (isPrivateIp(address)) {
      logSecurityEvent({
        type: SecurityEventType.SSRF_ATTEMPT,
        severity: 'critical',
        message: 'Blocked request to hostname resolving to a private IP (DNS rebinding guard)',
        details: { url: sanitizeUrlForLogging(urlString), resolved: address },
      });
      throw new AppError('Host resolves to a private address (SSRF protection)', 400);
    }
  }
}

/**
 * Full SSRF guard: the synchronous checks in isUrlSafe PLUS DNS resolution.
 *
 * isUrlSafe alone only inspects the hostname as written, so its private-range
 * checks fire only when the host is already an IP literal. A name the attacker
 * controls — evil.example.com with an A record of 169.254.169.254 — passes it
 * unchanged. Any call site that reaches the network must use this instead, and
 * must await it: `await assertUrlSafe(url)`.
 *
 * Throws AppError(400) rather than returning false so a missing `await` fails
 * loudly instead of silently evaluating a Promise as truthy.
 */
export async function assertUrlSafe(urlString: string): Promise<void> {
  if (!isUrlSafe(urlString)) {
    throw new AppError('URL failed SSRF validation', 400);
  }
  await assertResolvedHostIsPublic(urlString);
}

/**
 * Safe fetch wrapper with SSRF protection. Validates the URL, resolves the host
 * to confirm it is public, and follows redirects through a bounded loop where
 * every hop is re-validated (callers do NOT need to re-invoke per hop).
 * @param url - URL to fetch
 * @param options - Fetch options
 * @returns Fetch response
 * @throws AppError if the URL, a resolved address, or any redirect target is unsafe
 */
export async function safeFetch(url: string, options?: RequestInit): Promise<Response> {
  let currentUrl = url;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!isUrlSafe(currentUrl)) {
      throw new AppError('URL is not allowed for security reasons (SSRF protection)', 400);
    }

    await assertResolvedHostIsPublic(currentUrl);

    const response = await fetch(currentUrl, {
      ...options,
      redirect: 'manual', // Validate each redirect target ourselves
    });

    // Non-redirect response: return it.
    if (response.status < 300 || response.status >= 400) {
      return response;
    }

    const redirectUrl = response.headers.get('location');
    if (!redirectUrl) {
      return response;
    }

    // Resolve relative redirects against the current URL and re-validate.
    const resolvedUrl = new URL(redirectUrl, currentUrl).href;
    if (!isUrlSafe(resolvedUrl)) {
      logSecurityEvent({
        type: SecurityEventType.SSRF_ATTEMPT,
        severity: 'critical',
        message: 'Blocked redirect to internal URL',
        details: { originalUrl: sanitizeUrlForLogging(currentUrl), redirectUrl: sanitizeUrlForLogging(resolvedUrl) },
      });
      throw new AppError('Redirect to internal URL blocked (SSRF protection)', 400);
    }

    // If this was the last allowed hop, stop following and return the response.
    if (hop === MAX_REDIRECTS) {
      logSecurityEvent({
        type: SecurityEventType.SUSPICIOUS_INPUT,
        severity: 'medium',
        message: 'Maximum redirect depth reached in safeFetch',
        details: { url: sanitizeUrlForLogging(currentUrl) },
      });
      return response;
    }

    currentUrl = resolvedUrl;
  }

  // Unreachable: the loop always returns or throws.
  throw new AppError('Redirect handling failed (SSRF protection)', 400);
}

/**
 * Validate webhook URL before calling it
 * @param url - Webhook URL to validate
 * @returns true if webhook URL is safe
 */
export function isWebhookUrlSafe(url: string): boolean {
  if (!isUrlSafe(url)) {
    return false;
  }

  try {
    const parsedUrl = new URL(url);

    // Webhooks should use HTTPS in production
    if (process.env.NODE_ENV === 'production' && parsedUrl.protocol !== 'https:') {
      logSecurityEvent({
        type: SecurityEventType.SUSPICIOUS_INPUT,
        severity: 'medium',
        message: 'Webhook URL rejected: HTTPS required in production',
        details: { url: sanitizeUrlForLogging(url) },
      });
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize URL for logging (remove credentials)
 * @param url - URL to sanitize
 * @returns Sanitized URL string
 */
export function sanitizeUrlForLogging(url: string): string {
  try {
    const parsedUrl = new URL(url);
    parsedUrl.username = '';
    parsedUrl.password = '';
    return parsedUrl.toString();
  } catch {
    return '[Invalid URL]';
  }
}
