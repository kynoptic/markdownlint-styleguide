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
  const sampleLines = [
    ...lines.slice(0, Math.min(3, lines.length)),
    ...lines.slice(Math.max(0, lines.length - 3))
  ];
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
export function getCodeBlockLines(lines) {
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
  codeBlockCache.set(lines, { key: cacheKey, result: inCodeBlock });
  
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
 * Optimized for performance by avoiding unnecessary character-by-character iteration.
 * 
 * @param {string} line - The line content
 * @param {number} position - Character position to check
 * @returns {boolean} True if position is inside inline code
 */
export function isInInlineCode(line, position) {
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
export function getInlineCodeSpans(line) {
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
export function isInCodeSpan(codeSpans, start, end) {
  return codeSpans.some(([spanStart, spanEnd]) => start >= spanStart && end <= spanEnd);
}

/**
 * Strips leading emoji and decorative symbols from text.
 * Handles emoji sequences including skin tone modifiers and ZWJ (Zero Width Joiner) sequences.
 * Iteratively removes emoji until no more are found at the start.
 *
 * This is useful for finding the first actual textual content in strings that may
 * have decorative emoji prefixes.
 *
 * @param {string} text - The text to strip emoji from
 * @returns {string} Text with leading emoji removed and trimmed
 */
export function stripLeadingDecorations(text) {
  let result = text;
  let prevLength;

  // Iteratively strip emoji sequences until no more matches
  // This loop handles complex emoji like flag sequences and emoji with skin tones
  // that may require multiple passes to fully remove
  do {
    prevLength = result.length;

    // Emoji and symbol Unicode ranges (consolidated for performance)
    // Regional indicator symbols (flags)
    result = result.replace(/^[\u{1F1E0}-\u{1F1FF}]/u, '');
    // Miscellaneous symbols
    result = result.replace(/^[\u{1F300}-\u{1F5FF}]/u, '');
    // Emoticons
    result = result.replace(/^[\u{1F600}-\u{1F64F}]/u, '');
    // Transport and map symbols
    result = result.replace(/^[\u{1F680}-\u{1F6FF}]/u, '');
    // Alchemical symbols
    result = result.replace(/^[\u{1F700}-\u{1F77F}]/u, '');
    // Geometric shapes extended
    result = result.replace(/^[\u{1F780}-\u{1F7FF}]/u, '');
    // Supplemental arrows-C
    result = result.replace(/^[\u{1F800}-\u{1F8FF}]/u, '');
    // Miscellaneous symbols and pictographs
    result = result.replace(/^[\u{2600}-\u{26FF}]/u, '');
    // Dingbats
    result = result.replace(/^[\u{2700}-\u{27BF}]/u, '');
    // Supplemental symbols and pictographs
    result = result.replace(/^[\u{1F900}-\u{1F9FF}]/u, '');
    // Symbols and pictographs extended-A
    result = result.replace(/^[\u{1FA00}-\u{1FA6F}]/u, '');
    result = result.replace(/^[\u{1FA70}-\u{1FAFF}]/u, '');
    // Playing cards, Mahjong tiles
    result = result.replace(/^[\u{1F000}-\u{1F02F}]/u, '');
    result = result.replace(/^[\u{1F0A0}-\u{1F0FF}]/u, '');
    // Enclosed alphanumeric supplement
    result = result.replace(/^[\u{1F100}-\u{1F1FF}]/u, '');
    // Skin tone modifiers
    result = result.replace(/^[\u{1F3FB}-\u{1F3FF}]/u, '');
    // Zero Width Joiner (used in emoji sequences)
    result = result.replace(/^\u200D/u, '');
    // Variation Selector-16 (emoji presentation)
    result = result.replace(/^\uFE0F/u, '');

  } while (result.length < prevLength && result.length > 0);

  return result.trimStart();
}

/**
 * Finds the position of the first emoji character in text (outside of code spans).
 * Returns -1 if no emoji is found.
 *
 * This function is used to implement the ignoreAfterEmoji option, which truncates
 * heading validation at the first emoji to allow status markers and metadata after emoji.
 *
 * @param {string} text - The text to search for emoji
 * @returns {number} Position of first emoji character, or -1 if none found
 */
export function findFirstEmojiPosition(text) {
  // Get all code spans first to avoid matching emoji inside code
  const codeSpans = getInlineCodeSpans(text);

  // Comprehensive emoji ranges (same as EMOJI_REGEX but used with matchAll)
  // eslint-disable-next-line no-misleading-character-class
  const emojiRegex = /[\u{1F1E0}-\u{1F1FF}\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F1FF}\u{1F3FB}-\u{1F3FF}]/ug;

  const matches = text.matchAll(emojiRegex);

  for (const match of matches) {
    const position = match.index;

    // Skip if emoji is inside a code span
    if (!isInCodeSpan(codeSpans, position, position + 1)) {
      return position;
    }
  }

  return -1;
}

/**
 * Truncates text at the first emoji character (if ignoreAfterEmoji is enabled).
 * Returns both the truncated text for validation and the original text for context.
 *
 * @param {string} text - The text to potentially truncate
 * @param {boolean} ignoreAfterEmoji - Whether to truncate at emoji
 * @returns {{textForValidation: string, originalText: string, wasTruncated: boolean}} Truncation result
 */
export function truncateAtEmoji(text, ignoreAfterEmoji) {
  if (!ignoreAfterEmoji) {
    return {
      textForValidation: text,
      originalText: text,
      wasTruncated: false
    };
  }

  const emojiPosition = findFirstEmojiPosition(text);

  if (emojiPosition === -1) {
    // No emoji found - use full text
    return {
      textForValidation: text,
      originalText: text,
      wasTruncated: false
    };
  }

  // Truncate at emoji position
  const truncated = text.substring(0, emojiPosition).trimEnd();

  return {
    textForValidation: truncated,
    originalText: text,
    wasTruncated: true
  };
}