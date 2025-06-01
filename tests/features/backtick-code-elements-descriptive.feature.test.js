// @ts-check

"use strict";

/**
 * @feature
 * Scenario: Descriptive text about code elements should not be flagged
 * When documentation describes code elements in a list or explanation
 * Then those mentions should not be flagged as requiring backticks
 */

const backtickCodeElements = require('../../rules/backtick-code-elements');
const { testRule } = require('../helpers/test-helpers');

describe('Feature: backtick-code-elements - descriptive text exclusions', () => {
  /**
   * @test Descriptive bullet points about filenames should be excluded
   * @tag feature
   */
  test('test_descriptive_bullet_points_about_filenames_not_flagged', (done) => {
    const testCases = [
      {
        markdown: '- Detects filenames (e.g., `example.js`)',
        expected: 0  // Should not flag "filenames" as needing backticks
      }
    ];
    testRule(backtickCodeElements, testCases, done);
  });

  /**
   * @test Descriptive bullet points about directory paths should be excluded
   * @tag feature
   */
  test('test_descriptive_bullet_points_about_directory_paths_not_flagged', (done) => {
    const testCases = [
      {
        markdown: '- Detects directory paths (e.g., `src/components/`)',
        expected: 0  // Should not flag "directory paths" as needing backticks
      }
    ];
    testRule(backtickCodeElements, testCases, done);
  });

  /**
   * @test Descriptive bullet points about code keywords should be excluded
   * @tag feature
   */
  test('test_descriptive_bullet_points_about_code_keywords_not_flagged', (done) => {
    const testCases = [
      {
        markdown: '- Detects code keywords (e.g., `function`, `const`, `import`)',
        expected: 0  // Should not flag "code keywords" as needing backticks
      }
    ];
    testRule(backtickCodeElements, testCases, done);
  });

  /**
   * @test Descriptive bullet points with markdown links should be excluded
   * @tag feature
   */
  test('test_descriptive_bullet_points_with_markdown_links_not_flagged', (done) => {
    const testCases = [
      {
        markdown: '- [`markdownlint-absolute.js`](./markdownlint-absolute.js): Like `markdownlint.js`, but uses absolute paths for custom rules—helpful if your config is loaded from outside the package root.',
        expected: 0 // Should not flag any part of this line
      }
    ];
    testRule(backtickCodeElements, testCases, done);
  });

  /**
   * @test Descriptive sentences with code element definitions should be excluded
   * @tag feature
   */
  test('test_descriptive_sentences_with_code_definitions_not_flagged', (done) => {
    const testCases = [
      {
        markdown: '`function`: The rule implementation function',
        expected: 0  // Should not flag "function" in the explanation
      }
    ];
    testRule(backtickCodeElements, testCases, done);
  });

  /**
   * @test Descriptive sentences with bold text and code elements should be excluded
   * @tag feature
   */
  test('test_descriptive_sentences_with_bold_text_and_code_elements_not_flagged', (done) => {
    const testCases = [
      {
        markdown: 'This paragraph has **bold text in sentence case** and `code` elements.',
        expected: 0  // Should not flag "elements" as needing backticks
      }
    ];
    testRule(backtickCodeElements, testCases, done);
  });
});
