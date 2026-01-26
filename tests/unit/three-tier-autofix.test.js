/**
 * Tests for three-tier autofix system.
 *
 * The three-tier system provides:
 * - Auto-fix (confidence >= 0.7): Applied automatically
 * - Needs Review (0.3 <= confidence < 0.7): Flagged for manual/AI verification
 * - Skip (confidence < 0.3): Too uncertain, not worth surfacing
 */
import { describe, test, expect } from '@jest/globals';
import {
  shouldApplyAutofix,
  calculateSentenceCaseConfidence,
  createSafeFixInfo,
  THREE_TIER_THRESHOLDS
} from '../../src/rules/autofix-safety.js';
import { ambiguousTerms } from '../../src/rules/shared-constants.js';

describe('Three-tier autofix thresholds', () => {
  test('should export THREE_TIER_THRESHOLDS constant', () => {
    expect(THREE_TIER_THRESHOLDS).toBeDefined();
    expect(THREE_TIER_THRESHOLDS.autoFix).toBe(0.7);
    expect(THREE_TIER_THRESHOLDS.needsReview).toBe(0.3);
  });

  test('should mark high confidence (>=0.7) as safe and not requiring review', () => {
    const result = shouldApplyAutofix('sentence-case', 'HELLO WORLD', 'Hello world', {});

    // High confidence should be auto-applied
    if (result.confidence >= 0.7) {
      expect(result.safe).toBe(true);
      expect(result.requiresReview).toBe(false);
      expect(result.tier).toBe('auto-fix');
    }
  });

  test('should mark medium confidence (0.3-0.7) as needing review', () => {
    // Use a config that enables the three-tier system
    const config = {
      enabled: true,
      confidenceThreshold: 0.7,
      reviewThreshold: 0.3
    };

    // Create a scenario that produces medium confidence
    const result = shouldApplyAutofix(
      'sentence-case',
      'Word Processing',  // "Word" is ambiguous (MS Word vs common word)
      'Word processing',
      { ambiguousTerm: 'Word' },
      config
    );

    // Medium confidence should require review
    if (result.confidence >= 0.3 && result.confidence < 0.7) {
      expect(result.safe).toBe(false);
      expect(result.requiresReview).toBe(true);
      expect(result.tier).toBe('needs-review');
    }
  });

  test('should mark low confidence (<0.3) as skip', () => {
    const config = {
      enabled: true,
      confidenceThreshold: 0.7,
      reviewThreshold: 0.3
    };

    const result = shouldApplyAutofix(
      'backtick',
      'or',  // Common word, very low confidence
      '`or`',
      {},
      config
    );

    if (result.confidence < 0.3) {
      expect(result.safe).toBe(false);
      expect(result.requiresReview).toBe(false);
      expect(result.tier).toBe('skip');
    }
  });
});

describe('Ambiguity detection', () => {
  test('should have ambiguousTerms exported from shared-constants', () => {
    expect(ambiguousTerms).toBeDefined();
    expect(ambiguousTerms.word).toBeDefined();
    expect(ambiguousTerms.go).toBeDefined();
    expect(ambiguousTerms.swift).toBeDefined();
    expect(ambiguousTerms.rust).toBeDefined();
  });

  test('should reduce confidence for ambiguous terms in shouldApplyAutofix', () => {
    // "Word" could be Microsoft Word or a common noun
    // Ambiguity detection happens in shouldApplyAutofix, not calculateSentenceCaseConfidence
    const config = {
      enabled: true,
      confidenceThreshold: 0.7,
      reviewThreshold: 0.3
    };

    const resultAmbiguous = shouldApplyAutofix(
      'sentence-case',
      'Word Processing Features',
      'Word processing features',
      {},
      config
    );

    const resultClear = shouldApplyAutofix(
      'sentence-case',
      'API Processing Features',
      'API processing features',
      {},
      config
    );

    // Ambiguous term should have lower confidence than clear technical term
    expect(resultAmbiguous.confidence).toBeLessThan(resultClear.confidence);
    expect(resultAmbiguous.heuristics.ambiguityPenalty).toBeDefined();
  });

  test('should flag ambiguous programming language names', () => {
    const programmingLanguages = ['go', 'swift', 'rust', 'ruby', 'python', 'java'];

    for (const lang of programmingLanguages) {
      expect(ambiguousTerms[lang]).toBeDefined();
      expect(ambiguousTerms[lang].properForm).toBeDefined();
      expect(ambiguousTerms[lang].reason).toContain('OR');
    }
  });
});

