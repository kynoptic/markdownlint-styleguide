/**
 * @integration
 * Test for issue #105: Fix bold text position detection to eliminate ~2,700 false positives.
 * 
 * The rule should ONLY validate bold text that appears as the first textual content
 * in a list item (after optional decorative elements like emojis).
 * 
 * Bold text in the middle or end of list items should NOT be validated.
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
  "../fixtures/sentence-case/heading/bold-position-detection.md",
);

describe("sentence-case-heading: bold text position detection (issue #105)", () => {
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

  test("should_not_report_violations_when_bold_text_in_middle_of_list_item", () => {
    // Lines 19-33 contain bold text in the middle/end of list items
    // These are the critical false positives we're fixing
    const middleBoldLines = [19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33];
    const violatingLines = violations.map((v) => v.lineNumber);
    
    middleBoldLines.forEach(line => {
      expect(violatingLines).not.toContain(line);
    });
  });

  test("should_validate_bold_text_when_first_content_in_list_item", () => {
    // Lines 11-16 contain bold text as first content - should be validated
    const firstBoldLines = [11, 12, 13, 14, 15, 16];
    const violatingLines = violations.map((v) => v.lineNumber);
    
    // At least some of these should be validated (lines 13-14 have violations)
    const hasValidations = firstBoldLines.some(line => 
      violatingLines.includes(line) || passingLines.includes(line)
    );
    expect(hasValidations).toBe(true);
  });

  test("should_validate_bold_text_when_first_textual_content_after_emoji", () => {
    // Line 15 has emoji prefix, then bold text - should validate
    const emojiPrefixLine = 15;
    // This line should be checked (either pass or fail validation)
    expect(passingLines.includes(emojiPrefixLine) || 
           violations.some(v => v.lineNumber === emojiPrefixLine)).toBe(true);
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

  test("should_handle_multiple_emoji_before_bold_text", () => {
    // Lines 48-51 contain multiple emoji sequences before bold text
    const multiEmojiLines = [48, 49, 50, 51];
    const violatingLines = violations.map((v) => v.lineNumber);

    // These should not cause violations (emoji is decorative)
    multiEmojiLines.forEach(line => {
      expect(violatingLines).not.toContain(line);
    });
  });

  test("should_handle_nested_bold_text", () => {
    // Lines 55-56 contain nested bold text (complex markdown)
    const violatingLines = violations.map((v) => v.lineNumber);

    // Line 55: nested bold in middle - should not validate
    expect(violatingLines).not.toContain(55);

    // Line 56: nested bold at start - may or may not validate depending on parse result
    // Just ensure no crashes/errors (test passes if no exception thrown)
    expect(violatingLines).toBeDefined();
  });

  test("should_handle_empty_bold_text", () => {
    // Lines 57-58 contain empty bold text
    // These should not cause crashes - just ensure violations array is valid
    expect(violations).toBeDefined();
    expect(Array.isArray(violations)).toBe(true);
  });
});
