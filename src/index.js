import backtickCodeElements from '../.vscode/custom-rules/backtick-code-elements.js';
import sentenceCaseHeading from '../.vscode/custom-rules/sentence-case-heading.js';

/**
 * Export all custom rules as a single array for markdownlint.
 * @type {import('markdownlint').Rule[]}
 */
export default [backtickCodeElements, sentenceCaseHeading];
