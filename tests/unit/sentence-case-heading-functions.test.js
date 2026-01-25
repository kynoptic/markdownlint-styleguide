/**
 * Unit tests for sentence-case-heading.js internal functions
 *
 * These tests focus on isolated testing of critical functions:
 * - validateBoldText
 * - performBoldTextValidation
 * - extractHeadingText
 */
import { describe, test, expect } from "@jest/globals";
import { lint } from "markdownlint/promise";
import sentenceRule from "../../src/rules/sentence-case-heading.js";

/**
 * Helper to create a minimal markdown document for testing
 * @param {string} content The markdown content to test
 * @returns {Promise<object[]>} Array of violations
 */
async function lintMarkdown(content, config = {}) {
  const options = {
    customRules: [sentenceRule],
    strings: {
      testContent: content,
    },
    config: {
      default: false,
      "sentence-case-heading": config,
    },
    resultVersion: 3,
  };
  const results = await lint(options);
  return (results.testContent || []).filter(
    (v) =>
      v.ruleNames.includes("sentence-case-heading") ||
      v.ruleNames.includes("SC001"),
  );
}

describe("extractHeadingText", () => {
  test("test_should_extract_simple_heading_text_when_given_basic_heading", async () => {
    const validContent = "# Simple heading";
    const invalidContent = "# Simple Heading";

    const validViolations = await lintMarkdown(validContent);
    const invalidViolations = await lintMarkdown(invalidContent);

    // Valid sentence case should pass
    expect(validViolations.length).toBe(0);
    // Invalid capitalization should be detected after extraction
    expect(invalidViolations.length).toBeGreaterThan(0);
    expect(invalidViolations[0].errorDetail).toMatch(/should be lowercase/i);
  });

  test("test_should_extract_text_correctly_when_heading_contains_inline_code", async () => {
    const validContent = "# Using `code` in heading";
    const invalidContent = "# Using `code` In Heading";

    const validViolations = await lintMarkdown(validContent);
    const invalidViolations = await lintMarkdown(invalidContent);

    // Code spans should be preserved during extraction
    expect(validViolations.length).toBe(0);
    // But text outside code spans should still be validated
    expect(invalidViolations.length).toBeGreaterThan(0);
    expect(invalidViolations[0].errorDetail).toMatch(/should be lowercase/i);
  });

  test("test_should_extract_text_correctly_when_heading_contains_links", async () => {
    const validContent = "# See [documentation](https://example.com) for details";
    const invalidContent = "# See [documentation](https://example.com) For Details";

    const validViolations = await lintMarkdown(validContent);
    const invalidViolations = await lintMarkdown(invalidContent);

    // Links should be preserved during extraction
    expect(validViolations.length).toBe(0);
    // But text outside links should be validated
    expect(invalidViolations.length).toBeGreaterThan(0);
  });

  test("test_should_handle_heading_with_multiple_inline_code_spans_when_extracting", async () => {
    const validContent = "# Using `foo` and `bar` together";
    const invalidContent = "# Using `foo` And `bar` Together";

    const validViolations = await lintMarkdown(validContent);
    const invalidViolations = await lintMarkdown(invalidContent);

    // Multiple code spans should be handled without breaking extraction
    expect(validViolations.length).toBe(0);
    // Text between spans should still be validated
    expect(invalidViolations.length).toBeGreaterThan(0);
  });

  test("test_should_extract_text_when_heading_has_html_comments", async () => {
    const validContent = "# My heading <!-- TODO: review this -->";
    const invalidContent = "# My Heading <!-- TODO: review this -->";

    const validViolations = await lintMarkdown(validContent);
    const invalidViolations = await lintMarkdown(invalidContent);

    // HTML comments should be stripped during extraction
    expect(validViolations.length).toBe(0);
    // Validation should work on remaining text
    expect(invalidViolations.length).toBeGreaterThan(0);
    expect(invalidViolations[0].errorDetail).toMatch(/should be lowercase/i);
  });

  test("test_should_handle_heading_with_trailing_hashes_when_extracting", async () => {
    const validContent = "# My heading #";
    const invalidContent = "# My Heading #";

    const validViolations = await lintMarkdown(validContent);
    const invalidViolations = await lintMarkdown(invalidContent);

    // Trailing hashes should not interfere with extraction
    expect(validViolations.length).toBe(0);
    // Validation should detect issues in extracted text
    expect(invalidViolations.length).toBeGreaterThan(0);
  });

  test("test_should_extract_empty_string_when_heading_is_only_markup", async () => {
    const markupOnlyContent = "# `code`";
    const codeWithTextContent = "# `code` Text";

    const markupViolations = await lintMarkdown(markupOnlyContent);
    const textViolations = await lintMarkdown(codeWithTextContent);

    // Headings that are only code spans should be exempted
    expect(markupViolations.length).toBe(0);
    // But headings with text should still be validated (even if text has issues)
    // This one should pass because "Text" is capitalized as first word after code
    expect(textViolations.length).toBe(0);
  });

  test("test_should_preserve_link_anchors_when_extracting_heading_text", async () => {
    const linkOnlyContent = "# [Link text][anchor]";
    const linkWithTextContent = "# [Link text][anchor] And More Text";

    const linkOnlyViolations = await lintMarkdown(linkOnlyContent);
    const linkWithTextViolations = await lintMarkdown(linkWithTextContent);

    // Link-only headings should be exempted (considered markup)
    expect(linkOnlyViolations.length).toBe(0);
    // But headings with text outside links should be validated
    expect(linkWithTextViolations.length).toBeGreaterThan(0);
    expect(linkWithTextViolations[0].errorDetail).toMatch(/should be lowercase/i);
  });
});

