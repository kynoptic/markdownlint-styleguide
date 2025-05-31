// @ts-check

"use strict";

/**
 * Test helpers for markdownlint custom rules
 *
 * @module test-helpers
 */

const markdownlint = require("markdownlint");

/**
 * Tests a rule against a set of test cases
 *
 * @param {Object} rule - The rule module to test
 * @param {Array<Object>} testCases - Array of test cases
 * @param {Function} done - Jest done callback
 * @returns {Promise<void>}
 */
function testRule(rule, testCases, done) {
  // Process each test case
  const promises = testCases.map((testCase) => {
    const options = {
      strings: {
        testCase: testCase.markdown,
      },
      config: {
        default: false, // Disable all default rules
      },
      customRules: [rule],
    };

    // Enable the rule being tested
    options.config[rule.names[0]] = true;

    return new Promise(
      /** @type {(resolve: (value?: void) => void, reject: (reason?: any) => void) => void} */ (resolve, reject) => {
        markdownlint(options, (err, result) => {
          if (err) {
            throw err;
          }
          const violations = result?.testCase || [];

          if (testCase.expected === 0) {
            // Should have no violations
            expect(violations).toHaveLength(0);
          } else {
            // Should have expected number of violations
            expect(violations).toHaveLength(testCase.expected);

            // If line numbers are specified, check them
            if (testCase.lineNumbers) {
              const actualLineNumbers = violations.map((v) => v.lineNumber);
              expect(actualLineNumbers.sort()).toEqual(
                testCase.lineNumbers.sort()
              );
            }
          }
          resolve();
        });
      }
    );
  });

  return Promise.all(promises).then(() => done());
}

/**
 * Lints a markdown string using all custom rules, returns triggered rule names.
 * @param {string} markdown - Markdown content to lint
 * @returns {Promise<string[]>} - Array of triggered rule names
 */
async function lintMarkdown(markdown) {
  const sentenceCaseRule = require('../../rules/sentence-case');
  const backtickCodeElementsRule = require('../../rules/backtick-code-elements');
  // Configure options with all custom rules
  const options = {
    strings: { input: markdown },
    config: { 
      'sentence-case': true,
      'backtick-code-elements': true
    },
    customRules: [sentenceCaseRule, backtickCodeElementsRule],
  };
  const result = await markdownlint.promises.markdownlint(options);
  // result is a MarkdownLintResults object: { input: [ { lineNumber, ruleNames, ruleDescription, ... } ] }
  const violations = result.input || [];
  // Flatten all rule names triggered
  return violations.flatMap(v => v.ruleNames);
}

module.exports = {
  testRule,
  lintMarkdown,
};
