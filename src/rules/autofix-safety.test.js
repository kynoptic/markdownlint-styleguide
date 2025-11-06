// @ts-check
/* global describe, test, expect */

import {
  shouldApplyAutofix,
  createSafeFixInfo,
  calculateSentenceCaseConfidence,
  calculateBacktickConfidence,
  analyzeCodeVsNaturalLanguage
} from './autofix-safety.js';

describe('shouldApplyAutofix', () => {
  describe('when_safety_checks_are_disabled', () => {
    test('should_allow_autofix_regardless_of_confidence', () => {
      const config = {
        enabled: false,
        confidenceThreshold: 0.9
      };

      const result = shouldApplyAutofix('sentence-case', 'test', 'Test', {}, config);

      expect(result.safe).toBe(true);
      expect(result.confidence).toBe(1.0);
      expect(result.reason).toBe('Safety checks disabled');
    });
  });

  describe('when_confidence_is_above_threshold', () => {
    test('should_allow_autofix_for_high_confidence_sentence_case', () => {
      const config = {
        enabled: true,
        confidenceThreshold: 0.5,
        requireManualReview: false
      };

      // Simple first-word capitalization is high confidence
      const result = shouldApplyAutofix('sentence-case', 'hello world', 'Hello world', {}, config);

      expect(result.safe).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.5);
      expect(result.requiresReview).toBe(false);
    });

    test('should_allow_autofix_for_high_confidence_backtick', () => {
      const config = {
        enabled: true,
        confidenceThreshold: 0.5,
        requireManualReview: false
      };

      // File path with extension is high confidence
      const result = shouldApplyAutofix('backtick', 'src/utils/helper.js', '', {}, config);

      expect(result.safe).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.5);
    });
  });

  describe('when_confidence_is_below_threshold', () => {
    test('should_block_autofix_for_low_confidence_sentence_case', () => {
      const config = {
        enabled: true,
        confidenceThreshold: 0.8,
        requireManualReview: false
      };

      // Extensive word changes have lower confidence
      const result = shouldApplyAutofix('sentence-case', 'foo bar baz qux', 'Different words entirely', {}, config);

      expect(result.safe).toBe(false);
      expect(result.confidence).toBeLessThan(0.8);
    });

    test('should_block_autofix_for_low_confidence_backtick', () => {
      const config = {
        enabled: true,
        confidenceThreshold: 0.8,
        requireManualReview: false
      };

      // Common English word is low confidence
      const result = shouldApplyAutofix('backtick', 'the', '', {}, config);

      expect(result.safe).toBe(false);
      expect(result.confidence).toBeLessThan(0.8);
    });
  });

  describe('when_manual_review_is_required', () => {
    test('should_flag_unsafe_fixes_for_review', () => {
      const config = {
        enabled: true,
        confidenceThreshold: 0.8,
        requireManualReview: true
      };

      const result = shouldApplyAutofix('backtick', 'is', '', {}, config);

      expect(result.safe).toBe(false);
      expect(result.requiresReview).toBe(true);
    });

    test('should_not_flag_safe_fixes_for_review', () => {
      const config = {
        enabled: true,
        confidenceThreshold: 0.5,
        requireManualReview: true
      };

      const result = shouldApplyAutofix('backtick', 'package.json', '', {}, config);

      expect(result.safe).toBe(true);
      expect(result.requiresReview).toBe(false);
    });
  });

  describe('when_rule_type_is_unknown', () => {
    test('should_use_neutral_confidence_score', () => {
      const config = {
        enabled: true,
        confidenceThreshold: 0.5
      };

      const result = shouldApplyAutofix('unknown-rule', 'test', 'Test', {}, config);

      expect(result.confidence).toBe(0.5);
      expect(result.reason).toBe('Unknown rule type');
    });
  });
});

