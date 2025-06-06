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
- When authoring or modifying custom markdownlint rules, consult `.windsurf/workflows/local/markdownlint-rule-create.md` for the test-driven workflow.

## Commit style

- Start commit messages with a short imperative summary such as `feat: add rule` or `fix: handle edge case`.
- Wrap the first line at 72 characters or less.

## Pull request message

- Summarize key changes and reference the files that were modified.
- Include a **Testing** section describing the commands run and their results.
