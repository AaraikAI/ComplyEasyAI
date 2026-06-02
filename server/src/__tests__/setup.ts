/**
 * Jest Test Setup
 * Global configuration and mocks for all tests
 * Optimized for memory efficiency and parallel execution
 */

import { jest } from '@jest/globals';

// Set test environment variables before any imports
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only-min-32-chars';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-purposes-only-min-32-chars';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars-minimum-length-required!!!';
process.env.ATTESTATION_SECRET = 'test-attestation-secret-for-sensor-data-attestation-32chars';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.GEMINI_API_KEY = 'test-gemini-key';
process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
process.env.SENDGRID_API_KEY = 'SG.test';
process.env.SENDGRID_FROM_EMAIL = 'test@complyeasy.ai';
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.LOG_LEVEL = 'error'; // Reduce logging in tests

// Increase timeout for async operations
jest.setTimeout(30000);

// Memory optimization: Clear module cache between test suites
let moduleCache: NodeJS.Module[] = [];

// Global beforeAll - Optimized setup
beforeAll(async () => {
  // Clear any existing timers
  jest.useFakeTimers();
  jest.useRealTimers();
  
  // Force garbage collection if available (Node.js with --expose-gc flag)
  if (global.gc) {
    global.gc();
  }
});

// Global afterAll - Optimized cleanup
afterAll(async () => {
  // Clear all timers
  jest.clearAllTimers();
  
  // Clear module cache to prevent memory leaks
  Object.keys(require.cache).forEach(key => {
    if (key.includes('__tests__') || key.includes('node_modules')) {
      // Keep test files and node_modules cached
      return;
    }
    delete require.cache[key];
  });
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
});

// Global beforeEach - Optimized per-test setup
beforeEach(() => {
  // Clear all mocks to prevent state leakage between tests
  jest.clearAllMocks();
  
  // Reset all timers
  jest.clearAllTimers();
});

// Global afterEach - Optimized per-test cleanup
afterEach(() => {
  // Restore all mocks
  jest.restoreAllMocks();
  
  // Clear any pending promises/timeouts (only if fake timers are active)
  if (jest.isMockFunction(setTimeout)) {
    jest.runOnlyPendingTimers();
  }
  
  // Clear any event listeners that might leak
  process.removeAllListeners('unhandledRejection');
  process.removeAllListeners('uncaughtException');
});

// Console error suppression for expected errors in tests
const originalError = console.error;
const originalWarn = console.warn;

console.error = (...args: unknown[]) => {
  // Suppress specific expected error messages during tests
  const suppressedMessages = [
    'Expected error in test',
    'Test error',
    'Warning: ReactDOM.render',
  ];

  const message = args[0]?.toString() || '';
  if (suppressedMessages.some(msg => message.includes(msg))) {
    return;
  }
  originalError.apply(console, args);
};

console.warn = (...args: unknown[]) => {
  // Suppress specific expected warnings during tests
  const suppressedMessages = [
    'Warning: ReactDOM.render',
    'DeprecationWarning',
  ];

  const message = args[0]?.toString() || '';
  if (suppressedMessages.some(msg => message.includes(msg))) {
    return;
  }
  originalWarn.apply(console, args);
};

// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  // Only log if it's not an expected test error
  if (reason && typeof reason === 'object' && 'message' in reason) {
    const message = (reason as Error).message;
    if (!message.includes('test') && !message.includes('Test')) {
      console.error('Unhandled Rejection in test:', reason);
    }
  }
});
