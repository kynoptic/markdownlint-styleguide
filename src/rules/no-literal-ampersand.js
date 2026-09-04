// @ts-check

/**
 * Rule that flags standalone ampersands (&) and provides autofix to replace with "and".
 * This helps maintain readability and follows common writing conventions.
 */

import { 
  validateStringArray, 
  validateBoolean,
  validateConfig, 
  logValidationErrors,
  createMarkdownlintLogger 
} from './config-validation.js';
import { ampersandDefaultExceptions } from './shared-constants.js';
import { createSafeFixInfo } from './autofix-safety.js';
import { buildLineContext } from './shared-context.js';

/**
 * Check if a position sits inside a matched pair of straight double quotes.
 *
 * Quotes are paired in order of appearance (first with second, third with
 * fourth), so a lone unmatched quote opens no span and text following it stays
 * subject to the rule. A quote inside inline code, a link destination, or an
 * HTML comment is not a prose delimiter and is left out of the census, so an
 * unpaired quote in a code span cannot flip the parity for the rest of the
 * line. Only ASCII `"` delimits a verbatim string here; typographic quotes
 * wrap quoted prose rather than literal strings, and a backslash-escaped `\"`
 * is deliberately not special-cased because it renders as a plain quote.
 *
 * @param {string} line - The line content
 * @param {number} position - Character position to check
 * @param {import('./shared-context.js').LineContext} context - Shared context map
 * @param {number} lineIndex - Zero-based index of the line
 * @returns {boolean} True if the position is between a matched quote pair
 */
function isInDoubleQuotedString(line, position, context, lineIndex) {
  let openQuote = -1;
  for (let i = 0; i < line.length; i++) {
    if (line[i] !== '"') {
      continue;
    }
    // Count only quotes the shared context map treats as prose, so the census
    // agrees with the contexts the rest of this rule already trusts.
    if (context.isInInlineCode(lineIndex, i) ||
        context.isInLinkDestination(lineIndex, i) ||
        context.isInHtmlComment(lineIndex, i)) {
      continue;
    }
    if (openQuote === -1) {
      openQuote = i;
      continue;
    }
    if (position > openQuote && position < i) {
      return true;
    }
    openQuote = -1;
  }
  return false;
}

/**
 * Check if a character position is inside inline code or other special context.
 *
 * Code, link, comment, and frontmatter contexts are delegated to the shared
 * line-context helper so detection stays consistent across rules. Only the
 * ampersand-specific HTML entity, double-quoted string, and inline link-text
 * checks live here.
 *
 * @param {string} line - The line content
 * @param {number} position - Character position to check
 * @param {boolean} skipInlineCode - Whether to skip inline code contexts
 * @param {import('./shared-context.js').LineContext} context - Shared context map
 * @param {number} lineIndex - Zero-based index of the line
 * @returns {boolean} True if position should be ignored
 */
function isInSpecialContext(line, position, skipInlineCode, context, lineIndex) {
  // Code spans, link destinations, and HTML comments come from the shared map.
  if (skipInlineCode && context.isInInlineCode(lineIndex, position)) {
    return true;
  }
  if (context.isInLinkDestination(lineIndex, position) ||
      context.isInHtmlComment(lineIndex, position)) {
    return true;
  }

  const beforePosition = line.substring(0, position);
  const afterPosition = line.substring(position + 1); // +1 to skip the & itself

  // Check for HTML entities like &amp; &lt; &gt; etc.
  // Look for pattern like &word; where we are at the &
  if (/^[a-zA-Z0-9#]+;/.test(afterPosition)) {
    return true;
  }

  // Check if inside HTML tag
  const lastOpenTag = beforePosition.lastIndexOf('<');
  const lastCloseTag = beforePosition.lastIndexOf('>');
  if (lastOpenTag > lastCloseTag) {
    // Check if this looks like a valid HTML tag start
    const tagContent = line.substring(lastOpenTag + 1, position);
    // Only consider it an HTML tag if it looks like valid tag syntax
    if (/^[a-zA-Z][a-zA-Z0-9]*(\s|$)/.test(tagContent)) {
      return true;
    }
  }

  // Inside a double-quoted literal string "text & more": quoted text is
  // verbatim, the same as a code span (#336).
  if (isInDoubleQuotedString(line, position, context, lineIndex)) {
    return true;
  }

  // Inside link text [text & more]: the shared map only covers destinations,
  // so guard the bracketed label here.
  const lastOpenBracket = beforePosition.lastIndexOf('[');
  const lastCloseBracket = beforePosition.lastIndexOf(']');
  if (lastOpenBracket > lastCloseBracket) {
    return true;
  }

  return false;
}

// Common brand names that use ampersands - these should not be flagged
const BRAND_NAMES_WITH_AMPERSAND = [
  'Barnes & Noble',
  'AT&T',
  'Procter & Gamble',
  'P&G',
  'Johnson & Johnson',
  'J&J',
  'Dolce & Gabbana',
  'D&G',
  'H&M',
  'M&M',
  'Ben & Jerry',
  'Bed Bath & Beyond',
  'Arm & Hammer',
  'Ernst & Young',
  'PricewaterhouseCoopers', // PwC uses &
  'Zwilling Fresh & Save',
  'Fresh & Save',
  'Simon & Schuster',
  'Warner Bros',
  'Marks & Spencer',
  'M&S',
  'Standard & Poor',
  'S&P',
  'Tiffany & Co',
  'Lord & Taylor',
  'Smith & Wesson',
  'Black & Decker',
  'Fruit & Fibre',
  'Fish & Chips',
  'R&D',
  'R & D',
  'Q&A',
  'Q & A'
];

/**
 * Check if an ampersand should be flagged as a violation.
 * @param {string} line - The line content
 * @param {number} position - Position of the ampersand
 * @param {boolean} skipInlineCode - Whether to skip inline code contexts
 * @param {string[]} exceptions - Array of exception patterns
 * @param {import('./shared-context.js').LineContext} context - Shared context map
 * @param {number} lineIndex - Zero-based index of the line
 * @returns {boolean} True if this ampersand should be flagged
 */
function shouldFlagAmpersand(line, position, skipInlineCode, exceptions, context, lineIndex) {
  // Skip if in special context
  if (isInSpecialContext(line, position, skipInlineCode, context, lineIndex)) {
    return false;
  }

  // Skip headings - ampersands in headings are often intentional (e.g., "Reasoning & Thinking")
  if (/^\s*#{1,6}\s/.test(line)) {
    return false;
  }

  // Skip lines that contain known brand names with ampersands
  const lineLower = line.toLowerCase();
  for (const brand of BRAND_NAMES_WITH_AMPERSAND) {
    if (lineLower.includes(brand.toLowerCase())) {
      return false;
    }
  }

  // Check if this ampersand falls within any exception phrase.
  // Use position-aware matching so only the & that is part of the
  // exception phrase is exempted, not every & on the same line.
  for (const exception of exceptions) {
    // Skip empty patterns: an empty string compiles to a zero-width regex
    // that matches at index 0 without advancing lastIndex, hanging the loop.
    if (!exception) {
      continue;
    }
    const escaped = exception.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'gi');
    let match;
    while ((match = regex.exec(line)) !== null) {
      // Defensive guard against any zero-width match advancing nowhere.
      if (match[0].length === 0) {
        regex.lastIndex += 1;
        continue;
      }
      const start = match.index;
      const end = start + match[0].length - 1;
      if (position >= start && position <= end) {
        return false;
      }
    }
  }

  // Get characters before and after the ampersand
  const charBefore = position > 0 ? line[position - 1] : '';
  const charAfter = position < line.length - 1 ? line[position + 1] : '';

  // Must have spaces or word boundaries around it to be considered "standalone"
  const isStandalone = (
    (charBefore === '' || /\s/.test(charBefore)) &&
    (charAfter === '' || /\s/.test(charAfter))
  );

  return isStandalone;
}


