// @ts-check

"use strict";

/**
 * Programmatic markdownlint configuration with custom rules
 *
 * @description This module provides a ready-to-use markdownlint configuration object
 * that can be imported directly in JavaScript-based markdownlint configurations.
 * It enables the custom rules defined in this package while disabling some default rules.
 *
 * @module markdownlint-config
 * @example
 * // In your JavaScript file
 * const markdownlintConfig = require("markdownlint-clarity/markdownlint");
 *
 * // Use the configuration
 * const markdownlint = require("markdownlint");
 * const result = markdownlint.sync({
 *   files: ["README.md"],
 *   config: markdownlintConfig
 * });
 */

const sentenceCase = require("./rules/sentence-case.js");
const backtickCodeElements = require("./rules/backtick-code-elements.js");

module.exports = {
  default: true,
  MD204: false, // Code blocks should use fenced syntax
  MD013: false, // Line length
  MD024: false, // Multiple headings with the same content
  customRules: [sentenceCase, backtickCodeElements],
  "sentence-case-headings-bold": {
    enabled: true,
  },
  "backtick-code-elements": {
    enabled: true,
  },
};
