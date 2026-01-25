// @ts-check

/**
 * @fileoverview Tests for no-dead-internal-links rule.
 */

import { describe, test, expect } from '@jest/globals';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { lint } from 'markdownlint/promise';
import noDeadInternalLinksRule, { _forTesting } from '../../src/rules/no-dead-internal-links.js';

const { clearCaches, getCacheStats } = _forTesting;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Helper function to run the rule on a file with proper file path context.
 * @param {string} fixturePath - Path to the fixture file
 * @returns {Promise<Object[]>} Array of linting errors
 */
async function runRuleOnFixture(fixturePath) {
  const options = {
    files: [fixturePath],
    customRules: [noDeadInternalLinksRule],
    config: {
      'no-dead-internal-links': true,
      'default': false // Disable all default rules
    }
  };

  const results = await lint(options);
  return results[fixturePath] || [];
}

/**
 * Helper function to run the rule on a file synchronously for cache testing.
 * @param {string} filePath - Path to the file
 * @returns {Object[]} Array of errors
 */
function runRuleOnFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  const errors = [];
  const onError = (error) => errors.push(error);

  const params = {
    name: filePath,
    lines: content.split('\n'),
    parsers: {
      micromark: {
        tokens: []
      }
    }
  };

  noDeadInternalLinksRule.function(params, onError);
  return errors;
}

/**
 * Helper function to run the rule on markdown content with a specific file context.
 * @param {string} markdown - Markdown content
 * @param {string} fileName - File name for context
 * @param {Object} config - Configuration for the rule
 * @returns {Array} Array of errors
 */
function runRuleWithContent(markdown, fileName, config = {}) {
  const errors = [];
  const onError = (error) => errors.push(error);

  const params = {
    name: fileName,
    lines: markdown.split('\n'),
    config: {
      'no-dead-internal-links': config
    },
    parsers: {
      micromark: {
        tokens: []
      }
    }
  };

  noDeadInternalLinksRule.function(params, onError);
  return errors;
}

