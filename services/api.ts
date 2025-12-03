import { User, RiskItem, ComplianceFramework, AuditLog } from '../types';

// Backend API Configuration
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:5000/api';

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Set auth token in localStorage
const setAuthToken = (token: string): void => {
  localStorage.setItem('authToken');
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

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthToken();
      window.location.href = '/';
    }

    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  // --- Auth & User ---
  auth: {
    requestMagicLink: async (email: string) => {
      return fetchAPI('/auth/magic-link', {
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
        localStorage.setItem('user_data', JSON.stringify(response.user));
        localStorage.setItem('refreshToken', response.refreshToken);
      }

      return response.user;
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
};

// Export helper functions
export { getAuthToken, setAuthToken, clearAuthToken };
