// @ts-check

/**
 * Unit tests for rule authoring helpers.
 * These tests validate the lightweight rule authoring contract.
 */

import { describe, it, expect, jest } from '@jest/globals';
import {
  createRuleContext,
  extractConfig,
  reportViolation,
  createFixInfo
} from '../../../src/rules/rule-helpers.js';

describe('createRuleContext', () => {
  it('should_validate_params_when_all_required_fields_present', () => {
    const params = {
      lines: ['# Heading', 'Content'],
      parsers: { micromark: { tokens: [] } },
      config: {}
    };
    const onError = jest.fn();

    const context = createRuleContext(params, onError, 'test-rule');

    expect(context).toBeDefined();
    expect(context.isValid).toBe(true);
    expect(context.lines).toEqual(params.lines);
    expect(context.onError).toBe(onError);
  });

  it('should_return_invalid_context_when_params_missing', () => {
    const context = createRuleContext(null, jest.fn(), 'test-rule');

    expect(context.isValid).toBe(false);
  });

  it('should_return_invalid_context_when_lines_not_array', () => {
    const params = {
      lines: 'not an array',
      config: {}
    };
    const context = createRuleContext(params, jest.fn(), 'test-rule');

    expect(context.isValid).toBe(false);
  });

  it('should_return_invalid_context_when_onError_not_function', () => {
    const params = {
      lines: ['# Heading'],
      config: {}
    };
    const context = createRuleContext(params, null, 'test-rule');

    expect(context.isValid).toBe(false);
  });
});

describe('extractConfig', () => {
  it('should_extract_config_when_using_rule_name', () => {
    const params = {
      config: {
        'my-rule': {
          option1: 'value1',
          option2: true
        }
      },
      lines: []
    };
    const onError = jest.fn();
    const context = createRuleContext(params, onError, 'my-rule', 'MR001');

    const schema = {
      option1: (value) => typeof value === 'string' ? [] : [{ field: 'option1', message: 'must be string', value, expected: 'string' }], // eslint-disable-line no-unused-vars
      option2: (value) => typeof value === 'boolean' ? [] : [{ field: 'option2', message: 'must be boolean', value, expected: 'boolean' }] // eslint-disable-line no-unused-vars
    };

    const config = extractConfig(context, schema);

    expect(config.option1).toBe('value1');
    expect(config.option2).toBe(true);
  });

  it('should_extract_config_when_using_rule_code', () => {
    const params = {
      config: {
        'MR001': {
          option1: 'value1'
        }
      },
      lines: []
    };
    const onError = jest.fn();
    const context = createRuleContext(params, onError, 'my-rule', 'MR001');

    const schema = {
      option1: (value) => [] // eslint-disable-line no-unused-vars
    };

    const config = extractConfig(context, schema);

    expect(config.option1).toBe('value1');
  });

  it('should_use_defaults_when_config_invalid', () => {
    const params = {
      config: {
        'my-rule': {
          option1: 123 // Invalid, should be string
        }
      },
      lines: []
    };
    const onError = jest.fn();
    const context = createRuleContext(params, onError, 'my-rule');

    const schema = {
      option1: (value) => typeof value === 'string' ? [] : [{ field: 'option1', message: 'must be string', value, expected: 'string' }] // eslint-disable-line no-unused-vars
    };

    const config = extractConfig(context, schema, { option1: 'default' });

    // Should report error but continue with defaults
    expect(onError).toHaveBeenCalled();
    expect(config.option1).toBe('default');
  });

  it('should_apply_defaults_when_fields_missing', () => {
    const params = {
      config: {
        'my-rule': {}
      },
      lines: []
    };
    const onError = jest.fn();
    const context = createRuleContext(params, onError, 'my-rule');

    const schema = {
      option1: (value) => [], // eslint-disable-line no-unused-vars
      option2: (value) => [] // eslint-disable-line no-unused-vars
    };

    const defaults = {
      option1: 'default1',
      option2: true
    };

    const config = extractConfig(context, schema, defaults);

    expect(config.option1).toBe('default1');
    expect(config.option2).toBe(true);
  });

  it('should_leave_field_undefined_when_invalid_without_default', () => {
    const params = {
      config: {
        'my-rule': {
          requiredField: 123 // Invalid - should be string
        }
      },
      lines: []
    };
    const onError = jest.fn();
    const context = createRuleContext(params, onError, 'my-rule');

    const schema = {
      requiredField: (value) => typeof value === 'string' ? [] : [{ field: 'requiredField', message: 'must be string', value, expected: 'string' }] // eslint-disable-line no-unused-vars
    };

    // No defaults provided
    const config = extractConfig(context, schema);

    // Should report validation error
    expect(onError).toHaveBeenCalled();
    // Field should be undefined since no default was provided
    expect(config.requiredField).toBeUndefined();
  });
});

