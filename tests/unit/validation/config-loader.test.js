/**
 * @unit
 * Unit tests for external validation configuration loader.
 */
import { describe, test, expect } from '@jest/globals';
import { loadConfig, validateConfig } from '../../../src/validation/config-loader.js';

describe('Config loader', () => {
  describe('loadConfig', () => {
    test('test_should_load_jsonc_config_when_file_exists', async () => {
      const config = await loadConfig('/path/to/.markdownlint-trap-validation.jsonc');

      expect(config).toHaveProperty('sources');
      expect(config).toHaveProperty('filters');
      expect(config).toHaveProperty('reporting');
    });

    test('test_should_return_defaults_when_file_not_found', async () => {
      const config = await loadConfig('/nonexistent/config.jsonc');

      expect(config).toHaveProperty('sources');
      expect(config.sources).toEqual({ local: [], github: [] });
    });

    test('test_should_handle_non_array_local_sources_when_loading_config', async () => {
      // This test ensures loadConfig doesn't crash when encountering non-array sources
      // The type validation happens later in validateConfig
      const fs = await import('fs');
      const originalReadFile = fs.promises.readFile;

      // Mock readFile to return config with non-array local sources
      fs.promises.readFile = async () => JSON.stringify({
        sources: {
          local: 'invalid-string-value'
        }
      });

      const config = await loadConfig('/mocked/config.jsonc');

      // Should not crash and should fall back to default for invalid types
      expect(config.sources.local).toEqual([]);

      // Restore original
      fs.promises.readFile = originalReadFile;
    });
  });

  describe('validateConfig', () => {
    test('test_should_accept_valid_config_when_all_fields_correct', () => {
      const config = {
        sources: {
          local: ['/path/to/file.md'],
          github: ['owner/repo']
        },
        filters: {
          include: ['**/*.md'],
          exclude: ['**/node_modules/**']
        },
        reporting: {
          format: ['json', 'markdown'],
          detailLevel: 'detailed',
          outputDir: 'validation-reports'
        }
      };

      const result = validateConfig(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('test_should_reject_invalid_config_when_sources_missing', () => {
      const config = {
        filters: {},
        reporting: {}
      };

      const result = validateConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('test_should_reject_invalid_format_when_unknown_value', () => {
      const config = {
        sources: { local: [], github: [] },
        reporting: {
          format: ['invalid-format']
        }
      };

      const result = validateConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('format'))).toBe(true);
    });

    test('test_should_reject_non_array_sources_when_local_is_string', () => {
      const config = {
        sources: {
          local: '/path/to/file.md',  // String instead of array
          github: []
        }
      };

      const result = validateConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('sources.local must be an array'))).toBe(true);
    });

    test('test_should_reject_non_array_sources_when_github_is_string', () => {
      const config = {
        sources: {
          local: [],
          github: 'owner/repo'  // String instead of array
        }
      };

      const result = validateConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('sources.github must be an array'))).toBe(true);
    });

    test('test_should_reject_non_array_sources_when_both_are_non_iterables', () => {
      const config = {
        sources: {
          local: 'string',
          github: 123
        }
      };

      const result = validateConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('sources.local must be an array'))).toBe(true);
      expect(result.errors.some(e => e.includes('sources.github must be an array'))).toBe(true);
    });
  });
});
