# Architecture

Overview of how this project is structured and consumed.

## Source vs distribution

- Source code: ES Modules under `src/`.
- Distribution: CommonJS output under `.markdownlint-rules/` (built via Babel).
- Entry point: `src/index.js` exports the rules for direct ESM usage.

Consumers typically use the shareable preset `markdownlint-trap/recommended-config.jsonc`, which references compiled CJS rule files under `.markdownlint-rules/rules/*.cjs`. This allows `markdownlint-cli2` to load the rules without transpiling.

## Recommended config

`recommended-config.jsonc` declares `customRules` pointing to the compiled rules and a `config` block enabling rules (and some stock markdownlint rules). Other repos can simply set `"config.extends": "markdownlint-trap/recommended-config.jsonc"` in their `.markdownlint-cli2.jsonc`.

## Testing approach

The project employs a multi-layered testing strategy:

- **Unit tests** (`tests/unit/`) verify isolated component behavior with synthetic inputs, providing rapid feedback (~200ms) and precise failure diagnosis
- **Integration tests** (`tests/features/`) validate end-to-end rule behavior with realistic documents
- **Performance tests** (`tests/performance/`) ensure rules meet latency and memory thresholds
- **External repository tests** (`tests/integration/external/`) validate rules against curated real-world projects

Tests run directly against ESM in `src/` (via `babel-jest`), not the compiled output. This allows rapid iteration during development while maintaining confidence that the transpiled distribution works correctly.

> [!NOTE]
> Intentional test overlap exists between unit and integration tests. Unit tests provide fast feedback and pinpoint failures, while integration tests catch unexpected interactions and ensure real-world compatibility.

## Module architecture

### 🏗️ Modular rule design

Since v1.7.0, complex rules have been refactored into composable modules following single-responsibility principles. The `sentence-case-heading` rule exemplifies this architecture:

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

Safety layer for auto-fix operations with confidence scoring:

- `shouldApplyAutofix()` - Evaluates confidence thresholds and manual review flags
- `createSafeFixInfo()` - Generates safety metadata for fix operations
- `calculateSentenceCaseConfidence()` - Analyzes structural changes and technical terms
- `calculateBacktickConfidence()` - Distinguishes code vs. natural language
- `analyzeCodeVsNaturalLanguage()` - Context-aware code detection

Tested with 568 behavioral unit tests covering boundary conditions and decision-making logic ([commit 61de511](https://github.com/kynoptic/markdownlint-trap/commit/61de511)).

### `src/rules/config-validation.js`

Configuration validation and error reporting for rule options.

> [!IMPORTANT]
> Rules **must** import from shared modules rather than duplicating logic. This prevents behavioral drift and ensures consistent behavior across the rule suite.

## Security architecture

Since v1.7.0, the project includes automated vulnerability scanning in the CI pipeline ([commit 9bea695](https://github.com/kynoptic/markdownlint-trap/commit/9bea695)):

- **npm audit** scans production dependencies against the npm advisory database
- **osv-scanner** cross-references against the Open Source Vulnerabilities database
- Builds fail on high/critical vulnerabilities in production dependencies
- Scan results are archived as artifacts with 30-day retention
- Exception policy documented in `SECURITY.md` for temporary waivers

**Rationale**: Proactive security scanning prevents vulnerable dependencies from reaching production and provides audit trail for compliance.

## Build

- `npm run build` transpiles to `.markdownlint-rules` with `.cjs` files copied.
- The package `files` field includes `.markdownlint-rules`, `src/index.js`, and `recommended-config.jsonc` for consumption.
- Pre-commit hooks detect build artifact drift to ensure distribution stays synchronized with source.
