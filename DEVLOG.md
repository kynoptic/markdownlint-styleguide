# Dev log

Engineering record — refactors, internal tooling, build changes, ADRs, dependency updates.

## [Unreleased]

---

## [2.8.0] - 2026-02-22

Security dependency update.

- Resolved minimatch ReDoS vulnerability in dev dependencies

---

## [2.7.0] - 2026-02-20

New tests, documentation, and internal module additions for the 2.7.0 features.

- New `src/rules/config-validation.js` module for rule configuration validation (internal, no public API)
- New test files: `backtick-english-suffixes.test.js`, `no-empty-list-items.test.js`, `per-rule-autofix-safety.test.js`
- New unit tests for the `generate-config-docs` script (`tests/unit/generate-config-docs.test.js`)
- `docs/extending.md` created — rule authoring and extension guide for contributors
- `docs/advanced-configuration.md` created — comprehensive reference for advanced configuration options
- `AGENTS.md` significantly streamlined; content moved to dedicated docs

---

## [2.6.0] - 2026-02-11

ESLint flat config migration and dependency updates.

- Migrated ESLint configuration from legacy `.eslintrc.json` to flat config format (`eslint.config.js`) — forced by ESLint v9 deprecation of the old format
- Dependency updates via Renovate (`package-lock.json`)

---

## [2.5.0] - 2026-01-26

Dependency upgrades.

- Upgraded to Jest 30 and markdownlint 0.40

---

## [2.4.0] - 2025-01-25

Removed repo-level Claude configuration, new test and script additions, and dependency updates.

- Removed repo-level `.claude/` directory (agents, commands, skills, settings) — migrated to user-level Claude configuration to avoid coupling project-specific tools to the repo
- New test files for identifier detection features: `snake-case-detection.test.js`, `camel-case-detection.test.js`, `pascal-case-detection.test.js`, `sentence-case-identifiers.test.js`
- Eight false-positive audit test files added (`false-positive-audit-round{1-8}.test.js`) from external repo validation passes
- New scripts: `scripts/analyze-violations.mjs`, `scripts/batch-validate.mjs`
- Dependency updates via Renovate (`package-lock.json`)

---

## [2.3.0] - 2025-12-09

Native ESM migration, Renovate setup, performance tests, and ADRs.

- Eliminated Babel transpilation pipeline — now ships native ES modules directly from `src/`
- Removed 6 Babel-related `devDependencies`, reducing build complexity
- Rule authoring helpers added to `src/rules/rule-helpers.js` to eliminate boilerplate across rules
- Comprehensive performance test suite covering autofix safety, rule performance, and memory stability
- Automated dependency management via Renovate with weekly updates and security patch automation
- Documentation for dependency management workflow in `docs/dependency-management.md`
- ADR-002: Native ESM distribution — see `docs/adr/adr-002-native-esm-distribution.md`
- ADR-003: Automated dependency updates — see `docs/adr/adr-003-automated-dependency-updates.md`
- `docs/rule-authoring.md` updated to cover new helper utilities
- Resolved Renovate configuration issue by explicitly specifying repository to scan
- Updated dev dependencies to resolve security vulnerabilities (markdownlint-cli2, glob, prettier)
- Replaced flaky timing assertion in performance tests with functional validation

---

## [2.2.0] - 2025-11-06

Autofix telemetry system and internal validation module implementation.

- Autofix telemetry system: structured decision tracking with confidence scores and heuristic contributions
- Telemetry capture, aggregation, and analysis capabilities
- Comprehensive test coverage (401 unit tests, 309 integration tests)
- Internal validation modules: config-loader, report-generator, source-processor

---

## [2.1.0] - 2025-11-06

Unicode regex patterns and distribution script internals.

- Unicode regex patterns for internationalized text validation (`UNICODE_LETTER_REGEX`, `UNICODE_UPPERCASE_REGEX`, `UPPERCASE_WORD_REGEX`)
- Documentation for false positive fixes from real-world repository testing

---

## [2.0.0] - 2025-10-30

ADR system established and postinstall hook implementation.

- ADR-001: Autofix safety strategy — see `docs/adr/adr-001-autofix-safety-strategy.md`
- Postinstall hook implementation for automatic build on git install

---

## [1.7.1] - 2025-10-30

Major refactoring of sentence-case rule, test expansion, and CI improvements.

- Consolidated shared heuristics (acronym detection, markup preservation, code span checking) into `shared-heuristics.js` to prevent behavioral drift
- Eliminated duplicate implementations of core detection logic
- Broke down monolithic `sentence-case-heading` rule (1,111 LOC) into composable modules: `case-classifier.js` (721 LOC), `fix-builder.js` (127 LOC), `token-extraction.js` (36 LOC); 78% faster concurrent test execution
- Comprehensive unit tests for autofix safety layer (568 tests)
- Unit tests for `sentence-case-heading` internal functions (1,244 tests across 4 files)
- Unit tests for shared heuristics module (210 tests)
- Enhanced architecture documentation with module organization and testing strategy
- ADR created for 2025 refactoring work
- Updated testing documentation with multi-layered testing strategy
- Updated rules documentation to reflect shared heuristics
- Updated agent handbook (`CLAUDE.md`) with new module structure
- Automated vulnerability scanning added to CI pipeline using `npm audit` and `osv-scanner`
- GitHub issue and pull request templates for standardized contributions
- Comprehensive semantic label system documentation in `.github/LABELS.md`
- Security policy documentation added in `SECURITY.md`

