// @ts-check

"use strict";

/**
 * Test suite for the sentence-case-headings-bold markdownlint rule
 * 
 * @description Tests various scenarios for the sentence case rule to ensure
 * it correctly identifies title case in headings and bold text while properly
 * handling special cases like technical terms, acronyms, and proper nouns
 * @module sentence-case.test
 */

const markdownlint = require("markdownlint");
const assert = require("assert");

// Import the custom rule
const sentenceCaseRule = require("../../rules/sentence-case.js");

describe("sentence-case-headings-bold rule", function () {
  it("should detect title case headings", function () {
    const options = {
      customRules: [sentenceCaseRule],
      config: { MD041: false, MD047: false },
      strings: {
        content: "# This Is Definitely A Title Case Heading",
      },
    };

    const result = markdownlint.sync(options);
    const errors = Array.isArray(result["content"]) ? result["content"] : [];
    assert.ok(errors.length > 0, "Should detect title case heading");

    let foundHeadingError = false;
    for (let i = 0; i < errors.length; i++) {
      if (
        errors[i].ruleNames &&
        errors[i].ruleNames.includes("sentence-case-headings-bold")
      ) {
        foundHeadingError = true;
        break;
      }
    }
    assert.ok(foundHeadingError, "Should flag title case in heading");
  });

  it("should not flag sentence case headings", function () {
    const options = {
      customRules: [sentenceCaseRule],
      config: { MD041: false, MD047: false },
      strings: {
        content: "# This is a sentence case heading",
      },
    };

    const result = markdownlint.sync(options);
    const errors = Array.isArray(result["content"]) ? result["content"] : [];

    let foundHeadingError = false;
    for (let i = 0; i < errors.length; i++) {
      if (
        errors[i].ruleNames &&
        errors[i].ruleNames.includes("sentence-case-headings-bold")
      ) {
        foundHeadingError = true;
        break;
      }
    }
    assert.ok(!foundHeadingError, "Should not flag sentence case in heading");
  });

  // Adversarial test: Heading with project-specific terms
  it("should not flag headings with project-specific terms", function () {
    const options = {
      customRules: [sentenceCaseRule],
      config: { MD041: false, MD047: false },
      strings: {
        content: "# Sync Windsurf rules and workflows into your project",
      },
    };

    const result = markdownlint.sync(options);
    const errors = Array.isArray(result["content"]) ? result["content"] : [];

    let foundHeadingError = false;
    for (let i = 0; i < errors.length; i++) {
      if (
        errors[i].ruleNames &&
        errors[i].ruleNames.includes("sentence-case-headings-bold")
      ) {
        foundHeadingError = true;
        break;
      }
    }
    assert.ok(
      !foundHeadingError,
      "Should not flag headings with project-specific terms",
    );
  });

  // Adversarial test: Heading with multiple technical terms
  it("should not flag headings with multiple technical terms", function () {
    const options = {
      customRules: [sentenceCaseRule],
      config: { MD041: false, MD047: false },
      strings: {
        content: "# Using JavaScript, TypeScript, and React with Windsurf",
      },
    };

    const result = markdownlint.sync(options);
    const errors = Array.isArray(result["content"]) ? result["content"] : [];

    let foundHeadingError = false;
    for (let i = 0; i < errors.length; i++) {
      if (
        errors[i].ruleNames &&
        errors[i].ruleNames.includes("sentence-case-headings-bold")
      ) {
        foundHeadingError = true;
        break;
      }
    }
    assert.ok(
      !foundHeadingError,
      "Should not flag headings with multiple technical terms",
    );
  });

  // Adversarial test: Heading with acronyms
  it("should not flag headings with acronyms", function () {
    const options = {
      customRules: [sentenceCaseRule],
      config: { MD041: false, MD047: false },
      strings: {
        content: "# Working with HTML, CSS, and JSON in your API",
      },
    };

    const result = markdownlint.sync(options);
    const errors = Array.isArray(result["content"]) ? result["content"] : [];

    let foundHeadingError = false;
    for (let i = 0; i < errors.length; i++) {
      if (
        errors[i].ruleNames &&
        errors[i].ruleNames.includes("sentence-case-headings-bold")
      ) {
        foundHeadingError = true;
        break;
      }
    }
    assert.ok(!foundHeadingError, "Should not flag headings with acronyms");
  });

  // Adversarial test: Borderline case with ~40% capitalized words
  it("should handle borderline cases appropriately", function () {
    const options = {
      customRules: [sentenceCaseRule],
      config: { MD041: false, MD047: false },
      strings: {
        content:
          "# This is a heading with JavaScript and React but mostly lowercase words",
      },
    };

    const result = markdownlint.sync(options);
    const errors = Array.isArray(result["content"]) ? result["content"] : [];

    let foundHeadingError = false;
    for (let i = 0; i < errors.length; i++) {
      if (
        errors[i].ruleNames &&
        errors[i].ruleNames.includes("sentence-case-headings-bold")
      ) {
        foundHeadingError = true;
        break;
      }
    }
    assert.ok(
      !foundHeadingError,
      "Should not flag borderline cases with proper nouns",
    );
  });

  // Adversarial test: Heading with compound technical terms
  it("should not flag headings with compound technical terms", function () {
    const options = {
      customRules: [sentenceCaseRule],
      config: { MD041: false, MD047: false },
      strings: {
        content: "# Using TypeScript with ReactDOM and NextJS frameworks",
      },
    };

    const result = markdownlint.sync(options);
    const errors = Array.isArray(result["content"]) ? result["content"] : [];

    let foundHeadingError = false;
    for (let i = 0; i < errors.length; i++) {
      if (
        errors[i].ruleNames &&
        errors[i].ruleNames.includes("sentence-case-headings-bold")
      ) {
        foundHeadingError = true;
        break;
      }
    }
    assert.ok(
      !foundHeadingError,
      "Should not flag headings with compound technical terms",
    );
  });

  // Adversarial test: Bold text in title case
  it("should detect title case in bold text", function () {
    const options = {
      customRules: [sentenceCaseRule],
      config: { MD041: false, MD047: false },
      strings: {
        content:
          "This paragraph has **Bold Text In Title Case** that should be flagged.",
      },
    };

    const result = markdownlint.sync(options);
    const errors = Array.isArray(result["content"]) ? result["content"] : [];

    let foundBoldError = false;
    for (let i = 0; i < errors.length; i++) {
      if (
        errors[i].ruleNames &&
        errors[i].ruleNames.includes("sentence-case-headings-bold")
      ) {
        foundBoldError = true;
        break;
      }
    }
    assert.ok(foundBoldError, "Should flag title case in bold text");
  });

  // Adversarial test: Bold text with technical terms
  it("should not flag bold text with technical terms", function () {
    const options = {
      customRules: [sentenceCaseRule],
      config: { MD041: false, MD047: false },
      strings: {
        content:
          "This paragraph has **bold text with JavaScript and React** that should not be flagged.",
      },
    };

    const result = markdownlint.sync(options);
    const errors = Array.isArray(result["content"]) ? result["content"] : [];

    let foundBoldError = false;
    for (let i = 0; i < errors.length; i++) {
      if (
        errors[i].ruleNames &&
        errors[i].ruleNames.includes("sentence-case-headings-bold")
      ) {
        foundBoldError = true;
        break;
      }
    }
    assert.ok(
      !foundBoldError,
      "Should not flag bold text with technical terms",
    );
  });

  // Adversarial test: Heading with unusual capitalization patterns
  it("should handle headings with unusual capitalization patterns", function () {
    const options = {
      customRules: [sentenceCaseRule],
      config: { MD041: false, MD047: false },
      strings: {
        content: "# Working with macOS, iPhone, and AWS services",
      },
    };

    const result = markdownlint.sync(options);
    const errors = Array.isArray(result["content"]) ? result["content"] : [];

    let foundHeadingError = false;
    for (let i = 0; i < errors.length; i++) {
      if (
        errors[i].ruleNames &&
        errors[i].ruleNames.includes("sentence-case-headings-bold")
      ) {
        foundHeadingError = true;
        break;
      }
    }
    assert.ok(
      !foundHeadingError,
      "Should not flag headings with unusual capitalization patterns",
    );
  });
});
