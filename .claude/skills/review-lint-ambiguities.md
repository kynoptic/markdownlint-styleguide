# Skill: review lint ambiguities

Reviews and resolves ambiguous linting suggestions flagged in the "needs-review" tier by markdownlint-trap's three-tier autofix system.

## Trigger conditions

- User runs `/review-lint` or `/review-ambiguities`
- A `needs-review.json` file exists in the project
- User asks to "review lint suggestions" or "fix ambiguous items"

## Workflow

### 1. discover needs-review items

```bash
# Check for existing needs-review output
if [ -f needs-review.json ]; then
  cat needs-review.json
else
  # Generate fresh needs-review output
  npx markdownlint-cli2 "**/*.md" --json > lint-output.json 2>&1
fi
```

### 2. analyze each item

For each item in the needs-review list:

1. **Read the source file context** (surrounding 5 lines)
2. **Determine the correct fix based on context**:
   - Is "Word" Microsoft Word or a generic word?
   - Is "Go" the programming language or a verb?
   - Is "Swift" Apple's language or an adjective?
3. **Apply or reject the suggested fix**

### 3. decision framework

#### Sentence case headings

| Term | Keep Capitalized If... | Lowercase If... |
|------|------------------------|-----------------|
| Word | Discussing MS Word product | Generic use (e.g., "a word about") |
| Go | Discussing Go language | Verb usage (e.g., "go to settings") |
| Swift | Discussing Swift language | Adjective (e.g., "swift response") |
| Python | Discussing Python language | The snake |
| Rust | Discussing Rust language | The oxide/corrosion |
| Ruby | Discussing Ruby language | The gemstone |
| Java | Discussing Java language | The coffee/island |

**Context Signals for Proper Noun:**

- Followed by version number (Go 1.21)
- Preceded by "the" + language context (the Go compiler)
- In a technical documentation context
- Part of a product name phrase

**Context Signals for Common Noun:**

- Preceded by articles "a", "an" (a word)
- Used as a verb (go to, swift action)
- Generic meaning fits the sentence

#### Backtick code elements

| Pattern | Backtick If... | Leave As-Is If... |
|---------|----------------|-------------------|
| import/export | Code keywords in technical docs | Describing trade/commerce |
| skills | The `skills` config field | Abilities/competencies |
| Word | MS Word as software reference | Generic word usage |

### 4. apply fixes

For each decision:

```javascript
// If accepting the suggestion
const fix = item.suggested;
// Apply to file at item.file:item.line

// If rejecting the suggestion
// Add term to neverFlag list or document exemption
```

### 5. output summary

Report decisions made:

```
Reviewed 12 ambiguous items:
- Applied 8 fixes (confident in suggestion)
- Rejected 3 fixes (context indicates proper noun)
- Skipped 1 (requires human decision on style)

Files modified:
- docs/api.md (3 changes)
- README.md (5 changes)
```

## Example session

**User:** Review the lint suggestions for my docs

**Agent:**

1. Reads `needs-review.json`
2. For each item:
   - Reads surrounding context
   - Determines if fix is appropriate
   - Applies or rejects

**Result:**

```
Processed needs-review items:

docs/api.md:15 "Word Processing Features" -> "Word processing features"
  Decision: REJECT - Context discusses Microsoft Word specifically

README.md:42 "Go Templates" -> "Go templates"
  Decision: ACCEPT - Generic template heading, not Go language specific
  Applied fix.

docs/setup.md:23 "import/export"
  Decision: ACCEPT - This is a code context, backticks appropriate
  Applied fix: `import/export`
```

## Configuration

The skill respects `.markdownlint-cli2.jsonc` configuration:

```jsonc
{
  "customRules": ["markdownlint-trap"],
  "config": {
    "sentence-case-heading": {
      "alwaysReview": ["Word", "Go", "Swift"],
      "neverFlag": ["SharePoint", "JavaScript"]
    }
  }
}
```

## Integration with three-tier system

This skill processes items in the **needs-review tier** (confidence 0.3-0.7):

| Tier | Confidence | This Skill's Role |
|------|------------|-------------------|
| Auto-fix | >= 0.7 | Already applied by markdownlint |
| Needs Review | 0.3-0.7 | **Processed by this skill** |
| Skip | < 0.3 | Ignored (too uncertain) |

## Files referenced

- `src/cli/needs-review-reporter.js` - Reporter that generates needs-review output
- `src/rules/autofix-safety.js` - Three-tier system with `THREE_TIER_THRESHOLDS`
- `src/rules/shared-constants.js` - `ambiguousTerms` dictionary
