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

Use Claude Code (or a similar AI assistant) to analyze validation reports:

1. **Generate report** - Run `npm run validate:external` to produce `validation-reports/validation-report.json`
2. **Request analysis** - Provide the report with specific goals (false positives, false negatives, autofix safety, edge cases)
3. **Review findings** - The assistant returns pattern analysis, rule recommendations, new test cases, and priority rankings
4. **Implement improvements** - Write failing tests for identified edge cases, update rule logic, adjust autofix thresholds
5. **Re-validate** - Run `npm run validate:external` again and compare violation counts

#### Analysis prompt templates

**Comprehensive analysis**:

```text
Analyze validation-reports/validation-report.json:

1. Group violations by rule name
2. Identify top 3 rules with highest violation counts
3. For each top rule, analyze violation patterns:
   - Common contexts where violations occur
   - False positive indicators (valid content flagged)
   - False negative indicators (expected violations missing)
4. Review autofix safety statistics:
   - Safe fixes blocked (should be allowed)
   - Unsafe fixes applied (should be blocked)
5. Recommend priority improvements with test cases
```

**False positive investigation**:

```text
Analyze validation-reports/validation-report.json for false positives:

1. Find violations that appear to be valid markdown content
2. Look for patterns:
   - Technical terms flagged as improper case
   - Valid acronyms marked as errors
   - Proper formatting incorrectly reported
3. For each pattern, provide:
   - Example violations from report
   - Why the content is actually valid
   - Suggested rule refinements
   - Test cases to prevent regression
```

**Autofix safety analysis**:

```text
Analyze validation-reports/validation-report.json autofix statistics:

1. Review autofixStats in summary:
   - safeFixesAvailable (count)
   - safeFixesBlocked (investigate why)
   - unsafeFixesApplied (investigate why)

2. For blocked safe fixes:
   - Find examples in violations with autofixSafety.safe === false
   - Analyze confidence scores and reasons
   - Determine if confidence thresholds are too strict

3. Recommend threshold adjustments with rationale
```

**Rule-specific deep dive**:

```text
Analyze violations for rule "sentence-case-heading" in validation-reports/validation-report.json:

1. Count total violations for this rule
2. Extract all violation contexts and details
3. Categorize violations:
   - Legitimate issues (correct violations)
   - False positives (valid content flagged)
   - Edge cases (unclear/ambiguous)
4. Identify improvement opportunities:
   - Heuristics to add/refine
   - Edge cases to handle
   - Test coverage gaps
5. Provide specific code changes and test cases
```

### Continuous validation

Run validation regularly to:

- Catch regressions before release
- Test rule changes against real-world content
- Discover edge cases from evolving documentation styles

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

- `docs/testing.md` - Test strategy and integration tests
- `docs/architecture.md` - Rule architecture and design decisions
