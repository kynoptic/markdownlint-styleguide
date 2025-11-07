// @ts-check

/**
 * Test suite for ignoreAfterEmoji configuration option in sentence-case-heading rule.
 * Tests that text after emoji is ignored when option is enabled, preserving backward compatibility when disabled.
 */

import { describe, test, expect } from '@jest/globals';
import { lint } from 'markdownlint/promise';
import sentenceCaseRule from '../../src/rules/sentence-case-heading.js';

/**
 * Helper to lint markdown content with specific config
 * @param {string} content Markdown content to lint
 * @param {object} config Configuration for sentence-case-heading rule
 * @returns {Promise<object[]>} Array of violations
 */
async function lintWithConfig(content, config = {}) {
  const result = await lint({
    strings: {
      'test-content': content,
    },
    config: {
      default: false,
      'sentence-case-heading': config,
    },
    customRules: [sentenceCaseRule],
  });

  return result['test-content'] || [];
}

describe('ignoreAfterEmoji configuration option', () => {
  // Acceptance criterion 1: Basic functionality
  test('test_should_not_report_violation_when_ignoreAfterEmoji_enabled_and_status_marker_after_emoji', async () => {
    const content = '## Task complete ✅ DONE';
    
    const violations = await lintWithConfig(content, { ignoreAfterEmoji: true });
    
    // No violation should be reported because "DONE" is after emoji
    expect(violations).toHaveLength(0);
  });

  // Acceptance criterion 1: Variation with multiple words after emoji
  test('test_should_not_report_violation_when_ignoreAfterEmoji_enabled_and_multiple_status_words_after_emoji', async () => {
    const content = '## NOW (Current Sprint - Critical Foundation) ✅ COMPLETED';
    
    const violations = await lintWithConfig(content, { ignoreAfterEmoji: true });
    
    // No violation should be reported because "COMPLETED" is after emoji
    expect(violations).toHaveLength(0);
  });

  // Acceptance criterion 2: Partial validation before emoji
  test('test_should_flag_violations_before_emoji_when_ignoreAfterEmoji_enabled', async () => {
    const content = '## WRONG Case ✅ METADATA';

    const violations = await lintWithConfig(content, { ignoreAfterEmoji: true });

    // Should flag "WRONG Case" before emoji (all caps or improper capitalization), but not "METADATA" after
    expect(violations.length).toBeGreaterThan(0);
    // Error message should be about capitalization (either "first word" or "all caps")
    expect(violations[0].errorDetail).toMatch(/capitalized|all caps/i);
    expect(violations[0].errorDetail).not.toMatch(/METADATA/i);
  });

  // Acceptance criterion 3: Backward compatibility (default false)
  test('test_should_validate_all_text_when_ignoreAfterEmoji_disabled', async () => {
    const content = '## Valid heading ✅ INVALID';
    
    const violationsDefault = await lintWithConfig(content, {});
    const violationsExplicitFalse = await lintWithConfig(content, { ignoreAfterEmoji: false });
    
    // Both should report violation for "INVALID" (backward compatible behavior)
    expect(violationsDefault.length).toBeGreaterThan(0);
    expect(violationsExplicitFalse.length).toBeGreaterThan(0);
    expect(violationsDefault[0].errorDetail).toMatch(/INVALID/i);
  });

  // Acceptance criterion 4: Multiple emoji - truncate at first
  test('test_should_truncate_at_first_emoji_when_heading_has_multiple_emoji', async () => {
    const content = '## Task complete 🎉 DONE ✅ FINISHED';
    
    const violations = await lintWithConfig(content, { ignoreAfterEmoji: true });
    
    // Everything after first emoji (🎉) should be ignored
    expect(violations).toHaveLength(0);
  });

  // Acceptance criterion 5: Autofix preserves post-emoji text
  test('test_should_preserve_post_emoji_text_when_autofixing', async () => {
    const content = '## Valid 🎉 More Text';

    const violationsEnabled = await lintWithConfig(content, { ignoreAfterEmoji: true });
    const violationsDisabled = await lintWithConfig(content, { ignoreAfterEmoji: false });

    // With ignoreAfterEmoji: true, "More Text" after emoji is ignored (no violation)
    expect(violationsEnabled).toHaveLength(0);

    // With ignoreAfterEmoji: false, "More" and "Text" after emoji should trigger violations
    expect(violationsDisabled.length).toBeGreaterThan(0);
    if (violationsDisabled[0].fixInfo) {
      // If fix is provided, it should preserve " 🎉 more text" exactly
      const { insertText } = violationsDisabled[0].fixInfo;
      expect(insertText).toContain('🎉');
      expect(insertText).toContain('more text');
    }
  });

  // Test autofix with ignoreAfterEmoji: true - should NOT modify post-emoji text
  test('test_should_not_modify_post_emoji_text_in_autofix_when_ignoreAfterEmoji_enabled', async () => {
    const content = '## SUBSTANTIALLY COMPLETED ✅ DONE';

    const violations = await lintWithConfig(content, { ignoreAfterEmoji: true });

    // Should have violation for "SUBSTANTIALLY COMPLETED" (all caps)
    expect(violations.length).toBeGreaterThan(0);

    // Autofix should be provided
    expect(violations[0].fixInfo).toBeDefined();

    if (violations[0].fixInfo) {
      const { insertText } = violations[0].fixInfo;

      // The fix should only apply to text before emoji
      // "SUBSTANTIALLY COMPLETED" should become "Substantially completed"
      // But "DONE" after emoji should NOT be included in the fix at all
      expect(insertText).toMatch(/^Substantially completed/);
      expect(insertText).not.toContain('DONE');
      expect(insertText).not.toContain('done');
      expect(insertText).not.toContain('✅');
    }
  });

  // Test autofix with all-caps heading before emoji
  test('test_should_fix_only_text_before_emoji_when_heading_has_all_caps', async () => {
    const content = '## WRONG CASE ✅ METADATA';

    const violations = await lintWithConfig(content, { ignoreAfterEmoji: true });

    // Should flag "WRONG CASE" before emoji
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].fixInfo).toBeDefined();

    if (violations[0].fixInfo) {
      const { insertText } = violations[0].fixInfo;

      // Should fix to "Wrong case" but not include anything after emoji
      expect(insertText).toBe('Wrong case');
      expect(insertText).not.toContain('METADATA');
      expect(insertText).not.toContain('metadata');
    }
  });

  // Test autofix preserves spacing before emoji
  test('test_should_preserve_spacing_when_fixing_text_before_emoji', async () => {
    const content = '## TASK STATUS ✅';

    const violations = await lintWithConfig(content, { ignoreAfterEmoji: true });

    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].fixInfo).toBeDefined();

    if (violations[0].fixInfo) {
      const { insertText } = violations[0].fixInfo;

      // Should fix to "Task status" without including emoji
      expect(insertText).toBe('Task status');
      expect(insertText).not.toContain('✅');
    }
  });

  // Test the exact issue from PR review comment
  test('test_should_not_lowercase_DONE_in_autofix_when_ignoreAfterEmoji_enabled', async () => {
    const content = '## SUBSTANTIALLY COMPLETED ✅ DONE';

    const violations = await lintWithConfig(content, { ignoreAfterEmoji: true });

    expect(violations.length).toBeGreaterThan(0);

    if (violations[0].fixInfo) {
      const { insertText } = violations[0].fixInfo;

      // Critical: insertText should ONLY contain the fixed text before emoji
      // It should NOT contain " ✅ done" or any variation
      expect(insertText).toBe('Substantially completed');

      // Verify DONE is not lowercased anywhere in the fix
      expect(insertText.toLowerCase()).not.toContain('done');
    }
  });

  // Edge case: Empty string after emoji
  test('test_should_handle_empty_string_after_emoji', async () => {
    const content = '## Heading text ✅';
    
    const violations = await lintWithConfig(content, { ignoreAfterEmoji: true });
    
    // No violation - emoji at end with nothing after
    expect(violations).toHaveLength(0);
  });

  // Edge case: Multiple emoji in sequence
  test('test_should_handle_multiple_emoji_in_sequence', async () => {
    const content = '## Task 🎉✅🚀 ALL CAPS AFTER';
    
    const violations = await lintWithConfig(content, { ignoreAfterEmoji: true });
    
    // Everything after first emoji should be ignored
    expect(violations).toHaveLength(0);
  });

  // Edge case: Emoji at start of heading
  test('test_should_handle_emoji_at_start_of_heading', async () => {
    const content = '## ✅ COMPLETED TASK';
    
    const violations = await lintWithConfig(content, { ignoreAfterEmoji: true });
    
    // Everything after emoji (which is at start) should be ignored
    expect(violations).toHaveLength(0);
  });

  // Edge case: Complex emoji (ZWJ sequences, skin tones)
  test('test_should_handle_complex_emoji_with_modifiers', async () => {
    const content = '## Developer 👨‍💻 STATUS MARKER';
    
    const violations = await lintWithConfig(content, { ignoreAfterEmoji: true });
    
    // Text after complex emoji should be ignored
    expect(violations).toHaveLength(0);
  });

  // Edge case: Emoji with variation selector
  test('test_should_handle_emoji_with_variation_selector', async () => {
    const content = '## Task complete ✅️ DONE';
    
    const violations = await lintWithConfig(content, { ignoreAfterEmoji: true });
    
    // Text after emoji (with variation selector) should be ignored
    expect(violations).toHaveLength(0);
  });

  // Edge case: Mixed emoji and parenthetical markers
  test('test_should_handle_mixed_emoji_and_parenthetical_markers', async () => {
    const content = '## Infrastructure Essentials (High Impact, Medium Effort) ✅';
    
    const violations = await lintWithConfig(content, { ignoreAfterEmoji: true });
    
    // Should only validate "Infrastructure Essentials" before parentheses and emoji
    // "Essentials" should trigger a violation (should be lowercase)
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].errorDetail).toMatch(/Essentials/i);
  });

  // Real-world example from issue
  test('test_should_handle_real_world_roadmap_heading_with_status', async () => {
    const content = '## SUBSTANTIALLY COMPLETED ✅';
    
    const violations = await lintWithConfig(content, { ignoreAfterEmoji: true });
    
    // Should flag "SUBSTANTIALLY COMPLETED" before emoji (all caps violation)
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].errorDetail).toMatch(/all caps|should be/i);
  });

  // Verify heading before emoji is still validated properly
  test('test_should_validate_heading_text_before_emoji_normally', async () => {
    const validContent = '## Proper sentence case ✅ IGNORED';
    const invalidContent = '## Improper Sentence Case ✅ IGNORED';
    
    const validViolations = await lintWithConfig(validContent, { ignoreAfterEmoji: true });
    const invalidViolations = await lintWithConfig(invalidContent, { ignoreAfterEmoji: true });
    
    // Valid sentence case before emoji should pass
    expect(validViolations).toHaveLength(0);
    
    // Invalid sentence case before emoji should fail
    expect(invalidViolations.length).toBeGreaterThan(0);
    expect(invalidViolations[0].errorDetail).toMatch(/Sentence|Case/);
  });

  // Verify it works with different emoji types
  test('test_should_work_with_various_emoji_types', async () => {
    const testCases = [
      '## Task 🎉 DONE',           // Celebration emoji
      '## Task 🚀 LAUNCHED',       // Rocket emoji
      '## Task ✨ COMPLETED',      // Sparkles emoji
      '## Task 📝 NOTED',          // Memo emoji
      '## Task ⚡ FAST',           // Lightning emoji
      '## Task 🔧 FIXED',          // Wrench emoji
      '## Task 👍 APPROVED',       // Thumbs up emoji
      '## Task ❌ REJECTED',       // Cross mark emoji
    ];
    
    for (const content of testCases) {
      const violations = await lintWithConfig(content, { ignoreAfterEmoji: true });
      expect(violations).toHaveLength(0);
    }
  });

  // Test with specialTerms configuration combined with ignoreAfterEmoji
  test('test_should_work_with_specialTerms_configuration', async () => {
    const content = '## Using API correctly ✅ DONE';
    
    const violations = await lintWithConfig(content, {
      ignoreAfterEmoji: true,
      specialTerms: ['API']
    });
    
    // Should validate "Using API correctly" and allow API, ignore "DONE" after emoji
    expect(violations).toHaveLength(0);
  });

  // Test that emoji in code spans don't trigger truncation
  test('test_should_not_truncate_at_emoji_inside_code_spans', async () => {
    const content = '## Using `✅` emoji WRONG';
    
    const violations = await lintWithConfig(content, { ignoreAfterEmoji: true });
    
    // Emoji inside code span shouldn't trigger truncation
    // "WRONG" should be flagged
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].errorDetail).toMatch(/WRONG/i);
  });
});

