// @ts-check

/**
 * @fileoverview Lightweight rule authoring contract with typed helpers.
 * Provides standardized config validation, logging, and fix application utilities.
 * 
 * This module eliminates boilerplate copy-paste across rules by providing:
 * - Config validation with type definitions
 * - Logging helpers integrated with markdownlint
 * - Fix application utilities with safety checks
 * - Typed helpers for IDE autocomplete
 */

import {
  validateConfig,
  logValidationErrors,
  createMarkdownlintLogger
} from './config-validation.js';
import { createSafeFixInfo } from './autofix-safety.js';

/**
 * @typedef {Object} RuleContext
 * @property {boolean} isValid - Whether the context is valid for rule execution
 * @property {string[]} lines - Source lines from the document
 * @property {Object} tokens - Parsed tokens (if available)
 * @property {Object} config - Raw configuration object
 * @property {Function} onError - Error reporting callback
 * @property {string} ruleName - Name of the rule
 * @property {string} [ruleCode] - Optional rule code (e.g., 'SC001')
 * @property {Function} logger - Logger function for the rule
 * @property {Object} params - Original params object for advanced use
 */

/**
 * @typedef {Object} ViolationReport
 * @property {number} lineNumber - Line number where the violation occurs
 * @property {string} message - Description of the violation
 * @property {string} context - Context text for the violation
 * @property {Object} [fixInfo] - Optional fix information
 * @property {number[]} [range] - Optional range [column, length]
 */

/**
 * @typedef {Object} FixOptions
 * @property {number} column - Column position (1-based)
 * @property {number} length - Number of characters to replace
 * @property {string} replacement - Text to insert
 * @property {string} [ruleType] - Type of rule for safety checks (e.g., 'backtick', 'sentence-case')
 * @property {string} [original] - Original text being fixed
 * @property {Object} [context] - Additional context for safety checks
 */

/**
 * Create a rule context with validation and standard setup.
 * This is the entry point for all rules using the helpers contract.
 * 
 * @param {Object} params - markdownlint params object
 * @param {Function} onError - markdownlint error callback
 * @param {string} ruleName - Name of the rule (e.g., 'sentence-case-heading')
 * @param {string} [ruleCode] - Optional rule code (e.g., 'SC001')
 * @returns {RuleContext} Context object with validation status
 * 
 * @example
 * function myRule(params, onError) {
 *   const context = createRuleContext(params, onError, 'my-rule', 'MR001');
 *   if (!context.isValid) return;
 *   // ... rule implementation
 * }
 */
export function createRuleContext(params, onError, ruleName, ruleCode = null) {
  // Validate required parameters
  if (!params || !Array.isArray(params.lines) || typeof onError !== 'function') {
    return {
      isValid: false,
      lines: [],
      tokens: null,
      config: {},
      onError: () => {},
      ruleName,
      ruleCode,
      logger: () => {},
      params: null
    };
  }

  // Extract tokens if available (for micromark parser)
  const tokens = params.parsers?.micromark?.tokens || null;

  // Create logger integrated with markdownlint
  const logger = createMarkdownlintLogger(onError, ruleName);

  return {
    isValid: true,
    lines: params.lines,
    tokens,
    config: params.config || {},
    onError,
    ruleName,
    ruleCode,
    logger,
    params
  };
}

/**
 * Extract and validate rule configuration with defaults.
 * Handles config extraction from multiple locations and applies validation.
 * 
 * @param {RuleContext} context - Rule context from createRuleContext
 * @param {Object} schema - Validation schema with field validators
 * @param {Object} [defaults={}] - Default values for configuration fields
 * @returns {Object} Validated configuration with defaults applied
 * 
 * @example
 * const schema = {
 *   ignoredTerms: validateStringArray,
 *   skipCodeBlocks: validateBoolean
 * };
 * const config = extractConfig(context, schema, {
 *   ignoredTerms: [],
 *   skipCodeBlocks: true
 * });
 */
