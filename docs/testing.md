# Testing

How to run and understand the test suites for markdownlint-trap.

## Commands

```bash
npm test                # Run all tests
npm run lint            # ESLint
npm run test:integration
npm run test:performance
```

Enable debug logging during tests:

```bash
DEBUG=markdownlint-trap* npm test
```

## What the tests cover

- Feature tests per rule (passing, failing, autofix, safety, edge cases)
- Integration tests across curated repos and combined rules
- Performance tests and micro-benchmarks

## Fixtures

The `tests/fixtures` directory contains markdown samples parsed by the test helpers. Integration tests also generate strings to validate behavior end-to-end.

## Notes

- Tests import ESM from `src/` directly via `babel-jest`; no build step is required before running tests.
- The distribution `.markdownlint-rules/` is only used by consumers of the published package or the shareable preset.
