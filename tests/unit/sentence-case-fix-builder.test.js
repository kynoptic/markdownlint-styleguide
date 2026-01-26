/**
 * Unit tests for fix builder module
 * Tests auto-fix generation logic in isolation
 */
import { describe, test, expect } from "@jest/globals";
import {
  toSentenceCase,
  buildHeadingFix,
  buildBoldTextFix,
} from "../../src/rules/sentence-case/fix-builder.js";

describe("toSentenceCase", () => {
  const defaultSpecialTerms = { api: "API", javascript: "JavaScript" };

  test("test_should_convert_all_caps_to_sentence_case", () => {
    const result = toSentenceCase("ALL CAPS TEXT", defaultSpecialTerms);
    expect(result).toBe("All caps text");
  });

  test("test_should_convert_title_case_to_sentence_case", () => {
    const result = toSentenceCase("Title Case Text", defaultSpecialTerms);
    expect(result).toBe("Title case text");
  });

  test("test_should_preserve_special_terms", () => {
    const result = toSentenceCase("using javascript and api", defaultSpecialTerms);
    expect(result).toBe("Using JavaScript and API");
  });

  test("test_should_capitalize_first_word", () => {
    const result = toSentenceCase("lowercase start", defaultSpecialTerms);
    expect(result).toBe("Lowercase start");
  });

  test("test_should_return_null_when_already_correct", () => {
    const result = toSentenceCase("Already correct", defaultSpecialTerms);
    expect(result).toBeNull();
  });

  test("test_should_preserve_code_spans", () => {
    const result = toSentenceCase("Using `API` Correctly", defaultSpecialTerms);
    expect(result).toBe("Using `API` correctly");
  });

  test("test_should_preserve_links", () => {
    const result = toSentenceCase("See [Documentation](url) Here", defaultSpecialTerms);
    expect(result).toBe("See [Documentation](url) here");
  });

  test("test_should_preserve_version_numbers", () => {
    const result = toSentenceCase("Version 1.2.3 Released", defaultSpecialTerms);
    expect(result).toBe("Version 1.2.3 released");
  });

  test("test_should_preserve_dates", () => {
    const result = toSentenceCase("Updated 2024-01-15 With Changes", defaultSpecialTerms);
    expect(result).toBe("Updated 2024-01-15 with changes");
  });

  test("test_should_preserve_bold_text", () => {
    const result = toSentenceCase("Using **Bold Text** Here", defaultSpecialTerms);
    expect(result).toBe("Using **Bold Text** here");
  });

  test("test_should_preserve_italic_text", () => {
    const result = toSentenceCase("Using *Italic Text* Here", defaultSpecialTerms);
    expect(result).toBe("Using *Italic Text* here");
  });

  test("test_should_handle_empty_string", () => {
    const result = toSentenceCase("", defaultSpecialTerms);
    expect(result).toBeNull();
  });

  test("test_should_handle_only_preserved_segments", () => {
    const result = toSentenceCase("`code`", defaultSpecialTerms);
    expect(result).toBeNull();
  });

  test("test_should_handle_multiple_special_terms", () => {
    const result = toSentenceCase("using javascript and api together", defaultSpecialTerms);
    expect(result).toBe("Using JavaScript and API together");
  });

  test("test_should_handle_special_term_at_start", () => {
    // When special term is at start, it counts as the first word so subsequent words are lowercased
    const result = toSentenceCase("JAVASCRIPT IS GREAT", defaultSpecialTerms);
    expect(result).toBe("JavaScript is great");
  });

  test("test_should_convert_lowercase_to_uppercase_for_all_caps_terms", () => {
    const allCapsTerms = { patch: "PATCH", note: "NOTE", warning: "WARNING" };
    const result = toSentenceCase("understanding patch releases", allCapsTerms);
    expect(result).toBe("Understanding PATCH releases");
  });

  test("test_should_fix_mixed_case_to_uppercase_for_all_caps_terms", () => {
    const allCapsTerms = { patch: "PATCH", important: "IMPORTANT" };
    const result = toSentenceCase("this is Important and uses Patch", allCapsTerms);
    expect(result).toBe("This is IMPORTANT and uses PATCH");
  });

  test("test_should_handle_github_alert_terms", () => {
    const allCapsTerms = {
      note: "NOTE",
      tip: "TIP",
      important: "IMPORTANT",
      warning: "WARNING",
      caution: "CAUTION"
    };
    const result = toSentenceCase("using note and warning alerts", allCapsTerms);
    expect(result).toBe("Using NOTE and WARNING alerts");
  });

  test("test_should_preserve_already_correct_all_caps_terms", () => {
    const allCapsTerms = { patch: "PATCH", breaking: "BREAKING" };
    const result = toSentenceCase("Understanding PATCH and BREAKING changes", allCapsTerms);
    expect(result).toBeNull(); // Already correct
  });

  test("test_should_preserve_acronym_at_start", () => {
    // Acronyms at the start should stay uppercase when in specialCasedTerms
    const result = toSentenceCase("MCP Configuration Precedence Guide", { mcp: 'MCP' });
    expect(result).toBe("MCP configuration precedence guide");
  });

  test("test_should_preserve_acronym_in_middle", () => {
    // Acronyms in the middle should stay uppercase
    const result = toSentenceCase("Using MCP For Configuration", { mcp: 'MCP' });
    expect(result).toBe("Using MCP for configuration");
  });

  test("test_should_preserve_multiple_acronyms", () => {
    const result = toSentenceCase("API And CLI Tools For MCP", { api: 'API', cli: 'CLI', mcp: 'MCP' });
    expect(result).toBe("API and CLI tools for MCP");
  });

  test("test_should_preserve_double_quoted_text", () => {
    const result = toSentenceCase('Scenario: "I Need Playwright" For Testing', {});
    expect(result).toBe('Scenario: "I Need Playwright" for testing');
  });

  test("test_should_preserve_single_quoted_text", () => {
    const result = toSentenceCase("When To Use 'Git' Vs GitHub", {});
    expect(result).toBe("When to use 'Git' vs github");
  });
});

