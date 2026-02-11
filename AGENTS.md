# Agent handbook

## Overview

markdownlint-trap ships custom `markdownlint` rules enforcing sentence-case headings, backtick code elements, link validation, and prose style. Native ES modules, no build step. Jest for testing, ESLint and markdownlint-cli2 for quality.

## Repository layout

- `src/rules/` — Individual rule implementations and shared modules; entry point `src/index.js`
- `*-config.jsonc` — Preset tiers (`basic`, `recommended`, `strict`); see `docs/configuration.md`
- `templates/` — CLI and VS Code config templates mirroring each preset
- `tests/unit/`, `tests/features/`, `tests/integration/`, `tests/performance/` — Test layers
- `tests/fixtures/` — Shared Markdown fixtures organized by rule
- `docs/` — Architecture, testing strategy, rule authoring, configuration, decisions
- `scripts/` — Maintenance and build scripts

## Command reference

### Setup

- `npm install` — Install dependencies.

### Test and lint

- `npm test` — Full Jest suite (all layers).
- `npm run test:integration` — Integration scenarios.
- `npm run test:integration:external` — Validate against external repositories.
- `npm run test:performance` — Performance benchmarks.
- `npm run lint` — ESLint checks.

### Targeted tests

- `npm test -- --testNamePattern="test name"` — Run by name.
- `npm test tests/features/specific-file.test.js` — Run single file.

### Markdown linting

- `npx markdownlint-cli2 "**/*.md"` — Lint all Markdown.
- `npx markdownlint-cli2 --fix "**/*.md"` — Auto-fix.

## Coding style

- Node.js `>=18` (see `.nvmrc`). ES modules only, no transpilation.
- Kebab-case rule filenames. Named exports for utilities. 2-space indent.
- JSDoc typedefs for public rule helpers.

## Rule catalogue

Five custom rules in `src/rules/`: `backtick-code-elements`, `sentence-case-heading`, `no-bare-urls`, `no-dead-internal-links`, `no-literal-ampersand`. Supporting modules: `rule-helpers`, `shared-heuristics`, `shared-utils`, `shared-constants`, `autofix-safety`, `config-validation`. See `docs/rules.md` for full reference.

## Testing

Four layers: unit (`tests/unit/`), feature (`tests/features/`), integration (`tests/integration/`), performance (`tests/performance/`). Fixtures in `tests/fixtures/`. See `docs/testing.md` for strategy, conventions, and the false positive validation loop.

## False positive validation

Always validate rule changes against a consumer repository before merging. Follow the 6-step loop documented in `docs/testing.md#false-positive-validation`.
