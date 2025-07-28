# Configuration reference

This document provides comprehensive configuration options for all markdownlint-trap rules.

## Overview

markdownlint-trap rules can be configured in your `.markdownlint.jsonc` configuration file. Each rule accepts specific configuration options to customize its behavior.

## Configuration format

```json
{
  "default": true,
  "rule-name": {
    "option1": "value1",
    "option2": ["array", "of", "values"]
  }
}
```

## Rules

### Backtick-code-elements

**Aliases:** backtick-code-elements, BCE001

Ensures code elements are wrapped in backticks for proper formatting

**Examples:**

✅ **Valid:**

- Check the `config.json` file
- Use the `npm install` command

❌ **Invalid:**

- Check the `config.json` file
- Use the `npm install` command

**Configuration options:**

#### `ignoredTerms`

- **Type:** `string[]`
- **Default:** `[]`
- **Description:** Terms to ignore when checking for code element formatting
- **Example:** `[\"README\", \"LICENSE\"]`

#### `skipCodeBlocks`

- **Type:** `boolean`
- **Default:** `true`
- **Description:** Whether to skip validation inside code blocks

#### `skipMathBlocks`

- **Type:** `boolean`
- **Default:** `true`
- **Description:** Whether to skip validation inside math blocks (LaTeX)

**Example configuration:**

```json
{
  "backtick-code-elements": {
    "ignoredTerms": ["README", "LICENSE"]
  }
}
```

### No-bare-url

**Aliases:** no-bare-url, BU001

Bare URL used. Surround with < and >.

**Configuration options:**

#### `allowedDomains`

- **Type:** `string[]`
- **Default:** `[]`
- **Description:** Domain names that are allowed as bare URLs
- **Example:** `[\"localhost\", \"example.com\"]`

#### `skipCodeBlocks`

- **Type:** `boolean`
- **Default:** `true`
- **Description:** Whether to skip validation inside code blocks

**Example configuration:**

```json
{
  "no-bare-url": {
    "allowedDomains": ["localhost", "example.com"]
  }
}
```

### No-dead-internal-links

**Aliases:** no-dead-internal-links, DL001

Validates that internal links point to existing files

**Examples:**

✅ **Valid:**

- [Documentation](docs/README.md)
- [API Reference](api/index.md)

❌ **Invalid:**

- [Missing File](docs/missing.md)
- [Broken Link](nonexistent.md)

**Configuration options:**

#### `ignoredPaths`

- **Type:** `string[]`
- **Default:** `[]`
- **Description:** File paths to ignore when checking internal links
- **Example:** `[\"node_modules/**\", \"dist/**\"]`

#### `checkAnchors`

- **Type:** `boolean`
- **Default:** `false`
- **Description:** Whether to validate anchor links within documents

#### `allowedExtensions`

- **Type:** `string[]`
- **Default:** `[".md", ".markdown", ".html", ".htm"]`
- **Description:** File extensions to consider valid for internal links
- **Example:** `[\".md\", \".txt\", \".pdf\"]`

**Example configuration:**

```json
{
  "no-dead-internal-links": {
    "ignoredPaths": ["node_modules/**", "dist/**"],
    "allowedExtensions": [".md", ".txt", ".pdf"]
  }
}
```

### No-literal-ampersand

**Aliases:** no-literal-ampersand, NLA001

Replaces literal ampersands with "and" for better readability

**Examples:**

✅ **Valid:**

- APIs and database systems
- Use GitHub and VSCode

❌ **Invalid:**

- APIs & database systems
- Use GitHub & VSCode

**Configuration options:**

#### `exceptions`

- **Type:** `string[]`
- **Default:** `[]`
- **Description:** Specific phrases where ampersands are allowed
- **Example:** `[\"R&D\", \"Q&A\"]`

#### `skipCodeBlocks`

- **Type:** `boolean`
- **Default:** `true`
- **Description:** Whether to skip validation inside code blocks

#### `skipInlineCode`

- **Type:** `boolean`
- **Default:** `true`
- **Description:** Whether to skip validation inside inline code spans

**Example configuration:**

```json
{
  "no-literal-ampersand": {
    "exceptions": ["R&D", "Q&A"]
  }
}
```

### Sentence-case-heading

**Aliases:** sentence-case-heading, SC001

Enforces sentence case in headings while allowing specific exceptions

**Examples:**

✅ **Valid:**

- # Getting started with APIs

- # Working with JavaScript and HTML

❌ **Invalid:**

- # Getting Started With APIs

- # Working With JavaScript And HTML

**Configuration options:**

#### `specialTerms`

- **Type:** `string[]`
- **Default:** `["API", "APIs", "CSS", "HTML", "HTTP", "HTTPS", "JavaScript", "JSON", "REST", "SDK", "SQL", "URL", "URLs", "XML"]`
- **Description:** Terms that should maintain their exact casing in headings
- **Example:** `[\"API\", \"GitHub\", \"OAuth\"]`

#### `technicalTerms`

- **Type:** `string[]`
- **Description:** **Deprecated**: Use `specialTerms` instead

#### `properNouns`

- **Type:** `string[]`
- **Description:** **Deprecated**: Use `specialTerms` instead

**Example configuration:**

```json
{
  "sentence-case-heading": {
    "specialTerms": ["API", "GitHub", "OAuth"]
  }
}
```

## Global configuration

### Common patterns

**Disable specific rules:**

```json
{
  "default": true,
  "sentence-case-heading": false,
  "no-bare-urls": false
}
```

**Configure multiple rules:**

```json
{
  "default": true,
  "sentence-case-heading": {
    "specialTerms": ["API", "GitHub", "OAuth"]
  },
  "backtick-code-elements": {
    "ignoredTerms": ["README", "LICENSE"]
  },
  "no-bare-urls": {
    "allowedDomains": ["localhost", "example.com"]
  }
}
```

### Environment-specific configuration

**Development environment:**

```json
{
  "default": true,
  "no-dead-internal-links": {
    "ignoredPaths": ["node_modules/**", "dist/**", ".git/**"]
  }
}
```

**Documentation-focused:**

```json
{
  "default": true,
  "sentence-case-heading": {
    "specialTerms": ["API", "REST", "JSON", "HTTP", "HTTPS"]
  },
  "backtick-code-elements": {
    "ignoredTerms": ["README", "CHANGELOG", "LICENSE"]
  }
}
```

## Migration guide

### Deprecated options

Some configuration options have been deprecated in favor of more consistent naming:

| Rule | Deprecated Option | New Option | Migration |
|------|------------------|------------|-----------|
| `sentence-case-heading` | `technicalTerms` | `specialTerms` | Rename the option |
| `sentence-case-heading` | `properNouns` | `specialTerms` | Rename the option |

**Before:**

```json
{
  "sentence-case-heading": {
    "technicalTerms": ["API", "REST"],
    "properNouns": ["GitHub", "OAuth"]
  }
}
```

**After:**

```json
{
  "sentence-case-heading": {
    "specialTerms": ["API", "REST", "GitHub", "OAuth"]
  }
}
```

---

*This documentation was auto-generated from rule configuration schemas. Last updated: 2025-07-28*
