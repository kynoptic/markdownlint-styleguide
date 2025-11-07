/**
 * @integration
 * Test for issue #105: GitHub Alert keyword support.
 * 
 * Alert keywords should be uppercase per the GitHub Markdown Alerts specification:
 * NOTE, TIP, IMPORTANT, WARNING, CAUTION
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
  "../fixtures/sentence-case/heading/github-alerts.md",
);

describe("sentence-case-heading: GitHub Alert keywords (issue #105)", () => {
  const { passingLines, failingLines } = parseFixture(fixturePath);
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

  test("should_accept_uppercase_alert_keywords", () => {
    // Lines 11-15 have correct uppercase alert keywords
    const uppercaseAlertLines = [11, 12, 13, 14, 15];
    const violatingLines = violations.map((v) => v.lineNumber);
    
    uppercaseAlertLines.forEach(line => {
      expect(violatingLines).not.toContain(line);
    });
  });

  test("should_suggest_uppercase_when_alert_keywords_not_uppercase", () => {
    // Lines 22-26 have lowercase/title case alert keywords - should suggest uppercase
    const lowercaseAlertLines = [22, 23, 24, 25, 26];
    const violatingLines = violations.map((v) => v.lineNumber);

    lowercaseAlertLines.forEach(line => {
      expect(violatingLines).toContain(line);
    });
  });

  test("should_provide_correct_suggestion_for_note", () => {
    const noteViolation = violations.find(v => v.lineNumber === 22);
    expect(noteViolation).toBeDefined();
    expect(noteViolation.errorDetail).toMatch(/NOTE/i);
  });

  test.each(passingLines)(
    "should_not_report_violation_when_correctly_formatted_at_line_%i",
    (line) => {
      const violatingLines = violations.map((v) => v.lineNumber);
      expect(violatingLines).not.toContain(line);
    },
  );

  test.each(failingLines)(
    "should_report_violation_when_incorrectly_formatted_at_line_%i",
    (line) => {
      const violatingLines = violations.map((v) => v.lineNumber);
      expect(violatingLines).toContain(line);
    },
  );
});
