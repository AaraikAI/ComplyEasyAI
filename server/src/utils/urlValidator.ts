/**
 * URL Validation and SSRF Protection Utility
 * Prevents Server-Side Request Forgery attacks
 */

import { URL } from 'url';
import logger from '../config/logger';

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
      logger.warn(`[Security] Blocked non-HTTP(S) protocol: ${url.protocol}`);
      return false;
    }

    const hostname = url.hostname.toLowerCase();

    // Check against blocked hosts
    if (BLOCKED_HOSTS.includes(hostname)) {
      logger.warn(`[Security] Blocked internal hostname: ${hostname}`);
      return false;
    }

    // Check against private IP ranges
    for (const range of BLOCKED_IP_RANGES) {
      if (range.test(hostname)) {
        logger.warn(`[Security] Blocked private IP range: ${hostname}`);
        return false;
      }
    }

    // Block URLs with @ symbol (credential injection)
    if (urlString.includes('@')) {
      logger.warn(`[Security] Blocked URL with credentials: ${urlString}`);
      return false;
    }

    return true;
  } catch (error) {
    logger.warn(`[Security] Invalid URL format: ${urlString}`);
    return false;
  }
}

/**
 * Safe fetch wrapper with SSRF protection
 * @param url - URL to fetch
 * @param options - Fetch options
 * @returns Fetch response
 * @throws Error if URL is not safe
 */
export async function safeFetch(url: string, options?: RequestInit): Promise<Response> {
  if (!isUrlSafe(url)) {
    throw new Error('URL is not allowed for security reasons (SSRF protection)');
  }

  const response = await fetch(url, {
    ...options,
    redirect: 'manual', // Don't follow redirects automatically
  });

  // Check for redirects to internal URLs
  if (response.status >= 300 && response.status < 400) {
    const redirectUrl = response.headers.get('location');
    if (redirectUrl) {
      // Resolve relative URLs
      const resolvedUrl = new URL(redirectUrl, url).href;

      if (!isUrlSafe(resolvedUrl)) {
        logger.warn(`[Security] Blocked redirect to internal URL: ${resolvedUrl}`);
        throw new Error('Redirect to internal URL blocked (SSRF protection)');
      }
    }
  }

  return response;
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
      logger.warn(`[Security] Webhook URL must use HTTPS in production: ${url}`);
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
