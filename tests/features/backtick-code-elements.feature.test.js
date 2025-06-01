// @ts-check

"use strict";

/**
 * @feature
 * Scenario: Mixed content line with correct filename, unwrapped directory path
 * When a line contains both properly wrapped and unwrapped code elements
 * Then the rule should flag only the unwrapped elements
 */

const backtickCodeElements = require('../../rules/backtick-code-elements');
const { testRule } = require('../helpers/test-helpers');

describe('Feature: backtick-code-elements - mixed content', () => {
  /**
   * @test Unwrapped directory path should be flagged even when filename is properly wrapped
   * @tag feature
   */
  test('test_mixed_content_flags_unwrapped_directory_path_with_correct_filename', (done) => {
    const testCases = [
      {
        markdown: 'The file `README.md` is correct, but src/components should be wrapped.',
        expected: 1, // Should flag the unwrapped directory path
        lineNumbers: [1]
      }
    ];
    testRule(backtickCodeElements, testCases, done);
  });

  /**
   * @test Unwrapped function keyword should be flagged in mixed content
   * @tag feature
   */
  test('test_mixed_content_flags_unwrapped_function_keyword', (done) => {
    const testCases = [
      {
        markdown: 'This paragraph has `example.js` (correct) but also has function keyword that should be wrapped.',
        expected: 1, // Should flag 'function'
        lineNumbers: [1]
      }
    ];
    testRule(backtickCodeElements, testCases, done);
  });

  /**
   * @test Unwrapped const keyword should be flagged in mixed content
   * @tag feature
   */
  test('test_mixed_content_flags_unwrapped_const_keyword', (done) => {
    const testCases = [
      {
        markdown: 'This paragraph has `example.js` (correct) but also has const keyword that should be wrapped.',
        expected: 1, // Should flag 'const'
        lineNumbers: [1]
      }
    ];
    testRule(backtickCodeElements, testCases, done);
  });

  /**
   * @test Multiple unwrapped keywords should be flagged in mixed content
   * @tag feature
   */
  test('test_mixed_content_flags_multiple_unwrapped_keywords', (done) => {
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
