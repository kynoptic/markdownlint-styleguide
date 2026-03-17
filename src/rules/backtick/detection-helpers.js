// @ts-check

/**
 * Detection helper utilities for the BCE001 backtick-code-elements rule.
 *
 * Extracted from backtick-code-elements.js per ADR-004 to reduce that file
 * below the ~500 LOC threshold and make individual detection modes testable
 * in isolation (#207).
 */

import {
  commonConceptualWords,
  knownDirectoryPrefixes,
} from '../shared-constants.js';

// Pre-compiled regexes reused by inMarkdownLink and inWikiLink.
const linkRegex = /!?\[[^\]]*\]\([^)]*\)/g;
const wikiLinkRegex = /!?\[\[[^\]]+\]\]/g;

// Common sentence starters that indicate a sentence boundary, not a filename.
const sentenceStarters = new Set([
  'The', 'A', 'An', 'This', 'That', 'These', 'Those',
  'It', 'They', 'We', 'You', 'He', 'She',
  'New', 'Go', 'Then', 'Next', 'First', 'Second', 'Finally',
  'However', 'Therefore', 'Additionally', 'Furthermore',
  'In', 'On', 'At', 'For', 'With', 'From', 'To',
  'Some', 'Many', 'Most', 'All', 'Few', 'Several'
]);

/**
 * Check if a match appears at a sentence boundary.
 * Returns true if the text before the period ends a sentence and the text after starts a new one.
 *
 * @param {string} match - The matched text (e.g., "computer.New")
 * @param {string} fullText - The complete line text for context
 * @returns {boolean} True if this appears to be a sentence boundary, not a filename
 */
export function isSentenceBoundary(match, fullText) {
  // Pattern: word.Word where second word starts with capital
  if (!/^[a-z]+\.[A-Z][a-z]*$/.test(match)) {
    return false;
  }

  const matchIndex = fullText.indexOf(match);
  if (matchIndex === -1) return false;

  // Check if there's whitespace or sentence punctuation before the match
  // (indicating end of previous sentence)
  const beforeMatch = fullText.substring(0, matchIndex);
  if (!/[.!?]\s+$/.test(beforeMatch) && !/^\s*$/.test(beforeMatch)) {
    // Not preceded by sentence-ending punctuation + space, could be a real filename
    return false;
  }

  // Extract the word after the period
  const afterPeriod = match.split('.')[1];

  // If it's a common sentence starter, it's likely a sentence boundary
  if (sentenceStarters.has(afterPeriod)) {
    return true;
  }

  // Additional check: if the word after the period is followed by lowercase text,
  // it's likely starting a new sentence
  const afterMatch = fullText.substring(matchIndex + match.length);
  if (/^\s+[a-z]/.test(afterMatch)) {
    return true;
  }

  return false;
}

/**
 * Trim trailing punctuation from URLs that is likely sentence punctuation.
 * URLs can legitimately end with these chars, but when in prose like
 * "(https://example.com/path)." the trailing ")." is usually sentence punctuation.
 * Also trims markdown syntax characters that may be captured when URLs appear
 * inside bold/italic markdown links like **[text](url)**.
 *
 * @param {string} url - The matched URL
 * @returns {string} The URL with trailing sentence punctuation trimmed
 */
export function trimUrlTrailingPunctuation(url) {
  // Count opening and closing parens to handle balanced parens in URLs
  let openParens = 0;
  let closeParens = 0;
  for (const char of url) {
    if (char === '(') openParens++;
    if (char === ')') closeParens++;
  }

  // Trim trailing punctuation that's likely sentence-ending
  // Keep trimming while we have unbalanced closing parens or sentence punctuation
  let trimmed = url;
  while (trimmed.length > 0) {
    const lastChar = trimmed[trimmed.length - 1];

    // Trim trailing periods, commas, semicolons, exclamation, question marks
    if ('.,:;!?'.includes(lastChar)) {
      trimmed = trimmed.slice(0, -1);
      continue;
    }

    // Trim trailing markdown syntax characters (bold/italic markers)
    // These can be captured when URLs appear in **[text](url)** patterns
    if ('*_'.includes(lastChar)) {
      trimmed = trimmed.slice(0, -1);
      continue;
    }

    // Trim trailing closing parens only if unbalanced
    if (lastChar === ')' && closeParens > openParens) {
      trimmed = trimmed.slice(0, -1);
      closeParens--;
      continue;
    }

    // No more trimming needed
    break;
  }

  return trimmed;
}

