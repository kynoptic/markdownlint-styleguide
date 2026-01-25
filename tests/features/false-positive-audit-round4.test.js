// @ts-check

/**
 * Feature tests for false positive fixes - Round 4.
 * Focuses on backtick-code-elements edge cases.
 * TDD approach: Tests written FIRST to fail, then fixes implemented.
 */

import { describe, test, expect } from '@jest/globals';
import { lint } from 'markdownlint/promise';
import backtickCodeElements from '../../src/rules/backtick-code-elements.js';

describe('False positive fixes - Round 4', () => {

  describe('backtick-code-elements (BCE001) - URL boundary detection', () => {
    test('should flag full URLs but NOT trailing punctuation as separate elements', async () => {
      const input = 'Visit the site (https://example.com/path).';

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'backtick-code-elements': true,
        },
        customRules: [backtickCodeElements],
      });

      // The URL itself may be flagged (that's correct behavior)
      // But "path)." should NOT be flagged as a separate filename
      const falsePositiveViolations = result.input.filter(v =>
        v.errorContext?.includes('path).') || v.errorContext?.includes('path)'));
      expect(falsePositiveViolations).toHaveLength(0);
    });

    test('should flag full URLs but NOT treat path+period as filename', async () => {
      const input = 'Check https://harvardmed.service-now.com/stat.';

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'backtick-code-elements': true,
        },
        customRules: [backtickCodeElements],
      });

      // "stat." should NOT be flagged as a separate filename
      const falsePositiveViolations = result.input.filter(v =>
        v.errorContext === 'stat.' || v.errorContext === 'stat');
      expect(falsePositiveViolations).toHaveLength(0);
    });
  });

  describe('backtick-code-elements (BCE001) - Country abbreviations', () => {
    test('should NOT flag U.S as a filename', async () => {
      const input = 'This applies to U.S. customers only.';

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'backtick-code-elements': true,
        },
        customRules: [backtickCodeElements],
      });

      const usViolations = result.input.filter(v => v.errorContext === 'U.S');
      expect(usViolations).toHaveLength(0);
    });

    test('should NOT flag U.K as a filename', async () => {
      const input = 'Available in the U.K. and Europe.';

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'backtick-code-elements': true,
        },
        customRules: [backtickCodeElements],
      });

      const ukViolations = result.input.filter(v => v.errorContext === 'U.K');
      expect(ukViolations).toHaveLength(0);
    });
  });

  describe('backtick-code-elements (BCE001) - Camera/photography notation', () => {
    test('should NOT flag f/2.8 aperture as a path', async () => {
      const input = 'Shot with f/2.8 aperture for bokeh effect.';

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'backtick-code-elements': true,
        },
        customRules: [backtickCodeElements],
      });

      const apertureViolations = result.input.filter(v => v.errorContext?.includes('f/2'));
      expect(apertureViolations).toHaveLength(0);
    });

    test('should NOT flag f/1.4 aperture as a path', async () => {
      const input = 'Use f/1.4 for low light photography.';

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'backtick-code-elements': true,
        },
        customRules: [backtickCodeElements],
      });

      const apertureViolations = result.input.filter(v => v.errorContext?.includes('f/1'));
      expect(apertureViolations).toHaveLength(0);
    });

    test('should STILL flag actual file paths', async () => {
      const input = 'Edit the src/config.json file.';

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'backtick-code-elements': true,
        },
        customRules: [backtickCodeElements],
      });

      expect(result.input.length).toBeGreaterThan(0);
    });
  });
});
