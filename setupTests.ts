import '@testing-library/jest-dom';
import { vi, beforeAll, afterEach, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import React from 'react';

// Suppress React act() warnings and other test-specific console output
const originalError = console.error;
const originalWarn = console.warn;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const message = args[0]?.toString() || '';
    // Suppress act() warnings and other known test warnings
    if (
      message.includes('not wrapped in act') ||
      message.includes('Warning: ReactDOM.render') ||
      message.includes('Warning: An update to') ||
      message.includes('inside a test was not wrapped in act') ||
      message.includes('Failed to load') ||
      message.includes('AI Error')
    ) {
      return;
    }
    originalError.apply(console, args);
  };
  console.warn = (...args: unknown[]) => {
    const message = args[0]?.toString() || '';
    if (message.includes('Failed to load')) {
      return;
    }
    originalWarn.apply(console, args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Clean up after each test to prevent state leakage
afterEach(() => {
  cleanup();
});

// Global fetch mock to prevent real network calls during tests
globalThis.fetch = vi.fn().mockImplementation((url: string) => {
  // Silently return mock response without console warning
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve([]),
    text: () => Promise.resolve(''),
    headers: new Headers(),
  });
}) as unknown as typeof fetch;

// Mock the Google GenAI SDK to prevent actual API calls during tests
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: vi.fn().mockResolvedValue({
          text: 'Mocked AI Response'
        })
      }
    })),
    Type: {
        OBJECT: 'OBJECT',
        STRING: 'STRING',
        INTEGER: 'INTEGER',
        ARRAY: 'ARRAY'
    }
  };
});

// Helper to create a mock icon component
const mockIcon = (name: string) => {
  const Icon = React.forwardRef((props: any, ref: any) =>
    React.createElement('span', { 'data-testid': `icon-${name}`, ref, ...props })
  );
  Icon.displayName = name;
  return Icon;
};

// Cache for Proxy-generated mock icons so the same reference is returned each time
const _iconCache: Record<string, any> = {};

// Mock lucide-react globally using a Proxy so ANY icon export is auto-generated.
// This prevents tests from failing when new icons are added to components.
vi.mock('lucide-react', () => {
  return new Proxy({}, {
    get(_target, prop: string) {
      // Special Proxy traps that should not return an icon
      if (prop === '__esModule') return true;
      if (prop === 'default') return undefined;
      if (typeof prop === 'symbol') return undefined;
      if (!_iconCache[prop]) {
        _iconCache[prop] = mockIcon(prop);
      }
      return _iconCache[prop];
    },
    has() {
      return true;
    },
  });
});

// Mock react-markdown globally
vi.mock('react-markdown', () => ({
  default: ({ children }: any) => React.createElement('div', { 'data-testid': 'markdown' }, children),
}));

// Mock dompurify globally
vi.mock('dompurify', () => ({
  default: { sanitize: (s: string) => s },
}));

// Mock sonner globally to prevent toast errors
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
    promise: vi.fn(),
    custom: vi.fn(),
    message: vi.fn(),
  }),
  Toaster: () => null,
}));

// Load English translations for the I18n mock so that t() returns real English text
 
import _enTranslations from './i18n/locales/en.json';
const _enDict: Record<string, unknown> = _enTranslations as any;

function _resolveI18nKey(dict: Record<string, unknown>, key: string): string | undefined {
  const parts = key.split('.');
  let current: unknown = dict;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : undefined;
}

function _mockT(key: string, vars?: Record<string, string | number>): string {
  const resolved = _resolveI18nKey(_enDict, key) || key;
  if (!vars) return resolved;
  return resolved.replace(/\{\{(\w+)\}\}/g, (_, varName: string) => {
    const value = vars[varName];
    return value !== undefined ? String(value) : `{{${varName}}}`;
  });
}

// Mock I18nContext globally so components using useI18n don't crash
vi.mock('@/contexts/I18nContext', () => ({
  I18nProvider: ({ children }: any) => children,
  useI18n: vi.fn().mockReturnValue({
    t: _mockT,
    locale: 'en',
    setLocale: vi.fn().mockResolvedValue(undefined),
    availableLocales: [{ code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' }],
    isLoading: false,
  }),
  I18nContext: {
    Provider: ({ children }: any) => children,
    Consumer: ({ children }: any) => children({}),
  },
}));

// Mock AuthContext globally so components using useAuth don't crash
vi.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: any) => children,
  useAuth: vi.fn().mockReturnValue({
    user: {
      id: 'test-user-1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'admin',
      organizationId: 'org-1',
      organization: { id: 'org-1', name: 'Test Org', plan: 'Growth' },
    },
    isAuthenticated: true,
    isLoading: false,
    loginWithMagicLink: vi.fn().mockResolvedValue({ message: 'ok', email: 'test@example.com' }),
    verifyMagicLink: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn(),
    register: vi.fn().mockResolvedValue({}),
  }),
}));

