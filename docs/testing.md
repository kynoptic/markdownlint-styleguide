# Testing

How to run and understand the test suites for markdownlint-trap.

## Commands

### Run all tests

```bash
npm test                      # Run full test suite (unit + feature + integration)
npm run lint                  # ESLint code quality checks
```

### Run specific test suites

```bash
npm test -- tests/unit/       # Unit tests only (~200ms)
npm test -- tests/features/   # Feature/integration tests
npm run test:integration      # Integration scenarios
npm run test:performance      # Performance benchmarks
```

### Run individual test files

```bash
npm test tests/unit/sentence-case-classifier.test.js
npm test tests/features/sentence-case-passing.test.js
```

### Run specific test by name

```bash
npm test -- --testNamePattern="should_allow_autofix_for_high_confidence"
```

### Debug mode

Enable debug logging during tests:

```bash
DEBUG=markdownlint-trap* npm test
```

## Testing strategy

The project employs a **multi-layered testing approach** to balance rapid feedback with comprehensive validation:

### 🔬 Unit tests (`tests/unit/` and `src/rules/*.test.js`)

Unit tests verify isolated component behavior with synthetic inputs:

- **Purpose**: Fast feedback (~200ms total), precise failure diagnosis, and internal module validation
- **Scope**: Individual functions and modules tested in isolation without markdownlint integration
- **When to write**: For complex business logic, heuristics, validation functions, and utility modules
- **Naming**: `test_should_<behavior>_when_<condition>` format for readability

**Example**: Testing case classification logic without invoking the full markdownlint pipeline:

```javascript
test('test_should_detect_title_case_when_multiple_words_capitalized', () => {
  const result = validateHeading('This Is Title Case');
  expect(result.valid).toBe(false);
  expect(result.reason).toMatch(/title case detected/i);
});
```

**Current unit test coverage** (2,022 lines total):

- `src/rules/autofix-safety.test.js` (568 lines) - Safety layer confidence scoring and decision logic
- `tests/unit/sentence-case-classifier.test.js` (313 lines) - Case classification and validation heuristics
- `tests/unit/sentence-case-heading-functions.test.js` (482 lines) - Internal validation functions
- `tests/unit/sentence-case-fix-builder.test.js` (219 lines) - Auto-fix generation and transformations
- `tests/unit/sentence-case-token-extraction.test.js` (230 lines) - Token parsing from ATX headings
- `tests/unit/shared-heuristics.test.js` (210 lines) - Shared utility functions (acronym detection, segment preservation)

### 🧪 Feature tests (`tests/features/`)

Feature tests validate end-to-end rule behavior with realistic markdown documents:

- **Purpose**: Validate complete rule integration with markdownlint, including parsing, violation detection, and auto-fix
- **Scope**: Full rule lifecycle from markdown input through markdownlint API to violation output
- **When to write**: For every rule feature, edge case, and user-facing behavior
- **Naming**: Descriptive test names matching expected behavior

**Example**: Testing full rule integration with markdown fixtures:

```javascript
test('does not report violations for passing fixture', async () => {
  const options = {
    customRules: [sentenceRule],
    files: ['tests/fixtures/sentence-case/passing.fixture.md'],
    resultVersion: 3,
  };
  const results = await lint(options);
  expect(results[fixturePath]).toHaveLength(0);
});
```

**Feature test categories**:

- Passing fixtures (valid markdown that should not trigger violations)
- Failing fixtures (invalid markdown that should trigger violations)
- Auto-fix validation (transformations and safety checks)
- Configuration validation (rule options and error handling)
- Edge cases (emoji, inline code, formatting interactions)

### 🔗 Integration tests (`tests/integration/`)

Integration tests validate rules against real-world repositories and combined rule scenarios:

- **Purpose**: Catch unexpected interactions, ensure performance at scale, validate against production use cases
- **Scope**: Multiple rules enabled simultaneously, large documents, external repositories
- **When to write**: When adding new rules, changing shared utilities, or addressing performance concerns
- **Examples**: `curated-repos.test.js`, `rule-combinations.test.js`, `performance.test.js`

### ⚡ Performance tests (`tests/performance/`)

Performance tests ensure rules meet latency and memory thresholds:

- **Purpose**: Prevent performance regressions, validate optimization changes, establish baseline metrics
- **Scope**: Execution time, memory usage, garbage collection profiling, throughput measurements
- **When to write**: After optimization work, when changing hot paths, or when adding new rules
- **Documentation**: See `tests/performance/README.md` for detailed usage and interpretation guide

Run with garbage collection profiling:

```bash
npm run test:performance:gc
```

**Test files**:
- `rule-performance.test.js` - Rule execution benchmarks for all custom rules
- `autofix-safety.test.js` - Autofix safety classifier performance benchmarks

## Test quality principles

Following the global testing guidelines from `CLAUDE.md`:

### Write behavioral tests

Tests validate **observable behavior**, not implementation details:

