# markdownlint-trap

A collection of custom `markdownlint` rules designed to enforce specific documentation standards and best practices. These rules help maintain consistent, professional, and accessible documentation across your projects.

## Why use markdownlint-trap?

- **Consistent style**: Enforces sentence case headings and proper code formatting
- **Better accessibility**: Ensures URLs are properly formatted and links work correctly
- **Professional appearance**: Maintains readable, well-structured documentation
- **Automated fixes**: Most rules provide auto-fix functionality to save time

## Quick start

1. Install the package

   ```bash
   npm install --save-dev markdownlint-trap markdownlint-cli2
   ```

2. Configure markdownlint-cli2

   Create `.markdownlint-cli2.jsonc` at the root of your repo. Choose one of the following setups:

   - Recommended (extends the preset from this package):

     ```jsonc
     {
       "config": {
         "extends": "markdownlint-trap/recommended-config.jsonc"
       },
       "globs": ["**/*.md", "!node_modules/**/*"]
     }
     ```

   - Manual (load rules and enable them explicitly):

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
       "globs": ["**/*.md", "!node_modules/**/*"]
     }
     ```

3. Run on your files

   ```bash
   npx markdownlint-cli2 "**/*.md"
   # or auto-fix where supported
   npx markdownlint-cli2 --fix "**/*.md"
   ```

## Table of contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Rules overview](#rules-overview)
- [Docs](#docs)
- [Examples](#examples)
- [Contributing](#contributing)
- [License](#license)

## Installation

### Requirements

- **Node.js**: Version 18 or higher
- **markdownlint-cli2**: Recommended for best experience

### Install via npm

```bash
npm install markdownlint-trap --save-dev
```

## Configuration

### Recommended setup (extends)

The easiest way to get started is by extending the shared configuration included in this package. This automatically enables all custom rules with our recommended settings.

Create or update your `.markdownlint-cli2.jsonc` file:

```jsonc
{
  "config": {
    "extends": "markdownlint-trap/recommended-config.jsonc"
  }
}
```

This single line gives you a great starting point. You can still override any setting for your specific project needs. For example, to disable a rule from the shared config:

```jsonc
{
  "config": {
    "extends": "markdownlint-trap/recommended-config.jsonc",
    "no-literal-ampersand": false
  }
}
```

### Manual configuration

If you prefer to configure each rule individually, you can add them manually to your `.markdownlint-cli2.jsonc` file.

1. **Load the custom rules:**

   First, tell markdownlint where to find the rules.

   ```json
   {
     "customRules": ["markdownlint-trap"]
   }
   ```

2. **Enable and configure rules:**

   Next, add the rules you want to use to the config object. You can enable them with `true`.

   ```jsonc
   {
     "customRules": ["markdownlint-trap"],
     "config": {
       // Enable all custom rules
       "sentence-case-heading": true,
       "backtick-code-elements": true,
       "no-bare-url": true,
       "no-dead-internal-links": true,
       "no-literal-ampersand": true
     }
   }
   ```

   Example of advanced configuration for a single rule:

   ```jsonc
   {
     "customRules": ["markdownlint-trap"],
     "config": {
       "default": true,
       "sentence-case-heading": {
         "specialTerms": ["GitHub", "JavaScript", "TypeScript", "API", "CLI", "SDK"]
       }
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
| `no-bare-url` | BU001 | ✅ | Prevents bare URLs in content |
| `no-dead-internal-links` | DL001 | ❌ | Detects broken internal links |
| `no-literal-ampersand` | NLA001 | ✅ | Replaces `&` with "and" |

### Rule details

**🔤 sentence-case-heading** - Keeps headings consistent and readable

- Enforces sentence case: "Getting started" ✅ vs "Getting Started" ❌
- Respects proper nouns and technical terms
- Configurable with custom word lists

**💻 backtick-code-elements** - Makes code references clear

- Wraps file paths, commands, and variables in backticks
- `npm install` ✅ vs npm install ❌
- Improves visual distinction between code and prose

**🔗 no-bare-url** - Ensures accessible links

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

## Docs

- Rules: `docs/rules.md`
- Configuration: `docs/configuration.md`
- Setup and usage in other repos: `docs/setup.md`
  - Quick start in another repo: `docs/setup.md#apply-in-another-repo-quick-start`
  - Keeping in sync across projects: `docs/setup.md#keeping-in-sync-across-projects`
  - Local development via npm link: `docs/setup.md#option-c--npm-link-local-development`
- Architecture: `docs/architecture.md`
- Testing: `docs/testing.md`
- Performance: `docs/performance.md`

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

See [Configuration](docs/configuration.md) for setup.
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

**Questions or issues?** Please [open an issue](https://github.com/kynoptic/markdownlint-trap/issues) on GitHub.
