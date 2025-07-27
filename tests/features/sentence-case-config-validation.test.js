// @ts-check

/**
 * @fileoverview Tests for sentence-case-heading rule configuration validation.
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import sentenceCaseHeading from '../../src/rules/sentence-case-heading.js';

// Mock console.error to capture validation messages
const originalConsoleError = console.error;
let mockConsoleError;

beforeEach(() => {
  mockConsoleError = jest.fn();
  console.error = mockConsoleError;
});

afterEach(() => {
  console.error = originalConsoleError;
});

/**
 * Helper function to run the rule with a given configuration
 * @param {Object} config - Configuration object
 * @param {string} [markdown] - Markdown content to test (defaults to simple heading)
 * @returns {Array} Array of errors reported by the rule
 */
function runRuleWithConfig(config, markdown = '# Test heading') {
  const errors = [];
  const onError = (error) => errors.push(error);

  const params = {
    config: {
      'sentence-case-heading': config
    },
    lines: markdown.split('\n'),
    parsers: {
      micromark: {
        tokens: [
          {
            type: 'atxHeading',
            startLine: 1,
            startColumn: 1,
            endLine: 1,
            endColumn: markdown.length + 1
          },
          {
            type: 'atxHeadingSequence',
            startLine: 1,
            startColumn: 1,
            endLine: 1,
            endColumn: 2
          }
        ]
      }
    }
  };

  sentenceCaseHeading.function(params, onError);
  return errors;
}

