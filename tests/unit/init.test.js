/**
 * @fileoverview Unit tests for init.cjs setup wizard
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { parse as parseJsonc } from 'jsonc-parser';

const scriptPath = path.resolve('./scripts/init.cjs');
const cliPath = path.resolve('./scripts/cli.cjs');

describe('cli.cjs', () => {
  let tempDir;

  beforeEach(() => {
    const timestamp = new Date().getTime();
    tempDir = path.join(process.cwd(), 'tests', 'tmp', 'cli-test-' + timestamp);
    fs.mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('subcommand routing', () => {
    it('should run init by default when no subcommand given', () => {
      const output = execSync('node ' + cliPath + ' --preset recommended --dry-run', {
        encoding: 'utf8',
        cwd: tempDir,
      });

      expect(output).toContain('markdownlint-trap setup wizard');
    });

    it('should run init when init subcommand given', () => {
      const output = execSync('node ' + cliPath + ' init --preset recommended --dry-run', {
        encoding: 'utf8',
        cwd: tempDir,
      });

      expect(output).toContain('markdownlint-trap setup wizard');
    });

    it('should run doctor when doctor subcommand given', () => {
      const output = execSync('node ' + cliPath + ' doctor', {
        encoding: 'utf8',
        cwd: tempDir,
      });

      expect(output).toContain('markdownlint-trap diagnostics');
    });

    it('should show help with --help flag', () => {
      const output = execSync('node ' + cliPath + ' --help', {
        encoding: 'utf8',
        cwd: tempDir,
      });

      expect(output).toContain('markdownlint-trap');
      expect(output).toContain('init');
      expect(output).toContain('doctor');
    });
  });
});

describe('init.cjs', () => {
  let tempDir;

  beforeEach(() => {
    // Create temp directory for testing
    const timestamp = new Date().getTime();
    tempDir = path.join(process.cwd(), 'tests', 'tmp', 'init-test-' + timestamp);
    fs.mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('help flag', () => {
    it('should display help message with --help flag', () => {
      const output = execSync('node ' + scriptPath + ' --help', {
        encoding: 'utf8',
        cwd: tempDir,
      });

      expect(output).toContain('markdownlint-trap init');
      expect(output).toContain('Usage:');
      expect(output).toContain('--preset');
      expect(output).toContain('--vscode');
      expect(output).toContain('--cli');
      expect(output).toContain('--force');
      expect(output).toContain('--dry-run');
    });
  });

  describe('dry-run mode', () => {
    it('should not create files in dry-run mode with --preset', () => {
      const output = execSync('node ' + scriptPath + ' --preset recommended --dry-run', {
        encoding: 'utf8',
        cwd: tempDir,
      });

      expect(output).toContain('[DRY RUN MODE');
      expect(output).toContain('Would write');
      expect(output).toContain('Run without --dry-run to apply changes');

      // Verify no files were created
      const cliConfig = path.join(tempDir, '.markdownlint-cli2.jsonc');
      const vscodeConfig = path.join(tempDir, '.vscode', 'settings.json');
      expect(fs.existsSync(cliConfig)).toBe(false);
      expect(fs.existsSync(vscodeConfig)).toBe(false);
    });
  });

  describe('preset selection', () => {
    it('should create CLI config with basic preset', () => {
      execSync('node ' + scriptPath + ' --preset basic --cli', {
        cwd: tempDir,
      });

      const cliConfig = path.join(tempDir, '.markdownlint-cli2.jsonc');
      expect(fs.existsSync(cliConfig)).toBe(true);

      const content = fs.readFileSync(cliConfig, 'utf8');
      expect(content).toContain('Basic configuration');
      expect(content).toContain('sentence-case-heading');
      expect(content).toContain('backtick-code-elements');
    });

    it('should create CLI config with recommended preset', () => {
      execSync('node ' + scriptPath + ' --preset recommended --cli', {
        cwd: tempDir,
      });

      const cliConfig = path.join(tempDir, '.markdownlint-cli2.jsonc');
      expect(fs.existsSync(cliConfig)).toBe(true);

      const content = fs.readFileSync(cliConfig, 'utf8');
      expect(content).toContain('Recommended configuration');
      expect(content).toContain('sentence-case-heading');
      expect(content).toContain('no-bare-url');
      expect(content).toContain('no-dead-internal-links');
    });

    it('should create CLI config with strict preset', () => {
      execSync('node ' + scriptPath + ' --preset strict --cli', {
        cwd: tempDir,
      });

      const cliConfig = path.join(tempDir, '.markdownlint-cli2.jsonc');
      expect(fs.existsSync(cliConfig)).toBe(true);

      const content = fs.readFileSync(cliConfig, 'utf8');
      expect(content).toContain('Strict configuration');
      expect(content).toContain('"default": true');
      expect(content).toContain('sentence-case-heading');
    });
  });

  describe('configuration file creation', () => {
    it('should create both CLI and VS Code configs by default', () => {
      execSync('node ' + scriptPath + ' --preset recommended', {
        cwd: tempDir,
      });

      const cliConfig = path.join(tempDir, '.markdownlint-cli2.jsonc');
      const vscodeConfig = path.join(tempDir, '.vscode', 'settings.json');

      expect(fs.existsSync(cliConfig)).toBe(true);
      expect(fs.existsSync(vscodeConfig)).toBe(true);
    });

    it('should create only CLI config with --cli flag', () => {
      execSync('node ' + scriptPath + ' --preset recommended --cli', {
        cwd: tempDir,
      });

      const cliConfig = path.join(tempDir, '.markdownlint-cli2.jsonc');
      const vscodeConfig = path.join(tempDir, '.vscode', 'settings.json');

      expect(fs.existsSync(cliConfig)).toBe(true);
      expect(fs.existsSync(vscodeConfig)).toBe(false);
    });

    it('should create only VS Code config with --vscode flag', () => {
      execSync('node ' + scriptPath + ' --preset recommended --vscode', {
        cwd: tempDir,
      });

      const cliConfig = path.join(tempDir, '.markdownlint-cli2.jsonc');
      const vscodeConfig = path.join(tempDir, '.vscode', 'settings.json');

      expect(fs.existsSync(cliConfig)).toBe(false);
      expect(fs.existsSync(vscodeConfig)).toBe(true);
    });
  });

  describe('existing file handling', () => {
    it('should skip existing files without --force flag', () => {
      const cliConfig = path.join(tempDir, '.markdownlint-cli2.jsonc');
      fs.writeFileSync(cliConfig, '{"existing": true}', 'utf8');

      const output = execSync('node ' + scriptPath + ' --preset basic --cli', {
        encoding: 'utf8',
        cwd: tempDir,
      });

      expect(output).toContain('File exists, skipping');

      const content = fs.readFileSync(cliConfig, 'utf8');
      expect(content).toContain('"existing": true');
    });

    it('should overwrite existing files with --force flag', () => {
      const cliConfig = path.join(tempDir, '.markdownlint-cli2.jsonc');
      fs.writeFileSync(cliConfig, '{"existing": true}', 'utf8');

      execSync('node ' + scriptPath + ' --preset basic --cli --force', {
        cwd: tempDir,
      });

      const content = fs.readFileSync(cliConfig, 'utf8');
      expect(content).not.toContain('"existing": true');
      expect(content).toContain('Basic configuration');
      expect(content).toContain('sentence-case-heading');
    });

    it('should merge VS Code settings with existing file', () => {
      const vscodeDir = path.join(tempDir, '.vscode');
      const vscodeConfig = path.join(vscodeDir, 'settings.json');
      fs.mkdirSync(vscodeDir, { recursive: true });
      fs.writeFileSync(
        vscodeConfig,
        JSON.stringify({ 'editor.formatOnSave': true }, null, 2),
        'utf8'
      );

      execSync('node ' + scriptPath + ' --preset basic --vscode', {
        cwd: tempDir,
      });

      const content = parseJsonc(fs.readFileSync(vscodeConfig, 'utf8'));
      expect(content['editor.formatOnSave']).toBe(true);
      expect(content['markdownlint.customRules']).toBeDefined();
    });
  });

  describe('output formatting', () => {
    it('should show success message after completion', () => {
      const output = execSync('node ' + scriptPath + ' --preset basic --cli', {
        encoding: 'utf8',
        cwd: tempDir,
      });

      expect(output).toContain('Setup complete!');
      expect(output).toContain('Files created:');
      expect(output).toContain('Next steps:');
    });

    it('should provide helpful next steps', () => {
      const output = execSync('node ' + scriptPath + ' --preset recommended', {
        encoding: 'utf8',
        cwd: tempDir,
      });

      expect(output).toContain('Install dependencies');
      expect(output).toContain('Lint your markdown');
      expect(output).toContain('Enable auto-fix');
    });

    it('should show GitHub-based installation instructions', () => {
      const output = execSync('node ' + scriptPath + ' --preset recommended', {
        encoding: 'utf8',
        cwd: tempDir,
      });

      // Should mention GitHub installation since not published to npm yet
      expect(output).toContain('github:');
    });
  });

  describe('--all flag', () => {
    it('should enable all optional features with --all flag', () => {
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify({ name: 'test-project', scripts: {} }, null, 2),
        'utf8'
      );

      const output = execSync('node ' + scriptPath + ' --preset recommended --all', {
        encoding: 'utf8',
        cwd: tempDir,
      });

      // Should configure all features
      expect(output).toContain('GitHub Actions');
      expect(output).toContain('npm scripts');
      expect(output).toContain('pre-commit hooks');
    });

    it('should create all config files with --all flag', () => {
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify({ name: 'test-project', scripts: {} }, null, 2),
        'utf8'
      );

      execSync('node ' + scriptPath + ' --preset recommended --all', {
        encoding: 'utf8',
        cwd: tempDir,
      });

      // Verify all files created
      expect(fs.existsSync(path.join(tempDir, '.markdownlint-cli2.jsonc'))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, '.vscode', 'settings.json'))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, '.vscode', 'extensions.json'))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, '.github', 'workflows', 'markdown-lint.yml'))).toBe(true);

      // Verify package.json has scripts and lint-staged
      const pkg = JSON.parse(fs.readFileSync(path.join(tempDir, 'package.json'), 'utf8'));
      expect(pkg.scripts['lint:md']).toBeDefined();
      expect(pkg['lint-staged']).toBeDefined();
    });

    it('should mention --all flag in help output', () => {
      const output = execSync('node ' + scriptPath + ' --help', {
        encoding: 'utf8',
        cwd: tempDir,
      });

      expect(output).toContain('--all');
    });
  });

  describe('--upgrade flag', () => {
    it('should merge new config options while preserving existing customizations', () => {
      // Create existing config with custom settings
      const existingConfig = {
        customRules: ['markdownlint-trap'],
        config: {
          'sentence-case-heading': {
            specialTerms: ['MyCustomTerm', 'AnotherTerm']
          },
          'backtick-code-elements': true
        }
      };
      fs.writeFileSync(
        path.join(tempDir, '.markdownlint-cli2.jsonc'),
        JSON.stringify(existingConfig, null, 2),
        'utf8'
      );

      execSync('node ' + scriptPath + ' --preset recommended --upgrade', {
        encoding: 'utf8',
        cwd: tempDir,
      });

      const updatedConfig = JSON.parse(
        fs.readFileSync(path.join(tempDir, '.markdownlint-cli2.jsonc'), 'utf8')
          .replace(/\/\/.*$/gm, '')
          .replace(/\/\*[\s\S]*?\*\//g, '')
      );

      // Should preserve custom specialTerms
      expect(updatedConfig.config['sentence-case-heading'].specialTerms).toContain('MyCustomTerm');
      expect(updatedConfig.config['sentence-case-heading'].specialTerms).toContain('AnotherTerm');

      // Should add new rules that weren't in original
      expect(updatedConfig.config['no-bare-url']).toBeDefined();
      expect(updatedConfig.config['no-dead-internal-links']).toBeDefined();
    });

    it('should add new scripts without overwriting existing ones', () => {
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          name: 'test-project',
          scripts: {
            'lint:md': 'my-custom-lint-command',
            'test': 'jest'
          }
        }, null, 2),
        'utf8'
      );

      execSync('node ' + scriptPath + ' --preset recommended --upgrade --scripts', {
        encoding: 'utf8',
        cwd: tempDir,
      });

      const pkg = JSON.parse(fs.readFileSync(path.join(tempDir, 'package.json'), 'utf8'));

      // Should preserve existing custom script
      expect(pkg.scripts['lint:md']).toBe('my-custom-lint-command');

      // Should add new script that didn't exist
      expect(pkg.scripts['lint:md:fix']).toBeDefined();
    });

    it('should show what was upgraded in output', () => {
      // Create minimal existing config
      fs.writeFileSync(
        path.join(tempDir, '.markdownlint-cli2.jsonc'),
        JSON.stringify({ config: { 'sentence-case-heading': true } }, null, 2),
        'utf8'
      );

      const output = execSync('node ' + scriptPath + ' --preset recommended --upgrade', {
        encoding: 'utf8',
        cwd: tempDir,
      });

      expect(output).toContain('Upgrading');
      expect(output).toMatch(/added|merged|new/i);
    });

    it('should mention --upgrade flag in help output', () => {
      const output = execSync('node ' + scriptPath + ' --help', {
        encoding: 'utf8',
        cwd: tempDir,
      });

      expect(output).toContain('--upgrade');
    });
  });

  describe('dependency detection', () => {
    it('should check if markdownlint-cli2 is installed after setup', () => {
      const output = execSync('node ' + scriptPath + ' --preset recommended', {
        encoding: 'utf8',
        cwd: tempDir,
      });

      // Should show dependency check section
      expect(output).toContain('Checking dependencies');
    });

    it('should show warning when markdownlint-cli2 is not installed', () => {
      // Run from temp dir where markdownlint-cli2 is not available
      const output = execSync('node ' + scriptPath + ' --preset recommended', {
        encoding: 'utf8',
        cwd: tempDir,
      });

      // Should warn about missing dependency
      expect(output).toContain('markdownlint-cli2');
      expect(output).toMatch(/not found|not installed|missing/i);
    });

    it('should show success when markdownlint-cli2 is installed', () => {
      // Run from project root where markdownlint-cli2 is available
      const output = execSync('node ' + scriptPath + ' --preset recommended --dry-run', {
        encoding: 'utf8',
        cwd: process.cwd(),
      });

      expect(output).toContain('markdownlint-cli2');
      expect(output).toMatch(/installed|found|✓/i);
    });

    it('should suggest doctor command for troubleshooting', () => {
      const output = execSync('node ' + scriptPath + ' --preset recommended', {
        encoding: 'utf8',
        cwd: tempDir,
      });

      expect(output).toMatch(/doctor|diagnos/i);
    });
  });

  describe('VS Code extension recommendations', () => {
    it('should create extensions.json when configuring VS Code', () => {
      execSync('node ' + scriptPath + ' --preset recommended --vscode', {
        encoding: 'utf8',
        cwd: tempDir,
      });

      const extensionsPath = path.join(tempDir, '.vscode', 'extensions.json');
      expect(fs.existsSync(extensionsPath)).toBe(true);

      const content = JSON.parse(fs.readFileSync(extensionsPath, 'utf8'));
      expect(content.recommendations).toContain('DavidAnson.vscode-markdownlint');
    });

    it('should merge with existing extensions.json', () => {
      const vscodeDir = path.join(tempDir, '.vscode');
      fs.mkdirSync(vscodeDir, { recursive: true });
      fs.writeFileSync(
        path.join(vscodeDir, 'extensions.json'),
        JSON.stringify({ recommendations: ['esbenp.prettier-vscode'] }, null, 2),
        'utf8'
      );

      execSync('node ' + scriptPath + ' --preset recommended --vscode', {
        encoding: 'utf8',
        cwd: tempDir,
      });

      const content = JSON.parse(fs.readFileSync(path.join(vscodeDir, 'extensions.json'), 'utf8'));
      expect(content.recommendations).toContain('esbenp.prettier-vscode');
      expect(content.recommendations).toContain('DavidAnson.vscode-markdownlint');
    });

    it('should not duplicate existing extension recommendations', () => {
      const vscodeDir = path.join(tempDir, '.vscode');
      fs.mkdirSync(vscodeDir, { recursive: true });
      fs.writeFileSync(
        path.join(vscodeDir, 'extensions.json'),
        JSON.stringify({ recommendations: ['DavidAnson.vscode-markdownlint'] }, null, 2),
        'utf8'
      );

      execSync('node ' + scriptPath + ' --preset recommended --vscode', {
        encoding: 'utf8',
        cwd: tempDir,
      });

      const content = JSON.parse(fs.readFileSync(path.join(vscodeDir, 'extensions.json'), 'utf8'));
      const count = content.recommendations.filter(r => r === 'DavidAnson.vscode-markdownlint').length;
      expect(count).toBe(1);
    });
  });

  describe('GitHub Actions workflow', () => {
    it('should create workflow when --github-action flag is used', () => {
      execSync('node ' + scriptPath + ' --preset recommended --github-action', {
        encoding: 'utf8',
        cwd: tempDir,
      });

      const workflowPath = path.join(tempDir, '.github', 'workflows', 'markdown-lint.yml');
      expect(fs.existsSync(workflowPath)).toBe(true);

      const content = fs.readFileSync(workflowPath, 'utf8');
      expect(content).toContain('markdownlint');
      expect(content).toContain('npm');
    });

    it('should not overwrite existing workflow without --force', () => {
      const workflowDir = path.join(tempDir, '.github', 'workflows');
      fs.mkdirSync(workflowDir, { recursive: true });
      fs.writeFileSync(
        path.join(workflowDir, 'markdown-lint.yml'),
        'existing: content',
        'utf8'
      );

      const output = execSync('node ' + scriptPath + ' --preset recommended --github-action', {
        encoding: 'utf8',
        cwd: tempDir,
      });

      expect(output).toContain('File exists, skipping');
      const content = fs.readFileSync(path.join(workflowDir, 'markdown-lint.yml'), 'utf8');
      expect(content).toBe('existing: content');
    });
  });

  describe('npm scripts injection', () => {
    it('should add lint scripts when --scripts flag is used', () => {
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify({ name: 'test-project', scripts: {} }, null, 2),
        'utf8'
      );

      execSync('node ' + scriptPath + ' --preset recommended --scripts', {
        encoding: 'utf8',
        cwd: tempDir,
      });

      const pkg = JSON.parse(fs.readFileSync(path.join(tempDir, 'package.json'), 'utf8'));
      expect(pkg.scripts['lint:md']).toBeDefined();
      expect(pkg.scripts['lint:md:fix']).toBeDefined();
    });

    it('should not overwrite existing lint scripts without --force', () => {
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          name: 'test-project',
          scripts: { 'lint:md': 'custom command' }
        }, null, 2),
        'utf8'
      );

      const output = execSync('node ' + scriptPath + ' --preset recommended --scripts', {
        encoding: 'utf8',
        cwd: tempDir,
      });

      expect(output).toContain('already exists');
      const pkg = JSON.parse(fs.readFileSync(path.join(tempDir, 'package.json'), 'utf8'));
      expect(pkg.scripts['lint:md']).toBe('custom command');
    });

    it('should skip scripts if no package.json exists', () => {
      const output = execSync('node ' + scriptPath + ' --preset recommended --scripts', {
        encoding: 'utf8',
        cwd: tempDir,
      });

      expect(output).toContain('package.json not found');
    });
  });

  describe('pre-commit hook setup', () => {
    it('should configure lint-staged when --hooks flag is used', () => {
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify({ name: 'test-project' }, null, 2),
        'utf8'
      );

      execSync('node ' + scriptPath + ' --preset recommended --hooks', {
        encoding: 'utf8',
        cwd: tempDir,
      });

      const pkg = JSON.parse(fs.readFileSync(path.join(tempDir, 'package.json'), 'utf8'));
      expect(pkg['lint-staged']).toBeDefined();
      expect(pkg['lint-staged']['*.md']).toBeDefined();
    });

    it('should merge with existing lint-staged config', () => {
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          name: 'test-project',
          'lint-staged': { '*.js': ['eslint --fix'] }
        }, null, 2),
        'utf8'
      );

      execSync('node ' + scriptPath + ' --preset recommended --hooks', {
        encoding: 'utf8',
        cwd: tempDir,
      });

      const pkg = JSON.parse(fs.readFileSync(path.join(tempDir, 'package.json'), 'utf8'));
      expect(pkg['lint-staged']['*.js']).toEqual(['eslint --fix']);
      expect(pkg['lint-staged']['*.md']).toBeDefined();
    });
  });

  describe('config validation', () => {
    it('should validate config after creation', () => {
      const output = execSync('node ' + scriptPath + ' --preset recommended', {
        encoding: 'utf8',
        cwd: tempDir,
      });

      expect(output).toContain('Validating');
    });

    it('should report validation success', () => {
      const output = execSync('node ' + scriptPath + ' --preset recommended', {
        encoding: 'utf8',
        cwd: tempDir,
      });

      expect(output).toMatch(/valid|✓/i);
    });
  });

  describe('merge diff display', () => {
    it('should show what settings were preserved when merging', () => {
      const vscodeDir = path.join(tempDir, '.vscode');
      fs.mkdirSync(vscodeDir, { recursive: true });
      fs.writeFileSync(
        path.join(vscodeDir, 'settings.json'),
        JSON.stringify({ 'editor.formatOnSave': true }, null, 2),
        'utf8'
      );

      const output = execSync('node ' + scriptPath + ' --preset recommended --vscode', {
        encoding: 'utf8',
        cwd: tempDir,
      });

      expect(output).toContain('Preserved');
      expect(output).toContain('editor.formatOnSave');
    });
  });
});
