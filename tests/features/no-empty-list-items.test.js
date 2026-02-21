import path from "path";
import { fileURLToPath } from "url";
import { describe, test, expect, beforeAll } from "@jest/globals";
import { lint } from "markdownlint/promise";
import noEmptyListItems from "../../src/rules/no-empty-list-items.js";
import { parseFixture } from "../utils/fixture.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturePath = path.join(
  __dirname,
  "../fixtures/no-empty-list-items.fixture.md",
);

/**
 * @integration
 * Test suite for no-empty-list-items custom rule.
 * Ensures that empty list items are detected and reported on the correct lines.
 */
describe("no-empty-list-items rule", () => {
  const { failingLines } = parseFixture(fixturePath);
  let violations = [];

  beforeAll(async () => {
    const options = {
      files: [fixturePath],
      customRules: [noEmptyListItems],
      config: {
        default: false,
        "no-empty-list-items": true,
      },
    };
    violations = await lint(options);
  });

  test("detects and reports all empty list items on correct lines", () => {
    const errorLines = [
      ...new Set(violations[fixturePath].map((v) => v.lineNumber)),
    ];
    expect(errorLines.sort((a, b) => a - b)).toEqual(failingLines.sort((a, b) => a - b));
  });

  test("does not flag non-empty list items", () => {
    const { passingLines } = parseFixture(fixturePath);
    const errorLines = violations[fixturePath].map((v) => v.lineNumber);
    for (const line of passingLines) {
      expect(errorLines).not.toContain(line);
    }
  });

  test("provides fixInfo to delete the empty list item line", () => {
    for (const violation of violations[fixturePath]) {
      expect(violation.fixInfo).toBeDefined();
      expect(violation.fixInfo.deleteCount).toBe(-1);
    }
  });
});

describe("no-empty-list-items rule with inline content", () => {
  test("flags empty unordered items in string input", async () => {
    const results = await lint({
      strings: { test: "- First\n- \n- Third\n" },
      customRules: [noEmptyListItems],
      config: { default: false, "no-empty-list-items": true },
    });
    expect(results.test.length).toBe(1);
    expect(results.test[0].lineNumber).toBe(2);
  });

  test("flags empty ordered items in string input", async () => {
    const results = await lint({
      strings: { test: "1. First\n2. \n3. Third\n" },
      customRules: [noEmptyListItems],
      config: { default: false, "no-empty-list-items": true },
    });
    expect(results.test.length).toBe(1);
    expect(results.test[0].lineNumber).toBe(2);
  });

  test("does not flag items with content", async () => {
    const results = await lint({
      strings: { test: "- Has content\n- Also content\n" },
      customRules: [noEmptyListItems],
      config: { default: false, "no-empty-list-items": true },
    });
    expect(results.test.length).toBe(0);
  });
});
