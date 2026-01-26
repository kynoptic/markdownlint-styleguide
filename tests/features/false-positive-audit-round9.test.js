/**
 * @fileoverview Tests for false positives discovered across multiple repos (Round 9).
 * Issues found during 2026-01-26 validation loop on eml-to-text, hms-it-quarterly-newsletter,
 * and word-to-markdown-converter repositories.
 */

import { lint } from 'markdownlint/promise';
import backtickCodeElements from '../../src/rules/backtick-code-elements.js';
import sentenceCaseHeading from '../../src/rules/sentence-case-heading.js';

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
    customRules: [rule],
    config: {
      default: false,
      [rule.names[0]]: config === false ? false : (Object.keys(config).length > 0 ? config : true)
    }
  });
  return result.test || [];
}

describe('Sentence-case false positives - Round 9', () => {
  describe('First word after colon should remain capitalized', () => {
    test('Priority 1: Critical should keep Critical capitalized', async () => {
      const content = `### Priority 1: Critical rendering fixes`;
      const errors = await lintWithRule(content, sentenceCaseHeading);
      // "Critical" is the first word after the colon, should stay capitalized
      const criticalErrors = errors.filter(e =>
        e.errorDetail && e.errorDetail.includes('"Critical"')
      );
      expect(criticalErrors).toHaveLength(0);
    });

    test('Priority 2: Best practices should keep Best capitalized', async () => {
      const content = `### Priority 2: Best practices and consistency`;
      const errors = await lintWithRule(content, sentenceCaseHeading);
      expect(errors).toHaveLength(0);
    });

    test('Implementation guide: Code snippets should keep Code capitalized', async () => {
      const content = `## Implementation guide: Code snippets`;
      const errors = await lintWithRule(content, sentenceCaseHeading);
      expect(errors).toHaveLength(0);
    });
  });

  describe('First word after em-dash should remain capitalized', () => {
    test('ADR 001 — Email template should keep Email capitalized', async () => {
      const content = `# ADR 001 — Email template architecture`;
      const errors = await lintWithRule(content, sentenceCaseHeading);
      // "Email" after em-dash should stay capitalized
      const emailErrors = errors.filter(e =>
        e.errorDetail && e.errorDetail.includes('"Email"')
      );
      expect(emailErrors).toHaveLength(0);
    });

    test('ADR 003 — Dark mode should keep Dark capitalized', async () => {
      const content = `# ADR 003 — Dark mode implementation strategy`;
      const errors = await lintWithRule(content, sentenceCaseHeading);
      expect(errors).toHaveLength(0);
    });
  });

  describe('Word after ampersand should remain capitalized when appropriate', () => {
    test('Body & Outer Container - Outer should stay capitalized as title', async () => {
      const content = `### Body & Outer Container Structure`;
      const errors = await lintWithRule(content, sentenceCaseHeading);
      // In a title-like heading with &, words can remain capitalized
      const outerErrors = errors.filter(e =>
        e.errorDetail && e.errorDetail.includes('"Outer"')
      );
      expect(outerErrors).toHaveLength(0);
    });
  });

  describe('Product names should preserve casing', () => {
    test('Apple Mail should remain capitalized', async () => {
      const content = `## Apple Mail configuration`;
      const errors = await lintWithRule(content, sentenceCaseHeading);
      const mailErrors = errors.filter(e =>
        e.errorDetail && e.errorDetail.includes('"Mail"')
      );
      expect(mailErrors).toHaveLength(0);
    });

    test('Make (build tool) should remain capitalized', async () => {
      const content = `### Using Make for development`;
      const errors = await lintWithRule(content, sentenceCaseHeading);
      const makeErrors = errors.filter(e =>
        e.errorDetail && e.errorDetail.includes('"Make"')
      );
      expect(makeErrors).toHaveLength(0);
    });

    test('Word (Microsoft Word) should remain capitalized', async () => {
      const content = `# Contributing to Word to Markdown Converter`;
      const errors = await lintWithRule(content, sentenceCaseHeading);
      const wordErrors = errors.filter(e =>
        e.errorDetail && e.errorDetail.includes('"Word"')
      );
      expect(wordErrors).toHaveLength(0);
    });
  });

  describe('File extension acronyms should remain uppercase', () => {
    test('DOCX should remain uppercase', async () => {
      const content = `### Ad-hoc DOCX to Markdown conversion`;
      const errors = await lintWithRule(content, sentenceCaseHeading);
      const docxErrors = errors.filter(e =>
        e.errorDetail && e.errorDetail.includes('"DOCX"')
      );
      expect(docxErrors).toHaveLength(0);
    });
  });

  describe('PR acronym should remain uppercase', () => {
    test('PR in heading should remain uppercase', async () => {
      const content = `## GitHub issue and PR templates`;
      const errors = await lintWithRule(content, sentenceCaseHeading);
      const prErrors = errors.filter(e =>
        e.errorDetail && e.errorDetail.includes('"PR"')
      );
      expect(prErrors).toHaveLength(0);
    });
  });

  describe('Mid-sentence words should not be capitalized', () => {
    test('edge in "Conversion edge case" should stay lowercase', async () => {
      const content = `### Conversion edge case`;
      const errors = await lintWithRule(content, sentenceCaseHeading);
      // "edge" should NOT be flagged to become "Edge"
      const edgeErrors = errors.filter(e =>
        e.errorDetail && e.errorDetail.includes('"edge"')
      );
      expect(edgeErrors).toHaveLength(0);
    });

    test('And should not be capitalized mid-sentence', async () => {
      const content = `## GitHub issue and PR templates`;
      const errors = await lintWithRule(content, sentenceCaseHeading);
      // Should not suggest capitalizing "and" to "And"
      expect(errors).toHaveLength(0);
    });
  });
});

