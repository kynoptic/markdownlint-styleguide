// @ts-check

/**
 * Feature tests for SC001 first-word and compound-token edge cases (issue #245).
 *
 * A second consumer-corpus audit (after #233 and #235) surfaced remaining
 * false positives. Each heading/label below is correctly cased but was still
 * flagged. Every case must produce no SC001 error, and a paired true-positive
 * guard proves genuine violations still flag.
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

describe('SC001 hyphenated capitalized first word (issue #245)', () => {
  test('test_should_not_flag_proper_noun_hyphen_first_word_in_heading', async () => {
    const violations = await lintMarkdown('## Word-Markdown converter');
    expect(violations).toHaveLength(0);
  });

  test('test_should_not_flag_capitalized_hyphen_first_word_in_bold', async () => {
    const violations = await lintMarkdown('- **Non-Italian menus** are listed');
    expect(violations).toHaveLength(0);
  });

  test('test_should_still_flag_lowercase_first_word_in_heading', async () => {
    const violations = await lintMarkdown('## converter for documents');
    expect(violations.length).toBeGreaterThan(0);
  });
});

describe('SC001 all-caps single-term heading (issue #245)', () => {
  test('test_should_not_flag_acronym_only_heading_with_punctuation', async () => {
    const violations = await lintMarkdown('## TL;DR');
    expect(violations).toHaveLength(0);
  });

  test('test_should_still_flag_multi_word_all_caps_heading', async () => {
    const violations = await lintMarkdown('## THIS IS SHOUTING LOUDLY');
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].errorDetail).toMatch(/all caps/i);
  });
});

describe('SC001 hyphenated compound in subsequent heading words (issue #245)', () => {
  test('test_should_not_flag_acronym_segment_in_subsequent_hyphen_compound', async () => {
    const violations = await lintMarkdown('## Common high-CEFR words', {
      acronyms: ['CEFR']
    });
    expect(violations).toHaveLength(0);
  });

  test('test_should_not_flag_acronym_segment_when_replacing_vocabulary', async () => {
    const violations = await lintMarkdown('## Replace high-CEFR vocabulary', {
      acronyms: ['CEFR']
    });
    expect(violations).toHaveLength(0);
  });

  test('test_should_not_flag_default_acronym_segment_in_subsequent_compound', async () => {
    const violations = await lintMarkdown('## Extract issue-PR relationships');
    expect(violations).toHaveLength(0);
  });

  test('test_should_still_flag_capitalized_segment_in_subsequent_compound', async () => {
    const violations = await lintMarkdown('## Extract issue-Relationship maps');
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].errorDetail).toMatch(/lowercase/i);
  });
});

describe('SC001 contextualAllCaps not forced in ordinary prose (issue #245)', () => {
  test('test_should_not_flag_alert_keyword_in_lowercase_bold_prose', async () => {
    const violations = await lintMarkdown('- **Proceed with caution** when deleting');
    expect(violations).toHaveLength(0);
  });

  test('test_should_not_flag_other_alert_keywords_in_lowercase_bold_prose', async () => {
    const violations = await lintMarkdown('- **Read the note carefully** before warning users');
    expect(violations).toHaveLength(0);
  });

  test('test_should_still_flag_genuine_all_caps_in_bold_prose', async () => {
    const violations = await lintMarkdown('- **Common PATTERNS reference** here');
    expect(violations.length).toBeGreaterThan(0);
  });
});

describe('SC001 apostrophe first word (issue #245 reopen)', () => {
  test('test_should_not_flag_apostrophe_first_word_in_heading', async () => {
    const violations = await lintMarkdown("## Don't consolidate if it's referenced");
    expect(violations).toHaveLength(0);
  });

  test('test_should_not_flag_apostrophe_first_word_in_bold', async () => {
    const violations = await lintMarkdown("- **Don't use the delete command**");
    expect(violations).toHaveLength(0);
  });

  test('test_should_not_flag_curly_apostrophe_first_word_in_bold', async () => {
    const violations = await lintMarkdown('- **Don’t use the delete command**');
    expect(violations).toHaveLength(0);
  });

  test('test_should_still_flag_lowercase_apostrophe_first_word', async () => {
    const violations = await lintMarkdown("## don't consolidate the agents");
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].errorDetail).toMatch(/first word/i);
  });
});

describe('SC001 backticked code first word (issue #245 reopen)', () => {
  test('test_should_not_flag_backticked_code_first_word_in_heading', async () => {
    const violations = await lintMarkdown('## `.env.example` present and clean');
    expect(violations).toHaveLength(0);
  });

  test('test_should_not_flag_backticked_code_first_word_in_bold', async () => {
    const violations = await lintMarkdown('- **`.env.example` present and clean**');
    expect(violations).toHaveLength(0);
  });

  test('test_should_not_flag_backticked_code_first_word_in_numbered_list', async () => {
    const violations = await lintMarkdown('6. `.env.example` present and clean');
    expect(violations).toHaveLength(0);
  });

  test('test_should_still_flag_plain_lowercase_first_word_in_heading', async () => {
    const violations = await lintMarkdown('## converter for code files');
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].errorDetail).toMatch(/first word/i);
  });
});

describe('SC001 bracketed placeholder first word (issue #245 reopen)', () => {
  test('test_should_not_flag_bracketed_placeholder_first_word_in_heading', async () => {
    const violations = await lintMarkdown('## [Project Name] task report');
    expect(violations).toHaveLength(0);
  });

  test('test_should_not_flag_bracketed_placeholder_first_word_in_bold', async () => {
    const violations = await lintMarkdown('- **[Project Name] task report**');
    expect(violations).toHaveLength(0);
  });

  test('test_should_still_flag_plain_lowercase_first_word_without_bracket', async () => {
    const violations = await lintMarkdown('## converter handles the reports');
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].errorDetail).toMatch(/first word/i);
  });
});
