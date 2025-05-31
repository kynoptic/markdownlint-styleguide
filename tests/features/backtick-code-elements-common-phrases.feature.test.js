// @feature
// Scenario: Common phrases with code elements should not be flagged
// The following tests validate that common phrases with code elements are properly handled.

const { lintMarkdown } = require('../helpers/test-helpers');

describe('Backtick Code Elements Feature: Common Phrases', () => {
  test('Package manager references in installation instructions should not be flagged', async () => {
    const md = 'You can install using npm or yarn.';
    const result = await lintMarkdown(md);
    expect(result).not.toContain('backtick-code-elements');
  });

  test('Package manager references in bullet points should not be flagged', async () => {
    const md = '- Install dependencies using npm or yarn.';
    const result = await lintMarkdown(md);
    expect(result).not.toContain('backtick-code-elements');
  });

  test('Package manager references in npm package context should not be flagged', async () => {
    const md = 'This is available as an npm package.';
    const result = await lintMarkdown(md);
    expect(result).not.toContain('backtick-code-elements');
  });

  test('Git references in common contexts should not be flagged', async () => {
    const md = 'Clone the repository using git.';
    const result = await lintMarkdown(md);
    expect(result).not.toContain('backtick-code-elements');
  });

  test('Other code elements outside common phrases should be flagged', async () => {
    const md = 'Use function to declare a function.';
    const result = await lintMarkdown(md);
    expect(result).toContain('backtick-code-elements');
  });
});
