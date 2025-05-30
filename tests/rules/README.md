# `/tests/rules`

## Purpose

Houses test files for each custom markdownlint rule.

## Contents

### Files

* `sentence-case.test.js` – Tests for the sentence case rule
* `backtick-code-elements.test.js` – Tests for the backtick code elements rule

## Usage

Run all tests with:

```bash
npm test
```

Or run a specific test file with:

```bash
npx jest tests/rules/sentence-case.test.js
```

## Related modules

* [`../../rules/`](../../rules/) – Custom rule implementations
* [`../README.md`](../README.md) – Test suite overview
