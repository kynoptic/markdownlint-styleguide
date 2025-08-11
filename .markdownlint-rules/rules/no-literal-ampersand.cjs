"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _configValidation = require("./config-validation.cjs");
var _sharedUtils = require("./shared-utils.cjs");
var _sharedConstants = require("./shared-constants.cjs");
var _autofixSafety = require("./autofix-safety.cjs");
// @ts-check

/**
 * Rule that flags standalone ampersands (&) and provides autofix to replace with "and".
 * This helps maintain readability and follows common writing conventions.
 */

/**
 * Check if a character position is inside inline code or other special context.
 * @param {string} line - The line content
 * @param {number} position - Character position to check
 * @param {boolean} skipInlineCode - Whether to skip inline code contexts
 * @returns {boolean} True if position should be ignored
 */
function isInSpecialContext(line, position, skipInlineCode = true) {
  // Check if inside inline code (backticks) based on configuration
  if (skipInlineCode && (0, _sharedUtils.isInInlineCode)(line, position)) {
    return true;
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
  const isStandalone = (charBefore === '' || /\s/.test(charBefore)) && (charAfter === '' || /\s/.test(charAfter));
  return isStandalone;
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
    exceptions: _configValidation.validateStringArray,
    skipCodeBlocks: _configValidation.validateBoolean,
    skipInlineCode: _configValidation.validateBoolean
  };
  const validationResult = (0, _configValidation.validateConfig)(config, configSchema, 'no-literal-ampersand');
  if (!validationResult.isValid) {
    const logger = (0, _configValidation.createMarkdownlintLogger)(onError, 'no-literal-ampersand');
    (0, _configValidation.logValidationErrors)('no-literal-ampersand', validationResult.errors, logger);
    // Continue execution with default values to prevent crashes
  }

  // Extract configuration with defaults
  const exceptions = Array.isArray(config.exceptions) ? [..._sharedConstants.ampersandDefaultExceptions, ...config.exceptions] : _sharedConstants.ampersandDefaultExceptions;
  const skipCodeBlocks = typeof config.skipCodeBlocks === 'boolean' ? config.skipCodeBlocks : true;
  const skipInlineCode = typeof config.skipInlineCode === 'boolean' ? config.skipInlineCode : true;
  const lines = params.lines;
  const codeBlockLines = (0, _sharedUtils.getCodeBlockLines)(lines);
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
          const basicFixInfo = {
            editColumn: pos + 1,
            deleteCount: 1,
            insertText: 'and'
          };
          const safeFixInfo = (0, _autofixSafety.createSafeFixInfo)(basicFixInfo, params.lines, lineNumber, 'no-literal-ampersand');
          onError({
            lineNumber,
            detail: 'Use "and" instead of literal ampersand (&)',
            context: `"${line.trim()}"`,
            range: [pos + 1, 1],
            // +1 for 1-based column
            fixInfo: safeFixInfo
          });
        }
      }
    }
  }
}

// Export the rule
var _default = exports.default = {
  names: ['no-literal-ampersand', 'NLA001'],
  description: 'Flags standalone ampersands (&) and suggests replacing with "and"',
  tags: ['readability', 'style'],
  parser: 'micromark',
  function: noLiteralAmpersand,
  fixable: true
};
module.exports = exports.default;