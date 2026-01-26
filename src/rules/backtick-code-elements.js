// @ts-check

/**
 * Rule that requires code snippets, file names and directory paths
 * to be wrapped in backticks when used in prose.
 */
// Import the centralized ignoredTerms Set and path detection constants
import {
  backtickIgnoredTerms as ignoredTerms,
  commonConceptualWords,
  knownDirectoryPrefixes,
  snakeCaseExemptions,
  camelCaseExemptions,
  mcMacNamePattern
} from './shared-constants.js';
import { createSafeFixInfo } from './autofix-safety.js';
import { 
  validateStringArray, 
  validateBoolean,
  validateConfig, 
  logValidationErrors,
  createMarkdownlintLogger 
} from './config-validation.js';
import { getCodeBlockLines, getInlineCodeSpans, isInCodeSpan } from './shared-utils.js';
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
 * Trim trailing punctuation from URLs that is likely sentence punctuation.
 * URLs can legitimately end with these chars, but when in prose like
 * "(https://example.com/path)." the trailing ")." is usually sentence punctuation.
 * Also trims markdown syntax characters that may be captured when URLs appear
 * inside bold/italic markdown links like **[text](url)**.
 *
 * @param {string} url - The matched URL
 * @returns {string} The URL with trailing sentence punctuation trimmed
 */
