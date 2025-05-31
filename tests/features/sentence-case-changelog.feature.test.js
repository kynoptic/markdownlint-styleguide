// @feature
// Scenario: Version numbers in CHANGELOG.md should not be flagged as sentence case violations
// The following tests validate that version numbers in backticks and brackets are properly handled.

const { lintMarkdown } = require('../helpers/test-helpers');

describe('Sentence Case Feature: CHANGELOG Version Numbers', () => {
  test('Version number in backticks and brackets should not be flagged', async () => {
    const md = '## [`0.2.1`] - 2025-05-31';
    const result = await lintMarkdown(md);
    // This should pass when the rule is fixed
    expect(result).not.toContain('sentence-case');
  });

  test('Version number without backticks should not be flagged', async () => {
    const md = '## [0.2.1] - 2025-05-31';
    const result = await lintMarkdown(md);
    expect(result).not.toContain('sentence-case');
  });

  test('Version number in different format should not be flagged', async () => {
    const md = '## [v1.0.0] - 2025-05-31';
    const result = await lintMarkdown(md);
    expect(result).not.toContain('sentence-case');
  });

  test('Regular title case heading should still be flagged', async () => {
    const md = '## This Is Title Case';
    const result = await lintMarkdown(md);
    expect(result).toContain('sentence-case');
  });
});
