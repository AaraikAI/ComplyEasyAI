/**
 * URL Validation and SSRF Protection Utility
 * Prevents Server-Side Request Forgery attacks
 */

import { URL } from 'url';
import net from 'net';
import dns from 'dns';
import type { LookupAddress, LookupOptions } from 'dns';
import { lookup as dnsLookup } from 'dns/promises';
import axios, { AxiosError } from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
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
    // Unique-local (fc00::/7), link-local (fe80::/10), deprecated site-local
    // (fec0::/10) and multicast (ff00::/8).
    if (/^f[cd]/.test(addr)) return true;
    if (/^fe[89ab]/.test(addr)) return true;
    if (/^fe[c-f]/.test(addr)) return true;
    if (/^ff/.test(addr)) return true;
    // Addresses that embed an IPv4 address are classified by that address:
    // IPv4-mapped (::ffff:0:0/96), IPv4-compatible (::/96), NAT64 (64:ff9b::/96)
    // and 6to4 (2002::/16).
    for (const prefix of ['::ffff:', '::', '64:ff9b::']) {
      const v4 = embeddedIpv4(addr, prefix);
      if (v4 !== null) return isPrivateIp(v4);
    }
    const sixToFour = addr.match(/^2002:([0-9a-f]{1,4}):([0-9a-f]{1,4})(?::|$)/);
    if (sixToFour) return isPrivateIp(hexWordsToIpv4(sixToFour[1], sixToFour[2]));
    return false;
  }

  if (kind === 4) {
    return (
      BLOCKED_IP_RANGES.some((r) => r.test(addr)) ||
      NON_PUBLIC_IPV4_CIDRS.some(([base, bits]) => isInIpv4Cidr(addr, base, bits))
    );
  }

  return false;
}

// IPv4 ranges that are never valid public destinations, in addition to the
// RFC 1918 / loopback / link-local patterns in BLOCKED_IP_RANGES.
const NON_PUBLIC_IPV4_CIDRS: ReadonlyArray<readonly [string, number]> = [
  ['0.0.0.0', 8], // "this network"; connecting to 0.0.0.0 reaches the local host
  ['100.64.0.0', 10], // carrier-grade NAT, also used for some cloud metadata services
  ['192.0.0.0', 24], // IETF protocol assignments
  ['198.18.0.0', 15], // benchmarking
  ['224.0.0.0', 3], // multicast, reserved and broadcast (224.0.0.0 - 255.255.255.255)
];

function ipv4ToNumber(addr: string): number | null {
  const parts = addr.split('.');
  if (parts.length !== 4) return null;
  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const octet = Number(part);
    if (octet > 255) return null;
    value = value * 256 + octet;
  }
  return value;
}

function isInIpv4Cidr(addr: string, base: string, bits: number): boolean {
  const a = ipv4ToNumber(addr);
  const b = ipv4ToNumber(base);
  if (a === null || b === null) return false;
  const blockSize = 2 ** (32 - bits);
  return Math.floor(a / blockSize) === Math.floor(b / blockSize);
}

function hexWordsToIpv4(hiWord: string, loWord: string): string {
  const hi = parseInt(hiWord, 16);
  const lo = parseInt(loWord, 16);
  return `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`;
}

/**
 * The IPv4 address carried in the last 32 bits of an IPv6 address that starts
 * with `prefix`, written either as a dotted quad (::ffff:127.0.0.1) or as two
 * hex words (::ffff:7f00:1). Returns null when the address has another shape.
 */
