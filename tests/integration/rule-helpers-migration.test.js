// @ts-check

/**
 * Integration tests for rule-helpers migration.
 * Demonstrates migrating existing rules to use the new helpers contract.
 */

import { describe, it, expect } from '@jest/globals';
import { lint } from 'markdownlint/promise';
import {
  createRuleContext,
  extractConfig,
  reportViolation,
  createFixInfo
} from '../../src/rules/rule-helpers.js';
import {
  validateStringArray,
  validateBoolean
} from '../../src/rules/config-validation.js';

/**
 * Shared example rule that uses the new helpers contract.
 * This demonstrates the simplified pattern for new rules.
 * Extracted as a shared constant to avoid duplication across test suites.
 */
const exampleRuleWithHelpers = {
  names: ['example-rule', 'EX001'],
  description: 'Example rule using helpers contract',
  tags: ['test'],
  parser: 'micromark',
  function: (params, onError) => {
    // 1. Create context with validation
    const context = createRuleContext(params, onError, 'example-rule', 'EX001');
    if (!context.isValid) return;

    // 2. Extract and validate config
    const schema = {
      ignoredWords: validateStringArray,
      caseSensitive: validateBoolean
    };
    const config = extractConfig(context, schema, {
      ignoredWords: [],
      caseSensitive: false
    });

    // 3. Process lines and detect violations
    context.lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // Skip headings
      if (/^#+\s/.test(line)) {
        return;
      }

      // Find uppercase words
      const uppercasePattern = /\b[A-Z]{2,}\b/g;
      let match;

      while ((match = uppercasePattern.exec(line)) !== null) {
        const word = match[0];

        // Skip ignored words
        if (config.ignoredWords.includes(word)) {
          continue;
        }

        // 4. Create fix info
        const fixInfo = createFixInfo(context, {
          column: match.index + 1,
          length: word.length,
          replacement: word.toLowerCase()
        });

        // 5. Report violation
        reportViolation(context, {
          lineNumber,
          message: `Uppercase word "${word}" should be lowercase`,
          context: word,
          fixInfo,
          range: [match.index + 1, word.length]
        });
      }
    });
  }
};

describe('rule-helpers migration: example rule using helpers', () => {
  it('should_detect_violations_when_using_helpers_contract', async () => {
    const input = 'This line has UPPERCASE words in it.\n\nAPI should be ignored.';

    const result = await lint({
      strings: { content: input },
      config: {
        default: false,
        'example-rule': {
          ignoredWords: ['API'],
          caseSensitive: false
        }
      },
      customRules: [exampleRuleWithHelpers]
    });

    const errors = result.content;

    // Should detect UPPERCASE but not API (ignored)
    expect(errors).toHaveLength(1);
    expect(errors[0].ruleNames).toEqual(['example-rule', 'EX001']);
    expect(errors[0].lineNumber).toBe(1);
    expect(errors[0].ruleDescription).toBe('Example rule using helpers contract');
  });

  it('should_apply_fixes_when_using_helpers_contract', async () => {
    const input = 'This line has UPPERCASE words.';

    const result = await lint({
      strings: { content: input },
      config: {
        default: false,
        'example-rule': {
          ignoredWords: [],
          caseSensitive: false
        }
      },
      customRules: [exampleRuleWithHelpers]
    });

    const errors = result.content;

    expect(errors).toHaveLength(1);
    expect(errors[0].fixInfo).toBeDefined();
    expect(errors[0].fixInfo.editColumn).toBe(15);
    expect(errors[0].fixInfo.deleteCount).toBe(9); // "UPPERCASE"
    expect(errors[0].fixInfo.insertText).toBe('uppercase');
  });

  it('should_handle_invalid_config_when_using_helpers_contract', async () => {
    const input = 'This line has UPPERCASE words.';

    const result = await lint({
      strings: { content: input },
      config: {
        default: false,
        'example-rule': {
          ignoredWords: 'not-an-array', // Invalid
          caseSensitive: 'not-a-boolean' // Invalid
        }
      },
      customRules: [exampleRuleWithHelpers]
    });

    const errors = result.content;

    // Should report config errors AND continue with defaults
    expect(errors.length).toBeGreaterThan(0);

    // Should have detected the uppercase word (with default config)
    const violationErrors = errors.filter(e => !e.ruleDescription.includes('Configuration Error'));
    expect(violationErrors.length).toBeGreaterThan(0);
  });

  it('should_use_defaults_when_config_missing', async () => {
    const input = 'This line has UPPERCASE words.';

    const result = await lint({
      strings: { content: input },
      config: {
        default: false,
        'example-rule': {} // Empty config
      },
      customRules: [exampleRuleWithHelpers]
    });

    const errors = result.content;

    // Should work with defaults
    expect(errors).toHaveLength(1);
    expect(errors[0].lineNumber).toBe(1);
  });
});

describe('rule-helpers migration: comparison with legacy pattern', () => {
  /**
   * Legacy rule pattern (without helpers).
   * This shows the old boilerplate-heavy approach.
   */
  const legacyRuleWithoutHelpers = {
    names: ['legacy-rule', 'LG001'],
    description: 'Legacy rule without helpers',
    tags: ['test'],
    parser: 'micromark',
    function: (params, onError) => {
      // Legacy: Manual parameter validation
      if (!params || !Array.isArray(params.lines) || typeof onError !== 'function') {
        return;
      }

      // Legacy: Manual config extraction
      const config = params.config?.['legacy-rule'] || params.config?.LG001 || {};

      // Legacy: Manual validation (often skipped or inconsistent)
      const ignoredWords = Array.isArray(config.ignoredWords) ? config.ignoredWords : [];
      // caseSensitive not used in this simple example
      // const caseSensitive = typeof config.caseSensitive === 'boolean' ? config.caseSensitive : false;

      // Legacy: Same business logic
      params.lines.forEach((line, index) => {
        const lineNumber = index + 1;
        if (/^#+\s/.test(line)) return;

        const uppercasePattern = /\b[A-Z]{2,}\b/g;
        let match;
        
        while ((match = uppercasePattern.exec(line)) !== null) {
          const word = match[0];
          if (ignoredWords.includes(word)) continue;

          // Legacy: Manual fix info creation
          const fixInfo = {
            editColumn: match.index + 1,
            deleteCount: word.length,
            insertText: word.toLowerCase()
          };

          // Legacy: Manual error reporting
          onError({
            lineNumber,
            detail: `Uppercase word "${word}" should be lowercase`,
            context: word,
            fixInfo,
            range: [match.index + 1, word.length]
          });
        }
      });
    }
  };

  it('should_produce_same_results_with_and_without_helpers', async () => {
    const input = 'This line has UPPERCASE words.';
    const configObj = {
      ignoredWords: [],
      caseSensitive: false
    };

    const legacyResult = await lint({
      strings: { content: input },
      config: {
        default: false,
        'legacy-rule': configObj
      },
      customRules: [legacyRuleWithoutHelpers]
    });

    // Use the shared example rule (extracted to top of file to avoid duplication)
    const helpersResult = await lint({
      strings: { content: input },
      config: {
        default: false,
        'example-rule': configObj
      },
      customRules: [exampleRuleWithHelpers]
    });

    // Both approaches should produce the same results
    expect(legacyResult.content).toHaveLength(1);
    expect(helpersResult.content).toHaveLength(1);
    
    expect(legacyResult.content[0].lineNumber).toBe(helpersResult.content[0].lineNumber);
    expect(legacyResult.content[0].fixInfo).toEqual(helpersResult.content[0].fixInfo);
  });
});