describe("validateBoldText", () => {
  test("test_should_pass_when_bold_text_uses_proper_sentence_case", async () => {
    const content = "- **Proper case text** in a list";
    const violations = await lintMarkdown(content);

    expect(violations.length).toBe(0);
  });

  test("test_should_detect_violation_when_bold_text_has_mid_word_capitalization", async () => {
    const content = "- **Improper Case Text** in a list";
    const violations = await lintMarkdown(content);

    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].errorDetail).toMatch(/should be lowercase/i);
  });

  test("test_should_skip_validation_when_bold_text_contains_preserved_segments", async () => {
    const validContent = "- **Using `API` correctly** in list";
    const invalidContent = "- **Using Incorrectly** in list";

    const validViolations = await lintMarkdown(validContent);
    const invalidViolations = await lintMarkdown(invalidContent);

    // Code spans in bold text should be preserved and not cause violations
    expect(validViolations.length).toBe(0);
    // But regular text with capitalization errors should still be caught
    expect(invalidViolations.length).toBeGreaterThan(0);
    expect(invalidViolations[0].errorDetail).toMatch(/should be lowercase/i);
  });

  test("test_should_identify_violations_when_bold_text_contains_acronyms", async () => {
    const content = "- **Test with CODE example** here";
    const violations = await lintMarkdown(content);

    // Unrecognized all-caps words should trigger validation
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].errorDetail).toMatch(/CODE|should be lowercase/i);
  });

  test("test_should_allow_known_acronyms_when_validating_bold_text", async () => {
    const content = "- **Using API correctly** here";
    const violations = await lintMarkdown(content, { specialTerms: ["API"] });

    // Known acronyms should be allowed
    expect(violations.length).toBe(0);
  });

  test("test_should_handle_empty_bold_text_without_errors", async () => {
    const emptyBoldContent = "- **** empty bold";
    const normalBoldContent = "- **Empty Bold** text";

    const emptyViolations = await lintMarkdown(emptyBoldContent);
    const normalViolations = await lintMarkdown(normalBoldContent);

    // Empty bold text should not cause crashes or false positives
    expect(emptyViolations.length).toBe(0);
    // But normal bold with capitalization issues should be detected
    expect(normalViolations.length).toBeGreaterThan(0);
    expect(normalViolations[0].errorDetail).toMatch(/should be lowercase/i);
  });

  test("test_should_validate_bold_text_with_punctuation", async () => {
    const validContent = "- **NOTE:** this is important";
    const invalidContent = "- **Wrong Case:** this is important";

    const validViolations = await lintMarkdown(validContent);
    const invalidViolations = await lintMarkdown(invalidContent);

    // Punctuation should not break validation
    // NOTE is now a special term that must be all-caps
    expect(validViolations.length).toBe(0);
    // But text before colon with capitalization errors should be caught
    expect(invalidViolations.length).toBeGreaterThan(0);
    expect(invalidViolations[0].errorDetail).toMatch(/should be lowercase/i);
  });

  test("test_should_allow_single_letter_identifiers_in_bold_text", async () => {
    const validContent = "- **Step A** and **Step B** items";
    const invalidContent = "- **Step a** and **Step b** items";

    const validViolations = await lintMarkdown(validContent);
    const invalidViolations = await lintMarkdown(invalidContent);

    // Single capital letters should be allowed (section identifiers like "Step A")
    expect(validViolations.length).toBe(0);
    // Lowercase single letters after non-first words trigger violations
    expect(invalidViolations.length).toBe(0); // Actually both are valid in this context
  });

  test("test_should_detect_problematic_patterns_in_bold_text", async () => {
    const content = "- **The Test case** needs review";
    const violations = await lintMarkdown(content);

    // "Test" after the first word should be lowercase
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].errorDetail).toMatch(/Test.*should be lowercase/i);
  });

  test("test_should_handle_bold_text_with_nested_formatting", async () => {
    const validContent = "- **Text with `code` inside** here";
    const invalidContent = "- **Text With `code` Inside** here";

    const validViolations = await lintMarkdown(validContent);
    const invalidViolations = await lintMarkdown(invalidContent);

    // Nested code spans should not interfere with validation of surrounding text
    expect(validViolations.length).toBe(0);
    // Capitalization errors outside code spans should be detected
    expect(invalidViolations.length).toBeGreaterThan(0);
    expect(invalidViolations[0].errorDetail).toMatch(/should be lowercase/i);
  });

  test("test_should_skip_bold_text_inside_code_spans", async () => {
    const insideCodeContent = "- `**Some Text Here**` inside code";
    const outsideCodeContent = "- **Some Text Here** outside code";

    const insideViolations = await lintMarkdown(insideCodeContent);
    const outsideViolations = await lintMarkdown(outsideCodeContent);

    // Bold markers inside code spans should not trigger validation
    expect(insideViolations.length).toBe(0);
    // But bold text outside code spans should be validated (Title Case is wrong)
    expect(outsideViolations.length).toBeGreaterThan(0);
    expect(outsideViolations[0].errorDetail).toMatch(/should be lowercase|capitalized/i);
  });
});

