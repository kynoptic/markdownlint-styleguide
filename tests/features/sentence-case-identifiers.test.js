/**
 * @feature
 * Tests for code identifier preservation in sentence-case-heading rule.
 *
 * Code identifiers (camelCase, PascalCase, snake_case) in headings should
 * preserve their original casing and not be flagged as sentence case violations.
 */
import { describe, test, expect } from "@jest/globals";
import { lint } from "markdownlint/promise";
import sentenceCaseRule from "../../src/rules/sentence-case-heading.js";

/**
 * Helper to run the sentence-case-heading rule on a string.
 * @param {string} markdown - The markdown content to lint.
 * @returns {Promise<Array>} - Array of violations.
 */
async function lintString(markdown) {
  const options = {
    customRules: [sentenceCaseRule],
    strings: { "test.md": markdown },
    resultVersion: 3,
  };
  const results = await lint(options);
  const violations = results["test.md"] || [];
  return violations.filter(
    (v) =>
      v.ruleNames.includes("sentence-case-heading") ||
      v.ruleNames.includes("SC001"),
  );
}

describe("sentence-case-heading identifier preservation", () => {
  describe("should preserve camelCase identifiers", () => {
    test("preserves useEffect in heading", async () => {
      const violations = await lintString(
        "## Using useEffect for side effects\n",
      );
      expect(violations.length).toBe(0);
    });

    test("preserves useState in heading", async () => {
      const violations = await lintString(
        "## Managing state with useState\n",
      );
      expect(violations.length).toBe(0);
    });

    test("preserves fetchData in heading", async () => {
      const violations = await lintString(
        "## How to fetchData from an API\n",
      );
      expect(violations.length).toBe(0);
    });

    test("preserves multiple camelCase identifiers", async () => {
      const violations = await lintString(
        "## Combining useEffect and useState\n",
      );
      expect(violations.length).toBe(0);
    });

    test("preserves camelCase at start of heading", async () => {
      const violations = await lintString(
        "## useCallback optimization guide\n",
      );
      expect(violations.length).toBe(0);
    });
  });

  describe("should preserve PascalCase identifiers", () => {
    test("preserves MyComponent in heading", async () => {
      const violations = await lintString(
        "## The MyComponent architecture\n",
      );
      expect(violations.length).toBe(0);
    });

    test("preserves HttpClient in heading", async () => {
      const violations = await lintString(
        "## Configure the HttpClient properly\n",
      );
      expect(violations.length).toBe(0);
    });

    test("preserves UserService in heading", async () => {
      const violations = await lintString(
        "## Injecting the UserService\n",
      );
      expect(violations.length).toBe(0);
    });

    test("preserves EventEmitter in heading", async () => {
      const violations = await lintString(
        "## Working with EventEmitter\n",
      );
      expect(violations.length).toBe(0);
    });

    test("preserves acronym-prefixed PascalCase", async () => {
      const violations = await lintString(
        "## Using the HTMLParser class\n",
      );
      expect(violations.length).toBe(0);
    });

    test("preserves XMLHttpRequest in heading", async () => {
      const violations = await lintString(
        "## Legacy XMLHttpRequest usage\n",
      );
      expect(violations.length).toBe(0);
    });
  });

  describe("should preserve snake_case identifiers", () => {
    test("preserves max_retries in heading", async () => {
      const violations = await lintString(
        "## Setting the max_retries value\n",
      );
      expect(violations.length).toBe(0);
    });

    test("preserves user_name in heading", async () => {
      const violations = await lintString(
        "## Validating user_name input\n",
      );
      expect(violations.length).toBe(0);
    });

    test("preserves snake_case at start of heading", async () => {
      const violations = await lintString(
        "## connection_string configuration\n",
      );
      expect(violations.length).toBe(0);
    });
  });

  describe("should still flag non-identifier capitalization errors", () => {
    test("flags Title Case words that are not identifiers", async () => {
      const violations = await lintString(
        "## This Is Title Case Which Is Wrong\n",
      );
      expect(violations.length).toBeGreaterThan(0);
    });

    test("flags random capitalization", async () => {
      const violations = await lintString(
        "## This has Random Capitalization\n",
      );
      expect(violations.length).toBeGreaterThan(0);
    });
  });

  describe("should NOT preserve brand names as code identifiers", () => {
    test("iPhone is flagged unless in specialCasedTerms (not treated as code)", async () => {
      // iPhone is a brand name, not a code identifier
      // It should be flagged by sentence-case unless added to specialCasedTerms
      // This verifies the code identifier exemption doesn't wrongly exempt brands
      const violations = await lintString(
        "## Using your iPhone\n",
      );
      // iPhone is NOT in default casingTerms, so it gets flagged
      // Users should add it to specialCasedTerms if they want to preserve it
      expect(violations.length).toBe(1);
      expect(violations[0].errorDetail).toContain("iPhone");
    });

    test("McDonald is flagged unless in specialCasedTerms (not treated as code)", async () => {
      // McDonald is a surname (Mc/Mac pattern), not a code identifier
      // It should be flagged by sentence-case unless added to specialCasedTerms
      const violations = await lintString(
        "## Meeting with McDonald\n",
      );
      // McDonald is NOT in default casingTerms, so it gets flagged
      expect(violations.length).toBe(1);
      expect(violations[0].errorDetail).toContain("McDonald");
    });

    test("preserves brands that ARE in casingTerms", async () => {
      // JavaScript IS in casingTerms, so it should be preserved
      const violations = await lintString(
        "## Writing JavaScript code\n",
      );
      expect(violations.length).toBe(0);
    });
  });

  describe("integration with existing sentence-case rules", () => {
    test("still requires first word to be capitalized", async () => {
      const violations = await lintString(
        "## lowercase start is wrong\n",
      );
      expect(violations.length).toBeGreaterThan(0);
    });

    test("still preserves acronyms", async () => {
      const violations = await lintString(
        "## Working with the API\n",
      );
      expect(violations.length).toBe(0);
    });

    test("still preserves technical terms in specialCasedTerms", async () => {
      const violations = await lintString(
        "## Building with JavaScript\n",
      );
      expect(violations.length).toBe(0);
    });

    test("works with code in backticks (already handled)", async () => {
      const violations = await lintString(
        "## Using `useEffect` in React\n",
      );
      expect(violations.length).toBe(0);
    });
  });
});