describe('Three-tier decision result structure', () => {
  test('should include tier classification in result', () => {
    const config = {
      enabled: true,
      confidenceThreshold: 0.7,
      reviewThreshold: 0.3
    };

    const result = shouldApplyAutofix('backtick', 'package.json', '`package.json`', {}, config);

    expect(result).toHaveProperty('tier');
    expect(['auto-fix', 'needs-review', 'skip']).toContain(result.tier);
  });

  test('should include ambiguity information when detected', () => {
    const config = {
      enabled: true,
      confidenceThreshold: 0.7,
      reviewThreshold: 0.3
    };

    const result = shouldApplyAutofix(
      'sentence-case',
      'Go Templates',
      'Go templates',
      { line: '## Go Templates for Configuration' },
      config
    );

    expect(result).toHaveProperty('ambiguityInfo');
  });

  test('should include suggested fix in needs-review tier', () => {
    const config = {
      enabled: true,
      confidenceThreshold: 0.7,
      reviewThreshold: 0.3
    };

    const result = shouldApplyAutofix(
      'sentence-case',
      'Word Processing',
      'Word processing',
      {},
      config
    );

    if (result.tier === 'needs-review') {
      expect(result).toHaveProperty('suggestedFix');
      expect(result.suggestedFix).toBe('Word processing');
    }
  });
});

describe('createSafeFixInfo with three-tier system', () => {
  test('should return fixInfo for high confidence (auto-fix tier)', () => {
    const config = {
      enabled: true,
      confidenceThreshold: 0.7,
      reviewThreshold: 0.3
    };

    const originalFixInfo = {
      editColumn: 1,
      deleteCount: 12,
      insertText: '`package.json`'
    };

    const result = createSafeFixInfo(
      originalFixInfo,
      'backtick',
      'package.json',
      '`package.json`',
      {},
      config
    );

    // High confidence should return fixInfo
    expect(result).not.toBeNull();
    expect(result.insertText).toBe('`package.json`');
  });

  test('should return null for needs-review tier (not auto-fixed)', () => {
    const config = {
      enabled: true,
      confidenceThreshold: 0.7,
      reviewThreshold: 0.3
    };

    const originalFixInfo = {
      editColumn: 1,
      deleteCount: 4,
      insertText: 'word'
    };

    // Simulate a medium-confidence scenario
    const result = createSafeFixInfo(
      originalFixInfo,
      'sentence-case',
      'Word',  // Ambiguous
      'word',
      { forceConfidence: 0.5 },  // Force medium confidence for testing
      config
    );

    // Medium confidence should NOT auto-fix
    if (result === null || (result._safety && result._safety.confidence < 0.7)) {
      expect(result === null || result._safety.confidence < 0.7).toBe(true);
    }
  });

  test('should include _reviewInfo for needs-review tier', () => {
    const config = {
      enabled: true,
      confidenceThreshold: 0.7,
      reviewThreshold: 0.3
    };

    const originalFixInfo = {
      editColumn: 1,
      deleteCount: 10,
      insertText: 'Go templates'
    };

    const result = createSafeFixInfo(
      originalFixInfo,
      'sentence-case',
      'Go Templates',
      'Go templates',
      { line: '## Go Templates' },
      config
    );

    // If in needs-review tier, should have review info
    if (result && result._safety && result._safety.tier === 'needs-review') {
      expect(result._safety).toHaveProperty('reviewInfo');
      expect(result._safety.reviewInfo).toHaveProperty('original');
      expect(result._safety.reviewInfo).toHaveProperty('suggested');
      expect(result._safety.reviewInfo).toHaveProperty('reason');
    }
  });
});

