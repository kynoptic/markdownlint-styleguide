/**
 * @integration  
 * Enhanced fixture test for no-bare-urls rule demonstrating precise validation
 * of every marked line in the fixture.
 */
import { describe, test } from '@jest/globals';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import noBareUrlsRule from '../../src/rules/no-bare-urls.js';
import { 
  testRuleWithFixtureValidation, 
  assertFixtureValidation,
  parseFixtureExpectations 
} from '../helpers/fixture-validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the fixture file
const fixturePath = join(__dirname, '../fixtures/no-bare-urls.fixture.md');
const fixtureContent = readFileSync(fixturePath, 'utf8');

describe('no-bare-urls enhanced fixture validation', () => {
  test('validates all URL cases with precise line expectations', async () => {
    const testResults = await testRuleWithFixtureValidation(
      noBareUrlsRule, 
      fixtureContent, 
      'no-bare-urls'
    );
    
    // This provides comprehensive validation of every marked line
    assertFixtureValidation(testResults);
    
    // Log detailed results for debugging
    console.log('URL validation results:', {
      totalLines: testResults.meta.contentLines,
      expectedPasses: testResults.expectations.pass.length,
      expectedFails: testResults.expectations.fail.length,
      actualViolations: testResults.violations.length,
      success: testResults.validation.success
    });
  });

  test('correctly identifies valid URL contexts', async () => {
    const testResults = await testRuleWithFixtureValidation(
      noBareUrlsRule, 
      fixtureContent, 
      'no-bare-urls'
    );
    
    const { expectations, violations } = testResults;
    
    // Verify specific valid cases are not flagged
    const validCases = [
      5,  // [This is a valid link](https://example.com)
      7,  // <https://www.example.com> autolink
      13, // `http://in.a.code.block` 
      21, // URL in fenced code block
      29, // `http://example.com` inline code
      43, // [Example](http://example.com) markdown link
      51  // <http://autolink.net> autolink
    ];
    
    validCases.forEach(lineNumber => {
      expect(expectations.pass).toContain(lineNumber);
    });
    
    // Ensure none of these lines have violations
    const violationLines = violations.map(v => v.lineNumber);
    validCases.forEach(lineNumber => {
      expect(violationLines).not.toContain(lineNumber);
    });
  });

  test('correctly identifies bare URL violations', async () => {
    const testResults = await testRuleWithFixtureValidation(
      noBareUrlsRule, 
      fixtureContent, 
      'no-bare-urls'
    );
    
    const { expectations, violations } = testResults;
    
    // Verify specific violation cases are flagged
    const violationCases = [
      9,  // http://example.com bare URL
      11, // https://google.com bare URL
      53, // http://api.example.com used as link text
      63, // http://bare.com basic violation
      65, // https://another.org/path
      81, // http://start.com at beginning
      89  //multiple URLs in one line
    ];
    
    violationCases.forEach(lineNumber => {
      expect(expectations.fail).toContain(lineNumber);
    });
    
    // Ensure all these lines have violations
    const violationLines = violations.map(v => v.lineNumber);
    violationCases.forEach(lineNumber => {
      expect(violationLines).toContain(lineNumber);
    });
  });

  test('parses fix expectations correctly', () => {
    const expectations = parseFixtureExpectations(fixtureContent);
    
    // Verify fix suggestions are captured
    expect(expectations.fixes.size).toBeGreaterThan(0);
    
    // Check specific fix expectations
    expect(expectations.fixes.get(63)).toBe('Visit our site at link.');
    expect(expectations.fixes.get(65)).toBe('Check out link.');
  });
});