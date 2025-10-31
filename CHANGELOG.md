# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

---

## [2.0.0] - 2025-10-30

### Added

- Setup wizard (`npx markdownlint-trap init`) with interactive preset selection and configuration file generation.
- Diagnostics command (`npm run doctor`) to validate installation and configuration.
- Multi-project distribution system for deploying configurations across multiple projects with wildcard support.
- Postinstall hook to automatically build rules when installing from `git source`.
- Built-in support for standard all-caps terminology in `sentence-case-heading` rule:
  - SemVer terms: PATCH, MINOR, MAJOR, BREAKING
  - GitHub Markdown Alerts: NOTE, TIP, IMPORTANT, WARNING, CAUTION
  - Common technical term: SemVer
- Built-in support for multi-word product names in `sentence-case-heading` rule:
  - GitHub Products: GitHub Actions, GitHub Projects
- Built-in support for Conventional Commit multi-word phrases:
  - BREAKING Changes, npm Publishing
- Architecture decision record system in `docs/adr/` with ADR-001 documenting autofix safety strategy.

### Changed

- **Breaking**: Package `main` field now points to compiled output (`.markdownlint-rules/index.cjs`) instead of source (`src/index.js`).
  - `npm users`: No action required (published package includes built files).
  - Git source users: Build runs automatically via postinstall hook, or run `npm run build` manually.
- Improved error messages in doctor command to distinguish between missing modules and syntax errors.

### Fixed

- Reduced `backtick-code-elements` false positives for slash-containing text by 65-70%:
  - Added absolute Unix path detection (e.g., `/etc/hosts`, `/usr/local/bin`)
  - Implemented known directory prefix checking (e.g., `src/`, `docs/`, `tests/`)
  - Correctly identifies conceptual pairs like "Integration/E2E", "Value/Effort", "pass/fail" as prose, not paths
- Fixed `sentence-case-heading` false positives for Conventional Commit phrases:
  - "BREAKING Changes" in pull request templates
  - "npm Publishing" in release documentation

### Security

- Added path validation in distribution script to prevent directory traversal attacks.

---

## [1.7.1] - 2025-10-30

### Changed

- Consolidated shared heuristics (acronym detection, markup preservation, code span checking) into `shared-heuristics.js` to prevent behavioral drift between `sentence-case-heading` and `backtick-code-elements` rules.
- Improved consistency: PM2-style terms (containing numbers) are now correctly identified across all rules.
- Enhanced maintainability by eliminating duplicate implementations of core detection logic.
- Broke down monolithic `sentence-case-heading` rule (1,111 LOC) into composable modules for improved maintainability and 78% faster concurrent test execution:
  - `case-classifier.js` (721 LOC) - Text segment classification
  - `fix-builder.js` (127 LOC) - Autofix string generation
  - `token-extraction.js` (36 LOC) - Heading token parsing
- Added comprehensive unit tests for autofix safety layer (568 tests).
- Added unit tests for `sentence-case-heading` internal functions (1,244 tests across 4 files).
- Added unit tests for shared heuristics module (210 tests).
- Improved test coverage with intentional overlap between unit and integration tests for different bug classes.
- Enhanced architecture documentation with module organization and testing strategy.
- Created architectural decision record for 2025 refactoring work.
- Updated testing documentation with multi-layered testing strategy.
- Updated rules documentation to reflect shared heuristics.
- Updated agent handbook (`CLAUDE.md`) with new module structure.

### Added

- Automated vulnerability scanning to CI pipeline using `npm audit` and `osv-scanner`.
- GitHub issue and pull request templates for standardized contributions.
- Comprehensive semantic label system documentation in `.github/LABELS.md`.

### Security

- Added security policy documentation in `SECURITY.md`.

---

## [1.7.0] - 2025-09-17

### Added

- Expanded casing dictionary with 50+ terms for emerging tech (AI, ML, LLMs), modern frameworks (`Next.js`, SvelteKit), and cloud services (DynamoDB, Supabase).
- Enhanced `no-dead-internal-links` rule to support Setext headings (`---` and `===`).
- Introduced `npm validate` script to check the development environment.
- Added network test opt-in feature using the `RUN_NETWORK_TESTS` environment variable.
- Comprehensive release checklist with semantic versioning guidance.

### Changed

- Strengthened code quality with comprehensive Husky pre-commit and pre-push hooks.
- Improved build safety with a `prepare` script that detects build artifact drift.
- Updated project roadmap to reflect completed tasks.

### Fixed

- Corrected test snapshots to reflect resolved false positives in sentence-case validation.
- Reduced false positives by removing generic phrases from the casing dictionary.

---

## [1.6.0] - 2025-09-17

This release introduced three powerful new rules, configuration presets, and significant performance enhancements.

### Added

