import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, test, expect } from '@jest/globals';
import { lint } from 'markdownlint/promise';
import backtickRule from '../../.vscode/custom-rules/backtick-code-elements.js';
import { parseFixture } from '../utils/fixture.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const failingFixture = path.join(
  __dirname,
  '../fixtures/backtick/failing.fixture.md'
);
const passingFixture = path.join(
  __dirname,
  '../fixtures/backtick/passing.fixture.md'
);


describe('backtick-code-elements rule', () => {
  const failLines = parseFixture(failingFixture).failingLines;
  const passLines = parseFixture(passingFixture).passingLines;

  test('detects unwrapped code elements', async () => {
    const options = {
      customRules: [backtickRule],
      files: [failingFixture],
      resultVersion: 3
    };

    const results = await lint(options);
    const violations = results[failingFixture] || [];
    const ruleViolations = violations.filter(v =>
      v.ruleNames.includes('backtick-code-elements') || v.ruleNames.includes('BCE001')
    );

    const failingNumbers = ruleViolations.map(v => v.lineNumber);
    failLines.forEach(line => {
      expect(failingNumbers).toContain(line);
    });
  });

  test('does not flag wrapped code elements', async () => {
    const options = {
      customRules: [backtickRule],
      files: [passingFixture],
      resultVersion: 3
    };

    const results = await lint(options);
    const violations = results[passingFixture] || [];
    const ruleViolations = violations.filter(v =>
      v.ruleNames.includes('backtick-code-elements') || v.ruleNames.includes('BCE001')
    );

    expect(ruleViolations).toHaveLength(0);
  });

  test('provides descriptive error details', async () => {
    const options = {
      customRules: [backtickRule],
      files: [failingFixture],
      resultVersion: 3
    };

    const results = await lint(options);
    const violations = results[failingFixture] || [];

    const ruleViolations = violations.filter(v =>
      v.ruleNames.includes('backtick-code-elements') ||
      v.ruleNames.includes('BCE001')
    );

    ruleViolations.forEach(v => {
      expect(v.errorDetail).toBeTruthy();
      expect(v.errorDetail).toMatch(/^Wrap .+ in backticks\.$/);
    });
  });
});
