/**
 * Round 5 false positive fixes based on GitHub repos audit.
 * Patterns identified from agent-playbook, promptorium, and other repos.
 */
import { lint } from 'markdownlint/promise';
import sentenceCaseHeading from '../../src/rules/sentence-case-heading.js';
import noLiteralAmpersand from '../../src/rules/no-literal-ampersand.js';

describe('False positive fixes - Round 5', () => {
  describe('sentence-case-heading (SC001) - Changelog vs CHANGELOG', () => {
    test('should NOT suggest CHANGELOG for "Changelog" as a section title', async () => {
      const input = '# Changelog\n\nThis document tracks changes.';

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'sentence-case-heading': true,
        },
        customRules: [sentenceCaseHeading],
      });

      // "Changelog" as a title word should be valid - no violations
      expect(result.input).toHaveLength(0);
    });

    test('should allow both Changelog.md and CHANGELOG.md forms', async () => {
      // Both "Changelog.md" and "CHANGELOG.md" are acceptable
      // We don't force conversion since "Changelog" is an ambiguous term
      const input = '# See the Changelog.md file';

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'sentence-case-heading': true,
        },
        customRules: [sentenceCaseHeading],
      });

      // No violations - Changelog.md is acceptable
      expect(result.input).toHaveLength(0);
    });
  });

  describe('sentence-case-heading (SC001) - Kebab-case identifiers in bold', () => {
    test('should NOT flag kebab-case identifier in bold as needing capitalization', async () => {
      const input = '### **architecture-reviewer**\n\nThis agent reviews architecture.';

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'sentence-case-heading': true,
        },
        customRules: [sentenceCaseHeading],
      });

      // Kebab-case identifiers in bold should not require capitalization
      expect(result.input).toHaveLength(0);
    });

    test('should NOT flag multiple kebab-case identifiers in bold', async () => {
      const input = [
        '### **code-quality-reviewer**',
        '### **debt-analyzer**',
        '### **performance-analyzer**',
        '### **tests-tiered**'
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

    test('should STILL flag regular bold text in list items that needs sentence case', async () => {
      // Test bold text in list items (where validateBoldText is used)
      const input = '- **Getting Started Guide**: This is the description.';

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'sentence-case-heading': true,
        },
        customRules: [sentenceCaseHeading],
      });

      // "Started" and "Guide" should be lowercase in sentence case
      expect(result.input.length).toBeGreaterThan(0);
    });
  });

  describe('sentence-case-heading (SC001) - Bold all-caps emphasis words', () => {
    test('should NOT flag **ALWAYS** as needing capitalization fix', async () => {
      const input = '### **ALWAYS**\n\nFollow these guidelines.';

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'sentence-case-heading': true,
        },
        customRules: [sentenceCaseHeading],
      });

      // All-caps emphasis words in bold should be allowed
      expect(result.input).toHaveLength(0);
    });

    test('should NOT flag **NEVER** as needing capitalization fix', async () => {
      const input = '### **NEVER**\n\nAvoid these patterns.';

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

    test('should NOT flag other common all-caps emphasis words', async () => {
      const input = [
        '### **WARNING**',
        '### **IMPORTANT**',
        '### **NOTE**',
        '### **CAUTION**',
        '### **TODO**'
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

  describe('no-literal-ampersand (NLA001) - Ampersand in headings', () => {
    test('should NOT flag & in section headings', async () => {
      const input = '### Reasoning & Thinking\n\nThis section covers both topics.';

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'no-literal-ampersand': true,
        },
        customRules: [noLiteralAmpersand],
      });

      expect(result.input).toHaveLength(0);
    });

    test('should NOT flag & in headings with emoji', async () => {
      const input = [
        '### 🧠 Reasoning & Thinking',
        '### 📚 Documentation & Context',
        '### 🌐 Web & Social',
        '### 📖 Research & Knowledge'
      ].join('\n\n');

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'no-literal-ampersand': true,
        },
        customRules: [noLiteralAmpersand],
      });

      expect(result.input).toHaveLength(0);
    });

    test('should STILL flag & in regular prose', async () => {
      const input = 'The quick & easy solution is to use this tool.';

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'no-literal-ampersand': true,
        },
        customRules: [noLiteralAmpersand],
      });

      expect(result.input.length).toBeGreaterThan(0);
    });
  });

  describe('no-literal-ampersand (NLA001) - Ampersand in brand names', () => {
    test('should NOT flag & in known brand names', async () => {
      const input = 'Use the Zwilling Fresh & Save vacuum sealer for storage.';

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'no-literal-ampersand': true,
        },
        customRules: [noLiteralAmpersand],
      });

      expect(result.input).toHaveLength(0);
    });

    test('should NOT flag & in brand names within bold text', async () => {
      const input = '**Zwilling Fresh & Save vacuum sealing system** is recommended.';

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'no-literal-ampersand': true,
        },
        customRules: [noLiteralAmpersand],
      });

      expect(result.input).toHaveLength(0);
    });

    test('should NOT flag & in other common brand patterns', async () => {
      const input = [
        'Check out Barnes & Noble for books.',
        'The AT&T network is reliable.',
        'Use Procter & Gamble products.'
      ].join('\n');

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'no-literal-ampersand': true,
        },
        customRules: [noLiteralAmpersand],
      });

      expect(result.input).toHaveLength(0);
    });
  });
});
