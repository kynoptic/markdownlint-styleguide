// @ts-check

"use strict";

/**
 * Markdownlint rule to enforce backtick wrapping around code elements
 *
 * @description Ensures that filenames, directory paths, and code snippets are properly
 * wrapped in backticks for better readability and proper markdown formatting
 * @module backtick-code-elements
 */

module.exports = {
  names: ["backtick-code-elements"],
  description:
    "Filenames, directories, and code snippets must be wrapped in backticks",
  tags: ["formatting", "code"],
  /**
   * Rule implementation function
   *
   * @param {Object} params - Parameters object from markdownlint
   * @param {Array} params.tokens - Tokens from markdown-it
   * @param {Function} onError - Callback to report errors
   */
  function: function rule(params, onError) {
    // Precompile regex patterns for better performance
    const patterns = [
      { regex: /\b([A-Za-z0-9_\-]+\.[A-Za-z0-9]+)\b/g, type: "Filename" },
      {
        regex: /\b([A-Za-z0-9._\-]+\/[A-Za-z0-9._\-/]*)\b/g,
        type: "Directory path",
      },
      {
        regex:
          /\b(var|let|const|function|class|import|export|from|require|npm|yarn|git)\b/g,
        type: "Code element",
      },
    ];

    params.tokens.forEach(function (token) {
      // Skip non-inline tokens early
      if (
        token.type !== "inline" ||
        !token.children ||
        token.children.length === 0
      ) {
        return;
      }

      let inLink = 0;
      let inCode = 0;

      // Process children in a single pass
      for (let i = 0; i < token.children.length; i++) {
        const child = token.children[i];

        if (child.type === "link_open") {
          inLink++;
          continue;
        }

        if (child.type === "link_close") {
          inLink = Math.max(0, inLink - 1);
          continue;
        }

        if (child.type === "code_inline") {
          // Toggle code state
          inCode = inCode ? 0 : 1;
          continue;
        }

        // Only check text nodes outside of links and code
        if (
          child.type === "text" &&
          inLink === 0 &&
          inCode === 0 &&
          child.content
        ) {
          // Skip empty content or very short content early
          if (child.content.length < 3) continue;

          checkText(child.content, token.lineNumber, onError, patterns);
        }
      }
    });
  },
};

/**
 * Checks text content for unwrapped code elements
 *
 * @param {string} text - The text content to check
 * @param {number} lineNumber - The line number in the markdown file
 * @param {Function} onError - Callback function to report errors
 * @param {Array} patterns - Array of regex patterns to check
 */
function checkText(text, lineNumber, onError, patterns) {
  // Skip very short text early
  if (text.length < 3) return;

  // Check for URLs and skip them
  if (text.includes("http://") || text.includes("https://")) {
    // Extract URLs to avoid checking their contents
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = [];
    let match;

    while ((match = urlRegex.exec(text)) !== null) {
      urls.push({
        start: match.index,
        end: match.index + match[0].length,
      });
    }

    // If we have URLs, we need to check each segment between URLs
    if (urls.length > 0) {
      let lastEnd = 0;

      for (const url of urls) {
        // Check text before URL
        if (url.start > lastEnd) {
          const segment = text.substring(lastEnd, url.start);
          checkSegment(segment, lastEnd, lineNumber, onError, patterns);
        }
        lastEnd = url.end;
      }

      // Check text after last URL
      if (lastEnd < text.length) {
        const segment = text.substring(lastEnd);
        checkSegment(segment, lastEnd, lineNumber, onError, patterns);
      }

      return;
    }
  }

  // If no URLs, check the entire text
  checkSegment(text, 0, lineNumber, onError, patterns);
}

/**
 * Checks a segment of text for unwrapped code elements
 *
 * @param {string} segment - The text segment to check
 * @param {number} offset - Offset in the original text
 * @param {number} lineNumber - The line number in the markdown file
 * @param {Function} onError - Callback function to report errors
 * @param {Array} patterns - Array of regex patterns to check
 */
function checkSegment(segment, offset, lineNumber, onError, patterns) {
  // Skip very short segments
  if (segment.length < 3) return;

  for (const pattern of patterns) {
    // Reset regex lastIndex
    pattern.regex.lastIndex = 0;

    let match;
    while ((match = pattern.regex.exec(segment)) !== null) {
      const matchText = match[0];
      const matchIndex = match.index;

      // Skip very short matches
      if (matchText.length < 2) continue;

      const before = matchIndex > 0 ? segment[matchIndex - 1] : null;
      const after =
        matchIndex + matchText.length < segment.length
          ? segment[matchIndex + matchText.length]
          : null;

      const wrapped = before === "`" && after === "`";

      // Skip if already wrapped in backticks
      if (wrapped) continue;

      const isWordBoundary =
        !before ||
        !after ||
        (!/[a-zA-Z0-9_]/.test(before) && !/[a-zA-Z0-9_]/.test(after));

      if (isWordBoundary) {
        onError({
          lineNumber,
          detail: `${pattern.type} '${matchText}' should be wrapped in backticks`,
          context: segment,
        });
      }
    }
  }
}
