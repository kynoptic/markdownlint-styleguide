# Roadmap

## Code quality improvements (high priority)

- **Fix cyclomatic complexity issues** in `sentence-case-heading.js` - The main function has ~1100 lines with 15+ nested validation functions. Split into modular classes or separate files.
- **Optimize regex performance** in `backtick-code-elements.js` - Replace O(n²) regex compilation in loops with pre-compiled patterns. Current implementation recompiles 15+ regex patterns per line.
- **Enhance error handling** - Add comprehensive input validation and graceful degradation for malformed markdown content across all rules.
- **Standardize caching strategy** - Implement consistent WeakMap caching pattern across all rules (currently only `shared-utils.js` and `no-dead-internal-links.js` use caching).

## Security and dependency management (medium priority)

- **Address low-severity vulnerability** - Update `brace-expansion` dependency to resolve ReDoS vulnerability (GHSA-v6h2-p8h4-qcjw).
- **Implement dependency scanning automation** - Add automated security scanning to CI/CD pipeline.

## Performance and scalability (medium priority)

- **Benchmark large-repo performance** quarterly and publish findings in `docs/performance.md`.
- **Optimize file system operations** in `no-dead-internal-links.js` - Current implementation performs synchronous I/O operations that can become bottlenecks.
- **Implement incremental processing** for large documents (>10,000 lines) to reduce memory usage.

## Testing and reliability (ongoing)

- **Improve test behavior validation** - Current tests focus on execution rather than meaningful behavior validation. Add scenario-based testing.
- **Enhance edge case coverage** - Add tests for malformed markdown, unicode edge cases, and performance regression scenarios.
- **Implement property-based testing** for rule validation logic.

## Feature development (low priority)

- **Investigate new rules** for table header capitalization and link text clarity once the current backlog is cleared.
