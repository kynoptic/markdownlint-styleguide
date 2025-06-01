# markdownlint-clarity

Custom, clarity-focused rules for [markdownlint](https://github.com/DavidAnson/markdownlint).

## Project overview

**markdownlint-clarity** provides reusable, opinionated linting rules to enforce sentence case for headings and bold text, and inline code formatting.

This package is designed for easy integration with markdownlint and markdownlint-cli.

## Key features

- **Sentence case enforcement** for headings and bold text.
- **Inline code formatting** ensures backtick code elements are used properly.
- **Tested with Jest** ensures rules are working as expected.

## Installation and configuration in VSCode

To use these custom markdownlint rules in VSCode:

1. **Ensure you have a `.markdownlint.json` config file** in your project root (as shown above).
2. **Install the [markdownlint extension for VSCode](https://marketplace.visualstudio.com/items?itemName=DavidAnson.vscode-markdownlint)** if you haven't already.
3. **Configure VSCode to use your local config:**
   Create or update `.vscode/settings.json` in your project root with:

     ```json
     {
       "markdownlint.configFile": ".markdownlint.json"
     }
     ```

   This ensures VSCode uses your project's specific rules (including custom ones) when linting Markdown files.

4. ***Optional*: Point to custom rules directory:**
   If your custom rules are not picked up automatically, add this to `.vscode/settings.json`:

     ```json
     {
       "markdownlint.customRules": "./rules"
     }
     ```

Now, when you edit Markdown files in VSCode, the linter will apply your custom rules automatically.

## Custom rules

### `sentence-case-headings-bold`

Enforces sentence case for all headings and any bold text inside them.

❌ Incorrect:

```markdown
# This Is a Heading

A **Bold Statement** in a paragraph.
```

✅ Correct :

```markdown
# This is a heading

A **bold statement** in a paragraph.
```

### `backtick-code-elements`

Wraps filenames, functions, and paths in backticks for clarity. Detects filenames (e.g., `example.js`), directory paths (e.g., `src/components/`), and code keywords (e.g., `function`, `const`, `import`). Ignores descriptive documentation text and examples, as covered in fixtures and feature tests.

❌ Incorrect:

```markdown
Run setup.sh in the scripts folder.
```

✅ Correct:

```markdown
Run `setup.sh` in the `scripts` folder.
```

## Additional documentation

- [`rules/README.md`](./rules/README.md): Details on custom rules
- [`tests/README.md`](./tests/README.md): Test structure and usage
- [`scripts/README.md`](./scripts/README.md): Utility scripts and automation
- [`CHANGELOG.md`](./CHANGELOG.md): Release notes
