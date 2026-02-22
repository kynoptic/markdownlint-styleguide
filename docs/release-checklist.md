# Release checklist

Checklist for releasing markdownlint-trap versions, aligned with semantic versioning and optimized for AI agent workflows.

## Pre-release validation

### Code quality gates

- [ ] **Complete validation**: `npm run validate` (runs lint, build, and tests)
- [ ] **Performance tests pass**: `npm run test:performance`
- [ ] **Integration tests pass**: `npm run test:integration`
- [ ] **External validation passes** (optional): `npm run test:integration:external`
- [ ] **Husky hooks are functional**: Test that pre-commit and pre-push hooks run correctly

### Version determination

Follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html) strictly. Analyze commit messages and actual code changes:

- [ ] **PATCH (`x.y.Z`)**: Bug fixes, type annotations, test improvements, documentation, internal refactoring
- [ ] **MINOR (`x.Y.0`)**: New features, new CLI commands, new user-facing functionality
- [ ] **MAJOR (`X.0.0`)**: Breaking changes, API changes, removed functionality

**Critical**: Use the lowest increment unless commit messages and code diffs both confirm a higher one.

### Evidence analysis

- [ ] **Review commit history**: `git log --oneline $(git describe --tags --abbrev=0)..HEAD`
- [ ] **Review code changes**: `git diff $(git describe --tags --abbrev=0)..HEAD`
- [ ] **Verify no breaking changes** unless intentional for a major release
- [ ] **Confirm new features** are user-facing, not just internal improvements

## Changelog preparation

- [ ] **Update `CHANGELOG.md`** following [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format
- [ ] **Move items from [Unreleased]** to new version section
- [ ] **Categorize changes**:
  - `Added` for new features
  - `Changed` for modified existing functionality
  - `Deprecated` for features scheduled for removal
  - `Removed` for removed features
  - `Fixed` for bug fixes
  - `Security` for vulnerability fixes
- [ ] **Include date** in ISO format (YYYY-MM-DD)
- [ ] **Add comparison links** at bottom of file

## Package preparation

- [ ] **Update `package.json` version** to match release version
- [ ] **Verify `package.json` metadata**: description, keywords, repository
- [ ] **Check dependencies** for currency and security
- [ ] **Validate `package.json`** with `npm pack --dry-run`

## Documentation updates

- [ ] **Update version references** in documentation
- [ ] **Regenerate config documentation**: `npm run docs:config`
- [ ] **Update `README.md`** if new features need documentation
- [ ] **Verify example configurations** still work
- [ ] **Update rule documentation** if rules have changed

## Distribution verification

- [ ] **Dry-run pack**: `npm pack --dry-run` — verify included files
- [ ] **Test installation** in a clean directory:

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

### npm Publishing

- [ ] **Verify `npm authentication`**: `npm whoami`
- [ ] **Dry run publish**: `npm publish --dry-run`
- [ ] **Publish package**: `npm publish`
- [ ] **Verify publication**: `npm view markdownlint-trap@latest`

### GitHub release

- [ ] **Create GitHub release** from tag
- [ ] **Copy changelog entries** into release notes
- [ ] **Attach additional assets** if needed
- [ ] **Mark as pre-release** for beta/alpha versions

## Post-release validation

- [ ] **Install from npm**: `npm install -g markdownlint-trap@latest`
- [ ] **Test basic functionality** on sample Markdown files
- [ ] **Verify documentation links** resolve correctly
- [ ] **Check `npm package` page** for correct metadata
- [ ] **Monitor for issues** during the first 24 hours

## Rollback procedures

If a critical issue surfaces:

### Immediate response

- [ ] **Deprecate problematic version**: `npm deprecate markdownlint-trap@x.y.z "Critical issue - use x.y.w instead"`
- [ ] **Prepare hotfix** if feasible
- [ ] **Notify users** via GitHub issues and release notes

### For breaking issues

- [ ] **Unpublish if <72 hours**: `npm unpublish markdownlint-trap@x.y.z`
- [ ] **Release hotfix version** with fix
- [ ] **Add migration notes** to documentation

## Agent workflow integration

Both humans and AI agents use this checklist:

### For AI agents

- [ ] **Verify all automated checks** pass before proceeding
- [ ] **Use git-commit-release-prepare agent** for atomic release workflow
- [ ] **Validate semantic versioning** against evidence
- [ ] **Generate changelog entries** from conventional commits
- [ ] **Run dry-run validation** before publishing

### Human oversight

- [ ] **Review AI-generated changelog** for accuracy
- [ ] **Verify version increment** matches actual changes
- [ ] **Approve final publish** step
- [ ] **Monitor post-release** metrics and feedback

## Maintenance notes

- **Update this checklist** as the release process evolves
- **Review checklist effectiveness** after each release
- **Keep security practices** current with npm best practices
- **Back up** critical release artifacts
