// @feature
// Scenario: Bold text sentence case violations should be properly detected
// The rule should correctly identify bold text with title case or ALL CAPS,
// while not flagging bold text within paragraphs that are in sentence case.

const { lintMarkdown } = require('../helpers/test-helpers');

describe('Sentence Case Feature: Bold Text Detection', () => {
  test('Bold text with title case is flagged', async () => {
    const md = '**Example With Title Case**';
    const result = await lintMarkdown(md);
    expect(result).toContain('sentence-case');
  });

  test('Bold ALL CAPS text is flagged', async () => {
    const md = '**BOLD ALL CAPS**';
    const result = await lintMarkdown(md);
    expect(result).toContain('sentence-case');
  });

  test('Bold text in sentence case within paragraph is not flagged', async () => {
    const md = 'This paragraph has **bold text in sentence case** and `code` elements.';
    const result = await lintMarkdown(md);
    expect(result).not.toContain('sentence-case');
  });

  test('Bold text with title case within paragraph is still flagged', async () => {
    const md = 'This paragraph has **Bold Text In Title Case** and unwrapped function keyword.';
    const result = await lintMarkdown(md);
    expect(result).toContain('sentence-case');
  });
});
