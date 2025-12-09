# markdownlint-trap

A collection of custom `markdownlint` rules designed to enforce specific documentation standards and best practices. These rules help maintain consistent, professional, and accessible documentation across your projects.

## Why use markdownlint-trap?

- **Consistent style**: Enforces sentence case headings and proper code formatting
- **Better accessibility**: Ensures URLs are properly formatted and links work correctly
- **Professional appearance**: Maintains readable, well-structured documentation
- **Automated fixes**: Most rules provide auto-fix functionality to save time

## Quick start

### For published package

Get up and running in under 2 minutes:

1. Install the package

   ```bash
   npm install --save-dev markdownlint-trap markdownlint-cli2
   ```

2. Run the setup wizard

   ```bash
   npx markdownlint-trap init
   ```

   This will:
   - Guide you through preset selection (basic, recommended, or strict)
   - Create `.markdownlint-cli2.jsonc` configuration
   - Configure VS Code integration (if `.vscode` exists)
   - Validate your setup

3. Run on your files

   ```bash
   npx markdownlint-cli2 "**/*.md"
   # or auto-fix where supported
   npx markdownlint-cli2 --fix "**/*.md"
   ```

### For local development (recommended)

If you're developing markdownlint-trap or want to use it across all your projects:

```bash
# In the markdownlint-trap repository
npm run dist:local
```

This automatically:

- Installs globally (works in ALL projects, including `non-Node.js`)
- Distributes configs to `~/Projects/*`
- Detects package managers (npm, pnpm, yarn, bun)

See [Installation Guide](docs/installation.md) for detailed setup options.

### Alternative: manual configuration

If you prefer manual setup or need advanced configuration:

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

## Table of contents

- [Installation](#installation)
- [Configuration](#configuration)
  - [Setup wizard](#setup-wizard)
  - [Multi-project deployment](#multi-project-deployment)
  - [Diagnostics](#diagnostics)
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

Pick a preset and extend it in `.markdownlint-cli2.jsonc`.

- Basic (most users): `markdownlint-trap/basic-config.jsonc`
- Recommended: `markdownlint-trap/recommended-config.jsonc`
- Strict: `markdownlint-trap/strict-config.jsonc`

Example:

```jsonc
{
  "config": { "extends": "markdownlint-trap/basic-config.jsonc" }
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

### Setup wizard

The `init` command provides an interactive setup wizard to configure markdownlint-trap in your project:

```bash
npx markdownlint-trap init
```

**Features:**

- Interactive preset selection (basic, recommended, strict)
- Automatic configuration file generation
- VS Code integration setup
- Merge with existing settings (non-destructive)

**Options:**

- `--preset <level>`: Skip interactive prompt and use specified preset
- `--vscode`: Only configure VS Code settings
- `--cli`: Only configure markdownlint-cli2
- `--force`: Overwrite existing configuration files
- `--dry-run`: Preview changes without writing files

**Examples:**

```bash
# Interactive setup (recommended)
npx markdownlint-trap init

# Non-interactive with specific preset
npx markdownlint-trap init --preset recommended

# Only setup VS Code integration
npx markdownlint-trap init --vscode --preset strict

# Preview what would be generated
npx markdownlint-trap init --dry-run
```

### Multi-project deployment

For managing configurations across multiple projects, use the local distribution system:

## 1. Create distribution config

Create or edit `.github/distribution.local.yml` in the markdownlint-trap package directory:

```yaml
version: 1
targets:
  - name: vscode-recommended
    enabled: true  # Set to true to activate
    type: local
    src: templates/vscode-settings-recommended.json
    dest:
      - ~/Projects/my-docs/.vscode/settings.json
      - ~/Projects/api-docs/.vscode/settings.json
      # Wildcards supported:
      # - ~/Projects/*/.vscode/settings.json
    merge: true  # Merge with existing settings
```

## 2. Preview changes

```bash
npm run dist:local:dry
```

## 3. Apply configuration

```bash
npm run dist:local
```

**Benefits:**

- Deploy configs to multiple projects with one command
- Wildcard support: `~/Projects/*/.vscode/settings.json`
- Safe merging with existing configurations
- Maintain consistency across all your documentation projects

See `.github/distribution.local.yml` for full configuration examples.

### Diagnostics

Run diagnostics to verify your setup:

```bash
npm run doctor
```

The doctor command checks:

- Required dependencies installed (Node.js, markdownlint-cli2)
- Configuration files exist and have valid syntax
- Custom rules can be loaded successfully
- VS Code integration is properly configured

Example output:

```text
✓ Node.js installed
✓ markdownlint-cli2 installed
✓ CLI config (.markdownlint-cli2.jsonc) exists
✓ CLI config syntax valid
✓ VS Code config (.vscode/settings.json) exists
✓ VS Code config syntax valid
✓ VS Code custom rules configured
✓ Custom rules loadable

Results: 8 passed, 0 failed, 0 warnings
✨ All checks passed! Your setup looks good.
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
