# Contributing guide

Thank you for your interest in improving **markdownlint-trap**. Follow the steps below to set up the project, review the coding conventions, and submit pull requests.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Run the test suite:

   ```bash
   npm test
   ```

3. Lint Markdown files:

   ```bash
   npx markdownlint-cli2 "**/*.md"
   ```

## Coding conventions

- Use JavaScript ES modules targeting Node.js v14 or later.
- Document all public functions with JSDoc comments.
- Follow sentence case for headings and UI strings.
- Wrap file paths and inline code with backticks.
- See [`AGENTS.md`](../AGENTS.md) for detailed project guidelines.

## Pull request process

1. Create a new feature branch based on `main`.
2. Keep changes focused and describe them clearly in commit messages.
3. Run `npm test` and `npx markdownlint-cli2 "**/*.md"` before opening a pull request.
4. Reference relevant issues in the PR description when applicable.
5. After review, your changes will be merged into `main`.
