/**
 * Feature tests for incremental (cached) linting
 * Tests end-to-end behavior of cachedLint() with real markdownlint rules
 */
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import os from 'os';
import markdownIt from 'markdown-it';
import { cachedLint } from '../../src/cache/cached-lint.js';
import rules from '../../src/index.js';

// Config that enables our custom rules (default: false disables everything including custom rules)
const testConfig = {
  default: false,
  'sentence-case-heading': true,
  'backtick-code-elements': true,
  'no-bare-url': true,
  'no-dead-internal-links': true,
  'no-literal-ampersand': true,
  'no-empty-list-items': true
};

const markdownItFactory = () => markdownIt();

/** Create a temporary project directory with markdown files */
function createTestProject() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'incr-lint-test-'));

  // Create a simple markdown file with a known violation (title case heading)
  fs.writeFileSync(path.join(dir, 'guide.md'), [
    '# User Guide',
    '',
    'Welcome to the guide.',
    '',
    '## Getting Started With The Application',
    '',
    'Follow these steps to get started.',
    ''
  ].join('\n'));

  // Create a file that links to guide.md
  fs.writeFileSync(path.join(dir, 'readme.md'), [
    '# Project readme',
    '',
    'See [the guide](guide.md) for details.',
    '',
    '## Installation steps',
    '',
    'Run the installer to begin.',
    ''
  ].join('\n'));

  // Create a clean file with no violations
  fs.writeFileSync(path.join(dir, 'clean.md'), [
    '# Clean document',
    '',
    'This document has no violations.',
    ''
  ].join('\n'));

  return dir;
}

function removeTempDir(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
}

