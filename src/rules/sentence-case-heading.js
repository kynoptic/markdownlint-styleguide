// @ts-check

/**
 * Custom markdownlint rule that enforces sentence case for headings.
 *
 * Configuration:
 * - specialTerms: Array of terms with specific capitalization (e.g., ["JavaScript", "API", "GitHub"])
 *
 * Deprecated (use specialTerms instead):
 * - technicalTerms: Legacy option, use specialTerms
 * - properNouns: Legacy option, use specialTerms
 *
 * Example configuration:
 * {
 *   "sentence-case-heading": {
 *     "specialTerms": ["JavaScript", "TypeScript", "API", "GitHub", "OAuth"]
 *   }
 * }
 */

import { casingTerms as defaultCasingTerms } from './shared-constants.js';
import {
  validateStringArray,
  validateConfig,
  logValidationErrors,
  createMarkdownlintLogger
} from './config-validation.js';
import { extractHeadingText } from './sentence-case/token-extraction.js';
import { validateHeading, validateBoldText } from './sentence-case/case-classifier.js';
import { toSentenceCase, buildHeadingFix, buildBoldTextFix } from './sentence-case/fix-builder.js';

/**
 * Main rule implementation.
 * @param {import("markdownlint").RuleParams} params
 * @param {import("markdownlint").RuleOnError} onError
 */