- New rule: `no-dead-internal-links` to validate internal file links and heading anchors.
- New rule: `no-literal-ampersand` to enforce replacing `&` with "and" in prose.
- New rule: `no-bare-urls` to ensure all URLs are formatted as markdown links.
- Configuration presets: `basic`, `recommended`, and `strict` for easier project setup.
- Robust autofix safety system to prevent incorrect modifications.
- Performance caching system for large documents.
- Configuration validation system that integrates with `markdownlint`.
- Husky and lint-staged for automated pre-commit quality checks.
- Comprehensive agent handbook (`CLAUDE.md`) for AI development assistance.
- Project roadmap outlining future development milestones.
- Auto-generated configuration documentation.

### Changed

- Restructured all documentation for improved clarity and consolidated setup guides.
- Replaced `CONTRIBUTING.md` with `CLAUDE.md` to provide guidance for AI agent contributors.

### Fixed

- Resolved Mermaid diagram parsing error involving parentheses in node labels.
- Corrected line break rendering in Mermaid diagrams by replacing `\n` with `<br/>`.
- Fixed various violations in the `sentence-case-heading` rule, especially for bracketed headings and complex emojis.

---

## [1.5.0] - 2025-06-28

### Added

- Automated rule compilation and staging with a new Husky pre-commit hook.
- Exempted headings that start with inline code spans from sentence case rules.

### Changed

- Improved the `sentence-case-heading` rule by consolidating all casing terms into a unified, expanded dictionary.
- Migrated rule files to CommonJS and reorganized the project's directory structure.

---

## [1.4.0] - 2025-06-28

### Added

- Support for custom rules in a `.markdownlint-rules/` directory for easy extension.
- Build script to automate the bundling and distribution of custom rules.

### Changed

- Improved project organization by moving all test files to a new `features/` directory.
- Updated `import paths` and project structure to align with modern ESM conventions.

---

## [1.3.0] - 2025-06-27

### Added

- Enhanced the `sentence-case` rule to autofix bolded list items.
- Expanded the special-cased terms dictionary with more tech acronyms and brand names.

### Changed

- Extended the `sentence-case` rule to validate the leading words of bolded list items.

### Fixed

- Improved regex patterns to avoid false positives for `host:port` formats, shell variables, and version numbers.

---

## [1.2.0] - 2025-06-26

### Added

- Implemented the `no-bare-urls` rule with auto-fix capabilities.
- Implemented the `backtick-code-elements` rule with auto-fix.
- Enhanced `sentence-case-heading` rule to support user-configurable proper nouns.
- Added detection for LaTeX math and shell commands to avoid false positives in multiple rules.

### Changed

- Consolidated all special-cased terms and markdownlint configurations into shared modules for better consistency.
- Renamed `no-bare-urls` to `wt-no-bare-urls` and modernized the test infrastructure.

### Fixed

- Hardened custom rules against false positives for hyphens, tildes, and environment variables.
- Improved multi-word proper noun handling in the `sentence-case` rule.

---

## [1.1.0] - 2025-06-06

### Added

- The `backtick-code-elements` markdownlint rule.
- Debug logging system for easier troubleshooting.

### Changed

- Simplified `sentence-case` rule logic and improved its handling of special cases.
- Reorganized the test directory and fixture structure for better clarity.

---

## [1.0.0] - 2025-06-03

### Added

- Initial stable release.
- The `sentence-case-heading` markdownlint rule.
- Updated all major dependencies, including `markdownlint` and `Jest`.

### Changed

- Complete project restructuring: migrated to use ES Modules (`type: module`), making old `import paths` and rule structures invalid.
- Documentation structure was significantly reorganized.

### Removed

- Support for old `import paths` and rule structures due to ES Module migration.

---

## [0.3.0] - 2025-06-03

### Added

- Published the initial package to `npm with` an `index.js` entry point.
- Enhanced the `sentence-case` rule to detect and handle ALL CAPS headings.

### Changed

- Migrated the entire test suite to Jest.
- Restructured the repository to improve organization and testability.

### Fixed

- Prevented false positives for common abbreviations (e.g., `e.g.`, `i.e.`).
- Fixed issues with emoji-prefixed headings and bold text in the `sentence-case` rule.

---

## [0.2.2] - 2025-05-31

### Fixed

- Fixed false positives in `backtick-code-elements` for technology names with dot notation (e.g., `Node.js`).
- Improved the `sentence-case` rule to correctly handle short, bolded phrases used as labels.

---

## [0.2.1] - 2025-05-31

### Fixed

- Fixed a false positive in the `backtick-code-elements` rule where code keywords were flagged inside descriptive markdown links.

---

## [0.2.0] - 2025-05-31

### Added

- Alternative markdownlint configuration formats for improved flexibility.
- Created a `test-fixtures` directory to support unit tests and manual rule testing.

### Changed

- Optimized the `backtick-code-elements` rule for better performance with precompiled regex patterns.
- Migrated to a Jest-based test structure with shared test utilities.

---

## [0.1.0] - 2025-05-30

### Added

- Initial release of `markdownlint-custom-rules`.
- Introduced `sentence-case-headings-bold` and `backtick-code-elements` rules.
- Established the project documentation structure using the Diátaxis framework.

[unreleased]: https://github.com/kynoptic/markdownlint-trap/compare/v2.0.0...HEAD
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
