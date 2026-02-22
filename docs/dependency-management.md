# Dependency management

## Overview

**Renovate** automates dependency updates, security patches, and lockfile maintenance. Renovate creates pull requests on a schedule and auto-merges low-risk updates that pass CI.

## Update schedule

- **Security updates**: Created immediately when detected
- **Routine updates**: Created weekly, Monday mornings before 6am ET
- **Lockfile maintenance**: Weekly, Monday mornings
- **Manual triggers**: Available from the Dependency Dashboard

## Grouping strategy

Related packages group into single PRs to reduce noise and simplify review:

- **ESLint ecosystem**: ESLint core + plugins + config packages
- **Jest ecosystem**: Jest core + plugins + types
- **markdownlint ecosystem**: markdownlint + markdownlint-cli2
- **Commit hooks**: Husky + lint-staged

## Auto-merge policy

Renovate auto-merges updates that meet ALL criteria:

1. **Dev dependencies only** (not production dependencies)
2. **Patch or minor versions** (not major versions)
3. **All CI checks pass** (lint + full test suite)
4. **No merge conflicts**

Review manually: production dependencies, major versions, CI failures, and merge conflicts.

## Configuration

Renovate configuration lives in `.github/renovate.json`:

```json
{
  "schedule": ["before 6am on Monday"],
  "prConcurrentLimit": 5,
  "rangeStrategy": "bump",
  "semanticCommits": "enabled",
  "lockFileMaintenance": {
    "enabled": true,
    "automerge": true
  }
}
```

See the [Renovate documentation](https://docs.renovatebot.com/configuration-options/) for all configuration options.

## Workflow for maintainers

### Reviewing update PRs

- Confirm the PR title follows `chore(deps): update <group> to <version>` format
- Review the changelog and release notes for breaking changes
- Verify all CI checks pass (lint, tests, security scan)

### Manual intervention

- **Security update fails tests**: Fix tests in the update branch, or pin the previous version and document the pin in `osv-scanner.toml`
- **Major version with breaking changes**: Review the migration guide, update code, and run the full test suite locally before merging
- **Update conflicts with in-progress work**: Close the Renovate PR with a comment. Reopen from the Dependency Dashboard when ready

## Related

- **ADR 002**: Automated dependency updates with Renovate
- **CI configuration**: `.github/workflows/ci.yml`
- **Security scanning**: `osv-scanner.toml`
- **Renovate docs**: [renovatebot.com/docs](https://docs.renovatebot.com/)
