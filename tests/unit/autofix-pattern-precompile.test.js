/**
 * Tests for precompiled patterns in autofix-safety.js.
 * Verifies that hoisted module-level pattern constants produce identical
 * results to the original per-call compilation approach, and that
 * repeated calls are deterministic.
 */
import { describe, test, expect } from '@jest/globals';
import {
  analyzeCodeVsNaturalLanguage,
  calculateSentenceCaseConfidence,
  calculateBacktickConfidence,
  shouldApplyAutofix
} from '../../src/rules/autofix-safety.js';

describe('Precompiled pattern equivalence', () => {
  describe('analyzeCodeVsNaturalLanguage pinned outputs', () => {
    const cases = [
      { text: 'the', expectLikelyCode: false, expectLowConfidence: true },
      { text: 'is', expectLikelyCode: false, expectLowConfidence: true },
      { text: 'you', expectLikelyCode: false, expectLowConfidence: true },
      { text: 'three', expectLikelyCode: false, expectLowConfidence: true },
      { text: 'red', expectLikelyCode: false, expectLowConfidence: false },
      { text: 'package.json', expectLikelyCode: true, expectLowConfidence: false },
      { text: 'npm install express', expectLikelyCode: true, expectLowConfidence: false },
      { text: 'ENVIRONMENT_VAR', expectLikelyCode: true, expectLowConfidence: false },
      { text: '--verbose', expectLikelyCode: true, expectLowConfidence: false },
      { text: 'src/index.js', expectLikelyCode: true, expectLowConfidence: false },
      { text: '.gitignore', expectLikelyCode: true, expectLowConfidence: false },
      { text: 'import React', expectLikelyCode: true, expectLowConfidence: false },
      { text: '$HOME', expectLikelyCode: true, expectLowConfidence: false },
      { text: 'fetchData', expectLikelyCode: true, expectLowConfidence: false },
      { text: 'my_variable', expectLikelyCode: true, expectLowConfidence: false },
      { text: 'MyComponent', expectLikelyCode: true, expectLowConfidence: false },
    ];

    for (const { text, expectLikelyCode, expectLowConfidence } of cases) {
      test(`should classify "${text}" correctly`, () => {
        const result = analyzeCodeVsNaturalLanguage(text, {});
        expect(result.isLikelyCode).toBe(expectLikelyCode);
        if (expectLowConfidence) {
          expect(result.confidence).toBeLessThanOrEqual(0.2);
        }
      });
    }

    test('should apply context-based adjustments', () => {
      const techResult = analyzeCodeVsNaturalLanguage('webpack', {
        line: 'Run the command to install webpack'
      });
      const proseResult = analyzeCodeVsNaturalLanguage('webpack', {
        line: 'For example, webpack is like a bundler'
      });
      expect(techResult.confidence).toBeGreaterThan(proseResult.confidence);
    });
  });

  describe('calculateSentenceCaseConfidence pinned outputs', () => {
    test('should return 0 confidence for empty or identical inputs', () => {
      expect(calculateSentenceCaseConfidence('', '', {}).confidence).toBe(0);
      expect(calculateSentenceCaseConfidence('Hello', 'Hello', {}).confidence).toBe(0);
      expect(calculateSentenceCaseConfidence(null, null, {}).confidence).toBe(0);
    });

    test('should boost for first-word capitalization fix', () => {
      const result = calculateSentenceCaseConfidence('HELLO WORLD', 'Hello world', {});
      expect(result.confidence).toBeGreaterThanOrEqual(0.7);
      expect(result.heuristics.firstWordCapitalization).toBe(0.3);
    });

    test('should boost for case-only changes', () => {
      const result = calculateSentenceCaseConfidence('Hello World', 'hello world', {});
      expect(result.heuristics.caseChangesOnly).toBe(0.2);
    });

    test('should detect technical terms in text', () => {
      const withTech = calculateSentenceCaseConfidence(
        'Configure API and REST endpoints',
        'configure API and REST endpoints',
        {}
      );
      const withoutTech = calculateSentenceCaseConfidence(
        'Configure the things',
        'configure the things',
        {}
      );
      expect(withTech.heuristics.technicalTerms).toBeGreaterThan(0);
      expect(withoutTech.heuristics.technicalTerms).toBe(0);
    });
  });

  describe('Deterministic outputs across multiple calls', () => {
    test('analyzeCodeVsNaturalLanguage returns same result on repeated calls', () => {
      const inputs = ['npm', 'package.json', 'hello', 'the', '--flag', 'fetchData'];
      for (const text of inputs) {
        const r1 = analyzeCodeVsNaturalLanguage(text, {});
        const r2 = analyzeCodeVsNaturalLanguage(text, {});
        expect(r1.confidence).toBe(r2.confidence);
        expect(r1.isLikelyCode).toBe(r2.isLikelyCode);
        expect(r1.shouldAutofix).toBe(r2.shouldAutofix);
        expect(r1.reasons).toEqual(r2.reasons);
      }
    });

    test('calculateSentenceCaseConfidence returns same result on repeated calls', () => {
      const pairs = [
        ['API Gateway Setup', 'API gateway setup'],
        ['HELLO WORLD', 'Hello world'],
        ['Configure REST API', 'configure REST API'],
      ];
      for (const [orig, fixed] of pairs) {
        const r1 = calculateSentenceCaseConfidence(orig, fixed, {});
        const r2 = calculateSentenceCaseConfidence(orig, fixed, {});
        expect(r1.confidence).toBe(r2.confidence);
        expect(r1.heuristics).toEqual(r2.heuristics);
      }
    });

    test('calculateBacktickConfidence returns same result on repeated calls', () => {
      const inputs = ['npm', 'package.json', 'hello', 'src/index.js'];
      for (const text of inputs) {
        const r1 = calculateBacktickConfidence(text, {});
        const r2 = calculateBacktickConfidence(text, {});
        expect(r1.confidence).toBe(r2.confidence);
        expect(r1.heuristics).toEqual(r2.heuristics);
      }
    });
  });

  describe('shouldApplyAutofix integration with precompiled patterns', () => {
    const config = {
      enabled: true,
      confidenceThreshold: 0.7,
      reviewThreshold: 0.3
    };

    test('should produce identical tier results across calls', () => {
      const cases = [
        ['sentence-case', 'HELLO WORLD', 'Hello world'],
        ['backtick', 'package.json', '`package.json`'],
        ['backtick', 'the', '`the`'],
        ['no-bare-url', 'https://example.com', '<https://example.com>'],
      ];

      for (const [rule, orig, fixed] of cases) {
        const r1 = shouldApplyAutofix(rule, orig, fixed, {}, config);
        const r2 = shouldApplyAutofix(rule, orig, fixed, {}, config);
        expect(r1.tier).toBe(r2.tier);
        expect(r1.confidence).toBe(r2.confidence);
        expect(r1.safe).toBe(r2.safe);
      }
    });
  });
});
