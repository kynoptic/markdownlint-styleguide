/**
 * Unit tests for case classifier module
 * Tests validation logic for sentence case in isolation
 */
import { describe, test, expect } from "@jest/globals";
import {
  prepareTextForValidation,
  validateHeading,
  validateBoldText,
  isAllCapsHeading,
  stripLeadingSymbols,
} from "../../src/rules/sentence-case/case-classifier.js";

describe("stripLeadingSymbols", () => {
  test("test_should_remove_single_emoji_from_start_of_text", () => {
    const result = stripLeadingSymbols("🎉 Celebration heading");
    expect(result).toBe("Celebration heading");
  });

  test("test_should_remove_multiple_emojis_from_start", () => {
    const result = stripLeadingSymbols("🚀✨ Launch heading");
    expect(result).toBe("Launch heading");
  });

  test("test_should_handle_complex_emoji_with_modifiers", () => {
    const result = stripLeadingSymbols("👨🏻‍💻 Developer guide");
    expect(result).toBe("Developer guide");
  });

  test("test_should_not_remove_emoji_from_middle_of_text", () => {
    const result = stripLeadingSymbols("Text with 🎉 emoji inside");
    expect(result).toBe("Text with 🎉 emoji inside");
  });

  test("test_should_return_original_when_no_leading_symbols", () => {
    const result = stripLeadingSymbols("Plain text heading");
    expect(result).toBe("Plain text heading");
  });

  test("test_should_handle_empty_string", () => {
    const result = stripLeadingSymbols("");
    expect(result).toBe("");
  });

  test("test_should_handle_whitespace_after_emoji", () => {
    const result = stripLeadingSymbols("🔧   Maintenance");
    expect(result).toBe("Maintenance");
  });
});

describe("isAllCapsHeading", () => {
  test("test_should_return_true_when_all_words_are_uppercase", () => {
    const words = ["ALL", "CAPS", "HEADING"];
    expect(isAllCapsHeading(words)).toBe(true);
  });

  test("test_should_return_false_when_mixed_case", () => {
    const words = ["Mixed", "Case", "heading"];
    expect(isAllCapsHeading(words)).toBe(false);
  });

  test("test_should_return_false_for_single_word", () => {
    const words = ["SINGLE"];
    expect(isAllCapsHeading(words)).toBe(false);
  });

  test("test_should_ignore_preserved_segments", () => {
    const words = ["ALL", "__PRESERVED_0__", "CAPS"];
    expect(isAllCapsHeading(words)).toBe(true);
  });

  test("test_should_return_false_when_contains_numbers", () => {
    const words = ["VERSION", "2024"];
    expect(isAllCapsHeading(words)).toBe(false);
  });

  test("test_should_return_false_for_empty_array", () => {
    const words = [];
    expect(isAllCapsHeading(words)).toBe(false);
  });

  test("test_should_return_false_when_single_character_words", () => {
    const words = ["A"];
    expect(isAllCapsHeading(words)).toBe(false);
  });
});

describe("prepareTextForValidation", () => {
  test("test_should_preserve_code_spans_and_return_processed_words", () => {
    const result = prepareTextForValidation("Using `API` correctly");
    expect(result).not.toBeNull();
    expect(result.words).toContain("Using");
    expect(result.words).toContain("__PRESERVED_0__");
    expect(result.words).toContain("correctly");
  });

  test("test_should_return_null_when_heading_is_bracket_enclosed", () => {
    const result = prepareTextForValidation("[Unreleased]");
    expect(result).toBeNull();
  });

  test("test_should_return_null_when_no_alphabetic_characters", () => {
    const result = prepareTextForValidation("123.45");
    expect(result).toBeNull();
  });

  test("test_should_detect_leading_emoji_and_set_flag", () => {
    const result = prepareTextForValidation("🎉 Party heading");
    expect(result).not.toBeNull();
    expect(result.hadLeadingEmoji).toBe(true);
    expect(result.cleanedText).toBe("Party heading");
  });

  test("test_should_not_set_emoji_flag_when_no_leading_emoji", () => {
    const result = prepareTextForValidation("Plain heading");
    expect(result).not.toBeNull();
    expect(result.hadLeadingEmoji).toBe(false);
  });

  test("test_should_return_null_when_heading_starts_with_code_span", () => {
    const result = prepareTextForValidation("`code` only");
    expect(result).toBeNull();
  });

  test("test_should_preserve_links_in_heading", () => {
    const result = prepareTextForValidation("See [docs](url) here");
    expect(result).not.toBeNull();
    expect(result.words).toContain("See");
    expect(result.words).toContain("__PRESERVED_0__");
    expect(result.words).toContain("here");
  });

  test("test_should_return_null_when_mostly_code_content", () => {
    const result = prepareTextForValidation("`long code span here` X");
    // More than 40% code content should be exempted
    expect(result).toBeNull();
  });

  test("test_should_handle_empty_heading", () => {
    const result = prepareTextForValidation("");
    expect(result).toBeNull();
  });

  test("test_should_handle_whitespace_only_heading", () => {
    const result = prepareTextForValidation("   ");
    expect(result).toBeNull();
  });
});

