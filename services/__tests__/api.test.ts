import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---- helpers for window.location mock ----
const originalLocation = window.location;

// We import the module; module-level code uses import.meta.env which Vitest provides.
// API_BASE_URL will resolve to 'http://localhost:3001/api' (the default fallback).
import { api, getAuthToken, setAuthToken, clearAuthToken, __clearCsrfCacheForTest } from '../api';

const API = 'http://localhost:3001/api';

/** Helper: create a successful fetch Response mock */
function ok(body: any = {}) {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
    blob: () => Promise.resolve(new Blob(['data'])),
    headers: new Headers(),
  };
}

/** Helper: create a failed fetch Response mock */
function fail(status: number, body: any = {}, statusText = '') {
  return {
    ok: false,
    status,
    statusText,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
    headers: new Headers(),
  };
}

/**
 * Get the fetch call that matches the given URL path (e.g. '/billing/features/feat1/subscribe').
 * For state-changing requests, fetchAPI may call getCsrfToken() first, so the first call is often
 * to /csrf-token; the actual API call is a later call. Use this to get the call for the endpoint under test.
 */
function getCallForEndpoint(mock: ReturnType<typeof vi.fn>, pathPart: string): [string, RequestInit] | undefined {
  const calls = mock.mock.calls as [string, RequestInit][];
  return calls.find((c) => typeof c[0] === 'string' && c[0].includes(pathPart));
}

/** Parse request body from a fetch call; returns {} if no body. */
function parseBodyFromCall(call: [string, RequestInit] | undefined): Record<string, unknown> {
  if (!call?.[1]?.body) return {};
  try {
    return JSON.parse(typeof call[1].body === 'string' ? call[1].body : '{}');
  } catch {
    return {};
  }
}

