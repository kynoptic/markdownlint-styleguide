/**
 * @feature
 * Tests for issue #301: BCE001 should not flag hyphenated English suffixes
 * as CLI flags when the preceding word is wrapped in emphasis markers (*...*
 * or _..._).
 *
 * Tests for issue #306: BCE001 --fix must not emit doubled backticks when
 * a hyphenated suffix immediately follows an existing inline code span.
 */
import { describe, test, expect } from "@jest/globals";
import { lint } from "markdownlint/promise";
import { applyFixes } from "markdownlint";
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

/**
 * Helper: lint markdown, apply fixes, return the fixed string.
 * @param {string} markdown
 * @returns {Promise<string>}
 */
async function applyBCE001Fixes(markdown) {
  const options = {
    customRules: [backtickRule],
    strings: { "test.md": markdown },
    resultVersion: 3,
  };
  const results = await lint(options);
  const violations = (results["test.md"] || []).filter(
    (v) =>
      v.ruleNames.includes("backtick-code-elements") ||
      v.ruleNames.includes("BCE001"),
  );
  return applyFixes(markdown, violations);
}

// ---------------------------------------------------------------------------
// #301 — emphasis-adjacent hyphen suffix not flagged
// ---------------------------------------------------------------------------

describe("BCE001 emphasis-adjacent hyphen suffix (#301)", () => {
  test("does not flag *Word*-style compound", async () => {
    const violations = await getBCE001Violations(
      "We chose an *Acme*-style layout.",
    );
    expect(violations).toHaveLength(0);
  });

  test("does not flag *Word*-driven compound", async () => {
    const violations = await getBCE001Violations(
      "The team prefers a *Foo*-driven workflow.",
    );
    expect(violations).toHaveLength(0);
  });

  test("does not flag *Word*-based compound", async () => {
    const violations = await getBCE001Violations(
      "A *React*-based application handles this.",
    );
    expect(violations).toHaveLength(0);
  });

  test("does not flag *Word*-like compound", async () => {
    const violations = await getBCE001Violations(
      "Use a *Unix*-like environment for development.",
    );
    expect(violations).toHaveLength(0);
  });

  test("does not flag underscore emphasis _Word_-style compound", async () => {
    const violations = await getBCE001Violations(
      "We chose a _Acme_-style layout.",
    );
    expect(violations).toHaveLength(0);
  });

  test("does not flag multiple emphasis-hyphen compounds on one line", async () => {
    const violations = await getBCE001Violations(
      "A *Foo*-style and *Bar*-driven approach.",
    );
    expect(violations).toHaveLength(0);
  });

  test("plain prose compound without emphasis is still not flagged", async () => {
    // The existing suffix fix (#145/#193) handles plain prose — this remains correct.
    const violations = await getBCE001Violations(
      "A plain modern-style layout, with no emphasis.",
    );
    expect(violations).toHaveLength(0);
  });

  test("real CLI flags after emphasis are still flagged", async () => {
    // *command* --verbose should still flag --verbose
    const violations = await getBCE001Violations(
      "Run *git* --verbose to see output.",
    );
    expect(violations.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// #306 — --fix must not emit doubled backticks next to an existing code span
// ---------------------------------------------------------------------------

describe("BCE001 --fix no doubled backticks adjacent to code span (#306)", () => {
  test("does not flag code-span followed by hyphen suffix", async () => {
    // `Documents`-level → -level is a suffix, not a flag
    const violations = await getBCE001Violations(
      "Synology Drive Client runs for `Documents`-level live sync.",
    );
    expect(violations).toHaveLength(0);
  });

  test("does not flag code-span followed by -anchored suffix", async () => {
    const violations = await getBCE001Violations(
      "Python 2's `re.split` with a `^`-anchored lookahead has edge cases.",
    );
    expect(violations).toHaveLength(0);
  });

  test("fix output contains no doubled backticks for code-span-hyphen compound", async () => {
    // Even if a violation were reported, the fix must not emit ``
    const markdown =
      "Synology Drive Client runs for `Documents`-level live sync.";
    const fixed = await applyBCE001Fixes(markdown);
    expect(fixed).not.toContain("``");
  });

  test("fix output contains no doubled backticks for second code-span-hyphen compound", async () => {
    const markdown =
      "Python 2's `re.split` with a `^`-anchored lookahead has edge cases.";
    const fixed = await applyBCE001Fixes(markdown);
    expect(fixed).not.toContain("``");
  });
});