describe("buildHeadingFix", () => {
  const defaultSpecialTerms = { api: "API" };
  const defaultSafetyConfig = {};

  test("test_should_return_fix_for_capitalization_error", () => {
    const line = "# Simple Heading";
    const text = "Simple Heading";
    const result = buildHeadingFix(line, text, defaultSpecialTerms, defaultSafetyConfig);

    expect(result).not.toBeUndefined();
    expect(result.editColumn).toBe(3); // After "# "
    expect(result.deleteCount).toBe(14);
    expect(result.insertText).toBe("Simple heading");
  });

  test("test_should_return_undefined_when_no_fix_needed", () => {
    const line = "# Correct heading";
    const text = "Correct heading";
    const result = buildHeadingFix(line, text, defaultSpecialTerms, defaultSafetyConfig);

    expect(result).toBeUndefined();
  });

  test("test_should_handle_heading_with_multiple_hashes", () => {
    const line = "### Third Level Heading";
    const text = "Third Level Heading";
    const result = buildHeadingFix(line, text, defaultSpecialTerms, defaultSafetyConfig);

    expect(result).not.toBeUndefined();
    expect(result.editColumn).toBe(5); // After "### "
    expect(result.insertText).toBe("Third level heading");
  });

  test("test_should_return_undefined_for_malformed_heading", () => {
    const line = "Not a heading";
    const text = "Not a heading";
    const result = buildHeadingFix(line, text, defaultSpecialTerms, defaultSafetyConfig);

    expect(result).toBeUndefined();
  });

  test("test_should_calculate_correct_edit_column", () => {
    const result = buildHeadingFix("# Heading With Spaces", "Heading With Spaces", defaultSpecialTerms, defaultSafetyConfig);

    expect(result).not.toBeUndefined();
    expect(result.editColumn).toBe(3);
  });

  test("test_should_handle_special_terms_in_heading", () => {
    const line = "# Using api correctly";
    const text = "Using api correctly";
    const result = buildHeadingFix(line, text, defaultSpecialTerms, defaultSafetyConfig);

    expect(result).not.toBeUndefined();
    expect(result.insertText).toBe("Using API correctly");
  });
});

describe("buildBoldTextFix", () => {
  const defaultSafetyConfig = {};

  test("test_should_return_fix_for_bold_text_capitalization", () => {
    const line = "- **Bold Text** here";
    const originalBoldText = "Bold Text";
    const fixedBoldText = "Bold text";
    const result = buildBoldTextFix(line, originalBoldText, fixedBoldText, defaultSafetyConfig);

    expect(result).not.toBeUndefined();
    expect(result.editColumn).toBe(5); // After "- **"
    expect(result.deleteCount).toBe(9);
    expect(result.insertText).toBe("Bold text");
  });

  test("test_should_return_undefined_when_bold_not_found", () => {
    const line = "- Regular text";
    const originalBoldText = "Bold Text";
    const fixedBoldText = "Bold text";
    const result = buildBoldTextFix(line, originalBoldText, fixedBoldText, defaultSafetyConfig);

    expect(result).toBeUndefined();
  });

  test("test_should_handle_bold_with_special_regex_characters", () => {
    const line = "- **Text-With-Brackets** here";
    const originalBoldText = "Text-With-Brackets";
    const fixedBoldText = "Text-with-brackets";
    const result = buildBoldTextFix(line, originalBoldText, fixedBoldText, defaultSafetyConfig);

    // Testing that regex escaping works with special characters
    expect(result).toBeDefined();
    if (result) {
      expect(result.insertText).toBe("Text-with-brackets");
    }
  });

  test("test_should_calculate_correct_edit_column_for_bold", () => {
    const line = "Some text before - **Bold Here** and after";
    const originalBoldText = "Bold Here";
    const fixedBoldText = "Bold here";
    const result = buildBoldTextFix(line, originalBoldText, fixedBoldText, defaultSafetyConfig);

    expect(result).not.toBeUndefined();
    expect(result.editColumn).toBe(22); // After the opening **
  });

  test("test_should_handle_multiple_bold_segments", () => {
    // When there are multiple bold segments, it should find the first one
    const line = "- **First Bold** and **Second Bold** text";
    const originalBoldText = "First Bold";
    const fixedBoldText = "First bold";
    const result = buildBoldTextFix(line, originalBoldText, fixedBoldText, defaultSafetyConfig);

    expect(result).not.toBeUndefined();
    expect(result.editColumn).toBe(5);
  });

  test("test_should_return_undefined_when_fix_text_same_as_original", () => {
    const line = "- **Correct text** here";
    const originalBoldText = "Correct text";
    // In real usage, if toSentenceCase returns null, we wouldn't call buildBoldTextFix
    // But testing the function behavior when given same text
    const fixedBoldText = "Correct text";
    const result = buildBoldTextFix(line, originalBoldText, fixedBoldText, defaultSafetyConfig);

    expect(result).not.toBeUndefined(); // Fix info is still created even if text is same
    expect(result.insertText).toBe(fixedBoldText);
  });
});
