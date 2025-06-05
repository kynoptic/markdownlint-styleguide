# Project roadmap

## Overview

This document outlines a conservative development plan for **markdownlint-trap**. The focus is to create a solid base around the existing rules before exploring advanced features.

## Short-term goals

- **Package publishing** – Prepare for publishing to npm so the custom rules can be easily consumed. Include build scripts and update the `README` with installation steps.
- **Automated CI** – Configure GitHub Actions to run tests and markdownlint on each pull request.
- **Additional rules** – Evaluate gaps and add only essential rules, such as descriptive link text, correct list numbering, and trailing whitespace checks
- **Improved test coverage** – Add edge case fixtures to better exercise rule logic. Ensure each rule has comprehensive Jest tests.
- **Documentation clean up** – Consolidate existing docs and add usage examples showing common configurations.

## Medium-term goals

- **VS Code integration** – Provide configuration examples or an extension pack to make using the rules in VS Code straightforward.
- **Configuration presets** – Offer recommended markdownlint configuration presets that bundle the custom rules with sensible defaults.
- **Contribution guidelines** – Add `CONTRIBUTING.md` with instructions for adding new rules and submitting issues.
- **Changelog automation** – Use a release workflow to generate changelog entries and tag versions automatically.

## Long-term goals

- **Integration tests** – Validate the rules in real-world repositories to catch issues that don't surface in unit tests.
- **Community engagement** – Encourage external contributions, gather feedback, and curate a list of projects using the rules.

## Summary

Following this roadmap will help the project mature into a robust set of Markdown linting tools with solid documentation, tests, and community support.
