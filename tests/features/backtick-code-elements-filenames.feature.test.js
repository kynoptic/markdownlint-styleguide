// @ts-check

"use strict";

/**
 * @feature
 * Scenario: Filenames in bullet points should not be flagged as unwrapped code elements
 * When documentation contains filenames in bullet points with proper backticks
 * Then these should not be flagged as requiring backticks
 */

const { lintMarkdown } = require('../helpers/test-helpers');

describe('Feature: backtick-code-elements - filenames in bullet points', () => {
  /**
   * @test Filename in bullet point with backticks should be properly handled
   * @tag feature
   */
  test('test_filenames_with_backticks_in_bullet_points_not_flagged', async () => {
    const md = '- Added `index.js` to allow usage as an npm package.';
    const result = await lintMarkdown(md);
    // This should pass when the rule is fixed
    expect(result).not.toContain('backtick-code-elements');
  });

  /**
   * @test Filename in bullet point without backticks should be flagged
   * @tag feature
   */
  test('test_filenames_without_backticks_in_bullet_points_flagged', async () => {
    const md = '- Added index.js to allow usage as an npm package.';
    const result = await lintMarkdown(md);
    expect(result).toContain('backtick-code-elements');
  });

  /**
   * @test Multiple filenames in bullet points with backticks should be properly handled
   * @tag feature
   */
  test('test_multiple_filenames_with_backticks_in_bullet_points_not_flagged', async () => {
    const md = '- Added `index.js`, `package.json`, and `README.md` to the repository.';
    const result = await lintMarkdown(md);
    expect(result).not.toContain('backtick-code-elements');
  });

  /**
   * @test Filename in bullet point with description should be properly handled
   * @tag feature
   */
  test('test_filenames_with_description_in_bullet_points_not_flagged', async () => {
    const md = '- Filename: `index.js` is the main entry point.';
    const result = await lintMarkdown(md);
    expect(result).not.toContain('backtick-code-elements');
  });
});
