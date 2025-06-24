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
  '../fixtures/backtick/failing.fixture.md'
);

describe('backtick-code-elements failing fixture', () => {
  const failingLines = parseFixture(fixturePath).failingLines;

  test('flags unwrapped code elements', async () => {
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
    const numbers = ruleViolations.map(v => v.lineNumber);
    failingLines.forEach(line => expect(numbers).toContain(line));
  });

  test('provides descriptive details', async () => {
    const options = {
      customRules: [backtickRule],
      files: [fixturePath],
      resultVersion: 3
    };
    const results = await lint(options);
    const ruleViolations = (results[fixturePath] || []).filter(v =>
      v.ruleNames.includes('backtick-code-elements') ||
      v.ruleNames.includes('BCE001')
    );
    ruleViolations.forEach(v => {
      expect(v.errorDetail).toMatch(/^Wrap .+ in backticks\.$/);
    });
  });

  test('flags valid file path with uppercase letters as missing backticks', async () => {
    const markdown = 'Open My-Dir/my-file.txt for details.';
    const options = {
      customRules: [backtickRule],
      strings: { 'test.md': markdown },
      resultVersion: 3
    };
    const results = await lint(options);
    const violations = results['test.md'] || [];
    const ruleViolations = violations.filter(v =>
      v.ruleNames.includes('backtick-code-elements') ||
      v.ruleNames.includes('BCE001')
    );
    expect(ruleViolations.length).toBeGreaterThan(0);
  });
});