function trimUrlTrailingPunctuation(url) {
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
    'adapt/extend', 'start/complete', 'lowest/most', 'pass/fail',
    // Technology choice patterns (not paths)
    'npm/node.js', 'client/device/os'
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
    'quality', 'performance', 'security', 'safety', 'stability'
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
  },
  {
    pattern: /^_?[a-z][a-z0-9]*(?:_[a-z0-9]+)+$/,
    message: (text) => `Identifier '${text}' should be wrapped in backticks to indicate it's a code variable or function name`
  },
  {
    pattern: /^[a-z][a-z0-9]*[A-Z][a-zA-Z0-9]*$/,
    message: (text) => `Identifier '${text}' should be wrapped in backticks to indicate it's a code variable or function name`
  },
  {
    pattern: /^[A-Z](?=[a-zA-Z0-9]*[A-Z])[a-zA-Z0-9]*[a-z][a-zA-Z0-9]*$/,
    message: (text) => `Identifier '${text}' should be wrapped in backticks to indicate it's a code class or type name`
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
    skipMathBlocks: validateBoolean,
    detectPascalCase: validateBoolean
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
  // PascalCase detection is OFF by default due to high false positive rate with brand names
  const detectPascalCase = typeof config.detectPascalCase === 'boolean' ? config.detectPascalCase : false;

  // Combine default ignored terms with user-provided ones
  const allIgnoredTerms = new Set([...ignoredTerms, ...userIgnoredTerms]);

  const lines = params.lines;
  // Use getCodeBlockLines for proper fence length tracking (handles 4-backtick fences etc.)
  const codeBlockLines = getCodeBlockLines(lines);
  let inMathBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1;
    const line = lines[i];
    const inCodeBlock = codeBlockLines[i];

    // Skip code block fence lines
    if (inCodeBlock && /^(`{3,}|~{3,})/.test(line.trim())) {
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

    // Skip link reference definitions (e.g., "[name]: https://example.com")
    // These are valid markdown syntax and URLs should not be wrapped in backticks
    if (/^\s*\[[^\]]+\]:\s*\S/.test(line)) {
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
      /\B\.[\w.-]+\b(?!\/)/g,               // dotfiles like .env (exclude if followed by / which indicates a path)
      /\b[A-Z][A-Z0-9]*_[A-Z0-9_]+\b/g,      // environment variables like NODE_ENV
      /\b(?:PATH|HOME|TEMP|TMPDIR|USER|SHELL|PORT|HOST)\b/g, // env vars
      /\B--?[a-zA-Z][\w-]*\b/g,             // CLI flags

      // common CLI commands - match actual subcommands, not prose words
      // npm: install, run, start, test, build, init, publish, link, unlink, update, etc.
      // git: clone, commit, push, pull, checkout, branch, merge, rebase, status, log, etc.
      /\b(?:npm|yarn|pnpm)\s+(?:install|i|run|start|test|build|init|publish|link|unlink|update|add|remove|exec|create|ci|audit|outdated|ls|list|version|pack|cache|config|set|get)\b/g,
      /\b(?:git)\s+(?:clone|commit|push|pull|fetch|checkout|branch|merge|rebase|status|log|diff|add|rm|mv|reset|stash|tag|remote|init|config|show|blame|bisect|cherry-pick|revert|clean|gc|prune|reflog)\b/g,
      /\b(?:pip|pip3)\s+(?:install|uninstall|freeze|list|show|search|download|wheel|hash|check|config|cache|debug)\b/g,
      /\b(?:docker)\s+(?:run|build|push|pull|exec|ps|images|logs|stop|start|rm|rmi|compose|network|volume|system|inspect|tag|login|logout)\b/g,
      /\b(?:brew)\s+(?:install|uninstall|update|upgrade|search|list|info|doctor|cleanup|tap|untap|services|cask)\b/g,
      /\b(?:cargo)\s+(?:build|run|test|bench|check|clean|doc|new|init|add|remove|update|publish|install|uninstall|search|tree|fmt|clippy)\b/g,

                                             // common CLI commands
      // import statements - exclude common English words after "import"
      // This catches "import pdfplumber" but not "import them", "import system", etc.
      // Exclusion list covers pronouns, articles, prepositions, and common nouns
      /\bimport\s+(?!the|a|an|your|my|our|their|its|some|all|any|this|that|these|those|from|into|to|new|old|more|them|it|something|everything|anything|nothing|system|systems|updates|path|paths|is|are|was|were|will|be|data|files|modules|packages|settings|config|options|rules|code|process|other|changes|and|or|statements|functions|classes|types|errors|values|items|records|content|text|names|custom|external|internal|local|global|default|specific|relevant|existing|additional|required|necessary|important|direct|proper)\w+/g,
      // host:port patterns, avoids bible verses like "1:10" and WCAG ratios like "4.5:1"
      // Time ranges like "AM-12:30", "3-10:30" are filtered out separately
      // Negative lookbehind: not preceded by decimal number (WCAG ratios)
      // Negative lookahead: not followed by just "1" (WCAG ratios end with :1)
      /\b(?!\d+:\d+\b)(?<!\d\.)[\w.-]+:(?!\d*1\b)\d+\b/g,
      /\b[A-Z]+\+[A-Z]\b/g,                 // key combos like CTRL+C
      /\b(?:export|set)\s+[A-Za-z_][\w.-]*=\$?[\w.-]+\b/g,   // shell variable assignments
      // Permissive shell variable usage, avoids prices like $50 or $19.99.
      // Allows single-digit variables like $1, but not $10 or more.
      /\$(?!\d{2,}(?:\.\d*)?\b|\d\.\d+)\S+/g,

      // snake_case identifiers (variable_name, function_name, etc.)
      // Pattern: lowercase letter, followed by one or more (_alphanumeric+) segments
      // Also matches leading underscore for _internal_helper style
      /\b_?[a-z][a-z0-9]*(?:_[a-z0-9]+)+\b/g,

      // camelCase identifiers (useEffect, fetchData, myVariable, etc.)
      // Pattern: starts with lowercase, contains at least one uppercase letter
      // Requires at least 2 chars before the first capital to reduce false positives
      /\b[a-z][a-z0-9]*[A-Z][a-zA-Z0-9]*\b/g
    ];

    // PascalCase detection is opt-in due to high false positive rate with brand names
    // (CrowdStrike, SalesForce, OpenAI, etc. all match PascalCase patterns)
    if (detectPascalCase) {
      patterns.push(
        // PascalCase identifiers (MyComponent, UserService, HttpClient, etc.)
        // Pattern: starts with uppercase, requires at least 2 uppercase total, and has lowercase
        // Uses lookahead to ensure there's another uppercase letter somewhere in the word
        // This avoids matching simple proper nouns like "Paris" or "Michael"
        // Handles: MyComponent, HTMLParser, ApiV1Client, XMLHttpRequest
        /\b[A-Z](?=[a-zA-Z0-9]*[A-Z])[a-zA-Z0-9]*[a-z][a-zA-Z0-9]*\b/g
      );
    }

    const flaggedRanges = []; // Track ranges [start, end] that have been flagged

    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(line)) !== null) {
        let fullMatch = match[0];
        let start = match.index;
        let end = start + fullMatch.length;


        // For URLs, trim trailing punctuation that's likely sentence-ending
        // This handles cases like "(https://example.com/path)." in prose
        if (/^(?:https?|ftp|ftps|file):\/\//i.test(fullMatch)) {
          const trimmed = trimUrlTrailingPunctuation(fullMatch);
          if (trimmed !== fullMatch) {
            fullMatch = trimmed;
            end = start + fullMatch.length;
          }
        }

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
        // Only apply this check to patterns that are actually path-matching patterns
        // (contain / as a literal match, not in a negative lookahead)
        const isPathPattern = pattern.source.includes('\\/') && !pattern.source.includes('(?!');
        if (isPathPattern && !isLikelyFilePath(fullMatch)) {
          continue;
        }

        // Skip dotfile patterns that are actually document file extensions in a filename context
        // e.g., "Template .docx" - the ".docx" is part of a filename with spaces, not a standalone dotfile
        // Only applies to common document extensions (docx, pdf, xlsx, etc.) that often appear
        // after filenames with spaces. Actual dotfiles like .env, .gitignore should still be flagged.
        if (/^\.[\w.-]+$/.test(fullMatch) && start > 0) {
          const beforeMatch = line.slice(0, start);
          // Only skip if preceded by text AND it's a common document extension
          // that typically appears after filenames with embedded spaces
          const commonDocExtensions = /^\.(docx?|pdf|xlsx?|pptx?|odt|ods|odp|rtf|txt|csv)$/i;
          if (/\w\s+$/.test(beforeMatch) && commonDocExtensions.test(fullMatch)) {
            continue;
          }
        }

        // Skip if inside a code span
        if (isInCodeSpan(codeSpans, start, end)) {
          continue;
        }
        // Skip if inside a Markdown link, wiki link, HTML comment, or angle bracket autolink
        if (inMarkdownLink(line, start, end) || inWikiLink(line, start, end) || inHtmlComment(line, start, end)) {
          continue;
        }

        // Skip country abbreviations like U.S, U.K, E.U (not filenames)
        if (/^[A-Z]\.[A-Z]\.?$/i.test(fullMatch)) {
          continue;
        }

        // Skip camera aperture notation like f/2.8, f/1.4 (not file paths)
        if (/^f\/\d+(\.\d+)?$/i.test(fullMatch)) {
          continue;
        }

        // Skip time ranges and time-like patterns (AM-12:30, 3-10:30, 9:30, etc.)
        if (/^(?:AM|PM|am|pm)?-?\d+-?\d*:\d+$/.test(fullMatch) || /^\d+-\d+:\d+$/.test(fullMatch)) {
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

        // Skip snake_case exemptions (locale codes like en_US, zh_CN, etc.)
        if (snakeCaseExemptions.has(fullMatch)) {
          continue;
        }

        // Skip snake_case identifiers that are part of email addresses
        // (e.g., "julie_balise@hms.harvard.edu" - don't backtick "julie_balise")
        if (/^_?[a-z][a-z0-9]*(?:_[a-z0-9]+)+$/.test(fullMatch)) {
          // Check if followed by @ (email local part)
          if (end < line.length && line[end] === '@') {
            continue;
          }
          // Check if preceded by < and part of an email in angle brackets
          if (start > 0 && line[start - 1] === '<' && line.slice(end).includes('@')) {
            continue;
          }
        }

        // Skip date-like patterns (YYYY_MM_DD, backup_2024_03_20, etc.)
        // These contain numeric segments that look like dates
        if (/^\d{4}_\d{2}_\d{2}$/.test(fullMatch) || /_\d{4}_\d{2}_\d{2}$/.test(fullMatch)) {
          continue;
        }

        // Skip camelCase exemptions (brand names like iPhone, eBay, etc.)
        if (camelCaseExemptions.has(fullMatch)) {
          continue;
        }

        // Skip Mc/Mac surname patterns (McDonald, MacArthur, etc.)
        if (mcMacNamePattern.test(fullMatch)) {
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
