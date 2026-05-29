// @ts-check

/**
 * Feature tests for residual SC001 false positives (issue #233, Part B).
 *
 * Two gaps remained after the earlier false-positive pass:
 * 1. The "should not be in all caps" check did not exempt digit-bearing
 *    tokens, so units/versions like "25KB", "BCE-500", and "PM2" were flagged.
 * 2. The whole-hyphenated-token special-term match was only applied on the
 *    heading path, so bold text still flagged hyphenated proper-noun and
 *    acronym segments (e.g. "Anglo-Saxon" -> "Saxon").
 */

import { describe, test, expect } from '@jest/globals';
import { lint } from 'markdownlint/promise';
import sentenceRule from '../../src/rules/sentence-case-heading.js';

/**
 * Lint markdown content with the SC001 rule and a given config.
 * @param {string} content Markdown content to lint.
 * @param {Object} config sentence-case-heading configuration.
 * @returns {Promise<object[]>} SC001 violations with fixInfo (actual errors).
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
      (v.ruleNames.includes('sentence-case-heading') ||
        v.ruleNames.includes('SC001')) &&
      v.fixInfo != null
  );
}

describe('SC001 all-caps check exempts digit-bearing tokens (issue #233 Part B.1)', () => {
  test('test_should_not_flag_size_token_in_bold', async () => {
    const violations = await lintMarkdown('- **Under 200 lines and ~25KB** total');
    expect(violations).toHaveLength(0);
  });

  test('test_should_not_flag_era_range_token_in_bold', async () => {
    const violations = await lintMarkdown('- **Ancient history 3000 BCE-500 era** notes');
    expect(violations).toHaveLength(0);
  });

  test('test_should_not_flag_versioned_product_token_in_bold', async () => {
    const violations = await lintMarkdown('- **Running under PM2** for resilience');
    expect(violations).toHaveLength(0);
  });

  test('test_should_still_flag_genuine_all_caps_word_in_bold', async () => {
    const violations = await lintMarkdown('- **Common PATTERNS reference** here');
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].errorDetail).toMatch(/all caps|lowercase/i);
  });
});

describe('SC001 hyphenated special-term match in bold text (issue #233 Part B.2)', () => {
  test('test_should_not_flag_hyphenated_proper_noun_segment_in_bold', async () => {
    const violations = await lintMarkdown('- **Latinate to Anglo-Saxon** shift', {
      properNouns: ['Anglo-Saxon']
    });
    expect(violations).toHaveLength(0);
  });

  test('test_should_not_flag_acronym_prefixed_hyphen_compound_in_bold', async () => {
    const violations = await lintMarkdown('- **Targeting high-CEFR readers** first', {
      acronyms: ['CEFR']
    });
    expect(violations).toHaveLength(0);
  });

  test('test_should_not_flag_acronym_first_hyphen_compound_in_bold', async () => {
    const violations = await lintMarkdown('- **A FAQ-shaped article** layout', {
      acronyms: ['FAQ']
    });
    expect(violations).toHaveLength(0);
  });

  test('test_should_not_flag_acronym_wide_hyphen_compound_in_bold', async () => {
    const violations = await lintMarkdown('- **An API-wide convention** applies', {
      acronyms: ['API']
    });
    expect(violations).toHaveLength(0);
  });

  test('test_should_still_flag_genuine_capitalized_hyphen_segment_in_bold', async () => {
    const violations = await lintMarkdown('- **A Bad-Word example** here');
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].errorDetail).toMatch(/lowercase/i);
  });
});
