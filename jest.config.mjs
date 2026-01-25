// @ts-check

/**
 * Jest configuration for ES Modules.
 * @type {import('@jest/types').Config.InitialOptions}
 */
export default {
  // Use babel-jest for transforming JavaScript files.
  // This ensures that modern JavaScript syntax (like import/export, async/await) is transpiled.
  transform: {
    '^.+\\.js$': 'babel-jest',
  },

  // The test environment that will be used for testing. 'node' is suitable for most Node.js projects.
  testEnvironment: 'node',

  // Exclude cloned validation repos and other temporary directories
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.tmp/',
    '/.test-dist/',
  ],
};