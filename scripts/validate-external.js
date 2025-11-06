#!/usr/bin/env node
/**
 * External validation CLI script.
 * Validates markdownlint rules against external markdown sources.
 */
import fs from 'fs';
import path from 'path';
import { loadConfig, validateConfig, findConfig } from '../src/validation/config-loader.js';
import { processLocalFile, processLocalDirectory, processGitHubRepo } from '../src/validation/source-processor.js';
import { generateReport, generateMarkdownReport } from '../src/validation/report-generator.js';
import allRules from '../src/index.js';

async function main() {
  console.log('External validation starting...\n');

  // Find and load configuration
  const configPath = await findConfig();
  if (!configPath) {
    console.error('No configuration file found.');
    console.error('Create a .markdownlint-trap-validation.jsonc file in your project root.');
    process.exit(1);
  }

  console.log('Loading configuration from:', configPath);
  const config = await loadConfig(configPath);

  // Validate configuration
  const validation = validateConfig(config);
  if (!validation.valid) {
    console.error('Configuration validation failed:');
    validation.errors.forEach(err => console.error('  -', err));
    process.exit(1);
  }

  const { sources, filters, reporting } = config;
  const lintOptions = {
    customRules: allRules,
    filters,
    config: {
      // Disable all core markdownlint rules - only test custom rules from this project
      default: false,

      // Enable only the custom rules we maintain
      "sentence-case-heading": true,
      "backtick-code-elements": true,
      "no-bare-url": true,
      "no-dead-internal-links": true,
      "no-literal-ampersand": true
    }
  };

  // Process all sources
  const results = {
    sources: [],
    summary: {
      totalFiles: 0,
      filesWithViolations: 0,
      totalViolations: 0,
      autofixStats: {
        safeFixesAvailable: 0,
        safeFixesBlocked: 0,
        unsafeFixesApplied: 0
      }
    }
  };

  // Process local files
  if (sources.local && sources.local.length > 0) {
    console.log('\nProcessing local sources...');
    for (const localPath of sources.local) {
      try {
        const stats = await fs.promises.stat(localPath);
        if (stats.isDirectory()) {
          const dirResults = await processLocalDirectory(localPath, lintOptions);
          results.sources.push(...dirResults);
          console.log('  Processed directory:', localPath, '(' + dirResults.length + ' files)');
        } else {
          const fileResult = await processLocalFile(localPath, lintOptions);
          results.sources.push(fileResult);
          console.log('  Processed file:', localPath);
        }
      } catch (error) {
        console.error('  Failed to process', localPath + ':', error.message);
        results.summary.errors = results.summary.errors || [];
        results.summary.errors.push({
          path: localPath,
          error: error.message
        });
      }
    }
  }

  // Process GitHub repositories
  if (sources.github && sources.github.length > 0) {
    console.log('\nProcessing GitHub repositories...');
    for (const repoName of sources.github) {
      try {
        const repoResults = await processGitHubRepo(repoName, lintOptions);
        results.sources.push(...repoResults);
        console.log('  Processed repository:', repoName, '(' + repoResults.length + ' files)');
      } catch (error) {
        console.error('  Failed to process repository', repoName + ':', error.message);
        results.summary.errors = results.summary.errors || [];
        results.summary.errors.push({
          repository: repoName,
          error: error.message
        });
      }
    }
  }

  // Calculate summary statistics
  results.summary.totalFiles = results.sources.length;
  results.summary.filesWithViolations = results.sources.filter(s => s.violations && s.violations.length > 0).length;
  results.summary.totalViolations = results.sources.reduce((sum, s) => sum + (s.violations ? s.violations.length : 0), 0);

  // Calculate autofix statistics
  for (const source of results.sources) {
    if (source.violations) {
      for (const violation of source.violations) {
        if (violation.fixInfo) {
          if (violation.autofixSafety) {
            if (violation.autofixSafety.safe) {
              results.summary.autofixStats.safeFixesAvailable++;
            } else {
              results.summary.autofixStats.safeFixesBlocked++;
            }
          }
        }
      }
    }
  }

  // Output results
  console.log('\n=== Summary ===');
  console.log('Total files:', results.summary.totalFiles);
  console.log('Files with violations:', results.summary.filesWithViolations);
  console.log('Total violations:', results.summary.totalViolations);

  if (results.summary.errors && results.summary.errors.length > 0) {
    console.log('Processing errors:', results.summary.errors.length);
  }

  // Generate reports
  const outputDir = reporting.outputDir || 'validation-reports';
  fs.mkdirSync(outputDir, { recursive: true });

  const formats = reporting.format || ['json'];
  for (const format of formats) {
    if (format === 'json') {
      const jsonReport = generateReport(results);
      const jsonPath = path.join(outputDir, 'validation-report.json');
      fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2));
      console.log('\nJSON report written to:', jsonPath);
    } else if (format === 'markdown') {
      const mdReport = generateMarkdownReport(results);
      const mdPath = path.join(outputDir, 'validation-report.md');
      fs.writeFileSync(mdPath, mdReport);
      console.log('Markdown report written to:', mdPath);
    }
  }

  console.log('\nValidation complete!');
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
