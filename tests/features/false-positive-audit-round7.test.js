/**
 * Round 7 false positive fixes based on public repos audit.
 * Patterns identified from facebook/react, microsoft/vscode, anthropics/anthropic-cookbook.
 */
import { lint } from 'markdownlint/promise';
import sentenceCaseHeading from '../../src/rules/sentence-case-heading.js';
import backtickCodeElements from '../../src/rules/backtick-code-elements.js';

describe('False positive fixes - Round 7', () => {
  describe('backtick-code-elements (BCE001) - URLs in markdown links', () => {
    test('should NOT flag URLs inside markdown links', async () => {
      const input = 'We wrote a **[contribution guide](https://reactjs.org/docs/how-to-contribute.html)** to help you get started.';

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'backtick-code-elements': true,
        },
        customRules: [backtickCodeElements],
      });

      expect(result.input).toHaveLength(0);
    });

    test('should NOT flag URLs inside regular markdown links', async () => {
      const input = 'Check out the [documentation](https://docs.example.com/guide) for more info.';

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'backtick-code-elements': true,
        },
        customRules: [backtickCodeElements],
      });

      expect(result.input).toHaveLength(0);
    });

    test('should NOT flag URLs in image links', async () => {
      const input = '![Screenshot](https://github.com/user/repo/assets/screenshot.png)';

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'backtick-code-elements': true,
        },
        customRules: [backtickCodeElements],
      });

      expect(result.input).toHaveLength(0);
    });

    test('should STILL flag bare URLs not in links', async () => {
      const input = 'Visit https://example.com/path for more info.';

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'backtick-code-elements': true,
        },
        customRules: [backtickCodeElements],
      });

      // Bare URLs should still be flagged
      expect(result.input.length).toBeGreaterThan(0);
    });
  });

  describe('sentence-case-heading (SC001) - Promptfoo as proper noun', () => {
    test('should NOT flag Promptfoo as needing lowercase', async () => {
      const input = [
        '## Evaluations with Promptfoo',
        '### Using Promptfoo for testing',
        '## Promptfoo configuration'
      ].join('\n\n');

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'sentence-case-heading': true,
        },
        customRules: [sentenceCaseHeading],
      });

      expect(result.input).toHaveLength(0);
    });
  });
});
