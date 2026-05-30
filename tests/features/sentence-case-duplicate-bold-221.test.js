/**
 * @integration
 *
 * Regression coverage for #221: buildBoldTextFix located the bold span with a
 * plain indexOf, so a duplicate bold phrase on one line could have the wrong
 * occurrence rewritten. The rule caller now threads the matched span offset
 * through to buildBoldTextFix so the flagged occurrence is the one fixed.
 */
import { describe, test, expect } from "@jest/globals";
import { lint } from "markdownlint/promise";
import { applyFixes } from "markdownlint";
import sentenceRule from "../../src/rules/sentence-case-heading.js";

/**
 * Lint a single markdown string with the sentence-case rule.
 * @param {string} content - Markdown to lint.
 * @returns {Promise<Array>} Sentence-case violations for the content.
 */
async function lintContent(content) {
  const results = await lint({
    customRules: [sentenceRule],
    strings: { content },
    resultVersion: 3,
    fix: false,
  });
  return (results.content || []).filter(
    (v) =>
      v.ruleNames.includes("sentence-case-heading") ||
      v.ruleNames.includes("SC001"),
  );
}

describe("sentence-case duplicate bold autofix (#221)", () => {
  test("test_should_fix_flagged_span_when_duplicate_bold_phrase_on_line", async () => {
    const content = "- **Bold Text** and **Bold Text** more\n";

    const violations = await lintContent(content);
    expect(violations.length).toBeGreaterThan(0);

    // The flagged violation must carry a fixInfo whose editColumn points at the
    // bold span the rule actually validated. Applying the fix must produce a
    // well-formed line — never a corrupted span from rewriting the wrong half.
    const fixed = applyFixes(content, violations);
    expect(fixed).toBe("- **Bold text** and **Bold Text** more\n");
  });

  test("test_should_anchor_editColumn_to_validated_span_offset", async () => {
    // Leading emoji shifts the validated span off column 0, exercising a
    // non-zero offset path through the caller -> buildBoldTextFix threading.
    const content = "- 🚀 **Bold Text** and **Bold Text** end\n";

    const violations = await lintContent(content);
    expect(violations).toHaveLength(1);

    const { fixInfo } = violations[0];
    expect(fixInfo).toBeDefined();
    // The validated span is the first "**Bold Text**"; its opening "**" begins
    // at offset 4 (after "- 🚀 " where the emoji is two UTF-16 code units),
    // so editColumn lands just past it. Assert it matches the real offset
    // rather than a hard-coded indexOf assumption.
    const expectedColumn = content.indexOf("**Bold Text**") + 3;
    expect(fixInfo.editColumn).toBe(expectedColumn);
  });
});