describe("validateHeading", () => {
  const defaultSpecialTerms = { api: "API", javascript: "JavaScript" };

  test("test_should_return_valid_for_proper_sentence_case", () => {
    const result = validateHeading("This is correct", defaultSpecialTerms);
    expect(result.isValid).toBe(true);
  });

  test("test_should_detect_improper_capitalization_in_mid_heading", () => {
    const result = validateHeading("This Is Wrong", defaultSpecialTerms);
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toMatch(/should be lowercase/i);
  });

  test("test_should_allow_special_terms_with_custom_casing", () => {
    const result = validateHeading("Using JavaScript correctly", defaultSpecialTerms);
    expect(result.isValid).toBe(true);
  });

  test("test_should_detect_incorrect_special_term_casing", () => {
    const result = validateHeading("Using javascript wrongly", defaultSpecialTerms);
    expect(result.isValid).toBe(false);
  });

  test("test_should_allow_short_acronyms", () => {
    const result = validateHeading("Using REST API", defaultSpecialTerms);
    expect(result.isValid).toBe(true);
  });

  test("test_should_detect_all_caps_heading", () => {
    const result = validateHeading("ALL CAPS HEADING", defaultSpecialTerms);
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toMatch(/all caps/i);
  });

  test("test_should_validate_first_word_capitalization", () => {
    const result = validateHeading("lowercase start", defaultSpecialTerms);
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toMatch(/capitalized/i);
  });

  test("test_should_allow_heading_with_leading_emoji", () => {
    const result = validateHeading("🎉 Proper heading", defaultSpecialTerms);
    expect(result.isValid).toBe(true);
  });

  test("test_should_handle_heading_with_colon", () => {
    const result = validateHeading("Title: Subtitle here", defaultSpecialTerms);
    expect(result.isValid).toBe(true);
  });

  test("test_should_allow_pronoun_I_in_heading", () => {
    const result = validateHeading("How I solved this", defaultSpecialTerms);
    expect(result.isValid).toBe(true);
  });

  test("test_should_handle_hyphenated_words", () => {
    const result = validateHeading("Well-known issue", defaultSpecialTerms);
    expect(result.isValid).toBe(true);
  });

  test("test_should_detect_capitalized_hyphenated_suffix", () => {
    const result = validateHeading("Well-Known issue", defaultSpecialTerms);
    expect(result.isValid).toBe(false);
  });

  test("test_should_allow_possessive_forms", () => {
    const result = validateHeading("Patel's method", defaultSpecialTerms);
    expect(result.isValid).toBe(true);
  });

  test("test_should_skip_heading_starting_with_year", () => {
    const result = validateHeading("2024 roadmap", defaultSpecialTerms);
    expect(result.isValid).toBe(true);
  });

  test("test_should_handle_heading_with_preserved_segments", () => {
    const result = validateHeading("Using `code` properly", defaultSpecialTerms);
    expect(result.isValid).toBe(true);
  });
});

describe("validateBoldText", () => {
  const defaultSpecialTerms = { api: "API", rest: "REST" };

  test("test_should_return_valid_for_proper_bold_sentence_case", () => {
    const result = validateBoldText("Proper bold text", defaultSpecialTerms);
    expect(result.isValid).toBe(true);
  });

  test("test_should_detect_improper_capitalization_in_bold", () => {
    const result = validateBoldText("Improper Bold Text", defaultSpecialTerms);
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toMatch(/should be lowercase/i);
  });

  test("test_should_allow_known_acronyms_in_bold", () => {
    const result = validateBoldText("Using REST API", defaultSpecialTerms);
    expect(result.isValid).toBe(true);
  });

  test("test_should_detect_all_caps_bold_text", () => {
    const result = validateBoldText("ALL CAPS TEXT", defaultSpecialTerms);
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toMatch(/all caps/i);
  });

  test("test_should_validate_first_word_in_bold", () => {
    const result = validateBoldText("lowercase start", defaultSpecialTerms);
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toMatch(/capitalized/i);
  });

  test("test_should_allow_bold_starting_with_number", () => {
    const result = validateBoldText("3 ways to improve", defaultSpecialTerms);
    expect(result.isValid).toBe(true);
  });

  test("test_should_detect_problematic_patterns_like_CODE", () => {
    const result = validateBoldText("Test with CODE example", defaultSpecialTerms);
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toMatch(/CODE|should be lowercase/i);
  });

  test("test_should_allow_section_words_capitalized", () => {
    const result = validateBoldText("Background Section", defaultSpecialTerms);
    expect(result.isValid).toBe(true);
  });

  test("test_should_allow_short_acronyms_4_chars_or_less", () => {
    const result = validateBoldText("Using REST services", defaultSpecialTerms);
    expect(result.isValid).toBe(true);
  });

  test("test_should_allow_single_letter_identifiers", () => {
    const result = validateBoldText("Step A completed", defaultSpecialTerms);
    expect(result.isValid).toBe(true);
  });

  test("test_should_handle_bold_with_possessives", () => {
    const result = validateBoldText("Patel's approach", defaultSpecialTerms);
    expect(result.isValid).toBe(true);
  });

  test("test_should_handle_special_terms_in_parentheses", () => {
    const result = validateBoldText("Total cost (TCO) analysis", { tco: "TCO" });
    expect(result.isValid).toBe(true);
  });

  test("test_should_allow_pronoun_I_in_bold", () => {
    const result = validateBoldText("How I solved this", defaultSpecialTerms);
    expect(result.isValid).toBe(true);
  });

  test("test_should_handle_bold_with_nested_code", () => {
    const result = validateBoldText("Using `code` properly", defaultSpecialTerms);
    expect(result.isValid).toBe(true);
  });

  test("test_should_handle_empty_bold_text", () => {
    const result = validateBoldText("", defaultSpecialTerms);
    expect(result.isValid).toBe(true); // Empty text should not error
  });
});