export function extractConfig(context, schema, defaults = {}) {
  if (!context.isValid) {
    return defaults;
  }

  // Extract config from multiple possible locations
  // Support both nested config (from .markdownlint-cli2.jsonc) and direct config (from lint API)
  const rawConfig =
    context.config?.[context.ruleName] ||
    (context.ruleCode && context.config?.[context.ruleCode]) ||
    context.config ||
    {};

  // Single validation pass - collect errors for each field
  const validationResult = validateConfig(rawConfig, schema, context.ruleName);

  // Build a map of field names to their validation errors for quick lookup
  const fieldErrors = new Map();
  for (const error of validationResult.errors) {
    if (!fieldErrors.has(error.field)) {
      fieldErrors.set(error.field, []);
    }
    fieldErrors.get(error.field).push(error);
  }

  if (!validationResult.isValid) {
    logValidationErrors(context.ruleName, validationResult.errors, context.logger);
    // Continue execution with defaults to prevent crashes
  }

  // Apply defaults for missing or invalid fields using validation results
  const finalConfig = { ...defaults };

  // Process all schema fields using cached validation results
  for (const fieldName of Object.keys(schema)) {
    const rawValue = rawConfig[fieldName];
    const defaultValue = defaults[fieldName];
    const hasErrors = fieldErrors.has(fieldName);

    // Use the provided value if valid, otherwise use default
    if (rawValue !== undefined && rawValue !== null) {
      if (!hasErrors) {
        // Value passed validation, use it
        finalConfig[fieldName] = rawValue;
      } else if (defaultValue !== undefined) {
        // Invalid value - use default if available
        finalConfig[fieldName] = defaultValue;
      }
      // else: Invalid value and no default - field will be undefined
    } else if (defaultValue !== undefined) {
      // Field is missing or null, use default if available
      finalConfig[fieldName] = defaultValue;
    }
    // else: No value and no default - field remains undefined (not in finalConfig)
  }

  return finalConfig;
}

/**
 * Report a rule violation with consistent formatting.
 * Simplifies onError calls and ensures consistent error structure.
 * 
 * @param {RuleContext} context - Rule context from createRuleContext
 * @param {ViolationReport} violation - Violation details
 * 
 * @example
 * reportViolation(context, {
 *   lineNumber: 5,
 *   message: 'Heading should use sentence case',
 *   context: 'This Is A Heading',
 *   fixInfo: createFixInfo(context, { ... })
 * });
 */
export function reportViolation(context, violation) {
  if (!context.isValid) {
    return;
  }

  const errorReport = {
    lineNumber: violation.lineNumber,
    detail: violation.message,
    context: violation.context
  };

  if (violation.fixInfo !== undefined) {
    errorReport.fixInfo = violation.fixInfo;
  }

  if (violation.range !== undefined) {
    errorReport.range = violation.range;
  }

  context.onError(errorReport);
}

/**
 * Create fix information with optional safety checks.
 * Handles both simple fixes and complex fixes with safety validation.
 * 
 * @param {RuleContext} context - Rule context from createRuleContext
 * @param {FixOptions} options - Fix options
 * @returns {Object|null} Fix info object or null if unsafe
 * 
 * @example
 * // Simple fix without safety checks
 * const fixInfo = createFixInfo(context, {
 *   column: 5,
 *   length: 4,
 *   replacement: 'new'
 * });
 * 
 * @example
 * // Fix with safety checks
 * const fixInfo = createFixInfo(context, {
 *   column: 1,
 *   length: 4,
 *   replacement: '`test`',
 *   ruleType: 'backtick',
 *   original: 'test',
 *   context: { line: 'This is a test line' }
 * });
 */
export function createFixInfo(context, options) {
  if (!context.isValid) {
    return null;
  }

  const basicFixInfo = {
    editColumn: options.column,
    deleteCount: options.length,
    insertText: options.replacement
  };

  // If no rule type specified, return basic fix without safety checks
  if (!options.ruleType) {
    return basicFixInfo;
  }

  // Apply safety checks if rule type and original text provided
  // Extract safety config if available; pass undefined to use createSafeFixInfo defaults
  const safetyConfig = context.config?.autofix?.safety;

  // Only pass safetyConfig if it has meaningful content, otherwise let defaults apply
  const configArg = safetyConfig && Object.keys(safetyConfig).length > 0 ? safetyConfig : undefined;

  return createSafeFixInfo(
    basicFixInfo,
    options.ruleType,
    options.original || '',
    options.replacement || '',
    options.context || {},
    configArg
  );
}
