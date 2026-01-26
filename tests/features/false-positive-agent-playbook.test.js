/**
 * @fileoverview Tests for false positives discovered in agent-playbook repository.
 * These tests capture specific patterns that were incorrectly flagged during auto-fix.
 */

import { lint } from 'markdownlint/promise';
import backtickCodeElements from '../../src/rules/backtick-code-elements.js';
import sentenceCaseHeading from '../../src/rules/sentence-case-heading.js';

/**
 * Helper to run markdownlint with a specific rule.
 * @param {string} content - Markdown content to lint.
 * @param {object} rule - The rule to test.
 * @param {object} config - Optional rule configuration.
 * @returns {Promise<object[]>} Array of lint errors.
 */
async function lintWithRule(content, rule, config = {}) {
  const result = await lint({
    strings: { test: content },
    customRules: [rule],
    config: {
      default: false,
      [rule.names[0]]: config === false ? false : (Object.keys(config).length > 0 ? config : true)
    }
  });
  return result.test || [];
}

describe('BCE false positives from agent-playbook', () => {
  describe('abbreviation plurals should NOT be flagged', () => {
    const abbreviationPlurals = [
      'PRs',
      'IDs',
      'MCPs',
      'ADRs',
      'UUIDs',
      'IDEs',
      'SHAs'
    ];

    test.each(abbreviationPlurals)('%s should not require backticks', async (abbrev) => {
      const content = `All ${abbrev} must link to issues.`;
      const errors = await lintWithRule(content, backtickCodeElements);
      const relevantErrors = errors.filter(e => e.context === abbrev);
      expect(relevantErrors).toHaveLength(0);
    });

    test('PRs in context should not be flagged', async () => {
      const content = `- PRs must link issues with "Closes #<id>"`;
      const errors = await lintWithRule(content, backtickCodeElements);
      const relevantErrors = errors.filter(e => e.context === 'PRs');
      expect(relevantErrors).toHaveLength(0);
    });

    test('session IDs should not be flagged', async () => {
      const content = `Never log PII, auth tokens, session IDs, or user data.`;
      const errors = await lintWithRule(content, backtickCodeElements);
      const relevantErrors = errors.filter(e => e.context === 'IDs');
      expect(relevantErrors).toHaveLength(0);
    });
  });

  describe('product/brand names should NOT be flagged', () => {
    const productNames = [
      'CrashPlan',
      'CrowdStrike',
      'ServiceNow',
      'SharePoint',
      'HarvardKey',
      'BigQuery',
      'PyYAML',
      'WebP',
      'DevTools',
      'truffleHog',
      'SpotBugs',
      'OpenRewrite'
    ];

    test.each(productNames)('%s should not require backticks', async (product) => {
      const content = `Install ${product} for better security.`;
      const errors = await lintWithRule(content, backtickCodeElements);
      const relevantErrors = errors.filter(e => e.context === product);
      expect(relevantErrors).toHaveLength(0);
    });

    test('CrowdStrike in installation context', async () => {
      const content = `Everyone needs to install CrowdStrike on their computers.`;
      const errors = await lintWithRule(content, backtickCodeElements);
      const relevantErrors = errors.filter(e => e.context === 'CrowdStrike');
      expect(relevantErrors).toHaveLength(0);
    });

    test('SharePoint in documentation context', async () => {
      const content = `Creates internal documentation pages for the HMS IT SharePoint intranet.`;
      const errors = await lintWithRule(content, backtickCodeElements);
      const relevantErrors = errors.filter(e => e.context === 'SharePoint');
      expect(relevantErrors).toHaveLength(0);
    });
  });

  describe('WiFi and common tech terms should NOT be flagged', () => {
    test('WiFi should not require backticks', async () => {
      const content = `Resources: VPN setup guide, network policies, WiFi setup.`;
      const errors = await lintWithRule(content, backtickCodeElements);
      const relevantErrors = errors.filter(e => e.context === 'WiFi');
      expect(relevantErrors).toHaveLength(0);
    });
  });

  describe('import statements should be selective', () => {
    test('import followed by common English word should NOT be flagged', async () => {
      const content = `If you have skills in ~/.claude/skills, import them:`;
      const errors = await lintWithRule(content, backtickCodeElements);
      // "import them" should NOT be flagged - "them" is not a code identifier
      const relevantErrors = errors.filter(e => e.context === 'import them');
      expect(relevantErrors).toHaveLength(0);
    });

    test('import followed by pronouns should NOT be flagged', async () => {
      const testCases = [
        'import them',
        'import it',
        'import these',
        'import those',
        'import something',
        'import everything'
      ];

      for (const phrase of testCases) {
        const content = `You can ${phrase} into your project.`;
        const errors = await lintWithRule(content, backtickCodeElements);
        const relevantErrors = errors.filter(e => e.context === phrase);
        expect(relevantErrors).toHaveLength(0);
      }
    });

    test('import new should NOT be flagged as code', async () => {
      const content = `The repository can automatically detect and import new skills.`;
      const errors = await lintWithRule(content, backtickCodeElements);
      const relevantErrors = errors.filter(e => e.context === 'import new');
      expect(relevantErrors).toHaveLength(0);
    });
  });

  describe('eCommons and institutional names should NOT be flagged', () => {
    test('eCommons should not require backticks', async () => {
      const content = `| HMS account | eCommons account |`;
      const errors = await lintWithRule(content, backtickCodeElements);
      const relevantErrors = errors.filter(e => e.context === 'eCommons');
      expect(relevantErrors).toHaveLength(0);
    });
  });

  describe('CommonJS module system name should NOT be flagged', () => {
    test('CommonJS as module system name', async () => {
      const content = `| Module systems | CommonJS require | ES modules import |`;
      const errors = await lintWithRule(content, backtickCodeElements);
      const relevantErrors = errors.filter(e => e.context === 'CommonJS');
      expect(relevantErrors).toHaveLength(0);
    });
  });
});

