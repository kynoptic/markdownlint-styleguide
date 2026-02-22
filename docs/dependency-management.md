# Dependency management

## Overview

This project uses **Renovate** to automate dependency updates, security patches, and lockfile maintenance. Renovate runs on a schedule and creates pull requests when updates are available, with automatic merging enabled for low-risk updates that pass CI.

## How it works

### Update schedule

- **Security updates**: Created immediately when detected (any time)
- **Routine updates**: Created weekly on Monday mornings (before 6am ET)
- **Lockfile maintenance**: Weekly on Monday mornings
- **Manual triggers**: Available through the Dependency Dashboard

### Grouping strategy

Related packages are grouped into single PRs to reduce noise and simplify review:

- **ESLint ecosystem**: ESLint core + plugins + config packages
- **Jest ecosystem**: Jest core + plugins + types
- **markdownlint ecosystem**: markdownlint + markdownlint-cli2
- **Commit hooks**: Husky + lint-staged

### Auto-merge policy

Updates are automatically merged if they meet ALL criteria:

1. **Dev dependencies only** (not production dependencies)
2. **Patch or minor versions** (not major versions)
3. **All CI checks pass** (lint + full test suite)
4. **No merge conflicts**

**Manual review required for:**

- Production dependencies (`dependencies` in `package.json`)
- Major version updates (any dependency)
- Updates that fail CI checks
- Updates with merge conflicts

### Pull request format

Renovate PRs include:

- Package name, current version, and target version
- Link to changelog and release notes
- Full dependency change list
- Auto-merge status indicator
- Dependency dashboard link

## Configuration

The Renovate configuration lives in `.github/renovate.json` and uses:

- **Base preset**: `config:recommended` (Renovate's recommended defaults)
- **Lockfile maintenance**: Weekly with auto-merge
- **Semantic commits**: Enabled for conventional commit format
- **Separate major releases**: Major versions get dedicated PRs
- **Range strategy**: Bump to exact versions (no ranges)

Key settings:

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

## Workflow for maintainers

### Reviewing update PRs

1. **Check the PR title**: Should follow format `chore(deps): update <group> to <version>`
2. **Review the changelog**: Click through to release notes for breaking changes
3. **Verify CI status**: All checks must pass (lint, tests, security scan)
4. **Check dependency dashboard**: View pending updates and priorities

### Handling Auto-merge

**Dev dependency patches/minors** will auto-merge if CI passes. If you need to prevent this:

1. Comment on the PR with `!automerge` to disable
2. Review changes manually
3. Merge when satisfied or close to reject

### Manual intervention scenarios

**Scenario: Security update fails tests**

1. Renovate creates PR immediately (labeled `security`, `dependencies`)
2. CI fails due to breaking change in security patch
3. Fix tests in the update branch OR pin to previous version temporarily
4. Document in `osv-scanner.toml` if temporary ignore needed

**Scenario: Major version with breaking changes**

1. Renovate creates PR (labeled `major-version`, requires manual review)
2. Review migration guide in release notes
3. Update code to handle breaking changes
4. Run full test suite locally before merging
5. Consider batching multiple major updates into a single maintenance PR

**Scenario: Update conflicts with in-progress work**

1. Close the Renovate PR with comment explaining conflict
2. Re-open issue on Dependency Dashboard when ready
3. Renovate will recreate PR on next schedule

### Emergency overrides

To bypass automation for urgent fixes:

```bash
# Manually update dependency
npm install --save-exact <package>@<version>

# Commit with conventional format
git add package.json package-lock.json
git commit -m "fix(deps): emergency update <package> to <version>

Bypassing Renovate for critical security fix.
Refs: <issue-or-cve-link>"

# Push and create PR
git push
gh pr create --title "Emergency: <description>"
```

## Dependency dashboard

Renovate maintains an issue titled **"Dependency updates dashboard"** that shows:

- All pending updates
- Rate-limited updates
- Errored updates
- Ignored dependencies
- Manual trigger buttons

Access at: `/issues` (look for Renovate issue)

## Monitoring and metrics

Track dependency health with:

- **Update latency**: Time from release to merged PR (target: <7 days for patches)
- **Security response**: Time from CVE to fix (target: <24 hours)
- **Auto-merge rate**: Percentage of updates auto-merged (target: >70%)
- **CI failure rate**: Updates that fail tests (target: <10%)

Review metrics quarterly to tune configuration.

## Troubleshooting

### Renovate not creating PRs

**Possible causes:**

- Schedule hasn't triggered yet (weekly on Monday)
- Rate limit reached (`prConcurrentLimit: 5`)
- Dependency ignored in config
- GitHub App permissions issue

**Solution:**

1. Check Dependency Dashboard for status
2. Verify `.github/renovate.json` syntax with JSON schema validator
3. Manually trigger from dashboard if urgent

### Auto-merge not working

**Possible causes:**

- CI checks haven't passed yet
- Branch protection rules prevent auto-merge
- Dependency is production (not dev)
- Update is major version

**Solution:**

1. Check PR for auto-merge label and status
2. Verify CI passed (all checks green)
3. Check branch protection settings in repo settings
4. Review `packageRules` in `renovate.json` for auto-merge criteria

### Too many PRs at once

**Solution:**

1. Adjust `prConcurrentLimit` in config (currently 5)
2. Add more package groups to batch related updates
3. Change schedule to less frequent (e.g., biweekly)
4. Close PRs and batch manually into maintenance PR

### Lockfile conflicts

**Solution:**

1. Renovate will automatically rebase and update lockfile
2. If conflicts persist, close PR and reopen from dashboard
3. For manual fixes: checkout branch, run `npm install`, push

## Configuration reference

Full configuration options: `https://docs.renovatebot.com/configuration-options/`

Common customizations:

```json
{
  "ignoreDeps": ["package-name"],           // Skip specific packages
  "schedule": ["before 6am on Monday"],     // Change update schedule
  "prConcurrentLimit": 5,                   // Max simultaneous PRs
  "automerge": true,                        // Enable/disable auto-merge
  "rangeStrategy": "bump"                   // Version range strategy
}
```

## Best practices

1. **Review breaking changes**: Always check release notes before merging major updates
2. **Test locally**: For major updates, pull branch and test manually before merge
3. **Monitor CI**: If tests start failing frequently, review package grouping
4. **Keep config lean**: Start with defaults, add rules only when needed
5. **Document overrides**: If ignoring a dependency, explain why in config

## Related

- **ADR 002**: Automated dependency updates with Renovate
- **CI configuration**: `.github/workflows/ci.yml`
- **Security scanning**: `osv-scanner.toml`
- **Package manifest**: `package.json`, `package-lock.json`
