/**
 * @integration
 */
import path from "path";
import { fileURLToPath } from "url";
import { describe, test, expect, beforeAll } from "@jest/globals";
import { lint } from "markdownlint/promise";
import sentenceRule from "../../src/rules/sentence-case-heading.js";
import { parseFixture } from "../utils/fixture.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturePath = path.join(
  __dirname,
  "../fixtures/sentence-case/heading/list-items-bold.md",
);

describe("sentence-case-heading list-items-bold fixture", () => {
  const { passingLines, failingLines } = parseFixture(fixturePath);
  let violations = [];

  /**
   * Parse the fixture and collect all violations before running atomic tests.
   */
  beforeAll(async () => {
    const options = {
      customRules: [sentenceRule],
      files: [fixturePath],
      resultVersion: 3,
    };
    const results = await lint(options);
    violations = (results[fixturePath] || []).filter(
      (v) =>
        v.ruleNames.includes("sentence-case-heading") ||
        v.ruleNames.includes("SC001"),
    );
  });

  /**
   * Each passing line should NOT be reported as a violation.
   */
  test.each(passingLines)(
    "does not report violation for correctly formatted list item at line %i",
    (line) => {
      const violatingLines = violations.map((v) => v.lineNumber);
      expect(violatingLines).not.toContain(line);
    },
  );

  /**
   * Each failing line should be reported as a violation.
   */
  test.each(failingLines)(
    "reports violation for incorrectly formatted list item at line %i",
    (line) => {
      const violatingLines = violations.map((v) => v.lineNumber);
      expect(violatingLines).toContain(line);
    },
  );

  test("provides error messages", () => {
    if (violations.length === 0) {
      console.warn("⚠️ Test skipped: No violations detected");
      return;
    }

    violations.forEach((v) => {
      expect(v.errorDetail).toBeTruthy();
    });
  });
});
