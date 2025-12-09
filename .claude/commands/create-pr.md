Create pull request from completed feature branch with inherited issue metadata.

Push feature branch, create pull request with proper metadata inheritance from linked issue, and establish issue linkage for automatic closure on merge.

## Prerequisites

- Feature branch exists with committed changes
- All tests passing (`make test-tiered` or equivalent)
- Acceptance criteria verified and fulfilled
- Issue number known
- Clean working tree (all changes committed)

## Process

### 1. Verify branch and issue readiness

```bash
# Ensure working tree is clean
if ! git diff-index --quiet HEAD --; then
    echo "❌ Working tree has uncommitted changes. Commit or stash them first."
    exit 1
fi

# Verify issue exists and get details
ISSUE_NUM=123
gh issue view $ISSUE_NUM || {
    echo "❌ Issue #$ISSUE_NUM not found"
    exit 1
}

# Confirm current branch follows naming convention
CURRENT_BRANCH=$(git branch --show-current)
if [[ ! $CURRENT_BRANCH =~ ^issue-[0-9]+-[a-z0-9-]+$ ]]; then
    echo "⚠️  Branch name '$CURRENT_BRANCH' doesn't follow 'issue-<number>-<slug>' convention"
    read -p "Continue anyway? (y/N): " confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi
```

### 2. Push feature branch

```bash
# Push branch with upstream tracking
git push -u origin "$CURRENT_BRANCH"
```

### 3. Create pull request with metadata

```bash
# Extract issue title for PR title (solution-oriented)
ISSUE_TITLE=$(gh issue view $ISSUE_NUM --json title -q '.title')

# Create PR with comprehensive template
gh pr create \
  --title "$ISSUE_TITLE" \
  --body "$(cat <<'EOF'
## Summary

Brief description of the solution to the problem:
- Main changes implemented
- Problem or issue addressed
- Approach taken and rationale

Closes #ISSUE_NUM

## Test plan

Check these off with `-[x]` if you've confirmed they passed.

### Automated testing

- [ ] Unit tests pass (`make unit`)
- [ ] Integration tests pass (`make test-integration`)
- [ ] Full test suite passes (`make test`)
- [ ] All quality checks pass (`make full`)

### Manual testing

- [ ] Full pipeline runs successfully
- [ ] Tested with representative data
- [ ] Edge cases and error conditions verified
- [ ] Performance impact assessed

### Test coverage

- [ ] New functionality has comprehensive tests
- [ ] Test coverage maintained or improved
- [ ] Tests follow behavioral naming (`test_should_X_when_Y`)
- [ ] Tests focus on meaningful behavior, not implementation

## Breaking changes

None - backward compatible implementation

## Documentation

- [ ] Updated relevant documentation
- [ ] Added docstrings for new functions
EOF
)" | sed "s/ISSUE_NUM/$ISSUE_NUM/g"
```

**Note**: Customize the PR body template to match your specific implementation details.

### 4. Inherit issue metadata

```bash
# Copy labels from issue to PR
LABELS=$(gh issue view $ISSUE_NUM --json labels -q '.labels[].name' | tr '\n' ',' | sed 's/,$//')
if [ -n "$LABELS" ]; then
    gh pr edit --add-label "$LABELS"
    echo "✅ Copied labels from issue: $LABELS"
fi

# Copy assignees from issue to PR
ASSIGNEES=$(gh issue view $ISSUE_NUM --json assignees -q '.assignees[].login' | tr '\n' ',' | sed 's/,$//')
if [ -n "$ASSIGNEES" ]; then
    gh pr edit --add-assignee "$ASSIGNEES"
    echo "✅ Copied assignees from issue: $ASSIGNEES"
fi

# Note: Value and Effort custom fields cannot be copied via CLI
# These should be inherited automatically via repository workflows
# Or set manually in the GitHub web interface
```

**Note**: PRs are automatically added to the appropriate GitHub project board via repository workflows.

### 5. Verify issue linkage

```bash
# Verify PR body contains proper closing keyword
PR_NUM=$(gh pr view --json number -q '.number')
PR_BODY=$(gh pr view $PR_NUM --json body -q '.body')

if ! echo "$PR_BODY" | grep -qE "(Closes|Fixes|Resolves) #$ISSUE_NUM"; then
    echo "⚠️  PR body should contain 'Closes #$ISSUE_NUM' for auto-close on merge"
    read -p "Update PR body to add closing keyword? (Y/n): " update_body
    if [[ ! $update_body =~ ^[Nn]$ ]]; then
        UPDATED_BODY=$(echo "$PR_BODY" | sed "s/^## Summary/## Summary\n\nCloses #$ISSUE_NUM\n/")
        gh pr edit $PR_NUM --body "$UPDATED_BODY"
        echo "✅ Added 'Closes #$ISSUE_NUM' to PR body"
    fi
fi

# Display PR URL
echo ""
echo "✅ Pull request created successfully:"
gh pr view $PR_NUM --web
```

## Quality gates

- [ ] Working tree is clean (all changes committed)
- [ ] Feature branch pushed to remote
- [ ] PR created with descriptive title
- [ ] PR body contains "Closes #<issue>" for auto-close
- [ ] Labels copied from issue to PR
- [ ] Assignees copied from issue to PR
- [ ] Test plan checklist included in PR body

## PR title guidelines

**Format**: Solution-oriented summary describing what this set of commits accomplishes

✅ Good PR titles:

- "Add Unicode normalization for QID resolution"
- "Fix memory leak in PHP bridge"
- "Implement parallel validation for large datasets"
- "Add input validation for empty usernames"
- "Optimize pipeline performance for 10k+ entries"

❌ Avoid:

- "`fix(qid)`: enhance Unicode handling" (conventional commit format)
- "Issue #123" (not descriptive)
- "QID updates" (too vague)
- "Changes per review" (not specific)
- "Bug fix" (which bug?)

**Remember**: PR title describes the solution, issue title describes the problem

## Closing keywords for issue linkage

Use in PR body to auto-close issue on merge:

- `Closes #123` - Full implementation
- `Fixes #123` - Bug fix
- `Resolves #123` - General resolution
- `Addresses #123` - Partial work (won't auto-close)

Multiple issues: `Closes #123, Closes #456`

## Expected outcomes

- PR created and linked to issue
- Metadata inherited from issue
- Auto-close configured via closing keyword
- Ready for review and validation

## Related workflows

- **git-issue-deliver** - Implement issue and prepare branch for PR
- **git-pr-validate** - Validate PR quality before merge
- **git-pr-merge** - Merge approved PR
