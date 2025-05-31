// @ts-check

"use strict";

/**
 * Markdownlint configuration with absolute path resolution
 * 
 * @description This module provides a markdownlint configuration that uses absolute paths
 * to load custom rules. This is useful when the configuration needs to be used from
 * a different directory than the package root, ensuring rules are always found regardless
 * of the working directory.
 * 
 * @module markdownlint-absolute-config
 * @example
 * // In a file located in a different directory
 * const markdownlintConfig = require("markdownlint-rules/markdownlint-absolute");
 * 
 * // Use the configuration
 * const markdownlint = require("markdownlint");
 * const result = markdownlint.sync({
 *   files: ["path/to/some/README.md"],
 *   config: markdownlintConfig
 * });
 */

const path = require("path");
const projectRoot = __dirname;

// Use absolute paths to ensure rules are found regardless of working directory
const sentenceCase = require(path.join(projectRoot, "rules", "sentence-case.js"));
const backtickCodeElements = require(path.join(projectRoot, "rules", "backtick-code-elements.js"));

module.exports = {
  "default": true,
  "MD204": false, // Code blocks should use fenced syntax
  "MD013": false, // Line length
  "customRules": [
    sentenceCase,
    backtickCodeElements
  ],
  "sentence-case-headings-bold": {
    "enabled": true
  },
  "backtick-code-elements": {
    "enabled": true
  }
};
