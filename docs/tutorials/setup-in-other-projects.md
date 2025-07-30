# Setting up markdownlint-trap in other projects

This guide explains how to configure `markdownlint-trap` custom rules in your project to work in both CLI and VS Code editor environments.

---

## Installation options

Since `markdownlint-trap` is **not published to npm** (it's a `private/internal` project), you need to make it available to your project using one of these methods:

### Option 1: npm link (for active development)

**Use this when**: You're actively developing markdownlint-trap rules and want changes to be immediately available in your other project.

First, in the `markdownlint-trap` project directory:

```bash
npm link
```

Then, in your other project directory:

```bash
npm link markdownlint-trap
```

**Note**: You'll need to run `npm run build` in the markdownlint-trap project whenever you modify rules.

### Option 2: Local file path dependency (for stable internal use)

**Use this when**: You want to use a specific local version without the overhead of `npm link`.

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

### Option 3: Git dependency (if hosted in a git repository)

**Use this when**: The markdownlint-trap project is available in a `git repository` (GitHub, GitLab, etc.).

Add to your `package.json`:

```json
{
  "dependencies": {
    "markdownlint-trap": "git+https://github.com/username/markdownlint-trap.git"
  }
}
```

Then run:

```bash
npm install
```

## Simple setup (two files needed)

Once you have `markdownlint-trap` available in your project, you only need these **two configuration files**:

### 1. `.markdownlint-cli2.jsonc` (for CLI linting)

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

### 2. `.vscode/settings.json` (for VS Code editor integration)

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
- **VS Code**: Rules will apply automatically if the [markdownlint extension](https://marketplace.visualstudio.com/items?itemName=DavidAnson.vscode-markdownlint) is installed and you reload the window.

 ---

## Active custom rules

The recommended configuration enables the following rules:

- `sentence-case-heading` - Enforces sentence case in headings (capitalizes only first word and proper nouns)
- `backtick-code-elements` - Requires backticks around code elements, file paths, and technical terms
- `no-bare-url` - Prevents bare URLs (requires proper markdown link syntax)
- `no-dead-internal-links` - Checks that internal links exist in the repository
- `no-literal-ampersand` - Requires "and" instead of "&" symbol

## Customizing rules

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

- ##### **Package not found**: If using `npm link` or a file path dependency, ensure the path is correct and run `npm install`
