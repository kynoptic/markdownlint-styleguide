/**
 * @integration
 * Correctness tests for shared code-block and inline-code detection utilities.
 * Execution-time and memory benchmarks for the same functions live in
 * tests/performance/shared-utils-performance.test.js (isolated single-worker run).
 */
import { describe, test, expect } from '@jest/globals';
import {
  getCodeBlockLines,
  isInInlineCode,
  getInlineCodeSpans
} from '../../src/rules/shared-utils.js';

describe('Shared utility detection correctness', () => {
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

    // Adjacent backticks (double backticks without matching close = not a code span per CommonMark)
    expect(getInlineCodeSpans('test `` empty')).toEqual([]);
    // Double backticks with matching close = valid code span
    expect(getInlineCodeSpans('test ``code`` end')).toEqual([[5, 13]]);

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
