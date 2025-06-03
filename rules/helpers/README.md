# Rule helpers

This directory contains helper functions and utilities for markdownlint-trap rules.

## Contents

- `backtick-code-elements-helpers.js`: Helper functions for the backtick-code-elements rule, including:
  - Detection utilities for common file names, technical terms, and code elements
  - Exclusion logic for special cases and exceptions
  - Configuration option handling

## Purpose

These helper modules separate core rule logic from utility functions to:

- Improve code organization and maintainability
- Enable better unit testing of individual components
- Allow reuse of common functionality across rules

## Usage

Helper modules are imported by their respective rules:

```javascript
const { 
  isCommonDocFilename,
  isTechNameDotJs,
  // other helpers...
} = require("./helpers/backtick-code-elements-helpers");
```

## Related resources

- [Rules documentation](../README.md): Details on the custom rules that use these helpers
- [Tests](../../tests/unit/backtick-code-elements-helpers.test.js): Unit tests for helper functions
