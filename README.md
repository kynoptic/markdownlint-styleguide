# markdownlint custom rules

Custom, shareable rules for [markdownlint](https://github.com/DavidAnson/markdownlint), a Node.js lint tool for Markdown/CommonMark files.

## Key features

- 🛡️ `sentence-case-headings-bold`: Enforce sentence case for headings and bold text
- 🔤 `backtick-code-elements`: Require code elements to be wrapped in backticks
- 📚 Well-documented code with comprehensive JSDoc comments
- ✅ Extensive test coverage with Jest
- 🧩 Easy to extend with new rules

## Installation

```bash
npm install --save-dev markdownlint markdownlint-custom-rules
# or clone this repo if using custom rules directly
```

## Usage

### Using as a package

```javascript
// In your markdownlint configuration
const customRules = require("markdownlint-custom-rules");

module.exports = {
  "customRules": customRules,
  "sentence-case-headings-bold": true,
  "backtick-code-elements": true
  // other markdownlint configuration
};
```

### Using directly from the repository

Follow these steps to use the rules directly:

**Step 1:** Clone this repo or copy the `rules/` directory into your project.

**Step 2:** Configure `.markdownlint.json` to use the custom rules:

```jsonc
{
  "customRules": {
    "sentence-case": "./rules/sentence-case.js",
    "backtick-code-elements": "./rules/backtick-code-elements.js"
  },
  "sentence-case-headings-bold": true,
  "backtick-code-elements": true
}
```

**Step 3:** Run markdownlint:

```bash
npx markdownlint "**/*.md"
```

## Project structure

```text
markdownlint-rules/
├── rules/           # Custom markdownlint rules
│   └── README.md    # Rule documentation
├── tests/           # Tests for custom rules
│   └── README.md    # Test documentation
├── docs/            # Additional documentation
│   ├── tutorials/   # Getting started tutorials
│   ├── how-to/      # How-to guides
│   ├── reference/   # Reference documentation
│   └── explanations/# Conceptual explanations
├── scripts/         # Utility scripts
├── index.js         # Main entry point
├── package.json
├── jest.config.js
├── eslint.config.js
├── LICENSE
└── README.md
```

## Available rules

### sentence-case-headings-bold

Enforces sentence case for headings and bold text instead of title case.

**Example:**

```markdown
# This Is Title Case (incorrect)
# This is sentence case (correct)

Some text with **Title Case Bold Text** (incorrect)
Some text with **bold text in sentence case** (correct)
```

### backtick-code-elements

Requires filenames, directory paths, and code elements to be wrapped in backticks.

**Example:**

```markdown
Use const instead of var. (incorrect)
Use `const` instead of `var`. (correct)

Check the src/components/ directory. (incorrect)
Check the `src/components/` directory. (correct)

Open example.js file. (incorrect)
Open `example.js` file. (correct)
```

## Development

### Adding new rules

1. Create a new rule file in the `rules` directory.
2. Export a rule object with a `names` array and a `description` string.
3. Implement the rule logic in the function.
4. Add tests in the `tests/rules` directory.
5. Update documentation for the new rule.

### Testing

Run the test suite:

```bash
npm test
```

## Resources

- [Configuration Reference](docs/reference/configuration-reference.md)
- [Rules Documentation](rules/README.md)
- [Tests Documentation](tests/README.md)
- [markdownlint documentation](https://github.com/DavidAnson/markdownlint)

## License

[MIT](LICENSE)
