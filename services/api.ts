import { User, RiskItem, ComplianceFramework, AuditLog, Integration, TierName, SubscriptionDetails, UsageMetrics, Tier, TierComparison, UpgradePreview, Webhook, WebhookEvent, ApiKey, BillingCycle, OnboardingProgress, OnboardingChecklist } from '../types';
import { logger } from '../utils/logger';

// Backend API Configuration — ensure base always ends with /api so /auth/register etc. resolve correctly
const rawBase = (import.meta as ImportMeta & { env: Record<string, string> }).env.VITE_API_URL || 'http://localhost:3001/api';
const API_BASE_URL = rawBase.endsWith('/api') ? rawBase : rawBase.replace(/\/?$/, '') + '/api';

// Auth tokens are now stored in httpOnly cookies set by the backend.
// The frontend no longer reads or writes tokens directly — cookies are
// sent automatically with every request via credentials: 'include'.
// We keep a lightweight flag to track authenticated state in the UI.
let isAuthenticatedFlag = false;

const getAuthToken = (): string | null => {
  // Tokens are in httpOnly cookies; return flag for UI auth checks only
  return isAuthenticatedFlag ? '__cookie__' : null;
};

const setAuthToken = (_token: string): void => {
  // Token is set via httpOnly cookie by the backend; just flag the UI
  isAuthenticatedFlag = true;
};

const clearAuthToken = (): void => {
  isAuthenticatedFlag = false;
  localStorage.removeItem('user_data');
};

// CSRF token for state-changing requests (double-submit cookie)
let csrfTokenCache: string | null = null;

/** Clears CSRF cache (for tests only). */
export function __clearCsrfCacheForTest(): void {
  csrfTokenCache = null;
}

export async function getCsrfToken(): Promise<string | null> {
  if (csrfTokenCache) return csrfTokenCache;
  try {
    const res = await fetch(`${API_BASE_URL}/csrf-token`, { credentials: 'include' });
    if (!res.ok) return null;
    const data = await res.json();
    csrfTokenCache = data.csrfToken ?? null;
    return csrfTokenCache;
  } catch {
    return null;
  }
}

/**
 * Same-origin `fetch` wrapper for components that issue RAW requests to absolute
 * `/api/*` paths instead of going through `fetchAPI`. It attaches the
 * double-submit CSRF token on mutating methods (and always sends credentials),
 * mirroring `fetchAPI`'s handling so these mutations are not rejected with a 403
 * "CSRF token missing" in production (where the API is same-origin and CSRF is
 * enforced). GET/HEAD/OPTIONS pass through unchanged. Returns the raw Response so
 * callers keep their existing status/body handling.
 */
export async function csrfFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const method = (init.method || 'GET').toUpperCase();
  const headers = new Headers(init.headers || {});
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrf = await getCsrfToken();
    if (csrf && !headers.has('X-CSRF-Token')) headers.set('X-CSRF-Token', csrf);
  }
  return fetch(input, { credentials: 'include', ...init, headers });
}

// HTTP Client with authentication and timeout
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {},
  timeoutMs: number = 30000 // Default 30 second timeout
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Auth tokens are now in httpOnly cookies sent automatically via credentials: 'include'.
  // No Authorization header needed — the backend reads the cookie.

  const method = (options.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrf = await getCsrfToken();
    if (csrf) headers['X-CSRF-Token'] = csrf;
  }

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 403) {
        csrfTokenCache = null;
      }
      if (response.status === 401) {
        // Try to refresh token via httpOnly cookie (sent automatically)
        if (isAuthenticatedFlag) {
          try {
            const refreshController = new AbortController();
            const refreshTimeoutId = setTimeout(() => refreshController.abort(), 10000);

            const refreshCsrf = await getCsrfToken();
            const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...(refreshCsrf ? { 'X-CSRF-Token': refreshCsrf } : {}) },
              body: JSON.stringify({}),
              credentials: 'include',
              signal: refreshController.signal,
            });

            clearTimeout(refreshTimeoutId);

            if (refreshResponse.ok) {
              // Tokens refreshed via httpOnly cookies automatically
              setAuthToken('__cookie__');

              // Retry the original request — new cookie sent automatically
              const retryHeaders: HeadersInit = {
                'Content-Type': 'application/json',
                ...options.headers,
              };

              const retryController = new AbortController();
              const retryTimeoutId = setTimeout(() => retryController.abort(), timeoutMs);

              const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers: retryHeaders,
                credentials: 'include',
                signal: retryController.signal,
              });

              clearTimeout(retryTimeoutId);

              if (retryResponse.ok) {
                return retryResponse.json();
              }
            }
          } catch (refreshError) {
            logger.error('Token refresh failed:', refreshError);
          }
        }

        // If refresh failed or not authenticated, clear auth state and redirect
        clearAuthToken();
        window.location.href = '/';
        throw new Error('Session expired. Please log in again.');
      }

      const error = await response.json().catch(() => ({}));
      // Backend may return { error: "string" } or { status: 'error', error: { code, message } }
      const errorBody = error.error;
      const errorMessage = typeof errorBody === 'string'
        ? errorBody
        : errorBody?.message || error.message || `HTTP ${response.status}: ${response.statusText}`;
      
      // For 501 (Not Implemented), include the full error object
      if (response.status === 501) {
        throw { message: errorMessage, status: 501, ...error };
      }
      
      // Log detailed error for debugging
      if ((import.meta as ImportMeta & { env: { DEV: boolean } }).env.DEV) {
        logger.error('API Error:', {
          endpoint,
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
          url: `${API_BASE_URL}${endpoint}`,
        });
      }
      
      throw new Error(errorMessage);
    }

    const json = await response.json();

    // Auto-unwrap the backend's standard envelope { status: 'success', data, meta }
    if (json && json.status === 'success' && json.data !== undefined) {
      return json.data;
    }

    return json;
  } catch (error: any) {
    clearTimeout(timeoutId);

    // Handle timeout/abort errors
    if (error.name === 'AbortError') {
      logger.error('Request timeout:', {
        endpoint,
        timeoutMs,
        url: `${API_BASE_URL}${endpoint}`,
      });
      throw new Error(`Request timeout after ${timeoutMs}ms. The server may be experiencing high load.`, { cause: error });
    }

    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      logger.error('Network error - Backend may be down:', {
        endpoint,
        url: `${API_BASE_URL}${endpoint}`,
        apiBaseUrl: API_BASE_URL,
      });
      throw new Error(`Cannot connect to backend server. Please ensure the backend is running on ${API_BASE_URL.replace('/api', '')}`, { cause: error });
    }
    throw error;
  }
}

