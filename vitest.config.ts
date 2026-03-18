import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './setupTests.ts',
    css: true,
    // Optimize test execution
    pool: 'threads',
    // Test timeout
    testTimeout: 10000,
    hookTimeout: 10000,
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        'server/',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/*.config.{ts,js}',
        'setupTests.ts',
        'index.tsx',
        'App.tsx',
        'vite.config.ts',
      ],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
    // Include patterns
    include: ['**/*.{test,spec}.{ts,tsx}'],
    // Exclude patterns
    exclude: ['node_modules', 'dist', 'server', 'mobile', '.git', '.next', 'e2e', '.claude'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
