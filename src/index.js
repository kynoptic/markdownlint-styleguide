import backtickCodeElements from './rules/backtick-code-elements.js';
import sentenceCaseHeading from './rules/sentence-case-heading.js';
import noBareUrls from './rules/no-bare-urls.js';
import noDeadInternalLinks from './rules/no-dead-internal-links.js';
import noLiteralAmpersand from './rules/no-literal-ampersand.js';
import noEmptyListItems from './rules/no-empty-list-items.js';

// Export three-tier autofix system components
export { THREE_TIER_THRESHOLDS, shouldApplyAutofix, mergeAutofixSafetyConfig, DEFAULT_SAFETY_CONFIG } from './rules/autofix-safety.js';
export { validateAutofixSafetyConfig } from './rules/config-validation.js';
export {
  NeedsReviewReporter,
  formatTextReport,
  formatJsonReport,
  initNeedsReviewReporter,
  getNeedsReviewReporter,
  resetNeedsReviewReporter
} from './cli/needs-review-reporter.js';

/**
 * Export all custom rules as a single array for markdownlint.
 * @type {import('markdownlint').Rule[]}
 */
export default [backtickCodeElements, sentenceCaseHeading, noBareUrls, noDeadInternalLinks, noLiteralAmpersand, noEmptyListItems];
