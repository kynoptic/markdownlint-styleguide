import path from "path";
import { fileURLToPath } from "url";
import { describe, test, expect, beforeAll } from "@jest/globals";
import { lint } from "markdownlint/promise";
import MarkdownIt from "markdown-it";
import noBareUrls from "../../src/rules/wt-no-bare-urls.js";
import { parseFixture } from "../utils/fixture.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturePath = path.join(
  __dirname,
  "../fixtures/wt-no-bare-urls.fixture.md",
);

/**
 * @integration
 * Test suite for wt/no-bare-urls custom rule.
 * Ensures that bare URLs are detected and reported on the correct lines.
 */
describe("wt/no-bare-urls rule", () => {
  const { failingLines } = parseFixture(fixturePath);
  let violations = [];

  beforeAll(async () => {
    const options = {
      files: [fixturePath],
      customRules: [noBareUrls],
      config: {
        default: false,
        "wt/no-bare-urls": true,
        MD034: false,
      },
      markdownItFactory: () => new MarkdownIt({ linkify: true }),
    };
    violations = await lint(options);
  });

  /**
   * Verifies that all bare URLs in the fixture are detected and reported on the expected lines.
   */
  test("detects and reports all bare URLs on correct lines", () => {
    const errorLines = [
      ...new Set(violations[fixturePath].map((v) => v.lineNumber)),
    ];
    // Sort both arrays to ensure the order doesn't affect the comparison
    expect(errorLines.sort()).toEqual(failingLines.sort());
  });
});
