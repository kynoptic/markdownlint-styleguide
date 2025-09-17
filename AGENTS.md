# Agent handbook

## Overview

markdownlint-trap is a Node.js project that ships a curated set of custom `markdownlint` rules. The rules enforce documentation standards such as sentence-case headings, backticks around code elements, and validated internal links. Source code is written as ES modules and transpiled via Babel for compatibility with markdownlint. Testing relies on Jest, while ESLint and markdownlint-cli2 enforce code and documentation quality.

**Key technologies**: Node.js, markdownlint, Babel, Jest, ESLint.

## Repository layout

- **Source** lives in `src/`, with individual rules inside `src/rules/` and the aggregated export in `src/index.js`.
- **Build artifacts** are emitted to `.markdownlint-rules/`; regenerate them rather than editing in place.
- **Scripts** reside in `scripts/` and root `*.jsonc` presets (`basic`, `recommended`, `strict`) configure rule bundles.
- **Tests** live under `tests/`, with feature specs in `tests/features/`, fixtures in `tests/fixtures/`, and curated scenarios in `tests/integration/`.
- **Documentation** for contributors is stored in `docs/`.
- **Consumers** `import` the compiled CommonJS rules through the configuration presets.

## Command reference

### Setup

- `npm install` – Install project dependencies.

### Build and test

- `npm run build` – Transpile ES modules in `src/` to CommonJS output in `.markdownlint-rules/`.
- `npm test` – Run the full Jest suite.
- `npm run test:integration` – Execute integration scenarios.
- `npm run test:integration:external` – Validate rules against curated external repositories.
- `npm run test:performance` – Run performance benchmarks (use `...:gc` variant for garbage-collection profiling).
- `npm run lint` – Enforce JavaScript style and quality.

### Targeted test execution

- `npm test -- --testNamePattern="test name"` – Run a specific test by name.
- `npm test tests/features/specific-file.test.js` – Run an individual test file.

### Markdown linting

- `npx markdownlint-cli2 "**/*.md"` – Lint all Markdown files.
- `npx markdownlint-cli2 --fix "**/*.md"` – Auto-fix lintable Markdown issues.

### Maintenance

- `npm run docs:config` – Regenerate configuration documentation.
- `npm run prepare` – Install Husky hooks after dependency installation.

## Development workflow

1. Implement or update rules in `src/` using ES modules and shared utilities where appropriate.
2. Run Jest directly against source (no build step required for tests).
3. Generate CommonJS artifacts with `npm run build` for distribution.
4. Validate the user experience with integration tests and performance suites as needed.

## Coding style and conventions

- Target Node.js `>=18` (see `.nvmrc`).
- Prefer named exports for utilities and keep rule filenames kebab-cased (for example, `sentence-case-heading.js`).
- Follow ESLint's `eslint:recommended` baseline with 2-space indentation and trailing commas where valid.
- Supply JSDoc typedefs for public rule helpers.
- Use `markdownlint-cli2` to keep Markdown clean; avoid editing generated rule docs directly.

## Rule catalogue

The distribution currently contains five custom rules:

- `src/rules/backtick-code-elements.js` – Enforces backticks around code elements.
- `src/rules/sentence-case-heading.js` – Requires sentence case in headings.
- `src/rules/no-bare-urls.js` – Prevents bare URLs and requires link formatting.
- `src/rules/no-dead-internal-links.js` – Validates internal file links and anchors.
- `src/rules/no-literal-ampersand.js` – Replaces `&` with "and" in prose.

Supporting modules include `src/rules/shared-utils.js`, `src/rules/shared-constants.js`, `src/rules/autofix-safety.js`, and `src/rules/config-validation.js`.

## Testing guidelines

- Place Jest specs alongside the functionality they verify using the `*.test.js` suffix.
- Cover both passing and failing Markdown samples; reuse fixtures from `tests/fixtures/` where possible.
- Snapshot integration outputs in `tests/integration/__snapshots__/`.
- Include performance regression checks when rule behavior may impact large documents.
- Run the relevant `npm run test:*` command locally before submitting changes.

## Contribution practices

- Follow Conventional Commits (`feat|fix|chore|test|docs|style|refactor(scope): summary`).
- Squash noisy fixups and ensure CI passes by running `npm run lint` and relevant tests before requesting review.
- Summarize rule or config changes, link related issues, and document manual verification steps in pull requests.
- Attach updated Markdown samples or screenshots when rule behavior changes.
