<!-- markdownlint-disable-next-line sentence-case-heading -->
# markdownlint-trap

A collection of custom rules for markdownlint that enforce consistent Markdown styling and formatting standards.

## Key features

- **Sentence case heading rule** (`sentence-case-heading`) – Ensures headings follow sentence case style (only first word capitalized)
- Test-driven development approach with comprehensive fixture-based testing
- Detailed error messages to help users understand and fix violations
- Smart detection of acronyms, proper nouns, and code elements

## Installation

```bash
npm install markdownlint-trap
```

### Requirements

- Node.js (v14 or higher)
- markdownlint (v0.38.0 or compatible)

## Usage

### Custom rules

Add the custom rules to your `.markdownlint-cli2.jsonc` file:

```json
{
  "customRules": [
    "markdownlint-trap"
  ],
  "config": {
    "sentence-case-heading": true
  }
}
```

### Run with custom rules

```bash
npx markdownlint-cli2 "**/*.md"
```

## License and attribution

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Resources

- [Rule definitions](./docs/rules.md) – Detailed rule documentation
- [Tests](./tests/) – Test fixtures and examples
- [CHANGELOG.md](./CHANGELOG.md) – Version history and changes
