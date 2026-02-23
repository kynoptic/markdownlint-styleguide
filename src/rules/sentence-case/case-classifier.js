// @ts-check

/**
 * Case classification and validation module for sentence-case-heading rule.
 *
 * This module provides pure functions for validating and classifying text case.
 * All functions return validation results without side effects (no onError calls).
 */

import { isAcronym, preserveSegments } from '../shared-heuristics.js';
import {
  UNICODE_LETTER_REGEX,
  UNICODE_UPPERCASE_REGEX,
  camelCaseExemptions,
  mcMacNamePattern
} from '../shared-constants.js';

/**
 * Code identifier patterns for detecting programming constructs in headings.
 * These should preserve their original casing (not be lowercased).
 */
const CODE_IDENTIFIER_PATTERNS = {
  // camelCase: starts lowercase, has internal uppercase (useEffect, fetchData)
  camelCase: /^[a-z][a-z0-9]*[A-Z][a-zA-Z0-9]*$/,
  // PascalCase: starts uppercase, has another uppercase, has lowercase (MyComponent, HttpClient)
  // Uses requirement of 2+ uppercase letters to avoid matching proper nouns like "Paris"
  pascalCase: /^[A-Z](?=[a-zA-Z0-9]*[A-Z])[a-zA-Z0-9]*[a-z][a-zA-Z0-9]*$/,
  // snake_case: lowercase with underscores (user_name, max_retries)
  snakeCase: /^_?[a-z][a-z0-9]*(?:_[a-z0-9]+)+$/
};

/**
 * Checks if a word is a code identifier that should preserve its casing.
 * @param {string} word The word to check.
 * @returns {boolean} True if the word is a code identifier.
 */
function isCodeIdentifier(word) {
  // Check against exemptions first (brand names like iPhone, eBay)
  if (camelCaseExemptions.has(word)) {
    return false; // It's a brand name, not a code identifier
  }

  // Check Mc/Mac surname pattern (McDonald, MacArthur)
  if (mcMacNamePattern.test(word)) {
    return false; // It's a name, not a code identifier
  }

  // Check identifier patterns
  return (
    CODE_IDENTIFIER_PATTERNS.camelCase.test(word) ||
    CODE_IDENTIFIER_PATTERNS.pascalCase.test(word) ||
    CODE_IDENTIFIER_PATTERNS.snakeCase.test(word)
  );
}

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
  const numeric = /^[-\d.,/]+$/;

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
 * Validates the first word's capitalization.
 * @param {string} firstWord The first word to validate.
 * @param {number} firstIndex Index of the first word.
 * @param {Set<number>} phraseIgnore Indices to ignore.
 * @param {Object} specialCasedTerms Special casing terms.
 * @param {string} headingText Original heading text.
 * @param {boolean} hadLeadingEmoji Whether the original text had leading emoji.
 * @param {Object} ambiguousTerms Ambiguous terms to skip (optional).
 * @returns {{isValid: boolean, errorMessage?: string}} Validation result.
 */