describe('createSafeFixInfo', () => {
  describe('when_original_fixInfo_is_null', () => {
    test('should_return_null', () => {
      const result = createSafeFixInfo(null, 'sentence-case', 'test', 'Test', {});

      expect(result).toBeNull();
    });
  });

  describe('when_safety_check_passes', () => {
    test('should_return_fixInfo_with_safety_metadata_for_sentence_case', () => {
      const originalFixInfo = {
        editColumn: 1,
        deleteCount: 4,
        insertText: 'Test'
      };

      const config = {
        enabled: true,
        confidenceThreshold: 0.5
      };

      const result = createSafeFixInfo(originalFixInfo, 'sentence-case', 'test', 'Test', {}, config);

      expect(result).not.toBeNull();
      expect(result.editColumn).toBe(1);
      expect(result.deleteCount).toBe(4);
      expect(result.insertText).toBe('Test');
      expect(result._safety).toBeDefined();
      expect(result._safety.confidence).toBeGreaterThanOrEqual(0.5);
      expect(result._safety.ruleType).toBe('sentence-case');
    });

    test('should_return_fixInfo_with_safety_metadata_for_backtick', () => {
      const originalFixInfo = {
        editColumn: 1,
        deleteCount: 10,
        insertText: '`package.json`'
      };

      const config = {
        enabled: true,
        confidenceThreshold: 0.5
      };

      // Use a filename that will pass both safety check and advanced analysis
      const result = createSafeFixInfo(originalFixInfo, 'backtick', 'package.json', '`package.json`', {}, config);

      expect(result).not.toBeNull();
      expect(result._safety).toBeDefined();
      expect(result._safety.confidence).toBeGreaterThanOrEqual(0.5);
      expect(result._safety.ruleType).toBe('backtick');
      expect(result._safety.advancedAnalysis).toBeDefined();
    });
  });

  describe('when_safety_check_fails', () => {
    test('should_return_null_for_low_confidence_sentence_case', () => {
      const originalFixInfo = {
        editColumn: 1,
        deleteCount: 4,
        insertText: 'Test'
      };

      const config = {
        enabled: true,
        confidenceThreshold: 0.9
      };

      // Structural changes have lower confidence
      const result = createSafeFixInfo(
        originalFixInfo,
        'sentence-case',
        'original words',
        'Completely different text',
        {},
        config
      );

      expect(result).toBeNull();
    });

    test('should_return_null_for_low_confidence_backtick', () => {
      const originalFixInfo = {
        editColumn: 1,
        deleteCount: 1,
        insertText: '`a`'
      };

      const config = {
        enabled: true,
        confidenceThreshold: 0.6
      };

      // Common word 'a' should have low confidence
      const result = createSafeFixInfo(originalFixInfo, 'backtick', 'a', '`a`', {}, config);

      expect(result).toBeNull();
    });
  });

  describe('when_advanced_analysis_indicates_not_code', () => {
    test('should_return_null_for_strong_natural_language', () => {
      const originalFixInfo = {
        editColumn: 1,
        deleteCount: 2,
        insertText: '`is`'
      };

      const config = {
        enabled: true,
        confidenceThreshold: 0.3 // Even with low threshold
      };

      const result = createSafeFixInfo(originalFixInfo, 'backtick', 'is', '`is`', {}, config);

      expect(result).toBeNull();
    });
  });
});

describe('calculateSentenceCaseConfidence', () => {
  describe('when_no_changes_are_made', () => {
    test('should_return_zero_confidence_for_identical_text', () => {
      const { confidence } = calculateSentenceCaseConfidence('Test', 'Test', {});

      expect(confidence).toBe(0);
    });

    test('should_return_zero_confidence_for_empty_input', () => {
      const { confidence } = calculateSentenceCaseConfidence('', '', {});

      expect(confidence).toBe(0);
    });
  });

  describe('when_first_word_capitalization_changes', () => {
    test('should_return_high_confidence_for_simple_first_word_fix', () => {
      const { confidence } = calculateSentenceCaseConfidence('hello world', 'Hello world', {});

      expect(confidence).toBeGreaterThanOrEqual(0.7);
    });

    test('should_return_high_confidence_when_only_case_changes', () => {
      const { confidence } = calculateSentenceCaseConfidence('HELLO WORLD', 'Hello world', {});

      // Base (0.5) + first word (0.3) + only case (0.2) = 1.0
      expect(confidence).toBeGreaterThanOrEqual(0.9);
    });
  });

  describe('when_structural_changes_occur', () => {
    test('should_reduce_confidence_when_word_count_changes', () => {
      const { confidence } = calculateSentenceCaseConfidence('hello world', 'Hello', {});

      expect(confidence).toBeLessThan(0.7);
    });

    test('should_reduce_confidence_when_many_words_change', () => {
      const { confidence } = calculateSentenceCaseConfidence(
        'foo bar baz qux quux',
        'Different words entirely here',
        {}
      );

      expect(confidence).toBeLessThan(0.5);
    });
  });

  describe('when_technical_terms_are_present', () => {
    test('should_boost_confidence_for_API_and_technical_terms', () => {
      // Test with actual changes to trigger confidence calculation
      // Compare same type of change with and without technical terms
      const { confidence: withTechnical } = calculateSentenceCaseConfidence('api documentation guide', 'Api documentation guide', {});
      const { confidence: withoutTechnical } = calculateSentenceCaseConfidence('simple text guide', 'Simple text guide', {});

      // Both should have positive confidence
      expect(withTechnical).toBeGreaterThan(0);
      expect(withoutTechnical).toBeGreaterThan(0);

      // Technical terms in the string should boost confidence slightly
      // The boost is from the technical term pattern matching
      expect(withTechnical).toBeGreaterThanOrEqual(withoutTechnical);
    });
  });

  describe('when_boundary_conditions_are_tested', () => {
    test('should_cap_confidence_at_1.0', () => {
      // Even with all positive signals, confidence shouldn't exceed 1.0
      const { confidence } = calculateSentenceCaseConfidence('api url', 'API URL', {});

      expect(confidence).toBeLessThanOrEqual(1.0);
    });

    test('should_floor_confidence_at_0.0', () => {
      // Even with all negative signals, confidence shouldn't go below 0.0
      const { confidence } = calculateSentenceCaseConfidence(
        'word word word word word',
        'Entirely different sentence structure here',
        {}
      );

      expect(confidence).toBeGreaterThanOrEqual(0.0);
    });
  });
});

