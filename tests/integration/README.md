# Integration Testing

This directory contains integration tests that validate markdownlint-trap rules against real-world repositories.

## Purpose

- **Discover edge cases**: Find patterns not covered by synthetic fixtures
- **Validate at scale**: Test rule performance on large codebases
- **Prevent regressions**: Ensure rules work correctly across diverse markdown content
- **Measure impact**: Understand false positive/negative rates in real scenarios

## Test Structure

### Curated Repository Tests
- Test against specific, well-known repositories
- Reproducible and version-controlled
- Focus on repositories with high-quality markdown

### Dynamic Repository Tests
- Test against a rotating set of popular repositories
- Discover new patterns and edge cases
- Statistical analysis of rule behavior

## Repository Selection Criteria

**Good candidates:**
- Popular open-source projects with extensive documentation
- Repositories with consistent markdown standards
- Projects with diverse content types (APIs, tutorials, changelogs)

**Examples:**
- Documentation sites (Next.js, React, Vue)
- API documentation (Stripe, GitHub API)
- Tutorial repositories (freeCodeCamp, Awesome lists)
- Technical blogs and guides

## Test Types

1. **Violation Discovery**: Find all violations without fixing
2. **Autofix Safety**: Test autofix on real content
3. **Performance**: Measure rule execution time on large files
4. **Pattern Analysis**: Identify common markdown patterns

## Running Integration Tests

```bash
# Run all integration tests (patterns + performance)
npm run test:integration

# Run performance tests only
npm run test:performance

# Run external repository tests (requires internet connection)
npm run test:integration:external
```

## Test Types

### Real-World Pattern Tests (`real-world-patterns.test.js`)
- **No external dependencies** - safe for CI/CD
- Tests against curated markdown patterns from popular repositories
- Analyzes violation patterns and provides statistical insights
- Always included in main test suite

### Performance Tests (`performance.test.js`)
- **No external dependencies** - safe for CI/CD
- Tests rule performance on large generated content
- Measures execution time and memory usage
- Ensures rules maintain reasonable performance at scale

### Curated Repository Tests (`curated-repos.test.js`)
- **Requires internet connection** - disabled by default
- Clones and tests against actual repositories
- Discovers new edge cases in real-world content
- Run manually with `npm run test:integration:external`