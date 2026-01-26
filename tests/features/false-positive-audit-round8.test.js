/**
 * @fileoverview Tests for false positives discovered in agent-playbook repository (Round 8).
 * Issues found during 2026-01-26 validation loop.
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

describe('Sentence-case false positives - Round 8', () => {
  describe('E2E acronym should remain uppercase', () => {
    test('E2E in "Integration/E2E tests" should remain uppercase', async () => {
      const content = `## Integration/E2E tests`;
      const errors = await lintWithRule(content, sentenceCaseHeading);
      // E2E is a well-known acronym (End-to-End) that should stay uppercase
      const e2eErrors = errors.filter(e =>
        e.errorDetail && e.errorDetail.includes('"E2E"')
      );
      expect(e2eErrors).toHaveLength(0);
    });

    test('E2E alone should remain uppercase', async () => {
      const content = `### E2E testing guide`;
      const errors = await lintWithRule(content, sentenceCaseHeading);
      expect(errors).toHaveLength(0);
    });

    test('E2E in various contexts', async () => {
      const testCases = [
        '## E2E test strategy',
        '### Running E2E tests',
        '## Integration/E2E tests'
      ];

      for (const heading of testCases) {
        const errors = await lintWithRule(heading, sentenceCaseHeading);
        const e2eErrors = errors.filter(e =>
          e.errorDetail && (e.errorDetail.includes('"E2E"') || e.errorDetail.includes('"e2e"'))
        );
        expect(e2eErrors).toHaveLength(0);
      }
    });
  });

  describe('WSL acronym should remain uppercase', () => {
    test('WSL in "Linux/WSL" should remain uppercase', async () => {
      const content = `## Linux/WSL configuration`;
      const errors = await lintWithRule(content, sentenceCaseHeading);
      // WSL is an acronym (Windows Subsystem for Linux) that should stay uppercase
      const wslErrors = errors.filter(e =>
        e.errorDetail && e.errorDetail.includes('"WSL"')
      );
      expect(wslErrors).toHaveLength(0);
    });

    test('WSL alone should remain uppercase', async () => {
      const content = `### WSL setup guide`;
      const errors = await lintWithRule(content, sentenceCaseHeading);
      expect(errors).toHaveLength(0);
    });
  });

  describe('macOS brand name should preserve casing', () => {
    test('macOS in "macOS/Linux" should preserve lowercase m', async () => {
      const content = `## macOS/Linux installation`;
      const errors = await lintWithRule(content, sentenceCaseHeading);
      // macOS is a brand name with specific casing (lowercase m)
      // Should NOT be changed to "Macos" or "MacOS"
      expect(errors).toHaveLength(0);
    });

    test('macOS at heading start should preserve casing', async () => {
      const content = `## macOS configuration`;
      const errors = await lintWithRule(content, sentenceCaseHeading);
      expect(errors).toHaveLength(0);
    });
  });

  describe('Word after quoted text should NOT be capitalized', () => {
    test('"make fast" not found - "not" should stay lowercase', async () => {
      const content = `### "make fast" not found`;
      const errors = await lintWithRule(content, sentenceCaseHeading);
      // The word "not" after the quoted text should remain lowercase
      // Should NOT become "Not found"
      const notErrors = errors.filter(e =>
        e.errorDetail && e.errorDetail.includes('"not"')
      );
      expect(notErrors).toHaveLength(0);
    });

    test('Code in quotes followed by lowercase should be valid', async () => {
      const testCases = [
        '### "npm test" fails silently',
        '### "git push" not working',
        '### "make build" error handling'
      ];

      for (const heading of testCases) {
        const errors = await lintWithRule(heading, sentenceCaseHeading);
        // Words after quoted code should remain lowercase
        expect(errors).toHaveLength(0);
      }
    });
  });
});

describe('BCE false positives - Round 8', () => {
  describe('Prose phrases with "import" should NOT be backticked', () => {
    test('"import system" as prose should NOT be backticked', async () => {
      const content = `Add intelligent skill import system for external integration.`;
      const errors = await lintWithRule(content, backtickCodeElements);
      // "import system" is prose, not a code import statement
      const importErrors = errors.filter(e => e.errorContext === 'import system');
      expect(importErrors).toHaveLength(0);
    });

    test('"import updates" as prose should NOT be backticked', async () => {
      const content = `Simple function renames and import updates are handled automatically.`;
      const errors = await lintWithRule(content, backtickCodeElements);
      const importErrors = errors.filter(e => e.errorContext === 'import updates');
      expect(importErrors).toHaveLength(0);
    });

    test('"import is" as prose should NOT be backticked', async () => {
      const content = `Claude Desktop import is strict and only accepts these keys.`;
      const errors = await lintWithRule(content, backtickCodeElements);
      const importErrors = errors.filter(e => e.errorContext === 'import is');
      expect(importErrors).toHaveLength(0);
    });

    test('"import path" as prose should NOT be backticked', async () => {
      const content = `Direct replacements: simple function renames, import path updates.`;
      const errors = await lintWithRule(content, backtickCodeElements);
      // "import path" when referring to the concept, not the module, should not be backticked
      const importErrors = errors.filter(e => e.errorContext === 'import path');
      expect(importErrors).toHaveLength(0);
    });

    test('Actual import statements SHOULD be backticked', async () => {
      const content = `Use import pdfplumber to load the library.`;
      const errors = await lintWithRule(content, backtickCodeElements);
      // "import pdfplumber" IS a real import statement and SHOULD be backticked
      const importErrors = errors.filter(e => e.errorContext === 'import pdfplumber');
      expect(importErrors).toHaveLength(1);
    });

    test('import followed by module name SHOULD be backticked', async () => {
      const content = `Add import React at the top of the file.`;
      const errors = await lintWithRule(content, backtickCodeElements);
      const importErrors = errors.filter(e => e.errorContext === 'import React');
      expect(importErrors).toHaveLength(1);
    });
  });
});
