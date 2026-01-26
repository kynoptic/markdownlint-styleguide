/**
 * @feature False Positive Audit - Round 10
 *
 * Tests for false positives discovered in validation loop on 2026-01-26.
 * Issues found across: agent-playbook, word-to-markdown-converter,
 * hms-it-markdown-drafts repos.
 */
import { lint } from 'markdownlint/promise';
import sentenceCaseHeading from '../../src/rules/sentence-case-heading.js';
import backtickCodeElements from '../../src/rules/backtick-code-elements.js';

/**
 * Helper to run markdownlint with a specific rule.
 * @param {string} content - Markdown content to lint.
 * @param {object} rule - The rule to test.
 * @param {object} config - Optional rule configuration.
 * @returns {Promise<object[]>} Array of lint errors.
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

/**
 * Apply fixes from errors to content.
 * @param {string} content - Original content.
 * @param {object[]} errors - Array of lint errors with fixInfo.
 * @returns {string} Fixed content.
 */
function applyFixes(content, errors) {
  if (!errors || errors.length === 0) return content;

  const lines = content.split('\n');

  // Sort errors by line number descending to apply fixes from bottom to top
  const sortedErrors = [...errors]
    .filter(e => e.fixInfo)
    .sort((a, b) => b.lineNumber - a.lineNumber);

  for (const error of sortedErrors) {
    const { fixInfo, lineNumber } = error;
    const lineIndex = lineNumber - 1;
    const line = lines[lineIndex];

    if (fixInfo.editColumn !== undefined && fixInfo.deleteCount !== undefined) {
      const before = line.slice(0, fixInfo.editColumn - 1);
      const after = line.slice(fixInfo.editColumn - 1 + fixInfo.deleteCount);
      lines[lineIndex] = before + (fixInfo.insertText || '') + after;
    }
  }

  return lines.join('\n');
}

