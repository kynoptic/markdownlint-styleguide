# `/tests/fixtures/backtick`

## Purpose

Sample Markdown files used to test the backtick code elements rule.

## Contents

### Files

- `failing.fixture.md` – contains missing backticks that should be flagged
- `passing.fixture.md` – contains valid usage of backticks around code elements
- `autofix.fixture.md` – examples used to test auto-fix
- `autofix.fixed.md` – expected output after auto-fix
- `autofix-minimal.fixture.md` – minimal sample for auto-fix
- `autofix-minimal.fixed.md` – minimal sample expected output
- `math.fixture.md` – ensures math expressions are not misflagged
- `file-path-regex-validation.md` – file path detection test cases
- `file-path-regex-validation.json` – expected results for path validation

Each line is annotated with `<!-- ✅ -->` or `<!-- ❌ -->` so tests can check the expected outcome.
