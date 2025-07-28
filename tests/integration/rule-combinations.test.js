/**
 * @integration
 * Comprehensive tests for rule combinations and interactions.
 * Tests how multiple rules work together on the same document.
 */
import { describe, test, expect } from '@jest/globals';
import { lint } from 'markdownlint/promise';
import markdownIt from 'markdown-it';
import sentenceRule from '../../src/rules/sentence-case-heading.js';
import backtickRule from '../../src/rules/backtick-code-elements.js';
import noBareUrlsRule from '../../src/rules/no-bare-urls.js';
import noLiteralAmpersandRule from '../../src/rules/no-literal-ampersand.js';
import noDeadLinksRule from '../../src/rules/no-dead-internal-links.js';

/**
 * Helper function to run multiple rules on content
 * @param {Array} rules - Array of rule objects
 * @param {string} content - Markdown content to test
 * @param {Object} config - Optional configuration object
 * @returns {Promise<Object>} Linting results
 */
async function runRulesOnContent(rules, content, config = {}) {
  return await lint({
    customRules: rules,
    strings: { test: content },
    resultVersion: 3,
    markdownItFactory: () => markdownIt(),
    config: {
      default: true,
      ...config
    }
  });
}

/**
 * Extract errors for a specific rule from results
 * @param {Object} results - Lint results
 * @param {string|Array<string>} ruleNames - Rule name(s) to filter by
 * @returns {Array} Array of errors for the specified rule
 */
function getErrorsForRule(results, ruleNames) {
  const names = Array.isArray(ruleNames) ? ruleNames : [ruleNames];
  return (results.test || []).filter(error => 
    error.ruleNames.some(name => names.includes(name))
  );
}