```javascript
// Good: Tests behavior
test('test_should_preserve_acronyms_when_validating_headings', () => {
  const result = validateHeading('API and HTTP guide');
  expect(result.valid).toBe(true);
});

// Bad: Tests implementation
test('checks if preserveSegments was called', () => {
  const spy = jest.spyOn(module, 'preserveSegments');
  validateHeading('Some text');
  expect(spy).toHaveBeenCalled(); // Fragile, coupled to implementation
});
```

### Strategic mocking

Mock **external dependencies** (file system, APIs), not internal business logic:

- Maximum 5 mocks per test
- 3:1 mock-to-assertion ratio
- Mock boundaries: markdownlint API, file I/O, network calls
- Don't mock: validation functions, heuristics, transformations

### Test both success and error paths

Cover boundary conditions, invalid inputs, and failure modes:

```javascript
describe('when_confidence_is_below_threshold', () => {
  test('should_block_autofix_and_require_manual_review', () => {
    const result = shouldApplyAutofix('sentence-case', 'PM2', 'pm2', {}, config);
    expect(result.safe).toBe(false);
    expect(result.requiresReview).toBe(true);
  });
});
```

## Intentional test overlap

> [!NOTE]
> Unit and feature tests intentionally overlap in coverage. Unit tests provide fast feedback and pinpoint failures in isolated components, while feature tests ensure real-world integration works correctly. This redundancy catches different classes of bugs and improves debugging efficiency.

**Example overlap**: `sentence-case-classifier.test.js` (unit) tests `validateHeading()` in isolation with synthetic inputs, while `sentence-case-passing.test.js` (feature) validates the same logic through the full markdownlint pipeline with realistic markdown documents.

**Why both?**

- Unit tests fail immediately when business logic breaks (~200ms feedback)
- Feature tests catch integration issues (parsing, token extraction, markdownlint API interactions)
- Different test styles catch different bug classes (logic errors vs. integration errors)

See `docs/architecture.md` for architectural rationale.

## Test file naming conventions

All test files use the `*.test.js` suffix for Jest auto-discovery:

- **Unit tests**: `tests/unit/<module-name>.test.js` or `src/rules/<module>.test.js` (co-located)
- **Feature tests**: `tests/features/<rule-name>-<scenario>.test.js`
- **Integration tests**: `tests/integration/<scenario>.test.js`
- **Performance tests**: `tests/performance/<component>-performance.test.js` or `tests/performance/<benchmark-name>.test.js`

## When to write unit vs. feature tests

### Write unit tests when

- Testing complex business logic in isolation (heuristics, classification, validation)
- Rapid iteration on algorithms or decision trees
- Precise failure diagnosis is critical (shared utilities, safety checks)
- Testing boundary conditions without markdownlint overhead

### Write feature tests when

- Validating end-to-end rule behavior with real markdown
- Testing auto-fix transformations and safety guardrails
- Ensuring rule configuration options work correctly
- Verifying edge cases with inline code, formatting, or emoji

### Write integration tests when

- Testing multiple rules enabled together
- Validating performance at scale
- Ensuring real-world compatibility with external repositories

## Fixtures

The `tests/fixtures/` directory contains markdown samples organized by rule:

```text
tests/fixtures/
├── sentence-case/
│   ├── passing.fixture.md
│   └── failing.fixture.md
├── backtick/
│   ├── passing.fixture.md
│   └── failing.fixture.md
└── ...
```

Feature tests reference fixtures via absolute paths. Integration tests also generate synthetic strings to validate specific edge cases.

## False positive validation

When improving the ruleset, use this validation loop to identify and fix false positives:

1. **Run auto-fix on a consumer repository** (e.g., agent-playbook):

   ```bash
   cd /path/to/consumer-repo
   npm install /path/to/markdownlint-trap  # Install local version
   npx markdownlint-cli2 --fix "**/*.md"
   ```

2. **Review changes with `git diff`** to identify false positives:
   - Abbreviation plurals incorrectly backticked (PRs, IDs, MCPs)
   - Product/brand names incorrectly backticked (CrowdStrike, SharePoint)
   - Common English phrases matched as code (e.g., "import them")
   - Proper nouns incorrectly lowercased (English, Civil War)
   - Filenames in headings incorrectly altered (`SKILL.md` → `Skill.md`)

3. **Create failing tests** in `tests/features/false-positive-*.test.js` that capture the issues.

4. **Fix the rules** by updating:
   - `src/rules/shared-constants.js` for new terms in `casingTerms`, `camelCaseExemptions`, or `backtickIgnoredTerms`
   - `src/rules/backtick-code-elements.js` for pattern exclusions
   - `src/rules/sentence-case/case-classifier.js` for heading exemptions

5. **Verify fixes** by running `npm test` and re-running auto-fix on the consumer.

6. **Undo consumer changes** with `git checkout -- .` before committing markdownlint-trap fixes.

## Notes

- Tests `import ESM` from `src/` directly via `babel-jest`; no build step is required before running tests.
- The distribution `.markdownlint-rules/` is only used by consumers of the published package or the shareable preset.
- All tests run in Node.js `>=18` (see `.nvmrc` for version requirements).
