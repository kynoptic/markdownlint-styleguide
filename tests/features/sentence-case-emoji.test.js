// @ts-check

/**
 * Test suite for sentence case rule emoji handling.
 * Ensures that headings with emoji are properly processed and validated.
 */

import { describe, test, expect } from '@jest/globals';
import { lint } from 'markdownlint/promise';
import sentenceCaseRule from '../../src/rules/sentence-case-heading.js';


describe('Sentence Case Emoji Handling', () => {
  test('should handle emoji in headings correctly', async () => {
    // Test only the sections that should pass (marked with ✅)
    const testContent = `# Emoji handling test fixture

## Basic emoji patterns (should NOT be flagged)
# 🎉 Party time
# 🚀 Quick start
# ✨ The future
# 📝 Task list

## Complex emoji sequences (should NOT be flagged)
# 🧑‍⚕️ Health professional
# 👨‍💻 Software developer
# 👨‍👩‍👧‍👦 Family planning

## List items with emoji bold text (should NOT be flagged)
- **🎯 Target achievement** - goal setting
- **🔧 Configuration management** - system setup  
- **📊 Data analysis** - insights
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
