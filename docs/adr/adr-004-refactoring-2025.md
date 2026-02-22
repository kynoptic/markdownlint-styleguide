# ADR 004: v1.7.0 refactoring initiative

## Status

Accepted

Synthesized architectural decisions and rationale from the major refactoring work completed between `v1.7.0` and HEAD (commits through c4f9417).

## Overview

This document captures the "why" behind significant architectural changes introduced during the `v1.7.0`+ refactoring initiative. These decisions represent lessons learned about maintainability, testing, and code organization in a custom markdownlint rule suite.

## 🏗️ Architecture decisions

### Modular rule decomposition

**Decision**: Break down monolithic rule files (>1,000 LOC) into composable modules with single responsibilities.

**Context**: The `sentence-case-heading` rule grew to 1,111 lines over time, making it difficult to:

- Understand the flow of validation logic
- Write targeted unit tests for specific functions
- Debug failures without reading the entire file
- Onboard new contributors

**Implementation** ([commit dec827f](https://github.com/kynoptic/markdownlint-trap/commit/dec827f)):

```text
sentence-case-heading.js (1,111 LOC)
  ↓
sentence-case-heading.js (266 LOC, orchestration)
  ├── token-extraction.js (36 LOC)
  ├── case-classifier.js (721 LOC)
  └── fix-builder.js (127 LOC)
```

**Outcomes**:

- ✅ 76% reduction in main file complexity
- ✅ 762 unit tests added for individual components
- ✅ 78% faster concurrent execution (1,450ms → 330ms)
- ✅ V8 can better optimize smaller, focused functions
- ✅ No breaking changes for external consumers

**Tradeoffs**:

- Additional module boundaries add minimal overhead (~1-2%)
- Bundle size increased by ~5% due to module wrapper code
- More files to navigate during initial code exploration

**When to apply**: Consider modular decomposition when a rule exceeds ~500 LOC or contains more than 3 distinct responsibilities (e.g., parsing, validation, fixing).

### Consolidated shared heuristics

**Decision**: Extract common detection and preservation logic into a centralized `shared-heuristics.js` module rather than duplicating implementations across rules.

**Context**: Prior to consolidation, two rules maintained separate implementations:

- `sentence-case-heading` had `isAcronym()` and `preserveMarkupSegments()`
- `backtick-code-elements` had similar but slightly different logic

This caused **behavioral drift** where PM2-style terms (containing numbers like `PM2`, `IPv4`) were handled inconsistently.

**Implementation** ([commit c4f9417](https://github.com/kynoptic/markdownlint-trap/commit/c4f9417)):

Created `src/rules/shared-heuristics.js` with:

- `isAcronym(word)` - Detects short acronyms (≤4 uppercase letters)
- `preserveSegments(text)` - Unified markup preservation
- `restoreSegments(processed, segments)` - Inverse operation
- `isInsideCodeSpan(line, start, end)` - Code span detection

**Outcomes**:

- ✅ Eliminates behavioral drift between rules
- ✅ PM2-style terms now handled consistently
- ✅ 210 unit tests document shared behavior
- ✅ Single source of truth for common patterns
- ✅ Easier to extend heuristics across all rules

**Tradeoffs**:

- Rules now depend on shared module (tighter coupling)
- Changes to shared heuristics affect multiple rules
- Requires careful testing to avoid regressions

> [!IMPORTANT]
> Future rules **must** `import from` `shared-heuristics.js` rather than duplicating logic. Update the shared module if the heuristic needs refinement.

**Historical context**: This refactor directly addresses Issue #66 ("Consolidate shared heuristics to prevent drift"), which documented the PM2 inconsistency as a real-world failure case.

### Autofix safety layer with unit tests

**Decision**: Implement comprehensive unit tests for the autofix safety layer to validate confidence scoring and manual review thresholds.

**Context**: The `autofix-safety.js` module makes critical decisions about when to apply automatic fixes:

- Should this fix be applied automatically?
- What confidence level does this transformation have?
- Does this look like code vs. natural language?

These decisions were previously tested only through integration tests, making it difficult to verify edge cases and boundary conditions.

**Implementation** ([commit 61de511](https://github.com/kynoptic/markdownlint-trap/commit/61de511)):

Added 568 behavioral unit tests covering:

- `shouldApplyAutofix()` - Confidence thresholds, manual review flags
- `createSafeFixInfo()` - Safety metadata generation, fix blocking
- `calculateSentenceCaseConfidence()` - Structural changes, technical terms
- `calculateBacktickConfidence()` - File paths, commands, natural language
- `analyzeCodeVsNaturalLanguage()` - Code detection heuristics

**Outcomes**:

- ✅ Documents expected behavior for all confidence scenarios
- ✅ Fast feedback on safety logic changes (~200ms test run)
- ✅ Precise failure diagnosis when confidence scoring breaks
- ✅ Prevents incorrect autofixes through comprehensive validation

**Rationale for unit vs. integration**:

Unit tests are essential here because:

1. **Rapid iteration**: Testing confidence thresholds through integration tests requires creating full markdown documents and running the entire rule pipeline (~2s)
2. **Edge case coverage**: Unit tests easily exercise boundary conditions like "exactly 50% confidence" or "one technical term in 10 words"
3. **Clear failure messages**: When a unit test fails, it's immediately clear which confidence function broke

## ⚡ Performance considerations

### V8 optimization through modularization

**Observation**: Breaking the monolithic `sentence-case-heading` rule into modules **improved** performance by 78% in concurrent execution tests.

**Analysis**:

1. **Better inlining**: V8's JIT compiler can more aggressively inline smaller, focused functions
2. **Improved branch prediction**: Simpler control flow in each module reduces mispredictions
3. **Cache locality**: Related functions co-located in modules improve CPU cache hit rates
4. **Reduced code complexity**: V8's optimization heuristics work better on smaller functions

**Measured impact**:

- Before: ~1,450ms for concurrent rule execution
- After: ~330ms for concurrent rule execution
- Threshold: 1,500ms (now at 78% headroom)

**Takeaway**: Performance concerns should **not** discourage modular architecture. Modern JavaScript engines optimize modular code very effectively.

### Performance testing strategy

**Decision**: Maintain performance regression tests with conservative thresholds.

**Current thresholds**:

```javascript
{
  concurrentExecution: 1500, // Current: ~330ms (78% headroom)
  singleDocument: 500,        // Current: ~255ms (49% headroom)
  memoryGrowth: 1.0,          // Current: ~0.4MB (60% headroom)
}
```

**Rationale**: Headroom allows natural code evolution without constant threshold adjustments, while still catching genuine performance regressions.

## 🔐 Security considerations

### Automated vulnerability scanning

**Decision**: Integrate automated vulnerability scanning into the CI pipeline to detect and prevent security issues before they reach production.

**Implementation** ([commit 9bea695](https://github.com/kynoptic/markdownlint-trap/commit/9bea695)):

Added security job to CI workflow using:

- **`npm audit`** - Scans against `npm advisory` database
- **osv-scanner** - Cross-references against Open Source Vulnerabilities database

**Configuration**:

- Fails builds on high/critical vulnerabilities in production dependencies
- Excludes dev dependencies from blocking checks (`--omit=dev`)
- Uploads scan results as artifacts (30-day retention)
- Exception policy in `SECURITY.md` for temporary waivers

**Rationale**:

- Proactive detection prevents vulnerable dependencies from reaching users
- Audit trail provides compliance evidence
- Exception policy balances security with pragmatic development needs
- Running in parallel with build job avoids extending CI time

> [!CAUTION]
> The exception policy exists for legitimate cases (no patch available, breaking changes required). Exceptions must include expiry dates and be reviewed quarterly.

## 🔧 Tooling choices

### Test pyramid strategy

**Decision**: Adopt a deliberate test pyramid with intentional overlap between unit and integration tests.

**Structure**:

```text
    Integration Tests (497 tests)
           /\
          /  \
         /    \
        /      \
       /________\
    Unit Tests (762 tests)
```

**Overlap strategy**:

- **Unit tests** verify isolated component behavior with synthetic inputs
- **Integration tests** verify end-to-end behavior with realistic documents

**Rationale for overlap**:

This is **intentional**, not redundant:

1. **Rapid feedback**: Unit tests run in ~200ms vs ~2s for integration
2. **Precise failure diagnosis**: Unit test failures pinpoint exact module
3. **Regression safety**: Integration tests catch unexpected interactions
4. **Different failure modes**: Unit tests catch logic errors, integration tests catch composition errors

**Example**: The `toSentenceCase()` function has both:

- Unit tests with synthetic inputs: `"HTTP API"`, `"npm v2.0"`
- Integration tests with real markdown: Full documents from external repositories

### Build artifact drift detection

**Decision**: Add pre-commit hooks to detect when source code changes without corresponding updates to built artifacts.

**Context** ([commit 37ea4d9](https://github.com/kynoptic/markdownlint-trap/commit/37ea4d9)):

Developers occasionally commit source changes in `src/` without running `npm run build`, causing the distribution in `.markdownlint-rules/` to drift out of sync.

**Implementation**:

Pre-commit hook runs:

```bash
npm run build
git diff --exit-code .markdownlint-rules/
```

If the build produces changes, the commit is blocked with a message to run `npm run build` first.

**Outcomes**:

- ✅ Prevents accidental distribution drift
- ✅ Ensures consumers always get up-to-date rules
- ✅ Catches forgotten build step before push

**Tradeoff**: Adds ~2-3s to commit time, but only when source files change.

## Legacy constraints

### Commonjs distribution requirement

**Constraint**: markdownlint-cli2 requires rules to be exported as CommonJS, not ES modules.

**Current approach**:

- Write all source code as ES modules in `src/`
- Transpile to CommonJS in `.markdownlint-rules/` via Babel
- Ship both formats in the `npm package`

**Why not pure ESM?**

- markdownlint-cli2's configuration loader uses `require()`, not `import()`
- Changing this would require upstream changes to markdownlint ecosystem
- Many consumers use CommonJS-based build tools

**Future consideration**: When markdownlint-cli2 supports native ESM rules, we can eliminate the build step entirely and ship pure ES modules.

### Node.js version targeting

**Decision**: Target Node.js >= 18 (LTS) as the minimum supported version.

**Rationale**:

- Node.js 18 includes modern features (native fetch, test runner, watch mode)
- LTS support runs through April 2025
- Enterprise users typically stay on LTS versions
- Allows use of modern JavaScript without excessive transpilation

**Recorded in**: `.nvmrc`, `package.json` engines field, CI matrix

## Lessons learned

### When to refactor

Consider refactoring when:

1. **File size exceeds ~500 LOC** with multiple distinct responsibilities
2. **Tests are hard to write** because functions are tightly coupled
3. **Behavioral drift occurs** between rules implementing similar logic
4. **Performance degrades** due to code complexity
5. **Debugging requires reading entire files** instead of targeted modules

### Refactoring safety checklist

From the sentence-case-heading refactor ([commit dec827f](https://github.com/kynoptic/markdownlint-trap/commit/dec827f)):

- ✅ Run full test suite before starting
- ✅ Create comprehensive unit tests for new modules
- ✅ Ensure integration tests pass with identical behavior
- ✅ Measure performance impact (before/after)
- ✅ Document migration path for consumers
- ✅ Verify bundle size impact
- ✅ Update architecture documentation

### Documentation as architectural artifact

This document exists because:

1. **Commit messages capture "what"** (files changed, lines added)
2. **Code comments explain "how"** (implementation details)
3. **Architecture docs explain "why"** (decisions, tradeoffs, alternatives)

Without explicit architecture documentation, the rationale for decisions gets lost over time. Future contributors may inadvertently undo improvements because they don't understand the original motivation.

**Recommendation**: Update `docs/adr/` with every significant architectural change (>500 LOC refactor, new module patterns, performance tradeoffs).

## References

### Key commits

- [dec827f](https://github.com/kynoptic/markdownlint-trap/commit/dec827f) - Break down monolithic sentence-case-heading rule
- [c4f9417](https://github.com/kynoptic/markdownlint-trap/commit/c4f9417) - Consolidate shared heuristics to prevent drift
- [61de511](https://github.com/kynoptic/markdownlint-trap/commit/61de511) - Add comprehensive autofix-safety unit tests
- [9bea695](https://github.com/kynoptic/markdownlint-trap/commit/9bea695) - Add automated vulnerability scanning to CI
- [1e80f7c](https://github.com/kynoptic/markdownlint-trap/commit/1e80f7c) - Add unit tests for internal validation functions

### Related documentation

- `docs/architecture.md` - System architecture overview
- `docs/architecture.md#performance-impact` - Performance analysis of modular refactor
- `SECURITY.md` - Vulnerability scanning process and exception policy
- `CLAUDE.md` - Agent handbook with development workflow

### Issues addressed

- #66 - Consolidate shared heuristics to prevent drift
- #64 - Break down monolithic sentence-case-heading rule
- #68 - Add comprehensive unit tests for autofix safety layer
- #75 - Add automated vulnerability scanning to CI pipeline

---

**Document history**: Created 2025-10-30 as part of architecture knowledge capture initiative. Synthesized from commit messages, code comments, and performance documentation.
