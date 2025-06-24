/**
 * Test for LaTeX math expressions in backtick-code-elements rule
 * 
 * Verifies that LaTeX math expressions (both inline and block) are properly
 * ignored by the backtick-code-elements rule.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { describe, test, expect } from '@jest/globals';
import { lint } from 'markdownlint/promise';
import backtickRule from '../../.vscode/custom-rules/backtick-code-elements.js';
import { parseFixture } from '../utils/fixture.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturePath = path.join(
  __dirname,
  '../fixtures/backtick/math.fixture.md'
);

describe('backtick-code-elements math expressions', () => {
  const fixture = parseFixture(fixturePath);
  
  test('ignores LaTeX math expressions', async () => {
    const options = {
      customRules: [backtickRule],
      files: [fixturePath],
      resultVersion: 3
    };
    
    const results = await lint(options);
    const violations = results[fixturePath] || [];
    const ruleViolations = violations.filter(v =>
      v.ruleNames.includes('backtick-code-elements') ||
      v.ruleNames.includes('BCE001')
    );
    
    // We expect exactly 2 violations - the ones marked with ❌ in the fixture
    expect(ruleViolations).toHaveLength(2);
    
    // Verify that the violations are for the expected lines
    const violationLines = ruleViolations.map(v => v.lineNumber);
    expect(violationLines).toContain(21); // grep $pattern file.txt
    expect(violationLines).toContain(22); // export x=$value
    
    // Verify that none of the math expressions are flagged
    const mathLines = [4, 5, 6, 7, 11, 14, 17, 18];
    for (const line of mathLines) {
      expect(violationLines).not.toContain(line);
    }
  });
  
  test('provides descriptive details for violations', async () => {
    const options = {
      customRules: [backtickRule],
      files: [fixturePath],
      resultVersion: 3
    };
    
    const results = await lint(options);
    const ruleViolations = (results[fixturePath] || []).filter(v =>
      v.ruleNames.includes('backtick-code-elements') ||
      v.ruleNames.includes('BCE001')
    );
    
    ruleViolations.forEach(v => {
      expect(v.errorDetail).toMatch(/^Wrap .+ in backticks\.$/); 
    });
  });
});
