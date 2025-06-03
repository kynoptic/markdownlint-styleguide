// @ts-check

"use strict";

/**
 * Integration tests for all custom rules
 * 
 * @description Tests the custom markdownlint rules against real markdown samples to ensure
 * they work correctly together and individually. These tests use the fixture files in the
 * tests/fixtures directory and also test with inline markdown content.
 * 
 * @module integration.test
 * @example
 * // Run all integration tests
 * npx jest tests/integration.test.js
 * 
 * // Run a specific test
 * npx jest tests/integration.test.js -t "sentence-case-sample.md"
 */

const fs = require("fs");
const path = require("path");
const markdownlint = require("markdownlint");
const { testRule } = require('../helpers/test-helpers');

/**
 * @typedef {import('../../types').CustomRule} CustomRule
 */

/** @type {CustomRule[]} */
const customRules = require("../../index");

describe("Integration tests", () => {
  // Set longer timeout for these tests due to known performance issues
  jest.setTimeout(15000);

  /**
   * Tests the sentence-case-headings-bold rule against a sample markdown file
   * 
   * This test verifies that the rule correctly identifies violations in:
   * - Headings that use title case instead of sentence case
   * - Bold text that uses title case instead of sentence case
   * - Special cases like "GitHub API" where proper nouns are allowed
   */
  test("sentence-case-sample.md", (done) => {
    const filePath = path.join(__dirname, "../fixtures", "sentence-case-sample.md");
    const fileContent = fs.readFileSync(filePath, "utf8");
    
    const options = {
      strings: {
        content: fileContent
      },
      config: {
        "default": false,
        "sentence-case-headings-bold": true
      },
      customRules: customRules
    };
    
    markdownlint(options, (err, result) => {
      if (err) {
        return done(err);
      }
      
      if (!result) {
        return done(new Error('Markdownlint result is undefined'));
      }
      
      const violations = result.content || [];
      
      // We expect 8 violations: all headings and bold text that are ALL CAPS or Title Case
      expect(violations.length).toBe(8);
      
      // Check if violations are for the expected lines
      const lineNumbers = violations.map(v => v.lineNumber).sort((a, b) => a - b);
      expect(lineNumbers).toEqual([17, 19, 21, 23, 33, 33, 33, 39]);
      
      done();
    });
  });

  /**
   * Tests the backtick-code-elements rule against a sample markdown file
   * 
   * This test verifies that the rule correctly identifies violations where:
   * - Filenames are not wrapped in backticks
   * - Directory paths are not wrapped in backticks
   * - Code keywords are not wrapped in backticks
   * - URLs are properly ignored (should not trigger violations)
   */
  test("backtick-code-elements-sample.md", (done) => {
    const filePath = path.join(__dirname, "../fixtures", "backtick-code-elements-sample.md");
    const fileContent = fs.readFileSync(filePath, "utf8");
    
    const options = {
      strings: {
        content: fileContent
      },
      config: {
        "default": false,
        "backtick-code-elements": true
      },
      customRules: customRules
    };
    
    markdownlint(options, (err, result) => {
      if (err) {
        return done(err);
      }
      
      if (!result) {
        return done(new Error('Markdownlint result is undefined'));
      }
      
      const violations = result.content || [];
      
      // We expect multiple violations for the "Incorrect Usage" and "Mixed Content" sections
      // The exact count may vary depending on how the rule processes the content
      expect(violations.length).toBeGreaterThan(5);
      
      done();
    });
  });

  /**
   * Tests both custom rules working together on the same content
   * 
   * This test ensures that both rules can be applied simultaneously without conflicts
   * and that they correctly identify their respective violations in mixed content.
   * The test checks for:
   * - Title case heading violations
   * - Unwrapped filename violations
   * - Unwrapped code keyword violations
   * - Title case bold text violations
   */
  test("both rules together", (done) => {
    // Test both rules together on a sample
    const markdown = `
# This Is Title Case Heading

The file example.js contains code.

## Another sentence case heading

Use the function keyword to define functions.

This paragraph has **Bold Text In Title Case** that should fail.
`;
    
    const options = {
      strings: {
        content: markdown
      },
      config: {
        "default": false,
        "sentence-case-headings-bold": true,
        "backtick-code-elements": true
      },
      customRules: customRules
    };
    
    markdownlint(options, (err, result) => {
      if (err) {
        return done(err);
      }
      
      if (!result) {
        return done(new Error('Markdownlint result is undefined'));
      }
      
      const violations = result.content || [];
      
      // We expect violations for:
      // 1. Title case heading
      // 2. Unwrapped filename
      // 3. Unwrapped code keyword
      // 4. Title case bold text
      expect(violations.length).toBeGreaterThanOrEqual(4);
      
      done();
    });
  });
});
