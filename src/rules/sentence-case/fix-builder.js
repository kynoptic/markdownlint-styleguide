// @ts-check

/**
 * Fix builder module for sentence-case-heading rule.
 * Handles generation of auto-fix transformations.
 */

import { createSafeFixInfo } from '../autofix-safety.js';
import { stripLeadingSymbols } from './case-classifier.js';
import { escapeRegExp } from '../shared-utils.js';
import { contextualAllCapsTerms } from '../shared-constants.js';
import { exemptCodeTokens, isExemptCodeToken } from './word-validators.js';

/**
 * Internal placeholder used to hold a span out of the word-by-word casing pass.
 *
 * The delimiter is a NULL character, which cannot appear in Markdown and has no
 * upper or lower case, so the token round-trips through the case transformations
 * below unchanged. The previous `__P_<n>__` form did not: a placeholder that
 * landed inside a larger token (preserving "_is_" out of "This_is_a_sentence"
 * leaves "This__P_0__a_sentence") was lowercased along with its host word, and
 * the case-sensitive restore step then failed to match "__p_0__" and wrote the
 * placeholder into the document (#343).
 *
 * @param {number} index Index into the preserved-segment array.
 * @returns {string} The placeholder token.
 */
function placeholderFor(index) {
  return `\u0000${index}\u0000`;
}

/** Matches a placeholder produced by placeholderFor, capturing its index. */
// eslint-disable-next-line no-control-regex
const PLACEHOLDER_PATTERN = /\u0000(\d+)\u0000/g;

/** Prefix identifying a token that is entirely, or begins with, a placeholder. */
const PLACEHOLDER_PREFIX = '\u0000';

/**
 * Matches any internal bookkeeping token that must never reach a document: the
 * placeholder above, the `__P_<n>__` form it replaced in either casing, and the
 * `__PRESERVED_<n>__` form used by shared-heuristics.js.
 */
// eslint-disable-next-line no-control-regex
const INTERNAL_TOKEN_PATTERN = /\u0000|__P_\d+__|__PRESERVED_\d+__/i;

/**
 * Rejects a candidate fix that would corrupt the document.
 *
 * This is a backstop, not the primary fix: the casing paths consult
 * isExemptCodeToken and the placeholder round-trips by construction. It exists
 * so that a path which forgets either degrades to "no autofix offered" instead
 * of "document corrupted". It reads the same exemption derivation the fixer
 * reads, so the two cannot disagree about which tokens are off limits.
 *
 * @param {string} originalText The text the fix would replace.
 * @param {string} fixedText The replacement text.
 * @returns {boolean} True when the fix must be discarded.
 */
function isCorruptingFix(originalText, fixedText) {
  if (INTERNAL_TOKEN_PATTERN.test(fixedText)) {
    return true;
  }
  return exemptCodeTokens(originalText).some((token) => !fixedText.includes(token));
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

  // Hold exempt code identifiers out of the casing pass first, before the markup
  // regex runs. Order matters: the italic branch of that regex would otherwise
  // swallow the interior of a snake_case identifier ("user_name_id" -> the "_name_"
  // span), splitting a token the validator exempts and rewriting the remains (#342).
  let processed = textToProcess
    .split(/(\s+)/)
    .map((token) => {
      if (!isExemptCodeToken(token)) {
        return token;
      }
      preserved.push(token);
      return placeholderFor(preserved.length - 1);
    })
    .join('');

  processed = processed.replace(preservedSegmentsRegex, (m) => {
    preserved.push(m);
    return placeholderFor(preserved.length - 1);
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
      return placeholderFor(preserved.length - 1);
    });
  }

  const words = processed.split(/\s+/).filter(Boolean);
  const firstWordIndex = words.findIndex((w) => !w.startsWith(PLACEHOLDER_PREFIX));

  if (firstWordIndex === -1) {
    return null;
  }

  let firstVisibleWordCased = false;
  const fixedWords = words.map((w) => {
    if (w.startsWith(PLACEHOLDER_PREFIX)) {
      // Multi-word special terms (like "Agent Skills") count as having the first word
      // so subsequent words should be lowercase
      firstVisibleWordCased = true;
      return w;
    }

    // Separate surrounding punctuation (e.g. "(PARA)", "Storj)") so the bare
    // word still matches the casing dictionary, which is keyed on the word
    // alone. Without this, "(PARA)" keys on "(para)", misses, and is
    // lowercased even though validation (which strips punctuation) passes. (#290)
    const lead = (w.match(/^[^\p{L}\p{N}]+/u) || [''])[0];
    const trail = (w.match(/[^\p{L}\p{N}]+$/u) || [''])[0];
    const core = w.slice(lead.length, w.length - trail.length);
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
  fixed = fixed.replace(PLACEHOLDER_PATTERN, (_, idx) => preserved[Number(idx)]);

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

  if (!fixedText || isCorruptingFix(text, fixedText)) {
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
 * @returns {object|undefined} Fix information or undefined if no fix available
 */
export function buildBoldTextFix(line, originalBoldText, fixedBoldText, safetyConfig, startIndex = 0) {
  // Use literal string search (indexOf) — no regex escaping needed
  const boldPattern = `**${originalBoldText}**`;
  const boldIndex = line.indexOf(boldPattern, startIndex);

  if (boldIndex === -1 || isCorruptingFix(originalBoldText, fixedBoldText)) {
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
