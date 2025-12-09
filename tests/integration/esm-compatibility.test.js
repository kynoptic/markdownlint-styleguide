/**
 * @integration
 * Integration tests for native ESM support without Babel transpilation.
 * These tests verify that the package can be imported and used directly
 * from source as ES modules by markdownlint-cli2 and other consumers.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const TEST_DIR = path.join(__dirname, '../tmp/esm-compat');

describe('Native ESM compatibility', () => {
  beforeAll(() => {
    fs.mkdirSync(TEST_DIR, { recursive: true });
  });

  afterAll(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  test('test_should_import_rules_when_using_native_esm', async () => {
    // Direct import from source should work
    const allRules = await import(path.join(PROJECT_ROOT, 'src/index.js'));
    
    expect(allRules.default).toBeDefined();
    expect(Array.isArray(allRules.default)).toBe(true);
    expect(allRules.default.length).toBe(5);
    
    // Verify each rule has the expected structure
    allRules.default.forEach(rule => {
      expect(rule).toHaveProperty('names');
      expect(rule).toHaveProperty('description');
      expect(rule).toHaveProperty('tags');
      expect(rule).toHaveProperty('function');
      expect(typeof rule.function).toBe('function');
    });
  });

  test('test_should_load_rules_when_used_by_markdownlint_cli2', async () => {
    // Create a test markdown file with violations
    const testFile = path.join(TEST_DIR, 'test.md');
    fs.writeFileSync(testFile, '# This Is Title Case Heading\n\nTest bare URL: https://example.com\n');

    // Create a config file that references our package via relative path
    const configFile = path.join(TEST_DIR, '.markdownlint-cli2.jsonc');
    const configContent = {
      customRules: [
        path.join(PROJECT_ROOT, 'src/index.js')
      ],
      config: {
        'sentence-case-heading': true,
        'no-bare-url': true
      }
    };
    fs.writeFileSync(configFile, JSON.stringify(configContent, null, 2));

    // Run markdownlint-cli2
    let output;
    let exitCode;
    try {
      output = execSync(
        `npx markdownlint-cli2 --config "${configFile}" "${testFile}"`,
        { 
          cwd: TEST_DIR, 
          encoding: 'utf-8',
          stdio: 'pipe'
        }
      );
      exitCode = 0;
    } catch (error) {
      output = error.stdout + error.stderr;
      exitCode = error.status;
    }

    // Should detect violations (non-zero exit code)
    expect(exitCode).not.toBe(0);
    expect(output).toContain('sentence-case-heading');
    expect(output).toContain('no-bare-url');
  });

  test('test_should_work_when_imported_via_package_main', async () => {
    // Test that package.json main entry point works
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf-8')
    );

    const mainPath = path.join(PROJECT_ROOT, packageJson.main);
    expect(fs.existsSync(mainPath)).toBe(true);
    
    // Import via the main entry point
    const rules = await import(mainPath);
    expect(rules.default).toBeDefined();
    expect(Array.isArray(rules.default)).toBe(true);
    expect(rules.default.length).toBe(5);
  });

  test('test_should_work_when_imported_by_rule_name', async () => {
    // Test importing individual rules
    const sentenceCaseRule = await import(path.join(PROJECT_ROOT, 'src/rules/sentence-case-heading.js'));
    expect(sentenceCaseRule.default).toBeDefined();
    expect(sentenceCaseRule.default.names).toContain('sentence-case-heading');

    const backtickRule = await import(path.join(PROJECT_ROOT, 'src/rules/backtick-code-elements.js'));
    expect(backtickRule.default).toBeDefined();
    expect(backtickRule.default.names).toContain('backtick-code-elements');
  });

  test('test_should_not_require_build_step_when_tests_run', async () => {
    // Verify no .cjs files are required for tests to pass
    const srcDir = path.join(PROJECT_ROOT, 'src');
    const files = fs.readdirSync(srcDir, { recursive: true })
      .filter(f => typeof f === 'string');

    const cjsFiles = files.filter(f => f.endsWith('.cjs'));
    expect(cjsFiles.length).toBe(0);
  });

  test('test_should_support_package_exports_field_when_defined', async () => {
    // Verify package.json has proper exports configuration
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf-8')
    );

    // Should have exports field for modern resolution
    expect(packageJson.exports).toBeDefined();
    expect(packageJson.exports['.']).toBeDefined();
    expect(packageJson.exports['./package.json']).toBeDefined();
    expect(packageJson.exports['.']).toBe('./src/index.js');
  });

  test('test_should_point_to_esm_source_not_cjs_build', async () => {
    // Verify package.json main points to source, not build output
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf-8')
    );

    // Main entry should be .js (ESM), not .cjs (CommonJS)
    expect(packageJson.main).toMatch(/\.js$/);
    expect(packageJson.main).not.toMatch(/\.cjs$/);

    // Main should point to src/, not .markdownlint-rules/
    expect(packageJson.main).toContain('src/');
    expect(packageJson.main).not.toContain('.markdownlint-rules/');
  });
});

describe('Backward compatibility', () => {
  test('test_should_document_cjs_consumer_behavior_when_using_dynamic_import', async () => {
    // Document expected behavior for CommonJS consumers
    // Since this is an ESM package, CJS consumers should use dynamic import()
    // rather than require(), which would fail or return a wrapper object

    const PROJECT_ROOT_LOCAL = path.resolve(__dirname, '../..');
    const mainPath = path.join(PROJECT_ROOT_LOCAL, 'src/index.js');

    // Dynamic import from test context (simulates CJS consumer using import())
    const rules = await import(mainPath);

    // CJS consumers using dynamic import get the module with .default property
    expect(rules.default).toBeDefined();
    expect(Array.isArray(rules.default)).toBe(true);
    expect(rules.default.length).toBe(5);

    // Document the correct pattern for CJS consumers:
    // const rules = await import('markdownlint-trap');
    // const allRules = rules.default;
    //
    // Or using .then():
    // import('markdownlint-trap').then(mod => {
    //   const allRules = mod.default;
    // });
  });

  test('test_should_maintain_rule_api_when_exported', async () => {
    const allRules = await import(path.join(PROJECT_ROOT, 'src/index.js'));
    
    // Verify the API shape hasn't changed
    const expectedRuleNames = [
      'backtick-code-elements',
      'sentence-case-heading',
      'no-bare-url',
      'no-dead-internal-links',
      'no-literal-ampersand'
    ];
    
    const actualRuleNames = allRules.default.flatMap(rule => rule.names);
    
    expectedRuleNames.forEach(name => {
      expect(actualRuleNames).toContain(name);
    });
  });

  test('test_should_work_with_markdownlint_programmatic_api', async () => {
    const { lint } = await import('markdownlint/promise');
    const MarkdownIt = (await import('markdown-it')).default;
    const allRules = await import(path.join(PROJECT_ROOT, 'src/index.js'));

    const testContent = '# This Is Title Case\n';
    const options = {
      strings: {
        'test': testContent
      },
      customRules: allRules.default,
      markdownItFactory: () => new MarkdownIt(),
      config: {
        'sentence-case-heading': true
      }
    };

    const result = await lint(options);
    expect(result.test).toBeDefined();
    expect(result.test.length).toBeGreaterThan(0);
    expect(result.test[0].ruleNames).toContain('sentence-case-heading');
  });
});
