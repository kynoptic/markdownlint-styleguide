# `/tests/fixtures/sentence-case`

## Purpose

Markdown files verifying the sentence case heading rule. They help ensure headings are capitalized correctly.

## Contents

### Files

- `passing.fixture.md` – headings follow sentence case
- `failing.fixture.md` – headings use incorrect capitalization
- `autofix.fixture.md` – incorrect headings used to test auto-fix
- `autofix.fixed.md` – expected output after auto-fix

Fixtures use `<!-- ✅ -->` and `<!-- ❌ -->` markers so the tests can validate each line.
