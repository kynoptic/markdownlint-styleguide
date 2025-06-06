import path from 'path';
import { fileURLToPath } from 'url';
import { describe, test, expect } from '@jest/globals';
import { lint } from 'markdownlint/promise';
import sentenceRule from '../../.vscode/custom-rules/sentence-case-heading.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturePath = path.join(
  __dirname,
  '../fixtures/sentence-case/passing.fixture.md'
);

describe('sentence-case-heading passing fixture', () => {
  test('does not report violations', async () => {
    const options = {
      customRules: [sentenceRule],
      files: [fixturePath],
      resultVersion: 3
    };
    const results = await lint(options);
    const ruleViolations = (results[fixturePath] || []).filter(v =>
      v.ruleNames.includes('sentence-case-heading') ||
      v.ruleNames.includes('SC001')
    );
    expect(ruleViolations).toHaveLength(0);
  });
});
