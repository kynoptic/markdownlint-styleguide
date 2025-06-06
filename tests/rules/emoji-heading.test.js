import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, test, expect, beforeAll } from '@jest/globals';
import { lint } from 'markdownlint/promise';
import sentenceCaseHeadingRule from '../../.vscode/custom-rules/sentence-case-heading.js';
import { parseFixture } from '../utils/fixture.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturePath = path.join(
  __dirname,
  '../fixtures/emoji-heading.fixture.md'
);


describe('emoji sentence-case-heading rule', () => {
  const { passingLines, failingLines } = parseFixture(fixturePath);
  const fixtureLines = fs.readFileSync(fixturePath, 'utf8').split('\n');
  const headingCases = fixtureLines.reduce((acc, line, index) => {
    const match = line.match(/^#+\s*([^<]+)/);
    if (match) {
      const lineNumber = index + 1;
      if (passingLines.includes(lineNumber) || failingLines.includes(lineNumber)) {
        acc.push({
          lineNumber,
          headingText: match[1].trim(),
          expectViolation: failingLines.includes(lineNumber)
        });
      }
    }
    return acc;
  }, []);

  let ruleViolations;

  beforeAll(async () => {
    const options = {
      customRules: [sentenceCaseHeadingRule],
      files: [fixturePath],
      resultVersion: 3
    };

    const results = await lint(options);
    const violations = results[fixturePath] || [];
    ruleViolations = violations.filter(v =>
      v.ruleNames.includes('sentence-case-heading') || v.ruleNames.includes('SC001')
    );
  });

  test.each(headingCases)('line %i: "%s"', ({ lineNumber, headingText, expectViolation }) => {
    const hasViolation = ruleViolations.some(v => v.lineNumber === lineNumber);
    expect(hasViolation).toBe(expectViolation);
  });
});