// Mock react-router-dom globally so components using Link, useNavigate etc. don't crash
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn().mockReturnValue(vi.fn()),
    useLocation: vi.fn().mockReturnValue({ pathname: '/', search: '', hash: '', state: null }),
    useParams: vi.fn().mockReturnValue({}),
    useSearchParams: vi.fn().mockReturnValue([new URLSearchParams(), vi.fn()]),
    Link: ({ children, to, ...props }: any) => React.createElement('a', { href: to, ...props }, children),
    NavLink: ({ children, to, ...props }: any) => React.createElement('a', { href: to, ...props }, children),
    BrowserRouter: ({ children }: any) => children,
    MemoryRouter: ({ children }: any) => children,
    Routes: ({ children }: any) => children,
    Route: () => null,
    Outlet: () => null,
  };
});

// Mock ThemeContext globally so components using useTheme don't crash
vi.mock('@/contexts/ThemeContext', () => ({
  ThemeProvider: ({ children }: any) => children,
  useTheme: vi.fn().mockReturnValue({
    theme: 'light',
    resolvedTheme: 'light',
    setTheme: vi.fn(),
    toggleTheme: vi.fn(),
  }),
}));

// Mock WebSocketContext globally so components using useWebSocket don't crash
vi.mock('@/contexts/WebSocketContext', () => ({
  WebSocketProvider: ({ children }: any) => children,
  useWebSocket: vi.fn().mockReturnValue({
    isConnected: false,
    lastMessage: null,
    sendMessage: vi.fn(),
    subscribe: vi.fn().mockReturnValue(vi.fn()),
    connectionState: 'disconnected',
  }),
}));

// Mock OnboardingContext globally so components don't crash without provider
vi.mock('@/contexts/OnboardingContext', () => ({
  OnboardingProvider: ({ children }: any) => children,
  useOnboardingContext: vi.fn().mockReturnValue({
    isOnboarding: false,
    currentFlow: null,
    currentStep: 0,
    isLoaded: true,
    progress: null,
    organizationPlan: 'Growth',
    organizationName: 'Test Org',
    showCelebration: false,
    celebrationMessage: '',
    startFlow: vi.fn(),
    nextStep: vi.fn(),
    prevStep: vi.fn(),
    skipFlow: vi.fn(),
    completeFlow: vi.fn(),
    triggerCelebration: vi.fn(),
    dismissCelebration: vi.fn(),
    shouldShowFlow: vi.fn().mockReturnValue(false),
    updatePreferences: vi.fn(),
  }),
}));

// Mock useOnboarding hooks globally
vi.mock('@/hooks/useOnboarding', () => ({
  useOnboarding: vi.fn().mockReturnValue({
    isOnboarding: false,
    currentFlow: null,
    currentStep: 0,
    progress: { reducedMotion: false },
    organizationPlan: 'Growth',
    organizationName: 'Test Org',
    nextStep: vi.fn(),
    prevStep: vi.fn(),
    skipFlow: vi.fn(),
    completeFlow: vi.fn(),
    updatePreferences: vi.fn(),
    showCelebration: false,
    celebrationMessage: '',
    dismissCelebration: vi.fn(),
  }),
  useOnboardingFlow: vi.fn().mockReturnValue({ isActive: false, currentStep: 0, canShow: false, start: vi.fn(), next: vi.fn(), prev: vi.fn(), skip: vi.fn(), complete: vi.fn() }),
  useOnboardingTrigger: vi.fn(),
  useOnboardingHint: vi.fn().mockReturnValue({ isVisible: false, position: null, dismiss: vi.fn(), disableAllHints: vi.fn() }),
  useOnboardingChecklist: vi.fn().mockReturnValue({ items: [], completedCount: 0, totalCount: 0, percentage: 0, isComplete: false, startFlowForItem: vi.fn() }),
  useConfetti: vi.fn().mockReturnValue({ trigger: vi.fn(), dismiss: vi.fn(), isShowing: false, message: '' }),
}));

// Add scrollIntoView mock for jsdom
Element.prototype.scrollIntoView = vi.fn();

// Mock Recharts to avoid rendering complex SVG in JSDOM
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => React.createElement('div', { className: "recharts-responsive-container" }, children),
  AreaChart: ({ children }: any) => React.createElement('div', null, children),
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  PieChart: ({ children }: any) => React.createElement('div', null, children),
  Pie: () => null,
  Cell: () => null,
  BarChart: ({ children }: any) => React.createElement('div', null, children),
  Bar: () => null,
  LineChart: ({ children }: any) => React.createElement('div', null, children),
  Line: () => null,
  RadialBarChart: ({ children }: any) => React.createElement('div', null, children),
  RadialBar: () => null,
  RadarChart: ({ children }: any) => React.createElement('div', null, children),
  Radar: () => null,
  PolarGrid: () => null,
  PolarAngleAxis: () => null,
  PolarRadiusAxis: () => null,
  ComposedChart: ({ children }: any) => React.createElement('div', null, children),
  Scatter: () => null,
  Treemap: () => null,
  FunnelChart: ({ children }: any) => React.createElement('div', null, children),
  Funnel: () => null,
}));
