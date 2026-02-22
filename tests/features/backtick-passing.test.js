/**
 * @integration
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
  "../fixtures/backtick/passing.fixture.md",
);

/**
 * Test suite for backtick-code-elements rule on passing cases.
 * Ensures that valid code, prose, and common terms are not incorrectly flagged.
 */
describe("backtick-code-elements passing fixture", () => {
  /**
   * Verifies that no violations are reported for the passing fixture.
   */
  test("does not flag any valid lines in the passing fixture", async () => {
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
    expect(ruleViolations).toHaveLength(0);
  });
});

/**
 * Verifies that regular prose containing slashes is not flagged as a file path.
 */
test("does not flag regular prose with slashes as file path", async () => {
  const markdown = "The result was pass/fail for all subjects.";
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
  expect(ruleViolations).toHaveLength(0);
});
// [CASCADE FEATURE TEST END]

/**
 * Verifies that common non-code terms like "et al." are not flagged as missing backticks.
 */
test('does not flag plural acronym "PDFs" as a code identifier (#161)', async () => {
  const markdown = "Include trigger terms (e.g., when the user mentions PDFs, forms, or document extraction)";
  const options = {
    customRules: [backtickRule],
    strings: { "test.md": markdown },
    resultVersion: 3,
    config: { "backtick-code-elements": { detectPascalCase: true } },
  };
  const results = await lint(options);
  const violations = results["test.md"] || [];
  const ruleViolations = violations.filter(
    (v) =>
      v.ruleNames.includes("backtick-code-elements") ||
      v.ruleNames.includes("BCE001"),
  );
  expect(ruleViolations).toHaveLength(0);
});

test('does not flag "et al." as missing backticks', async () => {
  const markdown =
    "As described by Smith et al., the results were significant.";
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
  expect(ruleViolations).toHaveLength(0);
});
