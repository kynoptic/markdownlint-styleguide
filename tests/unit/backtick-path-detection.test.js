/**
 * @jest-environment node
 */
import { describe, test, expect } from "@jest/globals";
import { lint } from "markdownlint/promise";
import backtickRule from "../../src/rules/backtick-code-elements.js";

/**
 * Unit tests for path detection heuristics in backtick-code-elements rule.
 * Tests the improvements made in issue #89 to reduce false positives.
 */
describe("backtick-code-elements path detection", () => {
  /**
   * Helper function to test if a pattern is flagged as needing backticks
   */
  async function testPattern(markdown, shouldFlag) {
    const options = {
      customRules: [backtickRule],
      strings: { "test.md": markdown },
      resultVersion: 3,
    };
    const results = await lint(options);
    const violations = results["test.md"] || [];
    const ruleViolations = violations.filter(
      (v) =>
        v.ruleNames.includes("backtick-code-elements") ||
        v.ruleNames.includes("BCE001"),
    );

    if (shouldFlag) {
      expect(ruleViolations.length).toBeGreaterThan(0);
    } else {
      expect(ruleViolations).toHaveLength(0);
    }
  }

  describe("absolute paths", () => {
    test("should detect absolute Unix paths", async () => {
      await testPattern("Edit the /etc/hosts file", true);
    });

    test("should detect absolute paths with multiple segments", async () => {
      await testPattern("Mount to /mnt/usb drive", true);
    });

    test("should detect absolute paths in /usr tree", async () => {
      await testPattern("Located in /usr/local/bin directory", true);
    });

    test("should detect root-level config paths", async () => {
      await testPattern("Check /var/log/system.log for errors", true);
    });

    test("should not flag URL protocol separators", async () => {
      await testPattern(
        "Visit <https://example.com/path> for details",
        false,
      );
    });
  });

  describe("relative paths with known directory prefixes", () => {
    test("should detect src/ paths", async () => {
      await testPattern("Edit src/components/Button.tsx file", true);
    });

    test("should detect docs/ paths", async () => {
      await testPattern("See docs/api/endpoints.md for reference", true);
    });

    test("should detect tests/ paths", async () => {
      await testPattern("Run tests/integration/auth.test.js suite", true);
    });

    test("should detect lib/ paths", async () => {
      await testPattern("Import from lib/utils/helpers.js module", true);
    });

    test("should detect config/ paths", async () => {
      await testPattern("Update config/database.yml settings", true);
    });
  });

  describe("non-path conceptual pairs (issue #89)", () => {
    test("should not flag Integration/E2E", async () => {
      await testPattern("Integration/E2E testing strategy", false);
    });

    test("should not flag Value/Effort", async () => {
      await testPattern("Value/Effort custom fields", false);
    });

    test("should not flag feature/module", async () => {
      await testPattern("Choose between feature/module organization", false);
    });

    test("should not flag added/updated", async () => {
      await testPattern("Files were added/updated successfully", false);
    });

    test("should not flag adapt/extend", async () => {
      await testPattern("You can adapt/extend this pattern", false);
    });

    test("should not flag start/complete", async () => {
      await testPattern("Track start/complete timestamps", false);
    });

    test("should not flag lowest/most", async () => {
      await testPattern("Use the lowest/most efficient approach", false);
    });
  });

  describe("common option patterns", () => {
    test("should not flag pass/fail", async () => {
      await testPattern("The pass/fail criteria are documented", false);
    });

    test("should not flag true/false", async () => {
      await testPattern("Set true/false configuration values", false);
    });

    test("should not flag either/or", async () => {
      await testPattern("Either/or decision points require review", false);
    });

    test("should not flag read/write", async () => {
      await testPattern("Read/write permissions are required", false);
    });

    test("should not flag on/off", async () => {
      await testPattern("Toggle on/off as needed", false);
    });

    test("should not flag GET/POST", async () => {
      await testPattern("Support GET/POST requests", false);
    });

    test("should not flag client/server", async () => {
      await testPattern("Client/server architecture", false);
    });
  });

  describe("paths with file extensions", () => {
    test("should detect .js files", async () => {
      await testPattern("Import from utils/helper.js module", true);
    });

    test("should detect .md files", async () => {
      await testPattern("See README.md for instructions", true);
    });

    test("should detect .json files", async () => {
      await testPattern("Edit config.json in root", true);
    });

    test("should detect .tsx files", async () => {
      await testPattern("Component in components/App.tsx", true);
    });
  });

  describe("edge cases", () => {
    test("should not flag numeric dates", async () => {
      await testPattern("Released on 2023/10/15", false);
    });

    test("should not flag fractions", async () => {
      await testPattern("Ratio of 1/2 or 3/4", false);
    });

    test("should not flag short segments", async () => {
      await testPattern("I/O operations", false);
    });

    test("should not flag paths with spaces", async () => {
      await testPattern("The read / write operation failed", false);
    });

    test("should detect multi-segment paths", async () => {
      await testPattern("File at src/utils/helpers/format.js", true);
    });

    test("should detect paths with dots in directory names", async () => {
      await testPattern("Check .github/workflows/ci.yml config", true);
    });

    test("should detect paths with trailing slash", async () => {
      await testPattern("Navigate to src/components/ directory", true);
    });
  });

  describe("regression tests", () => {
    test("should still detect common CLI commands", async () => {
      await testPattern("Run npm install to setup", true);
    });

    test("should still detect environment variables", async () => {
      await testPattern("Set NODE_ENV to production", true);
    });

    test("should still detect function calls", async () => {
      await testPattern("Call fetchData() to retrieve", true);
    });

    test("should still detect dotfiles", async () => {
      await testPattern("Edit .env file", true);
    });

    test("should not flag version numbers in parentheses", async () => {
      await testPattern("React (v19.1.0) is required", false);
    });

    test("should not flag CSV/JSON format descriptions", async () => {
      await testPattern("Supports CSV/JSON file upload", false);
    });

    test("should flag API/database as it could be a path", async () => {
      // API could be a directory name, so this is ambiguous and flagged
      await testPattern("API/database integration layer", true);
    });
  });
});