export const api = {
  // --- Auth & User ---
  // NOTE: user.uploadAvatar, user.updateProfile, user.changePassword were
  // removed — they duplicated auth.uploadAvatar, auth.updateProfile, and
  // auth.changePassword (same underlying endpoints). Use api.auth.* instead.

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

      if (response.twoFactorRequired) {
        return response;
      }

      if (response.user) {
        // Tokens are set via httpOnly cookies by the backend; flag UI as authenticated
        setAuthToken('__cookie__');

        const user = {
          id: response.user.id,
          name: response.user.name,
          email: response.user.email,
          role: response.user.role,
          avatar: response.user.avatar || (response.user.name ? response.user.name.substring(0, 2).toUpperCase() : '??'),
          organizationId: response.user.organization?.id || response.user.organizationId,
          organization: response.user.organization ? { id: response.user.organization.id, name: response.user.organization.name, plan: response.user.organization.plan } : undefined,
        };

        localStorage.setItem('user_data', JSON.stringify(user));
        return user;
      }

      throw new Error('No access token received');
    },

    register: async (
      name: string, 
      email: string, 
      organizationName?: string, 
      password?: string,
      industry?: string,
      companySize?: string,
      primaryComplianceGoal?: string,
      howDidYouHear?: string
    ) => {
      return fetchAPI('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ 
          name, 
          email, 
          organizationName, 
          password,
          industry,
          companySize,
          primaryComplianceGoal,
          howDidYouHear
        }),
      });
    },

    login: async (email: string, password: string) => {
      const response: any = await fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (response.accessToken) {
        // Tokens are set via httpOnly cookies by the backend; just flag UI
        setAuthToken(response.accessToken);

        const user = {
          id: response.user.id,
          name: response.user.name,
          email: response.user.email,
          role: response.user.role,
          avatar: response.user.avatar || (response.user.name ? response.user.name.substring(0, 2).toUpperCase() : '??'),
          organizationId: response.user.organization?.id || response.user.organizationId,
          organization: response.user.organization ? { id: response.user.organization.id, name: response.user.organization.name, plan: response.user.organization.plan } : undefined,
        };

        localStorage.setItem('user_data', JSON.stringify(user));
        return user;
      }

      throw new Error('No access token received');
    },

    refreshToken: async () => {
      // Refresh token is sent via httpOnly cookie automatically
      const response: any = await fetchAPI('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      if (response.accessToken) {
        setAuthToken(response.accessToken);
      }

      return response;
    },

    logout: async () => {
      // Call backend to clear httpOnly cookies and blacklist tokens
      try {
        await fetchAPI('/auth/logout', { method: 'POST', body: JSON.stringify({}) });
      } catch (_) {
        // Best-effort server-side logout
      }
      clearAuthToken();
    },

    uploadAvatar: async (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);

      // Auth token sent via httpOnly cookie automatically
      const response = await fetch(`${API_BASE_URL}/auth/profile/avatar`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(error.message || 'Failed to upload avatar');
      }

      const result = await response.json();
      
      // Update local user data with new avatar
      if (result.user) {
        const existingUser = localStorage.getItem('user_data');
        if (existingUser) {
          const userData = JSON.parse(existingUser);
          userData.avatar = result.user.avatar;
          localStorage.setItem('user_data', JSON.stringify(userData));
        }
      }
      
      return result;
    },

    updateProfile: async (updates: { name?: string; email?: string }) => {
      return fetchAPI<{ user: any }>('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    },

    changePassword: async (currentPassword: string, newPassword: string) => {
      return fetchAPI<{ success: boolean; message: string }>('/auth/password', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
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
      const response = await fetch(`${API_BASE_URL}/frameworks/${frameworkId}/controls/${controlId}/evidence`, {
        method: 'POST',
        credentials: 'include',
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
      const response = await fetch(`${API_BASE_URL}/frameworks/${frameworkId}/smart-upload`, {
        method: 'POST',
        credentials: 'include',
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
    listControlMappings: async () => {
      const res = await fetchAPI<any>('/control-mappings');
      return Array.isArray(res) ? res : res?.mappings ?? [];
    },
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
      const response = await fetch(`${API_BASE_URL}/control-mappings/export/csv`, {
        credentials: 'include',
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

    // Framework Templates
    getTemplates: async () => {
      return fetchAPI<{ templates: Array<{ frameworkType: string; displayName: string; description: string; controlCount: number; categories: string[] }> }>('/frameworks/templates');
    },
    getTemplateControls: async (frameworkType: string) => {
      return fetchAPI<{ frameworkType: string; controlCount: number; categories: any[]; controls: any[] }>(`/frameworks/templates/${encodeURIComponent(frameworkType)}`);
    },
    applyTemplate: async (frameworkId: string, frameworkType: string) => {
      return fetchAPI<{ message: string; applied: number; skipped: number; total: number }>(`/frameworks/${frameworkId}/apply-template`, {
        method: 'POST',
        body: JSON.stringify({ frameworkType }),
      });
    },
    regenerateMappings: async (frameworkId: string) => {
      return fetchAPI<{ message: string; created: number; deleted: number }>(`/frameworks/${frameworkId}/regenerate-mappings`, {
        method: 'POST',
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

    // Tier AI Features
    crossFrameworkMapping: async (sourceFramework: string, targetFramework: string, sourceControls: any[], targetControls: any[]) => {
      return fetchAPI<any>('/ai/cross-framework-mapping', {
        method: 'POST',
        body: JSON.stringify({ sourceFramework, targetFramework, sourceControls, targetControls }),
      }, 120000);
    },

    autoRemediation: async (framework: string, gaps: any[], organizationContext: string) => {
      return fetchAPI<any>('/ai/auto-remediation', {
        method: 'POST',
        body: JSON.stringify({ framework, gaps, organizationContext }),
      }, 120000);
    },

    evidenceCompleteness: async (framework: string, controls: any[]) => {
      return fetchAPI<any>('/ai/evidence-completeness', {
        method: 'POST',
        body: JSON.stringify({ framework, controls }),
      }, 120000);
    },

    agenticVendorRisk: async (vendor: any, assessmentScope: string[]) => {
      return fetchAPI<any>('/ai/agentic-vendor-risk', {
        method: 'POST',
        body: JSON.stringify({ vendor, assessmentScope }),
      }, 120000);
    },

    auditSimulation: async (framework: string, controlDomain: string, controlsToAudit: any[], previousAnswers?: any[]) => {
      return fetchAPI<any>('/ai/audit-simulation', {
        method: 'POST',
        body: JSON.stringify({ framework, controlDomain, controlsToAudit, previousAnswers }),
      }, 120000);
    },

    // Persisted audit-readiness simulation runs (SimulationScenario store).
    listAuditSimulations: async () => {
      return fetchAPI<{ simulations: any[] }>('/ai/audit-simulations', { method: 'GET' });
    },
    saveAuditSimulation: async (payload: { name?: string; description?: string; run: any; findings: any[] }) => {
      return fetchAPI<any>('/ai/audit-simulations', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    updateAuditSimulation: async (id: string, payload: { name?: string; description?: string; run?: any; findings?: any[] }) => {
      return fetchAPI<any>(`/ai/audit-simulations/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },

    naturalLanguageQuery: async (query: string, context: any) => {
      return fetchAPI<any>('/ai/nl-query', {
        method: 'POST',
        body: JSON.stringify({ query, context }),
      }, 60000);
    },

    complianceCopilot: async (message: string, conversationHistory: any[], context: any) => {
      return fetchAPI<any>('/ai/copilot', {
        method: 'POST',
        body: JSON.stringify({ message, conversationHistory, context }),
      }, 60000);
    },

    forecastComplianceScore: async (currentScores: any[], upcomingChanges: string[], historicalData: any[]) => {
      return fetchAPI<any>('/ai/forecast', {
        method: 'POST',
        body: JSON.stringify({ currentScores, upcomingChanges, historicalData }),
      }, 120000);
    },

    analyzeProcess: async (processDescription: string, category: string, complianceFrameworks: string[]) => {
      return fetchAPI<any>('/ai/analyze-process', {
        method: 'POST',
        body: JSON.stringify({ processDescription, category, complianceFrameworks }),
      }, 120000);
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
    createCheckout: async (tier: TierName, billingCycle: BillingCycle = 'annual', bundles?: string[]) => {
      const body: any = { tier, billingCycle };
      if (bundles && bundles.length > 0) body.bundles = bundles;
      return fetchAPI<{ url: string }>('/billing/checkout', {
        method: 'POST',
        body: JSON.stringify(body),
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
        body: JSON.stringify({ atPeriodEnd: !cancelImmediately }),
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

    getFeatureSubscriptions: async () => {
      return fetchAPI<{
        subscriptions: Array<{
          id: string;
          featureId: string;
          featureName: string;
          status: string;
          billingCycle: 'monthly' | 'annual';
          price: number;
          startDate: string;
          endDate?: string;
        }>;
        totalAnnualCost: number;
        totalMonthlyCost: number;
      }>('/billing/features/subscriptions');
    },

    cancelFeatureSubscription: async (featureId: string) => {
      return fetchAPI<{ success: boolean; message: string }>(`/billing/features/${featureId}/unsubscribe`, {
        method: 'DELETE',
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
        method: 'PATCH',
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
      const url = webhookId ? `/webhooks/${webhookId}/events` : '/webhooks/events/history';
      return fetchAPI<{ events: WebhookEvent[] }>(url);
    },
  },

  // --- API Keys ---
  apiKeys: {
    list: async () => {
      return fetchAPI<{ apiKeys: ApiKey[] }>('/webhooks/keys/list');
    },

    create: async (name: string, scopes: string[]) => {
      return fetchAPI<{ apiKey: ApiKey; key: string }>('/webhooks/keys', {
        method: 'POST',
        body: JSON.stringify({ name, scopes }),
      });
    },

    revoke: async (id: string) => {
      return fetchAPI<{ success: boolean }>(`/webhooks/keys/${id}`, {
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
        body: JSON.stringify({ invitations: invites }),
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

  // --- Vendors (for tier gating: use list().length with maxVendors) ---
  vendors: {
    list: async (params?: Record<string, string>) => {
      const query = params ? new URLSearchParams(params).toString() : '';
      const res = await fetchAPI<any>(`/vendors${query ? `?${query}` : ''}`);
      return Array.isArray(res) ? res : res?.vendors ?? res?.data ?? [];
    },
    getById: async (id: string) => {
      return fetchAPI<any>(`/vendors/${encodeURIComponent(id)}`);
    },
    create: async (data: Record<string, any>) => {
      return fetchAPI<any>('/vendors', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update: async (id: string, data: Record<string, any>) => {
      return fetchAPI<any>(`/vendors/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    delete: async (id: string) => {
      return fetchAPI<any>(`/vendors/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    },
    createAssessment: async (vendorId: string, data: Record<string, any>) => {
      return fetchAPI<any>(`/vendors/${encodeURIComponent(vendorId)}/assessments`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    getScorecard: async (vendorId: string) => {
      return fetchAPI<any>(`/vendors/${encodeURIComponent(vendorId)}/scorecard`);
    },
    getDashboard: async () => {
      return fetchAPI<any>('/vendors/dashboard');
    },
    getAssessmentQueue: async () => {
      const res = await fetchAPI<any>('/vendors/assessments/queue');
      return Array.isArray(res) ? res : res?.queue ?? [];
    },
  },

  // --- Enterprise (for tier gating: use list counts with getLimit/isAtLimit) ---
  enterprise: {
    questionnaires: {
      list: async (params?: Record<string, string>) => {
        const query = params ? new URLSearchParams(params).toString() : '';
        const res = await fetchAPI<any>(`/enterprise/questionnaires${query ? `?${query}` : ''}`);
        return res?.questionnaires ?? res?.data ?? (Array.isArray(res) ? res : []);
      },
      getById: async (id: string) => {
        return fetchAPI<any>(`/enterprise/questionnaires/${encodeURIComponent(id)}`);
      },
      getMetrics: async () => {
        return fetchAPI<any>('/enterprise/questionnaires/metrics');
      },
      getTemplates: async () => {
        return fetchAPI<any>('/enterprise/questionnaires/templates');
      },
      create: async (data: Record<string, any>) => {
        return fetchAPI<any>('/enterprise/questionnaires', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      },
      createFromTemplate: async (data: { templateId: string; title?: string; requestedBy?: string; dueDate?: string }) => {
        return fetchAPI<any>('/enterprise/questionnaires/from-template', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      },
      update: async (id: string, data: Record<string, any>) => {
        return fetchAPI<any>(`/enterprise/questionnaires/${encodeURIComponent(id)}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      },
      delete: async (id: string) => {
        return fetchAPI<any>(`/enterprise/questionnaires/${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
      },
      addQuestions: async (id: string, questions: any[]) => {
        return fetchAPI<any>(`/enterprise/questionnaires/${encodeURIComponent(id)}/questions`, {
          method: 'POST',
          body: JSON.stringify({ questions }),
        });
      },
      submitResponse: async (id: string, data: { questionId: string; responseText: string; responseData?: any; attachments?: any }) => {
        return fetchAPI<any>(`/enterprise/questionnaires/${encodeURIComponent(id)}/responses`, {
          method: 'POST',
          body: JSON.stringify(data),
        });
      },
      aiGenerate: async (id: string) => {
        return fetchAPI<any>(`/enterprise/questionnaires/${encodeURIComponent(id)}/ai-generate`, {
          method: 'POST',
        });
      },
      complete: async (id: string) => {
        return fetchAPI<any>(`/enterprise/questionnaires/${encodeURIComponent(id)}/complete`, {
          method: 'POST',
        });
      },
    },
    policies: {
      list: async (params?: Record<string, string>) => {
        const query = params ? new URLSearchParams(params).toString() : '';
        const res = await fetchAPI<any>(`/enterprise/policies${query ? `?${query}` : ''}`);
        return res?.policies ?? res?.data ?? (Array.isArray(res) ? res : []);
      },
      getById: async (id: string) => {
        return fetchAPI<any>(`/enterprise/policies/${encodeURIComponent(id)}`);
      },
      create: async (data: Record<string, any>) => {
        return fetchAPI<any>('/enterprise/policies', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      },
      update: async (id: string, data: Record<string, any>) => {
        return fetchAPI<any>(`/enterprise/policies/${encodeURIComponent(id)}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      },
      delete: async (id: string) => {
        return fetchAPI<any>(`/enterprise/policies/${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
      },
      approve: async (id: string) => {
        return fetchAPI<any>(`/enterprise/policies/${encodeURIComponent(id)}/approve`, {
          method: 'POST',
        });
      },
      submitForReview: async (id: string) => {
        return fetchAPI<any>(`/enterprise/policies/${encodeURIComponent(id)}/submit-review`, {
          method: 'POST',
        });
      },
      duplicate: async (id: string) => {
        return fetchAPI<any>(`/enterprise/policies/${encodeURIComponent(id)}/duplicate`, {
          method: 'POST',
        });
      },
      getTemplates: async (category?: string) => {
        const query = category ? `?category=${encodeURIComponent(category)}` : '';
        return fetchAPI<any>(`/enterprise/policies/templates${query}`);
      },
      getMetrics: async () => {
        return fetchAPI<any>('/enterprise/policies/metrics');
      },
      generatePolicy: async (data: { description: string; category: string; frameworkAlignment?: string[]; industry?: string }) => {
        return fetchAPI<any>('/enterprise/visionary-ai/generate-policy', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      },
    },
    workspaces: {
      getHierarchy: async () => fetchAPI<any>('/enterprise/workspace/hierarchy'),
      getConsolidatedMetrics: async () => fetchAPI<any>('/enterprise/workspace/consolidated-metrics'),
      createChild: async (data: { name: string; plan?: string }) => {
        return fetchAPI<any>('/enterprise/workspace/child-organizations', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      },
      moveUser: async (userId: string, targetOrganizationId: string) => {
        return fetchAPI<any>('/enterprise/workspace/move-user', {
          method: 'POST',
          body: JSON.stringify({ userId, targetOrganizationId }),
        });
      },
      cloneFramework: async (frameworkId: string, targetOrganizationIds: string[]) => {
        return fetchAPI<any>('/enterprise/workspace/clone-framework', {
          method: 'POST',
          body: JSON.stringify({ frameworkId, targetOrganizationIds }),
        });
      },
    },
    visionaryAI: {
      getCoPilotRecommendations: async () => fetchAPI<any>('/enterprise/visionary-ai/copilot/recommendations'),
      predictRisks: async (timeHorizonDays = 90) => {
        return fetchAPI<any>('/enterprise/visionary-ai/predict-risks', {
          method: 'POST',
          body: JSON.stringify({ timeHorizonDays }),
        });
      },
      getBenchmarking: async (industry = 'Technology') => {
        return fetchAPI<any>(`/enterprise/visionary-ai/benchmarking?industry=${encodeURIComponent(industry)}`);
      },
    },
    monitoring: {
      list: async (params?: Record<string, string>) => {
        const query = params ? new URLSearchParams(params).toString() : '';
        const res = await fetchAPI<any>(`/enterprise/monitoring${query ? `?${query}` : ''}`);
        return Array.isArray(res) ? res : res?.monitors ?? res?.data ?? [];
      },
      getById: async (id: string) => {
        return fetchAPI<any>(`/enterprise/monitoring/${encodeURIComponent(id)}`);
      },
      getDashboard: async () => {
        return fetchAPI<any>('/enterprise/monitoring/dashboard');
      },
      create: async (data: Record<string, any>) => {
        return fetchAPI<any>('/enterprise/monitoring', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      },
      update: async (id: string, data: Record<string, any>) => {
        return fetchAPI<any>(`/enterprise/monitoring/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        });
      },
      delete: async (id: string) => {
        return fetchAPI<any>(`/enterprise/monitoring/${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
      },
      execute: async (id: string) => {
        return fetchAPI<any>(`/enterprise/monitoring/${encodeURIComponent(id)}/execute`, {
          method: 'POST',
        });
      },
      getResults: async (id: string, limit = 30) => {
        return fetchAPI<any>(`/enterprise/monitoring/${encodeURIComponent(id)}/results?limit=${limit}`);
      },
      toggle: async (id: string, active: boolean) => {
        return fetchAPI<any>(`/enterprise/monitoring/${encodeURIComponent(id)}/toggle`, {
          method: 'PATCH',
          body: JSON.stringify({ active }),
        });
      },
      aiSuggest: async () => {
        return fetchAPI<any>('/enterprise/monitoring/ai-suggest', {
          method: 'POST',
        });
      },
      aiAnalyze: async (id: string) => {
        return fetchAPI<any>(`/enterprise/monitoring/${encodeURIComponent(id)}/ai-analyze`, {
          method: 'POST',
        });
      },
      aiTriage: async () => {
        return fetchAPI<any>('/enterprise/monitoring/ai-triage', {
          method: 'POST',
        });
      },
    },
    issues: {
      list: async (params?: Record<string, string>) => {
        const query = params ? new URLSearchParams(params).toString() : '';
        const res = await fetchAPI<any>(`/enterprise/issues${query ? `?${query}` : ''}`);
        return res?.issues ?? res?.data ?? (Array.isArray(res) ? res : []);
      },
      getById: async (id: string) => {
        return fetchAPI<any>(`/enterprise/issues/${encodeURIComponent(id)}`);
      },
      getDashboard: async () => {
        return fetchAPI<any>('/enterprise/issues/dashboard');
      },
      create: async (data: Record<string, any>) => {
        return fetchAPI<any>('/enterprise/issues', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      },
      update: async (id: string, data: Record<string, any>) => {
        return fetchAPI<any>(`/enterprise/issues/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        });
      },
      updateStatus: async (id: string, status: string) => {
        return fetchAPI<any>(`/enterprise/issues/${encodeURIComponent(id)}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        });
      },
      delete: async (id: string) => {
        return fetchAPI<any>(`/enterprise/issues/${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
      },
      assign: async (id: string, assignedToId: string) => {
        return fetchAPI<any>(`/enterprise/issues/${encodeURIComponent(id)}/assign`, {
          method: 'POST',
          body: JSON.stringify({ assignedToId }),
        });
      },
      addComment: async (id: string, content: string) => {
        return fetchAPI<any>(`/enterprise/issues/${encodeURIComponent(id)}/comments`, {
          method: 'POST',
          body: JSON.stringify({ comment: content }),
        });
      },
      getComments: async (id: string) => {
        return fetchAPI<any>(`/enterprise/issues/${encodeURIComponent(id)}/comments`);
      },
    },
    autopilot: {
      run: async (options?: Record<string, any>) => {
        return fetchAPI<any>('/enterprise/visionary-ai/autopilot/run', {
          method: 'POST',
          body: JSON.stringify({ options: options || {} }),
        });
      },
    },
    reports: {
      // AUDIT: list was previously a hardcoded stub returning []. Now wired
      // to GET /enterprise/reports which queries customReport table.
      list: async () => fetchAPI<any>('/enterprise/reports'),
      getExecutiveSummary: async () => {
        return fetchAPI<any>('/enterprise/reports/executive-summary');
      },
      getRiskReport: async () => {
        return fetchAPI<any>('/enterprise/reports/risk');
      },
      getVendorRiskReport: async () => {
        return fetchAPI<any>('/enterprise/reports/vendor-risk');
      },
      getComplianceReport: async (frameworkId?: string) => {
        const query = frameworkId ? `?frameworkId=${encodeURIComponent(frameworkId)}` : '';
        return fetchAPI<any>(`/enterprise/reports/compliance${query}`);
      },
      create: async (data: Record<string, any>) => {
        return fetchAPI<any>('/enterprise/reports', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      },
    },
    riskAssessments: {
      // Risk assessments: create is gated; list via risk-management dashboard/register if needed
      create: async (data: any) =>
        fetchAPI<any>('/enterprise/risk-management/assessments', { method: 'POST', body: JSON.stringify(data) }),
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
    analyzeAndAnchor: async (
      evidenceId: string,
      file: File,
      opts?: { network?: 'ethereum' | 'polygon' | 'hyperledger'; skipBlockchain?: boolean; controlId?: string; frameworkId?: string }
    ) => {
      const formData = new FormData();
      formData.append('file', file);
      if (opts?.network) formData.append('network', opts.network);
      if (opts?.skipBlockchain !== undefined) formData.append('skipBlockchain', String(opts.skipBlockchain));
      if (opts?.controlId) formData.append('controlId', opts.controlId);
      if (opts?.frameworkId) formData.append('frameworkId', opts.frameworkId);
      return fetchAPI(`/acos/evidence/${evidenceId}/analyze-and-anchor`, {
        method: 'POST',
        body: formData,
        headers: {},
      });
    },
    verifyIntegrity: async (evidenceId: string, file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return fetchAPI(`/acos/evidence/${evidenceId}/verify-integrity`, {
        method: 'POST',
        body: formData,
        headers: {},
      });
    },
    getProvenance: async (evidenceId: string) =>
      fetchAPI(`/acos/evidence/${evidenceId}/provenance`),
    getEvidenceAnalysis: async (evidenceId: string) =>
      fetchAPI(`/acos/evidence/${evidenceId}/analysis`),
    getAnalysisHistory: async (evidenceId: string) =>
      fetchAPI(`/acos/evidence/${evidenceId}/analysis/history`),
    getAnchorSLA: async () => fetchAPI('/acos/evidence/anchor-sla'),

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
    checkVRSessionHealth: async (sessionId: string) => fetchAPI(`/acos/vr/sessions/${sessionId}/health`),
    joinVRSession: async (sessionId: string) => fetchAPI(`/acos/vr/sessions/${sessionId}/join`, { method: 'POST' }),

    // JIT Access
    requestJITAccess: async (data: any) => fetchAPI('/acos/jit/request', { method: 'POST', body: JSON.stringify(data) }),
    getJITAccessSessions: async () => fetchAPI('/acos/jit/sessions'),
    revokeJITSession: async (sessionId: string, reason?: string) => fetchAPI(`/acos/jit/sessions/${sessionId}/revoke`, { method: 'POST', body: JSON.stringify({ reason }) }),
    cancelJITAccessRequest: async (requestId: string) => fetchAPI(`/acos/jit/requests/${requestId}/cancel`, { method: 'POST' }),
    // Admin JIT Access Approval
    getPendingJITAccessRequests: async () => fetchAPI('/acos/jit/requests/pending'),
    getAllJITAccessRequests: async (status?: string) => {
      const url = status ? `/acos/jit/requests?status=${encodeURIComponent(status)}` : '/acos/jit/requests';
      return fetchAPI(url);
    },
    approveJITAccessRequest: async (requestId: string) => fetchAPI(`/acos/jit/requests/${requestId}/approve`, { method: 'POST' }),
    denyJITAccessRequest: async (requestId: string, reason: string) => fetchAPI(`/acos/jit/requests/${requestId}/deny`, { method: 'POST', body: JSON.stringify({ reason }) }),
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
    generateBYOKKey: async (provider: 'aws_kms' | 'azure_kv' | 'gcp_kms' | 'hashicorp_vault' | 'local', options: any) => 
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

  // --- NIST AI RMF ---
  aiRmf: {
    // AI System Management
    createAISystem: async (data: {
      name: string;
      description?: string;
      systemType: string;
      useCase?: string;
      deploymentContext?: string;
      lifecycleStage?: string;
      autonomyLevel?: string;
      metadata?: any;
    }) => {
      return fetchAPI('/ai-rmf/systems', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    getAISystems: async (filters?: { status?: string; lifecycleStage?: string; riskLevel?: string }) => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.lifecycleStage) params.append('lifecycleStage', filters.lifecycleStage);
      if (filters?.riskLevel) params.append('riskLevel', filters.riskLevel);
      const queryString = params.toString();
      return fetchAPI(`/ai-rmf/systems${queryString ? `?${queryString}` : ''}`);
    },

    getAISystemById: async (id: string) => {
      return fetchAPI(`/ai-rmf/systems/${id}`);
    },

    updateAISystem: async (id: string, updates: any) => {
      return fetchAPI(`/ai-rmf/systems/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    },

    deleteAISystem: async (id: string) => {
      return fetchAPI(`/ai-rmf/systems/${id}`, {
        method: 'DELETE',
      });
    },

    // Core Functions
    updateCoreFunction: async (aiSystemId: string, functionName: string, updates: any) => {
      return fetchAPI(`/ai-rmf/systems/${aiSystemId}/functions/${functionName}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    },

    // Categories and Subcategories
    updateCategory: async (categoryId: string, updates: any) => {
      return fetchAPI(`/ai-rmf/categories/${categoryId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    },

    updateSubcategory: async (subcategoryId: string, updates: any) => {
      return fetchAPI(`/ai-rmf/subcategories/${subcategoryId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    },

    // Trustworthiness Characteristics
    updateTrustworthinessCharacteristic: async (aiSystemId: string, characteristic: string, updates: any) => {
      return fetchAPI(`/ai-rmf/systems/${aiSystemId}/trustworthiness/${characteristic}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    },

    // Lifecycle Stages
    updateLifecycleStage: async (aiSystemId: string, stage: string, updates: any) => {
      return fetchAPI(`/ai-rmf/systems/${aiSystemId}/lifecycle/${stage}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    },

    // AI Actors
    addActor: async (aiSystemId: string, data: {
      actorType: string;
      userId?: string;
      name: string;
      role: string;
      responsibilities?: string[];
      involvementStages?: string[];
    }) => {
      return fetchAPI(`/ai-rmf/systems/${aiSystemId}/actors`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    removeActor: async (actorId: string) => {
      return fetchAPI(`/ai-rmf/actors/${actorId}`, {
        method: 'DELETE',
      });
    },

    // Assessments
    createAssessment: async (aiSystemId: string, data: {
      assessmentType: string;
      assessedBy: string;
      overallScore?: number;
      functionScores?: any;
      characteristicScores?: any;
      findings?: any;
      recommendations?: string[];
    }) => {
      return fetchAPI(`/ai-rmf/systems/${aiSystemId}/assessments`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    getAssessments: async (aiSystemId: string) => {
      return fetchAPI(`/ai-rmf/systems/${aiSystemId}/assessments`);
    },

    deleteAssessment: async (assessmentId: string) => {
      return fetchAPI(`/ai-rmf/assessments/${assessmentId}`, {
        method: 'DELETE',
      });
    },

    // Profiles
    createProfile: async (aiSystemId: string, data: {
      profileName: string;
      profileType: string;
      description?: string;
      selectedFunctions: any;
      priorities?: any;
      customizations?: any;
    }) => {
      return fetchAPI(`/ai-rmf/systems/${aiSystemId}/profiles`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    // Risk Activities
    createRiskActivity: async (aiSystemId: string, data: {
      activityType: string;
      relatedFunction?: string;
      relatedCategory?: string;
      relatedSubcategory?: string;
      description: string;
      riskLevel: string;
      mitigationPlan?: string;
      ownerId?: string;
      targetDate?: string;
      evidence?: any;
    }) => {
      return fetchAPI(`/ai-rmf/systems/${aiSystemId}/risk-activities`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    updateRiskActivity: async (riskActivityId: string, updates: any) => {
      return fetchAPI(`/ai-rmf/risk-activities/${riskActivityId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    },

    // Analytics
    calculateTrustworthinessScore: async (aiSystemId: string) => {
      return fetchAPI(`/ai-rmf/systems/${aiSystemId}/calculate-trustworthiness`, {
        method: 'POST',
      });
    },

    getDashboardData: async () => {
      return fetchAPI('/ai-rmf/dashboard');
    },
  },

  // ============================================================================
  // FEATURE SUBSCRIPTIONS (A-La-Carte)
  // ============================================================================

  /**
   * Get all available features for organization's tier
   */
  getAvailableFeatures: async (): Promise<{ features: any[] }> => {
    return fetchAPI<{ features: any[] }>('/billing/features');
  },

  /**
   * Get active feature subscriptions
   */
  getFeatureSubscriptions: async (): Promise<{ subscriptions: any[]; totalAnnualCost: number; totalMonthlyCost: number }> => {
    return fetchAPI<{ subscriptions: any[]; totalAnnualCost: number; totalMonthlyCost: number }>('/billing/features/subscriptions');
  },

  /**
   * Subscribe to a feature
   */
  subscribeToFeature: async (featureId: string, billingCycle: 'monthly' | 'annual' = 'annual'): Promise<{ subscription: any }> => {
    return fetchAPI<{ subscription: any }>(`/billing/features/${featureId}/subscribe`, {
      method: 'POST',
      body: JSON.stringify({ billingCycle }),
    });
  },

  /**
   * Unsubscribe from a feature
   */
  unsubscribeFromFeature: async (featureId: string): Promise<{ message: string }> => {
    return fetchAPI<{ message: string }>(`/billing/features/${featureId}/unsubscribe`, {
      method: 'DELETE',
    });
  },

  /**
   * Check feature access
   */
  checkFeatureAccess: async (featureId: string): Promise<{ hasAccess: boolean; feature: any }> => {
    return fetchAPI<{ hasAccess: boolean; feature: any }>(`/billing/features/${featureId}/access`);
  },

  /**
   * Get available feature bundles
   */
  getAvailableBundles: async (): Promise<{ bundles: any[] }> => {
    return fetchAPI<{ bundles: any[] }>('/billing/bundles');
  },

  /**
   * Subscribe to a feature bundle
   */
  subscribeToBundle: async (bundleId: string, billingCycle: 'monthly' | 'annual' = 'annual'): Promise<{ success: boolean; bundleId: string; billingCycle: string }> => {
    return fetchAPI<{ success: boolean; bundleId: string; billingCycle: string }>(`/billing/bundles/${bundleId}/subscribe`, {
      method: 'POST',
      body: JSON.stringify({ billingCycle }),
    });
  },

  /** Remove a feature bundle subscription */
  removeBundle: async (bundleId: string): Promise<{ success: boolean; bundleId: string }> => {
    return fetchAPI<{ success: boolean; bundleId: string }>(`/billing/bundles/${bundleId}`, { method: 'DELETE' });
  },

  // ============================================================================
  // EU REGULATIONS COMPLIANCE
  // ============================================================================
  euRegulations: {
    // EU AI Act
    aiAct: {
      registerSystem: async (systemData: any): Promise<{ system: any }> => {
        return fetchAPI<{ system: any }>('/eu-regulations/ai-act/systems', {
          method: 'POST',
          body: JSON.stringify(systemData),
        });
      },
      getSystems: async (): Promise<{ systems: any[] }> => {
        return fetchAPI<{ systems: any[] }>('/eu-regulations/ai-act/systems');
      },
      getSystem: async (id: string): Promise<{ system: any }> => {
        return fetchAPI<{ system: any }>(`/eu-regulations/ai-act/systems/${id}`);
      },
      updateSystem: async (id: string, updates: any): Promise<{ system: any }> => {
        return fetchAPI<{ system: any }>(`/eu-regulations/ai-act/systems/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        });
      },
      updateSystemStatus: async (id: string, complianceStatus: string): Promise<{ system: any }> => {
        return fetchAPI<{ system: any }>(`/eu-regulations/ai-act/systems/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ complianceStatus }),
        });
      },
      deleteSystem: async (id: string): Promise<void> => {
        return fetchAPI(`/eu-regulations/ai-act/systems/${id}`, {
          method: 'DELETE',
        });
      },
      getRiskAssessments: async (systemId: string): Promise<{ assessments: any[] }> => {
        return fetchAPI<{ assessments: any[] }>(`/eu-regulations/ai-act/systems/${systemId}/assessments`);
      },
      getLatestRiskAssessment: async (systemId: string): Promise<{ assessment: any | null }> => {
        return fetchAPI<{ assessment: any | null }>(`/eu-regulations/ai-act/systems/${systemId}/assessments/latest`);
      },
      conductRiskAssessment: async (systemId: string, assessmentData: any): Promise<{ assessment: any }> => {
        return fetchAPI<{ assessment: any }>(`/eu-regulations/ai-act/systems/${systemId}/assessments`, {
          method: 'POST',
          body: JSON.stringify(assessmentData),
        });
      },
      generateTransparencyReport: async (reportingPeriod: { start: Date; end: Date }): Promise<{ report: any }> => {
        return fetchAPI<{ report: any }>('/eu-regulations/ai-act/transparency-reports', {
          method: 'POST',
          body: JSON.stringify({ reportingPeriod }),
        });
      },
      getTransparencyReports: async (startDate?: Date, endDate?: Date): Promise<{ reports: any[] }> => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate.toISOString());
        if (endDate) params.append('endDate', endDate.toISOString());
        const query = params.toString();
        return fetchAPI<{ reports: any[] }>(`/eu-regulations/ai-act/transparency-reports${query ? `?${query}` : ''}`);
      },
    },
    // DMA
    dma: {
      registerGatekeeper: async (gatekeeperData: any): Promise<{ gatekeeper: any }> => {
        return fetchAPI<{ gatekeeper: any }>('/eu-regulations/dma/gatekeepers', {
          method: 'POST',
          body: JSON.stringify(gatekeeperData),
        });
      },
      getGatekeepers: async (): Promise<{ gatekeepers: any[] }> => {
        return fetchAPI<{ gatekeepers: any[] }>('/eu-regulations/dma/gatekeepers');
      },
      getGatekeeper: async (id: string): Promise<{ gatekeeper: any }> => {
        return fetchAPI<{ gatekeeper: any }>(`/eu-regulations/dma/gatekeepers/${id}`);
      },
      updateGatekeeper: async (id: string, updates: any): Promise<{ gatekeeper: any }> => {
        return fetchAPI<{ gatekeeper: any }>(`/eu-regulations/dma/gatekeepers/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        });
      },
      getObligations: async (gatekeeperId: string): Promise<{ obligations: any[] }> => {
        return fetchAPI<{ obligations: any[] }>(`/eu-regulations/dma/gatekeepers/${gatekeeperId}/obligations`);
      },
      getComplianceReports: async (gatekeeperId: string): Promise<{ reports: any[] }> => {
        return fetchAPI<{ reports: any[] }>(`/eu-regulations/dma/gatekeepers/${gatekeeperId}/compliance-reports`);
      },
      getLatestComplianceReport: async (gatekeeperId: string): Promise<{ report: any | null }> => {
        return fetchAPI<{ report: any | null }>(`/eu-regulations/dma/gatekeepers/${gatekeeperId}/compliance-reports/latest`);
      },
      deleteGatekeeper: async (id: string): Promise<void> => {
        return fetchAPI(`/eu-regulations/dma/gatekeepers/${id}`, {
          method: 'DELETE',
        });
      },
      updateObligationCompliance: async (gatekeeperId: string, obligationType: string, complianceData: any): Promise<{ success: boolean }> => {
        return fetchAPI<{ success: boolean }>(`/eu-regulations/dma/gatekeepers/${gatekeeperId}/obligations/${obligationType}`, {
          method: 'PATCH',
          body: JSON.stringify(complianceData),
        });
      },
      generateComplianceReport: async (gatekeeperId: string, reportingPeriod: { start: Date; end: Date }): Promise<{ report: any }> => {
        return fetchAPI<{ report: any }>(`/eu-regulations/dma/gatekeepers/${gatekeeperId}/compliance-reports`, {
          method: 'POST',
          body: JSON.stringify({ reportingPeriod }),
        });
      },
    },
    // DSA
    dsa: {
      registerPlatform: async (platformData: any): Promise<{ platform: any }> => {
        return fetchAPI<{ platform: any }>('/eu-regulations/dsa/platforms', {
          method: 'POST',
          body: JSON.stringify(platformData),
        });
      },
      getPlatforms: async (): Promise<{ platforms: any[] }> => {
        return fetchAPI<{ platforms: any[] }>('/eu-regulations/dsa/platforms');
      },
      getPlatform: async (id: string): Promise<{ platform: any }> => {
        return fetchAPI<{ platform: any }>(`/eu-regulations/dsa/platforms/${id}`);
      },
      updatePlatform: async (id: string, updates: any): Promise<{ platform: any }> => {
        return fetchAPI<{ platform: any }>(`/eu-regulations/dsa/platforms/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        });
      },
      deletePlatform: async (id: string): Promise<void> => {
        return fetchAPI(`/eu-regulations/dsa/platforms/${id}`, {
          method: 'DELETE',
        });
      },
      recordContentModeration: async (platformId: string, moderationData: any): Promise<{ moderation: any }> => {
        return fetchAPI<{ moderation: any }>(`/eu-regulations/dsa/platforms/${platformId}/content-moderation`, {
          method: 'POST',
          body: JSON.stringify(moderationData),
        });
      },
      reportIllegalContent: async (platformId: string, reportData: any): Promise<{ report: any }> => {
        return fetchAPI<{ report: any }>(`/eu-regulations/dsa/platforms/${platformId}/illegal-content-reports`, {
          method: 'POST',
          body: JSON.stringify(reportData),
        });
      },
      processIllegalContentReport: async (reportId: string, action: any): Promise<{ report: any }> => {
        return fetchAPI<{ report: any }>(`/eu-regulations/dsa/illegal-content-reports/${reportId}`, {
          method: 'PATCH',
          body: JSON.stringify(action),
        });
      },
      addAdToRepository: async (platformId: string, adData: any): Promise<{ adEntry: any }> => {
        return fetchAPI<{ adEntry: any }>(`/eu-regulations/dsa/platforms/${platformId}/ad-repository`, {
          method: 'POST',
          body: JSON.stringify(adData),
        });
      },
      getAdsFromRepository: async (platformId: string): Promise<{ ads: any[] }> => {
        return fetchAPI<{ ads: any[] }>(`/eu-regulations/dsa/platforms/${platformId}/ad-repository`);
      },
      getContentModerationHistory: async (platformId: string): Promise<{ history: any[] }> =>
        fetchAPI<{ history: any[] }>(`/eu-regulations/dsa/platforms/${platformId}/content-moderation`),
      getTransparencyReports: async (platformId: string): Promise<{ reports: any[] }> =>
        fetchAPI<{ reports: any[] }>(`/eu-regulations/dsa/platforms/${platformId}/transparency-reports`),
      generateTransparencyReport: async (platformId: string, reportingPeriod: { start: Date; end: Date }): Promise<{ report: any }> => {
        return fetchAPI<{ report: any }>(`/eu-regulations/dsa/platforms/${platformId}/transparency-reports`, {
          method: 'POST',
          body: JSON.stringify({ reportingPeriod }),
        });
      },
      conductRiskAssessment: async (platformId: string, assessmentData: any): Promise<{ assessment: any }> => {
        return fetchAPI<{ assessment: any }>(`/eu-regulations/dsa/platforms/${platformId}/risk-assessments`, {
          method: 'POST',
          body: JSON.stringify(assessmentData),
        });
      },
      getRiskAssessments: async (platformId: string): Promise<{ assessments: any[] }> => {
        return fetchAPI<{ assessments: any[] }>(`/eu-regulations/dsa/platforms/${platformId}/risk-assessments`);
      },
      getLatestRiskAssessment: async (platformId: string): Promise<{ assessment: any | null }> => {
        return fetchAPI<{ assessment: any | null }>(`/eu-regulations/dsa/platforms/${platformId}/risk-assessments/latest`);
      },
      updateRiskAssessment: async (assessmentId: string, updates: any): Promise<{ assessment: any }> => {
        return fetchAPI<{ assessment: any }>(`/eu-regulations/dsa/risk-assessments/${assessmentId}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        });
      },
      configureNonPersonalizedFeed: async (platformId: string, configData: any): Promise<{ feedConfig: any }> => {
        return fetchAPI<{ feedConfig: any }>(`/eu-regulations/dsa/platforms/${platformId}/non-personalized-feed`, {
          method: 'POST',
          body: JSON.stringify(configData),
        });
      },
      getNonPersonalizedFeed: async (platformId: string): Promise<{ feedConfig: any | null }> => {
        return fetchAPI<{ feedConfig: any | null }>(`/eu-regulations/dsa/platforms/${platformId}/non-personalized-feed`);
      },
      updateNonPersonalizedFeedStatus: async (platformId: string, updates: any): Promise<{ feedConfig: any }> => {
        return fetchAPI<{ feedConfig: any }>(`/eu-regulations/dsa/platforms/${platformId}/non-personalized-feed`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        });
      },
    },
  },

  // ============================================================================
  // FEATURE MODULES
  // ============================================================================
  modules: {
    // --- Governance Manager ---
    governance: {
      listBodies: async () => fetchAPI<any[]>('/modules/governance/bodies'),
      createBody: async (data: any) => fetchAPI<any>('/modules/governance/bodies', { method: 'POST', body: JSON.stringify(data) }),
      updateBody: async (id: string, data: any) => fetchAPI<any>(`/modules/governance/bodies/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      deleteBody: async (id: string) => fetchAPI<any>(`/modules/governance/bodies/${id}`, { method: 'DELETE' }),
      createMeeting: async (data: any) => fetchAPI<any>('/modules/governance/meetings', { method: 'POST', body: JSON.stringify(data) }),
      updateMeeting: async (id: string, data: any) => fetchAPI<any>(`/modules/governance/meetings/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      deleteMeeting: async (id: string) => fetchAPI<any>(`/modules/governance/meetings/${id}`, { method: 'DELETE' }),
      createDecision: async (data: any) => fetchAPI<any>('/modules/governance/decisions', { method: 'POST', body: JSON.stringify(data) }),
      updateDecision: async (id: string, data: any) => fetchAPI<any>(`/modules/governance/decisions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      createEscalationPath: async (data: any) => fetchAPI<any>('/modules/governance/escalation-paths', { method: 'POST', body: JSON.stringify(data) }),
      updateEscalationPath: async (id: string, data: any) => fetchAPI<any>(`/modules/governance/escalation-paths/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      deleteEscalationPath: async (id: string) => fetchAPI<any>(`/modules/governance/escalation-paths/${id}`, { method: 'DELETE' }),
      getDPO: async () => fetchAPI<any>('/modules/governance/dpo'),
      upsertDPO: async (data: any) => fetchAPI<any>('/modules/governance/dpo', { method: 'PUT', body: JSON.stringify(data) }),
    },

    // --- Breach Notification ---
    breach: {
      listIncidents: async () => fetchAPI<any[]>('/modules/breach/incidents'),
      createIncident: async (data: any) => fetchAPI<any>('/modules/breach/incidents', { method: 'POST', body: JSON.stringify(data) }),
      getIncident: async (id: string) => fetchAPI<any>(`/modules/breach/incidents/${id}`),
      updateIncident: async (id: string, data: any) => fetchAPI<any>(`/modules/breach/incidents/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      deleteIncident: async (id: string) => fetchAPI<any>(`/modules/breach/incidents/${id}`, { method: 'DELETE' }),
      createNotification: async (data: any) => fetchAPI<any>('/modules/breach/notifications', { method: 'POST', body: JSON.stringify(data) }),
      updateNotification: async (id: string, data: any) => fetchAPI<any>(`/modules/breach/notifications/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      listTemplates: async () => fetchAPI<any[]>('/modules/breach/templates'),
      createTemplate: async (data: any) => fetchAPI<any>('/modules/breach/templates', { method: 'POST', body: JSON.stringify(data) }),
      updateTemplate: async (id: string, data: any) => fetchAPI<any>(`/modules/breach/templates/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      deleteTemplate: async (id: string) => fetchAPI<any>(`/modules/breach/templates/${id}`, { method: 'DELETE' }),
      listContacts: async () => fetchAPI<any[]>('/modules/breach/contacts'),
      createContact: async (data: any) => fetchAPI<any>('/modules/breach/contacts', { method: 'POST', body: JSON.stringify(data) }),
      updateContact: async (id: string, data: any) => fetchAPI<any>(`/modules/breach/contacts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      deleteContact: async (id: string) => fetchAPI<any>(`/modules/breach/contacts/${id}`, { method: 'DELETE' }),
    },

    // --- CE Marking ---
    ceMarking: {
      listProducts: async () => fetchAPI<any[]>('/modules/ce-marking/products'),
      createProduct: async (data: any) => fetchAPI<any>('/modules/ce-marking/products', { method: 'POST', body: JSON.stringify(data) }),
      getProduct: async (id: string) => fetchAPI<any>(`/modules/ce-marking/products/${id}`),
      updateProduct: async (id: string, data: any) => fetchAPI<any>(`/modules/ce-marking/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      deleteProduct: async (id: string) => fetchAPI<any>(`/modules/ce-marking/products/${id}`, { method: 'DELETE' }),
      listNotifiedBodies: async () => fetchAPI<any[]>('/modules/ce-marking/notified-bodies'),
      listRequirements: async () => fetchAPI<any[]>('/modules/ce-marking/requirements'),
      listDocuments: async () => fetchAPI<any[]>('/modules/ce-marking/documents'),
      listRiskItems: async () => fetchAPI<any[]>('/modules/ce-marking/risk-items'),
      listSurveillanceChecks: async () => fetchAPI<any[]>('/modules/ce-marking/surveillance-checks'),
    },

    // --- Digital Product Passport ---
    dpp: {
      listPassports: async () => fetchAPI<any[]>('/modules/dpp/passports'),
      createPassport: async (data: any) => fetchAPI<any>('/modules/dpp/passports', { method: 'POST', body: JSON.stringify(data) }),
      getPassport: async (id: string) => fetchAPI<any>(`/modules/dpp/passports/${id}`),
      updatePassport: async (id: string, data: any) => fetchAPI<any>(`/modules/dpp/passports/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      deletePassport: async (id: string) => fetchAPI<any>(`/modules/dpp/passports/${id}`, { method: 'DELETE' }),
      getMaterials: async (id: string) => fetchAPI<any[]>(`/modules/dpp/passports/${id}/materials`),
      getCarbon: async (id: string) => fetchAPI<any[]>(`/modules/dpp/passports/${id}/carbon`),
      getSupplyChain: async (id: string) => fetchAPI<any[]>(`/modules/dpp/passports/${id}/supply-chain`),
      getSustainability: async (id: string) => fetchAPI<any>(`/modules/dpp/passports/${id}/sustainability`),
      getCertifications: async (id: string) => fetchAPI<any>(`/modules/dpp/passports/${id}/certifications`),
    },

    // --- ESG Reporting ---
    esg: {
      listMetrics: async (params?: { category?: string; reportingPeriod?: string }) => {
        const query = params ? '?' + new URLSearchParams(params).toString() : '';
        return fetchAPI<any[]>(`/modules/esg/metrics${query}`);
      },
      createMetric: async (data: any) => fetchAPI<any>('/modules/esg/metrics', { method: 'POST', body: JSON.stringify(data) }),
      updateMetric: async (id: string, data: any) => fetchAPI<any>(`/modules/esg/metrics/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      deleteMetric: async (id: string) => fetchAPI<any>(`/modules/esg/metrics/${id}`, { method: 'DELETE' }),
      listMateriality: async () => fetchAPI<any[]>('/modules/esg/materiality'),
      createMateriality: async (data: any) => fetchAPI<any>('/modules/esg/materiality', { method: 'POST', body: JSON.stringify(data) }),
      updateMateriality: async (id: string, data: any) => fetchAPI<any>(`/modules/esg/materiality/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      deleteMateriality: async (id: string) => fetchAPI<any>(`/modules/esg/materiality/${id}`, { method: 'DELETE' }),
      listReports: async () => fetchAPI<any[]>('/modules/esg/reports'),
      generateReport: async (data: { type: 'annual' | 'interim' | 'thematic'; periodStart?: string; periodEnd?: string }) =>
        fetchAPI<any>('/modules/esg/reports', { method: 'POST', body: JSON.stringify(data) }),
      listDataCollectionWorkflows: async () => fetchAPI<any[]>('/modules/esg/data-collection-workflows'),
    },

    // --- SBOM Manager ---
    sbom: {
      listEntries: async (params?: { repositoryName?: string; licenseRisk?: string }) => {
        const query = params ? '?' + new URLSearchParams(params).toString() : '';
        return fetchAPI<any[]>(`/modules/sbom/entries${query}`);
      },
      createEntry: async (data: any) => fetchAPI<any>('/modules/sbom/entries', { method: 'POST', body: JSON.stringify(data) }),
      bulkCreateEntries: async (entries: any[]) => fetchAPI<any>('/modules/sbom/entries/bulk', { method: 'POST', body: JSON.stringify({ entries }) }),
      updateEntry: async (id: string, data: any) => fetchAPI<any>(`/modules/sbom/entries/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      deleteEntry: async (id: string) => fetchAPI<any>(`/modules/sbom/entries/${id}`, { method: 'DELETE' }),
      listRepositories: async () => fetchAPI<any[]>('/modules/sbom/repositories'),
      createRepository: async (data: any) => fetchAPI<any>('/modules/sbom/repositories', { method: 'POST', body: JSON.stringify(data) }),
      updateRepository: async (id: string, data: any) => fetchAPI<any>(`/modules/sbom/repositories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      deleteRepository: async (id: string) => fetchAPI<any>(`/modules/sbom/repositories/${id}`, { method: 'DELETE' }),
      listLicenses: async () => fetchAPI<any[]>('/modules/sbom/licenses'),
    },

    // --- Post-Market Surveillance ---
    surveillance: {
      listPlans: async () => fetchAPI<any[]>('/modules/surveillance/plans'),
      createPlan: async (data: any) => fetchAPI<any>('/modules/surveillance/plans', { method: 'POST', body: JSON.stringify(data) }),
      updatePlan: async (id: string, data: any) => fetchAPI<any>(`/modules/surveillance/plans/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      deletePlan: async (id: string) => fetchAPI<any>(`/modules/surveillance/plans/${id}`, { method: 'DELETE' }),
      listIncidents: async () => fetchAPI<any[]>('/modules/surveillance/incidents'),
      createIncident: async (data: any) => fetchAPI<any>('/modules/surveillance/incidents', { method: 'POST', body: JSON.stringify(data) }),
      updateIncident: async (id: string, data: any) => fetchAPI<any>(`/modules/surveillance/incidents/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      listCapas: async () => fetchAPI<any[]>('/modules/surveillance/capas'),
      createCapa: async (data: any) => fetchAPI<any>('/modules/surveillance/capas', { method: 'POST', body: JSON.stringify(data) }),
      updateCapa: async (id: string, data: any) => fetchAPI<any>(`/modules/surveillance/capas/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      listNonConformities: async () => fetchAPI<any[]>('/modules/surveillance/non-conformities'),
      listReports: async () => fetchAPI<any[]>('/modules/surveillance/reports'),
      createReport: async (data: any) => fetchAPI<any>('/modules/surveillance/reports', { method: 'POST', body: JSON.stringify(data) }),
      listRecalls: async () => fetchAPI<any[]>('/modules/surveillance/recalls'),
      createRecall: async (data: any) => fetchAPI<any>('/modules/surveillance/recalls', { method: 'POST', body: JSON.stringify(data) }),
      updateRecall: async (id: string, data: any) => fetchAPI<any>(`/modules/surveillance/recalls/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    },

    // --- Product Decommissioning ---
    decommission: {
      listProducts: async () => fetchAPI<any[]>('/modules/decommission/products'),
      createProduct: async (data: any) => fetchAPI<any>('/modules/decommission/products', { method: 'POST', body: JSON.stringify(data) }),
      updateProduct: async (id: string, data: any) => fetchAPI<any>(`/modules/decommission/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      deleteProduct: async (id: string) => fetchAPI<any>(`/modules/decommission/products/${id}`, { method: 'DELETE' }),
      // Workflow tasks
      listWorkflowTasks: async (productId?: string) => {
        const qs = productId ? `?productId=${encodeURIComponent(productId)}` : '';
        return fetchAPI<any[]>(`/modules/decommission/workflow-tasks${qs}`);
      },
      updateWorkflowTask: async (id: string, data: any) => fetchAPI<any>(`/modules/decommission/workflow-tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      // Data migration plans
      listDataPlans: async (productId?: string) => {
        const qs = productId ? `?productId=${encodeURIComponent(productId)}` : '';
        return fetchAPI<any[]>(`/modules/decommission/data-plans${qs}`);
      },
      updateDataPlan: async (id: string, data: any) => fetchAPI<any>(`/modules/decommission/data-plans/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      // Customer notifications
      listNotifications: async (productId?: string) => {
        const qs = productId ? `?productId=${encodeURIComponent(productId)}` : '';
        return fetchAPI<any[]>(`/modules/decommission/notifications${qs}`);
      },
      createNotification: async (data: any) => fetchAPI<any>('/modules/decommission/notifications', { method: 'POST', body: JSON.stringify(data) }),
      updateNotification: async (id: string, data: any) => fetchAPI<any>(`/modules/decommission/notifications/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    },

    // --- Environmental Lifecycle ---
    lifecycle: {
      listAssessments: async () => fetchAPI<any[]>('/modules/lifecycle/assessments'),
      createAssessment: async (data: any) => fetchAPI<any>('/modules/lifecycle/assessments', { method: 'POST', body: JSON.stringify(data) }),
      getAssessment: async (id: string) => fetchAPI<any>(`/modules/lifecycle/assessments/${id}`),
      updateAssessment: async (id: string, data: any) => fetchAPI<any>(`/modules/lifecycle/assessments/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      deleteAssessment: async (id: string) => fetchAPI<any>(`/modules/lifecycle/assessments/${id}`, { method: 'DELETE' }),
    },

    // --- Product Lifecycle Tracker ---
    productLifecycle: {
      listProducts: async (params?: { currentStage?: string }) => {
        const query = params ? '?' + new URLSearchParams(params).toString() : '';
        return fetchAPI<any[]>(`/modules/product-lifecycle/products${query}`);
      },
      createProduct: async (data: any) => fetchAPI<any>('/modules/product-lifecycle/products', { method: 'POST', body: JSON.stringify(data) }),
      getProduct: async (id: string) => fetchAPI<any>(`/modules/product-lifecycle/products/${id}`),
      updateProduct: async (id: string, data: any) => fetchAPI<any>(`/modules/product-lifecycle/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      deleteProduct: async (id: string) => fetchAPI<any>(`/modules/product-lifecycle/products/${id}`, { method: 'DELETE' }),
    },

    // --- Process Mapper ---
    processMaps: {
      list: async (params?: { category?: string }) => {
        const query = params ? '?' + new URLSearchParams(params).toString() : '';
        return fetchAPI<any[]>(`/modules/process-maps${query}`);
      },
      create: async (data: any) => fetchAPI<any>('/modules/process-maps', { method: 'POST', body: JSON.stringify(data) }),
      get: async (id: string) => fetchAPI<any>(`/modules/process-maps/${id}`),
      update: async (id: string, data: any) => fetchAPI<any>(`/modules/process-maps/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      delete: async (id: string) => fetchAPI<any>(`/modules/process-maps/${id}`, { method: 'DELETE' }),
    },

    // --- Inter-Module Data Sync ---
    syncSBOM: async () => fetchAPI<any>('/modules/sync/sbom', { method: 'POST' }),
    syncBreach: async () => fetchAPI<any>('/modules/sync/breach', { method: 'POST' }),

    // --- Connection Testing ---
    testConnection: async (provider: string) => fetchAPI<any>(`/modules/integrations/${provider}/test`),
  },

  // --- Onboarding ---
  onboarding: {
    getProgress: async (): Promise<{
      progress: OnboardingProgress;
      organizationPlan: TierName;
      organizationName: string;
      onboardingCompleted: boolean;
    }> => {
      return fetchAPI('/onboarding/progress');
    },

    updateProgress: async (updates: Partial<OnboardingProgress>): Promise<{ progress: OnboardingProgress }> => {
      return fetchAPI('/onboarding/progress', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },

    trackEvent: async (data: {
      eventType: string;
      flowName?: string;
      stepIndex?: number;
      metadata?: Record<string, any>;
    }): Promise<{ event: any }> => {
      return fetchAPI('/onboarding/event', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    completeMilestone: async (milestone: string): Promise<{ progress: OnboardingProgress }> => {
      return fetchAPI('/onboarding/complete-milestone', {
        method: 'POST',
        body: JSON.stringify({ milestone }),
      });
    },

    updatePreferences: async (prefs: {
      showHints?: boolean;
      reducedMotion?: boolean;
    }): Promise<{ progress: OnboardingProgress }> => {
      return fetchAPI('/onboarding/preferences', {
        method: 'PUT',
        body: JSON.stringify(prefs),
      });
    },

    skipFlow: async (flowName: string): Promise<{ progress: OnboardingProgress }> => {
      return fetchAPI('/onboarding/skip-flow', {
        method: 'POST',
        body: JSON.stringify({ flowName }),
      });
    },

    reset: async (): Promise<{ progress: OnboardingProgress }> => {
      return fetchAPI('/onboarding/reset', {
        method: 'POST',
      });
    },

    getChecklist: async (): Promise<{ checklist: OnboardingChecklist }> => {
      return fetchAPI('/onboarding/checklist');
    },

    updateChecklist: async (updates: Partial<OnboardingChecklist>): Promise<{ checklist: OnboardingChecklist }> => {
      return fetchAPI('/onboarding/checklist', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },
  },

  regulationData: {
    getAll: async (module: string) => fetchAPI<Record<string, any>>(`/modules/regulation-data/${module}`),
    get: async (module: string, dataType: string) => fetchAPI<any>(`/modules/regulation-data/${module}/${dataType}`),
    save: async (module: string, dataType: string, data: any) =>
      fetchAPI<any>(`/modules/regulation-data/${module}/${dataType}`, {
        method: 'PUT',
        body: JSON.stringify({ data }),
      }),
    delete: async (module: string, dataType: string) =>
      fetchAPI<any>(`/modules/regulation-data/${module}/${dataType}`, { method: 'DELETE' }),
  },

  metrics: {
    record: async (metricType: string, value: number, metadata?: any) =>
      fetchAPI<any>('/modules/metrics', {
        method: 'POST',
        body: JSON.stringify({ metricType, value, metadata }),
      }),
    getHistory: async (metricType: string, days?: number) =>
      fetchAPI<any[]>(`/modules/metrics/${metricType}${days ? `?days=${days}` : ''}`),
    getLatest: async () => fetchAPI<Record<string, any>>('/modules/metrics/latest'),
  },

  // --- SOX Compliance ---
  sox: {
    getDashboard: async () => fetchAPI<any>('/sox/dashboard'),
    listControls: async (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return fetchAPI<any>(`/sox/controls${qs}`);
    },
    createControl: async (data: any) => fetchAPI<any>('/sox/controls', { method: 'POST', body: JSON.stringify(data) }),
    getControl: async (id: string) => fetchAPI<any>(`/sox/controls/${id}`),
    updateControl: async (id: string, data: any) => fetchAPI<any>(`/sox/controls/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteControl: async (id: string) => fetchAPI<any>(`/sox/controls/${id}`, { method: 'DELETE' }),
    listTestResults: async (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return fetchAPI<any>(`/sox/test-results${qs}`);
    },
    createTestResult: async (data: any) => fetchAPI<any>('/sox/test-results', { method: 'POST', body: JSON.stringify(data) }),
    updateTestResult: async (id: string, data: any) => fetchAPI<any>(`/sox/test-results/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    listAssessments: async () => fetchAPI<any>('/sox/assessments'),
    createAssessment: async (data: any) => fetchAPI<any>('/sox/assessments', { method: 'POST', body: JSON.stringify(data) }),
    updateAssessment: async (id: string, data: any) => fetchAPI<any>(`/sox/assessments/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },

  // --- Separation of Duties ---
  sod: {
    getDashboard: async () => fetchAPI<any>('/sod/dashboard'),
    listRules: async (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return fetchAPI<any>(`/sod/rules${qs}`);
    },
    createRule: async (data: any) => fetchAPI<any>('/sod/rules', { method: 'POST', body: JSON.stringify(data) }),
    getRule: async (id: string) => fetchAPI<any>(`/sod/rules/${id}`),
    updateRule: async (id: string, data: any) => fetchAPI<any>(`/sod/rules/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteRule: async (id: string) => fetchAPI<any>(`/sod/rules/${id}`, { method: 'DELETE' }),
    listViolations: async (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return fetchAPI<any>(`/sod/violations${qs}`);
    },
    runAnalysis: async () => fetchAPI<any>('/sod/analyze', { method: 'POST' }),
    mitigateViolation: async (id: string, data: any) => fetchAPI<any>(`/sod/violations/${id}/mitigate`, { method: 'POST', body: JSON.stringify(data) }),
    acceptViolation: async (id: string, data: any) => fetchAPI<any>(`/sod/violations/${id}/accept`, { method: 'POST', body: JSON.stringify(data) }),
    getMatrix: async () => fetchAPI<any>('/sod/matrix'),
  },

  // --- MDM (Mobile Device Management) ---
  mdm: {
    getDashboard: async () => fetchAPI<any>('/mdm/dashboard'),
    listDevices: async (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return fetchAPI<any>(`/mdm/devices${qs}`);
    },
    enrollDevice: async (data: any) => fetchAPI<any>('/mdm/devices', { method: 'POST', body: JSON.stringify(data) }),
    getDevice: async (id: string) => fetchAPI<any>(`/mdm/devices/${id}`),
    updateDevice: async (id: string, data: any) => fetchAPI<any>(`/mdm/devices/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    unenrollDevice: async (id: string) => fetchAPI<any>(`/mdm/devices/${id}`, { method: 'DELETE' }),
    executeAction: async (deviceId: string, data: any) => fetchAPI<any>(`/mdm/devices/${deviceId}/actions`, { method: 'POST', body: JSON.stringify(data) }),
    listActions: async (deviceId: string) => fetchAPI<any>(`/mdm/devices/${deviceId}/actions`),
    listPolicies: async () => fetchAPI<any>('/mdm/policies'),
    createPolicy: async (data: any) => fetchAPI<any>('/mdm/policies', { method: 'POST', body: JSON.stringify(data) }),
    updatePolicy: async (id: string, data: any) => fetchAPI<any>(`/mdm/policies/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deletePolicy: async (id: string) => fetchAPI<any>(`/mdm/policies/${id}`, { method: 'DELETE' }),
    runComplianceCheck: async (deviceId: string) => fetchAPI<any>(`/mdm/devices/${deviceId}/compliance-check`, { method: 'POST' }),
  },

  // --- DORA (Digital Operational Resilience Act) ---
  dora: {
    getDashboard: async () => fetchAPI<any>('/dora/dashboard'),
    listAssessments: async (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return fetchAPI<any>(`/dora/risk-assessments${qs}`);
    },
    createAssessment: async (data: any) => fetchAPI<any>('/dora/risk-assessments', { method: 'POST', body: JSON.stringify(data) }),
    getAssessment: async (id: string) => fetchAPI<any>(`/dora/risk-assessments/${id}`),
    updateAssessment: async (id: string, data: any) => fetchAPI<any>(`/dora/risk-assessments/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    listIncidents: async (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return fetchAPI<any>(`/dora/incidents${qs}`);
    },
    createIncident: async (data: any) => fetchAPI<any>('/dora/incidents', { method: 'POST', body: JSON.stringify(data) }),
    updateIncident: async (id: string, data: any) => fetchAPI<any>(`/dora/incidents/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    listProviders: async () => fetchAPI<any>('/dora/third-party-providers'),
    createProvider: async (data: any) => fetchAPI<any>('/dora/third-party-providers', { method: 'POST', body: JSON.stringify(data) }),
    updateProvider: async (id: string, data: any) => fetchAPI<any>(`/dora/third-party-providers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    listTests: async () => fetchAPI<any>('/dora/resilience-tests'),
    createTest: async (data: any) => fetchAPI<any>('/dora/resilience-tests', { method: 'POST', body: JSON.stringify(data) }),
    updateTest: async (id: string, data: any) => fetchAPI<any>(`/dora/resilience-tests/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    listAssets: async () => fetchAPI<any>('/dora/information-register'),
    createAsset: async (data: any) => fetchAPI<any>('/dora/information-register', { method: 'POST', body: JSON.stringify(data) }),
  },

  // --- Auditor Collaboration Hub ---
  auditor: {
    getDashboard: async () => fetchAPI<any>('/auditor/dashboard'),
    matchAuditors: async (criteria: any) => fetchAPI<any>('/auditor/match', { method: 'POST', body: JSON.stringify(criteria) }),
    listProfiles: async (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return fetchAPI<any>(`/auditor/profiles${qs}`);
    },
    createProfile: async (data: any) => fetchAPI<any>('/auditor/profiles', { method: 'POST', body: JSON.stringify(data) }),
    getProfile: async (id: string) => fetchAPI<any>(`/auditor/profiles/${id}`),
    updateProfile: async (id: string, data: any) => fetchAPI<any>(`/auditor/profiles/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteProfile: async (id: string) => fetchAPI<any>(`/auditor/profiles/${id}`, { method: 'DELETE' }),
    listEngagements: async (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return fetchAPI<any>(`/auditor/engagements${qs}`);
    },
    createEngagement: async (data: any) => fetchAPI<any>('/auditor/engagements', { method: 'POST', body: JSON.stringify(data) }),
    getEngagement: async (id: string) => fetchAPI<any>(`/auditor/engagements/${id}`),
    updateEngagement: async (id: string, data: any) => fetchAPI<any>(`/auditor/engagements/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    listFindings: async (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return fetchAPI<any>(`/auditor/findings${qs}`);
    },
    createFinding: async (data: any) => fetchAPI<any>('/auditor/findings', { method: 'POST', body: JSON.stringify(data) }),
    updateFinding: async (id: string, data: any) => fetchAPI<any>(`/auditor/findings/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    listWorkpapers: async (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return fetchAPI<any>(`/auditor/workpapers${qs}`);
    },
    createWorkpaper: async (data: any) => fetchAPI<any>('/auditor/workpapers', { method: 'POST', body: JSON.stringify(data) }),
    listRequests: async (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return fetchAPI<any>(`/auditor/requests${qs}`);
    },
    createRequest: async (data: any) => fetchAPI<any>('/auditor/requests', { method: 'POST', body: JSON.stringify(data) }),
    updateRequest: async (id: string, data: any) => fetchAPI<any>(`/auditor/requests/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },

  // --- Workflow Builder ---
  workflows: {
    list: async (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return fetchAPI<any>(`/workflows${qs}`);
    },
    create: async (data: any) => fetchAPI<any>('/workflows', { method: 'POST', body: JSON.stringify(data) }),
    get: async (id: string) => fetchAPI<any>(`/workflows/${id}`),
    update: async (id: string, data: any) => fetchAPI<any>(`/workflows/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: async (id: string) => fetchAPI<any>(`/workflows/${id}`, { method: 'DELETE' }),
    duplicate: async (id: string) => fetchAPI<any>(`/workflows/${id}/duplicate`, { method: 'POST' }),
    run: async (id: string) => fetchAPI<any>(`/workflows/${id}/run`, { method: 'POST' }),
    listTemplates: async () => fetchAPI<any>('/workflows/templates/list'),
    useTemplate: async (id: string) => fetchAPI<any>(`/workflows/templates/${id}/use`, { method: 'POST' }),
    listRuns: async (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return fetchAPI<any>(`/workflows/runs/list${qs}`);
    },
    getRun: async (id: string) => fetchAPI<any>(`/workflows/runs/${id}`),
    retryRun: async (id: string) => fetchAPI<any>(`/workflows/runs/${id}/retry`, { method: 'POST' }),
    listRules: async () => fetchAPI<any>('/workflows/rules/list'),
    createRule: async (data: any) => fetchAPI<any>('/workflows/rules', { method: 'POST', body: JSON.stringify(data) }),
    updateRule: async (id: string, data: any) => fetchAPI<any>(`/workflows/rules/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteRule: async (id: string) => fetchAPI<any>(`/workflows/rules/${id}`, { method: 'DELETE' }),
    getRule: async (id: string) => fetchAPI<any>(`/workflows/rules/${id}`),
    testRule: async (id: string) => fetchAPI<any>(`/workflows/rules/${id}/test`, { method: 'POST' }),
    getExecutionLog: async (id: string) => fetchAPI<any>(`/workflows/rules/${id}/log`),
    toggleRule: async (id: string, enabled: boolean) => fetchAPI<any>(`/workflows/rules/${id}`, { method: 'PATCH', body: JSON.stringify({ enabled }) }),
  },

  // --- Privacy Management Platform ---
  privacy: {
    getDashboard: async () => fetchAPI<any>('/privacy/dashboard'),
    // DSAR
    listDSARs: async (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return fetchAPI<any>(`/privacy/dsar${qs}`);
    },
    createDSAR: async (data: any) => fetchAPI<any>('/privacy/dsar', { method: 'POST', body: JSON.stringify(data) }),
    getDSAR: async (id: string) => fetchAPI<any>(`/privacy/dsar/${id}`),
    updateDSAR: async (id: string, data: any) => fetchAPI<any>(`/privacy/dsar/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    verifyDSARIdentity: async (id: string, data: any) => fetchAPI<any>(`/privacy/dsar/${id}/verify-identity`, { method: 'POST', body: JSON.stringify(data) }),
    completeDSAR: async (id: string) => fetchAPI<any>(`/privacy/dsar/${id}/complete`, { method: 'POST' }),
    // Consent
    listConsent: async (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return fetchAPI<any>(`/privacy/consent${qs}`);
    },
    createConsent: async (data: any) => fetchAPI<any>('/privacy/consent', { method: 'POST', body: JSON.stringify(data) }),
    updateConsent: async (id: string, data: any) => fetchAPI<any>(`/privacy/consent/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    getConsentPurposes: async () => fetchAPI<any>('/privacy/consent/purposes'),
    getConsentStats: async () => fetchAPI<any>('/privacy/consent/stats'),
    getConsentPreferences: async (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return fetchAPI<any>(`/privacy/consent/preferences${qs}`);
    },
    upsertConsentPreference: async (subjectId: string, data: any) => fetchAPI<any>(`/privacy/consent/preferences/${subjectId}`, { method: 'PUT', body: JSON.stringify(data) }),
    // Retention
    listRetention: async () => fetchAPI<any>('/privacy/retention'),
    createRetention: async (data: any) => fetchAPI<any>('/privacy/retention', { method: 'POST', body: JSON.stringify(data) }),
    updateRetention: async (id: string, data: any) => fetchAPI<any>(`/privacy/retention/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteRetention: async (id: string) => fetchAPI<any>(`/privacy/retention/${id}`, { method: 'DELETE' }),
    listRetentionJobs: async () => fetchAPI<any>('/privacy/retention/jobs'),
    runRetentionJob: async (id: string) => fetchAPI<any>(`/privacy/retention/jobs/${id}/run`, { method: 'POST' }),
    // SCC/TIA
    listSCCTIA: async () => fetchAPI<any>('/privacy/scc-tia'),
    createSCCTIA: async (data: any) => fetchAPI<any>('/privacy/scc-tia', { method: 'POST', body: JSON.stringify(data) }),
    updateSCCTIA: async (id: string, data: any) => fetchAPI<any>(`/privacy/scc-tia/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    getTIA: async (id: string) => fetchAPI<any>(`/privacy/scc-tia/${id}/tia`),
    createTIA: async (id: string, data: any) => fetchAPI<any>(`/privacy/scc-tia/${id}/tia`, { method: 'POST', body: JSON.stringify(data) }),
    // BCR
    listBCR: async () => fetchAPI<any>('/privacy/bcr'),
    createBCR: async (data: any) => fetchAPI<any>('/privacy/bcr', { method: 'POST', body: JSON.stringify(data) }),
    updateBCR: async (id: string, data: any) => fetchAPI<any>(`/privacy/bcr/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    // Marketing Opt-Out
    getMarketingPreferences: async () => fetchAPI<any>('/privacy/marketing'),
    optOut: async (data: any) => fetchAPI<any>('/privacy/marketing/opt-out', { method: 'POST', body: JSON.stringify(data) }),
    getSuppressionList: async () => fetchAPI<any>('/privacy/marketing/suppression-list'),
    addToSuppression: async (data: any) => fetchAPI<any>('/privacy/marketing/suppression-list', { method: 'POST', body: JSON.stringify(data) }),
    // Deletion
    listDeletions: async () => fetchAPI<any>('/privacy/deletion'),
    createDeletion: async (data: any) => fetchAPI<any>('/privacy/deletion', { method: 'POST', body: JSON.stringify(data) }),
    getDeletion: async (id: string) => fetchAPI<any>(`/privacy/deletion/${id}`),
    updateDeletion: async (id: string, data: any) => fetchAPI<any>(`/privacy/deletion/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    verifyDeletion: async (id: string) => fetchAPI<any>(`/privacy/deletion/${id}/verify`, { method: 'POST' }),
    executeDeletion: async (id: string) => fetchAPI<any>(`/privacy/deletion/${id}/execute`, { method: 'POST' }),
    getDeletionAuditLog: async () => fetchAPI<any>('/privacy/deletion/audit-log'),
    // Processing Restrictions
    listRestrictions: async () => fetchAPI<any>('/privacy/restrictions'),
    createRestriction: async (data: any) => fetchAPI<any>('/privacy/restrictions', { method: 'POST', body: JSON.stringify(data) }),
    updateRestriction: async (id: string, data: any) => fetchAPI<any>(`/privacy/restrictions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    liftRestriction: async (id: string, data: any) => fetchAPI<any>(`/privacy/restrictions/${id}/lift`, { method: 'POST', body: JSON.stringify(data) }),
    // AI Transparency
    listAITransparency: async () => fetchAPI<any>('/privacy/ai-transparency'),
    createAITransparency: async (data: any) => fetchAPI<any>('/privacy/ai-transparency', { method: 'POST', body: JSON.stringify(data) }),
    updateAITransparency: async (id: string, data: any) => fetchAPI<any>(`/privacy/ai-transparency/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    publishAITransparency: async (id: string) => fetchAPI<any>(`/privacy/ai-transparency/${id}/publish`, { method: 'POST' }),
    // JIT Privacy Notices
    listJITNotices: async () => fetchAPI<any>('/privacy/jit-notices'),
    createJITNotice: async (data: any) => fetchAPI<any>('/privacy/jit-notices', { method: 'POST', body: JSON.stringify(data) }),
    updateJITNotice: async (id: string, data: any) => fetchAPI<any>(`/privacy/jit-notices/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    recordJITImpression: async (id: string) => fetchAPI<any>(`/privacy/jit-notices/${id}/impression`, { method: 'POST' }),
    recordJITAcceptance: async (id: string) => fetchAPI<any>(`/privacy/jit-notices/${id}/accept`, { method: 'POST' }),
    recordJITDismissal: async (id: string) => fetchAPI<any>(`/privacy/jit-notices/${id}/dismiss`, { method: 'POST' }),
    // Privacy Notices (Art. 13-14 serving)
    listNotices: async (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return fetchAPI<any>(`/privacy/notices${qs}`);
    },
    createNotice: async (data: any) => fetchAPI<any>('/privacy/notices', { method: 'POST', body: JSON.stringify(data) }),
    getNotice: async (id: string) => fetchAPI<any>(`/privacy/notices/${id}`),
    updateNotice: async (id: string, data: any) => fetchAPI<any>(`/privacy/notices/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteNotice: async (id: string) => fetchAPI<any>(`/privacy/notices/${id}`, { method: 'DELETE' }),
    recordNoticeImpression: async (id: string) => fetchAPI<any>(`/privacy/notices/${id}/impression`, { method: 'POST' }),
    recordNoticeAcceptance: async (id: string) => fetchAPI<any>(`/privacy/notices/${id}/accept`, { method: 'POST' }),
    recordNoticeDismissal: async (id: string) => fetchAPI<any>(`/privacy/notices/${id}/dismiss`, { method: 'POST' }),
    // Notice Templates
    listNoticeTemplates: async () => fetchAPI<any>('/privacy/notices/templates'),
    // Notice Version History
    listNoticeVersionHistory: async (noticeId?: string) => {
      const qs = noticeId ? `?noticeId=${noticeId}` : '';
      return fetchAPI<any>(`/privacy/notices/versions${qs}`);
    },
  },

  // --- Marketplace ---
  marketplace: {
    list: async (params?: { category?: string; status?: string; search?: string; pricing?: string; tag?: string }) => {
      const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
      return fetchAPI<any>(`/marketplace${query}`);
    },
    getBySlug: async (slug: string) => {
      return fetchAPI<any>(`/marketplace/${encodeURIComponent(slug)}`);
    },
    install: async (slug: string, config?: Record<string, any>) => {
      return fetchAPI<any>(`/marketplace/${encodeURIComponent(slug)}/install`, {
        method: 'POST',
        body: JSON.stringify({ config }),
      });
    },
    configure: async (slug: string, config: Record<string, any>) => {
      return fetchAPI<any>(`/marketplace/${encodeURIComponent(slug)}/configure`, {
        method: 'PUT',
        body: JSON.stringify({ config }),
      });
    },
    uninstall: async (slug: string) => {
      return fetchAPI<any>(`/marketplace/${encodeURIComponent(slug)}/uninstall`, {
        method: 'POST',
      });
    },
    listInstalled: async () => {
      return fetchAPI<any>('/marketplace/org/installed');
    },
    test: async (slug: string) => {
      return fetchAPI<any>(`/marketplace/${encodeURIComponent(slug)}/test`, {
        method: 'POST',
      });
    },
  },

  // --- Data Export (CSV) ---
  dataExport: {
    vendors: async () => fetchAPI<Blob>('/export/vendors'),
    policies: async () => fetchAPI<Blob>('/export/policies'),
    issues: async () => fetchAPI<Blob>('/export/issues'),
    risks: async () => fetchAPI<Blob>('/export/risks'),
    frameworks: async () => fetchAPI<Blob>('/export/frameworks'),
    auditLogs: async () => fetchAPI<Blob>('/export/audit-logs'),
    monitors: async () => fetchAPI<Blob>('/export/monitors'),
  },

  // --- Personnel Management ---
  personnel: {
    list: async () => {
      return fetchAPI<any>('/personnel');
    },
    create: async (data: Record<string, any>) => {
      return fetchAPI<any>('/personnel', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    completeOnboarding: async (id: string) => {
      return fetchAPI<any>(`/personnel/${encodeURIComponent(id)}/complete-onboarding`, {
        method: 'POST',
      });
    },
    startOffboarding: async (id: string, reason?: string) => {
      return fetchAPI<any>(`/personnel/${encodeURIComponent(id)}/start-offboarding`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
    },
    createAccessReview: async (data: Record<string, any>) => {
      return fetchAPI<any>('/personnel/access-reviews', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    completeAccessReview: async (id: string, data: Record<string, any>) => {
      return fetchAPI<any>(`/personnel/access-reviews/${encodeURIComponent(id)}/complete`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    getPendingAccessReviews: async (reviewerId?: string) => {
      const query = reviewerId ? `?reviewerId=${encodeURIComponent(reviewerId)}` : '';
      return fetchAPI<any>(`/personnel/access-reviews/pending${query}`);
    },
    getComplianceSummary: async () => {
      return fetchAPI<any>('/personnel/compliance-summary');
    },
  },

  // --- Generic HTTP helpers (used by enhancement modules) ---
  get: async (endpoint: string) => fetchAPI<any>(endpoint),
  post: async (endpoint: string, data?: any) => fetchAPI<any>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  }),
  patch: async (endpoint: string, data?: any) => fetchAPI<any>(endpoint, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  }),
  delete: async (endpoint: string) => fetchAPI<any>(endpoint, { method: 'DELETE' }),
  put: async (endpoint: string, data?: any) => fetchAPI<any>(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  }),

  // --- Incident Management ---
  incidents: {
    list: async (params?: Record<string, any>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return fetchAPI<any>(`/incidents${query}`);
    },
    get: async (id: string) => fetchAPI<any>(`/incidents/${encodeURIComponent(id)}`),
    create: async (data: Record<string, any>) => fetchAPI<any>('/incidents', { method: 'POST', body: JSON.stringify(data) }),
    update: async (id: string, data: Record<string, any>) => fetchAPI<any>(`/incidents/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: async (id: string) => fetchAPI<any>(`/incidents/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    addTimeline: async (id: string, data: Record<string, any>) => fetchAPI<any>(`/incidents/${encodeURIComponent(id)}/timeline`, { method: 'POST', body: JSON.stringify(data) }),
    getTimeline: async (id: string) => fetchAPI<any>(`/incidents/${encodeURIComponent(id)}/timeline`),
    createTask: async (id: string, data: Record<string, any>) => fetchAPI<any>(`/incidents/${encodeURIComponent(id)}/tasks`, { method: 'POST', body: JSON.stringify(data) }),
    updateTask: async (id: string, taskId: string, data: Record<string, any>) => fetchAPI<any>(`/incidents/${encodeURIComponent(id)}/tasks/${encodeURIComponent(taskId)}`, { method: 'PATCH', body: JSON.stringify(data) }),
    getMetrics: async () => fetchAPI<any>('/incidents/metrics'),
  },

  // --- IT Asset Management ---
  assets: {
    list: async (params?: Record<string, any>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return fetchAPI<any>(`/assets${query}`);
    },
    get: async (id: string) => fetchAPI<any>(`/assets/${encodeURIComponent(id)}`),
    create: async (data: Record<string, any>) => fetchAPI<any>('/assets', { method: 'POST', body: JSON.stringify(data) }),
    update: async (id: string, data: Record<string, any>) => fetchAPI<any>(`/assets/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: async (id: string) => fetchAPI<any>(`/assets/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    getStats: async () => fetchAPI<any>('/assets/stats'),
  },

  // --- Compliance Calendar ---
  calendar: {
    listDeadlines: async (params?: Record<string, any>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return fetchAPI<any>(`/calendar/deadlines${query}`);
    },
    getDeadline: async (id: string) => fetchAPI<any>(`/calendar/deadlines/${encodeURIComponent(id)}`),
    createDeadline: async (data: Record<string, any>) => fetchAPI<any>('/calendar/deadlines', { method: 'POST', body: JSON.stringify(data) }),
    updateDeadline: async (id: string, data: Record<string, any>) => fetchAPI<any>(`/calendar/deadlines/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteDeadline: async (id: string) => fetchAPI<any>(`/calendar/deadlines/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    getUpcoming: async (days?: number) => fetchAPI<any>(`/calendar/upcoming${days ? `?days=${days}` : ''}`),
    getOverdue: async () => fetchAPI<any>('/calendar/overdue'),
    completeDeadline: async (id: string) => fetchAPI<any>(`/calendar/deadlines/${encodeURIComponent(id)}/complete`, { method: 'PATCH' }),
  },

  // --- GRC Maturity Assessment ---
  maturity: {
    listAssessments: async () => fetchAPI<any>('/maturity/assessments'),
    getAssessment: async (id: string) => fetchAPI<any>(`/maturity/assessments/${encodeURIComponent(id)}`),
    createAssessment: async (data: Record<string, any>) => fetchAPI<any>('/maturity/assessments', { method: 'POST', body: JSON.stringify(data) }),
    getLatest: async () => fetchAPI<any>('/maturity/assessments/latest'),
    getTrend: async () => fetchAPI<any>('/maturity/assessments/trend'),
    generateRecommendations: async (id: string) => fetchAPI<any>(`/maturity/assessments/${encodeURIComponent(id)}/recommendations`, { method: 'POST' }),
  },

  // --- Business Impact Analysis ---
  bia: {
    listProcesses: async (params?: Record<string, any>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return fetchAPI<any>(`/bia/processes${query}`);
    },
    getProcess: async (id: string) => fetchAPI<any>(`/bia/processes/${encodeURIComponent(id)}`),
    createProcess: async (data: Record<string, any>) => fetchAPI<any>('/bia/processes', { method: 'POST', body: JSON.stringify(data) }),
    updateProcess: async (id: string, data: Record<string, any>) => fetchAPI<any>(`/bia/processes/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteProcess: async (id: string) => fetchAPI<any>(`/bia/processes/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    addDependency: async (id: string, data: Record<string, any>) => fetchAPI<any>(`/bia/processes/${encodeURIComponent(id)}/dependencies`, { method: 'POST', body: JSON.stringify(data) }),
    removeDependency: async (id: string, depId: string) => fetchAPI<any>(`/bia/processes/${encodeURIComponent(id)}/dependencies/${encodeURIComponent(depId)}`, { method: 'DELETE' }),
    getStats: async () => fetchAPI<any>('/bia/stats'),
  },

  // --- Exception Management ---
  exceptions: {
    list: async (params?: Record<string, any>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return fetchAPI<any>(`/exceptions${query}`);
    },
    get: async (id: string) => fetchAPI<any>(`/exceptions/${encodeURIComponent(id)}`),
    create: async (data: Record<string, any>) => fetchAPI<any>('/exceptions', { method: 'POST', body: JSON.stringify(data) }),
    update: async (id: string, data: Record<string, any>) => fetchAPI<any>(`/exceptions/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }),
    approve: async (id: string) => fetchAPI<any>(`/exceptions/${encodeURIComponent(id)}/approve`, { method: 'PATCH' }),
    reject: async (id: string) => fetchAPI<any>(`/exceptions/${encodeURIComponent(id)}/reject`, { method: 'PATCH' }),
    getExpiring: async (days?: number) => fetchAPI<any>(`/exceptions/expiring${days ? `?days=${days}` : ''}`),
    getStats: async () => fetchAPI<any>('/exceptions/stats'),
  },

  // --- Certification Lifecycle ---
  certifications: {
    list: async (params?: Record<string, any>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return fetchAPI<any>(`/certifications${query}`);
    },
    get: async (id: string) => fetchAPI<any>(`/certifications/${encodeURIComponent(id)}`),
    create: async (data: Record<string, any>) => fetchAPI<any>('/certifications', { method: 'POST', body: JSON.stringify(data) }),
    update: async (id: string, data: Record<string, any>) => fetchAPI<any>(`/certifications/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: async (id: string) => fetchAPI<any>(`/certifications/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    scheduleAudit: async (id: string, data: Record<string, any>) => fetchAPI<any>(`/certifications/${encodeURIComponent(id)}/audits`, { method: 'POST', body: JSON.stringify(data) }),
    updateAudit: async (id: string, auditId: string, data: Record<string, any>) => fetchAPI<any>(`/certifications/${encodeURIComponent(id)}/audits/${encodeURIComponent(auditId)}`, { method: 'PATCH', body: JSON.stringify(data) }),
    getExpiring: async (days?: number) => fetchAPI<any>(`/certifications/expiring${days ? `?days=${days}` : ''}`),
  },

  // --- Compliance Cost Analytics ---
  costs: {
    list: async (params?: Record<string, any>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return fetchAPI<any>(`/costs${query}`);
    },
    create: async (data: Record<string, any>) => fetchAPI<any>('/costs', { method: 'POST', body: JSON.stringify(data) }),
    update: async (id: string, data: Record<string, any>) => fetchAPI<any>(`/costs/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: async (id: string) => fetchAPI<any>(`/costs/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    getSummary: async () => fetchAPI<any>('/costs/summary'),
    getTrend: async () => fetchAPI<any>('/costs/trend'),
    getBudget: async () => fetchAPI<any>('/costs/budget'),
  },

  // --- Executive Dashboard ---
  executive: {
    getDashboard: async () => fetchAPI<any>('/executive/dashboard'),
    getRAGStatus: async () => fetchAPI<any>('/executive/rag-status'),
    generateBoardPack: async () => fetchAPI<any>('/executive/board-pack', { method: 'POST' }),
    getTrends: async () => fetchAPI<any>('/executive/trends'),
  },

  // --- Control Effectiveness ---
  controlEffectiveness: {
    list: async (params?: Record<string, any>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return fetchAPI<any>(`/control-effectiveness${query}`);
    },
    create: async (data: Record<string, any>) => fetchAPI<any>('/control-effectiveness', { method: 'POST', body: JSON.stringify(data) }),
    getForControl: async (controlId: string) => fetchAPI<any>(`/control-effectiveness/control/${encodeURIComponent(controlId)}`),
    getTrend: async () => fetchAPI<any>('/control-effectiveness/trend'),
    getDegrading: async () => fetchAPI<any>('/control-effectiveness/degrading'),
    getStats: async () => fetchAPI<any>('/control-effectiveness/stats'),
  },

  // --- Regulatory Change Detection ---
  regulatoryChanges: {
    list: async (params?: Record<string, any>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return fetchAPI<any>(`/regulatory-changes${query}`);
    },
    get: async (id: string) => fetchAPI<any>(`/regulatory-changes/${encodeURIComponent(id)}`),
    create: async (data: Record<string, any>) => fetchAPI<any>('/regulatory-changes', { method: 'POST', body: JSON.stringify(data) }),
    update: async (id: string, data: Record<string, any>) => fetchAPI<any>(`/regulatory-changes/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }),
    dismiss: async (id: string) => fetchAPI<any>(`/regulatory-changes/${encodeURIComponent(id)}/dismiss`, { method: 'PATCH' }),
    getImpacts: async (id: string) => fetchAPI<any>(`/regulatory-changes/${encodeURIComponent(id)}/impacts`),
    addImpact: async (id: string, data: Record<string, any>) => fetchAPI<any>(`/regulatory-changes/${encodeURIComponent(id)}/impacts`, { method: 'POST', body: JSON.stringify(data) }),
    updateImpact: async (id: string, impactId: string, data: Record<string, any>) => fetchAPI<any>(`/regulatory-changes/${encodeURIComponent(id)}/impacts/${encodeURIComponent(impactId)}`, { method: 'PATCH', body: JSON.stringify(data) }),
    getStats: async () => fetchAPI<any>('/regulatory-changes/stats'),
    getDashboardChanges: async () => fetchAPI<{ changes: any[] }>('/regulatory-changes/dashboard/changes'),
    getRemediationTasks: async () => fetchAPI<{ tasks: any[] }>('/regulatory-changes/dashboard/remediation-tasks'),
    getImpactItems: async () => fetchAPI<{ items: any[] }>('/regulatory-changes/dashboard/impact-items'),
    getAuditLog: async (since?: string) => {
      const q = since ? '?since=' + encodeURIComponent(since) : '';
      return fetchAPI<{ entries: any[] }>(`/regulatory-changes/dashboard/audit-log${q}`);
    },
  },

  // --- Evidence Auto-Collection ---
  evidenceCollection: {
    list: async (params?: Record<string, any>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return fetchAPI<any>(`/evidence-collection${query}`);
    },
    get: async (id: string) => fetchAPI<any>(`/evidence-collection/${encodeURIComponent(id)}`),
    create: async (data: Record<string, any>) => fetchAPI<any>('/evidence-collection', { method: 'POST', body: JSON.stringify(data) }),
    update: async (id: string, data: Record<string, any>) => fetchAPI<any>(`/evidence-collection/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: async (id: string) => fetchAPI<any>(`/evidence-collection/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    trigger: async (id: string) => fetchAPI<any>(`/evidence-collection/${encodeURIComponent(id)}/trigger`, { method: 'POST' }),
    getStatus: async () => fetchAPI<any>('/evidence-collection/status'),
    getCompleteness: async () => fetchAPI<{ readiness: any[] }>('/evidence-collection/completeness'),
    getGaps: async (frameworkId?: string) => {
      const q = frameworkId ? '?frameworkId=' + encodeURIComponent(frameworkId) : '';
      return fetchAPI<{ gaps: any[] }>(`/evidence-collection/gaps${q}`);
    },
    getRecommendations: async () => fetchAPI<{ recommendations: any[] }>('/evidence-collection/recommendations'),
  },

  // --- Audit Preparation ---
  auditPrep: {
    getReadiness: async (frameworkId: string) => fetchAPI<any>(`/audit-prep/readiness/${encodeURIComponent(frameworkId)}`),
    getGaps: async (frameworkId: string) => fetchAPI<any>(`/audit-prep/gaps/${encodeURIComponent(frameworkId)}`),
    getMockQuestions: async (frameworkId: string) => fetchAPI<any>(`/audit-prep/mock-questions/${encodeURIComponent(frameworkId)}`, { method: 'POST' }),
    getEvidencePackage: async (frameworkId: string) => fetchAPI<any>(`/audit-prep/evidence-package/${encodeURIComponent(frameworkId)}`, { method: 'POST' }),
    getTimeline: async (frameworkId: string) => fetchAPI<any>(`/audit-prep/timeline/${encodeURIComponent(frameworkId)}`),
  },

  // --- Automated Control Testing ---
  controlTesting: {
    list: async (params?: Record<string, any>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return fetchAPI<any>(`/control-testing${query}`);
    },
    get: async (id: string) => fetchAPI<any>(`/control-testing/${encodeURIComponent(id)}`),
    create: async (data: Record<string, any>) => fetchAPI<any>('/control-testing', { method: 'POST', body: JSON.stringify(data) }),
    update: async (id: string, data: Record<string, any>) => fetchAPI<any>(`/control-testing/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: async (id: string) => fetchAPI<any>(`/control-testing/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    run: async (id: string) => fetchAPI<any>(`/control-testing/${encodeURIComponent(id)}/run`, { method: 'POST' }),
    getResults: async (id: string) => fetchAPI<any>(`/control-testing/${encodeURIComponent(id)}/results`),
    getCoverage: async () => fetchAPI<any>('/control-testing/coverage'),
    getStats: async () => fetchAPI<any>('/control-testing/stats'),
  },

  // --- Vendor Monitoring ---
  vendorMonitoring: {
    list: async (params?: Record<string, any>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      const res = await fetchAPI<any>(`/vendor-monitoring${query}`);
      return res?.data?.checks || (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
    },
    create: async (data: Record<string, any>) => fetchAPI<any>('/vendor-monitoring', { method: 'POST', body: JSON.stringify(data) }),
    getForVendor: async (vendorId: string) => {
      const res = await fetchAPI<any>(`/vendor-monitoring/vendor/${encodeURIComponent(vendorId)}`);
      return res?.data?.checks || (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
    },
    triggerCheck: async (vendorId: string) => fetchAPI<any>(`/vendor-monitoring/vendor/${encodeURIComponent(vendorId)}/check`, { method: 'POST' }),
    getAlerts: async () => {
      const res = await fetchAPI<any>('/vendor-monitoring/alerts');
      return res?.data?.alerts || (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
    },
    getStats: async () => {
      const res = await fetchAPI<any>('/vendor-monitoring/stats');
      return res?.data || res || {};
    },
  },

  // --- CI/CD Compliance Gates ---
  cicdGates: {
    listPolicies: async () => fetchAPI<any>('/cicd-gates/policies'),
    getPolicy: async (id: string) => fetchAPI<any>(`/cicd-gates/policies/${encodeURIComponent(id)}`),
    createPolicy: async (data: Record<string, any>) => fetchAPI<any>('/cicd-gates/policies', { method: 'POST', body: JSON.stringify(data) }),
    updatePolicy: async (id: string, data: Record<string, any>) => fetchAPI<any>(`/cicd-gates/policies/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deletePolicy: async (id: string) => fetchAPI<any>(`/cicd-gates/policies/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    check: async (data: Record<string, any>) => fetchAPI<any>('/cicd-gates/check', { method: 'POST', body: JSON.stringify(data) }),
    report: async (data: Record<string, any>) => fetchAPI<any>('/cicd-gates/report', { method: 'POST', body: JSON.stringify(data) }),
    listResults: async (params?: Record<string, any>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return fetchAPI<any>(`/cicd-gates/results${query}`);
    },
    getResult: async (id: string) => fetchAPI<any>(`/cicd-gates/results/${encodeURIComponent(id)}`),
  },

  // --- SSO Configuration ---
  sso: {
    getConfig: async () => fetchAPI<any>('/sso/config'),
    saveConfig: async (data: Record<string, any>) => fetchAPI<any>('/sso/config', { method: 'POST', body: JSON.stringify(data) }),
    deleteConfig: async () => fetchAPI<any>('/sso/config', { method: 'DELETE' }),
    getMetadata: async () => fetchAPI<any>('/sso/metadata'),
    testConnection: async () => fetchAPI<any>('/sso/test', { method: 'POST' }),
  },

  // --- SCIM Configuration ---
  scim: {
    getConfig: async () => fetchAPI<any>('/scim/config'),
    saveConfig: async (data: Record<string, any>) => fetchAPI<any>('/scim/config', { method: 'POST', body: JSON.stringify(data) }),
    generateToken: async () => fetchAPI<any>('/scim/generate-token', { method: 'POST' }),
    getSyncStatus: async () => fetchAPI<any>('/scim/sync-status'),
    getSyncLogs: async (params?: Record<string, any>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return fetchAPI<any>(`/scim/sync-logs${query}`);
    },
    triggerSync: async () => fetchAPI<any>('/scim/trigger-sync', { method: 'POST' }),
  },

  // --- Custom Roles ---
  roles: {
    list: async () => fetchAPI<any>('/roles'),
    get: async (id: string) => fetchAPI<any>(`/roles/${encodeURIComponent(id)}`),
    create: async (data: Record<string, any>) => fetchAPI<any>('/roles', { method: 'POST', body: JSON.stringify(data) }),
    update: async (id: string, data: Record<string, any>) => fetchAPI<any>(`/roles/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: async (id: string) => fetchAPI<any>(`/roles/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    addPermission: async (id: string, data: Record<string, any>) => fetchAPI<any>(`/roles/${encodeURIComponent(id)}/permissions`, { method: 'POST', body: JSON.stringify(data) }),
    removePermission: async (id: string, permId: string) => fetchAPI<any>(`/roles/${encodeURIComponent(id)}/permissions/${encodeURIComponent(permId)}`, { method: 'DELETE' }),
    getUsers: async (id: string) => fetchAPI<any>(`/roles/${encodeURIComponent(id)}/users`),
    assignRole: async (data: Record<string, any>) => fetchAPI<any>('/roles/assign', { method: 'POST', body: JSON.stringify(data) }),
    removeAssignment: async (userId: string, roleId: string) => fetchAPI<any>(`/roles/assign/${encodeURIComponent(userId)}/${encodeURIComponent(roleId)}`, { method: 'DELETE' }),
  },

  // --- Branding ---
  branding: {
    get: async () => fetchAPI<any>('/branding'),
    save: async (data: Record<string, any>) => fetchAPI<any>('/branding', { method: 'POST', body: JSON.stringify(data) }),
    reset: async () => fetchAPI<any>('/branding', { method: 'DELETE' }),
  },

  // --- Global Search ---
  search: {
    query: async (q: string, params?: Record<string, any>) => {
      const searchParams = new URLSearchParams({ q, ...params });
      return fetchAPI<any>(`/search?${searchParams.toString()}`);
    },
    getRecent: async () => fetchAPI<any>('/search/recent'),
    saveRecent: async (query: string) => fetchAPI<any>('/search/recent', { method: 'POST', body: JSON.stringify({ query }) }),
  },

  // --- Notifications ---
  notifications: {
    list: async (params?: Record<string, any>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return fetchAPI<any>(`/notifications${query}`);
    },
    getUnreadCount: async () => fetchAPI<any>('/notifications/unread-count'),
    markAsRead: async (id: string) => fetchAPI<any>(`/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' }),
    markAllAsRead: async () => fetchAPI<any>('/notifications/mark-all-read', { method: 'POST' }),
    delete: async (id: string) => fetchAPI<any>(`/notifications/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    getPreferences: async () => fetchAPI<any>('/notifications/preferences'),
    updatePreferences: async (data: Record<string, any>) => fetchAPI<any>('/notifications/preferences', { method: 'PATCH', body: JSON.stringify(data) }),
  },

  // --- Custom Dashboards ---
  dashboards: {
    list: async () => fetchAPI<any>('/dashboards'),
    get: async (id: string) => fetchAPI<any>(`/dashboards/${encodeURIComponent(id)}`),
    create: async (data: Record<string, any>) => fetchAPI<any>('/dashboards', { method: 'POST', body: JSON.stringify(data) }),
    update: async (id: string, data: Record<string, any>) => fetchAPI<any>(`/dashboards/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: async (id: string) => fetchAPI<any>(`/dashboards/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    addWidget: async (id: string, data: Record<string, any>) => fetchAPI<any>(`/dashboards/${encodeURIComponent(id)}/widgets`, { method: 'POST', body: JSON.stringify(data) }),
    updateWidget: async (id: string, widgetId: string, data: Record<string, any>) => fetchAPI<any>(`/dashboards/${encodeURIComponent(id)}/widgets/${encodeURIComponent(widgetId)}`, { method: 'PATCH', body: JSON.stringify(data) }),
    removeWidget: async (id: string, widgetId: string) => fetchAPI<any>(`/dashboards/${encodeURIComponent(id)}/widgets/${encodeURIComponent(widgetId)}`, { method: 'DELETE' }),
    getTemplates: async () => fetchAPI<any>('/dashboards/templates'),
    clone: async (id: string) => fetchAPI<any>(`/dashboards/${encodeURIComponent(id)}/clone`, { method: 'POST' }),
  },

  // --- Report Builder ---
  reports: {
    list: async () => fetchAPI<any>('/reports'),
    get: async (id: string) => fetchAPI<any>(`/reports/${encodeURIComponent(id)}`),
    create: async (data: Record<string, any>) => fetchAPI<any>('/reports', { method: 'POST', body: JSON.stringify(data) }),
    update: async (id: string, data: Record<string, any>) => fetchAPI<any>(`/reports/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: async (id: string) => fetchAPI<any>(`/reports/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    generate: async (id: string) => fetchAPI<any>(`/reports/${encodeURIComponent(id)}/generate`, { method: 'POST' }),
    getLibrary: async () => fetchAPI<any>('/reports/library'),
  },

  // --- Bulk Operations ---
  bulk: {
    update: async (data: Record<string, any>) => fetchAPI<any>('/bulk/update', { method: 'POST', body: JSON.stringify(data) }),
    export: async (data: Record<string, any>) => fetchAPI<any>('/bulk/export', { method: 'POST', body: JSON.stringify(data) }),
    delete: async (data: Record<string, any>) => fetchAPI<any>('/bulk/delete', { method: 'POST', body: JSON.stringify(data) }),
    assign: async (data: Record<string, any>) => fetchAPI<any>('/bulk/assign', { method: 'POST', body: JSON.stringify(data) }),
  },

  // --- Ticketing Integrations ---
  ticketing: {
    getConfig: async () => fetchAPI<any>('/ticketing/config'),
    saveConfig: async (data: Record<string, any>) => fetchAPI<any>('/ticketing/config', { method: 'POST', body: JSON.stringify(data) }),
    deleteConfig: async (provider?: string) => fetchAPI<any>(`/ticketing/config${provider ? '?provider=' + encodeURIComponent(provider) : ''}`, { method: 'DELETE' }),
    testConnection: async (data?: Record<string, any>) => fetchAPI<any>('/ticketing/test', { method: 'POST', body: JSON.stringify(data || {}) }),
    sync: async (data?: Record<string, any>) => fetchAPI<any>('/ticketing/sync', { method: 'POST', body: JSON.stringify(data || {}) }),
    createTicket: async (data: Record<string, any>) => fetchAPI<any>('/ticketing/create-ticket', { method: 'POST', body: JSON.stringify(data) }),
    listTickets: async (params?: Record<string, any>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return fetchAPI<any>(`/ticketing/tickets${query}`);
    },
    listConnections: async () => fetchAPI<any>('/ticketing/connections'),
    createConnection: async (data: Record<string, any>) => fetchAPI<any>('/ticketing/connections', { method: 'POST', body: JSON.stringify(data) }),
    deleteConnection: async (id: string) => fetchAPI<any>(`/ticketing/connections/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    testConnectionById: async (id: string) => fetchAPI<any>(`/ticketing/connections/${encodeURIComponent(id)}/test`, { method: 'POST' }),
    getTicket: async (id: string) => fetchAPI<any>(`/ticketing/tickets/${encodeURIComponent(id)}`),
    syncTicket: async (id: string) => fetchAPI<any>(`/ticketing/tickets/${encodeURIComponent(id)}/sync`, { method: 'PATCH' }),
    bulkSync: async (data?: Record<string, any>) => fetchAPI<any>('/ticketing/tickets/bulk-sync', { method: 'POST', body: JSON.stringify(data || {}) }),
    getFieldMapping: async (provider: string) => fetchAPI<any>(`/ticketing/field-mapping/${encodeURIComponent(provider)}`),
    updateFieldMapping: async (provider: string, data: Record<string, any>) => fetchAPI<any>(`/ticketing/field-mapping/${encodeURIComponent(provider)}`, { method: 'PUT', body: JSON.stringify(data) }),
    getSyncStatus: async (provider: string) => fetchAPI<any>(`/ticketing/sync-status?provider=${encodeURIComponent(provider)}`),
  },

  // (workflows already defined above — see "Workflow Builder" section)

  nps: {
    getActive: async () => fetchAPI<any>('/nps/active'),
    submitResponse: async (data: { invitationId?: string; score: number; comment?: string; source?: 'in_app' | 'email' | 'api' }) =>
      fetchAPI<any>('/nps/responses', { method: 'POST', body: JSON.stringify(data) }),
    dismissInvitation: async (id: string) =>
      fetchAPI<any>(`/nps/invitations/${encodeURIComponent(id)}/dismiss`, { method: 'POST' }),
    snoozeInvitation: async (id: string, untilDays: number) =>
      fetchAPI<any>(`/nps/invitations/${encodeURIComponent(id)}/snooze`, { method: 'POST', body: JSON.stringify({ untilDays }) }),
    listResponses: async (params?: { category?: string; since?: string; until?: string; take?: number; skip?: number }) => {
      const query = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
      return fetchAPI<any[]>(`/nps/responses${query}`);
    },
    getStats: async (params?: { periodStart?: string; periodEnd?: string }) => {
      const query = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
      return fetchAPI<any>(`/nps/stats${query}`);
    },
    scheduleInvitation: async (data: { userId: string; trigger: string; scheduledFor?: string; ttlDays?: number; cooldownDays?: number }) =>
      fetchAPI<any>('/nps/invitations', { method: 'POST', body: JSON.stringify(data) }),
    processDueInvitations: async () => fetchAPI<any>('/nps/invitations/process-due', { method: 'POST' }),
  },
};

// Export helper functions
export { getAuthToken, setAuthToken, clearAuthToken };
