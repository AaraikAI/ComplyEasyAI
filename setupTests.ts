import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

// Global fetch mock to prevent real network calls during tests
globalThis.fetch = vi.fn().mockImplementation((url: string) => {
  console.warn(`Test attempted to fetch: ${url} - returning mock response`);
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
