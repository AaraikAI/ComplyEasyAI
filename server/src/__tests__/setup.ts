/**
 * Jest Test Setup
 * Global configuration and mocks for all tests
 */

import { jest } from '@jest/globals';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars!!!';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.GEMINI_API_KEY = 'test-gemini-key';
process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
process.env.SENDGRID_API_KEY = 'SG.test';

// Increase timeout for async operations
jest.setTimeout(30000);

// Global beforeAll
beforeAll(async () => {
  // Any global setup
});

// Global afterAll
afterAll(async () => {
  // Any global cleanup
});

// Global beforeEach
beforeEach(() => {
  jest.clearAllMocks();
});

// Global afterEach
afterEach(() => {
  jest.restoreAllMocks();
});

// Console error suppression for expected errors in tests
const originalError = console.error;
console.error = (...args: unknown[]) => {
  // Suppress specific expected error messages during tests
  const suppressedMessages = [
    'Expected error in test',
    'Test error',
  ];

  const message = args[0]?.toString() || '';
  if (suppressedMessages.some(msg => message.includes(msg))) {
    return;
  }
  originalError.apply(console, args);
};
