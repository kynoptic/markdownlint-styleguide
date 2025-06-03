/**
 * Jest configuration for markdownlint-trap project
 *
 * @description Defines testing configuration for the project including
 * test environment, coverage thresholds, and file patterns to test
 */

module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  collectCoverage: true,
  coverageDirectory: "coverage",
  collectCoverageFrom: ["rules/**/*.js", "!**/node_modules/**"],
  // Coverage thresholds restored after improving test coverage for backtick-code-elements rule
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
