// @ts-check

/**
 * Fix builder module for sentence-case-heading rule.
 * Handles generation of auto-fix transformations.
 */

import { createSafeFixInfo } from '../autofix-safety.js';

/**
 * Converts a string to sentence case, respecting preserved segments and multi-word special terms.
 * @param {string} text - The text to convert
 * @param {Object} specialCasedTerms - Map of lowercase terms to their proper casing
 * @param {Object} [ambiguousTerms={}] - Map of terms that should preserve their original casing
 * @returns {string | null} The fixed text, or null if no change is needed
 */
export function toSentenceCase(text, specialCasedTerms, ambiguousTerms = {}) {
  const preserved = [];
  // Preserve markup, code, links, versions, dates, bold, italic, and quoted text
  const preservedSegmentsRegex = /`[^`]+`|\[[^\]]+\]\([^)]+\)|\[[^\]]+\]|\b(v?\d+\.\d+(?:\.\d+)?(?:-[a-zA-Z0-9.]+)?)\b|\b(\d{4}-\d{2}-\d{2})\b|(\*\*|__)(.*?)\3|(\*|_)(.*?)\5|"[^"]+"|'[^']+'/g;

  let processed = text.replace(preservedSegmentsRegex, (m) => {
    preserved.push(m);
    return `__P_${preserved.length - 1}__`;
  });

  // Handle multi-word special terms BEFORE word-by-word processing
  // Replace multi-word phrases with placeholders to preserve them through word processing
  for (const [phraseLower, phraseCorrect] of Object.entries(specialCasedTerms)) {
    if (!phraseLower.includes(' ')) {
      continue; // Skip single-word terms, they'll be handled in word loop
    }

    // Case-insensitive regex to find the phrase
    const regex = new RegExp(`\\b${phraseLower}\\b`, 'gi');
    processed = processed.replace(regex, () => {
      // Preserve the correctly-cased phrase
      preserved.push(phraseCorrect);
      return `__P_${preserved.length - 1}__`;
    });
  }

  const words = processed.split(/\s+/).filter(Boolean);
  const firstWordIndex = words.findIndex((w) => !w.startsWith('__P_'));

  if (firstWordIndex === -1) {
    return null;
  }

  let firstVisibleWordCased = false;
  const fixedWords = words.map((w) => {
    if (w.startsWith('__P_')) {
      return w;
    }

    const lower = w.toLowerCase();

    // Preserve ambiguous terms - they could be common nouns or proper nouns
    // (e.g., "Word" could be common noun "word" or Microsoft Word)
    // But only preserve if they're already in valid form (capitalized like a proper noun)
    // Don't preserve ALL CAPS or all lowercase - convert those appropriately
    if (ambiguousTerms[lower]) {
      if (!firstVisibleWordCased) {
        firstVisibleWordCased = true;
        // For first word, capitalize it appropriately
        return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
      }
      // For subsequent words, check if it looks like a proper noun (first letter upper, rest lower)
      // If so, preserve it. If ALL CAPS or all lowercase, convert to lowercase.
      const looksLikeProperNoun = /^[A-Z][a-z]/.test(w);
      if (looksLikeProperNoun) {
        return w; // Preserve "Word" as-is
      }
      return w.toLowerCase(); // Convert "WORD" or "word" to lowercase
    }

    if (specialCasedTerms[lower]) {
      // Special term counts as the first visible word if we haven't seen one yet
      if (!firstVisibleWordCased) {
        firstVisibleWordCased = true;
      }
      return specialCasedTerms[lower];
    }

    if (!firstVisibleWordCased) {
      firstVisibleWordCased = true;

      // Check for acronym-prefixed compounds (e.g., "YAML-based", "API-driven")
      // Pattern: ALL_CAPS followed by hyphen and lowercase word
      const acronymPrefixMatch = /^([A-Z]{2,})(-[a-z].*)$/.exec(w);
      if (acronymPrefixMatch) {
        // Preserve the acronym prefix, lowercase the rest
        return acronymPrefixMatch[1] + acronymPrefixMatch[2];
      }

      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    }

    return w.toLowerCase();
  });

  let fixed = fixedWords.join(' ');
  fixed = fixed.replace(/__P_(\d+)__/g, (_, idx) => preserved[Number(idx)]);

  return fixed === text ? null : fixed;
}

/**
 * Generate fix information for a heading.
 * @param {string} line - The source line containing the heading
 * @param {string} text - The heading text to fix
 * @param {Object} specialCasedTerms - Map of lowercase terms to their proper casing
 * @param {Object} safetyConfig - Safety configuration for autofix
 * @param {Object} [ambiguousTerms={}] - Map of terms that should preserve their original casing
 * @returns {object|undefined} Fix information or undefined if no fix available
 */
export function buildHeadingFix(line, text, specialCasedTerms, safetyConfig, ambiguousTerms = {}) {
  const match = /^(#{1,6})(\s+)(.*)$/.exec(line);
  if (!match) {
    return undefined;
  }

  const prefixLength = match[1].length + match[2].length;
  const fixedText = toSentenceCase(text, specialCasedTerms, ambiguousTerms);

  if (!fixedText) {
    return undefined;
  }

  const originalFixInfo = {
    editColumn: prefixLength + 1,
    deleteCount: text.length,
    insertText: fixedText
  };

  // Apply safety checks to the fix
  return createSafeFixInfo(
    originalFixInfo,
    'sentence-case',
    text,
    fixedText,
    { line },
    safetyConfig
  );
}

/**
 * Generate fix information for bold text.
 * @param {string} line - The source line containing the bold text
 * @param {string} originalBoldText - The original bold text to fix
 * @param {string} fixedBoldText - The corrected bold text
 * @param {Object} safetyConfig - Safety configuration for autofix
 * @returns {object|undefined} Fix information or undefined if no fix available
 */
export function buildBoldTextFix(line, originalBoldText, fixedBoldText, safetyConfig) {
  // Find the position of the bold text within the line
  const boldPattern = `**${originalBoldText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}**`;
  const boldIndex = line.indexOf(boldPattern);

  if (boldIndex === -1) {
    return undefined;
  }

  const originalFixInfo = {
    editColumn: boldIndex + 3, // After the opening **
    deleteCount: originalBoldText.length,
    insertText: fixedBoldText
  };

  // Apply safety checks to the fix
  return createSafeFixInfo(
    originalFixInfo,
    'sentence-case',
    originalBoldText,
    fixedBoldText,
    { line },
    safetyConfig
  );
}
