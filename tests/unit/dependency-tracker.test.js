/**
 * Unit tests for cross-file dependency tracker
 * Tests link extraction and dependency graph building for incremental linting
 */
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { extractDependencies, buildDependencyGraph } from '../../src/cache/dependency-tracker.js';

/** Create a temporary directory for test fixtures */
function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'dep-tracker-test-'));
}

/** Remove a directory and its contents */
function removeTempDir(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
}

describe('extractDependencies', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    removeTempDir(tempDir);
  });

  test('test_should_extract_relative_markdown_link_targets', () => {
    const content = [
      '# Guide',
      '',
      'See [API docs](api.md) for details.',
      'Also check [setup](./setup.md).'
    ].join('\n');
    const filePath = path.join(tempDir, 'guide.md');

    const deps = extractDependencies(content, filePath);
    expect(deps).toContain(path.resolve(tempDir, 'api.md'));
    expect(deps).toContain(path.resolve(tempDir, 'setup.md'));
  });

  test('test_should_extract_links_with_anchors', () => {
    const content = 'Read [configuration](config.md#options) first.';
    const filePath = path.join(tempDir, 'readme.md');

    const deps = extractDependencies(content, filePath);
    expect(deps).toContain(path.resolve(tempDir, 'config.md'));
  });

  test('test_should_ignore_external_urls', () => {
    const content = [
      'Visit [Google](https://google.com) for search.',
      'Or [MDN](http://developer.mozilla.org).',
      'Email [us](mailto:test@example.com).'
    ].join('\n');
    const filePath = path.join(tempDir, 'links.md');

    const deps = extractDependencies(content, filePath);
    expect(deps).toHaveLength(0);
  });

  test('test_should_ignore_same_page_anchors', () => {
    const content = 'Jump to [section](#overview) below.';
    const filePath = path.join(tempDir, 'page.md');

    const deps = extractDependencies(content, filePath);
    expect(deps).toHaveLength(0);
  });

  test('test_should_handle_subdirectory_links', () => {
    const content = 'See [deep doc](sub/nested/deep.md) for details.';
    const filePath = path.join(tempDir, 'top.md');

    const deps = extractDependencies(content, filePath);
    expect(deps).toContain(path.resolve(tempDir, 'sub/nested/deep.md'));
  });

  test('test_should_handle_parent_directory_links', () => {
    const subDir = path.join(tempDir, 'docs');
    fs.mkdirSync(subDir);
    const content = 'See [readme](../README.md) for overview.';
    const filePath = path.join(subDir, 'guide.md');

    const deps = extractDependencies(content, filePath);
    expect(deps).toContain(path.resolve(tempDir, 'README.md'));
  });

  test('test_should_deduplicate_links_to_same_file', () => {
    const content = [
      'See [API](api.md) first.',
      'Then [API reference](api.md#reference) again.',
      'And [API overview](api.md#overview).'
    ].join('\n');
    const filePath = path.join(tempDir, 'guide.md');

    const deps = extractDependencies(content, filePath);
    const apiPath = path.resolve(tempDir, 'api.md');
    expect(deps.filter(d => d === apiPath)).toHaveLength(1);
  });

  test('test_should_handle_files_with_no_links', () => {
    const content = '# Simple heading\n\nJust plain text, no links.';
    const filePath = path.join(tempDir, 'simple.md');

    const deps = extractDependencies(content, filePath);
    expect(deps).toHaveLength(0);
  });

  test('test_should_ignore_links_inside_code_blocks', () => {
    const content = [
      '# Example',
      '',
      '```markdown',
      'See [link](other.md) in code block.',
      '```',
      '',
      'Real [link](real.md) outside.'
    ].join('\n');
    const filePath = path.join(tempDir, 'example.md');

    const deps = extractDependencies(content, filePath);
    expect(deps).toContain(path.resolve(tempDir, 'real.md'));
    expect(deps).not.toContain(path.resolve(tempDir, 'other.md'));
  });

  test('test_should_ignore_links_inside_inline_code', () => {
    const content = 'Use `[text](link.md)` syntax for links.';
    const filePath = path.join(tempDir, 'inline.md');

    const deps = extractDependencies(content, filePath);
    expect(deps).toHaveLength(0);
  });

  test('test_should_handle_empty_content', () => {
    const deps = extractDependencies('', path.join(tempDir, 'empty.md'));
    expect(deps).toHaveLength(0);
  });

  test('test_should_handle_directory_links', () => {
    const content = 'See the [examples](examples/) directory.';
    const filePath = path.join(tempDir, 'readme.md');

    const deps = extractDependencies(content, filePath);
    expect(deps).toContain(path.resolve(tempDir, 'examples/'));
  });
});

describe('buildDependencyGraph', () => {
  test('test_should_build_reverse_dependency_map', () => {
    // guide.md depends on api.md and setup.md
    // tutorial.md depends on api.md
    const fileDeps = new Map([
      ['docs/guide.md', ['docs/api.md', 'docs/setup.md']],
      ['docs/tutorial.md', ['docs/api.md']],
      ['docs/api.md', []],
      ['docs/setup.md', []]
    ]);

    const graph = buildDependencyGraph(fileDeps);

    // api.md is depended on by guide.md and tutorial.md
    expect(graph.get('docs/api.md')).toContain('docs/guide.md');
    expect(graph.get('docs/api.md')).toContain('docs/tutorial.md');

    // setup.md is depended on by guide.md only
    expect(graph.get('docs/setup.md')).toContain('docs/guide.md');
    expect(graph.get('docs/setup.md')).toHaveLength(1);
  });

  test('test_should_handle_empty_dependency_map', () => {
    const graph = buildDependencyGraph(new Map());
    expect(graph.size).toBe(0);
  });

  test('test_should_handle_no_cross_dependencies', () => {
    const fileDeps = new Map([
      ['a.md', []],
      ['b.md', []],
      ['c.md', []]
    ]);

    const graph = buildDependencyGraph(fileDeps);
    // No file is depended on by any other
    expect(graph.size).toBe(0);
  });

  test('test_should_handle_self_referencing_files', () => {
    // A file linking to itself should not create a dependency
    const fileDeps = new Map([
      ['self.md', ['self.md']]
    ]);

    const graph = buildDependencyGraph(fileDeps);
    // self.md should not depend on itself for invalidation purposes
    expect(graph.has('self.md')).toBe(false);
  });

  test('test_should_handle_files_depending_on_external_files', () => {
    // guide.md links to a file not in the lint set
    const fileDeps = new Map([
      ['guide.md', ['external/not-in-set.md']]
    ]);

    const graph = buildDependencyGraph(fileDeps);
    expect(graph.get('external/not-in-set.md')).toContain('guide.md');
  });
});
