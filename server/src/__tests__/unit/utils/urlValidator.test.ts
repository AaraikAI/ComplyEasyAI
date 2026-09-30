import { describe, it, expect, jest, beforeEach } from '@jest/globals';

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import http from 'http';
import type { AddressInfo } from 'net';
import dns from 'dns';
import dnsPromises from 'dns/promises';
import axios from 'axios';
import {
  isUrlSafe,
  isPrivateIp,
  safeFetch,
  safeAxios,
  isWebhookUrlSafe,
  sanitizeUrlForLogging,
  publicOnlyLookup,
  SSRF_BLOCKED_CODE,
} from '../../../utils/urlValidator';

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
    // The pre-connection DNS check resolves the name; answer it locally so the
    // tests never depend on real DNS.
    beforeEach(() => {
      jest
        .spyOn(dnsPromises, 'lookup')
        .mockResolvedValue([{ address: '93.184.216.34', family: 4 }] as any);
    });

    const axiosReply = (overrides: Record<string, unknown>) => ({
      status: 200,
      statusText: 'OK',
      headers: {},
      data: Buffer.alloc(0),
      config: {},
      ...overrides,
    });

    it('should throw error for unsafe URLs', async () => {
      await expect(safeFetch('http://localhost:3000')).rejects.toThrow('URL is not allowed');
    });

    it('connects through the connect-time lookup and returns a fetch Response', async () => {
      const request = jest.spyOn(axios, 'request').mockResolvedValue(
        axiosReply({
          headers: { 'content-type': 'application/json', 'set-cookie': ['a=1', 'b=2'] },
          data: Buffer.from('{"ok":true}'),
        }) as any
      );

      const result = await safeFetch('https://example.com/api', {
        method: 'POST',
        headers: { Authorization: 'Bearer abc', 'Content-Type': 'application/json' },
        body: '{"a":1}',
      });

      expect(result).toBeInstanceOf(Response);
      expect(result.status).toBe(200);
      expect(result.headers.get('content-type')).toBe('application/json');
      expect(await result.json()).toEqual({ ok: true });

      const config = request.mock.calls[0][0] as Record<string, any>;
      expect(config.url).toBe('https://example.com/api');
      expect(config.method).toBe('POST');
      expect(config.data).toBe('{"a":1}');
      expect(config.headers.authorization).toBe('Bearer abc');
      expect(config.lookup).toBe(publicOnlyLookup);
      expect(config.proxy).toBe(false);
      expect(config.maxRedirects).toBe(0);
      // Same 300 s header/idle limit as the built-in fetch.
      expect(config.timeout).toBe(300_000);
    });

    it('returns a null body for 204 responses', async () => {
      jest.spyOn(axios, 'request').mockResolvedValue(axiosReply({ status: 204, statusText: 'No Content' }) as any);

      const result = await safeFetch('https://example.com/empty');
      expect(result.status).toBe(204);
      expect(result.body).toBeNull();
    });

    it('should block redirects to internal URLs', async () => {
      jest
        .spyOn(axios, 'request')
        .mockResolvedValue(axiosReply({ status: 302, headers: { location: 'http://localhost:3000/internal' } }) as any);

      await expect(safeFetch('https://example.com/redirect')).rejects.toThrow('Redirect to internal URL blocked');
    });

    it('follows safe redirects, dropping credentials cross-origin and turning 303 into GET', async () => {
      const request = jest
        .spyOn(axios, 'request')
        .mockResolvedValueOnce(axiosReply({ status: 303, headers: { location: 'https://other.example.com/page' } }) as any)
        .mockResolvedValueOnce(axiosReply({ data: Buffer.from('done') }) as any);

      const result = await safeFetch('https://example.com/redirect', {
        method: 'POST',
        headers: { Authorization: 'Bearer abc', 'X-Trace': 't1' },
        body: 'payload',
      });

      expect(await result.text()).toBe('done');
      expect(request).toHaveBeenCalledTimes(2);
      const second = request.mock.calls[1][0] as Record<string, any>;
      expect(second.url).toBe('https://other.example.com/page');
      expect(second.method).toBe('GET');
      expect(second.data).toBeUndefined();
      expect(second.headers.authorization).toBeUndefined();
      expect(second.headers['x-trace']).toBe('t1');
      expect(second.lookup).toBe(publicOnlyLookup);
    });

    it('reports a connection refused by the connect-time lookup as an SSRF block', async () => {
      const blocked = Object.assign(new Error('Host resolves to a private address'), { code: SSRF_BLOCKED_CODE });
      jest.spyOn(axios, 'request').mockRejectedValue(blocked);

      await expect(safeFetch('https://example.com/api')).rejects.toThrow('private address (SSRF protection)');
    });
  });

  describe('publicOnlyLookup', () => {
    const runLookup = (options: Record<string, unknown>) =>
      new Promise<{ err: any; address: any; family: any }>((resolve) => {
        publicOnlyLookup('host.example.test', options as any, (err, address, family) =>
          resolve({ err, address, family })
        );
      });

    const answerWith = (addresses: Array<{ address: string; family: number }>) => {
      jest.spyOn(dns, 'lookup').mockImplementation(((_host: string, _opts: unknown, cb: any) => {
        cb(null, addresses);
      }) as any);
    };

    it('refuses a name that resolves to a private address', async () => {
      answerWith([{ address: '127.0.0.1', family: 4 }]);
      const { err } = await runLookup({});
      expect(err).toBeTruthy();
      expect(err.code).toBe(SSRF_BLOCKED_CODE);
    });

    it('refuses when any one of several answers is private', async () => {
      answerWith([
        { address: '93.184.216.34', family: 4 },
        { address: '169.254.169.254', family: 4 },
      ]);
      const { err } = await runLookup({ all: true });
      expect(err?.code).toBe(SSRF_BLOCKED_CODE);
    });

    it('returns the validated address in the shape the caller asked for', async () => {
      answerWith([{ address: '93.184.216.34', family: 4 }]);
      expect(await runLookup({})).toEqual({ err: null, address: '93.184.216.34', family: 4 });
      expect(await runLookup({ all: true })).toEqual({
        err: null,
        address: [{ address: '93.184.216.34', family: 4 }],
        family: undefined,
      });
    });

    it('passes resolver errors through unchanged', async () => {
      const notFound = Object.assign(new Error('getaddrinfo ENOTFOUND'), { code: 'ENOTFOUND' });
      jest.spyOn(dns, 'lookup').mockImplementation(((_host: string, _opts: unknown, cb: any) => {
        cb(notFound);
      }) as any);
      const { err } = await runLookup({});
      expect(err).toBe(notFound);
    });
  });

  describe('DNS rebinding (real sockets)', () => {
    let server: http.Server;
    let port = 0;
    let hits = 0;

    beforeEach(async () => {
      hits = 0;
      server = http.createServer((_req, res) => {
        hits += 1;
        res.end('internal');
      });
      await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
      port = (server.address() as AddressInfo).port;

      // The pre-connection check sees a public address; the lookup made for the
      // connection itself is answered with loopback, as a rebinding server would.
      jest
        .spyOn(dnsPromises, 'lookup')
        .mockResolvedValue([{ address: '93.184.216.34', family: 4 }] as any);
      jest.spyOn(dns, 'lookup').mockImplementation(((_host: string, _opts: unknown, cb: any) => {
        cb(null, [{ address: '127.0.0.1', family: 4 }]);
      }) as any);
    });

    afterEach(async () => {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    });

    it('safeFetch never connects to the rebound address', async () => {
      await expect(safeFetch(`http://rebind.example.test:${port}/`)).rejects.toThrow(
        'private address (SSRF protection)'
      );
      expect(dns.lookup).toHaveBeenCalledWith('rebind.example.test', expect.anything(), expect.any(Function));
      expect(hits).toBe(0);
    });

    it('safeAxios never connects to the rebound address', async () => {
      await expect(
        safeAxios({ url: `http://rebind.example.test:${port}/`, method: 'get' }, 'rebinding test')
      ).rejects.toThrow('private address (SSRF protection: rebinding test)');
      expect(hits).toBe(0);
    });
  });

  describe('isPrivateIp', () => {
    it.each([
      '0.0.0.0',
      '0.1.2.3',
      '100.64.0.1',
      '100.100.100.200',
      '198.18.0.1',
      '224.0.0.1',
      '255.255.255.255',
      '::ffff:7f00:1',
      '::127.0.0.1',
      '64:ff9b::a9fe:a9fe',
      '2002:a9fe:a9fe::1',
      'ff02::1',
      'fec0::1',
    ])('treats %s as non-public', (ip) => {
      expect(isPrivateIp(ip)).toBe(true);
    });

    it.each(['8.8.8.8', '100.63.255.255', '100.128.0.1', '2606:4700::1111', '64:ff9b::808:808'])(
      'treats %s as public',
      (ip) => {
        expect(isPrivateIp(ip)).toBe(false);
      }
    );
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
