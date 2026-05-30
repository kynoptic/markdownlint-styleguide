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
    '/.markdownlint-rules/',
    '/.claude/worktrees/',
    // Wall-clock benchmarks run only via the isolated single-worker config
    // (npm run test:performance / jest.config.performance.mjs). In this default
    // parallel suite they share the CPU with every other worker, which inflates
    // their timing measurements past the thresholds and flakes the pre-push gate.
    '/tests/performance/',
  ],
};
