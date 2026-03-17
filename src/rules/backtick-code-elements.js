// @ts-check

/**
 * Rule that requires code snippets, file names and directory paths
 * to be wrapped in backticks when used in prose.
 */
// Import the centralized ignoredTerms Set and path detection constants
import {
  backtickIgnoredTerms as ignoredTerms,
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
import {
  trimUrlTrailingPunctuation,
  inMarkdownLink,
  inWikiLink,
  inHtmlComment,
  inHtmlSemanticTag,
  inLatexMath,
  isLikelyFilePath
} from './backtick/detection-helpers.js';
import { generateContextualErrorMessage } from './backtick/error-messages.js';

// Common English suffixes that look like CLI flags (#145)
// These are ordinary morphemes, not command-line options.
const englishSuffixes = new Set([
  '-ism', '-ist', '-ize', '-ise',
  '-tion', '-sion', '-ment', '-ness',
  '-ful', '-less', '-able', '-ible',
  '-ous', '-ive', '-al', '-ly',
  '-er', '-or', '-en',
  '-ing', '-ed', '-est',       // gerund, past tense, superlative (#193)
  '-like', '-based', '-wise', '-ward',
  '-gate', '-phobia', '-phobic'
]);

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

    // Skip lines that are in a code block or heading based on configuration
    if ((skipCodeBlocks && inCodeBlock) || /^\s*#/.test(line)) {
      continue;
    }

    // Detect $$ as math block fences (AFTER code block skip, so $$ inside code blocks is ignored)
    if (line.trim() === '$$') {
      inMathBlock = !inMathBlock;
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
      // Issue #162: Tilde-prefixed home directory paths like ~/.claude/skills, ~/Documents
      // Must be checked BEFORE dir/dotfile patterns to capture the full path as one unit
      /(?:^|(?<=\s))~\/(?:[\w.-]+\/)*[\w.-]+/g,
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
      // Each alternative uses \b to prevent prefix-matching (e.g., "to" blocking "tokenizer")
      /\bimport\s+(?!(?:the|a|an|your|my|our|their|its|some|all|any|this|that|these|those|from|into|to|new|old|more|them|it|something|everything|anything|nothing|system|systems|updates|path|paths|is|are|was|were|will|be|data|files|modules|packages|settings|config|options|rules|code|process|other|changes|and|or|statements|functions|classes|types|errors|values|items|records|content|text|names|custom|external|internal|local|global|default|specific|relevant|existing|additional|required|necessary|important|direct|proper|tool|tools)\b)\w+/g,
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
        if (inMarkdownLink(line, start, end) || inWikiLink(line, start, end) || inHtmlComment(line, start, end) || inHtmlSemanticTag(line, start, end)) {
          continue;
        }

        // Skip matches inside bracket placeholders [text] that are not part of links [text](url)
        if (start > 0) {
          const beforeMatch = line.lastIndexOf('[', start - 1);
          if (beforeMatch !== -1) {
            // Ensure no ] exists between the found [ and the match start
            // (i.e., the match is actually inside this bracket pair)
            const between = line.slice(beforeMatch + 1, start);
            if (!between.includes(']')) {
              const afterMatch = line.indexOf(']', end);
              if (afterMatch !== -1) {
                const afterBracket = line[afterMatch + 1];
                // If ] is NOT followed by ( it's a reference label or placeholder, not a link
                if (afterBracket !== '(') {
                  continue;
                }
              }
            }
          }
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

        // Skip common English suffixes that look like CLI flags (#145)
        if (englishSuffixes.has(fullMatch.toLowerCase())) {
          continue;
        }

        // Skip ellipsis-joined prose words, e.g. "only...but" or "system…was" (#196).
        // Covers both the full match (e.g. "only...but") and sub-matches like "..but"
        // that occur because the dotfile pattern fires inside "word...word".
        if (/\.\.\.|…/.test(fullMatch)) {
          const parts = fullMatch.split(/\.\.\.|\u2026/);
          if (parts.length === 2 && parts.every((p) => /^[a-z]{2,}$/.test(p))) {
            continue;
          }
        }
        // Also catch dotfile-pattern sub-matches (e.g. "..but") that are the trailing
        // half of an ellipsis sequence: match starts with ".." and the char 2 positions
        // back (the letter before the first dot) is an alphabetic character.
        if (/^\.\.[a-z]{2,}$/.test(fullMatch) && start >= 2 && /[a-z]/i.test(line[start - 2])) {
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
            // Determine whether this match is the full URL (includes protocol) or just a
            // sub-component (host/path/query). Check the match text itself rather than using
            // a fixed offset, which was fragile when the path started right after :// (#194).
            if (/^(?:https?|ftp|ftps|file):\/\//i.test(fullMatch)) {
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
            { type: 'shell-command', line, file: params.name, lineNumber }
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
            { type: 'code-element', line, file: params.name, lineNumber }
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
