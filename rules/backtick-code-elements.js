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
    params.tokens.forEach(function (token) {
      // Only check inline tokens
      if (token.type === "inline" && token.children) {
        let inLink = 0;
        let inCode = 0;
        token.children.forEach(function (child) {
          if (child.type === "link_open") inLink++;
          if (child.type === "link_close") inLink = Math.max(0, inLink - 1);
          if (child.type === "code_inline") inCode++;
          if (child.type === "text" && inLink === 0 && inCode === 0) {
            checkText(child.content, token.lineNumber, onError);
          }
          if (child.type === "code_inline") inCode = Math.max(0, inCode - 1);
        });
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
 */
function checkText(text, lineNumber, onError) {
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
  patterns.forEach((pattern) => {
    let match;
    while ((match = pattern.regex.exec(text)) !== null) {
      const before = text[match.index - 1];
      const after = text[match.index + match[0].length];
      const wrapped = before === "`" && after === "`";
      const isWordBoundary =
        !before ||
        !after ||
        (!/[a-zA-Z0-9_]/.test(before) && !/[a-zA-Z0-9_]/.test(after));
      if (!wrapped && isWordBoundary) {
        onError({
          lineNumber,
          detail: `${pattern.type} '${match[0]}' should be wrapped in backticks`,
          context: text,
        });
      }
    }
  });
}