function embeddedIpv4(addr: string, prefix: string): string | null {
  if (!addr.startsWith(prefix)) return null;
  const rest = addr.slice(prefix.length);
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(rest)) return rest;
  const hex = rest.match(/^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  return hex ? hexWordsToIpv4(hex[1], hex[2]) : null;
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
 * Resolve a hostname and confirm every resolved address is public. This gives
 * an early, readable rejection for names that point at internal IPs. It is NOT
 * the authoritative check for requests: the connection resolves the name again,
 * and a rebinding DNS server can answer differently the second time. The
 * authoritative check is publicOnlyLookup, which validates the exact addresses
 * the socket connects to. IP literals are validated synchronously by isUrlSafe
 * already, so only DNS names are resolved here. Resolution failures are treated
 * as non-blocking (the connection-time lookup fails the same way, so no
 * connection to an internal host is made).
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

/** Error code carried by connection attempts refused by publicOnlyLookup. */
export const SSRF_BLOCKED_CODE = 'ERR_SSRF_BLOCKED_ADDRESS';

type LookupCallback = (
  err: NodeJS.ErrnoException | null,
  address?: string | LookupAddress[],
  family?: number
) => void;

/**
 * DNS lookup for outbound connections that refuses private addresses at the
 * moment of connecting (drop-in for the `lookup` option of net/http/https).
 *
 * Checking a hostname and then letting the HTTP client resolve it again leaves
 * a time-of-check/time-of-use gap: a DNS server under an attacker's control can
 * answer the check with a public address and the connection with 127.0.0.1 or
 * 169.254.169.254 (DNS rebinding). Here the addresses that are validated are
 * the same addresses handed to the socket, so there is no second resolution to
 * race. Every returned address must be public; one private answer fails the
 * whole lookup, which also covers Happy Eyeballs trying several addresses.
 */
export function publicOnlyLookup(
  hostname: string,
  options: LookupOptions | number | null | undefined,
  callback: LookupCallback
): void {
  const opts: LookupOptions =
    typeof options === 'number' ? { family: options } : { ...(options ?? {}) };

  dns.lookup(hostname, { ...opts, all: true }, (err, addresses) => {
    if (err) {
      callback(err);
      return;
    }
    const list = Array.isArray(addresses) ? addresses : [];
    if (list.length === 0) {
      const notFound: NodeJS.ErrnoException = new Error(`No addresses found for ${hostname}`);
      notFound.code = 'ENOTFOUND';
      callback(notFound);
      return;
    }
    const blocked = list.find((entry) => isPrivateIp(entry.address));
    if (blocked) {
      logSecurityEvent({
        type: SecurityEventType.SSRF_ATTEMPT,
        severity: 'critical',
        message: 'Blocked connection to a hostname resolving to a private IP (connect-time DNS check)',
        details: { hostname: hostname.slice(0, 253), resolved: blocked.address },
      });
      const blockedError = new AppError('Host resolves to a private address (SSRF protection)', 400);
      (blockedError as AppError & { code?: string }).code = SSRF_BLOCKED_CODE;
      callback(blockedError);
      return;
    }
    if (opts.all) {
      callback(null, list);
    } else {
      callback(null, list[0].address, list[0].family);
    }
  });
}

/** publicOnlyLookup typed for axios' `lookup` request option. */
const axiosPublicOnlyLookup = publicOnlyLookup as unknown as NonNullable<AxiosRequestConfig['lookup']>;

/** Whether an error (or the error it wraps) came from publicOnlyLookup. */
function isSsrfBlockedError(error: unknown): boolean {
  const e = error as { code?: unknown; cause?: { code?: unknown } } | null;
  return e?.code === SSRF_BLOCKED_CODE || e?.cause?.code === SSRF_BLOCKED_CODE;
}

/**
 * Whether axios will connect to the target host directly. With an HTTP(S)
 * proxy the proxy resolves the target itself, and a connect-time lookup would
 * only ever see the proxy's own (often private) address, so address pinning is
 * applied only to direct connections.
 */
function connectsDirectly(proxy: AxiosRequestConfig['proxy']): boolean {
  if (proxy === false) return true;
  if (proxy) return false;
  return !['HTTPS_PROXY', 'https_proxy', 'HTTP_PROXY', 'http_proxy'].some((name) => Boolean(process.env[name]));
}

/** Largest response body safeFetch buffers (after decompression). */
const SAFE_FETCH_MAX_BODY_BYTES = 10 * 1024 * 1024;

/** Statuses that never carry a response body (Fetch "null body status"). */
const NULL_BODY_STATUSES = new Set([204, 205, 304]);

/**
 * One HTTP exchange for safeFetch, without following redirects. The request is
 * made with axios' Node http adapter so the socket connects through
 * publicOnlyLookup; the result is returned as a standard fetch Response.
 */
async function requestWithPublicOnlyLookup(url: string, init: RequestInit | undefined): Promise<Response> {
  const method = (init?.method ?? 'GET').toUpperCase();

  const headers: Record<string, string | false> = {};
  new Headers(init?.headers).forEach((value, name) => {
    headers[name] = value;
  });

  let data: string | Buffer | undefined;
  const body = init?.body;
  if (body === undefined || body === null) {
    // fetch sends no Content-Type without a body; stop axios adding one.
    headers['content-type'] ??= false;
  } else if (typeof body === 'string') {
    data = body;
    headers['content-type'] ??= 'text/plain;charset=UTF-8';
  } else if (body instanceof URLSearchParams) {
    data = body.toString();
    headers['content-type'] ??= 'application/x-www-form-urlencoded;charset=UTF-8';
  } else if (body instanceof ArrayBuffer) {
    data = Buffer.from(body);
  } else if (ArrayBuffer.isView(body)) {
    data = Buffer.from(body.buffer, body.byteOffset, body.byteLength);
  } else {
    throw new AppError('Unsupported request body type for an outbound request', 500);
  }
  // The same defaults the built-in fetch sends.
  headers['accept'] ??= '*/*';
  headers['user-agent'] ??= 'node';

  let response: AxiosResponse<Buffer>;
  try {
    response = await axios.request<Buffer>({
      url,
      method,
      headers,
      data,
      signal: init?.signal ?? undefined,
      adapter: 'http',
      // Pin the connection to validated public addresses. No proxy, matching
      // the built-in fetch, so the pinned lookup always applies.
      lookup: axiosPublicOnlyLookup,
      proxy: false,
      maxRedirects: 0,
      validateStatus: () => true,
      responseType: 'arraybuffer',
      decompress: true,
      maxContentLength: SAFE_FETCH_MAX_BODY_BYTES,
      transformRequest: [(requestData: unknown) => requestData],
    });
  } catch (error) {
    if (isSsrfBlockedError(error)) {
      throw new AppError('Host resolves to a private address (SSRF protection)', 400);
    }
    // fetch rejects with the signal's reason when aborted; keep that contract.
    if (axios.isCancel(error) && init?.signal?.aborted) {
      throw init.signal.reason ?? error;
    }
    throw error;
  }

  const status = response.status;
  if (status < 200 || status > 599) {
    throw new AppError(`Unexpected upstream status ${status}`, 502);
  }

  const responseHeaders = new Headers();
  const rawHeaders =
    response.headers && typeof (response.headers as { toJSON?: unknown }).toJSON === 'function'
      ? (response.headers as unknown as { toJSON: () => Record<string, unknown> }).toJSON()
      : ((response.headers ?? {}) as Record<string, unknown>);
  for (const [name, value] of Object.entries(rawHeaders)) {
    if (value === undefined || value === null || value === false) continue;
    if (Array.isArray(value)) {
      for (const item of value) responseHeaders.append(name, String(item));
    } else {
      responseHeaders.set(name, String(value));
    }
  }

  const responseBody =
    NULL_BODY_STATUSES.has(status) || method === 'HEAD' || response.data === undefined || response.data === null
      ? null
      : Buffer.from(response.data);
  return new Response(responseBody, {
    status,
    statusText: response.statusText ?? '',
    headers: responseHeaders,
  });
}

/**
 * Request options for the next hop of a redirect, following the Fetch rules:
 * credentials are not replayed to another origin, and 303 (or 301/302 after a
 * non-GET/HEAD request) continues as a GET without a body.
 */
function nextHopInit(
  init: RequestInit | undefined,
  status: number,
  fromUrl: string,
  toUrl: string
): RequestInit | undefined {
  if (!init) return init;
  const next: RequestInit = { ...init };
  if (init.headers !== undefined) {
    const headers: Record<string, string> = {};
    new Headers(init.headers).forEach((value, name) => {
      headers[name] = value;
    });
    next.headers = stripCredentialHeadersIfCrossOrigin(headers, fromUrl, toUrl) as Record<string, string>;
  }
  const method = (init.method ?? 'GET').toUpperCase();
  if (status === 303 || ((status === 301 || status === 302) && method !== 'GET' && method !== 'HEAD')) {
    next.method = method === 'HEAD' ? 'HEAD' : 'GET';
    next.body = undefined;
    if (next.headers) {
      const headers = { ...(next.headers as Record<string, string>) };
      delete headers['content-type'];
      delete headers['content-length'];
      next.headers = headers;
    }
  }
  return next;
}

/**
 * Safe fetch wrapper with SSRF protection. Validates the URL, resolves the host
 * to confirm it is public, connects only to addresses that publicOnlyLookup has
 * validated (so a rebinding DNS answer cannot redirect the socket after the
 * check), and follows redirects through a bounded loop where every hop is
 * re-validated (callers do NOT need to re-invoke per hop). Response bodies are
 * buffered, up to SAFE_FETCH_MAX_BODY_BYTES after decompression.
 * @param url - URL to fetch
 * @param options - Fetch options (method, headers, string/binary body, signal)
 * @returns Fetch response
 * @throws AppError if the URL, a resolved address, or any redirect target is unsafe
 */
export async function safeFetch(url: string, options?: RequestInit): Promise<Response> {
  let currentUrl = url;
  let init = options;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!isUrlSafe(currentUrl)) {
      throw new AppError('URL is not allowed for security reasons (SSRF protection)', 400);
    }

    await assertResolvedHostIsPublic(currentUrl);

    // Redirects are never followed by the transport; each hop is validated here.
    const response = await requestWithPublicOnlyLookup(currentUrl, init);

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

    init = nextHopInit(init, response.status, currentUrl, resolvedUrl);
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

/** Headers that must never survive a redirect to a different origin. */
const CREDENTIAL_HEADERS = ['authorization', 'cookie', 'proxy-authorization', 'x-api-key'];

function originOf(urlString: string): string {
  try {
    const u = new URL(urlString);
    return `${u.protocol}//${u.host}`;
  } catch {
    return '';
  }
}

/**
 * Drop credential-bearing headers when a redirect crosses to another origin, so
 * an integration token cannot be replayed to a host the operator never chose.
 */
function stripCredentialHeadersIfCrossOrigin(
  headers: Record<string, unknown>,
  fromUrl: string,
  toUrl: string
): Record<string, unknown> {
  if (originOf(fromUrl) === originOf(toUrl)) return headers;
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (!CREDENTIAL_HEADERS.includes(key.toLowerCase())) cleaned[key] = value;
  }
  return cleaned;
}

