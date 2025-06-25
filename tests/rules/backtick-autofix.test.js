import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { lint } from 'markdownlint/promise';
import { applyFixes } from 'markdownlint';
import backtickRule from '../../.vscode/custom-rules/backtick-code-elements.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturePath = path.join(
  __dirname,
  '../fixtures/backtick/autofix.fixture.md'
);
const expectedFixedPath = path.join(
  __dirname,
  '../fixtures/backtick/autofix.fixed.md'
);

describe('backtick-code-elements auto-fix functionality', () => {
  let fixtureContent;
  let expectedFixedContent;
  let tempFilePath;

  beforeAll(() => {
    fixtureContent = fs.readFileSync(fixturePath, 'utf8');
    expectedFixedContent = fs.readFileSync(expectedFixedPath, 'utf8');
    
    // Create a temporary file for testing fixes
    tempFilePath = path.join(os.tmpdir(), `autofix-test-${Date.now()}.md`);
    fs.writeFileSync(tempFilePath, fixtureContent, 'utf8');
  });

  afterAll(() => {
    // Clean up temporary file
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  });

  test('applies auto-fixes correctly', async () => {
    const options = {
      customRules: [backtickRule],
      files: [tempFilePath],
      resultVersion: 3,
      fix: true // Enable fix mode
    };
    
    const results = await lint(options);
    const ruleFixes = (results[tempFilePath] || []).filter(v =>
      v.ruleNames.includes('backtick-code-elements') ||
      v.ruleNames.includes('BCE001')
    );
    const fixed = applyFixes(fixtureContent, ruleFixes);
    fs.writeFileSync(tempFilePath, fixed, 'utf8');
    const fixedContent = fs.readFileSync(tempFilePath, 'utf8');
    
    // Compare with expected content
    expect(fixedContent).toBe(expectedFixedContent);
  });

  test('correctly identifies violations', async () => {
    // Reset the temp file to original content for the second test
    fs.writeFileSync(tempFilePath, fixtureContent, 'utf8');
    
    const options = {
      customRules: [backtickRule],
      files: [tempFilePath],
      resultVersion: 3,
      fix: false // Disable fix mode to just check violations
    };
    
    const results = await lint(options);
    
    // Check that violations were found (confirming the test is valid)
    const violations = results[tempFilePath] || [];
    const ruleViolations = violations.filter(v =>
      v.ruleNames.includes('backtick-code-elements') ||
      v.ruleNames.includes('BCE001')
    );
    expect(ruleViolations.length).toBeGreaterThan(0);
  });

  test('applies auto-fixes for minimal single-violation-per-line fixture', async () => {
    const minimalFixturePath = path.join(
      __dirname,
      '../fixtures/backtick/autofix-minimal.fixture.md'
    );
    const minimalExpectedPath = path.join(
      __dirname,
      '../fixtures/backtick/autofix-minimal.fixed.md'
    );
    const minimalFixtureContent = fs.readFileSync(minimalFixturePath, 'utf8');
    const minimalExpectedContent = fs.readFileSync(minimalExpectedPath, 'utf8');
    const minimalTempFilePath = path.join(os.tmpdir(), `autofix-minimal-test-${Date.now()}.md`);
    fs.writeFileSync(minimalTempFilePath, minimalFixtureContent, 'utf8');

    const results = await lint({
      customRules: [backtickRule],
      files: [minimalTempFilePath],
      resultVersion: 3,
      fix: true
    });
    const minimalFixes = (results[minimalTempFilePath] || []).filter(v =>
      v.ruleNames.includes('backtick-code-elements') ||
      v.ruleNames.includes('BCE001')
    );
    const fixed = applyFixes(minimalFixtureContent, minimalFixes);
    fs.writeFileSync(minimalTempFilePath, fixed, 'utf8');
    const fixedContent = fs.readFileSync(minimalTempFilePath, 'utf8');
    expect(fixedContent).toBe(minimalExpectedContent);

    // Clean up
    if (fs.existsSync(minimalTempFilePath)) {
      fs.unlinkSync(minimalTempFilePath);
    }
  });
});
