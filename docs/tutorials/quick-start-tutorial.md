# Quick start tutorial

Welcome to the Markdownlint Rules Quick Start! This guide will walk you through setting up and running markdownlint with custom rules in your project.

## Prerequisites

- Node.js installed
- npm or yarn

## Steps

1. **Install markdownlint and this rules package**

   ```sh
   npm install --save-dev markdownlint markdownlint-cli markdownlint-rules
   ```

2. **Add a configuration file**

   Create a `.markdownlint.json` in your project root:

   ```json
   {
    "extends": ["markdownlint-rules"]
   }
   ```

3. **Lint your Markdown files**

   ```sh
   npx markdownlint "**/*.md"
   ```

## Next steps

- Explore [configuration options](../reference/configuration-reference.md)
- See [How to configure](../how-to/how-to-configure.md)
