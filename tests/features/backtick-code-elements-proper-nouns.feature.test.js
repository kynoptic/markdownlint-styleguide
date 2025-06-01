// @ts-check

"use strict";

/**
 * @feature
 * Scenario: Proper nouns with dot notation should not be flagged
 * When documentation contains proper nouns like Node.js, React.js
 * Then these should not be flagged as requiring backticks
 */

const { lintMarkdown } = require('../helpers/test-helpers');

describe('Feature: backtick-code-elements - proper nouns exclusions', () => {
  /**
   * @test Technology names with dot notation should not be flagged
   */
  test('test_proper_nouns_with_dot_notation_not_flagged', async () => {
    const md = 'You can use Node.js or React.js for this project.';
    const result = await lintMarkdown(md);
    expect(result).not.toContain('backtick-code-elements');
  });

  /**
   * @test Technology names in bullet points should not be flagged
   */
  test('test_proper_nouns_in_bullets_not_flagged', async () => {
    const md = '* **From JavaScript code (Node.js)**:';
    const result = await lintMarkdown(md);
    expect(result).not.toContain('backtick-code-elements');
  });

  /**
   * @test Common English words that match code keywords should not be flagged
   */
  test('test_common_english_words_not_flagged', async () => {
    const md = 'Data from the API is processed by the application.';
    const result = await lintMarkdown(md);
    expect(result).not.toContain('backtick-code-elements');
  });

  /**
   * @test Common English prepositions in natural sentences should not be flagged
   */
  test('test_english_prepositions_not_flagged', async () => {
    const md = 'VSCode automatically checks Markdown files as you type. It reads settings from `.vscode/settings.json`.';
    const result = await lintMarkdown(md);
    expect(result).not.toContain('backtick-code-elements');
  });
});
