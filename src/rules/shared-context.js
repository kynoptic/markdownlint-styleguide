// @ts-check

/**
 * Shared line-scanning context helper.
 *
 * Line-scanning rules (DL001, BCE001, SC001, no-literal-ampersand, ...) all need
 * to answer the same question before flagging a match: is this offset inside a
 * context where Markdown source should not be treated as prose? Historically each
 * rule reimplemented its own fence/inline-code/link/comment/frontmatter detection
 * with slightly different regex, so false-positive fixes drifted per rule.
 *
 * This module centralizes that detection. {@link buildLineContext} scans a
 * document once and returns predicates keyed by (lineIndex, column) for each
 * context type, plus a unified {@link LineContext#isInCode} predicate.
 *
 * All line indices are zero-based; columns are zero-based character offsets.
 */

import { getInlineCodeSpans } from './shared-utils.js';

/**
 * @typedef {Object} LineContext
 * @property {(lineIndex: number, column: number) => boolean} isInFencedCode
 *   True when the line is inside a fenced code block (including its marker
 *   lines) or an indented code block.
 * @property {(lineIndex: number, column: number) => boolean} isInInlineCode
 *   True when the offset is inside an inline code span. Always false inside a
 *   fenced block (inline spans are not parsed there).
 * @property {(lineIndex: number, column: number) => boolean} isInLinkDestination
 *   True when the offset is inside the destination of a `[text](dest)` link.
 * @property {(lineIndex: number, column: number) => boolean} isInHtmlComment
 *   True when the offset is inside an HTML comment, including multi-line comments.
 * @property {(lineIndex: number, column: number) => boolean} isInFrontmatter
 *   True when the offset is inside a leading YAML frontmatter block.
 * @property {(lineIndex: number, column: number) => boolean} isInCode
 *   Unified predicate: true when the offset is in any non-prose context above.
 * @property {(lineIndex: number, column: number) => boolean} isInProse
 *   Convenience inverse of {@link LineContext#isInCode}.
 */

