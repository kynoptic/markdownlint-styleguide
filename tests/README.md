# `tests`

This directory contains tests for the custom markdownlint rules.

## Test structure

- `rules/`: Contains test files for individual rules
  - `sentence-case.test.js`: Tests for the sentence case rule
  - `backtick-code-elements.test.js`: Tests for the backtick code elements rule

## Writing tests

Each test file should:

1. Import the rule being tested
2. Define test cases with input and expected output
3. Use Jest's test functions to verify the rule behavior

### Example Test

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

## Running Tests

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

## Test utils

The `utils/` directory contains helper functions for testing rules.
