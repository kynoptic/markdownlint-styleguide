// @feature
// Scenario: Sentence case violations should be flagged
// The following tests represent known false negatives that must fail until the rule is fixed.

const { lintMarkdown } = require('../helpers/test-helpers');

describe('Sentence Case Feature: Known False Negatives', () => {
  test('ALL CAPS heading is flagged', async () => {
    const md = '#### ALL CAPS IS NOT SENTENCE CASE';
    const result = await lintMarkdown(md);
    // This should fail until the rule is fixed
    expect(result).toContain('sentence-case');
  });

  test('Title Case heading is flagged', async () => {
    const md = '**Example With Title Case**';
    const result = await lintMarkdown(md);
    expect(result).toContain('sentence-case');
  });

  test('Bold ALL CAPS is flagged', async () => {
    const md = '**BOLD ALL CAPS**';
    const result = await lintMarkdown(md);
    expect(result).toContain('sentence-case');
  });

  test('Paragraph with bold Title Case and unwrapped keyword is flagged', async () => {
    const md = 'This paragraph has **Bold Text In Title Case** and unwrapped function keyword.';
    const result = await lintMarkdown(md);
    expect(result).toContain('sentence-case');
  });
});
