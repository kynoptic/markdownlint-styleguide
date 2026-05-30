// @ts-check

/**
 * Bold text validation for the SC001 sentence-case-heading rule.
 *
 * Extracted from case-classifier.js per ADR-004 to reduce that file
 * below the ~500 LOC threshold and make bold text validation testable
 * in isolation (#208).
 */

import { isAcronym } from '../shared-heuristics.js';
import { UNICODE_UPPERCASE_REGEX, contextualAllCapsTerms } from '../shared-constants.js';
import { isAcceptableHyphenatedCompound, validateFirstWord } from './word-validators.js';
import {
  findFirstValidationWord,
  getProperPhraseIndices,
  isAllCapsHeading,
  prepareTextForValidation,
  validateProperPhrases
} from './case-classifier.js';

/**
 * Performs stricter validation for bold text in list items.
 * @param {string[]} words Array of words to validate.
 * @param {string} cleanedText The cleaned text.
 * @param {boolean} hadLeadingEmoji Whether the original text had leading emoji.
 * @param {Object} specialCasedTerms Special casing terms.
 * @param {Object} ambiguousTerms Ambiguous terms to skip (optional).
 * @returns {{isValid: boolean, errorMessage?: string}} Validation result.
 */
export function performBoldTextValidation(words, cleanedText, hadLeadingEmoji, specialCasedTerms, ambiguousTerms = {}) {
  const firstIndex = findFirstValidationWord(words);
  if (firstIndex === -1) {
    return { isValid: true };
  }

  // Get phrase ignore indices
  const phraseIgnore = getProperPhraseIndices(words, specialCasedTerms);

  // Check if the original text starts with a number
  const startsWithNumber = firstIndex > 0 && /^\d/.test(words[0]);

  // Validate first word (but not if it comes after a number in bold text)
  const firstWord = words[firstIndex];
  if (!startsWithNumber) {
    const firstWordResult = validateFirstWord(firstWord, firstIndex, phraseIgnore, specialCasedTerms, cleanedText, hadLeadingEmoji, ambiguousTerms);
    if (!firstWordResult.isValid) {
      return firstWordResult;
    }
  }

  // Check for all caps (stricter than headings)
  if (isAllCapsHeading(words)) {
    return {
      isValid: false,
      errorMessage: 'Bold text should not be in all caps.'
    };
  }

  // Validate subsequent words with stricter rules
  for (let i = firstIndex + 1; i < words.length; i++) {
    if (phraseIgnore.has(i)) {
      continue;
    }

    const word = words[i];
    const wordLower = word.toLowerCase();
    // Strip punctuation for lookup in specialCasedTerms
    const wordForLookup = word.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const expectedWordCasing = specialCasedTerms[wordLower] || specialCasedTerms[wordForLookup];

    // Skip ambiguous terms - words that could be either common nouns or proper nouns (e.g., "go", "rust", "word")
    if (ambiguousTerms[wordLower] || ambiguousTerms[wordForLookup]) {
      continue;
    }

    // Skip preserved segments (including when wrapped in parentheses like "(__PRESERVED_0__)")
    if (word.includes('__PRESERVED_') && word.includes('__')) {
      continue;
    }

    // Skip possessive words (likely part of proper nouns like "Patel's")
    if (word.endsWith("'s") || word.endsWith("\u2019s")) {
      continue;
    }

    // Skip single letters (often section identifiers like "Part B")
    if (word.length === 1) {
      continue;
    }

    // A hyphenated special term (e.g. "Anglo-Saxon") matches as a whole token, so
    // no sub-segment is independently checked for lowercase casing (#233 Part B.2).
    if (expectedWordCasing && word === expectedWordCasing && word.includes('-')) {
      continue;
    }

    // Contextual ALL_CAPS terms (NOTE, TIP, CAUTION, etc.) double as ordinary
    // lowercase prose words. When such a word appears lowercase in a non-first
    // bold position it is normal prose, not the alert keyword, so it is not
    // forced to all caps. This mirrors the heading subsequent-word path (#245).
    if (contextualAllCapsTerms.has(wordLower) && word === word.toLowerCase()) {
      continue;
    }

    // For bold text, be stricter about acronyms - only allow known technical terms
    if (expectedWordCasing) {
      // Known proper noun or technical term
      // Allow parentheses around special terms like (TCO)
      const wordWithoutParens = word.replace(/[()]/g, '');
      if (word !== expectedWordCasing && wordWithoutParens !== expectedWordCasing) {
        return {
          isValid: false,
          errorMessage: `Word "${word}" should be "${expectedWordCasing}".`
        };
      }
    } else {
      // For bold text, apply sentence case rules but be more permissive than headings
      const isFirstWord = i === firstIndex;

      // Allow 'I' pronoun
      if (word === 'I') {
        continue;
      }

      // Allow short acronyms (4 chars or less, all caps)
      if (isAcronym(word)) {
        continue;
      }

      // Allow single letters (section identifiers like "Part B")
      if (word.length === 1) {
        continue;
      }

      // For the first word in bold text, it should be capitalized (sentence case)
      // But if the text starts with a number, don't require capitalization
      if (isFirstWord && !startsWithNumber) {
        const expectedCase = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        if (word !== expectedCase && !isAcronym(word)) {
          return {
            isValid: false,
            errorMessage: `First word "${word}" in bold text should be properly capitalized.`
          };
        }
      } else {
        // For non-first words, be selective about what can be capitalized
        // Allow common section words and descriptive words that are often capitalized
        const allowedCapitalizedWords = [
          'Background', 'Context', 'Overview', 'Summary', 'Introduction', 'Conclusion',
          'Step', 'Part', 'Section', 'Appendix', 'Chapter', 'Notes', 'References'
        ];

        if (!allowedCapitalizedWords.includes(word)) {
          // Exempt digit-bearing tokens that are NOT title-cased words: units,
          // versions, and all-caps product names ("25KB", "BCE-500", "PM2") are
          // not subject to the all-caps or lowercase checks. This mirrors the
          // heading path's digit exemption, which was missing here (#233 Part B.1).
          // A title-cased word with an incidental digit ("Database2") still falls
          // through to the checks below.
          if (/\d/.test(word) && !/^[A-Z][a-z]/.test(word)) {
            continue;
          }

          // A hyphenated compound is acceptable when every segment is itself
          // acceptable: a lowercase word or a segment whose uppercased form is a
          // configured acronym / special term (e.g. "high-CEFR", "FAQ-shaped",
          // "API-wide"). This whole-token reasoning previously only ran on the
          // heading path (#233 Part B.2).
          if (word.includes('-') && isAcceptableHyphenatedCompound(word, specialCasedTerms)) {
            continue;
          }

          // Check for all-caps violations (but allow known acronyms from specialCasedTerms)
          if (word === word.toUpperCase() && word.length > 1 && UNICODE_UPPERCASE_REGEX.test(word) && !expectedWordCasing) {
            return {
              isValid: false,
              errorMessage: `Word "${word}" in bold text should not be in all caps.`
            };
          }

          // Check for general capitalization violations
          if (word !== word.toLowerCase()) {
            return {
              isValid: false,
              errorMessage: `Word "${word}" in bold text should be lowercase.`
            };
          }
        }
      }
    }

    // Check hyphenated words
    if (word.includes('-')) {
      // Whole-token special-term and acceptable-compound matches already passed
      // above; skip the per-segment lowercase check for those (#233 Part B.2).
      if (expectedWordCasing && word === expectedWordCasing) {
        continue;
      }
      if (isAcceptableHyphenatedCompound(word, specialCasedTerms)) {
        continue;
      }

      const parts = word.split('-');
      if (parts.length > 1 && parts[1] !== parts[1].toLowerCase()) {
        return {
          isValid: false,
          errorMessage: `Word "${parts[1]}" in bold text should be lowercase.`
        };
      }
    }
  }

  return { isValid: true };
}

