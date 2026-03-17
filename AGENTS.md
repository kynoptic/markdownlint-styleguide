# Agent handbook

## Overview

markdownlint-trap ships custom `markdownlint` rules enforcing sentence-case headings, backtick code elements, link validation, and prose style. Native ES modules, no build step. Jest for testing, ESLint and markdownlint-cli2 for quality.

## Repository layout

- `src/rules/` — Individual rule implementations and shared modules; entry point `src/index.js`
- `*-config.jsonc` — Preset tiers (`basic`, `recommended`, `strict`); see `docs/configuration.md`
- `templates/` — CLI and VS Code config templates mirroring each preset
- `tests/unit/`, `tests/features/`, `tests/integration/`, `tests/performance/` — Test layers
- `tests/fixtures/` — Shared Markdown fixtures organized by rule
- `docs/` — Architecture, testing strategy, rule authoring, configuration, ADRs
- `scripts/` — CLI, maintenance, and distribution scripts

## Command reference

### Setup

- `npm install` — Install dependencies.

### Test and lint

- `npm test` — Full Jest suite (all layers).
- `npm run test:integration` — Integration scenarios.
- `npm run test:integration:external` — Validate against external repositories.
- `npm run test:performance` — Performance benchmarks.
- `npm run lint` — ESLint checks.
- `npm run lint:md` — Lint all Markdown.
- `npm run lint:md:fix` — Auto-fix Markdown.
- `npm run validate` — Run lint + test suite together.

### Targeted tests

- `npm test -- --testNamePattern="test name"` — Run by name.
- `npm test tests/features/specific-file.test.js` — Run single file.

### Utilities

- `npm run security` — Audit production dependencies.
- `npm run doctor` — Diagnose installation issues.
- `npm run docs:config` — Regenerate configuration docs.
- `npm run validate:external` — Validate rules against external projects.

## Coding style

- Node.js `>=20` (see `.nvmrc`). ES modules only, no transpilation.
- Kebab-case rule filenames. Named exports for utilities. 2-space indent.
- JSDoc typedefs for public rule helpers.

## Rule catalogue

Six custom rules in `src/rules/`: `backtick-code-elements`, `sentence-case-heading`, `no-bare-urls`, `no-dead-internal-links`, `no-literal-ampersand`, `no-empty-list-items`. Supporting modules: `shared-heuristics`, `shared-utils`, `shared-constants`, `autofix-safety`, `autofix-telemetry`, `config-validation`. The `sentence-case/` subdirectory contains classifier and fix-builder internals. See `docs/rules.md` for full reference.

## Testing

Four layers: unit (`tests/unit/`), feature (`tests/features/`), integration (`tests/integration/`), performance (`tests/performance/`). Fixtures in `tests/fixtures/`. See `docs/testing.md` for strategy, conventions, and the false positive validation loop.

## False positive validation

Always validate rule changes against a consumer repository before merging. Follow the 6-step loop documented in `docs/testing.md#false-positive-validation`.
