/**
 * @feature
 * Tests for camelCase identifier detection in backtick-code-elements rule.
 *
 * Phase 2 implementation: Detects camelCase identifiers (medium false positive risk).
 * camelCase is common in code but some brand names also use internal capitals.
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

describe("camelCase identifier detection", () => {
  describe("should flag camelCase identifiers", () => {
    test("flags useEffect in prose", async () => {
      const violations = await lintString(
        "The useEffect hook runs after render.",
      );
      expect(violations.length).toBe(1);
      expect(violations[0].errorContext).toBe("useEffect");
    });

    test("flags useState in prose", async () => {
      const violations = await lintString(
        "Use useState to manage component state.",
      );
      expect(violations.length).toBe(1);
      expect(violations[0].errorContext).toBe("useState");
    });

    test("flags fetchData in prose", async () => {
      const violations = await lintString(
        "Call fetchData to retrieve the records.",
      );
      expect(violations.length).toBe(1);
      expect(violations[0].errorContext).toBe("fetchData");
    });

    test("flags myVariable in prose", async () => {
      const violations = await lintString(
        "Store the result in myVariable for later use.",
      );
      expect(violations.length).toBe(1);
      expect(violations[0].errorContext).toBe("myVariable");
    });

    test("flags getUserName in prose", async () => {
      const violations = await lintString(
        "The getUserName function returns the current user.",
      );
      expect(violations.length).toBe(1);
      expect(violations[0].errorContext).toBe("getUserName");
    });

    test("flags handleClick in prose", async () => {
      const violations = await lintString(
        "Bind handleClick to the button element.",
      );
      expect(violations.length).toBe(1);
      expect(violations[0].errorContext).toBe("handleClick");
    });

    test("flags camelCase with numbers", async () => {
      const violations = await lintString(
        "Use apiV2Client for the new endpoint.",
      );
      expect(violations.length).toBe(1);
      expect(violations[0].errorContext).toBe("apiV2Client");
    });

    test("flags multiple camelCase identifiers on one line", async () => {
      const violations = await lintString(
        "Pass userId and sessionToken to the function.",
      );
      expect(violations.length).toBe(2);
      const contexts = violations.map((v) => v.errorContext);
      expect(contexts).toContain("userId");
      expect(contexts).toContain("sessionToken");
    });

    test("flags camelCase at start of sentence", async () => {
      const violations = await lintString(
        "firstName is a required field in the form.",
      );
      expect(violations.length).toBe(1);
      expect(violations[0].errorContext).toBe("firstName");
    });

    test("flags camelCase at end of sentence", async () => {
      const violations = await lintString(
        "The primary key for this table is oderId.",
      );
      expect(violations.length).toBe(1);
      expect(violations[0].errorContext).toBe("oderId");
    });

    test("flags longer camelCase identifiers", async () => {
      const violations = await lintString(
        "Configure the maxConnectionPoolSize setting.",
      );
      expect(violations.length).toBe(1);
      expect(violations[0].errorContext).toBe("maxConnectionPoolSize");
    });

    test("flags camelCase with consecutive capitals", async () => {
      const violations = await lintString(
        "The parseJSON function handles data conversion.",
      );
      expect(violations.length).toBe(1);
      expect(violations[0].errorContext).toBe("parseJSON");
    });
  });

  describe("should NOT flag brand names (false positive prevention)", () => {
    test("does not flag iPhone", async () => {
      const violations = await lintString(
        "The iPhone is a popular smartphone.",
      );
      expect(violations.length).toBe(0);
    });

    test("does not flag iPad", async () => {
      const violations = await lintString(
        "Use your iPad for reading documents.",
      );
      expect(violations.length).toBe(0);
    });

    test("does not flag iPod", async () => {
      const violations = await lintString(
        "The iPod revolutionized portable music.",
      );
      expect(violations.length).toBe(0);
    });

    test("does not flag iMac", async () => {
      const violations = await lintString(
        "The iMac is an all-in-one desktop computer.",
      );
      expect(violations.length).toBe(0);
    });

    test("does not flag eBay", async () => {
      const violations = await lintString(
        "You can find vintage items on eBay.",
      );
      expect(violations.length).toBe(0);
    });

    test("does not flag eBook", async () => {
      const violations = await lintString(
        "Download the eBook for offline reading.",
      );
      expect(violations.length).toBe(0);
    });

    test("does not flag iTunes", async () => {
      const violations = await lintString(
        "Purchase music through iTunes.",
      );
      expect(violations.length).toBe(0);
    });

    test("does not flag macOS", async () => {
      const violations = await lintString(
        "This app runs on macOS and Windows.",
      );
      expect(violations.length).toBe(0);
    });

    test("does not flag iOS", async () => {
      const violations = await lintString(
        "The app is available for iOS devices.",
      );
      expect(violations.length).toBe(0);
    });

    test("does not flag tvOS", async () => {
      const violations = await lintString(
        "Stream content on tvOS devices.",
      );
      expect(violations.length).toBe(0);
    });

    test("does not flag watchOS", async () => {
      const violations = await lintString(
        "Track fitness with watchOS apps.",
      );
      expect(violations.length).toBe(0);
    });

    test("does not flag iCloud", async () => {
      const violations = await lintString(
        "Back up your data to iCloud.",
      );
      expect(violations.length).toBe(0);
    });

    test("does not flag LinkedIn", async () => {
      const violations = await lintString(
        "Connect with professionals on LinkedIn.",
      );
      expect(violations.length).toBe(0);
    });

    test("does not flag YouTube", async () => {
      const violations = await lintString(
        "Watch tutorials on YouTube.",
      );
      expect(violations.length).toBe(0);
    });

    test("does not flag PlayStation", async () => {
      const violations = await lintString(
        "Play games on PlayStation.",
      );
      expect(violations.length).toBe(0);
    });

    test("does not flag JavaScript (already in casingTerms)", async () => {
      const violations = await lintString(
        "Write code in JavaScript.",
      );
      expect(violations.length).toBe(0);
    });

    test("does not flag TypeScript (already in casingTerms)", async () => {
      const violations = await lintString(
        "Use TypeScript for type safety.",
      );
      expect(violations.length).toBe(0);
    });

    test("does not flag GitHub (already in casingTerms)", async () => {
      const violations = await lintString(
        "Host your code on GitHub.",
      );
      expect(violations.length).toBe(0);
    });

    test("does not flag GitLab (already in casingTerms)", async () => {
      const violations = await lintString(
        "Use GitLab for CI/CD.",
      );
      expect(violations.length).toBe(0);
    });

    test("does not flag WordPress (already in casingTerms)", async () => {
      const violations = await lintString(
        "Build websites with WordPress.",
      );
      expect(violations.length).toBe(0);
    });
  });

  describe("should NOT flag names with Mc/Mac prefix", () => {
    test("does not flag McDonald", async () => {
      const violations = await lintString(
        "Meet John McDonald at the conference.",
      );
      expect(violations.length).toBe(0);
    });

    test("does not flag MacArthur", async () => {
      const violations = await lintString(
        "General MacArthur was a famous military leader.",
      );
      expect(violations.length).toBe(0);
    });

    test("does not flag McCartney", async () => {
      const violations = await lintString(
        "Paul McCartney is a legendary musician.",
      );
      expect(violations.length).toBe(0);
    });

    test("does not flag MacBook", async () => {
      const violations = await lintString(
        "The MacBook is a popular laptop.",
      );
      expect(violations.length).toBe(0);
    });
  });

  describe("should NOT flag camelCase already in backticks", () => {
    test("does not flag backticked camelCase", async () => {
      const violations = await lintString(
        "Use `useEffect` to handle side effects.",
      );
      expect(violations.length).toBe(0);
    });

    test("does not flag multiple backticked identifiers", async () => {
      const violations = await lintString(
        "Both `userId` and `sessionToken` are required.",
      );
      expect(violations.length).toBe(0);
    });
  });

  describe("should NOT flag camelCase in code blocks", () => {
    test("does not flag camelCase in fenced code blocks", async () => {
      const markdown = `
\`\`\`javascript
const userName = "test";
const maxRetries = 3;
\`\`\`
      `.trim();
      const violations = await lintString(markdown);
      expect(violations.length).toBe(0);
    });
  });

  describe("should provide correct autofix", () => {
    test("provides fixInfo to wrap in backticks", async () => {
      const violations = await lintString(
        "The useEffect hook runs after render.",
      );
      expect(violations.length).toBe(1);
      expect(violations[0].fixInfo).toBeDefined();
      expect(violations[0].fixInfo.insertText).toBe("`useEffect`");
    });
  });

  describe("edge cases", () => {
    test("does not flag single capital letter words", async () => {
      // Words like "I" or abbreviations shouldn't match
      const violations = await lintString(
        "I think this is correct.",
      );
      expect(violations.length).toBe(0);
    });

    test("flags PascalCase (handled by Phase 3)", async () => {
      // PascalCase like MyComponent is now flagged (Phase 3 implemented)
      const violations = await lintString(
        "The MyComponent renders the UI.",
      );
      expect(violations.length).toBe(1);
      expect(violations[0].errorContext).toBe("MyComponent");
    });

    test("does not flag ALL_CAPS", async () => {
      const violations = await lintString(
        "Set the MAX_VALUE constant.",
      );
      // Should be flagged by ENV_VAR pattern, not camelCase
      const camelCaseViolations = violations.filter(
        (v) => v.errorContext === "MAX_VALUE"
      );
      expect(camelCaseViolations.length).toBe(1);
    });

    test("does not flag camelCase in markdown links", async () => {
      const violations = await lintString(
        "See [userGuide](./docs/userGuide.md) for details.",
      );
      expect(violations.length).toBe(0);
    });

    test("does not flag camelCase in URLs", async () => {
      const violations = await lintString(
        "Visit https://example.com/api/getUserProfile for the API.",
      );
      // The URL should be flagged, but not the camelCase inside it separately
      const contexts = violations.map((v) => v.errorContext);
      expect(contexts).not.toContain("getUserProfile");
    });

    test("requires minimum length before capital (avoids single prefix)", async () => {
      // Very short prefixes might be too prone to false positives
      // But we still want to catch common patterns like aValue, xCoord
      const violations = await lintString(
        "Set the xCoordinate value.",
      );
      expect(violations.length).toBe(1);
      expect(violations[0].errorContext).toBe("xCoordinate");
    });

    test("does not flag ordinal-like patterns", async () => {
      // Patterns like "1st", "2nd" shouldn't match
      const violations = await lintString(
        "This is the 1st example.",
      );
      expect(violations.length).toBe(0);
    });
  });
});
