/**
 * Test helper for validating fixture files with ✅/❌ markers
 * 
 * This helper parses fixture files that use comment markers to indicate
 * expected pass/fail behavior and validates that lint results match expectations.
 */

import { lint } from 'markdownlint/promise';
import MarkdownIt from 'markdown-it';

/**
 * Parse fixture content to extract line expectations
 * @param {string} content - The fixture file content
 * @returns {Object} Parsed expectations with line numbers
 */
export function parseFixtureExpectations(content) {
  const lines = content.split('\n');
  const expectations = {
    pass: [], // Lines that should not have violations (✅)
    fail: [], // Lines that should have violations (❌)
    fixes: new Map() // Line number -> expected fix text
  };

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    
    if (line.includes('<!-- ✅ -->')) {
      expectations.pass.push(lineNumber);
    } else if (line.includes('<!-- ❌')) {
      expectations.fail.push(lineNumber);
      
      // Check for fix expectations
      const fixMatch = line.match(/<!-- ❌ fix: (.+?) -->/);
      if (fixMatch) {
        expectations.fixes.set(lineNumber, fixMatch[1]);
      }
    }
  });

  return expectations;
}

/**
 * Validate lint results against fixture expectations
 * @param {Array} violations - Lint violations from markdownlint
 * @param {Object} expectations - Parsed expectations from parseFixtureExpectations
 * @param {string} content - Original fixture content for debugging
 * @returns {Object} Validation results
 */
export function validateFixtureResults(violations, expectations, content) {
  const lines = content.split('\n');
  const violationLines = new Set(violations.map(v => v.lineNumber));
  
  const results = {
    success: true,
    errors: [],
    summary: {
      expectedPass: expectations.pass.length,
      expectedFail: expectations.fail.length,
      actualViolations: violations.length,
      correctPasses: 0,
      correctFails: 0,
      incorrectPasses: 0,
      incorrectFails: 0
    }
  };

  // Check lines marked as should pass (✅)
  expectations.pass.forEach(lineNumber => {
    if (violationLines.has(lineNumber)) {
      results.success = false;
      results.errors.push({
        type: 'UNEXPECTED_VIOLATION',
        line: lineNumber,
        content: lines[lineNumber - 1],
        message: `Line ${lineNumber} was marked as should pass (✅) but has a violation`
      });
      results.summary.incorrectFails++;
    } else {
      results.summary.correctPasses++;
    }
  });

  // Check lines marked as should fail (❌)
  expectations.fail.forEach(lineNumber => {
    if (!violationLines.has(lineNumber)) {
      results.success = false;
      results.errors.push({
        type: 'MISSING_VIOLATION',
        line: lineNumber,
        content: lines[lineNumber - 1],
        message: `Line ${lineNumber} was marked as should fail (❌) but has no violation`
      });
      results.summary.incorrectPasses++;
    } else {
      results.summary.correctFails++;
    }
  });

  // Check for unexpected violations (lines without markers)
  violations.forEach(violation => {
    const { lineNumber } = violation;
    if (!expectations.pass.includes(lineNumber) && !expectations.fail.includes(lineNumber)) {
      results.success = false;
      results.errors.push({
        type: 'UNMARKED_VIOLATION',
        line: lineNumber,
        content: lines[lineNumber - 1],
        message: `Line ${lineNumber} has a violation but no marker (✅ or ❌)`
      });
    }
  });

  return results;
}

/**
 * Test a rule against a fixture file with marker validation
 * @param {Object} rule - The markdownlint rule to test
 * @param {string} content - The fixture file content
 * @param {string} ruleName - The name of the rule being tested
 * @param {Object} options - Additional lint options
 * @returns {Promise<Object>} Test results with validation
 */
export async function testRuleWithFixtureValidation(rule, content, ruleName, options = {}) {
  // Parse expectations from fixture
  const expectations = parseFixtureExpectations(content);
  
  // Default lint options with markdown-it support
  const lintOptions = {
    customRules: [rule],
    strings: { content },
    resultVersion: 3,
    markdownItFactory: () => new MarkdownIt({ linkify: true }),
    ...options
  };
  
  // Run markdownlint
  const lintResults = await lint(lintOptions);

  const violations = (lintResults.content || [])
    .filter(v => v.ruleNames.includes(ruleName));

  // Validate results against expectations
  const validation = validateFixtureResults(violations, expectations, content);

  return {
    expectations,
    violations,
    validation,
    meta: {
      contentLength: content.length,
      contentLines: content.split('\n').length,
      ruleName
    }
  };
}

/**
 * Create Jest test assertions for fixture validation
 * @param {Object} testResults - Results from testRuleWithFixtureValidation
 */
export function assertFixtureValidation(testResults) {
  const { validation, expectations, meta } = testResults;

  // Primary assertion: validation should succeed
  if (!validation.success) {
    const errorMessages = validation.errors.map(error => 
      `${error.type}: ${error.message}\n  Content: "${error.content}"`
    ).join('\n\n');
    
    throw new Error(
      `Fixture validation failed for rule '${meta.ruleName}':\n\n${errorMessages}\n\n` +
      `Summary: ${validation.summary.correctPasses}/${expectations.pass.length} passes, ` +
      `${validation.summary.correctFails}/${expectations.fail.length} fails`
    );
  }

  // Additional assertions for test completeness
  expect(expectations.pass.length + expectations.fail.length).toBeGreaterThan(0);
  expect(validation.summary.correctPasses).toBe(expectations.pass.length);
  expect(validation.summary.correctFails).toBe(expectations.fail.length);
  expect(validation.summary.incorrectPasses).toBe(0);
  expect(validation.summary.incorrectFails).toBe(0);
}

/**
 * Utility to create a comprehensive fixture test
 * @param {string} fixtureName - Name of the fixture for test description
 * @param {Object} rule - The markdownlint rule to test
 * @param {string} content - The fixture file content
 * @param {string} ruleName - The name of the rule being tested
 * @param {Object} options - Additional lint options
 * @returns {Function} Jest test function
 */
export function createFixtureTest(fixtureName, rule, content, ruleName, options = {}) {
  return async () => {
    const testResults = await testRuleWithFixtureValidation(rule, content, ruleName, options);
    assertFixtureValidation(testResults);
    
    // Also snapshot for regression detection
    expect({
      expectations: testResults.expectations,
      violations: testResults.violations.map(v => ({
        lineNumber: v.lineNumber,
        ruleNames: v.ruleNames,
        ruleDescription: v.ruleDescription,
        errorRange: v.errorRange
      }))
    }).toMatchSnapshot(`fixture-${fixtureName}`);
  };
}