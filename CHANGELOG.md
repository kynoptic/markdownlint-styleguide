# Changelog

User-facing changes — new capabilities, behavior changes, fixes that affected usage.

## [Unreleased]

---

## [2.8.0] - 2026-02-22

Add incremental linting cache and reduce false positives across rules.

### Added

- Incremental linting with file-level caching to skip unchanged files on repeat runs

### Fixed

- Import regex now uses word boundaries to prevent false matches on partial identifiers
- English prefixes no longer trigger acronym detection in sentence-case headings
- Tilde-prefixed paths correctly detected as code units in backtick rule
- "skills" and "skill" treated as common words in sentence-case validation
- ALL-CAPS filenames in headings no longer flagged by sentence-case rule
- "PDFs" no longer flagged as unrecognized acronym plural

---

## [2.7.0] - 2026-02-20

New empty-list-items rule, per-rule autofix safety configuration, and reduced false positives.

### Added

- New `no-empty-list-items` rule to flag list items with no meaningful content
- Per-rule autofix safety configuration allowing custom confidence thresholds per rule
- Common special terms (e.g., technical abbreviations) added to recommended preset casing dictionary

### Fixed

- Sentence-case heading rule no longer flags digit-leading headings for capitalization
- Backtick code elements rule no longer flags English suffixes (e.g., "'s", "'d") on CLI flags

---

## [2.6.0] - 2026-02-11

Standardize preset defaults and expand casing dictionary.

### Added

- ADR, ADRs, and "GitHub Markdown Alerts" terms in the casing dictionary for correct sentence-case heading preservation

### Fixed

- Aligned list style defaults (MD004: dash, MD029: one) consistently across all three presets and their CLI/VS Code templates

---

## [2.5.0] - 2026-01-26

Autofix confidence system, machine-readable output, and setup wizard improvements.

### Added

- Three-tier autofix system with confidence-based categorization (auto-fix ≥0.7, needs-review 0.3–0.7, skip <0.3)
- Needs-review reporter for flagging ambiguous terms like "Word", "Go", "Swift" for human/AI verification
- Machine-readable JSON output for AI agent consumption
- Setup wizard `--all` flag to enable CI, scripts, and hooks in one command
- Setup wizard `--upgrade` flag to merge new config options while preserving customizations

### Fixed

- Sentence-case autofix now correctly preserves lowercase after multi-word special terms
- Reduced false positives for proper nouns, abbreviations, and code spans

---

## [2.4.0] - 2025-01-25

Identifier detection in backtick and sentence-case rules with false positive reductions.

### Added

- `snake_case` identifier detection in `backtick-code-elements` rule (e.g., `max_retries`, `user_name`, `fetch_data`)
- `camelCase` identifier detection in `backtick-code-elements` rule (e.g., `useEffect`, `useState`, `fetchData`)
- PascalCase identifier detection in `backtick-code-elements` rule (e.g., `MyComponent`, `HttpClient`, `XMLHttpRequest`)
- Code identifier preservation in `sentence-case-heading` rule to prevent incorrect lowercasing of programming constructs in headings

### Fixed

- Reduced false positives by exempting locale codes (en_US, zh_CN, ja_JP) from `snake_case` detection
- Reduced false positives by exempting brand names (iPhone, eBay, YouTube, LinkedIn) from `camelCase`/PascalCase detection
- Reduced false positives by exempting Mc/Mac surname patterns (McDonald, MacArthur) from identifier detection
- Improved placeholder detection and added documentation-related acronyms to reduce false positives

---

## [2.3.0] - 2025-12-09

New configuration options, native ESM distribution, and rule accuracy improvements.

### Added

- New `ignoreAfterEmoji` configuration option for `sentence-case-heading` rule to skip validation of headings following emoji prefixes
- New `placeholderPatterns` configuration option for `no-dead-internal-links` rule with word-boundary matching to customize placeholder detection patterns

### Changed

