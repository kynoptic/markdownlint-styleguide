# External validation against real-world repos

Validate markdownlint-trap rules against external markdown sources to discover false positives, false negatives, and improvement opportunities.

## Overview

External validation tests markdownlint-trap rules against:

- **Local files and directories** - Your own documentation projects
- **GitHub repositories** - Public and private repos via `gh` CLI
- **Filtered file sets** - Apply include/exclude patterns

Validation reveals:

- False positives (rules flagging valid content)
- False negatives (rules missing problematic content)
- Autofix safety issues (unsafe fixes or blocked safe fixes)
- Edge cases to add to test coverage
- Patterns for rule improvement

## Quick start

### 1. Create configuration file

Create `.markdownlint-trap-validation.jsonc` in your project root:

```jsonc
{
  "sources": {
    "local": [
      "~/Documents/my-docs",
      "/path/to/project/docs"
    ],
    "github": [
      "vercel/next.js"
    ]
  },
  "filters": {
    "include": ["**/*.md", "**/docs/**/*.md"],
    "exclude": ["**/node_modules/**", "**/vendor/**"]
  },
  "reporting": {
    "format": ["json", "markdown"],
    "detailLevel": "detailed",
    "outputDir": "validation-reports"
  }
}
```

### 2. Run validation

```bash
npm run validate:external
```

### 3. Review reports

Reports appear in the configured output directory (default: `validation-reports/`):

- `validation-report.json` - Structured JSON for programmatic analysis
- `validation-report.md` - Human-readable markdown report

## Configuration options

### Sources

#### Local sources

Use file paths or directories:

```jsonc
{
  "sources": {
    "local": [
      "/absolute/path/to/file.md",
      "~/Documents/my-docs",
      "./relative/path/to/docs"
    ]
  }
}
```

Directories are scanned recursively, filtered by glob patterns.

#### GitHub sources

Use `owner/repo` format:

```jsonc
{
  "sources": {
    "github": [
      "facebook/react",
      "microsoft/typescript"
    ]
  }
}
```

Requirements:

- `gh` CLI must be installed and authenticated
- Private repositories require matching access permissions
- Repositories clone to `.tmp/validation-repos/`

### Filters

Control which files are processed:

```jsonc
{
  "filters": {
    "include": ["**/*.md", "**/docs/**/*.md"],
    "exclude": ["**/node_modules/**", "**/vendor/**", "**/.git/**"]
  }
}
```

Uses glob patterns:

- `**/*.md` - All markdown files recursively
- `**/docs/**/*.md` - Only docs directories
- `README.md` - Specific file name

### Reporting

Configure report output:

```jsonc
{
  "reporting": {
    "format": ["json", "markdown"],
    "detailLevel": "detailed",
    "outputDir": "validation-reports"
  }
}
```

Options:

- `format`: Array of `"json"` and/or `"markdown"`
- `detailLevel`: `"summary"`, `"detailed"`, or `"full"` (all currently produce detailed output)
- `outputDir`: Directory for report files (created if it does not exist)

## Report structure

### JSON report

```json
{
  "timestamp": "2025-01-06T12:00:00.000Z",
  "sources": [
    {
      "type": "local",
      "path": "/path/to/file.md",
      "violations": [
        {
          "line": 5,
          "rule": "sentence-case-heading",
          "detail": "Heading uses title case",
          "context": "## This Is Title Case",
          "fixInfo": {
            "editColumn": 3,
            "deleteCount": 18,
            "insertText": "This is title case"
          },
          "autofixSafety": {
            "safe": true,
            "confidence": 0.95,
            "reason": "High confidence transformation"
          }
        }
      ]
    }
  ],
  "summary": {
    "totalFiles": 100,
    "filesWithViolations": 15,
    "totalViolations": 42,
    "autofixStats": {
      "safeFixesAvailable": 30,
      "safeFixesBlocked": 8,
      "unsafeFixesApplied": 0
    }
  }
}
```

### Markdown report

Human-readable format containing:

- Summary statistics
- Autofix analysis (if applicable)
- Violations grouped by source file
- Line numbers and rule names
- Violation details and context

## Analysis workflows

### Manual review

1. Run validation against external sources
2. Review the markdown report for patterns
3. Investigate false positives (valid content flagged as violations)
4. Investigate false negatives (missing expected violations)
5. Update rule logic or test coverage

### AI-assisted analysis

Run `npm run validate:external` to produce the JSON report, then hand it to Claude Code with a specific goal. Ask it to group violations by rule, surface the rules with the highest counts, and separate legitimate hits from false positives, false negatives, and ambiguous edge cases. For autofix tuning, point it at `summary.autofixStats` and the per-violation `autofixSafety` fields to find safe fixes that were blocked or unsafe fixes that slipped through, then have it recommend threshold changes with rationale and test cases. Write failing tests for each accepted edge case, update the rule, and re-run validation to compare counts.

### Continuous validation

Run validation regularly to catch regressions before release, test rule changes against real-world content, and discover edge cases from evolving documentation styles.

## Troubleshooting

### Configuration not found

Error: `No configuration file found`

Create `.markdownlint-trap-validation.jsonc` in the project root or a parent directory.

### GitHub clone failures

Error: `Failed to clone repository`

Fix:

- Install `gh` CLI (`brew install gh`)
- Authenticate with GitHub (`gh auth login`)
- Verify repository name format (`owner/repo`)
- Check access permissions for private repos

### No files processed

Check:

- File paths are correct and accessible
- Filters are not overly restrictive
- Directories contain markdown files matching the glob patterns

### Report generation errors

Verify:

- Output directory is writable
- Sufficient disk space exists
- Report format is valid (`json` or `markdown`)

## Related documentation

- [Testing strategy](testing.md)
- [Rule architecture overview](architecture.md)
