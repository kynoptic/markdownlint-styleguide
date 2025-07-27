// @ts-check

/**
 * @fileoverview Tests for no-literal-ampersand rule.
 */

import { describe, test, expect } from '@jest/globals';
import path from 'path';
import { fileURLToPath } from 'url';
import { lint } from 'markdownlint/promise';
import noLiteralAmpersandRule from '../../src/rules/no-literal-ampersand.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Helper function to run the rule on a fixture file.
 * @param {string} fixturePath - Path to the fixture file
 * @returns {Promise<Object[]>} Array of linting errors
 */
async function runRuleOnFixture(fixturePath) {
  const options = {
    files: [fixturePath],
    customRules: [noLiteralAmpersandRule],
    config: {
      'no-literal-ampersand': true,
      'default': false // Disable all default rules
    }
  };

  const results = await lint(options);
  return results[fixturePath] || [];
}

/**
 * Helper function to run the rule on markdown content.
 * @param {string} markdown - Markdown content
 * @returns {Array} Array of errors
 */
function runRuleWithContent(markdown) {
  const errors = [];
  const onError = (error) => errors.push(error);

  const params = {
    name: 'test.md',
    lines: markdown.split('\n'),
    parsers: {
      micromark: {
        tokens: []
      }
    }
  };

  noLiteralAmpersandRule.function(params, onError);
  return errors;
}

