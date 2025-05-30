#!/usr/bin/env node

/**
 * Test script for the sentence-case-headings-bold markdownlint rule
 * 
 * @description This script tests the sentence-case rule against various test cases and reports the results.
 * It provides a lightweight testing framework that mocks the markdownlint environment
 * to validate rule behavior without requiring the full markdownlint test infrastructure.
 * 
 * @module test-markdownlint-rule
 * @example
 * // Run the test script
 * node tests/test-markdownlint-rule.js
 */

const fs = require("fs");
const path = require("path");

// Import the custom rule
const customRule = require("../.markdownlint-rules/sentence-case.js");

/**
 * Mocks the markdownlint environment to test a rule against text
 * 
 * @param {string} text - The markdown text to test
 * @param {Object} rule - The markdownlint rule object to test
 * @returns {Array} - Array of errors found by the rule
 */
function mockMarkdownlint(text, rule) {
  // Split text into lines
  const lines = text.split("\n");

  // Create tokens that mimic markdownlint's token structure
  const tokens = [];
  let lineNumber = 0;

  lines.forEach((line, index) => {
    lineNumber = index + 1;

    // Detect headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = headingMatch[2];

      tokens.push({
        type: "heading_open",
        tag: `h${level}`,
        lineNumber,
      });

      tokens.push({
        type: "inline",
        content,
        lineNumber,
        children: [],
      });

      tokens.push({
        type: "heading_close",
        tag: `h${level}`,
        lineNumber,
      });
    }

    // Detect bold text
    if (line.includes("**")) {
      const inlineToken = {
        type: "inline",
        content: line,
        lineNumber,
        children: [],
      };

      // Find all bold sections
      let boldSections = [];
      let regex = /\*\*([^*]+)\*\*/g;
      let match;

      while ((match = regex.exec(line)) !== null) {
        boldSections.push(match[1]);

        // Add tokens for each bold section
        inlineToken.children.push({
          type: "strong_open",
          lineNumber,
        });

        inlineToken.children.push({
          type: "text",
          content: match[1],
          lineNumber,
        });

        inlineToken.children.push({
          type: "strong_close",
          lineNumber,
        });
      }

      if (boldSections.length > 0) {
        tokens.push(inlineToken);
      }
    }
  });

  // Mock the onError function
  const errors = [];
  const onError = (error) => {
    errors.push({
      lineNumber: error.lineNumber,
      detail: error.detail,
      context: error.context,
    });
  };

  // Run the rule
  rule.function({ tokens }, onError);

  return errors;
}

// Test cases
const testCases = [
  {
    name: "Title case heading",
    markdown: "# This Is A Title Case Heading",
    shouldFlag: true,
  },
  {
    name: "Sentence case heading",
    markdown: "# This is a sentence case heading",
    shouldFlag: false,
  },
  {
    name: "Heading with proper nouns",
    markdown: "# This is a heading with JavaScript and GitHub",
    shouldFlag: false,
  },
  {
    name: "Title case bold",
    markdown: "Some text with **Bold Text In Title Case** here",
    shouldFlag: true,
  },
  {
    name: "Sentence case bold",
    markdown: "Some text with **bold text in sentence case** here",
    shouldFlag: false,
  },
  {
    name: "Bold with proper nouns",
    markdown: "Some text with **bold text with JavaScript and GitHub** here",
    shouldFlag: false,
  },
  {
    name: "Single word bold capitalized",
    markdown: "Some text with **Bold** here",
    shouldFlag: false,
  },
  {
    name: "Single word bold lowercase",
    markdown: "Some text with **bold** here",
    shouldFlag: false,
  },
];

// Run tests
console.log("Testing sentence-case-headings-bold rule...\n");

let passCount = 0;
let failCount = 0;

testCases.forEach((testCase) => {
  const errors = mockMarkdownlint(testCase.markdown, customRule);
  const hasErrors = errors.length > 0;
  const passed = hasErrors === testCase.shouldFlag;

  if (passed) {
    passCount++;
    console.log(`✅ PASS: ${testCase.name}`);
  } else {
    failCount++;
    console.log(`❌ FAIL: ${testCase.name}`);
    console.log(
      `  Expected to ${testCase.shouldFlag ? "flag" : "not flag"}, but ${
        hasErrors ? "flagged" : "did not flag"
      }`,
    );
    if (hasErrors) {
      errors.forEach((error) => {
        console.log(
          `  - Line ${error.lineNumber}: ${error.detail} - "${error.context}"`,
        );
      });
    }
  }
  console.log("");
});

console.log(`Results: ${passCount} passed, ${failCount} failed`);

if (failCount > 0) {
  process.exit(1);
} else {
  console.log("All tests passed! The rule is working correctly.");
}
