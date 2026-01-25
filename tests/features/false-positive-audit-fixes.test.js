// @ts-check

/**
 * Feature tests for false positive fixes identified in the 2026-01 cross-repo audit.
 * This test suite validates that fixes for reported false positives work correctly
 * without breaking the rules' ability to catch real violations.
 *
 * TDD approach: These tests are written FIRST to fail, then fixes are implemented.
 */

import { describe, test, expect } from '@jest/globals';
import { lint } from 'markdownlint/promise';
import MarkdownIt from 'markdown-it';
import noBareUrls from '../../src/rules/no-bare-urls.js';
import sentenceCaseHeading from '../../src/rules/sentence-case-heading.js';
import backtickCodeElements from '../../src/rules/backtick-code-elements.js';

describe('False positive fixes from 2026-01 cross-repo audit', () => {

  describe('no-bare-url (BU001) - Markdown file references', () => {
    test('should NOT flag markdown file references like SKILL.md', async () => {
      // These are documentation file references, not bare URLs
      // markdown-it's linkify incorrectly treats them as domains
      const input = 'See the SKILL.md file for more information.';

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'no-bare-url': true,
        },
        customRules: [noBareUrls],
        markdownItFactory: () => new MarkdownIt({ linkify: true }),
      });

      expect(result.input).toHaveLength(0);
    });

    test('should NOT flag CLAUDE.md file references', async () => {
      const input = 'Configuration is documented in CLAUDE.md and README.md files.';

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'no-bare-url': true,
        },
        customRules: [noBareUrls],
        markdownItFactory: () => new MarkdownIt({ linkify: true }),
      });

      expect(result.input).toHaveLength(0);
    });

    test('should NOT flag kebab-case markdown files like getting-started.md', async () => {
      const input = 'Start with getting-started.md for the tutorial.';

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'no-bare-url': true,
        },
        customRules: [noBareUrls],
        markdownItFactory: () => new MarkdownIt({ linkify: true }),
      });

      expect(result.input).toHaveLength(0);
    });

    test('should STILL flag actual bare URLs', async () => {
      const input = 'Visit https://example.com for more info.';

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'no-bare-url': true,
        },
        customRules: [noBareUrls],
        markdownItFactory: () => new MarkdownIt({ linkify: true }),
      });

      expect(result.input.length).toBeGreaterThan(0);
      expect(result.input[0].ruleNames).toContain('no-bare-url');
    });
  });

  describe('sentence-case-heading (SC001) - Hyphenated words', () => {
    test('should NOT suggest HOW-to for How-to headings', async () => {
      const input = '## How-to guide for beginners';

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'sentence-case-heading': true,
        },
        customRules: [sentenceCaseHeading],
      });

      // Should not flag "How-to" as needing to be "HOW-to"
      expect(result.input).toHaveLength(0);
    });

    test('should NOT suggest STEP-by-step for Step-by-step headings', async () => {
      const input = '## Step-by-step instructions';

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

    test('should NOT suggest IN-person for In-person headings', async () => {
      const input = '## In-person meetings';

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

    test('should STILL flag actual acronym-prefix errors like Yaml-based', async () => {
      const input = '## Yaml-based configuration';

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'sentence-case-heading': true,
        },
        customRules: [sentenceCaseHeading],
      });

      // Should flag "Yaml-based" → "YAML-based"
      expect(result.input.length).toBeGreaterThan(0);
    });
  });

  describe('sentence-case-heading (SC001) - Product names', () => {
    test('should NOT flag Claude Code as needing lowercase code', async () => {
      const input = '## Getting started with Claude Code';

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

    test('should NOT flag Agent Skills as needing lowercase', async () => {
      const input = '## Available Agent Skills';

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

    test('should NOT flag Claude Desktop in headings', async () => {
      const input = '## Installing Claude Desktop';

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

    test('should STILL flag generic title case violations', async () => {
      const input = '## This Is A Title Case Heading';

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'sentence-case-heading': true,
        },
        customRules: [sentenceCaseHeading],
      });

      expect(result.input.length).toBeGreaterThan(0);
    });
  });

  describe('backtick-code-elements (BCE001) - Prose with slashes', () => {
    test('should NOT flag letters/numbers/hyphens as a file path', async () => {
      const input = 'Names can contain letters/numbers/hyphens only.';

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

    test('should NOT flag tests/lints/quality as a file path in prose', async () => {
      const input = 'The pipeline runs tests/lints/quality checks.';

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

    test('should NOT flag Build/test as a file path', async () => {
      const input = 'Build/test cycles should be fast.';

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

    test('should STILL flag actual file paths like src/config/settings.json', async () => {
      const input = 'Edit the src/config/settings.json file.';

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'backtick-code-elements': true,
        },
        customRules: [backtickCodeElements],
      });

      expect(result.input.length).toBeGreaterThan(0);
    });
  });
});
