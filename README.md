# markdownlint-trap

A collection of custom `markdownlint` rules designed to enforce specific documentation standards and best practices. These rules help maintain consistent, professional, and accessible documentation across your projects.

## Why use markdownlint-trap?

- **Consistent style**: Enforces sentence case headings and proper code formatting
- **Better accessibility**: Ensures URLs are properly formatted and links work correctly
- **Professional appearance**: Maintains readable, well-structured documentation
- **Automated fixes**: Most rules provide auto-fix functionality to save time

## Quick start

1. **Install the package:**

   ```bash
   npm install markdownlint-trap --save-dev
   ```

2. **Add to your markdownlint config** (`.markdownlint-cli2.jsonc`):

   ```json
   {
     "customRules": ["markdownlint-trap"]
   }
   ```

3. **Run on your files:**

   ```bash
   npx markdownlint-cli2 "**/*.md"
   ```

## Table of contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Rules overview](#rules-overview)
- [Examples](#examples)
- [Contributing](#contributing)
- [License](#license)

## Installation

### Requirements

- **Node.js**: Version 14 or higher
- **markdownlint-cli2**: Recommended for best experience

### Install via npm

```bash
npm install markdownlint-trap --save-dev
```

## Configuration

### Basic configuration

Create or update your `.markdownlint-cli2.jsonc` file:

```json
{
  "customRules": [
    "markdownlint-trap"
  ],
  "config": {
    "sentence-case-heading": true,
    "backtick-code-elements": true,
    "wt/no-bare-urls": true,
    "no-dead-internal-links": true,
    "no-literal-ampersand": true
  }
}
```

### Advanced configuration

Individual rules can be customized. For example:

```json
{
  "customRules": ["markdownlint-trap"],
  "config": {
    "sentence-case-heading": {
      "properNouns": ["GitHub", "JavaScript", "TypeScript"],
      "technicalTerms": ["API", "CLI", "SDK"]
    },
    "backtick-code-elements": true,
    "no-dead-internal-links": true
  }
}
```

### Running the linter

After configuration, run markdownlint on your project:

```bash
# Lint all markdown files
npx markdownlint-cli2 "**/*.md"

# Lint specific files
npx markdownlint-cli2 README.md docs/*.md

# Auto-fix issues where possible
npx markdownlint-cli2 --fix "**/*.md"
```

## Rules overview

This package includes five custom rules designed to improve documentation quality:

| Rule | ID | Auto-fix | Purpose |
|------|----|-----------| --------|
| `sentence-case-heading` | SC001 | ✅ | Enforces sentence case for headings |
| `backtick-code-elements` | BCE001 | ✅ | Wraps code elements in backticks |
| `wt/no-bare-urls` | WT001 | ❌ | Prevents bare URLs in content |
| `no-dead-internal-links` | DL001 | ❌ | Detects broken internal links |
| `no-literal-ampersand` | NLA001 | ✅ | Replaces `&` with "and" |

### Rule details

**🔤 sentence-case-heading** - Keeps headings consistent and readable

- Enforces sentence case: "Getting started" ✅ vs "Getting Started" ❌
- Respects proper nouns and technical terms
- Configurable with custom word lists

**💻 backtick-code-elements** - Makes code references clear

- Wraps file paths, commands, and variables in backticks
- `npm install` ✅ vs `npm install` ❌
- Improves visual distinction between code and prose

**🔗 wt/no-bare-urls** - Ensures accessible links

- Requires proper link formatting: `[GitHub](https://github.com)` ✅
- Prevents bare URLs: <https://github.com> ❌
- Improves accessibility for screen readers

**🔍 no-dead-internal-links** - Maintains working documentation

- Validates internal file links and anchors
- Catches broken references during builds
- Supports relative paths and heading anchors

**✏️ no-literal-ampersand** - Professional writing style

- Replaces standalone `&` with "and" in prose
- "Dogs and cats" ✅ vs "Dogs & cats" ❌
- Ignores ampersands in code contexts

For complete documentation and configuration options, see the [rules reference](./docs/reference/rules.md).

## Examples

### Before markdownlint-trap

```markdown
# Getting Started With Our API

Install the package using npm install my-package.

Visit https://example.com for docs & tutorials.

Check the [configuration guide](missing-file.md) for setup.
```

### After markdownlint-trap

```markdown
# Getting started with our API

Install the package using `npm install my-package`.

Visit [our documentation](https://example.com) for docs and tutorials.

Check the [configuration guide](docs/config.md) for setup.
```

## Contributing

We welcome contributions from the community! Whether you're fixing bugs, adding new rules, or improving documentation, your help is appreciated.

### Quick contribution guide

1. **Fork and clone** the repository
2. **Install dependencies**: `npm install`
3. **Make your changes** and add tests
4. **Run tests**: `npm test && npm run lint`
5. **Submit a pull request**

For detailed setup instructions, development workflow, and coding guidelines, see our [Contributing Guide](./CONTRIBUTING.md).

### Development commands

```bash
npm run build    # Transpile source to CommonJS
npm test         # Run all tests
npm run lint     # Check code style
```

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

---

**Questions or issues?** Please [open an issue](https://github.com/your-username/markdownlint-trap/issues) on GitHub.
