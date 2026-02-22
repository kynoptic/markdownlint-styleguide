# Contributing guide

This guide provides instructions for contributing to the `markdownlint-trap` project. Whether you're an AI agent or a human developer, these guidelines will help you get started.

## Project overview

`markdownlint-trap` is a custom `markdownlint` rule library designed to enforce specific documentation standards. It includes rules for sentence-case headings, backticked code elements, and bare URLs. The project is built with Node.js and ships native ES modules.

## Development setup

### Prerequisites

- Node.js v18+
- npm (included with Node.js)

### Installation

1. **Clone the repository:**

    ```bash
    git clone https://github.com/kynoptic/markdownlint-trap.git
    cd markdownlint-trap
    ```

2. **Install dependencies:**

    ```bash
    npm install
    ```

### Essential commands

- `npm test`: Run the Jest test suite.
- `npm run lint`: Run ESLint on the codebase.
- `npx markdownlint-cli2 "**/*.md"`: Lint markdown files.
- `DEBUG=markdownlint-trap* npm test`: Run tests with debug output.

### Test execution environment

Tests run against the **ES module source code** in `src/`. The project ships native ESM with no build step — source files are distributed directly. This means:

- No build step is required before running tests
- Tests validate the actual source code behavior
- Changes to `src/` files are immediately testable

## Project architecture

- **Source code:** ES Modules (ESM) in `src/`, distributed directly.
- **Testing:** Jest with a fixture-based approach.
- **Documentation:** Located in the `docs/` directory.

For more details, see the [architecture](./docs/architecture.md) and [testing guide](./docs/testing.md).

## Contributing workflow

1. **Create a feature branch:**

    ```bash
    git checkout -b my-new-feature
    ```

2. **Make your changes:** Implement your feature or bug fix.

3. **Write or update tests:** Add or modify tests in the `tests/` directory.

4. **Run tests and linting:**

    ```bash
    npm test
    npm run lint
    npx markdownlint-cli2 "**/*.md"
    ```

5. **Commit your changes:** Follow the [Conventional Commits specification](https://www.conventionalcommits.org/en/v1.0.0/).

6. **Push to your branch:**

    ```bash
    git push origin my-new-feature
    ```

7. **Create a pull request:** Open a pull request against the `main` branch.

## Coding guidelines

- Use ES modules compatible with Node.js v18+.
- Document all functions with JSDoc comments.
- Follow existing coding style and conventions.
- Write clear, descriptive commit messages following conventional commit format.

## Submitting a pull request

- Keep your changes focused and your pull requests small.
- Provide a clear and descriptive title and description for your pull request.
- Reference any related issues in your pull request description.

Thank you for contributing to `markdownlint-trap`!
