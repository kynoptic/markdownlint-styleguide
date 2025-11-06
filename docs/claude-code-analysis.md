# Claude Code analysis guide

How to use Claude Code to analyze external validation reports and identify rule improvement opportunities.

## Overview

External validation generates structured JSON reports optimized for AI analysis. Claude Code can interpret these reports to:

- Identify patterns in false positives and false negatives
- Suggest rule improvements and refinements
- Recommend autofix safety threshold adjustments
- Propose test coverage expansions
- Discover edge cases from real-world content

## Prerequisites

- External validation report generated (see `docs/external-validation.md`)
- JSON report available in `validation-reports/validation-report.json`
- Claude Code configured with access to repository

## Analysis workflow

### 1. Generate validation report

```bash
npm run validate:external
```

This creates `validation-reports/validation-report.json` with structured violation data.

### 2. Request Claude Code analysis

Provide the report to Claude Code with specific analysis goals:

```
Analyze validation-reports/validation-report.json and identify:

1. False positive patterns - valid content incorrectly flagged
2. False negative patterns - problematic content not caught
3. Autofix safety issues - safe fixes blocked or unsafe fixes applied
4. Edge cases to add to test coverage
5. Rule improvement opportunities

For each finding, provide:
- The pattern or issue identified
- Specific examples from the report
- Recommended changes to rule logic or tests
- Priority (high/medium/low) based on impact
```

### 3. Review Claude Code findings

Claude Code will analyze the report and provide:

- **Pattern analysis**: Common themes in violations
- **Rule recommendations**: Specific logic changes
- **Test cases**: New fixtures to add
- **Priority ranking**: High-impact improvements first

### 4. Implement improvements

Work with Claude Code to:

1. Write failing tests for identified edge cases
2. Update rule logic to address false positives/negatives
3. Adjust autofix safety thresholds if needed
4. Validate changes with re-run of external validation

### 5. Validate improvements

After implementing changes:

```bash
npm run validate:external
```

Compare new report to original:

- Reduced false positives
- Caught false negatives
- Improved autofix safety confidence

## Analysis prompts

### Comprehensive analysis

```
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

### False positive investigation

```
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

### Autofix safety analysis

```
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

### Rule-specific deep dive

```
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

## Report structure guide

Understanding the JSON report structure helps write better analysis prompts:

```json
{
  "timestamp": "ISO 8601 timestamp",
  "sources": [
    {
      "type": "local | github",
      "path": "file path",
      "repository": "owner/repo (for github type)",
      "violations": [
        {
          "line": "line number",
          "rule": "rule name",
          "detail": "violation description",
          "context": "surrounding text",
          "fixInfo": {
            "editColumn": "number",
            "deleteCount": "number",
            "insertText": "string"
          },
          "autofixSafety": {
            "safe": "boolean",
            "confidence": "0-1 score",
            "reason": "explanation"
          }
        }
      ]
    }
  ],
  "summary": {
    "totalFiles": "number",
    "filesWithViolations": "number",
    "totalViolations": "number",
    "autofixStats": {
      "safeFixesAvailable": "number",
      "safeFixesBlocked": "number",
      "unsafeFixesApplied": "number"
    }
  }
}
```

Key fields for analysis:

- `sources[].violations[]` - Individual violation details
- `violations[].context` - Actual markdown content flagged
- `violations[].autofixSafety` - Autofix decision details
- `summary.autofixStats` - Aggregate autofix metrics

## Example analysis session

### Step 1: Generate report

```bash
npm run validate:external
```

Output:
```
External validation starting...
Loading configuration from: .markdownlint-trap-validation.jsonc
Processing local sources...
  Processed directory: ~/Projects/my-app/docs (25 files)

=== Summary ===
Total files: 25
Files with violations: 8
Total violations: 42

JSON report written to: validation-reports/validation-report.json
Markdown report written to: validation-reports/validation-report.md
```

### Step 2: Request analysis

Prompt to Claude Code:

```
Analyze validation-reports/validation-report.json and identify the top 3 false positive patterns with examples and suggested fixes.
```

### Step 3: Claude Code response (example)

```
Based on analysis of validation-report.json, I found 3 false positive patterns:

1. API acronyms flagged in sentence-case-heading (12 occurrences)
   Example: "## REST API guidelines" flagged for "API"
   Issue: "API" is a valid acronym, should be preserved
   Fix: Enhance acronym detection in sentence-case/case-classifier.js
   Test: Add "## REST API guidelines" to passing fixtures

2. Product names with intentional casing (5 occurrences)
   Example: "## Using GraphQL" flagged for "GraphQL"
   Issue: GraphQL is a proper noun with specific casing
   Fix: Add common product names to preservation list
   Test: Add product name fixtures to test suite

3. Code elements in headings (8 occurrences)
   Example: "## The useState hook" flagged for "useState"
   Issue: Code identifiers should preserve original casing
   Fix: Already handled by backtick rule, enhance integration
   Test: Add mixed code/prose heading fixtures

Would you like me to implement these fixes?
```

### Step 4: Implement with Claude Code

```
Yes, let's implement fix #1 for API acronyms. Write failing tests first, then update the classifier.
```

### Step 5: Validate improvement

After implementation:

```bash
npm test
npm run validate:external
```

Compare violation counts:
- Before: 42 violations
- After: 30 violations (12 false positives fixed)

## Best practices

### Iterative refinement

1. Start with comprehensive analysis to understand overall patterns
2. Focus on highest-impact issues (most frequent violations)
3. Implement one improvement at a time
4. Validate each change with external validation re-run
5. Track violation count reductions over time

### Pattern recognition

Look for:

- **Repeated contexts** - Same markdown patterns flagged multiple times
- **Rule clusters** - Multiple rules triggering on same content
- **Confidence patterns** - Low confidence scores in similar cases
- **File type patterns** - Violations concentrated in specific doc types (API docs, tutorials, etc.)

### Collaboration with Claude Code

Effective prompts:

- Be specific about analysis goals
- Reference exact report paths
- Request actionable recommendations (code + tests)
- Ask for priority ranking
- Request validation steps

Less effective prompts:

- "Fix all violations" (too broad)
- "Make the rules better" (unclear goal)
- No mention of report path (Claude Code needs context)

## Continuous improvement workflow

### Regular validation schedule

Run external validation:

- Before major releases
- After rule changes
- When adding new rules
- Monthly for baseline tracking

### Track metrics over time

Monitor trends:

- Total violation count (should stabilize or decrease)
- False positive rate (should decrease)
- Autofix confidence (should increase)
- Files with violations percentage (should decrease)

### Document learnings

When Claude Code identifies improvements:

- Add findings to rule documentation
- Update test coverage
- Document edge cases in CLAUDE.md
- Share patterns in team discussions

## Related documentation

- `docs/external-validation.md` - Running external validation
- `docs/testing.md` - Test strategy and guidelines
- `docs/architecture.md` - Rule architecture and design
- `CLAUDE.md` - Agent handbook and context
