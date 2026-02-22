# ADR 003: Automated dependency updates with Renovate

## Status

Accepted

## Context

Manual dependency updates are time-consuming, error-prone, and often delayed, resulting in:

- Security patches not applied promptly
- Missing bug fixes and performance improvements
- Growing gaps between current and latest versions, increasing update risks
- Maintainer time spent on repetitive tasks instead of features
- Accumulated technical debt from outdated tooling

The project currently has vulnerable dependencies detected by osv-scanner:

- `glob` 11.0.3 → 11.1.0 (high severity)
- `js-yaml` 4.1.0 → 4.1.1 (medium severity)
- `js-yaml` 3.14.1 → 3.14.2 (medium severity, dev dependency)

We need an automated solution that balances keeping dependencies current with maintaining stability and preventing breaking changes.

## Decision

We will implement automated dependency management using **Renovate** with the following configuration:

**Core capabilities:**

- Automated PR creation for dependency updates with lockfile verification
- Security updates prioritized and created immediately
- Grouped updates for related packages (ESLint plugins, Jest ecosystem, etc.)
- Auto-merge for passing dev dependency patch updates
- Manual review required for major version bumps
- Full test suite + linting on every update PR
- Changelog links and release notes in PR descriptions

**Configuration priorities:**

1. **Security first**: Immediate high-priority PRs for security advisories
2. **Stability**: Separate security updates (immediate) from routine updates (batched weekly)
3. **Quality gates**: All updates must pass CI (lint + full test suite)
4. **Lockfile integrity**: Enable lockfile maintenance and verification
5. **Semantic grouping**: Batch related packages to reduce PR volume

## Alternatives considered

### Option A: GitHub Dependabot

**Pros:**

- Native GitHub integration (zero setup beyond config file)
- Built-in security alerts integration
- Simpler configuration for basic use cases
- No external service dependencies

**Cons:**

- Limited grouping capabilities (basic ecosystem grouping only)
- No custom scheduling flexibility
- Cannot auto-merge based on dependency type
- Less control over PR formatting and metadata
- Limited configuration for monorepo scenarios

### Option B: Manual updates with `npm outdated`

**Pros:**

- Complete control over update timing
- No automation complexity
- No risk of unexpected breaking changes

**Cons:**

- Time-consuming and error-prone
- Security patches delayed
- Inconsistent application across team
- Does not scale as project grows
- Already causing problems (current security failures)

### Option C: Renovate (Selected)

**Pros:**

- Highly flexible grouping and scheduling
- Auto-merge capabilities with custom rules
- Rich PR descriptions with changelogs
- Lockfile maintenance and verification
- Custom presets for package ecosystems
- Can batch related updates intelligently
- Open source with active community

**Cons:**

- More complex configuration than Dependabot
- Requires GitHub App installation
- Steeper learning curve for advanced features

**Decision rationale**: Renovate's flexibility in grouping, auto-merge rules, and scheduling outweighs the configuration complexity. The ability to auto-merge dev dependency patches while requiring manual review for breaking changes provides the right balance of automation and safety.

## Consequences

**Positive:**

- Security vulnerabilities patched within hours instead of weeks
- Reduced maintainer burden for routine updates
- Consistent, reproducible dependency management
- Lockfile integrity automatically verified
- Clear audit trail of what changed and why (through PRs)
- Grouped updates reduce noise and review overhead

**Negative:**

- Initial setup and configuration effort
- Team must learn Renovate configuration options
- Potential for automated PRs to create noise if misconfigured
- Requires GitHub App permissions (repo access)
- Auto-merge carries risk if tests have poor coverage

**Mitigations:**

- Comprehensive test suite already in place (unit, feature, integration, performance)
- CI must pass before any auto-merge occurs
- Manual review required for major versions and production dependencies
- Start conservative, expand automation as confidence grows
- Document override procedures for emergency bypasses

**Configuration strategy:**

1. **Week 1**: Enable with manual review for all updates (no auto-merge)
2. **Week 2**: Enable auto-merge for dev dependency patches only
3. **Week 3**: Expand to auto-merge for production dependency patches (if confidence high)
4. **Ongoing**: Adjust grouping and scheduling based on actual PR volume

## Implementation checklist

- [x] Create `.github/renovate.json` configuration
- [x] Configure package grouping (ESLint, Jest, markdownlint, etc.)
- [x] Set security update priority to immediate
- [x] Enable lockfile maintenance
- [x] Configure auto-merge rules for dev dependencies
- [x] Document workflow in project documentation
- [x] Test configuration with dry-run (validate JSON)
- [x] Enable Renovate GitHub App for repository

## Testing strategy

Since Renovate runs as a GitHub App on actual dependency updates, traditional unit tests are not applicable. Instead, validation focuses on:

1. **Configuration validation**: JSON schema validation of `renovate.json`
2. **Dry-run testing**: Use Renovate CLI to validate config without creating PRs
3. **Initial observation**: Monitor first week of PRs for correct grouping and prioritization
4. **Policy validation**: Verify auto-merge triggers only for intended scenarios
5. **Edge cases**: Document expected behavior for conflicting updates and registry outages

**Monitoring metrics:**

- Time from security advisory to merged fix
- Number of PRs per week (should decrease with grouping)
- Auto-merge success rate (target: >90% for dev dependencies)
- False positive rate for test failures on updates

## Documentation updates

- Add "Dependency management" section to `CLAUDE.md`
- Create `docs/dependency-management.md` explaining workflow
- Update README with automated update badges (optional)
- Document override procedures for emergency patches

## References

- Issue #76: Dependency updates lack automation and lockfile verification
- Renovate documentation: `https://docs.renovatebot.com/`
- Renovate configuration reference: `https://docs.renovatebot.com/configuration-options/`
- GitHub Dependabot comparison: `https://docs.renovatebot.com/migrating-to-renovate/`
- Current security failures in CI (osv-scanner alerts)
