// @ts-check

/**
 * @fileoverview Unit tests for placeholder pattern detection logic.
 * Tests the isPlaceholder function that determines if a link target is a placeholder.
 */

import { describe, test, expect } from '@jest/globals';

/**
 * Escape special regex characters in a string for use in RegExp constructor.
 * @param {string} string - String to escape
 * @returns {string} Escaped string safe for use in regex
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Check if a link target matches common placeholder patterns.
 * @param {string} target - Link target to check
 * @param {string[]} patterns - Array of placeholder patterns to match
 * @returns {boolean} True if target matches a placeholder pattern
 */
function isPlaceholder(target, patterns) {
  if (!target || !Array.isArray(patterns) || patterns.length === 0) {
    return false;
  }

  // Check each pattern
  for (const pattern of patterns) {
    if (typeof pattern !== 'string') {
      continue;
    }

    // Exact match (case-insensitive for common keywords)
    if (target.toLowerCase() === pattern.toLowerCase()) {
      return true;
    }

    // Check if target starts with the pattern (for path patterns like "path/to/")
    if (pattern.endsWith('/') && target.startsWith(pattern)) {
      return true;
    }

    // Word-boundary substring match: check if pattern appears as a complete word/segment
    // This prevents "link" from matching "unlinked.md" or "TODO" from matching "PHOTODOC.md"
    // Uses word boundaries defined by: start/end of string, hyphens, underscores, dots, slashes
    const wordBoundaryPattern = new RegExp(
      `(^|[-_./])${escapeRegExp(pattern)}([-_./]|$)`,
      'i'
    );
    if (wordBoundaryPattern.test(target)) {
      return true;
    }
  }

  return false;
}

