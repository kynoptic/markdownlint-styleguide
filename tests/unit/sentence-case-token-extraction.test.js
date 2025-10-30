/**
 * Unit tests for token extraction module
 * Tests the extractHeadingText function in isolation
 */
import { describe, test, expect } from "@jest/globals";
import { extractHeadingText } from "../../src/rules/sentence-case/token-extraction.js";

describe("extractHeadingText", () => {
  test("test_should_extract_simple_heading_text_when_given_basic_atx_heading", () => {
    const tokens = [
      {
        type: "atxHeadingSequence",
        startLine: 1,
        endLine: 1,
        startColumn: 1,
        endColumn: 2,
      },
    ];
    const lines = ["# Simple heading"];
    const token = {
      type: "atxHeading",
      startLine: 1,
      endLine: 1,
      startColumn: 1,
      endColumn: 17,
    };

    const result = extractHeadingText(tokens, lines, token);
    expect(result).toBe("Simple heading");
  });

  test("test_should_extract_text_when_heading_contains_inline_code", () => {
    const tokens = [
      {
        type: "atxHeadingSequence",
        startLine: 1,
        endLine: 1,
        startColumn: 1,
        endColumn: 2,
      },
    ];
    const lines = ["# Using `code` in heading"];
    const token = {
      type: "atxHeading",
      startLine: 1,
      endLine: 1,
      startColumn: 1,
      endColumn: 26,
    };

    const result = extractHeadingText(tokens, lines, token);
    expect(result).toBe("Using `code` in heading");
  });

  test("test_should_strip_html_comments_when_extracting_heading_text", () => {
    const tokens = [
      {
        type: "atxHeadingSequence",
        startLine: 1,
        endLine: 1,
        startColumn: 1,
        endColumn: 2,
      },
    ];
    const lines = ["# My heading <!-- TODO: review this -->"];
    const token = {
      type: "atxHeading",
      startLine: 1,
      endLine: 1,
      startColumn: 1,
      endColumn: 41,
    };

    const result = extractHeadingText(tokens, lines, token);
    expect(result).toBe("My heading");
  });

  test("test_should_handle_heading_with_multiple_inline_code_spans", () => {
    const tokens = [
      {
        type: "atxHeadingSequence",
        startLine: 1,
        endLine: 1,
        startColumn: 1,
        endColumn: 2,
      },
    ];
    const lines = ["# Using `foo` and `bar` together"];
    const token = {
      type: "atxHeading",
      startLine: 1,
      endLine: 1,
      startColumn: 1,
      endColumn: 34,
    };

    const result = extractHeadingText(tokens, lines, token);
    expect(result).toBe("Using `foo` and `bar` together");
  });

  test("test_should_extract_text_when_heading_has_trailing_hashes", () => {
    const tokens = [
      {
        type: "atxHeadingSequence",
        startLine: 1,
        endLine: 1,
        startColumn: 1,
        endColumn: 2,
      },
    ];
    const lines = ["# My heading #"];
    const token = {
      type: "atxHeading",
      startLine: 1,
      endLine: 1,
      startColumn: 1,
      endColumn: 15,
    };

    const result = extractHeadingText(tokens, lines, token);
    expect(result).toBe("My heading #");
  });

  test("test_should_extract_text_when_heading_contains_links", () => {
    const tokens = [
      {
        type: "atxHeadingSequence",
        startLine: 1,
        endLine: 1,
        startColumn: 1,
        endColumn: 2,
      },
    ];
    const lines = ["# See [documentation](https://example.com) for details"];
    const token = {
      type: "atxHeading",
      startLine: 1,
      endLine: 1,
      startColumn: 1,
      endColumn: 56,
    };

    const result = extractHeadingText(tokens, lines, token);
    expect(result).toBe("See [documentation](https://example.com) for details");
  });

  test("test_should_fallback_to_regex_when_no_atx_sequence_found", () => {
    const tokens = []; // No atxHeadingSequence token
    const lines = ["# Fallback heading"];
    const token = {
      type: "atxHeading",
      startLine: 1,
      endLine: 1,
      startColumn: 1,
      endColumn: 19,
    };

    const result = extractHeadingText(tokens, lines, token);
    expect(result).toBe("Fallback heading");
  });

  test("test_should_return_empty_string_when_heading_has_no_text", () => {
    const tokens = [
      {
        type: "atxHeadingSequence",
        startLine: 1,
        endLine: 1,
        startColumn: 1,
        endColumn: 2,
      },
    ];
    const lines = ["#"];
    const token = {
      type: "atxHeading",
      startLine: 1,
      endLine: 1,
      startColumn: 1,
      endColumn: 2,
    };

    const result = extractHeadingText(tokens, lines, token);
    expect(result).toBe("");
  });

  test("test_should_handle_complex_html_comments_with_dashes", () => {
    const tokens = [
      {
        type: "atxHeadingSequence",
        startLine: 1,
        endLine: 1,
        startColumn: 1,
        endColumn: 2,
      },
    ];
    const lines = ["# Title <!-- comment with -- dashes -->"];
    const token = {
      type: "atxHeading",
      startLine: 1,
      endLine: 1,
      startColumn: 1,
      endColumn: 41,
    };

    const result = extractHeadingText(tokens, lines, token);
    expect(result).toBe("Title");
  });

  test("test_should_trim_whitespace_from_extracted_text", () => {
    const tokens = [
      {
        type: "atxHeadingSequence",
        startLine: 1,
        endLine: 1,
        startColumn: 1,
        endColumn: 2,
      },
    ];
    const lines = ["#    Lots of spaces   "];
    const token = {
      type: "atxHeading",
      startLine: 1,
      endLine: 1,
      startColumn: 1,
      endColumn: 23,
    };

    const result = extractHeadingText(tokens, lines, token);
    expect(result).toBe("Lots of spaces");
  });
});
