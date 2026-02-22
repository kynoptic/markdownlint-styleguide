# Performance test suite

Automated benchmarks to track performance and catch regressions in markdownlint-trap rules and safety classifiers.

## What's measured

The performance test suite tracks:

1. **Rule execution time** - How long each rule takes to process large markdown files
2. **Autofix safety classifiers** - Execution time for confidence scoring and heuristic checks
3. **Memory stability** - Heap growth over repeated iterations
4. **Throughput** - Characters processed per millisecond
5. **Consistency** - Performance variance across multiple runs

## Running the tests

### Run all performance tests

```bash
npm run test:performance
```

### Run with garbage collection profiling

For memory leak detection and heap analysis:

```bash
npm run test:performance:gc
```

This exposes the `global.gc()` function for manual garbage collection between test iterations.

### Run specific test file

```bash
npm test tests/performance/rule-performance.test.js
npm test tests/performance/autofix-safety.test.js
```

## Performance thresholds

Tests fail if performance exceeds these thresholds:

### Rule performance (`rule-performance.test.js`)

- **Large files** (10k+ lines): 3000ms max (generous for CI variability)
- **Medium files** (1k-10k lines): 1500ms max
- **Small files** (<1k lines): 300ms max
- **Memory growth**: 100MB max over 10 iterations
- **Variance**: <3x between runs (accounts for CI variability)

### Autofix safety classifiers (`autofix-safety.test.js`)

- **Single classification**: 5ms (5000µs) max (generous for CI variability)
- **Batch of 100**: 100ms max
- **Batch of 1000**: 500ms max
- **Individual heuristics**: 500µs max per check
- **Variance**: <50% between runs

## Interpreting results

### Console output

Performance tests log detailed metrics:

```text
backtick-code-elements (large): 234.56ms for 1042 lines
  Throughput: 218 chars/ms
  Violations: 45

shouldApplyAutofix single case: 123.45µs
shouldApplyAutofix 100 cases: 8765.43µs total, 87.65µs avg
```

### Baseline metrics

The test suite establishes baseline metrics for future comparison:

```text
=== Performance Baseline Metrics ===
shouldApplyAutofix:
  Single: 112.34µs
  Batch 100 avg: 98.76µs
  Batch 1000 avg: 95.43µs

Heuristics (avg per call):
  hasCodeIndicators: 12.34µs
  hasCommandPattern: 8.76µs
  hasPathPattern: 15.43µs
  isCommonWord: 3.21µs
===================================
```

### Detecting regressions

A performance regression occurs when:

1. **Execution time exceeds threshold** - Test fails immediately
2. **Significant variance** - Performance becomes unpredictable (>2x variance)
3. **Memory growth** - Heap usage grows beyond expected bounds
4. **Baseline degradation** - Metrics are significantly worse than historical baseline

To compare against historical baselines:

1. Run tests on main branch and save output
2. Switch to your feature branch
3. Run tests and compare metrics
4. Look for >20% increases in execution time

## CI integration

Performance tests run automatically in CI:

```yaml
- run: npm run test:performance
  name: Run performance tests
```

CI will fail if:

- Any test exceeds its threshold
- Memory leaks are detected
- Performance variance is too high

## When to run performance tests

Run performance tests when:

- Modifying rule logic or heuristics
- Adding new rules or safety classifiers
- Changing shared utilities or regex patterns
- Optimizing existing code
- Before merging performance-sensitive PRs

## Profiling performance issues

If tests fail or metrics regress:

### 1. Identify the slow component

```bash
npm run test:performance -- --verbose
```

Look for the specific test that failed and its metrics.

### 2. Profile with Node.js profiler

```bash
node --prof --experimental-vm-modules node_modules/jest/bin/jest.js --config jest.config.performance.mjs
node --prof-process isolate-*.log > profile.txt
```

Review `profile.txt` for hot functions.

### 3. Check memory leaks

```bash
npm run test:performance:gc
```

Look for growing heap usage in memory stability tests.

### 4. Benchmark specific functions

Create a focused benchmark in the test file:

```javascript
test('benchmark_specific_function', () => {
  const iterations = 10000;
  const start = process.hrtime.bigint();
  
  for (let i = 0; i < iterations; i++) {
    // Your function call here
  }
  
  const end = process.hrtime.bigint();
  const duration = Number(end - start) / 1000000; // ms
  const avgDuration = duration / iterations;
  
  console.log(`Avg: ${avgDuration.toFixed(4)}ms per call`);
});
```

## Test file structure

```text
tests/performance/
├── README.md                     # This file
├── rule-performance.test.js      # Rule execution benchmarks
└── autofix-safety.test.js        # Safety classifier benchmarks
```

### rule-performance.test.js

Tests rule execution time and memory usage:

- Individual rule benchmarks (sentence-case, backtick, no-bare-urls, etc.)
- Combined rule execution
- Memory stability over iterations
- Throughput measurements
- Consistency checks

### autofix-safety.test.js

Tests autofix safety classifier performance:

- `shouldApplyAutofix` execution time
- `classifyConfidence` execution time
- Individual heuristic functions (`hasCodeIndicators`, `hasCommandPattern`, etc.)
- Batch processing performance
- Baseline metrics for regression detection

## Adding new performance tests

When adding new rules or classifiers:

1. **Add benchmark to appropriate file** (`rule-performance.test.js` or `autofix-safety.test.js`)
2. **Set realistic threshold** based on rule complexity
3. **Test with large inputs** to catch scaling issues
4. **Run multiple iterations** to check consistency
5. **Document expected performance** in test comments

Example:

```javascript
test('should_meet_performance_threshold_for_new_rule', async () => {
  const metrics = await measureRulePerformance(newRule, largeContent, 'new-rule');
  
  console.log(`new-rule (large): ${metrics.duration.toFixed(2)}ms for ${metrics.contentLines} lines`);
  
  // Threshold based on rule complexity
  expect(metrics.duration).toBeLessThan(THRESHOLDS.LARGE_FILE);
  expect(metrics.violations).toBeGreaterThan(0);
});
```

## Performance optimization tips

If performance tests reveal issues:

### For rules

1. **Optimize regex patterns** - Use non-capturing groups `(?:)`, avoid backtracking
2. **Cache computations** - Reuse results within a lint run
3. **Limit iteration depth** - Process only necessary tokens/lines
4. **Use efficient data structures** - Sets for lookups, Maps for caching

### For classifiers

1. **Short-circuit evaluation** - Check fast heuristics first
2. **Avoid redundant checks** - Cache regex matches
3. **Use Set lookups** - `O(1)` instead of Array.includes `O(n)`
4. **Minimize string operations** - `toLowerCase()` is expensive

### General

1. **Profile before optimizing** - Measure to find actual bottlenecks
2. **Test optimizations** - Verify improvements with benchmarks
3. **Maintain readability** - Don't sacrifice clarity for minor gains
4. **Document trade-offs** - Explain why optimizations were chosen

## Notes

- Performance tests use single worker (`maxWorkers: 1`) for consistent measurements
- Tests timeout after 30 seconds to prevent CI hangs
- Memory tests require `--expose-gc` flag (included in `npm run test:performance:gc`)
- Baseline metrics are printed but not enforced (for monitoring only)
- CI runs performance tests on every PR to catch regressions early
