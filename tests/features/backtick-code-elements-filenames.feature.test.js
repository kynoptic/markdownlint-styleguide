// @feature
// Scenario: Filenames in bullet points should not be flagged as unwrapped code elements
// The following tests validate that filenames in bullet points are properly handled.

const { lintMarkdown } = require('../helpers/test-helpers');

describe('Backtick Code Elements Feature: Filenames in Bullet Points', () => {
  test('Filename in bullet point with backticks should not be flagged', async () => {
    const md = '- Added `index.js` to allow usage as an npm package.';
    const result = await lintMarkdown(md);
    // This should pass when the rule is fixed
    expect(result).not.toContain('backtick-code-elements');
  });

  test('Filename in bullet point without backticks should be flagged', async () => {
    const md = '- Added index.js to allow usage as an npm package.';
    const result = await lintMarkdown(md);
    expect(result).toContain('backtick-code-elements');
  });

  test('Multiple filenames in bullet points with backticks should not be flagged', async () => {
    const md = '- Added `index.js`, `package.json`, and `README.md` to the repository.';
    const result = await lintMarkdown(md);
    expect(result).not.toContain('backtick-code-elements');
  });

  test('Filename in bullet point with description should not be flagged', async () => {
    const md = '- Filename: `index.js` is the main entry point.';
    const result = await lintMarkdown(md);
    expect(result).not.toContain('backtick-code-elements');
  });
});
