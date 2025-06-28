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
  "../fixtures/sentence-case/failing.fixture.md",
);

/**
 * Test suite for sentence-case-heading rule on a failing fixture.
 * Ensures that all expected lines are reported as violations and that error messages are provided.
 */
describe("sentence-case-heading failing fixture", () => {
  const failingLines = parseFixture(fixturePath).failingLines;
  let violations = [];

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
   * Each failing line should be reported as a violation.
   */
  test.each(failingLines)("reports violation for line %i", (line) => {
    const numbers = violations.map((v) => v.lineNumber);
    expect(numbers).toContain(line);
  });

  /**
   * Each violation should provide an error message.
   */
  test("provides error messages for all violations", () => {
    violations.forEach((v) => {
      expect(v.errorDetail).toBeTruthy();
    });
  });
});
