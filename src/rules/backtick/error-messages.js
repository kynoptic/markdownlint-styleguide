// @ts-check

/**
 * Contextual error message generation for the BCE001 backtick-code-elements rule.
 *
 * Extracted from backtick-code-elements.js per ADR-004 to reduce that file
 * below the ~500 LOC threshold and make error message logic testable
 * in isolation (#207).
 */

import { isSentenceBoundary } from './detection-helpers.js';

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
export function generateContextualErrorMessage(text, line) {
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
