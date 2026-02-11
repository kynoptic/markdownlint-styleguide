# Architecture

Overview of how this project is structured and consumed.

For architectural decisions and their rationale, see [Architecture Decision Records](adr/).

## Source vs distribution

- Source code: ES Modules under `src/`.
- Distribution: Native ESM directly from `src/` (no transpilation since `v2.3.0`).
- Entry point: `src/index.js` exports all rules.

Consumers use one of three shareable presets (`basic`, `recommended`, `strict`), which reference rule files under `src/rules/`. Since `v2.3.0`, the project ships native ES modules without Babel transpilation.

## Presets and templates

Three root configs (`*-config.jsonc`) serve as shareable presets that consumers extend. They share common list style opinions (`MD004: dash`, `MD013: false`, `MD029: one`) and differ in which custom rules are enabled and how many standard rules are relaxed. See `docs/configuration.md` for the full comparison.

Copy-paste templates in `templates/` mirror each preset for two environments: `markdownlint-cli2` (CLI) and VS Code settings (different config shape). Templates exist for tooling that does not support `extends`.

## Testing approach

The project employs a multi-layered testing strategy:

- **Unit tests** (`tests/unit/`) verify isolated component behavior with synthetic inputs, providing rapid feedback (~200ms) and precise failure diagnosis
- **Integration tests** (`tests/features/`) validate end-to-end rule behavior with realistic documents
- **Performance tests** (`tests/performance/`) ensure rules meet latency and memory thresholds
- **External repository tests** (`tests/integration/external/`) validate rules against curated real-world projects

Tests run directly against native ESM in `src/` using Jest's experimental ESM support. Since `v2.3.0`, no transpilation is required.

> [!NOTE]
> Intentional test overlap exists between unit and integration tests. Unit tests provide fast feedback and pinpoint failures, while integration tests catch unexpected interactions and ensure real-world compatibility.

## Module architecture

### 🏗️ Modular rule design

Since `v1.7.0`, complex rules have been refactored into composable modules following single-responsibility principles. The `sentence-case-heading` rule exemplifies this architecture:

- **Main rule file** (`src/rules/sentence-case-heading.js`, 266 lines) - Orchestrates markdownlint integration and coordinates module interactions
- **Token extraction** (`src/rules/sentence-case/token-extraction.js`, 36 lines) - Parses and extracts plain text from ATX headings
- **Case classification** (`src/rules/sentence-case/case-classifier.js`, 721 lines) - Contains validation logic and business rules for sentence case
- **Fix generation** (`src/rules/sentence-case/fix-builder.js`, 127 lines) - Generates auto-fix transformations with safety checks

**Architectural rationale**: The original 1,111-line monolithic rule file became difficult to maintain and test. Breaking it into focused modules achieved:

- 76% reduction in main file complexity (1,111 → 266 lines)
- Improved testability with 762 unit tests covering individual components
- Better V8 optimization leading to 78% faster concurrent execution (~1,450ms → ~330ms)
- Easier debugging and maintenance through clear module boundaries

See [commit dec827f](https://github.com/kynoptic/markdownlint-trap/commit/dec827f) and `docs/refactoring/sentence-case-performance.md` for detailed performance analysis.

## Shared utilities

To ensure consistent behavior and prevent code drift, common heuristics are consolidated in shared modules:

### `src/rules/shared-heuristics.js`

Consolidates detection and preservation logic used across multiple rules ([commit c4f9417](https://github.com/kynoptic/markdownlint-trap/commit/c4f9417)):

- `isAcronym(word)` - Detects short acronyms (≤4 uppercase letters) for sentence case exemptions
- `preserveSegments(text)` - Extracts and replaces code spans, links, version numbers, dates, and formatting with placeholders
- `restoreSegments(processed, segments)` - Restores preserved segments after processing
- `isInsideCodeSpan(line, start, end)` - Checks if a position range falls within backticks

**Why consolidate?** Prior to this refactor, `sentence-case-heading` and `backtick-code-elements` maintained separate implementations of acronym detection and markup preservation. This caused behavioral drift where PM2-style terms (containing numbers) were handled inconsistently. The shared module ensures identical behavior across all rules and reduces maintenance burden.

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

Safety layer for auto-fix operations with confidence scoring and three-tier categorization, preventing false positive corrections while surfacing ambiguous cases for review.

**Purpose**: Separates safety decision-making from rule validation logic, allowing rules to focus on detecting violations while the safety module determines when autofixes should apply automatically, need human review, or should be skipped.

**Three-tier autofix system**:

| Tier | Confidence | Behavior |
|------|------------|----------|
| Auto-fix | ≥ 0.7 | Applied automatically with high confidence |
| Needs-review | 0.3 - 0.7 | Flagged for human/AI verification |
| Skip | < 0.3 | Too uncertain, silently skipped |

**Key functions**:

- `shouldApplyAutofix()` - Evaluates confidence and returns tier classification with ambiguity info
- `createSafeFixInfo()` - Generates safety metadata and reports needs-review items
- `classifyTier()` - Determines which tier a fix belongs to based on confidence
- `detectAmbiguity()` - Identifies terms that could be proper or common nouns
- `calculateSentenceCaseConfidence()` - Analyzes structural changes and technical terms
- `calculateBacktickConfidence()` - Distinguishes code vs. natural language

**Confidence scoring system**: Each autofix receives a score from 0 (definitely unsafe) to 1 (definitely safe). Scores incorporate:

- Pattern strength (file paths, commands, technical indicators)
- Ambiguity penalties for terms like "Word", "Go", "Swift", "Agent"
- Context analysis (surrounding text, technical vs. natural language)
- Rule-specific boosts (`snake_case` +0.25, `camelCase` +0.25, code paths +0.30)

**Needs-review reporter**: Items in the 0.3-0.7 confidence range are collected by `src/cli/needs-review-reporter.js` and output in human-readable text or machine-readable JSON format for AI agent processing.

**Testing**: Validated with 568+ behavioral unit tests covering boundary conditions and decision-making logic.

**Architecture rationale**: See [ADR-001](adr/adr-001-autofix-safety-strategy.md) for design decisions, alternatives considered, and tradeoffs.

### `src/rules/config-validation.js`

Configuration validation and error reporting for rule options.

> [!IMPORTANT]
> Rules **must** `import from` shared modules rather than duplicating logic. This prevents behavioral drift and ensures consistent behavior across the rule suite.

## Security architecture

Since `v1.7.0`, the project includes automated vulnerability scanning in the CI pipeline ([commit 9bea695](https://github.com/kynoptic/markdownlint-trap/commit/9bea695)):

- **`npm audit`** scans production dependencies against the `npm advisory` database
- **osv-scanner** cross-references against the Open Source Vulnerabilities database
- Builds fail on `high/critical` vulnerabilities in production dependencies
- Scan results are archived as artifacts with 30-day retention
- Exception policy documented in `SECURITY.md` for temporary waivers

**Rationale**: Proactive security scanning prevents vulnerable dependencies from reaching production and provides audit trail for compliance.

## Build

Since `v2.3.0`, the project ships native ES modules without transpilation:

- No build step required - source is distributed directly from `src/`
- The package `files` field includes `src/`, `scripts/`, and `recommended-config.jsonc` for consumption
- Pre-commit hooks run linting and tests to ensure code quality
