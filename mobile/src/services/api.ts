/**
 * Mobile API Service
 *
 * Handles all API communication for the React Native mobile app.
 * Supports JWT authentication with secure token storage,
 * automatic token refresh, and offline-friendly error handling.
 */

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.complyeasy.ai';
const API_VERSION = 'v2';

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
// TOKEN MANAGEMENT
// ============================================================================

let accessToken: string | null = null;
let refreshToken: string | null = null;

// In production, use expo-secure-store for secure token storage:
// import * as SecureStore from 'expo-secure-store';

export function setTokens(tokens: AuthTokens): void {
  accessToken = tokens.accessToken;
  refreshToken = tokens.refreshToken;
}

export function clearTokens(): void {
  accessToken = null;
  refreshToken = null;
}

export function getAccessToken(): string | null {
  return accessToken;
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
