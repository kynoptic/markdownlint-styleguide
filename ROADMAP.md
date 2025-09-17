# Roadmap

This roadmap highlights the prioritized initiatives required to keep `markdownlint-trap` reliable and helpful for downstream documentation teams.

## Test infrastructure

- **Unskip curated integration suite** by replacing live `git clones` with vendored fixtures or an opt-in network flag; keep it runnable in CI (`tests/integration/curated-repos.test.js`, `package.json`).
- **Cover config regression paths** for `allowedExtensions` so non-Markdown targets stay supported (`no-dead-internal-links` rule tests).

## Rule quality

- **Expand heading parsing to setext** blocks so anchors resolve for underlined H1/H2 sections (`src/rules/no-dead-internal-links.js`).
- **Audit shared dictionaries** to capture emerging terms and minimize sentence-case false positives (`sentence-case-heading` and shared constants).

## Developer experience

- **Document release checklist** in `docs/` to align with semantic versioning guidance and agent workflow.
- **Tighten `Husky/prepare` hooks** to fail early when build artifacts drift or linting is skipped.

## Stretch ideas

- **Investigate new rules** for table header capitalization and link text clarity once the current backlog is cleared.
- **Benchmark large-repo performance** quarterly and publish findings in `docs/performance.md`.
