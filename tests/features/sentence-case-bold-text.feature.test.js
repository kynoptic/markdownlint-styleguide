// @ts-check

"use strict";

/**
 * @feature
 * Scenario: Bold text sentence case violations should be properly detected
 * When markdown contains bold text with title case or ALL CAPS
 * Then the rule should flag these as sentence case violations
 * When bold text within paragraphs is in sentence case
 * Then the rule should not flag these as violations
 */

const { lintMarkdown } = require('../helpers/test-helpers');

describe('Feature: sentence-case - bold text detection', () => {
  /**
   * @test Bold text with title case should be flagged as a violation
   * @tag feature
   */
  test('test_bold_text_with_title_case_is_flagged', async () => {
    const md = '**Example With Title Case**';
    const result = await lintMarkdown(md);
    expect(result).toContain('sentence-case');
  });

  /**
   * @test Bold ALL CAPS text should be flagged as a violation
   * @tag feature
   */
  test('test_bold_text_with_all_caps_is_flagged', async () => {
    const md = '**BOLD ALL CAPS**';
    const result = await lintMarkdown(md);
    expect(result).toContain('sentence-case');
  });

  /**
   * @test Bold text in sentence case within paragraph should not be flagged
   * @tag feature
   */
  test('test_bold_text_in_sentence_case_within_paragraph_not_flagged', async () => {
    const md = 'This paragraph has **bold text in sentence case** and `code` elements.';
    const result = await lintMarkdown(md);
    expect(result).not.toContain('sentence-case');
  });

  /**
   * @test Bold text with title case within paragraph should still be flagged
   * @tag feature
   */
  test('test_bold_text_with_title_case_within_paragraph_still_flagged', async () => {
    const md = 'This paragraph has **Bold Text In Title Case** and unwrapped function keyword.';
    const result = await lintMarkdown(md);
    expect(result).toContain('sentence-case');
  });
});
