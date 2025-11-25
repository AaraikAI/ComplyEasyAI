
import '@testing-library/jest-dom';
import React from 'react';

declare const jest: any;

// Mock the Google GenAI SDK to prevent actual API calls during tests
jest.mock('@google/genai', () => {
  return {
    GoogleGenAI: jest.fn().mockImplementation(() => ({
      models: {
        generateContent: jest.fn().mockResolvedValue({
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
jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: any) => React.createElement('div', { className: "recharts-responsive-container" }, children),
  };
});
