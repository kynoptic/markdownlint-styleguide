# Testing strategy and conventions

Run and understand the test suites for markdownlint-trap.

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

The project uses **multi-layered testing** to balance fast feedback with thorough validation:

### 🔬 Unit tests (`tests/unit/` and `src/rules/*.test.js`)

Unit tests verify isolated components with synthetic inputs:

- **Purpose**: Fast feedback (~200ms total), precise failure diagnosis, internal module validation
- **Scope**: Individual functions and modules, isolated from markdownlint
- **When to write**: Complex business logic, heuristics, validation functions, utility modules
- **Naming**: `test_should_<behavior>_when_<condition>` format for readability

**Example**: Test case classification without the full markdownlint pipeline:

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

Feature tests validate end-to-end rule behavior with realistic markdown:

- **Purpose**: Validate complete rule integration with markdownlint: parsing, violation detection, and auto-fix
- **Scope**: Full rule lifecycle from markdown input through markdownlint API to violation output
- **When to write**: Every rule feature, edge case, and user-facing behavior
- **Naming**: Descriptive test names matching expected behavior

**Example**: Test full rule integration with markdown fixtures:

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

- **Purpose**: Catch unexpected interactions, verify performance at scale, validate production use cases
- **Scope**: Multiple rules enabled simultaneously, large documents, external repositories
- **When to write**: Adding new rules, changing shared utilities, or addressing performance concerns
- **Examples**: `curated-repos.test.js`, `rule-combinations.test.js`, `performance.test.js`

### ⚡ Performance tests (`tests/performance/`)

Performance tests check that rules meet latency and memory thresholds:

- **Purpose**: Prevent performance regressions, validate optimizations, establish baseline metrics
- **Scope**: Execution time, memory usage, garbage collection profiling, throughput
- **When to write**: After optimizations, when changing hot paths, or when adding new rules
- **Documentation**: See `tests/performance/README.md` for detailed usage and interpretation guide

Run with garbage collection profiling:

```bash
npm run test:performance:gc
```

**Test files**:

- `rule-performance.test.js` - Rule execution benchmarks for all custom rules
- `autofix-safety.test.js` - Autofix safety classifier performance benchmarks

## Test quality principles

Follow the global testing guidelines from `CLAUDE.md`:

### Write behavioral tests

Test **observable behavior**, not implementation details:

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

Mock **external dependencies** (file system, APIs), not internal logic:

- Maximum 5 mocks per test
- 3:1 mock-to-assertion ratio
- Mock boundaries: markdownlint API, file I/O, network calls
- Don't mock: validation functions, heuristics, transformations

### Test both success and error paths

Cover boundaries, invalid inputs, and failure modes:

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
> Unit and feature tests intentionally overlap. Unit tests give fast feedback and pinpoint failures in isolated components. Feature tests verify real-world integration. This redundancy catches different bug classes and speeds up debugging.

**Example overlap**: `sentence-case-classifier.test.js` (unit) tests `validateHeading()` in isolation with synthetic inputs. `sentence-case-passing.test.js` (feature) validates the same logic through the full markdownlint pipeline with realistic markdown.

**Why both?**

- Unit tests fail immediately when logic breaks (~200ms feedback)
- Feature tests catch integration issues (parsing, token extraction, markdownlint API)
- Each layer catches different bug classes (logic errors vs. integration errors)

See `docs/architecture.md` for architectural rationale.

## Test file naming conventions

All test files use the `*.test.js` suffix for Jest auto-discovery:

- **Unit tests**: `tests/unit/<module-name>.test.js` or `src/rules/<module>.test.js` (co-located)
- **Feature tests**: `tests/features/<rule-name>-<scenario>.test.js`
- **Integration tests**: `tests/integration/<scenario>.test.js`
- **Performance tests**: `tests/performance/<component>-performance.test.js` or `tests/performance/<benchmark-name>.test.js`

## When to write unit vs. feature tests

### Write unit tests when

- Testing complex logic in isolation (heuristics, classification, validation)
- Iterating rapidly on algorithms or decision trees
- Precise failure diagnosis matters (shared utilities, safety checks)
- Testing boundaries without markdownlint overhead

### Write feature tests when

- Validating end-to-end rule behavior with real markdown
- Testing auto-fix transformations and safety guardrails
- Verifying rule configuration options
- Covering edge cases with inline code, formatting, or emoji

### Write integration tests when

- Testing multiple rules enabled together
- Validating performance at scale
- Verifying compatibility with external repositories

## Fixtures

Markdown samples in `tests/fixtures/` are organized by rule:

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

Feature tests reference fixtures via absolute paths. Integration tests also generate synthetic strings for specific edge cases.

## False positive validation

Use this validation loop to identify and fix false positives when improving rules:

1. **Run auto-fix on a consumer repository** (e.g. agent-playbook):

   ```bash
   cd /path/to/consumer-repo
   npm install /path/to/markdownlint-trap  # Install local version
   npx markdownlint-cli2 --fix "**/*.md"
   ```

2. **Review changes with `git diff`** for false positives:
   - Abbreviation plurals incorrectly backticked (PRs, IDs, MCPs)
   - Product/brand names incorrectly backticked (CrowdStrike, SharePoint)
   - Common English phrases matched as code (e.g., "import them")
   - Proper nouns incorrectly lowercased (English, Civil War)
   - Filenames in headings incorrectly altered (`SKILL.md` → `Skill.md`)

3. **Create failing tests** in `tests/features/false-positive-*.test.js` capturing each issue.

4. **Fix the rules** by updating the relevant source:
   - `src/rules/shared-constants.js` for new terms in `casingTerms`, `camelCaseExemptions`, or `backtickIgnoredTerms`
   - `src/rules/backtick-code-elements.js` for pattern exclusions
   - `src/rules/sentence-case/case-classifier.js` for heading exemptions

5. **Verify fixes**: run `npm test` and re-run auto-fix on the consumer.

6. **Undo consumer changes** with `git checkout -- .` before committing markdownlint-trap fixes.

## Notes

- Tests import ESM from `src/` directly via `babel-jest`; no build step required.
- The distribution `.markdownlint-rules/` is only used by consumers of the published package or the shareable preset.
- All tests run on Node.js `>=18` (see `.nvmrc`).
