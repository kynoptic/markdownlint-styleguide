"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _sharedConstants = require("./shared-constants.cjs");
var _autofixSafety = require("./autofix-safety.cjs");
var _configValidation = require("./config-validation.cjs");
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

/**
 * Extract the plain heading text from tokens.
 * @param {object[]} tokens
 * @param {string[]} lines
 * @param {object} token
 * @returns {string} The extracted heading text.
 */
function extractHeadingText(tokens, lines, token) {
  const lineNumber = token.startLine;
  const lineText = lines[lineNumber - 1];
  const seq = tokens.find(t => t.type === 'atxHeadingSequence' && t.startLine === lineNumber && t.startColumn === token.startColumn);
  if (seq) {
    const textStartColumn = seq.endColumn;
    const text = lineText.substring(textStartColumn - 1, token.endColumn - 1);
    return text.replace(/<!--.*-->/g, '').trim();
  }
  const match = lineText.match(/^#+\s*(.*)/);
  return match && match[1] ? match[1].replace(/<!--.*-->/g, '').trim() : '';
}

/**
 * Main rule implementation.
 * @param {import("markdownlint").RuleParams} params
 * @param {import("markdownlint").RuleOnError} onError
 */
function basicSentenceCaseHeadingFunction(params, onError) {
  if (!params || !params.parsers || !params.parsers.micromark || !params.parsers.micromark.tokens || !Array.isArray(params.lines) || typeof onError !== 'function') {
    return;
  }
  const tokens = params.parsers.micromark.tokens;
  const lines = params.lines;
  const config = params.config?.['sentence-case-heading'] || params.config?.SC001 || {};

  // Validate configuration
  const configSchema = {
    specialTerms: _configValidation.validateStringArray,
    technicalTerms: _configValidation.validateStringArray,
    properNouns: _configValidation.validateStringArray
  };
  const validationResult = (0, _configValidation.validateConfig)(config, configSchema, 'sentence-case-heading');
  if (!validationResult.isValid) {
    const logger = (0, _configValidation.createMarkdownlintLogger)(onError, 'sentence-case-heading');
    (0, _configValidation.logValidationErrors)('sentence-case-heading', validationResult.errors, logger);
    // Continue execution with empty arrays to prevent crashes
  }

  // Support both new `specialTerms` and old `technicalTerms`/`properNouns` for user config
  // Only use valid arrays; fall back to empty arrays for invalid config
  const userSpecialTerms = Array.isArray(config.specialTerms) ? config.specialTerms : [];
  const userTechnicalTerms = Array.isArray(config.technicalTerms) ? config.technicalTerms : [];
  const userProperNouns = Array.isArray(config.properNouns) ? config.properNouns : [];

  // Show deprecation warnings for old configuration keys
  if (config.technicalTerms && Array.isArray(config.technicalTerms) && config.technicalTerms.length > 0) {
    console.warn('⚠️  Configuration warning [sentence-case-heading]: "technicalTerms" is deprecated. Please use "specialTerms" instead.');
  }
  if (config.properNouns && Array.isArray(config.properNouns) && config.properNouns.length > 0) {
    console.warn('⚠️  Configuration warning [sentence-case-heading]: "properNouns" is deprecated. Please use "specialTerms" instead.');
  }
  const allUserTerms = [...userSpecialTerms, ...userTechnicalTerms, ...userProperNouns];
  const specialCasedTerms = {
    ..._sharedConstants.casingTerms
  };
  if (Array.isArray(allUserTerms)) {
    // User terms are added with their correct casing
    allUserTerms.forEach(term => {
      if (typeof term === 'string') {
        specialCasedTerms[term.toLowerCase()] = term;
      }
    });
  }

  /**
   * Converts a string to sentence case, respecting preserved segments.
   * @param {string} text The text to convert.
   * @returns {string | null} The fixed text, or null if no change is needed.
   */
  function toSentenceCase(text) {
    const preserved = [];
    const preservedSegmentsRegex = /`[^`]+`|\[[^\]]+\]\([^)]+\)|\[[^\]]+\]|\b(v?\d+\.\d+(?:\.\d+)?(?:-[a-zA-Z0-9.]+)?)\b|\b(\d{4}-\d{2}-\d{2})\b|(\*\*|__)(.*?)\3|(\*|_)(.*?)\5/g;
    const processed = text.replace(preservedSegmentsRegex, m => {
      preserved.push(m);
      return `__P_${preserved.length - 1}__`;
    });
    const words = processed.split(/\s+/).filter(Boolean);
    const firstWordIndex = words.findIndex(w => !w.startsWith('__P_'));
    if (firstWordIndex === -1) {
      return null;
    }
    let firstVisibleWordCased = false;
    const fixedWords = words.map(w => {
      if (w.startsWith('__P_')) return w;
      const lower = w.toLowerCase();
      if (specialCasedTerms[lower]) return specialCasedTerms[lower];
      if (!firstVisibleWordCased) {
        firstVisibleWordCased = true;
        return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
      }
      return w.toLowerCase();
    });
    let fixed = fixedWords.join(' ');
    fixed = fixed.replace(/__P_(\d+)__/g, (_, idx) => preserved[Number(idx)]);
    return fixed === text ? null : fixed;
  }
  function getFixInfoForHeading(line, text) {
    const match = /^(#{1,6})(\s+)(.*)$/.exec(line);
    if (!match) {
      return undefined;
    }
    const prefixLength = match[1].length + match[2].length;
    const fixedText = toSentenceCase(text);
    if (!fixedText) {
      return undefined;
    }
    const originalFixInfo = {
      editColumn: prefixLength + 1,
      deleteCount: text.length,
      insertText: fixedText
    };

    // Apply safety checks to the fix
    const safetyConfig = params.config?.autofix?.safety || {};
    return (0, _autofixSafety.createSafeFixInfo)(originalFixInfo, 'sentence-case', text, fixedText, {
      line
    }, safetyConfig);
  }

  /**
   * Report a violation with auto-fix information.
   * @param {string} detail - Description of the issue.
   * @param {number} lineNumber - Line number for context.
   * @param {string} headingText - Heading text in question.
   * @param {string} line - Original source line.
   */
  function reportForHeading(detail, lineNumber, headingText, line) {
    const commentIndex = line.indexOf('<!--');
    const headingContent = commentIndex !== -1 ? line.slice(0, commentIndex).trimEnd() : line;
    const textToFix = headingContent.replace(/^#+\s*/, '');
    onError({
      lineNumber,
      detail,
      context: headingText,
      fixInfo: getFixInfoForHeading(line, textToFix)
    });
  }

  /**
   * Determine indices of words that are part of multi-word proper nouns.
   * @param {string[]} words - Tokenized heading words.
   * @returns {Set<number>} Indices that should be ignored during case checks.
   */
  function getProperPhraseIndices(words) {
    const indices = new Set();
    const lowerWords = words.map(w => w.toLowerCase());
    Object.keys(specialCasedTerms).forEach(key => {
      if (!key.includes(' ')) {
        return;
      }
      const parts = key.split(' ');
      for (let i = 0; i <= lowerWords.length - parts.length; i++) {
        const match = parts.every((p, j) => lowerWords[i + j] === p);
        if (match) {
          for (let j = 0; j < parts.length; j++) {
            indices.add(i + j);
          }
        }
      }
    });
    return indices;
  }

  /**
   * Validate multi-word proper nouns for correct capitalization.
   * @param {string} text - Original heading text.
   * @param {number} lineNumber - Line number for error reporting.
   * @returns {boolean} True if a violation was reported.
   */
  function validateProperPhrases(text, lineNumber) {
    for (const [phrase, expected] of Object.entries(specialCasedTerms)) {
      if (!phrase.includes(' ')) {
        continue;
      }
      const regex = new RegExp(`\\b${phrase}\\b`, 'i');
      const match = regex.exec(text);
      if (match && match[0] !== expected) {
        onError({
          lineNumber,
          detail: `Phrase "${match[0]}" should be "${expected}".`,
          context: text
        });
        return true;
      }
    }
    return false;
  }

  /**
   * Determine if all non-acronym words are uppercase.
   * @param {string[]} words - Words extracted from the heading.
   * @returns {boolean} True when every relevant word is uppercase.
   */
  function isAllCapsHeading(words) {
    const relevant = words.filter(w => w.length > 1 && !(w.startsWith('__PRESERVED_') && w.endsWith('__')));
    const allCaps = relevant.filter(w => w === w.toUpperCase());
    return relevant.length > 1 && allCaps.length === relevant.length && !/\d/.test(relevant.join(''));
  }

  /**
   * Strips emoji and symbol characters from the beginning of text.
   * @param {string} text The text to clean.
   * @returns {string} The cleaned text.
   */
  function stripLeadingSymbols(text) {
    // Remove leading emoji and symbol characters
    // Use a simpler approach that works with complex emoji sequences
    return text.replace(/^[^\w\s]*\s*/, '').trim();
  }

  /**
   * Preserves markup segments and returns processed text with placeholders.
   * @param {string} text The text to process.
   * @returns {{processed: string, preservedSegments: string[]}} Processed text and preserved segments.
   */
  function preserveMarkupSegments(text) {
    const preservedSegments = [];
    const processed = text.replace(/`([^`]+)`/g, m => {
      preservedSegments.push(m);
      return `__PRESERVED_${preservedSegments.length - 1}__`;
    }).replace(/\[[^\]]+\]\([^)]+\)|\[[^\]]+\]/g, m => {
      preservedSegments.push(m);
      return `__PRESERVED_${preservedSegments.length - 1}__`;
    }).replace(/\b(v?\d+\.\d+(?:\.\d+)?(?:-[a-zA-Z0-9.]+)?)\b/g, m => {
      preservedSegments.push(m);
      return `__PRESERVED_${preservedSegments.length - 1}__`;
    }).replace(/\b(\d{4}-\d{2}-\d{2})\b/g, m => {
      preservedSegments.push(m);
      return `__PRESERVED_${preservedSegments.length - 1}__`;
    }).replace(/(\*\*|__)(.*?)\1/g, m => {
      // Bold
      preservedSegments.push(m);
      return `__PRESERVED_${preservedSegments.length - 1}__`;
    }).replace(/(\*|_)(.*?)\1/g, m => {
      // Italic
      preservedSegments.push(m);
      return `__PRESERVED_${preservedSegments.length - 1}__`;
    });
    return {
      processed,
      preservedSegments
    };
  }

  /**
   * Checks if text should be exempted from validation based on content.
   * @param {string} headingText The heading text to check.
   * @param {string} textWithoutMarkup Text with markup removed.
   * @returns {boolean} True if text should be exempted.
   */
  function shouldExemptFromValidation(headingText, textWithoutMarkup) {
    // Exempt headings enclosed in brackets (e.g., [Unreleased])
    if (headingText.startsWith('[') && headingText.endsWith(']')) {
      return true;
    }

    // Skip if empty after cleaning
    if (!headingText || headingText.trim().length === 0) {
      return true;
    }

    // Skip if no alphabetic characters (likely version numbers, etc.)
    if (!/[a-zA-Z]/.test(textWithoutMarkup)) {
      return true;
    }

    // Skip if mostly code content
    const codeContentRegex = /`[^`]+`|\([A-Z0-9]+\)/g;
    const matches = [...headingText.matchAll(codeContentRegex)];
    const totalCodeLength = matches.reduce((sum, m) => sum + m[0].length, 0);
    if (totalCodeLength > 0 && totalCodeLength / headingText.length > 0.4) {
      return true;
    }

    // Skip if starts with code span
    const firstNonSpace = headingText.trim().split(/\s+/)[0] || '';
    if (firstNonSpace.startsWith('`') && firstNonSpace.endsWith('`')) {
      return true;
    }
    return false;
  }

  /**
   * Finds the first non-preserved word index for validation.
   * @param {string[]} words Array of words from the heading.
   * @param {string} headingText Original heading text.
   * @returns {number} Index of first word to validate, or -1 if none found.
   */
  function findFirstValidationWord(words, headingText) {
    let firstIndex = 0;
    const numeric = /^[-\d.,/]+$/;
    const isNumberedHeading = /^\d+\.\s/.test(headingText);
    while (firstIndex < words.length && (
    // Skip preserved segments (code spans, links, etc.) at the start
    words[firstIndex].startsWith('__PRESERVED_') && words[firstIndex].endsWith('__') || numeric.test(words[firstIndex]) ||
    // Skip numbered list prefixes (e.g., "1.")
    isNumberedHeading && /^\d+\.$/.test(words[firstIndex]))) {
      firstIndex++;
    }
    return firstIndex < words.length ? firstIndex : -1;
  }

  /**
   * Validates the first word's capitalization.
   * @param {string} firstWord The first word to validate.
   * @param {number} firstIndex Index of the first word.
   * @param {Set<number>} phraseIgnore Indices to ignore.
   * @param {Object} specialCasedTerms Special casing terms.
   * @param {string} headingText Original heading text.
   * @returns {{isValid: boolean, errorMessage?: string}} Validation result.
   */
  function validateFirstWord(firstWord, firstIndex, phraseIgnore, specialCasedTerms, headingText) {
    const firstWordLower = firstWord.toLowerCase();
    const expectedFirstWordCasing = specialCasedTerms[firstWordLower];

    // Skip numeric headings
    if (/^\d/.test(firstWord)) {
      return {
        isValid: true
      };
    }

    // Skip if year at start
    const startsWithYear = /^\d{4}(?:\D|$)/.test(headingText);
    if (startsWithYear) {
      return {
        isValid: true
      };
    }

    // Skip if part of ignored phrase or preserved
    if (phraseIgnore.has(firstIndex) || firstWord.startsWith('__PRESERVED_')) {
      return {
        isValid: true
      };
    }
    if (expectedFirstWordCasing) {
      // Known proper noun or technical term
      if (firstWord !== expectedFirstWordCasing) {
        return {
          isValid: false,
          errorMessage: `First word "${firstWord}" should be "${expectedFirstWordCasing}".`
        };
      }
    } else {
      // Check for hyphenated terms
      const hyphenBase = firstWordLower.split('-')[0];
      const hyphenExpected = specialCasedTerms[hyphenBase];
      if (hyphenExpected) {
        const expected = hyphenExpected + firstWord.slice(hyphenExpected.length);
        if (firstWord !== expected) {
          return {
            isValid: false,
            errorMessage: `First word "${firstWord}" should be "${expected}".`
          };
        }
      } else {
        // Regular sentence case
        const expectedSentenceCase = firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
        if (firstWord !== expectedSentenceCase) {
          // Allow short acronyms (<= 4 chars, all caps)
          if (!(firstWord.length <= 4 && firstWord.toUpperCase() === firstWord)) {
            return {
              isValid: false,
              errorMessage: "Heading's first word should be capitalized."
            };
          }
        }
      }
    }
    return {
      isValid: true
    };
  }

  /**
   * Validates subsequent words in the heading.
   * @param {string[]} words Array of all words.
   * @param {number} startIndex Index to start validation from.
   * @param {Set<number>} phraseIgnore Indices to ignore.
   * @param {Object} specialCasedTerms Special casing terms.
   * @param {string} headingText Original heading text.
   * @returns {{isValid: boolean, errorMessage?: string}} Validation result.
   */
  function validateSubsequentWords(words, startIndex, phraseIgnore, specialCasedTerms, headingText) {
    const colonIndex = headingText.indexOf(':');
    for (let i = startIndex + 1; i < words.length; i++) {
      if (phraseIgnore.has(i)) {
        continue;
      }
      const word = words[i];
      const wordLower = word.toLowerCase();
      const expectedWordCasing = specialCasedTerms[wordLower];

      // Skip preserved segments
      if (word.startsWith('__PRESERVED_') && word.endsWith('__')) {
        continue;
      }

      // Allow capitalization after colon
      const wordPos = headingText.indexOf(word);
      if (colonIndex !== -1 && colonIndex < 10 && wordPos > colonIndex) {
        const afterColon = headingText.slice(colonIndex + 1).trimStart();
        if (afterColon.startsWith(word)) {
          continue;
        }
      }

      // Skip words in parentheses
      if (headingText.includes(`(${word})`) || headingText.includes('(') && headingText.includes(')') && headingText.substring(headingText.indexOf('('), headingText.indexOf(')') + 1).includes(word)) {
        continue;
      }
      if (expectedWordCasing) {
        // Known proper noun or technical term
        if (word !== expectedWordCasing && !(expectedWordCasing === 'Markdown' && wordLower === 'markdown')) {
          return {
            isValid: false,
            errorMessage: `Word "${word}" should be "${expectedWordCasing}".`
          };
        }
      }

      // Check hyphenated words
      if (word.includes('-')) {
        const parts = word.split('-');
        if (parts.length > 1 && parts[1] !== parts[1].toLowerCase()) {
          return {
            isValid: false,
            errorMessage: `Word "${parts[1]}" in heading should be lowercase.`
          };
        }
      }

      // Check general lowercase requirement
      if (word !== word.toLowerCase() && !(word.length <= 4 && word === word.toUpperCase()) &&
      // Allow short acronyms
      word !== 'I' &&
      // Allow the pronoun "I"
      !expectedWordCasing &&
      // If it's not a known proper noun/technical term
      !word.startsWith('PRESERVED')) {
        return {
          isValid: false,
          errorMessage: `Word "${word}" in heading should be lowercase.`
        };
      }
    }
    return {
      isValid: true
    };
  }

  /**
   * Validates bold list items specifically for sentence case.
   * More permissive than heading validation.
   * @param {string} boldText The bold text to validate.
   * @returns {boolean} True if there's a violation.
   */
  function validateBoldListItem(boldText) {
    // First check exemptions on the original text before any cleaning
    const textWithoutMarkup = boldText.replace(/`[^`]+`/g, '').replace(/\[([^\]]+)\]/g, '$1');

    // Skip if should be exempted
    if (shouldExemptFromValidation(boldText, textWithoutMarkup)) {
      return false;
    }

    // Strip leading symbols
    const cleanedText = stripLeadingSymbols(boldText);
    if (!cleanedText) {
      return false;
    }

    // Check for specific problematic patterns before processing markup
    // These patterns indicate violations regardless of markup
    const problematicPatterns = [/\b(CODE|LINK|ITALIC|BOLD)\b/,
    // All caps words that should be lowercase
    /\bTest\b/,
    // "Test" should be lowercase unless at start
    /\bDate\b/,
    // "Date" should be lowercase unless at start  
    /\bVersion\b/ // "Version" should be lowercase unless at start
    ];

    // Check if any word after the first violates these patterns
    const words = cleanedText.split(/\s+/);
    for (let i = 1; i < words.length; i++) {
      // Skip first word
      const word = words[i].replace(/[^a-zA-Z]/g, ''); // Remove punctuation/markup
      for (const pattern of problematicPatterns) {
        if (pattern.test(word)) {
          return true;
        }
      }
    }

    // Get text without markup for further analysis
    const cleanedTextWithoutMarkup = cleanedText.replace(/`[^`]+`/g, '').replace(/\[([^\]]+)\]/g, '$1');

    // Skip if should be exempted after cleaning
    if (shouldExemptFromValidation(cleanedText, cleanedTextWithoutMarkup)) {
      return false;
    }
    const {
      processed
    } = preserveMarkupSegments(cleanedText);
    const clean = processed.replace(/[#*_~!+={}|:;"<>,.?\\]/g, ' ').trim();
    if (!clean) {
      return false;
    }
    const processedWords = clean.split(/\s+/).filter(w => w.length > 0);
    if (processedWords.length === 0) {
      return false;
    }

    // Find first actual word (skip preserved segments)
    let firstWordIndex = 0;
    while (firstWordIndex < processedWords.length && processedWords[firstWordIndex].startsWith('__PRESERVED_')) {
      firstWordIndex++;
    }
    if (firstWordIndex >= processedWords.length) {
      return false; // No actual words
    }

    // For bold list items, flag these violations:

    // 1. All lowercase start (should start with capital)
    const firstWord = processedWords[firstWordIndex];
    if (/^[a-z]/.test(firstWord)) {
      return true;
    }

    // 2. All caps (unless it's a short acronym or single word)
    if (processedWords.length > 1) {
      const nonPreservedWords = processedWords.filter(w => !w.startsWith('__PRESERVED_'));
      if (nonPreservedWords.length > 1 && nonPreservedWords.every(w => w === w.toUpperCase() && w.length > 1)) {
        return true;
      }
    }

    // 3. Title case with common words (multiple words with unnecessary capitals)
    if (processedWords.length >= 2) {
      const titleCasePattern = /^[A-Z][a-z]*(?:\s+[A-Z][a-z]*){1,}/;
      if (titleCasePattern.test(cleanedText.trim())) {
        // Check if it contains common words that shouldn't be capitalized
        const hasCommonWords = /\b(Is|A|An|The|Of|In|On|At|To|For|With|By|And|Or|But|Test|Date|Version)\b/.test(cleanedText);
        if (hasCommonWords) {
          return true;
        }
      }
    }

    // 4. Check for specific technical term violations and other capitalization issues
    for (let i = 0; i < processedWords.length; i++) {
      const word = processedWords[i];
      if (word.startsWith('__PRESERVED_')) continue;
      const wordLower = word.toLowerCase();
      const expectedCasing = specialCasedTerms[wordLower];

      // If we have a known technical term and it doesn't match
      if (expectedCasing && word !== expectedCasing) {
        return true;
      }

      // Check for incorrectly capitalized words that should be lowercase or special cased
      if (i > 0) {
        // Skip first word (already checked)
        // Words like "Test", "Date", "Version" should be lowercase unless they're proper nouns
        if (/^[A-Z][a-z]+$/.test(word) && !expectedCasing) {
          const commonWords = ['Test', 'Date', 'Version', 'Link', 'Code', 'Bold', 'Italic'];
          if (commonWords.includes(word)) {
            return true;
          }
        }
      }

      // Check for hyphenated words that shouldn't be title-cased
      if (word.includes('-') && /[A-Z]/.test(word.slice(1))) {
        const parts = word.split('-');
        // If second part of hyphenated word is capitalized when it shouldn't be
        if (parts.length > 1 && parts[1] !== parts[1].toLowerCase() && !specialCasedTerms[parts[1].toLowerCase()]) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Prepares text for validation by cleaning and preserving markup.
   * @param {string} headingText The original heading text.
   * @returns {{cleanedText: string, textWithoutMarkup: string, processed: string, words: string[]} | null} Prepared text data or null if invalid.
   */
  function prepareTextForValidation(headingText) {
    // First check exemptions on the original text before any cleaning
    const textWithoutMarkup = headingText.replace(/`[^`]+`/g, '').replace(/\[([^\]]+)\]/g, '$1');
    if (shouldExemptFromValidation(headingText, textWithoutMarkup)) {
      return null;
    }

    // Now clean the text for further processing
    const cleanedText = stripLeadingSymbols(headingText);
    if (!cleanedText) {
      return null;
    }
    const {
      processed
    } = preserveMarkupSegments(cleanedText);
    const clean = processed.replace(/[#*_~!+={}|:;"<>,.?\\]/g, ' ').trim();
    if (!clean || /^\d+[\d./-]*$/.test(clean)) {
      return null;
    }
    const words = clean.split(/\s+/).filter(w => w.length > 0);

    // Skip if all words are preserved segments - this means the heading is all markup
    if (words.every(w => w.startsWith('__PRESERVED_') && w.endsWith('__'))) {
      return null;
    }

    // Also check if we can find a valid first word for validation
    const firstValidIndex = findFirstValidationWord(words, cleanedText);
    if (firstValidIndex === -1) {
      return null; // No valid words to validate
    }
    return {
      cleanedText,
      textWithoutMarkup,
      processed,
      words
    };
  }

  /**
   * Performs comprehensive word validation for a heading.
   * @param {string[]} words Array of words to validate.
   * @param {string} cleanedText The cleaned heading text.
   * @param {Set<number>} phraseIgnore Indices to ignore during validation.
   * @returns {{isValid: boolean, errorMessage?: string}} Validation result.
   */
  function performWordValidation(words, cleanedText, phraseIgnore) {
    const firstIndex = findFirstValidationWord(words, cleanedText);
    if (firstIndex === -1) {
      return {
        isValid: true
      };
    }

    // Validate first word
    const firstWord = words[firstIndex];
    const firstWordResult = validateFirstWord(firstWord, firstIndex, phraseIgnore, specialCasedTerms, cleanedText);
    if (!firstWordResult.isValid) {
      return firstWordResult;
    }

    // Check for all caps heading
    if (isAllCapsHeading(words)) {
      return {
        isValid: false,
        errorMessage: 'Heading should not be in all caps.'
      };
    }

    // Validate subsequent words
    return validateSubsequentWords(words, firstIndex, phraseIgnore, specialCasedTerms, cleanedText);
  }

  /**
   * Validates a string for sentence case and reports errors.
   * @param {string} headingText The text to validate.
   * @param {number} lineNumber The line number of the text.
   * @param {string} sourceLine The full source line.
   * @param {Function} reportFn The function to call to report an error.
   */
  function validate(headingText, lineNumber, sourceLine, reportFn) {
    // Debug logging
    if (process.env.DEBUG === 'markdownlint-trap*' || params.config?.debug) {
      console.log(`Validating text at line ${lineNumber}: "${headingText}"`);
    }

    // Prepare text for validation
    const preparedText = prepareTextForValidation(headingText);
    if (!preparedText) {
      return;
    }
    const {
      cleanedText,
      words
    } = preparedText;

    // Check for multi-word proper phrase violations first
    if (validateProperPhrases(cleanedText, lineNumber)) {
      return;
    }

    // Perform comprehensive word validation
    const phraseIgnore = getProperPhraseIndices(words);
    const validationResult = performWordValidation(words, cleanedText, phraseIgnore);
    if (!validationResult.isValid) {
      reportFn(validationResult.errorMessage, lineNumber, cleanedText, sourceLine);
    }
  }

  // Process standard ATX headings
  tokens.forEach(token => {
    if (token.type === 'atxHeading') {
      const lineNumber = token.startLine;
      if (lineNumber === 1 && /README\.md$/i.test(params.name || '')) {
        return;
      }
      const sourceLine = lines[lineNumber - 1];
      const headingText = extractHeadingText(tokens, lines, token);
      validate(headingText, lineNumber, sourceLine, reportForHeading);
    }
  });

  // Process bold text in list items
  // Look for lines with bold markers and validate their content
  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    // Skip lines that are not list items with bold text
    if (!line.trim().startsWith('-') || !line.includes('**')) {
      return;
    }

    // Extract bold text using regex
    const boldMatches = line.matchAll(/\*\*([^*]+)\*\*/g);
    for (const match of boldMatches) {
      const boldText = match[1].trim();
      if (!boldText) continue;

      // If the bold text has a colon, only validate the part before the colon
      const textToValidate = boldText.includes(':') ? boldText.split(':')[0].trim() : boldText;

      // Skip empty text
      if (!textToValidate) continue;

      // Use specialized bold list item validation
      const hasViolation = validateBoldListItem(textToValidate);
      if (hasViolation) {
        onError({
          lineNumber: lineNumber,
          detail: "Bold list item should use sentence case: first word capitalized, rest lowercase except for acronyms, proper nouns, and 'I'.",
          context: `**${boldText}**` // Show with asterisks to indicate it's bold
        });
      }
    }
  });
}
var _default = exports.default = {
  names: ['sentence-case-heading', 'SC001'],
  description: 'Ensures ATX (`# `) headings use sentence case: first word capitalized, rest lowercase except acronyms and "I". Configure with "specialTerms" for custom terms.',
  tags: ['headings', 'style', 'custom', 'basic'],
  parser: 'micromark',
  function: basicSentenceCaseHeadingFunction
};
module.exports = exports.default;