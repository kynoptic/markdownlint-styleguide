// @ts-check

/**
 * Integration tests for the shared line-scanning context helper.
 *
 * These exercise the issue #232 acceptance scenarios end-to-end: line-scanning
 * rules must not flag matches that sit inside fenced code, inline code spans,
 * link destinations, or YAML frontmatter, while still flagging real prose.
 */

import { describe, test, expect } from '@jest/globals';
import { lint } from 'markdownlint/promise';
import backtickCodeElements from '../../src/rules/backtick-code-elements.js';
import noDeadInternalLinks from '../../src/rules/no-dead-internal-links.js';
import noLiteralAmpersand from '../../src/rules/no-literal-ampersand.js';

const baseConfig = {
  default: false,
};

describe('shared-context integration across line-scanning rules', () => {
  test('should_not_flag_example_links_inside_markdown_fence_for_DL001', async () => {
    const input = [
      '# Doc',
      '',
      '```markdown',
      '[broken](./does-not-exist.md)',
      '```',
      '',
      'Real prose.',
    ].join('\n');

    const result = await lint({
      strings: { 'doc.md': input },
      config: { ...baseConfig, 'no-dead-internal-links': true },
      customRules: [noDeadInternalLinks],
    });

    expect(result['doc.md']).toHaveLength(0);
  });

  test('should_not_flag_link_inside_inline_code_for_DL001', async () => {
    const input = 'Use `[x](./missing.md)` as a template.';

    const result = await lint({
      strings: { 'doc.md': input },
      config: { ...baseConfig, 'no-dead-internal-links': true },
      customRules: [noDeadInternalLinks],
    });

    expect(result['doc.md']).toHaveLength(0);
  });

  test('should_not_flag_url_inside_inline_code_as_path_for_BCE001', async () => {
    const input = 'Visit `https://example.com/path` for details.';

    const result = await lint({
      strings: { input },
      config: { ...baseConfig, 'backtick-code-elements': true },
      customRules: [backtickCodeElements],
    });

    expect(result.input).toHaveLength(0);
  });

  test('should_not_flag_terms_inside_fenced_code_for_BCE001', async () => {
    const input = ['Prose.', '', '```', '/etc/hosts', '```'].join('\n');

    const result = await lint({
      strings: { input },
      config: { ...baseConfig, 'backtick-code-elements': true },
      customRules: [backtickCodeElements],
    });

    expect(result.input).toHaveLength(0);
  });

  test('should_not_flag_ampersand_inside_frontmatter', async () => {
    const input = [
      '---',
      'title: Cats & Dogs',
      '---',
      '',
      'Body text.',
    ].join('\n');

    const result = await lint({
      strings: { input },
      config: { ...baseConfig, 'no-literal-ampersand': true },
      customRules: [noLiteralAmpersand],
    });

    expect(result.input).toHaveLength(0);
  });

  test('should_still_flag_ampersand_in_body_prose', async () => {
    const input = ['---', 'title: T', '---', '', 'Cats & dogs.'].join('\n');

    const result = await lint({
      strings: { input },
      config: { ...baseConfig, 'no-literal-ampersand': true },
      customRules: [noLiteralAmpersand],
    });

    expect(result.input).toHaveLength(1);
    expect(result.input[0].ruleNames).toContain('no-literal-ampersand');
  });

  test('should_not_flag_ampersand_inside_link_destination', async () => {
    const input = 'See [the page](https://example.com/?a=1&b=2) now.';

    const result = await lint({
      strings: { input },
      config: { ...baseConfig, 'no-literal-ampersand': true },
      customRules: [noLiteralAmpersand],
    });

    expect(result.input).toHaveLength(0);
  });
});
