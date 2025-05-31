# markdownlint-rules

Custom, shareable rules for [markdownlint](https://github.com/DavidAnson/markdownlint), a Node.js lint tool for Markdown/CommonMark files. This project provides a set of rules to help maintain consistency and quality in your Markdown documentation.

## Key features

- 🛡️ **`sentence-case-headings-bold`**: Enforces sentence case for headings and bold text.
- 🔤 **`backtick-code-elements`**: Requires code elements (like filenames, paths, and inline code) to be wrapped in backticks.
- 📦 Easy to integrate into any project using `markdownlint`.
- 🔧 Configurable to fit your project's specific needs.

## Using these rules in your project

To use these custom rules in your own repository, follow these steps:

### 1. Installation

First, install `markdownlint`, `markdownlint-cli` (for command-line use), and this rules package (`markdownlint-rules`) as development dependencies in your project:

```bash
npm install --save-dev markdownlint markdownlint-cli markdownlint-rules
# or
yarn add --dev markdownlint markdownlint-cli markdownlint-rules
```

### 2. Configuration

Create or update your `markdownlint` configuration file in the root of your project. The most common configuration file is `.markdownlint.json`.

To use the rules from this package, add `markdownlint-rules` to the `extends` property in your configuration file. This will load all the custom rules defined in this package and their default configurations.

**Example `.markdownlint.json`:**

```json
{
  "extends": "markdownlint-rules",
  // You can override specific rules or built-in markdownlint rules here
  // For example, to disable the default line length rule (MD013):
  "MD013": false,
  // To specifically enable or disable one of the custom rules (if needed, though 'extends' usually handles this):
  // "sentence-case-headings-bold": true,
  // "backtick-code-elements": true
}
```

Alternatively, if you prefer a JavaScript configuration file (e.g., `.markdownlint.js` or `markdownlint.config.js`):

```javascript
module.exports = {
  "extends": "markdownlint-rules",
  // Overrides
  "MD013": false,
};
```

### Advanced: Manual configuration (if not using `extends`)

If you choose not to use `extends` or need more granular control, you can load the rules manually. This typically involves `require`-ing the package in a JavaScript configuration file (e.g., `.markdownlint.js` or `markdownlint.config.js`).

**Example `.markdownlint.js`:**

```javascript
const customRulesPackage = require("markdownlint-rules"); // Ensure 'markdownlint-rules' is the correct package name

module.exports = {
  // Pass the rule implementations to the customRules property.
  // This assumes 'markdownlint-rules' package exports an array of rule objects, possibly via an 'index.js'.
  "customRules": customRulesPackage.rules || customRulesPackage,

  // Then, enable and configure specific rules by their IDs/names
  "sentence-case-headings-bold": true,
  "backtick-code-elements": true,

  // You can also include standard markdownlint rules and configurations
  "MD013": false // Example: disable line length rule
};
```

*(Note: The exact structure for `customRulesPackage.rules` depends on how the `index.js` of the `markdownlint-rules` package exports its rules. The `extends: "markdownlint-rules"` method is generally simpler and recommended when available.)*

### 3. Linting your files

Once configured, you can lint your Markdown files using the `markdownlint-cli`:

```bash
npx markdownlint "**/*.md"
# or, to attempt to fix fixable issues:
# npx markdownlint --fix "**/*.md"
```

You can also add this as a script in your `package.json`:

```json
{
  "scripts": {
    "lint:md": "markdownlint \"**/*.md\"",
    "lint:md:fix": "markdownlint --fix \"**/*.md\""
  }
}
```

Then run:

```bash
npm run lint:md
# or
yarn lint:md
```

## Available custom rules

This package currently includes the following custom rules:

### `sentence-case-headings-bold`

- **ID**: `sentence-case-headings-bold` (Rule names used for configuration might be aliased, check `index.js` or rule definition)
- **Description**: Enforces sentence case for headings. Also, if bold text is used within headings, it should also follow sentence case.
- **Configuration** (when using `extends`, these are typically pre-configured; for manual setup):
  - `true`: Enable the rule.
  - `false`: Disable the rule.

**Incorrect:**

```markdown
# This Is a Title Case Heading
## Another **Title Case Bold** Heading
```

**Correct:**

```markdown
# This is a sentence case heading
## Another **sentence case bold** heading
```

### `backtick-code-elements`

- **ID**: `backtick-code-elements`
- **Description**: Requires elements like filenames, directory paths, inline code snippets, and technical terms to be wrapped in backticks for clarity and consistency.
- **Configuration**:
  - `true`: Enable the rule.
  - `false`: Disable the rule.

**Incorrect:**

```markdown
Check the file example.js in the src/app folder.
Use the function processData.
```

**Correct:**

```markdown
Check the file `example.js` in the `src/app` folder.
Use the function `processData`.
```

## Development (contributing to this ruleset)

If you want to contribute to this `markdownlint-rules` package itself:

### Project structure (simplified)

```text
markdownlint-rules/
├── rules/           # Custom markdownlint rule implementations (e.g., sentence-case-headings-bold.js)
├── tests/           # Jest tests for custom rules (e.g., sentence-case-headings-bold.test.js)
├── index.js         # Main entry point for the package (exports rules for `extends` and programmatic use)
├── package.json     # Project metadata and dependencies
├── README.md        # This file
└── ...              # Other config files (ESLint, Jest, LICENSE, etc.)
```

### Adding new rules

1. Create a new JavaScript file for your rule in the `rules/` directory (e.g., `my-new-rule.js`).
2. Implement the rule logic according to the `markdownlint` [custom rule API](https://github.com/DavidAnson/markdownlint/blob/main/doc/CustomRules.md).
   - Export an object with `names` (array of rule ID aliases), `description` (string), `tags` (array of strings like 'headings', 'style'), and the rule function `function(params, onError)`.
3. Add your rule to `index.js` to make it available when the package is used with `extends` or `require`.
4. Write tests for your rule in a new file under `tests/rules/` (e.g., `my-new-rule.test.js`).
5. Update this `README.md` to include documentation for your new rule under the "Available custom rules" section.
6. Ensure your code passes linting and tests.

### Testing

Run the test suite using Jest:

```bash
npm test
# or
yarn test
```

## License

[MIT](LICENSE) <!-- Ensure LICENSE file exists -->
