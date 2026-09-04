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
 * @typedef {'inline-code'|'link-destination'|'html-comment'|'html-tag'|'link-text'|'quoted-string'} VerbatimKind
 *   Which mechanism produced a span. Only the consumer's kind filter differs;
 *   the spans themselves come from one derivation.
 */

/**
 * @typedef {Object} VerbatimSpan
 * @property {number} start - Inclusive start offset.
 * @property {number} end - Exclusive end offset.
 * @property {VerbatimKind} kind - Mechanism that produced the span.
 */

/** A `<` only opens a tag when a tag name follows it. */
const HTML_TAG_BODY_PATTERN = /^[a-zA-Z][a-zA-Z0-9]*(\s|$)/;

/** An HTML entity is `&word;` or `&#123;` measured from the ampersand. */
const HTML_ENTITY_PATTERN = /^[a-zA-Z0-9#]+;/;

/** Mechanisms the shared context map already computes for the whole document. */
const SHARED_SPAN_KINDS = /** @type {const} */ ([
  ['inline-code', 'isInInlineCode'],
  ['link-destination', 'isInLinkDestination'],
  ['html-comment', 'isInHtmlComment']
]);

/**
 * Test whether an offset falls inside one of the collected spans.
 *
 * @param {VerbatimSpan[]} spans - Spans collected for the line.
 * @param {number} position - Character offset to test.
 * @param {VerbatimKind|null} [excludedKind] - Kind to ignore, so a consumer can
 *   opt out of one mechanism without re-deriving the others.
 * @returns {boolean} True when some span covers the offset.
 */
function isInVerbatimSpan(spans, position, excludedKind = null) {
  return spans.some(
    (span) => span.kind !== excludedKind && position >= span.start && position < span.end
  );
}

/**
 * Materialize the shared context map's predicates as spans for one line.
 *
 * The map exposes predicates rather than ranges, so each run of consecutive
 * offsets it claims becomes a span. Converting once per line lets the delimiter
 * scans below ask "is this character inside a span" instead of re-querying the
 * map with a different set of questions.
 *
 * @param {string} line - The line content.
 * @param {import('./shared-context.js').LineContext} context - Shared context map.
 * @param {number} lineIndex - Zero-based index of the line.
 * @returns {VerbatimSpan[]} Inline code, link destination, and HTML comment spans.
 */
function collectSharedSpans(line, context, lineIndex) {
  /** @type {VerbatimSpan[]} */
  const spans = [];

  for (const [kind, predicateName] of SHARED_SPAN_KINDS) {
    const predicate = context[predicateName];
    let start = -1;
    for (let i = 0; i <= line.length; i++) {
      const inside = i < line.length && predicate(lineIndex, i);
      if (inside && start === -1) {
        start = i;
      } else if (!inside && start !== -1) {
        spans.push({ start, end: i, kind });
        start = -1;
      }
    }
  }

  return spans;
}

/**
 * Scan HTML tag spans, from a `<` that starts a tag name through its `>`.
 *
 * A real span scan, not an "is there an unclosed `<` behind me" test: text past
 * the tag's `>` is outside the span even though the `<` still precedes it. A tag
 * left unterminated at end of line runs to the line end, matching how the shared
 * map treats an unterminated HTML comment.
 *
 * @param {string} line - The line content.
 * @param {VerbatimSpan[]} priorSpans - Spans already collected; a `<` inside one
 *   is literal text and opens nothing.
 * @returns {VerbatimSpan[]} HTML tag spans in order of appearance.
 */
function collectHtmlTagSpans(line, priorSpans) {
  /** @type {VerbatimSpan[]} */
  const spans = [];
  let cursor = 0;

  while (cursor < line.length) {
    const open = line.indexOf('<', cursor);
    if (open === -1) {
      break;
    }
    if (isInVerbatimSpan(priorSpans, open)) {
      cursor = open + 1;
      continue;
    }
    const close = line.indexOf('>', open + 1);
    const bodyEnd = close === -1 ? line.length : close;
    if (HTML_TAG_BODY_PATTERN.test(line.substring(open + 1, bodyEnd))) {
      const end = close === -1 ? line.length : close + 1;
      spans.push({ start: open, end, kind: 'html-tag' });
      cursor = end;
    } else {
      cursor = open + 1;
    }
  }

  return spans;
}

/**
 * Scan bracketed link-text spans, pairing `[` with the next `]`.
 *
 * Brackets pair in order of appearance, so an unmatched `[` opens no span and
 * prose after it stays subject to the rule — the same ordered pairing the quote
 * census uses. The shared map covers link destinations but not labels, so the
 * label is derived here.
 *
 * @param {string} line - The line content.
 * @param {VerbatimSpan[]} priorSpans - Spans already collected; a bracket inside
 *   one is literal text and pairs with nothing.
 * @returns {VerbatimSpan[]} Link-text spans, brackets included, in order.
 */
function collectLinkTextSpans(line, priorSpans) {
  /** @type {VerbatimSpan[]} */
  const spans = [];
  let openBracket = -1;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char !== '[' && char !== ']') {
      continue;
    }
    if (isInVerbatimSpan(priorSpans, i)) {
      continue;
    }
    if (char === '[') {
      if (openBracket === -1) {
        openBracket = i;
      }
      continue;
    }
    if (openBracket === -1) {
      continue;
    }
    spans.push({ start: openBracket, end: i + 1, kind: 'link-text' });
    openBracket = -1;
  }

  return spans;
}

