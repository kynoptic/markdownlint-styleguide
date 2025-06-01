// @ts-check

"use strict";

/**
 * @feature
 * Scenario: Common phrases with code elements should not be flagged
 * When documentation contains common technical phrases like npm, yarn, git
 * Then these should not be flagged as requiring backticks
 */

const { lintMarkdown } = require('../helpers/test-helpers');

describe('Feature: backtick-code-elements - common phrases exclusions', () => {
  /**
   * @test Package manager references in installation instructions should be excluded
   */
  test('test_common_phrases_package_manager_in_instructions_not_flagged', async () => {
    const md = 'You can install using npm or yarn.';
    const result = await lintMarkdown(md);
    expect(result).not.toContain('backtick-code-elements');
  });

  /**
   * @test Package manager references in bullet points should be excluded
   */
  test('test_common_phrases_package_manager_in_bullets_not_flagged', async () => {
    const md = '- Install dependencies using npm or yarn.';
    const result = await lintMarkdown(md);
    expect(result).not.toContain('backtick-code-elements');
  });

  /**
   * @test Package manager references in npm package context should be excluded
   */
  test('test_common_phrases_npm_package_context_not_flagged', async () => {
    const md = 'This is available as an npm package.';
    const result = await lintMarkdown(md);
    expect(result).not.toContain('backtick-code-elements');
  });

  /**
   * @test Git references in common contexts should be excluded
   */
  test('test_common_phrases_git_references_not_flagged', async () => {
    const md = 'Clone the repository using git.';
    const result = await lintMarkdown(md);
    expect(result).not.toContain('backtick-code-elements');
  });

  /**
   * @test Code elements outside common phrases should still be flagged
   */
  test('test_common_phrases_other_code_elements_still_flagged', async () => {
    const md = 'Use function to declare a function.';
    const result = await lintMarkdown(md);
    expect(result).toContain('backtick-code-elements');
  });
});
