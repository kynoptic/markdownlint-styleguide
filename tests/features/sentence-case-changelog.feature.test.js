// @ts-check

"use strict";

/**
 * @feature
 * Scenario: Version numbers in CHANGELOG.md should not be flagged as sentence case violations
 * When CHANGELOG.md contains version numbers in backticks and brackets
 * Then these should not be flagged as sentence case violations
 */

const { lintMarkdown } = require('../helpers/test-helpers');

describe('Feature: sentence-case - CHANGELOG version numbers', () => {
  /**
   * @test Version number in backticks and brackets should not be flagged
   * @tag feature
   */
  test('test_version_number_in_backticks_and_brackets_not_flagged', async () => {
    const md = '## [`0.2.1`] - 2025-05-31';
    const result = await lintMarkdown(md);
    // This should pass when the rule is fixed
    expect(result).not.toContain('sentence-case');
  });

  /**
   * @test Version number without backticks should not be flagged
   * @tag feature
   */
  test('test_version_number_without_backticks_not_flagged', async () => {
    const md = '## [0.2.1] - 2025-05-31';
    const result = await lintMarkdown(md);
    expect(result).not.toContain('sentence-case');
  });

  /**
   * @test Version number in different format should not be flagged
   * @tag feature
   */
  test('test_version_number_in_different_format_not_flagged', async () => {
    const md = '## [v1.0.0] - 2025-05-31';
    const result = await lintMarkdown(md);
    expect(result).not.toContain('sentence-case');
  });

  /**
   * @test Regular title case heading should still be flagged
   * @tag feature
   */
  test('test_regular_title_case_heading_still_flagged', async () => {
    const md = '## This Is Title Case';
    const result = await lintMarkdown(md);
    expect(result).toContain('sentence-case');
  });
});
