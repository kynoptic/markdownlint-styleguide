# Claude.md

This file provides guidance to Claude Code (`claude.ai/code`) when working with code in this repository.

## Commands

### Development commands

- `npm run build` - Transpile ESM source files to CommonJS format in `.markdownlint-rules/` directory
- `npm test` - Run Jest test suite with ES Modules support
- `npm run lint` - Run ESLint on the codebase
- `DEBUG=markdownlint-trap* npm test` - Run tests with debug output

### Running single tests

Tests use Jest with fixture-based validation. To run a specific test:

```bash
npm test -- tests/features/sentence-case-failing.test.js
```

### Snapshot testing

Update snapshots after intentional autofix changes:

```bash
npm test -- --updateSnapshot
```

### Integration testing

Test rules against real-world patterns and performance:

```bash
npm run test:integration     # All integration tests
npm run test:performance     # Performance tests only
```

## Project architecture

This is a custom markdownlint rule library that provides three main rules for enforcing documentation standards:

### Build system

- **Source format**: ES Modules (ESM) in `src/` directory
- **Distribution format**: CommonJS (`.cjs`) in `.markdownlint-rules/` directory
- **Transpilation**: Babel converts ESM to CommonJS for markdownlint compatibility
- **Auto-build**: Husky pre-commit hook automatically builds and stages changes

### Rule structure

Each rule follows the markdownlint API pattern:

- Rules are in `src/rules/` as ESM modules
- Shared constants in `src/rules/shared-constants.js`
- Main export from `src/index.js` aggregates all rules
- Rules use micromark tokens for parsing when available

### Key rules

1. **sentence-case-heading (SC001)**: Enforces sentence case for ATX headings and bolded list items
2. **backtick-code-elements (BCE001)**: Requires backticks around code elements like file paths
3. **wt/no-bare-urls**: Enforces angle brackets around URLs

### Testing framework

- Jest with ES Modules support via `babel-jest`
- Fixture-based testing using `tests/utils/fixture.js`
- Test fixtures use special comments: `<!-- ✅ -->` (passing) and `<!-- ❌ -->` (failing)
- Tests validate both rule detection and autofix functionality
- **Snapshot testing**: `autofix-snapshots.test.js` captures exact autofix transformations for regression detection
- **Integration testing**: `tests/integration/` contains real-world pattern tests and performance benchmarks

### Key files

- `src/index.js` - Main entry point exporting all rules
- `src/rules/` - Rule implementations in ESM format
- `tests/features/` - Feature tests for each rule
- `tests/fixtures/` - Markdown test files with expected outcomes
- `babel.config.json` - Babel configuration for ESM to CommonJS transpilation
- `.markdownlint-rules/` - Compiled CommonJS rules (git-tracked distribution files)

The project maintains both source and distribution files in `git to` support easy integration into other projects while allowing modern ESM development.
