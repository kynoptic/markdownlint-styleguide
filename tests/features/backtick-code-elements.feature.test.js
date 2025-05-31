// @feature
// Scenario: Mixed content line with correct filename, unwrapped directory path
// The rule should flag the unwrapped directory path even if filename is correct.

const backtickCodeElements = require('../../rules/backtick-code-elements');
const { testRule } = require('../helpers/test-helpers');

describe('Feature: backtick-code-elements - mixed content', () => {
  test('flags unwrapped directory path when filename is correct', (done) => {
    const testCases = [
      {
        markdown: 'The file `README.md` is correct, but src/components should be wrapped.',
        expected: 1, // Should flag the unwrapped directory path
        lineNumbers: [1]
      }
    ];
    testRule(backtickCodeElements, testCases, done);
  });

  test('flags unwrapped code keywords after wrapped filename', (done) => {
    const testCases = [
      {
        markdown: 'This paragraph has `example.js` (correct) but also has function and const keywords that should be wrapped.',
        expected: 2, // Should flag both 'function' and 'const'
        lineNumbers: [1, 1]
      }
    ];
    testRule(backtickCodeElements, testCases, done);
  });
});
