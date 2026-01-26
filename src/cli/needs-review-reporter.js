// @ts-check

/**
 * Needs-review reporter for three-tier autofix system.
 *
 * Formats items in the "needs-review" tier for:
 * - Human-readable text output
 * - Machine-readable JSON output for AI agents
 */

/**
 * @typedef {Object} NeedsReviewItem
 * @property {string} file - Source file path
 * @property {number} line - Line number (1-based)
 * @property {string} rule - Rule that flagged this item
 * @property {string} original - Original text
 * @property {string} suggested - Suggested fix
 * @property {number} confidence - Confidence score (0-1)
 * @property {Object} [ambiguityInfo] - Ambiguity information
 * @property {string} [ambiguityInfo.type] - Type of ambiguity
 * @property {string} [ambiguityInfo.term] - Ambiguous term
 * @property {string} [ambiguityInfo.reason] - Reason for ambiguity
 * @property {string} [context] - Surrounding context
 * @property {Object} [heuristics] - Heuristic breakdown
 */

/**
 * @typedef {Object} ReporterOptions
 * @property {'text' | 'json'} [format='text'] - Output format
 * @property {string} [outputFile] - Optional file path for output
 */

/**
 * @typedef {Object} ReportSummary
 * @property {number} totalItems - Total items needing review
 * @property {number} uniqueFiles - Number of unique files
 * @property {number} uniqueRules - Number of unique rules
 * @property {number} averageConfidence - Average confidence score
 */

/**
 * Reporter class for collecting and formatting needs-review items.
 */
export class NeedsReviewReporter {
  /**
   * Create a new reporter.
   * @param {ReporterOptions} [options={}] - Reporter options
   */
  constructor(options = {}) {
    /** @type {ReporterOptions} */
    this.options = {
      format: options.format || 'text',
      outputFile: options.outputFile
    };
    /** @type {NeedsReviewItem[]} */
    this.items = [];
  }

  /**
   * Add a needs-review item to the reporter.
   * @param {NeedsReviewItem} item - Item to add
   */
  addItem(item) {
    this.items.push(item);
  }

  /**
   * Get items grouped by rule.
   * @returns {Object<string, NeedsReviewItem[]>} Items grouped by rule
   */
  getItemsByRule() {
    const byRule = {};
    for (const item of this.items) {
      if (!byRule[item.rule]) {
        byRule[item.rule] = [];
      }
      byRule[item.rule].push(item);
    }
    return byRule;
  }

  /**
   * Get items grouped by file.
   * @returns {Object<string, NeedsReviewItem[]>} Items grouped by file
   */
  getItemsByFile() {
    const byFile = {};
    for (const item of this.items) {
      if (!byFile[item.file]) {
        byFile[item.file] = [];
      }
      byFile[item.file].push(item);
    }
    return byFile;
  }

  /**
   * Get summary statistics.
   * @returns {ReportSummary} Summary statistics
   */
  getSummary() {
    const uniqueFiles = new Set(this.items.map(item => item.file)).size;
    const uniqueRules = new Set(this.items.map(item => item.rule)).size;
    const totalConfidence = this.items.reduce((sum, item) => sum + item.confidence, 0);
    const averageConfidence = this.items.length > 0 ? totalConfidence / this.items.length : 0;

    return {
      totalItems: this.items.length,
      uniqueFiles,
      uniqueRules,
      averageConfidence
    };
  }

  /**
   * Generate report in the configured format.
   * @returns {string} Formatted report
   */
  generateReport() {
    if (this.options.format === 'json') {
      return formatJsonReport(this);
    }
    return formatTextReport(this);
  }

  /**
   * Clear all items.
   */
  clear() {
    this.items = [];
  }
}

/**
 * Format a text report for human consumption.
 * @param {NeedsReviewReporter} reporter - Reporter instance
 * @returns {string} Formatted text report
 */
