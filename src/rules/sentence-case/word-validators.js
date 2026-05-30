// @ts-check

/**
 * Word-level validation helpers for the SC001 sentence-case-heading rule.
 *
 * Extracted from case-classifier.js per ADR-004 to reduce that file
 * below the ~500 LOC threshold and make word validation testable
 * in isolation (#208).
 */

import { isAcronym } from '../shared-heuristics.js';
import {
  camelCaseExemptions,
  mcMacNamePattern,
  contextualAllCapsTerms
} from '../shared-constants.js';

/**
 * Acronyms that are commonly miswritten in title case as the first segment of a
 * hyphenated compound (e.g. "Yaml-based" → "YAML-based"). Only prefixes in this
 * set are flagged as misspelled acronyms; any other capitalized hyphenated first
 * word (e.g. "Repo-specific", "Per-step", "Tie-breaker") is a normal word and is
 * left alone. Keys are lowercase; values are the canonical all-caps form.
 */
const KNOWN_HYPHEN_PREFIX_ACRONYMS = new Map([
  ['yaml', 'YAML'],
  ['json', 'JSON'],
  ['toml', 'TOML'],
  ['xml', 'XML'],
  ['html', 'HTML'],
  ['css', 'CSS'],
  ['sql', 'SQL'],
  ['api', 'API'],
  ['rest', 'REST'],
  ['http', 'HTTP'],
  ['csv', 'CSV'],
  ['url', 'URL'],
  ['cli', 'CLI'],
  ['sdk', 'SDK'],
  ['jwt', 'JWT'],
  ['saas', 'SaaS']
]);

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
export function isCodeIdentifier(word) {
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
 * Determines whether a hyphenated compound is acceptable because every segment
 * is individually valid: a lowercase word, a short acronym, or a segment whose
 * casing matches a configured acronym or proper noun (e.g. "high-CEFR",
 * "issue-PR", "FAQ-shaped"). At least one segment must be a configured term or
 * acronym so ordinary mixed-case compounds like "issue-Relationship" still flag
 * (#233 Part B.2, extended to the heading subsequent-word path in #245).
 * @param {string} word The hyphenated token to check.
 * @param {Object} specialCasedTerms Special casing terms dictionary.
 * @returns {boolean} True when the compound should be left alone.
 */
export function isAcceptableHyphenatedCompound(word, specialCasedTerms) {
  if (!word.includes('-')) {
    return false;
  }
  const segments = word.split('-');
  if (segments.length < 2) {
    return false;
  }

  let sawConfiguredOrAcronym = false;
  for (const segment of segments) {
    if (segment === '') {
      return false;
    }
    if (segment === segment.toLowerCase()) {
      continue;
    }
    const configured = specialCasedTerms[segment.toLowerCase()];
    if (configured && segment === configured) {
      sawConfiguredOrAcronym = true;
      continue;
    }
    if (isAcronym(segment)) {
      sawConfiguredOrAcronym = true;
      continue;
    }
    return false;
  }

  return sawConfiguredOrAcronym;
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
export function validateFirstWord(firstWord, firstIndex, phraseIgnore, specialCasedTerms, headingText, hadLeadingEmoji, ambiguousTerms = {}) {
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
    // Skip kebab-case identifiers (e.g., "🚀 consumer-repo overview")
    if (/^[a-z][a-z0-9]*(-[a-z][a-z0-9]*)+$/.test(firstWord)) {
      return { isValid: true };
    }

    // For first word after emoji, it should be capitalized (unless it's a special term)
    if (expectedFirstWordCasing) {
      // Contextual ALL_CAPS terms accept sentence case after emoji too
      if (contextualAllCapsTerms.has(firstWordLower)) {
        const sentenceCased = firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
        if (firstWord === sentenceCased || firstWord === expectedFirstWordCasing) {
          return { isValid: true };
        }
      }
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
    // Contextual ALL_CAPS terms (NOTE, TIP, etc.) should be accepted in sentence case
    // when used as the first word (e.g., "Note about security" is valid)
    if (contextualAllCapsTerms.has(firstWordLower)) {
      const sentenceCased = firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
      if (firstWord === sentenceCased || firstWord === expectedFirstWordCasing) {
        return { isValid: true };
      }
    }

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
      // A pure kebab-case identifier (e.g. "claude-code") takes precedence over
      // the hyphen-base special-term lookup so it is never incorrectly flagged
      // as needing capitalisation (#195).
      if (/^[a-z][a-z0-9]*(-[a-z][a-z0-9]*)+$/.test(firstWord)) {
        return { isValid: true };
      }
      // The prefix must use the special-term casing and every hyphenated suffix
      // segment must be lowercase (e.g. "Node.js-based" is valid, "Node.js-Based"
      // is not). Lowercasing the suffix yields the expected form.
      const prefixLen = firstWord.toLowerCase().indexOf(hyphenBase) + hyphenBase.length;
      const expected = hyphenExpected + firstWord.slice(prefixLen).toLowerCase();
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

      // Check for incorrect acronym-prefix forms (e.g., "Yaml-based", "Api-driven", "Json-based").
      // A capitalized hyphenated first word is only a misspelled acronym when its first
      // segment is a recognized acronym (see KNOWN_HYPHEN_PREFIX_ACRONYMS). Ordinary
      // capitalized words like "Repo-specific" or "Per-step" have an uppercase first
      // letter and are valid sentence case, so they are not flagged (#bug-1).
      const incorrectAcronymMatch = /^([A-Z][a-z]+)(-[a-z].*)$/.exec(firstWord);
      if (incorrectAcronymMatch) {
        const prefixLower = incorrectAcronymMatch[1].toLowerCase();
        const canonicalAcronym = KNOWN_HYPHEN_PREFIX_ACRONYMS.get(prefixLower);
        if (canonicalAcronym && canonicalAcronym !== incorrectAcronymMatch[1]) {
          return {
            isValid: false,
            errorMessage: `First word "${firstWord}" should be "${canonicalAcronym}${incorrectAcronymMatch[2]}".`
          };
        }
      }

      // Skip kebab-case identifiers (e.g., "consumer-repo", "my-component")
      if (/^[a-z][a-z0-9]*(-[a-z][a-z0-9]*)+$/.test(firstWord)) {
        return { isValid: true };
      }

      // A hyphenated first word is valid sentence case when its first segment
      // is a properly capitalized word (satisfying the first-word requirement)
      // and every later segment is lowercase, a configured proper noun, or an
      // acronym (e.g. "Word-Markdown", "Non-Italian"). A later segment that is a
      // plain capitalized word ("Well-Known") is still flagged (#245).
      if (firstWord.includes('-')) {
        const segs = firstWord.split('-');
        const firstSegCapitalized = /^[A-Z][a-z]*$/.test(segs[0]);
        const restValid = segs.slice(1).every((seg) => {
          if (seg === '') return false;
          if (seg === seg.toLowerCase()) return true;
          const configured = specialCasedTerms[seg.toLowerCase()];
          if (configured && seg === configured) return true;
          return isAcronym(seg);
        });
        if (firstSegCapitalized && restValid && segs.length > 1) {
          return { isValid: true };
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
export function validateSubsequentWords(words, startIndex, phraseIgnore, specialCasedTerms, headingText, ambiguousTerms = {}) {
  const colonIndex = headingText.indexOf(':');
  const emDashIndex = headingText.indexOf('—');
  const ampersandIndex = headingText.indexOf('&');

  // Initialise search cursor past the first content word so repeated words
  // resolve to their true position rather than the first occurrence (#205).
  let searchPos = 0;
  if (startIndex >= 0 && startIndex < words.length) {
    const firstPos = headingText.indexOf(words[startIndex]);
    if (firstPos !== -1) searchPos = firstPos + words[startIndex].length;
  }

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
    if (word.endsWith("'s") || word.endsWith("\u2019s")) {
      continue;
    }

    // Treat a dotted identifier (e.g. "Claude.ai", "Node.js") as a single product
    // or domain token. When it has no matching special term it is left as-is so a
    // segment like "ai" is never independently flagged (#bug-3).
    if (!expectedWordCasing && /^[A-Za-z][A-Za-z0-9]*\.[A-Za-z][A-Za-z0-9.]*$/.test(word)) {
      continue;
    }

    // Find this word's actual position using the running cursor to handle
    // repeated words correctly (#205).
    const wordPos = headingText.indexOf(word, searchPos);
    if (wordPos !== -1) searchPos = wordPos + word.length;

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
      // Contextual ALL_CAPS terms (NOTE, TIP, etc.) accept lowercase in subsequent position
      if (contextualAllCapsTerms.has(wordLower) && word === word.toLowerCase()) {
        continue;
      }

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
      // A hyphenated special term (e.g. "Anglo-Saxon") matches as a whole token, so
      // no sub-segment is independently checked for lowercase casing (#bug-4).
      if (expectedWordCasing && word === expectedWordCasing) {
        continue;
      }

      // Check if this is an acronym-prefixed compound (e.g., "YAML-based", "API-driven", "HTML/CSS-based", "SQL/NoSQL-hybrid")
      // Pattern: ALL_CAPS acronym (2-4 letters, no lowercase) optionally with slash-separated acronyms, then hyphen and lowercase
      const acronymPrefixMatch = /^([A-Z]{2,4}(?:\/[A-Z][a-z]+)?(?:\/[A-Z]{2,})*)(-[a-z].*)$/.exec(word);
      if (acronymPrefixMatch) {
        // This is valid - acronym prefix with lowercase suffix
        continue;
      }

      // A compound whose every segment is a lowercase word or a configured
      // acronym/proper noun (e.g. "high-CEFR", "issue-PR") is acceptable. This
      // whole-token reasoning previously ran only on the bold path (#245).
      if (isAcceptableHyphenatedCompound(word, specialCasedTerms)) {
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

    // Exempt digit-bearing tokens that are NOT title-cased words: units,
    // versions, and all-caps product names ("25KB", "BCE-500", "PM2", "v1.5")
    // are not subject to sentence-case casing. A title-cased word with an
    // incidental digit ("Database2") still falls through to the check (#bug-2).
    if (/\d/.test(word) && !/^[A-Z][a-z]/.test(word)) {
      continue;
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
