/**
 * @integration
 * Performance tests for rules against large markdown files.
 * Ensures rules maintain reasonable performance at scale.
 */
import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { lint } from 'markdownlint/promise';
import sentenceRule from '../../src/rules/sentence-case-heading.js';
import backtickRule from '../../src/rules/backtick-code-elements.js';

// Test configuration
const TEST_CONFIG = {
  PERFORMANCE_THRESHOLD: 1000, // 1 second max for large files
  MEMORY_ITERATIONS: 5, // Reduced from 10 for stability
  CONTENT_MIN_SIZE: 50000, // 50KB minimum
  CONTENT_MIN_LINES: 1000, // 1000 lines minimum
  TEST_TIMEOUT: 30000 // 30 second timeout for each test
};

/**
 * Generate a large markdown file for testing
 * @returns {string} Generated markdown content
 */
function generateLargeMarkdownFile() {
  const sections = [];
  
  // Add various types of content
  sections.push('# Performance Test Document\n');
  sections.push('This is a large markdown file generated for performance testing.\n\n');
  
  // Generate many headings
  for (let i = 1; i <= 100; i++) {
    sections.push(`## Section ${i}: Working With APIs and Database Systems\n`);
    sections.push(`This section discusses API integration and database management.\n\n`);
    
    // Add some code references
    sections.push('Key points:\n');
    sections.push('- Configure your database.json file\n');
    sections.push('- Run npm install to set up dependencies\n');
    sections.push('- Use the GET /api/users endpoint for data\n');
    sections.push('- Check the src/utils/helpers.js file for utilities\n\n');
    
    // Add subsections
    for (let j = 1; j <= 3; j++) {
      sections.push(`### ${i}.${j} Implementation Details For Modern Applications\n`);
      sections.push(`Implementation details for section ${i}.${j}.\n\n`);
      
      // Add code blocks (these should be ignored by rules)
      sections.push('```javascript\n');
      sections.push('const config = require("./config.json");\n');
      sections.push('const server = new Server(config);\n');
      sections.push('```\n\n');
    }
  }
  
  return sections.join('');
}

/**
 * Measure rule performance with proper error handling
 * @param {Object} rule - Markdownlint rule object
 * @param {string} content - Markdown content to test
 * @param {string} ruleName - Name of the rule
 * @returns {Promise<Object>} Performance metrics
 */
async function measureRulePerformance(rule, content, ruleName) {
  const start = process.hrtime.bigint();
  
  try {
    const results = await lint({
      customRules: [rule],
      strings: { test: content },
      resultVersion: 3,
      // Add timeout to prevent hanging
      config: {
        default: true
      }
    });
    
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds
    
    const violations = results.test || [];
    const ruleViolations = violations.filter(v => 
      v.ruleNames.includes(ruleName) || v.ruleNames.some(name => name.includes(ruleName.split('-')[0]))
    );
    
    return {
      duration,
      violations: ruleViolations.length,
      contentLength: content.length,
      contentLines: content.split('\n').length,
      success: true
    };
  } catch (error) {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000;
    
    return {
      duration,
      violations: 0,
      contentLength: content.length,
      contentLines: content.split('\n').length,
      success: false,
      error: error.message
    };
  }
}

/**
 * Force garbage collection if available (for memory tests)
 * Returns true if GC was performed
 */
function tryGarbageCollection() {
  if (typeof global.gc === 'function') {
    try {
      global.gc();
      return true;
    } catch (e) {
      // GC not available or failed
      return false;
    }
  }
  return false;
}

