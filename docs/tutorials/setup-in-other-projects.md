# Setting up markdownlint-trap in other projects

This guide explains how to configure `markdownlint-trap` custom rules in your project to work in both CLI and VS Code editor environments.

## Quick Start: Basic Configuration

Once `markdownlint-trap` is available in your `node_modules` directory (see Installation Options below), you can configure your project to use it.

### Required files

#### 1. `.markdownlint-cli2.jsonc`

Configuration for CLI tools (markdownlint-cli2):

```jsonc
{
  "config": {
    "extends": "markdownlint-trap/recommended-config.jsonc"
  },
  "globs": [
    "**/*.md",
    "!node_modules/**/*"
  ]
}
```

#### 2. `.vscode/settings.json` (for VS Code users)

Optional workspace settings for the VS Code markdownlint extension:

```json
{
  "markdownlint.customRules": [
    "markdownlint-trap"
  ],
  "markdownlint.config": {
    "extends": "markdownlint-trap/recommended-config.jsonc"
  }
}
```

### Usage

- **CLI**: Run `npx markdownlint-cli2`
- **VS Code**: Rules will apply automatically if the [markdownlint extension](https://marketplace.visualstudio.com/items?itemName=DavidAnson.vscode-markdownlint) is installed.

---

## Installation Options

Since `markdownlint-trap` is not published to npm, you have several options for getting it into your project.

### Option 1: npm link (recommended for development)

In the `markdownlint-trap` project directory:
```bash
npm link
```

In your other project directory:
```bash
npm link markdownlint-trap
```

### Option 2: Local file path dependency

Add to your `package.json`:
```json
{
  "dependencies": {
    "markdownlint-trap": "file:../path/to/markdownlint-trap"
  }
}
```

Then run:
```bash
npm install
```

### Option 3: Git dependency

Add to your `package.json`:
```json
{
  "dependencies": {
    "markdownlint-trap": "git+https://github.com/username/markdownlint-trap.git"
  }
}
```

### Option 4: Copy rules directly

This method doesn't use the `markdownlint-trap` package directly but copies its rules and configuration. You would need to update the configuration files to point to the copied rule files. See the original `setup-in-other-projects.md` for more details on this advanced approach if needed.

## Active Custom Rules

The recommended configuration enables the following rules:

- `sentence-case-heading` - Enforces sentence case in headings (capitalizes only first word and proper nouns)
- `backtick-code-elements` - Requires backticks around code elements, file paths, and technical terms
- `no-bare-url` - Prevents bare URLs (requires proper markdown link syntax)
- `no-dead-internal-links` - Checks that internal links exist in the repository
- `no-literal-ampersand` - Requires "and" instead of "&" symbol

## Customizing Rules

You can customize rule behavior by overriding specific rules in your `.markdownlint-cli2.jsonc` or `markdownlint.config` object:

```jsonc
{
  "config": {
    "extends": "markdownlint-trap/recommended-config.jsonc",
    "sentence-case-heading": {
      "properNouns": ["JavaScript", "GitHub", "YourCustomProperNoun"]
    }
  }
}
```

For detailed configuration options, see the [configuration reference](../reference/rules.md).

## Troubleshooting

- **Custom rules not working in VS Code**: Reload the VS Code window and ensure the markdownlint extension is enabled.
- **CLI errors**: Verify `.markdownlint-cli2.jsonc` is valid JSON and that `markdownlint-trap` exists in `node_modules`.
- **Package not found**: If using `npm link` or a file path dependency, ensure the path is correct and run `npm install`.
