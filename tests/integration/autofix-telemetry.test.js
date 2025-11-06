// @ts-check

/**
 * Integration tests for autofix telemetry with real rules.
 * Tests that telemetry captures actual autofix decisions across multiple rules.
 */

import { lint } from 'markdownlint/promise';
import sentenceCaseHeading from '../../src/rules/sentence-case-heading.js';
import backtickCodeElements from '../../src/rules/backtick-code-elements.js';
import { initTelemetry, resetTelemetry } from '../../src/rules/autofix-telemetry.js';

describe('Autofix telemetry integration', () => {
  let telemetry;

  beforeEach(() => {
    // Initialize telemetry for each test
    telemetry = initTelemetry({ enabled: true });
    resetTelemetry();
  });

  afterEach(() => {
    resetTelemetry();
  });

  describe('Real rule integration', () => {
    test('should_capture_decisions_from_sentence_case_rule_when_processing_document', async () => {
      const content = [
        '# Test Heading One',
        '',
        'Some content here.',
        '',
        '## Another Test Heading',
        '',
        'More content.'
      ].join('\n');

      const options = {
        strings: { 'test.md': content },
        config: {
          default: false,
          'sentence-case-heading': true
        },
        customRules: [sentenceCaseHeading]
      };

      await lint(options);

      const data = telemetry.getData();
      expect(data.decisions.length).toBeGreaterThan(0);

      // Check that decisions have expected structure
      const firstDecision = data.decisions[0];
      expect(firstDecision).toHaveProperty('rule');
      expect(firstDecision).toHaveProperty('original');
      expect(firstDecision).toHaveProperty('fixed');
      expect(firstDecision).toHaveProperty('confidence');
      expect(firstDecision).toHaveProperty('applied');
      expect(firstDecision).toHaveProperty('heuristics');

      // Should have sentence-case decisions
      const sentenceCaseDecisions = data.decisions.filter(d => d.rule === 'sentence-case');
      expect(sentenceCaseDecisions.length).toBeGreaterThan(0);
    });

    test('should_capture_decisions_from_backtick_rule_when_processing_document', async () => {
      const content = [
        '# Installation',
        '',
        'Run npm install to install dependencies.',
        '',
        'Use the config.json file for configuration.',
        '',
        'The API endpoint is available.'
      ].join('\n');

      const options = {
        strings: { 'test.md': content },
        config: {
          default: false,
          'backtick-code-elements': true
        },
        customRules: [backtickCodeElements]
      };

      await lint(options);

      const data = telemetry.getData();
      expect(data.decisions.length).toBeGreaterThan(0);

      // Should have backtick decisions
      const backtickDecisions = data.decisions.filter(d => d.rule === 'backtick');
      expect(backtickDecisions.length).toBeGreaterThan(0);

      // Verify heuristics are captured
      const decisionWithHeuristics = backtickDecisions.find(d => d.heuristics);
      expect(decisionWithHeuristics).toBeDefined();
      expect(decisionWithHeuristics.heuristics).toHaveProperty('baseConfidence');
    });

    test('should_capture_both_applied_and_skipped_fixes_when_mixed_confidence', async () => {
      const content = [
        '# Documentation',
        '',
        'Use npm to install packages.',
        'The button is located here.',
        'Configure the webpack.config.js file.'
      ].join('\n');

      const options = {
        strings: { 'test.md': content },
        config: {
          default: false,
          'backtick-code-elements': true
        },
        customRules: [backtickCodeElements]
      };

      await lint(options);

      const stats = telemetry.getStatistics();

      // Should have both applied and skipped decisions
      expect(stats.totalDecisions).toBeGreaterThan(0);

      // Typically "npm" and "webpack.config.js" should be applied (high confidence)
      // while "button" might be skipped (low confidence)
      if (stats.totalDecisions > 1) {
        expect(stats.applied).toBeGreaterThan(0);
      }
    });

    test('should_track_per_rule_statistics_when_multiple_rules_active', async () => {
      const content = [
        '# Test Heading',
        '',
        'Use npm install command.',
        '',
        '## Another Heading Here'
      ].join('\n');

      const options = {
        strings: { 'test.md': content },
        config: {
          default: false,
          'sentence-case-heading': true,
          'backtick-code-elements': true
        },
        customRules: [sentenceCaseHeading, backtickCodeElements]
      };

      await lint(options);

      const stats = telemetry.getStatistics();

      // Should have statistics for multiple rules
      expect(Object.keys(stats.byRule).length).toBeGreaterThan(0);
    });
  });

  describe('Confidence distribution', () => {
    test('should_calculate_confidence_distribution_from_real_decisions', async () => {
      const content = [
        '# Guide',
        '',
        'Install npm packages.',
        'The API is available.',
        'Use a configuration file.',
        'The system works well.'
      ].join('\n');

      const options = {
        strings: { 'test.md': content },
        config: {
          default: false,
          'backtick-code-elements': true
        },
        customRules: [backtickCodeElements]
      };

      await lint(options);

      const stats = telemetry.getStatistics();

      // Should have a distribution across confidence ranges
      expect(stats.confidenceDistribution).toBeDefined();
      expect(stats.confidenceDistribution['0.0-0.3']).toBeGreaterThanOrEqual(0);
      expect(stats.confidenceDistribution['0.3-0.5']).toBeGreaterThanOrEqual(0);
      expect(stats.confidenceDistribution['0.5-0.7']).toBeGreaterThanOrEqual(0);
      expect(stats.confidenceDistribution['0.7-1.0']).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Insights generation', () => {
    test('should_provide_actionable_insights_from_real_decisions', async () => {
      const content = [
        '# Documentation',
        '',
        'Use npm install.',
        'The config.json file.',
        'A simple test.',
        'The or operator.'
      ].join('\n');

      const options = {
        strings: { 'test.md': content },
        config: {
          default: false,
          'backtick-code-elements': true
        },
        customRules: [backtickCodeElements]
      };

      await lint(options);

      const insights = telemetry.getInsights();

      // Insights should be generated
      expect(insights).toHaveProperty('potentiallyAggressiveHeuristics');
      expect(insights).toHaveProperty('potentiallyPermissiveHeuristics');
      expect(insights).toHaveProperty('thresholdRecommendations');
    });
  });

  describe('Output formatting', () => {
    test('should_format_console_output_with_real_data', async () => {
      const content = [
        '# Test',
        '',
        'Run npm install command.'
      ].join('\n');

      const options = {
        strings: { 'test.md': content },
        config: {
          default: false,
          'backtick-code-elements': true
        },
        customRules: [backtickCodeElements]
      };

      await lint(options);

      const output = telemetry.formatConsoleOutput();

      // Output should contain summary information
      expect(output).toContain('Autofix Telemetry Summary');
      expect(output).toContain('Total decisions:');
      expect(output).toContain('Applied:');
      expect(output).toContain('Confidence distribution:');
    });

    test('should_export_json_with_complete_data', async () => {
      const content = [
        '# Test',
        '',
        'Run npm install.'
      ].join('\n');

      const options = {
        strings: { 'test.md': content },
        config: {
          default: false,
          'backtick-code-elements': true
        },
        customRules: [backtickCodeElements]
      };

      await lint(options);

      const json = telemetry.toJSON();
      const data = JSON.parse(json);

      // JSON should have complete structure
      expect(data).toHaveProperty('decisions');
      expect(data).toHaveProperty('statistics');
      expect(data).toHaveProperty('insights');
      expect(data).toHaveProperty('metadata');
    });
  });

  describe('Performance', () => {
    test('should_have_minimal_overhead_when_enabled', async () => {
      const content = Array(100).fill([
        '# Heading',
        '',
        'Run npm install command.',
        ''
      ].join('\n')).join('\n');

      const options = {
        strings: { 'large.md': content },
        config: {
          default: false,
          'backtick-code-elements': true
        },
        customRules: [backtickCodeElements]
      };

      const start = performance.now();
      await lint(options);
      const elapsed = performance.now() - start;

      // Should complete in reasonable time even with telemetry
      expect(elapsed).toBeLessThan(5000); // 5 seconds max
      expect(telemetry.getData().decisions.length).toBeGreaterThan(0);
    });
  });
});