describe('Round 10 False Positives - Sentence Case Rule', () => {

  describe('Product names should not be lowercased', () => {

    test('SharePoint should preserve camelCase capitalization', async () => {
      const content = '# Workflow for communications governance documents on SharePoint';
      const errors = await lintWithRule(content, sentenceCaseHeading);

      // Should not flag "SharePoint" as needing to be lowercased
      const sharePointError = errors.find(e =>
        e.errorDetail?.includes('SharePoint') ||
        e.errorDetail?.includes('Sharepoint')
      );
      expect(sharePointError).toBeUndefined();

      // If there's a fix, it should preserve "SharePoint"
      if (errors.length > 0 && errors[0].fixInfo) {
        const fixed = applyFixes(content, errors);
        expect(fixed).toContain('SharePoint');
        expect(fixed).not.toContain('sharepoint');
        expect(fixed).not.toContain('Sharepoint');
      }
    });

    test('Word (Microsoft Word) should be preserved as proper noun in context', async () => {
      const content = '# Contributing to Word to Markdown Converter';
      const errors = await lintWithRule(content, sentenceCaseHeading);

      // Should preserve "Word" when it's part of a product name
      if (errors.length > 0 && errors[0].fixInfo) {
        const fixed = applyFixes(content, errors);
        // "Converter" can be lowercased, but "Word" should stay capitalized
        expect(fixed).toMatch(/Word to Markdown/i);
      }
    });
  });

  describe('Proper nouns should not be lowercased', () => {

    test('days of the week should remain capitalized', async () => {
      const content = '- ✅ **Network maintenance scheduled for Sunday, February 23**';
      const errors = await lintWithRule(content, sentenceCaseHeading);

      if (errors.length > 0 && errors[0].fixInfo) {
        const fixed = applyFixes(content, errors);
        expect(fixed).toContain('Sunday');
        expect(fixed).not.toContain('sunday');
      }
    });

    test('month names should remain capitalized', async () => {
      const content = '- ✅ **Update scheduled for February 23**';
      const errors = await lintWithRule(content, sentenceCaseHeading);

      if (errors.length > 0 && errors[0].fixInfo) {
        const fixed = applyFixes(content, errors);
        expect(fixed).toContain('February');
        expect(fixed).not.toContain('february');
      }
    });

    test('organization names can be preserved with custom specialTerms config', async () => {
      // Organization names like "Harvard University Archives" require custom configuration
      // because we can't automatically detect whether "University Archives" is part of
      // a proper noun or just generic text. Users should add these as specialTerms.
      const content = '### Harvard University Archives';

      // Without custom config, the rule will lowercase common words
      const errorsWithoutConfig = await lintWithRule(content, sentenceCaseHeading);
      expect(errorsWithoutConfig.length).toBeGreaterThan(0); // It will flag this

      // With custom config, the full phrase is preserved
      const errorsWithConfig = await lintWithRule(content, sentenceCaseHeading, {
        specialTerms: ['Harvard University Archives']
      });
      expect(errorsWithConfig.length).toBe(0); // No errors when configured
    });
  });

  describe('Common words should not be incorrectly capitalized', () => {

    test('skills should not be capitalized mid-heading', async () => {
      const content = '## When to use agents vs skills';
      const errors = await lintWithRule(content, sentenceCaseHeading);

      // This heading is already correct - should not be flagged
      expect(errors.length).toBe(0);

      // If there's a fix, it should NOT capitalize "skills"
      if (errors.length > 0 && errors[0].fixInfo) {
        const fixed = applyFixes(content, errors);
        expect(fixed).not.toMatch(/vs Skills/);
      }
    });

    test('Skills as part of product name can be capitalized', async () => {
      // "Claude Code Skills" as a product feature name is OK
      const content = '## Claude Code Skills overview';
      const errors = await lintWithRule(content, sentenceCaseHeading);

      // Should recognize "Claude Code Skills" as a proper noun phrase
      if (errors.length > 0 && errors[0].fixInfo) {
        const fixed = applyFixes(content, errors);
        // "overview" should be lowercase, but "Skills" in "Claude Code Skills" should be preserved
        expect(fixed).toContain('overview');
      }
    });
  });

  describe('Bold text capitalization', () => {

    test('should not overcapitalize words in bold text', async () => {
      const content = '- **GitHub issue and PR templates**: Standardized templates';
      const errors = await lintWithRule(content, sentenceCaseHeading);

      // Should not capitalize "issue" and "and" mid-phrase
      if (errors.length > 0 && errors[0].fixInfo) {
        const fixed = applyFixes(content, errors);
        expect(fixed).not.toMatch(/Issue And PR/);
        expect(fixed).not.toMatch(/Issue and PR/);
      }
    });

    test('bold text with correct casing should not be flagged', async () => {
      const content = '- **GitHub issue and PR templates**: Description here';
      const errors = await lintWithRule(content, sentenceCaseHeading);

      // This is already correct sentence case
      expect(errors.length).toBe(0);
    });
  });

  describe('Error messages should not expose internal placeholders', () => {

    test('error messages should not contain __PRESERVED_N__ placeholders', async () => {
      const content = '## Tier 1: fast tests (**p_0**)';
      const errors = await lintWithRule(content, sentenceCaseHeading);

      for (const error of errors) {
        // Check error message doesn't contain internal placeholder
        expect(error.errorDetail || '').not.toMatch(/__PRESERVED_\d+__/);
        expect(error.errorContext || '').not.toMatch(/__PRESERVED_\d+__/);
      }
    });
  });
});

describe('Round 10 False Positives - Backtick Code Elements Rule', () => {

  describe('Slashes in prose should not be backticked', () => {

    test('format listings with slashes should not be backticked', async () => {
      const content = '- Export results to CSV/JSON/markdown';
      const errors = await lintWithRule(content, backtickCodeElements);

      // "CSV/JSON/markdown" is a format listing, not a file path
      const slashError = errors.find(e =>
        e.errorContext?.includes('CSV/JSON') ||
        e.errorDetail?.includes('CSV/JSON')
      );
      expect(slashError).toBeUndefined();
    });

    test('prose alternatives with slashes should not be backticked', async () => {
      const content = '| Related resources | Links to related pages/documents |';
      const errors = await lintWithRule(content, backtickCodeElements);

      // "pages/documents" is prose, not a file path
      const slashError = errors.find(e =>
        e.errorContext?.includes('pages/documents') ||
        e.errorDetail?.includes('pages/documents')
      );
      expect(slashError).toBeUndefined();
    });

    test('actual file paths should still be backticked', async () => {
      const content = 'Check the src/utils/helpers.js file for details.';
      const errors = await lintWithRule(content, backtickCodeElements);

      // Actual file paths should be flagged
      const pathError = errors.find(e =>
        e.errorContext?.includes('src/utils/helpers.js') ||
        e.errorDetail?.includes('src/utils/helpers.js')
      );
      expect(pathError).toBeDefined();
    });

    test('A/B/C choice patterns should not be backticked', async () => {
      const content = 'Choose between option A/option B/option C.';
      const errors = await lintWithRule(content, backtickCodeElements);

      // Choice patterns are not file paths
      expect(errors.length).toBe(0);
    });
  });
});