describe('Sentence-case false positives from agent-playbook', () => {
  describe('language names should remain capitalized', () => {
    test('English should remain capitalized in headings', async () => {
      // "American English" - English is a language name (proper noun)
      const content = `## American English spelling consistently`;
      const errors = await lintWithRule(content, sentenceCaseHeading);
      expect(errors).toHaveLength(0);
    });

    test('English in various contexts', async () => {
      const testCases = [
        '## English documentation standards',
        '## British English vs American English',
        '## Use plain English'
      ];

      for (const heading of testCases) {
        const errors = await lintWithRule(heading, sentenceCaseHeading);
        // Should not flag "English" as needing to be lowercase
        const englishErrors = errors.filter(e =>
          e.errorMessage && e.errorMessage.includes('"English"') && e.errorMessage.includes('lowercase')
        );
        expect(englishErrors).toHaveLength(0);
      }
    });
  });

  describe('historical event names should remain capitalized', () => {
    test('American Revolutionary War should remain capitalized', async () => {
      const content = `### American Revolutionary War`;
      const errors = await lintWithRule(content, sentenceCaseHeading);
      // This is a historical event name - all words should be capitalized
      expect(errors).toHaveLength(0);
    });

    test('Civil War should remain capitalized', async () => {
      const content = `### American Civil War`;
      const errors = await lintWithRule(content, sentenceCaseHeading);
      expect(errors).toHaveLength(0);
    });

    test('World War should remain capitalized', async () => {
      const content = `### World War II veterans`;
      const errors = await lintWithRule(content, sentenceCaseHeading);
      const relevantErrors = errors.filter(e =>
        e.errorMessage && e.errorMessage.includes('"War"') && e.errorMessage.includes('lowercase')
      );
      expect(relevantErrors).toHaveLength(0);
    });
  });

  describe('filenames should preserve original casing', () => {
    test('SKILL.md should remain uppercase', async () => {
      // "SKILL.md format" - SKILL.md is a filename that should preserve casing
      const content = `## SKILL.md format`;
      const errors = await lintWithRule(content, sentenceCaseHeading);
      expect(errors).toHaveLength(0);
    });

    test('README.md should remain uppercase', async () => {
      const content = `## README.md guidelines`;
      const errors = await lintWithRule(content, sentenceCaseHeading);
      expect(errors).toHaveLength(0);
    });

    test('CHANGELOG.md should remain uppercase', async () => {
      const content = `## CHANGELOG.md format`;
      const errors = await lintWithRule(content, sentenceCaseHeading);
      expect(errors).toHaveLength(0);
    });
  });

  describe('Skills as proper noun should remain capitalized', () => {
    test('Claude Code Skills should remain capitalized', async () => {
      const content = `## Claude Code Skills overview`;
      const errors = await lintWithRule(content, sentenceCaseHeading, {
        specialTerms: ['Claude Code', 'Skills']
      });
      expect(errors).toHaveLength(0);
    });
  });
});