function validateFirstWord(firstWord, firstIndex, phraseIgnore, specialCasedTerms, headingText, hadLeadingEmoji, ambiguousTerms = {}) {
  const firstWordLower = firstWord.toLowerCase();
  const firstWordForLookup = firstWord.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const expectedFirstWordCasing = specialCasedTerms[firstWordLower];

  // Skip ambiguous terms - words that could be either common nouns or proper nouns (e.g., "go", "rust", "word")
  if (ambiguousTerms[firstWordLower] || ambiguousTerms[firstWordForLookup]) {
    return { isValid: true };
  }

  // Skip numeric headings
  if (/^\d/.test(firstWord)) {
    return { isValid: true };
  }

  // Skip if year at start
  if (/^\d{4}(?:\D|$)/.test(headingText)) {
    return { isValid: true };
  }

  // Skip first-word capitalisation when the heading starts with a numbered
  // criterion identifier like "1.a", "2.b", "10.c" (issue #146).  After
  // punctuation cleanup these split into separate tokens ("1" + "a"), so
  // the first validation word is a single lowercase letter that was part
  // of the numbering scheme, not a regular English word.
  if (/^\d+[.)]\s*[a-z]\b/.test(headingText) && firstWord.length === 1) {
    return { isValid: true };
  }

  // Skip if part of ignored phrase or preserved
  if (phraseIgnore.has(firstIndex) || firstWord.startsWith('__PRESERVED_')) {
    return { isValid: true };
  }

  // If there was a leading emoji, the first word after it should be treated as the first word
  // and follow standard first-word capitalization rules
  if (hadLeadingEmoji) {
    // For first word after emoji, it should be capitalized (unless it's a special term)
    if (expectedFirstWordCasing) {
      // Known proper noun or technical term
      const firstWordWithoutParens = firstWord.replace(/[()]/g, '');
      if (firstWord !== expectedFirstWordCasing && firstWordWithoutParens !== expectedFirstWordCasing) {
        return {
          isValid: false,
          errorMessage: `First word "${firstWord}" should be "${expectedFirstWordCasing}".`
        };
      }
    } else {
      // Regular sentence case - first letter uppercase, rest lowercase
      const expectedSentenceCase = firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
      if (firstWord !== expectedSentenceCase) {
        // Allow short acronyms (<= 4 chars, all caps)
        if (!isAcronym(firstWord)) {
          return {
            isValid: false,
            errorMessage: `First word "${firstWord}" should be "${expectedSentenceCase}".`
          };
        }
      }
    }
    return { isValid: true };
  }

  if (expectedFirstWordCasing) {
    // Known proper noun or technical term
    // Allow parentheses around special terms like (TCO)
    const firstWordWithoutParens = firstWord.replace(/[()]/g, '');
    if (firstWord !== expectedFirstWordCasing && firstWordWithoutParens !== expectedFirstWordCasing) {
      return {
        isValid: false,
        errorMessage: `First word "${firstWord}" should be "${expectedFirstWordCasing}".`
      };
    }
  } else if (firstWord.includes('/') && !firstWord.includes('://')) {
    // Check for slash-separated terms (e.g., "macOS/Linux", "Linux/WSL")
    // Exclude URL protocols
    const slashParts = firstWord.split('/');
    const allPartsKnown = slashParts.every(part => {
      const partLower = part.toLowerCase();
      return specialCasedTerms[partLower] !== undefined;
    });

    if (allPartsKnown) {
      // All parts are known terms - check each has correct casing
      const allCorrectlyCased = slashParts.every(part => {
        const partLower = part.toLowerCase();
        const expected = specialCasedTerms[partLower];
        return part === expected;
      });

      if (!allCorrectlyCased) {
        const expectedCasing = slashParts.map(part => {
          const partLower = part.toLowerCase();
          return specialCasedTerms[partLower] || part;
        }).join('/');
        return {
          isValid: false,
          errorMessage: `First word "${firstWord}" should be "${expectedCasing}".`
        };
      }
      return { isValid: true };
    }
    // If not all parts are known, fall through to standard handling
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
      // Check for acronym-prefixed compounds (e.g., "YAML-based", "API-driven", "HTML/CSS-based", "SQL/NoSQL-hybrid")
      // Pattern: ALL_CAPS acronym (2-4 letters, no lowercase) optionally with slash-separated acronyms, then hyphen and lowercase
      // Special case: allows mixed-case after slash like "SQL/NoSQL" but NOT at the start like "Well-known"
      const acronymPrefixMatch = /^([A-Z]{2,4}(?:\/[A-Z][a-z]+)?(?:\/[A-Z]{2,})*)(-[a-z].*)$/.exec(firstWord);
      if (acronymPrefixMatch) {
        // This is the correct form (e.g., "YAML-based", "HTML/CSS-based", "SQL/NoSQL-hybrid") - allow it
        return { isValid: true };
      }

      // Check for incorrect acronym-prefix forms (e.g., "Yaml-based", "Api-driven", "Json-based")
      // Only flag if it looks like a misspelled acronym (short, matches common patterns)
      const incorrectAcronymMatch = /^([A-Z][a-z]{1,3})(-[a-z].*)$/.exec(firstWord);
      if (incorrectAcronymMatch) {
        const possibleAcronym = incorrectAcronymMatch[1].toUpperCase();
        // Only flag if the uppercase version would be a valid acronym (2-4 chars)
        // AND it doesn't look like a normal word (exclude common words like "Well", "Over", "Under", etc.)
        // Common English words that appear as hyphenated prefixes - NOT acronyms
        // e.g., "How-to", "Step-by-step", "In-person", "Self-service"
        const commonHyphenatedPrefixes = [
          'well', 'over', 'under', 'self', 'non', 'pre', 'post', 'anti', 'pro', 'co',
          'how', 'step', 'in', 'on', 'off', 'out', 'up', 'down', 'all', 'one', 'two',
          'high', 'low', 'long', 'short', 'full', 'half', 'part', 'cross', 'multi',
          'day', 'time', 'year', 'end', 'mid', 'top', 'sub', 're', 'de', 'un',
          // Technical compound words (not acronyms)
          'rule', 'user', 'file', 'line', 'code', 'auto', 'type', 'real', 'open',
          'zero', 'data', 'test', 'back', 'side', 'case', 'base', 'next', 'last',
          'osv', 'npm', 'cli', 'api'  // Tool/tech names used as prefixes
        ];
        if (possibleAcronym.length >= 2 && possibleAcronym.length <= 4 &&
            !commonHyphenatedPrefixes.includes(possibleAcronym.toLowerCase())) {
          return {
            isValid: false,
            errorMessage: `First word "${firstWord}" should be "${possibleAcronym}${incorrectAcronymMatch[2]}".`
          };
        }
      }

      // Regular sentence case
      const expectedSentenceCase = firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
      if (firstWord !== expectedSentenceCase) {
        // Allow short acronyms (<= 4 chars, all caps)
        // Allow code identifiers (camelCase, PascalCase, snake_case)
        if (!isAcronym(firstWord) && !isCodeIdentifier(firstWord)) {
          return {
            isValid: false,
            errorMessage: "Heading's first word should be capitalized."
          };
        }
      }
    }
  }

  return { isValid: true };
}