/**
 * Main rule implementation.
 * @param {import("markdownlint").RuleParams} params - Parsed Markdown input
 * @param {import("markdownlint").RuleOnError} onError - Callback to report violations
 */
function noLiteralAmpersand(params, onError) {
  if (!params || !params.lines || typeof onError !== 'function') {
    return;
  }

  const config = params.config?.['no-literal-ampersand'] || params.config?.NLA001 || params.config || {};

  // Validate configuration
  const configSchema = {
    exceptions: validateStringArray,
    skipCodeBlocks: validateBoolean,
    skipInlineCode: validateBoolean
  };

  const validationResult = validateConfig(config, configSchema, 'no-literal-ampersand');
  if (!validationResult.isValid) {
    const logger = createMarkdownlintLogger(onError, 'no-literal-ampersand');
    logValidationErrors('no-literal-ampersand', validationResult.errors, logger);
    // Continue execution with default values to prevent crashes
  }

  // Extract configuration with defaults
  const exceptions = Array.isArray(config.exceptions)
    ? [...ampersandDefaultExceptions, ...config.exceptions]
    : ampersandDefaultExceptions;
  const skipCodeBlocks = typeof config.skipCodeBlocks === 'boolean' ? config.skipCodeBlocks : true;
  const skipInlineCode = typeof config.skipInlineCode === 'boolean' ? config.skipInlineCode : true;

  const lines = params.lines;
  const context = buildLineContext(lines);

  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1;
    const line = lines[i];

    // Skip empty lines
    if (!line.trim()) {
      continue;
    }

    // Skip lines in fenced code or YAML frontmatter based on configuration.
    if (skipCodeBlocks && (context.isInFencedCode(i) || context.isInFrontmatter(i))) {
      continue;
    }

    // Find all ampersands in the line
    for (let pos = 0; pos < line.length; pos++) {
      if (line[pos] === '&') {
        if (shouldFlagAmpersand(line, pos, skipInlineCode, exceptions, context, i)) {
          // Always provide fix for ampersand replacement since it's a safe operation
          const basicFixInfo = {
            editColumn: pos + 1,
            deleteCount: 1,
            insertText: 'and'
          };
          const safeFixInfo = createSafeFixInfo(
            basicFixInfo,
            'no-literal-ampersand',
            '&',
            'and',
            { line }
          );

          onError({
            lineNumber,
            detail: 'Use "and" instead of literal ampersand (&)',
            context: `"${line.trim()}"`,
            range: [pos + 1, 1], // +1 for 1-based column
            fixInfo: safeFixInfo
          });
        }
      }
    }
  }
}

// Export the rule
export default {
  names: ['no-literal-ampersand', 'NLA001'],
  description: 'Flags standalone ampersands (&) and suggests replacing with "and"',
  tags: ['readability', 'style'],
  parser: 'micromark',
  function: noLiteralAmpersand,
  fixable: true
};
