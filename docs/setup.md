# Setup and usage

This guide shows how to add `markdownlint-trap` rules to another repository and run them with `markdownlint-cli2`.

## Install

```bash
npm install --save-dev markdownlint-trap markdownlint-cli2
```

## Configure

Create `.markdownlint-cli2.jsonc` in the root of your repo. Choose one of the following patterns.

### Option 1: Recommended preset (extends)

The easiest way to start. It enables all rules with sensible defaults.

```jsonc
{
  "config": {
    "extends": "markdownlint-trap/recommended-config.jsonc"
  },
  "globs": [
    "**/*.md",
    "!node_modules/**/*",
    "!dist/**/*"
  ]
}
```

You can override any setting via `config`. For example, to disable one rule:

```jsonc
{
  "config": {
    "extends": "markdownlint-trap/recommended-config.jsonc",
    "no-literal-ampersand": false
  }
}
```

### Option 2: Manual setup

Load the rules and enable them explicitly.

```jsonc
{
  "customRules": ["markdownlint-trap"],
  "config": {
    "default": true,
    "sentence-case-heading": true,
    "backtick-code-elements": true,
    "no-bare-url": true,
    "no-dead-internal-links": true,
    "no-literal-ampersand": true
  },
  "globs": [
    "**/*.md",
    "!node_modules/**/*",
    "!dist/**/*"
  ]
}
```

## Run

```bash
# Lint all markdown files
npx markdownlint-cli2 "**/*.md"

# Auto-fix where supported
npx markdownlint-cli2 --fix "**/*.md"
```

## CI usage

- Cache your package manager to speed up installs.
- Run `markdownlint-cli2` as a standalone step, or with `--fix` in pre-commit.
- Example GitHub Actions step:

```yaml
- name: Lint markdown
  run: npx markdownlint-cli2 "**/*.md"
```

## Tips

- Start with the preset, then override rules as needed.
- Scope `globs` to exclude generated artifacts (e.g., `!dist/**/*`).
- Use `--fix` locally; use non-fixing lint in CI for clarity.
