// @ts-check

/**
 * Case classification and validation module for sentence-case-heading rule.
 *
 * This module provides pure functions for validating and classifying text case.
 * All functions return validation results without side effects (no onError calls).
 */

import { preserveSegments } from '../shared-heuristics.js';
import { UNICODE_LETTER_REGEX } from '../shared-constants.js';
import { validateFirstWord, validateSubsequentWords } from './word-validators.js';

/**
 * Strips emoji and symbol characters from the beginning of text.
 * @param {string} text The text to clean.
 * @returns {string} The cleaned text.
 */
function stripLeadingSymbols(text) {
  // Remove leading emoji and some decorative symbols but preserve numbers, letters, and markdown
  // This handles complex emoji sequences including:
  // - Basic emoji (🎉, 🚀, ✨, 📝)
  // - Emoji with skin tone modifiers (👨🏻‍💻)
  // - Multi-person emoji (👨‍👩‍👧‍👦)
  // - Professional emoji (🧑‍⚕️, 👨‍💻)

  // Use a comprehensive emoji removal approach that handles complete sequences
  let cleaned = text.trim();

  // Remove complete emoji sequences including ZWJ sequences
  // Using a simple approach that works with emoji ranges
  // This handles complex emoji with ZWJ, skin tone modifiers, etc.
  let prevLength;
  do {
    prevLength = cleaned.length;
    // Remove various emoji ranges
    cleaned = cleaned.replace(/^[\u{1F1E0}-\u{1F1FF}]/u, ''); // Regional indicators (flags)
    cleaned = cleaned.replace(/^[\u{1F300}-\u{1F5FF}]/u, ''); // Miscellaneous symbols and pictographs
    cleaned = cleaned.replace(/^[\u{1F600}-\u{1F64F}]/u, ''); // Emoticons
    cleaned = cleaned.replace(/^[\u{1F680}-\u{1F6FF}]/u, ''); // Transport and map symbols
    cleaned = cleaned.replace(/^[\u{1F700}-\u{1F77F}]/u, ''); // Alchemical symbols
    cleaned = cleaned.replace(/^[\u{1F780}-\u{1F7FF}]/u, ''); // Geometric shapes extended
    cleaned = cleaned.replace(/^[\u{1F800}-\u{1F8FF}]/u, ''); // Supplemental arrows-C
    cleaned = cleaned.replace(/^[\u{2600}-\u{26FF}]/u, '');  // Miscellaneous symbols
    cleaned = cleaned.replace(/^[\u{2700}-\u{27BF}]/u, '');  // Dingbats
    cleaned = cleaned.replace(/^[\u{1F900}-\u{1F9FF}]/u, ''); // Supplemental symbols and pictographs
    cleaned = cleaned.replace(/^[\u{1FA00}-\u{1FA6F}]/u, ''); // Chess symbols
    cleaned = cleaned.replace(/^[\u{1FA70}-\u{1FAFF}]/u, ''); // Symbols and pictographs extended-A
    cleaned = cleaned.replace(/^[\u{1F000}-\u{1F02F}]/u, ''); // Mahjong tiles
    cleaned = cleaned.replace(/^[\u{1F0A0}-\u{1F0FF}]/u, ''); // Playing cards
    cleaned = cleaned.replace(/^[\u{1F100}-\u{1F1FF}]/u, ''); // Enclosed alphanumeric supplement
    cleaned = cleaned.replace(/^[\u{1F3FB}-\u{1F3FF}]/u, ''); // Skin tone modifiers
    cleaned = cleaned.replace(/^\u200D/u, ''); // Zero-width joiner
    cleaned = cleaned.replace(/^\uFE0F/u, ''); // Variation selector-16
  } while (cleaned.length < prevLength && cleaned.length > 0);

  // Clean up any remaining whitespace
  cleaned = cleaned.replace(/^\s+/, '').trim();

  return cleaned;
}

