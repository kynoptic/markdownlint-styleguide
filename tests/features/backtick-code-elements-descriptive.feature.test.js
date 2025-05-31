// @ts-check

"use strict";

/**
 * @feature
 * Scenario: Descriptive text about code elements should not be flagged
 * When documentation describes code elements in a list or explanation
 * Then those mentions should not be flagged as requiring backticks
 */

const backtickCodeElements = require('../../rules/backtick-code-elements');
const { testRule } = require('../helpers/test-helpers');

describe('Feature: backtick-code-elements - descriptive text exclusions', () => {
  test('should not flag descriptive bullet points about code elements', (done) => {
    const testCases = [
      {
        markdown: '- Detects filenames (e.g., `example.js`)',
        expected: 0  // Should not flag "filenames" as needing backticks
      },
      {
        markdown: '- Detects directory paths (e.g., `src/components/`)',
        expected: 0  // Should not flag "directory paths" as needing backticks
      },
      {
        markdown: '- Detects code keywords (e.g., `function`, `const`, `import`)',
        expected: 0  // Should not flag "code keywords" as needing backticks
      }
    ];
    testRule(backtickCodeElements, testCases, done);
  });

  test('should not flag descriptive sentences about code elements', (done) => {
    const testCases = [
      {
        markdown: '`function`: The rule implementation function',
        expected: 0  // Should not flag "function" in the explanation
      },
      {
        markdown: 'This paragraph has **bold text in sentence case** and `code` elements.',
        expected: 0  // Should not flag "elements" as needing backticks
      }
    ];
    testRule(backtickCodeElements, testCases, done);
  });
});