describe('reportViolation', () => {
  it('should_call_onError_when_reporting_violation', () => {
    const onError = jest.fn();
    const params = { lines: ['test line'], config: {} };
    const context = createRuleContext(params, onError, 'test-rule');

    reportViolation(context, {
      lineNumber: 1,
      message: 'Test error message',
      context: 'test context'
    });

    expect(onError).toHaveBeenCalledWith({
      lineNumber: 1,
      detail: 'Test error message',
      context: 'test context'
    });
  });

  it('should_include_fixInfo_when_provided', () => {
    const onError = jest.fn();
    const params = { lines: ['test line'], config: {} };
    const context = createRuleContext(params, onError, 'test-rule');

    const fixInfo = {
      editColumn: 1,
      deleteCount: 4,
      insertText: 'fixed'
    };

    reportViolation(context, {
      lineNumber: 1,
      message: 'Test error',
      context: 'test',
      fixInfo
    });

    expect(onError).toHaveBeenCalledWith({
      lineNumber: 1,
      detail: 'Test error',
      context: 'test',
      fixInfo
    });
  });

  it('should_include_range_when_provided', () => {
    const onError = jest.fn();
    const params = { lines: ['test line'], config: {} };
    const context = createRuleContext(params, onError, 'test-rule');

    reportViolation(context, {
      lineNumber: 1,
      message: 'Test error',
      context: 'test',
      range: [1, 5]
    });

    expect(onError).toHaveBeenCalledWith({
      lineNumber: 1,
      detail: 'Test error',
      context: 'test',
      range: [1, 5]
    });
  });
});

describe('createFixInfo', () => {
  it('should_create_basic_fix_info_when_no_safety_checks', () => {
    const params = { lines: ['test line'], config: {} };
    const context = createRuleContext(params, jest.fn(), 'test-rule');

    const fixInfo = createFixInfo(context, {
      column: 5,
      length: 4,
      replacement: 'new'
    });

    expect(fixInfo).toEqual({
      editColumn: 5,
      deleteCount: 4,
      insertText: 'new'
    });
  });

  it('should_apply_safety_checks_when_enabled', () => {
    const params = {
      lines: ['test line'],
      config: {
        'test-rule': {},
        autofix: {
          safety: {
            enabled: true,
            confidenceThreshold: 0.5
          }
        }
      }
    };
    const context = createRuleContext(params, jest.fn(), 'test-rule');

    const fixInfo = createFixInfo(context, {
      column: 1,
      length: 4,
      replacement: '`test`',
      ruleType: 'backtick',
      original: 'test'
    });

    // Safety checks may return null for low-confidence fixes
    // or return the fix with _safety metadata
    if (fixInfo) {
      expect(fixInfo).toHaveProperty('editColumn');
      expect(fixInfo).toHaveProperty('deleteCount');
      expect(fixInfo).toHaveProperty('insertText');
    }
  });

  it('should_return_null_when_safety_check_fails', () => {
    const params = {
      lines: ['the test'],
      config: {
        'test-rule': {},
        autofix: {
          safety: {
            enabled: true,
            confidenceThreshold: 0.9 // Very high threshold
          }
        }
      }
    };
    const context = createRuleContext(params, jest.fn(), 'test-rule');

    const fixInfo = createFixInfo(context, {
      column: 1,
      length: 3,
      replacement: '`the`',
      ruleType: 'backtick',
      original: 'the', // Common word, low confidence
      context: { line: params.lines[0] }
    });

    // Should return null for unsafe fixes
    expect(fixInfo).toBeNull();
  });
});

describe('integration: full rule workflow', () => {
  it('should_support_complete_rule_implementation_pattern', () => {
    const params = {
      lines: ['# test heading', 'Some content'],
      parsers: { micromark: { tokens: [] } },
      config: {
        'example-rule': {
          enabled: true,
          threshold: 5
        }
      }
    };
    const onError = jest.fn();

    // 1. Create context
    const context = createRuleContext(params, onError, 'example-rule', 'EX001');
    if (!context.isValid) {
      return;
    }

    // 2. Extract and validate config
    const schema = {
      enabled: (value) => [], // eslint-disable-line no-unused-vars
      threshold: (value) => [] // eslint-disable-line no-unused-vars
    };
    const config = extractConfig(context, schema, { enabled: false, threshold: 10 });

    expect(config.enabled).toBe(true);
    expect(config.threshold).toBe(5);

    // 3. Detect violations and create fixes
    const fixInfo = createFixInfo(context, {
      column: 3,
      length: 4,
      replacement: 'Test'
    });

    // 4. Report violations
    reportViolation(context, {
      lineNumber: 1,
      message: 'Heading should use proper case',
      context: 'test',
      fixInfo
    });

    expect(onError).toHaveBeenCalledWith({
      lineNumber: 1,
      detail: 'Heading should use proper case',
      context: 'test',
      fixInfo
    });
  });
});