// Note: preserveMarkupSegments has been replaced with the shared preserveSegments function
// from shared-heuristics.js to avoid code duplication

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

  // Exempt headings that start with quoted text (e.g., `"npm test" fails silently`)
  // The quoted portion is treated as a code/command reference, and words after it
  // don't need to follow standard capitalization rules
  if (/^["'][^"']+["']\s+[a-z]/.test(headingText.trim())) {
    return true;
  }

  // Skip if empty after cleaning
  if (!headingText || headingText.trim().length === 0) {
    return true;
  }

  // Skip if no alphabetic characters (likely version numbers, etc.)
  if (!UNICODE_LETTER_REGEX.test(textWithoutMarkup)) {
    return true;
  }

  // Skip filename headings (e.g., "### batch-transform.js", "### config.yaml")
  // These are code identifiers that should preserve their original casing
  const trimmedText = headingText.trim();
  const filenamePattern = /^[a-zA-Z][-a-zA-Z0-9_.]*\.(js|mjs|cjs|ts|tsx|jsx|py|sh|bash|zsh|json|yaml|yml|md|txt|html|css|scss|less|xml|toml|ini|cfg|conf|env|sql|rb|go|rs|java|kt|swift|c|cpp|h|hpp|php|pl|r|lua|vim|el|ex|exs|erl|hs|scala|clj|groovy|gradle|make|cmake|dockerfile|gitignore|gitattributes|editorconfig|prettierrc|eslintrc|babelrc|nvmrc|npmrc)$/i;
  if (filenamePattern.test(trimmedText)) {
    return true;
  }

  // Skip file path headings (e.g., "#### docs/README.md", "### src/utils/helper.js")
  // These are code identifiers that should preserve their original casing
  const filePathPattern = /^[a-zA-Z_.~][-a-zA-Z0-9_./]*\.(js|mjs|cjs|ts|tsx|jsx|py|sh|bash|zsh|json|yaml|yml|md|txt|html|css|scss|less|xml|toml|ini|cfg|conf|env|sql|rb|go|rs|java|kt|swift|c|cpp|h|hpp|php|pl|r|lua|vim|el|ex|exs|erl|hs|scala|clj|groovy|gradle|make|cmake|dockerfile|gitignore|gitattributes|editorconfig|prettierrc|eslintrc|babelrc|nvmrc|npmrc)$/i;
  if (filePathPattern.test(trimmedText)) {
    return true;
  }

  // Skip headings that START with an ALL-CAPS filename (e.g., "## SKILL.md format", "## README.md guidelines")
  // These are conventional documentation filenames that should preserve their uppercase casing
  // Note: We only match ALL-CAPS base names (like SKILL.md, README.md) to avoid exempting
  // headings like "Node.js-Based tools" where Node.js is just a tech term, not a doc filename
  // Match: ALLCAPS.ext or ALL_CAPS.ext or ALL-CAPS.ext (but not Node.js which has lowercase)
  const firstWord = trimmedText.split(/\s+/)[0] || '';
  const allCapsFilenamePattern = /^[A-Z][A-Z0-9_-]*\.[a-zA-Z]+$/;
  if (allCapsFilenamePattern.test(firstWord)) {
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

  // Skip numbered list-style headings only if they have emoji prefix
  // (e.g., "🔧 1. getting started" but not "1. article weighting algorithm")
  const cleanedText = stripLeadingSymbols(headingText);
  const hasEmojiPrefix = cleanedText !== headingText.trim();
  if (hasEmojiPrefix && /^\d+\.\s/.test(cleanedText)) {
    return true;
  }

  // Skip form field / metadata patterns like "name (required)", "description (optional)"
  // These are intentionally lowercase in technical documentation and API specs
  if (/^\w+\s*\((required|optional|deprecated|readonly|read-only)\)$/i.test(headingText.trim())) {
    return true;
  }

  return false;
}

/**
 * Finds the first non-preserved word index for validation.
 * @param {string[]} words Array of words from the heading.
 * @returns {number} Index of first word to validate, or -1 if none found.
 */
function findFirstValidationWord(words) {
  let firstIndex = 0;
  const numeric = /^[-\d.,/]+$|^\d+[a-z]$/;

  while (
    firstIndex < words.length &&
    (
      // Skip preserved segments (code spans, links, etc.) at the start
      (words[firstIndex].startsWith('__PRESERVED_') && words[firstIndex].endsWith('__')) ||
      numeric.test(words[firstIndex])
    )
  ) {
    firstIndex++;
  }

  return firstIndex < words.length ? firstIndex : -1;
}

/**
 * Determine indices of words that are part of multi-word proper nouns.
 * @param {string[]} words - Tokenized heading words.
 * @param {Object} specialCasedTerms Special casing terms.
 * @returns {Set<number>} Indices that should be ignored during case checks.
 */
