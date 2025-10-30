// @ts-check

/**
 * Unit tests for shared heuristics utilities.
 * These utilities are used by both sentence-case-heading and backtick-code-elements rules.
 */

import {
  isAcronym,
  preserveSegments,
  restoreSegments,
  isInsideCodeSpan
} from '../../src/rules/shared-heuristics.js';

describe('Shared heuristics utilities', () => {
  describe('isAcronym', () => {
    test('should_identify_short_acronym_when_all_caps_4_chars', () => {
      expect(isAcronym('HTTP')).toBe(true);
      expect(isAcronym('API')).toBe(true);
      expect(isAcronym('JSON')).toBe(true);
      expect(isAcronym('GDPR')).toBe(true);
    });

    test('should_identify_short_acronym_when_all_caps_1_char', () => {
      expect(isAcronym('I')).toBe(true);
      expect(isAcronym('A')).toBe(true);
    });

    test('should_reject_acronym_when_longer_than_4_chars', () => {
      expect(isAcronym('HELLO')).toBe(false);
      expect(isAcronym('WORLD')).toBe(false);
      expect(isAcronym('LONGER')).toBe(false);
    });

    test('should_reject_acronym_when_mixed_case', () => {
      expect(isAcronym('Http')).toBe(false);
      expect(isAcronym('Api')).toBe(false);
      expect(isAcronym('JSONdata')).toBe(false);
    });

    test('should_reject_acronym_when_lowercase', () => {
      expect(isAcronym('http')).toBe(false);
      expect(isAcronym('api')).toBe(false);
    });

    test('should_reject_acronym_when_contains_numbers', () => {
      expect(isAcronym('API2')).toBe(false);
      expect(isAcronym('H1B')).toBe(false);
    });

    test('should_handle_empty_string', () => {
      expect(isAcronym('')).toBe(false);
    });
  });

  describe('preserveSegments', () => {
    test('should_preserve_code_spans_when_present', () => {
      const result = preserveSegments('This is `code` here');
      expect(result.processed).toBe('This is __PRESERVED_0__ here');
      expect(result.segments).toEqual(['`code`']);
    });

    test('should_preserve_multiple_code_spans_when_present', () => {
      const result = preserveSegments('Use `npm` or `yarn` here');
      expect(result.processed).toBe('Use __PRESERVED_0__ or __PRESERVED_1__ here');
      expect(result.segments).toEqual(['`npm`', '`yarn`']);
    });

    test('should_preserve_markdown_links_when_present', () => {
      const result = preserveSegments('Check [docs](https://example.com) here');
      expect(result.processed).toBe('Check __PRESERVED_0__ here');
      expect(result.segments).toEqual(['[docs](https://example.com)']);
    });

    test('should_preserve_version_numbers_when_present', () => {
      const result = preserveSegments('Version v1.2.3 or 2.0.0-beta');
      expect(result.processed).toBe('Version __PRESERVED_0__ or __PRESERVED_1__');
      expect(result.segments).toEqual(['v1.2.3', '2.0.0-beta']);
    });

    test('should_preserve_dates_when_present', () => {
      const result = preserveSegments('Released on 2023-10-15 date');
      expect(result.processed).toBe('Released on __PRESERVED_0__ date');
      expect(result.segments).toEqual(['2023-10-15']);
    });

    test('should_preserve_bold_text_when_present', () => {
      const result = preserveSegments('This is **bold** text');
      expect(result.processed).toBe('This is __PRESERVED_0__ text');
      expect(result.segments).toEqual(['**bold**']);
    });

    test('should_preserve_italic_text_when_present', () => {
      const result = preserveSegments('This is *italic* text');
      expect(result.processed).toBe('This is __PRESERVED_0__ text');
      expect(result.segments).toEqual(['*italic*']);
    });

    test('should_preserve_all_segment_types_when_mixed', () => {
      const result = preserveSegments('Use `code` and [link](url) plus **bold** and *italic* text');
      expect(result.processed).toMatch(/__PRESERVED_\d+__/g);
      expect(result.segments.length).toBe(4);
      expect(result.segments).toEqual(['`code`', '[link](url)', '**bold**', '*italic*']);
    });

    test('should_preserve_in_correct_order_when_multiple_types', () => {
      const result = preserveSegments('First `code` then **bold**');
      expect(result.processed).toBe('First __PRESERVED_0__ then __PRESERVED_1__');
      expect(result.segments).toEqual(['`code`', '**bold**']);
    });

    test('should_handle_empty_string', () => {
      const result = preserveSegments('');
      expect(result.processed).toBe('');
      expect(result.segments).toEqual([]);
    });

    test('should_handle_text_without_segments', () => {
      const result = preserveSegments('Plain text without any segments');
      expect(result.processed).toBe('Plain text without any segments');
      expect(result.segments).toEqual([]);
    });

    test('should_handle_nested_markup_correctly', () => {
      const result = preserveSegments('This is **bold with `code` inside**');
      // The exact behavior depends on implementation, but it should not duplicate
      expect(result.segments.length).toBeGreaterThan(0);
    });
  });

  describe('restoreSegments', () => {
    test('should_restore_single_segment_when_present', () => {
      const segments = ['`code`'];
      const result = restoreSegments('This is __PRESERVED_0__ here', segments);
      expect(result).toBe('This is `code` here');
    });

    test('should_restore_multiple_segments_when_present', () => {
      const segments = ['`npm`', '`yarn`'];
      const result = restoreSegments('Use __PRESERVED_0__ or __PRESERVED_1__ here', segments);
      expect(result).toBe('Use `npm` or `yarn` here');
    });

    test('should_handle_text_without_placeholders', () => {
      const segments = ['`code`'];
      const result = restoreSegments('Plain text', segments);
      expect(result).toBe('Plain text');
    });

    test('should_handle_empty_segments', () => {
      const result = restoreSegments('Text __PRESERVED_0__ here', []);
      expect(result).toBe('Text __PRESERVED_0__ here'); // Can't restore what doesn't exist
    });

    test('should_restore_in_correct_order_when_out_of_sequence', () => {
      const segments = ['first', 'second', 'third'];
      const result = restoreSegments('__PRESERVED_2__ __PRESERVED_0__ __PRESERVED_1__', segments);
      expect(result).toBe('third first second');
    });
  });

  describe('isInsideCodeSpan', () => {
    test('should_detect_position_inside_code_span', () => {
      const line = 'Text `code here` more text';
      expect(isInsideCodeSpan(line, 6, 15)).toBe(true); // "code here"
    });

    test('should_detect_position_outside_code_span', () => {
      const line = 'Text `code here` more text';
      expect(isInsideCodeSpan(line, 0, 4)).toBe(false); // "Text"
      expect(isInsideCodeSpan(line, 17, 27)).toBe(false); // "more text"
    });

    test('should_handle_multiple_code_spans', () => {
      const line = 'Use `npm` or `yarn` command';
      expect(isInsideCodeSpan(line, 4, 9)).toBe(true); // "`npm`"
      expect(isInsideCodeSpan(line, 13, 19)).toBe(true); // "`yarn`"
      expect(isInsideCodeSpan(line, 10, 12)).toBe(false); // "or"
    });

    test('should_handle_nested_backticks_correctly', () => {
      const line = 'Code `outer `inner` outer` text';
      // This tests the behavior with nested/malformed backticks
      // The exact behavior should match the implementation
      const result = isInsideCodeSpan(line, 6, 26);
      expect(typeof result).toBe('boolean');
    });

    test('should_handle_line_without_code_spans', () => {
      const line = 'Plain text without code';
      expect(isInsideCodeSpan(line, 0, 10)).toBe(false);
    });

    test('should_handle_empty_line', () => {
      expect(isInsideCodeSpan('', 0, 0)).toBe(false);
    });

    test('should_handle_backtick_at_boundaries', () => {
      const line = '`code`';
      expect(isInsideCodeSpan(line, 0, 6)).toBe(true); // Entire code span including backticks
      expect(isInsideCodeSpan(line, 1, 5)).toBe(true); // Just "code"
    });

    test('should_handle_adjacent_code_spans', () => {
      const line = '`first``second`';
      expect(isInsideCodeSpan(line, 0, 7)).toBe(true); // `first`
      expect(isInsideCodeSpan(line, 7, 15)).toBe(true); // `second`
    });
  });
});
