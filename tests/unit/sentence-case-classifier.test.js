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
import {
  ambiguousTerms,
  casingTerms,
} from "../../src/rules/shared-constants.js";

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

  test("test_should_preserve_accented_text_after_emoji_prefix", () => {
    const result = stripLeadingSymbols("🎉 Étude de cas");
    expect(result).toBe("Étude de cas");
  });

  test("test_should_preserve_cjk_text_after_flag_emoji_prefix", () => {
    const result = stripLeadingSymbols("🇯🇵 日本語ガイド");
    expect(result).toBe("日本語ガイド");
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

  test("test_should_prepare_heading_with_accented_letters_after_emoji", () => {
    const result = prepareTextForValidation("🎉 Étude de cas");
    expect(result).not.toBeNull();
    expect(result.hadLeadingEmoji).toBe(true);
    expect(result.cleanedText).toBe("Étude de cas");
  });

  test("test_should_prepare_heading_with_cjk_characters_after_emoji", () => {
    const result = prepareTextForValidation("🎉 日本語ガイド");
    expect(result).not.toBeNull();
    expect(result.cleanedText).toBe("日本語ガイド");
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

  test("test_should_validate_heading_with_accented_letters_after_emoji", () => {
    const result = validateHeading("🎉 Étude de cas", defaultSpecialTerms);
    expect(result.isValid).toBe(true);
  });

  test("test_should_detect_lowercase_start_for_accented_heading", () => {
    const result = validateHeading("🎉 étude de cas", defaultSpecialTerms);
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain('"Étude"');
  });

  test("test_should_handle_cyrillic_uppercase_detection", () => {
    // Cyrillic heading with proper sentence case (first letter uppercase, rest lowercase)
    const result = validateHeading("🎉 Привет мир", defaultSpecialTerms);
    expect(result.isValid).toBe(true);
  });

  test("test_should_detect_cyrillic_lowercase_start", () => {
    // Cyrillic heading starting with lowercase after emoji
    const result = validateHeading("🎉 привет мир", defaultSpecialTerms);
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain('"Привет"');
  });

  test("test_should_handle_greek_uppercase_detection", () => {
    // Greek heading with proper sentence case
    const result = validateHeading("🎉 Γεια σου κόσμος", defaultSpecialTerms);
    expect(result.isValid).toBe(true);
  });

  test("test_should_detect_greek_lowercase_start", () => {
    // Greek heading starting with lowercase after emoji
    const result = validateHeading("🎉 γεια σου κόσμος", defaultSpecialTerms);
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain('"Γεια"');
  });

  test("test_should_handle_arabic_rtl_script_detects_as_all_caps", () => {
    // Arabic (RTL) heading - Arabic has no uppercase/lowercase distinction
    // The Unicode regex \p{Lu} doesn't match Arabic letters, but they're detected as "all caps"
    // because the isAllCapsHeading check sees them all as toUpperCase() === the original
    const result = validateHeading("مرحبا بالعالم", defaultSpecialTerms);
    expect(result.isValid).toBe(false);
    // This documents current behavior - RTL scripts without case may fail validation
    expect(result.errorMessage).toMatch(/all caps/i);
  });

  test("test_should_handle_hebrew_rtl_script_detects_as_all_caps", () => {
    // Hebrew (RTL) heading - Hebrew has no uppercase/lowercase distinction
    // Similar to Arabic, detected as "all caps" by the validation logic
    const result = validateHeading("שלום עולם", defaultSpecialTerms);
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toMatch(/all caps/i);
  });

  test("test_should_handle_mixed_script_heading_with_acronym_and_cjk", () => {
    // Mixed script: English acronym + Japanese (CJK has no case distinction)
    // Japanese characters also detected as "all uppercase" because they have no lowercase form
    const result = validateHeading("API ドキュメント", defaultSpecialTerms);
    // Documents current limitation: CJK characters fail all-caps check
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toMatch(/all caps/i);
  });

  test("test_should_handle_mixed_script_heading_proper_case", () => {
    // Mixed script with proper sentence case
    const result = validateHeading("Using ドキュメント correctly", defaultSpecialTerms);
    expect(result.isValid).toBe(true);
  });

  test("test_should_detect_improper_case_in_mixed_script", () => {
    // Mixed script with improper capitalization in Latin part
    const result = validateHeading("Using Wrong ドキュメント", defaultSpecialTerms);
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toMatch(/should be lowercase/i);
  });

  test("allows digit-leading heading wrapped in HTML span anchor", () => {
    // Issue #146: HTML span anchors followed by digit-leading text
    const text = '<span id="note-1a-prose">1.a \u2014 Prose clarity</span>';
    const result = validateHeading(text, defaultSpecialTerms);
    expect(result.isValid).toBe(true);
  });

  test("allows another digit-leading heading with HTML span", () => {
    const text = '<span id="note-2b-citations">2.b \u2014 Inline citations</span>';
    const result = validateHeading(text, defaultSpecialTerms);
    expect(result.isValid).toBe(true);
  });

  test("allows plain digit-leading heading without HTML", () => {
    const text = "1.a \u2014 Prose clarity";
    const result = validateHeading(text, defaultSpecialTerms);
    expect(result.isValid).toBe(true);
  });

  test("still validates HTML span with lowercase letter-leading text", () => {
    const text = '<span id="anchor">lowercase heading</span>';
    const result = validateHeading(text, defaultSpecialTerms);
    expect(result.isValid).toBe(false);
  });

  test("treats 'skills' as a regular lowercase word (#157)", () => {
    const result = validateHeading("Code skills", defaultSpecialTerms);
    expect(result.isValid).toBe(true);
  });

  test("treats 'skill' as a regular lowercase word (#157)", () => {
    const result = validateHeading("Agent skill overview", defaultSpecialTerms);
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

  test("treats 'skills' as a regular lowercase word in bold (#157)", () => {
    const result = validateBoldText("Use skills", defaultSpecialTerms);
    expect(result.isValid).toBe(true);
  });

  test("treats 'skill' as a regular lowercase word in bold (#157)", () => {
    const result = validateBoldText("Analysis skill", defaultSpecialTerms);
    expect(result.isValid).toBe(true);
  });
});

describe("issue #157: skills/skill not in special dictionaries", () => {
  test("'skills' is not in ambiguousTerms", () => {
    expect(ambiguousTerms).not.toHaveProperty("skills");
  });

  test("'skill' is not in ambiguousTerms", () => {
    expect(ambiguousTerms).not.toHaveProperty("skill");
  });

  test("'skills' is not in casingTerms", () => {
    expect(casingTerms).not.toHaveProperty("skills");
  });

  test("'skill' is not in casingTerms", () => {
    expect(casingTerms).not.toHaveProperty("skill");
  });
});

describe("issue #176: step prefixes like 5a", () => {
  test("test_should_skip_step_prefix_5a_and_validate_next_word", () => {
    const result = validateHeading("5a Create the initial structure", casingTerms);
    expect(result.isValid).toBe(true);
  });

  test("test_should_flag_lowercase_after_step_prefix", () => {
    const result = validateHeading("5a create the initial structure", casingTerms);
    expect(result.isValid).toBe(false);
  });
});

describe("issue #185: kebab-case first words", () => {
  test("test_should_accept_kebab_case_first_word", () => {
    const result = validateHeading("agent-playbook overview", casingTerms);
    expect(result.isValid).toBe(true);
  });

  test("test_should_accept_multi_segment_kebab_case", () => {
    const result = validateHeading("my-cool-component setup guide", casingTerms);
    expect(result.isValid).toBe(true);
  });
});

describe("issue #184: contextual ALL_CAPS callout keywords", () => {
  test("test_should_allow_allcaps_callout_keywords", () => {
    const result = validateHeading("NOTE about this feature", casingTerms);
    expect(result.isValid).toBe(true);
  });

  test("test_should_allow_allcaps_warning_keyword", () => {
    const result = validateHeading("WARNING for users", casingTerms);
    expect(result.isValid).toBe(true);
  });

  test("test_should_accept_sentence_cased_note_as_first_word", () => {
    const terms = { ...casingTerms, note: "NOTE" };
    const result = validateHeading("Note about security", terms);
    expect(result.isValid).toBe(true);
  });

  test("test_should_accept_lowercase_note_in_subsequent_position", () => {
    const terms = { ...casingTerms, note: "NOTE" };
    const result = validateHeading("Important note about security", terms);
    expect(result.isValid).toBe(true);
  });

  test("test_should_accept_emoji_plus_kebab_case_first_word", () => {
    const result = validateHeading("🚀 agent-playbook overview", casingTerms);
    expect(result.isValid).toBe(true);
  });
});

describe("issue #159: common English prefixes not flagged as acronyms", () => {
  const defaultSpecialTerms = { api: "API", rest: "REST" };

  test.each([
    ["Auto-update", "auto"],
    ["Semi-automatic", "semi"],
    ["Mega-pixel", "mega"],
    ["Mini-batch", "mini"],
    ["Mono-repo", "mono"],
    ["Poly-morphic", "poly"],
    ["Para-normal", "para"],
  ])("heading starting with %s is valid (prefix: %s)", (compound) => {
    const result = validateHeading(`${compound} mode`, defaultSpecialTerms);
    expect(result.isValid).toBe(true);
  });

  test.each([
    ["Auto-update", "auto"],
    ["Semi-automatic", "semi"],
    ["Mega-pixel", "mega"],
    ["Mini-batch", "mini"],
    ["Mono-repo", "mono"],
    ["Poly-morphic", "poly"],
    ["Para-normal", "para"],
  ])("bold text starting with %s is valid (prefix: %s)", (compound) => {
    const result = validateBoldText(`${compound} mode`, defaultSpecialTerms);
    expect(result.isValid).toBe(true);
  });

  test("still flags actual misspelled acronyms like Yaml-based", () => {
    const result = validateHeading("Yaml-based config", defaultSpecialTerms);
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toMatch(/YAML/);
  });
});
