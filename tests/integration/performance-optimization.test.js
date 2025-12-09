/**
 * @integration
 * Performance tests for optimized code block detection and shared utilities.
 * Validates that optimizations improve performance without changing behavior.
 */
import { describe, test, expect } from '@jest/globals';
import { 
  getCodeBlockLines, 
  isInInlineCode, 
  getInlineCodeSpans 
} from '../../src/rules/shared-utils.js';

/**
 * Generate a large document with various code block patterns
 * @param {number} sectionCount - Number of sections to generate
 * @returns {string[]} Array of lines
 */
function generateLargeDocument(sectionCount = 100) {
  const lines = [];
  
  for (let i = 1; i <= sectionCount; i++) {
    lines.push(`# Section ${i}: Code Examples`);
    lines.push('');
    lines.push('This section contains various code patterns:');
    lines.push('');
    
    // Add fenced code blocks
    lines.push('```javascript');
    lines.push('const config = {');
    lines.push(`  sectionId: ${i},`);
    lines.push('  enabled: true');
    lines.push('};');
    lines.push('```');
    lines.push('');
    
    // Add indented code blocks
    lines.push('Example with indented code:');
    lines.push('');
    lines.push('    function processSection() {');
    lines.push('        return true;');
    lines.push('    }');
    lines.push('');
    
    // Add mixed content with inline code
    lines.push(`Check the \`config.json\` file and \`section-${i}.js\` module.`);
    lines.push('');
    
    // Add nested fenced blocks
    lines.push('~~~markdown');
    lines.push('```javascript');
    lines.push('// Nested code example');
    lines.push('console.log("nested");');
    lines.push('```');
    lines.push('~~~');
    lines.push('');
  }
  
  return lines;
}

