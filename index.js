// @ts-check

"use strict";

/**
 * Main entry point for markdownlint-custom-rules
 * 
 * @description Exports all custom markdownlint rules from this package as an array.
 * This module can be directly imported in markdownlint configurations to enable
 * all the custom rules provided by this package.
 * 
 * @module markdownlint-custom-rules
 * 
 * @example <caption>Using in a JavaScript-based markdownlint configuration</caption>
 * // In your .markdownlint.js file
 * const customRules = require("markdownlint-rules");
 * 
 * module.exports = {
 *   "default": true,
 *   "customRules": customRules,
 *   "sentence-case-headings-bold": true,
 *   "backtick-code-elements": true
 * };
 * 
 * @example <caption>Using with markdownlint API</caption>
 * const markdownlint = require("markdownlint");
 * const customRules = require("markdownlint-rules");
 * 
 * const options = {
 *   files: ["README.md"],
 *   customRules: customRules,
 *   config: {
 *     "default": true,
 *     "sentence-case-headings-bold": true,
 *     "backtick-code-elements": true
 *   }
 * };
 * 
 * const result = markdownlint.sync(options);
 * console.log(result.toString());
 * 
 * @example <caption>Using with markdownlint-cli</caption>
 * // In your .markdownlint.json file
 * {
 *   "default": true,
 *   "customRules": [
 *     "./node_modules/markdownlint-rules/rules/sentence-case.js",
 *     "./node_modules/markdownlint-rules/rules/backtick-code-elements.js"
 *   ],
 *   "sentence-case-headings-bold": true,
 *   "backtick-code-elements": true
 * }
 */

const backtickCodeElements = require("./rules/backtick-code-elements.js");
const sentenceCase = require("./rules/sentence-case.js");

module.exports = [
  backtickCodeElements,
  sentenceCase
];