/**
 * Determine if an index range is within a Markdown link or image.
 *
 * @param {string} text - Line being evaluated.
 * @param {number} start - Start index of match.
 * @param {number} end - End index of match.
 * @returns {boolean}
 */
export function inMarkdownLink(text, start, end) {
  let m;
  linkRegex.lastIndex = 0;
  while ((m = linkRegex.exec(text)) !== null) {
    if (start >= m.index && end <= m.index + m[0].length) {
      return true;
    }
  }
  return false;
}

/**
 * Check if an index range falls inside a wiki-style link.
 *
 * @param {string} text - Line being evaluated.
 * @param {number} start - Start index of match.
 * @param {number} end - End index of match.
 * @returns {boolean} True when the range is within a wiki link.
 */
export function inWikiLink(text, start, end) {
  let m;
  wikiLinkRegex.lastIndex = 0;
  while ((m = wikiLinkRegex.exec(text)) !== null) {
    if (start >= m.index && end <= m.index + m[0].length) {
      return true;
    }
  }
  return false;
}

/**
 * Check if an index range falls inside an HTML comment.
 *
 * @param {string} text - Line being evaluated.
 * @param {number} start - Start index of match.
 * @param {number} end - End index of match.
 * @returns {boolean} True when the range is within an HTML comment.
 */
export function inHtmlComment(text, start, end) {
  const commentRegex = /<!--.*?-->/g;
  let m;
  while ((m = commentRegex.exec(text)) !== null) {
    if (start >= m.index && end <= m.index + m[0].length) {
      return true;
    }
  }
  return false;
}

/**
 * Check if an index range falls inside an HTML semantic code tag.
 * Handles <kbd>, <code>, <samp>, and <var> tags.
 *
 * @param {string} text - Line being evaluated.
 * @param {number} start - Start index of match.
 * @param {number} end - End index of match.
 * @returns {boolean} True when the range is within a semantic code tag.
 */
export function inHtmlSemanticTag(text, start, end) {
  const semanticTagRegex = /<(kbd|code|samp|var)(?:\s[^>]*)?>[\s\S]*?<\/\1>/gi;
  let m;
  while ((m = semanticTagRegex.exec(text)) !== null) {
    if (start >= m.index && end <= m.index + m[0].length) {
      return true;
    }
  }
  return false;
}

/**
 * Check if an index range falls inside a LaTeX math expression.
 * Handles both inline ($...$) and block ($$...$$) math expressions.
 * Distinguishes between LaTeX math and shell variables like $value.
 *
 * @param {string} text - Line being evaluated.
 * @param {number} start - Start index of match.
 * @param {number} end - End index of match.
 * @returns {boolean} True when the range is within a LaTeX math expression.
 */
