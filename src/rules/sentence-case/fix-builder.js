// @ts-check

/**
 * Fix builder module for sentence-case-heading rule.
 * Handles generation of auto-fix transformations.
 */

import { createSafeFixInfo } from '../autofix-safety.js';
import { stripLeadingSymbols } from './case-classifier.js';
import { escapeRegExp } from '../shared-utils.js';
import { contextualAllCapsTerms } from '../shared-constants.js';
import { exemptCodeTokens, splitTokenAffixes } from './word-validators.js';

/**
 * Matches any internal bookkeeping token that must never reach a document: the
 * fix builder's own `__P_<n>__` placeholder in either casing, and the
 * `__PRESERVED_<n>__` form used by shared-heuristics.js. A placeholder landing
 * inside a larger token is lowercased with its host word, and the case-sensitive
 * restore step then misses it (#343); this pattern is what catches the resulting
 * text before it can be offered as a fix.
 */
const INTERNAL_TOKEN_PATTERN = /__P_\d+__|__PRESERVED_\d+__/i;

/**
 * Rejects a candidate fix that would corrupt the document, so a casing path that
 * mangles an exempt identifier or leaks a placeholder degrades to "no autofix
 * offered" instead of "document corrupted" (#342, #343). This withholding is the
 * whole safety mechanism: nothing here repairs a bad candidate.
 *
 * A fix is corrupting when it carries an internal marker, or when any protected
 * token's slot in the result holds something other than one of that token's
 * allowed replacements — the token verbatim, or the casing the configuration
 * forces on it. Comparing by position rather than by substring means a fix that
 * moves, duplicates or absorbs a protected token is caught too.
 *
 * @param {string} originalText The text the fix would replace.
 * @param {string} fixedText The replacement text.
 * @param {Object} specialCasedTerms Map of lowercase terms to their proper casing.
 * @returns {boolean} True when the fix must be discarded.
 */
function isCorruptingFix(originalText, fixedText, specialCasedTerms) {
  if (INTERNAL_TOKEN_PATTERN.test(fixedText)) {
    return true;
  }

  const protectedTokens = exemptCodeTokens(originalText, specialCasedTerms);
  if (protectedTokens.length === 0) {
    return false;
  }

  // Positions are only comparable while the fix is a token-for-token rewrite, so
  // a fix that changed the token count has moved, duplicated or absorbed
  // something and is rejected without inspecting positions.
  const originalTokens = originalText.split(/\s+/).filter(Boolean);
  const fixedTokens = fixedText.split(/\s+/).filter(Boolean);
  if (fixedTokens.length !== originalTokens.length) {
    return true;
  }

  return protectedTokens.some(({ allowed, index }) => !allowed.includes(fixedTokens[index]));
}

/**
 * Converts a string to sentence case, respecting preserved segments and multi-word special terms.
 * @param {string} text - The text to convert
 * @param {Object} specialCasedTerms - Map of lowercase terms to their proper casing
 * @param {Object} [ambiguousTerms={}] - Map of terms that should preserve their original casing
 * @returns {string | null} The fixed text, or null if no change is needed
 */
