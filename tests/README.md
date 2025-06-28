# `/tests`

## Purpose

This directory contains test fixtures and test implementations for the markdownlint-trap custom rules. Tests follow a fixture-based approach where example Markdown files with annotated pass/fail cases are used to validate rule behavior.

## Contents

### Structure

```
tests/
  fixtures/
    backtick/
      autofix.fixture.md
      autofix.fixed.md
      autofix-minimal.fixture.md
      autofix-minimal.fixed.md
      failing.fixture.md
      passing.fixture.md
      math.fixture.md
      file-path-regex-validation.md
      file-path-regex-validation.json
    sentence-case/
      autofix.fixture.md
      autofix.fixed.md
      failing.fixture.md
      passing.fixture.md
    backtick-math.fixture.md
    wt-no-bare-urls.fixture.md
  rules/     - Jest test suites implementing the rule checks
  utils/     - Helper modules shared across tests
```

Fixtures contain examples annotated with `<!-- ✅ -->` or `<!-- ❌ -->` to mark
passing and failing lines. The Jest suites under `rules/` load these fixtures and
verify rule behavior using the helpers from `utils/`.

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

- **[`../.vscode/custom-rules/`](../.vscode/custom-rules/)** – Implementation of the custom rules being tested
- **[`../docs/`](../docs/)** – Documentation for the rules
- **[`../README.md`](../README.md)** – Project overview
