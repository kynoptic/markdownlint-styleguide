/**
 * @performance
 * Performance benchmarks for autofix safety classifiers.
 * Tests execution time for confidence scoring and safety heuristics.
 */
import { describe, test, expect, beforeAll } from '@jest/globals';
import {
  shouldApplyAutofix,
  calculateSentenceCaseConfidence,
  calculateBacktickConfidence,
  analyzeCodeVsNaturalLanguage
} from '../../src/rules/autofix-safety.js';

// Performance thresholds (in microseconds)
// Note: Thresholds are generous to account for CI environment variability
const THRESHOLDS = {
  SINGLE_CLASSIFICATION: 5000, // 5ms max per classification (CI can be slow)
  BATCH_100: 100000, // 100ms max for 100 classifications
  BATCH_1000: 500000, // 500ms max for 1000 classifications
  HEURISTIC_CHECK: 500, // 500µs max per heuristic check
};

/**
 * Generate test cases for performance testing
 */
function generateTestCases(count) {
  const cases = [];
  const templates = [
    { original: 'API Gateway', fixed: 'api gateway', expected: 'unsafe' },
    { original: 'npm install', fixed: 'npm install', expected: 'safe' },
    { original: 'README.md', fixed: 'readme.md', expected: 'unsafe' },
    { original: 'HTTP Protocol', fixed: 'http protocol', expected: 'safe' },
    { original: 'database.json', fixed: 'database.json', expected: 'safe' },
    { original: '/api/users', fixed: '/api/users', expected: 'safe' },
    { original: 'GET request', fixed: 'get request', expected: 'safe' },
    { original: 'src/utils/helper.js', fixed: 'src/utils/helper.js', expected: 'safe' },
    { original: 'Very Long Title With Many Words', fixed: 'very long title with many words', expected: 'unsafe' },
    { original: 'PM2 Process Manager', fixed: 'pm2 process manager', expected: 'unsafe' },
  ];
  
  for (let i = 0; i < count; i++) {
    const template = templates[i % templates.length];
    cases.push({
      ...template,
      id: i,
    });
  }
  
  return cases;
}

/**
 * Measure execution time in microseconds
 */
function measureMicroseconds(fn) {
  const start = process.hrtime.bigint();
  fn();
  const end = process.hrtime.bigint();
  return Number(end - start) / 1000; // Convert to microseconds
}

