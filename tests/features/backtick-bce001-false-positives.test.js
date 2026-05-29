/**
 * @feature
 * Tests for BCE001 false positives covering:
 * - #192: scientific/measurement terms (pH, fMRI, mTOR)
 * - #194: bare URLs flagged as file/directory paths
 * - #196: ellipsis-joined prose words (only...but)
 */
import { describe, test, expect } from "@jest/globals";
import { lint } from "markdownlint/promise";
import backtickRule from "../../src/rules/backtick-code-elements.js";

/**
 * @param {string} markdown
 * @returns {Promise<Array>}
 */
async function getBCE001Violations(markdown) {
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

describe("BCE001 scientific and measurement terms (#192)", () => {
  test("does not flag pH in prose", async () => {
    const violations = await getBCE001Violations(
      "The solution has a pH of 7.4.",
    );
    expect(violations).toHaveLength(0);
  });

  test("does not flag fMRI in prose", async () => {
    const violations = await getBCE001Violations(
      "Participants underwent fMRI scanning during the task.",
    );
    expect(violations).toHaveLength(0);
  });

  test("does not flag mTOR in prose", async () => {
    const violations = await getBCE001Violations(
      "The mTOR pathway regulates cell growth.",
    );
    expect(violations).toHaveLength(0);
  });

  test("does not flag mTORC1 in prose", async () => {
    const violations = await getBCE001Violations(
      "Inhibition of mTORC1 suppresses protein synthesis.",
    );
    expect(violations).toHaveLength(0);
  });

  test("does not flag sgRNA in prose", async () => {
    const violations = await getBCE001Violations(
      "The sgRNA guides Cas9 to the target site.",
    );
    expect(violations).toHaveLength(0);
  });

  test("does not flag mL in prose", async () => {
    const violations = await getBCE001Violations(
      "Add 5 mL of buffer to the sample.",
    );
    expect(violations).toHaveLength(0);
  });

  test("still flags genuine camelCase code identifiers", async () => {
    const violations = await getBCE001Violations(
      "Call useEffect to register your side effects.",
    );
    expect(violations.length).toBeGreaterThan(0);
  });
});

describe("BCE001 URL path component not flagged (#194)", () => {
  // Bare URLs are not BCE001's concern (handled by the no-bare-url rule), so the
  // path component of a bare URL must never produce a path violation.
  test("bare https URL produces no violation", async () => {
    const violations = await getBCE001Violations(
      "See https://code.claude.com/docs/en/mcp.md for details.",
    );
    expect(violations).toHaveLength(0);
  });

  test("bare https URL with directory path produces no violation", async () => {
    const violations = await getBCE001Violations(
      "Docs: https://github.com/settings/tokens",
    );
    expect(violations).toHaveLength(0);
  });

  test("path component alone (without protocol) inside a URL is not separately flagged", async () => {
    // The sub-path "code.claude.com/docs/en/mcp.md" should not appear as an errorContext
    const violations = await getBCE001Violations(
      "See https://code.claude.com/docs/en/mcp.md for details.",
    );
    const pathOnlyViolations = violations.filter(
      (v) => v.errorContext === "code.claude.com/docs/en/mcp.md",
    );
    expect(pathOnlyViolations).toHaveLength(0);
  });

  test("still flags actual file paths", async () => {
    const violations = await getBCE001Violations(
      "Edit the file at src/rules/backtick-code-elements.js.",
    );
    expect(violations.length).toBeGreaterThan(0);
  });
});

describe("BCE001 bare URLs are never flagged as paths", () => {
  // BCE001 must not treat http(s):// URLs (or other URI schemes) as filesystem
  // paths. Bare URLs are the domain of the separate no-bare-url rule.
  test("does not flag a bare https URL in prose", async () => {
    const violations = await getBCE001Violations(
      "See https://example.com/docs for details.",
    );
    expect(violations).toHaveLength(0);
  });

  test("does not flag a bare https URL with a directory path", async () => {
    const violations = await getBCE001Violations(
      "Docs: https://github.com/settings/tokens",
    );
    expect(violations).toHaveLength(0);
  });

  test("does not flag an http URL", async () => {
    const violations = await getBCE001Violations(
      "Visit http://example.org/path/to/page now.",
    );
    expect(violations).toHaveLength(0);
  });

  test("does not flag an ftp URL", async () => {
    const violations = await getBCE001Violations(
      "Mirror at ftp://ftp.example.com/pub/file.tar.gz here.",
    );
    expect(violations).toHaveLength(0);
  });

  test("does not report a path-only violation for the URL path component", async () => {
    const violations = await getBCE001Violations(
      "See https://code.claude.com/docs/en/mcp.md for details.",
    );
    expect(violations).toHaveLength(0);
  });

  test("still flags actual file paths", async () => {
    const violations = await getBCE001Violations(
      "Edit the file at src/rules/backtick-code-elements.js.",
    );
    expect(violations.length).toBeGreaterThan(0);
  });
});

describe("BCE001 slash-joined prose words with apostrophes", () => {
  // A slash-joined word list containing an apostrophe (e.g. an ordinary prose
  // token like "stop/don't/wait/wrong/undo/actually") must not be flagged, and
  // no autofix may ever insert a backtick inside a word.
  test("does not flag a slash list containing an apostrophe", async () => {
    const violations = await getBCE001Violations(
      "stop/don't/wait/wrong/undo/actually",
    );
    expect(violations).toHaveLength(0);
  });

  test("does not split mid-token at the apostrophe", async () => {
    const violations = await getBCE001Violations(
      "Use stop/don't/wait/wrong/undo/actually as the prompts.",
    );
    // No violation should wrap a fragment that begins mid-word (e.g. "t/wait/...")
    const midToken = violations.filter((v) =>
      typeof v.errorContext === "string" && /^t\//.test(v.errorContext),
    );
    expect(midToken).toHaveLength(0);
    expect(violations).toHaveLength(0);
  });
});

describe("BCE001 ellipsis-joined prose words (#196)", () => {
  test("does not flag ellipsis between common words", async () => {
    const violations = await getBCE001Violations(
      "The idea is only...but not always applicable.",
    );
    expect(violations).toHaveLength(0);
  });

  test("does not flag ellipsis between longer prose words", async () => {
    const violations = await getBCE001Violations(
      "The system...was updated overnight.",
    );
    expect(violations).toHaveLength(0);
  });

  test("still flags actual code identifiers containing dots", async () => {
    const violations = await getBCE001Violations(
      "The file config.json stores settings.",
    );
    expect(violations.length).toBeGreaterThan(0);
  });
});
