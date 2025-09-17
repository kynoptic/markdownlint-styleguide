# Roadmap

## 🔥 Code quality improvements (high priority)

- 🚨 **Fix cyclomatic complexity issues** in `sentence-case-heading.js` - The main function has ~1100 lines with 15+ nested validation functions. Split into modular classes or separate files.
- 🚨 **Optimize regex performance** in `backtick-code-elements.js` - Replace O(n²) regex compilation in loops with pre-compiled patterns. Current implementation recompiles 15+ regex patterns per line.
- 🔧 **Enhance error handling** - Add comprehensive input validation and graceful degradation for malformed markdown content across all rules.
- 🔧 **Standardize caching strategy** - Implement consistent WeakMap caching pattern across all rules (currently only `shared-utils.js` and `no-dead-internal-links.js` use caching).
- 🔧 **Improve Unicode handling** - Replace manual Unicode ranges with proper Unicode category handling in `sentence-case-heading.js` emoji processing to support newer emoji and complex sequences.
- 🔧 **Replace magic numbers with named constants** - Extract hardcoded values (line 756: length <= 4, line 663: ratio > 0.4) into well-documented configuration constants.

## 🛡️ Security and dependency management (medium priority)

- ⚠️ **Address low-severity vulnerability** - Update `brace-expansion` dependency to resolve ReDoS vulnerability (GHSA-v6h2-p8h4-qcjw).
- 🔐 **Implement dependency scanning automation** - Add automated security scanning to CI/CD pipeline.
- 🔐 **Add regex timeout protection** - Implement timeout mechanisms for complex regex patterns to prevent ReDoS attacks in `backtick-code-elements.js` lines 92-108.

## ⚡ Performance and scalability (medium priority)

- 📊 **Benchmark large-repo performance** quarterly and publish findings in `docs/performance.md`.
- 🚀 **Optimize file system operations** in `no-dead-internal-links.js` - Current implementation performs synchronous I/O operations that can become bottlenecks.
- 🚀 **Implement incremental processing** for large documents (>10,000 lines) to reduce memory usage.

## 🧪 Testing and reliability (ongoing)

- 🔍 **Improve test behavior validation** - Current tests focus on execution rather than meaningful behavior validation. Add scenario-based testing.
- 🔍 **Enhance edge case coverage** - Add tests for malformed markdown, unicode edge cases, and performance regression scenarios.
- 🔍 **Implement property-based testing** for rule validation logic.

## 🏗️ Architectural evolution (low priority)

- 🔌 **Plugin architecture foundation** - Design and implement extensible plugin system to enable third-party rule development without core modifications.
- 🛠️ **Build system modernization** - Migrate from Babel transpilation to native Node.js dual exports (ESM/CommonJS) for improved performance and reduced complexity.
- 📝 **TypeScript adoption consideration** - Evaluate TypeScript migration for enhanced type safety and developer experience.

## ✨ Feature development (low priority)

- 💡 **Investigate new rules** for table header capitalization and link text clarity once the current backlog is cleared.
- 🧩 **Rule composition framework** - Enable complex rules to be built from simple, composable building blocks.
