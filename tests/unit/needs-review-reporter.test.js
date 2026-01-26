/**
 * Tests for needs-review reporter.
 *
 * The reporter formats items in the "needs-review" tier for:
 * - Human-readable text output
 * - Machine-readable JSON output for AI agents
 */
import { describe, test, expect } from '@jest/globals';
import {
  NeedsReviewReporter,
  formatTextReport,
  formatJsonReport
} from '../../src/cli/needs-review-reporter.js';

describe('NeedsReviewReporter', () => {
  describe('constructor', () => {
    test('should create reporter with default options', () => {
      const reporter = new NeedsReviewReporter();
      expect(reporter).toBeDefined();
      expect(reporter.items).toEqual([]);
    });

    test('should accept custom options', () => {
      const reporter = new NeedsReviewReporter({
        format: 'json',
        outputFile: 'needs-review.json'
      });
      expect(reporter.options.format).toBe('json');
      expect(reporter.options.outputFile).toBe('needs-review.json');
    });
  });

  describe('addItem', () => {
    test('should add a needs-review item', () => {
      const reporter = new NeedsReviewReporter();
      reporter.addItem({
        file: 'docs/api.md',
        line: 15,
        rule: 'sentence-case-heading',
        original: 'Word Processing Features',
        suggested: 'Word processing features',
        confidence: 0.45,
        ambiguityInfo: {
          type: 'proper-noun-or-common',
          term: 'Word',
          reason: '"Word" could be Microsoft Word (proper) or generic word (common)'
        },
        context: '## Word Processing Features'
      });

      expect(reporter.items).toHaveLength(1);
      expect(reporter.items[0].file).toBe('docs/api.md');
      expect(reporter.items[0].rule).toBe('sentence-case-heading');
    });

    test('should add multiple items', () => {
      const reporter = new NeedsReviewReporter();
      reporter.addItem({
        file: 'docs/api.md',
        line: 15,
        rule: 'sentence-case-heading',
        original: 'Word Processing',
        suggested: 'Word processing',
        confidence: 0.45
      });
      reporter.addItem({
        file: 'docs/api.md',
        line: 42,
        rule: 'sentence-case-heading',
        original: 'Go Templates',
        suggested: 'Go templates',
        confidence: 0.5
      });

      expect(reporter.items).toHaveLength(2);
    });
  });

  describe('getItemsByRule', () => {
    test('should group items by rule', () => {
      const reporter = new NeedsReviewReporter();
      reporter.addItem({
        file: 'docs/api.md',
        line: 15,
        rule: 'sentence-case-heading',
        original: 'Word Processing',
        suggested: 'Word processing',
        confidence: 0.45
      });
      reporter.addItem({
        file: 'docs/setup.md',
        line: 23,
        rule: 'backtick-code-elements',
        original: 'import/export',
        suggested: '`import/export`',
        confidence: 0.5
      });
      reporter.addItem({
        file: 'README.md',
        line: 42,
        rule: 'sentence-case-heading',
        original: 'Go Templates',
        suggested: 'Go templates',
        confidence: 0.5
      });

      const byRule = reporter.getItemsByRule();

      expect(Object.keys(byRule)).toHaveLength(2);
      expect(byRule['sentence-case-heading']).toHaveLength(2);
      expect(byRule['backtick-code-elements']).toHaveLength(1);
    });
  });

  describe('getItemsByFile', () => {
    test('should group items by file', () => {
      const reporter = new NeedsReviewReporter();
      reporter.addItem({
        file: 'docs/api.md',
        line: 15,
        rule: 'sentence-case-heading',
        original: 'Word Processing',
        suggested: 'Word processing',
        confidence: 0.45
      });
      reporter.addItem({
        file: 'docs/api.md',
        line: 42,
        rule: 'sentence-case-heading',
        original: 'Go Templates',
        suggested: 'Go templates',
        confidence: 0.5
      });
      reporter.addItem({
        file: 'README.md',
        line: 10,
        rule: 'backtick-code-elements',
        original: 'import/export',
        suggested: '`import/export`',
        confidence: 0.5
      });

      const byFile = reporter.getItemsByFile();

      expect(Object.keys(byFile)).toHaveLength(2);
      expect(byFile['docs/api.md']).toHaveLength(2);
      expect(byFile['README.md']).toHaveLength(1);
    });
  });

  describe('getSummary', () => {
    test('should return summary statistics', () => {
      const reporter = new NeedsReviewReporter();
      reporter.addItem({
        file: 'docs/api.md',
        line: 15,
        rule: 'sentence-case-heading',
        original: 'Word Processing',
        suggested: 'Word processing',
        confidence: 0.45
      });
      reporter.addItem({
        file: 'docs/api.md',
        line: 42,
        rule: 'sentence-case-heading',
        original: 'Go Templates',
        suggested: 'Go templates',
        confidence: 0.55
      });

      const summary = reporter.getSummary();

      expect(summary.totalItems).toBe(2);
      expect(summary.uniqueFiles).toBe(1);
      expect(summary.uniqueRules).toBe(1);
      expect(summary.averageConfidence).toBe(0.5);
    });
  });
});

