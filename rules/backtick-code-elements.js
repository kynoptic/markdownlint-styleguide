// @ts-check

"use strict";

/**
 * Markdownlint rule to enforce backtick wrapping around code elements
 *
 * @description Ensures that filenames, directory paths, and code snippets are properly
 * wrapped in backticks for better readability and proper markdown formatting
 * @module backtick-code-elements
 */

// Helper functions exported for testing

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

module.exports = {
  names: ["backtick-code-elements"],
  description: "Code elements, filenames, and directory paths should be wrapped in backticks",
  tags: ["formatting", "code"],
  // Export helper functions for testing
  checkText,
  checkSegment,
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
      // Only process inline tokens with children
      if (
        token.type !== "inline" ||
        !token.children ||
        token.children.length === 0
      ) {
        return;
      }

      // Reconstruct the full line and track code (backtick) regions
      let lineContent = "";
      let codeRegions = [];
      let pos = 0;
      token.children.forEach((child) => {
        if (child.type === "code_inline") {
          // Mark code region (for exclusion)
          codeRegions.push([pos, pos + child.content.length]);
          lineContent += child.content;
          pos += child.content.length;
        } else if (child.type === "text") {
          lineContent += child.content;
          pos += child.content.length;
        } else if (child.type === "softbreak" || child.type === "hardbreak") {
          lineContent += "\n";
          pos += 1;
        }
      });

      // Detect URL ranges in the line
      const urlRegex = /https?:\/\/[\w\-._~:/?#[\]@!$&'()*+,;=%]+/g;
      let urlRanges = [];
      let match;
      while ((match = urlRegex.exec(lineContent)) !== null) {
        urlRanges.push([match.index, match.index + match[0].length]);
      }

      // Find all inline code spans (regions between backticks)
      let codeRanges = [];
      let backtickRegex = /`+/g;
      let codeMatch;
      let open = null;
      while ((codeMatch = backtickRegex.exec(lineContent)) !== null) {
        if (open === null) {
          open = codeMatch.index;
        } else {
          codeRanges.push([open, backtickRegex.lastIndex]);
          open = null;
        }
      }
      // Helper: check if a region overlaps any code span
      function isInCode(start, end) {
        // Make code regions inclusive of both backticks
        return codeRanges.some(([cStart, cEnd]) => start >= cStart && end <= cEnd);
      }
      // Helper: check if a region overlaps any URL
      function isInUrl(start, end) {
        return urlRanges.some(([uStart, uEnd]) => start < uEnd && end > uStart);
      }

      // For each pattern, search for matches outside URL regions and deduplicate errors
      for (const { regex, type } of patterns) {
        regex.lastIndex = 0;
        const reported = new Set();
        let m;
        while ((m = regex.exec(lineContent)) !== null) {
          const matchStart = m.index;
          const matchEnd = m.index + m[0].length;
          // Skip matches inside URLs
          if (isInUrl(matchStart, matchEnd)) continue;
          // Skip matches inside code (backtick) regions
          const inCode = codeRegions.some(([start, end]) => matchStart >= start && matchEnd <= end);
          if (inCode) continue;
          // Deduplicate by match string and position
          const key = `${type}:${m[0]}@${matchStart}`;
          if (reported.has(key)) continue;
          reported.add(key);
          onError({
            lineNumber: token.lineNumber,
            errorDetail: `${type} '${m[0]}' should be wrapped in backticks`,
            context: lineContent,
          });
        }
      }
    });
  },
};

// Helper functions moved to the top of the file
