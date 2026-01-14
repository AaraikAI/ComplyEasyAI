import { User, RiskItem, ComplianceFramework, AuditLog, Integration, TierName, SubscriptionDetails, UsageMetrics, Tier, TierComparison, UpgradePreview, Webhook, WebhookEvent, ApiKey, BillingCycle } from '../types';

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
        // Try to refresh token before redirecting
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          try {
            const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken }),
            });

            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              setAuthToken(refreshData.accessToken);
              
              // Retry the original request with new token
              const retryHeaders: HeadersInit = {
                'Content-Type': 'application/json',
                ...options.headers,
                'Authorization': `Bearer ${refreshData.accessToken}`,
              };
              
              const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers: retryHeaders,
              });

              if (retryResponse.ok) {
                return retryResponse.json();
              }
            }
          } catch (refreshError) {
            // Refresh failed, proceed with logout
            console.error('Token refresh failed:', refreshError);
          }
        }

        // If refresh failed or no refresh token, clear auth and redirect
        clearAuthToken();
        window.location.href = '/';
        throw new Error('Session expired. Please log in again.');
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
  user: {
    uploadAvatar: async (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      return fetchAPI<{ user: User; avatarUrl: string }>('/auth/profile/avatar', {
        method: 'POST',
        body: formData,
        headers: {}, // Let browser set Content-Type with boundary
      });
    },
    updateProfile: async (data: { name: string; email: string }) => {
      return fetchAPI('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    changePassword: async (currentPassword: string, newPassword: string) => {
      return fetchAPI('/auth/password', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
    },
  },

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

    register: async (name: string, email: string, organizationName?: string, password?: string) => {
      return fetchAPI('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, organizationName, password }),
      });
    },

    login: async (email: string, password: string) => {
      const response: any = await fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (response.accessToken) {
        setAuthToken(response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        
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

    getById: async (id: string, queryParams?: string) => {
      const url = queryParams ? `/frameworks/${id}?${queryParams}` : `/frameworks/${id}`;
      return fetchAPI<ComplianceFramework>(url);
    },

    exportControl: async (frameworkId: string, controlId: string) => {
      return fetchAPI(`/frameworks/${frameworkId}/controls/${controlId}/export`);
    },

    createControl: async (frameworkId: string, control: { name: string; description?: string; status?: string; category?: string; ownerId?: string }) => {
      return fetchAPI(`/frameworks/${frameworkId}/controls`, {
        method: 'POST',
        body: JSON.stringify(control),
      });
    },

    updateControl: async (frameworkId: string, controlId: string, updates: { status?: string; description?: string; evidence?: string; evidenceRequired?: boolean; ownerId?: string; category?: string }) => {
      return fetchAPI(`/frameworks/${frameworkId}/controls/${controlId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    },

    bulkUpdateControls: async (frameworkId: string, updates: { controlIds: string[]; status: string; evidenceRequired?: boolean }) => {
      return fetchAPI(`/frameworks/${frameworkId}/controls/bulk-update`, {
        method: 'POST',
        body: JSON.stringify(updates),
      });
    },

    deleteControl: async (frameworkId: string, controlId: string) => {
      return fetchAPI(`/frameworks/${frameworkId}/controls/${controlId}`, {
        method: 'DELETE',
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

    getEvidenceUrl: async (frameworkId: string, controlId: string) => {
      return fetchAPI<{ url: string }>(`/frameworks/${frameworkId}/controls/${controlId}/evidence/url`);
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

    getSuggestions: async (frameworkId: string) => {
      return fetchAPI<{ suggestions: any[] }>(`/frameworks/${frameworkId}/suggestions`);
    },

    acceptSuggestion: async (suggestionId: string) => {
      return fetchAPI(`/frameworks/suggestions/${suggestionId}/accept`, {
        method: 'POST',
      });
    },

    rejectSuggestion: async (suggestionId: string, feedback?: string) => {
      return fetchAPI(`/frameworks/suggestions/${suggestionId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ feedback }),
      });
    },

    smartUploadOld: async (frameworkId: string, formData: FormData) => {
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

    // Control Mappings
    getControlMappings: async (controlId: string) => {
      return fetchAPI(`/control-mappings/control/${controlId}`);
    },
    createControlMapping: async (mapping: { sourceControlId: string; targetControlId: string; mappingType?: string; confidence?: number }) => {
      return fetchAPI('/control-mappings', {
        method: 'POST',
        body: JSON.stringify(mapping),
      });
    },
    deleteControlMapping: async (mappingId: string) => {
      return fetchAPI(`/control-mappings/${mappingId}`, {
        method: 'DELETE',
      });
    },
    exportControlMappings: async () => {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/control-mappings/export/csv`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `control-mappings-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },

    // Evidence Versioning
    getEvidenceVersions: async (controlId: string) => {
      return fetchAPI(`/evidence-versions/control/${controlId}`);
    },
    restoreEvidenceVersion: async (controlId: string, versionId: string) => {
      return fetchAPI(`/evidence-versions/control/${controlId}/restore/${versionId}`, {
        method: 'POST',
      });
    },
    deleteEvidenceVersion: async (controlId: string, versionId: string) => {
      return fetchAPI(`/evidence-versions/control/${controlId}/${versionId}`, {
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

    performGapAnalysis: async (current: string[], target: string | string[]) => {
      return fetchAPI('/ai/gap-analysis', {
        method: 'POST',
        body: JSON.stringify({ current, target: Array.isArray(target) ? target : [target] }),
      });
    },

    generateRFPResponse: async (question: string, context: string) => {
      return fetchAPI('/ai/rfp', {
        method: 'POST',
        body: JSON.stringify({ question, context }),
      });
    },

    generatePhishing: async (type: string, theme: string, department: string, difficulty: string) => {
      return fetchAPI('/ai/phishing', {
        method: 'POST',
        body: JSON.stringify({ type, theme, department, difficulty }),
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

    generateBCP: async (scenario: string, rto?: string, rpo?: string) => {
      return fetchAPI('/ai/bcp', {
        method: 'POST',
        body: JSON.stringify({ scenario, rto, rpo }),
      });
    },

    chat: async (message: string, fileContext?: Array<{filename: string; content: string; type: string}>) => {
      return fetchAPI('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message, fileContext }),
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
    createCheckout: async (tier: TierName, billingCycle: BillingCycle = 'annual') => {
      return fetchAPI<{ url: string }>('/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ tier, billingCycle }),
      });
    },

    createPortalSession: async () => {
      return fetchAPI<{ url: string }>('/billing/portal', {
        method: 'POST',
      });
    },

    getSubscription: async () => {
      return fetchAPI<SubscriptionDetails>('/billing/subscription');
    },

    getAvailableTiers: async () => {
      return fetchAPI<{ tiers: Tier[] }>('/billing/tiers');
    },

    previewTierChange: async (targetTier: TierName, billingCycle: 'monthly' | 'annual' = 'annual') => {
      return fetchAPI<{
        comparison: any;
        stripePreview?: {
          proratedAmount: number;
          newMonthlyAmount: number;
          immediateCharge: number;
          nextBillingDate: string;
        };
        canDowngrade: boolean;
        downgradeBlockers: string[];
      }>('/billing/preview-change', {
        method: 'POST',
        body: JSON.stringify({ tier: targetTier, billingCycle }),
      });
    },

    changeTier: async (targetTier: TierName) => {
      return fetchAPI<{ success: boolean; message: string }>('/billing/change-tier', {
        method: 'POST',
        body: JSON.stringify({ targetTier }),
      });
    },

    cancelSubscription: async (cancelImmediately = false) => {
      return fetchAPI<{ success: boolean; message: string }>('/billing/cancel', {
        method: 'POST',
        body: JSON.stringify({ cancelImmediately }),
      });
    },

    reactivateSubscription: async () => {
      return fetchAPI<{ success: boolean; message: string }>('/billing/reactivate', {
        method: 'POST',
      });
    },

    getUsageMetrics: async () => {
      return fetchAPI<UsageMetrics>('/billing/usage');
    },

    compareTiers: async (targetTier: TierName) => {
      return fetchAPI<TierComparison>(`/billing/compare/${targetTier}`);
    },

    addAddOn: async (addOnId: string) => {
      return fetchAPI<{ success: boolean }>('/billing/addons', {
        method: 'POST',
        body: JSON.stringify({ addOnId }),
      });
    },

    removeAddOn: async (addOnId: string) => {
      return fetchAPI<{ success: boolean }>(`/billing/addons/${addOnId}`, {
        method: 'DELETE',
      });
    },

    requestQuote: async (tier: TierName, requirements: Record<string, any>) => {
      return fetchAPI<{ quoteId: string; message: string }>('/billing/quote', {
        method: 'POST',
        body: JSON.stringify({ tier, requirements }),
      });
    },
  },

  // --- Webhooks ---
  webhooks: {
    list: async () => {
      return fetchAPI<{ webhooks: Webhook[] }>('/webhooks');
    },

    create: async (webhook: Partial<Webhook>) => {
      return fetchAPI<{ webhook: Webhook }>('/webhooks', {
        method: 'POST',
        body: JSON.stringify(webhook),
      });
    },

    get: async (id: string) => {
      return fetchAPI<{ webhook: Webhook }>(`/webhooks/${id}`);
    },

    update: async (id: string, updates: Partial<Webhook>) => {
      return fetchAPI<{ webhook: Webhook }>(`/webhooks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },

    delete: async (id: string) => {
      return fetchAPI<{ success: boolean }>(`/webhooks/${id}`, {
        method: 'DELETE',
      });
    },

    test: async (id: string) => {
      return fetchAPI<{ success: boolean; responseCode?: number }>(`/webhooks/${id}/test`, {
        method: 'POST',
      });
    },

    regenerateSecret: async (id: string) => {
      return fetchAPI<{ secret: string }>(`/webhooks/${id}/regenerate-secret`, {
        method: 'POST',
      });
    },

    getEvents: async (webhookId?: string) => {
      const url = webhookId ? `/webhooks/${webhookId}/events` : '/webhooks/events';
      return fetchAPI<{ events: WebhookEvent[] }>(url);
    },
  },

  // --- API Keys ---
  apiKeys: {
    list: async () => {
      return fetchAPI<{ apiKeys: ApiKey[] }>('/webhooks/api-keys');
    },

    create: async (name: string, scopes: string[]) => {
      return fetchAPI<{ apiKey: ApiKey; key: string }>('/webhooks/api-keys', {
        method: 'POST',
        body: JSON.stringify({ name, scopes }),
      });
    },

    revoke: async (id: string) => {
      return fetchAPI<{ success: boolean }>(`/webhooks/api-keys/${id}`, {
        method: 'DELETE',
      });
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

    bulkInvite: async (invites: Array<{ name: string; email: string; role?: string }>) => {
      return fetchAPI<{
        successful: User[];
        failed: Array<{ email: string; name: string; error: string }>;
        summary: { total: number; successful: number; failed: number };
      }>('/team/bulk-invite', {
        method: 'POST',
        body: JSON.stringify({ invites }),
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

  // --- Organization ---
  organization: {
    get: async () => {
      return fetchAPI('/organization');
    },

    update: async (data: { name?: string; plan?: 'Basic' | 'Pro' | 'Enterprise' }) => {
      return fetchAPI('/organization', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
  },

  // --- Two-Factor Authentication ---
  twoFactor: {
    setup: async () => {
      return fetchAPI<{ data?: { secret: string; qrCode: string; qrCodeUrl?: string; backupCodes: string[] }; secret?: string; qrCode?: string; qrCodeUrl?: string; backupCodes?: string[] }>('/2fa/setup', {
        method: 'POST',
      });
    },

    verifyAndEnable: async (token: string) => {
      return fetchAPI('/2fa/verify-enable', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
    },

    disable: async () => {
      return fetchAPI('/2fa/disable', {
        method: 'POST',
      });
    },

    regenerateCodes: async () => {
      return fetchAPI<{ backupCodes: string[] }>('/2fa/regenerate-codes', {
        method: 'POST',
      });
    },

    getStatus: async () => {
      return fetchAPI<{ enabled: boolean; verified: boolean }>('/2fa/status');
    },
  },

  // --- aCOS ---
  acos: {
    // Compliance Goals
    createGoal: async (data: any) => fetchAPI('/acos/goals', { method: 'POST', body: JSON.stringify(data) }),
    getGoals: async (params?: { status?: string; framework?: string }) => {
      const query = params ? new URLSearchParams(params as any).toString() : '';
      return fetchAPI(`/acos/goals${query ? `?${query}` : ''}`);
    },
    getGoal: async (goalId: string) => fetchAPI(`/acos/goals/${goalId}`),
    updateGoal: async (goalId: string, data: any) => fetchAPI(`/acos/goals/${goalId}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteGoal: async (goalId: string) => fetchAPI(`/acos/goals/${goalId}`, { method: 'DELETE' }),
    restoreGoal: async (goalId: string) => fetchAPI(`/acos/goals/${goalId}/restore`, { method: 'POST' }),

    // Control Loops
    getControlLoops: async () => fetchAPI('/acos/control-loops'),
    getControlLoop: async (loopId: string) => fetchAPI(`/acos/control-loops/${loopId}`),
    getControlLoopHistory: async (loopId: string) => fetchAPI(`/acos/control-loops/${loopId}/history`),
    createControlLoop: async (data: any) => fetchAPI('/acos/control-loops', { method: 'POST', body: JSON.stringify(data) }),
    updateControlLoop: async (loopId: string, data: any) => fetchAPI(`/acos/control-loops/${loopId}`, { method: 'PATCH', body: JSON.stringify(data) }),
    pauseControlLoop: async (loopId: string) => fetchAPI(`/acos/control-loops/${loopId}/pause`, { method: 'POST' }),
    resumeControlLoop: async (loopId: string) => fetchAPI(`/acos/control-loops/${loopId}/resume`, { method: 'POST' }),
    deleteControlLoop: async (loopId: string) => fetchAPI(`/acos/control-loops/${loopId}`, { method: 'DELETE' }),
    executeControlLoop: async (loopId: string) => fetchAPI(`/acos/control-loops/${loopId}/execute`, { method: 'POST' }),

    // Compliance Debt Management
    getComplianceDebts: async (filters?: any) => {
      const query = filters ? new URLSearchParams(filters as any).toString() : '';
      return fetchAPI(`/acos/compliance-debts${query ? `?${query}` : ''}`);
    },
    trackComplianceDebt: async (data: any) => fetchAPI('/acos/compliance-debts', { method: 'POST', body: JSON.stringify(data) }),
    calculateDebtFromGapAnalysis: async (frameworkId: string) => fetchAPI('/acos/compliance-debts/calculate-from-gap', { method: 'POST', body: JSON.stringify({ frameworkId }) }),
    resolveComplianceDebt: async (debtId: string) => fetchAPI(`/acos/compliance-debts/${debtId}/resolve`, { method: 'POST' }),
    exportDebtReport: async (format: 'csv' | 'json' = 'json') => fetchAPI(`/acos/compliance-debts/export?format=${format}`),

    // Change Impact Analysis
    getChangeImpacts: async (pending?: boolean) => fetchAPI(`/acos/change-impacts${pending ? '?pending=true' : ''}`),
    forecastChangeImpact: async (data: any) => fetchAPI('/acos/change-impacts/forecast', { method: 'POST', body: JSON.stringify(data) }),
    resolveChangeImpact: async (impactId: string) => fetchAPI(`/acos/change-impacts/${impactId}/resolve`, { method: 'POST' }),

    // Agentic AI
    estimateBlastRadius: async (data: any) => fetchAPI('/acos/agentic/estimate-blast-radius', { method: 'POST', body: JSON.stringify(data) }),
    executeAction: async (data: any) => fetchAPI('/acos/agentic/execute-action', { method: 'POST', body: JSON.stringify(data) }),
    rollbackAction: async (actionId: string) => fetchAPI(`/acos/agentic/rollback/${actionId}`, { method: 'POST' }),
    rollbackMultipleActions: async (actionIds: string[]) => fetchAPI('/acos/agentic/rollback-multiple', { method: 'POST', body: JSON.stringify({ actionIds }) }),

    // Evidence Truth Layer
    analyzeEvidence: async (evidenceId: string, file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return fetchAPI(`/acos/evidence/${evidenceId}/analyze`, {
        method: 'POST',
        body: formData,
        headers: {}, // Let browser set Content-Type with boundary
      });
    },

    // Regulatory Intelligence Fabric
    ingestRegulation: async (data: any) => fetchAPI('/acos/rif/ingest-regulation', { method: 'POST', body: JSON.stringify(data) }),
    autoUpdateControls: async (regulatoryChangeId: string) => fetchAPI(`/acos/rif/${regulatoryChangeId}/auto-update`, { method: 'POST' }),

    // Temporal Graph Networks
    predictFutureRisks: async (months: number = 6) => fetchAPI(`/acos/tgn/predict-risks?months=${months}`),
    predictComplianceTrajectory: async (frameworkId: string, months: number = 6) => fetchAPI(`/acos/tgn/frameworks/${frameworkId}/trajectory?months=${months}`),
    getEarlyWarnings: async (months: number = 3) => fetchAPI(`/acos/tgn/early-warnings?months=${months}`),

    // Compliance Digital Twin
    runSimulation: async (data: any) => fetchAPI('/acos/digital-twin/simulate', { method: 'POST', body: JSON.stringify(data) }),
    runMonteCarlo: async (data: any) => fetchAPI('/acos/digital-twin/monte-carlo', { method: 'POST', body: JSON.stringify(data) }),

    // Red Teaming
    runRedTeamSimulation: async (data: any) => fetchAPI('/acos/red-team/simulate', { method: 'POST', body: JSON.stringify(data) }),
    runAutomatedScan: async () => fetchAPI('/acos/red-team/automated-scan', { method: 'POST' }),

    // Federated Swarm
    contributeToFederation: async (data: any) => fetchAPI('/acos/swarm/contribute', { method: 'POST', body: JSON.stringify(data) }),
    getSwarmInsights: async (frameworks?: string[]) => {
      const params = frameworks ? `?frameworks=${frameworks.join(',')}` : '';
      return fetchAPI(`/acos/swarm/insights${params}`);
    },

    // Multi-modal Intake
    transcribeAudio: async (file: File, options?: any) => {
      const formData = new FormData();
      formData.append('audio', file);
      if (options) {
        Object.keys(options).forEach(key => {
          formData.append(key, options[key]);
        });
      }
      return fetchAPI('/acos/multimodal/transcribe-audio', {
        method: 'POST',
        body: formData,
        headers: {},
      });
    },
    analyzeVideo: async (file: File, options?: any) => {
      const formData = new FormData();
      formData.append('video', file);
      if (options) {
        Object.keys(options).forEach(key => {
          formData.append(key, options[key]);
        });
      }
      return fetchAPI('/acos/multimodal/analyze-video', {
        method: 'POST',
        body: formData,
        headers: {},
      });
    },

    // Physical AI
    registerDevice: async (data: any) => fetchAPI('/acos/physical-ai/register-device', { method: 'POST', body: JSON.stringify(data) }),
    getDevices: async () => fetchAPI('/acos/physical-ai/devices'),
    performEdgeComplianceCheck: async (deviceId: string) => fetchAPI(`/acos/physical-ai/devices/${deviceId}/compliance-check`, { method: 'POST' }),

    // NeuroSymbolic AI
    performHybridReasoning: async (query: string, context?: any) => fetchAPI('/acos/neuro-symbolic/hybrid-reasoning', { method: 'POST', body: JSON.stringify({ query, context }) }),
    inferRulesFromPatterns: async (patterns: any[]) => fetchAPI('/acos/neuro-symbolic/infer-rules', { method: 'POST', body: JSON.stringify({ patterns }) }),
    performCausalReasoning: async (violation: any) => fetchAPI('/acos/neuro-symbolic/causal-reasoning', { method: 'POST', body: JSON.stringify({ violation }) }),
    generateExplainableDecision: async (decision: any) => fetchAPI('/acos/neuro-symbolic/explainable-decision', { method: 'POST', body: JSON.stringify({ decision }) }),
    getReasoningHistory: async (limit?: number) => fetchAPI(`/acos/neuro-symbolic/reasoning-history${limit ? `?limit=${limit}` : ''}`),
    validateInferredRule: async (inferenceId: string, validated: boolean) => fetchAPI(`/acos/neuro-symbolic/inferences/${inferenceId}/validate`, { method: 'POST', body: JSON.stringify({ validated }) }),

    // Homomorphic AI
    generateHomomorphicKeys: async (scheme: 'BFV' | 'CKKS' = 'CKKS', securityLevel: 128 | 192 | 256 = 128) => 
      fetchAPI('/acos/homomorphic/keys/generate', { method: 'POST', body: JSON.stringify({ scheme, securityLevel }) }),
    encryptData: async (data: number[], publicKey: string, scheme: 'BFV' | 'CKKS' = 'CKKS', parameters?: any) => 
      fetchAPI('/acos/homomorphic/encrypt', { method: 'POST', body: JSON.stringify({ data, publicKey, scheme, parameters }) }),
    decryptData: async (encryptedData: any, secretKey: string) => 
      fetchAPI('/acos/homomorphic/decrypt', { method: 'POST', body: JSON.stringify({ encryptedData, secretKey }) }),
    performEncryptedLinearRegression: async (encryptedFeatures: any, weights: number[], publicKey: string, relinKeys: string) => 
      fetchAPI('/acos/homomorphic/linear-regression', { method: 'POST', body: JSON.stringify({ encryptedFeatures, weights, publicKey, relinKeys }) }),
    computeEncryptedStatistics: async (encryptedData: any, galoisKeys: string, relinKeys: string) => 
      fetchAPI('/acos/homomorphic/statistics', { method: 'POST', body: JSON.stringify({ encryptedData, galoisKeys, relinKeys }) }),
    performEncryptedNeuralNetwork: async (encryptedInput: any, modelWeights: any, keys: any) => 
      fetchAPI('/acos/homomorphic/neural-network', { method: 'POST', body: JSON.stringify({ encryptedInput, modelWeights, keys }) }),

    // VR Collaborative Review
    getActiveVRSessions: async () => fetchAPI('/acos/vr/sessions'),
    createVRSession: async (data: any) => fetchAPI('/acos/vr/sessions', { method: 'POST', body: JSON.stringify(data) }),
    getVRSessionDetails: async (sessionId: string) => fetchAPI(`/acos/vr/sessions/${sessionId}`),
    joinVRSession: async (sessionId: string) => fetchAPI(`/acos/vr/sessions/${sessionId}/join`, { method: 'POST' }),

    // JIT Access
    requestJITAccess: async (data: any) => fetchAPI('/acos/jit/request', { method: 'POST', body: JSON.stringify(data) }),
    getJITAccessSessions: async () => fetchAPI('/acos/jit/sessions'),
    revokeJITSession: async (sessionId: string, reason?: string) => fetchAPI(`/acos/jit/sessions/${sessionId}/revoke`, { method: 'POST', body: JSON.stringify({ reason }) }),
    cancelJITAccessRequest: async (requestId: string) => fetchAPI(`/acos/jit/requests/${requestId}/cancel`, { method: 'POST' }),
  },

  // Security Features
  // --- Demo Requests ---
  demo: {
    submitRequest: async (data: {
      firstName: string;
      lastName: string;
      email: string;
      company: string;
      jobTitle?: string;
      phone?: string;
      companySize?: string;
      industry?: string;
      country?: string;
      interestedTier?: string;
      currentChallenge?: string;
      howDidYouHear?: string;
      message?: string;
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
    }) => {
      return fetchAPI<{ success: boolean; demoRequest: any; message: string }>('/demo/request', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    // Admin endpoints
    getRequests: async (params?: { status?: string; tier?: string; page?: number; limit?: number }) => {
      const queryString = params
        ? '?' + new URLSearchParams(params as any).toString()
        : '';
      return fetchAPI<{ demoRequests: any[]; total: number; page: number; totalPages: number }>(`/demo/requests${queryString}`);
    },

    getRequest: async (id: string) => {
      return fetchAPI<{ demoRequest: any }>(`/demo/requests/${id}`);
    },

    updateRequest: async (id: string, updates: { status?: string; notes?: string; assignedTo?: string }) => {
      return fetchAPI<{ success: boolean; demoRequest: any }>(`/demo/requests/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    },

    scheduleDemo: async (id: string, scheduledAt: string, meetingLink?: string, notes?: string) => {
      return fetchAPI<{ success: boolean; demoRequest: any }>(`/demo/requests/${id}/schedule`, {
        method: 'POST',
        body: JSON.stringify({ scheduledAt, meetingLink, notes }),
      });
    },

    markAsConverted: async (id: string, notes?: string) => {
      return fetchAPI<{ success: boolean; demoRequest: any }>(`/demo/requests/${id}/convert`, {
        method: 'POST',
        body: JSON.stringify({ notes }),
      });
    },

    getStats: async () => {
      return fetchAPI<{
        total: number;
        byStatus: Record<string, number>;
        byTier: Record<string, number>;
        conversionRate: number;
        averageTimeToSchedule: number;
        recentRequests: any[];
      }>('/demo/stats');
    },
  },

  security: {
    // Zero Trust Security
    verifyDeviceTrust: async (data: { deviceId?: string; deviceType?: string; macAddress?: string; ipAddress?: string }) => 
      fetchAPI('/security/zero-trust/verify-device', { method: 'POST', body: JSON.stringify(data) }),
    evaluateAccessRequest: async (resourceId: string, deviceId: string, action: string, context?: any) => 
      fetchAPI('/security/zero-trust/evaluate-access', { method: 'POST', body: JSON.stringify({ resourceId, deviceId, action, context }) }),
    createZeroTrustPolicy: async (policy: any) => 
      fetchAPI('/security/zero-trust/policies', { method: 'POST', body: JSON.stringify(policy) }),
    getZeroTrustPolicies: async () => fetchAPI('/security/zero-trust/policies'),
    getZeroTrustPolicy: async (policyId: string) => fetchAPI(`/security/zero-trust/policies/${policyId}`),
    updateZeroTrustPolicy: async (policyId: string, updates: any) => 
      fetchAPI(`/security/zero-trust/policies/${policyId}`, { method: 'PATCH', body: JSON.stringify(updates) }),
    deleteZeroTrustPolicy: async (policyId: string) => 
      fetchAPI(`/security/zero-trust/policies/${policyId}`, { method: 'DELETE' }),
    getDeviceTrusts: async () => fetchAPI('/security/zero-trust/devices'),
    getDeviceTrust: async (deviceId: string) => fetchAPI(`/security/zero-trust/devices/${deviceId}`),
    createNetworkSegment: async (segment: any) => 
      fetchAPI('/security/zero-trust/network-segments', { method: 'POST', body: JSON.stringify(segment) }),
    getNetworkSegments: async () => fetchAPI('/security/zero-trust/network-segments'),
    continuousVerification: async (deviceId: string) => 
      fetchAPI('/security/zero-trust/continuous-verify', { method: 'POST', body: JSON.stringify({ deviceId }) }),

    // Zero-Knowledge Proofs
    generateComplianceProof: async (frameworkId: string, privateData: any) => 
      fetchAPI('/security/zkp/compliance-proof/generate', { method: 'POST', body: JSON.stringify({ frameworkId, privateData }) }),
    verifyComplianceProof: async (proof: any) => 
      fetchAPI('/security/zkp/compliance-proof/verify', { method: 'POST', body: JSON.stringify({ proof }) }),
    generateCredentialProof: async (credential: any, secret: string) => 
      fetchAPI('/security/zkp/credential-proof/generate', { method: 'POST', body: JSON.stringify({ credential, secret }) }),
    verifyCredentialProof: async (proof: any, requiredLevel?: number) => 
      fetchAPI('/security/zkp/credential-proof/verify', { method: 'POST', body: JSON.stringify({ proof, requiredLevel }) }),
    generateOwnershipProof: async (dataHash: string, secret: string, assetId?: string, assetType?: string) => 
      fetchAPI('/security/zkp/ownership-proof/generate', { method: 'POST', body: JSON.stringify({ dataHash, secret, assetId, assetType }) }),
    verifyOwnershipProof: async (proof: any, dataHash: string) => 
      fetchAPI('/security/zkp/ownership-proof/verify', { method: 'POST', body: JSON.stringify({ proof, dataHash }) }),
    getZKProofs: async () => fetchAPI('/security/zkp/proofs'),
    getZKProof: async (proofId: string) => fetchAPI(`/security/zkp/proofs/${proofId}`),

    // BYOK Encryption
    generateBYOKKey: async (provider: 'aws_kms' | 'azure_kv', options: any) => 
      fetchAPI('/security/byok/keys/generate', { method: 'POST', body: JSON.stringify({ provider, ...options }) }),
    importBYOKKey: async (provider: 'aws_kms' | 'azure_kv', keyId: string, options: any) => 
      fetchAPI('/security/byok/keys/import', { method: 'POST', body: JSON.stringify({ provider, keyId, ...options }) }),
    getBYOKKeys: async () => fetchAPI('/security/byok/keys'),
    getBYOKKey: async (keyId: string) => fetchAPI(`/security/byok/keys/${keyId}`),
    rotateBYOKKey: async (keyId: string, oldConfig: any, newConfig: any, encryptedData?: any[]) => 
      fetchAPI(`/security/byok/keys/${keyId}/rotate`, { method: 'POST', body: JSON.stringify({ oldConfig, newConfig, encryptedData }) }),
    deleteBYOKKey: async (keyId: string, config: any) => 
      fetchAPI(`/security/byok/keys/${keyId}`, { method: 'DELETE', body: JSON.stringify(config) }),
    encryptWithBYOK: async (data: string, config: any) => 
      fetchAPI('/security/byok/encrypt', { method: 'POST', body: JSON.stringify({ data, config }) }),
    decryptWithBYOK: async (encryptedPayload: any, config: any) => 
      fetchAPI('/security/byok/decrypt', { method: 'POST', body: JSON.stringify({ encryptedPayload, config }) }),
    getBYOKConfig: async () => fetchAPI('/security/byok/config'),
    updateBYOKConfig: async (config: any) => 
      fetchAPI('/security/byok/config', { method: 'POST', body: JSON.stringify(config) }),

    // Compliance-as-Code
    createCompliancePolicy: async (policy: any) => 
      fetchAPI('/security/compliance-as-code/policies', { method: 'POST', body: JSON.stringify(policy) }),
    getCompliancePolicies: async (framework?: string) => 
      fetchAPI(`/security/compliance-as-code/policies${framework ? `?framework=${framework}` : ''}`),
    getCompliancePolicy: async (policyId: string) => 
      fetchAPI(`/security/compliance-as-code/policies/${policyId}`),
    updateCompliancePolicy: async (policyId: string, updates: any) => 
      fetchAPI(`/security/compliance-as-code/policies/${policyId}`, { method: 'PATCH', body: JSON.stringify(updates) }),
    deleteCompliancePolicy: async (policyId: string) => 
      fetchAPI(`/security/compliance-as-code/policies/${policyId}`, { method: 'DELETE' }),
    evaluateCompliancePolicy: async (policyId: string, input: any) => 
      fetchAPI(`/security/compliance-as-code/policies/${policyId}/evaluate`, { method: 'POST', body: JSON.stringify({ input }) }),
    evaluateCompliancePoliciesBatch: async (policyIds: string[], input: any) => 
      fetchAPI('/security/compliance-as-code/policies/evaluate-batch', { method: 'POST', body: JSON.stringify({ policyIds, input }) }),
    generateComplianceReport: async (framework: string) => 
      fetchAPI('/security/compliance-as-code/reports/generate', { method: 'POST', body: JSON.stringify({ framework }) }),
    getComplianceReports: async () => fetchAPI('/security/compliance-as-code/reports'),
    getComplianceReport: async (reportId: string) => 
      fetchAPI(`/security/compliance-as-code/reports/${reportId}`),
    handleCICDWebhook: async (provider: string, event: string, payload: any) => 
      fetchAPI('/security/compliance-as-code/ci-cd/webhook', { method: 'POST', body: JSON.stringify({ provider, event, payload }) }),
    getCICDIntegrations: async () => fetchAPI('/security/compliance-as-code/ci-cd/integrations'),
    createCICDIntegration: async (integration: any) => 
      fetchAPI('/security/compliance-as-code/ci-cd/integrations', { method: 'POST', body: JSON.stringify(integration) }),
    deleteCICDIntegration: async (integrationId: string) => 
      fetchAPI(`/security/compliance-as-code/ci-cd/integrations/${integrationId}`, { method: 'DELETE' }),
    detectDrift: async (policyId: string) => 
      fetchAPI('/security/compliance-as-code/drift/detect', { method: 'POST', body: JSON.stringify({ policyId }) }),
  },
};

// Export helper functions
export { getAuthToken, setAuthToken, clearAuthToken };
