/**
 * @feature
 * Tests for BCE001 handling of `@`-prefixed import paths (#286).
 *
 * Claude Code `@`-imports (e.g. `@docs/folder-structure.md`) pull other files
 * into AGENTS.md / CLAUDE.md context. The path after `@` must stay bare — a
 * backtick inserted after the `@` (`` @`docs/foo.md` ``) breaks the import.
 * The same guard covers scoped npm packages (`@scope/pkg`) and email local
 * parts, none of which should be split by an inserted backtick.
 */
import { describe, test, expect } from "@jest/globals";
import { lint } from "markdownlint/promise";
import { applyFixes } from "markdownlint";
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

/**
 * Lint then apply BCE001 autofixes, returning the resulting text.
 * @param {string} markdown
 * @returns {Promise<string>}
 */
async function fixBCE001(markdown) {
  const results = await lint({
    customRules: [backtickRule],
    config: { default: false }, // isolate BCE001 from MD047 trailing-newline etc.
    strings: { "test.md": markdown },
    resultVersion: 3,
  });
  return applyFixes(markdown, results["test.md"] || []);
}

describe("BCE001 @-prefixed import paths (#286)", () => {
  test("does not flag @-import path in prose", async () => {
    const violations = await getBCE001Violations(
      "See @docs/folder-structure.md for the full hierarchy.",
    );
    expect(violations).toHaveLength(0);
  });

  test("does not flag @-import path in a table cell", async () => {
    const violations = await getBCE001Violations(
      "| Where content belongs and why | @docs/locations.md |",
    );
    expect(violations).toHaveLength(0);
  });

  test("does not flag nested @-import path", async () => {
    const violations = await getBCE001Violations(
      "Patterns live in @docs/design/agent-tools.md and elsewhere.",
    );
    expect(violations).toHaveLength(0);
  });

  test("does not flag scoped npm package after @", async () => {
    const violations = await getBCE001Violations(
      "Install @adeze/raindrop-mcp as a fallback.",
    );
    expect(violations).toHaveLength(0);
  });

  test("autofix leaves @-import paths byte-identical", async () => {
    const input =
      "See @docs/folder-structure.md and @docs/para-principles.md for rules.";
    const fixed = await fixBCE001(input);
    expect(fixed).toBe(input);
  });

  test("still flags a bare path NOT preceded by @", async () => {
    const violations = await getBCE001Violations(
      "Edit docs/folder-structure.md to update the hierarchy.",
    );
    expect(violations.length).toBeGreaterThan(0);
  });
});
