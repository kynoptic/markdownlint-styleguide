/**
 * @feature
 * Tests for issue #145: BCE001 should not flag English suffixes as CLI flags.
 *
 * Common suffixes like -ism, -ist, -like, -based, -gate appear in editorial
 * and linguistic content with a leading hyphen. The CLI flag regex matches
 * them because they start with `-` followed by letters, but they are ordinary
 * English morphemes, not command-line options.
 */
import { describe, test, expect } from "@jest/globals";
import { lint } from "markdownlint/promise";
import backtickRule from "../../src/rules/backtick-code-elements.js";

/**
 * Helper to lint a markdown string and return only BCE001 violations.
 * @param {string} markdown - Markdown content to lint.
 * @returns {Promise<Array>} BCE001 violations.
 */
async function getBCE001Violations(markdown) {
  const options = {
    customRules: [backtickRule],
    strings: { "test.md": markdown },
    resultVersion: 3,
  };
  const results = await lint(options);
  const violations = results["test.md"] || [];
  return violations.filter(
    (v) =>
      v.ruleNames.includes("backtick-code-elements") ||
      v.ruleNames.includes("BCE001"),
  );
}

describe("BCE001 English suffix false positives (#145)", () => {
  test("does not flag -ism suffix in prose", async () => {
    const violations = await getBCE001Violations(
      "Compounds with suffixes like -ism create loaded terms.",
    );
    expect(violations).toHaveLength(0);
  });

  test("does not flag -ist suffix in prose", async () => {
    const violations = await getBCE001Violations(
      "The suffix -ist denotes a person who practices something.",
    );
    expect(violations).toHaveLength(0);
  });

  test("does not flag -like suffix in prose", async () => {
    const violations = await getBCE001Violations(
      "Novel compounds with -like that create new adjectives.",
    );
    expect(violations).toHaveLength(0);
  });

  test("does not flag -based suffix in prose", async () => {
    const violations = await getBCE001Violations(
      "No -based pseudo-lists should appear in the output.",
    );
    expect(violations).toHaveLength(0);
  });

  test("does not flag -gate suffix in prose", async () => {
    const violations = await getBCE001Violations(
      'The -gate suffix is used for political scandals.',
    );
    expect(violations).toHaveLength(0);
  });

  test("does not flag multiple suffixes in one line", async () => {
    const violations = await getBCE001Violations(
      "Prefixes and suffixes like -ism, -ist, -like that create loaded terms.",
    );
    expect(violations).toHaveLength(0);
  });

  test("does not flag -ness, -ful, -less suffixes", async () => {
    const violations = await getBCE001Violations(
      "Common derivational suffixes include -ness, -ful, and -less.",
    );
    expect(violations).toHaveLength(0);
  });

  test("does not flag -able, -ible, -tion, -sion suffixes", async () => {
    const violations = await getBCE001Violations(
      "Productive suffixes include -able, -ible, -tion, and -sion.",
    );
    expect(violations).toHaveLength(0);
  });

  test("does not flag -wise, -ward, -phobia suffixes", async () => {
    const violations = await getBCE001Violations(
      "Directional suffixes like -wise and -ward modify meaning.",
    );
    expect(violations).toHaveLength(0);
  });

  test("still flags actual CLI flags like --verbose", async () => {
    const violations = await getBCE001Violations(
      "Pass --verbose for more output.",
    );
    expect(violations.length).toBeGreaterThan(0);
  });

  test("still flags actual CLI flags like -f", async () => {
    const violations = await getBCE001Violations(
      "Use -f to force the operation.",
    );
    expect(violations.length).toBeGreaterThan(0);
  });
});
