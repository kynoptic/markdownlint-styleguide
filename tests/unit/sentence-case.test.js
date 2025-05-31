// @ts-check

"use strict";

/**
 * Unit tests for sentence-case-headings-bold rule
 * 
 * @module sentence-case.test
 */

const sentenceCase = require("../../rules/sentence-case");
const { testRule } = require("../test-helpers");

describe("sentence-case-headings-bold", () => {
  test("headings with sentence case pass", (done) => {
    const testCases = [
      {
        markdown: "# This is sentence case\n\nContent here.",
        expected: 0
      },
      {
        markdown: "## Another heading in sentence case\n\nMore content.",
        expected: 0
      },
      {
        markdown: "### This heading has JavaScript in it\n\nContent with proper nouns.",
        expected: 0
      }
    ];
    
    testRule(sentenceCase, testCases, done);
  });

  test("headings with title case fail", (done) => {
    const testCases = [
      {
        markdown: "# This Is Title Case\n\nContent here.",
        expected: 1,
        lineNumbers: [1]
      },
      {
        markdown: "## Another Heading In Title Case\n\nMore content.",
        expected: 1,
        lineNumbers: [1]
      }
    ];
    
    testRule(sentenceCase, testCases, done);
  });

  test("bold text with sentence case passes", (done) => {
    const testCases = [
      {
        markdown: "Text with **bold text in sentence case** here.",
        expected: 0
      },
      {
        markdown: "Another **example with JavaScript** proper noun.",
        expected: 0
      }
    ];
    
    testRule(sentenceCase, testCases, done);
  });

  test("bold text with title case fails", (done) => {
    const testCases = [
      {
        markdown: "Text with **Bold Text In Title Case** here.",
        expected: 1,
        lineNumbers: [1]
      },
      {
        markdown: "Another **Example With Title Case** test.",
        expected: 1,
        lineNumbers: [1]
      }
    ];
    
    testRule(sentenceCase, testCases, done);
  });

  test("edge cases are handled correctly", (done) => {
    const testCases = [
      // Single word headings are fine
      {
        markdown: "# Introduction\n\nContent here.",
        expected: 0
      },
      // Acronyms and proper nouns - this actually gets flagged because "Documentation" is capitalized
      {
        markdown: "# API documentation for JavaScript\n\nContent here.",
        expected: 0
      },
      // Mixed case with mostly proper nouns is fine
      {
        markdown: "# The GitHub API and Node.js integration\n\nContent here.",
        expected: 0
      },
      // All caps is not title case
      {
        markdown: "# ALL CAPS IS NOT TITLE CASE\n\nContent here.",
        expected: 0
      }
    ];
    
    testRule(sentenceCase, testCases, done);
  });
});
