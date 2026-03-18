/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.spec.ts',
  ],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json',
      isolatedModules: true, // Faster compilation
      diagnostics: {
        ignoreCodes: [151001], // Ignore isolatedModules warning
      },
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/index.ts',
    '!src/**/__tests__/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testTimeout: 30000,
  verbose: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  // Optimize test execution
  maxWorkers: '50%', // Use 50% of available CPUs for parallelization
  maxConcurrency: 5, // Limit concurrent test suites
  // Memory optimization
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  // Isolate tests to prevent memory leaks
  testEnvironmentOptions: {
    NODE_OPTIONS: '--max-old-space-size=4096',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^uuid$': '<rootDir>/src/__tests__/mocks/uuid.ts',
  },
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'reports',
      outputName: 'junit.xml',
    }],
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(uuid)/)',
  ],
  // Optimize module resolution
  moduleDirectories: ['node_modules', '<rootDir>'],
  // Reduce memory usage by limiting worker processes
  workerIdleMemoryLimit: '500MB',
};
