# markdownlint custom rules

Custom, shareable rules for [markdownlint](https://github.com/DavidAnson/markdownlint), a Node.js lint tool for Markdown/CommonMark files.

---

## Key features

- 🛡️ Enforce sentence case for headings
- `backtick-code-elements`: Require code elements to be wrapped in backticks
- Easy to extend with new rules
- Well-structured tests and documentation

---

## Installation

```bash
npm install --save-dev markdownlint
# or clone this repo if using custom rules directly
```

---

## Usage

1. Clone this repo or copy the `rules/` directory into your project.
2. Configure `.markdownlint.json` to use the custom rules:

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

3. Run markdownlint:

```bash
npx markdownlint "**/*.md"
```

---

## Project structure

```
markdownlint-rules/
├── rules/           # Custom markdownlint rules
│   └── README.md    # Rule documentation
├── tests/           # Tests for custom rules
│   └── README.md    # Test documentation
├── docs/            # Additional documentation
│   └── configuration.md
├── scripts/         # Utility scripts
├── .markdownlint.json
├── package.json
├── jest.config.js
├── .gitignore
├── LICENSE
├── CONTRIBUTING.md
└── README.md
```

---

## Project status & roadmap

- **Status:** Active, used in production and evolving.
- **Roadmap:** See [issues](https://github.com/your-username/markdownlint-rules/issues) for planned features and enhancements.

---

## License & attribution

MIT License. See [LICENSE](LICENSE).

---

## Resources

- [Configuration Reference](docs/configuration.md)
- [Rules Documentation](rules/README.md)
- [Tests Documentation](tests/README.md)
- [Contribution Guide](CONTRIBUTING.md)
- [markdownlint documentation](https://github.com/DavidAnson/markdownlint)

  "sentence-case-headings-bold": true,
  "backtick-code-elements": true
}
```

3. Run markdownlint:

```bash
npx markdownlint "**/*.md"
```

## Project Structure

```
markdownlint-rules/
├── rules/           # Custom markdownlint rules
│   └── README.md    # Rule documentation
├── tests/           # Tests for custom rules
│   └── README.md    # Test documentation
├── docs/            # Additional documentation
│   └── configuration.md
├── scripts/         # Utility scripts
├── .markdownlint.json
├── package.json
├── jest.config.js
├── .gitignore
├── LICENSE
├── CONTRIBUTING.md
└── README.md
```

- [Configuration Reference](docs/configuration.md)
- [Rules Documentation](rules/README.md)
- [Tests Documentation](tests/README.md)

## Development

### Adding New Rules

1. Create a new rule file in the `rules` directory.
2. Export a rule object with a `names` array and a `description` string.
3. Implement the rule logic in the function.
4. Add tests in the `tests/rules` directory.
5. Update the README.md with documentation for the new rule.

### Testing

Run the test suite:

```bash
npm test
```

## License

[MIT](LICENSE)
