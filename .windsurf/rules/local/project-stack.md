---
trigger: model_decision
title: "JavaScript markdownlint custom rules project"
---

## Project stack

- **Primary language**: JavaScript (Node.js) with JSDoc type annotations for improved code clarity and documentation
- **Project purpose**: Custom rule extensions for markdownlint to enforce documentation clarity standards
- **Dependencies**: Uses markdownlint `v0.28.0` as the core linting engine with markdownlint-rule-helpers `v0.18.0` for rule development utilities
- **Testing framework**: Jest `v29.0.0` with comprehensive unit, integration, and feature tests organized in a structured test hierarchy
- **Code organization**: Follows a modular pattern with rules in the root `/rules` directory and shared helper functions in `/rules/helpers`
- **Documentation**: Maintains extensive JSDoc comments for all functions and a structured documentation approach in the `/docs` directory
- **Type system**: Uses JSDoc annotations with TypeScript declarations in the `/types` directory for type checking without TypeScript compilation
- **Code quality**: Enforces high test coverage (minimum 80% for branches, functions, lines, and statements) as defined in `jest.config.js`
- **Naming conventions**: Uses descriptive, semantic naming with kebab-case for files and camelCase for variables and functions
- **Build process**: No transpilation required; runs directly with Node.js (requires `v14.0.0` or higher)
