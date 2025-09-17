# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

---

## [1.7.0] - 2025-09-17

### ✨ Added

- Expanded casing dictionary with **50+ terms** for emerging tech (AI, ML, LLMs), modern frameworks (`Next.js`, SvelteKit), and cloud services (DynamoDB, Supabase).
- Enhanced `no-dead-internal-links` rule to support **Setext headings** (`---` and `===`).
- Introduced an `npm validate` script to check the development environment.
- Added a network test opt-in feature using the `RUN_NETWORK_TESTS` environment variable.

### 🚀 Enhanced

- Strengthened code quality with comprehensive **Husky pre-commit and pre-push hooks**.
- Improved build safety with a `prepare` script that detects build artifact drift.

### 🐞 Fixed

- Corrected test snapshots to reflect resolved false positives in sentence-case validation.
- Reduced false positives by removing generic phrases from the casing dictionary.

### 📚 Documentation

- Added a comprehensive **Release checklist** with semantic versioning guidance.
- Updated the project roadmap to reflect completed tasks.

---

## [1.6.0] - 2025-09-17

This release introduced three powerful new rules, configuration presets, and significant performance enhancements.

### ✨ Added

- **New rule**: `no-dead-internal-links` to validate internal file links and heading anchors.
- **New rule**: `no-literal-ampersand` to enforce replacing `&` with "and" in prose.
- **New rule**: `no-bare-urls` to ensure all URLs are formatted as markdown links.
- **Configuration presets**: `basic`, `recommended`, and `strict` for easier project setup.
- **Infrastructure**:
  - Added a robust **Autofix safety system** to prevent incorrect modifications.
  - Improved performance with a new caching system for large documents.
  - Implemented a configuration validation system that integrates with `markdownlint`.
  - Set up **Husky and lint-staged** for automated pre-commit quality checks.

### 🐞 Fixed

- Resolved a Mermaid diagram parsing error involving parentheses in node labels.
- Corrected line break rendering in Mermaid diagrams by replacing `\n` with `<br/>`.
- Fixed various violations in the `sentence-case-heading` rule, especially for bracketed headings and complex emojis.

### 🔄 Changed

- Restructured all documentation for improved clarity and consolidated setup guides.
- Replaced `CONTRIBUTING.md` with `CLAUDE.md` to provide guidance for AI agent contributors.

### 📚 Documentation

- Added a comprehensive **Agent handbook** for AI development assistance.
- Created a project roadmap outlining future development milestones.
- Published auto-generated configuration documentation.

---

## [1.5.0] - 2025-06-28

### ✨ Added

- Automated rule compilation and staging with a new Husky pre-commit hook.
- Exempted headings that start with inline code spans from sentence case rules.

### 🔄 Changed

- Improved the `sentence-case-heading` rule by consolidating all casing terms into a unified, expanded dictionary.
- Migrated rule files to CommonJS and reorganized the project's directory structure.

---

## [1.4.0] - 2025-06-28

### ✨ Added

- Added support for custom rules in a `.markdownlint-rules/` directory for easy extension.
- Included a build script to automate the bundling and distribution of custom rules.

### 🔄 Changed

- Improved project organization by moving all test files to a new `features/` directory.
- Updated `import paths` and project structure to align with modern ESM conventions.

---

## [1.3.0] - 2025-06-27

### ✨ Added

- Enhanced the `sentence-case` rule to **Autofix bolded list items**.
- Expanded the special-cased terms dictionary with more tech acronyms and brand names.

### 🐞 Fixed

- Improved regex patterns to avoid false positives for `host:port` formats, shell variables, and version numbers.

### 🔄 Changed

- Extended the `sentence-case` rule to validate the leading words of bolded list items.

---

## [1.2.0] - 2025-06-26

### ✨ Added

- Implemented the `no-bare-urls` rule with auto-fix capabilities.
- Implemented the `backtick-code-elements` rule with auto-fix.
- Enhanced `sentence-case-heading` rule to support user-configurable proper nouns.
- Added detection for LaTeX math and shell commands to avoid false positives in multiple rules.

### 🐞 Fixed

- Hardened custom rules against false positives for hyphens, tildes, and environment variables.
- Improved multi-word proper noun handling in the `sentence-case` rule.

### 🔄 Changed

- Consolidated all special-cased terms and markdownlint configurations into shared modules for better consistency.
- Renamed `no-bare-urls` to `wt-no-bare-urls` and modernized the test infrastructure.

---

## [1.1.0] - 2025-06-06

### ✨ Added

- Added the `backtick-code-elements` markdownlint rule.
- Implemented a debug logging system for easier troubleshooting.

### 🔄 Changed

- Simplified `sentence-case` rule logic and improved its handling of special cases.
- Reorganized the test directory and fixture structure for better clarity.

---

## [1.0.0] - 2025-06-03

### 💥 Breaking changes

- **Complete project restructuring**. The project was migrated to use ES Modules (`type: module`), making old `import` paths and rule structures invalid.
- Documentation structure was significantly reorganized.

### ✨ Added

- Initial stable release.
- Added the `sentence-case-heading` markdownlint rule.
- Updated all major dependencies, including `markdownlint` and `Jest`.

---

## [0.3.0] - 2025-06-03

### ✨ Added

- Published the initial package to `npm with` an `index.js` entry point.
- Enhanced the `sentence-case` rule to detect and handle ALL CAPS headings.

### 🐞 Fixed

- Prevented false positives for common abbreviations (e.g., `e.g.`, `i.e.`).
- Fixed issues with emoji-prefixed headings and bold text in the `sentence-case` rule.

### 🔄 Changed

- **Migrated the entire test suite to Jest**.
- Restructured the repository to improve organization and testability.

---

## [0.2.2] - 2025-05-31

### 🐞 Fixed

- Fixed false positives in `backtick-code-elements` for technology names with dot notation (e.g., `Node.js`).
- Improved the `sentence-case` rule to correctly handle short, bolded phrases used as labels.

---

## [0.2.1] - 2025-05-31

### 🐞 Fixed

- Fixed a false positive in the `backtick-code-elements` rule where code keywords were flagged inside descriptive markdown links.

---

## [0.2.0] - 2025-05-31

### ✨ Added

- Added alternative markdownlint configuration formats for improved flexibility.
- Created a `test-fixtures` directory to support unit tests and manual rule testing.

### 🔄 Changed

- Optimized the `backtick-code-elements` rule for better performance with precompiled regex patterns.
- Migrated to a Jest-based test structure with shared test utilities.

---

## [0.1.0] - 2025-05-30

### ✨ Added

- **Initial release** of `markdownlint-custom-rules`.
- Introduced `sentence-case-headings-bold` and `backtick-code-elements` rules.
- Established the project documentation structure using the Diátaxis framework.

[unreleased]: https://github.com/kynoptic/markdownlint-trap/compare/v1.7.0...HEAD
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
