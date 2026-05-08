<!--
PR title guidance: Summarize the solution, not the problem
Use clear, solution-oriented title describing what the commits accomplish
Example: "Add input validation for empty usernames"
Avoid conventional commit format for PR titles (no "feat:", "fix:", etc.)

Checklist guidance: every item is in scope by default. Walk the tier ladder
before marking anything *(optional)*: CLI → browser automation
(mcp__claude-in-chrome__*) → other MCP/API tooling → human verification.
Reserve *(optional)* for items that genuinely require human judgment with
no automation path (subjective design review, third-party UI behind SSO
with no API, physical hardware). Don't check a box you didn't verify.
-->

## Summary

Brief description of the changes and the problem being solved:

- Main changes implemented
- Problem or issue addressed
- Approach taken and rationale

## Test plan

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

- [ ] New functionality has comprehensive tests
- [ ] Test coverage maintained or improved
- [ ] Tests follow behavioral naming (`test_should_X_when_Y`)
- [ ] Tests focus on meaningful behavior, not implementation details

## Breaking changes

- List any breaking changes to public APIs
- Include migration steps or configuration changes needed

## Performance and reliability

- [ ] Memory usage impact considered
- [ ] Retry patterns and error handling implemented where appropriate
- [ ] Logging added for debugging and monitoring

## Code quality

- [ ] Type annotations added for new code
- [ ] Error handling implemented with clear messages
- [ ] Functions maintain single responsibility

## Documentation

<!-- ADRs belong before this PR (design time). Changelog and migration guides belong at release time. -->
- [ ] Docstrings added for new public functions
- [ ] API documentation updated if public APIs added or changed
- [ ] README updated if public-facing behavior changed

## Conventional commit compliance

- [ ] PR title uses solution-oriented summary (not conventional commit format)
- [ ] Individual commits follow conventional commit format: `<type>[scope]: <description>`
- [ ] Scope indicates module/component affected
- [ ] Semantic versioning impact: **PATCH** / **MINOR** / **MAJOR**

## Additional context

- Link to related issues or user stories
- Screenshots or examples (if applicable)
- Notes for reviewers about specific areas of focus
- Dependencies on other PRs or external changes
