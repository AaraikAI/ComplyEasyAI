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

  // --- aCOS v3.0 ---
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
  },
};

// Export helper functions
export { getAuthToken, setAuthToken, clearAuthToken };
