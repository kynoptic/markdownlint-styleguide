# Project architecture

This document describes the technology stack, coding conventions, and architecture of the `markdownlint-trap` project.

## Technology stack

- **Language**: JavaScript (ES Modules)
- **Runtime**: Node.js
- **Testing framework**: Jest
- **Linting**: ESLint
- **Documentation**: JSDoc

## Architecture

The project is organized as a `markdownlint` plugin that provides custom rules for markdown linting.

- **Custom rules**: Located in the `src/rules/` directory, each rule is implemented as a separate JavaScript module.
- **Library code**: General utilities and the package entry point are in the `src/` directory.
- **Testing**: The `tests/` directory contains fixture-based tests that use annotated markdown files to validate rule behavior.
- **Documentation**: The `docs/` directory contains all project documentation, organized according to the Diátaxis framework.

## Coding conventions

- **Module system**: ES Modules (`import`/`export`).
- **Type annotations**: JSDoc style comments.
- **Naming convention**: `camelCase` for variables and functions, `PascalCase` for classes, and `UPPER_SNAKE_CASE` for constants.

## Development workflow

1. **Rule development**: Implement rule logic in a dedicated module in the `src/rules/` directory.
2. **Testing**: Create fixture files with examples of valid and invalid content, and write tests that verify rule behavior against those fixtures.
3. **Documentation**: Update the rule documentation in `docs/reference/rules.md` and ensure the main `README.md` reflects the current features and usage.

## Integration points

- **`markdownlint`**: Custom rules integrate with the `markdownlint` library.
- **VSCode**: Rules can be used within VSCode via the `markdownlint` extension.
- **CI/CD**: The test suite runs in a CI environment to validate changes.