export function inLatexMath(text, start, end) {
  // Check for inline math expressions ($...$)
  const inlineMathRegex = /\$([^$]+?)\$/g;
  let m;
  while ((m = inlineMathRegex.exec(text)) !== null) {
    const content = m[1];
    const isMathLike =
      /[\\{}^_]/.test(content) || // Contains LaTeX special characters
      /[a-zA-Z][+\-*/=<> ]/.test(content) || // Contains variables in equations
      / [+\-*/=] /.test(content) || // Contains operators with spacing
      !/^\d+(\.\d+)?$/.test(content.trim()); // Not just a number (price)

    if (isMathLike && start >= m.index && end <= m.index + m[0].length) {
      return true;
    }
  }

  // Check for block math expressions ($$...$$) on a single line
  const blockMathRegex = /\$\$([^$]|\$[^$])*\$\$/g;
  blockMathRegex.lastIndex = 0; // Reset regex state
  while ((m = blockMathRegex.exec(text)) !== null) {
    if (start >= m.index && end <= m.index + m[0].length) {
      return true;
    }
  }

  // If the line contains common LaTeX math functions, it's likely math-related.
  if (/\\(?:sum|frac|int|lim|sqrt|sin|cos|log|alpha|beta|gamma|delta|theta|pi|sigma)\b/.test(text)) {
    return true;
  }

  return false;
}

/**
 * Heuristically determine if a string looks like a file path.
 * This is used to reduce false positives from natural language
 * that can resemble a path (e.g., "pass/fail", "read/write").
 *
 * @param {string} str - Text to evaluate.
 * @returns {boolean} True if the string resembles a file path.
 */
