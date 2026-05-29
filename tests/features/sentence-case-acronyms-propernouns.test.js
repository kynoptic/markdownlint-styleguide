// @ts-check

/**
 * Feature tests for the SC001 specialTerms redesign (issue #233).
 *
 * Splits the single overloaded "specialTerms" concept into:
 * - acronyms: must be uppercase (the lowercase/mixed form is flagged)
 * - properNouns: the capitalized form is allowed, but the lowercase
 *   common-word homograph is NOT flagged
 *
 * "specialTerms" is retained as a deprecated alias for properNouns so that
 * existing configurations keep working.
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

describe('SC001 properNouns (issue #233)', () => {
  test('test_should_allow_capitalized_proper_noun_when_configured', async () => {
    const violations = await lintMarkdown('# Craft tasks', { properNouns: ['Craft'] });
    expect(violations).toHaveLength(0);
  });

  test('test_should_not_flag_lowercase_homograph_when_proper_noun_configured', async () => {
    const violations = await lintMarkdown('# Word craft basics', { properNouns: ['Craft'] });
    expect(violations).toHaveLength(0);
  });

  test('test_should_allow_proper_noun_mid_heading_in_either_case', async () => {
    const lower = await lintMarkdown('# A node in the graph', { properNouns: ['Node'] });
    const upper = await lintMarkdown('# Working with Node', { properNouns: ['Node'] });
    expect(lower).toHaveLength(0);
    expect(upper).toHaveLength(0);
  });
});

describe('SC001 acronyms (issue #233)', () => {
  test('test_should_flag_lowercase_acronym_to_uppercase', async () => {
    const violations = await lintMarkdown('# Mapping cefr levels', { acronyms: ['CEFR'] });
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].errorDetail).toMatch(/CEFR/);
  });

  test('test_should_allow_uppercase_acronym_when_configured', async () => {
    const violations = await lintMarkdown('# Mapping CEFR levels', { acronyms: ['CEFR'] });
    expect(violations).toHaveLength(0);
  });

  test('test_should_flag_lowercase_multiletter_acronym', async () => {
    const violations = await lintMarkdown('# A wysiwyg editor', { acronyms: ['WYSIWYG'] });
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].errorDetail).toMatch(/WYSIWYG/);
  });
});

describe('SC001 specialTerms deprecated alias (issue #233)', () => {
  test('test_should_treat_special_terms_as_proper_nouns_allowing_capitalized', async () => {
    const violations = await lintMarkdown('# Acme widget overview', { specialTerms: ['Acme'] });
    expect(violations).toHaveLength(0);
  });

  test('test_should_not_flag_lowercase_homograph_via_special_terms_alias', async () => {
    const violations = await lintMarkdown('# Working on a foobar', { specialTerms: ['Foobar'] });
    expect(violations).toHaveLength(0);
  });
});
