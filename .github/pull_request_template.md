<!--
PR title guidance: Summarize the solution, not the problem
Use clear, solution-oriented title describing what the commits accomplish
Example: "Add input validation for empty usernames"
Avoid conventional commit format for PR titles (no "feat:", "fix:", etc.)

Change class: delete the sections below that don't apply to this change. What
remains declares the class, and the checklist gate fails on any box left
unchecked — so deleting is how you scope, not skipping. A schema change keeps
both the logic and schema sections.

Checklist guidance: every item in a section you keep is in scope. Walk the tier
ladder before marking anything *(optional)*: CLI → browser automation
(mcp__claude-in-chrome__*) → other MCP/API tooling → human verification.
Reserve *(optional)* for items that legitimately require human judgment with
no automation path (subjective design review, third-party UI behind SSO
with no API, physical hardware). Don't check a box you didn't verify.
-->

## Summary

Brief description of the changes and the problem being solved:

- Main changes implemented
- Problem or issue addressed
- Approach taken and rationale

## Copy/UI changes

<!-- Delete this section if the change renders nothing. -->

- [ ] Rendered output checked against the acceptance criteria, not just the code
- [ ] Screenshots or recordings attached for each changed view
- [ ] Empty and error states verified, not just the populated happy path

### Accessibility gate

<!--
Four items, binary, merge conditions rather than aspirations. Their value is
that they always get read — do not extend this list.
-->

- [ ] Keyboard reachable
- [ ] Contrast passes WCAG AA
- [ ] Touch targets ≥ 44px
- [ ] Form controls labeled

## Logic changes

<!-- Delete this section only if the change renders copy and nothing else. -->

### Automated testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Full test suite passes
- [ ] All quality checks pass (linting, type checking, etc.)

### Manual testing

<!-- "Manual" describes how a human would verify these — not an exemption from automation.
Drive UI flows with mcp__claude-in-chrome__* before treating anything as human-only. -->
- [ ] Tested with representative data
- [ ] Edge cases and error conditions verified
- [ ] Performance impact assessed *(optional — quantitative judgment)*

### Test coverage

- [ ] Test coverage maintained or improved
- [ ] Tests follow behavioral naming (`test_should_X_when_Y`)
- [ ] Each new test was watched to fail before it passed

### Code quality

- [ ] Type annotations added for new code; type coverage did not decrease

## Schema/model changes

<!-- Keep the logic section above as well. Delete this one if no object, schema, or migration is touched. -->

- [ ] ADR linked for the object-model change: `ADR-XXX`
- [ ] Migration steps documented, including the rollback path
- [ ] Migration exercised against representative data, not an empty database
- [ ] Reversibility policy unchanged for the object, or the change applies to every mutation on it

## Breaking changes

- List any breaking changes to public APIs
- Include migration steps or configuration changes needed

## Documentation

<!-- ADRs belong before this PR (design time). Changelog and migration guides belong at release time. -->
- [ ] Docstrings added for new public functions
- [ ] API documentation updated if public APIs added or changed
- [ ] README updated if public-facing behavior changed

## Additional context

- Link to related issues or stories
- Screenshots or examples (if applicable)
- Notes for reviewers about specific areas of focus
- Dependencies on other PRs or external changes
