# Agent handbook

## Targeted tests

- `npm test -- --testNamePattern="test name"` — Run by name.
- `npm test tests/features/specific-file.test.js` — Run single file.

## Coding style

- Kebab-case rule filenames. Named exports for utilities. 2-space indent.
- JSDoc typedefs for public rule helpers.
- `docs/configuration.md` documents the preset tiers (`*-config.jsonc`) by hand, so update it when a preset changes.

## Rules and testing

See `docs/rules.md` for the full rule reference and `docs/testing.md` for test strategy and conventions.

## False positive validation

Always validate rule changes against a consumer repository before merging. Follow the 6-step loop documented in `docs/testing.md#false-positive-validation`.