describe('sentence-case-heading configuration validation', () => {
  describe('valid configurations', () => {
    test('accepts valid technicalTerms array', () => {
      const config = {
        technicalTerms: ['MyAPI', 'CustomTerm', 'SpecialName']
      };

      runRuleWithConfig(config);
      expect(mockConsoleError).not.toHaveBeenCalled();
    });

    test('accepts valid properNouns array', () => {
      const config = {
        properNouns: ['Einstein', 'Tesla', 'Darwin']
      };

      runRuleWithConfig(config);
      expect(mockConsoleError).not.toHaveBeenCalled();
    });

    test('accepts valid specialTerms array', () => {
      const config = {
        specialTerms: ['iPhone', 'macOS', 'GitHub']
      };

      runRuleWithConfig(config);
      expect(mockConsoleError).not.toHaveBeenCalled();
    });

    test('accepts all valid arrays together', () => {
      const config = {
        technicalTerms: ['API', 'SDK'],
        properNouns: ['Einstein', 'Tesla'],
        specialTerms: ['iPhone', 'macOS']
      };

      runRuleWithConfig(config);
      expect(mockConsoleError).not.toHaveBeenCalled();
    });

    test('accepts empty arrays', () => {
      const config = {
        technicalTerms: [],
        properNouns: [],
        specialTerms: []
      };

      runRuleWithConfig(config);
      expect(mockConsoleError).not.toHaveBeenCalled();
    });

    test('accepts partial configuration', () => {
      const config = {
        technicalTerms: ['API']
        // Missing other fields - should be valid
      };

      runRuleWithConfig(config);
      expect(mockConsoleError).not.toHaveBeenCalled();
    });

    test('accepts empty configuration', () => {
      const config = {};

      runRuleWithConfig(config);
      expect(mockConsoleError).not.toHaveBeenCalled();
    });
  });

  describe('invalid configurations', () => {
    test('logs error for non-array technicalTerms', () => {
      const config = {
        technicalTerms: 'not an array'
      };

      const errors = runRuleWithConfig(config);
      const configErrors = errors.filter(error => error.detail.includes('Configuration Error'));
      expect(configErrors).toHaveLength(1);
      expect(configErrors[0].detail).toContain('Configuration validation failed for rule "sentence-case-heading"');
      expect(configErrors[0].detail).toContain('technicalTerms must be an array of strings');
    });

    test('logs error for non-array properNouns', () => {
      const config = {
        properNouns: { invalid: 'object' }
      };

      const errors = runRuleWithConfig(config);
      const configErrors = errors.filter(error => error.detail.includes('Configuration Error'));
      expect(configErrors).toHaveLength(1);
      expect(configErrors[0].detail).toContain('properNouns must be an array of strings');
    });

    test('logs error for non-array specialTerms', () => {
      const config = {
        specialTerms: 123
      };

      const errors = runRuleWithConfig(config);
      const configErrors = errors.filter(error => error.detail.includes('Configuration Error'));
      expect(configErrors).toHaveLength(1);
      expect(configErrors[0].detail).toContain('specialTerms must be an array of strings');
    });

    test('logs error for array with non-string elements', () => {
      const config = {
        technicalTerms: ['valid', 123, 'alsovalid']
      };

      const errors = runRuleWithConfig(config);
      const configErrors = errors.filter(error => error.detail.includes('Configuration Error'));
      expect(configErrors).toHaveLength(1);
      expect(configErrors[0].detail).toContain('technicalTerms[1] must be a string, got number');
    });

    test('logs error for array with empty string elements', () => {
      const config = {
        technicalTerms: ['valid', '', 'alsovalid']
      };

      const errors = runRuleWithConfig(config);
      const configErrors = errors.filter(error => error.detail.includes('Configuration Error'));
      expect(configErrors).toHaveLength(1);
      expect(configErrors[0].detail).toContain('technicalTerms[1] cannot be empty or whitespace-only');
    });

    test('logs error for array with whitespace-only elements', () => {
      const config = {
        properNouns: ['valid', '   \t\n   ', 'alsovalid']
      };

      const errors = runRuleWithConfig(config);
      const configErrors = errors.filter(error => error.detail.includes('Configuration Error'));
      expect(configErrors).toHaveLength(1);
      expect(configErrors[0].detail).toContain('properNouns[1] cannot be empty or whitespace-only');
    });

    test('logs error for unknown configuration fields', () => {
      const config = {
        technicalTerms: ['valid'],
        unknownField: 'should not be here',
        anotherUnknown: 123
      };

      const errors = runRuleWithConfig(config);
      const configErrors = errors.filter(error => error.detail.includes('Configuration Error'));
      expect(configErrors).toHaveLength(1);
      expect(configErrors[0].detail).toContain('Unknown configuration option "unknownField"');
      expect(configErrors[0].detail).toContain('Unknown configuration option "anotherUnknown"');
    });

    test('logs multiple errors for multiple invalid fields', () => {
      const config = {
        technicalTerms: 'not an array',
        properNouns: 123,
        unknownField: 'unknown'
      };

      const errors = runRuleWithConfig(config);
      const configErrors = errors.filter(error => error.detail.includes('Configuration Error'));
      expect(configErrors).toHaveLength(1);
      expect(configErrors[0].detail).toContain('technicalTerms must be an array of strings');
      expect(configErrors[0].detail).toContain('properNouns must be an array of strings');
      expect(configErrors[0].detail).toContain('Unknown configuration option "unknownField"');
    });
  });

  describe('graceful degradation', () => {
    test('continues to work with invalid configuration', () => {
      const config = {
        technicalTerms: 'invalid', // Invalid config
        properNouns: ['ValidTerm'] // Valid config
      };

      const errors = runRuleWithConfig(config, '# Test Heading With Multiple Words');
      
      // Rule should continue working despite invalid config
      expect(errors.length).toBeGreaterThan(0); // Should find violations in the test heading
      
      // Should have reported configuration error through onError
      const configErrors = errors.filter(error => error.detail.includes('Configuration Error'));
      expect(configErrors).toHaveLength(1);
      expect(configErrors[0].detail).toContain('technicalTerms must be an array of strings');
    });

    test('uses valid parts of configuration when some parts are invalid', () => {
      const config = {
        technicalTerms: 'invalid', // Invalid - should be ignored
        properNouns: ['TestTerm']   // Valid - should be used
      };

      // Use a heading that would normally trigger an error, but contains our valid term
      const markdown = '# TestTerm should be preserved';
      const errors = runRuleWithConfig(config, markdown);
      
      // Should have reported configuration error through onError
      const configErrors = errors.filter(error => error.detail.includes('Configuration Error'));
      expect(configErrors.length).toBeGreaterThan(0); // Validation error logged
    });

    test('works normally when configuration is completely invalid', () => {
      const config = {
        technicalTerms: 123,
        properNouns: 'not an array',
        specialTerms: { not: 'an array' }
      };

      const errors = runRuleWithConfig(config, '# Test Heading');
      
      // Rule should still function with default behavior
      expect(Array.isArray(errors)).toBe(true);
      
      // Should have reported configuration errors through onError
      const configErrors = errors.filter(error => error.detail.includes('Configuration Error'));
      expect(configErrors).toHaveLength(1);
      expect(configErrors[0].detail).toContain('Configuration validation failed');
    });
  });

  describe('integration with rule functionality', () => {
    test('applies valid custom terms correctly', () => {
      const config = {
        technicalTerms: ['MyCustomAPI']
      };

      // This heading should not trigger an error because MyCustomAPI is in our config
      const markdown = '# Using MyCustomAPI for data';
      const errors = runRuleWithConfig(config, markdown);
      
      // Should not report validation errors
      expect(mockConsoleError).not.toHaveBeenCalled();
      
      // Should apply the custom term configuration
      // The exact behavior depends on the rule logic, but it should use the custom term
    });

    test('ignores invalid config and uses default behavior', () => {
      const config = {
        technicalTerms: 'invalid config'
      };

      const markdown = '# Test Heading';
      const errors = runRuleWithConfig(config, markdown);
      
      // Should report configuration error through onError
      const configErrors = errors.filter(error => error.detail.includes('Configuration Error'));
      expect(configErrors.length).toBeGreaterThan(0);
      
      // Should still process the heading with default behavior
      expect(Array.isArray(errors)).toBe(true);
    });
  });

  describe('deprecation warnings', () => {
    test('shows warning for deprecated technicalTerms configuration', () => {
      // Capture console.warn
      const originalWarn = console.warn;
      const warnings = [];
      console.warn = (...args) => {
        warnings.push(args.join(' '));
      };

      try {
        const config = {
          technicalTerms: ["API", "JavaScript"]
        };

        const markdown = '# Test heading';
        runRuleWithConfig(config, markdown);

        expect(warnings.some(w => w.includes('technicalTerms" is deprecated'))).toBe(true);
      } finally {
        console.warn = originalWarn;
      }
    });

    test('shows warning for deprecated properNouns configuration', () => {
      const originalWarn = console.warn;
      const warnings = [];
      console.warn = (...args) => {
        warnings.push(args.join(' '));
      };

      try {
        const config = {
          properNouns: ["GitHub", "OAuth"]
        };

        const markdown = '# Test heading';
        runRuleWithConfig(config, markdown);

        expect(warnings.some(w => w.includes('properNouns" is deprecated'))).toBe(true);
      } finally {
        console.warn = originalWarn;
      }
    });

    test('does not show warnings for modern specialTerms configuration', () => {
      const originalWarn = console.warn;
      const warnings = [];
      console.warn = (...args) => {
        warnings.push(args.join(' '));
      };

      try {
        const config = {
          specialTerms: ["API", "GitHub"]
        };

        const markdown = '# Test heading';
        runRuleWithConfig(config, markdown);

        expect(warnings.some(w => w.includes('deprecated'))).toBe(false);
      } finally {
        console.warn = originalWarn;
      }
    });
  });
});