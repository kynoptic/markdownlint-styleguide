/**
 * @feature
 * Tests for PascalCase identifier detection in backtick-code-elements rule.
 *
 * Phase 3 implementation: Detects PascalCase identifiers (two+ capitals required).
 * By requiring an internal capital letter (not just sentence-initial), we avoid
 * false positives on proper nouns like "Paris" or "Michael".
 */
import { describe, test, expect } from "@jest/globals";
import { lint } from "markdownlint/promise";
import backtickRule from "../../src/rules/backtick-code-elements.js";

/**
 * Helper to run the backtick-code-elements rule on a string.
 * @param {string} markdown - The markdown content to lint.
 * @param {boolean} detectPascalCase - Whether to enable PascalCase detection (default: true for these tests).
 * @returns {Promise<Array>} - Array of violations.
 */
async function lintString(markdown, detectPascalCase = true) {
  const options = {
    customRules: [backtickRule],
    strings: { "test.md": markdown },
    resultVersion: 3,
    config: {
      "backtick-code-elements": {
        detectPascalCase: detectPascalCase,
      },
    },
  };
  const results = await lint(options);
  const violations = results["test.md"] || [];
  return violations.filter(
    (v) =>
      v.ruleNames.includes("backtick-code-elements") ||
      v.ruleNames.includes("BCE001"),
  );
}

