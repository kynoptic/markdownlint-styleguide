# markdownlint-trap

Custom [`markdownlint`](https://github.com/DavidAnson/markdownlint) rules that enforce sentence-case headings, backtick code elements, proper link formatting, and prose style — with a three-tier autofix system that applies safe fixes automatically and flags ambiguous cases for review.

```markdown
# Getting Started With Our API                          ← before
Install the package using npm install my-package.
Visit https://example.com for docs & tutorials.

# Getting started with our API                          ← after
Install the package using `npm install my-package`.
Visit [our documentation](https://example.com) for docs and tutorials.
```

## Quick start

> [!IMPORTANT]
> Requires Node.js 18+ and npm.

```bash
npm install -D github:kynoptic/markdownlint-trap markdownlint-cli2
npx markdownlint-trap init --preset recommended --all
```

This configures CLI, VS Code integration, CI workflow, npm scripts, and pre-commit hooks. Then:

```bash
npm run lint:md          # check for issues
npm run lint:md:fix      # auto-fix issues
```

For a lighter setup without CI or hooks:

```bash
npm install -D github:kynoptic/markdownlint-trap markdownlint-cli2
npx markdownlint-trap init --preset recommended
npx markdownlint-cli2 "**/*.md"
```

## Rules

| Rule | ID | Auto-fix | Purpose |
|------|----|----------|---------|
| `sentence-case-heading` | SC001 | Yes | Enforces sentence case for headings |
| `backtick-code-elements` | BCE001 | Yes | Wraps code elements in backticks |
| `no-bare-url` | BU001 | Yes | Prevents bare URLs in content |
| `no-dead-internal-links` | DL001 | No | Detects broken internal links |
| `no-literal-ampersand` | NLA001 | Yes | Replaces `&` with "and" |
| `no-empty-list-items` | ELI001 | Yes | Flags empty or whitespace-only list items |

Auto-fixes use confidence scoring: high-confidence fixes apply automatically, ambiguous cases are flagged for review, and uncertain changes are skipped. See [rules reference](docs/rules.md) for full details.

## Configuration

Three presets are available: `basic`, `recommended`, and `strict`. Override individual rules in `.markdownlint-cli2.jsonc`:

```jsonc
{
  "config": {
    "extends": "markdownlint-trap/recommended-config.jsonc",
    "no-literal-ampersand": false
  }
}
```

See [configuration guide](docs/configuration.md) for presets, setup wizard options, and manual setup. Run `npx markdownlint-trap doctor` to verify your setup.

## Documentation

- [Setup and installation](docs/setup.md) — getting started, consumption methods, distribution
- [Configuration](docs/configuration.md) — presets, rule options, autofix safety tuning
- [Rule catalogue](docs/rules.md) — rule IDs, behavior, and examples
- [Extending and contributing](docs/extending.md) — custom rules, plugins, helpers contract
- [Architecture](docs/architecture.md) — project structure, modules, performance
- [Testing strategy](docs/testing.md) — test layers, conventions, validation

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup, workflow, and guidelines.

## License

[MIT](./LICENSE)