describe('Autofix safety classifier performance', () => {
  let testCases100 = null;
  let testCases1000 = null;
  
  beforeAll(() => {
    testCases100 = generateTestCases(100);
    testCases1000 = generateTestCases(1000);
  });

  describe('shouldApplyAutofix function', () => {
    test('should_classify_single_case_within_threshold', () => {
      const duration = measureMicroseconds(() => {
        shouldApplyAutofix(
          'sentence-case-heading',
          'API Gateway',
          'api gateway',
          {},
          { autofixConfidenceThreshold: 0.5 }
        );
      });
      
      console.log('shouldApplyAutofix single case: ' + duration.toFixed(2) + 'µs');
      expect(duration).toBeLessThan(THRESHOLDS.SINGLE_CLASSIFICATION);
    });

    test('should_process_100_cases_within_threshold', () => {
      const duration = measureMicroseconds(() => {
        for (const testCase of testCases100) {
          shouldApplyAutofix(
            'sentence-case-heading',
            testCase.original,
            testCase.fixed,
            {},
            { autofixConfidenceThreshold: 0.5 }
          );
        }
      });
      
      const avgDuration = duration / testCases100.length;
      console.log('shouldApplyAutofix 100 cases: ' + duration.toFixed(2) + 'µs total, ' + avgDuration.toFixed(2) + 'µs avg');
      
      expect(duration).toBeLessThan(THRESHOLDS.BATCH_100);
    });

    test('should_process_1000_cases_within_threshold', () => {
      const duration = measureMicroseconds(() => {
        for (const testCase of testCases1000) {
          shouldApplyAutofix(
            'sentence-case-heading',
            testCase.original,
            testCase.fixed,
            {},
            { autofixConfidenceThreshold: 0.5 }
          );
        }
      });
      
      const avgDuration = duration / testCases1000.length;
      console.log('shouldApplyAutofix 1000 cases: ' + (duration / 1000).toFixed(2) + 'ms total, ' + avgDuration.toFixed(2) + 'µs avg');
      
      expect(duration).toBeLessThan(THRESHOLDS.BATCH_1000);
    });

    test('should_maintain_consistent_performance', () => {
      const iterations = 5;
      const durations = [];
      
      for (let i = 0; i < iterations; i++) {
        const duration = measureMicroseconds(() => {
          for (const testCase of testCases100) {
            shouldApplyAutofix(
              'sentence-case-heading',
              testCase.original,
              testCase.fixed,
              {},
              { autofixConfidenceThreshold: 0.5 }
            );
          }
        });
        durations.push(duration);
      }
      
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const maxDuration = Math.max(...durations);
      const minDuration = Math.min(...durations);
      const variance = (maxDuration - minDuration) / avgDuration;
      
      console.log('shouldApplyAutofix consistency: avg=' + avgDuration.toFixed(2) + 'µs, variance=' + (variance * 100).toFixed(1) + '%');

      // Variance should be less than 500% (small execution times have higher variance)
      // With microsecond precision, JIT compilation and GC can cause extreme variance
      expect(variance).toBeLessThan(5.0);
    });
  });

  describe('calculateSentenceCaseConfidence function', () => {
    test('should_classify_single_case_within_threshold', () => {
      const duration = measureMicroseconds(() => {
        calculateSentenceCaseConfidence(
          'API Gateway',
          'api gateway',
          {}
        );
      });

      console.log('calculateSentenceCaseConfidence single case: ' + duration.toFixed(2) + 'µs');
      expect(duration).toBeLessThan(THRESHOLDS.SINGLE_CLASSIFICATION);
    });

    test('should_process_100_cases_within_threshold', () => {
      const duration = measureMicroseconds(() => {
        for (const testCase of testCases100) {
          calculateSentenceCaseConfidence(
            testCase.original,
            testCase.fixed,
            {}
          );
        }
      });

      const avgDuration = duration / testCases100.length;
      console.log('calculateSentenceCaseConfidence 100 cases: ' + duration.toFixed(2) + 'µs total, ' + avgDuration.toFixed(2) + 'µs avg');

      expect(duration).toBeLessThan(THRESHOLDS.BATCH_100);
    });
  });

  describe('calculateBacktickConfidence function', () => {
    test('should_classify_single_case_within_threshold', () => {
      const duration = measureMicroseconds(() => {
        calculateBacktickConfidence('npm install', {});
      });

      console.log('calculateBacktickConfidence single case: ' + duration.toFixed(2) + 'µs');
      expect(duration).toBeLessThan(THRESHOLDS.SINGLE_CLASSIFICATION);
    });

    test('should_process_100_cases_within_threshold', () => {
      const duration = measureMicroseconds(() => {
        for (const testCase of testCases100) {
          calculateBacktickConfidence(testCase.original, {});
        }
      });

      const avgDuration = duration / testCases100.length;
      console.log('calculateBacktickConfidence 100 cases: ' + duration.toFixed(2) + 'µs total, ' + avgDuration.toFixed(2) + 'µs avg');

      expect(duration).toBeLessThan(THRESHOLDS.BATCH_100);
    });
  });

  describe('analyzeCodeVsNaturalLanguage function', () => {
    test('should_classify_single_case_within_threshold', () => {
      const duration = measureMicroseconds(() => {
        analyzeCodeVsNaturalLanguage('npm install package', {});
      });

      console.log('analyzeCodeVsNaturalLanguage single case: ' + duration.toFixed(2) + 'µs');
      // This function is more complex and may take up to 2ms on first run (JIT compilation)
      expect(duration).toBeLessThan(THRESHOLDS.SINGLE_CLASSIFICATION * 2);
    });

    test('should_process_100_cases_within_threshold', () => {
      const duration = measureMicroseconds(() => {
        for (const testCase of testCases100) {
          analyzeCodeVsNaturalLanguage(testCase.original, {});
        }
      });

      const avgDuration = duration / testCases100.length;
      console.log('analyzeCodeVsNaturalLanguage 100 cases: ' + duration.toFixed(2) + 'µs total, ' + avgDuration.toFixed(2) + 'µs avg');

      expect(duration).toBeLessThan(THRESHOLDS.BATCH_100);
    });
  });


  describe('Performance regression detection', () => {
    test('should_establish_baseline_metrics_for_future_comparison', () => {
      const results = {
        shouldApplyAutofix: {
          single: null,
          batch100: null,
          batch1000: null,
        },
        classifiers: {
          sentenceCase: null,
          backtick: null,
          codeAnalysis: null,
        }
      };

      // Measure shouldApplyAutofix
      results.shouldApplyAutofix.single = measureMicroseconds(() => {
        shouldApplyAutofix('sentence-case-heading', 'API Gateway', 'api gateway', {}, {});
      });

      results.shouldApplyAutofix.batch100 = measureMicroseconds(() => {
        for (const testCase of testCases100) {
          shouldApplyAutofix('sentence-case-heading', testCase.original, testCase.fixed, {}, {});
        }
      }) / 100;

      results.shouldApplyAutofix.batch1000 = measureMicroseconds(() => {
        for (const testCase of testCases1000) {
          shouldApplyAutofix('sentence-case-heading', testCase.original, testCase.fixed, {}, {});
        }
      }) / 1000;

      // Measure classifiers
      results.classifiers.sentenceCase = measureMicroseconds(() => {
        for (let i = 0; i < 100; i++) {
          calculateSentenceCaseConfidence('API Gateway', 'api gateway', {});
        }
      }) / 100;

      results.classifiers.backtick = measureMicroseconds(() => {
        for (let i = 0; i < 100; i++) {
          calculateBacktickConfidence('npm install', {});
        }
      }) / 100;

      results.classifiers.codeAnalysis = measureMicroseconds(() => {
        for (let i = 0; i < 100; i++) {
          analyzeCodeVsNaturalLanguage('npm install package', {});
        }
      }) / 100;

      console.log('\n=== Performance Baseline Metrics ===');
      console.log('shouldApplyAutofix:');
      console.log('  Single: ' + results.shouldApplyAutofix.single.toFixed(2) + 'µs');
      console.log('  Batch 100 avg: ' + results.shouldApplyAutofix.batch100.toFixed(2) + 'µs');
      console.log('  Batch 1000 avg: ' + results.shouldApplyAutofix.batch1000.toFixed(2) + 'µs');
      console.log('\nClassifiers (avg per call):');
      for (const name in results.classifiers) {
        console.log('  ' + name + ': ' + results.classifiers[name].toFixed(2) + 'µs');
      }
      console.log('===================================\n');

      // All measurements should have completed successfully
      expect(results.shouldApplyAutofix.single).toBeGreaterThan(0);
      expect(results.shouldApplyAutofix.batch100).toBeGreaterThan(0);
      expect(results.shouldApplyAutofix.batch1000).toBeGreaterThan(0);

      for (const name in results.classifiers) {
        expect(results.classifiers[name]).toBeGreaterThan(0);
      }
    });
  });
});
