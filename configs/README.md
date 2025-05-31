# configs/

This directory contains reusable markdownlint configuration modules for consumers of this package:

- `markdownlint.js`: Exports a programmatic markdownlint config object with custom rules enabled and some default rules disabled. Use this if you want to import a ready-to-use config in your own JavaScript-based markdownlint setup.
- `markdownlint-absolute.js`: Like `markdownlint.js`, but uses absolute paths for custom rules—helpful if your config is loaded from outside the package root.

See the main `README.md` for usage examples and details.
