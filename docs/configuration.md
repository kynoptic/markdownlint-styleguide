# Configuration reference

This document explains the configuration options available for markdownlint and the custom rules in this repository.

## `.markdownlint.json`

Example:

```jsonc
{
  // Disable MD204: No multiple consecutive blank lines
  "MD204": false,
  // Disable MD013: Line length
  "MD013": false,
  // Custom rules loaded from the rules directory
  "customRules": {
    // Enforce sentence case for headings
    "sentence-case": "./rules/sentence-case.js",
    // Enforce backticks for code elements
    "backtick-code-elements": "./rules/backtick-code-elements.js",
  },
  // Option for sentence-case rule: enforce bold text in headings
  "sentence-case-headings-bold": true,
  // Enable the backtick-code-elements rule
  "backtick-code-elements": true,
}
```

### Option descriptions

- **MD204**: Disables the rule that prevents multiple consecutive blank lines.
- **MD013**: Disables the rule that enforces a maximum line length.
- **customRules**: Points to custom rule files to extend markdownlint functionality.
  - `sentence-case`: Enforces sentence case for headings.
  - `backtick-code-elements`: Ensures code elements are wrapped in backticks.
- **sentence-case-headings-bold**: When `true`, enforces sentence case for bold text in headings.
- **backtick-code-elements**: Enables the backtick code elements rule.

## Adding new options

To add a new rule or option, update `.markdownlint.json` and document it here.
