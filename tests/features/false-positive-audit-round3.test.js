// @ts-check

/**
 * Feature tests for false positive fixes - Round 3.
 * Focuses on form field patterns and conventional commit types.
 * TDD approach: Tests written FIRST to fail, then fixes implemented.
 */

import { describe, test, expect } from '@jest/globals';
import { lint } from 'markdownlint/promise';
import sentenceCaseHeading from '../../src/rules/sentence-case-heading.js';

describe('False positive fixes - Round 3', () => {

  describe('sentence-case-heading (SC001) - Form field patterns', () => {
    test('should NOT flag "description (required)" as needing capitalization', async () => {
      const input = '## description (required)';

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

    test('should NOT flag "name (required)" as needing capitalization', async () => {
      const input = '## name (required)';

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

    test('should NOT flag "type (optional)" as needing capitalization', async () => {
      const input = '## type (optional)';

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

    test('should STILL flag regular headings that need capitalization', async () => {
      const input = '## this heading needs capitalization';

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'sentence-case-heading': true,
        },
        customRules: [sentenceCaseHeading],
      });

      expect(result.input.length).toBeGreaterThan(0);
    });
  });

  describe('sentence-case-heading (SC001) - Conventional commit types in bold', () => {
    test('should NOT flag **feat** as needing capitalization', async () => {
      const input = '- **feat**: Add new feature';

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

    test('should NOT flag **fix** as needing capitalization', async () => {
      const input = '- **fix**: Fix a bug';

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

    test('should NOT flag **docs** as needing capitalization', async () => {
      const input = '- **docs**: Update documentation';

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

    test('should NOT flag **refactor** as needing capitalization', async () => {
      const input = '- **refactor**: Improve code structure';

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

    test('should NOT flag **test** as needing capitalization', async () => {
      const input = '- **test**: Add unit tests';

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

    test('should NOT flag **chore** as needing capitalization', async () => {
      const input = '- **chore**: Update dependencies';

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

    test('should NOT flag **perf** as needing capitalization', async () => {
      const input = '- **perf**: Optimize performance';

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

    test('should NOT flag **style** as needing capitalization', async () => {
      const input = '- **style**: Format code';

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

    test('should NOT flag **ci** as needing capitalization', async () => {
      const input = '- **ci**: Update CI pipeline';

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

    test('should NOT flag **build** as needing capitalization', async () => {
      const input = '- **build**: Update build config';

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

    test('should STILL flag other bold text that needs capitalization', async () => {
      const input = '- **important update**: This is significant';

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'sentence-case-heading': true,
        },
        customRules: [sentenceCaseHeading],
      });

      expect(result.input.length).toBeGreaterThan(0);
    });
  });
});
