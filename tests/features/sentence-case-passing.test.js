/**
 * @integration
 */
import path from "path";
import { fileURLToPath } from "url";
import { describe, test, expect } from "@jest/globals";
import { lint } from "markdownlint/promise";
import sentenceRule from "../../src/rules/sentence-case-heading.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturePath = path.join(
  __dirname,
  "../fixtures/sentence-case/passing.fixture.md",
);

/**
 * Test suite for sentence-case-heading rule on a passing fixture.
 * Ensures that no violations are reported for correctly cased headings.
 */
describe("sentence-case-heading passing fixture", () => {
  /**
   * Verifies that no violations are reported for the passing fixture.
   */
  test("does not report any violations for passing fixture", async () => {
    const options = {
      customRules: [sentenceRule],
      files: [fixturePath],
      resultVersion: 3,
    };
    const results = await lint(options);
    const ruleViolations = (results[fixturePath] || []).filter(
      (v) =>
        (v.ruleNames.includes("sentence-case-heading") ||
        v.ruleNames.includes("SC001")) &&
        // Only count violations with fixInfo (actual errors that need fixing)
        // Info-level warnings without fixInfo (like ambiguous terms) don't fail the test
        v.fixInfo != null,
    );
    expect(ruleViolations).toHaveLength(0);
  });
});
