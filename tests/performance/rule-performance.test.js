/**
 * @performance
 * Performance benchmarks for markdownlint-trap rules.
 * Tests execution time and memory usage for critical rule operations.
 */
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { lint } from 'markdownlint/promise';
import sentenceRule from '../../src/rules/sentence-case-heading.js';
import backtickRule from '../../src/rules/backtick-code-elements.js';
import noBareUrlsRule from '../../src/rules/no-bare-urls.js';
import noDeadLinksRule from '../../src/rules/no-dead-internal-links.js';
import noLiteralAmpersandRule from '../../src/rules/no-literal-ampersand.js';

// Performance thresholds (in milliseconds)
// Note: Thresholds are generous to account for CI environment variability
const THRESHOLDS = {
  LARGE_FILE: 3000, // 3 seconds max for large files (CI can be 2-3x slower)
  MEDIUM_FILE: 1500, // 1.5s max for medium files (1k-10k lines)
  SMALL_FILE: 300, // 300ms max for small files (<1k lines)
  MEMORY_GROWTH_MB: 100, // Max 100MB heap growth over 10 iterations
};

/**
 * Generate large markdown file for performance testing
 * @param {number} sections - Number of sections to generate
 * @returns {string} Generated markdown content
 */
function generateLargeMarkdown(sections = 100) {
  const parts = [];
  
  parts.push('# Performance Test Document\n\n');
  parts.push('This document is generated for performance testing of markdownlint-trap rules.\n\n');
  
  for (let i = 1; i <= sections; i++) {
    parts.push(`## Section ${i}: Working With APIs and Database Systems\n\n`);
    parts.push(`This section discusses API integration patterns, database.json configuration, `);
    parts.push(`and best practices for using GET /api/users endpoints.\n\n`);
    
    parts.push('Key points:\n\n');
    parts.push('- Configure your config.json file properly\n');
    parts.push('- Run npm install before starting development\n');
    parts.push('- Use the /api/v1/users endpoint for fetching data\n');
    parts.push('- Check src/utils/helpers.js for utility functions\n');
    parts.push('- Review docs/API.md for complete API documentation\n\n');
    
    for (let j = 1; j <= 3; j++) {
      parts.push(`### ${i}.${j} Implementation Details For Modern Applications\n\n`);
      parts.push(`Implementation guidance for section ${i}.${j} with code examples.\n\n`);
      
      parts.push('```javascript\n');
      parts.push('const config = require("./config.json");\n');
      parts.push('const server = new Server(config);\n');
      parts.push('server.listen(3000);\n');
      parts.push('```\n\n');
      
      parts.push('For more information, see https://example.com/docs or contact support@example.com\n\n');
    }
  }
  
  return parts.join('');
}

/**
 * Measure rule performance with detailed metrics
 * @param {Object} rule - Markdownlint rule
 * @param {string} content - Markdown content
 * @param {string} ruleName - Rule name for reporting
 * @returns {Promise<Object>} Performance metrics
 */
async function measureRulePerformance(rule, content, ruleName) {
  const memBefore = process.memoryUsage();
  const start = process.hrtime.bigint();

  // Import markdown-it dynamically for rules that need it
  const markdownIt = await import('markdown-it');

  const results = await lint({
    customRules: [rule],
    strings: { test: content },
    resultVersion: 3,
    config: { default: true },
    markdownItFactory: () => markdownIt.default()
  });

  const end = process.hrtime.bigint();
  const memAfter = process.memoryUsage();

  const duration = Number(end - start) / 1000000; // Convert to milliseconds
  const memoryDelta = (memAfter.heapUsed - memBefore.heapUsed) / (1024 * 1024); // MB

  const violations = results.test || [];
  const ruleViolations = violations.filter(v =>
    v.ruleNames.some(name => name.includes(ruleName.split('/')[0]))
  );

  return {
    duration,
    memoryDelta,
    violations: ruleViolations.length,
    contentLength: content.length,
    contentLines: content.split('\n').length,
    throughput: content.length / duration // chars per ms
  };
}

/**
 * Force garbage collection if available
 */
function tryGC() {
  if (typeof global.gc === 'function') {
    try {
      global.gc();
      return true;
    } catch (e) {
      return false;
    }
  }
  return false;
}

