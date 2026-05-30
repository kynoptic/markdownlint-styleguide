# Architecture and project structure

How the project is structured and consumed.

For architectural decisions and their rationale, see the [decision records](adr/).

## Source vs distribution

- Source code: ES Modules under `src/`.
- Distribution: native ESM directly from `src/`, no transpilation.
- Entry point: `src/index.js` exports all rules.

Consumers use one of three shareable presets (`basic`, `recommended`, `strict`), which reference rule files under `src/rules/`.

## Presets and templates

Three root configs (`*-config.jsonc`) serve as shareable presets that consumers extend. All share list style opinions (`MD004: dash`, `MD013: false`, `MD029: one`) but differ in which custom rules are enabled and how many standard rules are relaxed. See `docs/configuration.md` for the full comparison.

Copy-paste templates in `templates/` mirror each preset for two environments: `markdownlint-cli2` (CLI) and VS Code settings (a different config shape). Use templates when tooling does not support `extends`.

## Testing approach

Four test layers validate behavior at different granularities:

- **Unit tests** (`tests/unit/`) verify isolated components with synthetic inputs, giving rapid feedback and precise failure diagnosis
- **Integration tests** (`tests/features/`) validate end-to-end rule behavior with realistic documents
- **Performance tests** (`tests/performance/`) enforce latency and memory thresholds
- **External repository tests** (`tests/integration/external/`) validate rules against curated real-world projects

Tests run directly against native ESM in `src/` using Jest's experimental ESM support.

> [!NOTE]
> Unit and integration tests intentionally overlap. Unit tests pinpoint failures quickly; integration tests catch unexpected interactions and confirm real-world compatibility.

## Module architecture

### Modular rule design

Complex rules use composable, single-responsibility modules. Two rules demonstrate the pattern by splitting their internals into a dedicated subdirectory.

The `sentence-case-heading` rule (`src/rules/sentence-case-heading.js`) orchestrates markdownlint integration and coordinates the modules under `src/rules/sentence-case/`:

- **`bold-text-classifier.js`** - Classifies bold spans that should be treated as headings
- **`case-classifier.js`** - Validates sentence case rules
- **`fix-builder.js`** - Generates auto-fix transformations with safety checks
- **`token-extraction.js`** - Parses and extracts plain text from ATX headings
- **`word-validators.js`** - Per-word checks for acronyms, proper nouns, and exemptions

The `backtick-code-elements` rule (`src/rules/backtick-code-elements.js`) follows the same shape with modules under `src/rules/backtick/`:

- **`detection-helpers.js`** - Identifies code-like tokens that should be wrapped in backticks
- **`error-messages.js`** - Builds the violation messages and fix suggestions

**Rationale**: a single large rule file is hard to maintain and test. Splitting each rule into focused modules sharpens module boundaries, isolates unit tests, and lets V8 optimize smaller functions more aggressively.

## Shared utilities

Shared modules consolidate common heuristics so behavior stays consistent and code does not drift.

> [!IMPORTANT]
> Rules **must** import from shared modules rather than duplicating logic. Duplication causes behavioral drift across the rule suite.

### `src/rules/shared-context.js`

Document-wide positional context for line-scanning rules. `buildLineContext(lines)` scans the document once and returns a `LineContext` whose predicates answer where a given line or position sits:

- `isInFencedCode(lineNumber)` - inside a fenced code block
- `isInInlineCode(lineNumber, column)` - inside an inline code span
- `isInLinkDestination(lineNumber, column)` - inside a link or image destination
- `isInHtmlComment(lineNumber)` - inside an HTML comment
- `isInFrontmatter(lineNumber)` - inside YAML/TOML frontmatter
- `isInCode(lineNumber, column)` - inside any code context (fenced or inline)
- `isInProse(lineNumber, column)` - outside code, links, comments, and frontmatter

Line-scanning rules build this context once per document instead of re-implementing fence, code, and link detection. It backs `backtick-code-elements`, `date-time-consistency`, `sentence-case-heading`, `no-literal-ampersand`, and `no-dead-internal-links`.

### `src/rules/shared-heuristics.js`

Single-line range checks and prose heuristics shared across rules:

- `isInsideCodeSpan(line, start, end)` - checks whether a position range on one line falls within backticks
- `isAcronym(word)` - detects short acronyms (≤4 uppercase letters) for sentence case exemptions
- `isDomainInProse(text)` - distinguishes a domain name used as prose from a literal URL
- `preserveSegments(text)` / `restoreSegments(processed, segments)` - swap code spans, links, version numbers, dates, and formatting for placeholders and back

