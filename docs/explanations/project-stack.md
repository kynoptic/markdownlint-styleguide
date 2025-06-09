# Project stack

This document describes the technology stack, coding conventions, and architecture of the markdownlint-trap project.

## Technology stack

- **Language**: JavaScript (ES Modules)
- **Runtime**: Node.js
- **Testing framework**: Jest (with `--experimental-vm-modules` for ES module support)
- **Linting**: ESLint
- **Documentation**: JSDoc
- **Target environment**: VS Code extension ecosystem

## Project architecture

The project is organized as a markdownlint plugin that provides custom rules for markdown linting:

1. **Custom rules**: Located in `.vscode/custom-rules/` directory
   - Each rule is implemented as a separate JavaScript module
   - Rules follow the markdownlint plugin architecture
   - Currently implements `sentence-case-heading` (SC001) and `backtick-code-elements` (BCE001) rules
2. **Library code**: General utilities and the package entry point live in `src/`
   - `src/index.js` re-exports rules for consumers
   - `src/logger.js` provides debugging helpers
3. **Testing**:
   - Test files are located in `tests/` directory
   - Uses fixture-based testing with annotated markdown files
   - Fixtures contain HTML comments indicating expected pass/fail status
4. **Documentation**:
   - Main documentation in `README.md`
   - Detailed rule documentation in `docs/reference/rules.md`
   - JSDoc comments for all functions and exports

## Coding conventions

<!-- markdownlint-disable-next-line sentence-case-heading -->
### JavaScript

- **Module system**: ES Modules (import/export)
- **Type annotations**: JSDoc style comments
- **Naming convention**:
  - camelCase for variables and functions
  - PascalCase for classes and constructors
    - `UPPER_SNAKE_CASE` for constants

### Documentation

- **File headers**: Each file starts with a header comment describing its purpose
- **Function documentation**: JSDoc style with @param and @returns tags
- **Code comments**: Inline comments for non-obvious logic and edge cases
- **Markdown**: Follows sentence case convention for headings

### Testing

- **Framework**: Jest
- **Pattern**: Describe/test blocks
- **Fixtures**: Markdown files with HTML comments for test expectations
- **Coverage**: Aims for comprehensive test coverage of rule logic

## Development workflow

1. **Rule development**:
   - Define rule behavior and expected outcomes
   - Implement rule logic in a dedicated module
   - Add JSDoc documentation for the rule function

2. **Testing**:
   - Create fixture files with examples of valid and invalid content
   - Write tests that verify rule behavior against fixtures
   - Run tests with `npm test`

3. **Documentation**:
   - Update rule documentation in `docs/reference/rules.md`
   - Ensure README reflects current features and usage

## Integration points

- **markdownlint**: Custom rules integrate with the markdownlint library
- **VSCode**: Rules can be used within VSCode via markdownlint extension
- **CI/CD**: Test suite runs in CI environment to validate changes

## Future considerations

- Additional custom rules for markdown consistency
- Improved detection of proper nouns and technical terms
- Integration with popular markdown editors and linting workflows