describe('no-dead-internal-links rule', () => {
  const fixturesDir = path.resolve(__dirname, '../fixtures/no-dead-internal-links');
  const passingFixture = path.join(fixturesDir, 'passing.fixture.md');
  const failingFixture = path.join(fixturesDir, 'failing.fixture.md');

  describe('passing fixtures', () => {
    test('does not report violations for valid internal links', async () => {
      const errors = await runRuleOnFixture(passingFixture);
      const ruleViolations = errors.filter(
        (v) => v.ruleNames.includes('no-dead-internal-links') || v.ruleNames.includes('DL001')
      );

      expect(ruleViolations).toHaveLength(0);
    });
  });

  describe('failing fixtures', () => {
    test('reports violations for invalid internal links', async () => {
      const errors = await runRuleOnFixture(failingFixture);
      const ruleViolations = errors.filter(
        (v) => v.ruleNames.includes('no-dead-internal-links') || v.ruleNames.includes('DL001')
      );

      expect(ruleViolations.length).toBeGreaterThan(0);
      
      // Verify some specific error messages
      const errorDetails = ruleViolations.map(v => v.errorDetail);
      
      expect(errorDetails).toContain('Heading anchor "#this-heading-does-not-exist" not found in current file');
      expect(errorDetails).toContain('Link target "non-existent-file.md" does not exist');
      expect(errorDetails).toContain('Heading anchor "#non-existent-section" not found in "existing-file.md"');
      expect(errorDetails).toContain('Link target "missing-directory/" does not exist');
    });
  });

  describe('specific link validation', () => {
    const testFile = path.join(fixturesDir, 'test-file.md');

    test('validates same-page anchor links', () => {
      const markdown = `
# Main heading
## Section one
This is [a link to section one](#section-one).
This is [a link to non-existent section](#missing-section).
`;
      
      const errors = runRuleWithContent(markdown, testFile);
      
      expect(errors).toHaveLength(1);
      expect(errors[0].detail).toContain('Heading anchor "#missing-section" not found in current file');
    });

    test('validates file existence', () => {
      const markdown = `
[Existing file](existing-file.md)
[Missing file](missing-file.md)
[Existing subdirectory file](subdirectory/nested-file.md)
[Missing subdirectory file](subdirectory/missing.md)
`;
      
      const errors = runRuleWithContent(markdown, testFile);
      
      expect(errors).toHaveLength(2);
      expect(errors[0].detail).toContain('Link target "missing-file.md" does not exist');
      expect(errors[1].detail).toContain('Link target "subdirectory/missing.md" does not exist');
    });

    test('validates heading anchors in other files', () => {
      const markdown = `
[Valid heading](existing-file.md#section-one)
[Invalid heading](existing-file.md#missing-heading)
[Valid nested heading](existing-file.md#nested-heading)
[Invalid nested heading](existing-file.md#wrong-nested)
`;
      
      const errors = runRuleWithContent(markdown, testFile);
      
      expect(errors).toHaveLength(2);
      expect(errors[0].detail).toContain('Heading anchor "#missing-heading" not found in "existing-file.md"');
      expect(errors[1].detail).toContain('Heading anchor "#wrong-nested" not found in "existing-file.md"');
    });

    test('ignores external links', () => {
      const markdown = `
[Google](https://google.com)
[GitHub](https://github.com)
[Email](mailto:test@example.com)
[File protocol](file:///etc/hosts)
[FTP](ftp://files.example.com)
`;
      
      const errors = runRuleWithContent(markdown, testFile);
      
      expect(errors).toHaveLength(0);
    });

    test('validates directory links', () => {
      const markdown = `
[Existing directory](subdirectory/)
[Missing directory](missing-dir/)
[Current directory](./)
[Parent directory](../)
`;
      
      const errors = runRuleWithContent(markdown, testFile);
      
      expect(errors).toHaveLength(1);
      expect(errors[0].detail).toContain('Link target "missing-dir/" does not exist');
    });

    test('handles files without extensions', () => {
      const markdown = `
[File without extension](existing-file)
[Missing file without extension](missing-file)
`;
      
      const errors = runRuleWithContent(markdown, testFile);
      
      // The rule should find existing-file.md when looking for existing-file
      expect(errors).toHaveLength(1);
      expect(errors[0].detail).toContain('Link target "missing-file" does not exist');
    });

    test('handles complex anchor formatting', () => {
      const markdown = `
# Test Heading With Special Characters!
## Another Section & More Text

[Link to first heading](#test-heading-with-special-characters)
[Link to second heading](#another-section-more-text)
[Link to wrong format](#Test-Heading-With-Special-Characters!)
`;
      
      const errors = runRuleWithContent(markdown, testFile);
      
      // Should report 1 error: only the wrong case format
      expect(errors).toHaveLength(1);
      expect(errors[0].detail).toContain('Heading anchor "#Test-Heading-With-Special-Characters!" not found in current file');
    });
  });

  describe('edge cases', () => {
    test('handles empty file name gracefully', () => {
      const markdown = '[Link](test.md)';
      const errors = runRuleWithContent(markdown, '');
      
      // Should not crash and should not report errors without file context
      expect(errors).toHaveLength(0);
    });

    test('handles stdin input gracefully', () => {
      const markdown = '[Link](test.md)';
      const errors = runRuleWithContent(markdown, '<stdin>');
      
      // Should not crash and should not report errors for stdin
      expect(errors).toHaveLength(0);
    });

    test('handles malformed links gracefully', () => {
      const markdown = `
[Incomplete link](
[Missing closing](test.md
Broken [link format
[](empty-text.md)
[Empty URL]()
`;
      
      const testFile = path.join(fixturesDir, 'test.md');
      const errors = runRuleWithContent(markdown, testFile);
      
      // Should handle malformed links without crashing
      // Only well-formed links should be validated
      expect(Array.isArray(errors)).toBe(true);
    });

    test('validates multiple links on same line', () => {
      const markdown = 'Check [existing file](existing-file.md) and [missing file](missing.md) for details.';
      
      const testFile = path.join(fixturesDir, 'test.md');
      const errors = runRuleWithContent(markdown, testFile);
      
      expect(errors).toHaveLength(1);
      expect(errors[0].detail).toContain('Link target "missing.md" does not exist');
    });
  });

  describe('rule metadata', () => {
    test('has correct rule names', () => {
      expect(noDeadInternalLinksRule.names).toEqual(['no-dead-internal-links', 'DL001']);
    });

    test('has appropriate description', () => {
      expect(noDeadInternalLinksRule.description).toBe('Detects broken internal links to files or headings. Uses caching for performance with large projects.');
    });

    test('has correct tags', () => {
      expect(noDeadInternalLinksRule.tags).toEqual(['links', 'validation', 'performance']);
    });

    test('is not fixable', () => {
      expect(noDeadInternalLinksRule.fixable).toBe(false);
    });

    test('uses micromark parser', () => {
      expect(noDeadInternalLinksRule.parser).toBe('micromark');
    });
  });

  describe('performance optimizations', () => {
    test('provides cache management functions', () => {
      expect(typeof clearCaches).toBe('function');
      expect(typeof getCacheStats).toBe('function');
    });

    test('cache stats provide meaningful information', () => {
      // Clear caches first to ensure clean state
      clearCaches();
      
      // Check initial state
      const initialStats = getCacheStats();
      expect(initialStats).toHaveProperty('fileExistenceCache');
      expect(initialStats).toHaveProperty('headingCache');
      expect(initialStats).toHaveProperty('contentCache');
      expect(typeof initialStats.fileExistenceCache).toBe('number');
      expect(typeof initialStats.headingCache).toBe('number');
      expect(typeof initialStats.contentCache).toBe('number');
    });

    test('cache clearing works correctly', () => {
      // Run a test that should populate caches
      const testFile = path.join(__dirname, '../fixtures/no-dead-internal-links/passing.fixture.md');
      runRuleOnFile(testFile);
      
      // Check that caches have some data
      const beforeClear = getCacheStats();
      const totalBefore = beforeClear.fileExistenceCache + beforeClear.headingCache + beforeClear.contentCache;
      expect(totalBefore).toBeGreaterThan(0);
      
      // Clear caches
      clearCaches();
      
      // Check that caches are empty
      const afterClear = getCacheStats();
      expect(afterClear.fileExistenceCache).toBe(0);
      expect(afterClear.headingCache).toBe(0);
      expect(afterClear.contentCache).toBe(0);
    });
  });

  describe('allowedExtensions configuration', () => {
    const testFile = path.join(fixturesDir, 'test-file.md');

    test('uses default extensions (.md, .markdown) when not configured', () => {
      const markdown = `
[Link without extension](existing-file)
[Link to non-markdown file](test-file.txt)
[Link to missing file](missing-file.xyz)
`;

      const errors = runRuleWithContent(markdown, testFile);

      // Should find existing-file.md, find test-file.txt (since it exists), but fail on missing file
      expect(errors).toHaveLength(1);
      expect(errors[0].detail).toContain('Link target "missing-file.xyz" does not exist');
    });

    test('respects custom allowedExtensions configuration', () => {
      const markdown = `
[Link without extension](test-file)
[Link to markdown](existing-file)
[Link to html file](test-file.html)
`;

      const config = {
        allowedExtensions: ['.txt', '.html']
      };

      const errors = runRuleWithContent(markdown, testFile, config);

      // With custom extensions, should find test-file.txt but not existing-file.md
      expect(errors).toHaveLength(1);
      expect(errors[0].detail).toContain('Link target "existing-file" does not exist');
    });

    test('allows multiple custom extensions', () => {
      const markdown = `
[Link to text file](test-file)
[Link to html file](test-file)
[Link to missing file](missing-file)
`;

      const config = {
        allowedExtensions: ['.txt', '.html', '.md']
      };

      const errors = runRuleWithContent(markdown, testFile, config);

      // Should find test-file.txt and test-file.html, but fail on missing-file
      expect(errors).toHaveLength(1);
      expect(errors[0].detail).toContain('Link target "missing-file" does not exist');
    });

    test('handles empty allowedExtensions array', () => {
      const markdown = `
[Link without extension](existing-file)
[Link with extension](existing-file.md)
`;

      const config = {
        allowedExtensions: []
      };

      const errors = runRuleWithContent(markdown, testFile, config);

      // With empty extensions, only files with exact names should work
      expect(errors).toHaveLength(1);
      expect(errors[0].detail).toContain('Link target "existing-file" does not exist');
    });

    test('validates anchors work with custom extensions', () => {
      const markdown = `
[Link to text file with anchor](test-file#heading)
`;

      const config = {
        allowedExtensions: ['.txt'],
        checkAnchors: true
      };

      const errors = runRuleWithContent(markdown, testFile, config);

      // Should find test-file.txt but fail on anchor validation
      // (since .txt files don't have markdown headings)
      expect(errors).toHaveLength(1);
      expect(errors[0].detail).toContain('Heading anchor "#heading" not found in "test-file"');
    });

    test('works with files that have explicit extensions', () => {
      const markdown = `
[Direct link to txt](test-file.txt)
[Direct link to html](test-file.html)
[Direct link to missing](missing.txt)
`;

      const config = {
        allowedExtensions: ['.md']  // Different from actual file extensions
      };

      const errors = runRuleWithContent(markdown, testFile, config);

      // Should validate existing files regardless of allowedExtensions when extension is explicit
      expect(errors).toHaveLength(1);
      expect(errors[0].detail).toContain('Link target "missing.txt" does not exist');
    });

    test('reports configuration errors for non-string values in allowedExtensions', () => {
      const markdown = `
[Link without extension](existing-file)
`;

      const config = {
        allowedExtensions: ['.md', null, undefined, 123, '.txt']  // Mixed types
      };

      const errors = runRuleWithContent(markdown, testFile, config);

      // Should report configuration validation errors
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].detail).toContain('Configuration validation failed');
      expect(errors[0].detail).toContain('allowedExtensions');
    });

    test('reports configuration errors for invalid type', () => {
      const markdown = `
[Link without extension](existing-file)
`;

      const config = {
        allowedExtensions: "not-an-array"  // Invalid type
      };

      const errors = runRuleWithContent(markdown, testFile, config);

      // Should report configuration error for wrong type
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].detail).toContain('Configuration validation failed');
      expect(errors[0].detail).toContain('allowedExtensions must be an array');
    });

    test('case sensitivity in extensions (when filesystem supports it)', () => {
      const markdown = `
[Link without extension](test-file)
[Link to missing file](missing-file)
`;

      const config = {
        allowedExtensions: ['.TXT', '.HTML']  // Uppercase extensions
      };

      const errors = runRuleWithContent(markdown, testFile, config);

      // On case-sensitive filesystems, extensions should be case sensitive
      // On case-insensitive filesystems (like macOS default), this may still find files
      // Test should have at least 1 error (for missing-file)
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.detail.includes('missing-file'))).toBe(true);
    });
  });

  describe('setext heading support', () => {
    const testFile = path.join(fixturesDir, 'test-file.md');

    test('recognizes setext H1 headings (underlined with =)', () => {
      const markdown = `
Setext Heading Level 1
======================

This is [a link to setext heading](#setext-heading-level-1).
This is [a link to non-existent heading](#missing-setext-heading).
`;

      const errors = runRuleWithContent(markdown, testFile);

      expect(errors).toHaveLength(1);
      expect(errors[0].detail).toContain('Heading anchor "#missing-setext-heading" not found in current file');
    });

    test('recognizes setext H2 headings (underlined with -)', () => {
      const markdown = `
Setext Heading Level 2
----------------------

This is [a link to setext H2](#setext-heading-level-2).
This is [a link to missing H2](#missing-h2).
`;

      const errors = runRuleWithContent(markdown, testFile);

      expect(errors).toHaveLength(1);
      expect(errors[0].detail).toContain('Heading anchor "#missing-h2" not found in current file');
    });

    test('handles mixed ATX and setext headings', () => {
      const markdown = `
# ATX Heading

Setext Heading
==============

## Another ATX

Another Setext
--------------

[Link to ATX](#atx-heading)
[Link to setext H1](#setext-heading)
[Link to ATX H2](#another-atx)
[Link to setext H2](#another-setext)
[Link to missing](#missing-heading)
`;

      const errors = runRuleWithContent(markdown, testFile);

      expect(errors).toHaveLength(1);
      expect(errors[0].detail).toContain('Heading anchor "#missing-heading" not found in current file');
    });

    test('requires minimum underline length for setext headings', () => {
      const markdown = `
Too Short Underline
=

Valid Underline
===============

[Link to short](#too-short-underline)
[Link to valid](#valid-underline)
`;

      const errors = runRuleWithContent(markdown, testFile);

      // Should not recognize "Too Short Underline" because underline is < 3 chars
      expect(errors).toHaveLength(1);
      expect(errors[0].detail).toContain('Heading anchor "#too-short-underline" not found in current file');
    });

    test('handles setext headings with special characters', () => {
      const markdown = `
Special Characters & Symbols!
=============================

Mixed Content-123 (Test)
------------------------

[Link to special](#special-characters-symbols)
[Link to mixed](#mixed-content-123-test)
[Link to wrong format](#Special-Characters-&-Symbols!)
`;

      const errors = runRuleWithContent(markdown, testFile);

      // Should only fail on the wrong format link
      expect(errors).toHaveLength(1);
      expect(errors[0].detail).toContain('Heading anchor "#Special-Characters-&-Symbols!" not found in current file');
    });

    test('ignores lines that look like setext but are not headings', () => {
      const markdown = `
This is not a heading because there's no text above
===================================================

Regular paragraph text.

====
Another paragraph.

---

[Link to fake heading](#this-is-not-a-heading-because-theres-no-text-above)
`;

      const errors = runRuleWithContent(markdown, testFile);

      // Should not recognize the fake heading
      expect(errors).toHaveLength(1);
      expect(errors[0].detail).toContain('Heading anchor "#this-is-not-a-heading-because-theres-no-text-above" not found in current file');
    });

    test('validates setext headings in external files', () => {
      const markdown = `
[Link to setext in existing file](setext-headings-test.md#setext-heading-level-1)
[Link to missing setext](setext-headings-test.md#non-existent-setext)
`;

      const errors = runRuleWithContent(markdown, testFile);

      expect(errors).toHaveLength(1);
      expect(errors[0].detail).toContain('Heading anchor "#non-existent-setext" not found in "setext-headings-test.md"');
    });
  });

  describe('placeholder pattern detection', () => {
    const testFile = path.join(fixturesDir, 'test-file.md');

    describe('allowPlaceholders: true', () => {
      test('should allow URL placeholder', () => {
        const markdown = `
[Documentation](URL)
[Another link](url)
`;

        const config = {
          allowPlaceholders: true,
          placeholderPatterns: ['URL', 'link', 'PLACEHOLDER', 'TODO', 'XXX', 'path/to/', 'example.com']
        };

        const errors = runRuleWithContent(markdown, testFile, config);
        expect(errors).toHaveLength(0);
      });

      test('should allow link placeholder', () => {
        const markdown = `
[View in browser](link)
[Service portal](link)
`;

        const config = {
          allowPlaceholders: true,
          placeholderPatterns: ['URL', 'link', 'PLACEHOLDER', 'TODO', 'XXX', 'path/to/', 'example.com']
        };

        const errors = runRuleWithContent(markdown, testFile, config);
        expect(errors).toHaveLength(0);
      });

      test('should allow PLACEHOLDER.md', () => {
        const markdown = `
[Configuration guide](PLACEHOLDER.md)
[Template](PLACEHOLDER)
`;

        const config = {
          allowPlaceholders: true,
          placeholderPatterns: ['URL', 'link', 'PLACEHOLDER', 'TODO', 'XXX', 'path/to/', 'example.com']
        };

        const errors = runRuleWithContent(markdown, testFile, config);
        expect(errors).toHaveLength(0);
      });

      test('should allow TODO.md', () => {
        const markdown = `
[Pending items](TODO.md)
[Implementation plan](TODO)
`;

        const config = {
          allowPlaceholders: true,
          placeholderPatterns: ['URL', 'link', 'PLACEHOLDER', 'TODO', 'XXX', 'path/to/', 'example.com']
        };

        const errors = runRuleWithContent(markdown, testFile, config);
        expect(errors).toHaveLength(0);
      });

      test('should allow adr-XXX-title.md pattern', () => {
        const markdown = `
[ADR template](adr-XXX-title.md)
[Decision doc](doc-XXX-format.md)
`;

        const config = {
          allowPlaceholders: true,
          placeholderPatterns: ['URL', 'link', 'PLACEHOLDER', 'TODO', 'XXX', 'path/to/', 'example.com']
        };

        const errors = runRuleWithContent(markdown, testFile, config);
        expect(errors).toHaveLength(0);
      });

      test('should allow path/to/ prefix', () => {
        const markdown = `
[Example file](path/to/file.md)
[Image](path/to/image.png)
[Resource](path/to/nested/resource.txt)
`;

        const config = {
          allowPlaceholders: true,
          placeholderPatterns: ['URL', 'link', 'PLACEHOLDER', 'TODO', 'XXX', 'path/to/', 'example.com']
        };

        const errors = runRuleWithContent(markdown, testFile, config);
        expect(errors).toHaveLength(0);
      });

      test('should still flag actual broken links', () => {
        const markdown = `
[Real broken link](non-existent-file.md)
[Missing doc](missing-document.md)
`;

        const config = {
          allowPlaceholders: true,
          placeholderPatterns: ['URL', 'link', 'PLACEHOLDER', 'TODO', 'XXX', 'path/to/', 'example.com']
        };

        const errors = runRuleWithContent(markdown, testFile, config);
        expect(errors).toHaveLength(2);
        expect(errors[0].detail).toContain('Link target "non-existent-file.md" does not exist');
        expect(errors[1].detail).toContain('Link target "missing-document.md" does not exist');
      });

      test('should handle mixed placeholders and real links', () => {
        const markdown = `
[Placeholder](URL)
[Real file](existing-file.md)
[Missing file](broken.md)
[Another placeholder](TODO.md)
`;

        const config = {
          allowPlaceholders: true,
          placeholderPatterns: ['URL', 'link', 'PLACEHOLDER', 'TODO', 'XXX', 'path/to/', 'example.com']
        };

        const errors = runRuleWithContent(markdown, testFile, config);
        expect(errors).toHaveLength(1);
        expect(errors[0].detail).toContain('Link target "broken.md" does not exist');
      });
    });

    describe('allowPlaceholders: false', () => {
      test('should validate placeholders as normal links when disabled', () => {
        const markdown = `
[Documentation](URL)
[Guide](PLACEHOLDER.md)
[Items](TODO.md)
`;

        const config = {
          allowPlaceholders: false,
          placeholderPatterns: ['URL', 'link', 'PLACEHOLDER', 'TODO', 'XXX', 'path/to/', 'example.com']
        };

        const errors = runRuleWithContent(markdown, testFile, config);
        expect(errors).toHaveLength(3);
        expect(errors[0].detail).toContain('Link target "URL" does not exist');
        expect(errors[1].detail).toContain('Link target "PLACEHOLDER.md" does not exist');
        expect(errors[2].detail).toContain('Link target "TODO.md" does not exist');
      });
    });

    describe('custom placeholderPatterns', () => {
      test('should respect custom placeholder patterns', () => {
        const markdown = `
[Custom placeholder](CUSTOM.md)
[Example](EXAMPLE)
[Template](TEMPLATE.md)
`;

        const config = {
          allowPlaceholders: true,
          placeholderPatterns: ['CUSTOM', 'EXAMPLE', 'TEMPLATE']
        };

        const errors = runRuleWithContent(markdown, testFile, config);
        expect(errors).toHaveLength(0);
      });

      test('should not match default patterns when custom patterns provided', () => {
        const markdown = `
[Custom works](CUSTOM.md)
[Default URL does not work](URL)
[Default PLACEHOLDER does not work](PLACEHOLDER.md)
`;

        const config = {
          allowPlaceholders: true,
          placeholderPatterns: ['CUSTOM']
        };

        const errors = runRuleWithContent(markdown, testFile, config);
        expect(errors).toHaveLength(2);
        expect(errors[0].detail).toContain('Link target "URL" does not exist');
        expect(errors[1].detail).toContain('Link target "PLACEHOLDER.md" does not exist');
      });

      test('should work with empty patterns array', () => {
        const markdown = `
[Link](URL)
[Guide](PLACEHOLDER.md)
`;

        const config = {
          allowPlaceholders: true,
          placeholderPatterns: []
        };

        const errors = runRuleWithContent(markdown, testFile, config);
        expect(errors).toHaveLength(2);
      });
    });

    describe('default behavior (no configuration)', () => {
      test('should allow placeholders by default', () => {
        const markdown = `
[Documentation](URL)
[Guide](PLACEHOLDER.md)
`;

        // No config provided - should use defaults
        const errors = runRuleWithContent(markdown, testFile);

        // Default is allowPlaceholders: true, so these should NOT be flagged
        expect(errors).toHaveLength(0);
      });
    });

    describe('edge cases', () => {
      test('should handle case-insensitive placeholder matching', () => {
        const markdown = `
[Link 1](url)
[Link 2](URL)
[Link 3](Url)
[Link 4](uRl)
`;

        const config = {
          allowPlaceholders: true,
          placeholderPatterns: ['URL']
        };

        const errors = runRuleWithContent(markdown, testFile, config);
        expect(errors).toHaveLength(0);
      });

      test('should handle placeholders in image links', () => {
        const markdown = `
![Alt text](URL)
![Diagram](path/to/image.png)
![Screenshot](PLACEHOLDER.png)
`;

        const config = {
          allowPlaceholders: true,
          placeholderPatterns: ['URL', 'PLACEHOLDER', 'path/to/']
        };

        const errors = runRuleWithContent(markdown, testFile, config);
        expect(errors).toHaveLength(0);
      });

      test('should not flag same-page anchors as placeholders', () => {
        const markdown = `
# URL Section

[Link to URL section](#url-section)
`;

        const config = {
          allowPlaceholders: true,
          placeholderPatterns: ['URL']
        };

        const errors = runRuleWithContent(markdown, testFile, config);
        expect(errors).toHaveLength(0);
      });

      test('should handle placeholders with anchors', () => {
        const markdown = `
[Link with anchor](URL#section)
[Placeholder with anchor](PLACEHOLDER.md#heading)
`;

        const config = {
          allowPlaceholders: true,
          placeholderPatterns: ['URL', 'PLACEHOLDER']
        };

        const errors = runRuleWithContent(markdown, testFile, config);
        expect(errors).toHaveLength(0);
      });
    });

    describe('integration with placeholders.fixture.md', () => {
      test('validates placeholders fixture with allowPlaceholders enabled', async () => {
        const placeholdersFixture = path.join(fixturesDir, 'placeholders.fixture.md');

        // Read fixture and run with allowPlaceholders: true
        const content = fs.readFileSync(placeholdersFixture, 'utf8');
        const config = {
          allowPlaceholders: true,
          placeholderPatterns: ['URL', 'link', 'PLACEHOLDER', 'TODO', 'XXX', 'path/to/', 'example.com']
        };

        const errors = runRuleWithContent(content, placeholdersFixture, config);

        // Should only flag actual broken links, not placeholders
        // The fixture has intentional broken links in "Should flag" section
        const brokenLinkErrors = errors.filter(e =>
          e.detail.includes('does-not-exist.md') ||
          e.detail.includes('nonexistent-section') ||
          e.detail.includes('real-file.md') ||
          e.detail.includes('actual-image.png') ||
          e.detail.includes('api-guide.md') ||
          e.detail.includes('guide.md')
        );

        expect(brokenLinkErrors.length).toBeGreaterThan(0);

        // Should not flag placeholder patterns
        const placeholderErrors = errors.filter(e =>
          e.detail.includes('Link target "URL"') ||
          e.detail.includes('Link target "link"') ||
          e.detail.includes('Link target "PLACEHOLDER') ||
          e.detail.includes('Link target "TODO') ||
          e.detail.includes('Link target "path/to/')
        );

        expect(placeholderErrors).toHaveLength(0);
      });
    });
  });
});