---

## [1.7.0] - 2025-09-17

Husky hooks, build safety improvements, and internal tooling.

- Strengthened code quality with comprehensive Husky pre-commit and pre-push hooks
- Improved build safety with a `prepare` script that detects build artifact drift
- Updated project roadmap to reflect completed tasks
- Added network test opt-in feature using the `RUN_NETWORK_TESTS` environment variable
- Comprehensive release checklist with semantic versioning guidance
- Corrected test snapshots to reflect resolved false positives in sentence-case validation

---

## [1.6.0] - 2025-09-17

Documentation restructure, Husky integration, and project tooling setup.

- Husky and lint-staged for automated pre-commit quality checks
- Comprehensive agent handbook (`CLAUDE.md`) for AI development assistance
- Project roadmap outlining future development milestones
- Auto-generated configuration documentation
- Restructured all documentation for improved clarity and consolidated setup guides
- Replaced `CONTRIBUTING.md` with `CLAUDE.md` to provide guidance for AI agent contributors

---

## [1.5.0] - 2025-06-28

Build automation with Husky pre-commit hook and directory restructuring.

- Automated rule compilation and staging with a new Husky pre-commit hook
- Migrated rule files to CommonJS and reorganized the project's directory structure

---

## [1.4.0] - 2025-06-28

Build script and test directory reorganization.

- Build script to automate the bundling and distribution of custom rules
- Improved project organization by moving all test files to a new `features/` directory
- Updated import paths and project structure to align with modern ESM conventions

---

## [1.3.0] - 2025-06-27

CI, documentation, and test tooling updates.

- `.github/workflows/ci.yml` updated
- `docs/explanations/test-fixtures.md` created — documents fixture conventions for contributors
- `docs/ROADMAP.md` updated to reflect completed items
- VS Code custom rules updated alongside rule changes

---

## [1.2.0] - 2025-06-26

Internal refactoring and test infrastructure modernization.

- Consolidated all special-cased terms and markdownlint configurations into shared modules for better consistency
- Modernized the test infrastructure

---

## [1.1.0] - 2025-06-06

Test directory reorganization.

- Reorganized the test directory and fixture structure for better clarity

---

## [1.0.0] - 2025-06-03

Dependency updates and documentation reorganization.

- Updated all major dependencies, including `markdownlint` and `Jest`
- Documentation structure was significantly reorganized

---

## [0.3.0] - 2025-06-03

Test suite migration to Jest and repository restructuring.

- Migrated the entire test suite to Jest
- Restructured the repository to improve organization and testability

---

## [0.2.2] - 2025-05-31

Comprehensive feature test suite established.

- New feature tests for `backtick-code-elements`: common-phrases, descriptive, filenames, proper-nouns
- New feature tests for `sentence-case`: bold-text, changelog patterns
- Unit tests expanded for both rules; shared `tests/helpers/test-helpers.js` extracted

---

## [0.2.1] - 2025-05-31

Test infrastructure restructured into layered directories.

- Test suite reorganized into `tests/features/`, `tests/helpers/`, `tests/integration/`, `tests/unit/` directories — previous flat layout made it hard to distinguish test types
- New fixtures for backtick-code-elements and sentence-case scenarios

---

## [0.2.0] - 2025-05-31

Test infrastructure setup.

- Created a `test-fixtures` directory to support unit tests and manual rule testing
- Migrated to a Jest-based test structure with shared test utilities

---

## [0.1.0] - 2025-05-30

Documentation structure established.

- Established the project documentation structure using the Diátaxis framework

[unreleased]: https://github.com/kynoptic/markdownlint-trap/compare/v2.8.0...HEAD
[2.8.0]: https://github.com/kynoptic/markdownlint-trap/compare/v2.7.0...v2.8.0
[2.7.0]: https://github.com/kynoptic/markdownlint-trap/compare/v2.6.0...v2.7.0
[2.6.0]: https://github.com/kynoptic/markdownlint-trap/compare/v2.5.0...v2.6.0
[2.5.0]: https://github.com/kynoptic/markdownlint-trap/compare/v2.4.0...v2.5.0
[2.4.0]: https://github.com/kynoptic/markdownlint-trap/compare/v2.3.0...v2.4.0
[2.3.0]: https://github.com/kynoptic/markdownlint-trap/compare/v2.2.0...v2.3.0
[2.2.0]: https://github.com/kynoptic/markdownlint-trap/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/kynoptic/markdownlint-trap/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/kynoptic/markdownlint-trap/compare/v1.7.1...v2.0.0
[1.7.1]: https://github.com/kynoptic/markdownlint-trap/compare/v1.7.0...v1.7.1
[1.7.0]: https://github.com/kynoptic/markdownlint-trap/compare/v1.6.0...v1.7.0
[1.6.0]: https://github.com/kynoptic/markdownlint-trap/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/kynoptic/markdownlint-trap/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/kynoptic/markdownlint-trap/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/kynoptic/markdownlint-trap/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/kynoptic/markdownlint-trap/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/kynoptic/markdownlint-trap/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/kynoptic/markdownlint-trap/compare/v0.3.0...v1.0.0
[0.3.0]: https://github.com/kynoptic/markdownlint-trap/compare/v0.2.2...v0.3.0
[0.2.2]: https://github.com/kynoptic/markdownlint-trap/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/kynoptic/markdownlint-trap/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/kynoptic/markdownlint-trap/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/kynoptic/markdownlint-trap/releases/tag/v0.1.0
