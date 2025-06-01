# `/configs`

## Purpose

Reusable configuration modules for markdownlint-clarity. These files enable consumers to adopt clarity-focused linting standards, including custom rules, by importing or referencing these configs in their own projects or CI setups.

## Contents

### Files

- [`markdownlint.js`](./markdownlint.js): Programmatic markdownlint config with custom rules enabled and some defaults disabled. Import this for JavaScript-based markdownlint setups.
- [`markdownlint-absolute.js`](./markdownlint-absolute.js): Like `markdownlint.js`, but uses absolute paths for custom rules—helpful if your config is loaded from outside the package root.

## Usage

Import or reference these configs in your markdownlint setup or CI pipeline. Example:

```js
const config = require('./configs/markdownlint.js');
```

See the main [`README.md`](../README.md) for usage examples and details.

## Related modules

- [`../rules/`](../rules/) – Custom rule implementations
- [`../README.md`](../README.md) – Project overview
