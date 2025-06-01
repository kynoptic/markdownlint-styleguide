// @ts-check

"use strict";

/**
 * @feature
 * Scenario: Sentence case violations should be flagged
 * When markdown contains headings or text in ALL CAPS or Title Case
 * Then these should be flagged as sentence case violations
 */

const { lintMarkdown } = require('../helpers/test-helpers');

describe('Feature: sentence-case - detection of case violations', () => {
  /**
   * @test ALL CAPS heading should be flagged as a violation
   * @tag feature
   */
  test('test_all_caps_heading_is_flagged', async () => {
    const md = '#### ALL CAPS IS NOT SENTENCE CASE';
    const result = await lintMarkdown(md);
    // This should fail until the rule is fixed
    expect(result).toContain('sentence-case');
  });

  /**
   * @test Title Case heading should be flagged as a violation
   * @tag feature
   */
  test('test_title_case_heading_is_flagged', async () => {
    const md = '**Example With Title Case**';
    const result = await lintMarkdown(md);
    expect(result).toContain('sentence-case');
  });

  /**
   * @test Bold ALL CAPS text should be flagged as a violation
   * @tag feature
   */
  test('test_bold_all_caps_is_flagged', async () => {
    const md = '**BOLD ALL CAPS**';
    const result = await lintMarkdown(md);
    expect(result).toContain('sentence-case');
  });

  /**
   * @test Paragraph with bold Title Case and unwrapped keyword should be flagged
   * @tag feature
   */
  test('test_paragraph_with_bold_title_case_and_unwrapped_keyword_is_flagged', async () => {
    const md = 'This paragraph has **Bold Text In Title Case** and unwrapped function keyword.';
    const result = await lintMarkdown(md);
    expect(result).toContain('sentence-case');
  });
});
