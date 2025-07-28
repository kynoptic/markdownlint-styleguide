"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _configValidation = require("./config-validation.cjs");
/**
 * @fileoverview Rule to enforce that URLs are always wrapped in a proper Markdown link.
 * @author 
 */

/**
 * @typedef {import("markdownlint").Rule} Rule
 * @typedef {import("markdownlint").RuleParams} RuleParams
 * @typedef {import("markdownlint").RuleOnError} RuleOnError
 */

/**
 * Create autofix information to wrap a bare URL in angle brackets
 * @param {Object} linkToken - The link_open token
 * @param {Object} parentToken - The parent inline token
 * @param {number} childIndex - Index of the link_open token in children
 * @param {string[]} lines - Array of source lines
 * @returns {Object|null} Fix information for markdownlint
 */
function createAutoFix(linkToken, parentToken, childIndex, lines) {
  try {
    const lineNumber = linkToken.lineNumber;
    const line = lines[lineNumber - 1];
    if (!line) return null;

    // Find the text token (should be the next child after link_open)
    const textToken = parentToken.children[childIndex + 1];
    if (!textToken || textToken.type !== 'text') return null;
    const url = textToken.content;
    if (!url) return null;

    // Use the token's line/column information if available
    // markdown-it provides accurate position data through the map property
    let urlStart = -1;
    if (textToken.map && textToken.map.length >= 2) {
      // Try to use the token's position mapping
      const tokenStart = textToken.map[0];
      urlStart = line.indexOf(url, tokenStart);
    }

    // Fallback: search for the URL in the line
    if (urlStart === -1) {
      urlStart = line.indexOf(url);
    }

    // If still not found, try without protocol for cases where markdown-it normalizes
    if (urlStart === -1) {
      // Try to find the URL without protocol
      const urlWithoutProtocol = url.replace(/^https?:\/\//, '');
      urlStart = line.indexOf(urlWithoutProtocol);
      if (urlStart !== -1) {
        // Adjust the URL to match what's actually in the text
        const actualUrl = urlWithoutProtocol;
        return {
          editColumn: urlStart + 1,
          // 1-based column
          deleteCount: actualUrl.length,
          insertText: `<${actualUrl}>`
        };
      }
    }
    if (urlStart === -1) return null;
    return {
      editColumn: urlStart + 1,
      // 1-based column
      deleteCount: url.length,
      insertText: `<${url}>`
    };
  } catch (error) {
    // If we can't create a fix, return null to skip autofix
    return null;
  }
}

/** @type {Rule} */
var _default = exports.default = {
  names: ["no-bare-url", "BU001"],
  description: "Bare URL used. Surround with < and >.",
  tags: ["links", "url"],
  information: new URL("https://github.com/davidanson/markdownlint/blob/main/doc/md034.md"),
  function:
  /**
   * @param {RuleParams} params
   * @param {RuleOnError} onError
   */
  function rule(params, onError) {
    // This rule relies on markdown-it's linkify option to identify bare URLs.
    // It flags any URL that was automatically converted into a link.
    // The fix is to wrap the URL in angle brackets, e.g., <http://example.com>.
    // Note: Ensure markdown-it is configured with { linkify: true } in your test setup.

    const config = params.config?.['no-bare-url'] || params.config?.BU001 || {};

    // Validate configuration
    const configSchema = {
      allowedDomains: _configValidation.validateStringArray,
      skipCodeBlocks: _configValidation.validateBoolean
    };
    const validationResult = (0, _configValidation.validateConfig)(config, configSchema, 'no-bare-url');
    if (!validationResult.isValid) {
      const logger = (0, _configValidation.createMarkdownlintLogger)(onError, 'no-bare-url');
      (0, _configValidation.logValidationErrors)('no-bare-url', validationResult.errors, logger);
      // Continue execution with default values to prevent crashes
    }

    // Extract configuration with defaults
    const allowedDomains = Array.isArray(config.allowedDomains) ? config.allowedDomains : [];
    const skipCodeBlocks = typeof config.skipCodeBlocks === 'boolean' ? config.skipCodeBlocks : true; // eslint-disable-line no-unused-vars
    params.tokens.filter(t => t.type === "inline" && t.children).forEach(token => {
      token.children.forEach((child, childIndex) => {
        if (child.type === "link_open" && child.info === "auto" && child.markup !== "autolink") {
          const href = child.attrGet("href");

          // Check if this URL domain is in the allowed list
          if (allowedDomains.length > 0) {
            try {
              const url = new URL(href);
              if (allowedDomains.includes(url.hostname)) {
                return; // Skip allowed domains
              }
            } catch (e) {
              // If URL parsing fails, proceed with the error
            }
          }

          // Create autofix that wraps the URL in angle brackets
          const fixInfo = createAutoFix(child, token, childIndex, params.lines);
          onError({
            lineNumber: child.lineNumber,
            detail: "Bare URL used.",
            context: href,
            fixInfo
          });
        }
      });
    });
  }
};
module.exports = exports.default;