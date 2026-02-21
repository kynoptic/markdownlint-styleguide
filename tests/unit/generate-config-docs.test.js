// @ts-check

/**
 * Unit tests for the config docs generation script parsing logic.
 * Covers schema extraction, rule name/description parsing, and doc formatting.
 */

import {
  extractConfigSchema,
  extractRuleNames,
  extractRuleDescription,
  generateRuleDoc,
  RULE_METADATA,
  CONFIG_OPTION_METADATA
} from '../../scripts/generate-config-docs.js';

describe('generate-config-docs', () => {
  describe('extractConfigSchema', () => {
    test('should_extract_string_array_validators', () => {
      const content = `
        const configSchema = {
          specialTerms: validateStringArray,
          technicalTerms: validateStringArray
        };
      `;
      const schema = extractConfigSchema(content);
      expect(schema).toEqual({
        specialTerms: { type: 'string[]', validator: 'validateStringArray' },
        technicalTerms: { type: 'string[]', validator: 'validateStringArray' }
      });
    });

    test('should_extract_boolean_validators', () => {
      const content = `
        const configSchema = {
          skipCodeBlocks: validateBoolean,
          checkAnchors: validateBoolean
        };
      `;
      const schema = extractConfigSchema(content);
      expect(schema).toEqual({
        skipCodeBlocks: { type: 'boolean', validator: 'validateBoolean' },
        checkAnchors: { type: 'boolean', validator: 'validateBoolean' }
      });
    });

    test('should_extract_mixed_validators', () => {
      const content = `
        const configSchema = {
          ignoredTerms: validateStringArray,
          skipCodeBlocks: validateBoolean,
          skipMathBlocks: validateBoolean
        };
      `;
      const schema = extractConfigSchema(content);
      expect(schema).toEqual({
        ignoredTerms: { type: 'string[]', validator: 'validateStringArray' },
        skipCodeBlocks: { type: 'boolean', validator: 'validateBoolean' },
        skipMathBlocks: { type: 'boolean', validator: 'validateBoolean' }
      });
    });

    test('should_return_null_when_no_schema_defined', () => {
      const content = `
        const rule = {
          names: ['my-rule'],
          description: 'A rule without config'
        };
      `;
      expect(extractConfigSchema(content)).toBeNull();
    });

    test('should_return_null_for_empty_schema', () => {
      const content = `
        const configSchema = {};
      `;
      expect(extractConfigSchema(content)).toBeNull();
    });

    test('should_return_null_for_empty_content', () => {
      expect(extractConfigSchema('')).toBeNull();
    });

    test('should_handle_single_option_schema', () => {
      const content = `
        const configSchema = {
          exceptions: validateStringArray
        };
      `;
      const schema = extractConfigSchema(content);
      expect(schema).toEqual({
        exceptions: { type: 'string[]', validator: 'validateStringArray' }
      });
    });
  });

  describe('extractConfigSchema regression fixtures', () => {
    test('should_parse_sentence_case_heading_schema', () => {
      const content = `
        const configSchema = {
          specialTerms: validateStringArray,
          technicalTerms: validateStringArray,
          properNouns: validateStringArray,
          ignoreAfterEmoji: validateBoolean
        };
      `;
      const schema = extractConfigSchema(content);
      expect(schema).toHaveProperty('specialTerms');
      expect(schema).toHaveProperty('technicalTerms');
      expect(schema).toHaveProperty('properNouns');
      expect(schema).toHaveProperty('ignoreAfterEmoji');
      expect(schema.specialTerms.type).toBe('string[]');
      expect(schema.ignoreAfterEmoji.type).toBe('boolean');
    });

    test('should_parse_backtick_code_elements_schema', () => {
      const content = `
        const configSchema = {
          ignoredTerms: validateStringArray,
          skipCodeBlocks: validateBoolean,
          skipMathBlocks: validateBoolean,
          detectPascalCase: validateBoolean
        };
      `;
      const schema = extractConfigSchema(content);
      expect(Object.keys(schema)).toHaveLength(4);
      expect(schema.ignoredTerms.type).toBe('string[]');
      expect(schema.skipCodeBlocks.type).toBe('boolean');
    });

    test('should_parse_no_bare_urls_schema', () => {
      const content = `
        const configSchema = {
          allowedDomains: validateStringArray,
          skipCodeBlocks: validateBoolean
        };
      `;
      const schema = extractConfigSchema(content);
      expect(Object.keys(schema)).toHaveLength(2);
      expect(schema.allowedDomains.type).toBe('string[]');
    });

    test('should_parse_no_dead_internal_links_schema', () => {
      const content = `
        const configSchema = {
          ignoredPaths: validateStringArray,
          checkAnchors: validateBoolean,
          allowedExtensions: validateStringArray,
          allowPlaceholders: validateBoolean,
          placeholderPatterns: validateStringArray
        };
      `;
      const schema = extractConfigSchema(content);
      expect(Object.keys(schema)).toHaveLength(5);
      expect(schema.ignoredPaths.type).toBe('string[]');
      expect(schema.checkAnchors.type).toBe('boolean');
      expect(schema.allowedExtensions.type).toBe('string[]');
    });

    test('should_parse_no_literal_ampersand_schema', () => {
      const content = `
        const configSchema = {
          exceptions: validateStringArray,
          skipCodeBlocks: validateBoolean,
          skipInlineCode: validateBoolean
        };
      `;
      const schema = extractConfigSchema(content);
      expect(Object.keys(schema)).toHaveLength(3);
      expect(schema.exceptions.type).toBe('string[]');
      expect(schema.skipInlineCode.type).toBe('boolean');
    });
  });

  describe('extractRuleNames', () => {
    test('should_extract_multiple_names', () => {
      const content = `
        names: ['sentence-case-heading', 'SC001'],
        description: 'A rule'
      `;
      expect(extractRuleNames(content)).toEqual(['sentence-case-heading', 'SC001']);
    });

    test('should_extract_single_name', () => {
      const content = `
        names: ['my-rule'],
      `;
      expect(extractRuleNames(content)).toEqual(['my-rule']);
    });

    test('should_handle_double_quoted_names', () => {
      const content = `
        names: ["no-bare-url", "BU001"],
      `;
      expect(extractRuleNames(content)).toEqual(['no-bare-url', 'BU001']);
    });

    test('should_return_empty_array_when_no_names', () => {
      const content = 'const foo = "bar";';
      expect(extractRuleNames(content)).toEqual([]);
    });

    test('should_return_empty_array_for_empty_content', () => {
      expect(extractRuleNames('')).toEqual([]);
    });

    test('should_handle_names_with_spaces_around_brackets', () => {
      const content = `
        names: [ 'spaced-rule' , 'SP001' ],
      `;
      expect(extractRuleNames(content)).toEqual(['spaced-rule', 'SP001']);
    });
  });

  describe('extractRuleDescription', () => {
    test('should_extract_single_quoted_description', () => {
      const content = `
        description: 'Ensures headings use sentence case',
      `;
      expect(extractRuleDescription(content)).toBe('Ensures headings use sentence case');
    });

    test('should_extract_double_quoted_description', () => {
      const content = `
        description: "Bare URL used. Surround with < and >.",
      `;
      expect(extractRuleDescription(content)).toBe('Bare URL used. Surround with < and >.');
    });

    test('should_return_empty_string_when_no_description', () => {
      const content = 'const foo = "bar";';
      expect(extractRuleDescription(content)).toBe('');
    });

    test('should_return_empty_string_for_empty_content', () => {
      expect(extractRuleDescription('')).toBe('');
    });
  });

  describe('generateRuleDoc', () => {
    test('should_generate_heading_with_rule_name', () => {
      const doc = generateRuleDoc('test-rule', null, 'A test rule', ['test-rule']);
      expect(doc).toContain('### test-rule');
    });

    test('should_include_description', () => {
      const doc = generateRuleDoc('test-rule', null, 'A test rule', ['test-rule']);
      expect(doc).toContain('A test rule');
    });

    test('should_include_aliases_when_multiple_names', () => {
      const doc = generateRuleDoc('test-rule', null, 'A test rule', ['test-rule', 'TR001']);
      expect(doc).toContain('**Aliases:** test-rule, TR001');
    });

    test('should_not_include_aliases_when_single_name', () => {
      const doc = generateRuleDoc('test-rule', null, 'A test rule', ['test-rule']);
      expect(doc).not.toContain('**Aliases:**');
    });

    test('should_include_config_options_when_schema_provided', () => {
      const schema = {
        skipCodeBlocks: { type: 'boolean', validator: 'validateBoolean' }
      };
      const doc = generateRuleDoc('test-rule', schema, 'A test rule', ['test-rule']);
      expect(doc).toContain('**Configuration options:**');
      expect(doc).toContain('`skipCodeBlocks`');
    });

    test('should_not_include_config_section_when_no_schema', () => {
      const doc = generateRuleDoc('test-rule', null, 'A test rule', ['test-rule']);
      expect(doc).not.toContain('**Configuration options:**');
    });

    test('should_not_include_config_section_when_empty_schema', () => {
      const doc = generateRuleDoc('test-rule', {}, 'A test rule', ['test-rule']);
      expect(doc).not.toContain('**Configuration options:**');
    });

    test('should_include_type_from_option_metadata', () => {
      const schema = {
        specialTerms: { type: 'string[]', validator: 'validateStringArray' }
      };
      const doc = generateRuleDoc('sentence-case-heading', schema, '', ['sentence-case-heading']);
      expect(doc).toContain('**Type:** `string[]`');
    });

    test('should_include_default_from_option_metadata', () => {
      const schema = {
        skipCodeBlocks: { type: 'boolean', validator: 'validateBoolean' }
      };
      const doc = generateRuleDoc('test-rule', schema, '', ['test-rule']);
      expect(doc).toContain('**Default:** `true`');
    });

    test('should_include_description_from_option_metadata', () => {
      const schema = {
        skipCodeBlocks: { type: 'boolean', validator: 'validateBoolean' }
      };
      const doc = generateRuleDoc('test-rule', schema, '', ['test-rule']);
      expect(doc).toContain('Whether to skip validation inside code blocks');
    });

    test('should_include_example_configuration_block', () => {
      const schema = {
        allowedDomains: { type: 'string[]', validator: 'validateStringArray' }
      };
      const doc = generateRuleDoc('no-bare-urls', schema, '', ['no-bare-urls']);
      expect(doc).toContain('**Example configuration:**');
      expect(doc).toContain('```json');
      expect(doc).toContain('"no-bare-urls"');
    });

    test('should_use_metadata_description_over_extracted_description', () => {
      const doc = generateRuleDoc(
        'sentence-case-heading',
        null,
        'Extracted description',
        ['sentence-case-heading']
      );
      expect(doc).toContain(RULE_METADATA['sentence-case-heading'].description);
      expect(doc).not.toContain('Extracted description');
    });

    test('should_fall_back_to_extracted_description_when_no_metadata', () => {
      const doc = generateRuleDoc('unknown-rule', null, 'Fallback description', ['unknown-rule']);
      expect(doc).toContain('Fallback description');
    });

    test('should_include_valid_examples_from_metadata', () => {
      const doc = generateRuleDoc('sentence-case-heading', null, '', ['sentence-case-heading']);
      expect(doc).toContain('**Valid:**');
      for (const example of RULE_METADATA['sentence-case-heading'].examples.valid) {
        expect(doc).toContain(example);
      }
    });

    test('should_include_invalid_examples_from_metadata', () => {
      const doc = generateRuleDoc('sentence-case-heading', null, '', ['sentence-case-heading']);
      expect(doc).toContain('**Invalid:**');
      for (const example of RULE_METADATA['sentence-case-heading'].examples.invalid) {
        expect(doc).toContain(example);
      }
    });

    test('should_skip_deprecated_options_in_example_config', () => {
      const schema = {
        specialTerms: { type: 'string[]', validator: 'validateStringArray' },
        technicalTerms: { type: 'string[]', validator: 'validateStringArray' }
      };
      const doc = generateRuleDoc('sentence-case-heading', schema, '', ['sentence-case-heading']);
      // technicalTerms is deprecated, should not appear in example config values
      // but specialTerms should appear with its example
      expect(doc).toContain('"specialTerms"');
    });

    test('should_handle_option_with_no_metadata', () => {
      const schema = {
        unknownOption: { type: 'boolean', validator: 'validateBoolean' }
      };
      const doc = generateRuleDoc('test-rule', schema, '', ['test-rule']);
      expect(doc).toContain('`unknownOption`');
      // Falls back to schema type when no metadata
      expect(doc).toContain('**Type:** `boolean`');
    });
  });

  describe('RULE_METADATA', () => {
    test('should_have_metadata_for_all_five_rules', () => {
      const expectedRules = [
        'sentence-case-heading',
        'backtick-code-elements',
        'no-bare-urls',
        'no-literal-ampersand',
        'no-dead-internal-links'
      ];
      for (const rule of expectedRules) {
        expect(RULE_METADATA).toHaveProperty(rule);
      }
    });

    test('should_have_description_and_examples_for_each_rule', () => {
      for (const [, meta] of Object.entries(RULE_METADATA)) {
        expect(meta.description).toBeDefined();
        expect(typeof meta.description).toBe('string');
        expect(meta.description.length).toBeGreaterThan(0);
        expect(meta.examples).toBeDefined();
        expect(meta.examples.valid).toBeDefined();
        expect(Array.isArray(meta.examples.valid)).toBe(true);
        expect(meta.examples.valid.length).toBeGreaterThan(0);
      }
    });
  });

  describe('CONFIG_OPTION_METADATA', () => {
    test('should_have_type_for_all_options', () => {
      for (const [, meta] of Object.entries(CONFIG_OPTION_METADATA)) {
        expect(meta.type).toBeDefined();
        expect(['string[]', 'boolean']).toContain(meta.type);
      }
    });

    test('should_have_description_for_all_options', () => {
      for (const [, meta] of Object.entries(CONFIG_OPTION_METADATA)) {
        expect(meta.description).toBeDefined();
        expect(typeof meta.description).toBe('string');
      }
    });

    test('should_mark_deprecated_options', () => {
      expect(CONFIG_OPTION_METADATA.technicalTerms.deprecated).toBe(true);
      expect(CONFIG_OPTION_METADATA.properNouns.deprecated).toBe(true);
    });

    test('should_have_defaults_for_non_deprecated_options', () => {
      for (const [, meta] of Object.entries(CONFIG_OPTION_METADATA)) {
        if (!meta.deprecated) {
          expect(meta.default).toBeDefined();
        }
      }
    });
  });
});