describe('formatTextReport', () => {
  test('should format empty report', () => {
    const reporter = new NeedsReviewReporter();
    const text = formatTextReport(reporter);

    expect(text).toContain('=== NEEDS REVIEW (0 items) ===');
  });

  test('should include action instructions', () => {
    const reporter = new NeedsReviewReporter();
    reporter.addItem({
      file: 'docs/api.md',
      line: 15,
      rule: 'sentence-case-heading',
      original: 'Word Processing',
      suggested: 'Word processing',
      confidence: 0.45
    });

    const text = formatTextReport(reporter);

    expect(text).toContain('ACTION REQUIRED');
    expect(text).toContain('APPLY the suggested fix');
    expect(text).toContain('REJECT the fix');
  });

  test('should format report with items grouped by rule', () => {
    const reporter = new NeedsReviewReporter();
    reporter.addItem({
      file: 'docs/api.md',
      line: 15,
      rule: 'sentence-case-heading',
      original: 'Word Processing Features',
      suggested: 'Word processing features',
      confidence: 0.45,
      ambiguityInfo: {
        type: 'proper-noun-or-common',
        term: 'Word',
        reason: '"Word" could be Microsoft Word (proper) or generic word (common)'
      },
      context: '## Word Processing Features'
    });

    const text = formatTextReport(reporter);

    expect(text).toContain('=== NEEDS REVIEW (1 item) ===');
    expect(text).toContain('sentence-case-heading (1 item)');
    expect(text).toContain('docs/api.md:15');
    expect(text).toContain('Word Processing Features');
    expect(text).toContain('Word processing features');
    expect(text).toContain('"Word" could be Microsoft Word');
    expect(text).toContain('Action: Read docs/api.md around line 15');
  });

  test('should format multiple items', () => {
    const reporter = new NeedsReviewReporter();
    reporter.addItem({
      file: 'docs/api.md',
      line: 15,
      rule: 'sentence-case-heading',
      original: 'Word Processing',
      suggested: 'Word processing',
      confidence: 0.45
    });
    reporter.addItem({
      file: 'README.md',
      line: 42,
      rule: 'sentence-case-heading',
      original: 'Go Templates',
      suggested: 'Go templates',
      confidence: 0.5
    });

    const text = formatTextReport(reporter);

    expect(text).toContain('=== NEEDS REVIEW (2 items) ===');
    expect(text).toContain('docs/api.md:15');
    expect(text).toContain('README.md:42');
  });
});