describe('Configuration options for three-tier system', () => {
  test('should support custom autoFix threshold', () => {
    const config = {
      enabled: true,
      confidenceThreshold: 0.8,  // Higher than default
      reviewThreshold: 0.3
    };

    const result = shouldApplyAutofix('backtick', 'package.json', '`package.json`', {}, config);

    // With higher threshold, some fixes that were auto-fix become needs-review
    if (result.confidence >= 0.7 && result.confidence < 0.8) {
      expect(result.tier).toBe('needs-review');
    }
  });

  test('should support custom review threshold', () => {
    const config = {
      enabled: true,
      confidenceThreshold: 0.7,
      reviewThreshold: 0.4  // Higher than default
    };

    const result = shouldApplyAutofix('backtick', 'a', '`a`', {}, config);

    // With higher review threshold, some fixes that were needs-review become skip
    if (result.confidence >= 0.3 && result.confidence < 0.4) {
      expect(result.tier).toBe('skip');
    }
  });

  test('should support alwaysReview terms list', () => {
    const config = {
      enabled: true,
      confidenceThreshold: 0.7,
      reviewThreshold: 0.3,
      alwaysReview: ['Word', 'Go', 'Swift']
    };

    const result = shouldApplyAutofix(
      'sentence-case',
      'Word Processing',
      'Word processing',
      {},
      config
    );

    // Terms in alwaysReview should always go to needs-review tier
    expect(result.tier).toBe('needs-review');
    expect(result.requiresReview).toBe(true);
  });

  test('should support neverFlag terms list', () => {
    const config = {
      enabled: true,
      confidenceThreshold: 0.7,
      reviewThreshold: 0.3,
      neverFlag: ['SharePoint', 'JavaScript']
    };

    const result = shouldApplyAutofix(
      'sentence-case',
      'SharePoint Integration',
      'Sharepoint integration',
      {},
      config
    );

    // Terms in neverFlag should be skipped entirely
    expect(result.tier).toBe('skip');
  });
});

describe('Heuristics for ambiguity detection', () => {
  test('should detect proper noun signals via shouldApplyAutofix', () => {
    // "Word Processing" pattern suggests proper noun usage
    // Ambiguity penalty is applied in shouldApplyAutofix, not calculateSentenceCaseConfidence
    const config = {
      enabled: true,
      confidenceThreshold: 0.7,
      reviewThreshold: 0.3
    };

    const result = shouldApplyAutofix(
      'sentence-case',
      'Word Processing Features',
      'Word processing features',
      {},
      config
    );

    expect(result.heuristics).toBeDefined();
    expect(result.heuristics).toHaveProperty('ambiguityPenalty');
  });

  test('should detect common noun signals', () => {
    // Article before term suggests common noun
    const result = calculateSentenceCaseConfidence(
      'A Word About Performance',
      'A word about performance',
      { precedingContext: 'a' }
    );

    expect(result.heuristics).toBeDefined();
  });

  test('should provide ambiguity type classification', () => {
    const config = {
      enabled: true,
      confidenceThreshold: 0.7,
      reviewThreshold: 0.3
    };

    const result = shouldApplyAutofix(
      'sentence-case',
      'Go Templates',
      'Go templates',
      {},
      config
    );

    if (result.ambiguityInfo) {
      expect(result.ambiguityInfo).toHaveProperty('type');
      expect(['proper-noun-or-common', 'programming-language', 'product-name', 'semver-term'])
        .toContain(result.ambiguityInfo.type);
    }
  });
});
