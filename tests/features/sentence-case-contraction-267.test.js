// @ts-check

/**
 * Feature tests for SC001 contraction false positive (issue #267).
 *
 * A correctly sentence-cased first word such as "Don't" was falsely flagged
 * as needing capitalization when a *later* word in the same heading or bold
 * span was also a contraction (e.g. "it's"). The two apostrophes were paired
 * by the single-quote segment-preservation step, so "Don't ... it's" had its
 * middle preserved and the first token became a mangled "Don__PRESERVED_0__s".
 *
 * The trigger is the later apostrophe word, not the first word: the identical
 * input without the later contraction is clean. Affects both the ATX-heading
 * path and the bold-in-list-item path.
 */

import { describe, test, expect } from '@jest/globals';
import { lint } from 'markdownlint/promise';
import sentenceRule from '../../src/rules/sentence-case-heading.js';

/**
 * Lint markdown content with the SC001 rule and a given config.
 * @param {string} content Markdown content to lint.
 * @param {Object} config sentence-case-heading configuration.
 * @returns {Promise<object[]>} All SC001 violations. The first-word false
 *   positive is reported without fixInfo, so violations are not filtered on it.
 */
async function lintMarkdown(content, config = {}) {
  const options = {
    customRules: [sentenceRule],
    strings: { testContent: content },
    config: {
      default: false,
      'sentence-case-heading': config
    },
    resultVersion: 3
  };
  const results = await lint(options);
  return (results.testContent || []).filter(
    (v) =>
      v.ruleNames.includes('sentence-case-heading') ||
      v.ruleNames.includes('SC001')
  );
}

describe('SC001 contraction false positive (issue #267)', () => {
  test('test_should_not_flag_first_contraction_when_later_word_is_contraction_in_heading', async () => {
    const violations = await lintMarkdown('## Don\'t consolidate if it\'s referenced');
    expect(violations).toHaveLength(0);
  });

  test('test_should_not_flag_first_contraction_when_later_word_is_contraction_in_bold', async () => {
    const violations = await lintMarkdown('- **Don\'t use it\'s thing.**');
    expect(violations).toHaveLength(0);
  });

  test('test_should_stay_clean_for_single_contraction_heading', async () => {
    const violations = await lintMarkdown('## Don\'t go there');
    expect(violations).toHaveLength(0);
  });

  test('test_should_stay_clean_for_heading_without_later_contraction', async () => {
    const violations = await lintMarkdown('## Don\'t consolidate if it referenced');
    expect(violations).toHaveLength(0);
  });

  test('test_should_not_flag_multiple_later_contractions', async () => {
    const violations = await lintMarkdown("## Don't worry if it's there and we'll fix it");
    expect(violations).toHaveLength(0);
  });

  test('test_should_still_preserve_genuine_single_quoted_string', async () => {
    // A genuinely single-quoted phrase keeps its interior casing preserved, so
    // the capitalized word inside is not flagged as a lowercase violation.
    const violations = await lintMarkdown("## Running 'I need Playwright' locally");
    expect(violations).toHaveLength(0);
  });

  test('test_should_preserve_single_quoted_phrase_with_interior_contraction', async () => {
    // A genuine quoted phrase that itself contains a contraction is preserved as
    // one segment — the boundary-anchored quote pair still wins over the interior
    // apostrophe, so "I" inside the quote is not flagged.
    const violations = await lintMarkdown("## Running 'I don't know' locally");
    expect(violations).toHaveLength(0);
  });

  test('test_should_stay_clean_for_possessive_plural', async () => {
    const violations = await lintMarkdown("## The kids' toys are here");
    expect(violations).toHaveLength(0);
  });

  test('test_should_stay_clean_for_possessive_then_contraction', async () => {
    const violations = await lintMarkdown("## Patel's review of it's usage");
    expect(violations).toHaveLength(0);
  });
});