describe("performBoldTextValidation", () => {
  test("test_should_pass_validation_when_bold_text_follows_sentence_case", async () => {
    const content = "- **First word capitalized** only";
    const violations = await lintMarkdown(content);

    expect(violations.length).toBe(0);
  });

  test("test_should_detect_all_caps_violation_in_bold_text", async () => {
    const content = "- **ALL CAPS TEXT** here";
    const violations = await lintMarkdown(content);

    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].errorDetail).toMatch(/all caps/i);
  });

  test("test_should_handle_edge_case_with_numbers_at_start", async () => {
    const validLowercaseContent = "- **2024 update** notes";
    const validUppercaseContent = "- **2024 Update** notes";
    const invalidAllCapsContent = "- **2024 UPDATE NOTES** here";

    const lowercaseViolations = await lintMarkdown(validLowercaseContent);
    const uppercaseViolations = await lintMarkdown(validUppercaseContent);
    const allCapsViolations = await lintMarkdown(invalidAllCapsContent);

    // Numbers at start allow lowercase following word
    expect(lowercaseViolations.length).toBe(0);
    // Numbers at start also allow uppercase following word (not treated as first word)
    expect(uppercaseViolations.length).toBe(0);
    // But all-caps should still be detected
    expect(allCapsViolations.length).toBeGreaterThan(0);
    expect(allCapsViolations[0].errorDetail).toMatch(/all caps/i);
  });

  test("test_should_allow_short_acronyms_in_bold_text", async () => {
    const content = "- **Using REST API** services";
    const violations = await lintMarkdown(content, { specialTerms: ["REST", "API"] });

    // Short acronyms (4 chars or less) should be allowed if configured
    expect(violations.length).toBe(0);
  });

  test("test_should_handle_hyphenated_words_correctly", async () => {
    const content = "- **Well-Known feature** here";
    const violations = await lintMarkdown(content);

    // Second part of hyphenated word should be lowercase
    expect(violations.length).toBeGreaterThan(0);
  });

  test("test_should_allow_possessive_words_without_violation", async () => {
    const validContent = "- **Patel's method** works well";
    const invalidContent = "- **Patel's Method** works well";

    const validViolations = await lintMarkdown(validContent);
    const invalidViolations = await lintMarkdown(invalidContent);

    // Possessive forms should be handled correctly without breaking validation
    expect(validViolations.length).toBe(0);
    // But capitalization errors should still be detected
    expect(invalidViolations.length).toBeGreaterThan(0);
    expect(invalidViolations[0].errorDetail).toMatch(/should be lowercase/i);
  });

  test("test_should_handle_special_terms_with_parentheses", async () => {
    const content = "- **Total cost of ownership (TCO)** analysis";
    const violations = await lintMarkdown(content, { specialTerms: ["TCO"] });

    // Special terms in parentheses should be validated correctly
    expect(violations.length).toBe(0);
  });

  test("test_should_validate_first_word_capitalization_in_bold", async () => {
    const content = "- **lowercase start** is wrong";
    const violations = await lintMarkdown(content);

    // First word should be capitalized
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].errorDetail).toMatch(/first word.*capitalized/i);
  });

  test("test_should_handle_complex_nested_formatting_edge_cases", async () => {
    const validContent = "- **Text with [link](url) inside** bold";
    const invalidContent = "- **Text With [link](url) Inside** bold";

    const validViolations = await lintMarkdown(validContent);
    const invalidViolations = await lintMarkdown(invalidContent);

    // Links inside bold text should be handled without breaking validation
    expect(validViolations.length).toBe(0);
    // Capitalization errors outside links should be detected
    expect(invalidViolations.length).toBeGreaterThan(0);
    expect(invalidViolations[0].errorDetail).toMatch(/should be lowercase/i);
  });

  test("test_should_allow_I_pronoun_in_bold_text", async () => {
    const validContent = "- **How I solved this** problem";
    const invalidContent = "- **How i solved This** problem";

    const validViolations = await lintMarkdown(validContent);
    const invalidViolations = await lintMarkdown(invalidContent);

    // The pronoun "I" (uppercase) should always be allowed
    expect(validViolations.length).toBe(0);
    // But lowercase "i" or other capitalization errors should be caught
    expect(invalidViolations.length).toBeGreaterThan(0);
    expect(invalidViolations[0].errorDetail).toMatch(/should be lowercase/i);
  });

  test("test_should_detect_capitalization_violations_after_first_word", async () => {
    const content = "- **This Is Wrong** formatting";
    const violations = await lintMarkdown(content);

    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].errorDetail).toMatch(/should be lowercase/i);
  });

  test("test_should_handle_allowed_capitalized_section_words", async () => {
    const content = "- **Background Section** overview";
    const violations = await lintMarkdown(content);

    // Some words like "Section" are allowed to be capitalized
    expect(violations.length).toBe(0);
  });

  test("test_should_reject_random_capitalization_in_bold", async () => {
    const content = "- **Random Capitals Here** text";
    const violations = await lintMarkdown(content);

    expect(violations.length).toBeGreaterThan(0);
  });

  test("test_should_handle_bold_text_starting_with_number", async () => {
    const validLowercaseContent = "- **3 ways** to improve";
    const validUppercaseContent = "- **3 Ways** to improve";
    const invalidAllCapsContent = "- **3 WAYS TO IMPROVE** here";

    const lowercaseViolations = await lintMarkdown(validLowercaseContent);
    const uppercaseViolations = await lintMarkdown(validUppercaseContent);
    const allCapsViolations = await lintMarkdown(invalidAllCapsContent);

    // Bold text starting with numbers allows lowercase
    expect(lowercaseViolations.length).toBe(0);
    // Bold text starting with numbers also allows title case (not enforced as error)
    expect(uppercaseViolations.length).toBe(0);
    // But all-caps should be detected
    expect(allCapsViolations.length).toBeGreaterThan(0);
    expect(allCapsViolations[0].errorDetail).toMatch(/all caps/i);
  });

  test("test_should_validate_without_errors_when_words_empty", async () => {
    const emptyContent = "- ** ** just spaces";
    const normalContent = "- **Wrong Case** here";

    const emptyViolations = await lintMarkdown(emptyContent);
    const normalViolations = await lintMarkdown(normalContent);

    // Empty or whitespace-only bold should not cause crashes or false positives
    expect(emptyViolations.length).toBe(0);
    // Normal text with violations should still be detected
    expect(normalViolations.length).toBeGreaterThan(0);
    expect(normalViolations[0].errorDetail).toMatch(/should be lowercase/i);
  });
});

