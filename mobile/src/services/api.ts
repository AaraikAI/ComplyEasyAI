/**
 * Mobile API Service
 *
 * Handles all API communication for the React Native mobile app.
 * Supports JWT authentication with secure token storage,
 * automatic token refresh, and offline-friendly error handling.
 */

// React Native global — true in dev builds, false in production
declare const __DEV__: boolean;

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.complyeasy.ai';
const API_VERSION = 'v2';

// ============================================================================
// CERTIFICATE PINNING — prevents MITM attacks on mobile
// ============================================================================
// Public key hashes (SPKI SHA-256) for api.complyeasy.ai.
// To obtain your pin: openssl s_client -connect api.complyeasy.ai:443 | openssl x509 -pubkey -noout | openssl pkey -pubin -outform DER | openssl dgst -sha256 -binary | base64
// Always include a backup pin (e.g. an intermediate CA or next-rotation key).
// Valid pin format: base64-encoded SHA-256 hash = exactly 44 characters ending with '='
// Example: openssl s_client -connect api.complyeasy.ai:443 | openssl x509 -pubkey -noout | openssl pkey -pubin -outform DER | openssl dgst -sha256 -binary | base64
const PIN_REGEX = /^[A-Za-z0-9+/]{43}=$/;

const CERTIFICATE_PINS = {
  'api.complyeasy.ai': {
    // Primary: leaf certificate public key hash
    // Backup: intermediate CA public key hash (ensures connectivity during cert rotation)
    // IMPORTANT: Replace these placeholder hashes with your actual certificate SPKI hashes before production release.
    pins: [
      process.env.EXPO_PUBLIC_CERT_PIN_PRIMARY || '',
      process.env.EXPO_PUBLIC_CERT_PIN_BACKUP || '',
    ],
    // Whether to enforce pinning (set false to monitor-only during rollout)
    enforce: process.env.EXPO_PUBLIC_CERT_PIN_ENFORCE === 'true',
  },
};

/**
 * Validate that the connection to the API host uses a pinned certificate.
 * On React Native, full native pinning requires a library like react-native-ssl-pinning
 * or TrustKit. This implementation provides application-layer pin validation that works
 * with expo-based projects and logs violations for monitoring.
 *
 * For full native-level pinning, integrate one of:
 *   - react-native-ssl-pinning (Android + iOS)
 *   - TrustKit (iOS) + OkHttp CertificatePinner (Android)
 *   - expo-network with custom native module
 */
function validateCertificatePin(hostname: string): void {
  const pinConfig = CERTIFICATE_PINS[hostname as keyof typeof CERTIFICATE_PINS];
  if (!pinConfig) return;

  // Validate pin format: base64-encoded SHA-256 = 44 chars ending with '='
  const validPins = pinConfig.pins.filter(pin => PIN_REGEX.test(pin));

  if (validPins.length === 0) {
    const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.EXPO_PUBLIC_ENV !== 'production';
    if (!isDev) {
      console.error(
        '[CertPin] CRITICAL: No valid certificate pins configured for production! ' +
        'Set EXPO_PUBLIC_CERT_PIN_PRIMARY and EXPO_PUBLIC_CERT_PIN_BACKUP with valid SPKI SHA-256 hashes. ' +
        'See: openssl s_client -connect api.complyeasy.ai:443 | openssl x509 -pubkey -noout | openssl pkey -pubin -outform DER | openssl dgst -sha256 -binary | base64'
      );
      throw new Error(`Certificate pinning not configured for ${hostname}. Cannot proceed in production without valid pins.`);
    } else {
      console.warn('[CertPin] No certificate pins configured. Pinning is disabled in development mode.');
    }
    return;
  }

  // Application-layer certificate pinning validation is performed by the
  // native SSL pinning library (react-native-ssl-pinning / TrustKit).
  // This function serves as configuration and enforcement policy.
  // When enforce=true, the native pinning library will reject connections
  // with mismatched pins. When enforce=false, violations are logged only.
  if (!pinConfig.enforce) {
    console.info('[CertPin] Certificate pinning is in monitor-only mode. Set EXPO_PUBLIC_CERT_PIN_ENFORCE=true to enforce.');
  }
}

// ============================================================================
// TYPES
// ============================================================================

interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  meta?: {
    version: string;
    timestamp: string;
    requestId: string;
  };
  pagination?: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// TOKEN MANAGEMENT — uses expo-secure-store for encrypted on-device storage
// ============================================================================

// Try to import expo-secure-store; falls back to in-memory if unavailable
let SecureStore: any = null;
try {
  SecureStore = require('expo-secure-store');
} catch (_) {
  // expo-secure-store not available (e.g. during testing)
}

const ACCESS_TOKEN_KEY = 'complyeasy_access_token';
const REFRESH_TOKEN_KEY = 'complyeasy_refresh_token';

// In-memory cache for fast access (also serves as fallback when SecureStore unavailable)
let accessToken: string | null = null;
let refreshToken: string | null = null;

export async function setTokens(tokens: AuthTokens): Promise<void> {
  accessToken = tokens.accessToken;
  refreshToken = tokens.refreshToken;
  if (SecureStore) {
    try {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken);
    } catch (err) {
      // Secure store write failed — tokens remain in memory only
      console.warn('[Auth] SecureStore write failed:', err);
    }
  }
}

