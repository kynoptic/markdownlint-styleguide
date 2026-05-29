// @ts-check

/**
 * Custom markdownlint rule that enforces sentence case for headings.
 *
 * Configuration:
 * - acronyms: Array of acronyms that must be uppercase (e.g., ["API", "CEFR",
 *   "WYSIWYG"]). The lowercase or mixed-case form is flagged and fixed to the
 *   configured uppercase form.
 * - properNouns: Array of proper nouns whose capitalized form is allowed
 *   (e.g., ["Craft", "Node", "Timing"]). The lowercase common-word homograph
 *   (e.g. "craft", "node") is NOT flagged, so a proper noun and its everyday
 *   lowercase usage can coexist without whack-a-mole configuration.
 * - ignoreAfterEmoji: Boolean to ignore text after the first emoji (default: false)
 *
 * Deprecated:
 * - specialTerms: Alias for `properNouns`. Retained for backward compatibility;
 *   prefer `properNouns` for allowed-capitalization terms and `acronyms` for
 *   terms that must be uppercase.
 * - technicalTerms: Legacy forcing option; prefer `acronyms` or `properNouns`.
 *
 * Example configuration:
 * {
 *   "sentence-case-heading": {
 *     "acronyms": ["API", "CEFR", "WYSIWYG"],
 *     "properNouns": ["Craft", "Node", "Timing"],
 *     "ignoreAfterEmoji": true
 *   }
 * }
 */

import { casingTerms as defaultCasingTerms, ambiguousTerms } from './shared-constants.js';
import {
  validateStringArray,
  validateBoolean,
  validateConfig,
  logValidationErrors,
  createMarkdownlintLogger
} from './config-validation.js';
import { stripLeadingDecorations, truncateAtEmoji, getCodeBlockLines } from './shared-utils.js';
import { extractHeadingText } from './sentence-case/token-extraction.js';
import { validateHeading } from './sentence-case/case-classifier.js';
import { validateBoldText } from './sentence-case/bold-text-classifier.js';
import { toSentenceCase, buildHeadingFix, buildBoldTextFix } from './sentence-case/fix-builder.js';

/** Track which deprecation keys have been warned to avoid warning once per file. */
const _deprecationWarned = new Set();

/**
 * Cache for `specialCasedTerms` objects keyed on sorted user-term list (#206).
 * `defaultCasingTerms` (~390 entries) is spread on every rule invocation without this
 * cache, causing O(files × 390) object copies in a multi-file lint run.
 * @type {Map<string, Record<string, string>>}
 */
