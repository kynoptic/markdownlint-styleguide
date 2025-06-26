# Project roadmap

This document outlines the development plan for `markdownlint-trap`. Our goal is to create a powerful, modern, and maintainable `set of` custom rules for `markdownlint`.

## 🚧 In progress: `backtick-code-elements` enhancements

This rule needs refinement to reduce false positives and improve its contextual awareness. We are currently working on the following items:

- [x] Refine the file path detection regular expression (including validation tests).
- [x] Expand the `ignoredTerms` list and refactor for better maintainability.
- [x] Enhance LaTeX context awareness to avoid flagging mathematical expressions.
- [x] Implement a safe auto-fix for the rule.

## 🎯 Next up

These are the highest-priority items once the current work is complete.

- [x] **Enhanced documentation**: Add missing JSDoc comments for all public functions and utilities.
- [x] **Project maintenance**:
  - [x] Resolve any outstanding test runner regressions.
  - [x] Run all tests to ensure no regressions before release.

## 📚 Backlog and future ideas

These are important goals that are not yet in the immediate development pipeline.

- [ ] **Automated release process**: Set up CI scripts to publish to `npm` and automatically generate changelogs.
- [ ] **VS Code extension integration**: Provide clear steps and configuration for bundling these rules into a VS Code extension.
- [ ] **Rule enhancements**:
  - [ ] Expand the built-in `properNouns` and `technicalTerms` lists.
  - [ ] Strengthen suggestions for single-word headings.

---

## ✅ Completed

- [x] **Rule configuration**: Allow users to provide their own lists for `properNouns` and `technicalTerms` in the `sentence-case-heading` rule.
- [x] **New Rule: `no-bare-urls`**: Implemented a rule to enforce that URLs are wrapped in descriptive Markdown links, complete with auto-fix, context awareness (ignores code and links), and comprehensive tests.
- [x] **Improved Test Coverage**: Added comprehensive Jest tests and edge case fixtures for all rules.
- [x] **Simplified Test Structure**: Mapped each fixture to a dedicated test file for improved clarity and maintenance.
- [x] **Auto-fix for `sentence-case-heading`**: Implemented a safe and effective auto-fix for the heading capitalization rule.
- [x] **Documentation Cleanup**: Consolidated existing docs, added usage examples, and created folder-level READMEs to explain subdirectories.
- [x] **Build System**: Fixed ES Module support in the Jest configuration.
