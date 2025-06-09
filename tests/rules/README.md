# `/tests/rules`

## Purpose

Provide Jest test suites for the custom rules implemented in this project. Each file targets a specific fixture so that passing and failing cases are easy to verify.

## Contents

### Files

- `backtick-passing.test.js` – ensures the backtick rule passes valid examples
- `backtick-failing.test.js` – confirms violations are reported correctly
- `sentence-case-passing.test.js` – checks valid headings for the sentence case rule
- `sentence-case-failing.test.js` – checks invalid headings for the sentence case rule

## Usage

Run `npm test` to execute all suites. Use `DEBUG=markdownlint-trap*` for verbose output if troubleshooting.
