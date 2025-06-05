# `/tests`

## Purpose

This directory contains test fixtures and test implementations for the markdownlint-trap custom rules. Tests follow a fixture-based approach where example Markdown files with annotated pass/fail cases are used to validate rule behavior.

## Contents

### Files

* **[`basic-sentence-case-heading.fixture.md`](./basic-sentence-case-heading.fixture.md)** – Test fixture containing examples of correct and incorrect heading formats for the sentence-case-heading rule
* **[`sentence-case-heading.test.js`](./sentence-case-heading.test.js)** – Jest test implementation that validates the sentence-case-heading rule against the fixture

## Usage

Tests are run using Jest with ES modules support:

```bash
npm test
```

### Debug output

Verbose test output can be enabled using the [`debug`](https://www.npmjs.com/package/debug) module. Set the
`DEBUG` environment variable when running tests to see additional logging from the
test suite:

```bash
DEBUG=markdownlint-trap* npm test
```

### Fixture format

Test fixtures use HTML comments to mark passing and failing examples:

```markdown
# This is a correct heading <!-- ✅ -->
# This Is Not Correct <!-- ❌ -->
```

## Related modules

* **[`../.vscode/custom-rules/`](../.vscode/custom-rules/)** – Implementation of the custom rules being tested
* **[`../docs/`](../docs/)** – Documentation for the rules
* **[`../README.md`](../README.md)** – Project overview
