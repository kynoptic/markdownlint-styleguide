import fs from 'fs';

/**
 * Read a fixture file and gather expected passing and failing lines.
 *
 * @param {string} filePath - Absolute path to the fixture file.
 * @returns {{passingLines: number[], failingLines: number[]}} Line numbers grouped by outcome.
 */
export function parseFixture(filePath) {
  return fs
    .readFileSync(filePath, 'utf8')
    .split('\n')
    .reduce(
      (acc, line, index) => {
        if (line.includes('<!-- ✅ -->')) {
          acc.passingLines.push(index + 1);
        } else if (line.includes('<!-- ❌ -->')) {
          acc.failingLines.push(index + 1);
        }
        return acc;
      },
      { passingLines: [], failingLines: [] }
    );
}

// Compatibility export for legacy tests
export const getFixture = parseFixture;

// Export getPassAndFail for test compatibility
export function getPassAndFail(fixture) {
  // Example implementation: scan for special markers or use parseFixture
  // Here, we assume parseFixture returns { passingLines, failingLines }
  const { passingLines, failingLines } = parseFixture(fixture);
  return { pass: passingLines, fail: failingLines };
}

