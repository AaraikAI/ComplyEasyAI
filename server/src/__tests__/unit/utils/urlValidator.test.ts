import { describe, it, expect, jest, beforeEach } from '@jest/globals';

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { isUrlSafe, safeFetch, isWebhookUrlSafe, sanitizeUrlForLogging } from '../../../utils/urlValidator';

describe('urlValidator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isUrlSafe', () => {
    it('should allow valid HTTPS URLs', () => {
      expect(isUrlSafe('https://example.com/api')).toBe(true);
    });

    it('should allow valid HTTP URLs', () => {
      expect(isUrlSafe('http://example.com/api')).toBe(true);
    });

    it('should block non-HTTP protocols', () => {
      expect(isUrlSafe('ftp://example.com/file')).toBe(false);
      expect(isUrlSafe('file:///etc/passwd')).toBe(false);
    });

    it('should block localhost', () => {
      expect(isUrlSafe('http://localhost:3000')).toBe(false);
      expect(isUrlSafe('http://127.0.0.1:8080')).toBe(false);
    });

    it('should block AWS metadata endpoint', () => {
      expect(isUrlSafe('http://169.254.169.254/latest/meta-data')).toBe(false);
    });

    it('should block GCP metadata endpoint', () => {
      expect(isUrlSafe('http://metadata.google.internal/computeMetadata')).toBe(false);
    });

    it('should block 0.0.0.0', () => {
      expect(isUrlSafe('http://0.0.0.0:8080')).toBe(false);
    });

    it('should block private IP ranges (10.x)', () => {
      expect(isUrlSafe('http://10.0.0.1:8080')).toBe(false);
    });

    it('should block private IP ranges (172.16.x)', () => {
      expect(isUrlSafe('http://172.16.0.1:8080')).toBe(false);
    });

    it('should block private IP ranges (192.168.x)', () => {
      expect(isUrlSafe('http://192.168.1.1:8080')).toBe(false);
    });

    it('should block URLs with credentials (@)', () => {
      expect(isUrlSafe('http://user:pass@example.com')).toBe(false);
    });

    it('should return false for invalid URLs', () => {
      expect(isUrlSafe('not-a-url')).toBe(false);
      expect(isUrlSafe('')).toBe(false);
    });

    it('should allow external public IPs', () => {
      expect(isUrlSafe('https://8.8.8.8/api')).toBe(true);
    });

    it('should block link-local addresses (169.254.x)', () => {
      expect(isUrlSafe('http://169.254.1.1')).toBe(false);
    });
  });

  describe('safeFetch', () => {
    it('should throw error for unsafe URLs', async () => {
      await expect(safeFetch('http://localhost:3000')).rejects.toThrow('URL is not allowed');
    });

    it('should call fetch for safe URLs', async () => {
      const mockResponse = {
        status: 200,
        headers: { get: jest.fn().mockReturnValue(null) },
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse) as any;

      const result = await safeFetch('https://example.com/api');
      expect(result).toBeDefined();
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should block redirects to internal URLs', async () => {
      const mockResponse = {
        status: 302,
        headers: { get: jest.fn().mockReturnValue('http://localhost:3000/internal') },
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse) as any;

      await expect(safeFetch('https://example.com/redirect')).rejects.toThrow('Redirect to internal URL blocked');
    });

    it('should allow redirects to safe URLs', async () => {
      const mockResponse = {
        status: 302,
        headers: { get: jest.fn().mockReturnValue('https://other.example.com/page') },
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse) as any;

      const result = await safeFetch('https://example.com/redirect');
      expect(result).toBeDefined();
    });
  });

  describe('isWebhookUrlSafe', () => {
    it('should return false for unsafe URLs', () => {
      expect(isWebhookUrlSafe('http://localhost:3000')).toBe(false);
    });

    it('should allow HTTPS URLs', () => {
      expect(isWebhookUrlSafe('https://example.com/webhook')).toBe(true);
    });

    it('should require HTTPS in production', () => {
      const origEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      expect(isWebhookUrlSafe('http://example.com/webhook')).toBe(false);
      expect(isWebhookUrlSafe('https://example.com/webhook')).toBe(true);
      process.env.NODE_ENV = origEnv;
    });

    it('should allow HTTP in development', () => {
      const origEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      expect(isWebhookUrlSafe('http://example.com/webhook')).toBe(true);
      process.env.NODE_ENV = origEnv;
    });
  });

  describe('sanitizeUrlForLogging', () => {
    it('should remove credentials from URL', () => {
      const result = sanitizeUrlForLogging('https://user:password@example.com/api');
      expect(result).not.toContain('user');
      expect(result).not.toContain('password');
      expect(result).toContain('example.com');
    });

    it('should return unchanged URL without credentials', () => {
      const url = 'https://example.com/api/path';
      const result = sanitizeUrlForLogging(url);
      expect(result).toContain('example.com/api/path');
    });

    it('should return placeholder for invalid URLs', () => {
      expect(sanitizeUrlForLogging('not-a-url')).toBe('[Invalid URL]');
    });
  });
});