describe('api service', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    __clearCsrfCacheForTest();

    mockFetch = vi.fn().mockResolvedValue(ok({}));
    global.fetch = mockFetch as any;

    // Prevent window.location.href assignment from causing jsdom navigation errors
    delete (window as any).location;
    (window as any).location = { href: '', assign: vi.fn(), replace: vi.fn() };
  });

  afterEach(() => {
    window.location = originalLocation;
    vi.restoreAllMocks();
  });

  // =========================================================================
  // EXPORTED HELPER FUNCTIONS
  // =========================================================================
  describe('getAuthToken / setAuthToken / clearAuthToken', () => {
    it('getAuthToken returns token from localStorage', () => {
      localStorage.setItem('authToken', 'abc123');
      expect(getAuthToken()).toBe('abc123');
    });

    it('getAuthToken returns null when no token stored', () => {
      expect(getAuthToken()).toBeNull();
    });

    it('setAuthToken stores token in localStorage', () => {
      setAuthToken('xyz789');
      expect(localStorage.getItem('authToken')).toBe('xyz789');
    });

    it('clearAuthToken removes authToken and user_data', () => {
      localStorage.setItem('authToken', 'tok');
      localStorage.setItem('user_data', '{}');
      clearAuthToken();
      expect(localStorage.getItem('authToken')).toBeNull();
      expect(localStorage.getItem('user_data')).toBeNull();
    });
  });

  // =========================================================================
  // fetchAPI CORE BEHAVIOR (tested through api methods)
  // =========================================================================
  describe('fetchAPI core behavior', () => {
    it('adds Authorization header when auth token exists', async () => {
      localStorage.setItem('authToken', 'my-token');
      mockFetch.mockResolvedValueOnce(ok({ data: 1 }));

      await api.risks.list();

      expect(mockFetch).toHaveBeenCalledWith(
        `${API}/risks`,
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer my-token' }),
        }),
      );
    });

    it('does NOT add Authorization header when no token', async () => {
      mockFetch.mockResolvedValueOnce(ok([]));
      await api.risks.list();

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers.Authorization).toBeUndefined();
    });

    it('returns parsed JSON on success', async () => {
      mockFetch.mockResolvedValueOnce(ok({ items: [1, 2] }));
      const result = await api.audit.list();
      expect(result).toEqual({ items: [1, 2] });
    });

    // 401 handling: refresh succeeds
    it('refreshes token on 401 when refresh token exists and refresh succeeds', async () => {
      localStorage.setItem('authToken', 'old-token');
      localStorage.setItem('refreshToken', 'r-token');

      // 1st call -> list returns 401
      mockFetch.mockResolvedValueOnce(fail(401, { error: 'Unauthorized' }));
      // 2nd call -> getCsrfToken() (inside 401 handler before /auth/refresh)
      mockFetch.mockResolvedValueOnce(ok({ csrfToken: 'csrf' }));
      // 3rd call -> refresh succeeds
      mockFetch.mockResolvedValueOnce(ok({ accessToken: 'new-token' }));
      // 4th call -> retry succeeds
      mockFetch.mockResolvedValueOnce(ok({ data: 'retried' }));

      const result = await api.audit.list();
      expect(result).toEqual({ data: 'retried' });
      expect(localStorage.getItem('authToken')).toBe('new-token');
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });

    // 401 handling: refresh fails (refresh response not ok)
    it('clears auth and throws on 401 when refresh response is not ok', async () => {
      localStorage.setItem('authToken', 'tok');
      localStorage.setItem('refreshToken', 'r-tok');

      mockFetch.mockResolvedValueOnce(fail(401, { error: 'Unauthorized' }));
      mockFetch.mockResolvedValueOnce(ok({ csrfToken: 'csrf' }));
      mockFetch.mockResolvedValueOnce(fail(403, { error: 'Forbidden' }));

      await expect(api.audit.list()).rejects.toThrow('Session expired');
      expect(localStorage.getItem('authToken')).toBeNull();
    });

    // 401 handling: refresh throws network error
    it('clears auth and throws on 401 when refresh throws', async () => {
      localStorage.setItem('authToken', 'tok');
      localStorage.setItem('refreshToken', 'r-tok');

      mockFetch.mockResolvedValueOnce(fail(401, { error: 'Unauthorized' }));
      mockFetch.mockResolvedValueOnce(ok({ csrfToken: 'csrf' }));
      mockFetch.mockRejectedValueOnce(new Error('network'));

      await expect(api.audit.list()).rejects.toThrow('Session expired');
      expect(localStorage.getItem('authToken')).toBeNull();
    });

    // 401 handling: no refresh token
    it('clears auth and throws on 401 when no refresh token stored', async () => {
      localStorage.setItem('authToken', 'tok');

      mockFetch.mockResolvedValueOnce(fail(401, { error: 'Unauthorized' }));

      await expect(api.audit.list()).rejects.toThrow('Session expired');
      expect(localStorage.getItem('authToken')).toBeNull();
      expect(window.location.href).toBe('/');
    });

    // 401 handling: retry after refresh also fails
    it('returns refresh data when retry after refresh is not ok', async () => {
      localStorage.setItem('authToken', 'tok');
      localStorage.setItem('refreshToken', 'r-tok');

      mockFetch.mockResolvedValueOnce(fail(401, { error: 'Unauthorized' }));
      mockFetch.mockResolvedValueOnce(ok({ csrfToken: 'csrf' }));
      mockFetch.mockResolvedValueOnce(ok({ accessToken: 'new-token' }));
      mockFetch.mockResolvedValueOnce(fail(403, { error: 'Forbidden' }));

      // The code path falls through to clear auth when retryResponse is not ok
      await expect(api.audit.list()).rejects.toThrow('Session expired');
    });

    // 501 error
    it('throws object with status 501 on 501 response', async () => {
      mockFetch.mockResolvedValueOnce(fail(501, { error: 'Not Implemented', feature: 'x' }));

      try {
        await api.audit.list();
        expect.unreachable('should have thrown');
      } catch (e: any) {
        expect(e.status).toBe(501);
        expect(e.message).toBe('Not Implemented');
        expect(e.feature).toBe('x');
      }
    });

    // Generic HTTP error
    it('throws Error with message from error.error field', async () => {
      mockFetch.mockResolvedValueOnce(fail(400, { error: 'Bad input' }, 'Bad Request'));

      await expect(api.audit.list()).rejects.toThrow('Bad input');
    });

    it('throws Error with message from error.message field', async () => {
      mockFetch.mockResolvedValueOnce(fail(422, { message: 'Validation failed' }));

      await expect(api.audit.list()).rejects.toThrow('Validation failed');
    });

    it('throws Error with HTTP status when no error message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.reject(new Error('not json')),
      });

      await expect(api.audit.list()).rejects.toThrow('HTTP 500: Internal Server Error');
    });

    // Network error (TypeError with 'fetch')
    it('throws friendly message on network TypeError', async () => {
      const err = new TypeError('Failed to fetch');
      mockFetch.mockRejectedValueOnce(err);

      await expect(api.audit.list()).rejects.toThrow('Cannot connect to backend server');
    });

    // Non-network error re-thrown
    it('re-throws non-network errors', async () => {
      const err = new Error('something else');
      mockFetch.mockRejectedValueOnce(err);

      await expect(api.audit.list()).rejects.toThrow('something else');
    });
  });

  // =========================================================================
  // api.auth
  // =========================================================================
  describe('api.auth', () => {
    it('requestMagicLink sends POST with email', async () => {
      mockFetch.mockResolvedValueOnce(ok({ message: 'sent' }));
      await api.auth.requestMagicLink('a@b.com');

      expect(mockFetch).toHaveBeenCalledWith(
        `${API}/auth/magic-link`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'a@b.com' }),
        }),
      );
    });

    it('verifyMagicLink stores tokens, returns mapped user', async () => {
      mockFetch.mockResolvedValueOnce(ok({ csrfToken: 'csrf' }));
      mockFetch.mockResolvedValueOnce(
        ok({
          accessToken: 'at',
          refreshToken: 'rt',
          user: {
            id: '1',
            name: 'Alice',
            email: 'alice@test.com',
            role: 'admin',
            avatar: null,
            organization: { id: 'o1', name: 'Org', plan: 'Pro' },
          },
        }),
      );

      const user = await api.auth.verifyMagicLink('tok');

      expect(localStorage.getItem('authToken')).toBe('at');
      expect(localStorage.getItem('refreshToken')).toBe('rt');
      expect(user.id).toBe('1');
      expect(user.avatar).toBe('AL'); // first 2 chars uppercase
      expect(user.organization).toEqual({ id: 'o1', name: 'Org', plan: 'Pro' });
    });

    it('verifyMagicLink uses avatar when provided', async () => {
      mockFetch.mockResolvedValueOnce(ok({ csrfToken: 'csrf' }));
      mockFetch.mockResolvedValueOnce(
        ok({
          accessToken: 'at',
          refreshToken: 'rt',
          user: {
            id: '2',
            name: 'Bob',
            email: 'bob@test.com',
            role: 'user',
            avatar: 'custom-avatar.png',
            organizationId: 'o2',
          },
        }),
      );

      const user = await api.auth.verifyMagicLink('tok');
      expect(user.avatar).toBe('custom-avatar.png');
      expect(user.organizationId).toBe('o2');
      expect(user.organization).toBeUndefined();
    });

    it('verifyMagicLink throws when no access token', async () => {
      mockFetch.mockResolvedValueOnce(ok({ csrfToken: 'csrf' }));
      mockFetch.mockResolvedValueOnce(ok({ user: { id: '1' } }));
      await expect(api.auth.verifyMagicLink('tok')).rejects.toThrow('No access token received');
    });

    it('register sends POST with all fields', async () => {
      mockFetch.mockResolvedValueOnce(ok({ success: true }));
      await api.auth.register('Name', 'e@e.com', 'Org', 'pw', 'tech', '10-50', 'SOC2', 'google');

      expect(mockFetch).toHaveBeenCalledWith(
        `${API}/auth/register`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            name: 'Name',
            email: 'e@e.com',
            organizationName: 'Org',
            password: 'pw',
            industry: 'tech',
            companySize: '10-50',
            primaryComplianceGoal: 'SOC2',
            howDidYouHear: 'google',
          }),
        }),
      );
    });

    it('login stores tokens and returns mapped user', async () => {
      mockFetch.mockResolvedValueOnce(ok({ csrfToken: 'csrf' }));
      mockFetch.mockResolvedValueOnce(
        ok({
          accessToken: 'at',
          refreshToken: 'rt',
          user: { id: '1', name: 'Alice', email: 'a@b.com', role: 'admin', avatar: null, organization: { id: 'o1', name: 'O', plan: 'Basic' } },
        }),
      );

      const user = await api.auth.login('a@b.com', 'pw');
      expect(localStorage.getItem('authToken')).toBe('at');
      expect(user.avatar).toBe('AL');
      expect(user.organization).toBeDefined();
    });

    it('login throws when no access token', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await expect(api.auth.login('a@b.com', 'pw')).rejects.toThrow('No access token received');
    });

    it('refreshToken sends POST and updates token', async () => {
      localStorage.setItem('refreshToken', 'rt');
      mockFetch.mockResolvedValueOnce(ok({ csrfToken: 'csrf' }));
      mockFetch.mockResolvedValueOnce(ok({ accessToken: 'new-at' }));

      await api.auth.refreshToken();
      expect(localStorage.getItem('authToken')).toBe('new-at');
    });

    it('refreshToken throws when no refresh token stored', async () => {
      await expect(api.auth.refreshToken()).rejects.toThrow('No refresh token');
    });

    it('logout clears auth data', () => {
      localStorage.setItem('authToken', 'tok');
      localStorage.setItem('user_data', '{}');
      api.auth.logout();
      expect(localStorage.getItem('authToken')).toBeNull();
      expect(localStorage.getItem('user_data')).toBeNull();
    });

    it('uploadAvatar sends FormData via raw fetch', async () => {
      mockFetch.mockResolvedValueOnce(ok({ user: { avatar: 'url' } }));
      localStorage.setItem('authToken', 'tok');
      localStorage.setItem('user_data', JSON.stringify({ name: 'A' }));

      const file = new File(['img'], 'avatar.png', { type: 'image/png' });
      const result = await api.auth.uploadAvatar(file);

      expect(result.user.avatar).toBe('url');
      const savedUser = JSON.parse(localStorage.getItem('user_data')!);
      expect(savedUser.avatar).toBe('url');
    });

    it('uploadAvatar throws on error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: 'Too large' }),
      });

      const file = new File(['img'], 'avatar.png');
      await expect(api.auth.uploadAvatar(file)).rejects.toThrow('Too large');
    });

    it('uploadAvatar handles json parse failure on error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('no json')),
      });

      const file = new File(['img'], 'avatar.png');
      await expect(api.auth.uploadAvatar(file)).rejects.toThrow('Upload failed');
    });

    it('updateProfile sends PATCH', async () => {
      mockFetch.mockResolvedValueOnce(ok({ user: { name: 'New' } }));
      await api.auth.updateProfile({ name: 'New' });

      expect(mockFetch).toHaveBeenCalledWith(
        `${API}/auth/profile`,
        expect.objectContaining({ method: 'PATCH' }),
      );
    });

    it('changePassword sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({ success: true }));
      await api.auth.changePassword('old', 'new');

      expect(mockFetch).toHaveBeenCalledWith(
        `${API}/auth/change-password`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ currentPassword: 'old', newPassword: 'new' }),
        }),
      );
    });
  });

  // =========================================================================
  // api.user (removed – uploadAvatar, updateProfile, changePassword now
  // live exclusively under api.auth to eliminate endpoint duplication)
  // =========================================================================

  // =========================================================================
  // api.risks
  // =========================================================================
  describe('api.risks', () => {
    it('list without params', async () => {
      mockFetch.mockResolvedValueOnce(ok([]));
      await api.risks.list();
      expect(mockFetch).toHaveBeenCalledWith(`${API}/risks`, expect.any(Object));
    });

    it('list with params adds query string', async () => {
      mockFetch.mockResolvedValueOnce(ok([]));
      await api.risks.list({ status: 'open', severity: 'high' });
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('status=open');
      expect(url).toContain('severity=high');
    });

    it('getById fetches correct endpoint', async () => {
      mockFetch.mockResolvedValueOnce(ok({ id: 'r1' }));
      await api.risks.getById('r1');
      expect(mockFetch).toHaveBeenCalledWith(`${API}/risks/r1`, expect.any(Object));
    });

    it('create sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({ id: 'r1' }));
      await api.risks.create({ title: 'Risk' } as any);
      expect(mockFetch).toHaveBeenCalledWith(
        `${API}/risks`,
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('update sends PATCH', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.risks.update('r1', { title: 'Updated' } as any);
      expect(mockFetch).toHaveBeenCalledWith(
        `${API}/risks/r1`,
        expect.objectContaining({ method: 'PATCH' }),
      );
    });

    it('delete sends DELETE', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.risks.delete('r1');
      expect(mockFetch).toHaveBeenCalledWith(
        `${API}/risks/r1`,
        expect.objectContaining({ method: 'DELETE' }),
      );
    });

    it('prioritize sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok([]));
      await api.risks.prioritize();
      expect(mockFetch).toHaveBeenCalledWith(
        `${API}/risks/prioritize`,
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('generateRemediation sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.risks.generateRemediation('r1');
      expect(mockFetch).toHaveBeenCalledWith(
        `${API}/risks/r1/remediation`,
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('scan sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.risks.scan();
      expect(mockFetch).toHaveBeenCalledWith(
        `${API}/risks/scan`,
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  // =========================================================================
  // api.frameworks
  // =========================================================================
  describe('api.frameworks', () => {
    it('list fetches /frameworks', async () => {
      mockFetch.mockResolvedValueOnce(ok([]));
      await api.frameworks.list();
      expect(mockFetch).toHaveBeenCalledWith(`${API}/frameworks`, expect.any(Object));
    });

    it('getById without queryParams', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.frameworks.getById('f1');
      expect(mockFetch).toHaveBeenCalledWith(`${API}/frameworks/f1`, expect.any(Object));
    });

    it('getById with queryParams', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.frameworks.getById('f1', 'include=controls');
      expect(mockFetch).toHaveBeenCalledWith(`${API}/frameworks/f1?include=controls`, expect.any(Object));
    });

    it('exportControl fetches correct endpoint', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.frameworks.exportControl('f1', 'c1');
      expect(mockFetch).toHaveBeenCalledWith(`${API}/frameworks/f1/controls/c1/export`, expect.any(Object));
    });

    it('createControl sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.frameworks.createControl('f1', { name: 'Control' });
      expect(mockFetch).toHaveBeenCalledWith(
        `${API}/frameworks/f1/controls`,
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('updateControl sends PATCH', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.frameworks.updateControl('f1', 'c1', { status: 'done' });
      expect(mockFetch).toHaveBeenCalledWith(
        `${API}/frameworks/f1/controls/c1`,
        expect.objectContaining({ method: 'PATCH' }),
      );
    });

    it('bulkUpdateControls sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.frameworks.bulkUpdateControls('f1', { controlIds: ['c1'], status: 'done' });
      expect(mockFetch).toHaveBeenCalledWith(
        `${API}/frameworks/f1/controls/bulk-update`,
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('deleteControl sends DELETE', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.frameworks.deleteControl('f1', 'c1');
      expect(mockFetch).toHaveBeenCalledWith(
        `${API}/frameworks/f1/controls/c1`,
        expect.objectContaining({ method: 'DELETE' }),
      );
    });

    it('uploadEvidence sends FormData via raw fetch', async () => {
      localStorage.setItem('authToken', 'tok');
      mockFetch.mockResolvedValueOnce(ok({ success: true }));

      const formData = new FormData();
      await api.frameworks.uploadEvidence('f1', 'c1', formData);

      expect(mockFetch).toHaveBeenCalledWith(
        `${API}/frameworks/f1/controls/c1/evidence`,
        expect.objectContaining({ method: 'POST', body: formData }),
      );
    });

    it('uploadEvidence throws on error', async () => {
      mockFetch.mockResolvedValueOnce(fail(400, { error: 'Too big' }));
      const formData = new FormData();
      await expect(api.frameworks.uploadEvidence('f1', 'c1', formData)).rejects.toThrow('Too big');
    });

    it('uploadEvidence handles json parse failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Error',
        json: () => Promise.reject(new Error('no json')),
      });
      const formData = new FormData();
      await expect(api.frameworks.uploadEvidence('f1', 'c1', formData)).rejects.toThrow('HTTP 500');
    });

    it('getEvidenceUrl fetches correct URL', async () => {
      mockFetch.mockResolvedValueOnce(ok({ url: 'https://s3/file' }));
      const result = await api.frameworks.getEvidenceUrl('f1', 'c1');
      expect(result.url).toBe('https://s3/file');
    });

    it('smartUpload sends FormData via raw fetch', async () => {
      localStorage.setItem('authToken', 'tok');
      mockFetch.mockResolvedValueOnce(ok({ matched: 3 }));
      const formData = new FormData();
      const result = await api.frameworks.smartUpload('f1', formData);
      expect(result.matched).toBe(3);
    });

    it('smartUpload throws on error', async () => {
      mockFetch.mockResolvedValueOnce(fail(400, { error: 'Invalid file' }));
      await expect(api.frameworks.smartUpload('f1', new FormData())).rejects.toThrow('Invalid file');
    });

    it('getSuggestions fetches correct endpoint', async () => {
      mockFetch.mockResolvedValueOnce(ok({ suggestions: [] }));
      await api.frameworks.getSuggestions('f1');
      expect(mockFetch).toHaveBeenCalledWith(`${API}/frameworks/f1/suggestions`, expect.any(Object));
    });

    it('acceptSuggestion sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.frameworks.acceptSuggestion('s1');
      expect(mockFetch).toHaveBeenCalledWith(
        `${API}/frameworks/suggestions/s1/accept`,
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('rejectSuggestion sends POST with feedback', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.frameworks.rejectSuggestion('s1', 'not relevant');
      expect(mockFetch).toHaveBeenCalledWith(
        `${API}/frameworks/suggestions/s1/reject`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ feedback: 'not relevant' }),
        }),
      );
    });

    it('create sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.frameworks.create({ name: 'SOC2' } as any);
      expect(mockFetch).toHaveBeenCalledWith(
        `${API}/frameworks`,
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('update sends PATCH', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.frameworks.update('f1', { name: 'Updated' } as any);
      expect(mockFetch).toHaveBeenCalledWith(
        `${API}/frameworks/f1`,
        expect.objectContaining({ method: 'PATCH' }),
      );
    });

    it('delete sends DELETE', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.frameworks.delete('f1');
      expect(mockFetch).toHaveBeenCalledWith(
        `${API}/frameworks/f1`,
        expect.objectContaining({ method: 'DELETE' }),
      );
    });

    it('getControlMappings fetches correct endpoint', async () => {
      mockFetch.mockResolvedValueOnce(ok([]));
      await api.frameworks.getControlMappings('c1');
      expect(mockFetch).toHaveBeenCalledWith(`${API}/control-mappings/control/c1`, expect.any(Object));
    });

    it('createControlMapping sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.frameworks.createControlMapping({
        sourceControlId: 'c1',
        targetControlId: 'c2',
        mappingType: 'equivalent',
        confidence: 0.9,
      });
      expect(mockFetch).toHaveBeenCalledWith(
        `${API}/control-mappings`,
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('deleteControlMapping sends DELETE', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.frameworks.deleteControlMapping('m1');
      expect(mockFetch).toHaveBeenCalledWith(
        `${API}/control-mappings/m1`,
        expect.objectContaining({ method: 'DELETE' }),
      );
    });

    it('exportControlMappings downloads CSV via raw fetch', async () => {
      localStorage.setItem('authToken', 'tok');
      const blobMock = new Blob(['csv-data']);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(blobMock),
      });
      const createObjectURL = vi.fn().mockReturnValue('blob:url');
      const revokeObjectURL = vi.fn();
      window.URL.createObjectURL = createObjectURL;
      window.URL.revokeObjectURL = revokeObjectURL;

      const clickSpy = vi.fn();
      vi.spyOn(document, 'createElement').mockReturnValue({
        href: '',
        download: '',
        click: clickSpy,
        style: {},
      } as any);
      vi.spyOn(document.body, 'appendChild').mockImplementation((node: any) => node);
      vi.spyOn(document.body, 'removeChild').mockImplementation((node: any) => node);

      await api.frameworks.exportControlMappings();

      expect(createObjectURL).toHaveBeenCalledWith(blobMock);
      expect(clickSpy).toHaveBeenCalled();
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:url');
    });

    it('exportControlMappings throws on error', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(api.frameworks.exportControlMappings()).rejects.toThrow('Failed to export');
    });

    it('getEvidenceVersions fetches correct endpoint', async () => {
      mockFetch.mockResolvedValueOnce(ok([]));
      await api.frameworks.getEvidenceVersions('c1');
      expect(mockFetch).toHaveBeenCalledWith(`${API}/evidence-versions/control/c1`, expect.any(Object));
    });

    it('restoreEvidenceVersion sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.frameworks.restoreEvidenceVersion('c1', 'v1');
      expect(mockFetch).toHaveBeenCalledWith(
        `${API}/evidence-versions/control/c1/restore/v1`,
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('deleteEvidenceVersion sends DELETE', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.frameworks.deleteEvidenceVersion('c1', 'v1');
      expect(mockFetch).toHaveBeenCalledWith(
        `${API}/evidence-versions/control/c1/v1`,
        expect.objectContaining({ method: 'DELETE' }),
      );
    });

    it('getTemplates fetches /frameworks/templates', async () => {
      mockFetch.mockResolvedValueOnce(ok({ templates: [] }));
      await api.frameworks.getTemplates();
      expect(mockFetch).toHaveBeenCalledWith(`${API}/frameworks/templates`, expect.any(Object));
    });

    it('getTemplateControls encodes framework type', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.frameworks.getTemplateControls('SOC 2');
      expect(mockFetch).toHaveBeenCalledWith(`${API}/frameworks/templates/SOC%202`, expect.any(Object));
    });

    it('applyTemplate sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({ applied: 5 }));
      await api.frameworks.applyTemplate('f1', 'SOC2');
      expect(mockFetch).toHaveBeenCalledWith(
        `${API}/frameworks/f1/apply-template`,
        expect.objectContaining({ method: 'POST', body: JSON.stringify({ frameworkType: 'SOC2' }) }),
      );
    });
  });

  // =========================================================================
  // api.ai
  // =========================================================================
  describe('api.ai', () => {
    it('generateReport sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({ report: 'text' }));
      await api.ai.generateReport('SOC2', 'Acme', 'context');
      expect(mockFetch).toHaveBeenCalledWith(
        `${API}/ai/report`,
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('generatePolicy sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.ai.generatePolicy('privacy', 'Acme', 'formal');
      expect(mockFetch).toHaveBeenCalledWith(`${API}/ai/policy`, expect.objectContaining({ method: 'POST' }));
    });

    it('analyzeContract sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.ai.analyzeContract('contract text');
      expect(mockFetch).toHaveBeenCalledWith(`${API}/ai/contract`, expect.objectContaining({ method: 'POST' }));
    });

    it('performGapAnalysis converts string target to array', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.ai.performGapAnalysis(['ISO27001'], 'SOC2');
      const callWithBody = mockFetch.mock.calls.find((c: [string, RequestInit]) => c[1]?.body !== null) as [string, RequestInit] | undefined;
      const body = parseBodyFromCall(callWithBody);
      expect(body.target).toEqual(['SOC2']);
    });

    it('performGapAnalysis keeps array target as array', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.ai.performGapAnalysis(['ISO27001'], ['SOC2', 'HIPAA']);
      const callWithBody = mockFetch.mock.calls.find((c: [string, RequestInit]) => c[1]?.body !== null) as [string, RequestInit] | undefined;
      const body = parseBodyFromCall(callWithBody);
      expect(body.target).toEqual(['SOC2', 'HIPAA']);
    });

    it('generateRFPResponse sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.ai.generateRFPResponse('question', 'context');
      expect(mockFetch).toHaveBeenCalledWith(`${API}/ai/rfp`, expect.objectContaining({ method: 'POST' }));
    });

    it('generatePhishing sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.ai.generatePhishing('email', 'finance', 'HR', 'hard');
      expect(mockFetch).toHaveBeenCalledWith(`${API}/ai/phishing`, expect.objectContaining({ method: 'POST' }));
    });

    it('scoreVendor sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.ai.scoreVendor('AWS', 'cloud', 'full');
      expect(mockFetch).toHaveBeenCalledWith(`${API}/ai/vendor-score`, expect.objectContaining({ method: 'POST' }));
    });

    it('generateDataMap sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.ai.generateDataMap('onboarding');
      expect(mockFetch).toHaveBeenCalledWith(`${API}/ai/data-map`, expect.objectContaining({ method: 'POST' }));
    });

    it('generateBCP sends POST with optional params', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.ai.generateBCP('earthquake', '4h', '1h');
      const callWithBody = mockFetch.mock.calls.find((c: [string, RequestInit]) => c[1]?.body !== null) as [string, RequestInit] | undefined;
      const body = parseBodyFromCall(callWithBody);
      expect(body).toEqual({ scenario: 'earthquake', rto: '4h', rpo: '1h' });
    });

    it('chat sends POST with message and optional fileContext', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      const files = [{ filename: 'a.txt', content: 'data', type: 'text' }];
      await api.ai.chat('hello', files);
      const callWithBody = mockFetch.mock.calls.find((c: [string, RequestInit]) => c[1]?.body !== null) as [string, RequestInit] | undefined;
      const body = parseBodyFromCall(callWithBody);
      expect(body.message).toBe('hello');
      expect(body.fileContext).toEqual(files);
    });
  });

  // =========================================================================
  // api.audit
  // =========================================================================
  describe('api.audit', () => {
    it('list fetches /audit', async () => {
      mockFetch.mockResolvedValueOnce(ok([]));
      await api.audit.list();
      expect(mockFetch).toHaveBeenCalledWith(`${API}/audit`, expect.any(Object));
    });

    it('log sends POST with action, user, details', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.audit.log('login', 'alice', 'from browser');
      expect(mockFetch).toHaveBeenCalledWith(
        `${API}/audit`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ action: 'login', user: 'alice', details: 'from browser' }),
        }),
      );
    });
  });

  // =========================================================================
  // api.billing
  // =========================================================================
  describe('api.billing', () => {
    it('createCheckout sends POST with tier and default billingCycle', async () => {
      mockFetch.mockResolvedValueOnce(ok({ url: 'https://stripe' }));
      await api.billing.createCheckout('Growth' as any);
      const callWithBody = mockFetch.mock.calls.find((c: [string, RequestInit]) => c[1]?.body !== null) as [string, RequestInit] | undefined;
      const body = parseBodyFromCall(callWithBody);
      expect(body).toEqual({ tier: 'Growth', billingCycle: 'annual' });
    });

    it('createPortalSession sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({ url: 'https://portal' }));
      await api.billing.createPortalSession();
      expect(mockFetch).toHaveBeenCalledWith(`${API}/billing/portal`, expect.objectContaining({ method: 'POST' }));
    });

    it('getSubscription fetches subscription', async () => {
      mockFetch.mockResolvedValueOnce(ok({ status: 'active' }));
      const result = await api.billing.getSubscription();
      expect(result.status).toBe('active');
    });

    it('getAvailableTiers fetches tiers', async () => {
      mockFetch.mockResolvedValueOnce(ok({ tiers: [] }));
      await api.billing.getAvailableTiers();
      expect(mockFetch).toHaveBeenCalledWith(`${API}/billing/tiers`, expect.any(Object));
    });

    it('previewTierChange sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.billing.previewTierChange('Enterprise' as any, 'monthly');
      const callWithBody = mockFetch.mock.calls.find((c: [string, RequestInit]) => c[1]?.body !== null) as [string, RequestInit] | undefined;
      const body = parseBodyFromCall(callWithBody);
      expect(body).toEqual({ tier: 'Enterprise', billingCycle: 'monthly' });
    });

    it('changeTier sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({ success: true }));
      await api.billing.changeTier('Growth' as any);
      expect(mockFetch).toHaveBeenCalledWith(`${API}/billing/change-tier`, expect.objectContaining({ method: 'POST' }));
    });

    it('cancelSubscription sends POST with default immediate=false', async () => {
      mockFetch.mockResolvedValueOnce(ok({ success: true }));
      await api.billing.cancelSubscription();
      const callWithBody = mockFetch.mock.calls.find((c: [string, RequestInit]) => c[1]?.body !== null) as [string, RequestInit] | undefined;
      const body = parseBodyFromCall(callWithBody);
      expect(body.cancelImmediately).toBe(false);
    });

    it('reactivateSubscription sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({ success: true }));
      await api.billing.reactivateSubscription();
      expect(mockFetch).toHaveBeenCalledWith(`${API}/billing/reactivate`, expect.objectContaining({ method: 'POST' }));
    });

    it('getUsageMetrics fetches usage', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.billing.getUsageMetrics();
      expect(mockFetch).toHaveBeenCalledWith(`${API}/billing/usage`, expect.any(Object));
    });

    it('compareTiers fetches comparison', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.billing.compareTiers('Enterprise' as any);
      expect(mockFetch).toHaveBeenCalledWith(`${API}/billing/compare/Enterprise`, expect.any(Object));
    });

    it('addAddOn sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({ success: true }));
      await api.billing.addAddOn('addon1');
      expect(mockFetch).toHaveBeenCalledWith(`${API}/billing/addons`, expect.objectContaining({ method: 'POST' }));
    });

    it('removeAddOn sends DELETE', async () => {
      mockFetch.mockResolvedValueOnce(ok({ success: true }));
      await api.billing.removeAddOn('addon1');
      expect(mockFetch).toHaveBeenCalledWith(`${API}/billing/addons/addon1`, expect.objectContaining({ method: 'DELETE' }));
    });

    it('requestQuote sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({ quoteId: 'q1' }));
      await api.billing.requestQuote('Enterprise' as any, { users: 100 });
      expect(mockFetch).toHaveBeenCalledWith(`${API}/billing/quote`, expect.objectContaining({ method: 'POST' }));
    });

    it('getFeatureSubscriptions fetches subscriptions', async () => {
      mockFetch.mockResolvedValueOnce(ok({ subscriptions: [] }));
      await api.billing.getFeatureSubscriptions();
      expect(mockFetch).toHaveBeenCalledWith(`${API}/billing/features/subscriptions`, expect.any(Object));
    });

    it('cancelFeatureSubscription sends DELETE', async () => {
      mockFetch.mockResolvedValueOnce(ok({ success: true }));
      await api.billing.cancelFeatureSubscription('feat1');
      expect(mockFetch).toHaveBeenCalledWith(
        `${API}/billing/features/feat1/unsubscribe`,
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });

  // =========================================================================
  // api.webhooks
  // =========================================================================
  describe('api.webhooks', () => {
    it('list fetches webhooks', async () => {
      mockFetch.mockResolvedValueOnce(ok({ webhooks: [] }));
      await api.webhooks.list();
      expect(mockFetch).toHaveBeenCalledWith(`${API}/webhooks`, expect.any(Object));
    });

    it('create sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.webhooks.create({ url: 'https://hook' } as any);
      expect(mockFetch).toHaveBeenCalledWith(`${API}/webhooks`, expect.objectContaining({ method: 'POST' }));
    });

    it('get fetches single webhook', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.webhooks.get('w1');
      expect(mockFetch).toHaveBeenCalledWith(`${API}/webhooks/w1`, expect.any(Object));
    });

    it('update sends PUT', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.webhooks.update('w1', { url: 'https://new' } as any);
      expect(mockFetch).toHaveBeenCalledWith(`${API}/webhooks/w1`, expect.objectContaining({ method: 'PUT' }));
    });

    it('delete sends DELETE', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.webhooks.delete('w1');
      expect(mockFetch).toHaveBeenCalledWith(`${API}/webhooks/w1`, expect.objectContaining({ method: 'DELETE' }));
    });

    it('test sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({ success: true }));
      await api.webhooks.test('w1');
      expect(mockFetch).toHaveBeenCalledWith(`${API}/webhooks/w1/test`, expect.objectContaining({ method: 'POST' }));
    });

    it('regenerateSecret sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({ secret: 'sec' }));
      await api.webhooks.regenerateSecret('w1');
      expect(mockFetch).toHaveBeenCalledWith(`${API}/webhooks/w1/regenerate-secret`, expect.objectContaining({ method: 'POST' }));
    });

    it('getEvents with webhookId', async () => {
      mockFetch.mockResolvedValueOnce(ok({ events: [] }));
      await api.webhooks.getEvents('w1');
      expect(mockFetch).toHaveBeenCalledWith(`${API}/webhooks/w1/events`, expect.any(Object));
    });

    it('getEvents without webhookId', async () => {
      mockFetch.mockResolvedValueOnce(ok({ events: [] }));
      await api.webhooks.getEvents();
      expect(mockFetch).toHaveBeenCalledWith(`${API}/webhooks/events`, expect.any(Object));
    });
  });

  // =========================================================================
  // api.apiKeys
  // =========================================================================
  describe('api.apiKeys', () => {
    it('list fetches api keys', async () => {
      mockFetch.mockResolvedValueOnce(ok({ apiKeys: [] }));
      await api.apiKeys.list();
      expect(mockFetch).toHaveBeenCalledWith(`${API}/webhooks/api-keys`, expect.any(Object));
    });

    it('create sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({ key: 'k1' }));
      await api.apiKeys.create('mykey', ['read']);
      expect(mockFetch).toHaveBeenCalledWith(
        `${API}/webhooks/api-keys`,
        expect.objectContaining({ method: 'POST', body: JSON.stringify({ name: 'mykey', scopes: ['read'] }) }),
      );
    });

    it('revoke sends DELETE', async () => {
      mockFetch.mockResolvedValueOnce(ok({ success: true }));
      await api.apiKeys.revoke('k1');
      expect(mockFetch).toHaveBeenCalledWith(`${API}/webhooks/api-keys/k1`, expect.objectContaining({ method: 'DELETE' }));
    });
  });

  // =========================================================================
  // api.integrations
  // =========================================================================
  describe('api.integrations', () => {
    it('list returns integrations array from response', async () => {
      mockFetch.mockResolvedValueOnce(ok({ integrations: [{ id: 'i1' }] }));
      const result = await api.integrations.list();
      expect(result).toEqual([{ id: 'i1' }]);
    });

    it('list returns empty array when no integrations in response', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      const result = await api.integrations.list();
      expect(result).toEqual([]);
    });

    it('getStatus fetches provider status', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.integrations.getStatus('github');
      expect(mockFetch).toHaveBeenCalledWith(`${API}/integrations/github`, expect.any(Object));
    });

    it('authorize fetches auth URL', async () => {
      mockFetch.mockResolvedValueOnce(ok({ authUrl: 'https://auth' }));
      await api.integrations.authorize('github');
      expect(mockFetch).toHaveBeenCalledWith(`${API}/integrations/github/authorize`, expect.any(Object));
    });

    it('sync sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.integrations.sync('github');
      expect(mockFetch).toHaveBeenCalledWith(`${API}/integrations/github/sync`, expect.objectContaining({ method: 'POST' }));
    });

    it('disconnect sends DELETE', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.integrations.disconnect('github');
      expect(mockFetch).toHaveBeenCalledWith(`${API}/integrations/github`, expect.objectContaining({ method: 'DELETE' }));
    });

    it('connectAWS sends POST with credentials', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.integrations.connectAWS({ accessKeyId: 'ak', secretAccessKey: 'sk', region: 'us-east-1' });
      expect(mockFetch).toHaveBeenCalledWith(`${API}/integrations/aws/connect`, expect.objectContaining({ method: 'POST' }));
    });

    it('connectAzure sends POST with credentials', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.integrations.connectAzure({ subscriptionId: 's', clientId: 'c', clientSecret: 'cs', tenantId: 't' });
      expect(mockFetch).toHaveBeenCalledWith(`${API}/integrations/azure/connect`, expect.objectContaining({ method: 'POST' }));
    });

    it('connectWithApiKey sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.integrations.connectWithApiKey('jira', { apiKey: 'key' });
      const callWithBody = mockFetch.mock.calls.find((c: [string, RequestInit]) => c[1]?.body !== null) as [string, RequestInit] | undefined;
      const body = parseBodyFromCall(callWithBody);
      expect(body.type).toBe('api-key');
      expect(body.apiKey).toBe('key');
    });

    it('connectWithPat sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.integrations.connectWithPat('github', { token: 'pat123' });
      const callWithBody = mockFetch.mock.calls.find((c: [string, RequestInit]) => c[1]?.body !== null) as [string, RequestInit] | undefined;
      const body = parseBodyFromCall(callWithBody);
      expect(body.type).toBe('pat');
      expect(body.token).toBe('pat123');
    });

    it('connectWithApiKeySecret sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.integrations.connectWithApiKeySecret('prov', { apiKey: 'k', apiSecret: 's' });
      const callWithBody = mockFetch.mock.calls.find((c: [string, RequestInit]) => c[1]?.body !== null) as [string, RequestInit] | undefined;
      const body = parseBodyFromCall(callWithBody);
      expect(body.type).toBe('api-key-secret');
    });

    it('connectWithUsernamePassword sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.integrations.connectWithUsernamePassword('prov', { username: 'u', password: 'p' });
      const callWithBody = mockFetch.mock.calls.find((c: [string, RequestInit]) => c[1]?.body !== null) as [string, RequestInit] | undefined;
      const body = parseBodyFromCall(callWithBody);
      expect(body.type).toBe('username-password');
    });

    it('connectWithServiceAccount sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.integrations.connectWithServiceAccount('gcp', { serviceAccountJson: { key: 'val' } });
      const callWithBody = mockFetch.mock.calls.find((c: [string, RequestInit]) => c[1]?.body !== null) as [string, RequestInit] | undefined;
      const body = parseBodyFromCall(callWithBody);
      expect(body.type).toBe('service-account');
    });
  });

  // =========================================================================
  // api.team
  // =========================================================================
  describe('api.team', () => {
    it('list fetches team members', async () => {
      mockFetch.mockResolvedValueOnce(ok([]));
      await api.team.list();
      expect(mockFetch).toHaveBeenCalledWith(`${API}/team`, expect.any(Object));
    });

    it('invite sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.team.invite('Alice', 'a@b.com', 'admin');
      expect(mockFetch).toHaveBeenCalledWith(
        `${API}/team/invite`,
        expect.objectContaining({ method: 'POST', body: JSON.stringify({ name: 'Alice', email: 'a@b.com', role: 'admin' }) }),
      );
    });

    it('bulkInvite sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({ successful: [], failed: [], summary: {} }));
      await api.team.bulkInvite([{ name: 'Bob', email: 'b@b.com' }]);
      expect(mockFetch).toHaveBeenCalledWith(`${API}/team/bulk-invite`, expect.objectContaining({ method: 'POST' }));
    });

    it('updateRole sends PATCH', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.team.updateRole('u1', 'viewer');
      expect(mockFetch).toHaveBeenCalledWith(`${API}/team/u1`, expect.objectContaining({ method: 'PATCH' }));
    });

    it('remove sends DELETE', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.team.remove('u1');
      expect(mockFetch).toHaveBeenCalledWith(`${API}/team/u1`, expect.objectContaining({ method: 'DELETE' }));
    });
  });

  // =========================================================================
  // api.organization
  // =========================================================================
  describe('api.organization', () => {
    it('get fetches organization', async () => {
      mockFetch.mockResolvedValueOnce(ok({ name: 'Org' }));
      await api.organization.get();
      expect(mockFetch).toHaveBeenCalledWith(`${API}/organization`, expect.any(Object));
    });

    it('update sends PATCH', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.organization.update({ name: 'New', plan: 'Pro' });
      expect(mockFetch).toHaveBeenCalledWith(`${API}/organization`, expect.objectContaining({ method: 'PATCH' }));
    });
  });

  // =========================================================================
  // api.vendors
  // =========================================================================
  describe('api.vendors', () => {
    it('list without params', async () => {
      mockFetch.mockResolvedValueOnce(ok([{ id: 'v1' }]));
      const result = await api.vendors.list();
      expect(result).toEqual([{ id: 'v1' }]);
    });

    it('list with params adds query string', async () => {
      mockFetch.mockResolvedValueOnce(ok([]));
      await api.vendors.list({ status: 'active' });
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('status=active');
    });

    it('list normalizes vendors property', async () => {
      mockFetch.mockResolvedValueOnce(ok({ vendors: [{ id: 'v1' }] }));
      const result = await api.vendors.list();
      expect(result).toEqual([{ id: 'v1' }]);
    });

    it('list normalizes data property', async () => {
      mockFetch.mockResolvedValueOnce(ok({ data: [{ id: 'v1' }] }));
      const result = await api.vendors.list();
      expect(result).toEqual([{ id: 'v1' }]);
    });

    it('getById encodes id', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.vendors.getById('v 1');
      expect(mockFetch).toHaveBeenCalledWith(`${API}/vendors/v%201`, expect.any(Object));
    });

    it('create sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.vendors.create({ name: 'Vendor' });
      expect(mockFetch).toHaveBeenCalledWith(`${API}/vendors`, expect.objectContaining({ method: 'POST' }));
    });

    it('update sends PUT', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.vendors.update('v1', { name: 'Updated' });
      expect(mockFetch).toHaveBeenCalledWith(`${API}/vendors/v1`, expect.objectContaining({ method: 'PUT' }));
    });

    it('delete sends DELETE', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.vendors.delete('v1');
      expect(mockFetch).toHaveBeenCalledWith(`${API}/vendors/v1`, expect.objectContaining({ method: 'DELETE' }));
    });

    it('createAssessment sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.vendors.createAssessment('v1', { score: 80 });
      expect(mockFetch).toHaveBeenCalledWith(`${API}/vendors/v1/assessments`, expect.objectContaining({ method: 'POST' }));
    });

    it('getScorecard fetches scorecard', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.vendors.getScorecard('v1');
      expect(mockFetch).toHaveBeenCalledWith(`${API}/vendors/v1/scorecard`, expect.any(Object));
    });

    it('getDashboard fetches dashboard', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.vendors.getDashboard();
      expect(mockFetch).toHaveBeenCalledWith(`${API}/vendors/dashboard`, expect.any(Object));
    });
  });

  // =========================================================================
  // api.enterprise
  // =========================================================================
  describe('api.enterprise', () => {
    describe('questionnaires', () => {
      it('list without params normalizes response', async () => {
        mockFetch.mockResolvedValueOnce(ok({ questionnaires: [{ id: 'q1' }] }));
        const result = await api.enterprise.questionnaires.list();
        expect(result).toEqual([{ id: 'q1' }]);
      });

      it('list normalizes array response', async () => {
        mockFetch.mockResolvedValueOnce(ok([{ id: 'q1' }]));
        const result = await api.enterprise.questionnaires.list();
        expect(result).toEqual([{ id: 'q1' }]);
      });

      it('list with params adds query string', async () => {
        mockFetch.mockResolvedValueOnce(ok({ questionnaires: [] }));
        await api.enterprise.questionnaires.list({ status: 'pending' });
        const url = mockFetch.mock.calls[0][0] as string;
        expect(url).toContain('status=pending');
      });

      it('getById encodes id', async () => {
        mockFetch.mockResolvedValueOnce(ok({}));
        await api.enterprise.questionnaires.getById('q 1');
        expect(mockFetch).toHaveBeenCalledWith(`${API}/enterprise/questionnaires/q%201`, expect.any(Object));
      });

      it('getMetrics fetches metrics', async () => {
        mockFetch.mockResolvedValueOnce(ok({}));
        await api.enterprise.questionnaires.getMetrics();
        expect(mockFetch).toHaveBeenCalledWith(`${API}/enterprise/questionnaires/metrics`, expect.any(Object));
      });

      it('create sends POST', async () => {
        mockFetch.mockResolvedValueOnce(ok({}));
        await api.enterprise.questionnaires.create({ title: 'Q' });
        expect(mockFetch).toHaveBeenCalledWith(`${API}/enterprise/questionnaires`, expect.objectContaining({ method: 'POST' }));
      });

      it('createFromTemplate sends POST', async () => {
        mockFetch.mockResolvedValueOnce(ok({}));
        await api.enterprise.questionnaires.createFromTemplate({ templateId: 't1' });
        expect(mockFetch).toHaveBeenCalledWith(
          `${API}/enterprise/questionnaires/from-template`,
          expect.objectContaining({ method: 'POST' }),
        );
      });

      it('addQuestions sends POST', async () => {
        mockFetch.mockResolvedValueOnce(ok({}));
        await api.enterprise.questionnaires.addQuestions('q1', [{ text: 'What?' }]);
        expect(mockFetch).toHaveBeenCalledWith(
          `${API}/enterprise/questionnaires/q1/questions`,
          expect.objectContaining({ method: 'POST' }),
        );
      });

      it('submitResponse sends POST', async () => {
        mockFetch.mockResolvedValueOnce(ok({}));
        await api.enterprise.questionnaires.submitResponse('q1', { questionId: 'q1', responseText: 'Yes' });
        expect(mockFetch).toHaveBeenCalledWith(
          `${API}/enterprise/questionnaires/q1/responses`,
          expect.objectContaining({ method: 'POST' }),
        );
      });

      it('aiGenerate sends POST', async () => {
        mockFetch.mockResolvedValueOnce(ok({}));
        await api.enterprise.questionnaires.aiGenerate('q1');
        expect(mockFetch).toHaveBeenCalledWith(
          `${API}/enterprise/questionnaires/q1/ai-generate`,
          expect.objectContaining({ method: 'POST' }),
        );
      });

      it('complete sends POST', async () => {
        mockFetch.mockResolvedValueOnce(ok({}));
        await api.enterprise.questionnaires.complete('q1');
        expect(mockFetch).toHaveBeenCalledWith(
          `${API}/enterprise/questionnaires/q1/complete`,
          expect.objectContaining({ method: 'POST' }),
        );
      });

      it('delete sends DELETE', async () => {
        mockFetch.mockResolvedValueOnce(ok({}));
        await api.enterprise.questionnaires.delete('q1');
        expect(mockFetch).toHaveBeenCalledWith(
          `${API}/enterprise/questionnaires/q1`,
          expect.objectContaining({ method: 'DELETE' }),
        );
      });
    });

    describe('policies', () => {
      it('list normalizes policies property', async () => {
        mockFetch.mockResolvedValueOnce(ok({ policies: [{ id: 'p1' }] }));
        const result = await api.enterprise.policies.list();
        expect(result).toEqual([{ id: 'p1' }]);
      });

      it('getTemplates with category adds query param', async () => {
        mockFetch.mockResolvedValueOnce(ok({}));
        await api.enterprise.policies.getTemplates('security');
        const url = mockFetch.mock.calls[0][0] as string;
        expect(url).toContain('category=security');
      });

      it('getTemplates without category', async () => {
        mockFetch.mockResolvedValueOnce(ok({}));
        await api.enterprise.policies.getTemplates();
        expect(mockFetch).toHaveBeenCalledWith(`${API}/enterprise/policies/templates`, expect.any(Object));
      });

      it('approve sends POST', async () => {
        mockFetch.mockResolvedValueOnce(ok({}));
        await api.enterprise.policies.approve('p1');
        expect(mockFetch).toHaveBeenCalledWith(
          `${API}/enterprise/policies/p1/approve`,
          expect.objectContaining({ method: 'POST' }),
        );
      });

      it('submitForReview sends POST', async () => {
        mockFetch.mockResolvedValueOnce(ok({}));
        await api.enterprise.policies.submitForReview('p1');
        expect(mockFetch).toHaveBeenCalledWith(
          `${API}/enterprise/policies/p1/submit-review`,
          expect.objectContaining({ method: 'POST' }),
        );
      });

      it('duplicate sends POST', async () => {
        mockFetch.mockResolvedValueOnce(ok({}));
        await api.enterprise.policies.duplicate('p1');
        expect(mockFetch).toHaveBeenCalledWith(
          `${API}/enterprise/policies/p1/duplicate`,
          expect.objectContaining({ method: 'POST' }),
        );
      });

      it('generatePolicy sends POST', async () => {
        mockFetch.mockResolvedValueOnce(ok({}));
        await api.enterprise.policies.generatePolicy({ description: 'desc', category: 'sec' });
        expect(mockFetch).toHaveBeenCalledWith(
          `${API}/enterprise/visionary-ai/generate-policy`,
          expect.objectContaining({ method: 'POST' }),
        );
      });
    });

    describe('workspaces', () => {
      it('getHierarchy fetches hierarchy', async () => {
        mockFetch.mockResolvedValueOnce(ok({}));
        await api.enterprise.workspaces.getHierarchy();
        expect(mockFetch).toHaveBeenCalledWith(`${API}/enterprise/workspace/hierarchy`, expect.any(Object));
      });

      it('createChild sends POST', async () => {
        mockFetch.mockResolvedValueOnce(ok({}));
        await api.enterprise.workspaces.createChild({ name: 'Sub' });
        expect(mockFetch).toHaveBeenCalledWith(
          `${API}/enterprise/workspace/child-organizations`,
          expect.objectContaining({ method: 'POST' }),
        );
      });

      it('moveUser sends POST', async () => {
        mockFetch.mockResolvedValueOnce(ok({}));
        await api.enterprise.workspaces.moveUser('u1', 'o2');
        expect(mockFetch).toHaveBeenCalledWith(
          `${API}/enterprise/workspace/move-user`,
          expect.objectContaining({ method: 'POST' }),
        );
      });

      it('cloneFramework sends POST', async () => {
        mockFetch.mockResolvedValueOnce(ok({}));
        await api.enterprise.workspaces.cloneFramework('f1', ['o1', 'o2']);
        expect(mockFetch).toHaveBeenCalledWith(
          `${API}/enterprise/workspace/clone-framework`,
          expect.objectContaining({ method: 'POST' }),
        );
      });
    });

    describe('visionaryAI', () => {
      it('getCoPilotRecommendations fetches recommendations', async () => {
        mockFetch.mockResolvedValueOnce(ok({}));
        await api.enterprise.visionaryAI.getCoPilotRecommendations();
        expect(mockFetch).toHaveBeenCalledWith(`${API}/enterprise/visionary-ai/copilot/recommendations`, expect.any(Object));
      });

      it('predictRisks sends POST with default timeHorizon', async () => {
        mockFetch.mockResolvedValueOnce(ok({}));
        await api.enterprise.visionaryAI.predictRisks();
        const callWithBody = mockFetch.mock.calls.find((c: [string, RequestInit]) => c[1]?.body !== null) as [string, RequestInit] | undefined;
      const body = parseBodyFromCall(callWithBody);
        expect(body.timeHorizonDays).toBe(90);
      });

      it('getBenchmarking uses default industry', async () => {
        mockFetch.mockResolvedValueOnce(ok({}));
        await api.enterprise.visionaryAI.getBenchmarking();
        const url = mockFetch.mock.calls[0][0] as string;
        expect(url).toContain('industry=Technology');
      });
    });

    describe('monitoring', () => {
      it('list normalizes monitors property', async () => {
        mockFetch.mockResolvedValueOnce(ok({ monitors: [{ id: 'm1' }] }));
        const result = await api.enterprise.monitoring.list();
        expect(result).toEqual([{ id: 'm1' }]);
      });

      it('list normalizes array response', async () => {
        mockFetch.mockResolvedValueOnce(ok([{ id: 'm1' }]));
        const result = await api.enterprise.monitoring.list();
        expect(result).toEqual([{ id: 'm1' }]);
      });

      it('getResults includes limit param', async () => {
        mockFetch.mockResolvedValueOnce(ok({}));
        await api.enterprise.monitoring.getResults('m1', 50);
        const url = mockFetch.mock.calls[0][0] as string;
        expect(url).toContain('limit=50');
      });

      it('toggle sends PATCH with active flag', async () => {
        mockFetch.mockResolvedValueOnce(ok({}));
        await api.enterprise.monitoring.toggle('m1', true);
        const callWithBody = mockFetch.mock.calls.find((c: [string, RequestInit]) => c[1]?.body !== null) as [string, RequestInit] | undefined;
      const body = parseBodyFromCall(callWithBody);
        expect(body.active).toBe(true);
      });

      it('aiSuggest sends POST', async () => {
        mockFetch.mockResolvedValueOnce(ok({}));
        await api.enterprise.monitoring.aiSuggest();
        expect(mockFetch).toHaveBeenCalledWith(
          `${API}/enterprise/monitoring/ai-suggest`,
          expect.objectContaining({ method: 'POST' }),
        );
      });

      it('aiAnalyze sends POST', async () => {
        mockFetch.mockResolvedValueOnce(ok({}));
        await api.enterprise.monitoring.aiAnalyze('m1');
        expect(mockFetch).toHaveBeenCalledWith(
          `${API}/enterprise/monitoring/m1/ai-analyze`,
          expect.objectContaining({ method: 'POST' }),
        );
      });
    });

    describe('issues', () => {
      it('list normalizes issues property', async () => {
        mockFetch.mockResolvedValueOnce(ok({ issues: [{ id: 'i1' }] }));
        const result = await api.enterprise.issues.list();
        expect(result).toEqual([{ id: 'i1' }]);
      });

      it('updateStatus sends PATCH', async () => {
        mockFetch.mockResolvedValueOnce(ok({}));
        await api.enterprise.issues.updateStatus('i1', 'resolved');
        expect(mockFetch).toHaveBeenCalledWith(
          `${API}/enterprise/issues/i1/status`,
          expect.objectContaining({ method: 'PATCH' }),
        );
      });

      it('assign sends POST', async () => {
        mockFetch.mockResolvedValueOnce(ok({}));
        await api.enterprise.issues.assign('i1', 'u1');
        expect(mockFetch).toHaveBeenCalledWith(
          `${API}/enterprise/issues/i1/assign`,
          expect.objectContaining({ method: 'POST' }),
        );
      });

      it('addComment sends POST', async () => {
        mockFetch.mockResolvedValueOnce(ok({}));
        await api.enterprise.issues.addComment('i1', 'note');
        expect(mockFetch).toHaveBeenCalledWith(
          `${API}/enterprise/issues/i1/comments`,
          expect.objectContaining({ method: 'POST' }),
        );
      });

      it('getComments fetches comments', async () => {
        mockFetch.mockResolvedValueOnce(ok({}));
        await api.enterprise.issues.getComments('i1');
        expect(mockFetch).toHaveBeenCalledWith(`${API}/enterprise/issues/i1/comments`, expect.any(Object));
      });
    });

    describe('autopilot', () => {
      it('run sends POST with options', async () => {
        mockFetch.mockResolvedValueOnce(ok({}));
        await api.enterprise.autopilot.run({ mode: 'full' });
        const callWithBody = mockFetch.mock.calls.find((c: [string, RequestInit]) => c[1]?.body !== null) as [string, RequestInit] | undefined;
      const body = parseBodyFromCall(callWithBody);
        expect(body.options).toEqual({ mode: 'full' });
      });

      it('run sends POST with empty options by default', async () => {
        mockFetch.mockResolvedValueOnce(ok({}));
        await api.enterprise.autopilot.run();
        const callWithBody = mockFetch.mock.calls.find((c: [string, RequestInit]) => c[1]?.body !== null) as [string, RequestInit] | undefined;
      const body = parseBodyFromCall(callWithBody);
        expect(body.options).toEqual({});
      });
    });

    describe('reports', () => {
      it('list returns empty array', async () => {
        const result = await api.enterprise.reports.list();
        expect(result).toEqual([]);
        expect(mockFetch).not.toHaveBeenCalled();
      });

      it('getExecutiveSummary fetches report', async () => {
        mockFetch.mockResolvedValueOnce(ok({}));
        await api.enterprise.reports.getExecutiveSummary();
        expect(mockFetch).toHaveBeenCalledWith(`${API}/enterprise/reports/executive-summary`, expect.any(Object));
      });

      it('getComplianceReport with frameworkId', async () => {
        mockFetch.mockResolvedValueOnce(ok({}));
        await api.enterprise.reports.getComplianceReport('f1');
        const url = mockFetch.mock.calls[0][0] as string;
        expect(url).toContain('frameworkId=f1');
      });

      it('getComplianceReport without frameworkId', async () => {
        mockFetch.mockResolvedValueOnce(ok({}));
        await api.enterprise.reports.getComplianceReport();
        expect(mockFetch).toHaveBeenCalledWith(`${API}/enterprise/reports/compliance`, expect.any(Object));
      });

      it('create sends POST', async () => {
        mockFetch.mockResolvedValueOnce(ok({}));
        await api.enterprise.reports.create({ type: 'risk' });
        expect(mockFetch).toHaveBeenCalledWith(`${API}/enterprise/reports`, expect.objectContaining({ method: 'POST' }));
      });
    });

    describe('riskAssessments', () => {
      it('create sends POST', async () => {
        mockFetch.mockResolvedValueOnce(ok({}));
        await api.enterprise.riskAssessments.create({ scope: 'all' });
        expect(mockFetch).toHaveBeenCalledWith(
          `${API}/enterprise/risk-management/assessments`,
          expect.objectContaining({ method: 'POST' }),
        );
      });
    });
  });

  // =========================================================================
  // api.twoFactor
  // =========================================================================
  describe('api.twoFactor', () => {
    it('setup sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({ secret: 'sec', qrCode: 'qr' }));
      await api.twoFactor.setup();
      expect(mockFetch).toHaveBeenCalledWith(`${API}/2fa/setup`, expect.objectContaining({ method: 'POST' }));
    });

    it('verifyAndEnable sends POST with token', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.twoFactor.verifyAndEnable('123456');
      expect(mockFetch).toHaveBeenCalledWith(
        `${API}/2fa/verify-enable`,
        expect.objectContaining({ method: 'POST', body: JSON.stringify({ token: '123456' }) }),
      );
    });

    it('disable sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.twoFactor.disable();
      expect(mockFetch).toHaveBeenCalledWith(`${API}/2fa/disable`, expect.objectContaining({ method: 'POST' }));
    });

    it('regenerateCodes sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({ csrfToken: 'csrf' }));
      mockFetch.mockResolvedValueOnce(ok({ backupCodes: ['a', 'b'] }));
      const result = await api.twoFactor.regenerateCodes();
      expect(result.backupCodes).toEqual(['a', 'b']);
    });

    it('getStatus fetches 2FA status', async () => {
      mockFetch.mockResolvedValueOnce(ok({ enabled: true, verified: true }));
      const result = await api.twoFactor.getStatus();
      expect(result.enabled).toBe(true);
    });
  });

  // =========================================================================
  // api.acos
  // =========================================================================
  describe('api.acos', () => {
    it('createGoal sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.acos.createGoal({ name: 'Goal' });
      expect(mockFetch).toHaveBeenCalledWith(`${API}/acos/goals`, expect.objectContaining({ method: 'POST' }));
    });

    it('getGoals without params', async () => {
      mockFetch.mockResolvedValueOnce(ok([]));
      await api.acos.getGoals();
      expect(mockFetch).toHaveBeenCalledWith(`${API}/acos/goals`, expect.any(Object));
    });

    it('getGoals with params', async () => {
      mockFetch.mockResolvedValueOnce(ok([]));
      await api.acos.getGoals({ status: 'active', framework: 'SOC2' });
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('status=active');
      expect(url).toContain('framework=SOC2');
    });

    it('deleteGoal sends DELETE', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.acos.deleteGoal('g1');
      expect(mockFetch).toHaveBeenCalledWith(`${API}/acos/goals/g1`, expect.objectContaining({ method: 'DELETE' }));
    });

    it('restoreGoal sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.acos.restoreGoal('g1');
      expect(mockFetch).toHaveBeenCalledWith(`${API}/acos/goals/g1/restore`, expect.objectContaining({ method: 'POST' }));
    });

    it('getControlLoops fetches control loops', async () => {
      mockFetch.mockResolvedValueOnce(ok([]));
      await api.acos.getControlLoops();
      expect(mockFetch).toHaveBeenCalledWith(`${API}/acos/control-loops`, expect.any(Object));
    });

    it('executeControlLoop sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.acos.executeControlLoop('cl1');
      expect(mockFetch).toHaveBeenCalledWith(`${API}/acos/control-loops/cl1/execute`, expect.objectContaining({ method: 'POST' }));
    });

    it('getComplianceDebts without filters', async () => {
      mockFetch.mockResolvedValueOnce(ok([]));
      await api.acos.getComplianceDebts();
      expect(mockFetch).toHaveBeenCalledWith(`${API}/acos/compliance-debts`, expect.any(Object));
    });

    it('getComplianceDebts with filters', async () => {
      mockFetch.mockResolvedValueOnce(ok([]));
      await api.acos.getComplianceDebts({ severity: 'high' });
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('severity=high');
    });

    it('exportDebtReport includes format param', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.acos.exportDebtReport('csv');
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('format=csv');
    });

    it('getChangeImpacts with pending=true', async () => {
      mockFetch.mockResolvedValueOnce(ok([]));
      await api.acos.getChangeImpacts(true);
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('pending=true');
    });

    it('getChangeImpacts without pending', async () => {
      mockFetch.mockResolvedValueOnce(ok([]));
      await api.acos.getChangeImpacts();
      expect(mockFetch).toHaveBeenCalledWith(`${API}/acos/change-impacts`, expect.any(Object));
    });

    it('rollbackMultipleActions sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.acos.rollbackMultipleActions(['a1', 'a2']);
      const callWithBody = mockFetch.mock.calls.find((c: [string, RequestInit]) => c[1]?.body !== null) as [string, RequestInit] | undefined;
      const body = parseBodyFromCall(callWithBody);
      expect(body.actionIds).toEqual(['a1', 'a2']);
    });

    it('analyzeEvidence sends FormData', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      const file = new File(['data'], 'evidence.pdf');
      await api.acos.analyzeEvidence('e1', file);
      expect(mockFetch).toHaveBeenCalledWith(
        `${API}/acos/evidence/e1/analyze`,
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('getSwarmInsights with frameworks', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.acos.getSwarmInsights(['SOC2', 'ISO27001']);
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('frameworks=SOC2,ISO27001');
    });

    it('getSwarmInsights without frameworks', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.acos.getSwarmInsights();
      expect(mockFetch).toHaveBeenCalledWith(`${API}/acos/swarm/insights`, expect.any(Object));
    });

    it('transcribeAudio sends FormData with options', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      const file = new File(['audio'], 'audio.mp3');
      await api.acos.transcribeAudio(file, { language: 'en' });
      expect(mockFetch).toHaveBeenCalledWith(
        `${API}/acos/multimodal/transcribe-audio`,
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('analyzeVideo sends FormData with options', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      const file = new File(['video'], 'video.mp4');
      await api.acos.analyzeVideo(file, { fps: '30' });
      expect(mockFetch).toHaveBeenCalledWith(
        `${API}/acos/multimodal/analyze-video`,
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('predictFutureRisks uses default months', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.acos.predictFutureRisks();
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('months=6');
    });

    it('getReasoningHistory with limit', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.acos.getReasoningHistory(10);
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('limit=10');
    });

    it('getReasoningHistory without limit', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.acos.getReasoningHistory();
      expect(mockFetch).toHaveBeenCalledWith(`${API}/acos/neuro-symbolic/reasoning-history`, expect.any(Object));
    });

    it('getAllJITAccessRequests with status', async () => {
      mockFetch.mockResolvedValueOnce(ok([]));
      await api.acos.getAllJITAccessRequests('pending');
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('status=pending');
    });

    it('getAllJITAccessRequests without status', async () => {
      mockFetch.mockResolvedValueOnce(ok([]));
      await api.acos.getAllJITAccessRequests();
      expect(mockFetch).toHaveBeenCalledWith(`${API}/acos/jit/requests`, expect.any(Object));
    });

    it('denyJITAccessRequest sends POST with reason', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.acos.denyJITAccessRequest('r1', 'Not needed');
      const callWithBody = mockFetch.mock.calls.find((c: [string, RequestInit]) => c[1]?.body !== null) as [string, RequestInit] | undefined;
      const body = parseBodyFromCall(callWithBody);
      expect(body.reason).toBe('Not needed');
    });

    it('generateHomomorphicKeys sends POST with defaults', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.acos.generateHomomorphicKeys();
      const callWithBody = mockFetch.mock.calls.find((c: [string, RequestInit]) => c[1]?.body !== null) as [string, RequestInit] | undefined;
      const body = parseBodyFromCall(callWithBody);
      expect(body.scheme).toBe('CKKS');
      expect(body.securityLevel).toBe(128);
    });

    it('performHybridReasoning sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.acos.performHybridReasoning('query', { extra: 'data' });
      const callWithBody = mockFetch.mock.calls.find((c: [string, RequestInit]) => c[1]?.body !== null) as [string, RequestInit] | undefined;
      const body = parseBodyFromCall(callWithBody);
      expect(body.query).toBe('query');
      expect(body.context).toEqual({ extra: 'data' });
    });

    it('getActiveVRSessions fetches sessions', async () => {
      mockFetch.mockResolvedValueOnce(ok([]));
      await api.acos.getActiveVRSessions();
      expect(mockFetch).toHaveBeenCalledWith(`${API}/acos/vr/sessions`, expect.any(Object));
    });

    it('revokeJITSession sends POST with reason', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.acos.revokeJITSession('s1', 'expired');
      const callWithBody = mockFetch.mock.calls.find((c: [string, RequestInit]) => c[1]?.body !== null) as [string, RequestInit] | undefined;
      const body = parseBodyFromCall(callWithBody);
      expect(body.reason).toBe('expired');
    });
  });

  // =========================================================================
  // api.demo
  // =========================================================================
  describe('api.demo', () => {
    it('submitRequest sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({ success: true }));
      await api.demo.submitRequest({
        firstName: 'A',
        lastName: 'B',
        email: 'a@b.com',
        company: 'Co',
      });
      expect(mockFetch).toHaveBeenCalledWith(`${API}/demo/request`, expect.objectContaining({ method: 'POST' }));
    });

    it('getRequests with params', async () => {
      mockFetch.mockResolvedValueOnce(ok({ demoRequests: [] }));
      await api.demo.getRequests({ status: 'new', tier: 'Growth' });
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('status=new');
      expect(url).toContain('tier=Growth');
    });

    it('getRequest fetches single request', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.demo.getRequest('d1');
      expect(mockFetch).toHaveBeenCalledWith(`${API}/demo/requests/d1`, expect.any(Object));
    });

    it('updateRequest sends PATCH', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.demo.updateRequest('d1', { status: 'contacted' });
      expect(mockFetch).toHaveBeenCalledWith(`${API}/demo/requests/d1`, expect.objectContaining({ method: 'PATCH' }));
    });

    it('scheduleDemo sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.demo.scheduleDemo('d1', '2025-01-01', 'https://meet', 'notes');
      const callWithBody = mockFetch.mock.calls.find((c: [string, RequestInit]) => c[1]?.body !== null) as [string, RequestInit] | undefined;
      const body = parseBodyFromCall(callWithBody);
      expect(body.scheduledAt).toBe('2025-01-01');
      expect(body.meetingLink).toBe('https://meet');
    });

    it('markAsConverted sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.demo.markAsConverted('d1', 'converted');
      expect(mockFetch).toHaveBeenCalledWith(`${API}/demo/requests/d1/convert`, expect.objectContaining({ method: 'POST' }));
    });

    it('getStats fetches stats', async () => {
      mockFetch.mockResolvedValueOnce(ok({ total: 10 }));
      const result = await api.demo.getStats();
      expect(result.total).toBe(10);
    });
  });

  // =========================================================================
  // api.security
  // =========================================================================
  describe('api.security', () => {
    it('verifyDeviceTrust sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.security.verifyDeviceTrust({ deviceId: 'd1' });
      expect(mockFetch).toHaveBeenCalledWith(
        `${API}/security/zero-trust/verify-device`,
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('evaluateAccessRequest sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.security.evaluateAccessRequest('res1', 'dev1', 'read');
      const callWithBody = mockFetch.mock.calls.find((c: [string, RequestInit]) => c[1]?.body !== null) as [string, RequestInit] | undefined;
      const body = parseBodyFromCall(callWithBody);
      expect(body).toEqual({ resourceId: 'res1', deviceId: 'dev1', action: 'read' });
    });

    it('getZeroTrustPolicies fetches policies', async () => {
      mockFetch.mockResolvedValueOnce(ok([]));
      await api.security.getZeroTrustPolicies();
      expect(mockFetch).toHaveBeenCalledWith(`${API}/security/zero-trust/policies`, expect.any(Object));
    });

    it('generateComplianceProof sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.security.generateComplianceProof('f1', { data: 'private' });
      expect(mockFetch).toHaveBeenCalledWith(
        `${API}/security/zkp/compliance-proof/generate`,
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('getBYOKKeys fetches keys', async () => {
      mockFetch.mockResolvedValueOnce(ok([]));
      await api.security.getBYOKKeys();
      expect(mockFetch).toHaveBeenCalledWith(`${API}/security/byok/keys`, expect.any(Object));
    });

    it('rotateBYOKKey sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.security.rotateBYOKKey('k1', { old: true }, { new: true }, []);
      expect(mockFetch).toHaveBeenCalledWith(
        `${API}/security/byok/keys/k1/rotate`,
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('getCompliancePolicies with framework filter', async () => {
      mockFetch.mockResolvedValueOnce(ok([]));
      await api.security.getCompliancePolicies('SOC2');
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('framework=SOC2');
    });

    it('getCompliancePolicies without framework filter', async () => {
      mockFetch.mockResolvedValueOnce(ok([]));
      await api.security.getCompliancePolicies();
      expect(mockFetch).toHaveBeenCalledWith(`${API}/security/compliance-as-code/policies`, expect.any(Object));
    });

    it('evaluateCompliancePoliciesBatch sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.security.evaluateCompliancePoliciesBatch(['p1', 'p2'], { data: 'x' });
      const callWithBody = mockFetch.mock.calls.find((c: [string, RequestInit]) => c[1]?.body !== null) as [string, RequestInit] | undefined;
      const body = parseBodyFromCall(callWithBody);
      expect(body.policyIds).toEqual(['p1', 'p2']);
    });

    it('detectDrift sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.security.detectDrift('p1');
      expect(mockFetch).toHaveBeenCalledWith(
        `${API}/security/compliance-as-code/drift/detect`,
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('getCICDIntegrations fetches integrations', async () => {
      mockFetch.mockResolvedValueOnce(ok([]));
      await api.security.getCICDIntegrations();
      expect(mockFetch).toHaveBeenCalledWith(`${API}/security/compliance-as-code/ci-cd/integrations`, expect.any(Object));
    });
  });

  // =========================================================================
  // api.aiRmf
  // =========================================================================
  describe('api.aiRmf', () => {
    it('createAISystem sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.aiRmf.createAISystem({ name: 'AI', systemType: 'classification' });
      expect(mockFetch).toHaveBeenCalledWith(`${API}/ai-rmf/systems`, expect.objectContaining({ method: 'POST' }));
    });

    it('getAISystems with filters builds query params', async () => {
      mockFetch.mockResolvedValueOnce(ok([]));
      await api.aiRmf.getAISystems({ status: 'active', riskLevel: 'high' });
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('status=active');
      expect(url).toContain('riskLevel=high');
    });

    it('getAISystems without filters', async () => {
      mockFetch.mockResolvedValueOnce(ok([]));
      await api.aiRmf.getAISystems();
      expect(mockFetch).toHaveBeenCalledWith(`${API}/ai-rmf/systems`, expect.any(Object));
    });

    it('updateAISystem sends PATCH', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.aiRmf.updateAISystem('s1', { name: 'Updated' });
      expect(mockFetch).toHaveBeenCalledWith(`${API}/ai-rmf/systems/s1`, expect.objectContaining({ method: 'PATCH' }));
    });

    it('deleteAISystem sends DELETE', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.aiRmf.deleteAISystem('s1');
      expect(mockFetch).toHaveBeenCalledWith(`${API}/ai-rmf/systems/s1`, expect.objectContaining({ method: 'DELETE' }));
    });

    it('updateCoreFunction sends PATCH', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.aiRmf.updateCoreFunction('s1', 'GOVERN', { status: 'done' });
      expect(mockFetch).toHaveBeenCalledWith(
        `${API}/ai-rmf/systems/s1/functions/GOVERN`,
        expect.objectContaining({ method: 'PATCH' }),
      );
    });

    it('addActor sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.aiRmf.addActor('s1', { actorType: 'developer', name: 'Alice', role: 'lead' });
      expect(mockFetch).toHaveBeenCalledWith(`${API}/ai-rmf/systems/s1/actors`, expect.objectContaining({ method: 'POST' }));
    });

    it('removeActor sends DELETE', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.aiRmf.removeActor('a1');
      expect(mockFetch).toHaveBeenCalledWith(`${API}/ai-rmf/actors/a1`, expect.objectContaining({ method: 'DELETE' }));
    });

    it('createAssessment sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.aiRmf.createAssessment('s1', { assessmentType: 'self', assessedBy: 'u1' });
      expect(mockFetch).toHaveBeenCalledWith(
        `${API}/ai-rmf/systems/s1/assessments`,
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('getAssessments fetches assessments', async () => {
      mockFetch.mockResolvedValueOnce(ok([]));
      await api.aiRmf.getAssessments('s1');
      expect(mockFetch).toHaveBeenCalledWith(`${API}/ai-rmf/systems/s1/assessments`, expect.any(Object));
    });

    it('calculateTrustworthinessScore sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.aiRmf.calculateTrustworthinessScore('s1');
      expect(mockFetch).toHaveBeenCalledWith(
        `${API}/ai-rmf/systems/s1/calculate-trustworthiness`,
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('getDashboardData fetches dashboard', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.aiRmf.getDashboardData();
      expect(mockFetch).toHaveBeenCalledWith(`${API}/ai-rmf/dashboard`, expect.any(Object));
    });
  });

  // =========================================================================
  // Feature Subscriptions (top-level)
  // =========================================================================
  describe('Feature subscriptions (top-level)', () => {
    it('getAvailableFeatures fetches features', async () => {
      mockFetch.mockResolvedValueOnce(ok({ features: [] }));
      await api.getAvailableFeatures();
      expect(mockFetch).toHaveBeenCalledWith(`${API}/billing/features`, expect.any(Object));
    });

    it('getFeatureSubscriptions fetches subscriptions', async () => {
      mockFetch.mockResolvedValueOnce(ok({ subscriptions: [] }));
      await api.getFeatureSubscriptions();
      expect(mockFetch).toHaveBeenCalledWith(`${API}/billing/features/subscriptions`, expect.any(Object));
    });

    it('subscribeToFeature sends POST with default annual', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.subscribeToFeature('feat1');
      const callWithBody = mockFetch.mock.calls.find((c: [string, RequestInit]) => c[1]?.body !== null) as [string, RequestInit] | undefined;
      const body = parseBodyFromCall(callWithBody);
      expect(body.billingCycle).toBe('annual');
    });

    it('subscribeToFeature sends POST with monthly', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.subscribeToFeature('feat1', 'monthly');
      const callWithBody = mockFetch.mock.calls.find((c: [string, RequestInit]) => c[1]?.body !== null) as [string, RequestInit] | undefined;
      const body = parseBodyFromCall(callWithBody);
      expect(body.billingCycle).toBe('monthly');
    });

    it('unsubscribeFromFeature sends DELETE', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.unsubscribeFromFeature('feat1');
      expect(mockFetch).toHaveBeenCalledWith(
        `${API}/billing/features/feat1/unsubscribe`,
        expect.objectContaining({ method: 'DELETE' }),
      );
    });

    it('checkFeatureAccess fetches access', async () => {
      mockFetch.mockResolvedValueOnce(ok({ hasAccess: true }));
      const result = await api.checkFeatureAccess('feat1');
      expect(result.hasAccess).toBe(true);
    });

    it('getAvailableBundles fetches bundles', async () => {
      mockFetch.mockResolvedValueOnce(ok({ bundles: [] }));
      await api.getAvailableBundles();
      expect(mockFetch).toHaveBeenCalledWith(`${API}/billing/bundles`, expect.any(Object));
    });

    it('subscribeToBundle sends POST with default annual', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.subscribeToBundle('bundle1');
      const callWithBody = mockFetch.mock.calls.find((c: [string, RequestInit]) => c[1]?.body !== null) as [string, RequestInit] | undefined;
      const body = parseBodyFromCall(callWithBody);
      expect(body.billingCycle).toBe('annual');
    });
  });

  // =========================================================================
  // api.euRegulations
  // =========================================================================
  describe('api.euRegulations', () => {
    describe('aiAct', () => {
      it('registerSystem sends POST', async () => {
        mockFetch.mockResolvedValueOnce(ok({}));
        await api.euRegulations.aiAct.registerSystem({ name: 'System' });
        expect(mockFetch).toHaveBeenCalledWith(`${API}/eu-regulations/ai-act/systems`, expect.objectContaining({ method: 'POST' }));
      });

      it('getSystems fetches systems', async () => {
        mockFetch.mockResolvedValueOnce(ok({ systems: [] }));
        await api.euRegulations.aiAct.getSystems();
        expect(mockFetch).toHaveBeenCalledWith(`${API}/eu-regulations/ai-act/systems`, expect.any(Object));
      });

      it('updateSystemStatus sends PATCH', async () => {
        mockFetch.mockResolvedValueOnce(ok({}));
        await api.euRegulations.aiAct.updateSystemStatus('s1', 'compliant');
        const callWithBody = mockFetch.mock.calls.find((c: [string, RequestInit]) => c[1]?.body !== null) as [string, RequestInit] | undefined;
      const body = parseBodyFromCall(callWithBody);
        expect(body.complianceStatus).toBe('compliant');
      });

      it('deleteSystem sends DELETE', async () => {
        mockFetch.mockResolvedValueOnce(ok({}));
        await api.euRegulations.aiAct.deleteSystem('s1');
        expect(mockFetch).toHaveBeenCalledWith(
          `${API}/eu-regulations/ai-act/systems/s1`,
          expect.objectContaining({ method: 'DELETE' }),
        );
      });

      it('getTransparencyReports with date filters', async () => {
        mockFetch.mockResolvedValueOnce(ok({ reports: [] }));
        const start = new Date('2025-01-01');
        const end = new Date('2025-06-01');
        await api.euRegulations.aiAct.getTransparencyReports(start, end);
        const url = mockFetch.mock.calls[0][0] as string;
        expect(url).toContain('startDate=');
        expect(url).toContain('endDate=');
      });

      it('getTransparencyReports without date filters', async () => {
        mockFetch.mockResolvedValueOnce(ok({ reports: [] }));
        await api.euRegulations.aiAct.getTransparencyReports();
        expect(mockFetch).toHaveBeenCalledWith(`${API}/eu-regulations/ai-act/transparency-reports`, expect.any(Object));
      });

      it('conductRiskAssessment sends POST', async () => {
        mockFetch.mockResolvedValueOnce(ok({}));
        await api.euRegulations.aiAct.conductRiskAssessment('s1', { scope: 'full' });
        expect(mockFetch).toHaveBeenCalledWith(
          `${API}/eu-regulations/ai-act/systems/s1/assessments`,
          expect.objectContaining({ method: 'POST' }),
        );
      });
    });

    describe('dma', () => {
      it('registerGatekeeper sends POST', async () => {
        mockFetch.mockResolvedValueOnce(ok({}));
        await api.euRegulations.dma.registerGatekeeper({ name: 'GK' });
        expect(mockFetch).toHaveBeenCalledWith(`${API}/eu-regulations/dma/gatekeepers`, expect.objectContaining({ method: 'POST' }));
      });

      it('getObligations fetches obligations', async () => {
        mockFetch.mockResolvedValueOnce(ok({ obligations: [] }));
        await api.euRegulations.dma.getObligations('gk1');
        expect(mockFetch).toHaveBeenCalledWith(`${API}/eu-regulations/dma/gatekeepers/gk1/obligations`, expect.any(Object));
      });

      it('updateObligationCompliance sends PATCH', async () => {
        mockFetch.mockResolvedValueOnce(ok({ success: true }));
        await api.euRegulations.dma.updateObligationCompliance('gk1', 'dataPortability', { status: 'compliant' });
        expect(mockFetch).toHaveBeenCalledWith(
          `${API}/eu-regulations/dma/gatekeepers/gk1/obligations/dataPortability`,
          expect.objectContaining({ method: 'PATCH' }),
        );
      });

      it('deleteGatekeeper sends DELETE', async () => {
        mockFetch.mockResolvedValueOnce(ok({}));
        await api.euRegulations.dma.deleteGatekeeper('gk1');
        expect(mockFetch).toHaveBeenCalledWith(
          `${API}/eu-regulations/dma/gatekeepers/gk1`,
          expect.objectContaining({ method: 'DELETE' }),
        );
      });
    });

    describe('dsa', () => {
      it('registerPlatform sends POST', async () => {
        mockFetch.mockResolvedValueOnce(ok({}));
        await api.euRegulations.dsa.registerPlatform({ name: 'Platform' });
        expect(mockFetch).toHaveBeenCalledWith(`${API}/eu-regulations/dsa/platforms`, expect.objectContaining({ method: 'POST' }));
      });

      it('recordContentModeration sends POST', async () => {
        mockFetch.mockResolvedValueOnce(ok({}));
        await api.euRegulations.dsa.recordContentModeration('p1', { action: 'removed' });
        expect(mockFetch).toHaveBeenCalledWith(
          `${API}/eu-regulations/dsa/platforms/p1/content-moderation`,
          expect.objectContaining({ method: 'POST' }),
        );
      });

      it('reportIllegalContent sends POST', async () => {
        mockFetch.mockResolvedValueOnce(ok({}));
        await api.euRegulations.dsa.reportIllegalContent('p1', { type: 'spam' });
        expect(mockFetch).toHaveBeenCalledWith(
          `${API}/eu-regulations/dsa/platforms/p1/illegal-content-reports`,
          expect.objectContaining({ method: 'POST' }),
        );
      });

      it('configureNonPersonalizedFeed sends POST', async () => {
        mockFetch.mockResolvedValueOnce(ok({}));
        await api.euRegulations.dsa.configureNonPersonalizedFeed('p1', { enabled: true });
        expect(mockFetch).toHaveBeenCalledWith(
          `${API}/eu-regulations/dsa/platforms/p1/non-personalized-feed`,
          expect.objectContaining({ method: 'POST' }),
        );
      });

      it('updateNonPersonalizedFeedStatus sends PATCH', async () => {
        mockFetch.mockResolvedValueOnce(ok({}));
        await api.euRegulations.dsa.updateNonPersonalizedFeedStatus('p1', { active: false });
        expect(mockFetch).toHaveBeenCalledWith(
          `${API}/eu-regulations/dsa/platforms/p1/non-personalized-feed`,
          expect.objectContaining({ method: 'PATCH' }),
        );
      });

      it('deletePlatform sends DELETE', async () => {
        mockFetch.mockResolvedValueOnce(ok({}));
        await api.euRegulations.dsa.deletePlatform('p1');
        expect(mockFetch).toHaveBeenCalledWith(
          `${API}/eu-regulations/dsa/platforms/p1`,
          expect.objectContaining({ method: 'DELETE' }),
        );
      });
    });
  });

  // =========================================================================
  // api.onboarding
  // =========================================================================
  describe('api.onboarding', () => {
    it('getProgress fetches progress', async () => {
      mockFetch.mockResolvedValueOnce(ok({ progress: {} }));
      await api.onboarding.getProgress();
      expect(mockFetch).toHaveBeenCalledWith(`${API}/onboarding/progress`, expect.any(Object));
    });

    it('updateProgress sends PUT', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.onboarding.updateProgress({ completedFlows: ['welcome'] } as any);
      expect(mockFetch).toHaveBeenCalledWith(`${API}/onboarding/progress`, expect.objectContaining({ method: 'PUT' }));
    });

    it('trackEvent sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.onboarding.trackEvent({ eventType: 'flow_started', flowName: 'welcome' });
      expect(mockFetch).toHaveBeenCalledWith(`${API}/onboarding/event`, expect.objectContaining({ method: 'POST' }));
    });

    it('completeMilestone sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.onboarding.completeMilestone('first_framework');
      expect(mockFetch).toHaveBeenCalledWith(
        `${API}/onboarding/complete-milestone`,
        expect.objectContaining({ method: 'POST', body: JSON.stringify({ milestone: 'first_framework' }) }),
      );
    });

    it('updatePreferences sends PUT', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.onboarding.updatePreferences({ showHints: false });
      expect(mockFetch).toHaveBeenCalledWith(`${API}/onboarding/preferences`, expect.objectContaining({ method: 'PUT' }));
    });

    it('skipFlow sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.onboarding.skipFlow('welcome');
      expect(mockFetch).toHaveBeenCalledWith(
        `${API}/onboarding/skip-flow`,
        expect.objectContaining({ method: 'POST', body: JSON.stringify({ flowName: 'welcome' }) }),
      );
    });

    it('reset sends POST', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.onboarding.reset();
      expect(mockFetch).toHaveBeenCalledWith(`${API}/onboarding/reset`, expect.objectContaining({ method: 'POST' }));
    });

    it('getChecklist fetches checklist', async () => {
      mockFetch.mockResolvedValueOnce(ok({ checklist: {} }));
      await api.onboarding.getChecklist();
      expect(mockFetch).toHaveBeenCalledWith(`${API}/onboarding/checklist`, expect.any(Object));
    });

    it('updateChecklist sends PUT', async () => {
      mockFetch.mockResolvedValueOnce(ok({}));
      await api.onboarding.updateChecklist({ invitedTeam: true } as any);
      expect(mockFetch).toHaveBeenCalledWith(`${API}/onboarding/checklist`, expect.objectContaining({ method: 'PUT' }));
    });
  });
});