describe('calculateBacktickConfidence', () => {
  describe('when_text_is_empty', () => {
    test('should_return_zero_confidence', () => {
      const { confidence } = calculateBacktickConfidence('', {});

      expect(confidence).toBe(0);
    });
  });

  describe('when_text_is_a_file_path', () => {
    test('should_return_high_confidence_for_path_with_extension', () => {
      const { confidence } = calculateBacktickConfidence('src/utils/helper.js', {});

      expect(confidence).toBeGreaterThanOrEqual(0.8);
    });

    test('should_return_moderate_confidence_for_multi_segment_path', () => {
      const { confidence } = calculateBacktickConfidence('docs/guides/tutorial', {});

      expect(confidence).toBeGreaterThan(0.5);
    });

    test('should_return_low_confidence_for_simple_slash', () => {
      const { confidence } = calculateBacktickConfidence('and/or', {});

      // This could be natural language, not a path
      expect(confidence).toBeLessThan(0.7);
    });
  });

  describe('when_text_is_a_command', () => {
    test('should_return_high_confidence_for_npm_command', () => {
      const { confidence } = calculateBacktickConfidence('npm install', {});

      expect(confidence).toBeGreaterThanOrEqual(0.7);
    });

    test('should_return_high_confidence_for_git_command', () => {
      const { confidence } = calculateBacktickConfidence('git status', {});

      expect(confidence).toBeGreaterThanOrEqual(0.7);
    });

    test('should_return_high_confidence_for_standalone_filename', () => {
      const { confidence } = calculateBacktickConfidence('package.json', {});

      expect(confidence).toBeGreaterThanOrEqual(0.7);
    });
  });

  describe('when_text_is_natural_language', () => {
    test('should_return_very_low_confidence_for_common_word', () => {
      const { confidence } = calculateBacktickConfidence('the', {});

      expect(confidence).toBeLessThan(0.3);
    });

    test('should_return_low_confidence_for_short_word', () => {
      const { confidence } = calculateBacktickConfidence('is', {});

      expect(confidence).toBeLessThan(0.4);
    });

    test('should_return_low_confidence_for_natural_phrase', () => {
      const { confidence } = calculateBacktickConfidence('on/off', {});

      expect(confidence).toBeLessThan(0.3);
    });
  });

  describe('when_context_provides_technical_indicators', () => {
    test('should_boost_confidence_with_technical_context', () => {
      const { confidence: withContext } = calculateBacktickConfidence('config', {
        line: 'Run the install command to setup config'
      });
      const { confidence: withoutContext } = calculateBacktickConfidence('config', {});

      expect(withContext).toBeGreaterThan(withoutContext);
    });

    test('should_reduce_confidence_with_natural_language_context', () => {
      // Use a term that benefits more clearly from context
      const { confidence: withContext } = calculateBacktickConfidence('install', {
        line: 'I think we should install the package'
      });
      const { confidence: withoutContext } = calculateBacktickConfidence('install', {
        line: 'Run the install command'
      });

      // Natural language context should reduce confidence vs technical context
      expect(withContext).toBeLessThan(withoutContext);
    });
  });

  describe('when_boundary_conditions_are_tested', () => {
    test('should_cap_confidence_at_1.0', () => {
      const { confidence } = calculateBacktickConfidence('src/index.js', {
        line: 'Execute the command npm install'
      });

      expect(confidence).toBeLessThanOrEqual(1.0);
    });

    test('should_floor_confidence_at_0.0', () => {
      const { confidence } = calculateBacktickConfidence('a', {
        line: 'This is a simple sentence'
      });

      expect(confidence).toBeGreaterThanOrEqual(0.0);
    });
  });
});

