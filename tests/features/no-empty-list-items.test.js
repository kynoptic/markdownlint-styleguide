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

describe("no-empty-list-items rule with digit-period leading tokens", () => {
  test("does not flag ordered items whose text starts with a digit and period", async () => {
    const results = await lint({
      strings: {
        test:
          "1. 1. Some text starting with a digit\n" +
          "2. 2. More text\n" +
          "3. Normal item with no leading digit\n",
      },
      customRules: [noEmptyListItems],
      config: { default: false, "no-empty-list-items": true },
    });
    expect(results.test).toEqual([]);
  });

  test("does not flag unordered items whose text starts with a dash", async () => {
    const results = await lint({
      strings: { test: "- - dash prefixed text\n- plain text\n" },
      customRules: [noEmptyListItems],
      config: { default: false, "no-empty-list-items": true },
    });
    expect(results.test).toEqual([]);
  });

  test("still flags a genuinely empty item beside a digit-period item", async () => {
    const results = await lint({
      strings: { test: "1. 1. Real content\n2. \n3. Third\n" },
      customRules: [noEmptyListItems],
      config: { default: false, "no-empty-list-items": true },
    });
    expect(results.test.length).toBe(1);
    expect(results.test[0].lineNumber).toBe(2);
  });
});

describe("no-empty-list-items rule with empty nested lists", () => {
  test("flags an ordered item whose only content is an empty nested marker", async () => {
    const results = await lint({
      strings: { test: "1. 1.\n" },
      customRules: [noEmptyListItems],
      config: { default: false, "no-empty-list-items": true },
    });
    expect(results.test.map((v) => v.lineNumber)).toEqual([1]);
  });

  test("flags an unordered item whose only content is an empty nested marker", async () => {
    const results = await lint({
      strings: { test: "- -\n" },
      customRules: [noEmptyListItems],
      config: { default: false, "no-empty-list-items": true },
    });
    expect(results.test.map((v) => v.lineNumber)).toEqual([1]);
  });

  test("flags an item empty through two levels of nested markers", async () => {
    const results = await lint({
      strings: { test: "1. 1. 1.\n" },
      customRules: [noEmptyListItems],
      config: { default: false, "no-empty-list-items": true },
    });
    expect(results.test.map((v) => v.lineNumber)).toEqual([1]);
  });

  test("does not flag an item with text below two levels of nested markers", async () => {
    const results = await lint({
      strings: { test: "1. 1. 1. deep text\n" },
      customRules: [noEmptyListItems],
      config: { default: false, "no-empty-list-items": true },
    });
    expect(results.test).toEqual([]);
  });
});
