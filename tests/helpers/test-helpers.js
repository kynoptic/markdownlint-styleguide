// @ts-check

"use strict";

/**
 * Test helpers for markdownlint custom rules
 *
 * @module test-helpers
 */

/**
 * @typedef {import('../../types').CustomRule} CustomRule
 */

const markdownlint = require("markdownlint");

/**
 * Test a markdownlint rule against a set of test cases
 * 
 * @param {CustomRule} rule - The rule to test
 * @param {Array<{markdown: string, expected: number, lineNumbers?: number[]}>} testCases - Test cases to run
 * @param {Function} done - Jest done callback
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
            reject(err);
            return;
          }
          
          try {
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
          } catch (error) {
            // Catch test assertion failures and reject the promise
            reject(error);
          }
        });
      }
    );
  });

  // Make sure to call done() even if tests fail
  Promise.all(promises)
    .then(() => done())
    .catch((error) => {
      // Ensure done is called with the error to properly fail the test
      done(error);
    });
}

/**
 * Lints a markdown string using all custom rules, returns triggered rule names.
 * @param {string} markdown - Markdown content to lint
 * @returns {Promise<string[]>} - Array of triggered rule names
 */
async function lintMarkdown(markdown) {
  /** @type {CustomRule} */
  const sentenceCaseRule = require('../../rules/sentence-case');
  /** @type {CustomRule} */
  const backtickCodeElementsRule = require('../../rules/backtick-code-elements');
  
  // Import helpers directly to ensure they're properly loaded
  const { DEFAULT_OPTIONS } = require('../../rules/helpers/backtick-code-elements-helpers');
  
  // Configure options with all custom rules
  const options = {
    strings: { input: markdown },
    config: { 
      'sentence-case': true,
      'backtick-code-elements': {
        // Explicitly include default options to ensure abbreviation detection works
        commonDocPhrasesRegex: DEFAULT_OPTIONS.commonDocPhrasesRegex
      }
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
