---
name: Bug
about: Report a bug or issue
title: ''
labels: bug
assignees: ''
---

<!--
Title guidance: Use plain English to describe what's broken or unexpected
Example: "Crash when saving profile with empty username"
Avoid conventional commit format for issues (no "fix:", "bug:", etc.)
-->

## Summary

<One line description of the bug.>

## Job it breaks

<The one thing the person can no longer do.>

<!--
Bugs skip the story machinery — the broken job is usually obvious. No
behavior-change field either: bugs restore behavior, they don't create it.
-->

## Expected behavior

<What should happen instead.>

## Actual behavior

<What actually happens (include error messages, logs, screenshots).>

## Fix vs. workaround

- **Fix**: <the real repair>
- **Workaround**: <what unblocks the person today, or "none">

<!-- Keeps the cheap option visible next to the expensive one. -->

## Proposed solution

<How we'll fix it (technical approach if known).>

## Ongoing tax

<none | local | permanent — what must be supported forever once this is fixed.>

<!-- How often people hit this is a `frequency:` label, not a field here. -->

## Acceptance criteria (testable)

- [ ] GIVEN … WHEN … THEN …
- [ ] …
- [ ] Documentation updated if needed

## Testing strategy (test-first)

<!--
Follow test-first approach with meaningful behavioral tests
Avoid vanity tests that only verify framework behavior or trivial operations
-->

- **Unit tests**:
- **Integration/E2E tests**:
- **Edge cases**:
- **Regression tests**:

## Links

- **ADRs**: `ADR-XXX`
- **Related issues**: `#XXX`
