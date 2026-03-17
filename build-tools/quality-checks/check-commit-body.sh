#!/usr/bin/env bash
# Enforce commit message conventions:
#   - Subject line <= 50 characters
#   - Body lines (if present) start with "- "
#   - Body lines do not exceed 100 characters
#   - BREAKING CHANGE: footer lines are permitted
set -euo pipefail

commit_msg_file="${1}"
msg=$(grep -v '^#' "${commit_msg_file}")

subject=$(echo "${msg}" | head -1)
body=$(echo "${msg}" | tail -n +3)

errors=0

# Conventional Commits type prefix
allowed_types="feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert"
if ! echo "${subject}" | grep -qE "^(${allowed_types})(\(.+\))?!?: .+"; then
    echo "Subject must match Conventional Commits: <type>[(<scope>)][!]: <description>"
    echo "  Allowed types: feat, fix, docs, style, refactor, test, chore, perf, ci, build, revert"
    echo "  Got: ${subject}"
    errors=$((errors + 1))
fi

# Subject length
subject_len=${#subject}
if [ "${subject_len}" -gt 50 ]; then
    echo "Subject line too long (${subject_len} > 50 chars): ${subject}"
    errors=$((errors + 1))
fi

# Body checks
if [ -n "${body}" ]; then
    while IFS= read -r line; do
        [ -z "${line}" ] && continue

        # Must start with "- " (bullet) or "BREAKING CHANGE:" (footer)
        if [[ ! "${line}" =~ ^-\  ]] && [[ ! "${line}" =~ ^BREAKING\ CHANGE: ]]; then
            echo "Body lines must start with '- ' (or 'BREAKING CHANGE:')"
            echo "  Offending line: ${line}"
            errors=$((errors + 1))
        fi

        # Line length
        line_len=${#line}
        if [ "${line_len}" -gt 100 ]; then
            echo "Body line too long (${line_len} > 100 chars): ${line}"
            errors=$((errors + 1))
        fi
    done <<< "${body}"
fi

if [ "${errors}" -gt 0 ]; then
    exit 1
fi

# Reminders for conventions that cannot be automated
echo "Reminder: verify manually —"
echo "  - Subject uses imperative mood (\"add feature\", not \"adds feature\")"
echo "  - Code, filenames, and identifiers are wrapped in backticks"
