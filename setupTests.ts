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

// Mock Recharts to avoid rendering complex SVG in JSDOM
vi.mock('recharts', async () => {
  const actual = await vi.importActual('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: any) => React.createElement('div', { className: "recharts-responsive-container" }, children),
  };
});
