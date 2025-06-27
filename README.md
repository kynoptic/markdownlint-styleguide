# markdownlint-trap

A collection of custom rules for `markdownlint` that enforce consistent Markdown styling and formatting standards.

## Key features

- **Sentence case headings**: Enforces sentence case for all Markdown headings and list lead-ins.
- **Backticked code elements**: Ensures that code and file paths are enclosed in backticks.
- **Test-driven**: Developed with a full suite of fixture-based tests.
- **Detailed errors**: Provides clear messages to help resolve linting issues.

## Installation

To install `markdownlint-trap`, run the following command:

```bash
npm install markdownlint-trap --save-dev
```

### Requirements

- **Node.js**: Version `14` or higher. We recommend using `nvm` to manage Node.js versions:

  ```bash
  nvm install
  nvm use
  ```

- **markdownlint**: Version `0.38.0` or compatible.

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

- `sentence-case-heading`: Enforces sentence case in headings.
- `backtick-code-elements`: Enforces backticks around code elements.

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

- **Changelog**: [`CHANGELOG.md`](./CHANGELOG.md)
- **Rule Documentation**: [`docs/reference/rules.md`](./docs/reference/rules.md)
- **Source Code**: [GitHub](https://github.com/your-username/markdownlint-trap)
