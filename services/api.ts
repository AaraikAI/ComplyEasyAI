import { User, RiskItem, ComplianceFramework, AuditLog, Integration } from '../types';

// Backend API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Log API URL in development (Vite uses import.meta.env, not process.env)
if (import.meta.env.DEV) {
  console.log('API Base URL:', API_BASE_URL);
}

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Set auth token in localStorage
const setAuthToken = (token: string): void => {
  localStorage.setItem('authToken', token);
};

// Clear auth token
const clearAuthToken = (): void => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user_data');
};

// HTTP Client with authentication
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        clearAuthToken();
        window.location.href = '/';
        throw new Error('Authentication required. Please log in again.');
      }

      const error = await response.json().catch(() => ({}));
      const errorMessage = error.error || error.message || `HTTP ${response.status}: ${response.statusText}`;
      
      // For 501 (Not Implemented), include the full error object
      if (response.status === 501) {
        throw { message: errorMessage, status: 501, ...error };
      }
      
      // Log detailed error for debugging
      if (import.meta.env.DEV) {
        console.error('API Error:', {
          endpoint,
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
          url: `${API_BASE_URL}${endpoint}`,
        });
      }
      
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error: any) {
    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('Network error - Backend may be down:', {
        endpoint,
        url: `${API_BASE_URL}${endpoint}`,
        apiBaseUrl: API_BASE_URL,
      });
      throw new Error(`Cannot connect to backend server. Please ensure the backend is running on ${API_BASE_URL.replace('/api', '')}`);
    }
    throw error;
  }
}

