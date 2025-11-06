# External validation

How to validate markdownlint-trap rules against external markdown sources to discover false positives, false negatives, and improvement opportunities.

## Overview

The external validation system allows you to test markdownlint-trap rules against:

- **Local files and directories** - Your own documentation projects
- **GitHub repositories** - Public and private repos via `gh` CLI
- **Filtered file sets** - Apply include/exclude patterns

This helps identify:

- False positives (rules incorrectly flagging valid content)
- False negatives (rules missing problematic content)
- Autofix safety issues (unsafe fixes or blocked safe fixes)
- Edge cases to add to test coverage
- Patterns for rule improvements

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

Reports are generated in the configured output directory (default: `validation-reports/`):

- `validation-report.json` - Structured JSON for programmatic analysis
- `validation-report.md` - Human-readable Markdown report

## Configuration options

### Sources

#### Local sources

Specify file paths or directories:

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

Directories are processed recursively based on filters.

#### GitHub sources

Specify repositories in `owner/repo` format:

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
- Private repositories require appropriate access permissions
- Repositories are cloned to `.tmp/validation-repos/`

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

Configure report generation:

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
- `detailLevel`: `"summary"`, `"detailed"`, or `"full"` (currently all use detailed)
- `outputDir`: Directory for report files (created if missing)

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

Human-readable format with:

- Summary statistics
- Autofix analysis (if applicable)
- Violations grouped by source file
- Line numbers and rule names
- Violation details and context

## Analysis workflows

### Manual review

1. Run validation against external sources
2. Review Markdown report for patterns
3. Investigate false positives (valid content flagged as violations)
4. Investigate false negatives (missing expected violations)
5. Update rule logic or test coverage

### Claude Code assisted analysis

See `docs/claude-code-analysis.md` for instructions on using Claude Code to analyze validation reports and suggest improvements.

### Continuous validation

Run validation regularly to:

- Catch regressions before release
- Validate rule changes against real-world content
- Discover new edge cases from evolving documentation styles

## Examples

### Validate local documentation

```jsonc
{
  "sources": {
    "local": ["~/Projects/my-app/docs"]
  },
  "filters": {
    "include": ["**/*.md"]
  },
  "reporting": {
    "format": ["markdown"],
    "outputDir": "validation-reports"
  }
}
```

### Test against popular repositories

```jsonc
{
  "sources": {
    "github": [
      "vercel/next.js",
      "facebook/react",
      "microsoft/typescript"
    ]
  },
  "filters": {
    "include": ["**/docs/**/*.md", "README.md"]
  },
  "reporting": {
    "format": ["json", "markdown"],
    "outputDir": "validation-reports"
  }
}
```

### Validate specific file patterns

```jsonc
{
  "sources": {
    "local": ["/path/to/project"]
  },
  "filters": {
    "include": ["**/API.md", "**/CHANGELOG.md"],
    "exclude": ["**/node_modules/**", "**/vendor/**"]
  },
  "reporting": {
    "format": ["json"],
    "outputDir": "validation-reports"
  }
}
```

## Troubleshooting

### Configuration not found

Error: `No configuration file found`

Solution: Create `.markdownlint-trap-validation.jsonc` in your project root or a parent directory.

### GitHub clone failures

Error: `Failed to clone repository`

Solution:

- Ensure `gh` CLI is installed (`brew install gh`)
- Authenticate with GitHub (`gh auth login`)
- Verify repository name format (`owner/repo`)
- Check access permissions for private repos

### No files processed

Check:

- File paths are correct and accessible
- Filters are not too restrictive
- Directories contain markdown files matching patterns

### Report generation errors

Ensure:

- Output directory is writable
- Sufficient disk space available
- Valid report format specified (`json` or `markdown`)

## Related documentation

- `docs/testing.md` - Test strategy and integration tests
- `docs/architecture.md` - Rule architecture and design decisions
- `docs/claude-code-analysis.md` - AI-assisted analysis workflows
