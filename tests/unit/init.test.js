/**
 * @fileoverview Unit tests for init.cjs setup wizard
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const scriptPath = path.resolve('./scripts/init.cjs');

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

      const content = JSON.parse(fs.readFileSync(vscodeConfig, 'utf8'));
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

      expect(output).toContain('Install markdownlint-cli2');
      expect(output).toContain('Lint your markdown');
      expect(output).toContain('Enable auto-fix');
    });
  });
});
