// @ts-check

"use strict";

/**
 * @feature
 * Scenario: Common abbreviations should not be flagged
 * When documentation contains common abbreviations like e.g., i.e.
 * Then these should not be flagged as requiring backticks
 */

const { lintMarkdown } = require('../helpers/test-helpers');

describe('Feature: backtick-code-elements - common abbreviations exclusions', () => {
  /**
   * @test Latin abbreviation e.g. should not be flagged
   */
  test('test_common_abbreviation_eg_not_flagged', async () => {
    const md = 'Common programming languages (e.g., JavaScript, Python) are supported.';
    const result = await lintMarkdown(md);
    expect(result).not.toContain('backtick-code-elements');
  });

  /**
   * @test Latin abbreviation i.e. should not be flagged
   */
  test('test_common_abbreviation_ie_not_flagged', async () => {
    const md = 'Use statically typed languages (i.e., TypeScript) for better tooling.';
    const result = await lintMarkdown(md);
    expect(result).not.toContain('backtick-code-elements');
  });

  /**
   * @test Code elements near abbreviations should still be flagged
   */
  test('test_code_elements_near_abbreviations_still_flagged', async () => {
    const md = 'Use statically typed languages (e.g., TypeScript) with the function keyword.';
    const result = await lintMarkdown(md);
    expect(result).toContain('backtick-code-elements');
  });

  /**
   * @test Abbreviations with code elements in parentheses should not flag the abbreviation
   */
  test('test_abbreviations_with_code_in_parentheses', async () => {
    const md = 'Common keywords (e.g., function, const, let) should be wrapped in backticks.';
    const result = await lintMarkdown(md);
    // The abbreviation "e.g." should not be flagged
    const resultString = result.join('\n');
    expect(resultString).not.toContain('e.g.');
    // But the code elements should be flagged
    expect(result).toContain('backtick-code-elements');
  });
});