describe('Rule performance benchmarks', () => {
  let largeContent = null;
  let mediumContent = null;
  
  beforeAll(() => {
    largeContent = generateLargeMarkdown(100); // ~50KB+, 1000+ lines
    mediumContent = generateLargeMarkdown(25); // ~12KB, 250+ lines
    tryGC();
  });

  afterAll(() => {
    largeContent = null;
    mediumContent = null;
    tryGC();
  });

  describe('backtick-code-elements rule', () => {
    test('should_meet_performance_threshold_for_large_files', async () => {
      const metrics = await measureRulePerformance(backtickRule, largeContent, 'backtick-code-elements');
      
      console.log(`backtick-code-elements (large): ${metrics.duration.toFixed(2)}ms for ${metrics.contentLines} lines`);
      console.log(`  Throughput: ${metrics.throughput.toFixed(0)} chars/ms`);
      console.log(`  Violations: ${metrics.violations}`);
      
      expect(metrics.duration).toBeLessThan(THRESHOLDS.LARGE_FILE);
      expect(metrics.violations).toBeGreaterThan(0); // Should detect violations
    });

    test('should_meet_performance_threshold_for_medium_files', async () => {
      const metrics = await measureRulePerformance(backtickRule, mediumContent, 'backtick-code-elements');
      
      console.log(`backtick-code-elements (medium): ${metrics.duration.toFixed(2)}ms for ${metrics.contentLines} lines`);
      
      expect(metrics.duration).toBeLessThan(THRESHOLDS.MEDIUM_FILE);
    });

    test('should_maintain_consistent_performance_over_iterations', async () => {
      const iterations = 5;
      const durations = [];
      
      for (let i = 0; i < iterations; i++) {
        const metrics = await measureRulePerformance(backtickRule, mediumContent, 'backtick-code-elements');
        durations.push(metrics.duration);
      }
      
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const maxDuration = Math.max(...durations);
      const variance = maxDuration / avgDuration;
      
      console.log(`backtick-code-elements consistency: avg=${avgDuration.toFixed(2)}ms, max=${maxDuration.toFixed(2)}ms, variance=${variance.toFixed(2)}x`);
      
      // Variance should be less than 3x (accounting for GC pauses and CI variability)
      expect(variance).toBeLessThan(3);
    });
  });

  describe('sentence-case-heading rule', () => {
    test('should_meet_performance_threshold_for_large_files', async () => {
      const metrics = await measureRulePerformance(sentenceRule, largeContent, 'sentence-case-heading');
      
      console.log(`sentence-case-heading (large): ${metrics.duration.toFixed(2)}ms for ${metrics.contentLines} lines`);
      console.log(`  Throughput: ${metrics.throughput.toFixed(0)} chars/ms`);
      
      expect(metrics.duration).toBeLessThan(THRESHOLDS.LARGE_FILE);
    });

    test('should_meet_performance_threshold_for_medium_files', async () => {
      const metrics = await measureRulePerformance(sentenceRule, mediumContent, 'sentence-case-heading');
      
      console.log(`sentence-case-heading (medium): ${metrics.duration.toFixed(2)}ms for ${metrics.contentLines} lines`);
      
      expect(metrics.duration).toBeLessThan(THRESHOLDS.MEDIUM_FILE);
    });
  });

  describe('no-bare-urls rule', () => {
    test('should_meet_performance_threshold_for_large_files', async () => {
      const metrics = await measureRulePerformance(noBareUrlsRule, largeContent, 'no-bare-urls');
      
      console.log(`no-bare-urls (large): ${metrics.duration.toFixed(2)}ms for ${metrics.contentLines} lines`);
      
      expect(metrics.duration).toBeLessThan(THRESHOLDS.LARGE_FILE);
    });
  });

  describe('no-dead-internal-links rule', () => {
    test('should_meet_performance_threshold_for_large_files', async () => {
      const metrics = await measureRulePerformance(noDeadLinksRule, largeContent, 'no-dead-internal-links');
      
      console.log(`no-dead-internal-links (large): ${metrics.duration.toFixed(2)}ms for ${metrics.contentLines} lines`);
      
      expect(metrics.duration).toBeLessThan(THRESHOLDS.LARGE_FILE);
    });
  });

  describe('no-literal-ampersand rule', () => {
    test('should_meet_performance_threshold_for_large_files', async () => {
      const metrics = await measureRulePerformance(noLiteralAmpersandRule, largeContent, 'no-literal-ampersand');
      
      console.log(`no-literal-ampersand (large): ${metrics.duration.toFixed(2)}ms for ${metrics.contentLines} lines`);
      
      expect(metrics.duration).toBeLessThan(THRESHOLDS.LARGE_FILE);
    });
  });

  describe('Combined rule execution', () => {
    test('should_meet_combined_performance_threshold', async () => {
      const allRules = [sentenceRule, backtickRule, noBareUrlsRule, noDeadLinksRule, noLiteralAmpersandRule];

      const markdownIt = await import('markdown-it');
      const start = process.hrtime.bigint();

      await lint({
        customRules: allRules,
        strings: { test: largeContent },
        resultVersion: 3,
        config: { default: true },
        markdownItFactory: () => markdownIt.default()
      });

      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1000000;

      console.log(`Combined rules (all 5): ${duration.toFixed(2)}ms for ${largeContent.split('\n').length} lines`);

      // All rules together should complete in reasonable time
      expect(duration).toBeLessThan(THRESHOLDS.LARGE_FILE * 2);
    });

    test('should_maintain_memory_stability_over_iterations', async () => {
      const gcAvailable = tryGC();
      if (!gcAvailable) {
        console.log('Skipping memory stability test - GC not exposed (run with --expose-gc)');
        expect(true).toBe(true);
        return;
      }

      const allRules = [sentenceRule, backtickRule];
      const iterations = 10;
      const markdownIt = await import('markdown-it');

      tryGC();
      const memStart = process.memoryUsage();

      for (let i = 0; i < iterations; i++) {
        await lint({
          customRules: allRules,
          strings: { test: mediumContent },
          resultVersion: 3,
          config: { default: true },
          markdownItFactory: () => markdownIt.default()
        });

        if (i % 3 === 0) {
          tryGC();
        }
      }

      tryGC();
      await new Promise(resolve => setTimeout(resolve, 100));
      tryGC();

      const memEnd = process.memoryUsage();
      const heapGrowth = (memEnd.heapUsed - memStart.heapUsed) / (1024 * 1024);

      console.log(`Memory growth: ${heapGrowth.toFixed(2)}MB after ${iterations} iterations`);

      expect(heapGrowth).toBeLessThan(THRESHOLDS.MEMORY_GROWTH_MB);
    });
  });
});
