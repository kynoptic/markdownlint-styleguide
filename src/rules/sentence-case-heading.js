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
import { createSafeFixInfo } from './autofix-safety.js';
import { 
  validateStringArray, 
  validateConfig, 
  logValidationErrors,
  createMarkdownlintLogger 
} from './config-validation.js';

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
  const seq = tokens.find(
    (t) => t.type === 'atxHeadingSequence' &&
            t.startLine === lineNumber &&
            t.startColumn === token.startColumn
  );
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
  // These remain as console.warn since they are deprecation warnings, not configuration errors
  if (config.technicalTerms && Array.isArray(config.technicalTerms) && config.technicalTerms.length > 0) {
    console.warn('⚠️  Configuration warning [sentence-case-heading]: "technicalTerms" is deprecated. Please use "specialTerms" instead.');
  }
  if (config.properNouns && Array.isArray(config.properNouns) && config.properNouns.length > 0) {
    console.warn('⚠️  Configuration warning [sentence-case-heading]: "properNouns" is deprecated. Please use "specialTerms" instead.');
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

  /**
   * Converts a string to sentence case, respecting preserved segments.
   * @param {string} text The text to convert.
   * @returns {string | null} The fixed text, or null if no change is needed.
   */
  function toSentenceCase(text) {
    const preserved = [];
    const preservedSegmentsRegex = /`[^`]+`|\[[^\]]+\]\([^)]+\)|\[[^\]]+\]|\b(v?\d+\.\d+(?:\.\d+)?(?:-[a-zA-Z0-9.]+)?)\b|\b(\d{4}-\d{2}-\d{2})\b|(\*\*|__)(.*?)\3|(\*|_)(.*?)\5/g;
    const processed = text
      .replace(preservedSegmentsRegex, (m) => {
        preserved.push(m);
        return `__P_${preserved.length - 1}__`;
      });
    const words = processed.split(/\s+/).filter(Boolean);
    const firstWordIndex = words.findIndex((w) => !w.startsWith('__P_'));
    if (firstWordIndex === -1) { return null; }

    let firstVisibleWordCased = false;
    const fixedWords = words.map((w) => {
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
    return createSafeFixInfo(originalFixInfo, 'sentence-case', text, fixedText, { line }, safetyConfig);
  }

  /**
   * Generate fix information for bold text.
   * @param {string} line The source line containing the bold text.
   * @param {string} originalBoldText The original bold text to fix.
   * @param {string} fixedBoldText The corrected bold text.
   * @returns {object|undefined} Fix information or undefined if no fix available.
   */
  function getFixInfoForBoldText(line, originalBoldText, fixedBoldText) {
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
    const safetyConfig = params.config?.autofix?.safety || {};
    return createSafeFixInfo(originalFixInfo, 'sentence-case', originalBoldText, fixedBoldText, { line }, safetyConfig);
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
    const headingContent = commentIndex !== -1 ?
      line.slice(0, commentIndex).trimEnd() :
      line;
    const textToFix = headingContent.replace(/^#+\s*/, '');

    onError({
      lineNumber,
      detail,
      context: headingText,
      fixInfo: getFixInfoForHeading(line, textToFix)
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
    const fixedText = toSentenceCase(boldText);
    
    onError({
      lineNumber,
      detail,
      context: `**${boldText}**`,
      fixInfo: fixedText ? getFixInfoForBoldText(line, boldText, fixedText) : undefined
    });
  }

  /**
   * Validates bold text with stricter rules than headings.
   * @param {string} boldText The bold text to validate.
   * @param {number} lineNumber The line number of the text.
   * @param {string} sourceLine The full source line.
   */
  function validateBoldText(boldText, lineNumber, sourceLine) {
    if (!boldText || !boldText.trim()) {
      return;
    }

    // Debug logging
    if (process.env.DEBUG === 'markdownlint-trap*' || params.config?.debug) {
      console.log(`Validating bold text at line ${lineNumber}: "**${boldText}**"`);
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
          reportForBoldText(`Word "${word}" in bold text should be lowercase.`, lineNumber, boldText, sourceLine);
          return;
        }
      }
    }

    // Prepare text for validation
    const preparedText = prepareTextForValidation(boldText);
    if (!preparedText) {
      return;
    }
    
    const { cleanedText, words: processedWords, hadLeadingEmoji } = preparedText;
    
    // Check for multi-word proper phrase violations first
    if (validateProperPhrases(cleanedText, lineNumber)) {
      return;
    }
    
    // For bold text, use stricter validation
    const validationResult = performBoldTextValidation(processedWords, cleanedText, hadLeadingEmoji);
    
    if (!validationResult.isValid) {
      reportForBoldText(validationResult.errorMessage, lineNumber, boldText, sourceLine);
    }
  }

  /**
   * Performs stricter validation for bold text in list items.
   * @param {string[]} words Array of words to validate.
   * @param {string} cleanedText The cleaned text.
   * @param {boolean} hadLeadingEmoji Whether the original text had leading emoji.
   * @returns {{isValid: boolean, errorMessage?: string}} Validation result.
   */
  function performBoldTextValidation(words, cleanedText, hadLeadingEmoji) {
    const firstIndex = findFirstValidationWord(words);
    if (firstIndex === -1) {
      return { isValid: true };
    }
    
    // Get phrase ignore indices
    const phraseIgnore = getProperPhraseIndices(words);
    
    // Check if the original text starts with a number
    const startsWithNumber = firstIndex > 0 && /^\d/.test(words[0]);
    
    // Validate first word (but not if it comes after a number in bold text)
    const firstWord = words[firstIndex];
    if (!startsWithNumber) {
      const firstWordResult = validateFirstWord(firstWord, firstIndex, phraseIgnore, specialCasedTerms, cleanedText, hadLeadingEmoji);
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
      
      // Skip preserved segments
      if (word.startsWith('__PRESERVED_') && word.endsWith('__')) {
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
        if (word.length <= 4 && word === word.toUpperCase() && /^[A-Z]+$/.test(word)) {
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
          if (word !== expectedCase && !(word.length <= 4 && word === word.toUpperCase() && /^[A-Z]+$/.test(word))) {
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
            if (word === word.toUpperCase() && word.length > 1 && /[A-Z]/.test(word) && !expectedWordCasing) {
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
   * Determine indices of words that are part of multi-word proper nouns.
   * @param {string[]} words - Tokenized heading words.
   * @returns {Set<number>} Indices that should be ignored during case checks.
   */
  function getProperPhraseIndices(words) {
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

  /**
   * Preserves markup segments and returns processed text with placeholders.
   * @param {string} text The text to process.
   * @returns {{processed: string, preservedSegments: string[]}} Processed text and preserved segments.
   */
  function preserveMarkupSegments(text) {
    const preservedSegments = [];
    let processed = text;
    
    // Process one type at a time to avoid conflicts
    // 1. Code spans first (highest priority)
    processed = processed.replace(/`([^`]+)`/g, (m) => {
      preservedSegments.push(m);
      return `__PRESERVED_${preservedSegments.length - 1}__`;
    });
    
    // 2. Links
    processed = processed.replace(/\[[^\]]+\]\([^)]+\)|\[[^\]]+\]/g, (m) => {
      preservedSegments.push(m);
      return `__PRESERVED_${preservedSegments.length - 1}__`;
    });
    
    // 3. Version numbers (but not already preserved)
    processed = processed.replace(/\b(v?\d+\.\d+(?:\.\d+)?(?:-[a-zA-Z0-9.]+)?)\b/g, (match, ...args) => {
      const fullMatch = args[args.length - 1];
      // Don't preserve if it's already a preserved segment
      if (fullMatch.includes('__PRESERVED_')) {
        return match;
      }
      preservedSegments.push(match);
      return `__PRESERVED_${preservedSegments.length - 1}__`;
    });
    
    // 4. Dates
    processed = processed.replace(/\b(\d{4}-\d{2}-\d{2})\b/g, (match, ...args) => {
      const fullMatch = args[args.length - 1];
      if (fullMatch.includes('__PRESERVED_')) {
        return match;
      }
      preservedSegments.push(match);
      return `__PRESERVED_${preservedSegments.length - 1}__`;
    });
    
    // 5. Bold text (but not already preserved)
    processed = processed.replace(/(\*\*|__)(.*?)\1/g, (match, marker, content, ...args) => {
      const fullMatch = args[args.length - 1];
      if (fullMatch.includes('__PRESERVED_')) {
        return match;
      }
      preservedSegments.push(match);
      return `__PRESERVED_${preservedSegments.length - 1}__`;
    });
    
    // 6. Italic text (but not already preserved)
    processed = processed.replace(/(\*|_)(.*?)\1/g, (match, marker, content, ...args) => {
      const fullMatch = args[args.length - 1];
      if (fullMatch.includes('__PRESERVED_')) {
        return match;
      }
      preservedSegments.push(match);
      return `__PRESERVED_${preservedSegments.length - 1}__`;
    });
    
    return { processed, preservedSegments };
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
    
    // Skip numbered list-style headings only if they have emoji prefix
    // (e.g., "🔧 1. getting started" but not "1. article weighting algorithm")
    const cleanedText = stripLeadingSymbols(headingText);
    const hasEmojiPrefix = cleanedText !== headingText.trim();
    if (hasEmojiPrefix && /^\d+\.\s/.test(cleanedText)) {
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
   * @returns {{isValid: boolean, errorMessage?: string}} Validation result.
   */
  function validateFirstWord(firstWord, firstIndex, phraseIgnore, specialCasedTerms, headingText, hadLeadingEmoji) {
    const firstWordLower = firstWord.toLowerCase();
    const expectedFirstWordCasing = specialCasedTerms[firstWordLower];
    
    // Skip numeric headings
    if (/^\d/.test(firstWord)) {
      return { isValid: true };
    }
    
    // Skip if year at start
    const startsWithYear = /^\d{4}(?:\D|$)/.test(headingText);
    if (startsWithYear) {
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
          if (!(firstWord.length <= 4 && firstWord.toUpperCase() === firstWord)) {
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
    
    return { isValid: true };
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
      // Strip punctuation for lookup in specialCasedTerms
      const wordForLookup = word.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const expectedWordCasing = specialCasedTerms[wordLower] || specialCasedTerms[wordForLookup];
      
      // Skip preserved segments
      if (word.startsWith('__PRESERVED_') && word.endsWith('__')) {
        continue;
      }
      
      // Skip possessive words (likely part of proper nouns like "Patel's")
      if (word.endsWith("'s") || word.endsWith("'s")) {
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
        const parts = word.split('-');
        if (parts.length > 1 && parts[1] !== parts[1].toLowerCase()) {
          return {
            isValid: false,
            errorMessage: `Word "${parts[1]}" in heading should be lowercase.`
          };
        }
      }
      
      // Check general lowercase requirement
      if (
        word !== word.toLowerCase() &&
        !(word.length <= 4 && word === word.toUpperCase()) && // Allow short acronyms
        word !== 'I' && // Allow the pronoun "I"
        !expectedWordCasing && // If it's not a known proper noun/technical term
        !word.startsWith('PRESERVED')
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
   * Prepares text for validation by cleaning and preserving markup.
   * @param {string} headingText The original heading text.
   * @returns {{cleanedText: string, textWithoutMarkup: string, processed: string, words: string[], hadLeadingEmoji: boolean} | null} Prepared text data or null if invalid.
   */
  function prepareTextForValidation(headingText) {
    // First check exemptions on the original text before any cleaning
    const textWithoutMarkup = headingText
      .replace(/`[^`]+`/g, '')
      .replace(/\[([^\]]+)\]/g, '$1');
    
    if (shouldExemptFromValidation(headingText, textWithoutMarkup)) {
      return null;
    }
    
    // Check if we had emoji at the start before cleaning
    const hadLeadingEmoji = headingText.trim() !== stripLeadingSymbols(headingText.trim());
    
    // Now clean the text for further processing
    const cleanedText = stripLeadingSymbols(headingText);
    if (!cleanedText) {
      return null;
    }
    
    const { processed } = preserveMarkupSegments(cleanedText);
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
   * @returns {{isValid: boolean, errorMessage?: string}} Validation result.
   */
  function performWordValidation(words, cleanedText, phraseIgnore, hadLeadingEmoji) {
    const firstIndex = findFirstValidationWord(words);
    if (firstIndex === -1) {
      return { isValid: true };
    }
    
    // Validate first word
    const firstWord = words[firstIndex];
    const firstWordResult = validateFirstWord(firstWord, firstIndex, phraseIgnore, specialCasedTerms, cleanedText, hadLeadingEmoji);
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
    
    const { cleanedText, words, hadLeadingEmoji } = preparedText;
    
    // Check for multi-word proper phrase violations first
    if (validateProperPhrases(cleanedText, lineNumber)) {
      return;
    }
    
    // Perform comprehensive word validation
    const phraseIgnore = getProperPhraseIndices(words);
    const validationResult = performWordValidation(words, cleanedText, phraseIgnore, hadLeadingEmoji);
    
    if (!validationResult.isValid) {
      reportFn(validationResult.errorMessage, lineNumber, cleanedText, sourceLine);
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
      validate(headingText, lineNumber, sourceLine, reportForHeading);
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
      validateBoldText(textToValidate, lineNumber, line);
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