function getProperPhraseIndices(words, specialCasedTerms) {
  const indices = new Set();
  const lowerWords = words.map((w) => w.toLowerCase());
  Object.keys(specialCasedTerms).forEach((key) => {
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
 * @param {Object} specialCasedTerms Special casing terms.
 * @returns {{isValid: boolean, errorMessage?: string, phrase?: string, expected?: string} | null} Validation result or null if valid.
 */
function validateProperPhrases(text, specialCasedTerms) {
  for (const [phrase, expected] of Object.entries(specialCasedTerms)) {
    if (!phrase.includes(' ')) {
      continue;
    }
    const regex = new RegExp(`\\b${phrase}\\b`, 'i');
    const match = regex.exec(text);
    if (match && match[0] !== expected) {
      return {
        isValid: false,
        errorMessage: `Phrase "${match[0]}" should be "${expected}".`,
        phrase: match[0],
        expected
      };
    }
  }
  return null;
}

/**
 * Determine if all non-acronym words are uppercase.
 * @param {string[]} words - Words extracted from the heading.
 * @returns {boolean} True when every relevant word is uppercase.
 */
function isAllCapsHeading(words) {
  const relevant = words.filter(
    (w) =>
      w.length > 1 &&
      !(w.startsWith('__PRESERVED_') && w.endsWith('__'))
  );
  const allCaps = relevant.filter((w) => w === w.toUpperCase());
  return (
    relevant.length > 1 &&
    allCaps.length === relevant.length &&
    !/\d/.test(relevant.join(''))
  );
}

/**
 * Prepares text for validation by cleaning and preserving markup.
 * @param {string} headingText The original heading text.
 * @returns {{cleanedText: string, textWithoutMarkup: string, processed: string, words: string[], hadLeadingEmoji: boolean} | null} Prepared text data or null if invalid.
 */
function prepareTextForValidation(headingText) {
  // Strip HTML tags so anchor spans do not interfere with first-word detection (issue #146).
  const textWithoutHtml = headingText.replace(/<[^>]+>/g, '').trim();

  // First check exemptions on the cleaned text before any further cleaning
  const textWithoutMarkup = textWithoutHtml
    .replace(/`[^`]+`/g, '')
    .replace(/\[([^\]]+)\]/g, '$1');

  if (shouldExemptFromValidation(textWithoutHtml, textWithoutMarkup)) {
    return null;
  }

  // Check if we had emoji at the start before cleaning
  const hadLeadingEmoji = textWithoutHtml !== stripLeadingSymbols(textWithoutHtml);

  // Now clean the text for further processing
  const cleanedText = stripLeadingSymbols(textWithoutHtml);
  if (!cleanedText) {
    return null;
  }

  const { processed } = preserveSegments(cleanedText);
  // Clean text but preserve the __PRESERVED_N__ markers
  const clean = processed
    .replace(/[#*~!+={}|:;"<>,.?\\]/g, ' ') // Remove special chars but keep underscores for preserved segments
    .trim();

  if (!clean || /^\d+[\d./-]*$/.test(clean)) {
    return null;
  }

  const words = clean.split(/\s+/).filter((w) => w.length > 0);

  // Skip if all words are preserved segments - this means the heading is all markup
  if (words.every((w) => w.startsWith('__PRESERVED_') && w.endsWith('__'))) {
    return null;
  }

  // Also check if we can find a valid first word for validation
  const firstValidIndex = findFirstValidationWord(words);
  if (firstValidIndex === -1) {
    return null; // No valid words to validate
  }

  return { cleanedText, textWithoutMarkup, processed, words, hadLeadingEmoji };
}

/**
 * Performs comprehensive word validation for a heading.
 * @param {string[]} words Array of words to validate.
 * @param {string} cleanedText The cleaned heading text.
 * @param {Set<number>} phraseIgnore Indices to ignore during validation.
 * @param {boolean} hadLeadingEmoji Whether the original text had leading emoji.
 * @param {Object} specialCasedTerms Special casing terms.
 * @param {Object} ambiguousTerms Ambiguous terms to skip (optional).
 * @returns {{isValid: boolean, errorMessage?: string}} Validation result.
 */
function performWordValidation(words, cleanedText, phraseIgnore, hadLeadingEmoji, specialCasedTerms, ambiguousTerms = {}) {
  const firstIndex = findFirstValidationWord(words);
  if (firstIndex === -1) {
    return { isValid: true };
  }

  // Validate first word
  const firstWord = words[firstIndex];
  const firstWordResult = validateFirstWord(firstWord, firstIndex, phraseIgnore, specialCasedTerms, cleanedText, hadLeadingEmoji, ambiguousTerms);
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
  return validateSubsequentWords(words, firstIndex, phraseIgnore, specialCasedTerms, cleanedText, ambiguousTerms);
}

/**
 * Validates heading text for sentence case compliance.
 * @param {string} headingText The heading text to validate.
 * @param {Object} specialCasedTerms Special casing terms dictionary.
 * @param {Object} ambiguousTerms Ambiguous terms to skip (optional).
 * @returns {{isValid: boolean, errorMessage?: string, cleanedText?: string}} Validation result with cleaned text for error reporting.
 */
export function validateHeading(headingText, specialCasedTerms, ambiguousTerms = {}) {
  // Prepare text for validation
  const preparedText = prepareTextForValidation(headingText);
  if (!preparedText) {
    return { isValid: true };
  }

  const { cleanedText, words, hadLeadingEmoji } = preparedText;

  // Check for multi-word proper phrase violations first
  const phraseResult = validateProperPhrases(cleanedText, specialCasedTerms);
  if (phraseResult) {
    return { ...phraseResult, cleanedText };
  }

  // Perform comprehensive word validation
  const phraseIgnore = getProperPhraseIndices(words, specialCasedTerms);
  const validationResult = performWordValidation(words, cleanedText, phraseIgnore, hadLeadingEmoji, specialCasedTerms, ambiguousTerms);
  return { ...validationResult, cleanedText };
}

// validateBoldText moved to bold-text-classifier.js (#208)

// Export helper functions for testing and for use by bold-text-classifier.js
export {
  stripLeadingSymbols,
  isAllCapsHeading,
  prepareTextForValidation,
  findFirstValidationWord,
  getProperPhraseIndices,
  validateProperPhrases
};
