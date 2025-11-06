/**
 * Report generator for external validation results.
 * Generates JSON and Markdown reports from validation results.
 */

/**
 * Generate JSON report from validation results.
 * @param {Object} results - Validation results containing sources and summary
 * @returns {Object} JSON report structure
 */
export function generateReport(results) {
  return {
    timestamp: new Date().toISOString(),
    sources: results.sources || [],
    summary: results.summary || {
      totalFiles: 0,
      filesWithViolations: 0,
      totalViolations: 0
    }
  };
}

/**
 * Generate Markdown report from validation results.
 * @param {Object} results - Validation results containing sources and summary
 * @returns {string} Markdown-formatted report
 */
export function generateMarkdownReport(results) {
  const { sources = [], summary = {} } = results;
  const {
    totalFiles = 0,
    filesWithViolations = 0,
    totalViolations = 0,
    autofixStats = {}
  } = summary;

  let markdown = '# External validation report\n\n';
  markdown += 'Generated: ' + new Date().toISOString() + '\n\n';

  // Summary section
  markdown += '## Summary\n\n';
  markdown += '- Total files: ' + totalFiles + '\n';
  markdown += '- Files with violations: ' + filesWithViolations + '\n';
  markdown += '- Total violations: ' + totalViolations + '\n';

  if (autofixStats.safeFixesAvailable) {
    markdown += '\n### Autofix analysis\n\n';
    markdown += '- Safe fixes available: ' + (autofixStats.safeFixesAvailable || 0) + '\n';
    markdown += '- Safe fixes blocked: ' + (autofixStats.safeFixesBlocked || 0) + '\n';
    markdown += '- Unsafe fixes applied: ' + (autofixStats.unsafeFixesApplied || 0) + '\n';
  }

  // Violations by source
  if (sources.length > 0) {
    markdown += '\n## Violations\n\n';

    for (const source of sources) {
      if (source.violations && source.violations.length > 0) {
        markdown += '### ' + source.path + '\n\n';

        for (const violation of source.violations) {
          markdown += '- Line ' + violation.line + ': **' + violation.rule + '**\n';
          markdown += '  - ' + violation.detail + '\n';
          
          if (violation.context) {
            markdown += '  - Context: `' + violation.context + '`\n';
          }

          if (violation.autofixSafety) {
            markdown += '  - Autofix: ' + (violation.autofixSafety.safe ? 'safe' : 'blocked') + ' (confidence: ' + violation.autofixSafety.confidence + ')\n';
          }

          markdown += '\n';
        }
      }
    }
  }

  return markdown;
}
