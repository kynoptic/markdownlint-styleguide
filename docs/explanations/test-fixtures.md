# Understanding test fixtures

This document explains how `markdownlint-trap` uses test fixtures to validate its custom rules. Our testing strategy relies heavily on these Markdown files to ensure rules behave as expected, catching both correct and incorrect Markdown patterns.

## Testing overview

`markdownlint-trap` uses Jest as its test runner. The core of our rule validation involves running `markdownlint-cli2` against specially crafted Markdown files, known as **test fixtures**. These fixtures are designed to contain specific Markdown patterns that should either *pass* (not trigger a lint error) or *fail* (trigger a lint error) for a given rule.

## What are test fixtures?

Test fixtures are Markdown files located in the `tests/fixtures/` directory. They are organized by rule, and then further categorized into `passing.md` and `failing.md` files within each rule's directory.

For example, for the `backtick-code-elements` rule, you'll find:

```text
tests/
  fixtures/
    backtick-code-elements/
      passing.md
      failing.md
    sentence-case-heading/
      passing.md
      failing.md
    # ... other rules
```

## Anatomy of a test fixture

Each line in a test fixture can be marked to indicate whether it's expected to pass or fail a specific rule. This is done using special markers:

- `✅`: Indicates that the line is expected to **pass** (i.e., no lint error should be reported for this line by the rule being tested).
- `❌`: Indicates that the line is expected to **fail** (i.e., a lint error *should* be reported for this line by the rule being tested).

Lines without these markers are ignored by the test runner for the purpose of checking rule violations. This allows you to include comments, context, or other Markdown that isn't directly part of the test case.

The test runner reads these markers and compares the actual linting results against the expected outcomes. If a `✅` line triggers an error, or an `❌` line *doesn't* trigger an error, the test will fail.

### Example fixture (**p_0**)

```markdown
# This Is Not Correct ❌ Heading should be sentence case
## DO NOT USE ALL CAPS ❌ All caps heading
first word not capitalized ❌ First word not capitalized
```

## Adding new test cases

When you discover a new edge case, a bug, or want to ensure a specific pattern is correctly handled, you should add a corresponding entry to the test fixtures.

1. **Identify the relevant rule**: Determine which rule your new test case applies to (e.g., `backtick-code-elements`).
2. **Choose the correct fixture file**:
    - If the Markdown *should not* trigger an error, add it to `tests/fixtures/<rule-name>/passing.md`.
    - If the Markdown *should* trigger an error, add it to `tests/fixtures/<rule-name>/failing.md`.
3. **Add the line with its marker**: Append your Markdown line to the chosen fixture file, followed by the `✅` or `❌` marker and an optional descriptive comment.

    ```markdown
    # Example for backtick-code-elements/failing.md
    Run ./build.sh to start the build ❌ Missing backticks around path
    ```

4. **Run the tests**: After adding your test case, run `npm test` to verify that your change behaves as expected. If you've added a failing case for a bug, the test should initially fail, and then pass once your rule fix is implemented.

By consistently adding to these fixtures, we build a robust regression suite that helps maintain the quality and accuracy of our custom markdownlint rules.
