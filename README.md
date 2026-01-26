# markdownlint-trap

A collection of custom `markdownlint` rules designed to enforce specific documentation standards and best practices. These rules help maintain consistent, professional, and accessible documentation across your projects.

## Why use markdownlint-trap?

- **Consistent style**: Enforces sentence case headings and proper code formatting
- **Better accessibility**: Ensures URLs are properly formatted and links work correctly
- **Professional appearance**: Maintains readable, well-structured documentation
- **Automated fixes**: Most rules provide auto-fix functionality to save time

## Quick start

Get up and running in under 2 minutes:

### 1. Install

```bash
npm install -D github:kynoptic/markdownlint-trap markdownlint-cli2
```

### 2. Run the setup wizard

```bash
npx markdownlint-trap init --preset recommended --all
```

This creates everything you need:

- `.markdownlint-cli2.jsonc` - CLI configuration
- `.vscode/settings.json` - VS Code integration (merged with existing)
- `.vscode/extensions.json` - Recommends the markdownlint extension
- `.github/workflows/markdown-lint.yml` - CI workflow
- `package.json` updates - Adds `lint:md` scripts and pre-commit hooks

### 3. Lint your files

```bash
# Check for issues
npm run lint:md

# Auto-fix issues
npm run lint:md:fix
```

That's it! VS Code will now show lint errors in real-time, and CI will catch issues on pull requests.

## Minimal setup

If you just want the basics without CI or hooks:

```bash
npm install -D github:kynoptic/markdownlint-trap markdownlint-cli2
npx markdownlint-trap init --preset recommended
npx markdownlint-cli2 "**/*.md"
```

## Manual configuration

If you prefer manual setup or need advanced configuration:

```jsonc
// .markdownlint-cli2.jsonc
{
  "config": {
    "extends": "markdownlint-trap/recommended-config.jsonc"
  }
}
```

For VS Code, add to `.vscode/settings.json`:

```jsonc
{
  "markdownlint.customRules": ["markdownlint-trap"],
  "markdownlint.config": {
    "extends": "markdownlint-trap/recommended-config.jsonc"
  }
}
```

## Table of contents

- [Installation](#installation)
- [Configuration](#configuration)
  - [Presets](#presets)
  - [Setup wizard options](#setup-wizard-options)
  - [Diagnostics](#diagnostics)
- [Rules overview](#rules-overview)
- [Docs](#docs)
- [Examples](#examples)
- [Contributing](#contributing)
- [License](#license)

## Installation

### Requirements

- **Node.js**: Version 18 or higher
- **markdownlint-cli2**: Required for CLI usage

### Full setup (recommended)

This installs everything and configures VS Code, CI, npm scripts, and pre-commit hooks:

```bash
npm install -D github:kynoptic/markdownlint-trap markdownlint-cli2
npx markdownlint-trap init --preset recommended --all
```

### VS Code only

If you just want real-time linting in VS Code:

```bash
npm install -D github:kynoptic/markdownlint-trap markdownlint-cli2
npx markdownlint-trap init --preset recommended --vscode
```

Then install the [markdownlint extension](https://marketplace.visualstudio.com/items?itemName=DavidAnson.vscode-markdownlint).

### CLI only

If you just want to run linting from the command line:

```bash
npm install -D github:kynoptic/markdownlint-trap markdownlint-cli2
npx markdownlint-trap init --preset recommended --cli
npx markdownlint-cli2 "**/*.md"
```

### Verify your setup

```bash
npx markdownlint-trap doctor
```

## Configuration

### Presets

Three presets are available:

| Preset | Description |
|--------|-------------|
| `basic` | Core rules only (sentence-case, backticks) |
| `recommended` | All custom rules with balanced strictness |
| `strict` | All custom rules plus standard markdownlint rules |

Override individual rules in your `.markdownlint-cli2.jsonc`:

```jsonc
{
  "config": {
    "extends": "markdownlint-trap/recommended-config.jsonc",
    "no-literal-ampersand": false
  }
}
```

### Setup wizard options

```bash
npx markdownlint-trap init [options]
```

| Option | Description |
|--------|-------------|
| `--preset <level>` | Use basic, recommended, or strict (skips prompt) |
| `--all` | Enable all optional features (CI, scripts, hooks) |
| `--github-action` | Add GitHub Actions workflow |
| `--scripts` | Add npm scripts (`lint:md`, `lint:md:fix`) |
| `--hooks` | Configure lint-staged for pre-commit |
| `--vscode` | Only configure VS Code settings |
| `--cli` | Only configure markdownlint-cli2 |
| `--force` | Overwrite existing files |
| `--dry-run` | Preview without writing |

**Examples:**

```bash
# Full setup with all features
npx markdownlint-trap init --preset recommended --all

# Just VS Code integration
npx markdownlint-trap init --preset recommended --vscode

# Preview what would be created
npx markdownlint-trap init --preset recommended --all --dry-run
```

### Diagnostics

Verify your setup is working correctly:

```bash
npx markdownlint-trap doctor
```

This checks:

- Dependencies installed (Node.js, markdownlint-cli2)
- Configuration files exist and are valid
- Custom rules load successfully
- VS Code integration configured

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
- `npm install` ✅ vs `npm install` ❌
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
- "Dogs and cats" ✅ vs "Dogs and cats" ❌
- Ignores ampersands in code contexts

## Docs

- Rules: `docs/rules.md`
- Configuration: `docs/configuration.md`
- Beginner's guide: `docs/beginners.md`
- Setup and usage in other repos: `docs/setup.md`
  - Use in another repo: `docs/setup.md#use-in-another-repo`
  - Local development via `npm link`: `docs/setup.md#option-c--npm-link-local-development`
- Architecture: `docs/architecture.md`
- Testing: `docs/testing.md`
- Performance: `docs/performance.md`
- Autofix telemetry: `docs/telemetry.md` – Track and analyze safety heuristic performance
- External validation: `docs/external-validation.md` – Validate rules against real-world markdown
- Claude Code analysis: `docs/claude-code-analysis.md` – AI-assisted rule improvement workflow

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
npm test         # Run all tests
npm run lint     # Check code style
```

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

---

**Questions or issues?** Please [open an issue](https://github.com/kynoptic/markdownlint-trap/issues) on GitHub.
