<!--
PR title guidance: Summarize the solution, not the problem
Use clear, solution-oriented title describing what the commits accomplish
Example: "Add input validation for empty usernames"
Avoid conventional commit format for PR titles (no "feat:", "fix:", etc.)
-->

## Summary

Brief description of the changes and the problem being solved:

- Main changes implemented
- Problem or issue addressed
- Approach taken and rationale

## Test plan

### Automated testing

- [ ] Unit tests pass (`make unit`)
- [ ] Integration tests pass (`make test-integration`)
- [ ] Full test suite passes (`make test`)
- [ ] All quality checks pass (`make full`)

### Manual testing

- [ ] Full pipeline runs successfully (`ultimate-ranks run`)
- [ ] Tested with representative data
- [ ] Edge cases and error conditions verified
- [ ] Performance impact assessed (if applicable)

### Test coverage

- [ ] New functionality has comprehensive tests
- [ ] Test coverage maintained or improved
- [ ] Tests follow behavioral naming (`test_should_X_when_Y`)
- [ ] Tests focus on meaningful behavior, not implementation details

## Breaking changes

- List any breaking changes to public APIs
- Include migration steps or configuration changes needed
- Document deprecation timeline if applicable

## Performance and reliability

- [ ] Memory usage impact considered (especially for PHP memory limits)
- [ ] Circuit breaker/retry patterns implemented where appropriate
- [ ] Logging added for debugging and monitoring

## Code quality

- [ ] Type hints added for new code in covered modules
- [ ] Docstrings added for public APIs
- [ ] Error handling implemented with clear messages
- [ ] Functions maintain single responsibility
- [ ] Pre-commit hooks pass without modification

## Documentation

- [ ] Updated relevant documentation in `docs/`
- [ ] Added/updated docstrings for public functions
- [ ] Updated configuration examples if needed
- [ ] Created or updated ADR for significant architectural decisions
- [ ] Updated API changelog if API changes made

## QID resolution system (if applicable)

- [ ] QID mappings updated in `config/data/qid/`
- [ ] QID validation tests pass (`make qid-canonicalize-dryrun-strict`)
- [ ] QID parity checks pass (`make check-qid-parity`)
- [ ] Ambiguous name validation passes (`make validate-ambiguous-names`)

## Conventional commit compliance

- [ ] PR title uses solution-oriented summary (not conventional commit format)
- [ ] Individual commits follow conventional commit format: `<type>[scope]: <description>`
- [ ] Scope indicates module/component affected (e.g., `cli`, `qid`, `pipeline`)
- [ ] Semantic versioning impact: **PATCH** / **MINOR** / **MAJOR**

## Additional context

- Link to related issues or user stories
- Screenshots or examples (if applicable)
- Notes for reviewers about specific areas of focus
- Dependencies on other PRs or external changes
