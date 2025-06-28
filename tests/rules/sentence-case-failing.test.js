import path from 'path';
import { fileURLToPath } from 'url';
import { describe, test, expect, beforeAll } from '@jest/globals';
import { lint } from 'markdownlint/promise';
import sentenceRule from '../../src/rules/sentence-case-heading.js';
import { parseFixture } from '../utils/fixture.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturePath = path.join(
  __dirname,
  '../fixtures/sentence-case/failing.fixture.md'
);

describe('sentence-case-heading failing fixture', () => {
  const failingLines = parseFixture(fixturePath).failingLines;
  let violations = [];

  beforeAll(async () => {
    const options = {
      customRules: [sentenceRule],
      files: [fixturePath],
      resultVersion: 3
    };
    const results = await lint(options);
    violations = (results[fixturePath] || []).filter(v =>
      v.ruleNames.includes('sentence-case-heading') ||
      v.ruleNames.includes('SC001')
    );
  });

  test('reports expected lines', () => {
    const numbers = violations.map(v => v.lineNumber);
    failingLines.forEach(line => expect(numbers).toContain(line));
  });

  test('provides error messages', () => {
    violations.forEach(v => {
      expect(v.errorDetail).toBeTruthy();
    });
  });
});