describe("PascalCase identifier detection", () => {
  describe("should flag PascalCase identifiers (code patterns)", () => {
    test("flags MyComponent in prose", async () => {
      const violations = await lintString(
        "The MyComponent renders the user interface.",
      );
      expect(violations.length).toBe(1);
      expect(violations[0].errorContext).toBe("MyComponent");
    });

    test("flags UserService in prose", async () => {
      const violations = await lintString(
        "Inject the UserService into your controller.",
      );
      expect(violations.length).toBe(1);
      expect(violations[0].errorContext).toBe("UserService");
    });

    test("flags ReactComponent in prose", async () => {
      const violations = await lintString(
        "Every ReactComponent has a render method.",
      );
      expect(violations.length).toBe(1);
      expect(violations[0].errorContext).toBe("ReactComponent");
    });

    test("flags HttpClient in prose", async () => {
      const violations = await lintString(
        "Use the HttpClient to make API requests.",
      );
      expect(violations.length).toBe(1);
      expect(violations[0].errorContext).toBe("HttpClient");
    });

    test("flags StringBuilder in prose", async () => {
      const violations = await lintString(
        "Create a new StringBuilder for efficient concatenation.",
      );
      expect(violations.length).toBe(1);
      expect(violations[0].errorContext).toBe("StringBuilder");
    });

    test("flags EventEmitter in prose", async () => {
      const violations = await lintString(
        "The EventEmitter pattern is common in Node.js.",
      );
      expect(violations.length).toBe(1);
      expect(violations[0].errorContext).toBe("EventEmitter");
    });

    test("flags multiple PascalCase identifiers on one line", async () => {
      const violations = await lintString(
        "Pass UserModel to the DataService constructor.",
      );
      expect(violations.length).toBe(2);
      const contexts = violations.map((v) => v.errorContext);
      expect(contexts).toContain("UserModel");
      expect(contexts).toContain("DataService");
    });

    test("flags PascalCase with numbers", async () => {
      const violations = await lintString(
        "Migrate from ApiV1Client to the new version.",
      );
      expect(violations.length).toBe(1);
      expect(violations[0].errorContext).toBe("ApiV1Client");
    });

    test("flags long PascalCase identifiers", async () => {
      const violations = await lintString(
        "Configure the UserAuthenticationServiceProvider properly.",
      );
      expect(violations.length).toBe(1);
      expect(violations[0].errorContext).toBe("UserAuthenticationServiceProvider");
    });

    test("flags PascalCase with consecutive capitals (acronyms)", async () => {
      const violations = await lintString(
        "The HTMLParser handles document parsing.",
      );
      expect(violations.length).toBe(1);
      expect(violations[0].errorContext).toBe("HTMLParser");
    });

    test("flags XMLHttpRequest pattern", async () => {
      const violations = await lintString(
        "Use XMLHttpRequest for legacy browser support.",
      );
      expect(violations.length).toBe(1);
      expect(violations[0].errorContext).toBe("XMLHttpRequest");
    });
  });

  describe("should NOT flag single-capital words (proper nouns)", () => {
    test("does not flag Paris", async () => {
      const violations = await lintString(
        "The conference is held in Paris.",
      );
      expect(violations.length).toBe(0);
    });

    test("does not flag Michael", async () => {
      const violations = await lintString(
        "Contact Michael for more information.",
      );
      expect(violations.length).toBe(0);
    });

    test("does not flag London", async () => {
      const violations = await lintString(
        "The team is based in London.",
      );
      expect(violations.length).toBe(0);
    });

    test("does not flag January", async () => {
      const violations = await lintString(
        "The release is scheduled for January.",
      );
      expect(violations.length).toBe(0);
    });

    test("does not flag sentence-initial words", async () => {
      const violations = await lintString(
        "The quick brown fox jumps over the lazy dog.",
      );
      expect(violations.length).toBe(0);
    });

    test("does not flag single-capital brand names", async () => {
      const violations = await lintString(
        "Check the documentation on React and Vue.",
      );
      expect(violations.length).toBe(0);
    });
  });

  describe("should NOT flag Mc/Mac names (already handled)", () => {
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
  });

  describe("should NOT flag brand names in exemptions", () => {
    test("does not flag PlayStation", async () => {
      const violations = await lintString(
        "Play games on PlayStation.",
      );
      expect(violations.length).toBe(0);
    });

    test("does not flag YouTube", async () => {
      const violations = await lintString(
        "Watch tutorials on YouTube.",
      );
      expect(violations.length).toBe(0);
    });

    test("does not flag LinkedIn", async () => {
      const violations = await lintString(
        "Connect with professionals on LinkedIn.",
      );
      expect(violations.length).toBe(0);
    });

    test("does not flag JavaScript (in casingTerms)", async () => {
      const violations = await lintString(
        "Write code in JavaScript.",
      );
      expect(violations.length).toBe(0);
    });

    test("does not flag TypeScript (in casingTerms)", async () => {
      const violations = await lintString(
        "Use TypeScript for type safety.",
      );
      expect(violations.length).toBe(0);
    });

    test("does not flag GitHub (in casingTerms)", async () => {
      const violations = await lintString(
        "Host your code on GitHub.",
      );
      expect(violations.length).toBe(0);
    });

    test("does not flag WordPress (in casingTerms)", async () => {
      const violations = await lintString(
        "Build websites with WordPress.",
      );
      expect(violations.length).toBe(0);
    });

    test("does not flag OpenAI", async () => {
      const violations = await lintString(
        "OpenAI develops AI models.",
      );
      expect(violations.length).toBe(0);
    });

    test("does not flag DeepMind", async () => {
      const violations = await lintString(
        "DeepMind created AlphaGo.",
      );
      expect(violations.length).toBe(0);
    });
  });

  describe("should NOT flag PascalCase already in backticks", () => {
    test("does not flag backticked PascalCase", async () => {
      const violations = await lintString(
        "Use `MyComponent` to render the UI.",
      );
      expect(violations.length).toBe(0);
    });

    test("does not flag multiple backticked identifiers", async () => {
      const violations = await lintString(
        "Both `UserModel` and `DataService` are required.",
      );
      expect(violations.length).toBe(0);
    });
  });

  describe("should NOT flag PascalCase in code blocks", () => {
    test("does not flag PascalCase in fenced code blocks", async () => {
      const markdown = `
\`\`\`javascript
class MyComponent extends React.Component {
  render() { return null; }
}
\`\`\`
      `.trim();
      const violations = await lintString(markdown);
      expect(violations.length).toBe(0);
    });
  });

  describe("should provide correct autofix", () => {
    test("provides fixInfo to wrap in backticks", async () => {
      const violations = await lintString(
        "The MyComponent renders the user interface.",
      );
      expect(violations.length).toBe(1);
      expect(violations[0].fixInfo).toBeDefined();
      expect(violations[0].fixInfo.insertText).toBe("`MyComponent`");
    });
  });

  describe("edge cases", () => {
    test("does not flag PascalCase in markdown links", async () => {
      const violations = await lintString(
        "See [UserGuide](./docs/UserGuide.md) for details.",
      );
      expect(violations.length).toBe(0);
    });

    test("does not flag PascalCase in URLs", async () => {
      const violations = await lintString(
        "Visit https://example.com/api/UserProfile for the API.",
      );
      // The URL should be flagged, but not the PascalCase inside it separately
      const contexts = violations.map((v) => v.errorContext);
      expect(contexts).not.toContain("UserProfile");
    });

    test("does not flag ALL_CAPS words", async () => {
      const violations = await lintString(
        "Set the API_KEY environment variable.",
      );
      // Should be flagged by ENV_VAR pattern, not PascalCase
      expect(violations.length).toBe(1);
      expect(violations[0].errorContext).toBe("API_KEY");
    });

    test("flags PascalCase at end of sentence", async () => {
      const violations = await lintString(
        "The entry point is AppController.",
      );
      expect(violations.length).toBe(1);
      expect(violations[0].errorContext).toBe("AppController");
    });

    test("does not flag two-letter capitals like IO or AI", async () => {
      const violations = await lintString(
        "The AI model processes IO operations.",
      );
      expect(violations.length).toBe(0);
    });
  });
});
