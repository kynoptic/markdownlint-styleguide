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

test("does not flag code elements after $$ inside fenced code block (#181)", async () => {
  const markdown = [
    "```",
    "$$",
    "x = y + z",
    "```",
    "",
    "Use the NODE_ENV variable to configure.",
  ].join("\n");
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
  // NODE_ENV should be flagged - the $$ inside the code block should NOT have toggled math mode
  expect(ruleViolations.length).toBeGreaterThan(0);
  expect(ruleViolations[0].ruleDescription).toContain("backtick");
});

test("does not flag inside HTML semantic tags (#182)", async () => {
  const markdown = [
    "Press <kbd>Ctrl+C</kbd> to copy.",
    "The <code>NODE_ENV</code> variable controls the environment.",
    "Use <samp>error_output</samp> to check the result.",
    "The <var>user_name</var> parameter is required.",
  ].join("\n");
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

test("does not flag URL sub-segments independently (#186)", async () => {
  const markdown = "Visit https://example.com/path/to/file.js for details.";
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
  // The full URL may be flagged, but sub-segments like "file.js" or "path/to/file.js" should not be
  for (const v of ruleViolations) {
    expect(v.errorContext).toBe("https://example.com/path/to/file.js");
  }
});

test("does not flag pure alphabetic slash-separated words as paths (#187)", async () => {
  const markdown = "Organize by features/options/settings in the config.";
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

test("does not flag code elements inside bracket placeholders (#188)", async () => {
  const markdown = "Use [some_variable] as a placeholder in templates.";
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

test("still flags code elements between unrelated brackets on same line (#188 edge)", async () => {
  // some_variable is NOT inside brackets here — it sits between a link and a placeholder
  const markdown =
    "Use [link](url) and then some_variable in [another] context.";
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
  // some_variable should still be flagged — it's not inside any brackets
  expect(ruleViolations.length).toBeGreaterThan(0);
});

test("autofix preserves trailing whitespace in line (#189)", async () => {
  // Line with trailing spaces (Markdown line break) after a code element
  const markdown = "Use the NODE_ENV variable here.  \nNext line here.";
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

  // Verify the fix doesn't eat trailing whitespace
  if (ruleViolations.length > 0 && ruleViolations[0].fixInfo) {
    const fix = ruleViolations[0].fixInfo;
    // The fix should only wrap NODE_ENV in backticks, not affect trailing whitespace
    expect(fix.insertText).toBe("`NODE_ENV`");
    expect(fix.deleteCount).toBe("NODE_ENV".length);
  }
});
