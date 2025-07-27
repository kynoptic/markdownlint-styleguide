/**
 * @integration
 * Performance tests for rules against large markdown files.
 * Ensures rules maintain reasonable performance at scale.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, test, expect } from '@jest/globals';
import { lint } from 'markdownlint/promise';
import sentenceRule from '../../src/rules/sentence-case-heading.js';
import backtickRule from '../../src/rules/backtick-code-elements.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate a large markdown file for testing
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
 * Measure rule performance
 */
async function measureRulePerformance(rule, content, ruleName) {
  const start = process.hrtime.bigint();
  
  const results = await lint({
    customRules: [rule],
    strings: { test: content },
    resultVersion: 3
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
    contentLines: content.split('\n').length
  };
}

describe('Performance Tests', () => {
  const PERFORMANCE_THRESHOLD = 1000; // 1 second max for large files
  let largeContent;
  
  beforeAll(() => {
    largeContent = generateLargeMarkdownFile();
  });

  test('large content generation', () => {
    expect(largeContent.length).toBeGreaterThan(50000); // At least 50KB
    expect(largeContent.split('\n').length).toBeGreaterThan(1000); // At least 1000 lines
    
  });

  test('sentence-case-heading performance', async () => {
    const results = await measureRulePerformance(sentenceRule, largeContent, 'sentence-case-heading');
    
    
    // Performance assertions
    expect(results.duration).toBeLessThan(PERFORMANCE_THRESHOLD);
    expect(results.violations).toBeGreaterThan(0); // Should find some violations in our test content
  });

  test('backtick-code-elements performance', async () => {
    const results = await measureRulePerformance(backtickRule, largeContent, 'backtick-code-elements');
    
    
    expect(results.duration).toBeLessThan(PERFORMANCE_THRESHOLD);
    expect(results.violations).toBeGreaterThan(0);
  });

  test('performance comparison', async () => {
    const sentenceResults = await measureRulePerformance(sentenceRule, largeContent, 'sentence-case-heading');
    const backtickResults = await measureRulePerformance(backtickRule, largeContent, 'backtick-code-elements');
    
    const totalDuration = sentenceResults.duration + backtickResults.duration;
    
    // Both rules together should still be reasonable
    expect(totalDuration).toBeLessThan(PERFORMANCE_THRESHOLD * 2);
  });

  test('memory usage patterns', async () => {
    const memStart = process.memoryUsage();
    
    // Run rules multiple times to check for memory leaks
    for (let i = 0; i < 10; i++) {
      await measureRulePerformance(sentenceRule, largeContent, 'sentence-case-heading');
      await measureRulePerformance(backtickRule, largeContent, 'backtick-code-elements');
    }
    
    const memEnd = process.memoryUsage();
    const memDiff = memEnd.heapUsed - memStart.heapUsed;
    
    
    // Memory usage shouldn't grow excessively (allow some variance)
    expect(memDiff).toBeLessThan(50 * 1024 * 1024); // Less than 50MB growth
  });
});