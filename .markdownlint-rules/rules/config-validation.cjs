"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.formatValidationErrors = formatValidationErrors;
exports.logValidationErrors = logValidationErrors;
exports.validateBoolean = validateBoolean;
exports.validateConfig = validateConfig;
exports.validateNonNegativeNumber = validateNonNegativeNumber;
exports.validateStringArray = validateStringArray;
// @ts-check

/**
 * @fileoverview Configuration validation utilities for markdownlint-trap rules.
 * Provides a centralized system for validating user configuration options
 * with clear error messages and helpful guidance.
 */

/**
 * @typedef {Object} ValidationError
 * @property {string} field - The configuration field that failed validation
 * @property {string} message - Human-readable error message
 * @property {any} value - The invalid value that caused the error
 * @property {string} expected - Description of what was expected
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether the configuration is valid
 * @property {ValidationError[]} errors - Array of validation errors (empty if valid)
 */

/**
 * Validates that a value is an array of strings.
 * @param {any} value - The value to validate
 * @param {string} fieldName - Name of the configuration field
 * @returns {ValidationError[]} Array of validation errors (empty if valid)
 */
function validateStringArray(value, fieldName) {
  const errors = [];
  if (value === undefined || value === null) {
    return errors; // Allow undefined/null values (optional fields)
  }
  if (!Array.isArray(value)) {
    errors.push({
      field: fieldName,
      message: `${fieldName} must be an array of strings`,
      value: value,
      expected: 'array of strings'
    });
    return errors;
  }
  for (let i = 0; i < value.length; i++) {
    const item = value[i];
    if (typeof item !== 'string') {
      errors.push({
        field: `${fieldName}[${i}]`,
        message: `${fieldName}[${i}] must be a string, got ${typeof item}`,
        value: item,
        expected: 'string'
      });
    } else if (item.trim() === '') {
      errors.push({
        field: `${fieldName}[${i}]`,
        message: `${fieldName}[${i}] cannot be empty or whitespace-only`,
        value: item,
        expected: 'non-empty string'
      });
    }
  }
  return errors;
}

/**
 * Validates that a value is a boolean.
 * @param {any} value - The value to validate
 * @param {string} fieldName - Name of the configuration field
 * @returns {ValidationError[]} Array of validation errors (empty if valid)
 */
function validateBoolean(value, fieldName) {
  const errors = [];
  if (value === undefined || value === null) {
    return errors; // Allow undefined/null values (optional fields)
  }
  if (typeof value !== 'boolean') {
    errors.push({
      field: fieldName,
      message: `${fieldName} must be a boolean (true or false)`,
      value: value,
      expected: 'boolean'
    });
  }
  return errors;
}

/**
 * Validates that a value is a non-negative number.
 * @param {any} value - The value to validate
 * @param {string} fieldName - Name of the configuration field
 * @returns {ValidationError[]} Array of validation errors (empty if valid)
 */
function validateNonNegativeNumber(value, fieldName) {
  const errors = [];
  if (value === undefined || value === null) {
    return errors; // Allow undefined/null values (optional fields)
  }
  if (typeof value !== 'number' || isNaN(value)) {
    errors.push({
      field: fieldName,
      message: `${fieldName} must be a number`,
      value: value,
      expected: 'number'
    });
    return errors;
  }
  if (value < 0) {
    errors.push({
      field: fieldName,
      message: `${fieldName} must be non-negative`,
      value: value,
      expected: 'non-negative number'
    });
  }
  return errors;
}

/**
 * Formats validation errors into a user-friendly message.
 * @param {string} ruleName - Name of the rule being configured
 * @param {ValidationError[]} errors - Array of validation errors
 * @returns {string} Formatted error message
 */
function formatValidationErrors(ruleName, errors) {
  if (errors.length === 0) {
    return '';
  }
  const errorLines = errors.map(error => `  - ${error.field}: ${error.message}`);
  return `Configuration validation failed for rule "${ruleName}":\n${errorLines.join('\n')}\n\nPlease check your .markdownlint.jsonc or configuration file.`;
}

/**
 * Validates a complete configuration object against a schema.
 * @param {Object} config - The configuration object to validate
 * @param {Object} schema - Validation schema with field validators
 * @param {string} ruleName - Name of the rule being configured
 * @returns {ValidationResult} Validation result with errors if any
 */
function validateConfig(config, schema, ruleName) {
  const allErrors = [];
  if (!config || typeof config !== 'object') {
    return {
      isValid: true,
      errors: []
    }; // Allow empty/null config
  }

  // Validate known fields
  for (const [fieldName, validator] of Object.entries(schema)) {
    const fieldValue = config[fieldName];
    const fieldErrors = validator(fieldValue, fieldName);
    allErrors.push(...fieldErrors);
  }

  // Check for unknown fields and warn about them
  const knownFields = new Set(Object.keys(schema));
  for (const fieldName of Object.keys(config)) {
    if (!knownFields.has(fieldName)) {
      allErrors.push({
        field: fieldName,
        message: `Unknown configuration option "${fieldName}" for rule "${ruleName}"`,
        value: config[fieldName],
        expected: `one of: ${Array.from(knownFields).join(', ')}`
      });
    }
  }
  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  };
}

/**
 * Logs validation errors using the rule's logger or console if available.
 * @param {string} ruleName - Name of the rule
 * @param {ValidationError[]} errors - Validation errors to log
 * @param {Function} [logger] - Optional logger function
 */
function logValidationErrors(ruleName, errors, logger) {
  if (errors.length === 0) {
    return;
  }
  const errorMessage = formatValidationErrors(ruleName, errors);
  if (logger && typeof logger === 'function') {
    logger(errorMessage);
  } else if (typeof console !== 'undefined' && console.error) {
    console.error(errorMessage);
  }
}