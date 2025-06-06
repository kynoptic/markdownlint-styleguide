/**
 * Test file for the sentence-case-heading custom markdownlint rule.
 * Tests the rule against a fixture file containing examples of passing and failing cases.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, test, expect } from '@jest/globals';
import debug from '../../src/logger.js';

// Import markdownlint using the proper ES modules path
import { lint } from 'markdownlint/promise';

// Import the custom rule
import sentenceCaseHeadingRule from '../../.vscode/custom-rules/sentence-case-heading.js';
import { parseFixture } from '../utils/fixture.js';

// Get current file path (ES modules don't have __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the fixture file
const passingFixture = path.join(
  __dirname,
  '../fixtures/sentence-case/passing/basic.fixture.md'
);
const failingFixture = path.join(
  __dirname,
  '../fixtures/sentence-case/failing/basic.fixture.md'
);



describe("sentence-case-heading rule", () => {
  const passFixtureLines = fs.readFileSync(passingFixture, 'utf8').split('\n');
  const failFixtureLines = fs.readFileSync(failingFixture, 'utf8').split('\n');
  const passLines = parseFixture(passingFixture).passingLines;
  const failLines = parseFixture(failingFixture).failingLines;
  const log = debug.extend('tests');
  const headingCases = [];

  passFixtureLines.forEach((line, index) => {
    const match = line.match(/^#+\s*([^<]+)/);
    if (match) {
      const lineNumber = index + 1;
      if (passLines.includes(lineNumber)) {
        headingCases.push({
          filePath: passingFixture,
          lineNumber,
          headingText: match[1].trim(),
          expectViolation: false
        });
      }
    }
  });

  failFixtureLines.forEach((line, index) => {
    const match = line.match(/^#+\s*([^<]+)/);
    if (match) {
      const lineNumber = index + 1;
      if (failLines.includes(lineNumber)) {
        headingCases.push({
          filePath: failingFixture,
          lineNumber,
          headingText: match[1].trim(),
          expectViolation: true
        });
      }
    }
  });

  let violationsFailing;
  let violationsPassing;

  beforeAll(async () => {
    const options = {
      customRules: [sentenceCaseHeadingRule],
      files: [passingFixture, failingFixture],
      resultVersion: 3
    };

    const results = await lint(options);
    const fail = results[failingFixture] || [];
    const pass = results[passingFixture] || [];

    violationsFailing = fail.filter(v =>
      v.ruleNames.includes("sentence-case-heading") || v.ruleNames.includes("SC001")
    );
    violationsPassing = pass.filter(v =>
      v.ruleNames.includes("sentence-case-heading") || v.ruleNames.includes("SC001")
    );

    log('Detected violations:', violationsFailing.map(v => ({
      lineNumber: v.lineNumber,
      detail: v.errorDetail,
      context: v.context
    })));
  });

  test.each(headingCases)(
    'line %i: "%s"',
    ({ filePath, lineNumber, headingText, expectViolation }) => {
      const list = filePath === failingFixture ? violationsFailing : violationsPassing;
      const hasViolation = list.some(v => v.lineNumber === lineNumber);
      expect(hasViolation).toBe(expectViolation);
    }
  );
  
  test("provides appropriate error messages", async () => {
    const options = {
      customRules: [sentenceCaseHeadingRule],
      files: [passingFixture, failingFixture],
      resultVersion: 3
    };

    const results = await lint(options);
    const violationsFail = results[failingFixture] || [];
    const violationsPass = results[passingFixture] || [];
    
    // Filter violations for our specific rule
    const ruleViolations = violationsFail.filter(v =>
      v.ruleNames.includes("sentence-case-heading") || v.ruleNames.includes("SC001")
    );

    expect(
      violationsPass.filter(v =>
        v.ruleNames.includes("sentence-case-heading") || v.ruleNames.includes("SC001")
      )
    ).toHaveLength(0);
    
    // Verify that each violation has an appropriate error message
    ruleViolations.forEach(violation => {
      expect(violation.errorDetail).toBeTruthy();
      // The rule provides one of these four error messages
      expect([
        "Heading's first word should be capitalized.",
        "Only the first letter of the first word in a heading should be capitalized (unless it's a short acronym).",
        "Single-word heading should be capitalized.",
        /Word ".*" in heading should be lowercase./,
        /Word ".*" in heading should be capitalized./,
        "Heading should not be in all caps."
      ].some(pattern => {
        if (pattern instanceof RegExp) {
          return pattern.test(violation.errorDetail);
        }
        return violation.errorDetail === pattern;
      })).toBe(true);
    });

    const fixtureLines = fs.readFileSync(failingFixture, "utf8").split("\n");
    const cssLine = fixtureLines.findIndex(line => line.startsWith("# css")) + 1;
    const cssViolation = ruleViolations.find(v => v.lineNumber === cssLine);
    expect(cssViolation).toBeTruthy();
    expect(cssViolation.errorDetail).toBe("Single-word heading should be capitalized.");
  });
});