describe('no-literal-ampersand rule', () => {
  const fixturesDir = path.resolve(__dirname, '../fixtures/no-literal-ampersand');
  const passingFixture = path.join(fixturesDir, 'passing.fixture.md');
  const failingFixture = path.join(fixturesDir, 'failing.fixture.md');

  describe('passing fixtures', () => {
    test('does not report violations for valid ampersand usage', async () => {
      const errors = await runRuleOnFixture(passingFixture);
      const ruleViolations = errors.filter(
        (v) => v.ruleNames.includes('no-literal-ampersand') || v.ruleNames.includes('NLA001')
      );

      expect(ruleViolations).toHaveLength(0);
    });
  });

  describe('failing fixtures', () => {
    test('reports violations for standalone ampersands', async () => {
      const errors = await runRuleOnFixture(failingFixture);
      const ruleViolations = errors.filter(
        (v) => v.ruleNames.includes('no-literal-ampersand') || v.ruleNames.includes('NLA001')
      );

      expect(ruleViolations.length).toBeGreaterThan(0);
      
      // Verify some specific error messages
      const errorDetails = ruleViolations.map(v => v.errorDetail);
      expect(errorDetails.every(detail => detail.includes('Use "and" instead of literal ampersand (&)'))).toBe(true);
    });
  });

  describe('specific ampersand detection', () => {
    test('flags standalone ampersands in regular text', () => {
      const markdown = 'This is a test & it should be flagged.';
      const errors = runRuleWithContent(markdown);
      
      expect(errors).toHaveLength(1);
      expect(errors[0].detail).toContain('Use "and" instead of literal ampersand (&)');
      expect(errors[0].range).toEqual([16, 1]); // Position of &
    });

    test('flags multiple ampersands on same line', () => {
      const markdown = 'First & second & third item.';
      const errors = runRuleWithContent(markdown);
      
      expect(errors).toHaveLength(2);
      expect(errors[0].range[0]).toBeLessThan(errors[1].range[0]);
    });

    test('ignores ampersands in inline code', () => {
      const markdown = 'Use the `&` operator for bitwise AND operations.';
      const errors = runRuleWithContent(markdown);
      
      expect(errors).toHaveLength(0);
    });

    test('ignores ampersands in HTML entities', () => {
      const markdown = 'Use &amp; for ampersand and &lt; for less than.';
      const errors = runRuleWithContent(markdown);
      
      expect(errors).toHaveLength(0);
    });

    test('ignores ampersands in code blocks', () => {
      const markdown = `\`\`\`javascript
function test() {
  return a & b;
}
\`\`\``;
      const errors = runRuleWithContent(markdown);
      
      expect(errors).toHaveLength(0);
    });

    test('ignores ampersands in indented code blocks', () => {
      const markdown = '    if (condition & mask) {\n        return true;\n    }';
      const errors = runRuleWithContent(markdown);
      
      expect(errors).toHaveLength(0);
    });

    test('ignores ampersands in link URLs', () => {
      const markdown = '[Search](https://example.com/search?q=cats&dogs)';
      const errors = runRuleWithContent(markdown);
      
      expect(errors).toHaveLength(0);
    });

    test('ignores ampersands in link text', () => {
      const markdown = '[Johnson & Johnson](https://jnj.com)';
      const errors = runRuleWithContent(markdown);
      
      expect(errors).toHaveLength(0);
    });

    test('flags ampersands in headings', () => {
      const markdown = '## Research & Development';
      const errors = runRuleWithContent(markdown);
      
      expect(errors).toHaveLength(1);
      expect(errors[0].detail).toContain('Use "and" instead of literal ampersand (&)');
    });

    test('flags ampersands in list items', () => {
      const markdown = '- Item one & item two\n- Another & more';
      const errors = runRuleWithContent(markdown);
      
      expect(errors).toHaveLength(2);
    });

    test('ignores non-standalone ampersands', () => {
      const markdown = 'Check out R&D and AT&T services.';
      const errors = runRuleWithContent(markdown);
      
      expect(errors).toHaveLength(0);
    });

    test('flags ampersands at line boundaries', () => {
      const markdown = '& this starts with ampersand\nThis ends with ampersand &';
      const errors = runRuleWithContent(markdown);
      
      expect(errors).toHaveLength(2);
    });
  });

  describe('autofix functionality', () => {
    test('provides fix info for standalone ampersands', () => {
      const markdown = 'Dogs & cats are pets.';
      const errors = runRuleWithContent(markdown);
      
      expect(errors).toHaveLength(1);
      expect(errors[0].fixInfo).toBeDefined();
      expect(errors[0].fixInfo.editColumn).toBe(6); // Position of &
      expect(errors[0].fixInfo.deleteCount).toBe(1);
      expect(errors[0].fixInfo.insertText).toBe('and');
    });

    test('provides fix info for multiple ampersands', () => {
      const markdown = 'A & B & C';
      const errors = runRuleWithContent(markdown);
      
      expect(errors).toHaveLength(2);
      expect(errors[0].fixInfo).toBeDefined();
      expect(errors[1].fixInfo).toBeDefined();
      expect(errors[0].fixInfo.insertText).toBe('and');
      expect(errors[1].fixInfo.insertText).toBe('and');
    });
  });

  describe('edge cases', () => {
    test('handles empty lines gracefully', () => {
      const markdown = '\n\n& test\n\n';
      const errors = runRuleWithContent(markdown);
      
      expect(errors).toHaveLength(1);
    });

    test('handles lines with only whitespace', () => {
      const markdown = '   \nTest & example\n\t\t';
      const errors = runRuleWithContent(markdown);
      
      expect(errors).toHaveLength(1);
    });

    test('handles malformed HTML gracefully', () => {
      const markdown = 'Test < & > more text';
      const errors = runRuleWithContent(markdown);
      
      // The & should be flagged because it's not part of a valid HTML entity
      expect(errors).toHaveLength(1);
    });

    test('handles mixed contexts', () => {
      const markdown = 'Normal text & `code with &` & more text';
      const errors = runRuleWithContent(markdown);
      
      // Should flag the first and third & but not the one in code
      expect(errors).toHaveLength(2);
    });
  });

  describe('rule metadata', () => {
    test('has correct rule names', () => {
      expect(noLiteralAmpersandRule.names).toEqual(['no-literal-ampersand', 'NLA001']);
    });

    test('has appropriate description', () => {
      expect(noLiteralAmpersandRule.description).toBe('Flags standalone ampersands (&) and suggests replacing with "and"');
    });

    test('has correct tags', () => {
      expect(noLiteralAmpersandRule.tags).toEqual(['readability', 'style']);
    });

    test('is fixable', () => {
      expect(noLiteralAmpersandRule.fixable).toBe(true);
    });

    test('uses micromark parser', () => {
      expect(noLiteralAmpersandRule.parser).toBe('micromark');
    });
  });
});