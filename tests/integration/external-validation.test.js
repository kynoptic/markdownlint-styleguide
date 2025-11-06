/**
 * @integration
 * Integration tests for external validation workflow.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { loadConfig, validateConfig } from '../../src/validation/config-loader.js';
import { processLocalDirectory } from '../../src/validation/source-processor.js';
import { generateReport, generateMarkdownReport } from '../../src/validation/report-generator.js';
import allRules from '../../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_CONFIG_DIR = path.join(__dirname, '../tmp/validation-config');
const TEST_REPORTS_DIR = path.join(__dirname, '../tmp/validation-reports');
const FIXTURES_DIR = path.join(__dirname, '../fixtures');

describe('External validation workflow', () => {
  beforeAll(() => {
    // Create test directories
    fs.mkdirSync(TEST_CONFIG_DIR, { recursive: true });
    fs.mkdirSync(TEST_REPORTS_DIR, { recursive: true });
  });

  afterAll(() => {
    // Clean up test directories
    if (fs.existsSync(TEST_CONFIG_DIR)) {
      fs.rmSync(TEST_CONFIG_DIR, { recursive: true, force: true });
    }
    if (fs.existsSync(TEST_REPORTS_DIR)) {
      fs.rmSync(TEST_REPORTS_DIR, { recursive: true, force: true });
    }
  });

  test('test_should_complete_full_workflow_when_config_valid', async () => {
    // Create test config
    const configPath = path.join(TEST_CONFIG_DIR, '.markdownlint-trap-validation.jsonc');
    const testConfig = {
      sources: {
        local: [FIXTURES_DIR]
      },
      filters: {
        include: ['**/*.md'],
        exclude: ['**/node_modules/**']
      },
      reporting: {
        format: ['json', 'markdown'],
        detailLevel: 'detailed',
        outputDir: TEST_REPORTS_DIR
      }
    };

    fs.writeFileSync(configPath, JSON.stringify(testConfig, null, 2));

    // Load and validate config
    const config = await loadConfig(configPath);
    const validation = validateConfig(config);
    expect(validation.valid).toBe(true);

    // Process sources
    const lintOptions = {
      customRules: allRules,
      filters: config.filters
    };

    const sourceResults = await processLocalDirectory(FIXTURES_DIR, lintOptions);
    expect(sourceResults.length).toBeGreaterThan(0);

    // Build results object
    const results = {
      sources: sourceResults,
      summary: {
        totalFiles: sourceResults.length,
        filesWithViolations: sourceResults.filter(s => s.violations && s.violations.length > 0).length,
        totalViolations: sourceResults.reduce((sum, s) => sum + (s.violations ? s.violations.length : 0), 0)
      }
    };

    // Generate JSON report
    const jsonReport = generateReport(results);
    expect(jsonReport).toHaveProperty('timestamp');
    expect(jsonReport).toHaveProperty('sources');
    expect(jsonReport).toHaveProperty('summary');

    const jsonPath = path.join(TEST_REPORTS_DIR, 'test-report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2));
    expect(fs.existsSync(jsonPath)).toBe(true);

    // Generate Markdown report
    const mdReport = generateMarkdownReport(results);
    expect(mdReport).toContain('# External validation report');
    expect(mdReport).toContain('## Summary');

    const mdPath = path.join(TEST_REPORTS_DIR, 'test-report.md');
    fs.writeFileSync(mdPath, mdReport);
    expect(fs.existsSync(mdPath)).toBe(true);
  });

  test('test_should_handle_config_with_filters_when_processing', async () => {
    // Process only sentence-case fixtures
    const lintOptions = {
      customRules: allRules,
      filters: {
        include: ['**/sentence-case/**/*.md'],
        exclude: ['**/node_modules/**']
      }
    };

    const results = await processLocalDirectory(FIXTURES_DIR, lintOptions);

    expect(results.length).toBeGreaterThan(0);
    expect(results.every(r => r.path.includes('sentence-case'))).toBe(true);
  });

  test('test_should_include_violation_details_when_issues_found', async () => {
    const lintOptions = {
      customRules: allRules,
      filters: {
        include: ['**/*.md']
      }
    };

    const results = await processLocalDirectory(FIXTURES_DIR, lintOptions);

    // Find a result with violations
    const withViolations = results.find(r => r.violations && r.violations.length > 0);

    if (withViolations) {
      expect(withViolations.violations[0]).toHaveProperty('line');
      expect(withViolations.violations[0]).toHaveProperty('rule');
      expect(withViolations.violations[0]).toHaveProperty('detail');
    }
  });
});
