/**
 * @integration
 * Test suite for backtick-code-elements rule with LaTeX math expressions.
 * Ensures that LaTeX math expressions are ignored, but code-like text outside math is still flagged.
 */

import path from "path";
import { fileURLToPath } from "url";
import { describe, test, expect } from "@jest/globals";
import { lint } from "markdownlint/promise";
import backtickRule from "../../src/rules/backtick-code-elements.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturePath = path.join(
  __dirname,
  "../fixtures/backtick/math.fixture.md",
);

describe("backtick-code-elements math expressions", () => {
  /**
   * Verifies that LaTeX math expressions are ignored and only code-like text outside math is flagged.
   */
  test("ignores LaTeX math expressions but flags code-like text outside math", async () => {
    const options = {
      customRules: [backtickRule],
      files: [fixturePath],
      resultVersion: 3,
    };

    const results = await lint(options);
    const violations = results[fixturePath] || [];
    const ruleViolations = violations.filter(
      (v) =>
        v.ruleNames.includes("backtick-code-elements") ||
        v.ruleNames.includes("BCE001"),
    );

    // We expect exactly 2 violations - the ones marked with ❌ in the fixture
    expect(ruleViolations).toHaveLength(2);

    // Verify that the violations are for the expected lines
    const violationLines = ruleViolations.map((v) => v.lineNumber);
    expect(violationLines).toContain(23); // grep $pattern file.txt
    expect(violationLines).toContain(24); // export x=$value

    // Verify that none of the math expressions are flagged
    const mathLines = [4, 5, 6, 7, 11, 14, 17, 18];
    for (const line of mathLines) {
      expect(violationLines).not.toContain(line);
    }
  });

  test("provides descriptive details for violations", async () => {
    const options = {
      customRules: [backtickRule],
      files: [fixturePath],
      resultVersion: 3,
    };

    const results = await lint(options);
    const ruleViolations = (results[fixturePath] || []).filter(
      (v) =>
        v.ruleNames.includes("backtick-code-elements") ||
        v.ruleNames.includes("BCE001"),
    );

    ruleViolations.forEach((v) => {
      expect(v.errorDetail).toMatch(/^Wrap .+ in backticks\.$/);
    });
  });
});
