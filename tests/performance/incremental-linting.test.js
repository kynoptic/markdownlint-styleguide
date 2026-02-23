/**
 * Performance benchmarks for incremental linting
 * Validates that cached linting achieves 50%+ improvement for unchanged files
 */
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
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

/** Generate a large markdown document with many sections */
function generateLargeDocument(sections = 500) {
  const parts = ['# Performance benchmark document\n\n'];

  for (let i = 1; i <= sections; i++) {
    parts.push(`## Section ${i}: Working with APIs and database systems\n\n`);
    parts.push(`This section discusses API integration patterns for section ${i}.\n\n`);
    parts.push('Key points:\n\n');
    parts.push('- Configure your database settings properly\n');
    parts.push('- Run the setup script before starting development\n');
    parts.push('- Use the API endpoint for fetching data\n');
    parts.push('- Check the utility functions for helpers\n\n');

    for (let j = 1; j <= 2; j++) {
      parts.push(`### ${i}.${j} Implementation details for modern applications\n\n`);
      parts.push(`Implementation guidance for section ${i}.${j}.\n\n`);
      parts.push('```javascript\n');
      parts.push('const config = require("./config.json");\n');
      parts.push('```\n\n');
    }
  }

  return parts.join('');
}

describe('Incremental linting performance benchmarks', () => {
  let tempDir;
  let cacheDir;
  let largeFilePath;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'incr-perf-test-'));
    cacheDir = path.join(tempDir, '.markdownlint-cache');

    // Generate a 10k+ line document
    const content = generateLargeDocument(500);
    largeFilePath = path.join(tempDir, 'large-doc.md');
    fs.writeFileSync(largeFilePath, content);

    const lineCount = content.split('\n').length;
    console.log(`Generated test document: ${lineCount} lines, ${content.length} chars`);
    expect(lineCount).toBeGreaterThan(10000);
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('test_should_achieve_50_percent_improvement_for_unchanged_files', async () => {
    const opts = {
      files: [largeFilePath],
      customRules: rules,
      config: testConfig,
      markdownItFactory,
      cache: { enabled: true, location: cacheDir }
    };

    // Cold run — full lint, populates cache
    const coldStart = process.hrtime.bigint();
    const coldResults = await cachedLint(opts);
    const coldEnd = process.hrtime.bigint();
    const coldDuration = Number(coldEnd - coldStart) / 1_000_000;

    expect(coldResults[largeFilePath]).toBeDefined();

    // Warm run — cached, should be significantly faster
    const warmStart = process.hrtime.bigint();
    const warmResults = await cachedLint(opts);
    const warmEnd = process.hrtime.bigint();
    const warmDuration = Number(warmEnd - warmStart) / 1_000_000;

    expect(warmResults[largeFilePath]).toBeDefined();

    // Results should be identical
    expect(warmResults[largeFilePath]).toEqual(coldResults[largeFilePath]);

    const improvement = ((coldDuration - warmDuration) / coldDuration) * 100;

    console.log(`Cold run: ${coldDuration.toFixed(2)}ms`);
    console.log(`Warm run (cached): ${warmDuration.toFixed(2)}ms`);
    console.log(`Improvement: ${improvement.toFixed(1)}%`);

    // Must achieve at least 50% improvement
    expect(improvement).toBeGreaterThan(50);
  }, 30000);

  test('test_should_maintain_correctness_after_file_change', async () => {
    const changingFile = path.join(tempDir, 'changing.md');
    fs.writeFileSync(changingFile, '# Clean document\n\nNo issues here.\n');

    const opts = {
      files: [changingFile],
      customRules: rules,
      config: testConfig,
      markdownItFactory,
      cache: { enabled: true, location: cacheDir }
    };

    // Populate cache
    const run1 = await cachedLint(opts);
    const violations1 = (run1[changingFile] || []).length;

    // Introduce violations
    fs.writeFileSync(changingFile, [
      '# Now This Has Title Case Issues Here',
      '',
      'Run npm install to set things up.',
      ''
    ].join('\n'));

    // Should detect changes and re-lint
    const run2 = await cachedLint(opts);
    const violations2 = (run2[changingFile] || []).length;

    expect(violations2).toBeGreaterThan(violations1);
  });

  test('test_should_handle_multiple_files_efficiently', async () => {
    // Create 20 files
    const files = [];
    for (let i = 0; i < 20; i++) {
      const fp = path.join(tempDir, `multi-${i}.md`);
      fs.writeFileSync(fp, `# Document ${i}\n\nContent for document ${i}.\n`);
      files.push(fp);
    }

    const opts = {
      files,
      customRules: rules,
      config: testConfig,
      markdownItFactory,
      cache: { enabled: true, location: cacheDir }
    };

    // Cold run
    const coldStart = process.hrtime.bigint();
    await cachedLint(opts);
    const coldDuration = Number(process.hrtime.bigint() - coldStart) / 1_000_000;

    // Warm run
    const warmStart = process.hrtime.bigint();
    await cachedLint(opts);
    const warmDuration = Number(process.hrtime.bigint() - warmStart) / 1_000_000;

    console.log(`Multi-file cold: ${coldDuration.toFixed(2)}ms, warm: ${warmDuration.toFixed(2)}ms`);

    // Warm run should be faster
    expect(warmDuration).toBeLessThan(coldDuration);
  });
});