describe('formatJsonReport', () => {
  test('should format empty report as JSON', () => {
    const reporter = new NeedsReviewReporter();
    const json = formatJsonReport(reporter);
    const parsed = JSON.parse(json);

    expect(parsed.needsReview).toEqual([]);
    expect(parsed.summary.totalItems).toBe(0);
  });

  test('should include instructions for AI agents', () => {
    const reporter = new NeedsReviewReporter();
    reporter.addItem({
      file: 'docs/api.md',
      line: 15,
      rule: 'sentence-case-heading',
      original: 'Word Processing',
      suggested: 'Word processing',
      confidence: 0.45
    });

    const json = formatJsonReport(reporter);
    const parsed = JSON.parse(json);

    expect(parsed.instructions).toBeDefined();
    expect(parsed.instructions.actions).toContain('For each item, read the surrounding context in the source file');
    expect(parsed.instructions.decisionCriteria.applyFix).toBeDefined();
    expect(parsed.instructions.decisionCriteria.rejectFix).toBeDefined();
  });

  test('should include action field for each item', () => {
    const reporter = new NeedsReviewReporter();
    reporter.addItem({
      file: 'docs/api.md',
      line: 15,
      rule: 'sentence-case-heading',
      original: 'Word Processing',
      suggested: 'Word processing',
      confidence: 0.45
    });

    const json = formatJsonReport(reporter);
    const parsed = JSON.parse(json);
    const item = parsed.needsReview[0];

    expect(item.action).toBeDefined();
    expect(item.action.required).toBe('REVIEW_AND_DECIDE');
    expect(item.action.options).toContain('APPLY');
    expect(item.action.options).toContain('REJECT');
    expect(item.action.howToApply).toContain('docs/api.md');
    expect(item.action.howToApply).toContain('Word processing');
  });

  test('should format items with full metadata', () => {
    const reporter = new NeedsReviewReporter();
    reporter.addItem({
      file: 'docs/api.md',
      line: 15,
      rule: 'sentence-case-heading',
      original: 'Word Processing Features',
      suggested: 'Word processing features',
      confidence: 0.45,
      ambiguityInfo: {
        type: 'proper-noun-or-common',
        term: 'Word',
        reason: '"Word" could be Microsoft Word (proper) or generic word (common)'
      },
      context: '## Word Processing Features',
      heuristics: {
        followedByCapital: true,
        inKnownPhrase: false,
        precedingContext: 'heading-start'
      }
    });

    const json = formatJsonReport(reporter);
    const parsed = JSON.parse(json);

    expect(parsed.needsReview).toHaveLength(1);

    const item = parsed.needsReview[0];
    expect(item.file).toBe('docs/api.md');
    expect(item.line).toBe(15);
    expect(item.rule).toBe('sentence-case-heading');
    expect(item.original).toBe('Word Processing Features');
    expect(item.suggested).toBe('Word processing features');
    expect(item.confidence).toBe(0.45);
    expect(item.ambiguityType).toBe('proper-noun-or-common');
    expect(item.term).toBe('Word');
    expect(item.reason).toBe('"Word" could be Microsoft Word (proper) or generic word (common)');
    expect(item.context).toBe('## Word Processing Features');
    expect(item.heuristics).toBeDefined();
  });

  test('should include summary in JSON output', () => {
    const reporter = new NeedsReviewReporter();
    reporter.addItem({
      file: 'docs/api.md',
      line: 15,
      rule: 'sentence-case-heading',
      original: 'Word Processing',
      suggested: 'Word processing',
      confidence: 0.45
    });
    reporter.addItem({
      file: 'README.md',
      line: 42,
      rule: 'backtick-code-elements',
      original: 'import/export',
      suggested: '`import/export`',
      confidence: 0.55
    });

    const json = formatJsonReport(reporter);
    const parsed = JSON.parse(json);

    expect(parsed.summary).toBeDefined();
    expect(parsed.summary.totalItems).toBe(2);
    expect(parsed.summary.uniqueFiles).toBe(2);
    expect(parsed.summary.uniqueRules).toBe(2);
    expect(parsed.summary.averageConfidence).toBe(0.5);
  });

  test('should group by rule in JSON output', () => {
    const reporter = new NeedsReviewReporter();
    reporter.addItem({
      file: 'docs/api.md',
      line: 15,
      rule: 'sentence-case-heading',
      original: 'Word Processing',
      suggested: 'Word processing',
      confidence: 0.45
    });
    reporter.addItem({
      file: 'README.md',
      line: 42,
      rule: 'sentence-case-heading',
      original: 'Go Templates',
      suggested: 'Go templates',
      confidence: 0.5
    });

    const json = formatJsonReport(reporter);
    const parsed = JSON.parse(json);

    expect(parsed.byRule).toBeDefined();
    expect(parsed.byRule['sentence-case-heading']).toHaveLength(2);
  });
});
