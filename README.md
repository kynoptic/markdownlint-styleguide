# markdownlint-rules

Custom, shareable rules for [markdownlint](https://github.com/DavidAnson/markdownlint), a linter for Markdown/CommonMark files.

These rules help enforce **sentence case** and ensure **inline code elements** are properly formatted for readability and consistency.

---

## 🚀 Quick start

### 1. Install dependencies

```bash
npm install --save-dev markdownlint markdownlint-cli markdownlint-rules
```

### 2. Create `.markdownlint.json`

```json
{
  "extends": "markdownlint-rules",
  "MD013": false
}
```

Or use JavaScript config:

```js
module.exports = {
  extends: "markdownlint-rules",
  MD013: false
};
```

### 3. Run the linter

```bash
npx markdownlint "**/*.md"
# Optional auto-fix:
# npx markdownlint --fix "**/*.md"
```

Add to `package.json` scripts for convenience:

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

---

Let me know if you want a version that includes TypeScript support or examples of rule authoring.
