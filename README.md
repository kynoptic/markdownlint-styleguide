# markdownlint-trap

A collection of custom `markdownlint` rules designed to enforce specific documentation standards and best practices.

## Custom rules

This repository contains the following custom rules:

* **`sentence-case-heading` (SC001):** Enforces sentence case for all ATX headings (`#`). The first word must be capitalized, and the rest of the heading should be lowercase, with exceptions for acronyms, proper nouns, and the pronoun "I".
* **`backtick-code-elements` (BCE001):** Requires that code-like elements such as file names, directory paths, commands, and environment variables are enclosed in backticks.
* **`wt/no-bare-urls`:** Ensures that all URLs are enclosed in angle brackets (`<...>`) to prevent them from being rendered as raw, un-clickable links.

## Usage

To use these custom rules in another project, follow these steps:

1. **Copy the Rules:** Copy the compiled `.markdownlint-rules/` directory from this project into your target project's root.
2. **Copy the Configuration:** Copy the `.markdownlint-cli2.jsonc` file into your target project's root. This file is already configured to use the compiled `.cjs` rules from the `.markdownlint-rules/` directory.

Your `markdownlint` tool will now run these custom rules alongside the default ones.

## Development

This project uses ES Modules (ESM) for its source code, but the `markdownlint` VS Code extension and `markdownlint-cli2` expect rules to be in CommonJS format. To handle this, we use Babel to transpile the source code into `.cjs` files.

**Source files:** The original, human-readable rule definitions are located in `src/rules/`.

**Build process:** To transpile the ESM source files into CommonJS, run the following command:

```bash
npm run build
```

This command will:

1. Delete the old `.markdownlint-rules/` directory.
2. Run Babel to transpile the files from `src/rules/`.
3. Place the compiled, CommonJS-compatible files (with a `.cjs` extension) into the `.markdownlint-rules/` directory.

The `.markdownlint-rules/` directory is the artifact that should be distributed or copied to other projects. It is ignored by Git.

## Key features

* **Sentence case headings**: Enforces sentence case for all Markdown headings and list lead-ins.
* **Backticked code elements**: Ensures that code and file paths are enclosed in backticks.
* **Test-driven**: Developed with a full suite of fixture-based tests.
* **Detailed errors**: Provides clear messages to help resolve linting issues.

## Installation

To install `markdownlint-trap`, run the following command:

```bash
npm install markdownlint-trap --save-dev
```

### Requirements

* **Node.js**: Version `14` or higher. We recommend using `nvm` to manage Node.js versions:

  ```bash
  nvm install
  nvm use
  ```

* **markdownlint**: Version `0.38.0` or compatible.

## Usage

1. Add the custom rules to your `.markdownlint-cli2.jsonc` configuration file:

    ```json
    {
      "customRules": [
        "markdownlint-trap"
      ],
      "config": {
        "sentence-case-heading": true,
        "backtick-code-elements": true
      }
    }
    ```

2. Run `markdownlint-cli2` on your project:

    ```bash
    npx markdownlint-cli2 "**/*.md"
    ```

## Rules

This package includes the following rules:

* `sentence-case-heading`: Enforces sentence case in headings.
* `backtick-code-elements`: Enforces backticks around code elements.

For detailed documentation on each rule, see [`docs/reference/rules.md`](./docs/reference/rules.md).

## Testing

To run the test suite, use the following command:

```bash
npm test
```

For verbose output, use the `DEBUG` environment variable:

```bash
DEBUG=markdownlint-trap* npm test
```

## Project status

This project is under active development. Contributions and feedback are welcome.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

## Resources

* **Changelog**: [`CHANGELOG.md`](./CHANGELOG.md)
* **Rule documentation**: [`docs/reference/rules.md`](./docs/reference/rules.md)
* **Source code**: [GitHub](https://github.com/your-username/markdownlint-trap)