const _specialCasedTermsCache = new Map();

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
  // Support both nested config (from .markdownlint-cli2.jsonc) and direct config (from lint API)
  const config = params.config?.['sentence-case-heading'] || params.config?.SC001 || params.config || {};

  // Validate configuration
  const configSchema = {
    acronyms: validateStringArray,
    properNouns: validateStringArray,
    specialTerms: validateStringArray,
    technicalTerms: validateStringArray,
    ignoreAfterEmoji: validateBoolean
  };

  const validationResult = validateConfig(config, configSchema, 'sentence-case-heading');
  const logger = createMarkdownlintLogger(onError, 'sentence-case-heading');

  if (!validationResult.isValid) {
    logValidationErrors('sentence-case-heading', validationResult.errors, logger);
    // Continue execution with empty arrays to prevent crashes
  }

  // Get ignoreAfterEmoji option (default: false for backward compatibility)
  const ignoreAfterEmoji = typeof config.ignoreAfterEmoji === 'boolean' ? config.ignoreAfterEmoji : false;

  // Term routing (#233):
  // - acronyms: must be uppercase. Registered as forcing terms in
  //   specialCasedTerms so the lowercase/mixed form is flagged and fixed.
  // - properNouns: the capitalized form is allowed, but the lowercase
  //   common-word homograph must NOT be flagged. The canonical casing is
  //   registered in specialCasedTerms (so the capitalized form and multi-word
  //   phrases are recognized) AND the lowercase single-word key is registered
  //   as an "allowed both ways" term so the homograph passes.
  // - specialTerms: deprecated alias for properNouns (backward compatibility).
  // - technicalTerms: legacy forcing option, treated like acronyms.
  // Only use valid arrays; fall back to empty arrays for invalid config.
  const userAcronyms = Array.isArray(config.acronyms) ? config.acronyms : [];
  const userProperNouns = Array.isArray(config.properNouns) ? config.properNouns : [];
  const userSpecialTerms = Array.isArray(config.specialTerms) ? config.specialTerms : [];
  const userTechnicalTerms = Array.isArray(config.technicalTerms) ? config.technicalTerms : [];

  // Show deprecation warnings for old configuration keys.
  // Note: These are deprecation warnings (not configuration errors), using console.warn
  // to maintain compatibility with existing tooling that may capture console output.
  // These warnings are informational and don't prevent the rule from functioning.
  if (config.specialTerms && Array.isArray(config.specialTerms) && config.specialTerms.length > 0 && !_deprecationWarned.has('specialTerms')) {
    _deprecationWarned.add('specialTerms');
    console.warn('⚠️  Deprecation warning [sentence-case-heading]: "specialTerms" is deprecated. Use "properNouns" for allowed-capitalization terms or "acronyms" for terms that must be uppercase.');
  }
  if (config.technicalTerms && Array.isArray(config.technicalTerms) && config.technicalTerms.length > 0 && !_deprecationWarned.has('technicalTerms')) {
    _deprecationWarned.add('technicalTerms');
    console.warn('⚠️  Deprecation warning [sentence-case-heading]: "technicalTerms" is deprecated. Use "acronyms" or "properNouns" instead.');
  }

  // Forcing terms: acronyms and the legacy technicalTerms enforce exact casing.
  const forcingTerms = [...userAcronyms, ...userTechnicalTerms];
  // Allowed-both-ways terms: properNouns and the deprecated specialTerms alias.
  const allowedTerms = [...userProperNouns, ...userSpecialTerms];
  // Every user term still seeds specialCasedTerms so the canonical capitalized
  // form (and multi-word phrases) are recognized and never lowercased.
  const allUserTerms = [...forcingTerms, ...allowedTerms];

  // Memoize specialCasedTerms: spreading defaultCasingTerms (~390 entries) is O(n) per
  // invocation. Cache keyed on sorted user terms so lint runs over many files pay the
  // construction cost only once per unique config (#206).
  const cacheKey = allUserTerms
    .filter((t) => typeof t === 'string')
    .sort()
    .join('\x00');
  let specialCasedTerms = _specialCasedTermsCache.get(cacheKey);
  if (!specialCasedTerms) {
    specialCasedTerms = { ...defaultCasingTerms };
    allUserTerms.forEach((term) => {
      if (typeof term === 'string') {
        specialCasedTerms[term.toLowerCase()] = term;
      }
    });
    _specialCasedTermsCache.set(cacheKey, specialCasedTerms);
  }

  // Build the effective "allowed both ways" map: built-in ambiguous terms plus
  // single-word proper nouns (and specialTerms alias). A proper noun registered
  // here lets both its capitalized form and its lowercase homograph pass (#233).
  // Multi-word proper nouns ("Claude Code") are left to specialCasedTerms phrase
  // matching, since the allowed-both-ways skip only applies to single tokens.
  let effectiveAmbiguousTerms = ambiguousTerms;
  const allowedSingleWords = allowedTerms.filter(
    (t) => typeof t === 'string' && !t.includes(' ')
  );
  if (allowedSingleWords.length > 0) {
    effectiveAmbiguousTerms = { ...ambiguousTerms };
    allowedSingleWords.forEach((term) => {
      const key = term.toLowerCase();
      // Do not override a built-in ambiguous entry.
      if (!effectiveAmbiguousTerms[key]) {
        effectiveAmbiguousTerms[key] = {
          properForm: term,
          reason: 'User-configured proper noun (allowed capitalized; lowercase homograph not flagged)'
        };
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
   * @param {string} textForValidation - Text that was validated (may be truncated if ignoreAfterEmoji).
   */
  function reportForHeading(detail, lineNumber, headingText, line, textForValidation) {
    const commentIndex = line.indexOf('<!--');
    const headingContent = commentIndex !== -1 ?
      line.slice(0, commentIndex).trimEnd() :
      line;
    const textToFix = headingContent.replace(/^#+\s*/, '');

    // If ignoreAfterEmoji is enabled and text was truncated, only fix the part before emoji
    // We need to use textForValidation (the truncated text) as the fix target
    const fixTarget = (ignoreAfterEmoji && textForValidation) ? textForValidation : textToFix;

    onError({
      lineNumber,
      detail,
      context: headingText,
      fixInfo: buildHeadingFix(line, fixTarget, specialCasedTerms, safetyConfig, effectiveAmbiguousTerms)
    });
  }

  /**
   * Report a violation for bold text with auto-fix information.
   * @param {string} detail - Description of the issue.
   * @param {number} lineNumber - Line number for context.
   * @param {string} boldText - Bold text in question.
   * @param {string} line - Original source line.
   * @param {string} textForValidation - Text that was validated (may be truncated if ignoreAfterEmoji).
   */
  function reportForBoldText(detail, lineNumber, boldText, line, textForValidation) {
    // If ignoreAfterEmoji is enabled and text was truncated, only fix the part before emoji
    const fixTarget = (ignoreAfterEmoji && textForValidation) ? textForValidation : boldText;
    const fixedText = toSentenceCase(fixTarget, specialCasedTerms, effectiveAmbiguousTerms);

    onError({
      lineNumber,
      detail,
      context: `**${textForValidation || boldText}**`,
      fixInfo: fixedText ? buildBoldTextFix(line, fixTarget, fixedText, safetyConfig) : undefined
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

    // Apply ignoreAfterEmoji truncation if enabled
    const { textForValidation } = truncateAtEmoji(boldText, ignoreAfterEmoji);

    const validationResult = validateBoldText(textForValidation, specialCasedTerms, effectiveAmbiguousTerms);

    if (!validationResult.isValid) {
      reportForBoldText(validationResult.errorMessage, lineNumber, boldText, sourceLine, textForValidation);
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

    // Apply ignoreAfterEmoji truncation if enabled
    const { textForValidation } = truncateAtEmoji(headingText, ignoreAfterEmoji);

    const validationResult = validateHeading(textForValidation, specialCasedTerms, effectiveAmbiguousTerms);

    if (!validationResult.isValid) {
      // Use cleanedText (emoji stripped) for error context to match original behavior
      const contextText = validationResult.cleanedText || textForValidation;
      reportFn(validationResult.errorMessage, lineNumber, contextText, sourceLine, textForValidation);
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
  //
  // CRITICAL: Only validate bold text that appears as the first textual content
  // in a list item (after optional decorative elements like emojis).
  // Bold text in the middle or end of list items should NOT be validated.
  // This fixes ~2,700 false positives (issue #105).

  // Get code block lines to skip content inside fenced code blocks
  const codeBlockLines = getCodeBlockLines(lines);

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    // Skip lines inside code blocks - never flag or autofix code block content
    if (codeBlockLines[index]) {
      return;
    }

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

    // Extract the content after the list marker
    const listContent = line.trim().slice(1).trim(); // Remove '-' and trim

    // Strip leading emoji and decorative symbols to find the first textual content
    const contentAfterDecorations = stripLeadingDecorations(listContent);

    // Check if bold text is at the start of the content (after decorations)
    // Only validate bold text that is the first textual content
    if (!contentAfterDecorations.startsWith('**')) {
      // Bold text is not at the start - skip validation to avoid false positives
      return;
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

      // Only validate the first bold text in the list item (which we already confirmed is at the start)
      break;
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

export const _forTesting = {
  resetDeprecationWarnings: () => _deprecationWarned.clear()
};
