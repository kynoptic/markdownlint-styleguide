# Agent handbook

## Overview

markdownlint-trap is a Node.js project that ships a curated set of custom `markdownlint` rules. The rules enforce documentation standards such as sentence-case headings, backticks around code elements, and validated internal links. Source code is written as native ES modules and distributed directly without transpilation. Testing relies on Jest, while ESLint and markdownlint-cli2 enforce code and documentation quality.

**Key technologies**: Node.js, markdownlint, Jest, ESLint.

## Repository layout

- **Source** lives in `src/`, with individual rules inside `src/rules/` and the aggregated export in `src/index.js`.
  - Complex rules may be split into submodules (e.g., `sentence-case/case-classifier.js`, `sentence-case/fix-builder.js`)
  - Shared utilities live in `src/rules/shared-heuristics.js`, `src/rules/shared-utils.js`, `src/rules/shared-constants.js`
  - Rule authoring helpers in `src/rules/rule-helpers.js` provide standardized config validation, logging, and fix wiring
- **Scripts** reside in `scripts/` and root `*.jsonc` presets (`basic`, `recommended`, `strict`) configure rule bundles.
- **Tests** live under `tests/`:
  - Unit tests in `tests/unit/` and `src/rules/*.test.js` (fast, isolated component testing)
  - Feature specs in `tests/features/` (end-to-end rule validation)
  - Integration scenarios in `tests/integration/` (multi-rule and real-world testing)
  - Performance benchmarks in `tests/performance/`
- **Documentation** for contributors is stored in `docs/`:
  - Architecture and decisions in `docs/architecture.md` and `docs/decisions/`
  - Testing strategy in `docs/testing.md`
  - Rule reference in `docs/rules.md`
  - Rule authoring guide in `docs/rule-authoring.md` (how to create new rules with helpers)
  - Dependency management in `docs/dependency-management.md` (automated updates via Renovate)
- **Consumers** import the native ES modules directly from `src/` through the configuration presets.

## Command reference

### Setup

- `npm install` – Install project dependencies.

### Test and lint

- `npm test` – Run the full Jest suite (all test layers).
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
- `npm run security` – Run security audit on production dependencies.

### Dependency management

Dependencies are automatically updated via Renovate:

- **Security updates**: Created immediately when vulnerabilities detected
- **Routine updates**: Weekly on Monday mornings
- **Auto-merge**: Enabled for dev dependency patches/minors that pass CI
- **Manual review**: Required for production dependencies and major versions

See `docs/dependency-management.md` for detailed workflow and override procedures.

## Development workflow

1. Implement or update rules in `src/` using ES modules and shared utilities where appropriate.
   - Use rule helpers from `src/rules/rule-helpers.js` to eliminate boilerplate (see `docs/rule-authoring.md`)
   - Leverage shared utilities for common patterns
2. Run tests with `npm test` (tests run directly against source).
3. Validate the user experience with integration tests and performance suites as needed.
4. No build step required - ES modules are distributed directly from `src/`.

## False positive validation loop

When improving the ruleset, use this validation loop to identify and fix false positives:

1. **Run auto-fix on a consumer repository** (e.g., agent-playbook):

   ```bash
   cd /path/to/consumer-repo
   npm install /path/to/markdownlint-trap  # Install local version
   npx markdownlint-cli2 --fix "**/*.md"
   ```

2. **Review changes with `git diff`** to identify false positives:
   - Abbreviation plurals incorrectly backticked (PRs, IDs, MCPs)
   - Product/brand names incorrectly backticked (CrowdStrike, SharePoint)
   - Common English phrases matched as code (e.g., "import them")
   - Proper nouns incorrectly lowercased (English, Civil War)
   - Filenames in headings incorrectly altered (`SKILL.md` → `Skill.md`)

3. **Create failing tests** in `tests/features/false-positive-*.test.js` that capture the issues.

4. **Fix the rules** by updating:
   - `src/rules/shared-constants.js` for new terms in `casingTerms`, `camelCaseExemptions`, or `backtickIgnoredTerms`
   - `src/rules/backtick-code-elements.js` for pattern exclusions
   - `src/rules/sentence-case/case-classifier.js` for heading exemptions

5. **Verify fixes** by running `npm test` and re-running auto-fix on the consumer.

6. **Undo consumer changes** with `git checkout -- .` before committing markdownlint-trap fixes.

## Coding style and conventions

- Target Node.js `>=18` (see `.nvmrc`).
- Prefer named exports for utilities and keep rule filenames kebab-cased (for example, `sentence-case-heading.js`).
- Follow ESLint's `eslint:recommended` baseline with 2-space indentation and trailing commas where valid.
- Supply JSDoc typedefs for public rule helpers.
- Use `markdownlint-cli2` to keep Markdown clean; avoid editing generated rule docs directly.

## Rule catalogue

The distribution currently contains five custom rules:

- `src/rules/backtick-code-elements.js` – Enforces backticks around code elements.
- `src/rules/sentence-case-heading.js` – Requires sentence case in headings (modular design with submodules).
  - `src/rules/sentence-case/case-classifier.js` – Classifies text segments (acronyms, proper nouns, etc.)
  - `src/rules/sentence-case/fix-builder.js` – Generates autofix strings
  - `src/rules/sentence-case/token-extraction.js` – Extracts tokens from headings
- `src/rules/no-bare-urls.js` – Prevents bare URLs and requires link formatting.
- `src/rules/no-dead-internal-links.js` – Validates internal file links and anchors.
- `src/rules/no-literal-ampersand.js` – Replaces `&` with "and" in prose.

Supporting modules include:

- `src/rules/rule-helpers.js` – Rule authoring contract with typed helpers (NEW: eliminates boilerplate, see `docs/rule-authoring.md`)
- `src/rules/shared-heuristics.js` – Shared utilities for acronym detection, markup preservation, code span checking (prevents behavioral drift between rules)
- `src/rules/shared-utils.js` – General utility functions
- `src/rules/shared-constants.js` – Shared constants and patterns
- `src/rules/autofix-safety.js` – Safety layer for autofixes with confidence scoring
- `src/rules/config-validation.js` – Configuration validation helpers

## Testing guidelines

The project uses a multi-layered testing strategy:

- **Unit tests** (fast, isolated) – Place specs in `tests/unit/` or alongside source files with `*.test.js` suffix. Focus on individual functions and modules.
- **Feature tests** (end-to-end) – Place in `tests/features/`. Test complete rule behavior with realistic Markdown samples.
- **Integration tests** (multi-rule) – Place in `tests/integration/`. Test rule interactions and real-world repositories. Snapshot outputs in `__snapshots__/`.
- **Performance tests** – Place in `tests/performance/`. Include regression checks when rule behavior may impact large documents.

General principles:

- Cover both passing and failing scenarios; reuse fixtures from `tests/fixtures/` where possible.
- Write behavioral tests (`test_should_X_when_Y` naming pattern) that validate observable outcomes, not implementation.
- Strategic mocking: mock external dependencies (APIs, file system), not internal business logic.
- Run the relevant `npm run test:*` command locally before submitting changes.
- See `docs/testing.md` for detailed guidance on when to write unit vs. feature tests.

## Contribution practices

- Follow Conventional Commits (`feat|fix|chore|test|docs|style|refactor(scope): summary`).
- Squash noisy fixups and ensure CI passes by running `npm run lint` and relevant tests before requesting review.
- Summarize rule or config changes, link related issues, and document manual verification steps in pull requests.
- Attach updated Markdown samples or screenshots when rule behavior changes.
