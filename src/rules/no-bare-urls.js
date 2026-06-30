/**
 * @fileoverview Rule to enforce that URLs are always wrapped in a proper Markdown link.
 * @author
 */

import {
  validateStringArray,
  validateConfig,
  logValidationErrors,
  createMarkdownlintLogger
} from './config-validation.js';
import { createSafeFixInfo } from './autofix-safety.js';
import { buildLineContext } from './shared-context.js';

/**
 * @typedef {import("markdownlint").Rule} Rule
 * @typedef {import("markdownlint").RuleParams} RuleParams
 * @typedef {import("markdownlint").RuleOnError} RuleOnError
 */

/**
 * Regex that matches bare URLs: http://, https://, or www. patterns.
 *
 * Matches from the protocol/www prefix through non-whitespace characters.
 * Trailing punctuation is stripped in post-processing by
 * {@link trimTrailingPunctuation}.
 *
 * Negative lookbehinds:
 * - `(?<!<)` — skip autolinks: <https://...>
 * - `(?<!\]\()` — skip link destinations: [text](https://...)
 */
const BARE_URL_RE =
  /(?<!<)(?<!\]\()(?:https?:\/\/|www\.)\S+/g;

/**
 * Detect autolink ranges `<url>` on a line.
 *
 * Autolinks look like `<https://example.com>` or `<http://...>`. We need to
 * skip any URL match that falls inside one of these so the rule does not
 * double-report or flag already-correct usage.
 *
 * @param {string} line - Source line.
 * @returns {Array<[number, number]>} `[start, end)` column ranges of autolinks.
 */
function autolinkRanges(line) {
  const ranges = /** @type {Array<[number, number]>} */ ([]);
  const re = /<(?:https?:\/\/|www\.)[^\s>]*>/g;
  let m;
  while ((m = re.exec(line)) !== null) {
    ranges.push([m.index, m.index + m[0].length]);
  }
  return ranges;
}

/**
 * Check whether a column falls inside any of the given ranges.
 *
 * @param {Array<[number, number]>} ranges - `[start, end)` ranges.
 * @param {number} col - Zero-based column to test.
 * @returns {boolean}
 */
function inRanges(ranges, col) {
  return ranges.some(([start, end]) => col >= start && col < end);
}

/**
 * Strip trailing punctuation from a URL match so we don't include sentence-
 * ending characters that are not part of the URL.
 *
 * Handles:
 * - Trailing `.`, `,`, `!`, `?`, `;`, `:` — sentence punctuation
 * - Trailing `)` only when it has no matching `(` inside the URL
 *   (balanced parens like Wikipedia URLs stay intact)
 * - Trailing `>`, `"`, `'` — markup characters
 *
 * Iterates until no more trimming is possible so that combined trailing chars
 * like `.).` are fully stripped.
 *
 * @param {string} url - Raw URL string from the regex match.
 * @returns {string} URL with trailing punctuation removed.
 */
function trimTrailingPunctuation(url) {
  let prev;
  do {
    prev = url;
    // Strip trailing sentence punctuation and unmatched closing brackets.
    url = url.replace(/[.,!?;:<>"']+$/, '');
    // Strip a trailing `)` only if there is no unmatched `(` inside the URL.
    if (url.endsWith(')')) {
      const opens = (url.match(/\(/g) || []).length;
      const closes = (url.match(/\)/g) || []).length;
      if (closes > opens) {
        url = url.slice(0, -1);
      }
    }
  } while (url !== prev);
  return url;
}

/** @type {Rule} */
export default {
  names: ["no-bare-url", "BU001"],
  description: "Bare URL used. Surround with < and >.",
  tags: ["links", "url"],
  parser: "none",
  information: new URL("https://github.com/davidanson/markdownlint/blob/main/doc/md034.md"),
  function:
    /**
     * @param {RuleParams} params
     * @param {RuleOnError} onError
     */
    function rule(params, onError) {
      // params.config is already scoped to this rule by markdownlint.
      // When the top-level config is { "no-bare-url": true }, params.config is
      // true (boolean); when it is { "no-bare-url": { allowedDomains: [...] } },
      // params.config is { allowedDomains: [...] }.
      const config = (params.config && typeof params.config === 'object') ? params.config : {};

      // Validate configuration
      const configSchema = {
        allowedDomains: validateStringArray
      };

      const validationResult = validateConfig(config, configSchema, 'no-bare-url');
      if (!validationResult.isValid) {
        const logger = createMarkdownlintLogger(onError, 'no-bare-url');
        logValidationErrors('no-bare-url', validationResult.errors, logger);
        // Continue execution with default values to prevent crashes
      }

      // Extract configuration with defaults
      const allowedDomains = Array.isArray(config.allowedDomains) ? config.allowedDomains : [];

      const lines = params.lines;
      const ctx = buildLineContext(lines);

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Skip lines that are entirely inside a fenced code block or frontmatter.
        if (ctx.isInFencedCode(i) || ctx.isInFrontmatter(i)) {
          continue;
        }

        // Skip reference link definitions: `[label]: url` or `[label]: url "title"`.
        // These are not bare URLs in prose — they are part of Markdown link syntax.
        if (/^\s{0,3}\[[^\]]+\]:\s/.test(line)) {
          continue;
        }

        // Precompute autolink ranges for this line so we can skip them cheaply.
        const autolinks = autolinkRanges(line);

        // Scan for bare URL matches using the regex.
        BARE_URL_RE.lastIndex = 0;
        let match;
        while ((match = BARE_URL_RE.exec(line)) !== null) {
          let url = match[0];
          let urlStart = match.index;

          // Strip trailing punctuation that slipped through the regex.
          const stripped = trimTrailingPunctuation(url);
          if (stripped.length < url.length) {
            url = stripped;
            // Do NOT change urlStart — the URL still begins at the same column.
          }

          // If stripping left nothing meaningful, skip.
          if (!url || url.length < 4) continue;

          // Check per-column contexts for the start of the URL.
          if (ctx.isInInlineCode(i, urlStart)) continue;
          if (ctx.isInLinkDestination(i, urlStart)) continue;
          if (ctx.isInHtmlComment(i, urlStart)) continue;

          // Skip if the URL is inside an autolink <url>.
          if (inRanges(autolinks, urlStart)) continue;

          // Apply allowedDomains filter.
          if (allowedDomains.length > 0) {
            try {
              const urlObj = new URL(url.startsWith('www.') ? `https://${url}` : url);
              if (allowedDomains.includes(urlObj.hostname)) continue;
            } catch (_e) {
              // If we can't parse, proceed to flag it.
            }
          }

          // Build autofix: replace the bare URL with <url>.
          const editColumn = urlStart + 1; // 1-based
          const basicFixInfo = {
            editColumn,
            deleteCount: url.length,
            insertText: `<${url}>`
          };
          const safeFixInfo = createSafeFixInfo(
            basicFixInfo,
            'no-bare-url',
            url,
            basicFixInfo.insertText,
            { line }
          );

          onError({
            lineNumber: i + 1,
            detail: 'Bare URL used.',
            context: url,
            fixInfo: safeFixInfo
          });
        }
      }
    },
};
