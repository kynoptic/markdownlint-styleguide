// @ts-check

/**
 * @fileoverview Tests for per-rule autofix safety configuration (issue #70).
 * Covers: confidenceThreshold, safeWords, unsafeWords, enabled per-rule overrides,
 * config validation, backward compatibility, and edge cases.
 */

import { describe, test, expect } from '@jest/globals';
import {
  shouldApplyAutofix,
  mergeAutofixSafetyConfig,
  DEFAULT_SAFETY_CONFIG
} from '../../src/rules/autofix-safety.js';
import {
  validateAutofixSafetyConfig
} from '../../src/rules/config-validation.js';

describe('per-rule autofix safety configuration', () => {
  describe('confidenceThreshold override', () => {
    test('GIVEN a rule config with confidenceThreshold WHEN safety analysis runs THEN that threshold is used', () => {
      const config = {
        ...DEFAULT_SAFETY_CONFIG,
        confidenceThreshold: 0.5
      };

      const result = shouldApplyAutofix('sentence-case', 'hello world', 'Hello world', {}, config);

      expect(result.safe).toBe(true);
      expect(result.tier).toBe('auto-fix');
    });

    test('GIVEN a high confidenceThreshold WHEN confidence is below it THEN autofix is blocked', () => {
      const config = {
        ...DEFAULT_SAFETY_CONFIG,
        confidenceThreshold: 0.99
      };

      const result = shouldApplyAutofix('sentence-case', 'hello world test', 'Hello world', {}, config);

      expect(result.safe).toBe(false);
      expect(result.tier).not.toBe('auto-fix');
    });

    test('GIVEN per-rule confidenceThreshold of 0.3 WHEN moderate confidence text THEN autofix is allowed', () => {
      const config = {
        ...DEFAULT_SAFETY_CONFIG,
        confidenceThreshold: 0.3
      };

      const result = shouldApplyAutofix('backtick', 'config', '', {}, config);

      expect(result.safe).toBe(true);
      expect(result.tier).toBe('auto-fix');
    });
  });

  describe('custom safeWords', () => {
    test('GIVEN custom safeWords WHEN safety analysis runs THEN those words boost confidence', () => {
      const configWithSafe = {
        ...DEFAULT_SAFETY_CONFIG,
        safeWords: [...DEFAULT_SAFETY_CONFIG.safeWords, 'kubernetes', 'terraform']
      };

      const resultWith = shouldApplyAutofix('backtick', 'kubernetes', '', {}, configWithSafe);
      const resultWithout = shouldApplyAutofix('backtick', 'kubernetes', '', {}, DEFAULT_SAFETY_CONFIG);

      expect(resultWith.confidence).toBeGreaterThan(resultWithout.confidence);
    });

    test('GIVEN custom safeWords WHEN term matches THEN it gets safe word boost', () => {
      const config = {
        ...DEFAULT_SAFETY_CONFIG,
        safeWords: [...DEFAULT_SAFETY_CONFIG.safeWords, 'mycompanyterm']
      };

      const result = shouldApplyAutofix('backtick', 'mycompanyterm', '', {}, config);

      expect(result.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('custom unsafeWords', () => {
    test('GIVEN custom unsafeWords WHEN safety analysis runs THEN those patterns block autofixes', () => {
      const config = {
        ...DEFAULT_SAFETY_CONFIG,
        unsafeWords: [...DEFAULT_SAFETY_CONFIG.unsafeWords, 'kubernetes']
      };

      const result = shouldApplyAutofix('backtick', 'kubernetes', '', {}, config);

      expect(result.confidence).toBeLessThan(0.5);
    });

    test('GIVEN custom unsafeWords WHEN term matches THEN autofix is blocked', () => {
      const config = {
        ...DEFAULT_SAFETY_CONFIG,
        unsafeWords: [...DEFAULT_SAFETY_CONFIG.unsafeWords, 'deploy']
      };

      const result = shouldApplyAutofix('backtick', 'deploy', '', {}, config);

      expect(result.safe).toBe(false);
    });
  });

  describe('enabled flag per rule', () => {
    test('GIVEN enabled=false WHEN safety analysis runs THEN all autofixes pass', () => {
      const config = {
        ...DEFAULT_SAFETY_CONFIG,
        enabled: false
      };

      const result = shouldApplyAutofix('backtick', 'the', '', {}, config);

      expect(result.safe).toBe(true);
      expect(result.confidence).toBe(1.0);
      expect(result.tier).toBe('auto-fix');
    });

    test('GIVEN enabled=true WHEN safety analysis runs THEN normal checks apply', () => {
      const config = {
        ...DEFAULT_SAFETY_CONFIG,
        enabled: true
      };

      const result = shouldApplyAutofix('backtick', 'the', '', {}, config);

      expect(result.safe).toBe(false);
    });
  });

  describe('backward compatibility', () => {
    test('GIVEN no custom configuration WHEN rules run THEN default safety behavior is unchanged', () => {
      const resultDefault = shouldApplyAutofix('sentence-case', 'hello world', 'Hello world');
      const resultExplicit = shouldApplyAutofix('sentence-case', 'hello world', 'Hello world', {}, DEFAULT_SAFETY_CONFIG);

      expect(resultDefault.safe).toBe(resultExplicit.safe);
      expect(resultDefault.confidence).toBe(resultExplicit.confidence);
      expect(resultDefault.tier).toBe(resultExplicit.tier);
    });

    test('GIVEN undefined config WHEN shouldApplyAutofix runs THEN defaults apply', () => {
      const result = shouldApplyAutofix('backtick', 'package.json', '');

      expect(result.safe).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.7);
    });
  });

  describe('per-rule config isolation', () => {
    test('GIVEN per-rule safety config WHEN multiple rules run THEN each uses its own configuration', () => {
      const lenientConfig = {
        ...DEFAULT_SAFETY_CONFIG,
        confidenceThreshold: 0.3
      };

      const strictConfig = {
        ...DEFAULT_SAFETY_CONFIG,
        confidenceThreshold: 0.99
      };

      const lenientResult = shouldApplyAutofix('backtick', 'config', '', {}, lenientConfig);
      const strictResult = shouldApplyAutofix('backtick', 'config', '', {}, strictConfig);

      expect(lenientResult.safe).toBe(true);
      expect(strictResult.safe).toBe(false);
    });
  });

  describe('mergeAutofixSafetyConfig', () => {
    test('GIVEN no overrides WHEN merging THEN returns defaults', () => {
      const result = mergeAutofixSafetyConfig();

      expect(result.enabled).toBe(DEFAULT_SAFETY_CONFIG.enabled);
      expect(result.confidenceThreshold).toBe(DEFAULT_SAFETY_CONFIG.confidenceThreshold);
      expect(result.safeWords).toEqual(DEFAULT_SAFETY_CONFIG.safeWords);
      expect(result.unsafeWords).toEqual(DEFAULT_SAFETY_CONFIG.unsafeWords);
    });

    test('GIVEN partial overrides WHEN merging THEN overrides apply and defaults fill gaps', () => {
      const result = mergeAutofixSafetyConfig({ confidenceThreshold: 0.5 });

      expect(result.confidenceThreshold).toBe(0.5);
      expect(result.enabled).toBe(DEFAULT_SAFETY_CONFIG.enabled);
      expect(result.safeWords).toEqual(DEFAULT_SAFETY_CONFIG.safeWords);
    });

    test('GIVEN safeWords override WHEN merging THEN arrays are concatenated with defaults', () => {
      const result = mergeAutofixSafetyConfig({ safeWords: ['kubernetes'] });

      expect(result.safeWords).toContain('kubernetes');
      for (const word of DEFAULT_SAFETY_CONFIG.safeWords) {
        expect(result.safeWords).toContain(word);
      }
    });

    test('GIVEN unsafeWords override WHEN merging THEN arrays are concatenated with defaults', () => {
      const result = mergeAutofixSafetyConfig({ unsafeWords: ['deploy'] });

      expect(result.unsafeWords).toContain('deploy');
      for (const word of DEFAULT_SAFETY_CONFIG.unsafeWords) {
        expect(result.unsafeWords).toContain(word);
      }
    });

    test('GIVEN null/undefined WHEN merging THEN returns defaults', () => {
      expect(mergeAutofixSafetyConfig(null)).toEqual(DEFAULT_SAFETY_CONFIG);
      expect(mergeAutofixSafetyConfig(undefined)).toEqual(DEFAULT_SAFETY_CONFIG);
    });
  });
});

describe('autofix safety config validation', () => {
  test('GIVEN valid config WHEN validating THEN returns valid', () => {
    const result = validateAutofixSafetyConfig({
      enabled: true,
      confidenceThreshold: 0.8,
      safeWords: ['kubernetes'],
      unsafeWords: ['deploy']
    });

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('GIVEN empty config WHEN validating THEN returns valid', () => {
    const result = validateAutofixSafetyConfig({});

    expect(result.isValid).toBe(true);
  });

  test('GIVEN null config WHEN validating THEN returns valid', () => {
    const result = validateAutofixSafetyConfig(null);

    expect(result.isValid).toBe(true);
  });

  test('GIVEN confidenceThreshold > 1 WHEN validating THEN returns error', () => {
    const result = validateAutofixSafetyConfig({ confidenceThreshold: 1.5 });

    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.field === 'confidenceThreshold')).toBe(true);
  });

  test('GIVEN confidenceThreshold < 0 WHEN validating THEN returns error', () => {
    const result = validateAutofixSafetyConfig({ confidenceThreshold: -0.1 });

    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.field === 'confidenceThreshold')).toBe(true);
  });

  test('GIVEN confidenceThreshold is string WHEN validating THEN returns error', () => {
    const result = validateAutofixSafetyConfig({ confidenceThreshold: 'high' });

    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.field === 'confidenceThreshold')).toBe(true);
  });

  test('GIVEN enabled is string WHEN validating THEN returns error', () => {
    const result = validateAutofixSafetyConfig({ enabled: 'yes' });

    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.field === 'enabled')).toBe(true);
  });

  test('GIVEN safeWords is string WHEN validating THEN returns error', () => {
    const result = validateAutofixSafetyConfig({ safeWords: 'kubernetes' });

    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.field === 'safeWords')).toBe(true);
  });

  test('GIVEN unsafeWords contains number WHEN validating THEN returns error', () => {
    const result = validateAutofixSafetyConfig({ unsafeWords: [123] });

    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.field.startsWith('unsafeWords'))).toBe(true);
  });

  test('GIVEN unknown field WHEN validating THEN returns error', () => {
    const result = validateAutofixSafetyConfig({ unknownField: true });

    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.field === 'unknownField')).toBe(true);
  });

  describe('conflicting word lists', () => {
    test('GIVEN a word in both safeWords and unsafeWords WHEN validating THEN returns error', () => {
      const result = validateAutofixSafetyConfig({
        safeWords: ['kubernetes'],
        unsafeWords: ['kubernetes']
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('conflict'))).toBe(true);
    });
  });
});
