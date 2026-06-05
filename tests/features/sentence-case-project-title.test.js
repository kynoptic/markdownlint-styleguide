// @ts-check

/**
 * Test suite for the project-title exemption in the sentence-case rule.
 * The first H1 of a conventional project-root file (README.md, AGENTS.md,
 * CLAUDE.md) is the project name — often an all-acronym title — and is exempt
 * from sentence-case validation. The exemption is scoped to line 1 only.
 */

import { describe, test, expect } from '@jest/globals';
import { lint } from 'markdownlint/promise';
import sentenceCaseRule from '../../src/rules/sentence-case-heading.js';

/**
 * Lint a single named document with only the sentence-case rule enabled.
 * @param {string} name - Filename used as the markdownlint source name.
 * @param {string} content - Markdown content to lint.
 * @returns {Promise<object[]>} Array of lint violations.
 */
async function lintNamed(name, content) {
  const result = await lint({
    strings: { [name]: content },
    config: {
      default: false,
      'sentence-case-heading': true,
    },
    customRules: [sentenceCaseRule],
  });
  return result[name] || [];
}

describe('sentence-case project-title exemption', () => {
  const projectFiles = ['README.md', 'AGENTS.md', 'CLAUDE.md'];

  test.each(projectFiles)(
    'should_exempt_line_1_all_caps_title_when_file_is_%s',
    async (name) => {
      const errors = await lintNamed(name, '# HMS IT\n');
      expect(errors).toHaveLength(0);
    },
  );

  test.each(projectFiles)(
    'should_exempt_line_1_title_when_file_is_%s_in_a_subdirectory',
    async (name) => {
      const errors = await lintNamed(`docs/${name}`, '# HMS IT\n');
      expect(errors).toHaveLength(0);
    },
  );

  test('should_flag_line_1_all_caps_title_when_file_is_not_a_project_title', async () => {
    const errors = await lintNamed('CONTRIBUTING.md', '# HMS IT\n');
    expect(errors).toHaveLength(1);
  });

  test('should_only_exempt_line_1_and_still_validate_later_headings', async () => {
    const content = '# HMS IT\n\n## Heading In Title Case\n';
    const errors = await lintNamed('AGENTS.md', content);
    expect(errors).toHaveLength(1);
    expect(errors[0].lineNumber).toBe(3);
  });
});