describe('BCE false positives - Round 9', () => {
  describe('Email addresses should NOT have usernames backticked', () => {
    test('Email username should not be backticked', async () => {
      const content = `**To:** Balise, Julie K <julie_balise@hms.harvard.edu>`;
      const errors = await lintWithRule(content, backtickCodeElements);
      // "julie_balise" is part of an email, not code
      const emailErrors = errors.filter(e =>
        e.errorContext && e.errorContext.includes('julie_balise')
      );
      expect(emailErrors).toHaveLength(0);
    });

    test('Multiple email usernames should not be backticked', async () => {
      const content = `Contact joe_smith@example.com or jane_doe@example.com for help.`;
      const errors = await lintWithRule(content, backtickCodeElements);
      const emailErrors = errors.filter(e =>
        e.errorContext && (e.errorContext.includes('joe_smith') || e.errorContext.includes('jane_doe'))
      );
      expect(emailErrors).toHaveLength(0);
    });
  });

  describe('Prose with slashes should NOT be backticked', () => {
    test('npm/Node.js as prose should not be backticked', async () => {
      const content = `Build system required: npm/Node.js needed for local development.`;
      const errors = await lintWithRule(content, backtickCodeElements);
      const slashErrors = errors.filter(e =>
        e.errorContext && e.errorContext.includes('npm/Node.js')
      );
      expect(slashErrors).toHaveLength(0);
    });

    test('client/device/OS as prose should not be backticked', async () => {
      const content = `Testing requires 100+ client/device/OS combinations.`;
      const errors = await lintWithRule(content, backtickCodeElements);
      const slashErrors = errors.filter(e =>
        e.errorContext && e.errorContext.includes('client/device/OS')
      );
      expect(slashErrors).toHaveLength(0);
    });
  });

  describe('Prose paths should be fully backticked (not partial)', () => {
    test('/path/to/file should be wrapped fully, not partially', async () => {
      const content = `Wrap file paths in backticks, e.g., /path/to/file.`;
      const errors = await lintWithRule(content, backtickCodeElements);
      // Paths in prose SHOULD be flagged for backticking
      // The fix should wrap the ENTIRE path, not create partial backticks like /`path/to/file`
      const pathErrors = errors.filter(e =>
        e.errorContext && e.errorContext.includes('path')
      );
      // Verify the path is flagged (correct behavior)
      expect(pathErrors).toHaveLength(1);
      // Verify the fix wraps the entire path (not partial)
      expect(pathErrors[0].fixInfo.insertText).toMatch(/^`\/path\/to\/file\.?`$/);
    });
  });

  describe('File extensions in prose should NOT be separately backticked', () => {
    test('.docx in filename context should not be separately backticked', async () => {
      const content = `- **Coms Template For Going Passwordless .docx** (21.7 KB)`;
      const errors = await lintWithRule(content, backtickCodeElements);
      // .docx is part of a filename in prose, not standalone code
      const docxErrors = errors.filter(e =>
        e.errorContext === '.docx'
      );
      expect(docxErrors).toHaveLength(0);
    });
  });
});
