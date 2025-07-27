/**
 * @integration
 */
import path from "path";
import { fileURLToPath } from "url";
import { describe, test, expect } from "@jest/globals";
import { lint } from "markdownlint/promise";
import backtickRule from "../../src/rules/backtick-code-elements.js";
import { parseFixture } from "../utils/fixture.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturePath = path.join(
  __dirname,
  "../fixtures/backtick/failing.fixture.md",
);

/**
 * Test suite for backtick-code-elements rule on a failing fixture.
 * Ensures that all expected lines are flagged and error details are descriptive.
 */
describe("backtick-code-elements failing fixture", () => {
  const failingLines = parseFixture(fixturePath).failingLines;

  /**
   * Each failing line should be flagged as a violation.
   */
  test.each(failingLines)(
    "flags unwrapped code element at line %i",
    async (line) => {
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
      const numbers = ruleViolations.map((v) => v.lineNumber);
      expect(numbers).toContain(line);
    },
  );

  /**
   * Each violation should provide a descriptive error message.
   */
  test("provides descriptive details for all violations", async () => {
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
      expect(v.errorDetail).toMatch(/should be wrapped in backticks/);
    });
  });

  /**
   * Flags valid file path with uppercase letters as missing backticks.
   */
  test("flags valid file path with uppercase letters as missing backticks", async () => {
    const markdown = "Open My-Dir/my-file.txt for details.";
    const options = {
      customRules: [backtickRule],
      strings: { "test.md": markdown },
      resultVersion: 3,
    };
    const results = await lint(options);
    const violations = results["test.md"] || [];
    const ruleViolations = violations.filter(
      (v) =>
        v.ruleNames.includes("backtick-code-elements") ||
        v.ruleNames.includes("BCE001"),
    );
    expect(ruleViolations.length).toBeGreaterThan(0);
  });
});
