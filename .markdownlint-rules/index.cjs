"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _backtickCodeElements = _interopRequireDefault(require("./rules/backtick-code-elements.cjs"));
var _sentenceCaseHeading = _interopRequireDefault(require("./rules/sentence-case-heading.cjs"));
var _noDeadInternalLinks = _interopRequireDefault(require("./rules/no-dead-internal-links.cjs"));
var _noLiteralAmpersand = _interopRequireDefault(require("./rules/no-literal-ampersand.cjs"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
/**
 * Export all custom rules as a single array for markdownlint.
 * @type {import('markdownlint').Rule[]}
 */
var _default = exports.default = [_backtickCodeElements.default, _sentenceCaseHeading.default, _noDeadInternalLinks.default, _noLiteralAmpersand.default];
module.exports = exports.default;