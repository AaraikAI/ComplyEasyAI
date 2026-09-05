import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        FormData: 'readonly',
        File: 'readonly',
        Blob: 'readonly',
        AbortController: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        crypto: 'readonly',
        performance: 'readonly',
        structuredClone: 'readonly',
        queueMicrotask: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        EventSource: 'readonly',
        WebSocket: 'readonly',
        HTMLElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLTextAreaElement: 'readonly',
        HTMLSelectElement: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLFormElement: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLCanvasElement: 'readonly',
        HTMLVideoElement: 'readonly',
        HTMLAudioElement: 'readonly',
        HTMLImageElement: 'readonly',
        SVGSVGElement: 'readonly',
        MouseEvent: 'readonly',
        KeyboardEvent: 'readonly',
        Event: 'readonly',
        CustomEvent: 'readonly',
        MediaRecorder: 'readonly',
        MediaStream: 'readonly',
        AudioContext: 'readonly',
        IntersectionObserver: 'readonly',
        ResizeObserver: 'readonly',
        MutationObserver: 'readonly',
        DOMParser: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        Headers: 'readonly',
        ReadableStream: 'readonly',
        WritableStream: 'readonly',
        TransformStream: 'readonly',
        ImportMeta: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        prompt: 'readonly',
        atob: 'readonly',
        btoa: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        global: 'readonly',
        NodeJS: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react': reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      // TypeScript
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off',

      // React
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Security
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',

      // Code quality
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-alert': 'warn',
      'eqeqeq': ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'warn',

      // Allow empty catch blocks with a comment
      'no-empty': ['error', { allowEmptyCatch: true }],

      // Disable rules that conflict with TypeScript
      'no-undef': 'off',
      'no-redeclare': 'off',
    },
    settings: {
      react: { version: 'detect' },
    },
  },
  {
    // Build/SEO scripts run under Node (sitemap, prerender, JSON-LD validation).
    // prerender.mjs additionally references browser globals inside the
    // page.evaluate() callbacks it injects into the headless browser.
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        // browser globals (used only inside page.evaluate callbacks)
        window: 'readonly',
        document: 'readonly',
      },
    },
  },
  {
    // CloudFront Function sources (infrastructure/cloudfront). `handler` is the
    // runtime entry point — CloudFront calls it, nothing imports it — and
    // __PRERENDERED_ROUTES__ is substituted at build/synth time (the .rendered.js
    // copy carries the object literal). A `/* global */` directive cannot be used
    // in the source: it would be substituted too.
    files: ['infrastructure/cloudfront/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'script',
      globals: { __PRERENDERED_ROUTES__: 'readonly' },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^handler$' }],
    },
  },
  {
    ignores: [
      'node_modules/**',
      // Compiled CDK output (gitignored; only ever present after a local `tsc` in infrastructure/).
      'infrastructure/dist/**',
      'infrastructure/cdk.out/**',
      'dist/**',
      'build/**',
      'server/**',
      'coverage/**',
      '.claude/**',
      'mobile/**/*.js',
      'e2e/**',
      '**/*.config.js',
      '**/*.config.ts',
      '**/*.config.mjs',
      '**/*.setup.js',
      'test_*.js',
    ],
  },
];
