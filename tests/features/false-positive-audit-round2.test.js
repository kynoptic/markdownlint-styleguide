// @ts-check

/**
 * Feature tests for false positive fixes identified in round 2 of the 2026-01 audit.
 * TDD approach: Tests written FIRST to fail, then fixes implemented.
 */

import { describe, test, expect } from '@jest/globals';
import { lint } from 'markdownlint/promise';
import MarkdownIt from 'markdown-it';
import noDeadInternalLinks, { _forTesting } from '../../src/rules/no-dead-internal-links.js';
import sentenceCaseHeading from '../../src/rules/sentence-case-heading.js';
import noBareUrls from '../../src/rules/no-bare-urls.js';

describe('False positive fixes - Round 2', () => {

  describe('no-dead-internal-links (DL001) - Placeholder links', () => {
    beforeEach(() => {
      _forTesting.clearCaches();
    });

    test('should NOT flag [link](link) placeholder by default', async () => {
      const input = 'See [link](link) for more details.';

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'no-dead-internal-links': true,
        },
        customRules: [noDeadInternalLinks],
      });

      expect(result.input).toHaveLength(0);
    });

    test('should NOT flag [URL](URL) placeholder by default', async () => {
      const input = 'Visit [URL](URL) for the documentation.';

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'no-dead-internal-links': true,
        },
        customRules: [noDeadInternalLinks],
      });

      expect(result.input).toHaveLength(0);
    });

    test('should NOT flag [Title](Link) template placeholder', async () => {
      const input = 'Format: [Title](Link)';

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'no-dead-internal-links': true,
        },
        customRules: [noDeadInternalLinks],
      });

      expect(result.input).toHaveLength(0);
    });

    test('should NOT flag workflow template paths', async () => {
      const input = 'See [workflow](workflows/workflow.md) for the template.';

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'no-dead-internal-links': true,
        },
        customRules: [noDeadInternalLinks],
      });

      expect(result.input).toHaveLength(0);
    });

    test('should STILL flag actual broken links', async () => {
      const input = 'See [docs](./nonexistent-file-12345.md) for details.';

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'no-dead-internal-links': true,
        },
        customRules: [noDeadInternalLinks],
      });

      expect(result.input.length).toBeGreaterThan(0);
    });
  });

  describe('sentence-case-heading (SC001) - README acronym', () => {
    test('should NOT flag README as needing lowercase', async () => {
      const input = '## Update the README';

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

    test('should NOT flag READMEs (plural) as needing lowercase', async () => {
      const input = '## Project READMEs';

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

    test('should NOT flag CHANGELOG as needing lowercase', async () => {
      const input = '## Update the CHANGELOG';

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

    test('should STILL flag generic title case', async () => {
      const input = '## Update The Documentation';

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

  describe('no-bare-url (BU001) - URLs in code spans', () => {
    test('should NOT flag URLs inside backticks', async () => {
      const input = 'Use `https://api.example.com/v1` as the endpoint.';

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

    test('should NOT flag URLs in inline code examples', async () => {
      const input = 'The base URL is `http://localhost:3000`.';

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

    test('should STILL flag actual bare URLs in prose', async () => {
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
    });
  });
});