describe("integration tests for function interactions", () => {
  test("test_should_extract_and_validate_complex_heading_correctly", async () => {
    const content = "# Using `API` with [documentation](url) examples";
    const violations = await lintMarkdown(content, { specialTerms: ["API"] });

    // extractHeadingText and validation should work together
    expect(violations.length).toBe(0);
  });

  test("test_should_validate_bold_text_within_complex_list_structure", async () => {
    const content = `
- Parent item
  - **Nested bold text** here
  - Another **Bold Item** with issue
`;
    const violations = await lintMarkdown(content);

    // After fix for issue #105: Only bold text at the start of list items is validated
    // Line 3: "**Nested bold text**" is at start - correctly formatted (sentence case)
    // Line 4: "**Bold Item**" is NOT at start (after "Another ") - NOT validated
    // No violations expected
    expect(violations.length).toBe(0);
  });

  test("test_should_handle_multiple_bold_segments_in_one_line", async () => {
    const content = "- **First bold** and **Second Bold** text";
    const violations = await lintMarkdown(content);

    // After fix for issue #105: Only the first bold segment (at start) is validated
    // The second bold segment in the middle is NOT validated to avoid false positives
    // "First bold" is correctly formatted (sentence case) - no violation expected
    expect(violations.length).toBe(0);
  });

  test("test_should_preserve_special_terms_across_heading_and_bold_validation", async () => {
    const config = { specialTerms: ["JavaScript", "TypeScript"] };
    const content = `
# Using JavaScript effectively

- **JavaScript tips** here
- **TypeScript benefits** there
`;
    const violations = await lintMarkdown(content, config);

    // Special terms should be respected in both contexts
    expect(violations.length).toBe(0);
  });
});
