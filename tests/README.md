# Markdownlint custom rules tests

This directory contains tests for the custom markdownlint rules.

## Test structure

- `unit/`: Unit tests for individual rules
  - `sentence-case.test.js`: Tests for the sentence case rule
  - `backtick-code-elements.test.js`: Tests for the backtick code elements rule
- `fixtures/`: Markdown files used for testing
  - `sentence-case-sample.md`: Sample markdown with sentence case examples
  - `backtick-code-elements-sample.md`: Sample markdown with code element examples
- `integration.test.js`: Integration tests that test multiple rules together
- `test-helpers.js`: Helper functions for testing rules

## Running tests

To run all tests:

```bash
npm test
```

To run a specific test file:

```bash
npx jest tests/unit/sentence-case.test.js
```

To run tests with coverage:

```bash
npx jest --coverage
```

## Test coverage

The Jest configuration is set to enforce 80% code coverage for:

- Statements
- Branches
- Functions
- Lines

## Known issues

The `backtick-code-elements` rule has known performance issues that can cause timeouts during testing. The tests for this rule have an increased timeout setting to accommodate this.

## Adding new tests

When adding new tests:

1. For unit tests, create a new file in the `tests/unit/` directory
2. Use the `testRule` helper from `test-helpers.js` to test rule violations
3. Add appropriate test fixtures in the `tests/fixtures/` directory if needed
