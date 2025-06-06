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
const fixturePath = path.join(
  __dirname,
  '../fixtures/sentence-case-edge-cases.fixture.md'
);



describe("sentence-case-heading edge cases", () => {
  const { passingLines, failingLines } = parseFixture(fixturePath);
  const log = debug.extend('tests');
  const fixtureLines = fs.readFileSync(fixturePath, 'utf8').split('\n');
  // Build an array of heading cases for easier per-heading assertions
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

    // Filter violations for our specific rule
    ruleViolations = violations.filter(v =>
      v.ruleNames.includes("sentence-case-heading") || v.ruleNames.includes("SC001")
    );

    log('Detected violations:', ruleViolations.map(v => ({
      lineNumber: v.lineNumber,
      detail: v.errorDetail,
      context: v.context
    })));
  });

  headingCases.forEach(({ lineNumber, headingText, expectViolation }) => {
    test(`line ${lineNumber}: "${headingText}"`, () => {
      const hasViolation = ruleViolations.some(v => v.lineNumber === lineNumber);
      expect(hasViolation).toBe(expectViolation);
    });
  });
  test("provides appropriate error messages", async () => {
    const options = {
      customRules: [sentenceCaseHeadingRule],
      files: [fixturePath],
      resultVersion: 3
    };
    
    const results = await lint(options);
    const violations = results[fixturePath] || [];
    
    // Filter violations for our specific rule
    const ruleViolations = violations.filter(v => 
      v.ruleNames.includes("sentence-case-heading") || v.ruleNames.includes("SC001")
    );
    
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

    const fixtureLines = fs.readFileSync(fixturePath, "utf8").split("\n");
  });
});