/**
 * Validates subsequent words in the heading.
 * @param {string[]} words Array of all words.
 * @param {number} startIndex Index to start validation from.
 * @param {Set<number>} phraseIgnore Indices to ignore.
 * @param {Object} specialCasedTerms Special casing terms.
 * @param {string} headingText Original heading text.
 * @param {Object} ambiguousTerms Ambiguous terms to skip (optional).
 * @returns {{isValid: boolean, errorMessage?: string}} Validation result.
 */
function validateSubsequentWords(words, startIndex, phraseIgnore, specialCasedTerms, headingText, ambiguousTerms = {}) {
  const colonIndex = headingText.indexOf(':');
  const emDashIndex = headingText.indexOf('—');
  const ampersandIndex = headingText.indexOf('&');

  for (let i = startIndex + 1; i < words.length; i++) {
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
    if (word.endsWith("'s") || word.endsWith("'s")) {
      continue;
    }

    // Find the position of this word in the heading
    const wordPos = headingText.indexOf(word);

    // Allow proper capitalization for the first word after colon (e.g., "Priority 1: Critical fixes")
    // But only if the word is correctly cased (first letter uppercase, rest lowercase) or matches a special term
    if (colonIndex !== -1 && wordPos > colonIndex) {
      const afterColon = headingText.slice(colonIndex + 1).trimStart();
      if (afterColon.startsWith(word)) {
        // Check if word is correctly sentence-cased or matches expected special term casing
        const expectedSentenceCase = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        const matchesSpecialTerm = expectedWordCasing && word === expectedWordCasing;
        const isCorrectlyCased = word === expectedSentenceCase || isAcronym(word) || matchesSpecialTerm;
        // Only skip if correctly cased AND no special term violation
        if (isCorrectlyCased && !(expectedWordCasing && word !== expectedWordCasing)) {
          continue;
        }
      }
    }

    // Allow proper capitalization for the first word after em-dash (e.g., "ADR 001 — Email template")
    if (emDashIndex !== -1 && wordPos > emDashIndex) {
      const afterEmDash = headingText.slice(emDashIndex + 1).trimStart();
      if (afterEmDash.startsWith(word)) {
        const expectedSentenceCase = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        const matchesSpecialTerm = expectedWordCasing && word === expectedWordCasing;
        const isCorrectlyCased = word === expectedSentenceCase || isAcronym(word) || matchesSpecialTerm;
        if (isCorrectlyCased && !(expectedWordCasing && word !== expectedWordCasing)) {
          continue;
        }
      }
    }

    // Allow capitalization for the word after ampersand (e.g., "Body & Outer Container")
    // This handles title-like headings with ampersand
    if (ampersandIndex !== -1 && wordPos > ampersandIndex) {
      const afterAmpersand = headingText.slice(ampersandIndex + 1).trimStart();
      if (afterAmpersand.startsWith(word)) {
        const expectedSentenceCase = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        const matchesSpecialTerm = expectedWordCasing && word === expectedWordCasing;
        const isCorrectlyCased = word === expectedSentenceCase || isAcronym(word) || matchesSpecialTerm;
        if (isCorrectlyCased && !(expectedWordCasing && word !== expectedWordCasing)) {
          continue;
        }
      }
    }

    // Skip words in parentheses
    if (
      headingText.includes(`(${word})`) ||
      (headingText.includes('(') && headingText.includes(')') &&
        headingText.substring(headingText.indexOf('('), headingText.indexOf(')') + 1).includes(word))
    ) {
      continue;
    }

    if (expectedWordCasing) {
      // Known proper noun or technical term
      // Allow parentheses around special terms like (TCO)
      const wordWithoutParens = word.replace(/[()]/g, '');
      if (
        word !== expectedWordCasing &&
        wordWithoutParens !== expectedWordCasing &&
        !(expectedWordCasing === 'Markdown' && wordLower === 'markdown')
      ) {
        return {
          isValid: false,
          errorMessage: `Word "${word}" should be "${expectedWordCasing}".`
        };
      }
    }

    // Check hyphenated words
    if (word.includes('-')) {
      // Check if this is an acronym-prefixed compound (e.g., "YAML-based", "API-driven", "HTML/CSS-based", "SQL/NoSQL-hybrid")
      // Pattern: ALL_CAPS acronym (2-4 letters, no lowercase) optionally with slash-separated acronyms, then hyphen and lowercase
      const acronymPrefixMatch = /^([A-Z]{2,4}(?:\/[A-Z][a-z]+)?(?:\/[A-Z]{2,})*)(-[a-z].*)$/.exec(word);
      if (acronymPrefixMatch) {
        // This is valid - acronym prefix with lowercase suffix
        continue;
      }

      const parts = word.split('-');

      // Check if first part is a known special term (e.g., "Codex-compatible", "Claude-based")
      // If so, validate the hyphenated word has correct casing: special term + lowercase suffix
      const firstPartLower = parts[0].toLowerCase();
      const expectedFirstPart = specialCasedTerms[firstPartLower];
      if (expectedFirstPart && parts.length > 1) {
        // First part is a product name or special term
        if (parts[0] === expectedFirstPart && parts.slice(1).every(p => p === p.toLowerCase())) {
          // Correctly cased: "Codex-compatible" where Codex is preserved and rest is lowercase
          continue;
        }
      }

      if (parts.length > 1 && parts[1] !== parts[1].toLowerCase()) {
        return {
          isValid: false,
          errorMessage: `Word "${parts[1]}" in heading should be lowercase.`
        };
      }
    }

    // Skip ALL-CAPS words that are part of a filename in the original text
    // (e.g., "LICENSE" from "LICENSE.md" after dot removal in the clean step)
    if (word === word.toUpperCase() && word.length > 1) {
      const filenameInHeading = new RegExp(`\\b${word}\\.[a-zA-Z]+\\b`);
      if (filenameInHeading.test(headingText)) {
        continue;
      }
    }

    // Check general lowercase requirement
    if (
      word !== word.toLowerCase() &&
      !isAcronym(word) && // Allow short acronyms
      word !== 'I' && // Allow the pronoun "I"
      !expectedWordCasing && // If it's not a known proper noun/technical term
      !word.startsWith('PRESERVED') &&
      !isCodeIdentifier(word) // Allow code identifiers (camelCase, PascalCase, snake_case)
    ) {
      return {
        isValid: false,
        errorMessage: `Word "${word}" in heading should be lowercase.`
      };
    }
  }

  return { isValid: true };
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
 * Performs stricter validation for bold text in list items.
 * @param {string[]} words Array of words to validate.
 * @param {string} cleanedText The cleaned text.
 * @param {boolean} hadLeadingEmoji Whether the original text had leading emoji.
 * @param {Object} specialCasedTerms Special casing terms.
 * @param {Object} ambiguousTerms Ambiguous terms to skip (optional).
 * @returns {{isValid: boolean, errorMessage?: string}} Validation result.
 */
function performBoldTextValidation(words, cleanedText, hadLeadingEmoji, specialCasedTerms, ambiguousTerms = {}) {
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
    if (word.endsWith("'s") || word.endsWith("'s")) {
      continue;
    }

    // Skip single letters (often section identifiers like "Part B")
    if (word.length === 1) {
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

// Export helper functions for testing
export {
  stripLeadingSymbols,
  isAllCapsHeading,
  prepareTextForValidation
};