export const api = {
  // --- Auth & User ---
  auth: {
    requestMagicLink: async (email: string) => {
      // Returns response with devToken in development mode
      return fetchAPI<any>('/auth/magic-link', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    },

    verifyMagicLink: async (token: string) => {
      const response: any = await fetchAPI('/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });

      if (response.accessToken) {
        setAuthToken(response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        
        // Map backend user response to frontend User type
        const user = {
          id: response.user.id,
          name: response.user.name,
          email: response.user.email,
          role: response.user.role,
          avatar: response.user.avatar || response.user.name.substring(0, 2).toUpperCase(),
          organizationId: response.user.organization?.id || response.user.organizationId,
        };
        
        localStorage.setItem('user_data', JSON.stringify(user));
        return user;
      }

      throw new Error('No access token received');
    },

    register: async (name: string, email: string, organizationName?: string) => {
      return fetchAPI('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, organizationName }),
      });
    },

    refreshToken: async () => {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) throw new Error('No refresh token');

      const response: any = await fetchAPI('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });

      if (response.accessToken) {
        setAuthToken(response.accessToken);
      }

      return response;
    },

    logout: () => {
      clearAuthToken();
    },
  },

  // --- Risks ---
  risks: {
    list: async (params?: { status?: string; severity?: string; assignedTo?: string }) => {
      const queryString = params
        ? '?' + new URLSearchParams(params as any).toString()
        : '';
      return fetchAPI<RiskItem[]>(`/risks${queryString}`);
    },

    getById: async (id: string) => {
      return fetchAPI<RiskItem>(`/risks/${id}`);
    },

    create: async (risk: Partial<RiskItem>) => {
      return fetchAPI<RiskItem>('/risks', {
        method: 'POST',
        body: JSON.stringify(risk),
      });
    },

    update: async (id: string, risk: Partial<RiskItem>) => {
      return fetchAPI<RiskItem>(`/risks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(risk),
      });
    },

    delete: async (id: string) => {
      return fetchAPI(`/risks/${id}`, {
        method: 'DELETE',
      });
    },

    prioritize: async () => {
      return fetchAPI('/risks/prioritize', {
        method: 'POST',
      });
    },

    generateRemediation: async (id: string) => {
      return fetchAPI(`/risks/${id}/remediation`, {
        method: 'POST',
      });
    },

    scan: async () => {
      return fetchAPI('/risks/scan', {
        method: 'POST',
      });
    },
  },

  // --- Frameworks ---
  frameworks: {
    list: async () => {
      return fetchAPI<ComplianceFramework[]>('/frameworks');
    },

    getById: async (id: string) => {
      return fetchAPI<ComplianceFramework>(`/frameworks/${id}`);
    },

    exportControl: async (frameworkId: string, controlId: string) => {
      return fetchAPI(`/frameworks/${frameworkId}/controls/${controlId}/export`);
    },

    createControl: async (frameworkId: string, control: { name: string; description?: string; status?: string }) => {
      return fetchAPI(`/frameworks/${frameworkId}/controls`, {
        method: 'POST',
        body: JSON.stringify(control),
      });
    },

    updateControl: async (frameworkId: string, controlId: string, updates: { status?: string; description?: string; evidence?: string }) => {
      return fetchAPI(`/frameworks/${frameworkId}/controls/${controlId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    },

    uploadEvidence: async (frameworkId: string, controlId: string, formData: FormData) => {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/frameworks/${frameworkId}/controls/${controlId}/evidence`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || error.message || `HTTP ${response.status}`);
      }

      return response.json();
    },

    smartUpload: async (frameworkId: string, formData: FormData) => {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/frameworks/${frameworkId}/smart-upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || error.message || `HTTP ${response.status}`);
      }

      return response.json();
    },

    create: async (framework: Partial<ComplianceFramework>) => {
      return fetchAPI<ComplianceFramework>('/frameworks', {
        method: 'POST',
        body: JSON.stringify(framework),
      });
    },

    update: async (id: string, framework: Partial<ComplianceFramework>) => {
      return fetchAPI<ComplianceFramework>(`/frameworks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(framework),
      });
    },

    delete: async (id: string) => {
      return fetchAPI(`/frameworks/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // --- AI ---
  ai: {
    generateReport: async (framework: string, companyName: string, context: string) => {
      return fetchAPI('/ai/report', {
        method: 'POST',
        body: JSON.stringify({ framework, companyName, context }),
      });
    },

    generatePolicy: async (type: string, company: string, tone: string) => {
      return fetchAPI('/ai/policy', {
        method: 'POST',
        body: JSON.stringify({ type, company, tone }),
      });
    },

    analyzeContract: async (text: string) => {
      return fetchAPI('/ai/contract', {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
    },

    performGapAnalysis: async (current: string[], target: string) => {
      return fetchAPI('/ai/gap-analysis', {
        method: 'POST',
        body: JSON.stringify({ current, target }),
      });
    },

    generateRFPResponse: async (question: string, context: string) => {
      return fetchAPI('/ai/rfp', {
        method: 'POST',
        body: JSON.stringify({ question, context }),
      });
    },

    generatePhishing: async (theme: string, department: string) => {
      return fetchAPI('/ai/phishing', {
        method: 'POST',
        body: JSON.stringify({ theme, department }),
      });
    },

    scoreVendor: async (vendor: string, service: string, dataAccess: string) => {
      return fetchAPI('/ai/vendor-score', {
        method: 'POST',
        body: JSON.stringify({ vendor, service, dataAccess }),
      });
    },

    generateDataMap: async (process: string) => {
      return fetchAPI('/ai/data-map', {
        method: 'POST',
        body: JSON.stringify({ process }),
      });
    },

    generateBCP: async (scenario: string) => {
      return fetchAPI('/ai/bcp', {
        method: 'POST',
        body: JSON.stringify({ scenario }),
      });
    },

    chat: async (message: string) => {
      return fetchAPI('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message }),
      });
    },
  },

  // --- Audit ---
  audit: {
    list: async () => {
      return fetchAPI<AuditLog[]>('/audit');
    },

    log: async (action: string, user: string, details?: string) => {
      return fetchAPI<AuditLog>('/audit', {
        method: 'POST',
        body: JSON.stringify({ action, user, details }),
      });
    },
  },

  // --- Billing ---
  billing: {
    createCheckout: async (plan: 'Basic' | 'Pro' | 'Enterprise') => {
      return fetchAPI('/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan }),
      });
    },

    createPortalSession: async () => {
      return fetchAPI('/billing/portal', {
        method: 'POST',
      });
    },

    getSubscription: async () => {
      return fetchAPI('/billing/subscription');
    },
  },

  // --- Integrations ---
  integrations: {
    list: async () => {
      const response = await fetchAPI<{ integrations: Integration[] }>('/integrations');
      return response.integrations || [];
    },

    getStatus: async (provider: string) => {
      return fetchAPI<Integration>(`/integrations/${provider}`);
    },

    authorize: async (provider: string) => {
      return fetchAPI<{ authUrl: string }>(`/integrations/${provider}/authorize`);
    },

    sync: async (provider: string) => {
      return fetchAPI(`/integrations/${provider}/sync`, {
        method: 'POST',
      });
    },

    disconnect: async (provider: string) => {
      return fetchAPI(`/integrations/${provider}`, {
        method: 'DELETE',
      });
    },

    connectAWS: async (credentials: { accessKeyId: string; secretAccessKey: string; region: string }) => {
      return fetchAPI('/integrations/aws/connect', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
    },

    connectAzure: async (credentials: { subscriptionId: string; clientId: string; clientSecret: string; tenantId: string }) => {
      return fetchAPI('/integrations/azure/connect', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
    },

    connectWithApiKey: async (provider: string, credentials: { apiKey: string; baseUrl?: string }) => {
      return fetchAPI(`/integrations/${provider}/connect`, {
        method: 'POST',
        body: JSON.stringify({ type: 'api-key', ...credentials }),
      });
    },

    connectWithApiKeySecret: async (provider: string, credentials: { apiKey: string; apiSecret: string; baseUrl?: string }) => {
      return fetchAPI(`/integrations/${provider}/connect`, {
        method: 'POST',
        body: JSON.stringify({ type: 'api-key-secret', ...credentials }),
      });
    },

    connectWithUsernamePassword: async (provider: string, credentials: { username: string; password: string; baseUrl?: string; apiKey?: string }) => {
      return fetchAPI(`/integrations/${provider}/connect`, {
        method: 'POST',
        body: JSON.stringify({ type: 'username-password', ...credentials }),
      });
    },

    connectWithServiceAccount: async (provider: string, credentials: { serviceAccountJson: any }) => {
      return fetchAPI(`/integrations/${provider}/connect`, {
        method: 'POST',
        body: JSON.stringify({ type: 'service-account', ...credentials }),
      });
    },

    connectWithPat: async (provider: string, credentials: { token: string; baseUrl?: string }) => {
      return fetchAPI(`/integrations/${provider}/connect`, {
        method: 'POST',
        body: JSON.stringify({ type: 'pat', ...credentials }),
      });
    },
  },

  // --- Team Management ---
  team: {
    list: async () => {
      return fetchAPI<User[]>('/team');
    },

    invite: async (name: string, email: string, role?: string) => {
      return fetchAPI<User>('/team/invite', {
        method: 'POST',
        body: JSON.stringify({ name, email, role }),
      });
    },

    updateRole: async (userId: string, role: string) => {
      return fetchAPI<User>(`/team/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
    },

    remove: async (userId: string) => {
      return fetchAPI(`/team/${userId}`, {
        method: 'DELETE',
      });
    },
  },
};

// Export helper functions
export { getAuthToken, setAuthToken, clearAuthToken };
