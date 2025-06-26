# Project roadmap

This document outlines the development plan for `markdownlint-trap`. Our goal is to create a powerful, modern, and maintainable `set of` custom rules for `markdownlint`.

## 🎯 Current focus

These are the highest-priority items currently in development.

### 1. New Rule: `no-bare-urls`

This rule will enforce that URLs are wrapped in descriptive Markdown links (`[text](url)`), improving readability and accessibility.

- [ ] Implement rule logic to find bare URLs in text.
- [ ] Correctly ignore URLs inside code blocks, code spans, and existing links.
- [ ] Implement robust auto-fix functionality to wrap bare URLs.
- [ ] Create comprehensive test fixtures covering all edge cases.

### 2. Enhancements for `backtick-code-elements`

This rule needs refinement to reduce false positives and improve its contextual awareness.

- [ ] Refine the file path detection regular expression.
- [ ] Expand the `ignoredTerms` list and refactor for better maintainability.
- [ ] Enhance LaTeX context awareness to avoid flagging mathematical expressions.
- [ ] Implement a safe auto-fix for the rule.

## 🚀 Next up

Once the current focus is complete, we will move on to these items.

- [ ] **Rule Configuration**: Allow users to provide their own lists for `properNouns` and `technicalTerms` in the `sentence-case-heading` rule.
- [ ] **Enhanced Documentation**: Add missing JSDoc comments for all public functions and utilities.
- [ ] **Project Maintenance**:
  - [ ] Resolve any outstanding test runner regressions.
  - [ ] Run all tests to ensure no regressions before release.

## 📚 Backlog and future ideas

These are important goals that are not yet in the immediate development pipeline.

- [ ] **Automated Release Process**: Set up CI scripts to publish to `npm` and automatically generate changelogs.
- [ ] **VS Code Extension Integration**: Provide clear steps and configuration for bundling these rules into a VS Code extension.
- [ ] **Rule Enhancements**:
  - [ ] Expand the built-in `properNouns` and `technicalTerms` lists.
  - [ ] Strengthen suggestions for single-word headings.

---

## ✅ Completed

- [x] **Improved Test Coverage**: Added comprehensive Jest tests and edge case fixtures for all rules.
- [x] **Simplified Test Structure**: Mapped each fixture to a dedicated test file for improved clarity and maintenance.
- [x] **Auto-fix for `sentence-case-heading`**: Implemented a safe and effective auto-fix for the heading capitalization rule.
- [x] **Documentation Cleanup**: Consolidated existing docs, added usage examples, and created folder-level READMEs to explain subdirectories.
- [x] **Build System**: Fixed ES Module support in the Jest configuration.
