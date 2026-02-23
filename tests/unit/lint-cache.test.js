/**
 * Unit tests for lint cache module
 * Tests cache storage, hashing, invalidation, and lookup logic
 */
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { CacheStore, hashContent, hashFile, hashConfig } from '../../src/cache/lint-cache.js';

/** Create a temporary directory for cache tests */
function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'markdownlint-cache-test-'));
}

/** Remove a directory and its contents */
function removeTempDir(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
}

describe('hashContent', () => {
  test('test_should_return_consistent_hash_for_same_content', () => {
    const content = '# Hello world\n\nSome markdown content.';
    const hash1 = hashContent(content);
    const hash2 = hashContent(content);
    expect(hash1).toBe(hash2);
  });

  test('test_should_return_different_hash_for_different_content', () => {
    const hash1 = hashContent('# Hello');
    const hash2 = hashContent('# Goodbye');
    expect(hash1).not.toBe(hash2);
  });

  test('test_should_return_hex_string', () => {
    const hash = hashContent('test');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  test('test_should_handle_empty_string', () => {
    const hash = hashContent('');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  test('test_should_handle_unicode_content', () => {
    const hash = hashContent('# Heading with emoji 🎉 and CJK 你好');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe('hashFile', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    removeTempDir(tempDir);
  });

  test('test_should_hash_file_contents', () => {
    const filePath = path.join(tempDir, 'test.md');
    fs.writeFileSync(filePath, '# Test file\n\nContent here.');
    const hash = hashFile(filePath);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  test('test_should_match_hashContent_for_same_data', () => {
    const content = '# Same content';
    const filePath = path.join(tempDir, 'test.md');
    fs.writeFileSync(filePath, content);
    expect(hashFile(filePath)).toBe(hashContent(content));
  });

  test('test_should_return_null_for_nonexistent_file', () => {
    const hash = hashFile(path.join(tempDir, 'nonexistent.md'));
    expect(hash).toBeNull();
  });

  test('test_should_detect_file_changes', () => {
    const filePath = path.join(tempDir, 'changing.md');
    fs.writeFileSync(filePath, 'version 1');
    const hash1 = hashFile(filePath);
    fs.writeFileSync(filePath, 'version 2');
    const hash2 = hashFile(filePath);
    expect(hash1).not.toBe(hash2);
  });
});

describe('hashConfig', () => {
  test('test_should_return_consistent_hash_for_same_config', () => {
    const config = { 'sentence-case-heading': true, 'backtick-code-elements': true };
    const hash1 = hashConfig(config);
    const hash2 = hashConfig(config);
    expect(hash1).toBe(hash2);
  });

  test('test_should_return_different_hash_for_different_config', () => {
    const config1 = { 'sentence-case-heading': true };
    const config2 = { 'sentence-case-heading': false };
    expect(hashConfig(config1)).not.toBe(hashConfig(config2));
  });

  test('test_should_be_order_independent', () => {
    const config1 = { a: true, b: false };
    const config2 = { b: false, a: true };
    expect(hashConfig(config1)).toBe(hashConfig(config2));
  });

  test('test_should_handle_nested_config', () => {
    const config = {
      'sentence-case-heading': {
        specialTerms: ['API', 'GitHub']
      }
    };
    const hash = hashConfig(config);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  test('test_should_differentiate_configs_with_different_nested_values', () => {
    const config1 = {
      'sentence-case-heading': { specialTerms: ['API'] }
    };
    const config2 = {
      'sentence-case-heading': { specialTerms: ['Different'] }
    };
    expect(hashConfig(config1)).not.toBe(hashConfig(config2));
  });

  test('test_should_be_order_independent_for_nested_keys', () => {
    const config1 = {
      rule: { b: 2, a: 1 }
    };
    const config2 = {
      rule: { a: 1, b: 2 }
    };
    expect(hashConfig(config1)).toBe(hashConfig(config2));
  });

  test('test_should_handle_empty_config', () => {
    const hash = hashConfig({});
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe('CacheStore', () => {
  let tempDir;
  let cachePath;

  beforeEach(() => {
    tempDir = createTempDir();
    cachePath = path.join(tempDir, '.markdownlint-cache');
  });

  afterEach(() => {
    removeTempDir(tempDir);
  });

  describe('constructor and initialization', () => {
    test('test_should_create_cache_directory_if_missing', () => {
      const store = new CacheStore(cachePath);
      store.load();
      expect(fs.existsSync(cachePath)).toBe(true);
    });

    test('test_should_start_with_empty_entries', () => {
      const store = new CacheStore(cachePath);
      store.load();
      expect(store.size).toBe(0);
    });

    test('test_should_load_existing_cache_file', () => {
      // Pre-populate a cache file
      fs.mkdirSync(cachePath, { recursive: true });
      const cacheData = {
        version: 1,
        entries: {
          'docs/guide.md': {
            contentHash: 'abc123',
            ruleVersionHash: 'def456',
            configHash: 'ghi789',
            results: [],
            dependencies: [],
            timestamp: Date.now()
          }
        }
      };
      fs.writeFileSync(
        path.join(cachePath, 'cache.json'),
        JSON.stringify(cacheData)
      );

      const store = new CacheStore(cachePath);
      store.load();
      expect(store.size).toBe(1);
      expect(store.get('docs/guide.md')).toBeTruthy();
    });
  });

  describe('get and set', () => {
    test('test_should_store_and_retrieve_cache_entry', () => {
      const store = new CacheStore(cachePath);
      store.load();

      const entry = {
        contentHash: 'abc',
        ruleVersionHash: 'def',
        configHash: 'ghi',
        results: [{ ruleNames: ['SC001'], lineNumber: 5 }],
        dependencies: [],
        timestamp: Date.now()
      };

      store.set('test.md', entry);
      const retrieved = store.get('test.md');
      expect(retrieved).toEqual(entry);
    });

    test('test_should_return_undefined_for_missing_entry', () => {
      const store = new CacheStore(cachePath);
      store.load();
      expect(store.get('nonexistent.md')).toBeUndefined();
    });

    test('test_should_overwrite_existing_entry', () => {
      const store = new CacheStore(cachePath);
      store.load();

      store.set('test.md', { contentHash: 'old', ruleVersionHash: '', configHash: '', results: [], dependencies: [], timestamp: 0 });
      store.set('test.md', { contentHash: 'new', ruleVersionHash: '', configHash: '', results: [], dependencies: [], timestamp: 0 });

      expect(store.get('test.md').contentHash).toBe('new');
      expect(store.size).toBe(1);
    });
  });

  describe('has', () => {
    test('test_should_return_true_for_existing_entry', () => {
      const store = new CacheStore(cachePath);
      store.load();
      store.set('exists.md', { contentHash: 'abc', ruleVersionHash: '', configHash: '', results: [], dependencies: [], timestamp: 0 });
      expect(store.has('exists.md')).toBe(true);
    });

    test('test_should_return_false_for_missing_entry', () => {
      const store = new CacheStore(cachePath);
      store.load();
      expect(store.has('missing.md')).toBe(false);
    });
  });

  describe('delete', () => {
    test('test_should_remove_entry', () => {
      const store = new CacheStore(cachePath);
      store.load();
      store.set('remove-me.md', { contentHash: 'abc', ruleVersionHash: '', configHash: '', results: [], dependencies: [], timestamp: 0 });
      expect(store.has('remove-me.md')).toBe(true);

      store.delete('remove-me.md');
      expect(store.has('remove-me.md')).toBe(false);
      expect(store.size).toBe(0);
    });

    test('test_should_not_throw_for_missing_entry', () => {
      const store = new CacheStore(cachePath);
      store.load();
      expect(() => store.delete('nonexistent.md')).not.toThrow();
    });
  });

  describe('clear', () => {
    test('test_should_remove_all_entries', () => {
      const store = new CacheStore(cachePath);
      store.load();
      store.set('a.md', { contentHash: 'a', ruleVersionHash: '', configHash: '', results: [], dependencies: [], timestamp: 0 });
      store.set('b.md', { contentHash: 'b', ruleVersionHash: '', configHash: '', results: [], dependencies: [], timestamp: 0 });
      expect(store.size).toBe(2);

      store.clear();
      expect(store.size).toBe(0);
    });
  });

  describe('save and load persistence', () => {
    test('test_should_persist_entries_to_disk', () => {
      const store = new CacheStore(cachePath);
      store.load();
      store.set('persisted.md', {
        contentHash: 'abc',
        ruleVersionHash: 'def',
        configHash: 'ghi',
        results: [{ ruleNames: ['BCE001'], lineNumber: 10, detail: 'test' }],
        dependencies: ['other.md'],
        timestamp: 1708617600000
      });
      store.save();

      // Load in a new store instance
      const store2 = new CacheStore(cachePath);
      store2.load();
      expect(store2.size).toBe(1);
      const entry = store2.get('persisted.md');
      expect(entry.contentHash).toBe('abc');
      expect(entry.results).toHaveLength(1);
      expect(entry.dependencies).toEqual(['other.md']);
    });

    test('test_should_handle_corrupt_cache_file_gracefully', () => {
      fs.mkdirSync(cachePath, { recursive: true });
      fs.writeFileSync(path.join(cachePath, 'cache.json'), '{invalid json!!!');

      const store = new CacheStore(cachePath);
      // Should not throw — falls back to empty cache
      expect(() => store.load()).not.toThrow();
      expect(store.size).toBe(0);
    });

    test('test_should_handle_cache_file_with_wrong_version', () => {
      fs.mkdirSync(cachePath, { recursive: true });
      fs.writeFileSync(
        path.join(cachePath, 'cache.json'),
        JSON.stringify({ version: 999, entries: { 'old.md': {} } })
      );

      const store = new CacheStore(cachePath);
      store.load();
      // Wrong version should be treated as invalid — start fresh
      expect(store.size).toBe(0);
    });

    test('test_should_handle_missing_cache_directory_on_save', () => {
      const deepPath = path.join(tempDir, 'deep', 'nested', 'cache');
      const store = new CacheStore(deepPath);
      store.load();
      store.set('test.md', { contentHash: 'abc', ruleVersionHash: '', configHash: '', results: [], dependencies: [], timestamp: 0 });

      // Should create directories and save without error
      expect(() => store.save()).not.toThrow();
      expect(fs.existsSync(path.join(deepPath, 'cache.json'))).toBe(true);
    });
  });

  describe('isValid', () => {
    test('test_should_return_true_when_all_hashes_match', () => {
      const store = new CacheStore(cachePath);
      store.load();

      store.set('valid.md', {
        contentHash: 'content123',
        ruleVersionHash: 'rule456',
        configHash: 'config789',
        results: [],
        dependencies: [],
        timestamp: Date.now()
      });

      expect(store.isValid('valid.md', 'content123', 'rule456', 'config789')).toBe(true);
    });

    test('test_should_return_false_when_content_hash_differs', () => {
      const store = new CacheStore(cachePath);
      store.load();

      store.set('changed.md', {
        contentHash: 'old_content',
        ruleVersionHash: 'rule456',
        configHash: 'config789',
        results: [],
        dependencies: [],
        timestamp: Date.now()
      });

      expect(store.isValid('changed.md', 'new_content', 'rule456', 'config789')).toBe(false);
    });

    test('test_should_return_false_when_rule_version_hash_differs', () => {
      const store = new CacheStore(cachePath);
      store.load();

      store.set('rule-changed.md', {
        contentHash: 'content123',
        ruleVersionHash: 'old_rule',
        configHash: 'config789',
        results: [],
        dependencies: [],
        timestamp: Date.now()
      });

      expect(store.isValid('rule-changed.md', 'content123', 'new_rule', 'config789')).toBe(false);
    });

    test('test_should_return_false_when_config_hash_differs', () => {
      const store = new CacheStore(cachePath);
      store.load();

      store.set('config-changed.md', {
        contentHash: 'content123',
        ruleVersionHash: 'rule456',
        configHash: 'old_config',
        results: [],
        dependencies: [],
        timestamp: Date.now()
      });

      expect(store.isValid('config-changed.md', 'content123', 'rule456', 'new_config')).toBe(false);
    });

    test('test_should_return_false_for_missing_entry', () => {
      const store = new CacheStore(cachePath);
      store.load();

      expect(store.isValid('missing.md', 'any', 'any', 'any')).toBe(false);
    });
  });

  describe('invalidateDependents', () => {
    test('test_should_invalidate_files_that_depend_on_changed_file', () => {
      const store = new CacheStore(cachePath);
      store.load();

      // guide.md depends on api.md
      store.set('docs/guide.md', {
        contentHash: 'guide_hash',
        ruleVersionHash: 'rule',
        configHash: 'config',
        results: [{ ruleNames: ['DL001'], lineNumber: 5 }],
        dependencies: ['docs/api.md'],
        timestamp: Date.now()
      });

      // api.md has no dependencies
      store.set('docs/api.md', {
        contentHash: 'api_hash',
        ruleVersionHash: 'rule',
        configHash: 'config',
        results: [],
        dependencies: [],
        timestamp: Date.now()
      });

      // Simulate api.md changing — invalidate its dependents
      const invalidated = store.invalidateDependents('docs/api.md');
      expect(invalidated).toContain('docs/guide.md');
      expect(store.has('docs/guide.md')).toBe(false);
      // api.md itself should still exist (it was not a dependent)
      expect(store.has('docs/api.md')).toBe(true);
    });

    test('test_should_handle_transitive_dependencies', () => {
      const store = new CacheStore(cachePath);
      store.load();

      // a.md depends on b.md, b.md depends on c.md
      store.set('a.md', {
        contentHash: 'a', ruleVersionHash: 'r', configHash: 'c',
        results: [], dependencies: ['b.md'], timestamp: Date.now()
      });
      store.set('b.md', {
        contentHash: 'b', ruleVersionHash: 'r', configHash: 'c',
        results: [], dependencies: ['c.md'], timestamp: Date.now()
      });
      store.set('c.md', {
        contentHash: 'c', ruleVersionHash: 'r', configHash: 'c',
        results: [], dependencies: [], timestamp: Date.now()
      });

      // c.md changes — should invalidate b.md (direct) and a.md (transitive)
      const invalidated = store.invalidateDependents('c.md');
      expect(invalidated).toContain('b.md');
      expect(invalidated).toContain('a.md');
    });

    test('test_should_handle_circular_dependencies_without_infinite_loop', () => {
      const store = new CacheStore(cachePath);
      store.load();

      // Circular: a.md -> b.md -> a.md
      store.set('a.md', {
        contentHash: 'a', ruleVersionHash: 'r', configHash: 'c',
        results: [], dependencies: ['b.md'], timestamp: Date.now()
      });
      store.set('b.md', {
        contentHash: 'b', ruleVersionHash: 'r', configHash: 'c',
        results: [], dependencies: ['a.md'], timestamp: Date.now()
      });

      // Should not hang or throw
      const invalidated = store.invalidateDependents('a.md');
      expect(invalidated).toContain('b.md');
    });

    test('test_should_return_empty_array_when_no_dependents', () => {
      const store = new CacheStore(cachePath);
      store.load();

      store.set('standalone.md', {
        contentHash: 's', ruleVersionHash: 'r', configHash: 'c',
        results: [], dependencies: [], timestamp: Date.now()
      });

      const invalidated = store.invalidateDependents('standalone.md');
      expect(invalidated).toEqual([]);
    });
  });

  describe('entries iteration', () => {
    test('test_should_iterate_over_all_entries', () => {
      const store = new CacheStore(cachePath);
      store.load();

      store.set('a.md', { contentHash: 'a', ruleVersionHash: '', configHash: '', results: [], dependencies: [], timestamp: 0 });
      store.set('b.md', { contentHash: 'b', ruleVersionHash: '', configHash: '', results: [], dependencies: [], timestamp: 0 });

      const keys = [];
      for (const [key] of store.entries()) {
        keys.push(key);
      }
      expect(keys).toContain('a.md');
      expect(keys).toContain('b.md');
      expect(keys).toHaveLength(2);
    });
  });
});