describe('placeholder detection logic', () => {
  const defaultPatterns = [
    'URL',
    'link',
    'PLACEHOLDER',
    'TODO',
    'XXX',
    'path/to/',
    'example.com'
  ];

  describe('exact matches (case-insensitive)', () => {
    test('should match URL placeholder', () => {
      expect(isPlaceholder('URL', defaultPatterns)).toBe(true);
      expect(isPlaceholder('url', defaultPatterns)).toBe(true);
      expect(isPlaceholder('Url', defaultPatterns)).toBe(true);
    });

    test('should match link placeholder', () => {
      expect(isPlaceholder('link', defaultPatterns)).toBe(true);
      expect(isPlaceholder('LINK', defaultPatterns)).toBe(true);
      expect(isPlaceholder('Link', defaultPatterns)).toBe(true);
    });

    test('should match PLACEHOLDER', () => {
      expect(isPlaceholder('PLACEHOLDER', defaultPatterns)).toBe(true);
      expect(isPlaceholder('placeholder', defaultPatterns)).toBe(true);
      expect(isPlaceholder('Placeholder', defaultPatterns)).toBe(true);
    });

    test('should match TODO', () => {
      expect(isPlaceholder('TODO', defaultPatterns)).toBe(true);
      expect(isPlaceholder('todo', defaultPatterns)).toBe(true);
      expect(isPlaceholder('Todo', defaultPatterns)).toBe(true);
    });

    test('should match XXX', () => {
      expect(isPlaceholder('XXX', defaultPatterns)).toBe(true);
      expect(isPlaceholder('xxx', defaultPatterns)).toBe(true);
      expect(isPlaceholder('Xxx', defaultPatterns)).toBe(true);
    });
  });

  describe('substring matches', () => {
    test('should match files containing PLACEHOLDER', () => {
      expect(isPlaceholder('PLACEHOLDER.md', defaultPatterns)).toBe(true);
      expect(isPlaceholder('my-PLACEHOLDER-file.md', defaultPatterns)).toBe(true);
      expect(isPlaceholder('PLACEHOLDER', defaultPatterns)).toBe(true);
    });

    test('should match files containing TODO', () => {
      expect(isPlaceholder('TODO.md', defaultPatterns)).toBe(true);
      expect(isPlaceholder('project-TODO.md', defaultPatterns)).toBe(true);
      expect(isPlaceholder('TODO-list.md', defaultPatterns)).toBe(true);
    });

    test('should match files containing XXX', () => {
      expect(isPlaceholder('adr-XXX-title.md', defaultPatterns)).toBe(true);
      expect(isPlaceholder('XXX.md', defaultPatterns)).toBe(true);
      expect(isPlaceholder('template-XXX.md', defaultPatterns)).toBe(true);
    });
  });

  describe('path pattern matches', () => {
    test('should match paths starting with path/to/', () => {
      expect(isPlaceholder('path/to/file.md', defaultPatterns)).toBe(true);
      expect(isPlaceholder('path/to/image.png', defaultPatterns)).toBe(true);
      expect(isPlaceholder('path/to/nested/deep/file.txt', defaultPatterns)).toBe(true);
    });

    test('should not match paths that only contain path/to/ as non-prefix substring', () => {
      // Path prefix patterns only match at the start
      expect(isPlaceholder('some/path/to/file.md', defaultPatterns)).toBe(false);
    });
  });

  describe('non-matches', () => {
    test('should not match real file paths', () => {
      expect(isPlaceholder('README.md', defaultPatterns)).toBe(false);
      expect(isPlaceholder('docs/guide.md', defaultPatterns)).toBe(false);
      expect(isPlaceholder('src/index.js', defaultPatterns)).toBe(false);
    });

    test('should not match when pattern is embedded within a word', () => {
      // Word boundary prevents false positives
      expect(isPlaceholder('mylink', defaultPatterns)).toBe(false); // "link" embedded
      expect(isPlaceholder('linked', defaultPatterns)).toBe(false); // "link" embedded
      expect(isPlaceholder('linking.md', defaultPatterns)).toBe(false); // "link" embedded
      expect(isPlaceholder('unlinked-page.md', defaultPatterns)).toBe(false); // "link" embedded
      expect(isPlaceholder('urlparse.md', defaultPatterns)).toBe(false); // "url" embedded
      expect(isPlaceholder('PHOTODOC.md', defaultPatterns)).toBe(false); // Should NOT match "TODO"
    });

    test('should match when pattern appears at word boundaries regardless of case', () => {
      // Case-insensitive matching means "TODO" matches "todo" at word boundaries
      expect(isPlaceholder('my-todo-list.md', defaultPatterns)).toBe(true); // "todo" at hyphen boundary
      expect(isPlaceholder('project_todo.md', defaultPatterns)).toBe(true); // "todo" at underscore boundary
      expect(isPlaceholder('todo.md', defaultPatterns)).toBe(true); // Exact match
    });

    test('should match when pattern is a complete word segment', () => {
      // These SHOULD match because pattern is at word boundary
      expect(isPlaceholder('link.md', defaultPatterns)).toBe(true); // Exact + boundary
      expect(isPlaceholder('my-link.md', defaultPatterns)).toBe(true); // Hyphen boundary
      expect(isPlaceholder('project_link.md', defaultPatterns)).toBe(true); // Underscore boundary
      expect(isPlaceholder('docs/link/file.md', defaultPatterns)).toBe(true); // Slash boundary
    });

    test('should not match empty strings', () => {
      expect(isPlaceholder('', defaultPatterns)).toBe(false);
    });

    test('should not match when patterns array is empty', () => {
      expect(isPlaceholder('URL', [])).toBe(false);
      expect(isPlaceholder('PLACEHOLDER', [])).toBe(false);
    });
  });

  describe('custom patterns', () => {
    test('should match custom placeholder patterns', () => {
      const customPatterns = ['CUSTOM', 'EXAMPLE', 'TEMPLATE'];

      expect(isPlaceholder('CUSTOM.md', customPatterns)).toBe(true);
      expect(isPlaceholder('EXAMPLE', customPatterns)).toBe(true);
      expect(isPlaceholder('file-TEMPLATE.md', customPatterns)).toBe(true);
    });

    test('should work with mixed case patterns', () => {
      const customPatterns = ['MyPattern', 'AnotherOne'];

      expect(isPlaceholder('mypattern', customPatterns)).toBe(true);
      expect(isPlaceholder('MYPATTERN', customPatterns)).toBe(true);
      expect(isPlaceholder('anotherone', customPatterns)).toBe(true);
    });

    test('should work with path-based custom patterns', () => {
      const customPatterns = ['templates/', 'examples/'];

      expect(isPlaceholder('templates/form.html', customPatterns)).toBe(true);
      expect(isPlaceholder('examples/code.js', customPatterns)).toBe(true);
    });
  });

  describe('edge cases', () => {
    test('should handle null or undefined target', () => {
      expect(isPlaceholder(null, defaultPatterns)).toBe(false);
      expect(isPlaceholder(undefined, defaultPatterns)).toBe(false);
    });

    test('should handle null or undefined patterns', () => {
      expect(isPlaceholder('URL', null)).toBe(false);
      expect(isPlaceholder('URL', undefined)).toBe(false);
    });

    test('should handle non-array patterns', () => {
      expect(isPlaceholder('URL', 'not-an-array')).toBe(false);
      expect(isPlaceholder('URL', { pattern: 'URL' })).toBe(false);
    });

    test('should skip non-string patterns in array', () => {
      const mixedPatterns = ['URL', null, undefined, 123, 'PLACEHOLDER'];
      expect(isPlaceholder('URL', mixedPatterns)).toBe(true);
      expect(isPlaceholder('PLACEHOLDER', mixedPatterns)).toBe(true);
    });

    test('should handle special regex characters in patterns', () => {
      const patterns = ['file.md', 'path[0]', 'name(1)'];

      // These should work as literal string matches, not regex
      expect(isPlaceholder('file.md', patterns)).toBe(true);
      expect(isPlaceholder('path[0]', patterns)).toBe(true);
      expect(isPlaceholder('name(1)', patterns)).toBe(true);
    });

    test('should handle patterns with slashes', () => {
      const patterns = ['docs/api/', 'src/lib/'];

      expect(isPlaceholder('docs/api/endpoint.md', patterns)).toBe(true);
      expect(isPlaceholder('src/lib/utils.js', patterns)).toBe(true);
    });
  });

  describe('real-world documentation patterns', () => {
    test('should match common documentation placeholders', () => {
      const docPatterns = ['URL', 'link', 'PLACEHOLDER', 'TODO', 'XXX', 'path/to/', 'example.com'];

      // From issue examples
      expect(isPlaceholder('URL', docPatterns)).toBe(true);
      expect(isPlaceholder('link', docPatterns)).toBe(true);
      expect(isPlaceholder('existing-file.md', docPatterns)).toBe(false);
      expect(isPlaceholder('path/to/image.png', docPatterns)).toBe(true);
      expect(isPlaceholder('PLACEHOLDER.md', docPatterns)).toBe(true);
      expect(isPlaceholder('TODO.md', docPatterns)).toBe(true);
      expect(isPlaceholder('adr-XXX-title.md', docPatterns)).toBe(true);
    });

    test('should distinguish between placeholders and real files', () => {
      const patterns = ['URL', 'link', 'PLACEHOLDER', 'TODO', 'XXX'];

      // Real files should not match
      expect(isPlaceholder('api-guide.md', patterns)).toBe(false);
      expect(isPlaceholder('user-manual.md', patterns)).toBe(false);
      expect(isPlaceholder('installation.md', patterns)).toBe(false);

      // Placeholders should match
      expect(isPlaceholder('TODO.md', patterns)).toBe(true);
      expect(isPlaceholder('PLACEHOLDER.md', patterns)).toBe(true);
    });
  });

  describe('performance characteristics', () => {
    test('should handle large pattern arrays efficiently', () => {
      const largePatternArray = Array.from({ length: 100 }, (_, i) => `pattern${i}`);
      largePatternArray.push('MATCH');

      expect(isPlaceholder('MATCH', largePatternArray)).toBe(true);
      expect(isPlaceholder('nomatch', largePatternArray)).toBe(false);
    });

    test('should handle long target strings with word boundaries', () => {
      const patterns = ['PLACEHOLDER'];
      // With word boundaries, pattern needs to be at a boundary
      const longTarget = 'a'.repeat(1000) + '-PLACEHOLDER-' + 'b'.repeat(1000);
      expect(isPlaceholder(longTarget, patterns)).toBe(true);

      // Without word boundaries, embedded pattern won't match
      const embeddedTarget = 'a'.repeat(1000) + 'PLACEHOLDER' + 'b'.repeat(1000);
      expect(isPlaceholder(embeddedTarget, patterns)).toBe(false);
    });
  });
});

// Export for use in integration tests
export { isPlaceholder };
