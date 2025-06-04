---
trigger: manual
description: "Ensure that all markdownlint custom rules follow the documented structure and conventions."
globs: "rules/*.js"
---

# Custom Markdownlint Rule Authoring

- Store all custom rule `.js` files in a consistent location, e.g., `/.vscode/custom-rules/`.
- Export either a **single rule object** or an **array of rule objects** using `module.exports`.
- Each rule object **must include**: `names` (array of strings), `description` (string), `tags` (array), `parser` (`"micromark"`, `"markdownit"`, or `"none"`), and a `function(params, onError)`.
- Begin each rule function with a robust check for `params`, `onError`, and expected parser tokens.
- Use `params.parsers.micromark.tokens` for `micromark` rules, or `params.parsers.markdownit.tokens` for `markdownit`.
- Use `params.lines`, `params.config`, and proper `onError({ ... })` reporting with `lineNumber`, `context`, and optional `range`/`fixInfo`.
- For `micromark`, understand token flows and extract text from `data` tokens carefully using accurate `startLine`, `startColumn`, etc.
- Break down logic into helper functions to improve maintainability and testability.
- Use `@ts-check` and appropriate JSDoc annotations to enable type checking with `markdownlint` types.
- Define `asynchronous: true` in the rule object if using async logic and ensure the function returns a `Promise`.