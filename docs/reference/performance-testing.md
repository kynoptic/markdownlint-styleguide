# Performance testing guide

This guide explains how to run and understand the performance tests for markdownlint-trap.

## Overview

Performance tests ensure that the custom markdownlint rules maintain acceptable performance when processing large markdown files. The tests measure execution time, memory usage, and concurrent execution behavior.

## Running performance tests

### Basic performance test

Run the standard performance test suite:

```bash
npm run test:performance
```

This runs tests without garbage collection exposed, suitable for CI environments.

### Performance test with memory profiling

To run tests with full memory profiling (requires Node.js garbage collection access):

```bash
npm run test:performance:gc
```

This enables detailed memory growth tracking and garbage collection analysis.

### Custom performance test execution

For advanced scenarios, use the performance test script directly:

```bash
node scripts/run-performance-tests.js
```

Environment variables:

- `CI=true` - Disables GC exposure for CI compatibility
- `PERFORMANCE_TEST_GC=true` - Forces GC exposure even in CI

## Test structure

### Test isolation

Each test is properly isolated with:

- `beforeAll` - Sets up test data once per suite
- `afterAll` - Cleans up test data
- `beforeEach`/`afterEach` - Ensures clean state between tests

### Memory management

The test suite implements several strategies to prevent flaky tests:

1. **Conditional GC usage** - Only uses garbage collection when available
2. **Reduced iterations** - Uses 5 iterations instead of 10 for stability
3. **Periodic cleanup** - Triggers GC every 2 iterations when available
4. **Lenient assertions** - Allows up to 50MB memory growth for CI variance

### Performance thresholds

- **Individual rule**: 1000ms maximum for large files (88KB+)
- **Combined rules**: 2000ms maximum
- **Concurrent execution**: 1500ms maximum (with overhead)
- **Memory growth**: 50MB maximum after multiple iterations

## Understanding test output

### Success output

```text
sentence-case-heading: 295.20ms for 88338 chars
backtick-code-elements: 232.98ms for 88338 chars
Combined performance: 442.53ms
Memory growth: -3.24MB after 5 iterations
```

### Failure indicators

- Duration exceeding thresholds
- Memory growth exceeding 50MB
- Test timeouts (30 second limit)
- Rule execution failures

## CI/CD integration

The performance tests are integrated into the CI pipeline with:

1. **Automatic execution** - Runs after unit tests
2. **GC compatibility** - Gracefully handles environments without GC access
3. **Consistent environment** - Single worker, controlled timeouts
4. **Clear reporting** - Performance metrics in test output

## Troubleshooting

### Test timeouts

If tests timeout, check:

- System load during test execution
- Rule complexity for large inputs
- Memory constraints

### Memory test skipping

The memory stability test will skip with message:

```text
Skipping memory stability test - GC not exposed
```

This is normal in CI environments. To enable locally:

```bash
npm run test:performance:gc
```

### Flaky results

If results vary significantly:

1. Ensure single worker mode (`maxWorkers: 1`)
2. Close other applications
3. Run tests multiple times for consistency
4. Check for memory leaks in rules

## Best practices

1. **Run locally before pushing** - Catch performance regressions early
2. **Monitor trends** - Track performance metrics over time
3. **Profile suspicious changes** - Use `test:performance:gc` for detailed analysis
4. **Keep test data realistic** - 88KB test file simulates real-world usage
