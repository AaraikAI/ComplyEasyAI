import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally before importing api
const mockFetch = vi.fn();
(globalThis as any).fetch = mockFetch;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
(globalThis as any).localStorage = localStorageMock;

// Mock import.meta.env
vi.stubGlobal('importMeta', { env: { VITE_API_URL: 'http://localhost:3001/api', DEV: false } });

import { api, __clearCsrfCacheForTest } from '../../../services/api';

function mockOkResponse(data: any = {}) {
  return {
    ok: true,
    status: 200,
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Headers({ 'content-type': 'application/json' }),
  };
}

describe('api.auth contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __clearCsrfCacheForTest();
    // Default: first call is CSRF fetch, second is actual call
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/csrf-token')) {
        return mockOkResponse({ csrfToken: 'test-csrf-token' });
      }
      return mockOkResponse({});
    });
  });

  describe('requestMagicLink', () => {
    it('should call POST /api/auth/magic-link with email', async () => {
      await api.auth.requestMagicLink('user@example.com');
      const calls = mockFetch.mock.calls.filter(([u]: any) => !u.includes('/csrf-token'));
      expect(calls).toHaveLength(1);
      const [url, options] = calls[0];
      expect(url).toContain('/api/auth/magic-link');
      expect(options.method).toBe('POST');
      expect(options.credentials).toBe('include');
      const body = JSON.parse(options.body);
      expect(body).toEqual({ email: 'user@example.com' });
      expect(options.headers['Content-Type']).toBe('application/json');
      expect(options.headers['X-CSRF-Token']).toBe('test-csrf-token');
    });
  });

  describe('verifyMagicLink', () => {
    it('should call POST /api/auth/verify with token', async () => {
      mockFetch.mockImplementation(async (url: string) => {
        if (url.includes('/csrf-token')) return mockOkResponse({ csrfToken: 'test-csrf-token' });
        return mockOkResponse({
          accessToken: 'tok123',
          user: { id: '1', name: 'Test', email: 'test@example.com', role: 'admin' },
        });
      });
      await api.auth.verifyMagicLink('magic-token-123');
      const calls = mockFetch.mock.calls.filter(([u]: any) => !u.includes('/csrf-token'));
      const [url, options] = calls[0];
      expect(url).toContain('/api/auth/verify');
      expect(options.method).toBe('POST');
      const body = JSON.parse(options.body);
      expect(body).toEqual({ token: 'magic-token-123' });
    });
  });

  describe('register', () => {
    it('should call POST /api/auth/register with all fields', async () => {
      await api.auth.register('John', 'john@example.com', 'Acme Inc', 'pass123', 'Tech', '50-100', 'SOC2', 'Google');
      const calls = mockFetch.mock.calls.filter(([u]: any) => !u.includes('/csrf-token'));
      const [url, options] = calls[0];
      expect(url).toContain('/api/auth/register');
      expect(options.method).toBe('POST');
      const body = JSON.parse(options.body);
      expect(body).toHaveProperty('name', 'John');
      expect(body).toHaveProperty('email', 'john@example.com');
      expect(body).toHaveProperty('organizationName', 'Acme Inc');
      expect(body).toHaveProperty('password', 'pass123');
      expect(body).toHaveProperty('industry', 'Tech');
      expect(body).toHaveProperty('companySize', '50-100');
      expect(body).toHaveProperty('primaryComplianceGoal', 'SOC2');
      expect(body).toHaveProperty('howDidYouHear', 'Google');
      expect(options.headers['X-CSRF-Token']).toBe('test-csrf-token');
    });
  });

  describe('login', () => {
    it('should call POST /api/auth/login with email and password', async () => {
      mockFetch.mockImplementation(async (url: string) => {
        if (url.includes('/csrf-token')) return mockOkResponse({ csrfToken: 'test-csrf-token' });
        return mockOkResponse({
          accessToken: 'tok123',
          user: { id: '1', name: 'Test User', email: 'test@example.com', role: 'admin' },
        });
      });
      await api.auth.login('test@example.com', 'password123');
      const calls = mockFetch.mock.calls.filter(([u]: any) => !u.includes('/csrf-token'));
      const [url, options] = calls[0];
      expect(url).toContain('/api/auth/login');
      expect(options.method).toBe('POST');
      const body = JSON.parse(options.body);
      expect(body).toEqual({ email: 'test@example.com', password: 'password123' });
    });
  });

  describe('refreshToken', () => {
    it('should call POST /api/auth/refresh', async () => {
      mockFetch.mockImplementation(async (url: string) => {
        if (url.includes('/csrf-token')) return mockOkResponse({ csrfToken: 'test-csrf-token' });
        return mockOkResponse({ accessToken: 'new-tok' });
      });
      await api.auth.refreshToken();
      const calls = mockFetch.mock.calls.filter(([u]: any) => !u.includes('/csrf-token'));
      const [url, options] = calls[0];
      expect(url).toContain('/api/auth/refresh');
      expect(options.method).toBe('POST');
    });
  });

  describe('logout', () => {
    it('should call POST /api/auth/logout', async () => {
      await api.auth.logout();
      const calls = mockFetch.mock.calls.filter(([u]: any) => !u.includes('/csrf-token'));
      const [url, options] = calls[0];
      expect(url).toContain('/api/auth/logout');
      expect(options.method).toBe('POST');
    });
  });

  describe('uploadAvatar', () => {
    it('should call POST /api/auth/profile/avatar with FormData', async () => {
      mockFetch.mockImplementation(async (url: string) => {
        if (url.includes('/csrf-token')) return mockOkResponse({ csrfToken: 'test-csrf-token' });
        return mockOkResponse({ user: { avatar: 'avatar-url' } });
      });
      const file = new File(['data'], 'avatar.png', { type: 'image/png' });
      await api.auth.uploadAvatar(file);
      const calls = mockFetch.mock.calls.filter(([u]: any) => u.includes('/avatar'));
      expect(calls).toHaveLength(1);
      const [url, options] = calls[0];
      expect(url).toContain('/api/auth/profile/avatar');
      expect(options.method).toBe('POST');
      expect(options.body).toBeInstanceOf(FormData);
      expect(options.credentials).toBe('include');
    });
  });

  describe('updateProfile', () => {
    it('should call PATCH /api/auth/profile with updates', async () => {
      await api.auth.updateProfile({ name: 'New Name' });
      const calls = mockFetch.mock.calls.filter(([u]: any) => !u.includes('/csrf-token'));
      const [url, options] = calls[0];
      expect(url).toContain('/api/auth/profile');
      expect(options.method).toBe('PATCH');
      const body = JSON.parse(options.body);
      expect(body).toEqual({ name: 'New Name' });
      expect(options.headers['X-CSRF-Token']).toBe('test-csrf-token');
    });
  });

  describe('changePassword', () => {
    it('should call PATCH /api/auth/password with current and new password', async () => {
      await api.auth.changePassword('oldPass', 'newPass');
      const calls = mockFetch.mock.calls.filter(([u]: any) => !u.includes('/csrf-token'));
      const [url, options] = calls[0];
      expect(url).toContain('/api/auth/password');
      expect(options.method).toBe('PATCH');
      const body = JSON.parse(options.body);
      expect(body).toEqual({ currentPassword: 'oldPass', newPassword: 'newPass' });
    });
  });
});