/**
 * Report whether a character is backslash-escaped.
 *
 * An odd run of backslashes escapes the character that follows; an even run is
 * escaped backslashes and leaves it live.
 *
 * @param {string} line - The line content.
 * @param {number} position - Offset of the character to test.
 * @returns {boolean} True when the character is escaped.
 */
function isEscaped(line, position) {
  let backslashes = 0;
  for (let i = position - 1; i >= 0 && line[i] === '\\'; i--) {
    backslashes += 1;
  }
  return backslashes % 2 === 1;
}

/**
 * Scan double-quoted string spans, pairing `"` with the next `"`.
 *
 * Quotes pair in order of appearance (first with second, third with fourth), so
 * a lone unmatched quote opens no span and text following it stays subject to
 * the rule. Two quotes cannot delimit prose: one inside an earlier span, since a
 * quote in a code span, link destination, HTML comment, HTML tag attribute, or
 * link label is not prose punctuation; and a backslash-escaped `\"`, which
 * renders as a plain quote but delimits nothing — counting it pairs it with a
 * later real quote and fabricates a span across the prose between them. Only
 * ASCII `"` delimits here; typographic quotes wrap quoted prose rather than
 * literal strings.
 *
 * @param {string} line - The line content.
 * @param {VerbatimSpan[]} priorSpans - Spans already collected.
 * @returns {VerbatimSpan[]} Spans covering the text between each quote pair,
 *   excluding the quotes themselves.
 */
function collectQuotedStringSpans(line, priorSpans) {
  /** @type {VerbatimSpan[]} */
  const spans = [];
  let openQuote = -1;

  for (let i = 0; i < line.length; i++) {
    if (line[i] !== '"') {
      continue;
    }
    if (isEscaped(line, i) || isInVerbatimSpan(priorSpans, i)) {
      continue;
    }
    if (openQuote === -1) {
      openQuote = i;
      continue;
    }
    spans.push({ start: openQuote + 1, end: i, kind: 'quoted-string' });
    openQuote = -1;
  }

  return spans;
}

/**
 * Derive every verbatim span on a line, once.
 *
 * "Is this offset verbatim?" has a single answer per line, and both consumers
 * read it: the ampersand decision asks about the ampersand's offset, and the
 * quote census asks about each candidate delimiter. The census is a stage of
 * this derivation rather than a second one, so the two cannot disagree about a
 * mechanism — there is only one enumeration of mechanisms to consult.
 *
 * Stages run in dependency order: the shared map's spans first, then HTML tags
 * and link labels (whose delimiters must not be read out of a code span), then
 * quoted strings (whose delimiters must not be read out of any of the above).
 *
 * @param {string} line - The line content.
 * @param {import('./shared-context.js').LineContext} context - Shared context map.
 * @param {number} lineIndex - Zero-based index of the line.
 * @returns {VerbatimSpan[]} All verbatim spans on the line.
 */
function collectVerbatimSpans(line, context, lineIndex) {
  const spans = collectSharedSpans(line, context, lineIndex);
  spans.push(...collectHtmlTagSpans(line, spans));
  spans.push(...collectLinkTextSpans(line, spans));
  spans.push(...collectQuotedStringSpans(line, spans));
  return spans;
}

/**
 * Check whether an ampersand sits somewhere the rule must not report.
 *
 * Span membership is delegated to the one per-line derivation. Only the HTML
 * entity test lives here: it reads the characters following the ampersand
 * itself rather than asking about a span, so it is not part of that derivation.
 *
 * @param {string} line - The line content
 * @param {number} position - Character position to check
 * @param {boolean} skipInlineCode - Whether to skip inline code contexts
 * @param {VerbatimSpan[]} spans - Verbatim spans for the line
 * @returns {boolean} True if position should be ignored
 */
function isInSpecialContext(line, position, skipInlineCode, spans) {
  // HTML entities like &amp; &lt; &gt; &#123; — pattern &word; from the & itself.
  if (HTML_ENTITY_PATTERN.test(line.substring(position + 1))) {
    return true;
  }

  // `skipInlineCode: false` reports an ampersand inside a code span. It governs
  // this decision only; a quote inside a code span never delimits a prose
  // string, so the census above ignores the flag.
  return isInVerbatimSpan(spans, position, skipInlineCode ? null : 'inline-code');
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
 * @param {VerbatimSpan[]} spans - Verbatim spans for the line
 * @returns {boolean} True if this ampersand should be flagged
 */
function shouldFlagAmpersand(line, position, skipInlineCode, exceptions, spans) {
  // Skip if in special context
  if (isInSpecialContext(line, position, skipInlineCode, spans)) {
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

    // No ampersand means nothing to decide, so skip deriving the line's spans.
    if (!line.includes('&')) {
      continue;
    }

    // One derivation per line, read by both the ampersand decision and the
    // quote census inside it.
    const spans = collectVerbatimSpans(line, context, i);

    // Find all ampersands in the line
    for (let pos = 0; pos < line.length; pos++) {
      if (line[pos] === '&') {
        if (shouldFlagAmpersand(line, pos, skipInlineCode, exceptions, spans)) {
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
