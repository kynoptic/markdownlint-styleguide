# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] <!-- markdownlint-disable-line SC001 -->

## [1.3.0] - 2025-06-27

### Added

- Enhance sentence case validation for bold list items with improved regex and debug logging
- Enhance file path detection heuristics to reduce false positives from natural language
- Expand special-cased terms dictionary with tech acronyms and brand names
- Add sentence case tests and mark fixture coverage as complete
- Expand shared constants with additional tech terms, brands, and programming languages
- Add sentence case autofix for headings and list items with improved inline element handling

### Fixed

- Improve regex patterns to avoid false positives for host:port and shell variables
- Update wt-no-bare-urls fixture and correct heading
- Update autofix fixture annotation markers
- Improve version number detection in sentence case heading rule

### Changed

- Update sentence case in README and add test case annotations
- Add test fixtures explanation with examples and best practices
- Remove debug logging statements and delete unused test file
- Update roadmap by removing completed tasks and refining section headers
- Extend sentence case rule to include bolded list item lead-ins
- Improve README clarity and organization with expanded sections
- Wrap filenames in backticks for consistent code formatting

## [`1.2.0`] - 2025-06-26

### Added

- Implement `no-bare-urls` rule with auto-fix, tests, and documentation
- Add user-configurable proper nouns and technical terms to sentence-case-heading rule
- Add LaTeX math detection and improve backtick rule handling for shell commands
- Add file path regex validation and centralize ignored terms for backtick rule
- Add sentence case auto-fix (#57)
- Add backtick code element rule with auto-fix tests and fixtures
- Add Babel configuration

### Fixed

- Improve LaTeX math detection to avoid false positives with shell variables
- Improve environment variable detection in backtick rule
- Improve rule robustness for hyphens and tilde fences (#55)
- Harden custom rule checks (#53)
- Handle multi-word proper nouns in sentence case rule (#52)
- Add `npm` to ignored terms and normalize `VS Code` casing
- Refine path detection heuristics (#41)
- Remove unnecessary text suffix from code block language identifier
- Enable markdownlint autofix for `backtick-code-elements` (BCE001) rule
- Update backtick rule and tests (#56)
- Update rules and fixtures (#42)

### Changed

- Improved parameter validation for custom rules
- Enhanced detection of fenced code blocks with tildes
- Consolidate markdownlint configs and add proper noun exceptions
- Consolidate special-cased terms into shared constants module
- Improve technical term handling with case-sensitive dictionary
- Improve bare URL detection using `markdown-it`
- Rename `no-bare-urls` rule to `wt-no-bare-urls` and modernize test infrastructure
- Reorganize ignored terms into categories and add test coverage

### Documentation

- Restructure roadmap with clearer focus areas and prioritized tasks
- Add markdown formatting conventions (#40)
- Update agent guidelines (#39)
- Add folder READMEs (#38)
- Add missing JSDoc comments (#37)

## [`1.1.0`] - 2025-06-06

### Added

- Added backtick-code-elements markdownlint rule
- Added debug logging infrastructure (#8)

### Fixed

- Improved sentence case heading rule to handle special cases

### Changed

- Simplified sentence-case rule logic (#5)
- Reorganized tests directory structure (#29)
- Restructured test fixtures by outcome and consolidated rule fixtures (#33, #34, #36)

### Documentation

- Added project roadmap (#7)
- Added basic testing instructions (#12)
- Improved rule documentation (#9)
- Updated error messages docs and tests (#10)
- Listed all docs in docs README (#11)
- Clarified contributor guidelines (#32)

## [`1.0.0`] - 2025-06-03

### Added

- Added dedicated rules documentation file
- Added sentence-case-heading markdownlint rule

### Changed

- Reorganized project documentation structure
- Removed legacy code structure
- Updated project dependencies and structure
- Switched to ES modules with type: module in `package.json`
- Updated to latest markdownlint and markdownlint-cli2
- Updated Jest with experimental VM modules support

### Documentation

- Enhanced project documentation and test fixtures
- Updated markdownlint rule authoring guidelines
- Added validation markers to test fixtures
- Improved changelog formatting

### Breaking changes

- Complete restructuring of the project. Old `import` paths and rule structure are no longer valid
- Documentation structure has been significantly reorganized

## [`0.3.0`] - 2025-06-03

### Added

- Added `index.js` as package entry point
- Enhanced test helpers with `lintMarkdown` function
- Enhanced sentence-case rule with ALL CAPS detection
- Added feature tests for markdownlint rules
- Added alternative markdownlint configuration formats

### Fixed

- Fixed test helpers to work with new directory structure
- Prevented false positives for common abbreviations like e.g. and i.e.
- Corrected sentence-case rule and added comprehensive tests
- Improved handling of proper nouns and natural language in rules
- Fixed sentence-case rule for bold text detection
- Improved backtick-code-elements rule for common phrases
- Excluded version numbers in CHANGELOG headings from sentence case checking
- Added null checks for result in integration tests
- Fixed handling of emoji-prefixed headings in sentence-case rule

### Changed

- Improved repository structure with dedicated helpers directory
- Extracted backtick-code-elements helpers and added TypeScript types
- Enhanced rule documentation and error handling
- Restructured backtick-code-elements rule for testability
- Reorganized test files into proper directories
- Moved markdownlint config files to configs/
- Migrated to Jest-based test structure

### Documentation

- Added project stack definition for Windsurf
- Improved repository structure documentation
- Added comprehensive unit tests for backtick-code-elements-helpers
- Updated rules directory documentation
- Restructured `docs/README.md` using Diátaxis framework
- Added JSDoc comments to improve code documentation

## [`0.2.2`] - 2025-05-31

### Fixed

- Fixed false positives for technology names with dot notation (Node.js, `React.js`) in `backtick-code-elements` rule
- Improved detection of from when used as a preposition in natural language contexts
- Fixed false positive for short bold phrases used as labels in the `sentence-case` rule
- Improved sentence-case rule for more accurate bold text detection in paragraphs

### Added

- Added feature tests for proper nouns and common English words
- Added test fixtures for technology names, prepositions, and bold labels

### Documentation

- Added comprehensive reference documentation for components and interactions
- Added visual Mermaid diagrams for rule integration flows
- Simplified README with clearer rule examples and streamlined installation steps

## [`0.2.1`] - 2025-05-31

### Fixed

- Fixed false positives in `backtick-code-elements` rule for code keywords in descriptive bullet points with markdown links
- Improved exclusion logic for descriptive text in documentation

### Added

- Added feature tests for descriptive text exclusions in `backtick-code-elements` rule
- Added test fixtures to prevent regression of fixed false positives

### Documentation

- Added comprehensive README files to all test subfolders (`features`, `helpers`, `integration`, `unit`)
- Expanded existing READMEs with usage examples and cross-references

## [`0.2.0`] - 2025-05-31

### Added

- Added alternative markdownlint configuration formats for improved flexibility
- Added test fixtures for unit tests and manual rule testing
- Added README for `test-fixtures` directory to document purpose and usage

### Changed

- Optimized `backtick-code-elements` rule for better performance with precompiled regex patterns
- Updated markdownlint configuration format to use array format for custom rules
- Migrated to Jest-based test structure with shared test utilities
- Improved documentation formatting and clarity throughout the project
- Reorganized test files and moved `test-rules.md` to `fixtures` directory

### Fixed

- Fixed handling of emoji-prefixed headings in sentence-case rule
- Added null checks for result in integration tests
- Fixed handling of sentence case for list marker headings

## [`0.1.0`] - 2025-05-30

### Added

- Initial release of `markdownlint-custom-rules`.
- Includes custom rules such as `sentence-case-headings-bold` and `backtick-code-elements`.
- Added `index.js` to allow usage as an `npm` package.
- Implemented JSDoc comments for improved code understanding.
- Structured project documentation following the Diátaxis framework.