function basicSentenceCaseHeadingFunction(params, onError) {
  if (
    !params ||
    !params.parsers ||
    !params.parsers.micromark ||
    !params.parsers.micromark.tokens ||
    !Array.isArray(params.lines) ||
    typeof onError !== 'function'
  ) {
    return;
  }

  const tokens = params.parsers.micromark.tokens;
  const lines = params.lines;
  const config = params.config?.['sentence-case-heading'] || params.config?.SC001 || {};

  // Validate configuration
  const configSchema = {
    specialTerms: validateStringArray,
    technicalTerms: validateStringArray,
    properNouns: validateStringArray
  };

  const validationResult = validateConfig(config, configSchema, 'sentence-case-heading');
  const logger = createMarkdownlintLogger(onError, 'sentence-case-heading');
  
  if (!validationResult.isValid) {
    logValidationErrors('sentence-case-heading', validationResult.errors, logger);
    // Continue execution with empty arrays to prevent crashes
  }

  // Support both new `specialTerms` and old `technicalTerms`/`properNouns` for user config
  // Only use valid arrays; fall back to empty arrays for invalid config
  const userSpecialTerms = Array.isArray(config.specialTerms) ? config.specialTerms : [];
  const userTechnicalTerms = Array.isArray(config.technicalTerms) ? config.technicalTerms : [];
  const userProperNouns = Array.isArray(config.properNouns) ? config.properNouns : [];
  
  // Show deprecation warnings for old configuration keys
  // Note: These are deprecation warnings (not configuration errors), using console.warn
  // to maintain compatibility with existing tooling that may capture console output.
  // These warnings are informational and don't prevent the rule from functioning.
  if (config.technicalTerms && Array.isArray(config.technicalTerms) && config.technicalTerms.length > 0) {
    console.warn('⚠️  Deprecation warning [sentence-case-heading]: "technicalTerms" is deprecated. Please use "specialTerms" instead.');
  }
  if (config.properNouns && Array.isArray(config.properNouns) && config.properNouns.length > 0) {
    console.warn('⚠️  Deprecation warning [sentence-case-heading]: "properNouns" is deprecated. Please use "specialTerms" instead.');
  }
  
  const allUserTerms = [...userSpecialTerms, ...userTechnicalTerms, ...userProperNouns];

  const specialCasedTerms = { ...defaultCasingTerms };
  if (Array.isArray(allUserTerms)) { // User terms are added with their correct casing
    allUserTerms.forEach((term) => {
      if (typeof term === 'string') {
        specialCasedTerms[term.toLowerCase()] = term;
      }
    });
  }

  const safetyConfig = params.config?.autofix?.safety || {};

  /**
   * Report a violation with auto-fix information.
   * @param {string} detail - Description of the issue.
   * @param {number} lineNumber - Line number for context.
   * @param {string} headingText - Heading text in question.
   * @param {string} line - Original source line.
   */
  function reportForHeading(detail, lineNumber, headingText, line) {
    const commentIndex = line.indexOf('<!--');
    const headingContent = commentIndex !== -1 ?
      line.slice(0, commentIndex).trimEnd() :
      line;
    const textToFix = headingContent.replace(/^#+\s*/, '');

    onError({
      lineNumber,
      detail,
      context: headingText,
      fixInfo: buildHeadingFix(line, textToFix, specialCasedTerms, safetyConfig)
    });
  }

  /**
   * Report a violation for bold text with auto-fix information.
   * @param {string} detail - Description of the issue.
   * @param {number} lineNumber - Line number for context.
   * @param {string} boldText - Bold text in question.
   * @param {string} line - Original source line.
   */
  function reportForBoldText(detail, lineNumber, boldText, line) {
    const fixedText = toSentenceCase(boldText, specialCasedTerms);

    onError({
      lineNumber,
      detail,
      context: `**${boldText}**`,
      fixInfo: fixedText ? buildBoldTextFix(line, boldText, fixedText, safetyConfig) : undefined
    });
  }

  /**
   * Validates bold text in its source line context with stricter rules than headings.
   * @param {string} boldText The bold text to validate.
   * @param {number} lineNumber The line number of the text.
   * @param {string} sourceLine The full source line.
   */
  function validateBoldTextInContext(boldText, lineNumber, sourceLine) {
    if (!boldText || !boldText.trim()) {
      return;
    }

    // Debug logging
    if (process.env.DEBUG === 'markdownlint-trap*' || params.config?.debug) {
      console.log(`Validating bold text at line ${lineNumber}: "**${boldText}**"`);
    }

    const validationResult = validateBoldText(boldText, specialCasedTerms);

    if (!validationResult.isValid) {
      reportForBoldText(validationResult.errorMessage, lineNumber, boldText, sourceLine);
    }
  }

  /**
   * Validates a string for sentence case and reports errors.
   * @param {string} headingText The text to validate.
   * @param {number} lineNumber The line number of the text.
   * @param {string} sourceLine The full source line.
   * @param {Function} reportFn The function to call to report an error.
   */
  function validateWrapper(headingText, lineNumber, sourceLine, reportFn) {
    // Debug logging
    if (process.env.DEBUG === 'markdownlint-trap*' || params.config?.debug) {
      console.log(`Validating text at line ${lineNumber}: "${headingText}"`);
    }

    const validationResult = validateHeading(headingText, specialCasedTerms);

    if (!validationResult.isValid) {
      // Use cleanedText (emoji stripped) for error context to match original behavior
      const contextText = validationResult.cleanedText || headingText;
      reportFn(validationResult.errorMessage, lineNumber, contextText, sourceLine);
    }
  }

  // Process standard ATX headings
  tokens.forEach((token) => {
    if (token.type === 'atxHeading') {
      const lineNumber = token.startLine;
      if (lineNumber === 1 && /README\.md$/i.test(params.name || '')) {
        return;
      }
      const sourceLine = lines[lineNumber - 1];
      const headingText = extractHeadingText(tokens, lines, token);
      validateWrapper(headingText, lineNumber, sourceLine, reportForHeading);
    }
  });

  // Process bold text in list items using regex detection
  // (micromark doesn't parse list item internals deeply enough for token-based detection)
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    
    // Skip lines that are not list items with bold text
    if (!line.trim().startsWith('-') || !line.includes('**')) {
      return;
    }
    
    // Skip lines that contain both ** and backticks to avoid complex parsing issues
    // This is a conservative approach to avoid false positives with ** inside code
    if (line.includes('`') && line.includes('**')) {
      // Only check if there are ** patterns outside of backticks
      const tempLine = line.replace(/`[^`]*`/g, ''); // Remove all code spans
      if (!tempLine.includes('**')) {
        return; // No bold text outside of code spans
      }
    }
    
    // Extract bold text using regex
    const boldMatches = line.matchAll(/\*\*([^*]+?)\*\*/g);
    
    for (const match of boldMatches) {
      const matchStart = match.index;
      const matchEnd = match.index + match[0].length;
      
      // Check if this match is inside backticks (code span)
      // Find all code spans in the line and see if our match overlaps
      let isInsideCode = false;
      const codeSpanRegex = /`[^`]*`/g;
      let codeSpanMatch;
      
      while ((codeSpanMatch = codeSpanRegex.exec(line)) !== null) {
        const codeStart = codeSpanMatch.index;
        const codeEnd = codeStart + codeSpanMatch[0].length;
        
        // Check if the bold match overlaps with this code span
        if (matchStart >= codeStart && matchEnd <= codeEnd) {
          isInsideCode = true;
          break;
        }
      }
      
      if (isInsideCode) {
        continue; // Skip bold text that's inside code spans
      }
      
      const boldText = match[1].trim();
      if (!boldText) continue;
      
      
      // If the bold text has a colon, only validate the part before the colon
      const textToValidate = boldText.includes(':') ? 
        boldText.split(':')[0].trim() : 
        boldText;

      // Skip empty text
      if (!textToValidate) continue;

      // Use the unified validation logic
      validateBoldTextInContext(textToValidate, lineNumber, line);
    }
  });
}

export default {
  names: ['sentence-case-heading', 'SC001'],
  description: 'Ensures ATX (`# `) headings and bold text (`**bold**`) in list items use sentence case: first word capitalized, rest lowercase except acronyms and "I". Configure with "specialTerms" for custom terms.',
  tags: ['headings', 'style', 'custom', 'basic'],
  parser: 'micromark',
  function: basicSentenceCaseHeadingFunction
};
