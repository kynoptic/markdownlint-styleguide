// @ts-check

/**
 * @fileoverview Tests for configuration validation utilities.
 */

import { describe, test, expect, jest } from '@jest/globals';
import {
  validateStringArray,
  validateBoolean,
  validateNonNegativeNumber,
  validateConfig,
  formatValidationErrors,
  logValidationErrors
} from '../../src/rules/config-validation.js';

describe('Configuration validation utilities', () => {
  describe('validateStringArray', () => {
    test('accepts valid string arrays', () => {
      const errors = validateStringArray(['term1', 'term2', 'term3'], 'testField');
      expect(errors).toEqual([]);
    });

    test('accepts empty arrays', () => {
      const errors = validateStringArray([], 'testField');
      expect(errors).toEqual([]);
    });

    test('accepts undefined values', () => {
      const errors = validateStringArray(undefined, 'testField');
      expect(errors).toEqual([]);
    });

    test('accepts null values', () => {
      const errors = validateStringArray(null, 'testField');
      expect(errors).toEqual([]);
    });

    test('rejects non-array values', () => {
      const errors = validateStringArray('not an array', 'testField');
      expect(errors).toHaveLength(1);
      expect(errors[0]).toMatchObject({
        field: 'testField',
        message: 'testField must be an array of strings',
        expected: 'array of strings'
      });
    });

    test('rejects arrays with non-string elements', () => {
      const errors = validateStringArray(['valid', 123, 'alsovalid'], 'testField');
      expect(errors).toHaveLength(1);
      expect(errors[0]).toMatchObject({
        field: 'testField[1]',
        message: 'testField[1] must be a string, got number',
        expected: 'string'
      });
    });

    test('rejects arrays with empty string elements', () => {
      const errors = validateStringArray(['valid', '', 'alsovalid'], 'testField');
      expect(errors).toHaveLength(1);
      expect(errors[0]).toMatchObject({
        field: 'testField[1]',
        message: 'testField[1] cannot be empty or whitespace-only',
        expected: 'non-empty string'
      });
    });

    test('rejects arrays with whitespace-only elements', () => {
      const errors = validateStringArray(['valid', '   ', 'alsovalid'], 'testField');
      expect(errors).toHaveLength(1);
      expect(errors[0]).toMatchObject({
        field: 'testField[1]',
        message: 'testField[1] cannot be empty or whitespace-only',
        expected: 'non-empty string'
      });
    });

    test('reports multiple errors for multiple invalid elements', () => {
      const errors = validateStringArray(['valid', 123, '', 'alsovalid', null], 'testField');
      expect(errors).toHaveLength(3);
      expect(errors[0].field).toBe('testField[1]');
      expect(errors[1].field).toBe('testField[2]');
      expect(errors[2].field).toBe('testField[4]');
    });
  });

  describe('validateBoolean', () => {
    test('accepts true', () => {
      const errors = validateBoolean(true, 'testField');
      expect(errors).toEqual([]);
    });

    test('accepts false', () => {
      const errors = validateBoolean(false, 'testField');
      expect(errors).toEqual([]);
    });

    test('accepts undefined', () => {
      const errors = validateBoolean(undefined, 'testField');
      expect(errors).toEqual([]);
    });

    test('accepts null', () => {
      const errors = validateBoolean(null, 'testField');
      expect(errors).toEqual([]);
    });

    test('rejects non-boolean values', () => {
      const errors = validateBoolean('true', 'testField');
      expect(errors).toHaveLength(1);
      expect(errors[0]).toMatchObject({
        field: 'testField',
        message: 'testField must be a boolean (true or false)',
        expected: 'boolean'
      });
    });
  });

  describe('validateNonNegativeNumber', () => {
    test('accepts positive numbers', () => {
      const errors = validateNonNegativeNumber(42, 'testField');
      expect(errors).toEqual([]);
    });

    test('accepts zero', () => {
      const errors = validateNonNegativeNumber(0, 'testField');
      expect(errors).toEqual([]);
    });

    test('accepts decimal numbers', () => {
      const errors = validateNonNegativeNumber(3.14, 'testField');
      expect(errors).toEqual([]);
    });

    test('accepts undefined', () => {
      const errors = validateNonNegativeNumber(undefined, 'testField');
      expect(errors).toEqual([]);
    });

    test('accepts null', () => {
      const errors = validateNonNegativeNumber(null, 'testField');
      expect(errors).toEqual([]);
    });

    test('rejects negative numbers', () => {
      const errors = validateNonNegativeNumber(-5, 'testField');
      expect(errors).toHaveLength(1);
      expect(errors[0]).toMatchObject({
        field: 'testField',
        message: 'testField must be non-negative',
        expected: 'non-negative number'
      });
    });

    test('rejects non-number values', () => {
      const errors = validateNonNegativeNumber('42', 'testField');
      expect(errors).toHaveLength(1);
      expect(errors[0]).toMatchObject({
        field: 'testField',
        message: 'testField must be a number',
        expected: 'number'
      });
    });

    test('rejects NaN', () => {
      const errors = validateNonNegativeNumber(NaN, 'testField');
      expect(errors).toHaveLength(1);
      expect(errors[0]).toMatchObject({
        field: 'testField',
        message: 'testField must be a number',
        expected: 'number'
      });
    });
  });

  describe('validateConfig', () => {
    const schema = {
      stringArrayField: validateStringArray,
      booleanField: validateBoolean,
      numberField: validateNonNegativeNumber
    };

    test('validates valid configuration', () => {
      const config = {
        stringArrayField: ['term1', 'term2'],
        booleanField: true,
        numberField: 42
      };

      const result = validateConfig(config, schema, 'testRule');
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('accepts empty configuration', () => {
      const result = validateConfig({}, schema, 'testRule');
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('accepts null configuration', () => {
      const result = validateConfig(null, schema, 'testRule');
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('accepts undefined configuration', () => {
      const result = validateConfig(undefined, schema, 'testRule');
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('validates partial configuration', () => {
      const config = {
        stringArrayField: ['term1', 'term2']
        // Missing other fields - should be valid since they're optional
      };

      const result = validateConfig(config, schema, 'testRule');
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('reports errors for invalid fields', () => {
      const config = {
        stringArrayField: 'not an array',
        booleanField: 'not a boolean',
        numberField: -5
      };

      const result = validateConfig(config, schema, 'testRule');
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
    });

    test('reports errors for unknown fields', () => {
      const config = {
        stringArrayField: ['valid'],
        unknownField: 'should not be here',
        anotherUnknownField: 123
      };

      const result = validateConfig(config, schema, 'testRule');
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].field).toBe('unknownField');
      expect(result.errors[1].field).toBe('anotherUnknownField');
    });

    test('combines field validation errors and unknown field errors', () => {
      const config = {
        stringArrayField: 123, // Invalid type
        unknownField: 'unknown' // Unknown field
      };

      const result = validateConfig(config, schema, 'testRule');
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
    });
  });

  describe('formatValidationErrors', () => {
    test('returns empty string for no errors', () => {
      const formatted = formatValidationErrors('testRule', []);
      expect(formatted).toBe('');
    });

    test('formats single error correctly', () => {
      const errors = [{
        field: 'testField',
        message: 'must be an array',
        value: 'invalid',
        expected: 'array'
      }];

      const formatted = formatValidationErrors('testRule', errors);
      expect(formatted).toContain('Configuration validation failed for rule "testRule"');
      expect(formatted).toContain('  - testField: must be an array');
      expect(formatted).toContain('Please check your .markdownlint.jsonc');
    });

    test('formats multiple errors correctly', () => {
      const errors = [
        {
          field: 'field1',
          message: 'error message 1',
          value: 'value1',
          expected: 'expected1'
        },
        {
          field: 'field2',
          message: 'error message 2',
          value: 'value2',
          expected: 'expected2'
        }
      ];

      const formatted = formatValidationErrors('testRule', errors);
      expect(formatted).toContain('Configuration validation failed for rule "testRule"');
      expect(formatted).toContain('  - field1: error message 1');
      expect(formatted).toContain('  - field2: error message 2');
    });
  });

  describe('logValidationErrors', () => {
    test('does nothing for empty errors array', () => {
      const mockLogger = jest.fn();
      logValidationErrors('testRule', [], mockLogger);
      expect(mockLogger).not.toHaveBeenCalled();
    });

    test('calls provided logger with formatted message', () => {
      const mockLogger = jest.fn();
      const errors = [{
        field: 'testField',
        message: 'test error',
        value: 'value',
        expected: 'expected'
      }];

      logValidationErrors('testRule', errors, mockLogger);
      expect(mockLogger).toHaveBeenCalledWith(
        expect.stringContaining('Configuration validation failed for rule "testRule"')
      );
    });

    test('uses console.error when no logger provided', () => {
      const originalConsoleError = console.error;
      const mockConsoleError = jest.fn();
      console.error = mockConsoleError;

      const errors = [{
        field: 'testField',
        message: 'test error',
        value: 'value',
        expected: 'expected'
      }];

      logValidationErrors('testRule', errors);
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Configuration validation failed for rule "testRule"')
      );

      console.error = originalConsoleError;
    });
  });
});