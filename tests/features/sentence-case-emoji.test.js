// @ts-check

/**
 * Test suite for sentence case rule emoji handling.
 * Ensures that headings with emoji are properly processed and validated.
 */

import { describe, test, expect } from '@jest/globals';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { lint } from 'markdownlint/promise';
import sentenceCaseRule from '../../src/rules/sentence-case-heading.js';

const fixturesDir = resolve(process.cwd(), 'tests/fixtures/sentence-case');

describe('Sentence Case Emoji Handling', () => {
  test('should handle emoji in headings correctly', async () => {
    const fixtureContent = readFileSync(
      resolve(fixturesDir, 'emoji-handling.fixture.md'),
      'utf8'
    );

    const result = await lint({
      strings: {
        'test-content': fixtureContent,
      },
      config: {
        default: false,
        'sentence-case-heading': true,
      },
      customRules: [sentenceCaseRule],
    });

    const violations = result['test-content'] || [];
    
    // No violations expected for emoji handling
    expect(violations).toHaveLength(0);
  });

  test('should handle various emoji types correctly', async () => {
    const testContent = `
# 🎉 Party celebration
# 🚀 Quick deployment
# 🧑‍⚕️ Medical professional
# 👨‍💻 Software engineer
# ✨ Magic sparkles
# 📝 Documentation notes
# 🔧 Tool configuration
# 👨🏻‍💻 Developer with skin tone
# 👨‍👩‍👧‍👦 Family emoji
`;

    const result = await lint({
      strings: {
        'test-content': testContent,
      },
      config: {
        default: false,
        'sentence-case-heading': true,
      },
      customRules: [sentenceCaseRule],
    });

    const violations = result['test-content'] || [];
    
    // No violations expected - all headings follow proper sentence case after emoji
    expect(violations).toHaveLength(0);
  });

  test('should handle numbered headings with emoji correctly', async () => {
    const testContent = `
# 🔧 1. getting started
# ⚡ 2. quick setup
# 📚 3. documentation
`;

    const result = await lint({
      strings: {
        'test-content': testContent,
      },
      config: {
        default: false,
        'sentence-case-heading': true,
      },
      customRules: [sentenceCaseRule],
    });

    const violations = result['test-content'] || [];
    
    // No violations expected - numbered headings should not be flagged
    expect(violations).toHaveLength(0);
  });
});
