// @ts-check

import { describe, test, expect } from '@jest/globals';
import { lint } from 'markdownlint/promise';
import backtickCodeElements from '../../src/rules/backtick-code-elements.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('backtick-code-elements: domain names vs. full URLs', () => {
  const fixturePath = path.join(__dirname, '../fixtures/backtick-domain-names.fixture.md');
  const fixtureContent = fs.readFileSync(fixturePath, 'utf8');

  test('should NOT flag domain names used in prose', async () => {
    const options = {
      strings: {
        'domain-names.md': fixtureContent
      },
      config: {
        default: false,
        'backtick-code-elements': true
      },
      customRules: [backtickCodeElements]
    };

    const results = await lint(options);
    const errors = results['domain-names.md'] || [];

    // Domain names in prose should NOT be flagged
    const domainOnlyErrors = errors.filter(err => {
      const context = err.errorContext;
      return context && (
        context.includes('Outlook.com') ||
        context.includes('Gmail.com') ||
        context.includes('Microsoft365.com') ||
        context.includes('example.com') ||
        context.includes('GitHub.com') ||
        context.includes('AWS.Amazon.com') ||
        context.includes('status.example.org') ||
        context.includes('api.example.com') ||
        context.includes('support@example.com')
      ) && !context.includes('http://') && !context.includes('https://');
    });

    expect(domainOnlyErrors).toHaveLength(0);
  });

  test('should NOT flag full URLs with protocol (handled by no-bare-url)', async () => {
    const options = {
      strings: {
        'domain-names.md': fixtureContent
      },
      config: {
        default: false,
        'backtick-code-elements': true
      },
      customRules: [backtickCodeElements]
    };

    const results = await lint(options);
    const errors = results['domain-names.md'] || [];

    // Bare URLs (with protocol) are the domain of the separate no-bare-url rule,
    // so BCE001 must not flag them as code elements or file paths.
    const urlErrors = errors.filter(err => {
      const context = err.errorContext;
      return context && (context.includes('http://') || context.includes('https://'));
    });

    expect(urlErrors).toHaveLength(0);
  });

  test('should distinguish between domain names and URLs in mixed content', async () => {
    const mixedContent = `
# Mixed content test

Visit GitHub.com or clone from https://github.com/user/repo.

Check Gmail.com for updates, then refer to https://mail.google.com/mail/u/0/.
    `.trim();

    const options = {
      strings: {
        'mixed.md': mixedContent
      },
      config: {
        default: false,
        'backtick-code-elements': true
      },
      customRules: [backtickCodeElements]
    };

    const results = await lint(options);
    const errors = results['mixed.md'] || [];

    // Bare URLs with protocol are handled by no-bare-url, not BCE001.
    const urlErrors = errors.filter(err => {
      const context = err.errorContext;
      return context && (context.includes('http://') || context.includes('https://'));
    });

    // Domain names without protocol should NOT be flagged
    const domainOnlyErrors = errors.filter(err => {
      const context = err.errorContext;
      return context && (
        (context.includes('GitHub.com') || context.includes('Gmail.com')) &&
        !context.includes('http://') && !context.includes('https://')
      );
    });

    expect(urlErrors).toHaveLength(0);
    expect(domainOnlyErrors).toHaveLength(0);
  });

  test('should handle edge cases correctly', async () => {
    const edgeCases = `
# Edge cases

Domain with subdomain: api.example.com should not require backticks.

Domain with port mentioned separately: Connect to example.com on port 443.

Domain in possessive form: Outlook.com's interface is intuitive.

Domain at end of sentence: I use Gmail.com.
    `.trim();

    const options = {
      strings: {
        'edge-cases.md': edgeCases
      },
      config: {
        default: false,
        'backtick-code-elements': true
      },
      customRules: [backtickCodeElements]
    };

    const results = await lint(options);
    const errors = results['edge-cases.md'] || [];

    // None of these domain names should be flagged
    const domainErrors = errors.filter(err => {
      const context = err.errorContext;
      return context && (
        context.includes('api.example.com') ||
        context.includes('example.com') ||
        context.includes('Outlook.com') ||
        context.includes('Gmail.com')
      );
    });

    expect(domainErrors).toHaveLength(0);
  });
});
