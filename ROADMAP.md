# Roadmap

## Core rule quality

- **Now** – 🧩 Break down `src/rules/sentence-case-heading.js` (~1110 LOC) into composable modules (token extraction, case classifier, fix builder) and route deprecation warnings through the markdownlint logger to keep the rule maintainable.
- **Now** – ✅ Backfill unit-level tests for the bold-text and heading-extraction paths (`validateBoldText`, `performBoldTextValidation`, `extractHeadingText`) so refactors catch regressions instead of relying on broad fixtures.
- **Next** – 🔁 Consolidate shared heuristics (acronym detection, preserved segments, inline code checks) across rules into `shared-utils` to eliminate drift between sentence-case and backtick behavior.
- **Later** – 🧰 Define a lightweight rule authoring contract with typed helpers so future rules inherit config validation, logging, and fix wiring without `copy/paste`.

## Autofix and safety

- **Now** – ⚙️ Precompile the large command and extension pattern sets in `src/rules/autofix-safety.js`; `analyzeCodeVsNaturalLanguage` currently rebuilds multi-hundred-term regexes for every violation.
- **Now** – 🧪 Add focused tests around `shouldApplyAutofix` and `createSafeFixInfo` to assert confidence thresholds and metadata because the safety layer is untested today.
- **Next** – 🎚️ Expose per-rule safety tuning (confidence threshold, `safe/unsafe` word lists) through configuration so teams can dial aggressiveness without forking.
- **Later** – 📈 Emit structured telemetry (confidence scores, skipped fixes) during lint runs to highlight heuristics that need adjustments.

## Performance and scalability

- **Now** – 🚀 Consolidate internal link resolution in `src/rules/no-dead-internal-links.js` by caching normalized targets and anchors once per document, removing repeated `path.resolve`, `fs.statSync`, and heading extraction for the same URL.
- **Now** – 🌐 Extend heading-anchor normalization beyond `[\w\u4e00-\u9fa5]` so multilingual docs stop tripping false negatives; add regression fixtures covering emoji and extended Unicode.
- **Next** – ⏱️ Track micro-benchmarks for `backtick-code-elements` and the autofix safety classifiers inside `tests/performance`, and fail CI when regressions exceed agreed thresholds.
- **Later** – ♻️ Prototype incremental linting (file hash + per-rule fingerprints) so docs exceeding 10k lines avoid full rescans on every run.

## Tooling and supply chain

- **Now** – 🛡️ Patch the `brace-expansion` vulnerability (pulled in via `eslint -> minimatch@3.1.2`) and document the remediation in the changelog.
- **Now** – 🔍 Add automated vulnerability scanning to CI (e.g., `npm audit --omit=dev` plus `osv-scanner`) so supply-chain regressions are caught pre-release.
- **Next** – 🤖 Enable dependable automated dependency updates (Renovate or Dependabot) with lockfile verification to keep the `ESLint/Jest/Babel` stack current.
- **Later** – 🧪 Revisit the Babel build: ship native dual-module output once markdownlint consumers accept ESM to simplify releases.

## Documentation and ecosystem

- **Now** – 📝 Capture the autofix safety strategy in an ADR and update `docs/architecture.md` to describe the new module boundaries after the sentence-case refactor.
- **Now** – 🧱 Harden `scripts/generate-config-docs.js` with parsing tests instead of regex scraping so configuration docs survive schema changes.
- **Next** – 📚 Publish an advanced configuration how-to that links from `docs/setup.md` and `docs/testing.md`, covering safety knobs and per-rule overrides.
- **Later** – 🌱 Formalize the `extension/plugin` story and queue new rule ideas (table header capitalization, link text clarity) once shared primitives stabilize.
