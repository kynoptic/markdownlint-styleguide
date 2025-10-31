// @ts-check

/**
 * Shared heuristics for markdownlint rules.
 *
 * This module consolidates common detection and preservation logic used across multiple rules,
 * particularly sentence-case-heading and backtick-code-elements. This ensures consistent
 * behavior and reduces code duplication.
 */

import { UPPERCASE_WORD_REGEX } from './shared-constants.js';

/**
 * Determines if a word is a short acronym (≤4 characters, all uppercase letters).
 * This heuristic allows short acronyms like API, HTTP, JSON, GDPR to remain uppercase
 * in sentence case contexts.
 *
 * @param {string} word - The word to check
 * @returns {boolean} True if the word is a valid short acronym
 *
 * @example
 * isAcronym('HTTP') // true
 * isAcronym('I') // true (single letter)
 * isAcronym('HELLO') // false (too long)
 * isAcronym('Http') // false (mixed case)
 * isAcronym('API2') // false (contains numbers)
 */

export function isAcronym(word) {
  if (!word || word.length === 0) {
    return false;
  }
  
  // Must be 4 characters or less
  if (word.length > 4) {
    return false;
  }
  
  // Must be all uppercase letters (no numbers or mixed case)
  return word === word.toUpperCase() && UPPERCASE_WORD_REGEX.test(word);
}

/**
 * Preserves markup segments in text by replacing them with placeholders.
 * This allows rules to process text without being confused by:
 * - Code spans (`code`)
 * - Markdown links ([text](url) or [text])
 * - Version numbers (v1.2.3, 2.0.0-beta)
 * - Dates (2023-10-15)
 * - Bold text (**bold** or __bold__)
 * - Italic text (*italic* or _italic_)
 * 
 * @param {string} text - The text to process
 * @returns {{processed: string, segments: string[]}} Processed text with placeholders and array of preserved segments
 * 
 * @example
 * const result = preserveSegments('Use `npm` v1.2.3 here');
 * // result.processed: 'Use __PRESERVED_0__ __PRESERVED_1__ here'
 * // result.segments: ['`npm`', 'v1.2.3']
 */
export function preserveSegments(text) {
  const segments = [];
  let processed = text;

  // Use NULL character as separator in placeholders since it can't appear in markdown text
  const PH = '\x00P';  // Placeholder start
  const PE = 'E\x00';  // Placeholder end

  // 1. Code spans first (highest priority)
  processed = processed.replace(/`([^`]+)`/g, (m) => {
    segments.push(m);
    return PH + (segments.length - 1) + PE;
  });

  // 2. Links (both inline and reference-style)
  processed = processed.replace(/\[[^\]]+\]\([^)]+\)|\[[^\]]+\]/g, (m) => {
    segments.push(m);
    return PH + (segments.length - 1) + PE;
  });

  // 3. Version numbers (but not already preserved)
  processed = processed.replace(/\b(v?\d+\.\d+(?:\.\d+)?(?:-[a-zA-Z0-9.]+)?)\b/g, (match, ...args) => {
    const fullMatch = args[args.length - 1];
    if (fullMatch.includes(PH)) return match;
    segments.push(match);
    return PH + (segments.length - 1) + PE;
  });

  // 4. Dates (YYYY-MM-DD format)
  processed = processed.replace(/\b(\d{4}-\d{2}-\d{2})\b/g, (match, ...args) => {
    const fullMatch = args[args.length - 1];
    if (fullMatch.includes(PH)) return match;
    segments.push(match);
    return PH + (segments.length - 1) + PE;
  });

  // 5. Bold text (asterisks and underscores)
  processed = processed.replace(/(\*\*|__)(.*?)\1/g, (m) => {
    segments.push(m);
    return PH + (segments.length - 1) + PE;
  });

  // 6. Italic text (asterisks and underscores)
  processed = processed.replace(/(\*|_)(.*?)\1/g, (m) => {
    segments.push(m);
    return PH + (segments.length - 1) + PE;
  });

  // Replace NULL-based placeholders with __PRESERVED_N__ format
  // eslint-disable-next-line no-control-regex
  const finalProcessed = processed.replace(new RegExp(PH.replace(/\x00/g, '\\x00') + '(\\d+)' + PE.replace(/\x00/g, '\\x00'), 'g'),
    (_, idx) => '__PRESERVED_' + idx + '__');

  return { processed: finalProcessed, segments };
}

/**
 * Restores preserved segments back into the processed text.
 * This is the inverse operation of preserveSegments().
 *
 * @param {string} processed - Text with __PRESERVED_N__ placeholders
 * @param {string[]} segments - Array of preserved segments
 * @returns {string} Original text with segments restored
 *
 * @example
 * const segments = ['`npm`', 'v1.2.3'];
 * restoreSegments('Use __PRESERVED_0__ __PRESERVED_1__ here', segments);
 * // Returns: 'Use `npm` v1.2.3 here'
 */
export function restoreSegments(processed, segments) {
  return processed.replace(/__PRESERVED_(\d+)__/g, (_, idx) => {
    const index = Number(idx);
    return segments[index] !== undefined ? segments[index] : '__PRESERVED_' + idx + '__';
  });
}

/**
 * Checks if a position range in a line is inside a code span (backticks).
 * This is used to avoid flagging code elements that are already properly marked up.
 * 
 * @param {string} line - The line to check
 * @param {number} start - Start position (0-indexed)
 * @param {number} end - End position (0-indexed, exclusive)
 * @returns {boolean} True if the range is inside a code span
 * 
 * @example
 * isInsideCodeSpan('Text `code here` more', 6, 15) // true
 * isInsideCodeSpan('Text `code here` more', 0, 4) // false
 */
export function isInsideCodeSpan(line, start, end) {
  // Fast path: if no backticks, definitely not in code
  if (!line.includes('`')) {
    return false;
  }

  // Find all code spans in the line
  const codeSpans = [];
  let i = 0;
  const lineLength = line.length;

  while (i < lineLength) {
    // Find the start of a potential code span
    const startTick = line.indexOf('`', i);
    if (startTick === -1) break;

    // Find the closing backtick
    const endTick = line.indexOf('`', startTick + 1);
    if (endTick === -1) break;

    // Add the code span (inclusive of backticks)
    codeSpans.push([startTick, endTick + 1]);

    // Move past this code span
    i = endTick + 1;
  }

  // Check if the range overlaps with any code span
  return codeSpans.some(([spanStart, spanEnd]) => start >= spanStart && end <= spanEnd);
}
