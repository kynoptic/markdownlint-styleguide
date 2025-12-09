Execute clean squash merge with properly formatted commit message based on actual changes.

Merge approved PR using squash strategy with three critical steps:
1. **Analyze the diff** to understand actual changes (not PR description)
2. **Use --body flag** to override default PR title with accurate commit message
3. **Verify the commit message** format after merge

This ensures commit history accurately reflects code changes and maintains conventional commit standards.

## Prerequisites

- PR approved by required reviewers
- All CI checks passing
- No merge conflicts
- Maintainer or merge permissions

## Process

### 1. Final validation

```bash
# Verify approval status
gh pr view 123 --json reviewDecision
# Must show "APPROVED"

# Check CI status
gh pr checks 123
# All must be green

# Verify no conflicts
gh pr view 123 --json mergeable
# Must be "MERGEABLE"

# Verify linked issue has acceptance criteria checked off
linked_issue=$(gh pr view 123 --json body -q '.body' | grep -oE '(Closes|Fixes) #[0-9]+' | sed 's/.* #//')
if [ ! -z "$linked_issue" ]; then
    unchecked=$(gh issue view $linked_issue --json body -q '.body' | grep -c '\- \[ \]' || echo 0)
    if [ $unchecked -gt 0 ]; then
        echo "❌ Issue #$linked_issue still has $unchecked unchecked acceptance criteria"
        echo "Complete and check off all criteria before merging"
        exit 1
    fi
    echo "✅ All acceptance criteria checked off in issue #$linked_issue"
fi
```

### 2. Analyze actual diff

```bash
# Review complete changes
git fetch origin pull/123/head:pr-123
git diff main...pr-123 --stat

# Examine specific changes
git diff main...pr-123 -- '*.py' | head -100

# Understand scope
git diff main...pr-123 --name-status | cut -f2 | xargs dirname | sort -u
```

Focus on:
- What actually changed (not what PR says)
- Why changes were necessary
- Impact on system behavior

### 3. Compose merge commit message

Base message on **actual diff**, not PR description. Follow conventional commit format:

```bash
# Determine primary change type from diff
TYPE="feat"  # feat/fix/refactor/perf/docs/test/chore

# Identify scope from changed files
SCOPE="qid"  # module/component affected

# Write descriptive summary (imperative, <50 chars)
SUMMARY="implement Unicode normalization for name resolution"

# Extract key changes from diff
CHANGES=$(cat <<'EOF'
- Add NFC/NFD normalization to TolerantNameToQidDict
- Handle combining characters and diacritics
- Preserve exact match precedence
- Maintain backward compatibility
EOF
)
```

**Conventional commit guidelines**:
- **Imperative mood**: "add" not "added", "fix" not "fixed"
- **Action-oriented**: Focus on what changed
- **Concise**: Summary under 50 characters
- **Scope from code**: Match actual module names

### 4. Execute squash merge

```bash
# CRITICAL: Use both --subject and --body flags for complete control
# --subject controls the commit message first line (conventional format)
# --body controls the detailed commit body
gh pr merge 123 --squash --delete-branch \
  --subject "feat(qid): implement Unicode normalization for name resolution" \
  --body "$(cat <<'EOF'
- Add NFC/NFD normalization to TolerantNameToQidDict
- Handle combining characters and diacritics
- Preserve exact match precedence
- Maintain backward compatibility

Resolves validation errors for 1,200+ titles with accented characters
while maintaining exact match behavior for ASCII titles.

Closes #122
EOF
)"
```

> ⚠️ **CRITICAL**: Always use both `--subject` and `--body` flags to override GitHub's default merge behavior:
> - `--subject` ensures the commit message first line follows conventional commit format
> - `--body` provides detailed change description and context
> - Without `--subject`, GitHub uses the PR title as the commit subject which may not follow conventions
> - Repository settings and PR title take precedence over `--body` for the subject line

### 5. Alternative: Manual squash merge

If needing more control:

```bash
# Checkout main
git checkout main
git pull origin main

# Squash merge locally
git merge --squash origin/issue-123-feature

# Craft commit message
git commit -m "$(cat <<'EOF'
fix(validation): resolve memory leak in parallel validator (#123)

The parallel validator was holding references to completed futures,
causing memory usage to grow linearly with dataset size.

- Clear future references after task completion
- Add explicit garbage collection for large batches
- Reduce memory footprint by 70% for 10k+ entries

Closes #122
EOF
)"

# Push to main
git push origin main

# Close PR
gh pr close 123 --delete-branch
```

### 6. Verify merge and commit message

```bash
# Confirm merge commit and verify message format
git log -1 --stat

# Verify conventional commit format
git log -1 --pretty=format:"%s" | grep -E "^(feat|fix|docs|style|refactor|test|chore)(\([^)]+\))?: .+"
if [ $? -ne 0 ]; then
    echo "ERROR: Commit message doesn't follow conventional format!"
    echo "This may affect automated versioning and changelog generation."
fi

# Verify issue closed
gh issue view 122
# Should show "Closed"

# Check branch deleted
git branch -r | grep issue-123
# Should return nothing
```

## Commit message guidelines

### Structure

```
<type>(<scope>): <summary> (#PR)

<what changed - bullet points from diff>

<why it matters - brief context>

Closes #<issue>
```

### Types by diff analysis

- **feat**: New files/functions/capabilities added
- **fix**: Error handling/validation/logic corrected
- **refactor**: Code restructured without behavior change
- **perf**: Algorithm/query/caching optimized
- **docs**: Markdown/docstrings/comments updated
- **test**: Test files added/modified
- **chore**: Dependencies/config/build updated

### Scope from paths

```bash
# Derive scope from most-changed directory
git diff main...pr-123 --stat | awk '{print $1}' | xargs dirname | sort | uniq -c | sort -rn | head -1
```

Common scopes:
- Check for scopes used in previous commits.

### Summary rules

- Start with imperative verb
- Focus on outcome, not implementation
- Keep under 50 characters
- No period at end

**Title style**: Imperative, action-oriented (captures what changed)

✅ Good commit messages:
- "add Unicode normalization for name matching"
- "fix memory leak in parallel validator"
- "optimize QID lookup performance"
- "refactor validation pipeline for clarity"
- "remove deprecated config options"

❌ Bad:
- "Updated code" (too vague)
- "Fixed bug" (which bug?)
- "Changes per review" (not descriptive)
- "Added feature" (what feature?)
- "Misc improvements" (not specific)

**Critical best practices**:
1. **Always analyze the diff** - Base commit message on actual code changes, not PR description
2. **Always use --subject and --body flags** - Override GitHub's default behavior with precise commit formatting
3. **Always verify after merge** - Check commit message format to ensure conventions are followed

**Remember**: Both `--subject` and `--body` flags are essential for accurate commit messages that follow conventional commit standards

## Post-merge tasks

### Update project board

```bash
# Move issue to Done column
gh project item-edit --id ITEM_ID --field-id STATUS_FIELD --project-id PROJECT_ID --single-select-option-id DONE_ID
```

### Clean local branches

```bash
# Remove merged branch locally
git branch -d issue-123-feature

# Prune remote tracking
git remote prune origin
```

## Quality gates

- [ ] PR fully approved
- [ ] All CI checks green
- [ ] No merge conflicts
- [ ] Commit message based on actual diff
- [ ] Conventional format used
- [ ] Issue auto-closed via "Closes"
- [ ] Branch deleted after merge

## Expected outcomes

- Clean, linear git history
- Accurate commit message reflecting changes
- Closed issue and PR
- Deleted feature branch
- Updated project tracking