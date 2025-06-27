import path from 'path';
import { fileURLToPath } from 'url';
import { describe, test, expect, beforeAll } from '@jest/globals';
import { lint } from 'markdownlint/promise';
import sentenceRule from '../../.vscode/custom-rules/sentence-case-heading.js';
import { parseFixture } from '../utils/fixture.js';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturePath = path.join(
  __dirname,
  '../fixtures/sentence-case/heading/list-items-bold.md'
);

describe('sentence-case-heading list-items-bold fixture', () => {
  const { passingLines, failingLines } = parseFixture(fixturePath);
  let violations = [];
  let fixtureContent = '';

  beforeAll(async () => {
    // Read the fixture content for debugging
    fixtureContent = fs.readFileSync(fixturePath, 'utf8');
    
    const options = {
      customRules: [sentenceRule],
      files: [fixturePath],
      resultVersion: 3,
      // Enable debug logging
      debug: true
    };
    const results = await lint(options);
    violations = (results[fixturePath] || []).filter(v =>
      v.ruleNames.includes('sentence-case-heading') ||
      v.ruleNames.includes('SC001')
    );
    
    // Debug logging
    console.log('Fixture content:\n', fixtureContent);
    console.log('Parsed failing lines:', failingLines);
    console.log('Detected violations:', violations);
  });

  test('passes correctly formatted list items', () => {
    const violatingLines = violations.map(v => v.lineNumber);
    passingLines.forEach(line => expect(violatingLines).not.toContain(line));
  });

  test('reports incorrectly formatted list items', () => {
    const violatingLines = violations.map(v => v.lineNumber);
    
    // Debug output to help diagnose the issue
    if (failingLines.length > 0 && violatingLines.length === 0) {
      console.warn('⚠️ Warning: No violations detected for lines marked as failing');
      console.log('This should be fixed by updating the rule implementation');
      // Not returning here so the test will fail if no violations are detected
    }
    
    failingLines.forEach(line => expect(violatingLines).toContain(line));
  });

  test('provides error messages', () => {
    if (violations.length === 0) {
      console.warn('⚠️ Test skipped: No violations detected');
      return;
    }
    
    violations.forEach(v => {
      expect(v.errorDetail).toBeTruthy();
    });
  });
});