export function toSentenceCase(text, specialCasedTerms, ambiguousTerms = {}) {
  // Strip emoji prefix before processing, re-prepend after
  const stripped = stripLeadingSymbols(text);
  const emojiPrefix = stripped !== text ? text.slice(0, text.indexOf(stripped)) : '';
  const textToProcess = stripped;

  const preserved = [];
  // Preserve markup, code, links, versions, dates, bold, italic, and quoted text
  const preservedSegmentsRegex = /`[^`]+`|\[[^\]]+\]\([^)]+\)|\[[^\]]+\]|\b(v?\d+\.\d+(?:\.\d+)?(?:-[a-zA-Z0-9.]+)?)\b|\b(\d{4}-\d{2}-\d{2})\b|(\*\*|__)(.*?)\3|(\*|_)(.*?)\5|"[^"]+"|(?<!\w)'[^']+'/g;

  let processed = textToProcess.replace(preservedSegmentsRegex, (m) => {
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
    const regex = new RegExp(`\\b${escapeRegExp(phraseLower)}\\b`, 'gi');
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
      // Multi-word special terms (like "Agent Skills") count as having the first word
      // so subsequent words should be lowercase
      firstVisibleWordCased = true;
      return w;
    }

    // Separate surrounding punctuation (e.g. "(PARA)", "Storj)") so the bare
    // word still matches the casing dictionary, which is keyed on the word
    // alone. Without this, "(PARA)" keys on "(para)", misses, and is
    // lowercased even though validation (which strips punctuation) passes. (#290)
    const { lead, core, trail } = splitTokenAffixes(w);
    const lowerCore = core.toLowerCase();

    // Preserve ambiguous terms - they could be common nouns or proper nouns
    // (e.g., "Word" could be common noun "word" or Microsoft Word)
    // But only preserve if they're already in valid form (capitalized like a proper noun)
    // Don't preserve ALL CAPS or all lowercase - convert those appropriately
    if (ambiguousTerms[lowerCore]) {
      // A deliberately mixed-case proper noun — an internal capital like
      // "qBittorrent" or a leading digit/symbol like "1Password" — must survive
      // --fix verbatim. Plain sentence-casing capitalizes the first character
      // and lowercases the rest, silently renaming the product. The input is
      // preserved exactly as written rather than normalized to the configured
      // proper form, because the allowed-both-ways contract must also let the
      // lowercase homograph stay lowercase. All-caps forms are excluded so
      // SemVer-style words (e.g. "PATCH") still normalize. (#305)
      const isMixedCaseProperNoun =
        core !== core.toUpperCase() && /\p{Lu}/u.test(core.slice(1));
      if (isMixedCaseProperNoun) {
        firstVisibleWordCased = true;
        return lead + core + trail;
      }
      if (!firstVisibleWordCased) {
        firstVisibleWordCased = true;
        // For first word, capitalize it appropriately
        return lead + core.charAt(0).toUpperCase() + core.slice(1).toLowerCase() + trail;
      }
      // For subsequent words, check if it looks like a proper noun (first letter upper, rest lower)
      // If so, preserve it. If ALL CAPS or all lowercase, convert to lowercase.
      const looksLikeProperNoun = /^[A-Z][a-z]/.test(core);
      if (looksLikeProperNoun) {
        return w; // Preserve "Word" as-is
      }
      return lead + core.toLowerCase() + trail; // Convert "WORD" or "word" to lowercase
    }

    if (specialCasedTerms[lowerCore]) {
      // Contextual ALL_CAPS terms (NOTE, TIP, etc.) should follow normal sentence case
      // unless the word is already ALL_CAPS in the input
      if (contextualAllCapsTerms.has(lowerCore) && core !== core.toUpperCase()) {
        if (!firstVisibleWordCased) {
          firstVisibleWordCased = true;
          return lead + core.charAt(0).toUpperCase() + core.slice(1).toLowerCase() + trail;
        }
        return lead + core.toLowerCase() + trail;
      }
      // Special term counts as the first visible word if we haven't seen one yet
      if (!firstVisibleWordCased) {
        firstVisibleWordCased = true;
      }
      return lead + specialCasedTerms[lowerCore] + trail;
    }

    if (!firstVisibleWordCased) {
      firstVisibleWordCased = true;

      // Don't capitalize kebab-case identifiers
      if (/^[a-z][a-z0-9]*(-[a-z][a-z0-9]*)+$/.test(w)) {
        return w;
      }

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

  const fullFixed = emojiPrefix + fixed;
  return fullFixed === text ? null : fullFixed;
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

  if (!fixedText || isCorruptingFix(text, fixedText, specialCasedTerms)) {
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
 * @param {number} [startIndex=0] - Character offset to begin searching from, used to
 *   locate the correct occurrence when the same bold text appears multiple times on a line
 * @param {Object} [specialCasedTerms={}] - Map of lowercase terms to their proper casing,
 *   read by the corrupting-fix guard so a configured term is not mistaken for an identifier
 * @returns {object|undefined} Fix information or undefined if no fix available
 */
export function buildBoldTextFix(line, originalBoldText, fixedBoldText, safetyConfig, startIndex = 0, specialCasedTerms = {}) {
  // Use literal string search (indexOf) — no regex escaping needed
  const boldPattern = `**${originalBoldText}**`;
  const boldIndex = line.indexOf(boldPattern, startIndex);

  if (boldIndex === -1 || isCorruptingFix(originalBoldText, fixedBoldText, specialCasedTerms)) {
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
