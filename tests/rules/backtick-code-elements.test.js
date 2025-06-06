import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, test, expect } from '@jest/globals';
import { lint } from 'markdownlint/promise';
import backtickRule from '../../.vscode/custom-rules/backtick-code-elements.js';
import { parseFixture } from '../utils/fixture.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturePath = path.join(
  __dirname,
  '../fixtures/backtick/basic.fixture.md'
);


describe('backtick-code-elements rule', () => {
  const { passingLines, failingLines } = parseFixture(fixturePath);

  test('detects unwrapped code elements', async () => {
    const options = {
      customRules: [backtickRule],
      files: [fixturePath],
      resultVersion: 3
    };

    const results = await lint(options);
    const violations = results[fixturePath] || [];
    const ruleViolations = violations.filter(v =>
      v.ruleNames.includes('backtick-code-elements') || v.ruleNames.includes('BCE001')
    );

    const failingNumbers = ruleViolations.map(v => v.lineNumber);
    failingLines.forEach(line => {
      expect(failingNumbers).toContain(line);
    });
    passingLines.forEach(line => {
      expect(failingNumbers).not.toContain(line);
    });
  });

  test('provides descriptive error details', async () => {
    const options = {
      customRules: [backtickRule],
      files: [fixturePath],
      resultVersion: 3
    };

    const results = await lint(options);
    const violations = results[fixturePath] || [];

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
