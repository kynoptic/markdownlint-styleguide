# Architecture and project structure

How the project is structured and consumed.

For architectural decisions and their rationale, see [Architecture Decision Records](adr/).

## Source vs distribution

- Source code: ES Modules under `src/`.
- Distribution: Native ESM directly from `src/` (no transpilation since `v2.3.0`).
- Entry point: `src/index.js` exports all rules.

Consumers use one of three shareable presets (`basic`, `recommended`, `strict`), which reference rule files under `src/rules/`. Since `v2.3.0`, the project ships native ES modules without Babel transpilation.

## Presets and templates

Three root configs (`*-config.jsonc`) serve as shareable presets that consumers extend. All share list style opinions (`MD004: dash`, `MD013: false`, `MD029: one`) but differ in which custom rules are enabled and how many standard rules are relaxed. See `docs/configuration.md` for the full comparison.

Copy-paste templates in `templates/` mirror each preset for two environments: `markdownlint-cli2` (CLI) and VS Code settings (different config shape). Use templates when tooling does not support `extends`.

## Testing approach

Four test layers validate behavior at different granularities:

- **Unit tests** (`tests/unit/`) verify isolated components with synthetic inputs, giving rapid feedback (~200ms) and precise failure diagnosis
- **Integration tests** (`tests/features/`) validate end-to-end rule behavior with realistic documents
- **Performance tests** (`tests/performance/`) enforce latency and memory thresholds
- **External repository tests** (`tests/integration/external/`) validate rules against curated real-world projects

Tests run directly against native ESM in `src/` using Jest's experimental ESM support. Since `v2.3.0`, no transpilation is needed.

> [!NOTE]
> Unit and integration tests intentionally overlap. Unit tests pinpoint failures quickly; integration tests catch unexpected interactions and confirm real-world compatibility.

## Module architecture

### 🏗️ Modular rule design

Since `v1.7.0`, complex rules use composable, single-responsibility modules. The `sentence-case-heading` rule exemplifies this architecture:

- **Main rule file** (`src/rules/sentence-case-heading.js`, 266 lines) - Orchestrates markdownlint integration and coordinates modules
- **Token extraction** (`src/rules/sentence-case/token-extraction.js`, 36 lines) - Parses and extracts plain text from ATX headings
- **Case classification** (`src/rules/sentence-case/case-classifier.js`, 721 lines) - Validates sentence case rules
- **Fix generation** (`src/rules/sentence-case/fix-builder.js`, 127 lines) - Generates auto-fix transformations with safety checks

**Rationale**: The original 1,111-line monolithic rule file was difficult to maintain and test. Splitting it into focused modules achieved:

- 76% reduction in main file complexity (1,111 → 266 lines)
- 762 unit tests covering individual components
- 78% faster concurrent execution (~1,450ms → ~330ms) from better V8 optimization
- Clearer module boundaries simplify debugging and maintenance

