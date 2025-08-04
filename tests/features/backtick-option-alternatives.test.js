// @ts-check

/**
 * Test suite for backtick rule option/alternative pattern handling.
 * Ensures that common option patterns like "true/false" are not flagged as file paths.
 */

import { describe, test, expect } from '@jest/globals';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { lint } from 'markdownlint/promise';
import backtickCodeElements from '../../src/rules/backtick-code-elements.js';

const fixturesDir = resolve(process.cwd(), 'tests/fixtures/backtick');

describe('Backtick Option Alternatives', () => {
  test('should not flag common option/alternative patterns', async () => {
    const fixtureContent = readFileSync(
      resolve(fixturesDir, 'option-alternatives.fixture.md'),
      'utf8'
    );

    const result = await lint({
      strings: {
        'test-content': fixtureContent,
      },
      config: {
        default: false,
        'backtick-code-elements': true,
      },
      customRules: [backtickCodeElements],
    });

    const violations = result['test-content'] || [];
    
    // We expect exactly 4 violations (the legitimate paths at the end)
    // Note: config/settings.json gets flagged twice (once for the path, once for the filename)
    expect(violations).toHaveLength(4);
    
    // Verify the violations are for the expected paths
    const contexts = violations.map(v => v.errorContext);
    expect(contexts).toContain('src/components');
    expect(contexts).toContain('config/settings.json');
    expect(contexts).toContain('settings.json');
    expect(contexts).toContain('docs/api');

    // Ensure none of the option patterns are flagged
    const optionPatterns = [
      'on/off', 'true/false', 'read/write', 'http/https', 'GET/POST',
      'input/output', 'pass/fail', 'enable/disable', 'start/stop',
      'open/close', 'get/set', 'push/pull', 'left/right', 'up/down',
      'in/out', 'and/or', 'either/or', 'import/export', 'PUT/POST',
      'PUT/PATCH', 'CREATE/UPDATE', 'add/remove', 'insert/delete',
      'show/hide', 'expand/collapse', 'min/max', 'first/last',
      'prev/next', 'before/after', 'old/new', 'src/dest',
      'source/target', 'from/to', 'client/server', 'local/remote',
      'dev/prod'
    ];

    for (const pattern of optionPatterns) {
      expect(contexts).not.toContain(pattern);
    }
  });

  test('should still flag legitimate file paths', async () => {
    const testContent = `
# Test File Paths

Look in the src/components directory.
Edit the config/settings.json file.
Open docs/api for more information.
Check the /etc/hosts file.
`;

    const result = await lint({
      strings: {
        'test-content': testContent,
      },
      config: {
        default: false,
        'backtick-code-elements': true,
      },
      customRules: [backtickCodeElements],
    });

    const violations = result['test-content'] || [];
    
    // We expect multiple violations for legitimate paths
    expect(violations.length).toBeGreaterThan(0);
    
    // Verify some expected paths are flagged
    const contexts = violations.map(v => v.errorContext);
    expect(contexts).toContain('src/components');
    expect(contexts).toContain('docs/api');
  });
});