/**
 * SSRF-hardened axios request. This is the shared primitive every outbound
 * axios call should use; it is the axios counterpart of safeFetch.
 *
 * Why a plain `isUrlSafe(url)` check before `axios.get(url)` is not enough:
 *   1. isUrlSafe never resolves DNS, so its private-range checks only fire when
 *      the host is already an IP literal. A name the attacker controls —
 *      evil.example.com with an A record of 169.254.169.254 — passes it intact.
 *   2. axios follows redirects on its own by default, so a validated public URL
 *      can 302 straight to the metadata endpoint after the check has passed.
 *
 * This helper closes both: it awaits assertUrlSafe (synchronous checks PLUS DNS
 * resolution) on the initial URL *and on every redirect target*, and it sets
 * maxRedirects: 0 so axios can never follow a hop unvalidated. Redirects are
 * followed manually, bounded by MAX_REDIRECTS.
 *
 * Caller-visible behaviour is preserved: the returned AxiosResponse is the same
 * shape as axios.request, and a status the caller considers a failure still
 * throws an AxiosError carrying `.response`, so existing
 * `catch (e) { e.response?.status }` handling keeps working.
 *
 * @param config - standard axios config; `url` is required
 * @param context - short label used in error messages and security logs
 * @throws AppError(403) if the URL, a resolved address, or a redirect target is unsafe
 */