describe('analyzeCodeVsNaturalLanguage', () => {
  describe('when_text_is_definitely_not_code', () => {
    test('should_return_low_confidence_for_common_pronouns', () => {
      const analysis = analyzeCodeVsNaturalLanguage('he', {});

      expect(analysis.isLikelyCode).toBe(false);
      expect(analysis.confidence).toBeLessThan(0.2);
      expect(analysis.shouldAutofix).toBe(false);
    });

    test('should_return_low_confidence_for_common_verbs', () => {
      const analysis = analyzeCodeVsNaturalLanguage('is', {});

      expect(analysis.isLikelyCode).toBe(false);
      expect(analysis.confidence).toBeLessThan(0.2);
      expect(analysis.shouldAutofix).toBe(false);
    });

    test('should_return_low_confidence_for_common_adjectives', () => {
      const analysis = analyzeCodeVsNaturalLanguage('good', {});

      expect(analysis.isLikelyCode).toBe(false);
      expect(analysis.confidence).toBeLessThan(0.2);
      expect(analysis.shouldAutofix).toBe(false);
    });
  });

  describe('when_text_has_strong_code_indicators', () => {
    test('should_return_high_confidence_for_environment_variable', () => {
      const analysis = analyzeCodeVsNaturalLanguage('NODE_ENV', {});

      expect(analysis.isLikelyCode).toBe(true);
      expect(analysis.confidence).toBeGreaterThan(0.6);
      expect(analysis.shouldAutofix).toBe(true);
    });

    test('should_return_high_confidence_for_file_with_extension', () => {
      const analysis = analyzeCodeVsNaturalLanguage('test.js', {});

      expect(analysis.isLikelyCode).toBe(true);
      expect(analysis.confidence).toBeGreaterThan(0.6);
      expect(analysis.shouldAutofix).toBe(true);
    });

    test('should_return_high_confidence_for_import_statement', () => {
      const analysis = analyzeCodeVsNaturalLanguage('import React', {});

      expect(analysis.isLikelyCode).toBe(true);
      expect(analysis.confidence).toBeGreaterThan(0.6);
      expect(analysis.shouldAutofix).toBe(true);
    });

    test('should_return_high_confidence_for_command_line_flag', () => {
      const analysis = analyzeCodeVsNaturalLanguage('--verbose', {});

      expect(analysis.isLikelyCode).toBe(true);
      expect(analysis.confidence).toBeGreaterThan(0.6);
      expect(analysis.shouldAutofix).toBe(true);
    });
  });

  describe('when_text_has_moderate_code_indicators', () => {
    test('should_boost_confidence_for_camelCase', () => {
      const analysis = analyzeCodeVsNaturalLanguage('getUserData', {});

      expect(analysis.confidence).toBeGreaterThan(0.5);
    });

    test('should_boost_confidence_for_snake_case', () => {
      const analysis = analyzeCodeVsNaturalLanguage('user_data', {});

      expect(analysis.confidence).toBeGreaterThan(0.5);
    });

    test('should_boost_confidence_for_acronyms', () => {
      const analysis = analyzeCodeVsNaturalLanguage('HTTPServer', {});

      expect(analysis.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('when_context_influences_analysis', () => {
    test('should_boost_confidence_with_technical_keywords', () => {
      const withContext = analyzeCodeVsNaturalLanguage('build', {
        line: 'Run the command to build the project'
      });
      const withoutContext = analyzeCodeVsNaturalLanguage('build', {});

      expect(withContext.confidence).toBeGreaterThan(withoutContext.confidence);
    });

    test('should_reduce_confidence_with_example_keywords', () => {
      const withContext = analyzeCodeVsNaturalLanguage('foo', {
        line: 'For example, foo represents a placeholder'
      });
      const withoutContext = analyzeCodeVsNaturalLanguage('foo', {});

      expect(withContext.confidence).toBeLessThan(withoutContext.confidence);
    });
  });

  describe('when_providing_analysis_reasons', () => {
    test('should_include_reasons_for_code_detection', () => {
      const analysis = analyzeCodeVsNaturalLanguage('package.json', {});

      expect(analysis.reasons.length).toBeGreaterThan(0);
      expect(analysis.reasons.some(r => r.includes('code'))).toBe(true);
    });

    test('should_include_reasons_for_natural_language_detection', () => {
      const analysis = analyzeCodeVsNaturalLanguage('the', {});

      expect(analysis.reasons.length).toBeGreaterThan(0);
      expect(analysis.reasons.some(r => r.includes('English'))).toBe(true);
    });
  });
});
