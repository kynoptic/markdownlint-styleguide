// @ts-check

/**
 * Shared utilities for markdownlint rules.
 * Contains common functions used across multiple rules to avoid duplication.
 */

/**
 * Analyzes all lines in a document to determine which lines are inside code blocks.
 * Handles both fenced code blocks (``` and ~~~) and indented code blocks.
 * 
 * @param {string[]} lines - All lines in the document
 * @returns {boolean[]} Array indicating which lines are in code blocks (same length as input)
 */
export function getCodeBlockLines(lines) {
  const inCodeBlock = new Array(lines.length).fill(false);
  let currentFenceType = null;
  let fenceLength = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Check for fenced code blocks (``` or ~~~)
    const fenceMatch = trimmed.match(/^(`{3,}|~{3,})/);
    
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
    } else if (currentFenceType !== null) {
      // Inside a fenced code block
      inCodeBlock[i] = true;
    } else {
      // Check for indented code blocks (4 spaces or 1 tab at start of line)
      // Only consider it a code block if the line has content after indentation
      if ((/^ {4}/.test(line) || /^\t/.test(line)) && line.trim() !== '') {
        inCodeBlock[i] = true;
      }
    }
  }
  
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
export function updateCodeBlockState(line, currentState) {
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
 * 
 * @param {string} line - The line content
 * @param {number} position - Character position to check
 * @returns {boolean} True if position is inside inline code
 */
export function isInInlineCode(line, position) {
  let backtickCount = 0;
  for (let i = 0; i < position; i++) {
    if (line[i] === '`') {
      backtickCount++;
    }
  }
  // If odd number of backticks before position, we're inside inline code
  return backtickCount % 2 === 1;
}

/**
 * Extract all inline code spans from a line.
 * 
 * @param {string} line - The line content
 * @returns {Array<[number, number]>} Array of [start, end] positions for code spans
 */
export function getInlineCodeSpans(line) {
  const codeSpans = [];
  const spanRegex = /`[^`]+`/g;
  let spanMatch;
  
  while ((spanMatch = spanRegex.exec(line)) !== null) {
    codeSpans.push([spanMatch.index, spanMatch.index + spanMatch[0].length]);
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
export function isInCodeSpan(codeSpans, start, end) {
  return codeSpans.some(([spanStart, spanEnd]) => start >= spanStart && end <= spanEnd);
}