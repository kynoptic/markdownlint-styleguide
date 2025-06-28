import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { lint } from 'markdownlint/promise';
import { applyFixes } from 'markdownlint';
import sentenceRule from '../../src/rules/sentence-case-heading.js';

/**
 * Convert failure markers to passing markers for comparison.
 *
 * @param {string} content - Markdown text to normalize.
 * @returns {string} Text with failure markers replaced.
 */
function normalizeMarkers(content) {
  return content.replace(/<!--\s*❌\s*-->/g, '<!-- ✅ -->');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturePath = path.join(
  __dirname,
  '../fixtures/sentence-case/autofix.fixture.md'
);
const expectedFixedPath = path.join(
  __dirname,
  '../fixtures/sentence-case/autofix.fixed.md'
);

describe('sentence-case-heading auto-fix functionality', () => {
  let fixtureContent;
  let expectedFixedContent;
  let tempFilePath;

  beforeAll(() => {
    fixtureContent = fs.readFileSync(fixturePath, 'utf8');
    expectedFixedContent = fs.readFileSync(expectedFixedPath, 'utf8');
    tempFilePath = path.join(os.tmpdir(), `sc-autofix-${Date.now()}.md`);
    fs.writeFileSync(tempFilePath, fixtureContent, 'utf8');
  });

  afterAll(() => {
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  });

  test('applies auto-fixes correctly', async () => {
    const options = {
      customRules: [sentenceRule],
      files: [tempFilePath],
      resultVersion: 3,
      fix: true
    };

    const results = await lint(options);
    const fixes = (results[tempFilePath] || []).filter(v =>
      v.ruleNames.includes('sentence-case-heading') ||
      v.ruleNames.includes('SC001')
    );
    const fixed = applyFixes(fixtureContent, fixes);
    fs.writeFileSync(tempFilePath, fixed, 'utf8');
    const fixedContent = fs.readFileSync(tempFilePath, 'utf8');
    expect(normalizeMarkers(fixedContent)).toBe(
      normalizeMarkers(expectedFixedContent)
    );
  });

  test('identifies violations in fixture', async () => {
    fs.writeFileSync(tempFilePath, fixtureContent, 'utf8');
    const results = await lint({
      customRules: [sentenceRule],
      files: [tempFilePath],
      resultVersion: 3
    });
    const violations = (results[tempFilePath] || []).filter(v =>
      v.ruleNames.includes('sentence-case-heading') ||
      v.ruleNames.includes('SC001')
    );
    expect(violations.length).toBeGreaterThan(0);
  });
});