See [commit dec827f](https://github.com/kynoptic/markdownlint-trap/commit/dec827f) for the refactoring commit.

### Performance impact

The modular refactor improved concurrent rule execution from ~1,450ms to ~330ms (78% faster). Single-document processing (~255ms) and memory footprint (~0.4MB for 10 documents) stayed the same. V8 optimizes smaller, focused functions more aggressively: better inlining, simpler control flow for branch prediction, and improved CPU cache locality from co-located functions within each module.

## Shared utilities

Shared modules consolidate common heuristics so behavior stays consistent and code does not drift:

### `src/rules/shared-heuristics.js`

Detection and preservation logic shared across multiple rules ([commit c4f9417](https://github.com/kynoptic/markdownlint-trap/commit/c4f9417)):

- `isAcronym(word)` - Detects short acronyms (≤4 uppercase letters) for sentence case exemptions
- `preserveSegments(text)` - Replaces code spans, links, version numbers, dates, and formatting with placeholders
- `restoreSegments(processed, segments)` - Restores preserved segments after processing
- `isInsideCodeSpan(line, start, end)` - Checks whether a position range falls within backticks

**Why consolidate?** Before this refactor, `sentence-case-heading` and `backtick-code-elements` maintained separate acronym detection and markup preservation implementations. The duplication caused behavioral drift: PM2-style terms (containing numbers) were handled inconsistently. The shared module keeps behavior identical across all rules and cuts maintenance work.

### `src/rules/shared-utils.js`

Performance-optimized utilities for code block detection and inline code processing:

- Fast-path optimizations for common cases
- Efficient string scanning algorithms
- Memoization for repeated operations

### `src/rules/shared-constants.js`

Centralized term dictionaries and configuration constants:

- Special-cased technical terms (e.g., "npm", "API", "CSS")
- Proper noun dictionaries
- Default configuration values

### `src/rules/autofix-safety.js`

Safety layer for auto-fix operations with confidence scoring and three-tier categorization. Prevents false positive corrections while surfacing ambiguous cases for review.

**Purpose**: Separates safety decisions from rule validation logic. Rules focus on detecting violations; the safety module determines when autofixes apply automatically, need human review, or should be skipped.

**Three-tier autofix system**:

| Tier | Confidence | Behavior |
|------|------------|----------|
| Auto-fix | ≥ 0.7 | Applied automatically with high confidence |
| Needs-review | 0.3 - 0.7 | Flagged for human/AI verification |
| Skip | < 0.3 | Too uncertain, silently skipped |

**Functions**:

- `shouldApplyAutofix()` - Evaluates confidence and returns tier classification with ambiguity info
- `createSafeFixInfo()` - Generates safety metadata and reports needs-review items
- `classifyTier()` - Determines which tier a fix belongs to based on confidence
- `detectAmbiguity()` - Identifies terms that could be proper or common nouns
- `calculateSentenceCaseConfidence()` - Analyzes structural changes and technical terms
- `calculateBacktickConfidence()` - Distinguishes code vs. natural language

**Confidence scoring**: Each autofix receives a score from 0 (definitely unsafe) to 1 (definitely safe). Scores incorporate:

- Pattern strength (file paths, commands, technical indicators)
- Ambiguity penalties for terms like "Word", "Go", "Swift", "Agent"
- Context analysis (surrounding text, technical vs. natural language)
- Rule-specific boosts (`snake_case` +0.25, `camelCase` +0.25, code paths +0.30)

**Needs-review reporter**: `src/cli/needs-review-reporter.js` collects items in the 0.3-0.7 confidence range and outputs them as human-readable text or machine-readable JSON for AI agent processing.

**Testing**: 568+ behavioral unit tests cover boundary conditions and decision logic.

**Rationale**: See [ADR-001](adr/adr-001-autofix-safety-strategy.md) for design decisions, alternatives considered, and tradeoffs.

### `src/rules/config-validation.js`

Configuration validation and error reporting for rule options.

> [!IMPORTANT]
> Rules **must** `import from` shared modules rather than duplicating logic. Duplication causes behavioral drift across the rule suite.

## Security architecture

Since `v1.7.0`, CI runs automated vulnerability scanning ([commit 9bea695](https://github.com/kynoptic/markdownlint-trap/commit/9bea695)):

- **`npm audit`** scans production dependencies against the `npm advisory` database
- **osv-scanner** cross-references the Open Source Vulnerabilities database
- Builds fail on `high/critical` vulnerabilities in production dependencies
- Scan results are archived as artifacts with 30-day retention
- Exception policy documented in `SECURITY.md` for temporary waivers

**Rationale**: Proactive scanning blocks vulnerable dependencies from reaching production and leaves an audit trail for compliance.

## Performance guidance

- `no-dead-internal-links` performs filesystem checks and heading extraction. It caches file existence, content, and extracted headings per run. Cost scales with the number of unique links per file set.
- `backtick-code-elements` and `sentence-case-heading` operate in-memory with heuristics.
- Scope `globs` to documentation folders (e.g., `docs/**`, `guides/**`).
- Exclude generated paths: `!node_modules/**/*`, `!dist/**/*`, `!build/**/*`.
- Enable debug output: `DEBUG=markdownlint-trap* npx markdownlint-cli2 "**/*.md"`

## Build

Since `v2.3.0`, the project ships native ES modules without transpilation:

- No build step -- source distributes directly from `src/`
- The package `files` field includes `src/`, `scripts/`, and `recommended-config.jsonc`
- Pre-commit hooks run linting and tests before each commit
