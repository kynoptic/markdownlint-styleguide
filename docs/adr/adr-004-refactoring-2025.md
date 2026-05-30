# ADR 004: v1.7.0 refactoring initiative

## Status

Accepted

## Context

The `v1.7.0`+ refactoring addressed maintainability problems in the custom markdownlint rule suite: monolithic rule files, duplicated heuristics causing behavioral drift, and thin test coverage on safety-critical autofix logic.

## Decisions

### Modular rule decomposition

Break rule files exceeding ~500 LOC or holding more than three distinct responsibilities (parsing, validation, fixing) into composable single-responsibility modules.

`sentence-case-heading` was split from 1,111 LOC into an orchestration entry point plus `token-extraction.js`, `case-classifier.js`, and `fix-builder.js` ([commit dec827f](https://github.com/kynoptic/markdownlint-trap/commit/dec827f)).

**Consequences**: 76% reduction in main-file complexity and no breaking changes for consumers, at the cost of additional module boundaries (~1-2% overhead) and a ~5% bundle-size increase from wrapper code. Modularization also improved concurrent execution from ~1,450ms to ~330ms — V8 inlines and optimizes smaller functions more aggressively, so performance does not justify monolithic files.

### Consolidated shared heuristics

Centralize common detection and preservation logic in `src/rules/shared-heuristics.js` rather than duplicating it across rules ([commit c4f9417](https://github.com/kynoptic/markdownlint-trap/commit/c4f9417)).

Before consolidation, `sentence-case-heading` and `backtick-code-elements` carried separate `isAcronym()` and markup-preservation implementations, producing behavioral drift on number-bearing terms like `PM2` and `IPv4` (Issue #66). The shared module exposes `isAcronym`, `preserveSegments`, `restoreSegments`, and `isInsideCodeSpan`.

**Consequences**: single source of truth and consistent term handling, at the cost of tighter coupling — changes to shared heuristics affect every consuming rule and require regression testing. Future rules must import from `shared-heuristics.js` rather than re-implement the logic.

### Autofix safety unit tests

Cover the `autofix-safety.js` confidence-scoring and manual-review thresholds with behavioral unit tests rather than relying on integration tests alone ([commit 61de511](https://github.com/kynoptic/markdownlint-trap/commit/61de511)).

Unit tests exercise boundary conditions (e.g. exactly 50% confidence) in ~200ms and pinpoint which confidence function broke, where an integration test would require a full markdown document and the entire rule pipeline (~2s).

### Test pyramid with intentional overlap

Maintain overlapping unit and integration layers deliberately. Unit tests verify isolated components with synthetic inputs; integration tests verify end-to-end behavior on realistic documents. The overlap is not redundant — the layers catch different failure modes (logic errors versus composition errors) and offer different feedback speeds.

### Automated vulnerability scanning

Run `npm audit` and osv-scanner in the CI pipeline ([commit 9bea695](https://github.com/kynoptic/markdownlint-trap/commit/9bea695)). Builds fail on high/critical vulnerabilities in production dependencies; dev dependencies are excluded (`--omit=dev`). `SECURITY.md` defines the exception policy — waivers require expiry dates and quarterly review.

### Node.js version targeting

Target Node.js >= 20 (LTS) as the minimum supported version, recorded in `.nvmrc`, the `package.json` engines field, and the CI matrix ([20, 22]). Node.js 20 provides native fetch, the test runner, and watch mode; Node.js 18 LTS reached end-of-life in April 2025.

## References

- [System architecture overview](../architecture.md)
- [Vulnerability scanning process](../../SECURITY.md)
- Issues addressed: #66, #64, #68, #75
