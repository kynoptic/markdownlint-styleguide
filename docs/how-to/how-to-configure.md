# How to configure markdownlint-rules

This guide explains how to customize markdownlint and this rules package for your project.

1. **Edit `.markdownlint.json`**

   Modify or create `.markdownlint.json` in your project root. Example:

   ```json
   {
    "extends": ["markdownlint-rules"],
    "MD013": false, // disables line length rule
    "MD041": true   // enables first line heading rule
   }
   ```

2. **Use CLI flags**

   You can override config options via CLI:

   ```sh
   npx markdownlint "**/*.md" --config .markdownlint.json
   ```

3. **Reference**

   See [configuration reference](../reference/configuration-reference.md) for all options.

4. **Why configure?**

   See [system architecture](../explanations/system-architecture.md) for rationale behind the rule structure.
