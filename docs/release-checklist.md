# Release checklist

This document provides a comprehensive checklist for releasing new versions of markdownlint-trap, aligned with semantic versioning guidelines and optimized for AI agent workflows.

## Pre-release validation

### Code quality gates

- [ ] **Complete validation**: `npm run validate` (runs lint, build, and tests)
- [ ] **Performance tests pass**: `npm run test:performance`
- [ ] **Integration tests pass**: `npm run test:integration`
- [ ] **External validation passes** (optional): `npm run test:integration:external`
- [ ] **Husky hooks are functional**: Test pre-commit and pre-push hooks work correctly

### Version determination

Follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html) strictly. Analyze both commit messages AND actual code changes:

- [ ] **PATCH (x.y.Z)**: Bug fixes, type annotations, test improvements, documentation, internal refactoring
- [ ] **MINOR (x.Y.0)**: New features, new CLI commands, new user-facing functionality
- [ ] **MAJOR (X.0.0)**: Breaking changes, API changes, removed functionality

**Critical**: Use the lowest increment unless there is strong evidence at BOTH commit message level AND actual code diff level.

### Evidence analysis

- [ ] **Review commit history**: `git log --oneline $(git describe --tags --abbrev=0)..HEAD`
- [ ] **Review code changes**: `git diff $(git describe --tags --abbrev=0)..HEAD`
- [ ] **Verify no breaking changes** unless intentional for major release
- [ ] **Confirm new features** are user-facing (not just internal improvements)

## Changelog preparation

- [ ] **Update CHANGELOG.md** following [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format
- [ ] **Move items from [Unreleased]** to new version section
- [ ] **Categorize changes correctly**:
  - `Added` for new features
  - `Changed` for changes in existing functionality
  - `Deprecated` for soon-to-be removed features
  - `Removed` for now removed features
  - `Fixed` for any bug fixes
  - `Security` for vulnerability fixes
- [ ] **Include date** in ISO format (YYYY-MM-DD)
- [ ] **Add comparison links** at bottom of file

## Package preparation

- [ ] **Update package.json version** to match release version
- [ ] **Verify package.json metadata** (description, keywords, repository)
- [ ] **Check dependencies** are up to date and secure
- [ ] **Validate package.json** with `npm pack --dry-run`

## Documentation updates

- [ ] **Update version references** in documentation
- [ ] **Regenerate config documentation**: `npm run docs:config`
- [ ] **Update README.md** if new features require documentation
- [ ] **Verify example configurations** still work
- [ ] **Update rule documentation** if rules have changed

## Build and distribution

- [ ] **Clean build**: `npm run prebuild && npm run build`
- [ ] **Verify build artifacts** in `.markdownlint-rules/` directory
- [ ] **Test installation** in separate directory:

  ```bash
  cd /tmp && mkdir test-install && cd test-install
  npm init -y
  npm install /path/to/markdownlint-trap
  # Test basic functionality
  ```

## Release execution

### Git workflow

- [ ] **Commit all changes**: `git add -A && git commit`
- [ ] **Create release tag**: `git tag -a v1.x.y -m "Release v1.x.y"`
- [ ] **Push changes**: `git push origin main`
- [ ] **Push tags**: `git push origin --tags`

### NPM publishing

- [ ] **Verify npm authentication**: `npm whoami`
- [ ] **Dry run publish**: `npm publish --dry-run`
- [ ] **Publish package**: `npm publish`
- [ ] **Verify publication**: `npm view markdownlint-trap@latest`

### GitHub release

- [ ] **Create GitHub release** from tag
- [ ] **Copy changelog entries** into release notes
- [ ] **Attach any additional assets** if needed
- [ ] **Mark as pre-release** if beta/alpha version

## Post-release validation

- [ ] **Install from npm**: `npm install -g markdownlint-trap@latest`
- [ ] **Test basic functionality** on sample markdown files
- [ ] **Verify documentation** links work correctly
- [ ] **Check npm package page** for correct metadata
- [ ] **Monitor for issues** in first 24 hours

## Rollback procedures

If critical issues are discovered:

### Immediate response

- [ ] **Deprecate problematic version**: `npm deprecate markdownlint-trap@x.y.z "Critical issue - use x.y.w instead"`
- [ ] **Prepare hotfix** if possible
- [ ] **Communicate via GitHub issues** and release notes

### For breaking issues

- [ ] **Unpublish if <72 hours**: `npm unpublish markdownlint-trap@x.y.z`
- [ ] **Release hotfix version** with fix
- [ ] **Update documentation** with migration notes

## Agent workflow integration

This checklist is designed for both human and AI agent use:

### For AI agents

- [ ] **Verify all automated checks** pass before proceeding
- [ ] **Use git-commit-release-prepare agent** for atomic release workflow
- [ ] **Validate semantic versioning** with evidence analysis
- [ ] **Auto-generate changelog entries** from conventional commits
- [ ] **Perform dry-run validation** before actual publishing

### Human oversight

- [ ] **Review AI-generated changelog** for accuracy
- [ ] **Verify version increment** matches actual changes
- [ ] **Approve final publication** step
- [ ] **Monitor post-release** metrics and feedback

## Maintenance notes

- **Update this checklist** when release process evolves
- **Review checklist effectiveness** after each release
- **Keep security practices** current with npm best practices
- **Maintain backup procedures** for critical release artifacts
