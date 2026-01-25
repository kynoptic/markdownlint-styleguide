/**
 * Round 6 false positive fixes based on comprehensive pattern analysis.
 * Patterns identified from agent-playbook, promptorium, and other repos.
 */
import { lint } from 'markdownlint/promise';
import sentenceCaseHeading from '../../src/rules/sentence-case-heading.js';

describe('False positive fixes - Round 6', () => {
  describe('sentence-case-heading (SC001) - Filename headings', () => {
    test('should NOT flag filename headings like ### batch-transform.js', async () => {
      const input = '### batch-transform.js\n\nThis script handles batch transformations.';

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

    test('should NOT flag various filename extensions in headings', async () => {
      const input = [
        '### transform-workflows.js',
        '### config-loader.ts',
        '### setup.py',
        '### build.sh',
        '### schema.json',
        '### config.yaml',
        '### settings.yml',
        '### readme.md',
        '### index.mjs',
        '### utils.cjs'
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

    test('should STILL flag regular lowercase headings', async () => {
      const input = '### getting started with the tool\n\nThis is a guide.';

      const result = await lint({
        strings: { input },
        config: {
          default: false,
          'sentence-case-heading': true,
        },
        customRules: [sentenceCaseHeading],
      });

      // "getting" should be flagged as needing capitalization
      expect(result.input.length).toBeGreaterThan(0);
    });
  });

  describe('sentence-case-heading (SC001) - Skills as proper noun', () => {
    test('should NOT flag "Skills" when referring to Claude Skills feature', async () => {
      const input = [
        '## The Skills architecture',
        '## Where Skills work',
        '## Available Skills',
        '## Creating new Skills'
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

    test('should NOT flag "Agent Skills" as a compound proper noun', async () => {
      const input = '## Get started with Agent Skills';

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

  describe('sentence-case-heading (SC001) - Bold path patterns', () => {
    test('should NOT flag bold directory references like **scripts/**', async () => {
      const input = [
        '### **scripts/**',
        '### **templates/**',
        '### **examples/**',
        '### **src/**'
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

    test('should NOT flag bold filename references like **SKILL.md**', async () => {
      const input = [
        '### **SKILL.md**',
        '### **README.md**',
        '### **config.json**',
        '### **package.json**'
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

  describe('sentence-case-heading (SC001) - OpenCode as proper noun', () => {
    test('should NOT flag OpenCode as needing capitalization change', async () => {
      const input = [
        '## OpenCode distribution',
        '### **OpenCode**',
        '## Getting started with OpenCode'
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

  describe('sentence-case-heading (SC001) - Bold product names', () => {
    test('should NOT flag PowerPoint as needing lowercase', async () => {
      const input = '### **PowerPoint (pptx)**\n\nExport to PowerPoint format.';

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
