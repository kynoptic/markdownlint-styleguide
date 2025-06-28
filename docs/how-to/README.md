# How-to guides

This section provides practical guides for common development tasks.

## How to contribute a new rule and set up the development environment

If you want to contribute to this project by modifying existing rules or adding new ones, you'll need to set up the development environment. The key step is understanding that the rule source code is written in ES Modules (ESM) and must be transpiled to CommonJS for `markdownlint` to use it.

### Step 1: Install dependencies

First, install the necessary Node.js packages:

```bash
npm install
```

### Step 2: Run the build

After making any changes to the rule files located in `.vscode/custom-rules/`, you must run the build script. This transpiles the code using Babel and places the output in the `dist/` directory.

```bash
npm run build
```

### Step 3: Run the linter

To test that your changes are working correctly, you can run the linter on the project's own Markdown files:

```bash
npx markdownlint-cli2 "**/*.md" "!node_modules/**/*"
```

Following these steps ensures that your changes are correctly compiled and ready for use.
