# Project roadmap

This document outlines the development priorities for `markdownlint-trap`. Our primary goal is to provide robust, accurate, and developer-friendly linting rules to enforce consistent and high-quality Markdown.

The roadmap is organized by key focus areas and provides a high-level overview of planned work.

## Guiding principles

- **Accuracy over speed**: Prioritize reducing false positives and negatives, even if it means a minor performance trade-off.
- **Excellent autofix**: Autofix suggestions should be safe, idempotent, and require minimal manual intervention.
- **Comprehensive testing**: Every rule, feature, and bug fix must be accompanied by thorough tests covering edge cases.
- **Clear documentation**: Rules, configuration, and contribution guidelines should be easy to understand and follow.

---

## Rule hardening and test infrastructure

This phase focuses on improving the robustness of existing rules and expanding our testing capabilities to catch regressions and edge cases effectively.

### Sentence-case-heading (SCH) rule enhancements

- [x] **Expand proper noun dictionary**: Research and add more commonly used technical terms, brand names, and acronyms to the default ignored list to reduce false positives.
- [x] **Improve acronym detection**: Enhance logic to better distinguish between acronyms (e.g., `API`, `JSON`) and words that should be lowercased in a heading.
- [x] **Handle complex in-line elements**: Ensure the rule correctly handles headings that contain links, multiple code spans, or other Markdown syntax.
- [x] **Numbered heading support**: Properly handle numbered headings like "## 1. Article weighting algorithm" with correct sentence case rules.

### Backtick-code-elements (BCE) rule enhancements

- [x] **Refine heuristics**: Improve the detection algorithm to better differentiate between technical terms that need backticks and similar-looking words in natural language.
- [x] **Improve path and URL detection**: Reduce false positives for sentence fragments that resemble file paths or URLs but are not.
- [x] **Consolidate ignored terms**: Continue centralizing special-cased terms into a shared, configurable module to simplify maintenance and customization.

### Testing infrastructure

- [x] **Implement snapshot testing for autofix**: Add Jest snapshot tests for all autofix fixtures. This will make it easier to review the exact changes made by the autofix logic during development.
- [x] **Increase fixture coverage**: Add more complex and nuanced test fixtures for all rules, focusing on previously identified edge cases and community-reported issues.
- [x] **Integration testing**: Test rules against real-world repositories to identify edge cases and validate rule behavior at scale.

---

## Autofix quality and developer experience

This phase is dedicated to making the autofix feature more reliable and improving the overall experience for developers using and contributing to the project.

### Autofix improvements

- [ ] **Autofix safety improvements**: Add safety checks across all rules to prevent autofix in ambiguous cases and reduce false positive corrections.
- [ ] **Safe autofix for `backtick-code-elements`**: Add safety checks to the BCE autofix to prevent it from wrapping terms that have a high probability of being false positives.
- [ ] **Configurable autofix for `wt-no-bare-urls`**: Allow users to configure whether bare URLs are wrapped in angle brackets (`<url>`) or converted to a standard Markdown link (`url`).

### Documentation and usability

- [ ] **Rule configuration validation**: Validate user-provided configuration objects to catch configuration errors early and provide helpful error messages.
- [ ] **Detailed rule configuration guides**: Create `how-to` guides in the `/docs` directory for each rule, providing clear instructions on how to configure the rule and explaining all configuration options with clear examples.
- [ ] **Contribution workflow guide**: Write a step-by-step tutorial for adding a new rule, including how to create fixtures, write tests, and document the new functionality.
- [ ] **Improve error messages**: Refine the error messages reported by rules to be more descriptive and provide clearer instructions on how to fix the issue.

### Build and contribution workflow

- [x] **Fix build process for CommonJS compatibility**: Update the build script to output `.cjs` files instead of `.js` to ensure Node.js correctly interprets them as CommonJS modules, resolving runtime errors when using `markdownlint-cli2` locally.
- [x] **Implement `pre-commit/pre-publish` hooks**: A Husky-powered pre-commit hook now automatically runs the build and stages `.markdownlint-rules/` before each commit, ensuring the distributable rules are always in sync with the source code.

---

## Future directions

Looking further ahead, we plan to expand the rule set and improve integration with other tools.

### Priority 1 (Current focus)

- [ ] **Autofix safety improvements**: Add safety checks across all rules to prevent autofix in ambiguous cases and reduce false positive corrections.
- [ ] **Rule configuration validation**: Validate user-provided configuration objects to catch configuration errors early and provide helpful error messages.
- [ ] **Improve error messages**: Refine the error messages reported by rules to be more descriptive and provide clearer instructions on how to fix the issue.

### Priority 2 (Near-term)

- [ ] **`no-dead-internal-links`**: A rule to check for broken relative links to other Markdown files or headings within the repository.
- [ ] **Detailed rule configuration guides**: Create `how-to` guides in the `/docs` directory for each rule.
- [ ] **Multi-language acronym support**: Support for non-English technical terms and acronyms in sentence case rules.

### Priority 3 (Future)

- [ ] **`no-literal-ampersand`**: A rule to flag the use of a standalone ampersand (` & `) and provide a safe autofix to replace it with `and`.
- [ ] **Configurable language-specific rules**: Allow users to configure language-specific casing and formatting rules.
- [ ] **Contribution workflow guide**: Write a step-by-step tutorial for adding a new rule, including how to create fixtures, write tests, and document the new functionality.