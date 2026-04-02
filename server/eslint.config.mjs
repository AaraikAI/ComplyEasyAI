import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        // Node.js globals
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        global: 'readonly',
        NodeJS: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setImmediate: 'readonly',
        clearImmediate: 'readonly',
        queueMicrotask: 'readonly',
        structuredClone: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        AbortController: 'readonly',
        AbortSignal: 'readonly',
        fetch: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        Headers: 'readonly',
        FormData: 'readonly',
        File: 'readonly',
        Blob: 'readonly',
        ReadableStream: 'readonly',
        WritableStream: 'readonly',
        TransformStream: 'readonly',
        crypto: 'readonly',
        performance: 'readonly',
        atob: 'readonly',
        btoa: 'readonly',
        Event: 'readonly',
        EventTarget: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // TypeScript
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off',

      // Security
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',

      // Code quality
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'eqeqeq': ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'warn',

      // Allow empty catch blocks with a comment
      'no-empty': ['error', { allowEmptyCatch: true }],

      // Disable rules that conflict with TypeScript
      'no-undef': 'off',
      'no-redeclare': 'off',
    },
  },
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'src/generated/**',
      '__tests__/**',
      'jest.config.js',
      '*.config.js',
      '*.config.ts',
      '*.config.mjs',
    ],
  },
];
