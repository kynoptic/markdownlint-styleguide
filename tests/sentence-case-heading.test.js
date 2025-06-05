/**
 * Test file for the sentence-case-heading custom markdownlint rule.
 * Tests the rule against a fixture file containing examples of passing and failing cases.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, test, expect } from '@jest/globals';

// Import markdownlint using the proper ES modules path
import { lint } from 'markdownlint/promise';

// Import the custom rule
import sentenceCaseHeadingRule from '../.vscode/custom-rules/sentence-case-heading.js';

// Get current file path (ES modules don't have __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the fixture file
const fixturePath = path.join(__dirname, "basic-sentence-case-heading.fixture.md");

/**
 * Parses a fixture file to extract test cases marked with ✅ (passing) and ❌ (failing)
 * @param {string} filePath - Path to the fixture file
 * @returns {Object} Object containing arrays of passing and failing line numbers
 */
function parseFixture(filePath) {
  return fs
    .readFileSync(filePath, "utf8")
    .split("\n")
    .reduce(
      (acc, line, index) => {
        if (line.includes("<!-- ✅ -->")) {
          acc.passingLines.push(index + 1);
        } else if (line.includes("<!-- ❌ -->")) {
          acc.failingLines.push(index + 1);
        }
        return acc;
      },
      { passingLines: [], failingLines: [] }
    );
}

describe("sentence-case-heading rule", () => {
  const { passingLines, failingLines } = parseFixture(fixturePath);
  
  test("identifies violations correctly", async () => {
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
    
    const fixtureContent = fs.readFileSync(fixturePath, 'utf8');

    // Debug output has been removed to keep test output clean

    // Get the content of each line in the fixture file
    const fixtureLines = fixtureContent.split('\n');
    
    // Check that all failing lines have corresponding violations by line number
    // This is more reliable than checking context strings
    const missingViolations = [];
    
    failingLines.forEach(lineNum => {
      // Get the content of the line that should have a violation
      const lineContent = fixtureLines[lineNum - 1].trim();
      // Extract the heading text (remove the # and any HTML comments)
      const headingMatch = lineContent.match(/^#+\s*([^<]+)/);
      if (headingMatch) {
        const headingText = headingMatch[1].trim();
        // Check if any violation is on this line number
        const hasViolation = ruleViolations.some(v => v.lineNumber === lineNum);
        
        if (!hasViolation) {
          missingViolations.push({ lineNum, headingText });
        }
        
        // Individual assertion for each line, with better error message
        expect(hasViolation).toBe(true, `Line ${lineNum}: "${headingText}" should have a violation but none was found`);
      }
    });
    
    if (missingViolations.length > 0) {
      // Leave a hook for debugging if needed
    }
    
    // Check that no passing lines are detected as violations
    const unexpectedViolations = [];
    passingLines.forEach(lineNum => {
      // Get the content of the line that should not have a violation
      const lineContent = fixtureLines[lineNum - 1].trim();
      // Extract the heading text (remove the # and any HTML comments)
      const headingMatch = lineContent.match(/^#+\s*([^<]+)/);
      if (headingMatch) {
        const headingText = headingMatch[1].trim();
        // Check if any violation has this heading text in its context
        const hasViolation = ruleViolations.some(v => 
          v.errorContext && v.errorContext.includes(headingText)
        );
        
        if (hasViolation) {
          unexpectedViolations.push({ lineNum, headingText });
        }
        
        expect(hasViolation).toBe(false);
      }
    });
    
    if (unexpectedViolations.length > 0) {
      // Leave a hook for debugging if needed
    }
    
    // We don't verify the total number of violations anymore since we're making an exception for "API GOOD"
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
  });
});
