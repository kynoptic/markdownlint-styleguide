// @ts-check

/**
 * @fileoverview Tests to validate that emerging technology terms are properly recognized
 * and don't trigger false positives in sentence-case and backtick rules.
 */

import { describe, test, expect } from '@jest/globals';
import { lint } from 'markdownlint/promise';
import sentenceCaseRule from '../../src/rules/sentence-case-heading.js';
import backtickRule from '../../src/rules/backtick-code-elements.js';

/**
 * Helper function to test a markdown string with sentence-case rule
 * @param {string} markdown - The markdown content to test
 * @returns {Promise<Array>} Array of rule violations
 */
async function testSentenceCase(markdown) {
  const options = {
    strings: { 'test': markdown },
    customRules: [sentenceCaseRule],
    config: { default: false, 'sentence-case-heading': true }
  };
  const results = await lint(options);
  return results.test || [];
}

/**
 * Helper function to test a markdown string with backtick rule
 * @param {string} markdown - The markdown content to test
 * @returns {Promise<Array>} Array of rule violations
 */
async function testBacktick(markdown) {
  const options = {
    strings: { 'test': markdown },
    customRules: [backtickRule],
    config: { default: false, 'backtick-code-elements': true }
  };
  const results = await lint(options);
  return results.test || [];
}

describe('Emerging Terms Validation', () => {
  describe('AI and machine learning terms', () => {
    test('recognizes modern AI terms in headings without false positives', async () => {
      const markdown = `
# Getting started with ChatGPT and OpenAI
## Using Claude and Anthropic services
### LLM and NLP techniques
#### Generative AI workflows
##### PyTorch and TensorFlow comparison
`;

      const violations = await testSentenceCase(markdown);

      // Should not flag any of these as sentence case violations
      expect(violations).toHaveLength(0);
    });

    test('does not require backticks for recognized AI terms', async () => {
      const markdown = `
This document covers ChatGPT, Claude, and other LLM technologies.
We'll explore Generative AI and NLP techniques using PyTorch.
The guide includes OpenAI and Anthropic service integrations.
`;

      const violations = await testBacktick(markdown);

      // Should not flag these recognized terms for backticks
      const aiTermViolations = violations.filter(v =>
        v.errorContext?.includes('ChatGPT') ||
        v.errorContext?.includes('Claude') ||
        v.errorContext?.includes('LLM') ||
        v.errorContext?.includes('OpenAI') ||
        v.errorContext?.includes('Anthropic') ||
        v.errorContext?.includes('PyTorch')
      );

      expect(aiTermViolations).toHaveLength(0);
    });
  });

  describe('Modern web frameworks and tools', () => {
    test('recognizes modern framework names in headings', async () => {
      const markdown = `
# Introduction to Next.js development
## Svelte vs SvelteKit comparison
### Deno and Bun alternatives
#### Remix and Nuxt frameworks
`;

      const violations = await testSentenceCase(markdown);

      // The first heading will have a violation because "Next" is not recognized,
      // but the recognized terms should be preserved correctly in other headings
      const frameworkViolations = violations.filter(v =>
        v.errorContext?.includes('Svelte') ||
        v.errorContext?.includes('SvelteKit') ||
        v.errorContext?.includes('Deno') ||
        v.errorContext?.includes('Bun') ||
        v.errorContext?.includes('Remix') ||
        v.errorContext?.includes('Nuxt')
      );

      expect(frameworkViolations).toHaveLength(0);
    });

    test('does not require backticks for recognized framework names in prose', async () => {
      const markdown = `
Modern frameworks like Next.js, Svelte, and Astro are changing web development.
Tools like Deno and Bun offer alternatives to Node.js.
SvelteKit and Remix provide full-stack solutions.
`;

      const violations = await testBacktick(markdown);

      // Should not flag these framework names for backticks
      const frameworkViolations = violations.filter(v =>
        v.errorContext?.includes('Next.js') ||
        v.errorContext?.includes('Svelte') ||
        v.errorContext?.includes('Astro') ||
        v.errorContext?.includes('Deno') ||
        v.errorContext?.includes('Bun') ||
        v.errorContext?.includes('SvelteKit') ||
        v.errorContext?.includes('Remix')
      );

      expect(frameworkViolations).toHaveLength(0);
    });
  });

  describe('Modern databases and cloud technologies', () => {
    test('recognizes modern database names', async () => {
      const markdown = `
# Comparing Supabase and PlanetScale
## ClickHouse for analytics
### Neo4j graph databases
#### Firestore and DynamoDB
`;

      const violations = await testSentenceCase(markdown);

      expect(violations).toHaveLength(0);
    });

    test('does not require backticks for database names', async () => {
      const markdown = `
Consider using Supabase or PlanetScale for your next project.
ClickHouse provides excellent analytics capabilities.
Neo4j excels at graph database use cases.
`;

      const violations = await testBacktick(markdown);

      const dbViolations = violations.filter(v =>
        v.errorContext?.includes('Supabase') ||
        v.errorContext?.includes('PlanetScale') ||
        v.errorContext?.includes('ClickHouse') ||
        v.errorContext?.includes('Neo4j')
      );

      expect(dbViolations).toHaveLength(0);
    });
  });

  describe('Emerging technology acronyms', () => {
    test('preserves correct casing for new tech acronyms', async () => {
      const markdown = `
# Understanding AR and VR development
## LLM and NLP integration
### LCNC platforms and RL techniques
`;

      const violations = await testSentenceCase(markdown);

      expect(violations).toHaveLength(0);
    });

    test('recognizes multi-word emerging tech terms', async () => {
      const markdown = `
# Introduction to Generative AI
## Edge Computing solutions
### Quantum Computing basics
#### Reinforcement Learning applications
`;

      const violations = await testSentenceCase(markdown);

      expect(violations).toHaveLength(0);
    });
  });

  describe('Cloud and deployment services', () => {
    test('recognizes modern deployment platforms', async () => {
      const markdown = `
# Deploying to Vercel and Netlify
## Stripe integration guide
### Twilio communication APIs
`;

      const violations = await testSentenceCase(markdown);

      // Should now recognize APIs as valid
      expect(violations).toHaveLength(0);
    });
  });
});