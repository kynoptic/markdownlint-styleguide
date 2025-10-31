// @ts-check

/**
 * Feature tests for false positive fixes identified in the ultimate-ranks evaluation.
 * This test suite validates that the fixes for reported false positives work correctly
 * without breaking the rules' ability to catch real violations.
 */

import { describe, test, expect } from '@jest/globals';
import { lint } from 'markdownlint/promise';
import backtickCodeElements from '../../src/rules/backtick-code-elements.js';
import sentenceCaseHeading from '../../src/rules/sentence-case-heading.js';
import noDeadInternalLinks from '../../src/rules/no-dead-internal-links.js';

describe('False positive fixes from ultimate-ranks evaluation', () => {
  describe('backtick-code-elements (BCE001)', () => {
    test('should NOT flag WCAG contrast ratios', async () => {
      const input = 'The color contrast ratio must be at least 4.5:1 for normal text and 3:1 for large text. Some designs use 7:1 ratios.';

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'backtick-code-elements': true,
        },
        customRules: [backtickCodeElements],
      });

      expect(result.input).toHaveLength(0);
    });

    test('should STILL flag network addresses like localhost:3000', async () => {
      const input = 'Connect to localhost:3000 to access the dev server.';

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'backtick-code-elements': true,
        },
        customRules: [backtickCodeElements],
      });

      expect(result.input).toHaveLength(1);
      expect(result.input[0].ruleNames).toContain('backtick-code-elements');
    });

    test('should NOT flag enumerated options with slashes', async () => {
      const input = 'The Value field accepts Essential/Useful/Nice-to-have options. The Effort field uses Heavy/Moderate/Light estimates.';

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'backtick-code-elements': true,
        },
        customRules: [backtickCodeElements],
      });

      expect(result.input).toHaveLength(0);
    });

    test('should NOT flag BDD-style patterns like GIVEN/WHEN/THEN', async () => {
      const input = 'Test scenarios follow the GIVEN/WHEN/THEN format for clarity.';

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'backtick-code-elements': true,
        },
        customRules: [backtickCodeElements],
      });

      expect(result.input).toHaveLength(0);
    });

    test('should NOT flag grammar pluralization patterns', async () => {
      const input = 'Update all issue(s) and PR(s) with the correct label(s) before merging.';

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'backtick-code-elements': true,
        },
        customRules: [backtickCodeElements],
      });

      expect(result.input).toHaveLength(0);
    });

    test('should STILL flag actual function calls', async () => {
      const input = 'Use the calculateTotal() function to compute the sum.';

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'backtick-code-elements': true,
        },
        customRules: [backtickCodeElements],
      });

      expect(result.input).toHaveLength(1);
      expect(result.input[0].ruleNames).toContain('backtick-code-elements');
    });

    test('should NOT flag capitalized category labels with slashes', async () => {
      const input = 'The schema includes Data/API endpoints for resource management.';

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'backtick-code-elements': true,
        },
        customRules: [backtickCodeElements],
      });

      expect(result.input).toHaveLength(0);
    });

    test('should STILL flag actual file paths', async () => {
      const input = 'The configuration is stored in src/config/settings.json file.';

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'backtick-code-elements': true,
        },
        customRules: [backtickCodeElements],
      });

      // Both the full path and the filename are caught (overlapping matches)
      expect(result.input.length).toBeGreaterThan(0);
      expect(result.input[0].ruleNames).toContain('backtick-code-elements');
    });
  });

  describe('sentence-case-heading (SC001)', () => {
    test('should NOT flag product names when configured as specialTerms', async () => {
      const input = '# Contributing to Ultimate Ranks\n\n## Getting started with Ultimate Ranks';

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'sentence-case-heading': {
            specialTerms: ['Ultimate Ranks']
          },
        },
        customRules: [sentenceCaseHeading],
      });

      expect(result.input).toHaveLength(0);
    });

    test('should generate autofix when multi-word specialTerm has wrong casing', async () => {
      const { applyFixes } = await import('markdownlint');
      const input = '# Contributing to ultimate ranks';

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'sentence-case-heading': {
            specialTerms: ['Ultimate Ranks']
          },
        },
        customRules: [sentenceCaseHeading],
      });

      expect(result.input).toHaveLength(1);
      expect(result.input[0].ruleNames).toContain('sentence-case-heading');
      expect(result.input[0].errorDetail).toContain('Phrase "ultimate ranks" should be "Ultimate Ranks"');
      expect(result.input[0].fixInfo).toBeDefined();

      const fixed = applyFixes(input, result.input);
      expect(fixed).toBe('# Contributing to Ultimate Ranks');
    });

    test('should generate autofix when multi-word specialTerm appears mid-heading', async () => {
      const { applyFixes } = await import('markdownlint');
      const input = '## Working with github actions in ultimate ranks';

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'sentence-case-heading': {
            specialTerms: ['Ultimate Ranks', 'GitHub Actions']
          },
        },
        customRules: [sentenceCaseHeading],
      });

      expect(result.input).toHaveLength(1);
      expect(result.input[0].fixInfo).toBeDefined();

      const fixed = applyFixes(input, result.input);
      expect(fixed).toBe('## Working with GitHub Actions in Ultimate Ranks');
    });

    test('should NOT flag common acronyms when configured', async () => {
      const input = '# README for the project\n\n## ADR documentation\n\n### E2E tests';

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'sentence-case-heading': {
            specialTerms: ['README', 'ADR', 'E2E']
          },
        },
        customRules: [sentenceCaseHeading],
      });

      expect(result.input).toHaveLength(0);
    });

    test('should NOT incorrectly suggest BREAKING for "Breaking changes"', async () => {
      const input = '## Breaking changes in version 2.0';

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'sentence-case-heading': true,
        },
        customRules: [sentenceCaseHeading],
      });

      expect(result.input).toHaveLength(0);
    });

    test('should STILL catch actual sentence case violations', async () => {
      const input = '## This Heading Has Title Case Words';

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'sentence-case-heading': true,
        },
        customRules: [sentenceCaseHeading],
      });

      expect(result.input).toHaveLength(1);
      expect(result.input[0].ruleNames).toContain('sentence-case-heading');
    });
  });

  describe('no-dead-internal-links (DL001)', () => {
    test('should NOT flag template placeholders when allowPlaceholders is enabled', async () => {
      const input = [
        'See the [ADR template](../adr/adr-XXX-title.md) for decisions.',
        'Refer to the [placeholder](TODO.md) for implementation.',
        'Check the [example](PLACEHOLDER.md) for usage.'
      ].join('\n');

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'no-dead-internal-links': {
            allowPlaceholders: true
          },
        },
        customRules: [noDeadInternalLinks],
      });

      expect(result.input).toHaveLength(0);
    });

    test('should STILL flag template placeholders when allowPlaceholders is disabled (default)', async () => {
      const input = 'See the [ADR template](../adr/adr-XXX-title.md) for decisions.';

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'no-dead-internal-links': true,
        },
        customRules: [noDeadInternalLinks],
      });

      // This should flag because the file doesn't exist and placeholders are not allowed
      expect(result.input.length).toBeGreaterThan(0);
    });
  });

  describe('Comprehensive false positive prevention', () => {
    test('backtick-code-elements should handle mixed content correctly', async () => {
      const input = [
        'The WCAG contrast ratio must be 4.5:1 for text.',
        'Options are Essential/Useful/Nice-to-have for prioritization.',
        'Update issue(s) before merging to localhost:3000.',
        'Use the getData() function in src/api/client.js file.'
      ].join(' ');

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'backtick-code-elements': true,
        },
        customRules: [backtickCodeElements],
      });

      // Should only flag localhost:3000, getData(), and src/api/client.js
      // Should NOT flag: 4.5:1, Essential/Useful/Nice-to-have, issue(s)
      expect(result.input.length).toBeGreaterThan(0);

      // Verify that WCAG ratio is not in the violations
      const violations = result.input;

      // None of the violations should mention the false positives we fixed
      const violationStrings = violations.map(v => JSON.stringify(v));
      expect(violationStrings.every(str => !str.includes('4.5:1'))).toBe(true);
      expect(violationStrings.every(str => !str.includes('Essential'))).toBe(true);
      expect(violationStrings.every(str => !str.includes('issue(s)'))).toBe(true);
    });
  });
});
