# Architecture

Overview of how this project is structured and consumed.

## Source vs distribution

- Source code: ES Modules under `src/`.
- Distribution: CommonJS output under `.markdownlint-rules/` (built via Babel).
- Entry point: `src/index.js` exports the rules for direct ESM usage.

Consumers typically use the shareable preset `markdownlint-trap/recommended-config.jsonc`, which references compiled CJS rule files under `.markdownlint-rules/rules/*.cjs`. This allows `markdownlint-cli2` to load the rules without transpiling.

## Recommended config

`recommended-config.jsonc` declares `customRules` pointing to the compiled rules and a `config` block enabling rules (and some stock markdownlint rules). Other repos can simply set `"config.extends": "markdownlint-trap/recommended-config.jsonc"` in their `.markdownlint-cli2.jsonc`.

## Testing approach

- Tests run directly against ESM in `src/` (via `babel-jest`), not the compiled output.
- Fixtures exercise real-world patterns and performance.
- Integration tests use `markdownlint` with custom rules loaded from `src/`.

## Build

- `npm run build` transpiles to `.markdownlint-rules` with `.cjs` files copied.
- The package `files` field includes `.markdownlint-rules`, `src/index.js`, and `recommended-config.jsonc` for consumption.
