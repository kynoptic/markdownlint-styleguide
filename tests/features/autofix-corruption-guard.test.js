/**
 * @fileoverview Regression tests for issue #234 — autofix corruption guard.
 * BCE001 autofix must never insert a backtick inside a token, and must never
 * wrap a bare URL (scheme-prefixed or www.-prefixed) in a code span.
 */

import { describe, test, expect } from '@jest/globals';
import { lint } from 'markdownlint/promise';
import { applyFixes } from 'markdownlint';
import backtickRule from '../../src/rules/backtick-code-elements.js';
import { createSafeFixInfo } from '../../src/rules/autofix-safety.js';

/**
 * Lint a string with BCE001 in fix mode and return the autofixed text.
 * @param {string} content - Markdown to lint and fix.
 * @returns {Promise<string>} The content after applying BCE001 fixes.
 */
async function autofix(content) {
  const result = await lint({
    strings: { t: content },
    customRules: [backtickRule],
    config: { default: false, 'backtick-code-elements': true },
    resultVersion: 3,
    fix: true
  });
  const fixes = (result.t || []).filter((v) => v.ruleNames.includes('BCE001'));
  return applyFixes(content, fixes);
}

describe('issue #234 — autofix corruption guard', () => {
  test('GIVEN slash-and-apostrophe prose WHEN BCE001 autofix runs THEN no backtick is inserted inside any token', async () => {
    const input = "The sequence stop/don't/wait/wrong/undo/actually is prose.";
    const output = await autofix(input);
    expect(output).toBe(input);
    expect(output).not.toContain("'`");
    expect(output).not.toContain('`t/');
  });

  test('GIVEN a scheme-prefixed bare URL WHEN autofix runs THEN it is not wrapped in backticks', async () => {
    const input = 'Refer to https://example.com/path/to/page for details.';
    const output = await autofix(input);
    expect(output).toBe(input);
    expect(output).not.toContain('`http');
  });

  test('GIVEN a www-prefixed bare URL WHEN autofix runs THEN it is not wrapped in backticks', async () => {
    const input = 'See www.example.com/a/b for details.';
    const output = await autofix(input);
    expect(output).toBe(input);
    expect(output).not.toContain('`www');
  });

  describe('safety guard rejects intra-token and URL rewrites', () => {
    test('GIVEN a scheme-prefixed URL WHEN createSafeFixInfo runs THEN the fix is rejected', () => {
      const original = 'https://example.com/a/b';
      const result = createSafeFixInfo(
        { editColumn: 1, deleteCount: original.length, insertText: `\`${original}\`` },
        'backtick',
        original,
        `\`${original}\``,
        { type: 'code-element', line: `See ${original} now` }
      );
      expect(result).toBeNull();
    });

    test('GIVEN a www-prefixed bare URL WHEN createSafeFixInfo runs THEN the fix is rejected', () => {
      const original = 'www.example.com/a/b';
      const result = createSafeFixInfo(
        { editColumn: 1, deleteCount: original.length, insertText: `\`${original}\`` },
        'backtick',
        original,
        `\`${original}\``,
        { type: 'code-element', line: `See ${original} now` }
      );
      expect(result).toBeNull();
    });

    test('GIVEN a match that begins mid-token after an apostrophe WHEN createSafeFixInfo runs THEN the fix is rejected', () => {
      // Simulates a path pattern starting at "t/wait/..." inside "don't/wait/...".
      const original = 't/wait/wrong/undo/actually';
      const line = "The sequence stop/don't/wait/wrong/undo/actually is prose.";
      const result = createSafeFixInfo(
        { editColumn: 1, deleteCount: original.length, insertText: `\`${original}\`` },
        'backtick',
        original,
        `\`${original}\``,
        { type: 'code-element', line }
      );
      expect(result).toBeNull();
    });

    test('GIVEN a genuine file path WHEN createSafeFixInfo runs THEN the fix is allowed', () => {
      const original = 'src/index.js';
      const line = `Edit ${original} to change it.`;
      const result = createSafeFixInfo(
        { editColumn: 6, deleteCount: original.length, insertText: `\`${original}\`` },
        'backtick',
        original,
        `\`${original}\``,
        { type: 'code-element', line }
      );
      expect(result).not.toBeNull();
    });
  });
});
