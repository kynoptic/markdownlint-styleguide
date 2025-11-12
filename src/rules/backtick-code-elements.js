// @ts-check

/**
 * Rule that requires code snippets, file names and directory paths
 * to be wrapped in backticks when used in prose.
 */
// Import the centralized ignoredTerms Set and path detection constants
import {
  backtickIgnoredTerms as ignoredTerms,
  commonConceptualWords,
  knownDirectoryPrefixes
} from './shared-constants.js';
import { createSafeFixInfo } from './autofix-safety.js';
import { 
  validateStringArray, 
  validateBoolean,
  validateConfig, 
  logValidationErrors,
  createMarkdownlintLogger 
} from './config-validation.js';
import { updateCodeBlockState, getInlineCodeSpans, isInCodeSpan } from './shared-utils.js';
import { isDomainInProse } from './shared-heuristics.js';

// Regex patterns used by helper functions
const linkRegex = /!?\[[^\]]*\]\([^)]*\)/g;
const wikiLinkRegex = /!?\[\[[^\]]+\]\]/g;

// Common sentence starters that indicate a sentence boundary, not a filename
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
function isSentenceBoundary(match, fullText) {
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
 * Determine if an index range is within a Markdown link or image.
 *
 * @param {string} text - Line being evaluated.
 * @param {number} start - Start index of match.
 * @param {number} end - End index of match.
 * @returns {boolean}
 */
function inMarkdownLink(text, start, end) {
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
function inWikiLink(text, start, end) {
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
function inHtmlComment(text, start, end) {
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
 * Check if an index range falls inside a LaTeX math expression.
 * Handles both inline ($...$) and block ($$...$$) math expressions.
 * Distinguishes between LaTeX math and shell variables like $value.
 *
 * @param {string} text - Line being evaluated.
 * @param {number} start - Start index of match.
 * @param {number} end - End index of match.
 * @returns {boolean} True when the range is within a LaTeX math expression.
 */
function inLatexMath(text, start, end) {
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
function isLikelyFilePath(str) {
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
    'adapt/extend', 'start/complete', 'lowest/most', 'pass/fail'
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

  // A likely path should contain at least one letter.
  return /[a-zA-Z]/.test(str);
}

/**
 * Patterns for contextual error message generation.
 * Each pattern contains a regex and corresponding message template.
 */
const ERROR_MESSAGE_PATTERNS = [
  {
    pattern: /^(git|npm|pip|yarn|docker|brew|cargo|pnpm|curl|wget|ssh|scp|rsync|grep|sed|awk|find|ls|cd|mkdir|rm|cp|mv|chmod|chown|sudo|su|ps|top|htop|kill|killall|systemctl|service|crontab|tar|gzip|zip|unzip|cat|head|tail|less|more|vim|nano|emacs|code|ping|traceroute|nslookup|dig|netstat|ss)\s/,
    message: (text) => `Command '${text}' should be wrapped in backticks to distinguish it from regular text`
  },
  {
    pattern: (text) => text.includes('$') && (text.includes('grep') || text.includes('export') || text.includes('set')),
    message: (text) => `Shell command '${text}' should be wrapped in backticks to show it's a code example`
  },
  {
    pattern: (text) => text.includes('/') && /\.[a-zA-Z0-9]+$/.test(text),
    message: (text) => `File path '${text}' should be wrapped in backticks for clarity and to distinguish it from regular text`
  },
  {
    pattern: (text) => text.includes('/') && /\/$/.test(text),
    message: (text) => `Directory path '${text}' should be wrapped in backticks to show it's a file system location`
  },
  {
    pattern: (text) => text.includes('/'),
    message: (text) => `Path '${text}' should be wrapped in backticks to indicate it's a file system reference`
  },
  {
    pattern: (text, fullText) => {
      // Check if it matches filename pattern
      if (!/^[a-zA-Z0-9._-]+\.[a-zA-Z0-9]{1,5}$/.test(text)) {
        return false;
      }
      // But exclude sentence boundaries
      if (isSentenceBoundary(text, fullText || '')) {
        return false;
      }
      return true;
    },
    message: (text) => `Filename '${text}' should be wrapped in backticks to distinguish it from regular text`
  },
  {
    pattern: /^\.[a-zA-Z]/,
    message: (text) => `Configuration file '${text}' should be wrapped in backticks to show it's a filename`
  },
  {
    pattern: /^[A-Z][A-Z0-9]*_[A-Z0-9_]+$/,
    message: (text) => `Environment variable '${text}' should be wrapped in backticks to indicate it's a system variable`
  },
  {
    pattern: /^(?:PATH|HOME|TEMP|TMPDIR|USER|SHELL|PORT|HOST)$/,
    message: (text) => `Environment variable '${text}' should be wrapped in backticks to indicate it's a system variable`
  },
  {
    pattern: /^\$/,
    message: (text) => `Shell variable '${text}' should be wrapped in backticks to show it's a variable reference`
  },
  {
    pattern: /^--?[a-zA-Z]/,
    message: (text) => `Command flag '${text}' should be wrapped in backticks to show it's a command option`
  },
  {
    pattern: (text) => /\([^)]*\)$/.test(text) && !/^\w+\([a-z]\)$/.test(text),
    message: (text) => `Function call '${text}' should be wrapped in backticks to show it's code`
  },
  {
    pattern: /^import\s+/,
    message: (text) => `Import statement '${text}' should be wrapped in backticks to show it's code`
  },
  {
    pattern: /^[A-Z]+\+[A-Z]+$/,
    message: (text) => `Key combination '${text}' should be wrapped in backticks to distinguish it from regular text`
  },
  {
    pattern: (text) => {
      // Match network addresses but exclude WCAG ratios and time ranges
      // WCAG ratios are decimal numbers followed by :1
      if (/^\d+(\.\d+)?:1$/.test(text)) {
        return false; // This is a WCAG contrast ratio, not a network address
      }
      // Exclude time ranges (e.g., "AM-12:30", "3-10:30")
      // Pattern: ends with time format like "-12:30" or "-10:30"
      if (/(AM|PM)?-\d{1,2}:\d{2}$/i.test(text)) {
        return false; // This is a time range, not a network address
      }
      return /^[A-Za-z0-9.-]+:\d+$/.test(text);
    },
    message: (text) => `Network address '${text}' should be wrapped in backticks to show it's a technical reference`
  },
  {
    pattern: /^(?:export|set)\s+/,
    message: (text) => `Variable assignment '${text}' should be wrapped in backticks to show it's a shell command`
  }
];

/**
 * Generate a contextual error message based on the type of violation detected.
 * @param {string} text - The text that triggered the violation
 * @param {string} line - The full line context
 * @returns {string} A descriptive error message
 */
function generateContextualErrorMessage(text, line) {
  // Iterate through patterns to find the first match
  for (const { pattern, message } of ERROR_MESSAGE_PATTERNS) {
    let matches = false;

    if (typeof pattern === 'function') {
      // Pass both text and full line for context (some patterns need context)
      matches = pattern(text, line);
    } else if (pattern instanceof RegExp) {
      matches = pattern.test(text);
    }

    if (matches) {
      return message(text);
    }
  }

  // Default fallback message
  return `Code-like element '${text}' should be wrapped in backticks for better readability`;
}

/**
 * markdownlint rule enforcing backticks around file paths and commands.
 *
 * @param {import('markdownlint').RuleParams} params - Parsed Markdown input.
 * @param {import('markdownlint').RuleOnError} onError - Callback to report violations.
 * @returns {void}
 */
function backtickCodeElements(params, onError) {
  if (
    !params ||
    !Array.isArray(params.lines) ||
    typeof onError !== 'function'
  ) {
    return;
  }

  const config = params.config?.['backtick-code-elements'] || params.config?.BCE001 || params.config || {};

  // Validate configuration
  const configSchema = {
    ignoredTerms: validateStringArray,
    skipCodeBlocks: validateBoolean,
    skipMathBlocks: validateBoolean
  };

  const validationResult = validateConfig(config, configSchema, 'backtick-code-elements');
  if (!validationResult.isValid) {
    const logger = createMarkdownlintLogger(onError, 'backtick-code-elements');
    logValidationErrors('backtick-code-elements', validationResult.errors, logger);
    // Continue execution with default values to prevent crashes
  }

  // Extract configuration with defaults
  const userIgnoredTerms = Array.isArray(config.ignoredTerms) ? config.ignoredTerms : [];
  const skipCodeBlocks = typeof config.skipCodeBlocks === 'boolean' ? config.skipCodeBlocks : true;
  const skipMathBlocks = typeof config.skipMathBlocks === 'boolean' ? config.skipMathBlocks : true;

  // Combine default ignored terms with user-provided ones
  const allIgnoredTerms = new Set([...ignoredTerms, ...userIgnoredTerms]);

  const lines = params.lines;
  let inCodeBlock = false;
  let inMathBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1;
    const line = lines[i];

    // Update code block state using shared utility
    const codeBlockUpdate = updateCodeBlockState(line, inCodeBlock);
    if (codeBlockUpdate.updated) {
      inCodeBlock = codeBlockUpdate.inCodeBlock;
      continue;
    }

    // Detect $$ as math block fences.
    if (line.trim() === '$$') {
      inMathBlock = !inMathBlock;
      continue;
    }
    
    // Skip lines that are in a code block or heading based on configuration
    if ((skipCodeBlocks && inCodeBlock) || /^\s*#/.test(line)) {
      continue;
    }
    
    // For math blocks, respect configuration but with nuanced handling
    if (skipMathBlocks && inMathBlock) {
      // Check for shell-like patterns that should still be flagged even in math blocks
      // This regex matches:
      // 1. grep/export followed directly by $word: grep $pattern
      // 2. export with variable assignment: export x=$value
      const hasShellPattern = /(?:grep\s+\$\w+|export\s+(?:\w+=)?\$\w+)/.test(line);
      
      if (!hasShellPattern) {
        continue;
      }
    }

    const codeSpans = getInlineCodeSpans(line);

    const patterns = [
      // Issue #106: Full URLs with protocol (http://, https://, ftp://, etc.)
      // Must be checked BEFORE domain patterns to avoid false negatives
      /\b(?:https?|ftp|ftps|file):\/\/[\w\-._~:/?#[\]@!$&'()*+,;=%]+/g,

      // Issue #89: Absolute Unix paths like /etc/hosts, /mnt/usb, /usr/local/bin
      // Pattern breakdown:
      //   (?:^|(?<=\s))  - Start of line or preceded by whitespace (lookbehind)
      //   \/             - Leading slash
      //   (?:[\w.-]+\/)* - Zero or more path segments (word chars, dots, dashes + slash)
      //   [\w.-]+        - Final segment (filename or directory)
      //   (?=\s|$)       - Followed by whitespace or end of line (lookahead)
      /(?:^|(?<=\s))\/(?:[\w.-]+\/)*[\w.-]+(?=\s|$)/g,
      /\b(?:\.?\/?[\w.-]+\/)+[\w.-]+\b/g, // directory or file path
      /\b(?=[^\d\s])[\w.-]*[a-zA-Z][\w.-]*\.[a-zA-Z0-9]{1,5}\b/g, // file name with letters
      /\b[a-zA-Z][\w.-]*\([^)]*\)/g,       // simple function or command()
      /\B\.[\w.-]+\b/g,                    // dotfiles like .env
      /\b[A-Z][A-Z0-9]*_[A-Z0-9_]+\b/g,      // environment variables like NODE_ENV
      /\b(?:PATH|HOME|TEMP|TMPDIR|USER|SHELL|PORT|HOST)\b/g, // env vars
      /\B--?[a-zA-Z][\w-]*\b/g,             // CLI flags

      // common CLI commands like "git clone" or "npm install"
      /\b(?:git|npm|pip|yarn|docker|brew|cargo|pnpm)\s+[a-z][\w-]*/g,

                                             // common CLI commands
      /\bimport\s+\w+/g,                     // import statements
      // host:port patterns, avoids bible verses like "1:10" and WCAG ratios like "4.5:1"
      // Negative lookbehind: not preceded by decimal number (WCAG ratios)
      // Negative lookahead: not followed by just "1" (WCAG ratios end with :1)
      /\b(?!\d+:\d+\b)(?<!\d\.)[\w.-]+:(?!\d*1\b)\d+\b/g,
      /\b[A-Z]+\+[A-Z]\b/g,                 // key combos like CTRL+C
      /\b(?:export|set)\s+[A-Za-z_][\w.-]*=\$?[\w.-]+\b/g,   // shell variable assignments
      // Permissive shell variable usage, avoids prices like $50 or $19.99.
      // Allows single-digit variables like $1, but not $10 or more.
      /\$(?!\d{2,}(?:\.\d*)?\b|\d\.\d+)\S+/g
    ];

    const flaggedRanges = []; // Track ranges [start, end] that have been flagged

    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(line)) !== null) {
        const fullMatch = match[0];
        const start = match.index;
        const end = start + fullMatch.length;

        // Skip if this range overlaps with an already-flagged range
        const overlapsWithFlagged = flaggedRanges.some(([flaggedStart, flaggedEnd]) => {
          // Check for any overlap: start is before flagged end AND end is after flagged start
          return start < flaggedEnd && end > flaggedStart;
        });
        if (overlapsWithFlagged) {
          continue;
        }

        // For the path pattern, apply extra heuristics to avoid false positives
        // on natural language like "read/write" or "pass/fail".
        if (pattern.source.includes('\\/') && !isLikelyFilePath(fullMatch)) {
          continue;
        }

        // Skip if inside a code span
        if (isInCodeSpan(codeSpans, start, end)) {
          continue;
        }
        // Skip if inside a Markdown link, wiki link, HTML comment, or angle bracket autolink
        if (inMarkdownLink(line, start, end) || inWikiLink(line, start, end) || inHtmlComment(line, start, end)) {
          continue;
        }

        // Skip URLs in angle brackets (Markdown autolinks: <https://example.com>)
        if (start > 0 && line[start - 1] === '<' && end < line.length && line[end] === '>') {
          // Check if this looks like a URL autolink
          if (/^(?:https?|ftp|ftps|file):\/\//i.test(fullMatch)) {
            // Mark this range as flagged to prevent subparts from being matched
            flaggedRanges.push([start, end]);
            continue;
          }
        }
        // Skip if in ignored terms (default + user-configured)
        if (allIgnoredTerms.has(fullMatch)) {
          continue;
        }

        // Skip domain names used in prose (without protocol)
        // Only flag full URLs that include protocol (http://, https://, etc.)
        if (isDomainInProse(fullMatch, line, start)) {
          continue;
        }
        
        // Skip version numbers in parentheses (e.g., "(v19.1.0)", "(Python 3.11+)")
        if (start > 0 && line[start - 1] === '(' && end < line.length && line[end] === ')') {
          // Check if it looks like a version number
          if (/^v?\d+(\.\d+)*(\+|\.\d+)*$/.test(fullMatch) || /^[A-Za-z]+\s+\d+(\.\d+)*(\+)?$/.test(fullMatch)) {
            continue;
          }
        }

        // Skip grammar pluralization patterns (e.g., "word(s)", "term(s)", "issue(s)")
        if (/^\w+\([a-z]\)$/.test(fullMatch)) {
          continue;
        }
        // Only skip if this match is inside a true LaTeX math region
        if (inLatexMath(line, start, end)) {
          continue;
        }
        // Check if this match is part of a full URL
        // We want to flag the ENTIRE URL (with protocol), not skip it
        // But we should skip individual components (like just the path part)
        const urlRegex = /https?:\/\/[\w\-._~:/?#[\]@!$&'()*+,;=%]+/g;
        let urlMatch;
        let isPartOfUrl = false;
        let isFullUrl = false;

        while ((urlMatch = urlRegex.exec(line)) !== null) {
          const urlStart = urlMatch.index;
          const urlEnd = urlMatch.index + urlMatch[0].length;

          // Check if this match is inside the URL
          if (start >= urlStart && end <= urlEnd) {
            // Check if this match includes the protocol (is the full URL or starts with protocol)
            const matchIncludesProtocol = start <= urlStart + 8; // "https://".length

            if (matchIncludesProtocol) {
              // This is the full URL with protocol - we want to flag it
              isFullUrl = true;
            } else {
              // This is just a part of the URL (path, query, etc.) - skip it
              isPartOfUrl = true;
            }
            break;
          }
        }

        // Skip if this is just a part of a URL (not the full URL with protocol)
        if (isPartOfUrl && !isFullUrl) {
          continue;
        }

        // For shell patterns with $ variables, prioritize reporting the whole command
        if (fullMatch.includes('$') && fullMatch.includes(' ') &&
            (fullMatch.includes('grep') || fullMatch.includes('export'))) {
          // This is a shell command - report it and skip further matches on this line
          const originalFixInfo = {
            editColumn: start + 1,
            deleteCount: fullMatch.length,
            insertText: `\`${fullMatch}\``,
          };
          
          const safeFixInfo = createSafeFixInfo(
            originalFixInfo,
            'backtick',
            fullMatch,
            `\`${fullMatch}\``,
            { type: 'shell-command', line }
          );
          
          onError({
            lineNumber,
            detail: generateContextualErrorMessage(fullMatch, line),
            context: fullMatch,
            range: [start + 1, fullMatch.length], // Convert to 1-indexed
            fixInfo: safeFixInfo,
          });
        } else if (!fullMatch.startsWith('$')) {
          // For non-shell variables, report normally
          const originalFixInfo = {
            editColumn: start + 1,
            deleteCount: fullMatch.length,
            insertText: `\`${fullMatch}\``,
          };
          
          const safeFixInfo = createSafeFixInfo(
            originalFixInfo,
            'backtick',
            fullMatch,
            `\`${fullMatch}\``,
            { type: 'code-element', line }
          );
          
          onError({
            lineNumber,
            detail: generateContextualErrorMessage(fullMatch, line),
            context: fullMatch,
            range: [start + 1, fullMatch.length], // Convert to 1-indexed
            fixInfo: safeFixInfo,
          });
        }

        // Track this range as flagged to prevent overlapping matches
        flaggedRanges.push([start, end]);
      }
    }
  }
}

export default {
  names: ['backtick-code-elements', 'BCE001'],
  description: 'Require code snippets, folder names and directories to be wrapped in backticks.',
  tags: ['style', 'code', 'prose'],
  parser: 'micromark',
  function: backtickCodeElements,
  fixable: true
};