Detection splits along a clear seam: `shared-heuristics.js` answers single-line range and prose questions; document-wide positional context lives in `shared-context.js`. Rules that only need to test one line's range stay on `isInsideCodeSpan`; rules that walk the whole document build a `LineContext`.

### `src/rules/shared-utils.js`

Performance-optimized utilities for code block detection and inline code processing: fast-path optimizations for common cases, efficient string scanning, and memoization for repeated operations.

### `src/rules/shared-constants.js`

Centralized term dictionaries and configuration constants: special-cased technical terms (e.g., `npm`, `API`, `CSS`), proper noun dictionaries, and default configuration values.

### Acronyms vs proper nouns

`sentence-case-heading` and `backtick-code-elements` split term configuration into two keys:

- `acronyms` - terms that **must** be uppercase (e.g., `API`, `CSS`)
- `properNouns` - terms whose capitalized form is merely **allowed** (e.g., `GitHub`)

The legacy `specialTerms` key is deprecated; supplying it emits a console warning. Use the two-key split instead.

### `src/rules/autofix-confidence.js`

Pure confidence scoring. Given a candidate fix and its context, it returns a score from 0 (definitely unsafe) to 1 (definitely safe) with no side effects:

- `calculateSentenceCaseConfidence()` - analyzes structural changes and technical terms
- `calculateBacktickConfidence()` - distinguishes code from natural language

Both functions are re-exported from `autofix-safety.js`, which layers tier decisions on top of the raw scores.

### `src/rules/autofix-safety.js`

Safety layer for auto-fix operations. It consumes the scores from `autofix-confidence.js` and maps them to a three-tier outcome, keeping safety decisions separate from rule validation logic. Rules detect violations; this module decides when a fix applies automatically, needs review, or is skipped.

| Tier | Confidence | Behavior |
|------|------------|----------|
| Auto-fix | ≥ 0.7 | Applied automatically with high confidence |
| Needs-review | 0.3 – 0.7 | Flagged for human/AI verification |
| Skip | < 0.3 | Too uncertain, silently skipped |

Key functions:

- `shouldApplyAutofix()` - evaluates confidence and returns the tier with ambiguity info
- `createSafeFixInfo()` - generates safety metadata and reports needs-review items
- `classifyTier()` - maps a confidence score to its tier
- `detectAmbiguity()` - identifies terms that could be proper or common nouns

Scores incorporate pattern strength (file paths, commands, technical indicators), ambiguity penalties for terms like `Word`, `Go`, `Swift`, and `Agent`, surrounding-context analysis, and rule-specific boosts for `snake_case`, `camelCase`, and code paths.

`src/cli/needs-review-reporter.js` collects items in the needs-review range and emits them as human-readable text or machine-readable JSON for agent processing.

**Rationale**: see [ADR-001](adr/adr-001-autofix-safety-strategy.md) for design decisions, alternatives, and tradeoffs.

### `src/rules/config-validation.js`

Configuration validation and error reporting for rule options.

### `src/rules/autofix-telemetry.js`

Records autofix tier outcomes for analysis of how often fixes apply, defer, or skip.

## Security architecture

CI runs automated vulnerability scanning:

- **`npm audit`** scans production dependencies against the npm advisory database
- **osv-scanner** cross-references the Open Source Vulnerabilities database
- Builds fail on high or critical vulnerabilities in production dependencies
- Scan results are archived as artifacts with a retention window
- Exception policy documented in `SECURITY.md` for temporary waivers

**Rationale**: proactive scanning blocks vulnerable dependencies from reaching production and leaves an audit trail for compliance.

## Performance guidance

- `no-dead-internal-links` performs filesystem checks and heading extraction. It caches file existence, content, and extracted headings per run. Cost scales with the number of unique links per file set.
- `backtick-code-elements` and `sentence-case-heading` operate in-memory with heuristics.
- Scope `globs` to documentation folders (e.g., `docs/**`, `guides/**`).
- Exclude generated paths: `!node_modules/**/*`, `!dist/**/*`, `!build/**/*`.
- Enable debug output: `DEBUG=markdownlint-trap* npx markdownlint-cli2 "**/*.md"`

## Build

The project ships native ES modules without a build step:

- Source distributes directly from `src/`; there is no transpilation
- The package `files` field includes `src/`, `scripts/`, and `recommended-config.jsonc`
- Pre-commit hooks run linting and tests before each commit
