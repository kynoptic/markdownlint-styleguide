# `tests` directory

This directory contains tests for the custom markdownlint rules. The tests ensure that each rule correctly identifies markdown issues and provides appropriate error messages.

## Test structure

- `rules/`: Contains test files for individual rules
  - `sentence-case.test.js`: Tests for the sentence case rule, verifying it correctly identifies title case in headings and bold text
  - `backtick-code-elements.test.js`: Tests for the backtick code elements rule, ensuring it correctly flags unwrapped code elements
- `test-markdownlint-rule.js`: A standalone test script that provides a lightweight testing framework for the sentence case rule
- `utils/`: Contains helper functions and utilities for testing

## Writing tests

Each test file should:

1. Import the rule being tested
2. Define test cases with input and expected output
3. Use Jest's test functions to verify the rule behavior
4. Include both positive tests (cases that should pass) and negative tests (cases that should fail)
5. Test edge cases and potential false positives

### Example test

```javascript
const rule = require("../../rules/example-rule");
const ruleTester = require("../utils/rule-tester");

describe("example-rule", () => {
  it("should pass when ...", () => {
    const input = "...";
    const expected = [];
    ruleTester.test(rule, input, expected);
  });
});
```

## Running tests

Run all tests:

```bash
npm test
```

Run tests for a specific rule:

```bash
npx jest tests/rules/example-rule.test.js
```

Run tests with coverage:

```bash
npm test -- --coverage
```

## Test utilities

The `utils/` directory contains helper functions for testing rules, including:

- Mock functions for simulating markdownlint's environment
- Assertion helpers for verifying rule behavior
- Utilities for generating test cases

## Test coverage requirements

All rules should have comprehensive test coverage that includes:

- Basic functionality tests
- Edge case tests
- False positive tests
- Integration tests with markdownlint

The project aims to maintain at least 80% code coverage for all rules.
