/**
 * @feature
 * Tests for BCE001 truncating hyphenated words at non-ASCII letters (#269).
 *
 * The CLI-flag pattern (and other ASCII-only patterns) use `\w`/`\b`, which do
 * not treat non-ASCII letters as word characters. A hyphenated word whose
 * continuation contains a non-ASCII letter (e.g. the schwa in a pronunciation
 * gloss like "-pəl") produces a false word boundary, so the matcher captures
 * only the leading "-p" fragment and reports it as a command flag. Genuine bare
 * flags like "-p" must still be flagged.
 */
import { describe, test, expect } from "@jest/globals";
import { lint } from "markdownlint/promise";
import backtickRule from "../../src/rules/backtick-code-elements.js";

/**
 * @param {string} markdown
 * @returns {Promise<Array>}
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

describe("BCE001 non-ASCII hyphenated words (#269)", () => {
  test("does not flag -p inside a schwa pronunciation gloss", async () => {
    const violations = await getBCE001Violations("Plain -pəl without bold.");
    expect(violations).toHaveLength(0);
  });

  test("does not flag -p inside a gloss adjacent to bold", async () => {
    const violations = await getBCE001Violations(
      "The pronunciation **ZAM**-pəl is a gloss.",
    );
    expect(violations).toHaveLength(0);
  });

  test("does not flag -p inside a diaeresis-suffixed word", async () => {
    const violations = await getBCE001Violations("Plain -pël without bold.");
    expect(violations).toHaveLength(0);
  });

  test("does not flag -p truncated by an astral-plane letter", async () => {
    // -p followed by MATHEMATICAL BOLD SMALL A (U+1D41A), a surrogate pair.
    const violations = await getBCE001Violations("Plain -p\u{1D41A}l without bold.");
    expect(violations).toHaveLength(0);
  });

  test("still flags a genuine bare flag", async () => {
    const violations = await getBCE001Violations("Run -p now.");
    expect(violations.length).toBeGreaterThan(0);
  });

  test("still flags a genuine long flag", async () => {
    const violations = await getBCE001Violations("Pass --verbose to the command.");
    expect(violations.length).toBeGreaterThan(0);
  });
});
