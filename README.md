# markdownlint-custom-rules

Custom, shareable rules for [markdownlint](https://github.com/DavidAnson/markdownlint), the popular Markdown/CommonMark linter.

---

## Project overview

**markdownlint-custom-rules** provides reusable, opinionated linting rules to enforce consistent Markdown style and best practices across your documentation. This package is designed for easy integration with markdownlint and markdownlint-cli.

---

## Key features

- **Sentence case enforcement** for headings and bold text
- **Inline code formatting**: Ensures backtick code elements are used properly
- Easily extendable and compatible with markdownlint and markdownlint-cli
- Thoroughly tested with Jest
- Actively maintained and open source

---

## Installation

```bash
npm install --save-dev markdownlint markdownlint-cli markdownlint-custom-rules
```

---

## Usage

### 1. Configure markdownlint

**JSON config:**

```json
{
  "extends": "markdownlint-custom-rules",
  "MD013": false

```

---

## Using custom rules in VSCode

To use these custom markdownlint rules in VSCode:

1. **Ensure you have a `.markdownlint.json` config file** in your project root (as shown above).
2. **Install the [markdownlint extension for VSCode](https://marketplace.visualstudio.com/items?itemName=DavidAnson.vscode-markdownlint)** if you haven't already.
3. **Configure VSCode to use your local config:**
   - Create or update `.vscode/settings.json` in your project root with:

     ```json
     {
       "markdownlint.configFile": ".markdownlint.json"
     }
     ```

   - This ensures VSCode uses your project's specific rules (including custom ones) when linting Markdown files.

4. **(Optional) Point to custom rules directory:**
   - If your custom rules are not picked up automatically, add this to `.vscode/settings.json`:

     ```json
     {
       "markdownlint.customRules": "./rules"
     }
     ```

Now, when you edit Markdown files in VSCode, the linter will apply your custom rules automatically.

---

**JavaScript config:**

```js
module.exports = {
  extends: "markdownlint-custom-rules",
  MD013: false
};
```

### 2. Run the linter

```bash
npx markdownlint . --rules ./rules
```

Or use npm script:

```json
{
  "scripts": {
    "lint:md": "markdownlint \"**/*.md\"",
    "lint:md:fix": "markdownlint --fix \"**/*.md\""
  }
}
```

---

## ✅ Custom rules

### `sentence-case-headings-bold`

Enforces sentence case for all headings and any bold text inside them.

**Incorrect**:

```markdown
# This Is a Heading
## A **Bold** Statement
```

**Correct**:

```markdown
# This is a heading
## A **bold** statement
```

---

### `backtick-code-elements`

Wraps filenames, functions, and paths in backticks for clarity.

**Incorrect**:

```markdown
Run setup.sh in the scripts folder.
```

**Correct**:

```markdown
Run `setup.sh` in the `scripts` folder.
```

---

## 🛠️ Developing new rules

Project layout:

```text
markdownlint-rules/
├── rules/        # Rule implementations
├── tests/        # Jest tests
├── index.js      # Entry point (exports all rules)
```

To add or test rules:

```bash
npm test
```

---

## 📄 License

[MIT](LICENSE)