export function formatTextReport(reporter) {
  const summary = reporter.getSummary();
  const itemWord = summary.totalItems === 1 ? 'item' : 'items';
  const byRule = reporter.getItemsByRule();

  let output = `\n=== NEEDS REVIEW (${summary.totalItems} ${itemWord}) ===\n`;

  if (summary.totalItems === 0) {
    output += '\nNo items require review.\n';
    return output;
  }

  // Add action instructions for AI agents
  output += '\n';
  output += 'ACTION REQUIRED: Review each item below and decide whether to:\n';
  output += '  1. APPLY the suggested fix (if the suggestion is correct)\n';
  output += '  2. REJECT the fix (if the original is correct, e.g., proper noun)\n';
  output += '\n';
  output += 'For each item, read the surrounding context in the file to determine\n';
  output += 'whether the term is a proper noun (keep as-is) or common noun (apply fix).\n';
  output += '\n';

  // Format items grouped by rule
  for (const [rule, items] of Object.entries(byRule)) {
    const ruleItemWord = items.length === 1 ? 'item' : 'items';
    output += `${rule} (${items.length} ${ruleItemWord}):\n`;

    for (const item of items) {
      output += `  ${item.file}:${item.line} - "${item.original}"\n`;
      output += `    -> Suggested: "${item.suggested}"\n`;

      if (item.ambiguityInfo && item.ambiguityInfo.reason) {
        output += `    -> Reason: ${item.ambiguityInfo.reason}\n`;
      }

      if (item.context) {
        output += `    -> Context: ${item.context}\n`;
      }

      output += `    -> Confidence: ${(item.confidence * 100).toFixed(0)}%\n`;

      // Add explicit action instruction
      output += `    -> Action: Read ${item.file} around line ${item.line}, then APPLY or REJECT\n`;
      output += '\n';
    }
  }

  return output;
}

/**
 * Format a JSON report for AI agent consumption.
 * @param {NeedsReviewReporter} reporter - Reporter instance
 * @returns {string} JSON-formatted report
 */
export function formatJsonReport(reporter) {
  const summary = reporter.getSummary();
  const byRule = reporter.getItemsByRule();

  const jsonReport = {
    // Instructions for AI agents processing this output
    instructions: {
      description: 'Items below require manual review. The autofix system was not confident enough to apply these changes automatically.',
      actions: [
        'For each item, read the surrounding context in the source file',
        'Determine if the suggested fix is appropriate based on context',
        'If APPLY: Edit the file to replace "original" with "suggested"',
        'If REJECT: The original text is correct (e.g., proper noun), no change needed'
      ],
      decisionCriteria: {
        applyFix: [
          'Term is used as a common noun (e.g., "a word about...")',
          'Term is used as a verb (e.g., "go to settings")',
          'Context clearly indicates generic/lowercase usage'
        ],
        rejectFix: [
          'Term refers to a product/brand (e.g., Microsoft Word)',
          'Term refers to a programming language (e.g., Go, Swift, Rust)',
          'Term is part of a proper noun phrase',
          'Context indicates the capitalization is intentional'
        ]
      }
    },
    needsReview: reporter.items.map(item => ({
      // Location
      file: item.file,
      line: item.line,
      rule: item.rule,

      // The change
      original: item.original,
      suggested: item.suggested,

      // Why it needs review
      confidence: item.confidence,
      ambiguityType: item.ambiguityInfo?.type,
      term: item.ambiguityInfo?.term,
      reason: item.ambiguityInfo?.reason,

      // Context for decision-making
      context: item.context,
      heuristics: item.heuristics,

      // Explicit action field
      action: {
        required: 'REVIEW_AND_DECIDE',
        options: ['APPLY', 'REJECT'],
        howToApply: `In ${item.file}, line ${item.line}: replace "${item.original}" with "${item.suggested}"`,
        howToReject: 'No file changes needed; original text is correct'
      }
    })),
    byRule,
    summary
  };

  return JSON.stringify(jsonReport, null, 2);
}

/**
 * Global reporter instance for collecting needs-review items during linting.
 * @type {NeedsReviewReporter | null}
 */
let globalReporter = null;

/**
 * Initialize the global reporter.
 * @param {ReporterOptions} [options={}] - Reporter options
 * @returns {NeedsReviewReporter} Global reporter instance
 */
export function initNeedsReviewReporter(options = {}) {
  globalReporter = new NeedsReviewReporter(options);
  return globalReporter;
}

/**
 * Get the global reporter instance.
 * @returns {NeedsReviewReporter} Global reporter instance
 */
export function getNeedsReviewReporter() {
  if (!globalReporter) {
    globalReporter = new NeedsReviewReporter();
  }
  return globalReporter;
}

/**
 * Reset the global reporter.
 */
export function resetNeedsReviewReporter() {
  if (globalReporter) {
    globalReporter.clear();
  }
}
