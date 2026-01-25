/**
 * @feature
 * Tests for snake_case identifier detection in backtick-code-elements rule.
 *
 * Phase 1 implementation: Detects snake_case identifiers (low false positive risk).
 * snake_case is unambiguous because underscores in the middle of words are
 * extremely rare in natural English prose.
 */
import { describe, test, expect } from "@jest/globals";
import { lint } from "markdownlint/promise";
import backtickRule from "../../src/rules/backtick-code-elements.js";

/**
 * Helper to run the backtick-code-elements rule on a string.
 * @param {string} markdown - The markdown content to lint.
 * @returns {Promise<Array>} - Array of violations.
 */
async function lintString(markdown) {
  const options = {
    customRules: [backtickRule],
    strings: { "test.md": markdown },
    resultVersion: 3,
  };
  const results = await lint(options);
  const violations = results["test.md"] || [];
  return violations.filter(
    (v) =>
      v.ruleNames.includes("backtick-code-elements") ||
      v.ruleNames.includes("BCE001"),
  );
}

describe("snake_case identifier detection", () => {
  describe("should flag snake_case identifiers", () => {
    test("flags max_retries in prose", async () => {
      const violations = await lintString(
        "The max_retries value controls retry behavior.",
      );
      expect(violations.length).toBe(1);
      expect(violations[0].errorContext).toBe("max_retries");
    });

    test("flags user_name in prose", async () => {
      const violations = await lintString(
        "Set user_name before calling the function.",
      );
      expect(violations.length).toBe(1);
      expect(violations[0].errorContext).toBe("user_name");
    });

    test("flags fetch_data in prose", async () => {
      const violations = await lintString(
        "The fetch_data method returns a promise.",
      );
      expect(violations.length).toBe(1);
      expect(violations[0].errorContext).toBe("fetch_data");
    });

    test("flags snake_case with numbers", async () => {
      const violations = await lintString(
        "Use api_v2_client for the new endpoint.",
      );
      expect(violations.length).toBe(1);
      expect(violations[0].errorContext).toBe("api_v2_client");
    });

    test("flags multi-segment snake_case", async () => {
      const violations = await lintString(
        "Configure the max_connection_pool_size setting.",
      );
      expect(violations.length).toBe(1);
      expect(violations[0].errorContext).toBe("max_connection_pool_size");
    });

    test("flags snake_case at start of sentence", async () => {
      const violations = await lintString(
        "user_id is the primary key for this table.",
      );
      expect(violations.length).toBe(1);
      expect(violations[0].errorContext).toBe("user_id");
    });

    test("flags snake_case at end of sentence", async () => {
      const violations = await lintString(
        "Configure the database using connection_string.",
      );
      expect(violations.length).toBe(1);
      expect(violations[0].errorContext).toBe("connection_string");
    });

    test("flags multiple snake_case identifiers on one line", async () => {
      const violations = await lintString(
        "Pass user_id and session_token to the function.",
      );
      expect(violations.length).toBe(2);
      const contexts = violations.map((v) => v.errorContext);
      expect(contexts).toContain("user_id");
      expect(contexts).toContain("session_token");
    });
  });

  describe("should NOT flag locale codes (false positive prevention)", () => {
    test("does not flag en_US locale code", async () => {
      const violations = await lintString(
        "The file contains en_US locale strings.",
      );
      expect(violations.length).toBe(0);
    });

    test("does not flag en_GB locale code", async () => {
      const violations = await lintString(
        "British English uses en_GB localization.",
      );
      expect(violations.length).toBe(0);
    });

    test("does not flag zh_CN locale code", async () => {
      const violations = await lintString(
        "Simplified Chinese translations are in zh_CN.",
      );
      expect(violations.length).toBe(0);
    });

    test("does not flag zh_TW locale code", async () => {
      const violations = await lintString(
        "Traditional Chinese uses zh_TW locale.",
      );
      expect(violations.length).toBe(0);
    });

    test("does not flag ja_JP locale code", async () => {
      const violations = await lintString(
        "Japanese translations use the ja_JP locale.",
      );
      expect(violations.length).toBe(0);
    });

    test("does not flag de_DE locale code", async () => {
      const violations = await lintString(
        "German localization files use de_DE format.",
      );
      expect(violations.length).toBe(0);
    });

    test("does not flag fr_FR locale code", async () => {
      const violations = await lintString(
        "French translations are stored as fr_FR.",
      );
      expect(violations.length).toBe(0);
    });

    test("does not flag pt_BR locale code", async () => {
      const violations = await lintString(
        "Brazilian Portuguese uses pt_BR locale.",
      );
      expect(violations.length).toBe(0);
    });

    test("does not flag es_ES locale code", async () => {
      const violations = await lintString(
        "Spanish translations use es_ES format.",
      );
      expect(violations.length).toBe(0);
    });

    test("does not flag ko_KR locale code", async () => {
      const violations = await lintString(
        "Korean localization is in ko_KR files.",
      );
      expect(violations.length).toBe(0);
    });
  });

  describe("should NOT flag date-like patterns", () => {
    test("does not flag YYYY_MM_DD date format", async () => {
      const violations = await lintString(
        "Meeting scheduled for 2024_01_15.",
      );
      expect(violations.length).toBe(0);
    });

    test("does not flag date in filename context", async () => {
      const violations = await lintString(
        "The backup file is named backup_2024_03_20.",
      );
      expect(violations.length).toBe(0);
    });
  });

  describe("should NOT flag snake_case already in backticks", () => {
    test("does not flag backticked snake_case", async () => {
      const violations = await lintString(
        "Use `max_retries` to configure retry behavior.",
      );
      expect(violations.length).toBe(0);
    });

    test("does not flag multiple backticked identifiers", async () => {
      const violations = await lintString(
        "Both `user_id` and `session_token` are required.",
      );
      expect(violations.length).toBe(0);
    });
  });

  describe("should NOT flag snake_case in code blocks", () => {
    test("does not flag snake_case in fenced code blocks", async () => {
      const markdown = `
\`\`\`python
user_name = "test"
max_retries = 3
\`\`\`
      `.trim();
      const violations = await lintString(markdown);
      expect(violations.length).toBe(0);
    });
  });

  describe("should provide correct autofix", () => {
    test("provides fixInfo to wrap in backticks", async () => {
      const violations = await lintString(
        "The max_retries value controls retry behavior.",
      );
      expect(violations.length).toBe(1);
      expect(violations[0].fixInfo).toBeDefined();
      expect(violations[0].fixInfo.insertText).toBe("`max_retries`");
    });
  });

  describe("edge cases", () => {
    test("does not flag single underscore prefix (private convention)", async () => {
      const violations = await lintString(
        "The _private variable is internal.",
      );
      // Single underscore prefix without additional underscores is not snake_case
      expect(violations.length).toBe(0);
    });

    test("flags snake_case with leading underscore and more underscores", async () => {
      const violations = await lintString(
        "Use _internal_helper for this operation.",
      );
      expect(violations.length).toBe(1);
      expect(violations[0].errorContext).toBe("_internal_helper");
    });

    test("does not flag ALL_CAPS_CONSTANTS (already handled by ENV_VAR pattern)", async () => {
      // ALL_CAPS with underscores are environment variables, handled separately
      const violations = await lintString(
        "Set MAX_RETRIES environment variable.",
      );
      // Should be flagged by the existing ENV_VAR pattern, not snake_case
      expect(violations.length).toBe(1);
      expect(violations[0].errorContext).toBe("MAX_RETRIES");
    });

    test("does not flag snake_case in markdown links", async () => {
      const violations = await lintString(
        "See [user_guide](./docs/user_guide.md) for details.",
      );
      expect(violations.length).toBe(0);
    });

    test("does not flag snake_case in URLs", async () => {
      const violations = await lintString(
        "Visit https://example.com/api/user_profile for the API.",
      );
      // The URL should be flagged, but not the snake_case inside it separately
      const contexts = violations.map((v) => v.errorContext);
      expect(contexts).not.toContain("user_profile");
    });
  });
});
