# `/unit`

## Purpose

Unit tests for individual custom markdownlint-trap rules. These tests ensure each rule behaves correctly in isolation and covers edge cases.

## Contents

### Files

* `sentence-case.test.js` – Unit tests for the sentence-case rule
* `backtick-code-elements.test.js` – Unit tests for the backtick-code-elements rule

## Usage

Run all unit tests:

```bash
npx jest tests/unit/
```

## Related modules

* [`../features/`](../features/) – Feature tests
* [`../integration/`](../integration/) – Integration tests
* [`../README.md`](../README.md) – Test suite overview
