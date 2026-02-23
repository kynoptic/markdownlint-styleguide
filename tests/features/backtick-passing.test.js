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

test('flags tilde paths as complete units, not partial dotfiles (#162)', async () => {
  const markdown = "Edit the ~/.claude directory for configuration.";
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
  // Should flag the full tilde path, not just the dotfile component
  expect(ruleViolations.length).toBeGreaterThan(0);
  const detail = ruleViolations[0].errorDetail;
  expect(detail).toMatch(/~\/\.claude/);
  expect(detail).not.toMatch(/^Configuration file '\.claude'/);
});

test('flags multi-segment tilde path as complete unit (#162)', async () => {
  const markdown = "Save to ~/Documents/file.txt when done.";
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
  // Should reference the full ~/Documents/file.txt path
  expect(ruleViolations[0].errorDetail).toMatch(/~\/Documents\/file\.txt/);
});

test('does not flag "import tool" or "import new" as code statements (#160)', async () => {
  const markdown = "Use the import tool to bring in data. You can import new items from the list.";
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

test('flags actual code import like "import tokenizer" after word boundary fix (#160)', async () => {
  const markdown = "You should use import tokenizer in your Python script.";
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
  expect(ruleViolations[0].errorDetail).toMatch(/import tokenizer/);
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
