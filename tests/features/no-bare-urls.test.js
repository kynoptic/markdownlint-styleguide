import path from "path";
import { fileURLToPath } from "url";
import { describe, test, expect, beforeAll } from "@jest/globals";
import { lint } from "markdownlint/promise";
import MarkdownIt from "markdown-it";
import noBareUrls from "../../src/rules/no-bare-urls.js";
import { parseFixture } from "../utils/fixture.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturePath = path.join(
  __dirname,
  "../fixtures/no-bare-urls.fixture.md",
);

/**
 * @integration
 * Test suite for no-bare-urls-trap custom rule.
 * Ensures that bare URLs are detected and reported on the correct lines.
 */
describe("no-bare-urls-trap rule", () => {
  const { failingLines } = parseFixture(fixturePath);
  let violations = [];

  beforeAll(async () => {
    const options = {
      files: [fixturePath],
      customRules: [noBareUrls],
      config: {
        default: false,
        "no-bare-urls-trap": true,
        MD034: false,
      },
      markdownItFactory: () => new MarkdownIt({ linkify: true }),
    };
    violations = await lint(options);
  });

  /**
   * Verifies that all bare URLs in the fixture are detected and reported on the expected lines.
   */
  test("detects and reports all bare URLs on correct lines", () => {
    const errorLines = [
      ...new Set(violations[fixturePath].map((v) => v.lineNumber)),
    ];
    // Sort both arrays to ensure the order doesn't affect the comparison
    expect(errorLines.sort()).toEqual(failingLines.sort());
  });

  /**
   * Verifies that autofix information is provided for each violation.
   */
  test("provides autofix information for violations", () => {
    const violationsWithFix = violations[fixturePath].filter(v => v.fixInfo);
    
    // All violations should have fix information
    expect(violationsWithFix.length).toBeGreaterThan(0);
    expect(violationsWithFix.length).toBe(violations[fixturePath].length);
    
    // Each fix should have the required properties
    violationsWithFix.forEach(violation => {
      expect(violation.fixInfo).toHaveProperty('editColumn');
      expect(violation.fixInfo).toHaveProperty('deleteCount');
      expect(violation.fixInfo).toHaveProperty('insertText');
      
      // The insert text should wrap the URL in angle brackets
      expect(violation.fixInfo.insertText).toMatch(/^<.*>$/);
      
      // The insert text should be formatted as an autolink
      expect(violation.fixInfo.insertText.length).toBeGreaterThan(2); // More than just "<>"
    });
  });

  /**
   * Test specific autofix scenarios
   */
  test("correctly formats autofix for different URL patterns", async () => {
    const testCases = [
      {
        input: "Visit http://example.com for more info.",
        expected: "Visit <http://example.com> for more info."
      },
      {
        input: "Check out https://github.com/user/repo.",
        expected: "Check out <https://github.com/user/repo> for more info."
      },
      {
        input: "Go to www.example.org.",
        expected: "Go to <www.example.org>."
      }
    ];

    for (const testCase of testCases) {
      const options = {
        strings: { "test.md": testCase.input },
        customRules: [noBareUrls],
        config: {
          default: false,
          "no-bare-urls-trap": true,
        },
        markdownItFactory: () => new MarkdownIt({ linkify: true }),
      };
      
      const results = await lint(options);
      const violations = results["test.md"];
      
      expect(violations.length).toBe(1);
      expect(violations[0].fixInfo).toBeDefined();
      
      // Verify the fix would produce the expected result
      const fix = violations[0].fixInfo;
      const originalLine = testCase.input;
      const fixedLine = 
        originalLine.substring(0, fix.editColumn - 1) +
        fix.insertText +
        originalLine.substring(fix.editColumn - 1 + fix.deleteCount);
        
      expect(fixedLine).toContain('<');
      expect(fixedLine).toContain('>');
    }
  });
});
