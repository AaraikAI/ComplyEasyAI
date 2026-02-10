/**
 * API Service Tests
 *
 * Tests token management, HTTP client behavior, authentication flow,
 * token refresh on 401, and error handling.
 */

import { api, setTokens, clearTokens, getAccessToken } from '../api';

// ============================================================================
// SETUP
// ============================================================================

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
  clearTokens();
});

// Helper to create a successful fetch response
function mockResponse(data: any, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(data),
  };
}

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

describe('Token Management', () => {
  test('getAccessToken returns null initially', () => {
    expect(getAccessToken()).toBeNull();
  });

  test('setTokens stores access and refresh tokens', () => {
    setTokens({ accessToken: 'access-123', refreshToken: 'refresh-456' });
    expect(getAccessToken()).toBe('access-123');
  });

  test('clearTokens removes all tokens', () => {
    setTokens({ accessToken: 'access-123', refreshToken: 'refresh-456' });
    clearTokens();
    expect(getAccessToken()).toBeNull();
  });
});

// ============================================================================
// AUTH API
// ============================================================================

describe('api.auth', () => {
  test('login sends credentials and stores tokens on success', async () => {
    const loginResponse = {
      success: true,
      data: {
        token: 'jwt-token-abc',
        refreshToken: 'refresh-token-xyz',
        user: { id: '1', email: 'test@example.com', role: 'admin' },
      },
    };

    mockFetch.mockResolvedValueOnce(mockResponse(loginResponse));

    const result = await api.auth.login({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result.data.token).toBe('jwt-token-abc');
    expect(getAccessToken()).toBe('jwt-token-abc');

    // Verify correct endpoint and method
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/login'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
      })
    );
  });

  test('logout clears tokens even if API call fails', async () => {
    setTokens({ accessToken: 'token-123', refreshToken: 'refresh-456' });

    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await api.auth.logout();
    expect(getAccessToken()).toBeNull();
  });

  test('me sends authorization header when token is set', async () => {
    setTokens({ accessToken: 'my-token', refreshToken: 'refresh-456' });

    mockFetch.mockResolvedValueOnce(
      mockResponse({ success: true, data: { id: '1', email: 'test@example.com' } })
    );

    await api.auth.me();

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers['Authorization']).toBe('Bearer my-token');
  });
});

// ============================================================================
// HTTP CLIENT ERROR HANDLING
// ============================================================================

describe('HTTP Client Error Handling', () => {
  test('throws structured error on non-ok response', async () => {
    setTokens({ accessToken: 'token', refreshToken: 'refresh' });

    mockFetch.mockResolvedValueOnce(
      mockResponse(
        { error: { code: 'NOT_FOUND', message: 'Vendor not found' } },
        404
      )
    );

    await expect(api.vendors.get('nonexistent')).rejects.toEqual(
      expect.objectContaining({
        status: 404,
        code: 'NOT_FOUND',
        message: 'Vendor not found',
      })
    );
  });

  test('throws NETWORK_ERROR on fetch failure', async () => {
    setTokens({ accessToken: 'token', refreshToken: 'refresh' });
    mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(api.vendors.list()).rejects.toEqual(
      expect.objectContaining({
        status: 0,
        code: 'NETWORK_ERROR',
      })
    );
  });

  test('attempts token refresh on 401 response', async () => {
    setTokens({ accessToken: 'expired-token', refreshToken: 'valid-refresh' });

    // First call returns 401
    mockFetch.mockResolvedValueOnce(mockResponse({}, 401));

    // Refresh call succeeds
    mockFetch.mockResolvedValueOnce(
      mockResponse({ accessToken: 'new-token', refreshToken: 'new-refresh' })
    );

    // Retry call succeeds
    mockFetch.mockResolvedValueOnce(
      mockResponse({ success: true, data: [{ id: '1', name: 'Vendor' }] })
    );

    const result = await api.vendors.list();
    expect(result.data).toHaveLength(1);

    // 3 fetch calls: original, refresh, retry
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  test('clears tokens when refresh fails', async () => {
    setTokens({ accessToken: 'expired', refreshToken: 'also-expired' });

    // First call returns 401
    mockFetch.mockResolvedValueOnce(mockResponse({}, 401));

    // Refresh fails
    mockFetch.mockResolvedValueOnce(mockResponse({ error: 'invalid' }, 401));

    // Original 401 response falls through to error handler
    await expect(api.vendors.list()).rejects.toEqual(
      expect.objectContaining({ status: 401 })
    );

    expect(getAccessToken()).toBeNull();
  });
});

// ============================================================================
// API METHODS
// ============================================================================

describe('API Resource Methods', () => {
  beforeEach(() => {
    setTokens({ accessToken: 'valid-token', refreshToken: 'refresh' });
  });

  test('vendors.list sends GET with pagination query params', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ success: true, data: [] })
    );

    await api.vendors.list({ page: 2, pageSize: 10, sortBy: 'name', sortOrder: 'asc' });

    const url = mockFetch.mock.calls[0][0];
    expect(url).toContain('/vendors?');
    expect(url).toContain('page=2');
    expect(url).toContain('pageSize=10');
    expect(url).toContain('sortBy=name');
    expect(url).toContain('sortOrder=asc');
  });

  test('vendors.create sends POST with body', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ success: true, data: { id: 'new-1', name: 'New Vendor' } })
    );

    await api.vendors.create({ name: 'New Vendor', riskLevel: 'low' });

    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({ name: 'New Vendor', riskLevel: 'low' });
  });

  test('vendors.update sends PUT with id and body', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ success: true, data: { id: 'v1', name: 'Updated' } })
    );

    await api.vendors.update('v1', { name: 'Updated' });

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain('/vendors/v1');
    expect(options.method).toBe('PUT');
  });

  test('vendors.delete sends DELETE', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ success: true }, 200));

    await api.vendors.delete('v1');

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain('/vendors/v1');
    expect(options.method).toBe('DELETE');
  });

  test('risks.list sends GET', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ success: true, data: [] })
    );

    await api.risks.list();

    const url = mockFetch.mock.calls[0][0];
    expect(url).toContain('/risks');
  });

  test('issues.addComment sends POST with content', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ success: true, data: { id: 'comment-1' } })
    );

    await api.issues.addComment('issue-1', 'Great progress');

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain('/enterprise/issues/issue-1/comments');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({ content: 'Great progress' });
  });

  test('dashboard.stats sends GET', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ success: true, data: { totalVendors: 10 } })
    );

    const result = await api.dashboard.stats();
    expect(result.data.totalVendors).toBe(10);
  });
});