describe('Performance Optimization Tests', () => {
  
  describe('Code Block Detection Performance', () => {
    test('processes large documents efficiently', () => {
      const largeDoc = generateLargeDocument(200);
      const totalLines = largeDoc.length;
      
      console.log(`Testing code block detection on ${totalLines} lines...`);
      
      const startTime = process.hrtime.bigint();
      const codeBlockLines = getCodeBlockLines(largeDoc);
      const endTime = process.hrtime.bigint();
      
      const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
      
      // Should complete within reasonable time (500ms for large document)
      expect(duration).toBeLessThan(500);
      expect(codeBlockLines).toHaveLength(totalLines);
      
      // Verify some expected results
      const codeBlockCount = codeBlockLines.filter(Boolean).length;
      expect(codeBlockCount).toBeGreaterThan(100); // Should find many code blocks
      
      console.log(`Processed ${totalLines} lines in ${duration.toFixed(2)}ms (${codeBlockCount} code block lines)`);
    });

    test('caching returns consistent results', () => {
      const largeDoc = generateLargeDocument(100);

      // Warm-up run to stabilize JIT compilation
      getCodeBlockLines(largeDoc);

      // First measured run
      const result1 = getCodeBlockLines(largeDoc);

      // Second run (should use cached result)
      const result2 = getCodeBlockLines(largeDoc);

      // Third run (should use cached result)
      const result3 = getCodeBlockLines(largeDoc);

      // All results should be identical (validates cache correctness)
      expect(result2).toEqual(result1);
      expect(result3).toEqual(result1);

      // Verify the results are actually the expected format
      expect(result1).toHaveLength(largeDoc.length);
      expect(Array.isArray(result1)).toBe(true);
      expect(result1.every(val => typeof val === 'boolean')).toBe(true);

      // Document actual performance characteristics without brittle assertions
      const iterations = 10;
      const timings = [];

      for (let i = 0; i < iterations; i++) {
        const start = process.hrtime.bigint();
        getCodeBlockLines(largeDoc);
        const end = process.hrtime.bigint();
        timings.push(Number(end - start) / 1000000);
      }

      const avgDuration = timings.reduce((sum, t) => sum + t, 0) / timings.length;
      const minDuration = Math.min(...timings);
      const maxDuration = Math.max(...timings);

      console.log(`Cache performance over ${iterations} iterations:`);
      console.log(`  Average: ${avgDuration.toFixed(2)}ms`);
      console.log(`  Min: ${minDuration.toFixed(2)}ms`);
      console.log(`  Max: ${maxDuration.toFixed(2)}ms`);
      console.log(`  Variation: ${((maxDuration - minDuration) / avgDuration * 100).toFixed(1)}%`);

      // Sanity check: cached operations should complete in reasonable time
      // This is a very loose threshold to catch severe regressions without being flaky
      expect(avgDuration).toBeLessThan(100); // 100ms is very generous for cached access
    });
  });

  describe('Inline Code Detection Performance', () => {
    test('handles lines with many backticks efficiently', () => {
      // Create a line with many inline code spans
      const complexLine = Array.from({ length: 100 }, (_, i) => 
        `code${i}`
      ).map(code => `\`${code}\``).join(' and ') + ' with text between spans';
      
      const startTime = process.hrtime.bigint();
      
      // Test multiple positions across the line
      const results = [];
      for (let pos = 0; pos < complexLine.length; pos += 10) {
        results.push(isInInlineCode(complexLine, pos));
      }
      
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000;
      
      // Should complete quickly even with many backticks
      expect(duration).toBeLessThan(10);
      expect(results.length).toBeGreaterThan(0);
      
      console.log(`Processed ${complexLine.length} character line with ${results.length} position checks in ${duration.toFixed(2)}ms`);
    });

    test('extracts inline code spans efficiently', () => {
      const lines = Array.from({ length: 1000 }, (_, i) => 
        `Line ${i} has \`code1\` and \`code2\` and \`code3\` spans.`
      );
      
      const startTime = process.hrtime.bigint();
      
      const allSpans = lines.map(line => getInlineCodeSpans(line));
      
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000;
      
      // Should complete quickly
      expect(duration).toBeLessThan(100);
      
      // Verify results
      const totalSpans = allSpans.reduce((sum, spans) => sum + spans.length, 0);
      expect(totalSpans).toBe(3000); // 3 spans per line × 1000 lines
      
      console.log(`Extracted ${totalSpans} code spans from ${lines.length} lines in ${duration.toFixed(2)}ms`);
    });
  });

  describe('Optimization Correctness', () => {
    test('optimized functions produce same results as before', () => {
      const testDoc = [
        '# Test Document',
        '',
        'Regular text with `inline code` here.',
        '',
        '```javascript',
        'const x = "code block";',
        '```',
        '',
        '    indented code block',
        '',
        'More text with `multiple` `code` `spans`.',
        '',
        '~~~python',
        'print("nested test")',
        '```javascript',
        'console.log("nested");',
        '```',
        '~~~',
        ''
      ];

      const codeBlockResults = getCodeBlockLines(testDoc);
      
      // Verify expected code block detection
      expect(codeBlockResults[0]).toBe(false); // # Test Document
      expect(codeBlockResults[2]).toBe(false); // Regular text with inline code
      expect(codeBlockResults[4]).toBe(true);  // ```javascript
      expect(codeBlockResults[5]).toBe(true);  // const x = "code block";
      expect(codeBlockResults[6]).toBe(true);  // ```
      expect(codeBlockResults[8]).toBe(true);  // indented code block
      expect(codeBlockResults[10]).toBe(false); // More text with multiple code spans
      expect(codeBlockResults[12]).toBe(true); // ~~~python
      expect(codeBlockResults[13]).toBe(true); // print("nested test")
      expect(codeBlockResults[17]).toBe(true); // ~~~

      // Test inline code detection
      const testLine = 'Check `config.json` and `package.json` files.';
      expect(isInInlineCode(testLine, 0)).toBe(false);  // 'C' in 'Check'
      expect(isInInlineCode(testLine, 7)).toBe(true);   // 'c' in 'config.json'
      expect(isInInlineCode(testLine, 19)).toBe(false); // 'a' in 'and'
      expect(isInInlineCode(testLine, 25)).toBe(true);  // 'p' in 'package.json'

      // Test code span extraction
      const spans = getInlineCodeSpans(testLine);
      expect(spans).toHaveLength(2);
      expect(spans[0]).toEqual([6, 19]); // `config.json`
      expect(spans[1]).toEqual([24, 38]); // `package.json`
    });

    test('handles edge cases correctly', () => {
      // Empty document
      expect(getCodeBlockLines([])).toEqual([]);
      
      // No backticks
      expect(isInInlineCode('no code here', 5)).toBe(false);
      expect(getInlineCodeSpans('no code here')).toEqual([]);
      
      // Unclosed backticks
      expect(isInInlineCode('unclosed `code', 12)).toBe(true);
      expect(getInlineCodeSpans('unclosed `code')).toEqual([]);
      
      // Adjacent backticks
      expect(getInlineCodeSpans('test `` empty')).toEqual([[5, 7]]);
      
      // Multiple fence types
      const mixedFences = [
        '```javascript',
        'code1',
        '```',
        '~~~python', 
        'code2',
        '~~~'
      ];
      const mixedResults = getCodeBlockLines(mixedFences);
      expect(mixedResults).toEqual([true, true, true, true, true, true]);
    });
  });

  describe('Memory Usage Optimization', () => {
    test('caching does not cause memory leaks', () => {
      // Process multiple different documents to test cache behavior
      const documents = Array.from({ length: 10 }, (_, i) => 
        generateLargeDocument(20).map(line => `${line}_${i}`)
      );
      
      const startMemory = process.memoryUsage().heapUsed;
      
      // Process each document multiple times
      documents.forEach(doc => {
        for (let i = 0; i < 3; i++) {
          getCodeBlockLines(doc);
        }
      });
      
      // Force garbage collection if available
      if (typeof global.gc === 'function') {
        global.gc();
      }
      
      const endMemory = process.memoryUsage().heapUsed;
      const memoryGrowth = (endMemory - startMemory) / 1024 / 1024; // MB
      
      // Memory growth should be reasonable (less than 50MB for this test)
      expect(memoryGrowth).toBeLessThan(50);
      
      console.log(`Memory growth: ${memoryGrowth.toFixed(2)}MB after processing ${documents.length} documents`);
    });
  });
});