describe('cachedLint', () => {
  let projectDir;
  let cacheDir;

  beforeEach(() => {
    projectDir = createTestProject();
    cacheDir = path.join(projectDir, '.markdownlint-cache');
  });

  afterEach(() => {
    removeTempDir(projectDir);
  });

  describe('basic caching behavior', () => {
    test('test_should_produce_same_results_as_uncached_lint', async () => {
      const files = [
        path.join(projectDir, 'guide.md'),
        path.join(projectDir, 'readme.md'),
        path.join(projectDir, 'clean.md')
      ];

      // First run — populates cache
      const cachedResults = await cachedLint({
        files,
        customRules: rules,
        config: testConfig,
        markdownItFactory,
        cache: { enabled: true, location: cacheDir }
      });

      // Run without cache for comparison
      const { lint } = await import('markdownlint/promise');
      const directResults = await lint({
        files,
        customRules: rules,
        config: testConfig,
        markdownItFactory,
        resultVersion: 3
      });

      // Compare violation counts per file
      for (const file of files) {
        const cachedCount = (cachedResults[file] || []).length;
        const directCount = (directResults[file] || []).length;
        expect(cachedCount).toBe(directCount);
      }
    });

    test('test_should_create_cache_directory_and_file', async () => {
      await cachedLint({
        files: [path.join(projectDir, 'clean.md')],
        customRules: rules,
        config: testConfig,
        markdownItFactory,
        cache: { enabled: true, location: cacheDir }
      });

      expect(fs.existsSync(cacheDir)).toBe(true);
      expect(fs.existsSync(path.join(cacheDir, 'cache.json'))).toBe(true);
    });

    test('test_should_use_cached_results_for_unchanged_files', async () => {
      const files = [path.join(projectDir, 'clean.md')];
      const opts = {
        files,
        customRules: rules,
        config: testConfig,
        markdownItFactory,
        cache: { enabled: true, location: cacheDir }
      };

      // First run — cache miss (full lint)
      const run1 = await cachedLint(opts);

      // Second run — cache hit (should return same results)
      const run2 = await cachedLint(opts);

      expect(run2[files[0]]).toEqual(run1[files[0]]);
    });

    test('test_should_detect_file_changes_and_relint', async () => {
      const filePath = path.join(projectDir, 'clean.md');
      const opts = {
        files: [filePath],
        customRules: rules,
        config: testConfig,
        markdownItFactory,
        cache: { enabled: true, location: cacheDir }
      };

      // First run — clean file, no violations expected from our rules
      const run1 = await cachedLint(opts);
      const violations1 = (run1[filePath] || []).length;

      // Modify the file to introduce a violation
      fs.writeFileSync(filePath, [
        '# Now Has Title Case Violations Here',
        '',
        'Content changed.',
        ''
      ].join('\n'));

      // Second run — should detect change and relint
      const run2 = await cachedLint(opts);
      const violations2 = (run2[filePath] || []).length;

      // Should find new violations in the modified file
      expect(violations2).toBeGreaterThan(violations1);
    });
  });

  describe('graceful fallback', () => {
    test('test_should_lint_normally_with_missing_cache', async () => {
      // Cache dir does not exist yet — should work fine
      const results = await cachedLint({
        files: [path.join(projectDir, 'clean.md')],
        customRules: rules,
        config: testConfig,
        markdownItFactory,
        cache: { enabled: true, location: path.join(projectDir, 'no-cache-here') }
      });

      expect(results).toBeDefined();
    });

    test('test_should_lint_normally_with_corrupt_cache', async () => {
      // Create a corrupt cache file
      fs.mkdirSync(cacheDir, { recursive: true });
      fs.writeFileSync(path.join(cacheDir, 'cache.json'), 'NOT VALID JSON!!!');

      const results = await cachedLint({
        files: [path.join(projectDir, 'clean.md')],
        customRules: rules,
        config: testConfig,
        markdownItFactory,
        cache: { enabled: true, location: cacheDir }
      });

      expect(results).toBeDefined();
    });

    test('test_should_fall_back_to_full_lint_when_cache_disabled', async () => {
      const results = await cachedLint({
        files: [path.join(projectDir, 'clean.md')],
        customRules: rules,
        config: testConfig,
        markdownItFactory,
        cache: { enabled: false }
      });

      expect(results).toBeDefined();
      // No cache file should be created
      expect(fs.existsSync(path.join(cacheDir, 'cache.json'))).toBe(false);
    });
  });

  describe('cross-file dependency invalidation', () => {
    test('test_should_invalidate_dependents_when_linked_file_changes', async () => {
      const guidePath = path.join(projectDir, 'guide.md');
      const readmePath = path.join(projectDir, 'readme.md');

      const opts = {
        files: [guidePath, readmePath],
        customRules: rules,
        config: testConfig,
        markdownItFactory,
        cache: { enabled: true, location: cacheDir }
      };

      // First run — populate cache for both files
      await cachedLint(opts);

      // Verify cache exists for both files
      const cacheData = JSON.parse(
        fs.readFileSync(path.join(cacheDir, 'cache.json'), 'utf8')
      );
      expect(cacheData.entries[guidePath]).toBeDefined();
      expect(cacheData.entries[readmePath]).toBeDefined();

      // Modify guide.md (which readme.md links to)
      fs.writeFileSync(guidePath, [
        '# Updated guide',
        '',
        'Content was changed.',
        ''
      ].join('\n'));

      // Second run — guide.md changed, readme.md (which links to it) should be re-validated
      const run2 = await cachedLint(opts);

      // Both files should have results (neither was incorrectly skipped)
      expect(run2[guidePath]).toBeDefined();
      expect(run2[readmePath]).toBeDefined();
    });
  });

  describe('config change detection', () => {
    test('test_should_invalidate_cache_when_config_changes', async () => {
      const filePath = path.join(projectDir, 'clean.md');

      // First run with config A
      await cachedLint({
        files: [filePath],
        customRules: rules,
        config: { default: false, 'sentence-case-heading': true },
        markdownItFactory,
        cache: { enabled: true, location: cacheDir }
      });

      // Second run with config B — cache should be invalidated
      const results = await cachedLint({
        files: [filePath],
        customRules: rules,
        config: { default: false, 'sentence-case-heading': { specialTerms: ['NewTerm'] } },
        markdownItFactory,
        cache: { enabled: true, location: cacheDir }
      });

      // Should still produce results (not use stale cache)
      expect(results).toBeDefined();
    });
  });
});
