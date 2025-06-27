<!-- markdownlint-disable-next-line sentence-case-heading -->
# `AGENTS.md` – Project guide for AI agents

## Project overview and goals

markdownlint-trap provides custom markdownlint rules enforcing consistent Markdown style. The main rules are `sentence-case-heading` for headings and `backtick-code-elements` for file paths and code snippets. The project targets Node.js v14+ and uses Jest for testing. Agents contribute by implementing new rules, improving tests, and maintaining documentation.

## Repository structure

- `/src/` – Package entry point and utilities
  - `index.js` – Exports rule array
  - `logger.js` – Debug logger via `debug` module
- `/.vscode/custom-rules/` – Custom markdownlint rule implementations
  - `sentence-case-heading.js` – Enforces sentence case headings
  - `backtick-code-elements.js` – Requires backticks around code elements
- `/tests/` – Fixture-based Jest tests
  - `fixtures/` – Markdown examples marked ✅ or ❌
  - `rules/` – Test suites exercising each rule
  - `utils/` – Shared helpers for parsing fixtures
- `/docs/` – Project documentation (rules, stack, roadmap)
- `/.windsurf/` – Internal guidelines and workflows for rule creation

### Key files

- `.markdownlint-cli2.jsonc` – Lint configuration enabling custom rules
- `package.json` – Defines Node.js version and test script
- `docs/roadmap.md` – Checklist of ongoing work

## Environment setup and commands

- **Install dependencies**:

    ```bash
    npm install
    ```

- **Run app**: lint markdown files with the custom rules

    ```bash
    npx markdownlint-cli2 "**/*.md"
    ```

- **Run tests**:

    ```bash
    npm test
    ```

- **Debug tests**:

    ```bash
    DEBUG=markdownlint-trap* npm test
    ```

## Coding guidelines

- Use **ES modules** compatible with Node.js v14+
- Document all functions with **JSDoc** comments
- `camelCase` variables and functions, `PascalCase` classes, `UPPER_SNAKE_CASE` constants
- Keep Markdown headings in **sentence case**
- Place custom rule modules under `/.vscode/custom-rules/`
- Follow `.windsurf/rules/local/markdownlint-custom-rules.md` for rule structure
- When creating or updating rules, consult `.windsurf/workflows/local/markdownlint-rule-create.md`

## Code structure and clarity guidelines

- Organize files by feature domain; keep directories shallow
- Provide a single clear entry point for each module
- Remove dead code proactively
- Isolate side effects (`I/O`, network) in boundary modules
- Name variables and files for clarity over brevity
- Mark provisional logic with `// TODO:` or `// FIXME:`

## Markdown formatting conventions

- Use backticks to wrap all:
  - Filenames (e.g., `main.py`)
  - Directories (e.g., `src/`)
  - Code snippets, flags, and inline commands (e.g., `--help`)
- Prefer fenced code blocks (` ``` `) for multi-line commands or examples

## Code clarity and documentation standards

### Naming and file metadata

- Begin each source file with a brief header comment
- Use explicit, domain-relevant names; avoid placeholders
- Provide type annotations via JSDoc for inputs and outputs

### Docstrings and comments

- Document every public function or class using JSDoc
- Include `@param` and `@returns` for each item
- Explain intent and edge cases rather than restating code
- Add inline comments for non-obvious logic

### AI-aligned clarity

- Prefer explicitness over terseness
- Keep a consistent docstring style across files
- Document assumptions and external dependencies
- Treat missing documentation as a defect

## Documentation structure and diátaxis alignment

- All docs live under `/docs/` and follow Diátaxis categories
  - `tutorials/`, `how-to/`, `reference/`, `explanations/`
- Do not mix documentation types in one file
- Each subfolder requires a README describing its contents

## Semantic repository organization

- Use meaningful directory names (`custom-rules/`, `fixtures/`)
- Keep directory trees shallow for readability
- Centralize configs and document them in `/docs/`
- Split large files when they hinder comprehension

## Sentence casing conventions

- Use **sentence case** for all headings and UI strings
- Capitalize only the first word and proper nouns

## Agent mindset and communication principles

- Think in terms of user behavior when writing features and tests
- Keep changes small, focused, and reversible
- Ask early if requirements are unclear
- Document technical debt for future work
- Provide empathetic commit messages and PR summaries

## Test authoring strategy

- Write failing tests before implementing new behavior
- Use Jest `describe`/`test` with fixtures
- Mock `I/O` and external effects when possible
- Cover edge cases and failure paths
- Commit tests and code together

### Recommended folder structure

```text
tests/
  fixtures/
  rules/
  utils/
```

## Test file conventions

- One test suite per rule or behavior group
- Descriptive test names expressing expected outcomes
- Focus on observable results, not internal state
- Keep fixtures minimal but include edge cases

## Git commit message formatting rules

- Follow Conventional Commits `<type>: <subject>` with **no scope**
- Subject line ≤ 50 characters
- Blank line before the body
- Body lines as bullets under 72 characters

### Allowed types

```text
build, chore, ci, docs, feat, fix, perf, refactor, revert, style, test
```

### Example

```text
feat: add user password reset endpoint

- Add `/reset-password` route to `auth.js`
- Validate email before issuing reset token
```

## Tools and agent capabilities

- markdownlint-cli2 – runs lint rules via `npx markdownlint-cli2 "**/*.md"`
- Jest – executed via `npm test`
- Debug logging with `DEBUG=markdownlint-trap*`

## Agent roles and interaction

- Single-agent workflow: plan, code, test, and document
- Use Jest and markdownlint to validate before committing

## Constraints and safety rules

- **ALWAYS** run `npm test` and `npx markdownlint-cli2 "**/*.md"`
- **NEVER** bypass failing tests or lint errors
- **NEVER** modify files outside the project scope

## Known issues and debugging context

- Automated release process and VS Code extension integration are still pending
- Enhanced documentation is in progress

## Example tasks

- **Add a new rule**
  - Edit: `/.vscode/custom-rules/new-rule.js`
  - Test: `tests/rules/new-rule.test.js`
  - Validate with: `npm test && npx markdownlint-cli2 "**/*.md"`

- **Fix rule bug**
  - Step 1: write failing fixture in `tests/fixtures/<rule>/failing.fixture.md`
  - Step 2: update rule logic in `/.vscode/custom-rules/<rule>.js`
  - Step 3: run tests and lint before committing