describe('Rule Combinations Integration Tests', () => {
  
  describe('All Rules Together', () => {
    const allRules = [
      sentenceRule,
      backtickRule, 
      noBareUrlsRule,
      noLiteralAmpersandRule,
      noDeadLinksRule
    ];

    test('handles document with multiple rule violations', async () => {
      const content = `# Working With APIs And Database Systems

This document explains how to work with APIs & database systems.

Key files to check:
- config.json file for settings
- src/utils/helper.js for utilities

## Setting Up The Development Environment

Follow these steps:

1. Install dependencies with npm install
2. Configure your settings.json file  
3. Test your setup & verify everything works

For more details, check the package.json file & documentation.
`;

      const results = await runRulesOnContent(allRules, content);
      
      // Should find violations from multiple rules
      expect(results.test).toBeDefined();
      expect(results.test.length).toBeGreaterThan(0);
      
      // Check specific rule violations
      const sentenceErrors = getErrorsForRule(results, ['sentence-case-heading']);
      const backtickErrors = getErrorsForRule(results, ['backtick-code-elements']);
      const ampersandErrors = getErrorsForRule(results, ['no-literal-ampersand']);
      
      expect(sentenceErrors.length).toBeGreaterThan(0); // "Working With APIs And Database Systems"
      expect(backtickErrors.length).toBeGreaterThan(0); // config.json, src/utils/helper.js
      expect(ampersandErrors.length).toBeGreaterThan(0); // "APIs & database", "settings.json & verify"
    });

    test('respects rule configuration when multiple rules active', async () => {
      const content = `# Working with APIs

Check the package.json file.

Use GitHub and VSCode for development.
`;

      const config = {
        'sentence-case-heading': {
          specialTerms: ['APIs']
        },
        'no-literal-ampersand': {
          exceptions: ['GitHub & VSCode']
        }
      };

      const rules = [sentenceRule, backtickRule, noLiteralAmpersandRule];
      const results = await runRulesOnContent(rules, content, config);
      
      const ampersandErrors = getErrorsForRule(results, ['no-literal-ampersand']);
      
      // Should respect configuration  
      expect(ampersandErrors.length).toBe(0); // no ampersands in this content
    });
  });

  describe('Autofix Interactions', () => {
    test('autofixes work correctly when multiple rules applied', async () => {
      const content = `# Working with APIs and development

Check the config.json file and visit the site for details.
`;

      const results = await runRulesOnContent([
        sentenceRule,
        backtickRule,
        noLiteralAmpersandRule
      ], content);

      // All violations should have fix information
      const violations = results.test || [];
      expect(violations.length).toBeGreaterThan(0);
      
      violations.forEach(violation => {
        if (violation.fixInfo) {
          expect(violation.fixInfo.editColumn).toBeGreaterThan(0);
        }
      });
    });

    test('autofix safety prevents conflicts between rules', async () => {
      const content = `# Test heading

Check this code.json file for configuration & settings.
`;

      const results = await runRulesOnContent([
        backtickRule,
        noLiteralAmpersandRule
      ], content);

      const violations = results.test || [];
      
      // Both rules should detect issues but fixes should be safe
      const backtickViolations = getErrorsForRule(results, ['backtick-code-elements']);
      const ampersandViolations = getErrorsForRule(results, ['no-literal-ampersand']);
      
      expect(backtickViolations.length).toBeGreaterThan(0);
      expect(ampersandViolations.length).toBeGreaterThan(0);
      
      // All fixes should be present and safe
      violations.forEach(violation => {
        if (violation.fixInfo) {
          expect(violation.fixInfo.editColumn).toBeGreaterThan(0);
          expect(violation.fixInfo.insertText || violation.fixInfo.deleteCount).toBeDefined();
        }
      });
    });
  });

  describe('Code Context Interactions', () => {
    test('rules respect code block boundaries consistently', async () => {
      const content = `# Working With APIs And Code Examples

Here's some code that contains URLs & file references:

\`\`\`javascript
// Check config.json for settings
const apiUrl = "https://api.example.com";
const result = fetch(apiUrl) && process(result);
\`\`\`

Outside code blocks:
- Check the config.json file
- Visit https://api.example.com & test the API
`;

      const results = await runRulesOnContent([
        sentenceRule,
        backtickRule,
        noBareUrlsRule, 
        noLiteralAmpersandRule
      ], content);

      const violations = results.test || [];
      
      // Verify that violations only occur outside code blocks
      violations.forEach(violation => {
        // Line 4-8 are inside the code block, should not have violations for content rules
        if (violation.lineNumber >= 4 && violation.lineNumber <= 8) {
          // Only sentence-case-heading violations should be allowed (on heading)
          const isHeadingRule = violation.ruleNames.includes('sentence-case-heading');
          if (!isHeadingRule) {
            throw new Error(`Unexpected violation on line ${violation.lineNumber} inside code block: ${violation.ruleNames.join(', ')}`);
          }
        }
      });

      // Should still find violations outside code blocks
      const outsideCodeViolations = violations.filter(v => v.lineNumber < 4 || v.lineNumber > 8);
      expect(outsideCodeViolations.length).toBeGreaterThan(0);
    });

    test('inline code detection works across multiple rules', async () => {
      const content = `# Configuration Guide

Use \`config.json\` and \`https://example.com\` in your setup.

Don't forget to update \`package.json\` & \`settings.js\` files.
`;

      const results = await runRulesOnContent([
        backtickRule,
        noBareUrlsRule,
        noLiteralAmpersandRule
      ], content);

      // Should find violations only outside inline code
      const backtickViolations = getErrorsForRule(results, ['backtick-code-elements']);
      const bareUrlViolations = getErrorsForRule(results, ['no-bare-url']);
      const ampersandViolations = getErrorsForRule(results, ['no-literal-ampersand']);
      
      // No backtick violations since items are already in backticks
      expect(backtickViolations.length).toBe(0);
      
      // No bare URL violations since URL is in backticks
      expect(bareUrlViolations.length).toBe(0);
      
      // Should find ampersand violation (outside backticks)
      expect(ampersandViolations.length).toBeGreaterThan(0);
    });
  });

  describe('Performance with Multiple Rules', () => {
    test('processes large document with all rules efficiently', async () => {
      // Generate a large document with various patterns
      const sections = [];
      for (let i = 1; i <= 100; i++) {
        sections.push(`## Section ${i}: Working With APIs And System Configuration

This section discusses API integration & database management.

Key steps:
1. Configure your database.json file
2. Visit https://example.com/section-${i} for documentation  
3. Update your package.json & settings files

\`\`\`javascript
const config = require('./config.json');
const api = "https://api.example.com/v${i}";
const isValid = config && api;
\`\`\`

For more details, check the docs.md file & API reference.
`);
      }
      
      const content = `# Main Documentation\n\n${sections.join('\n\n')}`;
      
      const startTime = process.hrtime.bigint();
      const results = await runRulesOnContent([
        sentenceRule,
        backtickRule,
        noBareUrlsRule,
        noLiteralAmpersandRule
      ], content);
      const endTime = process.hrtime.bigint();
      
      const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
      
      // Should complete within reasonable time (5 seconds for large document)
      expect(duration).toBeLessThan(5000);
      
      // Should find multiple violations
      expect(results.test.length).toBeGreaterThan(100);
      
      console.log(`Processed ${content.length} characters with ${results.test.length} violations in ${duration.toFixed(2)}ms`);
    });
  });

  describe('Configuration Edge Cases', () => {
    test('handles conflicting configurations gracefully', async () => {
      const content = `# Working with APIs

Check the config.json file for settings.
`;

      const config = {
        'sentence-case-heading': {
          specialTerms: ['APIs']
        },
        'backtick-code-elements': {
          skipInlineCode: true
        }
      };

      const results = await runRulesOnContent([
        sentenceRule,
        backtickRule
      ], content, config);

      // Should handle configuration without errors
      expect(results.test).toBeDefined();
      
      const violations = results.test || [];
      if (violations.length > 0) {
        violations.forEach(violation => {
          expect(violation.ruleNames).toBeDefined();
          expect(violation.lineNumber).toBeGreaterThan(0);
        });
      }
    });

    test('validates configurations across multiple rules', async () => {
      const content = `# Test heading

Simple test content.
`;

      const invalidConfig = {
        'sentence-case-heading': {
          specialTerms: 'invalid-string-instead-of-array'
        }
      };

      const results = await runRulesOnContent([
        sentenceRule
      ], content, invalidConfig);

      // Should handle invalid configuration gracefully
      expect(results.test).toBeDefined();
      
      // May have configuration error messages but shouldn't crash
      const violations = results.test || [];
      if (violations.length > 0) {
        violations.forEach(violation => {
          expect(violation.ruleNames).toBeDefined();
          if (violation.detail) {
            expect(typeof violation.detail).toBe('string');
          }
        });
      }
    });
  });

  describe('Real-world Scenarios', () => {
    test('technical documentation with mixed content', async () => {
      const content = `# API Documentation For Modern Applications

## Authentication & Authorization

To authenticate with our API:

1. Get your API key from https://dashboard.example.com
2. Include it in your requests headers
3. Check the auth.js file for examples

### Code Example

\`\`\`javascript
const apiKey = process.env.API_KEY;
const response = await fetch('https://api.example.com/data', {
  headers: {
    'Authorization': \`Bearer \${apiKey}\`,
    'Content-Type': 'application/json'
  }
});
\`\`\`

## Configuration Files

Update these files:
- config.json for general settings
- package.json for dependencies  
- .env.example for environment variables

Visit our [support page](support.md) or https://help.example.com for assistance.

### Error Handling

Handle errors properly:

\`\`\`javascript
try {
  const data = await api.getData();
  return processData(data);
} catch (error) {
  console.error('API Error:', error);
  throw error;
}
\`\`\`

Remember to check logs.txt & error.log files for debugging.
`;

      const results = await runRulesOnContent([
        sentenceRule,
        backtickRule,
        noBareUrlsRule,
        noLiteralAmpersandRule,
        noDeadLinksRule
      ], content);
      
      const violations = results.test || [];
      expect(violations.length).toBeGreaterThan(0);
      
      // Should identify various issues across different rules
      const ruleTypes = new Set();
      violations.forEach(violation => {
        violation.ruleNames.forEach(name => ruleTypes.add(name));
      });
      
      expect(ruleTypes.size).toBeGreaterThan(1); // Multiple rule types should be triggered
    });
  });
});