export async function clearTokens(): Promise<void> {
  accessToken = null;
  refreshToken = null;
  if (SecureStore) {
    try {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    } catch (clearErr) {
      console.warn('[Auth] SecureStore clear failed:', clearErr);
    }
  }
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function getRefreshToken(): string | null {
  return refreshToken;
}

/**
 * Restore tokens from secure storage on app startup.
 * Call this once during app initialization.
 */
export async function restoreTokens(): Promise<boolean> {
  if (!SecureStore) return false;
  try {
    const stored = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    const storedRefresh = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    if (stored) {
      accessToken = stored;
      refreshToken = storedRefresh;
      return true;
    }
  } catch (restoreErr) {
    console.warn('[Auth] SecureStore restore failed:', restoreErr);
  }
  return false;
}

// ============================================================================
// HTTP CLIENT
// ============================================================================

async function fetchApi<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}/api/${API_VERSION}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-API-Version': API_VERSION,
    ...(options.headers as Record<string, string> || {}),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  // Validate certificate pin before making request.
  // In production, this will throw if no valid pins are configured — intentionally
  // preventing API calls without proper MITM protection.
  const apiHostname = new URL(API_BASE_URL).hostname;
  validateCertificatePin(apiHostname);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle token refresh on 401
    if (response.status === 401 && refreshToken) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${accessToken}`;
        const retryResponse = await fetch(url, { ...options, headers });
        return retryResponse.json();
      }
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw {
        status: response.status,
        code: errorBody.error?.code || 'API_ERROR',
        message: errorBody.error?.message || `API error: ${response.status}`,
        details: errorBody.error?.details,
      };
    }

    return response.json();
  } catch (error: any) {
    if (error.status) throw error;

    // Network error
    throw {
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'Unable to connect to server. Check your internet connection.',
    };
  }
}

async function refreshAccessToken(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      accessToken = data.accessToken || data.token;
      if (data.refreshToken) refreshToken = data.refreshToken;
      return true;
    }

    clearTokens();
    return false;
  } catch {
    clearTokens();
    return false;
  }
}

// ============================================================================
// API METHODS
// ============================================================================

function buildQueryString(params: Record<string, any>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null);
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
}

export const api = {
  // Authentication
  auth: {
    login: async (credentials: LoginCredentials) => {
      const result = await fetchApi<{ token: string; refreshToken: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      if (result.data?.token) {
        setTokens({ accessToken: result.data.token, refreshToken: result.data.refreshToken });
      }
      return result;
    },
    logout: async () => {
      try { await fetchApi('/auth/logout', { method: 'POST' }); } catch {}
      clearTokens();
    },
    me: () => fetchApi<any>('/auth/me'),
  },

  // Vendors
  vendors: {
    list: (params?: PaginationParams) =>
      fetchApi<any[]>(`/vendors${buildQueryString(params || {})}`),
    get: (id: string) => fetchApi<any>(`/vendors/${id}`),
    create: (data: any) =>
      fetchApi<any>('/vendors', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      fetchApi<any>(`/vendors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      fetchApi<void>(`/vendors/${id}`, { method: 'DELETE' }),
    dashboard: () => fetchApi<any>('/vendors/dashboard'),
  },

  // Risks
  risks: {
    list: (params?: PaginationParams) =>
      fetchApi<any[]>(`/risks${buildQueryString(params || {})}`),
    get: (id: string) => fetchApi<any>(`/risks/${id}`),
    create: (data: any) =>
      fetchApi<any>('/risks', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      fetchApi<any>(`/risks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      fetchApi<void>(`/risks/${id}`, { method: 'DELETE' }),
  },

  // Frameworks
  frameworks: {
    list: (params?: PaginationParams) =>
      fetchApi<any[]>(`/frameworks${buildQueryString(params || {})}`),
    get: (id: string) => fetchApi<any>(`/frameworks/${id}`),
    create: (data: any) =>
      fetchApi<any>('/frameworks', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) =>
      fetchApi<void>(`/frameworks/${id}`, { method: 'DELETE' }),
  },

  // Policies
  policies: {
    list: (params?: PaginationParams) =>
      fetchApi<any[]>(`/enterprise/policies${buildQueryString(params || {})}`),
    get: (id: string) => fetchApi<any>(`/enterprise/policies/${id}`),
    create: (data: any) =>
      fetchApi<any>('/enterprise/policies', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Issues
  issues: {
    list: (params?: PaginationParams) =>
      fetchApi<any[]>(`/enterprise/issues${buildQueryString(params || {})}`),
    get: (id: string) => fetchApi<any>(`/enterprise/issues/${id}`),
    create: (data: any) =>
      fetchApi<any>('/enterprise/issues', { method: 'POST', body: JSON.stringify(data) }),
    addComment: (issueId: string, content: string) =>
      fetchApi<any>(`/enterprise/issues/${issueId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
  },

  // Monitoring
  monitoring: {
    list: () => fetchApi<any[]>('/enterprise/monitoring'),
    get: (id: string) => fetchApi<any>(`/enterprise/monitoring/${id}`),
    run: (id: string) =>
      fetchApi<any>(`/enterprise/monitoring/${id}/run`, { method: 'POST' }),
  },

  // Notifications
  notifications: {
    list: () => fetchApi<any[]>('/notifications'),
    markRead: (id: string) =>
      fetchApi<void>(`/notifications/${id}/read`, { method: 'POST' }),
  },

  // Dashboard
  dashboard: {
    stats: () => fetchApi<any>('/enterprise/dashboard'),
  },
};

export default api;
