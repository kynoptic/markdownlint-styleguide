/**
 * @fileoverview Regression tests for issues #342 and #343 — destructive SC001 autofix.
 *
 * #342: the casing exemption for code identifiers (camelCase, PascalCase,
 * snake_case) was consulted by the validator but not by the fix builder, the
 * leading-emoji first-word path, or the bold-text subsequent-word path, so
 * `--fix` lowercased identifiers such as `useEffect` into `useeffect`.
 *
 * #343: the fix builder's own placeholder mechanism (`__P_<n>__`) was mangled by
 * the sentence-case transform, so the case-sensitive restore step missed it and
 * the placeholder was written into the document.
 */

import { describe, test, expect } from '@jest/globals';
import { lint } from 'markdownlint/promise';
import { applyFixes } from 'markdownlint';
import sentenceRule from '../../src/rules/sentence-case-heading.js';
import { toSentenceCase } from '../../src/rules/sentence-case/fix-builder.js';

/** Pattern matching the fix builder's internal placeholder in any casing. */
const PLACEHOLDER_PATTERN = /__p_\d+__/i;

/**
 * Lint one line with SC001 and return its violations.
 * @param {string} content - Markdown line to lint.
 * @returns {Promise<Array<object>>} Violations reported for the line.
 */
async function violations(content) {
  const result = await lint({
    strings: { t: `${content}\n` },
    customRules: [sentenceRule],
    config: { default: false, 'sentence-case-heading': true },
    resultVersion: 3
  });
  return result.t || [];
}

/**
 * Lint one line with SC001 in fix mode and return the autofixed text.
 * @param {string} content - Markdown line to lint and fix.
 * @returns {Promise<string>} The line after applying SC001 fixes.
 */
async function autofix(content) {
  const source = `${content}\n`;
  const result = await lint({
    strings: { t: source },
    customRules: [sentenceRule],
    config: { default: false, 'sentence-case-heading': true },
    resultVersion: 3,
    fix: true
  });
  return applyFixes(source, result.t || []).trimEnd();
}

describe('issue #342 — SC001 autofix must not lowercase code identifiers', () => {
  test('GIVEN a heading whose first word after a leading emoji is camelCase WHEN linted THEN the identifier is neither reported nor rewritten', async () => {
    const input = '## 🚀 useEffect setup';
    const found = await violations(input);
    expect(found).toEqual([]);
    expect(await autofix(input)).toBe(input);
  });

  test('GIVEN bold text with a camelCase word after the first WHEN linted THEN the identifier is neither reported nor rewritten', async () => {
    const input = '- **Configure useEffect**';
    const found = await violations(input);
    expect(found).toEqual([]);
    expect(await autofix(input)).toBe(input);
  });

  test('GIVEN a heading with a genuine casing violation beside a camelCase word WHEN autofixed THEN only the violation is corrected', async () => {
    const input = '## Configure useEffect Support';
    const found = await violations(input);
    expect(found).toHaveLength(1);
    expect(found[0].errorDetail).toBe('Word "Support" in heading should be lowercase.');
    expect(await autofix(input)).toBe('## Configure useEffect support');
  });

  test('GIVEN a bold camelCase identifier alone WHEN linted THEN no violation is reported', async () => {
    const input = '- **useEffect**';
    expect(await violations(input)).toEqual([]);
    expect(await autofix(input)).toBe(input);
  });

  test.each([
    ['## Configure HttpClient Support', '## Configure HttpClient support'],
    ['## Configure max_retries Support', '## Configure max_retries support'],
    ['## Configure user_name_id Support', '## Configure user_name_id support']
  ])('GIVEN %s WHEN autofixed THEN the identifier survives verbatim', async (input, expected) => {
    expect(await autofix(input)).toBe(expected);
  });

  test('GIVEN every SC001 fix builder entry point WHEN a fix is produced THEN it never alters an exempt identifier', async () => {
    const inputs = [
      '## 🚀 useEffect setup',
      '## Configure useEffect Support',
      '## useEffect Setup',
      '- **Configure useEffect**',
      '- **useEffect Setup**',
      '## Configure HttpClient Support',
      '## Set user_name_id Value'
    ];
    for (const input of inputs) {
      const output = await autofix(input);
      for (const identifier of ['useEffect', 'HttpClient', 'user_name_id']) {
        if (input.includes(identifier)) {
          expect(output).toContain(identifier);
        }
      }
    }
  });
});

describe('issue #343 — SC001 autofix must not write its own placeholders', () => {
  test('GIVEN a heading with internal underscores WHEN linted THEN the violation is reported without a corrupting fix', async () => {
    const input = '## This_is_a_sentence';
    const found = await violations(input);
    expect(found).toHaveLength(1);
    expect(found[0].errorDetail).toBe("Heading's first word should be capitalized.");
    expect(found[0].fixInfo).toBeFalsy();
    expect(await autofix(input)).toBe(input);
  });

  test.each([
    ['one internal underscore', 'This_sentence Thing'],
    ['two internal underscores', 'This_is_sentence Thing'],
    ['three internal underscores', 'This_is_a_sentence Thing'],
    ['four internal underscores', 'A_b_c_d_e Thing'],
    ['an asterisk pair', '(**Bold**) Thing'],
    ['a single asterisk pair', '(*em*) Thing'],
    ['an underscore pair inside parentheses', '(_em_) Thing']
  ])('GIVEN %s WHEN toSentenceCase runs THEN no placeholder leaks into the result', (_label, input) => {
    const output = toSentenceCase(input, {}, {});
    if (output !== null) {
      expect(output).not.toMatch(PLACEHOLDER_PATTERN);
    }
  });

  test.each([
    '## This_sentence Thing',
    '## This_is_sentence Thing',
    '## This_is_a_sentence Thing',
    '## A_b_c_d_e Thing',
    '## (**Bold**) Thing',
    '## (*em*) Thing',
    '## (_em_) Thing',
    '- **This_is_a_sentence Thing**'
  ])('GIVEN %s WHEN linted THEN no reported fixInfo carries a placeholder', async (input) => {
    for (const violation of await violations(input)) {
      if (violation.fixInfo?.insertText) {
        expect(violation.fixInfo.insertText).not.toMatch(PLACEHOLDER_PATTERN);
      }
    }
  });
});
