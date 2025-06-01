# Test fixtures

This folder contains sample markdown files and related assets used for testing markdownlint-clarity custom rules.

## Available fixtures

- `sentence-case-sample.md`: Sample markdown file with various heading and bold text examples for testing the sentence-case-headings-bold rule.
- `backtick-code-elements-sample.md`: Sample markdown file with filenames, directory paths, code elements, and URLs for testing the backtick-code-elements rule.
- `test-rules.md`: General example markdown file used for manual testing and demonstrations.

## Usage

These fixtures are referenced by tests in the `tests/unit/` and `tests/integration.test.js` files to verify rule behavior against real-world markdown content. They provide consistent test cases that cover various edge cases and scenarios for each rule.