export async function safeAxios<T = any>(
  config: AxiosRequestConfig & { url: string },
  context = 'outbound request'
): Promise<AxiosResponse<T>> {
  const callerValidate = config.validateStatus ?? ((status: number) => status >= 200 && status < 300);

  let currentUrl = config.url;
  let method = (config.method ?? 'get').toString().toLowerCase();
  let data = config.data;
  let headers: Record<string, unknown> = { ...(config.headers as Record<string, unknown>) };

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    // Full guard: protocol/host/IP checks AND DNS resolution of the hostname.
    // Throws AppError(400) from assertUrlSafe when the URL itself is unsafe.
    await assertUrlSafe(currentUrl);

    let response: AxiosResponse<T>;
    try {
      response = await axios.request({
        ...config,
        url: currentUrl,
        method,
        data,
        // Tracked internally as a plain record so redirect handling can drop
        // credential headers by name; cast back at the axios boundary.
        headers: headers as AxiosRequestConfig['headers'],
        // Never let axios follow a redirect for us: every hop must be re-validated.
        maxRedirects: 0,
        // Accept everything so redirect handling and the caller's own status
        // policy are applied here rather than by an axios throw.
        validateStatus: () => true,
        // Connect only to addresses validated at connect time (DNS rebinding).
        ...(connectsDirectly(config.proxy) ? { lookup: axiosPublicOnlyLookup } : {}),
      });
    } catch (error) {
      if (isSsrfBlockedError(error)) {
        throw new AppError(`Host resolves to a private address (SSRF protection: ${context})`, 403);
      }
      throw error;
    }

    const isRedirect = response.status >= 300 && response.status < 400;
    const location = isRedirect
      ? ((response.headers?.location ?? (response.headers as any)?.Location) as string | undefined)
      : undefined;

    if (!isRedirect || !location) {
      if (!callerValidate(response.status)) {
        throw new AxiosError(
          `Request failed with status code ${response.status}`,
          response.status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
          response.config,
          response.request,
          response
        );
      }
      return response;
    }

    if (hop === MAX_REDIRECTS) {
      logSecurityEvent({
        type: SecurityEventType.SUSPICIOUS_INPUT,
        severity: 'medium',
        message: `Maximum redirect depth reached (${context})`,
        details: { url: sanitizeUrlForLogging(currentUrl) },
      });
      throw new AppError(`Too many redirects (SSRF protection: ${context})`, 403);
    }

    const nextUrl = new URL(location, currentUrl).href;

    // Fail fast on an unsafe hop with a clear message; assertUrlSafe at the top
    // of the next iteration performs the DNS half of the check.
    if (!isUrlSafe(nextUrl)) {
      logSecurityEvent({
        type: SecurityEventType.SSRF_ATTEMPT,
        severity: 'critical',
        message: `Blocked redirect to internal URL (${context})`,
        details: {
          from: sanitizeUrlForLogging(currentUrl),
          to: sanitizeUrlForLogging(nextUrl),
        },
      });
      throw new AppError(`Redirect to internal URL blocked (SSRF protection: ${context})`, 403);
    }

    headers = stripCredentialHeadersIfCrossOrigin(headers, currentUrl, nextUrl);

    // Match browser/fetch semantics: 303, and 301/302 on a non-GET/HEAD, become
    // a GET with no body rather than replaying the payload to a new location.
    if (
      response.status === 303 ||
      ((response.status === 301 || response.status === 302) && method !== 'get' && method !== 'head')
    ) {
      method = 'get';
      data = undefined;
    }

    currentUrl = nextUrl;
  }

  // Unreachable: every path above returns or throws.
  throw new AppError(`Redirect handling failed (SSRF protection: ${context})`, 403);
}

