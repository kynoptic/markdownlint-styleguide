"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getCodeBlockLines = getCodeBlockLines;
exports.getInlineCodeSpans = getInlineCodeSpans;
exports.isInCodeSpan = isInCodeSpan;
exports.isInInlineCode = isInInlineCode;
exports.updateCodeBlockState = updateCodeBlockState;
// @ts-check

/**
 * Shared utilities for markdownlint rules.
 * Contains common functions used across multiple rules to avoid duplication.
 */

/**
 * Cache for code block detection results to improve performance
 * when multiple rules process the same document.
 */
const codeBlockCache = new WeakMap();

/**
 * Generate a cache key from document lines for code block detection.
 * @param {string[]} lines - Document lines
 * @returns {string} Cache key
 */
function getCacheKey(lines) {
  // Use a simple hash of the first few and last few lines plus total count
  // This provides a reasonable cache key without processing the entire document
  const sampleLines = [...lines.slice(0, Math.min(3, lines.length)), ...lines.slice(Math.max(0, lines.length - 3))];
  return `${lines.length}:${sampleLines.join('|')}`;
}

/**
 * Analyzes all lines in a document to determine which lines are inside code blocks.
 * Handles both fenced code blocks (``` and ~~~) and indented code blocks.
 * Optimized for performance with large documents and many nested code blocks.
 * 
 * @param {string[]} lines - All lines in the document
 * @returns {boolean[]} Array indicating which lines are in code blocks (same length as input)
 */
function getCodeBlockLines(lines) {
  // Check cache first for performance when multiple rules process same document
  const cacheKey = getCacheKey(lines);
  let cachedResults = codeBlockCache.get(lines);
  if (cachedResults && cachedResults.key === cacheKey) {
    return cachedResults.result;
  }
  const lineCount = lines.length;
  const inCodeBlock = new Array(lineCount).fill(false);
  let currentFenceType = null;
  let fenceLength = 0;

  // Pre-compile regex patterns for better performance
  const fenceRegex = /^(`{3,}|~{3,})/;
  const indentRegex = /^(?: {4}|\t)/;
  for (let i = 0; i < lineCount; i++) {
    const line = lines[i];

    // Fast path: skip empty lines when not in fenced code block
    if (currentFenceType === null && line.length === 0) {
      continue;
    }
    const trimmed = line.trim();

    // Fast path: skip lines that definitely can't be fences
    if (trimmed.length >= 3 && (trimmed[0] === '`' || trimmed[0] === '~')) {
      const fenceMatch = fenceRegex.exec(trimmed);
      if (fenceMatch) {
        const detectedFenceType = fenceMatch[1][0]; // '`' or '~'
        const detectedFenceLength = fenceMatch[1].length;
        if (currentFenceType === null) {
          // Starting a code block
          currentFenceType = detectedFenceType;
          fenceLength = detectedFenceLength;
          inCodeBlock[i] = true;
        } else if (currentFenceType === detectedFenceType && detectedFenceLength >= fenceLength) {
          // Ending a code block (must be same type and at least as long)
          inCodeBlock[i] = true;
          currentFenceType = null;
          fenceLength = 0;
        } else {
          // Different fence type or shorter fence while in code block - treat as content
          inCodeBlock[i] = true;
        }
        continue;
      }
    }
    if (currentFenceType !== null) {
      // Inside a fenced code block
      inCodeBlock[i] = true;
    } else {
      // Check for indented code blocks (4 spaces or 1 tab at start of line)
      // Only consider it a code block if the line has content after indentation
      if (line.length > 4 && indentRegex.test(line) && trimmed !== '') {
        inCodeBlock[i] = true;
      }
    }
  }

  // Cache the result for future use
  codeBlockCache.set(lines, {
    key: cacheKey,
    result: inCodeBlock
  });
  return inCodeBlock;
}

/**
 * Simple code block detection for single-pass processing.
 * Updates the inCodeBlock state as it processes each line.
 * 
 * @param {string} line - Current line being processed
 * @param {boolean} currentState - Current inCodeBlock state
 * @returns {{ inCodeBlock: boolean, updated: boolean }} New state and whether it changed
 */
function updateCodeBlockState(line, currentState) {
  const trimmed = line.trim();

  // Check for fenced code blocks
  const fenceMatch = trimmed.match(/^(`{3,}|~{3,})/);
  if (fenceMatch) {
    return {
      inCodeBlock: !currentState,
      updated: true
    };
  }
  return {
    inCodeBlock: currentState,
    updated: false
  };
}

/**
 * Check if a character position is inside inline code (backticks).
 * Optimized for performance by avoiding unnecessary character-by-character iteration.
 * 
 * @param {string} line - The line content
 * @param {number} position - Character position to check
 * @returns {boolean} True if position is inside inline code
 */
function isInInlineCode(line, position) {
  // Fast path: if position is beyond line length or no backticks, definitely not in code
  if (position >= line.length || !line.includes('`')) {
    return false;
  }

  // Fast path: use indexOf to jump between backticks instead of checking every character
  let backtickCount = 0;
  let searchStart = 0;
  let backtickPos = line.indexOf('`', searchStart);
  while (backtickPos !== -1 && backtickPos < position) {
    backtickCount++;
    searchStart = backtickPos + 1;
    backtickPos = line.indexOf('`', searchStart);
  }

  // If odd number of backticks before position, we're inside inline code
  return backtickCount % 2 === 1;
}

/**
 * Extract all inline code spans from a line.
 * Optimized to handle nested backticks and complex patterns correctly.
 * 
 * @param {string} line - The line content
 * @returns {Array<[number, number]>} Array of [start, end] positions for code spans
 */
function getInlineCodeSpans(line) {
  const codeSpans = [];

  // Fast path: no backticks means no code spans
  if (!line.includes('`')) {
    return codeSpans;
  }
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
  return codeSpans;
}

/**
 * Check if a position range is inside any inline code span.
 * 
 * @param {Array<[number, number]>} codeSpans - Code span ranges from getInlineCodeSpans
 * @param {number} start - Start position to check
 * @param {number} end - End position to check
 * @returns {boolean} True if the range overlaps with any code span
 */
function isInCodeSpan(codeSpans, start, end) {
  return codeSpans.some(([spanStart, spanEnd]) => start >= spanStart && end <= spanEnd);
}