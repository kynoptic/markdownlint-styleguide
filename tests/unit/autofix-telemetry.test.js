// @ts-check

/**
 * Unit tests for autofix telemetry system.
 * Tests telemetry data collection, formatting, and performance characteristics.
 */

import { AutofixTelemetry } from '../../src/rules/autofix-telemetry.js';

describe('AutofixTelemetry', () => {
  describe('Telemetry collection', () => {
    test('should_capture_confidence_scores_when_telemetry_enabled', () => {
      const telemetry = new AutofixTelemetry({ enabled: true });
      
      telemetry.recordDecision({
        rule: 'sentence-case-heading',
        original: 'Test Heading',
        fixed: 'Test heading',
        confidence: 0.85,
        applied: true,
        heuristics: {
          firstWordCapitalization: 0.3,
          caseChangesOnly: 0.2,
          technicalTerms: 0.1
        }
      });
      
      const data = telemetry.getData();
      expect(data.decisions).toHaveLength(1);
      expect(data.decisions[0].confidence).toBe(0.85);
      expect(data.decisions[0].applied).toBe(true);
    });

    test('should_record_skipped_fixes_when_confidence_low', () => {
      const telemetry = new AutofixTelemetry({ enabled: true });
      
      telemetry.recordDecision({
        rule: 'backtick-code-elements',
        original: 'the',
        fixed: '`the`',
        confidence: 0.2,
        applied: false,
        reason: 'Confidence below threshold (0.2 < 0.5)',
        heuristics: {
          naturalLanguagePenalty: -0.7,
          commonWord: true
        }
      });
      
      const data = telemetry.getData();
      expect(data.decisions).toHaveLength(1);
      expect(data.decisions[0].applied).toBe(false);
      expect(data.decisions[0].reason).toContain('below threshold');
    });

    test('should_collect_per_rule_statistics_when_multiple_rules', () => {
      const telemetry = new AutofixTelemetry({ enabled: true });
      
      telemetry.recordDecision({
        rule: 'sentence-case-heading',
        original: 'Heading One',
        fixed: 'Heading one',
        confidence: 0.75,
        applied: true
      });
      
      telemetry.recordDecision({
        rule: 'backtick-code-elements',
        original: 'npm',
        fixed: '`npm`',
        confidence: 0.85,
        applied: true
      });
      
      telemetry.recordDecision({
        rule: 'sentence-case-heading',
        original: 'API Usage',
        fixed: 'API usage',
        confidence: 0.65,
        applied: true
      });
      
      const stats = telemetry.getStatistics();
      expect(stats.byRule['sentence-case-heading'].totalDecisions).toBe(2);
      expect(stats.byRule['backtick-code-elements'].totalDecisions).toBe(1);
      expect(stats.byRule['sentence-case-heading'].applied).toBe(2);
    });

    test('should_track_heuristic_contributions_when_provided', () => {
      const telemetry = new AutofixTelemetry({ enabled: true });
      
      telemetry.recordDecision({
        rule: 'backtick-code-elements',
        original: 'npm install',
        fixed: '`npm install`',
        confidence: 0.8,
        applied: true,
        heuristics: {
          commandKeyword: 0.3,
          filePathPattern: 0.0,
          naturalLanguagePenalty: 0.0
        }
      });
      
      const data = telemetry.getData();
      expect(data.decisions[0].heuristics).toEqual({
        commandKeyword: 0.3,
        filePathPattern: 0.0,
        naturalLanguagePenalty: 0.0
      });
    });

    test('should_aggregate_confidence_distribution_when_calculating_stats', () => {
      const telemetry = new AutofixTelemetry({ enabled: true });
      
      // Low confidence
      telemetry.recordDecision({
        rule: 'test-rule',
        original: 'a',
        fixed: '`a`',
        confidence: 0.2,
        applied: false
      });
      
      // Medium confidence
      telemetry.recordDecision({
        rule: 'test-rule',
        original: 'medium',
        fixed: '`medium`',
        confidence: 0.55,
        applied: true
      });
      
      // High confidence
      telemetry.recordDecision({
        rule: 'test-rule',
        original: 'npm',
        fixed: '`npm`',
        confidence: 0.9,
        applied: true
      });
      
      const stats = telemetry.getStatistics();
      expect(stats.confidenceDistribution).toEqual({
        '0.0-0.3': 1,
        '0.3-0.5': 0,
        '0.5-0.7': 1,
        '0.7-1.0': 1
      });
    });
  });

  describe('Telemetry disabled behavior', () => {
    test('should_not_collect_data_when_disabled', () => {
      const telemetry = new AutofixTelemetry({ enabled: false });
      
      telemetry.recordDecision({
        rule: 'test-rule',
        original: 'test',
        fixed: '`test`',
        confidence: 0.8,
        applied: true
      });
      
      const data = telemetry.getData();
      expect(data.decisions).toHaveLength(0);
    });

    test('should_have_zero_overhead_when_disabled', () => {
      const telemetry = new AutofixTelemetry({ enabled: false });
      
      const iterations = 10000;
      const start = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        telemetry.recordDecision({
          rule: 'test-rule',
          original: 'test',
          fixed: '`test`',
          confidence: 0.8,
          applied: true
        });
      }
      
      const elapsed = performance.now() - start;
      
      // Should be negligible (< 10ms for 10k no-op calls)
      expect(elapsed).toBeLessThan(10);
    });
  });

  describe('Output formatting', () => {
    test('should_format_console_output_when_verbose_enabled', () => {
      const telemetry = new AutofixTelemetry({ enabled: true, verbose: true });

      telemetry.recordDecision({
        rule: 'sentence-case-heading',
        original: 'Test Heading',
        fixed: 'Test heading',
        confidence: 0.75,
        applied: true,
        file: 'test.md',
        line: 5
      });

      const output = telemetry.formatConsoleOutput();
      expect(output).toContain('sentence-case-heading');
      expect(output).toContain('0.75');
      expect(output).toContain('test.md:5');
    });

    test('should_format_json_output_when_requested', () => {
      const telemetry = new AutofixTelemetry({ enabled: true });
      
      telemetry.recordDecision({
        rule: 'backtick-code-elements',
        original: 'npm',
        fixed: '`npm`',
        confidence: 0.85,
        applied: true
      });
      
      const json = telemetry.toJSON();
      const parsed = JSON.parse(json);
      
      expect(parsed.decisions).toHaveLength(1);
      expect(parsed.decisions[0].rule).toBe('backtick-code-elements');
      expect(parsed.statistics).toBeDefined();
    });

    test('should_include_summary_statistics_when_formatting', () => {
      const telemetry = new AutofixTelemetry({ enabled: true });
      
      telemetry.recordDecision({
        rule: 'test-rule',
        original: 'test1',
        fixed: '`test1`',
        confidence: 0.8,
        applied: true
      });
      
      telemetry.recordDecision({
        rule: 'test-rule',
        original: 'test2',
        fixed: '`test2`',
        confidence: 0.3,
        applied: false
      });
      
      const output = telemetry.formatConsoleOutput();
      expect(output).toContain('Total decisions: 2');
      expect(output).toContain('Applied: 1');
      expect(output).toContain('Skipped: 1');
    });
  });

  describe('Actionable insights', () => {
    test('should_identify_aggressive_heuristics_when_blocking_valid_fixes', () => {
      const telemetry = new AutofixTelemetry({ enabled: true });
      
      // Simulate several fixes blocked by the same heuristic
      for (let i = 0; i < 5; i++) {
        telemetry.recordDecision({
          rule: 'backtick-code-elements',
          original: `config-${i}`,
          fixed: `\`config-${i}\``,
          confidence: 0.45, // Just below threshold
          applied: false,
          reason: 'Confidence below threshold',
          heuristics: {
            naturalLanguagePenalty: -0.3, // Consistent penalty
            filePathPattern: 0.2
          }
        });
      }
      
      const insights = telemetry.getInsights();
      expect(insights.potentiallyAggressiveHeuristics).toContain('naturalLanguagePenalty');
    });

    test('should_identify_permissive_heuristics_when_allowing_questionable_fixes', () => {
      const telemetry = new AutofixTelemetry({ enabled: true });
      
      // Simulate fixes with low confidence but still applied (just above threshold)
      for (let i = 0; i < 5; i++) {
        telemetry.recordDecision({
          rule: 'backtick-code-elements',
          original: `word${i}`,
          fixed: `\`word${i}\``,
          confidence: 0.52, // Just above threshold
          applied: true,
          heuristics: {
            commandKeyword: 0.1, // Weak boost
            naturalLanguagePenalty: -0.08
          }
        });
      }
      
      const insights = telemetry.getInsights();
      expect(insights.potentiallyPermissiveHeuristics).toContain('commandKeyword');
    });

    test('should_provide_threshold_recommendations_when_analyzing_distribution', () => {
      const telemetry = new AutofixTelemetry({ enabled: true });
      
      // Simulate many decisions clustered near threshold
      for (let i = 0; i < 10; i++) {
        telemetry.recordDecision({
          rule: 'test-rule',
          original: `test${i}`,
          fixed: `\`test${i}\``,
          confidence: 0.48 + (i * 0.01), // Range from 0.48 to 0.57
          applied: i >= 2 // Applied when confidence >= 0.5
        });
      }
      
      const insights = telemetry.getInsights();
      expect(insights.thresholdRecommendations).toBeDefined();
      expect(insights.thresholdRecommendations.nearThresholdCount).toBeGreaterThan(5);
    });
  });

  describe('Edge cases', () => {
    test('should_handle_empty_documents_when_no_violations', () => {
      const telemetry = new AutofixTelemetry({ enabled: true });
      
      const data = telemetry.getData();
      expect(data.decisions).toHaveLength(0);
      
      const stats = telemetry.getStatistics();
      expect(stats.totalDecisions).toBe(0);
      expect(stats.applied).toBe(0);
    });

    test('should_handle_all_fixes_skipped_when_low_confidence', () => {
      const telemetry = new AutofixTelemetry({ enabled: true });
      
      for (let i = 0; i < 5; i++) {
        telemetry.recordDecision({
          rule: 'test-rule',
          original: `word${i}`,
          fixed: `\`word${i}\``,
          confidence: 0.2,
          applied: false,
          reason: 'Low confidence'
        });
      }
      
      const stats = telemetry.getStatistics();
      expect(stats.totalDecisions).toBe(5);
      expect(stats.applied).toBe(0);
      expect(stats.skipped).toBe(5);
      expect(stats.applicationRate).toBe(0);
    });

    test('should_handle_missing_heuristics_when_not_provided', () => {
      const telemetry = new AutofixTelemetry({ enabled: true });
      
      telemetry.recordDecision({
        rule: 'test-rule',
        original: 'test',
        fixed: '`test`',
        confidence: 0.7,
        applied: true
        // No heuristics provided
      });
      
      const data = telemetry.getData();
      expect(data.decisions[0].heuristics).toBeUndefined();
    });

    test('should_reset_telemetry_when_requested', () => {
      const telemetry = new AutofixTelemetry({ enabled: true });
      
      telemetry.recordDecision({
        rule: 'test-rule',
        original: 'test',
        fixed: '`test`',
        confidence: 0.8,
        applied: true
      });
      
      expect(telemetry.getData().decisions).toHaveLength(1);
      
      telemetry.reset();
      
      expect(telemetry.getData().decisions).toHaveLength(0);
    });
  });

  describe('File output', () => {
    test('should_support_file_path_configuration_when_writing', () => {
      const telemetry = new AutofixTelemetry({ 
        enabled: true,
        outputFile: '/tmp/telemetry-test.json'
      });
      
      expect(telemetry.config.outputFile).toBe('/tmp/telemetry-test.json');
    });
  });
});
