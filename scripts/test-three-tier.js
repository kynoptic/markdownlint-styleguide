#!/usr/bin/env node
// @ts-check

/**
 * Test script for three-tier autofix system.
 * Runs markdownlint on a target directory and outputs the needs-review report.
 */

import { lint } from 'markdownlint/promise';
import { glob } from 'glob';
import rules, {
  initNeedsReviewReporter,
  getNeedsReviewReporter,
  formatTextReport,
  formatJsonReport
} from '../src/index.js';

const targetDir = process.argv[2] || '.';
const outputFormat = process.argv[3] || 'text'; // 'text' or 'json'

async function main() {
  console.log(`\nScanning ${targetDir} for Markdown files...\n`);

  // Initialize the needs-review reporter
  initNeedsReviewReporter({ format: outputFormat });

  // Find all markdown files
  const files = await glob('**/*.md', {
    cwd: targetDir,
    ignore: ['node_modules/**', '**/node_modules/**'],
    absolute: true
  });

  console.log(`Found ${files.length} Markdown files\n`);

  if (files.length === 0) {
    console.log('No Markdown files found.');
    return;
  }

  // Run markdownlint with our custom rules
  const results = await lint({
    files,
    customRules: rules,
    config: {
      default: false,
      'sentence-case-heading': true,
      'backtick-code-elements': true
    }
  });

  // Count violations by tier
  let totalViolations = 0;
  let violationsWithFix = 0;
  let violationsWithoutFix = 0;

  for (const [, violations] of Object.entries(results)) {
    for (const v of violations) {
      totalViolations++;
      if (v.fixInfo) {
        violationsWithFix++;
      } else {
        violationsWithoutFix++;
      }
    }
  }

  console.log('=== LINT SUMMARY ===');
  console.log(`Total violations: ${totalViolations}`);
  console.log(`Auto-fixable (high confidence): ${violationsWithFix}`);
  console.log(`Not auto-fixed (needs review or skipped): ${violationsWithoutFix}`);

  // Get the needs-review report
  const reporter = getNeedsReviewReporter();

  if (outputFormat === 'json') {
    console.log('\n' + formatJsonReport(reporter));
  } else {
    console.log(formatTextReport(reporter));
  }
}

main().catch(console.error);
