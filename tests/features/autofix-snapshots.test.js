/**
 * @integration
 * Snapshot tests for autofix functionality across all rules.
 * These tests capture the exact transformations made by autofix logic.
 */
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { describe, test, expect } from "@jest/globals";
import { lint } from "markdownlint/promise";
import { applyFixes } from "markdownlint";
import sentenceRule from "../../src/rules/sentence-case-heading.js";
import backtickRule from "../../src/rules/backtick-code-elements.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Apply autofix transformations to content and return the result.
 * @param {string} content - Original markdown content
 * @param {object} rule - The markdownlint rule to apply
 * @returns {Promise<string>} - The fixed content
 */
async function applyAutofixToContent(content, rule) {
  const results = await lint({
    customRules: [rule],
    strings: {
      content: content
    },
    resultVersion: 3,
    fix: true,
  });

  const violations = results.content || [];
  const fixes = violations.filter(v => v.fixInfo);
  
  if (fixes.length === 0) {
    return content; // No fixes applied
  }

  return applyFixes(content, fixes);
}

/**
 * Create a snapshot test for autofix functionality.
 * @param {string} testName - Name of the test
 * @param {string} fixturePath - Path to the fixture file
 * @param {object} rule - The markdownlint rule to test
 */
function createAutofixSnapshotTest(testName, fixturePath, rule) {
  test(`${testName} autofix snapshot`, async () => {
    const originalContent = fs.readFileSync(fixturePath, "utf8");
    const fixedContent = await applyAutofixToContent(originalContent, rule);
    
    // Create a snapshot object that shows both before and after
    const snapshot = {
      original: originalContent,
      fixed: fixedContent,
      hasChanges: originalContent !== fixedContent
    };
    
    expect(snapshot).toMatchSnapshot();
  });
}

describe("Autofix snapshot tests", () => {
  describe("sentence-case-heading rule", () => {
    const sentenceCaseFixturePath = path.join(
      __dirname,
      "../fixtures/sentence-case/autofix.fixture.md"
    );
    
    createAutofixSnapshotTest(
      "sentence-case-heading",
      sentenceCaseFixturePath,
      sentenceRule
    );
  });

  describe("backtick-code-elements rule", () => {
    const backtickFixturePath = path.join(
      __dirname,
      "../fixtures/backtick/autofix.fixture.md"
    );
    
    createAutofixSnapshotTest(
      "backtick-code-elements",
      backtickFixturePath,
      backtickRule
    );

    const backtickMinimalFixturePath = path.join(
      __dirname,
      "../fixtures/backtick/autofix-minimal.fixture.md"
    );
    
    createAutofixSnapshotTest(
      "backtick-code-elements-minimal",
      backtickMinimalFixturePath,
      backtickRule
    );
  });

  describe("Individual autofix transformations", () => {
    test("sentence case heading transformations", async () => {
      const testCases = [
        "# This Is A Title Case Heading",
        "## API Documentation For Users", 
        "### Working With Node.js And Express",
        "# 1. Getting Started With Development",
        "## 2. API Rate Limiting Best Practices",
        "# CSS and HTML best practices",
        "## Using JSON with REST APIs",
        "### The HTTP and HTTPS protocols"
      ];

      for (const testCase of testCases) {
        const fixed = await applyAutofixToContent(testCase, sentenceRule);
        expect({
          original: testCase,
          fixed: fixed,
          hasChanges: testCase !== fixed
        }).toMatchSnapshot();
      }
    });

    test("backtick code elements transformations", async () => {
      const testCases = [
        "Use the package.json file to configure dependencies.",
        "Run npm install to install packages.",
        "The src/index.js file contains the main logic.",
        "Set the NODE_ENV variable to production.",
        "Check the README.md for installation instructions.",
        "Navigate to the /usr/local/bin directory.",
        "Execute the git status command to check changes.",
        "The .gitignore file excludes temporary files."
      ];

      for (const testCase of testCases) {
        const fixed = await applyAutofixToContent(testCase, backtickRule);
        expect({
          original: testCase,
          fixed: fixed,
          hasChanges: testCase !== fixed
        }).toMatchSnapshot();
      }
    });

    test("edge cases with no changes", async () => {
      const noChangeCases = [
        "# This is already correct", // Sentence case heading
        "Use the `package.json` file correctly.", // Already has backticks
        "## API documentation", // Proper acronym usage
        "### Working with Node.js properly" // Proper technical term
      ];

      for (const testCase of noChangeCases) {
        const sentenceFixed = await applyAutofixToContent(testCase, sentenceRule);
        const backtickFixed = await applyAutofixToContent(testCase, backtickRule);
        
        expect({
          original: testCase,
          sentenceFixed: sentenceFixed,
          backtickFixed: backtickFixed,
          sentenceHasChanges: testCase !== sentenceFixed,
          backtickHasChanges: testCase !== backtickFixed
        }).toMatchSnapshot();
      }
    });
  });
});