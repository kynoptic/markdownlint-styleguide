// @ts-check

/**
 * Rule that flags standalone ampersands (&) and provides autofix to replace with "and".
 * This helps maintain readability and follows common writing conventions.
 */

import { 
  validateStringArray, 
  validateBoolean,
  validateConfig, 
  logValidationErrors 
} from './config-validation.js';

/**
 * Check if a character position is inside a code block, inline code, or other special context.
 * @param {string} line - The line content
 * @param {number} position - Character position to check
 * @param {boolean} skipInlineCode - Whether to skip inline code contexts
 * @returns {boolean} True if position should be ignored
 */
function isInSpecialContext(line, position, skipInlineCode = true) {
  // Check if inside inline code (backticks) based on configuration
  if (skipInlineCode) {
    let backtickCount = 0;
    for (let i = 0; i < position; i++) {
      if (line[i] === '`') {
        backtickCount++;
      }
    }
    // If odd number of backticks before position, we're inside inline code
    if (backtickCount % 2 === 1) {
      return true;
    }
  }

  // Check if inside HTML tag or entity
  const beforePosition = line.substring(0, position);
  const afterPosition = line.substring(position + 1); // +1 to skip the & itself
  
  // Check for HTML entities like &amp; &lt; &gt; etc.
  // Look for pattern like &word; where we are at the &
  if (/^[a-zA-Z0-9#]+;/.test(afterPosition)) {
    return true;
  }

  // Check if inside HTML tag
  const lastOpenTag = beforePosition.lastIndexOf('<');
  const lastCloseTag = beforePosition.lastIndexOf('>');
  if (lastOpenTag > lastCloseTag) {
    // Check if this looks like a valid HTML tag start
    const tagContent = line.substring(lastOpenTag + 1, position);
    // Only consider it an HTML tag if it looks like valid tag syntax
    if (/^[a-zA-Z][a-zA-Z0-9]*(\s|$)/.test(tagContent)) {
      return true;
    }
  }

  // Check if inside markdown link or image syntax
  const lastOpenBracket = beforePosition.lastIndexOf('[');
  const lastCloseBracket = beforePosition.lastIndexOf(']');
  const lastOpenParen = beforePosition.lastIndexOf('(');
  const lastCloseParen = beforePosition.lastIndexOf(')');
  
  // Inside link text [text & more]
  if (lastOpenBracket > lastCloseBracket) {
    return true;
  }
  
  // Inside link URL (text)[url & params]
  if (lastOpenParen > lastCloseParen && lastCloseBracket > lastOpenBracket) {
    return true;
  }

  return false;
}

/**
 * Check if an ampersand should be flagged as a violation.
 * @param {string} line - The line content
 * @param {number} position - Position of the ampersand
 * @param {boolean} skipInlineCode - Whether to skip inline code contexts
 * @param {string[]} exceptions - Array of exception patterns
 * @returns {boolean} True if this ampersand should be flagged
 */
function shouldFlagAmpersand(line, position, skipInlineCode = true, exceptions = []) {
  // Skip if in special context
  if (isInSpecialContext(line, position, skipInlineCode)) {
    return false;
  }

  // Check if this ampersand matches any exception patterns
  for (const exception of exceptions) {
    const regex = new RegExp(exception.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    if (regex.test(line)) {
      return false;
    }
  }

  // Get characters before and after the ampersand
  const charBefore = position > 0 ? line[position - 1] : '';
  const charAfter = position < line.length - 1 ? line[position + 1] : '';

  // Must have spaces or word boundaries around it to be considered "standalone"
  const isStandalone = (
    (charBefore === '' || /\s/.test(charBefore)) &&
    (charAfter === '' || /\s/.test(charAfter))
  );

  return isStandalone;
}

/**
 * Track code block state across lines
 * @param {string[]} lines - All lines in the document
 * @returns {boolean[]} Array indicating which lines are in code blocks
 */
function getCodeBlockLines(lines) {
  const inCodeBlock = new Array(lines.length).fill(false);
  let currentCodeBlockType = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Check for fenced code blocks
    if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
      const fenceType = trimmed.startsWith('```') ? '```' : '~~~';
      
      if (currentCodeBlockType === null) {
        // Starting a code block
        currentCodeBlockType = fenceType;
        inCodeBlock[i] = true;
      } else if (currentCodeBlockType === fenceType) {
        // Ending a code block
        inCodeBlock[i] = true;
        currentCodeBlockType = null;
      } else {
        // Different fence type while in code block
        inCodeBlock[i] = true;
      }
    } else if (currentCodeBlockType !== null) {
      // Inside a fenced code block
      inCodeBlock[i] = true;
    } else if (/^ {4}/.test(line) || /^\t/.test(line)) {
      // Indented code block
      inCodeBlock[i] = true;
    }
  }
  
  return inCodeBlock;
}

/**
 * Main rule implementation.
 * @param {import("markdownlint").RuleParams} params - Parsed Markdown input
 * @param {import("markdownlint").RuleOnError} onError - Callback to report violations
 */
function noLiteralAmpersand(params, onError) {
  if (!params || !params.lines || typeof onError !== 'function') {
    return;
  }

  const config = params.config?.['no-literal-ampersand'] || params.config?.NLA001 || {};

  // Validate configuration
  const configSchema = {
    exceptions: validateStringArray,
    skipCodeBlocks: validateBoolean,
    skipInlineCode: validateBoolean
  };

  const validationResult = validateConfig(config, configSchema, 'no-literal-ampersand');
  if (!validationResult.isValid) {
    logValidationErrors('no-literal-ampersand', validationResult.errors);
    // Continue execution with default values to prevent crashes
  }

  // Extract configuration with defaults
  const exceptions = Array.isArray(config.exceptions) ? config.exceptions : [];
  const skipCodeBlocks = typeof config.skipCodeBlocks === 'boolean' ? config.skipCodeBlocks : true;
  const skipInlineCode = typeof config.skipInlineCode === 'boolean' ? config.skipInlineCode : true;

  const lines = params.lines;
  const codeBlockLines = getCodeBlockLines(lines);

  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1;
    const line = lines[i];

    // Skip empty lines
    if (!line.trim()) {
      continue;
    }

    // Skip lines in code blocks based on configuration
    if (skipCodeBlocks && codeBlockLines[i]) {
      continue;
    }

    // Find all ampersands in the line
    for (let pos = 0; pos < line.length; pos++) {
      if (line[pos] === '&') {
        if (shouldFlagAmpersand(line, pos, skipInlineCode, exceptions)) {
          // Always provide fix for ampersand replacement since it's a safe operation
          const fixInfo = {
            editColumn: pos + 1,
            deleteCount: 1,
            insertText: 'and'
          };

          onError({
            lineNumber,
            detail: 'Use "and" instead of literal ampersand (&)',
            context: `"${line.trim()}"`,
            range: [pos + 1, 1], // +1 for 1-based column
            fixInfo: fixInfo
          });
        }
      }
    }
  }
}

// Export the rule
export default {
  names: ['no-literal-ampersand', 'NLA001'],
  description: 'Flags standalone ampersands (&) and suggests replacing with "and"',
  tags: ['readability', 'style'],
  parser: 'micromark',
  function: noLiteralAmpersand,
  fixable: true
};