import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, test, expect, beforeAll } from '@jest/globals';
import { lint } from 'markdownlint/promise';
import sentenceCaseHeadingRule from '../../.vscode/custom-rules/sentence-case-heading.js';
import { parseFixture } from '../utils/fixture.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const failingFixture = path.join(
  __dirname,
  '../fixtures/sentence-case/failing.fixture.md'
);
const passingFixture = path.join(
  __dirname,
  '../fixtures/sentence-case/passing.fixture.md'
);


describe('emoji sentence-case-heading rule', () => {
  const failingParse = parseFixture(failingFixture);
  const passingParse = parseFixture(passingFixture);
  const fixtureLinesFail = fs.readFileSync(failingFixture, 'utf8').split('\n');
  const fixtureLinesPass = fs.readFileSync(passingFixture, 'utf8').split('\n');
const headingCases = [];
failingParse.failingLines.forEach(lineNumber => {
  const match = fixtureLinesFail[lineNumber - 1].match(/^#+\s*([^<]+)/);
  if (match) {
    headingCases.push({
      filePath: failingFixture,
      lineNumber,
      headingText: match[1].trim(),
      expectViolation: true
    });
  }
});
passingParse.passingLines.forEach(lineNumber => {
  const match = fixtureLinesPass[lineNumber - 1].match(/^#+\s*([^<]+)/);
  if (match) {
    headingCases.push({
      filePath: passingFixture,
      lineNumber,
      headingText: match[1].trim(),
      expectViolation: false
    });
  }
});

  let violationsFail;
  let violationsPass;

  beforeAll(async () => {
    const options = {
      customRules: [sentenceCaseHeadingRule],
      files: [failingFixture, passingFixture],
      resultVersion: 3
    };

    const results = await lint(options);
    const violFail = results[failingFixture] || [];
    const violPass = results[passingFixture] || [];
    violationsFail = violFail.filter(v =>
      v.ruleNames.includes('sentence-case-heading') || v.ruleNames.includes('SC001')
    );
    violationsPass = violPass.filter(v =>
      v.ruleNames.includes('sentence-case-heading') || v.ruleNames.includes('SC001')
    );
  });

  test.each(headingCases)('line %i: "%s"', ({ filePath, lineNumber, headingText, expectViolation }) => {
    const list = filePath === failingFixture ? violationsFail : violationsPass;
    const hasViolation = list.some(v => v.lineNumber === lineNumber);
    expect(hasViolation).toBe(expectViolation);
  });
});