/**
 * Validates bold text with stricter rules than headings.
 * @param {string} boldText The bold text to validate.
 * @param {Object} specialCasedTerms Special casing terms dictionary.
 * @param {Object} ambiguousTerms Ambiguous terms to skip (optional).
 * @returns {{isValid: boolean, errorMessage?: string}} Validation result.
 */
export function validateBoldText(boldText, specialCasedTerms, ambiguousTerms = {}) {
  if (!boldText || !boldText.trim()) {
    return { isValid: true };
  }

  const trimmedText = boldText.trim();
  const trimmedLower = trimmedText.toLowerCase();

  // Skip conventional commit types - these are intentionally lowercase by convention
  // Common types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
  const conventionalCommitTypes = [
    'feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test',
    'build', 'ci', 'chore', 'revert', 'wip', 'release'
  ];
  if (conventionalCommitTypes.includes(trimmedLower)) {
    return { isValid: true };
  }

  // Skip all-caps single words used for emphasis (e.g., **ALWAYS**, **NEVER**, **WARNING**)
  // These are intentionally capitalized for emphasis in documentation
  if (/^[A-Z]{2,}$/.test(trimmedText)) {
    return { isValid: true };
  }

  // Skip kebab-case identifiers (e.g., **architecture-reviewer**, **code-quality-reviewer**)
  // These are code/tool identifiers that should preserve their casing
  if (/^[a-z][a-z0-9]*(-[a-z0-9]+)+$/.test(trimmedText)) {
    return { isValid: true };
  }

  // Skip directory path patterns (e.g., **scripts/**, **src/**, **templates/**)
  // These are code/path identifiers that should preserve their casing
  if (/^[a-zA-Z][-a-zA-Z0-9_.]*\/\**$/.test(trimmedText)) {
    return { isValid: true };
  }

  // Skip filename patterns in bold (e.g., **SKILL.md**, **config.json**, **README.md**)
  // These are file identifiers that should preserve their casing
  const boldFilenamePattern = /^[a-zA-Z][-a-zA-Z0-9_.]*\.(js|mjs|cjs|ts|tsx|jsx|py|sh|bash|zsh|json|yaml|yml|md|txt|html|css|scss|less|xml|toml|ini|cfg|conf|env|sql|rb|go|rs|java|kt|swift|c|cpp|h|hpp|php|pl|r|lua|vim|el|ex|exs|erl|hs|scala|clj|groovy|gradle|make|cmake|dockerfile|gitignore|gitattributes|editorconfig|prettierrc|eslintrc|babelrc|nvmrc|npmrc)$/i;
  if (boldFilenamePattern.test(trimmedText)) {
    return { isValid: true };
  }

  // Check for specific problematic patterns before processing markup
  // These patterns indicate violations regardless of markup context
  const problematicPatterns = [
    /\b(CODE|LINK|ITALIC|BOLD)\b/, // All caps words that should be lowercase
    /\bTest\b/, // "Test" should be lowercase unless at start
    /\bDate\b/, // "Date" should be lowercase unless at start
    /\bVersion\b/ // "Version" should be lowercase unless at start
  ];

  // Check if any word after the first violates these patterns
  const words = boldText.split(/\s+/);
  for (let i = 1; i < words.length; i++) { // Skip first word
    const word = words[i].replace(/[^a-zA-Z]/g, ''); // Remove punctuation/markup

    // Skip single letters (they're often section identifiers like "Part B")
    if (word.length === 1) {
      continue;
    }

    for (const pattern of problematicPatterns) {
      if (pattern.test(word)) {
        return {
          isValid: false,
          errorMessage: `Word "${word}" in bold text should be lowercase.`
        };
      }
    }
  }

  // Prepare text for validation
  const preparedText = prepareTextForValidation(boldText);
  if (!preparedText) {
    return { isValid: true };
  }

  const { cleanedText, words: processedWords, hadLeadingEmoji } = preparedText;

  // Check for multi-word proper phrase violations first
  const phraseResult = validateProperPhrases(cleanedText, specialCasedTerms);
  if (phraseResult) {
    return phraseResult;
  }

  // For bold text, use stricter validation
  return performBoldTextValidation(processedWords, cleanedText, hadLeadingEmoji, specialCasedTerms, ambiguousTerms);
}
