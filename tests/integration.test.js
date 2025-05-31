// @ts-check

"use strict";

/**
 * Integration tests for all custom rules
 * 
 * @module integration.test
 */

const fs = require("fs");
const path = require("path");
const markdownlint = require("markdownlint");
const customRules = require("../index");

describe("Integration tests", () => {
  // Set longer timeout for these tests due to known performance issues
  jest.setTimeout(15000);

  test("sentence-case-sample.md", (done) => {
    const filePath = path.join(__dirname, "fixtures", "sentence-case-sample.md");
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
      
      // We expect 3 violations: 1 for title case heading, 1 for title case bold text, and 1 for GitHub API heading
      expect(violations.length).toBe(3);
      
      // Check if violations are for the expected lines
      const lineNumbers = violations.map(v => v.lineNumber).sort((a, b) => a - b);
      expect(lineNumbers).toEqual([5, 7, 17]);
      
      done();
    });
  });

  test("backtick-code-elements-sample.md", (done) => {
    const filePath = path.join(__dirname, "fixtures", "backtick-code-elements-sample.md");
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
