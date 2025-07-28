// @ts-check

/**
 * Jest configuration for performance tests.
 * This configuration is used specifically for performance testing with additional Node.js flags.
 * @type {import('@jest/types').Config.InitialOptions}
 */
export default {
  // Use babel-jest for transforming JavaScript files
  transform: {
    '^.+\\.js$': 'babel-jest',
  },

  // The test environment that will be used for testing
  testEnvironment: 'node',

  // Only run performance tests
  testMatch: [
    '**/tests/integration/performance.test.js'
  ],

  // Increase timeout for performance tests
  testTimeout: 30000,

  // Disable coverage for performance tests
  collectCoverage: false,

  // Use single worker to get consistent performance measurements
  maxWorkers: 1,

  // Silent output except for console logs
  silent: false,

  // Global setup to detect if GC is available
  globals: {
    __PERFORMANCE_TEST__: true
  }
};