const FENCE_OPEN_RE = /^ {0,3}(`{3,}|~{3,})/;
const INDENT_CODE_RE = /^(?: {4}|\t)/;

/**
 * Detect a leading YAML frontmatter block.
 *
 * Frontmatter is only recognized when the very first line is exactly `---`
 * (a `---` later in the document is a thematic break, not frontmatter). The
 * block ends on the next line that is exactly `---` or `...`.
 *
 * @param {string[]} lines - Document lines.
 * @returns {boolean[]} Per-line flag; frontmatter delimiter lines are excluded
 *   so that only the body of the block is treated as non-prose.
 */
function computeFrontmatterLines(lines) {
  const flags = new Array(lines.length).fill(false);
  if (lines.length === 0 || lines[0].trim() !== '---') {
    return flags;
  }
  for (let i = 1; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed === '---' || trimmed === '...') {
      return flags; // closing delimiter ends the block
    }
    flags[i] = true;
  }
  return flags;
}

/**
 * Detect fenced and indented code regions.
 *
 * Fences respect their character and length so a shorter inner fence does not
 * prematurely close an outer one. Indented code blocks (four leading spaces or
 * a tab, with content) are also treated as code when outside a fence.
 *
 * @param {string[]} lines - Document lines.
 * @param {boolean[]} frontmatterLines - Lines already claimed by frontmatter,
 *   which must not be scanned for fences.
 * @returns {boolean[]} Per-line flag including the fence marker lines themselves.
 */
function computeFencedLines(lines, frontmatterLines) {
  const flags = new Array(lines.length).fill(false);
  let fenceChar = '';
  let fenceLen = 0;
  let inFence = false;

  for (let i = 0; i < lines.length; i++) {
    if (frontmatterLines[i]) {
      continue;
    }
    const line = lines[i];
    const match = FENCE_OPEN_RE.exec(line);

    if (match) {
      const marker = match[1];
      const markerChar = marker[0];
      const markerLen = marker.length;

      if (!inFence) {
        inFence = true;
        fenceChar = markerChar;
        fenceLen = markerLen;
        flags[i] = true;
        continue;
      }

      // A closing fence matches the opener's char, is at least as long, and
      // carries no info string. Anything else is content inside the fence.
      if (markerChar === fenceChar && markerLen >= fenceLen && line.trim() === marker) {
        inFence = false;
        fenceChar = '';
        fenceLen = 0;
        flags[i] = true;
        continue;
      }
    }

    if (inFence) {
      flags[i] = true;
      continue;
    }

    // Indented code block: four-space or tab indent with non-blank content.
    if (line.length > 4 && INDENT_CODE_RE.test(line) && line.trim() !== '') {
      flags[i] = true;
    }
  }

  return flags;
}

/**
 * Detect HTML comment regions, including comments spanning multiple lines.
 *
 * @param {string[]} lines - Document lines.
 * @param {boolean[]} fencedLines - Lines inside fenced code, where `<!--` is
 *   literal text and must be ignored.
 * @returns {Array<Array<[number, number]>>} Per-line list of `[start, end)`
 *   column ranges covered by a comment. A line fully inside a multi-line
 *   comment yields a single range spanning its whole length.
 */
function computeHtmlCommentRanges(lines, fencedLines) {
  const ranges = lines.map(() => /** @type {Array<[number, number]>} */ ([]));
  let inComment = false;

  for (let i = 0; i < lines.length; i++) {
    if (fencedLines[i]) {
      continue;
    }
    const line = lines[i];
    let pos = 0;

    while (pos < line.length) {
      if (!inComment) {
        const open = line.indexOf('<!--', pos);
        if (open === -1) {
          break;
        }
        const close = line.indexOf('-->', open + 4);
        if (close === -1) {
          ranges[i].push([open, line.length]);
          inComment = true;
          break;
        }
        ranges[i].push([open, close + 3]);
        pos = close + 3;
      } else {
        const close = line.indexOf('-->', pos);
        if (close === -1) {
          ranges[i].push([0, line.length]);
          break;
        }
        ranges[i].push([0, close + 3]);
        inComment = false;
        pos = close + 3;
      }
    }
  }

  return ranges;
}

/**
 * Detect link destination ranges of the form `[text](destination)`.
 *
 * Only the destination span (the content between the parentheses, excluding any
 * angle brackets) is reported. Link text and surrounding prose are not.
 *
 * @param {string[]} lines - Document lines.
 * @param {boolean[]} fencedLines - Lines inside fenced code, which are skipped.
 * @returns {Array<Array<[number, number]>>} Per-line `[start, end)` ranges.
 */
function computeLinkDestinationRanges(lines, fencedLines) {
  const ranges = lines.map(() => /** @type {Array<[number, number]>} */ ([]));
  const linkPattern = /\[[^\]]*\]\(([^)]*)\)/g;

  for (let i = 0; i < lines.length; i++) {
    if (fencedLines[i]) {
      continue;
    }
    const line = lines[i];
    linkPattern.lastIndex = 0;
    let match;
    while ((match = linkPattern.exec(line)) !== null) {
      const dest = match[1];
      const open = match.index + match[0].indexOf('(', match[0].indexOf(']')) + 1;
      let start = open;
      let end = open + dest.length;
      // Exclude a single pair of angle brackets: [t](<a b.md>).
      if (dest.startsWith('<') && dest.endsWith('>')) {
        start += 1;
        end -= 1;
      }
      ranges[i].push([start, end]);
    }
  }

  return ranges;
}

/**
 * @param {Array<[number, number]>} spans - `[start, end)` ranges.
 * @param {number} column - Column offset to test.
 * @returns {boolean} True when the column falls within any span.
 */
function columnInRanges(spans, column) {
  return spans.some(([start, end]) => column >= start && column < end);
}

/**
 * Scan a document once and return context predicates for its offsets.
 *
 * @param {string[]} lines - Document lines (e.g. markdownlint's `params.lines`).
 * @returns {LineContext} Context predicates for the document.
 */
export function buildLineContext(lines) {
  const safeLines = Array.isArray(lines) ? lines : [];

  const frontmatterLines = computeFrontmatterLines(safeLines);
  const fencedLines = computeFencedLines(safeLines, frontmatterLines);
  const commentRanges = computeHtmlCommentRanges(safeLines, fencedLines);
  const linkRanges = computeLinkDestinationRanges(safeLines, fencedLines);

  // Inline code spans only matter on lines that are neither fenced nor
  // frontmatter; computing them lazily per line keeps the common case cheap.
  /** @type {Array<Array<[number, number]>> | null} */
  const inlineSpanCache = new Array(safeLines.length).fill(null);
  const inlineComputed = new Array(safeLines.length).fill(false);

  function inlineSpansFor(lineIndex) {
    if (!inlineComputed[lineIndex]) {
      inlineSpanCache[lineIndex] =
        fencedLines[lineIndex] || frontmatterLines[lineIndex]
          ? []
          : getInlineCodeSpans(safeLines[lineIndex]);
      inlineComputed[lineIndex] = true;
    }
    return inlineSpanCache[lineIndex] || [];
  }

  const inBounds = (lineIndex) => lineIndex >= 0 && lineIndex < safeLines.length;

  const isInFencedCode = (lineIndex) => inBounds(lineIndex) && fencedLines[lineIndex];

  const isInFrontmatter = (lineIndex) => inBounds(lineIndex) && frontmatterLines[lineIndex];

  const isInInlineCode = (lineIndex, column) =>
    inBounds(lineIndex) && columnInRanges(inlineSpansFor(lineIndex), column);

  const isInLinkDestination = (lineIndex, column) =>
    inBounds(lineIndex) && columnInRanges(linkRanges[lineIndex], column);

  const isInHtmlComment = (lineIndex, column) =>
    inBounds(lineIndex) && columnInRanges(commentRanges[lineIndex], column);

  const isInCode = (lineIndex, column) =>
    isInFencedCode(lineIndex) ||
    isInFrontmatter(lineIndex) ||
    isInInlineCode(lineIndex, column) ||
    isInLinkDestination(lineIndex, column) ||
    isInHtmlComment(lineIndex, column);

  return {
    isInFencedCode,
    isInInlineCode,
    isInLinkDestination,
    isInHtmlComment,
    isInFrontmatter,
    isInCode,
    isInProse: (lineIndex, column) => !isInCode(lineIndex, column)
  };
}
