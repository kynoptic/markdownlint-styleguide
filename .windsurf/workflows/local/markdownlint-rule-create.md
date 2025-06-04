---
description: Automates a test-driven workflow for developing, validating, and registering custom `markdownlint` rules using Jest and fixture-based assertions. Ensures rules are authored against real markdown examples, verified through automated tests, and integrated with project-wide linting.
---

# Test-first workflow for custom `markdownlint` rules

1. **Generate fixture file with structured examples** – Check for `/tests/fixtures/[rule-name].fixture.md`. If absent, create it with:
   - Valid cases ending in `<!-- ✅ -->`
   - Invalid cases ending in `<!-- ❌ -->`
   - At least one ambiguous or edge case in each set to challenge the rule logic

2. **Create Jest test file** – Generate `/tests/[rule-name].test.js` that:
   - Parses the corresponding fixture file
   - Maps `✅` lines to passing expectations and `❌` to violations
   - Loads `markdownlint` with the target rule file
   - Uses Jest to assert expected violations on each case

3. **Scaffold custom rule module** – Create `/vscode/custom-rules/[rule-name].js` exporting a valid `markdownlint` rule definition:
   - Include `names`, `description`, `tags`, and a `function(params, onError)`
   - Stub function returns no errors initially
   - Ensure the test file imports and applies the rule correctly

4. **Run test suite (expect failures)** – Execute `jest /tests/[rule-name].test.js`. Confirm that:
   - Lines marked `<!-- ❌ -->` fail as expected
   - Lines marked `<!-- ✅ -->` pass
   - Stub rule should fail most checks; this validates test harness logic

5. **Implement rule logic until all tests pass** – Update the rule’s `function` to:
   - Detect violations using `params.lines`
   - Emit errors via `onError({ lineNumber, detail })`
   - Repeat `jest` runs until the test suite passes completely

6. **Refactor and generalize rule logic** – Clean up implementation:
   - Extract reusable utilities or patterns
   - Improve readability and robustness for edge cases
   - Rerun full tests to verify no regressions introduced

7. **Register rule in markdownlint config** – Modify `.markdownlint-cli2.jsonc`:
   - Append the rule path to `customRules`
   - Enable the rule explicitly in `config.rules` using its exported name

8. **Document rule in README** – Update `docs/rules.md` to include:
   - Rule name
   - Short description
   - Failing cases
   - Passing cases
   - Link to fixture file
   - Link to test file
   - Link to rule implementation
