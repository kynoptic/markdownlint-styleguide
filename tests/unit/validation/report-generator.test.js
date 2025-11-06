/**
 * @unit
 * Unit tests for external validation report generator.
 */
import { describe, test, expect } from '@jest/globals';
import { generateReport, generateMarkdownReport } from '../../../src/validation/report-generator.js';

describe('Report generator', () => {
  describe('generateReport', () => {
    test('test_should_generate_json_report_when_violations_exist', () => {
      const results = {
        sources: [{
          type: 'local',
          path: '/path/to/file.md',
          violations: [{
            line: 5,
            rule: 'sentence-case-heading',
            detail: 'Heading uses title case',
            context: '## This Is Title Case'
          }]
        }],
        summary: {
          totalFiles: 1,
          filesWithViolations: 1,
          totalViolations: 1
        }
      };

      const report = generateReport(results);

      expect(report).toHaveProperty('sources');
      expect(report).toHaveProperty('summary');
      expect(report.sources).toHaveLength(1);
      expect(report.sources[0].violations).toHaveLength(1);
      expect(report.summary.totalViolations).toBe(1);
    });

    test('test_should_include_autofix_analysis_when_fixes_available', () => {
      const results = {
        sources: [{
          type: 'local',
          path: '/path/to/file.md',
          violations: [{
            line: 5,
            rule: 'sentence-case-heading',
            detail: 'Heading uses title case',
            fixInfo: {
              editColumn: 3,
              deleteCount: 18,
              insertText: 'This is title case'
            },
            autofixSafety: {
              safe: true,
              confidence: 0.95,
              reason: 'High confidence transformation'
            }
          }]
        }],
        summary: {
          totalFiles: 1,
          filesWithViolations: 1,
          totalViolations: 1,
          autofixStats: {
            safeFixesAvailable: 1,
            safeFixesBlocked: 0,
            unsafeFixesApplied: 0
          }
        }
      };

      const report = generateReport(results);

      expect(report.summary.autofixStats).toBeDefined();
      expect(report.summary.autofixStats.safeFixesAvailable).toBe(1);
      expect(report.sources[0].violations[0].autofixSafety).toBeDefined();
    });

    test('test_should_handle_empty_results_when_no_violations', () => {
      const results = {
        sources: [],
        summary: {
          totalFiles: 0,
          filesWithViolations: 0,
          totalViolations: 0
        }
      };

      const report = generateReport(results);

      expect(report.sources).toHaveLength(0);
      expect(report.summary.totalViolations).toBe(0);
    });
  });

  describe('generateMarkdownReport', () => {
    test('test_should_generate_markdown_format_when_violations_exist', () => {
      const results = {
        sources: [{
          type: 'local',
          path: '/path/to/file.md',
          violations: [{
            line: 5,
            rule: 'sentence-case-heading',
            detail: 'Heading uses title case',
            context: '## This Is Title Case'
          }]
        }],
        summary: {
          totalFiles: 1,
          filesWithViolations: 1,
          totalViolations: 1
        }
      };

      const markdown = generateMarkdownReport(results);

      expect(markdown).toContain('# External validation report');
      expect(markdown).toContain('Total files: 1');
      expect(markdown).toContain('Total violations: 1');
      expect(markdown).toContain('/path/to/file.md');
      expect(markdown).toContain('sentence-case-heading');
    });

    test('test_should_include_summary_section_when_generating_markdown', () => {
      const results = {
        sources: [],
        summary: {
          totalFiles: 10,
          filesWithViolations: 2,
          totalViolations: 5
        }
      };

      const markdown = generateMarkdownReport(results);

      expect(markdown).toContain('## Summary');
      expect(markdown).toContain('Total files: 10');
      expect(markdown).toContain('Files with violations: 2');
      expect(markdown).toContain('Total violations: 5');
    });
  });
});
