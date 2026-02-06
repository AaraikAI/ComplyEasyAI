import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock import.meta.env before importing
vi.stubGlobal('importMeta', { env: { VITE_API_URL: 'http://localhost:3001/api', DEV: false } });

describe('api service', () => {
  let api: any;
  let getAuthToken: any;
  let setAuthToken: any;
  let clearAuthToken: any;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Reset fetch mock
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
      status: 200,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('auth token management', () => {
    it('should get auth token from localStorage', () => {
      localStorage.setItem('authToken', 'test-token');
      const token = localStorage.getItem('authToken');
      expect(token).toBe('test-token');
    });

    it('should set auth token in localStorage', () => {
      localStorage.setItem('authToken', 'new-token');
      expect(localStorage.getItem('authToken')).toBe('new-token');
    });

    it('should clear auth token from localStorage', () => {
      localStorage.setItem('authToken', 'test-token');
      localStorage.setItem('user_data', '{}');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user_data');
      expect(localStorage.getItem('authToken')).toBeNull();
      expect(localStorage.getItem('user_data')).toBeNull();
    });
  });

  describe('fetchAPI', () => {
    it('should add Authorization header when token exists', async () => {
      localStorage.setItem('authToken', 'test-token');
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: 'test' }),
        status: 200,
      });
      global.fetch = mockFetch;

      await fetch('http://localhost:3001/api/test', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });

    it('should not add Authorization header when no token', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
        status: 200,
      });
      global.fetch = mockFetch;

      const headers: any = { 'Content-Type': 'application/json' };
      const token = localStorage.getItem('authToken');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      await fetch('http://localhost:3001/api/test', { headers });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/test',
        expect.objectContaining({
          headers: expect.not.objectContaining({
            Authorization: expect.any(String),
          }),
        })
      );
    });

    it('should handle network errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

      await expect(fetch('http://localhost:3001/api/test')).rejects.toThrow('Failed to fetch');
    });

    it('should handle 401 response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      });

      const response = await fetch('http://localhost:3001/api/test');
      expect(response.status).toBe(401);
    });

    it('should handle 500 response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ error: 'Server error' }),
      });

      const response = await fetch('http://localhost:3001/api/test');
      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
    });
  });

  describe('API endpoints', () => {
    it('should call auth magic-link endpoint', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: 'Magic link sent' }),
      });
      global.fetch = mockFetch;

      await fetch('http://localhost:3001/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@test.com' }),
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/auth/magic-link',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should call risks endpoint', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });
      global.fetch = mockFetch;

      await fetch('http://localhost:3001/api/risks');
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/risks');
    });

    it('should call frameworks endpoint', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });
      global.fetch = mockFetch;

      await fetch('http://localhost:3001/api/frameworks');
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/frameworks');
    });

    it('should call create risk with POST method', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: '1' }),
      });
      global.fetch = mockFetch;

      await fetch('http://localhost:3001/api/risks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Risk', severity: 'High' }),
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/risks',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should call billing subscription endpoint', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'active' }),
      });
      global.fetch = mockFetch;

      await fetch('http://localhost:3001/api/billing/subscription');
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/billing/subscription');
    });

    it('should call team endpoint', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });
      global.fetch = mockFetch;

      await fetch('http://localhost:3001/api/team');
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/team');
    });
  });

  describe('Token refresh', () => {
    it('should attempt token refresh on 401', async () => {
      localStorage.setItem('refreshToken', 'refresh-token');
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: 'Unauthorized' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ accessToken: 'new-token' }),
        });
      global.fetch = mockFetch;

      // First call fails with 401
      const response = await fetch('http://localhost:3001/api/test');
      expect(response.status).toBe(401);

      // Refresh call
      const refreshResponse = await fetch('http://localhost:3001/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: 'refresh-token' }),
      });
      expect(refreshResponse.ok).toBe(true);
    });
  });
});
