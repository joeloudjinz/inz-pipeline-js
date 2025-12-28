/**
 * Jest configuration for InzPipeline TypeScript library
 * 
 * This configuration sets up TypeScript compilation for tests,
 * proper module resolution, test environment, file patterns,
 * coverage reporting, and handles the project's specific needs
 * like async testing, cancellation support, etc.
 */

module.exports = {
  // Use TypeScript with ts-jest preset
  preset: 'ts-jest',
  
  // Test environment
  testEnvironment: 'node',
  
  // File patterns to look for tests
  testMatch: [
    '**/test/**/*.test.{ts,tsx,js,jsx}',
    '**/tests/**/*.test.{ts,tsx,js,jsx}',
    '**/__tests__/**/*.test.{ts,tsx,js,jsx}',
    '**/?(*.)+(spec|test).{ts,tsx,js,jsx}'
  ],
  
  // File patterns to ignore
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/\\.idea/',
    '/\\.git/',
  ],
  
  // Module file extensions
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
    'node'
  ],
  
  // Transform TypeScript files using ts-jest
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    '/node_modules/(?!@inquirer)/',
  ],
  
  // Setup files to run before each test
  setupFilesAfterEnv: [],
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/types/**/*',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'clover'
  ],
  // coverageThreshold: {
  //   global: {
  //     branches: 50,
  //     functions: 50,
  //     lines: 50,
  //     statements: 50
  //   }
  // },
  
  // Module name mapping for TypeScript path aliases (if any)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // Root directory for tests
  roots: [
    '<rootDir>'
  ],
  
  // Test timeout (in milliseconds) - higher for async operations
  testTimeout: 30000,
  
  // Setup files to run before each test suite
  setupFiles: [],
  
  // Global setup/teardown
  globalSetup: './test/setup.js',
  globalTeardown: './test/teardown.js',
  
  // Clear mocks before each test
  clearMocks: true,
  
  // Reset modules before each test
  resetModules: false,
  
  // Whether to run tests in watch mode
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
  ],
  
  // Verbose output
  verbose: true,
  
  // Detect open handles to help debug hanging tests
  detectOpenHandles: true,
  detectLeaks: false,
  
  // For async cancellation support testing
  testRunner: 'jest-circus/runner',
  
  // Reporters
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'coverage',
        outputName: 'junit.xml'
      }
    ]
  ],
};