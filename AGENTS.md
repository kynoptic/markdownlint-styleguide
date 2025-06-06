# Agent guidelines

This repository contains custom markdownlint rules implemented in JavaScript. Follow these instructions when making changes.

## Required checks

- Always run `npm test` to execute the Jest test suite.
- Lint Markdown with `npx markdownlint-cli2 "**/*.md"`. Fix any reported issues.
- If dependencies are not installed, run `npm install` first.

## Coding conventions

- Use **ES modules** and keep code compatible with `Node.js` v14 or newer.
- Document functions with **JSDoc**.
- Follow the naming conventions outlined in `docs/project-stack.md`.
- Markdown headings should be written in **sentence case**.
- Place rule modules under `.vscode/custom-rules/` and follow `.windsurf/rules/local/markdownlint-custom-rules.md`.
- When authoring or modifying custom markdownlint rules, consult `.windsurf/workflows/local/markdownlint-rule-create.md` for the test-driven workflow and update `docs/rules.md`.

## Test file conventions

- Write one test suite per behavior group under `tests/`.
- Use descriptive names that express expected outcomes.
- Focus on observable results rather than internal logic.
- Keep fixtures minimal and include edge cases and failures.

## Commit style

- Use the Conventional Commits `<type>: <subject>` format with no scope.
- Limit the subject line to 50 characters.
- Leave a blank line before the body.
- Write body lines as bullets under 72 characters.
- Describe what changed and why in each bullet.

## Pull request message

- Summarize key changes and reference the files that were modified.
- Include a **Testing** section describing the commands run and their results.
