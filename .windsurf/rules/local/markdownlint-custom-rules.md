---
trigger: glob
description: "Ensure that all markdownlint custom rules follow the documented structure and conventions."
globs: "rules/*.js"
---
# Markdownlint custom rule structure

- Export a single object or array of rule objects conforming to the `markdownlint` custom rule interface.
- Define the following required fields in every rule object:
  - `names`: array of one or more strings identifying the rule.
  - `description`: human-readable explanation of the rule’s purpose.
  - `tags`: array of string tags to support rule categorization.
  - `parser`: one of `"micromark"`, `"markdownit"`, or `"none"`.
  - `function`: implementation that inspects `params` and reports errors via `onError`.
- Prefer the `micromark` parser over `markdownit` or `none`, unless legacy support is required.
- Use `params.parsers[parser].tokens` for token analysis instead of raw text when possible.
- Include an `information` field with a full `URL` for documentation or rule details if available.
- For rules requiring asynchronous operations (e.g. I/O), set `asynchronous: true` and return a `Promise`.
- Ensure all `onError` calls include at minimum the `lineNumber`; include `detail`, `context`, and `range` if meaningful.
- Leverage the `markdownlint-rule-helpers` package for shared logic where appropriate.
