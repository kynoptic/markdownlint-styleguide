# Test Features

This directory contains feature tests for all markdownlint-trap rules.

## Test Types

### Fixture-based Tests
- **Passing tests**: Validate that correct markdown doesn't trigger violations
- **Failing tests**: Validate that incorrect markdown triggers expected violations  
- **Autofix tests**: Validate that autofix produces expected corrections

### Snapshot Tests
- **Autofix snapshots**: Capture exact transformations made by autofix logic
- **Individual transformations**: Test specific scenarios in isolation

## Snapshot Testing Benefits

The `autofix-snapshots.test.js` file provides:

1. **Regression detection**: Any changes to autofix logic will be immediately visible
2. **Review clarity**: Easy to see exactly what transformations are being made
3. **Living documentation**: Snapshots serve as documentation of expected behavior
4. **Safety foundation**: Essential for implementing autofix safety improvements

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/features/sentence-case-failing.test.js

# Update snapshots after intentional changes
npm test -- --updateSnapshot
```

## Test Structure

Each rule typically has:
- `{rule-name}-passing.test.js` - Tests for valid markdown
- `{rule-name}-failing.test.js` - Tests for invalid markdown  
- `{rule-name}-autofix.test.js` - Tests for autofix functionality
- Corresponding fixture files in `../fixtures/`

The snapshot tests complement these by capturing the exact output of autofix operations.