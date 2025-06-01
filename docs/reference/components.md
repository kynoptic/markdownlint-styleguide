# Components

## Core components

### Custom rules

- `rules/sentence-case.js`: Enforces sentence case in headings and bold text instead of title case or ALL CAPS.
- `rules/backtick-code-elements.js`: Ensures code elements like filenames, directory paths, and code snippets are properly wrapped in backticks.

### Configuration providers

- `configs/markdownlint.js`: Provides a ready-to-use markdownlint configuration that enables the custom rules.
- `configs/markdownlint-absolute.js`: Similar to `markdownlint.js` but uses absolute paths to load the rules, ensuring they're found regardless of the working directory.

### Entry point

- `index.js`: The main entry point that exports all custom rules as an array for use in markdownlint configurations.

## Configuration files

### Local configuration

- `.markdownlint.json`: Configuration file for the markdownlint library, enabling custom rules for this project.
- `.markdownlint-cli2.jsonc`: Configuration file for the markdownlint-cli2 command-line tool, with enhanced features over the original CLI.

### Editor integration

- `.vscode/settings.json`: Configures VSCode to use the local `.markdownlint.json` file for markdown linting.

## Testing infrastructure

### Test framework

- `jest.config.js`: Configures Jest for running tests, including test matching patterns and coverage thresholds.

### Test categories

- `tests/unit/`: Contains unit tests for individual rule functions.
- `tests/features/`: Contains feature tests that validate rule behavior in real-world scenarios.
- `tests/helpers/`: Contains helper functions for testing, like `testRule` and `lintMarkdown`.
- `tests/fixtures/`: Contains test fixtures and sample markdown files.

### Test helpers

- `tests/helpers/test-helpers.js`: Provides utility functions for running markdownlint tests with custom rules.

## Development tools

### Code quality

- `eslint.config.js`: Configures ESLint for linting JavaScript files.

### Project management

- `package.json`: Defines dependencies, scripts, and project metadata.
- `scripts/`: Contains utility scripts for project maintenance and automation.
