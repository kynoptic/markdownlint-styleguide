/**
 * @feature False Positive Regression Corpus
 *
 * Permanent regression fixtures derived from the external false-positive audit.
 * The audit surfaced ~95 FP instances across the custom rules. Each FP class is
 * captured here so future rule changes cannot silently reintroduce it.
 *
 * Every class has two assertions:
 *   - the false-positive fixture must report zero errors
 *   - a true-positive counterpart must still fire, proving the rule is not muted
 *
 * FP classes (from the audit, see #238 and #235/#232/#233/#234/#236/#237):
 *   slug, code-context, hyphenated headings, all-caps alphanumerics,
 *   dotted tokens, URL-as-path, prose homographs.
 */
import { lint } from 'markdownlint/promise';
import sentenceCaseHeading from '../../src/rules/sentence-case-heading.js';
import backtickCodeElements from '../../src/rules/backtick-code-elements.js';
import noDeadInternalLinks from '../../src/rules/no-dead-internal-links.js';

/**
 * Lint a Markdown string with a single custom rule.
 * @param {string} content - Markdown content to lint.
 * @param {object} rule - The custom rule to apply.
 * @param {object} [config] - Optional rule configuration.
 * @returns {Promise<object[]>} Array of lint errors for the content.
 */
async function lintWithRule(content, rule, config = {}) {
  const result = await lint({
    strings: { test: content },
    config: {
      default: false,
      [rule.names[0]]: config
    },
    customRules: [rule]
  });
  return result.test || [];
}

describe('FP regression corpus - sentence-case-heading (SC001)', () => {
  describe('hyphenated headings', () => {
    test('should not flag a hyphenated compound in a sentence-case heading', async () => {
      const content = '## Built-in helpers';
      const errors = await lintWithRule(content, sentenceCaseHeading);
      expect(errors).toHaveLength(0);
    });

    test('should still flag a title-case hyphenated heading', async () => {
      const content = '## Built-In Helpers And Tools';
      const errors = await lintWithRule(content, sentenceCaseHeading);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('all-caps alphanumerics', () => {
    test('should not flag alphanumeric acronyms like HTTP2 and OAuth2', async () => {
      const content = '## Using HTTP2 and OAuth2';
      const errors = await lintWithRule(content, sentenceCaseHeading);
      expect(errors).toHaveLength(0);
    });

    test('should still flag a genuine title-case heading containing an acronym', async () => {
      const content = '## Using The HTTP Protocol Today';
      const errors = await lintWithRule(content, sentenceCaseHeading);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('dotted tokens', () => {
    test('should not flag dotted identifiers like Node.js and package.json', async () => {
      const content = '## Using Node.js and package.json';
      const errors = await lintWithRule(content, sentenceCaseHeading);
      expect(errors).toHaveLength(0);
    });

    test('should still flag a title-case heading without dotted tokens', async () => {
      const content = '## Configuring The Build System Settings';
      const errors = await lintWithRule(content, sentenceCaseHeading);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});

describe('FP regression corpus - backtick-code-elements (BCE001)', () => {
  describe('URL-as-path', () => {
    test('should not backtick a bare URL that resembles a file path', async () => {
      const content = 'Visit https://example.com/path/to/page for info.';
      const errors = await lintWithRule(content, backtickCodeElements);
      expect(errors).toHaveLength(0);
    });

    test('should still backtick a genuine file path in prose', async () => {
      const content = 'Edit the src/index.js file here.';
      const errors = await lintWithRule(content, backtickCodeElements);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('prose homographs', () => {
    test('should not backtick a code-keyword used as an ordinary verb', async () => {
      const content = 'You can import data from the file.';
      const errors = await lintWithRule(content, backtickCodeElements);
      expect(errors).toHaveLength(0);
    });

    test('should still backtick a genuine function-call token', async () => {
      const content = 'Call the getUserData() function now.';
      const errors = await lintWithRule(content, backtickCodeElements);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});

describe('FP regression corpus - no-dead-internal-links (DL001)', () => {
  describe('GitHub-style slug anchors', () => {
    test('should not flag a slug anchor that matches a heading', async () => {
      const content = '[link](#my-section-heading)\n\n## My section heading';
      const errors = await lintWithRule(content, noDeadInternalLinks);
      expect(errors).toHaveLength(0);
    });

    test('should still flag a slug anchor with no matching heading', async () => {
      const content = '[link](#nonexistent-anchor)\n\n## My section heading';
      const errors = await lintWithRule(content, noDeadInternalLinks);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('code-context links', () => {
    test('should not flag a broken link inside a fenced code block', async () => {
      const content = '```\n[x](./missing.md)\n```';
      const errors = await lintWithRule(content, noDeadInternalLinks);
      expect(errors).toHaveLength(0);
    });

    test('should still flag a broken link in ordinary prose', async () => {
      const content = '[x](./definitely-missing-file.md)';
      const errors = await lintWithRule(content, noDeadInternalLinks);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
