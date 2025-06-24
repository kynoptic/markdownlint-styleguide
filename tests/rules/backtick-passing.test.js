import path from 'path';
import { fileURLToPath } from 'url';
import { describe, test, expect } from '@jest/globals';
import { lint } from 'markdownlint/promise';
import backtickRule from '../../.vscode/custom-rules/backtick-code-elements.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturePath = path.join(
  __dirname,
  '../fixtures/backtick/passing.fixture.md'
);

describe('backtick-code-elements passing fixture', () => {
  test('does not flag valid lines', async () => {
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
    expect(ruleViolations).toHaveLength(0);
  });
});

test('does not flag regular prose like "pass/fail" as a file path', async () => {
  const markdown = 'The result was pass/fail for all subjects.';
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
  expect(ruleViolations).toHaveLength(0);
});
// [CASCADE FEATURE TEST END]

test('does not flag common non-code term "et al." as missing backticks', async () => {
  const markdown = 'As described by Smith et al., the results were significant.';
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
  expect(ruleViolations).toHaveLength(0);
});
