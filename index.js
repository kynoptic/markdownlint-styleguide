// @ts-check

"use strict";

/**
 * Main entry point for markdownlint-custom-rules
 * 
 * @description Exports all custom markdownlint rules from this package
 * @module markdownlint-custom-rules
 * @example
 * // In your markdownlint configuration
 * const customRules = require("markdownlint-custom-rules");
 * 
 * module.exports = {
 *   "customRules": customRules,
 *   // other markdownlint configuration
 * };
 */

const backtickCodeElements = require("./rules/backtick-code-elements.js");
const sentenceCase = require("./rules/sentence-case.js");

module.exports = [
  backtickCodeElements,
  sentenceCase
];