describe('ignoreAfterEmoji with bold text in list items', () => {
  // Test that ignoreAfterEmoji also works for bold text in list items
  test('test_should_ignore_text_after_emoji_in_bold_list_items', async () => {
    const content = '- **Task complete ✅ DONE**';

    const violations = await lintWithConfig(content, { ignoreAfterEmoji: true });

    // Text after emoji in bold should be ignored
    expect(violations).toHaveLength(0);
  });

  test('test_should_validate_bold_text_before_emoji_in_list_items', async () => {
    const content = '- **WRONG Case ✅ IGNORED**';

    const violations = await lintWithConfig(content, { ignoreAfterEmoji: true });

    // Should flag "WRONG Case" before emoji (improper capitalization)
    expect(violations.length).toBeGreaterThan(0);
    // Error message should be about capitalization
    expect(violations[0].errorDetail).toMatch(/capitalized|all caps/i);
  });

  // Test autofix for bold text with ignoreAfterEmoji: true
  test('test_should_not_modify_post_emoji_text_in_bold_autofix_when_ignoreAfterEmoji_enabled', async () => {
    const content = '- **WRONG STATUS ✅ DONE**';

    const violations = await lintWithConfig(content, { ignoreAfterEmoji: true });

    // Should flag "WRONG STATUS" before emoji
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].fixInfo).toBeDefined();

    if (violations[0].fixInfo) {
      const { insertText } = violations[0].fixInfo;

      // Should fix to "Wrong status" but not include post-emoji text
      expect(insertText).toBe('Wrong status');
      expect(insertText).not.toContain('DONE');
      expect(insertText).not.toContain('done');
      expect(insertText).not.toContain('✅');
    }
  });
});
