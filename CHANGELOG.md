# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [`0.2.2`] - 2025-05-31

### Fixed

- Fixed false positives for technology names with dot notation (`Node.js`, `React.js`) in `backtick-code-elements` rule
- Improved detection of `from` when used as a preposition in natural language contexts
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
- Added `index.js` to allow usage as an npm package.
- Implemented JSDoc comments for improved code understanding.
- Structured project documentation following the Diátaxis framework.
