/**
 * @integration
 * Enhanced fixture test demonstrating precise line-by-line validation
 * using ✅/❌ markers to specify expected pass/fail behavior.
 */
import { describe, test } from '@jest/globals';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import backtickRule from '../../src/rules/backtick-code-elements.js';
import { 
  testRuleWithFixtureValidation, 
  assertFixtureValidation,
  createFixtureTest 
} from '../helpers/fixture-validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the fixture file
const fixturePath = join(__dirname, '../fixtures/backtick-math.fixture.md');
const fixtureContent = readFileSync(fixturePath, 'utf8');

describe('backtick-code-elements enhanced fixture validation', () => {
  test('validates math and code contexts with precise line expectations', async () => {
    const testResults = await testRuleWithFixtureValidation(
      backtickRule, 
      fixtureContent, 
      'backtick-code-elements'
    );
    
    // This will throw a detailed error if any line doesn't match expectations
    assertFixtureValidation(testResults);
    
    // Additional detailed logging for debugging
    console.log('Fixture validation summary:', testResults.validation.summary);
    console.log('Expected passes:', testResults.expectations.pass.length);
    console.log('Expected fails:', testResults.expectations.fail.length);
    console.log('Actual violations:', testResults.violations.length);
  });

  // Demonstrate the utility function approach
  test('math contexts using utility function', 
    createFixtureTest('backtick-math', backtickRule, fixtureContent, 'backtick-code-elements')
  );

  // Test individual expectations can be extracted
  test('expectations are correctly parsed', async () => {
    const testResults = await testRuleWithFixtureValidation(
      backtickRule, 
      fixtureContent, 
      'backtick-code-elements'
    );
    
    const { expectations } = testResults;
    
    // Verify we have both pass and fail expectations
    expect(expectations.pass.length).toBeGreaterThan(0);
    expect(expectations.fail.length).toBeGreaterThan(0);
    
    // Verify specific lines based on the fixture content
    // Line 3: LaTeX inline math should pass
    expect(expectations.pass).toContain(3);
    // Line 19: shell command should fail  
    expect(expectations.fail).toContain(19);
    // Line 20: shell export should fail
    expect(expectations.fail).toContain(20);
  });
});