- Package entry point updated from `.markdownlint-rules/index.cjs` to `src/index.js` (native ESM) — update imports if referencing the package entry point directly
- Enhanced `backtick-code-elements` rule to distinguish domain names (like `example.com` in prose) from full URLs requiring backticks
- Improved placeholder detection in `no-dead-internal-links` using word boundaries to prevent false matches (e.g., "TODO" won't match "`PHOTODOC.md`")

### Fixed

- Reduced false positives in `sentence-case-heading` rule for bold text validation
- Fixed incorrect flagging of domain names in prose by `backtick-code-elements` rule

---

## [2.2.0] - 2025-11-06

External validation command, acronym-compound detection, and false positive reductions.

### Added

- New `npm run validate:external` command for validating rules against real-world markdown sources
- Configuration via `.markdownlint-trap-validation.jsonc` for specifying local files, directories, and GitHub repositories
- JSON and Markdown report generation with autofix safety statistics
- Enhanced acronym-compound detection in `sentence-case-heading` rule for patterns like "YAML-based", "API-driven", "HTML/CSS-based", "SQL/NoSQL-hybrid" with autofix suggestions
- Ambiguous term handling to reduce false positives for words that could be proper nouns or common nouns (e.g., "go", "rust", "word")
- Enhanced product name and timezone detection: timezone codes (UTC, GMT, EST, EDT, CST, CDT, MST, MDT, PST, PDT, AEST, AEDT, CET, CEST, JST, IST), product names (Auth0, Datadog, SendGrid, Pandoc, Microsoft Word), and technology terms (NoSQL, OAuth)

### Changed

- Improved `backtick-code-elements` rule accuracy with sentence boundary detection to prevent false positives on patterns like `computer.New` at sentence boundaries; excludes time ranges from network address detection

### Fixed

- Reduced false positives in `sentence-case-heading` for acronym-prefixed compounds
- Eliminated false positives for ambiguous terms in product/technology contexts
- Fixed incorrect flagging of valid sentence boundaries in `backtick-code-elements`

---

## [2.1.0] - 2025-11-06

Distribution improvements, Unicode support, and false positive reductions.

### Added

- Automated `package.json` bootstrapping for projects without Node.js setup — creates minimal config with lint scripts, runs `npm install`, preserves existing files, customizes project name from directory
- Global installation support with `npm link` integration in distribution script
- New installation scripts: `install-global.sh`, `link-to-projects.sh`, `unlink-from-projects.sh`
- Support for placeholder detection in `no-dead-internal-links` rule with `allowPlaceholders` configuration option

### Changed

- Enhanced `sentence-case-heading` rule with Unicode-aware emoji and internationalization support for accented, CJK, Arabic, Cyrillic, and other extended Unicode scripts
- Improved distribution script with directory creation support via `createDirs` option
- Rules now support both nested and direct configuration formats for better API compatibility
- Distribution now automatically creates local `node_modules/` symlinks for VS Code extension integration

### Fixed

- Reduced `backtick-code-elements` false positives for enumeration patterns (e.g., "Essential/Useful/Nice-to-have", "Value/Effort")
- Fixed false positives for BDD-style patterns (GIVEN/WHEN/THEN)
- Prevented incorrect flagging of WCAG contrast ratios (e.g., 4.5:1, 3:1)
- Fixed false positives for grammar pluralization patterns (e.g., "word(s)", "term(s)")
- Preserved multi-word special terms during autofix generation in `sentence-case-heading` rule
- Removed "breaking" and "breaking changes" from default casing dictionary to reduce false positives in general documentation

---

## [2.0.0] - 2025-10-30

Setup wizard, diagnostics, multi-project distribution, and built-in casing dictionary expansions.

### Added

- Setup wizard (`npx markdownlint-trap init`) with interactive preset selection and configuration file generation
- Diagnostics command (`npm run doctor`) to validate installation and configuration
- Multi-project distribution system for deploying configurations across multiple projects with wildcard support
- Rules build automatically when installing from git source
- Built-in support for standard all-caps terminology in `sentence-case-heading` rule: SemVer terms (PATCH, MINOR, MAJOR, BREAKING), GitHub Markdown Alerts (NOTE, TIP, IMPORTANT, WARNING, CAUTION), and SemVer
- Built-in support for multi-word product names: GitHub Actions, GitHub Projects
- Built-in support for Conventional Commit multi-word phrases: BREAKING Changes, npm Publishing

### Changed

- **Breaking**: Package `main` field now points to compiled output (`.markdownlint-rules/index.cjs`) instead of source (`src/index.js`); npm users need no action — git source users should run `npm run build` manually or rely on the postinstall hook
- Improved error messages in `npm run doctor` to distinguish between missing modules and syntax errors

### Fixed

- Reduced `backtick-code-elements` false positives for slash-containing text by 65–70%: absolute Unix paths, known directory prefixes (e.g., `src/`, `docs/`), and conceptual pairs like "Integration/E2E" and "pass/fail" are recognized as prose
- Fixed `sentence-case-heading` false positives for Conventional Commit phrases: "BREAKING Changes" and "npm Publishing"

### Security

- Added path validation in distribution script to prevent directory traversal attacks

---

## [1.7.1] - 2025-10-30

Rule consistency improvement for PM2-style terms.

### Changed

- PM2-style terms (containing numbers) are now correctly identified consistently across all rules

---

## [1.7.0] - 2025-09-17

Expanded casing dictionary, Setext heading support, and false positive reductions.

### Added

- Expanded casing dictionary with 50+ terms for emerging tech (AI, ML, LLMs), modern frameworks (`Next.js`, SvelteKit), and cloud services (DynamoDB, Supabase)
- Enhanced `no-dead-internal-links` rule to support Setext headings (`---` and `===`)
- `npm validate` script to check the development environment

### Fixed

- Reduced false positives by removing generic phrases from casing dictionary

---

## [1.6.0] - 2025-09-17

Three new rules, configuration presets, autofix safety, and performance enhancements.

### Added

- New rule: `no-dead-internal-links` to validate internal file links and heading anchors
- New rule: `no-literal-ampersand` to enforce replacing `&` with "and" in prose
- New rule: `no-bare-urls` to ensure all URLs are formatted as markdown links
- Configuration presets: `basic`, `recommended`, and `strict` for easier project setup
- Robust autofix safety system to prevent incorrect modifications
- Performance caching system for large documents
- Configuration validation system that integrates with `markdownlint`

### Fixed

- Resolved Mermaid diagram parsing error involving parentheses in node labels
- Corrected line break rendering in Mermaid diagrams by replacing `\n` with `<br/>`
- Fixed various violations in the `sentence-case-heading` rule, especially for bracketed headings and complex emojis

---

## [1.5.0] - 2025-06-28

Sentence-case improvements and casing dictionary consolidation.

### Added

- Exempted headings that start with inline code spans from sentence case rules

### Changed

- Improved the `sentence-case-heading` rule by consolidating all casing terms into a unified, expanded dictionary

---

## [1.4.0] - 2025-06-28

Custom rules directory support.

### Added

- Support for custom rules in a `.markdownlint-rules/` directory for easy extension

---

## [1.3.0] - 2025-06-27

Sentence-case autofix for bolded list items and false positive reductions.

### Added

- Enhanced the `sentence-case` rule to autofix bolded list items
- Expanded the special-cased terms dictionary with more tech acronyms and brand names

### Changed

- Extended the `sentence-case` rule to validate the leading words of bolded list items

### Fixed

- Improved regex patterns to avoid false positives for `host:port` formats, shell variables, and version numbers

---

## [1.2.0] - 2025-06-26

New rules, configurable proper nouns, and false positive reductions.

### Added

- Implemented the `no-bare-urls` rule with auto-fix capabilities
- Implemented the `backtick-code-elements` rule with auto-fix
- Enhanced `sentence-case-heading` rule to support user-configurable proper nouns
- Added detection for LaTeX math and shell commands to avoid false positives in multiple rules

### Changed

- Renamed `no-bare-urls` to `wt-no-bare-urls` — update rule references in configuration files

### Fixed

- Hardened custom rules against false positives for hyphens, tildes, and environment variables
- Improved multi-word proper noun handling in the `sentence-case` rule

---

## [1.1.0] - 2025-06-06

New backtick-code-elements rule and sentence-case improvements.

### Added

- The `backtick-code-elements` markdownlint rule
- Debug logging system for easier troubleshooting

### Changed

- Simplified `sentence-case` rule logic and improved its handling of special cases

---

## [1.0.0] - 2025-06-03

Initial stable release with ES Module migration.

### Added

- Initial stable release
- The `sentence-case-heading` markdownlint rule

### Changed

- **Breaking**: Migrated to ES Modules (`type: module`) — old import paths and rule structures are no longer valid

### Removed

- Support for old import paths and rule structures due to ES Module migration

---

## [0.3.0] - 2025-06-03

npm publication and ALL CAPS heading detection.

### Added

- Published the initial package to npm with an `index.js` entry point
- Enhanced the `sentence-case` rule to detect and handle ALL CAPS headings

### Fixed

- Prevented false positives for common abbreviations (e.g., `e.g.`, `i.e.`)
- Fixed issues with emoji-prefixed headings and bold text in the `sentence-case` rule

---

## [0.2.2] - 2025-05-31

False positive fixes for dot notation and bolded phrase detection.

### Fixed

- Fixed false positives in `backtick-code-elements` for technology names with dot notation (e.g., `Node.js`)
- Improved the `sentence-case` rule to correctly handle short, bolded phrases used as labels

---

## [0.2.1] - 2025-05-31

False positive fix for code keywords inside markdown links.

### Fixed

- Fixed a false positive in the `backtick-code-elements` rule where code keywords were flagged inside descriptive markdown links

---

## [0.2.0] - 2025-05-31

Configuration format flexibility and performance improvement.

### Added

- Alternative markdownlint configuration formats for improved flexibility

### Changed

- Optimized the `backtick-code-elements` rule for better performance with precompiled regex patterns

---

## [0.1.0] - 2025-05-30

Initial release.

### Added

- Initial release of `markdownlint-custom-rules`
- Introduced `sentence-case-headings-bold` and `backtick-code-elements` rules

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