export function isLikelyFilePath(str) {
  // Paths must contain a slash.
  if (!str.includes('/')) {
    return false;
  }

  // Paths with spaces are uncommon in un-quoted prose.
  if (/\s/.test(str)) {
    return false;
  }

  const segments = str.split('/');

  // Reject if all segments are numeric (e.g., "1/2", "2023/10/15").
  // Allows for empty segments from leading/trailing slashes.
  if (segments.every((s) => /^\d+$/.test(s) || s === '')) {
    return false;
  }

  // Common option/alternative patterns that should not be treated as paths
  const commonOptionPatterns = [
    'on/off', 'true/false', 'yes/no', 'read/write', 'input/output', 'pass/fail',
    'enable/disable', 'start/stop', 'open/close', 'get/set', 'push/pull',
    'left/right', 'up/down', 'in/out', 'and/or', 'either/or', 'http/https',
    'import/export', 'GET/POST', 'PUT/POST', 'PUT/PATCH', 'CREATE/UPDATE',
    'add/remove', 'insert/delete', 'show/hide', 'expand/collapse', 'min/max',
    'first/last', 'prev/next', 'before/after', 'old/new', 'src/dest',
    'source/target', 'from/to', 'client/server', 'local/remote', 'dev/prod',
    // Issue #89: Additional non-path patterns
    'integration/e2e', 'value/effort', 'feature/module', 'added/updated',
    'adapt/extend', 'start/complete', 'lowest/most', 'pass/fail',
    // Technology choice patterns (not paths)
    'npm/node.js', 'client/device/os',
    // Issue #round10: Format listings and prose alternatives (not file paths)
    'csv/json', 'csv/json/markdown', 'json/xml', 'html/css', 'js/ts',
    'pages/documents', 'files/folders', 'users/groups', 'roles/permissions',
    'read/write/execute', 'owner/group/other'
  ];

  // Check if this matches a common option pattern (case-insensitive)
  if (commonOptionPatterns.includes(str.toLowerCase())) {
    return false;
  }

  // Detect capitalized enumeration patterns (e.g., "Essential/Useful/Nice-to-have", "Heavy/Moderate/Light")
  // These are option sets, not file paths. Pattern: starts with capital letter, contains multiple slashes
  if (segments.length >= 2) {
    const allCapitalized = segments.every(s => /^[A-Z]/.test(s));
    const hasMultiWordSegments = segments.some(s => s.includes('-'));
    const allShortSegments = segments.every(s => s.length <= 8); // Data/API, Value/Effort

    if (allCapitalized && (segments.length >= 3 || hasMultiWordSegments || allShortSegments)) {
      // This looks like an enumerated option set (Essential/Useful/Nice-to-have)
      return false;
    }
  }

  // Detect BDD-style patterns (GIVEN/WHEN/THEN)
  if (segments.length >= 2 && segments.every(s => /^[A-Z]+$/.test(s))) {
    return false;
  }

  // For simple "a/b" paths without file extensions, be more skeptical.
  if (segments.length === 2 && !/\.[^/]+$/.test(segments[1])) {
    // Avoids flagging common short phrases like "on/off", "i/o".
    if (segments[0].length <= 2 || segments[1].length <= 2) {
      return false;
    }

    // Additional heuristics for two-segment paths:
    // If both segments are common English words, it's likely an option pattern
    const [first, second] = segments.map(s => s.toLowerCase());
    if (commonConceptualWords.includes(first) && commonConceptualWords.includes(second)) {
      return false;
    }
  }

  // Issue #89: Additional heuristic - check for known directory prefixes
  // Real file paths typically start with directory indicators like src/, docs/, tests/, etc.
  // If it's a two-segment path without an extension and doesn't start with a known directory,
  // and doesn't look like a typical file path pattern, it's likely not a path
  if (segments.length === 2 && !/\.[^/]+$/.test(segments[1])) {
    const firstSegmentLower = segments[0].toLowerCase();

    // Check if it starts with a known directory or contains path-like indicators
    const hasDirectoryPrefix = knownDirectoryPrefixes.includes(firstSegmentLower);
    const hasPathIndicators = /^\.\.?\//.test(str) || /^\//.test(str) || /^~\//.test(str);

    if (!hasDirectoryPrefix && !hasPathIndicators) {
      // This looks more like a conceptual pair or category than a path
      return false;
    }
  }

  // Detect prose patterns with slashes that describe lists or combinations
  // e.g., "letters/numbers/hyphens", "tests/lints/quality", "Build/test"
  // These are typically common English words (often plural), not directory names
  const proseListWords = new Set([
    'letters', 'numbers', 'hyphens', 'symbols', 'characters', 'words', 'spaces',
    'tests', 'lints', 'checks', 'builds', 'runs', 'tasks', 'jobs', 'steps',
    'files', 'folders', 'items', 'entries', 'records', 'rows', 'columns',
    'inputs', 'outputs', 'results', 'errors', 'warnings', 'issues', 'bugs',
    'features', 'options', 'settings', 'configs', 'values', 'keys', 'names',
    'build', 'test', 'lint', 'check', 'run', 'start', 'stop', 'deploy',
    'quality', 'performance', 'security', 'safety', 'stability',
    // Issue #round10: Additional prose words for alternatives
    'pages', 'documents', 'users', 'groups', 'roles', 'permissions', 'owner', 'group', 'other',
    'csv', 'json', 'xml', 'html', 'css', 'markdown', 'yaml', 'toml'
  ]);

  // If all segments (lowercase) are common prose words, it's not a path
  const allSegmentsAreProse = segments.every(s => proseListWords.has(s.toLowerCase()));
  if (allSegmentsAreProse) {
    return false;
  }

  // If the majority of segments are prose words and there's no file extension, skip it
  const proseCount = segments.filter(s => proseListWords.has(s.toLowerCase())).length;
  if (proseCount >= segments.length - 1 && !/\.[^/]+$/.test(segments[segments.length - 1])) {
    return false;
  }

  // If all segments (3+) are pure alphabetic words (3+ chars) with no file extensions,
  // and it's not an absolute or relative path, it's likely natural language
  const nonEmptySegments = segments.filter(s => s !== '');
  const isAbsoluteOrRelative = /^[/~.]/.test(str);
  if (!isAbsoluteOrRelative && nonEmptySegments.length >= 3 && nonEmptySegments.every(s => /^[a-zA-Z]{3,}$/.test(s)) && !nonEmptySegments.some(s => /\.\w+$/.test(s))) {
    return false;
  }

  // A likely path should contain at least one letter.
  return /[a-zA-Z]/.test(str);
}
