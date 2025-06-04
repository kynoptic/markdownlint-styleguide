---
trigger: model_decision
description: Project's technology stack, development patterns, and code organization.
---

# Project stack and toolchain

- Use JavaScript (ES modules) for all project code, with JSDoc type annotations for improved code clarity and IDE support.
- Implement custom markdownlint rules following the markdownlint plugin architecture and micromark parser integration.
- Write tests using Jest with the ES modules configuration (`--experimental-vm-modules`), following a fixture-based testing approach.
- Structure tests with descriptive names and use the `describe`/`test`/`expect` pattern from Jest for clear test organization.
- Document code with JSDoc comments that include parameter types, return values, and function descriptions.
- Use fixture files with explicit pass/fail annotations (`<!-- ✅ -->` and `<!-- ❌ -->`) to validate rule behavior against real examples.
- Follow a test-driven development approach where test fixtures define expected behavior before rule implementation.
- Organize custom rules in the `.vscode/custom-rules/` directory with consistent naming patterns (`rule-name.js`).
- Export rules with standardized metadata including names (both full name and code), description, tags, and parser type.
