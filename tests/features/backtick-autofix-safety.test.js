/**
 * Tests for autofix safety in backtick-code-elements rule.
 * Verifies that low-confidence matches don't get autofixed to prevent false positives.
 */
import { describe, test, expect } from "@jest/globals";
import { lint } from "markdownlint/promise";
import { applyFixes } from "markdownlint";
import backtickRule from "../../src/rules/backtick-code-elements.js";

describe("Backtick autofix safety", () => {
  const lintOptions = {
    strings: {},
    config: {
      default: false,
      "backtick-code-elements": true,
    },
    customRules: [backtickRule],
  };

  test("should autofix high-confidence matches", async () => {
    const content = "Install the package with npm install.";
    const result = await lint({
      ...lintOptions,
      strings: { content },
    });

    // Should detect the violation
    expect(result.content).toHaveLength(1);
    expect(result.content[0].fixInfo).not.toBeNull();

    // Apply fixes
    const fixed = applyFixes(content, result.content);
    expect(fixed).toBe("Install the package with `npm install`.");
  });

  test("should autofix file paths with extensions", async () => {
    const content = "Edit the file package.json in your project.";
    const result = await lint({
      ...lintOptions,
      strings: { content },
    });

    // Should detect and autofix
    expect(result.content).toHaveLength(1);
    expect(result.content[0].fixInfo).not.toBeNull();

    const fixed = applyFixes(content, result.content);
    expect(fixed).toBe("Edit the file `package.json` in your project.");
  });

  test("should autofix environment variables", async () => {
    const content = "Set the NODE_ENV variable for production.";
    const result = await lint({
      ...lintOptions,
      strings: { content },
    });

    // Should detect and autofix
    expect(result.content).toHaveLength(1);
    expect(result.content[0].fixInfo).not.toBeNull();

    const fixed = applyFixes(content, result.content);
    expect(fixed).toBe("Set the `NODE_ENV` variable for production.");
  });

  test("should NOT autofix low-confidence matches (common words)", async () => {
    const content = "This is a simple test of common words like the and or.";
    const result = await lint({
      ...lintOptions,
      strings: { content },
    });

    // Should not detect any violations for common words
    expect(result.content).toHaveLength(0);
  });

  test("should NOT autofix ambiguous short terms", async () => {
    const content = "Use the a or b option for better results.";
    const result = await lint({
      ...lintOptions,
      strings: { content },
    });

    // Should not detect violations for very short ambiguous terms
    expect(result.content).toHaveLength(0);
  });

  test("should NOT autofix natural language paths", async () => {
    const content = "Choose between read/write or pass/fail options.";
    const result = await lint({
      ...lintOptions,
      strings: { content },
    });

    // Should detect natural language phrases but NOT provide autofix
    expect(result.content.length).toBeGreaterThan(0);
    expect(result.content.every(v => v.fixInfo === null)).toBe(true);
  });

  test("should handle mixed confidence scenarios", async () => {
    const content = "Run npm start and check the logs in or out directories.";
    const result = await lint({
      ...lintOptions,
      strings: { content },
    });

    // Should only autofix the high-confidence match (npm start)
    const violations = result.content.filter(v => v.fixInfo !== null);
    expect(violations).toHaveLength(1);
    expect(violations[0].ruleDescription).toContain("backtick");

    const fixed = applyFixes(content, result.content);
    expect(fixed).toBe("Run `npm start` and check the logs in or out directories.");
  });

  test("should apply autofix for high-confidence technical terms", async () => {
    const content = "Use git clone to download the repository.";
    const result = await lint({
      ...lintOptions,
      strings: { content },
    });

    expect(result.content).toHaveLength(1);
    const violation = result.content[0];
    
    // High-confidence match should get autofix
    expect(violation.fixInfo).not.toBeNull();
    expect(violation.fixInfo.insertText).toBe("`git clone`");
    
    const fixed = applyFixes(content, result.content);
    expect(fixed).toBe("Use `git clone` to download the repository.");
  });
});