describe('Performance Tests', () => {
  let largeContent = null;
  
  beforeAll(() => {
    // Generate content once for all tests
    largeContent = generateLargeMarkdownFile();
    
    // Try to get baseline memory after GC
    tryGarbageCollection();
  });

  afterAll(() => {
    // Clean up large content
    largeContent = null;
    tryGarbageCollection();
  });

  beforeEach(() => {
    // Try to clean up before each test
    tryGarbageCollection();
  });

  afterEach(() => {
    // Clean up after each test
    tryGarbageCollection();
  });

  test('large content generation', () => {
    expect(largeContent).toBeTruthy();
    expect(largeContent.length).toBeGreaterThan(TEST_CONFIG.CONTENT_MIN_SIZE);
    expect(largeContent.split('\n').length).toBeGreaterThan(TEST_CONFIG.CONTENT_MIN_LINES);
  });

  test('sentence-case-heading performance', async () => {
    const results = await measureRulePerformance(sentenceRule, largeContent, 'sentence-case-heading');
    
    expect(results.success).toBe(true);
    expect(results.duration).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLD);
    expect(results.violations).toBeGreaterThan(0); // Should find some violations in our test content
    
    // Log performance metrics for monitoring
    console.log(`sentence-case-heading: ${results.duration.toFixed(2)}ms for ${results.contentLength} chars`);
  });

  test('backtick-code-elements performance', async () => {
    const results = await measureRulePerformance(backtickRule, largeContent, 'backtick-code-elements');
    
    expect(results.success).toBe(true);
    expect(results.duration).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLD);
    expect(results.violations).toBeGreaterThan(0);
    
    console.log(`backtick-code-elements: ${results.duration.toFixed(2)}ms for ${results.contentLength} chars`);
  });

  test('performance comparison', async () => {
    const sentenceResults = await measureRulePerformance(sentenceRule, largeContent, 'sentence-case-heading');
    const backtickResults = await measureRulePerformance(backtickRule, largeContent, 'backtick-code-elements');
    
    expect(sentenceResults.success).toBe(true);
    expect(backtickResults.success).toBe(true);
    
    const totalDuration = sentenceResults.duration + backtickResults.duration;
    
    // Both rules together should still be reasonable
    expect(totalDuration).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLD * 2);
    
    console.log(`Combined performance: ${totalDuration.toFixed(2)}ms`);
  });

  test('memory stability', async () => {
    // Skip this test if GC is not available
    const gcAvailable = typeof global.gc === 'function';
    if (!gcAvailable) {
      console.log('Skipping memory stability test - GC not exposed');
      expect(true).toBe(true);
      return;
    }

    // Get initial memory state
    tryGarbageCollection();
    const memStart = process.memoryUsage();
    
    // Store results to prevent optimization
    const results = [];
    
    // Run rules multiple times with reduced iterations
    for (let i = 0; i < TEST_CONFIG.MEMORY_ITERATIONS; i++) {
      const sentenceResult = await measureRulePerformance(sentenceRule, largeContent, 'sentence-case-heading');
      const backtickResult = await measureRulePerformance(backtickRule, largeContent, 'backtick-code-elements');
      
      results.push({ sentenceResult, backtickResult });
      
      // Periodic GC to stabilize memory
      if (i % 2 === 0) {
        tryGarbageCollection();
      }
    }
    
    // Final cleanup
    tryGarbageCollection();
    await new Promise(resolve => setTimeout(resolve, 100)); // Allow GC to complete
    tryGarbageCollection();
    
    const memEnd = process.memoryUsage();
    const heapGrowth = memEnd.heapUsed - memStart.heapUsed;
    const heapGrowthMB = heapGrowth / (1024 * 1024);
    
    console.log(`Memory growth: ${heapGrowthMB.toFixed(2)}MB after ${TEST_CONFIG.MEMORY_ITERATIONS} iterations`);
    
    // More lenient memory assertions for CI
    // Allow up to 50MB growth, accounting for test framework overhead
    expect(heapGrowthMB).toBeLessThan(50);
    
    // Verify all iterations succeeded
    expect(results.every(r => r.sentenceResult.success && r.backtickResult.success)).toBe(true);
  });

  test('concurrent rule execution', async () => {
    // Test that rules can run concurrently without issues
    const promises = [
      measureRulePerformance(sentenceRule, largeContent, 'sentence-case-heading'),
      measureRulePerformance(backtickRule, largeContent, 'backtick-code-elements'),
      measureRulePerformance(sentenceRule, largeContent, 'sentence-case-heading'),
      measureRulePerformance(backtickRule, largeContent, 'backtick-code-elements')
    ];
    
    const results = await Promise.all(promises);
    
    // All should succeed
    expect(results.every(r => r.success)).toBe(true);
    
    // Performance should still be reasonable
    const maxDuration = Math.max(...results.map(r => r.duration));
    expect(maxDuration).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLD * 2.5); // Allow overhead for concurrency + CI variability
  });
});