/**
 * Convenience wrapper for the common `axios.get(url, options)` shape.
 * Equivalent to safeAxios({ ...options, url, method: 'get' }, context).
 */
export async function safeAxiosGet<T = any>(
  url: string,
  context = 'outbound request',
  options?: AxiosRequestConfig
): Promise<AxiosResponse<T>> {
  return safeAxios<T>({ ...options, url, method: 'get' }, context);
}

/**
 * SSRF-harden a long-lived axios instance created with axios.create().
 *
 * Instance-based clients (baseURL + shared auth headers) cannot route through
 * safeAxios without rewriting every call site, so they are hardened in place:
 *
 *   - maxRedirects: 0 — axios can never follow an unvalidated hop. A 3xx is
 *     surfaced to the caller instead of being chased, which fails closed.
 *   - an async request interceptor resolves the effective URL against baseURL
 *     and awaits assertUrlSafe on it, so the DNS-resolution check runs on the
 *     real target of every request, including any per-call url override.
 *
 * Use this wherever a client is constructed from an operator- or tenant-supplied
 * baseURL (self-hosted Jira, ServiceNow instance URLs, KMS endpoints, …).
 */
export function hardenAxiosInstance<T extends AxiosInstance>(instance: T, context = 'outbound request'): T {
  instance.defaults.maxRedirects = 0;
  instance.interceptors.request.use(async (requestConfig) => {
    const base = requestConfig.baseURL ?? instance.defaults.baseURL;
    const target = requestConfig.url ?? '';
    // Resolve relative paths against baseURL so the check sees the real host.
    const effectiveUrl = base ? new URL(target, base.endsWith('/') ? base : `${base}/`).href : target;
    if (effectiveUrl) {
      await assertUrlSafe(effectiveUrl);
    }
    // Re-check at connect time too, so a rebinding DNS answer cannot move the
    // socket to a private address after assertUrlSafe passed.
    if (connectsDirectly(requestConfig.proxy ?? instance.defaults.proxy)) {
      requestConfig.lookup = axiosPublicOnlyLookup;
    }
    return requestConfig;
  });
  return instance;
}
